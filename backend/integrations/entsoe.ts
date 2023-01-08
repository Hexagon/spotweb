import { Query, QueryResult } from "entsoe_api_client/mod.ts";

interface EntsoeApiRow {
  startTime: Date;
  endTime: Date;
  areaCode: string;
  spotPrice: number;
  unit: string;
}

const EntsoeGeneration = async (area: string, startDate: Date, endDate: Date) => {
  
  // Prepare dates
  startDate.setHours(0,0,0,0);
  endDate.setHours(23,0,0,0);

  // Run ENTSO-e transparency playform query
  const result = await Query(
      Deno.env.get("API_TOKEN") || "", // Your entsoe api-token
      {
          documentType: "A75",        // A75 - Actual generation per type
          processType: "A16",         // A16 - Realised
          inDomain: area,         // In_Domain
          outDomain: area,        // Out_Domain
          startDateTime: startDate,   // Start date
          endDateTime: endDate,  // End date
      }
  );

  let pt60m = false;
  for (const ts of result.TimeSeries) {
    if (ts.Period.resolution === "PT60M") pt60m = true;
  }

  // Compose a nice result set
  const output = {
    period: pt60m ? "PT60M" : "PT15M",
    data: []
  };

  for (const ts of result.TimeSeries) {
    // We expect hourly data, use PT60M and ignore other periods
    if ((pt60m && ts.Period.resolution==="PT60M") || ts.Period.resolution==="PT15M") {
        for (const point of ts.Period.Point) {
            const idx = point.position - 1;
            output.data.push({
              date: new Date(Date.parse(ts.Period.timeInterval.start) + ((pt60m ? 3600 : 900) * 1000) * idx),
              psr: ts.MktPSRType.psrType,
              quantity: point.quantity
            });
        }
    }
  }
  
  return output;
};

const EntsoeLoad = async (area: string, startDate: Date, endDate: Date) => {

  // Prepare dates
  startDate.setHours(0,0,0,0);
  endDate.setHours(23,0,0,0);

  // Run ENTSO-e transparency playform query
  const result = await Query(
      Deno.env.get("API_TOKEN") || "", // Your entsoe api-token
      {
          documentType: "A65",        // A75 - Actual generation per type
          processType: "A16",         // A16 - Realised
          outBiddingZoneDomain: area,        // OutBiddingZone_Domain
          startDateTime: startDate,   // Start date
          endDateTime: endDate,  // End date
      }
  );

  let pt60m = false;
  for (const ts of result.TimeSeries) {
    if (ts.Period.resolution === "PT60M") pt60m = true;
  }

  // Compose a nice result set
  const output = {
    period: pt60m ? "PT60M" : "PT15M",
    data: []
  };
  for (const ts of result.TimeSeries) {
    // We expect hourly data, use PT60M and ignore other periods
    if ((pt60m && ts.Period.resolution==="PT60M") || ts.Period.resolution==="PT15M") {
        for (const point of ts.Period.Point) {
            const 
              idx = point.position - 1,
              periodLengthS = ts.Period.resolution==="PT60M" ? 3600 : 900;
              output.data[idx] = {
                date: new Date(Date.parse(ts.Period.timeInterval.start) + (periodLengthS * 1000) * idx),
                quantity: point.quantity
            }
        }
    }
  }

  return output;
};

const EntsoeSpotprice = async (area: string, startDate: Date, endDate: Date): Promise<EntsoeApiRow[]> => {
  const output: EntsoeApiRow[] = [];
  let resultJson: QueryResult | undefined;
  try {
    resultJson = await Query(
      Deno.env.get("API_TOKEN") || "",
      {
        documentType: "A44",
        inDomain: area,
        outDomain: area,
        startDateTime: startDate,
        endDateTime: endDate,
      },
    ) as unknown as QueryResult;
  } catch (_e) {
    // Ignore
  }
  if (resultJson) {
    try {
      for (const ts of resultJson.TimeSeries) {
        const baseDate = new Date(ts.Period.timeInterval.start);
        // Only use PT60M for now
        if (ts.Period.resolution === "PT60M") {
          for (const p of ts.Period.Point) {
            output.push({
              startTime: new Date(baseDate.getTime() + (parseInt(p.position, 10) - 1) * 3600 * 1000),
              endTime: new Date(baseDate.getTime() + (parseInt(p.position, 10)) * 3600 * 1000),
              areaCode: area,
              spotPrice: parseFloat(p["price.amount"]),
              unit: "EUR/MWh",
            });
          }
        }
      }
    } catch (_e) {
      console.error(_e);
    }
  }

  return output;
};

export { EntsoeSpotprice, EntsoeGeneration, EntsoeLoad };
export type { EntsoeApiRow };
