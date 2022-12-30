import { useEffect, useState } from "preact/hooks";
import Table from "components/Table.tsx";
import { ExrateApiParsedResult } from "routes/api/exrate.ts";
import { generateUrl } from "utils/common.ts";
import { GetExchangeRates } from "backend/db/index.ts";
import { applyExchangeRate } from "utils/price.ts";

interface FilterProps {
  period: string;
  currency: string;
  startDate: string;
  endDate: string;
  area: string;
  unit: string;
  extra: number;
  factor: number;
  decimals: number;
  priceFactor: boolean;
}

export type { FilterProps };

export default function FilteredTable(props: FilterProps) {
  const [resultSet, setResultSet] = useState();

  const [area, setArea] = useState(props.area || "SE1");
  const [currency, setCurrency] = useState(props.currency || "SEK");
  const [period, setPeriod] = useState(props.period || "hourly");
  const [startDate, setStartDate] = useState(props.startDate || new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(props.endDate || new Date().toISOString().split("T")[0]);

  const [permalink, setPermalink] = useState("");
  const [permalinkJson, setPermalinkJson] = useState("");

  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);
    setResultSet(undefined);
    // Fetch if input data is sane
    if (ensureLocalProps()) {
      const url = generateUrl(area, new Date(Date.parse(startDate)), new Date(new Date(Date.parse(endDate))), period);
      if (url) {
        //setPermalink(generatePermalink("custom") as string);
        setPermalinkJson(url as string);
        const response = await fetch(url);
        let result = await response.json();
        result = applyExchangeRate(result.data, props.er, currency);
        setResultSet(result);
      }
    }
    setLoading(false);
  };

  const ensureUrlProps = () => props.area && props.currency && props.period && props.startDate && props.endDate && true;
  const ensureLocalProps = () => area && currency && period && startDate && endDate && true;

  const tryGetData = () => {
    if (ensureUrlProps()) {
      getData();
    }
  };

  useEffect(() => {
    tryGetData();
  }, []);

  return (
    <div class="content-wrapper">
      <div class="content">
        <h2 class="content-title">Urval</h2>
        <div class="form-row row-eq-spacing-sm">
          <div class="col-sm">
            <label for="period">Period</label>
            <select
              class="form-control"
              name="period"
              value={period}
              onChange={(e) => setPeriod((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="hourly">Timme</option>
              <option value="daily">Dag</option>
              <option value="weekly">Vecka</option>
              <option value="monthly">Månad</option>
              <option value="yearly">År</option>
            </select>
          </div>
          <div class="col-sm">
            <label for="currency">Valuta</label>
            <select
              class="form-control"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="SEK">SEK</option>
              <option value="NOK">NOK</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div class="col-sm">
            <label for="area">Elprisområde</label>
            <select
              class="form-control"
              name="area"
              value={area}
              onChange={(e) => setArea((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="SE1">SE1</option>
              <option value="SE2">SE2</option>
              <option value="SE3">SE3</option>
              <option value="SE4">SE4</option>
            </select>
          </div>
          <div class="col-sm">
            <label for="date">Startdatum</label>
            <input
              class="form-control"
              type="date"
              name="startDate"
              value={startDate}
              onInput={(e) => setStartDate((e.target as HTMLInputElement).value)}
            >
            </input>
          </div>
          <div class="col-sm">
            <label for="date">Slutdatum</label>
            <input
              class="form-control"
              type="date"
              name="endDate"
              value={endDate}
              onInput={(e) => setEndDate((e.target as HTMLInputElement).value)}
            >
            </input>
          </div>
          <div class="col-sm">
            <label for="ok">&nbsp;</label>
            <button
              class="form-control btn btn-success"
              type="button"
              name="ok"
              id="ok"
              onClick={getData}
            >
              Hämta
            </button>
          </div>
        </div>
        {period != "hourly" && !resultSet && (
          <div class="alert alert-secondary" role="alert">
            <h4 class="alert-heading">Vid urval på månad eller vecka</h4>
            När du gör urval per månad eller vecka, ange det sista datumet i den sista månaden eller veckan du vill se.
          </div>
        )}
      </div>
      {resultSet &&
        (
          <Table
            resultSet={resultSet}
            currency={currency}
            unit={props.unit}
            extra={props.extra}
            factor={props.factor}
            decimals={props.decimals}
            permalink={permalink}
            permalinkJson={permalinkJson}
            priceFactor={props.priceFactor}
          >
          </Table>
        )}
      {loading &&
        (
          <div class="content" aria-busy="true">
            <h5>Fetching latest data ...</h5>
          </div>
        )}
    </div>
  );
}
