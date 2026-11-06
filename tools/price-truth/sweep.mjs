#!/usr/bin/env node
// tools/price-truth/sweep.mjs — the PRICE TRUTH DESK's daily sweep (charter: Project doc claude/agents/price-truth/CHARTER.md).
// Goal: live wrong-money signals = 0. A wrong-money signal is a price, mark, graded cell, multiple, "cheaper at / below the
// mark / deal" label or "biggest move" on the site that the evidence does not support.
//
// Deterministic, read-only, no network: run it against a fresh clone of main (cwd = repo root, or --root <dir>). It reads the
// same data files the pages render from and runs the eight checks of the Nov 3 2026 first sweep (SWEEP-SCRIPTS.md c1–c5b,
// generalised to the guards that shipped since — ladder-guard `held`, move-guard `heldMove`, tcg-pull stale/high/name guards):
//   1 one-card moves · 2 1st Edition vs Unlimited · 3 graded inversions + medians on < 3 sales · 4 thin marks narrated as
//   "recent sales" · 5 shop-price residuals · 6 raw vs TCGplayer / PriceCharting > 2x · 7 placeholders (R35) · 8 deals /
//   auctions > 40% under the mark.
// Each finding is rated: RED = a visitor would act on a wrong number (fix today) · AMBER = misleading · GREEN = cosmetic.
// Prints the counts and the worst examples per check; --json <file> writes every finding. Exit code 1 when any RED is found,
// 0 otherwise (2 on a read error).
//
// Usage: node tools/price-truth/sweep.mjs [--root <repo>] [--json <out.json>] [--top N] [--quiet]
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ROOT = path.resolve(opt("--root", process.cwd()));
const OUT = opt("--json", null);
const TOP = +opt("--top", 6);
const QUIET = args.includes("--quiet");
const R = "RED", A = "AMBER", G = "GREEN";

const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const has = (p) => fs.existsSync(path.join(ROOT, p));
const r2 = (v) => (v == null ? v : Math.round(v * 100) / 100);
const figOf = (x) => (x && !x.held ? (x.m != null ? x.m : null) : null);   // a printed graded median (held cells print nothing)

const findings = [];
const add = (check, sev, id, msg, data = {}) => findings.push({ check, sev, id, msg, ...data });

// ---------------- load ----------------
let IDX, CARDS = {}, BYID = new Map(), G_ = {}, H = {}, TCG = {};
try {
  IDX = rd("data/indices.json");
  for (const f of fs.readdirSync(path.join(ROOT, "data/cards"))) {
    if (!f.endsWith(".json")) continue;
    const tk = f.slice(0, -5);
    if (tk.startsWith("g-")) { G_[tk.slice(2)] = rd(`data/cards/${f}`); continue; }
    if (tk.startsWith("h-")) { try { H[tk.slice(2)] = rd(`data/cards/${f}`); } catch (e) { } continue; }
    const C = rd(`data/cards/${f}`); if (!Array.isArray(C.cards)) continue;
    CARDS[tk] = C; for (const c of C.cards) BYID.set(c.id, { c, C, tk });
  }
  if (has("data/tcg")) for (const f of fs.readdirSync(path.join(ROOT, "data/tcg"))) if (f.endsWith(".json")) TCG[f.slice(0, -5)] = rd(`data/tcg/${f}`);
} catch (e) { console.error("sweep: read error:", e.message); process.exit(2); }

// PriceCharting monthly ungraded for a card (h-<tk>.json), latest month within 75 days of the read; context only.
function pcRaw(tk, key, asOf) {
  const h = H[tk]; if (!h) return null;
  const rows = (h.cards && h.cards[key]) || h[key];
  if (!Array.isArray(rows)) return null;
  const r = rows.filter((x) => Array.isArray(x) && x[1] > 0).pop();
  if (!r) return null;
  if (asOf && (Date.parse(asOf) - Date.parse(r[0] + "-01")) / 864e5 > 75) return null;
  return r[1];
}

