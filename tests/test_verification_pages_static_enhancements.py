"""Static enhancement regression tests for the bilingual verification pages."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "assets" / "site-final-quality-2026.css").read_text(encoding="utf-8")

PAGES = {
    "verification.html": {
        "lang_dir": '<html lang="fa" dir="rtl">',
        "canonical": "https://mowhmmdh.github.io/verification.html",
        "english": "https://mowhmmdh.github.io/en-verification.html",
        "cta_href": "/vintech/request.html",
        "cta_label": "درخواست پروژه / مشاوره",
        "conversion_label": "درخواست بررسی / پروژه",
        "email_label": "ایمیل مستقیم",
        "legal": '<a href="/privacy.html">حریم خصوصی</a>',
    },
    "en-verification.html": {
        "lang_dir": '<html lang="en" dir="ltr">',
        "canonical": "https://mowhmmdh.github.io/en-verification.html",
        "english": "https://mowhmmdh.github.io/en-verification.html",
        "cta_href": "/en-vintech/request.html",
        "cta_label": "Request a project review",
        "conversion_label": "Request a project review",
        "email_label": "Direct email",
        "legal": '<a href="/en-privacy.html">Privacy</a>',
    },
}


class BilingualVerificationStaticEnhancementTests(unittest.TestCase):
    def test_both_pages_keep_language_canonical_and_reciprocal_hreflang(self):
        for relative_path, expected in PAGES.items():
            with self.subTest(page=relative_path):
                html = (ROOT / relative_path).read_text(encoding="utf-8")
                self.assertIn(expected["lang_dir"], html)
                self.assertIn(f'<link rel="canonical" href="{expected["canonical"]}">', html)
                if relative_path == "verification.html":
                    self.assertIn(f'hreflang="fa-IR" href="{expected["canonical"]}"', html)
                    self.assertIn(f'hreflang="en" href="{expected["english"]}"', html)
                    self.assertIn('hreflang="x-default" href="https://mowhmmdh.github.io/verification.html"', html)
                else:
                    self.assertIn(f'hreflang="en" href="{expected["canonical"]}"', html)
                    self.assertIn('hreflang="fa-IR" href="https://mowhmmdh.github.io/verification.html"', html)
                    self.assertIn('hreflang="x-default" href="https://mowhmmdh.github.io/verification.html"', html)

    def test_shared_enhancer_is_removed_but_required_theme_and_styles_remain(self):
        for relative_path in PAGES:
            with self.subTest(page=relative_path):
                html = (ROOT / relative_path).read_text(encoding="utf-8")
                self.assertNotIn('src="/assets/site-final-quality-2026.js"', html)
                self.assertIn('src="/assets/site-theme.js" defer', html)
                self.assertIn('href="/assets/site-bundle.css"', html)
                self.assertIn('href="/assets/site-final-quality-2026.css"', html)

    def test_static_conversion_and_mobile_cta_preserve_language_specific_routes(self):
        for relative_path, expected in PAGES.items():
            with self.subTest(page=relative_path):
                html = (ROOT / relative_path).read_text(encoding="utf-8")
                self.assertEqual(html.count('class="q-conversion"'), 1)
                self.assertEqual(html.count('class="q-mobile-cta"'), 1)
                self.assertEqual(html.count('data-conversion="service_request"'), 1)
                self.assertEqual(html.count('data-conversion="email"'), 1)
                self.assertEqual(html.count('data-conversion="mobile_service_request"'), 1)
                self.assertIn(f'href="{expected["cta_href"]}" data-conversion="mobile_service_request"', html)
                self.assertIn(f'>{expected["cta_label"]}</a>', html)
                self.assertIn(f'>{expected["conversion_label"]} ↗</a>', html)
                self.assertIn(f'>{expected["email_label"]}</a>', html)

    def test_footer_divider_is_static_decorative_and_in_the_content_footer(self):
        for relative_path in PAGES:
            with self.subTest(page=relative_path):
                html = (ROOT / relative_path).read_text(encoding="utf-8")
                self.assertEqual(html.count('class="q-footerline"'), 1)
                self.assertIn('<div class="q-footerline" aria-hidden="true"></div>', html)
                self.assertLess(html.index('class="q-footerline"'), html.index('class="legal-footer-2026"'))
                self.assertLess(html.index('class="legal-footer-2026"'), html.index('class="q-conversion"'))
                self.assertLess(html.index('class="q-conversion"'), html.index('class="q-mobile-cta"'))

    def test_identity_content_breadcrumbs_and_language_specific_legal_footers_remain(self):
        for relative_path, expected in PAGES.items():
            with self.subTest(page=relative_path):
                html = (ROOT / relative_path).read_text(encoding="utf-8")
                self.assertIn('"@type":"BreadcrumbList"', html)
                self.assertIn("IDENTITY / PUBLIC REFERENCE", html)
                self.assertIn(expected["legal"], html)
                self.assertIn("mohammedhasgari@gmail.com", html)
        fa = (ROOT / "verification.html").read_text(encoding="utf-8")
        en = (ROOT / "en-verification.html").read_text(encoding="utf-8")
        self.assertIn("محمدحسین عسگری ثمرین", fa)
        self.assertIn("Mohammad Hossein Asgari Somarin", en)
        self.assertIn("Self-published material", en)
        self.assertIn("به‌عنوان «پوشش رسانه‌ای مستقل»", fa)

    def test_shared_styles_still_define_conversion_and_mobile_cta_components(self):
        self.assertIn(".q-mobile-cta{display:none}", CSS)
        self.assertIn(".q-conversion{", CSS)
        self.assertIn(".q-footerline{", CSS)
        self.assertIn("@media(max-width:760px)", CSS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
