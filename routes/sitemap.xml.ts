import { Handlers } from "$fresh/server.ts";
import { SitemapContext } from "fresh_seo";
import { countries } from "config/countries.ts";
import manifest from "../fresh.gen.ts";

export const handler: Handlers = {
  GET(_req, _ctx) {
    const sitemap = new SitemapContext("https://spot.56k.guru", manifest);

    // Remove "secrets"
    sitemap.remove("/api/v2/hass");
    sitemap.remove("/api/v2/spot");
    sitemap.remove("/api/entsoe");
    sitemap.remove("/api/exrate");
    sitemap.remove("/compare");
    sitemap.remove("/custom");
    sitemap.remove("/help");

    // Remove dynamic
    sitemap.remove("/[country]/");

    // Add all country/area endpoints
    for (const country of countries) {
      if ( country.areas.length > 1 ) sitemap.add("/" + country.id);
      for (const area of country.areas) {
        sitemap.add("/" + country.id + "/" + area.name);
      }
    }


    return sitemap.render();
  },
};
