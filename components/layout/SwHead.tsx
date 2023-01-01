import { Head } from "fresh/runtime.ts";
import { DataArea } from "../../config/countries.ts";
import { CommonProps, ExtPageProps, processResultSet } from "../../utils/common.ts";
import { maxPrice, minPrice, processPrice } from "../../utils/price.ts";
import { avgPrice } from "../../utils/price.ts";
import { applyExchangeRate } from "../../utils/price.ts";
import { locale_kit } from "localekit_fresh";
import { PageProps } from "fresh/server.ts";
import { preferences } from "../../config/preferences.js";
import languageConfig from "config/translate.config.ts";

interface HeadProps extends CommonProps {
  title: string;
  area?: DataArea;
}

export default function SwHead(props: PageProps<ExtPageProps | HeadProps>) {

  const priceProps = {
    currency: preferences.currency(props.data.lang) == "öre" ? "SEK" : preferences.currency(props.data.lang),
    unit: preferences.unit(),
    factor: 1,
    extra: 0,
    decimals: 5,
    priceFactor: false
  }

  let jsonLdFlag = true;
  let jsonLdDocument = "";

  if (props.data.area) {
    const 
      dataTodayExchanged = applyExchangeRate(processResultSet(props.data.area.dataToday), props.data.er, priceProps.currency),
      maxPriceResult = processPrice(maxPrice(dataTodayExchanged), priceProps),
      minPriceResult = processPrice(minPrice(dataTodayExchanged), priceProps),
      avgPriceResult = processPrice(avgPrice(dataTodayExchanged), priceProps);
    
    jsonLdFlag = true;
    jsonLdDocument = `
    {
      "@context": "https://schema.org",
      "@type": "UnitPriceSpecification",
      "@id": "UnitPriceSpecification",
      "maxPrice": "${maxPriceResult}",
      "minPrice": "${minPriceResult}",
      "name": "${locale_kit.t("common.header.avg_today_short",{ lang: props.data.lang })} ${props.data.area.name} - ${props.data.area.long}",
      "price": "${avgPriceResult}",
      "priceCurrency": [
        "${priceProps.currency}"
      ],
      "unitCode": "${priceProps.unit}",
      "validFrom": "${new Date().toLocaleDateString('sv-SE')}",
      "validThrough": "${new Date().toLocaleDateString('sv-SE')}"
    }`;

  }

  return (
    <Head>
      <title>{locale_kit.t("common.page.title",{ lang: props.data.lang })}  - {props.title}</title>
      <link rel="icon" type="image/png" href="/icon-192x192.png"></link>

      <meta name="description" content={"Se aktuellt timpris och månadspris i " + props.title + ". Visar både spotpris eller faktiskt pris."} />

      <link
        href="https://cdn.jsdelivr.net/npm/halfmoon@1.1.1/css/halfmoon.min.css"
        rel="stylesheet"
      />
      <script src="https://cdn.jsdelivr.net/npm/halfmoon@1.1.1/js/halfmoon.min.js"></script>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/apexcharts/3.36.3/apexcharts.min.css"
        integrity="sha512-tJYqW5NWrT0JEkWYxrI4IK2jvT7PAiOwElIGTjALSyr8ZrilUQf+gjw2z6woWGSZqeXASyBXUr+WbtqiQgxUYg=="
        crossOrigin="anonymous"
        referrerpolicy="no-referrer"
      />
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/apexcharts/3.36.3/apexcharts.min.js"
        integrity="sha512-sa449wQ9TM6SvZV7TK7Zx/SjVR6bc7lR8tRz1Ar4/R6X2jOLaFln/9C+6Ak2OkAKZ/xBAKJ94dQMeYa0JT1RLg=="
        crossOrigin="anonymous"
        referrerpolicy="no-referrer"
      >
      </script>
      <script type="module" src="/initworker.js"></script>
      <link rel="manifest" href="/manifest.json"></link>
      <link href="https://fonts.cdnfonts.com/css/seven-segment" rel="stylesheet"></link>
      <link rel="stylesheet" href="/css/custom.css"></link>
      { jsonLdFlag && (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdDocument }}></script>
      )}
    </Head>
  );
}
