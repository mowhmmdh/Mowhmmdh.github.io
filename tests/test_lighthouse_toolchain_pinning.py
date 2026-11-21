from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_WORKFLOW = ROOT / ".github/workflows/lighthouse-pages.yml"
SMOKE_WORKFLOW = ROOT / ".github/workflows/lighthouse-toolchain-smoke.yml"

INSTALL = (
    "npm install --global lighthouse@13.6.0 "
    "@sentry/node@11.13.0 @sentry/core@11.13.0"
)
EXPECTED_VERSIONS = (
    "lighthouse: '13.6.0'",
    "'@sentry/node': '11.13.0'",
    "'@sentry/core': '11.13.0'",
)


class LighthouseToolchainPinningTests(unittest.TestCase):
    def test_production_audit_uses_exact_compatible_versions(self):
        source = PRODUCTION_WORKFLOW.read_text(encoding="utf-8")
        self.assertIn(INSTALL, source)
        self.assertNotRegex(source, r"npm install --global lighthouse@13(?:\s|$)")

    def test_smoke_workflow_installs_and_verifies_same_toolchain(self):
        source = SMOKE_WORKFLOW.read_text(encoding="utf-8")
        self.assertIn(INSTALL, source)
        self.assertIn("lighthouse --version", source)
        self.assertIn("npm ls --global --depth=2 lighthouse @sentry/node @sentry/core", source)

    def test_smoke_workflow_asserts_exact_resolved_top_level_versions(self):
        source = SMOKE_WORKFLOW.read_text(encoding="utf-8")
        self.assertIn('npm ls --global --depth=0 --json', source)
        for version_assertion in EXPECTED_VERSIONS:
            with self.subTest(assertion=version_assertion):
                self.assertIn(version_assertion, source)
        self.assertIn("tree.dependencies?.[name]?.version", source)
        self.assertIn("if (failed) process.exit(1)", source)

    def test_smoke_workflow_is_read_only_and_path_scoped(self):
        source = SMOKE_WORKFLOW.read_text(encoding="utf-8")
        self.assertRegex(source, r"permissions:\s*\n\s+contents:\s*read")
        self.assertNotRegex(source, r"contents:\s*write")
        self.assertIn("pull_request:", source)
        self.assertIn("paths:", source)


if __name__ == "__main__":
    unittest.main()
