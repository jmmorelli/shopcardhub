#!/usr/bin/env node
// build-class-ladder.mjs — /bowman-classes, the Bowman Class Ladder (Mo, Oct 23 2026: one page covering the 1st Bowman Chrome
// Auto classes 2009–2025, BOW26 referenced as the last row).
//
// Always regenerated, in full, from data/indices.json (the BOWyy class tickers tools/build-sector-index.mjs --ticker BOWyy
// --mark writes) plus data/classes/BOWyy-universe.json for the names of classes that have not been read yet. Nothing on the
// page is typed by hand. Rules it holds to (the CoS design note, Oct 23): the dark terminal look of the index pages, one read
// date per class row with the page stamp = the newest, every price carries its basis and date, no placeholder prices, no
// "coming soon" and no stale badges. A class with status "pre-activation" appears in the table as "awaiting marks" and
// never on the chart, and none of its prices are published (the gate in the engine is what makes a class publishable).
//
// Usage: node tools/build-class-ladder.mjs [--check] [--sitemap]
//   --check    print what would be written, write nothing
//   --sitemap  add /bowman-classes to sitemap.xml — only when at least one class is live (the sitemap is a curated list,
//              P0-D / Traffic; this flag is the same opt-in tools/league/integrate.mjs uses). Without it the page stays out.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ebaySearchUrl, SACAT_SPORTS, assertClean } from "./lib/epn.mjs";
import { CLASS_PAGE, classTickers, readClassFile, classYear, classRows, classQuery, isFixture } from "./lib/bowman-class.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const CHECK = args.includes("--check"), SITEMAP = args.includes("--sitemap");
const TODAY = process.env.SIDX_TODAY || new Date().toISOString().slice(0, 10);
const SITE = "https://www.shopcardhub.com";
const SLUG = CLASS_PAGE.slice(1), FILE = path.join(ROOT, SLUG + ".html");
const TITLE = "Bowman 1st Auto Classes, 2009–2026";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mdy = (d) => { const p = String(d || "").slice(0, 10).split("-"); return p.length === 3 ? `${p[1]}/${p[2]}/${p[0].slice(2)}` : "—"; };
const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const mon = (ym) => { const m = /^(\d{4})-(\d{2})/.exec(String(ym || "")); return m ? `${MONS[+m[2] - 1]} ${m[1]}` : "—"; };
const money = (n, d = 0) => n == null ? "—" : "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v, d = 0) => v == null ? "—" : (v * 100).toFixed(d) + "%";
const sgn = (v, d = 1) => v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(d);
const num = (v, d = 2) => v == null ? "—" : Number(v).toFixed(d);

// ---------------- data ----------------
const IDX = JSON.parse(fs.readFileSync(path.join(ROOT, "data/indices.json"), "utf8"));
const classes = [];
for (const tk of classTickers(ROOT)) {
  let u = null; try { u = readClassFile(ROOT, tk); } catch (e) { console.error(`${tk}: universe file unreadable — ${e.message}`); }
  if (isFixture(u) && process.env.SIDX_OFFLINE_FIXTURE !== "1") { console.log(`${tk}: fixture universe file — not a class, left off the page`); continue; }
  const rec = IDX[tk] && typeof IDX[tk] === "object" && IDX[tk].model === "class" ? IDX[tk] : null;
  const rows = u ? classRows(u) : [];
  const products = (rec && rec.products) || (u && u.products) || [];
  classes.push({ tk, year: classYear(tk, u), u, rec, rows, products: products.slice().sort((a, b) => String(a.release || "").localeCompare(String(b.release || ""))), live: !!(rec && rec.status === "live" && rec.divisor && (rec.history || []).length) });
}
classes.sort((a, b) => a.year - b.year);
const live = classes.filter((c) => c.live), pre = classes.filter((c) => !c.live);
const read = classes.filter((c) => c.rec && c.rec.classStats);
const lastMark = (x) => { const h = (x.history || []).filter((r) => r && r.kind !== "divisor" && typeof r.level === "number"); return h[h.length - 1] || null; };
const weekBase = (x) => { const h = (x.history || []).filter((r) => r && r.kind !== "divisor" && typeof r.level === "number"); if (h.length < 2) return null; const last = h[h.length - 1]; for (let i = h.length - 2; i >= 0; i--) if ((Date.parse(last.date) - Date.parse(h[i].date)) / 864e5 >= 5 && h[i].level > 0) return h[i]; return null; };

// BOW26, the year cohort that already has its own ticker and page — the last row, never on the chart (30-day screen, release base)
const B26 = IDX.BOW26 && IDX.BOW26.status === "live" ? IDX.BOW26 : null;
// the page stamp (data-prices-updated) = the newest read on the page: the live classes' marks and BOW26's last mark
const stamp = live.map((c) => c.rec.classStats.asOf).concat(B26 ? [lastMark(B26).date] : []).filter(Boolean).sort().pop() || null;
function cohortStats(x) {
  const basket = (x.basket || []).filter((b) => typeof b.price === "number" && b.price > 0), n = (x.universe || []).length;
  const prices = basket.map((b) => b.price), cv = prices.reduce((s, p) => s + p, 0), sorted = basket.slice().sort((a, b) => b.price - a.price), top = sorted[0];
  const med = (a) => { const s = a.slice().sort((p, q) => p - q), m = s.length; return m ? (m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2) : null; };
  return { n, priced: basket.length, classValue: cv, median: med(prices), topCard: top ? { player: top.name, code: top.num, share: top.price / cv } : null, top3Share: cv ? sorted.slice(0, 3).reduce((s, b) => s + b.price, 0) / cv : null, hit20: n ? basket.filter((b) => b.price >= 20).length / n : null, hit100: n ? basket.filter((b) => b.price >= 100).length / n : null, asOf: basket.map((b) => b.asOf).sort().pop() };
}

