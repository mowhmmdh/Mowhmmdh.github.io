"""Regression tests for the Persian blog index mobile navigation."""
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog" / "index.html"
THEME_SCRIPT = ROOT / "assets" / "site-theme.js"
BUNDLE = ROOT / "assets" / "site-bundle.css"


class PrimaryNavigationParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_primary_nav = False
        self.nav_attrs = {}
        self.links = []
        self.buttons = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())

        if tag == "nav" and "auto-breadcrumb" in classes:
            self.in_primary_nav = False
            return

        if tag == "nav" and "nav" in classes:
            self.in_primary_nav = True
            self.nav_attrs = attrs
            return

        if self.in_primary_nav and tag == "a":
            self.links.append(attrs.get("href"))
        elif self.in_primary_nav and tag == "button":
            self.buttons.append(attrs)

    def handle_endtag(self, tag):
        if tag == "nav" and self.in_primary_nav:
            self.in_primary_nav = False


class BlogIndexMobileNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = PAGE.read_text(encoding="utf-8")
        cls.theme_script = THEME_SCRIPT.read_text(encoding="utf-8")
        cls.bundle = BUNDLE.read_text(encoding="utf-8")
        cls.parser = PrimaryNavigationParser()
        cls.parser.feed(cls.page)

    def test_primary_navigation_has_accessible_mobile_menu_button(self):
        self.assertEqual(self.parser.nav_attrs.get("aria-label"), "ناوبری اصلی")
        menu_buttons = [
            button for button in self.parser.buttons
            if "mobile-menu" in (button.get("class") or "").split()
        ]
        self.assertEqual(len(menu_buttons), 1)
        self.assertEqual(menu_buttons[0].get("aria-label"), "باز کردن منو")
        self.assertEqual(menu_buttons[0].get("aria-expanded"), "false")

    def test_primary_navigation_destinations_are_preserved(self):
        for href in ("/vintech.html", "/services.html", "/projects.html",
                     "/about.html", "/en-blog.html"):
            with self.subTest(href=href):
                self.assertIn(href, self.parser.links)

    def test_shared_menu_script_and_responsive_styles_support_generic_nav(self):
        self.assertIn("nav.querySelector('.mobile-menu')", self.theme_script)
        self.assertIn("nav.querySelector('.nav-links,.about-nav-links,.en-nav-links')",
                      self.theme_script)
        self.assertRegex(
            self.bundle,
            r"@media\(max-width:900px\)[\s\S]*?\.mobile-menu\{display:inline-grid\}",
        )
        self.assertIn(".nav.menu-open .nav-links", self.bundle)

    def test_persian_rtl_and_skip_navigation_are_preserved(self):
        self.assertRegex(self.page, r'<html\b[^>]*lang=["\']fa["\'][^>]*dir=["\']rtl["\']')
        self.assertIn('href="#main-content"', self.page)
        self.assertIn('id="main-content"', self.page)


if __name__ == "__main__":
    unittest.main()
