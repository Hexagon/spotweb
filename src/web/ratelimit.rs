//! Optional rate limiting of `/api/` per client IP (token bucket).
//!
//! Off unless `SPOTWEB_API_RATE_LIMIT` is set to a number of requests per minute. Each client may
//! use a whole minute's worth at once (the bucket holds `limit` tokens) and then gets one token
//! every `60 / limit` seconds. Requests over the limit are answered with `429` and `Retry-After`.
//!
//! The client is the peer address of the connection. `X-Forwarded-For` and `X-Real-IP` are only
//! used when the peer is one of `SPOTWEB_TRUSTED_PROXIES`. IPv6 clients are counted per /64,
//! since one host usually has a whole /64 to pick addresses from.

use std::collections::HashMap;
use std::net::{IpAddr, Ipv6Addr, SocketAddr};
use std::time::{Duration, Instant};

use axum::extract::{ConnectInfo, Request, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use parking_lot::Mutex;
use serde_json::json;

use super::WebState;

/// Most clients tracked at once (roughly 100 bytes each). Idle clients are dropped once a minute;
/// when the map is still full, new clients are let through untracked until there is room again.
const MAX_CLIENTS: usize = 100_000;

/// How often buckets that have filled up again are removed
const CLEANUP_EVERY: Duration = Duration::from_secs(60);

/// An address or network, e.g. `127.0.0.1`, `10.0.0.0/8` or `fd00::/8`
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct IpNet {
    addr: IpAddr,
    prefix: u8,
}

impl std::str::FromStr for IpNet {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, String> {
        let s = s.trim();
        let (addr, prefix) = match s.split_once('/') {
            Some((a, p)) => (a, Some(p)),
            None => (s, None),
        };
        let addr: IpAddr = addr
            .parse()
            .map_err(|_| format!("{s:?} is not an IP address or network"))?;
        let addr = addr.to_canonical();
        let max = if addr.is_ipv4() { 32 } else { 128 };
        let prefix = match prefix {
            None => max,
            Some(p) => p
                .parse::<u8>()
                .ok()
                .filter(|p| *p <= max)
                .ok_or_else(|| format!("{s:?} has an invalid prefix length"))?,
        };
        Ok(Self { addr, prefix })
    }
}

impl IpNet {
    pub fn contains(&self, ip: IpAddr) -> bool {
        match (self.addr, ip.to_canonical()) {
            (IpAddr::V4(net), IpAddr::V4(ip)) => {
                let mask = u32::MAX.checked_shl(32 - self.prefix as u32).unwrap_or(0);
                u32::from(net) & mask == u32::from(ip) & mask
            }
            (IpAddr::V6(net), IpAddr::V6(ip)) => {
                let mask = u128::MAX.checked_shl(128 - self.prefix as u32).unwrap_or(0);
                u128::from(net) & mask == u128::from(ip) & mask
            }
            _ => false,
        }
    }
}

/// Parse `SPOTWEB_TRUSTED_PROXIES`: addresses or networks separated by commas or spaces
pub fn parse_trusted_proxies(s: &str) -> Result<Vec<IpNet>, String> {
    s.split([',', ' '])
        .filter(|p| !p.trim().is_empty())
        .map(str::parse)
        .collect()
}

/// Address of the client: the peer, or what a trusted proxy in front of us says.
///
/// `X-Forwarded-For` is read from the right, skipping trusted proxies, since only the entries
/// added by our own proxies can be trusted; the client can write anything to the left of them.
pub fn client_ip(peer: IpAddr, headers: &HeaderMap, trusted: &[IpNet]) -> IpAddr {
    let peer = peer.to_canonical();
    let is_trusted = |ip: IpAddr| trusted.iter().any(|n| n.contains(ip));
    if !is_trusted(peer) {
        return peer;
    }
    let forwarded: Vec<IpAddr> = headers
        .get_all("x-forwarded-for")
        .iter()
        .filter_map(|v| v.to_str().ok())
        .flat_map(|v| v.split(','))
        .map_while(|ip| ip.trim().parse::<IpAddr>().ok())
        .map(|ip| ip.to_canonical())
        .collect();
    if let Some(ip) = forwarded.iter().rev().find(|ip| !is_trusted(**ip)) {
        return *ip;
    }
    if let Some(ip) = forwarded.first() {
        return *ip;
    }
    headers
        .get("x-real-ip")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.trim().parse::<IpAddr>().ok())
        .map(|ip| ip.to_canonical())
        .unwrap_or(peer)
}

