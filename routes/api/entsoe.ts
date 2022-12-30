import { HandlerContext } from "fresh/server.ts";
import { DataCache, IDataCache } from "utils/datacache.ts";
import { EntsoeApiRow, EntsoeSpotprice } from "backend/integrations/entsoe.ts";

// deno-lint-ignore no-explicit-any
export const handler = async (req: Request, _ctx: HandlerContext<any, Record<string, any>>): Promise<Response> => {
  // Parse URL
  const url = new URL(req.url);

  // Get raw query
  const period = url.searchParams.get("period")?.trim().toLowerCase() || "",
    area = url.searchParams.get("area")?.trim().toUpperCase() || "",
    currency = url.searchParams.get("currency")?.trim().toUpperCase() || "",
    isoStartDate = url.searchParams.get("startDate") || "",
    isoEndDate = url.searchParams.get("endDate") || "",
    limitCache = url.searchParams.get("limitCache") || "false";

  // Validate period
  const validPeriods = ["hourly"];
  if (!validPeriods.includes(period)) {
    return new Response(
      JSON.stringify({ status: "Error", details: "Period not valid" }),
      { status: 500 },
    );
  }

  // Validate date
  const parsedStartDate = new Date(Date.parse(isoStartDate)),
    parsedEndDate = new Date(Date.parse(isoEndDate));

  if (
    !(parsedStartDate instanceof Date) || isNaN((parsedStartDate as unknown) as number)
  ) {
    return new Response(
      JSON.stringify({
        status: "Error",
        details: "Date not valid : " + isoStartDate + " parsed as " + parsedStartDate,
      }),
      { status: 500 },
    );
  }

  if (
    !(parsedEndDate instanceof Date) || isNaN((parsedEndDate as unknown) as number)
  ) {
    return new Response(
      JSON.stringify({
        status: "Error",
        details: "Date not valid : " + isoEndDate + " parsed as " + parsedEndDate,
      }),
      { status: 500 },
    );
  }

  // Get actual result
  const params = { period, area, currency, startDate: isoStartDate, endDate: isoEndDate },
    result: IDataCache = await DataCache(params, limitCache === "true" ? "hour-2" : "hour-6", async () => {
      // Get result
      let data: EntsoeApiRow[] = [];
      try {
        data = await EntsoeSpotprice(area, parsedStartDate, parsedEndDate);
      } catch (e) {
        throw new Error("Entsoe request failed", e);
      }

      // Determine if valid
      let valid = true;
      if (data && data.length > 0) {
        for (const e of data) {
          if (isNaN(parseInt(e.spotPrice.toString(), 10))) {
            valid = false;
            break;
          }
        }
      } else {
        valid = false;
      }

      return { valid, data };
    });

  const res = new Response(JSON.stringify(result));
  res.headers.append("Cache-Control", "max-age=" + result.timeLeft);
  return res;
};
