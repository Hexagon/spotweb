//! Automatic news: short reports generated from the stored spot prices.
//!
//! Items are stored as language independent facts (`news.data`, prices in EUR/MWh) and
//! rendered with the translations in `locales/*.json` (`pages.news.*`) when they are shown,
//! so every item exists in every language, in the currency of the page.
//!
//! Kinds:
//! - `day`: one per bidding zone and delivery day, once the day's prices are complete
//!   (normally tomorrow, from about 13:00 CET). The headline picks the most notable fact:
//!   negative prices, the highest or lowest daily average for a long time, or a big change.
//! - `europe`: one per delivery day, the cheapest and most expensive zones.
//! - `month`: one per zone and finished calendar month, compared with the month before and
//!   the same month a year earlier.

use std::collections::BTreeMap;

use jiff::civil::Date;
use jiff::tz::TimeZone;
use jiff::ToSpan;
use serde_json::{json, Value};

use crate::countries::{default_currency, default_decimals, Area, Country, COUNTRIES};
use crate::db::queries::{self, ExchangeRates, NewsRow};
use crate::i18n::I18n;
use crate::price::{Grouping, IntervalMode};
use crate::timeutil::{add_days, day_range, local_midnight, market_tz, now_ms, today, HOUR_MS};
use crate::App;

/// Days looked at in a normal run: today and tomorrow
const DAYS_AHEAD: i64 = 1;
/// Days generated when the news table is empty, so a new installation starts with an archive
const BACKFILL_DAYS: i64 = 30;
/// Months generated when the news table is empty
const BACKFILL_MONTHS: i64 = 3;
/// A daily average is a "record" when it is the highest (lowest) for at least this many days
const RECORD_DAYS: i64 = 30;
/// ... and a big one from here
const BIG_RECORD_DAYS: i64 = 90;
/// Change against the day before that makes a headline, in percent and EUR/MWh
const BIG_CHANGE_PCT: f64 = 25.0;
const BIG_CHANGE_EUR: f64 = 10.0;
/// Below this average (EUR/MWh) of the day before, percentages say little
const MIN_BASE_EUR: f64 = 5.0;
/// Share of all zones that must have a complete day for the Europe item
const EUROPE_MIN_SHARE: f64 = 0.75;

fn r3(v: f64) -> f64 {
    (v * 1000.0).round() / 1000.0
}

/// Daily average, min and max (EUR/MWh) and the length of the day in ms
#[derive(Debug, Clone, Copy)]
pub struct DayStat {
    pub date: Date,
    pub avg: f64,
    pub min: f64,
    pub max: f64,
    pub len: i64,
}

/// Last day before `day` whose average was at least (`high`) or at most the average of
/// `day`, or the first day of the history when there is none. `None` without history.
fn since(history: &[DayStat], day: &DayStat, high: bool) -> Option<Date> {
    let before: Vec<&DayStat> = history.iter().filter(|d| d.date < day.date).collect();
    let first = before.first()?.date;
    Some(
        before
            .iter()
            .rev()
            .find(|d| {
                if high {
                    d.avg >= day.avg
                } else {
                    d.avg <= day.avg
                }
            })
            .map(|d| d.date)
            .unwrap_or(first),
    )
}

fn days_between(a: Date, b: Date) -> i64 {
    (b - a).get_days() as i64
}

/// Facts of one zone and day. `rows` are the day's intervals `(start, EUR/MWh, ms)`.
pub fn day_facts(rows: &[(i64, f64, i64)], day: &DayStat, history: &[DayStat]) -> (Value, i64) {
    let prev = history
        .iter()
        .find(|d| d.date == add_days(day.date, -1))
        .map(|d| d.avg);
    let pct = prev
        .filter(|p| p.abs() >= MIN_BASE_EUR)
        .map(|p| (day.avg - p) / p.abs() * 100.0);
    let big_change = match (pct, prev) {
        (Some(pct), Some(p)) => {
            pct.abs() >= BIG_CHANGE_PCT && (day.avg - p).abs() >= BIG_CHANGE_EUR
        }
        _ => false,
    };
    let gap = |high: bool| since(history, day, high).map(|s| (s, days_between(s, day.date)));
    let (high, low) = (gap(true), gap(false));
    let high_gap = high.map(|h| h.1).unwrap_or(0);
    let low_gap = low.map(|l| l.1).unwrap_or(0);
    let neg_ms: i64 = rows.iter().filter(|r| r.1 < 0.0).map(|r| r.2).sum();

    let window = |rows: &[(i64, f64, i64)]| {
        crate::price::cheapest(rows, HOUR_MS, true).and_then(|w| {
            let start = w.first()?.0;
            let last = w.last()?;
            Some(json!([
                start,
                last.0 + last.2,
                r3(crate::price::weighted_avg(&w)?)
            ]))
        })
    };
    let cheap = window(rows);
    let negated: Vec<_> = rows.iter().map(|&(t, p, d)| (t, -p, d)).collect();
    let peak = window(&negated).map(|v| json!([v[0], v[1], -v[2].as_f64().unwrap_or(0.0)]));

    let headline = if neg_ms >= HOUR_MS {
        "negative"
    } else if high_gap >= BIG_RECORD_DAYS {
        "high"
    } else if low_gap >= BIG_RECORD_DAYS {
        "low"
    } else if big_change {
        if pct.unwrap_or(0.0) > 0.0 {
            "up"
        } else {
            "down"
        }
    } else if high_gap >= RECORD_DAYS {
        "high"
    } else if low_gap >= RECORD_DAYS {
        "low"
    } else {
        "default"
    };
    let importance = if high_gap >= 365 || low_gap >= 365 || neg_ms >= 4 * HOUR_MS {
        3
    } else if high_gap >= RECORD_DAYS || low_gap >= RECORD_DAYS || neg_ms > 0 || big_change {
        2
    } else {
        1
    };
    let record = |g: Option<(Date, i64)>| g.filter(|g| g.1 >= RECORD_DAYS).map(|g| g.0.to_string());
    (
        json!({
            "avg": r3(day.avg),
            "min": r3(day.min),
            "max": r3(day.max),
            "prev": prev.map(r3),
            "pct": pct.map(|p| p.round() as i64),
            "cheap": cheap,
            "peak": peak,
            "neg_ms": neg_ms,
            "high_since": record(high),
            "low_since": record(low),
            "headline": headline,
        }),
        importance,
    )
}

