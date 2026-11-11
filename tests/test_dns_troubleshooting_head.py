from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog" / "dns-troubleshooting.html"


class DnsTroubleshootingHeadRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source = PAGE.read_text(encoding="utf-8")
        match = re.search(r"<head\\b[^>]*>(.*?)</head\\s*>", source, re.IGNORECASE | re.DOTALL)
        if match is None:
            raise AssertionError("DNS troubleshooting page must contain a head element")
        cls.head = match.group(1)

    def test_head_has_no_literal_backslash_n_sequences(self):
        self.assertNotIn(r"\\n", self.head)

    def test_canonical_and_bilingual_alternates_remain_in_head(self):
        self.assertIn('rel="canonical"', self.head)
        self.assertIn('hreflang="fa-IR"', self.head)
        self.assertIn('hreflang="en"', self.head)


if __name__ == "__main__":
    unittest.main()
