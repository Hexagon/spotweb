const defaultCurrency = (lang) => {
  if (lang == "sv") {
    return "öre";
  } else if (lang == "no") {
    return "NOK";
  } else if (lang == "fi") {
    return "EUR";
  } else if (lang == "dk") {
    return "DKK";
  } else {
    // Default to EUR, should never happen anyways
    return "EUR";
  }
};

const defaultExtra = (lang) => {
  if (lang == "sv") {
    return "0.095";
  } else {
    return "0";
  }
};

const defaultFactor = (lang) => {
  if (lang == "sv") {
    return "1.25";
  } else {
    return "1";
  }
};

const defaultPricefactor = (lang) => {
  if (lang == "sv") {
    return true;
  } else {
    return false;
  }
};

const preferences = {
  lang: (lang) => localStorage.getItem("sw_lang") ?? lang,
  currency: (lang) => localStorage.getItem("sw_currency") ?? defaultCurrency(lang),
  unit: () => localStorage.getItem("sw_unit") ?? "kWh",
  factor: (lang) => parseFloat(localStorage.getItem("sw_factor") ?? defaultFactor(lang)),
  extra: (lang) => parseFloat(localStorage.getItem("sw_extra") ?? defaultExtra(lang)),
  decimals: (lang) =>
    parseInt(localStorage.getItem("sw_decimals") ?? (((localStorage.getItem("sw_currency") ?? defaultCurrency(lang)) === "öre") ? "1" : "2"), 10),
  pricefactor: (
    lang,
  ) => (localStorage.getItem("sw_pricefactor") === "false"
    ? false
    : (localStorage.getItem("sw_pricefactor") === "true" ? true : defaultPricefactor(lang))),
};

export { preferences };
