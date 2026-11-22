use std::collections::BTreeMap;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::Value;
use tower::ServiceExt;

use crate::db::{queries, Db};
use crate::timeutil::{day_range, today};
use crate::{App, Config};

fn test_app() -> App {
    let db = Db::open_memory();
    let cfg = Config {
        public_url: Some("https://example.test".into()),
        adsense: None,
        ga_id: None,
        schedule_tz: crate::timeutil::stockholm(),
        history_start: jiff::civil::date(2021, 1, 1),
        csp: crate::web::Csp::Enforce,
        api_rate_limit: None,
        trusted_proxies: vec![],
    };
    let app = App::new(db, cfg).unwrap();
    // Seed: SE1 today + tomorrow at 15 minutes, exchange rates
    let tz = crate::timeutil::stockholm();
    let mut c = app.db.conn().unwrap();
    let mut rows = vec![];
    for d in [
        crate::timeutil::add_days(today(&tz), -1),
        today(&tz),
        crate::timeutil::add_days(today(&tz), 1),
    ] {
        let (s, e) = day_range(&tz, d);
        let mut t = s;
        let mut i = 0.0;
        while t <= e {
            rows.push((t, "PT15M".to_string(), 50.0 + i));
            t += 900_000;
            i += 1.0;
        }
    }
    queries::upsert_spot(&mut c, "sv", "SE1", &rows).unwrap();
    let mut er = BTreeMap::new();
    er.insert("SEK".to_string(), 10.0);
    queries::insert_exchange_rates(&mut c, "2024-01-01", 1, &er).unwrap();
    app
}

async fn get(app: &App, uri: &str) -> (StatusCode, String, axum::http::HeaderMap) {
    let res = super::router(app.clone())
        .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
        .await
        .unwrap();
    let status = res.status();
    let headers = res.headers().clone();
    let body = res.into_body().collect().await.unwrap().to_bytes();
    (status, String::from_utf8_lossy(&body).to_string(), headers)
}

#[tokio::test]
async fn spot_api_shape() {
    let app = test_app();
    let d = today(&crate::timeutil::stockholm()).to_string();
    let (s, body, _) = get(
        &app,
        &format!("/api/v2/spot?period=hourly&area=se1&startDate={d}&endDate={d}"),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    let v: Value = serde_json::from_str(&body).unwrap();
    assert_eq!(v["status"], "ok");
    let data = v["data"].as_array().unwrap();
    assert!(data.len() >= 92, "{}", data.len());
    assert!(data[0]["time"].is_i64());
    assert_eq!(data[0]["price"], 50.0);
    assert!(data[0]["min"].is_number() && data[0]["max"].is_number());

    let (_, body, _) = get(
        &app,
        &format!("/api/v2/spot?period=total&area=SE1&startDate={d}&endDate={d}&currency=SEK"),
    )
    .await;
    let v: Value = serde_json::from_str(&body).unwrap();
    assert!(v["data"][0]["time"].is_null());
    assert!(v["data"][0]["price"].as_f64().unwrap() > 500.0);

    let (s, body, _) = get(&app, "/api/v2/spot?period=nope&area=SE1").await;
    assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR);
    assert!(body.contains("Period not valid"));
    let (s, body, _) = get(&app, "/api/v2/spot?period=daily&area=SE1").await;
    assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR);
    assert!(body.contains("Missing/invalid parameters"));
    // Exact interval that does not exist returns empty data
    let (_, body, _) = get(
        &app,
        &format!("/api/v2/spot?period=hourly&area=SE1&startDate={d}&endDate={d}&interval=PT60M"),
    )
    .await;
    let v: Value = serde_json::from_str(&body).unwrap();
    assert_eq!(v["data"].as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn cheapest_api() {
    let tz = crate::timeutil::stockholm();
    let app = test_app();
    let t = today(&tz);
    let tomorrow = crate::timeutil::add_days(t, 1);
    let start = day_range(&tz, tomorrow).0;
    let json = |b: &str| serde_json::from_str::<Value>(b).unwrap();

    // Prices rise through each day from 50, so the first hour of the day is the cheapest
    let (s, body, _) = get(
        &app,
        &format!("/api/v2/cheapest?area=se1&hours=1&from={tomorrow}&to={tomorrow}"),
    )
    .await;
    assert_eq!(s, StatusCode::OK, "{body}");
    let v = json(&body);
    assert_eq!(v["status"], "ok");
    assert_eq!(v["area"], "SE1");
    assert_eq!(v["currency"], "EUR");
    assert_eq!(v["found"], true);
    assert_eq!(v["active"], false);
    assert_eq!(v["start"], crate::timeutil::js_iso(start));
    assert_eq!(v["end"], crate::timeutil::js_iso(start + 3_600_000));
    assert_eq!(v["price"], 51.5);
    assert_eq!(v["windows"].as_array().unwrap().len(), 1);
    assert_eq!(v["data"].as_array().unwrap().len(), 4);
    assert_eq!(v["data"][0]["price"], 50.0);

    // Separate intervals: the first of each day (both 50); currency converts
    let (_, body, _) = get(
        &app,
        &format!("/api/v2/cheapest?area=SE1&hours=0.5&consecutive=false&from={t}&to={tomorrow}&currency=SEK"),
    )
    .await;
    let v = json(&body);
    assert_eq!(v["start"], crate::timeutil::js_iso(day_range(&tz, t).0));
    assert_eq!(v["price"], 500.0);
    assert_eq!(v["windows"].as_array().unwrap().len(), 2);
    assert_eq!(v["end"], crate::timeutil::js_iso(start + 900_000));
    assert!(v["note"].is_string());
    // Consecutive over two days: the earliest of equal windows wins
    let (_, body, _) = get(
        &app,
        &format!("/api/v2/cheapest?area=SE1&hours=0.5&from={t}&to={tomorrow}"),
    )
    .await;
    assert_eq!(
        json(&body)["start"],
        crate::timeutil::js_iso(day_range(&tz, t).0)
    );

    // The window must end by `to`
    let to = crate::timeutil::js_iso(start + 2 * 3_600_000);
    let (_, body, _) = get(
        &app,
        &format!("/api/v2/cheapest?area=SE1&hours=1.5&from={tomorrow}&to={to}"),
    )
    .await;
    let v = json(&body);
    assert_eq!(v["data"].as_array().unwrap().len(), 6);
    assert_eq!(v["start"], crate::timeutil::js_iso(start));

    // No prices in range: ok, but nothing found
    let (s, body, _) = get(
        &app,
        "/api/v2/cheapest?area=SE1&hours=1&from=2020-01-01&to=2020-01-02",
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    let v = json(&body);
    assert_eq!(v["found"], false);
    assert!(v["start"].is_null() && v["price"].is_null());
    assert_eq!(v["data"].as_array().unwrap().len(), 0);

    for bad in [
        "area=XX&hours=1",
        "area=SE1",
        "area=SE1&hours=0",
        "area=SE1&hours=1&consecutive=maybe",
        "area=SE1&hours=1&from=2024-01-01&to=2024-02-01",
        "area=SE1&hours=30&from=2024-01-01&to=2024-01-01",
        "area=SE1&hours=1&currency=XXX",
    ] {
        let (s, _, _) = get(&app, &format!("/api/v2/cheapest?{bad}")).await;
        assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR, "{bad}");
    }
}

#[tokio::test]
async fn hass_api_shape() {
    let app = test_app();
    let (s, body, _) = get(
        &app,
        "/api/v2/hass?area=SE1&currency=SEK&decimals=3&factor=1.25&extra=0.1",
    )
    .await;
    assert_eq!(s, StatusCode::OK, "{body}");
    let v: Value = serde_json::from_str(&body).unwrap();
    for k in [
        "updated",
        "now",
        "avg",
        "min",
        "max",
        "avg_tomorrow",
        "min_tomorrow",
        "max_tomorrow",
        "avg_yesterday",
        "min_yesterday",
        "max_yesterday",
    ] {
        assert!(v[k].is_string(), "{k}");
    }
    assert_ne!(v["now"], "-");
    // min today: 50 EUR/MWh * 10 SEK = 0.5 SEK/kWh, +0.1, *1.25 = 0.75
    assert_eq!(v["min"], "0.750");
    let data = v["data"].as_array().unwrap();
    assert!(data.len() > 280);
    assert!(data[0]["st"].as_str().unwrap().ends_with(".000Z"));
    // Key order matches 1.x
    let keys: Vec<&str> = body.match_indices('"').map(|_| "").collect();
    assert!(!keys.is_empty());
    assert!(body.find("\"updated\"").unwrap() < body.find("\"data\"").unwrap());

    let (_, body, _) = get(&app, "/api/v2/hass?area=SE1&currency=ORE&decimals=1").await;
    let v: Value = serde_json::from_str(&body).unwrap();
    assert_eq!(v["min"], "50.0");

    let (s, _, _) = get(&app, "/api/v2/hass?area=SE1").await;
    assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR);
}

