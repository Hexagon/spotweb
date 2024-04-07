import { useEffect, useState } from "preact/hooks";
import { areaViewMonthChartOptions } from "config/charts/areaviewmonth.js";
import { applyExchangeRate, processPrice } from "utils/price.ts";
import { CommonProps, generateUrl } from "utils/common.ts";
import { ExchangeRateResult, SpotApiRow } from "backend/db/index.ts";
import { Area, Country } from "config/countries.ts";

interface SingleAreaLongTermChartProps extends CommonProps {
    country: Country;
    area: Area;
    er: ExchangeRateResult;
    cols: number;
}

export default function SingleAreaLongTermChart(props: SingleAreaLongTermChartProps) {
    const 
        [chartElm, setChartElm] = useState<ApexCharts>(),
        [randomChartId] = useState((Math.random() * 10000).toFixed(0)),
        [dataSet, setDataSet] = useState<SpotApiRow[]>([]);

    const getDataLongTerm = async (area: string): Promise<SpotApiRow[]> => {
        const startDate = new Date(Date.parse("2021-01-01")),
              endDate = new Date(new Date().setDate(new Date().getDate() + 1));
        const response = await fetch(generateUrl(area, startDate, endDate, props.country.interval || "PT60M", "monthly"));
        const resultSet = await response.json();
        return resultSet.data;
    };

    const groupByYear = (data: SpotApiRow[]): { [year: number]: { [month: number]: SpotApiRow } } => {
        // deno-lint-ignore no-explicit-any
        return data.reduce((acc: any, curr) => {
            const date = new Date(curr.time);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            if (!acc[year]) acc[year] = {};
            acc[year][month] = curr;
            return acc;
        }, {});
    };

    const renderChart = async (props: SingleAreaLongTermChartProps) => {
        let data = await getDataLongTerm(props.area.name);
        data = applyExchangeRate(data, props.er, props.currency);
        setDataSet(data);

        const series = [{
            data: data.map(e => ({ x: e.time, y: processPrice(e.price, props) })),
            name: props.area.name
        }];

        // deno-lint-ignore no-explicit-any
        const chartOptions: any = { ...areaViewMonthChartOptions };
        chartOptions.series = series;

        if (chartElm) chartElm.destroy();
        const chart = new ApexCharts(document.querySelector("#chart_" + randomChartId), chartOptions);
        chart.render();
        setChartElm(chart);
    };

    useEffect(() => {
        renderChart(props);
    }, [props.priceFactor]);

    const groupedData = groupByYear(dataSet);
    const years = Object.keys(groupedData).sort();

    return (
        <div class={`col-lg-${props.cols} m-0 p-0`}>
            <div class="mw-full m-0 p-0 mr-20 mt-20">
                <div class="card p-0 m-0">
                    <div class={"px-card py-10 m-0 rounded-top"}>
                        <h2 class="card-title font-size-18 m-0 text-center">
                            <span data-t-key={"common.longtermchart.title"} lang={props.lang}></span>
                            <span>{props.area.name}, {props.country.name}</span>
                        </h2>
                    </div>
                    <div class="content px-card m-0 p-0 bg-very-dark">
                        <div class="col-lg" id={"chart_" + randomChartId}></div>
                    </div>
                    <div class="content px-card m-0 p-10 bg-very-dark">
                        <p>
                            <span data-t-key={"common.longtermchart.areaDescriptionPart1"} lang={props.lang}></span>
                            <span>{props.area.name}</span>
                            <span data-t-key={"common.longtermchart.areaDescriptionIn"} lang={props.lang}></span>
                            <span>{props.country.name}</span>
                            <span data-t-key={"common.longtermchart.areaDescriptionPart2"} lang={props.lang}></span>
                        </p>
                        {props.priceFactor && (
                        <>
                            <p>
                            <span data-t-key={"common.longtermchart.priceFactorDescriptionPart1"} lang={props.lang}>Elpriset som visas i tabellen baseras på följande formel: (([spotpris]*</span>
                            <span>{props.multiplier}</span>
                            <span>) +</span>
                            <span data-t-key={"common.longtermchart.priceFactorDescriptionPart2"} lang={props.lang}>(avgifter)) *</span>
                            <span>{props.factor}</span>
                            <span data-t-key={"common.longtermchart.priceFactorDescriptionPart3"} lang={props.lang}>(moms). Detta är justerat efter dina nuvarande inställningar.</span>
                            </p>
                        </>
                        )}
                        {!props.priceFactor && (
                        <p data-t-key={"common.longtermchart.nonPriceFactorDescription"} lang={props.lang}>Elpriset i tabellen representerar det aktuella spotpriset. Tänk på att ytterligare avgifter och moms kan tillkomma. Du kan dock justera detta via inställningarna på sidan.</p>
                        )}
                    </div>
                    <div class="content px-card m-0 p-0">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    {years.map(year => (
                                        <th>{year}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 12 }, (_, index) => index).map(month => {
                                    const monthName = new Date(2020, month).toLocaleString('default', { month: 'long' });
                                    return (
                                        <tr key={month}>
                                            <td>{monthName}</td>
                                            
                                            {
                                            // deno-lint-ignore no-explicit-any
                                            years.map((year: any) => (
                                                <td>{groupedData[year] && groupedData[year][month] ? processPrice(groupedData[year][month].price, props) : "-"}</td>
                                            ))}
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
