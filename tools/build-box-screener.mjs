#!/usr/bin/env node
// build-box-screener.mjs — the sortable box screener on /best-hobby-boxes-2026 (Box Desk, Oct 20 2026;
// spec claude/handoffs/box-screener-2026-10-20.md §3, Phase 2; Mo-approved, PIVOT Amendment 1).
//
// Reads data/boxes.json (one row per product × format, sold medians from SportsCardsPro) and data/indices.json
// (index baskets), computes per row $/card, $/pack, $/hit, vs MSRP and days out, the hit-price stats for boxes
// whose set we index (n ≥ 20 priced cards, weight-0 rows excluded), and the fit score for each published profile
// (rank-based, weights in data/boxes.json → profiles). Writes two generated blocks into the page:
//   <!-- BOXSCREENER:START --> … <!-- BOXSCREENER:END -->  controls + the baked table (crawlable) + inline JSON
//   <!-- BOXNOTES:START --> … <!-- BOXNOTES:END -->        the per-box notes (data/boxes.json → note)
// /js/box-screener.js does sorting, filters, profiles and the phone column picker from the inline JSON.
// eBay is a buy link only, never a mark. Never hand-edit inside the markers: edit data/boxes.json and re-run.
// Idempotent: a second run prints "unchanged".
//
// Usage: node tools/build-box-screener.mjs [--dry] [--print]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const PRINT = process.argv.includes("--print");
const PAGE = "best-hobby-boxes-2026.html";
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const boxes = JSON.parse(read("data/boxes.json"));
const indices = JSON.parse(read("data/indices.json"));
const MIN_N = 20; // stats print only on 20+ priced cards (spec §3B)
const PHONE_ROWS = 6; // rows shown on a phone before "Show all" (keeps the page under 8 screens, R35)

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const d0 = (iso) => new Date(iso + "T00:00:00Z");
const dShort = (iso) => { const d = d0(iso); return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const dLong = (iso) => `${dShort(iso)}, ${d0(iso).getUTCFullYear()}`;
const span = (a, b) => (a.slice(0, 7) === b.slice(0, 7) ? `${dShort(a)}–${d0(b).getUTCDate()}` : `${dShort(a)}–${dShort(b)}`);
const money = (v) => (v == null ? null : "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const pct = (v, dp = 1) => (v == null ? null : (v * 100).toFixed(dp) + "%");
const r2 = (v, dp = 2) => (v == null || !isFinite(v) ? null : +v.toFixed(dp));
const days = (a, b) => Math.round((d0(b) - d0(a)) / 864e5);
const EPN = "LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001";
const buyHref = (row) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(row.ebayQuery)}&${EPN}&customid=${row.id}`;

// ---------- index stats (population moments over the basket's 30-day sold medians) ----------
function idxStats(ticker) {
  const ix = indices[ticker];
  if (!ix) return null;
  const rows = (ix.basket || []).filter((c) => c.w !== 0 && c.price > 0);
  const base = { ticker, name: ix.name, set: ix.set, page: ix.page, n: rows.length, firstAutos: /1st Auto/i.test(ix.name || "") };
  if (rows.length < MIN_N) return { ...base, ok: false };
  const p = rows.map((c) => c.price).sort((a, b) => a - b);
  const n = p.length, sum = p.reduce((s, v) => s + v, 0), mean = sum / n;
  const median = n % 2 ? p[(n - 1) / 2] : (p[n / 2 - 1] + p[n / 2]) / 2;
  const m2 = p.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const m3 = p.reduce((s, v) => s + (v - mean) ** 3, 0) / n;
  const m4 = p.reduce((s, v) => s + (v - mean) ** 4, 0) / n;
  const top = rows.slice().sort((a, b) => b.price - a.price);
  const mark = rows.map((c) => c.asOf).filter(Boolean).sort().at(-1);
  return {
    ...base, ok: true, prices: p, median, mean, sum, lottery: mean / median, skew: m3 / m2 ** 1.5, kurt: m4 / m2 ** 2 - 3,
    topShare: top[0].price / sum, top5Share: top.slice(0, 5).reduce((s, c) => s + c.price, 0) / sum,
    top: `${top[0].num} ${top[0].name}`, topPrice: top[0].price, mark,
  };
}

// ---------- per-row metrics ----------
const READ = boxes.read;
const rows = boxes.rows.map((r) => {
  const price = r.sold.median;
  const cards = r.packs && r.cardsPerPack ? r.packs * r.cardsPerPack : null;
  const hitsN = r.hits?.total ?? null;
  const idx = r.indexTicker ? idxStats(r.indexTicker) : null;
  const perHit = hitsN ? price / hitsN : null;
  const ck = r.checklist || {};
  const firstAutosPerBox = ck.bowman === false ? 0 : r.hits?.autos && ck.autos && ck.firstAutos ? r.hits.autos * (ck.firstAutos / ck.autos) : null;
  const ok = idx && idx.ok;
  const m = {
    price, cards, perCard: cards ? price / cards : null, perPack: r.packs ? price / r.packs : null, perHit,
    vsMsrp: r.msrp?.value ? price / r.msrp.value - 1 : null, days: days(r.releaseDate, READ),
    firstAutosPerBox, firstAutoMedOverPerHit: ok && idx.firstAutos && perHit ? idx.median / perHit : null,
    skew: ok ? idx.skew : null, lottery: ok ? idx.lottery : null, topShare: ok ? idx.topShare : null,
    variety: r.variety?.looks ?? null, checklistSize: ck.base ?? null, baseShare: null,
    guaranteedHit: hitsN ? (hitsN >= 1 ? 1 : 0) : null, msrpHistory: null,
    kAbove: ok && perHit ? idx.prices.filter((v) => v >= perHit).length : null,
  };
  return { r, idx, m };
});

// ---------- fit scores (rank-based, published weights) ----------
const profiles = boxes.profiles.list;
function rankOf(metric, sign) {
  const have = rows.map((x, i) => [i, x.m[metric]]).filter(([, v]) => v != null && isFinite(v));
  const out = new Array(rows.length).fill(null); // null = the box has no figure for this metric
  if (have.length < 2) return out;
  for (const [i, v] of have) {
    let worse = 0, eq = 0;
    for (const [j, w] of have) { if (j === i) continue; if (sign * w < sign * v) worse++; else if (w === v) eq++; }
    out[i] = (worse + eq / 2) / (have.length - 1);
  }
  return out;
}
// v2 (Box Desk rev 2 after the CoS review; rebuilt Oct 22 2026): a box is scored on a goal only when EVERY figure
// that goal weighs is on file and it passes the goal's GATE; the score is the weighted average of its ranks, 0–100
// (ranks are taken over every box that has the figure, so a score means the same thing whichever boxes qualify).
// Best fit = the highest-scoring content goal (Prospector, Collector, Ripper); Budget and Set builder only when no
// content goal applies; no goal at all → "Needs data" (muted badge, no score).
const cheapestThird = (metric) => {
  const have = rows.map((x) => x.m[metric]).filter((v) => v != null && isFinite(v)).sort((a, b) => a - b);
  const cut = have[Math.ceil(have.length / 3) - 1];
  return (v) => v != null && v <= cut;
};
const cheapPrice = cheapestThird("price"), cheapCard = cheapestThird("perCard");
const GATES = {
  prospector: (x) => x.m.firstAutosPerBox > 0,
  collector: (x) => x.m.variety != null,
  ripper: (x) => x.idx && x.idx.ok && (x.idx.lottery >= 3 || x.idx.topShare >= 0.25),
  "set-builder": (x) => cheapCard(x.m.perCard),
  budget: (x) => cheapPrice(x.m.price) || x.m.price <= 200,
};
const scores = {}; // profileId → [score per row] (null = not scored)
const coverage = {}; // profileId → { onFile, qualify }
for (const p of profiles) {
  if (p.needsMonths) { scores[p.id] = rows.map(() => null); coverage[p.id] = { onFile: 0, qualify: 0 }; continue; }
  if (!GATES[p.id]) throw new Error(`profile ${p.id} has no gate`);
  const acc = rows.map(() => 0), cov = rows.map(() => 0), tot = p.weights.reduce((s, [, w]) => s + Math.abs(w), 0);
  for (const [metric, w] of p.weights) rankOf(metric, Math.sign(w)).forEach((v, i) => { if (v != null) { acc[i] += Math.abs(w) * v; cov[i] += Math.abs(w); } });
  const onFile = rows.map((x, i) => cov[i] === tot);
  const qual = rows.map((x, i) => onFile[i] && !!GATES[p.id](x));
  scores[p.id] = acc.map((a, i) => (qual[i] ? Math.round((100 * a) / tot) : null));
  coverage[p.id] = { onFile: onFile.filter(Boolean).length, qualify: qual.filter(Boolean).length };
}
const NEEDS = { id: null, name: "Needs data", pos: null, score: null, muted: true };
rows.forEach((x, i) => {
  const pick = (list) => {
    let best = null;
    for (const p of list) {
      const s = scores[p.id][i];
      if (s == null) continue;
      const pos = 1 + scores[p.id].filter((o) => o != null && o > s).length;
      if (!best || s > best.score || (s === best.score && pos < best.pos)) best = { id: p.id, name: p.name, pos, score: s };
    }
    return best;
  };
  x.fit = pick(profiles.filter((p) => p.content)) || pick(profiles.filter((p) => !p.content)) || NEEDS;
});

// ---------- note tokens ----------
function fillNote(x) {
  if (!x.r.note) return null;
  return x.r.note.replace(/\{([A-Z0-9]+|ROW)\.([a-zA-Z]+)\}/g, (all, t, f) => {
    if (t === "ROW") { if (f === "perHit") return money(x.m.perHit); throw new Error(`unknown token ${all}`); }
    const s = idxStats(t);
    if (!s || !s.ok) throw new Error(`${x.r.id}: ${all} but ${t} has no stats (n < ${MIN_N})`);
    const ph = x.m.perHit;
    const k = s.prices.filter((v) => v >= ph).length;
    const map = { median: money(s.median), n: String(s.n), top: s.top, topPrice: money(s.topPrice), mark: dShort(s.mark), k: k === 0 ? "none" : String(k) };
    if (!(f in map)) throw new Error(`unknown token ${all}`);
    return map[f];
  });
}

// ---------- columns ----------
// show: "dp" = default on desktop and phone, "d" = desktop only, "" = via "More columns"
const COLS = [
  { k: "box", label: "Box", show: "dp", dir: "asc", sticky: true },
  { k: "sport", label: "Sport", show: "", dir: "asc" },
  { k: "sold", label: "Sold median", show: "dp", dir: "asc" },
  { k: "vsMsrp", label: "vs MSRP", show: "d", dir: "asc" },
  { k: "packs", label: "Packs", show: "", dir: "desc" },
  { k: "cards", label: "Cards", show: "", dir: "desc" },
  { k: "hits", label: "Hits/box", show: "d", dir: "desc" },
  { k: "perCard", label: "$/card", show: "d", dir: "asc" },
  { k: "perPack", label: "$/pack", show: "", dir: "asc" },
  { k: "perHit", label: "$/hit", show: "dp", dir: "asc" },
  { k: "days", label: "Days out", show: "", dir: "asc" },
  { k: "idxMedian", label: "Median hit", show: "", dir: "desc", idx: true },
  { k: "idxMean", label: "Mean hit", show: "", dir: "desc", idx: true },
  { k: "lottery", label: "Lottery ratio", show: "d", dir: "desc", idx: true },
  { k: "skew", label: "Skew", show: "", dir: "desc", idx: true },
  { k: "kurt", label: "Ex. kurtosis", show: "", dir: "desc", idx: true },
  { k: "topShare", label: "Top card share", show: "", dir: "desc", idx: true },
  { k: "top5", label: "Top-5 share", show: "", dir: "desc", idx: true },
  { k: "kAbove", label: "Hits ≥ $/hit", show: "", dir: "desc", idx: true },
  { k: "fit", label: "Best fit", show: "d", dir: "asc" },
  { k: "score", label: "Fit score", show: "", dir: "desc" },
  { k: "buy", label: "eBay", show: "dp", nosort: true },
];

const dim = (t) => `<span class="bx-na">${esc(t)}</span>`;
const sub = (t) => `<span class="roi-sub">${t}</span>`;
function idxCell(x, f) {
  if (!x.idx) return dim("Not indexed");
  if (!x.idx.ok) return dim(`Under ${MIN_N} priced`);
  return f(x.idx);
}
function cellHTML(c, x) {
  const { r, m, idx } = x;
  switch (c.k) {
    case "box": {
      const ix = idx && idx.page && fs.existsSync(path.join(REPO, idx.page.replace(/^\//, "") + ".html")) ? ` · <a href="${esc(idx.page)}">${esc(idx.ticker)} index</a>` : "";
      return `<a class="bx-name" href="#${esc(r.anchor)}">${esc(r.product)}</a><span class="roi-sub">${esc(r.sport)} · ${r.format === "jumbo" ? "Jumbo" : "Hobby"}<span class="bx-out"> · out ${esc(dLong(r.releaseDate))}</span>${ix}</span><span class="fit-tag fit-m${x.fit.muted ? " fit-na" : ""}">${esc(x.fit.name)}</span>`;
    }
    case "sport": return esc(r.sport);
    case "sold": return `<span class="roi-price">${money(m.price)}</span>${sub(`${r.sold.n} sales, ${span(r.sold.from, r.sold.to)}`)}`;
    case "vsMsrp": return m.vsMsrp == null ? dim("No list price") : `${m.vsMsrp >= 0 ? "+" : "−"}${Math.abs(Math.round(m.vsMsrp * 100))}%${sub(`vs ${money(r.msrp.value)}${r.msrp.basis === "presale" ? " presale" : ""}`)}`;
    case "packs": return r.packs ? `${r.packs} × ${r.cardsPerPack}` : dim("Not listed");
    case "cards": return m.cards ?? dim("Not listed");
    case "hits": return esc(r.hits.guaranteedText);
    case "perCard": return m.perCard == null ? dim("Not listed") : money(m.perCard);
    case "perPack": return m.perPack == null ? dim("Not listed") : money(m.perPack);
    case "perHit": return money(m.perHit);
    case "days": return String(m.days);
    case "idxMedian": return idxCell(x, (s) => `${money(s.median)}${sub(`${s.n} priced · ${dShort(s.mark)}`)}`);
    case "idxMean": return idxCell(x, (s) => money(s.mean));
    case "lottery": return idxCell(x, (s) => s.lottery.toFixed(1) + sub(`${s.ticker} · ${dShort(s.mark)}`));
    case "skew": return idxCell(x, (s) => s.skew.toFixed(2));
    case "kurt": return idxCell(x, (s) => s.kurt.toFixed(1));
    case "topShare": return idxCell(x, (s) => pct(s.topShare) + sub(esc(s.top)));
    case "top5": return idxCell(x, (s) => pct(s.top5Share));
    case "kAbove": return idxCell(x, (s) => `${m.kAbove} of ${s.n}`);
    case "fit": return `<span class="fit-tag${x.fit.muted ? " fit-na" : ""}">${esc(x.fit.name)}</span>`;
    case "score": return `<span class="bx-score">${x.fit.score ?? "n/a"}</span>`;
    case "buy": return `<a class="tbl-buy" href="${esc(buyHref(r))}" target="_blank" rel="noopener sponsored">Buy on eBay</a>`;
  }
  throw new Error("col " + c.k);
}
const cls = (c) => ["c-" + c.k, c.show === "" ? "c-opt" : c.show === "d" ? "c-dsk" : ""].filter(Boolean).join(" ");

// sort values for the JS (null sorts last either way)
function sortVals(x) {
  const { r, m, idx } = x, s = idx && idx.ok ? idx : null;
  return {
    box: r.product, sport: r.sport, sold: m.price, vsMsrp: r2(m.vsMsrp, 4), packs: r.packs, cards: m.cards, hits: r.hits.total,
    perCard: r2(m.perCard), perPack: r2(m.perPack), perHit: r2(m.perHit), days: m.days,
    idxMedian: s && r2(s.median), idxMean: s && r2(s.mean), lottery: s && r2(s.lottery, 3), skew: s && r2(s.skew, 3), kurt: s && r2(s.kurt, 3),
    topShare: s && r2(s.topShare, 4), top5: s && r2(s.top5Share, 4), kAbove: s ? m.kAbove : null, fit: x.fit.muted ? null : x.fit.name,
  };
}

// ---------- the screener block ----------
const sportsPresent = ["Baseball", "Basketball", "Football", "Soccer", "Pokémon", "Other"].filter((s) => rows.some((x) => x.r.sport === s));
const formatsPresent = ["hobby", "jumbo", "booster-box", "etb"].filter((f) => rows.some((x) => x.r.format === f));
const FORMAT_LABEL = { hobby: "Hobby", jumbo: "Jumbo", "booster-box": "Booster box", etb: "ETB" };
const BANDS = [["", "Any price"], ["0-250", "Under $250"], ["250-500", "$250 to $500"], ["500-1000", "$500 to $1,000"], ["1000-", "Over $1,000"]];
const statIdx = [...new Map(rows.filter((x) => x.idx && x.idx.ok).map((x) => [x.idx.ticker, x.idx])).values()];
const shyIdx = [...new Map(rows.filter((x) => x.idx && !x.idx.ok).map((x) => [x.idx.ticker, x])).values()];
const markDate = statIdx.map((s) => s.mark).sort().at(-1);
const sign = (w) => (w > 0 ? "+" : "−") + Math.abs(w);

const order = rows.map((x, i) => i).sort((a, b) => rows[a].m.price - rows[b].m.price); // baked order: price, low to high
const blob = {
  read: READ, phoneRows: PHONE_ROWS, cols: COLS.map(({ k, label, show, dir, nosort }) => ({ k, label, show, dir, nosort: !!nosort })),
  profiles: profiles.map((p) => ({ id: p.id, name: p.name, scorable: coverage[p.id].qualify > 0 })),
  rows: order.map((i) => {
    const x = rows[i];
    return { id: x.r.id, sport: x.r.sport, format: x.r.format, price: x.m.price, days: x.m.days, fit: x.fit.id, v: sortVals(x), s: Object.fromEntries(profiles.map((p) => [p.id, scores[p.id][i]])) };
  }),
};

const css = `<style>
.bx-ctl{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin:22px 0 12px;font-family:var(--fm);font-size:11px;}
.bx-chips{display:flex;flex-wrap:wrap;gap:6px;width:100%;}
.bx-chip{font-family:var(--fm);font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 12px;min-height:36px;border:1px solid var(--border2);background:transparent;color:var(--text-dim);border-radius:2px;cursor:pointer;}
.bx-chip[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);background:var(--accent-dim);}
.bx-ctl label{display:inline-flex;align-items:center;gap:6px;color:var(--text-dim);letter-spacing:.5px;}
.bx-ctl select{font-family:var(--fm);font-size:11px;background:var(--bg2);color:var(--text-head);border:1px solid var(--border2);border-radius:2px;padding:7px 8px;min-height:36px;max-width:100%;}
.bx-ctl input[type=checkbox]{accent-color:var(--accent);width:16px;height:16px;}
.bx-cols{position:relative;}
.bx-cols>summary{list-style:none;cursor:pointer;font-family:var(--fm);font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent);border:1px dashed rgba(0,204,245,.45);padding:8px 12px;min-height:36px;display:inline-flex;align-items:center;border-radius:2px;}
.bx-cols>summary::-webkit-details-marker{display:none;}
.bx-cols[open]>summary{background:var(--accent-dim);}
.bx-colbox{position:absolute;z-index:5;top:calc(100% + 6px);left:0;background:var(--bg3);border:1px solid var(--border2);padding:12px 14px;display:grid;grid-template-columns:repeat(2,minmax(130px,1fr));gap:8px 16px;width:max-content;max-width:min(92vw,420px);box-shadow:0 8px 24px rgba(0,0,0,.5);}
.bx-colbox label{color:var(--text);font-size:11px;}
.bx-count{width:100%;font-family:var(--fm);font-size:10.5px;color:var(--text-dim);letter-spacing:.5px;}
.bx-wrap{overflow-x:auto;max-width:100%;border:1px solid var(--border);-webkit-overflow-scrolling:touch;}
.bx-t{width:100%;border-collapse:collapse;font-size:13.5px;}
.bx-t thead tr{background:var(--bg3);border-bottom:2px solid var(--accent);}
.bx-t th{padding:0;text-align:left;white-space:nowrap;vertical-align:bottom;}
.bx-t th button,.bx-t th .bx-th{display:block;width:100%;text-align:left;background:none;border:0;cursor:pointer;padding:12px 10px 10px;font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--accent);text-transform:uppercase;white-space:nowrap;}
.bx-t th .bx-th{cursor:default;}
.bx-t th button:hover{color:#fff;}
.bx-t th[aria-sort="ascending"] button::after{content:" \\2191";}
.bx-t th[aria-sort="descending"] button::after{content:" \\2193";}
.bx-t tbody tr{border-bottom:1px solid var(--border);}
.bx-t td{padding:11px 10px;vertical-align:middle;white-space:nowrap;color:var(--text);}
.bx-t .c-box{position:sticky;left:0;z-index:1;background:var(--bg);white-space:normal;min-width:200px;max-width:240px;}
.bx-t thead .c-box{background:var(--bg3);z-index:2;}
.bx-t .bx-name{font-family:var(--fd);font-size:16px;font-weight:800;color:var(--text-head);text-transform:uppercase;line-height:1.15;display:block;}
.bx-t .bx-name:hover{color:var(--accent);text-decoration:none;}
.bx-t .roi-sub{display:block;margin-top:3px;white-space:normal;}
.bx-t .roi-sub a{color:var(--text-dim);text-decoration:underline;text-decoration-color:rgba(255,255,255,.25);}
.bx-t .fit-m{display:none;}
.fit-tag.fit-na{color:var(--text-dim);border-color:var(--border2);background:transparent;opacity:.8;}
.bx-gate{display:block;margin-top:6px;color:var(--text-dim);font-size:12px;line-height:1.4;}
.bx-t td.c-hits{white-space:normal;min-width:84px;max-width:104px;line-height:1.35;}
.bx-t .bx-na{font-family:var(--fm);font-size:10px;color:var(--text-dim);opacity:.8;}
.bx-t .bx-score{font-family:var(--fd);font-size:17px;font-weight:800;color:var(--text-head);}
.bx-t:not(.js) .c-opt{display:none;}
.bx-more{display:none;margin:10px 0 0;font-family:var(--fm);font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:transparent;color:var(--accent);border:1px solid var(--accent);padding:10px 14px;min-height:40px;border-radius:2px;cursor:pointer;width:100%;}
.bx-more.on{display:block;}
.bx-legend{font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-top:12px;max-width:860px;}
details.bx-how{margin-top:14px;background:var(--bg2);border:1px solid var(--border);}
details.bx-how>summary{cursor:pointer;list-style:none;padding:12px 16px;min-height:44px;font-family:var(--fm);font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--accent);}
details.bx-how>summary::-webkit-details-marker{display:none;}
details.bx-how>summary::after{content:' +';}
details.bx-how[open]>summary::after{content:' \\2212';}
.bx-how-body{padding:4px 16px 16px;font-size:13px;line-height:1.65;color:var(--text);}
.bx-how-body p{margin:0 0 10px;}
.bx-wt{width:100%;border-collapse:collapse;margin:6px 0 12px;font-size:12.5px;}
.bx-wt td{padding:8px 8px;border-top:1px solid var(--border);vertical-align:top;}
.bx-wt td:first-child{font-family:var(--fd);font-weight:800;text-transform:uppercase;color:var(--text-head);white-space:nowrap;}
.bx-wt code{font-family:var(--fm);font-size:11px;color:var(--accent);}
@media(max-width:600px){
  .bx-t:not(.js) .c-dsk{display:none;}
  .bx-t .c-box{min-width:132px;max-width:146px;}
  .bx-t td.c-sold{white-space:normal;min-width:84px;max-width:96px;}
  .bx-t .bx-name{font-size:13.5px;}
  .bx-t .bx-out{display:none;}
  .bx-t .fit-m{display:inline-block;margin-top:6px;}
  .bx-t td{padding:10px 8px;}
  .bx-t th button,.bx-t th .bx-th{padding:11px 8px 9px;letter-spacing:1px;white-space:normal;line-height:1.3;}
  .bx-t .tbl-buy{white-space:normal;text-align:center;justify-content:center;padding:8px 8px;font-size:10px;letter-spacing:.8px;max-width:76px;line-height:1.25;}
  .bx-ctl{gap:8px 10px;}
  .bx-ctl select{font-size:12px;}
  .bx-wt td:first-child{white-space:normal;}
}
</style>`;

const thead = `<thead><tr>${COLS.map((c) => `<th class="${cls(c)}" data-c="${c.k}"${c.nosort ? "" : ` aria-sort="${c.k === "sold" ? "ascending" : "none"}"`} scope="col">${c.nosort ? `<span class="bx-th">${esc(c.label)}</span>` : `<button type="button">${esc(c.label)}</button>`}</th>`).join("")}</tr></thead>`;
const tbody = `<tbody>\n${order.map((i) => { const x = rows[i]; return `<tr data-id="${esc(x.r.id)}">${COLS.map((c) => `<td class="${cls(c)}" data-c="${c.k}">${cellHTML(c, x)}</td>`).join("")}</tr>`; }).join("\n")}\n</tbody>`;

const metricLabel = boxes.profiles.metrics;
const covLine = (p) => { const c = coverage[p.id]; return `Every figure on file for ${c.onFile} of ${rows.length}; ${c.qualify} qualify.`; };
const howRows = profiles.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.needsMonths ? esc(p.note) : p.weights.map(([k, w]) => `<code>${sign(w)}</code> ${esc(metricLabel[k] || k)}`).join("<br>")}<span class="bx-gate">Gate: ${esc(p.gate || "none")}. ${p.needsMonths ? "" : covLine(p)}</span></td></tr>`).join("");

