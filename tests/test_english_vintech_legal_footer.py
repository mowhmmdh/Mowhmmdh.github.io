"""Regression tests for English-language VinTech legal footers."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / "en-vintech.html", *sorted((ROOT / "en-vintech").rglob("*.html"))]
FOOTER_MARKER = '<footer class="legal-footer-2026">'
EXPECTED_LINKS = (
    ('<a href="/en-privacy.html">Privacy</a>', "/en-privacy.html"),
    ('<a href="/en-terms.html">Terms</a>', "/en-terms.html"),
    ('<a href="/en-disclosure.html">Disclosure</a>', "/en-disclosure.html"),
)
CONTACT_LINK = '<a href="mailto:mohammedhasgari@gmail.com">Contact</a>'


class EnglishVinTechLegalFooterTests(unittest.TestCase):
    def test_every_english_vintech_page_is_marked_english_ltr(self):
        self.assertTrue(PAGES, "No English VinTech pages were discovered")
        for path in PAGES:
            with self.subTest(page=path.relative_to(ROOT).as_posix()):
                html = path.read_text(encoding="utf-8")
                html_tag = html.split("<html", 1)[1].split(">", 1)[0]
                self.assertIn('lang="en"', html_tag)
                self.assertIn('dir="ltr"', html_tag)

    def test_every_english_vintech_footer_uses_english_labels_and_targets(self):
        self.assertTrue(PAGES, "No English VinTech pages were discovered")
        for path in PAGES:
            with self.subTest(page=path.relative_to(ROOT).as_posix()):
                html = path.read_text(encoding="utf-8")
                self.assertEqual(html.count(FOOTER_MARKER), 1)
                footer = html.split(FOOTER_MARKER, 1)[1].split("</footer>", 1)[0]
                for markup, _target in EXPECTED_LINKS:
                    self.assertIn(markup, footer)
                self.assertIn(CONTACT_LINK, footer)
                self.assertFalse(any("\u0600" <= char <= "\u06FF" for char in footer))

    def test_english_legal_destination_pages_exist(self):
        for _markup, target in EXPECTED_LINKS:
            with self.subTest(target=target):
                self.assertTrue((ROOT / target.lstrip("/")).is_file())


if __name__ == "__main__":
    unittest.main(verbosity=2)
