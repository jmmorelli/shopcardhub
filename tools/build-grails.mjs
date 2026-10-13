#!/usr/bin/env node
// build-grails.mjs — GSTAR · Gold Star & Grails, a cross-set BOARD of the hobby's blue chips (Oct 13 2026).
//
// Why (Mo, Oct 13 2026: "start all that stuff right now … pretend you are a collector and an investor … the longer
// term hold"): the Sep 10 – Oct 11 PSA 10 record prints (Torchic ☆ $2.7M, 1st Ed Charizard $1.385M, Legendary
// Collection Pikachu $780K, Holon Phantoms Pikachu ☆ $480K, Double Crisis Kyogre EX $348K) all sit in sets the site did
// not track. The Pokémon KB coverage report (Oct 5) called the Gold Stars the biggest hole and ruled "one Gold Star
// page, not ten indices" — approved for the Oct 7 build, slipped. This is that page, widened to the EX-era grails.
//
// What it is: a board, not an index. 27 English Gold Star (☆) cards (EX Team Rocket Returns → EX Power Keepers, plus
// POP Series 5), the two Double Crisis Team EX cards, six Legendary Collection reverse holos. Every card carries a RAW
// sold mark and a graded ladder (PSA 9 · PSA 10 · TAG 10) read the same way the card pages read theirs
// (tools/build-card-ladder.mjs: a graded figure is a median of >= 3 dated sales whose own title names the grade, else one
// dated sale printed as such, else "No verified sale" — LANE-RULES R18). No index level is published: graded sales are
// too thin to screen (the rule for a PSA 10 line is >= 4 PSA 10 sales per card per 90 days), and a raw level on cards
// that trade graded would be an auction wearing an index number. The page says so.
//
// DATA: one PriceCharting item page per card — ungraded sold rows (90-day median, widened to 180/365 and flagged thin
// below 4 sales, the holo-rule window ladder), grade tabs by title, monthly history for the data file. Titles are read in
// memory for the filters and never stored (R17). Asks are never used (R20). The Graded Tape rows (auction-house record
// prints) live in data/graded-tape.json, each with house, date, grade, price and source — one sales row each (R18).
//
// Usage:  node tools/build-grails.mjs            read PriceCharting, write data/grails.json, bake the page block
//         node tools/build-grails.mjs --bake     re-bake the page block from data/grails.json only (no network)
//         node tools/build-grails.mjs --dry      read, print, write nothing
// Writes: data/grails.json, gold-star-index.html between <!-- GSTAR:START --> … <!-- GSTAR:END --> and the BUYBOX markers.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { soldRows, medianOf } from "./league/lib.mjs";
import { ladderFromHtml, histFromHtml } from "./build-card-ladder.mjs";
import { ebaySearchUrl, SACAT_TCG, assertClean } from "./lib/epn.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const BAKE = args.includes("--bake"), DRY = args.includes("--dry");
const TODAY = process.env.GRAILS_TODAY || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const PAUSE = 1600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const days = (d) => (Date.parse(TODAY) - Date.parse(d)) / 864e5;
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = (x) => x == null ? "—" : "$" + Math.round(x).toLocaleString("en-US");
const money2 = (x) => x == null ? "—" : "$" + x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const md = (d) => { const p = String(d).slice(0, 10).split("-"); return `${MONS[+p[1] - 1]} ${+p[2]}`; };
const mdy = (d) => { const p = String(d).slice(0, 10).split("-"); return `${MONS[+p[1] - 1]} ${+p[2]}, ${p[0]}`; };

