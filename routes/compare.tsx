import { Handlers, PageProps } from "$fresh/server.ts";
import CompareIsland from "../islands/CompareIsland.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    const url = new URL(req.url),
      area = url.searchParams.get("area"),
      currency = url.searchParams.get("currency"),
      period = url.searchParams.get("period"),
      startDate = url.searchParams.get("startDate"),
      endDate = url.searchParams.get("endDate");

    // Fetch if input data is sane
    return ctx.render({
      permission: ctx.state.data,
      area,
      currency,
      period,
      startDate,
      endDate,
    });
  },
};

export default function Compare(props: PageProps) {
  return <CompareIsland {...props}></CompareIsland>;
}
