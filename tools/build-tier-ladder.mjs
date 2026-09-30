#!/usr/bin/env node
// build-tier-ladder.mjs — the SERIAL TIER LADDER for a Bowman year cohort (Sep 29 2026, Mo: "I approve").
//
// WHAT IT ANSWERS. How much more does scarcity cost, and is that premium growing or shrinking? For each
// numbered tier (/99, /50, /25, /10, /5) of the 1st Bowman Chrome Autos in a cohort index (BOW26), every
// dated ungraded sale is priced as a MULTIPLE of that player's own base-auto mark (the 30-day sold median
// the cohort index already publishes). A Fischer Gold /50 at $1,650 against his $147.50 base is 11.2x.
//
// WHY MULTIPLES, NOT PRICES. A /5 exists in five copies per player, so any single card trades a handful of
// times a year and a per-card index would move on one sale. Pooling every player's sales in a tier fixes the
// count, and dividing by the player's own base makes a $30 prospect and a $150 prospect comparable. High-end
// sales are right-skewed with fat tails, so the tier multiple is exp(median(log multiple)), never a mean.
//
// STATUS. A tier is LIVE when it has >= 20 pooled sales in the trailing 30 days (level + history). Otherwise
// it is a BOARD: the 90-day median multiple when there are >= 5 sales, else "not enough sales". /1
// SuperFractors are never indexed — they feed the 1-of-1 Watch (data/one-of-ones.json) as dated sales.
//
// LEVEL (live tiers only). Base 100 on the tier's first live mark:
//   level = 100 x (cohort level / cohort level at tier inception) x (tier multiple / multiple at inception)
// so it moves when the base market moves AND when the scarcity premium moves, and says which in the table.
//
// DATA. SportsCardsPro public item pages, the "Ungraded" completed-sales table (dates + prices only; titles,
// sellers and item ids never stored, R17; asks never used, R20). Players = the cohort basket's top N by base
// mark. Parallel names map to print runs from the published 2026 checklists (TIER_OF below); Mojo, printing
// plates, unnumbered and retail-only names are excluded rather than guessed.
//
// Usage:
//   node tools/build-tier-ladder.mjs --cohort BOW26 --mark [--if-thursday] [--dry]   read SCP, recompute, bake
//   node tools/build-tier-ladder.mjs --cohort BOW26 --from scan.json [--dry]         use a saved scan (no network)
//   node tools/build-tier-ladder.mjs --cohort BOW26 --bake                          re-bake from data/tiers.json
// Writes data/tiers.json (the cohort's key) and <page>.html between <!-- TIERS:<COHORT>:START/END -->.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consoleCards } from "./price-engine/pc-console.mjs";
import { parsePage } from "./price-engine/sold-marks.mjs";
import { ebaySearchUrl, SACAT_SPORTS, assertClean } from "./lib/epn.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const has = (k) => args.includes(k);
const COHORT = opt("--cohort", "BOW26");
const DRY = has("--dry");
const TODAY = process.env.TIERS_TODAY || new Date().toISOString().slice(0, 10);
const PAUSE = 1600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const days = (d) => (Date.parse(TODAY) - Date.parse(d)) / 864e5;
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mdy = (d) => { const p = String(d).slice(0, 10).split("-"); return `${p[1]}/${p[2]}/${p[0].slice(2)}`; };
const usd = (x) => "$" + Math.round(x).toLocaleString("en-US");
const quant = (s, q) => { const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };

const CONFIG = {
  BOW26: {
    page: "/bowman-1st-chrome-index",
    console: "baseball-cards-2026-bowman-chrome-prospect-autograph",
    players: 40,
    ebay: (tier) => `2026 bowman chrome auto /${tier}`,
    label: "2026 1st Bowman Chrome Autos",
  },
};
const TIERS = [99, 50, 25, 10, 5];
const LIVE_N30 = 20, BOARD_N90 = 5;

// Print runs, 2026 Bowman (May) and 2026 Bowman Chrome (Sep) Chrome Prospect Autographs — the two releases
// share the tier colours. Unlisted names return null and are excluded (never guessed).
export function TIER_OF(par) {
  if (/mojo|printing|black ?white|choice|x-fractor.*blue|^blue|purple|aqua|speckle|yellow|mini-diamond refractor$|^refractor$/i.test(par) && !/superfractor|gold mini/i.test(par)) return null;
  if (/superfractor/i.test(par)) return 1;
  if (/firefractor/i.test(par)) return null;            // /3 — too few to tier
  if (/logofractor/i.test(par)) return null;            // /35 — odd run, excluded
  if (/^red\b|red (lava|x-fractor|shimmer|wave)|reptilian red|gum ?ball|sunflower|peanuts|popcorn/i.test(par)) return 5;
  if (/^black\b|black x-fractor|reptilian black/i.test(par)) return 10;
  if (/orange/i.test(par)) return 25;
  if (/gold/i.test(par)) return 50;
  if (/green/i.test(par)) return 99;
  return null;
}

