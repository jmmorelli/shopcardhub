#!/usr/bin/env node
// build-vs-sold.mjs — set-vs-set sold comparison pages (Deal Hunter, Goal League S1; first page /delta-reign-vs-pitch-black,
// BET-20261104-1, Nov 5 2026 PT).
//
// Reads data/vs/<slug>.json (sealed box / ETB / bundle and the top chase cards on each side, every price a dated SOLD median
// with its sale count and the dates of the first and last sale counted) and writes two generated blocks into <slug>.html:
//   <!-- VSLD:START --> … <!-- VSLD:END -->   JSON-LD (FAQPage: the dated answer)
//   <!-- VS:START --> … <!-- VS:END -->       answer line, sealed side-by-side, chase lists, source line
// Never hand-edit inside the markers: change the JSON, re-run this tool. Idempotent. Touches no other page.
//
// A row with fewer than 3 sales prints "Not enough dated sales yet" with each sale listed and the retail launch price,
// labelled as a launch price (never "MSRP"). Per pack = sold median ÷ pack count: arithmetic on our mark, not a second price.
// Links: one eBay search link per cell in the house format (campid, mkevt=1, customid=<slug>-<nn>, rel="sponsored", visible
// "eBay" label). The eBay link opens live listings (asks); the printed number is always a sale.
//
// Usage: node tools/build-vs-sold.mjs --page <slug> [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SLUG = args.includes('--page') ? args[args.indexOf('--page') + 1] : null;
const DRY = args.includes('--dry');
if (!SLUG || !/^[a-z0-9-]+$/.test(SLUG)) { console.error('usage: node tools/build-vs-sold.mjs --page <slug> [--dry]'); process.exit(2); }
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, 'data/vs', SLUG + '.json'), 'utf8'));
const PAGE = path.join(REPO, SLUG + '.html');
const EPN = 'LH_BIN=1&mkevt=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (x) => '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const longDay = (iso) => day(iso) + ', ' + iso.slice(0, 4);
const span = (a, b) => (a === b ? day(a) : `${day(a)}–${day(b)}`);
const L = cfg.left, R = cfg.right;

let seq = 0;
const link = (q, cat, label = 'Check eBay listings ›', cls = 'btn-primary vs-buy') => {
  const nn = String(++seq).padStart(2, '0');
  const href = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q.replace(/\s+/g, ' ').trim()).replace(/'/g, '%27')}&_sacat=${cat}&${EPN}&customid=${cfg.slug}-${nn}`;
  return `<a class="${cls}" href="${esc(href)}" target="_blank" rel="sponsored nofollow noopener" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${cfg.slug}-${nn}',page:location.pathname})">${label}</a>`;
};

// sanity: a printed price is a dated median of >= 3 sales; anything else lists its sales
const check = (c, where) => {
  if (c.price != null && !(c.price > 0 && c.n >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(c.from) && /^\d{4}-\d{2}-\d{2}$/.test(c.to))) throw new Error('price without a dated sold median: ' + where);
  if (c.price == null && !(Array.isArray(c.sales) && c.sales.length === c.n)) throw new Error('thin row without its sales listed: ' + where);
  if (!c.q) throw new Error('row without an eBay query: ' + where);
};
cfg.sealed.forEach((s) => { check(s.left, s.id + '/left'); check(s.right, s.id + '/right'); });
['left', 'right'].forEach((k) => cfg.chase[k].forEach((c, i) => { check(c, 'chase/' + k + '/' + i); if (i && c.price > cfg.chase[k][i - 1].price) throw new Error('chase out of order: ' + k + ' ' + i); }));

