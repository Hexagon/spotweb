//! JSON API. `/api/v2/spot` and `/api/v2/hass` keep the request parameters and
//! response shapes of spotweb 1.x.

use std::collections::HashMap;

use axum::extract::{Query, State};
use axum::http::{header, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use serde::Serialize;
use serde_json::json;

use super::{data, WebState};
use crate::countries::{find_area, interval_for_identifier};
use crate::price::{convert, process_price, Grouping, IntervalMode, PriceProps};
use crate::timeutil::{day_range, js_iso, now_ms, parse_api_date, today};

fn json_response(status: StatusCode, body: impl Serialize, max_age: u32) -> Response {
    let mut res = (status, axum::Json(body)).into_response();
    let h = res.headers_mut();
    h.insert(
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        HeaderValue::from_static("*"),
    );
    if status.is_success() && max_age > 0 {
        if let Ok(v) = HeaderValue::from_str(&format!("public, max-age={max_age}")) {
            h.insert(header::CACHE_CONTROL, v);
        }
    } else {
        h.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    }
    res
}

/// 1.x answered every error with HTTP 500 and this body
fn api_error(details: &str) -> Response {
    json_response(
        StatusCode::INTERNAL_SERVER_ERROR,
        json!({ "status": "error", "details": details }),
        0,
    )
}

fn param<'a>(q: &'a HashMap<String, String>, k: &str) -> Option<&'a str> {
    q.get(k).map(|s| s.trim()).filter(|s| !s.is_empty())
}

/// JavaScript `parseFloat` semantics: parse the longest numeric prefix
pub fn js_parse_float(s: &str) -> Option<f64> {
    let s = s.trim_start();
    let mut end = 0;
    let mut seen_digit = false;
    let mut seen_dot = false;
    let mut seen_exp = false;
    let b = s.as_bytes();
    let mut i = 0;
    while i < b.len() {
        let c = b[i];
        match c {
            b'0'..=b'9' => {
                seen_digit = true;
                end = i + 1;
            }
            b'+' | b'-' if i == 0 || (seen_exp && matches!(b[i - 1], b'e' | b'E')) => {}
            b'.' if !seen_dot && !seen_exp => seen_dot = true,
            b'e' | b'E' if seen_digit && !seen_exp => seen_exp = true,
            _ => break,
        }
        i += 1;
    }
    if !seen_digit {
        return if s.starts_with("Infinity") {
            Some(f64::INFINITY)
        } else {
            None
        };
    }
    s[..end].parse().ok()
}

fn js_parse_int(s: &str) -> Option<i64> {
    let s = s.trim_start();
    let end = s
        .char_indices()
        .take_while(|(i, c)| c.is_ascii_digit() || (*i == 0 && (*c == '-' || *c == '+')))
        .count();
    s[..end].parse().ok()
}

fn interval_mode(q: &HashMap<String, String>, area: &str) -> IntervalMode {
    match param(q, "interval") {
        Some(iv) if !iv.eq_ignore_ascii_case("auto") => IntervalMode::Exact(iv.to_uppercase()),
        _ => IntervalMode::Prefer(interval_for_identifier(area).unwrap_or("PT60M").to_string()),
    }
}

/// `GET /api/v2/spot?period=hourly&area=SE1&startDate=2024-01-01&endDate=2024-01-31[&currency=SEK][&interval=PT15M]`
pub async fn spot(
    State(st): State<WebState>,
    Query(q): Query<HashMap<String, String>>,
) -> Response {
    let Some(grouping) = param(&q, "period").and_then(Grouping::parse) else {
        return api_error("Period not valid");
    };
    let area = param(&q, "area").unwrap_or("").to_uppercase();
    let (tz, area_name) = match find_area(&area) {
        Some((c, a)) => (c.timezone(), a.name.to_string()),
        None => (chrono_tz::Europe::Stockholm, area.clone()),
    };
    let (Some(start), Some(end)) = (
        param(&q, "startDate").and_then(|s| parse_api_date(s, &tz)),
        param(&q, "endDate").and_then(|s| parse_api_date(s, &tz)),
    ) else {
        return api_error("Missing/invalid parameters");
    };
    let from = day_range(&tz, start).0;
    let to = day_range(&tz, end).1;
    let mode = interval_mode(&q, &area);

    let rate = match param(&q, "currency") {
        None => 1.0,
        Some(cur) => match data::exchange_rates(&st.app).await {
            Ok(er) => match er.rate(cur) {
                Some(r) => r,
                None => return api_error("Unknown currency"),
            },
            Err(e) => {
                tracing::error!(error = %e, "exchange rate query failed");
                return api_error("Query failed");
            }
        },
    };

    match data::spot_grouped(&st.app, &area_name, from, to, grouping, &mode, tz).await {
        Ok(rows) => {
            let mut rows = (*rows).clone();
            if rate != 1.0 {
                convert(&mut rows, rate);
            }
            let max_age = if to < now_ms() { 3600 } else { 60 };
            json_response(
                StatusCode::OK,
                json!({ "status": "ok", "data": rows }),
                max_age,
            )
        }
        Err(e) => {
            tracing::error!(error = %e, "spot query failed");
            api_error("Query failed")
        }
    }
}

