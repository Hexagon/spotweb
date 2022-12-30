import { useState } from "preact/hooks";
import { PageProps } from "fresh/server.ts";
import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";
import Comparison from "components/Comparison.tsx";
import { preferences } from "config/preferences.js";

export default function IndexIsland(props: PageProps) {
  const [currency, setCurrency] = useState(preferences.currency(props.data.lang));
  const [unit, setUnit] = useState(preferences.unit());
  const [factor, setFactor] = useState(preferences.factor(props.data.lang));
  const [extra, setExtra] = useState(preferences.extra(props.data.lang));
  const [decimals, setDecimals] = useState(preferences.decimals(props.data.lang));
  const [priceFactor, setPriceFactor] = useState(preferences.pricefactor(props.data.lang));

  const commonprops = {
    unit,
    factor,
    extra,
    decimals,
    currency,
    priceFactor,
    ...props.data,
  };

  return (
    <div>
      <div class="page-wrapper with-sidebar with-navbar">
        <Navbar
          page="compare"
          setPriceFactor={setPriceFactor}
          {...commonprops}
        >
        </Navbar>
        <Sidebar
          page="compare"
          setUnit={setUnit}
          setExtra={setExtra}
          setFactor={setFactor}
          setDecimals={setDecimals}
          setPriceFactor={setPriceFactor}
          setCurrency={setCurrency}
          {...commonprops}
        >
        </Sidebar>
        <Comparison
          {...commonprops}
        >
        </Comparison>
      </div>
    </div>
  );
}
