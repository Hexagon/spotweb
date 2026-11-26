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
    (
        5,
        "outage time series index and document status",
        // One unavailability document can hold several TimeSeries, so the key becomes
        // (mrid, ts). Stored revisions are cleared so every document is written again,
        // with all its TimeSeries, the next time it is fetched.
        r#"
    CREATE TABLE outage_new (
        mrid                   TEXT    NOT NULL,
        ts                     INTEGER NOT NULL DEFAULT 0,
        revision               INTEGER,
        doc_status             TEXT,
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
        reason_text            TEXT,
        PRIMARY KEY (mrid, ts)
    );
    INSERT INTO outage_new (mrid, ts, revision, business_type, document_type, start_date, end_date,
        resource_name, location, country, psr_name, psr_nominal_power_unit, psr_nominal_power, psr_type,
        reason_code, reason_text)
    SELECT mrid, 0, NULL, business_type, document_type, start_date, end_date,
        resource_name, location, country, psr_name, psr_nominal_power_unit, psr_nominal_power, psr_type,
        reason_code, reason_text
    FROM outage;
    DROP TABLE outage;
    ALTER TABLE outage_new RENAME TO outage;
    CREATE INDEX outage_country_dates ON outage (country, start_date, end_date);

    ALTER TABLE outage_availability ADD COLUMN ts INTEGER NOT NULL DEFAULT 0;
    DROP INDEX outage_availability_mrid;
    CREATE INDEX outage_availability_mrid ON outage_availability (mrid, ts);
    "#,
    ),
    (
        6,
        "hydro reservoir filling",
        // ENTSO-e A72: energy stored in reservoirs per bidding zone at the end of each week (MWh)
        r#"
    CREATE TABLE reservoir (
        area   TEXT    NOT NULL,
        period INTEGER NOT NULL,
        value  REAL    NOT NULL,
        PRIMARY KEY (area, period)
    ) WITHOUT ROWID;
    "#,
    ),
    (
        7,
        "planned flows and capacity per border",
        // `kind` is `schedule` (day-ahead scheduled commercial exchange, A09) or `capacity`
        // (day-ahead transfer capacity, A61), per direction like `flow`
        r#"
    CREATE TABLE border_plan (
        kind      TEXT    NOT NULL,
        from_area TEXT    NOT NULL,
        to_area   TEXT    NOT NULL,
        period    INTEGER NOT NULL,
        interval  TEXT    NOT NULL,
        value     REAL    NOT NULL,
        PRIMARY KEY (kind, from_area, to_area, period, interval)
    ) WITHOUT ROWID;
    CREATE INDEX border_plan_period ON border_plan (kind, period);
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
    ///
    /// If `dest` ends in `.zst` the copy is zstd-compressed (restore with `zstd -d`). The
    /// uncompressed copy is written next to `dest` first and removed afterwards, so the
    /// directory briefly needs room for both. The uncompressed copy must pass `PRAGMA
    /// quick_check` before it is compressed or renamed. `dest` is replaced atomically, so a
    /// failed run never destroys an earlier backup with the same name.
    pub fn backup_to(&self, dest: &Path) -> anyhow::Result<()> {
        let compress = dest.extension().is_some_and(|e| e == "zst");
        let raw = sibling(dest, ".tmp-db");
        let _ = std::fs::remove_file(&raw);
        let result = self
            .backup_raw(&raw)
            .and_then(|()| quick_check(&raw))
            .and_then(|()| {
                if compress {
                    let part = sibling(dest, ".part");
                    let r = compress_file(&raw, &part).and_then(|()| {
                        std::fs::rename(&part, dest)
                            .with_context(|| format!("renaming to {}", dest.display()))
                    });
                    if r.is_err() {
                        let _ = std::fs::remove_file(&part);
                    }
                    r
                } else {
                    std::fs::rename(&raw, dest)
                        .with_context(|| format!("renaming to {}", dest.display()))
                }
            });
        let _ = std::fs::remove_file(&raw);
        result
    }

    fn backup_raw(&self, dest: &Path) -> anyhow::Result<()> {
        let c = self.conn()?;
        let mut dst =
            Connection::open(dest).with_context(|| format!("creating {}", dest.display()))?;
        rusqlite::backup::Backup::new(&c, &mut dst)?.run_to_completion(
            256,
            Duration::from_millis(10),
            None,
        )?;
        // Make the copy self-contained (no -wal needed) before it is compressed or renamed.
        dst.pragma_update(None, "journal_mode", "DELETE")?;
        dst.close().map_err(|(_, e)| e)?;
        Ok(())
    }
}

