import { Cron } from "croner";
import { sleep } from "utils/common.ts";

import { countries } from "config/countries.ts";
import { EntsoeSpotprice } from "backend/integrations/entsoe.ts";
import { ExchangeRate } from "backend/integrations/ecb.ts";
import { database } from "backend/db/index.ts";
import { log } from "utils/log.ts";
import { InvalidateCache } from "../../utils/datacache.ts";

const startDate = new Date(Date.parse("2020-12-31T12:00:00Z"));
let running = false;

const job = async () => {
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
            const result = await EntsoeSpotprice(area.id, currentPeriod, endOfPeriod);
            if (result.length) {
              log("info", "Got " + result.length + " rows");
              for (const row of result) {
                database.query("INSERT INTO spotprice (country, area, spotprice, period, date) VALUES (?,?,?,?,?)", [
                  country.id,
                  area.name,
                  row.spotPrice,
                  row.startTime.getTime(),
                  row.startTime.toLocaleDateString("sv-SE"),
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

    // Updating currencies
    const maxCurrencyResult = database.query("SELECT MAX(period) as mp FROM exchangerate WHERE date >= (?)", [dateToday.toLocaleDateString("sv-SE")]);
    if (maxCurrencyResult[0][0] === null) {
      const result = await ExchangeRate();
      const entries: [string, string][] = Object.entries(result.entries);
      for (const [currency, value] of entries) {
        database.query("INSERT INTO exchangerate (currency, value, period, date) VALUES (?,?,?,?)", [
          currency,
          value,
          dateToday.getTime(),
          dateToday.toLocaleDateString("sv-SE"),
        ]);
      }
    }

    // Delete duplicated
    log("info", "Cleaning up.");
    database.query("DELETE FROM spotprice WHERE id NOT IN (SELECT MAX(id) FROM spotprice GROUP BY area,country,period)");
    if(database.totalChanges) {
      log("info", "Deleted " + database.totalChanges + " duplicate rows.");
    }

    // Clear memory cache
    if (gotData) {
      log("info", "Database changed, clearing cache.");
      InvalidateCache();
    }

  } catch (e) {
    log("error", "Error occured while updating data, skipping. Error: " + e);
  }

  running = false;

  log("info", "Scheduled data update done");
};

const hourlyJob = async () => {
  const urlsToRefresh = ["/sv","/no","/fi","/dk","/de"];
  for(const url of urlsToRefresh) {
    try {
      const status = await fetch("https://spot.56k.guru"+url);
      log("info", "Refreshed " + url + " with status code " + status.status);
    } catch (e) {
      log("info", "Error refreshing " + url);
    }
    sleep(1000);
  }
};

const dailyUpdate = new Cron("0 */3 12,13,14 * * *", { paused: true, timezone: "Europe/Oslo" }, job);
const hourlyRefresh = new Cron("0 30 * * * *", { paused: true, timezone: "Europe/Oslo" }, hourlyJob);

const scheduler = {
  start: () => {
    dailyUpdate.resume();
    log("info", "Scheduler started, next run is at " + dailyUpdate.next()?.toLocaleString());
  },
  stop: () => {
    dailyUpdate.stop();
  },
  instant: () => {
    log("info", "Instant update requested");
    job();
    hourlyJob();
  }
};

export { scheduler };
