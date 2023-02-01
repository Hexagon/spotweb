import { PageProps } from "$fresh/server.ts";
import { useState } from "preact/hooks";

import Cron from "croner";

import { CommonProps } from "utils/common.ts";
import { CountryPageProps } from "routes/[country]/index.tsx";

import { preferences } from "config/preferences.js";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";

import AllAreaChart from "components/charts/AllAreaChart.tsx";
import AllAreaChartLongTerm from "components/charts/AllAreaChartLongTerm.tsx";
import ProductionTodayChart from "components/charts/ProductionTodayChart.tsx";

import SingleAreaOverview from "components/partials/SingleAreaOverview.tsx";
import InformationPane from "components/partials/InformationPane.tsx";
import PriceFactorWarning from "components/partials/PriceFactorWarning.tsx";
import ProductionOverview from "components/partials/ProductionOverview.tsx";
import ProductionDetailsTodayChart from "components/charts/ProductionDetailsTodayChart.tsx";
import OutageOverview from "../components/partials/OutageOverview.tsx";

export default function CountryIsland(props: PageProps<CountryPageProps>) {

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

  const commonprops: CommonProps = {
    unit,
    factor,
    extra,
    decimals,
    currency,
    priceFactor,
    ...props.data
  };

  const countryElms = props.data.areas?.map((a, idx) => {
    return (
      <SingleAreaOverview
        key={idx}
        title={a.name + " - " + a.long}
        highlight={"color-" + a.color}
        area={a}
        cols={3}
        {...commonprops}
        {...props.data}
      ></SingleAreaOverview>
    );
  });

  // Register a cron job which reloads the page at each full hour, if at least two minutes has passed since entering
  const pageLoadTime = new Date();
  new Cron("0 0 * * * *", () => {
    if (new Date().getTime()-pageLoadTime.getTime()>120*1000) {
      window?.location?.reload();
    }
  });

  return (
    <div>
      <div class="page-wrapper with-navbar with-sidebar" data-sidebar-hidden="hidden">
        <Navbar
          setPriceFactor={setPriceFactorStored}
          pageType={"country"}
          {...commonprops}
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
          <div class="content mt-0 mb-0 pr-0 mr-0 ml-20">
            <PriceFactorWarning priceFactor={!!priceFactor} factor={factor} extra={extra} lang={props.data.lang}></PriceFactorWarning>
            <div class="row">
              {countryElms}
            </div>
          </div>
          <div class="content mt-0 mb-0 mr-0 ml-20">
            <div class="row">
              <AllAreaChart
                title="today"
                highlight="color-5"
                {...commonprops}
                {...props.data}
              ></AllAreaChart>
              <AllAreaChart
                title="tomorrow"
                highlight="color-6"
                {...commonprops}
                {...props.data}
              ></AllAreaChart>
            </div>
          </div>
          <div class="content mt-0 mr-0 ml-20">
            <div class="row mt-0">
            <ProductionOverview
                cols={4}
                {...commonprops}
                {...props.data}
              ></ProductionOverview>
              <ProductionDetailsTodayChart
                cols={4}
                {...commonprops}
                {...props.data}
                ></ProductionDetailsTodayChart>
              <ProductionTodayChart
                cols={4}
                {...commonprops}
                {...props.data}
                ></ProductionTodayChart>
            </div>
          </div>
          <div class="content mt-0 mr-0 ml-20">
            <div class="row mt-0">
              <AllAreaChartLongTerm
                  {...commonprops}
                  {...props.data}
                ></AllAreaChartLongTerm>
              <InformationPane
                  cols={6}
                  {...commonprops}
                  {...props.data}
                ></InformationPane>
            </div>
          </div>
          <div class="content mt-0 mr-0 ml-20">
            <div class="row mt-0">
              <OutageOverview
                  cols={12}
                  {...commonprops}
                  {...props.data}
                ></OutageOverview>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
