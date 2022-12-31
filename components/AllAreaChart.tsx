import { useEffect, useState } from "preact/hooks";
import { liveViewChartOptions } from "config/charts/liveview.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { ChartSeries, CommonProps, formatHhMm, processResultSet } from "utils/common.ts";
import { SpotApiRow } from "../backend/db/index.ts";

interface AllAreaChartProps extends CommonProps {
  highlight: string;
  title: string;
}

export default function AllAreaChart(props: AllAreaChartProps) {
  const [chartElm, setChartElm] = useState(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0));

  const renderChart = (seriesInput: ChartSeries[], props: AllAreaChartProps) => {

    // Inject series into chart configuration
    const series = [];
    for (const s of seriesInput) {
      series.push(
        {
          data: s.data.map((e) => {
            return { x: formatHhMm(e.time), y: processPrice(e.price, props) };
          }),
          name: s.name,
        },
      );
    }

    // deno-lint-ignore no-explicit-any
    const chartOptions: any = { ...liveViewChartOptions };
    chartOptions.series = series;

    // Inject annotations for now
    if (props.title === "today") {
      const hourNow = new Date();
      hourNow.setMinutes(0);

      chartOptions.annotations = {
        xaxis: [
          {
            x: formatHhMm(hourNow),
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
    }

    if (chartElm) chartElm.destroy();
    const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
    chart.render();
    setChartElm(chart);
  };

  const dataArr: ChartSeries[] = [];
  if (props.areas) {
    for (const area of props.areas) {
      let dataSet;
      if (props.title == "today") {
        dataSet = applyExchangeRate(processResultSet(area.dataToday), props.er, props.currency);
      } else {
        dataSet = applyExchangeRate(processResultSet(area.dataTomorrow), props.er, props.currency);
      }
      if (dataSet) dataArr.push({ name: area.name, data: dataSet });
    }
  }

  useEffect(() => {
    if (dataArr?.length) {
      renderChart(dataArr, props);
    }
  }, [props.priceFactor]);

  return (
    <div class="col-md m-0 p-0">
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class={"px-card py-10 m-0 rounded-top bg-" + props.highlight}>
            <h2 class="card-title font-size-18 m-0 text-center">
              <span data-t-key={"common.overview.all_areas_" + props.title} lang={props.lang}>All areas</span>
            </h2>
          </div>
          <div class="content px-card m-0 p-0 bg-very-dark">
            {!(dataArr) && (
              <div class="col-lg text-center" style="height: 315px;">
                <h6 style="margin:auto;">Uppdaterad data kommer kring 13:00</h6>
              </div>
            )}
            {(dataArr) && <div class="col-lg" id={"chart_" + randomChartId}></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
