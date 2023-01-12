import { applyExchangeRate, avgPrice, maxPrice, minPrice, nowPrice, processPrice } from "utils/price.ts";
import { CommonProps } from "utils/common.ts";
import { DataCountry } from "config/countries.ts";
import GenerationShort from "./GenerationShort.tsx";
import { ExchangeRateResult } from "backend/db/index.ts";

interface CountryViewProps extends CommonProps {
  cols: number;
  highlight: string;
  detailed?: boolean;
  title: string;
  countryObj: DataCountry;
  er: ExchangeRateResult;
}

export default function SingleCountryOverview(props: CountryViewProps) {

  // Apply exchange rate if needed
  const rsToday = applyExchangeRate(props.countryObj?.dataToday || [], props.er, props.currency);
  const rsTomorrow = applyExchangeRate(props.countryObj?.dataTomorrow || [], props.er, props.currency);
  const rsMonth = props.countryObj?.dataMonth ? applyExchangeRate(props.countryObj?.dataMonth, props.er, props.currency) : undefined;
  const rsPrevMonth = props.countryObj?.dataPrevMonth ? applyExchangeRate(props.countryObj?.dataPrevMonth, props.er, props.currency) : undefined;

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-5 mt-5">
        <div class="card p-0 m-0">
          <div class={"px-card py-10 m-0 rounded-top bg-" + props.highlight}>
            <h2 class="card-title font-size-18 m-0 text-center">
              {props.title}
            </h2>
          </div>
          <div class="content px-card m-0 pt-0 pb-15 bg-very-dark text-center">
                <div class="pt-10 mb-0 pb-0 price-display-48">{processPrice(nowPrice(rsToday), props)}</div>
                <div class="mt-0 pt-0">
                  {props.currency}/{props.unit} <span data-t-key="common.overview.right_now" lang={props.lang}>right now</span>
                </div>
          </div>
          <div class="content px-card m-0 pt-0 pb-15 bg-dark text-center">
              <div class="pt-10 mb-0 pb-0 price-display-48">{processPrice(avgPrice(rsToday), props)}</div>
              <div class="mt-0 pt-0">
                {props.currency}/{props.unit} <span data-t-key="common.chart.today" lang={props.lang}>right now</span>
              </div>
          </div>
          <GenerationShort generation={props.countryObj.generation} load={props.countryObj.load} {...props}></GenerationShort>
          <div class="content px-card m-0 p-5 pr-10 bg-dark text-right">
            <a href={"/" + props.countryObj?.id} class={"link-" + props.highlight}>
              <span data-t-key="common.overview.more_about" lang={props.lang}>More about</span> {props.countryObj?.name} &gt;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
