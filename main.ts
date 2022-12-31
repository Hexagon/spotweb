import languagePlugin from "localekit_fresh";
import languageConfig from "./translate.config.ts";

import { start } from "fresh/server.ts";
import manifest from "./fresh.gen.ts";
import { langFromUrl } from "utils/common.ts";
import { scheduler } from "backend/scheduler/index.ts";

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
scheduler.start();
