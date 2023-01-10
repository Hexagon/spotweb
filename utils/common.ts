import { DBResultSet, ExchangeRateResult, SpotApiRow } from "../backend/db/index.ts";
import { Country, DataArea } from "../config/countries.ts";

interface BasePageProps {
  page: string;
  lang: string;
}

interface ExtPageProps extends BasePageProps {
  country: Country;
  area?: DataArea;
  areas?: DataArea[];
  generation: DBResultSet;
  load: DBResultSet;
  er: ExchangeRateResult;
}

interface CommonProps extends ExtPageProps {
  unit: string;
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

const dateText = (d: Date) => {
  const dTodayStr = new Date().toLocaleDateString(),
    dTomorrow = new Date();
  dTomorrow.setDate(new Date().getDate() + 1);
  const dTomorrowStr = dTomorrow.toLocaleDateString();
  if (dTodayStr === d.toLocaleDateString()) return "today";
  else if (dTomorrowStr === d.toLocaleDateString()) return "tomorrow";
  else return d.toLocaleDateString();
};

const generateUrl = (area: string, startDate: Date, endDate: Date, interval: string, period?: string) => {
  const params: Record<string, string> = {
    area: area,
    period: period ? period : "hourly",
    startDate: startDate.toLocaleDateString("sv-SE"),
    endDate: endDate.toLocaleDateString("sv-SE"),
    interval: interval
  };
  const url = window.location || new URL("https://spot.56k.guru/"),
    inPath = "api/v2/spot",
    fullUrl = url.protocol + "//" + url.host + "/" +
      (inPath ? inPath : "") + "?" +
      new URLSearchParams(params).toString();
  return fullUrl;
};

const monthName = (d: Date|string|number): string => {
  const resolvedDate = typeof d === "number" ? new Date(d) : (d instanceof Date ? d : new Date(Date.parse(d)));
  if (!resolvedDate) return "-";
  const m = resolvedDate.getMonth();
  switch (m) {
    case 0:
      return "jan";
    case 1:
      return "feb";
    case 2:
      return "mar";
    case 3:
      return "apr";
    case 4:
      return "maj";
    case 5:
      return "jun";
    case 6:
      return "jul";
    case 7:
      return "aug";
    case 8:
      return "sep";
    case 9:
      return "okt";
    case 10:
      return "nov";
    case 11:
      return "dec";
  }
  return "";
};

const langFromUrl = (url: URL) => {
  if (url?.pathname?.startsWith("/sv")) {
    return "sv";
  } else if (url?.pathname?.startsWith("/no")) {
    return "no";
  } else if (url?.pathname?.startsWith("/fi")) {
    return "fi";
  } else if (url?.pathname?.startsWith("/dk")) {
    return "dk";
  } else if (url?.pathname?.startsWith("/de")) {
    return "de";
  } else if (url?.pathname?.startsWith("/at")) {
    return "de";
  } else {
    return "en";
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type { ChartSeries, CommonProps, ExtPageProps, BasePageProps };
export { dateText, formatHhMm, generateUrl, langFromUrl, monthName, sleep };
