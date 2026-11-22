//! HTTP server: routing, static assets, templates

mod api;
pub mod data;
pub mod metrics;
mod pages;
pub mod ratelimit;

use std::sync::Arc;
use std::time::Duration;

use axum::body::Body;
use axum::extract::Request;
use axum::http::{header, HeaderMap, HeaderValue, StatusCode, Uri};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use minijinja::value::Value;
use minijinja::{Environment, State as TplState};
use rust_embed::RustEmbed;
use tower_http::catch_panic::CatchPanicLayer;
use tower_http::compression::CompressionLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

use crate::countries::{lang_from_path, LANGUAGES};
use crate::App;

#[derive(RustEmbed)]
#[folder = "static/"]
struct Static;

#[derive(RustEmbed)]
#[folder = "templates/"]
struct Templates;

/// How pages send their Content-Security-Policy
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Csp {
    Enforce,
    ReportOnly,
    Off,
}

/// A strict, nonce based policy as recommended by Google, so that AdSense, Analytics and the
/// analytics script keep working without listing their hosts. Scripts need the page's nonce;
/// scripts they load are trusted (`strict-dynamic`). `https:` and `'unsafe-inline'` are only
/// fallbacks for browsers without nonce support and are ignored by the others.
pub fn csp_policy(nonce: &str) -> String {
    format!(
        "script-src 'nonce-{nonce}' 'strict-dynamic' https: 'unsafe-inline'; \
         object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
    )
}

/// Random nonce for one response
pub fn new_nonce() -> String {
    uuid::Uuid::new_v4().simple().to_string()
}

#[derive(Clone)]
pub struct WebState {
    pub app: App,
    pub env: Arc<Environment<'static>>,
}

/// Thousands grouping like `Intl.NumberFormat` for our languages
pub fn format_int(v: f64, lang: &str) -> String {
    if !v.is_finite() {
        return String::new();
    }
    let sep = match lang {
        "en" => ",",
        "de" | "nl" | "dk" | "es" => ".",
        _ => "\u{a0}",
    };
    let n = v.round() as i64;
    let digits = n.unsigned_abs().to_string();
    let mut out = String::new();
    for (i, ch) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i).is_multiple_of(3) {
            out.push_str(sep);
        }
        out.push(ch);
    }
    if n < 0 {
        format!("-{out}")
    } else {
        out
    }
}

