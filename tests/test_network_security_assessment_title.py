"""Regression checks for the Persian network-security assessment page metadata."""
from html.parser import HTMLParser
from pathlib import Path
import json
import unittest


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog/network-security-assessment-checklist.html"
CANONICAL = "https://mowhmmdh.github.io/blog/network-security-assessment-checklist.html"
ENGLISH = "https://mowhmmdh.github.io/en-blog/network-security-assessment-checklist.html"
EXPECTED_TITLE = "ارزیابی امنیت شبکه؛ چک‌لیست کشف دارایی تا پاسخ به رخداد"
EXPECTED_H1 = "چک‌لیست ارزیابی امنیت شبکه؛ از Asset Discovery تا Incident Response"


class PageMetadataParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.h1_parts = []
        self.meta = {}
        self.canonicals = []
        self.alternates = {}
        self.headlines = []
        self.capture = None
        self.in_jsonld = False
        self.jsonld_parts = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "title":
            self.capture = "title"
        elif tag == "h1":
            self.capture = "h1"

        if tag == "meta":
            key = attributes.get("name") or attributes.get("property")
            if key:
                self.meta[key.lower()] = attributes.get("content", "")

        if tag == "link":
            rel = set((attributes.get("rel") or "").lower().split())
            href = attributes.get("href", "")
            if "canonical" in rel:
                self.canonicals.append(href)
            if "alternate" in rel and attributes.get("hreflang"):
                self.alternates[attributes["hreflang"].lower()] = href

        if tag == "script" and (attributes.get("type") or "").lower() == "application/ld+json":
            self.in_jsonld = True
            self.jsonld_parts = []

    def handle_data(self, data):
        if self.capture == "title":
            self.title_parts.append(data)
        elif self.capture == "h1":
            self.h1_parts.append(data)
        if self.in_jsonld:
            self.jsonld_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "title" and self.capture == "title":
            self.capture = None
        elif tag == "h1" and self.capture == "h1":
            self.capture = None
        elif tag == "script" and self.in_jsonld:
            raw = "".join(self.jsonld_parts).strip()
            if raw:
                try:
                    data = json.loads(raw)
                except json.JSONDecodeError:
                    data = None
                if isinstance(data, dict) and data.get("headline"):
                    self.headlines.append(data["headline"])
            self.in_jsonld = False
            self.jsonld_parts = []


class PersianNetworkSecurityTitleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parser = PageMetadataParser()
        cls.parser.feed(PAGE.read_text(encoding="utf-8"))

    def test_title_is_concise_and_keeps_primary_search_intent(self):
        title = "".join(self.parser.title_parts).strip()
        self.assertEqual(title, EXPECTED_TITLE)
        self.assertGreaterEqual(len(title), 15)
        self.assertLessEqual(len(title), 65)
        self.assertIn("ارزیابی امنیت شبکه", title)
        self.assertIn("چک‌لیست", title)

    def test_open_graph_title_matches_browser_title(self):
        self.assertEqual(self.parser.meta.get("og:title"), EXPECTED_TITLE)

    def test_full_editorial_heading_and_article_schema_are_preserved(self):
        heading = "".join(self.parser.h1_parts).strip()
        self.assertEqual(heading, EXPECTED_H1)
        self.assertIn(EXPECTED_H1, self.parser.headlines)

    def test_canonical_and_bilingual_hreflang_are_unchanged(self):
        self.assertEqual(self.parser.canonicals, [CANONICAL])
        self.assertEqual(self.parser.alternates.get("fa-ir"), CANONICAL)
        self.assertEqual(self.parser.alternates.get("en"), ENGLISH)
        self.assertEqual(self.parser.alternates.get("x-default"), CANONICAL)

    def test_description_retains_incident_response_context(self):
        description = self.parser.meta.get("description", "")
        self.assertIn("پاسخ به رخداد", description)
        self.assertGreaterEqual(len(description), 50)
        self.assertLessEqual(len(description), 170)


    def test_mobile_cta_and_footerline_are_static_without_shared_enhancer(self):
        html = PAGE.read_text(encoding="utf-8")
        self.assertNotIn('src="/assets/site-final-quality-2026.js"', html)
        self.assertIn('href="/assets/site-final-quality-2026.css"', html)
        self.assertIn(
            '<a class="q-mobile-cta" data-conversion="mobile_service_request" href="/vintech/request.html">',
            html,
        )
        self.assertIn('<div class="q-footerline" aria-hidden="true"></div>', html)
        self.assertIn('class="seo-conversion-cta"', html)
        self.assertIn('class="auto-related"', html)
        self.assertIn('class="related-articles site-auto-related"', html)


if __name__ == "__main__":
    unittest.main()
