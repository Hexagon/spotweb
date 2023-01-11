import { Handlers, PageProps } from "$fresh/server.ts";
import SwHead from "components/layout/SwHead.tsx";
import IndexIsland from "islands/IndexIsland.tsx";
import { GetCurrentGeneration, GetDataDay, GetDataDayCountry, GetDataMonth, GetDataMonthCountry, GetExchangeRates, GetLoadDay } from "backend/db/index.ts";
import { countries } from "config/countries.ts";
import { ExtPageProps } from "utils/common.ts";


export const handler: Handlers = {
  async GET(_req, ctx) {

    const er = await GetExchangeRates();

    const countryList = [],
      todayDate = new Date(),
      yesterdayDate = new Date(),
      tomorrowDate = new Date(),
      firstDayOfMonth = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate()-1);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    firstDayOfMonth.setDate(1);
    for (const countryObj of countries) {
      countryList.push({
        ...countryObj,
        dataToday: await GetDataDayCountry(countryObj.id, todayDate, countryObj.interval),
        dataTomorrow: await GetDataDayCountry(countryObj.id, tomorrowDate, countryObj.interval),
        dataMonth: await GetDataMonthCountry(countryObj.id, todayDate, countryObj.interval),
        generation: await GetCurrentGeneration(countryObj.cty, countryObj.interval),
        load: await GetLoadDay(countryObj.cty, yesterdayDate, todayDate, countryObj.interval),
      });
    }

    // Render all areas in country
    const pageProps: ExtPageProps = {
      countryList,
      er,
      page: "index",
      lang: ctx.state.lang as string | undefined || ctx.params.country,
    };

    return ctx.render(pageProps);
  },
};

export default function Index(props: PageProps<ExtPageProps>) {
  return (
    <>
      <SwHead title={""} {...props}></SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <IndexIsland {...props}></IndexIsland>
      </body>
    </>
  );
}