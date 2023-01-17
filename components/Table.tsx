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
                  <th scope="col">Date/Time</th>
                  <th scope="col">Area</th>
                  <th scope="col">Spot price</th>
                  <th scope="col">Unit</th>
                </tr>
              </thead>
              <tbody>
                {props.resultSet.length < 24 * 30 && props.resultSet.map((e) => {
                  return (
                    <tr>
                      <td>{new Date(e.time).toLocaleString()}</td>
                      <td>{processPrice(e.price, props, "kWh")}</td>
                      <td>{e.min ? processPrice(e.min, props, "kWh") : "-"}</td>
                      <td>{e.max ? processPrice(e.max, props, "kWh") : "-"}</td>
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
