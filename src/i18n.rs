//! Translations, embedded from `locales/*.json` (converted 1:1 from 1.x `config/translations`).

use std::collections::HashMap;

use rust_embed::RustEmbed;
use serde_json::Value;

#[derive(RustEmbed)]
#[folder = "locales/"]
struct Locales;

pub struct I18n {
    /// lang -> flattened key ("common.page.title") -> text
    flat: HashMap<String, HashMap<String, String>>,
    /// lang -> original nested JSON without `pages`, sent to the browser
    raw: HashMap<String, Value>,
}

fn flatten(prefix: &str, v: &Value, out: &mut HashMap<String, String>) {
    match v {
        Value::Object(m) => {
            for (k, v) in m {
                let key = if prefix.is_empty() {
                    k.clone()
                } else {
                    format!("{prefix}.{k}")
                };
                flatten(&key, v, out);
            }
        }
        Value::String(s) => {
            out.insert(prefix.to_string(), s.clone());
        }
        other => {
            out.insert(prefix.to_string(), other.to_string());
        }
    }
}

impl I18n {
    pub fn load() -> anyhow::Result<Self> {
        let mut flat = HashMap::new();
        let mut raw = HashMap::new();
        for file in Locales::iter() {
            let Some(lang) = file.strip_suffix(".json") else {
                continue;
            };
            let data = Locales::get(&file).expect("embedded file");
            let mut v: Value = serde_json::from_slice(&data.data)
                .map_err(|e| anyhow::anyhow!("locales/{file}: {e}"))?;
            let mut m = HashMap::new();
            flatten("", &v, &mut m);
            // Page texts (`pages.*`) are only rendered on the server, keep them out of the boot JSON
            if let Some(o) = v.as_object_mut() {
                o.remove("pages");
            }
            flat.insert(lang.to_string(), m);
            raw.insert(lang.to_string(), v);
        }
        anyhow::ensure!(flat.contains_key("en"), "locales/en.json missing");
        Ok(Self { flat, raw })
    }

    /// Look up `key`. Keys are relative to `common.` unless they start with `common.` or `pages.`.
    pub fn t(&self, lang: &str, key: &str) -> String {
        let key = if key.starts_with("common.") || key.starts_with("pages.") {
            key.to_string()
        } else {
            format!("common.{key}")
        };
        self.flat
            .get(lang)
            .and_then(|m| m.get(&key))
            .or_else(|| self.flat.get("en").and_then(|m| m.get(&key)))
            .cloned()
            .unwrap_or(key)
    }

    pub fn raw(&self, lang: &str) -> &Value {
        self.raw
            .get(lang)
            .or_else(|| self.raw.get("en"))
            .expect("en")
    }

    #[cfg(test)]
    pub fn keys(&self, lang: &str) -> Vec<String> {
        let mut k: Vec<String> = self
            .flat
            .get(lang)
            .map(|m| m.keys().cloned().collect())
            .unwrap_or_default();
        k.sort();
        k
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Same check as the 1.x translations test: every language has exactly the keys of English
    #[test]
    fn all_languages_match_english() {
        let i = I18n::load().unwrap();
        let en = i.keys("en");
        assert!(en.len() > 10);
        for lang in crate::countries::LANGUAGES {
            let keys = i.keys(lang);
            let missing: Vec<_> = en.iter().filter(|k| !keys.contains(k)).collect();
            let extra: Vec<_> = keys.iter().filter(|k| !en.contains(k)).collect();
            assert!(missing.is_empty(), "{lang} is missing {missing:?}");
            assert!(extra.is_empty(), "{lang} has extraneous {extra:?}");
        }
    }

    /// Keys built at runtime (`countries.<id>`, `generation.psr_<group>_<0|1>`) must exist,
    /// otherwise the raw key is shown in the page or in chart legends.
    #[test]
    fn dynamic_keys_exist() {
        let i = I18n::load().unwrap();
        let en = i.keys("en");
        let has = |k: String| assert!(en.contains(&k), "en is missing {k}");
        for c in crate::countries::COUNTRIES {
            has(format!("common.countries.{}", c.id));
        }
        for group in [
            "coal", "oil", "gas", "peat", "water", "nuclear", "solar", "wind", "other",
        ] {
            for consumption in [0, 1] {
                has(format!("common.generation.psr_{group}_{consumption}"));
            }
        }
    }

    #[test]
    fn lookup_and_fallback() {
        let i = I18n::load().unwrap();
        assert_eq!(i.t("sv", "common.page.title"), "Elpriset just nu");
        assert_eq!(i.t("xx", "page.title"), i.t("en", "page.title"));
        assert_eq!(i.t("en", "does.not.exist"), "common.does.not.exist");
        assert_eq!(i.t("sv", "pages.custom.title"), "Egen period");
        assert!(i.raw("sv").get("pages").is_none());
        assert_eq!(i.raw("sv")["common"]["custom"]["copy"], "Kopiera");
    }
}
