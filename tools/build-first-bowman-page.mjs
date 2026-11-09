#!/usr/bin/env node
// build-first-bowman-page.mjs — /what-is-a-1st-bowman-card (Goal League S1, owner aisearch; Authority: Mo 2026-10-27, Goal League).
// The plain answer to "what is a 1st Bowman card" and "1st Bowman vs rookie card", with the dated 2026 class numbers
// assistants and search answers don't have. Not a shared generator: it writes only what-is-a-1st-bowman-card.html.
//
// Facts come from the Bowman KB (Project claude/kb/bowman/, [HIGH] lines only, plus the house doctrine in README and
// LANE-RULES R8/R9): two 1sts per prospect judged separately, never a second of either, not an RC (RC logo needs an MLB
// active roster, since 2006), logo history 1996 / none 1998–2002 / back 2003 incl. Chrome / missing 2013, no-logo years
// still count (Mo, Oct 17 2026), returning cards are not 1sts (Holliday #BCP-1 May vs #BCP-209 Sept, R8).
// Numbers: data/indices.json read-only. BOW26 (2026 Bowman, all releases) and BCB26 (2026 Bowman Chrome, September)
// levels, and per-card raw sold marks (30-day median, n >= 3, not carried). A BOW26 card is "2026 Bowman (May)" when its
// (number, name) pair is not in BCB26; card numbers alone collide (CPA-AG is two players).
// eBay links: the existing search format only (campid, mkevt=1, customid=<this slug>, visible "eBay", rel="sponsored").
// No paper card is ranked or linked (R9.6). No buy/sell call. After a write it re-applies its own BUYSTRIP (--only this slug) and SIGNUP.
//   node tools/build-first-bowman-page.mjs           write (idempotent)
//   node tools/build-first-bowman-page.mjs --check   exit 1 if the page is stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = 'what-is-a-1st-bowman-card';
const URL = `https://www.shopcardhub.com/${SLUG}`;
const OUT = path.join(ROOT, SLUG + '.html');
const CHECK = process.argv.includes('--check');
const EPN = 'mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtDate = s => { const [y, m, d] = s.split('-').map(Number); return `${MON[m - 1]} ${d}, ${y}`; };
const fmtDay = s => { const [, m, d] = s.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const fmtMonth = s => { const [y, m] = s.split('-').map(Number); return `${MONTH[m - 1]} ${y}`; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = n => '$' + Math.round(n).toLocaleString('en-US');
const pct = v => (v > 0 ? 'up ' : 'down ') + Math.abs(v).toFixed(1) + '%';
const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
const ebay = q => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q).replace(/%20/g, '+')}&_sacat=212&LH_BIN=1&${EPN}&customid=${SLUG}`;
const timeEl = s => `<time datetime="${s}">${fmtDay(s)}</time>`;

const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/indices.json'), 'utf8'));
function series(k) {
  const x = idx[k];
  if (!x || x.status !== 'live') throw new Error(`${k}: not live`);
  const hist = (x.history || []).filter(r => r && r.date && typeof r.level === 'number');
  const last = hist[hist.length - 1];
  let m = null; // the /indices screener's month rule: latest earlier live mark 27–41 days back
  for (let i = hist.length - 2; i >= 0; i--) {
    const g = (Date.parse(last.date) - Date.parse(hist[i].date)) / 864e5;
    if (g < 27) continue;
    if (g > 41) break;
    m = { v: (last.level / hist[i].level - 1) * 100, from: hist[i].date };
    break;
  }
  return { k, x, last, m, n: last.priced ?? (x.basket || []).length, since: last.level - 100 };
}
const BOW = series('BOW26'), BCB = series('BCB26');
const clean = b => typeof b.price === 'number' && b.price > 0 && !b.carried && (b.n30 ?? 0) >= 3
  && /^\d{4}-\d{2}-\d{2}$/.test(b.asOf || '') && /^sold\b/i.test(b.basis || '');
const sept = new Set(BCB.x.basket.map(b => b.num + '|' + b.name));
const top = (rows, product, q) => rows.filter(clean).sort((a, b) => b.price - a.price || a.name.localeCompare(b.name)).slice(0, 5)
  .map(b => ({ name: b.name, num: b.num, product, price: b.price, n: b.n30, win: b.win || 30, asOf: b.asOf, q: q(b) }));
const MAY = top(BOW.x.basket.filter(b => !sept.has(b.num + '|' + b.name)), '2026 Bowman (May)', b => `2026 Bowman ${b.name} auto ${b.num}`);
const SEP = top(BCB.x.basket, '2026 Bowman Chrome (September)', b => `2026 Bowman Chrome ${b.name} auto ${b.num}`);
if (MAY.length < 3 || SEP.length < 3) throw new Error('fewer than 3 priced cards in a table — refusing to write');
const asOf = [BOW.last.date, BCB.last.date, ...MAY.map(r => r.asOf), ...SEP.map(r => r.asOf)].sort().pop();

const TITLE = 'What Is a 1st Bowman Card? 1st Bowman vs Rookie Card, With Dated Auto Prices';
const DESC = `A 1st Bowman is a prospect's first Bowman card, marked by the 1st logo. It is not a rookie card. The 2026 1st Bowman Chrome Auto class (BOW26) stood at ${BOW.last.level.toFixed(2)} on ${fmtDate(BOW.last.date)}, ${pct(BOW.since)} since the ${fmtMonth(BOW.x.baseDate)} release.`;
const A1 = `A 1st Bowman is a baseball prospect's first card in a Bowman product. In most years since 2003 it has a small "1st" logo on the front. A prospect can have two of them, judged separately: his first card without an autograph and his first autograph. He never gets a second of either.`;
const A2 = `A 1st Bowman is not a rookie card. Since 2006 the Rookie Card logo only goes on a card after the player has been on an MLB active roster, and a 1st Bowman usually comes out while he is still in the minors.`;
const A3 = `The version collectors pay most for is the 1st Bowman Chrome Auto. Our index of every 2026 1st Bowman Chrome Auto (BOW26) stood at ${BOW.last.level.toFixed(2)} on ${fmtDate(BOW.last.date)}, ${pct(BOW.since)} since the ${fmtMonth(BOW.x.baseDate)} release month, across ${BOW.n} cards on dated sold prices.`;

