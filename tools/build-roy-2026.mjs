#!/usr/bin/env node
// build-roy-2026.mjs — /mlb-rookie-of-the-year-2026-cards: the six 2026 BBWAA Rookie of the Year finalists and the dated sold
// price of each one's key card (Goal League S1, Wildcard; CoS BET-20261101-1). Owner: wildcard. Not a shared generator: it writes
// only mlb-rookie-of-the-year-2026-cards.html (then re-applies its BUYSTRIP and SIGNUP blocks with their own tools).
//
// Finalists: mlb.com, "2026 BBWAA Awards finalists" (announced Mon Nov 2 2026, read Nov 3 2026):
//   AL Kevin McGonigle (Tigers), Parker Messick (Guardians), Payton Tolle (Red Sox)
//   NL Carson Benge (Mets), Sal Stewart (Reds), JJ Wetherholt (Cardinals). Both awards announced Nov 9.
// Key card: the 1st Bowman Chrome auto when the Bowman KB's class universe holds one (data/classes/BOW24|BOW25-universe.json,
// firstAuto:true), priced from that class basket in data/indices.json (90-day median of n clean eBay sales, its asOf date).
// Otherwise the 2026 Topps Chrome rookie card from data/sets/topps-chrome-baseball-2026.json, which carries no sold price in the
// repo, so it prints "not enough dated sales". No PSA 10 figure exists in the repo for any of the six cards: none is printed (R18).
// No price is fetched here and nothing is estimated. Math only; no buy/sell call.
//
// Usage: node tools/build-roy-2026.mjs     (idempotent)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "mlb-rookie-of-the-year-2026-cards";
const URL = `https://www.shopcardhub.com/${SLUG}`;
const EPN = "mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001";
const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const long = (s) => { const t = new Date(s + "T12:00:00Z"); return `${MN[t.getUTCMonth()]} ${t.getUTCDate()}, ${t.getUTCFullYear()}`; };
const short = (s) => { const t = new Date(s + "T12:00:00Z"); return `${MN[t.getUTCMonth()].slice(0, 3)} ${t.getUTCDate()}, ${t.getUTCFullYear()}`; };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ebay = (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q).replace(/%20/g, "+")}&${EPN}&customid=${SLUG}`;

const FINALISTS = [
  { lg: "AL", name: "Kevin McGonigle", team: "Detroit Tigers", cls: "BOW25", code: "CPA-KM" },
  { lg: "AL", name: "Parker Messick", team: "Cleveland Guardians", tc: true },
  { lg: "AL", name: "Payton Tolle", team: "Boston Red Sox", cls: "BOW24", code: "CPA-PT" },
  { lg: "NL", name: "Carson Benge", team: "New York Mets", cls: "BOW24", code: "CPA-CBG" },
  { lg: "NL", name: "Sal Stewart", team: "Cincinnati Reds", tc: true },
  { lg: "NL", name: "JJ Wetherholt", team: "St. Louis Cardinals", cls: "BOW25", code: "CPA-JW" },
];

const idx = JSON.parse(fs.readFileSync(path.join(REPO, "data/indices.json"), "utf8"));
const tc = JSON.parse(fs.readFileSync(path.join(REPO, "data/sets/topps-chrome-baseball-2026.json"), "utf8"));
const uni = {};
for (const t of ["BOW24", "BOW25"]) uni[t] = JSON.parse(fs.readFileSync(path.join(REPO, `data/classes/${t}-universe.json`), "utf8"));

let asOf = "";
const rows = FINALISTS.map((f) => {
  if (f.cls) {
    const u = (uni[f.cls].rows || []).find((r) => r.player === f.name && r.code === f.code);
    const b = (idx[f.cls].basket || []).find((r) => r.name === f.name && r.num === f.code);
    if (!u || !u.firstAuto || !b) throw new Error(`${f.name}: ${f.cls} ${f.code} not a 1st auto in the KB universe or not in the basket`);
    const priced = b.price != null && b.n30 >= 3 && !b.carried && !b.heldMove;
    if (priced && b.asOf > asOf) asOf = b.asOf;
    return { ...f, card: `Chrome Prospect Auto #${f.code}, ${b.product}`, tag: "1st Bowman Chrome Auto", raw: priced ? { m: b.price, n: b.n30, asOf: b.asOf } : null,
      q: `${f.name} ${b.product} Chrome ${f.code} auto` };
  }
  const base = (tc.groups[0].cards || []).find((c) => c.player === f.name && c.rc);
  if (!base) throw new Error(`${f.name}: no 2026 Topps Chrome RC in data/sets/topps-chrome-baseball-2026.json`);
  return { ...f, card: `2026 Topps Chrome #${base.n}`, tag: "Rookie card (RC)", raw: null, q: `${f.name} 2026 Topps Chrome ${base.n} rookie` };
});
if (!asOf) throw new Error("no priced row — refusing to write");
const DATE = long(asOf);
const priced = rows.filter((r) => r.raw);
const lo = Math.min(...priced.map((r) => r.raw.m)), hi = Math.max(...priced.map((r) => r.raw.m));
const top = priced.find((r) => r.raw.m === hi);

