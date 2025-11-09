import { SpotApiRow } from "backend/db/index.ts";
import { countries } from "config/countries.ts";

interface BasePageProps {
  page: string;
  adsense?: string;
  lang: string;
  disable_auto_adsense?: boolean;
}

interface CommonProps extends BasePageProps {
  unit: string;
  multiplier: number;
  factor: number;
  extra: number;
  decimals: number;
  currency: string;
  priceFactor: boolean;
}

interface ChartSeries {
  name: string;
  data: SpotApiRow[];
}

const formatHhMm = (d: Date | string | number) => {
  const resolvedDate = typeof d === "number" ? new Date(d) : (d instanceof Date ? d : new Date(Date.parse(d)));
  const hours = ("" + resolvedDate.getHours()).padStart(2, "0"),
    minutes = ("" + resolvedDate.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const generateUrl = (area: string, startDate: Date, endDate: Date, interval: string, period?: string) => {
  const params: Record<string, string> = {
    area: area,
    period: period ? period : "hourly",
    startDate: startDate.toLocaleDateString("sv-SE"),
    endDate: endDate.toLocaleDateString("sv-SE"),
    interval: interval,
  };
  // deno-lint-ignore no-window
  const url = window.location || new URL("https://spot.56k.guru/"),
    inPath = "api/v2/spot",
    fullUrl = url.protocol + "//" + url.host + "/" +
      (inPath ? inPath : "") + "?" +
      new URLSearchParams(params).toString();
  return fullUrl;
};

const langFromUrl = (url: URL) => {
  if (url?.pathname?.startsWith("/sv")) {
    return "sv";
  } else if (url?.pathname?.startsWith("/be")) {
    return "nl";
  } else if (url?.pathname?.startsWith("/no")) {
    return "no";
  } else if (url?.pathname?.startsWith("/fi")) {
    return "fi";
  } else if (url?.pathname?.startsWith("/dk")) {
    return "dk";
  } else if (url?.pathname?.startsWith("/es")) {
    return "es";
  } else if (url?.pathname?.startsWith("/fr")) {
    return "fr";
  } else if (
    url?.pathname?.startsWith("/de") ||
    url?.pathname?.startsWith("/at") ||
    url?.pathname?.startsWith("/ch")
  ) {
    return "de";
  } else {
    return "en";
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type { BasePageProps, ChartSeries, CommonProps };
/**
 * Generic number formatter using Intl.NumberFormat
 * - Returns empty string for null/undefined/NaN
 * - Defaults to 0 fraction digits
 */
const formatNumber = (
  value: number | null | undefined,
  options?: { decimals?: number; lang?: string },
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  const decimals = options?.decimals ?? 0;
  // Map our internal language to a locale tag; fallback to en-US
  const lang = options?.lang ?? "en";
  const locale = lang === "sv"
    ? "sv-SE"
    : lang === "nl"
    ? "nl-NL"
    : lang === "no"
    ? "nb-NO"
    : lang === "fi"
    ? "fi-FI"
    : lang === "dk"
    ? "da-DK"
    : lang === "es"
    ? "es-ES"
    : lang === "fr"
    ? "fr-FR"
    : lang === "de"
    ? "de-DE"
    : "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value);
  } catch {
    // Fallback without locale if ICU data is unavailable
    return (decimals === 0 ? Math.round(value) : Number(value).toFixed(decimals)).toString();
  }
};

/**
 * Convenience formatter for MW values. Defaults to integer MW.
 */
const formatMW = (
  value: number | null | undefined,
  lang?: string,
  decimals: number = 0,
): string => formatNumber(value, { decimals, lang });

export { formatHhMm, formatMW, formatNumber, generateUrl, langFromUrl, sleep };

/**
 * Guess interval by area/country identifier using config/countries mapping.
 * Supports values like "SE1", "BZN|SE1", "CTA|SE", country ids (sv/de/...), and cty labels (e.g., "Sweden (SE)").
 */
const intervalForArea = (area: string | undefined): string | undefined => {
  if (!area) return undefined;

  const norm = area.toUpperCase();
  // Handle codes with prefixes "BZN|", "IBA|", "CTA|"
  const parts = norm.split("|");
  const suffix = parts.length > 1 ? parts[1] : norm;

  for (const country of countries) {
    // Match against country-level identifiers
    if (
      norm === country.id.toUpperCase() ||
      norm === (country.cty?.toUpperCase?.() || "") ||
      norm === (country.cta?.toUpperCase?.() || "")
    ) {
      return country.interval;
    }
    // Match against area-level identifiers
    for (const a of country.areas) {
      if (
        norm === a.name.toUpperCase() ||
        norm === a.id.toUpperCase() ||
        suffix === a.name.toUpperCase()
      ) {
        return country.interval;
      }
    }
  }
  return undefined;
};

export { intervalForArea };
