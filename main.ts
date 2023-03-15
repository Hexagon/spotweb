import languagePlugin from "localekit_fresh";
import languageConfig from "config/translate.config.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import { langFromUrl } from "utils/common.ts";
import { log, setLevel } from "./utils/log.ts";

// Enable debugging
if (Deno.args.includes("--debug")) {
  log("info", "Enabling debug logging");
  setLevel("debug");
}

// Start front end
start(
  manifest,
  {
    plugins: [languagePlugin({ ...languageConfig })],
    render: (ctx, render) => {
      // Set <html lang=...> to a best guess from url
      ctx.lang = langFromUrl(ctx.url);
      render();
    },
    port: parseInt(Deno.env.get("SPOTWEB_PORT") ?? "3000", 10),
  },
);