// ---------------- 1 · one-card moves ----------------
// A card that moved > 50% on fewer than 5 sales and drives > 50% of its index's last move. RED when the new mark is also
// outside 0.5–2x PriceCharting's monthly ungraded value (unsupported by the reference); AMBER otherwise. Cards the move-guard
// holds (heldMove) carry price = prevPrice and never show here.
function moves(label, page, basket, div, tk) {
  const contrib = [];
  for (const x of basket) {
    const w = x.w == null ? 1 : x.w || 0, p = x.price, pp = x.prevPrice;
    if (p == null || pp == null || !(pp > 0) || x.heldMove) continue;
    contrib.push([x, ((p - pp) * w) / div]);
  }
  const tot = contrib.reduce((s, [, c]) => s + c, 0);
  for (const [x, c] of contrib) {
    const chg = x.price / x.prevPrice - 1, n = x.n30, share = tot ? c / tot : 0;
    if (Math.abs(chg) > 0.5 && (n == null || n < 5) && share > 0.5) {
      const pc = pcRaw(tk.toLowerCase(), String(x.key || x.num), x.asOf);
      const off = pc ? x.price / pc : null;
      const sev = off != null && (off > 2 || off < 0.5) ? R : A;
      add(1, sev, `${label}#${x.num}`, `${x.name} #${x.num} ${x.prevPrice}→${x.price} (${(chg * 100).toFixed(0)}%, n${n ?? "?"}) = ${(share * 100).toFixed(0)}% of ${label}'s move${pc ? `; PC ${pc} (${off.toFixed(2)}x)` : ""}`, { page });
    }
  }
}
for (const [tk, v] of Object.entries(IDX)) {
  if (!v || typeof v !== "object" || !Array.isArray(v.basket) || !v.divisor || v.status === "retired") continue;
  moves(tk, v.page, v.basket, v.divisor, tk);
  for (const [sk, sv] of Object.entries(v.sub || {})) if (sv && Array.isArray(sv.basket) && sv.divisor) moves(`${tk}.${sk}`, v.page, sv.basket, sv.divisor, tk);
}

// 1b · corrections narrated as moves (Nov 5 2026; IW iw-2026-11-05-2 class): a ±50% material move whose PRIOR mark sat outside
// 1.5x of PriceCharting's ungraded value and whose NEW mark sits inside it is the mark catching up, not the card moving. The
// re-read tag (tools/lib/move-guard.mjs rereadOf / tagReread, written at save/bake) keeps it out of the home movers and the plain
// read. RED when such a row carries no reread tag (it would be narrated as a "biggest move"); GREEN per tagged row.
{
  const { rereadOf } = await import(path.join(ROOT, "tools/lib/move-guard.mjs"));
  for (const [tk, v] of Object.entries(IDX)) {
    if (!v || typeof v !== "object" || !Array.isArray(v.basket) || v.status !== "live") continue;
    for (const b of v.basket) {
      const t = rereadOf(ROOT, v.ticker || tk, b); if (!t) continue;
      if (b.reread) add(1, G, `reread-${tk}#${b.num}`, `${tk} ${b.name} #${b.num} $${b.prevPrice}→$${b.price} tagged re-read (prior outside 1.5x of PC $${t.pc} ${t.pcMonth}); not narrated`, { page: v.page });
      else add(1, R, `reread-${tk}#${b.num}`, `${tk} ${b.name} #${b.num} $${b.prevPrice}→$${b.price} is a correction (prior outside 1.5x of PC $${t.pc} ${t.pcMonth}) with no reread tag — narrated as a move`, { page: v.page });
    }
  }
}

