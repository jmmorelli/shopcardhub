#!/usr/bin/env node
// tools/build-home-v2.mjs — generates home-v2.html, the Seeking-Alpha-style home PREVIEW (P0-B, Oct 23 2026).
//
// Why: Mo, Oct 23 (claude/cos/DESIGN-DIRECTIVE-2026-10-23.md §1): the live home reads as "an Excel sheet of indices …
// a weird terminal thing for robots to read". This page is the §4 P0-B spec row by row — search first, one small index
// box with category tabs and a mini chart you click through, Coming out beside it, four one-question tiles, the Tape.
// It is a PREVIEW: noindex, not in the nav, not in the sitemap. Mo reviews it at /home-v2 before it replaces /.
//
// Every figure comes from repo data: data/indices.json (levels, history, recon, baskets), data/releases.json,
// data/feed/deals-latest.json (at rest; the page refreshes from /api/deals), /api/auctions (client-side, like /auctions),
// data/cards/*.json (card ids + the 12-month shape behind each mover), js/home.js SEALED map + data/buy-strip.json
// (the sealed eBay link per ticker). Shell (tokens, nav, footer, gtag) comes from how-prices-work.html, the rail block
// from index.html — exactly like tools/build-deals.mjs / build-auctions.mjs. Nothing here writes index.html.
//
//   node tools/build-home-v2.mjs          # writes home-v2.html
//   node tools/build-home-v2.mjs --dry
//
// Productionizing (when Mo says yes): the IDX / MOVERS / RELEASES / DEALS payloads below become HOME:* blocks that
// tools/build-home.mjs writes on the Monday/Thursday bakes — see the report filed with this commit.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const exists = (f) => fs.existsSync(path.join(REPO, f));
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TODAY = process.env.HOME_TODAY || new Date().toISOString().slice(0, 10);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const mdy = (d) => { if (!d) return ""; const p = String(d).slice(0, 10).split("-"); return `${MON[+p[1] - 1]} ${+p[2]}`; };
const mly = (ym) => { const p = String(ym).split("-"); return `${MON[+p[1] - 1]} ’${p[0].slice(2)}`; };

