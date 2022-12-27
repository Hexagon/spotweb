import { useEffect, useState } from "preact/hooks";
import { ExrateApiParsedResult } from "../routes/api/exrate.ts";
import { EntsoeApiParsedResult, EntsoeApiParsedRow } from "../routes/api/entsoe.ts";
import { applyExchangeRate, getExchangeRates, maxPrice, minPrice, processPrice } from "../utils/price.ts";
import { dateText, formatHhMm, generateUrl } from "../utils/common.ts";

interface AreaTableProps {
  unit: string;
  extra: number;
  factor: number;
  area: string;
  areaId: string;
  cols: number;
  currency: string;
  decimals: number;
  date: string;
  priceFactor: boolean;
  lang: string;
  er: ExrateApiParsedResult;
}

interface ChartSeries {
  name: string;
  data: EntsoeApiParsedResult;
}

export default function SingleAreaTable(props: AreaTableProps) {
  const 
    [rsToday, setRSToday] = useState<EntsoeApiParsedResult>(),
    [dayHigh, setDayHigh] = useState<number | null>(-Infinity),
    [dayMid, setDayMid] = useState<number | null>(-Infinity),
    [dayLow, setDayLow] = useState<number | null>(Infinity);

  const getData = async (date: string) => {
    const startDate = new Date(Date.parse(date)),
      endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 1));
    endDate.setHours(23);
    const response = await fetch(generateUrl(props.areaId, startDate, endDate, true));
    return await response.json();
  };

  const tryGetData = async () => {
    let dataToday: EntsoeApiParsedResult = await getData(props.date);

    // Apply exchange rate if needed¨
    dataToday = applyExchangeRate(dataToday, props.er, props.currency);

    // Filter data set
    dataToday.data = dataToday.data.filter((e) => new Date(Date.parse(e.startTime)) >= new Date(new Date().getTime() - 3600 * 1000));

    // Make copy of data set, filter and sort
    const sortedDataToday: EntsoeApiParsedRow[] = [...dataToday.data];
    sortedDataToday.sort((a, b) => b.spotPrice - a.spotPrice);

    const topThreeThreshold = sortedDataToday[Math.min(sortedDataToday.length, 2)].spotPrice,
      topSixThreshold = sortedDataToday[Math.min(sortedDataToday.length, 5)].spotPrice,
      bottomSixThreshold = sortedDataToday[Math.max(sortedDataToday.length - 5, 0)].spotPrice;

    // Store day min/max
    const dayMaxVal = maxPrice(dataToday),
      dayMinVal = minPrice(dataToday);
    if (dayMaxVal !== null && dayMinVal !== null) {
      setDayHigh(topThreeThreshold);
      setDayMid(topSixThreshold);
      setDayLow(bottomSixThreshold);
    }

    // Set preact states
    setRSToday(dataToday);
  };

  useEffect(() => {
    tryGetData();
  }, []);

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class="px-card py-10 m-0 rounded-top bg">
            <h2 class="card-title font-size-18 m-0 text-center" data-t-key="common.chart.outstanding_hours" lang={props.lang}>
              Outstanding hours
            </h2>
          </div>
          <div class="content px-card m-0 p-0 bg-very-dark text-center chart">
            <table class="table table-striped font-size-12">
              <tbody>
                {rsToday?.data.map((e, i) => {
                  const startDate = new Date(Date.parse(e.startTime)),
                    endDate = new Date(Date.parse(e.endTime));
                  let classSuffix = "default";
                  if (dayLow !== null && dayLow >= e.spotPrice) classSuffix = "success";
                  else if (dayHigh !== null && dayHigh <= e.spotPrice) classSuffix = "danger";
                  else if (dayMid !== null && dayMid <= e.spotPrice) classSuffix = "secondary";
                  else return;
                  if (endDate < new Date()) return;
                  return (
                    <tr>
                      <td class="p-0 extra-pad" data-t-key={"common.chart." + dateText(startDate)} lang={props.lang}>
                        {dateText(startDate)}
                      </td>
                      <td class="p-0 extra-pad">
                        {formatHhMm(startDate)} - {formatHhMm(endDate)}
                      </td>
                      <td class={"text-right p-0 extra-pad text-" + classSuffix}>
                        {processPrice(e.spotPrice, props)} {props.currency}/{props.unit}
                      </td>
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