/// Runs `PRAGMA quick_check` on the database file at `path` and fails unless it answers "ok".
fn quick_check(path: &Path) -> anyhow::Result<()> {
    let c = Connection::open_with_flags(path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)
        .with_context(|| format!("opening {} for verification", path.display()))?;
    let problems = c
        .prepare("PRAGMA quick_check(10)")
        .and_then(|mut st| {
            st.query_map([], |r| r.get::<_, String>(0))?
                .collect::<Result<Vec<_>, _>>()
        })
        .with_context(|| format!("verifying {}", path.display()))?;
    if problems != ["ok"] {
        anyhow::bail!(
            "backup copy {} failed quick_check: {}",
            path.display(),
            problems.join("; ")
        );
    }
    Ok(())
}

/// `dest` with `suffix` appended to the file name, in the same directory (so rename is atomic).
fn sibling(dest: &Path, suffix: &str) -> PathBuf {
    let mut name = dest.file_name().unwrap_or_default().to_os_string();
    name.push(suffix);
    dest.with_file_name(name)
}

/// zstd level 9, up to four threads (about 15 s per GB on four cores). `rsyncable` keeps
/// the output mostly stable between nights, so restic/borg can still deduplicate it.
fn compress_file(src: &Path, dest: &Path) -> anyhow::Result<()> {
    use std::io::Write;
    let mut input = std::fs::File::open(src)?;
    let size = input.metadata()?.len();
    let out =
        std::fs::File::create(dest).with_context(|| format!("creating {}", dest.display()))?;
    let mut enc = zstd::stream::Encoder::new(std::io::BufWriter::new(out), 9)?;
    let workers = std::thread::available_parallelism().map_or(1, |n| n.get().min(4)) as u32;
    enc.multithread(workers)?;
    enc.set_parameter(zstd::zstd_safe::CParameter::RSyncable(true))?;
    enc.include_checksum(true)?;
    enc.set_pledged_src_size(Some(size))?;
    std::io::copy(&mut input, &mut enc)?;
    let mut out = enc.finish()?;
    out.flush()?;
    out.into_inner().map_err(|e| e.into_error())?.sync_all()?;
    Ok(())
}

#[cfg(test)]
fn rand_id() -> u64 {
    use std::sync::atomic::{AtomicU64, Ordering};
    static N: AtomicU64 = AtomicU64::new(0);
    N.fetch_add(1, Ordering::Relaxed) ^ (std::process::id() as u64) << 32
}

#[cfg(test)]
mod backup_tests {
    use super::*;

    #[test]
    fn compressed_backup_round_trips() {
        let dir = std::env::temp_dir().join(format!("spotweb-backup-{}", rand_id()));
        std::fs::create_dir_all(&dir).unwrap();
        let db = Db::open(&dir.join("src.db")).unwrap();
        db.conn()
            .unwrap()
            .execute(
                "INSERT INTO exchangerate VALUES ('SEK', 1, '2024-01-01', 11.5)",
                [],
            )
            .unwrap();

        let dest = dir.join("b.db.zst");
        std::fs::write(&dest, b"previous backup").unwrap();
        db.backup_to(&dest).unwrap();
        let leftovers: Vec<_> = std::fs::read_dir(&dir)
            .unwrap()
            .map(|e| e.unwrap().file_name())
            .collect();
        assert!(!leftovers
            .iter()
            .any(|n| n.to_string_lossy().contains(".tmp-db")
                || n.to_string_lossy().ends_with(".part")));

        let restored = dir.join("restored.db");
        let mut out = std::fs::File::create(&restored).unwrap();
        zstd::stream::copy_decode(std::fs::File::open(&dest).unwrap(), &mut out).unwrap();
        drop(out);
        let c = Connection::open(&restored).unwrap();
        let v: f64 = c
            .query_row(
                "SELECT value FROM exchangerate WHERE currency = 'SEK'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(v, 11.5);
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn quick_check_rejects_corrupt_copy() {
        let dir = std::env::temp_dir().join(format!("spotweb-qc-{}", rand_id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("copy.db");
        let c = Connection::open(&path).unwrap();
        c.execute_batch(
            "PRAGMA page_size = 4096;
             CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT);
             CREATE INDEX t_v ON t (v);
             WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 2000)
             INSERT INTO t SELECT i, printf('value-%d', i) FROM n;",
        )
        .unwrap();
        drop(c);
        quick_check(&path).unwrap();

        // Overwrite the middle of the file (b-tree pages, not the header) with garbage.
        let mut bytes = std::fs::read(&path).unwrap();
        let mid = bytes.len() / 2;
        bytes[mid..mid + 8192].fill(0xA5);
        std::fs::write(&path, &bytes).unwrap();
        assert!(quick_check(&path).is_err());

        std::fs::write(&path, b"not a database at all").unwrap();
        assert!(quick_check(&path).is_err());
        let _ = std::fs::remove_dir_all(&dir);
    }
}
