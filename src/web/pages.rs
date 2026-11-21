//! Server rendered pages. Same urls as 1.x.
#![allow(clippy::result_large_err)]

use std::collections::{BTreeMap, BTreeSet};

use axum::extract::{Path, Query, State};
use axum::http::{header, HeaderMap, StatusCode, Uri};
use axum::response::{Html, IntoResponse, Redirect, Response};
use jiff::tz::TimeZone;
use jiff::{Timestamp, ToSpan};
use serde_json::{json, Map, Value};

use super::{data, detect_lang, query_lang, WebState};
use crate::countries::{
    country as find_country, default_currency, default_decimals, lang_from_path, lang_tag, Area,
    Country, COUNTRIES, LANGUAGES,
};
use crate::db::queries::{GenerationRow, LoadRow, OutageRow};
use crate::price::{process_price, PriceProps};
use crate::timeutil::{add_days, day_range, interval_ms, now_ms, today, HOUR_MS};

type PageResult = Result<Response, Response>;

fn internal(e: anyhow::Error) -> Response {
    tracing::error!(error = %format!("{e:#}"), "page failed");
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Html("<h1>500 - Internal server error</h1>"),
    )
        .into_response()
}

fn render(st: &WebState, name: &str, mut ctx: Value) -> PageResult {
    let nonce = super::new_nonce();
    if let Value::Object(m) = &mut ctx {
        m.insert("nonce".into(), json!(nonce));
    }
    let tpl = st.env.get_template(name).map_err(|e| internal(e.into()))?;
    let html = tpl.render(ctx).map_err(|e| internal(e.into()))?;
    let mut res = Html(html).into_response();
    let csp_header = match st.app.cfg.csp {
        super::Csp::Enforce => Some(header::CONTENT_SECURITY_POLICY),
        super::Csp::ReportOnly => Some(header::CONTENT_SECURITY_POLICY_REPORT_ONLY),
        super::Csp::Off => None,
    };
    if let Some(h) = csp_header {
        if let Ok(v) = header::HeaderValue::from_str(&super::csp_policy(&nonce)) {
            res.headers_mut().insert(h, v);
        }
    }
    res.headers_mut().insert(
        header::CACHE_CONTROL,
        header::HeaderValue::from_static("no-cache"),
    );
    res.headers_mut().insert(
        header::VARY,
        header::HeaderValue::from_static("Accept-Language, Cookie"),
    );
    Ok(res)
}

fn fmt_date(tz: &TimeZone, ms: Option<i64>) -> String {
    ms.and_then(|ms| Timestamp::from_millisecond(ms).ok())
        .map(|t| t.to_zoned(tz.clone()).date().to_string())
        .unwrap_or_default()
}

fn fmt_datetime(tz: &TimeZone, ms: i64) -> String {
    Timestamp::from_millisecond(ms)
        .map(|t| {
            t.to_zoned(tz.clone())
                .strftime("%Y-%m-%d %H:%M")
                .to_string()
        })
        .unwrap_or_default()
}

/// Escape for embedding JSON inside a <script> element
fn script_json(v: &Value) -> String {
    v.to_string().replace("</", "<\\/")
}

/// Terms of use of the ENTSO-E Transparency Platform, which apply to re-use of the data
const ENTSOE_TERMS: &str = "https://transparencyplatform.zendesk.com/hc/en-us/articles/40921911218961-Legal-Terms-and-Conditions";

/// How a page relates to languages and search engines
#[derive(Clone, Copy, PartialEq, Eq)]
enum Kind {
    /// Translated page with one url per language (`?lang=`), linked with `hreflang`
    Localized,
    /// Kept out of search results
    NoIndex,
}

/// `<title>`, meta description and search engine treatment of a page
struct Head {
    title: String,
    description: String,
    kind: Kind,
}

fn zone_count() -> usize {
    COUNTRIES.iter().map(|c| c.areas.len()).sum()
}

/// Path without a trailing slash, the form used in canonical links
fn clean_path(path: &str) -> &str {
    match path.trim_end_matches('/') {
        "" => "/",
        p => p,
    }
}

