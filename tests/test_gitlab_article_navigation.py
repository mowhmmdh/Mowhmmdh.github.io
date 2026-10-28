"""Regression tests for primary navigation on the Persian GitLab CI/CD article."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog" / "gitlab-ci-cd-for-it-infrastructure.html"
CSS = ROOT / "assets" / "site-bundle.css"
THEME_SCRIPT = ROOT / "assets" / "site-theme.js"


class PrimaryNavParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.navs = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())
        if tag == "nav" and "nav" in classes and "auto-breadcrumb" not in classes:
            self.navs.append({"attrs": attrs, "links": [], "buttons": []})
            self.current = self.navs[-1]
            return
        if self.current is None:
            return
        if tag == "a":
            self.current["links"].append(attrs)
        elif tag == "button":
            self.current["buttons"].append(attrs)

    def handle_endtag(self, tag):
        if tag == "nav" and self.current is not None:
            self.current = None


class GitLabArticleNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")
        cls.css = CSS.read_text(encoding="utf-8")
        cls.theme_script = THEME_SCRIPT.read_text(encoding="utf-8")
        cls.parser = PrimaryNavParser()
        cls.parser.feed(cls.html)

    def test_article_keeps_persian_rtl_document_contract(self):
        self.assertRegex(self.html, r'<html lang="fa" dir="rtl">')

    def test_primary_navigation_and_language_switch_exist(self):
        self.assertEqual(len(self.parser.navs), 1)
        nav = self.parser.navs[0]
        self.assertTrue(nav["attrs"].get("aria-label"))
        hrefs = {link.get("href") for link in nav["links"]}
        expected = {
            "/", "/vintech.html", "/services.html", "/projects.html",
            "/about.html", "/blog/",
            "/en-blog/gitlab-ci-cd-for-it-infrastructure.html",
        }
        self.assertTrue(expected.issubset(hrefs), f"Missing navigation destinations: {expected - hrefs}")
        for href in expected:
            target = "index.html" if href == "/" else href.lstrip("/")
            if target.endswith("/"):
                target += "index.html"
            self.assertTrue((ROOT / target).is_file(), f"Navigation target does not exist: {href}")

    def test_mobile_menu_and_theme_controls_are_operable_buttons(self):
        self.assertEqual(len(self.parser.navs), 1)
        buttons = self.parser.navs[0]["buttons"]
        menu = [b for b in buttons if "mobile-menu" in (b.get("class") or "").split()]
        theme = [b for b in buttons if "theme-toggle" in (b.get("class") or "").split()]
        self.assertEqual(len(menu), 1)
        self.assertEqual(len(theme), 1)
        self.assertEqual(menu[0].get("type"), "button")
        self.assertEqual(menu[0].get("aria-expanded"), "false")
        self.assertTrue(menu[0].get("aria-label"))
        self.assertEqual(menu[0].get("aria-controls"), "gitlab-article-primary-links")
        self.assertEqual(theme[0].get("type"), "button")
        self.assertTrue(theme[0].get("aria-label"))
        self.assertEqual(theme[0].get("aria-pressed"), "false")

    def test_shared_assets_support_mobile_menu_and_theme_toggle(self):
        self.assertIn("'.site-nav,.about-nav,.en-nav,.nav,.vt-nav'", self.theme_script)
        self.assertIn("nav.querySelector('.mobile-menu')", self.theme_script)
        self.assertIn("document.querySelectorAll('.theme-toggle')", self.theme_script)
        self.assertRegex(self.css, r"\.nav\.menu-open\s+\.nav-links")
        self.assertIn(".mobile-menu{display:none}", self.css)
        self.assertIn(".mobile-menu{display:inline-grid}", self.css)


if __name__ == "__main__":
    unittest.main()
