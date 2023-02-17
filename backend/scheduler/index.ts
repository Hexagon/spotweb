import { Cron } from "croner";

import { log } from "utils/log.ts";

import { DailyCurrencyUpdate } from "./jobs/daily.currencyupdate.ts";
import { DailyPriceUpdate } from "./jobs/daily.priceupdate.ts";
import { HourlyConsumptionUpdate } from "./jobs/hourly.consumptionupdate.ts";
import { HourlyProductionUpdate } from "./jobs/hourly.productionupdate.ts";
import { DailyOutageUpdate } from "./jobs/daily.outageupdate.ts";

// Set up automated jobs. Pause them initially.
const jobOptions = { 
  paused: true,
  unref: true,
  timezone: "Europe/Oslo"
};
const jobs = [
  new Cron("0 45,50,54,58 12 * * *", jobOptions, DailyPriceUpdate),
  new Cron("0 0,3,7,11,14,20,40,50 13 * * *", jobOptions, DailyPriceUpdate),
  new Cron("0 0 14,15 * * *", jobOptions, DailyPriceUpdate),
  new Cron("0 28 * * * *", jobOptions, DailyPriceUpdate),
  new Cron("0 14 * * * *", jobOptions, DailyCurrencyUpdate),
  new Cron("0 2,32 * * * *", jobOptions, HourlyConsumptionUpdate),
  new Cron("0 4,34 * * * *", jobOptions, HourlyProductionUpdate),
  new Cron("0 5 8 * *", jobOptions, DailyOutageUpdate),
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
