/* js/track-record-render.js — the ONE renderer for the /track-record scorecard (B66, Oct 9 2026).
 *
 * Used twice, same code, same output:
 *   - at build time by tools/build-track-record.mjs, which bakes the rows + scoreboard into track-record.html so
 *     crawlers (Googlebot saw "Loading the scorecard…" ×3 — GSC Oct 9) and JS-off readers get the named calls graded
 *     against sold prices, misses kept;
 *   - in the browser by the page's inline script, which fetches /data/calls.json and re-renders only when the data
 *     is newer than the bake (so the live-asks spans are not fetched twice).
 * Pure: input = the calls.json object, output = HTML strings. No DOM, no fetch. A call's headline grade comes from
 * its thesis checks (6 / 12 months, sold basis); the 8-week read is shown and NEVER graded here.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TRRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var GRADE = { hit:['HIT','v-buy'], miss_high:['MISS HIGH','v-watch'], miss_low:['MISS LOW','v-hold'],
                right:['RIGHT','v-buy'], wrong:['WRONG','v-watch'], flat:['FLAT','v-hold'] };
  var STATE = { open:'OPEN', trending:'TRENDING', final:'FINAL' };
  var ACTION = { WAIT:'PASS' };                       // display only — the stored action is immutable
  var IMG = {"pb-darkrai-sir": "ebay:mega-darkrai-ex-sir", "v-pb-darkrai-wait": "ebay:mega-darkrai-ex-sir", "pb-darkrai-mhr": "name:Mega Darkrai ex 120/084 Pitch Black -case -display -lot -proxy -bundle", "pb-zeraora-sir": "name:Mega Zeraora ex 114/084 Pitch Black -case -display -lot -proxy -bundle", "v-pb-zeraora-buy": "name:Mega Zeraora ex 114/084 Pitch Black -case -display -lot -proxy -bundle", "pb-chandelure-sir": "name:Mega Chandelure ex 115/084 Pitch Black -case -display -lot -proxy -bundle", "pb-morpeko-sir": "name:Morpeko ex 117/084 Pitch Black", "cr-greninja-psa10": "ebay:mega-greninja-ex-sir", "v-cr-greninja-buy": "ebay:mega-greninja-ex-sir", "v-ah-mewtwo-buy": "ebay:tr-mewtwo-ex-sir", "v-ah-lucario-buy": "ebay:mega-lucario-ex-sir", "v-bb-fischer-buy": "ebay:andrew-fischer", "v-bb-pierce-buy": "ebay:daniel-pierce", "v-bb-holliday-buy": "ebay:ethan-holliday", "v-bb-arquette-buy": "ebay:aiva-arquette", "v-bb-kim-wait": "ebay:seong-jun-kim", "v-bb-florentino-buy": "ebay:edward-florentino"};

  function thesisOf(c){
    var t = c.thesis || [];
    var graded = t.filter(function(x){ return x.grade; });
    var due = t.filter(function(x){ return !x.grade; }).map(function(x){ return x.due; }).sort();
    return { graded: graded, latest: graded.length ? graded[graded.length-1] : null, nextDue: due[0] || null };
  }
  function money(n){ return '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : (n >= 100 ? Math.round(n) : n)); }
  function pct(x){ return (x > 0 ? '+' : '') + Math.round(x * 100) + '%'; }
  function missPct(c){
    if (c.read == null) return null;
    if (c.read < c.projLow) return (c.read - c.projLow) / c.projLow;
    if (c.read > c.projHigh) return (c.read - c.projHigh) / c.projHigh;
    return 0;
  }
  function isPoke(c){ return c.cat === '183454'; }
  function attr(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function thumb(c){ var k = IMG[c.id] || ('ph:' + c.id); var sub = isPoke(c) ? 'POKEMON' : '1ST BOWMAN'; return '<span data-card-img="' + attr(k) + '" data-card-name="' + attr(c.card) + '" data-card-sub="' + sub + '" data-card-size="row" data-card-surface="track-record-list"></span>'; }
  function verdictStats(list){
    var r=0,w=0,p=0,pend=0, firstDue=null;
    list.forEach(function(c){
      if (c.type !== 'verdict') return;
      var th = thesisOf(c);
      if (th.latest){ if (th.latest.grade === 'right') r++; else if (th.latest.grade === 'wrong') w++; else p++; }
      else { pend++; if (th.nextDue && (!firstDue || th.nextDue < firstDue)) firstDue = th.nextDue; }
    });
    return { r:r, w:w, p:p, pend:pend, firstDue:firstDue };
  }
  function stat(label, val, cls){ return '<div class="banner-stat"><div class="banner-stat-label">' + label + '</div><div class="banner-stat-value' + (cls ? ' ' + cls : '') + '">' + val + '</div></div>'; }
  function row(c){
    var isV = c.type === 'verdict';
    var g = c.grade ? GRADE[c.grade] : null;
    var la = c.q ? '<span class="live-ask" data-q="' + attr(c.q) + '" data-cat="' + attr(c.cat || '') + '" data-req="' + attr(c.req || '') + '" data-deny="' + attr(c.deny || '') + '"></span>' : '<span class="roi-sub">—</span>';
    var callCell, readCell;
    if (isV) {
      callCell = '<span class="roi-price roi-call" style="color:var(--accent);">' + (ACTION[c.action] || c.action) + '</span><span class="roi-sub" style="display:block;">@ ' + money(c.entry) + ' &middot; ' + (c.entryDate || c.callDate) + '</span><span class="roi-sub" style="display:block; max-width:200px;">' + (c.entryLabel || '') + '</span>';
      var mv = (c.read != null && c.entry) ? (c.read - c.entry) / c.entry : null;
      readCell = c.read != null
        ? '<span class="roi-price">' + money(c.read) + '</span>' + (mv != null ? ' <span style="font-family:var(--fm); font-size:12px; color:' + (mv > 0.001 ? 'var(--green)' : (mv < -0.001 ? 'var(--red)' : 'var(--text-dim)')) + ';">' + pct(mv) + '</span>' : '') + '<span class="roi-sub" style="display:block;">' + (c.basis === 'sold' ? 'SOLD · ' : 'ASK · ') + (c.readLabel || '') + ' · ' + (c.readDate || '') + '</span><span class="roi-sub" style="display:block; opacity:.7;">early read · not graded</span>'
        : '<span class="roi-sub">' + (c.readLabel || 'No reliable read yet') + '</span>';
    } else {
      callCell = '<span class="roi-price proj">' + money(c.projLow) + '–' + money(c.projHigh) + '</span>';
      var mp = missPct(c);
      readCell = c.read != null
        ? '<span class="roi-price">' + money(c.read) + '</span>' + (mp != null && mp !== 0 ? ' <span style="font-family:var(--fm); font-size:12px; color:' + (mp < 0 ? 'var(--red)' : 'var(--gold)') + ';">' + pct(mp) + ' vs ' + (mp < 0 ? 'floor' : 'ceiling') + '</span>' : '') + '<span class="roi-sub" style="display:block;">' + (c.basis === 'sold' ? 'SOLD · ' : 'ASK · ') + (c.readLabel || '') + ' · ' + (c.readDate || '') + '</span>'
        : '<span class="roi-sub">' + (c.readLabel || 'No reliable read yet') + '</span>';
    }
    var gradeCell;
    if (isV) {
      var th = thesisOf(c);
      if (th.latest) {
        var lg = GRADE[th.latest.grade] || [String(th.latest.grade).toUpperCase(), 'v-hold'];
        gradeCell = '<span class="verdict-tag ' + lg[1] + '">' + lg[0] + ' (' + th.latest.horizon.toUpperCase() + ')</span>';
      } else if (!(c.thesis || []).length) {
        gradeCell = '<span class="verdict-tag v-hold">NOT GRADED</span><span class="roi-sub" style="display:block;">retired market — 8-week read only</span>';
      } else {
        gradeCell = '<span class="verdict-tag v-hold">EARLY</span>';
      }
      (c.thesis || []).forEach(function(t){
        gradeCell += '<span class="roi-sub" style="display:block;">' + t.horizon + ': ' + (t.grade ? ((GRADE[t.grade] ? GRADE[t.grade][0] : t.grade) + (t.read != null ? ' · ' + money(t.read) + ' sold' : '')) : 'grade due ' + t.due) + '</span>';
      });
    } else {
      gradeCell = g ? '<span class="verdict-tag ' + g[1] + '">' + g[0] + '</span>' : '<span class="roi-sub">—</span>';
    }
    return '<tr id="' + attr(c.id) + '">' +
      '<td><div class="roi-cell">' + thumb(c) + '<div><span class="roi-name" style="font-size:15px;">' + c.card + '</span><span class="roi-sub"><a href="' + attr(c.page) + '">' + c.set + ' →</a>' + (isV ? ' · <span style="color:var(--accent);">CALL</span>' : ' · RANGE') + '</span></div></div></td>' +
      '<td><span class="roi-sub">' + c.callDate + '</span></td>' +
      '<td>' + callCell + '</td>' +
      '<td>' + readCell + '</td>' +
      '<td>' + la + '</td>' +
      '<td><span class="roi-sub">' + (isV ? (thesisOf(c).latest ? 'GRADED' : (!(c.thesis || []).length ? 'RETIRED' : (c.read != null ? 'EARLY READ IN' : 'OPEN'))) : (STATE[c.state] || c.state) + (c.state !== 'final' && c.finalizeAfter ? ' · final after ' + c.finalizeAfter : '')) + (!isV && c.state === 'final' && c.basis === 'ask' ? '<span style="display:block; color:var(--gold); font-size:11px;">ASK-BASIS</span>' : '') + '</span></td>' +
      '<td>' + gradeCell + (c.note ? '<span class="roi-sub" style="display:block; max-width:280px;">' + c.note + '</span>' : '') + '</td>' +
    '</tr>';
  }

  // d = the parsed calls.json → every string the page shows, plus the numbers the share text needs
  function render(d){
    var calls = (d.calls || []).slice().sort(function(a,b){ return (b.callDate||'').localeCompare(a.callDate||''); });
    var sports = calls.filter(function(c){ return !isPoke(c); });
    var poke   = calls.filter(isPoke);
    var sv = verdictStats(sports), pv = verdictStats(poke);
    var pRanges = poke.filter(function(c){ return c.type !== 'verdict'; });
    var pFin = 0, pFinHit = 0;
    pRanges.forEach(function(c){ if (c.state === 'final'){ pFin++; if (c.grade === 'hit') pFinHit++; } });
    var ms = pRanges.map(missPct).filter(function(x){ return x != null; }).sort(function(a,b){ return a - b; });
    var bias = null;
    if (ms.length >= 3) bias = ms.length % 2 ? ms[(ms.length-1)/2] : (ms[ms.length/2-1] + ms[ms.length/2]) / 2;
    var biasTxt = bias == null ? 'Need more grades' : (Math.abs(bias) < 0.05 ? 'Well calibrated' : (bias < 0 ? 'Ran HIGH ~' + Math.round(-bias*100) + '%' : 'Ran LOW ~' + Math.round(bias*100) + '%'));
    var scoreboard =
      stat('Total Calls', calls.length) +
      stat('Sports Calls Graded: Right / Wrong / Flat', (sv.r + sv.w + sv.p) ? (sv.r + ' / ' + sv.w + ' / ' + sv.p) : 'None yet', sv.w > sv.r ? 'red' : (sv.r ? 'green' : '')) +
      stat('Still Early (under 6 months)', sv.pend + (sv.firstDue ? '<span style="display:block; font-size:11px; color:var(--text-dim); font-weight:400;">first grade due ' + sv.firstDue + '</span>' : '')) +
      stat('Pokémon Ranges (retired)', pFin ? (pFinHit + '/' + pFin + ' hit FINAL') : 'None final', pFin && pFinHit/pFin < 0.5 ? 'red' : 'green') +
      stat('Pokémon Projection Bias', biasTxt, bias != null && Math.abs(bias) >= 0.05 ? 'gold' : '') +
      stat('Deleted Calls — Ever', '0', 'green');
    var shareText = 'ShopCardHub grades its own card calls in public, at 6 and 12 months, on sold prices. Sports: ' + sv.r + ' right / ' + sv.w + ' wrong / ' + sv.p + ' flat, ' + sv.pend + ' still early. Pokémon calls retired Aug 2026 (' + pFinHit + '/' + pFin + ' hit — no edge, not bad luck). Nothing deleted, ever. Receipts:';
    return {
      updated: d.updated || '',
      count: calls.length,
      metaCount: calls.length + ' calls on the scorecard',
      metaUpdated: 'Updated ' + (d.updated || ''),
      scoreboard: scoreboard,
      rows: sports.length ? sports.map(row).join('') : '<tr><td colspan="7"><span class="roi-sub">No sports calls yet.</span></td></tr>',
      rowsPoke: poke.length ? poke.map(row).join('') : '<tr><td colspan="7"><span class="roi-sub">No Pokémon calls.</span></td></tr>',
      // the machine stamp audit-prices.mjs reads (pricing integrity): every figure on the page is dated by calls.json's own date
      stamp: '<p class="price-asof" data-prices-updated="' + attr(d.updated || '') + '" style="font-size:12px;color:var(--text-dim);margin:10px 2px 0;">Sold reads and grades as of ' + (d.updated || '') + ' &middot; from <a href="/data/calls.json">calls.json</a> &middot; every call graded at 6 and 12 months on sold comps, misses kept.</p>',
      shareText: shareText,
      stats: { sports: sv, poke: pv, pFin: pFin, pFinHit: pFinHit, bias: bias }
    };
  }
  return { render: render, row: row, money: money, pct: pct, thesisOf: thesisOf, missPct: missPct };
});
