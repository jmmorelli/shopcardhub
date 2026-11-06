#!/usr/bin/env node
// build-local-nav.mjs — the sticky local nav on every set-index page (Cupertino run 5, Nov 4 2026; R46,
// claude/agents/cupertino/DESIGN-SYSTEM.md "Navigation → Local nav").
//
// What: a 52 px bar that sticks under the global nav (top: var(--ds-nav-h)) with the set's name on the left, two or
// three in-page links (Chart · Cards · How it works; desktop only) and ONE filled pill on the right that goes to eBay.
// It carries the page's above-the-fold buy link (R11) at every scroll position, the way a product page keeps its
// "Buy" button in reach.
//
// The pill's link is never typed here. It is the page's own first eBay link inside its generated buy block
// (SEALED · BUYBOX · BUYSTRIP — tools/build-sealed-rows.mjs, the sector/index generators, tools/build-buy-strip.mjs,
// all built through the EPN param set / tools/lib/epn.mjs), copied byte for byte with its target and rel. So the
// customid, the search and every EPN parameter are the buy box's; re-run this after any of those generators and the
// pill follows. The buy box itself is not touched and stays exactly where it is.
//
// Which pages: every page in data/indices.json that has the chart (`.idx-chart`), the "How this index works" toggle
// (`id="<tk>-method"`) and a buy block with an EPN link. Anything else is skipped and named, never guessed.
//
// Where: one block, <!-- LOCALNAV:START --> … <!-- LOCALNAV:END -->, directly after <!-- NAV:END -->. It sits in the
// page flow (position: sticky), so its 52 px are reserved from the first paint and nothing below it shifts.
// The look lives in css/site-fixes.css §0c, the index-template rules beside it; no JS (the "How it works" link opens
// the toggle with a one-line onclick; with JS off it still scrolls there).
//
// Anchors (existing ids only): Chart → #<tk> (the index section; the six chase pages get it on the HERO mast from
// tools/bake-plain-read.mjs) · Cards → #<tk>-chase or #chase (the priciest-cards strip; left out when a page has
// none) · How it works → #<tk>-method.
//
// Run 6 (Nov 5 2026): the block also loads js/scroll-flow.js (deferred, one file, no library) — the scroll flow: blocks
// below the first screen fade up once as they come into view. It never touches the first screen or a buy block, is off
// under prefers-reduced-motion, and hides nothing when JS is off (DESIGN-SYSTEM.md "Motion → Scroll flow").
//
// Usage: node tools/build-local-nav.mjs [--check]   (idempotent; --check exits 1 if a page would change)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const idx = JSON.parse(fs.readFileSync(path.join(REPO, "data/indices.json"), "utf8"));
const S = "<!-- LOCALNAV:START", E = "<!-- LOCALNAV:END -->";
const BUY_BLOCKS = ["SEALED", "BUYBOX", "BUYSTRIP"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// the set's name as a collector says it: "Destined Rivals Chase Index" → "Destined Rivals"
// (the home box's rule: "Base Set" keeps its "Set")
const shortName = (n) => String(n).replace(/\s+(Chase|1st Auto|Class|Sector)?\s*Index$/i, "").replace(/^((?!Base Set$).*)\s+Set$/i, "$1").trim();

function buyLink(html) {
  const navEnd = html.indexOf("<!-- NAV:END");
  let best = null;
  for (const name of BUY_BLOCKS) {
    const re = new RegExp(`<!-- ${name}:START[^>]*-->([\\s\\S]*?)<!-- ${name}:END -->`, "g");
    let m;
    while ((m = re.exec(html))) {
      if (m.index < navEnd) continue;
      const a = /<a\b([^>]*?)\bhref="(https:\/\/www\.ebay\.com\/[^"]*campid=5339155990[^"]*)"([^>]*)>([\s\S]*?)<\/a>/.exec(m[1]);
      if (!a) continue;
      const at = m.index + m[0].indexOf(a[0]);
      if (/\bhidden\b/.test(a[1] + a[3])) continue;
      if (!best || at < best.at) {
        const attr = (k) => { const r = new RegExp(`\\b${k}="([^"]*)"`).exec(a[1] + " " + a[3]); return r ? r[1] : null; };
        const label = a[4].replace(/<[^>]+>/g, "").replace(/&rarr;|&nearr;|[→↗›]/g, "").replace(/\s+/g, " ").trim();
        best = { at, href: a[2], target: attr("target"), rel: attr("rel"), label, block: name };
      }
      break;   // the first link of each block is its primary button
    }
  }
  return best;
}

function block(tk, html) {
  const r = idx[tk];
  const t = tk.toLowerCase();
  const link = buyLink(html);
  if (!link) return { skip: "no EPN link in a SEALED/BUYBOX/BUYSTRIP block" };
  const chart = html.includes(`id="${t}"`) ? `#${t}` : null;
  if (!chart) return { skip: `no #${t} anchor (run tools/bake-plain-read.mjs first on the chase pages)` };
  const cards = html.includes(`id="${t}-chase"`) ? `#${t}-chase` : (html.includes('id="chase"') ? "#chase" : null);
  const name = shortName(r.name || tk);
  const links = [`<a href="${chart}">Chart</a>`];
  if (cards) links.push(`<a href="${cards}">Cards</a>`);
  links.push(`<a href="#${t}-method" onclick="var d=document.getElementById('${t}-method');if(d)d.open=true">How it works</a>`);
  const tgt = link.target ? ` target="${link.target}"` : "";
  const rel = link.rel ? ` rel="${link.rel}"` : "";
  // the buy button's own words for screen readers ("Shop booster boxes on eBay"); a tile-style button whose text is a
  // whole product card (the 30th page's ETB tile) keeps the visible "Shop on eBay" instead
  const plain = link.label && !/[&<>]/.test(link.label) && link.label.length <= 40 && !/^ebay$/i.test(link.label) ? link.label : null;
  // (WCAG 2.5.3: the spoken name starts with the visible words)
  const what = plain ? plain.replace(/^Shop\s+/i, "").replace(/\s+on eBay$/i, "") : "";
  const aria = what ? ` aria-label="Shop on eBay: ${esc(what)}"` : "";
  const out = `${S} — sticky local nav (Cupertino run 5, Nov 4 2026; DESIGN-SYSTEM.md "Local nav"). Generated by tools/build-local-nav.mjs; the pill's link is this page's own ${link.block} buy link, copied byte for byte. Do not hand-edit. -->
<div class="lnav" data-lnav="${tk}"><div class="lnav-in">
<a class="lnav-t" href="${chart}">${esc(name)}</a>
<div class="lnav-l" role="navigation" aria-label="On this page">${links.join("")}</div>
<a class="lnav-pill" href="${link.href}"${tgt}${rel}${aria} onclick="if(typeof gtag==='function')gtag('event','localnav_click',{tk:'${tk}',page:location.pathname})">Shop on eBay</a>
</div></div>
<script src="/js/scroll-flow.js?v=1" defer></script>
${E}`;
  return { out, link };
}

const changed = [], skipped = [], done = [];
const seen = new Set();
for (const [tk, r] of Object.entries(idx)) {
  if (!r || typeof r !== "object" || !r.page) continue;
  const file = r.page.replace(/^\//, "") + ".html";
  if (seen.has(file)) continue;
  const f = path.join(REPO, file);
  if (!fs.existsSync(f)) { skipped.push(`${file} — not on disk`); continue; }
  const before = fs.readFileSync(f, "utf8");
  if (!new RegExp(`<div class="idx-chart" data-ticker="${tk}"`).test(before)) { skipped.push(`${file} — no ${tk} chart`); continue; }
  if (!before.includes(`id="${tk.toLowerCase()}-method"`)) { skipped.push(`${file} — no "How this index works" toggle`); continue; }
  seen.add(file);
  const b = block(tk, before);
  if (!b.out) { skipped.push(`${file} — ${b.skip}`); continue; }
  let html;
  const a = before.indexOf(S);
  if (a !== -1) {
    const z = before.indexOf(E, a);
    if (z === -1) throw new Error(`${file}: ${S} without END`);
    html = before.slice(0, a) + b.out + before.slice(z + E.length);
  } else {
    const nav = before.indexOf("<!-- NAV:END -->");
    if (nav === -1) { skipped.push(`${file} — no NAV:END marker`); continue; }
    const at = nav + "<!-- NAV:END -->".length;
    html = before.slice(0, at) + "\n" + b.out + before.slice(at);
  }
  done.push(`${tk} ${b.link.block}`);
  if (html !== before) { changed.push(file); if (!CHECK) fs.writeFileSync(f, html); }
}
console.log(`local nav ${CHECK ? "check" : "build"}: ${done.length} page(s) carry it, ${changed.length} ${CHECK ? "stale" : "written"}`);
for (const s of skipped) console.log("  skip " + s);
if (CHECK && changed.length) { console.log("  stale: " + changed.join(", ")); process.exit(1); }
