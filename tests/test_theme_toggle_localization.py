"""Regression tests for language-aware, stable theme-toggle accessible names."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
THEME_SCRIPT = (ROOT / "assets" / "site-theme.js").read_text(encoding="utf-8")
PERSIAN_HOME = (ROOT / "index.html").read_text(encoding="utf-8")
ENGLISH_HOME = (ROOT / "en.html").read_text(encoding="utf-8")


class ThemeToggleLocalizationTests(unittest.TestCase):
    def test_theme_labels_follow_the_document_language(self):
        self.assertIn(
            "const english=(root.lang||'').toLowerCase().startsWith('en');",
            THEME_SCRIPT,
        )
        self.assertIn(
            "? {light:'Light theme'}",
            THEME_SCRIPT,
        )
        self.assertIn(
            ": {light:'حالت روشن'};",
            THEME_SCRIPT,
        )

    def test_toggle_name_is_stable_while_pressed_state_tracks_light_mode(self):
        self.assertIn(
            "b.setAttribute('aria-label',themeLabels.light);",
            THEME_SCRIPT,
        )
        self.assertIn(
            "b.setAttribute('aria-pressed',String(light));",
            THEME_SCRIPT,
        )
        self.assertNotIn("Enable light mode", THEME_SCRIPT)
        self.assertNotIn("Enable dark mode", THEME_SCRIPT)
        self.assertNotIn("فعال‌کردن حالت روشن", THEME_SCRIPT)
        self.assertNotIn("فعال‌کردن حالت تیره", THEME_SCRIPT)

    def test_bilingual_homepages_declare_their_language(self):
        self.assertIn('<html lang="fa" dir="rtl">', PERSIAN_HOME)
        self.assertIn('<html lang="en" dir="ltr">', ENGLISH_HOME)


if __name__ == "__main__":
    unittest.main(verbosity=2)
