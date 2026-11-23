"""Regression tests for the Persian VinTech cybersecurity page mobile navigation."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = (ROOT / "vintech" / "cybersecurity.html").read_text(encoding="utf-8")
THEME_JS = (ROOT / "assets" / "site-theme.js").read_text(encoding="utf-8")
BUNDLE_CSS = (ROOT / "assets" / "site-bundle.css").read_text(encoding="utf-8")
QUALITY_CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")
WORKFLOW = (ROOT / ".github" / "workflows" / "vintech-cybersecurity-mobile-navigation.yml").read_text(encoding="utf-8")


class PrimaryNavigationParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_primary_nav = False
        self.primary_nav_depth = 0
        self.primary_nav_attrs = {}
        self.menu_buttons = []
        self.link_groups = []
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())

        if tag == "nav" and "site-nav" in classes and not self.in_primary_nav:
            self.in_primary_nav = True
            self.primary_nav_depth = 1
            self.primary_nav_attrs = attrs
            return

        if not self.in_primary_nav:
            return

        if tag == "nav":
            self.primary_nav_depth += 1
        elif tag == "button" and "mobile-menu" in classes:
            self.menu_buttons.append(attrs)
        elif tag == "div" and "nav-links" in classes:
            self.link_groups.append(attrs)
        elif tag == "a":
            self.hrefs.append(attrs.get("href"))

    def handle_endtag(self, tag):
        if self.in_primary_nav and tag == "nav":
            self.primary_nav_depth -= 1
            if self.primary_nav_depth == 0:
                self.in_primary_nav = False


class VinTechCybersecurityMobileNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parser = PrimaryNavigationParser()
        cls.parser.feed(PAGE)

    def test_primary_navigation_is_an_accessibly_named_landmark(self):
        self.assertEqual(self.parser.primary_nav_attrs.get("aria-label"), "ناوبری اصلی")

    def test_mobile_menu_button_is_semantic_and_initially_collapsed(self):
        self.assertEqual(len(self.parser.menu_buttons), 1)
        button = self.parser.menu_buttons[0]
        self.assertEqual(button.get("type"), "button")
        self.assertEqual(button.get("aria-expanded"), "false")
        self.assertEqual(button.get("aria-label"), "باز کردن منو")

    def test_mobile_menu_controls_the_primary_link_group(self):
        self.assertEqual(len(self.parser.link_groups), 1)
        button = self.parser.menu_buttons[0]
        links = self.parser.link_groups[0]
        self.assertTrue(button.get("aria-controls"))
        self.assertEqual(button.get("aria-controls"), links.get("id"))

    def test_existing_navigation_destinations_are_preserved(self):
        self.assertEqual(
            self.parser.hrefs,
            ["/vintech.html", "/vintech.html", "/vintech.html#services", "/en-vintech/cybersecurity.html"],
        )

    def test_shared_theme_script_wires_toggle_and_escape_close(self):
        self.assertIn("nav.querySelector('.mobile-menu')", THEME_JS)
        self.assertIn("nav.querySelector('.nav-links,.about-nav-links,.en-nav-links')", THEME_JS)
        self.assertIn("nav.classList.add('menu-open')", THEME_JS)
        self.assertIn("menu.setAttribute('aria-expanded',String(open))", THEME_JS)
        self.assertIn("document.addEventListener('keydown'", THEME_JS)
        self.assertIn("if(e.key==='Escape')", THEME_JS)

    def test_shared_styles_expose_the_button_and_open_the_link_panel(self):
        self.assertIn(".mobile-menu{display:inline-grid}", BUNDLE_CSS)
        self.assertIn(".site-nav.menu-open .nav-links", BUNDLE_CSS)
        self.assertIn(".mobile-menu:focus-visible", QUALITY_CSS)

    def test_bilingual_metadata_and_service_conversion_remain_present(self):
        self.assertIn('href="https://mowhmmdh.github.io/vintech/cybersecurity.html"', PAGE)
        self.assertIn('hreflang="fa-IR"', PAGE)
        self.assertIn('hreflang="en"', PAGE)
        self.assertIn('hreflang="x-default"', PAGE)
        self.assertIn('href="/vintech/request.html"', PAGE)
        self.assertIn('class="q-conversion"', PAGE)
        self.assertIn('aria-labelledby="service-page-cta-title"', PAGE)

    def test_read_only_workflow_permissions(self):
        self.assertIn("permissions:\n  contents: read", WORKFLOW)
        self.assertNotIn("contents: write", WORKFLOW)


if __name__ == "__main__":
    unittest.main(verbosity=2)
