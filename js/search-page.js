/* /search?q= (BET-20261117-1, Night Crew Nov 18 2026).
 * The home page's SearchAction points AI tools and search engines at /search?q=<term>. This page reads q, fills the box and
 * lists matches in three groups, cards first: Cards (the hand-built card pages, then /data/card-search.json, each with its raw
 * sold mark and the date of that mark), Set indices, then Guides & tools. Same data and matching as the header and home search
 * (tools/build-nav.js writes js/card-pages.json: static card pages, hand-built pages, site rows, mark dates). No match → the
 * search-miss eBay search (customid search-miss, same link shape as the header's) and the index links in the page.
 * GA4: search_view { search_term, results } once per load with a query. Nothing here posts or stores anything.
 */
(function () {
  'use strict';
  var input = document.getElementById('sr-q'), out = document.getElementById('sr-out'), count = document.getElementById('sr-count'), none = document.getElementById('sr-none');
  if (!input || !out) return;
  var q = '';
  try { q = (new URLSearchParams(location.search).get('q') || '').replace(/\s+/g, ' ').trim().slice(0, 80); } catch (e) {}
  input.value = q;
  if (!q) { input.focus(); return; }
  document.title = q + ' — Search — ShopCardHub';

  var nk = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var money = function (n) { return '$' + Number(n).toLocaleString('en-US', n >= 100 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var day = function (d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : ''; };
  var ga = function (ev, p) { try { if (typeof gtag === 'function') gtag('event', ev, p); } catch (e) {} };
  // header search's miss rule (tools/build-nav.js missUrl): Pokémon words → "pokemon <q>" in the Pokémon TCG category, else Sports Trading Cards
  var EPN = 'mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001';
  var PK = /pok[eé]mon|pikachu|charizard|gengar|mewtwo|lugia|umbreon|eevee|darkrai|greninja|prismatic evolutions|ascended heroes|\btcg\b/i;
  var miss = function (s) { var named = /pok[eé]mon/i.test(s), pk = named || PK.test(s), t = pk && !named ? 'pokemon ' + s : s;
    return 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(t.replace(/\s+/g, ' ').trim()).replace(/%20/g, '+').replace(/'/g, '%27').replace(/[!()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }) + '&_sacat=' + (pk ? '183454' : '212') + '&LH_BIN=1&' + EPN + '&customid=search-miss'; };
  var get = function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };

  count.textContent = 'Searching…';
  Promise.all([get('/data/card-search.json').catch(function () { return {}; }), get('/js/card-pages.json').catch(function () { return {}; })]).then(function (res) {
    var cs = res[0] || {}, cp = res[1] || {}, SPAGE = cp.static || {}, ASOF = cp.asOf || {}, CASOF = cp.cardAsOf || {};
    var tk = nk(q).split(' ').filter(Boolean);
    var hit = function (n) { for (var i = 0; i < tk.length; i++) if (n.indexOf(tk[i]) < 0) return false; return tk.length > 0; };
    var first = function (t) { return nk(t).indexOf(tk[0]) === 0 ? 0 : 1; };
    // hand-built card pages (Bowman engine pages: /card-ethan-holliday …), shortest URL first, as the header does
    var pages = (cp.pages || []).map(function (r) { return { t: r[0], s: r[1], u: r[2], n: nk(r[0] + ' ' + r[1] + ' ' + r[2].replace(/[\/-]/g, ' ')) }; })
      .filter(function (x) { return hit(x.n); }).sort(function (a, b) { return a.u.length - b.u.length; }).slice(0, 5);
    var cards = (cs.cards || []).map(function (c) { return { id: c[0], t: c[1], s: c[2], p: c[3], n: nk(c[1] + ' ' + c[2]) }; })
      .filter(function (c) { return hit(c.n); })
      .sort(function (a, b) { var pa = SPAGE[a.id] ? 0 : 1, pb = SPAGE[b.id] ? 0 : 1; return first(a.t) - first(b.t) || pa - pb || (b.p || 0) - (a.p || 0); });
    var shown = cards.slice(0, 25);
    var site = (cp.site || []).map(function (r) { return { t: r[0], u: r[1], n: nk(r[0] + ' ' + r[1].replace(/[\/-]/g, ' ')) }; }).filter(function (x) { return x.u !== '/' && hit(x.n); });
    var idx = site.filter(function (x) { return /-index$|^\/indices$/.test(x.u); }).slice(0, 8);
    var guides = site.filter(function (x) { return idx.indexOf(x) < 0; }).slice(0, 8);
    var total = pages.length + cards.length + idx.length + guides.length;

    var row = function (u, t, s, right) { return '<a href="' + esc(u) + '"><span class="sr-t">' + esc(t) + (s ? '<small>' + esc(s) + '</small>' : '') + '</span>' + (right || '') + '</a>'; };
    var h = '';
    if (pages.length || shown.length) {
      h += '<h2 class="sr-h">Cards</h2><div class="sr-list">';
      h += pages.map(function (x) { return row(x.u, x.t, x.s, ''); }).join('');
      h += shown.map(function (c) {
        var d = CASOF[c.id] || ASOF[c.id.split('-')[0]];
        var right = c.p == null ? '' : '<b class="sr-p">' + esc(money(c.p)) + '<small>raw' + (d ? ' · ' + esc(day(d)) : '') + '</small></b>';
        return row(SPAGE[c.id] || '/card?id=' + c.id, c.t, c.s, right);
      }).join('');
      h += '</div>';
      if (cards.length > shown.length) h += '<p class="sr-count">' + (cards.length - shown.length) + ' more cards match. Add a word (a number or set) to narrow it.</p>';
    }
    // a query that names a set ("prismatic") answers "is this set up or down?" first: its index leads, as in the home box
    var ih = idx.length ? '<h2 class="sr-h">Set indices</h2><div class="sr-list">' + idx.map(function (x) { return row(x.u, x.t, '', ''); }).join('') + '</div>' : '';
    if (ih && nk(idx[0].t).split(' ').indexOf(tk[0]) >= 0) { h = ih + h; ih = ''; }
    h += ih;
    if (guides.length) h += '<h2 class="sr-h">Guides &amp; tools</h2><div class="sr-list">' + guides.map(function (x) { return row(x.u, x.t, '', ''); }).join('') + '</div>';
    out.innerHTML = h;
    count.textContent = total ? total + (total === 1 ? ' result' : ' results') + ' for “' + q + '”' : '';
    if (!total) {
      document.getElementById('sr-none-line').textContent = 'No card or set matches “' + q + '” yet.';
      document.getElementById('sr-miss').setAttribute('href', miss(q));
      none.hidden = false;
      var ml = document.getElementById('sr-miss');
      ml.addEventListener('click', function () { ga('search_miss_click', { query: q, search_term: q, page: '/search' }); });
    }
    ga('search_view', { search_term: q, results: total, page: '/search' });
  });
})();
