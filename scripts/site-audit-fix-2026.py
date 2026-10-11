#!/usr/bin/env python3
"""Non-destructive site-wide SEO/UX fixer for the GitHub Pages repository."""
from pathlib import Path
import re
import json
from html import unescape, escape

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://mowhmmdh.github.io"
FA_NAME = "محمدحسین عسگری ثمرین"
EN_NAME = "Mohammad Hossein Asgari Somarin"
TITLE_REWRITES = {
    "blog/backup-3-2-1-practical-guide.html": (
        "قانون 3-2-1 Backup؛ راهنمای عملی پشتیبان‌گیری | محمدحسین عسگری ثمرین",
        "قانون 3-2-1؛ راهنمای عملی پشتیبان‌گیری | محمدحسین عسگری ثمرین",
    ),
    "blog/nginx-ssl-cdn-reverse-proxy-troubleshooting.html": (
        "عیب‌یابی خطای SSL پشت CDN و Reverse Proxy؛ چک‌لیست عملی Nginx | محمدحسین عسگری ثمرین",
        "عیب‌یابی SSL پشت CDN و Nginx | محمدحسین عسگری ثمرین",
    ),
    "blog/prometheus-network-monitoring-guide.html": (
        "مانیتورینگ شبکه با Prometheus؛ از Metrics تا Alert | محمدحسین عسگری ثمرین",
        "مانیتورینگ شبکه با Prometheus | محمدحسین عسگری ثمرین",
    ),
    "blog/vlan-vs-subnet-practical-guide.html": (
        "VLAN و Subnet چیست؟ راهنمای عملی طراحی شبکه | محمدحسین عسگری ثمرین",
        "VLAN یا Subnet؟ راهنمای طراحی شبکه | محمدحسین عسگری ثمرین",
    ),
}
QUALITY = "/assets/site-quality-2026.css"
UNIFIED_UI = "/assets/unified-ui-2026.css"
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

def ensure_discovery_meta(text, rel):
    """Add missing discovery metadata and correct known language mismatches."""
    title = title_of(text, rel.stem.replace("-", " ").title())
    desc = description_of(text) or title
    url = canonical_for(rel)

    def meta_name(name, content):
        nonlocal text
        if not re.search(r"<meta\s+[^>]*name=[\"']" + re.escape(name) + r"[\"']", text, re.I):
            text = add_head(text, '<meta name="' + name + '" content="' + escape(content, quote=True) + '">')

    def meta_prop(prop, content):
        nonlocal text
        if not re.search(r"<meta\s+[^>]*property=[\"']" + re.escape(prop) + r"[\"']", text, re.I):
            text = add_head(text, '<meta property="' + prop + '" content="' + escape(content, quote=True) + '">')

    def set_meta_content(attribute, key, content):
        nonlocal text
        pattern = re.compile(r'<meta\b(?=[^>]*\b' + attribute + r'=["\']' + re.escape(key) + r'["\'])[^>]*>', re.I)
        match = pattern.search(text)
        if not match:
            return
        tag = match.group(0)
        escaped = escape(content, quote=True)
        if re.search(r'\bcontent\s*=', tag, re.I):
            tag = re.sub(r'(\bcontent\s*=\s*)(["\'])(.*?)\2',
                         lambda m: m.group(1) + m.group(2) + escaped + m.group(2),
                         tag, count=1, flags=re.I | re.S)
        else:
            tag = tag[:-1] + ' content="' + escaped + '">'
        text = text[:match.start()] + tag + text[match.end():]

    path = rel.as_posix()
    is_english = path.startswith(("en-", "en-blog/", "en-vintech/")) or rel.name.startswith("en-")
    is_vintech_landing = path in {"vintech.html", "en-vintech.html"}
    site_name = ("VinTech" if is_english else "وین‌تک") if is_vintech_landing else (EN_NAME if is_english else FA_NAME)
    image_alt = (
        "VinTech — Network, Infrastructure and Cybersecurity Services" if is_english
        else "وین‌تک | خدمات شبکه، زیرساخت و امنیت سایبری"
    ) if is_vintech_landing else (
        EN_NAME + " | Network & Infrastructure Specialist" if is_english
        else FA_NAME + " | متخصص شبکه و زیرساخت"
    )

    meta_name("author", EN_NAME if is_english else FA_NAME)
    meta_name("referrer", "strict-origin-when-cross-origin")
    meta_name("theme-color", "#071019")
    image_match = re.search(r'<meta\s+[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)', text, re.I)
    image = image_match.group(1) if image_match else BASE + "/images/profile.webp"

    meta_prop("og:type", "article" if path.startswith(("blog/", "en-blog/")) else "website")
    meta_prop("og:title", title[:180])
    meta_prop("og:description", desc[:300])
    meta_prop("og:url", url)
    meta_prop("og:site_name", site_name)
    meta_prop("og:image", image)
    meta_prop("og:image:alt", image_alt)
    meta_name("twitter:card", "summary_large_image")
    meta_name("twitter:title", title[:180])
    meta_name("twitter:description", desc[:300])
    meta_name("twitter:image", image)
    meta_name("twitter:image:alt", image_alt)

    # Correct known legacy language mismatches and brand-specific landing previews.
    if is_vintech_landing:
        set_meta_content("property", "og:site_name", site_name)
        set_meta_content("property", "og:image:alt", image_alt)
        set_meta_content("name", "twitter:image:alt", image_alt)
    else:
        for attribute, key in (
            ("property", "og:site_name"),
            ("property", "og:image:alt"),
            ("name", "twitter:image:alt"),
        ):
            match = re.search(r'<meta\b(?=[^>]*\b' + attribute + r'=["\']' + re.escape(key) + r'["\'])[^>]*>', text, re.I)
            if not match:
                continue
            content_match = re.search(r'\bcontent=["\']([^"\']*)["\']', match.group(0), re.I)
            if not content_match:
                continue
            value = content_match.group(1)
            if is_english and FA_NAME in value:
                set_meta_content(attribute, key, site_name if key == "og:site_name" else image_alt)
            elif not is_english and EN_NAME in value:
                set_meta_content(attribute, key, site_name if key == "og:site_name" else image_alt)
    return text

