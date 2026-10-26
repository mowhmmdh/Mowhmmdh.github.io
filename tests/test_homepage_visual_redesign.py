"""Regression checks for the homepage-only visual redesign.

These source-level tests protect the page contract and prevent a legacy stylesheet
from being injected after the redesign and silently winning the CSS cascade.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
HOME = (ROOT / "index.html").read_text(encoding="utf-8")
EN_HOME = (ROOT / "en.html").read_text(encoding="utf-8")
HOME_CSS = (ROOT / "assets/home-visual-redesign-2026.css").read_text(encoding="utf-8")
QUALITY_JS = (ROOT / "assets/site-final-quality-2026.js").read_text(encoding="utf-8")
THEME_JS = (ROOT / "assets/site-theme.js").read_text(encoding="utf-8")


class HomepageVisualRedesignTests(unittest.TestCase):
    def test_redesign_stylesheet_is_loaded_once_after_shared_home_layers(self):
        href = "/assets/home-visual-redesign-2026.css"
        link = '<link rel="stylesheet" href="' + href + '" data-home-visual-redesign>'
        self.assertEqual(HOME.count(href), 1, "homepage redesign stylesheet must be linked exactly once")
        self.assertIn(link, HOME, "the runtime loader needs a reliable marker")
        self.assertEqual(HOME.count("/assets/site-bundle.css"), 1)
        self.assertLess(HOME.index("/assets/site-final-quality-2026.css"), HOME.index(href))

    def test_legacy_elite_layer_yields_to_explicit_homepage_redesign(self):
        guard = "if (document.querySelector('link[data-home-visual-redesign]')) return;"
        self.assertIn(guard, QUALITY_JS)
        self.assertLess(QUALITY_JS.index(guard), QUALITY_JS.index("link.href = '/assets/elite-home-2026.css'"))
        self.assertIn("link.dataset.eliteHomeVisual = 'true'", QUALITY_JS)

    def test_persian_homepage_seo_language_and_accessibility_contract_is_preserved(self):
        self.assertTrue(HOME.startswith('<!doctype html><html lang="fa" dir="rtl">'))
        self.assertEqual(HOME.count("<title>"), 1)
        self.assertEqual(HOME.count('<meta name="description"'), 1)
        self.assertEqual(HOME.count('<link rel="canonical"'), 1)
        self.assertIn('href="https://mowhmmdh.github.io/"', HOME)
        self.assertIn('hreflang="en"', HOME)
        self.assertIn('id="main-content"', HOME)
        self.assertIn('class="skip-link"', HOME)
        self.assertIn('src="/images/profile.webp"', HOME)
        self.assertIn('type="application/ld+json"', HOME)
        for href in ("/projects.html", "/services.html", "/vintech.html", "/en.html"):
            self.assertIn('href="' + href + '"', HOME)

    def test_redesign_has_responsive_reduced_motion_and_focus_rules(self):
        self.assertIn("@media(max-width:900px)", HOME_CSS)
        self.assertIn("@media(max-width:600px)", HOME_CSS)
        self.assertIn("@media(prefers-reduced-motion:reduce)", HOME_CSS)
        self.assertIn(".mh-home :focus-visible", HOME_CSS)
        self.assertNotIn("@import url(", HOME_CSS)
        self.assertNotIn("@media(prefers-color-scheme:light)", HOME_CSS)
        self.assertIn("html.theme-light .mh-home", HOME_CSS)
        self.assertIn("theme(saved||'dark')", THEME_JS)

    def test_lower_orbit_nodes_are_lifted_above_the_terminal_panel(self):
        self.assertIn(".mh-home .mh-node-c,.mh-home .mh-node-d{bottom:32%}", HOME_CSS)

    def test_english_homepage_remains_ltr_and_outside_persian_redesign_scope(self):
        self.assertTrue(EN_HOME.startswith('<!doctype html><html lang="en" dir="ltr">'))
        self.assertNotIn("/assets/home-visual-redesign-2026.css", EN_HOME)
        self.assertNotIn('<body class="mh-home"', EN_HOME)


if __name__ == "__main__":
    unittest.main(verbosity=2)
