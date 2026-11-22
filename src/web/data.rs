//! Cached data access shared by API and pages

use std::collections::BTreeMap;
use std::sync::Arc;
use std::time::Duration;

use jiff::civil::Date;
use jiff::tz::TimeZone;
use serde::Serialize;

use crate::countries::{Country, COUNTRIES};
use crate::db::queries::{self, ExchangeRates, GenLoadRow, GenerationRow, LoadRow, OutageRow};
use crate::price::{group, select_rows, Grouping, IntervalMode, SpotApiRow};
use crate::timeutil::{day_range, interval_ms, month_range, now_ms, HOUR_MS};
use crate::App;

const MIN: u64 = 60;

pub async fn exchange_rates(app: &App) -> anyhow::Result<Arc<ExchangeRates>> {
    let db = app.db.clone();
    app.cache
        .get_or_load(
            "exrate",
            "latest".into(),
            Duration::from_secs(6 * 3600),
            || async move { db.run(|c| Ok(queries::exchange_rates(c)?)).await },
        )
        .await
}

/// Selected (interval-resolved) rows for an area: `(time, price EUR/MWh, duration ms)`
/// Time zone part of a cache key
fn tz_key(tz: &TimeZone) -> &str {
    tz.iana_name().unwrap_or("UTC")
}

pub async fn spot_selected(
    app: &App,
    area: &str,
    from: i64,
    to: i64,
    mode: &IntervalMode,
    tz: TimeZone,
) -> anyhow::Result<Arc<Vec<(i64, f64, i64)>>> {
    let key = format!("sel:{area}:{from}:{to}:{mode:?}:{}", tz_key(&tz));
    let ttl = if to < now_ms() { 3600 } else { 6 * MIN };
    let db = app.db.clone();
    let area = area.to_string();
    let mode = mode.clone();
    app.cache
        .get_or_load("spotprice", key, Duration::from_secs(ttl), || async move {
            let rows = db
                .run(move |c| Ok(queries::spot_rows(c, &area, from, to)?))
                .await?;
            Ok(select_rows(&rows, &mode, &tz))
        })
        .await
}

/// Grouped spot prices in EUR/MWh, the core of `/api/v2/spot`.
///
/// For calendar groupings (daily up to yearly) the range is split at the start of the
/// current group. Closed groups do not change when the hourly price job writes new rows,
/// so they are cached in their own realm and only the current group is recomputed. The
/// start page asks for monthly prices since 2021 per area, which would otherwise read and
/// group the whole history again after every price job.
pub async fn spot_grouped(
    app: &App,
    area: &str,
    from: i64,
    to: i64,
    grouping: Grouping,
    mode: &IntervalMode,
    tz: TimeZone,
) -> anyhow::Result<Arc<Vec<SpotApiRow>>> {
    let calendar = matches!(
        grouping,
        Grouping::Daily | Grouping::Weekly | Grouping::Monthly | Grouping::Yearly
    );
    if calendar {
        if let Some(split) = crate::price::bucket(grouping, &tz, now_ms()) {
            if from < split && split <= to {
                let closed = grouped_range(
                    app,
                    HISTORY_REALM,
                    area,
                    from,
                    split - 1,
                    grouping,
                    mode,
                    tz.clone(),
                )
                .await?;
                let open =
                    grouped_range(app, "spotprice", area, split, to, grouping, mode, tz).await?;
                let mut rows = Vec::with_capacity(closed.len() + open.len());
                rows.extend(closed.iter().cloned());
                rows.extend(open.iter().cloned());
                return Ok(Arc::new(rows));
            }
        }
    }
    grouped_range(app, "spotprice", area, from, to, grouping, mode, tz).await
}

/// Cache realm for grouped prices of closed calendar groups. Not invalidated by the price
/// job; the TTL covers late corrections and back-fills.
const HISTORY_REALM: &str = "spothist";

