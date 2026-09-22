#!/usr/bin/env node
// buy-strip-health.mjs — Gengar's weekly conversion beat (Mo's directive, Sep 17 2026).
//
// site-auditor §15 proves a buy link EXISTS above the fold. It cannot prove the link
// still points at something people can buy. eBay queries rot: a product cycles out, a
// seller-title convention shifts, a negative keyword starts excluding the whole result
// set — and the strip quietly shows an empty ask while the page keeps earning nothing.
// That is the same failure as the original miss, one layer down, so it gets its own
// weekly read rather than waiting for someone to notice.
//
// Runs every live=true entry in data/buy-strip.json through the production /api/comps
// with the exact filter js/buy-strip.js applies in the browser, and reports what a
// reader would actually see.
//
// Sep 20 2026 — this read now also covers the two links added with ideas #32 and #33:
//   · CASE shelves (`case` in the config). A case link earns its place only while real
//     case supply exists; under CASE_MIN clean listings it is reported THIN and under 1
//     it is DEAD. It is also the link most likely to rot into the wrong thing, because
//     "case break"/"case hit" listings are $20 break slots that match the word "case" —
//     hence the shared filter in tools/case-shelf.mjs and the `must` phrase guard.
//   · AG links (`secondary.ag`). eBay's Authenticity Guarantee filter belongs on a link
//     only while the card it points at still trades at $200+, which is the threshold
//     eBay set in August 2026. If the median ask falls below that, the trust copy is
//     making a claim about a bracket the card has left, and the flag comes off.
//
// Usage: node tools/buy-strip-health.mjs [--json] [--origin https://www.shopcardhub.com]
// Exit 1 if any live query returns nothing — that is a dead shelf, not a warning.
// Case and AG findings are reported but do NOT fail the run: neither renders a figure,
// so a thin one is a link to fewer listings, not a wrong number on a page.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanCases, CASE_MIN } from "./case-shelf.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_OUT = process.argv.includes("--json");
const ORIGIN = (() => { const i = process.argv.indexOf("--origin"); return i > -1 ? process.argv[i + 1] : "https://www.shopcardhub.com"; })();

// Same filter as js/buy-strip.js — keep the two in step or the report lies.
const LOT = /\bcase\b|\blot\b|\bbundle of\b|\bpallet\b|\bbreak\b|\brandom\b/;
const XN = /(^|[^a-z0-9])(x\s?\d{1,2}|\d{1,2}\s?x)([^a-z0-9]|$)/;
const NBOX = /\b\d{1,2}\s?(box|boxes|etb|etbs|pack lot)\b/;

// Product LINES that are different products from one another. If one of these words is in a
// passing listing's title but NOT in the page's own product name, that listing is probably a
// sibling product the query never excluded. This is the check the tool was missing on
// 2026-09-22: it measured whether a shelf was EMPTY, never whether it held the RIGHT THING —
// and 15 of 40 listings passing the "2026 Topps Flagship Football" query were Topps HERITAGE
// Football boxes priced $199.99-$205 against a Flagship low of $199.95. The page was one sold
// listing away from printing a Heritage price under a Flagship label, and nothing would have
// said so. Same gap #32's `must` closed for case links.
const LINES = ["heritage", "chrome", "sapphire", "black", "cosmic", "inception", "finest", "bowman",
  "definitive", "museum", "pristine", "tribute", "tier one", "stadium club", "gallery", "allen",
  "update series", "series 1", "series 2", "cactus jack", "big league", "archives", "gypsy",
  "flagship"];
const lineWords = (product) => {
  const prod = String(product || "").toLowerCase();
  return { own: LINES.filter((w) => prod.includes(w)), foreign: LINES.filter((w) => !prod.includes(w)) };
};
// A listing is another product only if it names a line this page is NOT, and does not name the
// line this page IS. Without that second half the check cries wolf: "Topps Pristine Basketball
// Hobby Box ... Sealed Chrome Flagg" is a Pristine box whose title happens to say "chrome"
// (and "Flagg" is a rookie's surname). A gate that fires every Monday on a correct page gets
// ignored, which is how a real one gets missed.
const isForeign = (title, { own, foreign }) => {
  const t = String(title || "").toLowerCase();
  if (!foreign.some((w) => t.includes(w))) return false;
  return !(own.length && own.some((w) => t.includes(w)));
};

const cfg = JSON.parse(fs.readFileSync(path.join(REPO, "data/buy-strip.json"), "utf8"));
const live = Object.entries(cfg.pages).filter(([, v]) => v.live);

