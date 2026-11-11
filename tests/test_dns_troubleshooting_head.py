from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "blog" / "dns-troubleshooting.html"


class DnsTroubleshootingHeadRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source = PAGE.read_text(encoding="utf-8")
        lower = source.lower()
        opening = lower.find("<head")
        if opening < 0:
            raise AssertionError("DNS troubleshooting page must contain a head element")
        start = source.find(">", opening)
        end = lower.find("</head>", start + 1)
        if start < 0 or end < 0:
            raise AssertionError("DNS troubleshooting page must contain a closed head element")
        cls.head = source[start + 1:end]

    def test_head_has_no_literal_backslash_n_sequences(self):
        self.assertNotIn(chr(92) + "n", self.head)

    def test_canonical_and_bilingual_alternates_remain_in_head(self):
        self.assertIn('rel="canonical"', self.head)
        self.assertIn('hreflang="fa-IR"', self.head)
        self.assertIn('hreflang="en"', self.head)


if __name__ == "__main__":
    unittest.main()
