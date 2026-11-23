#!/usr/bin/env node
// build-cu26-rookies.mjs — /topps-chrome-update-2026-rookies: the four 2026 award winners (Cy Young: Misiorowski, Schlittler;
// Rookie of the Year: McGonigle, Stewart), each with a rookie debut patch card in 2026 Topps Chrome Update Series (Dec 9),
// and what each one's 1st Bowman Chrome card has sold for before that release. Owner: wildcard (Goal League S1; CoS
// BET-20261116-2). Not a shared generator: it writes only topps-chrome-update-2026-rookies.html, then re-applies the page's
// BUYSTRIP (--only) and SIGNUP blocks with their own tools.
//
// Input: data/cu26-rookies.json (players, cards, eBay queries, the Dec 9 source). Prices, per card, first hit wins:
//   1. data/feed/sold-marks.json  key = card.soldKey (the nightly SOLD mark: 30-day median of >= 3 dated sales, else the
//      90-day median of >= 2). Only the card paths already read by number + name are named in the data file; a key the
//      nightly does not carry yet is simply skipped, so the page upgrades itself once the price lane adds the path.
//   2. data/indices.json class basket (card.basket {ticker, num}): the 90-day median of n clean sales and its asOf.
//   3. data/mlb-cards.json dated sold range (card.mlbCards {player, num, parallel}): lo-hi of n sales in the 30 days to asof.
//   4. card.rawThin {price, date}: one dated sale, printed as one sale (thin).
//   else "No dated sold read yet" (n = 0). Nothing is fetched, estimated or typed in. Asks are never used (R20).
// Medians print only at n >= 3; a range at n >= 3; n < 3 is labelled thin. Graded figures carry "(N dated sales)" (R18).
// updateFirstSold per player (Dec 10 / Dec 14 re-marks) prints when set; null prints "Starts after Dec. 9".
// Nov 19 2026: H1 fixed (the Nov 18 build wrote a nested h1; Commissioner return 0ae2ab3). The build now throws if the page
// does not hold exactly one <h1>.
//
// Usage: node tools/build-cu26-rookies.mjs     (idempotent; same inputs → same bytes)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "topps-chrome-update-2026-rookies";
const URL = `https://www.shopcardhub.com/${SLUG}`;
const EPN = "mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001";
const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const long = (s) => { const t = new Date(s + "T12:00:00Z"); return `${MN[t.getUTCMonth()]} ${t.getUTCDate()}, ${t.getUTCFullYear()}`; };
const short = (s) => { const t = new Date(s + "T12:00:00Z"); return `${MN[t.getUTCMonth()].slice(0, 3)} ${t.getUTCDate()}, ${t.getUTCFullYear()}`; };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ebay = (q, cid) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q).replace(/%20/g, "+")}&${EPN}&customid=${cid}`;
const read = (f) => JSON.parse(fs.readFileSync(path.join(REPO, f), "utf8"));

const D = read("data/cu26-rookies.json");
const marks = fs.existsSync(path.join(REPO, "data/feed/sold-marks.json")) ? read("data/feed/sold-marks.json") : { cards: [] };
const markBy = Object.fromEntries((marks.cards || []).map((c) => [c.key, c]));
const idx = read("data/indices.json");
const mlb = read("data/mlb-cards.json");

// One dated read per (card, condition). Returns {kind, text, sub, asOf, n} or null.
function rawRead(c) {
  const m = c.soldKey && markBy[c.soldKey];
  if (m && m.last != null && m.n30 != null) {
    const n = m.n30 >= 3 ? m.n30 : m.n90;
    const win = m.n30 >= 3 ? "30" : "90";
    if (n >= 2) return { kind: "median", text: money(m.last), sub: `median of ${n} sales, ${win} days to ${short(marks.day)}${n < 3 ? " (thin)" : ""}`, to: `${win} days to ${short(marks.day)}`, asOf: marks.day, n };
  }
  if (c.basket) {
    const b = (idx[c.basket.ticker]?.basket || []).find((r) => r.num === c.basket.num);
    if (b && b.price != null && b.n30 >= 3 && !b.carried && !b.heldMove)
      return { kind: "median", text: money(b.price), sub: `median of ${b.n30} sales, ${b.win || 90} days to ${short(b.asOf)}`, to: `${b.win || 90} days to ${short(b.asOf)}`, asOf: b.asOf, n: b.n30 };
  }
  if (c.mlbCards) {
    const p = (mlb.players || []).find((x) => x.slug === c.mlbCards.player);
    const k = p && p.cards.find((x) => x.num === c.mlbCards.num && x.parallel === c.mlbCards.parallel);
    if (k && k.raw && k.raw.n >= 3)
      return { kind: "range", text: `${money(k.raw.lo)}&ndash;${money(k.raw.hi)}`, sub: `range of ${k.raw.n} sales, 30 days to ${short(k.raw.asof)}`, to: `30 days to ${short(k.raw.asof)}`, asOf: k.raw.asof, n: k.raw.n };
  }
  if (c.rawThin) return { kind: "one", text: money(c.rawThin.price), sub: `one sale, ${short(c.rawThin.date)} (thin: not a median)`, asOf: c.rawThin.date, n: 1 };
  return null;
}
function psa10Read(c) {
  if (!c.mlbCards) return null;
  const p = (mlb.players || []).find((x) => x.slug === c.mlbCards.player);
  const k = p && p.cards.find((x) => x.num === c.mlbCards.num && x.parallel === c.mlbCards.parallel);
  if (!k || !k.psa10) return null;
  const s = k.psa10, thin = s.n < 3;
  return { text: Math.abs(s.hi - s.lo) < 0.01 ? money(s.lo) : `${money(s.lo)}&ndash;${money(s.hi)}`, sub: `${s.n} dated sale${s.n === 1 ? "" : "s"}, 30 days to ${short(s.asof)}${thin ? " (thin)" : ""}`, asOf: s.asof, n: s.n };
}

const players = D.players.map((p) => ({ ...p, cards: p.cards.map((c) => ({ ...c, raw: rawRead(c), psa10: psa10Read(c) })) }));
const all = players.flatMap((p) => p.cards.flatMap((c) => [c.raw, c.psa10].filter(Boolean)));
if (!all.length) throw new Error("no dated read at all — refusing to write");
const newest = all.map((r) => r.asOf).sort().pop();
const REL = D.release, RELD = new Date(REL.date + "T12:00:00Z");
const relShort = `Dec. ${RELD.getUTCDate()}`;
const pBy = Object.fromEntries(players.map((p) => [p.id, p]));
const autoOf = (id) => pBy[id].cards.find((c) => c.role === "auto");

// The answer, built from the reads (no figure typed here)
const say = (id) => {
  const p = pBy[id], c = autoOf(id), r = c.raw, code = c.title.match(/#[A-Z0-9-]+/)[0];
  if (!r) return `${p.name}'s ${code} has no dated sold read on our side yet`;
  if (r.kind === "median") return `${p.name}'s ${code} has a raw median of ${r.text} (${r.n} sales, ${r.to})`;
  if (r.kind === "range") return `${p.name}'s ${code} sold for ${r.text} raw (${r.n} sales, ${r.to})`;
  return `${p.name}'s ${code} barely trades: one raw sale at ${r.text} on ${short(r.asOf)}`;
};
const none = ["schlittler", "stewart"].filter((id) => !autoOf(id).raw);
const tail = none.length === 2 ? `${none.map((id) => `${pBy[id].name}'s ${autoOf(id).title.match(/#[A-Z0-9-]+/)[0]}`).join(" and ")} have no dated sold read on our side yet` : `${say("schlittler")}. ${say("stewart")}`;
// Nov 22: the hero keeps the short answer so the buy strip sits on the first phone screen; the other three reads open the cards section.
const ANSWER = `Both 2026 Cy Young winners (Jacob Misiorowski, Cam Schlittler) and both Rookies of the Year (Kevin McGonigle, Sal Stewart) have a one-of-one rookie debut patch autograph in ${esc(REL.product)}, out ${relShort} (${esc(REL.sourceName)}, ${short(REL.sourceDate)}). The card most collectors can buy is each player's 1st Bowman Chrome Auto. ${say("mcgonigle")}.`;
const READS = `${say("misiorowski")}. ${tail}.`;
const TITLE = "2026 Topps Chrome Update Rookies: Cy Young and ROY Winners' 1st Bowman Autos, Sold";
const DESC = `Misiorowski, Schlittler, McGonigle and Stewart each have a rookie debut patch auto in 2026 Topps Chrome Update (Dec. 9). What their 1st Bowman Chrome Autos sold for, with sale counts and dates.`;

