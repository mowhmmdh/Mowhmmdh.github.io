"""Regression tests for static mobile conversion UI on the incident-response guide."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "blog" / "incident-response-network-outage.html"
PAGE = PAGE_PATH.read_text(encoding="utf-8")
CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.scripts = []
        self.links = []
        self.ctas = []
        self.footer_lines = []
        self.sections = []
        self.schemas = []
        self.lang = None
        self.direction = None
        self.main_ids = []
        self.h1_count = 0
        self.footer_depth = 0
        self.footer_first_child = None
        self._active_cta = None
        self._active_schema = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())

        if tag == "html":
            self.lang = attrs.get("lang")
            self.direction = attrs.get("dir")
        if tag == "script":
            if attrs.get("src"):
                self.scripts.append(attrs["src"])
            if attrs.get("type") == "application/ld+json":
                self._active_schema = []
        if tag == "link":
            self.links.append(attrs)
        if tag == "main":
            self.main_ids.append(attrs.get("id"))
        if tag == "h1":
            self.h1_count += 1
        if tag == "section":
            self.sections.append(classes)
        if tag == "footer":
            self.footer_depth += 1
        elif self.footer_depth and self.footer_first_child is None:
            self.footer_first_child = (tag, attrs)
        if tag == "div" and "q-footerline" in classes:
            self.footer_lines.append({
                "aria_hidden": attrs.get("aria-hidden"),
                "inside_footer": self.footer_depth > 0,
            })
        if tag == "a" and "q-mobile-cta" in classes:
            self._active_cta = {"attrs": attrs, "text": []}
            self.ctas.append(self._active_cta)

    def handle_data(self, data):
        if self._active_cta is not None:
            self._active_cta["text"].append(data)
        if self._active_schema is not None:
            self._active_schema.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._active_cta is not None:
            self._active_cta = None
        if tag == "script" and self._active_schema is not None:
            raw = "".join(self._active_schema).strip()
            if raw:
                self.schemas.append(json.loads(raw))
            self._active_schema = None
        if tag == "footer" and self.footer_depth:
            self.footer_depth -= 1


PARSER = PageParser()
PARSER.feed(PAGE)


class IncidentResponseStaticEnhancementTests(unittest.TestCase):
    def test_page_no_longer_loads_redundant_enhancement_script(self):
        self.assertNotIn("/assets/site-final-quality-2026.js", PARSER.scripts)
        self.assertIn("/assets/site-theme.js", PARSER.scripts)

    def test_exactly_one_static_mobile_cta_preserves_conversion_route(self):
        self.assertEqual(len(PARSER.ctas), 1)
        cta = PARSER.ctas[0]
        attrs = cta["attrs"]
        self.assertEqual(attrs.get("href"), "/vintech/request.html")
        self.assertEqual(attrs.get("data-conversion"), "mobile_service_request")
        self.assertTrue("".join(cta["text"]).strip())
        self.assertTrue((ROOT / "vintech" / "request.html").is_file())

    def test_decorative_footer_line_is_first_and_hidden_from_accessibility_tree(self):
        self.assertEqual(len(PARSER.footer_lines), 1)
        self.assertEqual(PARSER.footer_lines[0]["aria_hidden"], "true")
        self.assertTrue(PARSER.footer_lines[0]["inside_footer"])
        self.assertIsNotNone(PARSER.footer_first_child)
        tag, attrs = PARSER.footer_first_child
        self.assertEqual(tag, "div")
        self.assertIn("q-footerline", (attrs.get("class") or "").split())

    def test_existing_conversion_and_related_content_are_preserved(self):
        classes = set().union(*PARSER.sections)
        self.assertIn("seo-conversion-cta", classes)
        self.assertIn("auto-related", classes)
        self.assertIn("related-articles", classes)
        self.assertIn('href="/services.html"', PAGE)
        self.assertIn('href="/vintech/request.html"', PAGE)

    def test_canonical_and_reciprocal_language_alternates_are_preserved(self):
        canonical = [
            link.get("href") for link in PARSER.links
            if "canonical" in (link.get("rel") or "").split()
        ]
        self.assertEqual(
            canonical,
            ["https://mowhmmdh.github.io/blog/incident-response-network-outage.html"],
        )
        hreflangs = {
            link.get("hreflang"): link.get("href")
            for link in PARSER.links
            if link.get("hreflang")
        }
        self.assertEqual(hreflangs.get("fa-IR"), canonical[0])
        self.assertEqual(
            hreflangs.get("en"),
            "https://mowhmmdh.github.io/en-blog/incident-response-network-outage.html",
        )
        self.assertEqual(hreflangs.get("x-default"), canonical[0])

    def test_article_and_breadcrumb_structured_data_remain_valid(self):
        types = {
            schema.get("@type")
            for schema in PARSER.schemas
            if isinstance(schema, dict)
        }
        self.assertIn("Article", types)
        self.assertIn("BreadcrumbList", types)

    def test_page_keeps_persian_rtl_semantics_and_single_main_heading(self):
        self.assertEqual(PARSER.lang, "fa")
        self.assertEqual(PARSER.direction, "rtl")
        self.assertIn("main-content", PARSER.main_ids)
        self.assertEqual(PARSER.h1_count, 1)

    def test_existing_css_keeps_cta_mobile_only_and_keyboard_visible(self):
        self.assertRegex(CSS, r"\.q-mobile-cta\{display:none\}")
        self.assertRegex(CSS, r"@media\(max-width:760px\)[\s\S]*?\.q-mobile-cta\{display:flex")
        self.assertIn(".q-mobile-cta:focus-visible", CSS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
