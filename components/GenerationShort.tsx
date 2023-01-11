import { CommonProps} from "utils/common.ts";
import { Country } from "config/countries.ts";
import { PsrMap } from "config/psrmap.ts";

interface GenerationOverviewProps extends CommonProps {
  cols: number;
  country?: Country;
}

interface LastGenerationEntry {
  date: Date,
  value: number
}

export default function GenerationShort(props: GenerationOverviewProps) {

  // Find last value for each production type
  const lastGeneration : Record<string, LastGenerationEntry> = {};
  let lastGenerationDate = 0;
  if (props.generation) for(let i = 0; i < props.generation.data.length; i++) {
    // Only use data within three hours, or last row
    const 
      currentGeneration = props.generation.data[i],
      dateMs = currentGeneration[0] as number,
      psr = currentGeneration[1] as string,
      value = currentGeneration[2] as number;
    // Update date
    if (!lastGenerationDate || lastGenerationDate < dateMs) lastGenerationDate = dateMs;
    // Update object
    if (!lastGeneration[psr] || lastGeneration[psr].date.getTime() < dateMs) {
      lastGeneration[psr] = {
        date: new Date(dateMs),
        value: value
      }
    }
  }

  // Aggregate lastgeneration
  const lastGenerationAggregated : Record<string,LastGenerationEntry> = {};
  for(const lg of Object.entries(lastGeneration)) {
    if (lastGenerationAggregated[PsrMap[lg[0]]]) {
      lastGenerationAggregated[PsrMap[lg[0]]].date = lastGenerationAggregated[PsrMap[lg[0]]].date > lg[1].date ? lastGenerationAggregated[PsrMap[lg[0]]].date : lg[1].date,
      lastGenerationAggregated[PsrMap[lg[0]]].value = lastGenerationAggregated[PsrMap[lg[0]]].value + lg[1].value;
    } else {
      lastGenerationAggregated[PsrMap[lg[0]]] = {
        date: lg[1].date,
        value: lg[1].value
      };
    }
  }

  const 
    lastGenerationSorted = Object.entries(lastGenerationAggregated);
  lastGenerationSorted.sort((a,b) => b[1].value - a[1].value);

  const 
    generationTotal = Object.values(lastGeneration).reduce((a, b) => {
      return a + b.value;
    },0),
    lastGenerationDateEnd = props.generation?.data.length ? new Date(lastGenerationDate + (props.generation.data[0][3] == "PT60M" ? 3600 : 900 ) * 1000) : undefined;

  // Find load at matching point of time
  let loadTotal = 0;
  if (props.load) for(const loadEntry of props.load.data) {
    if (loadEntry[0] === lastGenerationDate) {
      loadTotal = loadEntry[1] as number;
    }
  }

  // If load at matching point of time wasn't found, use last load
  if (!loadTotal && props.load?.data?.length) loadTotal = props.load.data[props.load.data.length-1][1] as number;

  // Calculate total
  const netTotal = generationTotal - loadTotal;

  return (
    <div>
      <div class="content px-card m-0 pt-0 pb-15 bg-very-dark text-center">
        <div class="pt-10 mb-0 pb-0 price-display-24">{ generationTotal }</div>
        <div class="mt-0 pt-0">
          MW <span data-t-key="common.generation.production" lang={props.lang}>Produktion</span> 
        </div>
      </div>
      <div class="content px-card m-0 pt-0 pb-15 bg-dark text-center">
        <div class="pt-10 mb-0 pb-0 price-display-24">{ loadTotal }</div>
        <div class="mt-0 pt-0">
          MW <span data-t-key="common.generation.consumption" lang={props.lang}>Last</span> 
        </div>
      </div>
      <div class="content px-card m-0 pt-0 pb-15 bg-very-dark text-center">
        <div class={"pt-10 mb-0 pb-0 price-display-24 text-"+ (netTotal < 0 ? "danger" : "success")}>{ netTotal }</div>
        <div class="mt-0 pt-0">
          MW <span data-t-key={"common.generation."+(netTotal < 0 ? "deficit" : "excess")} lang={props.lang}>Net</span> 
        </div>
       </div>
    </div>
  );
}
