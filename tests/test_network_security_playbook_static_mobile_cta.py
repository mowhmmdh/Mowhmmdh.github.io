"""Regression tests for the network security playbook's static mobile CTA."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = (ROOT / "blog/network-security-engineering-playbook.html").read_text(encoding="utf-8")
QUALITY_CSS = (ROOT / "assets/site-final-quality-2026.css").read_text(encoding="utf-8")


class NetworkSecurityPlaybookStaticCtaTests(unittest.TestCase):
    def test_shared_enhancement_script_is_not_loaded_on_this_page(self):
        self.assertNotIn(
            '<script src="/assets/site-final-quality-2026.js" defer></script>',
            PAGE,
        )

    def test_one_static_mobile_cta_uses_the_existing_request_route(self):
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

    def test_existing_article_conversion_cta_is_preserved(self):
        match = re.search(
            r'<section\b[^>]*class=["\'][^"\']*\bseo-conversion-cta\b[^"\']*["\'][\s\S]*?</section>',
            PAGE,
        )
        self.assertIsNotNone(match)
        self.assertIn('href="/vintech/request.html"', match.group(0))

    def test_footer_separator_is_static_and_decorative(self):
        self.assertIn(
            '<footer class="legal-footer-2026"><div class="q-footerline" aria-hidden="true"></div>',
            PAGE,
        )

    def test_existing_css_keeps_the_mobile_cta_hidden_on_desktop_and_visible_on_mobile(self):
        self.assertIn(".q-mobile-cta{display:none}", QUALITY_CSS)
        self.assertIn("@media(max-width:760px)", QUALITY_CSS)
        self.assertIn(".q-mobile-cta{display:flex", QUALITY_CSS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
