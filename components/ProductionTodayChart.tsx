import { useEffect, useState } from "preact/hooks";
import { productionTodayChartOptions } from "config/charts/productiontoday.js";
import { formatHhMm } from "utils/common.ts";
import { CommonProps } from "utils/common.ts";
import { DBResultSet, SpotApiRow } from "../backend/db/index.ts";

interface ProductionTodayProps extends CommonProps {
  generationAndLoad: DBResultSet;
  cols: number;
}

export default function ProductionTodayChart(props: ProductionTodayProps) {

  const 
  [chartElm, setChartElm] = useState<ApexCharts>(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0));

  const renderChart = (seriesInput: Record<string,unknown>[], props: ProductionTodayProps) => {

    // Inject series into chart configuration
    const series = [];
    for (const s of seriesInput) {
      series.push(
        {
          data: (s.data as Record<string,unknown>[]).map((e: Record<string,unknown>) => {
            return { x: new Date(e.time as number), y: e.value };
          }),
          name: s.name,
          type: 'bar'
        },
      );
    }

    // deno-lint-ignore no-explicit-any
    const chartOptions: any = { ...productionTodayChartOptions };
    chartOptions.series = series;

    // Inject annotations for now
    const hourNow = new Date();
    hourNow.setMinutes(0);

    chartOptions.annotations = {
      yaxis: [
        {
          y: 0,
          strokeDashArray: 0,
          borderColor: '#CCC',
          borderWidth: 3,
          opacity: 0.9
        }
      ],
    };

    if (chartElm) chartElm.destroy();
    const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
    chart.render();
    setChartElm(chart);
  };

  const 
    dataArr: Record<string,unknown>[] = [],
    countries: Record<string,unknown[]> = {};
  for(const row of props.generationAndLoad.data) {
    countries[row[0]] = countries[row[0]] || [];
     countries[row[0]].push({
       time: row[1],
       value: row[7]
     });
  }
  for (const [key, country] of Object.entries(countries)) {
    dataArr.push({ name: key, data: country as SpotApiRow[] });
  }

  useEffect(() => {
    renderChart(dataArr, props);
  }, [props.priceFactor]);

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class={"px-card py-10 m-0 rounded-top"}>
            <h2 class="card-title font-size-18 m-0 text-center">
              <span data-t-key={"common.chart.net_production"} lang={props.lang}>Net production</span> - 
              <span data-t-key={"common.chart.yesterday_and_today"} lang={props.lang}>Yesterday and today</span>
            </h2>
          </div>
          <div class="content px-card m-0 p-0 bg-very-dark">
            {(dataArr) && <div class="col-lg" id={"chart_" + randomChartId}></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

