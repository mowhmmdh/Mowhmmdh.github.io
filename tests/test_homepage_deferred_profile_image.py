#!/usr/bin/env python3
"""Regression tests for deferring the homepage's below-the-fold profile image."""

from html.parser import HTMLParser
from pathlib import Path
import unittest


class ImageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "img":
            self.images.append(dict(attrs))


class HomepageProfileImageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        html = Path("index.html").read_text(encoding="utf-8")
        parser = ImageParser()
        parser.feed(html)
        cls.profile_images = [
            image for image in parser.images
            if image.get("src") == "/images/profile.webp"
        ]

    def test_profile_image_is_present_exactly_once(self):
        self.assertEqual(len(self.profile_images), 1)

    def test_below_the_fold_profile_image_is_lazy_loaded(self):
        self.assertEqual(self.profile_images[0].get("loading"), "lazy")

    def test_profile_image_is_not_marked_high_priority(self):
        self.assertNotEqual(
            self.profile_images[0].get("fetchpriority", "").lower(),
            "high",
        )

    def test_dimensions_and_descriptive_alt_text_are_preserved(self):
        image = self.profile_images[0]
        self.assertEqual(image.get("width"), "580")
        self.assertEqual(image.get("height"), "725")
        self.assertIn("محمدحسین عسگری ثمرین", image.get("alt", ""))
        self.assertIn("Mohammad Hossein Asgari Somarin", image.get("alt", ""))


if __name__ == "__main__":
    unittest.main(verbosity=2)
