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
        schedule_tz: chrono_tz::Europe::Stockholm,
        history_start: chrono::NaiveDate::from_ymd_opt(2021, 1, 1).unwrap(),
    };
    let app = App::new(db, cfg).unwrap();
    // Seed: SE1 today + tomorrow at 15 minutes, exchange rates
    let tz = chrono_tz::Europe::Stockholm;
    let mut c = app.db.conn().unwrap();
    let mut rows = vec![];
    for d in [
        today(&tz) - chrono::Duration::days(1),
        today(&tz),
        today(&tz) + chrono::Duration::days(1),
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
    let d = today(&chrono_tz::Europe::Stockholm)
        .format("%Y-%m-%d")
        .to_string();
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
    assert_eq!(s, StatusCode::TEMPORARY_REDIRECT);
    assert_eq!(h["location"], "/fi/FI");
    let (s, _, h) = get(&app, "/elomrade/SE3").await;
    assert_eq!(s, StatusCode::TEMPORARY_REDIRECT);
    assert_eq!(h["location"], "/sv/SE3");
    let (s, body, _) = get(&app, "/robots.txt").await;
    assert_eq!(s, StatusCode::OK);
    assert!(body.contains("Sitemap"));
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

#[test]
fn lang_detection() {
    use axum::http::{HeaderMap, HeaderValue, Uri};
    let mut h = HeaderMap::new();
    assert_eq!(super::detect_lang(&Uri::from_static("/sv/SE1"), &h), "sv");
    h.insert(
        "accept-language",
        HeaderValue::from_static("de-DE,de;q=0.9"),
    );
    assert_eq!(super::detect_lang(&Uri::from_static("/sv/SE1"), &h), "de");
    assert_eq!(
        super::detect_lang(&Uri::from_static("/sv/SE1?lang=fi"), &h),
        "fi"
    );
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
    for name in ["SE1", "SE3", "NO4", "DK2", "DE-LU", "ES"] {
        assert!(body.contains(&format!(r#"data-area="{name}""#)), "{name}");
    }
    assert!(body.contains(r#"data-ext="NL""#));
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
    assert_eq!(boot["neighbours"]["NL"], "Nederland");
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
    let d = today(&chrono_tz::Europe::Stockholm)
        .format("%Y-%m-%d")
        .to_string();
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
    let (s, body, _) = get(&app, "/sv/SE1?lang=de").await;
    let body = body.replace("&#x2f;", "/");
    assert_eq!(s, StatusCode::OK);
    // Canonical and preview tags point at the page without the language parameter
    assert!(body.contains(r#"<link rel="canonical" href="https://example.test/sv/SE1">"#));
    assert!(body.contains(r#"<meta property="og:url" content="https://example.test/sv/SE1">"#));
    assert!(body.contains(r#"content="https://example.test/icon-512x512.png""#));
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
    let body = body.replace("&#x2f;", "/");
    assert!(body.contains(
        r#"<link rel="canonical" href="https://example.test/custom?period=daily&amp;area=SE3&amp;startDate=2024-01-01&amp;endDate=2024-01-31">"#
    ));
    assert!(body.contains(r##"data-share-from="#custom-permalink""##));
}

/// Edge cases where 2.x must answer like 1.x did
#[tokio::test]
async fn api_v1_compat_edge_cases() {
    let app = test_app();
    let d = today(&chrono_tz::Europe::Stockholm)
        .format("%Y-%m-%d")
        .to_string();
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
    let d = today(&chrono_tz::Europe::Stockholm);
    let iso = |d: chrono::NaiveDate| d.format("%Y-%m-%d").to_string();

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
        iso(d - chrono::Duration::days(30)),
        iso(d)
    );
    assert_eq!(get(&app, &ok).await.0, StatusCode::OK);
    let (s, body, _) = get(
        &app,
        &format!(
            "/api/v2/spot?period=hourly&area=SE1&startDate={}&endDate={}",
            iso(d - chrono::Duration::days(31)),
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
            iso(d - chrono::Duration::days(days)),
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
