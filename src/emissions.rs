//! Values derived from the production mix of an area: share of renewable and fossil free
//! production and an estimated carbon intensity.
//!
//! Everything is about the production *in* the area, not about the electricity used there:
//! imports and exports are not counted. The carbon intensity uses fixed life-cycle factors per
//! production type (median values from IPCC AR5 WG3 Annex III where it has one, rounded), so it
//! is an estimate, not a measurement.

use serde::Serialize;

/// How a production type (ENTSO-e `psrType`) is counted
#[derive(Debug, Clone, Copy, PartialEq)]
struct Kind {
    renewable: bool,
    /// Renewable or nuclear. Not fossil, and not waste or unknown sources.
    fossil_free: bool,
    /// Life-cycle emissions, g CO2-eq per kWh
    co2: f64,
}

const RENEWABLE: fn(f64) -> Kind = |co2| Kind {
    renewable: true,
    fossil_free: true,
    co2,
};
const NUCLEAR: fn(f64) -> Kind = |co2| Kind {
    renewable: false,
    fossil_free: true,
    co2,
};
const OTHER: fn(f64) -> Kind = |co2| Kind {
    renewable: false,
    fossil_free: false,
    co2,
};

/// `None` for types that are left out of the shares and the intensity: storage only gives back
/// energy taken from the grid earlier, so it is neither renewable nor fossil free of its own,
/// and its emissions are those of whatever charged it.
fn kind_of(psr: &str) -> Option<Kind> {
    Some(match psr {
        "B01" => RENEWABLE(230.0),        // Biomass
        "B02" => OTHER(1050.0),           // Brown coal/lignite
        "B03" => OTHER(820.0),            // Coal-derived gas
        "B04" => OTHER(490.0),            // Gas
        "B05" => OTHER(820.0),            // Hard coal
        "B06" => OTHER(650.0),            // Oil
        "B07" => OTHER(1000.0),           // Oil shale
        "B08" => OTHER(1000.0),           // Peat
        "B09" => RENEWABLE(38.0),         // Geothermal
        "B11" | "B12" => RENEWABLE(24.0), // Run-of-river, reservoir
        "B13" => RENEWABLE(17.0),         // Marine
        "B14" => NUCLEAR(12.0),           // Nuclear
        "B15" => RENEWABLE(30.0),         // Other renewable
        "B16" => RENEWABLE(45.0),         // Solar
        "B17" => OTHER(600.0),            // Waste, partly fossil
        "B18" => RENEWABLE(12.0),         // Wind offshore
        "B19" => RENEWABLE(11.0),         // Wind onshore
        // Hydro pumped storage and other energy storage
        "B10" | "B25" => return None,
        // Other and unknown types: neither, with a high factor
        _ => OTHER(700.0),
    })
}

/// Derived values for one interval of production
#[derive(Debug, Clone, Copy, Default, PartialEq, Serialize)]
pub struct Derived {
    /// Share of renewable production, percent
    pub renewable: Option<f64>,
    /// Share of renewable and nuclear production, percent
    pub fossil_free: Option<f64>,
    /// Estimated carbon intensity, g CO2-eq/kWh
    pub co2: Option<f64>,
}

/// From production per `psrType` (MW, consumption already left out). Rounded to whole percent
/// and gram. All `None` without production.
pub fn derive<'a>(mix: impl IntoIterator<Item = (&'a str, f64)>) -> Derived {
    let (mut total, mut renewable, mut fossil_free, mut grams) = (0.0, 0.0, 0.0, 0.0);
    for (psr, mw) in mix {
        let Some(k) = kind_of(psr) else { continue };
        if mw.is_nan() || mw <= 0.0 {
            continue;
        }
        total += mw;
        if k.renewable {
            renewable += mw;
        }
        if k.fossil_free {
            fossil_free += mw;
        }
        grams += mw * k.co2;
    }
    if total <= 0.0 {
        return Derived::default();
    }
    Derived {
        renewable: Some((renewable / total * 100.0).round()),
        fossil_free: Some((fossil_free / total * 100.0).round()),
        co2: Some((grams / total).round()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shares_and_intensity() {
        // 50 % wind, 25 % nuclear, 25 % gas
        let d = derive([("B19", 500.0), ("B14", 250.0), ("B04", 250.0)]);
        assert_eq!(d.renewable, Some(50.0));
        assert_eq!(d.fossil_free, Some(75.0));
        // 0.5 * 11 + 0.25 * 12 + 0.25 * 490 = 131
        assert_eq!(d.co2, Some(131.0));
        // Waste is neither renewable nor fossil free
        let w = derive([("B17", 100.0), ("B12", 100.0)]);
        assert_eq!((w.renewable, w.fossil_free), (Some(50.0), Some(50.0)));
    }

    #[test]
    fn storage_and_negative_values_are_left_out() {
        let d = derive([
            ("B12", 100.0),
            ("B25", 900.0),
            ("B10", 500.0),
            ("B05", -50.0),
        ]);
        assert_eq!(d.renewable, Some(100.0));
        assert_eq!(d.co2, Some(24.0));
        assert_eq!(derive([]), Derived::default());
        assert_eq!(derive([("B25", 10.0)]), Derived::default());
        assert_eq!(derive([("B10", 10.0)]), Derived::default());
    }
}
