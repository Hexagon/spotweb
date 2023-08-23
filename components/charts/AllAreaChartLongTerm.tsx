import { useEffect, useState } from "preact/hooks";
import { historyChartOptions } from "config/charts/historyview.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { ChartSeries, CommonProps, generateUrl } from "utils/common.ts";
import { ExchangeRateResult, SpotApiRow } from "backend/db/index.ts";
import { Country, DataArea } from "config/countries.ts";

interface AllAreaLongTermChartProps extends CommonProps {
  areas: DataArea[];
  country: Country;
  er: ExchangeRateResult;
}

export default function AllAreaChartLongTerm(props: AllAreaLongTermChartProps) {

  const 
    [chartElm, setChartElm] = useState<ApexCharts>(),
    [randomChartId] = useState((Math.random() * 10000).toFixed(0)),
    [dataSets, setDataSets] = useState<Map<string, SpotApiRow[]>>(new Map());

  const renderChart = async (props: AllAreaLongTermChartProps) => {
  
    const results: Map<string, SpotApiRow[]> = new Map();
    const seriesInput: ChartSeries[] = [];
    for (const area of props.areas) {
      let dataSet = await getDataLongTerm(area.name);
      dataSet = applyExchangeRate(dataSet, props.er, props.currency);
      if (dataSet) seriesInput.push({ name: area.name, data: dataSet });
      if (dataSet) results.set(area.name, dataSet);
    }
    setDataSets(results);
    
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
    const response = await fetch(generateUrl(area, startDate, endDate, props.country.interval || "PT60M", "monthly"));
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
              <h2 class="card-title font-size-18 m-0 text-center">
                  <span data-t-key={"common.longtermchart.title"} lang={props.lang}></span>
                  <span>{props.country.name}</span>
              </h2>
            </h2>
          </div>
          <div class="content px-card m-0 p-0 bg-very-dark">
            <div class="col-lg" id={"chart_" + randomChartId}></div>
          </div>
          <div class="content px-card m-0 p-10 bg-very-dark">
            <p>
                <span data-t-key={"common.longtermchart.countryDescriptionPart1"} lang={props.lang}></span>
                <span>{ props.country.name }</span>
                <span data-t-key={"common.longtermchart.countryDescriptionPart2"} lang={props.lang}></span>
            </p>
            {props.priceFactor && (
              <>
                <p>
                  <span data-t-key={"common.longtermchart.priceFactorDescriptionPart1"} lang={props.lang}>Elpriset som visas i tabellen baseras på följande formel: ([spotpris] +</span>
                  <span>{props.extra}</span>
                  <span data-t-key={"common.longtermchart.priceFactorDescriptionPart2"} lang={props.lang}>(avgifter)) *</span>
                  <span>{props.factor}</span>
                  <span data-t-key={"common.longtermchart.priceFactorDescriptionPart3"} lang={props.lang}>(moms). Detta är justerat efter dina nuvarande inställningar.</span>
                </p>
              </>
            )}
            {!props.priceFactor && (
              <p data-t-key={"common.longtermchart.nonPpriceFactorDescription"} lang={props.lang}>Elpriset i tabellen representerar det aktuella spotpriset. Tänk på att ytterligare avgifter och moms kan tillkomma. Du kan dock justera detta via inställningarna på sidan.</p>
            )}
          </div>
          <div class="content px-card m-0 p-0">
            <table class="table">
              <thead>
                <tr>
                  <th>Month</th>
                  {props.areas.map(area => <th key={area.name}>{area.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {dataSets.size > 0 && dataSets.get(props.areas[0].name).map(dataPoint => {
                  const dateFromTimestamp = new Date(dataPoint.time);

                  return (
                    <tr key={dataPoint.time}>
                      <td>{dateFromTimestamp.toLocaleString('default', { month: 'long' })} {dateFromTimestamp.getFullYear()}</td>
                      {props.areas.map(area => {
                        const dataSetForArea = dataSets.get(area.name);
                        const dataSetForMonth = dataSetForArea?.find(data => new Date(data.time).getMonth() === dateFromTimestamp.getMonth() && new Date(data.time).getFullYear() === dateFromTimestamp.getFullYear());
                        return (
                          <td key={area.name}>
                            {dataSetForMonth ? processPrice(dataSetForMonth.price, props) : '-'}
                          </td>
                        )
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
