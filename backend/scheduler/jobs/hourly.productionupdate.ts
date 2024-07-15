import { PupTelemetry } from "@pup/telemetry";
import { countries } from "config/countries.ts";
import { EntsoeGeneration } from "backend/integrations/entsoe.ts";
import { openDatabase } from "backend/db/minimal.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";

const tm = new PupTelemetry();

const database = await openDatabase({ int64: true });

const UpdateProductionForArea = async (area: string) => {
  // Get current date
  const dateToday = new Date(),
    dateYesterday = new Date();

  // Set dates
  dateYesterday.setDate(dateYesterday.getDate() - 1);

  // Get data
  log("info", `Getting production for ${area} ${dateYesterday.toLocaleString()}-${dateToday.toLocaleString()}`);

  try {
    const result = await EntsoeGeneration(area, dateYesterday, dateToday),
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
          area,
          row.quantity,
          row.date.getTime(),
          row.psr,
          row.interval,
          row.consumption,
        ]);
      }
      runTransaction(transaction);
    } else {
      log("info", `No new data for ${area}`);
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
      await UpdateProductionForArea(country.cty);
      await sleep(2000);
      for (const area of country.areas) {
        await UpdateProductionForArea(area.id);
        await sleep(2000);
      }
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
