#!/usr/bin/env node
// remark-indices.mjs — Monday STEP 3.6 weekly re-mark for the Pokémon set indices
// (PB26 / CR26 / AH26 / PRIS25 / DR25). Written Sep 7 2026 so the re-mark is a
// mechanical, repeatable step instead of an ad-hoc script each week.
//
// INPUT  --marks <file>   lines of  TICKER:num=price,num=price,...
//                         (PriceCharting console "used" = ungraded sold read, pulled
//                         via Chrome from /console/<set>?sort=highest-price&cursor=N)
//        --date YYYY-MM-DD (default today, local)
//        --dry             compute + print, write nothing
//
// WHAT IT DOES (per ticker, honoring data/indices.json _comment rules):
//   indices.json: basket[i].prevPrice/prevAsOf <- price/asOf (movers strip contract,
//                 Aug 31), price/asOf <- new mark; history += {date, level, ...}.
//                 base / inception / divisor / past history rows are NEVER touched.
//                 A card with no new mark carries its last mark (asOf stays old).
//   <page>.html:  level, levelchg (re-marked date + w/w), stats (top-2 weight,
//                 effective holdings, basket value, weight skew, since inception),
//                 the holdings table (prices, weights, since-launch %, as-of, re-ranked
//                 by price with rank/data-i/openPop renumbered), the TOTAL row, the
//                 holdings-as-of stamp, the ROC block, the CARDS popup array, the
//                 ticker strip (all live tickers), and data-prices-updated (STAMP RULE).
//
// It refuses to run if a ticker's page structure doesn't match (better to fail loudly
// than to ship a half-updated page).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const DRY = args.includes("--dry");
// --bake (Sep 30 2026, the release-date rebase): re-bake every chase page from data/indices.json as it stands — no marks,
// no history row, indices.json untouched. The strip, level, levelchg, stats, table and CARDS all follow the file.
const BAKE = args.includes("--bake") || args.includes("--cap") || args.includes("--rebalance");   // both bake like --bake after capping
// --rebalance (alias --cap; Oct 7 2026, Mo: "it should only be 25% of the index" + "the only time they can exceed the 25% cap
// is if they run up before a quarterly index rebalance … this is what ETFs do"): reset every chase basket's weights to the
// 25% single-card cap as a logged, level-neutral divisor adjustment (no marks, no history row), then re-bake the pages.
// Run it at the QUARTERLY REBALANCE — the first Monday of Jan/Apr/Jul/Oct, after that Monday's re-mark (LANE-RULES cadence).
// Weekly re-marks leave the weights alone, so a card that runs between rebalances can sit above 25% until the next one.
const CAPOP = args.includes("--cap") || args.includes("--rebalance");
const marksFile = opt("--marks", BAKE || CAPOP ? "/dev/null" : null);
const DATE = opt("--date", new Date().toLocaleDateString("en-CA"));
if (!marksFile) { console.error("usage: node tools/remark-indices.mjs --marks marks.txt [--date YYYY-MM-DD] [--dry]"); process.exit(2); }

const POKE = ["PB26", "CR26", "AH26", "PRIS25", "DR25", "PF25"];  // PF25 added 2026-09-21 — first re-mark branch below
const idxPath = path.join(REPO, "data/indices.json");
const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));

// ---- parse marks ----
const marks = {};
for (const line of fs.readFileSync(marksFile, "utf8").split("\n")) {
  const t = line.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf(":"); const k = t.slice(0, i); const rest = t.slice(i + 1);
  marks[k] = marks[k] || {};
  for (const kv of rest.split(",")) { const [n, p] = kv.split("="); if (n && p) marks[k][n.trim()] = +p; }
}

