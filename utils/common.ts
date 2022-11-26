const formatHhMm = (d: Date) => {
  const hours = ("" + d.getHours()).padStart(2, "0"),
    minutes = ("" + d.getMinutes()).padStart(2, "0");
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

const generateExchangeRateUrl = () => {
  const url = window.location,
    inPath = "api/exrate",
    fullUrl = url.protocol + "//" + url.host + "/" +
      (inPath ? inPath : "") + "?" +
      new URLSearchParams({}).toString();
  return fullUrl;
};

const generateUrl = (area: string, startDate: Date, endDate: Date, limitCache?: boolean) => {
  const params: unknown = { currency: "SEK", area: area, period: "hourly", startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  if (limitCache) params.limitCache = true;
  const url = window.location,
    inPath = "api/entsoe",
    fullUrl = url.protocol + "//" + url.host + "/" +
      (inPath ? inPath : "") + "?" +
      new URLSearchParams(params).toString();
  return fullUrl;
};

const monthName = (d: Date): string => {
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
  }

  return "sv";
};
export { dateText, formatHhMm, generateExchangeRateUrl, generateUrl, langFromUrl, monthName };