export const TICKER = "GSTAR", PAGE = "gold-star-index", THEME = "#f5c800";
// kind: star = Gold Star ☆ · teamex = Double Crisis Team EX · rev = Legendary Collection reverse holo
// img = pokemontcg.io set code (ex7 Team Rocket Returns … base6 Legendary Collection). The reverse holos share the regular print's scan.
const SETS = {
  "pokemon-team-rocket-returns": { set: "EX Team Rocket Returns", year: 2004, img: "ex7", q: "team rocket returns" },
  "pokemon-deoxys": { set: "EX Deoxys", year: 2005, img: "ex8", q: "ex deoxys" },
  "pokemon-unseen-forces": { set: "EX Unseen Forces", year: 2005, img: "ex10", q: "unseen forces" },
  "pokemon-delta-species": { set: "EX Delta Species", year: 2005, img: "ex11", q: "delta species" },
  "pokemon-legend-maker": { set: "EX Legend Maker", year: 2006, img: "ex12", q: "legend maker" },
  "pokemon-holon-phantoms": { set: "EX Holon Phantoms", year: 2006, img: "ex13", q: "holon phantoms" },
  "pokemon-crystal-guardians": { set: "EX Crystal Guardians", year: 2006, img: "ex14", q: "crystal guardians" },
  "pokemon-dragon-frontiers": { set: "EX Dragon Frontiers", year: 2006, img: "ex15", q: "dragon frontiers" },
  "pokemon-power-keepers": { set: "EX Power Keepers", year: 2007, img: "ex16", q: "power keepers" },
  "pokemon-pop-series-5": { set: "POP Series 5", year: 2007, img: "pop5", q: "pop series 5" },
  "pokemon-double-crisis": { set: "Double Crisis", year: 2015, img: "dc1", q: "double crisis" },
  "pokemon-legendary-collection": { set: "Legendary Collection", year: 2002, img: "base6", q: "legendary collection reverse holo" },
};
// (name, number, PriceCharting path) — discovered from the set console pages Oct 13 2026; never invent a path.
export const UNIVERSE = [
  ["Mudkip", 107, "pokemon-team-rocket-returns/mudkip-gold-star-107", "star"],
  ["Torchic", 108, "pokemon-team-rocket-returns/torchic-gold-star-108", "star"],
  ["Treecko", 109, "pokemon-team-rocket-returns/treecko-gold-star-109", "star"],
  ["Latias", 105, "pokemon-deoxys/latias-gold-star-105", "star"],
  ["Latios", 106, "pokemon-deoxys/latios-gold-star-106", "star"],
  ["Rayquaza", 107, "pokemon-deoxys/rayquaza-gold-star-107", "star"],
  ["Entei", 113, "pokemon-unseen-forces/entei-gold-star-113", "star"],
  ["Raikou", 114, "pokemon-unseen-forces/raikou-gold-star-114", "star"],
  ["Suicune", 115, "pokemon-unseen-forces/suicune-gold-star-115", "star"],
  ["Groudon", 111, "pokemon-delta-species/groudon-gold-star-111", "star"],
  ["Kyogre", 112, "pokemon-delta-species/kyogre-gold-star-112", "star"],
  ["Metagross", 113, "pokemon-delta-species/metagross-gold-star-113", "star"],
  ["Regice", 90, "pokemon-legend-maker/regice-gold-star-90", "star"],
  ["Regirock", 91, "pokemon-legend-maker/regirock-gold-star-91", "star"],
  ["Registeel", 92, "pokemon-legend-maker/registeel-gold-star-92", "star"],
  ["Gyarados", 102, "pokemon-holon-phantoms/gyarados-gold-star-102", "star"],
  ["Mewtwo", 103, "pokemon-holon-phantoms/mewtwo-gold-star-103", "star"],
  ["Pikachu", 104, "pokemon-holon-phantoms/pikachu-gold-star-104", "star"],
  ["Alakazam", 99, "pokemon-crystal-guardians/alakazam-gold-star-99", "star"],
  ["Celebi", 100, "pokemon-crystal-guardians/celebi-gold-star-100", "star"],
  ["Charizard", 100, "pokemon-dragon-frontiers/charizard-gold-star-100", "star"],
  ["Mew", 101, "pokemon-dragon-frontiers/mew-gold-star-101", "star"],
  ["Flareon", 100, "pokemon-power-keepers/flareon-gold-star-100", "star"],
  ["Jolteon", 101, "pokemon-power-keepers/jolteon-gold-star-101", "star"],
  ["Vaporeon", 102, "pokemon-power-keepers/vaporeon-gold-star-102", "star"],
  ["Espeon", 16, "pokemon-pop-series-5/espeon-gold-star-16", "star"],
  ["Umbreon", 17, "pokemon-pop-series-5/umbreon-gold-star-17", "star"],
  ["Team Aqua's Kyogre EX", 6, "pokemon-double-crisis/team-aqua%27s-kyogre-ex-6", "teamex"],
  ["Team Magma's Groudon EX", 15, "pokemon-double-crisis/team-magma%27s-groudon-ex-15", "teamex"],
  ["Charizard", 3, "pokemon-legendary-collection/charizard-reverse-holo-3", "rev"],
  ["Dark Blastoise", 4, "pokemon-legendary-collection/dark-blastoise-reverse-holo-4", "rev"],
  ["Gengar", 11, "pokemon-legendary-collection/gengar-reverse-holo-11", "rev"],
  ["Venusaur", 18, "pokemon-legendary-collection/venusaur-reverse-holo-18", "rev"],
  ["Mewtwo", 29, "pokemon-legendary-collection/mewtwo-reverse-holo-29", "rev"],
  ["Pikachu", 86, "pokemon-legendary-collection/pikachu-reverse-holo-86", "rev"],
].map(([name, num, pcPath, kind]) => {
  const slug = pcPath.split("/")[0], s = SETS[slug];
  const key = `${slug.replace(/^pokemon-/, "").replace(/[^a-z0-9]+/g, "")}-${num}`;
  const label = kind === "star" ? `${name} ☆` : kind === "rev" ? `${name} (reverse holo)` : name;
  // eBay phrase (data-q): grade-links.js appends the grade words; the baked raw link appends the RAW exclusions
  const q = kind === "star" ? `pokemon ${s.q} ${name} gold star ${num}` : kind === "rev" ? `pokemon legendary collection ${name} reverse holo ${num}` : `pokemon double crisis ${name.replace(/'s/, "s")} ${num}`;
  return { key, name, label, num, kind, set: s.set, year: s.year, img: `https://images.pokemontcg.io/${s.img}/${num}.png`, pcPath, q };
});

