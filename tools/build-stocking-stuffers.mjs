#!/usr/bin/env node
// build-stocking-stuffers.mjs — /pokemon-stocking-stuffers-under-25 (BET-20261113-1; Deal Hunter, Goal League S1, Nov 15 2026).
//
// Reads data/stocking-stuffers.json (rows by price band, each with our dated SOLD mark + n, a labelled retailer
// launch price, or a link to another page's prices) and writes two generated blocks into the page:
//   <!-- STUFFLD:START --> … <!-- STUFFLD:END -->   JSON-LD (FAQPage, answered with the marks)
//   <!-- STUFF:START --> … <!-- STUFF:END -->       answer line + the bands + the source line
// Never hand-edit inside the markers: change the JSON, re-run this tool. Idempotent.
//
// Links: one standard eBay search link per priced row, the house format (campid, mkevt=1, customid=<page slug>,
// rel="sponsored", visible "eBay" label), same parameters as tools/build-gift-guide.mjs. A sold median is never an ask;
// the link is only a link. 'link' rows carry no price and no eBay button.
//
// Usage: node tools/build-stocking-stuffers.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSealedTitleRule } from './lib/sealed-title-rule.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'data/stocking-stuffers.json'), 'utf8'));
requireSealedTitleRule(cfg, 'data/stocking-stuffers.json', 'set'); // O-67
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
const win = (p) => (p.from === p.asOf ? day(p.asOf) : `${day(p.from)}–${day(p.asOf)}`);
const basis = (p) => `median of ${p.n} eBay sales, ${win(p)}`;

// sanity: every priced row carries a mark, n >= 3 and dates; launch rows a source and a date; bands run low to high
const iso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
for (const b of cfg.bands) for (const p of b.rows) {
  if (p.kind === 'sealed' || p.kind === 'perpack') {
    if (!(p.price > 0) || !(p.n >= 3) || !iso(p.asOf) || !iso(p.from)) throw new Error('row without a dated sold mark: ' + p.id);
    if (!p.q) throw new Error('row without an eBay query: ' + p.id);
  } else if (p.kind === 'launch') {
    if (!(p.launch > 0) || !iso(p.launchDate) || !p.source) throw new Error('launch row without price, date or source: ' + p.id);
  } else if (p.kind !== 'link' || !p.href) throw new Error('unknown row kind: ' + p.id);
}

const btn = (p, b) => `<a class="btn-primary gg-buy" href="${esc(ebay(p))}" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${esc(cfg.slug + '-' + p.id)}',band:'${esc(b.id)}',page:location.pathname})">See it on eBay ›</a>`;
function row(p, b) {
  const more = p.href ? `\n        <a class="gg-more" href="${esc(p.href)}">${esc(p.hrefLabel)} ›</a>` : '';
  let price = '', kind = 'Sealed', buy = '';
  if (p.kind === 'sealed') { price = `<p class="gg-price"><b>${money(p.price)}</b><span class="gg-basis">${esc(basis(p))}</span></p>`; buy = '\n        ' + btn(p, b); }
  if (p.kind === 'perpack') { price = `<p class="gg-price"><b>${money(p.price)}</b><span class="gg-basis">${esc(`a pack: ${money(p.whole)} for the bundle ÷ ${p.packs} packs; ${basis(p)}`)}</span></p>`; buy = '\n        ' + btn(p, b); }
  if (p.kind === 'launch') { kind = 'Out Dec 4'; price = `<p class="gg-price"><b>${money(p.launch)}</b><span class="gg-basis">${esc(`retailer launch price, in stores ${longDay(p.launchDate)} (${p.source}). Not a sale.`)}</span><span class="gg-tag">${esc(`Not enough dated sales yet as of ${longDay(cfg.read)}.`)}</span></p>`; buy = '\n        ' + btn(p, b); }
  if (p.kind === 'link') { kind = 'Cards'; price = `<p class="gg-price"><span class="gg-basis">${esc(p.text)}</span></p>`; }
  const sub = p.what;
  return `
      <li class="gg-pick">
        <span class="gg-kind">${kind}</span>
        <h3 class="gg-name">${esc(p.name)}</h3>
        <p class="gg-what">${esc(sub)}</p>
        ${price}${buy}${more}
      </li>`;
}
const band = (b) => `
  <div class="gg-band" id="band-${b.id}">
    <h2>${esc(b.h2)}</h2>
    <p class="gg-note">${esc(b.note)}</p>
    <ul class="gg-grid">${b.rows.map((p) => row(p, b)).join('')}
    </ul>
  </div>`;

