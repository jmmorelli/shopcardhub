# -*- coding: utf-8 -*-
# Destination strip: sends SEO pages (player / set / guide) to the two destinations — the Vault and Bowman Bangers.
# Idempotent (DEST:START/END markers). Run from the repo root: python3 dest.py [--dry]
import io, os, re, sys, glob
DRY = '--dry' in sys.argv
SKIP = {'index.html','watchlist.html','bowman-bangers.html','track-record.html','about.html','privacy.html','affiliate-disclosure.html',
        'card-dungeon.html','research.html','blog.html'}
STRIP = u'''
<!-- DEST:START — destination strip (Aug 21, 2026). Vault + Bowman Bangers are the destinations; this page is the on-ramp. Managed by tools/dest.py -->
<style>
  .dest-strip { display:grid; grid-template-columns:1fr 1fr; gap:14px; max-width:1200px; margin:28px auto 0; padding:0 24px; }
  .dest-tile { display:flex; align-items:center; gap:14px; background:var(--bg2); border:1px solid var(--border2); border-left:3px solid var(--accent); padding:14px 18px; text-decoration:none !important; color:var(--text); transition:border-color .15s, background .15s; }
  .dest-tile:hover { background:var(--bg3); border-color:var(--accent); }
  .dest-tile .dt-ico { font-size:22px; line-height:1; flex-shrink:0; }
  .dest-tile .dt-k { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--accent); }
  .dest-tile .dt-t { font-family:var(--fd); font-size:18px; font-weight:800; text-transform:uppercase; color:var(--text-head); line-height:1.1; margin-top:2px; }
  .dest-tile .dt-s { font-size:12px; color:var(--text-dim); margin-top:3px; line-height:1.4; }
  .dest-tile .dt-arrow { margin-left:auto; color:var(--accent); font-size:18px; flex-shrink:0; }
  .dest-tile.bangers { border-left-color:var(--gold, #f5c800); }
  .dest-tile.bangers .dt-k, .dest-tile.bangers .dt-arrow { color:var(--gold, #f5c800); }
  .container .dest-strip { padding:0; }
  @media (max-width:720px) { .dest-strip { grid-template-columns:1fr; gap:10px; padding:0 16px; } .dest-tile { padding:12px 14px; } .dest-tile .dt-t { font-size:16px; } }
</style>
<div class="dest-strip">
  <a class="dest-tile" href="/watchlist" onclick="if(typeof gtag==='function')gtag('event','dest_strip',{dest:'vault',page:location.pathname})">
    <span class="dt-ico">&#9733;</span>
    <span><span class="dt-k">Your Vault</span><span class="dt-t" style="display:block;">Track any card on this page</span><span class="dt-s" style="display:block;">Tap &#9733; Track next to a card &mdash; it lands in your free Vault with live prices and P/L. No account.</span></span>
    <span class="dt-arrow">&rarr;</span>
  </a>
  <a class="dest-tile bangers" href="/bowman-bangers" onclick="if(typeof gtag==='function')gtag('event','dest_strip',{dest:'bangers',page:location.pathname})">
    <span class="dt-ico">&#9918;</span>
    <span><span class="dt-k">The Board</span><span class="dt-t" style="display:block;">2026 Bowman Bangers</span><span class="dt-s" style="display:block;">The prospect cards we&rsquo;d be glad to own a year from now &mdash; ranked by real sold prices, graded in public.</span></span>
    <span class="dt-arrow">&rarr;</span>
  </a>
</div>
<!-- DEST:END -->
'''
NOTRACK = u'Tap &#9733; Track next to a card &mdash; it lands in your free Vault with live prices and P/L. No account.'
NOTRACK_ALT = u'Your free watchlist + portfolio with live prices and P/L. No account, nothing leaves your browser.'
done = skipped = 0
for f in sorted(glob.glob('*.html')):
    if f in SKIP: skipped += 1; continue
    s = io.open(f, encoding='utf-8').read()
    if 'DEST:START' in s:
        s = re.sub(r'\n<!-- DEST:START.*?<!-- DEST:END -->\n', '\n', s, flags=re.S)
    m = re.search(r'<section class="hero"', s)
    if not m: print('no hero:', f); skipped += 1; continue
    j = s.find('</section>', m.end())
    if j < 0: print('no hero end:', f); skipped += 1; continue
    j += len('</section>')
    strip = STRIP
    if 'sch-track-card' not in s:  # page has no Track buttons — don't tell people to tap one
        strip = strip.replace(NOTRACK, NOTRACK_ALT).replace('Track any card on this page', 'Open your Vault')
    s = s[:j] + strip + s[j:]
    if not DRY: io.open(f, 'w', encoding='utf-8').write(s)
    done += 1
print('strip added:', done, 'skipped:', skipped, 'DRY' if DRY else '')
