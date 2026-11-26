//! Read and write queries. Read queries are ported from spotweb 1.x
//! (`backend/db/sql/index.ts`) and return the same shapes.

use std::collections::{BTreeMap, HashMap};

use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;

use crate::price::SpotRow;

// ---------------------------------------------------------------------------
// Spot prices
// ---------------------------------------------------------------------------

pub fn spot_rows(c: &Connection, area: &str, from: i64, to: i64) -> rusqlite::Result<Vec<SpotRow>> {
    let mut st = c.prepare_cached(
        "SELECT period, interval, spotprice FROM spotprice WHERE area = ?1 AND period >= ?2 AND period <= ?3 ORDER BY period",
    )?;
    let rows = st.query_map(params![area, from, to], |r| {
        Ok(SpotRow {
            time: r.get(0)?,
            interval: r.get(1)?,
            price: r.get(2)?,
        })
    })?;
    rows.collect()
}

/// All areas, used for the "price right now" overview
pub fn spot_rows_all(
    c: &Connection,
    from: i64,
    to: i64,
) -> rusqlite::Result<Vec<(String, SpotRow)>> {
    let mut st = c.prepare_cached("SELECT area, period, interval, spotprice FROM spotprice WHERE period >= ?1 AND period <= ?2")?;
    let rows = st.query_map(params![from, to], |r| {
        Ok((
            r.get(0)?,
            SpotRow {
                time: r.get(1)?,
                interval: r.get(2)?,
                price: r.get(3)?,
            },
        ))
    })?;
    rows.collect()
}

/// Start of the first stored price interval of an area at or after `from`
pub fn min_spot_period(c: &Connection, area: &str, from: i64) -> rusqlite::Result<Option<i64>> {
    c.query_row(
        "SELECT MIN(period) FROM spotprice WHERE area = ?1 AND period >= ?2",
        params![area, from],
        |r| r.get(0),
    )
}

pub fn max_spot_period(c: &Connection, area: &str) -> rusqlite::Result<Option<i64>> {
    c.query_row(
        "SELECT MAX(period) FROM spotprice WHERE area = ?1",
        params![area],
        |r| r.get(0),
    )
}

/// Returns the number of rows inserted or changed; identical rows are not rewritten.
pub fn upsert_spot(
    c: &mut Connection,
    country: &str,
    area: &str,
    rows: &[(i64, String, f64)],
) -> rusqlite::Result<usize> {
    let tx = c.transaction()?;
    let mut changed = 0;
    {
        let mut st = tx.prepare_cached(
            "INSERT INTO spotprice (country, area, period, interval, spotprice) VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT (area, period, interval) DO UPDATE SET spotprice = excluded.spotprice, country = excluded.country
             WHERE spotprice IS NOT excluded.spotprice OR country IS NOT excluded.country",
        )?;
        for (period, interval, price) in rows {
            changed += st.execute(params![country, area, period, interval, price])?;
        }
    }
    tx.commit()?;
    Ok(changed)
}

// ---------------------------------------------------------------------------
// Exchange rates
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Default)]
pub struct ExchangeRates {
    pub date: String,
    pub entries: BTreeMap<String, f64>,
}

impl ExchangeRates {
    /// Rate from EUR. `öre`/`ÖRE`/`ORE` is treated as SEK. EUR is always 1.
    pub fn rate(&self, currency: &str) -> Option<f64> {
        let cur = currency.trim().to_uppercase();
        let cur = match cur.as_str() {
            "ÖRE" | "ORE" => "SEK",
            c => c,
        };
        if cur == "EUR" {
            return Some(1.0);
        }
        self.entries.get(cur).copied()
    }
}

pub fn exchange_rates(c: &Connection) -> rusqlite::Result<ExchangeRates> {
    let mut st = c.prepare_cached(
        "SELECT e.currency, e.value, e.date FROM exchangerate e WHERE e.period = (SELECT MAX(period) FROM exchangerate)",
    )?;
    let mut out = ExchangeRates::default();
    let rows = st.query_map([], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, f64>(1)?,
            r.get::<_, String>(2)?,
        ))
    })?;
    for row in rows {
        let (cur, val, date) = row?;
        out.entries.insert(cur, val);
        out.date = date;
    }
    Ok(out)
}

/// Whether rates are stored for `period` (midnight UTC of the ECB date).
///
/// Checks `period`, not `date`: rows imported from 1.x have the *fetch* date in `date` (and local midnight of
/// that day in `period`), so the ECB rate published on the same day would wrongly look like it was already stored.
pub fn has_exchange_rates_for(c: &Connection, period: i64) -> rusqlite::Result<bool> {
    let n: i64 = c.query_row(
        "SELECT COUNT(*) FROM exchangerate WHERE period = ?1",
        params![period],
        |r| r.get(0),
    )?;
    Ok(n > 0)
}

pub fn insert_exchange_rates(
    c: &mut Connection,
    date: &str,
    period: i64,
    entries: &BTreeMap<String, f64>,
) -> rusqlite::Result<()> {
    let tx = c.transaction()?;
    {
        let mut st = tx.prepare_cached(
            "INSERT INTO exchangerate (currency, period, date, value) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT (currency, period) DO UPDATE SET value = excluded.value, date = excluded.date",
        )?;
        for (cur, v) in entries {
            st.execute(params![cur, period, date, v])?;
        }
    }
    tx.commit()
}

// ---------------------------------------------------------------------------
// Generation and load
// ---------------------------------------------------------------------------

/// `(period, psr_group, value, consumption, count_psr)`
pub type GenerationRow = (i64, Option<String>, f64, i64, i64);
/// `(period, value, interval)`
pub type LoadRow = (i64, f64, String);

const SQL_GENERATION: &str = "
    SELECT g.period, psr.psr_group,
           SUM(CASE WHEN g.consumption THEN 0 - g.value ELSE g.value END) AS value,
           g.consumption, COUNT(g.psr) AS count_psr
    FROM generation g LEFT JOIN psr ON psr.psr = g.psr
    WHERE g.area = ?1 AND g.period >= ?2 AND g.period < ?3 [[interval]]
    GROUP BY g.period, psr.psr_group, g.interval, g.consumption
    ORDER BY g.period";

fn generation_query(
    c: &Connection,
    area: &str,
    from: i64,
    to: i64,
    interval: Option<&str>,
) -> rusqlite::Result<Vec<GenerationRow>> {
    let sql = SQL_GENERATION.replace(
        "[[interval]]",
        if interval.is_some() {
            "AND g.interval = ?4"
        } else {
            ""
        },
    );
    let mut st = c.prepare_cached(&sql)?;
    let map = |r: &rusqlite::Row| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?));
    match interval {
        Some(iv) => st.query_map(params![area, from, to, iv], map)?.collect(),
        None => st.query_map(params![area, from, to], map)?.collect(),
    }
}

