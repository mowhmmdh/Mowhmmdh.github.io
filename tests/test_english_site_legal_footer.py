"""Regression tests for English legal footers outside the homepage and VinTech family."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATHS = (
    "en-about.html",
    "en-authority.html",
    "en-services.html",
    "en-projects.html",
    "en-blog.html",
    "en-press.html",
    "en-media-kit.html",
    "en-linkedin.html",
    "en-verification.html",
    "en-sitemap.html",
    "en-blog/active-directory-hardening.html",
    "en-blog/active-directory-security-basics.html",
    "en-blog/cctv-ip-camera-network-design.html",
    "en-blog/cctv-troubleshooting-checklist.html",
    "en-blog/dhcp-snooping-dai-network-security.html",
    "en-blog/dns-troubleshooting.html",
    "en-blog/fortigate-firewall-policy-design.html",
    "en-blog/gitlab-ci-cd-for-it-infrastructure.html",
    "en-blog/incident-response-network-outage.html",
    "en-blog/linux-server-hardening-checklist.html",
    "en-blog/network-hardening.html",
    "en-blog/network-infrastructure-security-roadmap.html",
    "en-blog/network-monitoring-basics.html",
    "en-blog/network-security-assessment-checklist.html",
    "en-blog/network-security-engineering-playbook.html",
    "en-blog/network-segmentation-for-small-business.html",
    "en-blog/network-troubleshooting-checklist.html",
    "en-blog/vlan-segmentation.html",
)
FOOTER_MARKER = '<footer class="legal-footer-2026">'
EXPECTED_MARKUP = (
    '<a href="/en-privacy.html">Privacy</a>',
    '<a href="/en-terms.html">Terms</a>',
    '<a href="/en-disclosure.html">Disclosure</a>',
    '<a href="mailto:mohammedhasgari@gmail.com">Contact</a>',
)
PERSIAN_LEGAL_LINKS = ("/privacy.html", "/terms.html", "/disclosure.html")
PERSIAN_RANGE = re.compile("[\\u0600-\\u06ff]")


class EnglishSiteLegalFooterTests(unittest.TestCase):
    def test_all_sitemap_english_pages_in_scope_are_explicitly_covered(self):
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        for page in PAGE_PATHS:
            with self.subTest(page=page):
                self.assertIn(
                    "https://mowhmmdh.github.io/" + page,
                    sitemap,
                    "the regression manifest must cover every selected sitemap URL",
                )
        self.assertEqual(len(PAGE_PATHS), len(set(PAGE_PATHS)))

    def test_every_page_uses_english_ltr_and_the_english_legal_footer(self):
        self.assertTrue(PAGE_PATHS, "No English pages were selected")
        for relative_path in PAGE_PATHS:
            with self.subTest(page=relative_path):
                path = ROOT / relative_path
                self.assertTrue(path.is_file(), "page listed in the regression manifest is missing")
                html = path.read_text(encoding="utf-8")
                html_tag = html.split("<html", 1)[1].split(">", 1)[0]
                self.assertIn('lang="en"', html_tag)
                self.assertIn('dir="ltr"', html_tag)
                self.assertEqual(html.count(FOOTER_MARKER), 1)
                footer = html.split(FOOTER_MARKER, 1)[1].split("</footer>", 1)[0]
                for markup in EXPECTED_MARKUP:
                    self.assertIn(markup, footer)
                for target in PERSIAN_LEGAL_LINKS:
                    self.assertNotIn('href="' + target + '"', footer)
                self.assertIsNone(PERSIAN_RANGE.search(footer))

    def test_english_legal_destinations_exist_and_are_english(self):
        for target in ("/en-privacy.html", "/en-terms.html", "/en-disclosure.html"):
            with self.subTest(target=target):
                path = ROOT / target.lstrip("/")
                self.assertTrue(path.is_file())
                html = path.read_text(encoding="utf-8")
                self.assertIn('<html lang="en" dir="ltr">', html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