const box = cfg.sealed.find((s) => s.id === 'box');
const pp = (c, packs) => (c.price != null ? c.price / packs : null);
const sum = (k) => cfg.chase[k].reduce((a, c) => a + c.price, 0);
const topL = cfg.chase.left[0], topR = cfg.chase.right[0];
// after the left set's street date the left numbers are release-day-on sales; `pre` keeps the presale read for the before/after line
const AFTER = cfg.read >= L.release;
const answer = `eBay sold prices to ${day(cfg.read)}: a ${box.left.name} sold for a median ${money(box.left.price)} on ${box.left.n} ${AFTER ? 'sales since its ' + day(L.release) + ' release' : L.phase + ' sales'}, a ${box.right.name} ${money(box.right.price)} on ${box.right.n}. That works out to ${money(pp(box.left, 36))} a pack against ${money(pp(box.right, 36))}. ${L.set}'s top chase, ${topL.name} ${topL.num}, sits at ${money(topL.price)}; ${R.set}'s, ${topR.name} ${topR.num}, at ${money(topR.price)}.`;
const hook = AFTER && box.left.pre && box.left.pre.price != null
  ? `${L.set} came out ${longDay(L.release)}. Before release its booster box sold for a median ${money(box.left.pre.price)} on ${box.left.pre.n} presale sales; since release, ${money(box.left.price)} on ${box.left.n}. We re-mark this page ${day(cfg.remark)}. A listing under these numbers is under what buyers have been paying.`
  : `${L.set} streets ${longDay(L.release)}, so its numbers so far are ${L.phase} sales and can move fast once boxes are opened. We re-mark this page ${day(cfg.remark)}. A listing under these numbers is under what buyers have been paying.`;

const cell = (c, s, set) => {
  const packs = s.packs;
  let px, b;
  if (c.price != null) {
    px = `<b class="vs-px">${money(c.price)}</b>`;
    b = `median of ${c.n} eBay sales, ${span(c.from, c.to)} · ${money(c.price / packs)} a pack`;
  } else {
    px = `<b class="vs-px vs-thin">Not enough dated sales yet</b>`;
    b = `${c.n} ${c.n === 1 ? 'sale' : 'sales'} so far: ` + c.sales.map(([d, p]) => `${money(p)} (${day(d)})`).join(', ');
  }
  const extra = [];
  if (c.latest && c.price != null) extra.push(`Latest sale ${day(c.latest[0])}: ${money(c.latest[1])}.`);
  if (c.pre && AFTER) extra.push(c.pre.price != null ? `Before release: ${money(c.pre.price)}, median of ${c.pre.n} presale sales, ${span(c.pre.from, c.pre.to)}.` : `Before release: ${c.pre.n} presale ${c.pre.n === 1 ? 'sale' : 'sales'}, ` + c.pre.sales.map(([d, p]) => `${money(p)} (${day(d)})`).join(', ') + '.');
  if (c.launch != null) extra.push(`${AFTER ? '' : `Since the ${day(L.release)} release: ${c.post >= 3 ? c.post + ' sales' : 'not enough dated sales yet'}. `}US retail launch price ${money(c.launch)}${c.launchNote ? ' (' + c.launchNote + ')' : ''}.`);
  return `      <div class="vs-side">
        <span class="vs-set">${esc(set)}</span>
        ${px}
        <span class="vs-b">${esc(b)}</span>${extra.length ? `\n        <span class="vs-b2">${esc(extra.join(' '))}</span>` : ''}
        ${link(c.q, s.cat)}
      </div>`;
};
const edge = (s) => {
  const a = pp(s.left, s.packs), b = pp(s.right, s.packs);
  if (a == null || b == null) return `Per pack: ${b != null ? R.set + ' ' + money(b) : ''}${a == null ? '; ' + L.set + ' has too few sales to divide yet.' : ''}`;
  const d = Math.abs(a - b);
  if (d < 0.005) return `Per pack: the same, ${money(a)}.`;
  return `Per pack: ${money(a)} vs ${money(b)}. ${a > b ? L.set : R.set} costs ${money(d)} more per pack.`;
};
const sealedRow = (s) => `    <div class="vs-row" id="${s.id}">
      <h3>${esc(s.label)}<span>${s.packs} packs</span></h3>
${cell(s.left, s, L.set)}
${cell(s.right, s, R.set)}
      <p class="vs-edge">${esc(edge(s))}</p>
    </div>`;
const chaseRow = (c, i) => `        <li class="vs-c">
          <span class="vs-rk">${i + 1}</span>
          <div class="vs-cn"><h4>${esc(c.name)} ${esc(c.num)}</h4><span class="vs-b">${esc(c.rarity)} · median of ${c.n} eBay sales, ${span(c.from, c.to)}</span></div>
          <b class="vs-cpx">${money(c.price)}</b>
          ${link(c.q, '183454', 'eBay ›', 'vs-clink')}
        </li>`;
