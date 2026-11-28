//! Closed API of the local news service (`SPOTWEB_NEWS_BIND`, loopback only): views of the
//! site's own data that an external writer needs and that the public API does not give in
//! one piece. Everything here is built from data the site already publishes.
//!
//! - `GET /api/v2/local/outages`: outages with document id, zone, publication time and MW
//! - `GET /api/v2/local/day`: a day's prices for every zone, compared with the history
//! - `GET /api/v2/local/zones`: the state of every zone right now
//!
//! Prices are EUR/MWh, power MW, times ms since the epoch.
#![allow(clippy::result_large_err)]

use std::collections::BTreeMap;

use axum::extract::{Query, Request, State};
use axum::http::{header, HeaderValue, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use jiff::civil::Date;
use serde::Deserialize;
use serde_json::{json, Value};

use super::{data, WebState};
use crate::countries::{country as find_country, find_area, Area, Country, COUNTRIES};
use crate::db::queries::OutageDetail;
use crate::price::{Grouping, IntervalMode};
use crate::timeutil::{add_days, day_range, local_date, market_tz, now_ms, today, HOUR_MS};

const DAY_MS: i64 = 24 * HOUR_MS;

fn reply(status: StatusCode, body: Value) -> Response {
    let mut res = (status, axum::Json(body)).into_response();
    res.headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    res
}

fn bad(details: &str) -> Response {
    reply(
        StatusCode::BAD_REQUEST,
        json!({ "status": "error", "details": details }),
    )
}

fn failed(e: anyhow::Error) -> Response {
    tracing::error!(error = %format!("{e:#}"), "local api query failed");
    reply(
        StatusCode::INTERNAL_SERVER_ERROR,
        json!({ "status": "error", "details": "Query failed" }),
    )
}

/// Requires the news token on every local route when one is set
pub async fn require_token(State(st): State<WebState>, req: Request, next: Next) -> Response {
    if !super::news::authorized(&st, req.headers()) {
        return bad_token();
    }
    next.run(req).await
}

fn bad_token() -> Response {
    reply(
        StatusCode::UNAUTHORIZED,
        json!({ "status": "error", "details": "missing or wrong token" }),
    )
}

fn r3(v: f64) -> f64 {
    (v * 1000.0).round() / 1000.0
}

fn r1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

/// `area=` or `country=` of a request. `Ok(None)` when neither is given.
fn scope(
    area: Option<&str>,
    country: Option<&str>,
) -> Result<Option<(&'static Country, Option<&'static Area>)>, Response> {
    match (area.map(str::trim), country.map(str::trim)) {
        (Some(a), _) if !a.is_empty() => match find_area(&a.to_uppercase()) {
            Some((c, a)) => Ok(Some((c, Some(a)))),
            None => Err(bad("Unknown area")),
        },
        (_, Some(c)) if !c.is_empty() => match find_country(&c.to_lowercase()) {
            Some(c) => Ok(Some((c, None))),
            None => Err(bad("Unknown country")),
        },
        _ => Ok(None),
    }
}

// ---------------------------------------------------------------------------
// Outages
// ---------------------------------------------------------------------------

#[derive(Deserialize, Default)]
pub struct OutageQuery {
    area: Option<String>,
    country: Option<String>,
    /// First and last day (`YYYY-MM-DD`, market time) the outages must overlap
    from: Option<String>,
    to: Option<String>,
    /// Only revisions published at or after this time (ms)
    published_since: Option<i64>,
}

/// Zone of an outage; documents stored before 2.10 have none, which is only certain for
/// countries with one zone
fn outage_area(o: &OutageDetail) -> Option<String> {
    o.area.clone().or_else(|| {
        let c = find_country(o.country.as_deref()?)?;
        (c.areas.len() == 1).then(|| c.areas[0].name.to_string())
    })
}

/// Lowest reported availability, and the availability at `now`
fn availability(o: &OutageDetail, now: i64) -> (Option<f64>, Option<f64>) {
    let min = o.availability.iter().map(|a| a.2).reduce(f64::min);
    let at_now = o
        .availability
        .iter()
        .find(|a| a.0 <= now && now < a.1)
        .map(|a| a.2);
    (min, at_now)
}

pub fn outage_json(o: &OutageDetail, now: i64) -> Value {
    let (min, at_now) = availability(o, now);
    let unavailable = |avail: Option<f64>| match (o.nominal_mw, avail) {
        (Some(n), Some(a)) => Some(r1((n - a).max(0.0))),
        _ => None,
    };
    let active = o.start.is_some_and(|s| s <= now) && o.end.is_some_and(|e| e > now);
    json!({
        "id": o.id,
        "ts": o.ts,
        "revision": o.revision,
        "published": o.published,
        "area": outage_area(o),
        "country": o.country,
        "type": o.business_type,
        "document_type": o.document_type,
        "start": o.start,
        "end": o.end,
        "active": active,
        "resource": o.resource_name,
        "location": o.location,
        "unit": o.psr_name,
        "fuel": o.psr_type,
        "nominal_mw": o.nominal_mw,
        "available_mw_min": min,
        "available_mw_now": if active { at_now } else { None },
        "unavailable_mw_max": unavailable(min),
        "unavailable_mw_now": if active { unavailable(at_now) } else { None },
        "reason_code": o.reason_code,
        "reason": o.reason_text,
        "availability": o.availability,
    })
}

/// `GET /api/v2/local/outages[?area=SE3|country=sv][&from=YYYY-MM-DD][&to=YYYY-MM-DD][&published_since=ms]`:
/// active (not cancelled or withdrawn) outages overlapping the days, default from now to 30 days
/// ahead, newest publication first
pub async fn outages(State(st): State<WebState>, Query(q): Query<OutageQuery>) -> Response {
    let sc = match scope(q.area.as_deref(), q.country.as_deref()) {
        Ok(s) => s,
        Err(r) => return r,
    };
    let tz = market_tz();
    let now = now_ms();
    let day = |s: &Option<String>| match s.as_deref().map(str::trim) {
        None | Some("") => Ok(None),
        Some(s) => s
            .parse::<Date>()
            .map(Some)
            .map_err(|_| bad("Day must be YYYY-MM-DD")),
    };
    let (from, to) = match (day(&q.from), day(&q.to)) {
        (Ok(f), Ok(t)) => (
            f.map_or(now, |d| day_range(&tz, d).0),
            t.map_or(now + 30 * DAY_MS, |d| day_range(&tz, d).1),
        ),
        (Err(r), _) | (_, Err(r)) => return r,
    };
    if to <= from {
        return bad("to is before from");
    }
    let country = sc.map(|s| s.0.id.to_string());
    let rows = match st
        .app
        .db
        .run(move |c| {
            Ok(crate::db::queries::outage_details(
                c,
                country.as_deref(),
                from,
                to,
            )?)
        })
        .await
    {
        Ok(r) => r,
        Err(e) => return failed(e),
    };
    let area = sc.and_then(|s| s.1).map(|a| a.name);
    let out: Vec<Value> = rows
        .iter()
        .filter(|o| area.is_none_or(|a| outage_area(o).as_deref() == Some(a)))
        .filter(|o| {
            q.published_since
                .is_none_or(|s| o.published.is_some_and(|p| p >= s))
        })
        .map(|o| outage_json(o, now))
        .collect();
    reply(
        StatusCode::OK,
        json!({ "status": "ok", "from": from, "to": to, "unit": "MW", "data": out }),
    )
}

// ---------------------------------------------------------------------------
// Day summary
// ---------------------------------------------------------------------------

/// Daily average, min and max of a zone (EUR/MWh) from the start of the history
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DayStat {
    pub date: Date,
    pub avg: f64,
    pub min: f64,
    pub max: f64,
}

async fn history(
    app: &crate::App,
    c: &Country,
    a: &Area,
    last: Date,
) -> anyhow::Result<Vec<DayStat>> {
    let tz = c.timezone();
    let from = day_range(&tz, app.cfg.history_start).0;
    let to = day_range(&tz, last).1;
    let rows = data::spot_grouped(
        app,
        a.name,
        from,
        to,
        Grouping::Daily,
        &IntervalMode::Prefer(c.interval.into()),
        tz.clone(),
        None,
    )
    .await?;
    Ok(rows
        .iter()
        .filter_map(|r| {
            Some(DayStat {
                date: local_date(&tz, r.time?),
                avg: r.price,
                min: r.min,
                max: r.max,
            })
        })
        .collect())
}

/// Last day before `day` with an average at least (`high`) or at most as high, and the days in
/// between. `(None, n)` when no earlier day of the `n` days of history comes close.
fn since(before: &[DayStat], day: &DayStat, high: bool) -> Value {
    let hit = before.iter().rev().find(|d| {
        if high {
            d.avg >= day.avg
        } else {
            d.avg <= day.avg
        }
    });
    match hit {
        Some(d) => json!({ "date": d.date.to_string(), "days": (day.date - d.date).get_days() }),
        None => json!({ "date": null, "days": before.len(), "record": true }),
    }
}

/// Share (percent) of `days` with a lower average than `avg`; ties count half
fn percentile(days: &[&DayStat], avg: f64) -> Option<f64> {
    if days.is_empty() {
        return None;
    }
    let below = days.iter().filter(|d| d.avg < avg).count() as f64;
    let equal = days.iter().filter(|d| d.avg == avg).count() as f64;
    Some(r1((below + equal / 2.0) / days.len() as f64 * 100.0))
}

/// How a day compares with the days before it
pub fn compare(history: &[DayStat], day: &DayStat) -> Value {
    let before: Vec<DayStat> = history
        .iter()
        .filter(|d| d.date < day.date)
        .copied()
        .collect();
    let window = |days: i64| -> Vec<&DayStat> {
        let start = add_days(day.date, -days);
        before.iter().filter(|d| d.date >= start).collect()
    };
    let all: Vec<&DayStat> = before.iter().collect();
    let prev = before.last().filter(|d| d.date == add_days(day.date, -1));
    let week = window(7);
    let week_avg =
        (!week.is_empty()).then(|| week.iter().map(|d| d.avg).sum::<f64>() / week.len() as f64);
    let change = |base: f64| {
        json!({
            "avg": r3(base),
            "diff": r3(day.avg - base),
            "pct": (base.abs() >= 1.0).then(|| r1((day.avg - base) / base.abs() * 100.0)),
        })
    };
    json!({
        "days": before.len(),
        "first_day": before.first().map(|d| d.date.to_string()),
        "prev_day": prev.map(|p| change(p.avg)),
        "prev_7_days": week_avg.map(change),
        "high_since": since(&before, day, true),
        "low_since": since(&before, day, false),
        "percentile_30": percentile(&window(30), day.avg),
        "percentile_365": percentile(&window(365), day.avg),
        "percentile_all": percentile(&all, day.avg),
        "max_since": since(
            &before.iter().map(|d| DayStat { avg: d.max, ..*d }).collect::<Vec<_>>(),
            &DayStat { avg: day.max, ..*day },
            true,
        ),
        "min_since": since(
            &before.iter().map(|d| DayStat { avg: d.min, ..*d }).collect::<Vec<_>>(),
            &DayStat { avg: day.min, ..*day },
            false,
        ),
    })
}

/// One zone on one day: prices, cheapest and most expensive hour, negative prices and the
/// comparison with the history. `None` when the zone has no prices that day.
async fn zone_day(
    app: &crate::App,
    c: &Country,
    a: &Area,
    date: Date,
) -> anyhow::Result<Option<Value>> {
    let tz = c.timezone();
    let (from, to) = day_range(&tz, date);
    let rows = data::spot_selected(
        app,
        a.name,
        from,
        to,
        &IntervalMode::Prefer(c.interval.into()),
        tz.clone(),
    )
    .await?;
    if rows.is_empty() {
        return Ok(None);
    }
    let covered: i64 = rows.iter().map(|r| r.2).sum();
    let hist = history(app, c, a, date).await?;
    let Some(day) = hist.iter().find(|d| d.date == date).copied() else {
        return Ok(None);
    };
    let window = |rows: &[(i64, f64, i64)], sign: f64| {
        let w = crate::price::cheapest(rows, HOUR_MS, true)?;
        let last = w.last()?;
        Some(json!({
            "start": w.first()?.0,
            "end": last.0 + last.2,
            "avg": r3(sign * crate::price::weighted_avg(&w)?),
        }))
    };
    let negated: Vec<_> = rows.iter().map(|&(t, p, d)| (t, -p, d)).collect();
    let neg: Vec<_> = rows.iter().filter(|r| r.1 < 0.0).collect();
    Ok(Some(json!({
        "area": a.name,
        "long": a.long,
        "country": c.id,
        "complete": covered >= to - from + 1 - HOUR_MS,
        "covered_ms": covered,
        "interval": c.interval,
        "avg": r3(day.avg),
        "min": r3(day.min),
        "max": r3(day.max),
        "cheapest_hour": window(&rows, 1.0),
        "priciest_hour": window(&negated, -1.0),
        "negative": {
            "ms": neg.iter().map(|r| r.2).sum::<i64>(),
            "first": neg.first().map(|r| r.0),
            "last": neg.last().map(|r| r.0 + r.2),
        },
        "history": compare(&hist, &day),
    })))
}

#[derive(Deserialize, Default)]
pub struct DayQuery {
    /// `YYYY-MM-DD`, local day of each zone; default today (market time)
    day: Option<String>,
    area: Option<String>,
    country: Option<String>,
}

/// `GET /api/v2/local/day[?day=YYYY-MM-DD][&area=SE3|country=sv]`: every zone's prices on the
/// day with the comparison with its history, and an overview of all zones with complete prices
pub async fn day(State(st): State<WebState>, Query(q): Query<DayQuery>) -> Response {
    let sc = match scope(q.area.as_deref(), q.country.as_deref()) {
        Ok(s) => s,
        Err(r) => return r,
    };
    let date = match q.day.as_deref().map(str::trim) {
        None | Some("") => today(&market_tz()),
        Some(d) => match d.parse::<Date>() {
            Ok(d) => d,
            Err(_) => return bad("Day must be YYYY-MM-DD"),
        },
    };
    let mut zones = vec![];
    for c in COUNTRIES {
        if sc.is_some_and(|s| s.0.id != c.id) {
            continue;
        }
        for a in c.areas {
            if sc.and_then(|s| s.1).is_some_and(|x| x.name != a.name) {
                continue;
            }
            match zone_day(&st.app, c, a, date).await {
                Ok(Some(z)) => zones.push(z),
                Ok(None) => {}
                Err(e) => return failed(e),
            }
        }
    }
    reply(
        StatusCode::OK,
        json!({
            "status": "ok",
            "day": date.to_string(),
            "unit": "EUR/MWh",
            "overview": overview(&zones),
            "data": zones,
        }),
    )
}

/// Cheapest and most expensive zone, average and zones with negative prices, over the zones
/// with complete prices
pub fn overview(zones: &[Value]) -> Value {
    let complete: Vec<&Value> = zones.iter().filter(|z| z["complete"] == true).collect();
    let avg = |z: &&Value| z["avg"].as_f64().unwrap_or(f64::NAN);
    let pick = |z: Option<&&Value>| z.map(|z| json!({ "area": z["area"], "avg": z["avg"] }));
    let cheapest = complete.iter().min_by(|a, b| avg(a).total_cmp(&avg(b)));
    let priciest = complete.iter().max_by(|a, b| avg(a).total_cmp(&avg(b)));
    let mut sorted: Vec<f64> = complete.iter().map(avg).collect();
    sorted.sort_by(f64::total_cmp);
    let median = (!sorted.is_empty()).then(|| {
        let n = sorted.len();
        if n % 2 == 1 {
            sorted[n / 2]
        } else {
            (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0
        }
    });
    json!({
        "zones": zones.len(),
        "complete": complete.len(),
        "cheapest": pick(cheapest),
        "priciest": pick(priciest),
        "average": (!sorted.is_empty()).then(|| r3(sorted.iter().sum::<f64>() / sorted.len() as f64)),
        "median": median.map(r3),
        "negative": complete
            .iter()
            .filter(|z| z["negative"]["ms"].as_i64().unwrap_or(0) > 0)
            .map(|z| z["area"].clone())
            .collect::<Vec<_>>(),
    })
}

// ---------------------------------------------------------------------------
// Zone state
// ---------------------------------------------------------------------------

/// Zones (ours or outside) that share a border with `zone`
pub fn neighbours(zone: &str) -> Vec<&'static str> {
    let mut v: Vec<&'static str> = crate::flows::BORDERS
        .iter()
        .filter_map(|&(a, b)| {
            if a == zone {
                Some(b)
            } else if b == zone {
                Some(a)
            } else {
                None
            }
        })
        .collect();
    v.sort_unstable();
    v.dedup();
    v
}

/// `GET /api/v2/local/zones[?area=SE3|country=sv]`: every zone right now: price, today's and
/// tomorrow's average, generation per type, load, net flows per neighbour and reservoirs
pub async fn zones(State(st): State<WebState>, Query(q): Query<DayQuery>) -> Response {
    let sc = match scope(q.area.as_deref(), q.country.as_deref()) {
        Ok(s) => s,
        Err(r) => return r,
    };
    let app = &st.app;
    let (prices, gen, flows) = match (
        data::now_prices(app).await,
        data::current_generation_and_load(app).await,
        data::current_flows(app).await,
    ) {
        (Ok(p), Ok(g), Ok(f)) => (p, g, f),
        (Err(e), _, _) | (_, Err(e), _) | (_, _, Err(e)) => return failed(e),
    };
    let mut out = vec![];
    for c in COUNTRIES {
        if sc.is_some_and(|s| s.0.id != c.id) {
            continue;
        }
        let tz = c.timezone();
        let t = today(&tz);
        for a in c.areas {
            if sc.and_then(|s| s.1).is_some_and(|x| x.name != a.name) {
                continue;
            }
            let mut days = BTreeMap::new();
            for (k, d) in [("today", t), ("tomorrow", add_days(t, 1))] {
                let (from, to) = day_range(&tz, d);
                let rows = match data::spot_selected(
                    app,
                    a.name,
                    from,
                    to,
                    &IntervalMode::Prefer(c.interval.into()),
                    tz.clone(),
                )
                .await
                {
                    Ok(r) => r,
                    Err(e) => return failed(e),
                };
                let covered: i64 = rows.iter().map(|r| r.2).sum();
                days.insert(
                    k,
                    crate::price::weighted_avg(&rows).map(|avg| {
                        json!({
                            "day": d.to_string(),
                            "avg": r3(avg),
                            "min": rows.iter().map(|r| r.1).reduce(f64::min),
                            "max": rows.iter().map(|r| r.1).reduce(f64::max),
                            "complete": covered >= to - from + 1 - HOUR_MS,
                        })
                    }),
                );
            }
            let g = gen.iter().find(|g| g.area == a.id);
            let flows_now: BTreeMap<String, f64> = flows
                .borders
                .iter()
                .filter_map(|b| {
                    if b.from == a.name {
                        Some((b.to.clone(), b.value))
                    } else if b.to == a.name {
                        Some((b.from.clone(), -b.value))
                    } else {
                        None
                    }
                })
                .collect();
            let reservoir = match data::reservoirs(app, data::FlowScope::Area(a.name)).await {
                Ok(r) if r.latest.is_some() => {
                    let r = (*r).clone().at(now_ms());
                    json!({
                        "year": r.year, "week": r.week, "gwh": r.latest, "change": r.change,
                        "median": r.median, "vs_median_pct": r.vs_median_pct,
                        "share_of_max": r.share_of_max, "age_weeks": r.age_weeks, "stale": r.stale,
                    })
                }
                Ok(_) => Value::Null,
                Err(e) => return failed(e),
            };
            out.push(json!({
                "area": a.name,
                "long": a.long,
                "country": c.id,
                "timezone": tz.iana_name(),
                "interval": c.interval,
                "neighbours": neighbours(a.name),
                "price_now": prices.areas.get(a.name).map(|p| r3(*p)),
                "today": days.get("today"),
                "tomorrow": days.get("tomorrow"),
                "generation": g.map(|g| json!({
                    "period": g.period,
                    "interval": g.interval,
                    "total_mw": g.generation_total,
                    "load_mw": g.load_total,
                    "net_mw": g.net_generation,
                    "by_type_mw": g.mix.iter().cloned().collect::<BTreeMap<_, _>>(),
                    "derived": g.derived,
                })),
                "flows_mw": {
                    "updated": flows.updated,
                    "net_export": flows_now.values().sum::<f64>(),
                    "by_neighbour": flows_now,
                },
                "reservoir": reservoir,
            }));
        }
    }
    reply(
        StatusCode::OK,
        json!({ "status": "ok", "time": now_ms(), "unit": { "price": "EUR/MWh", "power": "MW", "energy": "GWh" }, "data": out }),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use jiff::civil::date;

    fn stat(d: Date, avg: f64) -> DayStat {
        DayStat {
            date: d,
            avg,
            min: avg - 10.0,
            max: avg + 10.0,
        }
    }

    #[test]
    fn day_compared_with_history() {
        let start = date(2025, 1, 1);
        let mut h: Vec<DayStat> = (0..400).map(|i| stat(add_days(start, i), 50.0)).collect();
        h[10].avg = 200.0;
        h[399].avg = 150.0;
        let v = compare(&h, &h[399]);
        assert_eq!(v["days"], 399);
        assert_eq!(v["high_since"]["date"], add_days(start, 10).to_string());
        assert_eq!(v["high_since"]["days"], 389);
        assert_eq!(v["low_since"]["days"], 1);
        assert_eq!(v["prev_day"]["pct"], 200.0);
        assert_eq!(v["percentile_365"], 100.0);
        assert!(v["percentile_all"].as_f64().unwrap() > 99.0);

        // A record: nothing before was as high
        h[10].avg = 50.0;
        let v = compare(&h, &h[399]);
        assert_eq!(v["high_since"]["record"], true);
        assert!(v["high_since"]["date"].is_null());
    }

    #[test]
    fn neighbours_of_a_zone() {
        let n = neighbours("SE3");
        assert!(
            n.contains(&"SE2") && n.contains(&"SE4") && n.contains(&"NO1"),
            "{n:?}"
        );
        assert!(!n.contains(&"SE3"));
    }

    #[test]
    fn overview_of_complete_zones() {
        let z = |a: &str, avg: f64, complete: bool, neg: i64| json!({ "area": a, "avg": avg, "complete": complete, "negative": { "ms": neg } });
        let v = overview(&[
            z("SE1", 10.0, true, HOUR_MS),
            z("SE2", 30.0, true, 0),
            z("DE-LU", 90.0, true, 0),
            z("FR", 500.0, false, 0),
        ]);
        assert_eq!(v["complete"], 3);
        assert_eq!(v["cheapest"]["area"], "SE1");
        assert_eq!(v["priciest"]["area"], "DE-LU");
        assert_eq!(v["median"], 30.0);
        assert_eq!(v["negative"], json!(["SE1"]));
    }
}
