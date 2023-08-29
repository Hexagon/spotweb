import { PageProps } from "$fresh/server.ts";
import { useCallback, useState, useEffect } from "preact/hooks";

import { preferences } from "config/preferences.js";
import { CommonProps } from "utils/common.ts";
import { Cron } from "croner";

import { IndexPageProps } from "routes/index.tsx";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";

import PriceFactorWarning from "components/partials/PriceFactorWarning.tsx";
import ProductionByCountry from "components/ProductionByCountry.tsx";

import MultiPlexAd from  "components/ads/MultiPlexAd.tsx";

export default function IndexIsland({ data }: PageProps<IndexPageProps>) {
  const [currency, setCurrency] = useState(() => preferences.currency(data.lang));
  const [unit, setUnit] = useState(preferences.unit);
  const [factor, setFactor] = useState(() => preferences.factor(data.lang));
  const [multiplier, setMultiplier] = useState(() => preferences.multiplier(data.lang));
  const [extra, setExtra] = useState(() => preferences.extra(data.lang));
  const [decimals, setDecimals] = useState(() => preferences.decimals(data.lang));
  const [priceFactor, setPriceFactor] = useState(() => preferences.pricefactor(data.lang));

  const setPriceFactorStored = useCallback((pf: boolean) => {
    localStorage.setItem("sw_pricefactor", pf ? "true" : "false");
    setPriceFactor(pf);
  }, []);

  const commonprops: CommonProps = {
    unit,
    multiplier,
    factor,
    extra,
    decimals,
    currency,
    priceFactor,
    ...data
  };

  useEffect(() => {
    // Register a cron job which reloads the page at each full hour, if at least two minutes has passed since entering
    const pageLoadTime = new Date();
    const reloadJob = new Cron("0 0 * * * *", () => {
      if ((new Date().getTime() - pageLoadTime.getTime()) > 120 * 1000) {
        window?.location?.reload();
      }
    });

    // Returning a cleanup function
    return () => {
      reloadJob.stop();  // stopping the cron job when component unmounts
    };
  }, []);  // empty dependency array so this effect runs once on mount and cleanup on unmount

  return (
    <div>
      <div class="page-wrapper with-navbar with-sidebar" data-sidebar-hidden="hidden">
        <Navbar
          setPriceFactor={setPriceFactorStored}
          pageType={"generic"}
          {...commonprops}
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
          <div class="content mt-0 mb-0 pr-0 mr-0 ml-5">
            <PriceFactorWarning priceFactor={!!priceFactor} factor={factor} extra={extra} lang={data.lang}></PriceFactorWarning>
            <div class="row">
              <MultiPlexAd cols={12} {...commonprops} {...data}></MultiPlexAd>
            </div>
            <div class="row">
              <ProductionByCountry cols={12} {...commonprops} {...data}></ProductionByCountry>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
