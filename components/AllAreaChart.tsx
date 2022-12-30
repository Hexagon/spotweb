import { useEffect, useState } from "preact/hooks";
import { ExrateApiParsedResult } from "routes/api/exrate.ts";
import { EntsoeApiParsedResult } from "routes/api/entsoe.ts";
import { liveViewChartOptions } from "config/charts/liveview.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { formatHhMm } from "utils/common.ts";

interface AllAreaChartProps {
  unit: string;
  extra: number;
  factor: number;
  highlight: string;
  currency: string;
  decimals: number;
  date: string;
  title: string;
  priceFactor: boolean;
  lang: string;
  data: unknown;
  erData: ExrateApiParsedResult;
}

interface EntsoeApiParsedResultArrayItem {
  area: string;
  result: EntsoeApiParsedResult;
}

export default function AllAreaChart(props: AllAreaChartProps) {
  const [chartElm, setChartElm] = useState(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0));

  const renderChart = (seriesInput: EntsoeApiParsedResultArrayItem[], props: LiveViewProps) => {
    // Inject series into chart configuration
    const series = [];
    for (const s of seriesInput) {
      series.push(
        {
          data: s.result.map((e) => {
            return { x: formatHhMm(new Date(Date.parse(e.time))), y: processPrice(e.price, props) };
          }),
          name: s.area,
        },
      );
    }

    // deno-lint-ignore no-explicit-any
    const chartOptions: any = { ...liveViewChartOptions };
    chartOptions.series = series;

    // Inject annotations for now
    if (props.date === new Date().toLocaleDateString()) {
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

  const dataArr: EntsoeApiParsedResultArrayItem[] = [];
  if (props.areas) {
    for (const area of props.areas) {
      let dataSet;
      if (props.title == "today") {
        dataSet = applyExchangeRate(area.dataToday, props.er, props.currency);
      } else {
        dataSet = applyExchangeRate(area.dataTomorrow, props.er, props.currency);
      }
      dataArr.push({ area: area.name, result: dataSet });
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