#[derive(Serialize, Clone)]
struct HassPoint {
    st: String,
    p: String,
}

#[derive(Serialize, Clone)]
struct HassResponse {
    updated: String,
    now: String,
    avg: String,
    min: String,
    max: String,
    avg_tomorrow: String,
    min_tomorrow: String,
    max_tomorrow: String,
    avg_yesterday: String,
    min_yesterday: String,
    max_yesterday: String,
    data: Vec<HassPoint>,
}

/// `GET /api/v2/hass?area=SE2&currency=SEK[&multiplier=1][&extra=0][&factor=1][&decimals=5][&interval=PT15M]`
pub async fn hass(
    State(st): State<WebState>,
    Query(q): Query<HashMap<String, String>>,
) -> Response {
    let area = param(&q, "area").map(str::to_uppercase);
    let currency = param(&q, "currency").map(str::to_uppercase);
    let num = |k: &str, d: f64| match param(&q, k) {
        Some(s) => js_parse_float(s).unwrap_or(f64::NAN),
        None => d,
    };
    let multiplier = num("multiplier", 1.0);
    let factor = num("factor", 1.0);
    let extra = num("extra", 0.0);
    let decimals = match param(&q, "decimals") {
        Some(s) => js_parse_int(s),
        None => Some(5),
    };
    let (Some(area), Some(currency), Some(decimals)) = (area, currency, decimals) else {
        return api_error("Missing/invalid parameters");
    };
    if multiplier.is_nan() || factor.is_nan() || extra.is_nan() || !(0..=20).contains(&decimals) {
        return api_error("Missing/invalid parameters");
    }
    let Some((country, area_def)) = find_area(&area) else {
        // 1.x answered unknown areas with empty data
        return json_response(StatusCode::OK, empty_hass(), 60);
    };
    let tz = country.timezone();
    let mode = interval_mode(&q, &area);

    let er = match data::exchange_rates(&st.app).await {
        Ok(er) => er,
        Err(_) => return api_error("Query failed"),
    };
    let Some(rate) = er.rate(&currency) else {
        return api_error("Unknown currency");
    };
    let props = PriceProps {
        extra,
        multiplier,
        factor,
        decimals: decimals as usize,
        price_factor: true,
        sub_unit: matches!(currency.as_str(), "ÖRE" | "ORE"),
    };

    let t = today(&tz);
    let mut days = vec![];
    for d in [
        t - chrono::Duration::days(1),
        t,
        t + chrono::Duration::days(1),
    ] {
        let (from, to) = day_range(&tz, d);
        match data::spot_selected(&st.app, area_def.name, from, to, &mode, tz).await {
            Ok(rows) => days.push(
                rows.iter()
                    .map(|r| (r.0, r.1 * rate, r.2))
                    .collect::<Vec<_>>(),
            ),
            Err(e) => {
                tracing::error!(error = %e, "hass query failed");
                return api_error("Query failed");
            }
        }
    }
    let now = now_ms();
    let fmt = |v: Option<f64>| process_price(v, &props);
    let stat = |rows: &[(i64, f64, i64)]| {
        let s = crate::price::stats(&rows.iter().map(|r| r.1).collect::<Vec<_>>());
        (
            fmt(s.map(|s| s.0)),
            fmt(s.map(|s| s.1)),
            fmt(s.map(|s| s.2)),
        )
    };
    let (avg_y, min_y, max_y) = stat(&days[0]);
    let (avg, min, max) = stat(&days[1]);
    let (avg_t, min_t, max_t) = stat(&days[2]);
    let now_price = days[1]
        .iter()
        .find(|r| r.0 <= now && r.0 + r.2 > now)
        .map(|r| r.1);
    let body = HassResponse {
        updated: js_iso(now),
        now: fmt(now_price),
        avg,
        min,
        max,
        avg_tomorrow: avg_t,
        min_tomorrow: min_t,
        max_tomorrow: max_t,
        avg_yesterday: avg_y,
        min_yesterday: min_y,
        max_yesterday: max_y,
        data: days
            .iter()
            .flatten()
            .map(|r| HassPoint {
                st: js_iso(r.0),
                p: fmt(Some(r.1)),
            })
            .collect(),
    };
    // `updated` is the time of the request; leave it out of the ETag so unchanged data gives 304
    let tag = etag(
        &serde_json::to_vec(&HassResponse {
            updated: String::new(),
            ..body.clone()
        })
        .unwrap_or_default(),
    );
    let mut res = json_response(StatusCode::OK, body, 60);
    if let Ok(v) = HeaderValue::from_str(&tag) {
        res.headers_mut().insert(header::ETAG, v);
    }
    res
}

