import { Handlers, PageProps } from "$fresh/server.ts";
import SwHead from "../../components/layout/SwHead.tsx";
import IndexIsland from "../../islands/IndexIsland.tsx";
import { generateUrl, getDataDay, getDataMonth } from "../../utils/common.ts";
import { countries } from "../../utils/countries.js";
import { preferences } from "../../utils/preferences.js";
import { applyExchangeRate, getExchangeRates } from "../../utils/price.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {

    // Check country or return not found
    const country = countries.find((c) => c.id === ctx.params.country);
    if (!country) {
      return ctx.renderNotFound();
    }

    // Only one area, redirect to that
    if (country.areas.length === 1) {
      return new Response("", {
        status: 307,
        headers: { Location: "/" + country.id + "/" + country.areas[0].name },
      });
    }

    const er = await getExchangeRates();

    const 
      areaData = [],
      todayDate = new Date(),
      tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate()+1);
    for(const area of country.areas) {
      areaData.push({
        ...area,
        dataToday: await getDataDay(area.id, todayDate),
        dataTomorrow: await getDataDay(area.id, tomorrowDate),
        dataMonth: await getDataMonth(area.id, todayDate),
      });
    }

    // Render all areas in country
    return ctx.render({
      country: ctx.params.country,
      countryObj: country,
      areaData: areaData,
      erData: er,
      lang: ctx.state.lang || ctx.params.country,
    });
  },
};

export default function Index(props: PageProps) {
  return (
    <>
      <SwHead title={props.data.countryObj.name + " - " + props.data.countryObj.areas.map(a => a.name).join(', ')}></SwHead>
      <body lang={props.data.lang}>
        <IndexIsland {...props}></IndexIsland>
      </body>
    </>
  );
}
