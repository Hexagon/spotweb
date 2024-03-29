// ---- Database creation ------------------------------------------------------------
const sqlCreateSpotprice =
  "CREATE TABLE IF NOT EXISTS spotprice (id INTEGER PRIMARY KEY AUTOINCREMENT, country VARCHAR(3), area VARCHAR(3), spotprice DOUBLE, date TEXT, period INT)";
const sqlCreateExchangeRate =
  "CREATE TABLE IF NOT EXISTS exchangerate (id INTEGER PRIMARY KEY AUTOINCREMENT, currency VARCHAR(3), value DOUBLE, date TEXT, period INT);";
const sqlCreateGeneration =
  "CREATE TABLE IF NOT EXISTS generation (id INTEGER PRIMARY KEY AUTOINCREMENT, area VARCHAR(16), period INT, value DOUBLE, psr TEXT, interval TEXT);";
const sqlCreateLoad =
  "CREATE TABLE IF NOT EXISTS load (id INTEGER PRIMARY KEY AUTOINCREMENT, area VARCHAR(16), period INT, value DOUBLE, interval TEXT);";
const sqlCreateUpdates = "CREATE TABLE IF NOT EXISTS updates (name TEXT, applied INT);";
const sqlCreatePsr = "CREATE TABLE IF NOT EXISTS psr (psr TEXT, psr_group TEXT);";

// ---- Custom queries
const sqlCurrentLoadAndGeneration = `
WITH 
distinct_generation AS (
    SELECT 
        generation.area,
        generation.period,
        generation.interval,
        generation.consumption,
        generation.value,
        generation.psr,
        ROW_NUMBER() OVER(PARTITION BY generation.area, generation.interval,generation.psr,generation.consumption ORDER BY generation.period DESC) AS row_number
    FROM
        generation
    WHERE
        period >= (?)
),
generation_per_psr_group AS (
    SELECT 
        g.area,
        MIN(g.period) as period,
        g.interval,
        psr.psr_group,
        g.consumption,
        SUM(CASE WHEN g.consumption THEN 0-g.value ELSE g.value END) as value
    FROM
        distinct_generation as g
        LEFT JOIN psr ON g.psr = psr.psr
    WHERE
        row_number = 1
    GROUP BY
        g.area,
        g.interval,
        g.consumption,
        psr.psr_group
),
generation_total AS (
    SELECT 
        gen.area,
        MIN(gen.period) as period,
        gen.interval,
        SUM(gen.value) as sum_generation_value,
        MAX(gen.value) as max_generation_value,
        FIRST_VALUE(gen.psr_group) OVER (
            PARTITION BY       
                gen.area,
                gen.interval
            ORDER BY 
                SUM(gen.value) DESC
        ) as primary_psr_group
    FROM
        generation_per_psr_group as gen
    GROUP BY
        gen.area,
        gen.interval
)
SELECT 
    generation_total.area,
    generation_total.period,
    generation_total.interval,
    generation_total.primary_psr_group,
    generation_total.max_generation_value as primary_psr_group_generation,
    generation_total.sum_generation_value as generation_total,
    [load].value as load_total,
    generation_total.sum_generation_value-[load].value as net_generation
FROM
    generation_total
    LEFT JOIN [load]
        ON 
            generation_total.area = [load].area 
            AND generation_total.period = [load].period 
            AND generation_total.interval = [load].interval`;
const sqlLoadAndGeneration = `
    WITH 
    distinct_generation AS (
        SELECT 
            DISTINCT
            generation.area,
            generation.period,
            generation.interval,
            generation.consumption,
            generation.value,
            generation.psr
        FROM
            generation
        WHERE
            area = (?)
            AND period >= (?)
            AND period <=(?)
    ),
    generation_per_psr_group AS (
        SELECT 
            g.area,
            g.period,
            g.interval,
            psr.psr_group,
            SUM(CASE WHEN g.consumption THEN 0-g.value ELSE g.value END) as value
        FROM
            distinct_generation as g
            LEFT JOIN psr ON g.psr = psr.psr
        GROUP BY
            g.area,
            g.period,
            g.interval,
            psr.psr_group
    ),
    generation_total AS (
        SELECT 
            gen.area,
            gen.period,
            gen.interval,
            SUM(gen.value) as sum_generation_value
        FROM
            generation_per_psr_group as gen
        GROUP BY
            gen.area,
            gen.period,
            gen.interval
    ),
    generation_and_load AS (
    SELECT 
        generation_total.period,
        generation_total.sum_generation_value-[load].value as net_generation
    FROM
        generation_total
        INNER JOIN [load]
            ON 
                generation_total.area = [load].area 
                AND generation_total.period = [load].period 
                AND generation_total.interval = [load].interval)
    SELECT
        *
    FROM
        generation_and_load`;