/// Key of a client in the bucket map: the address, or its /64 for IPv6
fn client_key(ip: IpAddr) -> IpAddr {
    match ip.to_canonical() {
        IpAddr::V6(v6) => IpAddr::V6(Ipv6Addr::from(
            u128::from(v6) & 0xffff_ffff_ffff_ffff_0000_0000_0000_0000,
        )),
        v4 => v4,
    }
}

#[derive(Debug, Clone, Copy)]
struct Bucket {
    tokens: f64,
    updated: Instant,
}

struct Inner {
    buckets: HashMap<IpAddr, Bucket>,
    last_cleanup: Instant,
}

pub struct RateLimiter {
    /// Requests per minute, also the size of the bucket
    per_minute: u32,
    pub trusted_proxies: Vec<IpNet>,
    inner: Mutex<Inner>,
}

impl RateLimiter {
    pub fn new(per_minute: u32, trusted_proxies: Vec<IpNet>) -> Self {
        Self {
            per_minute: per_minute.max(1),
            trusted_proxies,
            inner: Mutex::new(Inner {
                buckets: HashMap::new(),
                last_cleanup: Instant::now(),
            }),
        }
    }

    fn capacity(&self) -> f64 {
        self.per_minute as f64
    }

    fn tokens_per_sec(&self) -> f64 {
        self.per_minute as f64 / 60.0
    }

    /// Take one token for `ip`. `Err` holds the seconds until the next token.
    pub fn check(&self, ip: IpAddr) -> Result<(), u64> {
        self.check_at(ip, Instant::now())
    }

    fn check_at(&self, ip: IpAddr, now: Instant) -> Result<(), u64> {
        let cap = self.capacity();
        let rate = self.tokens_per_sec();
        let mut g = self.inner.lock();
        if now.saturating_duration_since(g.last_cleanup) >= CLEANUP_EVERY
            || g.buckets.len() >= MAX_CLIENTS
        {
            g.last_cleanup = now;
            // A bucket that has filled up again is the same as no bucket
            g.buckets.retain(|_, b| {
                b.tokens + now.saturating_duration_since(b.updated).as_secs_f64() * rate < cap
            });
        }
        let key = client_key(ip);
        if g.buckets.len() >= MAX_CLIENTS && !g.buckets.contains_key(&key) {
            return Ok(());
        }
        let b = g.buckets.entry(key).or_insert(Bucket {
            tokens: cap,
            updated: now,
        });
        let elapsed = now.saturating_duration_since(b.updated).as_secs_f64();
        b.tokens = (b.tokens + elapsed * rate).min(cap);
        b.updated = now;
        if b.tokens >= 1.0 {
            b.tokens -= 1.0;
            Ok(())
        } else {
            Err((((1.0 - b.tokens) / rate).ceil() as u64).max(1))
        }
    }

    #[cfg(test)]
    fn tracked(&self) -> usize {
        self.inner.lock().buckets.len()
    }
}

/// Middleware: rate limit `/api/` when `SPOTWEB_API_RATE_LIMIT` is set
pub async fn limit(
    State(st): State<WebState>,
    req: Request,
    next: axum::middleware::Next,
) -> Response {
    let Some(limiter) = st.app.api_rate_limiter.as_ref() else {
        return next.run(req).await;
    };
    if !req.uri().path().starts_with("/api/") {
        return next.run(req).await;
    }
    // Without a peer address (only in tests that do not set one) there is nothing to count
    let Some(peer) = req
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|c| c.0.ip())
    else {
        return next.run(req).await;
    };
    let ip = client_ip(peer, req.headers(), &limiter.trusted_proxies);
    match limiter.check(ip) {
        Ok(()) => next.run(req).await,
        Err(retry_after) => too_many_requests(retry_after),
    }
}

