"""Repository-wide source contract for the shared light theme."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = (ROOT / "assets/site-bundle.css").read_text(encoding="utf-8")
THEME = (ROOT / "assets/site-theme.js").read_text(encoding="utf-8")
BROWSER_QA = (ROOT / "scripts/sitewide-light-theme-browser-qa.cjs").read_text(encoding="utf-8")
PAGES = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "node_modules" not in p.parts and p.name != "404.html")


class SitewideLightThemeTests(unittest.TestCase):
    def test_repository_html_inventory_is_comprehensive(self):
        self.assertGreaterEqual(len(PAGES), 90, "Expected the full bilingual site inventory to be audited")

    def test_all_content_pages_load_shared_theme_and_stylesheet(self):
        missing = []
        for path in PAGES:
            source = path.read_text(encoding="utf-8")
            if "/assets/site-theme.js" not in source or "/assets/site-bundle.css" not in source:
                missing.append(path.relative_to(ROOT).as_posix())
        self.assertEqual(missing, [], "Pages missing shared theme assets: " + ", ".join(missing))

    def test_shared_theme_script_sets_both_theme_selectors(self):
        self.assertIn("root.dataset.theme='light'", THEME)
        self.assertIn("root.classList.toggle('theme-light',light)", THEME)
        self.assertIn("localStorage.getItem(KEY)", THEME)
        self.assertIn("localStorage.setItem(KEY,next)", THEME)

    def test_theme_stability_import_is_validly_placed_before_rules(self):
        first_rule = re.search(r"(?m)^(?!\s*(?:/\*|\*|$))", BUNDLE)
        self.assertTrue(BUNDLE.lstrip().startswith("@import url('/assets/theme-stability-2026.css');"))
        self.assertIsNotNone(first_rule)

    def test_light_theme_maps_every_shared_token_namespace(self):
        required = (
            "--bg:#f5f7fb", "--surface:#fff", "--text:#172638", "--muted:#526477",
            "--u-bg:#f5f7fb", "--u-text:#172638", "--mha-bg:#f5f7fb",
            "--mha-text:#172638", "--ui-bg:#f5f7fb", "--ui-text:#172638",
            "--q-panel:#fff", "--q-text:#172638", "--adv-border:#d7e0e9",
        )
        for token in required:
            with self.subTest(token=token):
                self.assertIn(token, BUNDLE)

    def test_light_theme_covers_shared_legacy_surfaces_and_navigation(self):
        for selector in (".card", ".service-card", ".project-card", ".post-card",
                         ".cluster", ".content", ".article", ".vt-card",
                         ".site-nav", ".about-nav", ".theme-toggle"):
            with self.subTest(selector=selector):
                self.assertIn(selector, BUNDLE[BUNDLE.rfind("/* Site-wide light theme contract"):])

    def test_dark_mode_defaults_and_persian_english_document_contracts_remain(self):
        self.assertIn("theme(saved||'dark')", THEME)
        self.assertIn('<html lang="fa" dir="rtl">', (ROOT / "index.html").read_text(encoding="utf-8"))
        self.assertIn('<html lang="en" dir="ltr">', (ROOT / "en.html").read_text(encoding="utf-8"))

    def test_browser_audit_uses_snapshot_scoped_theme_toggle(self):
        self.assertIn("hasToggle:!!toggle", BROWSER_QA)
        self.assertIn("if(snapshot.hasToggle)", BROWSER_QA)
        self.assertIn("const themeToggle = page.locator('.theme-toggle').first();", BROWSER_QA)
        self.assertEqual(BROWSER_QA.count("await themeToggle.click();"), 2)
        self.assertNotRegex(BROWSER_QA, r"(?m)^\\s*if\\s*\\(\\s*toggle\\s*\\)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
