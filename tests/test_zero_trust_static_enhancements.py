"""Regression tests for static enhancements on the Persian Active Directory Zero Trust article."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "blog" / "active-directory-zero-trust-basics.html"
CSS_PATH = ROOT / "assets" / "site-final-quality-2026.css"
HTML = PAGE_PATH.read_text(encoding="utf-8")
CSS = CSS_PATH.read_text(encoding="utf-8")


class EnhancementParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ctas = []
        self.cta_text = []
        self._capture_cta = False
        self.footer_open = False
        self.footer_first_child = None
        self.footerline_count = 0
        self.footerline_attrs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())

        if tag == "footer":
            self.footer_open = True
            self.footer_first_child = None
        elif self.footer_open and self.footer_first_child is None:
            self.footer_first_child = (tag, attrs)

        if tag == "div" and "q-footerline" in classes:
            self.footerline_count += 1
            self.footerline_attrs.append(attrs)

        if tag == "a" and "q-mobile-cta" in classes:
            self.ctas.append(attrs)
            self.cta_text.append("")
            self._capture_cta = True

    def handle_data(self, data):
        if self._capture_cta:
            self.cta_text[-1] += data

    def handle_endtag(self, tag):
        if tag == "a" and self._capture_cta:
            self._capture_cta = False
        elif tag == "footer":
            self.footer_open = False


class ZeroTrustStaticEnhancementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parser = EnhancementParser()
        cls.parser.feed(HTML)
        cls.parser.close()

    def test_shared_enhancement_script_is_removed(self):
        self.assertNotIn('/assets/site-final-quality-2026.js', HTML)

    def test_mobile_cta_is_static_and_preserves_original_conversion_contract(self):
        self.assertEqual(len(self.parser.ctas), 1)
        cta = self.parser.ctas[0]
        self.assertEqual(cta.get("href"), "/vintech/request.html")
        self.assertEqual(cta.get("data-conversion"), "mobile_service_request")
        self.assertEqual(self.parser.cta_text[0].strip(), "درخواست پروژه / مشاوره")

    def test_decorative_footer_divider_is_static_and_first_child(self):
        self.assertEqual(self.parser.footerline_count, 1)
        self.assertEqual(self.parser.footerline_attrs[0].get("aria-hidden"), "true")
        self.assertEqual(self.parser.footer_first_child[0], "div")
        self.assertIn("q-footerline", self.parser.footer_first_child[1].get("class", "").split())

    def test_existing_content_metadata_and_conversion_sections_remain(self):
        self.assertIn('<html lang="fa" dir="rtl">', HTML)
        self.assertIn('id="main-content"', HTML)
        self.assertIn('rel="canonical" href="https://mowhmmdh.github.io/blog/active-directory-zero-trust-basics.html"', HTML)
        self.assertIn('class="seo-conversion-cta"', HTML)
        self.assertIn('class="auto-related"', HTML)
        self.assertIn('/assets/site-theme.js', HTML)

    def test_shared_styles_keep_cta_mobile_only_and_footer_divider_visible(self):
        self.assertIn('.q-mobile-cta{display:none}', CSS)
        self.assertIn('@media(max-width:760px)', CSS)
        self.assertIn('.q-mobile-cta{display:flex;position:fixed;', CSS)
        self.assertIn(".q-footerline{height:1px", CSS)


if __name__ == "__main__":
    unittest.main()
