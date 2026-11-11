#!/usr/bin/env node
// build-black-friday.mjs — /pokemon-black-friday-2026 (Deal Hunter, Goal League S1; BET-20261107-1, Nov 8 2026 PT).
//
// Reads data/black-friday.json (the sealed products people give as presents: Elite Trainer Boxes, booster bundles,
// booster boxes and the 30th Celebration Ultra-Premium Collections, each with our dated SOLD median + sale count) and
// writes two generated blocks into pokemon-black-friday-2026.html:
//   <!-- BFLD:START --> … <!-- BFLD:END -->   JSON-LD (FAQPage: the dated answer)
//   <!-- BF:START --> … <!-- BF:END -->       answer line + one table per product type + the source line
// Never hand-edit inside the markers: change the JSON, re-run this tool. Idempotent. Touches no other page.
//
// Each row: eBay sold median with n and first–last sale dates · the US launch price, labelled as a launch price
// (never "MSRP") · per pack (arithmetic on our mark) · a Black Friday cell that says no price has been seen yet as of
// the check date until a dated retailer ad shows one, then "advertised, <retailer>, seen <date>" (an ask, never linked)
// with gap = sold median − advertised, arithmetic only. Links: one eBay search link per row, house format (campid,
// mkevt=1, customid=<slug>-<nn>, rel="sponsored", visible "eBay" label). No retailer links.
//
// Usage: node tools/build-black-friday.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'data/black-friday.json'), 'utf8'));
const PAGE = path.join(REPO, cfg.slug + '.html');
const EPN = 'LH_BIN=1&mkevt=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (x) => '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const longDay = (iso) => day(iso) + ', ' + iso.slice(0, 4);
const span = (a, b) => (a === b ? day(a) : `${day(a)}–${day(b)}`);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

