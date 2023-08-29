import { useState } from "preact/hooks";

interface PriceFactorWarningProps {
  extra: number;
  factor: number;
  multiplier: number;
  priceFactor: boolean;
  lang: string;
}

export default function PriceFactorWarning(props: PriceFactorWarningProps) {
  const [dismissed, setDismissed] = useState(localStorage.getItem("sw_warning_dismissed"));

  const doDismiss = () => {
    setDismissed("yes");
    localStorage.setItem("sw_warning_dismissed", "yes");
  };

  return (
    <div
      class={"row mt-20 mr-20" +
        ((!(props.priceFactor && (props.extra === 0 || !props.extra) && (props.factor === 1 || !props.factor)) || dismissed === "yes")
          ? " hidden"
          : "")}
    >
      <div class="alert alert-secondary" role="alert">
        <button class="close" data-dismiss="alert" onClick={() => doDismiss()} type="button" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <h4 class="alert-heading" data-t-key="common.warning.actual_price" lang={props.lang}>Currently using actual price</h4>
        <p data-t-key="common.warning.actual_price_text" lang={props.lang}>
          ... but no settings entered, check your settings using the hamburger menu.
        </p>
      </div>
    </div>
  );
}
