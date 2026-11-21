//! Spot price selection, grouping and presentation helpers.

use std::collections::BTreeMap;

use jiff::civil::Date;
use jiff::tz::TimeZone;
use serde::Serialize;

use crate::timeutil::{add_days, interval_ms, local_date, local_midnight};

/// Raw row from the database
#[derive(Debug, Clone)]
pub struct SpotRow {
    pub time: i64,
    pub interval: String,
    pub price: f64,
}

/// Row returned by `/api/v2/spot`, identical in shape to 1.x
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct SpotApiRow {
    /// Start of group in ms. `null` for `period=total` (1.x returned `null` too).
    pub time: Option<i64>,
    pub price: f64,
    pub min: f64,
    pub max: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Grouping {
    Total,
    Yearly,
    Monthly,
    Weekly,
    Daily,
    Hourly,
    Minimum,
}

impl Grouping {
    pub fn parse(s: &str) -> Option<Self> {
        Some(match s.trim().to_ascii_lowercase().as_str() {
            "total" => Self::Total,
            "yearly" => Self::Yearly,
            "monthly" => Self::Monthly,
            "weekly" => Self::Weekly,
            "daily" => Self::Daily,
            "hourly" => Self::Hourly,
            "minimum" => Self::Minimum,
            _ => return None,
        })
    }
}

/// How to treat the `interval` (resolution) of stored prices.
#[derive(Debug, Clone)]
pub enum IntervalMode {
    /// Only rows with exactly this resolution (1.x behaviour when `interval=` is given)
    Exact(String),
    /// Prefer this resolution, but for local days where it is missing use the
    /// finest resolution available that day. Lets long term statistics span the
    /// switch from hourly to 15 minute prices.
    Prefer(String),
}

/// Pick which rows to use according to `mode`. Returns `(time, price, duration_ms)`, sorted by time.
pub fn select_rows(rows: &[SpotRow], mode: &IntervalMode, tz: &TimeZone) -> Vec<(i64, f64, i64)> {
    let mut out: Vec<(i64, f64, i64)> = match mode {
        IntervalMode::Exact(iv) => rows
            .iter()
            .filter(|r| r.interval.eq_ignore_ascii_case(iv))
            .map(|r| (r.time, r.price, interval_ms(&r.interval)))
            .collect(),
        IntervalMode::Prefer(iv) => {
            // Group per local day
            let mut days: BTreeMap<Date, Vec<&SpotRow>> = BTreeMap::new();
            for r in rows {
                days.entry(local_date(tz, r.time)).or_default().push(r);
            }
            let mut out = Vec::with_capacity(rows.len());
            for (_, day_rows) in days {
                let chosen: String = if day_rows.iter().any(|r| r.interval.eq_ignore_ascii_case(iv))
                {
                    iv.clone()
                } else {
                    day_rows
                        .iter()
                        .min_by_key(|r| interval_ms(&r.interval))
                        .map(|r| r.interval.clone())
                        .unwrap_or_default()
                };
                out.extend(
                    day_rows
                        .into_iter()
                        .filter(|r| r.interval.eq_ignore_ascii_case(&chosen))
                        .map(|r| (r.time, r.price, interval_ms(&r.interval))),
                );
            }
            out
        }
    };
    out.sort_by_key(|r| r.0);
    out.dedup_by_key(|r| r.0);
    out
}

/// Local days from `from` up to `end` (ms, exclusive) whose stored prices do not cover the whole
/// day. A day that `end` cuts short only has to be covered up to `end`. `rows` are
/// `(start, interval length)` in ms, sorted by start. A day counts as complete when a single
/// resolution covers all of it, so a day stored at both 60 and 15 minutes is not double counted.
pub fn incomplete_days(tz: &TimeZone, rows: &[(i64, i64)], from: Date, end: i64) -> Vec<Date> {
    let mut out = Vec::new();
    let mut i =
        rows.partition_point(|r| r.0 < local_midnight(tz, from).timestamp().as_millisecond());
    let mut day = from;
    loop {
        let start = local_midnight(tz, day).timestamp().as_millisecond();
        let Ok(next) = day.tomorrow() else { break };
        if start >= end {
            break;
        }
        let stop = local_midnight(tz, next)
            .timestamp()
            .as_millisecond()
            .min(end);
        // Covered ms per resolution
        let mut covered: Vec<(i64, i64)> = Vec::new();
        while i < rows.len() && rows[i].0 < stop {
            let (_, len) = rows[i];
            match covered.iter_mut().find(|c| c.0 == len) {
                Some(c) => c.1 += len,
                None => covered.push((len, len)),
            }
            i += 1;
        }
        if !covered.iter().any(|c| c.1 >= stop - start) {
            out.push(day);
        }
        day = next;
    }
    out
}

/// Start of the group that contains `t` (`None` for [`Grouping::Total`])
pub fn bucket(g: Grouping, tz: &TimeZone, t: i64) -> Option<i64> {
    match g {
        Grouping::Total => None,
        Grouping::Hourly | Grouping::Minimum => Some(t),
        _ => {
            let d = local_date(tz, t);
            let start = match g {
                Grouping::Yearly => d.first_of_year(),
                Grouping::Monthly => d.first_of_month(),
                Grouping::Weekly => add_days(d, -(d.weekday().to_monday_zero_offset() as i64)),
                _ => d,
            };
            Some(local_midnight(tz, start).timestamp().as_millisecond())
        }
    }
}

/// Group selected rows. Averages are time weighted, which equals a plain average
/// when all rows share the same resolution.
pub fn group(rows: &[(i64, f64, i64)], g: Grouping, tz: &TimeZone) -> Vec<SpotApiRow> {
    // key: Option<i64> -> (weighted sum, weight, min, max)
    let mut groups: BTreeMap<Option<i64>, (f64, f64, f64, f64)> = BTreeMap::new();
    for &(t, p, dur) in rows {
        let w = dur.max(1) as f64;
        let e =
            groups
                .entry(bucket(g, tz, t))
                .or_insert((0.0, 0.0, f64::INFINITY, f64::NEG_INFINITY));
        e.0 += p * w;
        e.1 += w;
        e.2 = e.2.min(p);
        e.3 = e.3.max(p);
    }
    groups
        .into_iter()
        .map(|(time, (s, w, min, max))| SpotApiRow {
            time,
            price: s / w,
            min,
            max,
        })
        .collect()
}

pub fn convert(rows: &mut [SpotApiRow], rate: f64) {
    for r in rows {
        r.price *= rate;
        r.min *= rate;
        r.max *= rate;
    }
}

/// Price presentation settings, same semantics as 1.x `processPrice`
#[derive(Debug, Clone)]
pub struct PriceProps {
    pub extra: f64,
    pub multiplier: f64,
    pub factor: f64,
    pub decimals: usize,
    pub price_factor: bool,
    /// Multiply by 100 (öre / cent)
    pub sub_unit: bool,
}

/// Convert EUR/MWh (already currency converted) to a formatted per-kWh string. `-` for missing.
pub fn process_price(price: Option<f64>, p: &PriceProps) -> String {
    let Some(mut price) = price else {
        return "-".into();
    };
    price /= 1000.0;
    if p.price_factor {
        price *= p.multiplier;
        price += p.extra;
        price *= p.factor;
    }
    if p.sub_unit {
        price *= 100.0;
    }
    format!("{:.*}", p.decimals.min(100), price)
}

pub fn stats(values: &[f64]) -> Option<(f64, f64, f64)> {
    if values.is_empty() {
        return None;
    }
    let avg = values.iter().sum::<f64>() / values.len() as f64;
    let min = values.iter().cloned().fold(f64::INFINITY, f64::min);
    let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    Some((avg, min, max))
}

/// Price valid at `now`, given rows of `(start, price)` and the resolution
pub fn price_at(rows: &[(i64, f64)], interval: i64, now: i64) -> Option<f64> {
    rows.iter()
        .find(|(t, _)| *t <= now && t + interval > now)
        .map(|r| r.1)
}

#[allow(dead_code)]
/// Infer resolution from the smallest gap between rows (1.x `inferIntervalMs`)
pub fn infer_interval(rows: &[(i64, f64)]) -> i64 {
    let mut times: Vec<i64> = rows.iter().map(|r| r.0).collect();
    times.sort_unstable();
    times
        .windows(2)
        .map(|w| w[1] - w[0])
        .filter(|d| *d > 0)
        .min()
        .unwrap_or(crate::timeutil::HOUR_MS)
}

/// Time weighted average price of `(time, price, duration_ms)` rows
pub fn weighted_avg(rows: &[(i64, f64, i64)]) -> Option<f64> {
    let dur: i64 = rows.iter().map(|r| r.2).sum();
    (dur > 0).then(|| rows.iter().map(|r| r.1 * r.2 as f64).sum::<f64>() / dur as f64)
}

/// The cheapest intervals covering at least `duration_ms`, for `/api/v2/cheapest`.
///
/// `rows` are `(time, price, duration_ms)` sorted by time. With `consecutive` the result is the
/// unbroken run of intervals with the lowest time weighted average (the earliest one on ties);
/// otherwise the cheapest single intervals (earliest first on equal prices), sorted by time.
/// `None` when the rows (or, for `consecutive`, no unbroken run of them) cover `duration_ms`.
pub fn cheapest(
    rows: &[(i64, f64, i64)],
    duration_ms: i64,
    consecutive: bool,
) -> Option<Vec<(i64, f64, i64)>> {
    if duration_ms <= 0 {
        return None;
    }
    if !consecutive {
        let mut idx: Vec<usize> = (0..rows.len()).collect();
        idx.sort_by(|a, b| {
            rows[*a]
                .1
                .total_cmp(&rows[*b].1)
                .then(rows[*a].0.cmp(&rows[*b].0))
        });
        let mut covered = 0;
        let mut picked = vec![];
        for i in idx {
            if covered >= duration_ms {
                break;
            }
            covered += rows[i].2;
            picked.push(rows[i]);
        }
        if covered < duration_ms {
            return None;
        }
        picked.sort_by_key(|r| r.0);
        return Some(picked);
    }
    let mut best: Option<(f64, usize, usize)> = None;
    for i in 0..rows.len() {
        let (mut covered, mut sum) = (0i64, 0.0);
        let mut j = i;
        while j < rows.len() && covered < duration_ms {
            if j > i && rows[j - 1].0 + rows[j - 1].2 != rows[j].0 {
                break;
            }
            covered += rows[j].2;
            sum += rows[j].1 * rows[j].2 as f64;
            j += 1;
        }
        if covered < duration_ms {
            continue;
        }
        let avg = sum / covered as f64;
        if best.is_none_or(|b| avg < b.0) {
            best = Some((avg, i, j));
        }
    }
    best.map(|(_, i, j)| rows[i..j].to_vec())
}

/// Split rows sorted by time into unbroken runs
pub fn runs(rows: &[(i64, f64, i64)]) -> Vec<&[(i64, f64, i64)]> {
    let mut out = vec![];
    let mut start = 0;
    for i in 1..=rows.len() {
        if i == rows.len() || rows[i - 1].0 + rows[i - 1].2 != rows[i].0 {
            if i > start {
                out.push(&rows[start..i]);
            }
            start = i;
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::timeutil::day_range;

    fn tz() -> TimeZone {
        crate::timeutil::stockholm()
    }

    #[test]
    fn process_like_v1() {
        let p = PriceProps {
            extra: 0.0,
            multiplier: 1.0,
            factor: 1.0,
            decimals: 5,
            price_factor: true,
            sub_unit: false,
        };
        assert_eq!(process_price(Some(123.456), &p), "0.12346");
        assert_eq!(process_price(None, &p), "-");
        let p = PriceProps {
            extra: 0.5,
            multiplier: 1.02,
            factor: 1.25,
            decimals: 2,
            price_factor: true,
            sub_unit: true,
        };
        // ((0.1 * 1.02) + 0.5) * 1.25 * 100 = 75.25
        assert_eq!(process_price(Some(100.0), &p), "75.25");
    }

    #[test]
    fn prefer_mode_spans_resolution_change() {
        let tz = tz();
        let (d1, _) = day_range(&tz, jiff::civil::date(2025, 9, 30));
        let (d2, _) = day_range(&tz, jiff::civil::date(2025, 10, 1));
        let mut rows = vec![];
        for h in 0..24 {
            rows.push(SpotRow {
                time: d1 + h * 3_600_000,
                interval: "PT60M".into(),
                price: 10.0,
            });
        }
        for q in 0..96 {
            rows.push(SpotRow {
                time: d2 + q * 900_000,
                interval: "PT15M".into(),
                price: 20.0,
            });
            if q % 4 == 0 {
                // duplicate hourly data the same day must be ignored
                rows.push(SpotRow {
                    time: d2 + q * 900_000 + 1,
                    interval: "PT60M".into(),
                    price: 1000.0,
                });
            }
        }
        let sel = select_rows(&rows, &IntervalMode::Prefer("PT15M".into()), &tz);
        assert_eq!(sel.len(), 24 + 96);
        let g = group(&sel, Grouping::Total, &tz);
        assert_eq!(g.len(), 1);
        assert!((g[0].price - 15.0).abs() < 1e-9);
        assert_eq!(g[0].time, None);
        let daily = group(&sel, Grouping::Daily, &tz);
        assert_eq!(daily.len(), 2);
        assert_eq!(daily[0].time, Some(d1));
        let exact = select_rows(&rows, &IntervalMode::Exact("PT15M".into()), &tz);
        assert_eq!(exact.len(), 96);
    }

    #[test]
    fn incomplete_days_finds_gaps() {
        let tz = tz();
        let d = |day: i8| jiff::civil::date(2026, 10, day);
        let q = 15 * 60_000;
        let h = 60 * 60_000;
        let quarters = |day: i8| {
            let s = local_midnight(&tz, d(day)).timestamp().as_millisecond();
            let e = local_midnight(&tz, d(day + 1)).timestamp().as_millisecond();
            (s..e)
                .step_by(q as usize)
                .map(|t| (t, q))
                .collect::<Vec<_>>()
        };
        let end = local_midnight(&tz, d(27)).timestamp().as_millisecond();
        // 24: complete; 25 (25 hours): one quarter missing; 26: nothing stored
        let mut rows = quarters(24);
        let mut dst = quarters(25);
        assert_eq!(dst.len(), 100);
        dst.remove(40);
        rows.extend(dst);
        assert_eq!(incomplete_days(&tz, &rows, d(24), end), vec![d(25), d(26)]);
        // A 25 hour day at 60 minutes is complete; mixed resolutions are not added up
        let s = local_midnight(&tz, d(25)).timestamp().as_millisecond();
        let mut hourly: Vec<(i64, i64)> = (0..25).map(|n| (s + n * h, h)).collect();
        assert!(incomplete_days(&tz, &hourly, d(25), s + 25 * h).is_empty());
        hourly.remove(3);
        hourly.push((s + 3 * h, q));
        hourly.sort();
        assert_eq!(
            incomplete_days(&tz, &hourly, d(25), s + 25 * h),
            vec![d(25)]
        );
        // A day cut short by `end` only has to be covered up to `end`
        let cut = local_midnight(&tz, d(24)).timestamp().as_millisecond() + 23 * h;
        let part: Vec<_> = quarters(24).into_iter().filter(|r| r.0 < cut).collect();
        assert!(incomplete_days(&tz, &part, d(24), cut).is_empty());
        assert_eq!(incomplete_days(&tz, &part[1..], d(24), cut), vec![d(24)]);
    }

    #[test]
    fn now_price() {
        let rows = vec![(0, 1.0), (900_000, 2.0)];
        assert_eq!(infer_interval(&rows), 900_000);
        assert_eq!(price_at(&rows, 900_000, 1_000_000), Some(2.0));
        assert_eq!(price_at(&rows, 900_000, 2_000_000), None);
    }

    fn q(prices: &[f64]) -> Vec<(i64, f64, i64)> {
        prices
            .iter()
            .enumerate()
            .map(|(i, p)| (i as i64 * 900_000, *p, 900_000))
            .collect()
    }

    #[test]
    fn cheapest_consecutive() {
        let rows = q(&[5.0, 1.0, 9.0, 2.0, 2.0, 3.0, 0.0, 8.0]);
        // 30 minutes: 2+2 (avg 2) beats 1+9, 3+0 (1.5) wins
        let w = cheapest(&rows, 1_800_000, true).unwrap();
        assert_eq!(w.iter().map(|r| r.1).collect::<Vec<_>>(), vec![3.0, 0.0]);
        // A partial interval rounds up to the whole interval
        let w = cheapest(&rows, 1_000_000, true).unwrap();
        assert_eq!(w.len(), 2);
        // Ties go to the earliest window
        let w = cheapest(&q(&[1.0, 1.0, 1.0]), 900_000, true).unwrap();
        assert_eq!(w[0].0, 0);
        assert!(cheapest(&rows, 3 * 3_600_000, true).is_none());
        assert!(cheapest(&rows, 0, true).is_none());
    }

    #[test]
    fn cheapest_consecutive_skips_gaps_and_mixed_resolution() {
        let mut rows = q(&[1.0, 1.0]);
        rows.push((3_600_000, 0.0, 900_000)); // after a 30 minute gap
        assert_eq!(cheapest(&rows, 1_800_000, true).unwrap()[0].0, 0);
        // An hourly interval next to 15-minute intervals counts with its full length
        let rows = vec![
            (0, 10.0, 3_600_000),
            (3_600_000, 0.0, 900_000),
            (4_500_000, 0.0, 900_000),
        ];
        let w = cheapest(&rows, 3_600_000, true).unwrap();
        assert_eq!(w.len(), 1);
        assert_eq!(w[0].1, 10.0);
        let w = cheapest(&rows, 1_800_000, true).unwrap();
        assert_eq!(
            w.iter().map(|r| r.0).collect::<Vec<_>>(),
            vec![3_600_000, 4_500_000]
        );
    }

    #[test]
    fn cheapest_separate() {
        let rows = q(&[5.0, 1.0, 9.0, 2.0, 2.0, 3.0, 0.0, 8.0]);
        let w = cheapest(&rows, 3_600_000, false).unwrap();
        assert_eq!(
            w.iter().map(|r| r.1).collect::<Vec<_>>(),
            vec![1.0, 2.0, 2.0, 0.0]
        );
        assert_eq!(runs(&w).len(), 3);
        assert_eq!(weighted_avg(&w), Some(1.25));
        assert!(cheapest(&rows, 3 * 3_600_000, false).is_none());
    }
}
