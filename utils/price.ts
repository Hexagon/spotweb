import { ExchangeRateResult, SpotApiRow } from "backend/db/index.ts";

interface PriceProcessorProps {
  unit: string;
  extra: number;
  multiplier: number;
  factor: number;
  decimals: number;
  priceFactor: boolean;
  currency: string;
}

const processPrice = (
  price: number | null,
  props: PriceProcessorProps,
) => {
  if (price === null || price === undefined) return "-";

  // Convert between MWh and kWh
  price = price / 1000;

  if (props.priceFactor) {
    // Multiply
    price *= props.multiplier;
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

const maxPrice = (rs: SpotApiRow[] | undefined): number | null => {
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

const minPrice = (rs: SpotApiRow[] | undefined): number | null => {
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

const avgPrice = (rs: SpotApiRow[] | undefined): number | null => {
  if (rs && rs.length) {
    const filtered = rs.filter((e) => e.price !== null);
    return filtered.reduce((a, b) => a + b.price, 0) / filtered.length;
  } else {
    return null;
  }
};

const nowPrice = (rs: SpotApiRow[] | undefined): number | null => {
  if (rs && rs.length > 0) {
    const result = rs.find((e) => e.time <= new Date().getTime() && e.time + 3600 * 1000 >= new Date().getTime());
    return result ? result.price : null;
  } else {
    return null;
  }
};

const applyExchangeRate = (rs: SpotApiRow[], ex: ExchangeRateResult, currency: string) => {
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

const applyExchangeRateSingle = (rs: number, ex: ExchangeRateResult, currency: string) => {
  // Do not process EUR
  if (currency === "EUR") return rs;

  // Treat "öre" as "SEK"
  if (currency === "öre") currency = "SEK";

  const converted = rs * ex.entries[currency];

  return converted;
};

export { applyExchangeRate, applyExchangeRateSingle, avgPrice, maxPrice, minPrice, nowPrice, processPrice };
