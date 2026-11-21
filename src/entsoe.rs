//! Minimal ENTSO-e Transparency Platform REST client.
//! <https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html>

use std::io::Read;
use std::time::Duration;

use anyhow::{bail, Context};
use chrono::{DateTime, NaiveDate, NaiveDateTime, TimeZone, Utc};

use crate::db::queries::NewOutage;
use crate::timeutil::interval_ms;
use crate::xml::{self, Element};

pub const ENDPOINT: &str = "https://web-api.tp.entsoe.eu/api";

#[derive(Clone)]
pub struct Client {
    http: reqwest::Client,
    token: String,
    endpoint: String,
}

/// One value at a point in time
#[derive(Debug, Clone, PartialEq)]
pub struct Point {
    pub start: i64,
    pub interval: String,
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct GenerationPoint {
    pub start: i64,
    pub interval: String,
    pub psr: String,
    pub consumption: bool,
    pub value: f64,
}

fn fmt_time(t: DateTime<Utc>) -> String {
    t.format("%Y%m%d%H%M").to_string()
}

fn parse_time(s: &str) -> Option<i64> {
    let s = s.trim();
    if let Ok(dt) = DateTime::parse_from_rfc3339(s) {
        return Some(dt.timestamp_millis());
    }
    let s = s.trim_end_matches('Z');
    NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M")
        .or_else(|_| NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S"))
        .ok()
        .map(|n| Utc.from_utc_datetime(&n).timestamp_millis())
}

/// Expand a `<Period>` to `(start, value)` points. Handles curve type A03
/// (variable sized blocks, omitted points repeat the previous value).
fn period_points(
    period: &Element,
    value_tag: &str,
    curve_type: Option<&str>,
) -> Option<(String, Vec<(i64, f64)>)> {
    let ti = period.child("timeInterval")?;
    let start = parse_time(ti.text_of("start")?)?;
    let end = parse_time(ti.text_of("end")?)?;
    let resolution = period.text_of("resolution")?.to_string();
    let step = interval_ms(&resolution);
    let mut points: Vec<(i64, f64)> = period
        .children("Point")
        .filter_map(|p| {
            let pos: i64 = p.text_of("position")?.parse().ok()?;
            let val: f64 = p.text_of(value_tag)?.parse().ok()?;
            Some((pos, val))
        })
        .collect();
    points.sort_by_key(|p| p.0);
    let expected = ((end - start) + step - 1) / step;
    let mut out = Vec::with_capacity(expected.max(0) as usize);
    if curve_type == Some("A03") && (points.len() as i64) < expected {
        let mut it = points.iter().peekable();
        let mut current: Option<f64> = None;
        for pos in 1..=expected {
            while let Some(&&(p, v)) = it.peek() {
                if p <= pos {
                    if p == pos {
                        current = Some(v);
                    }
                    it.next();
                } else {
                    break;
                }
            }
            if let Some(v) = current {
                out.push((start + (pos - 1) * step, v));
            }
        }
    } else {
        for (pos, v) in points {
            let t = start + (pos - 1) * step;
            if t < end {
                out.push((t, v));
            }
        }
    }
    Some((resolution, out))
}

fn check_acknowledgement(root: &Element) -> anyhow::Result<bool> {
    if root.name == "Acknowledgement_MarketDocument" {
        let code = root.path(&["Reason", "code"]).unwrap_or("");
        let text = root.path(&["Reason", "text"]).unwrap_or("");
        // 999 = no matching data
        if code == "999" {
            return Ok(false);
        }
        bail!("ENTSO-e request failed: {code} {text}");
    }
    Ok(true)
}

pub fn parse_prices(xml_doc: &str) -> anyhow::Result<Vec<Point>> {
    let root = xml::parse(xml_doc)?;
    if !check_acknowledgement(&root)? {
        return Ok(vec![]);
    }
    if root.name != "Publication_MarketDocument" {
        bail!("expected Publication_MarketDocument, got {}", root.name);
    }
    let mut out = vec![];
    for ts in root.children("TimeSeries") {
        let curve = ts.text_of("curveType");
        for period in ts.children("Period") {
            if let Some((res, pts)) = period_points(period, "price.amount", curve) {
                out.extend(pts.into_iter().map(|(t, v)| Point {
                    start: t,
                    interval: res.clone(),
                    value: v,
                }));
            }
        }
    }
    Ok(out)
}

pub fn parse_generation(xml_doc: &str) -> anyhow::Result<Vec<GenerationPoint>> {
    let root = xml::parse(xml_doc)?;
    if !check_acknowledgement(&root)? {
        return Ok(vec![]);
    }
    if root.name != "GL_MarketDocument" {
        bail!("expected GL_MarketDocument, got {}", root.name);
    }
    let mut out = vec![];
    for ts in root.children("TimeSeries") {
        let psr = ts
            .path(&["MktPSRType", "psrType"])
            .unwrap_or("")
            .to_string();
        let consumption = ts.child("outBiddingZone_Domain.mRID").is_some();
        let curve = ts.text_of("curveType");
        for period in ts.children("Period") {
            if let Some((res, pts)) = period_points(period, "quantity", curve) {
                out.extend(pts.into_iter().map(|(t, v)| GenerationPoint {
                    start: t,
                    interval: res.clone(),
                    psr: psr.clone(),
                    consumption,
                    value: v,
                }));
            }
        }
    }
    Ok(out)
}

pub fn parse_load(xml_doc: &str) -> anyhow::Result<Vec<Point>> {
    let root = xml::parse(xml_doc)?;
    if !check_acknowledgement(&root)? {
        return Ok(vec![]);
    }
    if root.name != "GL_MarketDocument" {
        bail!("expected GL_MarketDocument, got {}", root.name);
    }
    let mut out = vec![];
    for ts in root.children("TimeSeries") {
        let curve = ts.text_of("curveType");
        for period in ts.children("Period") {
            if let Some((res, pts)) = period_points(period, "quantity", curve) {
                out.extend(pts.into_iter().map(|(t, v)| Point {
                    start: t,
                    interval: res.clone(),
                    value: v,
                }));
            }
        }
    }
    Ok(out)
}

pub fn business_type_description(code: &str) -> &str {
    match code {
        "A53" => "Planned maintenance",
        "A54" => "Unplanned outage",
        other => other,
    }
}

pub fn psr_type_description(code: &str) -> &str {
    match code {
        "B01" => "Biomass",
        "B02" => "Fossil Brown coal/Lignite",
        "B03" => "Fossil Coal-derived gas",
        "B04" => "Fossil Gas",
        "B05" => "Fossil Hard coal",
        "B06" => "Fossil Oil",
        "B07" => "Fossil Oil shale",
        "B08" => "Fossil Peat",
        "B09" => "Geothermal",
        "B10" => "Hydro Pumped Storage",
        "B11" => "Hydro Run-of-river and poundage",
        "B12" => "Hydro Water Reservoir",
        "B13" => "Marine",
        "B14" => "Nuclear",
        "B15" => "Other renewable",
        "B16" => "Solar",
        "B17" => "Waste",
        "B18" => "Wind Offshore",
        "B19" => "Wind Onshore",
        "B20" => "Other",
        "B25" => "Energy storage",
        other => other,
    }
}

fn outage_time(date: Option<&str>, time: Option<&str>) -> Option<i64> {
    let d = NaiveDate::parse_from_str(date?, "%Y-%m-%d").ok()?;
    let t = time.unwrap_or("00:00:00Z").trim_end_matches('Z');
    let n = NaiveDateTime::parse_from_str(&format!("{d}T{t}"), "%Y-%m-%dT%H:%M:%S")
        .or_else(|_| NaiveDateTime::parse_from_str(&format!("{d}T{t}"), "%Y-%m-%dT%H:%M"))
        .ok()?;
    Some(Utc.from_utc_datetime(&n).timestamp_millis())
}

pub fn parse_unavailability(xml_doc: &str) -> anyhow::Result<Vec<NewOutage>> {
    let root = xml::parse(xml_doc)?;
    if !check_acknowledgement(&root)? {
        return Ok(vec![]);
    }
    if root.name != "Unavailability_MarketDocument" {
        bail!("expected Unavailability_MarketDocument, got {}", root.name);
    }
    let mrid = root.text_of("mRID").unwrap_or_default().to_string();
    let revision = root.text_of("revisionNumber").and_then(|r| r.parse().ok());
    let doc_type = root.text_of("type").map(|t| match t {
        "A80" => "Generation unavailability".to_string(),
        "A77" => "Production unavailability".to_string(),
        o => o.to_string(),
    });
    let mut out = vec![];
    for ts in root.children("TimeSeries") {
        const RES: &str = "production_RegisteredResource";
        let nominal = ts.child(&format!("{RES}.pSRType.powerSystemResources.nominalP"));
        let curve = ts.text_of("curveType");
        let mut availability = vec![];
        for period in ts.children("Available_Period") {
            if let Some((res, pts)) = period_points(period, "quantity", curve) {
                let step = interval_ms(&res);
                // Merge consecutive equal values to keep the table small
                for (t, v) in pts {
                    match availability.last_mut() {
                        Some((_, e, q)) if *e == t && *q == v => *e = t + step,
                        _ => availability.push((t, t + step, v)),
                    }
                }
            }
        }
        out.push(NewOutage {
            mrid: mrid.clone(),
            revision,
            business_type: ts
                .text_of("businessType")
                .map(|b| business_type_description(b).to_string()),
            document_type: doc_type.clone(),
            start_date: outage_time(
                ts.text_of("start_DateAndOrTime.date"),
                ts.text_of("start_DateAndOrTime.time"),
            ),
            end_date: outage_time(
                ts.text_of("end_DateAndOrTime.date"),
                ts.text_of("end_DateAndOrTime.time"),
            ),
            resource_name: ts.text_of(&format!("{RES}.name")).map(str::to_string),
            location: ts
                .text_of(&format!("{RES}.location.name"))
                .map(str::to_string),
            psr_name: ts
                .text_of(&format!("{RES}.pSRType.powerSystemResources.name"))
                .map(str::to_string),
            psr_nominal_power_unit: nominal.and_then(|n| n.attr("unit")).map(str::to_string),
            psr_nominal_power: nominal.and_then(|n| n.text.trim().parse().ok()),
            psr_type: ts
                .text_of(&format!("{RES}.pSRType.psrType"))
                .map(|p| psr_type_description(p).to_string()),
            reason_code: ts.path(&["Reason", "code"]).map(str::to_string),
            reason_text: ts.path(&["Reason", "text"]).map(str::to_string),
            availability,
        });
    }
    Ok(out)
}

impl Client {
    pub fn new(token: String) -> anyhow::Result<Self> {
        let http = reqwest::Client::builder()
            .user_agent(concat!("spotweb/", env!("CARGO_PKG_VERSION")))
            .timeout(Duration::from_secs(120))
            .connect_timeout(Duration::from_secs(20))
            .build()?;
        let endpoint =
            std::env::var("SPOTWEB_ENTSOE_ENDPOINT").unwrap_or_else(|_| ENDPOINT.to_string());
        Ok(Self {
            http,
            token,
            endpoint,
        })
    }

    pub fn has_token(&self) -> bool {
        !self.token.is_empty()
    }

    /// Returns one or more XML documents (zip responses are unpacked)
    async fn query(&self, params: &[(&str, String)]) -> anyhow::Result<Vec<String>> {
        if self.token.is_empty() {
            bail!("no ENTSO-e API token configured (set API_TOKEN)");
        }
        let mut q: Vec<(&str, String)> = vec![("securityToken", self.token.clone())];
        q.extend(params.iter().cloned());
        let res = self
            .http
            .get(&self.endpoint)
            .query(&q)
            .send()
            .await
            .context("ENTSO-e request")?;
        let status = res.status();
        if status == reqwest::StatusCode::UNAUTHORIZED {
            bail!("ENTSO-e: 401 Unauthorized, missing or invalid API token");
        }
        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            bail!("ENTSO-e: 429 rate limited");
        }
        let is_zip = res
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .map(|v| v.contains("zip"))
            .unwrap_or(false);
        let body = res.bytes().await?;
        if is_zip || body.starts_with(b"PK\x03\x04") {
            let mut archive = zip::ZipArchive::new(std::io::Cursor::new(body))?;
            let mut docs = vec![];
            for i in 0..archive.len() {
                let mut f = archive.by_index(i)?;
                if f.is_dir() {
                    continue;
                }
                let mut s = String::new();
                f.read_to_string(&mut s)?;
                docs.push(s);
            }
            Ok(docs)
        } else {
            let text = String::from_utf8_lossy(&body).to_string();
            if !status.is_success() && !text.contains("Acknowledgement_MarketDocument") {
                bail!("ENTSO-e: HTTP {status}");
            }
            Ok(vec![text])
        }
    }

    fn range(start: DateTime<Utc>, end: DateTime<Utc>) -> [(&'static str, String); 2] {
        [
            ("periodStart", fmt_time(start)),
            ("periodEnd", fmt_time(end)),
        ]
    }

    pub async fn day_ahead_prices(
        &self,
        eic: &str,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> anyhow::Result<Vec<Point>> {
        let mut p = vec![
            ("documentType", "A44".to_string()),
            ("in_Domain", eic.to_string()),
            ("out_Domain", eic.to_string()),
        ];
        p.extend(Self::range(start, end));
        let mut out = vec![];
        for doc in self.query(&p).await? {
            out.extend(parse_prices(&doc)?);
        }
        Ok(out)
    }

    pub async fn generation(
        &self,
        eic: &str,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> anyhow::Result<Vec<GenerationPoint>> {
        let mut p = vec![
            ("documentType", "A75".to_string()),
            ("processType", "A16".to_string()),
            ("in_Domain", eic.to_string()),
        ];
        p.extend(Self::range(start, end));
        let mut out = vec![];
        for doc in self.query(&p).await? {
            out.extend(parse_generation(&doc)?);
        }
        Ok(out)
    }

    pub async fn load(
        &self,
        eic: &str,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> anyhow::Result<Vec<Point>> {
        let mut p = vec![
            ("documentType", "A65".to_string()),
            ("processType", "A16".to_string()),
            ("outBiddingZone_Domain", eic.to_string()),
        ];
        p.extend(Self::range(start, end));
        let mut out = vec![];
        for doc in self.query(&p).await? {
            out.extend(parse_load(&doc)?);
        }
        Ok(out)
    }

    /// Generation (A80) and production (A77) unavailability, paginated
    pub async fn outages(
        &self,
        eic: &str,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> anyhow::Result<Vec<NewOutage>> {
        let mut out = vec![];
        for doc_type in ["A80", "A77"] {
            for page in 0..10 {
                let mut p = vec![
                    ("documentType", doc_type.to_string()),
                    ("biddingZone_Domain", eic.to_string()),
                    ("offset", (page * 200).to_string()),
                ];
                p.extend(Self::range(start, end));
                let docs = self.query(&p).await?;
                let n = docs.len();
                for doc in docs {
                    out.extend(parse_unavailability(&doc)?);
                }
                if n < 200 {
                    break;
                }
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
        Ok(out)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const PRICES: &str = r#"<?xml version="1.0" encoding="UTF-8"?>
<Publication_MarketDocument xmlns="urn:iec62325.351:tc57wg16:451-3:publicationdocument:7:3">
  <mRID>abc</mRID>
  <type>A44</type>
  <TimeSeries>
    <mRID>1</mRID>
    <curveType>A03</curveType>
    <Period>
      <timeInterval><start>2025-10-01T22:00Z</start><end>2025-10-01T23:00Z</end></timeInterval>
      <resolution>PT15M</resolution>
      <Point><position>1</position><price.amount>10.5</price.amount></Point>
      <Point><position>3</position><price.amount>0</price.amount></Point>
    </Period>
  </TimeSeries>
</Publication_MarketDocument>"#;

    #[test]
    fn prices_forward_fill_and_zero() {
        let pts = parse_prices(PRICES).unwrap();
        let start = parse_time("2025-10-01T22:00Z").unwrap();
        assert_eq!(pts.len(), 4);
        assert_eq!(
            pts[0],
            Point {
                start,
                interval: "PT15M".into(),
                value: 10.5
            }
        );
        assert_eq!(pts[1].value, 10.5);
        // Zero prices are kept (1.x dropped them)
        assert_eq!(pts[2].value, 0.0);
        assert_eq!(pts[3].value, 0.0);
        assert_eq!(pts[3].start, start + 3 * 900_000);
    }

    #[test]
    fn acknowledgement_no_data() {
        let doc = r#"<Acknowledgement_MarketDocument><Reason><code>999</code><text>No matching data found</text></Reason></Acknowledgement_MarketDocument>"#;
        assert!(parse_prices(doc).unwrap().is_empty());
        let doc = r#"<Acknowledgement_MarketDocument><Reason><code>401</code><text>bad</text></Reason></Acknowledgement_MarketDocument>"#;
        assert!(parse_prices(doc).is_err());
    }

    #[test]
    fn generation_consumption_flag() {
        let doc = r#"<GL_MarketDocument>
          <TimeSeries><inBiddingZone_Domain.mRID codingScheme="A01">10Y1001A1001A44P</inBiddingZone_Domain.mRID>
            <curveType>A01</curveType><MktPSRType><psrType>B12</psrType></MktPSRType>
            <Period><timeInterval><start>2024-01-01T00:00Z</start><end>2024-01-01T02:00Z</end></timeInterval>
              <resolution>PT60M</resolution>
              <Point><position>1</position><quantity>100</quantity></Point>
              <Point><position>2</position><quantity>110</quantity></Point></Period></TimeSeries>
          <TimeSeries><outBiddingZone_Domain.mRID codingScheme="A01">10Y1001A1001A44P</outBiddingZone_Domain.mRID>
            <MktPSRType><psrType>B10</psrType></MktPSRType>
            <Period><timeInterval><start>2024-01-01T00:00Z</start><end>2024-01-01T01:00Z</end></timeInterval>
              <resolution>PT60M</resolution><Point><position>1</position><quantity>5</quantity></Point></Period></TimeSeries>
        </GL_MarketDocument>"#;
        let g = parse_generation(doc).unwrap();
        assert_eq!(g.len(), 3);
        assert!(!g[0].consumption);
        assert_eq!(g[1].start - g[0].start, 3_600_000);
        assert!(g[2].consumption);
        assert_eq!(g[2].psr, "B10");
    }

    #[test]
    fn unavailability() {
        let doc = r#"<Unavailability_MarketDocument>
          <mRID>OUT1</mRID><revisionNumber>2</revisionNumber><type>A80</type>
          <TimeSeries>
            <businessType>A53</businessType><curveType>A03</curveType>
            <start_DateAndOrTime.date>2024-01-01</start_DateAndOrTime.date><start_DateAndOrTime.time>06:00:00Z</start_DateAndOrTime.time>
            <end_DateAndOrTime.date>2024-01-03</end_DateAndOrTime.date><end_DateAndOrTime.time>18:00:00Z</end_DateAndOrTime.time>
            <production_RegisteredResource.name>Plant</production_RegisteredResource.name>
            <production_RegisteredResource.location.name>Somewhere</production_RegisteredResource.location.name>
            <production_RegisteredResource.pSRType.psrType>B14</production_RegisteredResource.pSRType.psrType>
            <production_RegisteredResource.pSRType.powerSystemResources.name>R1</production_RegisteredResource.pSRType.powerSystemResources.name>
            <production_RegisteredResource.pSRType.powerSystemResources.nominalP unit="MAW">1400</production_RegisteredResource.pSRType.powerSystemResources.nominalP>
            <Available_Period><timeInterval><start>2024-01-01T06:00Z</start><end>2024-01-01T09:00Z</end></timeInterval>
              <resolution>PT60M</resolution><Point><position>1</position><quantity>0</quantity></Point></Available_Period>
            <Reason><code>B19</code><text>Refuelling</text></Reason>
          </TimeSeries>
        </Unavailability_MarketDocument>"#;
        let o = parse_unavailability(doc).unwrap();
        assert_eq!(o.len(), 1);
        let o = &o[0];
        assert_eq!(o.business_type.as_deref(), Some("Planned maintenance"));
        assert_eq!(o.psr_type.as_deref(), Some("Nuclear"));
        assert_eq!(o.psr_nominal_power, Some(1400.0));
        assert_eq!(o.psr_nominal_power_unit.as_deref(), Some("MAW"));
        assert_eq!(
            o.end_date.unwrap() - o.start_date.unwrap(),
            (2 * 24 + 12) * 3_600_000
        );
        // Three forward filled hours merged into one availability block
        assert_eq!(o.availability.len(), 1);
        assert_eq!(o.availability[0].1 - o.availability[0].0, 3 * 3_600_000);
    }
}