const mmdd = (d) => d.slice(5, 7) + "-" + d.slice(8, 10);
const mdy = (d) => d.slice(5, 7) + "/" + d.slice(8, 10) + "/" + d.slice(2, 4);
const money = (x) => "$" + x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctTxt = (p, dec = 1) => (p >= 0 ? "▲ " : "▼ ") + Math.abs(p).toFixed(dec) + "%";
const signed = (p, dec = 2) => (p >= 0 ? "+" : "−") + Math.abs(p).toFixed(dec) + "%";
const clr = (p) => (p >= 0 ? "var(--gn)" : "var(--rd)");  // pages define --gn (not --grn) for green
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// ---- the chase cap (Oct 7 2026): weights w so no card exceeds CAP of Σ(price·w); single leg only, w ≤ 1 ----
const CAP = 0.25;
const wOf = (b) => (b.w == null ? 1 : b.w);
const bvOf = (basket) => +basket.reduce((a, b) => a + b.price * wOf(b), 0).toFixed(2);
function capWeights(basket) {
  basket.forEach((b) => { b.w = 1; });
  for (let it = 0; it < 200; it++) {
    let changed = false;
    const T = basket.reduce((a, b) => a + b.price * b.w, 0);
    for (const b of basket) { if ((b.price * b.w) / T > CAP + 1e-9) { b.w = +((CAP * T) / b.price).toFixed(6); changed = true; } }
    if (!changed) break;
  }
  basket.forEach((b) => { if (b.w >= 1) b.w = 1; });
}
// re-cap a ticker without moving its level: new divisor = new basket value / current level; logged
function recap(ix, k, why) {
  const before = ix.divisor;
  const bv0 = ix.basket.reduce((a, b) => a + b.price * wOf(b), 0);
  capWeights(ix.basket);
  const bv = bvOf(ix.basket);
  const bv1 = ix.basket.reduce((a, b) => a + b.price * b.w, 0);
  const after = +(before * (bv1 / bv0)).toFixed(6);   // level-neutral by construction (no rounding through the 2-dp level)
  ix.cap = CAP; ix.capRule = "25% single-card cap, reset at each quarterly rebalance (first Monday of Jan/Apr/Jul/Oct); weights drift with prices in between (Mo, Oct 7 2026)"; ix.reconstitution = { cadence: "quarterly rebalance, first Monday of Jan/Apr/Jul/Oct, after that Monday's re-mark; announced the Monday before", next: "2027-01-04" };
  if (Math.abs(after - before) > 1e-6) {
    ix.divisor = after;
    ix.divisorLog = ix.divisorLog || [];
    ix.divisorLog.push({ date: DATE, before, after, why });
  }
  return bv;
}

const summary = {};

// ---- 1) indices.json ----
for (const k of POKE) {
  const ix = idx[k]; const m = marks[k] || {};
  if (BAKE) {
    const h = ix.history, L = h[h.length - 1], P = h.length > 1 ? h[h.length - 2] : L;
    if (CAPOP) recap(ix, k, DATE === "2026-10-07" ? "CAP (Mo 2026-10-07): 25% single-card cap applied; weights reset, level unchanged." : "quarterly rebalance: weights reset to the 25% single-card cap; level unchanged.");
    const bv = bvOf(ix.basket);
    summary[k] = { level: L.level, prevLevel: P.level, wow: (L.level / P.level - 1) * 100, bv, remarked: 0, n: ix.basket.length, universe: ix.universe.length, date: L.date };
    continue;
  }
  const prevRow = ix.history[ix.history.length - 1];
  let bv = 0, remarked = 0;
  for (const b of ix.basket) {
    const np = m[b.num];
    if (typeof np === "number" && isFinite(np) && np > 0) {
      b.prevPrice = b.price; b.prevAsOf = b.asOf;
      b.price = np; b.asOf = DATE; remarked++;
    }
  }
  bv = bvOf(ix.basket);
  const level = +(bv / ix.divisor).toFixed(2);
  const wow = (level / prevRow.level - 1) * 100;
  if (ix.history.some((h) => h.date === DATE)) throw new Error(`${k}: history already has a ${DATE} row — refusing to double-mark.`);
  ix.history.push({ date: DATE, level, basketValue: bv, divisor: ix.divisor, priced: ix.basket.length, note: "weekly re-mark" });
  summary[k] = { level, prevLevel: prevRow.level, wow, bv, remarked, n: ix.basket.length, universe: ix.universe.length };
}
if (!BAKE && !CAPOP) idx.updated = DATE;

