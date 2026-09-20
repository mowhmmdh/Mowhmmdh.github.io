#!/usr/bin/env python3
"""Non-destructive site-wide SEO/UX fixer for the GitHub Pages repository."""
from pathlib import Path
import re
import json
from html import unescape

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://mowhmmdh.github.io"
FA_NAME = "محمدحسین عسگری ثمرین"
QUALITY = "/assets/site-quality-2026.css"
SKIP = {".git", ".github", "node_modules", "vendor"}

def is_html(p):
    return p.suffix.lower() == ".html" and not any(part in SKIP for part in p.parts)

def canonical_for(rel):
    s = rel.as_posix()
    if s == "index.html":
        return BASE + "/"
    if s.endswith("/index.html"):
        return BASE + "/" + s[:-10]
    return BASE + "/" + s

def title_of(text, fallback):
    m = re.search(r"<title[^>]*>(.*?)</title>", text, re.I|re.S)
    if m:
        return re.sub(r"\s+", " ", unescape(re.sub("<[^>]+>", "", m.group(1)))).strip()
    h = re.search(r"<h1[^>]*>(.*?)</h1>", text, re.I|re.S)
    if h:
        return re.sub(r"\s+", " ", unescape(re.sub("<[^>]+>", "", h.group(1)))).strip()
    return fallback

def description_of(text):
    m = re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*>', text, re.I)
    if m:
        c = re.search(r'content=["\'](.*?)["\']', m.group(0), re.I|re.S)
        if c and c.group(1).strip():
            return c.group(1).strip()
    return ""

def add_head(text, snippet):
    if re.search(r"</head>", text, re.I):
        return re.sub(r"</head>", snippet + "\n</head>", text, count=1, flags=re.I)
    return text

