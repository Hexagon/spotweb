//! Tiny XML DOM on top of quick-xml. ENTSO-e and ECB documents are small enough
//! (a few MB at most) that building a tree keeps the extraction code readable.

use quick_xml::escape::resolve_predefined_entity;
use quick_xml::events::Event;
use quick_xml::{Reader, XmlVersion};

#[derive(Debug, Default, Clone)]
pub struct Element {
    /// Local name, namespace prefix stripped
    pub name: String,
    pub attrs: Vec<(String, String)>,
    pub text: String,
    pub children: Vec<Element>,
}

impl Element {
    pub fn child(&self, name: &str) -> Option<&Element> {
        self.children.iter().find(|c| c.name == name)
    }
    pub fn children<'a>(&'a self, name: &'a str) -> impl Iterator<Item = &'a Element> + 'a {
        self.children.iter().filter(move |c| c.name == name)
    }
    /// Trimmed text of a direct child
    pub fn text_of(&self, name: &str) -> Option<&str> {
        self.child(name)
            .map(|c| c.text.trim())
            .filter(|s| !s.is_empty())
    }
    /// Text at a path of direct children, e.g. `["MktPSRType", "psrType"]`
    pub fn path(&self, path: &[&str]) -> Option<&str> {
        let mut cur = self;
        for p in path {
            cur = cur.child(p)?;
        }
        Some(cur.text.trim()).filter(|s| !s.is_empty())
    }
    pub fn attr(&self, name: &str) -> Option<&str> {
        self.attrs
            .iter()
            .find(|(k, _)| k == name)
            .map(|(_, v)| v.as_str())
    }
}

fn local(s: &str) -> String {
    match s.rsplit_once(':') {
        Some((_, l)) => l.to_string(),
        None => s.to_string(),
    }
}

fn element_from(e: &quick_xml::events::BytesStart) -> Element {
    let mut el = Element {
        name: local(e.name().as_ref()),
        ..Default::default()
    };
    for a in e.attributes().flatten() {
        let key = local(a.key.as_ref());
        if key == "xmlns" || a.key.as_ref().starts_with("xmlns:") {
            continue;
        }
        let val = a
            .normalized_value(XmlVersion::Implicit1_0)
            .map(|v| v.to_string())
            .unwrap_or_default();
        el.attrs.push((key, val));
    }
    el
}

/// Parse a document and return the root element
pub fn parse(xml: &str) -> anyhow::Result<Element> {
    let mut reader = Reader::from_str(xml);
    let mut stack: Vec<Element> = vec![Element::default()];
    loop {
        match reader.read_event()? {
            Event::Start(e) => stack.push(element_from(&e)),
            Event::Empty(e) => {
                let el = element_from(&e);
                stack.last_mut().expect("stack").children.push(el);
            }
            Event::End(_) => {
                let el = stack.pop().expect("stack");
                match stack.last_mut() {
                    Some(parent) => parent.children.push(el),
                    None => anyhow::bail!("unbalanced xml"),
                }
            }
            Event::Text(t) => {
                if let Some(cur) = stack.last_mut() {
                    cur.text.push_str(&t.xml10_content());
                }
            }
            Event::CData(t) => {
                if let Some(cur) = stack.last_mut() {
                    cur.text.push_str(&t.xml10_content());
                }
            }
            // Entity and character references come as separate events since quick-xml 0.38
            Event::GeneralRef(r) => {
                if let Some(cur) = stack.last_mut() {
                    if let Some(c) = r.resolve_char_ref()? {
                        cur.text.push(c);
                    } else if let Some(v) = resolve_predefined_entity(&r) {
                        cur.text.push_str(v);
                    } else {
                        anyhow::bail!("unknown entity &{};", &*r);
                    }
                }
            }
            Event::Eof => break,
            _ => {}
        }
    }
    let mut doc = stack.pop().ok_or_else(|| anyhow::anyhow!("empty xml"))?;
    if !stack.is_empty() {
        anyhow::bail!("unbalanced xml");
    }
    doc.children
        .pop()
        .ok_or_else(|| anyhow::anyhow!("no root element"))
}

#[cfg(test)]
mod tests {
    #[test]
    fn parses_namespaced() {
        let root = super::parse(
            r#"<?xml version="1.0"?><a:Root xmlns:a="x"><b k="v">hi</b><c/></a:Root>"#,
        )
        .unwrap();
        assert_eq!(root.name, "Root");
        assert_eq!(root.text_of("b"), Some("hi"));
        assert_eq!(root.child("b").unwrap().attr("k"), Some("v"));
        assert!(root.child("c").is_some());
    }

    #[test]
    fn resolves_entities_and_cdata() {
        let root = super::parse(
            r#"<r a="x &amp; y"><t>A &amp; B &lt;&#x43;&#68;&gt;</t><c><![CDATA[1 < 2]]></c></r>"#,
        )
        .unwrap();
        assert_eq!(root.attr("a"), Some("x & y"));
        assert_eq!(root.text_of("t"), Some("A & B <CD>"));
        assert_eq!(root.text_of("c"), Some("1 < 2"));
        assert!(super::parse("<r>&nope;</r>").is_err());
    }
}