// ---------------- the sealed-product links (R11: above the fold; a search, labelled as one, never a price) ----------------
const Y = +TODAY.slice(0, 4);
const SEALED = [
  { label: `${Y} Bowman hobby boxes on eBay`, q: `Sealed Hobby Box Bowman Baseball ${Y} -chrome -sapphire -draft -topps -case -pack -packs -jumbo -blaster -lot`, customid: "classladder" },
  { label: `${Y} Bowman Chrome hobby boxes`, q: `Sealed Hobby Box Bowman Chrome Baseball ${Y} -sapphire -draft -topps -case -pack -packs -jumbo -blaster -lot`, customid: "classladder-chrome" },
].map((s) => ({ ...s, url: assertClean(ebaySearchUrl({ q: s.q, customid: s.customid, sacat: SACAT_SPORTS })) }));

// ---------------- chart: class age (x) vs hit rate at $20 (y), bubble area ∝ class value, live classes only ----------------
function chart() {
  const pts = live.map((c) => ({ c, s: c.rec.classStats })).filter((p) => p.s.ageYears != null && p.s.hit20 != null && p.s.classValue > 0);
  if (!pts.length) return "";
  const W = 760, H = 320, L = 54, R = 22, T = 18, B = 44;
  const maxAge = Math.max(2, Math.ceil(Math.max(...pts.map((p) => p.s.ageYears)) + 1)), maxV = Math.max(...pts.map((p) => p.s.classValue));
  const x = (a) => L + (a / maxAge) * (W - L - R), y = (h) => T + (1 - h) * (H - T - B), r = (v) => 5 + Math.sqrt(v / maxV) * 24;
  const xt = []; const step = maxAge <= 6 ? 1 : maxAge <= 12 ? 2 : 4; for (let a = 0; a <= maxAge; a += step) xt.push(a);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((h) => `<line x1="${L}" x2="${W - R}" y1="${y(h).toFixed(1)}" y2="${y(h).toFixed(1)}" class="g"/><text x="${L - 8}" y="${(y(h) + 3.5).toFixed(1)}" class="t ty">${Math.round(h * 100)}%</text>`).join("");
  const xa = xt.map((a) => `<line x1="${x(a).toFixed(1)}" x2="${x(a).toFixed(1)}" y1="${H - B}" y2="${H - B + 5}" class="ax"/><text x="${x(a).toFixed(1)}" y="${H - B + 18}" class="t tx">${a}</text>`).join("");
  const bubbles = pts.slice().sort((a, b) => b.s.classValue - a.s.classValue).map(({ c, s }) => `<g class="bb"><circle cx="${x(s.ageYears).toFixed(1)}" cy="${y(s.hit20).toFixed(1)}" r="${r(s.classValue).toFixed(1)}"><title>${esc(c.year)} class · ${esc(s.n)} 1st autos · ${pct(s.hit20)} at $20 or more · class value ${money(s.classValue)} · ${num(s.ageYears, 1)} years since release · marks ${mdy(s.asOf)}</title></circle><text x="${x(s.ageYears).toFixed(1)}" y="${(y(s.hit20) + 4).toFixed(1)}" class="t yr">${esc(c.year)}</text></g>`).join("");
  return `<figure class="cl-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bowman 1st auto classes: years since release on the horizontal axis, share of the class selling for twenty dollars or more on the vertical axis; bubble size is the class value">
<style>.g{stroke:rgba(255,255,255,.08)}.ax{stroke:rgba(255,255,255,.25)}.t{font-family:var(--fm,ui-monospace,monospace);font-size:10px;fill:#7a969e}.ty{text-anchor:end}.tx{text-anchor:middle}.bb circle{fill:rgba(0,204,245,.28);stroke:#00ccf5;stroke-width:1.2}.bb:hover circle{fill:rgba(0,204,245,.5)}.yr{text-anchor:middle;fill:#e4f0f4;font-weight:700;font-size:11px}.lb{font-family:var(--fm,ui-monospace,monospace);font-size:9.5px;letter-spacing:1.5px;fill:#7a969e;text-transform:uppercase}</style>
${grid}<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" class="ax"/>${xa}
<text x="${((L + W - R) / 2).toFixed(1)}" y="${H - 8}" class="lb" text-anchor="middle">years since the class released</text>
<text transform="translate(12 ${((T + H - B) / 2).toFixed(1)}) rotate(-90)" class="lb" text-anchor="middle">share of the class at $20 or more</text>
${bubbles}</svg><figcaption>Each bubble is one live class, sized by its class value (one copy of every priced 1st auto). Marks as of ${mdy(live.map((c) => c.rec.classStats.asOf).sort().pop())}. Classes still awaiting marks are in the table, not on the chart.</figcaption></figure>`;
}

