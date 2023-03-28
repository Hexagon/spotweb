import { PupTelemetry } from "pup/telemetry.ts";
import { countries } from "config/countries.ts";
import { EntsoeSpotprice } from "backend/integrations/entsoe.ts";
import { openDatabase } from "backend/db/minimal.ts";
import { log } from "utils/log.ts";
import { sleep } from "utils/common.ts";

const tm = new PupTelemetry();

const database = await openDatabase({ int64: true, readonly: false });

const startDate = new Date(Date.parse("2020-12-31T12:00:00Z"));

const DailyPriceUpdate = async () => {
  log("info", `Scheduled data update started`);

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
        const maxPeriodResult = database.prepare("SELECT MAX(period) as mp FROM spotprice WHERE country=(?) AND area=(?)").values(
          country.id,
          area.name,
        );
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
          log("info", `Getting ${area.id} ${currentPeriod.toLocaleString()} ${endOfPeriod.toLocaleString()}`);
          try {
            const result = await EntsoeSpotprice(area.id, currentPeriod, endOfPeriod),
              preparedQuery = database.prepare("INSERT INTO spotprice (country, area, spotprice, period, interval) VALUES (?,?,?,?,?)");
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
                  country.id,
                  area.name,
                  row.spotPrice,
                  row.startTime.getTime(),
                  row.interval,
                ]);

                // Go data
                gotData = true;
              }

              runTransaction(transaction);

              currentPeriod = endOfPeriod;

              // Add one day to start date if we are not at start
              currentPeriod.setDate(currentPeriod.getDate() + 1);
            } else {
              log("info", `No new data for ${area.id}`);
              errored = true;
            }
          } catch (e) {
            log("error", `entsoe request failed ${e}`);
            errored = true;
          }

          // Let loop sleep
          await sleep(2000);
        }
      }
    }

    // Delete duplicated
    log("info", `Cleaning up.`);
    database.exec("DELETE FROM spotprice WHERE id NOT IN (SELECT MAX(id) FROM spotprice GROUP BY area,country,period,interval)");
    if (database.totalChanges) {
      log("info", `Deleted ${database.totalChanges} duplicate rows.`);
    }
  } catch (e) {
    log("error", `Error occured while updating data, skipping. Error: ${e}`);
  }

  log("info", `Scheduled data update done`);

  tm.emit("spotweb-main-1", "clear_cache", { cache: "spotprices" });
  tm.emit("spotweb-main-2", "clear_cache", { cache: "spotprices" });
  tm.emit("spotweb-main-3", "clear_cache", { cache: "spotprices" });

  database.close();
};

DailyPriceUpdate();
