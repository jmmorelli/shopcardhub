#!/usr/bin/env node
// build-gift-guide.mjs — /pokemon-card-gift-guide-2026 (BET-20261030-2; Deal Hunter, Goal League S1, Nov 1 2026).
//
// Reads data/gift-guide.json (picks by budget band, each with our dated SOLD mark + n) and writes two generated
// blocks into pokemon-card-gift-guide-2026.html:
//   <!-- GIFTLD:START --> … <!-- GIFTLD:END -->   JSON-LD (FAQPage: the budget question, answered with the marks)
//   <!-- GIFT:START --> … <!-- GIFT:END -->       answer line + the bands + the source line
// Never hand-edit inside the markers: change the JSON, re-run this tool. Idempotent.
//
// Links: one standard eBay search link per pick, the house format (campid, mkevt=1, customid=<page slug>,
// rel="sponsored", visible "eBay" label). The price is a sold median, never an ask; the link is only a link.
//
// Usage: node tools/build-gift-guide.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSealedTitleRule } from './lib/sealed-title-rule.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'data/gift-guide.json'), 'utf8'));
requireSealedTitleRule(cfg, 'data/gift-guide.json', 'ref', { repo: REPO, ref: 'data/sealed-prices.json' }); // O-67: sealed picks come from that read
const PAGE = path.join(REPO, cfg.slug + '.html');
const EPN = 'LH_BIN=1&mkevt=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (x) => '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const longDay = (iso) => day(iso) + ', ' + iso.slice(0, 4);
const ebay = (p) => {
  const q = encodeURIComponent(p.q.replace(/\s+/g, ' ').trim()).replace(/'/g, '%27');
  return `https://www.ebay.com/sch/i.html?_nkw=${q}${p.cat ? '&_sacat=' + p.cat : ''}&${EPN}&customid=${cfg.slug}`;
};
const basis = (p, grade) => p.from ? `median of ${p.n} eBay sales, ${p.from === p.asOf ? day(p.asOf) : day(p.from) + '–' + day(p.asOf)}` : `${grade ? grade + ' ' : ''}median of ${p.n} sales, ${p.basis === '90d' ? '90' : '30'} days to ${day(p.asOf)}`;

// sanity: every pick carries a mark, a count >= 3 and a date; bands run high to low
for (const b of cfg.bands) for (const p of b.picks) {
  if (!(p.price > 0) || !(p.n >= 3) || !/^\d{4}-\d{2}-\d{2}$/.test(p.asOf)) throw new Error('pick without a dated sold mark: ' + p.id);
  if (!p.q) throw new Error('pick without an eBay query: ' + p.id);
}

// Ranked list (BET-20261124-1, CEO Desk Nov 24 2026): "best-selling" = most eBay sales per day in the window, counted,
// never judged. cfg.ranked.bands[].rows carry the same dated marks as data/black-friday.json; this tool ranks them.
const R = cfg.ranked;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
if (!R || !ISO.test(R.read) || !ISO.test(R.updated) || !ISO.test(R.published)) throw new Error('ranked: read/updated/published dates missing');
const spanDays = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1;
const perDay = (r) => r.n / spanDays(r.from, r.asOf);
let rseq = 0;
for (const b of R.bands) {
  for (const r of b.rows) {
    if (!(r.price > 0) || !(r.n >= 3) || !ISO.test(r.from) || !ISO.test(r.asOf) || r.asOf > R.read) throw new Error('ranked row without a dated sold mark: ' + r.id);
    if (r.price < b.min || (b.max != null && r.price >= b.max)) throw new Error(`ranked row ${r.id} outside band ${b.id}`);
    if (!r.q) throw new Error('ranked row without an eBay query: ' + r.id);
  }
  b.rows.sort((x, y) => perDay(y) - perDay(x) || y.n - x.n);
  for (const r of b.rows) r.nn = String(++rseq).padStart(2, '0');
}
const rLink = (r, band) => {
  const q = encodeURIComponent(r.q.replace(/\s+/g, ' ').trim()).replace(/'/g, '%27');
  const href = `https://www.ebay.com/sch/i.html?_nkw=${q}${r.cat ? '&_sacat=' + r.cat : ''}&${EPN}&customid=${cfg.slug}-${r.nn}`;
  return `<a class="btn-primary gr-buy" href="${esc(href)}" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${cfg.slug}-${r.nn}',band:'${esc(band)}',page:location.pathname})">See it on eBay ›</a>`;
};
const rSpan = (r) => (r.from === r.asOf ? day(r.asOf) : `${day(r.from)}–${day(r.asOf)}`);
const rate = (r) => { const x = perDay(r); return x >= 10 ? Math.round(x) : x >= 1 ? x.toFixed(1).replace(/\.0$/, '') : x.toFixed(2); };
const rRow = (r, i, b) => `
        <li class="gr-row">
          <span class="gr-rank">${i + 1}</span>
          <div class="gr-body">
            <h3 class="gr-name">${esc(r.name)}</h3>
            <p class="gr-what">${esc(r.what)}</p>
            <p class="gr-stats"><b>${money(r.price)}</b> median of ${r.n} eBay sales, ${rSpan(r)} · about ${rate(r)} a day</p>${r.launch ? `
            <p class="gr-launch">${esc(r.launch.label)}: ${money(r.launch.price)}</p>` : ''}
          </div>
          <div class="gr-act">${rLink(r, b.id)}${r.href ? `<a class="gg-more" href="${esc(r.href)}">Index ›</a>` : ''}</div>
        </li>`;
const top = (id) => R.bands.find((b) => b.id === id).rows[0];
const rAns = (r) => `the ${r.name} (median ${money(r.price)} on ${r.n} sales)`;
const rankedAnswer = `eBay sold prices to ${longDay(R.read)}: under $25 the most-sold gift was ${rAns(top('under-25'))}. From $25 to $100 it was ${rAns(top('25-100'))}, and at $100 and up ${rAns(top('100-up'))}.`;
const rankedBlock = `
    <p class="gg-updated">Updated ${longDay(R.updated)} · eBay sold prices read ${longDay(R.read)}</p>
    <p class="q-answer gg-answer">${esc(rankedAnswer)}</p>
    <div class="gr" id="best-selling">
      <p class="gg-note">Ranked inside each price band by how fast it sold on eBay: the number of sales divided by the days from the first sale to the last. Only sealed products we track are in the running, and the list is re-ranked each time we re-read prices.</p>
${R.bands.map((b) => `      <h3 class="gr-band" id="best-${b.id}">${esc(b.label)}</h3>
      <ol class="gr-list">${b.rows.map((r, i) => rRow(r, i, b)).join('')}
      </ol>`).join('\n')}
      <p class="gg-note">Black Friday week: <a href="/pokemon-black-friday-2026">Pokémon Black Friday 2026 prices</a> · <a href="/pokemon-stocking-stuffers-under-25">stocking stuffers under $25</a> · <a href="/best-hobby-boxes-2026">sports hobby boxes</a></p>
    </div>`;

function pick(p) {
  const grade = p.kind === 'graded' ? 'PSA 10' : null;
  const tagLine = p.kind !== 'graded' ? '' : p.tag
    ? `<span class="gg-tag">TAG 10: ${money(p.tag.price)}, median of ${p.tag.n} sales, ${p.tag.basis === '90d' ? '90' : '30'} days to ${day(p.asOf)}</span>`
    : `<span class="gg-tag">TAG 10: fewer than two sales in 90 days</span>`;
  const kind = p.kind === 'sealed' ? 'Sealed' : p.kind === 'graded' ? 'Graded' : 'Raw card';
  const sub = [p.set && p.kind !== 'sealed' ? p.set : null, p.what].filter(Boolean).join(' · ');
  return `
      <li class="gg-pick">
        <span class="gg-kind">${kind}</span>
        <h3 class="gg-name">${esc(p.name)}</h3>
        <p class="gg-what">${esc(sub)}</p>
        <p class="gg-price"><b>${money(p.price)}</b><span class="gg-basis">${esc(basis(p, grade))}</span>${tagLine}</p>
        <a class="btn-primary gg-buy" href="${esc(ebay(p))}" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${esc(cfg.slug + '-' + p.id)}',band:'${esc(cfg.bands.find((b) => b.picks.includes(p)).id)}',page:location.pathname})">See it on eBay ›</a>${p.href ? `\n        <a class="gg-more" href="${esc(p.href)}">${esc(p.hrefLabel)} ›</a>` : ''}
      </li>`;
}

function band(b, i) {
  return `
  <div class="gg-band" id="band-${b.id}">
    <h2>${esc(b.h2)}</h2>
    ${b.note ? `<p class="gg-note">${esc(b.note)}</p>` : `<p class="gg-note">${esc(b.label)}, highest sold price first.</p>`}
    <ul class="gg-grid">${b.picks.map(pick).join('')}
    </ul>
  </div>`;
}

const B = Object.fromEntries(cfg.bands.map((b) => [b.id, b]));
const lo = (id) => B[id].picks[B[id].picks.length - 1], hi = (id) => B[id].picks[0];
const sealedIn = (id) => B[id].picks.filter((p) => p.kind === 'sealed');
const answer = `Sold prices, ${day(cfg.read.sealed)}: ${money(sealedIn('25')[0].price)} buys a ${sealedIn('25')[0].name}, ${money(sealedIn('50')[sealedIn('50').length - 1].price)} a ${sealedIn('50')[sealedIn('50').length - 1].name}, ${money(sealedIn('100')[sealedIn('100').length - 1].price)} a ${sealedIn('100')[sealedIn('100').length - 1].name}, and ${money(sealedIn('250')[0].price)} a ${sealedIn('250')[0].name}.`;

const block = `<!-- GIFT:START — generated by tools/build-gift-guide.mjs from data/gift-guide.json. Do not hand-edit. -->
${rankedBlock}
    <p class="gg-note gg-budget">By budget, sealed: ${esc(answer.replace(/^Sold prices, /, 'sold prices to '))}</p>
    <p class="gg-jump">${cfg.bands.map((b) => `<a href="#band-${b.id}">${esc(b.label)}</a>`).join(' · ')}</p>
${cfg.bands.map(band).join('\n')}
  <p class="gg-call">These are what each budget buys at today's sold prices. A price here is not a call on where it goes next. Check the photos before you pay, and the cert number on a slab.</p>
  <p class="gg-src">Every price is a median of the completed sales PriceCharting lists for that exact product or grade (SportsCardsPro for the Bowman cards). Sealed rows count eBay sales only, and a sale has to name its own set and no other set in its title. Raw and graded rows are the sales PriceCharting lists for that card, mostly eBay; raw rows can include sales from one other marketplace. Read dates: sealed read ${longDay(cfg.read.sealed)}, raw cards read ${longDay(cfg.read.raw)}, PSA 10 and TAG 10 slabs read ${longDay(cfg.read.graded)}. A graded sale counts only when its own title names the grade. The eBay buttons open live listings. Those are asks, and they can sit above or below these numbers.</p>
<!-- GIFT:END -->`;

const allRanked = R.bands.flatMap((b) => b.rows.map((r) => ({ r, b })));
const rankedFaq = R.bands.map((b) => `${b.label}: ${b.rows.map((r, i) => `${i + 1}. ${r.name}, ${money(r.price)} median of ${r.n} eBay sales ${rSpan(r)}`).join('; ')}`).join('. ') + '.';
const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Best-selling Pokémon card gifts of 2026, by price', description: `Ranked by eBay sales per day in each price band, sold prices read ${longDay(R.read)}.`, numberOfItems: allRanked.length, itemListOrder: 'https://schema.org/ItemListOrderAscending', itemListElement: allRanked.map(({ r }, i) => ({ '@type': 'ListItem', position: i + 1, name: `${r.name} (${money(r.price)} median of ${r.n} eBay sales, ${rSpan(r)})`, url: `https://www.shopcardhub.com/${cfg.slug}#best-selling` })) };
const article = { '@context': 'https://schema.org', '@type': 'Article', headline: 'Best-Selling Pokémon Card Gifts of 2026, by Price', datePublished: R.published, dateModified: R.updated, url: `https://www.shopcardhub.com/${cfg.slug}`, author: { '@type': 'Organization', name: 'ShopCardHub' }, publisher: { '@type': 'Organization', name: 'ShopCardHub' } };
const faq = {
  '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
    { '@type': 'Question', name: 'What are the best-selling Pokémon card gifts in 2026?', acceptedAnswer: { '@type': 'Answer', text: `${rankedAnswer} Ranked by eBay sales per day: ${rankedFaq}` } },
    { '@type': 'Question', name: 'What Pokémon card gift can I get for $25, $50, $100 or $250?', acceptedAnswer: { '@type': 'Answer', text: answer + ' Each price is a median of the completed sales PriceCharting lists (eBay only on sealed rows; mostly eBay on card rows), with the sale count shown on the page.' } },
    ...cfg.bands.map((b) => ({ '@type': 'Question', name: b.id === 'bowman' ? 'What is a good baseball card gift from 2026 Bowman?' : `What Pokémon card gifts cost ${b.label.toLowerCase().replace('to', 'to')}?`, acceptedAnswer: { '@type': 'Answer', text: b.picks.map((p) => `${p.name}${p.set && p.kind !== 'sealed' ? ' (' + p.set + ')' : ''}: ${money(p.price)}, ${basis(p, p.kind === 'graded' ? 'PSA 10' : null)}`).join('; ') + '.' } })),
  ],
};
const ld = `<!-- GIFTLD:START — generated by tools/build-gift-guide.mjs. Do not hand-edit. -->
  <script type="application/ld+json">
  ${JSON.stringify(faq)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(itemList)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(article)}
  </script>
  <!-- GIFTLD:END -->`;

let html = fs.readFileSync(PAGE, 'utf8');
const swap = (src, name, body) => {
  const re = new RegExp(`<!-- ${name}:START[\\s\\S]*?<!-- ${name}:END -->`);
  if (!re.test(src)) throw new Error(`${name} markers missing in ${cfg.slug}.html`);
  return src.replace(re, () => body);
};
html = swap(swap(html, 'GIFTLD', ld), 'GIFT', block);
html = html.replace(/data-prices-updated="[^"]*"/, `data-prices-updated="${cfg.read.sealed}"`);
// the hero label carries the whole range of read dates, written in full every run (Nov 5 2026: the attribute moved, the text didn't)
const reads = Object.values(cfg.read).sort();
const range = reads[0] === reads[reads.length - 1] ? longDay(reads[0]) : (reads[0].slice(0, 4) === reads[reads.length - 1].slice(0, 4) ? `${day(reads[0])}–${longDay(reads[reads.length - 1])}` : `${longDay(reads[0])}–${longDay(reads[reads.length - 1])}`);
html = html.replace(/(<span data-prices-updated="[^"]*">)[^<]*(<\/span>)/, `$1Sold prices read ${range}$2`);
if (DRY) { console.log(block); process.exit(0); }
fs.writeFileSync(PAGE, html);
console.log(`gift guide: ${allRanked.length} ranked rows + ${cfg.bands.reduce((a, b) => a + b.picks.length, 0)} picks in ${cfg.bands.length} bands -> ${cfg.slug}.html`);
