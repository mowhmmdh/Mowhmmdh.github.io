"""Regression tests for legacy bilingual VinTech insight pages in light mode."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "assets/site-bundle.css").read_text(encoding="utf-8")
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
                self.assertRegex(html, r'\.ey\\{color:#d9ad55')
                self.assertRegex(html, r'\.matrix strong\\{[^}]*color:#eaf2fb')

    def test_light_theme_overrides_legacy_inline_ink_and_matrix_surface(self):
        self.assertRegex(
            CSS,
            r"html\\.theme-light\\s+:where\\(\\.ey,\\.matrix strong\\)\\s*\\{\\s*color:var\\(--accent2\\)!important",
        )
        self.assertRegex(
            CSS,
            r"html\\.theme-light\\s+\\.matrix div\\s*\\{\\s*background:var\\(--surface2\\)!important;\\s*border-color:var\\(--line\\)!important",
        )

    def test_light_theme_text_color_meets_wcag_aa_on_page_surfaces(self):
        # The prior hard-coded #eaf2fb matrix heading on the forced white article
        # surface measured only about 1.13:1 and was effectively unreadable.
        self.assertLess(contrast_ratio("#eaf2fb", "#ffffff"), 4.5)
        for surface in ("#ffffff", "#edf2f7", "#f6f8fb"):
            with self.subTest(surface=surface):
                self.assertGreaterEqual(contrast_ratio("#8b5e00", surface), 4.5)


if __name__ == "__main__":
    unittest.main()
