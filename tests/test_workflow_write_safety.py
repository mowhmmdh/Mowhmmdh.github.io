"""Safety regression tests for dormant site-mutating workflows."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_PATHS = (
    ".github/workflows/seo-sync.yml",
    ".github/workflows/site-repair-2026.yml",
    ".github/workflows/sitemap-refresh-2026.yml",
    ".github/workflows/sitewide-seo-audit.yml",
    ".github/workflows/sitewide-seo-visual-sync.yml",
    ".github/workflows/visual-consistency-2026.yml",
)


class WorkflowWriteSafetyTests(unittest.TestCase):
    def test_legacy_mutators_remain_paused_read_only_and_cannot_push(self):
        for relative_path in WORKFLOW_PATHS:
            with self.subTest(workflow=relative_path):
                content = (ROOT / relative_path).read_text(encoding="utf-8")
                self.assertRegex(content, r"(?m)^\s+if:\s*false\b")
                self.assertRegex(content, r"(?m)^\s+contents:\s*read\s*$")
                self.assertNotRegex(content, r"(?im)\bgit\s+push\b")
                self.assertNotRegex(content, r"(?im)\bgit\s+commit\b")
                self.assertNotRegex(content, r"(?m)^\s*contents:\s*write\s*$")
                self.assertIn("Report generated changes without writing to main", content)

    def test_safety_gate_is_read_only_and_runs_on_pull_requests(self):
        workflow = (ROOT / ".github/workflows/workflow-write-safety.yml").read_text(encoding="utf-8")
        self.assertIn("pull_request:", workflow)
        self.assertRegex(workflow, r"(?m)^\s+contents:\s*read\s*$")
        self.assertIn('test_workflow_write_safety.py', workflow)


if __name__ == "__main__":
    unittest.main(verbosity=2)
