import { EntsoeApiParsedResult } from "../routes/api/entsoe.ts";
import { ExrateApiParsedResult } from "../routes/api/exrate.ts";
import { generateExchangeRateUrl } from "./common.ts";

interface PriceProcessorProps {
  unit: string;
  extra: number;
  factor: number;
  decimals: number;
  priceFactor: boolean;
  currency: string;
}

const processPrice = (
  price: number | null,
  props: PriceProcessorProps,
  eUnit?: string,
) => {
  if (price === null || price === undefined || price === 0) return "-";

  // Default eUnit to MWh
  if (!eUnit) eUnit = "MWh";

  // Convert between MWh and kWh
  if (eUnit.includes("MWh") && props.unit.includes("kWh")) {
    price = price / 1000;
  } else if (eUnit.includes("kWh") && props.unit.includes("MWh")) {
    price = price * 1000;
  }

  if (props.priceFactor) {
    // Add extra
    price += props.extra;
    // Multiply by factor
    price *= props.factor;
    // Convert between MWh and kWh - Update units
  }

  // Multiply by öre
  if (props.currency === "öre") {
    price *= 100;
  }

  return price.toFixed(props.decimals);
};

const maxPrice = (rs: EntsoeApiParsedResult | undefined): number | null => {
  if (rs && rs.data) {
    const result = Math.max(...rs.data.filter((e) => e.spotPrice !== null).map((e) => e.spotPrice));
    if (result !== Infinity && result !== -Infinity) {
      return result;
    } else {
      return null;
    }
  } else {
    return null;
  }
};

const minPrice = (rs: EntsoeApiParsedResult | undefined): number | null => {
  if (rs && rs.data) {
    const result = Math.min(...rs.data.filter((e) => e.spotPrice !== null).map((e) => e.spotPrice));
    if (result !== Infinity && result !== -Infinity) {
      return result;
    } else {
      return null;
    }
  } else {
    return null;
  }
};

const avgPrice = (rs: EntsoeApiParsedResult | undefined): number | null => {
  if (rs && rs.data && rs.data.length > 0) {
    const filtered = rs.data.filter((e) => e.spotPrice !== null);
    return filtered.reduce((a, b) => a + b.spotPrice, 0) / filtered.length;
  } else {
    return null;
  }
};

const nowPrice = (rs: EntsoeApiParsedResult | undefined): number | null => {
  if (rs && rs.data && rs.data.length > 0) {
    const result = rs.data.find((e) => Date.parse(e.startTime) <= new Date().getTime() && Date.parse(e.endTime) >= new Date().getTime());
    return result ? result.spotPrice : null;
  } else {
    return null;
  }
};

const applyExchangeRate = (rs: EntsoeApiParsedResult | undefined, ex: ExrateApiParsedResult, currency: string) => {
  // Treat "öre" as "SEK"
  if (currency === "öre") currency = "SEK";

  if (rs) {
    for (const d of rs.data) {
      if (d.unit.includes("EUR")) {
        if (!d.unit.includes(currency)) {
          // Convert!
          d.spotPrice = d.spotPrice * ex.data.entries[currency];
          d.unit.replace("EUR", currency);
        }
      }
    }
  }

  return rs;
};

const getExchangeRates = async () => {
  const response = await fetch(generateExchangeRateUrl()),
    responseJson = await response.json();
  return responseJson;
};

export { applyExchangeRate, avgPrice, getExchangeRates, maxPrice, minPrice, nowPrice, processPrice };
