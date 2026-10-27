"""Safety regression tests for dormant site-mutating workflows."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_DIR = ROOT / ".github" / "workflows"
WORKFLOW_PATHS = (
    ".github/workflows/seo-sync.yml",
    ".github/workflows/site-repair-2026.yml",
    ".github/workflows/sitemap-refresh-2026.yml",
    ".github/workflows/sitewide-seo-audit.yml",
    ".github/workflows/sitewide-seo-visual-sync.yml",
    ".github/workflows/visual-consistency-2026.yml",
)
DIRECT_MAIN_PUSH = re.compile(
    r"\bgit\s+push\b[^\n]*\b(?:HEAD:)?(?:refs/heads/)?main\b",
    re.IGNORECASE,
)


def workflow_files():
    return sorted(
        path for path in WORKFLOW_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in {".yml", ".yaml"}
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

    def test_detector_catches_main_pushes_but_allows_branch_pushes(self):
        for command in (
            "git push origin main",
            "git push upstream HEAD:main",
            "git push --force origin HEAD:refs/heads/main",
        ):
            with self.subTest(command=command):
                self.assertIsNotNone(DIRECT_MAIN_PUSH.search(command))
        self.assertIsNone(DIRECT_MAIN_PUSH.search("git push origin feature/safe-branch"))

    def test_no_workflow_contains_a_direct_git_push_to_main(self):
        # Normalize shell line continuations so split commands are inspected together.
        for path in workflow_files():
            with self.subTest(workflow=path.name):
                content = path.read_text(encoding="utf-8")
                normalized = re.sub(r"\\\s*\n", " ", content)
                self.assertIsNone(
                    DIRECT_MAIN_PUSH.search(normalized),
                    f"{path.relative_to(ROOT)} contains a direct git push to main",
                )

    def test_safety_gate_is_read_only_and_runs_on_pull_requests(self):
        workflow = (ROOT / ".github/workflows/workflow-write-safety.yml").read_text(encoding="utf-8")
        self.assertIn("pull_request:", workflow)
        self.assertRegex(workflow, r"(?m)^\s+contents:\s*read\s*$")
        self.assertIn('test_workflow_write_safety.py', workflow)


if __name__ == "__main__":
    unittest.main(verbosity=2)
