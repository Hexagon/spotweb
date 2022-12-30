import { Handlers, PageProps } from "fresh/server.ts";
import SwHead from "components/layout/SwHead.tsx";
import IndexIsland from "islands/IndexIsland.tsx";
import { GetDataDay, GetDataMonth, GetExchangeRates } from "backend/db/index.ts";
import { countries } from "config/countries.js";

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

    const er = await GetExchangeRates();

    const areas = [],
      todayDate = new Date(),
      tomorrowDate = new Date(),
      firstDayOfMonth = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    firstDayOfMonth.setDate(1);

    for (const areaObj of country.areas) {
      areas.push({
        ...areaObj,
        dataToday: await GetDataDay(areaObj.name, todayDate),
        dataTomorrow: await GetDataDay(areaObj.name, tomorrowDate),
        dataMonth: await GetDataMonth(areaObj.name, todayDate),
      });
    }

    // Render all areas in country
    return ctx.render({
      country,
      areas,
      er,
      lang: ctx.state.lang || ctx.params.country,
    });
  },
};

export default function Index(props: PageProps) {
  return (
    <>
      <SwHead title={props.data.country.name + " - " + props.data.country.areas.map((a) => a.name).join(", ")}></SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <IndexIsland {...props}></IndexIsland>
      </body>
    </>
  );
}
