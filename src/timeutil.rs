//! Time helpers. All timestamps in the database are milliseconds since epoch (UTC).

use jiff::civil::Date;
use jiff::tz::TimeZone;
use jiff::{Timestamp, ToSpan, Zoned};

pub const HOUR_MS: i64 = 3_600_000;
/// Parse an ISO 8601 duration of the form `PT15M`, `PT60M`, `PT1H`, `P1D` to milliseconds.
/// Falls back to one hour, like 1.x did.
pub fn interval_ms(interval: &str) -> i64 {
    let s = interval.trim().to_ascii_uppercase();
    if let Some(rest) = s.strip_prefix("PT") {
        if let Some(n) = rest.strip_suffix('M').and_then(|n| n.parse::<i64>().ok()) {
            return n * 60_000;
        }
        if let Some(n) = rest.strip_suffix('H').and_then(|n| n.parse::<i64>().ok()) {
            return n * HOUR_MS;
        }
        if let Some(n) = rest.strip_suffix('S').and_then(|n| n.parse::<i64>().ok()) {
            return n * 1000;
        }
    } else if let Some(n) = s
        .strip_prefix('P')
        .and_then(|r| r.strip_suffix('D'))
        .and_then(|n| n.parse::<i64>().ok())
    {
        return n * 24 * HOUR_MS;
    }
    HOUR_MS
}

pub fn now_ms() -> i64 {
    Timestamp::now().as_millisecond()
}

/// Time zone by IANA name. The tz database is bundled in the binary, so the names we use always exist.
pub fn tz(name: &str) -> TimeZone {
    TimeZone::get(name).unwrap_or(TimeZone::UTC)
}

pub fn stockholm() -> TimeZone {
    tz("Europe/Stockholm")
}

/// Time zone of the European day-ahead market day (SDAC delivery days run midnight to midnight CET)
pub fn market_tz() -> TimeZone {
    tz("Europe/Brussels")
}

/// Milliseconds since epoch to a timestamp (the epoch for values out of range)
pub fn ts(ms: i64) -> Timestamp {
    Timestamp::from_millisecond(ms).unwrap_or(Timestamp::UNIX_EPOCH)
}

/// First instant of a local calendar day (DST safe: where midnight is skipped, the first time after the gap).
pub fn local_midnight(tz: &TimeZone, date: Date) -> Zoned {
    date.to_zoned(tz.clone())
        .unwrap_or_else(|_| Timestamp::UNIX_EPOCH.to_zoned(tz.clone()))
}

/// `[start, end]` in ms for a local calendar day, end inclusive (23:59:59.999)
pub fn day_range(tz: &TimeZone, date: Date) -> (i64, i64) {
    let start = local_midnight(tz, date).timestamp().as_millisecond();
    let next = local_midnight(tz, date.tomorrow().unwrap_or(date))
        .timestamp()
        .as_millisecond();
    (start, next - 1)
}

/// `[start, end]` in ms for the local calendar month containing `date`
pub fn month_range(tz: &TimeZone, date: Date) -> (i64, i64) {
    let first = date.first_of_month();
    let next = first.checked_add(1.month()).unwrap_or(first);
    (
        local_midnight(tz, first).timestamp().as_millisecond(),
        local_midnight(tz, next).timestamp().as_millisecond() - 1,
    )
}

pub fn today(tz: &TimeZone) -> Date {
    Timestamp::now().to_zoned(tz.clone()).date()
}

/// `date` plus `days` (negative to go back), saturating at the ends of the supported range
pub fn add_days(date: Date, days: i64) -> Date {
    date.checked_add(days.days()).unwrap_or(date)
}

/// End of the day-ahead prices `days` days ahead for an area in `tz`, at `now` (ms): local midnight
/// after `days` days, but no later than the end of that market day in CET. Areas west of CET
/// (Portugal) get their last local hour of a day with the next day's auction.
pub fn day_ahead_end(tz: &TimeZone, now: i64, days: i64) -> Zoned {
    let local = local_midnight(tz, add_days(local_date(tz, now), days));
    let market_tz = market_tz();
    let market = local_midnight(&market_tz, add_days(local_date(&market_tz, now), days));
    if market.timestamp() < local.timestamp() {
        market.with_time_zone(tz.clone())
    } else {
        local
    }
}

pub fn local_date(tz: &TimeZone, ms: i64) -> Date {
    ts(ms).to_zoned(tz.clone()).date()
}

/// Same format as JavaScript `Date.prototype.toJSON()`, e.g. `2024-01-01T23:00:00.000Z`
pub fn js_iso(ms: i64) -> String {
    format!("{:.3}", ts(ms))
}

/// RFC 3339 in UTC with whole seconds, e.g. `2024-01-01T23:00:00Z`
pub fn iso_secs(t: Timestamp) -> String {
    format!("{:.0}", t)
}

/// Parse a date given to the API. Accepts `YYYY-MM-DD` and full RFC 3339 timestamps.
pub fn parse_api_date(s: &str, tz: &TimeZone) -> Option<Date> {
    let s = s.trim();
    if s.len() == 10 {
        return s.parse::<Date>().ok();
    }
    if let Ok(t) = s.parse::<Timestamp>() {
        return Some(t.to_zoned(tz.clone()).date());
    }
    // Something like 2024-01-01T00:00 without zone
    s.get(..10).and_then(|d| d.parse::<Date>().ok())
}