fn latest_interval(c: &Connection, table: &str, area: &str) -> rusqlite::Result<Option<String>> {
    c.query_row(
        &format!("SELECT interval FROM {table} WHERE area = ?1 ORDER BY period DESC LIMIT 1"),
        params![area],
        |r| r.get(0),
    )
    .optional()
}

/// Generation per psr group, preferring `interval`, then the latest stored interval, then any.
pub fn generation(
    c: &Connection,
    area: &str,
    from: i64,
    to: i64,
    interval: &str,
) -> rusqlite::Result<Vec<GenerationRow>> {
    let mut data = generation_query(c, area, from, to, Some(interval))?;
    if data.is_empty() {
        if let Some(latest) = latest_interval(c, "generation", area)? {
            if latest != interval {
                data = generation_query(c, area, from, to, Some(&latest))?;
            }
        }
    }
    if data.is_empty() {
        data = generation_query(c, area, from, to, None)?;
    }
    Ok(data)
}

fn load_query(
    c: &Connection,
    area: &str,
    from: i64,
    to: i64,
    interval: Option<&str>,
) -> rusqlite::Result<Vec<LoadRow>> {
    let sql = format!(
        "SELECT period, value, interval FROM load WHERE area = ?1 AND period >= ?2 AND period < ?3 {} ORDER BY period",
        if interval.is_some() { "AND interval = ?4" } else { "" }
    );
    let mut st = c.prepare_cached(&sql)?;
    let map = |r: &rusqlite::Row| Ok((r.get(0)?, r.get(1)?, r.get(2)?));
    match interval {
        Some(iv) => st.query_map(params![area, from, to, iv], map)?.collect(),
        None => st.query_map(params![area, from, to], map)?.collect(),
    }
}

pub fn load(
    c: &Connection,
    area: &str,
    from: i64,
    to: i64,
    interval: &str,
) -> rusqlite::Result<Vec<LoadRow>> {
    let mut data = load_query(c, area, from, to, Some(interval))?;
    if data.is_empty() {
        if let Some(latest) = latest_interval(c, "load", area)? {
            if latest != interval {
                data = load_query(c, area, from, to, Some(&latest))?;
            }
        }
    }
    if data.is_empty() {
        data = load_query(c, area, from, to, None)?;
    }
    Ok(data)
}

/// Net generation (generation - load) per period
pub fn net_generation(
    c: &Connection,
    area: &str,
    from: i64,
    to: i64,
) -> rusqlite::Result<Vec<(i64, f64)>> {
    let mut st = c.prepare_cached(
        "WITH generation_total AS (
            SELECT g.area, g.period, g.interval,
                   SUM(CASE WHEN g.consumption THEN 0 - g.value ELSE g.value END) AS sum_generation_value
            FROM generation g
            WHERE g.area = ?1 AND g.period >= ?2 AND g.period <= ?3
            GROUP BY g.area, g.period, g.interval
        )
        SELECT gt.period, gt.sum_generation_value - l.value AS net_generation
        FROM generation_total gt
        INNER JOIN load l ON gt.area = l.area AND gt.period = l.period AND gt.interval = l.interval
        ORDER BY gt.period",
    )?;
    let rows = st.query_map(params![area, from, to], |r| Ok((r.get(0)?, r.get(1)?)))?;
    rows.collect()
}

#[derive(Debug, Clone, Serialize)]
pub struct GenLoadRow {
    pub area: String,
    pub period: i64,
    pub interval: String,
    pub primary_psr_group: Option<String>,
    pub primary_psr_group_generation: Option<f64>,
    pub generation_total: Option<f64>,
    pub load_total: Option<f64>,
    pub net_generation: Option<f64>,
    /// Generation per `psr_group` in the same interval, largest first (pumped storage
    /// consumption and other negative values left out)
    pub mix: Vec<(String, f64)>,
    /// Renewable and fossil free share and carbon intensity of the same interval
    pub derived: crate::emissions::Derived,
}

/// Latest generation and load per area (index page). Port of `sqlCurrentLoadAndGeneration`.
pub fn current_generation_and_load(c: &Connection, from: i64) -> rusqlite::Result<Vec<GenLoadRow>> {
    let mut st = c.prepare_cached(
        "WITH
        distinct_generation AS (
            SELECT area, period, interval, consumption, value, psr,
                   ROW_NUMBER() OVER (PARTITION BY area, interval, psr, consumption ORDER BY period DESC) AS row_number
            FROM generation WHERE period >= ?1
        ),
        latest_interval AS (
            SELECT area, interval FROM (
                SELECT area, interval, ROW_NUMBER() OVER (PARTITION BY area ORDER BY period DESC) AS rn
                FROM generation WHERE period >= ?1
            ) WHERE rn = 1
        ),
        generation_per_psr_group AS (
            SELECT g.area, MAX(g.period) AS period, g.interval, psr.psr_group, g.consumption,
                   SUM(CASE WHEN g.consumption THEN 0 - g.value ELSE g.value END) AS value
            FROM distinct_generation g
            INNER JOIN latest_interval li ON li.area = g.area AND li.interval = g.interval
            LEFT JOIN psr ON g.psr = psr.psr
            WHERE row_number = 1
            GROUP BY g.area, g.interval, g.consumption, psr.psr_group
        ),
        generation_total AS (
            SELECT gen.area, MAX(gen.period) AS period, gen.interval,
                   SUM(gen.value) AS sum_generation_value,
                   MAX(gen.value) AS max_generation_value,
                   FIRST_VALUE(gen.psr_group) OVER (PARTITION BY gen.area, gen.interval ORDER BY MAX(gen.value) DESC) AS primary_psr_group
            FROM generation_per_psr_group gen
            GROUP BY gen.area, gen.interval
        ),
        -- Load for the same period as the generation, not simply the newest load row:
        -- load is often published a few intervals ahead of generation, and those
        -- preliminary values do not match it (the newest Swedish load is about equal
        -- to production, as the exchange is not in yet). Falls back to the latest load
        -- before that period, preferring the generation's resolution.
        load_at AS (
            SELECT gt.area,
                   (SELECT l.value FROM load l
                    WHERE l.area = gt.area AND l.period >= ?1 AND l.period <= gt.period
                    ORDER BY l.period DESC, l.interval = gt.interval DESC
                    LIMIT 1) AS value
            FROM generation_total gt
        )
        SELECT gt.area, gt.period, gt.interval, gt.primary_psr_group,
               gt.max_generation_value, gt.sum_generation_value, la.value,
               gt.sum_generation_value - COALESCE(la.value, 0)
        FROM generation_total gt
        LEFT JOIN load_at la ON gt.area = la.area",
    )?;
    let rows = st.query_map(params![from], |r| {
        Ok(GenLoadRow {
            area: r.get(0)?,
            period: r.get(1)?,
            interval: r.get(2)?,
            primary_psr_group: r.get(3)?,
            primary_psr_group_generation: r.get(4)?,
            generation_total: r.get(5)?,
            load_total: r.get(6)?,
            net_generation: r.get(7)?,
            mix: vec![],
            derived: Default::default(),
        })
    })?;
    let mut rows: Vec<GenLoadRow> = rows.collect::<rusqlite::Result<_>>()?;
    // The mix of each area's latest interval, the one the totals above are for
    let mut mix = c.prepare_cached(
        "SELECT COALESCE(psr.psr_group, 'other'), SUM(g.value) FROM generation g
         LEFT JOIN psr ON g.psr = psr.psr
         WHERE g.area = ?1 AND g.period = ?2 AND g.interval = ?3 AND g.consumption = 0
         GROUP BY 1 HAVING SUM(g.value) > 0 ORDER BY 2 DESC",
    )?;
    // Per production type for the derived values, which tell types in the same group apart
    let mut by_psr = c.prepare_cached(
        "SELECT psr, SUM(value) FROM generation
         WHERE area = ?1 AND period = ?2 AND interval = ?3 AND consumption = 0
         GROUP BY psr",
    )?;
    for r in &mut rows {
        r.mix = mix
            .query_map(params![r.area, r.period, r.interval], |x| {
                Ok((x.get(0)?, x.get(1)?))
            })?
            .collect::<rusqlite::Result<_>>()?;
        let psr: Vec<(String, f64)> = by_psr
            .query_map(params![r.area, r.period, r.interval], |x| {
                Ok((x.get(0)?, x.get(1)?))
            })?
            .collect::<rusqlite::Result<_>>()?;
        r.derived = crate::emissions::derive(psr.iter().map(|(p, v)| (p.as_str(), *v)));
    }
    Ok(rows)
}

