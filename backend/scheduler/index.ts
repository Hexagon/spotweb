import { Cron } from "croner";

import { log } from "utils/log.ts";

import { DailyCurrencyUpdate } from "./jobs/daily.currencyupdate.ts";
import { DailyPriceUpdate } from "./jobs/daily.priceupdate.ts";
import { HourlyConsumptionUpdate } from "./jobs/hourly.consumptionupdate.ts";
import { HourlyProductionUpdate } from "./jobs/hourly.productionupdate.ts";
import { DailyOutageUpdate } from "./jobs/daily.outageupdate.ts";

const onJobError = (error: unknown, inst: Cron) => {
  console.log(`Job '${inst.name}' had an uncatched error`, error);
};
const onJobOverrun = (inst: Cron) => {
  console.log(`Job '${inst.name}' still running, ignoring this run`);
};

// Set up automated jobs. Pause them initially.
const jobOptions = {
  paused: true,
  unref: true,
  timezone: "Europe/Oslo",
  catch: onJobError,
  protect: onJobOverrun,
};
const jobs = [
  new Cron("0 45,50,54,58 12 * * *", { ...jobOptions, name: "DailyPriceUpdate1" }, DailyPriceUpdate),
  new Cron("0 0,3,7,11,14,20,40,50 13 * * *", { ...jobOptions, name: "DailyPriceUpdate2" }, DailyPriceUpdate),
  new Cron("0 0 14,15 * * *", { ...jobOptions, name: "DailyPriceUpdate3" }, DailyPriceUpdate),
  new Cron("0 28 * * * *", { ...jobOptions, name: "DailyPriceUpdate4" }, DailyPriceUpdate),
  new Cron("0 14 * * * *", { ...jobOptions, name: "DailyCurrencyUpdate" }, DailyCurrencyUpdate),
  new Cron("0 2,32 * * * *", { ...jobOptions, name: "HourlyConsumptionUpdate" }, HourlyConsumptionUpdate),
  new Cron("0 4,34 * * * *", { ...jobOptions, name: "HourlyProductionUpdate" }, HourlyProductionUpdate),
  new Cron("0 5 8 * *", { ...jobOptions, name: "DailyOutageUpdate" }, DailyOutageUpdate),
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
