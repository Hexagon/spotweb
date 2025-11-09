import { PupTelemetry } from "@pup/telemetry";
import { countries } from "config/countries.ts";
import { EntsoeLoad } from "backend/integrations/entsoe.ts";
import { openDatabase } from "backend/db/minimal.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";

const tm = new PupTelemetry();

const database = await openDatabase({ int64: true });

// queryArea = ENTSO-E domain used for API, dbArea = key stored in DB used by UI queries
const UpdateLoadForArea = async (queryArea: string, dbArea: string) => {
  // Get current date
  const dateToday = new Date(),
    dateYesterday = new Date();

  // Set dates
  dateYesterday.setDate(dateYesterday.getDate() - 1);

  // Get data
  log("info", `Getting load for ${dbArea} via ${queryArea} ${dateToday.toLocaleString()}-${dateYesterday.toLocaleString()}`);
  try {
    const result = await EntsoeLoad(queryArea, dateYesterday, dateToday),
      preparedQuery = database.prepare("INSERT INTO load (area, value, period, interval) VALUES (?,?,?,?)");
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
          row.interval,
        ]);
      }
      runTransaction(transaction);
    } else {
      log("info", `No new data for ${dbArea}`);
    }
  } catch (e) {
    log("error", `Entsoe request failed ${e}`);
  }
};

const HourlyConsumptionUpdate = async () => {
  log("info", `Scheduled data update started`);

  try {
    // Get current month
    for (const country of countries) {
      // Country-level: query with CTA code, store as country.cty so UI queries match
      await UpdateLoadForArea(country.cta as string, country.cty);
      await sleep(2000);
      for (const area of country.areas) {
        // Area-level: use BZN/IBA id for both query and DB
        await UpdateLoadForArea(area.id, area.id);
        await sleep(2000);
      }
    }

    // Delete duplicated
    log("info", `Cleaning up.`);
    database.exec("DELETE FROM load WHERE id NOT IN (SELECT MAX(id) FROM load GROUP BY area,period,interval)");
    if (database.totalChanges) {
      log("info", `Deleted ${database.totalChanges} duplicate rows.`);
    }
  } catch (e) {
    log("error", `Error occured while updating data, skipping. Error: ${e}`);
  }

  log("info", `Scheduled data update done`);

  tm.emit("spotweb-main", "clear_cache", { cache: "load" });
  tm.emit("spotweb-main", "clear_cache", { cache: "generation" });

  database.close();

  tm.close();
};

HourlyConsumptionUpdate();
