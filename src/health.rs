//! Data health for monitoring: are tomorrow's prices and recent load/generation stored?

use jiff::civil::Time;
use serde::Serialize;

use crate::countries::COUNTRIES;
use crate::timeutil::{day_ahead_end, js_iso, stockholm, ts, HOUR_MS};

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

/// `latest_price(area)` returns the start of the last stored price interval of an area.
pub fn check(
    now: i64,
    latest_price: impl Fn(&str) -> Option<i64>,
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
    for country in COUNTRIES {
        let tz = country.timezone();
        let end = day_ahead_end(&tz, now, days);
        // The last interval of the day starts at most an hour before its end
        let wanted = end.timestamp().as_millisecond() - HOUR_MS;
        for area in country.areas {
            if latest_price(area.name).is_none_or(|p| p < wanted) {
                missing.push(area.name);
            }
        }
    }
    if !missing.is_empty() {
        problems.push(format!(
            "prices for {label} missing: {}",
            missing.join(", ")
        ));
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

    /// Every area has prices up to and including the last quarter of market day `day`, or of the
    /// local day where that ends first (Finland)
    fn prices_through(day: i8) -> impl Fn(&str) -> Option<i64> {
        move |area| {
            let country = COUNTRIES.iter().find(|c| c.area(area).is_some()).unwrap();
            let next = date(2026, 11, day + 1);
            let local = local_midnight(&country.timezone(), next)
                .timestamp()
                .as_millisecond();
            let market = local_midnight(&market_tz(), next)
                .timestamp()
                .as_millisecond();
            Some(local.min(market) - 15 * 60_000)
        }
    }

    #[test]
    fn healthy_before_and_after_publication() {
        let now = at(21, 13, 30);
        let h = check(
            now,
            prices_through(21),
            Some(now - HOUR_MS),
            Some(now - HOUR_MS),
        );
        assert_eq!(h.problems, Vec::<String>::new());
        assert!(h.healthy);

        let now = at(21, 14, 5);
        let h = check(now, prices_through(21), Some(now), Some(now));
        assert!(!h.healthy);
        assert!(h.problems[0].starts_with("prices for tomorrow missing: "));
        assert!(h.problems[0].contains("SE3"));

        let h = check(now, prices_through(22), Some(now), Some(now));
        assert!(h.healthy);
    }

    #[test]
    fn single_missing_area_and_stale_load() {
        let now = at(21, 15, 0);
        let all = prices_through(22);
        let h = check(
            now,
            |a| {
                if a == "SE2" {
                    Some(at(21, 23, 0))
                } else {
                    all(a)
                }
            },
            Some(now - 2 * HOUR_MS),
            Some(now - 4 * HOUR_MS),
        );
        assert!(!h.healthy);
        assert_eq!(h.problems.len(), 2);
        assert_eq!(h.problems[0], "prices for tomorrow missing: SE2");
        assert!(h.problems[1].starts_with("load is 4 h old"));

        let h = check(now, all, None, Some(now));
        assert_eq!(h.problems, vec!["no generation data".to_string()]);
    }
}
