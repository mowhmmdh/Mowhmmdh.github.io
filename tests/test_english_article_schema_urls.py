"""Regression tests for canonical URLs in English article JSON-LD."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://mowhmmdh.github.io"
REPAIRED_PAGES = {
    "en-blog/active-directory-hardening.html": (
        f"{BASE}/en-blog/active-directory-hardening.html"
    ),
    "en-blog/active-directory-security-basics.html": (
        f"{BASE}/en-blog/active-directory-security-basics.html"
    ),
    "en-blog/dns-troubleshooting.html": (
        f"{BASE}/en-blog/dns-troubleshooting.html"
    ),
    "en-blog/vlan-segmentation.html": (
        f"{BASE}/en-blog/vlan-segmentation.html"
    ),
}
JSON_LD_RE = re.compile(
    r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
ARTICLE_TYPES = {"Article", "BlogPosting", "TechArticle"}


def walk_json(value):
    """Yield every dictionary nested in a JSON-LD value."""
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def canonical_url(html):
    for tag in re.findall(r"<link\b[^>]*>", html, flags=re.IGNORECASE):
        if re.search(r'\brel=["\']canonical["\']', tag, flags=re.IGNORECASE):
            match = re.search(r'\bhref=["\']([^"\']+)', tag, flags=re.IGNORECASE)
            if match:
                return match.group(1)
    return None


class EnglishArticleSchemaUrlTests(unittest.TestCase):
    def test_repaired_article_schema_urls_match_canonical(self):
        for relative_path, expected_url in REPAIRED_PAGES.items():
            with self.subTest(page=relative_path):
                html = (ROOT / relative_path).read_text(encoding="utf-8")
                self.assertEqual(canonical_url(html), expected_url)

                article_nodes = []
                for raw in JSON_LD_RE.findall(html):
                    data = json.loads(raw)
                    for node in walk_json(data):
                        types = node.get("@type", [])
                        if isinstance(types, str):
                            types = [types]
                        if ARTICLE_TYPES.intersection(types) and "url" in node:
                            article_nodes.append(node)

                self.assertTrue(
                    article_nodes,
                    f"No article JSON-LD with an explicit url found in {relative_path}",
                )
                for node in article_nodes:
                    self.assertEqual(
                        node["url"],
                        expected_url,
                        f"Article schema URL must match canonical in {relative_path}",
                    )

    def test_no_malformed_en_blog_html_prefix_in_english_articles(self):
        malformed_prefix = re.compile(
            r"https://mowhmmdh\.github\.io/en-blog\.html(?=[A-Za-z0-9_-])"
        )
        for page in sorted((ROOT / "en-blog").glob("*.html")):
            with self.subTest(page=page.name):
                html = page.read_text(encoding="utf-8")
                self.assertIsNone(
                    malformed_prefix.search(html),
                    f"Malformed article URL prefix found in {page.relative_to(ROOT)}",
                )


if __name__ == "__main__":
    unittest.main()
