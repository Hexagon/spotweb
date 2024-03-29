import SwHead from "components/layout/SwHead.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import HassIsland from "islands/HassIsland.tsx";
import { BasePageProps } from "utils/common.ts";
import { ExchangeRateResult, GetExchangeRates } from "backend/db/index.ts";

interface HassPageProps extends BasePageProps {
  er: ExchangeRateResult;
}

export type { HassPageProps };

export const handler: Handlers = {
  async GET(_req, ctx) {
    const er = await GetExchangeRates();

    const pageProps: HassPageProps = {
      er,
      page: "homeassistant",
      adsense: Deno.env.get("SPOTWEB_ADSENSE"),
      lang: ctx.state.lang as string | undefined || ctx.params.country,
    };

    return ctx.render(pageProps);
  },
};

export default function HomeAssistant(props: PageProps<HassPageProps>) {
  return (
    <>
      <SwHead title={"Home Assistant REST integration"} adsense={Deno.env.get("SPOTWEB_ADSENSE")} {...props} {...props.data}></SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <HassIsland {...props}></HassIsland>
      </body>
    </>
  );
}