#[allow(clippy::too_many_arguments)]
async fn grouped_range(
    app: &App,
    realm: &'static str,
    area: &str,
    from: i64,
    to: i64,
    grouping: Grouping,
    mode: &IntervalMode,
    tz: TimeZone,
) -> anyhow::Result<Arc<Vec<SpotApiRow>>> {
    let key = format!(
        "grp:{area}:{from}:{to}:{grouping:?}:{mode:?}:{}",
        tz_key(&tz)
    );
    let ttl = if realm == HISTORY_REALM {
        6 * 3600
    } else if to < now_ms() {
        3600
    } else {
        6 * MIN
    };
    let app2 = app.clone();
    let (area, mode) = (area.to_string(), mode.clone());
    app.cache
        .get_or_load(realm, key, Duration::from_secs(ttl), || async move {
            if matches!(grouping, Grouping::Hourly | Grouping::Minimum) {
                // Short ranges (max 31 days), share the selected rows with the pages
                let sel = spot_selected(&app2, &area, from, to, &mode, tz.clone()).await?;
                return Ok(group(&sel, grouping, &tz));
            }
            // Long ranges: do not keep the (large) selected rows in the cache
            let rows = app2
                .db
                .run(move |c| Ok(queries::spot_rows(c, &area, from, to)?))
                .await?;
            Ok(group(&select_rows(&rows, &mode, &tz), grouping, &tz))
        })
        .await
}

/// Prices for one local day as `(time, price)` pairs plus resolution in ms
#[derive(Debug, Clone, Serialize, Default)]
pub struct DaySeries {
    pub points: Vec<(i64, f64)>,
    pub interval: i64,
}

impl DaySeries {
    pub fn stats(&self) -> Option<(f64, f64, f64)> {
        crate::price::stats(&self.points.iter().map(|p| p.1).collect::<Vec<_>>())
    }
    pub fn price_at(&self, t: i64) -> Option<f64> {
        crate::price::price_at(&self.points, self.interval, t)
    }
}

pub async fn day_series(
    app: &App,
    country: &Country,
    area: &str,
    date: Date,
) -> anyhow::Result<DaySeries> {
    let tz = country.timezone();
    let (from, to) = day_range(&tz, date);
    let sel = spot_selected(
        app,
        area,
        from,
        to,
        &IntervalMode::Prefer(country.interval.into()),
        tz,
    )
    .await?;
    let interval = sel
        .first()
        .map(|r| r.2)
        .unwrap_or_else(|| interval_ms(country.interval));
    Ok(DaySeries {
        points: sel.iter().map(|r| (r.0, r.1)).collect(),
        interval,
    })
}

/// avg/min/max (EUR/MWh) of a local calendar month
pub async fn month_stats(
    app: &App,
    country: &Country,
    area: &str,
    date: Date,
) -> anyhow::Result<Option<(f64, f64, f64)>> {
    let tz = country.timezone();
    let (from, to) = month_range(&tz, date);
    let sel = spot_selected(
        app,
        area,
        from,
        to,
        &IntervalMode::Prefer(country.interval.into()),
        tz,
    )
    .await?;
    Ok(crate::price::stats(
        &sel.iter().map(|r| r.1).collect::<Vec<_>>(),
    ))
}

/// Current price per area (EUR/MWh) and per country (average of its areas)
#[derive(Debug, Clone, Default, Serialize)]
pub struct NowPrices {
    pub areas: BTreeMap<String, f64>,
    pub countries: BTreeMap<String, f64>,
    /// Upcoming rows per area so the browser can roll the "now" value forward
    pub upcoming: BTreeMap<String, Vec<(i64, f64, i64)>>,
}