/* ---------- shell ---------- */
const SHELL = read("how-prices-work.html");
const pageCss = (SHELL.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
const gtag = (SHELL.match(/(<!-- Google Analytics[\s\S]*?<\/script>)/) || [])[1];
const nav = (SHELL.match(/(<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->)/) || [])[1];
const footer = (SHELL.match(/(<footer>[\s\S]*?<\/footer>)/) || [])[1];
const rail = (read("index.html").match(/(<!-- RAIL:START -->[\s\S]*?<!-- RAIL:END -->)/) || [])[1];
if (!pageCss || !gtag || !nav || !footer || !rail) throw new Error("shell pieces not found (how-prices-work.html / index.html)");

/* ---------- eBay search links: the same EPN format js/home.js uses on the board (search links only, no figure) ---------- */
const EPN_Q = "LH_BIN=1&mkevt=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001";
const ebaySearch = (q, customid, sacat) => "https://www.ebay.com/sch/i.html?_nkw=" + encodeURIComponent(q).replace(/%20/g, "+").replace(/'/g, "%27").replace(/[!()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()) + (sacat ? "&_sacat=" + sacat : "") + "&" + EPN_Q + "&customid=" + customid;
// the SEALED map lives in js/home.js (one source for "the product the ticker's own page sells"); parse it rather than copy it
const SEALED = (() => {
  const m = read("js/home.js").match(/var SEALED = (\{[\s\S]*?\n  \});/);
  if (!m) throw new Error("js/home.js: SEALED map not found");
  return Function(`"use strict"; return (${m[1]});`)();
})();
const BUYSTRIP = JSON.parse(read("data/buy-strip.json")).pages || {};

/* ---------- the index box ---------- */
const idx = JSON.parse(read("data/indices.json"));
const marksOnly = (h) => (Array.isArray(h) ? h : []).filter((r) => r && r.kind !== "divisor" && r.level > 0 && r.date);
// "this week" = the newest mark at least 5 days before the latest (tools/build-sector-index.mjs weekBase, iw-2026-10-03-1)
function weekBase(h) {
  if (h.length < 2) return null;
  const last = h[h.length - 1];
  for (let i = h.length - 2; i >= 0; i--) if ((new Date(last.date) - new Date(h[i].date)) / 864e5 >= 5) return h[i];
  return null;
}
function tabOf(tk, v) {
  if (/^(BOW|BB|BCB|BCS|BD)/.test(tk)) return "bbb";
  if (/^BF/.test(tk)) return "bfb";
  if (/1E$|^BSSL$/.test(tk)) return "p1e";
  return (v.releaseDate || "9999") < "2004-01-01" ? "pcl" : "pmo";
}
const TABS = [
  { id: "pmo", label: "Pokémon Modern", sort: (a, b) => (b.rd || "").localeCompare(a.rd || "") },
  { id: "pcl", label: "Pokémon Classic", sort: (a, b) => (a.rd || "").localeCompare(b.rd || "") },
  { id: "p1e", label: "1st Edition & Shadowless", sort: (a, b) => (a.rd || "").localeCompare(b.rd || "") || a.tk.localeCompare(b.tk) },
  { id: "bbb", label: "Bowman Baseball", sort: (a, b) => (b.rd || "").localeCompare(a.rd || "") },
  { id: "bfb", label: "Bowman Football", sort: (a, b) => (b.rd || "").localeCompare(a.rd || "") },
];
const cardsFile = (tk) => { const f = `data/cards/${tk.toLowerCase()}.json`; return exists(f) ? JSON.parse(read(f)) : null; };
function buyFor(tk, v) {
  const slug = String(v.page || "").replace(/^\//, "");
  if (SEALED[tk]) return { l: `Buy ${/box/i.test(SEALED[tk].l) ? "a box" : "an ETB"} on eBay →`, h: ebaySearch(SEALED[tk].q, "home2-" + tk.toLowerCase()) };
  const bs = BUYSTRIP[slug];
  if (bs && bs.primary && bs.primary.q) return { l: "Buy a box on eBay →", h: ebaySearch(bs.primary.q, "home2-" + tk.toLowerCase()) };
  const cf = cardsFile(tk);
  const top = cf && (cf.cards || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
  if (top && top.q) return { l: `Shop ${top.name} #${top.num} on eBay →`, h: ebaySearch(top.q, "home2-" + tk.toLowerCase(), "183454") };
  return null;
}
const T = {};
const tabRows = Object.fromEntries(TABS.map((t) => [t.id, []]));
for (const [tk, v] of Object.entries(idx)) {
  if (!v || typeof v !== "object" || v.status !== "live") continue;
  const h = marksOnly(v.history);
  if (!h.length) continue;
  const last = h[h.length - 1], prev = weekBase(h);
  const rc = (v.recon || []).filter((r) => r && r.level > 0 && r.month);
  const buy = buyFor(tk, v);
  const rd = v.releaseDate || "";
  const since = last.level - 100;
  const sinceLbl = v.baseRule === "first-reliable" && v.baseDate ? "since " + mly(v.baseDate) : "since release";
  T[tk] = {
    n: String(v.name || tk).replace(/\s+Chase\s+Index$/i, "").replace(/\s+Index$/i, "").replace(/^((?!Base Set$).*)\s+Set$/i, "$1"),
    p: v.page || "/indices",
    l: +last.level.toFixed(2), d: last.date,
    w: prev ? +((last.level / prev.level - 1) * 100).toFixed(2) : null, wd: prev ? prev.date : null,
    s: +since.toFixed(2), sl: sinceLbl, bd: v.baseDate || null, br: v.baseRule || null, rd,
    h: h.map((r) => [r.date, +r.level.toFixed(2)]),
    r: rc.map((r) => [r.month, +Number(r.level).toFixed(2)]),
    buy,
  };
  tabRows[tabOf(tk, v)].push({ tk, rd });
}
const tabs = TABS.map((t) => ({ id: t.id, label: t.label, rows: tabRows[t.id].sort(t.sort).map((r) => r.tk) })).filter((t) => t.rows.length);
if (!tabs.length) throw new Error("no live index with a mark — nothing to show");
const DEFAULT_TK = tabs[0].rows[0];
if (!T[DEFAULT_TK].buy) throw new Error(`default ticker ${DEFAULT_TK} has no eBay link — the above-fold rule needs one`);
const liveN = Object.keys(T).length;
const tabSummary = tabs.map((t) => `${t.label} ${t.rows.length}`).join(" · ");
const dropped = TABS.filter((t) => !tabRows[t.id].length).map((t) => t.label);

/* ---------- movers: every basket card's latest mark vs its previous mark (data/indices.json prevPrice, Aug 31 addendum) ---------- */
const cardIdOf = (tk, b) => {
  const cf = cardsFile(tk); if (!cf) return null;
  const hit = (cf.cards || []).find((c) => String(c.num) === String(b.num) && String(c.name).toLowerCase() === String(b.name).toLowerCase()) || (cf.cards || []).find((c) => String(c.num) === String(b.num));
  return hit ? hit.id : null;
};
const hist = {};
const shapeOf = (tk, num) => {
  const f = `data/cards/h-${tk.toLowerCase()}.json`;
  if (!(tk in hist)) hist[tk] = exists(f) ? JSON.parse(read(f)).cards || {} : {};
  const s = hist[tk][String(num)]; if (!Array.isArray(s)) return null;
  const pts = s.slice(-12).map((r) => r[1]).filter((x) => x != null && isFinite(x));
  return pts.length >= 4 ? pts.map((x) => +Number(x).toFixed(2)) : null;
};
let cands = [];
for (const [tk, v] of Object.entries(idx)) {
  if (!v || typeof v !== "object" || v.status !== "live" || !T[tk]) continue;
  for (const b of v.basket || []) {
    if (!b || !b.prevPrice || !b.price || b.carried || b.price < 25 || !(b.n30 >= 5) || b.prevAsOf === b.asOf) continue;
    const chg = (b.price / b.prevPrice - 1) * 100;
    if (!isFinite(chg) || Math.abs(chg) < 0.5) continue;
    const id = cardIdOf(tk, b);
    cands.push({ tk, set: T[tk].n, name: b.name, num: String(b.num), p: b.price, pp: b.prevPrice, d: b.asOf, pd: b.prevAsOf, n: b.n30, win: b.win || null, chg: +chg.toFixed(1), href: id ? "/card?id=" + id : T[tk].p, sp: shapeOf(tk, b.num) });
  }
}
cands.sort((a, b) => b.chg - a.chg);
const MOVERS = { up: cands.slice(0, 5), down: cands.slice(-5).reverse(), n: cands.length };

/* ---------- Coming out: data/releases.json (the file the live home already bakes) ---------- */
const releases = JSON.parse(read("data/releases.json"));
const RELEASES = (releases.items || []).filter((r) => r && /^\d{4}-\d{2}-\d{2}$/.test(r.date || "") && r.date >= TODAY)
  .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8).map((r, i) => {
    const page = r.href && exists(String(r.href).split("#")[0].replace(/^\//, "") + ".html") ? r.href : null;
    const q = r.q || r.label;
    return { date: r.date, day: mdy(r.date), label: r.label, kind: r.family === "pokemon" ? "Pokémon" : (r.sport === "MLB" ? "Baseball" : r.sport === "NFL" ? "Football" : r.sport === "NBA" ? "Basketball" : r.sport || "Sports"), status: r.status || "", href: page || ebaySearch(q, "home2-rel-" + (i + 1), r.cat ? String(r.cat) : ""), page: !!page };
  });

/* ---------- Below the mark: rendered client-side from /api/deals (the same feed /deals reads); nothing baked ---------- */
let DEALS_N = 0;
try { DEALS_N = (JSON.parse(read("data/feed/deals-latest.json")).rows || []).length; } catch (e) { console.error("deals feed unreadable: " + e.message); }

/* ---------- set pages for the search fallback ---------- */
const SETS = Object.entries(T).map(([tk, v]) => ({ t: v.n, tk, u: v.p })).concat(
  Object.entries(idx).filter(([k, v]) => v && typeof v === "object" && v.status === "pre" && v.page && exists(String(v.page).replace(/^\//, "") + ".html")).map(([k, v]) => ({ t: String(v.name || k).replace(/\s+Index$/i, ""), tk: k, u: v.page }))
);

const PAYLOAD = { today: TODAY, def: DEFAULT_TK, tabs, t: T, movers: MOVERS, releases: RELEASES, sets: SETS };
const cadenceStamp = idx.updated || TODAY;

/* ---------- page ---------- */
const CSS = `
.h2 { padding:14px 22px 48px; min-width:0; }
.h2 section { padding:0; border-top:0; animation:none; margin:0 0 22px; }
.h2 h2 { font-family:var(--fd); font-size:20px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-head); margin:0; line-height:1.1; }
.h2 .q { display:flex; align-items:baseline; justify-content:space-between; gap:10px 16px; flex-wrap:wrap; margin-bottom:10px; }
.h2 .q a.all { font-family:var(--fm); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--accent); white-space:nowrap; }
.h2 .q small { font-family:var(--fm); font-size:11px; color:var(--text-dim); }
.up { color:var(--green); } .dn { color:var(--red); } .fl { color:var(--text-dim); }

/* row 1 — search */
.h2-ask h1 { font-family:var(--fd); font-size:clamp(26px,4.4vw,40px); font-weight:900; text-transform:uppercase; line-height:1; letter-spacing:-0.3px; color:var(--text-head); margin:0 0 10px; }
.h2-ask h1 em { font-style:normal; color:var(--accent); }
.h2-sbox { position:relative; max-width:760px; }
.h2-sbox input { width:100%; min-height:54px; padding:12px 54px 12px 18px; font-family:var(--fb); font-size:18px; color:var(--text-head); background:var(--bg2); border:1px solid var(--border2); border-radius:3px; outline:none; -webkit-appearance:none; }
.h2-sbox input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
.h2-sbox input::placeholder { color:var(--text-dim); }
.h2-sbox .go { position:absolute; right:6px; top:6px; bottom:6px; width:44px; border:0; background:var(--accent); color:#000; font-size:18px; border-radius:2px; cursor:pointer; }
.h2-sres { position:absolute; left:0; right:0; top:calc(100% + 4px); z-index:150; background:rgba(7,9,12,0.98); border:1px solid var(--border2); border-top:2px solid var(--accent); display:none; max-height:min(60vh,420px); overflow:auto; }
.h2-sres.show { display:block; }
.h2-sres a { display:flex; justify-content:space-between; gap:12px; align-items:baseline; padding:10px 14px; color:var(--text); font-size:14px; border-bottom:1px solid var(--border); }
.h2-sres a:hover, .h2-sres a.sel { background:rgba(0,204,245,0.06); color:var(--text-head); text-decoration:none; }
.h2-sres a small { color:var(--text-dim); font-size:12px; margin-left:6px; }
.h2-sres a b { font-family:var(--fd); font-size:16px; color:var(--text-head); white-space:nowrap; } .h2-sres a b small { font-family:var(--fm); font-size:10px; margin-left:4px; }
.h2-sres .hd { font-family:var(--fm); font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--accent); padding:8px 14px 2px; }
.h2-sres .none { padding:12px 14px; font-size:13px; color:var(--text-dim); }
.h2-hint { font-family:var(--fm); font-size:11px; color:var(--text-dim); margin-top:8px; letter-spacing:0.3px; }
.h2-hint a { color:var(--text-dim); border-bottom:1px dotted var(--text-dim); } .h2-hint a:hover { color:var(--accent); }

/* row 2 — index box + coming out */
.h2-r2 { display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:18px; align-items:start; }
.h2-box { background:var(--bg2); border:1px solid var(--border2); border-radius:3px; overflow:hidden; }
.h2-tabs { display:flex; gap:0; overflow-x:auto; scrollbar-width:none; border-bottom:1px solid var(--border2); background:var(--bg3); }
.h2-tabs::-webkit-scrollbar { display:none; }
.h2-tab { flex:0 0 auto; font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-dim); background:none; border:0; border-bottom:2px solid transparent; padding:12px 14px 10px; cursor:pointer; white-space:nowrap; min-height:42px; }
.h2-tab:hover { color:var(--text-head); }
.h2-tab[aria-selected="true"] { color:var(--text-head); border-bottom-color:var(--accent); }
.h2-body { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
.h2-list { border-right:1px solid var(--border2); max-height:372px; overflow-y:auto; scrollbar-width:thin; }
.h2-list table { width:100%; border-collapse:collapse; table-layout:fixed; }
.h2-list tr { cursor:pointer; }
.h2-list tr:hover td { background:rgba(255,255,255,0.03); }
.h2-list tr[aria-selected="true"] td { background:var(--accent-dim); box-shadow:inset 3px 0 0 var(--accent); }
.h2-list td { padding:9px 10px; border-bottom:1px solid var(--border); font-size:13.5px; vertical-align:middle; line-height:1.2; white-space:nowrap; }
.h2-list td.nm { color:var(--text-head); font-weight:600; white-space:normal; line-height:1.15; overflow:hidden; }
.h2-list td.nm small { display:block; font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:1px; color:var(--text-dim); margin-top:2px; }
.h2-list td.lv { font-family:var(--fd); font-size:18px; font-weight:800; color:var(--text-head); text-align:right; font-variant-numeric:tabular-nums; width:64px; }
.h2-list td.wk { font-family:var(--fm); font-size:12px; font-weight:700; text-align:right; font-variant-numeric:tabular-nums; width:130px; }
.h2-list td.wk small { display:block; font-weight:400; font-size:10px; letter-spacing:0; color:var(--text-dim); margin-top:2px; }
.h2-viz { padding:12px 14px 10px; min-width:0; }
.h2-vh { display:flex; justify-content:space-between; align-items:flex-start; gap:8px 12px; flex-wrap:wrap; }
.h2-vh .nm { font-family:var(--fd); font-size:20px; font-weight:800; text-transform:uppercase; color:var(--text-head); line-height:1.05; }
.h2-vh .nm small { display:block; font-family:var(--fm); font-size:10px; letter-spacing:1.5px; color:var(--text-dim); margin-top:3px; text-transform:uppercase; }
.h2-vh .lv { text-align:right; }
.h2-vh .lv b { display:block; font-family:var(--fd); font-size:34px; font-weight:900; color:var(--text-head); line-height:0.95; font-variant-numeric:tabular-nums; }
.h2-vh .lv span { font-family:var(--fm); font-size:12px; font-weight:700; }
.h2-vh .lv small { font-family:var(--fm); font-size:10px; color:var(--text-dim); margin-left:6px; font-weight:400; }
.h2-rng { display:flex; gap:4px; margin:8px 0 2px; }
.h2-rng button { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1px; color:var(--text-dim); background:none; border:1px solid var(--border); padding:5px 10px; cursor:pointer; min-height:28px; border-radius:2px; }
.h2-rng button[aria-pressed="true"] { color:#000; background:var(--accent); border-color:var(--accent); }
.h2-rng button[hidden] { display:none; }
.h2-chart svg { display:block; width:100%; height:auto; }
.h2-chart .g { stroke:var(--border2); stroke-width:1; }
.h2-chart .ref { stroke:var(--text-dim); stroke-width:1; stroke-dasharray:3 4; }
.h2-chart .ln { fill:none; stroke-width:2.2; stroke:var(--green); stroke-linejoin:round; stroke-linecap:round; } .h2-chart.dn .ln { stroke:var(--red); }
.h2-chart .ln.rc { stroke-dasharray:5 4; opacity:0.65; stroke-width:1.8; }
.h2-chart .ar { fill:var(--green); opacity:0.08; } .h2-chart.dn .ar { fill:var(--red); }
.h2-chart .dot { fill:var(--green); } .h2-chart.dn .dot { fill:var(--red); }
.h2-chart text { font-family:var(--fm); font-size:10px; fill:var(--text-dim); }
.h2-chart text.last { fill:var(--text-head); font-weight:700; font-size:11px; }
.h2-cap { display:flex; justify-content:space-between; gap:8px 14px; flex-wrap:wrap; font-family:var(--fm); font-size:10px; letter-spacing:0.5px; color:var(--text-dim); margin-top:4px; }
.h2-cap i { display:inline-block; width:14px; height:0; border-top:2px solid var(--text-head); vertical-align:middle; margin-right:4px; } .h2-cap i.rc { border-top-style:dashed; border-color:var(--text-dim); }
.h2-act { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:10px; }
.h2-buy { display:inline-flex; align-items:center; font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; background:var(--gold); color:#000; padding:11px 14px; min-height:40px; border-radius:2px; }
.h2-buy:hover { background:#fff; color:#000; text-decoration:none; }
.h2-open { font-family:var(--fm); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--accent); padding:10px 4px; }
.h2-foot { font-size:13px; color:var(--text-dim); padding:10px 14px; border-top:1px solid var(--border); display:flex; justify-content:space-between; gap:6px 14px; flex-wrap:wrap; }
.h2-foot a { color:var(--accent); }
.h2-rel { background:var(--bg2); border:1px solid var(--border2); border-radius:3px; padding:12px 14px 6px; }
.h2-rel ol { list-style:none; margin:0; padding:0; }
.h2-rel li { display:grid; grid-template-columns:52px minmax(0,1fr) auto; gap:10px; align-items:baseline; padding:9px 0; border-bottom:1px solid var(--border); font-size:14px; }
.h2-rel li:last-child { border-bottom:0; }
.h2-rel .dt { font-family:var(--fd); font-size:16px; font-weight:800; color:var(--text-head); white-space:nowrap; }
.h2-rel .lb a, .h2-rel .lb span.n { color:var(--text-head); font-weight:600; }
.h2-rel .lb a:hover { color:var(--accent); }
.h2-rel .lb small { display:block; font-family:var(--fm); font-size:10px; color:var(--text-dim); letter-spacing:0.5px; margin-top:2px; }
.h2-rel .kd { font-family:var(--fm); font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); border:1px solid var(--border); padding:2px 6px; border-radius:2px; white-space:nowrap; }
.h2-rel .kd.pk { color:var(--gold); border-color:rgba(245,200,0,0.4); }
.h2-rel .go { font-family:var(--fm); font-size:10px; color:var(--text-dim); }

/* row 3 — tiles */
.h2-tiles { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
.h2-tile { background:var(--bg2); border:1px solid var(--border2); border-radius:3px; padding:12px 14px 10px; min-width:0; }
.h2-tile ul { list-style:none; margin:0; padding:0; }
.h2-tile li { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 12px; align-items:center; padding:8px 0; border-bottom:1px solid var(--border); font-size:14px; min-height:44px; }
.h2-tile li:last-child { border-bottom:0; }
.h2-tile li .nm { min-width:0; }
.h2-tile li .nm a, .h2-tile li .nm b { color:var(--text-head); font-weight:600; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.h2-tile li .nm a:hover { color:var(--accent); }
.h2-tile li .nm small { display:block; font-family:var(--fm); font-size:10px; color:var(--text-dim); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.h2-tile li .rt { display:flex; align-items:center; gap:10px; justify-content:flex-end; white-space:nowrap; }
.h2-tile li .px { font-family:var(--fd); font-size:17px; font-weight:800; color:var(--text-head); font-variant-numeric:tabular-nums; }
.h2-tile li .ch { font-family:var(--fm); font-size:12px; font-weight:700; min-width:58px; text-align:right; font-variant-numeric:tabular-nums; }
.h2-tile li svg.sp { width:64px; height:22px; display:block; }
.h2-tile li svg.sp path { fill:none; stroke-width:1.6; stroke:var(--text-dim); }
.h2-tile .btn { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; background:var(--green); color:#000; padding:8px 10px; border-radius:2px; min-height:34px; display:inline-flex; align-items:center; }
.h2-tile .btn:hover { background:#fff; color:#000; text-decoration:none; }
.h2-tile .btn.bid { background:var(--accent); }
.h2-tile .empty { font-size:13px; color:var(--text-dim); line-height:1.6; padding:10px 0; }
.h2-tile .empty a { color:var(--accent); }
.h2-tile .tog { display:inline-flex; border:1px solid var(--border); border-radius:2px; overflow:hidden; }
.h2-tile .tog button { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); background:none; border:0; padding:6px 10px; cursor:pointer; min-height:28px; }
.h2-tile .tog button[aria-pressed="true"] { color:#000; background:var(--text-head); }
.h2-g { font-family:var(--fm); font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:1px 5px; border:1px solid var(--border2); color:var(--text); margin-right:5px; vertical-align:middle; }
.h2-g.psa10 { color:var(--gold); border-color:rgba(245,200,0,0.5); } .h2-g.psa9 { color:var(--accent); border-color:rgba(0,204,245,0.5); }

/* row 4 */
.h2-tape { background:var(--bg2); border:1px solid var(--border2); border-radius:3px; padding:14px 14px 6px; }
.h2-tape p { font-size:14px; color:var(--text-dim); margin:0 0 4px; }
.h2-tape p b { color:var(--text-head); }
.h2-tape .sch-signup { padding:0; margin:0; max-width:none; }
.h2-disc { font-size:12.5px; color:var(--text-dim); line-height:1.65; border-left:3px solid var(--text-dim); padding:10px 14px; background:var(--bg3); margin-top:18px; }
.h2-disc b { color:var(--text); }

@media (max-width:1100px) { .h2-body { grid-template-columns:minmax(0,1fr); } .h2-list { border-right:0; border-top:1px solid var(--border2); max-height:300px; } .h2-viz { order:-1; } }
@media (max-width:900px) { .h2-r2 { grid-template-columns:minmax(0,1fr); } .h2-tiles { grid-template-columns:minmax(0,1fr); } }
@media (max-width:820px) {
  .h2 { padding:10px 14px 36px; }
  .h2-ask h1 { font-size:24px; }
  .h2-sbox input { font-size:16px; min-height:50px; }
  .h2-vh .lv b { font-size:30px; }
  .h2-list td { font-size:13px; padding:9px 8px; } .h2-list td.lv { font-size:16px; width:58px; } .h2-list td.wk { width:118px; }
  .h2-tile li .ch { min-width:52px; } .h2-tile li svg.sp { width:48px; }
  .h2-rel li { grid-template-columns:48px minmax(0,1fr) auto; font-size:13px; } .h2-rel .dt { font-size:14px; }
}
@media (prefers-reduced-motion: reduce) { .h2 * { animation:none !important; transition:none !important; } }
`;

const relHtml = RELEASES.length ? RELEASES.map((r) => `<li><span class="dt">${esc(r.day)}</span><span class="lb">${r.page ? `<a href="${esc(r.href)}">${esc(r.label)}</a>` : `<a href="${esc(r.href)}" target="_blank" rel="noopener sponsored">${esc(r.label)}</a>`}<small>${esc(r.kind)}${r.status === "reported" ? " · reported date" : r.status === "expected" ? " · expected" : ""}${r.page ? "" : " · eBay"}</small></span><span class="kd${r.kind === "Pokémon" ? " pk" : ""}">${esc(r.kind)}</span></li>`).join("")
  : `<li><span class="dt">—</span><span class="lb"><span class="n">Nothing dated on the calendars we read.</span><small>coming soon</small></span><span></span></li>`;

const dealsHtml = `<li class="empty">Checking today’s deals…</li>`;

const d0 = T[DEFAULT_TK];
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>ShopCardHub — What are your cards worth?</title>
  <meta name="description" content="Pokémon and Bowman card prices, tracked like the stock market: one index per set, dated sold prices, what moved this week, what's coming out, deals and auctions under our price.">
  <!-- P0-B PREVIEW (Oct 23 2026): Mo reviews this page at /home-v2 before it replaces /. Not linked, not indexed. -->
  <meta name="robots" content="noindex,nofollow">
  <link rel="canonical" href="https://www.shopcardhub.com/home-v2">
  <meta property="og:type" content="website">
  <meta property="og:title" content="ShopCardHub — What are your cards worth?">
  <meta property="og:description" content="One price index per set, built from dated sold prices. Pokémon and Bowman.">
  <meta property="og:url" content="https://www.shopcardhub.com/home-v2">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/indices.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/indices.png">
  <link rel="preload" href="/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/fonts.css">
  <style>${pageCss}</style>
  <style>${CSS}</style>
  ${gtag}
  <link rel="stylesheet" href="/css/site-fixes.css">
  <link rel="stylesheet" href="/css/terminal-shell.css?v=2">
</head>
<body>

${nav}

<div class="term" data-prices-updated="${esc(cadenceStamp)}">
${rail}
<main class="tmain h2" id="main">

  <div class="h2-ask" role="search" aria-label="Search">
    <h1>What’s it <em>worth?</em></h1>
    <div class="h2-sbox">
      <input type="search" id="h2-q" placeholder="What’s it worth? Search a card or set" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search a card or set" aria-controls="h2-sres">
      <button class="go" type="button" id="h2-go" aria-label="Search">→</button>
      <div class="h2-sres" id="h2-sres" role="listbox"></div>
    </div>
    <div class="h2-hint">Try “Moonbreon”, “Charizard 1st Edition” or a set name · free, no account</div>
  </div>

  <div class="h2-r2">
  <section aria-labelledby="h2-ixh">
    <div class="q"><h2 id="h2-ixh">How are the sets doing?</h2><a class="all" href="/indices">All ${liveN} sets →</a></div>
    <div class="h2-box">
      <div class="h2-tabs" role="tablist" aria-label="Category">${tabs.map((t, i) => `<button class="h2-tab" role="tab" id="h2-tab-${t.id}" data-tab="${t.id}" aria-selected="${i === 0}" aria-controls="h2-list">${esc(t.label)}</button>`).join("")}</div>
      <div class="h2-body">
        <div class="h2-list" id="h2-list" role="tabpanel"><table><tbody id="h2-rows"></tbody></table></div>
        <div class="h2-viz">
          <div class="h2-vh">
            <div class="nm" id="h2-vnm">${esc(d0.n)}<small id="h2-vtk">${esc(DEFAULT_TK)}</small></div>
            <div class="lv"><b id="h2-vlv" data-v="${d0.l}">${d0.l.toFixed(2)}</b><span id="h2-vwk" class="${d0.w == null ? "fl" : d0.w > 0 ? "up" : d0.w < 0 ? "dn" : "fl"}">${d0.w == null ? "first week" : (d0.w > 0 ? "▲ +" : d0.w < 0 ? "▼ " : "") + d0.w.toFixed(1) + "% this week"}</span><small id="h2-vsn">${(d0.s > 0 ? "+" : "") + d0.s.toFixed(0)}% ${esc(d0.sl)}</small></div>
          </div>
          <div class="h2-rng" role="group" aria-label="Range" id="h2-rng"><button data-r="1M" aria-pressed="false">1M</button><button data-r="6M" aria-pressed="false">6M</button><button data-r="1Y" aria-pressed="false">1Y</button><button data-r="MAX" aria-pressed="true">Max</button></div>
          <div class="h2-chart" id="h2-chart" aria-live="polite"></div>
          <div class="h2-cap" id="h2-cap"></div>
          <div class="h2-act"><a class="h2-buy" id="h2-buy" href="${esc(d0.buy.h)}" target="_blank" rel="noopener sponsored">${esc(d0.buy.l)}</a><a class="h2-open" id="h2-open" href="${esc(d0.p)}">Every card in the set →</a></div>
        </div>
      </div>
      <div class="h2-foot"><span>100 = the month the set came out. Above 100 = pricier since. <a href="/how-prices-work">How it works →</a></span><span>Updated ${esc(mdy(cadenceStamp))} from sold prices</span></div>
    </div>
  </section>

  <section aria-labelledby="h2-relh">
    <div class="q"><h2 id="h2-relh">What’s coming out?</h2><small>next ${RELEASES.length} · dates from the makers’ calendars</small></div>
    <div class="h2-rel"><ol>${relHtml}</ol></div>
  </section>
  </div>

  <div class="h2-tiles">
  <section class="h2-tile" aria-labelledby="h2-mvh">
    <div class="q"><h2 id="h2-mvh">What moved this week?</h2><span class="tog" role="group" aria-label="Direction"><button data-dir="up" aria-pressed="true">Up</button><button data-dir="down" aria-pressed="false">Down</button></span></div>
    <ul id="h2-mv"></ul>
    <div class="q" style="margin:8px 0 0;"><small>${MOVERS.n} cards with a fresh price · 12-month shape beside each</small><a class="all" href="/indices">See all →</a></div>
  </section>
  <section class="h2-tile" aria-labelledby="h2-dlh">
    <div class="q"><h2 id="h2-dlh">Listed below our price?</h2><small id="h2-dls">Buy It Now · screened 3× a day</small></div>
    <ul id="h2-dl">${dealsHtml}</ul>
    <div class="q" style="margin:8px 0 0;"><small>our price = recent sold prices for that exact card and grade</small><a class="all" href="/deals">See all →</a></div>
  </section>
  <section class="h2-tile" aria-labelledby="h2-auh">
    <div class="q"><h2 id="h2-auh">Auctions ending soon?</h2><small id="h2-aus">live on eBay</small></div>
    <ul id="h2-au"><li class="empty">Checking live auctions…</li></ul>
    <div class="q" style="margin:8px 0 0;"><small>current bid, not a final price</small><a class="all" href="/auctions">See all →</a></div>
  </section>
  <section class="h2-tile" aria-labelledby="h2-wlh">
    <div class="q"><h2 id="h2-wlh">Your watchlist</h2><small>stays on your device</small></div>
    <ul id="h2-wl"></ul>
    <div class="q" style="margin:8px 0 0;"><small>★ any card on the site to watch it here</small><a class="all" href="/watchlist">Open the Vault →</a></div>
  </section>
  </div>

  <section class="h2-tape" id="tape" aria-labelledby="h2-tph">
    <div class="q"><h2 id="h2-tph">The Tuesday Tape</h2><small>one email a week</small></div>
    <div class="sch-signup" data-signup="home-v2" data-variant="tape"></div>
    <script src="/js/signup.js?v=3" defer></script>
  </section>

  <div class="h2-disc"><b>Affiliate disclosure:</b> ShopCardHub participates in the eBay Partner Network and Amazon Associates. We may earn commissions when you purchase through links on this site. Index levels and card prices are built from dated sold prices (updated Mondays, most also Thursdays) and dated on the page; they may not reflect current market conditions. An index is a measurement, not a call. This site does not provide financial or investment advice.</div>
</main>
</div>

${footer}

<script id="h2-data" type="application/json">${JSON.stringify(PAYLOAD).replace(/</g, "\\u003c")}</script>
<script>
(function () {
  'use strict';
  var D = JSON.parse(document.getElementById('h2-data').textContent);
  var T = D.t, MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var RM = false; try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var mdy = function (d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return MON[+p[1] - 1] + ' ' + (+p[2]); };
  var mly = function (ym) { var p = String(ym).split('-'); return MON[+p[1] - 1] + ' \\u2019' + p[0].slice(2); };
  var cls = function (v) { return v == null ? 'fl' : v > 0 ? 'up' : v < 0 ? 'dn' : 'fl'; };
  var sgn = function (v, d) { return v == null ? '\\u2014' : (v > 0 ? '+' : '') + v.toFixed(d == null ? 1 : d) + '%'; };
  var money = function (n) { return n == null ? '' : '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 100 ? String(Math.round(n)) : n.toFixed(2)); };
  var ga = function (ev, p) { try { if (typeof gtag === 'function') gtag('event', ev, Object.assign({ page: location.pathname }, p || {})); } catch (e) {} };

  /* ---------- the index box ---------- */
  var tab = D.tabs[0].id, cur = D.def, range = 'MAX', firstPaint = true;
  var rowsEl = document.getElementById('h2-rows');
  function countUp(el, to, dec) {
    if (RM || !(to > 0)) { el.textContent = to.toFixed(dec); return; }
    var t0 = null, from = 0;
    function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 600), e = 1 - Math.pow(1 - k, 3); el.textContent = (from + (to - from) * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function renderRows() {
    var t = D.tabs.filter(function (x) { return x.id === tab; })[0];
    rowsEl.innerHTML = t.rows.map(function (tk) {
      var v = T[tk];
      return '<tr role="option" data-tk="' + tk + '" aria-selected="' + (tk === cur) + '" tabindex="0" title="as of ' + esc(mdy(v.d)) + (v.wd ? ' \\u00b7 this week vs ' + esc(mdy(v.wd)) : '') + '">' +
        '<td class="nm">' + esc(v.n) + '<small>' + esc(tk) + '</small></td>' +
        '<td class="lv" data-v="' + v.l + '">' + v.l.toFixed(2) + '</td>' +
        '<td class="wk ' + cls(v.w) + '">' + (v.w == null ? '\\u2014' : (v.w > 0 ? '\\u25b2 ' : v.w < 0 ? '\\u25bc ' : '') + sgn(v.w, 1)) + '<small>' + (v.s > 0 ? '+' : '') + v.s.toFixed(0) + '% ' + esc(v.sl) + '</small></td></tr>';
    }).join('');
    if (firstPaint) { Array.prototype.forEach.call(rowsEl.querySelectorAll('td.lv'), function (td) { countUp(td, +td.getAttribute('data-v'), 2); }); }
    var sel = rowsEl.querySelector('tr[aria-selected="true"]'); if (sel && !firstPaint && sel.scrollIntoView) try { sel.scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }
  function pts(v) {
    var out = v.r.map(function (r) { return { t: Date.parse(r[0] + '-15T00:00:00Z'), v: r[1], rc: 1, d: r[0] }; })
      .concat(v.h.map(function (r) { return { t: Date.parse(r[0] + 'T00:00:00Z'), v: r[1], rc: 0, d: r[0] }; }));
    return out.sort(function (a, b) { return a.t - b.t; });
  }
  var DAYS = { '1M': 31, '6M': 183, '1Y': 366 };
  function rangeOk(v, r) {
    var all = pts(v); if (r === 'MAX') return all.length >= 2;
    var last = all[all.length - 1].t, from = last - DAYS[r] * 864e5;
    var inR = all.filter(function (p) { return p.t >= from; });
    if (inR.length < 2) return false;
    return all[0].t <= from + 20 * 864e5 || r === '1M';   // a range the history can't cover is hidden (6M on a 5-week-old set)
  }
  function chart(v) {
    var all = pts(v), last = all[all.length - 1];
    var sel = range === 'MAX' ? all : all.filter(function (p) { return p.t >= last.t - DAYS[range] * 864e5; });
    if (sel.length < 2) sel = all.slice(-2);
    var el = document.getElementById('h2-chart'); var W = Math.max(260, Math.round(el.clientWidth || 560)), H = W < 420 ? 190 : 210, pl = 8, pr = 46, pt = 14, pb = 22;
    var lv = sel.map(function (p) { return p.v; }).concat([100]);
    var lo = Math.log(Math.min.apply(null, lv)), hi = Math.log(Math.max.apply(null, lv)), pad = Math.max((hi - lo) * 0.12, 0.03), y0 = lo - pad, y1 = hi + pad;
    var t0 = sel[0].t, t1 = sel[sel.length - 1].t;
    var X = function (tt) { return pl + ((tt - t0) / ((t1 - t0) || 1)) * (W - pl - pr); }, Y = function (val) { return pt + (1 - (Math.log(val) - y0) / (y1 - y0)) * (H - pt - pb); };
    var path = function (a) { return a.map(function (p, i) { return (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' '); };
    var live = sel.filter(function (p) { return !p.rc; }), rec = sel.filter(function (p) { return p.rc; });
    if (rec.length && live.length) rec.push(live[0]);
    var area = path(sel) + ' L' + X(t1).toFixed(1) + ' ' + (H - pb) + ' L' + X(t0).toFixed(1) + ' ' + (H - pb) + ' Z';
    var ref = '<line class="ref" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(100).toFixed(1) + '" y2="' + Y(100).toFixed(1) + '"/><text x="' + (W - pr + 6) + '" y="' + (Y(100) + 4).toFixed(1) + '">100</text>';
    var xl = '', lastX = -1e9, n = 4;
    for (var i = 0; i <= n; i++) { var tt = t0 + (t1 - t0) * i / n, best = sel[0]; sel.forEach(function (p) { if (Math.abs(p.t - tt) < Math.abs(best.t - tt)) best = p; }); var x = X(best.t); if (x - lastX < 80) continue; lastX = x;
      xl += '<text x="' + x.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === n ? 'end' : i === 0 ? 'start' : 'middle') + '">' + esc(best.rc ? mly(best.d) : mdy(best.d)) + '</text>'; }
    var e = sel[sel.length - 1], ex = X(e.t), ey = Y(e.v);
    el.classList.toggle('dn', e.v < 100);
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(v.n) + ' index, ' + esc(range === 'MAX' ? 'since the set came out' : 'last ' + range) + '">' +
      '<path class="ar" d="' + area + '"/>' + ref +
      (rec.length > 1 ? '<path class="ln rc" d="' + path(rec) + '"/>' : '') + (live.length > 1 ? '<path class="ln lv" d="' + path(live) + '"/>' : '') +
      '<circle class="dot" cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="3.5"/><text class="last" x="' + (ex - 6).toFixed(1) + '" y="' + (ey < pt + 16 ? ey + 16 : ey - 8).toFixed(1) + '" text-anchor="end">' + e.v.toFixed(2) + '</text>' + xl + '</svg>';
    if (!RM) Array.prototype.forEach.call(el.querySelectorAll('path.ln'), function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = p.classList.contains('rc') ? '5 4' : L; p.style.strokeDashoffset = L; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 550ms ease-out'; p.style.strokeDashoffset = '0'; });
    var first = sel[0];
    document.getElementById('h2-cap').innerHTML = '<span>' + (rec.length ? '<i class="rc"></i>monthly \\u00b7 ' : '') + (live.length > 1 ? '<i></i>live' : '') + '</span><span>' + esc(first.rc ? mly(first.d) : mdy(first.d)) + ' \\u2192 ' + esc(mdy(e.d)) + (range === 'MAX' && v.br === 'first-reliable' ? ' \\u00b7 100 = ' + esc(mly(v.bd)) : '') + '</span>';
  }
  function paintViz(animate) {
    var v = T[cur];
    document.getElementById('h2-vnm').innerHTML = esc(v.n) + '<small>' + esc(cur) + ' \\u00b7 as of ' + esc(mdy(v.d)) + '</small>';
    var lvEl = document.getElementById('h2-vlv'); if (animate) countUp(lvEl, v.l, 2); else lvEl.textContent = v.l.toFixed(2);
    var wk = document.getElementById('h2-vwk'); wk.className = cls(v.w); wk.textContent = v.w == null ? 'first week' : (v.w > 0 ? '\\u25b2 ' : v.w < 0 ? '\\u25bc ' : '') + sgn(v.w, 1) + ' this week';
    wk.title = v.wd ? 'vs the ' + mdy(v.wd) + ' mark' : '';
    document.getElementById('h2-vsn').textContent = (v.s > 0 ? '+' : '') + v.s.toFixed(0) + '% ' + v.sl;
    Array.prototype.forEach.call(document.querySelectorAll('#h2-rng button'), function (b) { var r = b.getAttribute('data-r'); b.hidden = !rangeOk(v, r); });
    if (!rangeOk(v, range)) range = 'MAX';
    Array.prototype.forEach.call(document.querySelectorAll('#h2-rng button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-r') === range)); });
    chart(v);
    var buy = document.getElementById('h2-buy');
    if (v.buy) { buy.hidden = false; buy.href = v.buy.h; buy.textContent = v.buy.l; } else buy.hidden = true;
    var op = document.getElementById('h2-open'); op.href = v.p; op.textContent = 'Every card in ' + v.n + ' \\u2192';
  }
  function select(tk) { if (!T[tk]) return; cur = tk; Array.prototype.forEach.call(rowsEl.querySelectorAll('tr'), function (tr) { tr.setAttribute('aria-selected', String(tr.getAttribute('data-tk') === tk)); }); paintViz(false); ga('home2_index_pick', { ticker: tk }); }
  rowsEl.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-tk]'); if (tr) select(tr.getAttribute('data-tk')); });
  rowsEl.addEventListener('keydown', function (e) { var tr = e.target.closest('tr[data-tk]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(tr.getAttribute('data-tk')); } });
  Array.prototype.forEach.call(document.querySelectorAll('.h2-tab'), function (b) {
    b.addEventListener('click', function () {
      tab = b.getAttribute('data-tab');
      Array.prototype.forEach.call(document.querySelectorAll('.h2-tab'), function (x) { x.setAttribute('aria-selected', String(x === b)); });
      var t = D.tabs.filter(function (x) { return x.id === tab; })[0]; cur = t.rows[0];
      renderRows(); paintViz(false); ga('home2_index_tab', { tab: tab });
    });
  });
  document.getElementById('h2-rng').addEventListener('click', function (e) { var b = e.target.closest('button[data-r]'); if (!b) return; range = b.getAttribute('data-r'); paintViz(false); });
  renderRows(); paintViz(true); firstPaint = false;
  var rz = null, lastW = document.getElementById('h2-chart').clientWidth;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { var w = document.getElementById('h2-chart').clientWidth; if (Math.abs(w - lastW) > 24) { lastW = w; var keep = RM; RM = true; chart(T[cur]); RM = keep; } }, 150); });

  /* ---------- what moved this week ---------- */
  var dir = 'up';
  function spark(a) { if (!a || a.length < 2) return ''; var w = 64, h = 22, lo = Math.min.apply(null, a), hi = Math.max.apply(null, a), sp = (hi - lo) || 1;
    return '<svg class="sp" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="' + a.map(function (v, i) { return (i ? 'L' : 'M') + (i / (a.length - 1) * (w - 2) + 1).toFixed(1) + ' ' + (h - 2 - (v - lo) / sp * (h - 4)).toFixed(1); }).join(' ') + '"/></svg>'; }
  function renderMovers() {
    var rows = D.movers[dir] || [];
    document.getElementById('h2-mv').innerHTML = rows.length ? rows.map(function (c) {
      return '<li title="' + esc(money(c.pp) + ' on ' + mdy(c.pd) + ' \\u2192 ' + money(c.p) + ' on ' + mdy(c.d) + ' \\u00b7 ' + c.n + ' sales in ' + (c.win || 30) + ' days' + (c.sp ? ' \\u00b7 line: 12-month shape, PriceCharting monthly' : '')) + '">' +
        '<span class="nm"><a href="' + esc(c.href) + '">' + esc(c.name) + ' #' + esc(c.num) + '</a><small>' + esc(c.set) + ' \\u00b7 ' + esc(money(c.pp)) + ' \\u2192 ' + esc(money(c.p)) + ' \\u00b7 ' + esc(mdy(c.d)) + '</small></span>' +
        '<span class="rt">' + spark(c.sp) + '<span class="ch ' + cls(c.chg) + '">' + sgn(c.chg, 1) + '</span></span></li>';
    }).join('') : '<li class="empty">No card has two dated prices yet this week.</li>';
  }
  Array.prototype.forEach.call(document.querySelectorAll('.h2-tile .tog button'), function (b) { b.addEventListener('click', function () { dir = b.getAttribute('data-dir'); Array.prototype.forEach.call(document.querySelectorAll('.h2-tile .tog button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderMovers(); }); });
  renderMovers();

  /* ---------- below the mark: refresh from /api/deals (same feed as /deals) ---------- */
  var GL = { raw: 'Raw', psa9: 'PSA 9', psa10: 'PSA 10', sealed: 'Sealed' };
  fetch('/api/deals').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
    var now = Date.now(), seen = {}, rows = (j.rows || []).filter(function (r) { return r && r.url && isFinite(r.total) && isFinite(r.mark) && (!r.ends || new Date(r.ends).getTime() > now); }).sort(function (a, b) { return a.disc - b.disc; }).filter(function (r) { var k = r.cardId + '|' + r.grade; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 5);
    if (!rows.length) { document.getElementById('h2-dl').innerHTML = '<li class="empty">Nothing under our recent-sales price right now. A deal is the exception, not the shelf. <a href="/deals">Deals \\u2192</a></li>'; return; }
    document.getElementById('h2-dl').innerHTML = rows.map(function (r) { var href = r.cardHref || r.page;
      return '<li><span class="nm">' + (href ? '<a href="' + esc(href) + '">' : '<b>') + esc(r.card) + (r.num ? ' #' + esc(r.num) : '') + (href ? '</a>' : '</b>') + '<small><span class="h2-g ' + esc(r.grade) + '">' + esc(GL[r.grade] || r.grade) + '</span>' + esc(T[r.tk] ? T[r.tk].n : r.idx) + ' \\u00b7 recent sales ' + esc(money(r.mark)) + (r.markAsOf ? ' \\u00b7 ' + esc(mdy(r.markAsOf)) : '') + '</small></span>' +
        '<span class="rt"><span class="px">' + esc(money(r.total)) + '</span><span class="ch up">' + Math.round(r.disc * 100) + '%</span><a class="btn" href="' + esc(r.url) + '" target="_blank" rel="noopener sponsored">Buy \\u2192</a></span></li>'; }).join('');
    if (j.generated) document.getElementById('h2-dls').textContent = 'Buy It Now \\u00b7 screened ' + mdy(j.generated);
  }).catch(function () { document.getElementById('h2-dl').innerHTML = '<li class="empty">Couldn\\u2019t reach the deals feed just now. <a href="/deals">Deals \\u2192</a></li>'; });

  /* ---------- auctions ending soon: /api/auctions (the Auction Desk feed) ---------- */
  var au = document.getElementById('h2-au');
  var ends = function (iso) { var ms = new Date(iso).getTime() - Date.now(); if (!(ms > 0)) return 'ending'; var h = ms / 36e5; return h < 1 ? Math.max(1, Math.round(ms / 6e4)) + 'm' : h < 48 ? Math.round(h) + 'h' : Math.round(h / 24) + 'd'; };
  fetch('/api/auctions').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
    var now = Date.now(), rows = (j.rows || []).filter(function (r) { return r && r.url && r.endDate && new Date(r.endDate).getTime() > now && isFinite(r.total); }).sort(function (a, b) { return new Date(a.endDate) - new Date(b.endDate); }).slice(0, 5);
    if (!rows.length) { au.innerHTML = '<li class="empty">No verified auction is live right now. <a href="/auctions">Auction Desk \\u2192</a></li>'; return; }
    au.innerHTML = rows.map(function (r) { var nm = String(r.label || '').split(' \\u2014 ')[0];
      return '<li title="' + esc((r.bidCount || 0) + ' bids \\u00b7 ends ' + new Date(r.endDate).toLocaleString()) + '"><span class="nm"><b>' + esc(nm) + '</b><small>' + esc(String(r.label || '').split(' \\u2014 ')[1] || r.cardType || '') + ' \\u00b7 ends in ' + ends(r.endDate) + (r.bidCount != null ? ' \\u00b7 ' + r.bidCount + ' bid' + (r.bidCount === 1 ? '' : 's') : '') + '</small></span>' +
        '<span class="rt"><span class="px">' + esc(money(r.total)) + '</span><a class="btn bid" href="' + esc(r.url) + '" target="_blank" rel="noopener sponsored">Bid \\u2192</a></span></li>'; }).join('');
    document.getElementById('h2-aus').textContent = rows.length + ' of ' + (j.count || rows.length) + ' live';
  }).catch(function () { au.innerHTML = '<li class="empty">Couldn\\u2019t reach the live auction feed just now. <a href="/auctions">Auction Desk \\u2192</a></li>'; });

  /* ---------- your watchlist: localStorage sch_vault_v1 (written by js/vault-track.js and /watchlist; nothing leaves the device) ---------- */
  (function () {
    var wl = document.getElementById('h2-wl'), store = null;
    try { store = JSON.parse(localStorage.getItem('sch_vault_v1') || 'null'); } catch (e) {}
    var cards = ((store && store.cards) || []).filter(function (c) { return c && c.name; });
    if (!cards.length) { wl.innerHTML = '<li class="empty">Nothing watched yet. Tap \\u2605 on any card and it shows up here with its latest price. No account \\u2014 it stays in this browser.</li>'; return; }
    var rows = cards.map(function (c) { var ps = (c.prices || []).filter(function (p) { return p && isFinite(p.p) && p.p > 0; }); return { name: c.name, set: c.set || '', last: ps.length ? ps[ps.length - 1].p : null, move: ps.length > 1 ? (ps[ps.length - 1].p / ps[0].p - 1) * 100 : null }; })
      .sort(function (a, b) { return Math.abs(b.move || 0) - Math.abs(a.move || 0); }).slice(0, 5);
    wl.innerHTML = rows.map(function (r) { return '<li><span class="nm"><b>' + esc(r.name) + '</b><small>' + esc(r.set || 'on your watchlist') + '</small></span><span class="rt"><span class="px">' + (r.last == null ? '' : esc(money(r.last))) + '</span><span class="ch ' + cls(r.move) + '">' + (r.move == null ? 'new' : sgn(r.move, 1)) + '</span></span></li>'; }).join('');
    if (cards.length > 5) wl.insertAdjacentHTML('beforeend', '<li class="empty"><a href="/watchlist">' + cards.length + ' cards on your watchlist \\u2192</a></li>');
  })();

  /* ---------- search: cards (/data/card-search.json, the header's list) first, set pages after, eBay on a miss ---------- */
  (function () {
    var input = document.getElementById('h2-q'), res = document.getElementById('h2-sres'), CARDS = null, P = null, sel = -1;
    var nk = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
    var SETS = D.sets.map(function (s) { return { t: s.t, tk: s.tk, u: s.u, n: nk(s.t + ' ' + s.tk) }; });
    var PK = /pok[e\\u00e9]mon|pikachu|charizard|gengar|mewtwo|lugia|umbreon|eevee|darkrai|greninja|prismatic|ascended|\\btcg\\b/i;
    var EPN = 'mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001';
    var miss = function (q) { var pk = PK.test(q), t = pk && !/pok[e\\u00e9]mon/i.test(q) ? 'pokemon ' + q : q; return 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(t.replace(/\\s+/g, ' ').trim()).replace(/%20/g, '+') + '&_sacat=' + (pk ? '183454' : '212') + '&LH_BIN=1&' + EPN + '&customid=search-miss'; };
    var load = function () { if (P) return P; P = fetch('/data/card-search.json').then(function (r) { return r.json(); }).then(function (d) { CARDS = (d.cards || []).map(function (c) { return { id: c[0], t: c[1], s: c[2], p: c[3], n: nk(c[1] + ' ' + c[2]) }; }); }).catch(function () { CARDS = []; }); return P; };
    function cards(q) { q = nk(q); if (!CARDS || q.length < 2) return []; var tk = q.split(' ');
      return CARDS.filter(function (c) { for (var i = 0; i < tk.length; i++) if (c.n.indexOf(tk[i]) < 0) return false; return true; })
        .sort(function (a, b) { var sa = nk(a.t).indexOf(tk[0]) === 0 ? 0 : 1, sb = nk(b.t).indexOf(tk[0]) === 0 ? 0 : 1; return sa - sb || (b.p || 0) - (a.p || 0); }).slice(0, 7); }
    function sets(q) { q = nk(q); if (!q) return []; var tk = q.split(' '); return SETS.filter(function (s) { for (var i = 0; i < tk.length; i++) if (s.n.indexOf(tk[i]) < 0) return false; return true; }).slice(0, 4); }
    function render() {
      var q = input.value.trim(); sel = -1;
      if (!q) { res.classList.remove('show'); res.innerHTML = ''; return; }
      var c = cards(q), s = sets(q), h = '';
      if (c.length) h += '<div class="hd">Cards</div>' + c.map(function (x) { return '<a href="/card?id=' + esc(x.id) + '"><span>' + esc(x.t) + '<small>' + esc(x.s) + '</small></span>' + (x.p == null ? '' : '<b>' + esc(money(x.p)) + '<small>raw</small></b>') + '</a>'; }).join('');
      if (s.length) h += '<div class="hd">Sets</div>' + s.map(function (x) { var v = T[x.tk]; return '<a href="' + esc(x.u) + '"><span>' + esc(x.t) + '<small>' + esc(x.tk) + '</small></span>' + (v ? '<b>' + v.l.toFixed(2) + '<small>' + esc(sgn(v.w, 1)) + '</small></b>' : '') + '</a>'; }).join('');
      if (!h) h = CARDS ? '<div class="none">Not in an index yet \\u2014 <a href="' + miss(q) + '" target="_blank" rel="sponsored nofollow noopener">see it on eBay \\u203a</a> \\u00b7 <a href="/indices">what we track</a></div>' : '<div class="none">Looking\\u2026</div>';
      res.innerHTML = h; res.classList.add('show');
    }
    input.addEventListener('focus', load);
    input.addEventListener('input', function () { var v = input.value; render(); if (!CARDS) load().then(function () { if (input.value === v) render(); }); });
    input.addEventListener('keydown', function (e) {
      var links = res.querySelectorAll('a');
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, links.length - 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); }
      else if (e.key === 'Enter') { var t = links[sel] || links[0]; if (t) { ga('home2_search_go', { query: input.value.slice(0, 80) }); location.href = t.getAttribute('href'); } return; }
      else if (e.key === 'Escape') { input.value = ''; render(); input.blur(); return; }
      else return;
      Array.prototype.forEach.call(links, function (l, i) { l.classList.toggle('sel', i === sel); });
    });
    document.getElementById('h2-go').addEventListener('click', function () { var t = res.querySelector('a'); if (t) location.href = t.getAttribute('href'); else if (input.value.trim()) load().then(render); input.focus(); });
    document.addEventListener('click', function (e) { if (!res.contains(e.target) && e.target !== input) res.classList.remove('show'); });
  })();
})();
</script>
</body>
</html>
`;

if (!DRY) fs.writeFileSync(path.join(REPO, "home-v2.html"), html);
console.log(`${DRY ? "would write" : "wrote"} home-v2.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB) · default ${DEFAULT_TK} · tabs: ${tabSummary}${dropped.length ? " · dropped (no live index): " + dropped.join(", ") : ""} · movers ${MOVERS.n} candidates · releases ${RELEASES.length} (${RELEASES.filter((r) => r.page).length} with a page) · deals feed ${DEALS_N} rows (rendered client-side)`);
