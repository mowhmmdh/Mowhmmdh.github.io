"""Regression tests for primary navigation on the Persian GitLab CI/CD article."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog" / "gitlab-ci-cd-for-it-infrastructure.html"
CSS = ROOT / "assets" / "site-bundle.css"
THEME_SCRIPT = ROOT / "assets" / "site-theme.js"
QUALITY_CSS = ROOT / "assets" / "site-final-quality-2026.css"
EN_PAGE = ROOT / "en-blog" / "gitlab-ci-cd-for-it-infrastructure.html"


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


class ArticleEnhancementParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hrefs = []
        self.ctas = []
        self.active_cta = None
        self.footer_depth = 0
        self.footer_first_child = None
        self.footer_lines = []
        self.json_blocks = []
        self.active_json = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())

        if tag == "a":
            self.hrefs.append(attrs.get("href", ""))
            if "q-mobile-cta" in classes:
                self.active_cta = {"attrs": attrs, "text": []}
                self.ctas.append(self.active_cta)

        if tag == "footer":
            self.footer_depth += 1
            if self.footer_depth == 1:
                self.footer_first_child = None
        elif self.footer_depth and self.footer_first_child is None:
            self.footer_first_child = (tag, attrs)

        if "q-footerline" in classes:
            self.footer_lines.append({
                "attrs": attrs,
                "inside_footer": self.footer_depth > 0,
            })

        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.active_json = []

    def handle_data(self, data):
        if self.active_cta is not None:
            self.active_cta["text"].append(data)
        if self.active_json is not None:
            self.active_json.append(data)

    def handle_endtag(self, tag):
        if tag == "a":
            self.active_cta = None
        elif tag == "script" and self.active_json is not None:
            self.json_blocks.append("".join(self.active_json))
            self.active_json = None
        elif tag == "footer":
            self.footer_depth = max(0, self.footer_depth - 1)


class GitLabArticleStaticEnhancementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")
        cls.en_html = EN_PAGE.read_text(encoding="utf-8")
        cls.css = QUALITY_CSS.read_text(encoding="utf-8")
        cls.parser = ArticleEnhancementParser()
        cls.parser.feed(cls.html)

    def test_redundant_enhancement_script_is_removed_but_shared_assets_remain(self):
        self.assertNotIn('/assets/site-final-quality-2026.js', self.html)
        self.assertIn('/assets/site-theme.js', self.html)
        self.assertIn('/assets/site-bundle.css', self.html)
        self.assertIn('/assets/site-final-quality-2026.css', self.html)

    def test_static_mobile_cta_preserves_route_label_and_conversion_event(self):
        self.assertEqual(len(self.parser.ctas), 1)
        cta = self.parser.ctas[0]
        self.assertEqual(cta["attrs"].get("href"), "/vintech/request.html")
        self.assertEqual(cta["attrs"].get("data-conversion"), "mobile_service_request")
        self.assertEqual("".join(cta["text"]).strip(), "درخواست پروژه / مشاوره")

    def test_footer_divider_is_unique_decorative_and_first_child(self):
        self.assertEqual(len(self.parser.footer_lines), 1)
        line = self.parser.footer_lines[0]
        self.assertTrue(line["inside_footer"])
        self.assertEqual(line["attrs"].get("aria-hidden"), "true")
        self.assertIsNotNone(self.parser.footer_first_child)
        self.assertEqual(self.parser.footer_first_child[0], "div")
        self.assertIn("q-footerline", self.parser.footer_first_child[1].get("class", "").split())

    def test_existing_related_and_conversion_content_is_preserved(self):
        self.assertIn('class="auto-related"', self.html)
        self.assertIn('class="seo-conversion-cta"', self.html)
        self.assertIn('class="related-articles site-auto-related"', self.html)
        self.assertIn('/blog/gitlab-production-checklist.html', self.html)
        self.assertIn('/vintech/request.html', self.html)

    def test_canonical_and_reciprocal_bilingual_hreflang_are_preserved(self):
        def metadata(source):
            tags = re.findall(r"<link\b[^>]*>", source, flags=re.IGNORECASE)
            canonical = None
            alternates = {}
            for tag in tags:
                rel = re.search(r'\brel=["\']([^"\']+)', tag, flags=re.IGNORECASE)
                href = re.search(r'\bhref=["\']([^"\']+)', tag, flags=re.IGNORECASE)
                if not rel or not href:
                    continue
                if rel.group(1).lower() == "canonical":
                    canonical = href.group(1)
                lang = re.search(r'\bhreflang=["\']([^"\']+)', tag, flags=re.IGNORECASE)
                if rel.group(1).lower() == "alternate" and lang:
                    alternates[lang.group(1)] = href.group(1)
            return canonical, alternates

        fa_url = "https://mowhmmdh.github.io/blog/gitlab-ci-cd-for-it-infrastructure.html"
        en_url = "https://mowhmmdh.github.io/en-blog/gitlab-ci-cd-for-it-infrastructure.html"
        fa_canonical, fa_alt = metadata(self.html)
        en_canonical, en_alt = metadata(self.en_html)
        self.assertEqual(fa_canonical, fa_url)
        self.assertEqual(en_canonical, en_url)
        self.assertEqual(fa_alt.get("fa-IR"), fa_url)
        self.assertEqual(fa_alt.get("en"), en_url)
        self.assertEqual(fa_alt.get("x-default"), fa_url)
        self.assertEqual(en_alt.get("en"), en_url)
        self.assertEqual(en_alt.get("fa-IR"), fa_url)

    def test_article_and_breadcrumb_json_ld_remain_valid(self):
        self.assertGreaterEqual(len(self.parser.json_blocks), 2)
        parsed = [json.loads(block) for block in self.parser.json_blocks]
        article = next((node for node in parsed if node.get("@type") == "Article"), None)
        self.assertIsNotNone(article)
        self.assertEqual(
            article.get("mainEntityOfPage"),
            "https://mowhmmdh.github.io/blog/gitlab-ci-cd-for-it-infrastructure.html",
        )
        self.assertTrue(any(node.get("@type") == "BreadcrumbList" for node in parsed))

    def test_all_local_article_links_resolve_to_tracked_paths(self):
        missing = []
        for href in self.parser.hrefs:
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "//")):
                continue
            parsed = urlsplit(href)
            if parsed.scheme or parsed.netloc:
                continue
            path = parsed.path or "/"
            target = ROOT / path.lstrip("/")
            if path == "/":
                target = ROOT / "index.html"
            elif path.endswith("/"):
                target = target / "index.html"
            if not target.is_file():
                missing.append(href)
        self.assertEqual(missing, [], "Missing local targets: " + ", ".join(missing))

    def test_mobile_cta_css_is_hidden_by_default_and_shown_at_mobile_breakpoint(self):
        self.assertIn(".q-mobile-cta{display:none}", self.css)
        self.assertIn("@media(max-width:760px)", self.css)
        self.assertRegex(
            self.css,
            r"@media\(max-width:760px\)[\s\S]*?\.q-mobile-cta\{display:flex",
        )

    def test_existing_navigation_controls_and_language_switch_remain(self):
        self.assertIn('class="mobile-menu"', self.html)
        self.assertIn('class="theme-toggle"', self.html)
        self.assertIn('href="/en-blog/gitlab-ci-cd-for-it-infrastructure.html"', self.html)
