import { Area, DocumentType, ProcessType, PublicationDocument, QueryGL, QueryPublication, QueryUnavailability } from "entsoe_api_client";

interface SpotRow {
  startTime: Date;
  endTime: Date;
  areaCode: string;
  interval: string;
  spotPrice: number;
  unit: string;
}

interface LoadRow {
  date: Date;
  interval: string;
  quantity?: number;
}

interface GenerationRow {
  date: Date;
  psr: string;
  consumption: number;
  interval: string;
  quantity: number;
}

interface OutageAvailabilityRow {
  start: Date;
  end: Date;
  quantity: number;
  resolution: string;
}

interface OutageRow {
  startDate?: Date;
  endDate?: Date;
  businessType: string;
  documentType: string;
  resourceName: string;
  mRID?: string;
  revision?: number;
  location?: string;
  psrName?: string;
  psrNominalPowerUnit?: string;
  psrNominalPower?: string;
  psrType?: string;
  reasonCode?: string;
  reasonText?: string;
  availablePeriodArray: OutageAvailabilityRow[];
}

const EntsoeOutages = async (area: string, startDate: Date, endDate: Date): Promise<OutageRow[]> => {
  // Prepare dates
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 0, 0, 0);

  // Run ENTSO-e transparency playform query
  const resultGen = await QueryUnavailability(
    Deno.env.get("API_TOKEN") as string, // Your entsoe api-token
    {
      documentType: DocumentType("Generation unavailability") || "", // A80 - Generation unavailability
      biddingZoneDomain: Area(area), // biddingZone_Domain
      startDateTime: startDate, // Start date
      endDateTime: endDate, // End date
      offset: 0,
    },
  );
  const resultPro = await QueryUnavailability(
    Deno.env.get("API_TOKEN") as string, // Your entsoe api-token
    {
      documentType: DocumentType("Production unavailability") || "", // A73 - Production unavailability
      biddingZoneDomain: Area(area), // biddingZone_Domain
      startDateTime: startDate, // Start date
      endDateTime: endDate, // End date
      offset: 0,
    },
  );

  const outageRows: OutageRow[] = [];

  for (const outageDoc of [...resultGen, ...resultPro]) {
    for (const outage of outageDoc.timeseries) {
      // Construct base object
      const outageRow: OutageRow = {
        businessType: outage.businessTypeDescription || "",
        documentType: outageDoc.documentTypeDescription || "",
        startDate: outage.startDate,
        endDate: outage.endDate,
        resourceName: outage.resourceName || "",
        mRID: outageDoc.mRID,
        revision: outageDoc.revision,
        location: outage.resourceLocation,
        psrName: outage.psrName,
        psrNominalPowerUnit: outage.psrNominalPowerUnit,
        psrNominalPower: outage.psrNominalPower,
        psrType: outage.psrType,
        reasonCode: outage.reasonCode,
        reasonText: outage.reasonText,
        availablePeriodArray: ([] as OutageAvailabilityRow[]),
      };

      if (outage.periods) {
        for (const avail of outage.periods) {
          for (const p of avail.points) {
            outageRow.availablePeriodArray.push({
              start: p.startDate,
              end: p.endDate,
              quantity: p.quantity || 0,
              resolution: avail.resolution,
            });
          }
        }
      }
      outageRows.push(outageRow);
    }
  }
  return outageRows;
};

const EntsoeGeneration = async (area: string, startDate: Date, endDate: Date): Promise<GenerationRow[]> => {
  // Prepare dates
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 0, 0, 0);

  // Run ENTSO-e transparency playform query
  const result = await QueryGL(
    Deno.env.get("API_TOKEN") || "", // Your entsoe api-token
    {
      documentType: DocumentType("Actual generation per type") || "", // A75 - Actual generation per type
      processType: ProcessType("Realised"), // A16 - Realised
      inDomain: Area(area), // In_Domain
      outDomain: Area(area), // Out_Domain
      startDateTime: startDate, // Start date
      endDateTime: endDate, // End date
    },
  );

  // Compose a nice result set
  const output: GenerationRow[] = [];

  if (result?.length && result[0].timeseries) {
    for (const ts of result[0].timeseries) {
      if (ts.periods) {
        for (const period of ts.periods) {
          for (const point of period.points) {
            output.push({
              date: point.startDate,
              psr: ts.mktPsrType || "",
              consumption: ts.outBiddingZone ? 1 : 0,
              interval: period.resolution,
              quantity: point.quantity || 0,
            });
          }
        }
      }
    }
  }

  return output;
};

const EntsoeLoad = async (area: string, startDate: Date, endDate: Date): Promise<LoadRow[]> => {
  // Prepare dates
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 0, 0, 0);

  // Run ENTSO-e transparency playform query
  const result = await QueryGL(
    Deno.env.get("API_TOKEN") || "", // Your entsoe api-token
    {
      documentType: "A65", // A75 - Actual generation per type
      processType: "A16", // A16 - Realised
      outBiddingZoneDomain: Area(area), // OutBiddingZone_Domain
      startDateTime: startDate, // Start date
      endDateTime: endDate, // End date
    },
  );

  // Compose a nice result set
  const output: LoadRow[] = [];

  if (result?.length) {
    for (const ts of result[0].timeseries) {
      if (ts.periods) {
        for (const period of ts.periods) {
          for (const point of period.points) {
            output.push({
              date: point.startDate,
              interval: period.resolution,
              quantity: point.quantity,
            });
          }
        }
      }
    }
  }

  return output;
};

const EntsoeSpotprice = async (area: string, startDate: Date, endDate: Date): Promise<SpotRow[]> => {
  const output: SpotRow[] = [];
  let result: PublicationDocument[] = [];
  try {
    result = await QueryPublication(
      Deno.env.get("API_TOKEN") || "",
      {
        documentType: "A44",
        inDomain: Area(area),
        outDomain: Area(area),
        startDateTime: startDate,
        endDateTime: endDate,
      },
    );
  } catch (_e) {
    // Ignore
  }
  if (result?.length) {
    try {
      for (const ts of result[0].timeseries) {
        if (ts.periods) {
          for (const period of ts.periods) {
            for (const p of period.points) {
              if (p.price !== undefined) {
                output.push({
                  startTime: p.startDate,
                  endTime: p.endDate,
                  interval: period.resolution,
                  areaCode: area,
                  spotPrice: p.price,
                  unit: "EUR/MWh",
                });
              }
            }
          }
        }
      }
    } catch (_e) {
      console.error(_e);
    }
  }

  return output;
};

export { EntsoeGeneration, EntsoeLoad, EntsoeOutages, EntsoeSpotprice };
