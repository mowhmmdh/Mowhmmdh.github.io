"""Regression tests for the CCTV article's static conversion enhancements."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = (ROOT / "blog/cctv-ip-camera-network-design.html").read_text(encoding="utf-8")
CSS = (ROOT / "assets/site-bundle.css").read_text(encoding="utf-8")


class CctvArticleStaticEnhancementTests(unittest.TestCase):
    def test_shared_enhancement_script_is_removed_from_this_page(self):
        self.assertNotIn(
            '<script src="/assets/site-final-quality-2026.js" defer></script>',
            PAGE,
        )

    def test_exactly_one_static_mobile_cta_uses_existing_conversion_route(self):
        anchors = re.findall(
            r'<a\b(?=[^>]*\bclass=["\'][^"\']*\bq-mobile-cta\b[^"\']*["\'])([^>]*)>(.*?)</a>',
            PAGE,
            flags=re.IGNORECASE | re.DOTALL,
        )
        self.assertEqual(len(anchors), 1)
        attrs, label = anchors[0]
        self.assertRegex(attrs, r'\bhref=["\']/vintech/request\.html["\']')
        self.assertRegex(attrs, r'\bdata-conversion=["\']mobile_service_request["\']')
        self.assertTrue(re.sub(r"<[^>]+>", "", label).strip())
        self.assertTrue((ROOT / "vintech/request.html").is_file())

    def test_existing_related_guides_and_service_conversion_are_preserved(self):
        self.assertIn('<section class="auto-related"', PAGE)
        self.assertIn('<section class="related-articles site-auto-related"', PAGE)
        self.assertIn('<aside class="conversion-cta" aria-label="درخواست خدمات">', PAGE)
        for route in (
            "/blog/dhcp-snooping-dai-network-security.html",
            "/blog/incident-response-network-outage.html",
            "/vintech/cctv-nvr.html",
            "/services.html",
        ):
            self.assertIn(f'href="{route}"', PAGE)
            self.assertTrue((ROOT / route.lstrip("/")).is_file(), route)

    def test_footer_separator_is_static_and_decorative(self):
        self.assertIn(
            '<footer class="legal-footer-2026"><div class="q-footerline" aria-hidden="true"></div>',
            PAGE,
        )

    def test_existing_css_keeps_mobile_cta_hidden_on_desktop_and_visible_on_mobile(self):
        self.assertIn(".q-mobile-cta{display:none}", CSS)
        self.assertIn("@media(max-width:760px)", CSS)
        self.assertIn(".q-mobile-cta{display:flex", CSS)

    def test_persian_direction_canonical_and_theme_navigation_are_preserved(self):
        self.assertIn('<html lang="fa" dir="rtl">', PAGE)
        self.assertIn(
            '<link rel="canonical" href="https://mowhmmdh.github.io/blog/cctv-ip-camera-network-design.html">',
            PAGE,
        )
        self.assertIn('<script src="/assets/site-theme.js" defer></script>', PAGE)
        self.assertIn('class="theme-toggle"', PAGE)
        self.assertIn('class="mobile-menu"', PAGE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
