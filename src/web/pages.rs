//! Server rendered pages. Same urls as 1.x.
#![allow(clippy::result_large_err)]

use std::collections::{BTreeMap, BTreeSet};

use axum::extract::{Path, Query, State};
use axum::http::{header, HeaderMap, StatusCode, Uri};
use axum::response::{Html, IntoResponse, Redirect, Response};
use chrono::{Datelike, Months, TimeZone};
use chrono_tz::Tz;
use serde_json::{json, Map, Value};

use super::{data, detect_lang, WebState};
use crate::countries::{
    country as find_country, default_currency, default_decimals, Area, Country, COUNTRIES,
};
use crate::db::queries::{GenerationRow, LoadRow, OutageRow};
use crate::price::{process_price, PriceProps};
use crate::timeutil::{day_range, interval_ms, now_ms, today, HOUR_MS};

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
        header::HeaderValue::from_static("Accept-Language"),
    );
    Ok(res)
}

fn fmt_date(tz: &Tz, ms: Option<i64>) -> String {
    ms.and_then(|ms| tz.timestamp_millis_opt(ms).single())
        .map(|d| d.format("%Y-%m-%d").to_string())
        .unwrap_or_default()
}

fn fmt_datetime(tz: &Tz, ms: i64) -> String {
    tz.timestamp_millis_opt(ms)
        .single()
        .map(|d| d.format("%Y-%m-%d %H:%M").to_string())
        .unwrap_or_default()
}

/// Escape for embedding JSON inside a <script> element
fn script_json(v: &Value) -> String {
    v.to_string().replace("</", "<\\/")
}

/// Context shared by all pages. `boot` is handed to app.js.
async fn base(
    st: &WebState,
    lang: &str,
    page: &str,
    title: String,
    uri: &Uri,
    headers: &HeaderMap,
) -> Result<(Map<String, Value>, Map<String, Value>), Response> {
    let er = data::exchange_rates(&st.app).await.map_err(internal)?;
    let currency = default_currency(lang);
    let mut ctx = Map::new();
    ctx.insert("lang".into(), json!(lang));
    ctx.insert("page".into(), json!(page));
    ctx.insert("title".into(), json!(title));
    ctx.insert("version".into(), json!(env!("CARGO_PKG_VERSION")));
    ctx.insert("adsense".into(), json!(st.app.cfg.adsense));
    ctx.insert("ga_id".into(), json!(st.app.cfg.ga_id));
    ctx.insert("countries".into(), json!(COUNTRIES));
    ctx.insert("currency".into(), json!(currency));
    ctx.insert("rate".into(), json!(er.rate(currency).unwrap_or(1.0)));
    ctx.insert("decimals".into(), json!(default_decimals(currency)));
    ctx.insert("sub_unit".into(), json!(currency == "öre"));
    ctx.insert("er".into(), json!(&*er));
    ctx.insert("languages".into(), json!(crate::countries::LANGUAGES));
    // Absolute links for sharing and link previews. The language is left out on purpose:
    // the recipient gets the page in their own language.
    let site = public_base(st, headers);
    let canonical = match (page, uri.query()) {
        ("custom", Some(q)) => format!("{site}{}?{}", uri.path(), custom_query(q)),
        _ => format!("{site}{}", uri.path()),
    };
    ctx.insert("site_url".into(), json!(site));
    ctx.insert("canonical".into(), json!(canonical));

    let page_ld = json!({
        "@context": "http://schema.org",
        "@type": "WebPage",
        "name": st.app.i18n.t(lang, "page.title"),
        "description": format!("{} - {}.", st.app.i18n.t(lang, "header.title"), title),
        "dateModified": chrono::Utc::now().format("%Y-%m-%d").to_string(),
    });
    ctx.insert("jsonld_page".into(), json!(script_json(&page_ld)));

    let mut boot = Map::new();
    boot.insert("lang".into(), json!(lang));
    boot.insert("page".into(), json!(page));
    boot.insert("i18n".into(), st.app.i18n.raw(lang).clone());
    boot.insert("er".into(), json!(&*er));
    boot.insert("countries".into(), json!(COUNTRIES));
    Ok((ctx, boot))
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
    ctx.insert("boot".into(), json!(script_json(&Value::Object(boot))));
    Value::Object(ctx)
}

// ---------------------------------------------------------------------------
// Production helpers (port of ProductionOverview / ProductionDetailsTodayChart)
// ---------------------------------------------------------------------------

fn psr_key(group: &Option<String>, consumption: i64) -> String {
    format!("{}_{}", group.as_deref().unwrap_or("other"), consumption)
}

