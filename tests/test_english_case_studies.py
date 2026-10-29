import json
import re
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN_URL = "https://mowhmmdh.github.io/en-case-studies.html"
FA_URL = "https://mowhmmdh.github.io/case-studies/"
SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def hreflang_map(html):
    return dict(re.findall(
        r'<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"',
        html,
        flags=re.I,
    ))


class EnglishCaseStudiesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.english = read("en-case-studies.html")
        cls.persian = read("case-studies/index.html")
        cls.home = read("en.html")
        cls.html_sitemap = read("en-sitemap.html")
        cls.sitemap = ET.fromstring(read("sitemap.xml"))

    def test_english_page_has_correct_language_canonical_and_h1(self):
        self.assertRegex(self.english, r'<html\b[^>]*lang="en"[^>]*dir="ltr"')
        self.assertIn(f'<link rel="canonical" href="{EN_URL}">', self.english)
        self.assertRegex(self.english, r'<h1[^>]*>Technical case studies</h1>')

    def test_language_alternates_are_reciprocal(self):
        en = hreflang_map(self.english)
        fa = hreflang_map(self.persian)
        self.assertEqual(en.get("en"), EN_URL)
        self.assertEqual(en.get("fa-IR"), FA_URL)
        self.assertEqual(en.get("x-default"), FA_URL)
        self.assertEqual(fa.get("en"), EN_URL)
        self.assertEqual(fa.get("fa-IR"), FA_URL)
        self.assertEqual(fa.get("x-default"), FA_URL)

    def test_english_home_and_html_sitemap_use_english_destination(self):
        self.assertGreaterEqual(self.home.count('href="/en-case-studies.html"'), 3)
        self.assertNotIn('href="/case-studies/"', self.home)
        self.assertIn('href="/en-case-studies.html"', self.html_sitemap)
        self.assertNotIn('href="/case-studies/"', self.html_sitemap)

    def test_english_reference_pages_link_to_english_case_study_index(self):
        paths = (
            "en-authority.html",
            "en-linkedin.html",
            "en-press.html",
            "en-media-kit.html",
        )
        for path in paths:
            html = read(path)
            with self.subTest(path=path):
                self.assertRegex(html, r'<html\\b[^>]*lang="en"[^>]*dir="ltr"')
                self.assertIn('href="/en-case-studies.html"', html)
                self.assertNotIn('href="/case-studies/"', html)

    def test_each_summary_links_to_its_persian_source(self):
        expected = (
            "/case-studies/network-troubleshooting.html",
            "/case-studies/windows-domain-hardening.html",
            "/case-studies/gitlab-infrastructure.html",
        )
        for target in expected:
            self.assertIn(f'href="{target}"', self.english)
        self.assertEqual(self.english.count("Full case study in Persian"), 3)
        self.assertIn("not claims of specific client outcomes", self.english)

    def test_json_ld_is_valid_and_contains_collection_and_breadcrumb(self):
        blocks = re.findall(
            r'<script type="application/ld\+json">(.*?)</script>',
            self.english,
            flags=re.I | re.S,
        )
        parsed = [json.loads(block) for block in blocks]
        types = {item.get("@type") for item in parsed}
        self.assertIn("CollectionPage", types)
        self.assertIn("BreadcrumbList", types)

    def test_sitemap_contains_the_new_url_exactly_once_in_order(self):
        urls = [node.text for node in self.sitemap.findall(".//sm:loc", SITEMAP_NS)]
        self.assertEqual(urls.count(EN_URL), 1)
        self.assertLess(urls.index(EN_URL), urls.index("https://mowhmmdh.github.io/en-disclosure.html"))

    def test_navigation_links_are_keyboard_visible(self):
        self.assertIn(":focus-visible", self.english)
        self.assertIn('class="skip-link" href="#main-content"', self.english)
        self.assertIn("@media(max-width:560px)", self.english)
        self.assertIn("prefers-reduced-motion:reduce", self.english)
        self.assertEqual(self.english.count("AUTO-BREADCRUMB:START"), 1)
        self.assertEqual(self.english.count("AUTO-BREADCRUMB:END"), 1)


    def test_project_related_links_match_real_routes_and_language(self):
        script = read("assets/site-final-quality-2026.js")
        self.assertIn("path === k + '.html'", script)

        persian_block = script.split("'/projects': [", 1)[1].split("\n      ]", 1)[0]
        english_block = script.split("'/en-projects': [", 1)[1].split("\n      ]", 1)[0]

        persian_targets = re.findall(r"\['([^']+)'", persian_block)
        english_targets = re.findall(r"\['([^']+)'", english_block)
        self.assertEqual(persian_targets, [
            "/case-studies/gitlab-infrastructure.html",
            "/case-studies/network-troubleshooting.html",
            "/case-studies/windows-domain-hardening.html",
        ])
        self.assertEqual(english_targets, [
            "/en-blog/gitlab-ci-cd-for-it-infrastructure.html",
            "/en-blog/network-troubleshooting-checklist.html",
            "/en-blog/active-directory-hardening.html",
        ])

        for target in persian_targets:
            with self.subTest(target=target):
                self.assertRegex(read(target.lstrip("/")), r'<html\b[^>]*lang="fa"[^>]*dir="rtl"')
        for target in english_targets:
            with self.subTest(target=target):
                self.assertRegex(read(target.lstrip("/")), r'<html\b[^>]*lang="en"[^>]*dir="ltr"')


if __name__ == "__main__":
    unittest.main()
