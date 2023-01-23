import { PageProps } from "$fresh/server.ts";
import { useState } from "preact/hooks";

import { Cron } from "croner";

import { preferences } from "config/preferences.js";
import { CommonProps } from "utils/common.ts";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";

import SingleAreaChart from "components/charts/SingleAreaChart.tsx";
import SingleAreaMonthChart from "components/charts/SingleAreaMonthChart.tsx";
import ProductionTodayChart from "components/charts/ProductionTodayChart.tsx";

import InformationPane from "components/partials/InformationPane.tsx";
import ProductionOverview from "components/partials/ProductionOverview.tsx";
import PriceFactorWarning from "components/partials/PriceFactorWarning.tsx";
import SingleAreaOverview from "components/partials/SingleAreaOverview.tsx";

import { AreaPageProps } from "routes/[country]/[area].tsx";
import ProductionDetailsTodayChart from "../components/charts/ProductionDetailsTodayChart.tsx";

export default function AreaIsland(props: PageProps<AreaPageProps>) {

  const [currency, setCurrency] = useState(preferences.currency(props.data.lang));
  const [unit, setUnit] = useState(preferences.unit());
  const [factor, setFactor] = useState(preferences.factor(props.data.lang));
  const [extra, setExtra] = useState(preferences.extra(props.data.lang));
  const [decimals, setDecimals] = useState(preferences.decimals(props.data.lang));
  const [priceFactor, setPriceFactor] = useState(preferences.pricefactor(props.data.lang));

  const setPriceFactorStored = (pf: boolean) => {
    localStorage.setItem("sw_pricefactor", pf ? "true" : "false");
    setPriceFactor(pf);
  };

  const dToday = new Date().toLocaleDateString("sv-SE");

  const commonprops: CommonProps = {
    unit,
    factor,
    extra,
    decimals,
    currency,
    priceFactor,
    ...props.data
  };

  // Register a cron job which reloads the page at each full hour, if at least two minutes has passed since entering
  const pageLoadTime = new Date();
  const _reloadJob = new Cron("0 0 * * * *", () => {
    if (new Date().getTime()-pageLoadTime.getTime()>120*1000) {
      window?.location?.reload();
    }
  });

  return (
    <div>
      <div class="page-wrapper with-navbar with-sidebar" data-sidebar-hidden="hidden">
        <Navbar
          setPriceFactor={setPriceFactorStored}
          pageType={"area"}
          {...commonprops}
          {...props.data}
        ></Navbar>
        <Sidebar
          setUnit={setUnit}
          setExtra={setExtra}
          setFactor={setFactor}
          setDecimals={setDecimals}
          setPriceFactor={setPriceFactorStored}
          setCurrency={setCurrency}
          {...commonprops}
        ></Sidebar>
        <div class="content-wrapper">
          <div class="content pr-0 mr-0 ml-20 mt-0">
            <div class="row mt-0">
              <PriceFactorWarning priceFactor={!!priceFactor} factor={factor} extra={extra} lang={props.data.lang}></PriceFactorWarning>
              <div class="sticky-alerts"></div>
              <SingleAreaOverview
                title={props.data.area.name + " - " + props.data.area.long}
                highlight={"color-" + props.data.area.color}
                cols={3}
                detailed={true}
                {...commonprops}
                {...props.data}
              ></SingleAreaOverview>
              <SingleAreaChart
                title={props.data.area.name + " - " + props.data.area.long}
                highlight={"color-" + props.data.area.color}
                cols={6}
                {...commonprops}
                {...props.data}
              ></SingleAreaChart>
              <ProductionOverview
                cols={3}
                {...commonprops}
                {...props.data}
              ></ProductionOverview>
            </div>
            <div class="row">
              <ProductionDetailsTodayChart
                cols={6}
                {...commonprops}
                {...props.data}
                ></ProductionDetailsTodayChart>
              <ProductionTodayChart
                cols={6}
                {...commonprops}
                {...props.data}
                ></ProductionTodayChart>
            </div>
            <div class="row">
            <SingleAreaMonthChart
                title={props.data.area.name + " - " + props.data.area.long}
                highlight={"color-" + props.data.area.color}
                cols={6}
                date={dToday}
                {...commonprops}
                {...props.data}
              ></SingleAreaMonthChart>
              <InformationPane
                cols={6}
                {...commonprops}
                {...props.data}
              ></InformationPane>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