/// Context shared by all pages. `boot` is handed to app.js.
async fn base(
    st: &WebState,
    lang: &str,
    page: &str,
    head: Head,
    uri: &Uri,
    headers: &HeaderMap,
) -> Result<(Map<String, Value>, Map<String, Value>), Response> {
    let er = data::exchange_rates(&st.app).await.map_err(internal)?;
    let i18n = &st.app.i18n;
    let currency = default_currency(lang);
    let mut ctx = Map::new();
    ctx.insert("lang".into(), json!(lang));
    ctx.insert("html_lang".into(), json!(lang_tag(lang)));
    ctx.insert("page".into(), json!(page));
    ctx.insert("head_title".into(), json!(head.title));
    ctx.insert("description".into(), json!(head.description));
    ctx.insert("version".into(), json!(env!("CARGO_PKG_VERSION")));
    ctx.insert("adsense".into(), json!(st.app.cfg.adsense));
    ctx.insert("ga_id".into(), json!(st.app.cfg.ga_id));
    ctx.insert("countries".into(), json!(COUNTRIES));
    ctx.insert("currency".into(), json!(currency));
    ctx.insert("rate".into(), json!(er.rate(currency).unwrap_or(1.0)));
    ctx.insert("decimals".into(), json!(default_decimals(currency)));
    ctx.insert("sub_unit".into(), json!(currency == "öre"));
    ctx.insert("er".into(), json!(&*er));
    ctx.insert("languages".into(), json!(LANGUAGES));

    // Every language version of a translated page has its own url: the plain url in the
    // language of its path (`/sv/SE3` is Swedish), `?lang=xx` for the others. Paths without
    // a language (`/`, `/pl/PL`) follow the browser and are the `x-default`.
    let site = public_base(st, headers);
    let path = clean_path(uri.path());
    let path_lang = lang_from_path(path);
    let lang_url = |l: Option<&str>| match l {
        Some(l) if Some(l) != path_lang => format!("{site}{path}?lang={l}"),
        _ => format!("{site}{path}"),
    };
    let canonical = match (head.kind, page) {
        (_, "404") => None,
        // The form in every language; a filled in form is one url (and not indexed)
        (Kind::Localized, _) => Some(lang_url(query_lang(uri))),
        (_, "custom") => Some(
            match uri.query().map(custom_query).filter(|q| !q.is_empty()) {
                Some(q) => format!("{site}{path}?{q}"),
                None => format!("{site}{path}"),
            },
        ),
        _ => Some(format!("{site}{path}")),
    };
    if head.kind == Kind::Localized {
        let mut alt: Vec<Value> = LANGUAGES
            .iter()
            .map(|l| json!({ "hreflang": lang_tag(l), "href": lang_url(Some(l)) }))
            .collect();
        alt.push(json!({ "hreflang": "x-default", "href": lang_url(None) }));
        ctx.insert("alternates".into(), json!(alt));
    }
    if head.kind == Kind::NoIndex {
        ctx.insert("robots".into(), json!("noindex, follow"));
    }
    ctx.insert("site_url".into(), json!(site));
    ctx.insert("canonical".into(), json!(canonical));

    // Structured data, completed by the handlers and serialised in `finish`
    let website = json!({
        "@type": "WebSite",
        "@id": format!("{site}/#website"),
        "url": format!("{site}/"),
        "name": i18n.t(lang, "page.title"),
        "description": i18n.tf(lang, "seo.index_description", &[("zones", &zone_count().to_string())]),
        "inLanguage": LANGUAGES.iter().map(|l| lang_tag(l)).collect::<Vec<_>>(),
    });
    let url = canonical.unwrap_or_else(|| format!("{site}{path}"));
    let webpage = json!({
        "@type": "WebPage",
        "@id": format!("{url}#webpage"),
        "url": url,
        "name": head.title,
        "description": head.description,
        "inLanguage": lang_tag(lang),
        "isPartOf": { "@id": format!("{site}/#website") },
    });
    ctx.insert("ld_graph".into(), json!([website, webpage]));

    let mut boot = Map::new();
    boot.insert("lang".into(), json!(lang));
    boot.insert("page".into(), json!(page));
    boot.insert("i18n".into(), i18n.raw(lang).clone());
    boot.insert("er".into(), json!(&*er));
    boot.insert("countries".into(), json!(COUNTRIES));
    Ok((ctx, boot))
}

/// Structured data nodes of a page; `[0]` is the WebSite, `[1]` the WebPage
fn ld_graph(ctx: &mut Map<String, Value>) -> &mut Vec<Value> {
    ctx.entry("ld_graph")
        .or_insert_with(|| json!([]))
        .as_array_mut()
        .expect("array")
}

/// Replace the meta description once the page data is known
fn set_description(ctx: &mut Map<String, Value>, d: &str) {
    ctx.insert("description".into(), json!(d));
    if let Some(p) = ld_graph(ctx).get_mut(1) {
        p["description"] = json!(d);
    }
}

/// Mark the page as changed on `day` (pages with prices change every day)
fn set_modified(ctx: &mut Map<String, Value>, day: &str) {
    if let Some(p) = ld_graph(ctx).get_mut(1) {
        p["dateModified"] = json!(day);
    }
}

/// Price in EUR/MWh as text in the currency of the page, like the `price` template function
fn price_text(ctx: &Map<String, Value>, v: Option<f64>) -> Option<String> {
    let rate = ctx.get("rate").and_then(Value::as_f64).unwrap_or(1.0);
    let decimals = ctx.get("decimals").and_then(Value::as_u64).unwrap_or(2) as usize;
    let sub_unit = ctx
        .get("sub_unit")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let props = PriceProps {
        extra: 0.0,
        multiplier: 1.0,
        factor: 1.0,
        decimals,
        price_factor: false,
        sub_unit,
    };
    v.map(|v| process_price(Some(v * rate), &props))
}

fn unit_text(ctx: &Map<String, Value>) -> String {
    format!(
        "{}/kWh",
        ctx.get("currency").and_then(Value::as_str).unwrap_or("EUR")
    )
}

/// The parameters of `/custom` that make up its permalink, in a fixed order
fn custom_query(q: &str) -> String {
    let pairs: BTreeMap<String, String> = url_pairs(q);
    ["period", "area", "startDate", "endDate"]
        .iter()
        .filter_map(|k| pairs.get(*k).map(|v| format!("{k}={}", url_encode(v))))
        .collect::<Vec<_>>()
        .join("&")
}