pub async fn now_prices(app: &App) -> anyhow::Result<Arc<NowPrices>> {
    let now = now_ms();
    let slot = now - now.rem_euclid(15 * 60_000);
    let db = app.db.clone();
    app.cache
        .get_or_load(
            "spotprice",
            format!("now:{slot}"),
            Duration::from_secs(5 * MIN),
            || async move {
                let rows = db
                    .run(move |c| {
                        Ok(queries::spot_rows_all(
                            c,
                            now - 3 * HOUR_MS,
                            now + 2 * HOUR_MS,
                        )?)
                    })
                    .await?;
                let mut out = NowPrices::default();
                for country in COUNTRIES {
                    let tz = country.timezone();
                    let mut sum = 0.0;
                    let mut n = 0;
                    for area in country.areas {
                        let area_rows: Vec<_> = rows
                            .iter()
                            .filter(|(a, _)| a == area.name)
                            .map(|(_, r)| r.clone())
                            .collect();
                        let sel = select_rows(
                            &area_rows,
                            &IntervalMode::Prefer(country.interval.into()),
                            &tz,
                        );
                        if let Some(r) = sel.iter().find(|r| r.0 <= now && r.0 + r.2 > now) {
                            out.areas.insert(area.name.to_string(), r.1);
                            sum += r.1;
                            n += 1;
                        }
                        out.upcoming.insert(
                            area.name.to_string(),
                            sel.into_iter().filter(|r| r.0 + r.2 > now).collect(),
                        );
                    }
                    if n > 0 {
                        out.countries.insert(country.id.to_string(), sum / n as f64);
                    }
                }
                Ok(out)
            },
        )
        .await
}

/// Latest generation and load per area. The key is stable: the load and production jobs
/// invalidate the realm and call [`warm`], so visitors do not pay for the query.
pub async fn current_generation_and_load(app: &App) -> anyhow::Result<Arc<Vec<GenLoadRow>>> {
    let db = app.db.clone();
    app.cache
        .get_or_load(
            "generation",
            "cur".into(),
            Duration::from_secs(90 * MIN),
            || async move {
                let from = now_ms() - 12 * HOUR_MS;
                let from = from - from.rem_euclid(HOUR_MS);
                db.run(move |c| Ok(queries::current_generation_and_load(c, from)?))
                    .await
            },
        )
        .await
}

/// Reload the cached data behind the start page after a job has invalidated it
pub async fn warm(app: &App, realms: &[&str]) {
    let t0 = std::time::Instant::now();
    if realms.iter().any(|r| *r == "generation" || *r == "load") {
        if let Err(e) = current_generation_and_load(app).await {
            tracing::warn!(error = %format!("{e:#}"), "warming generation cache failed");
        }
    }
    if realms.contains(&"flow") {
        if let Err(e) = current_flows(app).await {
            tracing::warn!(error = %format!("{e:#}"), "warming flow cache failed");
        }
    }
    if realms.contains(&"spotprice") {
        if let Err(e) = now_prices(app).await {
            tracing::warn!(error = %format!("{e:#}"), "warming price cache failed");
        }
    }
    tracing::debug!(
        ms = t0.elapsed().as_millis() as u64,
        ?realms,
        "cache warmed"
    );
}

pub async fn generation(
    app: &App,
    area: &str,
    from: i64,
    to: i64,
    interval: &str,
) -> anyhow::Result<Arc<Vec<GenerationRow>>> {
    let db = app.db.clone();
    let (a, iv) = (area.to_string(), interval.to_string());
    app.cache
        .get_or_load(
            "generation",
            format!("gen:{area}:{from}:{to}:{interval}"),
            Duration::from_secs(30 * MIN),
            || async move {
                db.run(move |c| Ok(queries::generation(c, &a, from, to, &iv)?))
                    .await
            },
        )
        .await
}

pub async fn load(
    app: &App,
    area: &str,
    from: i64,
    to: i64,
    interval: &str,
) -> anyhow::Result<Arc<Vec<LoadRow>>> {
    let db = app.db.clone();
    let (a, iv) = (area.to_string(), interval.to_string());
    app.cache
        .get_or_load(
            "load",
            format!("load:{area}:{from}:{to}:{interval}"),
            Duration::from_secs(30 * MIN),
            || async move {
                db.run(move |c| Ok(queries::load(c, &a, from, to, &iv)?))
                    .await
            },
        )
        .await
}

