import { PupTelemetry } from "@pup/telemetry";
import { countries } from "config/countries.ts";
import { EntsoeGeneration } from "backend/integrations/entsoe.ts";
import { openDatabase } from "backend/db/minimal.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";

const tm = new PupTelemetry();

const database = await openDatabase({ int64: true });

const AGGREGATION_LOOKBACK_HOURS = 48;

const AggregateCountryGeneration = (country: typeof countries[number]) => {
  if (!country?.areas?.length) return;

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - AGGREGATION_LOOKBACK_HOURS, 0, 0, 0);
  const cutoffMs = cutoff.getTime();

  const areaIds = country.areas.map((a) => a.id);
  if (!areaIds.length) return;

  const placeholders = areaIds.map(() => "?").join(", ");

  log("info", `Aggregating production for ${country.name}`);

  try {
    const deleteStmt = database.prepare("DELETE FROM generation WHERE area = ? AND period >= ?");
    deleteStmt.run(country.cty, cutoffMs);

    const aggregateSql = `
      INSERT INTO generation (area, value, period, psr, interval, consumption)
      SELECT ?, SUM(value) as value, period, psr, interval, consumption
      FROM generation
      WHERE area IN (${placeholders}) AND period >= ?
      GROUP BY period, psr, interval, consumption
    `;

    const insertStmt = database.prepare(aggregateSql);
    insertStmt.run(country.cty, ...areaIds, cutoffMs);
  } catch (e) {
    log("error", `Failed aggregating production for ${country.name}: ${e}`);
  }
};

// queryArea = ENTSO-E domain used for API, dbArea = key stored in DB used by UI queries
const UpdateProductionForArea = async (queryArea: string, dbArea: string) => {
  // Get current date
  const dateToday = new Date(),
    dateYesterday = new Date();

  // Set dates
  dateYesterday.setDate(dateYesterday.getDate() - 1);

  // Get data
  log("info", `Getting production for ${dbArea} via ${queryArea} ${dateYesterday.toLocaleString()}-${dateToday.toLocaleString()}`);

  try {
    const result = await EntsoeGeneration(queryArea, dateYesterday, dateToday),
      preparedQuery = database.prepare("INSERT INTO generation (area, value, period, psr, interval, consumption) VALUES (?,?,?,?,?,?)");
    // deno-lint-ignore no-explicit-any
    const runTransaction = database.transaction((data: any[]) => {
      for (const item of data) {
        preparedQuery.run(...item);
      }
    });

    if (result.length) {
      log("info", `Got ${result.length} rows`);
      const transaction = [];
      for (const row of result) {
        transaction.push([
          dbArea,
          row.quantity,
          row.date.getTime(),
          row.psr,
          row.interval,
          row.consumption,
        ]);
      }
      runTransaction(transaction);
    } else {
      log("info", `No new data for ${dbArea}`);
    }
  } catch (e) {
    log("error", `entsoe request failed: ${e}`);
  }
};

const HourlyProductionUpdate = async () => {
  log("info", `Scheduled data update started`);

  try {
    // Get current month
    for (const country of countries) {
      // Country-level: query with CTA code, store as country.cty so UI queries match
      await UpdateProductionForArea(country.cta as string, country.cty);
      await sleep(2000);
      for (const area of country.areas) {
        // Area-level: use BZN/IBA id for both query and DB
        await UpdateProductionForArea(area.id, area.id);
        await sleep(2000);
      }

      AggregateCountryGeneration(country);
    }

    // Delete duplicated
    log("info", `Cleaning up.`);
    database.exec("DELETE FROM generation WHERE id NOT IN (SELECT MAX(id) FROM generation GROUP BY area,period,psr,consumption)");
    if (database.totalChanges) {
      log("info", `Deleted ${database.totalChanges} duplicate rows.`);
    }
  } catch (e) {
    log("error", `Error occured while updating data, skipping. Error: ${e}`);
  }

  log("info", `Scheduled data update done`);

  tm.emit("spotweb-main", "clear_cache", { cache: "load" });
  tm.emit("spotweb-main", "clear_cache", { cache: "generation" });
  //tm.emit("spotweb-main-2", "clear_cache", { cache: "load" });
  //tm.emit("spotweb-main-2", "clear_cache", { cache: "generation" });
  //tm.emit("spotweb-main-3", "clear_cache", { cache: "load" });
  //tm.emit("spotweb-main-3", "clear_cache", { cache: "generation" });

  database.close();

  tm.close();
};

HourlyProductionUpdate();
