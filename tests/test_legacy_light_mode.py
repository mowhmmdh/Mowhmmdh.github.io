"""Regression tests for legacy bilingual VinTech insight pages in light mode."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "assets/site-bundle.css").read_text(encoding="utf-8")
BROWSER_QA = (ROOT / "scripts/about-mobile-navigation-browser-qa.cjs").read_text(encoding="utf-8")
PAGES = {
    "Persian": (ROOT / "vintech/insights/cctv-ip-camera-security.html", "fa", "rtl"),
    "English": (ROOT / "en-vintech/insights/cctv-ip-camera-security.html", "en", "ltr"),
}


def relative_luminance(hex_color):
    channels = [int(hex_color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [
        channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
        for channel in channels
    ]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast_ratio(first, second):
    luminance_a = relative_luminance(first)
    luminance_b = relative_luminance(second)
    lighter, darker = max(luminance_a, luminance_b), min(luminance_a, luminance_b)
    return (lighter + 0.05) / (darker + 0.05)


class LegacyLightModeTests(unittest.TestCase):
    def test_bilingual_insight_pages_expose_the_shared_theme_controller(self):
        for label, (path, language, direction) in PAGES.items():
            with self.subTest(page=label):
                html = path.read_text(encoding="utf-8")
                self.assertIn(f'<html lang="{language}" dir="{direction}">', html)
                self.assertIn('class="theme-toggle"', html)
                self.assertIn('/assets/site-theme.js', html)
                self.assertIn(".ey{color:#d9ad55", html)
                self.assertIn(".matrix strong{display:block;color:#eaf2fb", html)

    def test_light_theme_overrides_legacy_inline_ink_and_matrix_surface(self):
        self.assertIn(
            "html.theme-light :where(.ey,.matrix strong){\n  color:var(--accent2)!important;",
            CSS,
        )
        self.assertIn(
            "html.theme-light .matrix div{\n  background:var(--surface2)!important;\n  border-color:var(--line)!important;",
            CSS,
        )

    def test_browser_qa_checks_bilingual_article_light_mode_contrast(self):
        self.assertIn("/vintech/insights/cctv-ip-camera-security.html", BROWSER_QA)
        self.assertIn("/en-vintech/insights/cctv-ip-camera-security.html", BROWSER_QA)
        self.assertIn("checkLegacyArticleTheme", BROWSER_QA)
        self.assertIn("eyebrowContrast >= 4.5", BROWSER_QA)
        self.assertIn("matrixHeadingContrast >= 4.5", BROWSER_QA)

    def test_light_theme_text_color_meets_wcag_aa_on_page_surfaces(self):
        # The prior hard-coded #eaf2fb matrix heading on the forced white article
        # surface measured only about 1.13:1 and was effectively unreadable.
        self.assertLess(contrast_ratio("#eaf2fb", "#ffffff"), 4.5)
        for surface in ("#ffffff", "#edf2f7", "#f6f8fb"):
            with self.subTest(surface=surface):
                self.assertGreaterEqual(contrast_ratio("#8b5e00", surface), 4.5)


if __name__ == "__main__":
    unittest.main()
