#!/usr/bin/env node
// fanatics-stock.mjs — Idea 40 step (b)-(c) (claude/ideas/2026-09-27.md; desk Sep 28 2026, Mo: "it's go time").
//
// Run by hand from the desk (no scheduled step: adding one to the nightly Action is held for Mo). Reads price + in-stock for the fanatics.com products in data/fanatics-products.json and APPENDS one line
// per product-night to a JSONL log (default price-data/data/fanatics-stock-log.jsonl — the price-data
// branch, never a page). RENDERS NOTHING. The Oct 12 desk reads `--summary` and decides: in-stock share
// < 15% of product-nights across the tracked boxes -> no deep links, ledger "declined (stock)".
//
// Sources, in order:
//   --catalog <file.csv>  an Impact product-catalog export for the Fanatics program (preferred; Idea 40
//                         step (a) — the catalog sits behind the Impact sign-in, which is Mo's).
//   (default)             the product page itself: schema.org Offer in JSON-LD (price, availability).
// fanatics.com sits behind a bot wall; a 403 is logged as status "blocked" and the run moves on.
// This tool never retries around a block, rotates identities or solves challenges.
// Stored per line: date, id, source, status, price, inStock. No titles, no images (R17 spirit).
//
// Usage: node tools/fanatics-stock.mjs [--products data/fanatics-products.json] [--log <jsonl>]
//                                      [--catalog <csv>] [--summary] [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a = process.argv.slice(2);
const opt = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
const PRODUCTS = opt("--products", path.join(REPO, "data/fanatics-products.json"));
const LOG = opt("--log", path.join(REPO, "price-data/data/fanatics-stock-log.jsonl"));
const CATALOG = opt("--catalog", null);
const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

function readLog() {
  try { return fs.readFileSync(LOG, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; }
}

if (a.includes("--summary")) {
  const rows = readLog();
  const by = {};
  for (const r of rows) { const b = (by[r.id] ||= { nights: 0, read: 0, inStock: 0, blocked: 0, last: null }); b.nights++; if (r.status === "ok") { b.read++; if (r.inStock) b.inStock++; } if (r.status === "blocked") b.blocked++; b.last = r.d; }
  let N = 0, S = 0, R = 0;
  for (const [id, b] of Object.entries(by)) { N += b.nights; R += b.read; S += b.inStock; console.log(`${id.padEnd(36)} nights ${b.nights} · read ${b.read} · in stock ${b.inStock} · blocked ${b.blocked} · last ${b.last}`); }
  console.log(`TOTAL product-nights ${N} · read ${R} · in stock ${S} · in-stock share of READ nights ${R ? ((S / R) * 100).toFixed(1) + "%" : "n/a (nothing read)"} · kill line < 15%`);
  process.exit(0);
}

const cfg = JSON.parse(fs.readFileSync(PRODUCTS, "utf8"));
const already = new Set(readLog().filter((r) => r.d === TODAY).map((r) => r.id));

function parseCsv(txt) {
  const lines = txt.split(/\r?\n/).filter(Boolean); const split = (l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
  const head = split(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((l) => { const c = split(l); const o = {}; head.forEach((h, i) => (o[h] = c[i])); return o; });
}
const pid = (u) => (String(u).match(/\+p-(\d+)/) || [])[1] || null;

async function fromPage(p) {
  try {
    const r = await fetch(p.url, { headers: { "user-agent": "ShopCardHub-stock-check/1.0 (+https://www.shopcardhub.com/affiliate-disclosure)", "accept-language": "en-US" }, redirect: "follow" });
    if (r.status === 403 || r.status === 429) return { status: "blocked", http: r.status };
    if (!r.ok) return { status: "error", http: r.status };
    const html = await r.text();
    for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      let j; try { j = JSON.parse(m[1]); } catch { continue; }
      const items = [].concat(j["@graph"] || j);
      for (const it of items) {
        const off = [].concat(it && it.offers || [])[0];
        if (off && (off.price || off.lowPrice)) return { status: "ok", price: Number(off.price || off.lowPrice), inStock: /InStock|PreOrder/i.test(String(off.availability || "")) };
      }
    }
    return { status: "unparsed", http: r.status };
  } catch (e) { return { status: "error", err: String(e.message).slice(0, 80) }; }
}

let catalog = null;
if (CATALOG) {
  const rows = parseCsv(fs.readFileSync(CATALOG, "utf8"));
  catalog = new Map();
  for (const r of rows) { const u = r.url || r.producturl || r["product url"] || r.link || ""; const id = pid(u); if (id) catalog.set(id, r); }
}

const out = [];
for (const p of cfg.products) {
  if (already.has(p.id)) continue;
  let res;
  const c = catalog && catalog.get(pid(p.url));
  if (c) {
    const price = Number(c.currentprice || c.saleprice || c.price || c["current price"] || NaN);
    const av = String(c.stockavailability || c.availability || c["stock availability"] || c.instock || "");
    res = { status: isFinite(price) ? "ok" : "unparsed", price: isFinite(price) ? price : null, inStock: /in ?stock|true|yes|1|preorder/i.test(av) && !/out/i.test(av), src: "impact-catalog" };
  } else res = { ...(await fromPage(p)), src: "page" };
  out.push({ d: TODAY, id: p.id, src: res.src, status: res.status, http: res.http ?? null, price: res.price ?? null, inStock: res.inStock ?? null });
  await new Promise((r) => setTimeout(r, 1500)); // one request every 1.5 s — a polite reader, nothing more
}
const tally = out.reduce((t, r) => ((t[r.status] = (t[r.status] || 0) + 1), t), {});
console.log(`fanatics-stock ${TODAY}: ${out.length} products · ${JSON.stringify(tally)}`);
if (!a.includes("--dry") && out.length) { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, out.map((r) => JSON.stringify(r)).join("\n") + "\n"); }