let seq = 0;
const link = (p) => {
  const nn = String(++seq).padStart(2, '0');
  const q = encodeURIComponent(p.q.replace(/\s+/g, ' ').trim()).replace(/'/g, '%27');
  const href = `https://www.ebay.com/sch/i.html?_nkw=${q}${p.cat ? '&_sacat=' + p.cat : ''}&${EPN}&customid=${cfg.slug}-${nn}`;
  return `<a class="btn-primary sp-buy" href="${esc(href)}" target="_blank" rel="sponsored nofollow noopener" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${cfg.slug}-${nn}',band:'${p.group}',page:location.pathname})">Check eBay listings ›</a>`;
};

// sanity: every printed price is a dated median of >= 3 eBay sales; tables run high to low; a Black Friday price is dated
const all = [];
for (const g of cfg.groups) {
  if (!(g.packs > 0) || !g.launch || !(g.launch.price > 0)) throw new Error('group without packs or launch price: ' + g.id);
  g.products.forEach((p, i) => {
    if (!(p.price > 0) || !(p.n >= 3) || !ISO.test(p.from) || !ISO.test(p.asOf)) throw new Error('row without a dated sold median: ' + p.id);
    if (!p.q) throw new Error('row without an eBay query: ' + p.id);
    if (i && p.price > g.products[i - 1].price) throw new Error('rows out of order (high to low): ' + p.id);
    if (p.bf && !(p.bf.price > 0 && p.bf.retailer && ISO.test(p.bf.seen))) throw new Error('Black Friday price without retailer and date: ' + p.id);
    p.group = g.id;
    all.push(p);
  });
}
if (!ISO.test(cfg.read) || !ISO.test(cfg.checked)) throw new Error('read/checked date missing');
const byId = Object.fromEntries(all.map((p) => [p.id, p]));
const ans = cfg.answer.map((id) => byId[id]);
if (ans.some((p) => !p)) throw new Error('answer names a row that does not exist');
const seen = all.filter((p) => p.bf);

const answer = `eBay sold prices to ${day(cfg.read)}: a ${ans[0].name} sold for a median ${money(ans[0].price)} on ${ans[0].n} sales (${span(ans[0].from, ans[0].asOf)}), a ${ans[1].name} ${money(ans[1].price)} on ${ans[1].n}, a ${ans[2].name} ${money(ans[2].price)} on ${ans[2].n} and a ${ans[3].name} ${money(ans[3].price)} on ${ans[3].n}.`;
const status = seen.length
  ? `We've seen a Black Friday price on ${seen.length} of the ${all.length} products below so far (last checked ${day(cfg.checked)}). Each one sits next to what the same product sold for.`
  : `No store's Black Friday price for any of these had shown up when we last checked, on ${longDay(cfg.checked)}. When one does, it goes next to what the same product sold for.`;
const hook = `Black Friday is ${longDay(cfg.bfDate)}. ${status} We re-mark this page ${day(cfg.remark)}.`;

const bfCell = (p) => {
  if (!p.bf) return `<span class="bf-ad bf-none">Black Friday price: none seen yet as of ${esc(day(cfg.checked))}</span>`;
  const gap = p.price - p.bf.price;
  const gapTxt = Math.abs(gap) < 0.005 ? 'the same as the sold median' : `${money(Math.abs(gap))} ${gap > 0 ? 'under' : 'over'} the sold median`;
  return `<span class="bf-ad">Black Friday price ${money(p.bf.price)}: advertised, ${esc(p.bf.retailer)}, seen ${esc(day(p.bf.seen))}. That is ${gapTxt}.</span>`;
};
const launchTxt = (g) => g.launch.note.startsWith('no published') ? `Launch: ${g.launch.note} = ${money(g.launch.price)}` : `${g.launch.note[0].toUpperCase() + g.launch.note.slice(1)} ${money(g.launch.price)}`;
// a row with launch: null prints no launch line (sets older than the launch prices the Pokémon KB holds)
const launchSpan = (p, g) => (p.launch === null ? '' : `<span class="sp-b bf-launch">${esc(launchTxt(g))}</span>`);

const row = (p, g) => `      <li class="sp-row bf-row">
        <div class="sp-nm"><h3>${esc(p.name)}</h3><span class="sp-b">median of ${p.n} eBay sales, ${span(p.from, p.asOf)} · ${money(p.price / g.packs)} a pack</span>${launchSpan(p, g)}${bfCell(p)}</div>
        <b class="sp-px">${money(p.price)}</b>
        ${link(p)}
        <a class="sp-more" href="${p.href}">${esc(p.set)} ${p.href.endsWith('-index') ? 'index' : 'guide'} ›</a>
      </li>`;

const groupNote = (g) => {
  const what = { 'elite-trainer-box': '9 booster packs plus sleeves, dice, markers and a promo card', 'booster-bundle': '6 booster packs and nothing else', 'pokemon-center-etb': '11 booster packs plus a promo card with the Pokémon Center stamp, sleeves, dice and markers. Pokémon Center sells this edition itself', 'booster-box': '36 booster packs', upc: g.packNote || g.packs + ' packs' }[g.id] || g.packs + ' packs';
  return `Each one holds ${what}. Per pack counts ${g.packs} packs. Highest sold price first.`;
};

const jump = cfg.groups.map((g) => `<a href="#${g.id}">${esc(g.label)}</a>`).join(' · ');
const block = `<!-- BF:START — generated by tools/build-black-friday.mjs from data/black-friday.json. Do not hand-edit. -->
    <p class="q-answer sp-answer">${esc(answer)}</p>
    <p class="sp-hook">${esc(hook)}</p>
    <p class="sp-jump">${jump}</p>
${cfg.groups.map((g) => `
  <div class="sp-group" id="${g.id}">
    <h2>${esc(g.h2)}</h2>
    <p class="sp-note">${esc(groupNote(g))}</p>
    <ul class="sp-list">
${g.products.map((p) => row(p, g)).join('\n')}
    </ul>
  </div>`).join('\n')}

  <p class="sp-call">These are what each product has sold for. A price here is not a call on where it goes next. Check the photos for a sealed wrap before you pay.</p>
  <p class="sp-src">Every sold price is the median of the most recent completed eBay sales for that exact sealed product, read ${longDay(cfg.read)} from PriceCharting's sales list, with the sale count and the dates of the first and last sale counted. A sale has to name its own set, and no other set, in its title. Pokémon Center editions count only in their own table, and only when the title says so. Sales from other marketplaces, multi-box lots and combos, half boxes, graded copies, sleeved packs, blisters, damaged wrap and opened product are left out. Launch prices are US launch prices, not sale prices. A Black Friday price is what a store advertised, with the store and the date we saw it. It is an asking price, and we don't link to it. The eBay buttons open live listings. Those are asks too, and they can sit above or below these numbers.</p>
<!-- BF:END -->`;

const faq = [
  { '@type': 'Question', name: 'What do Pokémon Elite Trainer Boxes, booster bundles and booster boxes sell for before Black Friday 2026?', acceptedAnswer: { '@type': 'Answer', text: answer + ' Each price is a median of completed eBay sales, with the sale count shown on the page.' } },
  { '@type': 'Question', name: 'Has any store announced a Black Friday 2026 price for Pokémon boxes?', acceptedAnswer: { '@type': 'Answer', text: status } },
  ...cfg.groups.map((g) => ({ '@type': 'Question', name: `What do ${{ upc: 'the 30th Celebration Ultra-Premium Collections', 'pokemon-center-etb': 'Pokémon Center Elite Trainer Boxes', 'elite-trainer-box': 'Pokémon Elite Trainer Boxes' }[g.id] || 'Pokémon ' + g.label.toLowerCase()} sell for?`, acceptedAnswer: { '@type': 'Answer', text: g.products.map((p) => `${p.name}: ${money(p.price)}, median of ${p.n} eBay sales, ${span(p.from, p.asOf)}`).join('; ') + '.' } })),
];
const ld = `<!-- BFLD:START — generated by tools/build-black-friday.mjs. Do not hand-edit. -->
  <script type="application/ld+json">
  ${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq })}
  </script>
  <!-- BFLD:END -->`;

let html = fs.readFileSync(PAGE, 'utf8');
const swap = (h, name, rep) => {
  const re = new RegExp(`<!-- ${name}:START[\\s\\S]*?<!-- ${name}:END -->`);
  if (!re.test(h)) throw new Error('marker block missing: ' + name);
  return h.replace(re, () => rep);
};
html = swap(swap(html, 'BFLD', ld), 'BF', block);
html = html.replace(/data-prices-updated="[^"]*"/, `data-prices-updated="${cfg.read}"`);
html = html.replace(/(<span data-prices-updated="[^"]*">)[^<]*(<\/span>)/, `$1Sold prices read ${longDay(cfg.read)}$2`);
html = html.replace(/data-deal-tk="[^"]*"/, `data-deal-tk="${cfg.dealTk}"`);
if (DRY) console.log(block.slice(0, 2000));
else fs.writeFileSync(PAGE, html);
console.log(`build-black-friday: ${all.length} rows in ${cfg.groups.length} tables · ${seq} eBay links · ${seen.length} Black Friday prices seen · read ${cfg.read}${DRY ? ' (dry)' : ''}`);
