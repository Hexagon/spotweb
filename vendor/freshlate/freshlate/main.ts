import { Options, setup } from "./shared.ts";
import { lang_svc } from "./translation.ts";

export default async function hydrate(
  options: Options,
  state: Record<string, Record<string, string>>,
) {
  options.languages = state;

  // First, check html lang=".."
  // - html lang is a standard feature, also cover the head tag,
  //   but is not good for reactive translations
  let language = document.documentElement.lang;

  // Therefore - we allow overriding by body lang=".."
  // - Which works, but are not actually supported to
  //   change by fresh, yet...
  if (document.body.lang) {
    language = document.body.lang;
  }

  // If no language was passed in, try to get it from the browser
  if (!language || language === "") {
    // Loop through the languages in the browser and find the first one that
    // is supported
    for (let i = 0; i < navigator.languages.length; i++) {
      const nav_lang = navigator.languages[i];

      // If the language is supported, set it and break out of the loop
      if (lang_svc.isSupported(nav_lang)) {
        language = nav_lang;
        break;
      }
    }
  }

  // If no language was found, use the fallback language
  if (!language || language === "") {
    language = lang_svc.fallback_language;
  }

  // If the language is still not set, use the fallback according to the options
  if ((!language || language === "") && options.fallback_language) {
    language = options.fallback_language;
  }

  // If the language is still not set, use the first language in the languages
  // object
  if (!language || language === "") {
    language = Object.keys(options.languages)[0];
  }

  // If the options has a fetch_url set, try hydrating the language if necessary
  if (options.fetch_url) {
    // If the language is not hydrated, fetch it
    if (language && language !== "" && !lang_svc.isHydrated(language)) {
      try {
        // Fetch the language object, replacing {{lang}} with the given language
        const res = await fetch(
          options.fetch_url.replace("{{lang}}", language),
        );
        // As we only accept JSON, we can parse it directly
        const data = await res.json();

        // Add the language in to the exisiting keys
        options.languages[language] = {
          ...options.languages[language] || {},
          ...data,
        };
      } catch (error) {
        console.error(error);
        console.warn("Failed to fetch translations");
      }
    } else {
      console.log("no language or is hydrated");
    }

    // If there's a fallback language, and if it isn't the language we just hyfrated,
    // and if it isn't hydrated, fetch it
    if (
      options.fallback_language &&
      options.fallback_language !== language &&
      !lang_svc.isHydrated(options.fallback_language)
    ) {
      const fallback = options.fallback_language;
      try {
        // Fetch the language object, replacing {{lang}} with the given language just like before
        const res = await fetch(
          options.fetch_url.replace("{{lang}}", fallback),
        );
        const data = await res.json();

        options.languages[fallback] = {
          ...(options.languages[fallback] || {}),
          ...data,
        };
      } catch (error) {
        console.error(error);
        console.warn("Failed to fetch translations");
      }
    }
  }

  // Call the setup function with the given options and language
  setup(options, language);
}
