#!/usr/bin/env node
// build-regime.mjs — the "vintage up, modern down" read under the homepage index board (Oct 13 2026).
//
// Why (CoS, Oct 13, the week after the 30th Celebration release): the board shows 38 rows and every
// row is true, but nobody reads 38 rows. The one thing the Pokémon side of the board has been saying
// since late September is a split — the 1999–2003 WOTC/e-series indices drifting up while every
// 2024–26 set sits under 100 and keeps sliding. This block says that in two columns, from our own
// marks, with the dates the numbers actually cover. It is a measurement of our indices, not a call.
//
// What it computes (data/indices.json only — no feed, no fetch):
//   for every Pokémon ticker in the three lists below with status "live" and a numeric latest level,
//   the % change from the first history row dated on/after (latest date − 30 days) to the latest row;
//   if the history is shorter than that the earliest row is the start, and the START DATE IS PRINTED
//   — never "30 days" when the window is 14. Per group: median %, up/down count, the best vintage
//   mover and the worst modern mover with ticker, name, %, real span. MID (2019–2023 sets) is computed
//   for the data attribute only; the headline is VINTAGE vs MODERN (2024–26).
//
// Copy rules it obeys (LANE-RULES R35, Fewer/Realer): no eyebrows, one "X, not Y" sentence (the TH26
// line — printed only when TH26 is live, below 100 and vintage is actually up), plain words, dated.
//
// Placement: its own compact panel directly under the #set-indices panel (the board). The indexboard
// markers themselves sit inside a <tbody>, so the block cannot go literally after HOME:indexboard:END
// without being foster-parented out of the table by the browser — it goes after that panel's close.
// Machine-owned: everything between <!-- HOME:regime:START --> and <!-- HOME:regime:END --> is
// replaced on re-run; the markers are inserted once if absent. Fully baked — no JS, no layout shift.
// audit-terminal's home-prerender check treats it like every other HOME panel (balanced, non-empty,
// carries a digit), so the block must never bake empty: with too little data it refuses and exits 2.
//
// Usage:  node tools/build-regime.mjs            writes index.html
//         node tools/build-regime.mjs --dry      prints the block, writes nothing
//         node tools/build-regime.mjs --check    prints the computed numbers + block, writes nothing, exit 1 if
//                                                index.html does not already carry this exact block (stale bake)
// Re-run after every Monday/Thursday re-mark (tools/remark-indices.mjs) — build-home.mjs does not touch this block.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const CHECK = process.argv.includes("--check");
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");

const START = "<!-- HOME:regime:START -->";
const END = "<!-- HOME:regime:END -->";
const BOARD_END = "<!-- HOME:indexboard:END -->";
const ANCHOR_AFTER_BOARD = '<div class="grid2 top">'; // the first block after the board panel closes
const WINDOW_DAYS = 30;

// The groups (CoS, Oct 13). A ticker missing from indices.json, not live, or without a numeric level is skipped
// and named in the --check / stderr output — it is never padded.
const GROUPS = {
  vintage: { label: "WOTC-era", years: "1999–2003", tickers: ["BS99", "JU99", "FO99", "TR00", "NG00", "NDC01", "NR01", "ND02", "AQ03", "SK03", "BS1E", "BSSL", "JU1E", "FO1E", "TR1E", "NG1E", "NDC1E", "NR1E", "ND1E"] },
  modern: { label: "modern", years: "2024–26", tickers: ["PB26", "CR26", "AH26", "PRIS25", "DR25", "PF25", "TH26", "SSP24", "MEG25", "SV151"] },
  mid: { label: "mid", years: "2019–2023", tickers: ["TU19", "EVS21", "CZ23", "HF19", "CEL21"] },
};
const TH = "TH26";