fn url_pairs(q: &str) -> BTreeMap<String, String> {
    axum::extract::Query::<BTreeMap<String, String>>::try_from_uri(
        &format!("/?{q}").parse::<Uri>().unwrap_or_default(),
    )
    .map(|q| q.0)
    .unwrap_or_default()
}

fn url_encode(s: &str) -> String {
    s.bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                (b as char).to_string()
            }
            _ => format!("%{b:02X}"),
        })
        .collect()
}

fn finish(mut ctx: Map<String, Value>, boot: Map<String, Value>) -> Value {
    if let Some(graph) = ctx.remove("ld_graph") {
        let ld = json!({ "@context": "https://schema.org", "@graph": graph });
        ctx.insert("jsonld".into(), json!(script_json(&ld)));
    }
    ctx.insert("boot".into(), json!(script_json(&Value::Object(boot))));
    Value::Object(ctx)
}

// ---------------------------------------------------------------------------
// Production helpers (port of ProductionOverview / ProductionDetailsTodayChart)
// ---------------------------------------------------------------------------

fn psr_key(group: &Option<String>, consumption: i64) -> String {
    format!("{}_{}", group.as_deref().unwrap_or("other"), consumption)
}

fn production_overview(
    gen: &[GenerationRow],
    load: &[LoadRow],
    interval: &str,
    tz: &TimeZone,
) -> Value {
    struct Last {
        date: i64,
        value: f64,
        n: i64,
    }
    let cutoff = now_ms() - 12 * HOUR_MS;
    let mut last: BTreeMap<String, Last> = BTreeMap::new();
    let mut last_date = 0i64;
    for (period, group, value, consumption, n) in gen {
        if *period < cutoff {
            continue;
        }
        last_date = last_date.max(*period);
        let key = psr_key(group, *consumption);
        match last.get(&key) {
            Some(l) if !(l.date < *period && l.n <= *n) => {}
            _ => {
                last.insert(
                    key,
                    Last {
                        date: *period,
                        value: *value,
                        n: *n,
                    },
                );
            }
        }
    }
    let total: f64 = last.values().map(|l| l.value).sum();
    let mut rows: Vec<(String, f64)> = last
        .into_iter()
        .map(|(k, l)| (k, l.value))
        .filter(|(_, v)| *v != 0.0)
        .collect();
    rows.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    let mut load_total = load
        .iter()
        .find(|l| l.0 == last_date)
        .map(|l| l.1)
        .unwrap_or(0.0);
    if load_total == 0.0 {
        // Latest load not after the generation, never a newer preliminary value
        load_total = load
            .iter()
            .rev()
            .find(|l| l.0 <= last_date)
            .map(|l| l.1)
            .unwrap_or(0.0);
    }
    let net = total - load_total;
    json!({
        "has_data": last_date > 0,
        "rows": rows.iter().map(|(k, v)| json!({
            "key": format!("generation.psr_{}", k.to_lowercase()),
            "share": if total != 0.0 { format!("{:.1}", v / total * 100.0) } else { "-".into() },
            "value": v,
        })).collect::<Vec<_>>(),
        "total": total,
        "load": load_total,
        "net": net,
        "updated": if last_date > 0 { fmt_datetime(tz, last_date + interval_ms(interval)) } else { String::new() },
    })
}

fn production_series(gen: &[GenerationRow]) -> Value {
    let times: BTreeSet<i64> = gen.iter().map(|r| r.0).collect();
    let mut values: BTreeMap<String, BTreeMap<i64, f64>> = BTreeMap::new();
    for (period, group, value, consumption, _) in gen {
        *values
            .entry(psr_key(group, *consumption))
            .or_default()
            .entry(*period)
            .or_default() += value;
    }
    let times: Vec<i64> = times.into_iter().collect();
    json!({
        "times": times,
        "series": values.iter().map(|(k, m)| json!({
            "key": k,
            "data": times.iter().map(|t| m.get(t).copied().unwrap_or(0.0)).collect::<Vec<_>>(),
        })).collect::<Vec<_>>(),
    })
}

fn outage_json(o: &OutageRow, tz: &TimeZone) -> Value {
    let planned = o.business_type.as_deref() == Some("Planned maintenance");
    json!({
        "planned": planned,
        "type_key": format!("outage.{}", o.business_type.as_deref().unwrap_or("").to_lowercase().replacen(' ', "_", 1)),
        "started_key": format!("outage.started_{}", o.business_type.as_deref().unwrap_or("").to_lowercase().replacen(' ', "_", 1)),
        "resource_name": o.resource_name,
        "psr_name": o.psr_name,
        "location": o.location,
        "psr_type": o.psr_type,
        "start": fmt_date(tz, o.start_date),
        "end": fmt_date(tz, o.end_date),
        "reason": o.reason_text,
        "available": o.available,
        "nominal": o.psr_nominal_power,
        "unit": o.psr_nominal_power_unit.as_deref().map(|u| if u == "MAW" { "MW" } else { u }),
    })
}