/// Start of the latest stored generation interval of an area (`BZN|SE1`)
pub fn max_generation_period(c: &Connection, area: &str) -> rusqlite::Result<Option<i64>> {
    c.query_row(
        "SELECT MAX(period) FROM generation WHERE area = ?1",
        params![area],
        |r| r.get(0),
    )
}

/// Start of the latest stored load interval of an area
pub fn max_load_period(c: &Connection, area: &str) -> rusqlite::Result<Option<i64>> {
    c.query_row(
        "SELECT MAX(period) FROM load WHERE area = ?1",
        params![area],
        |r| r.get(0),
    )
}

/// `(period, interval, psr, consumption, value)`. Returns the number of rows inserted or changed.
pub fn upsert_generation(
    c: &mut Connection,
    area: &str,
    rows: &[(i64, String, String, i64, f64)],
) -> rusqlite::Result<usize> {
    let tx = c.transaction()?;
    let mut changed = 0;
    {
        let mut st = tx.prepare_cached(
            "INSERT INTO generation (area, period, interval, psr, consumption, value) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT (area, period, interval, psr, consumption) DO UPDATE SET value = excluded.value
             WHERE value IS NOT excluded.value",
        )?;
        for (period, interval, psr, consumption, value) in rows {
            changed += st.execute(params![area, period, interval, psr, consumption, value])?;
        }
    }
    tx.commit()?;
    Ok(changed)
}

/// `(period, interval, value)`. Returns the number of rows inserted or changed.
pub fn upsert_load(
    c: &mut Connection,
    area: &str,
    rows: &[(i64, String, f64)],
) -> rusqlite::Result<usize> {
    let tx = c.transaction()?;
    let mut changed = 0;
    {
        let mut st = tx.prepare_cached(
            "INSERT INTO load (area, period, interval, value) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT (area, period, interval) DO UPDATE SET value = excluded.value
             WHERE value IS NOT excluded.value",
        )?;
        for (period, interval, value) in rows {
            changed += st.execute(params![area, period, interval, value])?;
        }
    }
    tx.commit()?;
    Ok(changed)
}

/// Write country level rows (`cty`) as the sum of its areas, for periods where every
/// area has data. Replaces the 1.x CTA queries + `AggregateCountryGeneration`.
pub fn aggregate_country(
    c: &mut Connection,
    cty: &str,
    area_ids: &[&str],
    since: i64,
) -> rusqlite::Result<(usize, usize)> {
    let placeholders = (0..area_ids.len())
        .map(|i| format!("?{}", i + 3))
        .collect::<Vec<_>>()
        .join(",");
    let n = area_ids.len() as i64;
    let tx = c.transaction()?;
    let mut p: Vec<rusqlite::types::Value> = vec![cty.to_string().into(), since.into()];
    p.extend(
        area_ids
            .iter()
            .map(|a| rusqlite::types::Value::from(a.to_string())),
    );
    let n_param = format!("?{}", area_ids.len() + 3);
    p.push(n.into());

    let gen = tx.execute(
        &format!(
            "INSERT INTO generation (area, period, interval, psr, consumption, value)
             SELECT ?1, period, interval, psr, consumption, SUM(value)
             FROM generation
             WHERE area IN ({placeholders}) AND period >= ?2
               AND (period, interval) IN (
                    SELECT period, interval FROM generation
                    WHERE area IN ({placeholders}) AND period >= ?2
                    GROUP BY period, interval HAVING COUNT(DISTINCT area) = {n_param})
             GROUP BY period, interval, psr, consumption
             ON CONFLICT (area, period, interval, psr, consumption) DO UPDATE SET value = excluded.value
             WHERE value IS NOT excluded.value"
        ),
        rusqlite::params_from_iter(p.iter()),
    )?;
    let load = tx.execute(
        &format!(
            "INSERT INTO load (area, period, interval, value)
             SELECT ?1, period, interval, SUM(value)
             FROM load
             WHERE area IN ({placeholders}) AND period >= ?2
             GROUP BY period, interval HAVING COUNT(DISTINCT area) = {n_param}
             ON CONFLICT (area, period, interval) DO UPDATE SET value = excluded.value
             WHERE value IS NOT excluded.value"
        ),
        rusqlite::params_from_iter(p.iter()),
    )?;
    tx.commit()?;
    Ok((gen, load))
}

// ---------------------------------------------------------------------------
// Outages
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
pub struct OutageRow {
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub resource_name: Option<String>,
    pub business_type: Option<String>,
    pub location: Option<String>,
    pub country: Option<String>,
    pub psr_name: Option<String>,
    pub psr_nominal_power: Option<f64>,
    pub psr_nominal_power_unit: Option<String>,
    pub psr_type: Option<String>,
    pub reason_code: Option<String>,
    pub reason_text: Option<String>,
    /// Available capacity right now, if reported
    pub available: Option<f64>,
}

