//! Hydro reservoir filling (ENTSO-e A72): energy stored per week, compared with the same week
//! of earlier years.
//!
//! ENTSO-e reports the stored energy in MWh, not a filling percentage, since the capacity of
//! the reservoirs is not published there. [`Overview::share_of_max`] relates the latest value
//! to the highest one stored, which comes close to a filling degree but is not the same.

use std::collections::BTreeMap;

use jiff::tz::TimeZone;
use jiff::Timestamp;
use serde::Serialize;

/// ISO year and week a stored week belongs to. ENTSO-e weeks start Monday 00:00 local time,
/// which is Sunday evening in UTC, so the middle of the week decides.
pub fn iso_week(period: i64) -> Option<(i16, i8)> {
    let mid = Timestamp::from_millisecond(period + 3 * 24 * 3_600_000).ok()?;
    let d = mid.to_zoned(TimeZone::UTC).date().iso_week_date();
    Some((d.year(), d.week()))
}

/// Values in GWh per (ISO year, week), summed over `areas`. A week counts only when every area
/// that has any data has a value for it, so a country total does not dip when one zone is late.
pub fn weekly(rows: &[(String, i64, f64)]) -> BTreeMap<(i16, i8), f64> {
    let mut per: BTreeMap<(i16, i8), BTreeMap<&str, f64>> = BTreeMap::new();
    let mut areas = std::collections::BTreeSet::new();
    for (area, period, value) in rows {
        if let Some(w) = iso_week(*period) {
            per.entry(w).or_default().insert(area.as_str(), *value);
            areas.insert(area.as_str());
        }
    }
    per.into_iter()
        .filter(|(_, by_area)| by_area.len() == areas.len())
        .map(|(w, by_area)| (w, by_area.values().sum::<f64>() / 1000.0))
        .collect()
}

/// One ISO week for the chart: this year, last year and the spread of the years before
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct WeekRow {
    pub week: i8,
    pub this_year: Option<f64>,
    pub last_year: Option<f64>,
    pub min: Option<f64>,
    pub median: Option<f64>,
    pub max: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Default, PartialEq)]
pub struct Overview {
    /// ISO year and week of the latest value
    pub year: Option<i16>,
    pub week: Option<i8>,
    /// Latest stored energy, GWh
    pub latest: Option<f64>,
    /// Change since the week before, GWh
    pub change: Option<f64>,
    pub last_year: Option<f64>,
    /// Lowest, median and highest value of the same week in the years before this one
    pub min: Option<f64>,
    pub median: Option<f64>,
    pub max: Option<f64>,
    /// First year with data, and how many earlier years the spread is made of
    pub first_year: Option<i16>,
    pub years: usize,
    /// Latest value as a share of the highest value stored, percent
    pub share_of_max: Option<f64>,
    /// Latest minus the median of the same week, percentage points of the highest value stored
    pub vs_median: Option<f64>,
    /// Latest minus the median of the same week, percent of that median
    pub vs_median_pct: Option<f64>,
    /// Weeks from the latest value's week to the current week (normally 1, as a week is
    /// published after it ends), set by [`Overview::at`]
    pub age_weeks: Option<i64>,
    /// The latest value is older than [`STALE_WEEKS`] weeks: the zone (or one zone of the
    /// country) has not reported since. Set by [`Overview::at`].
    pub stale: bool,
    pub weeks: Vec<WeekRow>,
}

/// More weeks than this between the latest value and now mark the overview as stale
pub const STALE_WEEKS: i64 = 2;

/// Monday of an ISO week
fn week_monday(year: i16, week: i8) -> Option<jiff::civil::Date> {
    jiff::civil::ISOWeekDate::new(year, week, jiff::civil::Weekday::Monday)
        .ok()
        .map(|d| d.date())
}

impl Overview {
    /// The overview with its age at `now` (ms): [`Overview::age_weeks`] and [`Overview::stale`]
    pub fn at(mut self, now: i64) -> Self {
        let today = Timestamp::from_millisecond(now)
            .map(|t| t.to_zoned(TimeZone::UTC).date())
            .ok();
        let age = match (self.year, self.week, today) {
            (Some(y), Some(w), Some(t)) => week_monday(y, w).and_then(|m| {
                let iso = t.iso_week_date();
                let this = week_monday(iso.year(), iso.week())?;
                Some(i64::from((this - m).get_days()) / 7)
            }),
            _ => None,
        };
        self.age_weeks = age;
        self.stale = age.is_some_and(|a| a > STALE_WEEKS);
        self
    }
}

fn median(v: &mut [f64]) -> Option<f64> {
    if v.is_empty() {
        return None;
    }
    v.sort_by(|a, b| a.total_cmp(b));
    let n = v.len();
    Some(if n % 2 == 1 {
        v[n / 2]
    } else {
        (v[n / 2 - 1] + v[n / 2]) / 2.0
    })
}

fn round1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