async fn outages_ctx(st: &WebState, c: &Country) -> Result<Value, Response> {
    let o = data::outages(&st.app, c.id).await.map_err(internal)?;
    let tz = c.timezone();
    let (current, future) = &*o;
    let planned = current
        .iter()
        .filter(|o| o.business_type.as_deref() == Some("Planned maintenance"))
        .count();
    Ok(json!({
        "ongoing_planned": planned,
        "ongoing_unplanned": current.len() - planned,
        "upcoming": future.len(),
        "current": current.iter().map(|o| outage_json(o, &tz)).collect::<Vec<_>>(),
        "future": future.iter().take(200).map(|o| outage_json(o, &tz)).collect::<Vec<_>>(),
    }))
}

/// Overview data for one area: today/tomorrow series and statistics
async fn area_overview(
    st: &WebState,
    c: &Country,
    a: &Area,
    detailed: bool,
) -> Result<Value, Response> {
    let tz = c.timezone();
    let t = today(&tz);
    let today_s = data::day_series(&st.app, c, a.name, t)
        .await
        .map_err(internal)?;
    let tomorrow_s = data::day_series(&st.app, c, a.name, add_days(t, 1))
        .await
        .map_err(internal)?;
    let st_t = today_s.stats();
    let st_m = tomorrow_s.stats();
    let mut v = json!({
        "name": a.name,
        "id": a.id,
        "long": a.long,
        "color": a.color,
        "now": today_s.price_at(now_ms()),
        "avg_today": st_t.map(|s| s.0), "min_today": st_t.map(|s| s.1), "max_today": st_t.map(|s| s.2),
        "avg_tomorrow": st_m.map(|s| s.0), "min_tomorrow": st_m.map(|s| s.1), "max_tomorrow": st_m.map(|s| s.2),
        "today": today_s,
        "tomorrow": tomorrow_s,
    });
    if detailed {
        let prev = t.first_of_month().checked_sub(1.month()).unwrap_or(t);
        let m = data::month_stats(&st.app, c, a.name, t)
            .await
            .map_err(internal)?;
        let p = data::month_stats(&st.app, c, a.name, prev)
            .await
            .map_err(internal)?;
        let o = v.as_object_mut().expect("object");
        o.insert("month".into(), json!(t.month() - 1));
        o.insert("prev_month".into(), json!(prev.month() - 1));
        o.insert("avg_month".into(), json!(m.map(|s| s.0)));
        o.insert("min_month".into(), json!(m.map(|s| s.1)));
        o.insert("max_month".into(), json!(m.map(|s| s.2)));
        o.insert("avg_prev_month".into(), json!(p.map(|s| s.0)));
        o.insert("min_prev_month".into(), json!(p.map(|s| s.1)));
        o.insert("max_prev_month".into(), json!(p.map(|s| s.2)));
    }
    Ok(v)
}

/// Generation, load and net production for an area or country key
async fn production_ctx(
    st: &WebState,
    c: &Country,
    key: &str,
) -> Result<(Value, Value, Value), Response> {
    let tz = c.timezone();
    let t = today(&tz);
    let (from, _) = day_range(&tz, add_days(t, -1));
    let (_, to) = day_range(&tz, t);
    let gen = data::generation(&st.app, key, from, to, c.interval)
        .await
        .map_err(internal)?;
    let load = data::load(&st.app, key, from, to, c.interval)
        .await
        .map_err(internal)?;
    let net = data::net_generation(&st.app, key, from, to + 1)
        .await
        .map_err(internal)?;
    Ok((
        production_overview(&gen, &load, c.interval, &tz),
        production_series(&gen),
        json!(&*net),
    ))
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/// Zone selected on the start page map before the visitor picks one
fn default_map_area(lang: &str) -> &'static str {
    match lang {
        "no" => "NO1",
        "fi" => "FI",
        "dk" => "DK1",
        "de" => "DE-LU",
        "fr" => "FR",
        "es" => "ES",
        "nl" => "BE",
        _ => "SE3",
    }
}

