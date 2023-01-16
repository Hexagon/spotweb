import { asset, Head } from "$fresh/runtime.ts";
import { Area, Country, DataArea } from "config/countries.ts";
import { maxPrice, minPrice, processPrice } from "utils/price.ts";
import { avgPrice } from "utils/price.ts";
import { applyExchangeRate } from "utils/price.ts";
import { locale_kit } from "localekit_fresh";
import { PageProps } from "$fresh/server.ts";
import { preferences } from "config/preferences.js";

interface HeadProps extends PageProps {
  title: string;
  page: string;
  country?: Country;
  area?: DataArea;
}

export default function SwHead(props: HeadProps) {

  const priceProps = {
    currency: preferences.currency(props.data.lang) == "öre" ? "SEK" : preferences.currency(props.data.lang),
    unit: preferences.unit(),
    factor: 1,
    extra: 0,
    decimals: 5,
    priceFactor: false
  }

  let jsonLdPriceFlag = true;
  let jsonLdPriceDocument = "";

  if (props.data.area) {
    const 
      dataTodayExchanged = applyExchangeRate(props.data.area.dataToday, props.data.er, priceProps.currency),
      maxPriceResult = processPrice(maxPrice(dataTodayExchanged), priceProps),
      minPriceResult = processPrice(minPrice(dataTodayExchanged), priceProps),
      avgPriceResult = processPrice(avgPrice(dataTodayExchanged), priceProps);
    
    jsonLdPriceFlag = true;
    jsonLdPriceDocument = `
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

  const jsonLdPageDocument = `
  {
      "@context": "http://schema.org",
      "@type": "WebPage",
      "name": "${locale_kit.t("common.page.title",{ lang: props.data.lang })}",
      "description": "${locale_kit.t("common.header.title",{ lang: props.data.lang })} - ${props.title}.",
      "datePublished": "${new Date().toLocaleDateString('sv-SE')}",
      "dateModified": "${new Date().toLocaleDateString('sv-SE')}"
  }`;

  return (
    <Head>
      <title>{locale_kit.t("common.page.title",{ lang: props.data.lang })}  - {props.title}</title>
      <link rel="icon" type="image/png" href={asset("/icon-192x192.png")}></link>
      <meta name="description" content={locale_kit.t("common.header.title",{ lang: props.data.lang }) + " - " + props.title} />

      {/* Halfmoon CSS */}
      <link
        href="https://cdn.jsdelivr.net/npm/halfmoon@1.1.1/css/halfmoon.min.css"
        rel="stylesheet"
      />
      <script src="https://cdn.jsdelivr.net/npm/halfmoon@1.1.1/js/halfmoon.min.js"></script>

      {/* Font awesome */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css" integrity="sha512-MV7K8+y+gLIBoVD59lQIYicR65iaqukzvf/nwasF0nqhPay5w/9lJmVM2hMDcnK1OnMGCdVK+iQrJ7lzPJQd1w==" crossOrigin="anonymous" referrerpolicy="no-referrer" />

      {/* Apexcharts */}
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

      {/* highlight.js */}
      { props.page === "homeassistant" && (
        <>
          <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/dark.min.css"></link>
          <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
          <script>hljs.highlightAll();</script>
        </>
      )}

      {/* PWA-related */}
      <script type="module" src={asset("/initworker.js")}></script>
      <link rel="manifest" href={asset("/manifest.json")}></link>

      {/* Styles */}
      <link href="https://fonts.cdnfonts.com/css/seven-segment" rel="stylesheet"></link>
      <link rel="stylesheet" href={asset("/css/custom.css")}></link>

      {/* json ld page descriptor, available on all pages */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdPageDocument }}></script>

      {/* json ld price descriptor, only visible for area page type*/}
      { jsonLdPriceFlag && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdPriceDocument }}></script>
      )}
    </Head>
  );
}