const R = Object.fromEntries(cfg.bands.flatMap((b) => b.rows).map((p) => [p.id, p]));
const priced = cfg.bands.flatMap((b) => b.rows).filter((p) => p.kind === 'sealed');
const cheapest = priced.reduce((a, p) => (p.price < a.price ? p : a));
const blisters = priced.filter((p) => /3-Pack Blister/.test(p.name));
const bl = [Math.min(...blisters.map((p) => p.price)), Math.max(...blisters.map((p) => p.price))];
const answer = `Sold prices, read ${day(cfg.read)}: a ${cheapest.name} goes for ${money(cheapest.price)}, a ${R['30-pack'].name} ${money(R['30-pack'].price)}, a ${R['pe-pack'].name} ${money(R['pe-pack'].price)}, and a 3-Pack Blister ${bl[0] === bl[1] ? money(bl[0]) : money(bl[0]) + ' to ' + money(bl[1])}.`;

const block = `<!-- STUFF:START — generated by tools/build-stocking-stuffers.mjs from data/stocking-stuffers.json. Do not hand-edit. -->
    <p class="q-answer gg-answer">${esc(answer)}</p>
    <p class="gg-jump">${cfg.bands.map((b) => `<a href="#band-${b.id}">${esc(b.label)}</a>`).join(' · ')}</p>
${cfg.bands.map(band).join('\n')}
  <p class="gg-call">These are what each item sells for right now. A price here is not a call on where it goes next. Check the photos before you pay.</p>
  <p class="gg-src">Every price is a median of the completed eBay sales PriceCharting lists for that exact product, read ${longDay(cfg.read)}, counting sales from the 30 days before. A sale counts only when its title names its own set and no other. Left out: packs sold by weight or marked "heavy", lots and multiples, blisters or tins filed as a single pack, other languages, damaged or opened product. A row with fewer than 3 sales is not printed. The ex Tin price is a retailer launch price, not a sale. The eBay buttons open live listings. Those are asks, and they can sit above or below these numbers. Next re-read: ${cfg.remark.map(longDay).join(' and ')}.</p>
<!-- STUFF:END -->`;

const faq = {
  '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
    { '@type': 'Question', name: 'What Pokémon cards make good stocking stuffers under $25?', acceptedAnswer: { '@type': 'Answer', text: answer + ' Each price is a median of completed eBay sales, with the sale count shown on the page.' } },
    ...cfg.bands.map((b) => ({ '@type': 'Question', name: `What Pokémon stocking stuffers cost ${b.label.replace(/^Under/, 'under').replace(/^\$/, '$')}?`, acceptedAnswer: { '@type': 'Answer', text: b.rows.map((p) => p.kind === 'sealed' ? `${p.name}: ${money(p.price)}, ${basis(p)}` : p.kind === 'perpack' ? `${p.name}: ${money(p.price)} a pack (${money(p.whole)} ÷ ${p.packs}), ${basis(p)}` : p.kind === 'launch' ? `${p.name}: ${money(p.launch)} retailer launch price, in stores ${longDay(p.launchDate)}; not enough dated sales yet` : `${p.name}: ${p.text}`).join('; ') + '.' } })),
  ],
};
const ld = `<!-- STUFFLD:START — generated by tools/build-stocking-stuffers.mjs. Do not hand-edit. -->
  <script type="application/ld+json">
  ${JSON.stringify(faq)}
  </script>
  <!-- STUFFLD:END -->`;

let html = fs.readFileSync(PAGE, 'utf8');
const swap = (src, name, body) => {
  const re = new RegExp(`<!-- ${name}:START[\\s\\S]*?<!-- ${name}:END -->`);
  if (!re.test(src)) throw new Error(`${name} markers missing in ${cfg.slug}.html`);
  return src.replace(re, () => body);
};
html = swap(swap(html, 'STUFFLD', ld), 'STUFF', block);
html = html.replace(/(<span data-prices-updated=")[^"]*(">)[^<]*(<\/span>)/, `$1${cfg.read}$2Sold prices read ${longDay(cfg.read)} · next re-read ${longDay(cfg.remark[0])}$3`);
if (DRY) { console.log(block); process.exit(0); }
fs.writeFileSync(PAGE, html);
console.log(`stocking stuffers: ${cfg.bands.reduce((a, b) => a + b.rows.length, 0)} rows in ${cfg.bands.length} bands -> ${cfg.slug}.html`);
