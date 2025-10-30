import FilteredTable from "components/FilteredTable.tsx";
import { useCallback, useState } from "preact/hooks";
import { PageProps } from "fresh/server";
import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";
import { preferences } from "config/preferences.js";
import { CommonProps } from "utils/common.ts";

export default function CustomIsland({ data }: PageProps) {
  const [currency, setCurrency] = useState(() => preferences.currency(data.lang));
  const [unit, setUnit] = useState(preferences.unit);
  const [factor, setFactor] = useState(() => preferences.factor(data.lang));
  const [multiplier, setMultiplier] = useState(() => preferences.multiplier());
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

  return (
    <div>
      <div class="page-wrapper with-sidebar with-navbar">
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
        <FilteredTable
          {...commonprops}
          {...data}
        ></FilteredTable>
      </div>
    </div>
  );
}