#[tokio::test]
async fn pages_render() {
    let app = test_app();
    for (uri, expect) in [
        ("/", "SE1"),
        ("/sv", "SE1"),
        ("/sv/SE1", "Norra Sverige"),
        ("/fi/FI", "Suomi"),
        ("/custom", "Custom period"),
        ("/help", "Table of Contents"),
        ("/homeassistant", "configuration.yaml"),
    ] {
        let (s, body, _) = get(&app, uri).await;
        assert_eq!(s, StatusCode::OK, "{uri}: {body}");
        assert!(body.contains(expect), "{uri} missing {expect}");
        assert!(body.contains("sw-boot"), "{uri}");
    }
    let (_, body, _) = get(&app, "/sv/SE1").await;
    // Swedish page shows öre server side: 50 EUR/MWh * 10 = 0.5 SEK = 50.0 öre
    assert!(body.contains("data-eur=\"50\">50.0</span>"), "price span");
    assert!(body.contains("Elpriset just nu"));
}

#[tokio::test]
async fn redirects_static_and_404() {
    let app = test_app();
    let (s, _, h) = get(&app, "/fi").await;
    assert_eq!(s, StatusCode::PERMANENT_REDIRECT);
    assert_eq!(h["location"], "/fi/FI");
    let (s, _, h) = get(&app, "/fi?lang=sv").await;
    assert_eq!(s, StatusCode::PERMANENT_REDIRECT);
    assert_eq!(h["location"], "/fi/FI?lang=sv");
    let (s, _, h) = get(&app, "/elomrade/SE3").await;
    assert_eq!(s, StatusCode::PERMANENT_REDIRECT);
    assert_eq!(h["location"], "/sv/SE3");
    let (s, body, _) = get(&app, "/robots.txt").await;
    assert_eq!(s, StatusCode::OK);
    assert!(body.contains("Sitemap: https://example.test/sitemap.xml"));
    assert!(body.contains("Disallow: /healthz"));
    let (s, _, h) = get(&app, "/assets/app.js").await;
    assert_eq!(s, StatusCode::OK);
    assert!(h["content-type"].to_str().unwrap().contains("javascript"));
    let (s, _, _) = get(&app, "/manifest.json").await;
    assert_eq!(s, StatusCode::OK);
    let (s, _, _) = get(&app, "/xx").await;
    assert_eq!(s, StatusCode::NOT_FOUND);
    let (s, _, _) = get(&app, "/sv/SE9").await;
    assert_eq!(s, StatusCode::NOT_FOUND);
    let (s, body, _) = get(&app, "/sitemap.xml").await;
    assert_eq!(s, StatusCode::OK);
    assert!(body.contains("<loc>https://example.test/sv/SE1</loc>"));
    assert!(body.contains("<loc>https://example.test/sv</loc>"));
    assert!(!body.contains("<loc>https://example.test/fi</loc>"));
    // Every language version is listed, the language of the path only once
    assert!(body.contains("<loc>https://example.test/sv/SE1?lang=en</loc>"));
    assert!(body.contains("<loc>https://example.test/?lang=sv</loc>"));
    assert!(!body.contains("<loc>https://example.test/sv/SE1?lang=sv</loc>"));
    assert!(body.contains("<url><loc>https://example.test/help</loc></url>"));
    let (s, body, _) = get(&app, "/api/v2/status").await;
    assert_eq!(s, StatusCode::OK);
    assert!(body.contains("latest_price"));
    // Test data does not reach tomorrow and has no generation, so data is not healthy
    let v: serde_json::Value = serde_json::from_str(&body).unwrap();
    assert_eq!(v["healthy"], false);
    assert!(v["problems"]
        .as_array()
        .unwrap()
        .iter()
        .any(|p| p == "no generation data"));
    let (s, body, h) = get(&app, "/healthz/data").await;
    assert_eq!(s, StatusCode::SERVICE_UNAVAILABLE);
    assert!(body.contains("no generation data"));
    assert_eq!(h["cache-control"], "no-store");
}

