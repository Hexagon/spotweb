import { useEffect } from "preact/hooks";
import { EntsoeApiParsedResult } from "routes/api/entsoe.ts";
import { tableChartOptions } from "config/charts/table.js";
import { avgPrice, maxPrice, minPrice, processPrice } from "utils/price.ts";

interface TableProps {
  unit: string;
  extra: number;
  factor: number;
  decimals: number;
  currency: string;
  resultSet: EntsoeApiParsedResult;
  permalink: string;
  permalinkJson: string;
  priceFactor: boolean;
}

export default function Table(props: TableProps) {
  const randomChartId = (Math.random() * 10000).toFixed(0);

  const renderChart = (result: EntsoeApiParsedResult) => {
    if (result.length > 24 * 30) return;
    const chartOptions = { ...tableChartOptions },
      chartSeries = [];
    console.log(result);
    chartSeries.push({
      data: result.flatMap(({ time, price, unit }) => {
        if (price !== null) return [[new Date(Date.parse(time)).getTime(), processPrice(price, props, unit)]];
        return [];
      }),
      name: "",
    });
    // deno-lint-ignore no-explicit-any
    (chartOptions as any).series = chartSeries;
    const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
    chart.render();
  };

  useEffect(() => {
    renderChart(props.resultSet);
  });

  return (
    <div class="content">
      <div class="container">
        <div class="row">
          <div class="col-sm">
            <div class="mb-10 text-right">
              {props.permalink && <a href={props.permalink}>Permalink 🔗</a>}
              <span>|</span>
              {props.permalinkJson && <a href={props.permalinkJson}>Json-data 🔗</a>}
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm" id={"chart_" + randomChartId}></div>
        </div>
        <div class="row">
          <div class="col-sm">
            <div class="alert" role="alert">
              <h4 class="alert-heading">Period max</h4>
              <h2>
                {processPrice(maxPrice(props.resultSet), props)} {props.currency}
              </h2>
            </div>
          </div>
          <div class="col-sm">
            <div class="alert" role="alert">
              <h4 class="alert-heading">Period min</h4>
              <h2>{processPrice(minPrice(props.resultSet), props)} {props.currency}</h2>
            </div>
          </div>
          <div class="col-sm">
            <div class="alert" role="alert">
              <h4 class="alert-heading">Period average</h4>
              <h2>
                {processPrice(avgPrice(props.resultSet), props)} {props.currency}
              </h2>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Start Date</th>
                  <th scope="col">Area</th>
                  <th scope="col">Spot price</th>
                  <th scope="col">Unit</th>
                </tr>
              </thead>
              <tbody>
                {props.resultSet.length < 24 * 30 && props.resultSet.map((e) => {
                  const price = processPrice(e.price, props, e.unit);
                  return (
                    <tr>
                      <td>{new Date(Date.parse(e.time)).toLocaleString()}</td>
                      <td>{e.areaCode}</td>
                      <td>{price}</td>
                      <td>{props.currency}/{props.unit}</td>
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