// ---------------- holdings grid for a live class ----------------
function holdings(c) {
  const x = c.rec, tkl = c.tk.toLowerCase(), cid = `classladder-${tkl}`;
  const rows = (x.basket || []).slice().sort((a, b) => b.price - a.price);
  const noTape = (x.universe || []).filter((u) => u.noTape);
  const cv = rows.reduce((s, b) => s + b.price, 0);
  const row = (b, i) => {
    const url = assertClean(ebaySearchUrl({ q: classQuery(b.product, b.name, b.num), customid: cid, sacat: SACAT_SPORTS, av: b.price >= 200 }));
    const price = b.carried
      ? `<b>${money(b.price, 2)}</b><small>last clean sale · ${mdy(b.asOf)} · <span class="carried">carried · ${b.ageDays != null ? b.ageDays + " d" : "no sale in 90 d"}</span></small>`
      : `<b>${money(b.price, 2)}</b><small>sold · 90-day median of ${b.n30} clean sale${b.n30 === 1 ? "" : "s"} · ${mdy(b.asOf)}${b.thin ? ' · <span class="thin">thin</span>' : ""}</small>`;
    return `<tr><td class="rk">${i + 1}</td><td class="nm"><b>${esc(b.name)}</b><small>${esc(b.product)} · #${esc(b.num)}</small></td><td class="px">${price}</td><td class="wt">${cv ? (b.price / cv * 100).toFixed(1) + "%" : "—"}</td><td class="act"><button type="button" class="sch-track-card" data-name="${esc(b.name)} — 1st Bowman Chrome Auto #${esc(b.num)} (${esc(b.product)})" data-set="${esc(b.product)}" data-cat="baseball" data-grade="Raw" data-price="${b.price}" title="Watch this card in your Vault">★</button><a class="ebay" href="${url}" target="_blank" rel="sponsored nofollow noopener">${b.price >= 200 ? "Authenticated" : "Listings"} &rarr;</a></td></tr>`;
  };
  const nt = (u) => {
    const url = assertClean(ebaySearchUrl({ q: classQuery(u.product, u.name, u.num), customid: cid, sacat: SACAT_SPORTS }));
    return `<tr class="nt"><td class="rk">·</td><td class="nm"><b>${esc(u.name)}</b><small>${esc(u.product)} · #${esc(u.num)}</small></td><td class="px"><span class="notape">no tape</span><small>${u.unresolved ? "not listed on the source console" : "no clean ungraded sale on record"}</small></td><td class="wt">0</td><td class="act"><button type="button" class="sch-track-card" data-name="${esc(u.name)} — 1st Bowman Chrome Auto #${esc(u.num)} (${esc(u.product)})" data-set="${esc(u.product)}" data-cat="baseball" data-grade="Raw" title="Watch this card in your Vault">★</button><a class="ebay" href="${url}" target="_blank" rel="sponsored nofollow noopener">Listings &rarr;</a></td></tr>`;
  };
  const head = `<thead><tr><th>#</th><th>Player · product · code</th><th>Sold mark</th><th>Weight</th><th>Watch · Buy</th></tr></thead>`;
  const top = rows.slice(0, 10).map(row).join(""), rest = rows.slice(10).map((b, i) => row(b, i + 10)).join("") + noTape.map(nt).join("");
  return `<div class="cl-hold"><table>${head}<tbody>${top}</tbody></table>${rest ? `<details class="cl-more"><summary><span class="o">Show all ${rows.length} priced${noTape.length ? ` + ${noTape.length} with no tape` : ""} ▾</span><span class="c">Hide ▴</span></summary><table><tbody>${rest}</tbody></table></details>` : ""}<p class="cl-fine">Weight = price ÷ class value (one copy of each priced card). A carried row is the last clean ungraded sale on record, with its own date, because nothing sold in the trailing 90 days. “No tape” means no clean ungraded sale is on record for that card, so it weighs 0. Links open live eBay listings (affiliate; ShopCardHub earns a commission at no cost to you).</p></div>`;
}

