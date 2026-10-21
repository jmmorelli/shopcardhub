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
.cdp{max-width:1100px;margin:0 auto;padding:22px 20px 40px;--ac:var(--accent,#00ccf5);min-height:100vh}
.cdp.cdp-done{min-height:0}
.cdp-crumbs{font-family:var(--fm);font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim);margin-bottom:16px}
.cdp-crumbs a{color:var(--text-dim)} .cdp-crumbs a:hover{color:var(--ac)} .cdp-crumbs span{margin:0 6px;opacity:.6}
.cdp-photo .sch-cimg{width:200px!important;height:280px!important}
.cdp h1{font-family:var(--fd);font-size:clamp(28px,4.2vw,46px);font-weight:900;text-transform:uppercase;color:var(--text-head);margin:0 0 6px;line-height:1}
.cdp-set{font-family:var(--fm);font-size:12px;color:var(--text-dim);margin:0 0 14px}
.cdp-set a{color:var(--ac)}
.cdp-chart{margin:14px 0 0;padding:14px;box-sizing:border-box;border:1px solid var(--border,rgba(255,255,255,.08));background:var(--bg2,#0c1017)}
.cdp-chart .h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.cdp-chart .h b{font-family:var(--fd);font-size:18px;font-weight:900;text-transform:uppercase;color:var(--text-head)}
.cdp-chart .rg{display:inline-flex;gap:4px}
.cdp-chart .rg button{font-family:var(--fm);font-size:11px;letter-spacing:1px;min-height:40px;min-width:44px;padding:4px 10px;border:1px solid var(--border2,rgba(255,255,255,.14));background:transparent;color:var(--text);border-radius:2px;cursor:pointer}
.cdp-chart .rg button[aria-pressed="true"]{border-color:var(--ac);color:var(--ac)}
.cdp-chart .leg{display:flex;flex-wrap:wrap;gap:6px 16px;font-family:var(--fm);font-size:11px;color:var(--text-dim);margin-bottom:6px}
.cdp-chart .leg i{display:inline-block;width:12px;height:3px;margin-right:6px;vertical-align:middle}
.cdp-chart .leg b{color:var(--text-head)} .cdp-chart .leg em{font-style:normal} .cdp-chart .leg .up{color:var(--green,#00e07a)} .cdp-chart .leg .dn{color:var(--red,#ff2e55)}
.cdp-chart svg{display:block;max-width:100%}
.cdp-chart .src{font-family:var(--fm);font-size:11px;color:var(--text-dim);margin-top:6px;line-height:1.5} .cdp-chart .src a{color:var(--ac)}
.cdp-stat{font-family:var(--fm);font-size:11px;color:var(--text-dim);margin-top:10px;line-height:1.6}
.cdp-stat b{color:var(--text-head)}
.cdp-buy{margin:18px 0 0;padding:16px;border:1px solid var(--border,rgba(255,255,255,.08));border-left:3px solid var(--ac);background:var(--bg2,#0c1017)}
.cdp-buy .h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:12px}
.cdp-buy .h b{font-family:var(--fd);font-size:20px;font-weight:900;text-transform:uppercase;color:var(--text-head)}
.cdp-btns a{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:56px;padding:8px;border-radius:2px;text-decoration:none;font-family:var(--fd);font-weight:800;font-size:16px;letter-spacing:1px;text-transform:uppercase;background:var(--gold,#f5c800);color:#000}
.cdp-btns a small{font-family:var(--fm);font-weight:400;font-size:11px;letter-spacing:.5px;text-transform:none;margin-top:2px;opacity:.75}

.cdp-btns a:hover{filter:brightness(1.08)}
.cdp-btns .tcg-slot{display:block;min-height:56px}
.cdp-shop-wait{min-height:124px;box-sizing:border-box;margin:0 0 12px}
@media(max-width:560px){.cdp-shop-wait{min-height:265px}}
.cdp-buy .f{font-family:var(--fm);font-size:11px;color:var(--text-dim);margin-top:10px;line-height:1.6}
.cdp-buy .f a{color:var(--ac)}
.cdp-more{margin-top:26px}
.cdp-more h2{font-family:var(--fd);font-size:20px;font-weight:900;text-transform:uppercase;color:var(--text-head);margin:0 0 10px}
.cdp-more .g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.cdp-more a{display:block;padding:10px 12px;border:1px solid var(--border,rgba(255,255,255,.08));background:var(--bg2,#0c1017);text-decoration:none;color:var(--text);font-family:var(--fm);font-size:11px;line-height:1.4}
.cdp-more a b{display:block;font-family:var(--fb);font-size:13px;color:var(--text-head)} .cdp-more a:hover{border-color:var(--ac)}
.cdp-method{font-size:11px;line-height:1.7;color:var(--text-dim);margin-top:24px;max-width:820px}
.cdp-method b{color:var(--text)}
.cdp-miss{padding:40px 0;font-family:var(--fm);color:var(--text-dim)}
/* Night Crew Oct 1: the chart box is drawn at its final height while its data loads (B19, no shift) */
/* v2 card page (PIVOT P0-A, Night Crew Oct 21): quote header + one eBay button + tabs */
.cdp-top{display:grid;grid-template-columns:200px minmax(0,1fr);grid-template-areas:"photo info" "photo q";column-gap:28px;row-gap:0;align-items:start;align-content:start}
.cdp-photo{grid-area:photo}.cdp-info{grid-area:info;min-width:0}.cdp-q{grid-area:q;min-width:0}
.cdp-set a{color:var(--ac)}
.cdp-gr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border:1px solid var(--border2,rgba(255,255,255,.14));border-radius:3px;overflow:hidden;max-width:560px}
.cdp-gr button{min-height:48px;padding:6px 4px;border:0;border-right:1px solid var(--border2,rgba(255,255,255,.14));background:transparent;color:var(--text-head);font-family:var(--fd);font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;line-height:1.1;transition:background .15s,color .15s}
.cdp-gr button:last-child{border-right:0}
.cdp-gr button:hover:not([aria-selected="true"]),.cdp-tabs button:hover:not([aria-selected="true"]){background:rgba(255,255,255,.04);color:var(--text-head)}
.cdp-gr button small{display:block;font-family:var(--fm);font-weight:400;font-size:11px;letter-spacing:0;text-transform:none;color:var(--text-dim);margin-top:2px}
.cdp-gr button[aria-selected="true"]{background:var(--ac);color:#000}.cdp-gr button[aria-selected="true"] small{color:#000;opacity:.8}
.cdp-gr button:focus-visible,.cdp-tabs button:focus-visible{outline:2px solid var(--ac);outline-offset:-2px}
.cdp-big{font-family:var(--fm);font-weight:700;font-size:40px;line-height:1.1;color:var(--text-head);margin:14px 0 2px;font-variant-numeric:tabular-nums;min-height:44px}
.cdp-big.na{font-family:var(--fd);font-size:22px;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);padding-top:10px;min-height:34px}
.cdp-basis{font-family:var(--fm);font-size:12px;line-height:1.5;color:var(--text-dim);min-height:36px;max-width:560px}
.cdp-spread{font-family:var(--fm);font-size:12px;color:var(--text);margin-top:6px}.cdp-spread b{color:var(--text-head)}.cdp-spread a{color:var(--ac)}
.cdp-cta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:14px;max-width:560px}
.cdp-ebay{flex:1 1 100%;display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:3px;text-decoration:none;font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:1px;text-transform:uppercase;background:var(--gold,#f5c800);color:#000}
.cdp-ebay:hover{filter:brightness(1.08)}
.cdp-auc{font-family:var(--fm);font-size:12px;color:var(--ac);min-height:40px;display:inline-flex;align-items:center}
.cdp-cta .sch-track-card{font-family:var(--fd);font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;min-height:40px;padding:8px 16px;border:1px solid var(--border2,rgba(255,255,255,.14));background:transparent;color:var(--text-head);border-radius:2px;cursor:pointer;margin-left:auto}
.cdp-tabs{display:flex;gap:4px;margin:26px 0 0;border-bottom:1px solid var(--border2,rgba(255,255,255,.14))}
.cdp-tabs button{min-height:44px;padding:8px 14px;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;background:transparent;color:var(--text-dim);font-family:var(--fd);font-weight:700;font-size:15px;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
.cdp-tabs button[aria-selected="true"]{color:var(--text-head);border-bottom-color:var(--ac)}
.cdp-panel{padding-top:14px}
.cdp-panel .cdp-chart{margin-top:0}
.cdp-chart.cdp-wait{min-height:331px}
.cdp-chart .leg i.ma{background:none;border-top:2px dashed #a9bccf;height:0}
.cdp-none{font-family:var(--fm);font-size:12px;color:var(--text-dim);padding:10px 0}
.cdp-sales{width:100%;border-collapse:collapse;font-family:var(--fm);font-size:12px}
.cdp-sales th,.cdp-sales td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--border,rgba(255,255,255,.08));vertical-align:top}
.cdp-sales thead th{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim);font-weight:400}
.cdp-sales tbody th{color:var(--text-head);white-space:nowrap}.cdp-sales td:nth-child(2){color:var(--text-head);white-space:nowrap}.cdp-sales td:last-child{color:var(--text-dim)}
.cdp-note{font-family:var(--fm);font-size:11px;color:var(--text-dim);line-height:1.6;margin-top:10px}
.cdp-kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 24px;margin:0}
.cdp-kv dt{font-family:var(--fm);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim)}
.cdp-kv dd{margin:2px 0 0}.cdp-kv dd b{font-family:var(--fm);font-size:18px;color:var(--text-head)}.cdp-kv dd em{font-style:normal;font-family:var(--fm);font-size:12px;color:var(--ac);margin-left:6px}
.cdp-kv dd small{display:block;font-family:var(--fm);font-size:11px;color:var(--text-dim);line-height:1.5;margin-top:3px}
.cdp-p62{margin-top:20px;padding:14px 16px;border:1px solid var(--border,rgba(255,255,255,.08));border-left:3px solid var(--ac);background:var(--bg2,#0c1017)}
.cdp-p62 h3{font-family:var(--fd);font-size:18px;font-weight:900;text-transform:uppercase;color:var(--text-head);margin:0 0 6px}
.cdp-p62 .hl{font-size:15px;color:var(--text-head);margin:0 0 10px;line-height:1.4}
.cdp-p62 ul{margin:0;padding-left:18px;font-family:var(--fm);font-size:12px;line-height:1.7;color:var(--text)}.cdp-p62 ul b{color:var(--text-head)}
.cdp-p62 .as{font-family:var(--fm);font-size:11px;line-height:1.6;color:var(--text-dim);margin:10px 0 0}
.cdp-ix .go{display:inline-flex;align-items:center;min-height:44px;padding:6px 14px;border:1px solid var(--ac);color:var(--ac);text-decoration:none;font-family:var(--fm);font-size:12px;letter-spacing:1px;text-transform:uppercase;border-radius:2px}
.cdp-ix p{font-family:var(--fm);font-size:12px;color:var(--text-dim);margin:10px 0 0}
.cdp-btns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-width:560px}
.cdp-btns:empty{display:none}
@media (prefers-reduced-motion:reduce){.cdp-gr button{transition:none}}
@media(max-width:760px){.cdp-top{grid-template-columns:96px minmax(0,1fr);grid-template-areas:"photo info" "q q";column-gap:14px;row-gap:14px}.cdp-photo .sch-cimg{width:96px!important;height:134px!important}
.cdp-chart.cdp-wait{min-height:299px}.cdp-more .g{grid-template-columns:repeat(2,minmax(0,1fr))}.cdp-big{font-size:36px}.cdp-tabs button{padding:8px 10px;font-size:14px}.cdp-kv{grid-template-columns:1fr}.cdp-btns{grid-template-columns:1fr}}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>Card Price — Raw vs PSA 9 vs PSA 10 vs TAG | ShopCardHub</title>
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
<script src="/js/card-page.js?v=8" defer></script>
<script src="/js/shop-spread.js?v=6" defer></script>
<script src="/js/card-img.js?v=3" defer></script>
<script src="/js/vault-track.js?v=6" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "card.html"), html);
console.log("wrote card.html");