// ---------------- 2 · 1st Edition vs Unlimited ----------------
const PAIRS = [["bs1e", "bs99"], ["ju1e", "ju99"], ["fo1e", "fo99"], ["tr1e", "tr00"], ["ng1e", "ng00"], ["ndc1e", "ndc01"], ["nr1e", "nr01"], ["nd1e", "nd02"], ["bssl", "bs99"]];
let pairsCompared = 0;
for (const [a, b] of PAIRS) {
  if (!CARDS[a] || !CARDS[b]) continue;
  const bm = new Map(CARDS[b].cards.map((x) => [x.num, x]));
  for (const x of CARDS[a].cards) {
    const y = bm.get(x.num);
    if (!y || x.raw == null || y.raw == null || x.screened || y.screened) continue;
    pairsCompared++;
    const r = x.raw / y.raw;
    if (r < 1) add(2, x.raw >= 20 ? A : G, x.id, `${a.toUpperCase()} ${x.name} #${x.num} $${x.raw} (n${x.n30}) below ${b.toUpperCase()} $${y.raw} (n${y.n30}) — ${r.toFixed(2)}x`, { page: CARDS[a].page });
    else if (a !== "bssl" && (x.holo || y.holo) && r < 1.5 && x.raw >= 50) add(2, G, x.id, `${a.toUpperCase()} holo ${x.name} #${x.num} only ${r.toFixed(2)}x Unlimited ($${x.raw} n${x.n30} vs $${y.raw})`, { page: CARDS[a].page });
  }
}

// ---------------- 3 · graded inversions + medians on < 3 sales ----------------
// On the printed figures only (held cells print "No verified sale"). The card page prints a median only at n >= 3
// (js/card-page.js), desks and should-i-grade the same; the GSTAR board prints its own cells (data/grails.json).
let gradedCells = 0, n2Stored = 0;
for (const [tk, Gf] of Object.entries(G_)) {
  const C = CARDS[tk]; if (!C || !Gf.cards) continue;
  const cm = new Map(C.cards.map((x) => [String(x.key ?? x.num), x]));
  for (const [k, g] of Object.entries(Gf.cards)) {
    const c = cm.get(String(k)) || {}; const raw = c.raw;
    const pr = (cell) => { const v = figOf(cell); return v != null && cell.n >= 3 ? v : null; };   // printed on the card page
    for (const lab of ["psa9", "psa10", "tag10"]) { const x = g[lab]; if (x && x.m != null) { gradedCells++; if (!x.held && (x.n || 0) < 3) n2Stored++; } }
    const p9 = pr(g.psa9), p10 = pr(g.psa10), t10 = pr(g.tag10);
    const id = c.id || `${tk}-${k}`, nm = `${tk.toUpperCase()} ${c.name || k} #${c.num || k}`;
    if (p9 && p10 && p10 < p9) add(3, R, id, `${nm} PSA 10 $${p10} < PSA 9 $${p9} (both printed)`, { page: C.page });
    if (p9 && t10 && t10 < p9) add(3, R, id, `${nm} TAG 10 $${t10} < PSA 9 $${p9} (both printed)`, { page: C.page });
    if (p10 && raw && p10 < raw) add(3, R, id, `${nm} PSA 10 $${p10} < raw $${raw}`, { page: C.page });
    if (p9 && raw && p9 < raw) add(3, raw >= 50 && p9 < 0.75 * raw ? A : G, id, `${nm} PSA 9 $${p9} < raw $${raw}`, { page: C.page });
    if (p10 && p9 && p9 >= 20 && p10 > 15 * p9) add(3, A, id, `${nm} PSA 10 $${p10} = ${(p10 / p9).toFixed(0)}x PSA 9 $${p9}`, { page: C.page });
  }
}
// GSTAR board: build-grails.mjs gcell() prints any non-held median; R18 needs >= 3 dated sales for a median
if (has("data/grails.json")) {
  const GR = rd("data/grails.json");
  for (const c of GR.cards || []) {
    const p9 = figOf(c.psa9) ?? (c.psa9 && !c.psa9.held && c.psa9.last ? c.psa9.last.p : null);
    const p10 = figOf(c.psa10) ?? (c.psa10 && !c.psa10.held && c.psa10.last ? c.psa10.last.p : null);
    if (p9 && p10 && p10 < p9) add(3, R, `gstar-${c.key}`, `GSTAR ${c.label} PSA 10 $${p10} < PSA 9 $${p9}`, { page: "/gold-star-index" });
  }
}

