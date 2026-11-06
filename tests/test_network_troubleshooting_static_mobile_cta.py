"""Regression tests for the network troubleshooting article's static mobile CTA."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = (ROOT / "blog/network-troubleshooting-checklist.html").read_text(encoding="utf-8")
QUALITY_CSS = (ROOT / "assets/site-final-quality-2026.css").read_text(encoding="utf-8")


class NetworkTroubleshootingStaticCtaTests(unittest.TestCase):
    def test_shared_enhancement_script_is_removed_but_theme_script_remains(self):
        self.assertNotIn(
            '<script src="/assets/site-final-quality-2026.js" defer></script>',
            PAGE,
        )
        self.assertIn('<script src="/assets/site-theme.js" defer></script>', PAGE)

    def test_exactly_one_static_mobile_cta_uses_the_existing_request_route(self):
        anchors = re.findall(
            r"""<a\b(?=[^>]*\bclass=["'][^"']*\bq-mobile-cta\b[^"']*["'])([^>]*)>(.*?)</a>""",
            PAGE,
            flags=re.IGNORECASE | re.DOTALL,
        )
        self.assertEqual(len(anchors), 1)
        attrs, label = anchors[0]
        self.assertRegex(attrs, r"""\bhref=["']/vintech/request\.html["']""")
        self.assertRegex(attrs, r"""\bdata-conversion=["']mobile_service_request["']""")
        self.assertTrue(re.sub(r"<[^>]+>", "", label).strip())
        self.assertTrue((ROOT / "vintech/request.html").is_file())

    def test_existing_article_conversion_and_related_content_are_preserved(self):
        self.assertIn('<section class="seo-conversion-cta"', PAGE)
        self.assertIn('<section class="auto-related"', PAGE)
        self.assertIn('<section class="related-articles site-auto-related"', PAGE)
        for route in (
            "/services.html",
            "/vintech/request.html",
            "/blog/network-hardening.html",
            "/blog/dns-troubleshooting.html",
            "/blog/cctv-ip-camera-network-design.html",
        ):
            self.assertIn(f'href="{route}"', PAGE)
            self.assertTrue((ROOT / route.lstrip("/")).is_file(), route)

    def test_footer_separator_is_static_and_decorative(self):
        self.assertIn(
            '<footer class="legal-footer-2026"><div class="q-footerline" aria-hidden="true"></div>',
            PAGE,
        )

    def test_shared_css_keeps_mobile_cta_hidden_on_desktop_and_visible_on_mobile(self):
        self.assertIn(".q-mobile-cta{display:none}", QUALITY_CSS)
        self.assertIn("@media(max-width:760px)", QUALITY_CSS)
        self.assertIn(".q-mobile-cta{display:flex", QUALITY_CSS)

    def test_persian_rtl_and_existing_seo_metadata_are_preserved(self):
        self.assertTrue(PAGE.startswith('<!doctype html>\n<html lang="fa" dir="rtl">'))
        self.assertIn(
            '<link rel="canonical" href="https://mowhmmdh.github.io/blog/network-troubleshooting-checklist.html">',
            PAGE,
        )
        self.assertIn('hreflang="fa-IR"', PAGE)
        self.assertIn('hreflang="en"', PAGE)
        self.assertIn('hreflang="x-default"', PAGE)
        self.assertIn('"@type":"Article"', PAGE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
