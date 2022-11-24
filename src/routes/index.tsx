import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Filter } from "../components/Filter.tsx";
import { Table } from "../components/Table.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    const 
      url = new URL(req.url),
      area = url.searchParams.get("area"),
      currency = url.searchParams.get("currency"),
      period = url.searchParams.get("period"),
      date = url.searchParams.get("date"),
      unit = url.searchParams.get("unit"),
      factor = url.searchParams.get("factor"),
      extra = url.searchParams.get("extra");

    // Fetch if input data is sane
    if (currency && area && period && date) {
      const apiUrl = 'http://localhost:8000/api/spot?' + new URLSearchParams({ currency, area, period, date }).toString();
      const resp = await fetch(apiUrl);
      if (resp.status === 404) {
        return ctx.render({result: null});
      } else {
        return ctx.render({
          result: await resp.json(),
          area, currency, period, date,
          unit, factor, extra
        });
      }
    } else {
      return ctx.render({result: null});
    }
  }
};

export default function Home(props: PageProps) {
  return (
    <html data-theme="dark">
      <Head>
        <title>Fresh App</title>
        <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css" />
        <link rel="stylesheet" href="/custom.css" />
        <script src="https://cdn.jsdelivr.net/gh/hexagon/spotprice@1.0.1/dist/spotprice.min.js" crossOrigin="anonymous"></script>
      </Head>
      <main class="container">
      <h1>Spot price tool</h1>
        <Filter 
          area={props.data.area || "SE1"}
          currency={props.data.currency || "SEK"}
          date={props.data.date || new Date().toLocaleDateString()}
          period={props.data.period || "hourly"} 
          unit={props.unit || "MWh"}
          extra={props.extra || "0.0"}
          factor={props.factor || "1.0"}
        ></Filter>
        {props.data?.result &&
          <Table resultSet={props.data.result} unit={props.unit} extra={props.extra} factor={props.factor}></Table>
        }
        {!props.data?.result &&
          <h1>Make your selection</h1>
        }
      </main>
    </html>
  );
}