const idxRow = (s, label) => `<tr><th scope="row"><a href="${s.x.page}">${esc(s.k)}</a><span class="fb-sub">${esc(label)}</span></th><td class="fb-n">${s.last.level.toFixed(2)}<span class="fb-sub">${timeEl(s.last.date)}</span></td><td class="fb-n">${sgn(s.since)}<span class="fb-sub">100 = ${esc(fmtMonth(s.x.baseDate))}</span></td><td class="fb-n">${s.m ? sgn(s.m.v) + `<span class="fb-sub">from ${timeEl(s.m.from)}</span>` : '<span class="fb-none">Not enough marks</span>'}</td><td class="fb-n">${s.n}</td><td class="fb-n">${typeof s.last.basketValue === 'number' ? usd0(s.last.basketValue) : '<span class="fb-none">n/a</span>'}</td></tr>`;
const cardRows = rows => rows.map(r => {
  const oc = ` onclick="if(typeof gtag==='function')gtag('event','chase_click',{item:'${SLUG}:${esc(r.num)}',page:location.pathname})"`;
  return `<tr><th scope="row">${esc(r.name)}<span class="fb-sub">#${esc(r.num)} &middot; 1st Bowman Chrome Auto</span></th><td class="fb-n">${money(r.price)}<span class="fb-sub">median of ${r.n} sales, ${r.win} days to ${timeEl(r.asOf)}</span></td><td class="fb-x"><a class="fb-eb" href="${esc(ebay(r.q))}" target="_blank" rel="sponsored nofollow noopener"${oc}>Find it on eBay</a></td></tr>`;
}).join('\n');
const cardTable = (rows, cap) => `<div class="fb-wrap"><table class="fb-tbl"><caption>${esc(cap)}</caption><thead><tr><th scope="col">Player and card</th><th scope="col">Raw sold</th><th scope="col">eBay</th></tr></thead>
<tbody>
${cardRows(rows)}
</tbody></table></div>`;

