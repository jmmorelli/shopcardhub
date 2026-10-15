#!/usr/bin/env node
// Builds /llms.txt and /llms-full.txt (E7 GEO slice 1, Traffic Agent, Oct 15 2026).
// Generator-first: everything comes from sitemap.xml + data/indices.json, so a nightly
// re-mark or a cull merge changes these files the next time this runs. No hand edits.
//   node tools/build-llms.mjs          write both files
//   node tools/build-llms.mjs --check  exit 1 if either file is stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.shopcardhub.com';
const check = process.argv.includes('--check');

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(SITE, '') || '/');
const inSitemap = new Set(locs);

const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/indices.json'), 'utf8'));
const tickers = Object.values(idx).filter(v => v && typeof v === 'object' && v.ticker && v.page);

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = s => { const [y, m, d] = s.split('-').map(Number); return `${MON[m - 1]} ${d}, ${y}`; };
const fmtMonth = s => { const [y, m] = s.split('-').map(Number); return `${MON[m - 1]} ${y}`; };
const usd = n => '$' + Math.round(n).toLocaleString('en-US');

function lastMark(t) {
  const h = (t.history || []).filter(r => r && r.date && typeof r.level === 'number');
  return h.length ? h[h.length - 1] : null;
}
function entity(t) {
  const set = (t.set || t.name || t.ticker).replace(/\s+Set Index$/i, '');
  return `ShopCardHub ${set} Index (${t.ticker})`;
}
function answer(t) {
  const m = lastMark(t);
  if (!m) return null;
  const base = t.baseDate ? `100 = ${fmtMonth(t.baseDate)}` : 'base 100';
  const n = m.priced ?? (t.basket || []).length;
  const basis = t.basis === 'sold' ? 'sold prices' : (t.basis ? `${t.basis} prices` : 'prices');
  const cost = typeof m.basketValue === 'number' ? `; one raw copy of each card cost about ${usd(m.basketValue)}` : '';
  return `${entity(t)} stood at ${m.level} on ${fmtDate(m.date)} (${base}), across ${n} cards on ${basis}${cost}. Source: ${t.basisLabel || 'ShopCardHub marks'}.`;
}

const live = tickers
  .filter(t => t.status === 'live' && inSitemap.has(t.page) && lastMark(t))
  .sort((a, b) => a.ticker.localeCompare(b.ticker));
const lastDate = live.map(t => lastMark(t).date).sort().pop();

const indexPages = new Set(live.map(t => t.page));
const utility = ['/', '/indices', '/how-prices-work', '/cards', '/release-calendar', '/track-record', '/about'].filter(u => inSitemap.has(u));
const guides = locs.filter(u => !indexPages.has(u) && !utility.includes(u) && !u.startsWith('/card-'));

const head = `# ShopCardHub

> Price indices for Pokémon TCG sets and Bowman 1st autos. Each index is the cost of one copy of every card in a set, set to 100 at a base month and re-marked on sold prices. Last mark: ${fmtDate(lastDate)}.

Every index level is a dated read of completed sales. Where a page shows a listing price it is labelled an ask. Pages track prices; they do not tell anyone to buy or sell.
`;

const LABEL = { '/': 'Home: the index board', '/indices': 'All indices, ranked by 1-week, 1-month and 3-month move', '/how-prices-work': 'How the indices are priced', '/cards': 'Card charts', '/release-calendar': 'Release calendar', '/track-record': 'Track record', '/about': 'About' };
const line = (u, label, note) => `- [${label}](${SITE}${u === '/' ? '' : u})${note ? `: ${note}` : ''}`;

const short = [
  head,
  '## Start here',
  ...utility.map(u => line(u, LABEL[u] || u)),
  '',
  '## Set indices',
  ...live.map(t => { const m = lastMark(t); return line(t.page, entity(t), `${m.level} on ${fmtDate(m.date)}`); }),
  '',
  '## Optional',
  ...guides.map(u => line(u, u.slice(1).replace(/-/g, ' '))),
  '',
].join('\n');

const full = [
  head,
  '## Index levels, last mark',
  '',
  ...live.map(t => `### ${entity(t)}\n${SITE}${t.page}\n${answer(t)}${t.releaseDate ? ` Set released ${fmtDate(t.releaseDate)}.` : ''}\n`),
  '## Method',
  `- Price-weighted, uncapped: the index is the cost of one copy of every card in the basket, indexed to 100 at the base month. No cap and no rebalance; membership changes go through the divisor. Details: ${SITE}/how-prices-work`,
  '',
].join('\n');

const outs = { 'llms.txt': short, 'llms-full.txt': full };
let stale = 0;
for (const [f, body] of Object.entries(outs)) {
  const p = path.join(ROOT, f);
  const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  if (cur === body) continue;
  if (check) { console.log(`stale: ${f}`); stale++; } else { fs.writeFileSync(p, body); console.log(`wrote ${f} (${body.length} bytes, ${live.length} indices)`); }
}
if (check) { console.log(stale ? `llms: ${stale} stale` : 'llms: up to date'); process.exit(stale ? 1 : 0); }