// ---------------- the ladder table ----------------
const COLS = 13;
function liveRow(c) {
  const x = c.rec, s = x.classStats, last = lastMark(x), prev = weekBase(x);
  const wow = prev && last ? (last.level / prev.level - 1) * 100 : null;
  const lvl = last ? `<b>${last.level.toFixed(2)}</b><small>since ${mdy(x.inception)}${wow == null ? "" : ` · <span class="${wow >= 0 ? "up" : "dn"}">${wow >= 0 ? "▲" : "▼"} ${sgn(wow)}% w/w</span>`} · read ${mdy(s.asOf)}</small>` : "—";
  const top = s.topCard ? `${esc(s.topCard.player)} <small>#${esc(s.topCard.code)} · ${pct(s.topCard.share, 1)}</small>` : "—";
  return `<tr class="cl-row live" id="${c.tk.toLowerCase()}"><td class="yr"><b>${c.year}</b><small>${c.tk}</small></td><td class="pr">${c.products.map((p) => esc(p.name.replace(/^\d{4}\s+/, ""))).join(" · ")}</td><td class="n">${s.n}</td><td class="n">${s.priced}<small>${s.carried ? `+${s.carried} carried` : ""}${s.noTape ? ` · ${s.noTape} no tape` : ""}</small></td><td class="n">${money(s.classValue)}</td><td class="n">${money(s.median)}</td><td class="tc">${top}</td><td class="n">${pct(s.top3Share)}</td><td class="n">${pct(s.hit20)} <small>/ ${pct(s.hit100)}</small></td><td class="n">${num(s.skew)}</td><td class="n">${num(s.kurt)}</td><td class="lv">${lvl}</td><td class="x"><button type="button" class="cl-x" aria-expanded="false" aria-controls="h-${c.tk.toLowerCase()}" title="Show every card in this class">▸</button></td></tr>
<tr class="cl-detail" id="h-${c.tk.toLowerCase()}" hidden><td colspan="${COLS}">${s.retSinceFirstMonth ? `<p class="cl-recon">Reconstruction: PriceCharting's monthly price history for this basket, chain-linked and indexed so the first live mark reads 100, runs from ${mon(s.retSinceFirstMonth.from)}; on that series the class is ${sgn(s.retSinceFirstMonth.pct)}% from its first month to the live base. Reconstructed months are not live marks.</p>` : ""}${holdings(c)}</td></tr>`;
}
function preRow(c) {
  const x = c.rec, g = x && x.gate, s = x && x.classStats;
  const n = c.rows.length || (x && x.universe ? x.universe.length : 0);
  const why = !x ? "not read yet" : [!g.universeComplete ? "universe not yet complete" : "universe complete", `top ${g.top} fresh ${g.topFresh}/${g.topRows}`, `last read ${mdy(s ? s.asOf : g.checked)}`].join(" · ");
  return `<tr class="cl-row pre" id="${c.tk.toLowerCase()}"><td class="yr"><b>${c.year}</b><small>${c.tk}</small></td><td class="pr">${c.products.length ? c.products.map((p) => esc(String(p.name).replace(/^\d{4}\s+/, ""))).join(" · ") : "—"}</td><td class="n">${n || "—"}</td><td class="await" colspan="${COLS - 3}"><span class="aw">awaiting marks</span><small>${esc(why)}</small></td></tr>`;
}
function b26Row() {
  if (!B26) return "";
  const s = cohortStats(B26), last = lastMark(B26), prev = weekBase(B26), wow = prev && last ? (last.level / prev.level - 1) * 100 : null;
  const top = s.topCard ? `${esc(s.topCard.player)} <small>#${esc(s.topCard.code)} · ${pct(s.topCard.share, 1)}</small>` : "—";
  return `<tr class="cl-row live b26" id="bow26"><td class="yr"><b>2026</b><small><a href="/bowman-1st-chrome-index">BOW26</a></small></td><td class="pr">${esc(String(B26.set || "").replace(/^\d{4}\s+/, ""))} <small>year-cohort index, its own page</small></td><td class="n">${s.n}</td><td class="n">${s.priced}<small>30-day screen</small></td><td class="n">${money(s.classValue)}</td><td class="n">${money(s.median)}</td><td class="tc">${top}</td><td class="n">${pct(s.top3Share)}</td><td class="n">${pct(s.hit20)} <small>/ ${pct(s.hit100)}</small></td><td class="n">—</td><td class="n">—</td><td class="lv">${last ? `<b>${last.level.toFixed(2)}</b><small>${B26.baseDate ? `100 = ${mon(B26.baseDate)}` : `since ${mdy(B26.inception)}`}${wow == null ? "" : ` · <span class="${wow >= 0 ? "up" : "dn"}">${wow >= 0 ? "▲" : "▼"} ${sgn(wow)}% w/w</span>`} · read ${mdy(last.date)}</small>` : "—"}</td><td class="x"><a class="cl-go" href="/bowman-1st-chrome-index" title="BOW26 — the 2026 1st Bowman Chrome Auto Index">open &rarr;</a></td></tr>`;
}

// ---------------- page ----------------
const nLive = live.length, nFiles = classes.length;
const desc = nLive
  ? `Every 1st Bowman Chrome Auto class since 2009 as its own price-weighted index: ${nLive} live, class value, median auto, hit rate at $20 and $100, skew, and a level that starts at 100 on its first live mark. Dated sold comps only.`
  : `The 1st Bowman Chrome Auto classes 2009–2025, each to become its own price-weighted index from dated sold comps: class value, median auto, hit rate at $20 and $100, skew. No class has cleared its marks yet; ${nFiles} universe file${nFiles === 1 ? "" : "s"} on hand.`;
const empty = `<div class="cl-empty"><b>No class has cleared its marks yet.</b> ${nFiles} class universe file${nFiles === 1 ? "" : "s"} on hand${read.length ? `, ${read.length} read at least once` : ""}. A class goes live, at 100.00 on that day, only when its universe is complete and each of its 20 priciest autos carries a fresh 90-day sold mark — until then it shows no prices. BOW26, the 2026 cohort, is live on <a href="/bowman-1st-chrome-index">its own page</a>.</div>`;
const chartHtml = nLive ? chart() : empty;
const tbody = classes.map((c) => c.live ? liveRow(c) : preRow(c)).join("\n") + b26Row();

