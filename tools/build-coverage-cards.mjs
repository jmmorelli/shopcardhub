#!/usr/bin/env node
// build-coverage-cards.mjs — card files for demand cards that sit in NO set index (Coverage Builder, Nov 5 2026).
//
// Why: the Pokémon KB coverage scan (claude/kb/pokemon/COVERAGE.md, Oct 4 →) lists 46 cards our search cannot find —
// Mo's "shining gyarados returns nothing" ask. Mo, Jul 20: no new set-index pages for side sets. So these cards get a
// card file instead of an index: /card?id=<id>, a card-search row, a static /card-<slug> page when it clears the template's
// gate, and the same raw / PSA 9 / PSA 10 / TAG 10 page every index card has (js/card-page.js). No level, no weight.
//
// Two files, one shape (data/cards/<tk>.json + g-<tk>.json + h-<tk>.json, read by js/card-page.js and
// tools/build-card-template.mjs; tools/lib/card-files.mjs writeSearch puts them in data/card-search.json):
//   TRK   — host-less tracked cards, the hand-kept list data/coverage-cards.json. Read from PriceCharting (one item page per
//           card): raw = median of clean ungraded dated sold rows in 90 days, printed only on >= 3 sales (else "No verified
//           sale yet", never a guess) with its low–high range; graded ladder = tools/build-card-ladder.mjs (R18); monthly
//           history = PriceCharting's estimate, chart context only. Titles are filtered in memory and never stored (R17).
//   GSTAR — the Gold Star & Grails board's 35 cards (data/grails.json, written by tools/build-grails.mjs), so the board's
//           cards are searchable too (Regice ☆, the Double Crisis Team EX pair were search misses). Offline; same numbers
//           the board prints. Re-run with --gstar after every build-grails read.
//
// Usage: node tools/build-coverage-cards.mjs            read PriceCharting for TRK, write the TRK files, rebuild search
//        node tools/build-coverage-cards.mjs --gstar    write the GSTAR files from data/grails.json (no network)
//        node tools/build-coverage-cards.mjs --dry      read + print, write nothing
// Then:  node tools/build-card-template.mjs --tickers=trk,gstar · node tools/build-nav.js · the three gates.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { soldRows, medianOf } from "./league/lib.mjs";
import { ladderFromHtml, histFromHtml } from "./build-card-ladder.mjs";
import { writeSearch } from "./lib/card-files.mjs";
import { guardTicker, pcOf, holdCell } from "./lib/ladder-guard.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const DRY = args.includes("--dry"), GSTAR = args.includes("--gstar");
const TODAY = process.env.COVERAGE_TODAY || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const days = (d) => (Date.parse(TODAY) - Date.parse(d)) / 864e5;
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const readJ = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const writeJ = (f, o) => { if (!DRY) fs.writeFileSync(path.join(ROOT, f), JSON.stringify(o) + "\n"); };
const WIN = 90, MIN_N = 3;   // charter §3: fewer than 3 clean sold comps in 90 days → "No verified sale yet"
const NOT_RAW = /\blot\b|proxy|custom|reprint|psa|cgc|bgs|sgc|\btag\s?\d|graded|slab|beckett|japanese|jumbo|oversize/i;
const isFirst = (t) => /1st\s*ed|first\s*ed|\b1\.\s?ed/i.test(t);

async function get(url) {
  for (let i = 1; i <= 4; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(6000 * i); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }
  throw new Error("rate limited after 4 attempts");
}
function rawMark(html, ed) {
  const rows = soldRows(html, "used").filter((r) => !NOT_RAW.test(r.title) && (ed === "1st" ? isFirst(r.title) : !isFirst(r.title)) && days(r.date) <= WIN && days(r.date) >= 0);
  if (rows.length < MIN_N) return { m: null, n: rows.length, lo: null, hi: null, last: null };
  // lo/hi = the middle half of the sales (25th–75th percentile), so one mislabelled slab or proxy does not set the range
  const ps = rows.map((r) => r.price).sort((a, b) => a - b), last = rows.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  const q = (f) => { const i = (ps.length - 1) * f, a = Math.floor(i); return ps[a] + (ps[Math.min(a + 1, ps.length - 1)] - ps[a]) * (i - a); };
  return { m: r2(medianOf(ps)), n: rows.length, lo: r2(q(0.25)), hi: r2(q(0.75)), last: { d: last.date, p: r2(last.price) } };
}
const gOut = (lad) => ({ psa9: lad.psa9, psa10: lad.psa10, tag10: lad.tag10 });

