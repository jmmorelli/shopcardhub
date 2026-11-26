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
import { requireSealedTitleRule } from './lib/sealed-title-rule.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'data/black-friday.json'), 'utf8'));
requireSealedTitleRule(cfg, 'data/black-friday.json', 'set'); // O-67
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
// Black Friday week calendar (BET-20261121-1): only sourced dates. remark = this page's own re-read; event = calendar day; release = a dated launch whose source is on the linked page
const cal = cfg.calendar || [];
cal.forEach((c, i) => {
  if (!ISO.test(c.date) || !['remark', 'event', 'release'].includes(c.kind)) throw new Error('calendar row without date/kind: ' + JSON.stringify(c));
  if (c.kind !== 'remark' && !c.text) throw new Error('calendar row without text: ' + c.date);
  if (c.kind === 'release' && !c.href) throw new Error('release row without its sourced page: ' + c.date);
  if (i && c.date < cal[i - 1].date) throw new Error('calendar out of order: ' + c.date);
});
const byId = Object.fromEntries(all.map((p) => [p.id, p]));
const ans = cfg.answer.map((id) => byId[id]);
if (ans.some((p) => !p)) throw new Error('answer names a row that does not exist');
const seen = all.filter((p) => p.bf);

const an = (p) => p.answerName || p.name;
const answer = `eBay sold prices to ${day(cfg.read)}: a ${an(ans[0])} sold for a median ${money(ans[0].price)} on ${ans[0].n} sales (${span(ans[0].from, ans[0].asOf)}), a ${an(ans[1])} ${money(ans[1].price)} on ${ans[1].n}, a ${an(ans[2])} ${money(ans[2].price)} on ${ans[2].n} and a ${an(ans[3])} ${money(ans[3].price)} on ${ans[3].n}.`;

const bfCell = (p) => {
  if (!p.bf) return `<span class="bf-ad bf-none">Black Friday price: not posted by any store as of ${esc(day(cfg.checked))}</span>`;
  const gap = p.price - p.bf.price;
  const gapTxt = Math.abs(gap) < 0.005 ? 'the same as the sold median' : `${money(Math.abs(gap))} ${gap > 0 ? 'under' : 'over'} the sold median`;
  return `<span class="bf-ad">Black Friday price ${money(p.bf.price)} at ${esc(p.bf.retailer)}, seen ${esc(day(p.bf.seen))}: a store's asking price, not a sale. That is ${gapTxt}.</span>`;
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
  const what = { 'elite-trainer-box': '9 booster packs plus sleeves, dice, markers and a promo card. This is the retail edition. The Pokémon Center edition has its own table above', 'booster-bundle': '6 booster packs and nothing else', 'pokemon-center-etb': '11 booster packs plus a promo card with the Pokémon Center stamp, sleeves, dice and markers. Pokémon Center sells this edition itself', 'booster-box': '36 booster packs', upc: g.packNote || g.packs + ' packs' }[g.id] || g.packs + ' packs';
  return `Each one holds ${what}. The per-pack price divides by ${g.packs} packs. Highest sold price first.`;
};

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const wday = (iso) => WD[new Date(iso + 'T12:00:00Z').getUTCDay()];
const FULLMON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WDFULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const aOrAn = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const range = (a, b) => (a.slice(0, 4) === b.slice(0, 4) ? `${day(a)} to ${longDay(b)}` : `${longDay(a)} to ${longDay(b)}`);
const fullDay = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${WDFULL[new Date(iso + 'T12:00:00Z').getUTCDay()]}, ${FULLMON[m - 1]} ${d}, ${y}`; };
const calText = (c) => {
  if (c.kind === 'remark') {
    if (c.date === cfg.read) return 'Sold prices re-read. The prices on this page are from this read.';
    if (c.date < cfg.read) return 'Sold prices re-read.';
    return 'Sold prices re-read, stores checked again.';
  }
  if (c.kind === 'event') return c.text + '.';
  return `${esc(c.text)}. <a href="${esc(c.href)}">Contents and prices ›</a>`;
};
const storeLine = seen.length
  ? `A store has posted a Black Friday price on ${seen.length} of the ${all.length} products below (checked ${longDay(cfg.checked)}). Each one sits next to what the same product sold for, labelled as an asking price.`
  : `No store has posted a Pokémon Black Friday price for any product on this page yet. Checked ${longDay(cfg.checked)}.`;
const calBlock = cal.length ? `
    <div class="bf-cal" id="black-friday-week">
      <h3>Black Friday week, day by day</h3>
      <ol>
