import type { Options } from "freshlate";
import * as translations from "config/translations/index.js";

export default {
  selfURL: import.meta.url,
  languages: translations,
  fallback_language: "sv",
} as unknown as Options;
