import { countries } from "config/countries.ts";
import { EntsoeGeneration } from "backend/integrations/entsoe.ts";
import { openDatabase } from "backend/db/minimal.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";

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
    if (result.length) {
      log("info", `Got ${result.length} rows`);
      for (const row of result) {
        preparedQuery.run(
          area,
          row.quantity,
          row.date.getTime(),
          row.psr,
          row.interval,
          row.consumption,
        );

        // Sleep one millisecond between each row to allow clients to fetch data
        await sleep(1);
      }
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

  database.close();
};

HourlyProductionUpdate();
