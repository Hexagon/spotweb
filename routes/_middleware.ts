// routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { langFromUrl } from "../utils/common.ts";

export const handler = [
  function languageMiddleware(
    req: Request,
    // deno-lint-ignore no-explicit-any
    ctx: MiddlewareHandlerContext<Record<string, any>>,
  ) {
    // Handle language
    const langRaw = req.headers.get("accept-language");

    let lang;

    if (langRaw) {
      const langSplit = langRaw.split(";");
      const firstLang = langSplit[0].split(",");
      if (firstLang.includes("sv")) {
        lang = "sv";
      } else if (firstLang.includes("fi")) {
        lang = "fi";
      } else if (firstLang.includes("no")) {
        lang = "no";
      } else if (firstLang.includes("en")) {
        lang = "en";
      } else {
        lang = langFromUrl(new URL(req.url));
      }
    }

    // Allow overriding by ?lang=<lang> in URL
    const urlParsed = new URL(req.url);
    if (urlParsed.searchParams.has("lang")) {
      lang = urlParsed.searchParams.get("lang");
    }

    ctx.state.lang = lang;

    return ctx.next();
  },
];
