// deno-lint-ignore-file ban-types
import Customize from "./Customize.tsx";
import { CommonProps } from "utils/common.ts";

interface SidebarProps extends CommonProps {
  setUnit: Function;
  setFactor: Function;
  setMultiplier: Function;
  setExtra: Function;
  setDecimals: Function;
  setPriceFactor: Function;
  setCurrency: Function;
  priceFactor: boolean;
}

export default function Sidebar(props: SidebarProps) {
  return (
    <div class="sidebar">
      <div class="sidebar-menu">
        <div class="sidebar-content custom-switch pr-10">
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