const text = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => text(s).replace(/"/g, "&quot;");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dstr = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? `${MON[+m[2] - 1]} ${+m[3]}` : ""; };
const isoMinus = (iso, days) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0, 10); };
const pct = (v, dp = 1) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(dp) + "%";
const median = (xs) => { const a = [...xs].sort((p, q) => p - q); const n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : NaN; };
const cls = (v) => (v > 0 ? "up" : v < 0 ? "dn" : "flat");
// "Base Set Index" → "Base Set"; "Scarlet & Violet 151 Set Index" → "Scarlet & Violet 151"; "Pitch Black Chase Index" → "Pitch Black"
const shortName = (n) => String(n || "").replace(/\s+(Chase|Set)\s+Index$/i, "").replace(/\s+Index$/i, "").trim();

const indices = JSON.parse(read("data/indices.json"));

// One row per usable ticker: {k, name, page, start, startLevel, end, level, chg}
function rows(list, latestDate) {
  const out = [], skipped = [];
  for (const k of list) {
    const t = indices[k];
    const h = (t && Array.isArray(t.history) ? t.history : []).filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date || "") && Number.isFinite(r.level)).sort((a, b) => a.date.localeCompare(b.date));
    if (!t || t.status !== "live" || !h.length) { skipped.push(`${k}: ${!t ? "not in indices.json" : t.status !== "live" ? `status ${t.status}` : "no dated numeric history"}`); continue; }
    const last = h[h.length - 1];
    const cutoff = isoMinus(latestDate, WINDOW_DAYS);
    const first = h.find((r) => r.date >= cutoff) || h[0];
    if (first === last) { skipped.push(`${k}: one mark only (${last.date})`); continue; }
    out.push({ k, name: shortName(t.name), page: t.page, start: first.date, startLevel: first.level, end: last.date, level: last.level, chg: (last.level / first.level - 1) * 100 });
  }
  return { rows: out, skipped };
}

function group(key, latestDate) {
  const g = GROUPS[key];
  const { rows: rs, skipped } = rows(g.tickers, latestDate);
  const starts = [...new Set(rs.map((r) => r.start))].sort();
  return {
    key, label: g.label, years: g.years, rows: rs, skipped,
    n: rs.length, median: median(rs.map((r) => r.chg)),
    up: rs.filter((r) => r.chg > 0).length, down: rs.filter((r) => r.chg < 0).length, flat: rs.filter((r) => r.chg === 0).length,
    startMin: starts[0], startMax: starts[starts.length - 1],
    best: rs.length ? rs.reduce((a, b) => (b.chg > a.chg ? b : a)) : null,
    worst: rs.length ? rs.reduce((a, b) => (b.chg < a.chg ? b : a)) : null,
  };
}

// "since Sep 28" when every ticker's window starts the same day; otherwise the real spread of start dates —
// never "30 days" (a ticker marked since Oct 4 has an 8-day window and the reader is told so).
const sinceText = (g) => (g.startMin === g.startMax ? `since ${dstr(g.startMin)}` : `(start dates ${dstr(g.startMin)}–${dstr(g.startMax)})`);
const upDown = (g) => `${g.up} up / ${g.down} down${g.flat ? ` / ${g.flat} flat` : ""}`;
const dir = (v) => (v > 0 ? "up" : v < 0 ? "down" : "flat");
const mover = (r) => `<a href="${attr(r.page)}">${text(r.k)} ${text(r.name)}</a> <b class="${cls(r.chg)}">${pct(r.chg)}</b>, ${dstr(r.start)} → ${dstr(r.end)}`;

const CSS = `<style>
.regime{margin:0 0 14px;padding:12px 16px 10px;border-left:2px solid var(--accent);}
.regime .rg-h{display:flex;align-items:baseline;justify-content:space-between;gap:6px 14px;flex-wrap:wrap;margin:0 0 8px;}
.regime h2{margin:0;font-family:var(--fd);font-size:20px;font-weight:800;letter-spacing:0.3px;line-height:1.1;color:var(--text-head);text-transform:none;}
.regime .rg-stamp{font-family:var(--fm);font-size:11px;color:var(--text-dim);white-space:nowrap;}
.regime .rg-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 24px;}
.regime .rg-col{min-width:0;font-family:var(--fb);font-size:13.5px;line-height:1.5;color:var(--text);overflow-wrap:anywhere;}
.regime .rg-col b{font-weight:700;}
.regime .rg-col .rg-k{font-family:var(--fd);font-size:14px;letter-spacing:0.5px;text-transform:uppercase;margin-right:6px;}
.regime .rg-col .num{font-family:var(--fm);font-size:12.5px;font-variant-numeric:tabular-nums;}
.regime .rg-col a{color:var(--accent);font-weight:700;}
.regime .rg-th{margin:8px 0 0;font-family:var(--fb);font-size:13.5px;line-height:1.5;color:var(--text);}
.regime .rg-th a{color:var(--accent);}
.regime .rg-foot{margin:8px 0 0;padding-top:6px;border-top:1px solid var(--border);font-family:var(--fm);font-size:10.5px;color:var(--text-dim);line-height:1.5;}
@media(max-width:760px){.regime{padding:11px 12px 9px;}.regime h2{font-size:18px;}.regime .rg-cols{grid-template-columns:1fr;gap:8px;}.regime .rg-stamp{white-space:normal;}}
</style>`;

