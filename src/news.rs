//! News written by an external writer (an editor, a script or an AI agent) and pushed
//! through the local news service (`POST /api/v2/news`, see `docs/news.md`).
//!
//! Items are stored with their text per language (`news.data.texts`) and only shown in the
//! languages they were pushed in.

use jiff::civil::Date;
use serde_json::{json, Value};

use crate::db::queries::NewsRow;
use crate::i18n::I18n;
use crate::timeutil::{today, HOUR_MS};

pub fn html_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            c => out.push(c),
        }
    }
    out
}

/// An item as text in one language
#[derive(Debug, Clone, serde::Serialize)]
pub struct Rendered {
    pub title: String,
    /// Plain text of all paragraphs, for descriptions and feeds
    pub summary: String,
    /// Paragraphs as html
    pub html: Vec<String>,
}

fn month_name(i18n: &I18n, lang: &str, d: Date) -> String {
    let m = i18n.t(lang, &format!("months.{}", d.month() - 1));
    // The month names in the locales are lowercase; English and German write them capitalised
    if matches!(lang, "en" | "de") {
        let mut c = m.chars();
        return c
            .next()
            .map(|f| f.to_uppercase().chain(c).collect())
            .unwrap_or_default();
    }
    m
}

pub fn date_short(i18n: &I18n, lang: &str, d: Date) -> String {
    i18n.tf(
        lang,
        "pages.news.date",
        &[
            ("d", &d.day().to_string()),
            ("m", &format!("{:02}", d.month())),
            ("month", &month_name(i18n, lang, d)),
            ("y", &d.year().to_string()),
        ],
    )
}

/// Text of an item in `lang`. Items exist only in the languages they were pushed in: a
/// writer may publish country news in that country's languages only.
pub fn render(item: &NewsRow, lang: &str) -> Option<Rendered> {
    let t = item.data.get("texts")?.get(lang)?;
    let title = t.get("title")?.as_str()?.to_string();
    let paras: Vec<String> = t
        .get("paragraphs")?
        .as_array()?
        .iter()
        .filter_map(Value::as_str)
        .map(str::to_string)
        .collect();
    Some(Rendered {
        title,
        summary: paras.join(" "),
        // Pushed text is plain text, never html
        html: paras.iter().map(|p| html_escape(p)).collect(),
    })
}

/// An item pushed by an external writer (an editor, a script or an AI service)
#[derive(Debug, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PushedItem {
    /// Lowercase slug, `[a-z0-9-]`, 3-80 characters. The id becomes `{day}-{slug}`.
    pub slug: String,
    /// Day the item is about, `YYYY-MM-DD` (default today, Stockholm)
    pub day: Option<String>,
    /// Bidding zone, or none for an item about Europe or a country
    pub area: Option<String>,
    /// Country id (`sv`), taken from `area` when that is given
    pub country: Option<String>,
    /// 1 routine (not indexed by search engines), 2 notable (default), 3 important
    pub importance: Option<i64>,
    /// Publication time, ms (default now)
    pub published: Option<i64>,
    /// Text per language (`sv`, `en`, ...): `{ "title": "...", "paragraphs": ["...", ...] }`.
    /// The item is only shown in these languages.
    pub texts: serde_json::Map<String, Value>,
    /// Facts the text is based on, kept with the item and returned by the API
    pub facts: Option<Value>,
    /// Whether the text was written by an AI system (default false)
    pub ai_generated: Option<bool>,
}

/// Check a pushed item and turn it into a row
pub fn pushed_row(p: PushedItem, now: i64) -> Result<NewsRow, String> {
    let slug = p.slug.trim().to_string();
    if !(3..=80).contains(&slug.len())
        || !slug
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
    {
        return Err("slug must be 3-80 characters a-z, 0-9 and -".into());
    }
    let (area, country) = match (&p.area, &p.country) {
        (Some(a), _) => {
            let (c, a) = crate::countries::find_area(a).ok_or("unknown area")?;
            (a.name.to_string(), c.id.to_string())
        }
        (None, Some(c)) => (
            String::new(),
            crate::countries::country(c)
                .ok_or("unknown country")?
                .id
                .to_string(),
        ),
        (None, None) => (String::new(), String::new()),
    };
    if p.texts.is_empty() {
        return Err("texts must have at least one language".into());
    }
    let mut texts = serde_json::Map::new();
    for (lang, t) in p.texts {
        if !crate::countries::LANGUAGES.contains(&lang.as_str()) {
            return Err(format!("unknown language {lang:?}"));
        }
        let title = t
            .get("title")
            .and_then(Value::as_str)
            .map(str::trim)
            .unwrap_or("");
        let paras: Vec<&str> = t
            .get("paragraphs")
            .and_then(Value::as_array)
            .map(|a| {
                a.iter()
                    .filter_map(Value::as_str)
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                    .collect()
            })
            .unwrap_or_default();
        if title.is_empty() || title.chars().count() > 200 {
            return Err(format!("{lang}: title must be 1-200 characters"));
        }
        if paras.is_empty() || paras.len() > 20 || paras.iter().any(|p| p.chars().count() > 2000) {
            return Err(format!(
                "{lang}: 1-20 paragraphs of at most 2000 characters"
            ));
        }
        texts.insert(lang, json!({ "title": title, "paragraphs": paras }));
    }
    let day = match p.day {
        Some(d) => d
            .trim()
            .parse::<Date>()
            .map_err(|_| "day must be YYYY-MM-DD")?,
        None => today(&crate::timeutil::stockholm()),
    };
    let importance = p.importance.unwrap_or(2);
    if !(1..=3).contains(&importance) {
        return Err("importance must be 1, 2 or 3".into());
    }
    let published = p.published.unwrap_or(now);
    if published > now + 24 * HOUR_MS {
        return Err("published is more than a day ahead".into());
    }
    Ok(NewsRow {
        id: format!("{day}-{slug}"),
        area,
        country,
        day: day.to_string(),
        published,
        updated: now,
        importance,
        data: json!({
            "texts": texts,
            "facts": p.facts,
            "ai_generated": p.ai_generated.unwrap_or(false),
        }),
    })
}

/// Languages an item exists in: the ones it was pushed in
pub fn languages(item: &NewsRow) -> Vec<&'static str> {
    let texts = item.data.get("texts").and_then(Value::as_object);
    crate::countries::LANGUAGES
        .iter()
        .copied()
        .filter(|l| texts.is_some_and(|t| t.contains_key(*l)))
        .collect()
}

/// Whether the item's text was written by an AI system
pub fn ai_generated(item: &NewsRow) -> bool {
    item.data
        .get("ai_generated")
        .and_then(Value::as_bool)
        .unwrap_or(false)
}

/// Path of an item's page
pub fn path(item: &NewsRow) -> String {
    format!("/news/{}", item.id)
}

/// Whether an item is worth a place in search results: importance 2 or more. Routine items
/// (importance 1) get `noindex, follow` and stay out of the sitemap.
pub fn indexable(item: &NewsRow) -> bool {
    item.importance >= 2
}
