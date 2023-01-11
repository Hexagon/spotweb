import { useEffect, useState } from "preact/hooks";
import { historyChartOptions } from "config/charts/historyview.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { ChartSeries, CommonProps, generateUrl } from "utils/common.ts";
import { SpotApiRow } from "backend/db/index.ts";

export default function AllAreaChartLongTerm(props: CommonProps) {

  const 
    [chartElm, setChartElm] = useState<ApexCharts>(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0));

  const renderChart = async (props: CommonProps) => {
  
    const seriesInput: ChartSeries[] = [];
    if (props.areas) {
      for (const area of props.areas) {
        let dataSet = await getDataLongTerm(area.name);
        dataSet = applyExchangeRate(dataSet, props.er, props.currency);
        if (dataSet) seriesInput.push({ name: area.name, data: dataSet });
      }
    }
    
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
    const chartOptions: any = { ...historyChartOptions };
    chartOptions.series = series;

    if (chartElm) chartElm.destroy();
    const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
    chart.render();
    setChartElm(chart);
  };

  const getDataLongTerm = async (area: string): Promise<SpotApiRow[]> => {
    const startDate = new Date(Date.parse("2021-01-01")),
      endDate = new Date(new Date().setDate(new Date().getDate() + 1));
    const response = await fetch(generateUrl(area, startDate, endDate, props.country?.interval || "PT60M", "monthly"));
    const resultSet = await response.json();
    return resultSet.data;
  };

  useEffect(() => {
    renderChart(props);
  }, [props.priceFactor]);

  return (
    <div class={"col-lg-6 m-0 p-0"}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class={"px-card py-10 m-0 rounded-top"}>
            <h2 class="card-title font-size-18 m-0 text-center">
              <span data-t-key={"common.overview.all_areas_longterm"} lang={props.lang}>All areas</span>
            </h2>
          </div>
          <div class="content px-card m-0 p-0 bg-very-dark">
            <div class="col-lg" id={"chart_" + randomChartId}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
