#!/usr/bin/env node
// build-should-i-grade.mjs — /should-i-grade-my-pokemon-card: the grade-or-sell break-even tool (Goal League S1, Wildcard;
// CoS BET-20261029-3, approved Oct 29 2026). Owner: wildcard. Not a shared generator: it writes only should-i-grade-my-pokemon-card.html.
//
// The tool itself runs in the browser (js/should-i-grade.js) on our own static files. This script bakes the crawlable parts:
// the answer paragraph, the card count, and a worked-examples table for well-known cards, all from data/cards/<tk>.json
// (raw sold mark) and data/cards/g-<tk>.json (PSA 9 / PSA 10 / TAG 10 sold marks). Read-only on those files.
// A card counts only when its raw mark exists and its PSA 9 and PSA 10 marks are medians of >= 3 dated sales (R18).
// Chrome (head CSS, NAV block, footer) is copied from how-prices-work.html, like tools/build-grade-premiums.mjs.
//
// Cost defaults: PSA's tiers as announced Oct 29 2026 (Value reopened at $39.99, declared value <= $500, est. 90-100 business days;
// Standard $59.99, 70-80; Priority $79.99, 50-60 — ICv2 report of PSA's notice, read Nov 3 2026; psacard.com's pricing pages did
// not render for a read that night). All in = fee + $2.76 shipping and supplies over a 20-card batch (the $62.75 Standard figure in
// claude/kb/pokemon/GRADE-DEFAULTS.md minus the $59.99 fee). Default tier per card = Value when its PSA 10 median is under $500,
// else Standard (Value isn't open above the cap) — CoS BET-20261102-1. eBay 13.25% + $0.40 (Seller Center, Feb 14 2025).
// Every input is editable on the page.
//
// Usage: node tools/build-should-i-grade.mjs     (idempotent)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "should-i-grade-my-pokemon-card";
const URL = `https://www.shopcardhub.com/${SLUG}`;
const EPN = "mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001";
const FVF = 0.1325, ORD = 0.40, SHIP = 2.76, VALUE_CAP = 500;
// Max declared (insured) value per card (Wildcard, Nov 5 2026): PSA's Sep 9 2026 notice "PSA Opens New Standard Service Level"
// (psacard.com/articles/articleview/15763, read Nov 5 2026) gives Standard $59.99 up to $1,000, Priority $79.99 up to $1,500,
// Express $199 up to $2,500 (20-30 business days), Premier $599 up to $10,000 (7-10). Value $39.99 up to $500 and the Oct 28
// Standard/Priority turnarounds are from PSA's Oct 28 notice as reported by SI (si.com, Oct 28 2026). PSA lists tiers above $10,000
// whose limits we could not read, so a card over $10,000 as a PSA 10 gets no default tier and no break-even in the baked counts.
const TIERS = { value: { name: "Value", fee: 39.99, cap: 500, tat: "90–100" }, standard: { name: "Standard", fee: 59.99, cap: 1000, tat: "70–80" }, priority: { name: "Priority", fee: 79.99, cap: 1500, tat: "50–60" }, express: { name: "Express", fee: 199, cap: 2500, tat: "20–30" }, premier: { name: "Premier", fee: 599, cap: 10000, tat: "7–10" } };
const ORDER = ["value", "standard", "priority", "express", "premier"];
const TIER_READ = "Nov 5, 2026";
const allIn = (t) => Math.round((TIERS[t].fee + SHIP) * 100) / 100;
const COST = allIn("standard"), VCOST = allIn("value");
const tierFor = (x) => ORDER.find((t) => x.m10.m <= TIERS[t].cap) || null;   // the cheapest tier whose limit covers the PSA 10 median
const usd = (n) => "$" + n.toFixed(2);
const capTxt = (n) => "$" + n.toLocaleString("en-US");
const FEE_READ = "Nov 3, 2026";
const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const long = (s) => { const t = new Date(s + "T12:00:00Z"); return `${MN[t.getUTCMonth()]} ${t.getUTCDate()}, ${t.getUTCFullYear()}`; };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const short = (s) => { const t = new Date(s + "T12:00:00Z"); return `${MN[t.getUTCMonth()].slice(0, 3)} ${t.getUTCDate()}, ${t.getUTCFullYear()}`; };
const money = (n) => "$" + Number(n).toLocaleString("en-US", n >= 100 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// eBay phrase: the same function the index tables and card pages use (js/grade-links.js), run here so baked links match.
const glSrc = fs.readFileSync(path.join(REPO, "js/grade-links.js"), "utf8");
const sandbox = { window: {}, document: { readyState: "complete", querySelectorAll: () => [], addEventListener() {} }, localStorage: { getItem: () => null, setItem() {} } };
vm.runInNewContext(glSrc, sandbox);
const phrase = sandbox.window.SCH_GLK.phrase;
const nkw = (q) => encodeURIComponent(String(q).replace(/\s+/g, " ").trim()).replace(/%20/g, "+").replace(/'/g, "%27").replace(/[!()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const ebay = (d, c, g) => {
  const ed = d.ed === "1st" || d.ed === "shadowless" ? d.ed : !!d.wotc;
  return `https://www.ebay.com/sch/i.html?_nkw=${nkw(phrase(c.q || c.name, g === "tag10" ? "tag" : g, ed, String(d.ticker).toLowerCase()))}&_sacat=183454&LH_BIN=1&${EPN}&customid=${SLUG}-${g}`;
};

// ---- read every Pokémon ticker
const dir = path.join(REPO, "data/cards");
const tks = fs.readdirSync(dir).filter((f) => /^[a-z0-9]+\.json$/.test(f)).map((f) => f.slice(0, -5));
const mark = (x) => (x && x.m && x.n >= 3 ? { m: x.m, n: x.n, days: x.basis === "30d" ? 30 : 90 } : null);
const ok = new Map();
let rawDay = "", gDay = "";
for (const tk of tks) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, tk + ".json"), "utf8"));
  const gp = path.join(dir, "g-" + tk + ".json");
  if (!fs.existsSync(gp)) continue;
  const gd = JSON.parse(fs.readFileSync(gp, "utf8"));
  if (gd.day && gd.day > gDay) gDay = gd.day;
  for (const c of d.cards || []) {
    // raw must be a dated eBay sold median with its own count; chase-set raws come from an outside value, not our sales (R32)
    if (c.raw == null || c.screened || d.kind === "chase" || (c.wn == null && c.n30 == null)) continue;
    const g = gd.cards && gd.cards[c.key || c.num];
    const m9 = mark(g && g.psa9), m10 = mark(g && g.psa10);
    if (!m9 || !m10) continue;
    if (c.rawAsOf && c.rawAsOf > rawDay) rawDay = c.rawAsOf;
    ok.set(c.id, { d, c, m9, m10, mT: mark(g && g.tag10), gAsOf: g.asOf || gd.day });
  }
}
const N = ok.size;
if (N < 100) { console.error(`only ${N} cards qualify — refusing to write`); process.exit(1); }
const net = (p) => p * (1 - FVF) - ORD;
const be = (x, C = tierFor(x) ? allIn(tierFor(x)) : null) => { if (C == null) return null; const Rn = net(x.c.raw), N9 = net(x.m9.m), N10 = net(x.m10.m); return N10 > N9 ? (Rn + C - N9) / (N10 - N9) : null; };
const beTxt = (p) => (p == null ? "no break-even" : p > 1 ? "a 10 doesn’t cover it" : p <= 0 ? "pays even on a 9" : (p < 0.01 ? "under 1%" : Math.round(p * 100) + "%"));

