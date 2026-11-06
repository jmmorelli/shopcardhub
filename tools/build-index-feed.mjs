#!/usr/bin/env node
// build-index-feed.mjs — AI-Search Hunter (Goal League S1, owner aisearch; Authority: Mo 2026-10-27, Goal League;
// Mo-approved agent-readable-site ruling 2026-10-29, item 2). Writes ONE file, /index-feed.json: every live index's
// level, mark date, base and 1-week / 1-month / 3-month move, with up to five top cards per index (dated sold mark),
// so an assistant or a script can quote a dated number and link the page it came from.
// Reads data/indices.json read-only and checks card-page files exist on disk; no other file is read or written.
// Never in this file: eBay or any marketplace URL, affiliate tags, customids, asks, listing titles, images,
// a price-source name, calls or buy/sell words. A card without a clean dated sold mark is left out, not estimated.
//   node tools/build-index-feed.mjs           write
//   node tools/build-index-feed.mjs --check   exit 1 if /index-feed.json is stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.shopcardhub.com';
const CHECK = process.argv.includes('--check');
const OUT = path.join(ROOT, 'index-feed.json');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/indices.json'), 'utf8'));

// Same held-mark exclusion as /indices and tools/build-aisearch.mjs.
const HELD = { SK03: { '2026-10-15': 1 } };
const DAY = 864e5;
const r2 = v => Math.round(v * 100) / 100;
// Week: the home board's rule (latest mark vs the latest earlier mark at least 5 days back).
function week(hist) {
  const last = hist[hist.length - 1];
  for (let i = hist.length - 2; i >= 0; i--)
    if ((Date.parse(last.date) - Date.parse(hist[i].date)) / DAY >= 5) return { pct: r2((last.level / hist[i].level - 1) * 100), from: hist[i].date };
  return null;
}
// Month and 3 months: the /indices screener's live windows (27–41 d, 85–135 d back). Live marks only.
function win(hist, lo, hi) {
  const last = hist[hist.length - 1], t1 = Date.parse(last.date);
  for (let i = hist.length - 2; i >= 0; i--) {
    const g = (t1 - Date.parse(hist[i].date)) / DAY;
    if (g < lo) continue;
    if (g > hi) break;
    return { pct: r2((last.level / hist[i].level - 1) * 100), from: hist[i].date };
  }
  return null;
}
// Our card page for a basket row, only when the file exists (card-<card slug>-<set slug>.html).
function cardPage(p) {
  if (!p || !p.includes('/')) return null;
  const [set, card] = p.split('/');
  const slug = `card-${card}-${set.replace(/^pokemon-/, '')}`;
  return fs.existsSync(path.join(ROOT, slug + '.html')) ? `${SITE}/${slug}` : null;
}
const cleanSold = b => b && typeof b.price === 'number' && b.price > 0 && /^\d{4}-\d{2}-\d{2}$/.test(b.asOf || '')
  && !b.carried && /^sold\b/i.test(b.basis || '') && !/carried/i.test(b.basis || '');

const indices = [];
for (const [k, x] of Object.entries(idx)) {
  if (!x || typeof x !== 'object' || x.status !== 'live' || !x.page || x.model === 'class') continue;
  const H = HELD[k] || {};
  const hist = (x.history || []).filter(r => r && r.date && typeof r.level === 'number' && !H[r.date]);
  if (!hist.length) continue;
  const last = hist[hist.length - 1];
  const top = (x.basket || []).filter(cleanSold).sort((a, b) => b.price - a.price).slice(0, 5).map(b => {
    const o = { card: b.name, number: String(b.num), soldMark: r2(b.price), markDate: b.asOf };
    if (typeof b.win === 'number') o.window = `${b.win}-day median of sold prices`;
    if (typeof b.n30 === 'number') o.sales30d = b.n30;
    const pg = cardPage(b.path);
    if (pg) o.page = pg;
    return o;
  });
  const row = {
    ticker: k,
    name: x.name,
    ...(x.set ? { product: x.set } : {}),
    ...(x.model ? {} : { scope: 'chase cards only, not every card in the set' }),
    page: SITE + x.page,
    level: r2(last.level),
    markDate: last.date,
    base: 100,
    baseDate: x.baseDate || null,
    change1w: week(hist),
    change1m: win(hist, 27, 41),
    change3m: win(hist, 85, 135),
    basis: 'sold',
    cards: last.priced ?? (x.basket || []).length,
  };
  if (top.length) row.top = top;
  indices.push(row);
}
indices.sort((a, b) => a.ticker.localeCompare(b.ticker));
const newest = indices.map(i => i.markDate).sort().pop();

const feed = {
  name: 'ShopCardHub price indices',
  publisher: 'ShopCardHub',
  generated: newest,
  method: `${SITE}/how-prices-work`,
  terms: 'Free to quote with a link to the index page the number came from.',
  definitions: {
    generated: 'Date of the newest mark in this file. The file is rebuilt after each re-mark.',
    level: 'Index level on markDate. 100 = the index at its base month (baseDate, YYYY-MM).',
    basis: 'Every level is built from dated sold prices of raw (ungraded) cards. No listing prices.',
    change1w: 'Latest mark vs the latest earlier mark at least 5 days before it, in percent; from = that mark date.',
    change1m: 'Latest mark vs the latest earlier mark 27 to 41 days before it, in percent; null if the record is shorter.',
    change3m: 'Latest mark vs the latest earlier mark 85 to 135 days before it, in percent; null if the record is shorter.',
    cards: 'Cards priced at that mark.',
    top: 'Up to five highest-priced cards at the mark, each with its own dated sold mark in USD; sales30d = sales in the last 30 days where known.',
  },
  indices,
};
const body = JSON.stringify(feed, null, 1) + '\n';
if (/ebay|pricecharting|tcgplayer|customid|campid/i.test(body)) throw new Error('index-feed.json: a forbidden string slipped in');
const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
const stale = cur !== body;
if (CHECK) { if (stale) console.log('stale: index-feed.json'); }
else if (stale) fs.writeFileSync(OUT, body);
console.log(`build-index-feed: ${indices.length} live indices, ${indices.reduce((a, i) => a + (i.top || []).length, 0)} top cards, ${stale ? (CHECK ? '1 stale' : '1 written') : '0 written'}`);
if (CHECK && stale) process.exit(1);
