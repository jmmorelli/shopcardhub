#!/usr/bin/env node
// build-aisearch.mjs — AI-Search Hunter (Goal League S1, owner aisearch; Authority: Mo 2026-10-27, Goal League;
// Mo-approved agent-readable-site ruling 2026-10-29, item 1). Opt-in, per-slug: it reads data/aisearch.json (owned)
// and data/indices.json (read-only) and writes ONLY:
//   1. <title>, meta description, og:title, og:description on the pages listed in data/aisearch.json pages{}
//   2. the <!-- AISEARCH:ANSWER:START --> … END block on /indices: a dated answer to "is the Pokémon card market
//      up or down?" plus a plain static table of every live index, in the HTML itself (the /indices board is
//      otherwise rendered client-side, so fetchers that don't run JavaScript saw no index levels)
//   3. data/aisearch-llms.txt, the "Questions answered here" block tools/build-llms.mjs puts in llms.txt only
// Every number comes from data/indices.json at build time: a live mark, its date and its n. Nothing here carries
// an eBay URL, a listing price or an ask (R45). Run it after any mark, before tools/build-llms.mjs.
//   node tools/build-aisearch.mjs           write
//   node tools/build-aisearch.mjs --check   exit 1 if any output is stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.shopcardhub.com';
const CHECK = process.argv.includes('--check');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/aisearch.json'), 'utf8'));
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/indices.json'), 'utf8'));

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = s => { const [y, m, d] = s.split('-').map(Number); return `${MON[m - 1]} ${d}, ${y}`; };
const fmtDay = s => { const [, m, d] = s.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const fmtMonth = s => { const [y, m] = s.split('-').map(Number); return `${MON[m - 1]} ${y}`; };
const usd = n => '$' + Math.round(n).toLocaleString('en-US');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const num = n => (n >= 0 && n <= 10 ? WORD[n] : String(n));
const Num = n => { const w = num(n); return w[0].toUpperCase() + w.slice(1); };
const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';

// Live tickers, with the same held-mark exclusion and horizon rule as the /indices screener
// (latest live mark vs the latest earlier live mark 6–11 d back for a week, 27–41 d back for a month; live marks only).
const HELD = { SK03: { '2026-10-15': 1 } };
const HZ = { w: [6, 11], m: [27, 41] };
function hz(hist, key) {
  const [lo, hi] = HZ[key];
  if (hist.length < 2) return null;
  const last = hist[hist.length - 1], t1 = Date.parse(last.date);
  for (let i = hist.length - 2; i >= 0; i--) {
    const g = (t1 - Date.parse(hist[i].date)) / 864e5;
    if (g < lo) continue;
    if (g > hi) break;
    return { v: (last.level / hist[i].level - 1) * 100, from: hist[i].date };
  }
  return null;
}
const T = {};
for (const [k, x] of Object.entries(idx)) {
  if (!x || typeof x !== 'object' || x.status !== 'live' || !x.page) continue;
  if (x.model === 'class') continue;
  const H = HELD[k] || {};
  const hist = (x.history || []).filter(r => r && r.date && typeof r.level === 'number' && !H[r.date]);
  if (!hist.length) continue;
  const last = hist[hist.length - 1];
  const bowman = /bowman/i.test(x.name || '') || /^B(OW|B|CB)\d/.test(k);
  const name = bowman ? x.name.replace(/ Index$/, '')
    : x.set ? x.set.replace(/^Pokémon TCG /, '')
    : (x.name || k).replace(/ Chase Index$/, ' (chase cards)').replace(/ Index$/, '');
  T[k] = { k, x, name, page: x.page, last, w: hz(hist, 'w'), m: hz(hist, 'm'),
    n: last.priced ?? (x.basket || []).length, base: x.baseDate ? fmtMonth(x.baseDate) : null };
}
const missing = [...cfg.answer.groups.flatMap(g => g.tickers), ...Object.values(cfg.pages).map(p => p.ticker).filter(Boolean)]
  .filter(t => !T[t]);
if (missing.length) console.log(`note: not live, left out: ${[...new Set(missing)].join(', ')}`);

// ---------- the answer ----------
function dir(up, down, n) {
  if (!n) return null;
  if (down === n) return 'down';
  if (up === n) return 'up';
  if (down / n >= 0.6) return 'mostly down';
  if (up / n >= 0.6) return 'mostly up';
  return 'mixed';
}
const groups = cfg.answer.groups.map(g => {
  const rows = g.tickers.map(t => T[t]).filter(Boolean);
  const moved = rows.filter(r => r.m);
  const up = moved.filter(r => r.m.v > 0.05).length, down = moved.filter(r => r.m.v < -0.05).length;
  const vs = moved.map(r => r.m.v), lo = Math.min(...vs), hi = Math.max(...vs);
  return { ...g, rows, moved, up, down, lo, hi, dir: dir(up, down, moved.length) };
}).filter(g => g.moved.length);

function groupSentence(g) {
  const n = g.moved.length, all = g.rows.length;
  const scope = n === all ? g.label : `${g.label} with a month of marks`;
  const abs = (a, b) => `${Math.min(Math.abs(a), Math.abs(b)).toFixed(1)}% to ${Math.max(Math.abs(a), Math.abs(b)).toFixed(1)}%`;
  if (g.down === n) return n === 1 ? `The one index among the ${scope} fell ${abs(g.lo, g.hi).split(' to ')[0]}.` : `All ${num(n)} ${scope} fell, by ${abs(g.lo, g.hi)}.`;
  if (g.up === n) return n === 1 ? `The one index among the ${scope} rose ${abs(g.lo, g.hi).split(' to ')[0]}.` : `All ${num(n)} ${scope} rose, by ${abs(g.lo, g.hi)}.`;
  const flat = n - g.up - g.down;
  return `Of the ${num(n)} ${scope}, ${num(g.up)} rose and ${num(g.down)} fell${flat ? ` (${num(flat)} flat)` : ''}, from ${sgn(g.lo)} to ${sgn(g.hi)}.`;
}
const head = groups.filter(g => g.key !== 'bowman');
const headline = head.length
  ? 'In the latest month of marks, ' + head.map(g => `${g.short} were ${g.dir}`).join(' and ') + '.'
  : '';
const detail = groups.map(groupSentence).join(' ');
const markDates = [...new Set(groups.flatMap(g => g.moved.map(r => r.last.date)))].sort();
const datesTxt = markDates.length === 1 ? fmtDate(markDates[0])
  : markDates.slice(0, -1).map(fmtDay).join(', ') + ' or ' + fmtDate(markDates[markDates.length - 1]);
const methodWith = d => `Each move compares an index's latest mark (${d}) with its mark 27 to 41 days before. Levels come from dated sold prices and start at 100 in a base month.`;
const method = methodWith(datesTxt);
// On the page the mark dates are <time> elements (machine-readable ISO in datetime=); the year sits in the table summary.
const timeTag = s => `<time datetime="${s}">${fmtDay(s)}</time>`;
const methodHtml = methodWith(markDates.map(timeTag).join(' or ')).replace(/'/g, '&#39;');
const answerText = `${headline} ${detail}`.trim();

// ---------- /indices block ----------
const cell = h => (h ? `<span class="${h.v > 0.05 ? 'up' : h.v < -0.05 ? 'dn' : 'fl'}">${sgn(h.v)}</span>` : '<span class="fl">not yet</span>');
const listed = new Set();
const sections = cfg.answer.sections.map(s => ({ label: s.label, rows: s.tickers.map(t => T[t]).filter(Boolean) }));
sections.forEach(s => s.rows.forEach(r => listed.add(r.k)));
const extra = Object.values(T).filter(r => !listed.has(r.k));
if (extra.length) sections.push({ label: 'Other indices', rows: extra });
const total = sections.reduce((a, s) => a + s.rows.length, 0);
const yearOf = markDates.length ? markDates[markDates.length - 1].slice(0, 4) : '';
const th = 'style="text-align:right"';
const table = sections.map(s =>
  `<tr><th colspan="6" scope="colgroup" style="text-align:left;padding:12px 10px 6px;color:var(--th);font-size:11px;letter-spacing:1px;text-transform:uppercase;">${esc(s.label)}</th></tr>\n` +
  s.rows.map(r => `<tr><td class="nm"><a href="${esc(r.page)}">${esc(r.k)}</a> <span style="color:var(--tx)">${esc(r.name)}</span></td><td class="lv">${r.last.level.toFixed(2)}</td><td><time datetime="${r.last.date}">${fmtDay(r.last.date)}</time></td><td>${cell(r.w)}</td><td>${cell(r.m)}</td><td>${r.n}</td></tr>`).join('\n')
).join('\n');
const faq = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: [{ '@type': 'Question', name: cfg.answer.question,
    acceptedAnswer: { '@type': 'Answer', text: `${answerText} ${method}` } }],
};
const block = `<!-- AISEARCH:ANSWER:START — built by tools/build-aisearch.mjs from data/indices.json + data/aisearch.json (AI-Search Hunter). Do not hand-edit. -->
<section class="panel" id="market-answer" aria-labelledby="aisa-q" style="scroll-margin-top:80px;">
<h2 id="aisa-q">${esc(cfg.answer.question)}</h2>
<p style="font-size:15px;line-height:1.55;color:var(--th);max-width:72ch;margin:0 0 8px;">${esc(answerText)}</p>
<p style="font-size:12px;line-height:1.5;color:var(--dim);max-width:72ch;margin:0 0 10px;">${methodHtml} <a href="/how-prices-work">How the indices are priced</a>.</p>
<details><summary style="cursor:pointer;font-size:13px;color:var(--ac);">All ${total} indices in one plain table, dated (${yearOf})</summary>
<div style="overflow-x:auto;margin-top:8px;"><table>
<thead><tr><th scope="col">Index</th><th scope="col" ${th}>Level</th><th scope="col" ${th}>Marked</th><th scope="col" ${th}>1 week</th><th scope="col" ${th}>1 month</th><th scope="col" ${th}>Cards</th></tr></thead>
<tbody>
${table}
</tbody></table></div>
<p style="font-size:11px;color:var(--dim);margin-top:6px;">Level 100 = the index's base month. Cards = cards priced at that mark. "Not yet" means the live record is shorter than the window.</p>
</details>
</section>
<script type="application/ld+json">${JSON.stringify(faq).replace(/</g, '\\u003c')}</script>
<!-- AISEARCH:ANSWER:END -->`;

// ---------- head tags ----------
// {since}: level vs 100 at the base month ("down 42.2%"); {cost}: one raw copy of each priced card at the mark;
// {month}: the screener's 1M move (" It moved down 21.7% in the latest month."), empty when the record is too short.
const moveWord = v => (v > 0.05 ? 'up ' : v < -0.05 ? 'down ' : 'flat at ') + Math.abs(v).toFixed(1) + '%';
function fill(s, r) {
  if (!r) return s;
  const cost = typeof r.last.basketValue === 'number' ? usd(r.last.basketValue) : null;
  if (/\{cost\}/.test(s) && !cost) throw new Error(r.k + ': {cost} used but the mark has no basketValue');
  return s.replace(/\{level\}/g, r.last.level.toFixed(2)).replace(/\{date\}/g, fmtDate(r.last.date))
    .replace(/\{priced\}/g, String(r.n)).replace(/\{base\}/g, r.base || 'the base month')
    .replace(/\{since\}/g, moveWord(r.last.level - 100)).replace(/\{cost\}/g, cost || '')
    .replace(/\{month\}/g, r.m ? ` It moved ${moveWord(r.m.v)} in the latest month (from ${fmtDate(r.m.from)}).` : '');
}
function setHead(html, p) {
  const r = p.ticker ? T[p.ticker] : null;
  if (p.ticker && !r) return html;
  const title = esc(p.title), desc = esc(fill(p.description, r));
  const once = (h, re, rep) => { if (!re.test(h)) throw new Error('head tag not found: ' + re); return h.replace(re, rep); };
  html = once(html, /<title>[^<]*<\/title>/, `<title>${title} | ShopCardHub</title>`);
  html = once(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
  html = once(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  if (/<meta property="og:description" content="[^"]*">/.test(html))
    html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`);
  // Opt-in ("ld": true): the page's own hand-written WebPage JSON-LD gets the same name and description, and its
  // "about" names this page's index (some pages were copied from another index's template and named it instead).
  if (p.ld) {
    const RE = /<script type="application\/ld\+json">(\{"@context": ?"https:\/\/schema\.org", ?"@type": ?"WebPage"[^<]*)<\/script>/;
    const m = html.match(RE);
    if (!m) throw new Error('WebPage JSON-LD not found for ' + (p.ticker || p.title));
    const ld = JSON.parse(m[1]);
    ld.name = p.title;
    ld.description = fill(p.description, r);
    if (r) ld.about = { '@type': 'Thing', name: `${r.k} · ${r.x.name}` };
    html = html.replace(RE, () => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
  }
  return html;
}

const out = new Map();
for (const [slug, p] of Object.entries(cfg.pages)) {
  const f = path.join(ROOT, slug + '.html');
  let html = fs.readFileSync(f, 'utf8');
  html = setHead(html, p);
  if (slug === 'indices') {
    const RE = /<!-- AISEARCH:ANSWER:START[\s\S]*?<!-- AISEARCH:ANSWER:END -->/;
    if (RE.test(html)) html = html.replace(RE, () => block);
    else {
      const anchor = '<!-- SCREENER:';
      if (!html.includes(anchor)) throw new Error('indices.html: no SCREENER anchor for the first insert');
      html = html.replace(anchor, () => block + '\n' + anchor);
    }
  }
  out.set(f, html);
}

// ---------- llms.txt question block ----------
function tickerAnswer(r) {
  const cost = typeof r.last.basketValue === 'number' ? `; one copy of each card came to about ${usd(r.last.basketValue)}` : '';
  const m = r.m ? ` Over the latest month it moved ${sgn(r.m.v)} (from ${fmtDate(r.m.from)}).` : '';
  return `The ${r.k} index stood at ${r.last.level.toFixed(2)} on ${fmtDate(r.last.date)} (100 = ${r.base || 'base month'}), across ${r.n} cards on dated sold prices${cost}.${m}`;
}
const llms = ['## Questions answered here'];
for (const q of cfg.llms) {
  if (q.answer === 'market') { llms.push(`- [${q.q}](${SITE}${q.page}): ${answerText} ${method}`); continue; }
  const r = T[q.ticker];
  if (!r) continue;
  // Optional: q.page points the question at another owned page; q.lead is a plain sentence before the dated answer.
  llms.push(`- [${q.q}](${SITE}${q.page || r.page}): ${q.lead ? q.lead + ' ' : ''}${tickerAnswer(r)}`);
}
// Optional pointer to the machine-readable feed (tools/build-index-feed.mjs), one line, only if the file exists.
if (cfg.feed && fs.existsSync(path.join(ROOT, cfg.feed.path.replace(/^\//, ''))))
  llms.push(`- ${cfg.feed.text} → [${cfg.feed.path}](${SITE}${cfg.feed.path})`);
out.set(path.join(ROOT, 'data/aisearch-llms.txt'), llms.join('\n') + '\n');

let stale = 0;
for (const [f, body] of out) {
  const cur = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  if (cur === body) continue;
  stale++;
  if (CHECK) console.log('stale: ' + path.relative(ROOT, f)); else fs.writeFileSync(f, body);
}
console.log(`build-aisearch: ${Object.keys(T).length} live indices, ${out.size} files, ${stale} ${CHECK ? 'stale' : 'written'}`);
if (CHECK && stale) process.exit(1);
