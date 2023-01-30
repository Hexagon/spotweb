import { Query, QueryResult } from "entsoe_api_client/mod.ts";

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

const EntsoeGeneration = async (area: string, startDate: Date, endDate: Date): Promise<GenerationRow[]> => {
  // Prepare dates
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 0, 0, 0);

  // Run ENTSO-e transparency playform query
  const result = await Query(
    Deno.env.get("API_TOKEN") || "", // Your entsoe api-token
    {
      documentType: "A75", // A75 - Actual generation per type
      processType: "A16", // A16 - Realised
      inDomain: area, // In_Domain
      outDomain: area, // Out_Domain
      startDateTime: startDate, // Start date
      endDateTime: endDate, // End date
    },
  );

  // Compose a nice result set
  const output: GenerationRow[] = [];

  if (result?.length && result[0].TimeSeries) {
    for (const ts of result[0].TimeSeries) {
      if (ts.Period?.Point?.length) {
        for (const point of ts.Period.Point) {
          const idx = point.position - 1,
            periodLengthS = ts.Period.resolution === "PT60M" ? 3600 : 900;
          output.push({
            date: new Date(Date.parse(ts.Period.timeInterval.start) + (periodLengthS * 1000) * idx),
            psr: ts.MktPSRType?.psrType || "",
            consumption: ts["outBiddingZone_Domain.mRID"] ? 1 : 0,
            interval: ts.Period.resolution,
            quantity: point.quantity || 0,
          });
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
  const result = await Query(
    Deno.env.get("API_TOKEN") || "", // Your entsoe api-token
    {
      documentType: "A65", // A75 - Actual generation per type
      processType: "A16", // A16 - Realised
      outBiddingZoneDomain: area, // OutBiddingZone_Domain
      startDateTime: startDate, // Start date
      endDateTime: endDate, // End date
    },
  );

  // Compose a nice result set
  const output: LoadRow[] = [];

  if (result?.length) {
    for (const ts of result[0].TimeSeries) {
      if (ts.Period?.Point?.length) {
        for (const point of ts.Period.Point) {
          const idx = point.position - 1,
            periodLengthS = ts.Period.resolution === "PT60M" ? 3600 : 900;
          output.push({
            date: new Date(Date.parse(ts.Period.timeInterval.start) + (periodLengthS * 1000) * idx),
            interval: ts.Period.resolution,
            quantity: point.quantity,
          });
        }
      }
    }
  }

  return output;
};

const EntsoeSpotprice = async (area: string, startDate: Date, endDate: Date): Promise<SpotRow[]> => {
  const output: SpotRow[] = [];
  let result: QueryResult[] = [];
  try {
    result = await Query(
      Deno.env.get("API_TOKEN") || "",
      {
        documentType: "A44",
        inDomain: area,
        outDomain: area,
        startDateTime: startDate,
        endDateTime: endDate,
      },
    );
  } catch (_e) {
    // Ignore
  }
  if (result?.length) {
    try {
      for (const ts of result[0].TimeSeries) {
        const baseDate = new Date(ts.Period.timeInterval.start),
          periodLengthS = ts.Period.resolution === "PT60M" ? 3600 : 900;
        if (ts.Period?.Point?.length) {
          for (const p of ts.Period.Point) {
            if (p["price.amount"] !== undefined) {
              output.push({
                startTime: new Date(baseDate.getTime() + (p.position - 1) * periodLengthS * 1000),
                endTime: new Date(baseDate.getTime() + p.position * periodLengthS * 1000),
                interval: ts.Period.resolution,
                areaCode: area,
                spotPrice: p["price.amount"],
                unit: "EUR/MWh",
              });
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

export { EntsoeGeneration, EntsoeLoad, EntsoeSpotprice };