const CSS = `
:root { --bg:#07090c; --p1:#0c1017; --p2:#111820; --bd:rgba(255,255,255,0.07); --bd2:rgba(255,255,255,0.12); --tx:#b8cdd4; --th:#e4f0f4; --dim:#7a969e; --ac:#00ccf5; --accent:#00ccf5; --gn:#00e07a; --gd:#f5c800; --rd:#ff2e55; --or:#ff8c00;
--text:#b8cdd4; --text-head:#e4f0f4; --text-dim:#7a969e; --border:rgba(255,255,255,0.07); --border2:rgba(255,255,255,0.12); --bg2:#0c1017; --bg3:#111820; --gold:#f5c800; --green:#00e07a; --red:#ff2e55; --fb:'Barlow',-apple-system,sans-serif; --fd:'Barlow Condensed',Impact,sans-serif; --fm:'JetBrains Mono',Menlo,monospace; }
* { margin:0; padding:0; box-sizing:border-box; }
body { background:var(--bg); color:var(--tx); font-family:var(--fb); font-size:13px; line-height:1.5; padding-bottom:60px; -webkit-font-smoothing:antialiased; }
a { color:var(--ac); text-decoration:none; } a:hover { color:#fff; }
.wrap { max-width:1120px; margin:0 auto; padding:0 24px; }
.crumb { font-family:var(--fm); font-size:10px; letter-spacing:2px; color:var(--dim); text-transform:uppercase; padding:14px 0 0; } .crumb b { color:var(--ac); }
.mast { display:grid; grid-template-columns:minmax(0,1fr) auto; column-gap:32px; align-items:end; padding:26px 0 10px; }
.eyebrow { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--ac); margin-bottom:8px; }
h1 { font-family:var(--fd); font-weight:900; font-size:clamp(28px,3.6vw,40px); letter-spacing:-.3px; text-transform:uppercase; color:var(--th); line-height:1.02; }
.sub { font-size:13px; color:var(--dim); margin-top:8px; max-width:680px; line-height:1.55; }
.stamp { font-family:var(--fm); font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); text-align:right; line-height:1.7; } .stamp b { color:var(--th); font-size:28px; letter-spacing:0; display:block; line-height:1; margin-bottom:6px; }
.buy { display:flex; flex-wrap:wrap; gap:8px 10px; align-items:center; margin:12px 0 0; padding:12px 14px; border:1px solid var(--bd); border-left:3px solid var(--gd); background:var(--p1); border-radius:3px; }
.buy .k { font-family:var(--fm); font-size:9.5px; letter-spacing:2px; text-transform:uppercase; color:var(--dim); margin-right:4px; }
.buy a { display:inline-flex; align-items:center; min-height:40px; padding:0 14px; font-family:var(--fd); font-weight:700; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#000; background:var(--gd); border-radius:2px; }
.buy a.alt { background:transparent; color:var(--th); border:1px solid var(--bd2); } .buy a:hover { filter:brightness(1.1); color:#000; } .buy a.alt:hover { border-color:var(--gd); color:var(--gd); }
.buy small { flex:1 1 100%; font-family:var(--fm); font-size:9.5px; color:var(--dim); line-height:1.5; }
.cl-chart { margin:18px 0 0; padding:14px 14px 10px; border:1px solid var(--bd); background:var(--p1); border-radius:3px; } .cl-chart svg { display:block; width:100%; height:auto; }
.cl-chart figcaption { font-family:var(--fm); font-size:10px; color:var(--dim); margin-top:8px; line-height:1.5; }
.cl-empty { margin:18px 0 0; padding:18px 16px; border:1px dashed var(--bd2); background:var(--p1); border-radius:3px; font-size:13px; color:var(--dim); line-height:1.6; } .cl-empty b { color:var(--th); }
h2 { font-family:var(--fd); font-weight:900; font-size:20px; letter-spacing:1.5px; text-transform:uppercase; color:var(--th); margin:28px 0 8px; }
.cl-tbl { overflow-x:auto; border:1px solid var(--bd); background:var(--p1); }
.cl-tbl table { width:100%; border-collapse:collapse; font-family:var(--fm); font-size:12px; }
.cl-tbl th { font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); text-align:right; padding:10px 10px; border-bottom:1px solid var(--bd2); white-space:nowrap; font-weight:400; }
.cl-tbl th:nth-child(1), .cl-tbl th:nth-child(2), .cl-tbl th:nth-child(7), .cl-tbl th:nth-child(12) { text-align:left; }
.cl-tbl td { padding:9px 10px; border-bottom:1px solid var(--bd); text-align:right; white-space:nowrap; vertical-align:middle; }
.cl-tbl td small { display:block; font-size:10px; color:var(--dim); white-space:normal; }
.cl-tbl td.yr, .cl-tbl td.pr, .cl-tbl td.tc, .cl-tbl td.lv, .cl-tbl td.await { text-align:left; }
.cl-tbl td.yr b { font-family:var(--fd); font-size:18px; color:var(--th); } .cl-tbl td.yr small { letter-spacing:1px; }
.cl-tbl td.pr { font-family:var(--fb); color:var(--tx); white-space:normal; min-width:150px; }
.cl-tbl td.tc { font-family:var(--fb); color:var(--th); white-space:normal; min-width:140px; }
.cl-tbl td.lv b { font-size:15px; color:var(--th); } .cl-tbl td.lv small { white-space:nowrap; }
.cl-tbl td.await .aw { font-family:var(--fd); font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); }
.cl-tbl tr.pre td { color:var(--dim); } .cl-tbl tr.b26 td.yr small a { color:var(--ac); }
.cl-tbl .up { color:var(--gn); } .cl-tbl .dn { color:var(--rd); }
.cl-x { width:40px; height:40px; background:transparent; border:1px solid var(--bd2); color:var(--ac); border-radius:2px; cursor:pointer; font-size:14px; } .cl-x[aria-expanded="true"] { background:var(--ac); color:#000; }
.cl-go { display:inline-flex; align-items:center; min-height:40px; padding:0 10px; font-family:var(--fd); font-weight:700; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#000; background:var(--ac); border-radius:2px; }
.cl-detail > td { padding:0 0 14px; white-space:normal; background:var(--bg); }
.cl-hold { padding:10px 10px 0; }
.cl-hold table { width:100%; border-collapse:collapse; font-family:var(--fm); font-size:12px; }
.cl-hold th { font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); text-align:right; padding:8px 10px; border-bottom:1px solid var(--bd2); font-weight:400; } .cl-hold th:nth-child(2) { text-align:left; }
.cl-hold td { padding:8px 10px; border-bottom:1px solid var(--bd); text-align:right; vertical-align:middle; }
.cl-hold td.rk { color:var(--ac); font-weight:700; width:30px; text-align:left; }
.cl-hold td.nm { text-align:left; } .cl-hold td.nm b { font-family:var(--fb); font-size:13px; color:var(--th); } .cl-hold td.nm small { display:block; font-size:10px; color:var(--dim); }
.cl-hold td.px { white-space:nowrap; } .cl-hold td.px b { color:var(--th); } .cl-hold td.px small { display:block; font-size:10px; color:var(--dim); white-space:normal; }
.cl-hold .carried { color:var(--or); } .cl-hold .thin { color:var(--or); } .cl-hold .notape { font-family:var(--fd); font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); }
.cl-hold td.act { white-space:nowrap; } .cl-hold td.act .sch-track-card { width:40px; height:40px; background:transparent; border:1px solid var(--bd2); color:var(--th); border-radius:2px; cursor:pointer; font-size:13px; vertical-align:middle; }
.cl-hold td.act a.ebay { display:inline-flex; align-items:center; min-height:40px; padding:0 12px; margin-left:6px; font-family:var(--fd); font-weight:700; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#000; background:var(--ac); border-radius:2px; vertical-align:middle; }
.cl-more { margin-top:8px; } .cl-more > summary { cursor:pointer; list-style:none; display:inline-flex; align-items:center; min-height:40px; font-family:var(--fd); font-weight:700; font-size:13px; letter-spacing:1.2px; text-transform:uppercase; color:var(--ac); border:1px solid var(--ac); border-radius:2px; padding:0 16px; margin:4px 0; }
.cl-more > summary::-webkit-details-marker { display:none; } .cl-more .c { display:none; } .cl-more[open] .o { display:none; } .cl-more[open] .c { display:inline; }
.cl-fine, .cl-recon { font-family:var(--fm); font-size:10px; color:var(--dim); line-height:1.6; margin:10px 0 0; } .cl-recon { margin:10px 10px 0; }
.method { font-size:12px; line-height:1.7; color:var(--dim); margin:18px 0 0; max-width:900px; } .method b { color:var(--tx); } .method a { color:var(--ac); }
.disc { font-family:var(--fm); font-size:9.5px; color:var(--dim); margin-top:22px; line-height:1.7; }
@media (max-width:800px) { .mast { display:block; } .stamp { text-align:left; margin-top:10px; } .cl-tbl th:nth-child(8), .cl-tbl td:nth-child(8), .cl-tbl th:nth-child(10), .cl-tbl td:nth-child(10), .cl-tbl th:nth-child(11), .cl-tbl td:nth-child(11) { display:none; } .cl-hold td.act a.ebay { padding:0 8px; font-size:10px; } }
`;