const body = `
<section class="hero" style="border-top:none; padding-bottom:0;">
  <div class="container">
    <div class="hero-eyebrow">Bowman &middot; Explainer &middot; Numbers to ${timeEl(asOf)}</div>
    <h1>What Is a 1st Bowman Card?</h1>
    <div class="fb-answer" id="answer">
      <p class="hero-sub">${esc(A1)}</p>
      <p class="hero-sub">${esc(A2)}</p>
      <p class="hero-sub">${esc(A3)}</p>
    </div>
  </div>
</section>
<div class="container">
  <section style="border-top:none; padding-top:0;">
    <div class="section-eyebrow green">Two per prospect</div>
    <h2>The 1st Bowman Chrome and the 1st Bowman Chrome Auto</h2>
    <p class="section-intro">These are two different cards, and each one is judged on its own. Having a 1st Bowman Chrome does not mean a player also has a 1st Bowman Chrome Auto. Usually he gets one, but not always, and the autograph can come in a later release.</p>
    <div class="fb-wrap"><table class="fb-tbl fb-two"><thead><tr><th scope="col"></th><th scope="col">1st Bowman Chrome</th><th scope="col">1st Bowman Chrome Auto</th></tr></thead>
<tbody>
<tr><th scope="row">What it is</th><td>The player's first Bowman card with no autograph</td><td>The player's first Bowman autograph</td></tr>
<tr><th scope="row">How many</th><td>One per player, ever</td><td>One per player, ever</td></tr>
<tr><th scope="row">Card numbers</th><td>BCP numbers</td><td>CPA numbers</td></tr>
<tr><th scope="row">Example</th><td>Sammy Hernandez, May 2025 Bowman</td><td>Sammy Hernandez, September 2025 Bowman Chrome</td></tr>
</tbody></table></div>
    <p class="fb-fine">Both of Hernandez's cards carry the 1st logo, a few months apart. Every Bowman prospect autograph is a Chrome card. The paper version of a first card (BP numbers) carries the logo too; this site tracks only the Chrome cards and Chrome autos.</p>
  </section>
  <section>
    <div class="section-eyebrow">The difference</div>
    <h2>1st Bowman vs Rookie Card</h2>
    <div class="fb-wrap"><table class="fb-tbl fb-two"><thead><tr><th scope="col"></th><th scope="col">1st Bowman</th><th scope="col">Rookie card (RC)</th></tr></thead>
<tbody>
<tr><th scope="row">When it comes out</th><td>The player's first Bowman release, usually years before his MLB debut</td><td>Only after he has been on an MLB active roster (the rule since 2006)</td></tr>
<tr><th scope="row">The logo</th><td>"1st" in the corner</td><td>The MLB "Rookie Card" shield</td></tr>
<tr><th scope="row">Card numbers</th><td>Prospect numbering (BP, BCP, CPA)</td><td>The veteran and rookie base cards</td></tr>
</tbody></table></div>
    <p class="fb-fine">A prospect card is never an RC. Collectors buy the 1st Bowman before a player reaches the majors. The rookie card comes later.</p>
  </section>
  <section>
    <div class="section-eyebrow">How to check a card</div>
    <h2>How to Tell If a Card Is a 1st Bowman</h2>
    <p class="section-intro">Look for the 1st logo. Bowman introduced a "1st Bowman Card" mark in 1996 and kept it in 1997, then dropped it from 1998 to 2002. It came back in 2003 on paper and Chrome, was missing again in 2013, and has been on every year's cards since 2014.</p>
    <p class="section-intro">In the years with no logo, the player's first Bowman card is still his 1st Bowman. You find it from the checklist history instead of the card front. Aaron Judge's 2013 Bowman Draft cards are his 1st Bowmans with no logo on them.</p>
    <p class="section-intro">A later card of the same player is not a 1st, even in a bigger set. Ethan Holliday's 1st Bowman Chrome is #BCP-1 in May's 2026 Bowman. He is also in September's 2026 Bowman Chrome as #BCP-209, a returning card with no 1st logo.</p>
  </section>
  <section>
    <div class="section-eyebrow gold">Dated prices</div>
    <h2>What 1st Bowman Chrome Autos Sell for Now</h2>
    <p class="section-intro">Each index is the cost of one raw copy of every 1st Bowman Chrome Auto in its basket, set to 100 at the release month and re-marked Monday and Thursday from dated sold prices.</p>
    <div class="fb-wrap"><table class="fb-tbl"><thead><tr><th scope="col">Index</th><th scope="col">Level</th><th scope="col">Since release</th><th scope="col">Latest month</th><th scope="col">Cards</th><th scope="col">One of each</th></tr></thead>
<tbody>
${idxRow(BOW, '2026 Bowman, all releases')}
${idxRow(BCB, '2026 Bowman Chrome (September)')}
</tbody></table></div>
    <h3 class="fb-h3">Top 1st Bowman Chrome Autos, 2026 Bowman (May)</h3>
    ${cardTable(MAY, 'Highest raw sold median among the 2026 Bowman (May) 1st Bowman Chrome Autos with at least 3 sales')}
    <h3 class="fb-h3">Top 1st Bowman Chrome Autos, 2026 Bowman Chrome (September)</h3>
    ${cardTable(SEP, 'Highest raw sold median among the 2026 Bowman Chrome (September) 1st Bowman Chrome Autos with at least 3 sales')}
    <p class="fb-fine">Raw means ungraded. A price prints only with at least 3 dated sales of that exact card. The eBay buttons are live searches for each card with our affiliate tag (we may earn a commission). They show listings, not prices.</p>
    <p class="section-intro">Every card in each class, with its own price and date: <a href="/bowman-1st-chrome-index">BOW26, all 2026 1st Bowman Chrome Autos</a> &middot; <a href="/bowman-chrome-2026-index">BCB26, September 2026 Bowman Chrome</a> &middot; <a href="/bowman-classes">older 1st Bowman classes</a>.</p>
  </section>
  <section>
    <div class="section-eyebrow">Method</div>
    <h2>Where the Numbers Come From</h2>
    <p class="section-intro">Dated sold prices of single raw cards, with lots and graded copies left out. Each card's figure is the median of its sales over the window shown. How every number on the site is built: <a href="/how-prices-work">how our prices work</a>. These are past sales, not advice.</p>
  </section>
</div>
`;

