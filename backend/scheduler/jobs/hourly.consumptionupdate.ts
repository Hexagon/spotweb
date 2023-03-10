import { countries } from "config/countries.ts";
import { EntsoeLoad } from "backend/integrations/entsoe.ts";
import { database } from "backend/db/index.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";
import { InvalidateCache } from "utils/datacache.ts";

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
      preparedQuery = database.prepareQuery("INSERT INTO load (area, value, period, interval) VALUES (?,?,?,?)");
    if (result.length) {
      log("info", `Got ${result.length} rows`);
      for (const row of result) {
        preparedQuery.execute([
          area,
          row.quantity,
          row.date.getTime(),
          row.interval,
        ]);

        // Sleep one millisecond between each row to allow clients to fetch data
        await sleep(1);
      }
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
    database.query("DELETE FROM load WHERE id NOT IN (SELECT MAX(id) FROM load GROUP BY area,period,interval)");
    if (database.totalChanges) {
      log("info", `Deleted ${database.totalChanges} duplicate rows.`);
    }
  } catch (e) {
    log("error", `Error occured while updating data, skipping. Error: ${e}`);
  }

  // Clear memory cache
  log("info", `Database changed, clearing cache, realm load.`);

  // Consumption (load) is updated after generation, but they are often
  // used together, clear both caches on completion
  InvalidateCache("generation");
  InvalidateCache("load");

  log("info", `Scheduled data update done`);
};

HourlyConsumptionUpdate();