// the nav shell CSS every page carries in its own <style> (audit-site §14 reads it there; build-nav.js injects only the dropdown/search extras)
const NAVCSS = `/* NAV */
    .nav { position:sticky; top:0; z-index:200; background:rgba(7,9,12,0.95); backdrop-filter:blur(16px); border-bottom:1px solid var(--border2); }
.nav-inner { max-width:1080px; margin:0 auto; padding:0 24px; display:flex; align-items:center; justify-content:space-between; height:58px; }
.logo { font-family:var(--fd); font-size:20px; font-weight:900; letter-spacing:2px; text-transform:uppercase; color:var(--text-head); }
.logo span { color:var(--accent); }
.nav-links { display:flex; gap:4px; align-items:center; }
.nav-item { position:relative; }
.nav-item > a { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); transition:color 0.2s; padding:8px 12px; border-radius:2px; white-space:nowrap; }
.nav-item > a:hover { color:var(--text-head); text-decoration:none; background:rgba(255,255,255,0.04); }
.nav-item > a .chevron { font-size:8px; opacity:0.5; transition:transform 0.2s; }
.nav-item:hover > a .chevron { transform:rotate(180deg); }
.nav-dropdown { position:absolute; top:calc(100% + 1px); left:0; background:rgba(7,9,12,0.98); backdrop-filter:blur(20px); border:1px solid var(--border2); border-top:2px solid var(--accent); min-width:220px; padding:8px 0; opacity:0; visibility:hidden; transform:translateY(-6px); transition:opacity 0.18s ease, transform 0.18s ease, visibility 0.18s; z-index:300; }
.nav-item:hover .nav-dropdown { opacity:1; visibility:visible; transform:translateY(0); }
.nav-dropdown a { display:block; padding:9px 18px; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); transition:color 0.15s, background 0.15s; }
.nav-dropdown a:hover { color:var(--text-head); background:rgba(0,204,245,0.06); text-decoration:none; }
.nav-dropdown .dd-label { padding:6px 18px 4px; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--accent); opacity:0.6; }
.nav-dropdown hr { border:none; border-top:1px solid var(--border); margin:4px 0; }
.nav-cta { background:var(--accent) !important; color:#000 !important; padding:8px 18px; font-size:11px !important; font-weight:700 !important; border-radius:2px; margin-left:8px; }
.nav-cta:hover { background:#fff !important; text-decoration:none !important; }
@media(max-width:700px) { 
      .nav-links { display:none; } }
/* ─── HAMBURGER & MOBILE DRAWER ─── */
    .nav-hamburger { display:none; flex-direction:column; justify-content:center; gap:5px; width:40px; height:40px; background:none; border:none; cursor:pointer; padding:8px; z-index:210; }
.nav-hamburger span { display:block; width:22px; height:2px; background:var(--text-head); border-radius:2px; transition:all 0.25s ease; transform-origin:center; }
.nav-hamburger.open span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
.nav-hamburger.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
.nav-hamburger.open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }
.mobile-nav { display:none; position:fixed; top:58px; left:0; right:0; bottom:0; background:rgba(7,9,12,0.99); backdrop-filter:blur(20px); z-index:199; overflow-y:auto; padding:24px; opacity:0; transform:translateY(-8px); transition:opacity 0.2s ease, transform 0.2s ease; pointer-events:none; }
.mobile-nav.open { opacity:1; transform:translateY(0); pointer-events:all; }
.mobile-nav a { display:block; font-family:var(--fd); font-size:20px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); padding:16px 0; border-bottom:1px solid var(--border); transition:color 0.15s; }
.mobile-nav a:hover { color:var(--text-head); text-decoration:none; }
.mobile-nav .m-label { font-family:var(--fm); font-size:9px; letter-spacing:3px; text-transform:uppercase; color:var(--accent); opacity:0.6; padding:20px 0 6px; }
.mobile-nav .m-cta { background:var(--accent); color:#000 !important; text-align:center; padding:16px; margin-top:20px; border-bottom:none; font-weight:900; }
@media(max-width:768px) { 
      .nav-links { display:none !important; } 
      .nav-hamburger { display:flex !important; } 
      .mobile-nav { display:block !important; } }`;

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin">
<title>${esc(TITLE)} — every 1st Bowman Chrome Auto class as an index | ShopCardHub</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE}${CLASS_PAGE}">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${CLASS_PAGE}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE}/og/indices.png?v=20261019">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og/indices.png?v=20261019">
<link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/css/fonts.css">
<style>
${CSS}
${NAVCSS}
</style>
  <script data-gtag-deferred="G-2Q52C5EKG7">
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-2Q52C5EKG7');
    (function(){
      var done = false;
      function load(){
        if (done || navigator.webdriver) return; done = true;
        var s = document.createElement('script'); s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-2Q52C5EKG7';
        document.head.appendChild(s);
      }
      var evs = ['pointerdown','keydown','scroll','touchstart'];
      function onEv(){ load(); evs.forEach(function(e){ window.removeEventListener(e, onEv); }); }
      evs.forEach(function(e){ window.addEventListener(e, onEv, { passive:true }); });
      function idle(){ if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout:4000 }); else window.setTimeout(load, 4000); }
      if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle);
    })();
  </script>
  <link rel="stylesheet" href="/css/site-fixes.css">
