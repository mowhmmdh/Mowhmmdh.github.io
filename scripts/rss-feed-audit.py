#!/usr/bin/env python3
"""Validate RSS 2.0 feed structure and required channel metadata."""
from pathlib import Path
import xml.etree.ElementTree as ET

path = Path("feed.xml")
root = ET.parse(path).getroot()
if root.tag != "rss" or root.attrib.get("version") != "2.0":
    raise SystemExit("FAIL: feed.xml must be an RSS 2.0 document")
channel = root.find("channel")
if channel is None:
    raise SystemExit("FAIL: RSS channel element is missing")

children = list(channel)
tags = [child.tag for child in children]
required = ("title", "link", "description")
if not all(tag in tags for tag in required):
    raise SystemExit("FAIL: RSS channel title/link/description are required")
first_item = tags.index("item") if "item" in tags else len(tags)
for tag in required:
    if tags.index(tag) > first_item:
        raise SystemExit(f"FAIL: channel <{tag}> must appear before <item>")
if not channel.findtext("title", "").strip():
    raise SystemExit("FAIL: RSS channel title is empty")
if not channel.findtext("link", "").strip():
    raise SystemExit("FAIL: RSS channel link is empty")
if not channel.findtext("description", "").strip():
    raise SystemExit("FAIL: RSS channel description is empty")

items = channel.findall("item")
if not items:
    raise SystemExit("FAIL: RSS feed contains no items")
for index, item in enumerate(items, 1):
    if not item.findtext("title", "").strip():
        raise SystemExit(f"FAIL: RSS item {index} has no title")
    if not item.findtext("link", "").strip():
        raise SystemExit(f"FAIL: RSS item {index} has no link")
print(f"PASS: RSS 2.0 channel metadata and {len(items)} feed items are valid.")
