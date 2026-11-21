//! Data update jobs and the built in scheduler (replaces the Pup cron processes of 1.x).

use std::collections::HashMap;
use std::future::Future;
use std::sync::{Arc, OnceLock};
use std::time::{Duration, Instant};

use anyhow::Context;
use chrono::{DateTime, Months, NaiveDate, Offset, TimeZone, Utc};
use chrono_tz::Tz;
use tokio::sync::{Mutex, Semaphore};
use tokio::task::JoinSet;
use tokio_cron_scheduler::{Job as CronJob, JobScheduler};

use crate::countries::{Area, Country, COUNTRIES};
use crate::db::queries::{self, AreaFailure, RunStatus};
use crate::timeutil::{local_date, local_midnight, now_ms, today, HOUR_MS};
use crate::App;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, clap::ValueEnum)]
pub enum Job {
    Prices,
    Currency,
    Outages,
    Load,
    Production,
    Flows,
}

impl Job {
    pub const ALL: [Job; 6] = [
        Job::Currency,
        Job::Prices,
        Job::Load,
        Job::Production,
        Job::Flows,
        Job::Outages,
    ];

    pub fn name(&self) -> &'static str {
        match self {
            Job::Prices => "prices",
            Job::Currency => "currency",
            Job::Outages => "outages",
            Job::Load => "load",
            Job::Production => "production",
            Job::Flows => "flows",
        }
    }

    /// Cron expressions (with seconds) in the scheduler time zone. Same timing as 1.x pup.jsonc,
    /// plus a currency run after ECB publishes (around 16:00 CET).
    pub fn schedules(&self) -> &'static [&'static str] {
        match self {
            Job::Prices => &["0 0 * * * *", "0 45 12 * * *", "0 15,30,45 13 * * *"],
            Job::Currency => &["0 5 9 * * *", "0 20 16 * * *"],
            Job::Outages => &["0 5 8 * * *"],
            Job::Load => &["0 5 * * * *"],
            Job::Production => &["0 50 * * * *"],
            Job::Flows => &["0 25 * * * *"],
        }
    }

    fn timeout(&self) -> Duration {
        match self {
            Job::Currency => Duration::from_secs(60),
            Job::Outages => Duration::from_secs(3600),
            // A first run back-fills all history since 2021
            Job::Prices => Duration::from_secs(4 * 3600),
            // Two requests per border
            Job::Flows => Duration::from_secs(1800),
            _ => Duration::from_secs(900),
        }
    }

    fn cache_realms(&self) -> &'static [&'static str] {
        match self {
            Job::Prices => &["spotprice"],
            Job::Currency => &["exrate", "spotprice"],
            Job::Outages => &["outage"],
            Job::Load | Job::Production => &["load", "generation"],
            Job::Flows => &["flow"],
        }
    }
}

fn env_num<T: std::str::FromStr>(name: &str) -> Option<T> {
    std::env::var(name).ok().and_then(|v| v.trim().parse().ok())
}

/// Pause after each ENTSO-e request, per worker (`SPOTWEB_REQUEST_DELAY_MS`, default 2000)
fn pause() -> Duration {
    static P: OnceLock<Duration> = OnceLock::new();
    if cfg!(test) {
        return Duration::ZERO;
    }
    *P.get_or_init(|| Duration::from_millis(env_num("SPOTWEB_REQUEST_DELAY_MS").unwrap_or(2000)))
}

/// Number of areas fetched at the same time (`SPOTWEB_ENTSOE_CONCURRENCY`, default 3).
/// ENTSO-e allows 400 requests per minute, the requests themselves take 20-30 s.
fn concurrency() -> usize {
    static C: OnceLock<usize> = OnceLock::new();
    *C.get_or_init(|| {
        env_num::<usize>("SPOTWEB_ENTSOE_CONCURRENCY")
            .unwrap_or(3)
            .clamp(1, 10)
    })
}

/// Retries of the whole job when it fails completely
const RETRIES: usize = 2;
const RETRY_DELAY: Duration = Duration::from_secs(120);
/// Retries of a single ENTSO-e request (timeouts, 5xx, 599, 429)
const AREA_RETRIES: usize = 2;
/// Wait before retrying a request; rate limiting (429/503) waits four times as long
fn area_retry_delay() -> Duration {
    if cfg!(test) {
        Duration::from_millis(10)
    } else {
        Duration::from_secs(15)
    }
}

#[derive(Default)]
pub struct JobLocks(HashMap<Job, Arc<Mutex<()>>>);

impl JobLocks {
    pub fn new() -> Self {
        Self(
            Job::ALL
                .iter()
                .map(|j| (*j, Arc::new(Mutex::new(()))))
                .collect(),
        )
    }
}

/// Result of a job that finished. Areas that failed make it `partial`.
#[derive(Debug, Default)]
pub struct Outcome {
    pub message: String,
    pub failures: Vec<AreaFailure>,
    /// Whether any stored data changed. When nothing did, the cache is kept as it is.
    pub changed: bool,
}

impl Outcome {
    fn status(&self) -> RunStatus {
        if self.failures.is_empty() {
            RunStatus::Ok
        } else {
            RunStatus::Partial
        }
    }
}

