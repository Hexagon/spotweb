import type { Options } from "localekit_fresh";
import * as translations from "config/translations/index.js";

export default {
  selfURL: import.meta.url,
  languages: translations,
  fallback_language: "en",
} as unknown as Options;
