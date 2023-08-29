import { CommonProps } from "utils/common.ts";
import { useEffect } from "preact/hooks";

interface MultiPlexAdProps extends CommonProps {
  cols: number;
}

export default function MultiPlexAd(props: MultiPlexAdProps) {
  
  useEffect(() => {
    // deno-lint-ignore no-explicit-any
    const adsbygoogle = (window as unknown as any).adsbygoogle || [];
    adsbygoogle.push({});
  });

  if (props.adsense) {
    return (
      <div class={`col-lg-${props.cols} m-0 p-0`}>
        <div class="mw-full m-0 p-0 mr-20 mt-20">
          <div class="card p-0 m-0 text-center">
            <ins class="adsbygoogle"
                style="display:block"
                data-ad-format="autorelaxed"
                data-ad-client="ca-pub-9224018205432249"
                data-ad-slot="9853677086"></ins>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
