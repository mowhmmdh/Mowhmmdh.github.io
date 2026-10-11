from pathlib import Path
import re

ROOT = Path(".")
PATTERN = re.compile(r'<link\b[^>]*href=["\']/assets/vintech\.css[^"\']*["\'][^>]*>\s*', re.I)
LINK = '<link rel="stylesheet" href="/assets/vintech.css">'
SIGNATURE_LINK = '<link rel="stylesheet" href="/assets/vintech-signature-2026.css">'

for path in ROOT.rglob("*.html"):
    if ".git" in path.parts or ".github" in path.parts:
        continue
    rel = path.as_posix()
    is_vintech = rel.startswith(("vintech/", "en-vintech/")) or path.name in {"vintech.html", "en-vintech.html"}
    if not is_vintech:
        continue

    original = path.read_text(encoding="utf-8", errors="replace")
    matches = list(PATTERN.finditer(original))
    if matches:
        # Preserve the first stylesheet's location; remove only duplicates.
        first_end = matches[0].end()
        updated = original[:first_end] + PATTERN.sub("", original[first_end:])
    elif re.search(r"</head\s*>", original, re.I):
        updated = re.sub(r"</head\s*>", LINK + "\n</head>", original, count=1, flags=re.I)
    else:
        continue

    if SIGNATURE_LINK not in updated:
        css_anchor = re.search(r'<link\\b[^>]*href=["\\']/assets/vintech\\.css["\\'][^>]*>', updated, re.I)
        if css_anchor:
            updated = updated[:css_anchor.end()] + "\\n" + SIGNATURE_LINK + updated[css_anchor.end():]
        elif re.search(r"</head\\s*>", updated, re.I):
            updated = re.sub(r"</head\\s*>", SIGNATURE_LINK + "\\n</head>", updated, count=1, flags=re.I)

    updated = updated.rstrip() + "\n"
    if updated != original:
        path.write_text(updated, encoding="utf-8")

print("VinTech stylesheet normalization complete")
