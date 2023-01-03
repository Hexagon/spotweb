// deno-lint-ignore-file ban-types

import { useEffect, useState } from "preact/hooks";
import { countries } from "config/countries.ts";
import Customize from "./Customize.tsx";

interface SidebarProps {
  unit: string;
  extra: number;
  factor: number;
  decimals: number;
  setUnit: Function;
  setFactor: Function;
  setExtra: Function;
  setDecimals: Function;
  hidden?: boolean;
  page: string;
  priceFactor: boolean;
  setPriceFactor: Function;
  currency: string;
  setCurrency: Function;
  lang: string;
}

export default function Sidebar(props: SidebarProps) {
  return (
    <div class="sidebar">
      <div class="sidebar-menu">
        <div class="sidebar-content hidden-md-and-up pt-0">
          { countries && countries.map((country) => (
            <>
              <a
                class={"nav-link mt-10" + (props.page === country.id ? " active" : "")}
                href={"/" + country.id}
                data-t-key={"common.countries." + country.id}
                lang={props.lang}
              >{country.name}</a>
              { country.areas && country.areas.map((area) => (
                <a 
                  class={"sidebar-link" + (props.page === area.id ? " active" : "")} 
                  href={"/" + country.id + "/" + area.name}
                >{area.name} - {area.long}</a>
              ))}
            </>
          ))}
          <a class={"sidebar-link" + (props.page === "custom" ? " active" : "") + " hidden"} href={"/custom"}>
            Anpassad period
          </a>
          <a class={"sidebar-link" + (props.page === "compare" ? " active" : "") + " hidden"} href={"/compare"}>
            Jämför elområden
          </a>
        </div>
        <div class="sidebar-divider hidden-md-and-up"></div>
        <div class="sidebar-content hidden-md-and-up custom-switch pr-10">
          <input
            type="checkbox"
            checked={props.priceFactor}
            id="price-selector-sb"
            onInput={(e) => props.setPriceFactor((e.target as HTMLInputElement).checked)}
          >
          </input>
          <label for="price-selector-sb">
            <i>
              <small data-t-key="common.nav.actual_price_instead" lang={props.lang}>Actual price instead of spot price</small>
            </i>
          </label>
        </div>
        <div class="sidebar-content">
          <h5 class="sidebar-title" data-t-key="common.customize.title" lang={props.lang}>Customize price</h5>
          <div class="sidebar-divider"></div>
          <Customize {...props} disabled={props.priceFactor}></Customize>
        </div>
      </div>
    </div>
  );
}
