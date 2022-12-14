import { parse } from "xml";

const ExchangeRate = async () => {
  // Live
  const result = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"),
    resultText = await result.text(),
    resultJson = parse(resultText);

  // Clean up result
  const // deno-lint-ignore no-explicit-any
  base = (resultJson["gesmes:Envelope"] as any)?.Cube?.Cube,
    entries: Record<string, string> = {},
    data = {
      "date": base["@time"],
      entries,
    };
  let entry: Record<string, string>;
  for (entry of base.Cube) {
    data.entries[entry["@currency"] as string] = entry["@rate"];
  }

  return data;
};

export { ExchangeRate };
