import { useEffect, useState } from "preact/hooks";
import { applyExchangeRate, maxPrice, minPrice, processPrice } from "utils/price.ts";
import { CommonProps, dateText, formatHhMm, generateUrl, processResultSet } from "utils/common.ts";
import { SpotApiParsedRow, SpotApiRow } from "../backend/db/index.ts";

interface AreaTableProps extends CommonProps {
  cols: number;
  date: string;
}

export default function SingleAreaTable(props: AreaTableProps) {
  const [rsToday, setRSToday] = useState<SpotApiParsedRow[]>(),
    [dayHigh, setDayHigh] = useState<number | null>(-Infinity),
    [dayMid, setDayMid] = useState<number | null>(-Infinity),
    [dayLow, setDayLow] = useState<number | null>(Infinity);

  const getData = async (date: string) => {
    if (!props.area?.name) return [];
    const startDate = new Date(Date.parse(date)),
      endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 1));
    const response = await fetch(generateUrl(props.area.name, startDate, endDate));
    const responseJson = await response.json();
    return processResultSet(responseJson.data);
  };

  const tryGetData = async () => {
    // Apply exchange rate if needed
    const dataToday: SpotApiParsedRow[] = applyExchangeRate(await getData(props.date), props.er, props.currency) || [];

    // Filter on upcoming 
    dataToday.filter((e) => new Date(e.time.getTime() + 3600 * 1000) < new Date()); 

    // Make copy of data set, filter and sort
    dataToday.sort((a, b) => b.price - a.price);

    const topThreeThreshold = dataToday[Math.min(dataToday.length, 2)]?.price,
      topSixThreshold = dataToday[Math.min(dataToday.length, 5)]?.price,
      bottomSixThreshold = dataToday[Math.max(dataToday.length - 5, 0)]?.price;

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
                {rsToday?.map((e, i) => {
                  const startDate = e.time,
                    endDate = new Date(e.time.getTime() + 3600 * 1000);
                  let classSuffix = "default";
                  if (dayLow !== null && dayLow >= e.price) classSuffix = "success";
                  else if (dayHigh !== null && dayHigh <= e.price) classSuffix = "danger";
                  else if (dayMid !== null && dayMid <= e.price) classSuffix = "secondary";
                  else return;
                  return (
                    <tr>
                      <td class="p-0 extra-pad" data-t-key={"common.chart." + dateText(startDate)} lang={props.lang}>
                        {dateText(startDate)}
                      </td>
                      <td class="p-0 extra-pad">
                        {formatHhMm(startDate)} - {formatHhMm(endDate)}
                      </td>
                      <td class={"text-right p-0 extra-pad text-" + classSuffix}>
                        {processPrice(e.price, props)} {props.currency}/{props.unit}
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
