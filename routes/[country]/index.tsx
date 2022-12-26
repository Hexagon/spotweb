import { Handlers, PageProps } from "$fresh/server.ts";
import SwHead from "../../components/layout/SwHead.tsx";
import IndexIsland from "../../islands/IndexIsland.tsx";
import { countries } from "../../utils/countries.js";

export const handler: Handlers = {
  GET(_req, ctx) {

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

    // Render all areas in country
    return ctx.render({
      country: ctx.params.country,
      countryObj: country,
      lang: ctx.state.lang || ctx.params.country,
    });
  },
};

export default function Index(props: PageProps) {
  return (
    <>
      <SwHead title={props.data.countryObj.name + " - " + props.data.countryObj.areas.map(a => a.name).join(', ')}></SwHead>
      <body lang={props.data.lang}>
        <IndexIsland {...props}></IndexIsland>
      </body>
    </>
  );
}
