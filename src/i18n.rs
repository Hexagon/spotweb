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
    /// lang -> original nested JSON, sent to the browser
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
            let v: Value = serde_json::from_slice(&data.data)
                .map_err(|e| anyhow::anyhow!("locales/{file}: {e}"))?;
            let mut m = HashMap::new();
            flatten("", &v, &mut m);
            flat.insert(lang.to_string(), m);
            raw.insert(lang.to_string(), v);
        }
        anyhow::ensure!(flat.contains_key("en"), "locales/en.json missing");
        Ok(Self { flat, raw })
    }

    pub fn t(&self, lang: &str, key: &str) -> String {
        let key = if key.starts_with("common.") {
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

    #[test]
    fn lookup_and_fallback() {
        let i = I18n::load().unwrap();
        assert_eq!(i.t("sv", "common.page.title"), "Elpriset just nu");
        assert_eq!(i.t("xx", "page.title"), i.t("en", "page.title"));
        assert_eq!(i.t("en", "does.not.exist"), "common.does.not.exist");
    }
}
