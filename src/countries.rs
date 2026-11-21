//! Static definition of supported countries and bidding zones.
//!
//! `cty` is the key used for country level rows in the `generation` and `load`
//! tables. It is kept identical to spotweb 1.x so imported history lines up.

use chrono_tz::Tz;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Area {
    /// Short name, used in urls and in the `spotprice` table (`SE1`, `DE-LU`)
    pub name: &'static str,
    /// Identifier used for area level rows in `generation`/`load` (`BZN|SE1`)
    pub id: &'static str,
    /// Human readable name
    pub long: &'static str,
    /// ENTSO-e EIC code
    #[serde(skip)]
    pub eic: &'static str,
    /// Color index used by the UI
    pub color: u8,
}

#[derive(Debug, Clone, Serialize)]
pub struct Country {
    pub id: &'static str,
    pub name: &'static str,
    pub cty: &'static str,
    /// Current market time unit / preferred resolution (ISO 8601 duration)
    pub interval: &'static str,
    /// IANA time zone used for "today", day and month grouping
    pub tz: &'static str,
    pub areas: &'static [Area],
}

impl Country {
    pub fn timezone(&self) -> Tz {
        self.tz.parse().unwrap_or(chrono_tz::Europe::Stockholm)
    }
    pub fn area(&self, name: &str) -> Option<&'static Area> {
        self.areas
            .iter()
            .find(|a| a.name.eq_ignore_ascii_case(name))
    }
}

macro_rules! area {
    ($name:expr, $id:expr, $long:expr, $eic:expr, $color:expr) => {
        Area {
            name: $name,
            id: $id,
            long: $long,
            eic: $eic,
            color: $color,
        }
    };
}

