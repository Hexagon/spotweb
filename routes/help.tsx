import SwHead from "components/layout/SwHead.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import HelpIsland from "islands/HelpIsland.tsx";
import { BasePageProps } from "utils/common.ts";
import { ExchangeRateResult, GetExchangeRates } from "../backend/db/index.ts";

interface HelpPageProps extends BasePageProps {
  er: ExchangeRateResult
}

export type { HelpPageProps }

export const handler: Handlers = {
    async GET(_req, ctx) {

        const er = await GetExchangeRates();

        const pageProps: HelpPageProps = {
          er,
          page: "index",
          lang: ctx.state.lang as string | undefined || ctx.params.country,
        };

        return ctx.render(pageProps);
    }
};


export default function HomeAssistant(props: PageProps) {
  return (
    <>
      <SwHead title={"Home Assistant REST integration"} {...props}></SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <HelpIsland {...props}></HelpIsland>
      </body>
    </>
  );
}
