import { Handlers } from "$fresh/server.ts";
import { GetSpotprice } from "backend/db/index.ts";
import { intervalForArea } from "utils/common.ts";
import { sqlGroupBy } from "backend/db/sql/index.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    // Parse URL
    const url = new URL(req.url);

    // Get raw query
    const period = url.searchParams.get("period")?.trim()?.toLowerCase() || "",
      area = url.searchParams.get("area")?.trim()?.toUpperCase() || "",
      currencyParam = url.searchParams.get("currency"),
      currency = currencyParam ? currencyParam.trim()?.toUpperCase() : undefined,
      startDateParam = url.searchParams.get("startDate"),
      endDateParam = url.searchParams.get("endDate"),
      startDate = startDateParam ? new Date(Date.parse(startDateParam)) : new Date(NaN),
      endDate = endDateParam ? new Date(Date.parse(endDateParam)) : new Date(NaN),
      interval = url.searchParams.get("interval")?.trim()?.toUpperCase() || intervalForArea(area) || "PT60M";

    // Validate period
    const validPeriods = Object.keys(sqlGroupBy);
    if (!validPeriods.includes(period)) {
      return new Response(
        JSON.stringify({ status: "error", details: "Period not valid" }),
        { status: 500 },
      );
    }

    // Set end date time if not set
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
      return new Response(
        JSON.stringify({ status: "error", details: "Missing/invalid parameters" }),
        { status: 500 },
      );
    }

    // Parse date
    try {
      const data = await GetSpotprice(area, undefined, period, startDate, endDate, interval, currency);
      return new Response(
        JSON.stringify({
          status: "ok",
          data: data,
        }),
        { status: 200 },
      );
    } catch (e) {
      console.error(e);
      return new Response(
        JSON.stringify({ status: "error", details: "Query failed" }),
        { status: 500 },
      );
    }
  },
};
