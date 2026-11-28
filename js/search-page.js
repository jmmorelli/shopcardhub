/* /search?q= (BET-20261117-1, Night Crew Nov 18 2026).
 * The home page's SearchAction points AI tools and search engines at /search?q=<term>. This page reads q, fills the box and
 * lists matches in three groups, cards first: Cards (the hand-built card pages, then /data/card-search.json, each with its raw
 * sold mark and the date of that mark), Set indices, then Guides & tools. Same data and matching as the header and home search
 * (tools/build-nav.js writes js/card-pages.json: static card pages, hand-built pages, site rows, mark dates). No match → the
 * search-miss eBay search (customid search-miss, same link shape as the header's) and the index links in the page.
 * GA4: search_view { search_term, results } once per load with a query. Nothing here posts or stores anything.
 * Q-083 (Build Loop, Nov 28 2026; CoS M-2): same matcher as the home and header boxes: nicknames (/data/search-aliases.json)
 * lead with their priced card and guide page, unpriced cards are not listed, and a miss ends on our page first (up to three
 * closest priced cards by the Q-081 rule, the nearest set index, "We don't track that card yet.", eBay last). GA4 search_hit /
 * search_miss with location "search", as the boxes send them.
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
  Promise.all([get('/data/card-search.json').catch(function () { return {}; }), get('/js/card-pages.json').catch(function () { return {}; }), get('/data/search-aliases.json').catch(function () { return {}; })]).then(function (res) {
    var cs = res[0] || {}, cp = res[1] || {}, SPAGE = cp.static || {}, ASOF = cp.asOf || {}, CASOF = cp.cardAsOf || {}, ALIAS = (res[2] && res[2].aliases) || {};
    // nickname, as the boxes match it (tools/build-nav.js aliasOf): the whole query, its start, or one of its words
    var al = (function () { var k0 = nk(q); if (k0.length < 4) return null; var w = k0.split(' '); for (var k in ALIAS) if (k === k0 || k.indexOf(k0) === 0 || w.indexOf(k) > -1) return ALIAS[k]; return null; })();
    var aIds = (al && al.ids) || [], aPages = (al && al.pages) || [];
    var tk = nk(q).split(' ').filter(Boolean);
    var hit = function (n) { for (var i = 0; i < tk.length; i++) if (n.indexOf(tk[i]) < 0) return false; return tk.length > 0; };
    var first = function (t) { return nk(t).indexOf(tk[0]) === 0 ? 0 : 1; };
    // hand-built card pages (Bowman engine pages: /card-ethan-holliday …), shortest URL first, as the header does
    var pages = (cp.pages || []).map(function (r) { return { t: r[0], s: r[1], u: r[2], n: nk(r[0] + ' ' + r[1] + ' ' + r[2].replace(/[\/-]/g, ' ')) }; })
      .filter(function (x) { return hit(x.n); }).sort(function (a, b) { return a.u.length - b.u.length; }).slice(0, 5);
    var ALL = (cs.cards || []).map(function (c) { return { id: c[0], t: c[1], s: c[2], p: c[3], n: nk(c[1] + ' ' + c[2]) }; }).filter(function (c) { return c.p != null; }); // an unpriced card is not listed (Q-070)
    var aCards = aIds.map(function (id) { for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i]; return null; }).filter(Boolean);
    var cards = aCards.concat(ALL.filter(function (c) { return aCards.indexOf(c) < 0 && hit(c.n); })
      .sort(function (a, b) { var pa = SPAGE[a.id] ? 0 : 1, pb = SPAGE[b.id] ? 0 : 1; return first(a.t) - first(b.t) || pa - pb || (b.p || 0) - (a.p || 0); }));
    var shown = cards.slice(0, 25);
    var SITE = (cp.site || []).map(function (r) { return { t: r[0], u: r[1], n: nk(r[0] + ' ' + r[1].replace(/[\/-]/g, ' ')) }; });
    var site = SITE.filter(function (x) { return x.u !== '/' && aPages.indexOf(x.u) > -1; }).concat(SITE.filter(function (x) { return x.u !== '/' && aPages.indexOf(x.u) < 0 && hit(x.n); }));
    var idx = site.filter(function (x) { return /-index$|^\/indices$/.test(x.u); }).slice(0, 8);
    var guides = site.filter(function (x) { return idx.indexOf(x) < 0; }).slice(0, 8);
    var total = pages.length + cards.length + idx.length + guides.length;

    var row = function (u, t, s, right) { return '<a href="' + esc(u) + '"><span class="sr-t">' + esc(t) + (s ? '<small>' + esc(s) + '</small>' : '') + '</span>' + (right || '') + '</a>'; };
    var h = '';
    if (pages.length || shown.length) {
      h += '<h2 class="sr-h">Cards</h2><div class="sr-list">';
      var crow = function (c) {
        var d = CASOF[c.id] || ASOF[c.id.split('-')[0]];
        var right = c.p == null ? '' : '<b class="sr-p">' + esc(money(c.p)) + '<small>raw' + (d ? ' · ' + esc(day(d)) : '') + '</small></b>';
        return row(SPAGE[c.id] || '/card?id=' + c.id, c.t, c.s, right);
      };
      h += shown.filter(function (c) { return aCards.indexOf(c) > -1; }).map(crow).join(''); // a nickname's card leads (Q-083)
      h += pages.map(function (x) { return row(x.u, x.t, x.s, ''); }).join('');
      h += shown.filter(function (c) { return aCards.indexOf(c) < 0; }).map(function (c) {
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
      // Q-083: the miss ends on our page first, by the home box's rule (js/home-v2.js loose / looseSet, Q-071 and Q-081)
      var GEN = { ex: 1, gx: 1, vmax: 1, vstar: 1, mega: 1, dark: 1, light: 1, shining: 1, radiant: 1, team: 1, rocket: 1, prime: 1, holo: 1, full: 1, art: 1, star: 1, delta: 1, 'break': 1, tag: 1, promo: 1, 'with': 1, the: 1, and: 1, edition: 1, '1st': 1, base: 1, set: 1, card: 1, cards: 1, pokemon: 1 };
      var lt = tk.filter(function (t) { return t.length >= 3; });
      var lc = !lt.length ? [] : ALL.map(function (c) { var tw = ' ' + nk(c.t) + ' ', aw = ' ' + c.n + ' ', sc = 0, nm = 0;
          for (var i = 0; i < lt.length; i++) { if (aw.indexOf(' ' + lt[i] + ' ') > -1) sc++; if (!GEN[lt[i]] && tw.indexOf(' ' + lt[i] + ' ') > -1) nm = 1; } return { c: c, sc: sc, nm: nm }; })
        .filter(function (x) { return x.nm || x.sc >= 2; }).sort(function (a, b) { return b.nm - a.nm || b.sc - a.sc || (SPAGE[a.c.id] ? 0 : 1) - (SPAGE[b.c.id] ? 0 : 1) || b.c.p - a.c.p; }).slice(0, 3).map(function (x) { return x.c; });
      var ls = null; for (var j = 0; j < SITE.length && !ls; j++) { if (!/-index$/.test(SITE[j].u)) continue; for (var i2 = 0; i2 < lt.length; i2++) if ((' ' + SITE[j].n).indexOf(' ' + lt[i2]) > -1) { ls = SITE[j]; break; } }
      var mh = '';
      if (lc.length) mh += '<h2 class="sr-h">Closest cards we track</h2><div class="sr-list">' + lc.map(function (c) { var d = CASOF[c.id] || ASOF[c.id.split('-')[0]]; return row(SPAGE[c.id] || '/card?id=' + c.id, c.t, c.s, '<b class="sr-p">' + esc(money(c.p)) + '<small>raw' + (d ? ' · ' + esc(day(d)) : '') + '</small></b>'); }).join('') + '</div>';
      if (ls) mh += '<h2 class="sr-h">Nearest set</h2><div class="sr-list">' + row(ls.u, ls.t, '', '') + '</div>';
      out.innerHTML = mh;
      ga('search_miss', { query: q, location: 'search', page: '/search' });
      document.getElementById('sr-none-line').textContent = 'We don’t track that card yet.';
      document.getElementById('sr-miss').setAttribute('href', miss(q));
      none.hidden = false;
      var ml = document.getElementById('sr-miss');
      ml.addEventListener('click', function () { ga('search_miss_click', { query: q, search_term: q, page: '/search' }); });
    }
    else ga('search_hit', { location: 'search', results: total, page: '/search' });
    ga('search_view', { search_term: q, results: total, page: '/search' });
  });
})();