/// Parse an instant given to the API, in ms. Accepts RFC 3339 timestamps, local date-times in `tz`
/// without offset (`2024-01-01T07:00`) and dates (`YYYY-MM-DD`): the start of that local day, or with
/// `end_of_day` the start of the next one.
pub fn parse_api_instant(s: &str, tz: &TimeZone, end_of_day: bool) -> Option<i64> {
    let s = s.trim();
    if let Ok(t) = s.parse::<Timestamp>() {
        return Some(t.as_millisecond());
    }
    if let Ok(d) = s.parse::<Date>() {
        if s.len() == 10 {
            let d = if end_of_day { add_days(d, 1) } else { d };
            return Some(local_midnight(tz, d).timestamp().as_millisecond());
        }
    }
    let dt = s.parse::<jiff::civil::DateTime>().ok()?;
    Some(dt.to_zoned(tz.clone()).ok()?.timestamp().as_millisecond())
}

#[cfg(test)]
mod tests {
    use super::*;
    use jiff::civil::date;

    #[test]
    fn day_ahead_end_follows_market_day() {
        // 21 Nov 2026 15:00 CET
        let now = date(2026, 11, 21)
            .at(15, 0, 0, 0)
            .to_zoned(market_tz())
            .unwrap()
            .timestamp()
            .as_millisecond();
        let midnight = |tz: &TimeZone, d: i8| {
            local_midnight(tz, date(2026, 11, d))
                .timestamp()
                .as_millisecond()
        };
        let (stockholm, helsinki, lisbon) = (
            tz("Europe/Stockholm"),
            tz("Europe/Helsinki"),
            tz("Europe/Lisbon"),
        );
        let end_ms = |tz: &TimeZone| day_ahead_end(tz, now, 2).timestamp().as_millisecond();
        // CET: local midnight
        assert_eq!(end_ms(&stockholm), midnight(&stockholm, 23));
        // East of CET: the local day ends first
        assert_eq!(end_ms(&helsinki), midnight(&helsinki, 23));
        // West of CET: the market day ends first, at 23:00 local
        let end = end_ms(&lisbon);
        assert_eq!(end, midnight(&market_tz(), 23));
        assert_eq!(end, midnight(&lisbon, 23) - HOUR_MS);
        assert_eq!(day_ahead_end(&lisbon, now, 2).time().hour(), 23);
    }

    #[test]
    fn intervals() {
        assert_eq!(interval_ms("PT15M"), 900_000);
        assert_eq!(interval_ms("PT60M"), 3_600_000);
        assert_eq!(interval_ms("PT1H"), 3_600_000);
        assert_eq!(interval_ms("garbage"), 3_600_000);
    }

    #[test]
    fn dst_days() {
        let tz = stockholm();
        // Spring forward: 23 hour day
        let (s, e) = day_range(&tz, date(2024, 3, 31));
        assert_eq!(e + 1 - s, 23 * HOUR_MS);
        // Fall back: 25 hour day
        let (s, e) = day_range(&tz, date(2024, 10, 27));
        assert_eq!(e + 1 - s, 25 * HOUR_MS);
    }

    #[test]
    fn midnight_in_a_gap() {
        // America/Santiago skipped 2022-09-11 00:00-01:00; the day starts at 01:00
        let tz = tz("America/Santiago");
        let z = local_midnight(&tz, date(2022, 9, 11));
        assert_eq!((z.date(), z.time().hour()), (date(2022, 9, 11), 1));
    }

    #[test]
    fn iso_formats() {
        assert_eq!(js_iso(0), "1970-01-01T00:00:00.000Z");
        assert_eq!(js_iso(1_704_150_000_123), "2024-01-01T23:00:00.123Z");
        assert_eq!(iso_secs(ts(1_704_150_000_123)), "2024-01-01T23:00:00Z");
    }

    #[test]
    fn api_dates() {
        let tz = stockholm();
        assert_eq!(parse_api_date("2024-01-31", &tz), Some(date(2024, 1, 31)));
        // 23:30 UTC is the next day in Stockholm
        assert_eq!(
            parse_api_date("2024-01-31T23:30:00Z", &tz),
            Some(date(2024, 2, 1))
        );
        assert_eq!(
            parse_api_date("2024-01-31T10:00", &tz),
            Some(date(2024, 1, 31))
        );
        assert_eq!(parse_api_date("nonsense", &tz), None);
        assert_eq!(parse_api_date("ååååååå", &tz), None);
    }

    #[test]
    fn api_instants() {
        let tz = stockholm();
        // 2024-01-31 00:00 in Stockholm is 23:00 UTC the day before
        let midnight = 1_706_655_600_000;
        assert_eq!(parse_api_instant("2024-01-31", &tz, false), Some(midnight));
        assert_eq!(
            parse_api_instant("2024-01-31", &tz, true),
            Some(midnight + 24 * HOUR_MS)
        );
        assert_eq!(
            parse_api_instant("2024-01-30T23:00:00Z", &tz, false),
            Some(midnight)
        );
        assert_eq!(
            parse_api_instant("2024-01-31T07:00", &tz, true),
            Some(midnight + 7 * HOUR_MS)
        );
        assert_eq!(parse_api_instant("nonsense", &tz, false), None);
    }

    #[test]
    fn month() {
        let tz = stockholm();
        let (s, e) = month_range(&tz, date(2024, 12, 15));
        assert_eq!(js_iso(s), "2024-11-30T23:00:00.000Z");
        assert_eq!(js_iso(e), "2024-12-31T22:59:59.999Z");
    }
}