// ---- Queries related to spot price -------------------------------------------------
const sqlGroupBy: Record<string, string> = {
  total: "'total'",
  yearly: "unixepoch(strftime('%Y-01-01 00:00:00',datetime(spotprice.period/1000,'unixepoch'),'localtime'))*1000",
  monthly: "unixepoch(strftime('%Y-%m-01 00:00:00',datetime(spotprice.period/1000,'unixepoch'),'localtime'))*1000",
  daily: "unixepoch(strftime('%Y-%m-%d 00:00:00',datetime(spotprice.period/1000,'unixepoch'),'localtime'))*1000",
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
const sqlLatestPricePerCountry = `
    SELECT
        DISTINCT
        country,
        period,
        interval,
        AVG(spotprice)
    FROM
        spotprice
    WHERE
        period = (?)
    GROUP BY
        country,
        period,
        interval`;
const sqlLatestPricePerArea = `
    SELECT
        area,
        period,
        interval,
        spotprice
    FROM
        spotprice
    WHERE
        period = (?)
    GROUP BY
        area,
        period,
        interval,
        spotprice`;
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
        DISTINCT
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
WITH 
distinct_generation AS (
    SELECT 
        DISTINCT
        generation.area,
        generation.period,
        generation.interval,
        generation.consumption,
        generation.value,
        generation.psr
    FROM
        generation
)
        SELECT 
            period,
            psr_group,
            SUM(CASE WHEN consumption THEN 0-value ELSE value END) as value,
            consumption,
            COUNT(distinct_generation.psr) as count_psr
        FROM
            distinct_generation
            LEFT JOIN psr ON psr.psr = distinct_generation.psr
        WHERE 
            area=(?) 
            AND period >= (?) 
            AND period < (?)
            AND interval = (?)
        GROUP BY
            period,
            psr_group,
            interval,
            consumption;`;

// ---- SQL related to exchange rates ---------------------------------------------------------
const sqlExchangeRates = `
SELECT
    DISTINCT
    e.currency,
    e.value
FROM
    exchangerate e
WHERE
    period=(SELECT MAX(period) FROM exchangerate);`;

// ---- Queries related to updates ----------------------------------------------
const sqlAppliedUpdates = `SELECT
    name,
    applied
FROM
    updates;`;

// ---- Queries related to outages -----------------------------------------------
const sqlCurrentOutagesPerArea = `
SELECT
    outage.start_date,
    outage.end_date,
    outage.resource_name,
    outage.business_type,
    outage.location,
    outage.country,
    outage.psr_name,
    outage.psr_nominal_power,
    outage.psr_nominal_power_unit,
    outage.psr_type,
    outage.reason_code,
    outage.reason_text,
    outage_availability.*
FROM
    outage
    LEFT JOIN outage_availability ON outage.mrid = outage_availability.mrid AND outage_availability.start_date < (?) AND outage_availability.end_date > (?)
WHERE
    country=(?)
    AND outage.start_date < (?)
    AND outage.end_date > (?)
`;
const sqlFutureOutagesPerArea = `
SELECT
    outage.start_date,
    outage.end_date,
    outage.resource_name,
    outage.business_type,
    outage.location,
    outage.country,
    outage.psr_name,
    outage.psr_nominal_power,
    outage.psr_nominal_power_unit,
    outage.psr_type,
    outage.reason_code,
    outage.reason_text
FROM
    outage
WHERE
    country=(?)
    AND outage.start_date > (?)
ORDER BY
    start_date ASC
`;

export {
  sqlAppliedUpdates,
  sqlConverted,
  sqlCreateExchangeRate,
  sqlCreateGeneration,
  sqlCreateLoad,
  sqlCreatePsr,
  sqlCreateSpotprice,
  sqlCreateUpdates,
  sqlCurrentLoadAndGeneration,
  sqlCurrentOutagesPerArea,
  sqlExchangeRates,
  sqlFutureOutagesPerArea,
  sqlGeneration,
  sqlGroupBy,
  sqlLatestPricePerArea,
  sqlLatestPricePerCountry,
  sqlLoad,
  sqlLoadAndGeneration,
  sqlRaw,
};
