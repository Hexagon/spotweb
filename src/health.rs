//! Data health for monitoring: are tomorrow's prices and recent load/generation stored?

use std::collections::HashMap;

use jiff::civil::Time;
use serde::Serialize;

use crate::countries::COUNTRIES;
use crate::price::incomplete_days;
use crate::timeutil::{day_ahead_end, js_iso, local_date, stockholm, ts, HOUR_MS};

/// Day-ahead prices are published around 12:45-13:45 CET; after this local time
/// (Europe/Stockholm, CET/CEST) tomorrow's prices are expected for every area.
pub const TOMORROW_DEADLINE: Time = Time::constant(14, 0, 0, 0);
/// Load and generation older than this are considered missing
pub const MAX_AGE_MS: i64 = 3 * HOUR_MS;

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Health {
    pub healthy: bool,
    /// Human readable reasons, empty when healthy
    pub problems: Vec<String>,
}

/// `prices` holds the stored price intervals per area as `(start, length)` in ms, sorted, from
/// at least the start of the local day before `now`.
pub fn check(
    now: i64,
    prices: &HashMap<String, Vec<(i64, i64)>>,
    latest_generation: Option<i64>,
    latest_load: Option<i64>,
) -> Health {
    let mut problems = Vec::new();

    let after_deadline = ts(now).to_zoned(stockholm()).time() >= TOMORROW_DEADLINE;
    let (days, label) = if after_deadline {
        (2, "tomorrow")
    } else {
        (1, "today")
    };
    let mut missing = Vec::new();
    let mut holes = Vec::new();
    for country in COUNTRIES {
        let tz = country.timezone();
        let end = day_ahead_end(&tz, now, days).timestamp().as_millisecond();
        let last_day = local_date(&tz, end - 1);
        for area in country.areas {
            let rows = prices.get(area.name).map(Vec::as_slice).unwrap_or_default();
            let days = incomplete_days(&tz, rows, local_date(&tz, now), end);
            if days.contains(&last_day) {
                missing.push(area.name.to_string());
            }
            let earlier: Vec<String> = days
                .iter()
                .filter(|d| **d != last_day)
                .map(|d| d.to_string())
                .collect();
            if !earlier.is_empty() {
                holes.push(format!("{} ({})", area.name, earlier.join(", ")));
            }
        }
    }
    if !missing.is_empty() {
        problems.push(format!(
            "prices for {label} missing: {}",
            missing.join(", ")
        ));
    }
    if !holes.is_empty() {
        problems.push(format!("prices incomplete: {}", holes.join(", ")));
    }

    for (name, latest) in [("generation", latest_generation), ("load", latest_load)] {
        match latest {
            None => problems.push(format!("no {name} data")),
            Some(t) if now - t > MAX_AGE_MS => problems.push(format!(
                "{name} is {} h old (latest {})",
                (now - t) / HOUR_MS,
                js_iso(t)
            )),
            Some(_) => {}
        }
    }

    Health {
        healthy: problems.is_empty(),
        problems,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::timeutil::{local_midnight, market_tz};
    use jiff::civil::date;

    fn at(d: i8, h: i8, m: i8) -> i64 {
        date(2026, 11, d)
            .at(h, m, 0, 0)
            .to_zoned(stockholm())
            .unwrap()
            .timestamp()
            .as_millisecond()
    }

    /// Every area has 15 minute prices from 20 Nov up to and including the last quarter of market
    /// day `day`, or of the local day where that ends first (Finland). `skip` leaves out intervals.
    fn prices_through(
        day: i8,
        skip: impl Fn(&str, i64) -> bool,
    ) -> HashMap<String, Vec<(i64, i64)>> {
        let q = 15 * 60_000;
        let mut out = HashMap::new();
        for country in COUNTRIES {
            let tz = country.timezone();
            let next = date(2026, 11, day + 1);
            let local = local_midnight(&tz, next).timestamp().as_millisecond();
            let market = local_midnight(&market_tz(), next)
                .timestamp()
                .as_millisecond();
            let first = local_midnight(&tz, date(2026, 11, 20))
                .timestamp()
                .as_millisecond();
            for area in country.areas {
                let rows = (first..local.min(market))
                    .step_by(q as usize)
                    .filter(|t| !skip(area.name, *t))
                    .map(|t| (t, q))
                    .collect();
                out.insert(area.name.to_string(), rows);
            }
        }
        out
    }

    fn all(day: i8) -> HashMap<String, Vec<(i64, i64)>> {
        prices_through(day, |_, _| false)
    }

    #[test]
    fn healthy_before_and_after_publication() {
        let now = at(21, 13, 30);
        let h = check(now, &all(21), Some(now - HOUR_MS), Some(now - HOUR_MS));
        assert_eq!(h.problems, Vec::<String>::new());
        assert!(h.healthy);

        let now = at(21, 14, 5);
        let h = check(now, &all(21), Some(now), Some(now));
        assert!(!h.healthy);
        assert!(h.problems[0].starts_with("prices for tomorrow missing: "));
        assert!(h.problems[0].contains("SE3"));

        let h = check(now, &all(22), Some(now), Some(now));
        assert!(h.healthy);
    }

    #[test]
    fn single_missing_area_and_stale_load() {
        let now = at(21, 15, 0);
        // Nothing for SE2 tomorrow
        let prices = prices_through(22, |a, t| a == "SE2" && t >= at(22, 0, 0));
        let h = check(
            now,
            &prices,
            Some(now - 2 * HOUR_MS),
            Some(now - 4 * HOUR_MS),
        );
        assert!(!h.healthy);
        assert_eq!(h.problems.len(), 2);
        assert_eq!(h.problems[0], "prices for tomorrow missing: SE2");
        assert!(h.problems[1].starts_with("load is 4 h old"));

        let h = check(now, &all(22), None, Some(now));
        assert_eq!(h.problems, vec!["no generation data".to_string()]);
    }

    #[test]
    fn hole_before_the_latest_price() {
        // FR has tomorrow but not today; SE3 misses one quarter today
        let now = at(21, 15, 0);
        let fr_today = |t: i64| t >= at(21, 0, 0) && t < at(22, 0, 0);
        let prices = prices_through(22, |a, t| {
            (a == "FR" && fr_today(t)) || (a == "SE3" && t == at(21, 10, 15))
        });
        let h = check(now, &prices, Some(now), Some(now));
        assert_eq!(
            h.problems,
            vec!["prices incomplete: SE3 (2026-11-21), FR (2026-11-21)".to_string()]
        );
        // Before 14:00 only today is checked, and a missing today is reported as such
        let now = at(21, 13, 0);
        let h = check(now, &prices, Some(now), Some(now));
        assert_eq!(
            h.problems,
            vec!["prices for today missing: SE3, FR".to_string()]
        );
    }
}