// worked examples: the cards collectors ask about by name (Grok SEO/AEO ideas #13, #14, #17, #19), when they qualify today
const WANT = ["bs99-4", "bssl-4", "evs21-215", "pris25-161", "sv151-199", "ah26-276", "hf19-sv49", "ng00-9", "ng1e-9", "tu19-165", "fo1e-5", "bs99-58", "evs21-218", "cz23-gg10", "ssp24-238", "cel21-4", "sv151-173", "bs99-2", "bs99-15", "ju1e-60"];
const ex = WANT.filter((id) => ok.has(id)).slice(0, 16).map((id) => ok.get(id));
const AS_OF = gDay > rawDay ? gDay : rawDay;
const DATE = long(AS_OF);
const counts = { pays9: 0, mid: 0, never: 0 };
for (const x of ok.values()) { const p = be(x); if (p == null) continue; if (p <= 0) counts.pays9++; else if (p > 1) counts.never++; else counts.mid++; }
// What reopening Value changes (BET-20261102-1): same cards, Standard vs Value cost, only where Value is allowed (PSA 10 median < $500)
const med = (a) => { a = [...a].sort((p, q) => p - q); const n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : null; };
const elig = [...ok.values()].filter((x) => x.m10.m <= VALUE_CAP);   // same set as the Value row of the tier table
const vLower = elig.filter((x) => be(x, COST) > 0).length;
const vMid = elig.filter((x) => { const p = be(x, COST); return p > 0 && p <= 1; });
const vMedS = med(vMid.map((x) => be(x, COST))), vMedV = med(vMid.map((x) => be(x, VCOST)));
const vFlip = elig.filter((x) => be(x, COST) > 1 && be(x, VCOST) <= 1).length;
const pct = (p) => Math.round(p * 100) + "%";
const fmt = (n) => n.toLocaleString("en-US");
const VALUE_LINE = `PSA Value is open again: $39.99 a card for cards declared at $500 or less (PSA’s change of Oct 29, 2026; fees read ${FEE_READ}). Of the ${fmt(N)} cards we can run, ${fmt(elig.length)} have a median of $500 or less as a PSA 10. At Value instead of Standard, ${fmt(vLower)} of them break even at a lower PSA 10 rate, and for the ${fmt(vMid.length)} that needed between 1% and 100% at Standard, the median break-even falls from ${pct(vMedS)} to ${pct(vMedV)}. Another ${fmt(vFlip)} that didn’t pay even on a 10 at Standard now break even below 100%.`;
// one export for build-grade-premiums.mjs so the two pages print the same line from the same math
fs.writeFileSync(path.join(REPO, "data/grade-value-tier.json"), JSON.stringify({ _comment: "Written by tools/build-should-i-grade.mjs (Wildcard, BET-20261102-1). Standard vs Value break-even on the tool's cards; read by tools/build-grade-premiums.mjs.", asOf: AS_OF, feeRead: "2026-11-03", cards: N, eligible: elig.length, lower: vLower, mid: vMid.length, medianStandard: Math.round(vMedS * 1000) / 1000, medianValue: Math.round(vMedV * 1000) / 1000, flipped: vFlip, line: VALUE_LINE }, null, 1) + "\n");

