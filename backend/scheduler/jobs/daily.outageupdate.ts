import { PupTelemetry } from "pup/telemetry.ts";
import { EntsoeOutages } from "backend/integrations/entsoe.ts";
import { openDatabase } from "backend/db/minimal.ts";
import { log } from "utils/log.ts";
import { countries } from "config/countries.ts";
import { sleep } from "../../../utils/common.ts";

const tm = new PupTelemetry();

const database = await openDatabase({ int64: true });

const DailyOutageUpdate = async () => {
  log("info", `Scheduled data update started`);

  try {
    // Calculate start and stop dates
    const dateStart = new Date(),
      dateEnd = new Date();

    // Get all outages that were/is/will be active +/-30 days
    dateStart.setDate(dateStart.getDate() - 30);
    dateEnd.setDate(dateEnd.getDate() + 30);

    const preparedQueryOutage = database.prepare(`INSERT INTO outage (
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
      preparedQueryOutageAvailability = database.prepare(`INSERT INTO outage_availability (
        mrid,
        start_date,
        end_date,
        quantity) VALUES (?,?,?,?);`),
      preparedQueryOutageDelete = database.prepare(`DELETE FROM outage WHERE mrid=(?);`),
      preparedQueryOutageAvailabilityDelete = database.prepare(`DELETE FROM outage_availability WHERE mrid=(?);`);

    // Updating outages
    for (const country of countries) {
      // Parse date
      try {
        log("info", `Getting outages for ${country.name}`);

        const dataPast = await EntsoeOutages(country.cta, dateStart, dateEnd);
        await sleep(3);

        log("info", `Got ${dataPast.length} outages.`);

        for (const dpEntry of [...dataPast]) {
          preparedQueryOutageDelete.run(dpEntry.mRID);
          preparedQueryOutageAvailabilityDelete.run(dpEntry.mRID);
          preparedQueryOutage.run(
            dpEntry.mRID ?? null,
            dpEntry.revision ?? null,
            dpEntry.businessType ?? null,
            dpEntry.startDate?.getTime() ?? null,
            dpEntry.endDate?.getTime() ?? null,
            dpEntry.resourceName ?? null,
            dpEntry.location ?? null,
            country.id ?? null,
            dpEntry.psrName || "undefined",
            dpEntry.psrNominalPowerUnit ?? null,
            dpEntry.psrNominalPower ?? null,
            dpEntry.psrType ?? null,
            dpEntry.reasonCode ?? null,
            dpEntry.reasonText ?? null,
          );
          for (const apEntry of dpEntry.availablePeriodArray) {
            preparedQueryOutageAvailability.run(
              dpEntry.mRID,
              apEntry.start.getTime(),
              apEntry.end.getTime(),
              apEntry.quantity,
            );
          }
          // Sleep one millisecond between each row to allow clients to fetch data
          await sleep(1);
        }
      } catch (e) {
        log("error", `Error occured while updating outage data for '${country.name}', skipping. Error: ${e}. Stack ${e.stack}`);
      }

      await sleep(3);
    }
  } catch (e) {
    log("error", `Error occured while updating data, skipping. Error: ${e}`);
  }

  log("info", `Scheduled data update done`);

  tm.emit("spotweb-main-1", "clear_cache", { cache: "outage" });
  tm.emit("spotweb-main-2", "clear_cache", { cache: "outage" });
  tm.emit("spotweb-main-3", "clear_cache", { cache: "outage" });

  database.close();

  tm.close();
};

DailyOutageUpdate();
