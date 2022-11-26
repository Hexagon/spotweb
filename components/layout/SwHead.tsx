import { Head } from "$fresh/runtime.ts";

export default function SwHead() {
  return (
    <Head>
      <title>Elpriset just nu - spot.56k.guru</title>
      <link rel="icon" type="image/png" href="/icon-192x192.png"></link>

      <meta http-equiv="refresh" content="160"></meta>

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
      <script src="/js/custom.js"></script>
    </Head>
  );
}