const IDX = JSON.parse(fs.readFileSync(path.join(ROOT, "data/indices.json"), "utf8"));
const TFILE = path.join(ROOT, "data/tiers.json");
const TD = fs.existsSync(TFILE) ? JSON.parse(fs.readFileSync(TFILE, "utf8")) : { _comment: "GENERATED by tools/build-tier-ladder.mjs — serial tier multiples vs each player's base 1st Bowman Chrome Auto sold mark. Dates and prices only; no titles, sellers or item ids." };

async function getPage(p) {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
  for (let a = 1; a <= 3; a++) {
    const r = await fetch("https://www.pricecharting.com/game/" + p, { headers: { "User-Agent": UA, Accept: "text/html" } });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(6000 * a); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }
  throw new Error("gave up");
}

function players(c) {
  const bk = IDX[COHORT].basket.filter((b) => b.price > 0 && /^CPA/i.test(b.num));
  return bk.sort((a, b) => b.price - a.price).slice(0, c.players);
}

async function scan(c, pl) {
  const cards = await consoleCards(c.console);
  const jobs = [];
  for (const x of cards) {
    const m = x.title.match(/\[([^\]]+)\]/); if (!m) continue;
    const tier = TIER_OF(m[1]); if (!tier) continue;
    const tail = x.path.split("/")[1];
    for (const b of pl) {
      const base = b.path.split("/")[1], num = base.match(/-(cpa-[a-z0-9-]+)$/)[1], pre = base.slice(0, -num.length - 1);
      if (tail.startsWith(pre + "-") && tail.endsWith("-" + num) && tail !== base) jobs.push({ player: base, par: m[1], tier, path: x.path });
    }
  }
  const out = [];
  for (const j of jobs) {
    try { const r = parsePage(await getPage(j.path), "Raw"); out.push({ ...j, sales: (r.sales || []).filter((s) => days(s.d) <= 120) }); }
    catch (e) { out.push({ ...j, err: String(e.message || e) }); }
    await sleep(PAUSE);
  }
  return out;
}

function compute(c, pl, rows) {
  const base = Object.fromEntries(pl.map((b) => [b.path.split("/")[1], b]));
  const coh = IDX[COHORT], cohLevel = coh.history[coh.history.length - 1].level;
  const prev = TD[COHORT] || { tiers: {}, oneOfOne: [] };
  const tiers = {};
  for (const t of TIERS) {
    const sales = [];
    for (const r of rows) if (r.tier === t && !r.err) for (const s of r.sales) {
      const b = base[r.player]; if (!b) continue;
      sales.push({ d: s.d, p: s.p, player: b.name, par: r.par, x: s.p / b.price });
    }
    const s30 = sales.filter((s) => days(s.d) <= 30), s90 = sales.filter((s) => days(s.d) <= 90);
    const win = s30.length >= LIVE_N30 ? s30 : s90, live = s30.length >= LIVE_N30;
    const L = win.map((s) => Math.log(s.x)).sort((a, b) => a - b);
    const o = { tier: t, n30: s30.length, n90: s90.length, players30: new Set(s30.map((s) => s.player)).size, window: live ? 30 : 90, status: live ? "live" : (s90.length >= BOARD_N90 ? "board" : "thin") };
    if (L.length >= (live ? LIVE_N30 : BOARD_N90)) {
      const n = L.length, mu = L.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(L.reduce((a, b) => a + (b - mu) ** 2, 0) / (n - 1));
      o.mult = r2(Math.exp(quant(L, 0.5))); o.p25 = r2(Math.exp(quant(L, 0.25))); o.p75 = r2(Math.exp(quant(L, 0.75)));
      const P = win.map((s) => s.p).sort((a, b) => a - b); o.medPrice = r2(quant(P, 0.5)); o.hi = r2(P[P.length - 1]);
      if (n >= 20 && sd > 0) {                                   // shape of the log multiples — how lopsided and fat-tailed the tier is
        o.skew = r2(L.reduce((a, b) => a + ((b - mu) / sd) ** 3, 0) / n);
        o.kurt = r2(L.reduce((a, b) => a + ((b - mu) / sd) ** 4, 0) / n - 3);
      }
    }
    o.recent = sales.filter((s) => days(s.d) <= 30).sort((a, b) => b.p - a.p).slice(0, 3).map(({ d, p, player, par }) => ({ d, p, player, par }));
    const pt = prev.tiers[t];
    if (live && o.mult) {
      const inc = pt && pt.inception ? pt.inception : { date: TODAY, cohLevel, mult: o.mult };
      o.inception = inc;
      o.level = r2(100 * (cohLevel / inc.cohLevel) * (o.mult / inc.mult));
      o.history = [...((pt && pt.history) || []).filter((h) => h.date !== TODAY), { date: TODAY, level: o.level, mult: o.mult, n30: o.n30 }].slice(-120);
    } else if (pt && pt.inception) { o.inception = pt.inception; o.history = pt.history; }  // a live tier that goes thin keeps its history; no level printed until it is live again
    tiers[t] = o;
  }
  const one = [];
  for (const r of rows) if (r.tier === 1 && !r.err) for (const s of r.sales) {
    const b = base[r.player]; if (b) one.push({ d: s.d, p: s.p, player: b.name, par: r.par, base: b.price });
  }
  return { cohort: COHORT, asOf: TODAY, cohLevel, players: pl.length, cards: rows.length, errors: rows.filter((r) => r.err).length, tiers, oneOfOne: one.sort((a, b) => (a.d < b.d ? 1 : -1)) };
}