// GSTAR page as baked: a graded cell labelled "N sales · <window>" with N < 3 is a median on fewer than 3 sales (R18)
if (has("gold-star-index.html")) {
  const t = fs.readFileSync(path.join(ROOT, "gold-star-index.html"), "utf8");
  const re = /\$([\d,]+)<small>([12]) sales · (\d+d)<\/small>/g; let m;
  while ((m = re.exec(t))) add(3, A, `gstar-n${m[2]}-${m[1]}`, `/gold-star-index prints a graded median $${m[1]} on ${m[2]} sales (${m[3]}) — R18 needs 3`, { page: "/gold-star-index" });
}

// ---------------- 4 · thin marks narrated as "recent sales" ----------------
// The sector page's chase strip prints its top 3 cards as "recent sales" under "a median of recent dated sales (not one
// sale)" (tools/build-sector-index.mjs), and the plain read names the top card "on recent sales". A top-3 card marked on
// fewer than 3 sales there is a thin mark narrated as a market price → RED. Other thin rows are disclosed in the table
// ("thin · N sales") → AMBER count only.
let thinRows = 0;
for (const [tk, v] of Object.entries(IDX)) {
  if (!v || !Array.isArray(v.basket) || v.model !== "sector" || v.status === "retired") continue;
  const top3 = v.basket.filter((b) => b.price != null && (b.w == null || b.w > 0)).sort((a, b) => b.price - a.price).slice(0, 3);
  for (const b of top3) if (b.n30 != null && b.n30 < 3) add(4, R, `${tk}#${b.num}`, `${tk} strip/plain read: ${b.name} #${b.num} $${b.price} narrated as "recent sales" on ${b.n30} sale(s)`, { page: v.page });
}
// Classic Collection reprints (CEL21 / TH26) printed without the reprint label (KB GAPS P42): the strip/table/plain read must say
// "Classic Collection reprint" (tools/lib/classic-collection.mjs sets cc:true). RED when a top-3 card is an unlabelled reprint.
try {
  const { isClassicCollection } = await import(path.join(ROOT, "tools/lib/classic-collection.mjs"));
  for (const tk of ["CEL21", "TH26"]) {
    const v = IDX[tk]; if (!v || !Array.isArray(v.basket)) continue;
    const top3 = v.basket.filter((b) => b.price != null && (b.w == null || b.w > 0)).sort((a, b) => b.price - a.price).slice(0, 3);
    for (const b of v.basket) if (isClassicCollection(tk, b.num, b.name) && !b.cc) add(4, top3.includes(b) ? R : A, `${tk}#${b.num}`, `${tk} ${b.name} #${b.num} $${b.price} is a Classic Collection reprint printed without the label`, { page: v.page });
  }
} catch (e) { add(4, A, "cc-lib", `classic-collection check skipped: ${e.message}`); }
for (const [tk, C] of Object.entries(CARDS)) {
  if (C.kind === "chase") continue;
  for (const c of C.cards) { const n = c.wn ?? c.n30; if (c.raw != null && !c.screened && n != null && n < 3) thinRows++; }
}
if (thinRows) add(4, A, "thin-rows", `${thinRows} sector rows marked on fewer than 3 sales (disclosed "thin · N sales" in the table)`);

