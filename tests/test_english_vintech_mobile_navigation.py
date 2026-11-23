"""Regression tests for the English VinTech service-page mobile navigation."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    "en-vintech/cctv-nvr.html": [
        "/en-vintech.html", "/en-vintech.html", "/en-vintech.html#services",
        "/en-vintech.html#contact", "/vintech/cctv-nvr.html",
    ],
    "en-vintech/cybersecurity.html": [
        "/en-vintech.html", "/en-vintech.html", "/en-vintech.html#services",
        "/en-vintech.html#contact", "/vintech/cybersecurity.html",
    ],
    "en-vintech/network-infrastructure.html": [
        "/en-vintech.html", "/en-vintech.html", "/en-vintech.html#services",
        "/en-vintech.html#contact", "/vintech/network-infrastructure.html",
    ],
    "en-vintech/servers-systems.html": [
        "/en-vintech.html", "/en-vintech.html", "/en-vintech.html#services",
        "/en-vintech.html#contact", "/vintech/servers-systems.html",
    ],
}
THEME_JS = (ROOT / "assets" / "site-theme.js").read_text(encoding="utf-8")
LOCALIZED_MENU_JS = (ROOT / "assets" / "english-vintech-mobile-nav-labels.js").read_text(encoding="utf-8")
BUNDLE_CSS = (ROOT / "assets" / "site-bundle.css").read_text(encoding="utf-8")
WORKFLOW = (ROOT / ".github" / "workflows" / "english-vintech-mobile-navigation.yml").read_text(encoding="utf-8")


class PrimaryNavigationParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.nav_attrs = {}
        self.menu_buttons = []
        self.link_groups = []
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())
        if tag == "nav" and "site-nav" in classes and self.depth == 0:
            self.depth = 1
            self.nav_attrs = attrs
            return
        if not self.depth:
            return
        if tag == "nav":
            self.depth += 1
        elif tag == "button" and "mobile-menu" in classes:
            self.menu_buttons.append(attrs)
        elif tag == "div" and "nav-links" in classes:
            self.link_groups.append(attrs)
        elif tag == "a":
            self.hrefs.append(attrs.get("href"))

    def handle_endtag(self, tag):
        if tag == "nav" and self.depth:
            self.depth -= 1


class EnglishVinTechMobileNavigationTests(unittest.TestCase):
    def parse(self, relative_path):
        html = (ROOT / relative_path).read_text(encoding="utf-8")
        parser = PrimaryNavigationParser()
        parser.feed(html)
        return html, parser

    def test_all_target_service_pages_have_one_named_primary_navigation(self):
        for path in PAGES:
            with self.subTest(page=path):
                _html, parser = self.parse(path)
                self.assertEqual(parser.nav_attrs.get("aria-label"), "Primary navigation")
                self.assertEqual(len(parser.menu_buttons), 1)
                self.assertEqual(len(parser.link_groups), 1)

    def test_mobile_buttons_are_semantic_localized_and_initially_collapsed(self):
        for path in PAGES:
            with self.subTest(page=path):
                _html, parser = self.parse(path)
                button = parser.menu_buttons[0]
                self.assertEqual(button.get("type"), "button")
                self.assertEqual(button.get("aria-label"), "Open menu")
                self.assertEqual(button.get("data-open-label"), "Open menu")
                self.assertEqual(button.get("data-close-label"), "Close menu")
                self.assertEqual(button.get("aria-expanded"), "false")

    def test_mobile_menu_controls_the_matching_link_group(self):
        for path in PAGES:
            with self.subTest(page=path):
                _html, parser = self.parse(path)
                button = parser.menu_buttons[0]
                links = parser.link_groups[0]
                self.assertTrue(links.get("id"))
                self.assertEqual(button.get("aria-controls"), links.get("id"))

    def test_existing_navigation_destinations_and_order_are_preserved(self):
        for path, expected in PAGES.items():
            with self.subTest(page=path):
                _html, parser = self.parse(path)
                self.assertEqual(parser.hrefs, expected)

    def test_pages_remain_english_ltr_with_reciprocal_language_alternates(self):
        for path in PAGES:
            with self.subTest(page=path):
                html, _parser = self.parse(path)
                self.assertIn('<html lang="en" dir="ltr">', html)
                self.assertIn('hreflang="en"', html)
                self.assertIn('hreflang="fa-IR"', html)
                self.assertIn('hreflang="x-default"', html)
                self.assertIn(f'href="https://mowhmmdh.github.io/{path}"', html)

    def test_existing_service_conversion_destinations_remain_present(self):
        for path in PAGES:
            with self.subTest(page=path):
                html, _parser = self.parse(path)
                self.assertIn('class="q-conversion"', html)
                self.assertIn('href="/en-vintech/request.html"', html)
                self.assertIn('mailto:mohammedhasgari@gmail.com', html)

    def test_english_legal_footer_from_existing_pr_is_preserved(self):
        expected = (
            '<a href="/en-privacy.html">Privacy</a>',
            '<a href="/en-terms.html">Terms</a>',
            '<a href="/en-disclosure.html">Disclosure</a>',
            '<a href="mailto:mohammedhasgari@gmail.com">Contact</a>',
        )
        for path in PAGES:
            with self.subTest(page=path):
                html, _parser = self.parse(path)
                self.assertEqual(html.count('<footer class="legal-footer-2026">'), 1)
                footer = html.split('<footer class="legal-footer-2026">', 1)[1].split("</footer>", 1)[0]
                for item in expected:
                    self.assertIn(item, footer)
                self.assertFalse(any("\u0600" <= char <= "\u06FF" for char in footer))

    def test_page_scoped_navigation_backdrop_stays_within_viewport(self):
        rule = "body .site-nav:before{inset-inline:calc((100vw - 100%)/-2)}"
        for path in PAGES:
            with self.subTest(page=path):
                html, _parser = self.parse(path)
                self.assertEqual(html.count(rule), 1)

    def test_shared_theme_script_keeps_persian_fallback_and_local_helper_localizes_english(self):
        self.assertIn("menu.setAttribute('aria-label',open?'بستن منو':'باز کردن منو');", THEME_JS)
        self.assertIn("menu.dataset.openLabel", LOCALIZED_MENU_JS)
        self.assertIn("menu.dataset.closeLabel", LOCALIZED_MENU_JS)
        self.assertIn("new MutationObserver(updateLabel)", LOCALIZED_MENU_JS)
        self.assertIn("nav.classList.contains('menu-open')", LOCALIZED_MENU_JS)
        self.assertIn("if(e.key==='Escape')", THEME_JS)

    def test_existing_persian_homepage_keeps_the_shared_default_menu_labels(self):
        homepage = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('aria-label="باز کردن منو"', homepage)
        self.assertNotIn('data-open-label=', homepage)
        self.assertIn("const openLabel=menu.dataset.openLabel||'باز کردن منو';", THEME_JS)
        self.assertIn("const closeLabel=menu.dataset.closeLabel||'بستن منو';", THEME_JS)

    def test_shared_responsive_css_supports_the_mobile_menu(self):
        self.assertIn(".mobile-menu{display:none}", BUNDLE_CSS)
        self.assertIn(".site-nav.menu-open .nav-links", BUNDLE_CSS)
        self.assertIn(".mobile-menu{display:inline-grid}", BUNDLE_CSS)

    def test_browser_workflow_is_read_only_and_does_not_run_lighthouse(self):
        self.assertIn("permissions:\n  contents: read", WORKFLOW)
        self.assertNotIn("contents: write", WORKFLOW)
        self.assertIn("playwright@1.56.1", WORKFLOW)
        self.assertNotIn("lighthouse", WORKFLOW.lower())


if __name__ == "__main__":
    unittest.main(verbosity=2)
