import { Handlers, PageProps } from "$fresh/server.ts";
import SwHead from "components/layout/SwHead.tsx";
import IndexIsland from "islands/IndexIsland.tsx";
import {
  DBResultSet,
  ExchangeRateResult,
  GetExchangeRates,
  GetGenerationAndLoad,
  GetLastGenerationAndLoad,
  GetLastPricePerArea,
  GetLastPricePerCountry,
} from "backend/db/index.ts";
import { BasePageProps } from "utils/common.ts";

interface IndexPageProps extends BasePageProps {
  currentGenerationAndLoad: DBResultSet;
  pricePerCountry: DBResultSet;
  pricePerArea: DBResultSet;
  er: ExchangeRateResult;
}

export type { IndexPageProps };

export const handler: Handlers = {
  async GET(_req, ctx) {
    const dateStart = new Date(),
      dateEnd = new Date(),
      dateStartGen = new Date(),
      dateEndGen = new Date();

    dateStart.setDate(dateStart.getDate() - 1);

    dateStartGen.setHours(dateStartGen.getHours()-4);
    dateEndGen.setHours(dateEndGen.getHours()-1);

    const er = await GetExchangeRates();

    const currentGenerationAndLoad = await GetGenerationAndLoad(dateStartGen,dateEndGen);
    const pricePerCountry = await GetLastPricePerCountry();
    const pricePerArea = await GetLastPricePerArea();

    // Render all areas in country
    const pageProps: IndexPageProps = {
      currentGenerationAndLoad,
      pricePerCountry,
      pricePerArea,
      er,
      page: "index",
      lang: ctx.state.lang as string | undefined || ctx.params.country,
    };

    return ctx.render(pageProps);
  },
};

export default function Index(props: PageProps<IndexPageProps>) {
  return (
    <>
      <SwHead title={""} {...props}></SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <IndexIsland {...props}></IndexIsland>
      </body>
    </>
  );
}
