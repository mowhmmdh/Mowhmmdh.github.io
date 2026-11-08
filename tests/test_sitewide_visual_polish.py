"""Regression tests for the shared visual layer used by legacy site templates."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "assets/site-bundle.css").read_text(encoding="utf-8")


def luminance(color):
    channels = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [
        value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4
        for value in channels
    ]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast(foreground, background):
    first, second = luminance(foreground), luminance(background)
    return (max(first, second) + 0.05) / (min(first, second) + 0.05)


class SitewideVisualPolishTests(unittest.TestCase):
    def test_light_theme_repairs_legacy_inline_template_text(self):
        self.assertIn("html.theme-light :is(.hero p,.hero-copy,.lead", CSS)
        self.assertIn("html.theme-light :is(.card p,.post-card p,.project-card p", CSS)
        self.assertIn("color:var(--muted)!important", CSS)
        self.assertIn("color:#805300", CSS)

    def test_light_theme_surfaces_are_consistent_across_legacy_cards(self):
        self.assertIn("html.theme-light :is(.card,.post-card,.project-card,.service-card", CSS)
        self.assertIn("linear-gradient(145deg,var(--surface)", CSS)
        self.assertIn("border-color:var(--line)", CSS)

    def test_light_theme_article_reading_surfaces_are_consistent(self):
        self.assertIn("html.theme-light :is(.content,.article,.post-content,.case-content)", CSS)
        self.assertIn("html.theme-light :is(.content pre,.article pre", CSS)
        self.assertIn("background:#152333", CSS)

    def test_mobile_grids_collapse_without_horizontal_overflow(self):
        self.assertIn("@media(max-width:760px)", CSS)
        self.assertIn("@media(max-width:520px)", CSS)
        self.assertIn("grid-template-columns:minmax(0,1fr)", CSS)
        self.assertIn("overflow-wrap:anywhere", CSS)

    def test_light_theme_small_accent_labels_meet_wcag_aa(self):
        foreground = "#805300"
        for background in ("#ffffff", "#edf2f7", "#f6f8fb", "#edf3f9"):
            self.assertGreaterEqual(contrast(foreground, background), 4.5)


    def test_legacy_light_theme_overrides_cover_low_contrast_components(self):
        services = (ROOT / "services.html").read_text(encoding="utf-8")
        projects = (ROOT / "projects.html").read_text(encoding="utf-8")
        blog = (ROOT / "blog" / "index.html").read_text(encoding="utf-8")

        for html in (services, projects, blog):
            self.assertIn('/assets/site-bundle.css', html)
            self.assertIn('/assets/site-theme.js', html)

        self.assertIn(".service-card h2{", services)
        self.assertIn(".project-card h2{", projects)
        self.assertIn(".project-card a{", projects)
        self.assertIn(".architecture span{", projects)
        self.assertIn(".cluster a{", blog)

        self.assertIn("html.theme-light :is(.service-card h2,.project-card h2)", CSS)
        self.assertIn("html.theme-light :is(.project-card a,.cluster a)", CSS)
        self.assertIn("html.theme-light .architecture span", CSS)
        self.assertGreaterEqual(contrast("#15212d", "#ffffff"), 4.5)
        self.assertGreaterEqual(contrast("#805300", "#edf2f7"), 4.5)
        self.assertGreaterEqual(contrast("#596979", "#edf2f7"), 4.5)

    def test_shared_design_does_not_change_language_or_page_content(self):
        for path, expected in (
            ("index.html", 'lang="fa" dir="rtl"'),
            ("about.html", 'lang="fa" dir="rtl"'),
            ("en.html", 'lang="en" dir="ltr"'),
            ("en-services.html", 'lang="en" dir="ltr"'),
        ):
            html = (ROOT / path).read_text(encoding="utf-8")
            self.assertIn(expected, html)
            self.assertIn("/assets/site-bundle.css", html)

    def test_shared_navigation_backdrop_stays_within_the_viewport(self):
        selector = ".site-nav:before,.nav:before,.about-nav:before,.vt-nav:before"
        match = re.search(re.escape(selector) + r"\{([^}]*)\}", CSS)
        self.assertIsNotNone(match, "Expected the shared navigation backdrop rule.")
        rule = match.group(1)
        self.assertRegex(rule, r"\binset-block\s*:\s*0\b")
        self.assertRegex(rule, r"\bleft\s*:\s*50%")
        self.assertRegex(rule, r"\bwidth\s*:\s*100vw")
        self.assertRegex(rule, r"\btransform\s*:\s*translateX\(-50%\)")
        self.assertNotRegex(rule, r"\binset\s*:\s*0\s+-100vw")

    def test_browser_qa_targets_the_shared_homepage_navigation(self):
        workflow = (ROOT / ".github" / "workflows" /
                    "sitewide-nav-overflow-browser-qa.yml").read_text(encoding="utf-8")
        script = (ROOT / "scripts" / "shared-nav-backdrop-qa.cjs").read_text(encoding="utf-8")

        self.assertIn('"index.html"', workflow)
        self.assertIn('"scripts/shared-nav-backdrop-qa.cjs"', workflow)
        self.assertNotIn('"en-blog.html"', workflow)
        self.assertIn("new URL('/', previewBase)", script)
        self.assertIn("getComputedStyle(nav, '::before')", script)
        self.assertIn("document.documentElement.scrollWidth", script)

    def test_browser_qa_exercises_mobile_menu_at_multiple_widths(self):
        script = (ROOT / "scripts" / "shared-nav-backdrop-qa.cjs").read_text(encoding="utf-8")
        for width in ("1440", "390", "320"):
            with self.subTest(width=width):
                self.assertIn("width: " + width, script)
        self.assertIn("page.locator('header .site-nav .mobile-menu').click()", script)
        self.assertIn("page.keyboard.press('Escape')", script)
        self.assertIn("aria-expanded", script)


if __name__ == "__main__":
    unittest.main(verbosity=2)
