import { useEffect, useState } from "preact/hooks";
import { ExrateApiParsedResult } from "routes/api/exrate.ts";
import { EntsoeApiParsedResult } from "routes/api/entsoe.ts";
import { areaViewMonthChartOptions } from "config/charts/areaviewmonth.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { generateUrl } from "utils/common.ts";

interface AreaViewProps {
  unit: string;
  extra: number;
  factor: number;
  area: unknown;
  cols: number;
  currency: string;
  decimals: number;
  highlight: string;
  date: string;
  dateT: string;
  title: string;
  priceFactor: boolean;
  lang: string;
  er: ExrateApiParsedResult;
}

interface ChartSeries {
  name: string;
  data: EntsoeApiParsedResult;
  type: string;
}

export default function SingleAreaMonthChart(props: AreaViewProps) {
  const [rsMonth, setRSMonth] = useState<EntsoeApiParsedResult>(),
    [rsComparison, setRSComparison] = useState<EntsoeApiParsedResult>(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0)),
    [chartElm, setChartElm] = useState();

  const [comparison, setComparison] = useState<string | undefined>();

  const getData30d = async (area: string, date: Date) => {
    const startDate = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(new Date(date).setDate(date.getDate() + 1));
    const response = await fetch(generateUrl(area, startDate, endDate, "daily"));
    return await response.json();
  };

  const renderChart = (seriesInput: ChartSeries[], props: AreaViewProps) => {
    // Inject series into chart configuration
    const series = [];
    for (const s of seriesInput) {
      series.push(
        {
          data: s.data.map((e) => {
            return { x: Date.parse(e.time), y: processPrice(e.price, props) };
          }),
          name: s.name,
          type: s.type,
        },
      );
    }

    // deno-lint-ignore no-explicit-any
    const chartOptions: any = { ...areaViewMonthChartOptions };
    chartOptions.series = series;

    // Remove gradient if using multiple series
    if (seriesInput.length > 1) chartOptions.fill = {};

    // Inject annotations for now
    const dateMow = new Date();
    dateMow.setHours(0, 0, 0, 0);

    chartOptions.annotations = {
      xaxis: [
        {
          x: dateMow.getTime(),
          seriesIndex: 0,
          borderColor: "#ff7Da0",
          label: {
            style: {
              border: "ff7Da0",
              color: "#EEE",
              background: "#234",
            },
            text: "Nu",
          },
        },
      ],
    };

    if (chartElm) chartElm.destroy();
    const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
    chart.render();
    setChartElm(chart);
  };

  const tryGetData = async () => {
    if (!rsMonth) {
      let dataMonth = await getData30d(props.area.name, new Date(Date.parse(props.date)));
      // Apply exchange rate if needed
      dataMonth = applyExchangeRate(dataMonth.data, props.er, props.currency);
      // Set preact states
      setRSMonth(dataMonth);
    }
    if (comparison) {
      let dataMonth = await getData30d(comparison, new Date(Date.parse(props.date)));

      // Apply exchange rate if needed
      dataMonth = applyExchangeRate(dataMonth.data, props.er, props.currency);
      // Set preact states
      setRSComparison(dataMonth);
    }
  };

  useEffect(() => {
    tryGetData();
  }, []);

  useEffect(() => {
    tryGetData();
  }, [comparison]);

  useEffect(() => {
    if (rsMonth && comparison && rsComparison) {
      renderChart([
        { name: props.area.name, data: rsMonth, type: "line" },
        { name: comparison, data: rsComparison, type: "line" },
      ], props);
    } else if (rsMonth) {
      renderChart([
        { name: props.area.name, data: rsMonth, type: "line" },
      ], props);
    }
  }, [rsMonth, rsComparison, props.priceFactor]);

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class="px-card py-10 m-0 rounded-top bg pr-10">
            <div class="row">
              <div class="col col-lg-9 card-title font-size-18">
                <h2 class="card-title font-size-18 m-0 text-left" data-t-key="common.overview.thirty_day_chart" lang={props.lang}>
                  30 days history
                </h2>
              </div>
              <div class="col col-lg-3 text-right pr-0">
                <select
                  class="form-control -control-sm"
                  id="select-compare"
                  name="select-compare"
                  onChange={(e) => setComparison((e.target as HTMLSelectElement).value)}
                >
                  <option value="" selected={true} disabled={true}>Jämför med</option>
                  <option value="SE1">SE1</option>
                  <option value="SE2">SE2</option>
                  <option value="SE3">SE3</option>
                  <option value="SE4">SE4</option>
                  <option value="NO1">NO1</option>
                  <option value="NO2">NO2</option>
                  <option value="NO3">NO3</option>
                  <option value="NO4">NO4</option>
                  <option value="NO5">NO5</option>
                  <option value="DK1">DK1</option>
                  <option value="DK2">DK2</option>
                  <option value="FI">FI</option>
                </select>
              </div>
            </div>
          </div>
          <div class="content px-card m-0 p-0 bg-very-dark text-center chart" id={"chart_" + randomChartId}></div>
        </div>
      </div>
    </div>
  );
}
