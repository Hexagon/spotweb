// routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { langFromUrl } from "utils/common.ts";

export const handler = [
  function languageMiddleware(
    req: Request,
    // deno-lint-ignore no-explicit-any
    ctx: MiddlewareHandlerContext<Record<string, any>>,
  ) {
    const SUPPORTED_LANGUAGES = ["sv", "fi", "no", "dk", "de", "en", "nl", "fr", "es"];
    const langRaw = req.headers.get("accept-language");
    const urlParsed = new URL(req.url);

    let lang = langFromUrl(urlParsed);

    if (langRaw) {
      const primaryLang = langRaw.split(";")[0].split(",")[0].split("-")[0];
      const matchedLang = SUPPORTED_LANGUAGES.find((lng) => primaryLang.includes(lng));

      if (matchedLang) {
        lang = matchedLang;
      }
    }

    // Allow overriding by ?lang=<lang> in URL
    if (urlParsed.searchParams.has("lang")) {
      const requestedLang = urlParsed.searchParams.get("lang");
      if (requestedLang !== null && SUPPORTED_LANGUAGES.includes(requestedLang)) {
        lang = requestedLang;
      }
    }

    // If lang is still not set to a valid value, default to en
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      lang = "en";
    }

    ctx.state.lang = lang;

    return ctx.next();
  },
];
