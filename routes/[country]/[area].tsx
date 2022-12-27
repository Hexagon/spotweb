import { Handlers, PageProps } from "$fresh/server.ts";
import SwHead from "../../components/layout/SwHead.tsx";
import ElomradeIsland from "../../islands/ElomradeIsland.tsx";
import { getDataDay, getDataMonth } from "../../utils/common.ts";
import { countries } from "../../utils/countries.js";
import { getExchangeRates } from "../../utils/price.ts";

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
  
      const er = await getExchangeRates();
  
      const 
        todayDate = new Date(),
        tomorrowDate = new Date(),
        prevMonthDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate()+1);
      prevMonthDate.setMonth(prevMonthDate.getMonth()-1);
      const area = {
        ...foundArea,
        dataToday: await getDataDay(foundArea.id, todayDate),
        dataTomorrow: await getDataDay(foundArea.id, tomorrowDate),
        dataMonth: await getDataMonth(foundArea.id, todayDate),
        dataPrevMonth: await getDataMonth(foundArea.id, prevMonthDate),
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
      <body lang={props.data.lang}>
        <ElomradeIsland {...props}></ElomradeIsland>
      </body>
    </>
  );
}