pub static COUNTRIES: &[Country] = &[
    Country {
        id: "sv",
        name: "Sverige",
        cty: "Sweden (SE)",
        interval: "PT15M",
        tz: "Europe/Stockholm",
        areas: &[
            area!("SE1", "BZN|SE1", "Norra Sverige", "10Y1001A1001A44P", 1),
            area!(
                "SE2",
                "BZN|SE2",
                "Norra Mellansverige",
                "10Y1001A1001A45N",
                2
            ),
            area!(
                "SE3",
                "BZN|SE3",
                "Södra Mellansverige",
                "10Y1001A1001A46L",
                3
            ),
            area!("SE4", "BZN|SE4", "Södra Sverige", "10Y1001A1001A47J", 4),
        ],
    },
    Country {
        id: "no",
        name: "Norge",
        cty: "Norway (NO)",
        interval: "PT15M",
        tz: "Europe/Oslo",
        areas: &[
            area!("NO1", "IBA|NO1", "Oslo", "10YNO-1--------2", 1),
            area!("NO2", "IBA|NO2", "Kristiansand", "10YNO-2--------T", 2),
            area!("NO3", "IBA|NO3", "Molde", "10YNO-3--------J", 3),
            area!("NO4", "IBA|NO4", "Tromsø", "10YNO-4--------9", 4),
            area!("NO5", "IBA|NO5", "Bergen", "10Y1001A1001A48H", 5),
        ],
    },
    Country {
        id: "fi",
        name: "Finland",
        cty: "Finland (FI)",
        interval: "PT15M",
        tz: "Europe/Helsinki",
        areas: &[area!("FI", "FI", "Suomi", "10YFI-1--------U", 1)],
    },
    Country {
        id: "dk",
        name: "Danmark",
        cty: "Denmark (DK)",
        interval: "PT15M",
        tz: "Europe/Copenhagen",
        areas: &[
            area!("DK1", "IBA|DK1", "Jylland", "10YDK-1--------W", 1),
            area!("DK2", "IBA|DK2", "Sjaelland", "10YDK-2--------M", 2),
        ],
    },
    Country {
        id: "ee",
        name: "Eesti",
        cty: "Estonia (EE)",
        interval: "PT15M",
        tz: "Europe/Tallinn",
        areas: &[area!("EE", "BZN|EE", "Eesti", "10Y1001A1001A39I", 1)],
    },
    Country {
        id: "lv",
        name: "Latvija",
        cty: "Latvia (LV)",
        interval: "PT15M",
        tz: "Europe/Riga",
        areas: &[area!("LV", "BZN|LV", "Latvija", "10YLV-1001A00074", 1)],
    },
    Country {
        id: "lt",
        name: "Lietuva",
        cty: "Lithuania (LT)",
        interval: "PT15M",
        tz: "Europe/Vilnius",
        areas: &[area!("LT", "BZN|LT", "Lietuva", "10YLT-1001A0008Q", 1)],
    },
    Country {
        id: "de",
        name: "Deutschland",
        cty: "Germany (DE)",
        interval: "PT15M",
        tz: "Europe/Berlin",
        areas: &[area!(
            "DE-LU",
            "BZN|DE-LU",
            "Deutschland",
            "10Y1001A1001A82H",
            1
        )],
    },
    Country {
        id: "at",
        name: "Österreich",
        cty: "Austria (AT)",
        interval: "PT60M",
        tz: "Europe/Vienna",
        areas: &[area!("AT", "BZN|AT", "Österreich", "10YAT-APG------L", 1)],
    },
    Country {
        id: "be",
        name: "Belgium",
        cty: "Belgium (BE)",
        interval: "PT15M",
        tz: "Europe/Brussels",
        areas: &[area!("BE", "BZN|BE", "Belgium", "10YBE----------2", 1)],
    },
    Country {
        id: "nl",
        name: "Nederland",
        cty: "Netherlands (NL)",
        interval: "PT15M",
        tz: "Europe/Amsterdam",
        areas: &[area!("NL", "BZN|NL", "Nederland", "10YNL----------L", 1)],
    },
    Country {
        id: "ch",
        name: "Switzerland",
        cty: "Switzerland (CH)",
        interval: "PT60M",
        tz: "Europe/Zurich",
        areas: &[area!("CH", "BZN|CH", "Switzerland", "10YCH-SWISSGRIDZ", 1)],
    },
    Country {
        id: "cz",
        name: "Česko",
        cty: "Czechia (CZ)",
        interval: "PT15M",
        tz: "Europe/Prague",
        areas: &[area!("CZ", "BZN|CZ", "Česko", "10YCZ-CEPS-----N", 1)],
    },
    Country {
        id: "es",
        name: "Spain",
        cty: "Spain (ES)",
        interval: "PT15M",
        tz: "Europe/Madrid",
        areas: &[area!("ES", "BZN|ES", "Spain", "10YES-REE------0", 1)],
    },
    Country {
        id: "fr",
        name: "France",
        cty: "France (FR)",
        interval: "PT15M",
        tz: "Europe/Paris",
        areas: &[area!("FR", "BZN|FR", "France", "10YFR-RTE------C", 1)],
    },
    Country {
        id: "pl",
        name: "Poland",
        cty: "Poland (PL)",
        interval: "PT15M",
        tz: "Europe/Warsaw",
        areas: &[area!("PL", "BZN|PL", "Poland", "10YPL-AREA-----S", 1)],
    },
    Country {
        id: "pt",
        name: "Portugal",
        cty: "Portugal (PT)",
        interval: "PT15M",
        tz: "Europe/Lisbon",
        areas: &[area!("PT", "BZN|PT", "Portugal", "10YPT-REN------W", 1)],
    },
];

pub fn country(id: &str) -> Option<&'static Country> {
    COUNTRIES.iter().find(|c| c.id == id)
}

/// Find the country an area (by short name, e.g. `SE1`) belongs to.
pub fn find_area(name: &str) -> Option<(&'static Country, &'static Area)> {
    COUNTRIES.iter().find_map(|c| c.area(name).map(|a| (c, a)))
}