/// Run a job with overlap protection, timeout, retries and bookkeeping.
pub async fn run(app: &App, job: Job, retry: bool) -> anyhow::Result<String> {
    let lock = app.job_locks.0.get(&job).expect("lock").clone();
    let Ok(_guard) = lock.try_lock() else {
        tracing::info!(job = job.name(), "already running, skipping");
        return Ok("skipped, already running".into());
    };
    let attempts = if retry { RETRIES + 1 } else { 1 };
    let mut last_err = None;
    for attempt in 1..=attempts {
        let id = app
            .db
            .run(move |c| Ok(queries::job_started(c, job.name(), now_ms())?))
            .await?;
        tracing::info!(job = job.name(), attempt, "job started");
        let t0 = Instant::now();
        let result = match tokio::time::timeout(job.timeout(), run_inner(app, job)).await {
            Ok(r) => r,
            Err(_) => Err(anyhow::anyhow!("timed out after {:?}", job.timeout())),
        };
        // A failed run may have written part of its data before failing
        let changed = result.as_ref().map(|o| o.changed).unwrap_or(true);
        if changed {
            for realm in job.cache_realms() {
                app.cache.invalidate(realm);
            }
            if job != Job::Currency && job != Job::Outages {
                // New rows can change the best query plans
                if let Err(e) = app.db.run(|c| crate::db::optimize(c, false)).await {
                    tracing::warn!(error = %format!("{e:#}"), "database optimize failed");
                }
            }
            crate::web::data::warm(app, job.cache_realms()).await;
        }
        let (status, msg, failures) = match &result {
            Ok(o) => (o.status(), o.message.clone(), o.failures.clone()),
            Err(e) => (RunStatus::Failed, format!("{e:#}"), vec![]),
        };
        let m2 = msg.clone();
        app.db
            .run(move |c| {
                Ok(queries::job_finished(
                    c,
                    id,
                    now_ms(),
                    status,
                    &m2,
                    &failures,
                )?)
            })
            .await?;
        let secs = t0.elapsed().as_secs();
        match result {
            Ok(o) if o.failures.is_empty() => {
                tracing::info!(job = job.name(), secs, result = %o.message, "job done");
                return Ok(o.message);
            }
            Ok(o) => {
                let areas: Vec<&str> = o.failures.iter().map(|f| f.area.as_str()).collect();
                tracing::warn!(job = job.name(), secs, result = %o.message, failed = %areas.join(","), "job partially done");
                return Ok(o.message);
            }
            Err(e) => {
                tracing::error!(job = job.name(), attempt, secs, error = %msg, "job failed");
                last_err = Some(e);
                if attempt < attempts {
                    tokio::time::sleep(RETRY_DELAY).await;
                }
            }
        }
    }
    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("job failed")))
}

async fn run_inner(app: &App, job: Job) -> anyhow::Result<Outcome> {
    if job != Job::Currency && !app.entsoe.has_token() {
        return Ok(Outcome {
            message: "skipped, no ENTSO-e API token (API_TOKEN)".into(),
            ..Default::default()
        });
    }
    match job {
        Job::Prices => update_prices(app).await,
        Job::Currency => update_currency(app).await,
        Job::Outages => update_outages(app).await,
        Job::Load => update_load(app).await,
        Job::Production => update_production(app).await,
        Job::Flows => update_flows(app).await,
    }
}

fn utc(t: DateTime<Tz>) -> DateTime<Utc> {
    t.with_timezone(&Utc)
}

async fn update_currency(app: &App) -> anyhow::Result<Outcome> {
    let rates = crate::ecb::fetch().await.context("fetching ECB rates")?;
    let date = rates.date.clone();
    // Stored at midnight UTC of the ECB date
    let period = NaiveDate::parse_from_str(&date, "%Y-%m-%d")?
        .and_hms_opt(0, 0, 0)
        .map(|n| Utc.from_utc_datetime(&n).timestamp_millis())
        .context("bad date")?;
    let stored = app
        .db
        .run(move |c| Ok(queries::has_exchange_rates_for(c, period)?))
        .await?;
    let message = if stored {
        format!("rates for {date} already stored")
    } else {
        let n = rates.entries.len();
        app.db
            .run(move |c| {
                Ok(queries::insert_exchange_rates(
                    c,
                    &rates.date,
                    period,
                    &rates.entries,
                )?)
            })
            .await?;
        format!("stored {n} rates for {date}")
    };
    Ok(Outcome {
        message,
        changed: !stored,
        ..Default::default()
    })
}

/// One ENTSO-e request with retries for transient errors, followed by the configured pause.
async fn request<T, F, Fut>(area: &str, what: &str, f: F) -> anyhow::Result<T>
where
    F: Fn() -> Fut,
    Fut: Future<Output = anyhow::Result<T>>,
{
    let mut attempt = 0;
    let result = loop {
        attempt += 1;
        match f().await {
            Ok(v) => break Ok(v),
            Err(e) => match crate::entsoe::retry_delay(&e, area_retry_delay()) {
                Some(delay) if attempt <= AREA_RETRIES => {
                    tracing::warn!(
                        area,
                        attempt,
                        retry_in_s = delay.as_secs(),
                        error = %format!("{e:#}"),
                        "{what} request failed, retrying"
                    );
                    tokio::time::sleep(delay).await;
                }
                _ => break Err(e),
            },
        }
    };
    tokio::time::sleep(pause()).await;
    result
}

