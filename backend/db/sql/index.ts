const sqlGroupBy: Record<string, string> = {
  total: "'total'",
  yearly: "strftime('%Y-01-01 00:00:00',spotprice.period/1000,'unixepoch','localtime')",
  monthly: "strftime('%Y-%m-01 00:00:00',spotprice.period/1000,'unixepoch','localtime')",
  daily: "strftime('%Y-%m-%d 00:00:00',spotprice.period/1000,'unixepoch','localtime')",
  hourly: "datetime(spotprice.period/1000,'unixepoch','localtime')",
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
        area=(?) 
        AND spotprice.date >= (?) 
        AND spotprice.date <= (?)
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
    area=(?)
    AND spotprice.date>=(?)
    AND spotprice.date<=(?)
GROUP BY
    [[groupby]];
`;
const sqlCreateSpotprice =
  "CREATE TABLE IF NOT EXISTS spotprice (id INTEGER PRIMARY KEY AUTOINCREMENT, country VARCHAR(3), area VARCHAR(3), spotprice DOUBLE, date TEXT, period INT)";
const sqlCreateExchangeRate =
  "CREATE TABLE IF NOT EXISTS exchangerate (id INTEGER PRIMARY KEY AUTOINCREMENT, currency VARCHAR(3), value DOUBLE, date TEXT, period INT);";
const sqlExchangeRates = `
SELECT
    e.currency,
    e.value
FROM
    exchangerate e
WHERE
    period=(SELECT MAX(period) FROM exchangerate);`;
export { sqlConverted, sqlCreateExchangeRate, sqlCreateSpotprice, sqlExchangeRates, sqlGroupBy, sqlRaw };
