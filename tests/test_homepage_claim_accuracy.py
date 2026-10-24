"""Regression tests for truthful, evidence-aligned homepage presentation."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")


def terminal_code():
    match = re.search(
        r'<div class="mh-terminal">.*?<pre><code>(.*?)</code></pre>',
        HTML,
        flags=re.DOTALL,
    )
    if not match:
        raise AssertionError("Homepage terminal block is missing")
    return match.group(1)


class HomepageClaimAccuracyTests(unittest.TestCase):
    def test_terminal_does_not_claim_live_system_status(self):
        terminal = terminal_code()
        for unsupported_status in (
            "status --systems",
            "ONLINE",
            "MONITORED",
            "STABLE",
            "READY",
        ):
            with self.subTest(unsupported_status=unsupported_status):
                self.assertNotIn(unsupported_status, terminal)

    def test_terminal_describes_work_domains_instead_of_status_metrics(self):
        terminal = terminal_code()
        for label in (
            "focus --domains",
            "NETWORK</span>    DESIGN",
            "SECURITY</span>   HARDENING",
            "SYSTEMS</span>    OPERATIONS",
            "DELIVERY</span>   DOCUMENTATION",
        ):
            with self.subTest(label=label):
                self.assertIn(label, terminal)

    def test_unsupported_percentage_skill_bars_are_removed(self):
        self.assertNotIn('class="mh-mini-bar"', HTML)
        self.assertNotRegex(HTML, r"--w:\s*\d+%")

    def test_primary_content_and_conversion_paths_remain(self):
        self.assertIn('id="main-content"', HTML)
        self.assertIn('href="/vintech/request.html"', HTML)
        self.assertIn('href="/services.html"', HTML)
        self.assertIn("شبکه و زیرساخت", HTML)
        self.assertIn("سیستم و سرور", HTML)
        self.assertIn("امنیت و Hardening", HTML)
        self.assertIn("عملیات و پشتیبانی IT", HTML)


if __name__ == "__main__":
    unittest.main(verbosity=2)
