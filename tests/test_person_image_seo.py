import json
import re
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://mowhmmdh.github.io/"
IMAGE = SITE + "images/profile.webp"
PERSON_ID = SITE + "#person"
ALIASES = {
    "Mohammad Hossein Asgari Somarin",
    "Mohammad Hossein Asgari",
    "Asgari Somarin",
    "محمدحسین عسگری",
    "محمد حسین عسگری ثمرین",
}

def jsonld_documents(path):
    html = (ROOT / path).read_text(encoding="utf-8")
    return [json.loads(match) for match in re.findall(
        r'<script type="application/ld\+json">(.*?)</script>', html, re.S
    )]

def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

class PersonImageSeoTests(unittest.TestCase):
    def person_nodes(self, path):
        nodes = []
        for document in jsonld_documents(path):
            nodes.extend(
                node for node in walk(document)
                if node.get("@type") == "Person" and node.get("@id") == PERSON_ID
            )
        return nodes

    def test_core_pages_reference_one_person_entity_and_all_name_variants(self):
        for page in ("index.html", "en.html", "profile.html", "about.html", "en-about.html"):
            with self.subTest(page=page):
                nodes = self.person_nodes(page)
                self.assertTrue(nodes, f"{page} must reference the canonical Person entity")
                for person in nodes:
                    names = person.get("alternateName", [])
                    if isinstance(names, str):
                        names = [names]
                    self.assertTrue(ALIASES.issubset(set(names)), f"{page}: missing aliases {ALIASES - set(names)}")
                    self.assertEqual(person.get("url"), SITE)

    def test_english_homepage_person_entity_has_crawlable_profile_image(self):
        page = (ROOT / "en.html").read_text(encoding="utf-8")
        person = self.person_nodes("en.html")[0]
        self.assertEqual(person.get("image"), IMAGE)
        self.assertIn('property="og:image" content="' + IMAGE + '"', page)
        self.assertIn('name="twitter:image" content="' + IMAGE + '"', page)
        self.assertIn('property="og:image:alt" content="Portrait of Mohammad Hossein Asgari Somarin', page)
        self.assertIn('name="twitter:image:alt" content="Portrait of Mohammad Hossein Asgari Somarin', page)

    def test_english_homepage_website_entity_uses_site_level_canonical_url(self):
        nodes = [node for doc in jsonld_documents("en.html") for node in walk(doc)]
        website = next(node for node in nodes if node.get("@type") == "WebSite")
        webpage = next(node for node in nodes if node.get("@type") == "WebPage")
        self.assertEqual(website.get("url"), SITE)
        self.assertEqual(webpage.get("url"), SITE + "en.html")
        self.assertEqual(webpage.get("primaryImageOfPage"), IMAGE)

    def test_homepages_reference_a_resolvable_primary_image_object(self):
        image_id = IMAGE + "#image-rights"
        for page in ("index.html", "en.html"):
            with self.subTest(page=page):
                nodes = [node for document in jsonld_documents(page) for node in walk(document)]
                webpage = next(node for node in nodes if node.get("@type") == "WebPage")
                self.assertEqual(webpage.get("primaryImageOfPage"), {"@id": image_id})
                self.assertTrue(
                    any(node.get("@type") == "ImageObject" and node.get("@id") == image_id for node in nodes),
                    f"{page} must define the referenced ImageObject",
                )

    def test_profile_landing_page_contains_real_image_and_profilepage_markup(self):
        page = (ROOT / "profile.html").read_text(encoding="utf-8")
        self.assertRegex(page, r'<img[^>]+src="/images/profile\.webp"[^>]+alt="[^"]+محمدحسین عسگری ثمرین')
        nodes = [node for doc in jsonld_documents("profile.html") for node in walk(doc)]
        profile = next(node for node in nodes if node.get("@type") == "ProfilePage")
        main_entity = profile["mainEntity"]
        self.assertEqual(main_entity["@id"], PERSON_ID)
        self.assertEqual(main_entity["image"]["contentUrl"], IMAGE)

    def test_image_sitemap_describes_the_same_profile_image_on_landing_pages(self):
        ns = {
            "sm": "http://www.sitemaps.org/schemas/sitemap/0.9",
            "image": "http://www.google.com/schemas/sitemap-image/1.1",
        }
        root = ET.parse(ROOT / "image-sitemap.xml").getroot()
        entries = {}
        for url in root.findall("sm:url", ns):
            loc = url.findtext("sm:loc", namespaces=ns)
            image = url.find("image:image", ns)
            if image is not None:
                entries[loc] = {
                    "loc": image.findtext("image:loc", namespaces=ns),
                    "title": image.findtext("image:title", namespaces=ns),
                    "caption": image.findtext("image:caption", namespaces=ns),
                }
        for page in (SITE, SITE + "en.html", SITE + "profile.html"):
            with self.subTest(page=page):
                self.assertIn(page, entries)
                self.assertEqual(entries[page]["loc"], IMAGE)
                self.assertTrue(entries[page]["title"])
                self.assertTrue(entries[page]["caption"])

    def test_sitemap_keeps_profile_urls_and_lastmod(self):
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        root = ET.parse(ROOT / "sitemap.xml").getroot()
        urls = {
            node.findtext("sm:loc", namespaces=ns): node.findtext("sm:lastmod", namespaces=ns)
            for node in root.findall("sm:url", ns)
        }
        for page in (SITE, SITE + "en.html", SITE + "profile.html"):
            with self.subTest(page=page):
                self.assertIn(page, urls)
                self.assertRegex(urls[page], r"^2026-")

if __name__ == "__main__":
    unittest.main()
