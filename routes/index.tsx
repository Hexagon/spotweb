import { Handlers } from "fresh/server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    // Redirect the user to the default country of their language
    return new Response("", {
      status: 307,
      headers: { Location: "/" + ctx.state.lang },
    });
  },
};
