#!/usr/bin/env node
// bake-plain-read.mjs — the chart-first hero on the six hand-authored Pokémon chase-index pages
// (Night Crew, Oct 4 2026 — backlog B36; P0-C chart-first, Oct 23 2026 — Mo via DESIGN-DIRECTIVE-2026-10-23 §4).
//
// Why: js/plain-read.js renders the plain read from /data/indices.json. On the chase pages that used to land ~1 s after
// paint and push everything below it (production CLS 0.17 at 390 on /prismatic-evolutions-index). The set-index pages are
// baked inside build-sector-index.mjs; the chase pages are hand-authored, so they get this small generator instead.
//
// P0-C (Oct 23 2026): Mo opened /destined-rivals-index and did not see the chart without scrolling "quite a bit". Order
// above the fold is now eyebrow → ticker + set name → the big level with "this week · since release" on one line → the
// chart → one plain sentence → the SEALED row (the page's sealed/eBay button) → two tiles (priciest card, with the #1
// card's photo; biggest mover). The set description, the "100 = <month> · live since · re-marked" stamp, the quant
// strip (.stats + .statnote), the "how to read the big number" text and the Legend & Methodology block all move behind
// ONE collapsed "How this index works ▸" toggle under the table. Nothing is removed; no figure changes.
//
// What it writes, per page (markers; everything else is untouched):
//   HERO:START/END             the mast (eyebrow, h1, .level, the pr-line) — .level is remark-indices.mjs's, edited in place
//   PLAIN-READ:START/END       the plain-read CSS (id="pr-css") + the one sentence, UNDER the chart
//   PLAIN-READ:TILES:START/END the two tiles (the image slot is the old hero figure, kept verbatim inside the tile) + the
//                              checklist link tile for the sets in CHECKLIST (P0-E, Oct 24 2026)
//   PLAIN-READ:HOW:START/END   the toggle: .subline · .levelchg (remark-owned) · WORKS:START/END · .stats + .statnote
//                              (remark-owned cells) · the Legend & Methodology block — before <div class="foot">
// The SEALED block (tools/build-sealed-rows.mjs) is moved once, under the sentence; its own markers travel with it and
// that tool keeps replacing it in place. The first run migrates the old shape; every later run re-renders only the four
// data-driven parts from data/indices.json (the same facts()/bakeParts() the browser runs). Every figure comes from
// data/indices.json; no number is computed here.
//
// When: tools/build-chase-strip.mjs runs this after its own bake, and remark-indices.mjs runs build-chase-strip after
// every chase re-mark, so the baked read moves with the marks. Safe to run any time; idempotent.
//
// Usage: node tools/bake-plain-read.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PR = createRequire(import.meta.url)(path.join(REPO, "js/plain-read.js"));
const CHECK = process.argv.includes("--check");

const PAGES = ["pitch-black-index", "chaos-rising-index", "ascended-heroes-index", "prismatic-evolutions-index", "destined-rivals-index", "phantasmal-flames-index"];
/* P0-E (Oct 24 2026): a set with a checklist worksheet (tools/build-checklist-page.mjs CONFIG) gets the third, full-width link
   tile in the tiles row — the same opts.link build-sector-index.mjs passes for BCB26. Keyed by ticker. */
const CHECKLIST = {
  DR25: { href: "/destined-rivals-checklist", label: "Checklist: track what you have", sub: "Tick your cards, see an estimated value" },
  PRIS25: { href: "/prismatic-evolutions-checklist", label: "Checklist: track what you have", sub: "Tick your cards, see an estimated value" },
};
const START = "<!-- PLAIN-READ:START", END = "<!-- PLAIN-READ:END -->";
const HERO_S = "<!-- HERO:START", HERO_E = "<!-- HERO:END -->";
const TILES_S = "<!-- PLAIN-READ:TILES:START -->", TILES_E = "<!-- PLAIN-READ:TILES:END -->";
const HOW_S = "<!-- PLAIN-READ:HOW:START -->", HOW_E = "<!-- PLAIN-READ:HOW:END -->";
const WORKS_S = "<!-- PLAIN-READ:WORKS:START -->", WORKS_E = "<!-- PLAIN-READ:WORKS:END -->";
const FOLD_OPEN = "<!-- PLAIN-READ:FOLD -->", FOLD_CLOSE = "<!-- PLAIN-READ:FOLD-END -->";
const idx = JSON.parse(fs.readFileSync(path.join(REPO, "data/indices.json"), "utf8"));