/// Run `f` for every bidding zone, at most [`concurrency`] at a time. Results are returned in
/// [`COUNTRIES`] order. Each area is logged at info level (or as a warning when it fails).
async fn for_each_area<T, F, Fut>(
    job: Job,
    f: F,
) -> Vec<(&'static Country, &'static Area, anyhow::Result<T>)>
where
    T: std::fmt::Display + Send + 'static,
    F: Fn(&'static Country, &'static Area) -> Fut,
    Fut: Future<Output = anyhow::Result<T>> + Send + 'static,
{
    let sem = Arc::new(Semaphore::new(concurrency()));
    let mut set = JoinSet::new();
    let mut index = 0usize;
    for country in COUNTRIES {
        for area in country.areas {
            let fut = f(country, area);
            let sem = sem.clone();
            let i = index;
            index += 1;
            set.spawn(async move {
                let _permit = sem.acquire_owned().await.expect("semaphore");
                let t0 = Instant::now();
                let r = fut.await;
                let ms = t0.elapsed().as_millis() as u64;
                match &r {
                    Ok(v) => tracing::info!(job = job.name(), area = area.name, ms, "{v}"),
                    Err(e) => tracing::warn!(job = job.name(), area = area.name, ms, error = %format!("{e:#}"), "area failed"),
                }
                (i, country, area, r)
            });
        }
    }
    let mut out = Vec::with_capacity(index);
    while let Some(res) = set.join_next().await {
        match res {
            Ok(r) => out.push(r),
            Err(e) => tracing::error!(job = job.name(), error = %e, "area task panicked"),
        }
    }
    out.sort_by_key(|r| r.0);
    out.into_iter().map(|(_, c, a, r)| (c, a, r)).collect()
}

/// Sum the per-area results into an [`Outcome`]. Fails only when every area failed.
fn summarize<T>(
    results: &[(&'static Country, &'static Area, anyhow::Result<T>)],
    rows: impl Fn(&T) -> usize,
    what: &str,
) -> anyhow::Result<Outcome> {
    let mut total = 0;
    let mut failures = vec![];
    for (_, area, r) in results {
        match r {
            Ok(v) => total += rows(v),
            Err(e) => failures.push(AreaFailure {
                area: area.name.to_string(),
                error: format!("{e:#}"),
            }),
        }
    }
    if !results.is_empty() && failures.len() == results.len() {
        let list: Vec<String> = failures
            .iter()
            .map(|f| format!("{}: {}", f.area, f.error))
            .collect();
        anyhow::bail!("all {what} requests failed: {}", list.join("; "));
    }
    let mut message = format!("stored {total} {what} rows");
    if !failures.is_empty() {
        message.push_str(&format!(", {} areas failed", failures.len()));
    }
    Ok(Outcome {
        message,
        failures,
        changed: total > 0,
    })
}

/// Where to start fetching prices for an area so that everything up to `end` is stored.
/// `None` when the last stored interval already reaches the end (nothing to fetch).
/// A day whose last hour is stored is complete and is not fetched again; a partially
/// stored day is.
fn price_fetch_start(
    tz: &Tz,
    max_stored: Option<i64>,
    history_start: NaiveDate,
    end: DateTime<Tz>,
) -> Option<NaiveDate> {
    let Some(max) = max_stored else {
        return Some(history_start);
    };
    if max >= end.timestamp_millis() - HOUR_MS {
        return None;
    }
    let day = local_date(tz, max);
    let next = day.succ_opt()?;
    if max >= local_midnight(tz, next).timestamp_millis() - HOUR_MS {
        Some(next)
    } else {
        Some(day)
    }
}

/// Time zone and hour of the earliest day-ahead auction (Switzerland's at 11:00 CET, the
/// European SDAC auction follows at 12:00 with results from about 12:45).
const AUCTION_TZ: Tz = chrono_tz::Europe::Brussels;
const AUCTION_EARLIEST_HOUR: i64 = 11;

/// Whether day-ahead prices for the local calendar day `day` can have been published at `now`.
/// They come from an auction the day before; asking ENTSO-e earlier only returns "no data".
fn day_ahead_published(day: NaiveDate, now: DateTime<Utc>) -> bool {
    let Some(auction_day) = day.pred_opt() else {
        return true;
    };
    let earliest =
        local_midnight(&AUCTION_TZ, auction_day) + chrono::Duration::hours(AUCTION_EARLIEST_HOUR);
    now >= earliest
}

struct PriceResult {
    rows: usize,
    requests: usize,
    /// Everything published so far is stored, the next day is not auctioned yet
    waiting: bool,
}

impl std::fmt::Display for PriceResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if self.waiting {
            write!(f, "prices up to date, next day not auctioned yet")
        } else if self.requests == 0 {
            write!(f, "prices up to date")
        } else {
            write!(
                f,
                "stored {} price rows ({} requests)",
                self.rows, self.requests
            )
        }
    }
}