fn production_overview(gen: &[GenerationRow], load: &[LoadRow], interval: &str, tz: &Tz) -> Value {
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
        load_total = load.last().map(|l| l.1).unwrap_or(0.0);
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

fn outage_json(o: &OutageRow, tz: &Tz) -> Value {
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
    let tomorrow_s = data::day_series(&st.app, c, a.name, t + chrono::Duration::days(1))
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
        let prev = t
            .with_day(1)
            .and_then(|d| d.checked_sub_months(Months::new(1)))
            .unwrap_or(t);
        let m = data::month_stats(&st.app, c, a.name, t)
            .await
            .map_err(internal)?;
        let p = data::month_stats(&st.app, c, a.name, prev)
            .await
            .map_err(internal)?;
        let o = v.as_object_mut().expect("object");
        o.insert("month".into(), json!(t.month0()));
        o.insert("prev_month".into(), json!(prev.month0()));
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
    let (from, _) = day_range(&tz, t - chrono::Duration::days(1));
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
    let title = st.app.i18n.t(&lang, "header.title");
    let (mut ctx, mut boot) = base(&st, &lang, "index", title, &uri, &headers).await?;
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
        return Ok(Redirect::temporary(&format!("/{}/{}", c.id, c.areas[0].name)).into_response());
    }
    let lang = detect_lang(&uri, &headers);
    let title = format!(
        "{} - {}",
        c.name,
        c.areas
            .iter()
            .map(|a| a.name)
            .collect::<Vec<_>>()
            .join(", ")
    );
    let (mut ctx, mut boot) = base(&st, &lang, c.id, title, &uri, &headers).await?;
    let mut areas = vec![];
    for a in c.areas {
        areas.push(area_overview(&st, c, a, false).await?);
    }
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
        return Ok(Redirect::temporary(&format!("/sv/{aname}")).into_response());
    }
    let Some(c) = find_country(&cid) else {
        return Ok(not_found_page(&st, &uri, &headers).await);
    };
    let Some(a) = c.areas.iter().find(|a| a.name == aname) else {
        return Ok(not_found_page(&st, &uri, &headers).await);
    };
    let lang = detect_lang(&uri, &headers);
    let title = format!("{} - {}", a.name, a.long);
    let (mut ctx, mut boot) = base(&st, &lang, a.id, title, &uri, &headers).await?;
    let ov = area_overview(&st, c, a, true).await?;
    let (overview, series, net) = production_ctx(&st, c, a.id).await?;
    let single = c.areas.len() == 1;
    if single {
        ctx.insert("outages".into(), outages_ctx(&st, c).await?);
    }

    // schema.org price descriptor, like 1.x (default currency, spot price)
    let currency = default_currency(&lang);
    let rate = ctx.get("rate").and_then(|r| r.as_f64()).unwrap_or(1.0);
    let props = PriceProps {
        extra: 0.0,
        multiplier: 1.0,
        factor: 1.0,
        decimals: 5,
        price_factor: false,
        sub_unit: currency == "öre",
    };
    let p = |k: &str| process_price(ov.get(k).and_then(|v| v.as_f64()).map(|v| v * rate), &props);
    let day = today(&c.timezone()).format("%Y-%m-%d").to_string();
    let price_ld = json!({
        "@context": "https://schema.org",
        "@type": "UnitPriceSpecification",
        "maxPrice": p("max_today"),
        "minPrice": p("min_today"),
        "name": format!("{} {} - {}", st.app.i18n.t(&lang, "header.avg_today_short"), a.name, a.long),
        "price": p("avg_today"),
        "priceCurrency": currency,
        "unitCode": "kWh",
        "validFrom": day,
        "validThrough": day,
    });
    ctx.insert("jsonld_price".into(), json!(script_json(&price_ld)));
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
    let (mut ctx, mut boot) = base(
        &st,
        &lang,
        "custom",
        st.app.i18n.t(&lang, "pages.custom.title"),
        &uri,
        &headers,
    )
    .await?;
    let d = today(&chrono_tz::Europe::Stockholm)
        .format("%Y-%m-%d")
        .to_string();
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
    let (ctx, boot) = base(
        &st,
        &lang,
        "help",
        st.app.i18n.t(&lang, "pages.help.page_title"),
        &uri,
        &headers,
    )
    .await?;
    render(&st, "help.html", finish(ctx, boot))
}

pub async fn homeassistant(State(st): State<WebState>, uri: Uri, headers: HeaderMap) -> PageResult {
    let lang = detect_lang(&uri, &headers);
    let (mut ctx, boot) = base(
        &st,
        &lang,
        "homeassistant",
        st.app.i18n.t(&lang, "pages.hass.page_title"),
        &uri,
        &headers,
    )
    .await?;
    ctx.insert("base_url".into(), json!(public_base(&st, &headers)));
    render(&st, "homeassistant.html", finish(ctx, boot))
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
        format!("User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: {base}/sitemap.xml\n"),
    )
        .into_response()
}

pub async fn sitemap(State(st): State<WebState>, headers: HeaderMap) -> Response {
    let base = public_base(&st, &headers);
    let day = chrono::Utc::now().format("%Y-%m-%d");
    let mut paths = vec!["/".to_string(), "/help".into(), "/homeassistant".into()];
    for c in COUNTRIES {
        if c.areas.len() > 1 {
            paths.push(format!("/{}", c.id));
        }
        for a in c.areas {
            paths.push(format!("/{}/{}", c.id, a.name));
        }
    }
    let mut xml = String::from(r#"<?xml version="1.0" encoding="UTF-8"?>"#);
    xml.push_str(r#"<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">"#);
    for p in paths {
        xml.push_str(&format!(
            "<url><loc>{base}{p}</loc><lastmod>{day}</lastmod></url>"
        ));
    }
    xml.push_str("</urlset>");
    (
        [(header::CONTENT_TYPE, "application/xml; charset=utf-8")],
        xml,
    )
        .into_response()
}

async fn not_found_page(st: &WebState, uri: &Uri, headers: &HeaderMap) -> Response {
    let lang = detect_lang(uri, headers);
    let res = match base(st, &lang, "404", "404".into(), uri, headers).await {
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
