import { Database, DatabaseOpenOptions } from "sqlite3";
import { resolve } from "std/path/mod.ts";
import {
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
} from "backend/db/sql/index.ts";
import { DataCache } from "utils/datacache.ts";
import { log } from "utils/log.ts";
import { DBUpdates } from "./sql/updates.ts";

interface SpotApiRow {
  time: number;
  price: number;
  min?: number;
  max?: number;
}

interface ExchangeRateResult {
  date: string;
  entries: Record<string, number>;
}

interface DBResultSet {
  data: Array<Array<string | number>>;
}

async function openDatabase(options: DatabaseOpenOptions) {
  const path = resolve(Deno.cwd(), "./db/"),
    fileName = resolve(path, "main.db");
  await Deno.mkdir(path, { recursive: true });
  const database = new Database(fileName, options);
  return database;
}

// Try creating/opening database
let database: Database;
try {
  database = await openDatabase({ int64: true });

  // Create tables
  database.exec(sqlCreateSpotprice);
  database.exec(sqlCreateExchangeRate);
  database.exec(sqlCreateGeneration);
  database.exec(sqlCreateLoad);
  database.exec(sqlCreateUpdates);
  database.exec(sqlCreatePsr);

  // Apply updates
  const appliedUpdates = database.prepare(sqlAppliedUpdates).values();
  for (const update of DBUpdates) {
    // Update alredy applied?
    if (!appliedUpdates.find((r) => r[0] == update.name)) {
      // Nope! Do apply!
      log("log", `Applying db update '${update.name}'`);
      try {
        database.exec(update.sql);
        database.prepare("INSERT INTO updates(name, applied) VALUES(?,?)").values(update.name, 1);
      } catch (e) {
        log("log", `Database update '${update.name}' failed. Error: ${e.code} ${e}`);
      } finally {
        log("log", `Database update '${update.name}' finalized`);
      }
    }
  }
} catch (_e) {
  console.error("Fatal: Could not open database", _e);
  Deno.exit(1);
}

const GetSpotprice = async (
  area: string | undefined,
  country: string | undefined,
  period: string,
  fromDate: Date,
  toDate: Date,
  interval: string,
  currency?: string,
): Promise<SpotApiRow[]> => {
  // Check period
  if (!Object.keys(sqlGroupBy).includes(period)) {
    throw new Error("Invalid group by option in query");
  }

  const parameterString = new URLSearchParams({
    period,
    area: area || "undefined",
    country: country || "undefined",
    interval,
    currency: currency || "",
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
  }).toString();

  // Use very short cache as default
  let cacheLength = 360;

  // If endDate is before now, use short cache
  if (toDate.getTime() < new Date().getTime()) {
    cacheLength = 3600;
  }

  // If aggrated monthly, use long cache
  if (period.toLowerCase().trim() === "monthly") {
    cacheLength = 3600 * 6;
  }

  const result = await DataCache("spotprice", parameterString, cacheLength, (): SpotApiRow[] => {
    let data: Array<Array<number>>;
    if (currency) {
      data = database.prepare(
        sqlConverted
          .replaceAll("[[groupby]]", sqlGroupBy[period])
          .replaceAll("[[areaField]]", country ? "country" : "area"),
      ).values(currency, country || area, fromDate.getTime(), toDate.getTime(), interval);
    } else {
      data = database.prepare(
        sqlRaw
          .replaceAll("[[groupby]]", sqlGroupBy[period])
          .replaceAll("[[areaField]]", country ? "country" : "area"),
      ).values(
        country || area,
        fromDate.getTime(),
        toDate.getTime(),
        interval,
      );
    }
    return data.map((r) => {
      if (r.length > 2) {
        return { time: r.at(0) as number, price: r.at(1) as number, min: r.at(2) as number, max: r.at(3) as number };
      } else {
        return { time: r.at(0) as number, price: r.at(1) as number };
      }
    });
  });

  return result;
};

const GetDataDay = async (areaName: string, date: Date, interval: string, currency?: string): Promise<SpotApiRow[]> => {
  const startDate = new Date(date),
    endDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return await GetSpotprice(
    areaName,
    undefined,
    "hourly",
    startDate,
    endDate,
    interval,
    currency === "EUR" ? undefined : currency,
  );
};

const GetLoadDay = async (area: string, fromDateIn: Date, toDateIn: Date, interval: string): Promise<DBResultSet> => {
  const fromDate = new Date(fromDateIn.getTime()),
    toDate = new Date(toDateIn.getTime());

  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  const parameterString = new URLSearchParams({ interval, area, f: fromDate.getTime().toString(), t: toDate.getTime().toString() }).toString(),
    cacheLength = 1800;

  return await DataCache("load", parameterString, cacheLength, () => {
    const data = database.prepare(sqlLoad).values(area, fromDate.getTime(), toDate.getTime(), interval);
    return { data };
  });
};

