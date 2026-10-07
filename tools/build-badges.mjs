#!/usr/bin/env node
// build-badges.mjs — the embeddable index badge (Ledger #52; CoS, Oct 2 2026, from the outside brief).
//
// Writes one static SVG per LIVE ticker in data/indices.json to badge/<TICKER>.svg: ticker · set name ·
// level · week move · "sold comps only" · the mark date · shopcardhub.com. Breakers and blog writers drop
// the <a><img> snippet (shown on /indices) into their page; the number stays ours and the click comes back
// to the set page with ?utm_source=badge&utm_medium=embed so GA4 counts it as a referral.
//
// Rules: every figure comes from indices.json history (the same marks the pages print); a ticker with one
// mark shows "—" for the week; status "pre" tickers get no badge; no asks, no projections. Fonts are the
// viewer's monospace/sans — an <img> SVG can't load web fonts, so nothing here depends on Barlow.
// Runs in the nightly publish step after build-release-calendar, and by hand: node tools/build-badges.mjs [--dry]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const OUT = path.join(REPO, "badge");
const idx = JSON.parse(fs.readFileSync(path.join(REPO, "data/indices.json"), "utf8"));
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function weekMove(h) {
  // last two marks at least 5 days apart; a thin ticker (one mark) shows no move
  if (!Array.isArray(h) || h.length < 2) return null;
  const last = h[h.length - 1];
  for (let i = h.length - 2; i >= 0; i--) {
    const d = (new Date(last.date) - new Date(h[i].date)) / 86400000;
    if (d >= 5 && Number.isFinite(h[i].level) && h[i].level > 0) return (last.level / h[i].level - 1) * 100;
  }
  return null;
}
const fmtDate = (iso) => { const [y, m, d] = iso.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1]} ${+d}, ${y}`; };

function svg(tk, t) {
  const h = (t.history || []).filter((r) => r && r.kind !== "divisor");   // iw-2026-10-07-1: divisor ops are not marks
  const last = h[h.length - 1];
  const level = last && Number.isFinite(last.level) ? last.level.toFixed(2) : "—";
  const mv = weekMove(h);
  const mvTxt = mv == null ? "— wk" : `${mv >= 0 ? "▲" : "▼"} ${Math.abs(mv).toFixed(1)}% wk`;
  const mvCol = mv == null ? "#7a969e" : mv >= 0 ? "#00e07a" : "#ff4d6d";
  const name = String(t.name || tk).replace(/\s+Index$/i, "");
  const date = last ? fmtDate(last.date) : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="80" viewBox="0 0 340 80" role="img" aria-label="${esc(tk)} ${esc(name)} index ${esc(level)}, ${esc(mvTxt)}, sold comps only, ShopCardHub">
  <title>${esc(tk)} · ${esc(name)} · ${esc(level)} · ${esc(mvTxt)} · sold comps only · ShopCardHub</title>
  <rect x="0.5" y="0.5" width="339" height="79" rx="4" fill="#07090c" stroke="#1e2a33"/>
  <rect x="0.5" y="0.5" width="3" height="79" fill="#00ccf5"/>
  <text x="14" y="22" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="700" fill="#00ccf5" letter-spacing="1">${esc(tk)}</text>
  <text x="14" y="39" font-family="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="11" fill="#c9d4da">${esc(name.length > 30 ? name.slice(0, 29) + "…" : name)}</text>
  <text x="14" y="68" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="9" fill="#7a969e" letter-spacing="0.5">SOLD COMPS ONLY · ${esc(date.toUpperCase())} · SHOPCARDHUB.COM</text>
  <text x="326" y="34" text-anchor="end" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="24" font-weight="700" fill="#ffffff">${esc(level)}</text>
  <text x="326" y="52" text-anchor="end" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" font-weight="700" fill="${mvCol}">${esc(mvTxt)}</text>
</svg>
`;
}

const tickers = Object.keys(idx).filter((k) => idx[k] && typeof idx[k] === "object" && k !== "_comment" && Array.isArray(idx[k].history) && idx[k].history.length && idx[k].status !== "pre");
if (!DRY) fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const tk of tickers) {
  const body = svg(tk, idx[tk]);
  const f = path.join(OUT, `${tk}.svg`);
  if (DRY) { console.log(`${tk}: ${body.length} bytes`); continue; }
  if (fs.existsSync(f) && fs.readFileSync(f, "utf8") === body) continue;
  fs.writeFileSync(f, body); n++;
}
console.log(`${tickers.length} badges, ${DRY ? "dry run" : n + " written"} → badge/<TICKER>.svg`);
