import { PupTelemetry } from "pup/telemetry.ts";
import languagePlugin from "localekit_fresh";
import languageConfig from "config/translate.config.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import { langFromUrl } from "utils/common.ts";
import { log, setLevel } from "./utils/log.ts";

import { InvalidateCache } from "./utils/datacache.ts";

const tm = new PupTelemetry();

// Clear cache on telemetry request
tm.on("clear_cache", (data) => {
  // deno-lint-ignore no-explicit-any
  const cacheName = (data as any).cache;
  log("info", `Received request to clear cache '${cacheName}' fron IPC`);
  InvalidateCache(cacheName);
});

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
    port: parseInt(Deno.env.get("PUP_CLUSTER_PORT") ?? (Deno.env.get("SPOTWEB_PORT") ?? "6000"), 10),
  },
);