/// Time weighted average of the days of `month` (first day), when at most one day is missing
fn month_avg(history: &[DayStat], month: Date) -> Option<(f64, f64, f64)> {
    let days: Vec<&DayStat> = history
        .iter()
        .filter(|d| d.date.first_of_month() == month)
        .collect();
    if (days.len() as i64) < month.days_in_month() as i64 - 1 {
        return None;
    }
    let w: i64 = days.iter().map(|d| d.len).sum();
    let avg = days.iter().map(|d| d.avg * d.len as f64).sum::<f64>() / w as f64;
    let min = days.iter().map(|d| d.min).fold(f64::INFINITY, f64::min);
    let max = days.iter().map(|d| d.max).fold(f64::NEG_INFINITY, f64::max);
    Some((avg, min, max))
}

fn pct_change(now: f64, before: f64) -> Option<i64> {
    (before.abs() >= MIN_BASE_EUR).then(|| ((now - before) / before.abs() * 100.0).round() as i64)
}

/// Facts of one zone and finished month (first day `month`)
pub fn month_facts(history: &[DayStat], month: Date) -> Option<(Value, i64)> {
    let (avg, min, max) = month_avg(history, month)?;
    let prev_m = month.checked_sub(1.month()).ok()?;
    let year_m = month.checked_sub(1.year()).ok()?;
    let prev = month_avg(history, prev_m).map(|m| m.0);
    let year = month_avg(history, year_m).map(|m| m.0);
    let pct_prev = prev.and_then(|p| pct_change(avg, p));
    let pct_year = year.and_then(|p| pct_change(avg, p));
    let importance =
        if pct_prev.is_some_and(|p| p.abs() >= 25) || pct_year.is_some_and(|p| p.abs() >= 40) {
            2
        } else {
            1
        };
    Some((
        json!({
            "avg": r3(avg), "min": r3(min), "max": r3(max),
            "prev": prev.map(r3), "pct_prev": pct_prev,
            "year": year.map(r3), "pct_year": pct_year,
        }),
        importance,
    ))
}

/// Facts of all of Europe for one day from the zones with a complete day
pub fn europe_facts(zones: &[(&str, f64, f64)]) -> Option<(Value, i64)> {
    let total: usize = COUNTRIES.iter().map(|c| c.areas.len()).sum();
    if zones.is_empty() || (zones.len() as f64) < total as f64 * EUROPE_MIN_SHARE {
        return None;
    }
    let cmp = |a: &&(&str, f64, f64), b: &&(&str, f64, f64)| a.1.total_cmp(&b.1);
    let cheap = zones.iter().min_by(cmp)?;
    let exp = zones.iter().max_by(cmp)?;
    let avg = zones.iter().map(|z| z.1).sum::<f64>() / zones.len() as f64;
    let negative: Vec<&str> = zones.iter().filter(|z| z.2 < 0.0).map(|z| z.0).collect();
    Some((
        json!({
            "zones": zones.len(),
            "avg": r3(avg),
            "cheap": [cheap.0, r3(cheap.1)],
            "exp": [exp.0, r3(exp.1)],
            "negative": negative,
        }),
        2,
    ))
}

/// When an item would normally have been published: the day-ahead results at 13:00 CET the
/// day before, a month item just after the month. Items generated late (a new installation
/// filling its archive) get that time instead of now, so the archive is in order.
fn natural_time(kind: &str, day: Date) -> i64 {
    let tz = market_tz();
    let (d, h) = match kind {
        "month" => (day.checked_add(1.month()).unwrap_or(day), 1),
        _ => (add_days(day, -1), 13),
    };
    local_midnight(&tz, d).timestamp().as_millisecond() + h * HOUR_MS
}

