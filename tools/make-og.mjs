#!/usr/bin/env node
/* ============================================================================
   ShopCardHub — tools/make-og.mjs
   Renders an inline HTML social card to og/<name>.png (1200×630) with Playwright.
   Fonts are the site's self-hosted woff2 files (fonts/) via @font-face, so this
   works offline with no local server running.

   Usage:   node tools/make-og.mjs            # builds every card in CARDS
            node tools/make-og.mjs vault      # builds just og/vault.png
   Needs:   playwright (chromium) — local node_modules or a global install
            (a global one is picked up via NODE_PATH=<prefix>/lib/node_modules).
   Verify:  fonts print as "loaded" in stdout; if a family is missing the PNG
            silently falls back to a system font, so check that line.

   To add a card: push an entry onto CARDS with { name, css, body }. Shared CSS
   lives in BASE_CSS; each card supplies only its body markup + its own rules.
   ========================================================================== */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTS = path.join(ROOT, 'fonts');
const OUT = path.join(ROOT, 'og');

/* woff2 inlined as data: URIs — page.setContent() runs on about:blank, which
   cannot fetch file:// URLs, and we don't want to depend on a local server. */
const fontUrl = (f) => 'url(data:font/woff2;base64,' + fs.readFileSync(path.join(FONTS, f)).toString('base64') + ") format('woff2')";
const FONT_FACE = [
  ['Barlow', 400, 'barlow-400.woff2'],
  ['Barlow', 600, 'barlow-600.woff2'],
  ['Barlow Condensed', 700, 'barlow-condensed-700.woff2'],
  ['Barlow Condensed', 800, 'barlow-condensed-800.woff2'],
  ['Barlow Condensed', 900, 'barlow-condensed-900.woff2'],
  ['JetBrains Mono', '100 800', 'jetbrains-mono-var.woff2'],
].map(([fam, w, f]) => `@font-face{font-family:'${fam}';font-weight:${w};src:${fontUrl(f)};}`).join('\n');

