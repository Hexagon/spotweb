//! Import history from a spotweb 1.x database (`db/main.db`).
//!
//! The 1.x database is attached read-only and copied table by table. Duplicates
//! (which 1.x cleaned up periodically) are resolved by keeping the row with the
//! highest rowid, the same rule 1.x used. Running the import repeatedly is safe.

use std::path::Path;

use anyhow::{bail, Context};
use rusqlite::{params, Connection};
use serde::Serialize;

use super::Db;

#[derive(Debug, Default, Serialize)]
pub struct ImportReport {
    pub spotprice: usize,
    pub exchangerate: usize,
    pub generation: usize,
    pub load: usize,
    pub outage: usize,
    pub outage_availability: usize,
}

fn columns(c: &Connection, table: &str) -> rusqlite::Result<Vec<String>> {
    let mut st = c.prepare(&format!("PRAGMA v1.table_info({table})"))?;
    let rows = st.query_map([], |r| r.get::<_, String>(1))?;
    rows.collect()
}

fn col_or(cols: &[String], name: &str, fallback: &str) -> String {
    if cols.iter().any(|c| c == name) {
        format!("v.{name}")
    } else {
        fallback.to_string()
    }
}

pub fn import_v1(db: &Db, source: &Path) -> anyhow::Result<ImportReport> {
    if !source.exists() {
        bail!("1.x database not found at {}", source.display());
    }
    let src = std::fs::canonicalize(source)?;
    if let (Ok(a), Ok(b)) = (std::fs::canonicalize(db.path()), Ok::<_, ()>(src.clone())) {
        if a == b {
            bail!("source and destination database are the same file");
        }
    }

    let mut c = db.conn()?;
    let uri = format!("file:{}?mode=ro", src.display());
    c.execute("ATTACH DATABASE ?1 AS v1", params![uri])
        .context("attaching 1.x database")?;
    let result = (|| -> anyhow::Result<ImportReport> {
        let tables: Vec<String> = {
            let mut st = c.prepare("SELECT name FROM v1.sqlite_master WHERE type = 'table'")?;
            let rows = st.query_map([], |r| r.get::<_, String>(0))?;
            rows.collect::<Result<_, _>>()?
        };
        let has = |t: &str| tables.iter().any(|x| x == t);
        if !has("spotprice") {
            bail!(
                "{} does not look like a spotweb 1.x database (no spotprice table)",
                src.display()
            );
        }

        let mut report = ImportReport::default();
        let tx = c.transaction()?;

        // spotprice: interval column was added by a 1.x migration, default PT60M
        let cols = columns(&tx, "spotprice")?;
        let interval = col_or(&cols, "interval", "'PT60M'");
        report.spotprice = tx.execute(
            &format!(
                "INSERT INTO spotprice (country, area, period, interval, spotprice)
                 SELECT v.country, v.area, v.period, COALESCE({interval}, 'PT60M'), v.spotprice
                 FROM v1.spotprice v
                 WHERE v.area IS NOT NULL AND v.period IS NOT NULL AND v.spotprice IS NOT NULL
                 ORDER BY v.id
                 ON CONFLICT (area, period, interval) DO UPDATE SET spotprice = excluded.spotprice"
            ),
            [],
        )?;
        tracing::info!(rows = report.spotprice, "imported spot prices");

        if has("exchangerate") {
            report.exchangerate = tx.execute(
                "INSERT INTO exchangerate (currency, period, date, value)
                 SELECT v.currency, v.period, COALESCE(v.date, ''), v.value
                 FROM v1.exchangerate v
                 WHERE v.currency IS NOT NULL AND v.period IS NOT NULL AND v.value IS NOT NULL
                 ORDER BY v.id
                 ON CONFLICT (currency, period) DO UPDATE SET value = excluded.value",
                [],
            )?;
            tracing::info!(rows = report.exchangerate, "imported exchange rates");
        }

        if has("generation") {
            let cols = columns(&tx, "generation")?;
            let consumption = col_or(&cols, "consumption", "0");
            report.generation = tx.execute(
                &format!(
                    "INSERT INTO generation (area, period, interval, psr, consumption, value)
                     SELECT v.area, v.period, COALESCE(v.interval, 'PT60M'), v.psr, COALESCE({consumption}, 0), v.value
                     FROM v1.generation v
                     WHERE v.area IS NOT NULL AND v.period IS NOT NULL AND v.psr IS NOT NULL AND v.value IS NOT NULL
                     ORDER BY v.id
                     ON CONFLICT (area, period, interval, psr, consumption) DO UPDATE SET value = excluded.value"
                ),
                [],
            )?;
            tracing::info!(rows = report.generation, "imported generation");
        }

        if has("load") {
            report.load = tx.execute(
                "INSERT INTO load (area, period, interval, value)
                 SELECT v.area, v.period, COALESCE(v.interval, 'PT60M'), v.value
                 FROM v1.load v
                 WHERE v.area IS NOT NULL AND v.period IS NOT NULL AND v.value IS NOT NULL
                 ORDER BY v.id
                 ON CONFLICT (area, period, interval) DO UPDATE SET value = excluded.value",
                [],
            )?;
            tracing::info!(rows = report.load, "imported load");
        }

        if has("outage") {
            report.outage = tx.execute(
                "INSERT OR REPLACE INTO outage (mrid, revision, business_type, document_type, start_date, end_date,
                    resource_name, location, country, psr_name, psr_nominal_power_unit, psr_nominal_power, psr_type,
                    reason_code, reason_text)
                 SELECT mrid, revision, business_type, document_type, start_date, end_date, resource_name, location,
                    country, psr_name, psr_nominal_power_unit, CAST(psr_nominal_power AS REAL), psr_type, reason_code, reason_text
                 FROM v1.outage WHERE mrid IS NOT NULL",
                [],
            )?;
            if has("outage_availability") {
                tx.execute("DELETE FROM outage_availability WHERE mrid IN (SELECT mrid FROM v1.outage_availability)", [])?;
                report.outage_availability = tx.execute(
                    "INSERT INTO outage_availability (mrid, start_date, end_date, quantity)
                     SELECT DISTINCT mrid, start_date, end_date, quantity FROM v1.outage_availability WHERE mrid IS NOT NULL",
                    [],
                )?;
            }
            tracing::info!(rows = report.outage, "imported outages");
        }

        tx.commit()?;
        Ok(report)
    })();
    c.execute("DETACH DATABASE v1", [])?;
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a database with the exact 1.x schema (including its migrations)
    fn make_v1(path: &Path) {
        let c = Connection::open(path).unwrap();
        c.execute_batch(
            "CREATE TABLE spotprice (id INTEGER PRIMARY KEY AUTOINCREMENT, country VARCHAR(3), area VARCHAR(3), spotprice DOUBLE, period INT, interval TEXT DEFAULT 'PT60M');
             CREATE TABLE exchangerate (id INTEGER PRIMARY KEY AUTOINCREMENT, currency VARCHAR(3), value DOUBLE, date TEXT, period INT);
             CREATE TABLE generation (id INTEGER PRIMARY KEY AUTOINCREMENT, area VARCHAR(16), period INT, value DOUBLE, psr TEXT, interval TEXT, consumption INTEGER DEFAULT(0));
             CREATE TABLE load (id INTEGER PRIMARY KEY AUTOINCREMENT, area VARCHAR(16), period INT, value DOUBLE, interval TEXT);
             CREATE TABLE updates (name TEXT, applied INT);
             CREATE TABLE psr (psr TEXT, psr_group TEXT);
             CREATE TABLE outage (mrid TEXT PRIMARY KEY UNIQUE NOT NULL, revision NUMERIC, business_type TEXT, document_type TEXT,
                start_date NUMERIC, end_date NUMERIC, resource_name TEXT, location TEXT, country TEXT, psr_name TEXT,
                psr_nominal_power_unit TEXT, psr_nominal_power NUMERIC, psr_type TEXT, reason_code TEXT, reason_text TEXT);
             CREATE TABLE outage_availability (mrid TEXT NOT NULL, start_date NUMERIC, end_date NUMERIC, quantity NUMERIC);
             INSERT INTO spotprice (country, area, spotprice, period, interval) VALUES
                ('sv','SE1',10.0,1000,'PT60M'), ('sv','SE1',11.0,1000,'PT60M'), ('sv','SE1',12.0,2000,'PT15M');
             INSERT INTO exchangerate (currency, value, date, period) VALUES ('SEK', 11.2, '2024-01-01', 500);
             INSERT INTO generation (area, period, value, psr, interval, consumption) VALUES ('BZN|SE1', 1000, 5.0, 'B12', 'PT60M', 0);
             INSERT INTO load (area, period, value, interval) VALUES ('BZN|SE1', 1000, 4.0, 'PT60M');
             INSERT INTO outage (mrid, business_type, start_date, end_date, country, psr_nominal_power) VALUES ('x', 'Planned maintenance', 1, 2, 'sv', '400');
             INSERT INTO outage_availability VALUES ('x', 1, 2, 100);",
        )
        .unwrap();
    }

    #[test]
    fn imports_v1_and_is_idempotent() {
        let dir = std::env::temp_dir().join(format!("spotweb-import-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let v1 = dir.join("main.db");
        let _ = std::fs::remove_file(&v1);
        make_v1(&v1);
        let dest = dir.join("spotweb.db");
        let _ = std::fs::remove_file(&dest);
        let db = Db::open(&dest).unwrap();

        let r = import_v1(&db, &v1).unwrap();
        assert_eq!(r.exchangerate, 1);
        import_v1(&db, &v1).unwrap();

        let c = db.conn().unwrap();
        let rows = crate::db::queries::spot_rows(&c, "SE1", 0, 5000).unwrap();
        assert_eq!(rows.len(), 2);
        // Last duplicate wins, like the 1.x cleanup
        assert_eq!(rows[0].price, 11.0);
        assert_eq!(
            crate::db::queries::exchange_rates(&c).unwrap().rate("SEK"),
            Some(11.2)
        );
        let n: i64 = c
            .query_row("SELECT COUNT(*) FROM outage_availability", [], |r| r.get(0))
            .unwrap();
        assert_eq!(n, 1);
        drop(c);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
