//! News pages (`/news`, `/news/{country}`, `/news/{id}`), the Atom feed, `/api/v2/news` and the
//! news lists shown on the start, country and zone pages. See `crate::news`.

use axum::extract::{Path, Query, State};
use axum::http::{header, HeaderMap, StatusCode, Uri};
use axum::response::{IntoResponse, Redirect, Response};
use serde::Deserialize;
use serde_json::{json, Map, Value};

use super::pages::{
    base, finish, internal, ld_graph, not_found_page, public_base, render, set_modified, Head,
    Kind, PageResult,
};
use super::{data, detect_lang, query_lang, WebState};
use crate::countries::{country as find_country, find_area, lang_tag, COUNTRIES, LANGUAGES};
use crate::db::queries::{NewsFilter, NewsRow};
use crate::news::{self, PriceFmt};
use crate::timeutil::{local_date, market_tz, now_ms, ts};

/// Items on a list page and in a feed
const PAGE_SIZE: usize = 40;

async fn price_fmt(st: &WebState, lang: &str) -> anyhow::Result<PriceFmt> {
    Ok(PriceFmt::new(&*data::exchange_rates(&st.app).await?, lang))
}

/// Publication time as text in the market time zone (CET)
fn published_text(st: &WebState, lang: &str, ms: i64) -> String {
    let tz = market_tz();
    format!(
        "{} {}",
        news::date_short(&st.app.i18n, lang, local_date(&tz, ms)),
        ts(ms).to_zoned(tz).strftime("%H:%M")
    )
}

/// An item as the templates use it
fn card(st: &WebState, lang: &str, pf: &PriceFmt, item: &NewsRow) -> Option<Value> {
    let r = news::render(item, &st.app.i18n, lang, pf)?;
    Some(json!({
        "id": item.id,
        "url": news::path(item),
        "kind": item.kind,
        "area": item.area,
        "country": item.country,
        "importance": item.importance,
        "title": r.title,
        "summary": r.summary,
        "html": r.html,
        "published": published_text(st, lang, item.published),
        "published_iso": crate::timeutil::iso_secs(ts(item.published)),
        "updated_iso": crate::timeutil::iso_secs(ts(item.updated)),
    }))
}

fn cards(st: &WebState, lang: &str, pf: &PriceFmt, items: &[NewsRow]) -> Vec<Value> {
    items.iter().filter_map(|i| card(st, lang, pf, i)).collect()
}

