import { SpotApiRow } from "backend/db/index.ts";

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
export { formatHhMm, generateUrl, langFromUrl, sleep };
