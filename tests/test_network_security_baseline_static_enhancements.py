"""Regression tests for static conversion enhancements on the Persian baseline guide."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "blog" / "network-security-baseline-for-small-business.html"
PAGE = PAGE_PATH.read_text(encoding="utf-8")
CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")


class NetworkSecurityBaselineStaticEnhancementTests(unittest.TestCase):
    def test_redundant_shared_enhancement_scripts_are_not_loaded(self):
        self.assertNotIn('src="/assets/site-final-quality-2026.js"', PAGE)
        self.assertNotIn('src="/assets/interaction-2026.js"', PAGE)
        # interaction-2026.js exits immediately unless this page opts into personal-site UI.
        self.assertNotRegex(PAGE, r'<body\\b[^>]*class=["\\'][^"\\']*\\bpersonal-site\\b')

    def test_exactly_one_static_mobile_cta_preserves_the_existing_conversion_contract(self):
        anchors = re.findall(
            r'<a\\b(?=[^>]*\\bclass=["\\'][^"\\']*\\bq-mobile-cta\\b[^"\\']*["\\'])([^>]*)>(.*?)</a>',
            PAGE,
            flags=re.IGNORECASE | re.DOTALL,
        )
        self.assertEqual(len(anchors), 1)
        attrs, label = anchors[0]
        self.assertRegex(attrs, r'\\bhref=["\\']/vintech/request\\.html["\\']')
        self.assertRegex(attrs, r'\\bdata-conversion=["\\']mobile_service_request["\\']')
        self.assertEqual(re.sub(r"<[^>]+>", "", label).strip(), "درخواست پروژه / مشاوره")
        self.assertTrue((ROOT / "vintech" / "request.html").is_file())

    def test_footer_divider_is_static_unique_and_decorative(self):
        self.assertEqual(PAGE.count('class="q-footerline"'), 1)
        self.assertIn(
            '<footer class="legal-footer-2026"><div class="q-footerline" aria-hidden="true"></div>',
            PAGE,
        )

    def test_existing_related_content_and_conversion_paths_are_preserved(self):
        self.assertIn('<section class="auto-related"', PAGE)
        self.assertIn('<section class="seo-conversion-cta"', PAGE)
        self.assertIn('<section class="related-articles site-auto-related"', PAGE)
        for route in ("/services.html", "/vintech/request.html", "/blog/network-hardening.html",
                      "/blog/network-segmentation-for-small-business.html", "/authority.html"):
            self.assertIn(f'href="{route}"', PAGE)
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
        self.assertRegex(CSS, r"@media\\(max-width:760px\\)[^}]*\\.q-mobile-cta\\{display:flex")
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
            self.assertIn(f"<h2>{heading}</h2>", PAGE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