pub async fn index(State(st): State<WebState>, uri: Uri, headers: HeaderMap) -> PageResult {
    let lang = detect_lang(&uri, &headers);
    let i18n = &st.app.i18n;
    let head = Head {
        title: format!(
            "{} - {}",
            i18n.t(&lang, "seo.index_title"),
            i18n.t(&lang, "page.title")
        ),
        description: i18n.tf(
            &lang,
            "seo.index_description",
            &[("zones", &zone_count().to_string())],
        ),
        kind: Kind::Localized,
    };
    let (mut ctx, mut boot) = base(&st, &lang, "index", head, &uri, &headers).await?;
    set_modified(&mut ctx, &today(&TimeZone::UTC).to_string());
    let now = data::now_prices(&st.app).await.map_err(internal)?;
    let genload = data::current_generation_and_load(&st.app)
        .await
        .map_err(internal)?;
    let gl = |key: &str| {
        genload.iter().find(|r| r.area == key).map(|r| {
            json!({
                "generation": r.generation_total,
                "load": r.load_total,
                "net": r.net_generation,
                "primary": r.primary_psr_group,
                "primary_share": match (r.primary_psr_group_generation, r.generation_total) {
                    (Some(p), Some(t)) if t != 0.0 => Some((p / t * 100.0).round()),
                    _ => None,
                },
            })
        })
    };
    let rows: Vec<Value> = COUNTRIES
        .iter()
        .map(|c| {
            json!({
                "id": c.id,
                "name": c.name,
                "now": now.countries.get(c.id),
                "gl": gl(c.cty),
                "areas": if c.areas.len() > 1 {
                    c.areas.iter().map(|a| json!({
                        "name": a.name, "long": a.long, "now": now.areas.get(a.name), "gl": gl(a.id),
                    })).collect::<Vec<_>>()
                } else { vec![] },
            })
        })
        .collect();
    // Everything the map and its side panel need, per bidding zone
    let mut zones = Map::new();
    for c in COUNTRIES {
        for a in c.areas {
            let mut z = area_overview(&st, c, a, false).await?;
            let o = z.as_object_mut().expect("object");
            o.insert("country".into(), json!(c.id));
            o.insert("gl".into(), json!(gl(a.id)));
            zones.insert(a.name.into(), z);
        }
    }
    let flows = data::current_flows(&st.app).await.map_err(internal)?;
    let neighbours: Map<String, Value> = crate::flows::NEIGHBOURS
        .iter()
        .map(|n| (n.name.to_string(), json!(n.long)))
        .collect();
    ctx.insert("rows".into(), json!(rows));
    ctx.insert("default_area".into(), json!(default_map_area(&lang)));
    boot.insert("upcoming".into(), json!(now.upcoming));
    boot.insert("zones".into(), Value::Object(zones));
    boot.insert("flows".into(), json!(&*flows));
    boot.insert("neighbours".into(), Value::Object(neighbours));
    boot.insert("default_area".into(), json!(default_map_area(&lang)));
    render(&st, "index.html", finish(ctx, boot))
}

pub async fn country(
    State(st): State<WebState>,
    Path(cid): Path<String>,
    uri: Uri,
    headers: HeaderMap,
) -> PageResult {
    let Some(c) = find_country(&cid) else {
        // `/{country}` also catches unknown top level paths
        return Ok(not_found_page(&st, &uri, &headers).await);
    };
    if c.areas.len() == 1 {
        return Ok(moved(format!("/{}/{}", c.id, c.areas[0].name), &uri));
    }
    let lang = detect_lang(&uri, &headers);
    let i18n = &st.app.i18n;
    let cname = i18n.t(&lang, &format!("countries.{}", c.id));
    let h1 = i18n.tf(&lang, "seo.country_title", &[("country", &cname)]);
    let head = Head {
        title: format!(
            "{h1} - {}",
            c.areas
                .iter()
                .map(|a| a.name)
                .collect::<Vec<_>>()
                .join(", ")
        ),
        description: String::new(),
        kind: Kind::Localized,
    };
    let (mut ctx, mut boot) = base(&st, &lang, c.id, head, &uri, &headers).await?;
    let mut areas = vec![];
    for a in c.areas {
        areas.push(area_overview(&st, c, a, false).await?);
    }
    let prices = areas
        .iter()
        .filter_map(|a| {
            let p = price_text(&ctx, a.get("avg_today").and_then(Value::as_f64))?;
            Some(format!("{} {p}", a["name"].as_str().unwrap_or("")))
        })
        .collect::<Vec<_>>();
    let description = if prices.is_empty() {
        format!("{h1}. {}", i18n.t(&lang, "seo.area_description_more"))
    } else {
        i18n.tf(
            &lang,
            "seo.country_description",
            &[
                ("country", &cname),
                ("prices", &prices.join(", ")),
                ("unit", &unit_text(&ctx)),
            ],
        )
    };
    set_description(&mut ctx, &description);
    set_modified(&mut ctx, &today(&c.timezone()).to_string());
    ctx.insert("h1".into(), json!(h1));
    let (overview, series, net) = production_ctx(&st, c, c.cty).await?;
    ctx.insert("country".into(), json!(c));
    ctx.insert("areas".into(), json!(areas));
    ctx.insert("production".into(), overview);
    ctx.insert("outages".into(), outages_ctx(&st, c).await?);
    boot.insert("country".into(), json!(c));
    boot.insert("areas".into(), json!(areas));
    boot.insert("production".into(), series);
    boot.insert("net".into(), net);
    render(&st, "country.html", finish(ctx, boot))
}

