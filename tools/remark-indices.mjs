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
const marksFile = opt("--marks", null);
const DATE = opt("--date", new Date().toLocaleDateString("en-CA"));
if (!marksFile) { console.error("usage: node tools/remark-indices.mjs --marks marks.txt [--date YYYY-MM-DD] [--dry]"); process.exit(2); }

const POKE = ["PB26", "CR26", "AH26", "PRIS25", "DR25"];
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

const summary = {};

// ---- 1) indices.json ----
for (const k of POKE) {
  const ix = idx[k]; const m = marks[k] || {};
  const prevRow = ix.history[ix.history.length - 1];
  let bv = 0, remarked = 0;
  for (const b of ix.basket) {
    const np = m[b.num];
    if (typeof np === "number" && isFinite(np) && np > 0) {
      b.prevPrice = b.price; b.prevAsOf = b.asOf;
      b.price = np; b.asOf = DATE; remarked++;
    }
    bv += b.price;
  }
  bv = +bv.toFixed(2);
  const level = +(bv / ix.divisor).toFixed(2);
  const wow = (level / prevRow.level - 1) * 100;
  if (ix.history.some((h) => h.date === DATE)) throw new Error(`${k}: history already has a ${DATE} row — refusing to double-mark.`);
  ix.history.push({ date: DATE, level, basketValue: bv, divisor: ix.divisor, priced: ix.basket.length, note: "weekly re-mark" });
  summary[k] = { level, prevLevel: prevRow.level, wow, bv, remarked, n: ix.basket.length, universe: ix.universe.length };
}
idx.updated = DATE;

