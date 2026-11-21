//! Data update jobs and the built in scheduler (replaces the Pup cron processes of 1.x).

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use anyhow::Context;
use chrono::{DateTime, Months, NaiveDate, Offset, TimeZone, Utc};
use chrono_tz::Tz;
use tokio::sync::Mutex;
use tokio_cron_scheduler::{Job as CronJob, JobScheduler};

use crate::countries::COUNTRIES;
use crate::db::queries;
use crate::timeutil::{local_date, local_midnight, now_ms, today};
use crate::App;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, clap::ValueEnum)]
pub enum Job {
    Prices,
    Currency,
    Outages,
    Load,
    Production,
}

impl Job {
    pub const ALL: [Job; 5] = [
        Job::Currency,
        Job::Prices,
        Job::Load,
        Job::Production,
        Job::Outages,
    ];

    pub fn name(&self) -> &'static str {
        match self {
            Job::Prices => "prices",
            Job::Currency => "currency",
            Job::Outages => "outages",
            Job::Load => "load",
            Job::Production => "production",
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
        }
    }

    fn timeout(&self) -> Duration {
        match self {
            Job::Currency => Duration::from_secs(60),
            Job::Outages => Duration::from_secs(3600),
            // A first run back-fills all history since 2021
            Job::Prices => Duration::from_secs(4 * 3600),
            _ => Duration::from_secs(900),
        }
    }

    fn cache_realms(&self) -> &'static [&'static str] {
        match self {
            Job::Prices => &["spotprice"],
            Job::Currency => &["exrate", "spotprice"],
            Job::Outages => &["outage"],
            Job::Load | Job::Production => &["load", "generation"],
        }
    }
}

/// Pause between ENTSO-e requests (`SPOTWEB_REQUEST_DELAY_MS`, default 2000)
fn pause() -> Duration {
    static P: std::sync::OnceLock<Duration> = std::sync::OnceLock::new();
    *P.get_or_init(|| {
        Duration::from_millis(
            std::env::var("SPOTWEB_REQUEST_DELAY_MS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(2000),
        )
    })
}
const RETRIES: usize = 2;
const RETRY_DELAY: Duration = Duration::from_secs(120);

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
        let result = match tokio::time::timeout(job.timeout(), run_inner(app, job)).await {
            Ok(r) => r,
            Err(_) => Err(anyhow::anyhow!("timed out after {:?}", job.timeout())),
        };
        for realm in job.cache_realms() {
            app.cache.invalidate(realm);
        }
        let (ok, msg) = match &result {
            Ok(m) => (true, m.clone()),
            Err(e) => (false, format!("{e:#}")),
        };
        let m2 = msg.clone();
        app.db
            .run(move |c| Ok(queries::job_finished(c, id, now_ms(), ok, &m2)?))
            .await?;
        match result {
            Ok(m) => {
                tracing::info!(job = job.name(), result = %m, "job done");
                return Ok(m);
            }
            Err(e) => {
                tracing::error!(job = job.name(), attempt, error = %msg, "job failed");
                last_err = Some(e);
                if attempt < attempts {
                    tokio::time::sleep(RETRY_DELAY).await;
                }
            }
        }
    }
    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("job failed")))
}

async fn run_inner(app: &App, job: Job) -> anyhow::Result<String> {
    if job != Job::Currency && !app.entsoe.has_token() {
        return Ok("skipped, no ENTSO-e API token (API_TOKEN)".into());
    }
    match job {
        Job::Prices => update_prices(app).await,
        Job::Currency => update_currency(app).await,
        Job::Outages => update_outages(app).await,
        Job::Load => update_load(app).await,
        Job::Production => update_production(app).await,
    }
}

fn utc(t: DateTime<Tz>) -> DateTime<Utc> {
    t.with_timezone(&Utc)
}

async fn update_currency(app: &App) -> anyhow::Result<String> {
    let rates = crate::ecb::fetch().await.context("fetching ECB rates")?;
    let date = rates.date.clone();
    // Stored at midnight UTC of the ECB date
    let period = NaiveDate::parse_from_str(&date, "%Y-%m-%d")?
        .and_hms_opt(0, 0, 0)
        .map(|n| Utc.from_utc_datetime(&n).timestamp_millis())
        .context("bad date")?;
    if app
        .db
        .run(move |c| Ok(queries::has_exchange_rates_for(c, period)?))
        .await?
    {
        return Ok(format!("rates for {date} already stored"));
    }
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
    Ok(format!("stored {n} rates for {date}"))
}