const cell = (label, r, none) => r ? `<div class="cu-row"><span class="cu-l">${label}</span><span class="cu-v">${r.text}<span class="cu-sub">${r.sub}</span></span></div>` : `<div class="cu-row"><span class="cu-l">${label}</span><span class="cu-v cu-none">${none}<span class="cu-sub">n = 0</span></span></div>`;
const card = (p) => {
  const up = p.updateFirstSold;
  const upCell = up ? `<span class="cu-v">${money(up.median)}<span class="cu-sub">median of ${up.n} sales, ${esc(up.window)} to ${short(up.asOf)}</span></span>` : `<span class="cu-v cu-none">Starts after ${relShort}<span class="cu-sub">first sold read Dec. 10, again Dec. 14</span></span>`;
  const blocks = p.cards.map((c) => {
    const oc = ` onclick="if(typeof gtag==='function')gtag('event','cu26_click',{item:'${SLUG}:${p.id}-${c.role}',page:location.pathname})"`;
    return `<div class="cu-card-line"><div class="cu-t">${esc(c.title).replace(/#[A-Z0-9-]+/, (m) => `<span class="cu-nw">${m}</span>`)}<span class="cu-sub">${esc(c.tag)}</span></div>
${cell("Raw sold", c.raw, "No dated sold read yet")}${c.psa10 ? cell("PSA 10", c.psa10, "") : ""}
<a class="cu-eb${c.role === "auto" ? "" : " cu-eb2"}" href="${ebay(c.q, `${SLUG}-${p.id}-${c.role}`)}" target="_blank" rel="sponsored nofollow noopener"${oc}>${esc(c.cta)}</a></div>`;
  }).join("\n");
  return `<article class="cu-p" id="${p.id}">
<div class="cu-aw">${esc(p.award)} &middot; announced ${esc(p.announced)}</div>
<h3>${esc(p.name)}<span class="cu-sub">${esc(p.team)}</span></h3>
${blocks}
<div class="cu-row cu-up"><span class="cu-l">Chrome Update sales</span>${upCell}</div>
</article>`;
};

