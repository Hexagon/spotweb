//! Cross-border physical flows (ENTSO-e A11) between bidding zones.
//!
//! Flows are stored per direction (`from_area` -> `to_area`). [`latest`] turns the
//! stored rows into one net value per border for the map on the start page.

use std::collections::BTreeMap;

use serde::Serialize;

use crate::countries::COUNTRIES;

/// A zone that is not one of ours but has flows to one of ours. Shown on the map without prices.
pub struct Neighbour {
    pub name: &'static str,
    pub long: &'static str,
    pub eic: &'static str,
}

pub static NEIGHBOURS: &[Neighbour] = &[
    Neighbour {
        name: "GB",
        long: "Great Britain",
        eic: "10YGB----------A",
    },
    Neighbour {
        name: "IT",
        long: "Italia (Nord)",
        eic: "10Y1001A1001A73I",
    },
];

/// Interconnected zones. At least one side of every border is one of our areas.
pub static BORDERS: &[(&str, &str)] = &[
    ("SE1", "SE2"),
    ("SE1", "FI"),
    ("SE1", "NO4"),
    ("SE2", "SE3"),
    ("SE2", "NO3"),
    ("SE2", "NO4"),
    ("SE3", "SE4"),
    ("SE3", "NO1"),
    ("SE3", "DK1"),
    ("SE3", "FI"),
    ("SE4", "DK2"),
    ("SE4", "DE-LU"),
    ("SE4", "PL"),
    ("SE4", "LT"),
    ("NO1", "NO2"),
    ("NO1", "NO3"),
    ("NO1", "NO5"),
    ("NO2", "NO5"),
    ("NO3", "NO4"),
    ("NO3", "NO5"),
    ("NO4", "FI"),
    ("NO2", "DK1"),
    ("NO2", "DE-LU"),
    ("NO2", "NL"),
    ("NO2", "GB"),
    ("DK1", "DK2"),
    ("DK1", "DE-LU"),
    ("DK1", "NL"),
    ("DK1", "GB"),
    ("DK2", "DE-LU"),
    ("FI", "EE"),
    ("EE", "LV"),
    ("LV", "LT"),
    ("DE-LU", "AT"),
    ("DE-LU", "CH"),
    ("DE-LU", "FR"),
    ("DE-LU", "PL"),
    ("DE-LU", "BE"),
    ("DE-LU", "NL"),
    ("DE-LU", "CZ"),
    ("AT", "CH"),
    ("AT", "CZ"),
    ("AT", "IT"),
    ("BE", "FR"),
    ("BE", "NL"),
    ("BE", "GB"),
    ("NL", "GB"),
    ("CH", "FR"),
    ("CH", "IT"),
    ("ES", "FR"),
    ("ES", "PT"),
    ("FR", "IT"),
    ("FR", "GB"),
    ("PL", "CZ"),
    ("PL", "LT"),
];

/// EIC code of one of our areas or a neighbour
pub fn eic(name: &str) -> Option<&'static str> {
    COUNTRIES
        .iter()
        .flat_map(|c| c.areas)
        .find(|a| a.name == name)
        .map(|a| a.eic)
        .or_else(|| NEIGHBOURS.iter().find(|n| n.name == name).map(|n| n.eic))
}

/// Every direction of every border: `(from, to)`
#[cfg(test)]
pub fn directions() -> impl Iterator<Item = (&'static str, &'static str)> {
    BORDERS.iter().flat_map(|&(a, b)| [(a, b), (b, a)])
}

/// A stored flow value: `(from, to, period, interval ms, MW)`
pub type FlowRow = (String, String, i64, i64, f64);

