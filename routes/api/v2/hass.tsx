import { Handlers } from "$fresh/server.ts";
import { GetDataDay, SpotApiRow } from "backend/db/index.ts";
import { avgPrice, maxPrice, minPrice, nowPrice, processPrice } from "utils/price.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    // Parse URL
    const url = new URL(req.url);

    // Get raw parameters
    const area = url.searchParams.get("area")?.trim().toUpperCase(),
      currency = url.searchParams.get("currency")?.trim().toUpperCase(),
      factor = parseFloat(url.searchParams.get("factor")?.trim() || "1"),
      extra = parseFloat(url.searchParams.get("extra")?.trim().toUpperCase() || "0"),
      decimals = parseInt(url.searchParams.get("decimals")?.trim().toUpperCase() || "5", 10),
      interval = url.searchParams.get("interval")?.trim().toUpperCase() || "PT60M";

    // Check parameters
    if (!area || !currency || isNaN(factor) || isNaN(extra) || isNaN(decimals) || !interval) {
      return new Response(
        JSON.stringify({ status: "error", details: "Missing/invalid parameters" }),
        { status: 500 },
      );
    }

    try {
      const dateYesterday = new Date(),
        dateToday = new Date(),
        dateTomorrow = new Date();

      dateYesterday.setDate(dateYesterday.getDate() - 1);
      dateTomorrow.setDate(dateTomorrow.getDate() + 1);

      const tomorrow = await GetDataDay(area, dateTomorrow, interval, currency),
        today = await GetDataDay(area, dateToday, interval, currency),
        yesterday = await GetDataDay(area, dateYesterday, interval, currency);

      const data = [
        ...yesterday,
        ...today,
        ...tomorrow,
      ];

      return new Response(JSON.stringify(processData(data, yesterday, today, tomorrow, currency, extra, factor, decimals)), { status: 200 });
    } catch (e) {
      return new Response(
        JSON.stringify({ status: "error", details: "Query failed" }),
        { status: 500 },
      );
    }
  },
};

const processData = (
  data: SpotApiRow[],
  yesterday: SpotApiRow[],
  today: SpotApiRow[],
  tomorrow: SpotApiRow[],
  currency: string,
  extra: number,
  factor: number,
  decimals: number,
) => {
  return {
    updated: new Date(),
    now: processPrice(nowPrice(today), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    avg: processPrice(avgPrice(today), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    min: processPrice(minPrice(today), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    max: processPrice(maxPrice(today), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    avg_tomorrow: processPrice(avgPrice(tomorrow), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    min_tomorrow: processPrice(minPrice(tomorrow), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    max_tomorrow: processPrice(maxPrice(tomorrow), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    avg_yesterday: processPrice(avgPrice(yesterday), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    min_yesterday: processPrice(minPrice(yesterday), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    max_yesterday: processPrice(maxPrice(yesterday), { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
    data: data.map((r) => {
      return {
        st: new Date(r.time),
        p: processPrice(r.price, { currency, extra, factor, unit: "kWh", decimals, priceFactor: true }),
      };
    }),
  };
};
