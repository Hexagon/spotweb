import { Plugin } from "fresh/server.ts";

import { Options, setup } from "./freshlate/shared.ts";

export type { Options };

export default function translate(options: Options): Plugin {
  setup(options, undefined);

  // Main script to run client-side
  const main = `data:application/javascript,import hydrate from "${new URL("./freshlate/main.ts", import.meta.url).href}";
import opts from "${options.selfURL}";
export default function(state) { hydrate(opts, state); }
`;

  return {
    name: "translate",
    entrypoints: { main: main },
    render: (ctx) => {
      const res = ctx.render();
      const scripts = [];
      const languages = options.languages;

      if (res.requiresHydration) {
        scripts.push({ entrypoint: "main", state: languages });
      }

      return {
        scripts,
      };
    },
  };
}

export { lang_svc as freshlate } from "./freshlate/translation.ts";