def ensure_meta(text, rel):
    title = title_of(text, rel.stem.replace("-", " ").title())
    desc = description_of(text)
    if not desc:
        desc = f"{title} | شبکه، زیرساخت، امنیت و فناوری اطلاعات."
        text = add_head(text, f'<meta name="description" content="{desc}">')
    if not re.search(r'<meta\s+[^>]*name=["\']robots["\']', text, re.I):
        text = add_head(text, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">')
    if not re.search(r'<link\s+[^>]*rel=["\']canonical["\']', text, re.I):
        text = add_head(text, f'<link rel="canonical" href="{canonical_for(rel)}">')
    return text

def ensure_quality(text):
    if QUALITY in text:
        return text
    return add_head(text, f'<link rel="stylesheet" href="{QUALITY}">')

def ensure_identity(text):
    text = text.replace("محمدحسین عسگری", FA_NAME)
    while FA_NAME + " ثمرین" in text:
        text = text.replace(FA_NAME + " ثمرین", FA_NAME)
    return text

def ensure_webpage_schema(text, rel):
    if re.search(r'application/ld\+json', text, re.I):
        return text
    title = title_of(text, rel.stem.replace("-", " ").title())
    lang = "en-US" if rel.name.startswith("en") or rel.parts[0] in {"en-blog", "en-vintech"} else "fa-IR"
    data = (
        '<script type="application/ld+json">'
        + '{"@context":"https://schema.org","@type":"WebPage","@id":"'
        + canonical_for(rel) + '#webpage","url":"' + canonical_for(rel)
        + '","name":' + json.dumps(title, ensure_ascii=False)
        + ',"inLanguage":"' + lang + '"}</script>'
    )
    return add_head(text, data)

def related_block(rel):
    path = rel.as_posix()
    if not (path.startswith("blog/") or path.startswith("en-blog/")):
        return ""
    en = path.startswith("en-blog/")
    prefix = "en-blog/" if en else "blog/"
    candidates = [
        ("network-hardening.html", "Network Hardening" if en else "سخت‌سازی شبکه"),
        ("dns-troubleshooting.html", "DNS Troubleshooting" if en else "عیب‌یابی DNS"),
        ("active-directory-hardening.html", "Active Directory Hardening" if en else "سخت‌سازی Active Directory"),
        ("fortigate-hardening-checklist.html", "FortiGate Hardening" if en else "چک‌لیست سخت‌سازی FortiGate"),
        ("linux-server-hardening-checklist.html", "Linux Server Hardening" if en else "سخت‌سازی Linux Server"),
        ("network-troubleshooting-checklist.html", "Network Troubleshooting" if en else "چک‌لیست عیب‌یابی شبکه"),
        ("vlan-segmentation.html", "VLAN Segmentation" if en else "Segmentation و VLAN"),
        ("network-security-assessment-checklist.html", "Security Assessment" if en else "ارزیابی امنیت شبکه"),
    ]
    current = rel.name
    links = [(f"/{prefix}{f}", label) for f,label in candidates if f != current and (ROOT / prefix / f).exists()][:3]
    if not links:
        return ""
    heading = "Related technical articles" if en else "مقالات فنی مرتبط"
    items = "".join(f'<li><a href="{u}">{label}</a></li>' for u,label in links)
    return f'<section class="related-articles site-auto-related" aria-labelledby="related-articles-heading"><h2 id="related-articles-heading">{heading}</h2><ul>{items}</ul></section>'

changed = []
for p in ROOT.rglob("*.html"):
    if not is_html(p):
        continue
    old = p.read_text(encoding="utf-8")
    new = ensure_identity(old)
    rel = p.relative_to(ROOT)
    if p.name != "404.html":
        new = ensure_meta(new, rel)
        new = ensure_quality(new)
        new = ensure_webpage_schema(new, rel)
        if "site-auto-related" not in new:
            block = related_block(rel)
            if block:
                new = re.sub(r"</main>", block + "\n</main>", new, count=1, flags=re.I)
    if new != old:
        p.write_text(new, encoding="utf-8")
        changed.append(rel.as_posix())


# Safe page-wide hardening/fixes: accessibility, external-link safety and image loading.
def safe_page_hardening(text):
    def fix_blank(m):
        tag=m.group(0)
        if not re.search(r'\btarget=["\']_blank["\']',tag,re.I):
            return tag
        rm=re.search(r'\brel=["\']([^"\']*)["\']',tag,re.I)
        if rm:
            vals=rm.group(1).split()
            for x in ("noopener","noreferrer"):
                if x not in vals: vals.append(x)
            return tag[:rm.start(1)]+" ".join(vals)+tag[rm.end(1):]
        return tag[:-1]+' rel="noopener noreferrer">'
    text=re.sub(r'<a\b[^>]*>',fix_blank,text,flags=re.I|re.S)
    def fix_img(m):
        tag=m.group(0)
        if re.search(r'\balt=',tag,re.I):
            return tag
        return tag[:-1]+' alt="">'
    text=re.sub(r'<img\b[^>]*>',fix_img,text,flags=re.I|re.S)
    def lazy_img(m):
        tag=m.group(0)
        if re.search(r'\bloading=',tag,re.I) or re.search(r'\bfetchpriority=["\']high',tag,re.I):
            return tag
        return tag[:-1]+' loading="lazy">'
    return re.sub(r'<img\b[^>]*>',lazy_img,text,flags=re.I|re.S)

def page_audit(text, rel):
    issues=[]
    if rel.name != "404.html":
        checks=[
            ("title",r"<title\b[^>]*>.*?</title>"),
            ("description",r'<meta\b[^>]*name=["\']description["\'][^>]*>'),
            ("viewport",r'<meta\b[^>]*name=["\']viewport["\'][^>]*>'),
            ("robots",r'<meta\b[^>]*name=["\']robots["\'][^>]*>'),
            ("canonical",r'<link\b[^>]*rel=["\']canonical["\'][^>]*>'),
        ]
        for label,rx in checks:
            n=len(re.findall(rx,text,re.I|re.S))
            if n!=1: issues.append(f"{rel}: {label} count={n}")
        main_n=len(re.findall(r"<main\b",text,re.I))
        if main_n!=1: issues.append(f"{rel}: main count={main_n}")
        if text.count('/assets/site-bundle.css')!=1: issues.append(f"{rel}: site-bundle.css count != 1")
        if text.count('/assets/site-theme.js')!=1: issues.append(f"{rel}: site-theme.js count != 1")
        is_vt=rel.name in {"vintech.html","en-vintech.html"} or "vintech" in rel.parts
        if is_vt and text.count('/assets/vintech.css')!=1: issues.append(f"{rel}: vintech.css count != 1")
        if not is_vt and '/assets/vintech.css' in text: issues.append(f"{rel}: vintech.css outside VinTech")
    if len(re.findall(r'<html\b[^>]*\blang=["\'][^"\']+',text,re.I))!=1:
        issues.append(f"{rel}: html lang missing")
    ids=re.findall(r'\bid=["\']([^"\']+)["\']',text,re.I)
    if len(ids)!=len(set(ids)): issues.append(f"{rel}: duplicate HTML ids")
    for m in re.findall(r'<a\b[^>]*target=["\']_blank["\'][^>]*>',text,re.I|re.S):
        if not re.search(r'\brel=["\'][^"\']*(?:noopener|noreferrer)',m,re.I):
            issues.append(f"{rel}: target=_blank without noopener/noreferrer")
    return issues

changed_hardening=[]
audit_issues=[]
for p in ROOT.rglob("*.html"):
    if not is_html(p): continue
    rel=p.relative_to(ROOT)
    old=p.read_text(encoding="utf-8",errors="replace")
    new=safe_page_hardening(old)
    if new!=old:
        p.write_text(new,encoding="utf-8")
        changed_hardening.append(rel.as_posix())
    audit_issues.extend(page_audit(new,rel))

report = ROOT / "SEO-AUDIT-2026.md"
lines = [
    "# SEO / UX automated audit — 2026",
    "",
    "Generated by scripts/site-audit-fix-2026.py.",
    "",
    f"- HTML files changed by SEO fixer: **{len(changed)}**",
    f"- Additional accessibility/performance hardening changes: **{len(changed_hardening)}**",
    f"- Page-by-page hard errors detected: **{len(audit_issues)}**",
    f"- Shared quality stylesheet: {QUALITY}",
    "- Canonical URLs, robots directives and descriptions are added only when missing.",
    "- Existing JSON-LD is preserved; pages without JSON-LD receive a minimal WebPage graph.",
    "- Blog articles receive up to three contextual internal links when a related block was absent.",
    "- The legacy short Persian name is normalized in HTML only.",
    "",
    "## Changed files",
]
lines.extend(f"- {x}" for x in changed)
lines.append("")
report.write_text("\n".join(lines), encoding="utf-8")
print(f"Changed {len(changed)} HTML files; wrote {report.relative_to(ROOT)}")