fn template_env(app: &App) -> Environment<'static> {
    let mut env = Environment::new();
    env.set_loader(|name| {
        Ok(Templates::get(name).map(|f| String::from_utf8_lossy(&f.data).into_owned()))
    });
    env.set_auto_escape_callback(|_| minijinja::AutoEscape::Html);

    let a = app.clone();
    env.add_function("t", move |state: &TplState, key: String| -> String {
        let lang = state
            .lookup("lang")
            .map(|l| l.to_string())
            .unwrap_or_else(|| "en".into());
        a.i18n.t(&lang, &key)
    });
    // Price in EUR/MWh -> span that the browser re-renders with the visitor's settings.
    // Server side it is rendered with the default currency of the page language.
    env.add_function("price", |state: &TplState, v: Option<f64>| -> Value {
        let rate = state
            .lookup("rate")
            .and_then(|r| f64::try_from(r).ok())
            .unwrap_or(1.0);
        let decimals = state
            .lookup("decimals")
            .and_then(|r| u64::try_from(r).ok())
            .unwrap_or(2) as usize;
        let sub_unit = state
            .lookup("sub_unit")
            .map(|v| v.is_true())
            .unwrap_or(false);
        let props = crate::price::PriceProps {
            extra: 0.0,
            multiplier: 1.0,
            factor: 1.0,
            decimals,
            price_factor: false,
            sub_unit,
        };
        let text = crate::price::process_price(v.map(|v| v * rate), &props);
        match v {
            Some(v) => {
                Value::from_safe_string(format!(r#"<span class="p" data-eur="{v}">{text}</span>"#))
            }
            None => Value::from_safe_string(r#"<span class="p">-</span>"#.to_string()),
        }
    });
    // Urls in attributes (canonical, hreflang, og:url) without escaping `/`
    env.add_filter("attr", |s: String| Value::from_safe_string(attr_escape(&s)));
    // Asset url with its content hash, for `src` and `href`
    env.add_function("asset", |path: String| {
        Value::from_safe_string(attr_escape(&asset_url(&path)))
    });
    env.add_function("mw", |state: &TplState, v: Option<f64>| -> String {
        let lang = state
            .lookup("lang")
            .map(|l| l.to_string())
            .unwrap_or_else(|| "en".into());
        v.map(|v| format_int(v, &lang)).unwrap_or_default()
    });
    env
}

/// Name of the cookie that remembers a language picked with `?lang=`
pub const LANG_COOKIE: &str = "lang";

/// Valid `?lang=` value of a request, if any
pub fn query_lang(uri: &Uri) -> Option<&'static str> {
    uri.query()?
        .split('&')
        .filter_map(|pair| pair.strip_prefix("lang="))
        .filter_map(|v| LANGUAGES.iter().find(|l| **l == v).copied())
        .next_back()
}

fn cookie_lang(headers: &HeaderMap) -> Option<&'static str> {
    headers
        .get_all(header::COOKIE)
        .iter()
        .filter_map(|v| v.to_str().ok())
        .flat_map(|v| v.split(';'))
        .filter_map(|c| c.trim().strip_prefix(LANG_COOKIE)?.strip_prefix('='))
        .find_map(|v| LANGUAGES.iter().find(|l| **l == v).copied())
}

/// Best supported language in an `Accept-Language` header, by q-value
fn accept_lang(headers: &HeaderMap) -> Option<&'static str> {
    let al = headers.get(header::ACCEPT_LANGUAGE)?.to_str().ok()?;
    let mut best: Option<(f32, &'static str)> = None;
    for part in al.split(',') {
        let mut it = part.split(';');
        let tag = it.next().unwrap_or("");
        let q = it
            .find_map(|p| p.trim().strip_prefix("q="))
            .and_then(|q| q.trim().parse::<f32>().ok())
            .unwrap_or(1.0);
        if q <= 0.0 {
            continue;
        }
        if let Some(l) = crate::countries::lang_from_tag(tag) {
            if best.is_none_or(|(bq, _)| q > bq) {
                best = Some((q, l));
            }
        }
    }
    best.map(|b| b.1)
}

/// Language of a page: `?lang=`, then a language picked earlier (cookie), then the
/// language of the url (`/sv/...`), then `Accept-Language`, falling back to English.
///
/// A url that names a language always serves that language to visitors without a
/// preference of their own, so crawlers see the same content as the `hreflang` tags claim.
pub fn detect_lang(uri: &Uri, headers: &HeaderMap) -> String {
    query_lang(uri)
        .or_else(|| cookie_lang(headers))
        .or_else(|| lang_from_path(uri.path()))
        .or_else(|| accept_lang(headers))
        .unwrap_or("en")
        .to_string()
}

/// Remember a language picked with `?lang=` on a page, so links without the parameter
/// keep it. Crawlers do not keep cookies and always see the language of the url.
async fn remember_lang(req: Request, next: axum::middleware::Next) -> Response {
    let lang = if req.uri().path().starts_with("/api/") {
        None
    } else {
        query_lang(req.uri())
    };
    let mut res = next.run(req).await;
    let is_html = res
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .is_some_and(|v| v.starts_with("text/html"));
    if let (Some(l), true) = (lang, is_html) {
        if let Ok(v) = HeaderValue::from_str(&format!(
            "{LANG_COOKIE}={l}; Path=/; Max-Age=31536000; SameSite=Lax"
        )) {
            res.headers_mut().append(header::SET_COOKIE, v);
        }
    }
    res
}

