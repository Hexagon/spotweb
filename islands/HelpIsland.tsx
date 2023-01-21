import { PageProps } from "$fresh/server.ts";
import { useState } from "preact/hooks";

import { preferences } from "config/preferences.js";
import { CommonProps } from "utils/common.ts";
import { HelpPageProps } from "routes/help.tsx";

import Navbar from "components/layout/NavBar.tsx";
import Sidebar from "components/layout/Sidebar.tsx";

import InformationPane from "components/partials/InformationPane.tsx";

export default function HassIsland(props: PageProps<HelpPageProps>) {

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
          setDecimals={setDecimals}
          setPriceFactor={setPriceFactorStored}
          setCurrency={setCurrency}
          {...commonprops}
        ></Sidebar>
        <div class="content-wrapper">
          <div class="row">
            <div class="col-xl-12">
              <div class="content">
                {/* Aboot */}
                <h1 class="content-title">
                  Help
                </h1>
                <h2  class="content-title">Installing as an app</h2>
                <p>spot.56k.guru is available as an app (<a href="https://web.dev/what-are-pwas/">PWA</a>) for Windows, Android and Apple OS devices. Follow the instructions below to install the app.</p>
              </div>
              <div class="content row">
               <div class="px-card col-md-4">
                  <div class="card-title">
                    <h3  class="content-title">Windows (Chrome)</h3>
                  </div>
                  <p>On your computer, open Chrome.</p>
                  <ul>
                    <ol>At the top right of the address bar, click Install.</ol>
                    <ol>Follow the onscreen instructions.</ol>
                  </ul>
                </div>
                <div class="px-card col-md-4">
                  <div class="card-title">
                    <h3 class="content-title">Android (Chrome)</h3>
                  </div>
                  <p>On your Android device, open Chrome.</p>
                  <ul>
                    <ol>Tap Install. If you've already dismissed the installation pop-up - you can use the three-dot menu, then click "Install".</ol>
                    <ol>Follow the onscreen instructions.</ol>
                  </ul>
                </div>
                <div class="px-card col-md-4">
                  <div class="card-title">
                    <h3 class="content-title">Apple/iOS</h3>
                  </div>
                  <p>On your Apple device, open Safari. It is not possible to install Progressive web apps from Chrome on Apple devices.</p>
                  <ul>
                    <ol>Press the "Share" button.</ol>
                    <ol>Select "Add to home screen"</ol>
                    <ol>Tap "Add" in the top right corner to finish</ol>
                  </ul>
                </div>
                {/*
                <h2 class="content-title">Infomation om elpris <a href="#information-electricity-prices" class="ml-5 text-decoration-none">#</a></h2>
                <p>Läs gärna på om timpris, rörligt pris, skatter och avgifter under respektive kategori här nedanför.</p>
                <div class="row">
                <div class="col-md-4">
                  <h3 class="content-title">Spotpris</h3>
                  <p class="font-size-12">
                    Spotpriset är det pris ditt elhandelsbolag får betala för elen, det är oftast den här siffran som visas i olika jämförelser,
                    tidningsartiklar m.m.
                  </p>
                  <p class="font-size-12">
                    Spotpriset inkluderar <strong>inte</strong> eventuella påslagsavgifter, och moms.
                  </p>
                  </div>
                  <div class="col-md-4">
                  <h3 class="content-title">Timpris</h3>
                  <p class="font-size-12">Timpris, eller rörligt timpris fungerar så att du betalar för din förbrukning och ditt elpris timme för timme. På så vis kan har du
                  möjlighet att använda mindre el under dyra timmar, och mer el under billiga timmar. Ett bra val för dig som har möjlighet att flytta
                      stora förbrukare (t.ex. uppvärmning, eller laddning av elbil) till tidpunkter när elen är billig. Har du små mölighete att flytta
                      förbrukning, så kan det här istället bli ett dyrare, eller åtminstone mer stressande alternativ än månadspris.</p>
                  
                  </div>
                  <div class="col-md-4">
                  <h3 class="content-title">Rörligt månadspris</h3>
                  <p class="font-size-12">
                      Rörligt pris, eller rörligt månadspris, fungerar ungefär som timpris. Men iställetför att din förbrukning mäts timme för timme, så
                      räknas den ihop till en månadstotal. Som sedan multipliceras med elhandelsbolagets rörliga elpris, som fastställs i slutet av
                      månaden. Det rörliga månadspriset är inte ett rakt snitt av alla timmar/dagars pris, utan viktas likt timpris timme för timme mot
                      hela kollektivets förbrukning. Ett kollektiv är i det här fallet alla kunder som har samma typ av avtal som dig, i ditt
                      elhandelsområde, hos ditt elhandelsbolag.
                  </p>
                  </div>
                </div>

                <h3 class="content-title">Skatter och avgifter</h3>

                <p class="font-size-12">
                  Om du förbrukar 1kWh, och spotpriset är 1 krona. Så kommer ditt faktiska pris att bli (1kWh*(1kr+0.10kr))*1.25=1.1*1.25=<strong>
                    1.37kr
                  </strong>
                </p>
                <p class="font-size-12">
                  Notera också, att utöver dessa 1.37, så betalar du även ca 50 öre skatt, och 20 öre moms för varje förbrukad kWh. Varje förbrukad
                  kilowatttimme kostar alltså ungefär 2 kr, vid ett spotpris på 1 kr.
                </p>
                <p class="font-size-12">
                  På den här sidan kan du välja mellan <i>faktiskt pris</i> eller{" "}
                  <i>spotpris</i>. Det gör du genom att trycka på hamburgermenyn längst uppe till vänster.
                </p>
              </div>
              */}
            </div>
            <div class="col-xl on-this-page-nav-container">
                <div class="content">
                    <InformationPane cols={12} {...commonprops} {...props.data}></InformationPane>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
