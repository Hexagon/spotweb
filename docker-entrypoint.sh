#!/bin/sh
echo "Starting spotweb (production mode)"
mkdir -p /spotweb/cache
cd /spotweb/
deno run --allow-read --allow-write --allow-net --allow-env /spotweb/spotweb.ts