function bake(c, T) {
  const cid = (k) => `tiers-${COHORT.toLowerCase()}-${k}`;
  const rows = TIERS.map((t) => {
    const o = T.tiers[t];
    const url = assertClean(ebaySearchUrl({ q: c.ebay(t), customid: cid(t), sacat: SACAT_SPORTS, av: true }));
    const st = o.status === "live" ? `<span class="tl-st live">Index</span>` : o.status === "board" ? `<span class="tl-st board">Board</span>` : `<span class="tl-st thin">Thin</span>`;
    const mult = o.mult ? `<b>${o.mult.toFixed(1)}×</b><small>${o.p25.toFixed(1)}–${o.p75.toFixed(1)}× middle half</small>` : `<span class="tl-na">not enough sales</span>`;
    const lvl = o.status === "live" && o.level != null ? `<b>${o.level.toFixed(2)}</b>` : `<span class="tl-na">${o.n30}/${LIVE_N30} sales to go live</span>`;
    const px = o.medPrice ? `<span class="roi-price">${usd(o.medPrice)}</span><small>median, ${o.window}d</small>` : `<span class="tl-na">No verified sale</span>`;
    const shape = o.skew != null ? `<small>skew ${o.skew.toFixed(2)} · kurt ${o.kurt.toFixed(2)}</small>` : "";
    return `<tr><td class="tl-t">/${t}</td><td>${st}</td><td class="tl-m">${mult}${shape}</td><td>${px}</td><td class="tl-n">${o.n30} <small>30d</small> · ${o.n90} <small>90d</small></td><td>${lvl}</td><td class="act"><a class="auc" href="${url}" target="_blank" rel="sponsored nofollow noopener" data-evt="tier_click" data-tier="${t}">Shop /${t} →</a></td></tr>`;
  }).join("\n");
  const top = TIERS.flatMap((t) => T.tiers[t].recent.map((r) => ({ ...r, t }))).sort((a, b) => b.p - a.p).slice(0, 5);
  const tape = top.length ? top.map((r) => `<li><b>${usd(r.p)}</b> ${esc(r.player)} ${esc(r.par)} /${r.t} <small>sold ${mdy(r.d)}</small></li>`).join("") : "<li>No numbered sale in the last 30 days.</li>";
  return `<!-- TIERS:${COHORT}:START -->
<style id="tl-css">
.tl{margin:22px 0 0;border:1px solid var(--border,rgba(255,255,255,.08));background:var(--bg2,#0c1017);padding:16px 16px 12px;font-family:var(--fb,Barlow,system-ui,sans-serif);color:var(--text,#b8cdd4)}
.tl-eyebrow{font-family:var(--fm,ui-monospace,monospace);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--gold,#f5c800)}
.tl h2{font-family:var(--fd,'Barlow Condensed',sans-serif);font-size:clamp(22px,3vw,30px);font-weight:900;text-transform:uppercase;color:var(--text-head,#e4f0f4);margin:6px 0 6px;line-height:1.05}
.tl p{font-size:13px;line-height:1.55;margin:0 0 10px;max-width:680px;color:var(--text-dim,#7a969e)}
.tl-wrap{overflow-x:auto}
.tl table{width:100%;border-collapse:collapse;font-family:var(--fm,ui-monospace,monospace);font-size:12.5px;min-width:640px}
.tl th{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-dim,#7a969e);text-align:left;padding:8px 10px;border-bottom:1px solid var(--border,rgba(255,255,255,.08));font-weight:400}
.tl td{padding:10px;border-bottom:1px solid var(--border,rgba(255,255,255,.06));vertical-align:middle}
.tl td small{display:block;font-size:9.5px;color:var(--text-dim,#7a969e);margin-top:2px}
.tl-t{font-size:18px;font-weight:700;color:var(--text-head,#e4f0f4)}
.tl-m b{font-size:16px;color:var(--gold,#f5c800)}
.tl-na{color:var(--text-dim,#7a969e);font-size:11px}
.tl-st{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;padding:3px 7px;border-radius:2px;border:1px solid currentColor}
.tl-st.live{color:var(--green,#00e07a)} .tl-st.board{color:var(--accent,#00ccf5)} .tl-st.thin{color:var(--text-dim,#7a969e)}
.tl a.auc{display:inline-block;font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#000;background:var(--gold,#f5c800);padding:7px 10px;border-radius:2px;text-decoration:none;white-space:nowrap;min-height:30px;line-height:16px}
.tl-tape{margin:12px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px 18px;font-family:var(--fm,ui-monospace,monospace);font-size:11.5px}
.tl-tape b{color:var(--text-head,#e4f0f4)} .tl-tape small{color:var(--text-dim,#7a969e)}
.tl-f{font-family:var(--fm,ui-monospace,monospace);font-size:9.5px;color:var(--text-dim,#7a969e);margin-top:10px;line-height:1.6}
.tl-f a{color:var(--accent,#00ccf5)}
</style>
<section class="tl" id="tiers" data-prices-updated="${T.asOf}" data-prices-ttl="10">
<div class="tl-eyebrow">Serial tier ladder · ${esc(c.label)}</div>
<h2>What scarcity costs: /99 to /5</h2>
<p>Each numbered sale is priced as a multiple of that player's own base 1st Bowman Chrome Auto sold mark, then pooled across the top ${T.players} players. A tier becomes an index at ${LIVE_N30} sales in 30 days; until then it is a board. 1-of-1 SuperFractors are left out: one copy cannot make a tier.</p>
<div class="tl-wrap"><table>
<thead><tr><th>Tier</th><th>Status</th><th>Multiple of base</th><th>Typical sale</th><th>Sales</th><th>Level</th><th></th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
<ul class="tl-tape">${tape}</ul>
<div class="tl-f">Sold comps (SportsCardsPro ungraded, dated sales) as of ${mdy(T.asOf)}, read from SportsCardsPro item pages; re-read weekly by hand (the source blocks automated reads). Multiple = median of log(sale ÷ player's base mark); middle half = 25th–75th percentile. Skew and kurtosis are of the log multiples, shown once a tier has 20+ sales. ${T.cards} parallel cards read${T.errors ? `, ${T.errors} unreadable this run` : ""}. Shop links are eBay searches (affiliate), not prices.</div>
</section>
<!-- TIERS:${COHORT}:END -->`;
}

