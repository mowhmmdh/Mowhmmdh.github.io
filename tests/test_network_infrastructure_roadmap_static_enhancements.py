"""Regression tests for the Network Infrastructure Security Roadmap article's static enhancements."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "blog" / "network-infrastructure-security-roadmap.html"
EN_PAGE_PATH = ROOT / "en-blog" / "network-infrastructure-security-roadmap.html"
PAGE = PAGE_PATH.read_text(encoding="utf-8")
CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")
WORKFLOW = (ROOT / ".github" / "workflows" / "network-infrastructure-roadmap-static-enhancement.yml").read_text(encoding="utf-8")


class PageContractParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.html_attrs = {}
        self.scripts = []
        self.links = []
        self.hrefs = []
        self.classes = set()
        self.ctas = []
        self.cta_after_footer = []
        self.footer_lines = []
        self.footer_first_child = None
        self.footer_depth = 0
        self.footer_closed = False
        self.schemas = []
        self.main_depth = 0
        self.main_h1_count = 0
        self.active_cta = None
        self.active_schema = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())
        self.classes.update(classes)

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
                self.cta_after_footer.append(self.footer_closed)
        if tag == "footer":
            self.footer_depth += 1
            self.footer_closed = False
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
            self.footer_closed = True


PARSER = PageContractParser()
PARSER.feed(PAGE)


class NetworkInfrastructureRoadmapStaticEnhancementTests(unittest.TestCase):
    def test_redundant_shared_script_is_removed_but_theme_script_remains(self):
        self.assertNotIn("/assets/site-final-quality-2026.js", PARSER.scripts)
        self.assertIn("/assets/site-theme.js", PARSER.scripts)

    def test_exactly_one_static_mobile_cta_preserves_conversion_contract(self):
        self.assertEqual(len(PARSER.ctas), 1)
        cta = PARSER.ctas[0]
        attrs = cta["attrs"]
        self.assertEqual(attrs.get("href"), "/vintech/request.html")
        self.assertEqual(attrs.get("data-conversion"), "mobile_service_request")
        self.assertEqual("".join(cta["text"]).strip(), "درخواست پروژه / مشاوره")
        self.assertEqual(PARSER.cta_after_footer, [True])
        self.assertTrue((ROOT / "vintech" / "request.html").is_file())

    def test_footer_divider_is_static_decorative_and_first_child(self):
        self.assertEqual(len(PARSER.footer_lines), 1)
        self.assertEqual(PARSER.footer_lines[0]["aria_hidden"], "true")
        self.assertTrue(PARSER.footer_lines[0]["inside_footer"])
        self.assertIsNotNone(PARSER.footer_first_child)
        tag, attrs = PARSER.footer_first_child
        self.assertEqual(tag, "div")
        self.assertIn("q-footerline", set((attrs.get("class") or "").split()))

    def test_existing_conversion_and_related_content_are_preserved(self):
        for required_class in ("seo-conversion-cta", "auto-related", "related-articles"):
            self.assertIn(required_class, PARSER.classes)
        for route in ("/services.html", "/vintech/request.html"):
            self.assertIn(route, PARSER.hrefs)

    def test_canonical_and_reciprocal_hreflang_are_preserved(self):
        expected = "https://mowhmmdh.github.io/blog/network-infrastructure-security-roadmap.html"
        expected_english = "https://mowhmmdh.github.io/en-blog/network-infrastructure-security-roadmap.html"
        canonical = [
            item.get("href") for item in PARSER.links
            if "canonical" in (item.get("rel") or "").split()
        ]
        self.assertEqual(canonical, [expected])
        alternates = {
            item.get("hreflang"): item.get("href")
            for item in PARSER.links if item.get("hreflang")
        }
        self.assertEqual(alternates.get("fa-IR"), expected)
        self.assertEqual(alternates.get("en"), expected_english)
        self.assertEqual(alternates.get("x-default"), expected)
        self.assertTrue(EN_PAGE_PATH.is_file())

    def test_article_and_breadcrumb_json_ld_remain_valid(self):
        types = set()
        for item in PARSER.schemas:
            if not isinstance(item, dict):
                continue
            if item.get("@type"):
                types.add(item["@type"])
            for nested in item.get("@graph", []):
                if isinstance(nested, dict) and nested.get("@type"):
                    types.add(nested["@type"])
        self.assertIn("Article", types)
        self.assertIn("BreadcrumbList", types)

    def test_persian_rtl_single_h1_and_skip_link_remain(self):
        self.assertEqual(PARSER.html_attrs.get("lang"), "fa")
        self.assertEqual(PARSER.html_attrs.get("dir"), "rtl")
        self.assertEqual(PARSER.main_h1_count, 1)
        self.assertIn("#main-content", PARSER.hrefs)

    def test_all_same_site_links_resolve_to_repository_files(self):
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

    def test_workflow_uses_pinned_node22_compatible_actions_and_read_only_permissions(self):
        self.assertIn("actions/checkout@v7", WORKFLOW)
        self.assertIn("actions/setup-node@v7", WORKFLOW)
        self.assertIn("actions/upload-artifact@v7", WORKFLOW)
        self.assertIn("node-version: 22", WORKFLOW)
        self.assertIn("playwright@1.56.1", WORKFLOW)
        self.assertIn("lighthouse@13.6.0", WORKFLOW)
        self.assertIn("@sentry/node@11.13.0", WORKFLOW)
        self.assertIn("@sentry/core@11.13.0", WORKFLOW)
        self.assertIn("contents: read", WORKFLOW)
        self.assertNotIn("contents: write", WORKFLOW)

    def test_workflow_is_scoped_to_the_target_page_and_read_only(self):
        self.assertIn("blog/network-infrastructure-security-roadmap.html", WORKFLOW)
        self.assertIn("en-blog/network-infrastructure-security-roadmap.html", WORKFLOW)
        self.assertIn("pull_request:", WORKFLOW)
        self.assertIn("permissions:\n  contents: read", WORKFLOW)

    def test_existing_css_keeps_cta_hidden_on_desktop_and_visible_with_focus_on_mobile(self):
        self.assertIn(".q-mobile-cta{display:none}", CSS)
        self.assertIn("@media(max-width:760px)", CSS)
        self.assertIn(".q-mobile-cta{display:flex", CSS)
        self.assertIn(".q-mobile-cta:focus-visible", CSS)
        self.assertIn(".q-footerline{", CSS)


    def test_navigation_backdrop_is_clamped_to_viewport(self):
        self.assertIn(
            "body .site-nav:before{inset-inline:calc((100vw - 100%)/-2)}",
            PAGE,
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