fn outage_from_row(r: &rusqlite::Row) -> rusqlite::Result<OutageRow> {
    Ok(OutageRow {
        start_date: r.get(0)?,
        end_date: r.get(1)?,
        resource_name: r.get(2)?,
        business_type: r.get(3)?,
        location: r.get(4)?,
        country: r.get(5)?,
        psr_name: r
            .get::<_, Option<String>>(6)?
            .filter(|s| s != "undefined" && !s.is_empty()),
        psr_nominal_power: r.get(7)?,
        psr_nominal_power_unit: r.get(8)?,
        psr_type: r.get(9)?,
        reason_code: r.get(10)?,
        reason_text: r.get(11)?,
        available: r.get(12)?,
    })
}

const OUTAGE_COLUMNS: &str = "o.start_date, o.end_date, o.resource_name, o.business_type, o.location, o.country,
    o.psr_name, o.psr_nominal_power, o.psr_nominal_power_unit, o.psr_type, o.reason_code, o.reason_text";

/// Hides outages whose document ENTSO-e has cancelled (A09) or withdrawn (A13)
const OUTAGE_ACTIVE: &str = "COALESCE(o.doc_status, '') NOT IN ('A09', 'A13')";

pub fn current_outages(
    c: &Connection,
    country: &str,
    now: i64,
) -> rusqlite::Result<Vec<OutageRow>> {
    let mut st = c.prepare_cached(&format!(
        "SELECT {OUTAGE_COLUMNS},
            (SELECT a.quantity FROM outage_availability a
             WHERE a.mrid = o.mrid AND a.ts = o.ts AND a.start_date <= ?2 AND a.end_date > ?2 LIMIT 1)
         FROM outage o
         WHERE o.country = ?1 AND o.start_date < ?2 AND o.end_date > ?2 AND {OUTAGE_ACTIVE}
         ORDER BY o.start_date DESC"
    ))?;
    let rows = st.query_map(params![country, now], outage_from_row)?;
    rows.collect()
}

pub fn future_outages(c: &Connection, country: &str, now: i64) -> rusqlite::Result<Vec<OutageRow>> {
    let mut st = c.prepare_cached(&format!(
        "SELECT {OUTAGE_COLUMNS}, NULL FROM outage o WHERE o.country = ?1 AND o.start_date > ?2 AND {OUTAGE_ACTIVE} ORDER BY o.start_date ASC"
    ))?;
    let rows = st.query_map(params![country, now], outage_from_row)?;
    rows.collect()
}

#[derive(Debug, Clone, Default)]
pub struct NewOutage {
    /// Document mRID, shared by all TimeSeries of the document
    pub mrid: String,
    /// Index of the TimeSeries within the document
    pub ts: i64,
    pub revision: Option<i64>,
    /// `docStatus` of the document: A05 active, A09 cancelled, A13 withdrawn
    pub doc_status: Option<String>,
    pub business_type: Option<String>,
    pub document_type: Option<String>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub resource_name: Option<String>,
    pub location: Option<String>,
    pub psr_name: Option<String>,
    pub psr_nominal_power_unit: Option<String>,
    pub psr_nominal_power: Option<f64>,
    pub psr_type: Option<String>,
    pub reason_code: Option<String>,
    pub reason_text: Option<String>,
    /// `(start, end, quantity)`
    pub availability: Vec<(i64, i64, f64)>,
}

/// Outages that ended longer ago than this are deleted by [`replace_outages`]
const OUTAGE_RETENTION_MS: i64 = 90 * 24 * 3_600_000;

/// Store outages, replacing older revisions, and prune outages of `country` that ended more
/// than 90 days before `now`. Returns the number of outages written.
///
/// A document (mRID) is replaced as a whole: all its TimeSeries are written when a newer
/// revision arrives, and a document whose revision is already stored (or newer) is skipped.
/// Cancelled and withdrawn revisions are stored too, so they hide the earlier active one.
pub fn replace_outages(
    c: &mut Connection,
    country: &str,
    outages: &[NewOutage],
    now: i64,
) -> rusqlite::Result<usize> {
    // Latest revision of each document in the batch; older revisions are ignored
    let mut latest: HashMap<&str, Option<i64>> = HashMap::new();
    for o in outages {
        let r = latest.entry(o.mrid.as_str()).or_insert(o.revision);
        *r = (*r).max(o.revision);
    }
    let tx = c.transaction()?;
    let mut changed = 0;
    {
        let mut del = tx.prepare_cached("DELETE FROM outage WHERE mrid = ?1")?;
        let mut del_a = tx.prepare_cached("DELETE FROM outage_availability WHERE mrid = ?1")?;
        let mut ins = tx.prepare_cached(
            "INSERT INTO outage (mrid, ts, revision, doc_status, business_type, document_type, start_date, end_date,
                resource_name, location, country, psr_name, psr_nominal_power_unit, psr_nominal_power, psr_type,
                reason_code, reason_text)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        )?;
        let mut ins_a = tx.prepare_cached("INSERT INTO outage_availability (mrid, ts, start_date, end_date, quantity) VALUES (?1, ?2, ?3, ?4, ?5)")?;
        let mut stored =
            tx.prepare_cached("SELECT MAX(revision) FROM outage WHERE mrid = ?1 GROUP BY mrid")?;
        // Documents handled in this call: replaced (true) or skipped (false)
        let mut handled: HashMap<&str, bool> = HashMap::new();
        // TimeSeries written in this call: paging can return the same document twice
        let mut written: std::collections::HashSet<(&str, i64)> = Default::default();
        for o in outages {
            let revision = latest[o.mrid.as_str()];
            if o.revision != revision {
                continue;
            }
            let replace = match handled.get(o.mrid.as_str()) {
                Some(&replace) => replace,
                None => {
                    let current: Option<Option<i64>> =
                        stored.query_row(params![o.mrid], |r| r.get(0)).optional()?;
                    // ENTSO-e publishes changes as a new revision
                    let replace = match (current, revision) {
                        (Some(Some(cur)), Some(new)) => new > cur,
                        _ => true,
                    };
                    if replace {
                        del.execute(params![o.mrid])?;
                        del_a.execute(params![o.mrid])?;
                    }
                    handled.insert(o.mrid.as_str(), replace);
                    replace
                }
            };
            if !replace || !written.insert((o.mrid.as_str(), o.ts)) {
                continue;
            }
            changed += 1;
            ins.execute(params![
                o.mrid,
                o.ts,
                o.revision,
                o.doc_status,
                o.business_type,
                o.document_type,
                o.start_date,
                o.end_date,
                o.resource_name,
                o.location,
                country,
                o.psr_name,
                o.psr_nominal_power_unit,
                o.psr_nominal_power,
                o.psr_type,
                o.reason_code,
                o.reason_text
            ])?;
            for (s, e, q) in &o.availability {
                ins_a.execute(params![o.mrid, o.ts, s, e, q])?;
            }
        }
    }
    // Keep the tables small
    let cutoff = now - OUTAGE_RETENTION_MS;
    tx.execute(
        "DELETE FROM outage_availability WHERE (mrid, ts) IN
            (SELECT mrid, ts FROM outage WHERE country = ?1 AND end_date < ?2)",
        params![country, cutoff],
    )?;
    tx.execute(
        "DELETE FROM outage WHERE country = ?1 AND end_date < ?2",
        params![country, cutoff],
    )?;
    tx.commit()?;
    Ok(changed)
}

