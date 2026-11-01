"""Regression checks for bilingual, keyboard-safe shared mobile navigation."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = (ROOT / "assets/site-theme.js").read_text(encoding="utf-8")


class MobileNavAccessibilityTests(unittest.TestCase):
    def test_persian_about_page_has_a_real_mobile_menu_control(self):
        page = (ROOT / "about.html").read_text(encoding="utf-8")
        self.assertIn('class="about-nav"', page)
        self.assertIn('class="about-nav-links"', page)
        self.assertIn('class="mobile-menu"', page)
        self.assertIn('aria-expanded="false"', page)
        self.assertIn(".about-nav.menu-open .about-nav-links", page)

    def test_english_about_page_has_a_real_mobile_menu_control(self):
        page = (ROOT / "en-about.html").read_text(encoding="utf-8")
        self.assertIn('<html lang="en" dir="ltr">', page)
        self.assertIn('class="en-nav-links"', page)
        self.assertIn('class="mobile-menu"', page)
        self.assertIn('aria-expanded="false"', page)
        self.assertIn('aria-current="page">About</a>', page)
        self.assertIn(".en-nav.menu-open .en-nav-links", page)

    def test_menu_labels_follow_the_document_language(self):
        self.assertIn("const english=(document.documentElement.lang||'').toLowerCase().startsWith('en');", SCRIPT)
        self.assertIn("? {open:'Open menu',close:'Close menu'}", SCRIPT)
        self.assertIn(": {open:'باز کردن منو',close:'بستن منو'}", SCRIPT)
        self.assertIn("menu.setAttribute('aria-label',menuLabels.open);", SCRIPT)
        self.assertIn("menu.setAttribute('aria-label',menuLabels.close);", SCRIPT)

    def test_initial_menu_state_is_explicit(self):
        self.assertIn("menu.setAttribute('aria-expanded','false');", SCRIPT)
        self.assertIn("menu.setAttribute('aria-label',menuLabels.open);", SCRIPT)

    def test_opening_menu_moves_keyboard_focus_to_first_available_link(self):
        self.assertIn("const focusFirstLink=()=>{", SCRIPT)
        self.assertIn("if(!nav.classList.contains('menu-open'))return;", SCRIPT)
        self.assertIn("links.querySelector('a[href]:not([hidden])')", SCRIPT)
        self.assertIn("if(firstLink)firstLink.focus();", SCRIPT)

    def test_escape_closes_menu_and_restores_focus_to_toggle(self):
        self.assertIn("const close=(restoreFocus=false)=>{", SCRIPT)
        self.assertIn("if(restoreFocus&&wasOpen)menu.focus();", SCRIPT)
        self.assertIn("n._mhaClose?.(true)", SCRIPT)

    def test_outside_click_and_navigation_keep_non_escape_close_behavior(self):
        self.assertIn("document.querySelectorAll('.menu-open').forEach(n=>n._mhaClose?.());", SCRIPT)
        self.assertIn("if(e.target.closest('a'))close()", SCRIPT)


if __name__ == "__main__":
    unittest.main(verbosity=2)
