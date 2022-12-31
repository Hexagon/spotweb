import { Cron } from "croner";
import { sleep } from "sleep";

import { countries } from "config/countries.ts";
import { EntsoeSpotprice } from "backend/integrations/entsoe.ts";
import { ExchangeRate } from "backend/integrations/ecb.ts";
import { database, Row } from "backend/db/index.ts";
import { log } from "utils/log.ts";

const startDate = new Date(Date.parse("2020-12-31T12:00:00Z"));

const jobs = new Cron("0 */3 12,13,14 * * *", { paused: true, timezone: "Europe/Oslo" }, async () => {
  log("info", "Scheduled data update started");

  // Get current date
  const dateToday = new Date(),
    dateTomorrow = new Date(),
    dateFirstOfMonth = new Date();

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
      currentPeriod = new Date(maxPeriodResult[0][0] && typeof maxPeriodResult[0][0] === "string" ? new Date(maxPeriodResult[0][0]) : startDate);

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
        log("info", "Getting" + area.id + " " + currentPeriod + " " + endOfPeriod);
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
            }

            currentPeriod = endOfPeriod;

            // Add one day to start date if we are not at start
            currentPeriod.setDate(currentPeriod.getDate() + 1);
          } else {
            log("info", "No new data" + JSON.stringify(result));
            errored = true;
          }
        } catch (e) {
          log("error", "entsoe request failed " + e);
          errored = true;
        }

        // Let loop sleep
        await sleep(2);
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

  log("info", "Scheduled data update done");
});

const scheduler = {
  start: () => {
    jobs.resume();
    log("info", "Scheduler started, next run is at " + jobs.next());
  },
  stop: () => {
    jobs.stop();
  },
};

export { scheduler };