pub async fn area(
    State(st): State<WebState>,
    Path((cid, aname)): Path<(String, String)>,
    uri: Uri,
    headers: HeaderMap,
) -> PageResult {
    if cid == "elomrade" {
        return Ok(moved(format!("/sv/{aname}"), &uri));
    }
    let Some(c) = find_country(&cid) else {
        return Ok(not_found_page(&st, &uri, &headers).await);
    };
    let Some(a) = c.areas.iter().find(|a| a.name == aname) else {
        return Ok(not_found_page(&st, &uri, &headers).await);
    };
    let lang = detect_lang(&uri, &headers);
    let i18n = &st.app.i18n;
    let names = [("area", a.name), ("long", a.long)];
    let head = Head {
        title: format!(
            "{} - {}",
            i18n.tf(&lang, "seo.area_title", &names),
            i18n.t(&lang, "page.title")
        ),
        description: String::new(),
        kind: Kind::Localized,
    };
    let (mut ctx, mut boot) = base(&st, &lang, a.id, head, &uri, &headers).await?;
    let ov = area_overview(&st, c, a, true).await?;
    let (overview, series, net) = production_ctx(&st, c, a.id).await?;
    let single = c.areas.len() == 1;
    if single {
        ctx.insert("outages".into(), outages_ctx(&st, c).await?);
    }

    // Description with today's (and tomorrow's) prices in the default currency
    let num = |k: &str| ov.get(k).and_then(Value::as_f64);
    let unit = unit_text(&ctx);
    let today_txt = ["avg_today", "min_today", "max_today"].map(|k| price_text(&ctx, num(k)));
    let tomorrow_txt =
        ["avg_tomorrow", "min_tomorrow", "max_tomorrow"].map(|k| price_text(&ctx, num(k)));
    // Today, then tomorrow when known, then what else the page has
    let mut parts = vec![];
    match &today_txt {
        [Some(avg), Some(min), Some(max)] => parts.push(i18n.tf(
            &lang,
            "seo.area_description",
            &[
                names[0],
                names[1],
                ("avg", avg),
                ("min", min),
                ("max", max),
                ("unit", &unit),
            ],
        )),
        _ => parts.push(i18n.tf(&lang, "seo.area_description_nodata", &names)),
    }
    if let [Some(avg), Some(min), Some(max)] = &tomorrow_txt {
        parts.push(i18n.tf(
            &lang,
            "seo.area_description_tomorrow",
            &[("avg", avg), ("min", min), ("max", max), ("unit", &unit)],
        ));
    }
    if today_txt.iter().all(Option::is_some) {
        parts.push(i18n.t(&lang, "seo.area_description_more"));
    }
    let description = parts.join(" ");
    set_description(&mut ctx, &description);

    // schema.org Dataset with today's and tomorrow's spot price, in an ISO 4217 currency
    let er = data::exchange_rates(&st.app).await.map_err(internal)?;
    let iso = match default_currency(&lang) {
        "öre" => "SEK",
        c => c,
    };
    let rate = er.rate(iso).unwrap_or(1.0);
    let per_kwh = |v: Option<f64>| v.map(|v| (v * rate / 1000.0 * 1e5).round() / 1e5);
    let day = today(&c.timezone()).to_string();
    let site = public_base(&st, &headers);
    let url = ctx
        .get("canonical")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let avg_name = i18n.t(&lang, "header.avg_today_short");
    let measured: Vec<Value> = [("today", 0), ("tomorrow", 1)]
        .iter()
        .filter_map(|(when, d)| {
            let avg = per_kwh(num(&format!("avg_{when}")))?;
            let date = add_days(today(&c.timezone()), *d).to_string();
            Some(json!({
                "@type": "PropertyValue",
                "name": format!("{avg_name} {} - {}", a.name, i18n.t(&lang, &format!("chart.{when}"))),
                "value": avg,
                "minValue": per_kwh(num(&format!("min_{when}"))),
                "maxValue": per_kwh(num(&format!("max_{when}"))),
                "unitText": format!("{iso}/kWh"),
                "validFrom": date,
                "validThrough": date,
            }))
        })
        .collect();
    let cname = i18n.t(&lang, &format!("countries.{}", c.id));
    let dataset = json!({
        "@type": "Dataset",
        "@id": format!("{url}#dataset"),
        "name": i18n.tf(&lang, "seo.dataset_name", &names),
        "description": description,
        "url": url,
        "inLanguage": lang_tag(&lang),
        "isAccessibleForFree": true,
        "creditText": "ENTSO-E Transparency Platform",
        "isBasedOn": "https://transparency.entsoe.eu/",
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "keywords": [a.name, a.long, cname.as_str(), "spot price", "day-ahead"],
        "spatialCoverage": { "@type": "Place", "name": format!("{} - {}, {cname}", a.name, a.long) },
        "temporalCoverage": format!("{}/..", st.app.cfg.history_start),
        "dateModified": day,
        "variableMeasured": measured,
        "distribution": [{
            "@type": "DataDownload",
            "encodingFormat": "application/json",
            "contentUrl": format!("{site}/api/v2/hass?area={}&currency={iso}", a.name),
        }],
    });
    set_modified(&mut ctx, &day);
    if let Some(p) = ld_graph(&mut ctx).get_mut(1) {
        p["mainEntity"] = json!({ "@id": format!("{url}#dataset") });
    }
    ld_graph(&mut ctx).push(dataset);
    ctx.insert("country".into(), json!(c));
    ctx.insert("area".into(), ov.clone());
    ctx.insert("single".into(), json!(single));
    ctx.insert("production".into(), overview);
    ctx.insert(
        "compare".into(),
        json!(COUNTRIES
            .iter()
            .flat_map(|c| c.areas.iter())
            .filter(|x| x.name != a.name)
            .collect::<Vec<_>>()),
    );
    boot.insert("country".into(), json!(c));
    boot.insert("area".into(), ov);
    boot.insert("production".into(), series);
    boot.insert("net".into(), net);
    render(&st, "area.html", finish(ctx, boot))
}

