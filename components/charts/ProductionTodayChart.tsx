import { useEffect, useState } from "preact/hooks";
import { productionTodayChartOptions } from "config/charts/productiontoday.js";
import { CommonProps } from "utils/common.ts";
import { DBResultSet, SpotApiRow } from "backend/db/index.ts";
import { Area, Country } from "config/countries.ts";

interface ProductionTodayProps extends CommonProps {
  generationAndLoad: DBResultSet;
  country: Country;
  area?: Area;
  cols: number;
}

export default function ProductionTodayChart(props: ProductionTodayProps) {

  const 
  [chartElm, setChartElm] = useState<ApexCharts>(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0));

  const renderChart = (seriesInput: (string|number)[][], props: ProductionTodayProps) => {

    // Inject series into chart configuration
    const series = [];
    series.push(
      {
        data: seriesInput.map((e: (string|number)[]) => {
          return { x: e[0], y: e[1] };
        }),
        name: "net_production",
        type: 'bar'
      },
    );

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

  useEffect(() => {
    renderChart(props.generationAndLoad.data, props);
  }, [props.priceFactor]);

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class={"px-card py-10 m-0 rounded-top"}>
            <h2 class="card-title font-size-18 m-0 text-center">
              <span data-t-key={"common.chart.net_production"} lang={props.lang}>Net production</span>
              &nbsp;-&nbsp;
              {props.area ? props.area.name : props.country?.name}
              &nbsp;-&nbsp;
              <span data-t-key={"common.chart.yesterday_and_today"} lang={props.lang}>Yesterday and today</span>
            </h2>
          </div>
          <div class="content px-card m-0 p-0 bg-very-dark">
            {(props.generationAndLoad.data) && <div class="col-lg" id={"chart_" + randomChartId}></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

