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
// Usage: node tools/buy-strip-health.mjs [--json] [--origin https://www.shopcardhub.com]
// Exit 1 if any live query returns nothing — that is a dead shelf, not a warning.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_OUT = process.argv.includes("--json");
const ORIGIN = (() => { const i = process.argv.indexOf("--origin"); return i > -1 ? process.argv[i + 1] : "https://www.shopcardhub.com"; })();

// Same filter as js/buy-strip.js — keep the two in step or the report lies.
const LOT = /\bcase\b|\blot\b|\bbundle of\b|\bpallet\b|\bbreak\b|\brandom\b/;
const XN = /(^|[^a-z0-9])(x\s?\d{1,2}|\d{1,2}\s?x)([^a-z0-9]|$)/;
const NBOX = /\b\d{1,2}\s?(box|boxes|etb|etbs|pack lot)\b/;

const cfg = JSON.parse(fs.readFileSync(path.join(REPO, "data/buy-strip.json"), "utf8"));
const live = Object.entries(cfg.pages).filter(([, v]) => v.live);

const rows = [];
for (const [slug, v] of live) {
  const req = (v.req || "").toLowerCase().split("|").filter(Boolean);
  const deny = (v.deny || "").toLowerCase().split("|").filter(Boolean);
  let row = { slug, product: v.product, raw: 0, kept: 0, low: null, title: null, state: "dead" };
  try {
    const r = await fetch(`${ORIGIN}/api/comps?q=${encodeURIComponent(v.primary.q)}&limit=50&sort=price`);
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
    if (ps.length) {
      row.low = ps[0];
      row.title = (keep.find(l => l.price === ps[0]) || {}).title || null;
      row.state = ps.length === 1 ? "thin" : "ok";
    } else {
      // raw hits that all got filtered out is a different problem from no hits at all
      row.state = row.raw ? "filtered-out" : "no-listings";
    }
  } catch (e) { row.state = "error"; row.error = e.message; }
  rows.push(row);
}

const dead = rows.filter(r => r.state === "filtered-out" || r.state === "no-listings" || r.state === "error");
const thin = rows.filter(r => r.state === "thin");

if (JSON_OUT) {
  console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), checked: rows.length, dead: dead.length, thin: thin.length, rows }, null, 1));
} else {
  console.log(`Buy-strip health — ${new Date().toISOString().slice(0, 10)} · ${rows.length} live queries · dead ${dead.length} · thin ${thin.length}`);
  for (const r of rows.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const fig = r.low == null ? "—" : "$" + r.low.toFixed(2);
    console.log(`  [${r.state.toUpperCase().padEnd(12)}] ${fig.padStart(10)} ${String(r.kept).padStart(3)} live  ${r.slug}${r.title ? "  · " + r.title.slice(0, 54) : ""}`);
  }
  if (dead.length) {
    console.log(`\n  DEAD SHELF — these pages show a buy button with nothing behind it:`);
    for (const r of dead) console.log(`    ${r.slug} (${r.state}${r.error ? ": " + r.error : ""}) — query: ${cfg.pages[r.slug].primary.q}`);
    console.log(`  Fix the query in data/buy-strip.json, re-run tools/build-buy-strip.mjs, or set live:false if the product is genuinely gone.`);
  }
}
process.exit(dead.length ? 1 : 0);
