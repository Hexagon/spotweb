// deno-lint-ignore-file ban-types
import { useCallback, useState } from "preact/hooks";

interface CustomizeProps {
  extra: number;
  factor: number;
  setUnit: Function;
  setFactor: Function;
  setExtra: Function;
  decimals: number;
  setDecimals: Function;
  disabled: boolean;
  currency: string;
  setCurrency: Function;
  lang: string;
}

export default function Table(props: CustomizeProps) {

  const setCurrencyStored = (u: string) => {
    localStorage.setItem("sw_currency", u);
    props.setCurrency(u);
  };

  const setFactorStored = (f: string) => {
    localStorage.setItem("sw_factor", f);
    props.setFactor(parseFloat(f));
  };

  const setExtraStored = (e: string) => {
    localStorage.setItem("sw_extra", e);
    props.setExtra(parseFloat(e));
  };

  const setDecimalsStored = (e: string) => {
    localStorage.setItem("sw_decimals", e);
    props.setDecimals(parseInt(e, 10));
  };

  return (
    <div>
      <div class="sidebar-content">
      </div>
      <div class="sidebar-content">
        <label for="currency" data-t-key="common.customize.currency" lang={props.lang}>Valuta</label>
        <select
          class="form-control"
          name="currency"
          disabled={!props.disabled}
          value={props.currency}
          onInput={(e) => setCurrencyStored((e.target as HTMLSelectElement).value)}
          required
        >
          <option value="SEK">SEK</option>
          <option value="NOK">NOK</option>
          <option value="EUR">EUR</option>
          <option value="DKK">DKK</option>
          <option value="PLN">PLN</option>
        </select>
      </div>
      <div class="sidebar-content">
        <label
          for="extra"
          data-t-key="common.customize.fees"
          lang={props.lang}
        >
          Avgifter
        </label>
        <input
          class="form-control"
          type="text"
          name="extra"
          disabled={!props.disabled}
          value={props.extra}
          onChange={(e) => setExtraStored((e.target as HTMLInputElement).value)}
          placeholder="Totala avgifter exklsive moms"
        >
        </input>
      </div>
      <div class="sidebar-content">
        <label for="factor" data-toggle="tooltip" data-t-key="common.customize.factor" lang={props.lang}>Faktor</label>
        <input
          class="form-control"
          type="text"
          name="factor"
          disabled={!props.disabled}
          value={props.factor}
          onChange={(e) => setFactorStored((e.target as HTMLInputElement).value)}
          placeholder="Faktor (t.ex. 1.25 för 25% moms)"
        >
        </input>
      </div>
      <div class="sidebar-content">
        <label for="decimals" data-t-key="common.customize.decimals" lang={props.lang}>Decimaler</label>
        <input
          class="form-control"
          type="text"
          name="decimals"
          value={props.decimals}
          disabled={!props.disabled}
          onChange={(e) => setDecimalsStored((e.target as HTMLInputElement).value)}
          placeholder="Number of decimals to show"
        >
        </input>
      </div>
    </div>
  );
}