const GetLastPricePerArea = async (): Promise<DBResultSet> => {
  const fromDate = new Date();
  fromDate.setMinutes(0, 0, 0);

  const parameterString = new URLSearchParams({ query: "lastprice", f: fromDate.getTime().toString() }).toString(),
    cacheLength = 1800;

  return await DataCache("spotprice", parameterString, cacheLength, () => {
    const data = database.prepare(sqlLatestPricePerArea).values(fromDate.getTime());
    return { data };
  });
};

const GetLastPricePerCountry = async (): Promise<DBResultSet> => {
  const fromDate = new Date();
  fromDate.setMinutes(0, 0, 0);

  const parameterString = new URLSearchParams({ query: "lastpricec", f: fromDate.getTime().toString() }).toString(),
    cacheLength = 1800;

  return await DataCache("spotprice", parameterString, cacheLength, () => {
    const data = database.prepare(sqlLatestPricePerCountry).values(fromDate.getTime());
    return { data };
  });
};

const GetLastGenerationAndLoad = async (): Promise<DBResultSet> => {
  const fromDate = new Date();

  fromDate.setHours(fromDate.getHours() - 12, 0, 0, 0);

  const parameterString = new URLSearchParams({ query: "curgenload", f: fromDate.getTime().toString() }).toString(),
    cacheLength = 1800;

  return await DataCache("generation", parameterString, cacheLength, () => {
    const data = database.prepare(sqlCurrentLoadAndGeneration).values(fromDate.getTime());
    return { data };
  });
};

const GetGenerationAndLoad = async (area: string, fromDateIn: Date, toDateIn: Date): Promise<DBResultSet> => {
  const fromDate = new Date(fromDateIn.getTime()),
    toDate = new Date(toDateIn.getTime());

  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(0, 0, 0, 0);

  const parameterString = new URLSearchParams({ query: "genload", a: area, f: fromDate.getTime().toString(), t: toDate.getTime().toString() })
      .toString(),
    cacheLength = 1800;

  return await DataCache("generation", parameterString, cacheLength, () => {
    const data = database.prepare(sqlLoadAndGeneration).values(area, fromDate.getTime(), toDate.getTime());
    return { data };
  });
};

const GetGenerationDay = async (area: string, fromDateIn: Date, toDateIn: Date, interval: string): Promise<DBResultSet> => {
  const fromDate = new Date(fromDateIn.getTime()),
    toDate = new Date(toDateIn.getTime());

  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  const parameterString = new URLSearchParams({ area, f: fromDate.getTime().toString(), t: toDate.getTime().toString(), interval }).toString(),
    cacheLength = 1800;

  return await DataCache("generation", parameterString, cacheLength, () => {
    const data = database.prepare(sqlGeneration).values(area, fromDate.getTime(), toDate.getTime(), interval);
    return { data };
  });
};

const GetDataMonth = async (areaName: string, date: Date, interval: string, currency?: string) => {
  const startDate = new Date(date),
    endDate = new Date(date);

  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);

  return await GetSpotprice(
    areaName,
    undefined,
    "hourly",
    startDate,
    endDate,
    interval,
    currency,
  );
};

const GetExchangeRates = async (): Promise<ExchangeRateResult> => {
  const output = await DataCache("exrate", "__exrate", 86400, () => {
    const result = database.prepare(sqlExchangeRates).values(),
      entries: Record<string, number> = {};

    for (const row of result) {
      entries[row[0] as string] = row[1] as number;
    }

    return {
      data: {
        date: new Date().toLocaleDateString("sv-SE"),
        entries,
      },
    };
  });

  return output.data;
};

const GetCurrentOutages = async (area: string): Promise<DBResultSet> => {
  const parameterString = new URLSearchParams({ f: "current", area }).toString(),
    cacheLength = 900;

  return await DataCache("outage", parameterString, cacheLength, () => {
    const data = database.prepare(sqlCurrentOutagesPerArea).values(
      new Date().getTime(),
      new Date().getTime(),
      area,
      new Date().getTime(),
      new Date().getTime(),
    );
    return { data };
  });
};

const GetFutureOutages = async (area: string): Promise<DBResultSet> => {
  const parameterString = new URLSearchParams({ f: "future", area }).toString(),
    cacheLength = 900;

  return await DataCache("outage", parameterString, cacheLength, () => {
    const data = database.prepare(sqlFutureOutagesPerArea).values(area, new Date().getTime());
    return { data };
  });
};

export type { DBResultSet, ExchangeRateResult, SpotApiRow };
export {
  database,
  GetCurrentOutages,
  GetDataDay,
  GetDataMonth,
  GetExchangeRates,
  GetFutureOutages,
  GetGenerationAndLoad,
  GetGenerationDay,
  GetLastGenerationAndLoad,
  GetLastPricePerArea,
  GetLastPricePerCountry,
  GetLoadDay,
  GetSpotprice,
  openDatabase,
};