async fn area_prices(
    app: App,
    country: &'static Country,
    area: &'static Area,
) -> anyhow::Result<PriceResult> {
    let tz = country.timezone();
    // Up to and including tomorrow
    let end = local_midnight(&tz, today(&tz) + chrono::Duration::days(2));
    let name = area.name;
    let max = app
        .db
        .run(move |c| Ok(queries::max_spot_period(c, name)?))
        .await?;
    let mut res = PriceResult {
        rows: 0,
        requests: 0,
        waiting: false,
    };
    let Some(mut start_date) = price_fetch_start(&tz, max, app.cfg.history_start, end) else {
        return Ok(res);
    };
    if !day_ahead_published(start_date, Utc::now()) {
        res.waiting = true;
        return Ok(res);
    }
    while local_midnight(&tz, start_date) < end {
        let chunk_start = local_midnight(&tz, start_date);
        let next = start_date
            .checked_add_months(Months::new(1))
            .unwrap_or(start_date);
        let chunk_end = local_midnight(&tz, next).min(end);
        tracing::debug!(area = name, from = %chunk_start, to = %chunk_end, "fetching prices");
        res.requests += 1;
        let points = request(name, "price", || {
            app.entsoe
                .day_ahead_prices(area.eic, utc(chunk_start), utc(chunk_end))
        })
        .await?;
        if points.is_empty() {
            tracing::debug!(area = name, "no new prices");
            break;
        }
        let rows: Vec<(i64, String, f64)> = points
            .into_iter()
            .map(|p| (p.start, p.interval, p.value))
            .collect();
        let cid = country.id;
        res.rows += app
            .db
            .run(move |c| Ok(queries::upsert_spot(c, cid, name, &rows)?))
            .await?;
        start_date = next;
    }
    Ok(res)
}

async fn update_prices(app: &App) -> anyhow::Result<Outcome> {
    let results = for_each_area(Job::Prices, |country, area| {
        area_prices(app.clone(), country, area)
    })
    .await;
    let skipped = results
        .iter()
        .filter(|r| matches!(&r.2, Ok(p) if p.requests == 0))
        .count();
    let mut o = summarize(&results, |p| p.rows, "price")?;
    if skipped > 0 {
        o.message
            .push_str(&format!(", {skipped} areas already complete"));
    }
    Ok(o)
}

/// Yesterday and today (local time): the most that load, production and flows fetch.
fn recent_window(tz: &Tz) -> (DateTime<Utc>, DateTime<Utc>) {
    let t = today(tz);
    (
        utc(local_midnight(tz, t - chrono::Duration::days(1))),
        utc(local_midnight(tz, t + chrono::Duration::days(1))),
    )
}

/// Hours fetched again before the latest stored interval, for values that arrive late or
/// are revised shortly after.
const LOOKBACK_MS: i64 = 6 * HOUR_MS;
/// Local hour of the one run a day that fetches all of yesterday and today again, so values
/// that arrive or change later than [`LOOKBACK_MS`] are picked up as well.
const FULL_REFRESH_HOUR: u32 = 6;

/// What to fetch of the recent window, given the start of the latest stored interval.
/// Only the last few hours are fetched again, except when nothing is stored yet and once a day.
fn fetch_window(
    tz: &Tz,
    window: (DateTime<Utc>, DateTime<Utc>),
    latest: Option<i64>,
    now: DateTime<Utc>,
) -> (DateTime<Utc>, DateTime<Utc>) {
    use chrono::Timelike;
    let (full_start, end) = window;
    let Some(latest) = latest else {
        return window;
    };
    if now.with_timezone(tz).hour() == FULL_REFRESH_HOUR {
        return window;
    }
    let floor_hour = |ms: i64| ms.div_euclid(HOUR_MS) * HOUR_MS;
    let start = floor_hour(latest.min(now.timestamp_millis()) - LOOKBACK_MS)
        .max(full_start.timestamp_millis());
    match Utc.timestamp_millis_opt(start).single() {
        Some(start) => (start, end),
        None => window,
    }
}

/// Recompute the country totals for every country where at least one area succeeded
async fn aggregate_countries<T>(
    app: &App,
    results: &[(&'static Country, &'static Area, anyhow::Result<T>)],
) -> anyhow::Result<()> {
    for country in COUNTRIES {
        if !results
            .iter()
            .any(|(c, _, r)| c.id == country.id && r.is_ok())
        {
            continue;
        }
        let since = recent_window(&country.timezone()).0.timestamp_millis();
        let ids: Vec<&'static str> = country.areas.iter().map(|a| a.id).collect();
        app.db
            .run(move |c| Ok(queries::aggregate_country(c, country.cty, &ids, since)?))
            .await?;
    }
    Ok(())
}

/// Row count for the per-area log line
struct Rows(usize, &'static str);

impl std::fmt::Display for Rows {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "stored {} {} rows", self.0, self.1)
    }
}

