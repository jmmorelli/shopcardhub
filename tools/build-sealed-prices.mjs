#!/usr/bin/env node
// build-sealed-prices.mjs — /pokemon-booster-box-prices (Deal Hunter, Goal League S1, Nov 3 2026 PT).
//
// Reads data/sealed-prices.json (booster boxes, Elite Trainer Boxes and booster bundles for the sets we index, each with
// our dated SOLD mark + sale count) and writes two generated blocks into pokemon-booster-box-prices.html:
//   <!-- SEALEDLD:START --> … <!-- SEALEDLD:END -->   JSON-LD (FAQPage: what each product type sells for)
//   <!-- SEALED:START --> … <!-- SEALED:END -->       answer line + the three tables + the source line
// Never hand-edit inside the markers: change the JSON, re-run this tool. Idempotent.
//
// Per pack = the sold median divided by the product's pack count (36 / 9 / 6, Pokémon KB 02 §4). It is arithmetic on
// our own mark, not a second price. Links: one standard eBay search link per row in the house format (campid, mkevt=1,
// customid=<page slug>, rel="sponsored", visible "eBay" label). The price is a sold median, never an ask.
//
// Usage: node tools/build-sealed-prices.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'data/sealed-prices.json'), 'utf8'));
const PAGE = path.join(REPO, cfg.slug + '.html');
const EPN = 'LH_BIN=1&mkevt=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (x) => '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const longDay = (iso) => day(iso) + ', ' + iso.slice(0, 4);
const ebay = (p) => {
  const q = encodeURIComponent(p.q.replace(/\s+/g, ' ').trim()).replace(/'/g, '%27');
  return `https://www.ebay.com/sch/i.html?_nkw=${q}${p.cat ? '&_sacat=' + p.cat : ''}&${EPN}&customid=${cfg.slug}`;
};
// window = first and last sale counted (Nov 6 2026: the source lists the most recent sales, so a liquid product's 30 days is often one week)
const basis = (p) => p.from ? `median of ${p.n} eBay sales, ${p.from === p.asOf ? day(p.asOf) : day(p.from) + '–' + day(p.asOf)}` : `median of ${p.n} sales, 30 days to ${day(p.asOf)}`;

// sanity: every row carries a mark, a count >= 3 and a date; tables run high to low
const all = [];
for (const g of cfg.groups) {
  if (!(g.packs > 0)) throw new Error('group without a pack count: ' + g.id);
  g.products.forEach((p, i) => {
    if (!(p.price > 0) || !(p.n >= 3) || p.basis !== '30d' || !/^\d{4}-\d{2}-\d{2}$/.test(p.asOf)) throw new Error('row without a dated sold mark: ' + p.id);
    if (!p.q) throw new Error('row without an eBay query: ' + p.id);
    if (i && p.price > g.products[i - 1].price) throw new Error('rows out of order (high to low): ' + p.id);
    p.perPack = p.price / g.packs;
    all.push({ ...p, group: g });
  });
}
const byId = Object.fromEntries(all.map((p) => [p.id, p]));
const cheapest = [...all].sort((a, b) => a.perPack - b.perPack)[0];

const ans = cfg.answer.map((id) => byId[id]);
if (ans.some((p) => !p)) throw new Error('answer names a row that does not exist');
const answer = `eBay sold prices to ${day(cfg.read)}: a ${ans[0].name} sells for ${money(ans[0].price)}, a ${ans[1].name} ${money(ans[1].price)}, a ${ans[2].name} ${money(ans[2].price)} and a ${ans[3].name} ${money(ans[3].price)}.`;
const hook = `A listing under these numbers is under what buyers have been paying. The lowest cost per pack here is the ${cheapest.name}, ${money(cheapest.perPack)} a pack.`;

const row = (p, g) => `      <li class="sp-row">
        <div class="sp-nm"><h3>${esc(p.name)}</h3><span class="sp-b">${esc(basis(p))} · ${money(p.perPack)} a pack</span></div>
        <b class="sp-px">${money(p.price)}</b>
        <a class="btn-primary sp-buy" href="${esc(ebay(p))}" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${cfg.slug}-${p.id}',band:'${g.id}',page:location.pathname})">Check eBay listings ›</a>
        <a class="sp-more" href="${p.href}">${esc(p.set)} index ›</a>
      </li>`;

const groupNote = (g) => {
  const what = g.id === 'booster-box' ? '36 booster packs' : g.id === 'elite-trainer-box' ? '9 booster packs plus sleeves, dice, markers and a promo card' : g.id === 'pokemon-center-etb' ? '11 booster packs plus a promo card with the Pokémon Center stamp, sleeves, dice and markers' : '6 booster packs and nothing else';
  const msrp = g.id === 'pokemon-center-etb' ? ` Pokémon Center sells this edition itself, for ${money(g.msrp)} at launch.` : g.id === 'elite-trainer-box' ? ` A new one retails for ${money(g.msrp)}.` : g.id === 'booster-bundle' ? ` A Mega Evolution era bundle retails for ${money(g.msrp)}.` : ' The Pokémon Company doesn\'t publish a booster box retail price.';
  return `Each one holds ${what}.${msrp} Highest sold price first.`;
};

const jump = cfg.groups.map((g) => `<a href="#${g.id}">${esc(g.label)}</a>`).join(' · ');

// Black Friday week (BET-20261116-1, CEO Desk Nov 16 2026; Deal Hunter Nov 17 PT). One block above the tables. Its rows come
// from data/black-friday.json only (no second source): each booster box and Pokémon Center ETB that has a dated retailer
// Black Friday price shows that price, labelled as a store's asking price and never linked, beside the same product's
// eBay sold median with n and the first-last sale dates. Until a dated ad exists the block is one line with the check date.
const bf = JSON.parse(fs.readFileSync(path.join(REPO, 'data/black-friday.json'), 'utf8'));
const BF_GROUPS = ['booster-box', 'pokemon-center-etb'];
const bfRows = bf.groups.filter((g) => BF_GROUPS.includes(g.id)).flatMap((g) => g.products.filter((p) => p.bf).map((p) => ({ ...p, group: g })));
for (const p of bfRows) {
  if (!(p.bf.price > 0) || !p.bf.retailer || !/^\d{4}-\d{2}-\d{2}$/.test(p.bf.seen) || !(p.n >= 3) || !/^\d{4}-\d{2}-\d{2}$/.test(p.asOf)) throw new Error('Black Friday row without a dated ad or a dated sold median: ' + p.id);
}
const bfSpan = (p) => (p.from === p.asOf ? day(p.asOf) : `${day(p.from)}–${day(p.asOf)}`);
const bfRow = (p) => `      <li class="sp-row">
        <div class="sp-nm"><h3>${esc(p.name)}</h3><span class="sp-b">Black Friday price ${money(p.bf.price)}: advertised by ${esc(p.bf.retailer)}, seen ${day(p.bf.seen)}. That is a store's asking price, not a sale.</span><span class="sp-b">Sold on eBay: median of ${p.n} sales, ${bfSpan(p)}</span></div>
        <b class="sp-px">${money(p.price)}</b>
        <a class="btn-primary sp-buy" href="${esc(ebay(p))}" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${cfg.slug}-bf-${p.id}',band:'black-friday',page:location.pathname})">Check eBay listings ›</a>
      </li>`;
// With no ad yet the block is one line and no heading: an h2 here would sit above the first eBay row and put the page's
// first eBay link two h2s deep (site-auditor §15). With rows, the h2 is followed by the rows' own eBay buttons.
const bfBlock = `
  <div class="sp-group sp-bfw" id="black-friday-week">
${bfRows.length ? `    <h2>Black Friday week</h2>
    <p class="sp-note">Store prices for Black Friday ${longDay(bf.bfDate)}, each next to what the same box sold for on eBay. Last checked ${day(bf.checked)}.</p>
    <ul class="sp-list">
${bfRows.map(bfRow).join('\n')}
    </ul>` : `    <p class="sp-note"><b>Black Friday is Fri, Nov 27, 2026.</b> No store has posted a Black Friday price for a booster box or a Pokémon Center ETB yet. We last checked on ${longDay(bf.checked)} and will look again ${day(bf.remark)}. When a price shows up, it goes here next to what the same box sold for on eBay.</p>`}
    <p class="sp-note">Black Friday is ${longDay(bf.bfDate)}. ETBs, bundles and the 30th Celebration collections are on <a href="/${bf.slug}">Pokémon Black Friday 2026 prices</a>, with launch prices.</p>
  </div>`;
const block = `<!-- SEALED:START — generated by tools/build-sealed-prices.mjs from data/sealed-prices.json. Do not hand-edit. -->
    <p class="q-answer sp-answer">${esc(answer)}</p>
    <p class="sp-hook">${esc(hook)}</p>
    <p class="sp-jump">${jump}</p>
${bfBlock}
${cfg.groups.map((g) => `
  <div class="sp-group" id="${g.id}">
    <h2>${esc(g.h2)}</h2>
    <p class="sp-note">${esc(groupNote(g))}</p>
    <ul class="sp-list">
${g.products.map((p) => row(p, g)).join('\n')}
    </ul>
  </div>`).join('\n')}

  <p class="sp-call">These are what each product has sold for. A price here is not a call on where it goes next. Check the photos for a sealed wrap before you pay.</p>
  <p class="sp-src">Every price is the median of the most recent completed eBay sales for that exact sealed product, read ${longDay(cfg.read)} from PriceCharting's sales list, with the sale count and the dates of the first and last sale counted on each row. A sale has to name its own set, and no other set, in its title. Pokémon Center editions count only in their own table, and only when the title says so. Sales from other marketplaces, multi-box lots and combos, half boxes, graded copies, damaged wrap and opened product are left out, and so are products whose sales looked mixed with other editions. The eBay buttons open live listings. Those are asks, and they can sit above or below these numbers.</p>
<!-- SEALED:END -->`;

const faq = [
  { '@type': 'Question', name: 'How much is a Pokémon booster box, Elite Trainer Box or booster bundle?', acceptedAnswer: { '@type': 'Answer', text: answer + ' Each price is a median of completed eBay sales with the sale count shown on the page.' } },
  ...cfg.groups.map((g) => ({ '@type': 'Question', name: `What do ${g.id === 'pokemon-center-etb' ? 'Pokémon Center Elite Trainer Boxes' : 'Pokémon ' + (g.id === 'elite-trainer-box' ? g.label : g.label.toLowerCase())} sell for?`, acceptedAnswer: { '@type': 'Answer', text: g.products.map((p) => `${p.name}: ${money(p.price)}, ${basis(p)}`).join('; ') + '.' } })),
];
const ld = `<!-- SEALEDLD:START — generated by tools/build-sealed-prices.mjs. Do not hand-edit. -->
  <script type="application/ld+json">
  ${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq })}
  </script>
  <!-- SEALEDLD:END -->`;

let html = fs.readFileSync(PAGE, 'utf8');
const swap = (h, name, rep) => {
  const re = new RegExp(`<!-- ${name}:START[\\s\\S]*?<!-- ${name}:END -->`);
  if (!re.test(h)) throw new Error('marker block missing: ' + name);
  return h.replace(re, () => rep);
};
html = swap(swap(html, 'SEALEDLD', ld), 'SEALED', block);
html = html.replace(/data-prices-updated="[^"]*"/, `data-prices-updated="${cfg.read}"`);
html = html.replace(/(<span data-prices-updated="[^"]*">)[^<]*(<\/span>)/, `$1Sold prices read ${longDay(cfg.read)}$2`);
html = html.replace(/data-deal-tk="[^"]*"/, `data-deal-tk="${cfg.dealTk}"`);
// Night Crew Nov 11 (desk route, Ivan Nov 10): the deals block on this sealed page lists sealed rows only, never singles.
if (!/data-deal-grades=/.test(html)) html = html.replace(/(data-deal-tk="[^"]*")/, '$1 data-deal-grades="sealed"');
if (DRY) console.log(block.slice(0, 1200));
else fs.writeFileSync(PAGE, html);
console.log(`build-sealed-prices: ${all.length} rows in ${cfg.groups.length} tables, read ${cfg.read}${DRY ? ' (dry)' : ''} -> ${path.relative(REPO, PAGE)}`);
