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
use crate::timeutil::{
    add_days, day_range, js_iso, local_date, now_ms, parse_api_date, parse_api_instant, today,
    HOUR_MS,
};

/// Attribution required by the ENTSO-E Transparency Platform terms of use (clause 3.1)
pub const SOURCE: &str = "ENTSO-E Transparency Platform (https://transparency.entsoe.eu/)";
/// Note on changes made to the data, as asked by CC-BY 4.0
const CONVERSION_NOTE: &str = "Converted from EUR/MWh with ECB reference rates by spotweb";

/// Longest range (in days, end date inclusive) one `/api/v2/spot` request may cover.
/// Aggregated groupings are not limited; raw and daily data are, to keep the API
/// from serving bulk copies of the price history.
pub fn max_span_days(g: Grouping) -> Option<i64> {
    match g {
        Grouping::Hourly | Grouping::Minimum => Some(31),
        Grouping::Daily => Some(366),
        _ => None,
    }
}

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

/// Collect query parameters. Like `URLSearchParams.get` in 1.x, the first
/// occurrence of a repeated parameter wins.
fn query_map(pairs: Vec<(String, String)>) -> HashMap<String, String> {
    let mut q = HashMap::with_capacity(pairs.len());
    for (k, v) in pairs {
        q.entry(k).or_insert(v);
    }
    q
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
    Query(pairs): Query<Vec<(String, String)>>,
) -> Response {
    let q = query_map(pairs);
    let Some(grouping) = param(&q, "period").and_then(Grouping::parse) else {
        return api_error("Period not valid");
    };
    let area = param(&q, "area").unwrap_or("").to_uppercase();
    // 1.x looked the name up as is and answered unknown areas with empty data; it only ever
    // stored the area names that `find_area` knows, so nothing that used to work is rejected.
    let Some((country, area_def)) = find_area(&area) else {
        return api_error("Unknown area");
    };
    let tz = country.timezone();
    let (Some(start), Some(end)) = (
        param(&q, "startDate").and_then(|s| parse_api_date(s, &tz)),
        param(&q, "endDate").and_then(|s| parse_api_date(s, &tz)),
    ) else {
        return api_error("Missing/invalid parameters");
    };
    if let Some(max) = max_span_days(grouping) {
        if i64::from((end - start).get_days()) + 1 > max {
            return api_error(&format!(
                "Date range too long, max {max} days for this period"
            ));
        }
    }
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

    match data::spot_grouped(&st.app, area_def.name, from, to, grouping, &mode, tz).await {
        Ok(rows) => {
            let mut rows = (*rows).clone();
            if rate != 1.0 {
                convert(&mut rows, rate);
            }
            let max_age = if to < now_ms() { 3600 } else { 60 };
            let mut body = json!({ "status": "ok", "source": SOURCE, "data": rows });
            if rate != 1.0 {
                body["note"] = json!(CONVERSION_NOTE);
            }
            json_response(StatusCode::OK, body, max_age)
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
    source: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    note: Option<&'static str>,
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
    Query(pairs): Query<Vec<(String, String)>>,
) -> Response {
    let q = query_map(pairs);
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
    // 1.x used `Number.prototype.toFixed`, which accepts 0-100 decimals
    if multiplier.is_nan() || factor.is_nan() || extra.is_nan() || !(0..=100).contains(&decimals) {
        return api_error("Missing/invalid parameters");
    }
    let Some((country, area_def)) = find_area(&area) else {
        // 1.x answered with empty data, which hid typos
        return api_error("Unknown area");
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
    for d in [add_days(t, -1), t, add_days(t, 1)] {
        let (from, to) = day_range(&tz, d);
        match data::spot_selected(&st.app, area_def.name, from, to, &mode, tz.clone()).await {
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
        source: SOURCE,
        note: (rate != 1.0).then_some(CONVERSION_NOTE),
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

/// Longest time range one `/api/v2/cheapest` request may search
const CHEAPEST_MAX_SPAN_MS: i64 = 7 * 24 * HOUR_MS;

/// `GET /api/v2/cheapest?area=SE3&hours=3[&consecutive=false][&from=…][&to=…][&currency=SEK][&interval=PT15M]`
///
/// The cheapest intervals covering at least `hours` between `from` (default now, the interval in
/// progress included) and `to` (default the end of tomorrow; intervals must end by then), for
/// automations. `active` tells whether the interval in progress right now is one of them.
pub async fn cheapest(
    State(st): State<WebState>,
    Query(pairs): Query<Vec<(String, String)>>,
) -> Response {
    let q = query_map(pairs);
    let area = param(&q, "area").unwrap_or("").to_uppercase();
    let Some((country, area_def)) = find_area(&area) else {
        return api_error("Unknown area");
    };
    let tz = country.timezone();
    let Some(hours) = param(&q, "hours").and_then(js_parse_float) else {
        return api_error("Missing/invalid parameters");
    };
    let consecutive = match param(&q, "consecutive")
        .map(str::to_ascii_lowercase)
        .as_deref()
    {
        None | Some("true" | "1" | "yes") => true,
        Some("false" | "0" | "no") => false,
        Some(_) => return api_error("Missing/invalid parameters"),
    };
    let now = now_ms();
    let from = match param(&q, "from") {
        None => Some(now),
        Some(s) => parse_api_instant(s, &tz, false),
    };
    let to = match param(&q, "to") {
        None => Some(day_range(&tz, add_days(today(&tz), 1)).1 + 1),
        Some(s) => parse_api_instant(s, &tz, true),
    };
    let (Some(from), Some(to)) = (from, to) else {
        return api_error("Missing/invalid parameters");
    };
    if to <= from || to - from > CHEAPEST_MAX_SPAN_MS {
        return api_error("Time range not valid, max 7 days");
    }
    let duration = (hours * HOUR_MS as f64).round() as i64;
    if !hours.is_finite() || duration <= 0 || duration > to - from {
        return api_error("Hours not valid, must be more than 0 and fit between from and to");
    }

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
    let currency = param(&q, "currency").map_or("EUR".to_string(), str::to_uppercase);
    let mode = interval_mode(&q, &area);
    // Whole local days, so the cache key stays the same between requests
    let fetch_from = day_range(&tz, local_date(&tz, from)).0;
    let fetch_to = day_range(&tz, local_date(&tz, to - 1)).1;
    let rows =
        match data::spot_selected(&st.app, area_def.name, fetch_from, fetch_to, &mode, tz).await {
            Ok(rows) => rows,
            Err(e) => {
                tracing::error!(error = %e, "cheapest query failed");
                return api_error("Query failed");
            }
        };
    let rows: Vec<(i64, f64, i64)> = rows
        .iter()
        .filter(|r| r.0 + r.2 > from && r.0 + r.2 <= to)
        .map(|r| (r.0, r.1 * rate, r.2))
        .collect();
    let picked = crate::price::cheapest(&rows, duration, consecutive).unwrap_or_default();
    let point = |r: &(i64, f64, i64)| json!({ "time": js_iso(r.0), "price": r.1 });
    let mut body = json!({
        "status": "ok",
        "source": SOURCE,
        "area": area_def.name,
        "currency": currency,
        "hours": hours,
        "consecutive": consecutive,
        "from": js_iso(from),
        "to": js_iso(to),
        "found": !picked.is_empty(),
        "active": picked.iter().any(|r| r.0 <= now && now < r.0 + r.2),
        "start": picked.first().map(|r| js_iso(r.0)),
        "end": picked.last().map(|r| js_iso(r.0 + r.2)),
        "price": crate::price::weighted_avg(&picked),
        "windows": crate::price::runs(&picked).iter().map(|w| json!({
            "start": js_iso(w[0].0),
            "end": js_iso(w[w.len() - 1].0 + w[w.len() - 1].2),
            "price": crate::price::weighted_avg(w),
        })).collect::<Vec<_>>(),
        "data": picked.iter().map(point).collect::<Vec<_>>(),
    });
    if rate != 1.0 {
        body["note"] = json!(CONVERSION_NOTE);
    }
    json_response(StatusCode::OK, body, 60)
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

async fn data_health(st: &WebState) -> anyhow::Result<crate::health::Health> {
    let now = now_ms();
    // From the start of every area's local today
    let since = now - 26 * crate::timeutil::HOUR_MS;
    let i = st
        .app
        .db
        .run(move |c| Ok(crate::db::queries::health_inputs(c, since)?))
        .await?;
    Ok(crate::health::check(now, &i.prices, i.generation, i.load))
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
                "http": st.app.http_stats.to_json(),
            }),
            0,
        ),
        (Err(e), _) | (_, Err(e)) => {
            tracing::error!(error = %e, "status query failed");
            api_error("Query failed")
        }
    }
}

/// Longest range (days, end date inclusive) of `/api/v2/flows?area=…`
const FLOW_MAX_DAYS: i64 = 31;

/// `GET /api/v2/flows` - net physical flow per border right now (MW).
/// With `area=SE3` or `country=sv`: hourly net export per neighbour from `start` to `end`
/// (dates in the zone's time zone, default yesterday and today), see [`area_flows`].
pub async fn flows(
    State(st): State<WebState>,
    Query(pairs): Query<Vec<(String, String)>>,
) -> Response {
    let q = query_map(pairs);
    if param(&q, "area").is_some() || param(&q, "country").is_some() {
        return area_flows(&st, &q).await;
    }
    match data::current_flows(&st.app).await {
        Ok(f) => json_response(
            StatusCode::OK,
            json!({
                "status": "ok",
                "source": SOURCE,
                "license": "CC-BY-4.0",
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

/// `GET /api/v2/flows?area=SE3[&start=2026-11-21][&end=2026-11-22]` or `?country=sv`.
/// One row per hour with the net export to each neighbour (MW, negative is import) and the
/// sum. Neighbours are zones for an area and countries for a country (borders inside the
/// country are left out).
async fn area_flows(st: &WebState, q: &HashMap<String, String>) -> Response {
    let (scope, tz, label) = if let Some(a) = param(q, "area") {
        let Some((c, a)) = find_area(&a.to_uppercase()) else {
            return api_error("Unknown area");
        };
        (
            data::FlowScope::Area(a.name),
            c.timezone(),
            ("area", a.name),
        )
    } else {
        let id = param(q, "country").unwrap_or("").to_lowercase();
        let Some(c) = crate::countries::COUNTRIES.iter().find(|c| c.id == id) else {
            return api_error("Unknown country");
        };
        (
            data::FlowScope::Country(c.id),
            c.timezone(),
            ("country", c.id),
        )
    };
    let t = today(&tz);
    let date = |k: &str, d| match param(q, k) {
        None => Some(d),
        Some(s) => parse_api_date(s, &tz),
    };
    let (Some(start), Some(end)) = (date("start", add_days(t, -1)), date("end", t)) else {
        return api_error("Missing/invalid parameters");
    };
    let days = i64::from((end - start).get_days()) + 1;
    if days < 1 {
        return api_error("Missing/invalid parameters");
    }
    if days > FLOW_MAX_DAYS {
        return api_error(&format!("Date range too long, max {FLOW_MAX_DAYS} days"));
    }
    let from = day_range(&tz, start).0;
    let to = day_range(&tz, end).1;
    match data::area_flows(&st.app, scope, from, to).await {
        Ok(f) => {
            let rows: Vec<_> = f
                .times
                .iter()
                .enumerate()
                .filter(|(i, _)| f.net[*i].is_some())
                .map(|(i, t)| {
                    let flows: serde_json::Map<String, serde_json::Value> = f
                        .series
                        .iter()
                        .filter_map(|s| s.values[i].map(|v| (s.name.clone(), json!(v))))
                        .collect();
                    json!({ "time": js_iso(*t), "net": f.net[i], "flows": flows })
                })
                .collect();
            json_response(
                StatusCode::OK,
                json!({
                    "status": "ok",
                    "source": SOURCE,
                    "license": "CC-BY-4.0",
                    label.0: label.1,
                    "unit": "MW",
                    "interval": "PT60M",
                    "neighbours": f.series.iter().map(|s| &s.name).collect::<Vec<_>>(),
                    "data": rows,
                }),
                if to < now_ms() { 3600 } else { 300 },
            )
        }
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

/// `GET /api/v2/reservoirs?area=NO2` or `?country=no`: energy stored in hydro reservoirs per
/// ISO week (GWh), with the same week of earlier years (lowest, median, highest).
pub async fn reservoirs(
    State(st): State<WebState>,
    Query(pairs): Query<Vec<(String, String)>>,
) -> Response {
    let q = query_map(pairs);
    let (scope, label) = if let Some(a) = param(&q, "area") {
        let Some((_, a)) = find_area(&a.to_uppercase()) else {
            return api_error("Unknown area");
        };
        (data::FlowScope::Area(a.name), ("area", a.name))
    } else if let Some(id) = param(&q, "country") {
        let id = id.to_lowercase();
        let Some(c) = crate::countries::COUNTRIES.iter().find(|c| c.id == id) else {
            return api_error("Unknown country");
        };
        (data::FlowScope::Country(c.id), ("country", c.id))
    } else {
        return api_error("Missing/invalid parameters");
    };
    match data::reservoirs(&st.app, scope).await {
        Ok(o) => json_response(
            StatusCode::OK,
            json!({
                "status": "ok",
                "source": SOURCE,
                "license": "CC-BY-4.0",
                label.0: label.1,
                "unit": "GWh",
                "data": &*o,
            }),
            3600,
        ),
        Err(e) => {
            tracing::error!(error = %format!("{e:#}"), "reservoir query failed");
            api_error("Query failed")
        }
    }
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