const intro = `Each price is the median of single-box sales on SportsCardsPro in the 30 days to the read date. If a box sold fewer than five times, the window stretches to 60 or 90 days. Cases, lots, breaks and presales before street date are left out, and every row shows its sale count and dates. Jumbos have their own rows. Tap a column to sort it, or pick a buying goal to rank the boxes for it. To run your own numbers, use the <a href="/hobby-box-roi-calculator">Hobby Box ROI Calculator</a>.`;

const legendIdx = statIdx.map((s) => `${s.ticker} (${esc(s.set)})`).join(" and ");
const legend = `The hit columns come from our ${legendIdx} 1st auto indexes: PriceCharting ungraded 30-day sold medians for each base 1st auto, marked ${dLong(markDate)}. Parallels aren't in them. Lottery ratio is the mean hit price over the median one, so a high number means a few cards carry the set. Skew and excess kurtosis say the same thing in stats terms. "Hits ≥ $/hit" counts the cards in the index whose median is at least what one hit costs you from that box. Stats only print when ${MIN_N} or more cards are priced${shyIdx.length ? `, so ${shyIdx.map((x) => `${esc(x.r.product.replace(/ (Hobby|Jumbo)$/, ""))} (${x.idx.ticker})`).join(", ")} shows none yet` : ""}. MSRP is Topps' release-day price from Checklist Insider, or the presale price where no release-day price is listed.`;

