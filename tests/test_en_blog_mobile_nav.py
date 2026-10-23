"""Regression tests for the English blog's responsive primary navigation."""
from pathlib import Path
import re
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = REPOSITORY_ROOT / "en-blog.html"


class EnglishBlogMobileNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE_PATH.read_text(encoding="utf-8")
        style_match = re.search(r"<style>(.*?)</style>", cls.html, re.DOTALL)
        if style_match is None:
            raise AssertionError("Expected the page's inline stylesheet.")
        cls.css = style_match.group(1)

    def test_mobile_breakpoint_does_not_hide_primary_navigation(self):
        mobile_match = re.search(
            r"@media\s*\(\s*max-width\s*:\s*800px\s*\)\s*\{(.*)\}\s*$",
            self.css,
            re.DOTALL,
        )
        self.assertIsNotNone(mobile_match, "Expected a max-width: 800px media rule.")
        mobile_css = mobile_match.group(1)

        self.assertNotRegex(
            mobile_css,
            r"\.nav(?:\s+div|>div)\s*\{[^}]*display\s*:\s*none",
            "Primary navigation links must not be hidden at the mobile breakpoint.",
        )
        self.assertRegex(mobile_css, r"\.nav\s*\{[^}]*flex-wrap\s*:\s*wrap")
        self.assertRegex(
            mobile_css,
            r"\.nav>div\s*\{[^}]*display\s*:\s*flex[^}]*flex-wrap\s*:\s*wrap",
        )

    def test_primary_navigation_destinations_are_preserved(self):
        nav_match = re.search(
            r'<header class="nav">(.*?)</header>', self.html, re.DOTALL
        )
        self.assertIsNotNone(nav_match, "Expected the primary navigation header.")
        nav = nav_match.group(1)
        for href in (
            "/en-vintech.html",
            "/en-services.html",
            "/en-projects.html",
            "/en-about.html",
            "/",
        ):
            with self.subTest(href=href):
                self.assertIn(f'href="{href}"', nav)

    def test_skip_link_and_main_landmark_remain_available(self):
        self.assertIn('href="#main-content"', self.html)
        self.assertIn('id="main-content"', self.html)


if __name__ == "__main__":
    unittest.main()
