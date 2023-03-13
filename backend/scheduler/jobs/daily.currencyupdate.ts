import { ExchangeRate } from "backend/integrations/ecb.ts";
import { openDatabase } from "backend/db/rw.ts";
import { log } from "utils/log.ts";
import { InvalidateCache } from "utils/datacache.ts";

const database = await openDatabase({int64: true});

const DailyCurrencyUpdate = async () => {
  log("info", `Scheduled data update started`);

  // Get current date
  const dateToday = new Date();

  // Set times
  dateToday.setHours(0, 0, 0, 0);

  // Updating currencies
  const maxCurrencyResult = database.prepare("SELECT MAX(period) as mp FROM exchangerate WHERE date >= (?)").values(
    dateToday.toLocaleDateString("sv-SE"),
  );
  if (maxCurrencyResult[0][0] === null) {
    const result = await ExchangeRate();
    const entries: [string, string][] = Object.entries(result.entries);
    for (const [currency, value] of entries) {
      try {
        database.prepare("INSERT INTO exchangerate (currency, value, period, date) VALUES (?,?,?,?)").run(
          currency,
          value,
          dateToday.getTime(),
          dateToday.toLocaleDateString("sv-SE"),
        );
      } catch (e) {
        log("info", `Error occured while updating data, skipping. Error: ${e}`);
      }
    }
  }

  // Clear memory cache
  log("info", `Database changed, clearing cache, realm extrate.`);
  InvalidateCache("exrate");

  log("info", `Scheduled data update done`);
};

DailyCurrencyUpdate();
