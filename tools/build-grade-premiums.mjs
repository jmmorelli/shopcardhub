#!/usr/bin/env node
// build-grade-premiums.mjs — /pokemon-grading-premiums: what a PSA 10 sells for against every other grade, vintage vs modern.
// CoS, Oct 27 2026 (Mo: "we should have this type of data … we should be pumping this type of stuff out too — but better").
// Also answers the AEO gap the SEO & AEO Desk found: "is my Pokémon card worth grading" gets no dated grade-premium table anywhere.
//
// Data: data/grade-premiums.json (written from tools/grade-premiums/pull.py; aggregates only, no titles). Every figure on the page
// comes from that file; nothing is computed here except formatting. Chrome (head CSS, NAV block, footer + scripts) is copied
// from how-prices-work.html so nav changes made by tools/build-nav.js keep flowing (the NAV block is regenerated in place).
//
// Usage: node tools/build-grade-premiums.mjs        (idempotent; rewrites pokemon-grading-premiums.html)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "pokemon-grading-premiums";
const URL = `https://www.shopcardhub.com/${SLUG}`;
const d = JSON.parse(fs.readFileSync(path.join(REPO, "data/grade-premiums.json"), "utf8"));
const tpl = fs.readFileSync(path.join(REPO, "how-prices-work.html"), "utf8");
const V = d.eras.vintage, M = d.eras.modern;
const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dt = new Date(d.asOf + "T12:00:00Z"), DATE = `${MN[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const x = (v) => (v == null ? "" : Number(v).toFixed(1) + "×");

const TITLE = "Is Your Pokémon Card Worth Grading? PSA 10 vs PSA 9, 8, 7, Raw and TAG 10 — Dated Sold Data";
const DESC = `What a PSA 10 sells for against every other grade, from eBay sales as of ${DATE}: vintage PSA 10s ran ${x(V.raw.med)} raw and ${x(V.psa9.med)} a PSA 9; modern ${x(M.raw.med)} raw and ${x(M.psa9.med)} a PSA 9.`;
const ANSWER = `As of ${DATE}, a PSA 10 vintage Pokémon card (WOTC, 1999–2003) sold for a median <b>${x(V.raw.med)} its raw price</b> and <b>${x(V.psa9.med)} a PSA 9</b>; a modern card's PSA 10 sold for <b>${x(M.raw.med)} raw</b> and <b>${x(M.psa9.med)} a PSA 9</b>. TAG 10s on modern cards sold for about the same as PSA 10s (median ${x(M.tag10_vs_psa10.med)}). Based on 90 days of eBay sales of ${V.cards + M.cards} cards.`;

function cell(g) {
  if (!g || !g.med) return `<td class="gp-na">too few sales${g && g.n ? ` (${g.n})` : ""}</td>`;
  return `<td><b>${x(g.med)}</b><span class="gp-rng">middle half ${x(g.p25)}–${x(g.p75)}</span><span class="gp-n">${g.n} cards</span></td>`;
}
const ROWS = [["PSA 9", "psa9"], ["PSA 8", "psa8"], ["PSA 7", "psa7"], ["PSA 5", "psa5"], ["Raw (ungraded)", "raw"]];
const table = `<div class="gp-wrap"><table class="gp-tbl"><caption>A PSA 10 sells for this many times…</caption>
<thead><tr><th scope="col">…a copy in</th><th scope="col">${esc(V.label)}</th><th scope="col">${esc(M.label)}</th></tr></thead>
<tbody>${ROWS.map(([lbl, k]) => `<tr><th scope="row">${lbl}</th>${cell(V[k])}${cell(M[k])}</tr>`).join("")}</tbody></table></div>`;

