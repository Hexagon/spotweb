import { PupTelemetry } from "pup/telemetry.ts"
import { countries } from "config/countries.ts";
import { EntsoeLoad } from "backend/integrations/entsoe.ts";
import { openDatabase } from "backend/db/minimal.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";

const tm = new PupTelemetry();

const database = await openDatabase({ int64: true });

const UpdateLoadForArea = async (area: string) => {
  // Get current date
  const dateToday = new Date(),
    dateYesterday = new Date();

  // Set dates
  dateYesterday.setDate(dateYesterday.getDate() - 1);

  // Get data
  log("info", `Getting load for ${area} ${dateToday.toLocaleString()}-${dateYesterday.toLocaleString()}`);
  try {
    const result = await EntsoeLoad(area, dateYesterday, dateToday),
      preparedQuery = database.prepare("INSERT INTO load (area, value, period, interval) VALUES (?,?,?,?)");
    const runTransaction = database.transaction((data: any[]) => {
      for (const item of data) {
        preparedQuery.run(...item);
      }
    });
    if (result.length) {
      log("info", `Got ${result.length} rows`);
      const transaction = []
      for (const row of result) {
          transaction.push([
            area,
            row.quantity,
            row.date.getTime(),
            row.interval,
          ]);
        }
        runTransaction(transaction);    
    } else {
      log("info", `No new data for ${area}`);
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
      await UpdateLoadForArea(country.cty);
      await sleep(2000);
      for (const area of country.areas) {
        await UpdateLoadForArea(area.id);
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

  // Clear memory cache
  log("info", `Database changed, clearing cache, realm load.`);

  log("info", `Scheduled data update done`);

  tm.emit("spotweb-main-1", "clear_cache", { cache: "load" });
  tm.emit("spotweb-main-1", "clear_cache", { cache: "generation" });
  tm.emit("spotweb-main-2", "clear_cache", { cache: "load" });
  tm.emit("spotweb-main-2", "clear_cache", { cache: "generation" });
  tm.emit("spotweb-main-3", "clear_cache", { cache: "load" });
  tm.emit("spotweb-main-3", "clear_cache", { cache: "generation" });

  database.close();
};

HourlyConsumptionUpdate();