const css = `<style id="fb-css">.fb-answer{max-width:70ch}.fb-answer .hero-sub{margin:0 0 12px}
.fb-wrap{overflow-x:auto;margin-top:16px;border:1px solid var(--border2);border-radius:3px}
.fb-tbl{width:100%;border-collapse:collapse;font-size:13px}.fb-tbl th,.fb-tbl td{padding:10px 12px;border-top:1px solid var(--border);text-align:left;vertical-align:top}
.fb-tbl caption{caption-side:top;text-align:left;padding:8px 12px 0;font-size:11px;color:var(--text-dim)}
.fb-tbl thead th{color:var(--text-dim);font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600;border-top:none}.fb-tbl tbody th{color:var(--text-head);font-weight:600}
.fb-sub{display:block;font-size:11px;color:var(--text-dim);font-weight:400}.fb-n{font-family:var(--fm)}.fb-none{color:var(--text-dim)}
.fb-x{white-space:nowrap}.fb-eb{display:inline-block;padding:7px 10px;border:1px solid var(--border2);border-radius:3px;font-weight:600;font-size:12px;text-decoration:none;color:var(--text-head)}
.fb-h3{margin:24px 0 0;font-size:16px}.fb-fine{font-size:12px;color:var(--text-dim);line-height:1.5;margin:8px 0 0}</style>`;

