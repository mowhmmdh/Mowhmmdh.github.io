"""Regression tests for static enhancements on the Persian blog index."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "blog" / "index.html"
PAGE = PAGE_PATH.read_text(encoding="utf-8")
BUNDLE = (ROOT / "assets" / "site-bundle.css").read_text(encoding="utf-8")
QUALITY_CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")


class BlogIndexParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.html_attrs = {}
        self.links = []
        self.scripts = []
        self.classes = []
        self.hrefs = []
        self.articles = 0
        self.h1_count = 0
        self.mobile_ctas = []
        self.conversion_sections = []
        self.footer_depth = 0
        self.footer_first_child = None
        self.footer_lines = []
        self.active_cta = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())
        self.classes.extend(classes)

        if tag == "html":
            self.html_attrs = attrs
        if tag == "link":
            self.links.append(attrs)
        if tag == "script" and attrs.get("src"):
            self.scripts.append(attrs["src"])
        if tag == "article":
            self.articles += 1
        if tag == "h1":
            self.h1_count += 1
        if tag == "a":
            self.hrefs.append(attrs.get("href", ""))
            if "q-mobile-cta" in classes:
                self.active_cta = {"attrs": attrs, "text": []}
                self.mobile_ctas.append(self.active_cta)
        if tag == "section" and "q-conversion" in classes:
            self.conversion_sections.append(attrs)
        if tag == "footer" and "legal-footer-2026" in classes:
            self.footer_depth = 1
        elif self.footer_depth and self.footer_first_child is None:
            self.footer_first_child = (tag, attrs)
        if "q-footerline" in classes:
            self.footer_lines.append({
                "attrs": attrs,
                "inside_footer": self.footer_depth > 0,
            })

    def handle_data(self, data):
        if self.active_cta is not None:
            self.active_cta["text"].append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.active_cta is not None:
            self.active_cta = None
        if tag == "footer" and self.footer_depth:
            self.footer_depth = 0


PARSER = BlogIndexParser()
PARSER.feed(PAGE)


class BlogIndexStaticEnhancementTests(unittest.TestCase):
    def test_shared_enhancement_script_is_removed_and_theme_script_is_preserved(self):
        self.assertNotIn("/assets/site-final-quality-2026.js", PARSER.scripts)
        self.assertIn("/assets/site-theme.js", PARSER.scripts)

    def test_one_static_mobile_cta_preserves_label_route_and_conversion_attribute(self):
        self.assertEqual(len(PARSER.mobile_ctas), 1)
        cta = PARSER.mobile_ctas[0]
        self.assertEqual(cta["attrs"].get("href"), "/vintech/request.html")
        self.assertEqual(cta["attrs"].get("data-conversion"), "mobile_service_request")
        self.assertIn("درخواست پروژه / مشاوره", "".join(cta["text"]))
        self.assertTrue((ROOT / "vintech" / "request.html").is_file())

    def test_static_conversion_panel_preserves_service_and_email_actions(self):
        self.assertEqual(len(PARSER.conversion_sections), 1)
        self.assertEqual(
            PARSER.conversion_sections[0].get("aria-label"),
            "درخواست خدمات",
        )
        self.assertIn('data-conversion="service_request"', PAGE)
        self.assertIn('href="/vintech/request.html">درخواست بررسی / پروژه', PAGE)
        self.assertIn('data-conversion="email"', PAGE)
        self.assertIn("mailto:mohammedhasgari@gmail.com", PAGE)

    def test_footer_divider_is_decorative_unique_and_first_child(self):
        self.assertEqual(len(PARSER.footer_lines), 1)
        line = PARSER.footer_lines[0]
        self.assertEqual(line["attrs"].get("aria-hidden"), "true")
        self.assertTrue(line["inside_footer"])
        self.assertIsNotNone(PARSER.footer_first_child)
        tag, attrs = PARSER.footer_first_child
        self.assertEqual(tag, "div")
        self.assertIn("q-footerline", (attrs.get("class") or "").split())

    def test_existing_article_cards_and_related_content_are_preserved(self):
        self.assertGreaterEqual(PARSER.articles, 8)
        for class_name in ("auto-discovery", "related-articles", "site-auto-related"):
            self.assertIn(class_name, PARSER.classes)
        self.assertIn("/blog/network-hardening.html", PARSER.hrefs)
        self.assertIn("/blog/dns-troubleshooting.html", PARSER.hrefs)

    def test_persian_rtl_canonical_hreflang_and_rss_discovery_are_preserved(self):
        self.assertEqual(PARSER.html_attrs.get("lang"), "fa")
        self.assertEqual(PARSER.html_attrs.get("dir"), "rtl")
        canonical = [
            item.get("href") for item in PARSER.links
            if "canonical" in (item.get("rel") or "").split()
        ]
        self.assertEqual(canonical, ["https://mowhmmdh.github.io/blog/"])
        alternates = {
            item.get("hreflang"): item.get("href")
            for item in PARSER.links if item.get("hreflang")
        }
        self.assertEqual(alternates.get("fa-IR"), "https://mowhmmdh.github.io/blog/")
        self.assertEqual(alternates.get("en"), "https://mowhmmdh.github.io/en-blog.html")
        self.assertEqual(alternates.get("x-default"), "https://mowhmmdh.github.io/blog/")
        rss = [
            item.get("href") for item in PARSER.links
            if item.get("type") == "application/rss+xml"
        ]
        self.assertEqual(rss, ["https://mowhmmdh.github.io/feed.xml"])

    def test_json_ld_remains_valid_and_contains_collection_and_breadcrumb_data(self):
        raw_schemas = re.findall(
            r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            PAGE,
            flags=re.DOTALL | re.IGNORECASE,
        )
        self.assertGreaterEqual(len(raw_schemas), 2)
        schemas = [json.loads(raw) for raw in raw_schemas]
        serialized = json.dumps(schemas, ensure_ascii=False)
        self.assertIn("BreadcrumbList", serialized)
        schema_types = [
            schema.get("@type") for schema in schemas if isinstance(schema, dict)
        ]
        self.assertIn("CollectionPage", schema_types)
        self.assertIn("BreadcrumbList", schema_types)
        self.assertNotIn(
            "Article",
            schema_types,
            "A blog collection index must not be marked up as a single Article",
        )

    def test_primary_mobile_navigation_and_skip_link_remain(self):
        self.assertIn('href="#main-content"', PAGE)
        self.assertIn('id="main-content"', PAGE)
        self.assertIn('class="mobile-menu"', PAGE)
        self.assertIn('aria-expanded="false"', PAGE)
        self.assertIn('class="theme-toggle"', PAGE)

    def test_shared_css_keeps_static_cta_responsive_and_keyboard_visible(self):
        self.assertIn(".q-mobile-cta{display:none}", QUALITY_CSS)
        self.assertIn("@media(max-width:760px)", QUALITY_CSS)
        self.assertIn(".q-mobile-cta{display:flex", QUALITY_CSS)
        self.assertIn(".q-mobile-cta:focus-visible", QUALITY_CSS)
        self.assertIn(".q-conversion{", QUALITY_CSS)
        self.assertIn(".q-footerline{", QUALITY_CSS)

    def test_all_conversion_destinations_resolve_to_existing_repository_files(self):
        routes = ("/vintech/request.html",)
        for route in routes:
            target = ROOT / route.lstrip("/")
            self.assertTrue(target.is_file(), route + " must remain available")
        for href in PARSER.hrefs:
            parsed = urlsplit(href)
            if parsed.scheme or not parsed.path.startswith("/"):
                continue
            if parsed.path in ("/vintech/request.html",):
                continue
            target = ROOT / parsed.path.lstrip("/")
            if parsed.path.endswith("/") or target.is_dir():
                target = target / "index.html"
            if not target.exists():
                # Existing clean URLs may be supplied by Netlify redirects.
                self.assertTrue(
                    (ROOT / (parsed.path.lstrip("/") + ".html")).is_file(),
                    href + " must resolve to a source page or clean-URL target",
                )


    def test_blog_index_navigation_backdrop_stays_within_the_viewport(self):
        self.assertIn('<body class="blog-index">', PAGE)
        self.assertIn(
            "body.blog-index .nav:before{inset-inline:calc((100vw - 100%)/-2)}",
            PAGE,
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
