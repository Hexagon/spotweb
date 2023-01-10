import { PageProps } from "$fresh/server.ts";
import { useState } from "preact/hooks";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";
import InformationPane from "components/InformationPane.tsx";
import { preferences } from "config/preferences.js";
import { CommonProps, ExtPageProps } from "utils/common.ts";

export default function HassIsland(props: PageProps<ExtPageProps>) {
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
          <div class="content mt-0 mb-0 mr-0 ml-20">
            <div class="row">
              <div class="col-lg">
        
        <h1>
            Home assistant
        </h1>
        <p>You can get current spot price, min/max for today, yesterday and tomorrow by using our API with the REST integration in Home Assistant.</p>
        <p>Juts add this code into your <code class="code">configuration.yaml</code> and customize to your needs.</p>
        <p>Only for personal use, at your own risk.</p>
        <h2>Example yaml</h2>
        <code><pre class="code">{
`rest:
- scan_interval: 180
  resource: http://spot.56k.guru/api/v2/hass?currency=SEK&extra=0.095&factor=1.25&area=SE2&decimals=2
  sensor:
    - name: "Spotprice Now"
      unique_id: "56k_spotprice_now"
      value_template: "{{ value_json.now }}"
      unit_of_measurement: "SEK/kWh"
      state_class: "measurement"
      device_class: "monetary"
      json_attributes:
        - data
        - avg
        - min
        - max
        - avg_tomorrow
        - min_tomorrow
        - max_tomorrow
        - avg_yesterday
        - min_yesterday
        - max_yesterday`}
        </pre></code>
        </div>
        </div>
        </div>
          </div>
        </div>
      </div>
  );
}
