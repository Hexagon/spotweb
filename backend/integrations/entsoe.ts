import { Query, QueryResult } from "entsoe_api_client";

interface EntsoeApiRow {
  startTime: Date;
  endTime: Date;
  areaCode: string;
  spotPrice: number;
  unit: string;
}

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

export { EntsoeSpotprice };
export type { EntsoeApiRow };
