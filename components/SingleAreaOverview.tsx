import { useEffect, useState } from "preact/hooks";
import { ExrateApiParsedResult } from "../routes/api/exrate.ts";
import { EntsoeApiParsedResult } from "../routes/api/entsoe.ts";
import { applyExchangeRate, avgPrice, getExchangeRates, maxPrice, minPrice, nowPrice, processPrice } from "../utils/price.ts";
import { formatHhMm, generateUrl, monthName } from "../utils/common.ts";

interface AreaViewProps {
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
  detailed?: boolean;
  dateT: string;
  title: string;
  priceFactor: boolean;
  country: string;
  areaName?: string;
  lang: string;
}

interface ChartSeries {
  name: string;
  data: EntsoeApiParsedResult;
}

export default function SingleAreaOverview(props: AreaViewProps) {
  const [rsToday, setRSToday] = useState<EntsoeApiParsedResult>(),
    [rsTomorrow, setRSTomorrow] = useState<EntsoeApiParsedResult>(),
    [rsMonth, setRSMonth] = useState<EntsoeApiParsedResult>(),
    [rsPrevMonth, setRSPrevMonth] = useState<EntsoeApiParsedResult>(),
    [rsER, setRSER] = useState<ExrateApiParsedResult>();

  const getDataOne = async (date: string) => {
    const startDate = new Date(Date.parse(date)),
      endDate = new Date(Date.parse(date));
    endDate.setHours(23);
    const response = await fetch(generateUrl(props.areaId, startDate, endDate));
    return await response.json();
  };

  const getDataMonth = async (date: string) => {
    const startDate = new Date(Date.parse(date)),
      endDate = new Date(Date.parse(date));
    startDate.setDate(1);
    endDate.setHours(23);

    const response = await fetch(generateUrl(props.areaId, startDate, endDate));
    return await response.json();
  };

  const getDataPrevMonth = async (date: string) => {
    const startDate = new Date(Date.parse(date));
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);
    const endDate = new Date(Date.parse(date));
    endDate.setDate(0);
    endDate.setHours(23);
    const response = await fetch(generateUrl(props.areaId, startDate, endDate));
    return await response.json();
  };

  const tryGetData = async () => {
    let dataToday = await getDataOne(props.date),
      dataTomorrow = await getDataOne(props.dateT),
      dataMonth,
      dataPrevMonth;

    const dataER = await getExchangeRates();

    if (props.detailed) {
      dataMonth = await getDataMonth(props.date);
      dataPrevMonth = await getDataPrevMonth(props.date);
    }

    // Apply exchange rate if needed
    dataToday = applyExchangeRate(dataToday, dataER, props.currency);
    dataTomorrow = applyExchangeRate(dataTomorrow, dataER, props.currency);
    if (dataMonth) dataMonth = applyExchangeRate(dataMonth, dataER, props.currency);
    if (dataPrevMonth) dataPrevMonth = applyExchangeRate(dataPrevMonth, dataER, props.currency);

    // Set preact states
    setRSToday(dataToday);
    setRSTomorrow(dataTomorrow);
    if (dataMonth) setRSMonth(dataMonth);
    if (dataPrevMonth) setRSPrevMonth(dataPrevMonth);
    setRSER(dataER);
  };

  useEffect(() => {
    tryGetData();
  }, []);

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class={"px-card py-10 m-0 rounded-top bg-" + props.highlight}>
            <h2 class="card-title font-size-18 m-0 text-center">
              {props.title}
            </h2>
          </div>
          <div class="content px-card m-0 pt-0 pb-15 bg-very-dark text-center">
            <div class="font-size-64 pt-10 mb-0 pb-0 price-display">{processPrice(nowPrice(rsToday), props)}</div>
            <div class="mt-0 pt-0">
              {props.currency}/{props.unit} <span data-t-key="common.overview.right_now" lang={props.lang}>right now</span>
            </div>
          </div>
          <div class="content px-card m-0 pt-10 pb-20">
            <div class="row">
              <div class="col-7">
                <h5 class="mb-0" data-t-key="common.overview.average_today" lang={props.lang}>Average today</h5>
                <div class="mt-5 mb-5">
                  <span class="font-size-24">{processPrice(avgPrice(rsToday), props)}</span>
                  <span>{props.currency}/{props.unit}</span>
                </div>
                <span>
                  <span data-t-key="common.overview.span" lang={props.lang}>Span:</span> {processPrice(minPrice(rsToday), props)} -{" "}
                  {processPrice(maxPrice(rsToday), props)}
                </span>
              </div>
              <div class="col-5 text-right">
                <h5 class="mb-0" data-t-key="common.overview.average_tomorrow" lang={props.lang}>tomorrow</h5>
                <div class="mt-5 mb-5">
                  <span class="font-size-24">{processPrice(avgPrice(rsTomorrow), props)}</span>
                </div>
                <span>{processPrice(minPrice(rsTomorrow), props)} - {processPrice(maxPrice(rsTomorrow), props)}</span>
              </div>
            </div>
            {props.detailed && (
              <div>
                <div class="row mt-15">
                  <div class="col-7">
                    <h5 class="mb-0">
                      <span data-t-key="common.overview.so_far">So far in</span>&nbsp;{rsMonth?.data[0]?.startTime
                        ? monthName(new Date(Date.parse(rsMonth.data[0].startTime)))
                        : ""}
                    </h5>
                    <div class="mt-5 mb-5">
                      <span class="font-size-24">{processPrice(avgPrice(rsMonth), props)}</span>
                      <span>{props.currency}/{props.unit}</span>
                    </div>
                    <span>Spann: {processPrice(minPrice(rsMonth), props)} - {processPrice(maxPrice(rsMonth), props)}</span>
                  </div>
                  <div class="col-5 text-right">
                    <h5 class="mb-0">{monthName(new Date(Date.parse(rsPrevMonth?.data[0]?.startTime)))}</h5>
                    <div class="mt-5 mb-5">
                      <span class="font-size-24">{processPrice(avgPrice(rsPrevMonth), props)}</span>
                    </div>
                    <span>{processPrice(minPrice(rsPrevMonth), props)} - {processPrice(maxPrice(rsPrevMonth), props)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!props.detailed && (
            <div class="content px-card m-0 p-5 pr-10 bg-very-dark text-right">
              <a href={"/" + props.country + "/" + props.areaName} class={"link-" + props.highlight}>
                <span data-t-key="common.overview.more_about" lang={props.lang}>More about</span> {props.areaName} &gt;
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
