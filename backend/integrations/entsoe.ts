import { Query } from "entsoe_api_client";

interface EntsoeApiRow {
  startTime: Date;
  endTime: Date;
  areaCode: string;
  spotPrice: number;
  unit: string;
}

interface EntsoeApiParsedRow {
  startTime: string;
  endTime: string;
  areaCode: string;
  spotPrice: number;
  unit: string;
}

interface EntsoeApiResult {
  source: string;
  valid: boolean;
  dt: Date;
  data: EntsoeApiRow[];
}

interface EntsoeApiParsedResult {
  source: string;
  valid: boolean;
  dt: string;
  data: EntsoeApiParsedRow[];
}

const EntsoeSpotprice = async (area: string, startDate: Date, endDate: Date) => {
  const output: EntsoeApiRow[] = [];
  let resultJson;
  try {
    resultJson = await Query(
      Deno.env.get("API_TOKEN"),
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
  if (resultJson) {
    try {
      for (const ts of resultJson.TimeSeries) {
        const baseDate = new Date(ts.Period.timeInterval.start);
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
    } catch (_e) {
      console.error(_e);
    }
  }

  return output;
};

export { EntsoeSpotprice };
export type { EntsoeApiParsedResult, EntsoeApiParsedRow, EntsoeApiResult, EntsoeApiRow };