// ---------------- 5 · shop-price residuals (data/tcg) ----------------
const VINT = new Set(["bs99", "bssl", "bs1e", "ju99", "ju1e", "fo99", "fo1e", "tr00", "tr1e", "ng00", "ng1e", "ndc01", "ndc1e", "nr01", "nr1e", "nd02", "nd1e", "aq03", "sk03"]);
let tcgMarks = 0;
for (const [tk, T] of Object.entries(TCG)) {
  const vint = VINT.has(tk) || !!(T.summary && T.summary.vintage);
  const pids = new Map(), vhi = { hi: [], lo: [] };
  for (const [cid, x] of Object.entries(T.marks || {})) {
    tcgMarks++;
    const c = (BYID.get(cid) || {}).c || {};
    const { m, lo, s, d } = x;
    if (x.pid != null) { if (!pids.has(x.pid)) pids.set(x.pid, []); pids.get(x.pid).push(cid); }
    if (m > 0 && lo > 0 && lo > 1.25 * m) add(5, R, cid, `${tk.toUpperCase()} ${c.name || cid}: shop $${m} but cheapest listing $${lo} (unbuyable)`, { page: (BYID.get(cid) || {}).C?.page });
    if (!vint && m >= 5 && lo > 0 && m > 1.75 * lo && (!(s > 0) || m > 1.75 * s)) add(5, R, cid, `${tk.toUpperCase()} ${c.name || cid}: shop $${m} > 1.75x cheapest $${lo} and sold $${s}`);
    if (!vint && d != null && d <= -0.03 && Math.abs(d) <= 0.6 && lo > 0 && s > 0 && lo >= s) add(5, R, cid, `${tk.toUpperCase()} ${c.name || cid}: "cheaper at the shop" chip but cheapest listing $${lo} >= eBay mark $${s}`);
    if (vint && m >= 20 && lo > 0 && m > 1.5 * lo) { const k = s > 0 && m > 1.5 * s ? "hi" : "lo"; vhi[k].push(`${(c.name || cid)} $${m} vs listing $${lo}`); }
    if (s > 0 && x.sAsOf && c.rawAsOf && x.sAsOf < c.rawAsOf && Math.abs(s / c.raw - 1) > 0.25 && !vint && d != null && Math.abs(d) <= 0.6) add(5, G, cid, `${tk.toUpperCase()} ${c.name || cid}: spread chip computed vs an older mark ($${s} ${x.sAsOf} vs $${c.raw} ${c.rawAsOf})`);
  }
  // vintage market far above the cheapest listing: R38 amendment shows the price with no venue call (Mo's open question in
  // BLOCKED, "Vintage shop price — show it at all?") — one line per ticker, not one per card
  if (vhi.hi.length) add(5, A, `${tk}-vint-hi`, `${tk.toUpperCase()}: ${vhi.hi.length} vintage shop prices > 1.5x both the cheapest listing and our sold mark (e.g. ${vhi.hi.slice(0, 2).join("; ")})`);
  if (vhi.lo.length) add(5, G, `${tk}-vint-lo`, `${tk.toUpperCase()}: ${vhi.lo.length} vintage shop prices > 1.5x the cheapest listing, in line with our sold mark`);
  for (const [pid, ids] of pids) if (ids.length > 1) add(5, R, ids.join("+"), `${tk.toUpperCase()}: one TCGplayer product ${pid} matched to ${ids.length} cards (${ids.join(", ")})`);
}

// ---------------- 6 · raw vs TCGplayer / PriceCharting > 2x ----------------
for (const [tk, T] of Object.entries(TCG)) {
  if (VINT.has(tk)) continue;
  for (const [cid, x] of Object.entries(T.marks || {})) {
    const c = (BYID.get(cid) || {}).c; if (!c || c.raw == null || !(x.m > 0) || c.raw < 20) continue;
    const r = x.m / c.raw; if (r > 2 || r < 0.5) add(6, A, cid, `${tk.toUpperCase()} ${c.name} #${c.num}: raw $${c.raw} vs TCGplayer $${x.m} (${r.toFixed(2)}x)`);
  }
}
for (const [tk, C] of Object.entries(CARDS)) {
  for (const c of C.cards) {
    if (c.raw == null || c.raw < 20 || c.screened) continue;
    const pc = pcRaw(tk, String(c.key ?? c.num), c.rawAsOf); if (!pc) continue;
    const r = c.raw / pc; if (r > 2 || r < 0.5) add(6, A, c.id, `${tk.toUpperCase()} ${c.name} #${c.num}: raw $${c.raw} vs PriceCharting monthly $${pc} (${r.toFixed(2)}x)`, { page: C.page });
  }
}

