"""Regression tests for RSS discovery and freshness on the Persian blog index."""
from datetime import date
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://mowhmmdh.github.io"
BLOG_INDEX = ROOT / "blog" / "index.html"
FEED = ROOT / "feed.xml"
SITEMAP = ROOT / "sitemap.xml"


def heading_from_page(path):
    source = path.read_text(encoding="utf-8")
    match = re.search(r"<h1[^>]*>([\\s\\S]*?)</h1>", source, re.IGNORECASE)
    if not match:
        raise AssertionError(f"Missing H1 in {path.relative_to(ROOT)}")
    return unescape(re.sub(r"<[^>]+>", "", match.group(1))).strip()


class RSSFeedFreshnessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = BLOG_INDEX.read_text(encoding="utf-8")
        cls.feed = ET.parse(FEED).getroot()
        cls.channel = cls.feed.find("channel")
        cls.items = cls.channel.findall("item") if cls.channel is not None else []

    def test_blog_index_advertises_and_links_to_the_rss_feed(self):
        self.assertIn("</head>", self.page)
        head = self.page.split("</head>", 1)[0]
        self.assertIn(
            '<link rel="alternate" type="application/rss+xml" title="محمدحسین عسگری ثمرین | فید فنی" href="https://mowhmmdh.github.io/feed.xml">',
            head,
        )
        self.assertIn('<a href="/feed.xml" title="فید RSS مقالات">RSS</a>', self.page)

    def test_feed_includes_all_articles_with_the_latest_sitemap_lastmod(self):
        self.assertEqual(self.feed.tag, "rss")
        self.assertEqual(self.feed.attrib.get("version"), "2.0")
        self.assertIsNotNone(self.channel)
        sitemap = ET.parse(SITEMAP).getroot()
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        rows = []
        for node in sitemap.findall("sm:url", ns):
            url = (node.findtext("sm:loc", default="", namespaces=ns) or "").strip()
            lastmod = (node.findtext("sm:lastmod", default="", namespaces=ns) or "").strip()
            if url.startswith(BASE + "/blog/") and url != BASE + "/blog/" and lastmod:
                rows.append((date.fromisoformat(lastmod), url))
        self.assertTrue(rows, "Sitemap contains no Persian blog article URLs")
        latest_date = max(lastmod for lastmod, _ in rows)
        latest_urls = {url for lastmod, url in rows if lastmod == latest_date}
        feed_urls = {item.findtext("link", "").strip() for item in self.items}
        self.assertTrue(latest_urls, "No latest article URLs were selected")
        self.assertTrue(
            latest_urls.issubset(feed_urls),
            f"RSS is missing latest sitemap articles: {sorted(latest_urls - feed_urls)}",
        )
        build_date_text = self.channel.findtext("lastBuildDate", "").strip()
        self.assertTrue(build_date_text, "RSS lastBuildDate is required")
        build_date = parsedate_to_datetime(build_date_text)
        self.assertGreaterEqual(build_date.date(), latest_date)

    def test_feed_item_titles_match_article_headings_for_latest_posts(self):
        sitemap = ET.parse(SITEMAP).getroot()
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        rows = []
        for node in sitemap.findall("sm:url", ns):
            url = (node.findtext("sm:loc", default="", namespaces=ns) or "").strip()
            lastmod = (node.findtext("sm:lastmod", default="", namespaces=ns) or "").strip()
            if url.startswith(BASE + "/blog/") and url != BASE + "/blog/" and lastmod:
                rows.append((date.fromisoformat(lastmod), url))
        latest_date = max(lastmod for lastmod, _ in rows)
        latest_urls = {url for lastmod, url in rows if lastmod == latest_date}
        feed_by_url = {item.findtext("link", "").strip(): item.findtext("title", "").strip() for item in self.items}
        for url in latest_urls:
            with self.subTest(url=url):
                relative = url.removeprefix(BASE + "/")
                expected = heading_from_page(ROOT / relative)
                self.assertEqual(feed_by_url.get(url), expected)

    def test_playbook_item_uses_its_descriptive_article_heading(self):
        url = BASE + "/blog/network-security-engineering-playbook.html"
        item = next((entry for entry in self.items if entry.findtext("link", "").strip() == url), None)
        self.assertIsNotNone(item)
        self.assertEqual(item.findtext("title", "").strip(), heading_from_page(ROOT / "blog" / "network-security-engineering-playbook.html"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