const body = `
<section class="hero" style="border-top:none; padding-bottom:0;">
  <div class="container">
    <div class="hero-eyebrow">Grading &middot; Sold Data &middot; ${DATE}</div>
    <h1>Is Your Pok&eacute;mon Card<br><em>Worth Grading?</em></h1>
    <p class="hero-sub gp-answer" id="answer">${ANSWER}</p>
  </div>
</section>
<div class="container">
  <section style="border-top:none; padding-top:0;">
    <div class="section-eyebrow green">The table</div>
    <h2>What a PSA 10 Is Worth Against Every Other Grade</h2>
    <p class="section-intro">Read across: on a typical vintage card, a PSA 10 sold for ${x(V.psa8.med)} what the same card sold for in a PSA 8. Each multiple is worked out card by card, then we show the middle card and the middle half of the range, because a few huge cards would wreck an average.</p>
    ${table}
  </section>
  <section>
    <div class="section-eyebrow">What it says</div>
    <h2>Old Cards: the Grade Is the Price. New Cards: You're Paying for the Card.</h2>
    <p class="section-intro">On vintage cards the gap between grades is steep: a PSA 9 is a fraction of a 10 and a raw copy is a small fraction. On modern cards the whole ladder is flatter, so a lower grade gives up much less. The spread is lopsided in both eras: on vintage, the average PSA 10 multiple over raw is ${x(V.raw_mean)} against a middle card of ${x(V.raw.med)} (skew ${V.raw_skew}), so a handful of cards with huge premiums pull the average up. Look at the median, not the mean.</p>
    <p class="section-intro"><b>TAG 10 vs PSA 10 (modern):</b> on the ${M.tag10_vs_psa10.n} modern cards with TAG 10 and PSA 10 sales in the window, the TAG 10 sold for a median ${x(M.tag10_vs_psa10.med)} the PSA 10 (middle half ${x(M.tag10_vs_psa10.p25)}–${x(M.tag10_vs_psa10.p75)}); ${M.tag10_at_or_above_psa10} of ${M.tag10_vs_psa10.n} sold at or above it. Vintage TAG 10 sales are still too few to compare.</p>
    <p class="section-intro">This is what slabs sold for, not advice. Grading fees, shipping, time and the odds of getting a 10 are not in these numbers. To check one card, find it in <a href="/indices">our set indices</a>: every card page shows its own Raw, PSA 9, PSA 10 and TAG 10 sales.</p>
  </section>
  <section>
    <div class="section-eyebrow">Method</div>
    <h2>How We Counted</h2>
    <p class="section-intro">${esc(d.method)} Source: ${esc(d.source)}. Read ${DATE}.</p>
  </section>
</div>
`;

const css = `<style id="gp-css">.gp-answer{max-width:70ch}.gp-answer b{color:var(--text-head)}.gp-wrap{overflow-x:auto;margin-top:18px;border:1px solid var(--border2);border-radius:3px}
.gp-tbl{width:100%;border-collapse:collapse;font-family:var(--fm);font-size:13px;min-width:520px}.gp-tbl caption{text-align:left;padding:10px 14px;font-family:var(--fd);font-size:14px;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-dim)}
.gp-tbl th,.gp-tbl td{padding:12px 14px;border-top:1px solid var(--border);text-align:left;vertical-align:top}.gp-tbl thead th{color:var(--text-dim);font-weight:600;font-size:11px;letter-spacing:1px;text-transform:uppercase}
.gp-tbl tbody th{color:var(--text-head);font-family:var(--fb);font-weight:600}.gp-tbl td b{display:block;font-size:20px;color:var(--text-head)}.gp-rng,.gp-n{display:block;font-size:11px;color:var(--text-dim);margin-top:2px}.gp-na{color:var(--text-dim)}</style>`;

const ld = { "@context": "https://schema.org", "@type": "Dataset", name: "Pokémon card grade premiums: PSA 10 vs PSA 9, 8, 7, 5, raw and TAG 10", description: DESC, url: URL, dateModified: d.asOf, creator: { "@type": "Organization", name: "ShopCardHub", url: "https://www.shopcardhub.com" }, variableMeasured: ["PSA 10 to PSA 9 price multiple", "PSA 10 to raw price multiple", "TAG 10 to PSA 10 price multiple"], measurementTechnique: d.method, isAccessibleForFree: true };

let head = tpl.slice(0, tpl.indexOf("<!-- NAV:END -->") + "<!-- NAV:END -->".length);
head = head.replace(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)} | ShopCardHub</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(DESC.replace(/<[^>]+>/g, ""))}">`)
  .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${URL}">`)
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(TITLE)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(DESC)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${URL}">`)
  .replace(/(og|twitter):image" content="[^"]*"/g, (m, p) => `${p}:image" content="https://www.shopcardhub.com/og/grade-premiums.png?v=${d.asOf.replace(/-/g, "")}"`)
  .replace(/<meta property="og:image:height" content="\d+">/, '<meta property="og:image:height" content="675">')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n  ${JSON.stringify(ld)}\n  </script>`)
  .replace("</head>", `${css}\n</head>`);
const foot = tpl.slice(tpl.lastIndexOf("<footer>"));
const out = head + "\n" + body + "\n" + foot;
fs.writeFileSync(path.join(REPO, SLUG + ".html"), out);
// the above-the-fold eBay strip is build-buy-strip.mjs's (data/buy-strip.json entry); re-apply it after every rewrite
execFileSync(process.execPath, [path.join(REPO, "tools/build-buy-strip.mjs"), "--only", SLUG], { stdio: "ignore" });
execFileSync(process.execPath, [path.join(REPO, "tools/build-signup.mjs")], { stdio: "ignore" });   // R26 capture under the strip
console.log(`wrote ${SLUG}.html (${out.length} bytes) · as of ${d.asOf}`);
