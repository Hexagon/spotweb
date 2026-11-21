//! SQLite storage. One file, WAL mode, a small connection pool. Every blocking
//! call runs on tokio's blocking thread pool.

pub mod import;
pub mod queries;

use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::Context;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Connection;

pub type Conn = r2d2::PooledConnection<SqliteConnectionManager>;

#[derive(Clone)]
pub struct Db {
    pool: Pool<SqliteConnectionManager>,
    path: PathBuf,
}

/// Ordered list of schema migrations. Never edit an applied entry, append new ones.
const MIGRATIONS: &[(i64, &str, &str)] = &[
    (
        1,
        "initial 2.0 schema",
        r#"
    CREATE TABLE spotprice (
        country   TEXT    NOT NULL,
        area      TEXT    NOT NULL,
        period    INTEGER NOT NULL,
        interval  TEXT    NOT NULL,
        spotprice REAL    NOT NULL,
        PRIMARY KEY (area, period, interval)
    ) WITHOUT ROWID;
    CREATE INDEX spotprice_period ON spotprice (period);

    CREATE TABLE exchangerate (
        currency TEXT    NOT NULL,
        period   INTEGER NOT NULL,
        date     TEXT    NOT NULL,
        value    REAL    NOT NULL,
        PRIMARY KEY (currency, period)
    ) WITHOUT ROWID;

    CREATE TABLE generation (
        area        TEXT    NOT NULL,
        period      INTEGER NOT NULL,
        interval    TEXT    NOT NULL,
        psr         TEXT    NOT NULL,
        consumption INTEGER NOT NULL DEFAULT 0,
        value       REAL    NOT NULL,
        PRIMARY KEY (area, period, interval, psr, consumption)
    ) WITHOUT ROWID;
    CREATE INDEX generation_period ON generation (period);

    CREATE TABLE load (
        area     TEXT    NOT NULL,
        period   INTEGER NOT NULL,
        interval TEXT    NOT NULL,
        value    REAL    NOT NULL,
        PRIMARY KEY (area, period, interval)
    ) WITHOUT ROWID;

    CREATE TABLE psr (
        psr       TEXT PRIMARY KEY,
        psr_group TEXT NOT NULL
    );
    INSERT INTO psr (psr, psr_group) VALUES
        ('B01','other'),('B02','coal'),('B03','gas'),('B04','gas'),('B05','coal'),
        ('B06','oil'),('B07','oil'),('B08','peat'),('B09','other'),('B10','water'),
        ('B11','water'),('B12','water'),('B13','water'),('B14','nuclear'),('B15','other'),
        ('B16','solar'),('B17','other'),('B18','wind'),('B19','wind'),('B20','other'),
        ('B25','other');

    CREATE TABLE outage (
        mrid                   TEXT PRIMARY KEY NOT NULL,
        revision               INTEGER,
        business_type          TEXT,
        document_type          TEXT,
        start_date             INTEGER,
        end_date               INTEGER,
        resource_name          TEXT,
        location               TEXT,
        country                TEXT,
        psr_name               TEXT,
        psr_nominal_power_unit TEXT,
        psr_nominal_power      REAL,
        psr_type               TEXT,
        reason_code            TEXT,
        reason_text            TEXT
    );
    CREATE INDEX outage_country_dates ON outage (country, start_date, end_date);

    CREATE TABLE outage_availability (
        mrid       TEXT NOT NULL,
        start_date INTEGER,
        end_date   INTEGER,
        quantity   REAL
    );
    CREATE INDEX outage_availability_mrid ON outage_availability (mrid);

    CREATE TABLE job_run (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        job      TEXT    NOT NULL,
        started  INTEGER NOT NULL,
        finished INTEGER,
        ok       INTEGER,
        message  TEXT
    );
    CREATE INDEX job_run_job ON job_run (job, started);
    "#,
    ),
    (
        2,
        "job_run status and failed areas",
        r#"
    ALTER TABLE job_run ADD COLUMN status TEXT;
    ALTER TABLE job_run ADD COLUMN failures TEXT;
    "#,
    ),
    (
        3,
        "cross-border physical flows",
        r#"
    CREATE TABLE flow (
        from_area TEXT    NOT NULL,
        to_area   TEXT    NOT NULL,
        period    INTEGER NOT NULL,
        interval  TEXT    NOT NULL,
        value     REAL    NOT NULL,
        PRIMARY KEY (from_area, to_area, period, interval)
    ) WITHOUT ROWID;
    CREATE INDEX flow_period ON flow (period);
    "#,
    ),
    (
        4,
        "load period index",
        r#"
    CREATE INDEX load_period ON load (period);
    "#,
    ),
];

