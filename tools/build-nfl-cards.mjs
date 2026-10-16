#!/usr/bin/env node
/* build-nfl-cards.mjs — writes the NFL rookie board into /nfl-rookie-cards-2026 from data/nfl-cards.json.
 * (CoS one-time build, Oct 16 2026; spec: Project claude/handoffs/sunday-spike-nfl-board-2026-10-14.md; Mo in chat
 * Oct 14: "go on everything else".) Adapted from tools/build-mlb-cards.mjs.
 *
 * It writes ONLY the block between <!-- NFL-BOARD:START --> and <!-- NFL-BOARD:END --> in nfl-rookie-cards-2026.html.
 * No new URL, no title change (R25/R35). Inside the block: a dated "This week" strip (only when data.spike is
 * non-empty), then one row group per player — name, team, card, 30-day sold range + count + window, and Raw / PSA 9 /
 * PSA 10 / TAG eBay buttons. Same link rules as /mlb-cards: sports category 212, full EPN param set, customid
 * nfl-<player>-<n>[-psa9|-psa10|-tag], same ★ Track button. Graded price columns render only when some card carries a
 * graded figure (R18: >= 3 title-verified dated rows, or one dated row); otherwise one plain line says there is none.
 *
 *   node tools/build-nfl-cards.mjs          # then node tools/build-buy-strip.mjs (buy strip lives outside the block)
 *
 * The Monday "Sunday Spike -> NFL rookie board" task re-reads the data file, fills `spike`, bumps `asof`, re-runs this.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const D = JSON.parse(fs.readFileSync(path.join(REPO, "data/nfl-cards.json"), "utf8"));
const PAGE = path.join(REPO, "nfl-rookie-cards-2026.html");
const START = "<!-- NFL-BOARD:START";
const END = "<!-- NFL-BOARD:END -->";

const P = "mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001";
const RAW_NOT = " -psa -cgc -bgs -sgc -tag -beckett -graded -slab";
const TAG_Q = ' "TAG 10" -psa -cgc -bgs -sgc';

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nkw = (q) => encodeURIComponent(String(q).replace(/\s+/g, " ").trim()).replace(/%20/g, "+").replace(/'/g, "%27").replace(/[!()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
function phrase(q, g) {
  if (g === "raw") return q + RAW_NOT;
  if (g === "psa9") return q + ' psa 9 -"psa 10"';
  if (g === "psa10") return q + " psa 10";
  return q + TAG_Q;
}
const ebay = (q, g, cid) => "https://www.ebay.com/sch/i.html?_nkw=" + nkw(phrase(q, g)) + "&_sacat=212&LH_BIN=1&" + P + "&customid=" + cid + (g === "raw" ? "" : "-" + g);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso) => { const [, m, d] = iso.split("-").map(Number); return MON[m - 1] + " " + d; };
const span = (a, b) => (a === b ? fmtDate(a) : a.slice(0, 7) === b.slice(0, 7) ? fmtDate(a) + "&ndash;" + Number(b.slice(8)) : fmtDate(a) + "&ndash;" + fmtDate(b));
const money = (v) => { const n = Number(v); return n >= 100 ? "$" + Math.round(n).toLocaleString("en-US") : "$" + n.toFixed(2); };

function cell(x, lab) {
  if (!x) return `<td class="num none" data-l="${lab}">no sale</td>`;
  if (x.n === 0) return `<td class="num pt" data-l="${lab}">~${money(x.lo)}<sup class="pt" title="SportsCardsPro price point, no sale inside the 30-day window">pt</sup></td>`;
  const txt = Math.abs(x.hi - x.lo) < 0.005 ? money(x.lo) : money(x.lo) + "&ndash;" + money(x.hi);
  const n = x.capped ? x.n + "+" : String(x.n);
  return `<td class="num" data-l="${lab}">${txt}<small>${n} sale${x.n === 1 ? "" : "s"} &middot; ${span(x.from, x.to)}</small></td>`;
}

const graded = D.players.some((p) => p.cards.some((c) => c.psa9 || c.psa10));
const win = `${fmtDate(D.window.from)}&ndash;${fmtDate(D.window.to)}, ${D.window.to.slice(0, 4)}`;

function group(p) {
  return `<tbody id="${p.slug}">\n` + p.cards.map((c, j) => {
    const cid = `nfl-${p.slug}-${j + 1}`;
    const name = `${p.name} #${c.num} ${c.year} ${c.set}`;
    const seed = c.raw ? c.raw.lo : 0;
    return `<tr${j === 0 ? ' class="first"' : ""}>
${j === 0 ? `<th scope="rowgroup" class="pl" rowspan="${p.cards.length}"><b>${esc(p.name)}</b><span>${esc(p.pos)} &middot; ${esc(p.team)}</span></th>` : ""}
<td class="cd"><b>${esc(c.year + " " + c.set)} #${esc(c.num)}</b><span>${esc(c.label)}</span></td>
${cell(c.raw, "Raw sold")}
${graded ? cell(c.psa9, "PSA 9") + "\n" + cell(c.psa10, "PSA 10") : ""}
<td class="act"><span class="act-w"><button type="button" class="sch-track-card" data-name="${esc(name)}" data-set="${esc(c.year + " " + c.set)}" data-cat="football" data-grade="Raw" data-price="${seed}" title="Watch this card">★</button><span class="glk"><a class="ebay g-raw" href="${ebay(c.q, "raw", cid)}" target="_blank" rel="sponsored nofollow noopener" title="Raw (ungraded) copies on eBay">Raw</a><a class="ebay g-psa9" href="${ebay(c.q, "psa9", cid)}" target="_blank" rel="sponsored nofollow noopener" title="PSA 9 copies on eBay"><span class="gl">PSA&nbsp;</span>9</a><a class="ebay g-psa10" href="${ebay(c.q, "psa10", cid)}" target="_blank" rel="sponsored nofollow noopener" title="PSA 10 copies on eBay"><span class="gl">PSA&nbsp;</span>10</a><a class="ebay g-tag" href="${ebay(c.q, "tag", cid)}" target="_blank" rel="sponsored nofollow noopener" title="TAG 10 slabs on eBay (often none)">TAG</a></span></span></td>
</tr>`;
  }).join("\n") + "\n</tbody>";
}

const spike = (D.spike || []).filter((s) => s && s.player && s.line);
const spikeHtml = spike.length
  ? `<div class="nb-week"><span class="nb-wk">This week &middot; ${esc(fmtDate(spike[0].date || D.asof))}</span><ul>${spike.map((s) => {
      const p = D.players.find((x) => x.name === s.player);
      return `<li>Had a big Sunday: ${p ? `<a href="#${p.slug}">${esc(s.player)}</a>` : esc(s.player)}, ${esc(s.line)}</li>`;
    }).join("")}</ul></div>\n`
  : "";

const block = `${START} — generated by tools/build-nfl-cards.mjs from data/nfl-cards.json. Do not hand-edit. -->
<style>
.nb { margin:0 0 8px; }
.nb .nb-week { border:1px solid var(--border2); border-left:3px solid var(--gold); background:var(--bg2); padding:12px 16px; margin:0 0 18px; font-size:14.5px; line-height:1.55; }
.nb .nb-wk { display:block; font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.6px; text-transform:uppercase; color:var(--gold); margin-bottom:4px; }
.nb .nb-week ul { list-style:none; }
.nb .nb-stamp { font-family:var(--fm); font-size:11.5px; letter-spacing:0.4px; color:var(--text-dim); margin:0 0 12px; }
.nb .tw { overflow-x:auto; border:1px solid var(--border2); background:var(--bg2); }
.nb table { width:100%; border-collapse:collapse; font-size:13.5px; }
.nb thead th { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:var(--text-dim); text-align:left; padding:10px 12px; border-bottom:1px solid var(--border2); white-space:nowrap; }
.nb td, .nb th.pl { padding:10px 12px; vertical-align:middle; border-bottom:1px solid var(--border); text-align:left; }
.nb tbody tr.first > * { border-top:1px solid var(--border2); }
.nb tbody:first-of-type tr.first > * { border-top:none; }
.nb th.pl { font-weight:400; vertical-align:top; min-width:150px; scroll-margin-top:80px; }
.nb th.pl b { display:block; font-family:var(--fd); font-size:18px; font-weight:800; text-transform:uppercase; letter-spacing:0.3px; color:var(--text-head); line-height:1.1; }
.nb th.pl span { display:block; font-size:12px; color:var(--text-dim); margin-top:3px; }
.nb td.cd b { display:block; font-family:var(--fd); font-size:15.5px; font-weight:700; color:var(--text-head); line-height:1.15; }
.nb td.cd span { display:block; font-size:12px; color:var(--text-dim); margin-top:2px; }
.nb td.num { font-family:var(--fm); font-variant-numeric:tabular-nums; white-space:nowrap; color:var(--text-head); }
.nb td.num small { display:block; font-size:11px; color:var(--text-dim); margin-top:2px; }
.nb td.num.none { color:var(--text-dim); font-family:var(--fb); font-size:12.5px; }
.nb sup.pt { font-size:9px; color:var(--orange); margin-left:2px; }
.nb td.act { text-align:right; }
.nb .act-w { display:inline-flex; align-items:center; gap:6px; }
.nb .glk { display:inline-flex; gap:4px; }
.nb .glk a.ebay { display:inline-flex; align-items:center; min-height:34px; font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; padding:6px 10px; border-radius:2px; white-space:nowrap; transition:background .15s, color .15s, border-color .15s; }
.nb .glk a.g-raw { background:var(--accent); color:#000; }
.nb .glk a.g-raw:hover { background:#fff; text-decoration:none; }
.nb .glk a.g-psa9, .nb .glk a.g-psa10 { color:var(--text-head); border:1px solid var(--border2); }
.nb .glk a.g-psa9:hover, .nb .glk a.g-psa10:hover { border-color:var(--accent); color:var(--accent); text-decoration:none; }
.nb .glk a.g-tag { color:var(--gold); border:1px solid rgba(245,200,0,0.45); }
.nb .glk a.g-tag:hover { background:var(--gold); color:#000; text-decoration:none; }
.nb .glk a:focus-visible, .nb .sch-track-card:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.nb .sch-track-card { font-size:13px; line-height:1; padding:8px 9px; min-height:34px; }
.nb .nb-note { font-size:12.5px; line-height:1.6; color:var(--text-dim); margin:12px 2px 0; max-width:820px; }
@media (max-width:760px) {
  .nb .tw { overflow:visible; border:none; background:none; }
  .nb table, .nb tbody { display:block; width:100%; }
  .nb thead { display:none; }
  .nb tbody { border:1px solid var(--border2); background:var(--bg2); margin:0 0 10px; padding:4px 12px; }
  .nb tr { display:grid; grid-template-columns:1fr auto; gap:6px 10px; padding:10px 0; border-top:1px solid var(--border); }
  .nb tr.first { border-top:none; }
  .nb tbody tr.first > * { border-top:none; }
  .nb td, .nb th.pl { display:block; border:none; padding:0; }
  .nb th.pl { grid-column:1 / -1; min-width:0; margin-bottom:2px; }
  .nb td.num { text-align:right; white-space:normal; }
  .nb td.act { grid-column:1 / -1; text-align:left; }
  .nb .act-w { flex-wrap:wrap; }
  .nb .glk a.ebay { min-height:40px; padding:8px 12px; }
  .nb .sch-track-card { min-height:40px; min-width:40px; }
}
</style>
<div class="nb" id="board">
${spikeHtml}<p class="nb-stamp" data-prices-updated="${D.asof}">Raw sold prices, ${win} &middot; updated ${esc(fmtDate(D.asof))}, ${D.asof.slice(0, 4)}</p>
<div class="tw"><table>
<thead><tr><th>Player</th><th>Card</th><th>Raw sold, 30 days</th>${graded ? "<th>PSA 9</th><th>PSA 10</th>" : ""}<th class="act">On eBay</th></tr></thead>
${D.players.map(group).join("\n")}
</table></div>
<p class="nb-note">The price is the middle half of the card's raw sales in the window, from eBay and Fanatics sold listings as SportsCardsPro records them. Lots, parallels, foils, refractors and graded copies are left out. A count with a + means the source only shows its 30 most recent sales, so there were at least that many.${graded ? "" : " None of these cards had a PSA 9 or PSA 10 sale with the grade in its title during the window, so there is no graded price here. The PSA and TAG buttons still open live listings."}</p>
</div>
${END}`;

let html = fs.readFileSync(PAGE, "utf8");
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < a) { console.error("build-nfl-cards: NFL-BOARD markers not found in nfl-rookie-cards-2026.html"); process.exit(1); }
html = html.slice(0, a) + block + html.slice(b + END.length);
fs.writeFileSync(PAGE, html);
const nCards = D.players.reduce((s, p) => s + p.cards.length, 0);
console.log(`build-nfl-cards: ${D.players.length} players, ${nCards} rows, spike ${spike.length}, graded columns ${graded ? "on" : "off"}`);
