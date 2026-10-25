"""Regression tests for bilingual language detection in the shared enhancement script."""
from pathlib import Path
import re
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "assets" / "site-final-quality-2026.js"


def detected_as_persian(path: str) -> bool:
    source = SCRIPT.read_text(encoding="utf-8")
    match = re.search(r"const fa = !/(.*?)/i\.test\(path\);", source)
    if not match:
        raise AssertionError("Could not find the shared language-detection expression")
    # The extracted expression is a JavaScript regex literal body. Its only
    # JavaScript-specific escape here is \\/ for a literal slash.
    pattern = match.group(1).replace(r"\/", "/")
    return re.search(pattern, path, flags=re.IGNORECASE) is None


class LanguageDetectionRegressionTests(unittest.TestCase):
    def test_english_homepage_html_suffix_is_english(self):
        self.assertFalse(detected_as_persian("/en.html"))

    def test_english_section_routes_are_english(self):
        for path in ("/en-blog/network-security.html", "/en-vintech.html", "/en-services.html"):
            with self.subTest(path=path):
                self.assertFalse(detected_as_persian(path))

    def test_persian_routes_remain_persian(self):
        for path in ("/", "/blog/network-security.html", "/vintech/request.html"):
            with self.subTest(path=path):
                self.assertTrue(detected_as_persian(path))


if __name__ == "__main__":
    unittest.main()
