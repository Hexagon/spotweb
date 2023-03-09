import { ExchangeRate } from "backend/integrations/ecb.ts";
import { database } from "backend/db/index.ts";
import { log } from "utils/log.ts";
import { InvalidateCache } from "utils/datacache.ts";
import { Cron } from "croner";

const DailyCurrencyUpdate = async (inst?: Cron) => {
  const jobName = inst?.name ? inst.name : "DailyCurrencyUpdate";

  log("info", `${jobName}: Scheduled data update started`);

  try {
    // Get current date
    const dateToday = new Date();

    // Set times
    dateToday.setHours(0, 0, 0, 0);

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
  } catch (e) {
    log("error", `${jobName}: Error occured while updating data, skipping. Error: ${e}`);
  }

  // Clear memory cache
  log("info", `${jobName}: Database changed, clearing cache, realm extrate.`);
  InvalidateCache("exrate");

  log("info", `${jobName} Scheduled data update done`);
};
 
DailyCurrencyUpdate();
