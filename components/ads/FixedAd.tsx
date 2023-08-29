import { CommonProps } from "utils/common.ts";
import { useEffect } from "preact/hooks";

// deno-lint-ignore no-empty-interface
interface FixedAdProps extends CommonProps {

}

export default function FixedAd(props: FixedAdProps) {
  
  useEffect(() => {
    // deno-lint-ignore no-explicit-any
    const adsbygoogle = (window as unknown as any).adsbygoogle || [];
    adsbygoogle.push({});
  });

  if (props.adsense) {
    return (
      <ins class="adsbygoogle"
          style="display:inline-block;width:728px;height:90px"
          data-ad-client="ca-pub-9224018205432249"
          data-ad-slot="8951211842"></ins>
    )
  }

  return null
}