// ---- 2) pages ----
const stripHtml = () => {
  const chip = (t, href, on) => {
    const s = summary[t];
    return `<a class="chip${on ? " on" : ""}" href="${href}" style="text-decoration:none;"><b>${t}</b> <span style="color:var(--tx)">${s.level.toFixed(2)}</span> <span class="soon">${signed(s.wow, 1)} w/w</span></a>`;
  };
  return (active) => {
    const pages = { PB26: "/pitch-black-index", CR26: "/chaos-rising-index", AH26: "/ascended-heroes-index", PRIS25: "/prismatic-evolutions-index", DR25: "/destined-rivals-index" };
    let h = `<div class="strip">`;
    for (const t of POKE) h += chip(t, pages[t], t === active);
    h += `<a class="chip" href="/bowman-1st-chrome-index" style="text-decoration:none;"><b>BOW26</b> <span class="up">live · ask</span></a>`;
    h += `<a class="chip" href="/bowman-chrome-2026-index" style="text-decoration:none;"><b>BCB26</b> <span class="soon">pre · streets 09/09</span></a>`;
    h += `<div class="chip"><b>MEGA26</b> <span class="soon">Mega Evolution base · planned</span></div></div>`;
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
  must(/<div class="strip">[\s\S]*?<\/div><\/div>/, "strip");
  html = html.replace(/<div class="strip">[\s\S]*?<\/div><\/div>/, strip(k));

  // level + levelchg
  must(/<div class="level">[\d.]+<\/div>/, "level");
  html = html.replace(/<div class="level">[\d.]+<\/div>/, `<div class="level">${s.level.toFixed(2)}</div>`);
  must(/<div class="levelchg"[^>]*>base 100\.00 · inception ([\d/]+) · re-marked [\d/]+ · [▲▼] [+−-][\d.]+% w\/w<\/div>/, "levelchg");
  html = html.replace(/<div class="levelchg"[^>]*>base 100\.00 · inception ([\d/]+) · re-marked [\d/]+ · [▲▼] [+−-][\d.]+% w\/w<\/div>/,
    `<div class="levelchg" data-prices-updated="${DATE}">base 100.00 · inception $1 · re-marked ${mdy(DATE)} · ${s.wow >= 0 ? "▲" : "▼"} ${signed(s.wow, 1)} w/w</div>`);

  // stats
  const prices = ix.basket.map((b) => b.price);
  const w = prices.map((p) => p / s.bv);
  const sortedW = [...w].sort((a, b) => b - a);
  const top2 = (sortedW[0] + sortedW[1]) * 100;
  const hhi = w.reduce((a, x) => a + x * x, 0);
  const n = w.length, mean = 1 / n;
  const s2 = w.reduce((a, x) => a + (x - mean) ** 2, 0) / n, s3 = w.reduce((a, x) => a + (x - mean) ** 3, 0) / n;
  const skew = s3 / Math.pow(s2, 1.5);
  const sinceInc = (s.level / 100 - 1) * 100;
  const rep = (re, to, what) => { must(re, what); html = html.replace(re, to); };
  rep(/<div class="k">Top 2 Weight<\/div><div class="v acc">[\d.]+%/, `<div class="k">Top 2 Weight</div><div class="v acc">${top2.toFixed(1)}%`, "top2");
  rep(/<div class="k">Effective Holdings<\/div><div class="v">[\d.]+/, `<div class="k">Effective Holdings</div><div class="v">${(1 / hhi).toFixed(1)}`, "eff");
  rep(/<div class="k">Basket Value<\/div><div class="v">\$[\d,]+/, `<div class="k">Basket Value</div><div class="v">$${Math.round(s.bv).toLocaleString("en-US")}`, "bv");
  rep(/<div class="k">Weight Skew<\/div><div class="v gold">[+−-][\d.]+/, `<div class="k">Weight Skew</div><div class="v gold">${skew >= 0 ? "+" : "−"}${Math.abs(skew).toFixed(2)}`, "skew");
  rep(/<div class="k">Since Inception<\/div><div class="v (?:grn|rd)">[+−-][\d.]+%/, `<div class="k">Since Inception</div><div class="v ${sinceInc >= 0 ? "grn" : "rd"}">${signed(sinceInc, 2)}`, "sinceInc");

  // holdings table rows
  const rowRe = /<tr class="hrow" data-i="(\d+)"[^>]*>[\s\S]*?<\/tr>\n?/g;
  const blocks = [...html.matchAll(rowRe)];
  if (blocks.length !== ix.basket.length) throw new Error(`${k}: ${blocks.length} rows on page vs ${ix.basket.length} basket cards`);
  const rows = blocks.map((mm) => {
    let blk = mm[0];
    const numM = blk.match(/<span class="cn">#(\w+)\//); if (!numM) throw new Error(`${k}: row without #num`);
    const b = byNum.get(numM[1]); if (!b) throw new Error(`${k}: page row #${numM[1]} not in basket`);
    const cell = blk.match(/<td class="num">\$([\d,.]+)<\/td><td class="num wt">[\d.]+%<\/td><td class="num">(<span[^>]*>[^<]*<\/span>)<\/td>/);
    if (!cell) throw new Error(`${k}: price cells not found for #${b.num}`);
    const oldPx = +cell[1].replace(/,/g, "");
    let launch = cell[2];
    const lm = launch.match(/([▲▼]) ([\d.]+)%/);
    if (lm) {
      const oldPct = (lm[1] === "▲" ? 1 : -1) * +lm[2] / 100;
      const base = oldPx / (1 + oldPct);
      const np = (b.price / base - 1) * 100;
      launch = `<span style="color:${clr(np)}">${pctTxt(np)}</span>`;
    }
    const wt = (b.price / s.bv) * 100;
    blk = blk.replace(cell[0], `<td class="num">${money(b.price)}</td><td class="num wt">${wt.toFixed(1)}%</td><td class="num">${launch}</td>`);
    if (b.asOf === DATE) blk = blk.replace(/<td class="num dim2">\d\d-\d\d<\/td>/, `<td class="num dim2">${mmdd(DATE)}</td>`);
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
  rep(/\*Holdings as of \d\d\/\d\d\/\d\d/, `*Holdings as of ${mdy(DATE)}`, "holdings stamp");

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
    c.px = b.price; c.wt = +((b.price / s.bv) * 100).toFixed(1); c.asof = b.asOf;
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
fs.writeFileSync(idxPath, JSON.stringify(idx, null, 1));
for (const [f, h] of Object.entries(pageEdits)) fs.writeFileSync(f, h);
console.log(`written: data/indices.json + ${Object.keys(pageEdits).length} pages (${DATE})`);
