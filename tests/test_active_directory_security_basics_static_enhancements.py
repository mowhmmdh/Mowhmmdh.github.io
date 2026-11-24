"""Regression tests for the Persian Active Directory security basics article."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE_PATH = ROOT / "blog" / "active-directory-security-basics.html"
EN_PAGE_PATH = ROOT / "en-blog" / "active-directory-security-basics.html"
PAGE = PAGE_PATH.read_text(encoding="utf-8")
EN_PAGE = EN_PAGE_PATH.read_text(encoding="utf-8")
QUALITY_CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")
JSON_LD_RE = re.compile(
    r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)


class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.hrefs = []
        self.ctas = []
        self.active_cta = None
        self.footer_depth = 0
        self.footer_first_child = None
        self.footer_lines = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())

        if tag == "link":
            self.links.append(attrs)
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

    def handle_data(self, data):
        if self.active_cta is not None:
            self.active_cta["text"].append(data)

    def handle_endtag(self, tag):
        if tag == "a":
            self.active_cta = None
        elif tag == "footer":
            self.footer_depth = max(0, self.footer_depth - 1)


def canonical_url(source):
    for tag in re.findall(r"<link\b[^>]*>", source, flags=re.IGNORECASE):
        if re.search(r'\brel=["\']canonical["\']', tag, flags=re.IGNORECASE):
            match = re.search(r'\bhref=["\']([^"\']+)', tag, flags=re.IGNORECASE)
            if match:
                return match.group(1)
    return None


def alternate_urls(source):
    result = {}
    for tag in re.findall(r"<link\b[^>]*>", source, flags=re.IGNORECASE):
        if not re.search(r'\brel=["\']alternate["\']', tag, flags=re.IGNORECASE):
            continue
        lang = re.search(r'\bhreflang=["\']([^"\']+)', tag, flags=re.IGNORECASE)
        href = re.search(r'\bhref=["\']([^"\']+)', tag, flags=re.IGNORECASE)
        if lang and href:
            result[lang.group(1)] = href.group(1)
    return result


def walk_json(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


class ActiveDirectoryStaticEnhancementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parser = ArticleParser()
        cls.parser.feed(PAGE)

    def test_redundant_enhancement_script_is_removed_but_theme_assets_remain(self):
        self.assertNotIn('/assets/site-final-quality-2026.js', PAGE)
        self.assertIn('/assets/site-theme.js', PAGE)
        self.assertIn('/assets/site-bundle.css', PAGE)
        self.assertIn('/assets/site-final-quality-2026.css', PAGE)

    def test_mobile_conversion_cta_is_static_and_preserves_destination(self):
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
        self.assertEqual(self.parser.footer_first_child[0], "div")
        self.assertIn("q-footerline", self.parser.footer_first_child[1].get("class", "").split())

    def test_existing_conversion_and_related_content_are_preserved(self):
        self.assertIn('class="seo-conversion-cta"', PAGE)
        self.assertIn('class="auto-related"', PAGE)
        self.assertIn('/vintech/request.html', PAGE)
        self.assertIn('/blog/active-directory-hardening.html', PAGE)
        self.assertIn('/blog/active-directory-zero-trust-basics.html', PAGE)

    def test_theme_css_keeps_cta_hidden_on_desktop_and_visible_on_mobile(self):
        self.assertIn(".q-mobile-cta{display:none}", QUALITY_CSS)
        self.assertIn("@media(max-width:760px)", QUALITY_CSS)
        self.assertRegex(QUALITY_CSS, r"@media\(max-width:760px\)[\s\S]*?\.q-mobile-cta\{display:flex")

    def test_canonical_and_bilingual_hreflang_remain_reciprocal(self):
        fa = "https://mowhmmdh.github.io/blog/active-directory-security-basics.html"
        en = "https://mowhmmdh.github.io/en-blog/active-directory-security-basics.html"
        self.assertEqual(canonical_url(PAGE), fa)
        self.assertEqual(canonical_url(EN_PAGE), en)
        fa_alternates = alternate_urls(PAGE)
        en_alternates = alternate_urls(EN_PAGE)
        self.assertEqual(fa_alternates.get("fa-IR"), fa)
        self.assertEqual(fa_alternates.get("en"), en)
        self.assertEqual(fa_alternates.get("x-default"), fa)
        self.assertEqual(en_alternates.get("en"), en)
        self.assertEqual(en_alternates.get("fa-IR"), fa)

    def test_article_json_ld_remains_valid_and_uses_the_canonical_url(self):
        blocks = JSON_LD_RE.findall(PAGE)
        self.assertGreaterEqual(len(blocks), 2)
        parsed = [json.loads(block.strip()) for block in blocks]
        nodes = [node for value in parsed for node in walk_json(value)]
        article = next((node for node in nodes if node.get("@type") == "Article"), None)
        self.assertIsNotNone(article)
        self.assertEqual(article.get("url"), canonical_url(PAGE))

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
            if path.endswith("/"):
                target = target / "index.html"
            if not target.exists():
                missing.append(href)
        self.assertEqual(missing, [], "Missing local targets: " + ", ".join(missing))

    def test_article_heading_and_language_contract_are_unchanged(self):
        self.assertIn('<html lang="fa" dir="rtl">', PAGE)
        self.assertIn("<h1>اصول امنیت Active Directory؛ از حداقل دسترسی تا پایش</h1>", PAGE)
        self.assertIn("Least Privilege", PAGE)
        self.assertIn("Group Policy", PAGE)
        self.assertIn("Backup و Recovery", PAGE)


if __name__ == "__main__":
    unittest.main()