def ensure_quality(text):
    # Remove standalone layers already merged into site-bundle.css. Conversion CTA rules
    # are included in the bundle, so do not load a duplicate render-blocking stylesheet.
    text = re.sub(r'\s*<link\s+[^>]*href=["\']/assets/(?:site-quality-2026|unified-ui-2026|conversion-monetization-2026|page-experience-2026|site-master-2026|social-fix-2026|site-final-fix-2026|navigation-fix-2026)\.css["\'][^>]*>', '', text, flags=re.I)
    text = re.sub(r'<noscript>\s*</noscript>', '', text, flags=re.I)
    return text

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

def ensure_article_schema(text, rel):
    path = rel.as_posix()
    if not (path.startswith("blog/") or path.startswith("en-blog/")):
        return text
    if re.search(r'"@type"\s*:\s*"(?:Article|BlogPosting|NewsArticle)"', text, re.I):
        return text
    title = title_of(text, rel.stem.replace("-", " ").title())
    desc = description_of(text) or title
    lang = "en-US" if path.startswith("en-blog/") else "fa-IR"
    url = canonical_for(rel)
    image = None
    m = re.search(r'<meta\s+[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', text, re.I)
    if m:
        image = m.group(1)
    article = {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": url + "#article",
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "headline": title[:110],
        "description": desc[:300],
        "url": url,
        "inLanguage": lang,
        "author": {"@type": "Person", "name": FA_NAME, "url": BASE + "/"},
        "publisher": {"@type": "Person", "name": FA_NAME, "url": BASE + "/"}
    }
    if image:
        article["image"] = [image]
    data = '<script type="application/ld+json">' + json.dumps(article, ensure_ascii=False, separators=(",", ":")) + '</script>'
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
    rel = p.relative_to(ROOT)
    new = old
    title_rewrite = TITLE_REWRITES.get(rel.as_posix())
    if title_rewrite:
        new = new.replace(title_rewrite[0], title_rewrite[1])
    new = ensure_identity(new)
    if p.name != "404.html":
        new = ensure_meta(new, rel)
        new = ensure_quality(new)
        new = ensure_discovery_meta(new, rel)
        rel_path = rel.as_posix()
        is_vintech = rel_path.startswith(("vintech/", "en-vintech/")) or rel.name in {"vintech.html", "en-vintech.html"}
        if is_vintech and '/assets/vintech.css' not in new:
            new = add_head(new, '<link rel="stylesheet" href="/assets/vintech.css">')
        new = ensure_webpage_schema(new, rel)
        new = ensure_article_schema(new, rel)
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
        tag = m.group(0)
        src_match = re.search(r'\bsrc=["\']([^"\']+)["\']', tag, re.I)
        src = src_match.group(1).split("?")[0].split("#")[0] if src_match else ""
        suffix = Path(src).suffix.lower()
        alt_match = re.search(r'\balt=["\']([^"\']*)["\']', tag, re.I)
        current_alt = alt_match.group(1).strip() if alt_match else ""
        is_en = bool(re.search(r'<html\b[^>]*\blang=["\']en(?:-[^"\']*)?["\']', text, re.I))
        if suffix == ".svg" and alt_match and current_alt == "":
            return tag
        if current_alt:
            return tag
        stem = Path(src).stem.lower().replace("_", " ").replace("-", " ").strip()
        if any(token in stem for token in ("profile", "portrait", "mowhmmdh", "mohammad-hossein")):
            alt = "Mohammad Hossein Asgari Somarin" if is_en else "محمدحسین عسگری ثمرین"
        elif "logo" in stem or "brand" in stem:
            alt = "Mohammad Hossein Asgari Somarin website logo" if is_en else "لوگوی وب‌سایت محمدحسین عسگری ثمرین"
        elif any(token in stem for token in ("hero", "banner", "cover")):
            alt = "Page banner image" if is_en else "تصویر اصلی صفحه"
        elif stem and not re.fullmatch(r'(?:img|image|photo|dsc)[\s_-]*\d*', stem):
            alt = re.sub(r'\s+', ' ', stem.replace(".", " ")).strip().capitalize()
        else:
            alt = "Related content image" if is_en else "تصویر مرتبط با محتوای صفحه"
        escaped_alt = alt.replace("&", "&amp;").replace('"', "&quot;")
        if alt_match:
            return tag[:alt_match.start(1)] + escaped_alt + tag[alt_match.end(1):]
        return tag[:-1] + ' alt="' + escaped_alt + '">'
    text=re.sub(r'<img\b[^>]*>',fix_img,text,flags=re.I|re.S)
    images = list(re.finditer(r'<img\b[^>]*>', text, flags=re.I|re.S))
    if not images:
        return text
    first_start = images[0].start()
    def lazy_img(m):
        tag=m.group(0)
        # Fully normalize performance attributes so repeated CI runs are idempotent.
        tag = re.sub(r'\sloading=["\'][^"\']*["\']', '', tag, flags=re.I)
        tag = re.sub(r'\sfetchpriority=["\'][^"\']*["\']', '', tag, flags=re.I)
        tag = re.sub(r'\sdecoding=["\'][^"\']*["\']', '', tag, flags=re.I)
        if m.start() == first_start:
            return tag[:-1]+' loading="eager" fetchpriority="high" decoding="async">'
        return tag[:-1]+' loading="lazy" decoding="async">'
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
        if rel.as_posix() not in {"privacy.html","terms.html","disclosure.html"} and text.count('/assets/site-theme.js')!=1:
            issues.append(f"{rel}: site-theme.js count != 1")
        is_vt=rel.name in {"vintech.html","en-vintech.html"} or any(part in {"vintech","en-vintech"} for part in rel.parts)
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
lines.append("## Hard errors")
if audit_issues:
    lines.extend(f"- {x}" for x in audit_issues)
else:
    lines.append("- None")
lines.append("")
report.write_text("\n".join(lines), encoding="utf-8")
print(f"Changed {len(changed)} HTML files; wrote {report.relative_to(ROOT)}")
