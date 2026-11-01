import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
HTML = (ROOT / "en.html").read_text(encoding="utf-8")


class EnglishHomepageClaimAccuracyTests(unittest.TestCase):
    def test_terminal_describes_work_domains_not_live_system_status(self):
        self.assertIn("work --domains", HTML)
        for status in ("ONLINE", "MONITORED", "STABLE", "READY", "status --systems"):
            self.assertNotIn(status, HTML)

    def test_expertise_cards_have_no_unsupported_percentage_bars(self):
        self.assertNotIn("mh-mini-bar", HTML)
        for percentage in ("--w:92%", "--w:88%", "--w:84%", "--w:90%"):
            self.assertNotIn(percentage, HTML)

    def test_below_fold_profile_image_uses_lazy_loading(self):
        start = HTML.index('<div class="mh-identity-card">')
        end = HTML.index("</div>", start)
        image_card = HTML[start:end]
        self.assertIn('loading="lazy"', image_card)
        self.assertNotIn('fetchpriority="high"', image_card)

    def test_identity_and_primary_navigation_remain(self):
        self.assertIn("Mohammad Hossein Asgari Somarin", HTML)
        self.assertIn("Network &amp; Infrastructure Specialist", HTML)
        for href in ("/en-projects.html", "/en-authority.html", "/en-services.html", "/en-about.html"):
            self.assertIn(href, HTML)
        self.assertIn('id="main-content"', HTML)


if __name__ == "__main__":
    unittest.main()
