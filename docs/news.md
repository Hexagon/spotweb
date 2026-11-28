# News

spotweb writes short news items about electricity prices by itself and can also show items written by an external
writer on the same server (an editor, a script or an AI agent). Both kinds appear on the same pages and feeds.

## Where news appears

| Url | What |
| --- | ---- |
| `/news` | Global news: items about no particular country (the daily Europe overview and pushed global items) |
| `/news/{country}` | News for one country (`/news/sv`): its zones' daily reports and month summaries, and pushed items for that country |
| `/news/{id}` | One item, with `NewsArticle` and `BreadcrumbList` structured data |
| `/news/feed.xml?lang=sv` | Atom feed of the global news; `&country=sv` or `&area=SE3` for a country or zone |
| `/api/v2/news` | JSON, see below |
| start, country and zone pages | a box with the latest global, country or zone items, and the feed in `<head>` |

Every page takes `?lang=` like the rest of the site. Recent indexable items and the list pages are in `sitemap.xml`.

## Built-in items

The `news` job runs every hour at :10, right after every `prices` run, and at startup. It reads only the
database (no ENTSO-e requests). It is idempotent: items have a fixed id and are only rewritten when their facts change.
On an empty table it fills the last 30 days and 3 months, so a new installation starts with an archive.

| Kind | Id | When |
| ---- | -- | ---- |
| `day` | `2026-11-29-se3` | per zone and delivery day, once the day's prices are complete (normally tomorrow, from about 13:00 CET) |
| `europe` | `2026-11-29-europe` | per delivery day, once 75 % of the zones are complete: cheapest and most expensive zone, average, zones with negative prices |
| `month` | `2026-11-se3` | per zone and finished month: average, min, max, compared with the month before and the same month a year earlier |

The headline of a `day` item is the most notable fact: negative prices for at least an hour, the highest or lowest
daily average for at least 90 days, a change of at least 25 % and 10 EUR/MWh against the day before, a record for at
least 30 days, or else the plain average. Importance is 3 for records of a year or more and four or more hours of
negative prices, 2 for any record, negative price or big change, 1 otherwise.

The items are stored as facts (`news.data`, prices in EUR/MWh) and written with the templates under `pages.news` in
`locales/*.json` when shown, so they exist in every language and in the currency of the page. Prices are
`<span data-eur>` and follow the visitor's currency setting.

Search engines: routine `day` items (importance 1) are `noindex, follow` and left out of the sitemap. They are many
and alike, and the zone page already answers "price tomorrow". Notable days, Europe overviews, month summaries and
pushed items of importance 2 or more are indexed.

Turn the built-in items off with `SPOTWEB_NEWS_AUTO=0`, for example when an external writer covers everything.

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
  "facts": { "avg_tomorrow_eur_mwh": 85.2, "source": "spotweb /api/v2/spot" }
}
```

| Field | Required | |
| ----- | -------- | - |
| `slug` | yes | `a-z`, `0-9` and `-`, 3–80 characters; zone names and `europe` are reserved. The id becomes `{day}-{slug}`. |
| `texts` | yes | per language code (`sv fi no dk de en nl fr es it pl pt`): `title` (≤ 200 characters) and 1–20 `paragraphs` (≤ 2000 each). Plain text; html is escaped. |
| `day` | no | `YYYY-MM-DD` the item is about, default today |
| `area` | no | zone (`SE3`); sets the country too |
| `country` | no | country id (`sv`) for a country item without a zone |
| `importance` | no | 1 routine (not indexed), 2 notable (default), 3 important (highlighted) |
| `published` | no | ms since the epoch, default now, at most a day ahead |
| `facts` | no | any JSON, kept with the item and returned by `/api/v2/news` |

Without `area` and `country` the item is **global** and appears on `/news`, the start page and the global feed.
With them it appears for that country or zone only.

**An item is only shown in the languages it has texts for.** Lists and feeds in other languages leave it out, its page
redirects to the English version (or its first language), and `hreflang` lists only its languages. Country news can
therefore be published in that country's languages only.

Answer: `{"status": "ok", "id": "2026-11-29-cold-week-ahead", "url": "/news/2026-11-29-cold-week-ahead"}`, or
`400` with `details`.

### `DELETE /api/v2/news/{id}` (local service)

Removes a pushed item. Built-in items cannot be removed (the job would write them again).

### `GET /api/v2/news` (public and local)

Items newest first: `lang` (text language, default `en`), `area`, `country` (`country=` with an empty value gives
global items), `kind` (`day`, `month`, `europe`, `custom`), `day`, `min_importance`, `before` (ms, for paging),
`limit` (≤ 100). Each item has `id`, `kind`, `area`, `country`, `day`, `published`, `updated`, `importance`, `url`,
`title`, `summary` and the facts in `data` (EUR/MWh for built-in items).

### Data for a writer

Everything a writer needs is in the public API, which it can read locally (`http://127.0.0.1:6000`):
`/api/v2/spot` (history, any grouping and currency), `/api/v2/hass` (yesterday, today, tomorrow per kWh),
`/api/v2/cheapest`, `/api/v2/flows`, `/api/v2/reservoirs`, `/api/v2/status` (data freshness) and `/api/v2/news`
(what has already been written, with its facts).