fn published_time(kind: &str, day: Date, now: i64) -> i64 {
    let t = natural_time(kind, day);
    if t < now - 6 * HOUR_MS {
        t
    } else {
        now
    }
}

fn item(
    kind: &str,
    area: Option<(&Country, &Area)>,
    day: Date,
    label: String,
    data: Value,
    importance: i64,
) -> NewsRow {
    let now = now_ms();
    let (a, c) = area.map(|(c, a)| (a.name, c.id)).unwrap_or(("", ""));
    let slug = if a.is_empty() {
        "europe".to_string()
    } else {
        a.to_lowercase()
    };
    NewsRow {
        id: format!("{label}-{slug}"),
        kind: kind.into(),
        area: a.into(),
        country: c.into(),
        day: label,
        published: published_time(kind, day, now),
        updated: now,
        importance,
        data,
    }
}

/// Daily statistics of a zone from the start of the history to the end of `last`
async fn history(app: &App, c: &Country, a: &Area, last: Date) -> anyhow::Result<Vec<DayStat>> {
    let tz = c.timezone();
    let from = local_midnight(&tz, app.cfg.history_start)
        .timestamp()
        .as_millisecond();
    let (_, to) = day_range(&tz, last);
    let rows = crate::web::data::spot_grouped(
        app,
        a.name,
        from,
        to,
        Grouping::Daily,
        &IntervalMode::Prefer(c.interval.into()),
        tz.clone(),
        None,
    )
    .await?;
    Ok(rows
        .iter()
        .filter_map(|r| {
            let t = r.time?;
            let date = crate::timeutil::local_date(&tz, t);
            let (s, e) = day_range(&tz, date);
            Some(DayStat {
                date,
                avg: r.price,
                min: r.min,
                max: r.max,
                len: e - s + 1,
            })
        })
        .collect())
}

/// Intervals of a day, when they cover the whole day (one hour may be missing: Portugal's
/// last local hour comes with the next day's auction)
async fn complete_day(
    app: &App,
    c: &Country,
    a: &Area,
    date: Date,
) -> anyhow::Result<Option<Vec<(i64, f64, i64)>>> {
    let tz: TimeZone = c.timezone();
    let (from, to) = day_range(&tz, date);
    let rows = crate::web::data::spot_selected(
        app,
        a.name,
        from,
        to,
        &IntervalMode::Prefer(c.interval.into()),
        tz,
    )
    .await?;
    let covered: i64 = rows.iter().map(|r| r.2).sum();
    Ok((covered >= to - from + 1 - HOUR_MS).then(|| rows.to_vec()))
}

/// Generate (or update) the news items for the latest days and the last finished month.
/// Returns a summary and the number of items written.
pub async fn generate(app: &App) -> anyhow::Result<(String, usize)> {
    let empty = app.db.run(|c| Ok(queries::news_count(c)?)).await? == 0;
    let back = if empty { BACKFILL_DAYS } else { 0 };
    let months = if empty { BACKFILL_MONTHS } else { 1 };
    let mut items = vec![];
    // Per day of the market time zone: (zone, average, min) of zones with a complete day
    let mut europe: BTreeMap<Date, Vec<(&str, f64, f64)>> = BTreeMap::new();
    for c in COUNTRIES {
        let tz = c.timezone();
        let t = today(&tz);
        for a in c.areas {
            let hist = history(app, c, a, add_days(t, DAYS_AHEAD)).await?;
            for offset in -back..=DAYS_AHEAD {
                let date = add_days(t, offset);
                let Some(day) = hist.iter().find(|d| d.date == date).copied() else {
                    continue;
                };
                let Some(rows) = complete_day(app, c, a, date).await? else {
                    continue;
                };
                let (data, imp) = day_facts(&rows, &day, &hist);
                items.push(item("day", Some((c, a)), date, date.to_string(), data, imp));
                europe
                    .entry(date)
                    .or_default()
                    .push((a.name, day.avg, day.min));
            }
            for m in 1..=months {
                let Ok(month) = t.first_of_month().checked_sub(m.months()) else {
                    continue;
                };
                if let Some((data, imp)) = month_facts(&hist, month) {
                    let label = month.strftime("%Y-%m").to_string();
                    items.push(item("month", Some((c, a)), month, label, data, imp));
                }
            }
        }
    }
    for (date, zones) in &europe {
        if let Some((data, imp)) = europe_facts(zones) {
            items.push(item("europe", None, *date, date.to_string(), data, imp));
        }
    }
    let n = items.len();
    let changed = app
        .db
        .run(move |c| Ok(queries::upsert_news(c, &items)?))
        .await?;
    Ok((format!("{n} news items, {changed} new or changed"), changed))
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/// How prices are written in a language: its default currency per kWh
#[derive(Debug, Clone)]
pub struct PriceFmt {
    pub rate: f64,
    pub decimals: usize,
    pub sub_unit: bool,
    pub currency: &'static str,
}

impl PriceFmt {
    pub fn new(er: &ExchangeRates, lang: &str) -> Self {
        let currency = default_currency(lang);
        Self {
            rate: er.rate(currency).unwrap_or(1.0),
            decimals: default_decimals(currency),
            sub_unit: currency == "öre",
            currency,
        }
    }

    pub fn text(&self, eur: f64) -> String {
        let props = crate::price::PriceProps {
            extra: 0.0,
            multiplier: 1.0,
            factor: 1.0,
            decimals: self.decimals,
            price_factor: false,
            sub_unit: self.sub_unit,
        };
        crate::price::process_price(Some(eur * self.rate), &props)
    }

    pub fn unit(&self) -> String {
        format!("{}/kWh", self.currency)
    }
}

pub fn html_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            c => out.push(c),
        }
    }
    out
}

