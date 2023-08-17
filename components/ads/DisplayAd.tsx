import { CommonProps } from "utils/common.ts";
import { useEffect } from "preact/hooks";

// deno-lint-ignore no-empty-interface
interface DisplayAdProps extends CommonProps {

}

export default function DisplayAd(props: DisplayAdProps) {
  
  useEffect(() => {
    // deno-lint-ignore no-explicit-any
    const adsbygoogle = (window as unknown as any).adsbygoogle || [];
    adsbygoogle.push({});
  });

  return props.adsense && (
    <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-9224018205432249"
        data-ad-slot="7417217449"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
  );
}