/// Overview of the weekly values from [`weekly`]. Everything relates to the year of the latest value.
pub fn overview(weeks: &BTreeMap<(i16, i8), f64>) -> Overview {
    let Some((&(year, week), &latest)) = weeks.iter().next_back() else {
        return Overview::default();
    };
    // Same week in the years before `year`
    let earlier = |w: i8| -> Vec<f64> {
        weeks
            .iter()
            .filter(|((y, wk), _)| *y < year && *wk == w)
            .map(|(_, v)| *v)
            .collect()
    };
    let spread = |w: i8| {
        let mut v = earlier(w);
        let min = v.iter().copied().reduce(f64::min);
        let max = v.iter().copied().reduce(f64::max);
        (min, median(&mut v), max, v.len())
    };
    let (min, med, max, years) = spread(week);
    let highest = weeks.values().copied().reduce(f64::max);
    let previous = weeks.range(..(year, week)).next_back().map(|(_, v)| *v);
    let rows = (1..=53)
        .map(|w| {
            let (mn, md, mx, _) = spread(w);
            WeekRow {
                week: w,
                this_year: weeks.get(&(year, w)).copied().map(round1),
                last_year: weeks.get(&(year - 1, w)).copied().map(round1),
                min: mn.map(round1),
                median: md.map(round1),
                max: mx.map(round1),
            }
        })
        // Week 53 only exists in some years
        .filter(|r| {
            r.week < 53 || r.this_year.is_some() || r.last_year.is_some() || r.max.is_some()
        })
        .collect();
    let pct = |v: f64| highest.filter(|h| *h > 0.0).map(|h| round1(v / h * 100.0));
    Overview {
        year: Some(year),
        week: Some(week),
        latest: Some(round1(latest)),
        change: previous.map(|p| round1(latest - p)),
        last_year: weeks.get(&(year - 1, week)).copied().map(round1),
        min: min.map(round1),
        median: med.map(round1),
        max: max.map(round1),
        first_year: weeks.keys().next().map(|k| k.0),
        years,
        share_of_max: pct(latest),
        vs_median: med.and_then(|m| pct(latest - m)),
        vs_median_pct: med
            .filter(|m| *m > 0.0)
            .map(|m| round1((latest - m) / m * 100.0)),
        age_weeks: None,
        stale: false,
        weeks: rows,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const WEEK: i64 = 7 * 24 * 3_600_000;

    #[test]
    fn iso_weeks_from_entsoe_periods() {
        // Monday 2024-01-01 00:00 CET is Sunday 23:00 UTC
        let p = jiff::civil::date(2023, 12, 31)
            .at(23, 0, 0, 0)
            .to_zoned(TimeZone::UTC)
            .unwrap()
            .timestamp()
            .as_millisecond();
        assert_eq!(iso_week(p), Some((2024, 1)));
        assert_eq!(iso_week(p + WEEK), Some((2024, 2)));
    }

    #[test]
    fn country_weeks_need_every_area() {
        let p = 1_704_063_600_000; // 2023-12-31T23:00Z, week 1 of 2024
        let rows = vec![
            ("SE1".to_string(), p, 1000.0),
            ("SE2".to_string(), p, 2000.0),
            ("SE1".to_string(), p + WEEK, 1500.0),
        ];
        let w = weekly(&rows);
        assert_eq!(w.get(&(2024, 1)), Some(&3.0));
        assert_eq!(w.get(&(2024, 2)), None);
    }

    #[test]
    fn compared_with_earlier_years() {
        let mut w = BTreeMap::new();
        for (y, v) in [(2021, 10.0), (2022, 20.0), (2023, 40.0), (2024, 30.0)] {
            w.insert((y, 5), v);
            w.insert((y, 4), v - 1.0);
        }
        let o = overview(&w);
        assert_eq!((o.year, o.week), (Some(2024), Some(5)));
        assert_eq!(o.latest, Some(30.0));
        assert_eq!(o.change, Some(1.0));
        assert_eq!(o.last_year, Some(40.0));
        assert_eq!(
            (o.min, o.median, o.max),
            (Some(10.0), Some(20.0), Some(40.0))
        );
        assert_eq!(o.years, 3);
        assert_eq!(o.first_year, Some(2021));
        assert_eq!(o.share_of_max, Some(75.0));
        assert_eq!(o.vs_median, Some(25.0));
        assert_eq!(o.vs_median_pct, Some(50.0));
        // Week 5 of 2024 starts Monday 29 January
        let ms = |y, m, d| {
            jiff::civil::date(y, m, d)
                .at(12, 0, 0, 0)
                .to_zoned(TimeZone::UTC)
                .unwrap()
                .timestamp()
                .as_millisecond()
        };
        let fresh = o.clone().at(ms(2024, 2, 7));
        assert_eq!((fresh.age_weeks, fresh.stale), (Some(1), false));
        let old = o.clone().at(ms(2024, 3, 1));
        assert_eq!((old.age_weeks, old.stale), (Some(4), true));
        let w5 = o.weeks.iter().find(|r| r.week == 5).unwrap();
        assert_eq!((w5.this_year, w5.last_year), (Some(30.0), Some(40.0)));
        assert!(o.weeks.iter().all(|r| r.week != 53));
        assert_eq!(overview(&BTreeMap::new()), Overview::default());
    }
}
