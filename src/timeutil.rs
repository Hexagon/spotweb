//! Time helpers. All timestamps in the database are milliseconds since epoch (UTC).

use chrono::{DateTime, Datelike, Duration, NaiveDate, NaiveTime, SecondsFormat, TimeZone, Utc};
use chrono_tz::Tz;

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
    Utc::now().timestamp_millis()
}

/// First instant of a local calendar day (DST safe).
pub fn local_midnight(tz: &Tz, date: NaiveDate) -> DateTime<Tz> {
    let mut t = NaiveTime::MIN;
    // A handful of zones skip midnight on DST change; walk forward until valid.
    for _ in 0..4 {
        if let Some(dt) = tz.from_local_datetime(&date.and_time(t)).earliest() {
            return dt;
        }
        t += Duration::hours(1);
    }
    tz.from_utc_datetime(&date.and_time(NaiveTime::MIN))
}

/// `[start, end]` in ms for a local calendar day, end inclusive (23:59:59.999)
pub fn day_range(tz: &Tz, date: NaiveDate) -> (i64, i64) {
    let start = local_midnight(tz, date).timestamp_millis();
    let next = local_midnight(tz, date.succ_opt().unwrap_or(date)).timestamp_millis();
    (start, next - 1)
}

/// `[start, end]` in ms for the local calendar month containing `date`
pub fn month_range(tz: &Tz, date: NaiveDate) -> (i64, i64) {
    let first = date.with_day(1).unwrap_or(date);
    let next = if first.month() == 12 {
        NaiveDate::from_ymd_opt(first.year() + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(first.year(), first.month() + 1, 1)
    }
    .unwrap_or(first);
    (
        local_midnight(tz, first).timestamp_millis(),
        local_midnight(tz, next).timestamp_millis() - 1,
    )
}

pub fn today(tz: &Tz) -> NaiveDate {
    Utc::now().with_timezone(tz).date_naive()
}

/// Time zone of the European day-ahead market day (SDAC delivery days run midnight to midnight CET)
pub const MARKET_TZ: Tz = chrono_tz::Europe::Brussels;

/// End of the day-ahead prices `days` days ahead for an area in `tz`, at `now` (ms): local midnight
/// after `days` days, but no later than the end of that market day in CET. Areas west of CET
/// (Portugal) get their last local hour of a day with the next day's auction.
pub fn day_ahead_end(tz: &Tz, now: i64, days: i64) -> DateTime<Tz> {
    let local = local_midnight(tz, local_date(tz, now) + Duration::days(days));
    let market = local_midnight(
        &MARKET_TZ,
        local_date(&MARKET_TZ, now) + Duration::days(days),
    );
    if market < local {
        market.with_timezone(tz)
    } else {
        local
    }
}

pub fn local_date(tz: &Tz, ms: i64) -> NaiveDate {
    tz.timestamp_millis_opt(ms)
        .single()
        .map(|d| d.date_naive())
        .unwrap_or_default()
}

/// Same format as JavaScript `Date.prototype.toJSON()`, e.g. `2024-01-01T23:00:00.000Z`
pub fn js_iso(ms: i64) -> String {
    Utc.timestamp_millis_opt(ms)
        .single()
        .unwrap_or_default()
        .to_rfc3339_opts(SecondsFormat::Millis, true)
}

/// Parse a date given to the API. Accepts `YYYY-MM-DD` and full RFC 3339 timestamps.
pub fn parse_api_date(s: &str, tz: &Tz) -> Option<NaiveDate> {
    let s = s.trim();
    if let Ok(d) = NaiveDate::parse_from_str(s, "%Y-%m-%d") {
        return Some(d);
    }
    if let Ok(dt) = DateTime::parse_from_rfc3339(s) {
        return Some(dt.with_timezone(tz).date_naive());
    }
    // Something like 2024-01-01T00:00 without zone
    if s.len() >= 10 {
        return NaiveDate::parse_from_str(&s[..10], "%Y-%m-%d").ok();
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn day_ahead_end_follows_market_day() {
        // 21 Nov 2026 15:00 CET
        let now = MARKET_TZ
            .with_ymd_and_hms(2026, 11, 21, 15, 0, 0)
            .unwrap()
            .timestamp_millis();
        let midnight = |tz: &Tz, d: u32| {
            local_midnight(tz, NaiveDate::from_ymd_opt(2026, 11, d).unwrap()).timestamp_millis()
        };
        let (stockholm, helsinki, lisbon) = (
            chrono_tz::Europe::Stockholm,
            chrono_tz::Europe::Helsinki,
            chrono_tz::Europe::Lisbon,
        );
        // CET: local midnight
        let end = day_ahead_end(&stockholm, now, 2).timestamp_millis();
        assert_eq!(end, midnight(&stockholm, 23));
        // East of CET: the local day ends first
        let end = day_ahead_end(&helsinki, now, 2).timestamp_millis();
        assert_eq!(end, midnight(&helsinki, 23));
        // West of CET: the market day ends first, at 23:00 local
        let end = day_ahead_end(&lisbon, now, 2).timestamp_millis();
        assert_eq!(end, midnight(&MARKET_TZ, 23));
        assert_eq!(end, midnight(&lisbon, 23) - HOUR_MS);
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
        let tz: Tz = "Europe/Stockholm".parse().unwrap();
        // Spring forward: 23 hour day
        let (s, e) = day_range(&tz, NaiveDate::from_ymd_opt(2024, 3, 31).unwrap());
        assert_eq!(e + 1 - s, 23 * HOUR_MS);
        // Fall back: 25 hour day
        let (s, e) = day_range(&tz, NaiveDate::from_ymd_opt(2024, 10, 27).unwrap());
        assert_eq!(e + 1 - s, 25 * HOUR_MS);
    }

    #[test]
    fn js_iso_format() {
        assert_eq!(js_iso(0), "1970-01-01T00:00:00.000Z");
    }

    #[test]
    fn month() {
        let tz: Tz = "Europe/Stockholm".parse().unwrap();
        let (s, _) = month_range(&tz, NaiveDate::from_ymd_opt(2024, 12, 15).unwrap());
        assert_eq!(js_iso(s), "2024-11-30T23:00:00.000Z");
    }
}