// tools/lib/ladder-guard.mjs on every cell (the index tickers' guard), plus one rule for cards with no index behind them:
// a PSA 9 median above PriceCharting's own PSA 10 estimate is an inverted ladder (another grade's sales leaking in) → held.
function guard(tk, g, raws, h) {
  const held = guardTicker(g, raws, h);
  if (tk === "TRK") for (const [key, c] of Object.entries(g)) {
    const pc = pcOf(h[key], c.asOf), x = c.psa9;
    if (x && !x.held && x.m != null && pc && pc.v && x.m > pc.v) { held.push({ key, grade: "psa9", why: "cb-p9-over-pc10", m: x.m }); c.psa9 = holdCell(x, "cb-p9-over-pc10"); }
  }
  for (const x of held) console.log(`  ${tk} ${x.key} ${x.grade} held: ${x.why}${x.m != null ? " (" + x.m + ")" : ""}`);
}

async function buildTrk() {
  const cfg = readJ("data/coverage-cards.json").cards;
  const prev = (() => { try { return new Map(readJ("data/cards/trk.json").cards.map((c) => [c.key, c])); } catch { return new Map(); } })();
  const rows = [], g = {}, h = {}, gp = {};
  for (const c of cfg) {
    let card;
    try {
      const html = await get("https://www.pricecharting.com/game/" + c.pcPath);
      const raw = rawMark(html, c.ed), lad = ladderFromHtml(html, c.ed === "1st" ? "1st" : false, { num: String(c.num).replace(/^0+/, "") }), hist = histFromHtml(html, "2021-01");
      card = { id: "trk-" + c.key, key: c.key, num: c.num, name: c.name, set: c.set, path: c.pcPath, raw: raw.m, n30: null, wn: raw.n, win: WIN, lo: raw.lo, hi: raw.hi, rawAsOf: TODAY, w: null, q: c.q, img: "src:https://images.pokemontcg.io/" + c.img + ".png", ...(raw.m == null ? { nv: true } : {}) };
      g[c.key] = { ...gOut(lad), asOf: TODAY }; gp[c.key] = c.pcPath;
      if (hist && hist.length) h[c.key] = hist;
      console.log(`  ${(c.name + " #" + c.num).padEnd(34)} ${c.set.padEnd(26)} raw ${raw.m == null ? "no mark" : "$" + raw.m} (n${raw.n}/${WIN}d${raw.lo != null ? ` $${raw.lo}–$${raw.hi}` : ""}) · psa9 ${lad.psa9 && lad.psa9.m} · psa10 ${lad.psa10 && lad.psa10.m} · hist ${hist ? hist.length : 0}`);
    } catch (e) {
      console.error(`  ${c.name} #${c.num}: ${e.message}` + (prev.has(c.key) ? " — keeping the previous read" : " — not written this run"));
      if (prev.has(c.key)) card = prev.get(c.key);
    }
    if (card) rows.push(card);
    await sleep(1600);
  }
  rows.sort((a, b) => (b.raw || 0) - (a.raw || 0)).forEach((c, i) => { c.rank = i + 1; });
  const doc = {
    _comment: "GENERATED by tools/build-coverage-cards.mjs (Coverage Builder) — tracked cards whose set has no index on this site (list: data/coverage-cards.json). raw = median of clean ungraded PriceCharting dated sold rows in the last 90 days (wn = sales, lo/hi = their range), printed only on >= 3 sales; nv:true = fewer, the page reads No verified sale yet. No level, no weight: rank orders the list by raw only. Graded marks in g-trk.json, PriceCharting monthly history in h-trk.json.",
    ticker: "TRK", kind: "tracked", name: "Tracked cards", set: "Pokémon TCG", page: "/indices", theme: "#00ccf5", asOf: TODAY, wotc: false, ed: null, window: WIN, level: null, cards: rows,
  };
  writeJ("data/cards/trk.json", doc);
  guard("TRK", g, new Map(rows.map((c) => [c.key, c.raw])), h);
  writeJ("data/cards/g-trk.json", { _comment: "GENERATED by tools/build-coverage-cards.mjs — graded SOLD marks per tracked card, read by tools/build-card-ladder.mjs ladderFromHtml (a row counts only when its own title names the grade; R18). No titles stored.", ticker: "TRK", day: TODAY, paths: gp, cards: g });
  writeJ("data/cards/h-trk.json", { _comment: "GENERATED by tools/build-coverage-cards.mjs — PriceCharting's monthly price history per tracked card [month, ungraded, Grade 9 any grader, PSA 10]: their estimate, chart context only, never a mark.", ticker: "TRK", day: TODAY, paths: gp, cards: h });
  return rows;
}

