//! spotweb 2 - electricity spot prices, production and consumption from ENTSO-e.

mod cache;
mod countries;
mod db;
mod ecb;
mod entsoe;
mod flows;
mod health;
mod i18n;
mod jobs;
mod price;
mod timeutil;
mod web;
mod xml;

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Context;
use clap::{Args, Parser, Subcommand};
use jiff::civil::Date;
use jiff::tz::TimeZone;
use tracing_subscriber::EnvFilter;

#[derive(Parser)]
#[command(
    name = "spotweb",
    version,
    about = "Electricity spot prices from ENTSO-e - single binary server"
)]
struct Cli {
    #[command(flatten)]
    common: CommonArgs,
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Args, Clone)]
struct CommonArgs {
    /// SQLite database file
    #[arg(
        long,
        env = "SPOTWEB_DB",
        default_value = "db/spotweb.db",
        global = true
    )]
    db: PathBuf,
    /// Enable debug logging (same as RUST_LOG=spotweb=debug)
    #[arg(long, global = true)]
    debug: bool,
}

#[derive(Subcommand)]
enum Command {
    /// Run the web server and the built in scheduler (default)
    Serve(ServeArgs),
    /// Import history from a spotweb 1.x database
    ImportV1 {
        /// Path to the 1.x database
        #[arg(default_value = "db/main.db")]
        path: PathBuf,
    },
    /// Run one or more update jobs once and exit
    RunJob {
        #[arg(value_enum, required = true)]
        jobs: Vec<jobs::Job>,
    },
    /// Fetch prices again for stored days that are incomplete (e.g. history imported from 1.x,
    /// which did not store intervals with a price of exactly zero) and exit
    RepairPrices {
        /// First day to check (default SPOTWEB_HISTORY_START)
        #[arg(long)]
        from: Option<Date>,
        /// Areas to check, e.g. SE3 FR (default all)
        areas: Vec<String>,
    },
    /// Write a consistent copy of the database (safe while the server is running)
    Backup {
        /// Destination file. A name ending in `.zst` is written zstd-compressed.
        dest: PathBuf,
    },
}

#[derive(Args, Clone)]
struct ServeArgs {
    /// Port to listen on
    #[arg(long, env = "SPOTWEB_PORT", default_value_t = 6000)]
    port: u16,
    /// Address to bind
    #[arg(long, env = "SPOTWEB_BIND", default_value = "0.0.0.0")]
    bind: String,
    /// Do not run scheduled data updates (useful for development or a read-only replica)
    #[arg(long, alias = "no-schedules", env = "SPOTWEB_NO_SCHEDULER")]
    no_scheduler: bool,
}

impl Default for ServeArgs {
    fn default() -> Self {
        Self {
            port: std::env::var("SPOTWEB_PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(6000),
            bind: std::env::var("SPOTWEB_BIND").unwrap_or_else(|_| "0.0.0.0".into()),
            no_scheduler: std::env::var("SPOTWEB_NO_SCHEDULER")
                .map(|v| v == "1" || v == "true")
                .unwrap_or(false),
        }
    }
}

/// Runtime configuration, read from environment variables
#[derive(Debug, Clone)]
pub struct Config {
    /// Public base url, used in sitemap.xml (`SPOTWEB_PUBLIC_URL`)
    pub public_url: Option<String>,
    /// Google AdSense client id (`SPOTWEB_ADSENSE`, same as 1.x)
    pub adsense: Option<String>,
    /// Google Analytics measurement id (`SPOTWEB_GA_ID`)
    pub ga_id: Option<String>,
    /// Time zone for cron expressions (`SPOTWEB_SCHEDULE_TZ`)
    pub schedule_tz: TimeZone,
    /// First day to back-fill prices from on an empty database (`SPOTWEB_HISTORY_START`)
    pub history_start: Date,
    /// Content-Security-Policy for pages (`SPOTWEB_CSP`: `on`, `report-only` or `off`)
    pub csp: web::Csp,
}

fn env_opt(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let tz_name = env_opt("SPOTWEB_SCHEDULE_TZ").unwrap_or_else(|| "Europe/Stockholm".into());
        let schedule_tz =
            TimeZone::get(&tz_name).map_err(|e| anyhow::anyhow!("SPOTWEB_SCHEDULE_TZ: {e}"))?;
        let history_start = match env_opt("SPOTWEB_HISTORY_START") {
            Some(s) => s
                .parse::<Date>()
                .context("SPOTWEB_HISTORY_START must be YYYY-MM-DD")?,
            None => jiff::civil::date(2021, 1, 1),
        };
        let csp = match env_opt("SPOTWEB_CSP").as_deref() {
            None | Some("on") | Some("1") | Some("true") => web::Csp::Enforce,
            Some("report-only") => web::Csp::ReportOnly,
            Some("off") | Some("0") | Some("false") => web::Csp::Off,
            Some(other) => {
                anyhow::bail!("SPOTWEB_CSP must be on, report-only or off, not {other:?}")
            }
        };
        Ok(Self {
            public_url: env_opt("SPOTWEB_PUBLIC_URL").map(|u| u.trim_end_matches('/').to_string()),
            adsense: env_opt("SPOTWEB_ADSENSE"),
            ga_id: env_opt("SPOTWEB_GA_ID"),
            schedule_tz,
            history_start,
            csp,
        })
    }
}

