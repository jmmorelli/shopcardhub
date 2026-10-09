#!/usr/bin/env node
// Bing snapshot — the browserless search read (ideas ledger #61, Mo "yes on Bing" 2026-10-09).
//
// WHY: Bing (with the Yahoo / DuckDuckGo results it feeds) sends most of our search visitors; Google
// indexes 3 of ~145 URLs (traffic plan Oct 9). The Growth League picks improve slots from autocomplete
// with no volumes. This job reads Bing Webmaster's own query and page stats nightly so the League and the
// CoS weekly work from measured impressions and positions.
//
// AUTH: one Bing Webmaster API key (Settings -> API Access), held ONLY as the GitHub Actions secret
// BING_WMT_KEY and passed in env. Never in a file, a doc, a log line or a prompt. No key -> the script
// prints one line and exits 0, so the GA4 snapshot it rides beside is never blocked.
//
// OUTPUT (price-data branch is PUBLIC; R32 desk note): data/bing-latest.json carries page aggregates and
// the derived `strikingDistance` list (top 30) only — never the full query table.
//
// USAGE:  BING_WMT_KEY=... node tools/bing-snapshot.mjs --out price-data/data
//         node tools/bing-snapshot.mjs --dry      (prints the requests it would make, no network)
//
// FIRST RUN CHECK: Bing documents AvgImpressionPosition per weekly bucket; if the observed median is
// > 50 the scale is read as tenths and divided by 10 (stated in `positionScale`). Verify on run #1.

import fs from "node:fs";
import path from "node:path";

const SITE = process.env.BING_SITE || "https://www.shopcardhub.com/";
const KEY = process.env.BING_WMT_KEY || "";
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith("--") ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true] : []).filter(Boolean));
const OUT = args.out || "price-data/data";
const DRY = !!args.dry;
const API = "https://ssl.bing.com/webmaster/api.svc/json";

const url = (method, extra = {}) => {
  const q = new URLSearchParams({ siteUrl: SITE, ...extra, apikey: DRY ? "<key>" : KEY });
  return `${API}/${method}?${q}`;
};
const msDate = (s) => { const m = /\/Date\((\d+)/.exec(String(s)); return m ? new Date(+m[1]).toISOString().slice(0, 10) : null; };

async function call(method, extra) {
  const u = url(method, extra);
  if (DRY) { console.log("GET", u); return []; }
  const r = await fetch(u, { headers: { "Content-Type": "application/json; charset=utf-8" } });
  if (!r.ok) throw new Error(`${method} HTTP ${r.status}`);   // never print the URL: it carries the key
  const j = await r.json();
  return Array.isArray(j?.d) ? j.d : [];
}

// Roll weekly buckets into the last N buckets per key (query or page).
function rollup(rows, keyField, buckets = 4) {
  const dates = [...new Set(rows.map((r) => msDate(r.Date)).filter(Boolean))].sort().slice(-buckets);
  const keep = new Set(dates);
  const by = new Map();
  for (const r of rows) {
    const d = msDate(r.Date); if (!keep.has(d)) continue;
    const k = r[keyField]; if (!k) continue;
    const o = by.get(k) || { key: k, impressions: 0, clicks: 0, posW: 0 };
    o.impressions += r.Impressions || 0; o.clicks += r.Clicks || 0;
    o.posW += (r.AvgImpressionPosition || 0) * (r.Impressions || 0);
    by.set(k, o);
  }
  return { dates, rows: [...by.values()].map((o) => ({ key: o.key, impressions: o.impressions, clicks: o.clicks, avgPosition: o.impressions ? o.posW / o.impressions : null })) };
}

function median(a) { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; }

async function main() {
  if (!KEY && !DRY) { console.log("bing-snapshot: BING_WMT_KEY not set — skipped (no file written)."); return; }
  const [qRows, pRows] = await Promise.all([call("GetQueryStats"), call("GetPageStats")]);
  if (DRY) return;
  const q = rollup(qRows, "Query"), p = rollup(pRows, "Query");
  const med = median(q.rows.map((r) => r.avgPosition));
  const scale = med != null && med > 50 ? 10 : 1;
  const fix = (r) => ({ ...r, avgPosition: r.avgPosition == null ? null : +(r.avgPosition / scale).toFixed(1) });
  const queries = q.rows.map(fix), pages = p.rows.map(fix);

  // Pages: path + aggregates only.
  const pageOut = pages
    .map((r) => { let pth = r.key; try { pth = new URL(r.key).pathname; } catch {} return { page: pth, impressions: r.impressions, clicks: r.clicks, avgPosition: r.avgPosition }; })
    .sort((a, b) => b.impressions - a.impressions).slice(0, 60);

  // Striking distance: >= 20 impressions over the last 4 weekly buckets at average position 4-15.
  const striking = queries
    .filter((r) => r.impressions >= 20 && r.avgPosition != null && r.avgPosition >= 4 && r.avgPosition <= 15)
    .sort((a, b) => b.impressions - a.impressions).slice(0, 30)
    .map((r) => ({ query: r.key, impressions: r.impressions, clicks: r.clicks, avgPosition: r.avgPosition }));

  const out = {
    generatedAt: new Date().toISOString(),
    source: "Bing Webmaster API (GetQueryStats, GetPageStats), weekly buckets",
    site: SITE,
    buckets: q.dates,
    positionScale: scale === 10 ? "tenths (divided by 10)" : "as reported",
    totals: { queries: queries.length, impressions: queries.reduce((s, r) => s + r.impressions, 0), clicks: queries.reduce((s, r) => s + r.clicks, 0) },
    strikingDistance: striking,
    pages: pageOut,
    note: "Public branch: top-30 striking-distance queries and page aggregates only; the full query table is never written (R32 desk note, ledger #61).",
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "bing-latest.json"), JSON.stringify(out, null, 1) + "\n");
  console.log(`bing-snapshot: ${q.dates.length} buckets · ${queries.length} queries · ${pageOut.length} pages · ${striking.length} striking-distance rows`);
}

main().catch((e) => { console.log(`bing-snapshot: failed (${e.message}) — GA4 snapshot unaffected.`); process.exitCode = 0; });
