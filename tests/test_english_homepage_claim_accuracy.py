import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
HTML = (ROOT / "en.html").read_text(encoding="utf-8")


class EnglishHomepageClaimAccuracyTests(unittest.TestCase):
    def test_terminal_describes_work_domains_not_live_system_status(self):
        self.assertIn("work --domains", HTML)
        for status in ("ONLINE", "MONITORED", "STABLE", "READY", "status --systems"):
            self.assertNotIn(status, HTML)

    def test_expertise_cards_have_no_unsupported_percentage_bars(self):
        self.assertNotRegex(HTML, r"mh-mini-bar|--w:\\s*\\d+%")

    def test_profile_image_below_fold_is_not_eagerly_prioritized(self):
        match = re.search(r'<img[^>]+class=["\'][^"\']*mh-profile[^"\']*["\'][^>]*>', HTML)
        image = re.search(r'<div class="mh-identity-card">([\\s\\S]*?)</div>', HTML)
        self.assertIsNotNone(image)
        self.assertIn('loading="lazy"', image.group(1))
        self.assertNotIn('fetchpriority="high"', image.group(1))

    def test_primary_identity_and_navigation_remain(self):
        self.assertIn("Mohammad Hossein Asgari Somarin", HTML)
        self.assertIn("Network &amp; Infrastructure Specialist", HTML)
        for href in ("/en-projects.html", "/en-authority.html", "/en-services.html", "/en-about.html"):
            self.assertIn(href, HTML)
        self.assertIn('id="main-content"', HTML)


if __name__ == "__main__":
    unittest.main()
