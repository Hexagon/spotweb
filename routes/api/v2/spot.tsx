import { Handlers } from "$fresh/server.ts";
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
      startDate = new Date(Date.parse(url.searchParams.get("startDate") || "")),
      endDate = new Date(Date.parse(url.searchParams.get("endDate") || "")),
      interval = url.searchParams.get("interval") || "PT60M";

    // Validate period
    const validPeriods = Object.keys(sqlGroupBy);
    if (!validPeriods.includes(period)) {
      return new Response(
        JSON.stringify({ status: "error", details: "Period not valid" }),
        { status: 500 },
      );
    }

    // Set end date time if not set
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    // Parse date
    try {
      const data = await GetSpotprice(area, undefined, period, startDate, endDate, interval, currency);
      return new Response(JSON.stringify({
        status: "ok",
        data: data
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