/// Which list a page or feed shows
#[derive(Clone, Copy)]
pub enum Scope<'a> {
    Europe,
    Country(&'a str),
    Area(&'a str),
}

fn filter(scope: Scope, limit: usize, before: Option<i64>) -> NewsFilter {
    let mut f = NewsFilter {
        limit,
        before,
        ..Default::default()
    };
    match scope {
        // Global news only: items about no particular country
        Scope::Europe => f.country = Some(String::new()),
        Scope::Country(c) => f.country = Some(c.into()),
        Scope::Area(a) => f.area = Some(a.into()),
    }
    f
}

fn feed_path(scope: Scope) -> String {
    match scope {
        Scope::Europe => "/news/feed.xml".into(),
        Scope::Country(c) => format!("/news/feed.xml?country={c}"),
        Scope::Area(a) => format!("/news/feed.xml?area={a}"),
    }
}

/// The latest items for the news box of the start, country and zone pages, and the feed of
/// the page in `<head>`
pub(super) async fn latest(
    st: &WebState,
    lang: &str,
    scope: Scope<'_>,
    limit: usize,
    ctx: &mut Map<String, Value>,
) -> Result<(), Response> {
    let items = data::news(&st.app, filter(scope, limit, None))
        .await
        .map_err(internal)?;
    let pf = price_fmt(st, lang).await.map_err(internal)?;
    let more = match scope {
        Scope::Europe => "/news".to_string(),
        Scope::Country(c) => format!("/news/{c}"),
        Scope::Area(a) => format!(
            "/news/{}",
            find_area(a).map(|(c, _)| c.id).unwrap_or_default()
        ),
    };
    ctx.insert(
        "news".into(),
        json!({ "items": cards(st, lang, &pf, &items), "more": more }),
    );
    ctx.insert("feed".into(), json!(feed_url(scope, lang)));
    Ok(())
}

fn feed_url(scope: Scope, lang: &str) -> String {
    let p = feed_path(scope);
    let sep = if p.contains('?') { '&' } else { '?' };
    format!("{p}{sep}lang={lang}")
}

#[derive(Deserialize, Default)]
pub struct ListQuery {
    before: Option<i64>,
}

/// `/news`: global news (all of Europe)
pub async fn index(
    State(st): State<WebState>,
    uri: Uri,
    headers: HeaderMap,
    Query(q): Query<ListQuery>,
) -> PageResult {
    list(&st, &uri, &headers, Scope::Europe, q.before).await
}

/// `/news/{key}`: the items of a country, or one item
pub async fn key(
    State(st): State<WebState>,
    Path(key): Path<String>,
    uri: Uri,
    headers: HeaderMap,
    Query(q): Query<ListQuery>,
) -> PageResult {
    let key = key.to_ascii_lowercase();
    if let Some(c) = find_country(&key) {
        return list(&st, &uri, &headers, Scope::Country(c.id), q.before).await;
    }
    article(&st, &key, &uri, &headers).await
}

async fn list(
    st: &WebState,
    uri: &Uri,
    headers: &HeaderMap,
    scope: Scope<'_>,
    before: Option<i64>,
) -> PageResult {
    let lang = detect_lang(uri, headers);
    let i18n = &st.app.i18n;
    let (h1, description) = match scope {
        Scope::Country(c) => {
            let cname = i18n.t(&lang, &format!("countries.{c}"));
            (
                i18n.tf(&lang, "pages.news.country_title", &[("country", &cname)]),
                i18n.tf(
                    &lang,
                    "pages.news.country_description",
                    &[("country", &cname)],
                ),
            )
        }
        _ => (
            i18n.t(&lang, "pages.news.title"),
            i18n.t(&lang, "pages.news.description"),
        ),
    };
    let head = Head {
        title: format!("{h1} - {}", i18n.t(&lang, "page.title")),
        description,
        // Older pages are reached through links; only the first page is indexed
        kind: if before.is_some() {
            Kind::NoIndex
        } else {
            Kind::Localized
        },
    };
    let page = match scope {
        Scope::Country(c) => format!("news-{c}"),
        _ => "news".into(),
    };
    let (mut ctx, boot) = base(st, &lang, &page, head, uri, headers).await?;
    let items = data::news(&st.app, filter(scope, PAGE_SIZE, before))
        .await
        .map_err(internal)?;
    let pf = price_fmt(st, &lang).await.map_err(internal)?;
    let list = cards(st, &lang, &pf, &items);
    let older = (items.len() == PAGE_SIZE)
        .then(|| items.last().map(|i| i.published))
        .flatten();
    if let Some(first) = items.first() {
        set_modified(
            &mut ctx,
            &local_date(&market_tz(), first.updated).to_string(),
        );
    }
    // schema.org ItemList of the articles on the page
    let site = public_base(st, headers);
    let lang_q = query_lang(uri)
        .map(|l| format!("?lang={l}"))
        .unwrap_or_default();
    let elements: Vec<Value> = list
        .iter()
        .enumerate()
        .map(|(i, c)| {
            json!({
                "@type": "ListItem",
                "position": i + 1,
                "url": format!("{site}{}{lang_q}", c["url"].as_str().unwrap_or("")),
                "name": c["title"],
            })
        })
        .collect();
    ld_graph(&mut ctx).push(json!({ "@type": "ItemList", "itemListElement": elements }));
    ctx.insert("h1".into(), json!(h1));
    ctx.insert("items".into(), json!(list));
    ctx.insert("older".into(), json!(older));
    ctx.insert("feed".into(), json!(feed_url(scope, &lang)));
    if let Scope::Country(c) = scope {
        ctx.insert("country".into(), json!(find_country(c)));
    }
    ctx.insert(
        "news_countries".into(),
        json!(COUNTRIES.iter().map(|c| c.id).collect::<Vec<_>>()),
    );
    render(st, "news.html", finish(ctx, boot))
}

async fn article(st: &WebState, id: &str, uri: &Uri, headers: &HeaderMap) -> PageResult {
    let page = data::news_item(&st.app, id).await.map_err(internal)?;
    let Some((item, prev, next)) = page.as_ref() else {
        return Ok(not_found_page(st, uri, headers).await);
    };
    let lang = detect_lang(uri, headers);
    let langs = news::languages(item);
    if !langs.contains(&lang.as_str()) {
        // Not written in this language: the English version, or else the first one
        let Some(to) = langs.iter().find(|l| **l == "en").or(langs.first()) else {
            return Ok(not_found_page(st, uri, headers).await);
        };
        return Ok(Redirect::temporary(&format!("{}?lang={to}", news::path(item))).into_response());
    }
    let pf = price_fmt(st, &lang).await.map_err(internal)?;
    let Some(c) = card(st, &lang, &pf, item) else {
        return Ok(not_found_page(st, uri, headers).await);
    };
    let i18n = &st.app.i18n;
    let title = c["title"].as_str().unwrap_or_default().to_string();
    let summary = c["summary"].as_str().unwrap_or_default();
    let description: String = if summary.chars().count() > 300 {
        summary.chars().take(297).collect::<String>() + "..."
    } else {
        summary.to_string()
    };
    let head = Head {
        title: format!("{title} - {}", i18n.t(&lang, "page.title")),
        description: description.clone(),
        kind: if news::indexable(item) {
            Kind::Localized
        } else {
            Kind::NoIndex
        },
    };
    let (mut ctx, boot) = base(st, &lang, "news-item", head, uri, headers).await?;
    let site = public_base(st, headers);
    if langs.len() < LANGUAGES.len() {
        // Only the languages it exists in; the default is English or the first of them
        let href = |l: &str| format!("{site}{}?lang={l}", news::path(item));
        let mut alt: Vec<Value> = langs
            .iter()
            .map(|l| json!({ "hreflang": lang_tag(l), "href": href(l) }))
            .collect();
        let default = langs.iter().find(|l| **l == "en").unwrap_or(&langs[0]);
        alt.push(json!({ "hreflang": "x-default", "href": href(default) }));
        ctx.insert("alternates".into(), json!(alt));
        ctx.insert("canonical".into(), json!(href(&lang)));
    }
    let url = ctx
        .get("canonical")
        .and_then(Value::as_str)
        .map(str::to_string)
        .unwrap_or_else(|| format!("{site}{}", news::path(item)));
    let zone = find_area(&item.area);
    let mut about = vec![];
    let mut crumbs = vec![
        json!({ "@type": "ListItem", "position": 1, "name": i18n.t(&lang, "nav.index"), "item": format!("{site}/") }),
        json!({ "@type": "ListItem", "position": 2, "name": i18n.t(&lang, "pages.news.title"), "item": format!("{site}/news") }),
    ];
    let country = zone.map(|z| z.0).or_else(|| find_country(&item.country));
    if let Some(cty) = country {
        let cname = i18n.t(&lang, &format!("countries.{}", cty.id));
        crumbs.push(json!({ "@type": "ListItem", "position": 3, "name": cname, "item": format!("{site}/news/{}", cty.id) }));
        about.push(json!({ "@type": "Country", "name": cname }));
    }
    if let Some((cty, a)) = zone {
        about.push(json!({ "@type": "Place", "name": format!("{} - {}", a.name, a.long), "url": format!("{site}/{}/{}", cty.id, a.name) }));
    }
    crumbs.push(json!({ "@type": "ListItem", "position": crumbs.len() + 1, "name": title }));
    let org = json!({ "@type": "Organization", "name": i18n.t(&lang, "page.title"), "url": format!("{site}/"), "logo": format!("{site}/icon-512x512.png") });
    let generated = item.kind != news::CUSTOM;
    let mut article = json!({
        "@type": "NewsArticle",
        "@id": format!("{url}#article"),
        "headline": title,
        "description": description,
        "articleBody": summary,
        "datePublished": c["published_iso"],
        "dateModified": c["updated_iso"],
        "inLanguage": lang_tag(&lang),
        "mainEntityOfPage": { "@id": format!("{url}#webpage") },
        "image": format!("{site}/icon-512x512.png"),
        "author": org,
        "publisher": org,
        "about": about,
        "isAccessibleForFree": true,
    });
    if generated {
        article["isBasedOn"] = json!("https://transparency.entsoe.eu/");
        article["creditText"] = json!("ENTSO-E Transparency Platform");
    }
    set_modified(
        &mut ctx,
        &local_date(&market_tz(), item.updated).to_string(),
    );
    ld_graph(&mut ctx).push(article);
    ld_graph(&mut ctx).push(json!({ "@type": "BreadcrumbList", "itemListElement": crumbs }));
    ctx.insert("og_type".into(), json!("article"));
    ctx.insert("item".into(), c);
    ctx.insert("generated".into(), json!(generated));
    let link = |i: &Option<NewsRow>| {
        i.as_ref()
            .and_then(|i| card(st, &lang, &pf, i))
            .map(|c| json!({ "url": c["url"], "title": c["title"] }))
    };
    ctx.insert("prev".into(), json!(link(prev)));
    ctx.insert("next".into(), json!(link(next)));
    if let Some((cty, a)) = zone {
        ctx.insert("zone".into(), json!({ "name": a.name, "long": a.long, "url": format!("/{}/{}", cty.id, a.name), "country": cty.id }));
    }
    // The other zones of the country on the same day
    if let (Some(cty), true) = (country, item.kind == "day") {
        let same = data::news(
            &st.app,
            NewsFilter {
                country: Some(cty.id.into()),
                kind: Some("day".into()),
                day: Some(item.day.clone()),
                limit: 20,
                ..Default::default()
            },
        )
        .await
        .map_err(internal)?;
        let others: Vec<Value> = same
            .iter()
            .filter(|i| i.id != item.id)
            .map(|i| json!({ "url": news::path(i), "area": i.area }))
            .collect();
        ctx.insert("same_day".into(), json!(others));
    }
    if let Some(cty) = country {
        ctx.insert("news_country".into(), json!(cty.id));
    }
    ctx.insert(
        "feed".into(),
        json!(feed_url(
            match zone {
                Some((_, a)) => Scope::Area(a.name),
                None => Scope::Europe,
            },
            &lang
        )),
    );
    render(st, "news_item.html", finish(ctx, boot))
}

fn xml_escape(s: &str) -> String {
    news::html_escape(s)
}

#[derive(Deserialize, Default)]
pub struct FeedQuery {
    area: Option<String>,
    country: Option<String>,
}

/// `/news/feed.xml?lang=sv&area=SE3`: Atom feed for news readers, Home Assistant's feed reader
/// and the like. `country=` or `area=` give that country's or zone's news, without them the
/// global news.
pub async fn feed(
    State(st): State<WebState>,
    uri: Uri,
    headers: HeaderMap,
    Query(q): Query<FeedQuery>,
) -> Response {
    let lang = detect_lang(&uri, &headers);
    let zone = q.area.as_deref().and_then(find_area);
    let cty = q.country.as_deref().and_then(find_country);
    let scope = match (zone, cty) {
        (Some((_, a)), _) => Scope::Area(a.name),
        (None, Some(c)) => Scope::Country(c.id),
        _ => Scope::Europe,
    };
    let (items, pf) = match (
        data::news(&st.app, filter(scope, PAGE_SIZE, None)).await,
        price_fmt(&st, &lang).await,
    ) {
        (Ok(i), Ok(p)) => (i, p),
        (Err(e), _) | (_, Err(e)) => return internal(e),
    };
    let i18n = &st.app.i18n;
    let site = public_base(&st, &headers);
    let title = match scope {
        Scope::Area(a) => format!("{} - {a}", i18n.t(&lang, "pages.news.title")),
        Scope::Country(c) => i18n.tf(
            &lang,
            "pages.news.country_title",
            &[("country", &i18n.t(&lang, &format!("countries.{c}")))],
        ),
        Scope::Europe => i18n.t(&lang, "pages.news.title"),
    };
    let html_url = match scope {
        Scope::Area(a) => format!("/{}/{a}", find_area(a).map(|z| z.0.id).unwrap_or_default()),
        Scope::Country(c) => format!("/news/{c}"),
        Scope::Europe => "/news".into(),
    };
    let updated = items.iter().map(|i| i.updated).max().unwrap_or(0);
    let self_url = format!("{site}{}", feed_url(scope, &lang));
    let mut xml = String::from(r#"<?xml version="1.0" encoding="utf-8"?>"#);
    xml.push_str(&format!(
        r#"<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="{}"><title>{}</title><subtitle>{}</subtitle><id>{}</id><link rel="self" type="application/atom+xml" href="{}"/><link rel="alternate" type="text/html" href="{}"/><updated>{}</updated><author><name>{}</name><uri>{site}/</uri></author><icon>{site}/icon-192x192.png</icon><rights>Data: ENTSO-E Transparency Platform (CC BY 4.0)</rights>"#,
        lang_tag(&lang),
        xml_escape(&title),
        xml_escape(&i18n.t(&lang, "pages.news.auto_note")),
        xml_escape(&format!("{site}{}", feed_path(scope))),
        xml_escape(&self_url),
        xml_escape(&format!("{site}{html_url}?lang={lang}")),
        crate::timeutil::iso_secs(ts(updated)),
        xml_escape(&i18n.t(&lang, "page.title")),
    ));
    for item in items.iter() {
        let Some(r) = news::render(item, i18n, &lang, &pf) else {
            continue;
        };
        let link = format!("{site}{}?lang={lang}", news::path(item));
        let content: String = r.html.iter().map(|p| format!("<p>{p}</p>")).collect();
        xml.push_str(&format!(
            r#"<entry><id>{}</id><title>{}</title><link rel="alternate" type="text/html" href="{}"/><published>{}</published><updated>{}</updated><summary>{}</summary><content type="html">{}</content></entry>"#,
            xml_escape(&format!("{site}{}", news::path(item))),
            xml_escape(&r.title),
            xml_escape(&link),
            crate::timeutil::iso_secs(ts(item.published)),
            crate::timeutil::iso_secs(ts(item.updated)),
            xml_escape(&r.summary),
            xml_escape(&content),
        ));
    }
    xml.push_str("</feed>");
    (
        [
            (header::CONTENT_TYPE, "application/atom+xml; charset=utf-8"),
            (header::CACHE_CONTROL, "public, max-age=600"),
        ],
        xml,
    )
        .into_response()
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

#[derive(Deserialize, Default)]
pub struct ApiQuery {
    lang: Option<String>,
    area: Option<String>,
    country: Option<String>,
    kind: Option<String>,
    day: Option<String>,
    min_importance: Option<i64>,
    before: Option<i64>,
    limit: Option<usize>,
}

fn api_json(status: StatusCode, body: Value) -> Response {
    let mut res = (status, axum::Json(body)).into_response();
    let h = res.headers_mut();
    h.insert(
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        header::HeaderValue::from_static("*"),
    );
    let cache = if status.is_success() {
        "public, max-age=300"
    } else {
        "no-store"
    };
    h.insert(
        header::CACHE_CONTROL,
        header::HeaderValue::from_static(cache),
    );
    res
}

fn api_err(status: StatusCode, msg: &str) -> Response {
    api_json(status, json!({ "status": "error", "details": msg }))
}

/// `GET /api/v2/news`: items newest first, with their text in `lang` (default English) and
/// the facts they are based on (`data`, prices in EUR/MWh)
pub async fn api_list(State(st): State<WebState>, Query(q): Query<ApiQuery>) -> Response {
    let lang = q
        .lang
        .as_deref()
        .and_then(|l| LANGUAGES.iter().find(|x| **x == l))
        .copied()
        .unwrap_or("en");
    let area = match q.area.as_deref() {
        Some(a) => match find_area(a) {
            Some((_, a)) => Some(a.name.to_string()),
            None => return api_err(StatusCode::BAD_REQUEST, "unknown area"),
        },
        None => None,
    };
    let f = NewsFilter {
        area,
        country: q.country.map(|c| c.to_ascii_lowercase()),
        kind: q.kind,
        day: q.day,
        min_importance: q.min_importance.unwrap_or(0),
        before: q.before,
        limit: q.limit.unwrap_or(20).clamp(1, 100),
    };
    let (items, pf) = match (data::news(&st.app, f).await, price_fmt(&st, lang).await) {
        (Ok(i), Ok(p)) => (i, p),
        _ => return api_err(StatusCode::INTERNAL_SERVER_ERROR, "Query failed"),
    };
    let out: Vec<Value> = items
        .iter()
        .filter_map(|i| {
            let r = news::render(i, &st.app.i18n, lang, &pf)?;
            Some(json!({
                "id": i.id, "kind": i.kind, "area": i.area, "country": i.country, "day": i.day,
                "published": i.published, "updated": i.updated, "importance": i.importance,
                "url": news::path(i), "title": r.title, "summary": r.summary, "data": i.data,
            }))
        })
        .collect();
    api_json(
        StatusCode::OK,
        json!({ "status": "ok", "lang": lang, "unit": pf.unit(), "data": out }),
    )
}

/// Whether the request carries the news token (`Authorization: Bearer …`) when one is set,
/// compared in constant time
fn authorized(st: &WebState, headers: &HeaderMap) -> bool {
    let Some(token) = st.app.cfg.news_token.as_deref() else {
        // Only reachable on loopback; without a token every local client may write
        return true;
    };
    let Some(given) = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
    else {
        return false;
    };
    given.len() == token.len()
        && given
            .bytes()
            .zip(token.bytes())
            .fold(0u8, |acc, (a, b)| acc | (a ^ b))
            == 0
}

/// `POST /api/v2/news` on the local news service: add or replace a pushed item (see
/// [`news::PushedItem`]). Lets an editor or an external (AI) writer on the server publish news
/// next to the generated items.
pub async fn api_push(
    State(st): State<WebState>,
    headers: HeaderMap,
    body: axum::body::Bytes,
) -> Response {
    if !authorized(&st, &headers) {
        return api_err(StatusCode::UNAUTHORIZED, "missing or wrong token");
    }
    let pushed: news::PushedItem = match serde_json::from_slice(&body) {
        Ok(p) => p,
        Err(e) => return api_err(StatusCode::BAD_REQUEST, &e.to_string()),
    };
    let row = match news::pushed_row(pushed, now_ms()) {
        Ok(r) => r,
        Err(e) => return api_err(StatusCode::BAD_REQUEST, &e),
    };
    let id = row.id.clone();
    let res = st
        .app
        .db
        .run(move |c| Ok(crate::db::queries::upsert_news(c, &[row])?))
        .await;
    st.app.cache.invalidate("news");
    match res {
        Ok(_) => api_json(
            StatusCode::OK,
            json!({ "status": "ok", "id": id, "url": format!("/news/{id}") }),
        ),
        Err(e) => {
            tracing::error!(error = %format!("{e:#}"), "storing pushed news failed");
            api_err(StatusCode::INTERNAL_SERVER_ERROR, "Query failed")
        }
    }
}

/// `DELETE /api/v2/news/{id}` on the local news service: remove a pushed item
pub async fn api_delete(
    State(st): State<WebState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Response {
    if !authorized(&st, &headers) {
        return api_err(StatusCode::UNAUTHORIZED, "missing or wrong token");
    }
    let res = st
        .app
        .db
        .run(move |c| Ok(crate::db::queries::news_delete_custom(c, &id)?))
        .await;
    st.app.cache.invalidate("news");
    match res {
        Ok(0) => api_err(StatusCode::NOT_FOUND, "no pushed item with that id"),
        Ok(_) => api_json(StatusCode::OK, json!({ "status": "ok" })),
        Err(_) => api_err(StatusCode::INTERNAL_SERVER_ERROR, "Query failed"),
    }
}

/// News urls for the sitemap: the list pages, and the indexable items of the last 30 days,
/// with the day they last changed and the languages they exist in
pub async fn sitemap_urls(
    st: &WebState,
) -> anyhow::Result<Vec<(String, Option<String>, Vec<&'static str>)>> {
    let mut out = vec![("/news".to_string(), None, LANGUAGES.to_vec())];
    for c in COUNTRIES {
        out.push((format!("/news/{}", c.id), None, LANGUAGES.to_vec()));
    }
    let since = now_ms() - 30 * 24 * crate::timeutil::HOUR_MS;
    let items = st
        .app
        .db
        .run(move |c| {
            Ok(crate::db::queries::news_list(
                c,
                &NewsFilter {
                    limit: 1000,
                    ..Default::default()
                },
            )?)
        })
        .await?;
    for i in items
        .iter()
        .filter(|i| i.published >= since && news::indexable(i))
    {
        out.push((
            news::path(i),
            Some(local_date(&market_tz(), i.updated).to_string()),
            news::languages(i),
        ));
    }
    Ok(out)
}
