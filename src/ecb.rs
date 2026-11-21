//! European Central Bank reference exchange rates (EUR based)

use std::collections::BTreeMap;
use std::time::Duration;

use anyhow::Context;

pub const ENDPOINT: &str = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

#[derive(Debug, Clone)]
pub struct Rates {
    /// `YYYY-MM-DD` as published by ECB
    pub date: String,
    pub entries: BTreeMap<String, f64>,
}

pub fn parse(xml_doc: &str) -> anyhow::Result<Rates> {
    let root = crate::xml::parse(xml_doc)?;
    let outer = root.child("Cube").context("missing Cube")?;
    let day = outer.child("Cube").context("missing dated Cube")?;
    let date = day.attr("time").context("missing time")?.to_string();
    let mut entries = BTreeMap::new();
    for c in day.children("Cube") {
        if let (Some(cur), Some(rate)) = (
            c.attr("currency"),
            c.attr("rate").and_then(|r| r.parse::<f64>().ok()),
        ) {
            entries.insert(cur.to_string(), rate);
        }
    }
    anyhow::ensure!(!entries.is_empty(), "no rates in ECB response");
    Ok(Rates { date, entries })
}

pub async fn fetch() -> anyhow::Result<Rates> {
    let url = std::env::var("SPOTWEB_ECB_ENDPOINT").unwrap_or_else(|_| ENDPOINT.to_string());
    let body = reqwest::Client::builder()
        .user_agent(concat!("spotweb/", env!("CARGO_PKG_VERSION")))
        .timeout(Duration::from_secs(30))
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
        assert_eq!(r.date, "2024-05-02");
        assert_eq!(r.entries["SEK"], 11.6025);
    }
}