const RAW_NOT = " -psa -cgc -bgs -sgc -tag -beckett -graded -slab" ;
async function get(url) {
  for (let i = 1; i <= 4; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(6000 * i); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }
  throw new Error("rate limited after 4 attempts");
}
// raw mark: the holo-rule window ladder (90 → 180 → 365 days), median of clean single-card ungraded rows; thin below 4
function rawMark(html) {
  const rows = soldRows(html, "used").filter((r) => !/\blot\b|proxy|custom|reprint|psa|cgc|bgs|sgc|\btag\b|graded|slab/i.test(r.title));
  for (const win of [90, 180, 365]) {
    const w = rows.filter((r) => days(r.date) <= win);
    if (w.length >= 4 || win === 365) {
      if (!w.length) return { m: null, n: 0, win, thin: true, last: null };
      const last = w.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
      return { m: r2(medianOf(w.map((r) => r.price))), n: w.length, win, thin: w.length < 4, last: { d: last.date, p: r2(last.price) } };
    }
  }
}

async function read() {
  const prev = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "data/grails.json"), "utf8")); } catch (e) { return null; } })();
  const prevBy = Object.fromEntries(((prev && prev.cards) || []).map((c) => [c.key, c]));
  const cards = []; let errs = 0;
  for (const c of UNIVERSE) {
    try {
      const html = await get("https://www.pricecharting.com/game/" + c.pcPath);
      const raw = rawMark(html), ladder = ladderFromHtml(html, false), hist = histFromHtml(html, "2021-01");
      cards.push({ ...c, raw, psa9: ladder.psa9, psa10: ladder.psa10, tag10: ladder.tag10, asOf: TODAY, hist });
      console.log(`  ${c.label.padEnd(28)} ${c.set.padEnd(24)} raw ${String(money(raw.m)).padStart(9)} (n${raw.n}/${raw.win}d) · psa9 ${money(ladder.psa9 && ladder.psa9.m)} · psa10 ${money(ladder.psa10 && ladder.psa10.m)}${ladder.psa10 && ladder.psa10.last ? " last " + ladder.psa10.last.d + " " + money(ladder.psa10.last.p) : ""}`);
    } catch (e) {
      errs++; console.error("  " + c.label + " " + e.message + (prevBy[c.key] ? " — keeping the previous read" : ""));
      if (prevBy[c.key]) cards.push(prevBy[c.key]);
    }
    await sleep(PAUSE);
  }
  return { day: TODAY, cards, errs };
}

