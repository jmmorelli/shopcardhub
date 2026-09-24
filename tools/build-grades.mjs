#!/usr/bin/env node
// Bangers Scouting Grades v1 (Sep 24 2026) — SA-style factor grades for the 1st Bowman Chrome Auto
// of every name on /bowman-bangers (5 seats + 5 watch). Reads data/grades-inputs.json, writes
// data/grades.json and the machine-owned GRADES block in bowman-bangers.html.
//   node tools/build-grades.mjs            -> write both
//   node tools/build-grades.mjs --check    -> print the table, write nothing
// Grades DESCRIBE a player and his card; they are not calls. BUY/HOLD/PASS stays on the board and
// the Scorecard (graded at 6/12 months). Prices are dated SportsCardsPro solds only (R20).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'data/grades-inputs.json');
const OUT = path.join(ROOT, 'data/grades.json');
const PAGE = path.join(ROOT, 'bowman-bangers.html');
const CHECK = process.argv.includes('--check');

export const MODEL = {
  version: 1,
  weights: { pedigree: 0.20, performance: 0.25, path: 0.15, momentum: 0.15, value: 0.15, liquidity: 0.10 },
  // letter bands on a 0-100 score (absolute, not curved: ten names is too few to grade on a curve)
  bands: [[90, 'A+'], [83, 'A'], [77, 'A-'], [71, 'B+'], [65, 'B'], [59, 'B-'], [53, 'C+'], [47, 'C'], [41, 'C-'], [35, 'D+'], [28, 'D'], [20, 'D-'], [0, 'F']],
  // league-average OPS and typical age by level (approximate 2020s norms)
  lg: { ROK: { ops: 0.720, age: 20 }, A: { ops: 0.700, age: 21 }, 'A+': { ops: 0.710, age: 22 }, AA: { ops: 0.720, age: 23.5 }, AAA: { ops: 0.770, age: 25.5 }, MLB: { ops: 0.710, age: 27.5 } },
  etaScore: { 2026: 100, 2027: 85, 2028: 65, 2029: 45, 2030: 30, 2031: 20 },
  blockScore: { open: 90, soft: 65, blocked: 40, heavy: 25 },
  healthAdj: { 'out-into-next': -15, 'season-ended': -10, 'missed-time': -5 },
  fullPA: 400,            // below this, performance regresses toward 50 in proportion to PA
  fullBF: 350,
};

const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const r1 = x => x == null ? null : Math.round(x * 10) / 10;
export const letter = s => s == null ? null : MODEL.bands.find(([t]) => s >= t)[1];
const ln = Math.log;

function pedigree(p) {
  // prospect standing (the market's informed view today) 65% + acquisition capital 35%
  let rank;
  if (p.rank.top100) rank = 100 - (p.rank.top100 - 1) * 0.4;                 // #1 = 100, #100 ~ 60
  else if (p.rank.graduated && p.rank.lastTop100) rank = 100 - (p.rank.lastTop100 - 1) * 0.4;
  else if (p.rank.org) rank = clamp(55 - (p.rank.org - 1) * 3);               // org #1 = 55, #13 = 19
  else rank = 20;
  const b = p.acq.bonus || 0;
  const cap = p.acq.type === 'ifa'
    ? clamp(100 * ln(Math.max(b, 50e3) / 50e3) / ln(5e6 / 50e3))              // IFA scale: $50K = 0, $5M = 100
    : clamp(100 * ln(Math.max(b, 100e3) / 100e3) / ln(10e6 / 100e3));         // draft scale: $100K = 0, $10M = 100
  return { score: 0.65 * rank + 0.35 * cap, parts: { rank: r1(rank), capital: r1(cap) } };
}