/// Escape for an html attribute, leaving `/` alone (the default escaper turns it into `&#x2f;`)
fn attr_escape(s: &str) -> String {
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

/// Short content hash of an embedded static file, used as ETag and as `?v=` in asset urls
fn file_hash(file: &rust_embed::EmbeddedFile) -> String {
    file.metadata
        .sha256_hash()
        .iter()
        .take(12)
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// Url of an embedded static file with its content hash as `?v=`, so a changed file gets a new
/// url even when the version number stays the same
pub fn asset_url(path: &str) -> String {
    let path = path.trim_start_matches('/');
    match Static::get(path) {
        Some(file) => format!("/{path}?v={}", file_hash(&file)),
        None => format!("/{path}"),
    }
}

/// Serve an embedded static file. `query` is the query string of the request: assets requested
/// with their current content hash (`?v=`) never change and can be cached for good.
pub fn static_file(path: &str, query: Option<&str>, headers: &HeaderMap) -> Option<Response> {
    let path = path.trim_start_matches('/');
    let file = Static::get(path)?;
    let hash = file_hash(&file);
    let etag = format!("\"{hash}\"");
    if headers
        .get(header::IF_NONE_MATCH)
        .and_then(|v| v.to_str().ok())
        == Some(etag.as_str())
    {
        return Some(StatusCode::NOT_MODIFIED.into_response());
    }
    let versioned = query
        .unwrap_or("")
        .split('&')
        .any(|pair| pair.strip_prefix("v=") == Some(hash.as_str()));
    let cache = if path.starts_with("assets/") && versioned {
        "public, max-age=31536000, immutable"
    } else if path.starts_with("assets/") {
        "public, max-age=604800"
    } else if path == "worker.js" || path == "initworker.js" {
        "no-cache"
    } else {
        "public, max-age=3600"
    };
    let mime = file.metadata.mimetype().to_string();
    Some(
        Response::builder()
            .header(header::CONTENT_TYPE, mime)
            .header(header::CACHE_CONTROL, cache)
            .header(header::ETAG, etag)
            .body(Body::from(file.data.into_owned()))
            .expect("response"),
    )
}

/// Whether `path` is one of the embedded static files
pub fn is_static(path: &str) -> bool {
    Static::get(path.trim_start_matches('/')).is_some()
}

async fn static_handler(req: Request) -> Response {
    static_file(req.uri().path(), req.uri().query(), req.headers())
        .unwrap_or_else(|| StatusCode::NOT_FOUND.into_response())
}

async fn security_headers(req: Request, next: axum::middleware::Next) -> Response {
    let mut res = next.run(req).await;
    let h = res.headers_mut();
    h.entry(header::X_CONTENT_TYPE_OPTIONS)
        .or_insert(HeaderValue::from_static("nosniff"));
    h.entry(header::REFERRER_POLICY)
        .or_insert(HeaderValue::from_static("strict-origin-when-cross-origin"));
    h.entry(header::X_FRAME_OPTIONS)
        .or_insert(HeaderValue::from_static("SAMEORIGIN"));
    res
}

/// ETag and `304 Not Modified` for successful API GET responses. Handlers may set their own
/// ETag (when the body contains volatile fields), otherwise it is computed from the body.
async fn api_etag(req: Request, next: axum::middleware::Next) -> Response {
    let is_api = req.method() == axum::http::Method::GET && req.uri().path().starts_with("/api/");
    let inm = req
        .headers()
        .get(header::IF_NONE_MATCH)
        .and_then(|v| v.to_str().ok())
        .map(str::to_string);
    let res = next.run(req).await;
    if !is_api || res.status() != StatusCode::OK {
        return res;
    }
    let (mut parts, body) = res.into_parts();
    let tag = match parts
        .headers
        .get(header::ETAG)
        .and_then(|v| v.to_str().ok())
    {
        Some(t) => t.to_string(),
        None => {
            // API bodies are small JSON documents that are already complete in memory
            let Ok(bytes) = axum::body::to_bytes(body, usize::MAX).await else {
                return StatusCode::INTERNAL_SERVER_ERROR.into_response();
            };
            let tag = api::etag(&bytes);
            if let Ok(v) = HeaderValue::from_str(&tag) {
                parts.headers.insert(header::ETAG, v);
            }
            return finish_etag(parts, Body::from(bytes), inm.as_deref(), &tag);
        }
    };
    finish_etag(parts, body, inm.as_deref(), &tag)
}

fn finish_etag(
    mut parts: axum::http::response::Parts,
    body: Body,
    if_none_match: Option<&str>,
    tag: &str,
) -> Response {
    if if_none_match.is_some_and(|inm| api::etag_matches(inm, tag)) {
        parts.status = StatusCode::NOT_MODIFIED;
        parts.headers.remove(header::CONTENT_TYPE);
        parts.headers.remove(header::CONTENT_LENGTH);
        return Response::from_parts(parts, Body::empty());
    }
    Response::from_parts(parts, body)
}

fn panic_response(p: Box<dyn std::any::Any + Send + 'static>) -> Response {
    let msg = p
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| p.downcast_ref::<String>().map(String::as_str))
        .unwrap_or("unknown panic");
    tracing::error!(panic = msg, "request handler panicked");
    (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
}

pub fn router(app: App) -> Router {
    let state = WebState {
        env: Arc::new(template_env(&app)),
        app,
    };
    let mut r = Router::new()
        .route("/", get(pages::index))
        .route("/help", get(pages::help))
        .route("/homeassistant", get(pages::homeassistant))
        .route("/custom", get(pages::custom))
        .route("/sitemap.xml", get(pages::sitemap))
        .route("/robots.txt", get(pages::robots))
        .route("/llms.txt", get(pages::llms))
        .route("/api/v2/spot", get(api::spot))
        .route("/api/v2/hass", get(api::hass))
        .route("/api/v2/cheapest", get(api::cheapest))
        .route("/api/v2/status", get(api::status))
        .route("/api/v2/flows", get(api::flows))
        .route("/healthz", get(api::healthz))
        .route("/healthz/data", get(api::healthz_data))
        .route("/{country}", get(pages::country))
        .route("/{country}/", get(pages::country))
        .route("/{country}/{area}", get(pages::area));
    // Every embedded static file gets its own route so it wins over `/{country}/{area}`
    for file in Static::iter() {
        r = r.route(&format!("/{file}"), get(static_handler));
    }
    layers(r.fallback(pages::not_found), state, REQUEST_TIMEOUT)
}

/// Longest time a request may take before it is answered with `503 Service Unavailable`
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

/// The middleware every route gets. A request that takes longer than `timeout` gets 503: the
/// server, not the client, was too slow, and 408 would invite clients and proxies to resend at
/// once. 503 rather than 504, because 504 means an upstream gateway timed out, and in front of
/// spotweb that is what the reverse proxy itself answers. The timeout is inside `metrics::track`,
/// so it is counted as a 5xx.
fn layers(r: Router<WebState>, state: WebState, timeout: Duration) -> Router {
    r
        // A panicking handler answers 500 (with the usual headers) instead of dropping the connection
        .layer(CatchPanicLayer::custom(panic_response))
        .layer(axum::middleware::from_fn(api_etag))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            ratelimit::limit,
        ))
        .layer(axum::middleware::from_fn(remember_lang))
        .layer(axum::middleware::from_fn(security_headers))
        .layer(CompressionLayer::new())
        .layer(TimeoutLayer::with_status_code(
            StatusCode::SERVICE_UNAVAILABLE,
            timeout,
        ))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            metrics::track,
        ))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

#[cfg(test)]
mod tests;
