import { CommonProps} from "utils/common.ts";
import { Country } from "config/countries.ts";

import { DBResultSet, ExchangeRateResult } from "backend/db/index.ts";

interface ProductionOverviewProps extends CommonProps {
  cols: number;
  country: Country;
  er: ExchangeRateResult;
  generation: DBResultSet;
  load: DBResultSet;
}

interface LastGenerationEntry {
  date: Date,
  value: number,
  noPsrs: number
}

export default function ProductionOverview(props: ProductionOverviewProps) {

  // Find last value for each production type
  const 
    lastGeneration : Record<string, LastGenerationEntry> = {},
    fromDate = new Date();
  
    fromDate.setHours(fromDate.getHours() - 4, 0, 0, 0);

  let lastGenerationDate = 0;
  
  for(let i = 0; i < props.generation.data.length; i++) {
    const 
      currentGeneration = props.generation.data[i],
      dateMs = Number(currentGeneration[0]),
      psr = currentGeneration[1] as string + "_" + (currentGeneration[3] || 0).toString(),
      value = currentGeneration[2] as number,
      noPsrs = currentGeneration[4] as number;
      
    // Only use data within four hours, or last row
    if (dateMs < new Date().getTime()-3600*1000*12) continue;

    // Update date
    if (!lastGenerationDate || lastGenerationDate < dateMs) lastGenerationDate = dateMs;
    // Update object
    if (!lastGeneration[psr] || (lastGeneration[psr].date.getTime() < dateMs && lastGeneration[psr].noPsrs <= noPsrs)) {
      lastGeneration[psr] = {
        date: new Date(dateMs),
        value,
        noPsrs
      }
    }
  }

  const 
    lastGenerationSorted = Object.entries(lastGeneration);
  lastGenerationSorted.sort((a,b) => b[1].value - a[1].value);

  const 
    generationTotal = Object.values(lastGeneration).reduce((a, b) => {
      return a + b.value;
    },0),
    lastGenerationDateEnd = props.generation?.data.length ? new Date(lastGenerationDate + (props.country.interval == "PT60M" ? 3600 : 900 ) * 1000) : undefined;

  // Find load at matching point of time
  let loadTotal = 0;
  for(const loadEntry of props.load.data) {
    if (Number(loadEntry[0]) === lastGenerationDate) {
      loadTotal = Number(loadEntry[1]);
    }
  }

  // If load at matching point of time wasn't found, use last load
  if (!loadTotal && props.load?.data?.length) loadTotal = props.load.data[props.load.data.length-1][1] as number;

  // Calculate total
  const netTotal = generationTotal - loadTotal;

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class={"px-card py-10 m-0 rounded-top"}>
            <h2 class="card-title font-size-18 m-0 text-center">
              <span data-t-key="common.generation.current_production" lang={props.lang}>Aktuell produktion och last</span>
            </h2>
          </div>
          <div class="content px-card m-0 p-0 pb-15 bg-very-dark">
            <div>
              <table class="table">
                <tbody>
                  <tr><th data-t-key="common.generation.production" lang={props.lang}>Produktion</th><th>{ generationTotal } MW</th></tr>
                  { lastGenerationSorted.map(g => g[1].value !== 0 && (
                    <>
                      <tr><td><span data-t-key={"common.generation.psr_"+g[0].toLowerCase().replace(/[^a-zA-Z0-9]/g,"_")} lang={props.lang}>{ g[0] }</span> - {(g[1].value/generationTotal*100).toFixed(1)} %</td><td>{ g[1].value } MW</td></tr>
                    </>
                  ))}
                  <tr><th data-t-key="common.generation.consumption" lang={props.lang}>Förbrukning</th><th>{ loadTotal } MW</th></tr>
                  <tr class={"table-"+ (netTotal < 0 ? "danger" : "success")}><th data-t-key={"common.generation."+(netTotal < 0 ? "deficit" : "excess")} lang={props.lang}>{ netTotal < 0 ? "Underskott" : "Överskott" }</th><th>{ netTotal } MW</th></tr>
                </tbody>
              </table>
              <p class="text-right mb-0 mr-15"><small><i><span data-t-key="common.generation.last_updated" lang={props.lang}>Senast uppdaterat</span>: { lastGenerationDateEnd?.toLocaleString() }</i></small></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
