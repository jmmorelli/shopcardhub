#!/usr/bin/env node
// sold-marks.mjs — nightly SOLD marks for the Vault catalog (Sep 24 2026, CoS; Mo: "fold that into a
// github automation for all users of the site nightly").
//
// WHAT: for every card in data/price-universe.json, read its SportsCardsPro / PriceCharting item page
// (public, no login; fetched through www.pricecharting.com/game/<path>, which redirects sports cards to
// sportscardspro.com and answers a plain server fetch — the search pages do not) and emit a SOLD mark:
//   mark = median of that condition's dated sales in the last 30 days when there are >= 3,
//          else the median of the last 90 days when there are >= 2, else no mark (null).
// Asks are never used (LANE-RULES R20). Listing titles, sellers and item ids are never stored (R17):
// only dates and prices leave the page, and only aggregates are published.
//
// OUT:  data/feed/sold-marks.json   (public; the Vault links cards to it — keys "sold:<path>")
//       <hist>/sold-history.json    (price-data branch; one point per card per day, 400-day cap)
//
// A card's condition picks the sales tab: ungraded, or a grade ("PSA 10", "SGC 9.5", "Grade 9" …),
// matched against the page's own tab labels. A graded mark is labelled with the tab it came from, and
// the SCP "Grade 9" tab mixes graders — the label says so.
//
// Usage: node tools/price-engine/sold-marks.mjs [--universe data/price-universe.json]
//          [--out data/feed/sold-marks.json] [--hist price-data/data] [--only <text>] [--limit N]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const UNIVERSE = opt('--universe', 'data/price-universe.json');
const OUT = opt('--out', 'data/feed/sold-marks.json');
const HIST = opt('--hist', null);
const ONLY = opt('--only', null);
const LIMIT = Number(opt('--limit', 0)) || 0;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36';
const PAUSE = 1600;                       // one worker, polite gap (PriceCharting 429s bursts)
const TODAY = new Date().toISOString().slice(0, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const days = d => (Date.parse(TODAY) - Date.parse(d)) / 864e5;
const r2 = x => x == null ? null : Math.round(x * 100) / 100;

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(5000 * attempt); continue; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  }
  throw new Error('gave up after 3 tries');
}

// tab label on the page for a card's condition
function tabLabel(cond) {
  if (!cond || /^(raw|ungraded)$/i.test(cond)) return 'Ungraded';
  const m = cond.match(/^(PSA|SGC|BGS|CGC|TAG)\s*([\d.]+)/i);
  if (!m) return null;
  const co = m[1].toUpperCase(), g = m[2];
  if (g === '10') return co === 'PSA' ? 'PSA 10' : co === 'SGC' ? 'SGC 10' : co === 'CGC' ? 'CGC 10' : co === 'TAG' ? 'TAG 10' : null;
  return 'Grade ' + g;
}

