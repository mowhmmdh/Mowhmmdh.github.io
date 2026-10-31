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
BUNDLE_CSS = (ROOT / "assets/site-bundle.css").read_text(encoding="utf-8")
QUALITY_JS = (ROOT / "assets/site-final-quality-2026.js").read_text(encoding="utf-8")
THEME_JS = (ROOT / "assets/site-theme.js").read_text(encoding="utf-8")

def _relative_luminance(hex_color):
    """Return WCAG relative luminance for a #RRGGBB sRGB color."""
    channels = [int(hex_color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
              for channel in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def _contrast_ratio(foreground, background):
    first = _relative_luminance(foreground)
    second = _relative_luminance(background)
    lighter, darker = max(first, second), min(first, second)
    return (lighter + 0.05) / (darker + 0.05)



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

    def test_reduced_motion_disables_inherited_animations_and_pseudo_elements(self):
        # The shared bundle animates the orbit, rings, core, core pseudo-element, and nodes.
        for animation in (
            "animation:mh-float 7s ease-in-out infinite",
            "animation:mh-spin 18s linear infinite",
            "animation:mh-pulse 3.4s ease-in-out infinite",
            "animation:mh-spin-rev 20s linear infinite",
            "animation:mh-node 4s ease-in-out infinite",
        ):
            self.assertIn(animation, BUNDLE_CSS)

        reduced_motion_rule = (
            "@media(prefers-reduced-motion:reduce){"
            ".mh-home *, .mh-home *::before, .mh-home *::after{"
            "animation:none!important;"
            "transition:none!important;"
            "scroll-behavior:auto!important}"
            "}"
        )
        self.assertIn(reduced_motion_rule, HOME_CSS)

    def test_homepage_navigation_hides_the_redundant_mobile_menu_toggle(self):
        # The redesign deliberately keeps navigation links visible and wrapping on small screens.
        # A visible toggle would change aria-expanded but would not collapse or reveal these links.
        self.assertIn(".mh-home .mobile-menu{display:none}", HOME_CSS)
        self.assertIn(".mh-home .mh-nav-links{display:flex", HOME_CSS)
        self.assertIn(".mh-home .mh-nav-links{order:3;width:100%", HOME_CSS)

    def test_lower_orbit_nodes_are_lifted_above_the_terminal_panel(self):
        self.assertIn(".mh-home .mh-node-c,.mh-home .mh-node-d{bottom:32%}", HOME_CSS)

    def test_english_homepage_remains_ltr_and_outside_persian_redesign_scope(self):
        self.assertTrue(EN_HOME.startswith('<!doctype html><html lang="en" dir="ltr">'))
        self.assertNotIn("/assets/home-visual-redesign-2026.css", EN_HOME)
        self.assertNotIn('<body class="mh-home"', EN_HOME)

    def test_light_theme_small_labels_meet_wcag_aa_contrast(self):
        muted_rule = (
            "html.theme-light .mh-home .mh-node small,\n"
            "html.theme-light .mh-home .mh-proofbar small,\n"
            "html.theme-light .mh-home .mh-card-index,\n"
            "html.theme-light .mh-home .mh-terminal-top b,\n"
            "html.theme-light .mh-home .mh-identity-card span {color:#40566f}"
        )
        self.assertIn(muted_rule, HOME_CSS)
        self.assertIn(
            "html.theme-light .mh-home .mh-terminal code span {color:#245a85}",
            HOME_CSS,
        )
        # Check against the palest backgrounds used by the light-theme surfaces.
        self.assertGreaterEqual(_contrast_ratio("#40566f", "#edf3f8"), 4.5)
        self.assertGreaterEqual(_contrast_ratio("#245a85", "#f0f5f9"), 4.5)

    def test_light_theme_core_label_meets_wcag_aa_contrast(self):
        core_rule = "html.theme-light .mh-home .mh-core small{color:#40566f}"
        self.assertIn(core_rule, HOME_CSS)
        # The core uses a white-to-pale-blue gradient in light theme.
        self.assertGreaterEqual(_contrast_ratio("#40566f", "#ffffff"), 4.5)
        self.assertGreaterEqual(_contrast_ratio("#40566f", "#e4eef8"), 4.5)

    def test_light_theme_footer_metadata_meets_wcag_aa_contrast(self):
        footer_rule = (
            "html.theme-light .mh-home .mh-footer>div:first-child span{color:#586b80}\n"
            "html.theme-light .mh-home .legal-footer-2026{color:#586b80;border-color:rgba(35,58,84,.12)}"
        )
        self.assertIn(footer_rule, HOME_CSS)
        # The light-theme page background is #f4f7fb; small footer text needs 4.5:1.
        self.assertGreaterEqual(_contrast_ratio("#586b80", "#f4f7fb"), 4.5)


if __name__ == "__main__":
    unittest.main(verbosity=2)