// ---------------- page block ----------------
const L = (q, cid) => assertClean(ebaySearchUrl({ q, customid: cid, sacat: SACAT_TCG, av: true })).replace(/&/g, "&amp;");
const gcell = (g, kind) => {
  if (!g) return `<td class="num dim" title="no ${kind} sales found">—</td>`;
  if (g.m != null) return `<td class="num" title="${kind}: median of ${g.n} dated sales, ${g.basis}">${money(g.m)}<small>${g.n} sales · ${g.basis}</small></td>`;
  if (g.last) return `<td class="num dim" title="${kind}: one dated sale, not a mark">${money(g.last.p)}<small>1 sale · ${md(g.last.d)}</small></td>`;
  return `<td class="num dim" title="${kind}: no verified sale in the last year"><small>no verified sale</small></td>`;
};
function block(D, tape) {
  const cards = D.cards.slice().sort((a, b) => (b.raw.m || 0) - (a.raw.m || 0));
  const priced = cards.filter((c) => c.raw.m != null);
  const oneOfEach = priced.reduce((s, c) => s + c.raw.m, 0);
  const p10 = cards.filter((c) => c.psa10 && c.psa10.m != null);
  const mult = p10.filter((c) => c.raw.m).map((c) => c.psa10.m / c.raw.m);
  const medMult = mult.length ? medianOf(mult) : null;
  const stars = cards.filter((c) => c.kind === "star").length;
  const sidxCss = (fs.readFileSync(path.join(ROOT, "skyridge-index.html"), "utf8").match(/<style id="sidx-css">[\s\S]*?<\/style>/) || [""])[0];
  if (!sidxCss) throw new Error("sidx-css not found in skyridge-index.html");
  const rows = cards.map((c, i) => {
    const cid = `gstar-${c.key}`;
    const sub = `${esc(c.set)} · ${c.year}${c.raw.thin ? ` · <span class="thin" title="fewer than 4 clean raw sales in ${c.raw.win} days">thin · ${c.raw.n} sale${c.raw.n === 1 ? "" : "s"} / ${c.raw.win}d</span>` : ` · ${c.raw.n} sales / ${c.raw.win}d`}`;
    return `<tr data-q="${esc(c.q)}" data-cid="${cid}" data-av="1"><td class="rk">${i + 1}</td><td class="nm"><div class="nm-cell"><span data-card-img="src:${c.img}" data-card-name="${esc(c.label)} #${c.num} ${esc(c.set)}" data-card-sub="pokemon" data-card-size="thumb" data-card-surface="gstar-list" data-card-link="off"></span><div><b>${esc(c.label)}</b> <span class="dim">#${c.num}</span><small>${sub}</small></div></div></td>` +
      `<td class="num">${c.raw.m != null ? money2(c.raw.m) : `<span class="dim">${c.raw.last ? money(c.raw.last.p) + "<small>1 dated sale, " + md(c.raw.last.d) + "</small>" : "No verified sale"}</span>`}</td>` +
      gcell(c.psa9, "PSA 9") + gcell(c.psa10, "PSA 10") + gcell(c.tag10, "TAG 10") +
      `<td class="act g"><span class="act-w g"><button type="button" class="sch-track-card" data-name="${esc(c.label)} #${c.num} — ${esc(c.set)}" data-set="${esc(c.set)}" data-cat="pokemon" data-grade="Raw" data-price="${c.raw.m || ""}" title="Watch this card">★</button><span class="glk"><a class="ebay g-raw" data-g="raw" href="${L(c.q + RAW_NOT, cid)}" target="_blank" rel="sponsored nofollow noopener" title="Raw (ungraded) copies on eBay — Authenticity Guarantee filter on">Raw</a></span><span class="sidx-auc-slot"></span></span></td></tr>`;
  }).join("\n    ");
  const tapeRows = tape.rows.map((r, i) => `<tr><td class="rk">${i + 1}</td><td class="nm"><b>${esc(r.card)}</b><small>${esc(r.set)} · ${esc(r.grade)}</small></td><td class="num">${money(r.price)}</td><td class="dim">${esc(r.house)}<br><small>${md(r.date)}</small></td><td class="num dim">${r.prior ? money(r.prior.price) + `<small>${esc(r.prior.when)}</small>` : "—"}</td><td class="num ${r.prior ? (r.price >= r.prior.price ? "up" : "dn") : "dim"}">${r.prior ? (r.price / r.prior.price >= 3 ? (r.price / r.prior.price).toFixed(0) + "×" : ((r.price / r.prior.price - 1) * 100).toFixed(0) + "%") : "—"}</td><td class="act g"><span class="glk"><a class="ebay g-psa10" href="${L(r.q + " psa 10", "gstar-tape-" + r.id)}" target="_blank" rel="sponsored nofollow noopener" title="PSA 10 copies on eBay — Authenticity Guarantee filter on">PSA 10 &rarr;</a></span></td></tr>`).join("\n    ");
  const tapeDates = tape.rows.map((r) => r.date).sort();
  return `<!-- GSTAR:START -->
${sidxCss}
<style>
.sidx-tbl td small{display:block;font-size:10px;color:var(--sidx-dim);font-weight:400;line-height:1.3;margin-top:2px;white-space:normal}
.sidx-tbl td.nm{white-space:normal;min-width:180px} .sidx-tbl td.nm b{white-space:nowrap}
.sidx-tbl td.num small{white-space:nowrap}
@media(min-width:761px){.sidx-tbl td.act .glk{flex-wrap:nowrap}}
.sidx-tbl td.act .act-w.g .sidx-auc-slot{min-width:0}
.sidx-tbl td.num{font-variant-numeric:tabular-nums}
.gs-read{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:18px 0 0}
.gs-read>div{border:1px solid var(--sidx-bd);border-left:3px solid var(--sidx);background:var(--sidx-bg);padding:14px 16px}
.gs-read h3{font-family:var(--fd,'Barlow Condensed',sans-serif);font-size:17px;font-weight:900;text-transform:uppercase;color:var(--sidx-th);margin:0 0 8px;letter-spacing:.3px}
.gs-read p{font-size:13px;line-height:1.6;color:var(--text,#b8cdd4);margin:0 0 8px}
.gs-read p:last-child{margin-bottom:0}
.gs-tape{margin-top:22px}
.gs-tape .sidx-cap{margin-top:0}
.gs-tape .sidx-tbl th:nth-child(3),.gs-tape .sidx-tbl td:nth-child(3){text-align:left}
.gs-tape .sidx-tbl td.nm b{font-size:13px}
.gs-tape .sidx-tbl td.act .glk a.ebay{min-width:84px}
.sidx-level .lv.board{font-size:30px;letter-spacing:1px}
@media(max-width:760px){.gs-read{grid-template-columns:1fr}
/* phones: the house grid shows #, card, raw and the buttons; this table has PSA 9 · PSA 10 · TAG too — show PSA 10 on its own line, hide PSA 9 and TAG (the buttons still open them) */
body #gstar .sidx-tbl td:nth-child(6),body #gstar .sidx-tbl th:nth-child(6){display:none}
body #gstar .sidx-tbl tbody td:nth-child(5){display:block;grid-column:2/-1;text-align:left;padding-top:6px;font-size:12px}
body #gstar .sidx-tbl tbody td:nth-child(5)::before{content:"PSA 10 · ";color:var(--sidx-dim);font-size:10px;letter-spacing:1px;text-transform:uppercase}
body #gstar .sidx-tbl tbody td:nth-child(5) small{display:inline;margin-left:6px}
body #gstar .gs-tape .sidx-tbl tbody td:nth-child(5)::before{content:"Prior · "}
body #gstar .gs-tape .sidx-tbl tbody td:nth-child(4){display:block;grid-column:2/-1;text-align:left;padding-top:4px;font-size:11px}
body #gstar .gs-tape .sidx-tbl tbody td:nth-child(4) br{display:none}
body #gstar .gs-tape .sidx-tbl tbody td:nth-child(4) small{display:inline;margin-left:6px}
body #gstar .gs-tape .sidx-tbl tbody td:nth-child(6){display:block;grid-column:2/-1;text-align:left;font-size:12px}
body #gstar .gs-tape .sidx-tbl tbody td:nth-child(6)::before{content:"Move · ";color:var(--sidx-dim);font-size:10px;letter-spacing:1px;text-transform:uppercase}
}
</style>
<div class="container"><section class="sidx" id="gstar" data-prices-updated="${D.day}" data-no-repoint data-glk style="--sidx:${THEME};">
  <div class="sidx-mast">
    <div class="sidx-t">
      <div class="sidx-eyebrow">▮ Board · Cross-Set · Gold Stars &amp; EX-Era Grails</div>
      <h1 class="sidx-ttl"><span class="sidx-tk">GSTAR</span> <span class="sidx-dot">·</span> Gold Star &amp; Grails</h1>
      <p class="sidx-sub">${esc(tape.copy.intro)}</p>
    </div>
    <figure class="sidx-photo"><span data-card-img="src:${cards[0].img}" data-card-name="${esc(cards[0].label)} #${cards[0].num} ${esc(cards[0].set)}" data-card-sub="pokemon" data-card-size="hero" data-card-surface="gstar-hero"></span><figcaption>#1 by raw mark · <b>${esc(cards[0].label)}</b> · ${esc(cards[0].set)}</figcaption></figure>
    <div class="sidx-level"><div class="lv board">BOARD</div><div class="lvc"><b class="sidx-cost" title="what one raw copy of every priced card on the board costs at the latest sold marks">${money(oneOfEach)} for one raw copy of each</b> · ${priced.length} of ${cards.length} priced · no index level: graded sales are too thin to screen · read ${mdy(D.day)}</div></div>
  </div>
  <div class="sidx-stats">
    <div><span class="k">Cards on the board</span><span class="v">${cards.length} <i>/ ${stars} ☆</i></span></div>
    <div><span class="k">One raw of each</span><span class="v">${money(oneOfEach)}</span></div>
    <div><span class="k">PSA 10 marks (≥3 sales)</span><span class="v">${p10.length} <i>/ ${cards.length}</i></span></div>
    <div><span class="k">PSA 10 ÷ raw, median</span><span class="v">${medMult ? medMult.toFixed(1) + "×" : "—"}</span></div>
    <div><span class="k">Sets covered</span><span class="v">${new Set(cards.map((c) => c.set)).size}</span></div>
    <div><span class="k">Years</span><span class="v">2002–15</span></div>
    <div><span class="k">Level</span><span class="v">none <i>by rule</i></span></div>
    <div><span class="k">Re-read</span><span class="v">MON · THU</span></div>
  </div>
  <div class="glk-bar" role="group" aria-label="Which eBay listings the buttons open"><span class="glk-k">Buy buttons open</span><button type="button" data-mode="bin" aria-pressed="true">Buy It Now</button><button type="button" data-mode="auc" aria-pressed="false">Auctions · ending soon</button><span class="glk-n">Raw · PSA 9 · PSA 10 · TAG on every row · marks are medians of dated sold rows, one sale is printed as one sale</span></div>
  <div class="sidx-cap">All ${cards.length} cards by raw sold mark · PSA 9 · PSA 10 · TAG 10 · read ${mdy(D.day)}</div>
  <div class="sidx-tbl"><table>
    <thead><tr><th>#</th><th>Card</th><th>Raw mark</th><th>PSA 9</th><th>PSA 10</th><th>TAG 10</th><th class="th-act g">Watch · Buy raw / graded</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
  <p class="sidx-note">${esc(tape.copy.tagLine)} Raw mark = median of clean ungraded sold rows in the trailing 90 days (180 or 365 where 90 holds fewer than 4, flagged thin). A graded mark = median of at least 3 dated sales whose own title names the grade, in 30 days, else at least 2 in 90; fewer prints as one dated sale. Source: PriceCharting's dated sold lists (blended eBay + TCGplayer), never asks. Watch ★ adds the raw card to your watchlist.</p>

  <div class="gs-tape" id="graded-tape">
    <div class="sidx-cap">The graded tape · PSA 10 record prints · ${md(tapeDates[0])} – ${mdy(tapeDates[tapeDates.length - 1])}</div>
    <p class="sidx-note" style="margin:0 0 10px">${esc(tape.copy.tapeLead)}</p>
    <div class="sidx-tbl"><table>
    <thead><tr><th>#</th><th>Card</th><th>Price</th><th>House · date</th><th>Prior comp</th><th>Move</th><th class="th-act g">eBay</th></tr></thead>
    <tbody>${tapeRows}</tbody>
    </table></div>
    <p class="sidx-note">${esc(tape.copy.tapeFoot)} Sources: ${tape.sources.map((s) => esc(s)).join(" · ")}.</p>
  </div>

  <div class="gs-read">
    <div><h3>Reading the prints</h3>${tape.copy.reading.split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div><h3>Who is buying the slabs</h3>${tape.copy.buyers.split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  </div>
  <p class="sidx-note">${esc(tape.copy.footer)} Links open live eBay listings (affiliate; ShopCardHub earns a commission at no cost to you). <a href="/indices">Every ticker</a> · <a href="/how-prices-work">how prices work</a> · <a href="/tag-grading-guide">TAG grading</a>.</p>
</section></div>
<!-- GSTAR:END -->`;
}