export function parsePage(html, cond) {
  const want = tabLabel(cond);
  if (!want) return { error: 'no sales tab for condition ' + cond };
  const opts = [...html.matchAll(/<option value="(completed-auctions-[a-z-]+)"[^>]*>([^<(]+)\((\d+)\)<\/option>/g)].map(m => ({ cls: m[1], label: m[2].trim(), n: +m[3] }));
  const tab = opts.find(o => o.label === want);
  if (!tab) return { error: 'tab "' + want + '" not on page' };
  const start = html.indexOf('<div class="' + tab.cls + '"');
  if (start < 0) return { error: 'tab body missing', tab: want };
  const end = html.indexOf('<div class="completed-auctions-', start + 20);
  const body = html.slice(start, end > 0 ? end : start + 400000);
  const sales = [];
  for (const tr of body.split('<tr').slice(1)) {
    const d = tr.match(/<td class="date">\s*(\d{4}-\d{2}-\d{2})\s*<\/td>/);
    const p = tr.match(/<span class="js-price"[^>]*>\s*\$([\d,]+(?:\.\d+)?)/);
    if (d && p) sales.push({ d: d[1], p: parseFloat(p[1].replace(/,/g, '')) });
  }
  const title = ((html.match(/<h1[^>]*id="product_name"[^>]*>([\s\S]*?)<\/h1>/) || html.match(/<title>([^<|]*)/) || [])[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { tab: want, tabCount: tab.n, sales, title };
}

export function markOf(sales) {
  const in30 = sales.filter(s => days(s.d) <= 30), in90 = sales.filter(s => days(s.d) <= 90);
  const last = sales.slice().sort((a, b) => b.d.localeCompare(a.d))[0] || null;
  let mark = null, basis = null;
  if (in30.length >= 3) { mark = median(in30.map(s => s.p)); basis = 'median of ' + in30.length + ' sales, last 30 days'; }
  else if (in90.length >= 2) { mark = median(in90.map(s => s.p)); basis = 'median of ' + in90.length + ' sales, last 90 days'; }
  // one sale in 90 days is not a mark: a single print (a misfiled auto, a shill) would set the value alone
  return { mark: r2(mark), basis, n30: in30.length, n90: in90.length, med90: r2(median(in90.map(s => s.p))), lastSale: last ? last.d : null, lastPrice: last ? last.p : null, back: backfill(sales) };
}
// Weekly marks for the last 12 weeks, rebuilt from the same dated sales with the same rule, so a newly
// linked card has history on day one. The page shows only the most recent rows (30 on liquid cards), so
// a week is emitted only when the sale list reaches back past that week's whole 30-day window — a
// censored window would bias the mark toward the recent end.
function backfill(sales) {
  if (!sales.length) return [];
  const oldest = sales.reduce((a, s) => (s.d < a ? s.d : a), sales[0].d);
  const out = [];
  for (let w = 12; w >= 1; w--) {
    const asOf = new Date(Date.parse(TODAY) - w * 7 * 864e5).toISOString().slice(0, 10);
    const from = new Date(Date.parse(asOf) - 30 * 864e5).toISOString().slice(0, 10);
    if (from < oldest) continue;
    const win = sales.filter(s => s.d > from && s.d <= asOf);
    if (win.length >= 3) out.push({ d: asOf, p: r2(median(win.map(s => s.p))) });
  }
  return out;
}

async function main() {
  const U = JSON.parse(fs.readFileSync(UNIVERSE, 'utf8'));
  let cards = U.cards.filter(c => c.path);
  if (ONLY) cards = cards.filter(c => (c.label + ' ' + c.path).toLowerCase().includes(ONLY.toLowerCase()));
  if (LIMIT) cards = cards.slice(0, LIMIT);
  const out = [], errors = [];
  for (const [i, c] of cards.entries()) {
    try {
      const html = await get('https://www.pricecharting.com/game/' + c.path);
      const pg = parsePage(html, c.cond);
      if (pg.error) { errors.push({ key: c.key, error: pg.error }); }
      else {
        const m = markOf(pg.sales);
        out.push({ key: 'sold:' + c.path + (c.cond && !/^raw$/i.test(c.cond) ? '@' + c.cond.replace(/\s+/g, '').toLowerCase() : ''), label: c.label, cond: c.cond || 'Raw', h: c.h || null,
          source: 'sold', tab: pg.tab, last: m.mark, basis: m.basis, n30: m.n30, n30Capped: pg.sales.length >= 30 && m.n30 >= pg.sales.length, n90: m.n90, med90: m.med90, lastSale: m.lastSale, lastPrice: m.lastPrice, back: m.back, url: 'https://www.sportscardspro.com/game/' + c.path });
      }
    } catch (e) { errors.push({ key: c.key, error: String(e.message || e) }); }
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${cards.length}`);
    await sleep(PAUSE);
  }
  const priced = out.filter(o => o.last != null).length;
  const doc = { _comment: 'GENERATED nightly by tools/price-engine/sold-marks.mjs — SOLD marks only (dated SportsCardsPro/PriceCharting sales; never asks). A mark is the 30-day median of >=3 sales, else the 90-day median of >=2 sales, else null. No listing titles, sellers or item ids are stored.', day: TODAY, generated: new Date().toISOString(), counts: { universe: cards.length, read: out.length, priced, errors: errors.length }, cards: out, errors };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
  console.log(`sold-marks ${TODAY}: ${cards.length} cards · ${out.length} read · ${priced} priced · ${errors.length} errors -> ${OUT}`);
  if (HIST) {
    const hp = path.join(HIST, 'sold-history.json');
    let h = {}; try { h = JSON.parse(fs.readFileSync(hp, 'utf8')); } catch (e) {}
    for (const o of out) if (o.last != null) {
      const s = (h[o.key] = h[o.key] || { series: [] }).series;
      const at = s.findIndex(p => p.d === TODAY);
      const pt = { d: TODAY, p: o.last, n30: o.n30 };
      if (at >= 0) s[at] = pt; else s.push(pt);
      if (s.length > 400) s.splice(0, s.length - 400);
    }
    fs.mkdirSync(HIST, { recursive: true });
    fs.writeFileSync(hp, JSON.stringify(h) + '\n');
    console.log('history ->', hp);
  }
  // a run that read nothing is a broken run, not a quiet night
  if (cards.length && !out.length) process.exit(1);
}
if (import.meta.url === 'file://' + process.argv[1]) main();
