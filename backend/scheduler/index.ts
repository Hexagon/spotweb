import { Cron } from "croner";

import { log } from "utils/log.ts";

import { DailyCurrencyUpdate } from "./jobs/daily.currencyupdate.ts";
import { DailyPriceUpdate } from "./jobs/daily.priceupdate.ts";
import { HourlyConsumptionUpdate } from "./jobs/hourly.consumptionupdate.ts";
import { HourlyProductionUpdate } from "./jobs/hourly.productionupdate.ts";
import { DailyOutageUpdate } from "./jobs/daily.outageupdate.ts";

// Set up automated jobs. Pause them initially.
const jobs = [
  new Cron("0 45,50,54,58 12 * * *", { paused: true, timezone: "Europe/Oslo" }, DailyPriceUpdate),
  new Cron("0 0,2,4,7,11,15,20,27,35,45,55 13 * * *", { paused: true, timezone: "Europe/Oslo" }, DailyPriceUpdate),
  new Cron("0 5,20,40,58 14 * * *", { paused: true, timezone: "Europe/Oslo" }, DailyPriceUpdate),
  new Cron("0 4 8,9,10 * * *", { paused: true, timezone: "Europe/Oslo" }, DailyPriceUpdate),
  new Cron("0 14 * * * *", { paused: true, timezone: "Europe/Oslo" }, DailyCurrencyUpdate),
  new Cron("0 2,32 * * * *", { paused: true, timezone: "Europe/Oslo" }, HourlyConsumptionUpdate),
  new Cron("0 4,34 * * * *", { paused: true, timezone: "Europe/Oslo" }, HourlyProductionUpdate),
  new Cron("0 5 8 * *", { paused: true, timezone: "Europe/Oslo" }, DailyOutageUpdate),
];

const scheduler = {
  start: () => {
    for (const job of jobs) {
      job.resume();
      log("info", "Job started, next run is at " + job.next()?.toLocaleString());
    }
  },
  stop: () => {
    for (const job of jobs) {
      job.stop();
      log("info", "Job stopped");
    }
  },
  instant: () => {
    log("info", "Instant update requested");
    DailyPriceUpdate();
    DailyCurrencyUpdate();
    HourlyConsumptionUpdate();
    HourlyProductionUpdate();
    DailyOutageUpdate();
  },
};

export { scheduler };
