//! Minimal ENTSO-e Transparency Platform REST client.
//! <https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html>

use std::io::Read;
use std::time::Duration;

use anyhow::bail;
use jiff::civil::{Date, DateTime};
use jiff::tz::TimeZone;
use jiff::Timestamp;

use crate::db::queries::NewOutage;
use crate::timeutil::interval_ms;
use crate::xml::{self, Element};

pub const ENDPOINT: &str = "https://web-api.tp.entsoe.eu/api";

#[derive(Clone)]
pub struct Client {
    http: reqwest::Client,
    token: String,
    endpoint: String,
    timeout: Duration,
}

/// A failed request to ENTSO-e, classified so the jobs can log it clearly and decide whether to retry.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RequestError {
    /// No complete response within spotweb's own per-request timeout
    Timeout(Duration),
    /// DNS, TCP or TLS failure, or the connection was dropped
    Connection(String),
    /// HTTP 599: not a standard status code, the ENTSO-e gateway uses it when its backend times out
    UpstreamTimeout,
    /// HTTP 429
    RateLimited,
    /// HTTP 401
    Unauthorized,
    /// Any other unsuccessful HTTP status
    Http(u16),
}

impl std::fmt::Display for RequestError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Timeout(d) => write!(
                f,
                "ENTSO-e: no response within {}s (spotweb timeout)",
                d.as_secs()
            ),
            Self::Connection(e) => write!(f, "ENTSO-e: connection failed: {e}"),
            Self::UpstreamTimeout => write!(
                f,
                "ENTSO-e: upstream timeout (HTTP 599 from the ENTSO-e gateway)"
            ),
            Self::RateLimited => write!(f, "ENTSO-e: 429 rate limited"),
            Self::Unauthorized => {
                write!(f, "ENTSO-e: 401 Unauthorized, missing or invalid API token")
            }
            Self::Http(code) => write!(f, "ENTSO-e: HTTP {code}"),
        }
    }
}

impl std::error::Error for RequestError {}

impl RequestError {
    fn from_status(code: u16) -> Self {
        match code {
            401 => Self::Unauthorized,
            429 => Self::RateLimited,
            599 => Self::UpstreamTimeout,
            c => Self::Http(c),
        }
    }

    fn from_reqwest(e: reqwest::Error, timeout: Duration) -> Self {
        if e.is_timeout() {
            return Self::Timeout(timeout);
        }
        // Include the source chain, reqwest's own message is just "error sending request"
        let mut msg = e.to_string();
        let mut src = std::error::Error::source(&e);
        while let Some(s) = src {
            msg.push_str(": ");
            msg.push_str(&s.to_string());
            src = s.source();
        }
        Self::Connection(msg)
    }

    /// Whether the request is worth retrying soon, and after how long (relative to `base`).
    /// Rate limiting and overload get a longer pause; authentication and client errors are not retried.
    pub fn retry_delay(&self, base: Duration) -> Option<Duration> {
        match self {
            Self::RateLimited | Self::Http(503) => Some(base * 4),
            Self::Timeout(_) | Self::Connection(_) | Self::UpstreamTimeout => Some(base),
            Self::Http(c) if *c >= 500 => Some(base),
            _ => None,
        }
    }
}

/// See [`RequestError::retry_delay`]. Other errors (e.g. unparsable responses) are not retried.
pub fn retry_delay(e: &anyhow::Error, base: Duration) -> Option<Duration> {
    e.downcast_ref::<RequestError>()
        .and_then(|r| r.retry_delay(base))
}

