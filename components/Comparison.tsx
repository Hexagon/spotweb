import { useEffect, useState } from "preact/hooks";
import { comparisonChartOptions } from "config/charts/comparison.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { generateUrl } from "utils/common.ts";
import { GetExchangeRates } from "backend/db/index.ts";

interface ComparisonProps {
  period: string;
  currency: string;
  startDate: string;
  endDate: string;
  areas: string;
  unit: string;
  extra: number;
  factor: number;
  decimals: number;
  priceFactor: boolean;
}

export type { ComparisonProps };

export default function Comparison(props: ComparisonProps) {
  const [randomChartId, setRandomChartId] = useState((Math.random() * 10000).toFixed(0));

  const [areas, setAreas] = useState(props.areas || "SE1");
  const [currency, setCurrency] = useState(props.currency || "SEK");
  const [period, setPeriod] = useState(props.period || "hourly");
  const [startDate, setStartDate] = useState(props.startDate || new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(props.endDate || new Date().toISOString().split("T")[0]);

  const [loading, setLoading] = useState(false);

  const [done, setDone] = useState(false);

  const [rsER, setRSER] = useState<ExrateApiParsedResult>();

  const renderChart = (results: EntsoeApiParsedResult[]) => {
    const chartOptions = { ...comparisonChartOptions },
      chartSeries = [];
    for (const result of results) {
      chartSeries.push({
        data: result.data.flatMap(({ startTime, spotPrice, unit }) => {
          if (spotPrice !== null) return [[new Date(Date.parse(startTime)).getTime(), processPrice(spotPrice, props, unit)]];
          return [];
        }),
        name: "" + result.data[0].areaCode,
      });
    }
    // deno-lint-ignore no-explicit-any
    (chartOptions as any).series = chartSeries;
    const chartElement = document.querySelector("#chart_" + randomChartId);
    if (chartElement) {
      chartElement.innerHTML = "";
    }
    const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
    chart.render();
  };

  const getData = async () => {
    const splitAreas = areas.split(",");
    const results = [];
    setLoading(true);
    for (const a of splitAreas) {
      // Fetch if input data is sane
      if (ensureLocalProps()) {
        const url = generateUrl(a, new Date(Date.parse(startDate)), new Date(Date.parse(endDate)));
        if (url) {
          const dataER = await GetExchangeRates();
          setRSER(dataER);
          const response = await fetch(url);
          let result = await response.json();
          result = applyExchangeRate(result, dataER, currency);
          results.push(result);
        }
      }
    }
    setLoading(false);
    setDone(true);
    renderChart(results);
  };

  const ensureUrlProps = () => props.areas && props.currency && props.period && props.startDate && props.endDate && true;
  const ensureLocalProps = () => areas && currency && period && startDate && endDate && true;

  const tryGetData = () => {
    if (ensureUrlProps()) {
      getData();
    }
  };

  useEffect(() => {
    tryGetData();
  }, []);

  return (
    <div class="content-wrapper">
      <div class="content">
        <h2 class="content-title">Get data</h2>
        <div class="form-row row-eq-spacing-sm">
          <div class="col-sm">
            <label for="period">Period</label>
            <select
              class="form-control"
              name="period"
              value={period}
              onChange={(e) => setPeriod((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="hourly">Timme</option>
              <option value="daily">Dag</option>
              <option value="weekly">Vecka</option>
              <option value="monthly">Månad</option>
              <option value="yearly">År</option>
            </select>
          </div>
          <div class="col-sm">
            <label for="currency">Valuta</label>
            <select
              class="form-control"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="SEK">SEK</option>
              <option value="NOK">NOK</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div class="col-sm">
            <label for="area">Elprisområde</label>
            <select
              class="form-control"
              name="area"
              onChange={(e) => setAreas([...((e.target as HTMLSelectElement).selectedOptions)].map((e) => e.value).join(","))}
              multiple={true}
              required
            >
              <option value="SE1">SE1</option>
              <option value="SE2">SE2</option>
              <option value="SE3">SE3</option>
              <option value="SE4">SE4</option>
            </select>
          </div>
          <div class="col-sm">
            <label for="date">Startdatum</label>
            <input
              class="form-control"
              type="date"
              name="startDate"
              value={startDate}
              onInput={(e) => setStartDate((e.target as HTMLInputElement).value)}
            >
            </input>
          </div>
          <div class="col-sm">
            <label for="date">Slutdatum</label>
            <input
              class="form-control"
              type="date"
              name="endDate"
              value={endDate}
              onInput={(e) => setEndDate((e.target as HTMLInputElement).value)}
            >
            </input>
          </div>
          <div class="col-sm">
            <label for="ok">&nbsp;</label>
            <button
              class="form-control btn btn-success"
              type="button"
              name="ok"
              id="ok"
              onClick={getData}
            >
              Go
            </button>
          </div>
        </div>
        {period != "hourly" && !done && (
          <div class="row">
            <div class="col-md">
              <div class="alert alert-secondary" role="alert">
                <h4 class="alert-heading">Vid urval på månad eller vecka</h4>
                När du gör urval per månad eller vecka, ange det sista datumet i den sista månaden eller veckan du vill se.
              </div>
            </div>
          </div>
        )}
        <div class={"row" + (loading ? " d-none" : "")}>
          <div class="col-sm" id={"chart_" + randomChartId}></div>
        </div>
      </div>
      {loading &&
        (
          <div class="content" aria-busy="true">
            <h5>Fetching latest data ...</h5>
          </div>
        )}
    </div>
  );
}