function build() {
  // latest = newest live-mark date across every ticker in the three lists (the read date for the whole block)
  const all = Object.values(GROUPS).flatMap((g) => g.tickers);
  const latest = all.map((k) => indices[k]).filter((t) => t && t.status === "live" && Array.isArray(t.history)).flatMap((t) => t.history.map((r) => r.date)).filter(Boolean).sort().pop();
  if (!latest) throw new Error("no live history in data/indices.json for any listed ticker");
  const V = group("vintage", latest), M = group("modern", latest), MID = group("mid", latest);
  if (V.n < 3 || M.n < 3) throw new Error(`too few usable tickers (vintage ${V.n}, modern ${M.n}) — refusing to bake a regime read on that`);

  const th = indices[TH];
  const thLast = th && th.status === "live" && Array.isArray(th.history) ? [...th.history].filter((r) => Number.isFinite(r.level)).pop() : null;
  const thLevel = thLast ? thLast.level : null;
  const vintageUp = V.median > 0;
  // The one "X, not Y" sentence on the block (R35). Only when it is true in our data: TH26 live and under 100, vintage up.
  const thLine = thLevel != null && thLevel < 100
    ? (vintageUp
      ? `The 30th Celebration set itself (<a href="${attr(th.page)}">${TH}</a>) is at ${thLevel.toFixed(2)} — the anniversary money is going into the old cards, not the new set.`
      : `The 30th Celebration set itself (<a href="${attr(th.page)}">${TH}</a>) is at ${thLevel.toFixed(2)}.`)
    : "";

  const headline = `Vintage ${dir(V.median)}, modern ${dir(M.median)}.`;
  const data = {
    asof: latest, windowDays: WINDOW_DAYS,
    vintage: summary(V), modern: summary(M), mid: summary(MID),
    th26: thLevel != null ? { level: thLevel, date: thLast.date } : null,
  };

  const L = [];
  L.push(`${START}`);
  L.push(`<!-- regime read — vintage (1999–2003) vs modern (2024–26) Pokémon set indices, from data/indices.json history. Generated by tools/build-regime.mjs; re-run after a re-mark. Do not hand-edit. -->`);
  L.push(CSS);
  L.push(`<section class="panel regime" id="regime" aria-label="Vintage versus modern Pokémon indices" data-prices-updated="${attr(latest)}" data-regime="${attr(JSON.stringify(data))}">`);
  L.push(`  <div class="rg-h"><h2>${text(headline)}</h2><span class="rg-stamp">Pokémon set indices · marks through ${dstr(latest)}</span></div>`);
  L.push(`  <div class="rg-cols">`);
  L.push(`    <div class="rg-col"><b class="rg-k ${cls(V.median)}">Vintage</b>Our ${V.n} ${V.label} indices (${V.years}): median <span class="num ${cls(V.median)}">${pct(V.median)}</span> ${sinceText(V)}, ${upDown(V)}.<br>Best: ${mover(V.best)}.</div>`);
  L.push(`    <div class="rg-col"><b class="rg-k ${cls(M.median)}">Modern</b>Our ${M.n} ${M.label} indices (${M.years} sets): median <span class="num ${cls(M.median)}">${pct(M.median)}</span> ${sinceText(M)}, ${upDown(M)}.<br>Worst: ${mover(M.worst)}.</div>`);
  L.push(`  </div>`);
  if (thLine) L.push(`  <p class="rg-th">${thLine}</p>`);
  L.push(`  <div class="rg-foot">Set-level moves from our own sold-comp marks; dated above. The PSA 10 record prints of Sep 10 – Oct 11 are on the <a href="/gold-star-index">Gold Star &amp; Grails board</a> (GSTAR).</div>`);
  L.push(`</section>`);
  L.push(END);
  return { block: L.join("\n"), V, M, MID, latest, thLevel };
}