const BASE_CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1200px; height:630px; background:#07090C; overflow:hidden; }
  body { font-family:'Barlow', sans-serif; color:#b8cdd4; position:relative; -webkit-font-smoothing:antialiased; }
  .grid { position:absolute; inset:0; background-image:linear-gradient(rgba(0,204,245,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,204,245,0.06) 1px, transparent 1px); background-size:60px 60px; }
  .glow { position:absolute; left:-140px; top:-200px; width:640px; height:640px; border-radius:50%; background:radial-gradient(circle, rgba(0,204,245,0.18) 0%, rgba(0,204,245,0.06) 35%, transparent 70%); }
  .top { position:absolute; left:48px; right:48px; top:34px; display:flex; align-items:center; gap:14px; padding-bottom:16px; border-bottom:1px solid rgba(0,204,245,0.22); }
  .logo { font-family:'Barlow Condensed', sans-serif; font-weight:900; font-size:26px; letter-spacing:3px; text-transform:uppercase; color:#e4f0f4; }
  .logo span { color:#00ccf5; }
  .tag { font-family:'JetBrains Mono', monospace; font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#7a969e; }
  .tag::before { content:'●'; color:#00ccf5; margin-right:10px; font-size:9px; }
  .eyebrow { position:absolute; left:48px; top:112px; font-family:'JetBrains Mono', monospace; font-size:13px; letter-spacing:4px; text-transform:uppercase; color:#00ccf5; display:flex; align-items:center; gap:14px; }
  .eyebrow::before { content:''; width:32px; height:2px; background:#00ccf5; }
  h1 { position:absolute; left:48px; top:150px; font-family:'Barlow Condensed', sans-serif; font-weight:900; font-size:124px; line-height:0.95; letter-spacing:2px; text-transform:uppercase; color:#e4f0f4; }
  h1 span { display:block; color:#00ccf5; }
  .sub { position:absolute; left:48px; top:414px; max-width:600px; line-height:1.25; font-size:24px; font-weight:400; color:#b8cdd4; letter-spacing:.2px; }
  .sub b { color:#e4f0f4; font-weight:600; }
  .chips { position:absolute; left:48px; top:498px; display:flex; gap:10px; }
  .chip { font-family:'JetBrains Mono', monospace; font-size:14px; letter-spacing:2px; color:#e4f0f4; background:#0c1017; border:1px solid rgba(255,255,255,0.12); border-top:2px solid #00ccf5; padding:10px 14px; }
  .chip i { font-style:normal; color:#00e07a; margin-left:8px; }
  .chip i.dn { color:#ff2e55; }
  .foot { position:absolute; left:48px; bottom:28px; font-family:'JetBrains Mono', monospace; font-size:13px; letter-spacing:2px; color:#7a969e; }
`;

/* ---------------------------------------------------------------- cards */
const CARDS = [
  {
    name: 'vault',
    css: `
      h1 { font-size:118px; top:142px; }
      .sub { top:378px; max-width:600px; font-size:23px; }
      .chips { top:462px; }
      .panel { position:absolute; right:48px; top:120px; width:470px; height:400px; background:#0c1017; border:1px solid rgba(255,255,255,0.12); border-top:2px solid #00ccf5; padding:18px 20px 16px; }
      .panel .k { font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#7a969e; display:flex; justify-content:space-between; }
      .panel .k i { font-style:normal; color:#00e07a; }
      .panel .k i::before { content:'●'; margin-right:6px; font-size:8px; vertical-align:middle; }
      table { width:100%; border-collapse:collapse; margin-top:14px; font-family:'JetBrains Mono', monospace; font-size:13px; }
      th { text-align:left; font-weight:400; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#7a969e; padding:0 0 8px; border-bottom:1px solid rgba(255,255,255,0.12); }
      td { padding:17px 0; border-bottom:1px solid rgba(255,255,255,0.07); vertical-align:middle; }
      td.n { font-family:'Barlow', sans-serif; font-weight:600; font-size:16px; color:#e4f0f4; line-height:1.15; }
      td.n small { display:block; font-family:'JetBrains Mono', monospace; font-weight:400; font-size:10px; letter-spacing:1px; color:#7a969e; margin-top:3px; }
      td.p { color:#e4f0f4; text-align:right; font-size:15px; }
      td.d { text-align:right; width:76px; font-weight:700; }
      .up { color:#00e07a; } .dn { color:#ff2e55; }
      td.s { width:96px; padding-left:14px; }
      td.s svg { display:block; }
      .stat { position:absolute; left:20px; right:20px; bottom:16px; display:flex; justify-content:space-between; align-items:flex-end; }
      .stat .v { font-family:'Barlow Condensed', sans-serif; font-weight:800; font-size:40px; color:#e4f0f4; line-height:1; }
      .stat .v i { font-style:normal; font-family:'JetBrains Mono', monospace; font-size:15px; color:#00e07a; margin-left:10px; vertical-align:middle; letter-spacing:1px; }
      .stat .k2 { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#7a969e; text-align:right; line-height:1.5; }
    `,
    body: `
      <div class="grid"></div><div class="glow"></div>
      <div class="top"><div class="logo">Shop<span>Card</span>Hub</div><div class="tag">Sports Card Intelligence</div></div>
      <div class="eyebrow">Watchlist · Portfolio · Buy zones</div>
      <h1>The<span>Vault</span></h1>
      <div class="sub">Free card watchlist &amp; portfolio · <b>no account</b> · live price engine</div>
      <div class="chips">
        <div class="chip">HUNTING</div><div class="chip">MY CARDS</div><div class="chip">BUY ZONE<i>▲</i></div>
      </div>
      <div class="panel">
        <div class="k"><span>Watchlist · 3 cards</span><i>Engine live</i></div>
        <table>
          <tr><th>Card</th><th style="text-align:right">Last</th><th style="text-align:right">30d</th><th></th></tr>
          <tr>
            <td class="n">Ethan Holliday 1st Bowman<small>2025 Bowman Draft · Raw</small></td>
            <td class="p">$184</td><td class="d up">+12.4%</td>
            <td class="s"><svg width="82" height="30" viewBox="0 0 82 30"><path d="M1 24 L12 20 L23 22 L34 15 L45 17 L56 10 L67 12 L81 4" fill="none" stroke="#00e07a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="81" cy="4" r="3" fill="#00e07a"/></svg></td>
          </tr>
          <tr>
            <td class="n">Mega Darkrai ex SIR<small>Pitch Black · #116/084 · Raw</small></td>
            <td class="p">$455</td><td class="d dn">-6.8%</td>
            <td class="s"><svg width="82" height="30" viewBox="0 0 82 30"><path d="M1 8 L12 12 L23 9 L34 16 L45 14 L56 21 L67 19 L81 25" fill="none" stroke="#ff2e55" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="81" cy="25" r="3" fill="#ff2e55"/></svg></td>
          </tr>
          <tr>
            <td class="n">Cooper Flagg Prizm RC<small>2025-26 Prizm · Silver · PSA 10</small></td>
            <td class="p">$312</td><td class="d up">+3.1%</td>
            <td class="s"><svg width="82" height="30" viewBox="0 0 82 30"><path d="M1 18 L12 21 L23 15 L34 19 L45 12 L56 16 L67 11 L81 9" fill="none" stroke="#00e07a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="81" cy="9" r="3" fill="#00e07a"/></svg></td>
          </tr>
        </table>
        <div class="stat"><div class="v">$951<i>+4.2%</i></div><div class="k2">Portfolio value<br>Your data · your device</div></div>
      </div>
      <div class="foot">shopcardhub.com/watchlist</div>
    `,
  },
];

/* ---------------------------------------------------------------- render */
function html(card) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT_FACE}${BASE_CSS}${card.css || ''}</style></head><body>${card.body}</body></html>`;
}

const only = process.argv.slice(2);
const todo = only.length ? CARDS.filter(c => only.includes(c.name)) : CARDS;
if (!todo.length) { console.error('no matching card; known: ' + CARDS.map(c => c.name).join(', ')); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  for (const card of todo) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(html(card), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.fonts.status === 'loaded');
    const loaded = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
    const out = path.join(OUT, card.name + '.png');
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    console.log(`${path.relative(ROOT, out)}  fonts loaded: ${loaded.join(', ') || 'NONE (check @font-face paths)'}`);
    await page.close();
  }
} finally {
  await browser.close();
}
