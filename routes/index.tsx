import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    // Redirect the user to the default country of their language, do not allow en as it does not
    // have it's own page
    if (ctx.state.lang === "en") ctx.state.lang = "sv";
    return new Response("", {
      status: 307,
      headers: { Location: "/" + ctx.state.lang },
    });
  },
};
