//! European Central Bank reference exchange rates (EUR based)

use std::collections::BTreeMap;
use std::time::Duration;

use anyhow::Context;

/// The last 90 days. Also fills holes from days when the job did not run.
pub const ENDPOINT: &str = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml";
/// Every rate since 1999, read when the stored history is incomplete
pub const HISTORY_ENDPOINT: &str = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml";

#[derive(Debug, Clone)]
pub struct Rates {
    /// `YYYY-MM-DD` as published by ECB
    pub date: String,
    pub entries: BTreeMap<String, f64>,
}

/// Every dated set of rates in an ECB file: the daily file has one, the history files one per
/// bank day. Sorted by date, oldest first.
pub fn parse(xml_doc: &str) -> anyhow::Result<Vec<Rates>> {
    let root = crate::xml::parse(xml_doc)?;
    let outer = root.child("Cube").context("missing Cube")?;
    let mut out = Vec::new();
    for day in outer.children("Cube") {
        let Some(date) = day.attr("time") else {
            continue;
        };
        let mut entries = BTreeMap::new();
        for c in day.children("Cube") {
            if let (Some(cur), Some(rate)) = (
                c.attr("currency"),
                c.attr("rate").and_then(|r| r.trim().parse::<f64>().ok()),
            ) {
                if rate.is_finite() && rate > 0.0 {
                    entries.insert(cur.to_string(), rate);
                }
            }
        }
        if !entries.is_empty() {
            out.push(Rates {
                date: date.to_string(),
                entries,
            });
        }
    }
    anyhow::ensure!(!out.is_empty(), "no rates in ECB response");
    out.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(out)
}

/// The last 90 days (`SPOTWEB_ECB_ENDPOINT`)
pub async fn fetch() -> anyhow::Result<Vec<Rates>> {
    let url = std::env::var("SPOTWEB_ECB_ENDPOINT").unwrap_or_else(|_| ENDPOINT.to_string());
    get(&url, 30).await
}

/// All rates since 1999 (`SPOTWEB_ECB_HISTORY_ENDPOINT`), a few MB
pub async fn fetch_history() -> anyhow::Result<Vec<Rates>> {
    let url = std::env::var("SPOTWEB_ECB_HISTORY_ENDPOINT")
        .unwrap_or_else(|_| HISTORY_ENDPOINT.to_string());
    get(&url, 120).await
}

async fn get(url: &str, timeout_secs: u64) -> anyhow::Result<Vec<Rates>> {
    let body = reqwest::Client::builder()
        .user_agent(concat!("spotweb/", env!("CARGO_PKG_VERSION")))
        .timeout(Duration::from_secs(timeout_secs))
        .build()?
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .text()
        .await?;
    parse(&body)
}

#[cfg(test)]
mod tests {
    #[test]
    fn parses_ecb() {
        let doc = r#"<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <gesmes:subject>Reference rates</gesmes:subject>
  <Cube><Cube time="2024-05-02"><Cube currency="USD" rate="1.0702"/><Cube currency="SEK" rate="11.6025"/></Cube></Cube>
</gesmes:Envelope>"#;
        let r = super::parse(doc).unwrap();
        assert_eq!(r.len(), 1);
        assert_eq!(r[0].date, "2024-05-02");
        assert_eq!(r[0].entries["SEK"], 11.6025);
    }

    #[test]
    fn parses_ecb_history() {
        // Newest first, like ECB; HRK only in the older day
        let doc = r#"<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <Cube>
    <Cube time="2023-01-02"><Cube currency="SEK" rate="11.1218"/></Cube>
    <Cube time="2022-12-30"><Cube currency="SEK" rate="11.1218"/><Cube currency="HRK" rate="7.5365"/><Cube currency="XXX" rate="N/A"/></Cube>
  </Cube>
</gesmes:Envelope>"#;
        let r = super::parse(doc).unwrap();
        assert_eq!(r.len(), 2);
        assert_eq!(r[0].date, "2022-12-30");
        assert_eq!(r[0].entries.len(), 2);
        assert_eq!(r[1].date, "2023-01-02");
        assert!(!r[1].entries.contains_key("HRK"));
    }
}
