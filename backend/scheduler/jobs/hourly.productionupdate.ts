import { countries } from "config/countries.ts";
import { EntsoeGeneration } from "backend/integrations/entsoe.ts";
import { database } from "backend/db/index.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";
import { InvalidateCache } from "utils/datacache.ts";
import { Cron } from "croner";

const UpdateProductionForArea = async (area: string, jobName: string) => {
  // Get current date
  const dateToday = new Date(),
    dateYesterday = new Date();

  // Set dates
  dateYesterday.setDate(dateYesterday.getDate() - 1);

  // Get data
  log("info", `${jobName}: Getting production for ${area} ${dateYesterday.toLocaleString()}-${dateToday.toLocaleString()}`);

  try {
    const result = await EntsoeGeneration(area, dateYesterday, dateToday),
      preparedQuery = database.prepareQuery("INSERT INTO generation (area, value, period, psr, interval, consumption) VALUES (?,?,?,?,?,?)");
    if (result.length) {
      log("info", `${jobName}: Got ${result.length} rows`);
      for (const row of result) {
        preparedQuery.execute([
          area,
          row.quantity,
          row.date.getTime(),
          row.psr,
          row.interval,
          row.consumption,
        ]);

        // Sleep one millisecond between each row to allow clients to fetch data
        await sleep(1);
      }
    } else {
      log("info", `${jobName}: No new data for ${area}`);
    }
  } catch (e) {
    log("error", `${jobName}: entsoe request failed: ${e}`);
  }
};

const HourlyProductionUpdate = async (inst?: Cron) => {
  const jobName = inst?.name ? inst.name : "HourlyProductionUpdate";

  log("info", `${jobName}: Scheduled data update started`);

  try {
    // Get current month
    for (const country of countries) {
      await UpdateProductionForArea(country.cty, jobName);
      await sleep(2000);
      for (const area of country.areas) {
        await UpdateProductionForArea(area.id, jobName);
        await sleep(2000);
      }
    }

    // Delete duplicated
    log("info", `${jobName}: Cleaning up.`);
    database.query("DELETE FROM generation WHERE id NOT IN (SELECT MAX(id) FROM generation GROUP BY area,period,psr,consumption)");
    if (database.totalChanges) {
      log("info", `${jobName}: Deleted ${database.totalChanges} duplicate rows.`);
    }
  } catch (e) {
    log("error", `${jobName}: Error occured while updating data, skipping. Error: ${e}`);
  }

  // Clear memory cache
  log("info", `${jobName}: Database changed, clearing cache, realm generation.`);

  // Consumption (load) is updated after generation, but they are often
  // used together, clear both caches on completion
  InvalidateCache("generation");
  InvalidateCache("load");

  log("info", `${jobName}: Scheduled data update done`);
};

HourlyProductionUpdate();