function performance(p) {
  const hit = p.stats.filter(s => s.pa), pit = p.stats.filter(s => s.bf);
  if (hit.length) {
    let pa = 0, rel = 0, age = 0, bb = 0, so = 0;
    for (const s of hit) {
      const L = MODEL.lg[s.lvl]; pa += s.pa;
      rel += s.pa * 100 * s.ops / L.ops;            // OPS relative to level average (100 = average)
      age += s.pa * 3 * (L.age - p.age);            // +3 per year younger than the level's typical age
      bb += s.bb; so += s.so;
    }
    rel /= pa; age /= pa;
    const disc = 0.5 * ((bb - so) / pa * 100 + 10); // BB% - K%, centred at -10 pts
    const idx = rel + age + disc;
    const raw = clamp(50 + (idx - 100) * 0.8);
    const w = Math.min(1, pa / MODEL.fullPA);       // small samples regress to the middle
    return { score: 50 + (raw - 50) * w, parts: { index: r1(idx), relOPS: r1(rel), ageAdj: r1(age), discipline: r1(disc), sample: pa + ' PA', shrink: r1(w) } };
  }
  if (pit.length) {
    // pitchers: FIP and K-BB% at the highest level pitched, plus the same age credit
    const s = pit.reduce((a, b) => (b.bf > a.bf ? b : a));
    const L = MODEL.lg[s.lvl];
    const fip = (13 * s.hr + 3 * s.bb - 2 * s.so) / s.ip + 3.1;
    const kbb = (s.so - s.bb) / s.bf * 100;
    const idx = 100 + 3 * (kbb - 13.5) + 10 * (4.2 - fip) + 3 * (L.age - p.age);
    const raw = clamp(50 + (idx - 100) * 0.8);
    const w = Math.min(1, s.bf / MODEL.fullBF);
    return { score: 50 + (raw - 50) * w, parts: { index: r1(idx), FIP: r1(fip), KBB: r1(kbb), level: s.lvl, sample: s.bf + ' BF', shrink: r1(w) } };
  }
  return { score: null, parts: {} };
}

function pathScore(p) {
  const eta = MODEL.etaScore[p.path.eta] ?? 20, blk = MODEL.blockScore[p.path.block] ?? 50;
  const h = MODEL.healthAdj[p.path.health] || 0;
  return { score: clamp(0.5 * eta + 0.5 * blk + h), parts: { eta: p.path.eta, etaScore: eta, block: p.path.block, blockScore: blk, health: p.path.health, healthAdj: h } };
}

function momentum(p) {
  const m = p.px.m, now = m[m.length - 1];
  if (!p.px.n30 && daysSince(p.px.last) > 30) return { score: null, parts: { reason: 'no sale in 30 days — not graded' } };
  const m1 = ln(now / m[m.length - 2]), m3 = ln(now / m[m.length - 4]);
  const tape = p.px.med14 && p.px.med30 ? ln(p.px.med14 / p.px.med30) : 0;
  const s = 0.5 * m1 + 0.25 * m3 + 0.25 * tape;
  return { score: clamp(50 + 150 * s), parts: { chg1m: r1((now / m[m.length - 2] - 1) * 100), chg3m: r1((now / m[m.length - 4] - 1) * 100), tape14v30: r1(tape * 100) } };
}

function liquidity(p) {
  const n = p.px.n30;
  return { score: clamp(100 * ln(1 + n) / ln(31)), parts: { sales30: n + (p.px.n30cap ? '+' : ''), last: p.px.last } };
}

function daysSince(d) { return (Date.parse(INPUT.asOf) - Date.parse(d)) / 864e5; }

// value: is the price already paying for the fundamentals? Within the cohort, how far up the ladder
// his fundamentals sit (z of the pedigree/performance/path composite) minus how far up the ladder his
// price sits (z of ln price). Positive = more player per dollar than the group. A straight regression
// of price on fundamentals explained under 10% of the spread on Sep 24 — this market prices
// narrative as much as tools — so a relative read is the honest one; the fit is published beside it.
function valueAll(rows) {
  const n = rows.length;
  const z = xs => { const m = xs.reduce((a, x) => a + x, 0) / n, sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1)); return xs.map(x => (x - m) / sd); };
  const zf = z(rows.map(r => r.fund)), zp = z(rows.map(r => ln(r.priceNow)));
  const mx = rows.reduce((a, r) => a + r.fund, 0) / n, my = rows.reduce((a, r) => a + ln(r.priceNow), 0) / n;
  const sxy = rows.reduce((a, r) => a + (r.fund - mx) * (ln(r.priceNow) - my), 0), sxx = rows.reduce((a, r) => a + (r.fund - mx) ** 2, 0), syy = rows.reduce((a, r) => a + (ln(r.priceNow) - my) ** 2, 0);
  rows.forEach((r, i) => {
    r.value = { score: clamp(50 + 20 * (zf[i] - zp[i])), parts: { price: r.priceNow, priceBasis: r.priceBasis, zFundamentals: Math.round(zf[i] * 100) / 100, zPrice: Math.round(zp[i] * 100) / 100 } };
  });
  return { slope: sxy / sxx, r2: (sxy * sxy) / (sxx * syy), n };
}

const INPUT = JSON.parse(fs.readFileSync(IN, 'utf8'));

