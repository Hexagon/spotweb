import { Handlers } from "fresh/server.ts";
import { GetSpotprice, SpotApiRow } from "backend/db/index.ts";
import { sqlGroupBy } from "backend/db/sql/index.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {

    // Parse URL
    const url = new URL(req.url);

    // Get raw query
    const period = url.searchParams.get("period")?.trim().toLowerCase() || "",
      area = url.searchParams.get("area")?.trim().toUpperCase() || "",
      currency = url.searchParams.get("currency")?.trim().toUpperCase() || undefined,
      startDate = url.searchParams.get("startDate") || "",
      endDate = url.searchParams.get("endDate") || "";

    // Validate period
    const validPeriods = Object.keys(sqlGroupBy);
    if (!validPeriods.includes(period)) {
      return new Response(
        JSON.stringify({ status: "error", details: "Period not valid" }),
        { status: 500 },
      );
    }

    try {
      const data = await GetSpotprice(area, period, startDate, endDate, currency);
      return new Response(JSON.stringify({
        status: "ok",
        data: data.data.map((r: Array<unknown>) => {
          // Hourly is not aggregated
          if (period === "hourly") {
            return {
              time: r[0],
              price: r[1],
            };
            // All other options are aggregated, pass min and max
          } else {
            return {
              time: r[0],
              price: r[1],
              min: r[2],
              max: r[3],
            };
          }
        })
      }), { status: 200 });
    } catch (e) {
      console.error(e);
      return new Response(
        JSON.stringify({ status: "error", details: "Query failed" }),
        { status: 500 },
      );
    }
  },
};