// ---- 2) pages ----
const stripHtml = () => {
  const chip = (t, href, on) => {
    const s = summary[t];
    return `<a class="chip${on ? " on" : ""}" href="${href}" style="text-decoration:none;"><b>${t}</b> <span style="color:var(--tx)">${s.level.toFixed(2)}</span> <span class="soon">${signed(s.wow, 1)} w/w</span></a>`;
  };
  return (active) => {
    // Page paths come from indices.json (x.page), like the sector loop below — the hardcoded map missed PF25 and
    // shipped href="undefined" on Sep 28 (audit-2026-09-28-3). A ticker with no page throws instead of linking /undefined.
    const pages = Object.fromEntries(POKE.map((t) => { const pg = idx[t] && idx[t].page; if (!pg) throw new Error(`indices.json: ${t} has no page`); return [t, pg]; }));
    let h = `<div class="strip">`;
    for (const t of POKE) h += chip(t, pages[t], t === active);
    // every other live ticker (sector-model set indices, the Bowman trio …) straight from indices.json — never hardcoded
    for (const t of Object.keys(idx)) {
      const x = idx[t]; if (!x || typeof x !== "object" || POKE.includes(t) || x.status !== "live" || !(x.history || []).length) continue;
      // iw-2026-10-03-1: a Mon/Thu ticker's "w/w" is vs the newest mark ≥ 5 days back (the badge rule), never the 3–4-day prior mark
      const last = x.history[x.history.length - 1];
      let prev = null; for (let i = x.history.length - 2; i >= 0; i--) if ((new Date(last.date) - new Date(x.history[i].date)) / 86400000 >= 5) { prev = x.history[i]; break; }
      const w = prev ? (last.level / prev.level - 1) * 100 : null;
      h += `<a class="chip" href="${x.page}" style="text-decoration:none;"><b>${t}</b> <span style="color:var(--tx)">${last.level.toFixed(2)}</span>${w == null ? "" : ` <span class="soon">${signed(w, 1)} w/w</span>`}</a>`;
    }
    h += `</div>`;
    return h;
  };
};
const strip = stripHtml();