/// Net flow over one border at its latest stored time
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct BorderFlow {
    /// The side that exports (`value` >= 0)
    pub from: String,
    pub to: String,
    /// Net MW from `from` to `to`
    pub value: f64,
    /// Start of the interval the value is for (ms)
    pub period: i64,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct Flows {
    pub borders: Vec<BorderFlow>,
    /// End of the newest interval used (ms), `None` without data
    pub updated: Option<i64>,
}

/// Value of a direction at time `t`, preferring the finest resolution covering it
fn value_at(rows: &[&FlowRow], t: i64) -> Option<f64> {
    rows.iter()
        .filter(|r| r.2 <= t && t < r.2 + r.3)
        .min_by_key(|r| r.3)
        .map(|r| r.4)
}

/// Net flow per border at the latest time stored for that border. A direction without
/// a value for that time counts as 0 (ENTSO-e often leaves out the non-flowing side).
pub fn latest(rows: &[FlowRow]) -> Flows {
    let mut by_dir: BTreeMap<(&str, &str), Vec<&FlowRow>> = BTreeMap::new();
    for r in rows {
        by_dir
            .entry((r.0.as_str(), r.1.as_str()))
            .or_default()
            .push(r);
    }
    let mut out = Flows::default();
    for &(a, b) in BORDERS {
        let ab = by_dir.get(&(a, b)).map(Vec::as_slice).unwrap_or(&[]);
        let ba = by_dir.get(&(b, a)).map(Vec::as_slice).unwrap_or(&[]);
        let Some(t) = ab.iter().chain(ba).map(|r| r.2).max() else {
            continue;
        };
        let end = ab
            .iter()
            .chain(ba)
            .filter(|r| r.2 == t)
            .map(|r| r.2 + r.3)
            .min()
            .unwrap_or(t);
        let net = value_at(ab, t).unwrap_or(0.0) - value_at(ba, t).unwrap_or(0.0);
        let (from, to, value) = if net >= 0.0 {
            (a, b, net)
        } else {
            (b, a, -net)
        };
        out.borders.push(BorderFlow {
            from: from.into(),
            to: to.into(),
            value: value.round(),
            period: t,
        });
        out.updated = Some(out.updated.map_or(end, |u: i64| u.max(end)));
    }
    out
}

/// Net flow out of a zone or country per hour and neighbour, see [`area_series`]
#[derive(Debug, Clone, Default, Serialize)]
pub struct AreaFlows {
    /// Start of each hour (ms)
    pub times: Vec<i64>,
    /// Per neighbour (a zone, or a country id for countries), the average net export in MW
    /// for each hour in `times`: positive is export, negative import, `None` without data
    pub series: Vec<NeighbourSeries>,
    /// Sum over the neighbours with data, `None` when none has data
    pub net: Vec<Option<f64>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct NeighbourSeries {
    pub name: String,
    pub values: Vec<Option<f64>>,
}

/// Stored values of one direction, by interval length and then start
type DirIndex = BTreeMap<i64, BTreeMap<i64, f64>>;

fn index(rows: &[FlowRow]) -> BTreeMap<(&str, &str), DirIndex> {
    let mut out: BTreeMap<(&str, &str), DirIndex> = BTreeMap::new();
    for r in rows {
        out.entry((r.0.as_str(), r.1.as_str()))
            .or_default()
            .entry(r.3)
            .or_default()
            .insert(r.2, r.4);
    }
    out
}

/// Like [`value_at`] on an index: the finest stored interval covering `t`
fn indexed_at(dir: Option<&DirIndex>, t: i64) -> Option<f64> {
    dir?.iter().find_map(|(iv, by_start)| {
        by_start
            .range(..=t)
            .next_back()
            .filter(|(start, _)| t < *start + iv)
            .map(|(_, v)| *v)
    })
}

/// Net flow from `a` to `b` at `t`. A missing direction counts as 0 as long as the other
/// direction has a value (see [`latest`]).
fn net_at(ab: Option<&DirIndex>, ba: Option<&DirIndex>, t: i64) -> Option<f64> {
    match (indexed_at(ab, t), indexed_at(ba, t)) {
        (None, None) => None,
        (x, y) => Some(x.unwrap_or(0.0) - y.unwrap_or(0.0)),
    }
}

const QUARTER_MS: i64 = 900_000;
const HOUR_MS: i64 = 3_600_000;

/// Hourly average net export from the zones `inside` to every border neighbour outside, for
/// the hours starting in `[from, to)`. `group` names the neighbour a zone outside belongs to
/// (the zone itself on an area page, its country on a country page); borders to the same
/// group are added up. Hours are sampled every 15 minutes, so 15 and 60 minute data mix.
pub fn area_series(
    rows: &[FlowRow],
    inside: impl Fn(&str) -> bool,
    group: impl Fn(&str) -> String,
    from: i64,
    to: i64,
) -> AreaFlows {
    let idx = index(rows);
    let start = from - from.rem_euclid(HOUR_MS);
    let times: Vec<i64> = (start..to).step_by(HOUR_MS as usize).collect();
    // Neighbour -> borders as (inside zone, outside zone)
    let mut groups: BTreeMap<String, Vec<(&str, &str)>> = BTreeMap::new();
    for &(a, b) in BORDERS {
        match (inside(a), inside(b)) {
            (true, false) => groups.entry(group(b)).or_default().push((a, b)),
            (false, true) => groups.entry(group(a)).or_default().push((b, a)),
            _ => {}
        }
    }
    let mut net = vec![None; times.len()];
    let mut series = vec![];
    for (name, borders) in groups {
        let values: Vec<Option<f64>> = times
            .iter()
            .map(|&h| {
                let mut sum = 0.0;
                let mut any = false;
                for &(a, b) in &borders {
                    let ab = idx.get(&(a, b));
                    let ba = idx.get(&(b, a));
                    let samples: Vec<f64> = (0..4)
                        .filter_map(|q| net_at(ab, ba, h + q * QUARTER_MS))
                        .collect();
                    if !samples.is_empty() {
                        any = true;
                        sum += samples.iter().sum::<f64>() / samples.len() as f64;
                    }
                }
                any.then(|| sum.round())
            })
            .collect();
        if values.iter().all(Option::is_none) {
            continue;
        }
        for (n, v) in net.iter_mut().zip(&values) {
            if let Some(v) = v {
                *n = Some(n.unwrap_or(0.0) + v);
            }
        }
        series.push(NeighbourSeries { name, values });
    }
    AreaFlows { times, series, net }
}

/// Hourly net flow per border, see [`border_series`]
#[derive(Debug, Clone, Default, Serialize)]
pub struct BorderSeries {
    /// Start of each hour (ms)
    pub times: Vec<i64>,
    /// Borders with data, in [`BORDERS`] order
    pub borders: Vec<BorderHours>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BorderHours {
    pub a: String,
    pub b: String,
    /// Average net MW from `a` to `b` per hour (negative is `b` to `a`), `None` without data
    pub values: Vec<Option<f64>>,
}

/// Hourly average net flow over every border for the hours starting in `[from, to)`
pub fn border_series(rows: &[FlowRow], from: i64, to: i64) -> BorderSeries {
    let idx = index(rows);
    let start = from - from.rem_euclid(HOUR_MS);
    let times: Vec<i64> = (start..to).step_by(HOUR_MS as usize).collect();
    let borders = BORDERS
        .iter()
        .filter_map(|&(a, b)| {
            let (ab, ba) = (idx.get(&(a, b)), idx.get(&(b, a)));
            let values: Vec<Option<f64>> = times
                .iter()
                .map(|&h| {
                    let s: Vec<f64> = (0..4)
                        .filter_map(|q| net_at(ab, ba, h + q * QUARTER_MS))
                        .collect();
                    (!s.is_empty()).then(|| (s.iter().sum::<f64>() / s.len() as f64).round())
                })
                .collect();
            values.iter().any(Option::is_some).then(|| BorderHours {
                a: a.into(),
                b: b.into(),
                values,
            })
        })
        .collect();
    BorderSeries { times, borders }
}

/// The country id of one of our zones, or the zone name for a neighbour that is not ours
pub fn country_of(zone: &str) -> String {
    COUNTRIES
        .iter()
        .find(|c| c.areas.iter().any(|a| a.name == zone))
        .map_or_else(|| zone.to_string(), |c| c.id.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_border_has_eic_and_one_of_our_areas() {
        let ours = |n: &str| COUNTRIES.iter().flat_map(|c| c.areas).any(|a| a.name == n);
        for (a, b) in BORDERS {
            assert!(eic(a).is_some(), "{a}");
            assert!(eic(b).is_some(), "{b}");
            assert!(ours(a) || ours(b), "{a}-{b}");
            assert_ne!(a, b);
        }
        let mut seen = std::collections::HashSet::new();
        for d in directions() {
            assert!(seen.insert(d), "duplicate {d:?}");
        }
    }

    #[test]
    fn net_flow_per_border() {
        const H: i64 = 3_600_000;
        const Q: i64 = 900_000;
        let r =
            |f: &str, t: &str, p: i64, iv: i64, v: f64| (f.to_string(), t.to_string(), p, iv, v);
        let rows = vec![
            // SE3 -> FI hourly, FI -> SE3 at 15 minutes for the latest hour
            r("SE3", "FI", 0, H, 800.0),
            r("SE3", "FI", H, H, 1000.0),
            r("FI", "SE3", H, Q, 50.0),
            r("FI", "SE3", H + Q, Q, 200.0),
            // NO1 -> SE3 only
            r("NO1", "SE3", 0, H, 300.0),
            // Mostly DK1 -> SE3, net import to DK1
            r("DK1", "SE3", H, H, 100.0),
            r("SE3", "DK1", H, H, 400.0),
        ];
        let f = latest(&rows);
        let get = |a: &str, b: &str| {
            f.borders
                .iter()
                .find(|x| (x.from == a && x.to == b) || (x.from == b && x.to == a))
                .cloned()
                .unwrap()
        };
        // Latest time is H + Q, SE3 -> FI hourly covers it
        let fi = get("SE3", "FI");
        assert_eq!(
            (fi.from.as_str(), fi.value, fi.period),
            ("SE3", 800.0, H + Q)
        );
        let no = get("NO1", "SE3");
        assert_eq!(
            (no.from.as_str(), no.to.as_str(), no.value),
            ("NO1", "SE3", 300.0)
        );
        let dk = get("SE3", "DK1");
        assert_eq!((dk.from.as_str(), dk.value), ("SE3", 300.0));
        assert_eq!(f.borders.len(), 3);
        assert_eq!(f.updated, Some(2 * H));
        assert!(latest(&[]).updated.is_none());
    }

    #[test]
    fn hourly_series_per_neighbour() {
        const H: i64 = 3_600_000;
        const Q: i64 = 900_000;
        let r =
            |f: &str, t: &str, p: i64, iv: i64, v: f64| (f.to_string(), t.to_string(), p, iv, v);
        let mut rows = vec![
            // SE3 -> FI hourly in hour 0, at 15 minutes in hour 1
            r("SE3", "FI", 0, H, 800.0),
            r("FI", "SE3", 0, H, 0.0),
            // NO1 -> SE3 in hour 0 only
            r("NO1", "SE3", 0, H, 300.0),
            // Inside SE: not a neighbour of the country
            r("SE3", "SE4", 0, H, 1000.0),
        ];
        for (q, v) in [100.0, 200.0, 300.0, 400.0].iter().enumerate() {
            rows.push(r("SE3", "FI", H + q as i64 * Q, Q, *v));
        }
        let f = area_series(&rows, |z| z == "SE3", str::to_string, 0, 2 * H);
        assert_eq!(f.times, vec![0, H]);
        let get = |n: &str| {
            f.series
                .iter()
                .find(|s| s.name == n)
                .unwrap()
                .values
                .clone()
        };
        assert_eq!(get("FI"), vec![Some(800.0), Some(250.0)]);
        assert_eq!(get("NO1"), vec![Some(-300.0), None]);
        assert_eq!(get("SE4"), vec![Some(1000.0), None]);
        assert_eq!(f.net, vec![Some(1500.0), Some(250.0)]);
        // Borders without data are left out
        assert!(f.series.iter().all(|s| s.name != "DK1"));

        let sv = area_series(&rows, |z| country_of(z) == "sv", country_of, 0, 2 * H);
        let names: Vec<_> = sv.series.iter().map(|s| s.name.as_str()).collect();
        assert_eq!(names, vec!["fi", "no"]);
        assert_eq!(sv.net, vec![Some(500.0), Some(250.0)]);
        assert_eq!(country_of("GB"), "GB");
        assert_eq!(country_of("DE-LU"), "de");
    }

    #[test]
    fn hourly_series_per_border() {
        const H: i64 = 3_600_000;
        let r =
            |f: &str, t: &str, p: i64, iv: i64, v: f64| (f.to_string(), t.to_string(), p, iv, v);
        let rows = vec![
            r("SE3", "FI", 0, H, 800.0),
            r("FI", "SE3", H, H, 300.0),
            r("NO1", "SE3", H, H, 100.0),
        ];
        let f = border_series(&rows, 0, 3 * H);
        assert_eq!(f.times, vec![0, H, 2 * H]);
        assert_eq!(f.borders.len(), 2);
        let fi = f.borders.iter().find(|x| x.b == "FI").unwrap();
        assert_eq!(
            (fi.a.as_str(), fi.values.clone()),
            ("SE3", vec![Some(800.0), Some(-300.0), None])
        );
        let no = f.borders.iter().find(|x| x.b == "NO1").unwrap();
        assert_eq!(
            (no.a.as_str(), no.values.clone()),
            ("SE3", vec![None, Some(-100.0), None])
        );
    }
}
