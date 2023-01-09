import { Cron } from "croner";

import { log } from "../../utils/log.ts";

import { DailyCurrencyUpdate } from "./jobs/daily.currencyupdate.ts";
import { DailyPriceUpdate } from "./jobs/daily.priceupdate.ts";
import { HourlyConsumptionUpdate } from "./jobs/hourly.consumptionupdate.ts";
import { HourlyProductionUpdate } from "./jobs/hourly.productionupdate.ts";

const jobs = [
  new Cron("0 */3 12,13,14 * * *", { paused: true, timezone: "Europe/Oslo" }, DailyPriceUpdate),
  new Cron("0 0 * * * *", { paused: true, timezone: "Europe/Oslo" }, DailyCurrencyUpdate),
  new Cron("0 0,30 * * * *", { paused: true, timezone: "Europe/Oslo" }, HourlyConsumptionUpdate),
  new Cron("0 3,33 * * * *", { paused: true, timezone: "Europe/Oslo" }, HourlyProductionUpdate)
];

const scheduler = {
  start: () => {
    for(const job of jobs) {
      job.resume();
      log("info", "Job started, next run is at " + job.next()?.toLocaleString());
    }
  },
  stop: () => {
    for(const job of jobs) {
      job.stop();
      log("info", "Job stopped");
    }
  },
  instant: () => {
    log("info", "Instant update requested");
    //DailyPriceUpdate();
    //DailyCurrencyUpdate();
    HourlyConsumptionUpdate();
    HourlyProductionUpdate();
  }
};

export { scheduler };
