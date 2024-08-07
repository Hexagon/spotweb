import { applyExchangeRate, avgPrice, maxPrice, minPrice, nowPrice, processPrice } from "utils/price.ts";
import { CommonProps } from "utils/common.ts";
import { Country, DataArea } from "config/countries.ts";
import { ExchangeRateResult } from "backend/db/index.ts";

interface AreaViewProps extends CommonProps {
  cols: number;
  highlight: string;
  detailed?: boolean;
  title: string;
  area: DataArea;
  country: Country;
  er: ExchangeRateResult;
}

export default function SingleAreaOverview(props: AreaViewProps) {

  // Apply exchange rate if needed
  const rsToday = applyExchangeRate(props.area?.dataToday || [], props.er, props.currency);
  const rsTomorrow = applyExchangeRate(props.area?.dataTomorrow || [], props.er, props.currency);
  const rsMonth = props.area?.dataMonth ? applyExchangeRate(props.area?.dataMonth, props.er, props.currency) : undefined;
  const rsPrevMonth = props.area?.dataPrevMonth ? applyExchangeRate(props.area?.dataPrevMonth, props.er, props.currency) : undefined;

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
              {props.currency}/kWh <span data-t-key="common.overview.right_now" lang={props.lang}>right now</span>
            </div>
          </div>
          <div class="content px-card m-0 p-10 pt-10 pb-20">
            <div class="row">
              <div class="col-7">
                <h5 class="mb-0" data-t-key="common.overview.average_today" lang={props.lang}>Average today</h5>
                <div class="mt-5 mb-5">
                  <span class="font-size-24">{processPrice(avgPrice(rsToday), props)}</span>
                  <span>{props.currency}/kWh</span>
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
                      <span data-t-key="common.overview.so_far" lang={props.lang}>So far in</span>
                      &nbsp;
                      { rsMonth && rsMonth[0]?.time && (
                        <span data-t-key={"common.months_short."+new Date(rsMonth[0].time).getMonth()} lang={props.lang}>-</span>
                      )}
                    </h5>
                    <div class="mt-5 mb-5">
                      <span class="font-size-24">{processPrice(avgPrice(rsMonth), props)}</span>
                      <span>{props.currency}/kWh</span>
                    </div>
                    <span><span data-t-key="common.overview.span" lang={props.lang}>Span:</span> {processPrice(minPrice(rsMonth), props)} - {processPrice(maxPrice(rsMonth), props)}</span>
                  </div>
                  <div class="col-5 text-right">
                    <h5 class="mb-0">
                    { rsPrevMonth && rsPrevMonth[0]?.time && (
                      <span data-t-key={"common.months_short."+new Date(rsPrevMonth[0]?.time).getMonth()} lang={props.lang}>-</span>
                    )}
                    </h5>
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
              <a href={"/" + props.country?.id + "/" + props.area?.name} class={"link-" + props.highlight}>
                <span data-t-key="common.overview.more_about" lang={props.lang}>More about</span> {props.area?.name} &gt;
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