function buybox(copy) {
  const ga = (item) => `onclick="if(typeof gtag==='function')gtag('event','buystrip_click',{item:'${item}',page:location.pathname})"`;
  return `<!-- BUYBOX:START — Gold Star cards on eBay, above the fold (R11). Searches, not prices. -->
<style>
.ci-buy{max-width:1060px;margin:18px auto 0;padding:0 24px}
.ci-buy .bs{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;background:var(--p1);border:1px solid var(--bd);border-left:3px solid ${THEME};padding:12px 16px;font-family:var(--fm);font-size:11px;color:var(--dim)}
.ci-buy .bs b{color:var(--th);font-family:var(--fd);font-size:13px;letter-spacing:1.5px;text-transform:uppercase}
.ci-buy .bs a{display:inline-block;font-family:var(--fd);font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#000;background:var(--gd);padding:7px 12px;border-radius:2px;text-decoration:none}
.ci-buy .bs a.alt{background:transparent;color:var(--th);border:1px solid var(--bd2)}
.ci-buy .bs a:hover{filter:brightness(1.1)}
.ci-buy .bs .n{flex:1 1 100%;font-size:10px;line-height:1.6}
@media(max-width:640px){.ci-buy .bs b{flex:1 1 100%}.ci-buy .bs a{display:inline-flex;align-items:center;justify-content:center;min-height:40px;flex:1 1 40%}.ci-buy .bs a:not(.alt){flex-basis:100%}.ci-buy .bs .n{font-size:11px}}
</style>
<div class="ci-buy"><div class="bs">
  <b>Gold Stars on eBay</b>
  <a href="${L("pokemon gold star -psa -cgc -bgs -sgc -tag -beckett -graded -slab -lot -proxy -custom -japanese", "gstar-singles")}" target="_blank" rel="noopener sponsored" ${ga("primary")}>Raw Gold Stars &rarr;</a>
  <a class="alt" href="${L("pokemon gold star psa 10", "gstar-psa10")}" target="_blank" rel="noopener sponsored" ${ga("graded")}>PSA 10 &rarr;</a>
  <a class="alt" href="${L('pokemon gold star "TAG 10" -team -psa -cgc', "gstar-tag")}" target="_blank" rel="noopener sponsored" ${ga("tag")}>TAG 10 &rarr;</a>
  <span class="n">eBay searches with our affiliate tag, not prices. The board below prices each card from dated sold comps.</span>
</div></div>
<!-- BUYBOX:END -->`;
}

