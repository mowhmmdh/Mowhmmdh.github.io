"""Regression tests for the VinTech stylesheet cascade."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "vintech.html").read_text(encoding="utf-8")
LINKS = re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)', HTML)


def declarations(path, selector, property_name):
    css = (ROOT / path).read_text(encoding="utf-8")
    values = []
    for current, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        current = " ".join(current.strip().split())
        if current != selector:
            continue
        for item in body.split(";"):
            name, separator, value = item.partition(":")
            if separator and name.strip().lower() == property_name:
                values.append(value.strip())
    return values


class VinTechCascadeTests(unittest.TestCase):
    def test_signature_layer_follows_legacy_fix(self):
        self.assertLess(
            LINKS.index("/assets/vintech-final-fix-2026.css"),
            LINKS.index("/assets/vintech-signature-2026.css"),
        )

    def test_stylesheet_assets_exist(self):
        for href in LINKS:
            with self.subTest(href=href):
                self.assertTrue((ROOT / href.lstrip("/")).is_file())

    def test_later_signature_values_are_not_blocked(self):
        cases = [
            ("body.vt-page .vt-logo,body.vintech-modern .vt-logo", "color", "#f7fbff"),
            ("body.vt-page .vt-logo span,body.vintech-modern .vt-logo span", "color", "var(--vts-gold)"),
            ("body.vt-page .vt-links a,body.vintech-modern .vt-links a", "color", "#b3c2d4"),
            ("body.vt-page .vt-btn,body.vintech-modern .vt-btn", "color", "var(--vts-text)"),
            ("body.vt-page .vt-btn,body.vintech-modern .vt-btn", "background", "rgba(255,255,255,.025)"),
            ("body.vt-page .vt-btn.primary,body.vintech-modern .vt-btn.primary", "background", "linear-gradient(130deg,#f0ce7b,#d6a33f)"),
            ("body.vt-page .vt-trust span,body.vintech-modern .vt-trust span", "color", "#b1c0d2"),
        ]
        for selector, prop, expected in cases:
            with self.subTest(selector=selector, property=prop):
                earlier = declarations("assets/vintech-final-fix-2026.css", selector, prop)
                later = declarations("assets/vintech-signature-2026.css", selector, prop)
                self.assertTrue(earlier)
                self.assertFalse(any("!important" in value.lower() for value in earlier))
                self.assertTrue(later)
                self.assertEqual(later[-1], expected)


if __name__ == "__main__":
    unittest.main()
