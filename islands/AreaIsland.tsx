import { PageProps } from "$fresh/server.ts";
import { useCallback, useEffect, useState } from "preact/hooks";

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
import ProductionDetailsTodayChart from "components/charts/ProductionDetailsTodayChart.tsx";
import OutageNewsOverview from "../components/partials/OutageNewsOverview.tsx";
import MultiPlexAd from "components/ads/MultiPlexAd.tsx";
import SingleAreaChartLongTerm from "components/charts/SingleAreaChartLongTerm.tsx";

export default function AreaIsland({ data }: PageProps<AreaPageProps>) {
  const [currency, setCurrency] = useState(() => preferences.currency(data.lang));
  const [unit, setUnit] = useState(preferences.unit);
  const [multiplier, setMultiplier] = useState(() => preferences.multiplier());
  const [factor, setFactor] = useState(() => preferences.factor(data.lang));
  const [extra, setExtra] = useState(() => preferences.extra(data.lang));
  const [decimals, setDecimals] = useState(() => preferences.decimals(data.lang));
  const [priceFactor, setPriceFactor] = useState(() => preferences.pricefactor(data.lang));

  const setPriceFactorStored = useCallback((pf: boolean) => {
    localStorage.setItem("sw_pricefactor", pf ? "true" : "false");
    setPriceFactor(pf);
  }, []);

  const dToday = new Date().toLocaleDateString("sv-SE");

  const commonprops: CommonProps = {
    unit,
    factor,
    multiplier,
    extra,
    decimals,
    currency,
    priceFactor,
    ...data
  };

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
          pageType={"area"}
          {...commonprops}
          {...data}
        ></Navbar>
        <Sidebar
          setUnit={setUnit}
          setExtra={setExtra}
          setFactor={setFactor}
          setMultiplier={setMultiplier}
          setDecimals={setDecimals}
          setPriceFactor={setPriceFactorStored}
          setCurrency={setCurrency}
          {...commonprops}
        ></Sidebar>
        <div class="content-wrapper">
          <div class="content pr-0 mr-0 ml-20 mt-0">
            <div class="row mt-0">
              <PriceFactorWarning priceFactor={!!priceFactor} multiplier={multiplier} factor={factor} extra={extra} lang={data.lang}></PriceFactorWarning>
              <div class="sticky-alerts"></div>
              <SingleAreaOverview
                title={data.area.name + " - " + data.area.long}
                highlight={"color-" + data.area.color}
                cols={3}
                detailed={true}
                {...commonprops}
                {...data}
              ></SingleAreaOverview>
              <SingleAreaChart
                title={data.area.name + " - " + data.area.long}
                highlight={"color-" + data.area.color}
                cols={6}
                {...commonprops}
                {...data}
              ></SingleAreaChart>
              <ProductionOverview
                cols={3}
                {...commonprops}
                {...data}
              ></ProductionOverview>
            </div>
            <div class="row">
              <MultiPlexAd cols={12} {...commonprops} {...data}></MultiPlexAd>
            </div>
            <div class="row">
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
            <div class="row">
              <SingleAreaChartLongTerm
                cols={data.singleArea ? 6 : 12}
                date={dToday}
                {...commonprops}
                {...data}
              ></SingleAreaChartLongTerm>
              { data.singleArea && (
                <OutageNewsOverview
                  cols={6}
                  {...commonprops}
                  {...data}
                ></OutageNewsOverview>
              )}
              <div class="row mt-0">
              <SingleAreaMonthChart
                title={data.area.name + " - " + data.area.long}
                highlight={"color-" + data.area.color}
                cols={6}
                date={dToday}
                {...commonprops}
                {...data}
              ></SingleAreaMonthChart>
                <InformationPane
                    cols={6}
                    {...commonprops}
                    {...data}
                  ></InformationPane>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
