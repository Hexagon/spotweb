import { Handlers, PageProps } from "$fresh/server.ts";
import SwHead from "../../components/layout/SwHead.tsx";
import ElomradeIsland from "../../islands/ElomradeIsland.tsx";
import { countries } from "../../utils/countries.js";

export const handler: Handlers = {
  GET(_req, ctx) {
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
    const area = country.areas.find((a) => a.name === ctx.params.area);
    if (!area) {
      return ctx.renderNotFound();
    }

    return ctx.render({
      area: ctx.params.area,
      country: ctx.params.country,
      areaObj: area,
      countryObj: country,
      lang: ctx.state.lang || ctx.params.country,
    });
  },
};

export default function Area(props: PageProps) {
  return (
    <>
      <SwHead title={props.data.areaObj.name + " - " + props.data.areaObj.long}></SwHead>
      <body lang={props.data.lang}>
        <ElomradeIsland {...props}></ElomradeIsland>
      </body>
    </>
  );
}