const ld = [
  { '@context': 'https://schema.org', '@type': 'Article', headline: TITLE, url: URL, dateModified: asOf, description: DESC,
    about: [{ '@type': 'Thing', name: '1st Bowman card' }, { '@type': 'Dataset', name: BOW.x.name, url: 'https://www.shopcardhub.com' + BOW.x.page }],
    author: { '@type': 'Organization', name: 'ShopCardHub', url: 'https://www.shopcardhub.com' } },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
    { '@type': 'Question', name: 'What is a 1st Bowman card?', acceptedAnswer: { '@type': 'Answer', text: A1 } },
    { '@type': 'Question', name: 'Is a 1st Bowman a rookie card?', acceptedAnswer: { '@type': 'Answer', text: A2 } },
    { '@type': 'Question', name: 'What are 2026 1st Bowman Chrome Autos worth?', acceptedAnswer: { '@type': 'Answer', text: A3 } },
  ] },
];

const tpl = fs.readFileSync(path.join(ROOT, 'how-prices-work.html'), 'utf8');
let head = tpl.slice(0, tpl.indexOf('<!-- NAV:END -->') + '<!-- NAV:END -->'.length);
head = head.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(TITLE)} | ShopCardHub</title>`)
  .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${esc(DESC)}">`)
  .replace(/<link rel="canonical" href="[^"]*">/, () => `<link rel="canonical" href="${URL}">`)
  .replace(/<meta property="og:title" content="[^"]*">/, () => `<meta property="og:title" content="${esc(TITLE)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, () => `<meta property="og:description" content="${esc(DESC)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, () => `<meta property="og:url" content="${URL}">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">\n  ${JSON.stringify(ld)}\n  </script>`)
  .replace('</head>', () => `${css}\n</head>`);
const foot = tpl.slice(tpl.lastIndexOf('<footer>'));
const html = head + '\n' + body + '\n' + foot;
if (/pricecharting|tcgplayer/i.test(body)) throw new Error('a source name slipped into the body');
// The BUYSTRIP block (tools/build-buy-strip.mjs, entry in data/buy-strip.json) is a pure insert; compare without it.
// Same for the SIGNUP block (tools/build-signup.mjs, R26).
const STRIP = /<!-- BUYSTRIP:START[\s\S]*?<!-- BUYSTRIP:END -->\n/, SIGN = /<!-- SIGNUP:START[\s\S]*?<!-- SIGNUP:END -->\n?/;
const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
const stale = cur.replace(STRIP, '').replace(SIGN, '') !== html || !STRIP.test(cur) || !SIGN.test(cur);
if (CHECK) { if (stale) console.log(`stale: ${SLUG}.html`); }
else if (stale) {
  fs.writeFileSync(OUT, html);
  execFileSync(process.execPath, [path.join(ROOT, 'tools/build-buy-strip.mjs'), '--only', SLUG], { stdio: 'ignore' });
  execFileSync(process.execPath, [path.join(ROOT, 'tools/build-signup.mjs')], { stdio: 'ignore' });
}
console.log(`build-first-bowman-page: BOW26 ${BOW.last.level.toFixed(2)} (${BOW.last.date}) · BCB26 ${BCB.last.level.toFixed(2)} · May ${MAY.length} / Sept ${SEP.length} cards · ${stale ? (CHECK ? '1 stale' : '1 written') : '0 written'}`);
if (CHECK && stale) process.exit(1);
