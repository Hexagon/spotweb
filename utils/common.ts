import { ExchangeRateResult, SpotApiParsedRow, SpotApiRow } from "../backend/db/index.ts";
import { Country, DataArea } from "../config/countries.ts";

interface ExtPageProps {
  country: Country;
  area?: DataArea;
  areas?: DataArea[];
  er: ExchangeRateResult;
  lang: string;
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
  data: SpotApiParsedRow[];
}

const formatHhMm = (d: Date) => {
  const hours = ("" + d.getHours()).padStart(2, "0"),
    minutes = ("" + d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const processResultSet = (rawApiResultset: SpotApiRow[]): SpotApiParsedRow[] => {
  const out: SpotApiParsedRow[] = [];
  for (const row of rawApiResultset) {
    out.push({
      ...row,
      time: new Date(Date.parse(row.time)),
    });
  }
  return out;
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

const generateUrl = (area: string, startDate: Date, endDate: Date, period?: string) => {
  const params: Record<string, string> = {
    area: area,
    period: period ? period : "hourly",
    startDate: startDate.toLocaleDateString("sv-SE"),
    endDate: endDate.toLocaleDateString("sv-SE"),
  };
  const url = window.location || new URL("https://spot.56k.guru/"),
    inPath = "api/v2/spot",
    fullUrl = url.protocol + "//" + url.host + "/" +
      (inPath ? inPath : "") + "?" +
      new URLSearchParams(params).toString();
  return fullUrl;
};

// Get datasets
const getDataDay = async (areaId: string, date: Date) => {
  const startDate = new Date(date.getTime()),
    endDate = new Date(date.getTime());
  const response = await fetch(generateUrl(areaId, startDate, endDate));
  return await response.json();
};

const getDataMonth = async (areaId: string, date: Date) => {
  const startDate = new Date(date.getTime()),
    endDate = new Date(date.getTime());
  startDate.setDate(1);
  const response = await fetch(generateUrl(areaId, startDate, endDate));
  return await response.json();
};

const monthName = (d: Date): string => {
  if (!d) return "-";
  const m = d.getMonth();
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
  } else {
    return "sv";
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type { ChartSeries, CommonProps, ExtPageProps };
export { dateText, formatHhMm, generateUrl, getDataDay, getDataMonth, langFromUrl, monthName, processResultSet, sleep };
