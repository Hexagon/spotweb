import { PageProps } from "fresh/server";
import { useState } from "preact/hooks";

import { preferences } from "config/preferences.js";
import { CommonProps } from "utils/common.ts";
import { HelpPageProps } from "routes/help.tsx";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";

import InformationPane from "components/partials/InformationPane.tsx";

import DisplayAd from "components/ads/DisplayAd.tsx";

export default function HassIsland(props: PageProps<HelpPageProps>) {

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
  return (
    <div class="page-wrapper with-navbar with-sidebar" data-sidebar-hidden="hidden">
      <Navbar setPriceFactor={setPriceFactorStored} pageType={"generic"} {...commonprops}></Navbar>
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
        {/* Table of Contents */}
        <section class="content mb-50">
          <h2 class="content-title">Table of Contents</h2>
          <ul>
            <li><a href="#electricity-prices-info">Information on Electricity Prices</a></li>
            <li><a href="#electricity-price-calculation">Electricity Price Calculation at spot.56k.guru</a></li>
            <li><a href="#installing-as-app">Installing as an app</a></li>
          </ul>
        </section>
  
        {/* Information about Electricity Prices */}
        <section id="electricity-prices-info" class="content mb-50">
          <h2 class="content-title">Information on Electricity Prices</h2>
          <p>Learn about hourly prices, variable prices, taxes, and fees under each respective category below.</p>
          <div class="row mb-50">
            <div class="col-lg-4">
              <div class="card m-0 mb-lg-20 p-50">
                <h3 class="card-title">Spot Price</h3>
                <p>The spot price is the price your electricity trading company has to pay for the electricity. This number is often the one shown in various comparisons, newspaper articles, etc.</p>
                <p>Spot price does <strong>not</strong> include any surcharges and VAT.</p>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card m-0 mb-lg-20 mr-lg-20 ml-lg-20 p-20">
                <h3 class="content-title">Hourly Price</h3>
                <p>The hourly price, or variable hourly price, means you pay for your consumption and your electricity price hour by hour. This allows you to use less electricity during expensive hours and more electricity during cheap hours. It's a good choice for those who can move large consumers to times when electricity is cheap. If you have little opportunity to move consumption, this might be a more expensive or at least more stressful alternative than the monthly price.</p>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card m-0 p-50">
                <h3 class="content-title">Variable Monthly Price</h3>
                <p>The variable price, or variable monthly price, works much like the hourly price. But instead of your consumption being measured hour by hour, it is summed up to a monthly total. This is then multiplied by the electricity company's variable electricity price, which is determined at the end of the month. The variable monthly price is not a straight average of all hours/days prices, but is weighted like the hourly price hour by hour against the entire collective's consumption.</p>
              </div>
            </div>
          </div>
          <h3 class="content-title">Taxes and Fees</h3>
          <p>If you consume 1kWh and the spot price is 1 EUR, your actual price will be 1.37kr.</p>
          <p>Note also that, in addition to these 1.37, you also pay about 50 öre in tax, and 20 öre in VAT for each consumed kWh. Each consumed kilowatt-hour therefore costs roughly 2 kr, at a spot price of 1 kr.</p>
          <p>On this page, you can choose between <i>actual price</i> or <i>spot price</i>. You can do this by pressing the hamburger menu at the top left.</p>
        </section>
        <hr />

        <section class="content mb-50">
          <DisplayAd {...commonprops} {...props}></DisplayAd>
        </section>
        <hr />

        {/* Customizing electicity prices */}
        <section id="electricity-price-calculation" class="content mb-50">
          <h2 class="content-title">Electricity Price Calculation at spot.56k.guru</h2>
          <p>At spot.56k.guru, the default setting displays the spot prices of electricity. But did you know you can customize how these prices are shown based on various factors?</p>

          <h3 class="content-title">How to Customize:</h3>
          <ol>
              <li>Visit the website and look for the <strong>cogwheel icon</strong>.</li>
              <li>Click on the cogwheel to reveal customization options.</li>
              <li>Here, you'll find a switch that allows you to adjust various parameters:
                  <ul>
                      <li><strong>Spot Price Multiplier</strong>: This is used when the electricity company has an added fee in percentage per kilowatt hour. For example, use 1.02 if there's an added fee of 2% per kWh.</li>
                      <li><strong>Fees</strong>: This denotes any set addition the electricity company charges per kWh.</li>
                      <li><strong>Factor (VAT)</strong>: This is typically the Value Added Tax. For instance, use 1.25 for a 25% VAT.</li>
                  </ul>
              </li>
          </ol>

          <p>Once you've set your desired parameters, the website will calculate the spot price as:</p>
          <p class="border border-secondary p-3">Spot Price = ((Original Spot Price × Multiplier) + Fees) × Factor (VAT)</p>

          <h3 class="content-title">Example Calculation:</h3>
          <p>Let's take an example to understand this better:</p>
          <ul>
              <li><strong>Original Spot Price</strong>: ...</li>
              <li><strong>Multiplier</strong>: ...</li>
              <li><strong>Fees</strong>: ...</li>
              <li><strong>Factor (VAT)</strong>: ...</li>
          </ul>
        </section>
        <hr />
        
        {/* Installing as an app */}
        <section id="installing-as-app" class="content mb-50">
          <h2 class="content-title">Installing as an app</h2>
          <p>spot.56k.guru is available as an app (<a href="https://web.dev/what-are-pwas/">PWA</a>) for Windows, Android and Apple OS devices. Follow the instructions below to install the app.</p>
          <div class="row mb-50">
            <div class="col-lg-4">
              <div class="card m-0 mb-lg-50 p-50">
                <div class="card-title">
                  <h3 class="content-title">Windows (Chrome)</h3>
                </div>
                <p>On your computer, open Chrome.</p>
                <ol>
                  <li>At the top right of the address bar, click Install.</li>
                  <li>Follow the onscreen instructions.</li>
                </ol>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card m-0 mb-lg-50 ml-lg-20 mr-lg-20 p-50">
                <div class="card-title">
                  <h3 class="content-title">Android (Chrome)</h3>
                </div>
                <p>On your Android device, open Chrome.</p>
                <ol>
                  <li>Tap Install. If you've already dismissed the installation pop-up - you can use the three-dot menu, then click "Install".</li>
                  <li>Follow the onscreen instructions.</li>
                </ol>
              </div>
            </div>
            <div class="col-lg-4">
              <div class=" card mb-lg-50 m-0 p-50">
                <div class="card-title">
                  <h3 class="content-title">Apple/iOS</h3>
                </div>
                <p>On your Apple device, open Safari. It is not possible to install Progressive web apps from Chrome on Apple devices.</p>
                <ol>
                  <li>Press the "Share" button.</li>
                  <li>Select "Add to home screen"</li>
                  <li>Tap "Add" in the top right corner to finish</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
        <hr />
        {/* Information box */}
        <section class="content mb-50">
          <div class="row">
            <div class="col-xl on-this-page-nav-container">
                <div class="content">
                    <InformationPane cols={12} {...commonprops} {...props.data}></InformationPane>
                </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}