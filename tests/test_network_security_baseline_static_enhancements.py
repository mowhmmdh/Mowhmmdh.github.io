"""Regression tests for static conversion enhancements on the Persian baseline guide."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = (ROOT / "blog" / "network-security-baseline-for-small-business.html").read_text(encoding="utf-8")
CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")
BROWSER_SCRIPT = (ROOT / "scripts" / "network-security-baseline-browser-qa.cjs").read_text(encoding="utf-8")
BROWSER_WORKFLOW = (ROOT / ".github" / "workflows" / "network-security-baseline-static-enhancement.yml").read_text(encoding="utf-8")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.body_class = ""
        self.ctas = []
        self.footer_lines = []
        self.footer_depth = 0
        self.headings = []
        self.links = []
        self._capture_h2 = False
        self._heading_parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get("class", "").split()
        if tag == "body":
            self.body_class = attrs.get("class", "")
        if tag == "footer":
            self.footer_depth += 1
        if tag == "a":
            self.links.append(attrs.get("href", ""))
            if "q-mobile-cta" in classes:
                self.ctas.append(attrs)
        if tag == "div" and "q-footerline" in classes:
            self.footer_lines.append((attrs, self.footer_depth))
        if tag == "h2":
            self._capture_h2 = True
            self._heading_parts = []

    def handle_data(self, data):
        if self._capture_h2:
            self._heading_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "h2" and self._capture_h2:
            self.headings.append("".join(self._heading_parts).strip())
            self._capture_h2 = False
            self._heading_parts = []
        if tag == "footer":
            self.footer_depth = max(0, self.footer_depth - 1)


class NetworkSecurityBaselineStaticEnhancementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parser = PageParser()
        cls.parser.feed(PAGE)

    def test_redundant_shared_enhancement_scripts_are_not_loaded(self):
        self.assertNotIn('src="/assets/site-final-quality-2026.js"', PAGE)
        self.assertNotIn('src="/assets/interaction-2026.js"', PAGE)
        self.assertNotIn("personal-site", self.parser.body_class)

    def test_exactly_one_static_mobile_cta_preserves_the_existing_conversion_contract(self):
        self.assertEqual(len(self.parser.ctas), 1)
        cta = self.parser.ctas[0]
        self.assertEqual(cta.get("href"), "/vintech/request.html")
        self.assertEqual(cta.get("data-conversion"), "mobile_service_request")
        self.assertTrue((ROOT / "vintech" / "request.html").is_file())
        self.assertIn(">درخواست پروژه / مشاوره</a>", PAGE)

    def test_footer_divider_is_static_unique_and_decorative(self):
        self.assertEqual(len(self.parser.footer_lines), 1)
        attrs, footer_depth = self.parser.footer_lines[0]
        self.assertEqual(attrs.get("aria-hidden"), "true")
        self.assertGreater(footer_depth, 0)

    def test_existing_related_content_and_conversion_paths_are_preserved(self):
        self.assertIn('<section class="auto-related"', PAGE)
        self.assertIn('<section class="seo-conversion-cta"', PAGE)
        self.assertIn('<section class="related-articles site-auto-related"', PAGE)
        for route in ("/services.html", "/vintech/request.html", "/blog/network-hardening.html",
                      "/blog/network-segmentation-for-small-business.html", "/authority.html"):
            self.assertIn(route, self.parser.links)
            self.assertTrue((ROOT / route.lstrip("/")).is_file(), route)

    def test_bilingual_metadata_and_article_schema_are_preserved(self):
        canonical = "https://mowhmmdh.github.io/blog/network-security-baseline-for-small-business.html"
        english = "https://mowhmmdh.github.io/en-blog/network-security-baseline-for-small-business.html"
        self.assertIn(f'<link rel="canonical" href="{canonical}">', PAGE)
        self.assertIn(f'hreflang="fa-IR" href="{canonical}"', PAGE)
        self.assertIn(f'hreflang="en" href="{english}"', PAGE)
        self.assertIn(f'hreflang="x-default" href="{canonical}"', PAGE)
        self.assertIn('href="/en-blog/network-security-baseline-for-small-business.html" lang="en" hreflang="en"', PAGE)
        self.assertIn('"@type":"Article"', PAGE)
        self.assertIn('"inLanguage":"fa-IR"', PAGE)

    def test_theme_navigation_and_required_styles_remain_loaded(self):
        self.assertIn('src="/assets/site-theme.js" defer', PAGE)
        self.assertIn('href="/assets/site-bundle.css"', PAGE)
        self.assertIn('href="/assets/site-final-quality-2026.css"', PAGE)
        self.assertIn(".q-mobile-cta{display:none}", CSS)
        self.assertIn("@media(max-width:760px)", CSS)
        self.assertIn(".q-mobile-cta{display:flex", CSS)
        self.assertIn(".q-footerline{", CSS)

    def test_article_content_remains_substantive(self):
        for heading in (
            "۱. دارایی‌ها را بشناسید",
            "۲. شبکه را تفکیک کنید",
            "۳. دسترسی مدیریتی را محدود کنید",
            "۴. Firewall را بر اساس نیاز واقعی تنظیم کنید",
            "۵. Logging و Monitoring",
            "۶. Backup و بازیابی را آزمایش کنید",
            "۷. Baseline را دوره‌ای بازبینی کنید",
            "جمع‌بندی",
        ):
            self.assertIn(heading, self.parser.headings)

    def test_browser_qa_workflow_is_read_only_and_runs_both_lighthouse_profiles(self):
        self.assertIn("permissions:\n  contents: read", BROWSER_WORKFLOW)
        self.assertIn("python3 -m http.server 4173", BROWSER_WORKFLOW)
        self.assertIn("playwright install --with-deps chromium", BROWSER_WORKFLOW)
        self.assertIn('lighthouse "$TARGET_URL"', BROWSER_WORKFLOW)
        self.assertIn("--preset=desktop", BROWSER_WORKFLOW)
        self.assertIn("actions/upload-artifact@v7", BROWSER_WORKFLOW)
        self.assertIn('"assets/site-bundle.css"', BROWSER_WORKFLOW)
        self.assertIn('"assets/site-theme.js"', BROWSER_WORKFLOW)
        self.assertIn('"fonts/**"', BROWSER_WORKFLOW)
        self.assertNotIn("secrets.", BROWSER_WORKFLOW.lower())

    def test_browser_qa_script_checks_bilingual_metadata_conversion_and_no_overflow(self):
        for required in (
            "lang === 'fa'",
            "dir === 'rtl'",
            "horizontalOverflow",
            "q-mobile-cta",
            "mobile",
            "desktop",
            "fa-IR",
            "x-default",
            "mobile_service_request",
            "/assets/site-final-quality-2026.js",
            "/assets/interaction-2026.js",
            "pageErrors",
            "consoleErrors",
        ):
            self.assertIn(required, BROWSER_SCRIPT)


if __name__ == "__main__":
    unittest.main(verbosity=2)
