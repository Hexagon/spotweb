import { Handlers } from "fresh/server.ts";
import { GetDataDay, GetSpotprice, SpotApiRow } from "backend/db/index.ts";
import { sqlGroupBy } from "backend/db/sql/index.ts";
import { nowPrice, processPrice } from "../../../utils/price.ts";
import { processResultSet } from "../../../utils/common.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {

    // Parse URL
    const url = new URL(req.url);

    // Get raw parameters
    const 
      area = url.searchParams.get("area")?.trim().toUpperCase(),
      currency = url.searchParams.get("currency")?.trim().toUpperCase(),
      factor = parseFloat(url.searchParams.get("factor")?.trim() || ""),
      extra = parseFloat(url.searchParams.get("extra")?.trim().toUpperCase() || "");

    // Check parameters
    if (!area || !currency || isNaN(factor) || isNaN(extra)) {
        return new Response(
            JSON.stringify({ status: "error", details: "Missing/invalid parameters" }),
            { status: 500 },
        );
    }

    try {
      const 
        dateYesterday = new Date(),
        dateToday = new Date(),
        dateTomorrow = new Date();

      dateYesterday.setDate(dateYesterday.getDate()-1);
      dateTomorrow.setDate(dateTomorrow.getDate()+1);

      const data = [
        ...processResultSet(await GetDataDay(area, dateYesterday, currency)),
        ...processResultSet(await GetDataDay(area, dateToday, currency)),
        ...processResultSet(await GetDataDay(area, dateTomorrow, currency))
      ];
      return new Response(JSON.stringify(processData(data, currency, extra, factor)), { status: 200 });
    } catch (e) {
      return new Response(
        JSON.stringify({ status: "error", details: "Query failed" }),
        { status: 500 },
      );
    }
  },
};

const processData = (data, currency, extra, factor) => {
    return {
        updated: new Date(),
        now: processPrice(nowPrice(data),{currency, extra, factor, unit: "kWh", decimals: 5, priceFactor: true},"MWh"),
        data: {
            history: data.map((r)=>{
                return {
                    st: r.time,
                    p: processPrice(r.price,{currency, extra, factor, unit: "kWh", decimals: 5, priceFactor: true},"MWh")
                };
            })
        }
    };
};