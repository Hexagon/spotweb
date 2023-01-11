import { PageProps } from "$fresh/server.ts";
import { useState } from "preact/hooks";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";
import AllAreaChart from "components/AllAreaChart.tsx";
import SingleAreaOverview from "components/SingleAreaOverview.tsx";
import InformationPane from "components/InformationPane.tsx";
import { preferences } from "config/preferences.js";
import PriceFactorWarning from "components/PriceFactorWarning.tsx";
import { applyExchangeRate, avgPrice, processPrice } from "utils/price.ts";
import { CommonProps, ExtPageProps } from "utils/common.ts";
import AllAreaChartLongTerm from "components/AllAreaChartLongTerm.tsx";
import GenerationOverview from "components/GenerationOverview.tsx";
import Cron from "croner";
import SingleCountryOverview from "../components/SingleCountryOverview.tsx";

export default function IndexIsland(props: PageProps<ExtPageProps>) {
  
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
    ...props.data,
  };

  const countryElms = props.data.countryList?.map((a, idx) => {
    return (
      <SingleCountryOverview
        key={idx}
        title={a.name}
        highlight={"color-" + (idx+1)}
        countryObj={a}
        cols={2}
        {...commonprops}
      ></SingleCountryOverview>
    );
  });

  // Register a cron job which reloads the page at each full hour, if at least two minutes has passed since entering
  const pageLoadTime = new Date();
  const reloadJob = new Cron("0 0 * * * *", () => {
    if (new Date().getTime()-pageLoadTime.getTime()>120*1000) {
      window?.location?.reload();
    }
  });

  return (
    <div>
      <div class="page-wrapper with-navbar with-sidebar" data-sidebar-hidden="hidden">
        <Navbar
          setPriceFactor={setPriceFactorStored}
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
          <div class="content mt-0 mb-0 pr-0 mr-0 ml-5">
            <PriceFactorWarning priceFactor={!!priceFactor} factor={factor} extra={extra} lang={props.data.lang}></PriceFactorWarning>
            <div class="row">
              {countryElms}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