async fn update_production(app: &App) -> anyhow::Result<Outcome> {
    let results = for_each_area(Job::Production, |country, area| {
        let app = app.clone();
        async move {
            let tz = country.timezone();
            let id = area.id;
            let latest = app
                .db
                .run(move |c| Ok(queries::max_generation_period(c, id)?))
                .await?;
            let (start, end) = fetch_window(&tz, recent_window(&tz), latest, Utc::now());
            let points = request(area.name, "generation", || {
                app.entsoe.generation(area.eic, start, end)
            })
            .await?;
            let rows: Vec<(i64, String, String, i64, f64)> = points
                .into_iter()
                .map(|p| (p.start, p.interval, p.psr, p.consumption as i64, p.value))
                .collect();
            let n = app
                .db
                .run(move |c| Ok(queries::upsert_generation(c, id, &rows)?))
                .await?;
            Ok(Rows(n, "generation"))
        }
    })
    .await;
    aggregate_countries(app, &results).await?;
    summarize(&results, |r| r.0, "generation")
}

async fn update_load(app: &App) -> anyhow::Result<Outcome> {
    let results = for_each_area(Job::Load, |country, area| {
        let app = app.clone();
        async move {
            let tz = country.timezone();
            let id = area.id;
            let latest = app
                .db
                .run(move |c| Ok(queries::max_load_period(c, id)?))
                .await?;
            let (start, end) = fetch_window(&tz, recent_window(&tz), latest, Utc::now());
            let points =
                request(area.name, "load", || app.entsoe.load(area.eic, start, end)).await?;
            let rows: Vec<(i64, String, f64)> = points
                .into_iter()
                .map(|p| (p.start, p.interval, p.value))
                .collect();
            let n = app
                .db
                .run(move |c| Ok(queries::upsert_load(c, id, &rows)?))
                .await?;
            Ok(Rows(n, "load"))
        }
    })
    .await;
    aggregate_countries(app, &results).await?;
    summarize(&results, |r| r.0, "load")
}

async fn update_outages(app: &App) -> anyhow::Result<Outcome> {
    let start = Utc::now() - chrono::Duration::days(30);
    let end = Utc::now() + chrono::Duration::days(30);
    let results = for_each_area(Job::Outages, |country, area| {
        let app = app.clone();
        async move {
            let outages = request(area.name, "outage", || {
                app.entsoe.outages(area.eic, start, end)
            })
            .await?;
            let cid = country.id;
            let n = app
                .db
                .run(move |c| Ok(queries::replace_outages(c, cid, &outages)?))
                .await?;
            Ok(Rows(n, "outage"))
        }
    })
    .await;
    summarize(&results, |r| r.0, "outage")
}

