//! Cached data access shared by API and pages

use std::collections::BTreeMap;
use std::sync::Arc;
use std::time::Duration;

use chrono::NaiveDate;
use chrono_tz::Tz;
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
pub async fn spot_selected(
    app: &App,
    area: &str,
    from: i64,
    to: i64,
    mode: &IntervalMode,
    tz: Tz,
) -> anyhow::Result<Arc<Vec<(i64, f64, i64)>>> {
    let key = format!("sel:{area}:{from}:{to}:{mode:?}:{tz}");
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

/// Grouped spot prices in EUR/MWh, the core of `/api/v2/spot`
pub async fn spot_grouped(
    app: &App,
    area: &str,
    from: i64,
    to: i64,
    grouping: Grouping,
    mode: &IntervalMode,
    tz: Tz,
) -> anyhow::Result<Arc<Vec<SpotApiRow>>> {
    let key = format!("grp:{area}:{from}:{to}:{grouping:?}:{mode:?}:{tz}");
    let mut ttl = if to < now_ms() { 3600 } else { 6 * MIN };
    if grouping == Grouping::Monthly || grouping == Grouping::Yearly {
        ttl = 6 * 3600;
    }
    let sel = spot_selected(app, area, from, to, mode, tz).await?;
    app.cache
        .get_or_load("spotprice", key, Duration::from_secs(ttl), || async move {
            Ok(group(&sel, grouping, &tz))
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
    date: NaiveDate,
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
    date: NaiveDate,
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

pub async fn current_generation_and_load(app: &App) -> anyhow::Result<Arc<Vec<GenLoadRow>>> {
    let from = now_ms() - 12 * HOUR_MS;
    let from = from - from.rem_euclid(HOUR_MS);
    let db = app.db.clone();
    app.cache
        .get_or_load(
            "generation",
            format!("cur:{from}"),
            Duration::from_secs(30 * MIN),
            || async move {
                db.run(move |c| Ok(queries::current_generation_and_load(c, from)?))
                    .await
            },
        )
        .await
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
