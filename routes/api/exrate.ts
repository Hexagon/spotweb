import { parse } from "https://deno.land/x/xml@2.0.4/mod.ts";
import { DataCache, IDataCache } from "../../utils/datacache.ts";

interface ExrateApiData {
  date: string;
  entries: unknown;
}

interface ExrateApiResult {
  source: string;
  dt: Date;
  data: ExrateApiData;
}

interface ExrateApiParsedResult {
  source: string;
  dt: string;
  data: ExrateApiData;
}

export type { ExrateApiData, ExrateApiParsedResult, ExrateApiResult };

export const handler = async (): Promise<Response> => {
  // Get actual result
  const params = { date: new Date().toLocaleDateString("sv-SE") },
    result: IDataCache = await DataCache(params, "exrate", "hour-2", async () => {
      // Live
      const result = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"),
        resultText = await result.text(),
        resultJson = parse(resultText);

      // Clean up result
      const // deno-lint-ignore no-explicit-any
      base = (resultJson["gesmes:Envelope"] as any)?.Cube?.Cube,
        data = {
          "date": base["@time"],
          entries: {},
        };
      for (const entry of base.Cube) {
        data.entries[entry["@currency"]] = entry["@rate"];
      }
      return { valid: true, data };
    });

  const res = new Response(JSON.stringify(result));
  res.headers.append("Cache-Control", "max-age=" + result.timeLeft);
  return res;
};
