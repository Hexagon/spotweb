import { useEffect, useState } from "preact/hooks";
import { ExrateApiParsedResult } from "../routes/api/exrate.ts";
import { EntsoeApiParsedResult } from "../routes/api/entsoe.ts";
import { liveViewChartOptions } from "../utils/charts/liveview.js";
import { applyExchangeRate, avgPrice, getExchangeRates, maxPrice, minPrice, nowPrice, processPrice } from "../utils/price.ts";
import { formatHhMm, generateExchangeRateUrl, generateUrl } from "../utils/common.ts";
import { countries } from "../utils/countries.js";

interface LiveViewProps {
  unit: string;
  extra: number;
  factor: number;
  highlight: string;
  currency: string;
  decimals: number;
  date: string;
  title: string;
  priceFactor: boolean;
  country: string;
  lang: string;
}

interface EntsoeApiParsedResultArrayItem {
  area: string;
  result: EntsoeApiParsedResult;
}

export default function AllAreaChart(props: LiveViewProps) {
  const country = countries.find((c) => c.id === props.country),
    [rsArr, setRSArr] = useState<EntsoeApiParsedResultArrayItem[]>(),
    [chartElm, setChartElm] = useState(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0)),
    [rsER, setRSER] = useState<ExrateApiParsedResult>();

  const renderChart = (seriesInput: EntsoeApiParsedResultArrayItem[], props: LiveViewProps) => {
    // Inject series into chart configuration
    const series = [];
    for (const s of seriesInput) {
      series.push(
        {
          data: s.result.data.map((e) => {
            return { x: formatHhMm(new Date(Date.parse(e.startTime))), y: processPrice(e.spotPrice, props) };
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

  const getData = async (area: string) => {
    const startDate = new Date(Date.parse(props.date)),
      endDate = new Date(Date.parse(props.date));
    endDate.setHours(23);
    const response = await fetch(generateUrl(area, startDate, endDate));
    return await response.json();
  };

  const tryGetData = async () => {
    const dataER = await getExchangeRates();

    const dataArr: EntsoeApiParsedResultArrayItem[] = [];
    if (country?.areas) {
      for (const area of country.areas) {
        const resultSet: EntsoeApiParsedResult = await getData(area.id);
        applyExchangeRate(resultSet, dataER, props.currency);
        dataArr.push({ area: area.name, result: resultSet });
      }
    }

    setRSArr(dataArr);
    setRSER(dataER);
  };

  useEffect(() => {
    tryGetData();
  }, []);

  useEffect(() => {
    if (rsArr?.length) {
      renderChart(rsArr, props);
    }
  }, [rsArr, props.priceFactor]);

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
            {!(rsArr) && (
              <div class="col-lg text-center" style="height: 315px;">
                <h6 style="margin:auto;">Uppdaterad data kommer kring 13:00</h6>
              </div>
            )}
            {(rsArr) && <div class="col-lg" id={"chart_" + randomChartId}></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
