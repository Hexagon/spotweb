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

/// Every direction that is fetched: `(from, to)`
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
}