const chaseCol = (k, side) => `    <div class="vs-col">
      <h3>${esc(side.set)}<span>top ${cfg.chase[k].length} · ${money(sum(k))} for one of each</span></h3>
      <ol class="vs-clist">
${cfg.chase[k].map(chaseRow).join('\n')}
      </ol>
      <a class="vs-more" href="${side.href}">${esc(side.set)} index ›</a>
    </div>`;

const block = `<!-- VS:START — generated by tools/build-vs-sold.mjs from data/vs/${cfg.slug}.json. Do not hand-edit. -->
    <p class="q-answer vs-answer">${esc(answer)}</p>
    <p class="vs-hook">${esc(hook)}</p>
    <p class="vs-jump"><a href="#sealed">Box, ETB and bundle</a> · <a href="#chase">Chase cards</a> · <a href="#how">How we read it</a></p>
    <div class="vs-sec" id="sealed">
    <h2>Booster box, Elite Trainer Box and bundle: what each sold for</h2>
    <p class="vs-note">${esc(L.set)} on the left, ${esc(R.set)} on the right. Every number is a sale, with the count and the dates of the first and last sale counted.</p>
${cfg.sealed.map(sealedRow).join('\n')}
    </div>
  </div>
</section>

<section class="vs-sec" id="chase">
  <div class="container">
    <h2>The five priciest cards in each set</h2>
    <p class="vs-note">Ungraded copies, ranked by our sold median. ${esc(L.set)}'s top five add up to ${money(sum('left'))} for one of each, ${esc(R.set)}'s to ${money(sum('right'))}.</p>
    <div class="vs-chase">
${chaseCol('left', L)}
${chaseCol('right', R)}
    </div>
    <p class="vs-call">This page compares prices. It is not a call on which set to open or buy, or where either one goes next.</p>
    <p class="vs-src">Every price is the median of the most recent completed eBay sales for that exact item, read ${longDay(cfg.read)} from PriceCharting's sales list, with the sale count and the dates of the first and last sale counted. Sales from other marketplaces, multi-box lots, Pokémon Center editions, sleeved packs and blisters, opened product, graded copies and card listings without the card's own number are left out. A sale also has to name its own set, and no other set, in its title, so the counts here can run lower than a table that reads every listed sale. The eBay buttons open live listings. Those are asks, and they can sit above or below these numbers.</p>
<!-- VS:END -->`;

const faq = [
  { '@type': 'Question', name: `Is ${L.set} more expensive than ${R.set}?`, acceptedAnswer: { '@type': 'Answer', text: answer + ` Each price is a median of completed eBay sales, with the sale count shown on the page.` } },
  { '@type': 'Question', name: `What do ${L.set} and ${R.set} chase cards sell for?`, acceptedAnswer: { '@type': 'Answer', text: ['left', 'right'].map((k) => cfg.chase[k].map((c) => `${c.name} ${c.num}: ${money(c.price)} (median of ${c.n} eBay sales, ${span(c.from, c.to)})`).join('; ')).join('. ') + '.' } },
];
const ld = `<!-- VSLD:START — generated by tools/build-vs-sold.mjs. Do not hand-edit. -->
  <script type="application/ld+json">
  ${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq })}
  </script>
  <!-- VSLD:END -->`;

let html = fs.readFileSync(PAGE, 'utf8');
const swap = (h, name, rep) => {
  const re = new RegExp(`<!-- ${name}:START[\\s\\S]*?<!-- ${name}:END -->`);
  if (!re.test(h)) throw new Error('marker block missing: ' + name);
  return h.replace(re, () => rep);
};
html = swap(swap(html, 'VSLD', ld), 'VS', block);
html = html.replace(/data-prices-updated="[^"]*"/, `data-prices-updated="${cfg.read}"`);
html = html.replace(/(<span data-prices-updated="[^"]*">)[^<]*(<\/span>)/, `$1Sold prices read ${longDay(cfg.read)}$2`);
html = html.replace(/data-deal-tk="[^"]*"/, `data-deal-tk="${cfg.dealTk}"`);
if (DRY) console.log(block.slice(0, 2000));
else fs.writeFileSync(PAGE, html);
console.log(`build-vs-sold: ${cfg.slug} · ${cfg.sealed.length} sealed rows · ${cfg.chase.left.length}+${cfg.chase.right.length} chase · ${seq} eBay links · read ${cfg.read}${DRY ? ' (dry)' : ''}`);
