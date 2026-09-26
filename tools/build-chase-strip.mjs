#!/usr/bin/env node
// build-chase-strip.mjs — the CHASE strip on the six Pokémon chase-index pages (Sep 26 2026).
//
// Why (Mo, Sep 26, after the EPN read): eBay pays ~3% of the sale. A $150 ETB click is worth
// $4.62 when it converts; the one $1,950 card sale paid $58.50. The index pages already list
// the set's $200–$1,250 cards, but the first thing a reader could buy was the sealed box. This
// strip puts the set's three most valuable constituents — by their own dated sold mark — in the
// first buy position, each a single EPN-tagged eBay link (customid <tk>-<num>-chase, so the
// Custom ID report separates the strip from the table's per-card column).
//
// What it is not: a call. The strip states a dated sold price the page already publishes in its
// table and links to live listings. No new mark, no "buy", no ranking beyond "highest sold mark".
//
// Source of truth: the page's own `var CARDS = [...]` (written by remark-indices.mjs on Mondays).
// The baked HTML carries this run's prices; a small inline script re-reads window.CARDS on load
// so the strip can never fall behind the table between runs.
//
// Placement: after the stats/statnote block, before the Tuesday Tape capture and the SEALED row.
// The block is machine-owned: everything between the CHASE markers is replaced on re-run.
//
// Usage: node tools/build-chase-strip.mjs [--check] [--only <slug>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const ONLY = (() => { const i = process.argv.indexOf("--only"); return i > -1 ? process.argv[i + 1] : null; })();

const PAGES = ["pitch-black-index", "chaos-rising-index", "ascended-heroes-index", "prismatic-evolutions-index", "destined-rivals-index", "phantasmal-flames-index"];
const START = "<!-- CHASE:START";
const END = "<!-- CHASE:END -->";
const ANCHOR = '<div style="margin:14px 0 0;border:1px solid var(--bd);border-radius:3px;overflow:hidden;"><!-- Tuesday Tape capture';
const N = 3;          // cards in the strip
const MIN_PX = 50;    // a card under $50 is not a chase card; the strip shrinks rather than pads

const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const text = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const money = (v) => v >= 100 ? "$" + Math.round(v).toLocaleString("en-US") : "$" + v.toFixed(2);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dstr = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? `${MON[+m[2] - 1]} ${+m[3]}` : ""; };
const chaseUrl = (u, tk, num) => {
  const n = String(num).replace(/^#/, "").split("/")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
  return String(u).replace(/customid=[^&]*/, "customid=" + tk.toLowerCase() + "-" + n + "-chase");
};

const CSS = `<style>
.chase{margin:14px 0 0;padding:12px 14px 10px;border:1px solid var(--bd);border-left:2px solid var(--gd);border-radius:3px;background:var(--p1);}
.chase .ck{font-family:var(--fm);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:10px;}
.chase .ck b{color:var(--gd);font-weight:700;letter-spacing:2px;}
.chase .cg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
.chase a.cc{display:grid;grid-template-columns:44px minmax(0,1fr);grid-template-rows:auto auto auto;column-gap:10px;row-gap:2px;align-items:center;padding:9px 10px;border:1px solid var(--bd);border-radius:3px;background:rgba(255,255,255,.02);text-decoration:none;color:var(--tx);min-height:64px;transition:border-color .15s,background .15s;}
.chase a.cc:hover{border-color:var(--gd);background:rgba(245,200,0,.06);}
.chase .ci{grid-row:1/4;width:44px;height:62px;display:block;overflow:hidden;border-radius:2px;background:rgba(255,255,255,.04);}
.chase .ci img{width:44px;height:62px;object-fit:cover;display:block;}
.chase .cn{font-family:var(--fd);font-size:13px;line-height:1.15;color:var(--th);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.chase .cn small{font-family:var(--fm);font-size:9px;color:var(--dim);margin-left:5px;letter-spacing:1px;}
.chase .cp{font-family:var(--fm);font-size:12px;color:var(--th);}
.chase .cp b{font-family:var(--fd);font-size:16px;color:var(--gd);font-weight:700;margin-right:6px;}
.chase .cp small{font-size:9.5px;color:var(--dim);}
.chase .cgo{font-family:var(--fm);font-size:9.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#000;background:var(--gd);padding:5px 9px;border-radius:2px;justify-self:start;white-space:nowrap;}
.chase .cf{font-family:var(--fm);font-size:9.5px;color:var(--dim);margin-top:8px;line-height:1.5;}
@media(max-width:760px){.chase .cg{grid-template-columns:1fr;gap:7px;}.chase a.cc{min-height:0;}}
</style>`;

function parseCards(html) {
  const m = /var CARDS = (\[[\s\S]*?\]);\s*\n/.exec(html);
  if (!m) throw new Error("no CARDS array");
  return JSON.parse(m[1]);
}

// Reuse the table row's photo key when the same card already has one on the page (data/card-images.json
// resolves it without a search); otherwise a ph: key that card-img.js resolves by name.
function photoKey(html, c, tk, i) {
  // the page escapes ' as &#x27; in the attribute; match either spelling
  const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "(?:'|&#x27;|&#39;)");
  const re = new RegExp('data-card-img="([^"]+)"[^>]*data-card-name="' + esc(c.nm) + ' ' + esc(c.rar || "") + ' ' + esc(c.num));
  const m = re.exec(html);
  return m ? m[1] : "ph:" + tk.toLowerCase() + "-chase-" + i;
}

