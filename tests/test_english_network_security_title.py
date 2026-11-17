"""Regression checks for the English network-security assessment page title."""
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "en-blog/network-security-assessment-checklist.html"
CANONICAL = "https://mowhmmdh.github.io/en-blog/network-security-assessment-checklist.html"
TITLE = "Network Security Assessment Checklist | Incident Response"
FULL_HEADLINE = "Network Security Assessment Checklist: Asset Discovery to Incident Response"


class EnglishNetworkSecurityTitleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")

    def test_browser_title_is_complete_and_within_audit_limit(self):
        match = re.search(r"<title>([^<]+)</title>", self.html, re.IGNORECASE)
        self.assertIsNotNone(match)
        title = match.group(1).strip()
        self.assertEqual(title, TITLE)
        self.assertGreaterEqual(len(title), 15)
        self.assertLessEqual(len(title), 65)
        self.assertNotIn("Inciden</title>", self.html)

    def test_open_graph_title_matches_browser_title(self):
        match = re.search(
            r'<meta\s+property="og:title"\s+content="([^"]*)"',
            self.html,
            re.IGNORECASE,
        )
        self.assertIsNotNone(match)
        self.assertEqual(match.group(1), TITLE)

    def test_h1_and_both_structured_article_headlines_are_complete(self):
        match = re.search(r"<h1[^>]*>(.*?)</h1>", self.html, re.IGNORECASE | re.DOTALL)
        self.assertIsNotNone(match)
        self.assertEqual(match.group(1).strip(), FULL_HEADLINE)
        headlines = re.findall(r'"headline":"([^"]+)"', self.html)
        self.assertEqual(headlines, [FULL_HEADLINE, FULL_HEADLINE])

    def test_canonical_and_bilingual_hreflang_remain_unchanged(self):
        self.assertEqual(
            re.findall(r'<link\s+rel="canonical"\s+href="([^"]+)"', self.html),
            [CANONICAL],
        )
        self.assertIn(
            '<link rel="alternate" hreflang="en" href="' + CANONICAL + '">',
            self.html,
        )
        self.assertIn(
            '<link rel="alternate" hreflang="fa-IR" href="https://mowhmmdh.github.io/blog/network-security-assessment-checklist.html">',
            self.html,
        )
        self.assertIn(
            '<link rel="alternate" hreflang="x-default" href="https://mowhmmdh.github.io/blog/network-security-assessment-checklist.html">',
            self.html,
        )
        self.assertIn('<html lang="en" dir="ltr">', self.html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