export function build() {
  const rows = INPUT.players.map(p => {
    const f = { pedigree: pedigree(p), performance: performance(p), path: pathScore(p), momentum: momentum(p), liquidity: liquidity(p) };
    const fund = (f.pedigree.score + f.performance.score + f.path.score) / 3;
    const usable = p.px.n30 >= 5 && p.px.med30;
    return { p, f, fund, priceNow: usable ? p.px.med30 : p.px.m[p.px.m.length - 1], priceBasis: usable ? 'median of ' + p.px.n30 + (p.px.n30cap ? '+' : '') + ' sales, last 30 days' : 'SportsCardsPro ungraded value (fewer than 5 sales in 30 days)' };
  });
  const fit = valueAll(rows);
  const out = rows.map(({ p, f, fund, value }) => {
    f.value = value;
    let tot = 0, wsum = 0;
    for (const [k, w] of Object.entries(MODEL.weights)) if (f[k].score != null) { tot += w * f[k].score; wsum += w; }
    const hub = tot / wsum;
    const factors = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, { score: r1(v.score), grade: letter(v.score), ...v.parts }]));
    return { slug: p.slug, name: p.name, card: p.card, org: p.org, pos: p.pos, age: p.age, hub: { score: r1(hub), grade: letter(hub) }, fundamentals: r1(fund), factors, statLine: p.statLine, pathNote: p.path.note, news: p.news, graduated: !!p.rank.graduated, history: [{ asOf: INPUT.asOf, hub: letter(hub) }] };
  }).sort((a, b) => b.hub.score - a.hub.score);
  return { _comment: 'GENERATED by tools/build-grades.mjs from data/grades-inputs.json — do not hand-edit.', model: MODEL, asOf: INPUT.asOf, sources: INPUT.sources, valueFit: { r2: Math.round(fit.r2 * 100) / 100, slope: Math.round(fit.slope * 1000) / 1000, n: fit.n }, players: out };
}