${cal.map((c) => `        <li${c.date === cfg.read ? ' class="bf-now"' : ''}><time datetime="${c.date}">${wday(c.date)} ${day(c.date)}</time><span>${c.kind === 'release' ? calText(c) : esc(calText(c))}</span></li>`).join('\n')}
      </ol>
      <p class="bf-cal-note">${esc(storeLine)}</p>
    </div>` : '';

// FAQ (visible + FAQPage JSON-LD): answered only from this page's data; arithmetic, never advice
const topBox = cfg.groups.find((g) => g.id === 'booster-box').products[0];
const drEtb = byId['delta-reign-etb'];
const etbG = cfg.groups.find((g) => g.id === 'elite-trainer-box');
const rel = cal.find((c) => c.kind === 'release');
const remarks = cal.filter((c) => c.kind === 'remark' && c.date > cfg.read).map((c) => `${wday(c.date)} ${day(c.date)}`);
const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const faqQ = [
  ['When is Pokémon Black Friday 2026?', `Black Friday is ${fullDay(cfg.bfDate)}${cfg.cyberMonday ? ', and Cyber Monday is ' + fullDay(cfg.cyberMonday) : ''}. ${storeLine}`],
  [`What has ${aOrAn(topBox.name)} sold for on eBay lately?`, `A median of ${money(topBox.price)} across ${topBox.n} completed eBay sales from ${range(topBox.from, topBox.asOf)}. That is ${money(topBox.price / 36)} a pack.`],
];
if (drEtb && etbG) {
  const lp = etbG.launch.price, d = drEtb.price - lp;
  faqQ.push([`How does the ${drEtb.name} sell compared with its launch price?`, `The retail ${drEtb.name} launched at ${money(lp)}. On eBay it sold for a median of ${money(drEtb.price)} across ${drEtb.n} sales from ${range(drEtb.from, drEtb.asOf)}, which is ${money(Math.abs(d))} (${Math.round(Math.abs(d) / lp * 100)}%) ${d >= 0 ? 'above' : 'below'} launch. The Pokémon Center edition is a different box, with its own launch price and sold median in its own table.`]);
}
if (rel) faqQ.push(['When do the 30th Celebration Binder Collection and ex Tins come out?', `${fullDay(rel.date)}. ${rel.text.replace(/ come out$/, '')} are due that day.`]);
faqQ.push(['How often is this page updated?', `The sold prices were last re-read ${longDay(cfg.read)}.${remarks.length ? ' The next re-reads are ' + list(remarks) + '.' : ''} Each re-read moves the date at the top of the page.`]);
const faqBlock = `
  <div class="sp-group bf-faq" id="faq">
    <h2>Pokémon Black Friday 2026 questions</h2>
${faqQ.map(([q, a]) => `    <h3>${esc(q)}</h3>\n    <p>${esc(a)}</p>`).join('\n')}
  </div>`;

const jump = cfg.groups.map((g) => `<a href="#${g.id}">${esc(g.label)}</a>`).join(' · ') + ' · <a href="#faq">Questions</a>';
const block = `<!-- BF:START — generated by tools/build-black-friday.mjs from data/black-friday.json. Do not hand-edit. -->
    <p class="q-answer sp-answer">${esc(answer)}</p>