const how = `<details class="bx-how" id="fit-how">
      <summary>How the fit score works</summary>
      <div class="bx-how-body">
        <p>Pick the goal that sounds like you and the table re-sorts for it. Each goal is a set of weights on the columns above. ${esc(boxes.profiles.method)}</p>
        <table class="bx-wt"><tbody>${howRows}</tbody></table>
        <p>Budget and Set builder are the value picks, Prospector is the growth pick and Ripper is the high-growth one. The score only compares the boxes on this page using the figures in the table. A box missing a figure a goal needs isn't scored on that goal, and a box with no goal says \"Needs data\" rather than a guess. Weights version: ${esc(boxes.profiles.version)}.</p>
      </div>
    </details>`;

const controls = `<div class="bx-ctl" id="bx-ctl">
      <div class="bx-chips" role="group" aria-label="Sport">${["All", ...sportsPresent].map((s) => `<button type="button" class="bx-chip" data-sport="${s === "All" ? "" : esc(s)}" aria-pressed="${s === "All"}">${esc(s)}</button>`).join("")}</div>
      <label>Format <select id="bx-format"><option value="">All</option>${formatsPresent.map((f) => `<option value="${f}">${FORMAT_LABEL[f]}</option>`).join("")}</select></label>
      <label>Price <select id="bx-band">${BANDS.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join("")}</select></label>
      <label><input type="checkbox" id="bx-recent"> Out in the last 90 days</label>
      <label>Goal <select id="bx-profile"><option value="">Price, low to high</option>${profiles.map((p) => { const off = !coverage[p.id].qualify; return `<option value="${p.id}"${off ? " disabled" : ""}>${esc(p.name)}${off ? " (not yet)" : ""}</option>`; }).join("")}</select></label>
      <details class="bx-cols"><summary>More columns</summary><div class="bx-colbox">${COLS.filter((c) => c.k !== "box").map((c) => `<label><input type="checkbox" data-col="${c.k}"> ${esc(c.label)}</label>`).join("")}</div></details>
      <div class="bx-count" id="bx-count" aria-live="polite">${rows.length} boxes, sorted by sold price</div>
    </div>`;

