/* should-i-grade.js — the grade-or-sell break-even tool on /should-i-grade-my-pokemon-card (Goal League, Wildcard, Oct 29 2026;
 * CoS BET-20261029-3). Pick a card, enter your own costs, see how often it has to come back a PSA 10 for grading to beat
 * selling it raw. Math, not a call: it never says "grade it" or "sell it".
 *
 * Data: our own static files, read in the browser — /data/card-search.json (the nav search list) for the picker, then
 * /data/cards/<tk>.json (raw sold mark, n, window, date) and /data/cards/g-<tk>.json (PSA 9 / PSA 10 / TAG 10 sold marks).
 * A graded figure is used only when it is a median of >= 3 dated sales whose titles name the grade (R18); otherwise the
 * card shows its one dated sale and no break-even.
 *
 * Break-even: sell raw now nets Rn = R(1-f) - o. Grading nets p*N10 + (1-p)*Nmiss - C, with N = price(1-f) - o.
 *   p* = (Rn + C - Nmiss) / (N10 - Nmiss).  p* <= 0: even a miss beats selling raw. p* > 1: a 10 doesn't cover it.
 * eBay exits: existing EPN search format (SCH_GLK phrase), customid = should-i-grade-my-pokemon-card-raw|-psa10|-tag10.
 * Events: grade_check (card picked; fired only here) and grade_click (eBay exit, an OUTBOUND event per page).
 * PSA tier (Nov 3 2026, CoS BET-20261102-1): Value $39.99 (declared value <= $500), Standard $59.99, Priority $79.99, each + $2.76
 * shipping/supplies over a 20-card batch. "auto" = Value when the card's PSA 10 median is under $500, else Standard. Typing a cost
 * switches the picker to "custom" and the typed cost is kept.
 */
