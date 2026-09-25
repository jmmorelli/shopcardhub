#!/usr/bin/env node
// build-sector-index.mjs — a SECTOR-MODEL set index (rulebook: claude/cos/sector-index-rulebook-2026-09-15.md).
// First ticker built with it: TH26 · 30th Celebration (Sep 25 2026, Mo: "do it - I approve").
//
// The model, in one line: one set is one sector; the universe is EVERY card in the set (nobody selects
// constituents); a card is in the basket when it clears the liquidity screen (>= 6 clean single-card sold
// comps in the trailing 30 days, stays until < 4); price-weighted with a 25% single-card cap applied at
// reconstitution; base 100 at inception; divisor-continuous, so only prices move the level. Quarterly
// reconstitution (first Monday of Jan/Apr/Jul/Oct), announced the Monday before.
//
// DATA: PriceCharting — the set's console page for the universe (one product per slot) and each item's
// public "Ungraded" completed-sales table for the screen AND the mark (the same list answers both
// questions — rulebook §2b/§7). Listing titles are read in memory for the lot filter and NEVER stored
// (R17); only dates and prices leave the page, and only aggregates are published. Asks are never used (R20).
//
// Usage:
//   node tools/build-sector-index.mjs --ticker TH26 --init [--dry]      first build: universe → screen → basket → cap → divisor → level 100 → page block
//   node tools/build-sector-index.mjs --ticker TH26 --mark [--dry]      twice weekly (Mon/Thu): re-read the basket's sales, append a history row, re-bake the block
//   node tools/build-sector-index.mjs --ticker TH26 --recon [--dry]     quarterly: re-run the screen on the universe, enter/exit, re-cap, divisor-adjust (level unchanged)
//   node tools/build-sector-index.mjs --ticker TH26 --bake              re-bake the page block from data/indices.json only (no network)
// Add --if-mark-day to --mark to make it a no-op except on Monday/Thursday (for the nightly Action).
//
// Writes: data/indices.json (the ticker's key), <page>.html between <!-- <TICKER>:START --> … <!-- <TICKER>:END -->.
// Never touches another ticker, never touches the page outside its markers. Idempotent.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consoleCards } from "./price-engine/pc-console.mjs";
import { parsePage } from "./price-engine/sold-marks.mjs";
import { ebaySearchUrl, SACAT_TCG } from "./lib/epn.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const has = (k) => args.includes(k);
const TICKER = opt("--ticker", null);
const DRY = has("--dry");
const TODAY = process.env.SIDX_TODAY || new Date().toISOString().slice(0, 10);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const PAUSE = 1600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (x) => Math.round(x * 100) / 100;
const r4 = (x) => Math.round(x * 10000) / 10000;
const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const days = (d) => (Date.parse(TODAY) - Date.parse(d)) / 864e5;
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mdy = (d) => { const p = String(d).slice(0, 10).split("-"); return `${p[1]}/${p[2]}/${p[0].slice(2)}`; };

// ---------------- per-ticker config (the parameters are Mo's, Sep 15 2026; do not tune) ----------------
const CONFIG = {
  TH26: {
    name: "30th Celebration Set Index",
    set: "Pokémon TCG 30th Celebration",
    page: "/pokemon-30th-anniversary-2026",
    pcSlug: "pokemon-30th-celebration",
    ebayQuery: (name, num) => `pokemon 30th celebration ${name} ${num}`,
    theme: "#f5c800",
    releaseDate: "2026-09-16",
    sub: { RGB: { name: "Mew RGB trio", nums: ["R/RGB", "G/RGB", "B/RGB"], blurb: "The three secret-rare Mews (R, G, B) — the set's chase, tracked as their own line so the trio's move is never mistaken for the set's." } },
    note: "Includes the Classic Collection reprints (Charizard #4, Lugia #149 …) — they are in the set on PriceCharting's listing and enter the basket the week they clear the screen; the Ultra-Premium Collection that carries them ships Nov 6. Product waves run through Dec 4; the index is inception-forward, so supply arriving later is a market event, never a restatement.",
  },
};
const SCREEN = { enter: 6, stay: 4, window: 30 };
const CAP = 0.25;          // no single card above 25% …
const BIG = 0.05, BIG_SUM = 0.50;   // … and positions above 5% may not sum past 50% — the Select Sector SPDR "5/50" rule, adopted Sep 25 2026 (Mo) when the three Mew RGB secrets would otherwise have taken 75% of TH26

// titles that are not one ungraded single of this card (read in memory only — never stored)
const TITLE_BAD = /\b(lot|lots|bundle|x\s?\d+|\d+\s*(cards?|pcs?|pack)|set of|complete set|master set|playset|proxy|custom|sealed|booster|etb|elite trainer|box|tin|japanese|japan|korean|chinese|jpn|kor|psa|cgc|bgs|sgc|tag\s*\d|graded|slab|reverse holo|rev holo|cosmos|stamp)\b/i;

