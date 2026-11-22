# spotweb 2

Source code of [https://spot.56k.guru](https://spot.56k.guru) – electricity spot prices, production and consumption for the Nordics and parts
of Europe, fetched from [ENTSO-e](https://transparency.entsoe.eu/) and converted with [ECB](https://www.ecb.europa.eu/) exchange rates.

Available in Swedish, Finnish, Danish, Norwegian, Spanish, French, German, Dutch and English. Each language has its own file in `locales/`.

[![CI](https://github.com/Hexagon/spotweb/actions/workflows/ci.yml/badge.svg)](https://github.com/Hexagon/spotweb/actions/workflows/ci.yml)

## What's new in 2.0

- **One self-contained binary** (Rust, axum). Templates, translations, scripts, styles and icons are embedded – no Deno, no Pup, no CDN.
- **Built-in scheduler** (fixed times in `SPOTWEB_SCHEDULE_TZ`, time zone database built into the binary) replaces the separate Pup cron processes. Jobs never overlap, have timeouts and retries,
  invalidate the in-memory cache directly when done, and are logged to the database (`/api/v2/status`).
- **SQLite with proper keys.** Every table has a primary key on its natural key and writes are upserts, so the periodic "delete
  duplicates" clean-ups are gone. Schema changes are versioned migrations.
- **Imports all history from 1.x** with one command (see [Upgrading from 1.x](#upgrading-from-1x)).
- **Same urls and API.** `/`, `/{country}`, `/{country}/{area}`, `/custom`, `/help`, `/homeassistant`, `/sitemap.xml`, `/api/v2/spot` and
  `/api/v2/hass` keep their parameters and response format. Visitor settings stored in the browser by 1.x are picked up as-is.
- **Improved interface:** faster server-rendered pages without hydration, live "right now" price that follows 15-minute intervals,
  today/tomorrow price table, cheapest 1 h / 3 h period ahead, negative prices shown in charts, CSV export, area picker for the Home
  Assistant generator, mobile friendly layout.
- **Correctness fixes:** "today" and month boundaries use each country's own time zone (Finland was on Swedish time), long-term
  statistics span the switch from hourly to 15-minute prices, zero prices are no longer dropped, outage end times are correct, country
  totals are the sum of their bidding zones.
- Signed release binaries for Linux (static, x86_64/aarch64), macOS and Windows.

## Running

```sh
API_TOKEN=your-entsoe-token ./spotweb            # same as `spotweb serve`
```

Open http://localhost:6000 (Chrome blocks port 6000 – use `--port 8080` when browsing locally). On first start with an empty database
spotweb back-fills prices since 2021, which takes a while (ENTSO-e is queried politely, one request every two seconds).

| Command                          | Description                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `spotweb serve`                  | Web server + scheduler (default). `--no-scheduler` for a read-only node. |
| `spotweb import-v1 [db/main.db]` | Import history from a 1.x database. Safe to run repeatedly.              |
| `spotweb run-job prices …`       | Run `prices`, `currency`, `load`, `production`, `flows`, `outages` once. |
| `spotweb repair-prices [AREA…]`  | Refetch months with incomplete days in stored history. `--from DATE`.    |
| `spotweb backup <file>`          | Consistent online copy, safe while running. `*.zst` is zstd-compressed.  |

### Configuration (environment)

| Variable                   | Default                  | Description                                                     |
| -------------------------- | ------------------------ | --------------------------------------------------------------- |
| `API_TOKEN`                | –                        | ENTSO-e API token (same as 1.x). Without it only ECB rates update. |
| `SPOTWEB_API_TOKEN`        | –                        | Alias for `API_TOKEN`, used when `API_TOKEN` is unset           |
| `SPOTWEB_PORT`             | `6000`                   | Listen port (same as 1.x)                                       |
| `SPOTWEB_BIND`             | `0.0.0.0`                | Listen address. Use `127.0.0.1` behind a reverse proxy.        |
| `SPOTWEB_DB`               | `db/spotweb.db`          | Database file                                                   |
| `SPOTWEB_PUBLIC_URL`       | from `Host` header       | Public base url for canonical links, sitemap, robots.txt and examples. A warning is logged at startup when unset. |
| `SPOTWEB_ADSENSE`          | –                        | AdSense client id (same as 1.x)                                 |
| `SPOTWEB_GA_ID`            | –                        | Google Analytics measurement id                                 |
| `SPOTWEB_WEBPULSE_ID`      | –                        | Webpulse Analytics site id; no tracking script when unset       |
| `SPOTWEB_SCHEDULE_TZ`      | `Europe/Stockholm`       | Time zone of the job schedule                                   |
| `SPOTWEB_HISTORY_START`    | `2021-01-01`             | First day to back-fill on an empty database                     |
| `SPOTWEB_REQUEST_DELAY_MS` | `2000`                   | Pause after each ENTSO-e request, per worker                    |
| `SPOTWEB_ENTSOE_CONCURRENCY` | `3`                    | Areas fetched from ENTSO-e at the same time (1–10)              |
| `SPOTWEB_ENTSOE_TIMEOUT_SECS` | `60`                   | Timeout per ENTSO-e request                                     |
| `SPOTWEB_CSP`              | `on`                     | Content-Security-Policy on pages: `on`, `report-only` or `off`   |
| `SPOTWEB_ACCESS_LOG`       | off                      | `1` logs every request: method, path, status and time           |
| `SPOTWEB_HTTP_SUMMARY_SECS` | `60`                    | Log HTTP counts, p50/p95 and 4xx/5xx per route this often; `0` is off |
| `SPOTWEB_NO_SCHEDULER`     | off                      | `1`/`true`/`yes`/`on` is the same as `--no-scheduler`: no scheduled data updates |
| `SPOTWEB_ENTSOE_ENDPOINT`  | `https://web-api.tp.entsoe.eu/api` | ENTSO-e API url, for a proxy or a mock in tests       |
| `SPOTWEB_ECB_ENDPOINT`     | `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml` | ECB exchange rate url, for a mirror or a mock in tests |
| `SPOTWEB_API_RATE_LIMIT`   | off                      | Requests per minute and client IP to `/api/`; over that `429` with `Retry-After` (see [deployment](docs/deployment.md#rate-limiting)) |
| `SPOTWEB_TRUSTED_PROXIES`  | –                        | Proxies (IPs or CIDRs, comma separated) whose `X-Forwarded-For`/`X-Real-IP` give the client IP, e.g. `127.0.0.1,::1` |
| `SPOTWEB_SHUTDOWN_GRACE_SECS` | `15`                 | On shutdown, wait this long for running jobs before interrupting them |
| `RUST_LOG`                 | `spotweb=info,warn`      | Log filter, `--debug` for verbose logs                          |

### Schedule

Same timing as 1.x, in `SPOTWEB_SCHEDULE_TZ` (DST changes are handled):

| Job          | When                                                              |
| ------------ | ----------------------------------------------------------------- |
| `prices`     | every hour, 12:45 and 13:15/13:30/13:45 (day-ahead auction), and at startup |
| `currency`   | 09:05 and 16:20 (after ECB publishes), and at startup             |
| `load`       | every hour at :05                                                 |
| `production` | every hour at :50                                                 |
| `flows`      | every hour at :25, half of the borders per run, so each border every second hour (two requests per border) |
| `outages`    | 08:05                                                             |

Runs only fetch what can have changed:

- `prices` skips areas whose prices are stored up to the end of tomorrow, and does not ask for tomorrow before the
  earliest day-ahead auction (11:00 CET), so the hourly runs before noon make no requests once today is complete.
  An area with a hole in yesterday or today is fetched again from that day, even when later prices are stored.
- `load`, `production` and `flows` fetch from six hours before the latest stored interval instead of all of yesterday
  and today. Once a day, at 06 local time, the whole two days are fetched again to pick up late values and revisions.
  For `flows` that is the 06 and 07 runs, one for each half of the borders. `spotweb run-job flows` fetches every
  border.
- Rows that are unchanged are not rewritten, and outages whose revision is already stored are skipped.
- When a run changed nothing, the cache is kept and the database is not re-analyzed.

## API

Free and without key. Errors are returned as HTTP 500 with `{"status":"error","details":"…"}`, as in 1.x.
Successful responses carry an `ETag`; send it back in `If-None-Match` to get an empty `304 Not Modified` while the
data is unchanged (for `/api/v2/hass` the `updated` field is not part of the tag).

`GET /api/v2/spot?period=daily&area=SE3&startDate=2024-01-01&endDate=2024-01-31[&currency=SEK][&interval=PT15M]`

```json
{ "status": "ok", "source": "ENTSO-E Transparency Platform (https://transparency.entsoe.eu/)", "data": [{ "time": 1704063600000, "price": 102.1, "min": 55.3, "max": 160.2 }] }
```

Prices are per MWh in EUR, or in `currency` (any ECB currency). `period` is `hourly` (raw intervals, as in 1.x), `daily`,
`weekly` (new), `monthly`, `yearly`, `total` (time is `null`) or `minimum`. With `interval` only that resolution is used, exactly like
1.x. Without it (new behaviour) the area's current resolution is preferred and older days fall back to what is available, so
long ranges cover both hourly and 15-minute history. Averages are time weighted.

One request covers at most 31 days for `hourly`/`minimum` and 366 days for `daily` (new); longer groupings are not limited.
Responses carry a `source` field, and a `note` when prices were converted from EUR.

`GET /api/v2/hass?area=SE3&currency=SEK[&multiplier=1][&extra=0][&factor=1][&decimals=5][&interval=PT15M]` – Home Assistant
sensor format, unchanged. `currency=ORE` (öre) is new. See `/homeassistant` for a configuration generator.

`GET /api/v2/cheapest?area=SE3&hours=3[&consecutive=false][&from=…][&to=…][&currency=SEK][&interval=PT15M]` – the
cheapest hours, for automations (new):

```json
{ "status": "ok", "source": "…", "area": "SE3", "currency": "EUR", "hours": 3.0, "consecutive": true,
  "from": "2026-11-21T14:03:12.000Z", "to": "2026-11-22T23:00:00.000Z", "found": true, "active": false,
  "start": "2026-11-22T01:00:00.000Z", "end": "2026-11-22T04:00:00.000Z", "price": 12.4,
  "windows": [{ "start": "2026-11-22T01:00:00.000Z", "end": "2026-11-22T04:00:00.000Z", "price": 12.4 }],
  "data": [{ "time": "2026-11-22T01:00:00.000Z", "price": 11.9 }] }
```

By default the cheapest unbroken run of intervals covering at least `hours` (rounded up to whole intervals) is chosen;
`consecutive=false` picks the cheapest separate intervals instead, and `windows` then lists each unbroken part. The
search runs from `from` (default now, the interval in progress included) to `to` (default the end of tomorrow in the
zone's time zone); chosen intervals end by `to`. Both take an RFC 3339 timestamp, a local time like `2026-11-22T07:00`,
or a date (`from` is the start of that day, `to` the end). At most 7 days. `price` is the time weighted average per MWh.
`active` is `true` while one of the chosen intervals is in progress, so an automation can poll it and switch on that.
When the prices do not cover `hours` yet, `found` is `false` and `start`, `end` and `price` are `null`.

`GET /api/v2/flows` – net physical flow per border right now, in MW (new):

```json
{ "status": "ok", "source": "ENTSO-E Transparency Platform (https://transparency.entsoe.eu/)", "license": "CC-BY-4.0", "updated": "2026-11-21T14:00:00.000Z", "data": [{ "from": "SE3", "to": "FI", "value": 1000.0, "time": "2026-11-21T13:00:00.000Z" }] }
```

`from` is the exporting side. Borders to neighbouring zones without prices on spotweb (GB and northern Italy) are included.

`GET /api/v2/flows?area=SE3[&start=2026-11-21][&end=2026-11-22]` or `?country=sv` – net export per neighbour and hour, in MW
(negative is import), with the sum in `net`:

```json
{ "status": "ok", "source": "…", "license": "CC-BY-4.0", "area": "SE3", "unit": "MW", "interval": "PT60M", "neighbours": ["DK1", "FI", "NO1", "SE2", "SE4"],
  "data": [{ "time": "2026-11-21T23:00:00.000Z", "net": 3463.0, "flows": { "DK1": 779.0, "FI": 834.0, "NO1": 1560.0, "SE2": -1293.0, "SE4": 1583.0 } }] }
```

Neighbours are zones for `area` and countries for `country` (borders inside the country are left out; GB and IT keep
their zone name). `start` and `end` are dates in the zone's time zone, by default yesterday and today, at most 31 days.
Hours without data are left out. Flows are kept at full resolution for 90 days and as hourly averages after that.

`GET /api/v2/status` – latest data, last job runs, `healthy`/`problems` and HTTP statistics (`http`). `GET /healthz` – liveness probe.
`GET /healthz/data` – `200` when prices are complete for today (and tomorrow after 14:00 CET) and load and generation are
current, else `503`.

Data source: [ENTSO-E Transparency Platform](https://transparency.entsoe.eu/). Re-use is subject to its
[terms of use](https://transparencyplatform.zendesk.com/hc/en-us/articles/40921911218961-Legal-Terms-and-Conditions); mention the
source when re-using the data. Physical flows are open data under CC-BY 4.0; day-ahead prices, load and generation are not on ENTSO-E's
list of freely re-usable data. spotweb is not affiliated with or endorsed by ENTSO-E.

## Upgrading from 1.x

1. Stop the 1.x Pup processes (`pup stop` / `pup uninstall --name spotweb`).
2. Install the 2.0 binary (see [Installation](#installation)).
3. Import history (1.x database is opened read-only and left untouched):

   ```sh
   spotweb --db /var/lib/spotweb/spotweb.db import-v1 /path/to/spotweb-1/db/main.db
   ```

4. Start spotweb 2. Anything newer than the imported data is fetched by the jobs on start.
5. Fill the holes in the imported history (1.x did not store intervals priced at exactly zero). With `API_TOKEN` set:

   ```sh
   spotweb --db /var/lib/spotweb/spotweb.db repair-prices
   ```

   Only months with an incomplete day are fetched again. Days ENTSO-e cannot fill are listed at the end. Safe while
   the server runs; restart it (or wait for the next price update) to drop cached results.

Rolling back is just starting 1.x again on its own database.

## Installation

Download the archive for your platform from [Releases](https://github.com/Hexagon/spotweb/releases). Each release contains
`SHA256SUMS`, a Sigstore bundle (`*.sigstore.json`) per file and GitHub build provenance. Verify before installing:

```sh
# Checksums
sha256sum --ignore-missing -c SHA256SUMS

# Signature: proves the archive was built by this repository's release workflow
cosign verify-blob \
  --bundle spotweb-v2.4.3-x86_64-unknown-linux-musl.tar.gz.sigstore.json \
  --certificate-identity-regexp '^https://github.com/Hexagon/spotweb/\.github/workflows/release\.yml@refs/tags/v' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  spotweb-v2.4.3-x86_64-unknown-linux-musl.tar.gz

# Or with the GitHub CLI (build provenance attestation)
gh attestation verify spotweb-v2.4.3-x86_64-unknown-linux-musl.tar.gz --repo Hexagon/spotweb
```

### Recommended setup (Linux, systemd)

The Linux builds are static (musl), so they run on any distribution. See [docs/deployment.md](docs/deployment.md) for the full guide;
in short:

```sh
sudo install -m 755 spotweb /usr/local/bin/spotweb
sudo useradd --system --home /var/lib/spotweb --shell /usr/sbin/nologin spotweb
sudo install -d -m 750 -o root -g spotweb /etc/spotweb
sudo install -m 640 -o root -g spotweb deploy/spotweb.env.example /etc/spotweb/spotweb.env   # set API_TOKEN
sudo cp deploy/systemd/spotweb*.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now spotweb spotweb-backup.timer
```

Put Caddy (`deploy/caddy/Caddyfile`) or nginx (`deploy/nginx/spotweb.conf`) in front for TLS.

### Docker

A signed multi-arch image (amd64, arm64) is published to GHCR with each release after 2.2.0. Verify it with cosign and
run it (details and `docker-compose.yml` in [docs/deployment.md](docs/deployment.md#docker)):

```sh
cosign verify ghcr.io/hexagon/spotweb:2.4.3 \
  --certificate-identity-regexp '^https://github.com/Hexagon/spotweb/\.github/workflows/release\.yml@refs/tags/v' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
docker run -d -p 127.0.0.1:6000:6000 -e API_TOKEN=... -v spotweb-data:/data ghcr.io/hexagon/spotweb:2.4.3
```

## Development

```sh
cargo run -- serve --port 8080 --no-scheduler   # debug builds read templates/static/locales from disk
cargo test
cargo fmt && cargo clippy --all-targets
```

The front end is plain HTML templates (`templates/`, [minijinja](https://github.com/mitsuhiko/minijinja)) and one script
(`static/assets/app.js`) using [ApexCharts](https://apexcharts.com/) (vendored, MIT). ApexCharts is only loaded on pages with
charts, when the first chart comes into view. Dependabot does not track it; update it with `scripts/update-apexcharts.sh <version>`.
Asset urls carry the file's content hash (`?v=`), so they are served as `immutable`.

The start page map (`templates/partials/map.svg`) is generated from [Natural Earth](https://www.naturalearthdata.com/) 1:10m data
(public domain) by `scripts/build_map.py`; see the script for how to rebuild it. Swedish, Norwegian and Danish bidding zones are
approximated from counties and regions, so their borders are schematic.

To release: bump `version` in `Cargo.toml`, commit, tag `vX.Y.Z` and push the tag. The release workflow builds, signs and publishes.

Pull requests are very welcome, especially for translations.

## License

MIT