/// See [`Db::optimize`]
pub fn optimize(c: &Connection, initial: bool) -> anyhow::Result<()> {
    let t0 = std::time::Instant::now();
    c.execute_batch(if initial {
        "PRAGMA analysis_limit = 1000; PRAGMA optimize = 0x10002;"
    } else {
        "PRAGMA analysis_limit = 1000; PRAGMA optimize;"
    })?;
    tracing::debug!(ms = t0.elapsed().as_millis() as u64, "database optimized");
    Ok(())
}

fn init_connection(c: &mut Connection) -> rusqlite::Result<()> {
    c.busy_timeout(Duration::from_secs(30))?;
    c.execute_batch(
        "PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;
         PRAGMA temp_store = MEMORY;
         PRAGMA cache_size = -16000;",
    )
}

impl Db {
    pub fn open(path: &Path) -> anyhow::Result<Self> {
        if let Some(dir) = path.parent() {
            if !dir.as_os_str().is_empty() {
                std::fs::create_dir_all(dir)
                    .with_context(|| format!("creating {}", dir.display()))?;
            }
        }
        // Switch to WAL once, before the pool opens several connections at the same time
        {
            let c = Connection::open(path).context("opening database")?;
            c.busy_timeout(Duration::from_secs(30))?;
            c.query_row("PRAGMA journal_mode = WAL", [], |_| Ok(()))?;
        }
        let manager = SqliteConnectionManager::file(path).with_init(init_connection);
        let pool = Pool::builder()
            .max_size(8)
            .min_idle(Some(1))
            .build(manager)
            .context("opening database")?;
        let db = Self {
            pool,
            path: path.to_path_buf(),
        };
        db.migrate()?;
        // Collect planner statistics if they are missing or stale. Without sqlite_stat1 the
        // "latest generation/load" window queries scan whole tables (seconds on a big database).
        db.optimize(true)?;
        Ok(db)
    }

    /// `PRAGMA optimize` with a bounded analysis. `initial` also analyzes tables that have
    /// never been analyzed (recommended once when a long-lived database is opened).
    pub fn optimize(&self, initial: bool) -> anyhow::Result<()> {
        optimize(&*self.conn()?, initial)
    }

    #[cfg(test)]
    pub fn open_memory() -> Self {
        // Shared-cache in-memory db so all pooled connections see the same data
        let name = format!("file:mem{}?mode=memory&cache=shared", rand_id());
        let manager = SqliteConnectionManager::file(name)
            .with_flags(
                rusqlite::OpenFlags::SQLITE_OPEN_READ_WRITE
                    | rusqlite::OpenFlags::SQLITE_OPEN_CREATE
                    | rusqlite::OpenFlags::SQLITE_OPEN_URI,
            )
            .with_init(|c| c.busy_timeout(Duration::from_secs(5)));
        let pool = Pool::builder().max_size(4).build(manager).unwrap();
        let db = Self {
            pool,
            path: PathBuf::from(":memory:"),
        };
        db.migrate().unwrap();
        db
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn conn(&self) -> anyhow::Result<Conn> {
        Ok(self.pool.get()?)
    }

    /// Run `f` with a pooled connection on the blocking pool
    pub async fn run<T, F>(&self, f: F) -> anyhow::Result<T>
    where
        T: Send + 'static,
        F: FnOnce(&mut Connection) -> anyhow::Result<T> + Send + 'static,
    {
        let pool = self.pool.clone();
        tokio::task::spawn_blocking(move || {
            let mut c = pool.get()?;
            f(&mut c)
        })
        .await?
    }

    fn migrate(&self) -> anyhow::Result<()> {
        let mut c = self.conn()?;
        c.execute_batch("CREATE TABLE IF NOT EXISTS schema_migration (version INTEGER PRIMARY KEY, name TEXT, applied INTEGER)")?;
        let current: i64 = c.query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migration",
            [],
            |r| r.get(0),
        )?;
        for (version, name, sql) in MIGRATIONS {
            if *version <= current {
                continue;
            }
            tracing::info!(version, name, "applying database migration");
            let tx = c.transaction()?;
            tx.execute_batch(sql)?;
            tx.execute(
                "INSERT INTO schema_migration (version, name, applied) VALUES (?1, ?2, ?3)",
                rusqlite::params![version, name, crate::timeutil::now_ms()],
            )?;
            tx.commit()?;
        }
        Ok(())
    }

    /// Consistent online backup to `dest`, safe while the server is running.
    pub fn backup_to(&self, dest: &Path) -> anyhow::Result<()> {
        let c = self.conn()?;
        let mut dst = Connection::open(dest)?;
        let backup = rusqlite::backup::Backup::new(&c, &mut dst)?;
        backup.run_to_completion(256, Duration::from_millis(10), None)?;
        Ok(())
    }
}

#[cfg(test)]
fn rand_id() -> u64 {
    use std::sync::atomic::{AtomicU64, Ordering};
    static N: AtomicU64 = AtomicU64::new(0);
    N.fetch_add(1, Ordering::Relaxed) ^ (std::process::id() as u64) << 32
}