const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FACTORS = [
  ['pedigree', 'Pedigree', 'Draft capital and where the prospect lists have him today'],
  ['performance', 'Performance', '2026 production vs. the level, adjusted for age and sample size'],
  ['path', 'Path', 'ETA and who is ahead of him in the organization, less injury time'],
  ['momentum', 'Momentum', 'The chart: 1- and 3-month change in the raw auto, plus the last two weeks of sales'],
  ['value', 'Value', 'His fundamentals vs. his price, relative to the other nine names'],
  ['liquidity', 'Liquidity', 'Raw-auto sales in the last 30 days — can you actually sell it?'],
];
const tier = g => !g ? 'na' : g[0] === 'A' ? 'a' : g[0] === 'B' ? 'b' : g[0] === 'C' ? 'c' : 'd';
const chip = (g, big) => `<span class="gr-chip gr-${tier(g)}${big ? ' gr-big' : ''}">${g || '—'}</span>`;
const money = n => '$' + Number(n).toFixed(2);
function why(k, f) {
  switch (k) {
    case 'pedigree': return `prospect standing ${f.rank}/100 · acquisition capital ${f.capital}/100`;
    case 'performance': return f.FIP != null
      ? `${f.level}: FIP ${f.FIP}, K–BB ${f.KBB}% · ${f.sample}`
      : `index ${f.index} (OPS vs level ${f.relOPS}, age ${f.ageAdj >= 0 ? '+' : ''}${f.ageAdj}, discipline ${f.discipline >= 0 ? '+' : ''}${f.discipline}) · ${f.sample}${f.shrink < 1 ? ', weighted ' + Math.round(f.shrink * 100) + '% for sample' : ''}`;
    case 'path': return `ETA ${f.eta} · ${f.block} path${f.healthAdj ? ' · health ' + f.healthAdj : ''}`;
    case 'momentum': return f.reason ? f.reason : `1M ${f.chg1m >= 0 ? '+' : ''}${f.chg1m}% · 3M ${f.chg3m >= 0 ? '+' : ''}${f.chg3m}% · last 14 days vs 30 ${f.tape14v30 >= 0 ? '+' : ''}${f.tape14v30}%`;
    case 'value': return `${money(f.price)} (${f.priceBasis}) · fundamentals z ${f.zFundamentals >= 0 ? '+' : ''}${f.zFundamentals} vs price z ${f.zPrice >= 0 ? '+' : ''}${f.zPrice}`;
    case 'liquidity': return `${f.sales30} sales in 30 days · last sale ${f.last}`;
  }
}
function render(G) {
  const d = new Date(G.asOf + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const rows = G.players.map((r, i) => `
      <details class="gr-row" id="grade-${r.slug}">
        <summary>
          <span class="gr-n">${i + 1}</span>
          <span class="gr-who"><b>${esc(r.name)}</b><small>${esc(r.pos)} · ${esc(r.org)} · age ${r.age}${r.graduated ? ' · <em>graduated to MLB</em>' : ''}</small></span>
          <span class="gr-hub">${chip(r.hub.grade, true)}<small>${r.hub.score}</small></span>
          <span class="gr-facs">${FACTORS.map(([k, lab]) => `<span class="gr-f"><i>${lab.slice(0, 4)}</i>${chip(r.factors[k].grade)}</span>`).join('')}</span>
        </summary>
        <div class="gr-body">
          <table class="gr-tbl"><tbody>
${FACTORS.map(([k, lab]) => `            <tr><th>${lab}</th><td>${chip(r.factors[k].grade)}</td><td class="gr-sc">${r.factors[k].score ?? '—'}</td><td class="gr-why">${esc(why(k, r.factors[k]))}</td></tr>`).join('\n')}
          </tbody></table>
          <p class="gr-note"><b>2026:</b> ${esc(r.statLine)}. <b>Path:</b> ${esc(r.pathNote)} <b>Note:</b> ${esc(r.news)}</p>
          <p class="gr-note gr-dim">Card graded: ${esc(r.name)} 1st Bowman Chrome Auto ${esc(r.card)} (2026 Bowman), raw. Grades as of ${d}; 3- and 6-month grade history appears as the grades age.</p>
        </div>
      </details>`).join('');
  const w = G.model.weights;
  return `<!-- GRADES:START — generated by tools/build-grades.mjs from data/grades-inputs.json; do not hand-edit -->
  <section id="scouting-grades" data-prices-updated="${G.asOf}">
    <style>
      .gr-intro { color:var(--text); max-width:760px; line-height:1.7; margin-bottom:18px; }
      .gr-list { border-top:1px solid var(--border); }
      .gr-row { border-bottom:1px solid var(--border); }
      .gr-row > summary { list-style:none; cursor:pointer; display:grid; grid-template-columns:22px minmax(0,1fr) 64px; grid-template-areas:"n who hub" ". facs facs"; gap:8px 12px; align-items:center; padding:14px 4px; }
      .gr-row > summary::-webkit-details-marker { display:none; }
      .gr-row[open] > summary, .gr-row > summary:hover { background:var(--bg3); }
      .gr-n { grid-area:n; font-family:var(--fm); font-size:11px; color:var(--text-dim); }
      .gr-who { grid-area:who; min-width:0; }
      .gr-who b { display:block; color:var(--text-head); font-size:15px; }
      .gr-who small { display:block; color:var(--text-dim); font-family:var(--fm); font-size:11px; letter-spacing:.3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .gr-hub { grid-area:hub; text-align:center; }
      .gr-hub small { display:block; font-family:var(--fm); font-size:10px; color:var(--text-dim); margin-top:2px; }
      .gr-facs { grid-area:facs; display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:6px; }
      .gr-f { display:flex; flex-direction:column; align-items:center; gap:3px; }
      .gr-f i { font-style:normal; font-family:var(--fm); font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); }
      .gr-chip { display:inline-block; min-width:34px; text-align:center; font-family:var(--fm); font-weight:700; font-size:12px; padding:3px 6px; border-radius:2px; border:1px solid; }
      .gr-big { font-size:17px; min-width:48px; padding:6px 8px; }
      .gr-a { color:var(--green); border-color:var(--green); background:var(--green-dim); }
      .gr-b { color:var(--accent); border-color:var(--accent); background:var(--accent-dim); }
      .gr-c { color:var(--gold); border-color:var(--gold); }
      .gr-d { color:var(--red); border-color:var(--red); }
      .gr-na { color:var(--text-dim); border-color:var(--border2); }
      .gr-body { padding:4px 4px 18px 34px; }
      .gr-tbl { width:100%; border-collapse:collapse; font-size:13px; }
      .gr-tbl th { text-align:left; font-family:var(--fm); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); font-weight:400; padding:6px 8px 6px 0; white-space:nowrap; }
      .gr-tbl td { padding:6px 8px 6px 0; vertical-align:top; border-top:1px solid var(--border); }
      .gr-tbl tr:first-child td { border-top:none; }
      .gr-sc { font-family:var(--fm); color:var(--text-dim); font-size:11px; }
      .gr-why { color:var(--text); font-size:12px; line-height:1.5; }
      .gr-note { font-size:13px; line-height:1.65; color:var(--text); margin-top:10px; }
      .gr-dim { color:var(--text-dim); font-size:12px; }
      .gr-how { margin-top:18px; background:var(--bg3); border:1px solid var(--border); padding:4px 16px; }
      .gr-how summary { cursor:pointer; font-family:var(--fm); font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--accent); padding:10px 0; }
      .gr-how p, .gr-how li { font-size:13px; line-height:1.7; color:var(--text); }
      .gr-how ul { margin:4px 0 12px 18px; }
      @media (min-width:900px) { .gr-row > summary { grid-template-columns:22px 230px minmax(0,1fr) 64px; grid-template-areas:"n who facs hub"; } }
      @media (max-width:600px) { .gr-body { padding-left:4px; } .gr-tbl .gr-why { display:block; } .gr-tbl td.gr-why { padding-top:0; border-top:none; } .gr-tbl tr { display:grid; grid-template-columns:auto auto 1fr; border-top:1px solid var(--border); padding:4px 0; } .gr-tbl tr:first-child { border-top:none; } .gr-tbl td { border-top:none; } .gr-tbl td.gr-why { grid-column:1 / -1; } }
    </style>
    <div class="section-eyebrow">Scouting Grades · v${G.model.version} · ${d}</div>
    <h2>Scouting Grades — All 10 Bangers, Six Factors Each</h2>
    <p class="section-intro gr-intro">A stock gets factor grades; so do these cards. Every name on this page — the top five and the watch tier — is graded A+ to F on six factors, then rolled into one <b>Hub rating</b>. Grades <b>describe</b> the player and his 1st Bowman Chrome Auto. They are not calls: BUY / HOLD / PASS stays on the board above and on <a href="/track-record">the Scorecard</a>, where a call is judged at 6 and 12 months. Tap a name for the numbers behind every grade.</p>
    <div class="gr-list">${rows}
    </div>
    <details class="gr-how">
      <summary>How the grades work</summary>
      <ul>
${FACTORS.map(([k, lab, desc]) => `        <li><b>${lab} (${Math.round(w[k] * 100)}%)</b> — ${desc}.</li>`).join('\n')}
      </ul>
      <p><b>Scale.</b> Each factor is scored 0–100 on a fixed rule, then lettered: A+ 90+, A 83, A− 77, B+ 71, B 65, B− 59, C+ 53, C 47, C− 41, D+ 35, D 28, D− 20, F below. Fixed, not curved — ten names is too few to grade on a curve. A factor with no data shows “—” and its weight is spread across the others.</p>
      <p><b>Small samples.</b> Performance is pulled toward average in proportion to playing time (full weight at 400 plate appearances or 350 batters faced), so 140 hot plate appearances can't masquerade as a season.</p>
      <p><b>Value is relative.</b> On ${d}, fundamentals (pedigree, performance, path) explained only ${Math.round(G.valueFit.r2 * 100)}% of the price spread across these ten cards — this market prices story as much as tools. So Value reads how far up the group a player's fundamentals sit against how far up the group his price sits. Positive = more player per dollar.</p>
      <p><b>Sources.</b> Prices: dated SportsCardsPro sales of the raw auto (never asking prices). Stats: 2026 season, MLB Stats API. Ranks and ETAs: MLB Pipeline (in-season update, Aug 13 2026). Path is a published rule — open, soft, blocked or heavily blocked — read from the MLB depth chart and the org's Top 30. Every input is re-read before a re-grade.</p>
    </details>
  </section>
<!-- GRADES:END -->`;
}

const G = build();
if (CHECK || process.argv.includes('--print')) {
  console.log('value fit R2', G.valueFit.r2, 'slope', G.valueFit.slope);
  for (const r of G.players) console.log(r.hub.grade.padEnd(3), String(r.hub.score).padStart(5), r.name.padEnd(18), Object.entries(r.factors).map(([k, v]) => k.slice(0, 4) + ' ' + (v.grade || '—').padEnd(2) + ' ' + String(v.score ?? '—').padStart(5)).join(' | '));
  if (CHECK) process.exit(0);
}
fs.writeFileSync(OUT, JSON.stringify(G, null, 1) + '\n');
let html = fs.readFileSync(PAGE, 'utf8');
const block = render(G);
const re = /<!-- GRADES:START[\s\S]*?<!-- GRADES:END -->/;
if (re.test(html)) html = html.replace(re, block);
else {
  const anchor = html.indexOf('<div class="section-eyebrow">Also Worth Tracking</div>');
  const at = anchor < 0 ? -1 : html.lastIndexOf('<section', anchor);
  if (at < 0) { console.error('anchor not found — refusing to guess where the block goes'); process.exit(2); }
  html = html.slice(0, at) + block + '\n  ' + html.slice(at);
}
fs.writeFileSync(PAGE, html);
console.log('wrote', path.relative(ROOT, OUT), '+ GRADES block in', path.relative(ROOT, PAGE));
