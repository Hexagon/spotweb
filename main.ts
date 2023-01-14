import languagePlugin from "localekit_fresh";
import languageConfig from "config/translate.config.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import { langFromUrl } from "utils/common.ts";
import { scheduler } from "backend/scheduler/index.ts";
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
  },
);

// Start back end
if (!Deno.args.includes("--no-schedules")) {
  scheduler.start();
}

// Do instant update if asked to
if (Deno.args.includes("--instant-update")) {
  log("info", "Doing instant update");
  scheduler.instant();
}
