import { useEffect, useState } from "preact/hooks";
import { ExrateApiParsedResult } from "../routes/api/exrate.ts";
import { EntsoeApiParsedResult } from "../routes/api/entsoe.ts";
import { areaViewChartOptions } from "../utils/charts/areaview.js";
import { applyExchangeRate, getExchangeRates, processPrice } from "../utils/price.ts";
import { formatHhMm, generateUrl } from "../utils/common.ts";

interface SingleAreaChartProps {
  unit: string;
  extra: number;
  factor: number;
  area: string;
  areaId: string;
  cols: number;
  currency: string;
  decimals: number;
  highlight: string;
  date: string;
  dateT: string;
  title: string;
  priceFactor: boolean;
  lang: string;
}

interface ChartSeries {
  name: string;
  data: EntsoeApiParsedResult;
}

export default function SingleAreaChart(props: SingleAreaChartProps) {
  const [rsToday, setRSToday] = useState<EntsoeApiParsedResult>(),
    [rsTomorrow, setRSTomorrow] = useState<EntsoeApiParsedResult>(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0)),
    [chartElm, setChartElm] = useState(),
    [rsER, setRSER] = useState<ExrateApiParsedResult>();

  const renderChart = (seriesInput: ChartSeries[], props: SingleAreaChartProps) => {
    // Inject series into chart configuration
    const series = [];
    for (const s of seriesInput) {
      series.push(
        {
          data: s.data.data.map((e) => {
            return { x: formatHhMm(new Date(Date.parse(e.startTime))), y: processPrice(e.spotPrice, props) };
          }),
          name: s.name,
        },
      );
    }

    // deno-lint-ignore no-explicit-any
    const chartOptions: any = { ...areaViewChartOptions };
    chartOptions.series = series;

    // Inject annotations for now
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

    if (chartElm) chartElm.destroy();
    const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
    chart.render();
    setChartElm(chart);
  };

  const getData = async (date: string) => {
    const startDate = new Date(Date.parse(date)),
      endDate = new Date(new Date(startDate).setHours(23));
    const response = await fetch(generateUrl(props.areaId, startDate, endDate));
    return await response.json();
  };

  const tryGetData = async () => {
    let dataToday = await getData(props.date),
      dataTomorrow = await getData(props.dateT);

    const dataER = await getExchangeRates();

    // Apply exchange rate if needed
    dataToday = applyExchangeRate(dataToday, dataER, props.currency);
    dataTomorrow = applyExchangeRate(dataTomorrow, dataER, props.currency);

    // Set preact states
    setRSToday(dataToday);
    setRSTomorrow(dataTomorrow);
    setRSER(dataER);
  };

  useEffect(() => {
    tryGetData();
  }, []);

  useEffect(() => {
    if (rsToday?.valid && rsTomorrow?.valid) {
      renderChart([
        { name: "Idag", data: rsToday },
        { name: "Imorgon", data: rsTomorrow },
      ], props);
    } else if (rsToday?.valid) {
      renderChart([
        { name: "Idag", data: rsToday },
      ], props);
    }
  }, [rsToday, rsTomorrow, props.priceFactor]);

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class="px-card py-10 m-0 rounded-top bg">
            <h2 class="card-title font-size-18 m-0 text-center" data-t-key="common.chart.today_and_tomorrow" lang={props.lang}>
              Today and tomorrow
            </h2>
          </div>
          <div class="content px-card m-0 p-0 bg-very-dark text-center chart" id={"chart_" + randomChartId}>
          </div>
        </div>
      </div>
    </div>
  );
}
