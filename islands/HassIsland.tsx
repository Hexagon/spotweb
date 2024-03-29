// @deno-types="../types/hljs.d.ts"

import { PageProps } from "$fresh/server.ts";
import { useEffect, useState } from "preact/hooks";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";
import InformationPane from "components/partials/InformationPane.tsx";
import { preferences } from "config/preferences.js";
import { CommonProps } from "utils/common.ts";
import { HassPageProps } from "routes/homeassistant.tsx";

import MultiPlexAd from "components/ads/MultiPlexAd.tsx";

export default function HassIsland(props: PageProps<HassPageProps>) {

  const [currency, setCurrency] = useState(preferences.currency(props.data.lang));
  const [unit, setUnit] = useState(preferences.unit());
  const [factor, setFactor] = useState(preferences.factor(props.data.lang));
  const [multiplier, setMultiplier] = useState(() => preferences.multiplier());
  const [extra, setExtra] = useState(preferences.extra(props.data.lang));
  const [decimals, setDecimals] = useState(preferences.decimals(props.data.lang));
  const [priceFactor, setPriceFactor] = useState(preferences.pricefactor(props.data.lang));

  const setPriceFactorStored = (pf: boolean) => {
    localStorage.setItem("sw_pricefactor", pf ? "true" : "false");
    setPriceFactor(pf);
  };

  const commonprops: CommonProps = {
    unit,
    multiplier,
    factor,
    extra,
    decimals,
    currency,
    priceFactor,
    ...props.data,
  };

  useEffect(() => {
    const apexConf = 
      `type: custom:apexcharts-card
        experimental:
          color_threshold: true
        graph_span: 2day
        update_interval: 2m
        now:
          show: true
          label: Now
          color: gray
        span:
          offset: '+0day'
          start: day
        yaxis:
          - id: primary
            decimals: 0
            min: 0
        header:
          show: true
          title: Electricity Price - Today and tomorrow
          show_states: true
          colorize_states: true
        all_series_config:
          color_threshold:
            - value: 0
              color: green
            - value: 75
              color: orange
            - value: 130
              color: red
          unit: '${currency}/kWh'
          type: line
          stroke_width: 0
          show:
            legend_value: false
            in_header: true
            header_color_threshold: true
        series:
          - entity: sensor.spotprice_now
            type: column
            name: Right now
            show:
              extremas: true
              in_header: before_now
            data_generator: >
              return
              entity.attributes.data.map(e=>[Date.parse(e.st),parseFloat(e.p)]);
          - entity: sensor.spotprice_now
            name: Today (avg)
            data_generator: >
              return [[new Date(),entity.attributes.avg]]
          - entity: sensor.spotprice_now
            name: Tomorrow (avg)
            data_generator: >
              return [[new Date(),entity.attributes.avg_tomorrow]]`;
    const hassConf = `rest:
    - scan_interval: 180
      resource: https://spot.56k.guru/api/v2/hass?currency=${currency}&area=SE2&multiplier=${multiplier}&extra=${extra}&factor=${factor}&decimals=${decimals}
      sensor:
        - name: "Spotprice Now"
          unique_id: "56k_spotprice_now"
          value_template: "{{ value_json.now }}"
          unit_of_measurement: "${currency}/kWh"
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
            - max_yesterday`;
    const 
      hassElm = document.getElementById('hass-conf'),
      apexElm = document.getElementById('apex-conf');
    if (apexElm) apexElm.innerHTML = apexConf;
    if (hassElm) hassElm.innerHTML = hassConf;
    hljs.highlightAll();
  },[currency,extra,factor,decimals])

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
            <div class="row">
              <div class="col-lg-7">
                <div class="content">
                  <h1 class="content-title font-size-24">
                      Home assistant
                  </h1>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-lg-7">
                <div class="content mt-0">
                  <p class="mt-0">You can easily get current and historical electricity prices in Home Assistant by using our REST endpoint together with Home Assistant's REST integration.</p>
                  <p>The example configuration gives you an entity called entities.spotprice_now, which displays the spot price right now. The device also receives a number of attributes, e.g.</p>
                  <ul>
                  <li><strong>data</strong> - full hourly history, yesterday to tomorrow.</li>
                  <li><strong>min/max/avg</strong> - Today's hourly price</li>
                  <li><strong>min/max/avg_tomorrow</strong> - Tomorrow's hourly price</li>
                  <li><strong>min/max/avg_yesterday</strong> - Yesterday's hourly price</li>
                  </ul>
                  <p>If you customize your price settings on the page (using the hamburger menu), your changes will be immediately reflected in the configuration to the right.</p>
                  <p>The service is free and open to everyone, no API key is required. However, it is used at your own risk, no guarantees are given! More information about data source and data quality can be found at the bottom of the page.</p>
                </div>
                <div class="content">
                  <MultiPlexAd cols={12} {...commonprops} {...props}></MultiPlexAd>
                </div>
                <div class="content">
                  <h2 class="font-size-24">Parameters</h2>
                  <p>The base url to the endpoint is <code>https://spot.56k.guru/api/v2/hass</code>, and the following parameters is available.</p>
                  <p>NOTE: If you've made any customizations on this page, the example url is already up to date with your personal settings.</p>
                  <ul>
                    <li>
                    <strong>currency</strong><span> - <code class="code">SEK</code> <code class="code">NOK</code> <code class="code">EUR</code> <code class="code">PLN</code> <code class="code">...</code></span>
                    </li>
                    <li>
                      <strong>area</strong><span> - If you browse to the area of interest on this page, you'll have the area id as the last part of the URL - something like <code class="code">SE</code> or <code class="code">DE-LU</code></span>
                    </li>
                    <li>
                      <strong>extra</strong><span> - Your fees per kWh in chosen currency, before VAT. Example: <code class="code">0.05</code> for 5 cents per kWh</span>
                    </li>
                    <li>
                      <strong>multiplier</strong><span> - Multiplier for spot price before adding fees and VAT. <code class="code">1</code> is no multiplier, <code class="code">1.02</code> is 2% added fee on spot price before adding extra fees and VAT.</span>
                    </li>
                    <li>
                      <strong>factor</strong><span> - Factor for VAT. <code class="code">1</code> is no VAT, <code class="code">1.25</code> is 25% VAT and so on.</span>
                    </li>
                    <li>
                      <strong>decimals</strong><span> - Precision for all price points, <code class="code">2</code> will result in 0.05kWh, <code class="code">4</code> -&gt; 0.00521, and so on.</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="col-lg-5">
                <div class="content mt-0">
                  <div class="card p-0 m-0">
                    <div class="code-header rounded-top p-10 pl-15">
                      configuration.yaml<br></br>
                      <small> - Showing spot price (no factor or fees added) of SE2 in {commonprops.currency}.</small>
                    </div> 
                    <div class="code-container">
                        <pre class="m-0">
                            <code class="language-yaml" id="hass-conf">
                            </code>
                        </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-lg-7">
                <div class="content">
                  <h1 class="content-title font-size-24">
                    Apexcharts-card in Lovelace
                  </h1>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-lg-7">
                <div class="content mt-0">
                  <p class="mt-0">This is an example showing how to use above configuration out of the box, to render a nice graph showing electricity prices for today and tomorrow.</p>
                  <p>Note that all values in the graph is multiplied by 100 to show cents or öre instead of EUR or SEK.</p>
                  <img src="/img/homeassistant-spot-price-apexcharts-card-example.png" alt="Home Assistant spotprice example"></img>
                </div>    
                <div class="content">
                  <InformationPane cols={12} {...commonprops} {...props.data} lang={"en"}></InformationPane>
                </div>
              </div>
              <div class="col-lg-5">
                <div class="content mt-0">
                  <div class="card p-0 m-0">
                    <div class="code-header rounded-top p-10 pl-15">
                      Apexchart-card config
                    </div> 
                    <div class="code-container">
                        <pre class="m-0">
                            <code class="language-yaml" id="apex-conf">
                  </code>
                </pre>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