// ---------------------------------------------------------------------------
// Job bookkeeping
// ---------------------------------------------------------------------------

pub fn job_started(c: &Connection, job: &str, now: i64) -> rusqlite::Result<i64> {
    c.execute(
        "INSERT INTO job_run (job, started) VALUES (?1, ?2)",
        params![job, now],
    )?;
    Ok(c.last_insert_rowid())
}

/// Outcome of a job run
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RunStatus {
    Running,
    Ok,
    /// Finished, but some areas failed
    Partial,
    Failed,
    /// Stopped before it finished: the server shut down or restarted during the run
    Interrupted,
}

impl RunStatus {
    fn as_str(self) -> &'static str {
        match self {
            Self::Running => "running",
            Self::Ok => "ok",
            Self::Partial => "partial",
            Self::Failed => "failed",
            Self::Interrupted => "interrupted",
        }
    }
}

/// One area that failed in an otherwise finished job
#[derive(Debug, Clone, PartialEq, Serialize, serde::Deserialize)]
pub struct AreaFailure {
    pub area: String,
    pub error: String,
}

pub fn job_finished(
    c: &Connection,
    id: i64,
    now: i64,
    status: RunStatus,
    message: &str,
    failures: &[AreaFailure],
) -> rusqlite::Result<()> {
    let failures = if failures.is_empty() {
        None
    } else {
        serde_json::to_string(failures).ok()
    };
    c.execute(
        "UPDATE job_run SET finished = ?2, ok = ?3, message = ?4, status = ?5, failures = ?6 WHERE id = ?1",
        params![
            id,
            now,
            matches!(status, RunStatus::Ok | RunStatus::Partial),
            message,
            status.as_str(),
            failures
        ],
    )?;
    // Keep the table small
    c.execute(
        "DELETE FROM job_run WHERE started < ?1",
        params![now - 30 * 24 * 3_600_000_i64],
    )?;
    Ok(())
}

/// Mark every run without `finished` as interrupted. Called when the server starts, when no run
/// of this process can be in progress, and at shutdown for runs that did not finish in time.
pub fn job_mark_interrupted(c: &Connection, now: i64, message: &str) -> rusqlite::Result<usize> {
    c.execute(
        "UPDATE job_run SET finished = ?1, ok = 0, message = ?2, status = ?3 WHERE finished IS NULL",
        params![now, message, RunStatus::Interrupted.as_str()],
    )
}

#[derive(Debug, Clone, Serialize)]
pub struct JobStatus {
    pub job: String,
    pub started: String,
    pub finished: Option<String>,
    /// `true` unless the job failed as a whole (kept for compatibility, see `status`)
    pub ok: Option<bool>,
    pub status: RunStatus,
    pub message: Option<String>,
    /// Areas that failed in a `partial` run
    pub failures: Vec<AreaFailure>,
}

pub fn latest_job_runs(c: &Connection) -> rusqlite::Result<Vec<JobStatus>> {
    let mut st = c.prepare_cached(
        "SELECT job, started, finished, ok, message, status, failures FROM job_run
         WHERE id IN (SELECT MAX(id) FROM job_run GROUP BY job) ORDER BY job",
    )?;
    let rows = st.query_map([], |r| {
        let ok: Option<bool> = r.get(3)?;
        let status = match (r.get::<_, Option<String>>(5)?.as_deref(), ok) {
            (Some("partial"), _) => RunStatus::Partial,
            (Some("interrupted"), _) => RunStatus::Interrupted,
            (Some("failed"), _) | (None, Some(false)) => RunStatus::Failed,
            (Some("ok"), _) | (None, Some(true)) => RunStatus::Ok,
            _ => RunStatus::Running,
        };
        Ok(JobStatus {
            job: r.get(0)?,
            started: crate::timeutil::js_iso(r.get(1)?),
            finished: r.get::<_, Option<i64>>(2)?.map(crate::timeutil::js_iso),
            ok,
            status,
            message: r.get(4)?,
            failures: r
                .get::<_, Option<String>>(6)?
                .and_then(|f| serde_json::from_str(&f).ok())
                .unwrap_or_default(),
        })
    })?;
    rows.collect()
}

// ---------------------------------------------------------------------------
// Cross-border flows
// ---------------------------------------------------------------------------

/// Start of the latest stored flow interval in one direction
pub fn max_flow_period(c: &Connection, from: &str, to: &str) -> rusqlite::Result<Option<i64>> {
    c.query_row(
        "SELECT MAX(period) FROM flow WHERE from_area = ?1 AND to_area = ?2",
        params![from, to],
        |r| r.get(0),
    )
}

/// `(period, interval, MW)` for one direction. Returns the number of rows inserted or changed.
pub fn upsert_flows(
    c: &mut Connection,
    from: &str,
    to: &str,
    rows: &[(i64, String, f64)],
) -> rusqlite::Result<usize> {
    let tx = c.transaction()?;
    let mut changed = 0;
    {
        let mut st = tx.prepare_cached(
            "INSERT INTO flow (from_area, to_area, period, interval, value) VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT (from_area, to_area, period, interval) DO UPDATE SET value = excluded.value
             WHERE value IS NOT excluded.value",
        )?;
        for (period, interval, value) in rows {
            changed += st.execute(params![from, to, period, interval, value])?;
        }
    }
    tx.commit()?;
    Ok(changed)
}