/// Shared application state
#[derive(Clone)]
pub struct App(Arc<AppInner>);

pub struct AppInner {
    pub db: db::Db,
    pub cache: cache::Cache,
    pub entsoe: entsoe::Client,
    pub cfg: Config,
    pub job_locks: jobs::JobLocks,
    pub i18n: i18n::I18n,
    pub http_stats: web::metrics::HttpStats,
}

impl std::ops::Deref for App {
    type Target = AppInner;
    fn deref(&self) -> &AppInner {
        &self.0
    }
}

impl App {
    pub fn new(db: db::Db, cfg: Config) -> anyhow::Result<Self> {
        let token = env_opt("API_TOKEN")
            .or_else(|| env_opt("SPOTWEB_API_TOKEN"))
            .unwrap_or_default();
        Ok(Self(Arc::new(AppInner {
            db,
            cache: cache::Cache::new(),
            entsoe: entsoe::Client::new(token)?,
            cfg,
            job_locks: jobs::JobLocks::new(),
            i18n: i18n::I18n::load()?,
            http_stats: web::metrics::HttpStats::from_env(),
        })))
    }
}

fn init_logging(debug: bool) {
    let default = if debug {
        "spotweb=debug,tower_http=debug,info"
    } else {
        "spotweb=info,warn"
    };
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(default));
    // journald adds its own timestamps
    let under_systemd = std::env::var_os("JOURNAL_STREAM").is_some();
    // No colour codes in the journal or in redirected output (NO_COLOR is respected too)
    let ansi = !under_systemd
        && std::env::var_os("NO_COLOR").is_none()
        && std::io::IsTerminal::is_terminal(&std::io::stdout());
    let builder = tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .with_ansi(ansi);
    if under_systemd {
        builder.without_time().init();
    } else {
        builder.init();
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    #[cfg(unix)]
    let term = async {
        if let Ok(mut s) = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        {
            s.recv().await;
        }
    };
    #[cfg(not(unix))]
    let term = std::future::pending::<()>();
    tokio::select! {
        _ = ctrl_c => {},
        _ = term => {},
    }
    tracing::info!("shutting down");
}

async fn serve(app: App, args: ServeArgs) -> anyhow::Result<()> {
    if !app.entsoe.has_token() {
        tracing::warn!(
            "API_TOKEN not set, ENTSO-e data will not be updated (exchange rates still are)"
        );
    }
    let scheduler = if args.no_scheduler {
        tracing::info!("scheduler disabled");
        None
    } else {
        Some(jobs::start_scheduler(app.clone()).await?)
    };

    let addr: SocketAddr = format!("{}:{}", args.bind, args.port)
        .parse()
        .context("invalid bind address")?;
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .with_context(|| format!("binding {addr}"))?;
    web::metrics::spawn_summary(app.clone());
    tracing::info!(%addr, db = %app.db.path().display(), version = env!("CARGO_PKG_VERSION"), "spotweb listening");
    axum::serve(listener, web::router(app))
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    if let Some(s) = scheduler {
        let _ = s.shutdown().await;
    }
    Ok(())
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    init_logging(cli.common.debug);
    let cfg = Config::from_env()?;
    let database = db::Db::open(&cli.common.db)
        .with_context(|| format!("opening {}", cli.common.db.display()))?;

    match cli.command.unwrap_or(Command::Serve(ServeArgs::default())) {
        Command::Serve(args) => serve(App::new(database, cfg)?, args).await,
        Command::ImportV1 { path } => {
            let report =
                tokio::task::spawn_blocking(move || db::import::import_v1(&database, &path))
                    .await??;
            println!("{}", serde_json::to_string_pretty(&report)?);
            Ok(())
        }
        Command::RunJob { jobs: list } => {
            let app = App::new(database, cfg)?;
            let mut failed = false;
            for job in list {
                match jobs::run(&app, job, false).await {
                    Ok(m) => println!("{}: {m}", job.name()),
                    Err(e) => {
                        failed = true;
                        eprintln!("{}: FAILED {e:#}", job.name());
                    }
                }
            }
            if failed {
                std::process::exit(1);
            }
            Ok(())
        }
        Command::RepairPrices { from, areas } => {
            let app = App::new(database, cfg)?;
            let (report, failed) = jobs::repair_prices(&app, from, &areas).await?;
            println!("{report}");
            if failed {
                std::process::exit(1);
            }
            Ok(())
        }
        Command::Backup { dest } => {
            tokio::task::spawn_blocking(move || database.backup_to(&dest)).await??;
            println!("backup written");
            Ok(())
        }
    }
}