const TITLE = "2026 MLB Rookie of the Year Finalists: Their Cards and Sold Prices";
const DESC = `The six 2026 Rookie of the Year finalists and what each one's key card has sold for on eBay: 1st Bowman Chrome autos for McGonigle, Tolle, Benge and Wetherholt, with sale counts. Read ${DATE}.`;
const ANSWER = `The BBWAA named the 2026 Rookie of the Year finalists on Nov. 2: Kevin McGonigle, Parker Messick and Payton Tolle in the American League, and Carson Benge, Sal Stewart and JJ Wetherholt in the National League. Both winners are announced Nov. 9. Four of the six have a 1st Bowman Chrome Auto in our class baskets. Their raw copies sold for a median of ${money(lo)} to ${money(hi)} over the last 90 days (${top.name}'s is the highest), read ${DATE}.`;

const tr = rows.map((r) => {
  const rawCell = r.raw ? `${money(r.raw.m)}<span class="ry-sub">median of ${r.raw.n} sales, 90 days to ${short(r.raw.asOf)}</span>` : `<span class="ry-none">Not enough dated sales</span><span class="ry-sub">no sold median on file for this card</span>`;
  const oc = ` onclick="if(typeof gtag==='function')gtag('event','roy_click',{item:'${SLUG}:${esc(r.name)}',page:location.pathname})"`;
  return `<tr><td class="ry-lg">${r.lg}</td><th scope="row">${esc(r.name)}<span class="ry-sub">${esc(r.team)}</span></th><td>${esc(r.card)}<span class="ry-sub">${esc(r.tag)}</span></td><td class="ry-n">${rawCell}</td><td class="ry-n"><span class="ry-none">Not enough dated sales</span></td><td class="ry-x"><a class="ry-eb" href="${esc(ebay(r.q))}" target="_blank" rel="sponsored nofollow noopener"${oc}>Find it on eBay</a></td></tr>`;
}).join("\n");

