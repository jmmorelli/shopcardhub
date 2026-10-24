// tools/lib/home-v2.mjs — the Seeking-Alpha-style home layout (P0-B, Oct 23 2026): data model + the three machine-written
// blocks + the page skeleton. Used by tools/build-home.mjs (writes index.html's HOME:idxbox / HOME:releases / HOME:movers2
// blocks on every bake) and by tools/build-home-v2.mjs (derives the noindex /home-v2 preview from index.html).
//
// Why it exists: Mo, Oct 23 (claude/cos/DESIGN-DIRECTIVE-2026-10-23.md §1/§4) — the home reads as "an Excel sheet of
// indices"; the replacement is one small index box with category tabs and a mini chart, "Coming out" beside it, four
// one-question tiles, the Tape. Every figure comes from repo data: data/indices.json (levels, history, recon, baskets),
// data/releases.json, data/cards/*.json (card ids + the 12-month shape behind each mover), js/home.js SEALED +
// data/buy-strip.json (the sealed eBay link per ticker). Deals / auctions / watchlist tiles are client-side (js/home-v2.js).
//
// Pricing integrity: every number carries its date (small type or title=); "this week" = the newest mark at least 5 days
// before the latest (the badge rule, iw-2026-10-03-1); nothing is blended. EPN: search links only, customid home-<ticker>
// (the prefix the board used, so the EPN custom-ID report stays continuous and audit-site 15b keeps counting) and home-rel-<n>.
//
// THE MOVERS SCREEN (HOME:movers2, Oct 23 2026 evening — Mo, attended: the first cut led with 1st Edition cards "up 55–60%" on
// ten sales; a 90-day median jumping on a handful of rows is not a move a collector can act on). What we store per basket card:
// price/asOf (this mark), prevPrice/prevAsOf (the mark before it, same ticker rule), n30 (clean sales inside THIS mark's window,
// win = 30 or 90 days), carried, basis; plus data/cards/h-<tk>.json, PriceCharting's monthly ungraded value per card (their
// estimate, built from sales — chart context, never a mark). The prior window's sales count is NOT stored, so the screen uses
// the stored count and the history length, and the toggle says so. The rule, in order:
//   1. fresh: price > 0, prevPrice > 0, not carried, prevAsOf !== asOf (two dated marks under the same window rule — like for like:
//      both are medians of raw sold prices for the same card, never a sold price against an ask or a graded mark).
//   2. screen: price >= $25 and n30 >= 5 (MV.MIN_PX / MV.MIN_N).
//   3. history: >= 6 monthly log returns from the last 25 PriceCharting months (MV.MIN_HIST). Without it a card cannot take a top
//      slot; it may appear in a "thin data" tail only when a side has nothing that qualifies.
//   4. size the move r = ln(price / prevPrice) two ways: z_own = (r − mean) / max(sd, MV.SD_FLOOR) against the card's own monthly
//      returns (a weekly move judged against monthly noise — conservative on purpose), and z_xs = (r − mean) / sd against every
//      screened card's move this week; the smaller |z| counts.
//   5. thin data shrinks it: z × √(n ÷ (n + MV.N0)) — a move on 10 sales counts ~70 % of the same move on many.
//   6. eligible when |z| >= MV.Z_MIN (1.0). Rank by z, ties by |%|, cap 5 up / 5 down. Fewer than 3 on a side: say so, never pad.
// Sets (second toggle): the same two z-scores on each live index's this-week log return — own history = monthly log returns of the
// reconstructed level (recon), cross-section = every live index this week; no shrink (an index is not thin data), no threshold:
// 5 up / 5 down always, and a row inside the usual range (|z| < Z_MIN) is labelled so. Everything is baked here; no runtime calls.

import fs from "node:fs";
import path from "node:path";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const mdy = (d) => { if (!d) return ""; const p = String(d).slice(0, 10).split("-"); return `${MON[+p[1] - 1]} ${+p[2]}`; };
const mly = (ym) => { const p = String(ym).split("-"); return `${MON[+p[1] - 1]} ’${p[0].slice(2)}`; };