pub async fn net_generation(
    app: &App,
    area: &str,
    from: i64,
    to: i64,
) -> anyhow::Result<Arc<Vec<(i64, f64)>>> {
    let db = app.db.clone();
    let a = area.to_string();
    app.cache
        .get_or_load(
            "generation",
            format!("net:{area}:{from}:{to}"),
            Duration::from_secs(30 * MIN),
            || async move {
                db.run(move |c| Ok(queries::net_generation(c, &a, from, to)?))
                    .await
            },
        )
        .await
}

pub async fn outages(
    app: &App,
    country: &str,
) -> anyhow::Result<Arc<(Vec<OutageRow>, Vec<OutageRow>)>> {
    let db = app.db.clone();
    let cid = country.to_string();
    let now = now_ms();
    app.cache
        .get_or_load(
            "outage",
            format!("o:{country}"),
            Duration::from_secs(15 * MIN),
            || async move {
                db.run(move |c| {
                    Ok((
                        queries::current_outages(c, &cid, now)?,
                        queries::future_outages(c, &cid, now)?,
                    ))
                })
                .await
            },
        )
        .await
}

/// Net flow per border at the latest stored time (last 12 hours)
pub async fn current_flows(app: &App) -> anyhow::Result<Arc<crate::flows::Flows>> {
    let now = now_ms();
    let slot = now - now.rem_euclid(15 * 60_000);
    let db = app.db.clone();
    app.cache
        .get_or_load(
            "flow",
            format!("cur:{slot}"),
            Duration::from_secs(15 * MIN),
            || async move {
                let rows = db
                    .run(move |c| Ok(queries::flow_rows(c, now - 12 * HOUR_MS, now + HOUR_MS)?))
                    .await?;
                Ok(crate::flows::latest(&rows))
            },
        )
        .await
}

/// Who a flow series is for: one zone, or every zone of a country
#[derive(Debug, Clone, Copy)]
pub enum FlowScope<'a> {
    Area(&'a str),
    Country(&'a str),
}

/// Hourly net export per neighbour for an area (per zone) or a country (per country), for
/// the hours in `[from, to)`. See [`crate::flows::area_series`].
pub async fn area_flows(
    app: &App,
    scope: FlowScope<'_>,
    from: i64,
    to: i64,
) -> anyhow::Result<Arc<crate::flows::AreaFlows>> {
    let (key, name) = match scope {
        FlowScope::Area(a) => ("a", a.to_string()),
        FlowScope::Country(c) => ("c", c.to_string()),
    };
    let ttl = if to < now_ms() - HOUR_MS {
        3600
    } else {
        15 * MIN
    };
    let db = app.db.clone();
    app.cache
        .get_or_load(
            "flow",
            format!("series:{key}:{name}:{from}:{to}"),
            Duration::from_secs(ttl),
            || async move {
                // Rows that start up to an hour earlier can cover the first hour
                let rows = db
                    .run(move |c| Ok(queries::flow_rows(c, from - HOUR_MS, to)?))
                    .await?;
                Ok(if key == "a" {
                    crate::flows::area_series(&rows, |z| z == name, str::to_string, from, to)
                } else {
                    let of = crate::flows::country_of;
                    crate::flows::area_series(&rows, |z| of(z) == name, of, from, to)
                })
            },
        )
        .await
}

/// Hourly net flow per border for the hours in `[from, to)`, for the time slider on the map
pub async fn border_flows(
    app: &App,
    from: i64,
    to: i64,
) -> anyhow::Result<Arc<crate::flows::BorderSeries>> {
    let ttl = if to < now_ms() - HOUR_MS {
        3600
    } else {
        15 * MIN
    };
    let db = app.db.clone();
    app.cache
        .get_or_load(
            "flow",
            format!("borders:{from}:{to}"),
            Duration::from_secs(ttl),
            || async move {
                let rows = db
                    .run(move |c| Ok(queries::flow_rows(c, from - HOUR_MS, to)?))
                    .await?;
                Ok(crate::flows::border_series(&rows, from, to))
            },
        )
        .await
}