const screener = `<!-- BOXSCREENER:START — the box screener. Generated by tools/build-box-screener.mjs from data/boxes.json + data/indices.json. Do not hand-edit. -->
${css}
  <section style="border-top:none; padding-top:36px;" id="screener">
    <h2>2026 Hobby Boxes by Last Sold Price</h2>
    <p class="section-intro">
      ${intro}
    </p>
    ${controls}
    <div class="bx-wrap">
      <table class="bx-t" id="bx-t">
        ${thead}
        ${tbody}
      </table>
    </div>
    <button type="button" class="bx-more" id="bx-more"></button>
    <p class="bx-legend">${legend}</p>
    ${how}
  </section>
<script type="application/json" id="bx-data">${JSON.stringify(blob).replace(/</g, "\\u003c")}</script>
<script src="/js/box-screener.js?v=1" defer></script>
<!-- BOXSCREENER:END -->`;

// ---------- the notes block ----------
const CTA_STYLE = { football: ' style="background:var(--orange); color:#000;"', basketball: ' style="background:var(--purple); color:#fff;"' };
const noteRows = rows.filter((x) => x.r.note);
const notes = `<!-- BOXNOTES:START — per-box notes. Generated by tools/build-box-screener.mjs from data/boxes.json (note). Do not hand-edit. -->
  <section class="box-notes">
    <h2>Box by Box</h2>
    <p class="section-intro">Tap a box for what's inside and the jumbo price where one sold.</p>
${noteRows.map((x) => {
  const { r } = x;
  const jumbo = rows.find((j) => j.r.parent && r.id === "best-hobby-boxes-2026-" + j.r.parent && j.r.format === "jumbo");
  return `
    <details class="box-more" id="${esc(r.anchor)}">
      <summary><span class="bm-name">${esc(r.product)}</span><span class="bm-meta">${money(x.m.price)} · ${esc(x.fit.name)}</span></summary>
      <div class="box-card${r.category === "baseball" ? "" : " " + r.category}">
        <div class="box-sport-tag ${esc(r.category)}">${esc(r.tag)}</div>
        <div class="box-body">
          ${fillNote(x)}
        </div>
        <div class="box-ctas">
          <a href="${esc(buyHref(r))}" target="_blank" rel="noopener sponsored" class="btn-primary"${CTA_STYLE[r.category] || ""}>Buy on eBay →</a>${jumbo ? `
          <a href="${esc(buyHref(jumbo.r))}" target="_blank" rel="noopener sponsored" class="btn-secondary">Buy the Jumbo on eBay</a>` : ""}
        </div>
      </div>
    </details>`;
}).join("\n")}

    <p class="box-aside">Retail blasters are fine at MSRP. Once resellers mark them up, a hobby box or the single you want is the better use of the money.</p>
  </section>
<!-- BOXNOTES:END -->`;