const EPN_Q = "LH_BIN=1&mkevt=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001";
export const ebaySearch = (q, customid, sacat) => "https://www.ebay.com/sch/i.html?_nkw=" + encodeURIComponent(q).replace(/%20/g, "+").replace(/'/g, "%27").replace(/[!()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()) + (sacat ? "&_sacat=" + sacat : "") + "&" + EPN_Q + "&customid=" + customid;

const TABS = [
  { id: "pmo", label: "Pokémon Modern", sort: (a, b) => (b.rd || "").localeCompare(a.rd || "") },
  { id: "pcl", label: "Pokémon Classic", sort: (a, b) => (a.rd || "").localeCompare(b.rd || "") },
  { id: "p1e", label: "1st Edition & Shadowless", sort: (a, b) => (a.rd || "").localeCompare(b.rd || "") || a.tk.localeCompare(b.tk) },
  { id: "bbb", label: "Bowman Baseball", sort: (a, b) => (b.rd || "").localeCompare(a.rd || "") },
  { id: "bfb", label: "Bowman Football", sort: (a, b) => (b.rd || "").localeCompare(a.rd || "") },
  { id: "bbk", label: "Bowman Basketball", sort: (a, b) => (b.rd || "").localeCompare(a.rd || "") },
];
function tabOf(tk, v) {
  if (/^(BOW|BB|BCB|BCS|BD)/.test(tk)) return "bbb";
  if (/^BF/.test(tk)) return "bfb";
  if (/^BBK/.test(tk)) return "bbk";
  if (/1E$|^BSSL$/.test(tk)) return "p1e";
  return (v.releaseDate || "9999") < "2004-01-01" ? "pcl" : "pmo";
}
const marksOnly = (h) => (Array.isArray(h) ? h : []).filter((r) => r && r.kind !== "divisor" && r.level > 0 && r.date);
function weekBase(h) {
  if (h.length < 2) return null;
  const last = h[h.length - 1];
  for (let i = h.length - 2; i >= 0; i--) if ((new Date(last.date) - new Date(h[i].date)) / 864e5 >= 5) return h[i];
  return null;
}
const cls = (v) => v == null ? "fl" : v > 0 ? "up" : v < 0 ? "dn" : "fl";
const sgn = (v, d) => v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(d == null ? 1 : d) + "%";
const money = (n) => "$" + (n >= 1000 ? Math.round(n).toLocaleString("en-US") : n >= 100 ? String(Math.round(n)) : Number(n).toFixed(2));

/* ---- the movers screen (see the header) ---- */
export const MV = { MIN_PX: 25, MIN_N: 5, MIN_HIST: 6, HIST_MONTHS: 25, SD_FLOOR: 0.03, N0: 10, Z_MIN: 1.0, CAP: 5, THIN: 3, THIN_MIN_PCT: 5 };
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sdev = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); };
const logRets = (levels) => { const out = []; for (let i = 1; i < levels.length; i++) if (levels[i] > 0 && levels[i - 1] > 0) out.push(Math.log(levels[i] / levels[i - 1])); return out; };
/* z against the subject's own history (null when the history is short) and against the cross-section; the smaller |z| counts */
function zScores(r, ownRets, xsMean, xsSd) {
  const zo = ownRets.length >= MV.MIN_HIST ? (r - mean(ownRets)) / Math.max(sdev(ownRets), MV.SD_FLOOR) : null;
  const zx = xsSd > 0 ? (r - xsMean) / xsSd : 0;
  const z = zo == null ? zx : Math.sign(r || 1) * Math.min(Math.abs(zo), Math.abs(zx));
  return { zo: zo == null ? null : +zo.toFixed(2), zx: +zx.toFixed(2), z: +z.toFixed(2), own: zo != null };
}
const z1 = (z) => (z > 0 ? "+" : "") + Number(z).toFixed(1);

