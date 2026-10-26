from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog" / "dhcp-snooping-dai-network-security.html"


class NavigationParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.main_nav_label = None
        self.in_main_nav = False
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())
        if tag == "nav" and "nav" in classes and "auto-breadcrumb" not in classes:
            self.in_main_nav = True
            self.main_nav_label = attrs.get("aria-label")
        elif tag == "nav" and "auto-breadcrumb" in classes:
            self.in_main_nav = False
        elif tag == "a" and self.in_main_nav:
            self.links.append(attrs.get("href"))

    def handle_endtag(self, tag):
        if tag == "nav":
            self.in_main_nav = False


class DhcpArticleMobileNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = PAGE.read_text(encoding="utf-8")

    def test_mobile_breakpoint_does_not_hide_primary_navigation(self):
        self.assertNotIn(".nav-links{display:none}", self.source)
        self.assertIn(
            ".nav .nav-links{display:flex;flex-wrap:wrap;gap:8px;"
            "max-height:none;overflow:visible;opacity:1;pointer-events:auto;"
            "justify-content:flex-start}",
            self.source,
        )

    def test_primary_navigation_has_accessible_label_and_destinations(self):
        parser = NavigationParser()
        parser.feed(self.source)
        self.assertEqual(parser.main_nav_label, "ناوبری اصلی")
        for href in ("/vintech.html", "/services.html", "/projects.html", "/blog/",
                     "/en-blog/dhcp-snooping-dai-network-security.html"):
            with self.subTest(href=href):
                self.assertIn(href, parser.links)

    def test_persian_rtl_document_semantics_are_preserved(self):
        self.assertRegex(self.source, r'<html\b[^>]*lang=["\']fa["\'][^>]*dir=["\']rtl["\']')
        self.assertIn('id="main-content"', self.source)


if __name__ == "__main__":
    unittest.main()