/// A value put into a translated sentence
enum Arg {
    Text(String),
    /// EUR/MWh; in html a span the browser re-renders in the visitor's currency
    Price(f64),
    Unit,
}

type Sentence = (String, Vec<(&'static str, Arg)>);

fn fill(i18n: &I18n, lang: &str, s: &Sentence, pf: &PriceFmt, html: bool) -> String {
    let tpl = i18n.t(lang, &format!("pages.news.{}", s.0));
    let mut out = if html { html_escape(&tpl) } else { tpl };
    for (k, v) in &s.1 {
        let val = match (v, html) {
            (Arg::Text(t), false) => t.clone(),
            (Arg::Text(t), true) => html_escape(t),
            (Arg::Price(p), false) => pf.text(*p),
            (Arg::Price(p), true) => {
                format!(r#"<span class="p" data-eur="{p}">{}</span>"#, pf.text(*p))
            }
            (Arg::Unit, false) => pf.unit(),
            (Arg::Unit, true) => format!("<span data-unit>{}</span>", pf.unit()),
        };
        out = out.replace(&format!("{{{k}}}"), &val);
    }
    out
}

/// An item as text in one language
#[derive(Debug, Clone, serde::Serialize)]
pub struct Rendered {
    pub title: String,
    /// Plain text of all paragraphs, for descriptions and feeds
    pub summary: String,
    /// Paragraphs as html
    pub html: Vec<String>,
}

fn month_name(i18n: &I18n, lang: &str, d: Date) -> String {
    let m = i18n.t(lang, &format!("months.{}", d.month() - 1));
    // The month names in the locales are lowercase; English and German write them capitalised
    if matches!(lang, "en" | "de") {
        let mut c = m.chars();
        return c
            .next()
            .map(|f| f.to_uppercase().chain(c).collect())
            .unwrap_or_default();
    }
    m
}

pub fn date_short(i18n: &I18n, lang: &str, d: Date) -> String {
    date_fmt(i18n, lang, d, "date")
}

fn date_fmt(i18n: &I18n, lang: &str, d: Date, key: &str) -> String {
    i18n.tf(
        lang,
        &format!("pages.news.{key}"),
        &[
            ("d", &d.day().to_string()),
            ("m", &format!("{:02}", d.month())),
            ("month", &month_name(i18n, lang, d)),
            ("y", &d.year().to_string()),
            (
                "weekday",
                &i18n.t(
                    lang,
                    &format!(
                        "pages.news.weekdays.{}",
                        d.weekday().to_monday_zero_offset()
                    ),
                ),
            ),
        ],
    )
}

fn hhmm(tz: &TimeZone, ms: i64) -> String {
    crate::timeutil::ts(ms)
        .to_zoned(tz.clone())
        .strftime("%H:%M")
        .to_string()
}

fn duration(ms: i64) -> String {
    let mins = ms / 60_000;
    match (mins / 60, mins % 60) {
        (h, 0) => format!("{h} h"),
        (0, m) => format!("{m} min"),
        (h, m) => format!("{h} h {m} min"),
    }
}

fn num(v: &Value, k: &str) -> Option<f64> {
    v.get(k).and_then(Value::as_f64)
}

fn t(s: impl Into<String>) -> Arg {
    Arg::Text(s.into())
}

fn sentences(item: &NewsRow, i18n: &I18n, lang: &str) -> Option<(Sentence, Vec<Vec<Sentence>>)> {
    let d = &item.data;
    let area = crate::countries::find_area(&item.area);
    match item.kind.as_str() {
        "day" => {
            let (c, a) = area?;
            let tz = c.timezone();
            let date = item.day.parse::<Date>().ok()?;
            let avg = num(d, "avg")?;
            let pct = d.get("pct").and_then(Value::as_i64);
            let since = |k: &str| {
                d.get(k)
                    .and_then(Value::as_str)
                    .and_then(|s| s.parse::<Date>().ok())
                    .map(|s| date_short(i18n, lang, s))
            };
            let headline = d
                .get("headline")
                .and_then(Value::as_str)
                .unwrap_or("default");
            let key = match headline {
                "negative" | "high" | "low" | "up" | "down" => format!("day_title_{headline}"),
                _ => "day_title".into(),
            };
            let title: Sentence = (
                key,
                vec![
                    ("area", t(a.name)),
                    ("date", t(date_short(i18n, lang, date))),
                    ("avg", Arg::Price(avg)),
                    ("unit", Arg::Unit),
                    ("pct", t(pct.map(|p| p.abs()).unwrap_or(0).to_string())),
                    (
                        "since",
                        t(since(if headline == "low" {
                            "low_since"
                        } else {
                            "high_since"
                        })
                        .unwrap_or_default()),
                    ),
                ],
            );
            let mut paras = vec![vec![(
                "day_summary".to_string(),
                vec![
                    ("area", t(a.name)),
                    ("long", t(a.long)),
                    ("date", t(date_fmt(i18n, lang, date, "date_long"))),
                    ("avg", Arg::Price(avg)),
                    ("min", Arg::Price(num(d, "min")?)),
                    ("max", Arg::Price(num(d, "max")?)),
                    ("unit", Arg::Unit),
                ],
            )]];
            let mut second = vec![];
            if let (Some(prev), Some(pct)) = (num(d, "prev"), pct) {
                let key = match pct {
                    p if p >= 3 => "day_change_up",
                    p if p <= -3 => "day_change_down",
                    _ => "day_change_flat",
                };
                second.push((
                    key.to_string(),
                    vec![
                        ("pct", t(pct.abs().to_string())),
                        ("prev", Arg::Price(prev)),
                        ("unit", Arg::Unit),
                    ],
                ));
            }
            for (k, key) in [
                ("high_since", "day_high_since"),
                ("low_since", "day_low_since"),
            ] {
                if let Some(s) = since(k) {
                    second.push((key.to_string(), vec![("since", t(s))]));
                }
            }
            if !second.is_empty() {
                paras.push(second);
            }
            let win = |k: &str| {
                let w = d.get(k)?.as_array()?;
                Some((
                    w.first()?.as_i64()?,
                    w.get(1)?.as_i64()?,
                    w.get(2)?.as_f64()?,
                ))
            };
            if let (Some(ch), Some(pk)) = (win("cheap"), win("peak")) {
                paras.push(vec![(
                    "day_hours".to_string(),
                    vec![
                        ("cheap_start", t(hhmm(&tz, ch.0))),
                        ("cheap_end", t(hhmm(&tz, ch.1))),
                        ("cheap", Arg::Price(ch.2)),
                        ("peak_start", t(hhmm(&tz, pk.0))),
                        ("peak_end", t(hhmm(&tz, pk.1))),
                        ("peak", Arg::Price(pk.2)),
                        ("unit", Arg::Unit),
                    ],
                )]);
            }
            let neg = d.get("neg_ms").and_then(Value::as_i64).unwrap_or(0);
            if neg > 0 {
                paras.push(vec![(
                    "day_negative".to_string(),
                    vec![
                        ("duration", t(duration(neg))),
                        ("min", Arg::Price(num(d, "min")?)),
                        ("unit", Arg::Unit),
                    ],
                )]);
            }
            Some((title, paras))
        }
        "month" => {
            let (_, a) = area?;
            let month = format!("{}-01", item.day).parse::<Date>().ok()?;
            let year = month.year().to_string();
            let avg = num(d, "avg")?;
            let title: Sentence = (
                "month_title".into(),
                vec![
                    ("area", t(a.name)),
                    ("month", t(month_name(i18n, lang, month))),
                    ("year", t(year.clone())),
                    ("avg", Arg::Price(avg)),
                    ("unit", Arg::Unit),
                ],
            );
            let mut paras = vec![vec![(
                "month_summary".to_string(),
                vec![
                    ("area", t(a.name)),
                    ("long", t(a.long)),
                    ("month", t(month_name(i18n, lang, month))),
                    ("year", t(year)),
                    ("avg", Arg::Price(avg)),
                    ("min", Arg::Price(num(d, "min")?)),
                    ("max", Arg::Price(num(d, "max")?)),
                    ("unit", Arg::Unit),
                ],
            )]];
            let mut second = vec![];
            let dir = |p: i64| match p {
                p if p >= 3 => "up",
                p if p <= -3 => "down",
                _ => "flat",
            };
            if let (Some(prev), Some(p)) =
                (num(d, "prev"), d.get("pct_prev").and_then(Value::as_i64))
            {
                let pm = month.checked_sub(1.month()).ok()?;
                second.push((
                    format!("month_prev_{}", dir(p)),
                    vec![
                        ("pct", t(p.abs().to_string())),
                        ("prev", Arg::Price(prev)),
                        (
                            "prev_month",
                            t(format!("{} {}", month_name(i18n, lang, pm), pm.year())),
                        ),
                        ("unit", Arg::Unit),
                    ],
                ));
            }
            if let (Some(y), Some(p)) = (num(d, "year"), d.get("pct_year").and_then(Value::as_i64))
            {
                second.push((
                    format!("month_year_{}", dir(p)),
                    vec![
                        ("pct", t(p.abs().to_string())),
                        ("prev", Arg::Price(y)),
                        ("month", t(month_name(i18n, lang, month))),
                        ("year", t((month.year() - 1).to_string())),
                        ("unit", Arg::Unit),
                    ],
                ));
            }
            if !second.is_empty() {
                paras.push(second);
            }
            Some((title, paras))
        }
        "europe" => {
            let date = item.day.parse::<Date>().ok()?;
            let zone = |k: &str| {
                let z = d.get(k)?.as_array()?;
                let name = z.first()?.as_str()?;
                let long = crate::countries::find_area(name)
                    .map(|x| x.1.long)
                    .unwrap_or(name);
                Some((name.to_string(), long.to_string(), z.get(1)?.as_f64()?))
            };
            let (cheap, exp) = (zone("cheap")?, zone("exp")?);
            let title: Sentence = (
                "europe_title".into(),
                vec![
                    ("date", t(date_short(i18n, lang, date))),
                    ("cheap", t(cheap.0.clone())),
                    ("exp", t(exp.0.clone())),
                ],
            );
            let mut paras = vec![vec![(
                "europe_summary".to_string(),
                vec![
                    ("date", t(date_fmt(i18n, lang, date, "date_long"))),
                    ("cheap", t(cheap.0)),
                    ("cheap_long", t(cheap.1)),
                    ("cheap_avg", Arg::Price(cheap.2)),
                    ("exp", t(exp.0)),
                    ("exp_long", t(exp.1)),
                    ("exp_avg", Arg::Price(exp.2)),
                    ("unit", Arg::Unit),
                ],
            )]];
            let mut second = vec![(
                "europe_average".to_string(),
                vec![
                    (
                        "zones",
                        t(d.get("zones")
                            .and_then(Value::as_u64)
                            .unwrap_or(0)
                            .to_string()),
                    ),
                    ("avg", Arg::Price(num(d, "avg")?)),
                    ("unit", Arg::Unit),
                ],
            )];
            let negative: Vec<&str> = d
                .get("negative")
                .and_then(Value::as_array)
                .map(|a| a.iter().filter_map(Value::as_str).collect())
                .unwrap_or_default();
            if !negative.is_empty() {
                second.push((
                    "europe_negative".to_string(),
                    vec![
                        ("count", t(negative.len().to_string())),
                        ("zones", t(negative.join(", "))),
                    ],
                ));
            }
            paras.push(second);
            Some((title, paras))
        }
        _ => None,
    }
}

/// Text of a pushed item in `lang`. Pushed items exist only in the languages they were
/// pushed in: a writer may publish country news in that country's languages only.
fn render_custom(item: &NewsRow, lang: &str) -> Option<Rendered> {
    let t = item.data.get("texts")?.get(lang)?;
    let title = t.get("title")?.as_str()?.to_string();
    let paras: Vec<String> = t
        .get("paragraphs")?
        .as_array()?
        .iter()
        .filter_map(Value::as_str)
        .map(str::to_string)
        .collect();
    Some(Rendered {
        title,
        summary: paras.join(" "),
        // Pushed text is plain text, never html
        html: paras.iter().map(|p| html_escape(p)).collect(),
    })
}

/// Text of an item in `lang`; `None` for items that cannot be rendered (unknown kind or zone)
pub fn render(item: &NewsRow, i18n: &I18n, lang: &str, pf: &PriceFmt) -> Option<Rendered> {
    if item.kind == CUSTOM {
        return render_custom(item, lang);
    }
    let (title, paras) = sentences(item, i18n, lang)?;
    let join = |p: &[Sentence], html: bool| {
        p.iter()
            .map(|s| fill(i18n, lang, s, pf, html))
            .collect::<Vec<_>>()
            .join(" ")
    };
    Some(Rendered {
        title: fill(i18n, lang, &title, pf, false),
        summary: paras
            .iter()
            .map(|p| join(p, false))
            .collect::<Vec<_>>()
            .join(" "),
        html: paras.iter().map(|p| join(p, true)).collect(),
    })
}

/// Kind of items pushed through `POST /api/v2/news`
pub const CUSTOM: &str = "custom";

/// An item pushed by an external writer (an editor, a script or an AI service)
#[derive(Debug, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PushedItem {
    /// Lowercase slug, `[a-z0-9-]`, 3-80 characters. The id becomes `{day}-{slug}`.
    pub slug: String,
    /// Day the item is about, `YYYY-MM-DD` (default today, Stockholm)
    pub day: Option<String>,
    /// Bidding zone, or none for an item about Europe or a country
    pub area: Option<String>,
    /// Country id (`sv`), taken from `area` when that is given
    pub country: Option<String>,
    /// 1 routine (not indexed by search engines), 2 notable (default), 3 important
    pub importance: Option<i64>,
    /// Publication time, ms (default now)
    pub published: Option<i64>,
    /// Text per language (`sv`, `en`, ...): `{ "title": "...", "paragraphs": ["...", ...] }`.
    /// The item is only shown in these languages.
    pub texts: serde_json::Map<String, Value>,
    /// Facts the text is based on, kept with the item and returned by the API
    pub facts: Option<Value>,
}

/// Check a pushed item and turn it into a row
pub fn pushed_row(p: PushedItem, now: i64) -> Result<NewsRow, String> {
    let slug = p.slug.trim().to_string();
    if !(3..=80).contains(&slug.len())
        || !slug
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
    {
        return Err("slug must be 3-80 characters a-z, 0-9 and -".into());
    }
    let generated = slug == "europe"
        || COUNTRIES
            .iter()
            .flat_map(|c| c.areas)
            .any(|a| a.name.to_lowercase() == slug);
    if generated {
        return Err("slug is reserved for generated items".into());
    }
    let (area, country) = match (&p.area, &p.country) {
        (Some(a), _) => {
            let (c, a) = crate::countries::find_area(a).ok_or("unknown area")?;
            (a.name.to_string(), c.id.to_string())
        }
        (None, Some(c)) => (
            String::new(),
            crate::countries::country(c)
                .ok_or("unknown country")?
                .id
                .to_string(),
        ),
        (None, None) => (String::new(), String::new()),
    };
    if p.texts.is_empty() {
        return Err("texts must have at least one language".into());
    }
    let mut texts = serde_json::Map::new();
    for (lang, t) in p.texts {
        if !crate::countries::LANGUAGES.contains(&lang.as_str()) {
            return Err(format!("unknown language {lang:?}"));
        }
        let title = t
            .get("title")
            .and_then(Value::as_str)
            .map(str::trim)
            .unwrap_or("");
        let paras: Vec<&str> = t
            .get("paragraphs")
            .and_then(Value::as_array)
            .map(|a| {
                a.iter()
                    .filter_map(Value::as_str)
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                    .collect()
            })
            .unwrap_or_default();
        if title.is_empty() || title.chars().count() > 200 {
            return Err(format!("{lang}: title must be 1-200 characters"));
        }
        if paras.is_empty() || paras.len() > 20 || paras.iter().any(|p| p.chars().count() > 2000) {
            return Err(format!(
                "{lang}: 1-20 paragraphs of at most 2000 characters"
            ));
        }
        texts.insert(lang, json!({ "title": title, "paragraphs": paras }));
    }
    let day = match p.day {
        Some(d) => d
            .trim()
            .parse::<Date>()
            .map_err(|_| "day must be YYYY-MM-DD")?,
        None => today(&crate::timeutil::stockholm()),
    };
    let importance = p.importance.unwrap_or(2);
    if !(1..=3).contains(&importance) {
        return Err("importance must be 1, 2 or 3".into());
    }
    let published = p.published.unwrap_or(now);
    if published > now + 24 * HOUR_MS {
        return Err("published is more than a day ahead".into());
    }
    Ok(NewsRow {
        id: format!("{day}-{slug}"),
        kind: CUSTOM.into(),
        area,
        country,
        day: day.to_string(),
        published,
        updated: now,
        importance,
        data: json!({ "texts": texts, "facts": p.facts }),
    })
}

/// Languages an item exists in: every language for generated items, the pushed ones else
pub fn languages(item: &NewsRow) -> Vec<&'static str> {
    if item.kind != CUSTOM {
        return crate::countries::LANGUAGES.to_vec();
    }
    let texts = item.data.get("texts").and_then(Value::as_object);
    crate::countries::LANGUAGES
        .iter()
        .copied()
        .filter(|l| texts.is_some_and(|t| t.contains_key(*l)))
        .collect()
}

/// Path of an item's page
pub fn path(item: &NewsRow) -> String {
    format!("/news/{}", item.id)
}

/// Whether an item is worth a place in search results. Routine daily reports are kept out
/// (`noindex, follow`): they are many and alike, and the zone page already answers "price
/// tomorrow". Notable days, Europe overviews, monthly summaries and pushed items of
/// importance 2 or more are indexed.
pub fn indexable(item: &NewsRow) -> bool {
    match item.kind.as_str() {
        "day" | CUSTOM => item.importance >= 2,
        _ => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use jiff::civil::date;

    fn stat(d: Date, avg: f64) -> DayStat {
        DayStat {
            date: d,
            avg,
            min: avg - 10.0,
            max: avg + 10.0,
            len: 24 * HOUR_MS,
        }
    }

    fn hist(start: Date, avgs: &[f64]) -> Vec<DayStat> {
        avgs.iter()
            .enumerate()
            .map(|(i, a)| stat(add_days(start, i as i64), *a))
            .collect()
    }

    fn rows(prices: &[f64]) -> Vec<(i64, f64, i64)> {
        prices
            .iter()
            .enumerate()
            .map(|(i, p)| (i as i64 * HOUR_MS, *p, HOUR_MS))
            .collect()
    }

    #[test]
    fn routine_day() {
        let start = date(2026, 1, 1);
        let mut avgs = vec![50.0; 40];
        // Higher a week ago and lower last week: no record either way
        avgs[32] = 60.0;
        avgs[35] = 40.0;
        avgs[39] = 52.0;
        let h = hist(start, &avgs);
        let day = h[39];
        let mut p = vec![52.0; 24];
        p[3] = 20.0;
        p[18] = 90.0;
        let (v, imp) = day_facts(&rows(&p), &day, &h);
        assert_eq!(imp, 1);
        assert_eq!(v["headline"], "default");
        assert_eq!(v["pct"], 4);
        assert_eq!(v["cheap"][0], 3 * HOUR_MS);
        assert_eq!(v["cheap"][2], 20.0);
        assert_eq!(v["peak"][0], 18 * HOUR_MS);
        assert_eq!(v["peak"][2], 90.0);
        assert!(v["high_since"].is_null());
    }

    #[test]
    fn record_and_negative_days() {
        let start = date(2025, 1, 1);
        let mut avgs = vec![50.0; 400];
        avgs[10] = 200.0;
        avgs[399] = 150.0;
        let h = hist(start, &avgs);
        let (v, imp) = day_facts(&rows(&[150.0; 24]), &h[399], &h);
        assert_eq!(v["headline"], "high");
        assert_eq!(v["high_since"], add_days(start, 10).to_string());
        assert_eq!(imp, 3);

        let mut p = vec![10.0; 24];
        for x in p.iter_mut().take(5) {
            *x = -2.0;
        }
        let mut avgs = vec![50.0; 10];
        avgs[9] = 7.5;
        let h = hist(start, &avgs);
        let (v, imp) = day_facts(&rows(&p), &h[9], &h);
        assert_eq!(v["headline"], "negative");
        assert_eq!(v["neg_ms"], 5 * HOUR_MS);
        assert_eq!(imp, 3);
    }

    #[test]
    fn big_change_needs_real_difference() {
        let start = date(2026, 1, 1);
        // 2 -> 4 EUR/MWh is +100 %, but not news
        let h = hist(start, &[2.0, 4.0]);
        let (v, _) = day_facts(&rows(&[4.0; 24]), &h[1], &h);
        assert_eq!(v["headline"], "default");
        assert!(v["pct"].is_null());
        let h = hist(start, &[40.0, 80.0]);
        let (v, imp) = day_facts(&rows(&[80.0; 24]), &h[1], &h);
        assert_eq!(v["headline"], "up");
        assert_eq!(v["pct"], 100);
        assert_eq!(imp, 2);
    }

    #[test]
    fn month_summary() {
        let h: Vec<DayStat> = (0..120)
            .map(|i| {
                stat(
                    add_days(date(2026, 7, 1), i),
                    if i < 31 { 40.0 } else { 60.0 },
                )
            })
            .collect();
        let (v, imp) = month_facts(&h, date(2026, 8, 1)).unwrap();
        assert_eq!(v["avg"], 60.0);
        assert_eq!(v["prev"], 40.0);
        assert_eq!(v["pct_prev"], 50);
        assert!(v["year"].is_null());
        assert_eq!(imp, 2);
        // Incomplete month
        assert!(month_facts(&h[..40], date(2026, 8, 1)).is_none());
    }

    #[test]
    fn europe_needs_most_zones() {
        assert!(europe_facts(&[("SE3", 10.0, 1.0)]).is_none());
        let names: Vec<&str> = COUNTRIES
            .iter()
            .flat_map(|c| c.areas.iter().map(|a| a.name))
            .collect();
        let zones: Vec<_> = names
            .iter()
            .enumerate()
            .map(|(i, n)| (*n, i as f64, if i == 0 { -1.0 } else { 1.0 }))
            .collect();
        let (v, _) = europe_facts(&zones).unwrap();
        assert_eq!(v["cheap"][0], names[0]);
        assert_eq!(v["exp"][0], *names.last().unwrap());
        assert_eq!(v["negative"][0], names[0]);
    }

    #[test]
    fn renders_in_every_language() {
        let i18n = I18n::load().unwrap();
        let start = date(2026, 1, 1);
        let h = hist(start, &[40.0, 80.0]);
        let (data, importance) = day_facts(&rows(&[80.0; 24]), &h[1], &h);
        let item = NewsRow {
            id: "2026-01-02-se3".into(),
            kind: "day".into(),
            area: "SE3".into(),
            country: "sv".into(),
            day: "2026-01-02".into(),
            published: 0,
            updated: 0,
            importance,
            data,
        };
        let pf = PriceFmt {
            rate: 11.0,
            decimals: 1,
            sub_unit: true,
            currency: "öre",
        };
        for lang in crate::countries::LANGUAGES {
            let r = render(&item, &i18n, lang, &pf).unwrap();
            for text in [&r.title, &r.summary] {
                assert!(!text.contains('{'), "{lang}: {text}");
                assert!(!text.contains("pages.news"), "{lang}: {text}");
            }
            assert!(r.title.contains("SE3"), "{lang}: {}", r.title);
            assert!(r.title.contains("100"), "{lang}: {}", r.title);
            assert!(r.html[0].contains(r#"data-eur="80""#), "{lang}");
        }
        let r = render(&item, &i18n, "sv", &pf).unwrap();
        assert!(r.summary.contains("88.0 öre/kWh"), "{}", r.summary);
    }
}