pub async fn custom(
    State(st): State<WebState>,
    uri: Uri,
    headers: HeaderMap,
    Query(q): Query<BTreeMap<String, String>>,
) -> PageResult {
    let lang = detect_lang(&uri, &headers);
    // Every period and area is its own url; only the empty form is worth indexing
    let has_params = ["period", "area", "startDate", "endDate"]
        .iter()
        .any(|k| q.contains_key(*k));
    let kind = if has_params {
        Kind::NoIndex
    } else {
        Kind::Localized
    };
    let head = page_head(&st, &lang, "custom", kind);
    let (mut ctx, mut boot) = base(&st, &lang, "custom", head, &uri, &headers).await?;
    let d = today(&crate::timeutil::stockholm()).to_string();
    let form = json!({
        "area": q.get("area").cloned().unwrap_or_else(|| "SE1".into()),
        "period": q.get("period").cloned().unwrap_or_else(|| "daily".into()),
        "startDate": q.get("startDate").cloned().unwrap_or_else(|| d.clone()),
        "endDate": q.get("endDate").cloned().unwrap_or(d),
        "auto": q.contains_key("area") && q.contains_key("startDate") && q.contains_key("endDate"),
    });
    ctx.insert("form".into(), form.clone());
    boot.insert("form".into(), form);
    render(&st, "custom.html", finish(ctx, boot))
}

pub async fn help(State(st): State<WebState>, uri: Uri, headers: HeaderMap) -> PageResult {
    let lang = detect_lang(&uri, &headers);
    let head = page_head(&st, &lang, "help", Kind::Localized);
    let (ctx, boot) = base(&st, &lang, "help", head, &uri, &headers).await?;
    render(&st, "help.html", finish(ctx, boot))
}

pub async fn homeassistant(State(st): State<WebState>, uri: Uri, headers: HeaderMap) -> PageResult {
    let lang = detect_lang(&uri, &headers);
    let head = page_head(&st, &lang, "hass", Kind::Localized);
    let (mut ctx, boot) = base(&st, &lang, "homeassistant", head, &uri, &headers).await?;
    ctx.insert("base_url".into(), json!(public_base(&st, &headers)));
    render(&st, "homeassistant.html", finish(ctx, boot))
}

/// Head of a translated page with its own title and description (`pages.<key>.page_title` and
/// `pages.<key>.description`)
fn page_head(st: &WebState, lang: &str, key: &str, kind: Kind) -> Head {
    let i18n = &st.app.i18n;
    Head {
        title: format!(
            "{} - {}",
            i18n.t(lang, &format!("pages.{key}.page_title")),
            i18n.t(lang, "page.title")
        ),
        description: i18n.t(lang, &format!("pages.{key}.description")),
        kind,
    }
}

/// Permanent redirect that keeps the query (`?lang=`)
fn moved(to: String, uri: &Uri) -> Response {
    let to = match uri.query() {
        Some(q) => format!("{to}?{q}"),
        None => to,
    };
    Redirect::permanent(&to).into_response()
}

fn public_base(st: &WebState, headers: &HeaderMap) -> String {
    if let Some(u) = &st.app.cfg.public_url {
        return u.clone();
    }
    let host = headers
        .get(header::HOST)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("localhost");
    let proto = headers
        .get("x-forwarded-proto")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("http");
    format!("{proto}://{host}")
}

