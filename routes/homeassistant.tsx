import SwHead from "components/layout/SwHead.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";
import HassIsland from "islands/HassIsland.tsx";
import { ExtPageProps } from "utils/common.ts";

export const handler: Handlers = {
    async GET(_req, ctx) {

        const pageProps = {
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
        <HassIsland {...props}></HassIsland>
      </body>
    </>
  );
}
