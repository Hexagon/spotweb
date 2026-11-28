# News

spotweb shows news about electricity prices written by an external writer on the same server (an editor, a script or
an AI agent) and pushed through the local news service. spotweb does not write any news by itself (it did in 2.8.0;
those items are removed by migration 9 when upgrading).

## Where news appears

| Url | What |
| --- | ---- |
| `/news` | Global news: items about no particular country |
| `/news/{country}` | News for one country (`/news/sv`), including its zones' items |
| `/news/{id}` | One item, with `NewsArticle` and `BreadcrumbList` structured data |
| `/news/feed.xml?lang=sv` | Atom feed of the global news; `&country=sv` or `&area=SE3` for a country or zone |
| `/api/v2/news` | JSON, see below |
| start, country and zone pages | a box with the latest global, country or zone items, and the feed in `<head>` |

Every page takes `?lang=` like the rest of the site. Items of importance 2 or more are indexed by search engines; those
of the last 30 days and the list pages are in `sitemap.xml`. Routine items (importance 1) get `noindex, follow`.

## Pushing news from the server (local news service)

News can only be loaded on the server itself. Set `SPOTWEB_NEWS_BIND` to a loopback address and spotweb starts a
second, local listener there with the write routes. Other addresses are refused at startup, and the public port has
no write routes at all. With `SPOTWEB_NEWS_TOKEN` set, requests also need `Authorization: Bearer <token>`.

```sh
SPOTWEB_NEWS_BIND=127.0.0.1:6001
SPOTWEB_NEWS_TOKEN=some-long-random-string   # optional
```

### `POST /api/v2/news` (local service)

Adds an item, or replaces the one with the same `day` and `slug`. The first publication time is kept on replace.

```json
{
  "slug": "cold-week-ahead",
  "day": "2026-11-29",
  "area": "SE3",
  "importance": 2,
  "texts": {
    "sv": { "title": "Kall vecka väntas höja elpriset i SE3", "paragraphs": ["...", "..."] },
    "en": { "title": "Cold week expected to raise prices in SE3", "paragraphs": ["...", "..."] }
  },
  "facts": { "avg_tomorrow_eur_mwh": 85.2, "source": "spotweb /api/v2/spot" },
  "ai_generated": true
}
```

| Field | Required | |
| ----- | -------- | - |
| `slug` | yes | `a-z`, `0-9` and `-`, 3–80 characters. The id becomes `{day}-{slug}`. |
| `texts` | yes | per language code (`sv fi no dk de en nl fr es it pl pt`): `title` (≤ 200 characters) and 1–20 `paragraphs` (≤ 2000 each). Plain text; html is escaped. |
| `day` | no | `YYYY-MM-DD` the item is about, default today |
| `area` | no | zone (`SE3`); sets the country too |
| `country` | no | country id (`sv`) for a country item without a zone |
| `importance` | no | 1 routine (not indexed), 2 notable (default), 3 important (highlighted) |
| `published` | no | ms since the epoch, default now, at most a day ahead |
| `facts` | no | any JSON, kept with the item and returned by `/api/v2/news` |
| `ai_generated` | no | `true` when the text was written by an AI system, default `false`; returned by `/api/v2/news` |

Without `area` and `country` the item is **global** and appears on `/news`, the start page and the global feed.
With them it appears for that country or zone only.

**An item is only shown in the languages it has texts for.** Lists and feeds in other languages leave it out, its page
redirects to the English version (or its first language), and `hreflang` lists only its languages. Country news can
therefore be published in that country's languages only.

Answer: `{"status": "ok", "id": "2026-11-29-cold-week-ahead", "url": "/news/2026-11-29-cold-week-ahead"}`, or
`400` with `details`.

### `DELETE /api/v2/news/{id}` (local service)

Removes an item.

### `GET /api/v2/news` (public and local)