pub async fn robots(State(st): State<WebState>, headers: HeaderMap) -> Response {
    let base = public_base(&st, &headers);
    (
        [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
        format!(
            "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /healthz\n\n\
             # Site and API summary for language models: {base}/llms.txt\n\
             Sitemap: {base}/sitemap.xml\n"
        ),
    )
        .into_response()
}

/// Paths of the translated pages: start page, countries with several zones, every zone
fn localized_paths() -> Vec<String> {
    let mut paths = vec!["/".to_string()];
    for c in COUNTRIES {
        if c.areas.len() > 1 {
            paths.push(format!("/{}", c.id));
        }
        for a in c.areas {
            paths.push(format!("/{}/{}", c.id, a.name));
        }
    }
    paths
}

pub async fn sitemap(State(st): State<WebState>, headers: HeaderMap) -> Response {
    let base = public_base(&st, &headers);
    let day = today(&TimeZone::UTC).to_string();
    // (url, lastmod). Price pages change every day.
    let mut urls: Vec<(String, Option<&str>)> = vec![];
    for p in localized_paths() {
        urls.push((format!("{base}{p}"), Some(&day)));
        for l in LANGUAGES {
            if lang_from_path(&p) != Some(*l) {
                urls.push((format!("{base}{p}?lang={l}"), Some(&day)));
            }
        }
    }
    // Translated pages without a date we know
    for p in ["/help", "/homeassistant", "/custom"] {
        urls.push((format!("{base}{p}"), None));
        for l in LANGUAGES {
            urls.push((format!("{base}{p}?lang={l}"), None));
        }
    }
    let mut xml = String::from(r#"<?xml version="1.0" encoding="UTF-8"?>"#);
    xml.push_str(r#"<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">"#);
    for (loc, lastmod) in urls {
        xml.push_str(&format!("<url><loc>{}</loc>", loc.replace('&', "&amp;")));
        if let Some(d) = lastmod {
            xml.push_str(&format!("<lastmod>{d}</lastmod>"));
        }
        xml.push_str("</url>");
    }
    xml.push_str("</urlset>");
    (
        [(header::CONTENT_TYPE, "application/xml; charset=utf-8")],
        xml,
    )
        .into_response()
}

/// `/llms.txt`: what the site is, its pages and its API, for language models and agents
pub async fn llms(State(st): State<WebState>, headers: HeaderMap) -> Response {
    let base = public_base(&st, &headers);
    let i18n = &st.app.i18n;
    let d = today(&crate::timeutil::stockholm());
    let from = add_days(d, -30);
    let mut out = format!(
        "# {site}\n\n\
         > Free website and open JSON API with day-ahead electricity spot prices for {zones} \
         bidding zones in the Nordics and Europe: the price right now, today, tomorrow (published \
         around 13:00 CET) and history since {start}, plus production per type, consumption, \
         cross-border power flows and outages. Prices come from the ENTSO-E Transparency Platform \
         and are converted with ECB reference rates. No API key is needed.\n\n\
         Spot prices exclude surcharges, grid fees, energy tax and VAT. The API returns prices in \
         the chosen currency per MWh (`/api/v2/spot`, times in milliseconds since the epoch) or \
         per kWh (`/api/v2/hass`). Days follow the local time zone of the zone. Prices are \
         in 15-minute or 60-minute intervals depending on the market. Please credit \
         \"ENTSO-E Transparency Platform\" when re-using the data; the data is licensed \
         CC BY 4.0 under the [ENTSO-E terms of use]({terms}). This project is independent of ENTSO-E.\n\n\
         Pages are available in {langs}: add `?lang=xx` to any page url.\n\n\
         ## API\n\n\
         - [Spot prices]({base}/api/v2/spot?period=daily&area=SE3&startDate={from}&endDate={d}&currency=EUR): \
         `period` = `hourly` (raw intervals), `daily`, `weekly`, `monthly`, `yearly` or `total`; \
         `area` = zone code from the list below; `startDate`/`endDate` = `YYYY-MM-DD`; \
         optional `currency` (any ECB currency, default EUR) and `interval` (`PT15M`/`PT60M`). \
         At most 31 days per request for `hourly`, 366 days for `daily`. Returns \
         `[{{time, price, min, max}}]` in currency/MWh.\n\
         - [Yesterday, today and tomorrow]({base}/api/v2/hass?area=SE3&currency=SEK): \
         per-kWh prices with `now`, `avg`, `min`, `max` and the same for tomorrow and yesterday. \
         Optional `extra` (fee per kWh), `multiplier`, `factor` (VAT, e.g. 1.25) and `decimals`.\n\
         - [Cheapest hours]({base}/api/v2/cheapest?area=SE3&hours=3): the cheapest unbroken \
         `hours` (or with `consecutive=false` the cheapest separate intervals) from now to the end \
         of tomorrow, or between optional `from` and `to`. Returns `start`, `end`, average `price` \
         (currency/MWh), `windows`, the intervals in `data` and `active` (true while one of them is in progress).\n\
         - [Cross-border flows]({base}/api/v2/flows): latest physical flows between zones, MW.\n\
         - [Status]({base}/api/v2/status): data freshness.\n\n\
         ## Bidding zones\n\n\
         - [Map of all zones with current prices and flows]({base}/)\n",
        site = i18n.t("en", "page.title"),
        zones = zone_count(),
        start = st.app.cfg.history_start,
        terms = ENTSOE_TERMS,
        langs = LANGUAGES
            .iter()
            .map(|l| lang_tag(l))
            .collect::<Vec<_>>()
            .join(", "),
    );
    for c in COUNTRIES {
        let cname = i18n.t("en", &format!("countries.{}", c.id));
        if c.areas.len() > 1 {
            out.push_str(&format!(
                "- [{cname}, all zones]({base}/{}): {}\n",
                c.id,
                c.areas
                    .iter()
                    .map(|a| a.name)
                    .collect::<Vec<_>>()
                    .join(", ")
            ));
        }
        for a in c.areas {
            out.push_str(&format!(
                "- [{cname} {} - {}]({base}/{}/{}): area code `{}`\n",
                a.name, a.long, c.id, a.name, a.name
            ));
        }
    }
    out.push_str(&format!(
        "\n## Optional\n\n\
         - [Help]({base}/help): price types, taxes and fees, how actual prices are calculated\n\
         - [Home Assistant]({base}/homeassistant): REST sensor configuration\n\
         - [Custom period]({base}/custom): table of prices for any zone and period\n\
         - [Source code](https://github.com/Hexagon/spotweb)\n"
    ));
    (
        [
            (header::CONTENT_TYPE, "text/plain; charset=utf-8"),
            (header::CACHE_CONTROL, "public, max-age=3600"),
        ],
        out,
    )
        .into_response()
}

async fn not_found_page(st: &WebState, uri: &Uri, headers: &HeaderMap) -> Response {
    let lang = detect_lang(uri, headers);
    let head = Head {
        title: format!("404 - {}", st.app.i18n.t(&lang, "page.title")),
        description: String::new(),
        kind: Kind::NoIndex,
    };
    let res = match base(st, &lang, "404", head, uri, headers).await {
        Ok((ctx, boot)) => render(st, "404.html", finish(ctx, boot)).unwrap_or_else(|r| r),
        Err(r) => r,
    };
    let mut res = res;
    *res.status_mut() = StatusCode::NOT_FOUND;
    res
}

pub async fn not_found(State(st): State<WebState>, uri: Uri, headers: HeaderMap) -> Response {
    not_found_page(&st, &uri, &headers).await
}
