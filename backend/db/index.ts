import { DB, Row } from "sqlite";
import { resolve } from "std/path/mod.ts";
import { sqlConverted, sqlCreateExchangeRate, sqlCreateSpotprice, sqlExchangeRates, sqlGroupBy, sqlRaw } from "backend/db/sql/index.ts";
import { DataCache } from "../../utils/datacache.ts";

interface SpotApiRow {
  time: string;
  price: number;
  min?: number;
  max?: number;
}

interface SpotApiParsedRow {
  time: Date;
  price: number;
  min?: number;
  max?: number;
}

interface ExchangeRateResult {
  date: string;
  entries: Record<string, number>;
}

// Try creating/opening database
let database: DB;
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

const GetSpotprice = async (area: string, period: string, fromDate: string, toDate: string, currency?: string) => {
  // Check period
  if (!Object.keys(sqlGroupBy).includes(period)) {
    throw new Error("Invalid group by option in query");
  }

  const parameterString = new URLSearchParams({period,area,currency:currency||"",fromDate,toDate}).toString();

  let cacheLength = 120;

  // If endDate is before now, use hourly cache
  if(Date.parse(toDate) < new Date().getTime()) {
    cacheLength = 3600*6;
  }

  // If aggrated monthly, use long cache
  if(period.toLowerCase().trim() === "monthly") {
    cacheLength = 3600*6;
  }

  const result = await DataCache(parameterString,cacheLength,() => {
    let data;
    if (currency) {
      data = database.query(sqlConverted.replaceAll("[[groupby]]", sqlGroupBy[period]), [currency, area, fromDate, toDate]);
    } else {
      data = database.query(sqlRaw.replaceAll("[[groupby]]", sqlGroupBy[period]), [area, fromDate, toDate]);
    }
    return { data };
  });
  return result;
};

const GetDataDay = async (areaName: string, date: Date, currency?: string) : Promise<SpotApiParsedRow[]> => {

  const result = await GetSpotprice(
    areaName,
    "hourly",
    date.toLocaleDateString("sv-SE"),
    date.toLocaleDateString("sv-SE"),
    currency
  );

  return result.data.map((r) => {
    return { time: new Date(Date.parse(r.at(0) as string)), price: r.at(1) as number };
  });
};

const GetDataMonth = async (areaName: string, date: Date, currency?: string) => {
  const startDate = new Date(date),
    endDate = new Date(date);
  startDate.setDate(1);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  
  const result = await GetSpotprice(
    areaName,
    "hourly",
    startDate.toLocaleDateString("sv-SE"),
    endDate.toLocaleDateString("sv-SE"),
    currency
  );

  return result.data.map((r) => {
    return {
      time: new Date(Date.parse(r.at(0) as string)),
      price: (r.at(1) as number),
    };
  });
};

const GetExchangeRates = async () : Promise<ExchangeRateResult> => {

  const output = await DataCache("__exrate",3600,() => {
    const result = database.query(sqlExchangeRates),
      entries: Record<string, number> = {};

    for (const row of result) {
      entries[row[0] as string] = row[1] as number;
    }

    return {
      data: {
        date: new Date().toLocaleDateString("sv-SE"),
        entries,
      }
    };
  });

  return output.data;
};

export type { ExchangeRateResult, Row, SpotApiParsedRow, SpotApiRow };
export { database, GetDataDay, GetDataMonth, GetExchangeRates, GetSpotprice };