</head><body>
<!-- NAV:START -->
<!-- NAV:END -->

<!-- SIGNUP:START — email capture under the buy strip. Generated by tools/build-signup.mjs; rendered by /js/signup.js. Do not hand-edit. -->
<div class="sch-signup" data-signup="${SLUG}" data-variant="tape"></div>
<script src="/js/signup.js?v=3" defer></script>
<!-- SIGNUP:END -->

<div class="wrap">
<div class="crumb">RESEARCH / <a href="/indices" style="color:var(--dim);">SET INDICES</a> / <b>BOWMAN CLASSES</b></div>

<section class="cl-top"${stamp ? ` data-prices-updated="${stamp}"` : ""}>
  <div class="mast">
    <div>
      <div class="eyebrow">▮ Class Ladder · Bowman Baseball</div>
      <h1>${esc(TITLE)}</h1>
      <p class="sub">One line per draft-and-signing class: every 1st Bowman Chrome Auto issued across that year's Bowman releases, priced from dated sold comps, one copy of each, uncapped. Autos only — the base card is a different buyer. Each class's level starts at 100.00 on the day it clears its first live mark.</p>
    </div>
    <div class="stamp">${nLive ? `<b>${nLive}</b>live class${nLive === 1 ? "" : "es"} · marks ${mdy(stamp)}<br>${pre.length} awaiting marks` : `<b>0</b>live classes<br>${nFiles} universe file${nFiles === 1 ? "" : "s"} on hand`}</div>
  </div>
  <div class="buy"><span class="k">Sealed</span>${SEALED.map((s, i) => `<a class="${i ? "alt" : ""}" href="${s.url}" target="_blank" rel="sponsored nofollow noopener">${esc(s.label)} &rarr;</a>`).join("")}<small>A live eBay search for the current year's hobby boxes, where the next class is pulled — a search, not a price. Affiliate links; ShopCardHub earns a commission at no cost to you.</small></div>
  ${chartHtml}
</section>