const body = `
<section class="hero" style="border-top:none; padding-bottom:0;">
  <div class="container">
    <div class="hero-eyebrow">MLB &middot; Awards &middot; ${DATE}</div>
    <h1>2026 Rookie of the Year<br><em>Finalists&rsquo; Cards</em></h1>
    <p class="hero-sub ry-answer" id="answer">${ANSWER}</p>
  </div>
</section>
<div class="container">
  <section style="border-top:none; padding-top:0;">
    <div class="section-eyebrow green">The six finalists</div>
    <h2>Each Finalist&rsquo;s Key Card and What It Sold For</h2>
    <p class="section-intro">The card is the player&rsquo;s 1st Bowman Chrome Auto when our Bowman class files hold one, otherwise his 2026 Topps Chrome rookie card. Raw means ungraded. We print a median only when there are at least 3 dated sales.</p>
    <div class="ry-wrap"><table class="ry-tbl"><thead><tr><th scope="col">Lg</th><th scope="col">Player</th><th scope="col">Card</th><th scope="col">Raw sold</th><th scope="col">PSA 10</th><th scope="col">eBay</th></tr></thead>
<tbody>
${tr}
</tbody></table></div>
    <p class="ry-fine">The eBay buttons are live searches for each card with our affiliate tag (we may earn a commission). They show listings, not prices.</p>
  </section>
  <section>
    <div class="section-eyebrow">After Nov. 9</div>
    <h2>Before and After the Award</h2>
    <p class="section-intro">The winners are announced Monday, Nov. 9. The week after, we&rsquo;ll add a read of these same cards from Nov. 10 to 12 next to the numbers above, with the sale count on both sides, so you can see whether winning moved the price.</p>
    <p class="section-intro">More 1st Bowman Chrome Autos by draft class: <a href="/bowman-classes">Bowman 1st auto classes</a>. Bigger names and their key cards: <a href="/mlb-cards">MLB cards</a>.</p>
  </section>
  <section>
    <div class="section-eyebrow">Method</div>
    <h2>Where the Numbers Come From</h2>
    <p class="section-intro">Dated eBay sold prices, 90 days to ${DATE}, with n shown on each card. Each figure is the median of clean, single-card, ungraded sales of that exact card; lots and graded copies are left out. The finalists are from MLB.com&rsquo;s Nov. 2 list of BBWAA award finalists. These are past sales, not advice.</p>
  </section>
</div>
`;

const css = `<style id="ry-css">.ry-answer{max-width:70ch}
.ry-wrap{overflow-x:auto;margin-top:16px;border:1px solid var(--border2);border-radius:3px}
.ry-tbl{width:100%;border-collapse:collapse;font-size:13px;min-width:680px}.ry-tbl th,.ry-tbl td{padding:10px 12px;border-top:1px solid var(--border);text-align:left;vertical-align:top}
.ry-tbl thead th{color:var(--text-dim);font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600;border-top:none}.ry-tbl tbody th{color:var(--text-head);font-weight:600}
.ry-sub{display:block;font-size:11px;color:var(--text-dim);font-weight:400}.ry-n{font-family:var(--fm)}.ry-none{color:var(--text-dim)}.ry-lg{font-family:var(--fd);color:var(--text-dim)}
.ry-x{white-space:nowrap}.ry-eb{display:inline-block;padding:7px 10px;border:1px solid var(--border2);border-radius:3px;font-weight:600;font-size:12px;text-decoration:none;color:var(--text-head)}
.ry-fine{font-size:12px;color:var(--text-dim);line-height:1.5;margin:8px 0 0}</style>`;

const ld = [
  { "@context": "https://schema.org", "@type": "Article", headline: TITLE, url: URL, dateModified: asOf, description: DESC, author: { "@type": "Organization", name: "ShopCardHub", url: "https://www.shopcardhub.com" } },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Who are the 2026 MLB Rookie of the Year finalists, and what are their cards worth?", acceptedAnswer: { "@type": "Answer", text: ANSWER } }] },
];

const tpl = fs.readFileSync(path.join(REPO, "how-prices-work.html"), "utf8");
let head = tpl.slice(0, tpl.indexOf("<!-- NAV:END -->") + "<!-- NAV:END -->".length);
head = head.replace(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)} | ShopCardHub</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(DESC)}">`)
  .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${URL}">`)
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(TITLE)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(DESC)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${URL}">`)
  .replace(/(og|twitter):image" content="[^"]*"/g, (m, p) => `${p}:image" content="https://www.shopcardhub.com/og/default.png"`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n  ${JSON.stringify(ld)}\n  </script>`)
  .replace("</head>", `${css}\n</head>`);
const foot = tpl.slice(tpl.lastIndexOf("<footer>"));
const outHtml = head + "\n" + body + "\n" + foot;
fs.writeFileSync(path.join(REPO, SLUG + ".html"), outHtml);
execFileSync(process.execPath, [path.join(REPO, "tools/build-buy-strip.mjs"), "--only", SLUG], { stdio: "ignore" });
execFileSync(process.execPath, [path.join(REPO, "tools/build-signup.mjs")], { stdio: "ignore" });
console.log(`wrote ${SLUG}.html (${outHtml.length} bytes) · ${priced.length}/6 priced · as of ${asOf} · ${money(lo)}–${money(hi)}`);
