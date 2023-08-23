import { PageProps } from "$fresh/server.ts";
import { useCallback, useEffect, useState } from "preact/hooks";

import Cron from "croner";

import { CommonProps } from "utils/common.ts";
import { CountryPageProps } from "routes/[country]/index.tsx";

import { preferences } from "config/preferences.js";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";

import MultiPlexAd from "components/ads/MultiPlexAd.tsx";
import AllAreaChart from "components/charts/AllAreaChart.tsx";
import AllAreaChartLongTerm from "components/charts/AllAreaChartLongTerm.tsx";
import ProductionTodayChart from "components/charts/ProductionTodayChart.tsx";

import SingleAreaOverview from "components/partials/SingleAreaOverview.tsx";
import InformationPane from "components/partials/InformationPane.tsx";
import PriceFactorWarning from "components/partials/PriceFactorWarning.tsx";
import ProductionOverview from "components/partials/ProductionOverview.tsx";
import ProductionDetailsTodayChart from "components/charts/ProductionDetailsTodayChart.tsx";
import OutageNewsOverview from "../components/partials/OutageNewsOverview.tsx";

export default function CountryIsland({ data }: PageProps<CountryPageProps>) {
  const [currency, setCurrency] = useState(() => preferences.currency(data.lang));
  const [unit, setUnit] = useState(preferences.unit);
  const [factor, setFactor] = useState(() => preferences.factor(data.lang));
  const [extra, setExtra] = useState(() => preferences.extra(data.lang));
  const [decimals, setDecimals] = useState(() => preferences.decimals(data.lang));
  const [priceFactor, setPriceFactor] = useState(() => preferences.pricefactor(data.lang));

  const setPriceFactorStored = useCallback((pf: boolean) => {
    localStorage.setItem("sw_pricefactor", pf ? "true" : "false");
    setPriceFactor(pf);
  }, []);

  const commonprops: CommonProps = {
    unit,
    factor,
    extra,
    decimals,
    currency,
    priceFactor,
    ...data
  };

  const countryElms = data.areas?.map((a) => {
    return (
      <SingleAreaOverview
        key={a.id} // if there's a unique identifier for each area
        title={a.name + " - " + a.long}
        highlight={"color-" + a.color}
        area={a}
        cols={3}
        {...commonprops}
      ></SingleAreaOverview>
    );
  });

  // Register a cron job which reloads the page at each full hour, if at least two minutes has passed since entering
  useEffect(() => {
    const pageLoadTime = new Date();
    const _reloadJob = new Cron("0 0 * * * *", () => {
      if (new Date().getTime()-pageLoadTime.getTime()>120*1000) {
        window?.location?.reload();
      }
    });
    
    return () => {
      _reloadJob.stop();
    }
  }, []);

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
            <PriceFactorWarning priceFactor={!!priceFactor} factor={factor} extra={extra} lang={data.lang}></PriceFactorWarning>
            <div class="row">
              {countryElms}
            </div>
          </div>
          <div class="content mt-0 mr-0 ml-20">
            <div class="row mt-0">
              <ProductionOverview
                  cols={6}
                  {...commonprops}
                  {...data}
                ></ProductionOverview>
                <MultiPlexAd cols={6} {...commonprops} {...data}></MultiPlexAd>
            </div>
          </div>
          <div class="content mt-0 mb-0 mr-0 ml-20">
            <div class="row">
              <AllAreaChart
                title="today"
                highlight="color-5"
                cols={6}
                {...commonprops}
                {...data}
              ></AllAreaChart>
              <AllAreaChart
                title="tomorrow"
                highlight="color-6"
                cols={6}
                {...commonprops}
                {...data}
              ></AllAreaChart>
            </div>
          </div>
          <div class="content mt-0 mr-0 ml-20">
            <div class="row mt-0">
            <ProductionDetailsTodayChart
                  cols={6}
                  {...commonprops}
                  {...data}
            ></ProductionDetailsTodayChart>
            <ProductionTodayChart
              cols={6}
              {...commonprops}
              {...data}
              ></ProductionTodayChart>
            </div>
          </div>
          <div class="content mt-0 mr-0 ml-20">
            <div class="row mt-0">
              <AllAreaChartLongTerm
                 cols={6}
                  {...commonprops}
                  {...data}
                ></AllAreaChartLongTerm>              
              <OutageNewsOverview
                cols={6}
                {...commonprops}
                {...data}
              ></OutageNewsOverview>
            </div>
          </div>
          <div class="content mt-0 mr-0 ml-20">
            <div class="row mt-0">
              <InformationPane
                  cols={12}
                  {...commonprops}
                  {...data}
                ></InformationPane>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
