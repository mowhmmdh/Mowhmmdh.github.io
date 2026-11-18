"""Regression tests for the DNS troubleshooting article's static enhancements."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGE = (ROOT / "blog/dns-troubleshooting.html").read_text(encoding="utf-8")
QUALITY_CSS = (ROOT / "assets/site-final-quality-2026.css").read_text(encoding="utf-8")
WORKFLOW = (ROOT / ".github/workflows/dns-troubleshooting-static-enhancement.yml").read_text(encoding="utf-8")
BROWSER_QA = (ROOT / "scripts/dns-troubleshooting-browser-qa.cjs").read_text(encoding="utf-8")


class DnsTroubleshootingStaticEnhancementTests(unittest.TestCase):
    def test_shared_enhancer_is_removed_but_theme_and_quality_styles_remain(self):
        self.assertNotIn(
            '<script src="/assets/site-final-quality-2026.js" defer></script>',
            PAGE,
        )
        self.assertIn('<script src="/assets/site-theme.js" defer></script>', PAGE)
        self.assertIn('<link rel="stylesheet" href="/assets/site-final-quality-2026.css">', PAGE)

    def test_one_static_mobile_cta_preserves_the_existing_conversion_contract(self):
        expected = (
            '<a class="q-mobile-cta" href="/vintech/request.html" '
            'data-conversion="mobile_service_request">درخواست پروژه / مشاوره</a>'
        )
        self.assertEqual(PAGE.count(expected), 1)
        self.assertTrue((ROOT / "vintech/request.html").is_file())

    def test_existing_service_conversion_and_related_sections_are_preserved(self):
        self.assertIn('<section class="seo-conversion-cta"', PAGE)
        self.assertIn('<section class="auto-related"', PAGE)
        self.assertIn('<section class="related-articles site-auto-related"', PAGE)
        self.assertNotIn('class="q-conversion"', PAGE)
        for route in (
            "/services.html",
            "/vintech/request.html",
            "/blog/dns-security-and-troubleshooting.html",
            "/blog/network-troubleshooting-checklist.html",
            "/blog/cctv-ip-camera-network-design.html",
        ):
            self.assertIn('href="' + route + '"', PAGE)
            self.assertTrue((ROOT / route.lstrip("/")).is_file(), route)

    def test_footer_separator_is_static_decorative_and_inside_the_existing_footer(self):
        expected = '<footer class="legal-footer-2026"><div class="q-footerline" aria-hidden="true"></div>'
        self.assertIn(expected, PAGE)
        self.assertIn("</footer><a class=\"q-mobile-cta\"", PAGE)
        for route in ("/privacy.html", "/terms.html", "/disclosure.html"):
            self.assertIn('href="' + route + '"', PAGE)
        self.assertIn('href="mailto:mohammedhasgari@gmail.com"', PAGE)

    def test_persian_rtl_canonical_hreflang_and_structured_data_are_preserved(self):
        self.assertIn('<html lang="fa" dir="rtl">', PAGE)
        self.assertIn(
            '<link rel="canonical" href="https://mowhmmdh.github.io/blog/dns-troubleshooting.html">',
            PAGE,
        )
        for language in ("fa-IR", "en", "x-default"):
            self.assertIn('hreflang="' + language + '"', PAGE)
        self.assertIn('"@type":"Article"', PAGE)
        self.assertIn('"@type":"BreadcrumbList"', PAGE)
        self.assertIn('"inLanguage":"fa-IR"', PAGE)

    def test_mobile_cta_remains_hidden_on_desktop_and_visible_on_mobile(self):
        self.assertIn(".q-mobile-cta{display:none}", QUALITY_CSS)
        self.assertIn("@media(max-width:760px)", QUALITY_CSS)
        self.assertIn(".q-mobile-cta{display:flex", QUALITY_CSS)
        self.assertIn(".q-mobile-cta:focus-visible", QUALITY_CSS)

    def test_browser_qa_covers_both_viewports_and_real_horizontal_scroll(self):
        self.assertIn("1440, height: 1000", BROWSER_QA)
        self.assertIn("390, height: 844", BROWSER_QA)
        self.assertIn("window.scrollTo(10000, 0)", BROWSER_QA)
        self.assertIn("horizontalScrollX > 1", BROWSER_QA)
        self.assertIn("mobileCtaVisibleAndInBounds", BROWSER_QA)
        self.assertIn("desktopCtaHidden", BROWSER_QA)

    def test_browser_qa_checks_seo_conversion_and_removed_script(self):
        for contract in (
            "canonicalPreserved",
            "hreflangSet",
            "articleSchema",
            "breadcrumbSchema",
            "serviceConversionPreserved",
            "relatedSectionsPreserved",
            "footerLineDecorative",
            "removedEnhancerNotRequested",
        ):
            self.assertIn(contract, BROWSER_QA)

    def test_browser_lighthouse_workflow_is_pr_scoped_and_read_only(self):
        self.assertIn("pull_request:", WORKFLOW)
        self.assertIn("contents: read", WORKFLOW)
        self.assertIn("github.event.pull_request.number", WORKFLOW)
        self.assertIn("deploy-preview-", WORKFLOW)
        self.assertNotIn("deploy-preview-54--", WORKFLOW)
        self.assertIn("Run focused regression tests", WORKFLOW)
        self.assertIn("Run desktop and mobile Chromium checks", WORKFLOW)
        self.assertIn("Run mobile Lighthouse", WORKFLOW)
        self.assertIn("Run desktop Lighthouse", WORKFLOW)
        self.assertIn("performance: 90", WORKFLOW)
        self.assertIn("accessibility: 95", WORKFLOW)
        self.assertIn("best-practices: 95", WORKFLOW)


if __name__ == "__main__":
    unittest.main(verbosity=2)
