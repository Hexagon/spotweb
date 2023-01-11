// ---- Database creation ------------------------------------------------------------
const sqlCreateSpotprice =
  "CREATE TABLE IF NOT EXISTS spotprice (id INTEGER PRIMARY KEY AUTOINCREMENT, country VARCHAR(3), area VARCHAR(3), spotprice DOUBLE, date TEXT, period INT)";
const sqlCreateExchangeRate =
  "CREATE TABLE IF NOT EXISTS exchangerate (id INTEGER PRIMARY KEY AUTOINCREMENT, currency VARCHAR(3), value DOUBLE, date TEXT, period INT);";
const sqlCreateGeneration = 
  "CREATE TABLE IF NOT EXISTS generation (id INTEGER PRIMARY KEY AUTOINCREMENT, area VARCHAR(16), period INT, value DOUBLE, psr TEXT, interval TEXT);";
const sqlCreateLoad = 
  "CREATE TABLE IF NOT EXISTS load (id INTEGER PRIMARY KEY AUTOINCREMENT, area VARCHAR(16), period INT, value DOUBLE, interval TEXT);";
const sqlCreateUpdates = 
  "CREATE TABLE IF NOT EXISTS updates (name TEXT, applied INT);"
// ---- Queries related to spot price -------------------------------------------------
const sqlGroupBy: Record<string, string> = {
  total: "'total'",
  yearly: "unixepoch(strftime('%Y-01-01 00:00:00',spotprice.period/1000,'unixepoch'))*1000",
  monthly: "unixepoch(strftime('%Y-%m-01 00:00:00',spotprice.period/1000,'unixepoch'))*1000",
  daily: "unixepoch(strftime('%Y-%m-%d 00:00:00',spotprice.period/1000,'unixepoch'))*1000",
  hourly: "unixepoch(datetime(spotprice.period/1000,'unixepoch'))*1000",
  minimum: "spotprice.period",
};
const sqlRaw = `
    SELECT 
        [[groupby]] as grouping,
        AVG(spotprice.spotprice) as avg,
        min(spotprice.spotprice) as min,
        max(spotprice.spotprice) as max
    FROM
        spotprice
    WHERE 
        [[areaField]]=(?) 
        AND spotprice.period >= (?) 
        AND spotprice.period <= (?)
        AND spotprice.interval = (?)
    GROUP BY
        [[groupby]];`;

const sqlConverted = `
WITH er AS (
    SELECT
        e.value
    FROM
        exchangerate e
    WHERE
        currency=(?)
    ORDER BY
        period DESC
    LIMIT
        1
)
SELECT 
    [[groupby]],
    MIN(spotprice)*er.value as avg,
    MAX(spotprice)*er.value as min,
    avg(spotprice)*er.value as max
FROM 
    spotprice 
    LEFT JOIN er 
WHERE
    [[areaField]]=(?)
    AND spotprice.period>=(?)
    AND spotprice.period<=(?)
    AND spotprice.interval=(?)
GROUP BY
    [[groupby]];
`;

// ---- SQL related to load rate ------------------------------------------------
const sqlLoad = `
    SELECT 
        period,
        value,
        interval
    FROM
        load
    WHERE 
        area=(?) 
        AND period >= (?) 
        AND period < (?)
        AND interval = (?);`;

// ---- SQL related to generation --------------------------------------------------------------
const sqlGeneration = `
        SELECT 
            period,
            psr,
            value,
            interval
        FROM
            generation
        WHERE 
            area=(?) 
            AND period >= (?) 
            AND period < (?)
            AND interval = (?);`;

// ---- SQL related to exchange rates ---------------------------------------------------------
  const sqlExchangeRates = `
SELECT
    e.currency,
    e.value
FROM
    exchangerate e
WHERE
    period=(SELECT MAX(period) FROM exchangerate);`;
// ---- Queries related to updates ----------------------------------------------
const sqlAppliedUpdates =`SELECT
    name,
    applied
FROM
    updates;`;
    export { sqlLoad, sqlAppliedUpdates, sqlCreateUpdates, sqlConverted, sqlGeneration, sqlCreateExchangeRate, sqlCreateGeneration, sqlCreateLoad, sqlCreateSpotprice, sqlExchangeRates, sqlGroupBy, sqlRaw };
