import { Handlers, PageProps } from "$fresh/server.ts";
import SwHead from "components/layout/SwHead.tsx";
import ElomradeIsland from "islands/AreaIsland.tsx";
import {
  DBResultSet,
  ExchangeRateResult,
  GetCurrentGeneration,
  GetDataDay,
  GetDataMonth,
  GetExchangeRates,
  GetGenerationAndLoad,
  GetGenerationDay,
  GetLoadDay,
SpotApiRow,
} from "backend/db/index.ts";
import { countries, Country, DataArea } from "config/countries.ts";
import { BasePageProps } from "utils/common.ts";

interface AreaPageProps extends BasePageProps {
  country: Country;
  area: DataArea;
  deToday: SpotApiRow[];
  deTomorrow: SpotApiRow[];
  deMonth: SpotApiRow[];
  generationAndLoad: DBResultSet;
  generation: DBResultSet;
  load: DBResultSet;
  er: ExchangeRateResult;
}

export type { AreaPageProps };

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
      prevMonthDate = new Date(),
      yesterdayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    prevMonthDate.setDate(1);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);

    const area = {
      ...foundArea,
      dataToday: await GetDataDay(foundArea.name, todayDate, country.interval),
      dataTomorrow: await GetDataDay(foundArea.name, tomorrowDate, country.interval),
      dataMonth: await GetDataMonth(foundArea.name, todayDate, country.interval),
      dataPrevMonth: await GetDataMonth(foundArea.name, prevMonthDate, country.interval),
    };

    const generationAndLoadInput = await GetGenerationAndLoad(yesterdayDate, tomorrowDate),
      generationAndLoad = { data: generationAndLoadInput.data.filter((e) => e[0] === area.id) };

    const pageProps: AreaPageProps = {
      country,
      area,
      generationAndLoad,
      generation: await GetCurrentGeneration(area.id, country.interval),
      load: await GetLoadDay(area.id, yesterdayDate, todayDate, country.interval),
      page: area.id,
      deToday: await GetDataDay('DE-LU', todayDate, "PT15M"),
      deTomorrow: await GetDataDay('DE-LU', tomorrowDate, "PT15M"),
      deMonth: await GetDataMonth('DE-LU', todayDate, "PT15M"),
      er,
      lang: ctx.state.lang as string | undefined || ctx.params.country,
    };

    return ctx.render(pageProps);
  },
};

export default function Area(props: PageProps<AreaPageProps>) {
  return (
    <>
      <SwHead title={props.data.area.name + " - " + props.data.area.long} {...props}></SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <ElomradeIsland {...props}></ElomradeIsland>
      </body>
    </>
  );
}