fn too_many_requests(retry_after: u64) -> Response {
    let body = json!({
        "status": "error",
        "details": format!("Too many requests, retry in {retry_after} s"),
    });
    let mut res = (StatusCode::TOO_MANY_REQUESTS, axum::Json(body)).into_response();
    let h = res.headers_mut();
    h.insert(header::RETRY_AFTER, HeaderValue::from(retry_after));
    h.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    res
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ip(s: &str) -> IpAddr {
        s.parse().unwrap()
    }

    fn nets(s: &str) -> Vec<IpNet> {
        parse_trusted_proxies(s).unwrap()
    }

    #[test]
    fn networks() {
        let n = nets("127.0.0.1, 10.0.0.0/8 fd00::/8,::1");
        assert_eq!(n.len(), 4);
        assert!(n[0].contains(ip("127.0.0.1")));
        assert!(!n[0].contains(ip("127.0.0.2")));
        assert!(n[1].contains(ip("10.255.1.2")));
        assert!(!n[1].contains(ip("11.0.0.1")));
        assert!(n[2].contains(ip("fd12::1")));
        assert!(!n[2].contains(ip("10.0.0.1")));
        assert!(n[3].contains(ip("::1")));
        // IPv4-mapped IPv6 peers match IPv4 networks
        assert!(n[1].contains(ip("::ffff:10.1.2.3")));
        assert!(nets("0.0.0.0/0")[0].contains(ip("8.8.8.8")));
        assert!(parse_trusted_proxies("").unwrap().is_empty());
        assert!(parse_trusted_proxies("10.0.0.0/33").is_err());
        assert!(parse_trusted_proxies("proxy.local").is_err());
    }

    #[test]
    fn client_ip_only_trusts_configured_proxies() {
        let mut h = HeaderMap::new();
        h.insert("x-forwarded-for", "1.1.1.1, 2.2.2.2".parse().unwrap());
        h.insert("x-real-ip", "3.3.3.3".parse().unwrap());
        // Not trusted: the peer
        assert_eq!(client_ip(ip("9.9.9.9"), &h, &[]), ip("9.9.9.9"));
        assert_eq!(
            client_ip(ip("9.9.9.9"), &h, &nets("127.0.0.1")),
            ip("9.9.9.9")
        );
        // Trusted: the rightmost address that is not a trusted proxy
        assert_eq!(
            client_ip(ip("127.0.0.1"), &h, &nets("127.0.0.1")),
            ip("2.2.2.2")
        );
        assert_eq!(
            client_ip(ip("127.0.0.1"), &h, &nets("127.0.0.1, 2.2.2.2")),
            ip("1.1.1.1")
        );
        // Without X-Forwarded-For: X-Real-IP, then the peer
        h.remove("x-forwarded-for");
        assert_eq!(
            client_ip(ip("::ffff:127.0.0.1"), &h, &nets("127.0.0.1")),
            ip("3.3.3.3")
        );
        h.remove("x-real-ip");
        assert_eq!(
            client_ip(ip("127.0.0.1"), &h, &nets("127.0.0.1")),
            ip("127.0.0.1")
        );
    }

    #[test]
    fn token_bucket() {
        let l = RateLimiter::new(60, vec![]);
        let t0 = Instant::now();
        let a = ip("192.0.2.1");
        for _ in 0..60 {
            assert_eq!(l.check_at(a, t0), Ok(()));
        }
        assert_eq!(l.check_at(a, t0), Err(1));
        // Other clients have their own bucket
        assert_eq!(l.check_at(ip("192.0.2.2"), t0), Ok(()));
        // One token per second
        assert_eq!(l.check_at(a, t0 + Duration::from_millis(1000)), Ok(()));
        assert_eq!(l.check_at(a, t0 + Duration::from_millis(1500)), Err(1));

        // A slow limit tells the client how long to wait
        let slow = RateLimiter::new(2, vec![]);
        assert!(slow.check_at(a, t0).is_ok());
        assert!(slow.check_at(a, t0).is_ok());
        assert_eq!(slow.check_at(a, t0), Err(30));
    }

    #[test]
    fn home_assistant_polling_is_never_limited() {
        // Even a very low limit lets a poll every 3 minutes through, forever
        let l = RateLimiter::new(1, vec![]);
        let t0 = Instant::now();
        for i in 0..1000 {
            assert!(l
                .check_at(ip("192.0.2.1"), t0 + Duration::from_secs(180 * i))
                .is_ok());
        }
    }

    #[test]
    fn ipv6_counts_per_64() {
        let l = RateLimiter::new(1, vec![]);
        let t0 = Instant::now();
        assert!(l.check_at(ip("2001:db8:1:2::1"), t0).is_ok());
        assert!(l.check_at(ip("2001:db8:1:2::ffff"), t0).is_err());
        assert!(l.check_at(ip("2001:db8:1:3::1"), t0).is_ok());
    }

    #[test]
    fn idle_clients_are_dropped() {
        let l = RateLimiter::new(60, vec![]);
        let t0 = Instant::now();
        for i in 0..100u8 {
            l.check_at(IpAddr::from([192, 0, 2, i]), t0).unwrap();
        }
        assert_eq!(l.tracked(), 100);
        // After a minute every bucket is full again and forgotten; only the new client remains
        l.check_at(ip("198.51.100.1"), t0 + CLEANUP_EVERY).unwrap();
        assert_eq!(l.tracked(), 1);
    }
}
