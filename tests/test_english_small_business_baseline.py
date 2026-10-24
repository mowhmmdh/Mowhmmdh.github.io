from pathlib import Path
from urllib.parse import urlparse, unquote
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
EN_PATH = ROOT / "en-blog" / "network-security-baseline-for-small-business.html"
FA_PATH = ROOT / "blog" / "network-security-baseline-for-small-business.html"
LISTING_PATH = ROOT / "en-blog.html"
SITEMAP_PATH = ROOT / "sitemap.xml"
CANONICAL = "https://mowhmmdh.github.io/en-blog/network-security-baseline-for-small-business.html"
FA_CANONICAL = "https://mowhmmdh.github.io/blog/network-security-baseline-for-small-business.html"


class EnglishBaselineRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.en = EN_PATH.read_text(encoding="utf-8")
        cls.fa = FA_PATH.read_text(encoding="utf-8")
        cls.listing = LISTING_PATH.read_text(encoding="utf-8")
        cls.sitemap = SITEMAP_PATH.read_text(encoding="utf-8")

    def test_core_metadata_and_language_are_unambiguous(self):
        self.assertRegex(self.en, r'<html\b[^>]*lang="en"[^>]*dir="ltr"')
        self.assertEqual(len(re.findall(r"<title\b", self.en, re.I)), 1)
        self.assertEqual(len(re.findall(r'<meta\s+name="description"', self.en, re.I)), 1)
        self.assertEqual(len(re.findall(r'<link\s+rel="canonical"', self.en, re.I)), 1)
        self.assertIn(f'<link rel="canonical" href="{CANONICAL}">', self.en)
        self.assertEqual(len(re.findall(r"<h1\b", self.en, re.I)), 1)
        self.assertEqual(len(re.findall(r"<main\b", self.en, re.I)), 1)
        self.assertNotIn("<title>Draft</title>", self.en)
        self.assertGreater(len(self.en), 7000)

    def test_hreflang_is_reciprocal_and_visible_to_readers(self):
        en_alts = dict(re.findall(r'hreflang="([^"]+)" href="([^"]+)"', self.en))
        fa_alts = dict(re.findall(r'hreflang="([^"]+)" href="([^"]+)"', self.fa))
        self.assertEqual(en_alts.get("en"), CANONICAL)
        self.assertEqual(en_alts.get("fa-IR"), FA_CANONICAL)
        self.assertEqual(fa_alts.get("fa-IR"), FA_CANONICAL)
        self.assertEqual(fa_alts.get("en"), CANONICAL)
        self.assertIn('href="/en-blog/network-security-baseline-for-small-business.html"', self.fa)
        self.assertIn('Read this guide in English', self.fa)

    def test_article_is_discoverable_from_the_english_blog(self):
        self.assertIn('href="/en-blog/network-security-baseline-for-small-business.html"', self.listing)
        self.assertIn("<h2>Small Business Network Security Baseline</h2>", self.listing)
        cluster_start = self.listing.index('<h2>Network Security</h2>')
        cluster_end = self.listing.index("</div>", cluster_start)
        self.assertIn("Small-business security baseline", self.listing[cluster_start:cluster_end])
        self.assertIn("Small Business Network Security Baseline", self.listing)

    def test_sitemap_contains_exactly_one_canonical_url(self):
        root = ET.fromstring(self.sitemap)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = [node.text for node in root.findall(".//sm:loc", ns)]
        self.assertEqual(locs.count(CANONICAL), 1)

    def test_article_links_resolve_to_repository_files(self):
        for href in re.findall(r'<a\b[^>]*href="([^"]+)"', self.en, re.I):
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
                continue
            parsed = urlparse(href)
            if parsed.scheme in ("http", "https"):
                if parsed.netloc != "mowhmmdh.github.io":
                    continue
                target = unquote(parsed.path.lstrip("/"))
            elif href.startswith("/"):
                target = unquote(parsed.path.lstrip("/"))
            else:
                continue
            if not target:
                target = "index.html"
            candidates = [ROOT / target]
            if target.endswith("/"):
                candidates.insert(0, ROOT / target / "index.html")
            elif not (ROOT / target).exists():
                candidates.extend((ROOT / (target + ".html"), ROOT / target / "index.html"))
            self.assertTrue(any(path.is_file() for path in candidates), f"Broken internal link: {href}")

    def test_people_first_sections_and_primary_sources_exist(self):
        for heading in (
            "Build a usable asset inventory",
            "Make identity and remote access hard to abuse",
            "Segment the network and keep firewall rules intentional",
            "Collect logs that help answer real questions",
            "Back up important data and test recovery",
            "Prepare for incidents and review vendor access",
        ):
            self.assertIn(f"<h2>{heading}</h2>", self.en)
        self.assertIn("https://csrc.nist.gov/pubs/sp/1300/final", self.en)
        self.assertIn("https://www.ftc.gov/business-guidance/small-businesses/cybersecurity", self.en)
        self.assertIn("https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/require-multifactor-authentication", self.en)


if __name__ == "__main__":
    unittest.main()
