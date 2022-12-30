import { parse } from "xml";

const ExchangeRate = async () => {
  // Live
  const result = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"),
    resultText = await result.text(),
    resultJson = parse(resultText);

  // Clean up result
  const // deno-lint-ignore no-explicit-any
  base = (resultJson["gesmes:Envelope"] as any)?.Cube?.Cube,
    data = {
      "date": base["@time"],
      entries: {},
    };
  for (const entry of base.Cube) {
    data.entries[entry["@currency"]] = entry["@rate"];
  }

  return data;
};

export { ExchangeRate };