// Which tier each card needs: PSA 10 median bands against the tier limits (the declared value is the graded worth)
const over = [...ok.values()].filter((x) => !tierFor(x)).length;
const band = Object.fromEntries(ORDER.map((t) => [t, [...ok.values()].filter((x) => tierFor(x) === t).length]));
const TIER_ANSWER = `PSA prices grading by declared value, which is what the card is worth once graded. Read ${TIER_READ}: ${ORDER.map((t) => `${TIERS[t].name} ${usd(TIERS[t].fee).replace(".00", "")} up to ${capTxt(TIERS[t].cap)}`).join(", ")}. In sales read ${DATE}, of the ${fmt(N)} Pokémon cards we can run, ${ORDER.map((t, i) => `${fmt(band[t])} sell for ${i ? "over " + capTxt(TIERS[ORDER[i - 1]].cap) + " and up to " : ""}${capTxt(TIERS[t].cap)}${i ? "" : " or less"} (${TIERS[t].name})`).join(", ")}${over ? `, and ${fmt(over)} for more than $10,000` : ""}, going by each card’s median as a PSA 10.`;
const TIER_ROWS = ORDER.map((t, i) => `<tr><th scope="row">${TIERS[t].name}</th><td>${usd(TIERS[t].fee).replace(".00", "")}<span class="sg-sub">${usd(allIn(t))} all in</span></td><td>${capTxt(TIERS[t].cap)}</td><td>${TIERS[t].tat} business days</td><td>${fmt(band[t])}<span class="sg-sub">cards with a median ${i ? "over " + capTxt(TIERS[ORDER[i - 1]].cap) + ", up to " : "up to "}${capTxt(TIERS[t].cap)}</span></td></tr>`).join("\n");
const TIER_SECTION = `  <section id="psa-tiers">
    <div class="section-eyebrow">PSA tiers</div>
    <h2>Which PSA Tier Does My Card Need?</h2>
    <p class="section-intro">${TIER_ANSWER.replace(/&/g, "&amp;")}</p>
    <div class="sg-wrap"><table class="sg-tbl"><thead><tr><th scope="col">Tier</th><th scope="col">Per card</th><th scope="col">Declared value up to</th><th scope="col">Turnaround</th><th scope="col">Our cards that fit</th></tr></thead>
<tbody>
${TIER_ROWS}
</tbody></table></div>
    <p class="sg-fine">Fees and limits from PSA&rsquo;s Sep 9, 2026 and Oct 28, 2026 service notices, read ${TIER_READ}. The counts go by each card&rsquo;s own graded median and sale count as a PSA 10, shown in the tool above.</p>
  </section>`;