function summary(g) {
  return {
    n: g.n, median: +g.median.toFixed(2), up: g.up, down: g.down, flat: g.flat, start: g.startMin, startMax: g.startMax,
    best: g.best ? { k: g.best.k, chg: +g.best.chg.toFixed(2), start: g.best.start } : null,
    worst: g.worst ? { k: g.worst.k, chg: +g.worst.chg.toFixed(2), start: g.worst.start } : null,
    skipped: g.skipped,
  };
}

function place(html, block) {
  if (html.includes(START)) {
    const a = html.indexOf(START), b = html.indexOf(END, a);
    if (b === -1) throw new Error("index.html: HOME:regime:START without END");
    if (html.indexOf(START, a + 1) !== -1) throw new Error("index.html: HOME:regime:START appears twice");
    return html.slice(0, a) + block + html.slice(b + END.length);
  }
  const be = html.indexOf(BOARD_END);
  if (be === -1) throw new Error(`index.html has no ${BOARD_END}`);
  const at = html.indexOf(ANCHOR_AFTER_BOARD, be);
  if (at === -1) throw new Error(`index.html: no ${ANCHOR_AFTER_BOARD} after the index board — placement anchor moved, update ANCHOR_AFTER_BOARD`);
  // back up to the start of the anchor's line so the block keeps the file's indentation
  const ls = html.lastIndexOf("\n", at) + 1;
  const indent = html.slice(ls, at);
  return html.slice(0, ls) + block + "\n" + indent + html.slice(at);
}

const { block, V, M, MID, latest, thLevel } = build();
const html = read("index.html");
const next = place(html, block);

const show = (g) => console.error(`  ${g.key.padEnd(8)} n=${g.n} median=${pct(g.median, 2)} up=${g.up} down=${g.down} flat=${g.flat} start=${g.startMin}${g.startMax !== g.startMin ? "–" + g.startMax : ""}` +
  (g.best ? ` best=${g.best.k} ${pct(g.best.chg)} (${g.best.start}→${g.best.end})` : "") + (g.worst ? ` worst=${g.worst.k} ${pct(g.worst.chg)} (${g.worst.start}→${g.worst.end})` : "") +
  (g.skipped.length ? `\n           skipped: ${g.skipped.join("; ")}` : ""));
console.error(`build-regime: marks through ${latest}, TH26 ${thLevel == null ? "n/a" : thLevel.toFixed(2)}`);
for (const g of [V, M, MID]) { show(g); for (const r of g.rows) console.error(`           ${r.k.padEnd(6)} ${r.start}→${r.end}  ${String(r.startLevel).padStart(7)} → ${String(r.level).padStart(7)}  ${pct(r.chg, 2)}`); }

if (CHECK || DRY) {
  process.stdout.write(block + "\n");
  if (CHECK) {
    if (next === html) { console.error("build-regime --check: index.html carries this exact block (fresh)"); process.exit(0); }
    console.error(html.includes(START) ? "build-regime --check: index.html's regime block is STALE — run node tools/build-regime.mjs" : "build-regime --check: index.html has no regime block yet — run node tools/build-regime.mjs");
    process.exit(1);
  }
  process.exit(0);
}
if (next === html) { console.error("build-regime: index.html already up to date"); process.exit(0); }
fs.writeFileSync(path.join(REPO, "index.html"), next);
console.error(`build-regime: wrote index.html (${html.includes(START) ? "replaced" : "inserted"} HOME:regime block, ${block.length} bytes)`);
