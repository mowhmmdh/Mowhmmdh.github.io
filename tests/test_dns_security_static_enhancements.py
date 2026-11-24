"""Regression tests for static enhancements on the Persian DNS security article."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "blog" / "dns-security-and-troubleshooting.html"
PAGE = PAGE_PATH.read_text(encoding="utf-8")
QUALITY_CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.html_attrs = {}
        self.scripts = []
        self.links = []
        self.classes = []
        self.ctas = []
        self.active_cta = None
        self.footer_active = False
        self.footer_first_child = None
        self.footer_lines = []
        self.h1 = []
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())
        self.classes.extend(classes)

        if tag == "html":
            self.html_attrs = attrs
        if tag == "script" and attrs.get("src"):
            self.scripts.append(attrs["src"])
        if tag == "link":
            self.links.append(attrs)
        if tag == "a":
            self.hrefs.append(attrs.get("href", ""))
            if "q-mobile-cta" in classes:
                self.active_cta = {"attrs": attrs, "text": []}
                self.ctas.append(self.active_cta)
        if tag == "h1":
            self.h1.append([])
            self.active_h1 = self.h1[-1]
        if tag == "footer" and "legal-footer-2026" in classes:
            self.footer_active = True
        elif self.footer_active and self.footer_first_child is None:
            self.footer_first_child = (tag, attrs)
        if "q-footerline" in classes:
            self.footer_lines.append({
                "attrs": attrs,
                "inside_footer": self.footer_active,
            })

    def handle_data(self, data):
        if self.active_cta is not None:
            self.active_cta["text"].append(data)
        if getattr(self, "active_h1", None) is not None:
            self.active_h1.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.active_cta is not None:
            self.active_cta = None
        if tag == "h1":
            self.active_h1 = None
        if tag == "footer" and self.footer_active:
            self.footer_active = False


PARSER = PageParser()
PARSER.feed(PAGE)


class DnsSecurityStaticEnhancementTests(unittest.TestCase):
    def test_persian_document_and_primary_heading_are_preserved(self):
        self.assertEqual(PARSER.html_attrs.get("lang"), "fa")
        self.assertEqual(PARSER.html_attrs.get("dir"), "rtl")
        self.assertEqual(len(PARSER.h1), 1)
        self.assertEqual("".join(PARSER.h1[0]).strip(), "امنیت و عیب‌یابی DNS؛ از Resolution تا Hardening")
        self.assertIn('id="main-content"', PAGE)

    def test_shared_enhancement_script_is_removed_and_theme_script_is_preserved(self):
        self.assertNotIn("/assets/site-final-quality-2026.js", PARSER.scripts)
        self.assertIn("/assets/site-theme.js", PARSER.scripts)
        self.assertIn("/assets/site-final-quality-2026.css", PAGE)

    def test_one_static_mobile_cta_preserves_route_label_and_conversion(self):
        self.assertEqual(len(PARSER.ctas), 1)
        cta = PARSER.ctas[0]
        self.assertEqual(cta["attrs"].get("href"), "/vintech/request.html")
        self.assertEqual(cta["attrs"].get("data-conversion"), "mobile_service_request")
        self.assertEqual("".join(cta["text"]).strip(), "درخواست پروژه / مشاوره")
        self.assertTrue((ROOT / "vintech" / "request.html").is_file())
        self.assertGreater(PAGE.index('<a class="q-mobile-cta"'), PAGE.index("</footer>"))

    def test_footer_decoration_is_unique_hidden_from_at_and_first_child(self):
        self.assertEqual(len(PARSER.footer_lines), 1)
        line = PARSER.footer_lines[0]
        self.assertTrue(line["inside_footer"])
        self.assertEqual(line["attrs"].get("aria-hidden"), "true")
        self.assertEqual(PARSER.footer_first_child[0], "div")
        self.assertIn("q-footerline", (PARSER.footer_first_child[1].get("class") or "").split())

    def test_existing_related_and_conversion_sections_remain(self):
        for class_name in ("auto-related", "auto-related-grid", "seo-conversion-cta", "related-articles", "site-auto-related"):
            self.assertIn(class_name, PARSER.classes)
        self.assertIn('aria-label="خدمات فناوری اطلاعات"', PAGE)
        self.assertIn("/blog/dns-troubleshooting.html", PARSER.hrefs)
        self.assertIn("/blog/active-directory-security-basics.html", PARSER.hrefs)
        self.assertIn("/authority.html", PARSER.hrefs)
        self.assertIn("/services.html", PARSER.hrefs)

    def test_article_copy_and_section_order_are_preserved(self):
        expected = [
            "۱. اول مشخص کنید چه چیزی خراب است",
            "۲. تنظیمات Client را بررسی کنید",
            "۳. پاسخ را مستقیم آزمایش کنید",
            "۴. Forwarding و Recursion",
            "۵. لاگ و Monitoring",
            "۶. Hardening",
            "جمع‌بندی",
        ]
        article_body = PAGE.split("<!-- AUTO-RELATED:START -->", 1)[0]
        actual = [
            re.sub(r"<[^>]+>", "", heading).strip()
            for heading in re.findall(r"<h2[^>]*>(.*?)</h2>", article_body, flags=re.S)
        ]
        self.assertEqual(actual, expected)

    def test_canonical_hreflang_and_indexability_metadata_are_preserved(self):
        canonical = [
            item.get("href") for item in PARSER.links
            if "canonical" in (item.get("rel") or "").split()
        ]
        self.assertEqual(canonical, ["https://mowhmmdh.github.io/blog/dns-security-and-troubleshooting.html"])
        alternates = {
            item.get("hreflang"): item.get("href")
            for item in PARSER.links if item.get("hreflang")
        }
        self.assertEqual(alternates.get("fa-IR"), canonical[0])
        self.assertEqual(alternates.get("x-default"), "https://mowhmmdh.github.io/")
        self.assertIn('name="robots" content="index,follow', PAGE)

    def test_article_techarticle_and_breadcrumb_json_ld_remain_valid(self):
        raw = re.findall(
            r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            PAGE,
            flags=re.S | re.I,
        )
        self.assertGreaterEqual(len(raw), 3)
        schemas = [json.loads(value) for value in raw]
        types = []
        for schema in schemas:
            if isinstance(schema, dict):
                types.append(schema.get("@type"))
                if isinstance(schema.get("@graph"), list):
                    types.extend(node.get("@type") for node in schema["@graph"] if isinstance(node, dict))
        self.assertIn("TechArticle", types)
        self.assertIn("Article", types)
        self.assertIn("BreadcrumbList", types)

    def test_static_cta_and_footerline_keep_existing_responsive_styles(self):
        self.assertIn(".q-mobile-cta{display:none}", QUALITY_CSS)
        self.assertIn("@media(max-width:760px)", QUALITY_CSS)
        self.assertIn(".q-mobile-cta{display:flex", QUALITY_CSS)
        self.assertIn(".q-mobile-cta:focus-visible", QUALITY_CSS)
        self.assertIn(".q-footerline{height:1px", QUALITY_CSS)
        self.assertIn("@media(prefers-reduced-motion:reduce)", QUALITY_CSS)

    def test_legal_footer_and_conversion_destinations_remain(self):
        for href in ("/privacy.html", "/terms.html", "/disclosure.html", "mailto:mohammedhasgari@gmail.com"):
            self.assertIn(href, PARSER.hrefs)
        self.assertIn('<section class="seo-conversion-cta"', PAGE)
        self.assertIn('href="/services.html"', PAGE)
        self.assertIn('href="/vintech/request.html"', PAGE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