const TITLE = "Should I Grade My Pokémon Card? Break-Even Calculator With Each Card’s Own Sold Prices";
const DESC = `Pick your Pokémon card and see how often it has to come back a PSA 10 for grading to beat selling it raw, from its own dated eBay sold prices. ${N.toLocaleString("en-US")} cards, read ${DATE}.`;
const ANSWER = `Grading pays when your odds of a PSA 10 beat the card’s break-even rate. Pick your card below: we show its raw, PSA 9, PSA 10 and TAG 10 sold prices, each with its sale count and date, and work out how often it has to come back a 10 at your cost. ${N.toLocaleString("en-US")} cards have enough sales to run, read ${DATE}.`;

const exRows = ex.map((x) => {
  const { d, c, m9, m10 } = x, set = String(d.set).replace(/^Pokémon TCG /, ""), p = be(x);
  const oc = (g) => ` onclick="if(typeof gtag==='function')gtag('event','grade_click',{grade:'${g}',mode:'bin',item:'${SLUG}-${g}:${c.id}',page:location.pathname})"`;
  return `<tr><th scope="row"><a href="#${esc(c.id)}" data-sg-pick="${esc(c.id)}">${esc(c.name)} #${esc(c.num)}</a><span class="sg-sub">${esc(set)}</span></th>` +
    `<td>${money(c.raw)}<span class="sg-sub">${c.wn != null ? c.wn : c.n30} sales to ${short(c.rawAsOf)}</span></td><td>${money(m9.m)}<span class="sg-sub">PSA 9 median, ${m9.n} sales, ${m9.days} d to ${short(x.gAsOf)}</span></td><td>${money(m10.m)}<span class="sg-sub">PSA 10 median, ${m10.n} sales, ${m10.days} d to ${short(x.gAsOf)}</span></td>` +
    `<td class="sg-be">${tierFor(x) ? `${beTxt(p)}<span class="sg-sub">at PSA ${TIERS[tierFor(x)].name}, ${usd(allIn(tierFor(x)))} all in</span>` : `type your PSA cost<span class="sg-sub">over $10,000 as a PSA 10, above the tiers we list</span>`}</td>` +
    `<td class="sg-x"><a class="sg-mini" href="${esc(ebay(d, c, "raw"))}" target="_blank" rel="sponsored nofollow noopener"${oc("raw")}>Raw on eBay</a><a class="sg-mini" href="${esc(ebay(d, c, "psa10"))}" target="_blank" rel="sponsored nofollow noopener"${oc("psa10")}>PSA 10 on eBay</a></td></tr>`;
}).join("\n");