// ---------------- 7 · placeholders (R35) ----------------
const HTML = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html") && f !== "card-dungeon.html");
const BAD = [[/\$\$\d/, R, "$$"], [/\$NaN|NaN%|\$undefined|\$null|>NaN</, R, "NaN/undefined price"], [/\$-\d/, A, "negative price"]];
for (const f of HTML) {
  const t = fs.readFileSync(path.join(ROOT, f), "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
  for (const [re, sev, lab] of BAD) { const m = t.match(re); if (m) add(7, sev, f, `${f}: ${lab} → "${t.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, " ")}"`); }
}

// ---------------- 8 · deals / auctions > 40% under the mark ----------------
if (has("data/feed/deals-latest.json")) {
  const D = rd("data/feed/deals-latest.json");
  for (const r of D.rows || []) {
    const id = `${r.cardId}:${r.grade}`;
    // the yardstick must still be a printed figure: a graded mark the ladder now holds, or a raw mark that moved, voids the row
    let cur = null;
    if (r.kind === "pokemon") {
      const hit = BYID.get(r.cardId);
      if (hit) {
        if (r.grade === "raw") cur = hit.c.raw;
        else { const g = G_[hit.tk] && G_[hit.tk].cards && G_[hit.tk].cards[String(hit.c.key ?? hit.c.num)]; const x = g && g[r.grade]; cur = x ? (x.held ? 0 : x.m) : null; }
      }
    }
    if (cur === 0) add(8, R, id, `/deals ${r.tk} ${r.card} #${r.num} ${r.grade}: yardstick $${r.mark} is now HELD by the ladder guard`);
    else if (cur != null && r.mark && Math.abs(cur / r.mark - 1) > 0.25) add(8, A, id, `/deals ${r.tk} ${r.card} #${r.num} ${r.grade}: row mark $${r.mark} vs current $${cur}`);
    if (r.disc != null && r.disc <= -0.4) add(8, A, id, `/deals ${r.tk} ${r.card} #${r.num} ${r.grade}: $${r.total} = ${(r.disc * 100).toFixed(0)}% vs mark $${r.mark} (${r.markBasis || ""})`);
  }
}
if (has("data/feed/auctions-latest.json")) {
  const AU = rd("data/feed/auctions-latest.json");
  const deep = (AU.rows || []).filter((r) => r.mark && r.total != null && r.total / r.mark - 1 <= -0.4);
  if (deep.length) add(8, A, "auctions", `/auctions: ${deep.length} of ${(AU.rows || []).filter((r) => r.mark).length} marked rows show > 40% under our price (early bids, not prices)`);
}

// ---------------- report ----------------
const NAMES = { 1: "one-card moves", 2: "1st Ed vs Unlimited", 3: "graded inversions / n<3", 4: "thin marks as recent sales", 5: "shop-price residuals", 6: "raw vs TCG/PC >2x", 7: "placeholders", 8: "deals/auctions >40% under" };
const cnt = (sev, ch) => findings.filter((f) => f.sev === sev && (ch == null || f.check === ch)).length;
const red = cnt(R), amber = cnt(A), green = cnt(G);
if (!QUIET) {
  console.log(`PRICE TRUTH sweep · ${ROOT} · indices.updated ${IDX.updated || "?"}`);
  console.log(`scope: ${Object.keys(CARDS).length} card files · ${gradedCells} graded cells (${n2Stored} stored on n<3) · ${tcgMarks} TCG marks · ${pairsCompared} edition pairs · ${HTML.length} html`);
  for (let ch = 1; ch <= 8; ch++) {
    const fs_ = findings.filter((f) => f.check === ch);
    console.log(`\n[${ch}] ${NAMES[ch]}: RED ${cnt(R, ch)} · AMBER ${cnt(A, ch)} · GREEN ${cnt(G, ch)}`);
    for (const sev of [R, A]) for (const f of fs_.filter((f) => f.sev === sev).slice(0, TOP)) console.log(`  ${sev === R ? "🔴" : "🟡"} ${f.msg}${f.page ? "  " + f.page : ""}`);
  }
  console.log(`\nLIVE WRONG-MONEY SIGNALS (RED): ${red} · AMBER ${amber} · GREEN ${green}`);
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ root: ROOT, updated: IDX.updated, red, amber, green, findings }, null, 1));
process.exit(red ? 1 : 0);