async fn update_prices(app: &App) -> anyhow::Result<String> {
    let mut total = 0usize;
    let mut errors = vec![];
    for country in COUNTRIES {
        let tz = country.timezone();
        // Up to and including tomorrow
        let end = local_midnight(&tz, today(&tz) + chrono::Duration::days(2));
        for area in country.areas {
            let name = area.name;
            let max = app
                .db
                .run(move |c| Ok(queries::max_spot_period(c, name)?))
                .await?;
            // Re-fetch the last stored day so partially published days get completed
            let mut start_date = match max {
                Some(ms) => local_date(&tz, ms),
                None => app.cfg.history_start,
            };
            while local_midnight(&tz, start_date) < end {
                let chunk_start = local_midnight(&tz, start_date);
                let next = start_date
                    .checked_add_months(Months::new(1))
                    .unwrap_or(start_date);
                let chunk_end = local_midnight(&tz, next).min(end);
                tracing::debug!(area = name, from = %chunk_start, to = %chunk_end, "fetching prices");
                match app
                    .entsoe
                    .day_ahead_prices(area.eic, utc(chunk_start), utc(chunk_end))
                    .await
                {
                    Ok(points) if points.is_empty() => {
                        tracing::debug!(area = name, "no new prices");
                        tokio::time::sleep(pause()).await;
                        break;
                    }
                    Ok(points) => {
                        let rows: Vec<(i64, String, f64)> = points
                            .into_iter()
                            .map(|p| (p.start, p.interval, p.value))
                            .collect();
                        let cid = country.id;
                        let n = app
                            .db
                            .run(move |c| Ok(queries::upsert_spot(c, cid, name, &rows)?))
                            .await?;
                        tracing::info!(area = name, rows = n, from = %chunk_start, "stored prices");
                        total += n;
                    }
                    Err(e) => {
                        tracing::warn!(area = name, error = %format!("{e:#}"), "price request failed");
                        errors.push(format!("{name}: {e}"));
                        tokio::time::sleep(pause()).await;
                        break;
                    }
                }
                start_date = next;
                tokio::time::sleep(pause()).await;
            }
        }
    }
    if total == 0
        && !errors.is_empty()
        && errors.len() >= COUNTRIES.iter().map(|c| c.areas.len()).sum::<usize>()
    {
        anyhow::bail!("all price requests failed: {}", errors.join("; "));
    }
    Ok(format!(
        "stored {total} price rows, {} errors",
        errors.len()
    ))
}

fn recent_window(tz: &Tz) -> (DateTime<Utc>, DateTime<Utc>) {
    let t = today(tz);
    (
        utc(local_midnight(tz, t - chrono::Duration::days(1))),
        utc(local_midnight(tz, t + chrono::Duration::days(1))),
    )
}

async fn aggregate(
    app: &App,
    country: &'static crate::countries::Country,
    since: i64,
) -> anyhow::Result<()> {
    let ids: Vec<&'static str> = country.areas.iter().map(|a| a.id).collect();
    app.db
        .run(move |c| Ok(queries::aggregate_country(c, country.cty, &ids, since)?))
        .await?;
    Ok(())
}

async fn update_production(app: &App) -> anyhow::Result<String> {
    let mut total = 0;
    let mut errors = 0;
    for country in COUNTRIES {
        let tz = country.timezone();
        let (start, end) = recent_window(&tz);
        for area in country.areas {
            match app.entsoe.generation(area.eic, start, end).await {
                Ok(points) => {
                    let rows: Vec<(i64, String, String, i64, f64)> = points
                        .into_iter()
                        .map(|p| (p.start, p.interval, p.psr, p.consumption as i64, p.value))
                        .collect();
                    let id = area.id;
                    total += app
                        .db
                        .run(move |c| Ok(queries::upsert_generation(c, id, &rows)?))
                        .await?;
                }
                Err(e) => {
                    errors += 1;
                    tracing::warn!(area = area.name, error = %format!("{e:#}"), "generation request failed");
                }
            }
            tokio::time::sleep(pause()).await;
        }
        aggregate(app, country, start.timestamp_millis()).await?;
    }
    Ok(format!("stored {total} generation rows, {errors} errors"))
}

async fn update_load(app: &App) -> anyhow::Result<String> {
    let mut total = 0;
    let mut errors = 0;
    for country in COUNTRIES {
        let tz = country.timezone();
        let (start, end) = recent_window(&tz);
        for area in country.areas {
            match app.entsoe.load(area.eic, start, end).await {
                Ok(points) => {
                    let rows: Vec<(i64, String, f64)> = points
                        .into_iter()
                        .map(|p| (p.start, p.interval, p.value))
                        .collect();
                    let id = area.id;
                    total += app
                        .db
                        .run(move |c| Ok(queries::upsert_load(c, id, &rows)?))
                        .await?;
                }
                Err(e) => {
                    errors += 1;
                    tracing::warn!(area = area.name, error = %format!("{e:#}"), "load request failed");
                }
            }
            tokio::time::sleep(pause()).await;
        }
        aggregate(app, country, start.timestamp_millis()).await?;
    }
    Ok(format!("stored {total} load rows, {errors} errors"))
}

async fn update_outages(app: &App) -> anyhow::Result<String> {
    let mut total = 0;
    let mut errors = 0;
    let start = Utc::now() - chrono::Duration::days(30);
    let end = Utc::now() + chrono::Duration::days(30);
    for country in COUNTRIES {
        for area in country.areas {
            match app.entsoe.outages(area.eic, start, end).await {
                Ok(outages) => {
                    let cid = country.id;
                    total += app
                        .db
                        .run(move |c| Ok(queries::replace_outages(c, cid, &outages)?))
                        .await?;
                }
                Err(e) => {
                    errors += 1;
                    tracing::warn!(area = area.name, error = %format!("{e:#}"), "outage request failed");
                }
            }
            tokio::time::sleep(pause()).await;
        }
    }
    Ok(format!("stored {total} outages, {errors} errors"))
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
