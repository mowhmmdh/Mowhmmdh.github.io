"""Regression tests for static conversion UI on the network-monitoring article."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "blog" / "network-monitoring-basics.html"
PAGE = PAGE_PATH.read_text(encoding="utf-8")
CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")


class PageContractParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.html_attrs = {}
        self.scripts = []
        self.links = []
        self.hrefs = []
        self.classes = []
        self.ctas = []
        self.footer_lines = []
        self.footer_first_child = None
        self.schemas = []
        self.main_depth = 0
        self.main_h1_count = 0
        self.footer_depth = 0
        self.active_cta = None
        self.active_schema = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())
        self.classes.extend(classes)

        if tag == "html":
            self.html_attrs = attrs
        if tag == "main":
            self.main_depth += 1
        if tag == "h1" and self.main_depth:
            self.main_h1_count += 1
        if tag == "script":
            if attrs.get("src"):
                self.scripts.append(attrs["src"])
            if attrs.get("type") == "application/ld+json":
                self.active_schema = []
        if tag == "link":
            self.links.append(attrs)
        if tag == "a":
            self.hrefs.append(attrs.get("href", ""))
            if "q-mobile-cta" in classes:
                self.active_cta = {"attrs": attrs, "text": []}
                self.ctas.append(self.active_cta)
        if tag == "footer":
            self.footer_depth += 1
        elif self.footer_depth and self.footer_first_child is None:
            self.footer_first_child = (tag, attrs)
        if "q-footerline" in classes:
            self.footer_lines.append({
                "aria_hidden": attrs.get("aria-hidden"),
                "inside_footer": self.footer_depth > 0,
            })

    def handle_data(self, data):
        if self.active_cta is not None:
            self.active_cta["text"].append(data)
        if self.active_schema is not None:
            self.active_schema.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.active_cta is not None:
            self.active_cta = None
        if tag == "script" and self.active_schema is not None:
            raw = "".join(self.active_schema).strip()
            if raw:
                self.schemas.append(json.loads(raw))
            self.active_schema = None
        if tag == "main" and self.main_depth:
            self.main_depth -= 1
        if tag == "footer" and self.footer_depth:
            self.footer_depth -= 1


PARSER = PageContractParser()
PARSER.feed(PAGE)


class NetworkMonitoringStaticEnhancementTests(unittest.TestCase):
    def test_redundant_shared_enhancement_script_is_removed_but_theme_script_remains(self):
        self.assertNotIn("/assets/site-final-quality-2026.js", PARSER.scripts)
        self.assertIn("/assets/site-theme.js", PARSER.scripts)

    def test_exactly_one_static_mobile_cta_preserves_existing_conversion_contract(self):
        self.assertEqual(len(PARSER.ctas), 1)
        cta = PARSER.ctas[0]
        attrs = cta["attrs"]
        self.assertEqual(attrs.get("href"), "/vintech/request.html")
        self.assertEqual(attrs.get("data-conversion"), "mobile_service_request")
        self.assertTrue("".join(cta["text"]).strip())
        self.assertTrue((ROOT / "vintech" / "request.html").is_file())

    def test_footer_divider_is_static_decorative_and_first_child(self):
        self.assertEqual(len(PARSER.footer_lines), 1)
        self.assertEqual(PARSER.footer_lines[0]["aria_hidden"], "true")
        self.assertTrue(PARSER.footer_lines[0]["inside_footer"])
        self.assertEqual(self.footer_first_child_tag(), "div")
        self.assertIn("q-footerline", set((self.footer_first_child_attrs().get("class") or "").split()))

    def footer_first_child_tag(self):
        return self._footer_child()[0]

    def footer_first_child_attrs(self):
        return self._footer_child()[1]

    def _footer_child(self):
        self.assertIsNotNone(PARSER.footer_first_child)
        return PARSER.footer_first_child

    def test_existing_service_conversion_and_related_guides_are_preserved(self):
        for required_class in ("seo-conversion-cta", "auto-related", "related-articles"):
            self.assertIn(required_class, PARSER.classes)
        for route in ("/services.html", "/vintech/request.html"):
            self.assertIn(route, PARSER.hrefs)

    def test_canonical_and_reciprocal_persian_english_hreflang_are_preserved(self):
        canonical = [
            item.get("href") for item in PARSER.links
            if "canonical" in (item.get("rel") or "").split()
        ]
        expected = "https://mowhmmdh.github.io/blog/network-monitoring-basics.html"
        self.assertEqual(canonical, [expected])
        alternates = {
            item.get("hreflang"): item.get("href")
            for item in PARSER.links if item.get("hreflang")
        }
        self.assertEqual(alternates.get("fa-IR"), expected)
        self.assertEqual(
            alternates.get("en"),
            "https://mowhmmdh.github.io/en-blog/network-monitoring-basics.html",
        )
        self.assertEqual(alternates.get("x-default"), expected)
        self.assertTrue((ROOT / "en-blog" / "network-monitoring-basics.html").is_file())

    def test_article_and_breadcrumb_json_ld_remain_valid(self):
        types = {
            item.get("@type") for item in PARSER.schemas if isinstance(item, dict)
        }
        self.assertIn("Article", types)
        self.assertIn("BreadcrumbList", types)

    def test_persian_rtl_semantics_single_main_heading_and_skip_link_remain(self):
        self.assertEqual(PARSER.html_attrs.get("lang"), "fa")
        self.assertEqual(PARSER.html_attrs.get("dir"), "rtl")
        self.assertEqual(PARSER.main_h1_count, 1)
        self.assertIn("#main-content", PARSER.hrefs)

    def test_all_same_site_article_and_conversion_links_resolve_to_repository_files(self):
        missing = []
        for href in PARSER.hrefs:
            parsed = urlsplit(href)
            if parsed.scheme and parsed.netloc not in ("mowhmmdh.github.io",):
                continue
            path = parsed.path
            if not path or not path.startswith("/"):
                continue
            target = ROOT / path.lstrip("/")
            if path.endswith("/") or target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                missing.append(href)
        self.assertEqual(missing, [], "Missing local targets: " + ", ".join(missing))

    def test_existing_css_keeps_cta_hidden_on_desktop_and_visible_with_focus_on_mobile(self):
        self.assertIn(".q-mobile-cta{display:none}", CSS)
        self.assertIn("@media(max-width:760px)", CSS)
        self.assertIn(".q-mobile-cta{display:flex", CSS)
        self.assertIn(".q-mobile-cta:focus-visible", CSS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