export function buildV2(REPO, opts = {}) {
  const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
  const exists = (f) => fs.existsSync(path.join(REPO, f));
  const TODAY = opts.today || process.env.HOME_TODAY || new Date().toISOString().slice(0, 10);
  const idx = JSON.parse(read("data/indices.json"));
  const SEALED = (() => {
    const m = read("js/home.js").match(/var SEALED = (\{[\s\S]*?\n  \});/);
    if (!m) throw new Error("js/home.js: SEALED map not found");
    return Function(`"use strict"; return (${m[1]});`)();
  })();
  const BUYSTRIP = (JSON.parse(read("data/buy-strip.json")).pages) || {};
  const cardsCache = {};
  const cardsFile = (tk) => { if (!(tk in cardsCache)) { const f = `data/cards/${tk.toLowerCase()}.json`; cardsCache[tk] = exists(f) ? JSON.parse(read(f)) : null; } return cardsCache[tk]; };
  function buyFor(tk, v) {
    const slug = String(v.page || "").replace(/^\//, "");
    const cid = "home-" + tk.toLowerCase();
    if (SEALED[tk]) return { l: `Buy ${/box/i.test(SEALED[tk].l) ? "a box" : "an ETB"} on eBay →`, h: ebaySearch(SEALED[tk].q, cid) };
    const bs = BUYSTRIP[slug];
    if (bs && bs.primary && bs.primary.q) return { l: "Buy a box on eBay →", h: ebaySearch(bs.primary.q, cid) };
    const cf = cardsFile(tk);
    const top = cf && (cf.cards || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
    if (top && top.q) return { l: `Shop ${top.name} #${top.num} on eBay →`, h: ebaySearch(top.q, cid, "183454") };
    return null;
  }

  /* ---- the index box model ---- */
  const T = {};
  const tabRows = Object.fromEntries(TABS.map((t) => [t.id, []]));
  for (const [tk, v] of Object.entries(idx)) {
    if (!v || typeof v !== "object" || v.status !== "live") continue;
    const h = marksOnly(v.history);
    if (!h.length) continue;
    const last = h[h.length - 1], prev = weekBase(h);
    const rc = (v.recon || []).filter((r) => r && r.level > 0 && r.month);
    const rd = v.releaseDate || "";
    T[tk] = {
      n: String(v.name || tk).replace(/\s+Chase\s+Index$/i, "").replace(/\s+Index$/i, "").replace(/^((?!Base Set$).*)\s+Set$/i, "$1"),
      p: v.page || "/indices",
      l: +last.level.toFixed(2), d: last.date,
      w: prev ? +((last.level / prev.level - 1) * 100).toFixed(2) : null, wd: prev ? prev.date : null,
      s: +(last.level - 100).toFixed(2), sl: v.baseRule === "first-reliable" && v.baseDate ? "since " + mly(v.baseDate) : "since release",
      bd: v.baseDate || null, br: v.baseRule || null, rd,
      h: h.map((r) => [r.date, +r.level.toFixed(2)]),
      r: rc.map((r) => [r.month, +Number(r.level).toFixed(2)]),
      buy: buyFor(tk, v),
    };
    tabRows[tabOf(tk, v)].push({ tk, rd });
  }
  const tabs = TABS.map((t) => ({ id: t.id, label: t.label, rows: tabRows[t.id].sort(t.sort).map((r) => r.tk) })).filter((t) => t.rows.length);
  if (!tabs.length) throw new Error("home-v2: no live index with a mark");
  const DEFAULT_TK = tabs[0].rows[0];
  if (!T[DEFAULT_TK].buy) throw new Error(`home-v2: default ticker ${DEFAULT_TK} has no eBay link — the above-fold rule needs one`);
  const liveN = Object.keys(T).length;
  const dropped = TABS.filter((t) => !tabRows[t.id].length).map((t) => t.label);

  /* ---- movers: the screen in the header (card view), then the set view ---- */
  const hist = {};
  const monthly = (tk, num) => {            // PriceCharting's monthly ungraded value per card (h-<tk>.json col 1), positive points only
    const f = `data/cards/h-${tk.toLowerCase()}.json`;
    if (!(tk in hist)) hist[tk] = exists(f) ? JSON.parse(read(f)).cards || {} : {};
    const s = hist[tk][String(num)]; if (!Array.isArray(s)) return [];
    return s.map((r) => r && r[1]).filter((x) => x != null && isFinite(x) && x > 0).map((x) => +Number(x).toFixed(2));
  };
  const shape = (pts) => pts.length >= 4 ? pts.slice(-12) : null;
  const cardIdOf = (tk, b) => {
    const cf = cardsFile(tk); if (!cf) return null;
    const hit = (cf.cards || []).find((c) => String(c.num) === String(b.num) && String(c.name).toLowerCase() === String(b.name).toLowerCase()) || (cf.cards || []).find((c) => String(c.num) === String(b.num));
    return hit ? hit.id : null;
  };
  const basisShort = (b) => (/ungraded|raw/i.test(b.basis || "") ? "raw sales" : "sales") + ` · ${b.win || 30}-day median`;
  const screened = []; let fresh = 0;
  for (const [tk, v] of Object.entries(idx)) {
    if (!v || typeof v !== "object" || v.status !== "live" || !T[tk]) continue;
    for (const b of v.basket || []) {
      if (!b || !(b.prevPrice > 0) || !(b.price > 0) || b.carried || !b.prevAsOf || b.prevAsOf === b.asOf) continue;
      fresh++;
      if (b.price < MV.MIN_PX || !(b.n30 >= MV.MIN_N)) continue;
      const r = Math.log(b.price / b.prevPrice); if (!isFinite(r)) continue;
      const pts = monthly(tk, b.num);
      const id = cardIdOf(tk, b);
      screened.push({ tk, set: T[tk].n, name: b.name, num: String(b.num), p: b.price, pp: b.prevPrice, d: b.asOf, pd: b.prevAsOf, n: b.n30, win: b.win || 30, basis: basisShort(b),
        r, chg: +((Math.exp(r) - 1) * 100).toFixed(1), rets: logRets(pts.slice(-MV.HIST_MONTHS)), href: id ? "/card?id=" + id : T[tk].p, sp: shape(pts) });
    }
  }
  const xsR = screened.map((c) => c.r), xsM = xsR.length ? mean(xsR) : 0, xsS = sdev(xsR);
  for (const c of screened) {
    const zs = zScores(c.r, c.rets, xsM, xsS);
    c.hist = c.rets.length; c.zo = zs.zo; c.zx = zs.zx;
    c.z = zs.own ? +(zs.z * Math.sqrt(c.n / (c.n + MV.N0))).toFixed(2) : null;   // the sales shrink; no history → no z, no top slot
    delete c.rets;
  }
  const elig = screened.filter((c) => c.z != null && Math.abs(c.z) >= MV.Z_MIN);
  const byZ = (dir) => elig.filter((c) => dir > 0 ? c.z > 0 : c.z < 0).sort((a, b) => dir * (b.z - a.z) || Math.abs(b.chg) - Math.abs(a.chg)).slice(0, MV.CAP);
  const thin = (dir) => screened.filter((c) => c.z == null && dir * c.chg >= MV.THIN_MIN_PCT).sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg)).slice(0, MV.THIN).map((c) => ({ ...c, thin: true }));
  const side = (dir) => { const rows = byZ(dir); return rows.length ? rows : thin(dir); };
  const movers = { up: side(1), down: side(-1), n: elig.length, screened: screened.length, fresh, withHist: screened.filter((c) => c.z != null).length, xsSd: +xsS.toFixed(4), noHistTickers: [...new Set(screened.filter((c) => !c.hist).map((c) => c.tk))] };

  /* ---- set view: each live index's this-week change, z against its own monthly recon history and against every live index ---- */
  const setRows = Object.entries(T).filter(([, v]) => v.w != null).map(([tk, v]) => {
    const pl = v.h.length >= 2 ? v.h.find((p) => p[0] === v.wd) : null;
    const r = Math.log(1 + v.w / 100);
    return { tk, set: v.n, href: v.p, l: v.l, pl: pl ? pl[1] : +(v.l / (1 + v.w / 100)).toFixed(2), d: v.d, pd: v.wd, r, chg: +v.w.toFixed(1), rets: logRets(v.r.slice(-MV.HIST_MONTHS).map((p) => p[1])), sp: shape(v.r.map((p) => [p[0] + "-15", p[1]]).concat(v.h).sort((a, b) => a[0].localeCompare(b[0])).map((p) => p[1])) };   // shape = monthly recon + the live marks, last 12 points
  });
  const sR = setRows.map((s) => s.r), sM = sR.length ? mean(sR) : 0, sS = sdev(sR);
  for (const s of setRows) { const zs = zScores(s.r, s.rets, sM, sS); s.hist = s.rets.length; s.zo = zs.zo; s.zx = zs.zx; s.z = zs.z; s.own = zs.own; s.usual = Math.abs(s.z) < MV.Z_MIN; delete s.rets; }
  const setSide = (dir) => setRows.filter((s) => dir > 0 ? s.r > 0 : s.r < 0).sort((a, b) => dir * (b.z - a.z) || Math.abs(b.chg) - Math.abs(a.chg)).slice(0, MV.CAP);
  const setMovers = { up: setSide(1), down: setSide(-1), n: setRows.filter((s) => !s.usual).length, total: setRows.length, xsSd: +sS.toFixed(4) };

  /* ---- Coming out: data/releases.json ---- */
  const releases = JSON.parse(read("data/releases.json"));
  const RELEASES = (releases.items || []).filter((r) => r && /^\d{4}-\d{2}-\d{2}$/.test(r.date || "") && r.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8).map((r, i) => {
      const page = r.href && exists(String(r.href).split("#")[0].replace(/^\//, "") + ".html") ? r.href : null;
      return { date: r.date, day: mdy(r.date), label: r.label, kind: r.family === "pokemon" ? "Pokémon" : (r.sport === "MLB" ? "Baseball" : r.sport === "NFL" ? "Football" : r.sport === "NBA" ? "Basketball" : r.sport || "Sports"), status: r.status || "", href: page || ebaySearch(r.q || r.label, "home-rel-" + (i + 1), r.cat ? String(r.cat) : ""), page: !!page };
    });

  /* ---- set list for the search fallback ---- */
  const sets = Object.entries(T).map(([tk, v]) => ({ t: v.n, tk, u: v.p })).concat(
    Object.entries(idx).filter(([k, v]) => v && typeof v === "object" && v.status === "pre" && v.page && exists(String(v.page).replace(/^\//, "") + ".html")).map(([k, v]) => ({ t: String(v.name || k).replace(/\s+Index$/i, ""), tk: k, u: v.page })));

  const slim = Object.fromEntries(Object.entries(T).map(([k, v]) => { const { buy, ...rest } = v; return [k, rest]; }));   // the buy link rides on the row (data-buy)
  const payload = JSON.stringify({ today: TODAY, def: DEFAULT_TK, tabs, t: slim, sets }).replace(/</g, "\\u003c");
  const stamp = idx.updated || TODAY;

  /* ---- block: HOME:idxbox (the whole left section's inner: question row, tabs, every row of every tab, viz defaults, foot, payload) ---- */
  const d0 = T[DEFAULT_TK];
  const rowsHtml = tabs.map((t, ti) => t.rows.map((tk) => { const v = T[tk];
    // data-buy carries the row's sealed eBay search (customid=home-<tk>) in markup, where audit-site 15b counts the home's sealed links
    return `<tr role="option" data-tk="${tk}" data-tab="${t.id}" aria-selected="${tk === DEFAULT_TK}" tabindex="0"${ti ? " hidden" : ""}${v.buy ? ` data-buy="${esc(v.buy.h)}" data-buy-l="${esc(v.buy.l)}"` : ""} title="as of ${esc(mdy(v.d))}${v.wd ? " · this week vs " + esc(mdy(v.wd)) : ""}">` +
      `<td class="nm">${esc(v.n)}<small><b>${esc(tk)}</b></small></td>` +
      `<td class="num ib-lvl">${v.l.toFixed(2)}</td>` +
      `<td class="wk ${cls(v.w)}">${v.w == null ? "—" : (v.w > 0 ? "▲ " : v.w < 0 ? "▼ " : "") + sgn(v.w, 1)}<small>${(v.s > 0 ? "+" : "") + v.s.toFixed(0)}% ${esc(v.sl)}</small></td></tr>`; }).join("")).join("\n");
  const idxbox = `<div class="q"><h2 id="h2-ixh">How are the sets doing?</h2><a class="all" href="/indices">All ${liveN} sets →</a></div>
<div class="h2-box">
  <div class="h2-tabs" role="tablist" aria-label="Category">${tabs.map((t, i) => `<button class="h2-tab" role="tab" id="h2-tab-${t.id}" data-tab="${t.id}" aria-selected="${i === 0}" aria-controls="h2-list">${esc(t.label)}</button>`).join("")}</div>
  <div class="h2-body">
    <div class="h2-list" id="h2-list" role="tabpanel"><table aria-label="Set indices: one row per set"><tbody id="h2-rows">
${rowsHtml}
    </tbody></table></div>
    <div class="h2-viz">
      <div class="h2-vh">
        <div class="nm" id="h2-vnm">${esc(d0.n)}<small id="h2-vtk">${esc(DEFAULT_TK)} · as of ${esc(mdy(d0.d))}</small></div>
        <div class="lv"><b id="h2-vlv" data-v="${d0.l}">${d0.l.toFixed(2)}</b><span id="h2-vwk" class="${cls(d0.w)}">${d0.w == null ? "first week" : (d0.w > 0 ? "▲ " : d0.w < 0 ? "▼ " : "") + sgn(d0.w, 1) + " this week"}</span><small id="h2-vsn">${(d0.s > 0 ? "+" : "") + d0.s.toFixed(0)}% ${esc(d0.sl)}</small></div>
      </div>
      <div class="h2-rng" role="group" aria-label="Range" id="h2-rng"><button data-r="1M" aria-pressed="false">1M</button><button data-r="6M" aria-pressed="false">6M</button><button data-r="1Y" aria-pressed="false">1Y</button><button data-r="MAX" aria-pressed="true">Max</button></div>
      <div class="h2-chart" id="h2-chart" aria-live="polite"></div>
      <div class="h2-cap" id="h2-cap"></div>
      <div class="h2-act"><a class="h2-buy" id="h2-buy" href="${esc(d0.buy.h)}" target="_blank" rel="noopener sponsored">${esc(d0.buy.l)}</a><a class="h2-open" id="h2-open" href="${esc(d0.p)}">Every card in the set →</a></div>
    </div>
  </div>
  <div class="h2-foot"><span>100 = the month the set came out. Above 100 = pricier since. <a href="/how-prices-work">How it works →</a></span><span>Updated ${esc(mdy(stamp))} from sold prices</span></div>
</div>
<script id="h2-data" type="application/json">${payload}</script>`;

  /* ---- block: HOME:releases ---- */
  const releasesHtml = RELEASES.length ? RELEASES.map((r) => { const meta = [r.status === "reported" ? "reported date" : r.status === "expected" ? "expected" : "confirmed", r.page ? "" : "eBay"].filter(Boolean).join(" · ");
    return `<li data-date="${esc(r.date)}"><span class="dt">${esc(r.day)}</span><span class="lb">${r.page ? `<a href="${esc(r.href)}" title="${esc(r.label)}">${esc(r.label)}</a>` : `<a href="${esc(r.href)}" title="${esc(r.label)} on eBay" target="_blank" rel="noopener sponsored">${esc(r.label)}</a>`}<small>${esc(meta)}</small></span><span class="kd${r.kind === "Pokémon" ? " pk" : ""}" title="${esc(r.kind)}">${esc(r.kind)}</span></li>`; }).join("\n")
    : `<li><span class="dt">—</span><span class="lb"><span class="n">Nothing dated on the calendars we read.</span><small>coming soon</small></span><span></span></li>`;

  /* ---- block: HOME:movers2 ---- */
  const spark = (a) => { if (!a || a.length < 2) return ""; const w = 64, h = 22, lo = Math.min(...a), hi = Math.max(...a), sp = (hi - lo) || 1;
    return `<svg class="sp" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${a.map((v, i) => (i ? "L" : "M") + (i / (a.length - 1) * (w - 2) + 1).toFixed(1) + " " + (h - 2 - (v - lo) / sp * (h - 4)).toFixed(1)).join(" ")}"/></svg>`; };
  const dirWord = (dir) => dir === "up" ? "up" : "down";
  const zTitle = (c) => c.z == null ? "no price history to judge this move against" : `z ${z1(c.z)} (own history ${c.zo == null ? "—" : z1(c.zo)} · vs the others ${z1(c.zx)}${c.n != null ? " · shrunk for " + c.n + " sales" : ""})`;
  // card rows: name · set + the two prices · the two dates, n and the basis (11 px) · 12-month shape · %
  const cardLi = (c) => `<li${c.thin ? ' class="thin"' : ""} title="${esc(money(c.pp) + " on " + mdy(c.pd) + " → " + money(c.p) + " on " + mdy(c.d) + " · " + c.n + " sales in the " + c.win + "-day window · " + zTitle(c) + (c.sp ? " · line: 12-month shape, PriceCharting monthly" : ""))}">` +
    `<span class="nm"><a href="${esc(c.href)}">${esc(c.name)} #${esc(c.num)}</a><small>${esc(c.set)} · ${esc(money(c.pp))} → ${esc(money(c.p))}</small><small class="mt">${esc(mdy(c.pd))} → ${esc(mdy(c.d))} · n = ${c.n} · ${esc(c.basis)}${c.thin ? " · thin data" : ""}</small></span>` +
    `<span class="rt">${spark(c.sp)}<span class="ch ${cls(c.chg)}">${sgn(c.chg, 1)}</span></span></li>`;
  const cardList = (dir) => { const rows = movers[dir]; const none = `Nothing moved ${dirWord(dir)} outside its usual range this week.`;
    if (!rows.length) return `<li class="empty">${none}</li>`;
    const thin = rows[0].thin;
    return (thin ? `<li class="empty note">Nothing cleared the screen ${dirWord(dir)} this week. The biggest moves on cards with no price history yet — thin data, read with care:</li>\n` : "") + rows.map(cardLi).join("\n") +
      (!thin && rows.length < 3 ? `\n<li class="empty">Nothing else moved ${dirWord(dir)} outside its usual range.</li>` : ""); };
  // set rows: set · ticker + the two levels · the two dates (+ "usual range" when |z| < Z_MIN) · 12-month shape · %
  const setLi = (s) => `<li${s.usual ? ' class="usual"' : ""} title="${esc(s.pl.toFixed(2) + " on " + mdy(s.pd) + " → " + s.l.toFixed(2) + " on " + mdy(s.d) + " · z " + z1(s.z) + (s.own ? " (own history " + z1(s.zo) + " · vs the other sets " + z1(s.zx) + ")" : " (vs the other sets only — no monthly history yet)") + " · line: last 12 months")}">` +
    `<span class="nm"><a href="${esc(s.href)}">${esc(s.set)}</a><small>${esc(s.tk)} · ${s.pl.toFixed(2)} → ${s.l.toFixed(2)}</small><small class="mt">${esc(mdy(s.pd))} → ${esc(mdy(s.d))}${s.usual ? " · usual range" : " · unusual move"}</small></span>` +
    `<span class="rt">${spark(s.sp)}<span class="ch ${cls(s.chg)}">${sgn(s.chg, 1)}</span></span></li>`;
  const setList = (dir) => { const rows = setMovers[dir]; return rows.length ? rows.map(setLi).join("\n") : `<li class="empty">No set index moved ${dirWord(dir)} this week.</li>`; };
  const how = `<details class="h2-how"><summary>How we pick these ▸</summary><div>` +
    `<p><b>Cards.</b> Priced $${MV.MIN_PX} or more, with at least ${MV.MIN_N} sales behind the new price (the old price came through the same screen; we keep the count behind the newest one), and at least ${MV.MIN_HIST} months of price history. Each move is the change between two medians of the same kind of sale — raw sold prices, same window — never a sold price against an asking price or a graded one.</p>` +
    `<p>We size every move two ways: a z-score against the card's own monthly moves over the last two years, and a z-score against every other card's move this week. The smaller one counts. Thin data shrinks it: the score is multiplied by √(n ÷ (n + ${MV.N0})), so a move on ${MV.N0} sales counts about ${Math.round(Math.sqrt(0.5) * 100)}% of the same move on many. A card makes the list when it is still more than ${MV.Z_MIN === 1 ? "one standard deviation" : MV.Z_MIN + " standard deviations"} outside its usual range; up to ${MV.CAP} each way, most unusual first, ties to the bigger %. Fewer than three qualify, we say so rather than pad. A card with no history cannot take a top slot; it shows only in a labelled thin-data tail when nothing qualifies.</p>` +
    `<p><b>Sets.</b> The same two z-scores on each index's change this week, against its own monthly history since release and against every other set. Sets are never thin data, so the ${MV.CAP} biggest each way always show and a row inside its usual range says so. The dates on each row are the two price dates it compares.</p></div></details>`;
  const movers2 = `<div class="h2-sub"><small>sales-weighted · thin data left out</small>${how}</div>\n` +
    `<ul data-view="cards" data-dir="up">\n${cardList("up")}\n</ul>\n<ul data-view="cards" data-dir="down" hidden>\n${cardList("down")}\n</ul>\n` +
    `<ul data-view="sets" data-dir="up" hidden>\n${setList("up")}\n</ul>\n<ul data-view="sets" data-dir="down" hidden>\n${setList("down")}\n</ul>\n` +
    `<div class="q" style="margin:8px 0 0;"><small data-view="cards">${movers.n} of ${movers.screened} screened cards moved outside their usual range</small><small data-view="sets" hidden>${setMovers.n} of ${setMovers.total} sets moved outside their usual range</small><a class="all" href="/indices">See all →</a></div>`;

  return { tabs, T, DEFAULT_TK, liveN, dropped, movers, setMovers, RELEASES, stamp, blocks: { idxbox, releases: releasesHtml, movers2 }, summary: `default ${DEFAULT_TK} · tabs: ${tabs.map((t) => `${t.label} ${t.rows.length}`).join(" · ")}${dropped.length ? " · dropped (no live index): " + dropped.join(", ") : ""} · movers: ${movers.fresh} fresh → ${movers.screened} screened → ${movers.withHist} with history → ${movers.n} outside the usual range (${movers.up.length} up${movers.up[0] && movers.up[0].thin ? " thin" : ""} / ${movers.down.length} down${movers.down[0] && movers.down[0].thin ? " thin" : ""})${movers.noHistTickers.length ? " · no monthly history: " + movers.noHistTickers.join(", ") : ""} · sets ${setMovers.n}/${setMovers.total} outside the usual range · releases ${RELEASES.length} (${RELEASES.filter((r) => r.page).length} with a page)` };
}

/* The <main> skeleton for index.html (v2 layout): static chrome + empty HOME:* markers that build-home.mjs fills. `carry` holds the
 * machine blocks that stay on / from the previous layout, lifted verbatim from the current index.html: the SIGNUP block, the
 * HOME:regime block, the engine-screens <details> (HOME:stamp + HOME:screen), the Where-to-start section and the tm-foot line. */
export function skeleton(carry) {
  return `<main class="tmain h2" id="main">

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
<!-- HOME:idxbox:START -->
<!-- HOME:idxbox:END -->
  </section>

  <section aria-labelledby="h2-relh">
    <div class="q"><h2 id="h2-relh">What’s coming out?</h2><small>next up</small></div>
    <div class="h2-rel"><ol data-home="releases">
<!-- HOME:releases:START -->
<!-- HOME:releases:END -->
    </ol><div class="ft"><span>Dates from the makers’ calendars</span><a href="/release-calendar">Full calendar →</a></div></div>
  </section>
  </div>

  <div class="h2-tiles">
  <section class="h2-tile" aria-labelledby="h2-mvh">
    <div class="q"><h2 id="h2-mvh">What moved this week?</h2><span class="togs"><span class="tog" role="group" aria-label="Cards or sets"><button data-view="cards" aria-pressed="true">Cards</button><button data-view="sets" aria-pressed="false">Sets</button></span><span class="tog" role="group" aria-label="Direction"><button data-dir="up" aria-pressed="true">Up</button><button data-dir="down" aria-pressed="false">Down</button></span></span></div>
<!-- HOME:movers2:START -->
<!-- HOME:movers2:END -->
  </section>
  <section class="h2-tile" aria-labelledby="h2-dlh">
    <div class="q"><h2 id="h2-dlh">Listed below our price?</h2><small id="h2-dls">Buy It Now · screened twice a day</small></div>
    <ul id="h2-dl"><li class="empty">Checking today’s deals…</li></ul>
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

  <section class="h2-tape" aria-labelledby="h2-tph">
    <div class="q"><h2 id="h2-tph">The Tuesday Tape</h2><small>one email a week</small></div>
    <span id="newsletter" class="nl-anchor" aria-hidden="true"></span><span id="tape" class="nl-anchor" aria-hidden="true"></span><!-- /#newsletter (nav) and /#tape (rail) land here -->
${carry.signup}
  </section>

  <details class="h2-more">
    <summary>More: the vintage-vs-modern read and the Bowman engine screens</summary>
${carry.regime}
${carry.screens}
  </details>

${carry.startHere}

${carry.foot}
</main>`;
}

/* The /home-v2 preview is index.html with a preview head: noindex, its own canonical/og:url, no WebSite LD-JSON. One source,
 * zero drift — whatever the bake writes into / is what Mo sees at /home-v2. */
export function previewFromIndex(html) {
  const out = html
    .replace(/<title>[^<]*<\/title>/, "<title>ShopCardHub — home preview (v2)</title>")
    .replace(/<link rel="canonical" href="https:\/\/www\.shopcardhub\.com\/">/, '<link rel="canonical" href="https://www.shopcardhub.com/home-v2">\n  <!-- P0-B PREVIEW (Oct 23 2026): derived from index.html by tools/build-home-v2.mjs; / carries the same build. Not linked, not indexed. -->\n  <meta name="robots" content="noindex,nofollow">')
    .replace(/<meta property="og:url" content="https:\/\/www\.shopcardhub\.com\/">/, '<meta property="og:url" content="https://www.shopcardhub.com/home-v2">')
    .replace(/\n\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
  if (!/name="robots" content="noindex/.test(out)) throw new Error("previewFromIndex: canonical hook not found in index.html — the preview would be indexable");
  return out;
}