// keep-line guard (spec §2): it must survive verbatim on the 2026 Bowman (May) row
for (const x of rows) if (x.r.keepLine && !(x.r.note || "").includes(x.r.keepLine)) throw new Error(`${x.r.id}: keep-line missing from its note`);

// ---------- write ----------
let html = read(PAGE);
const before = html;
function put(name, block, firstRunRe) {
  const re = new RegExp(`<!-- ${name}:START[\\s\\S]*?<!-- ${name}:END -->`);
  if (re.test(html)) { html = html.replace(re, () => block); return; }
  if (!firstRunRe.test(html)) throw new Error(`${name}: no markers and no first-run anchor in ${PAGE}`);
  html = html.replace(firstRunRe, () => block + "\n");
}
// first run only: the Phase 1 hand-written table section and the notes section
put("BOXSCREENER", screener, /<!-- BOX TABLE \(Box Desk[\s\S]*?<\/section>\n/);
put("BOXNOTES", notes, /  <section class="box-notes">[\s\S]*?<\/section>\n/);

if (PRINT) {
  console.log("box | sold | n | $/hit | lottery | skew | kurt | k≥$/hit | best fit (pos, score) | " + profiles.filter((p) => !p.needsMonths).map((p) => p.name).join(" | "));
  for (const i of order) {
    const x = rows[i], s = x.idx && x.idx.ok ? x.idx : null;
    console.log([x.r.product, money(x.m.price), x.r.sold.n, money(x.m.perHit), s ? s.lottery.toFixed(1) : "-", s ? s.skew.toFixed(2) : "-", s ? s.kurt.toFixed(1) : "-", s ? `${x.m.kAbove}/${s.n}` : "-", (x.fit.muted ? "Needs data" : `${x.fit.name} (#${x.fit.pos}, ${x.fit.score})`), ...profiles.filter((p) => !p.needsMonths).map((p) => scores[p.id][i])].join(" | "));
  }
  for (const s of statIdx) console.log(`${s.ticker}: n ${s.n} · median ${money(s.median)} · mean ${money(s.mean)} · lottery ${s.lottery.toFixed(2)} · skew ${s.skew.toFixed(2)} · ex.kurt ${s.kurt.toFixed(2)} · top ${s.top} ${money(s.topPrice)} (${pct(s.topShare)}) · top-5 ${pct(s.top5Share)} · mark ${s.mark}`);
}
if (html === before) console.log(`${PAGE}: unchanged`);
else { if (!DRY) fs.writeFileSync(path.join(REPO, PAGE), html); console.log(`${PAGE}: ${DRY ? "would change" : "written"} (${rows.length} rows, ${noteRows.length} notes)`); }
