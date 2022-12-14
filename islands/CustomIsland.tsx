import FilteredTable from "components/FilteredTable.tsx";
import { useState } from "preact/hooks";
import { PageProps } from "$fresh/server.ts";
import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";
import { preferences } from "config/preferences.js";
import { CommonProps } from "utils/common.ts";

//import { CustomPageProps } from "routes/custom.tsx";

export default function CustomIsland(props: PageProps) {

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

  return (
    <div>
      <div class="page-wrapper with-sidebar with-navbar">
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
        <FilteredTable
          {...commonprops}
          {...props.data}
        ></FilteredTable>
      </div>
    </div>
  );
}