#[tokio::test]
async fn assets_are_versioned_by_content_hash() {
    let app = test_app();
    let url = super::asset_url("assets/app.js");
    let (path, hash) = url.split_once("?v=").unwrap();
    assert_eq!(path, "/assets/app.js");
    assert_eq!(hash.len(), 24);
    // Pages link assets by hash; ApexCharts is only named for app.js to load on demand
    let (_, body, _) = get(&app, "/help").await;
    assert!(body.contains(&format!(r#"<script src="{url}""#)));
    assert!(body.contains(&format!(
        r#"href="{}""#,
        super::asset_url("assets/spotweb.css")
    )));
    assert!(body.contains(&format!(
        r#"data-apexcharts="{}""#,
        super::asset_url("assets/vendor/apexcharts.min.js")
    )));
    assert!(!body.contains(r#"<script src="/assets/vendor/apexcharts"#));
    // The current hash is immutable, anything else is cached for a week
    let (s, _, h) = get(&app, &url).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(h["cache-control"], "public, max-age=31536000, immutable");
    assert_eq!(h["etag"], format!("\"{hash}\""));
    let (_, _, h) = get(&app, "/assets/app.js?v=2.2.0").await;
    assert_eq!(h["cache-control"], "public, max-age=604800");
    let (_, _, h) = get(&app, "/assets/app.js").await;
    assert_eq!(h["cache-control"], "public, max-age=604800");
    // Outside /assets/ the hash changes nothing
    let (_, _, h) = get(&app, &super::asset_url("manifest.json")).await;
    assert_eq!(h["cache-control"], "public, max-age=3600");
}

#[test]
fn lang_detection() {
    use axum::http::{HeaderMap, HeaderValue, Uri};
    let lang = |uri: &'static str, h: &HeaderMap| super::detect_lang(&Uri::from_static(uri), h);
    let mut h = HeaderMap::new();
    assert_eq!(lang("/sv/SE1", &h), "sv");
    assert_eq!(lang("/", &h), "en");
    assert_eq!(lang("/pl/PL", &h), "en");
    h.insert(
        "accept-language",
        HeaderValue::from_static("de-DE,de;q=0.9"),
    );
    // A url with a language serves that language, whatever the browser asks for
    assert_eq!(lang("/sv/SE1", &h), "sv");
    assert_eq!(lang("/", &h), "de");
    assert_eq!(lang("/pl/PL", &h), "de");
    assert_eq!(lang("/sv/SE1?lang=fi", &h), "fi");
    // Danish and Norwegian browsers, and q-values
    h.insert(
        "accept-language",
        HeaderValue::from_static("da-DK,da;q=0.9"),
    );
    assert_eq!(lang("/", &h), "dk");
    h.insert("accept-language", HeaderValue::from_static("nb-NO"));
    assert_eq!(lang("/", &h), "no");
    h.insert(
        "accept-language",
        HeaderValue::from_static("pl;q=1, en;q=0.2, fi;q=0.8"),
    );
    assert_eq!(lang("/", &h), "fi");
    // A language picked earlier wins over the url
    h.insert("cookie", HeaderValue::from_static("a=b; lang=es"));
    assert_eq!(lang("/sv/SE1", &h), "es");
    assert_eq!(lang("/sv/SE1?lang=fi", &h), "fi");
    assert_eq!(super::format_int(1234567.4, "en"), "1,234,567");
    assert_eq!(super::format_int(-1234.0, "de"), "-1.234");
}

#[tokio::test]
async fn start_page_map_and_flows_api() {
    let app = test_app();
    let now = crate::timeutil::now_ms();
    let hour = now - now.rem_euclid(3_600_000) - 3_600_000;
    {
        let mut c = app.db.conn().unwrap();
        queries::upsert_flows(&mut c, "SE3", "FI", &[(hour, "PT60M".into(), 1200.0)]).unwrap();
        queries::upsert_flows(&mut c, "FI", "SE3", &[(hour, "PT60M".into(), 200.0)]).unwrap();
        queries::upsert_flows(&mut c, "NO2", "NL", &[(hour, "PT60M".into(), 0.0)]).unwrap();
        queries::upsert_flows(&mut c, "NL", "NO2", &[(hour, "PT60M".into(), 700.0)]).unwrap();
    }

    let (s, body, headers) = get(&app, "/api/v2/flows").await;
    assert_eq!(s, StatusCode::OK, "{body}");
    assert_eq!(headers["access-control-allow-origin"], "*");
    let v: Value = serde_json::from_str(&body).unwrap();
    assert_eq!(v["status"], "ok");
    let data = v["data"].as_array().unwrap();
    assert_eq!(data.len(), 2);
    let fi = data.iter().find(|f| f["to"] == "FI").unwrap();
    assert_eq!(
        (fi["from"].as_str(), fi["value"].as_f64()),
        (Some("SE3"), Some(1000.0))
    );
    let nl = data.iter().find(|f| f["from"] == "NL").unwrap();
    assert_eq!(
        (nl["to"].as_str(), nl["value"].as_f64()),
        (Some("NO2"), Some(700.0))
    );
    assert!(v["updated"].is_string());

    let (s, body, _) = get(&app, "/?lang=sv").await;
    assert_eq!(s, StatusCode::OK);
    // Map with every zone, a neighbour and the side panel
    for name in [
        "SE1", "SE3", "NO4", "DK2", "DE-LU", "ES", "EE", "LV", "LT", "CZ", "PT",
    ] {
        assert!(body.contains(&format!(r#"data-area="{name}""#)), "{name}");
    }
    assert!(body.contains(r#"data-area="NL""#));
    assert!(body.contains(r#"data-ext="GB""#));
    assert!(body.contains(r#"id="zone-panel""#));
    assert!(body.contains("Elpris och överföring just nu"));
    assert!(body.contains(r#"<option value="SE3" selected>"#));
    // Boot data carries zones, flows and neighbour names
    let boot = body
        .split(r#"<script id="sw-boot" type="application/json">"#)
        .nth(1)
        .unwrap();
    let boot: Value = serde_json::from_str(boot.split("</script>").next().unwrap()).unwrap();
    assert_eq!(boot["zones"]["SE1"]["country"], "sv");
    assert!(
        boot["zones"]["SE1"]["today"]["points"]
            .as_array()
            .unwrap()
            .len()
            >= 92
    );
    assert!(boot["zones"]["SE1"]["now"].is_number());
    assert_eq!(boot["flows"]["borders"].as_array().unwrap().len(), 2);
    assert_eq!(boot["neighbours"]["GB"], "Great Britain");
    assert!(boot["neighbours"].get("NL").is_none());
    assert_eq!(boot["default_area"], "SE3");

    let (_, body, _) = get(&app, "/?lang=de").await;
    assert!(body.contains(r#"<option value="DE-LU" selected>"#));
}

async fn get_if_none_match(
    app: &App,
    uri: &str,
    tag: &str,
) -> (StatusCode, String, axum::http::HeaderMap) {
    let res = super::router(app.clone())
        .oneshot(
            Request::builder()
                .uri(uri)
                .header("if-none-match", tag)
                .header("accept-encoding", "gzip")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let status = res.status();
    let headers = res.headers().clone();
    let body = res.into_body().collect().await.unwrap().to_bytes();
    (status, String::from_utf8_lossy(&body).to_string(), headers)
}

#[tokio::test]
async fn api_etag_and_not_modified() {
    let app = test_app();
    let d = today(&crate::timeutil::stockholm()).to_string();
    for uri in [
        format!("/api/v2/spot?period=hourly&area=SE1&startDate={d}&endDate={d}"),
        "/api/v2/hass?area=SE1&currency=SEK".to_string(),
        "/api/v2/flows".to_string(),
    ] {
        let (s, _, h) = get(&app, &uri).await;
        assert_eq!(s, StatusCode::OK, "{uri}");
        let tag = h["etag"].to_str().unwrap().to_string();
        assert!(tag.starts_with("W/\""), "{tag}");
        // hass has a fresh `updated` per request, but the same data gives the same tag
        let (s, body, h) = get_if_none_match(&app, &uri, &tag).await;
        assert_eq!(s, StatusCode::NOT_MODIFIED, "{uri}");
        assert!(body.is_empty());
        assert_eq!(h["etag"].to_str().unwrap(), tag);
        assert!(h.contains_key("cache-control"));
        assert_eq!(h["access-control-allow-origin"], "*");
        // Strong form and lists match too, other tags do not
        let strong = tag.trim_start_matches("W/");
        let (s, _, _) = get_if_none_match(&app, &uri, &format!("\"x\", {strong}")).await;
        assert_eq!(s, StatusCode::NOT_MODIFIED);
        let (s, body, _) = get_if_none_match(&app, &uri, "W/\"0000\"").await;
        assert_eq!(s, StatusCode::OK);
        assert!(!body.is_empty());
    }
    // Errors and pages get no ETag
    let (s, _, h) = get(&app, "/api/v2/spot?period=nope").await;
    assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR);
    assert!(!h.contains_key("etag"));
}

#[tokio::test]
async fn permalinks_and_share_buttons() {
    let app = test_app();
    let (s, body, h) = get(&app, "/sv/SE1?lang=de").await;
    assert_eq!(s, StatusCode::OK);
    // Each language version is its own page
    assert!(body.contains(r#"<link rel="canonical" href="https://example.test/sv/SE1?lang=de">"#));
    assert!(
        body.contains(r#"<meta property="og:url" content="https://example.test/sv/SE1?lang=de">"#)
    );
    assert!(h["set-cookie"].to_str().unwrap().starts_with("lang=de;"));
    let (_, body, h) = get(&app, "/sv/SE1").await;
    assert!(body.contains(r#"<link rel="canonical" href="https://example.test/sv/SE1">"#));
    assert!(h.get("set-cookie").is_none());
    assert!(body.contains(r#"content="https://example.test/icon-512x512.png""#));
    let body = body.replace("&#x2f;", "/");
    assert!(body.contains(r#"data-share data-share-url="/sv/SE1""#));

    let (_, body, _) = get(&app, "/sv").await;
    let body = body.replace("&#x2f;", "/");
    for a in ["SE1", "SE2", "SE3", "SE4"] {
        assert!(
            body.contains(&format!(r#"data-share-url="/sv/{a}""#)),
            "{a}"
        );
    }

    let (_, body, _) = get(&app, "/").await;
    assert!(body.contains("data-share-zone"));

    // Custom keeps only its own parameters, in a fixed order
    let (_, body, _) = get(
        &app,
        "/custom?endDate=2024-01-31&area=SE3&utm_source=x&startDate=2024-01-01&period=daily",
    )
    .await;
    assert!(body.contains(
        r#"<link rel="canonical" href="https://example.test/custom?period=daily&amp;area=SE3&amp;startDate=2024-01-01&amp;endDate=2024-01-31">"#
    ));
    assert!(body.contains(r#"<meta name="robots" content="noindex, follow">"#));
    let (_, body, _) = get(&app, "/custom").await;
    assert!(!body.contains("noindex"));
    assert!(body.contains(r##"data-share-from="#custom-permalink""##));
}

/// Edge cases where 2.x must answer like 1.x did
#[tokio::test]
async fn api_v1_compat_edge_cases() {
    let app = test_app();
    let d = today(&crate::timeutil::stockholm()).to_string();
    let json = |b: &str| serde_json::from_str::<Value>(b).unwrap();

    // Repeated parameter: first value wins (URLSearchParams.get)
    let (s, body, _) = get(
        &app,
        &format!("/api/v2/spot?period=total&period=nope&area=SE1&startDate={d}&endDate={d}"),
    )
    .await;
    assert_eq!(s, StatusCode::OK, "{body}");
    assert!(json(&body)["data"][0]["time"].is_null());

    // Lower case and padded values are normalised, RFC 3339 dates accepted
    let (s, body, _) = get(
        &app,
        &format!(
            "/api/v2/spot?period=%20Daily%20&area=%20se1&startDate={d}T00:00:00&endDate={d}&interval=pt15m&currency=sek"
        ),
    )
    .await;
    assert_eq!(s, StatusCode::OK, "{body}");
    assert_eq!(json(&body)["data"].as_array().unwrap().len(), 1);

    // Empty currency means no conversion
    let (_, body, _) = get(
        &app,
        &format!("/api/v2/spot?period=hourly&area=SE1&startDate={d}&endDate={d}&currency="),
    )
    .await;
    assert_eq!(json(&body)["data"][0]["price"], 50.0);

    // Unknown area: ok with empty data
    let (s, body, _) = get(
        &app,
        &format!("/api/v2/spot?period=hourly&area=XX&startDate={d}&endDate={d}"),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(json(&body)["data"].as_array().unwrap().len(), 0);

    // hass: toFixed accepted up to 100 decimals
    let (s, body, _) = get(&app, "/api/v2/hass?area=SE1&currency=EUR&decimals=25").await;
    assert_eq!(s, StatusCode::OK, "{body}");
    assert_eq!(
        json(&body)["min"]
            .as_str()
            .unwrap()
            .split('.')
            .nth(1)
            .unwrap()
            .len(),
        25
    );
    let (s, _, _) = get(&app, "/api/v2/hass?area=SE1&currency=EUR&decimals=101").await;
    assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR);
    let (s, _, _) = get(&app, "/api/v2/hass?area=SE1&currency=EUR&decimals=-1").await;
    assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR);

    // hass: parseFloat/parseInt prefixes, empty values fall back to defaults
    let (s, body, _) = get(
        &app,
        "/api/v2/hass?area=se1&currency=sek&multiplier=&extra=&factor=1,25&decimals=3.9",
    )
    .await;
    assert_eq!(s, StatusCode::OK, "{body}");
    // factor "1,25" -> 1, decimals "3.9" -> 3: 50 EUR/MWh * 10 = 0.500 SEK/kWh
    assert_eq!(json(&body)["min"], "0.500");
    let (s, _, _) = get(&app, "/api/v2/hass?area=SE1&currency=SEK&factor=abc").await;
    assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR);

    // hass: öre as generated by the 1.x Home Assistant page for Swedish visitors
    let (_, body, _) = get(&app, "/api/v2/hass?area=SE1&currency=%C3%B6re&decimals=1").await;
    assert_eq!(json(&body)["min"], "50.0");

    // hass: unknown area answers with empty data, not an error
    let (s, body, _) = get(&app, "/api/v2/hass?area=XX&currency=SEK").await;
    assert_eq!(s, StatusCode::OK);
    let v = json(&body);
    assert_eq!(v["now"], "-");
    assert_eq!(v["data"].as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn api_attribution_and_range_limits() {
    let app = test_app();
    let d = today(&crate::timeutil::stockholm());
    let iso = |d: jiff::civil::Date| d.to_string();

    // Source is always given, the conversion note only when converted
    let (_, body, _) = get(
        &app,
        &format!(
            "/api/v2/spot?period=total&area=SE1&startDate={0}&endDate={0}",
            iso(d)
        ),
    )
    .await;
    let v: Value = serde_json::from_str(&body).unwrap();
    assert!(v["source"].as_str().unwrap().contains("ENTSO-E"));
    assert!(v.get("note").is_none());
    let (_, body, _) = get(
        &app,
        &format!(
            "/api/v2/spot?period=total&area=SE1&startDate={0}&endDate={0}&currency=SEK",
            iso(d)
        ),
    )
    .await;
    let v: Value = serde_json::from_str(&body).unwrap();
    assert!(v["note"].as_str().unwrap().contains("ECB"));
    let (_, body, _) = get(&app, "/api/v2/hass?area=SE1&currency=SEK").await;
    let v: Value = serde_json::from_str(&body).unwrap();
    assert!(v["source"].as_str().unwrap().contains("ENTSO-E"));
    let (_, body, _) = get(&app, "/api/v2/flows").await;
    let v: Value = serde_json::from_str(&body).unwrap();
    assert_eq!(v["license"], "CC-BY-4.0");

    // Raw intervals: 31 days ok, 32 days refused
    let ok = format!(
        "/api/v2/spot?period=hourly&area=SE1&startDate={}&endDate={}",
        iso(crate::timeutil::add_days(d, -30)),
        iso(d)
    );
    assert_eq!(get(&app, &ok).await.0, StatusCode::OK);
    let (s, body, _) = get(
        &app,
        &format!(
            "/api/v2/spot?period=hourly&area=SE1&startDate={}&endDate={}",
            iso(crate::timeutil::add_days(d, -31)),
            iso(d)
        ),
    )
    .await;
    assert_eq!(s, StatusCode::INTERNAL_SERVER_ERROR);
    assert!(body.contains("Date range too long"));
    // Daily: one year ok, more refused; monthly not limited
    let span = |p: &str, days: i64| {
        format!(
            "/api/v2/spot?period={p}&area=SE1&startDate={}&endDate={}",
            iso(crate::timeutil::add_days(d, -days)),
            iso(d)
        )
    };
    assert_eq!(get(&app, &span("daily", 365)).await.0, StatusCode::OK);
    assert_eq!(
        get(&app, &span("daily", 366)).await.0,
        StatusCode::INTERNAL_SERVER_ERROR
    );
    assert_eq!(get(&app, &span("monthly", 2000)).await.0, StatusCode::OK);
}

#[tokio::test]
async fn grouped_split_at_current_group_matches_unsplit() {
    use crate::price::{group, select_rows, Grouping, IntervalMode};
    let app = test_app();
    let tz = crate::timeutil::stockholm();
    // Hourly history for the last ~400 days, so every calendar grouping crosses "now"
    let (now_start, _) = day_range(&tz, crate::timeutil::add_days(today(&tz), -1));
    let from = now_start - 400 * 86_400_000;
    let rows: Vec<_> = (0..400 * 24)
        .map(|i| (from + i * 3_600_000, "PT60M".to_string(), (i % 97) as f64))
        .collect();
    queries::upsert_spot(&mut app.db.conn().unwrap(), "sv", "SE1", &rows).unwrap();
    let to = day_range(&tz, crate::timeutil::add_days(today(&tz), 1)).1;
    let mode = IntervalMode::Prefer("PT60M".into());
    let all = queries::spot_rows(&app.db.conn().unwrap(), "SE1", from, to).unwrap();
    for g in [
        Grouping::Daily,
        Grouping::Weekly,
        Grouping::Monthly,
        Grouping::Yearly,
    ] {
        let expected = group(&select_rows(&all, &mode, &tz), g, &tz);
        let got = super::data::spot_grouped(&app, "SE1", from, to, g, &mode, tz.clone())
            .await
            .unwrap();
        assert_eq!(*got, expected, "{g:?}");
    }
}

#[tokio::test]
async fn http_stats_per_route() {
    let app = test_app();
    let d = today(&crate::timeutil::stockholm()).to_string();
    let (s, _, _) = get(
        &app,
        &format!("/api/v2/spot?period=hourly&area=SE1&startDate={d}&endDate={d}"),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    // 1.x compatible: bad parameters are answered with 500
    get(&app, "/api/v2/spot?period=bogus&area=SE1").await;
    get(&app, "/healthz").await;
    get(&app, "/no/such/page/here").await;
    get(&app, "/robots.txt").await;
    let (s, body, _) = get(&app, "/api/v2/status").await;
    assert_eq!(s, StatusCode::OK);
    let v: Value = serde_json::from_str(&body).unwrap();
    let routes = &v["http"]["routes"];
    assert_eq!(routes["/api/v2/spot"]["requests"], 2, "{routes}");
    assert_eq!(routes["/api/v2/spot"]["5xx"], 1, "{routes}");
    assert_eq!(routes["/healthz"]["requests"], 1, "{routes}");
    assert_eq!(routes["not found"]["4xx"], 1, "{routes}");
    assert!(routes["/api/v2/spot"]["p95_ms"].is_u64(), "{routes}");
    // The status request itself is counted once its response is done
    assert!(routes.get("/api/v2/status").is_none());
    assert_eq!(v["http"]["total"]["requests"], 5);
    assert_eq!(routes["/robots.txt"]["requests"], 1, "{routes}");
    get(&app, "/manifest.json").await;
    assert_eq!(app.http_stats.to_json()["routes"]["static"]["requests"], 1);
}

#[tokio::test]
async fn translated_pages_have_no_missing_keys() {
    let app = test_app();
    for lang in crate::countries::LANGUAGES {
        for page in ["help", "homeassistant", "custom"] {
            let (s, body, _) = get(&app, &format!("/{page}?lang={lang}")).await;
            assert_eq!(s, StatusCode::OK);
            assert!(!body.contains("pages."), "{page} {lang} shows a raw key");
            assert!(
                !body.contains("&lt;i&gt;"),
                "{page} {lang} has escaped markup"
            );
        }
    }
    let (_, body, _) = get(&app, "/help?lang=sv").await;
    assert!(body.contains("<i>Faktiskt timpris"), "{body}");
    let (_, body, _) = get(&app, "/custom?lang=de").await;
    assert!(body.contains("<title>") && body.contains("Eigener Zeitraum"));
}

#[tokio::test]
async fn pages_send_nonce_csp() {
    let app = test_app();
    let (s, body, headers) = get(&app, "/sv/SE1").await;
    assert_eq!(s, StatusCode::OK);
    let csp = headers["content-security-policy"]
        .to_str()
        .unwrap()
        .to_string();
    let nonce = csp
        .split("'nonce-")
        .nth(1)
        .and_then(|r| r.split('\'').next())
        .unwrap();
    assert!(nonce.len() >= 32, "{csp}");
    assert!(csp.contains("'strict-dynamic'") && csp.contains("object-src 'none'"));
    // Every executable script carries the nonce; only JSON data blocks are inline
    for tag in body.split("<script").skip(1) {
        let tag = tag.split('>').next().unwrap();
        assert!(
            tag.contains(&format!("nonce=\"{nonce}\"")) || tag.contains("application/"),
            "script without nonce: {tag}"
        );
    }
    assert!(!body.contains(" onclick=") && !body.contains(" onload="));
    // A new nonce per response
    let (_, _, h2) = get(&app, "/sv/SE1").await;
    assert_ne!(
        h2["content-security-policy"],
        headers["content-security-policy"]
    );
    // Not on the API
    let (_, _, h) = get(&app, "/api/v2/status").await;
    assert!(h.get("content-security-policy").is_none());
}

/// Language versions, titles, descriptions and structured data
#[tokio::test]
async fn search_engine_metadata() {
    let app = test_app();
    let ld = |body: &str| -> Value {
        let s = body
            .split(r#"<script type="application/ld+json">"#)
            .nth(1)
            .unwrap();
        serde_json::from_str(s.split("</script>").next().unwrap()).unwrap()
    };

    // Swedish zone page: hreflang for every language, Swedish on the plain url
    let (_, body, _) = get(&app, "/sv/SE1").await;
    assert!(body.contains(r#"<html lang="sv">"#));
    assert!(
        body.contains(r#"<link rel="alternate" hreflang="sv" href="https://example.test/sv/SE1">"#)
    );
    assert!(body.contains(
        r#"<link rel="alternate" hreflang="da" href="https://example.test/sv/SE1?lang=dk">"#
    ));
    assert!(body.contains(
        r#"<link rel="alternate" hreflang="x-default" href="https://example.test/sv/SE1">"#
    ));
    assert!(body
        .contains("<title>Elpris SE1 (Norra Sverige) idag och imorgon - Elpriset just nu</title>"));
    assert!(body
        .contains(r#"<meta name="description" content="Spotpris SE1 Norra Sverige idag: medel "#));
    assert!(body.contains("<h1>SE1 - Norra Sverige</h1>"));
    let v = ld(&body);
    let graph = v["@graph"].as_array().unwrap();
    assert_eq!(v["@context"], "https://schema.org");
    assert_eq!(graph[1]["@type"], "WebPage");
    assert_eq!(graph[1]["url"], "https://example.test/sv/SE1");
    assert_eq!(graph[1]["inLanguage"], "sv");
    let ds = graph.iter().find(|n| n["@type"] == "Dataset").unwrap();
    let today = &ds["variableMeasured"][0];
    assert_eq!(today["unitText"], "SEK/kWh");
    assert!(today["value"].is_number());
    assert!(today["minValue"].as_f64() <= today["value"].as_f64());
    assert!(ds["distribution"][0]["contentUrl"]
        .as_str()
        .unwrap()
        .ends_with("/api/v2/hass?area=SE1&currency=SEK"));

    // Danish version of the same page
    let (_, body, _) = get(&app, "/sv/SE1?lang=dk").await;
    assert!(body.contains(r#"<html lang="da">"#));
    assert_eq!(ld(&body)["@graph"][1]["inLanguage"], "da");

    // Start page follows the browser and is the x-default
    let (_, body, _) = get(&app, "/").await;
    assert!(body.contains(r#"<link rel="canonical" href="https://example.test/">"#));
    assert!(body
        .contains(r#"<link rel="alternate" hreflang="en" href="https://example.test/?lang=en">"#));
    assert!(body
        .contains(r#"<link rel="alternate" hreflang="x-default" href="https://example.test/">"#));

    // Country page has a heading of its own and prices per zone in the description
    let (_, body, _) = get(&app, "/sv/").await;
    assert!(body.contains(r#"<link rel="canonical" href="https://example.test/sv">"#));
    assert!(body.contains(r#"<h1 class="h2 page-title">Elpris i Sverige idag och imorgon</h1>"#));
    assert!(body.contains("medel per elområde: SE1 "));

    // Help, Home Assistant and the custom form are translated: one url per language
    let (_, body, _) = get(&app, "/help?lang=sv").await;
    assert!(body.contains(r#"<link rel="canonical" href="https://example.test/help?lang=sv">"#));
    assert!(body.contains(
        r#"<link rel="alternate" hreflang="fi" href="https://example.test/help?lang=fi">"#
    ));
    assert!(body.contains(
        r#"<link rel="alternate" hreflang="x-default" href="https://example.test/help">"#
    ));
    assert!(body.contains("<title>Hjälp - spotpris, skatter, installera appen och öppet API - Elpriset just nu</title>"));
    assert_eq!(ld(&body)["@graph"][1]["inLanguage"], "sv");
    let (_, body, _) = get(&app, "/homeassistant?lang=de").await;
    assert!(
        body.contains(r#"<meta name="description" content="Strom-Spotpreise in Home Assistant"#)
    );
    // A filled in custom form is one url, kept out of the index
    let (_, body, _) = get(&app, "/custom?lang=fi&area=SE3&period=daily").await;
    assert!(body.contains(r#"<meta name="robots" content="noindex, follow">"#));
    assert!(
        body.contains(
            r#"<link rel="canonical" href="https://example.test/custom?period=daily&amp;area=SE3">"#
        ),
        "{body}"
    );
    assert!(!body.contains("hreflang"));
    let (_, body, _) = get(&app, "/sitemap.xml").await;
    assert!(body.contains("<loc>https://example.test/homeassistant?lang=no</loc>"));

    // 404 is kept out of the index
    let (_, body, _) = get(&app, "/xx").await;
    assert!(body.contains(r#"<meta name="robots" content="noindex, follow">"#));
    assert!(!body.contains("canonical"));

    // llms.txt lists the API and every zone
    let (s, body, h) = get(&app, "/llms.txt").await;
    assert_eq!(s, StatusCode::OK);
    assert!(h["content-type"]
        .to_str()
        .unwrap()
        .starts_with("text/plain"));
    assert!(body.starts_with("# Electricity price right now\n\n> "));
    assert!(body.contains("https://example.test/api/v2/spot?period=daily&area=SE3"));
    assert!(body.contains("(https://example.test/sv/SE1)"));
    assert!(body.contains("(https://example.test/pt/PT)"));
}

#[tokio::test]
async fn api_rate_limit_answers_429_and_is_counted() {
    use axum::extract::ConnectInfo;
    use std::net::SocketAddr;

    let mut app = test_app();
    let inner = std::sync::Arc::get_mut(&mut app.0).unwrap();
    inner.api_rate_limiter = Some(super::ratelimit::RateLimiter::new(
        2,
        super::ratelimit::parse_trusted_proxies("127.0.0.1").unwrap(),
    ));
    let send = |peer: &str, uri: &str, xff: Option<&str>| {
        let mut req = Request::builder().uri(uri);
        if let Some(x) = xff {
            req = req.header("x-forwarded-for", x);
        }
        let mut req = req.body(Body::empty()).unwrap();
        req.extensions_mut()
            .insert(ConnectInfo(peer.parse::<SocketAddr>().unwrap()));
        super::router(app.clone()).oneshot(req)
    };
    for _ in 0..2 {
        let res = send("192.0.2.1:1000", "/api/v2/status", None)
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
    }
    let res = send("192.0.2.1:1001", "/api/v2/status", None)
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(res.headers()["retry-after"], "30");
    assert_eq!(res.headers()["x-content-type-options"], "nosniff");
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["status"], "error");
    // Pages are not limited
    let res = send("192.0.2.1:1002", "/robots.txt", None).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    // X-Forwarded-For from an untrusted peer is ignored
    let res = send("192.0.2.1:1003", "/api/v2/status", Some("198.51.100.7"))
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);
    // Behind the trusted proxy every client has its own bucket
    for client in ["198.51.100.7", "198.51.100.7", "198.51.100.8"] {
        let res = send("127.0.0.1:2000", "/api/v2/status", Some(client))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK, "{client}");
    }
    let res = send("127.0.0.1:2000", "/api/v2/status", Some("198.51.100.7"))
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

    let stats = app.http_stats.to_json();
    let status = &stats["routes"]["/api/v2/status"];
    assert_eq!(status["requests"], 8, "{stats}");
    assert_eq!(status["4xx"], 3, "{stats}");
    assert_eq!(status["429"], 3, "{stats}");
}

#[tokio::test]
async fn panicking_handler_answers_500() {
    let app = test_app();
    let state = super::WebState {
        env: std::sync::Arc::new(super::template_env(&app)),
        app,
    };
    let r = axum::Router::new().route(
        "/boom",
        axum::routing::get(|| async {
            if true {
                panic!("boom");
            }
            "unreachable"
        }),
    );
    let res = super::layers(r, state)
        .oneshot(Request::builder().uri("/boom").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::INTERNAL_SERVER_ERROR);
    // The usual headers are still there
    assert!(res.headers().contains_key("x-content-type-options"));
}