const rows = [];
for (const [slug, v] of live) {
  const req = (v.req || "").toLowerCase().split("|").filter(Boolean);
  const deny = (v.deny || "").toLowerCase().split("|").filter(Boolean);
  let row = { slug, product: v.product, raw: 0, kept: 0, low: null, title: null, state: "dead" };
  try {
    const r = await fetch(`${ORIGIN}/api/comps?q=${encodeURIComponent(v.primary.q)}&limit=50&sort=price${v.cat ? `&category_ids=${encodeURIComponent(v.cat)}` : ""}`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    row.raw = j.count || 0;
    const keep = (j.listings || []).filter(l => {
      const t = (l.title || "").toLowerCase();
      if (typeof l.price !== "number" || !(l.price > 0)) return false;
      if (req.length && !req.every(w => t.includes(w))) return false;
      if (deny.length && deny.some(w => t.includes(w))) return false;
      return !(LOT.test(t) || XN.test(t) || NBOX.test(t));
    }).sort((a, b) => a.price - b.price);
    let ps = keep.map(l => l.price);
    if (ps.length >= 3) {
      const mid = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
      ps = ps.filter(p => p >= mid / 5);
    }
    row.kept = ps.length;
    // Does this shelf hold the product the page names? A page that prints a dollar figure
    // with no req/deny guard has nothing stopping a sibling line from setting that figure.
    row.guard = (v.req || v.deny) ? "yes" : "none";
    const lines = lineWords(v.product);
    const priced = keep.filter(l => ps.includes(l.price));
    row.foreign = priced.filter(l => isForeign(l.title, lines));
    row.foreignPct = priced.length ? Math.round(row.foreign.length / priced.length * 100) : 0;
    if (ps.length) {
      row.low = ps[0];
      row.title = (keep.find(l => l.price === ps[0]) || {}).title || null;
      // The figure is WRONG right now: the cheapest passing listing is another product.
      const lowIsForeign = isForeign(row.title, lines);
      row.state = lowIsForeign ? "wrong-product" : ps.length === 1 ? "thin" : "ok";
    } else {
      // raw hits that all got filtered out is a different problem from no hits at all
      row.state = row.raw ? "filtered-out" : "no-listings";
    }
  } catch (e) { row.state = "error"; row.error = e.message; }
  rows.push(row);
}

// --- case shelves (idea #32) ---
const caseRows = [];
for (const [slug, v] of Object.entries(cfg.pages)) {
  if (!v.case) continue;
  const row = { slug, product: v.product, clean: 0, low: null, title: null, state: "dead" };
  try {
    const r = await fetch(`${ORIGIN}/api/comps?q=${encodeURIComponent(v.case.q)}&limit=50&sort=price`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const cc = cleanCases(j.listings, v.case.must);
    row.clean = cc.length;
    if (cc.length) { row.low = cc[0].price; row.title = cc[0].title; }
    row.state = cc.length >= CASE_MIN ? "ok" : cc.length ? "thin" : "dead";
  } catch (e) { row.state = "error"; row.error = e.message; }
  caseRows.push(row);
}

// --- Authenticity Guarantee links (idea #33) ---
const agRows = [];
for (const [slug, v] of Object.entries(cfg.pages)) {
  if (!v.secondary || !v.secondary.ag) continue;
  const row = { slug, median: null, n: 0, state: "error" };
  try {
    const r = await fetch(`${ORIGIN}/api/comps?q=${encodeURIComponent(v.secondary.q)}&limit=50`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    row.median = (j.stats || {}).median ?? null;
    row.n = (j.stats || {}).n || 0;
    row.state = row.median >= 200 ? "ok" : row.median == null ? "no-listings" : "below-threshold";
  } catch (e) { row.state = "error"; row.error = e.message; }
  agRows.push(row);
}

// --- watched tiles (hand-built shelves that publish live asks outside the strip) ---
// pokemon-30th-anniversary-2026 has a better shelf than the standard strip and must not be
// rewritten by the builder — but it was publishing asks with nothing watching them. These are
// read here so a dead or thin product on that page shows up on Monday like any other.
const tileRows = [];
for (const [slug, tiles] of Object.entries(cfg.watchTiles || {})) {
  for (const t of tiles) {
    const req = (t.req || "").toLowerCase().split("|").filter(Boolean);
    const row = { slug, cid: t.cid, product: t.product, kept: 0, low: null, state: "dead" };
    try {
      const r = await fetch(`${ORIGIN}/api/comps?q=${encodeURIComponent(t.q)}&limit=50&sort=price${t.cat ? `&category_ids=${t.cat}` : ""}`);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const keep = (j.listings || []).filter(l => {
        const x = (l.title || "").toLowerCase();
        if (typeof l.price !== "number" || !(l.price > 0)) return false;
        if (req.length && !req.every(w => x.includes(w))) return false;
        if (t.msrp && l.price > t.msrp * 8) return false;
        return !(LOT.test(x) || XN.test(x) || NBOX.test(x));
      }).sort((a, b) => a.price - b.price);
      row.kept = keep.length;
      if (keep.length) { row.low = keep[0].price; row.title = keep[0].title; row.state = keep.length < 3 ? "thin" : "ok"; }
    } catch (e) { row.state = "error"; row.error = e.message; }
    tileRows.push(row);
  }
}
const tileBad = tileRows.filter(r => r.state !== "ok");

const dead = rows.filter(r => r.state === "filtered-out" || r.state === "no-listings" || r.state === "error");
const thin = rows.filter(r => r.state === "thin");
const wrong = rows.filter(r => r.state === "wrong-product");
// Not yet wrong, but nothing is holding it right: an unguarded shelf with sibling-product
// listings in it. Report over 10% so a one-off false positive ("w/Chrome autos" on a real
// Bowman Football box) does not cry wolf every Monday.
const unguarded = rows.filter(r => r.state !== "wrong-product" && r.foreignPct >= 10);
const caseBad = caseRows.filter(r => r.state !== "ok");
const agBad = agRows.filter(r => r.state !== "ok");

if (JSON_OUT) {
  console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), checked: rows.length, dead: dead.length, thin: thin.length, wrongProduct: wrong.length, unguarded: unguarded.length, tiles: tileRows, rows, cases: caseRows, ag: agRows }, null, 1));
} else {
  console.log(`Buy-strip health — ${new Date().toISOString().slice(0, 10)} · ${rows.length} live queries · dead ${dead.length} · thin ${thin.length} · wrong-product ${wrong.length} · unguarded ${unguarded.length}`);
  for (const r of rows.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const fig = r.low == null ? "—" : "$" + r.low.toFixed(2);
    console.log(`  [${r.state.toUpperCase().padEnd(12)}] ${fig.padStart(10)} ${String(r.kept).padStart(3)} live  ${r.slug}${r.title ? "  · " + r.title.slice(0, 54) : ""}`);
  }
  if (wrong.length) {
    console.log(`\n  WRONG PRODUCT — the figure these pages print is set by a DIFFERENT product:`);
    for (const r of wrong) console.log(`    ${r.slug} — page says "${r.product}", cheapest listing is: ${r.title}`);
    console.log(`  Add the sibling line to \`deny\` (and a contiguous \`req\`) in data/buy-strip.json, re-run the builder, and re-check.`);
  }
  if (unguarded.length) {
    console.log(`\n  UNGUARDED SHELF — right today, nothing keeping it right (≥10% of priced listings are another line):`);
    for (const r of unguarded) console.log(`    ${String(r.foreignPct).padStart(3)}% ${r.guard === "none" ? "no guard " : "guarded  "} ${r.slug} — e.g. ${(r.foreign[0] || {}).title || ""}`.slice(0, 150));
  }
  if (dead.length) {
    console.log(`\n  DEAD SHELF — these pages show a buy button with nothing behind it:`);
    for (const r of dead) console.log(`    ${r.slug} (${r.state}${r.error ? ": " + r.error : ""}) — query: ${cfg.pages[r.slug].primary.q}`);
    console.log(`  Fix the query in data/buy-strip.json, re-run tools/build-buy-strip.mjs, or set live:false if the product is genuinely gone.`);
  }

  if (caseRows.length) {
    console.log(`\nCase shelves — ${caseRows.length} configured · under CASE_MIN(${CASE_MIN}) ${caseBad.length}`);
    for (const r of caseRows.sort((a, b) => a.slug.localeCompare(b.slug))) {
      const fig = r.low == null ? "—" : "$" + Math.round(r.low);
      console.log(`  [${r.state.toUpperCase().padEnd(5)}] ${fig.padStart(8)} ${String(r.clean).padStart(3)} clean  ${r.slug}${r.title ? "  · " + r.title.slice(0, 50) : ""}`);
    }
    if (caseBad.length) console.log(`  Remove the \`case\` entry for these in data/buy-strip.json and re-run the builder — a case link with nothing behind it is the failure it was added to avoid.`);
  }

  if (tileRows.length) {
    console.log(`\nWatched tiles (hand-built shelves) — ${tileRows.length} products · thin/dead ${tileBad.length}`);
    for (const r of tileRows) {
      const fig = r.low == null ? "—" : "$" + r.low.toFixed(2);
      console.log(`  [${r.state.toUpperCase().padEnd(5)}] ${fig.padStart(10)} ${String(r.kept).padStart(3)} asks  ${r.cid}  ${r.product}`);
    }
    if (tileBad.length) console.log(`  Under 3 asks the page drops the ×MSRP multiple and says "thin" — no action needed unless it goes dead.`);
  }

  if (agRows.length) {
    console.log(`\nAuthenticity-Guarantee links — ${agRows.length} configured · off-threshold ${agBad.length}`);
    for (const r of agRows.sort((a, b) => a.slug.localeCompare(b.slug))) {
      console.log(`  [${r.state.toUpperCase().padEnd(15)}] median ${String(r.median == null ? "—" : "$" + Math.round(r.median)).padStart(8)}  n=${String(r.n).padStart(3)}  ${r.slug}`);
    }
    if (agBad.length) console.log(`  Drop \`ag\` from the secondary for these — eBay authenticates single cards at $200+, and the fine print says so.`);
  }
}
process.exit(dead.length ? 1 : 0);