function block(tk, cards, html) {
  const top = cards.filter((c) => typeof c.px === "number" && c.px >= MIN_PX && c.ebay).sort((a, b) => b.px - a.px).slice(0, N);
  if (top.length < 2) return null;
  const asof = top.map((c) => c.asof).sort().pop();
  const lines = [];
  lines.push(`${START} — the set's most valuable cards by dated sold mark, first buy position. Generated by tools/build-chase-strip.mjs from this page's CARDS array; re-run after a re-mark (the inline script re-reads CARDS on load either way). Do not hand-edit. -->`);
  lines.push(CSS);
  lines.push(`<div class="chase" id="chase" data-chase="${attr(tk)}" data-prices-updated="${attr(asof)}">`);
  lines.push(`  <div class="ck"><b>Chase</b> · top ${top.length} by last sold · dated · the cards that carry this set</div>`);
  lines.push(`  <div class="cg">`);
  top.forEach((c, i) => {
    const num = String(c.num || "").split("/")[0];
    const label = `${c.nm} ${num}`.trim();
    lines.push(`    <a class="cc" href="${attr(chaseUrl(c.ebay, tk, c.num))}" target="_blank" rel="noopener sponsored" data-chase-i="${i}" title="${attr(c.tname || label)} — live eBay listings" onclick="if(typeof gtag==='function')gtag('event','chase_click',{item:'${attr(tk.toLowerCase())}-${attr(num.replace(/^#/, ""))}',page:location.pathname})">`);
    lines.push(`      <span class="ci" data-card-img="${attr(photoKey(html, c, tk, i))}" data-card-name="${attr(c.tname || label)}" data-card-sub="pokemon" data-card-size="row" data-card-surface="${attr(tk.toLowerCase())}-chase" data-card-link="off"></span>`);
    lines.push(`      <span class="cn">${text(c.nm)} ${text(num)}<small>${text(c.rar || "")}</small></span>`);
    lines.push(`      <span class="cp"><b data-chase-px>${money(c.px)}</b><small>sold · <span data-chase-asof>${dstr(c.asof)}</span></small></span>`);
    lines.push(`      <span class="cgo">Listings on eBay &rarr;</span>`);
    lines.push(`    </a>`);
  });
  lines.push(`  </div>`);
  lines.push(`  <div class="cf">Last sold price per card, dated, from the index table below — not a call. Links open live eBay listings (affiliate; ShopCardHub earns a commission at no cost to you).</div>`);
  lines.push(`</div>`);
  // keep the strip in step with CARDS if the table was re-marked after this bake
  lines.push(`<script>(function(){try{if(typeof CARDS==='undefined')return;var top=CARDS.filter(function(c){return typeof c.px==='number'&&c.px>=${MIN_PX}}).sort(function(a,b){return b.px-a.px}).slice(0,${N});var M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];var f=function(v){return v>=100?'$'+Math.round(v).toLocaleString('en-US'):'$'+v.toFixed(2)};var d=function(s){var m=/^(\\d{4})-(\\d{2})-(\\d{2})/.exec(String(s||''));return m?M[+m[2]-1]+' '+(+m[3]):''};document.querySelectorAll('#chase a.cc').forEach(function(a,i){var c=top[i];if(!c)return;var nm=(c.nm+' '+String(c.num||'').split('/')[0]).trim();var el=a.querySelector('.cn');if(el&&el.firstChild&&el.firstChild.nodeType===3&&el.firstChild.nodeValue.trim()!==nm)return;var px=a.querySelector('[data-chase-px]'),as=a.querySelector('[data-chase-asof]');if(px)px.textContent=f(c.px);if(as)as.textContent=d(c.asof);});}catch(e){}})();</script>`);
  lines.push(END);
  return lines.join("\n");
}

function insert(html, blk) {
  if (html.includes(START)) {
    const a = html.indexOf(START), b = html.indexOf(END, a);
    if (b === -1) throw new Error("CHASE:START without END");
    return html.slice(0, a) + blk + html.slice(b + END.length);
  }
  const at = html.indexOf(ANCHOR);
  if (at === -1) return null;
  return html.slice(0, at) + blk + "\n" + html.slice(at);
}

const changed = [], skipped = [];
for (const slug of PAGES) {
  if (ONLY && slug !== ONLY) continue;
  const f = path.join(REPO, slug + ".html");
  if (!fs.existsSync(f)) { skipped.push(`${slug} — not on disk`); continue; }
  const html = fs.readFileSync(f, "utf8");
  const tk = (/class="idx-chart" data-ticker="([A-Z0-9]+)"/.exec(html) || [])[1];
  if (!tk) { skipped.push(`${slug} — no ticker`); continue; }
  const blk = block(tk, parseCards(html), html);
  if (!blk) { skipped.push(`${slug} — fewer than 2 cards at $${MIN_PX}+`); continue; }
  const next = insert(html, blk);
  if (next === null) { skipped.push(`${slug} — anchor not found`); continue; }
  if (next !== html) { changed.push(slug); if (!CHECK) fs.writeFileSync(f, next); }
}
console.log(`${CHECK ? "check" : "write"}: ${changed.length} page(s) ${CHECK ? "stale" : "updated"}${changed.length ? " — " + changed.join(", ") : ""}`);
for (const s of skipped) console.log("  skip " + s);
if (CHECK && changed.length) process.exit(1);
