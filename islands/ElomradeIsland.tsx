import { PageProps } from "$fresh/server.ts";
import { useState } from "preact/hooks";

import Navbar from "../components/layout/NavBar.tsx";
import Sidebar from "../components/layout/Sidebar.tsx";
import SingleAreaOverview from "../components/SingleAreaOverview.tsx";
import SingleAreaChart from "../components/SingleAreaChart.tsx";
import SingleAreaMonthChart from "../components/SingleAreaMonthChart.tsx";
import InformationPane from "../components/InformationPane.tsx";
import SingleAreaTable from "../components/SingleAreaTable.tsx";
import { preferences } from "../utils/preferences.js";

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

  const 
    area = props.data.area,
    country = props.data.country;

  if (!area || !country) {
    return <></>;
  }

  return (
    <div>
      <div class="page-wrapper with-navbar with-sidebar" data-sidebar-hidden="hidden">
        <Navbar
          page={area.name}
          priceFactor={priceFactor}
          setPriceFactor={setPriceFactorStored}
          country={props.data.country.name}
          lang={props.data.lang}
        >
        </Navbar>
        <Sidebar
          page={area.name}
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
          <div class="content pr-0 mr-0 ml-20 mt-0">
            <div class="row mt-0">
            <h1 class="noshow" data-t-key="common.header.title" lang={commonprops.lang}>Timpris just nu, rörligt pris hittills i månaden och historiska priser</h1>
            <h2 class="noshow">{country.name} - {area.name} {area.long}</h2>
              <div class="sticky-alerts"></div>
                <SingleAreaOverview
                  title={area.name + " - " + area.long}
                  highlight={"color-" + area.color}
                  cols={3}
                  area={area}
                  er={props.data.er}
                  detailed={true}
                  {...commonprops}
                >
                </SingleAreaOverview>
              <SingleAreaTable
                priceFactor={priceFactor}
                cols={3}
                areaId={area.id}
                date={dToday}
                {...commonprops}
              >
              </SingleAreaTable>
              <SingleAreaChart
                title={area.name + " - " + area.long}
                highlight={"color-" + area.color}
                cols={6}
                areaId={area.id}
                date={dToday}
                dateT={dTomorrow}
                {...commonprops}
              >
              </SingleAreaChart>
            </div>
            <div class="row">
              <SingleAreaMonthChart
                title={area.name + " - " + area.long}
                highlight={"color-" + area.color}
                cols={8}
                areaId={area.id}
                date={dToday}
                {...commonprops}
              >
              </SingleAreaMonthChart>
              <InformationPane
                priceFactor={priceFactor}
                cols={4}
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