async function main() {
  const tape = JSON.parse(fs.readFileSync(path.join(ROOT, "data/graded-tape.json"), "utf8"));
  let D;
  if (BAKE) D = JSON.parse(fs.readFileSync(path.join(ROOT, "data/grails.json"), "utf8"));
  else {
    D = await read();
    if (D.errs && D.cards.length < UNIVERSE.length) throw new Error(`${D.errs} cards failed to read and had no previous read — not writing`);
    if (!DRY) fs.writeFileSync(path.join(ROOT, "data/grails.json"), JSON.stringify({ _comment: "GENERATED by tools/build-grails.mjs — GSTAR Gold Star & Grails board. raw = median of clean ungraded sold rows (win = days, thin below 4); psa9/psa10/tag10 per tools/build-card-ladder.mjs (R18); hist = PriceCharting monthly [month, ungraded, Grade 9, PSA 10], their estimate, context only. No titles stored.", ticker: TICKER, page: "/" + PAGE, model: "board", status: "live", day: D.day, cards: D.cards }, null, 0) + "\n");
  }
  const pf = path.join(ROOT, PAGE + ".html");
  let h = fs.readFileSync(pf, "utf8");
  const blk = block(D, tape);
  if (!h.includes(`<!-- ${TICKER}:START -->`)) throw new Error("page has no " + TICKER + " markers — scaffold it with new-sector-page.mjs first");
  h = h.replace(new RegExp(`<!-- ${TICKER}:START -->[\\s\\S]*?<!-- ${TICKER}:END -->`), () => blk);
  h = h.replace(/<!-- BUYBOX:START[\s\S]*?<!-- BUYBOX:END -->/, () => buybox(tape.copy));
  // head: this is a board, not a set index
  const title = `GSTAR · Gold Star & Grails — 27 Gold Stars, Double Crisis EX, Legendary Collection reverse holos: raw, PSA 9, PSA 10, TAG 10 | ShopCardHub`;
  const desc = `Every English Gold Star card (EX era, 2004–2007), the Double Crisis Team EX pair and six Legendary Collection reverse holos, each with dated sold marks for raw, PSA 9, PSA 10 and TAG 10 and eBay links, plus the week's PSA 10 record prints. A board, not an index.`;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="GSTAR · Gold Star &amp; Grails">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "GSTAR · Gold Star & Grails", description: desc, url: `https://www.shopcardhub.com/${PAGE}`, isPartOf: { "@type": "WebSite", name: "ShopCardHub", url: "https://www.shopcardhub.com/" } })}</script>`);
  h = h.split(`<span class="soon">live</span>`).join(`<span class="soon">board</span>`);
  h = h.replace(/<div class="livebar">[^<]*<\/div>/, `<div class="livebar">Board · ${D.cards.length} grail cards · raw and graded sold marks · read Mon &amp; Thu</div>`);
  if (DRY) { console.log(blk.slice(0, 1200)); return; }
  fs.writeFileSync(pf, h);
  console.log(`grails ${D.day}: ${D.cards.length} cards · wrote data/grails.json + /${PAGE}`);
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
