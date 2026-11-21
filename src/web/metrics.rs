//! HTTP request statistics: count, response time (p50/p95) and 4xx/5xx per route.
//!
//! Kept in memory, since start and for the last whole minute. A summary is logged once a minute
//! (`SPOTWEB_HTTP_SUMMARY_SECS`, `0` turns it off) and every request can be logged as well
//! (`SPOTWEB_ACCESS_LOG=1`). Both are shown in `/api/v2/status`.

use std::collections::BTreeMap;
use std::time::{Duration, Instant};

use axum::extract::{MatchedPath, Request, State};
use axum::response::Response;
use parking_lot::Mutex;
use serde_json::{json, Value};

use super::WebState;

/// Upper bounds of the response time buckets in milliseconds. The last bucket is open.
const BUCKETS_MS: [u64; 16] = [
    1,
    2,
    5,
    10,
    20,
    50,
    100,
    200,
    500,
    1_000,
    2_000,
    5_000,
    10_000,
    20_000,
    30_000,
    u64::MAX,
];

/// Counters for one route
#[derive(Debug, Clone, Default, PartialEq)]
pub struct RouteStats {
    pub requests: u64,
    pub client_errors: u64,
    pub server_errors: u64,
    buckets: [u64; BUCKETS_MS.len()],
}

impl RouteStats {
    fn record(&mut self, status: u16, elapsed: Duration) {
        self.requests += 1;
        match status {
            400..=499 => self.client_errors += 1,
            500..=599 => self.server_errors += 1,
            _ => {}
        }
        let ms = elapsed.as_millis().min(u64::MAX as u128) as u64;
        let i = BUCKETS_MS
            .iter()
            .position(|&b| ms <= b)
            .unwrap_or(BUCKETS_MS.len() - 1);
        self.buckets[i] += 1;
    }

    fn merge(&mut self, other: &RouteStats) {
        self.requests += other.requests;
        self.client_errors += other.client_errors;
        self.server_errors += other.server_errors;
        for (a, b) in self.buckets.iter_mut().zip(other.buckets.iter()) {
            *a += b;
        }
    }

    /// Upper bound of the bucket that holds quantile `q` (0..=1), in ms.
    /// `None` without requests, and for the open bucket above 30 s.
    pub fn quantile_ms(&self, q: f64) -> Option<u64> {
        if self.requests == 0 {
            return None;
        }
        let rank = ((q * self.requests as f64).ceil() as u64).max(1);
        let mut seen = 0;
        for (i, n) in self.buckets.iter().enumerate() {
            seen += n;
            if seen >= rank {
                return (BUCKETS_MS[i] != u64::MAX).then_some(BUCKETS_MS[i]);
            }
        }
        None
    }

    fn to_json(&self) -> Value {
        json!({
            "requests": self.requests,
            "p50_ms": self.quantile_ms(0.5),
            "p95_ms": self.quantile_ms(0.95),
            "4xx": self.client_errors,
            "5xx": self.server_errors,
        })
    }
}

type Routes = BTreeMap<String, RouteStats>;

fn total(routes: &Routes) -> RouteStats {
    let mut t = RouteStats::default();
    for r in routes.values() {
        t.merge(r);
    }
    t
}

fn routes_json(routes: &Routes) -> Value {
    Value::Object(
        routes
            .iter()
            .map(|(k, v)| (k.clone(), v.to_json()))
            .collect(),
    )
}

struct Inner {
    since_start: Routes,
    /// The minute being collected
    current: Routes,
    /// The last whole minute, as `(end, routes)`
    last_minute: Option<(jiff::Timestamp, Routes)>,
}

pub struct HttpStats {
    started: jiff::Timestamp,
    pub access_log: bool,
    pub summary_every: Option<Duration>,
    inner: Mutex<Inner>,
}

impl HttpStats {
    pub fn new(access_log: bool, summary_every: Option<Duration>) -> Self {
        Self {
            started: jiff::Timestamp::now(),
            access_log,
            summary_every,
            inner: Mutex::new(Inner {
                since_start: Routes::new(),
                current: Routes::new(),
                last_minute: None,
            }),
        }
    }

    /// `SPOTWEB_ACCESS_LOG` (`1`/`true`, default off) and `SPOTWEB_HTTP_SUMMARY_SECS` (default 60, `0` is off)
    pub fn from_env() -> Self {
        let access_log = std::env::var("SPOTWEB_ACCESS_LOG")
            .map(|v| matches!(v.trim(), "1" | "true" | "yes" | "on"))
            .unwrap_or(false);
        let secs = std::env::var("SPOTWEB_HTTP_SUMMARY_SECS")
            .ok()
            .and_then(|v| v.trim().parse::<u64>().ok())
            .unwrap_or(60);
        Self::new(access_log, (secs > 0).then(|| Duration::from_secs(secs)))
    }

    pub fn record(&self, route: &str, status: u16, elapsed: Duration) {
        let mut g = self.inner.lock();
        g.since_start
            .entry(route.to_string())
            .or_default()
            .record(status, elapsed);
        g.current
            .entry(route.to_string())
            .or_default()
            .record(status, elapsed);
    }

    /// Close the current period and return it (empty when there was no traffic)
    pub fn rotate(&self) -> Routes {
        let mut g = self.inner.lock();
        let done = std::mem::take(&mut g.current);
        g.last_minute = Some((jiff::Timestamp::now(), done.clone()));
        done
    }

