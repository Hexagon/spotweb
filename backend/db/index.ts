import { DB } from "sqlite";
import { resolve } from "std/path/mod.ts";
import { sqlConverted, sqlCreateExchangeRate, sqlCreateSpotprice, sqlExchangeRates, sqlGroupBy, sqlRaw } from "./sql/index.js";

interface SpotApiRow {
  time: Date;
  price: number;
}

interface ExchangeRateRow {
  date: string,
  entries: Record<string,number>
}

// Try creating/opening database
let database : DB;
try {
  const path = resolve(Deno.cwd(), "./db/"),
    fileName = resolve(path, "main.db");
  await Deno.mkdir(path, { recursive: true });
  database = new DB(fileName);

  // Create tables
  database.query(sqlCreateSpotprice);
  database.query(sqlCreateExchangeRate);
} catch (_e) {
  console.error("Fatal: Could not open database");
  Deno.exit(1);
}

const GetSpotprice = (area: string, period: string, fromDate: string, toDate: string, currency?: string) => {
  // Check period
  if (!Object.keys(sqlGroupBy).includes(period)) {
    throw new Error("Invalid group by option in query");
  }

  let result;
  if (currency) {
    result = database.query(sqlConverted.replaceAll("[[groupby]]", sqlGroupBy[period]), [currency, area, fromDate, toDate]);
  } else {
    result = database.query(sqlRaw.replaceAll("[[groupby]]", sqlGroupBy[period]), [area, fromDate, toDate]);
  }

  return result;
};

const GetDataDay = (areaName: string, date: Date) => {
  const result = GetSpotprice(
    areaName,
    "hourly",
    date.toLocaleDateString("sv-SE"),
    date.toLocaleDateString("sv-SE"),
  ).map((r: SpotApiRow) => {
    return { time: new Date(Date.parse(r[0])), price: r[1] };
  });
  return result;
};

const GetDataMonth = (areaName: string, date: Date) => {
  const startDate = new Date(date),
    endDate = new Date(date);
  startDate.setDate(1);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  return GetSpotprice(
    areaName,
    "hourly",
    startDate.toLocaleDateString("sv-SE"),
    endDate.toLocaleDateString("sv-SE"),
  ).map((r: SpotApiRow) => {
    return { time: new Date(Date.parse(r[0])), price: r[1] };
  });
};

const GetExchangeRates = () => {
  const result = database.query(sqlExchangeRates),
    entries : Record<string,number> = {};
  for (const row of result) {
    entries[row[0]] = row[1];
  }

  const outut : ExchangeRateRow = {
    date: new Date().toLocaleDateString("sv-SE"),
    entries,
  };

  return outut;
};

export type { SpotApiRow, ExchangeRateRow };
export { database, GetDataDay, GetDataMonth, GetExchangeRates, GetSpotprice };
