"""Regression checks for static enhancements on the VinTech backup article."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "vintech/insights/backup-and-disaster-recovery.html"
CSS_PATH = ROOT / "assets/site-final-quality-2026.css"
PAGE = PAGE_PATH.read_text(encoding="utf-8")
CSS = CSS_PATH.read_text(encoding="utf-8")


class VintechBackupArticleStaticEnhancementsTests(unittest.TestCase):
    def test_shared_dom_enhancement_script_is_removed(self):
        self.assertNotIn(
            '<script src="/assets/site-final-quality-2026.js" defer></script>',
            PAGE,
        )

    def test_related_paths_are_static_inside_main_content(self):
        main = PAGE.split('<main id="main-content" class="container">', 1)[1].split("</main>", 1)[0]
        self.assertIn('<section class="q-discovery" aria-labelledby="q-discovery-title">', main)
        self.assertEqual(main.count('class="q-discovery-card"'), 3)
        self.assertEqual(PAGE.count('id="q-discovery-title"'), 1)
        for route in (
            "/vintech/network-infrastructure.html",
            "/vintech/cybersecurity.html",
            "/vintech/cctv-nvr.html",
        ):
            self.assertIn(f'href="{route}"', main)
            self.assertTrue((ROOT / route.lstrip("/")).is_file(), route)

    def test_static_service_conversion_has_valid_existing_destinations(self):
        main = PAGE.split('<main id="main-content" class="container">', 1)[1].split("</main>", 1)[0]
        self.assertIn('<section class="q-conversion" aria-label="درخواست خدمات">', main)
        self.assertIn('data-conversion="service_request" href="/vintech/request.html"', main)
        self.assertIn('data-conversion="email"', main)
        self.assertTrue((ROOT / "vintech/request.html").is_file())

    def test_mobile_cta_is_static_and_uses_existing_request_route(self):
        self.assertEqual(PAGE.count('class="q-mobile-cta"'), 1)
        self.assertIn(
            '<a class="q-mobile-cta" href="/vintech/request.html" '
            'data-conversion="mobile_service_request">درخواست پروژه / مشاوره</a>',
            PAGE,
        )

    def test_footer_separator_is_static_and_decorative(self):
        self.assertIn(
            '<footer class="legal-footer-2026"><div class="q-footerline" aria-hidden="true"></div>',
            PAGE,
        )

    def test_existing_persian_direction_and_canonical_are_preserved(self):
        self.assertIn('<html lang="fa" dir="rtl">', PAGE)
        self.assertIn(
            '<link rel="canonical" href="https://mowhmmdh.github.io/vintech/insights/backup-and-disaster-recovery.html">',
            PAGE,
        )

    def test_existing_css_keeps_mobile_cta_hidden_on_desktop_and_visible_on_mobile(self):
        self.assertIn(".q-mobile-cta{display:none}", CSS)
        self.assertIn("@media(max-width:760px)", CSS)
        self.assertIn(".q-mobile-cta{display:flex", CSS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