/// Replace flow rows finer than an hour that start before `before` with hourly averages
/// (hours in UTC, which are whole hours in every time zone we use). An hour that already has
/// an hourly row keeps it. Returns the number of rows removed.
pub fn compact_flows(c: &mut Connection, before: i64) -> rusqlite::Result<usize> {
    let before = before - before.rem_euclid(3_600_000);
    let tx = c.transaction()?;
    tx.execute(
        "INSERT INTO flow (from_area, to_area, period, interval, value)
         SELECT from_area, to_area, period - (period % 3600000) AS hour, 'PT60M', AVG(value)
         FROM flow WHERE period < ?1 AND interval <> 'PT60M'
         GROUP BY from_area, to_area, hour
         ON CONFLICT (from_area, to_area, period, interval) DO NOTHING",
        params![before],
    )?;
    let removed = tx.execute(
        "DELETE FROM flow WHERE period < ?1 AND interval <> 'PT60M'",
        params![before],
    )?;
    tx.commit()?;
    Ok(removed)
}

/// Flow rows in `[from, to)`
pub fn flow_rows(
    c: &Connection,
    from: i64,
    to: i64,
) -> rusqlite::Result<Vec<crate::flows::FlowRow>> {
    let mut st = c.prepare_cached(
        "SELECT from_area, to_area, period, interval, value FROM flow WHERE period >= ?1 AND period < ?2",
    )?;
    let rows = st.query_map(params![from, to], |r| {
        let iv: String = r.get(3)?;
        Ok((
            r.get(0)?,
            r.get(1)?,
            r.get(2)?,
            crate::timeutil::interval_ms(&iv),
            r.get(4)?,
        ))
    })?;
    rows.collect()
}

#[derive(Debug, Clone, Serialize)]
pub struct DataFreshness {
    pub latest_price: Option<String>,
    pub latest_generation: Option<String>,
    pub latest_load: Option<String>,
    pub latest_flow: Option<String>,
    pub exchange_rate_date: Option<String>,
}

/// Raw values for [`crate::health::check`]
pub struct HealthInputs {
    /// Stored price intervals `(start, length)` in ms per area, sorted
    pub prices: std::collections::HashMap<String, Vec<(i64, i64)>>,
    pub generation: Option<i64>,
    pub load: Option<i64>,
}

/// Prices are read from `since` (ms) on
pub fn health_inputs(c: &Connection, since: i64) -> rusqlite::Result<HealthInputs> {
    let mut prices = std::collections::HashMap::new();
    for country in crate::countries::COUNTRIES {
        for area in country.areas {
            let rows = spot_rows(c, area.name, since, i64::MAX)?
                .iter()
                .map(|r| (r.time, crate::timeutil::interval_ms(&r.interval)))
                .collect();
            prices.insert(area.name.to_string(), rows);
        }
    }
    let max = |sql: &str| c.query_row(sql, [], |r| r.get::<_, Option<i64>>(0));
    Ok(HealthInputs {
        prices,
        generation: max("SELECT MAX(period) FROM generation")?,
        load: max("SELECT MAX(period) FROM load")?,
    })
}

pub fn data_freshness(c: &Connection) -> rusqlite::Result<DataFreshness> {
    let max = |sql: &str| -> rusqlite::Result<Option<String>> {
        Ok(c.query_row(sql, [], |r| r.get::<_, Option<i64>>(0))?
            .map(crate::timeutil::js_iso))
    };
    Ok(DataFreshness {
        latest_price: max("SELECT MAX(period) FROM spotprice")?,
        latest_generation: max("SELECT MAX(period) FROM generation")?,
        latest_load: max("SELECT MAX(period) FROM load")?,
        latest_flow: max("SELECT MAX(period) FROM flow")?,
        exchange_rate_date: c
            .query_row(
                "SELECT date FROM exchangerate ORDER BY period DESC LIMIT 1",
                [],
                |r| r.get(0),
            )
            .optional()?,
    })
}

// ---------------------------------------------------------------------------
// Hydro reservoirs
// ---------------------------------------------------------------------------

/// Start of the latest stored reservoir week of an area
pub fn max_reservoir_period(c: &Connection, area: &str) -> rusqlite::Result<Option<i64>> {
    c.query_row(
        "SELECT MAX(period) FROM reservoir WHERE area = ?1",
        params![area],
        |r| r.get(0),
    )
}

/// `(period, MWh)` per week. Returns the number of rows inserted or changed.
pub fn upsert_reservoir(
    c: &mut Connection,
    area: &str,
    rows: &[(i64, f64)],
) -> rusqlite::Result<usize> {
    let tx = c.transaction()?;
    let mut changed = 0;
    {
        let mut st = tx.prepare_cached(
            "INSERT INTO reservoir (area, period, value) VALUES (?1, ?2, ?3)
             ON CONFLICT (area, period) DO UPDATE SET value = excluded.value
             WHERE value IS NOT excluded.value",
        )?;
        for (period, value) in rows {
            changed += st.execute(params![area, period, value])?;
        }
    }
    tx.commit()?;
    Ok(changed)
}

