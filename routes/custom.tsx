import { Handlers, PageProps } from "$fresh/server.ts";
import SwHead from "components/layout/SwHead.tsx";
import CustomIsland from "islands/CustomIsland.tsx";
import { GetExchangeRates } from "backend/db/index.ts";

/*interface CustomPageProps extends BasePageProps {

}*/

//export type { CustomPageProps };

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url),
      area = url.searchParams.get("area"),
      period = url.searchParams.get("period"),
      startDate = url.searchParams.get("startDate"),
      endDate = url.searchParams.get("endDate");

    const er = await GetExchangeRates();

    // Fetch if input data is sane
    return ctx.render({
      permission: ctx.state.data,
      area,
      period,
      startDate,
      endDate,
      er,
      adsense: Deno.env.get("SPOTWEB_ADSENSE"),
      lang: ctx.state.lang,
    });
  },
};

export default function Home(props: PageProps) {
  return (
    <>
      <SwHead title={" - Anpassad period"} adsense={Deno.env.get("SPOTWEB_ADSENSE")} {...props} {...props.data}></SwHead>
      <body lang={props.data.lang} class="dark-mode">
        <CustomIsland {...props}></CustomIsland>
      </body>
    </>
  );
}
