import { ExrateApiParsedResult } from "routes/api/exrate.ts";

interface InformationPaneProps {
  unit: string;
  extra: number;
  factor: number;
  cols: number;
  currency: string;
  decimals: number;
  priceFactor: boolean;
  lang: string;
  er: ExrateApiParsedResult;
}

export default function InformationPane(props: InformationPaneProps) {
  const rsER = props.er;

  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
          <div class="content px-card m-0 pt-10 pb-20">
            <h5 data-t-key="common.information.title" lang={props.lang}>Information</h5>
            <p>
              <span data-t-key="common.information.all_history" lang={props.lang}>All history is fetched from</span>{" "}
              <a href="https://transparency.entsoe.eu/">ENTSO-e transparency platform</a>.{" "}
              <span data-t-key="common.information.currency_fetched_from" lang={props.lang}>currency conversion fetched from</span>{" "}
              <a href="https://www.ecb.europa.eu/">ECB</a>.
            </p>
            <p>
              <span data-t-key="common.information.all_values_from" lang={props.lang}>All values converted from EUR</span>{" "}
              {rsER ? (rsER.entries[props.currency == "öre" ? "SEK" : props.currency]) : ""} {props.currency == "öre" ? "SEK" : props.currency}.
            </p>
            <p data-t-key="common.information.disclaimer_and_private_use" lang={props.lang}>Only for private use, no guarantees provided.</p>
            <div class="hidden">
              <p>Läs gärna på om timpris, rörligt pris, skatter och avgifter under respektive kategori här nedanför.</p>
              <details class="collapse-panel mw-full">
                <summary class="collapse-header">
                  Timpris
                </summary>
                <div class="collapse-content">
                  Timpris, eller rörligt timpris fungerar så att du betalar för din förbrukning och ditt elpris timme för timme. På så vis kan har du
                  möjlighet att använda mindre el under dyra timmar, och mer el under billiga timmar. Ett bra val för dig som har möjlighet att flytta
                  stora förbrukare (t.ex. uppvärmning, eller laddning av elbil) till tidpunkter när elen är billig. Har du små mölighete att flytta
                  förbrukning, så kan det här istället bli ett dyrare, eller åtminstone mer stressande alternativ än månadspris.
                </div>
              </details>
              <details class="collapse-panel mw-full">
                <summary class="collapse-header">
                  Rörligt månadspris
                </summary>
                <div class="collapse-content">
                  Rörligt pris, eller rörligt månadspris, fungerar ungefär som timpris. Men iställetför att din förbrukning mäts timme för timme, så
                  räknas den ihop till en månadstotal. Som sedan multipliceras med elhandelsbolagets rörliga elpris, som fastställs i slutet av
                  månaden. Det rörliga månadspriset är inte ett rakt snitt av alla timmar/dagars pris, utan viktas likt timpris timme för timme mot
                  hela kollektivets förbrukning. Ett kollektiv är i det här fallet alla kunder som har samma typ av avtal som dig, i ditt
                  elhandelsområde, hos ditt elhandelsbolag.
                </div>
              </details>
              <details class="collapse-panel mw-full">
                <summary class="collapse-header">
                  Spotpris, skatter och avgifter
                </summary>
                <div class="collapse-content">
                  <p class="font-size-12">
                    Spotpriset är det pris ditt elhandelsbolag får betala för elen, det är oftast den här siffran som visas i olika jämförelser,
                    tidningsartiklar m.m.
                  </p>
                  <p class="font-size-12">
                    Spotpriset inkluderar <strong>inte</strong> eventuella påslagsavgifter, och moms.
                  </p>
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
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
