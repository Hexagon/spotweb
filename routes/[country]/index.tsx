import { Handlers, PageProps } from "fresh/server";
import SwHead from "components/layout/SwHead.tsx";
import CountryIsland from "islands/CountryIsland.tsx";
import {
  DBResultSet,
  ExchangeRateResult,
  GetCurrentOutages,
  GetDataDay,
  GetDataMonth,
  GetExchangeRates,
  GetFutureOutages,
  GetGenerationAndLoad,
  GetGenerationDay,
  GetLoadDay,
} from "backend/db/index.ts";
import { countries, Country, DataArea } from "config/countries.ts";
import { BasePageProps } from "utils/common.ts";

interface CountryPageProps extends BasePageProps {
  country: Country;
  areas: DataArea[];
  generationAndLoad: DBResultSet;
  generation: DBResultSet;
  outages: DBResultSet;
  futureOutages: DBResultSet;
  load: DBResultSet;
  er: ExchangeRateResult;
}

export type { CountryPageProps };

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

    const areas: DataArea[] = [],
      todayDate = new Date(),
      yesterdayDate = new Date(),
      tomorrowDate = new Date(),
      firstDayOfMonth = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    firstDayOfMonth.setDate(1);

    for (const areaObj of country.areas) {
      areas.push({
        ...areaObj,
        dataToday: await GetDataDay(areaObj.name, todayDate, country.interval),
        dataTomorrow: await GetDataDay(areaObj.name, tomorrowDate, country.interval),
        dataMonth: await GetDataMonth(areaObj.name, todayDate, country.interval),
      });
    }

    const generationAndLoad = await GetGenerationAndLoad(country.cty, yesterdayDate, tomorrowDate);

    // Render all areas in country
    const pageProps: CountryPageProps = {
      country,
      generationAndLoad,
      generation: await GetGenerationDay(country.cty, yesterdayDate, todayDate, country.interval),
      load: await GetLoadDay(country.cty, yesterdayDate, todayDate, country.interval),
      outages: await GetCurrentOutages(country.id),
      futureOutages: await GetFutureOutages(country.id),
      er,
      page: country.id,
      adsense: Deno.env.get("SPOTWEB_ADSENSE"),
      areas,
      lang: ctx.state.lang as string | undefined || ctx.params.country,
    };

    return ctx.render(pageProps);
  },
};

export default function Index(props: PageProps<CountryPageProps>) {
  return (
    <>
      <SwHead
        title={props.data.country?.name + " - " + props.data.country?.areas.map((a) => a.name).join(", ")}
        {...props}
        {...props.data}
      >
      </SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <CountryIsland {...props}></CountryIsland>
      </body>
    </>
  );
}
