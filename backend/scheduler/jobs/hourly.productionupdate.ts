import { countries } from "config/countries.ts";
import { EntsoeGeneration, EntsoeLoad } from "backend/integrations/entsoe.ts";
import { database } from "backend/db/index.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";
import { InvalidateCache } from "utils/datacache.ts";

let running = false;

const UpdateProductionForArea = async (area: string) => {

    // Get current date
    const dateToday = new Date(),
      dateYesterday = new Date();

    let gotData = false;

    // Set dates
    dateYesterday.setDate(dateYesterday.getDate() - 1);

    // Get data
    log("info", "Getting production for " + area + " " + dateYesterday.toLocaleString() + "-" + dateToday.toLocaleString());

    try {
      const 
        result = await EntsoeGeneration(area, dateYesterday, dateToday),
        preparedQuery = database.prepareQuery("INSERT INTO generation (area, value, period, psr, interval, consumption) VALUES (?,?,?,?,?,?)");
      if (result.length) {
        log("info", "Got " + result.length + " rows");
        for (const row of result) {
          preparedQuery.execute([
            area,
            row.quantity,
            row.date.getTime(),
            row.psr,
            row.interval,
            row.consumption
          ]);

          // Sleep one millisecond between each row to allow clients to fetch data
          await sleep(1);

          // Go data
          gotData = true;
        }
      } else {
        log("info", "No new data for " + area);
      }
    } catch (e) {
      log("error", "entsoe request failed " + e);
    }

};

const HourlyProductionUpdate = async () => {
  log("info", "Scheduled data update started");
  
  // Do not run two just simulataneously
  if (running) {
    log("info", "Previous job still running, skipping");
    return;
  } else {
    running = true;
  }

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
    log("info", "Cleaning up.");
    database.query("DELETE FROM generation WHERE id NOT IN (SELECT MAX(id) FROM generation GROUP BY area,period,psr,consumption)");
    if(database.totalChanges) {
      log("info", "Deleted " + database.totalChanges + " duplicate rows.");
    }

  } catch (e) {
    log("error", "Error occured while updating data, skipping. Error: " + e);
  }
  
  // Clear memory cache
  log("info", "Database changed, clearing cache, realm generation.");
  InvalidateCache("generation");

  running = false;

  log("info", "Scheduled data update done");
};

export { HourlyProductionUpdate };