const body = `
<section class="hero" style="border-top:none; padding-bottom:0;">
  <div class="container">
    <div class="hero-eyebrow">Grading &middot; Calculator &middot; ${DATE}</div>
    <h1>Should I Grade My<br><em>Pok&eacute;mon Card?</em></h1>
    <p class="hero-sub sg-answer" id="answer">${ANSWER}</p>
    <p class="sg-value" id="psa-value">${VALUE_LINE}</p>
  </div>
</section>
<div class="container">
  <section style="border-top:none; padding-top:0;" id="sg-tool">
    <div class="sg-box">
      <label class="sg-lbl" for="sg-q">Find your card</label>
      <div class="sg-search"><input id="sg-q" type="search" placeholder="Charizard 4 base set, Moonbreon, Umbreon ex 161…" autocomplete="off" role="combobox" aria-controls="sg-list" aria-expanded="false" aria-autocomplete="list"><ul id="sg-list" role="listbox" hidden></ul></div>
      <div id="sg-out"><p class="sg-wait">Type a Pok&eacute;mon name and number, or tap a card in the table below.</p></div>
      <details class="sg-costs"><summary>Your costs (change these to yours)</summary>
        <div class="sg-grid">
          <label>PSA tier<select id="sg-tier"><option value="auto">Auto: the cheapest tier that takes the card</option>${ORDER.map((t) => `<option value="${t}">${TIERS[t].name} · ${usd(TIERS[t].fee).replace(".00", "")} · up to ${capTxt(TIERS[t].cap)} · ${TIERS[t].tat} business days</option>`).join("")}<option value="custom">My own cost (TAG, another grader, a special)</option></select></label>
          <label>Grading, per card, all in ($)<input id="sg-cost" inputmode="decimal" value="${COST.toFixed(2)}"></label>
          <label>eBay selling fee (%)<input id="sg-fvf" inputmode="decimal" value="13.25"></label>
          <label>Per-order fee ($)<input id="sg-ord" inputmode="decimal" value="0.40"></label>
          <label>Your copy, raw ($, optional)<input id="sg-raw" inputmode="decimal" placeholder="uses the raw median"></label>
          <label>A miss sells for ($, optional)<input id="sg-miss" inputmode="decimal" placeholder="uses the PSA 9 median"></label>
        </div>
        <p class="sg-note">PSA&rsquo;s per-card fees and limits, read ${TIER_READ}: ${ORDER.map((t) => `${TIERS[t].name} ${usd(TIERS[t].fee).replace(".00", "")} for cards declared at up to ${capTxt(TIERS[t].cap)} (about ${TIERS[t].tat} business days)`).join("; ")}. Value reopened on Oct 29, 2026. We add $2.76 a card for shipping and supplies spread over a 20-card batch. The declared value is what the card is worth once graded, so &ldquo;Auto&rdquo; uses the cheapest tier whose limit is at or above the card&rsquo;s graded median. PSA has tiers above $10,000 whose limits we couldn&rsquo;t read; for those cards, type your own cost. eBay fees are 13.25% plus $0.40 an order (eBay Seller Center). If you send to TAG, pick &ldquo;My own cost&rdquo; and type TAG&rsquo;s price.</p>
      </details>
    </div>
  </section>
  <section>
    <div class="section-eyebrow green">Worked examples</div>
    <h2>Break-Even PSA 10 Rate for Cards People Ask About</h2>
    <p class="section-intro">At each card&rsquo;s default PSA tier, the cheapest one whose limit covers its graded median: the share of copies that would have to come back PSA 10 for grading to beat selling raw. &ldquo;Pays even on a 9&rdquo; means the PSA 9 median, after fees and grading, is already above the raw median. Tap a card to run it with your own numbers.</p>
    <div class="sg-wrap"><table class="sg-tbl"><thead><tr><th scope="col">Card</th><th scope="col">Raw</th><th scope="col">PSA 9</th><th scope="col">PSA 10</th><th scope="col">Pays if 10s are over</th><th scope="col">eBay</th></tr></thead>
<tbody>
${exRows}
</tbody></table></div>
    <p class="section-intro">Across all ${N.toLocaleString("en-US")} cards at those tiers: ${counts.pays9.toLocaleString("en-US")} clear the bar even on a PSA 9, ${counts.mid.toLocaleString("en-US")} need some share of 10s, and ${counts.never.toLocaleString("en-US")} don&rsquo;t pay even on a 10. ${over ? `${over} more sell for over $10,000 as a PSA 10 and are left out, since their PSA tier is above the ones we list.` : ""} Most of the &ldquo;pays on a 9&rdquo; cards are vintage, where the raw median is pulled down by played copies. If your copy is clean, its raw value is higher than the median, so enter it.</p>
  </section>
${TIER_SECTION}
  <section>
    <div class="section-eyebrow">The math</div>
    <h2>How the Break-Even Works</h2>
    <p class="section-intro">Selling raw gets you the raw price minus eBay fees. Grading gets you the PSA 10 price on the copies that hit and the miss price on the rest, minus fees and the grading cost. The break-even is the PSA 10 rate where those two are equal. If you think your copy has better odds than that rate, grading has paid on these sales; if not, it hasn&rsquo;t. Turnaround time and the money tied up while you wait aren&rsquo;t in the number.</p>
    <p class="section-intro">How big the gap between grades runs, by era: <a href="/pokemon-grading-premiums">PSA 10 vs every other grade</a>. TAG beside PSA: <a href="/tag-grading-guide">how TAG grading works</a>. PSA&rsquo;s tiers and process: <a href="/psa-grading-guide">PSA grading guide</a>.</p>
  </section>
  <section>
    <div class="section-eyebrow">Method</div>
    <h2>Where the Numbers Come From</h2>
    <p class="section-intro">Dated eBay sold prices. Raw is the median of clean ungraded sales over 30 days (90 on 1st Edition and Shadowless cards). PSA 9, PSA 10 and TAG 10 are medians of at least 3 sales whose own titles name the grade, over 30 days when there are enough and 90 when there aren&rsquo;t; each card shows its count. A card with fewer sales shows its one dated sale and no break-even. Lots, proxies and reprints are dropped. Read ${DATE}. These are past sales, not advice.</p>
  </section>
</div>
<script src="/js/grade-links.js?v=2" defer></script>
<script src="/js/should-i-grade.js?v=3" defer></script>
`;

