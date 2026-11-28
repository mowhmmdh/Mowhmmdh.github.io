"""Regression tests for Persian and English About navigation visibility."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "assets/site-bundle.css").read_text(encoding="utf-8")
ABOUT = (ROOT / "about.html").read_text(encoding="utf-8")
EN_ABOUT = (ROOT / "en-about.html").read_text(encoding="utf-8")
PROFILE = (ROOT / "profile.html").read_text(encoding="utf-8")
BROWSER_QA = (ROOT / "scripts/about-mobile-navigation-browser-qa.cjs").read_text(encoding="utf-8")


class AboutMobileNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        start = CSS.rfind("@media(max-width:900px){")
        end = CSS.find("\n}", start)
        cls.navigation_block = CSS[start:end] if start >= 0 and end >= 0 else ""

    def test_persian_and_english_about_navs_override_collapsed_mobile_state(self):
        self.assertTrue(self.navigation_block, "shared <=900px navigation rule is missing")
        compact = "".join(self.navigation_block.split())
        for fragment in (
            ".about-nav.about-nav-links,.en-nav.en-nav-links{",
            "display:flex;",
            "flex-wrap:nowrap;",
            "overflow-x:auto;",
            "max-height:none;",
            "opacity:1;",
            "pointer-events:auto;",
        ):
            self.assertIn(fragment, compact, f"responsive About navigation is missing {fragment}")

    def test_persian_about_page_keeps_rtl_and_link_row(self):
        self.assertIn('<html lang="fa" dir="rtl">', ABOUT)
        self.assertIn('class="about-nav-links"', ABOUT)
        self.assertIn('aria-label="ناوبری اصلی"', ABOUT)

    def test_english_about_page_keeps_ltr_and_scrollable_link_row(self):
        self.assertIn('<html lang="en" dir="ltr">', EN_ABOUT)
        self.assertIn('class="en-nav-links"', EN_ABOUT)
        self.assertNotIn(".en-nav div{display:none}", EN_ABOUT)

    def test_navigation_backdrop_is_centered_and_cannot_expand_document_width(self):
        selector = ".site-nav:before,.nav:before,.about-nav:before,.vt-nav:before{"
        start = CSS.find(selector)
        end = CSS.find("}", start)
        self.assertGreaterEqual(start, 0, "shared navigation backdrop rule is missing")
        rule = CSS[start:end]
        self.assertIn("left:50%", rule)
        self.assertIn("right:auto", rule)
        self.assertIn("width:100vw", rule)
        self.assertIn("transform:translateX(-50%)", rule)
        self.assertNotIn("inset:0 -100vw", rule)

    def test_browser_qa_fails_on_document_width_and_visible_element_overflow(self):
        self.assertIn("documentScrollWidth <= documentState.viewportWidth + 1", BROWSER_QA)
        self.assertIn("documentState.overflowCandidates.length === 0", BROWSER_QA)
        self.assertIn("overflowCandidates", BROWSER_QA)

    def test_profile_mobile_menu_and_theme_controls_remain_present(self):
        self.assertIn('class="mobile-menu"', PROFILE)
        self.assertIn('class="theme-toggle"', PROFILE)
        self.assertIn('/assets/site-theme.js', PROFILE)


if __name__ == "__main__":
    unittest.main()
