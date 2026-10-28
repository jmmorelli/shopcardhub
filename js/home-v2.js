/* home-v2.js — the Seeking-Alpha-style home (P0-B, Oct 23 2026; Mo: "push all of this live tonight"). Shared by / and the
 * /home-v2 preview. Everything numeric is baked into the page by tools/build-home.mjs (lib/home-v2.mjs) inside the HOME:idxbox /
 * HOME:releases / HOME:movers2 markers plus the <script id="h2-data"> payload; this file only toggles tabs, draws the mini chart,
 * counts the levels up, and fills the three client-side tiles (deals, auctions, watchlist) and the search box. With JS off the
 * baked rows stand. Nothing here writes storage; the watchlist tile only reads sch_vault_v1. */
(function () {
  'use strict';
  var dataEl = document.getElementById('h2-data'); if (!dataEl) return;
  var D = JSON.parse(document.getElementById('h2-data').textContent);
  var T = D.t, MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var RM = false; try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var mdy = function (d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return MON[+p[1] - 1] + ' ' + (+p[2]); };
  var mly = function (ym) { var p = String(ym).split('-'); return MON[+p[1] - 1] + ' \u2019' + p[0].slice(2); };
  var cls = function (v) { return v == null ? 'fl' : v > 0 ? 'up' : v < 0 ? 'dn' : 'fl'; };
  var sgn = function (v, d) { return v == null ? '\u2014' : (v > 0 ? '+' : '') + v.toFixed(d == null ? 1 : d) + '%'; };
  var money = function (n) { return n == null ? '' : '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 100 ? String(Math.round(n)) : n.toFixed(2)); };
  var ga = function (ev, p) { try { if (typeof gtag === 'function') gtag('event', ev, Object.assign({ page: location.pathname }, p || {})); } catch (e) {} };

  /* ---------- the index box ---------- */
  var rowsEl = document.getElementById('h2-rows');
  var selTab = document.querySelector('.h2-tab[aria-selected="true"]');
  var tab = selTab ? selTab.getAttribute('data-tab') : D.tabs[0].id, cur = D.def, range = 'MAX', firstPaint = true;
  function countUp(el, to, dec) {
    if (RM || !(to > 0)) { el.textContent = to.toFixed(dec); return; }
    var t0 = null, from = 0, done = false;
    function step(ts) { if (done) return; if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 600), e = 1 - Math.pow(1 - k, 3); el.textContent = (from + (to - from) * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); else done = true; }
    requestAnimationFrame(step);
    setTimeout(function () { done = true; el.textContent = to.toFixed(dec); }, 900);   // a background tab gets no animation frames; the real number lands anyway
  }
  function renderRows() {
    Array.prototype.forEach.call(rowsEl.querySelectorAll('tr[data-tk]'), function (tr) {
      var on = tr.getAttribute('data-tab') === tab;
      tr.hidden = !on;
      tr.setAttribute('aria-selected', String(on && tr.getAttribute('data-tk') === cur));
    });
    if (firstPaint) { Array.prototype.forEach.call(rowsEl.querySelectorAll('tr:not([hidden]) td.ib-lvl'), function (td) { var v = parseFloat(td.textContent); if (isFinite(v)) countUp(td, v, 2); }); }
    var sel = rowsEl.querySelector('tr[aria-selected="true"]'); if (sel && !firstPaint && sel.scrollIntoView) try { sel.scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }
  function pts(v) {
    var out = v.r.map(function (r) { return { t: Date.parse(r[0] + '-15T00:00:00Z'), v: r[1], rc: 1, d: r[0] }; })
      .concat(v.h.map(function (r) { return { t: Date.parse(r[0] + 'T00:00:00Z'), v: r[1], rc: 0, d: r[0] }; }));
    return out.sort(function (a, b) { return a.t - b.t; });
  }
  var DAYS = { '1M': 31, '6M': 183, '1Y': 366 };
  function rangeOk(v, r) {
    var all = pts(v); if (r === 'MAX') return all.length >= 2;
    var last = all[all.length - 1].t, from = last - DAYS[r] * 864e5;
    var inR = all.filter(function (p) { return p.t >= from; });
    if (inR.length < 2) return false;
    return all[0].t <= from + 20 * 864e5 || r === '1M';   // a range the history can't cover is hidden (6M on a 5-week-old set)
  }
  function chart(v) {
    var all = pts(v), last = all[all.length - 1];
    var sel = range === 'MAX' ? all : all.filter(function (p) { return p.t >= last.t - DAYS[range] * 864e5; });
    if (sel.length < 2) sel = all.slice(-2);
    var el = document.getElementById('h2-chart'); var W = Math.max(260, Math.round(el.clientWidth || 560)), H = W < 420 ? 190 : 210, pl = 8, pr = 46, pt = 14, pb = 22;
    var lv = sel.map(function (p) { return p.v; }).concat([100]);
    var lo = Math.log(Math.min.apply(null, lv)), hi = Math.log(Math.max.apply(null, lv)), pad = Math.max((hi - lo) * 0.12, 0.03), y0 = lo - pad, y1 = hi + pad;
    var t0 = sel[0].t, t1 = sel[sel.length - 1].t;
    var X = function (tt) { return pl + ((tt - t0) / ((t1 - t0) || 1)) * (W - pl - pr); }, Y = function (val) { return pt + (1 - (Math.log(val) - y0) / (y1 - y0)) * (H - pt - pb); };
    var path = function (a) { return a.map(function (p, i) { return (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' '); };
    var live = sel.filter(function (p) { return !p.rc; }), rec = sel.filter(function (p) { return p.rc; });
    if (rec.length && live.length) rec.push(live[0]);
    var area = path(sel) + ' L' + X(t1).toFixed(1) + ' ' + (H - pb) + ' L' + X(t0).toFixed(1) + ' ' + (H - pb) + ' Z';
    var ref = '<line class="ref" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(100).toFixed(1) + '" y2="' + Y(100).toFixed(1) + '"/><text x="' + (W - pr + 6) + '" y="' + (Y(100) + 4).toFixed(1) + '">100</text>';
    var xl = '', lastX = -1e9, n = 4;
    for (var i = 0; i <= n; i++) { var tt = t0 + (t1 - t0) * i / n, best = sel[0]; sel.forEach(function (p) { if (Math.abs(p.t - tt) < Math.abs(best.t - tt)) best = p; }); var x = X(best.t); if (x - lastX < 80) continue; lastX = x;
      xl += '<text x="' + x.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === n ? 'end' : i === 0 ? 'start' : 'middle') + '">' + esc(best.rc ? mly(best.d) : mdy(best.d)) + '</text>'; }
    var e = sel[sel.length - 1], ex = X(e.t), ey = Y(e.v);
    el.classList.toggle('dn', e.v < 100);
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(v.n) + ' index, ' + esc(range === 'MAX' ? 'since the set came out' : 'last ' + range) + '">' +
      '<path class="ar" d="' + area + '"/>' + ref +
      (rec.length > 1 ? '<path class="ln rc" d="' + path(rec) + '"/>' : '') + (live.length > 1 ? '<path class="ln lv" d="' + path(live) + '"/>' : '') +
      '<circle class="dot" cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="3.5"/><text class="last" x="' + (ex - 6).toFixed(1) + '" y="' + (ey < pt + 16 ? ey + 16 : ey - 8).toFixed(1) + '" text-anchor="end">' + e.v.toFixed(2) + '</text>' + xl + '</svg>';
    if (!RM) Array.prototype.forEach.call(el.querySelectorAll('path.ln'), function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = p.classList.contains('rc') ? '5 4' : L; p.style.strokeDashoffset = L; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 550ms ease-out'; p.style.strokeDashoffset = '0'; });
    var first = sel[0];
    document.getElementById('h2-cap').innerHTML = '<span>' + (rec.length ? '<i class="rc"></i>monthly \u00b7 ' : '') + (live.length > 1 ? '<i></i>live' : '') + '</span><span>' + esc(first.rc ? mly(first.d) : mdy(first.d)) + ' \u2192 ' + esc(mdy(e.d)) + (range === 'MAX' && v.br === 'first-reliable' ? ' \u00b7 100 = ' + esc(mly(v.bd)) : '') + '</span>';
  }
  function paintViz(animate) {
    var v = T[cur];
    document.getElementById('h2-vnm').innerHTML = esc(v.n) + '<small>' + esc(cur) + ' \u00b7 as of ' + esc(mdy(v.d)) + '</small>';
    var lvEl = document.getElementById('h2-vlv'); if (animate) countUp(lvEl, v.l, 2); else lvEl.textContent = v.l.toFixed(2);
    var wk = document.getElementById('h2-vwk'); wk.className = cls(v.w); wk.textContent = v.w == null ? 'first week' : (v.w > 0 ? '\u25b2 ' : v.w < 0 ? '\u25bc ' : '') + sgn(v.w, 1) + ' this week';
    wk.title = v.wd ? 'vs the ' + mdy(v.wd) + ' mark' : '';
    document.getElementById('h2-vsn').textContent = (v.s > 0 ? '+' : '') + v.s.toFixed(0) + '% ' + v.sl;
    Array.prototype.forEach.call(document.querySelectorAll('#h2-rng button'), function (b) { var r = b.getAttribute('data-r'); b.hidden = !rangeOk(v, r); });
    if (!rangeOk(v, range)) range = 'MAX';
    Array.prototype.forEach.call(document.querySelectorAll('#h2-rng button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-r') === range)); });
    chart(v);
    var buy = document.getElementById('h2-buy'), row = rowsEl.querySelector('tr[data-tk="' + cur + '"]'), bh = row && row.getAttribute('data-buy');
    if (bh) { buy.hidden = false; buy.href = bh; buy.textContent = row.getAttribute('data-buy-l') || 'Buy on eBay \u2192'; } else buy.hidden = true;
    var op = document.getElementById('h2-open'); op.href = v.p; op.textContent = 'Every card in ' + v.n + ' \u2192';
  }
  function select(tk) { if (!T[tk]) return; cur = tk; Array.prototype.forEach.call(rowsEl.querySelectorAll('tr'), function (tr) { tr.setAttribute('aria-selected', String(tr.getAttribute('data-tk') === tk)); }); paintViz(false); ga('home2_index_pick', { ticker: tk }); }
  rowsEl.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-tk]'); if (tr) select(tr.getAttribute('data-tk')); });
  rowsEl.addEventListener('keydown', function (e) { var tr = e.target.closest('tr[data-tk]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(tr.getAttribute('data-tk')); } });
  Array.prototype.forEach.call(document.querySelectorAll('.h2-tab'), function (b) {
    b.addEventListener('click', function () {
      tab = b.getAttribute('data-tab');
      Array.prototype.forEach.call(document.querySelectorAll('.h2-tab'), function (x) { x.setAttribute('aria-selected', String(x === b)); });
      var first = rowsEl.querySelector('tr[data-tab="' + tab + '"]'); cur = first ? first.getAttribute('data-tk') : cur;
      renderRows(); paintViz(false); ga('home2_index_tab', { tab: tab });
    });
  });
  document.getElementById('h2-rng').addEventListener('click', function (e) { var b = e.target.closest('button[data-r]'); if (!b) return; range = b.getAttribute('data-r'); paintViz(false); });
  renderRows(); paintViz(true); firstPaint = false;
  var rz = null, lastW = document.getElementById('h2-chart').clientWidth;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { var w = document.getElementById('h2-chart').clientWidth; if (Math.abs(w - lastW) > 24) { lastW = w; var keep = RM; RM = true; chart(T[cur]); RM = keep; } }, 150); });

  /* ---------- what moved this week: all four lists are baked (HOME:movers2, cards/sets × up/down); the two toggles show one ---------- */
  (function () {
    var tile = document.getElementById('h2-mvh'); tile = tile && tile.closest('.h2-tile'); if (!tile) return;
    var view = 'cards', dir = 'up';
    function paint() {
      Array.prototype.forEach.call(tile.querySelectorAll('ul[data-view]'), function (ul) { ul.hidden = !(ul.getAttribute('data-view') === view && ul.getAttribute('data-dir') === dir); });
      Array.prototype.forEach.call(tile.querySelectorAll('small[data-view]'), function (s) { s.hidden = s.getAttribute('data-view') !== view; });
      Array.prototype.forEach.call(tile.querySelectorAll('.tog button[data-view]'), function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-view') === view)); });
      Array.prototype.forEach.call(tile.querySelectorAll('.tog button[data-dir]'), function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-dir') === dir)); });
    }
    tile.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.tog button'); if (!b) return;
      if (b.hasAttribute('data-view')) view = b.getAttribute('data-view'); else if (b.hasAttribute('data-dir')) dir = b.getAttribute('data-dir'); else return;
      paint(); ga('home2_movers_toggle', { view: view, dir: dir });
    });
  })();

  /* ---------- /#screen=<id> (rail saved screens) lives inside the collapsed "More" fold on /: open it so js/home.js can scroll there ---------- */
  (function () { var more = document.querySelector('.h2-more'); if (!more) return; var openIf = function () { if (/screen=/.test(location.hash || '')) more.open = true; }; openIf(); window.addEventListener('hashchange', openIf);
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href*="screen="]'); if (a) more.open = true; }, true); })();

  /* ---------- coming out: the bake is Monday's; hide rows whose date has passed since ---------- */
  try { var today = new Date().toISOString().slice(0, 10); Array.prototype.forEach.call(document.querySelectorAll('[data-home="releases"] li[data-date]'), function (li) { if (li.getAttribute('data-date') < today) li.hidden = true; }); } catch (e5) {}

  /* ---------- below the mark: refresh from /api/deals (same feed as /deals) ---------- */
  var GL = { raw: 'Raw', psa9: 'PSA 9', psa10: 'PSA 10', sealed: 'Sealed' };
  fetch('/api/deals').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
    var now = Date.now(), seen = {}, rows = (j.rows || []).filter(function (r) { return r && r.url && isFinite(r.total) && isFinite(r.mark) && (!r.ends || new Date(r.ends).getTime() > now); }).sort(function (a, b) { return a.disc - b.disc; }).filter(function (r) { var k = r.cardId + '|' + r.grade; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 5);
    if (!rows.length) { document.getElementById('h2-dl').innerHTML = '<li class="empty">Nothing under our recent-sales price right now. A deal is the exception, not the shelf. <a href="/deals">Deals \u2192</a></li>'; return; }
    document.getElementById('h2-dl').innerHTML = rows.map(function (r) { var href = r.cardHref || r.page;
      return '<li><span class="nm">' + (href ? '<a href="' + esc(href) + '">' : '<b>') + esc(r.card) + (r.num ? ' #' + esc(r.num) : '') + (href ? '</a>' : '</b>') + '<small><span class="h2-g ' + esc(r.grade) + '">' + esc(GL[r.grade] || r.grade) + '</span>' + esc(T[r.tk] ? T[r.tk].n : r.idx) + ' \u00b7 recent sales ' + esc(money(r.mark)) + (r.markAsOf ? ' \u00b7 ' + esc(mdy(r.markAsOf)) : '') + '</small></span>' +
        '<span class="rt"><span class="px">' + esc(money(r.total)) + '</span><span class="ch up">' + Math.round(r.disc * 100) + '%</span><a class="btn" href="' + esc(r.url) + '" target="_blank" rel="noopener sponsored">Buy \u2192</a></span></li>'; }).join('');
    if (j.generated) document.getElementById('h2-dls').textContent = 'Buy It Now \u00b7 screened ' + mdy(j.generated);
  }).catch(function () { document.getElementById('h2-dl').innerHTML = '<li class="empty">Couldn\u2019t reach the deals feed just now. <a href="/deals">Deals \u2192</a></li>'; });

  /* ---------- auctions ending soon: /api/auctions (the Auction Desk feed) ---------- */
  var au = document.getElementById('h2-au');
  var ends = function (iso) { var ms = new Date(iso).getTime() - Date.now(); if (!(ms > 0)) return 'ending'; var h = ms / 36e5; return h < 1 ? Math.max(1, Math.round(ms / 6e4)) + 'm' : h < 48 ? Math.round(h) + 'h' : Math.round(h / 24) + 'd'; };
  fetch('/api/auctions').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
    var now = Date.now(), rows = (j.rows || []).filter(function (r) { return r && r.url && r.endDate && new Date(r.endDate).getTime() > now && isFinite(r.total); }).sort(function (a, b) { return new Date(a.endDate) - new Date(b.endDate); }).slice(0, 5);
    if (!rows.length) { au.innerHTML = '<li class="empty">' + (j.source === 'empty' || j.tripped ? 'The live auction feed is resting (eBay call limit for today). ' : 'No verified auction is live right now. ') + '<a href="/auctions">Auction Desk \u2192</a></li>'; return; }
    au.innerHTML = rows.map(function (r) { var nm = String(r.label || '').split(' \u2014 ')[0];
      return '<li title="' + esc((r.bidCount || 0) + ' bids \u00b7 ends ' + new Date(r.endDate).toLocaleString()) + '"><span class="nm"><b>' + esc(nm) + '</b><small>' + esc(String(r.label || '').split(' \u2014 ')[1] || r.cardType || '') + ' \u00b7 ends in ' + ends(r.endDate) + (r.bidCount != null ? ' \u00b7 ' + r.bidCount + ' bid' + (r.bidCount === 1 ? '' : 's') : '') + '</small></span>' +
        '<span class="rt"><span class="px">' + esc(money(r.total)) + '</span><a class="btn bid" href="' + esc(r.url) + '" target="_blank" rel="noopener sponsored">Bid \u2192</a></span></li>'; }).join('');
    var asOf = j.generated && (Date.now() - new Date(j.generated).getTime()) > 20 * 60000 ? ' \u00b7 as of ' + new Date(j.generated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
    document.getElementById('h2-aus').textContent = rows.length + ' of ' + (j.count || rows.length) + ' live' + asOf;
  }).catch(function () { au.innerHTML = '<li class="empty">Couldn\u2019t reach the live auction feed just now. <a href="/auctions">Auction Desk \u2192</a></li>'; });

  /* ---------- your watchlist: localStorage sch_vault_v1 (written by js/vault-track.js and /watchlist; nothing leaves the device) ---------- */
  (function () {
    var wl = document.getElementById('h2-wl'), store = null;
    try { store = JSON.parse(localStorage.getItem('sch_vault_v1') || 'null'); } catch (e) {}
    var cards = ((store && store.cards) || []).filter(function (c) { return c && c.name; });
    if (!cards.length) { wl.innerHTML = '<li class="empty">Nothing watched yet. Tap \u2605 on any card and it shows up here with its latest price. No account \u2014 it stays in this browser.</li>'; return; }
    var rows = cards.map(function (c) { var ps = (c.prices || []).filter(function (p) { return p && isFinite(p.p) && p.p > 0; }); return { name: c.name, set: c.set || '', last: ps.length ? ps[ps.length - 1].p : null, move: ps.length > 1 ? (ps[ps.length - 1].p / ps[0].p - 1) * 100 : null }; })
      .sort(function (a, b) { return Math.abs(b.move || 0) - Math.abs(a.move || 0); }).slice(0, 5);
    wl.innerHTML = rows.map(function (r) { return '<li><span class="nm"><b>' + esc(r.name) + '</b><small>' + esc(r.set || 'on your watchlist') + '</small></span><span class="rt"><span class="px">' + (r.last == null ? '' : esc(money(r.last))) + '</span><span class="ch ' + cls(r.move) + '">' + (r.move == null ? 'new' : sgn(r.move, 1)) + '</span></span></li>'; }).join('');
    if (cards.length > 5) wl.insertAdjacentHTML('beforeend', '<li class="empty"><a href="/watchlist">' + cards.length + ' cards on your watchlist \u2192</a></li>');
  })();

  /* ---------- search: cards (/data/card-search.json, the header's list) first, set pages after, eBay on a miss ---------- */
  (function () {
    var input = document.getElementById('h2-q'), res = document.getElementById('h2-sres'), CARDS = null, P = null, sel = -1;
    var nk = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
    var SETS = D.sets.map(function (s) { return { t: s.t, tk: s.tk, u: s.u, n: nk(s.t + ' ' + s.tk) }; });
    var PK = /pok[e\u00e9]mon|pikachu|charizard|gengar|mewtwo|lugia|umbreon|eevee|darkrai|greninja|prismatic|ascended|\btcg\b/i;
    var EPN = 'mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001';
    var miss = function (q) { var pk = PK.test(q), t = pk && !/pok[e\u00e9]mon/i.test(q) ? 'pokemon ' + q : q; return 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(t.replace(/\s+/g, ' ').trim()).replace(/%20/g, '+') + '&_sacat=' + (pk ? '183454' : '212') + '&LH_BIN=1&' + EPN + '&customid=search-miss'; };
    // Night Crew Oct 26: js/card-pages.json (tools/build-nav.js) maps a card id to its static /card-<slug> page and lists the
    // hand-built card pages (Bowman engine pages: Ethan Holliday …) that card-search.json does not carry — the header search had
    // them since B74, this box did not ("ethan holliday" → 0 on Oct 26).
    var SPAGE = {}, PAGES = [];
    var get = function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };
    var load = function () { if (P) return P; P = Promise.all([get('/data/card-search.json').catch(function () { return {}; }), get('/js/card-pages.json').catch(function () { return {}; })]).then(function (res) {
      CARDS = (res[0].cards || []).map(function (c) { return { id: c[0], t: c[1], s: c[2], p: c[3], n: nk(c[1] + ' ' + c[2]) }; });
      SPAGE = res[1].static || {}; PAGES = (res[1].pages || []).map(function (r) { return { t: r[0], s: r[1], u: r[2], n: nk(r[0] + ' ' + r[1] + ' ' + r[2].replace(/[\/-]/g, ' ')) }; }); }); return P; };
    function pages(q) { q = nk(q); if (q.length < 2) return []; var tk = q.split(' ');
      return PAGES.filter(function (c) { for (var i = 0; i < tk.length; i++) if (c.n.indexOf(tk[i]) < 0) return false; return true; }).sort(function (a, b) { return a.u.length - b.u.length; }).slice(0, 3); }
    function cards(q) { q = nk(q); if (!CARDS || q.length < 2) return []; var tk = q.split(' ');
      return CARDS.filter(function (c) { for (var i = 0; i < tk.length; i++) if (c.n.indexOf(tk[i]) < 0) return false; return true; })
        // Night Crew Oct 28 (BH/FTV): a card with its own static page (priced, dated, indexable) ranks above a /card?id= row;
        // "umbreon" put the static Umbreon ex #161 page 5th behind four query pages.
        .sort(function (a, b) { var sa = nk(a.t).indexOf(tk[0]) === 0 ? 0 : 1, sb = nk(b.t).indexOf(tk[0]) === 0 ? 0 : 1, pa = SPAGE[a.id] ? 0 : 1, pb = SPAGE[b.id] ? 0 : 1; return sa - sb || pa - pb || (b.p || 0) - (a.p || 0); }).slice(0, 7); }
    function sets(q) { q = nk(q); if (!q) return []; var tk = q.split(' '); return SETS.filter(function (s) { for (var i = 0; i < tk.length; i++) if (s.n.indexOf(tk[i]) < 0) return false; return true; }).slice(0, 4); }
    function render() {
      var q = input.value.trim(); sel = -1;
      if (!q) { res.classList.remove('show'); res.innerHTML = ''; return; }
      var pg = pages(q), c = cards(q).slice(0, 7 - pg.length), s = sets(q), h = '', sh = '';
      // a set row answers "is this set up or down?" (T2): when the words name a set, the Sets group leads ("prismatic" had it 8th)
      if (s.length) sh = '<div class="hd">Sets</div>' + s.map(function (x) { var v = T[x.tk]; return '<a data-r href="' + esc(x.u) + '"><span>' + esc(x.t) + '<small>' + esc(x.tk) + '</small></span>' + (v ? '<b>' + v.l.toFixed(2) + '<small>' + esc(sgn(v.w, 1)) + '</small></b>' : '') + '</a>'; }).join('');
      if (s.length && nk(s[0].t).indexOf(nk(q).split(' ')[0]) >= 0) { h = sh; sh = ''; }
      if (pg.length || c.length) h += '<div class="hd">Cards</div>' + c.map(function (x) { return '<a data-r href="' + esc(SPAGE[x.id] || '/card?id=' + x.id) + '"><span>' + esc(x.t) + '<small>' + esc(x.s) + '</small></span>' + (x.p == null ? '' : '<b>' + esc(money(x.p)) + '<small>raw</small></b>') + '</a>'; }).join('') + pg.map(function (x) { return '<a data-r href="' + esc(x.u) + '"><span>' + esc(x.t) + '<small>' + esc(x.s) + '</small></span></a>'; }).join('');
      h += sh;
      if (!h) h = CARDS ? '<div class="none">Not in an index yet \u2014 <a href="' + miss(q) + '" target="_blank" rel="sponsored nofollow noopener">see it on eBay \u203a</a> \u00b7 <a href="/indices">what we track</a></div>' : '<div class="none">Looking\u2026</div>';
      res.innerHTML = h; res.classList.add('show');
    }
    input.addEventListener('focus', load);
    input.addEventListener('input', function () { var v = input.value; render(); if (!CARDS) load().then(function () { if (input.value === v) render(); }); });
    input.addEventListener('keydown', function (e) {
      // only result rows (data-r) take Enter / arrows: a miss never leaves the site on Enter (B106; Scout Oct 28)
      var links = res.querySelectorAll('a[data-r]');
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, links.length - 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); }
      else if (e.key === 'Enter') { var t = links[sel] || links[0]; if (t) { ga('home2_search_go', { query: input.value.slice(0, 80) }); location.href = t.getAttribute('href'); } return; }
      else if (e.key === 'Escape') { input.value = ''; render(); input.blur(); return; }
      else return;
      Array.prototype.forEach.call(links, function (l, i) { l.classList.toggle('sel', i === sel); });
    });
    document.getElementById('h2-go').addEventListener('click', function () { var t = res.querySelector('a[data-r]'); if (t) location.href = t.getAttribute('href'); else if (input.value.trim()) load().then(render); input.focus(); });
    document.addEventListener('click', function (e) { if (!res.contains(e.target) && e.target !== input) res.classList.remove('show'); });
  })();
})();