function cfg() { const c = CONFIG[TICKER]; if (!c) { console.error(`no config for ticker ${TICKER}`); process.exit(2); } return c; }
async function get(url) {
  for (let a = 1; a <= 3; a++) {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(5000 * a); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }
  throw new Error("gave up: " + url);
}

// ---------------- universe: one slot per card on the set's PriceCharting console ----------------
// slot rule (sv151-rebuild-spec): a slot is a title ending in "#<num>"; sealed products have no number; bracketed
// titles ([Reverse Holo], [Holo], [Cosmos Holo], retailer stamps) are variants of the bracketless slot and are
// dropped when a bracketless print exists. Two different cards may share a number in this set (the Classic
// Collection reprints keep their original numbers: Lugia #149 beside Pikachu ex #149), so the slot key is
// name + number, never the number alone.
async function universe(c) {
  const rows = await consoleCards(c.pcSlug);
  const slots = new Map();
  for (const r of rows) {
    const m = r.title.match(/^(.*?)\s+#([A-Za-z0-9\/]+)\s*$/) || r.title.match(/^(.*?)\s+([A-Z]\/RGB)\s*$/); if (!m) continue;   // sealed products carry no number; "B/RGB" is a number (Mo, Sep 25: the RGB Mews are set cards)
    const name = m[1].replace(/\s*\[[^\]]*\]\s*/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim(), num = m[2];
    const bracket = /\[/.test(r.title);
    const key = (name + " #" + num).toLowerCase();
    const cur = slots.get(key);
    if (!cur || (cur.bracket && !bracket)) slots.set(key, { num, name, title: name + " #" + num, path: r.path, bracket });
  }
  const out = [...slots.values()].map(({ num, name, title, path: p }) => ({ num, name, title, path: p }));
  out.sort((a, b) => (parseInt(a.num, 10) || 0) - (parseInt(b.num, 10) || 0) || a.name.localeCompare(b.name));
  return out;
}

// ---------------- screen + mark from one item page read ----------------
async function readCard(slot) {
  const html = await get("https://www.pricecharting.com/game/" + slot.path);
  const pg = parsePage(html, "Raw");
  if (pg.error) return { error: pg.error, clean30: 0, all30: 0, price: null };
  // re-walk the rows with titles, in memory, for the lot filter (parsePage keeps dates+prices only)
  const start = html.indexOf('<div class="completed-auctions-used"');
  const end = html.indexOf('<div class="completed-auctions-', start + 20);
  const body = html.slice(start, end > 0 ? end : start + 400000);
  const rows = [];
  for (const tr of body.split("<tr").slice(1)) {
    const d = tr.match(/<td class="date">\s*(\d{4}-\d{2}-\d{2})\s*<\/td>/);
    const p = tr.match(/<span class="js-price"[^>]*>\s*\$([\d,]+(?:\.\d+)?)/);
    const t = tr.match(/<td class="title">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
    if (d && p) rows.push({ d: d[1], p: parseFloat(p[1].replace(/,/g, "")), clean: !(t && TITLE_BAD.test(t[1].replace(/<[^>]+>/g, " "))) });
  }
  const in30 = rows.filter((r) => days(r.d) <= SCREEN.window), clean30 = in30.filter((r) => r.clean);
  return { all30: in30.length, clean30: clean30.length, tabCount: pg.tabCount, price: clean30.length ? r2(median(clean30.map((r) => r.p))) : null, lastSale: rows.length ? rows.map((r) => r.d).sort().slice(-1)[0] : null };
}

// ---------------- the 25% cap: weights w so no card exceeds CAP of Σ(price·w); level unchanged by construction ----------------
function applyCap(basket) {
  basket.forEach((b) => { b.w = 1; });
  for (let it = 0; it < 200; it++) {
    let changed = false;
    const T = basket.reduce((s, b) => s + b.price * b.w, 0);
    // leg 1: no single position above CAP of the total
    for (const b of basket) { const v = b.price * b.w; if (v / T > CAP + 1e-9) { b.w = r4((CAP * T) / b.price); changed = true; } }
    // leg 2: positions above BIG may not sum past BIG_SUM of the total (5/50)
    const T2 = basket.reduce((s, b) => s + b.price * b.w, 0);
    const big = basket.filter((b) => (b.price * b.w) / T2 > BIG + 1e-9);
    const bigSum = big.reduce((s, b) => s + b.price * b.w, 0);
    if (bigSum / T2 > BIG_SUM + 1e-9) { const f = (BIG_SUM * T2) / bigSum; for (const b of big) { b.w = r4(b.w * f); } changed = true; }
    if (!changed) break;
  }
  basket.forEach((b) => { if (b.w > 1) b.w = 1; });
  return basket;
}
const basketValue = (basket) => basket.reduce((s, b) => s + b.price * (b.w == null ? 1 : b.w), 0);
const levelOf = (x) => r2(basketValue(x.basket) / x.divisor);
// sub-index: a named subset of the basket, price-weighted, uncapped, base 100 at the same inception — a second line, never the level
function subValue(x, nums) { return x.basket.filter((b) => nums.includes(String(b.num))).reduce((s, b) => s + b.price, 0); }
function subInit(x, c) {
  x.sub = {};
  for (const [k, d] of Object.entries(c.sub || {})) { const v = subValue(x, d.nums); if (!v) continue; x.sub[k] = { name: d.name, nums: d.nums, blurb: d.blurb, divisor: r4(v / 100), history: [{ date: x.inception, level: 100, basketValue: r2(v), note: "inception" }] }; }
}
function subMark(x, date) {
  for (const [k, sx] of Object.entries(x.sub || {})) { const v = subValue(x, sx.nums); if (!v) continue; sx.history.push({ date, level: r2(v / sx.divisor), basketValue: r2(v) }); }
}

// ---------------- page block ----------------
function block(x, c) {
  const h = x.history || [], last = h[h.length - 1] || null, prev = h.length > 1 ? h[h.length - 2] : null;
  const lvl = last ? last.level : null;
  const wow = prev && last ? (last.level / prev.level - 1) * 100 : null;
  const bv = basketValue(x.basket), rows = x.basket.slice().sort((a, b) => b.price * b.w - a.price * a.w);
  const wts = rows.map((b) => (b.price * b.w) / bv);
  const hhi = wts.reduce((s, w) => s + w * w, 0), eff = hhi ? 1 / hhi : 0;
  const top = wts[0] || 0, capped = rows.filter((b) => b.w < 1).length;
  const pct = (v) => v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(1) + "%";
  const cls = (v) => v > 0 ? "up" : v < 0 ? "dn" : "flat";
  const row = (b, i) => {
    const w = (b.price * b.w) / bv;
    const q = c.ebayQuery(b.name, b.num);
    const cid = `${x.ticker.toLowerCase()}-${String(b.num).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const url = ebaySearchUrl({ q, customid: cid, sacat: SACAT_TCG, av: b.price >= 200 });
    const thumb = i < 10 ? `<span data-card-img="name:${esc(b.name)} ${esc(b.num)} ${esc(c.set)}" data-card-name="${esc(b.name)} #${esc(b.num)} ${esc(c.set)}" data-card-sub="pokemon" data-card-size="thumb" data-card-surface="${x.ticker.toLowerCase()}-list" data-card-link="off"></span>` : "";
    return `<tr><td class="rk">${i + 1}</td><td class="nm"><div class="nm-cell">${thumb}<div><b>${esc(b.name)}</b><small>#${esc(b.num)}${b.carried ? " · carried " + mdy(b.asOf) : ""}</small></div></div></td><td class="num">$${b.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td class="num">${(w * 100).toFixed(1)}%${b.w < 1 ? '<i title="at the 25% cap">*</i>' : ""}</td><td class="num dim">${b.n30}</td><td class="act"><button type="button" class="sch-track-card" data-name="${esc(b.name)} #${esc(b.num)} — ${esc(c.set)}" data-set="${esc(c.set)}" data-cat="pokemon" data-grade="Raw" data-price="${b.price}">★</button> <a href="${url}" target="_blank" rel="sponsored nofollow noopener">${b.price >= 200 ? "Authenticated on eBay" : "eBay"} →</a></td></tr>`;
  };
  const top10 = rows.slice(0, 10).map(row).join(""), rest = rows.slice(10).map((b, i) => row(b, i + 10)).join("");
  const unpriced = x.universe.length - x.basket.length;
  return `<section class="sidx" id="${x.ticker.toLowerCase()}" data-prices-updated="${last ? last.date : x.inception}" style="--sidx:${c.theme};">
  <div class="sidx-head">
    <div class="sidx-t">
      <div class="sidx-eyebrow">▮ Set Index · sector model · every card in the set</div>
      <h2><span class="sidx-tk">${x.ticker}</span> · ${esc(c.name)}</h2>
      <p class="sidx-sub">One set, one index. The universe is every card in ${esc(c.set)} (${x.universe.length}); the basket is the ${x.basket.length} that trade as ungraded singles — at least ${SCREEN.enter} clean sold comps in the trailing ${SCREEN.window} days to enter, ${SCREEN.stay} to stay. Price-weighted on PriceCharting's dated sold list with the sector-ETF caps (no card above ${(CAP * 100).toFixed(0)}%, positions above ${(BIG * 100).toFixed(0)}% never past ${(BIG_SUM * 100).toFixed(0)}% together), base 100.00 at inception, re-marked Monday and Thursday. Nobody picks the cards; the set is the set.</p>
    </div>
    <div class="sidx-level">
      <div class="lv">${lvl == null ? "—" : lvl.toFixed(2)}</div>
      <div class="lvc">base 100.00 · inception ${mdy(x.inception)} · re-marked ${last ? mdy(last.date) : "—"}${wow == null ? "" : ` · <span class="${cls(wow)}">${wow >= 0 ? "▲" : "▼"} ${pct(wow)} vs prior mark</span>`}</div>
    </div>
  </div>
  <div class="idx-chart" data-ticker="${x.ticker}" aria-live="polite"></div>
  <div class="sidx-stats">
    <div><span class="k">Basket / Universe</span><span class="v">${x.basket.length} <i>/ ${x.universe.length}</i></span></div>
    <div><span class="k">Top card weight</span><span class="v">${(top * 100).toFixed(1)}%</span></div>
    <div><span class="k">Effective holdings</span><span class="v">${eff.toFixed(1)}</span></div>
    <div><span class="k">Basket value</span><span class="v">$${bv.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span></div>
    <div><span class="k">At the cap</span><span class="v">${capped}</span></div>
    <div><span class="k">Since launch</span><span class="v ${cls(lvl == null ? 0 : lvl - 100)}">${lvl == null ? "—" : pct(lvl - 100)}</span></div>
  </div>
${subPanels(x, c)}
  <div class="sidx-auc" data-sidx-auctions="${x.ticker.toLowerCase()}-">
    <div class="sidx-auc-h"><span class="sidx-eyebrow">Ending soon · live eBay auctions on this set's top cards</span><span class="sidx-auc-n">loading…</span></div>
    <ul class="sidx-auc-l"><li class="sidx-auc-e">Loading the auction desk…</li></ul>
    <div class="sidx-auc-f">Bids, not prices — the current bid on a verified listing of the exact card, soonest close first, refreshed every 15 minutes. Nothing here is a mark. Full desk: <a href="/auctions">/auctions</a>.</div>
  </div>
  <div class="sidx-tbl"><table>
    <thead><tr><th>#</th><th>Card</th><th>Sold mark</th><th>Weight</th><th title="clean sold comps in the trailing 30 days — a gate input, not a volume figure">n30</th><th></th></tr></thead>
    <tbody>${top10}</tbody>
  </table></div>
  ${rest ? `<details class="sidx-more"><summary>Holdings 11–${rows.length} · every card in the basket</summary><div class="sidx-tbl"><table><tbody>${rest}</tbody></table></div></details>` : ""}
  <p class="sidx-note"><b>${unpriced} of ${x.universe.length}</b> cards are in the universe but not the basket: they have not cleared ${SCREEN.enter} clean single-card sales in ${SCREEN.window} days on PriceCharting's ungraded list. They are listed, not hidden — how much of a set trades as singles is a fact about the set. ${esc(c.note)} A weight marked * is capped: no card above ${(CAP * 100).toFixed(0)}%, and positions above ${(BIG * 100).toFixed(0)}% may not sum past ${(BIG_SUM * 100).toFixed(0)}% (the Select Sector SPDR 5/50 rule) — every cap is a weight in the divisor math, so applying one never moves the level. n30 is a liquidity gate, never a volume figure (the source caps its table at 60 rows). Level = Σ(sold mark × weight) ÷ divisor ${x.divisor}; every entry, exit and cap change is a logged divisor adjustment, so the level only moves on prices. Marks are dated sold comps (PriceCharting ungraded, blended eBay + TCGplayer), never asks. An index is a measurement, not a call. Method: <a href="/how-prices-work">how prices work</a> · every ticker: <a href="/indices">/indices</a>.</p>
</section>`;
}
function subPanels(x, c) {
  const out = [];
  for (const [k, sx] of Object.entries(x.sub || {})) {
    const h = sx.history || [], last = h[h.length - 1], prev = h.length > 1 ? h[h.length - 2] : null;
    const wow = prev ? (last.level / prev.level - 1) * 100 : null;
    const cards = x.basket.filter((b) => sx.nums.includes(String(b.num)));
    const chips = cards.map((b) => `<span class="sidx-subidx-c"><b>${esc(b.name)} #${esc(b.num)}</b> $${b.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}<small>n30 ${b.n30}</small></span>`).join("");
    out.push(`<div class="sidx-subidx">
    <div class="sidx-subidx-h"><div><span class="sidx-eyebrow">Sub-index · ${x.ticker}·${esc(k)}</span><h3>${esc(sx.name)} <small>${cards.length} cards · price-weighted · uncapped · base 100 at ${mdy(x.inception)}</small></h3><p>${esc(sx.blurb || "")}</p></div>
      <div class="sidx-subidx-lv"><div class="lv">${last ? last.level.toFixed(2) : "—"}</div><div class="lvc">${wow == null ? "one mark" : `<span class="${wow > 0 ? "up" : wow < 0 ? "dn" : "flat"}">${wow >= 0 ? "▲" : "▼"} ${(wow > 0 ? "+" : "") + wow.toFixed(1)}%</span> vs prior mark`} · basket $${(last ? last.basketValue : 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div></div>
    </div>
    <div class="sidx-subidx-chips">${chips}</div>
    <div class="idx-chart idx-chart-sm" data-ticker="${x.ticker}" data-sub="${esc(k)}" aria-live="polite"></div>
  </div>`);
  }
  return out.join("\n");
}
const CSS = `<style id="sidx-css">
.sidx{margin:22px 0 0;padding:18px 18px 14px;background:var(--bg2,#0c1017);border:1px solid var(--border,rgba(255,255,255,.08));border-top:2px solid var(--sidx);border-radius:4px;font-family:var(--fb,Barlow,system-ui,sans-serif);color:var(--text,#b8cdd4)}
.sidx-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px 28px;flex-wrap:wrap}
.sidx-t{flex:1 1 420px;min-width:0}
.sidx-eyebrow{font-family:var(--fm,ui-monospace,monospace);font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--sidx);margin-bottom:6px}
.sidx h2{font-family:var(--fd,'Barlow Condensed',sans-serif);font-size:clamp(22px,3vw,32px);font-weight:900;text-transform:uppercase;color:var(--text-head,#e4f0f4);margin:0 0 8px;line-height:1.05}
.sidx-tk{color:var(--sidx)}
.sidx-sub{font-size:13px;line-height:1.55;margin:0;color:var(--text-dim,#7a969e);max-width:760px}
.sidx-level{text-align:right;flex:0 0 auto}
.sidx-level .lv{font-family:var(--fm,ui-monospace,monospace);font-size:44px;font-weight:700;line-height:1;color:var(--text-head,#e4f0f4)}
.sidx-level .lvc{font-family:var(--fm,ui-monospace,monospace);font-size:10px;color:var(--text-dim,#7a969e);margin-top:6px;line-height:1.5}
.sidx .up{color:var(--green,#00e07a)} .sidx .dn{color:var(--red,#ff2e55)} .sidx .flat{color:var(--text-dim,#7a969e)}
.sidx-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:14px 0 0}
.sidx-stats>div{background:var(--bg3,#111820);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:3px;padding:8px 10px}
.sidx-stats .k{display:block;font-family:var(--fm,ui-monospace,monospace);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim,#7a969e)}
.sidx-stats .v{display:block;font-family:var(--fd,'Barlow Condensed',sans-serif);font-size:22px;font-weight:700;color:var(--text-head,#e4f0f4);margin-top:2px;line-height:1.1}
.sidx-stats .v i{font-style:normal;font-size:12px;color:var(--text-dim,#7a969e)}
.sidx-tbl{overflow-x:auto;margin-top:14px}
.sidx-tbl table{width:100%;border-collapse:collapse;font-family:var(--fm,ui-monospace,monospace);font-size:12.5px}
.sidx-tbl th{font-family:var(--fd,'Barlow Condensed',sans-serif);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim,#7a969e);text-align:right;padding:8px 8px;border-bottom:1px solid var(--border2,rgba(255,255,255,.14));white-space:nowrap}
.sidx-tbl th:nth-child(2),.sidx-tbl td.nm{text-align:left}
.sidx-tbl td{padding:8px;border-bottom:1px solid var(--border,rgba(255,255,255,.08));text-align:right;white-space:nowrap;vertical-align:middle}
.sidx-tbl td.rk{color:var(--text-dim,#7a969e);width:28px}
.sidx-tbl td.nm b{font-family:var(--fb,Barlow,sans-serif);font-weight:600;color:var(--text-head,#e4f0f4)}
.sidx-tbl td.nm small{display:block;font-size:10.5px;color:var(--text-dim,#7a969e)}
.sidx-tbl td.dim{color:var(--text-dim,#7a969e)}
.sidx-tbl td i{color:var(--sidx);font-style:normal}
.sidx-tbl td.act .sch-track-card{background:transparent;border:1px solid var(--border2,rgba(255,255,255,.14));color:var(--sidx);border-radius:2px;padding:3px 7px;cursor:pointer;font-size:12px}
.sidx-tbl td.act a{color:var(--accent,#00ccf5);font-size:11px;margin-left:6px}
.sidx-more{margin-top:8px}
.sidx-more>summary{cursor:pointer;font-family:var(--fm,ui-monospace,monospace);font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim,#7a969e);padding:8px 0}
.sidx-note{font-size:11.5px;line-height:1.6;color:var(--text-dim,#7a969e);margin:14px 0 0}
.sidx-note a{color:var(--accent,#00ccf5)}
.nm-cell{display:flex;align-items:center;gap:10px}.nm-cell [data-card-img]{flex:0 0 auto}
.sidx-subidx{margin-top:14px;padding:12px 14px;border:1px solid var(--border,rgba(255,255,255,.08));border-left:3px solid var(--sidx);border-radius:3px;background:var(--bg3,#111820)}
.sidx-subidx-h{display:flex;justify-content:space-between;align-items:flex-end;gap:10px 24px;flex-wrap:wrap}
.sidx-subidx h3{font-family:var(--fd,'Barlow Condensed',sans-serif);font-size:20px;font-weight:800;text-transform:uppercase;color:var(--text-head,#e4f0f4);margin:4px 0 4px}
.sidx-subidx h3 small{display:block;font-family:var(--fm,ui-monospace,monospace);font-size:10px;letter-spacing:1px;color:var(--text-dim,#7a969e);text-transform:none;font-weight:400;margin-top:2px}
.sidx-subidx p{margin:0;font-size:12.5px;color:var(--text-dim,#7a969e);line-height:1.5;max-width:640px}
.sidx-subidx-lv{text-align:right}.sidx-subidx-lv .lv{font-family:var(--fm,ui-monospace,monospace);font-size:32px;font-weight:700;color:var(--text-head,#e4f0f4);line-height:1}.sidx-subidx-lv .lvc{font-family:var(--fm,ui-monospace,monospace);font-size:10px;color:var(--text-dim,#7a969e);margin-top:4px}
.sidx-subidx-chips{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 4px}
.sidx-subidx-c{font-family:var(--fm,ui-monospace,monospace);font-size:12px;color:var(--text,#b8cdd4);background:var(--bg2,#0c1017);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:3px;padding:6px 10px}
.sidx-subidx-c b{color:var(--text-head,#e4f0f4);font-weight:600;margin-right:6px}.sidx-subidx-c small{color:var(--text-dim,#7a969e);margin-left:6px}
.idx-chart-sm svg{max-height:160px}
.sidx-auc{margin-top:14px;padding:12px 14px;border:1px solid var(--border,rgba(255,255,255,.08));border-radius:3px;background:var(--bg3,#111820)}
.sidx-auc-h{display:flex;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;align-items:baseline}.sidx-auc-n{font-family:var(--fm,ui-monospace,monospace);font-size:10px;color:var(--text-dim,#7a969e)}
.sidx-auc-l{list-style:none;margin:8px 0 0;padding:0}
.sidx-auc-l li{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px 14px;align-items:center;padding:7px 0;border-top:1px solid var(--border,rgba(255,255,255,.08));font-family:var(--fm,ui-monospace,monospace);font-size:12px}
.sidx-auc-l li:first-child{border-top:0}
.sidx-auc-l .t{color:var(--text-head,#e4f0f4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sidx-auc-l .t small{display:block;color:var(--text-dim,#7a969e);font-size:10.5px}
.sidx-auc-l .b{text-align:right;white-space:nowrap}.sidx-auc-l .b small{display:block;color:var(--text-dim,#7a969e);font-size:10.5px}
.sidx-auc-l a.go{color:#000;background:var(--sidx);padding:5px 9px;border-radius:2px;font-size:10px;letter-spacing:1px;text-transform:uppercase;font-weight:700;white-space:nowrap;text-decoration:none}
.sidx-auc-l li.sidx-auc-e{display:block;color:var(--text-dim,#7a969e);font-size:12px}
.sidx-auc-f{font-size:10.5px;color:var(--text-dim,#7a969e);margin-top:8px;line-height:1.5}.sidx-auc-f a{color:var(--accent,#00ccf5)}
@media(max-width:760px){.sidx{padding:14px 12px 12px}.sidx-subidx-lv{text-align:left}.sidx-auc-l li{grid-template-columns:minmax(0,1fr) auto}.sidx-auc-l a.go{grid-column:1/3;justify-self:start}.sidx-stats{grid-template-columns:repeat(3,1fr)}.sidx-level{text-align:left}.sidx-level .lv{font-size:36px}.sidx-tbl th:nth-child(5),.sidx-tbl td:nth-child(5){display:none}}
</style>`;

function bake(x, c) {
  const file = path.join(ROOT, c.page.slice(1) + ".html");
  let html = fs.readFileSync(file, "utf8");
  const S = `<!-- ${x.ticker}:START -->`, E = `<!-- ${x.ticker}:END -->`;
  const body = `${S}\n${CSS}\n${block(x, c)}\n${E}`;
  if (html.includes(S)) {
    const re = new RegExp(`<!-- ${x.ticker}:START -->[\\s\\S]*?<!-- ${x.ticker}:END -->`);
    html = html.replace(re, () => body);
  } else {
    const anchor = "<!-- BUYBOX:END -->";
    if (!html.includes(anchor)) throw new Error(`${c.page}: no ${anchor} anchor to place the index block after`);
    html = html.replace(anchor, anchor + "\n" + body);
  }
  if (!html.includes('src="/js/index-chart.js')) html = html.replace("</body>", '<script src="/js/index-chart.js?v=1" defer></script>\n</body>');
  if (!html.includes('src="/js/card-img.js')) html = html.replace("</body>", '<script src="/js/card-img.js?v=3" defer></script>\n</body>');
  if (!html.includes('src="/js/sector-auctions.js')) html = html.replace("</body>", '<script src="/js/sector-auctions.js?v=1" defer></script>\n</body>');
  if (!DRY) fs.writeFileSync(file, html);
  console.log(`${DRY ? "would bake" : "baked"} ${c.page} block: ${x.basket.length} rows`);
}

// ---------------- main ----------------
const c = cfg();
const idxPath = path.join(ROOT, "data/indices.json");
const IDX = JSON.parse(fs.readFileSync(idxPath, "utf8"));
const save = () => { if (DRY) { console.log("--dry: indices.json not written"); return; } IDX.updated = TODAY; fs.writeFileSync(idxPath, JSON.stringify(IDX, null, 1) + "\n"); console.log("wrote data/indices.json"); };

if (has("--init")) {
  if (IDX[TICKER] && IDX[TICKER].status === "live" && !has("--force")) { console.error(`${TICKER} is already live — use --mark / --recon (or --force to rebuild, which is a NEW inception)`); process.exit(2); }
  console.log(`universe: reading PriceCharting console ${c.pcSlug} …`);
  const uni = await universe(c);
  console.log(`universe: ${uni.length} slots`);
  const reads = [];
  for (let i = 0; i < uni.length; i++) {
    const s = uni[i];
    try { const r = await readCard(s); reads.push({ ...s, ...r }); console.log(`${String(i + 1).padStart(3)}/${uni.length} ${s.title.padEnd(34)} clean30 ${String(r.clean30).padStart(2)} ${r.price == null ? "" : "$" + r.price}${r.error ? " " + r.error : ""}`); }
    catch (e) { reads.push({ ...s, error: e.message, clean30: 0, price: null }); console.log(`${s.title}: ${e.message}`); }
    await sleep(PAUSE);
  }
  const basket = reads.filter((r) => r.clean30 >= SCREEN.enter && r.price != null).map((r) => ({ num: r.num, name: r.name, path: r.path, price: r.price, n30: r.clean30, basis: "sold (PriceCharting ungraded, 30d median)", asOf: TODAY, w: 1 }));
  applyCap(basket);
  const bv = basketValue(basket), divisor = r4(bv / 100);
  IDX[TICKER] = {
    ticker: TICKER, name: c.name, set: c.set, page: c.page, model: "sector", status: "live", basis: "sold", basisLabel: "sold comps (PriceCharting ungraded) · sector model · twice-weekly re-mark",
    screen: { ...SCREEN, source: "PriceCharting ungraded completed sales, clean single-card rows" }, cap: CAP, capRule: { single: CAP, big: BIG, bigSum: BIG_SUM, name: "25% single-card cap + 5/50 group cap (Select Sector SPDR rule)" }, base: 100, inception: TODAY, releaseDate: c.releaseDate,
    universeComplete: true, pcSlug: c.pcSlug, divisor,
    divisorLog: [{ date: TODAY, before: null, after: divisor, why: `inception — basket $${r2(bv)} over ${basket.length} of ${uni.length} slots; ${basket.filter((b) => b.w < 1).length} capped (25% single / 5-50 group)` }],
    capLog: basket.filter((b) => b.w < 1).map((b) => ({ date: TODAY, num: b.num, name: b.name, w: b.w })),
    screenLog: [{ date: TODAY, pass: basket.length, fail: uni.length - basket.length, errors: reads.filter((r) => r.error).length }],
    universe: uni.map((u) => ({ num: u.num, name: u.name, path: u.path })),
    basket,
    history: [{ date: TODAY, level: 100, basketValue: r2(bv), divisor, priced: basket.length, note: "inception" }],
    reconstitution: { cadence: "quarterly, first Monday of Jan/Apr/Jul/Oct, announced the Monday before", next: "2027-01-04" },
  };
  subInit(IDX[TICKER], c);
  console.log(`${TICKER}: basket ${basket.length}/${uni.length} · value $${r2(bv)} · divisor ${divisor} · capped ${basket.filter((b) => b.w < 1).length} · top ${basket.slice().sort((a, b) => b.price * b.w - a.price * a.w).slice(0, 3).map((b) => `${b.name} #${b.num} ${(b.price * b.w / bv * 100).toFixed(1)}%`).join(" · ")}`);
  save(); bake(IDX[TICKER], c);
} else if (has("--mark")) {
  const x = IDX[TICKER]; if (!x || x.status !== "live") { console.error(`${TICKER} is not live`); process.exit(2); }
  if (has("--if-mark-day")) { const dow = new Date(TODAY + "T12:00:00Z").getUTCDay(); if (dow !== 1 && dow !== 4) { console.log(`${TODAY} is not a mark day (Mon/Thu) — no-op`); process.exit(0); } }
  if (x.history.some((h) => h.date === TODAY)) { console.log(`${TICKER} already marked ${TODAY} — no-op`); process.exit(0); }
  let carried = 0;
  for (const b of x.basket) {
    try {
      const r = await readCard(b);
      b.prevPrice = b.price; b.prevAsOf = b.asOf;
      if (r.price != null) { b.price = r.price; b.asOf = TODAY; b.n30 = r.clean30; b.carried = false; }
      else { b.carried = true; carried++; b.n30 = r.clean30; }     // tail rule: no clean sale in the window → carry the last mark, dated
    } catch (e) { b.carried = true; carried++; console.log(`${b.name} #${b.num}: ${e.message} — carried`); }
    await sleep(PAUSE);
  }
  const level = levelOf(x);
  x.history.push({ date: TODAY, level, basketValue: r2(basketValue(x.basket)), divisor: x.divisor, priced: x.basket.length - carried, note: carried ? `${carried} carried` : "" });
  subMark(x, TODAY);
  console.log(`${TICKER} ${TODAY}: level ${level} (prev ${x.history[x.history.length - 2].level}) · ${carried} carried`);
  save(); bake(x, c);
} else if (has("--recon")) {
  const x = IDX[TICKER]; if (!x || x.status !== "live") { console.error(`${TICKER} is not live`); process.exit(2); }
  const before = levelOf(x), inBasket = new Map(x.basket.map((b) => [b.path, b]));
  const next = [];
  for (const u of x.universe) {
    const cur = inBasket.get(u.path);
    try {
      const r = await readCard(u);
      const keep = cur ? r.clean30 >= SCREEN.stay : r.clean30 >= SCREEN.enter;
      if (keep && r.price != null) next.push({ num: u.num, name: u.name, path: u.path, price: r.price, n30: r.clean30, basis: "sold (PriceCharting ungraded, 30d median)", asOf: TODAY, w: 1, prevPrice: cur ? cur.price : null, prevAsOf: cur ? cur.asOf : null });
      else if (keep && cur) next.push({ ...cur, n30: r.clean30, carried: true });
    } catch (e) { if (cur) next.push({ ...cur, carried: true }); console.log(`${u.name} #${u.num}: ${e.message}`); }
    await sleep(PAUSE);
  }
  applyCap(next);
  const bvNew = basketValue(next), divisor = r4(bvNew / before);          // level identical before and after
  const entered = next.filter((b) => !inBasket.has(b.path)).length, exited = x.basket.filter((b) => !next.some((n) => n.path === b.path)).length;
  x.divisorLog.push({ date: TODAY, before: x.divisor, after: divisor, why: `reconstitution — ${entered} entered, ${exited} exited, ${next.filter((b) => b.w < 1).length} at the cap; level ${before} unchanged` });
  x.capLog.push(...next.filter((b) => b.w < 1).map((b) => ({ date: TODAY, num: b.num, name: b.name, w: b.w })));
  x.screenLog.push({ date: TODAY, pass: next.length, fail: x.universe.length - next.length, entered, exited });
  x.basket = next; x.divisor = divisor;
  x.history.push({ date: TODAY, level: before, basketValue: r2(bvNew), divisor, priced: next.length, note: `reconstitution (+${entered}/−${exited})` });
  subMark(x, TODAY);
  console.log(`${TICKER} reconstitution ${TODAY}: ${next.length} in basket (+${entered}/−${exited}) · divisor ${x.divisor} · level ${before} unchanged`);
  save(); bake(x, c);
} else if (has("--bake")) {
  const x = IDX[TICKER]; if (!x) { console.error(`${TICKER} not in indices.json`); process.exit(2); }
  bake(x, c);
} else { console.error("one of --init | --mark | --recon | --bake"); process.exit(2); }