    /// For `/api/v2/status`
    pub fn to_json(&self) -> Value {
        let g = self.inner.lock();
        let mut out = json!({
            "since": crate::timeutil::iso_secs(self.started),
            "total": total(&g.since_start).to_json(),
            "routes": routes_json(&g.since_start),
        });
        if let (Some((end, routes)), Some(every)) = (&g.last_minute, self.summary_every) {
            out["last_period"] = json!({
                "end": crate::timeutil::iso_secs(*end),
                "secs": every.as_secs(),
                "total": total(routes).to_json(),
                "routes": routes_json(routes),
            });
        }
        out
    }
}

/// One log line for a period: totals first, then the busiest routes
pub fn summary_line(routes: &Routes) -> Option<String> {
    let t = total(routes);
    if t.requests == 0 {
        return None;
    }
    let ms = |v: Option<u64>| v.map_or(">30000".to_string(), |v| format!("≤{v}"));
    let mut busiest: Vec<_> = routes.iter().collect();
    busiest.sort_by(|a, b| b.1.requests.cmp(&a.1.requests).then(a.0.cmp(b.0)));
    let top = busiest
        .iter()
        .take(5)
        .map(|(k, v)| {
            let mut s = format!("{k} {} (p95 {} ms", v.requests, ms(v.quantile_ms(0.95)));
            if v.client_errors > 0 {
                s.push_str(&format!(", {} 4xx", v.client_errors));
            }
            if v.server_errors > 0 {
                s.push_str(&format!(", {} 5xx", v.server_errors));
            }
            s.push(')');
            s
        })
        .collect::<Vec<_>>()
        .join(", ");
    Some(format!(
        "{} requests, p50 {} ms, p95 {} ms, {} 4xx, {} 5xx; {top}",
        t.requests,
        ms(t.quantile_ms(0.5)),
        ms(t.quantile_ms(0.95)),
        t.client_errors,
        t.server_errors,
    ))
}

/// Log a summary every `summary_every` until the process ends
pub fn spawn_summary(app: crate::App) {
    let Some(every) = app.http_stats.summary_every else {
        return;
    };
    tokio::spawn(async move {
        let mut tick = tokio::time::interval_at(tokio::time::Instant::now() + every, every);
        tick.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
        loop {
            tick.tick().await;
            if let Some(line) = summary_line(&app.http_stats.rotate()) {
                tracing::info!("http: {line}");
            }
        }
    });
}

/// Route label: the matched route pattern, `static` for embedded files, `not found` for the fallback
fn route_label(req: &Request) -> String {
    match req.extensions().get::<MatchedPath>() {
        Some(p) if super::is_static(p.as_str()) => "static".to_string(),
        Some(p) => p.as_str().to_string(),
        None => "not found".to_string(),
    }
}

pub async fn track(
    State(st): State<WebState>,
    req: Request,
    next: axum::middleware::Next,
) -> Response {
    let start = Instant::now();
    let route = route_label(&req);
    let access = st
        .app
        .http_stats
        .access_log
        .then(|| (req.method().clone(), req.uri().path().to_string()));
    let res = next.run(req).await;
    let elapsed = start.elapsed();
    let status = res.status().as_u16();
    st.app.http_stats.record(&route, status, elapsed);
    if let Some((method, path)) = access {
        tracing::info!(
            target: "spotweb::access",
            "{method} {path} {status} {:.1} ms",
            elapsed.as_secs_f64() * 1000.0
        );
    }
    res
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn quantiles_from_buckets() {
        let mut r = RouteStats::default();
        assert_eq!(r.quantile_ms(0.5), None);
        for ms in [0, 1, 3, 3, 4, 8, 15, 40, 90, 400] {
            r.record(200, Duration::from_millis(ms));
        }
        assert_eq!(r.quantile_ms(0.5), Some(5));
        assert_eq!(r.quantile_ms(0.95), Some(500));
        r.record(404, Duration::from_secs(40));
        r.record(503, Duration::from_millis(1));
        assert_eq!(r.requests, 12);
        assert_eq!((r.client_errors, r.server_errors), (1, 1));
        assert_eq!(r.quantile_ms(1.0), None);
    }

    #[test]
    fn rotate_and_summary() {
        let s = HttpStats::new(false, Some(Duration::from_secs(60)));
        assert!(summary_line(&s.rotate()).is_none());
        s.record("/api/v2/spot", 200, Duration::from_millis(3));
        s.record("/api/v2/spot", 400, Duration::from_millis(1));
        s.record("/", 500, Duration::from_millis(30));
        let line = summary_line(&s.rotate()).unwrap();
        assert!(
            line.starts_with("3 requests, p50 ≤5 ms, p95 ≤50 ms, 1 4xx, 1 5xx;"),
            "{line}"
        );
        assert!(line.contains("/api/v2/spot 2 (p95 ≤5 ms, 1 4xx)"), "{line}");
        let v = s.to_json();
        assert_eq!(v["total"]["requests"], 3);
        assert_eq!(v["last_period"]["routes"]["/"]["5xx"], 1);
        // A new period starts empty, the totals since start remain
        assert!(s.rotate().is_empty());
        assert_eq!(s.to_json()["last_period"]["total"]["requests"], 0);
        assert_eq!(s.to_json()["total"]["requests"], 3);
    }
}