function writeBlock(c, block) {
  const file = path.join(ROOT, c.page.replace(/^\//, "") + ".html");
  let h = fs.readFileSync(file, "utf8");
  const re = new RegExp(`<!-- TIERS:${COHORT}:START -->[\\s\\S]*?<!-- TIERS:${COHORT}:END -->`);
  if (re.test(h)) h = h.replace(re, block);
  else {
    const end = `<!-- ${COHORT}:END -->`;
    if (!h.includes(end)) throw new Error(`no ${end} marker on ${file}`);
    h = h.replace(end, end + "\n" + block);
  }
  if (!DRY) fs.writeFileSync(file, h);
  return file;
}

const c = CONFIG[COHORT]; if (!c) { console.error("unknown cohort " + COHORT); process.exit(2); }
if (has("--if-thursday") && new Date(TODAY + "T12:00:00Z").getUTCDay() !== 4) { console.log("not Thursday — tier ladder skipped"); process.exit(1); }
let T;
if (has("--bake")) T = TD[COHORT];
else {
  const pl = players(c);
  const rows = (has("--from") ? JSON.parse(fs.readFileSync(opt("--from"), "utf8")) : await scan(c, pl))
    .map((r) => ({ ...r, tier: TIER_OF(r.par) })).filter((r) => r.tier);   // one tier map, whatever produced the rows
  T = compute(c, pl, rows);
  TD[COHORT] = T;
  if (!DRY) fs.writeFileSync(TFILE, JSON.stringify(TD, null, 1) + "\n");
}
const f = writeBlock(c, bake(c, T));
console.log(`${COHORT} tiers ${DRY ? "(dry) " : ""}→ ${path.relative(ROOT, f)}`);
for (const t of TIERS) { const o = T.tiers[t]; console.log(`  /${t}: ${o.status} n30=${o.n30} n90=${o.n90} mult=${o.mult ?? "-"} level=${o.level ?? "-"}`); }
console.log(`  1/1 sales logged: ${T.oneOfOne.length}`);
