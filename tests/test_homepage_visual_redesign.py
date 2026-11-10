"""Regression checks for the homepage-only visual redesign.

These source-level tests protect the page contract and prevent a legacy stylesheet
from being injected after the redesign and silently winning the CSS cascade.
"""
from pathlib import Path
import fnmatch
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
HOME = (ROOT / "index.html").read_text(encoding="utf-8")
EN_HOME = (ROOT / "en.html").read_text(encoding="utf-8")
HOME_CSS = (ROOT / "assets/home-visual-redesign-2026.css").read_text(encoding="utf-8")
BUNDLE_CSS = (ROOT / "assets/site-bundle.css").read_text(encoding="utf-8")
QUALITY_JS = (ROOT / "assets/site-final-quality-2026.js").read_text(encoding="utf-8")
THEME_JS = (ROOT / "assets/site-theme.js").read_text(encoding="utf-8")

def _relative_luminance(hex_color):
    """Return WCAG relative luminance for a #RRGGBB sRGB color."""
    channels = [int(hex_color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
              for channel in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def _contrast_ratio(foreground, background):
    first = _relative_luminance(foreground)
    second = _relative_luminance(background)
    lighter, darker = max(first, second), min(first, second)
    return (lighter + 0.05) / (darker + 0.05)


def _homepage_css_dependencies():
    """Return local assets referenced by homepage stylesheets, including nested CSS imports."""
    entrypoints = {
        path.lstrip("/")
        for path in re.findall(r'href="(/assets/[^"]+\.css)"', HOME)
    }
    pending = list(entrypoints)
    visited_css = set()
    dependencies = set()

    while pending:
        css_path = pending.pop()
        if css_path in visited_css:
            continue
        visited_css.add(css_path)
        dependencies.add(css_path)
        css_file = ROOT / css_path
        if not css_file.is_file():
            continue

        css = css_file.read_text(encoding="utf-8")
        for raw_url in re.findall(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", css, re.IGNORECASE):
            url = raw_url.strip()
            if not url.startswith("/") or url.startswith("//"):
                continue
            dependency = url.split("?", 1)[0].split("#", 1)[0].lstrip("/")
            if not dependency:
                continue
            dependencies.add(dependency)
            if dependency.endswith(".css"):
                pending.append(dependency)

    return dependencies


def _path_is_covered(path, patterns):
    return any(fnmatch.fnmatchcase(path, pattern) for pattern in patterns)



class HomepageVisualRedesignTests(unittest.TestCase):
    def test_redesign_stylesheet_is_loaded_once_after_shared_home_layers(self):
        href = "/assets/home-visual-redesign-2026.css"
        link = '<link rel="stylesheet" href="' + href + '" data-home-visual-redesign>'
        self.assertEqual(HOME.count(href), 1, "homepage redesign stylesheet must be linked exactly once")
        self.assertIn(link, HOME, "the runtime loader needs a reliable marker")
        self.assertEqual(HOME.count("/assets/site-bundle.css"), 1)
        self.assertLess(HOME.index("/assets/site-final-quality-2026.css"), HOME.index(href))

    def test_legacy_elite_layer_yields_to_explicit_homepage_redesign(self):
        guard = "if (document.querySelector('link[data-home-visual-redesign]')) return;"
        self.assertIn(guard, QUALITY_JS)
        self.assertLess(QUALITY_JS.index(guard), QUALITY_JS.index("link.href = '/assets/elite-home-2026.css'"))
        self.assertIn("link.dataset.eliteHomeVisual = 'true'", QUALITY_JS)
        # The shared bundle's generic header rule must yield to the scoped homepage sticky rule.
        self.assertIn(".mh-header{position:relative}", BUNDLE_CSS)
        self.assertIn(".mh-home .mh-header{position:sticky;top:0;", HOME_CSS)

    def test_persian_homepage_seo_language_and_accessibility_contract_is_preserved(self):
        self.assertTrue(HOME.startswith('<!doctype html><html lang="fa" dir="rtl">'))
        self.assertEqual(HOME.count("<title>"), 1)
        self.assertEqual(HOME.count('<meta name="description"'), 1)
        self.assertEqual(HOME.count('<link rel="canonical"'), 1)
        self.assertIn('href="https://mowhmmdh.github.io/"', HOME)
        self.assertIn('hreflang="en"', HOME)
        self.assertIn('id="main-content"', HOME)
        self.assertIn('class="skip-link"', HOME)
        self.assertIn('src="/images/profile.webp"', HOME)
        self.assertIn('type="application/ld+json"', HOME)
        for href in ("/projects.html", "/services.html", "/vintech.html", "/en.html"):
            self.assertIn('href="' + href + '"', HOME)

    def test_redesign_has_responsive_reduced_motion_and_focus_rules(self):
        self.assertIn("@media(max-width:900px)", HOME_CSS)
        self.assertIn("@media(max-width:600px)", HOME_CSS)
        self.assertIn("@media(prefers-reduced-motion:reduce)", HOME_CSS)
        self.assertIn(".mh-home :focus-visible", HOME_CSS)
        self.assertNotIn("@import url(", HOME_CSS)
        self.assertNotIn("@media(prefers-color-scheme:light)", HOME_CSS)
        self.assertIn("html.theme-light .mh-home", HOME_CSS)
        self.assertIn("theme(saved||'dark')", THEME_JS)

    def test_reduced_motion_disables_inherited_animations_and_pseudo_elements(self):
        # The shared bundle animates the orbit, rings, core, core pseudo-element, and nodes.
        for animation in (
            "animation:mh-float 7s ease-in-out infinite",
            "animation:mh-spin 18s linear infinite",
            "animation:mh-pulse 3.4s ease-in-out infinite",
            "animation:mh-spin-rev 20s linear infinite",
            "animation:mh-node 4s ease-in-out infinite",
        ):
            self.assertIn(animation, BUNDLE_CSS)

        reduced_motion_rule = (
            "@media(prefers-reduced-motion:reduce){"
            ".mh-home *, .mh-home *::before, .mh-home *::after{"
            "animation:none!important;"
            "transition:none!important;"
            "scroll-behavior:auto!important}"
            "}"
        )
        self.assertIn(reduced_motion_rule, HOME_CSS)

    def test_homepage_navigation_hides_the_redundant_mobile_menu_toggle(self):
        # The redesign deliberately keeps navigation links visible and wrapping on small screens.
        # A visible toggle would change aria-expanded but would not collapse or reveal these links.
        self.assertIn(".mh-home .mobile-menu{display:none}", HOME_CSS)
        self.assertIn(".mh-home .mh-nav-links{display:flex", HOME_CSS)
        self.assertIn(".mh-home .mh-nav-links{order:3;width:100%", HOME_CSS)

    def test_lower_orbit_nodes_are_lifted_above_the_terminal_panel(self):
        self.assertIn(".mh-home .mh-node-c,.mh-home .mh-node-d{bottom:32%}", HOME_CSS)

    def test_english_homepage_remains_ltr_and_outside_persian_redesign_scope(self):
        self.assertTrue(EN_HOME.startswith('<!doctype html><html lang="en" dir="ltr">'))
        self.assertNotIn("/assets/home-visual-redesign-2026.css", EN_HOME)
        self.assertNotIn('<body class="mh-home"', EN_HOME)

    def test_light_theme_small_labels_meet_wcag_aa_contrast(self):
        muted_rule = (
            "html.theme-light .mh-home .mh-node small,\n"
            "html.theme-light .mh-home .mh-proofbar small,\n"
            "html.theme-light .mh-home .mh-card-index,\n"
            "html.theme-light .mh-home .mh-terminal-top b,\n"
            "html.theme-light .mh-home .mh-identity-card span {color:#40566f}"
        )
        self.assertIn(muted_rule, HOME_CSS)
        self.assertIn(
            "html.theme-light .mh-home .mh-terminal code span {color:#245a85}",
            HOME_CSS,
        )
        # Check against the palest backgrounds used by the light-theme surfaces.
        self.assertGreaterEqual(_contrast_ratio("#40566f", "#edf3f8"), 4.5)
        self.assertGreaterEqual(_contrast_ratio("#245a85", "#f0f5f9"), 4.5)

    def test_light_theme_core_label_meets_wcag_aa_contrast(self):
        core_rule = "html.theme-light .mh-home .mh-core small{color:#40566f}"
        self.assertIn(core_rule, HOME_CSS)
        # The core uses a white-to-pale-blue gradient in light theme.
        self.assertGreaterEqual(_contrast_ratio("#40566f", "#ffffff"), 4.5)
        self.assertGreaterEqual(_contrast_ratio("#40566f", "#e4eef8"), 4.5)

    def test_light_theme_footer_metadata_meets_wcag_aa_contrast(self):
        footer_rule = (
            "html.theme-light .mh-home .mh-footer>div:first-child span{color:#586b80}\n"
            "html.theme-light .mh-home .legal-footer-2026{color:#586b80;border-color:rgba(35,58,84,.12)}"
        )
        self.assertIn(footer_rule, HOME_CSS)
        # The light-theme page background is #f4f7fb; small footer text needs 4.5:1.
        self.assertGreaterEqual(_contrast_ratio("#586b80", "#f4f7fb"), 4.5)



    def test_light_theme_accent_labels_meet_wcag_aa_contrast(self):
        accent_rule = (
            "html.theme-light .mh-home .mh-kicker,\n"
            "html.theme-light .mh-home .mh-eyebrow,\n"
            "html.theme-light .mh-home .mh-hero h1 span,\n"
            "html.theme-light .mh-home .mh-text-link,\n"
            "html.theme-light .mh-home .mh-node i,\n"
            "html.theme-light .mh-home .mh-card-tag,\n"
            "html.theme-light .mh-home .mh-expertise>span,\n"
            "html.theme-light .mh-home .mh-identity-card small,\n"
            "html.theme-light .mh-home .q-conversion-eyebrow {color:#075f64}"
        )
        self.assertIn(accent_rule, HOME_CSS)
        interactive_accent_rule = (
            "html.theme-light .mh-home .mh-brand em,\n"
            "html.theme-light .mh-home .mh-nav-links a:hover,\n"
            "html.theme-light .mh-home .mh-nav-links a:focus-visible,\n"
            "html.theme-light .mh-home .mh-profile-links a:hover,\n"
            "html.theme-light .mh-home .mh-footer-links a:hover,\n"
            "html.theme-light .mh-home .legal-footer-2026 a:hover {color:#075f64}"
        )
        self.assertIn(interactive_accent_rule, HOME_CSS)
        # Cover the light-theme page, cards, split section, conversion panel and node surfaces.
        for background in (
            "#eff4fa", "#edf3f9", "#e8eff7",
            "#f6f9fc", "#f4f7fb", "#ffffff",
        ):
            self.assertGreaterEqual(
                _contrast_ratio("#075f64", background),
                4.5,
                f"accent text fails WCAG AA on {background}",
            )


    def test_terminal_describes_work_domains_not_live_system_status(self):
        match = re.search(
            r'<div class="mh-terminal">.*?<pre><code>(.*?)</code></pre>',
            HOME,
            flags=re.DOTALL,
        )
        self.assertIsNotNone(match, "homepage terminal block must remain present")
        terminal = match.group(1)
        for unsupported in ("status --systems", "ONLINE", "MONITORED", "STABLE", "READY"):
            with self.subTest(unsupported=unsupported):
                self.assertNotIn(unsupported, terminal)
        for supported in (
            "focus --domains",
            "NETWORK</span>    DESIGN",
            "SECURITY</span>   HARDENING",
            "SYSTEMS</span>    OPERATIONS",
            "DELIVERY</span>   DOCUMENTATION",
        ):
            with self.subTest(supported=supported):
                self.assertIn(supported, terminal)

    def test_homepage_hero_illustration_has_a_named_graphic_role(self):
        expected = (
            '<div class="mh-hero-visual" role="img" '
            'aria-label="نمایش گرافیکی حوزه‌های شبکه، امنیت، سیستم‌ها و عملیات">'
        )
        self.assertIn(expected, HOME)

    def test_unverified_expertise_percentage_bars_are_removed(self):
        self.assertNotIn('class="mh-mini-bar"', HOME)
        self.assertNotRegex(HOME, r"--w:\s*\d+%")

    def test_below_fold_profile_image_is_deferred_and_keeps_identity_metadata(self):
        images = re.findall(r'<img\b[^>]*src="/images/profile\.webp"[^>]*>', HOME)
        self.assertEqual(len(images), 1, "profile image must appear exactly once")
        image = images[0]
        self.assertIn('loading="lazy"', image)
        self.assertNotIn("fetchpriority=", image)
        self.assertIn('width="580"', image)
        self.assertIn('height="725"', image)
        self.assertIn("محمدحسین عسگری ثمرین", image)
        self.assertIn("Mohammad Hossein Asgari Somarin", image)

    def test_homepage_brand_accessible_name_contains_its_visible_label(self):
        match = re.search(
            r'<a class="brand mh-brand"([^>]*)>(.*?)</a>',
            HOME,
            flags=re.DOTALL,
        )
        self.assertIsNotNone(match, "homepage brand link must remain present")
        aria_label = re.search(r'aria-label="([^"]+)"', match.group(1))
        self.assertIsNotNone(aria_label, "homepage brand link needs an accessible name")
        visible_text = re.sub(r"<[^>]+>", "", match.group(2))
        visible_text = re.sub(r"\s+", " ", visible_text).strip()
        for token in ("MH", "×", "VinTech"):
            with self.subTest(token=token):
                self.assertIn(token, visible_text)
                self.assertIn(token, aria_label.group(1))




    def test_mobile_homepage_navigation_overrides_shared_collapsed_link_state(self):
        self.assertIn(
            ".mh-home .mh-nav-links{order:3;width:100%;justify-content:flex-start;gap:8px 17px;position:static;inset:auto;top:auto;display:flex;flex-wrap:wrap;max-height:none;overflow:visible;opacity:1;visibility:visible;pointer-events:auto;background:transparent;border:0;border-radius:0;box-shadow:none;transform:none;z-index:auto}",
            HOME_CSS,
        )
        self.assertIn(
            ".mh-home .mh-nav-links a{font-size:12px;width:auto;max-width:none;flex:0 0 auto;min-width:auto;min-height:32px;white-space:nowrap;text-align:start;justify-content:flex-start;padding:5px 0}",
            HOME_CSS,
        )

    def test_homepage_nav_backdrop_cannot_expand_document_width(self):
        # The shared .site-nav::before rule uses -100vw side insets. The homepage
        # overrides those insets to the exact viewport bleed instead of 100vw.
        self.assertIn(
            ".mh-home .mh-nav:before{inset-inline:calc((100vw - 100%)/-2)}",
            HOME_CSS,
        )

    def test_homepage_does_not_load_personal_site_only_interaction_bundle(self):
        body = re.search(r"<body\b[^>]*>", HOME)
        self.assertIsNotNone(body, "homepage body must remain present")
        self.assertIn('class="mh-home"', body.group(0))
        self.assertNotIn("personal-site", body.group(0))
        self.assertNotIn('/assets/interaction-2026.js', HOME)


class HomepagePreviewWorkflowTests(unittest.TestCase):

    def test_preview_qa_triggers_for_every_local_homepage_asset(self):
        workflow = (ROOT / ".github/workflows/homepage-preview-qa.yml").read_text(encoding="utf-8")
        lines = workflow.splitlines()
        try:
            paths_index = lines.index("    paths:")
        except ValueError:
            self.fail("homepage preview workflow must declare PR path filters")

        configured_paths = set()
        for line in lines[paths_index + 1:]:
            if not line.startswith("      - "):
                break
            configured_paths.add(line[8:].strip().strip('"').strip("'"))

        runtime_assets = {
            path.lstrip("/")
            for path in re.findall(r'(?:href|src)="(/(?:assets|images)/[^"]+)"', HOME)
        }
        self.assertTrue(runtime_assets, "homepage should expose local runtime assets to audit")
        missing = sorted(path for path in runtime_assets if not _path_is_covered(path, configured_paths))
        self.assertEqual(
            missing,
            [],
            "homepage browser/Lighthouse QA must run when any directly referenced local asset changes",
        )


    def test_preview_qa_triggers_for_nested_stylesheet_and_font_dependencies(self):
        workflow = (ROOT / ".github/workflows/homepage-preview-qa.yml").read_text(encoding="utf-8")
        lines = workflow.splitlines()
        paths_index = lines.index("    paths:")
        configured_patterns = set()
        for line in lines[paths_index + 1:]:
            if not line.startswith("      - "):
                break
            configured_patterns.add(line[8:].strip().strip('"').strip("'"))

        dependencies = _homepage_css_dependencies()
        self.assertIn("assets/theme-stability-2026.css", dependencies)
        self.assertTrue(any(path.startswith("fonts/") for path in dependencies))
        missing = sorted(
            path for path in dependencies
            if not _path_is_covered(path, configured_patterns)
        )
        self.assertEqual(
            missing,
            [],
            "homepage browser/Lighthouse QA must run when nested CSS or font dependencies change",
        )

    def test_preview_qa_targets_the_triggering_pull_request(self):
        workflow = (ROOT / ".github/workflows/homepage-preview-qa.yml").read_text(encoding="utf-8")
        self.assertIn("pull_request_number:", workflow)
        self.assertIn('default: "27"', workflow)
        self.assertIn(
            "github.event.pull_request.number || inputs.pull_request_number || '27'",
            workflow,
        )
        self.assertNotIn(
            "PREVIEW_URL: https://deploy-preview-27--mowhmmdh.netlify.app/",
            workflow,
            "PR-triggered runs must not silently audit the stale #27 preview",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
