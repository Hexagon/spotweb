import { DB, Row } from "sqlite";
import { resolve } from "std/path/mod.ts";
import { sqlAppliedUpdates, sqlConverted, sqlCreateExchangeRate, sqlCreateGeneration, sqlCreateLoad, sqlCreateSpotprice, sqlCreateUpdates, sqlExchangeRates, sqlGeneration, sqlGroupBy, sqlLoad, sqlRaw } from "backend/db/sql/index.ts";
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
  data: Array<Array<string|number>>
};

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
  database.query(sqlCreateGeneration);
  database.query(sqlCreateLoad);
  database.query(sqlCreateUpdates);

  // Apply updates
  const appliedUpdates = database.query(sqlAppliedUpdates);
  for(const update of DBUpdates) {
    // Update alredy applied?
    if (!appliedUpdates.find(r => r[0] == update.name)) {
      // Nope! Do apply!
      log("log", `Applying db update '${update.name}'`);
      try { 
        database.query(update.sql);
        database.query("INSERT INTO updates(name, applied) VALUES(?,?)",[update.name, 1]);
      } 
      catch { log("log", `Database update '${update.name}' failed`) }
      finally { log("log", `Database update '${update.name}' finalized`) }    
    }
  }
  
} catch (_e) {
  console.error("Fatal: Could not open database");
  Deno.exit(1);
}

const GetSpotprice = async (area: string|undefined, country: string|undefined, period: string, fromDate: Date, toDate: Date, interval: string, currency?: string) : Promise<SpotApiRow[]> => {
  // Check period
  if (!Object.keys(sqlGroupBy).includes(period)) {
    throw new Error("Invalid group by option in query");
  }

  const parameterString = new URLSearchParams({
    period,area: area || "undefined",
    country: country || "undefined",
    interval,
    currency:currency||"",
    fromDate:fromDate.toISOString(),
    toDate: toDate.toISOString()}
  ).toString();

  let cacheLength = 86400;

  // If endDate is before now, use hourly cache
  if(toDate.getTime() < new Date().getTime()) {
    cacheLength = 3600*6;
  }

  // If aggrated monthly, use long cache
  if(period.toLowerCase().trim() === "monthly") {
    cacheLength = 3600*6;
  }

  const result = await DataCache("spotprice",parameterString,cacheLength,() : SpotApiRow[] => {
    let data : Array<Array<number>>;
    if (currency) {
      data = database.query(
        sqlConverted
          .replaceAll("[[groupby]]", sqlGroupBy[period])
          .replaceAll("[[areaField]]", country ? "country" : "area"),
        [currency, country || area, fromDate.getTime(), toDate.getTime(), interval]
      );
    } else {
      data = database.query(
        sqlRaw
          .replaceAll("[[groupby]]", sqlGroupBy[period])
          .replaceAll("[[areaField]]", country ? "country" : "area"),
        [country || area, fromDate.getTime(), toDate.getTime(), interval]
      );
    }
    return data.map((r) => {
      if (r.length > 2) {
        return { time: r.at(0) as number, price: r.at(1) as number, min: r.at(2) as number, max: r.at(3) as number }
      } else {
        return { time: r.at(0) as number, price: r.at(1) as number }
      }
    });
  });

  return result;
};

const GetDataDayCountry = async (countryName: string, date: Date, interval: string, currency?: string) : Promise<SpotApiRow[]> => {
  
  const 
    startDate = new Date(date),
    endDate = new Date(date);
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

  return await GetSpotprice(
    undefined,
    countryName,
    "hourly",
    startDate,
    endDate,
    interval,
    currency
  );

};

const GetDataDay = async (areaName: string, date: Date, interval: string, currency?: string) : Promise<SpotApiRow[]> => {
  
  const 
    startDate = new Date(date),
    endDate = new Date(date);
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

  return await GetSpotprice(
    areaName,
    undefined,
    "hourly",
    startDate,
    endDate,
    interval,
    currency
  );

};

const GetLoadDay = async (area: string, fromDateIn: Date, toDateIn: Date, interval: string) : Promise<DBResultSet> => {
  
  const 
    fromDate = new Date(fromDateIn.getTime()),
    toDate = new Date(toDateIn.getTime());

  fromDate.setHours(0,0,0,0);
  toDate.setHours(23,59,59,999);

  const 
    parameterString = new URLSearchParams({interval,area,f:fromDate.getTime().toString(),t: toDate.getTime().toString()}).toString(),
    cacheLength = 86400;

  return await DataCache("load",parameterString,cacheLength,() => {
    const data = database.query(sqlLoad, [area, fromDate.getTime(), toDate.getTime(), interval]);
    return { data };
  });
};

const GetCurrentGeneration = async (area: string, interval: string) : Promise<DBResultSet> => {
  
  const 
    fromDate = new Date(),
    toDate = new Date();

  fromDate.setHours(fromDate.getHours()-4,0,0,0);
  toDate.setHours(23,59,59,999);

  const 
    parameterString = new URLSearchParams({area,interval,f:fromDate.getTime().toString(),t: toDate.getTime().toString()}).toString(),
    cacheLength = 86400;

  return await DataCache("generation",parameterString,cacheLength,() => {
    const data = database.query(sqlGeneration, [area, fromDate.getTime(), toDate.getTime(), interval]);
    return { data };
  });
};


const GetGenerationDay = async (area: string, fromDateIn: Date, toDateIn: Date) : Promise<DBResultSet> => {
  
  const
    fromDate = new Date(fromDateIn.getTime()),
    toDate = new Date(toDateIn.getTime());
  fromDate.setHours(0,0,0,0); 
  toDate.setHours(23,59,59,0);

  const 
    parameterString = new URLSearchParams({area,f:fromDate.getTime().toString(),t: toDate.getTime().toString()}).toString(),
    cacheLength = 86400;
  
  return await DataCache("generation",parameterString,cacheLength,() => {
    const data = database.query(sqlGeneration, [area, fromDate.getTime(), toDate.getTime()]);
    return { data };
  });
};


const GetDataMonth = async (areaName: string, date: Date, interval: string, currency?: string) => {

  const startDate = new Date(date),
    endDate = new Date(date);

  startDate.setDate(1);
  startDate.setHours(0,0,0,0);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23,59,59,999);
  
  return await GetSpotprice(
    areaName,
    undefined,
    "hourly",
    startDate,
    endDate,
    interval,
    currency
  );

};


const GetDataMonthCountry = async (countryName: string, date: Date, interval: string, currency?: string) => {

  const startDate = new Date(date),
    endDate = new Date(date);

  startDate.setDate(1);
  startDate.setHours(0,0,0,0);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23,59,59,999);
  
  return await GetSpotprice(
    undefined,
    countryName,
    "hourly",
    startDate,
    endDate,
    interval,
    currency
  );

};
const GetExchangeRates = async () : Promise<ExchangeRateResult> => {

  const output = await DataCache("exrate","__exrate",86400,() => {
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

export type { ExchangeRateResult, Row, SpotApiRow, DBResultSet };
export { database, GetLoadDay, GetGenerationDay, GetDataDay, GetDataMonth, GetDataDayCountry, GetDataMonthCountry, GetExchangeRates, GetSpotprice, GetCurrentGeneration };
