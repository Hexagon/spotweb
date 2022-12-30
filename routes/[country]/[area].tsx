import { Handlers, PageProps } from "fresh/server.ts";
import SwHead from "components/layout/SwHead.tsx";
import ElomradeIsland from "islands/ElomradeIsland.tsx";
import { GetDataDay, GetDataMonth, GetExchangeRates } from "backend/db/index.ts";
import { countries } from "config/countries.js";

export const handler: Handlers = {
  async GET(_req, ctx) {
    // Legacy url redirect
    if (ctx.params.country == "elomrade") {
      return new Response("", {
        status: 307,
        headers: { Location: "/sv/" + ctx.params.area },
      });
    }

    // Find country, if country isn't found, return 404
    const country = countries.find((c) => c.id === ctx.params.country);
    if (!country) {
      return ctx.renderNotFound();
    }

    // Find area, if area isnt found, return 404
    const foundArea = country.areas.find((a) => a.name === ctx.params.area);
    if (!foundArea) {
      return ctx.renderNotFound();
    }

    const er = await GetExchangeRates();

    const todayDate = new Date(),
      tomorrowDate = new Date(),
      prevMonthDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const area = {
      ...foundArea,
      dataToday: await GetDataDay(foundArea.name, todayDate),
      dataTomorrow: await GetDataDay(foundArea.name, tomorrowDate),
      dataMonth: await GetDataMonth(foundArea.name, todayDate),
      dataPrevMonth: await GetDataMonth(foundArea.name, prevMonthDate),
    };

    return ctx.render({
      area: area,
      country: country,
      er: er,
      lang: ctx.state.lang || ctx.params.country,
    });
  },
};

export default function Area(props: PageProps) {
  return (
    <>
      <SwHead title={props.data.area.name + " - " + props.data.area.long}></SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <ElomradeIsland {...props}></ElomradeIsland>
      </body>
    </>
  );
}