const css = `<style id="sg-css">.sg-answer{max-width:70ch}.sg-value{max-width:70ch;font-size:14px;line-height:1.55;color:var(--text-dim);margin:10px 0 0}
.sg-box{border:1px solid var(--border2);border-radius:4px;padding:18px;background:var(--surface,transparent)}
.sg-lbl{display:block;font-family:var(--fd);font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px}
.sg-search{position:relative}.sg-search input{width:100%;box-sizing:border-box;font-size:16px;padding:12px 14px;border:1px solid var(--border2);border-radius:3px;background:var(--bg,#fff);color:var(--text-head)}
#sg-list{position:absolute;left:0;right:0;top:100%;z-index:20;margin:2px 0 0;padding:0;list-style:none;background:var(--bg,#fff);border:1px solid var(--border2);border-radius:3px;max-height:320px;overflow-y:auto;box-shadow:0 10px 24px -12px rgba(0,0,0,.35)}
#sg-list li{padding:10px 14px;cursor:pointer;border-top:1px solid var(--border)}#sg-list li:first-child{border-top:none}#sg-list li.on,#sg-list li[data-id]:hover{background:var(--border)}
#sg-list li b{display:block;color:var(--text-head);font-weight:600}#sg-list li span{font-size:12px;color:var(--text-dim)}#sg-list .sg-none{cursor:default;color:var(--text-dim);font-size:13px}
.sg-wait{color:var(--text-dim);margin:14px 0 0}
.sg-card{margin-top:16px}.sg-top h3{margin:0;font-size:20px}.sg-top h3 a{color:var(--text-head)}.sg-set{font-size:12px;color:var(--text-dim)}
.sg-lad{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}
.sg-c{border:1px solid var(--border);border-radius:3px;padding:10px;min-width:0}.sg-c .k{display:block;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim)}
.sg-c b{display:block;font-family:var(--fm);font-size:19px;color:var(--text-head);margin:2px 0}.sg-c .s{display:block;font-size:11px;color:var(--text-dim);line-height:1.35}.sg-c.dim b{color:var(--text-dim)}
.sg-hl{font-size:17px;color:var(--text-head);margin:6px 0 8px;line-height:1.45}.sg-hl b{font-size:22px}
.sg-meter{height:8px;border-radius:4px;background:var(--border);overflow:hidden;margin:0 0 10px}.sg-meter i{display:block;height:100%;background:var(--green,#22c55e)}
.sg-rows{margin:0 0 12px;padding-left:18px;font-size:14px;line-height:1.6}.sg-rows .up{color:var(--green,#16a34a)}.sg-rows .dn{color:var(--red,#dc2626)}.sg-rows .s{font-size:12px;color:var(--text-dim)}
.sg-btns{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}.sg-eb{display:inline-block;padding:10px 14px;border:1px solid var(--border2);border-radius:3px;font-weight:600;font-size:14px;text-decoration:none;color:var(--text-head)}
.sg-eb.pri{background:var(--accent,#00ccf5);border-color:var(--accent,#00ccf5);color:#04121a}
.sg-fine,.sg-note{font-size:12px;color:var(--text-dim);line-height:1.5;margin:8px 0 0}
.sg-costs{margin-top:16px;border-top:1px solid var(--border);padding-top:10px}.sg-costs summary{cursor:pointer;font-weight:600;color:var(--text-head);font-size:14px}
.sg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:10px}.sg-grid label{font-size:12px;color:var(--text-dim);display:flex;flex-direction:column;gap:4px}
.sg-grid select{font-size:14px;padding:8px 10px;border:1px solid var(--border2);border-radius:3px;background:var(--bg,#fff);color:var(--text-head);width:100%;box-sizing:border-box}
.sg-grid input{font-size:16px;padding:8px 10px;border:1px solid var(--border2);border-radius:3px;background:var(--bg,#fff);color:var(--text-head);width:100%;box-sizing:border-box}
.sg-wrap{overflow-x:auto;margin-top:16px;border:1px solid var(--border2);border-radius:3px}
.sg-tbl{width:100%;border-collapse:collapse;font-size:13px;min-width:640px}.sg-tbl th,.sg-tbl td{padding:10px 12px;border-top:1px solid var(--border);text-align:left;vertical-align:top}
.sg-tbl thead th{color:var(--text-dim);font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600;border-top:none}.sg-tbl tbody th a{color:var(--text-head);font-weight:600}
.sg-sub{display:block;font-size:11px;color:var(--text-dim);font-weight:400}.sg-tbl td{font-family:var(--fm)}.sg-be{font-weight:700;color:var(--text-head)}
.sg-x{white-space:nowrap}.sg-mini{display:block;font-family:var(--fb);font-size:12px;margin-bottom:4px}
@media (max-width:600px){.sg-lad{grid-template-columns:repeat(2,minmax(0,1fr))}.sg-box{padding:14px}}</style>`;

