import { CommonProps } from "../utils/common.ts";

interface InformationPaneProps extends CommonProps {
  cols: number;
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
          </div>
        </div>
      </div>
    </div>
  );
}
