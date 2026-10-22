"""Regression tests for critical page stylesheet cascades."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
ERROR_HTML = (ROOT / "404.html").read_text(encoding="utf-8")
ERROR_CSS_LINKS = re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)', ERROR_HTML)
VINTECH_HTML = (ROOT / "vintech.html").read_text(encoding="utf-8")
VINTECH_CSS_LINKS = re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)', VINTECH_HTML)


def css_rules(path):
    css = (ROOT / path).read_text(encoding="utf-8")
    for selector, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        selector = " ".join(selector.strip().split())
        if selector.startswith("@"):
            continue
        declarations = {}
        for item in body.split(";"):
            name, separator, value = item.partition(":")
            if separator:
                declarations[name.strip().lower()] = value.strip()
        yield selector, declarations


def declarations_for(path, selector, property_name):
    return [
        declarations[property_name]
        for current_selector, declarations in css_rules(path)
        if current_selector == selector and property_name in declarations
    ]


class VisualStylesheetCascadeTests(unittest.TestCase):
    def test_404_uses_only_the_canonical_shared_stylesheets(self):
        self.assertEqual(
            ERROR_CSS_LINKS,
            ["/assets/site-bundle.css", "/assets/site-final-quality-2026.css"],
            "404 should not stack legacy global override layers",
        )

    def test_404_retains_accessible_error_content(self):
        self.assertIn('id="main-content"', ERROR_HTML)
        self.assertIn('aria-labelledby="error-title"', ERROR_HTML)
        self.assertIn('href="/"', ERROR_HTML)
        self.assertIn('id="skip-to-content"', ERROR_HTML)

    def test_404_retains_fa_rtl_document_semantics(self):
        self.assertRegex(ERROR_HTML, r'<html[^>]*lang="fa"[^>]*dir="rtl"')

    def test_404_canonical_stylesheet_assets_exist(self):
        for href in ERROR_CSS_LINKS:
            with self.subTest(href=href):
                self.assertTrue((ROOT / href.lstrip("/")).is_file())

    def test_vintech_signature_layer_loads_after_legacy_fix_layer(self):
        self.assertIn("/assets/vintech-final-fix-2026.css", VINTECH_CSS_LINKS)
        self.assertIn("/assets/vintech-signature-2026.css", VINTECH_CSS_LINKS)
        self.assertLess(
            VINTECH_CSS_LINKS.index("/assets/vintech-final-fix-2026.css"),
            VINTECH_CSS_LINKS.index("/assets/vintech-signature-2026.css"),
        )

    def test_vintech_stylesheet_assets_exist(self):
        for href in VINTECH_CSS_LINKS:
            with self.subTest(href=href):
                self.assertTrue((ROOT / href.lstrip("/")).is_file())

    def test_signature_design_values_are_not_blocked_by_important(self):
        cases = [
            ("body.vt-page .vt-logo,body.vintech-modern .vt-logo", "color", "#f7fbff"),
            ("body.vt-page .vt-logo span,body.vintech-modern .vt-logo span", "color", "var(--vts-gold)"),
            ("body.vt-page .vt-links a,body.vintech-modern .vt-links a", "color", "#b3c2d4"),
            ("body.vt-page .vt-btn,body.vintech-modern .vt-btn", "color", "var(--vts-text)"),
            ("body.vt-page .vt-btn,body.vintech-modern .vt-btn", "background", "rgba(255,255,255,.025)"),
            ("body.vt-page .vt-btn.primary,body.vintech-modern .vt-btn.primary", "background", "linear-gradient(130deg,#f0ce7b,#d6a33f)"),
            ("body.vt-page .vt-trust span,body.vintech-modern .vt-trust span", "color", "#b1c0d2"),
        ]
        fix_path = "assets/vintech-final-fix-2026.css"
        signature_path = "assets/vintech-signature-2026.css"
        for selector, property_name, expected in cases:
            with self.subTest(selector=selector, property=property_name):
                fix_values = declarations_for(fix_path, selector, property_name)
                signature_values = declarations_for(signature_path, selector, property_name)
                self.assertTrue(fix_values, "expected the legacy fix declaration to exist")
                self.assertFalse(
                    any("!important" in value.lower() for value in fix_values),
                    "legacy !important must not block the later signature layer",
                )
                self.assertTrue(signature_values, "expected the signature declaration to exist")
                self.assertEqual(signature_values[-1], expected)


if __name__ == "__main__":
    unittest.main()
