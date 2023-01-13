import { useEffect, useState } from "preact/hooks";
import { areaViewChartOptions } from "config/charts/areaview.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { ChartSeries, CommonProps, formatHhMm } from "utils/common.ts";
import { DataArea } from "config/countries.ts";
import { ExchangeRateResult } from "backend/db/index.ts";
import { locale_kit } from "localekit_fresh";

interface SingleAreaChartProps extends CommonProps {
  area: DataArea;
  cols: number;
  highlight: string;
  title: string;
  er: ExchangeRateResult;
}

export default function SingleAreaChart(props: SingleAreaChartProps) {
  const [randomChartId] = useState((Math.random() * 10000).toFixed(0)),
    [chartElm, setChartElm] = useState<ApexCharts>();

  const renderChart = (seriesInput: ChartSeries[], props: SingleAreaChartProps) => {
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

    if (chartElm && chartElm.destroy) chartElm.destroy();
    const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
    chart.render();
    setChartElm(chart);
  };

  // Apply exchange rate if needed
  const rsToday = applyExchangeRate(props.area?.dataToday || [], props.er, props.currency),
    rsTomorrow = applyExchangeRate(props.area?.dataTomorrow || [], props.er, props.currency);

  useEffect(() => {
    if (rsToday && rsTomorrow) {
      renderChart([
        { name: locale_kit.t("common.chart.today",{ lang: props.lang }), data: rsToday },
        { name: locale_kit.t("common.chart.tomorrow",{ lang: props.lang }), data: rsTomorrow },
      ], props);
    } else if (rsToday) {
      renderChart([
        { name: locale_kit.t("common.chart.today",{ lang: props.lang }), data: rsToday },
      ], props);
    }
  }, [props.priceFactor, props.currency]);

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