Items newest first: `lang` (text language, default `en`), `area`, `country` (`country=` with an empty value gives
global items), `day`, `min_importance`, `before` (ms, for paging), `limit` (≤ 100). Only items that exist in `lang`
are listed. Each item has `id`, `area`, `country`, `day`, `published`, `updated`, `importance`, `url`, `title`,
`summary`, `ai_generated` and in `data` the texts and facts that were pushed.

### Data for a writer

Everything a writer needs is in the public API, which it can read locally (`http://127.0.0.1:6000`):
`/api/v2/spot` (history, any grouping and currency), `/api/v2/hass` (yesterday, today, tomorrow per kWh),
`/api/v2/cheapest`, `/api/v2/flows`, `/api/v2/reservoirs`, `/api/v2/status` (data freshness) and `/api/v2/news`
(what has already been written, with its facts).

The local news service also has a closed API under `/api/v2/local/` with views of the same data that are easier to
write from. It is only served there (never on the public port) and needs the token when `SPOTWEB_NEWS_TOKEN` is set.
Prices are EUR/MWh, power MW, times ms since the epoch. Bad parameters (an unknown zone, a bad date) give `400`.

#### `GET /api/v2/local/day[?day=YYYY-MM-DD][&area=SE3|country=sv]`

Every zone with prices on the day (each zone's local day; default today, CET), in one call:

- `avg`, `min`, `max`, `complete` (the day is covered, one hour may be missing), `interval`
- `cheapest_hour` and `priciest_hour`: the cheapest and most expensive full hour (`start`, `end`, `avg`)
- `negative`: time with negative prices (`ms`, `first`, `last`)
- `history`, computed from the stored days before it:
  - `prev_day` and `prev_7_days`: their average, `diff` and `pct`
  - `high_since` and `low_since`: the last day with an average at least as high (as low), and the `days` since; with
    `record: true` and `date: null` when no day of the history comes close
  - `max_since` and `min_since`: the same for the highest and lowest interval of the day
  - `percentile_30`, `percentile_365` and `percentile_all`: share of earlier days with a lower average (ties count half)

`overview` has the cheapest and most expensive zone, the average and median of the zones with complete prices and the
zones with negative prices.

#### `GET /api/v2/local/outages[?area=SE3|country=sv][&from=YYYY-MM-DD][&to=YYYY-MM-DD][&published_since=ms]`

Outages (ENTSO-e unavailability of generation and production units) that overlap the days, default from now to 30
days ahead; cancelled and withdrawn ones are left out. Newest publication first. Each has the document `id` (mRID),
`ts` (TimeSeries in the document), `revision`, `published` (when ENTSO-e received the revision), `area`, `country`,
`type` (`Planned maintenance`, `Unplanned outage`), `start`, `end`, `active`, `resource`, `unit`, `fuel`,
`nominal_mw`, `available_mw_min`, `available_mw_now`, `unavailable_mw_max`, `unavailable_mw_now`, `reason_code`,
`reason` and the reported `availability` blocks `[start, end, MW]`. `published_since` gives only revisions published
after a time, for example since the last run.

Outages stored before 2.10 have no zone and publication time; they get them the next time outages are fetched
(daily 08:05). Until then `area` is only set for countries with one zone.

#### `GET /api/v2/local/zones[?area=SE3|country=sv]`

The state of every zone right now: `price_now`, `today` and `tomorrow` (`avg`, `min`, `max`, `complete`),
`neighbours` (zones with a border, also outside spotweb), `generation` (`total_mw`, `load_mw`, `net_mw`, `by_type_mw`
per production type, renewable and fossil free share and carbon intensity in `derived`), `flows_mw` (net export per
neighbour, positive is export) and `reservoir` (latest week, `vs_median_pct`, `stale`).

#### Dry run

`POST /api/v2/news?dry_run=1` checks an item like a real push and answers with the `id`, `url`, whether it would
`replace` an existing item, whether it would be indexed, the stored row and the text as rendered per language, without
storing anything.

#### Not available

Wind, solar and load forecasts are not fetched from ENTSO-e, so spotweb has none to offer.
