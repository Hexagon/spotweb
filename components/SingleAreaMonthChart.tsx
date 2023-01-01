import { useEffect, useState } from "preact/hooks";
import { areaViewMonthChartOptions } from "config/charts/areaviewmonth.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { ChartSeries, CommonProps, generateUrl, processResultSet } from "utils/common.ts";
import { SpotApiParsedRow, SpotApiRow } from "backend/db/index.ts";

interface SingleAreaMonthChartProps extends CommonProps {
  cols: number;
  highlight: string;
  date: string;
  title: string;
}

export default function SingleAreaMonthChart(props: SingleAreaMonthChartProps) {
  const [rsMonth, setRSMonth] = useState<SpotApiParsedRow[]>(),
    [rsComparison, setRSComparison] = useState<SpotApiParsedRow[]>(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0)),
    [chartElm, setChartElm] = useState();

  const [comparison, setComparison] = useState<string | undefined>();

  const getData30d = async (area: string, date: Date): Promise<SpotApiParsedRow[]> => {
    const startDate = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(new Date(date).setDate(date.getDate() + 1));
    const response = await fetch(generateUrl(area, startDate, endDate, "daily"));
    const resultSet = await response.json();
    return processResultSet(resultSet.data);
  };

  const renderChart = (seriesInput: ChartSeries[], props: SingleAreaMonthChartProps) => {
    // Inject series into chart configuration
    const series = [];
    for (const s of seriesInput) {
      series.push(
        {
          data: s.data.map((e) => {
            return { x: e.time, y: processPrice(e.price, props) };
          }),
          name: s.name,
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
    if (!rsMonth && props.area) {
      let dataMonth = await getData30d(props.area.name, new Date(Date.parse(props.date)));
      // Apply exchange rate if needed
      dataMonth = applyExchangeRate(dataMonth, props.er, props.currency);
      // Set preact states
      setRSMonth(dataMonth);
    }
    if (comparison) {
      let dataMonth = await getData30d(comparison, new Date(Date.parse(props.date)));

      // Apply exchange rate if needed
      dataMonth = applyExchangeRate(dataMonth, props.er, props.currency);
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
        { name: props.area?.name || "", data: rsMonth },
        { name: comparison, data: rsComparison },
      ], props);
    } else if (rsMonth) {
      renderChart([
        { name: props.area?.name || "", data: rsMonth },
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
                  <option value="" selected={true} disabled={true} data-t-key="common.chart.compare_to" lang={props.lang}>Jämför med</option>
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