/// Weak ETag from a stable 64-bit FNV-1a hash of the body (weak, because compression
/// changes the bytes on the wire but not the meaning)
pub fn etag(body: &[u8]) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in body {
        h ^= *b as u64;
        h = h.wrapping_mul(0x0100_0000_01b3);
    }
    format!("W/\"{h:016x}\"")
}

/// `If-None-Match` matches `tag` (weak comparison, list or `*`)
pub fn etag_matches(if_none_match: &str, tag: &str) -> bool {
    let bare = |t: &str| t.trim().trim_start_matches("W/").to_string();
    if_none_match
        .split(',')
        .any(|t| t.trim() == "*" || bare(t) == bare(tag))
}

fn empty_hass() -> HassResponse {
    let d = || "-".to_string();
    HassResponse {
        updated: js_iso(now_ms()),
        now: d(),
        avg: d(),
        min: d(),
        max: d(),
        avg_tomorrow: d(),
        min_tomorrow: d(),
        max_tomorrow: d(),
        avg_yesterday: d(),
        min_yesterday: d(),
        max_yesterday: d(),
        data: vec![],
    }
}

async fn data_health(st: &WebState) -> anyhow::Result<crate::health::Health> {
    let i = st
        .app
        .db
        .run(|c| Ok(crate::db::queries::health_inputs(c)?))
        .await?;
    Ok(crate::health::check(
        now_ms(),
        |a| i.prices.get(a).copied(),
        i.generation,
        i.load,
    ))
}

/// `GET /api/v2/status` - data freshness and last job runs, for monitoring
pub async fn status(State(st): State<WebState>) -> Response {
    let res = st
        .app
        .db
        .run(|c| {
            Ok((
                crate::db::queries::data_freshness(c)?,
                crate::db::queries::latest_job_runs(c)?,
            ))
        })
        .await;
    let health = data_health(&st).await;
    match (res, health) {
        (Ok((fresh, jobs)), Ok(health)) => json_response(
            StatusCode::OK,
            json!({
                "status": "ok",
                "version": env!("CARGO_PKG_VERSION"),
                "healthy": health.healthy,
                "problems": health.problems,
                "data": fresh,
                "jobs": jobs,
            }),
            0,
        ),
        (Err(e), _) | (_, Err(e)) => {
            tracing::error!(error = %e, "status query failed");
            api_error("Query failed")
        }
    }
}

/// `GET /api/v2/flows` - net physical flow per border right now (MW)
pub async fn flows(State(st): State<WebState>) -> Response {
    match data::current_flows(&st.app).await {
        Ok(f) => json_response(
            StatusCode::OK,
            json!({
                "status": "ok",
                "updated": f.updated.map(js_iso),
                "data": f.borders.iter().map(|b| json!({
                    "from": b.from,
                    "to": b.to,
                    "value": b.value,
                    "time": js_iso(b.period),
                })).collect::<Vec<_>>(),
            }),
            300,
        ),
        Err(e) => {
            tracing::error!(error = %format!("{e:#}"), "flows query failed");
            api_error("Query failed")
        }
    }
}

/// `GET /healthz` - liveness incl. database
pub async fn healthz(State(st): State<WebState>) -> impl IntoResponse {
    match st
        .app
        .db
        .run(|c| Ok(c.query_row("SELECT 1", [], |r| r.get::<_, i64>(0))?))
        .await
    {
        Ok(_) => (StatusCode::OK, "ok"),
        Err(_) => (StatusCode::SERVICE_UNAVAILABLE, "database unavailable"),
    }
}

/// `GET /healthz/data` - `200 ok` when prices, load and generation are up to date,
/// otherwise `503` with one problem per line. For external monitors that only look at the status code.
pub async fn healthz_data(State(st): State<WebState>) -> Response {
    let mut res = match data_health(&st).await {
        Ok(h) if h.healthy => (StatusCode::OK, "ok".to_string()).into_response(),
        Ok(h) => (StatusCode::SERVICE_UNAVAILABLE, h.problems.join("\n")).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "health query failed");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                "database unavailable".to_string(),
            )
                .into_response()
        }
    };
    res.headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    res
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_float_like_js() {
        assert_eq!(js_parse_float("1.25"), Some(1.25));
        assert_eq!(js_parse_float(" 0.5abc"), Some(0.5));
        assert_eq!(js_parse_float("-2e2x"), Some(-200.0));
        assert_eq!(js_parse_float(".5"), Some(0.5));
        assert_eq!(js_parse_float("abc"), None);
        assert_eq!(js_parse_int("5.7"), Some(5));
    }
}
