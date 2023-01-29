import { useEffect } from "preact/hooks";
import { tableChartOptions } from "config/charts/table.js";
import { applyExchangeRate, avgPrice, maxPrice, minPrice, processPrice } from "utils/price.ts";
import { SpotApiRow } from "backend/db/index.ts";
import { FilterProps } from "components/FilteredTable.tsx";

interface TableProps extends FilterProps {
  resultSet: SpotApiRow[];
  permalink: string;
  permalinkJson: string;
}

export default function Table(props: TableProps) {
  const randomChartId = (Math.random() * 10000).toFixed(0);
  const renderChart = (result: SpotApiRow[]) => {
    if (result.length > 24 * 30) return;
    const chartOptions = { ...tableChartOptions },
      chartSeries = [];
    chartSeries.push({
      data: result.flatMap(({ time, price }) => {
        if (price !== null) return [[time, processPrice(price, props)]];
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
    const convertedResultSet = applyExchangeRate(props.resultSet,props.er,props.currency);
    renderChart(props.resultSet);
  });
  return (
    <div class="content">
      <div class="container">
        <div class="row">
          <div class="col-md m-0 p-0">
            <div class="mw-full m-0 p-0 mr-20 mt-20">
              <div class="card p-0 m-0">
                <div class={"px-card py-10 m-0 rounded-top"}>
                  <h2 class="card-title font-size-18 m-0 text-center">
                    <span>Result</span>
                  </h2>
                </div>
                <div class="content px-card m-0 p-0 bg-very-dark">          
                  <div class="row">
                    <div class="col-md-8" id={"chart_" + randomChartId}></div>
                    <div class="col-sm-4">
                      <table>
                        <tr>
                          <td class="font-size-18">Average</td>
                          <td class="font-size-24">{processPrice(avgPrice(props.resultSet), props)} {props.currency}</td>
                        </tr>
                        <tr>
                          <td class="font-size-18">Minimum</td>
                          <td class="font-size-24">{processPrice(minPrice(props.resultSet), props)} {props.currency}</td>
                        </tr>
                        <tr>
                          <td class="font-size-18">Maximum</td>
                          <td class="font-size-24">{processPrice(maxPrice(props.resultSet), props)} {props.currency}</td>
                        </tr>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="col-sm">
            <div class="mb-10 text-right">
              {props.permalink && <a href={props.permalink}>Permalink 🔗</a>}
              <span>|</span>
              {props.permalinkJson && <a href={props.permalinkJson}>Json-data 🔗</a>}
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Date/Time</th>
                  <th scope="col">Price</th>
                  <th scope="col">Min</th>
                  <th scope="col">Max</th>
                  <th scope="col">Unit</th>
                </tr>
              </thead>
              <tbody>
                {props.resultSet.length < 24 * 30 && props.resultSet.map((e) => {
                  return (
                    <tr>
                      <td>{new Date(e.time).toLocaleString()}</td>
                      <td>{processPrice(e.price, props)}</td>
                      <td>{e.min ? processPrice(e.min, props) : "-"}</td>
                      <td>{e.max ? processPrice(e.max, props) : "-"}</td>
                      <td>{props.currency}/kWh</td>
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
