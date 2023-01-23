import { useEffect, useState } from "preact/hooks";
import { productionDetailsTodayChartOptions } from "config/charts/productiondetailstoday.js";
import { CommonProps } from "utils/common.ts";
import { DBResultSet, SpotApiRow } from "backend/db/index.ts";
import { Area, Country } from "config/countries.ts";
import { locale_kit } from "https://deno.land/x/localekit_fresh@0.5.0/mod.ts";

interface ProductionDetailsTodayProps extends CommonProps {
  cols: number;
  country: Country;
  area?: Area;
  generation: DBResultSet;
  load: DBResultSet;
}

export default function ProductionDetailsTodayChart(props: ProductionDetailsTodayProps) {

  const 
  [chartElm, setChartElm] = useState<ApexCharts>(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0));

  const renderChart = (seriesInput: Record<string,unknown>[], props: ProductionDetailsTodayProps) => {

    // Inject series into chart configuration
    const series = [];
    for (const s of seriesInput) {
      series.push(
        {
          data: (s.data as Record<string,unknown>[]).map((e: Record<string,unknown>) => {
            return { x: new Date(e.time as number), y: e.value };
          }),
          name: locale_kit.t("common.generation.psr_"+(s.name as string), {lang: props.lang}),
          type: 'bar'
        },
      );
    }

    // deno-lint-ignore no-explicit-any
    const chartOptions: any = { ...productionDetailsTodayChartOptions };
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
    types: Record<string,unknown[]> = {};
  for(const row of props.generation.data) {
    const key = row[1] + "_" + row[4];
    types[key] = types[key] || [];
    types[key].push({
      time: row[0],
      value: row[2]
    });
  }
  for (const [key, typeData] of Object.entries(types)) {
    dataArr.push({ name: key, data: typeData as SpotApiRow[] });
  }

  useEffect(() => {
    renderChart(dataArr, props);
  }, []);

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class={"px-card py-10 m-0 rounded-top"}>
            <h2 class="card-title font-size-18 m-0 text-center">
              <span data-t-key="common.generation.production" lang={props.lang}>Aktuell produktion och last</span>
              &nbsp;-&nbsp;
              {props.area ? props.area.name : props.country?.name}
              &nbsp;-&nbsp;
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

