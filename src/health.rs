//! Data health for monitoring: are tomorrow's prices and recent load/generation stored?

use chrono::{NaiveTime, TimeZone};
use serde::Serialize;

use crate::countries::COUNTRIES;
use crate::timeutil::{day_ahead_end, js_iso, HOUR_MS};

/// Day-ahead prices are published around 12:45-13:45 CET; after this local time
/// (Europe/Stockholm, CET/CEST) tomorrow's prices are expected for every area.
pub const TOMORROW_DEADLINE: NaiveTime = match NaiveTime::from_hms_opt(14, 0, 0) {
    Some(t) => t,
    None => unreachable!(),
};
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

    let cet = chrono_tz::Europe::Stockholm;
    let after_deadline = cet
        .timestamp_millis_opt(now)
        .single()
        .map(|t| t.time() >= TOMORROW_DEADLINE)
        .unwrap_or(false);
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
        let wanted = end.timestamp_millis() - HOUR_MS;
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
    use crate::timeutil::{local_midnight, MARKET_TZ};
    use chrono::NaiveDate;

    fn at(d: u32, h: u32, m: u32) -> i64 {
        chrono_tz::Europe::Stockholm
            .from_local_datetime(
                &NaiveDate::from_ymd_opt(2026, 11, d)
                    .unwrap()
                    .and_hms_opt(h, m, 0)
                    .unwrap(),
            )
            .unwrap()
            .timestamp_millis()
    }

    /// Every area has prices up to and including the last quarter of market day `day`, or of the
    /// local day where that ends first (Finland)
    fn prices_through(day: u32) -> impl Fn(&str) -> Option<i64> {
        move |area| {
            let country = COUNTRIES.iter().find(|c| c.area(area).is_some()).unwrap();
            let next = NaiveDate::from_ymd_opt(2026, 11, day + 1).unwrap();
            let local = local_midnight(&country.timezone(), next).timestamp_millis();
            let market = local_midnight(&MARKET_TZ, next).timestamp_millis();
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