/// Per-request timeout (`SPOTWEB_ENTSOE_TIMEOUT_SECS`, default 60)
fn request_timeout() -> Duration {
    Duration::from_secs(
        std::env::var("SPOTWEB_ENTSOE_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .filter(|v| *v > 0)
            .unwrap_or(60),
    )
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

fn fmt_time(t: Timestamp) -> String {
    t.strftime("%Y%m%d%H%M").to_string()
}

/// Civil date and time in UTC to milliseconds
fn utc_ms(dt: DateTime) -> Option<i64> {
    dt.to_zoned(TimeZone::UTC)
        .ok()
        .map(|z| z.timestamp().as_millisecond())
}

/// ENTSO-e times look like `2024-01-01T23:00Z`; full RFC 3339 and times without zone (UTC) work too.
fn parse_time(s: &str) -> Option<i64> {
    let s = s.trim();
    if let Ok(t) = s.parse::<Timestamp>() {
        return Some(t.as_millisecond());
    }
    utc_ms(s.trim_end_matches('Z').parse::<DateTime>().ok()?)
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

/// Cross-border physical flows (A11), `quantity` in MW
pub fn parse_flows(xml_doc: &str) -> anyhow::Result<Vec<Point>> {
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
    let d: Date = date?.trim().parse().ok()?;
    let t = time.unwrap_or("00:00:00Z").trim().trim_end_matches('Z');
    utc_ms(format!("{d}T{t}").parse::<DateTime>().ok()?)
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
    // A05 active, A09 cancelled, A13 withdrawn. Inactive revisions are kept so they replace
    // the stored active revision; the outage queries hide them.
    let doc_status = root.path(&["docStatus", "value"]).map(str::to_string);
    let doc_type = root.text_of("type").map(|t| match t {
        "A80" => "Generation unavailability".to_string(),
        "A77" => "Production unavailability".to_string(),
        o => o.to_string(),
    });
    let mut out = vec![];
    for (index, ts) in root.children("TimeSeries").enumerate() {
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
            ts: index as i64,
            revision,
            doc_status: doc_status.clone(),
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
        let endpoint =
            std::env::var("SPOTWEB_ENTSOE_ENDPOINT").unwrap_or_else(|_| ENDPOINT.to_string());
        Self::with_endpoint(token, endpoint, request_timeout())
    }

    pub fn with_endpoint(
        token: String,
        endpoint: String,
        timeout: Duration,
    ) -> anyhow::Result<Self> {
        let http = reqwest::Client::builder()
            .user_agent(concat!("spotweb/", env!("CARGO_PKG_VERSION")))
            .timeout(timeout)
            .connect_timeout(Duration::from_secs(20).min(timeout))
            .build()?;
        Ok(Self {
            http,
            token,
            endpoint,
            timeout,
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
        let timeout = self.timeout;
        let res = self
            .http
            .get(&self.endpoint)
            .query(&q)
            .send()
            .await
            .map_err(|e| RequestError::from_reqwest(e, timeout))?;
        let status = res.status();
        if matches!(status.as_u16(), 401 | 429 | 599) {
            return Err(RequestError::from_status(status.as_u16()).into());
        }
        let is_zip = res
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .map(|v| v.contains("zip"))
            .unwrap_or(false);
        let body = res
            .bytes()
            .await
            .map_err(|e| RequestError::from_reqwest(e, timeout))?;
        if is_zip || body.starts_with(b"PK\x03\x04") {
            unzip_documents(&body)
        } else {
            let text = String::from_utf8_lossy(&body).to_string();
            if !status.is_success() && !text.contains("Acknowledgement_MarketDocument") {
                return Err(RequestError::from_status(status.as_u16()).into());
            }
            Ok(vec![text])
        }
    }

    fn range(start: Timestamp, end: Timestamp) -> [(&'static str, String); 2] {
        [
            ("periodStart", fmt_time(start)),
            ("periodEnd", fmt_time(end)),
        ]
    }

    pub async fn day_ahead_prices(
        &self,
        eic: &str,
        start: Timestamp,
        end: Timestamp,
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
        start: Timestamp,
        end: Timestamp,
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
        start: Timestamp,
        end: Timestamp,
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

    /// Physical flow from `out_eic` into `in_eic` (A11)
    pub async fn physical_flows(
        &self,
        out_eic: &str,
        in_eic: &str,
        start: Timestamp,
        end: Timestamp,
    ) -> anyhow::Result<Vec<Point>> {
        let mut p = vec![
            ("documentType", "A11".to_string()),
            ("in_Domain", in_eic.to_string()),
            ("out_Domain", out_eic.to_string()),
        ];
        p.extend(Self::range(start, end));
        let mut out = vec![];
        for doc in self.query(&p).await? {
            out.extend(parse_flows(&doc)?);
        }
        Ok(out)
    }

    /// Generation (A80) and production (A77) unavailability, paginated
    pub async fn outages(
        &self,
        eic: &str,
        start: Timestamp,
        end: Timestamp,
    ) -> anyhow::Result<Vec<NewOutage>> {
        const PAGE_SIZE: usize = 200;
        const MAX_PAGES: usize = 10;
        let mut out = vec![];
        for doc_type in ["A80", "A77"] {
            for page in 0..MAX_PAGES {
                let mut p = vec![
                    ("documentType", doc_type.to_string()),
                    ("biddingZone_Domain", eic.to_string()),
                    ("offset", (page * PAGE_SIZE).to_string()),
                ];
                p.extend(Self::range(start, end));
                let docs = self.query(&p).await?;
                let n = docs.len();
                for doc in docs {
                    out.extend(parse_unavailability(&doc)?);
                }
                if n < PAGE_SIZE {
                    break;
                }
                if page + 1 == MAX_PAGES {
                    tracing::warn!(
                        eic,
                        doc_type,
                        documents = MAX_PAGES * PAGE_SIZE,
                        "outage page limit reached, remaining documents are not fetched"
                    );
                    break;
                }
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
        Ok(out)
    }
}

/// The XML documents in a zip response (outages come as one document per unit), read in memory
fn unzip_documents(body: &[u8]) -> anyhow::Result<Vec<String>> {
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
}

#[cfg(test)]
mod tests {
    #[test]
    fn unzips_all_documents() {
        use std::io::Write;
        let mut buf = std::io::Cursor::new(Vec::new());
        {
            let mut w = zip::ZipWriter::new(&mut buf);
            let opt = zip::write::SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated);
            w.add_directory("dir/", opt).unwrap();
            w.start_file("dir/a.xml", opt).unwrap();
            w.write_all(b"<a>1</a>").unwrap();
            w.start_file("b.xml", opt).unwrap();
            w.write_all("<b>å</b>".as_bytes()).unwrap();
            w.finish().unwrap();
        }
        let docs = super::unzip_documents(&buf.into_inner()).unwrap();
        assert_eq!(docs, vec!["<a>1</a>".to_string(), "<b>å</b>".to_string()]);
        assert!(super::unzip_documents(b"PK\x03\x04 broken").is_err());
    }

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
    fn flows() {
        let doc = r#"<Publication_MarketDocument xmlns="urn:iec62325.351:tc57wg16:451-3:publicationdocument:7:0">
          <type>A11</type>
          <TimeSeries><curveType>A01</curveType>
            <in_Domain.mRID codingScheme="A01">10YFI-1--------U</in_Domain.mRID>
            <out_Domain.mRID codingScheme="A01">10Y1001A1001A46L</out_Domain.mRID>
            <Period><timeInterval><start>2026-11-20T23:00Z</start><end>2026-11-21T01:00Z</end></timeInterval>
              <resolution>PT60M</resolution>
              <Point><position>1</position><quantity>1200</quantity></Point>
              <Point><position>2</position><quantity>0</quantity></Point>
            </Period></TimeSeries></Publication_MarketDocument>"#;
        let p = parse_flows(doc).unwrap();
        assert_eq!(p.len(), 2);
        assert_eq!(p[0].value, 1200.0);
        assert_eq!(p[1].value, 0.0);
        assert_eq!(p[1].start - p[0].start, 3_600_000);
        assert_eq!(p[0].interval, "PT60M");
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

    #[test]
    fn unavailability_doc_status_and_time_series() {
        let ts = |name: &str| {
            format!(
                "<TimeSeries><businessType>A54</businessType>
                  <start_DateAndOrTime.date>2024-01-01</start_DateAndOrTime.date>
                  <end_DateAndOrTime.date>2024-01-02</end_DateAndOrTime.date>
                  <production_RegisteredResource.name>{name}</production_RegisteredResource.name>
                </TimeSeries>"
            )
        };
        let doc = format!(
            "<Unavailability_MarketDocument>
              <mRID>OUT2</mRID><revisionNumber>3</revisionNumber><type>A77</type>
              <docStatus><value>A13</value></docStatus>
              {}{}
            </Unavailability_MarketDocument>",
            ts("G1"),
            ts("G2")
        );
        let o = parse_unavailability(&doc).unwrap();
        assert_eq!(o.len(), 2);
        assert!(o.iter().all(|o| o.mrid == "OUT2" && o.revision == Some(3)));
        assert!(o.iter().all(|o| o.doc_status.as_deref() == Some("A13")));
        assert_eq!((o[0].ts, o[1].ts), (0, 1));
        assert_eq!(o[1].resource_name.as_deref(), Some("G2"));
        assert_eq!(o[0].business_type.as_deref(), Some("Unplanned outage"));
        // Without docStatus the status is unknown (treated as active)
        let o = parse_unavailability(&doc.replace("<docStatus><value>A13</value></docStatus>", ""))
            .unwrap();
        assert!(o.iter().all(|o| o.doc_status.is_none()));
    }
}