const ld = [
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Should I grade my Pokémon card? Break-even calculator", url: URL, applicationCategory: "FinanceApplication", operatingSystem: "Any", isAccessibleForFree: true, description: DESC, dateModified: AS_OF, creator: { "@type": "Organization", name: "ShopCardHub", url: "https://www.shopcardhub.com" } },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Should I grade my Pokémon card?", acceptedAnswer: { "@type": "Answer", text: ANSWER.replace(/<[^>]+>/g, "") } }, { "@type": "Question", name: "Is PSA Value worth it for my Pokémon card?", acceptedAnswer: { "@type": "Answer", text: VALUE_LINE } }, { "@type": "Question", name: "Which PSA tier does my Pokémon card need?", acceptedAnswer: { "@type": "Answer", text: TIER_ANSWER } }] },
];

const tpl = fs.readFileSync(path.join(REPO, "how-prices-work.html"), "utf8");
let head = tpl.slice(0, tpl.indexOf("<!-- NAV:END -->") + "<!-- NAV:END -->".length);
head = head.replace(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)} | ShopCardHub</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(DESC)}">`)
  .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${URL}">`)
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(TITLE)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(DESC)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${URL}">`)
  .replace(/(og|twitter):image" content="[^"]*"/g, (m, p) => `${p}:image" content="https://www.shopcardhub.com/og/grade-premiums.png?v=${AS_OF.replace(/-/g, "")}"`)
  .replace(/<meta property="og:image:height" content="\d+">/, '<meta property="og:image:height" content="675">')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n  ${JSON.stringify(ld)}\n  </script>`)
  .replace("</head>", `${css}\n</head>`);
const foot = tpl.slice(tpl.lastIndexOf("<footer>"));
const outHtml = head + "\n" + body + "\n" + foot;
fs.writeFileSync(path.join(REPO, SLUG + ".html"), outHtml);
// above-the-fold eBay strip: build-buy-strip.mjs owns the BUYSTRIP block (data/buy-strip.json entry for this slug); re-apply after every rewrite
execFileSync(process.execPath, [path.join(REPO, "tools/build-buy-strip.mjs"), "--only", SLUG], { stdio: "ignore" });
execFileSync(process.execPath, [path.join(REPO, "tools/build-signup.mjs")], { stdio: "ignore" });   // R26 capture under the strip
console.log(`wrote ${SLUG}.html (${outHtml.length} bytes) · ${N} cards · ${ex.length} examples · as of ${AS_OF} · pays9 ${counts.pays9} / mid ${counts.mid} / never ${counts.never}`);