${calBlock}
    <p class="sp-hook">Just shopping for a booster box or a Pokémon Center ETB? The same Black Friday check sits at the top of <a href="/pokemon-booster-box-prices#black-friday-week">booster box and ETB sold prices</a>.</p>
    <p class="sp-jump">${jump}</p>
${cfg.groups.map((g) => `
  <div class="sp-group" id="${g.id}">
    <h2>${esc(g.h2)}</h2>
    <p class="sp-note">${esc(groupNote(g))}</p>
    <ul class="sp-list">
${g.products.map((p) => row(p, g)).join('\n')}
    </ul>
  </div>`).join('\n')}

${faqBlock}

  <p class="sp-call">These are what each product has sold for. A price here is not a call on where it goes next. Check the photos for a sealed wrap before you pay.</p>
  <p class="sp-src">Every sold price is the median of the most recent completed eBay sales for that exact sealed product, read ${longDay(cfg.read)} from PriceCharting's sales list, with the sale count and the dates of the first and last sale counted. A sale has to name its own set, and no other set, in its title. Pokémon Center editions count only in their own table, and only when the title says so. Sales from other marketplaces, multi-box lots and combos, half boxes, graded copies, sleeved packs, blisters, damaged wrap and opened product are left out. Launch prices are US launch prices, not sale prices. A Black Friday price is what a store advertised, with the store and the date we saw it. It is an asking price, and we don't link to it. The eBay buttons open live listings. Those are asks too, and they can sit above or below these numbers.</p>
<!-- BF:END -->`;

const faq = [
  ...faqQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  { '@type': 'Question', name: 'What do Pokémon Elite Trainer Boxes, booster bundles and booster boxes sell for before Black Friday 2026?', acceptedAnswer: { '@type': 'Answer', text: answer + ' Each price is a median of completed eBay sales, with the sale count shown on the page.' } },
  ...cfg.groups.map((g) => ({ '@type': 'Question', name: `What do ${{ upc: 'the 30th Celebration Ultra-Premium Collections', 'pokemon-center-etb': 'Pokémon Center Elite Trainer Boxes', 'elite-trainer-box': 'Pokémon Elite Trainer Boxes' }[g.id] || 'Pokémon ' + g.label.toLowerCase()} sell for?`, acceptedAnswer: { '@type': 'Answer', text: g.products.map((p) => `${p.name}: ${money(p.price)}, median of ${p.n} eBay sales, ${span(p.from, p.asOf)}`).join('; ') + '.' } })),
];
const ld = `<!-- BFLD:START — generated by tools/build-black-friday.mjs. Do not hand-edit. -->
  <script type="application/ld+json">
  ${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq })}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: 'Pokémon Black Friday 2026: what each box sells for', url: 'https://www.shopcardhub.com/' + cfg.slug, ...(ISO.test(cfg.published || '') ? { datePublished: cfg.published } : {}), dateModified: cfg.read, author: { '@type': 'Organization', name: 'ShopCardHub', url: 'https://www.shopcardhub.com/' }, publisher: { '@type': 'Organization', name: 'ShopCardHub' } })}
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
html = html.replace(/(<span data-prices-updated="[^"]*">)[^<]*(<\/span>)/, `$1Updated ${longDay(cfg.read)} · sold prices re-read that day$2`);
html = html.replace(/data-deal-tk="[^"]*"/, `data-deal-tk="${cfg.dealTk}"`);
// a sealed-box page lists only sealed deal rows, never singles (desk Nov 13, Ivan Nov 12; same rule as build-sealed-prices DL-2)
if (!/data-deal-grades=/.test(html)) html = html.replace(/(data-deal-tk="[^"]*")/, '$1 data-deal-grades="sealed"');
if (DRY) console.log(block.slice(0, 2000));
else fs.writeFileSync(PAGE, html);
console.log(`build-black-friday: ${all.length} rows in ${cfg.groups.length} tables · ${seq} eBay links · ${seen.length} Black Friday prices seen · read ${cfg.read}${DRY ? ' (dry)' : ''}`);
