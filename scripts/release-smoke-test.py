from pathlib import Path
from html.parser import HTMLParser
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://mowhmmdh.github.io"
REQUIRED = {
    "profile.html": {
        "canonical": f"{BASE}/profile.html",
        "image": "/images/profile.webp",
        "schema": "ProfilePage",
    },
    "blog/nginx-ssl-cdn-reverse-proxy-troubleshooting.html": {
        "canonical": f"{BASE}/blog/nginx-ssl-cdn-reverse-proxy-troubleshooting.html",
        "image": "/images/profile.webp",
        "schema": "TechArticle",
    },
}

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.in_title = False
        self.h1 = 0
        self.meta = []
        self.links = []
        self.images = []
        self.scripts = []
        self.jsonld = []
        self.in_jsonld = False
        self.jsonld_buf = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "h1":
            self.h1 += 1
        if tag == "meta":
            self.meta.append(a)
        if tag == "link":
            self.links.append(a)
        if tag == "img":
            self.images.append(a)
        if tag == "script":
            self.scripts.append(a)
            if (a.get("type") or "").lower() == "application/ld+json":
                self.in_jsonld = True
                self.jsonld_buf = []

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_jsonld:
            self.jsonld.append("".join(self.jsonld_buf))
            self.in_jsonld = False
            self.jsonld_buf = []

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_jsonld:
            self.jsonld_buf.append(data)

def fail(message):
    print("FAIL:", message)
    return False

errors = []
for rel, expected in REQUIRED.items():
    path = ROOT / rel
    if not path.is_file():
        errors.append(f"missing required page: {rel}")
        continue
    parser = Page()
    source = path.read_text(encoding="utf-8")
    parser.feed(source)
    canonicals = [
        item.get("href", "") for item in parser.links
        if "canonical" in (item.get("rel") or "").lower().split()
    ]
    descriptions = [
        item.get("content", "").strip() for item in parser.meta
        if (item.get("name") or "").lower() == "description"
    ]
    if not parser.title.strip():
        errors.append(f"{rel}: missing title")
    if len(descriptions) != 1 or len(descriptions[0]) < 50:
        errors.append(f"{rel}: missing/invalid meta description")
    if len(canonicals) != 1 or canonicals[0] != expected["canonical"]:
        errors.append(f"{rel}: canonical missing, duplicated, or not self-referencing")
    if parser.h1 != 1:
        errors.append(f"{rel}: expected exactly one H1, found {parser.h1}")
    if not re.search(r'<html\\b[^>]*\\blang=[\"\']fa[\"\']', source, re.I):
        errors.append(f"{rel}: Persian language attribute missing")
    if not any(img.get("src") == expected["image"] and img.get("alt", "").strip() for img in parser.images):
        errors.append(f"{rel}: expected profile image or descriptive alt text missing")
    for raw in parser.jsonld:
        try:
            json.loads(raw)
        except Exception as exc:
            errors.append(f"{rel}: invalid JSON-LD: {exc}")
    if not any(expected["schema"] in raw for raw in parser.jsonld):
        errors.append(f"{rel}: expected {expected['schema']} structured data missing")
    image_path = ROOT / expected["image"].lstrip("/")
    if not image_path.is_file():
        errors.append(f"{rel}: image asset missing: {expected['image']}")

for xml_name in ("sitemap.xml", "image-sitemap.xml"):
    path = ROOT / xml_name
    try:
        root = ET.parse(path).getroot()
    except Exception as exc:
        errors.append(f"{xml_name}: invalid XML: {exc}")
        continue
    all_text = " ".join(elem.text or "" for elem in root.iter())
    if "profile.html" not in all_text:
        errors.append(f"{xml_name}: official profile URL missing")
    if xml_name == "sitemap.xml" and "nginx-ssl-cdn-reverse-proxy-troubleshooting.html" not in all_text:
        errors.append("sitemap.xml: new article URL missing")
    if xml_name == "image-sitemap.xml" and "/images/profile.webp" not in all_text:
        errors.append("image-sitemap.xml: profile image missing")

robots = ROOT / "robots.txt"
if not robots.is_file() or f"{BASE}/sitemap.xml" not in robots.read_text(encoding="utf-8"):
    errors.append("robots.txt: primary sitemap declaration missing")

integrity = ROOT / "scripts/site-integrity-fix.py"
if not integrity.is_file() or "FULL_EN='Mohammad Hossein Asgari Somarin'" not in integrity.read_text(encoding="utf-8"):
    errors.append("site-integrity-fix.py: canonical English identity is incorrect")

if errors:
    print(f"Release smoke test failed with {len(errors)} issue(s):")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("PASS: profile/article metadata, canonical URLs, H1, JSON-LD, profile image, XML sitemaps, robots.txt, and canonical identity.")
