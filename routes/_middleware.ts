// routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { langFromUrl } from "utils/common.ts";

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
      const actualLang = firstLang[0].split("-");
      if (actualLang[0].includes("sv")) {
        lang = "sv";
      } else if (actualLang[0].includes("fi")) {
        lang = "fi";
      } else if (actualLang[0].includes("no")) {
        lang = "no";
      } else if (actualLang[0].includes("dk")) {
        lang = "dk";
      } else if (actualLang[0].includes("de")) {
        lang = "de";
      } else if (actualLang[0].includes("en")) {
        lang = "en";
      } else {
        lang = langFromUrl(new URL(req.url));
      }
    } else {
      lang = langFromUrl(new URL(req.url));
    }

    // Allow overriding by ?lang=<lang> in URL
    const urlParsed = new URL(req.url);
    if (urlParsed.searchParams.has("lang")) {
      lang = urlParsed.searchParams.get("lang");
    }

    // If lang is still not set to a valid value, default to en
    if (!(lang)) {
      lang = "en";
    }

    ctx.state.lang = lang;

    return ctx.next();
  },
];
