//! HTTP server: routing, static assets, templates

mod api;
pub mod data;
pub mod metrics;
mod pages;

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
    env.add_function("mw", |state: &TplState, v: Option<f64>| -> String {
        let lang = state
            .lookup("lang")
            .map(|l| l.to_string())
            .unwrap_or_else(|| "en".into());
        v.map(|v| format_int(v, &lang)).unwrap_or_default()
    });
    env
}

/// Language selection, same rules as the 1.x middleware: path, then
/// Accept-Language, then `?lang=`, falling back to English.
pub fn detect_lang(uri: &Uri, headers: &HeaderMap) -> String {
    let mut lang = lang_from_path(uri.path()).to_string();
    if let Some(al) = headers
        .get(header::ACCEPT_LANGUAGE)
        .and_then(|v| v.to_str().ok())
    {
        let primary = al
            .split(';')
            .next()
            .unwrap_or("")
            .split(',')
            .next()
            .unwrap_or("")
            .split('-')
            .next()
            .unwrap_or("");
        if let Some(m) = LANGUAGES.iter().find(|l| primary.contains(*l)) {
            lang = m.to_string();
        }
    }
    if let Some(q) = uri.query() {
        for pair in q.split('&') {
            if let Some(v) = pair.strip_prefix("lang=") {
                if LANGUAGES.contains(&v) {
                    lang = v.to_string();
                }
            }
        }
    }
    if !LANGUAGES.contains(&lang.as_str()) {
        lang = "en".into();
    }
    lang
}

/// Serve an embedded static file
pub fn static_file(path: &str, headers: &HeaderMap) -> Option<Response> {
    let path = path.trim_start_matches('/');
    let file = Static::get(path)?;
    let etag = format!(
        "\"{}\"",
        file.metadata
            .sha256_hash()
            .iter()
            .take(12)
            .map(|b| format!("{b:02x}"))
            .collect::<String>()
    );
    if headers
        .get(header::IF_NONE_MATCH)
        .and_then(|v| v.to_str().ok())
        == Some(etag.as_str())
    {
        return Some(StatusCode::NOT_MODIFIED.into_response());
    }
    let cache = if path.starts_with("assets/") {
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
    static_file(req.uri().path(), req.headers())
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
        .route("/api/v2/spot", get(api::spot))
        .route("/api/v2/hass", get(api::hass))
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
    r.fallback(pages::not_found)
        .layer(axum::middleware::from_fn(api_etag))
        .layer(axum::middleware::from_fn(security_headers))
        .layer(CompressionLayer::new())
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(30),
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
