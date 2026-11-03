"""Regression tests for machine-readable links in the public llms.txt index."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
CONTENT = (ROOT / "llms.txt").read_text(encoding="utf-8")
LINK_RE = re.compile(r"\[([^\]]+)\]\((https://[^)\s]+)\)")
SITE = "https://mowhmmdh.github.io"


class LlmsTxtMarkdownLinksTests(unittest.TestCase):
    def test_file_has_markdown_heading_and_descriptive_links(self):
        self.assertRegex(CONTENT, r"(?m)^# .+")
        links = LINK_RE.findall(CONTENT)
        self.assertGreaterEqual(len(links), 13)
        self.assertTrue(all(label.strip() for label, _ in links))

    def test_all_http_urls_are_markdown_link_destinations(self):
        without_links = LINK_RE.sub("", CONTENT)
        bare_urls = re.findall(r"https?://[^\s)]+", without_links)
        self.assertEqual(bare_urls, [], f"bare URLs are not discoverable Markdown links: {bare_urls}")

    def test_internal_and_profile_destinations_are_preserved_and_unique(self):
        destinations = [url for _, url in LINK_RE.findall(CONTENT)]
        internal = [url for url in destinations if url.startswith(SITE)]
        self.assertGreaterEqual(len(internal), 10)
        self.assertEqual(len(internal), len(set(internal)), "duplicate internal destinations reduce index clarity")
        expected = {
            SITE + "/", SITE + "/en.html", SITE + "/about.html",
            SITE + "/projects.html", SITE + "/services.html", SITE + "/blog/",
            SITE + "/blog/nginx-ssl-cdn-reverse-proxy-troubleshooting.html",
            SITE + "/press.html", SITE + "/linkedin.html",
            SITE + "/vintech.html", SITE + "/en-vintech.html",
            "https://github.com/mowhmmdh",
            "https://www.linkedin.com/in/mohammadhosseinasgari/",
            "https://instagram.com/mowhmmdh",
        }
        self.assertEqual(set(destinations), expected)

    def test_identity_and_sanitization_guidance_remain_present(self):
        self.assertIn("محمدحسین عسگری ثمرین", CONTENT)
        self.assertIn("Mohammad Hossein Asgari Somarin", CONTENT)
        self.assertIn('"Mohammad Hossein Asgari" is the shorter English display/search variant', CONTENT)
        self.assertIn('"Mohammad Hossein Asgari Somarin" is the canonical English form', CONTENT)
        self.assertIn("Public technical material is sanitized", CONTENT)
        self.assertIn("confidential information", CONTENT)


if __name__ == "__main__":
    unittest.main(verbosity=2)