/// Resolve any identifier used by 1.x (`SE1`, `BZN|SE1`, `CTA|SE`, `sv`, `Sweden (SE)`)
/// to the owning country. Mirrors `intervalForArea` of spotweb 1.x.
pub fn country_for_identifier(ident: &str) -> Option<&'static Country> {
    let norm = ident.trim().to_uppercase();
    let suffix = norm.split('|').nth(1).unwrap_or(&norm).to_string();
    for c in COUNTRIES {
        let cta = format!(
            "CTA|{}",
            c.cty.trim_end_matches(')').rsplit('(').next().unwrap_or("")
        );
        if norm == c.id.to_uppercase() || norm == c.cty.to_uppercase() || norm == cta {
            return Some(c);
        }
        for a in c.areas {
            if norm == a.name || norm == a.id.to_uppercase() || suffix == a.name {
                return Some(c);
            }
        }
    }
    None
}

pub fn interval_for_identifier(ident: &str) -> Option<&'static str> {
    country_for_identifier(ident).map(|c| c.interval)
}

/// Language / default currency mapping, mirrors `config/preferences.js` in 1.x
pub fn default_currency(lang: &str) -> &'static str {
    match lang {
        "sv" => "öre",
        "no" => "NOK",
        "dk" => "DKK",
        "pl" => "PLN",
        _ => "EUR",
    }
}

pub fn default_decimals(currency: &str) -> usize {
    match currency {
        "öre" => 1,
        "EUR" => 3,
        _ => 2,
    }
}

pub const LANGUAGES: &[&str] = &["sv", "fi", "no", "dk", "de", "en", "nl", "fr", "es"];

/// Language a url stands for through its first path segment (`/sv/SE3` is Swedish).
/// `None` for paths that carry no language, like `/`, `/help` or `/pl/PL`.
pub fn lang_from_path(path: &str) -> Option<&'static str> {
    let p = path.trim_start_matches('/');
    let first = p.split('/').next().unwrap_or("");
    Some(match first {
        "sv" => "sv",
        "be" | "nl" => "nl",
        "no" => "no",
        "fi" => "fi",
        "dk" => "dk",
        "es" => "es",
        "fr" => "fr",
        "de" | "at" | "ch" => "de",
        _ => return None,
    })
}

/// BCP 47 tag for one of our language codes, for `<html lang>` and `hreflang`
pub fn lang_tag(lang: &str) -> &str {
    match lang {
        "dk" => "da",
        l => l,
    }
}

/// Our language code for the primary subtag of a browser language (`da`, `nb`, `sv`, ...)
pub fn lang_from_tag(tag: &str) -> Option<&'static str> {
    let primary = tag.trim().split(['-', '_']).next()?.to_ascii_lowercase();
    match primary.as_str() {
        "da" | "dk" => Some("dk"),
        "nb" | "nn" | "no" => Some("no"),
        p => LANGUAGES.iter().find(|l| **l == p).copied(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identifiers_resolve() {
        assert_eq!(country_for_identifier("SE1").unwrap().id, "sv");
        assert_eq!(country_for_identifier("BZN|SE1").unwrap().id, "sv");
        assert_eq!(country_for_identifier("CTA|SE").unwrap().id, "sv");
        assert_eq!(country_for_identifier("Sweden (SE)").unwrap().id, "sv");
        assert_eq!(country_for_identifier("de-lu").unwrap().id, "de");
        assert_eq!(interval_for_identifier("AT"), Some("PT60M"));
        assert!(country_for_identifier("XX").is_none());
    }

    #[test]
    fn timezones_parse() {
        for c in COUNTRIES {
            assert!(c.tz.parse::<Tz>().is_ok(), "{}", c.tz);
        }
    }

    #[test]
    fn lang_guess() {
        assert_eq!(lang_from_path("/sv/SE1"), Some("sv"));
        assert_eq!(lang_from_path("/at"), Some("de"));
        assert_eq!(lang_from_path("/be"), Some("nl"));
        assert_eq!(lang_from_path("/nl/NL"), Some("nl"));
        assert_eq!(lang_from_path("/"), None);
        assert_eq!(lang_from_path("/pl/PL"), None);
        assert_eq!(lang_from_tag("da-DK"), Some("dk"));
        assert_eq!(lang_from_tag("nb"), Some("no"));
        assert_eq!(lang_from_tag("sv-SE"), Some("sv"));
        assert_eq!(lang_from_tag("pl"), None);
        assert_eq!(lang_tag("dk"), "da");
    }
}
