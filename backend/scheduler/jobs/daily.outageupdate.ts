import { EntsoeOutages } from "backend/integrations/entsoe.ts";
import { database } from "backend/db/index.ts";
import { log } from "utils/log.ts";
import { InvalidateCache } from "utils/datacache.ts";
import { countries } from "config/countries.ts";
import { sleep } from "../../../utils/common.ts";

let running = false;

const DailyOutageUpdate = async () => {
  log("info", "Scheduled data update started");

  // Do not run two just simulataneously
  if (running) {
    log("info", "Previous job still running, skipping");
    return;
  } else {
    running = true;
  }

  try {
    // Calculate start and stop dates
    const dateStart = new Date(),
      dateEnd = new Date();

    // Get all outages that were/is/will be active +/-30 days
    dateStart.setDate(dateStart.getDate() - 30);
    dateEnd.setDate(dateEnd.getDate() + 30);

    const preparedQueryOutage = database.prepareQuery(`INSERT INTO outage (
        mrid,
        revision,
        business_type,
        start_date,
        end_date,
        resource_name,
        location,
        country,
        psr_name,
        psr_nominal_power_unit,
        psr_nominal_power,
        psr_type,
        reason_code,
        reason_text) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);`),
      preparedQueryOutageAvailability = database.prepareQuery(`INSERT INTO outage_availability (
        mrid,
        start_date,
        end_date,
        quantity) VALUES (?,?,?,?);`),
      preparedQueryOutageDelete = database.prepareQuery(`DELETE FROM outage WHERE mrid=(?);`),
      preparedQueryOutageAvailabilityDelete = database.prepareQuery(`DELETE FROM outage_availability WHERE mrid=(?);`);

    // Updating outages
    for (const country of countries) {
      // Parse date
      try {
        log("info", "Getting outages for " + country.name);

        const dataPast = await EntsoeOutages(country.cta, dateStart, dateEnd);
        await sleep(3);

        log("info", "Got " + (dataPast.length) + " outages.");

        for (const dpEntry of [...dataPast]) {
          preparedQueryOutageDelete.execute([dpEntry.mRID]);
          preparedQueryOutageAvailabilityDelete.execute([dpEntry.mRID]);
          preparedQueryOutage.execute([
            dpEntry.mRID,
            dpEntry.revision,
            dpEntry.businessType,
            dpEntry.startDate?.getTime(),
            dpEntry.endDate?.getTime(),
            dpEntry.resourceName,
            dpEntry.location,
            country.id,
            dpEntry.psrName,
            dpEntry.psrNominalPowerUnit,
            dpEntry.psrNominalPower,
            dpEntry.psrType,
            dpEntry.reasonCode,
            dpEntry.reasonText,
          ]);
          for (const apEntry of dpEntry.availablePeriodArray) {
            preparedQueryOutageAvailability.execute([
              dpEntry.mRID,
              apEntry.start.getTime(),
              apEntry.end.getTime(),
              apEntry.quantity,
            ]);
          }
          // Sleep one millisecond between each row to allow clients to fetch data
          await sleep(1);
        }
      } catch (e) {
        log("error", "Error occured while updating outage data for '" + country.name + "', skipping. Error: " + e);
      }

      await sleep(3);
    }
  } catch (e) {
    log("error", "Error occured while updating data, skipping. Error: " + e);
  }

  // Clear memory cache
  log("info", "Database changed, clearing cache, realm outage.");
  InvalidateCache("outage");

  running = false;

  log("info", "Scheduled data update done");
};

export { DailyOutageUpdate };
