import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {

    // If ctx.state.lang is empty, default to "sv"
    ctx.state.lang = ctx.state.lang || "sv";

    // Redirect the user to the default country of their language
    return new Response("", {
      status: 307,
      headers: { Location: "/" + ctx.state.lang },
    });
  },
};
