from pathlib import Path

ROOT = Path('.')

BLOCK_FA = '''<section class="pillar-highlight wrap" aria-labelledby="pillar-title"><div class="pillar-inner"><span class="tag">PILLAR GUIDE / NETWORK SECURITY</span><h2 id="pillar-title">راهنمای مهندسی امنیت شبکه؛ از معماری تا مانیتورینگ</h2><p>یک راهنمای عمیق برای تبدیل امنیت شبکه از مجموعه‌ای از تنظیمات پراکنده به یک فرآیند مهندسی‌شده: دارایی‌ها، Segmentation، کنترل دسترسی، FortiGate، Hardening لایه ۲، هویت، Logging، Monitoring، Incident Response و Recovery.</p><div class="pillar-links"><a class="read" href="/blog/network-security-engineering-playbook.html">مطالعه Playbook ↗</a><a class="read" href="/blog/network-security-assessment-checklist.html">چک‌لیست ارزیابی ↗</a><a class="read" href="/authority.html">مرجع تخصصی ↗</a></div></div></section>'''
BLOCK_EN = '''<section class="pillar-highlight wrap" aria-labelledby="pillar-title"><div class="pillar-inner"><span class="tag">PILLAR GUIDE / NETWORK SECURITY</span><h2 id="pillar-title">Network Security Engineering Playbook</h2><p>A practical deep-dive into assets, segmentation, access control, FortiGate policy design, Layer 2 hardening, identity, logging, monitoring, incident response and recovery.</p><div class="pillar-links"><a class="read" href="/en-blog/network-security-engineering-playbook.html">Read the Playbook ↗</a><a class="read" href="/en-authority.html">Technical Authority ↗</a></div></div></section>'''

CSS = '''\n.pillar-highlight{margin-top:24px;margin-bottom:24px}.pillar-inner{padding:30px;border:1px solid rgba(114,182,255,.22);border-radius:24px;background:linear-gradient(135deg,rgba(114,182,255,.08),rgba(13,20,32,.82));box-shadow:0 18px 50px rgba(0,0,0,.18)}.pillar-inner h2{margin:.55rem 0 .7rem}.pillar-inner p{max-width:820px;color:#a8b3c0}.pillar-links{display:flex;gap:16px;flex-wrap:wrap;margin-top:16px}.pillar-links .read{text-decoration:none}@media(max-width:700px){.pillar-inner{padding:22px}}\n'''

for path, block in [(ROOT/'blog/index.html', BLOCK_FA), (ROOT/'en-blog.html', BLOCK_EN)]:
    if not path.exists():
        continue
    text = path.read_text(encoding='utf-8', errors='replace')
    if 'pillar-highlight' not in text and '</header>' in text:
        text = text.replace('</header>', '</header>' + block, 1)
    # Legacy content-theme.css was previously injected here. Remove the reference
    # because page-engineering intentionally rejects that retired global layer.
    text = text.replace('<link rel="stylesheet" href="/assets/content-theme-2026.css">', '')
    path.write_text(text, encoding='utf-8')

css_path = ROOT/'assets/content-theme-2026.css'
if css_path.exists():
    css = css_path.read_text(encoding='utf-8', errors='replace')
    if '.pillar-highlight' not in css:
        css_path.write_text(css + CSS, encoding='utf-8')

print('Content growth sync completed without legacy global CSS injection.')
