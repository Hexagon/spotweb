import { PageProps } from "$fresh/server.ts";
import { useEffect, useState } from "preact/hooks";

import Navbar from "../components/layout/NavBar.tsx";
import Sidebar from "../components/layout/Sidebar.tsx";
import AllAreaChart from "../components/AllAreaChart.tsx";
import SingleAreaOverview from "../components/SingleAreaOverview.tsx";
import InformationPane from "../components/InformationPane.tsx";
import { countries } from "../utils/countries.js";
import { preferences } from "../utils/preferences.js";
import PriceFactorWarning from "../components/PriceFactorWarning.tsx";

export default function IndexIsland(props: PageProps) {
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

  const country = countries.find((c) => props.data.country === c.id);

  const dToday = new Date().toLocaleDateString("sv-SE");
  const dTomorrow = new Date(new Date().getTime() + 24 * 3600 * 1000).toLocaleDateString("sv-SE");

  const commonprops = {
    unit,
    factor,
    extra,
    decimals,
    currency,
    priceFactor,
    ...props.data,
  };

  const countryElms = country?.areas.map((a, idx) => {
    return (
      <SingleAreaOverview
        key={idx}
        title={a.name + " - " + a.long}
        highlight={"color-" + a.color}
        areaName={a.name}
        areaId={a.id}
        cols={3}
        date={dToday}
        dateT={dTomorrow}
        {...commonprops}
      >
      </SingleAreaOverview>
    );
  });

  const titleEntries = country?.areas.map((a, idx) => a.name + " - " + a.long).join(", ");

  return (
    <div>
      <div class="page-wrapper with-navbar with-sidebar" data-sidebar-hidden="hidden">
        <Navbar
          page="index"
          priceFactor={priceFactor}
          setPriceFactor={setPriceFactorStored}
          country={props.data.country}
          lang={props.data.lang}
        >
        </Navbar>
        <Sidebar
          page="index"
          setUnit={setUnit}
          setExtra={setExtra}
          setFactor={setFactor}
          setDecimals={setDecimals}
          setPriceFactor={setPriceFactor}
          setCurrency={setCurrency}
          {...commonprops}
        >
        </Sidebar>
        <div class="content-wrapper">
          <h1 class="noshow" data-t-key="common.header.title" lang={commonprops.lang}>Timpris just nu, rörligt pris hittills i månaden och historiska priser</h1>
          <h2 class="noshow">{titleEntries}</h2>
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
                priceFactor={priceFactor}
                highlight="color-5"
                date={dToday}
                country={props.data.country}
                {...commonprops}
              >
              </AllAreaChart>
              <AllAreaChart
                title="tomorrow"
                highlight="color-6"
                date={dTomorrow}
                country={props.data.country}
                {...commonprops}
              >
              </AllAreaChart>
            </div>
          </div>
          <div class="content mt-0 mr-0 ml-20">
            <div class="row mt-0">
              <InformationPane
                priceFactor={priceFactor}
                cols={12}
                {...commonprops}
              >
              </InformationPane>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
