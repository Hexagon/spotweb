import { countries } from "config/countries.ts";
import { EntsoeSpotprice } from "backend/integrations/entsoe.ts";
import { database } from "backend/db/index.ts";
import { log } from "utils/log.ts";
import { InvalidateCache } from "utils/datacache.ts";
import { sleep } from "utils/common.ts";

const startDate = new Date(Date.parse("2020-12-31T12:00:00Z"));
let running = false;

const DailyPriceUpdate = async () => {
  log("info", "Scheduled data update started");
  
  // Do not run two just simulataneously
  if (running) {
    log("info", "Previous job still running, skipping");
    return;
  } else {
    running = true;
  }

  try {
    // Get current date
    const dateToday = new Date(),
      dateTomorrow = new Date(),
      dateFirstOfMonth = new Date();

    let gotData = false;

    // Set dates
    dateTomorrow.setDate(dateTomorrow.getDate() + 1);
    dateFirstOfMonth.setDate(1);

    // Set times
    dateTomorrow.setHours(23, 0, 0, 0);
    dateFirstOfMonth.setHours(0, 0, 0, 0);
    dateToday.setHours(0, 0, 0, 0);

    // Get current month
    for (const country of countries) {
      for (const area of country.areas) {
        // Get maximum date from area, or fallback to startdate
        let currentPeriod;
        const maxPeriodResult = database.query("SELECT MAX(period) as mp FROM spotprice WHERE country=(?) AND area=(?)", [country.id, area.name]);
        currentPeriod = new Date(maxPeriodResult[0][0] && typeof maxPeriodResult[0][0] === "number" ? new Date(maxPeriodResult[0][0]) : startDate);

        // Loop until we are at endDate
        let errored = false;

        // Add one day to start date if we are not at start
        if (currentPeriod != startDate) currentPeriod.setDate(currentPeriod.getDate() + 1);
        currentPeriod.setHours(0, 0, 0, 0);

        while ((currentPeriod.getTime() < dateTomorrow.getTime()) && !errored) {
          // Always start at 00:00:00
          currentPeriod.setHours(0, 0, 0, 0);

          // Find next month and subtract one day
          let endOfPeriod: Date = new Date(currentPeriod);
          endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
          endOfPeriod = new Date(endOfPeriod);
          endOfPeriod.setDate(endOfPeriod.getDate() - 1);
          endOfPeriod.setHours(23, 0, 0, 0);
          endOfPeriod = new Date(Math.min(endOfPeriod.getTime(), dateTomorrow.getTime()));

          // Get data
          log("info", "Getting" + area.id + " " + currentPeriod.toLocaleString() + " " + endOfPeriod.toLocaleString());
          try {
            const result = await EntsoeSpotprice(area.id, currentPeriod, endOfPeriod),
              preparedQuery = database.prepareQuery("INSERT INTO spotprice (country, area, spotprice, period, interval) VALUES (?,?,?,?,?)");
            if (result.length) {
              log("info", "Got " + result.length + " rows");
              for (const row of result) {
                preparedQuery.execute([
                  country.id,
                  area.name,
                  row.spotPrice,
                  row.startTime.getTime(),
                  row.interval
                ]);

                // Sleep one millisecond between each row to allow clients to fetch data
                await sleep(1);

                // Go data
                gotData = true;
              }

              currentPeriod = endOfPeriod;

              // Add one day to start date if we are not at start
              currentPeriod.setDate(currentPeriod.getDate() + 1);
            } else {
              log("info", "No new data for " + area.id);
              errored = true;
            }
          } catch (e) {
            log("error", "entsoe request failed " + e);
            errored = true;
          }

          // Let loop sleep
          await sleep(2000);
        }
      }
    }

    // Delete duplicated
    log("info", "Cleaning up.");
    database.query("DELETE FROM spotprice WHERE id NOT IN (SELECT MAX(id) FROM spotprice GROUP BY area,country,period,interval)");
    if(database.totalChanges) {
      log("info", "Deleted " + database.totalChanges + " duplicate rows.");
    }

    // Clear memory cache
    if (gotData) {
      log("info", "Database changed, clearing cache, realm spotprice.");
      InvalidateCache("spotprice");
    }

  } catch (e) {
    log("error", "Error occured while updating data, skipping. Error: " + e);
  }

  running = false;

  log("info", "Scheduled data update done");
};

export { DailyPriceUpdate };