const body = `
<section class="hero" style="border-top:none; padding-bottom:0;" data-prices-updated="${newest}">
  <div class="container">
    <div class="hero-eyebrow">MLB &middot; Topps Chrome Update &middot; ${relShort}</div>
    <h1>2026 Topps Chrome Update<br><em>The Award Winners&rsquo; 1st Bowman Autos</em></h1>
    <p class="hero-sub cu-answer" id="answer">${ANSWER}</p>
  </div>
</section>
<div class="container">
  <section style="border-top:none; padding-top:0;">
    <div class="section-eyebrow green">Four winners</div>
    <h2>Each Winner&rsquo;s 1st Bowman Chrome Card and What It Sold For</h2>
    <p class="section-intro">${READS}</p>
    <p class="section-intro">Raw means ungraded. A median prints only when there are at least 3 dated sales; fewer are marked thin. Misiorowski&rsquo;s figures are the last read we hold, from before his Cy Young win on Nov. 11, so they show his market before the award. The bottom line of each card fills in once ${esc(REL.product)} sells.</p>
    <div class="cu-grid">
${players.map(card).join("\n")}
    </div>
    <p class="cu-fine">The eBay buttons are live searches with our affiliate tag (we may earn a commission). They show listings, not prices.</p>
  </section>
  <section>
    <div class="section-eyebrow">The release</div>
    <h2>What Is in Chrome Update for These Four</h2>
    <p class="section-intro">${esc(REL.sourceName)} (${short(REL.sourceDate)}) lists Misiorowski, Schlittler, McGonigle and Stewart among the players with a rookie debut patch card in ${esc(REL.product)}, and describes those as one-of-one cards that pair the player&rsquo;s autograph with his MLB debut patch. The release date is ${long(REL.date)}. Those patch cards will sell one at a time, so the 1st Bowman Chrome Autos above stay the cards with enough sales to price.</p>
    <p class="section-intro">The award winners: MLB.com, ${short(D.awards.sourceDate)}. All six Rookie of the Year finalists and their cards: <a href="/mlb-rookie-of-the-year-2026-cards">2026 Rookie of the Year cards</a>. More 1st Bowman Chrome Autos by draft class: <a href="/bowman-classes">Bowman 1st auto classes</a>. What makes a card a 1st Bowman: <a href="/what-is-a-1st-bowman-card">what is a 1st Bowman card</a>.</p>
  </section>
  <section>
    <div class="section-eyebrow">Method</div>
    <h2>Where the Numbers Come From</h2>
    <p class="section-intro">Dated eBay sold prices of the exact card, raw unless the row says PSA 10. Lots and graded copies are left out of raw figures. Each figure shows its sale count and the last date it covers. Listings are never used as sales. These are past sales, not advice.</p>
  </section>
</div>
`;
const css = `<style id="cu-css">.cu-answer{max-width:72ch}
.cu-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}
.cu-p{border:1px solid var(--border2);border-radius:3px;padding:16px 18px;min-width:0}
.cu-p h3{font-family:var(--fd);font-size:22px;color:var(--text-head);margin:2px 0 12px;line-height:1.2}
.cu-aw{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--accent);font-weight:600}
.cu-sub{display:block;font-size:11px;color:var(--text-dim);font-weight:400;font-family:var(--fb,inherit);letter-spacing:0;text-transform:none}
.cu-card-line{border-top:1px solid var(--border);padding:12px 0}
.cu-t{color:var(--text-head);font-weight:600;font-size:14px;margin-bottom:8px}
.cu-row{display:grid;grid-template-columns:118px minmax(0,1fr);column-gap:10px;margin:0 0 8px;font-size:13px}
.cu-l{color:var(--text-dim);font-size:12px}.cu-v{font-family:var(--fm);color:var(--text)}.cu-none{color:var(--text-dim)}
.cu-up{border-top:1px solid var(--border);padding-top:12px;margin:0}
.cu-eb{display:block;text-align:center;margin-top:6px;padding:11px 10px;border-radius:980px;background:var(--accent);color:#000 !important;font-weight:600;font-size:13px;text-decoration:none}
.cu-eb:hover{background:#5cdcf8;text-decoration:none}.cu-eb2{background:var(--bg4);color:var(--text-head) !important;border:1px solid var(--border2)}.cu-eb2:hover{background:var(--bg3)}
.cu-nw{white-space:nowrap}.cu-fine{font-size:12px;color:var(--text-dim);line-height:1.5;margin:12px 0 0}
@media (max-width:760px){.cu-grid{grid-template-columns:minmax(0,1fr)}.cu-row{grid-template-columns:96px minmax(0,1fr)}}</style>`;
const faqs = players.map((p) => {
  const c = autoOf(p.id), r = c.raw;
  return { "@type": "Question", name: `What does ${p.name}'s 1st Bowman Chrome Auto sell for?`, acceptedAnswer: { "@type": "Answer", text: `${p.name} (${p.award}, 2026): ${c.title.replace(/&/g, "and")}. ${r ? `${r.text.replace("&ndash;", " to ")} raw, ${r.sub}.` : "No dated sold read on our side yet."} He has a rookie debut patch card in ${REL.product}, out Dec. 9, 2026.` } };
});
const ld = [
  { "@context": "https://schema.org", "@type": "Article", headline: TITLE, url: URL, dateModified: newest, description: DESC, author: { "@type": "Organization", name: "ShopCardHub", url: "https://www.shopcardhub.com" } },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs },
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
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">\n  ${JSON.stringify(ld)}\n  </script>`)
  .replace("</head>", () => `${css}\n</head>`);
const foot = tpl.slice(tpl.lastIndexOf("<footer>"));
const outHtml = head + "\n" + body + "\n" + foot;
const h1s = (outHtml.match(/<h1[\s>]/g) || []).length;
if (h1s !== 1) throw new Error(`expected exactly one <h1>, found ${h1s} — refusing to write`);
fs.writeFileSync(path.join(REPO, SLUG + ".html"), outHtml);
execFileSync(process.execPath, [path.join(REPO, "tools/build-buy-strip.mjs"), "--only", SLUG], { stdio: "ignore" });
execFileSync(process.execPath, [path.join(REPO, "tools/build-signup.mjs")], { stdio: "ignore" });
const priced = players.flatMap((p) => p.cards).filter((c) => c.raw).length;
console.log(`wrote ${SLUG}.html (${outHtml.length} bytes) · ${priced}/${players.flatMap((p) => p.cards).length} cards with a raw read · newest ${newest}`);