(function () {
  var SLUG = 'should-i-grade-my-pokemon-card';
  var EPN = 'mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001';
  var root = document.getElementById('sg-tool'); if (!root) return;
  var q = document.getElementById('sg-q'), list = document.getElementById('sg-list'), out = document.getElementById('sg-out');
  var inp = { cost: document.getElementById('sg-cost'), fvf: document.getElementById('sg-fvf'), ord: document.getElementById('sg-ord'), raw: document.getElementById('sg-raw'), miss: document.getElementById('sg-miss') };
  var ALL = null, STATIC = {}, cur = null, files = {};
  var tierSel = document.getElementById('sg-tier');
  // caps = max declared value per card (PSA notices Sep 9 and Oct 28 2026, read Nov 5 2026); cost = fee + $2.76 shipping/supplies
  var TIER = { value: { name: 'PSA Value', cost: 42.75, cap: 500 }, standard: { name: 'PSA Standard', cost: 62.75, cap: 1000 }, priority: { name: 'PSA Priority', cost: 82.75, cap: 1500 }, express: { name: 'PSA Express', cost: 201.76, cap: 2500 }, premier: { name: 'PSA Premier', cost: 601.76, cap: 10000 } };
  var ORDER = ['value', 'standard', 'priority', 'express', 'premier'];
  function fitTier(ref) { if (ref == null) return 'standard'; for (var i = 0; i < ORDER.length; i++) if (ref <= TIER[ORDER[i]].cap) return ORDER[i]; return 'over'; }
  // auto: PSA's declared value is the card's graded worth, so use the PSA 10 median, else the PSA 9 median, else the raw median
  function tierNow(ref) { var t = tierSel ? tierSel.value : 'auto'; return t === 'auto' ? fitTier(ref) : t; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function md(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function money(n) { if (n == null || isNaN(n)) return ''; var neg = n < 0; n = Math.abs(n); var s = '$' + n.toLocaleString('en-US', n >= 100 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return neg ? '−' + s : s; }
  function num(el, dflt) { var v = parseFloat(String(el && el.value || '').replace(/[$,%\s]/g, '')); return isNaN(v) ? dflt : v; }
  function ga(ev, p) { try { if (typeof gtag === 'function') gtag('event', ev, Object.assign({ page: location.pathname }, p)); } catch (e) {} }
  function get(u) { return fetch(u, { cache: 'default' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9#/ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  var ALIAS = { moonbreon: 'umbreon vmax 215 evolving', zard: 'charizard', mewtwo: 'mewtwo' };

  function loadList() {
    if (ALL) return Promise.resolve(ALL);
    return Promise.all([get('/data/card-search.json'), get('/js/card-pages.json').catch(function () { return null; })]).then(function (r) {
      STATIC = (r[1] && r[1].static) || {};
      ALL = (r[0].cards || []).filter(function (c) { return c[3] != null && !/outside the level/.test(c[2]); })
        .map(function (c) { return { id: c[0], label: c[1], set: c[2], raw: c[3], hay: norm(c[1] + ' ' + c[2] + ' ' + c[0].split('-')[0]) }; });
      return ALL;
    });
  }
  function search(text) {
    var t = norm(text); if (ALIAS[t]) t = ALIAS[t];
    var words = t.split(' ').filter(Boolean); if (!words.length) return [];
    var hits = [];
    for (var i = 0; i < ALL.length && hits.length < 400; i++) {
      var c = ALL[i], ok = true;
      for (var j = 0; j < words.length; j++) { var w = words[j].replace(/^#/, ''); if (c.hay.indexOf(w) < 0) { ok = false; break; } }
      if (ok) hits.push(c);
    }
    hits.sort(function (a, b) { return b.raw - a.raw; });
    return hits.slice(0, 12);
  }
  function showList(items) {
    list.innerHTML = items.length ? items.map(function (c, i) {
      return '<li role="option" id="sg-o' + i + '" data-id="' + esc(c.id) + '"><b>' + esc(c.label) + '</b><span>' + esc(c.set) + '</span></li>';
    }).join('') : (q.value.trim().length > 1 ? '<li class="sg-none">No card on file by that name. Try the Pokémon name and number, like “Charizard 4”.</li>' : '');
    list.hidden = !list.innerHTML;
    q.setAttribute('aria-expanded', list.hidden ? 'false' : 'true');
  }
  var tmr;
  q.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(function () { loadList().then(function () { showList(search(q.value)); }); }, 120); });
  q.addEventListener('focus', function () { loadList(); });
  q.addEventListener('keydown', function (e) {
    var items = list.querySelectorAll('li[data-id]'); if (!items.length) return;
    var at = -1; items.forEach(function (li, i) { if (li.classList.contains('on')) at = i; });
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (at >= 0) items[at].classList.remove('on'); at = e.key === 'ArrowDown' ? Math.min(items.length - 1, at + 1) : Math.max(0, at - 1); items[at].classList.add('on'); q.setAttribute('aria-activedescendant', items[at].id); }
    else if (e.key === 'Enter') { e.preventDefault(); pick((items[at >= 0 ? at : 0]).getAttribute('data-id'), true); }
    else if (e.key === 'Escape') { list.hidden = true; }
  });
  list.addEventListener('click', function (e) { var li = e.target.closest('li[data-id]'); if (li) pick(li.getAttribute('data-id'), true); });
  document.addEventListener('click', function (e) { var a = e.target.closest('a[data-sg-pick]'); if (a) { e.preventDefault(); pick(a.getAttribute('data-sg-pick'), true); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  Object.keys(inp).forEach(function (k) { if (inp[k]) inp[k].addEventListener('input', function () { if (k === 'cost' && tierSel) tierSel.value = 'custom'; if (cur) render(); }); });
  if (tierSel) tierSel.addEventListener('change', function () { var t = tierSel.value; if (TIER[t]) inp.cost.value = TIER[t].cost.toFixed(2); else if (t === 'custom') inp.cost.focus(); if (cur) render(); });

  function tkFile(tk) {
    if (files[tk]) return files[tk];
    files[tk] = Promise.all([get('/data/cards/' + tk + '.json'), get('/data/cards/g-' + tk + '.json').catch(function () { return null; })]);
    return files[tk];
  }
  function pick(id, byUser) {
    var tk = String(id).split('-')[0];
    list.hidden = true; q.setAttribute('aria-expanded', 'false');
    out.innerHTML = '<p class="sg-wait">Loading the sales for this card…</p>';
    tkFile(tk).then(function (r) {
      var d = r[0], gd = r[1], c = null;
      for (var i = 0; i < d.cards.length; i++) if (d.cards[i].id === id) { c = d.cards[i]; break; }
      if (!c) { out.innerHTML = '<p class="sg-wait">That card isn’t in our files right now. Try another.</p>'; return; }
      var g = gd && gd.cards ? gd.cards[c.key || c.num] || null : null;
      cur = { d: d, c: c, g: g, gd: gd };
      q.value = c.name + ' #' + c.num + ' · ' + String(d.set).replace(/^Pokémon TCG /, '');
      if (inp.raw) inp.raw.value = ''; if (inp.miss) inp.miss.value = '';
      render();
      if (byUser) { ga('grade_check', { item: id }); try { history.replaceState(null, '', '#' + id); } catch (e) {} }
    }).catch(function () { out.innerHTML = '<p class="sg-wait">Couldn’t load this card’s sales. Try again in a moment.</p>'; });
  }

  function mark(x) {
    if (x && x.m && x.n >= 3) return { m: x.m, n: x.n, days: x.basis === '30d' ? 30 : 90 };
    return null;
  }
  function ebay(g) {
    var d = cur.d, c = cur.c, tk = String(d.ticker || c.id.split('-')[0]).toLowerCase();
    var ed = d.ed === '1st' || d.ed === 'shadowless' ? d.ed : !!d.wotc;
    var ph = window.SCH_GLK ? SCH_GLK.phrase(c.q || c.name, g === 'tag10' ? 'tag' : g, ed, tk) : (c.q || c.name) + (g === 'psa10' ? ' psa 10' : g === 'tag10' ? ' "TAG 10"' : '');
    var nkw = encodeURIComponent(ph.replace(/\s+/g, ' ').trim()).replace(/%20/g, '+').replace(/'/g, '%27').replace(/[!()*]/g, function (ch) { return '%' + ch.charCodeAt(0).toString(16).toUpperCase(); });
    return 'https://www.ebay.com/sch/i.html?_nkw=' + nkw + '&_sacat=183454&LH_BIN=1&' + EPN + '&customid=' + SLUG + '-' + g;
  }
  function btn(g, label, primary) {
    return '<a class="sg-eb' + (primary ? ' pri' : '') + '" href="' + esc(ebay(g)) + '" target="_blank" rel="sponsored nofollow noopener" data-g="' + g + '">' + label + ' on eBay →</a>';
  }

  function render() {
    var d = cur.d, c = cur.c, g = cur.g, gd = cur.gd;
    var setShort = String(d.set).replace(/^Pokémon TCG /, '');
    var gRead = (g && g.asOf) || (gd && gd.day) || '';
    var m9 = mark(g && g.psa9), m10 = mark(g && g.psa10), mT = mark(g && g.tag10);
    var rawN = c.wn != null ? c.wn : c.n30, rawWin = c.win || d.window || 30;
    // no raw figure unless it is a dated eBay sold median with a count (chase-set raws are an outside value, not our sales)
    var screened = (c.screened && c.why === 'screen') || d.kind === 'chase' || (c.wn == null && c.n30 == null);
    var m10early = mark(g && g.psa10), m9early = mark(g && g.psa9);
    var ref = m10early ? m10early.m : m9early ? m9early.m : (c.raw != null && !(d.kind === 'chase') ? c.raw : null), tier = tierNow(ref);
    if (TIER[tier] && tierSel && tierSel.value === 'auto') inp.cost.value = TIER[tier].cost.toFixed(2);
    var cost = num(inp.cost, 62.75), f = num(inp.fvf, 13.25) / 100, o = num(inp.ord, 0.40);
    var tierName = TIER[tier] && Math.abs(cost - TIER[tier].cost) < 0.005 ? TIER[tier].name : '';
    var atCost = 'At ' + money(cost) + ' a card' + (tierName ? ' (' + tierName + ')' : '');
    var fit = fitTier(ref), capFmt = function (n) { return '$' + n.toLocaleString('en-US'); };
    var capNote = tier === 'over' ? '<p class="sg-fine">This card’s graded median is over $10,000. PSA has tiers above that, but we couldn’t read their limits, so type your PSA cost under “Your costs”.</p>'
      : TIER[tier] && ref != null && ref > TIER[tier].cap ? '<p class="sg-fine">This card’s graded median is over ' + capFmt(TIER[tier].cap) + ', and ' + TIER[tier].name + ' only takes cards declared at ' + capFmt(TIER[tier].cap) + ' or less. ' + (TIER[fit] ? TIER[fit].name + ' is the cheapest PSA tier that fits.' : 'Its PSA tier is above the ones we list.') + '</p>' : '';
    var R = num(inp.raw, screened ? null : c.raw);
    var net = function (p) { return p * (1 - f) - o; };
    var page = STATIC[c.id] || '/card?id=' + encodeURIComponent(c.id);

    function cell(lbl, x, one, extra, held) {
      if (x) return '<div class="sg-c"><span class="k">' + lbl + '</span><b>' + money(x.m) + '</b><span class="s">median of ' + x.n + ' sales, ' + x.days + ' days' + (extra || '') + '</span></div>';
      if (one) return '<div class="sg-c dim"><span class="k">' + lbl + '</span><b>' + money(one.p) + '</b><span class="s">1 dated sale, ' + md(one.d) + '. Fewer than 3 sales, so no median</span></div>';
      // held by the ladder guards (build-card-ladder.mjs, Nov 3 2026): the sales on file disagree, so nothing prints or feeds the math
      if (held) return '<div class="sg-c dim"><span class="k">' + lbl + '</span><b>No verified sale</b><span class="s">sales on file are being checked</span></div>';
      return '<div class="sg-c dim"><span class="k">' + lbl + '</span><b>—</b><span class="s">no dated sale in 12 months</span></div>';
    }
    var rawCell = screened || c.raw == null ? '<div class="sg-c dim"><span class="k">Raw</span><b>—</b><span class="s">no dated raw sales median on file; enter your copy’s raw value under “Your costs”</span></div>'
      : '<div class="sg-c"><span class="k">Raw</span><b>' + money(c.raw) + '</b><span class="s">median of ' + rawN + ' sales, ' + rawWin + ' days, marked ' + md(c.rawAsOf) + '</span></div>';
    var ladder = '<div class="sg-lad">' + rawCell + cell('PSA 9', m9, g && g.psa9 && g.psa9.last, '', g && g.psa9 && g.psa9.held) + cell('PSA 10', m10, g && g.psa10 && g.psa10.last, '', g && g.psa10 && g.psa10.held) + cell('TAG 10', mT, g && g.tag10 && g.tag10.last, '', g && g.tag10 && g.tag10.held) + '</div>';

    var head, rows = '', p = null;
    var missP = num(inp.miss, m9 ? m9.m : null);
    if (R == null) head = 'We don’t have a dated raw sales median for this card. Open “Your costs” and type what your copy would sell for raw to run the numbers.';
    else if (!m10) head = 'Not enough PSA 10 sales in the last 90 days to work out a break-even for this card.';
    else if (missP == null) head = 'Not enough PSA 9 sales to price a miss. Type what a miss would sell for in the box below.';
    else {
      var Rn = net(R), N10 = net(m10.m), Nm = net(missP);
      if (!(N10 > Nm)) head = 'In this window PSA 10s sold for no more than the miss price, so there’s no break-even to show. That usually means thin or odd sales. Check the dates above.';
      else {
        p = (Rn + cost - Nm) / (N10 - Nm);
        var pp = p < 0.01 ? 'under 1%' : Math.round(p * 100) + '%';
        head = p > 1 ? atCost + ', even a PSA 10 nets less than selling this copy raw.'
          : p <= 0 ? atCost + ', a copy that comes back a 9 still nets more than selling it raw.'
          : atCost + ', grading this one pays if more than <b>' + pp + '</b> of your copies come back PSA 10.';
        var vs = function (v) { var dlt = v - Rn; return ' <span class="' + (dlt >= 0 ? 'up' : 'dn') + '">' + (dlt >= 0 ? '+' : '') + money(dlt) + ' vs raw</span>'; };
        rows = '<ul class="sg-rows">' +
          '<li>Sell it raw now: <b>' + money(Rn) + '</b> after eBay fees</li>' +
          '<li>Grade it, comes back ' + (inp.miss && inp.miss.value ? 'a miss' : 'a PSA 9') + ': <b>' + money(Nm - cost) + '</b> after fees and grading' + vs(Nm - cost) + '</li>' +
          '<li>Grade it, comes back a PSA 10: <b>' + money(N10 - cost) + '</b>' + vs(N10 - cost) + '</li>' +
          (mT ? '<li>Comes back a TAG 10 instead: <b>' + money(net(mT.m) - cost) + '</b>' + vs(net(mT.m) - cost) + ' <span class="s">(TAG 10 median of ' + mT.n + ' sales; put TAG’s fee under “Your costs” if you send there)</span></li>' : '') +
          '</ul>';
      }
    }
    var meter = p != null && p > 0 && p <= 1 ? '<div class="sg-meter" aria-hidden="true"><i style="width:' + Math.max(2, Math.round(p * 100)) + '%"></i></div>' : '';
    out.innerHTML = '<div class="sg-card"><div class="sg-top"><h3><a href="' + esc(page) + '">' + esc(c.name) + ' #' + esc(c.num) + '</a></h3><span class="sg-set">' + esc(setShort) + (gRead ? ' · graded sales read ' + md(gRead) : '') + '</span></div>' +
      ladder + '<p class="sg-hl">' + head + '</p>' + meter + rows + capNote +
      '<p class="sg-fine">Grading cost ' + money(cost) + ' a card' + (tierName ? ' (' + tierName + ', all in)' : '') + ', eBay fees ' + (f * 100).toFixed(2).replace(/\.?0+$/, '') + '% + ' + money(o) + '. Change them under “Your costs”.</p><div class="sg-btns">' + btn('raw', 'Raw copies', false) + btn('psa10', 'PSA 10', true) + btn('tag10', 'TAG 10', false) + '</div>' +
      '<p class="sg-fine">Live eBay searches for this card with our affiliate tag (we may earn a commission). They show listings, not prices. The math assumes misses sell at the PSA 9 median and leaves out turnaround time. The raw median includes played copies; a copy clean enough to get a 10 often sells for more raw, so put your copy’s value in the box if you know it.</p></div>';
    out.querySelectorAll('a.sg-eb').forEach(function (a) { a.addEventListener('click', function () { ga('grade_click', { grade: a.getAttribute('data-g'), mode: 'bin', item: SLUG + '-' + a.getAttribute('data-g') + ':' + c.id }); }); });
  }

  var h = decodeURIComponent((location.hash || '').slice(1));
  if (/^[a-z0-9]+-[a-z0-9-]+$/i.test(h)) loadList().then(function () { pick(h, false); });
})();