const HERO_CSS = `<style id="hero-cf-css">.mast.hero-cf{align-items:flex-end}.mast.hero-cf .levelbox .pr-line{text-align:right;margin-top:8px}.pr-ti .hero-card-cap{display:none}@media(max-width:760px){.mast.hero-cf{display:block}.mast.hero-cf .levelbox{text-align:left;margin-top:12px}.mast.hero-cf .levelbox .pr-line{text-align:left}}</style>`;

function between(html, s, e) { const a = html.indexOf(s); if (a === -1) return null; const b = html.indexOf(e, a); if (b === -1) throw new Error(`${s} without ${e}`); return { a, b: b + e.length, inner: html.slice(a, b + e.length) }; }
function replaceBlock(html, s, e, blk) { const m = between(html, s, e); if (!m) throw new Error(`${s} missing`); return html.slice(0, m.a) + blk + html.slice(m.b); }

/* one-time migration from the Oct 4 shape (mast + read above the chart + hidden fold) to the chart-first shape */
function migrate(html, tk) {
  const mast = /<div class="mast hero-grid">\n<div>\n(<div class="eyebrow">[^\n]*<\/div>)\n(<h1>[\s\S]*?<\/h1>)\n(<div class="subline">[\s\S]*?<\/div>)\n<\/div>\n(<figure class="hero-card-photo">[\s\S]*?<\/figure>)\n<div class="levelbox">\n(<div class="level">[\d.]+<\/div>)\n(<div class="levelchg"[\s\S]*?<\/div>)\n<\/div>\n<\/div>\n/.exec(html);
  if (!mast) throw new Error(`${tk}: mast not in the expected shape`);
  const [, , h1, subline, figure, level, levelchg] = mast;
  const fold = /<div class="pr-fold" id="pr-fold-\w+" hidden><!-- PLAIN-READ:FOLD -->\n([\s\S]*?)\n<!-- PLAIN-READ:FOLD-END --><\/div>\n?/.exec(html);
  if (!fold) throw new Error(`${tk}: stats fold not found`);
  const sealed = /<!-- SEALED:START [^>]*-->[\s\S]*?<!-- SEALED:END -->\n?/.exec(html);
  if (!sealed) throw new Error(`${tk}: SEALED block not found`);
  const legend = /<div class="block"><h3>Legend &amp; Methodology<\/h3>\n<div class="legend">[\s\S]*?<\/div><\/div>\n/.exec(html);
  if (!legend) throw new Error(`${tk}: Legend & Methodology block not found`);
  const old = between(html, START, END);
  if (!old) throw new Error(`${tk}: no PLAIN-READ block`);
  const chart = new RegExp(`<div class="idx-chart" data-ticker="${tk}"[^>]*></div>\\n<script src="/js/index-chart.js[^"]*" defer></script>\\n`).exec(html);
  if (!chart) throw new Error(`${tk}: chart + script lines not found`);
  // the old hero photo becomes the tile image (bake() reads it off the figure before this runs): size card, same key/surface,
  // caption kept (hidden) for remark-indices' #1-constituent check
  if (!html.includes('<div class="foot">')) throw new Error(`${tk}: no .foot`);

  // cut the moved pieces (bottom-up so indices stay valid: legend, sealed, fold, old read + chart, mast)
  const cut = (h, m) => h.slice(0, m.index) + h.slice(m.index + m[0].length);
  const order = [legend, sealed, fold, { index: old.a, 0: html.slice(old.a, chart.index + chart[0].length) }, mast].sort((p, q) => q.index - p.index);
  for (const m of order) html = cut(html, m);

  const hero = `${HERO_S} — chart-first (P0-C, Oct 23 2026). Generated by tools/bake-plain-read.mjs; .level is remark-indices.mjs's (edited in place). Do not hand-edit. -->\n${HERO_CSS}\n<div class="mast hero-cf">\n<div>\n<div class="eyebrow">▮ Set Index · Pokémon</div>\n${h1}\n</div>\n<div class="levelbox">\n${level}\n<!-- LINE -->\n</div>\n</div>\n${HERO_E}\n` +
    chart[0] + `<!-- READ -->\n` + sealed[0].replace(/\n?$/, "\n") + `${TILES_S}\n<!-- TILES -->\n${TILES_E}\n`;
  html = html.slice(0, mast.index) + hero + html.slice(mast.index);
  const how = `${HOW_S}\n<details class="pr-how" id="${tk.toLowerCase()}-method"><summary>How this index works</summary><div class="pr-how-in">\n${subline}\n${levelchg}\n${WORKS_S}<!-- WORKS -->${WORKS_E}\n${fold[1]}\n${legend[0]}</div></details>\n${HOW_E}\n\n`;
  const footAt = html.indexOf('<div class="foot">');
  html = html.slice(0, footAt) + how + html.slice(footAt);
  return html;
}