/// Every stored week of the given areas: `(area, period, MWh)`, oldest first
pub fn reservoir_rows(c: &Connection, areas: &[&str]) -> rusqlite::Result<Vec<(String, i64, f64)>> {
    let mut st = c.prepare_cached(
        "SELECT area, period, value FROM reservoir WHERE area = ?1 ORDER BY period",
    )?;
    let mut out = vec![];
    for a in areas {
        let rows = st.query_map(params![a], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?;
        for r in rows {
            out.push(r?);
        }
    }
    out.sort_by_key(|r| r.1);
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Db;

    const DAY: i64 = 24 * 3_600_000;

    fn outage(
        mrid: &str,
        ts: i64,
        revision: i64,
        status: Option<&str>,
        start: i64,
        end: i64,
    ) -> NewOutage {
        NewOutage {
            mrid: mrid.into(),
            ts,
            revision: Some(revision),
            doc_status: status.map(str::to_string),
            start_date: Some(start),
            end_date: Some(end),
            resource_name: Some(format!("{mrid}-{ts}")),
            availability: vec![(start, end, 10.0 + ts as f64)],
            ..Default::default()
        }
    }

    fn count(c: &Connection, table: &str) -> i64 {
        c.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |r| r.get(0))
            .unwrap()
    }

    #[test]
    fn outages_time_series_and_doc_status() {
        let db = Db::open_memory();
        let mut c = db.conn().unwrap();
        let now = 1000 * DAY;
        let names = |rows: Vec<OutageRow>| {
            let mut v: Vec<_> = rows.into_iter().filter_map(|o| o.resource_name).collect();
            v.sort();
            v
        };
        // Both TimeSeries of a document are stored
        let doc = [
            outage("A", 0, 1, Some("A05"), now - DAY, now + DAY),
            outage("A", 1, 1, Some("A05"), now - DAY, now + DAY),
            outage("B", 0, 1, None, now + DAY, now + 2 * DAY),
        ];
        assert_eq!(replace_outages(&mut c, "sv", &doc, now).unwrap(), 3);
        let current = current_outages(&c, "sv", now).unwrap();
        assert_eq!(names(current.clone()), ["A-0", "A-1"]);
        assert_eq!(
            current.iter().filter_map(|o| o.available).sum::<f64>(),
            21.0
        );
        assert_eq!(names(future_outages(&c, "sv", now).unwrap()), ["B-0"]);
        // Same revision again: nothing written
        assert_eq!(replace_outages(&mut c, "sv", &doc, now).unwrap(), 0);

        // A later revision with fewer TimeSeries replaces the whole document
        let rev2 = [outage("A", 0, 2, Some("A05"), now - DAY, now + DAY)];
        assert_eq!(replace_outages(&mut c, "sv", &rev2, now).unwrap(), 1);
        assert_eq!(names(current_outages(&c, "sv", now).unwrap()), ["A-0"]);
        assert_eq!(count(&c, "outage_availability"), 2);

        // Withdrawn (A13) and cancelled (A09) revisions hide the earlier active ones, also when
        // the older revision comes in the same batch
        let withdrawn = [
            outage("A", 0, 2, Some("A05"), now - DAY, now + DAY),
            outage("A", 0, 3, Some("A13"), now - DAY, now + DAY),
            outage("B", 0, 2, Some("A09"), now + DAY, now + 2 * DAY),
        ];
        assert_eq!(replace_outages(&mut c, "sv", &withdrawn, now).unwrap(), 2);
        assert!(current_outages(&c, "sv", now).unwrap().is_empty());
        assert!(future_outages(&c, "sv", now).unwrap().is_empty());
        // An older revision fetched later does not bring it back
        assert_eq!(replace_outages(&mut c, "sv", &rev2, now).unwrap(), 0);
        assert!(current_outages(&c, "sv", now).unwrap().is_empty());
    }

    #[test]
    fn duplicate_document_in_batch_is_written_once() {
        // Paging with offsets can return the same document twice when the result set shifts
        let db = Db::open_memory();
        let mut c = db.conn().unwrap();
        let now = 1000 * DAY;
        let doc = [
            outage("A", 0, 1, Some("A05"), now - DAY, now + DAY),
            outage("A", 1, 1, Some("A05"), now - DAY, now + DAY),
            outage("A", 0, 1, Some("A05"), now - DAY, now + DAY),
            outage("A", 1, 1, Some("A05"), now - DAY, now + DAY),
        ];
        assert_eq!(replace_outages(&mut c, "sv", &doc, now).unwrap(), 2);
        assert_eq!(count(&c, "outage"), 2);
        assert_eq!(count(&c, "outage_availability"), 2);
    }

    #[test]
    fn old_flows_are_compacted_to_hours() {
        const H: i64 = 3_600_000;
        const Q: i64 = 900_000;
        let db = Db::open_memory();
        let mut c = db.conn().unwrap();
        let q = |p: i64, v: f64| (p, "PT15M".to_string(), v);
        // Hour 0 at 15 minutes, hour 1 has an hourly row too, hour 3 is recent
        let rows = [
            q(0, 100.0),
            q(Q, 200.0),
            q(2 * Q, 300.0),
            q(3 * Q, 400.0),
            q(H, 10.0),
            (H, "PT60M".to_string(), 50.0),
            q(3 * H, 7.0),
        ];
        upsert_flows(&mut c, "SE3", "FI", &rows).unwrap();
        // The cut-off is rounded down to a whole hour
        assert_eq!(compact_flows(&mut c, 2 * H + Q).unwrap(), 5);
        let left: Vec<(i64, String, f64)> = c
            .prepare("SELECT period, interval, value FROM flow ORDER BY period, interval")
            .unwrap()
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap();
        assert_eq!(
            left,
            vec![
                (0, "PT60M".into(), 250.0),
                (H, "PT60M".into(), 50.0),
                (3 * H, "PT15M".into(), 7.0),
            ]
        );
        assert_eq!(compact_flows(&mut c, 2 * H).unwrap(), 0);
    }

    #[test]
    fn old_outages_are_pruned() {
        let db = Db::open_memory();
        let mut c = db.conn().unwrap();
        let now = 1000 * DAY;
        let rows = [
            outage("OLD", 0, 1, None, now - 100 * DAY, now - 91 * DAY),
            outage("OLD", 1, 1, None, now - 100 * DAY, now - 91 * DAY),
            outage("RECENT", 0, 1, None, now - 100 * DAY, now - 89 * DAY),
        ];
        replace_outages(&mut c, "sv", &rows, now - 200 * DAY).unwrap();
        let fi = [outage(
            "OLD-FI",
            0,
            1,
            None,
            now - 100 * DAY,
            now - 91 * DAY,
        )];
        replace_outages(&mut c, "fi", &fi, now - 200 * DAY).unwrap();
        assert_eq!(count(&c, "outage"), 4);
        // Pruning runs with every replace, for that country, even when nothing new is written
        assert_eq!(replace_outages(&mut c, "sv", &[], now).unwrap(), 0);
        let left: Vec<(String, String)> = c
            .prepare("SELECT mrid, country FROM outage ORDER BY mrid")
            .unwrap()
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap();
        assert_eq!(
            left,
            [
                ("OLD-FI".to_string(), "fi".to_string()),
                ("RECENT".into(), "sv".into())
            ]
        );
        assert_eq!(count(&c, "outage_availability"), 2);
    }

    #[test]
    fn spot_roundtrip_and_upsert() {
        let db = Db::open_memory();
        let mut c = db.conn().unwrap();
        upsert_spot(
            &mut c,
            "sv",
            "SE1",
            &[(1000, "PT60M".into(), 10.0), (2000, "PT60M".into(), 11.0)],
        )
        .unwrap();
        // Only rows that are new or changed count
        let rows = [(1000, "PT60M".into(), 12.0), (2000, "PT60M".into(), 11.0)];
        assert_eq!(upsert_spot(&mut c, "sv", "SE1", &rows).unwrap(), 1);
        assert_eq!(upsert_spot(&mut c, "sv", "SE1", &rows).unwrap(), 0);
        let rows = spot_rows(&c, "SE1", 0, 5000).unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].price, 12.0);
        assert_eq!(max_spot_period(&c, "SE1").unwrap(), Some(2000));
    }

    #[test]
    fn generation_load_and_aggregation() {
        let db = Db::open_memory();
        let mut c = db.conn().unwrap();
        for (area, v) in [("BZN|SE1", 100.0), ("BZN|SE2", 200.0)] {
            upsert_generation(
                &mut c,
                area,
                &[
                    (1000, "PT15M".into(), "B12".into(), 0, v),
                    (1000, "PT15M".into(), "B14".into(), 0, v / 2.0),
                ],
            )
            .unwrap();
            upsert_load(&mut c, area, &[(1000, "PT15M".into(), v)]).unwrap();
        }
        // SE2 only has data for period 2000 -> must not be aggregated
        upsert_load(&mut c, "BZN|SE2", &[(2000, "PT15M".into(), 1.0)]).unwrap();
        assert_eq!(
            upsert_load(&mut c, "BZN|SE2", &[(2000, "PT15M".into(), 1.0)]).unwrap(),
            0
        );
        assert_eq!(max_load_period(&c, "BZN|SE2").unwrap(), Some(2000));
        aggregate_country(&mut c, "Sweden (SE)", &["BZN|SE1", "BZN|SE2"], 0).unwrap();
        let g = generation(&c, "Sweden (SE)", 0, 5000, "PT15M").unwrap();
        let water: f64 = g
            .iter()
            .filter(|r| r.1.as_deref() == Some("water"))
            .map(|r| r.2)
            .sum();
        assert_eq!(water, 300.0);
        let l = load(&c, "Sweden (SE)", 0, 5000, "PT15M").unwrap();
        assert_eq!(l.len(), 1);
        assert_eq!(l[0].1, 300.0);
        let net = net_generation(&c, "Sweden (SE)", 0, 5000).unwrap();
        assert_eq!(net, vec![(1000, 150.0)]);
        let cur = current_generation_and_load(&c, 0).unwrap();
        let se = cur.iter().find(|r| r.area == "Sweden (SE)").unwrap();
        assert_eq!(se.generation_total, Some(450.0));
        assert_eq!(se.primary_psr_group.as_deref(), Some("water"));
        assert_eq!(se.load_total, Some(300.0));
        assert_eq!(
            se.mix,
            vec![("water".to_string(), 300.0), ("nuclear".to_string(), 150.0)]
        );
        // SE2 has load for period 2000 but generation only up to 1000: the load must
        // match the generation period, not be the newest load row
        let se2 = cur.iter().find(|r| r.area == "BZN|SE2").unwrap();
        assert_eq!(se2.load_total, Some(200.0));
        assert_eq!(se2.net_generation, Some(100.0));
    }

    #[test]
    fn exchange_rate_latest() {
        let db = Db::open_memory();
        let mut c = db.conn().unwrap();
        let mut e = BTreeMap::new();
        e.insert("SEK".to_string(), 11.0);
        insert_exchange_rates(&mut c, "2024-01-01", 1, &e).unwrap();
        e.insert("SEK".to_string(), 11.5);
        insert_exchange_rates(&mut c, "2024-01-02", 2, &e).unwrap();
        let r = exchange_rates(&c).unwrap();
        assert_eq!(r.rate("SEK"), Some(11.5));
        assert_eq!(r.rate("öre"), Some(11.5));
        assert_eq!(r.rate("EUR"), Some(1.0));
        assert_eq!(r.date, "2024-01-02");
    }

    #[test]
    fn job_status_partial() {
        let db = Db::open_memory();
        let c = db.conn().unwrap();
        let a = job_started(&c, "load", 1).unwrap();
        // Row written by 2.0.1, without status
        c.execute(
            "UPDATE job_run SET finished = 2, ok = 1, message = 'x' WHERE id = ?1",
            params![a],
        )
        .unwrap();
        let p = job_started(&c, "prices", 1).unwrap();
        let f = vec![AreaFailure {
            area: "SE2".into(),
            error: "upstream timeout".into(),
        }];
        job_finished(&c, p, 2, RunStatus::Partial, "stored 10 rows", &f).unwrap();
        job_started(&c, "outages", 1).unwrap();
        let runs = latest_job_runs(&c).unwrap();
        let get = |j: &str| runs.iter().find(|r| r.job == j).unwrap();
        assert_eq!(get("load").status, RunStatus::Ok);
        assert_eq!(get("prices").status, RunStatus::Partial);
        assert_eq!(get("prices").ok, Some(true));
        assert_eq!(get("prices").failures, f);
        assert_eq!(get("outages").status, RunStatus::Running);
    }

    #[test]
    fn job_status_interrupted() {
        let db = Db::open_memory();
        let c = db.conn().unwrap();
        let done = job_started(&c, "load", 1).unwrap();
        job_finished(&c, done, 2, RunStatus::Ok, "stored 1 rows", &[]).unwrap();
        job_started(&c, "outages", 3).unwrap();
        assert_eq!(job_mark_interrupted(&c, 4, "server restarted").unwrap(), 1);
        // Nothing left to mark
        assert_eq!(job_mark_interrupted(&c, 5, "server restarted").unwrap(), 0);
        let runs = latest_job_runs(&c).unwrap();
        let get = |j: &str| runs.iter().find(|r| r.job == j).unwrap();
        assert_eq!(get("load").status, RunStatus::Ok);
        let o = get("outages");
        assert_eq!(o.status, RunStatus::Interrupted);
        assert_eq!(o.ok, Some(false));
        assert_eq!(
            o.finished.as_deref(),
            Some(crate::timeutil::js_iso(4).as_str())
        );
        assert_eq!(o.message.as_deref(), Some("server restarted"));
        assert_eq!(
            serde_json::to_value(o.status).unwrap(),
            serde_json::json!("interrupted")
        );
    }

    #[test]
    fn exchange_rate_after_v1_import() {
        // 1.x stored the rate fetched on 21 Nov (ECB's rate for 20 Nov) with the fetch date and local midnight
        let db = Db::open_memory();
        let mut c = db.conn().unwrap();
        let mut e = BTreeMap::new();
        e.insert("SEK".to_string(), 11.0);
        let v1_period = 1_763_679_600_000; // 2025-11-20T23:00:00Z = 2025-11-21 00:00 CET
        insert_exchange_rates(&mut c, "2025-11-21", v1_period, &e).unwrap();
        // ECB's rate for 21 Nov is stored at midnight UTC and must not be treated as a duplicate
        let ecb_period = 1_763_683_200_000; // 2025-11-21T00:00:00Z
        assert!(!has_exchange_rates_for(&c, ecb_period).unwrap());
        e.insert("SEK".to_string(), 11.2);
        insert_exchange_rates(&mut c, "2025-11-21", ecb_period, &e).unwrap();
        assert!(has_exchange_rates_for(&c, ecb_period).unwrap());
        assert_eq!(exchange_rates(&c).unwrap().rate("SEK"), Some(11.2));
        assert_eq!(
            data_freshness(&c).unwrap().exchange_rate_date.as_deref(),
            Some("2025-11-21")
        );
    }
}