<h2>The ladder</h2>
<div class="cl-tbl"><table>
<thead><tr><th>Class</th><th>Products</th><th title="1st Bowman Chrome Autos in the class">n</th><th title="rows with a fresh 90-day sold mark">Priced</th><th title="one copy of every priced auto, at the latest sold marks">Class value</th><th>Median</th><th>Top card · share</th><th>Top 3</th><th title="share of the class (noTape counts as a miss) with a sold mark at $20 or more / $100 or more">Hit $20 / $100</th><th title="sample skewness of ln(price) across priced rows">Skew</th><th title="sample excess kurtosis of ln(price) across priced rows">Kurt</th><th>Level · since</th><th></th></tr></thead>
<tbody>
${tbody}
</tbody></table></div>

<p class="method"><b>Method.</b> A class is one year of Bowman: every player whose first Bowman autograph — the on-card 1st Bowman Chrome Auto, the card the hobby actually invests in — came in that year's Bowman, Bowman Chrome or Bowman Draft. Autos only, because the base 1st Bowman Chrome is the retail pick and the auto is the position; a paper card is never in. Each class is a closed cohort: nobody is added later, nobody is dropped, so the only thing that moves a level is price. Every auto in the class is priced on PriceCharting's dated ungraded eBay sales: the median of the clean single-card sales in the trailing 90 days, dated to the read. When nothing sold in 90 days the last clean sale on record is carried with its own date (a 2009 auto trades a few times a year, and carrying it is more honest than pretending it is unpriced); when no clean sale is on record at all the card is “no tape”, and it weighs 0 and counts as a miss in the hit rates. <b>The base is the build, not the release.</b> A class's level is 100.00 on the day it clears its first live mark — only then do we have a dated price on every card that matters — and it is never back-filled to the release date, because no dated sold tape exists for a release that happened years before the read. Where PriceCharting's monthly price history covers the basket it is shown as a reconstruction, chain-linked and indexed so the first live mark reads 100; a reconstructed month is context, not a live mark, and is labelled as such. A class is published only when its universe is complete and each of its 20 priciest autos carries a fresh 90-day mark; until then it says “awaiting marks” and shows no prices. Hit rates, skew and kurtosis are read across the class's priced rows (ln price, sample estimators, blank under eight rows). An index is a measurement, not a call. <a href="/how-prices-work">How prices work</a> · <a href="/bowman-1st-chrome-index">BOW26, the 2026 cohort</a> · <a href="/bowman-bangers">the Bangers board</a> · <a href="/indices">every ticker</a>.</p>

<p class="disc">Prices are dated sold comps (PriceCharting / SportsCardsPro ungraded eBay sales); never asks, never guide values. eBay links are affiliate links — ShopCardHub earns an eBay Partner Network commission on qualifying purchases at no cost to you. <a href="/affiliate-disclosure">Affiliate disclosure</a> · <a href="/privacy">Privacy</a>.</p>
</div>

<script>
(function(){
  document.querySelectorAll('.cl-x').forEach(function(b){
    b.addEventListener('click', function(){
      var d = document.getElementById(b.getAttribute('aria-controls')); if (!d) return;
      var open = d.hasAttribute('hidden'); if (open) d.removeAttribute('hidden'); else d.setAttribute('hidden', '');
      b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.textContent = open ? '▾' : '▸';
      if (window.gtag) gtag('event', 'class_expand', { cls: d.id.slice(2), open: open });
    });
  });
  if (location.hash) { var r = document.querySelector(location.hash + ' .cl-x'); if (r) r.click(); }
})();
</script>
<script src="/js/vault-track.js?v=6" defer></script>
</body></html>
`;

// keep an existing NAV block (build-nav.js owns it; the page is regenerated around it)
let out = html;
try {
  const cur = fs.readFileSync(FILE, "utf8");
  const m = cur.match(/<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/);
  if (m) out = out.replace(/<!-- NAV:START -->\n<!-- NAV:END -->/, () => m[0]);
  // and the Dataset JSON-LD blocks tools/build-index-jsonld.mjs bakes for each live class ticker (LD:BOWyy markers, before </head>)
  const ld = cur.match(/<!-- LD:[A-Z0-9]+:START -->[\s\S]*?<!-- LD:[A-Z0-9]+:END -->/g) || [];
  if (ld.length) out = out.replace("</head>", () => ld.join("\n") + "\n</head>");
} catch {}

// sitemap: opt-in, and only once a class is live (the page is indexable — robots index,follow — so audit-site accepts it)
let smNote = "sitemap: untouched";
if (SITEMAP) {
  const smPath = path.join(ROOT, "sitemap.xml"); let sm = fs.readFileSync(smPath, "utf8");
  const loc = `${SITE}${CLASS_PAGE}`;
  if (!nLive) smNote = "sitemap: no live class yet — page left out";
  else if (sm.includes(`<loc>${loc}</loc>`)) smNote = "sitemap: already listed";
  else { sm = sm.replace("</urlset>", `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`); if (!CHECK) fs.writeFileSync(smPath, sm); smNote = `sitemap: + ${CLASS_PAGE}`; }
}

if (!CHECK) fs.writeFileSync(FILE, out);
console.log(`${CHECK ? "would write" : "wrote"} ${SLUG}.html — ${nLive} live class${nLive === 1 ? "" : "es"}, ${pre.length} awaiting marks (${classes.map((c) => c.tk + (c.live ? "*" : "")).join(" ")}), BOW26 ${B26 ? "linked" : "not live"}, stamp ${stamp || "none"} · ${smNote}`);
