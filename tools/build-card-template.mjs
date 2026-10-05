#!/usr/bin/env node
// build-card-template.mjs — writes /card.html, the one card page every Pokémon index card opens (/card?id=bs99-4).
// Sep 30 2026, Mo: "search individual cards … pulls up the card page (in an index already) that gives them all the
// options … show the difference in price between raw, 9, and 10 … promo TAG graded as its own link".
// The page is a shell: js/card-page.js renders it from data/cards/<tk>.json (+ g-<tk>.json for graded marks).
// Shell pieces (head CSS, GA, nav, footer) are borrowed from how-prices-work.html like tools/build-card-pages.mjs.
// noindex for now: ~1,860 client-rendered variants of one URL are not a search surface. Static, indexable pages for the
// highest-demand cards are the follow-up if the page earns its clicks (decision for the CoS weekly, not this tool).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ebaySearchUrl, SACAT_TCG } from "./lib/epn.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHELL = fs.readFileSync(path.join(ROOT, "how-prices-work.html"), "utf8");
const pageCss = (SHELL.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
const gtag = (SHELL.match(/(<!-- Google Analytics[\s\S]*?<\/script>)/) || [])[1];
const nav = (SHELL.match(/(<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->)/) || [])[1];
const footer = (SHELL.match(/(<footer>[\s\S]*?<\/footer>)/) || [])[1];
if (!pageCss || !gtag || !nav || !footer) throw new Error("shell pieces not found in how-prices-work.html");

const CSS = `
.cdp{max-width:1100px;margin:0 auto;padding:22px 20px 40px;--ac:var(--accent,#00ccf5)}
.cdp-crumbs{font-family:var(--fm);font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim);margin-bottom:16px}
.cdp-crumbs a{color:var(--text-dim)} .cdp-crumbs a:hover{color:var(--ac)} .cdp-crumbs span{margin:0 6px;opacity:.6}
.cdp-top{display:grid;grid-template-columns:200px minmax(0,1fr);gap:28px;align-items:start}
.cdp-photo .sch-cimg{width:200px!important;height:280px!important}
.cdp-eyebrow{font-family:var(--fm);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ac);margin-bottom:8px}
.cdp h1{font-family:var(--fd);font-size:clamp(28px,4.2vw,46px);font-weight:900;text-transform:uppercase;color:var(--text-head);margin:0 0 6px;line-height:1}
.cdp-set{font-family:var(--fm);font-size:12px;color:var(--text-dim);margin:0 0 14px}
.cdp-set a{color:var(--ac)}
.cdp-idx{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.cdp-idx a,.cdp-idx span{font-family:var(--fm);font-size:10.5px;letter-spacing:1px;text-transform:uppercase;border:1px solid var(--border2,rgba(255,255,255,.14));padding:5px 9px;border-radius:2px;color:var(--text)}
.cdp-idx a{border-color:var(--ac);color:var(--ac);text-decoration:none} .cdp-idx a:hover{background:var(--ac);color:#000}
.cdp-ladder{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--border,rgba(255,255,255,.08));background:var(--bg2,#0c1017)}
.cdp-rung{padding:14px 14px 12px;border-right:1px solid var(--border,rgba(255,255,255,.08));min-width:0}
.cdp-rung:last-child{border-right:0}
.cdp-rung .k{font-family:var(--fm);font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--text-dim)}
.cdp-rung .k b{color:var(--text-head)} .cdp-rung.tag .k b{color:#00e07a}
.cdp-rung .v{font-family:var(--fd);font-size:30px;font-weight:900;color:var(--text-head);line-height:1.05;margin-top:6px;white-space:nowrap}
.cdp-rung .v.na{font-size:15px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;padding-top:10px}
.cdp-rung .x{font-family:var(--fm);font-size:12px;color:var(--ac);margin-top:4px;min-height:16px}
.cdp-rung .n{font-family:var(--fm);font-size:10px;color:var(--text-dim);margin-top:6px;line-height:1.5}
.cdp-chart{margin:14px 0 0;padding:14px;border:1px solid var(--border,rgba(255,255,255,.08));background:var(--bg2,#0c1017)}
.cdp-chart .h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.cdp-chart .h b{font-family:var(--fd);font-size:18px;font-weight:900;text-transform:uppercase;color:var(--text-head)}
.cdp-chart .rg{display:inline-flex;gap:4px}
.cdp-chart .rg button{font-family:var(--fm);font-size:10.5px;letter-spacing:1px;min-height:32px;min-width:44px;padding:4px 10px;border:1px solid var(--border2,rgba(255,255,255,.14));background:transparent;color:var(--text);border-radius:2px;cursor:pointer}
.cdp-chart .rg button[aria-pressed="true"]{border-color:var(--ac);color:var(--ac)}
.cdp-chart .leg{display:flex;flex-wrap:wrap;gap:6px 16px;font-family:var(--fm);font-size:11px;color:var(--text-dim);margin-bottom:6px}
.cdp-chart .leg i{display:inline-block;width:12px;height:3px;margin-right:6px;vertical-align:middle}
.cdp-chart .leg b{color:var(--text-head)} .cdp-chart .leg em{font-style:normal} .cdp-chart .leg .up{color:var(--green,#00e07a)} .cdp-chart .leg .dn{color:var(--red,#ff2e55)}
.cdp-chart svg{display:block;max-width:100%}
.cdp-chart .src{font-family:var(--fm);font-size:10px;color:var(--text-dim);margin-top:6px;line-height:1.5} .cdp-chart .src a{color:var(--ac)}
.cdp-bars{margin:14px 0 0;padding:14px;border:1px solid var(--border,rgba(255,255,255,.08));background:var(--bg2,#0c1017)}
.cdp-bars .h{font-family:var(--fm);font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px}
.cdp-bar{display:grid;grid-template-columns:64px minmax(0,1fr) 90px;gap:10px;align-items:center;margin:6px 0;font-family:var(--fm);font-size:11px}
.cdp-bar i{display:block;height:12px;background:var(--ac);border-radius:1px;min-width:2px} .cdp-bar.tag i{background:#00e07a}
.cdp-bar span:last-child{text-align:right;color:var(--text-head)}
.cdp-stat{font-family:var(--fm);font-size:11px;color:var(--text-dim);margin-top:10px;line-height:1.6}
.cdp-stat b{color:var(--text-head)}
.cdp-buy{margin:18px 0 0;padding:16px;border:1px solid var(--border,rgba(255,255,255,.08));border-left:3px solid var(--ac);background:var(--bg2,#0c1017)}
.cdp-buy .h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:12px}
.cdp-buy .h b{font-family:var(--fd);font-size:20px;font-weight:900;text-transform:uppercase;color:var(--text-head)}
.cdp-mode{display:inline-flex;gap:4px}
.cdp-mode button{font-family:var(--fd);font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;min-height:38px;padding:6px 14px;border:1px solid var(--ac);background:transparent;color:var(--text-head);border-radius:2px;cursor:pointer}
.cdp-mode button[aria-pressed="true"]{background:var(--ac);color:#000}
.cdp-btns{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.cdp-btns a{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:56px;padding:8px;border-radius:2px;text-decoration:none;font-family:var(--fd);font-weight:800;font-size:16px;letter-spacing:1px;text-transform:uppercase;background:var(--gold,#f5c800);color:#000}
.cdp-btns a small{font-family:var(--fm);font-weight:400;font-size:9.5px;letter-spacing:.5px;text-transform:none;margin-top:2px;opacity:.75}
.cdp-btns a.tag{background:#00e07a}
.cdp-btns a:hover{filter:brightness(1.08)}
.cdp-buy .f{font-family:var(--fm);font-size:10px;color:var(--text-dim);margin-top:10px;line-height:1.6}
.cdp-buy .f a{color:var(--ac)}
.cdp-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px}
.cdp-row .sch-track-card{font-family:var(--fd);font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;min-height:40px;padding:8px 16px;border:1px solid var(--border2,rgba(255,255,255,.14));background:transparent;color:var(--text-head);border-radius:2px;cursor:pointer}
.cdp-more{margin-top:26px}
.cdp-more h2{font-family:var(--fd);font-size:20px;font-weight:900;text-transform:uppercase;color:var(--text-head);margin:0 0 10px}
.cdp-more .g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.cdp-more a{display:block;padding:10px 12px;border:1px solid var(--border,rgba(255,255,255,.08));background:var(--bg2,#0c1017);text-decoration:none;color:var(--text);font-family:var(--fm);font-size:11px;line-height:1.4}
.cdp-more a b{display:block;font-family:var(--fb);font-size:13px;color:var(--text-head)} .cdp-more a:hover{border-color:var(--ac)}
.cdp-method{font-size:11px;line-height:1.7;color:var(--text-dim);margin-top:24px;max-width:820px}
.cdp-method b{color:var(--text)}
.cdp-miss{padding:40px 0;font-family:var(--fm);color:var(--text-dim)}
@media(max-width:760px){.cdp-top{grid-template-columns:110px minmax(0,1fr);gap:14px}.cdp-photo .sch-cimg{width:110px!important;height:154px!important}
.cdp-ladder{grid-template-columns:repeat(2,minmax(0,1fr))}.cdp-rung:nth-child(2){border-right:0}.cdp-rung:nth-child(-n+2){border-bottom:1px solid var(--border,rgba(255,255,255,.08))}.cdp-rung .v{font-size:24px}
.cdp-btns{grid-template-columns:repeat(2,minmax(0,1fr))}.cdp-more .g{grid-template-columns:repeat(2,minmax(0,1fr))}.cdp-bar{grid-template-columns:52px minmax(0,1fr) 76px}}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>Card Price Ladder — Raw vs PSA 9 vs PSA 10 vs TAG | ShopCardHub</title>
  <meta name="description" content="One Pokémon card, every grade: the raw sold mark from its set index beside dated PSA 9, PSA 10 and TAG 10 sales, the grading premium, and eBay links for each grade (Buy It Now or auctions).">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="https://www.shopcardhub.com/card">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Card Price Ladder — Raw vs PSA 9 vs PSA 10 vs TAG">
  <meta property="og:site_name" content="ShopCardHub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/pokemon.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <link rel="preload" href="/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/fonts.css">
  <style>${pageCss}</style>
  <style>${CSS}</style>
  ${gtag}
  <link rel="stylesheet" href="/css/site-fixes.css">
</head>
<body>

${nav}

<main class="cdp" id="cdp" aria-live="polite">
  <div class="cdp-crumbs"><a href="/">Home</a><span>/</span><a href="/indices">Indices</a><span>/</span><span>Card</span></div>
  <div class="cdp-miss" id="cdp-load">Loading card… <a href="${ebaySearchUrl({ q: "pokemon card", customid: "card-page", sacat: SACAT_TCG })}" target="_blank" rel="sponsored nofollow noopener">Pokémon singles on eBay →</a></div>
  <noscript><p class="cdp-miss">This page needs JavaScript to read the card's price ladder. Every card is also listed on its set's index page — <a href="/indices">open the indices</a>.</p></noscript>
</main>

${footer}

<script src="/js/grade-links.js?v=2" defer></script>
<script src="/js/card-page.js?v=3" defer></script>
<script src="/js/card-img.js?v=3" defer></script>
<script src="/js/vault-track.js?v=6" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "card.html"), html);
console.log("wrote card.html");