function buildGstar() {
  const G = readJ("data/grails.json");
  const cards = G.cards.slice().sort((a, b) => ((b.raw && b.raw.m) || 0) - ((a.raw && a.raw.m) || 0));
  const g = {}, h = {}, gp = {};
  const rows = cards.map((c, i) => {
    const key = String(c.key);   // board keys ("legendmaker-90") keep the id under card-page.js's 40-character cap
    g[key] = { psa9: c.psa9, psa10: c.psa10 && c.psa10.held ? { ...c.psa10, last: null } : c.psa10, tag10: c.tag10, asOf: c.asOf }; gp[key] = c.pcPath;
    if (c.hist && c.hist.length) h[key] = c.hist;
    const r = c.raw || {};
    return { id: "gstar-" + key, key, num: String(c.num), name: c.label, set: c.set, path: c.pcPath, rank: i + 1, raw: r.m == null ? null : r.m, n30: null, wn: r.n, win: r.win, ...(r.thin ? { thin: true } : {}), rawAsOf: c.asOf || G.day, w: null, q: c.q, img: "src:" + c.img, ...(r.m == null ? { nv: true } : {}) };
  });
  writeJ("data/cards/gstar.json", {
    _comment: "GENERATED by tools/build-coverage-cards.mjs --gstar from data/grails.json (tools/build-grails.mjs) — the GSTAR Gold Star & Grails board's cards as a card file, so each is searchable and has a card page. Same figures the board prints: raw = median of clean ungraded sold rows over win days (thin below 4). A board, not an index: no level, no weight.",
    ticker: "GSTAR", kind: "board", name: "Gold Star & Grails", set: "Pokémon TCG", page: G.page || "/gold-star-index", theme: "#f5c800", asOf: G.day, wotc: false, ed: null, window: 90, level: null, cards: rows,
  });
  guard("GSTAR", g, new Map(rows.map((c) => [c.key, c.raw])), h);
  writeJ("data/cards/g-gstar.json", { _comment: "GENERATED by tools/build-coverage-cards.mjs --gstar — the board's graded ladder (tools/build-card-ladder.mjs, R18) per card; a PSA 10 the board's guard held is carried with last:null.", ticker: "GSTAR", day: G.day, paths: gp, cards: g });
  writeJ("data/cards/h-gstar.json", { _comment: "GENERATED by tools/build-coverage-cards.mjs --gstar — PriceCharting monthly history [month, ungraded, Grade 9, PSA 10] from data/grails.json: their estimate, chart context only.", ticker: "GSTAR", day: G.day, paths: gp, cards: h });
  console.log(`GSTAR: ${rows.length} board cards → data/cards/gstar.json`);
  return rows;
}

if (GSTAR) buildGstar(); else await buildTrk();
if (!DRY) { writeSearch(ROOT); console.log("data/card-search.json rebuilt"); }
