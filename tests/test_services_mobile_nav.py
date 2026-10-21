"""Regression tests for the Persian services page mobile navigation."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "services.html").read_text(encoding="utf-8")


class ServicesMobileNavigationTests(unittest.TestCase):
    def test_primary_navigation_links_remain_present(self):
        expected = (
            'href="/"',
            'href="/vintech.html"',
            'href="/projects.html"',
            'href="/blog/"',
            'href="/about.html"',
        )
        header = re.search(r'<header class="wrap nav">(.*?)</header>', HTML, re.S)
        self.assertIsNotNone(header, "Primary navigation header should exist")
        for href in expected:
            with self.subTest(href=href):
                self.assertIn(href, header.group(1))

    def test_mobile_rule_does_not_hide_navigation_container(self):
        self.assertNotRegex(
            HTML,
            r"@media\s*\(max-width\s*:\s*720px\)\s*\{[^}]*\.nav\s+div\s*\{\s*display\s*:\s*none",
        )

    def test_mobile_navigation_wraps_and_keeps_links_visible(self):
        self.assertRegex(HTML, r"@media\s*\(max-width\s*:\s*720px\)")
        self.assertRegex(HTML, r"\.nav div\s*\{[^}]*display\s*:\s*flex")
        self.assertRegex(HTML, r"flex-wrap\s*:\s*wrap")
        self.assertRegex(HTML, r"\.nav div a\s*\{[^}]*margin-inline-start\s*:\s*0")

    def test_page_preserves_persian_rtl_semantics(self):
        self.assertRegex(HTML, r'<html[^>]*lang="fa"[^>]*dir="rtl"')


if __name__ == "__main__":
    unittest.main()
