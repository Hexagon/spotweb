import { CommonProps } from "utils/common.ts";
import { countries } from "config/countries.ts";
import { DBResultSet, ExchangeRateResult } from "../backend/db/index.ts";
import { applyExchangeRateSingle, processPrice } from "utils/price.ts";

interface ProductionByCountryProps extends CommonProps {
  cols: number;
  currentGenerationAndLoad: DBResultSet;
  pricePerCountry: DBResultSet;
  pricePerArea: DBResultSet;
  er: ExchangeRateResult;
}

export default function ProductionByCountry(props: ProductionByCountryProps) {
  const GetPriceRowCountry = (country: string, interval: string) : number | undefined => {
    const found = props.pricePerCountry.data.find((e: unknown[]) => e[0] === country && e[2] === interval);
    return found ? found[3] as number : undefined;
  };
  const GetPriceRowArea = (area: string, interval: string) => {
    const found = props.pricePerArea.data.find((e: unknown[]) => e[0] === area && e[2] === interval);
    return found ? found[3] as number : undefined;
  };
  const GenLoadRow = (area: string) => {
    if (props.currentGenerationAndLoad && props.currentGenerationAndLoad.data.length) {
      const res = props.currentGenerationAndLoad.data.find((a : Array<unknown>) => a[0] === area);
      if (res) {
        return {
          area: res[0],
          period: res[1],
          interval: res[2],
          primary_psr_group: res[3],
          primary_psr_group_generation: res[4],
          generation_total: res[5],
          load_total: res[6],
          net_generation: res[7]
        };
      }
    }
    return undefined;
  };
  const countryElms = [];
  for(const country of countries) {
    const 
      res = GenLoadRow(country.cty),
      resPrice = GetPriceRowCountry(country.id,country.interval);
    countryElms.push((
      <tr class="font-size-18 bg-dark">
        <td><a class="hyperlink text-white" href={"/"+country.id}><span  data-t-key={"common.countries."+country.id} lang={props.lang}>{country.name}</span></a></td>
        <td>{processPrice(applyExchangeRateSingle(resPrice as number,props.er,props.currency),props)}</td>
        <td>{res?.generation_total}</td>
        <td>{res?.load_total}</td>
        <td><span class={"text-"+ ((res?.net_generation && res.net_generation < 0) ? "danger" : "success")}>{res?.net_generation}</span></td>
        <td>
            { res?.primary_psr_group && (
              <>
                <span data-t-key={"common.generation.psr_"+res?.primary_psr_group}></span><span> ({Math.round((res?.primary_psr_group_generation as number)/(res?.generation_total as number)*100)}%)</span>
              </>
            )}
        </td>
      </tr>
    ));
    if (country.areas && country.areas.length > 1) for(const area of country.areas) {
      const 
        res = GenLoadRow(area.id),
        resArea = GetPriceRowArea(area.name,country.interval);
      countryElms.push((
        <tr class="pl-20 font-size-14 bg-very-dark">
          <td><a class="hyperlink text-white" href={"/"+country.id+"/"+area.name}>{area.name} - {area.long}</a></td>
          <td>{processPrice(applyExchangeRateSingle(resArea as number,props.er,props.currency),props)}</td>
          <td>{res?.generation_total}</td>
          <td>{res?.load_total}</td>
          <td><span class={"text-"+ ((res?.net_generation && res.net_generation < 0) ? "danger" : "success")}>{res?.net_generation}</span></td>
          <td>
            { res?.primary_psr_group && (
              <>
                <span data-t-key={"common.generation.psr_"+res?.primary_psr_group}></span><span> ({Math.round((res?.primary_psr_group_generation as number)/(res?.generation_total as number)*100)}%)</span>
              </>
            )}
          </td>            
        </tr>
      ));
    }
  }

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class="content px-card m-0 p-0 pb-15">
            <div>
              <table class="table">
                <thead>
                  <tr class="bg-very-dark">
                    <th></th>
                    <th><span data-t-key="common.overview.right_now" lang={props.lang}>Just nu</span><br></br><small>{props.currency}/kWh</small></th>
                    <th><span data-t-key="common.generation.production" lang={props.lang}>Produktion</span><br></br><small>MW</small></th>
                    <th><span data-t-key="common.generation.consumption" lang={props.lang}>Förbrukning</span><br></br><small>MW</small></th>
                    <th><span data-t-key="common.generation.excess" lang={props.lang}></span></th>
                    <th data-t-key="common.generation.primary_source" lang={props.lang}>Huvudsaklig kraftkälla</th>
                  </tr>
                </thead>
                <tbody>
                  { countryElms }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