const pageEdits = {};
for (const k of POKE) {
  const ix = idx[k]; const s = summary[k];
  const file = path.join(REPO, ix.page.replace(/^\//, "") + ".html");
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const must = (re, what) => { if (!re.test(html)) throw new Error(`${k}: page pattern not found: ${what}`); };
  const byNum = new Map(ix.basket.map((b) => [String(b.num), b]));

  // strip
  // The strip holds only <a> chips, so it ends at its FIRST </div>. (Sep 30 2026: the old /…?<\/div><\/div>/ ran past the
  // strip once the page's strip stopped sitting flush against its wrapper's close, and swallowed the hero + level block.)
  const STRIP = /<div class="strip">(?:(?!<\/div>)[\s\S])*<\/div>/;
  must(STRIP, "strip");
  html = html.replace(STRIP, () => strip(k));

  // level + levelchg
  must(/<div class="level">[\d.]+<\/div>/, "level");
  html = html.replace(/<div class="level">[\d.]+<\/div>/, `<div class="level">${s.level.toFixed(2)}</div>`);
  // Two shapes: a page that has been re-marked before ("re-marked <date> · ▲ +x% w/w") and a page still at
  // inception ("marked <date> · w/w accrues from first re-mark" — PF25 shipped Sep 18 2026 in that shape and the
  // Monday lane could not mark it for a week because only the first shape was accepted).
  // Sep 30 2026 rebase: base 100 is the set's RELEASE month (or first reliable month), live marks since inception.
  // Accepts the old inception shapes and the new one; always writes the new one.
  const LEVELCHG = /<div class="levelchg"[^>]*>(?:base 100\.00 · inception|100 = [^·<]+ · live since) ([\d/]+) · (?:re-marked [\d/]+ · [▲▼] [+−-][\d.]+% w\/w|marked [\d/]+ · w\/w accrues from first re-mark)<\/div>/;
  must(LEVELCHG, "levelchg");
  const MD = s.date || DATE;
  const baseLbl = ix.baseDate ? `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+ix.baseDate.slice(5, 7) - 1]} ${ix.baseDate.slice(0, 4)} (${ix.baseRule !== "release" ? "first reliable month" : String(ix.releaseDate || "").slice(0, 7) === ix.baseDate ? "release month" : "first month after release"})` : "inception";
  html = html.replace(LEVELCHG, (all, inc) =>
    `<div class="levelchg" data-prices-updated="${MD}">100 = ${baseLbl} · live since ${inc} · re-marked ${mdy(MD)} · ${s.wow >= 0 ? "▲" : "▼"} ${signed(s.wow, 1)} w/w</div>`);

  // method note: the divisor now moves at every capped mark (Oct 7 2026), so the printed figure follows the file
  html = html.replace(/(<b>INDEX LEVEL<\/b> — Σ\(sold mark × weight\) ÷ divisor \()[\d.]+\)/, (_, a) => `${a}${ix.divisor})`);
  // stats
  const w = ix.basket.map((b) => (b.price * wOf(b)) / s.bv);
  const sortedW = [...w].sort((a, b) => b - a);
  const top2 = (sortedW[0] + sortedW[1]) * 100;
  const hhi = w.reduce((a, x) => a + x * x, 0);
  const n = w.length, mean = 1 / n;
  const s2 = w.reduce((a, x) => a + (x - mean) ** 2, 0) / n, s3 = w.reduce((a, x) => a + (x - mean) ** 3, 0) / n;
  const skew = s3 / Math.pow(s2, 1.5);
  const sinceInc = (s.level / 100 - 1) * 100;
  // NOTE: replacement is a function so "$1,712.21" is never read as a capture-group reference
  // (Sep 7 bug: DR25 TOTAL row shipped as "<group 1>,712.21").
  const rep = (re, to, what) => { must(re, what); html = html.replace(re, (...m) => to.replace(/\$(\d)(?![\d,.])/g, (_, g) => m[+g] ?? "$" + g)); };
  rep(/<div class="k">Top 2 Weight<\/div><div class="v acc">[\d.]+%/, `<div class="k">Top 2 Weight</div><div class="v acc">${top2.toFixed(1)}%`, "top2");
  rep(/<div class="k">Effective Holdings<\/div><div class="v">[\d.]+/, `<div class="k">Effective Holdings</div><div class="v">${(1 / hhi).toFixed(1)}`, "eff");
  rep(/<div class="k">Basket Value<\/div><div class="v">\$[\d,]+/, `<div class="k">Basket Value</div><div class="v">$${Math.round(s.bv).toLocaleString("en-US")}`, "bv");
  rep(/<div class="k">Weight Skew<\/div><div class="v gold">[+−-][\d.]+/, `<div class="k">Weight Skew</div><div class="v gold">${skew >= 0 ? "+" : "−"}${Math.abs(skew).toFixed(2)}`, "skew");
  // At inception the cell is class "v" with a bare "0.00%" (PF25's Sep 18 template); after the first re-mark it is grn/rd.
  rep(/<div class="k">Since (?:Inception|Release|Base)<\/div><div class="v(?: (?:grn|rd))?">[+−-]?[\d.]+%/, `<div class="k">Since ${ix.baseRule === "release" ? "Release" : "Base"}</div><div class="v ${sinceInc >= 0 ? "grn" : "rd"}">${signed(sinceInc, 2)}`, "sinceInc");

  // holdings table rows
  const rowRe = /<tr class="hrow" data-i="(\d+)"[^>]*>[\s\S]*?<\/tr>\n?/g;
  const blocks = [...html.matchAll(rowRe)];
  if (blocks.length !== ix.basket.length) throw new Error(`${k}: ${blocks.length} rows on page vs ${ix.basket.length} basket cards`);
  const rows = blocks.map((mm) => {
    let blk = mm[0];
    const numM = blk.match(/<span class="cn">#(\w+)\//); if (!numM) throw new Error(`${k}: row without #num`);
    const b = byNum.get(numM[1]); if (!b) throw new Error(`${k}: page row #${numM[1]} not in basket`);
    const cell = blk.match(/<td class="num">\$([\d,.]+)<\/td><td class="num wt">[\d.]+%<\/td><td class="num"(?: data-launch="([\d.]+)")?>(<span[^>]*>[^<]*<\/span>)<\/td>/);
    if (!cell) throw new Error(`${k}: price cells not found for #${b.num}`);
    const oldPx = +cell[1].replace(/,/g, "");
    // Since Launch = vs the card's INCEPTION sold mark, carried on the cell as data-launch (Sep 26 2026 fix: the
    // old cell-chained method drifted with rounding and, on PB26/CR26, inherited a pre-launch ask base — Darkrai
    // #116 read ▼57.7% against a $456 ask while the launch sold read was $257). No attribute → leave the cell.
    let launch = cell[3], launchAttr = "";
    const base = cell[2] ? +cell[2] : null;
    if (base && base > 0) {
      const np = (b.price / base - 1) * 100;
      launch = Math.abs(np) < 0.05 ? `<span style="color:var(--dim)">0.0%</span>` : `<span style="color:${clr(np)}">${pctTxt(np)}</span>`;
      launchAttr = ` data-launch="${base.toFixed(2)}"`;
    }
    const wt = ((b.price * wOf(b)) / s.bv) * 100;
    blk = blk.replace(cell[0], `<td class="num">${money(b.price)}</td><td class="num wt">${wt.toFixed(1)}%</td><td class="num"${launchAttr}>${launch}</td>`);
    if (!BAKE && b.asOf === DATE) blk = blk.replace(/<td class="num dim2">\d\d-\d\d<\/td>/, `<td class="num dim2">${mmdd(DATE)}</td>`);
    return { b, blk };
  });
  rows.sort((a, c) => c.b.price - a.b.price);
  const rebuilt = rows.map((r, i) => {
    let blk = r.blk;
    blk = blk.replace(/<tr class="hrow" data-i="\d+" style="[^"]*">/, `<tr class="hrow" data-i="${i}" style="${i < 5 ? "background:var(--p2);border-left:2px solid var(--iac);" : "border-left:2px solid transparent;"}">`);
    blk = blk.replace(/<td class="rk">\d+<\/td>/, `<td class="rk">${i + 1}</td>`);
    blk = blk.replace(/openPop\(\d+\)/, `openPop(${i})`);
    return blk;
  }).join("");
  const first = blocks[0].index, last = blocks[blocks.length - 1].index + blocks[blocks.length - 1][0].length;
  html = html.slice(0, first) + rebuilt + html.slice(last);

  // TOTAL row + holdings stamp
  rep(/(<td class="card" style="color:var\(--th\);font-weight:700;">TOTAL — ALL HOLDINGS<\/td><td><\/td><td class="num">)\$[\d,.]+/, `$1${money(s.bv)}`, "total row");
  rep(/\*Holdings as of \d\d\/\d\d\/\d\d/, `*Holdings as of ${mdy(s.date || DATE)}`, "holdings stamp");

  // ROC block: ($from → $to) per listed card; from stays, to = current
  const rocRe = /<span style="color:var\(--th\)">([^<]+)<\/span><span style="color:var\(--(?:grn|gn|rd)\)">[▲▼] [\d.]+% <span style="color:var\(--dim\);font-size:9px">\(\$([\d,.]+) → \$[\d,.]+\)<\/span><\/span>/g;
  let rocN = 0;
  html = html.replace(rocRe, (all, label, from) => {
    const cand = ix.basket.filter((b) => (b.name + " " + b.rarity) === label);
    if (cand.length !== 1) throw new Error(`${k}: ROC label '${label}' matches ${cand.length} basket cards`);
    const b = cand[0]; const f = +from.replace(/,/g, ""); const p = (b.price / f - 1) * 100; rocN++;
    return `<span style="color:var(--th)">${label}</span><span style="color:${clr(p)}">${pctTxt(p)} <span style="color:var(--dim);font-size:9px">($${from} → $${b.price.toFixed(2)})</span></span>`;
  });

  // hero caption weight (only PB26 prints one)
  html = html.replace(/(<figcaption class="hero-card-cap">#1 constituent &middot; <b>[^<]*<\/b> &middot; )[\d.]+% of the index/, `$1${(sortedW[0] * 100).toFixed(1)}% of the index`);

  // CARDS popup array
  const cm = html.match(/var CARDS = (\[[\s\S]*?\]);\n/);
  if (!cm) throw new Error(`${k}: CARDS array not found`);
  const cards = JSON.parse(cm[1]);
  if (cards.length !== ix.basket.length) throw new Error(`${k}: CARDS ${cards.length} vs basket ${ix.basket.length}`);
  for (const c of cards) {
    const num = (c.num.match(/#(\w+)\//) || [])[1]; const b = byNum.get(num);
    if (!b) throw new Error(`${k}: CARDS entry ${c.num} not in basket`);
    c.px = b.price; c.wt = +(((b.price * wOf(b)) / s.bv) * 100).toFixed(1); c.asof = b.asOf;
  }
  cards.sort((a, c) => c.px - a.px);
  html = html.replace(cm[0], `var CARDS = ${JSON.stringify(cards)};\n`);

  // top constituent check (hero image is hand-picked; flag if #1 changed)
  const top = rows[0].b; const heroM = before.match(/hero-card-cap">(?:#1 constituent|Top constituent[^<]*) &middot; <b>([^<]*)<\/b>/);
  summary[k].top = `${top.name} ${top.rarity} #${top.num}`; summary[k].hero = heroM ? heroM[1] : "?";
  summary[k].rocRows = rocN; summary[k].top2 = top2; summary[k].eff = 1 / hhi; summary[k].skew = skew;
  pageEdits[file] = html;
}

// ---- report ----
for (const k of POKE) {
  const s = summary[k];
  console.log(`${k}: ${s.prevLevel.toFixed(2)} -> ${s.level.toFixed(2)} (${signed(s.wow, 2)} w/w) basket $${s.bv.toFixed(2)} re-marked ${s.remarked}/${s.n} (universe ${s.universe}) top2 ${s.top2.toFixed(1)}% eff ${s.eff.toFixed(1)} skew ${s.skew.toFixed(2)} ROC rows ${s.rocRows} | #1 ${s.top}${s.hero && !s.hero.startsWith(s.top.split(" #")[0]) ? "  ** HERO IMAGE IS " + s.hero + " — check **" : ""}`);
}
if (DRY) { console.log("(dry run — nothing written)"); process.exit(0); }
if (!BAKE || CAPOP) fs.writeFileSync(idxPath, JSON.stringify(idx, null, 1));
for (const [f, h] of Object.entries(pageEdits)) fs.writeFileSync(f, h);
console.log(`written: data/indices.json + ${Object.keys(pageEdits).length} pages (${DATE})`);
// The CHASE strip (tools/build-chase-strip.mjs, Sep 26 2026) is baked from each page's CARDS array — re-bake it so the
// served HTML matches the new marks (the strip's inline script also re-reads CARDS on load, so this is for crawlers).
try { const { execFileSync } = await import("node:child_process"); console.log(execFileSync("node", [path.join(REPO, "tools/build-chase-strip.mjs")], { encoding: "utf8" }).trim()); } catch (e) { console.warn("chase strip re-bake failed: " + (e.message || e)); }
// Card files + card search (Oct 4 2026, build E): the chase cards' /card pages and search rows carry the index's raw mark,
// so they are rewritten from the new marks in the same run (tools/build-chase-cards.mjs; offline, never blocks the re-mark).
try { const { writeChaseCards } = await import("./build-chase-cards.mjs"); const n = writeChaseCards(REPO); console.log(`chase card files: ${Object.entries(n).map(([k, v]) => `${k} ${v}`).join(" · ")}`); } catch (e) { console.warn("chase card files failed: " + (e.message || e)); }
