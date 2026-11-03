"""Regression tests for mobile navigation on key Persian site pages."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
SERVICES = (ROOT / "services.html").read_text(encoding="utf-8")
PROJECTS = (ROOT / "projects.html").read_text(encoding="utf-8")


class MobileNavigationTests(unittest.TestCase):
    def test_services_primary_navigation_links_remain_present(self):
        expected = (
            'href="/"',
            'href="/vintech.html"',
            'href="/projects.html"',
            'href="/blog/"',
            'href="/about.html"',
        )
        header = re.search(r'<header class="wrap nav">(.*?)</header>', SERVICES, re.S)
        self.assertIsNotNone(header, "Services primary navigation header should exist")
        for href in expected:
            with self.subTest(href=href):
                self.assertIn(href, header.group(1))

    def test_mobile_navigation_is_not_hidden_on_either_page(self):
        for page_name, html in (("services", SERVICES), ("projects", PROJECTS)):
            with self.subTest(page=page_name):
                self.assertNotRegex(html, r"\.nav\s+div\s*\{\s*display\s*:\s*none")
                self.assertRegex(html, r"\.nav div\s*\{[^}]*display\s*:\s*flex")
                self.assertRegex(html, r"flex-wrap\s*:\s*wrap")
                self.assertRegex(html, r"\.nav div a\s*\{[^}]*margin-inline-start\s*:\s*0")

    def test_mobile_breakpoint_is_preserved_on_both_pages(self):
        for page_name, html in (("services", SERVICES), ("projects", PROJECTS)):
            with self.subTest(page=page_name):
                self.assertRegex(html, r"@media\s*\(max-width\s*:\s*720px\)")

    def test_pages_preserve_persian_rtl_semantics(self):
        for page_name, html in (("services", SERVICES), ("projects", PROJECTS)):
            with self.subTest(page=page_name):
                self.assertRegex(html, r'<html[^>]*lang="fa"[^>]*dir="rtl"')


    def test_large_secondary_project_photo_loads_only_on_user_request(self):
        image_url = "https://raw.githubusercontent.com/mowhmmdh/Projects/main/20260430_204434.jpg"
        self.assertEqual(PROJECTS.count(image_url), 1)

        block = re.search(
            r'<details class="mahex-secondary">(.*?)</details>',
            PROJECTS,
            re.DOTALL,
        )
        self.assertIsNotNone(block, "secondary photo must be inside a native disclosure")
        content = block.group(1)
        self.assertRegex(content, r"<summary>.*?نمایش تصویر تکمیلی پروژه.*?</summary>")
        self.assertNotIn(
            '<details class="mahex-secondary" open',
            PROJECTS,
            "the large image must not be expanded by default",
        )

        image = re.search(r"<img([^>]*)>", content)
        self.assertIsNotNone(image, "the original secondary photo must remain available")
        attributes = image.group(1)
        self.assertIn(f'src="{image_url}"', attributes)
        self.assertIn('loading="lazy"', attributes)
        self.assertIn('fetchpriority="low"', attributes)
        self.assertIn('decoding="async"', attributes)
        self.assertIn('loading="eager" fetchpriority="high"', PROJECTS,
                      "the primary hero image must retain its LCP priority")

if __name__ == "__main__":
    unittest.main()