/// Physical flows for every border direction, at most yesterday and today (Stockholm time,
/// see [`fetch_window`]), at most [`concurrency`] requests at a time.
async fn update_flows(app: &App) -> anyhow::Result<Outcome> {
    let tz = chrono_tz::Europe::Stockholm;
    let window = recent_window(&tz);
    let sem = Arc::new(Semaphore::new(concurrency()));
    let mut set = JoinSet::new();
    for (from, to) in crate::flows::directions() {
        let (Some(out_eic), Some(in_eic)) = (crate::flows::eic(from), crate::flows::eic(to)) else {
            continue;
        };
        let app = app.clone();
        let sem = sem.clone();
        set.spawn(async move {
            let _permit = sem.acquire_owned().await.expect("semaphore");
            let name = format!("{from}>{to}");
            let t0 = Instant::now();
            let r: anyhow::Result<usize> = async {
                let latest = app
                    .db
                    .run(move |c| Ok(queries::max_flow_period(c, from, to)?))
                    .await?;
                let (start, end) = fetch_window(&tz, window, latest, Utc::now());
                let points = request(&name, "flow", || {
                    app.entsoe.physical_flows(out_eic, in_eic, start, end)
                })
                .await?;
                let rows: Vec<(i64, String, f64)> = points
                    .into_iter()
                    .map(|p| (p.start, p.interval, p.value))
                    .collect();
                app.db
                    .run(move |c| Ok(queries::upsert_flows(c, from, to, &rows)?))
                    .await
            }
            .await;
            let ms = t0.elapsed().as_millis() as u64;
            match &r {
                Ok(n) => tracing::info!(job = "flows", border = %name, ms, "stored {n} flow rows"),
                Err(e) => tracing::warn!(job = "flows", border = %name, ms, error = %format!("{e:#}"), "border failed"),
            }
            (name, r)
        });
    }
    let mut results = vec![];
    while let Some(res) = set.join_next().await {
        match res {
            Ok(r) => results.push(r),
            Err(e) => tracing::error!(job = "flows", error = %e, "flow task panicked"),
        }
    }
    results.sort_by(|a, b| a.0.cmp(&b.0));
    let mut total = 0;
    let mut failures = vec![];
    for (name, r) in &results {
        match r {
            Ok(n) => total += n,
            Err(e) => failures.push(AreaFailure {
                area: name.clone(),
                error: format!("{e:#}"),
            }),
        }
    }
    if !results.is_empty() && failures.len() == results.len() {
        anyhow::bail!(
            "all flow requests failed: {}",
            failures.first().map(|f| f.error.as_str()).unwrap_or("")
        );
    }
    let mut message = format!("stored {total} flow rows");
    if !failures.is_empty() {
        message.push_str(&format!(", {} directions failed", failures.len()));
    }
    Ok(Outcome {
        message,
        failures,
        changed: total > 0,
    })
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

fn offset_now(tz: &Tz) -> i32 {
    tz.offset_from_utc_datetime(&Utc::now().naive_utc())
        .fix()
        .local_minus_utc()
}

async fn register(sched: &JobScheduler, app: &App) -> anyhow::Result<Vec<uuid::Uuid>> {
    let mut ids = vec![];
    for job in Job::ALL {
        for expr in job.schedules() {
            let app = app.clone();
            let j = CronJob::new_async_tz(*expr, app.cfg.schedule_tz, move |_id, _l| {
                let app = app.clone();
                Box::pin(async move {
                    let _ = run(&app, job, true).await;
                })
            })
            .with_context(|| format!("bad cron expression {expr}"))?;
            ids.push(sched.add(j).await?);
        }
    }
    Ok(ids)
}

/// Start the scheduler. tokio-cron-scheduler freezes the UTC offset when a job is
/// created, so jobs are re-registered whenever the scheduler time zone changes offset (DST).
pub async fn start_scheduler(app: App) -> anyhow::Result<JobScheduler> {
    let sched = JobScheduler::new().await?;
    let mut ids = register(&sched, &app).await?;
    sched.start().await?;
    tracing::info!(tz = %app.cfg.schedule_tz, "scheduler started");

    let s2 = sched.clone();
    let app2 = app.clone();
    tokio::spawn(async move {
        let tz = app2.cfg.schedule_tz;
        let mut offset = offset_now(&tz);
        loop {
            tokio::time::sleep(Duration::from_secs(60)).await;
            let now = offset_now(&tz);
            if now != offset {
                tracing::info!("time zone offset changed, re-registering scheduled jobs");
                for id in ids.drain(..) {
                    let _ = s2.remove(&id).await;
                }
                match register(&s2, &app2).await {
                    Ok(new_ids) => ids = new_ids,
                    Err(e) => tracing::error!(error = %e, "failed re-registering jobs"),
                }
                offset = now;
            }
        }
    });

    // Catch up right away instead of waiting for the next tick
    let app3 = app.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_secs(5)).await;
        let _ = run(&app3, Job::Currency, false).await;
        let _ = run(&app3, Job::Prices, false).await;
    });
    Ok(sched)
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use std::sync::atomic::{AtomicUsize, Ordering};

    use axum::extract::{Query, State};
    use axum::http::StatusCode;

    use super::*;
    use crate::countries::COUNTRIES;
    use crate::db::Db;
    use crate::timeutil::HOUR_MS;

    fn stockholm() -> Tz {
        chrono_tz::Europe::Stockholm
    }

    fn date(y: i32, m: u32, d: u32) -> NaiveDate {
        NaiveDate::from_ymd_opt(y, m, d).unwrap()
    }

    #[test]
    fn fetch_start_skips_complete_days() {
        let tz = stockholm();
        let hist = date(2021, 1, 1);
        // Today is 21 Nov, so everything up to the end of 22 Nov is wanted
        let end = local_midnight(&tz, date(2026, 11, 23));
        let ms = |d: NaiveDate, h: i64, m: i64| {
            local_midnight(&tz, d).timestamp_millis() + h * HOUR_MS + m * 60_000
        };
        assert_eq!(price_fetch_start(&tz, None, hist, end), Some(hist));
        // Tomorrow fully stored at 15 minutes or 60 minutes: nothing to fetch
        assert_eq!(
            price_fetch_start(&tz, Some(ms(date(2026, 11, 22), 23, 45)), hist, end),
            None
        );
        assert_eq!(
            price_fetch_start(&tz, Some(ms(date(2026, 11, 22), 23, 0)), hist, end),
            None
        );
        // Today complete, tomorrow not published: only tomorrow is fetched
        assert_eq!(
            price_fetch_start(&tz, Some(ms(date(2026, 11, 21), 23, 45)), hist, end),
            Some(date(2026, 11, 22))
        );
        // Tomorrow partially stored: fetch it again
        assert_eq!(
            price_fetch_start(&tz, Some(ms(date(2026, 11, 22), 12, 0)), hist, end),
            Some(date(2026, 11, 22))
        );
        // DST change (25 hour day): last hour still starts at 23:00 local
        let end = local_midnight(&tz, date(2026, 10, 26));
        assert_eq!(
            price_fetch_start(&tz, Some(ms(date(2026, 10, 25), 24, 0)), hist, end),
            None
        );
        assert_eq!(
            price_fetch_start(&tz, Some(ms(date(2026, 10, 25), 23, 0)), hist, end),
            Some(date(2026, 10, 25))
        );
    }

    #[test]
    fn day_ahead_waits_for_auction() {
        let brussels = |d: NaiveDate, h: i64, m: i64| {
            utc(local_midnight(&AUCTION_TZ, d)
                + chrono::Duration::hours(h)
                + chrono::Duration::minutes(m))
        };
        let tomorrow = date(2026, 11, 22);
        // Not auctioned yet in the morning
        assert!(!day_ahead_published(
            tomorrow,
            brussels(date(2026, 11, 21), 0, 0)
        ));
        assert!(!day_ahead_published(
            tomorrow,
            brussels(date(2026, 11, 21), 10, 59)
        ));
        // From the earliest auction on
        assert!(day_ahead_published(
            tomorrow,
            brussels(date(2026, 11, 21), 11, 0)
        ));
        assert!(day_ahead_published(
            tomorrow,
            brussels(date(2026, 11, 21), 13, 15)
        ));
        // Today and history are always published
        assert!(day_ahead_published(
            date(2026, 11, 21),
            brussels(date(2026, 11, 21), 0, 0)
        ));
        assert!(day_ahead_published(
            date(2021, 1, 1),
            brussels(date(2026, 11, 21), 0, 0)
        ));
        // Finland: 00:30 local is still the day before in Brussels, the day after tomorrow
        // (Finnish time) is not auctioned until 11:00 CET
        let helsinki = chrono_tz::Europe::Helsinki;
        let now =
            utc(local_midnight(&helsinki, date(2026, 11, 22)) + chrono::Duration::minutes(30));
        assert!(!day_ahead_published(date(2026, 11, 23), now));
        assert!(day_ahead_published(date(2026, 11, 22), now));
    }

    #[test]
    fn fetch_window_refetches_only_recent_hours() {
        let tz = stockholm();
        let at = |d: NaiveDate, h: i64, m: i64| {
            utc(local_midnight(&tz, d) + chrono::Duration::hours(h) + chrono::Duration::minutes(m))
        };
        let window = (at(date(2026, 11, 20), 0, 0), at(date(2026, 11, 22), 0, 0));
        let now = at(date(2026, 11, 21), 14, 5);
        // Nothing stored: the whole window
        assert_eq!(fetch_window(&tz, window, None, now), window);
        // Latest at 12:45: from six hours before, rounded down to the hour
        let latest = at(date(2026, 11, 21), 12, 45).timestamp_millis();
        assert_eq!(
            fetch_window(&tz, window, Some(latest), now),
            (at(date(2026, 11, 21), 6, 0), window.1)
        );
        // Latest long ago: never before the start of the window
        let old = at(date(2026, 11, 1), 0, 0).timestamp_millis();
        assert_eq!(fetch_window(&tz, window, Some(old), now), window);
        // Latest in the future (bad data): based on now instead
        let future = at(date(2026, 11, 21), 23, 0).timestamp_millis();
        assert_eq!(
            fetch_window(&tz, window, Some(future), now),
            (at(date(2026, 11, 21), 8, 0), window.1)
        );
        // The daily full refresh fetches the whole window again
        let six = at(date(2026, 11, 21), 6, 5);
        assert_eq!(fetch_window(&tz, window, Some(latest), six), window);
    }

    #[test]
    fn retry_policy() {
        use crate::entsoe::RequestError as E;
        let base = Duration::from_secs(15);
        assert_eq!(E::UpstreamTimeout.retry_delay(base), Some(base));
        assert_eq!(E::Timeout(base).retry_delay(base), Some(base));
        assert_eq!(E::Http(502).retry_delay(base), Some(base));
        assert_eq!(E::RateLimited.retry_delay(base), Some(base * 4));
        assert_eq!(E::Http(503).retry_delay(base), Some(base * 4));
        assert_eq!(E::Unauthorized.retry_delay(base), None);
        assert_eq!(E::Http(400).retry_delay(base), None);
        assert!(E::UpstreamTimeout
            .to_string()
            .contains("upstream timeout (HTTP 599"));
        assert_eq!(
            crate::entsoe::retry_delay(&anyhow::anyhow!("bad xml"), base),
            None
        );
    }

    fn eic(name: &str) -> &'static str {
        COUNTRIES
            .iter()
            .flat_map(|c| c.areas)
            .find(|a| a.name == name)
            .unwrap()
            .eic
    }

    /// Prices for today and tomorrow (Stockholm), hourly
    fn price_doc() -> String {
        let tz = stockholm();
        let start = utc(local_midnight(&tz, today(&tz)));
        let end = utc(local_midnight(&tz, today(&tz) + chrono::Duration::days(2)));
        let hours = (end - start).num_hours();
        let points: String = (1..=hours)
            .map(|p| {
                format!("<Point><position>{p}</position><price.amount>{p}.5</price.amount></Point>")
            })
            .collect();
        format!(
            "<Publication_MarketDocument><TimeSeries><curveType>A01</curveType><Period>\
             <timeInterval><start>{}</start><end>{}</end></timeInterval><resolution>PT60M</resolution>{points}\
             </Period></TimeSeries></Publication_MarketDocument>",
            start.format("%Y-%m-%dT%H:%MZ"),
            end.format("%Y-%m-%dT%H:%MZ")
        )
    }

    #[derive(Clone, Default)]
    struct Mock {
        calls: Arc<parking_lot::Mutex<HashMap<String, usize>>>,
        total: Arc<AtomicUsize>,
    }

    /// SE1: 599 once, then prices. SE2: always 599. SE3: slower than the client timeout.
    /// SE4: 401. Everything else: no data.
    async fn entsoe_mock(
        State(m): State<Mock>,
        Query(q): Query<HashMap<String, String>>,
    ) -> (StatusCode, String) {
        m.total.fetch_add(1, Ordering::Relaxed);
        let area = q.get("in_Domain").cloned().unwrap_or_default();
        let n = {
            let mut calls = m.calls.lock();
            let n = calls.entry(area.clone()).or_default();
            *n += 1;
            *n
        };
        let no_data = "<Acknowledgement_MarketDocument><Reason><code>999</code><text>No matching data found</text></Reason></Acknowledgement_MarketDocument>";
        let upstream_timeout = StatusCode::from_u16(599).unwrap();
        if area == eic("SE1") {
            if n == 1 {
                return (upstream_timeout, String::new());
            }
            return (StatusCode::OK, price_doc());
        }
        if area == eic("SE2") {
            return (upstream_timeout, String::new());
        }
        if area == eic("SE3") {
            tokio::time::sleep(Duration::from_millis(1500)).await;
            return (StatusCode::OK, no_data.into());
        }
        if area == eic("SE4") {
            return (StatusCode::UNAUTHORIZED, String::new());
        }
        (StatusCode::OK, no_data.into())
    }

    async fn test_app(mock: Mock) -> App {
        let router = axum::Router::new()
            .route("/api", axum::routing::get(entsoe_mock))
            .with_state(mock);
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        tokio::spawn(async move { axum::serve(listener, router).await.unwrap() });
        let cfg = crate::Config {
            public_url: None,
            adsense: None,
            ga_id: None,
            schedule_tz: stockholm(),
            history_start: today(&stockholm()),
        };
        let mut app = App::new(Db::open_memory(), cfg).unwrap();
        let entsoe = crate::entsoe::Client::with_endpoint(
            "token".into(),
            format!("http://{addr}/api"),
            Duration::from_millis(500),
        )
        .unwrap();
        Arc::get_mut(&mut app.0).unwrap().entsoe = entsoe;
        app
    }

    #[tokio::test]
    async fn flows_job_stores_every_direction() {
        let mock = Mock::default();
        let app = test_app(mock.clone()).await;
        let msg = run(&app, Job::Flows, false).await.unwrap();
        let directions = crate::flows::directions().count();
        // Every direction is requested once; SE1-SE4 in_Domain mocks fail or answer with prices,
        // which are not a flow document, the rest has no data
        assert!(mock.total.load(Ordering::Relaxed) >= directions);
        assert!(msg.starts_with("stored 0 flow rows"), "{msg}");
        let runs = app
            .db
            .run(|c| Ok(queries::latest_job_runs(c)?))
            .await
            .unwrap();
        let r = runs.iter().find(|r| r.job == "flows").unwrap();
        assert_eq!(r.status, RunStatus::Partial);
        assert!(r.failures.iter().all(|f| f.area.contains('>')));
        assert!(r
            .failures
            .iter()
            .any(|f| f.area.ends_with(">SE4") && f.error.contains("401")));
    }

    #[tokio::test]
    async fn prices_retry_partial_and_skip() {
        let mock = Mock::default();
        let app = test_app(mock.clone()).await;
        let msg = run(&app, Job::Prices, false).await.unwrap();
        let areas = COUNTRIES.iter().map(|c| c.areas.len()).sum::<usize>();
        let calls = |a: &str| mock.calls.lock().get(eic(a)).copied().unwrap_or(0);
        // SE1 recovered after one retry, SE2 and SE3 gave up after two retries, SE4 is not retried
        assert_eq!(calls("SE1"), 2);
        assert_eq!(calls("SE2"), 3);
        assert_eq!(calls("SE3"), 3);
        assert_eq!(calls("SE4"), 1);
        assert_eq!(calls("FI"), 1);
        assert_eq!(mock.total.load(Ordering::Relaxed), areas + 1 + 2 + 2);

        let tz = stockholm();
        let rows = (local_midnight(&tz, today(&tz) + chrono::Duration::days(2))
            - local_midnight(&tz, today(&tz)))
        .num_hours() as usize;
        assert_eq!(msg, format!("stored {rows} price rows, 3 areas failed"));

        let runs = app
            .db
            .run(|c| Ok(queries::latest_job_runs(c)?))
            .await
            .unwrap();
        let r = runs.iter().find(|r| r.job == "prices").unwrap();
        assert_eq!(r.status, RunStatus::Partial);
        let failed: Vec<(&str, &str)> = r
            .failures
            .iter()
            .map(|f| (f.area.as_str(), f.error.as_str()))
            .collect();
        assert_eq!(failed.len(), 3);
        assert_eq!(failed[0].0, "SE2");
        assert!(failed[0].1.contains("upstream timeout"), "{}", failed[0].1);
        assert_eq!(failed[1].0, "SE3");
        assert!(failed[1].1.contains("spotweb timeout"), "{}", failed[1].1);
        assert_eq!(failed[2].0, "SE4");
        assert!(failed[2].1.contains("401"), "{}", failed[2].1);

        // Second run: SE1 is complete up to the end of tomorrow and is not fetched again
        run(&app, Job::Prices, false).await.unwrap();
        assert_eq!(calls("SE1"), 2);
        assert_eq!(calls("FI"), 2);
    }
}
