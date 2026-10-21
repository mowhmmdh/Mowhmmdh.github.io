"""Guard the 404 page against stylesheet-cascade regressions."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "404.html").read_text(encoding="utf-8")
CSS_LINKS = re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)', HTML)


class VisualStylesheetCascadeTests(unittest.TestCase):
    def test_404_uses_only_the_canonical_shared_stylesheets(self):
        self.assertEqual(
            CSS_LINKS,
            ["/assets/site-bundle.css", "/assets/site-final-quality-2026.css"],
            "404 should not stack legacy global override layers",
        )

    def test_404_retains_accessible_error_content(self):
        self.assertIn('id="main-content"', HTML)
        self.assertIn('aria-labelledby="error-title"', HTML)
        self.assertIn('href="/"', HTML)
        self.assertIn('id="skip-to-content"', HTML)

    def test_404_retains_fa_rtl_document_semantics(self):
        self.assertRegex(HTML, r'<html[^>]*lang="fa"[^>]*dir="rtl"')

    def test_canonical_stylesheet_assets_exist(self):
        for href in CSS_LINKS:
            with self.subTest(href=href):
                self.assertTrue((ROOT / href.lstrip("/")).is_file())


if __name__ == "__main__":
    unittest.main()
