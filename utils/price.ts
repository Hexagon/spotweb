import { ExchangeRateRow } from "backend/db/index.ts";
import { ExrateApiParsedResult } from "routes/api/exrate.ts";

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
  if (rs && rs.length) {
    const result = Math.max(...rs.filter((e) => e.price !== null).map((e) => e.price));
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
  if (rs && rs.length) {
    const result = Math.min(...rs.filter((e) => e.price !== null).map((e) => e.price));
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
  if (rs && rs.length) {
    const filtered = rs.filter((e) => e.price !== null);
    return filtered.reduce((a, b) => a + b.price, 0) / filtered.length;
  } else {
    return null;
  }
};

const nowPrice = (rs: EntsoeApiParsedResult | undefined): number | null => {
  if (rs && rs.length > 0) {
    const result = rs.find((e) => Date.parse(e.time) <= new Date().getTime() && Date.parse(e.time) + 3600 * 1000 >= new Date().getTime());

    return result ? result.price : null;
  } else {
    return null;
  }
};

const applyExchangeRate = (rs: EntsoeApiParsedResult | undefined, ex: ExrateApiParsedResult | ExchangeRateRow[], currency: string) => {
  // Do not process EUR
  if (currency === "EUR") return rs;

  // Treat "öre" as "SEK"
  if (currency === "öre") currency = "SEK";

  const rsCopy = [];

  if (rs) {
    for (const d of rs) {
      const dCopy = { ...d };
      dCopy.price = dCopy.price * ex.entries[currency];
      rsCopy.push(dCopy);
    }
  }

  return rsCopy;
};

export { applyExchangeRate, avgPrice, maxPrice, minPrice, nowPrice, processPrice };