function bake(html) {
  const m = /<div class="idx-chart" data-ticker="([A-Z0-9]+)"[^>]*><\/div>/.exec(html);
  if (!m) return { skip: "no chart" };
  const tk = m[1], r = idx[tk];
  if (!r || typeof r !== "object") return { skip: `${tk} not in indices.json` };
  // the tile image: the old hero figure on the first run (migrate() moves it), the tile's own slot after
  let img = null;
  const fig = /<figure class="hero-card-photo">([\s\S]*?)<\/figure>/.exec(html);
  if (fig) img = fig[1].replace(/data-card-size="hero"/, 'data-card-size="card"').replace(/\n\s+/g, "\n").trim();
  if (!html.includes(HERO_S)) html = migrate(html, tk);
  const tiles = between(html, TILES_S, TILES_E);
  const slot = /<span class="pr-ti">([\s\S]*?)<\/span>\s*<span class="pr-t[bn]"/.exec(tiles.inner);
  if (slot) img = slot[1];
  const parts = PR.bakeParts(tk, r, { accent: "var(--iac)", topImg: img, link: CHECKLIST[tk] ? { href: CHECKLIST[tk].href, k: "Your checklist", label: CHECKLIST[tk].label, sub: CHECKLIST[tk].sub } : null });
  if (!parts) return { skip: `${tk} has no read yet (pre-activation)` };
  const css = `<style id="pr-css">${PR.PR_CSS}</style>`;
  // 1 · line under the level
  const lineRe = new RegExp(`<div class="pr-line" data-plain="${tk}" data-pr="line">[\\s\\S]*?</div>|<!-- LINE -->`);
  if (!lineRe.test(html)) throw new Error(`${tk}: line slot missing`);
  html = html.replace(lineRe, () => parts.line);
  // 2 · the sentence under the chart
  const blk = `${START} — generated by tools/bake-plain-read.mjs from data/indices.json (js/plain-read.js bakeParts()). Do not hand-edit. -->\n${css}\n${parts.read}\n${END}`;
  if (html.includes(START)) html = replaceBlock(html, START, END, blk);
  else if (html.includes("<!-- READ -->")) html = html.replace("<!-- READ -->", blk);
  else throw new Error(`${tk}: read slot missing`);
  // 3 · the tiles
  html = replaceBlock(html, TILES_S, TILES_E, `${TILES_S}\n${parts.tiles}\n${TILES_E}`);
  // 4 · the toggle's data-driven text
  html = replaceBlock(html, WORKS_S, WORKS_E, `${WORKS_S}${parts.works}${WORKS_E}`);
  return { tk, html };
}

const changed = [], skipped = [];
for (const slug of PAGES) {
  const f = path.join(REPO, slug + ".html");
  if (!fs.existsSync(f)) { skipped.push(`${slug} — not on disk`); continue; }
  const before = fs.readFileSync(f, "utf8");
  const out = bake(before);
  if (!out.html) { skipped.push(`${slug} — ${out.skip}`); continue; }
  if (out.html !== before) { changed.push(slug); if (!CHECK) fs.writeFileSync(f, out.html); }
}
console.log(`plain-read ${CHECK ? "check" : "bake"}: ${changed.length} page(s) ${CHECK ? "stale" : "updated"}${changed.length ? " — " + changed.join(", ") : ""}`);
for (const s of skipped) console.log("  skip " + s);
if (CHECK && changed.length) process.exit(1);
