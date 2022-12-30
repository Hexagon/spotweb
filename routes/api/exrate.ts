import { DataCache, IDataCache } from "utils/datacache.ts";
import { GetExchangeRates } from "backend/db/index.ts";

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
    result: IDataCache = await DataCache(params, "hour-2", async () => {
      // Live
      const data = await GetExchangeRates();
      return { valid: true, data };
    });

  const res = new Response(JSON.stringify(result));
  res.headers.append("Cache-Control", "max-age=" + result.timeLeft);
  return res;
};
