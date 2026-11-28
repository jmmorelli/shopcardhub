/* card-page.js — renders /card?id=<ticker>-<num> (Sep 30 2026). Data: /data/cards/<tk>.json (identity + the index's raw
 * sold mark) and /data/cards/g-<tk>.json (dated PSA 9 / PSA 10 / TAG 10 sold marks). Never an ask, never a guide value
 * (R18/R20): every number on the page is a median of dated sales or one dated sale labelled as one.
 *
 * v8 — card page v2 (PIVOT Oct 19 P0-A, Night Crew Oct 21). One quote header: grade chips (Raw · PSA 9 · PSA 10 · TAG 10)
 * swap one big number, its dated basis line and the chart line; the raw→PSA 10 spread in %; ONE eBay button that follows
 * the chip (P63/P59). Tabs below: Chart · Sales · Grades · Index. Grades carries the grade-or-slab block (P62, spec
 * Amendment 3: implied break-even gem rate only, net miss, assumptions printed; no Edge). Method = a link.
 * R18 (Oct 8 ruling): a median needs ≥ 3 dated rows; fewer prints as one dated sale.
 *
 * Cupertino run 7 (Nov 6 2026, R46): the grade compare row — Raw · PSA 9 · PSA 10 · TAG 10 side by side under the
 * tabs, each tile from the same G entry the chips print (no new number, no new source). A grade with no dated mark says
 * so in words (never $0, never a guess). Each tile's eBay link is the page's own grade link (ebUrl → js/grade-links.js).
 * The row steps in with js/scroll-flow.js, loaded here after the render (DESIGN-SYSTEM.md "Card pages"). */
(function () {
  var main = document.getElementById('cdp'); if (!main) return;
  // v9 (Night Crew Oct 23, P0-A static pages): a static /card-<slug> page carries its id on <main data-card-id>; /card?id= reads the query.
  var id = (main.getAttribute('data-card-id') || new URLSearchParams(location.search).get('id') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  var tk = id.split('-')[0];
  // O-77 (a), Night Crew Nov 23: card_page_view fires once on arrival (the gtag stub queues it), not after the render — a visitor
  // who left before the ~4 s data load, or a card whose data failed to load, was never counted (13 events vs 41 views, Nov 20).
  try { if (id && typeof gtag === 'function') gtag('event', 'card_page_view', { item: id }); } catch (e) {}
  // Static card pages (P0-A; v10 Night Crew Oct 26): every live ticker's cards that pass the gate have a /card-<slug> page.
  // The id → URL map is js/card-pages.json, written by tools/build-nav.js from the files on disk; a card without one stays on /card?id=.
  var STATIC = {};
  function cardUrl(x) { return STATIC[x.id] || '/card?id=' + x.id; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) { return n == null ? '' : '$' + Number(n).toLocaleString('en-US', n >= 100 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function md(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : ''; }
  function mdShort(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) : ''; }
  function miss(msg) { var l = document.getElementById('cdp-load'); if (l) l.innerHTML = msg; main.classList.add('cdp-done'); }
  // Q-070 (Build Loop, Nov 27 2026; CoS L-2): a card whose files never arrive no longer sits on "Loading card…": after 10 s the
  // page says so and points at the set indices (render() replaces #cdp-load, so this fires only while the stub is still up).
  setTimeout(function () { if (document.getElementById('cdp-load') && !main.classList.contains('cdp-done')) miss('This card didn’t load. <a href="/indices">Open the set indices</a> to find it in its set, or search another card in the bar at the top.'); }, 10000);
  if (!id || !tk) { miss('No card picked. Search a card name in the bar at the top, or <a href="/indices">open an index</a>.'); return; }
  function get(u) { return fetch(u, { cache: 'default' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  // B76 re-land (Oct 19): the shop file is read here too, so the .cdp-shop block and the TCGplayer button get their space
  // on first paint; shop-spread.js fills the reserved slots instead of inserting late (the Oct 16 live CLS 0.039 at 1440).
  var NO_SHOP = { bs1e: 1, trk: 1, gstar: 1 };   // trk / gstar (Nov 6 deploy): no TCGplayer shop file, so no 404 fetch
  Promise.all([get('/js/card-pages.json').then(function (m) { STATIC = (m && m.static) || {};
    // B105 (Night Crew Oct 28): /card?id=<id> carries canonical /card + noindex; when the card has its own static page, go there
    // (replace: Back skips the query page). The static page carries data-card-id, so it never redirects again.
    if (!main.getAttribute('data-card-id') && STATIC[id]) location.replace(STATIC[id] + location.hash); }, function () {}), get('/data/cards/' + tk + '.json'), get('/data/cards/g-' + tk + '.json').catch(function () { return null; }), NO_SHOP[tk] ? null : get('/data/tcg/' + tk + '.json').catch(function () { return null; })]).then(function (res) {
    res = res.slice(1);
    var d = res[0], gd = res[1], c = null;
    window.__schShopFile = res[2];
    for (var i = 0; i < d.cards.length; i++) if (d.cards[i].id === id) { c = d.cards[i]; break; }
    if (!c) { miss('That card isn’t in the <a href="' + esc(d.page) + '">' + esc(d.name) + '</a> right now — it may have dropped out of the basket. Search another card in the bar at the top.'); return; }
    render(d, c, gd && gd.cards ? (gd.cards[c.key || c.num] || null) : null, gd);
  }).catch(function () { miss('This card isn’t on file. Search a card name in the bar at the top, or <a href="/indices">open an index</a>.'); });

  /* Q-087 (Build Loop, Nov 28 2026; CoS N-5, test read Fri Dec 11: search_hit with location "card" ≥ 5 in events7, or it comes off).
   * For a visitor holding one card the second step is a second lookup, not the list: under the first eBay button, a search box
   * "Got more? Look up the next one." with the home box's matcher (/data/card-search.json priced rows, /data/search-aliases.json
   * nicknames lead, the Q-081 closest-card rule on a miss). Each card page this session is remembered in sessionStorage
   * (try/catch; nothing leaves the browser); from the second card on, one line offers "Keep these two in a list", which tracks
   * both through js/vault-track.js (SCHVault.track) with the page's dated raw mark and, where the nightly sold feed carries the
   * card, its feed id (sold:<path>, /feed/sold-marks.json). No email, no pop-up. */
  function nextLookup(d, c, raw) {
    var SK = 'sch_lookups', me = { id: c.id, n: c.name + ' #' + c.num + ' — ' + d.set, s: d.set, p: raw == null ? null : raw, path: c.path || '' }, prev = null;
    try { var L = JSON.parse(sessionStorage.getItem(SK) || '[]'); if (!Array.isArray(L)) L = [];
      L = L.filter(function (x) { return x && x.id && x.id !== me.id; }); prev = L.length ? L[L.length - 1] : null;
      L.push(me); sessionStorage.setItem(SK, JSON.stringify(L.slice(-6))); } catch (e) { prev = null; }
    var two = prev && prev.p != null && me.p != null ? prev : null;
    var html = '<div class="cdp-next2" id="cdp-next2"><label for="cdp-n2q">Got more? Look up the next one.</label>' +
      '<div class="cdp-n2f"><input id="cdp-n2q" type="search" autocomplete="off" spellcheck="false" placeholder="Card name, e.g. Charizard ex" aria-controls="cdp-n2r"></div>' +
      '<div class="cdp-n2r" id="cdp-n2r" role="listbox" hidden></div>' +
      (two ? '<p class="cdp-n2k" id="cdp-n2k"><button type="button" id="cdp-n2b">Keep these two in a list</button> <span>' + esc(two.n.split(' — ')[0]) + ' and ' + esc(c.name) + ' #' + esc(c.num) + ', with their prices</span></p>' : '') +
      '</div>';
    function wire() {
      var input = document.getElementById('cdp-n2q'), box = document.getElementById('cdp-n2r'); if (!input || !box) return;
      var CARDS = null, ALIAS = {}, P = null, hitSent = {}, missSent = {}, T = null;
      var nk = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
      function ga(n, p) { try { if (typeof gtag === 'function') gtag('event', n, p); } catch (e) {} }
      function load() { if (P) return P; P = Promise.all([get('/data/card-search.json').catch(function () { return {}; }), get('/data/search-aliases.json').catch(function () { return {}; })]).then(function (r) {
        ALIAS = (r[1] && r[1].aliases) || {};
        CARDS = (r[0].cards || []).filter(function (x) { return x[3] != null; }).map(function (x) { return { id: x[0], t: x[1], s: x[2], p: x[3], n: nk(x[1] + ' ' + x[2]) }; }); }); return P; }
      function aliasCards(q) { q = nk(q); if (q.length < 4) return []; var tk = q.split(' '), a = null; for (var k in ALIAS) if (k === q || k.indexOf(q) === 0 || tk.indexOf(k) > -1) { a = ALIAS[k]; break; }
        return a ? (a.ids || []).map(function (id) { for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i]; return null; }).filter(Boolean) : []; }
      function cards(q) { q = nk(q); if (q.length < 2) return []; var tk = q.split(' ');
        return CARDS.filter(function (x) { for (var i = 0; i < tk.length; i++) if (x.n.indexOf(tk[i]) < 0) return false; return true; })
          .sort(function (a, b) { var sa = nk(a.t).indexOf(tk[0]) === 0 ? 0 : 1, sb = nk(b.t).indexOf(tk[0]) === 0 ? 0 : 1, pa = STATIC[a.id] ? 0 : 1, pb = STATIC[b.id] ? 0 : 1; return sa - sb || pa - pb || b.p - a.p; }).slice(0, 5); }
      var GEN = { ex: 1, gx: 1, vmax: 1, vstar: 1, mega: 1, dark: 1, light: 1, shining: 1, radiant: 1, team: 1, rocket: 1, prime: 1, holo: 1, full: 1, art: 1, star: 1, delta: 1, 'break': 1, tag: 1, promo: 1, 'with': 1, the: 1, and: 1, edition: 1, '1st': 1, base: 1, set: 1, card: 1, cards: 1, pokemon: 1 };
      function loose(q) { var tk = nk(q).split(' ').filter(function (t) { return t.length >= 3; }); if (!tk.length) return [];
        return CARDS.map(function (x) { var tw = ' ' + nk(x.t) + ' ', aw = ' ' + x.n + ' ', sc = 0, nm = 0;
          for (var i = 0; i < tk.length; i++) { if (aw.indexOf(' ' + tk[i] + ' ') > -1) sc++; if (!GEN[tk[i]] && tw.indexOf(' ' + tk[i] + ' ') > -1) nm = 1; } return { c: x, sc: sc, nm: nm }; })
          .filter(function (x) { return x.nm || x.sc >= 2; }).sort(function (a, b) { return b.nm - a.nm || b.sc - a.sc || b.c.p - a.c.p; }).slice(0, 3).map(function (x) { return x.c; }); }
      function row(x) { return '<a data-r role="option" href="' + esc(cardUrl(x)) + '"><span>' + esc(x.t) + '<small>' + esc(x.s) + '</small></span><b>' + esc(money(x.p)) + '<small>raw</small></b></a>'; }
      function render() {
        var q = input.value.trim(); if (!q) { box.hidden = true; box.innerHTML = ''; return; }
        if (!CARDS) { box.hidden = false; box.innerHTML = '<p class="none">Looking…</p>'; return; }
        var ac = aliasCards(q), r = ac.concat(cards(q).filter(function (x) { return ac.indexOf(x) < 0; })).slice(0, 5), h;
        if (r.length) h = r.map(row).join('');
        else { var lc = loose(q); h = (lc.length ? '<p class="hd">Closest cards we track</p>' + lc.map(row).join('') : '') + '<p class="none">We don’t track that card yet. <a href="/search?q=' + encodeURIComponent(q) + '">Search everything</a> · <a href="/indices">What we track</a></p>'; }
        box.innerHTML = h; box.hidden = false;
        clearTimeout(T); var k = nk(q), n = r.length;
        T = setTimeout(function () { if (nk(input.value) !== k) return;
          if (n && !hitSent[k]) { hitSent[k] = 1; ga('search_hit', { location: 'card', results: n }); }
          else if (!n && !missSent[k]) { missSent[k] = 1; ga('search_miss', { query: q.slice(0, 80), location: 'card' }); } }, 1200);
      }
      input.addEventListener('focus', load);
      input.addEventListener('input', function () { var v = input.value; render(); if (!CARDS) load().then(function () { if (input.value === v) render(); }); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var a = box.querySelector('a[data-r]'); if (a) location.href = a.getAttribute('href'); else if (input.value.trim()) location.href = '/search?q=' + encodeURIComponent(input.value.trim()); } else if (e.key === 'Escape') { input.value = ''; render(); } });
      var kb = document.getElementById('cdp-n2b'); if (!kb || !two) return;
      kb.addEventListener('click', function () {
        kb.disabled = true;
        var done = false, go = function (keys) { if (done) return; done = true;
          var specs = [two, me].map(function (x) { var fk = x.path && keys && keys['sold:' + x.path] ? 'sold:' + x.path : ''; return { name: x.n, set: x.s, cat: 'pokemon', grade: 'Raw', price: x.p, feed: fk, page: location.pathname }; });
          var out = specs.map(function (s) { return window.SCHVault && SCHVault.track ? SCHVault.track(s) : 'fallback'; });
          ga('lookup_list_keep', { added: out.filter(function (o) { return o === 'added'; }).length });
          var k = document.getElementById('cdp-n2k');
          if (out.indexOf('fallback') > -1) { location.href = '/watchlist'; return; }
          if (k) k.innerHTML = 'Both are on your list. <a href="/watchlist">Open your list ›</a>';
          if (window.SCHVault && SCHVault.mark) SCHVault.mark(main); };
        setTimeout(function () { go(null); }, 4000);
        fetch('/feed/sold-marks.json').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { var m = {}; (j.cards || []).forEach(function (e) { if (e && e.key && e.last > 0) m[e.key] = 1; }); go(m); }, function () { go(null); });
      });
    }
    return { html: html, wire: wire };
  }

  /* P62 grade-or-slab defaults — every figure from claude/kb/pokemon/GRADE-DEFAULTS.md (KB run 5, Oct 19 2026).
   * PSA Standard $59.99 → $62.75 a card in a 20-card batch (fee [HIGH] psacard.com, read Sep 25 2026; shipping/supplies [LOW]).
   * eBay selling friction on the miss = 13.25% final value fee + $0.40 per order (eBay Seller Center, Feb 14 2025 schedule [MED]).
   * Scope v1 = SV/MEG-era sets (spec: modern Pokémon only). */
  var P62 = { allIn: 62.75, fee: 59.99, fvf: 0.1325, perOrder: 0.40, sets: { pf25: 1, dr25: 1, sv151: 1, pris25: 1, pb26: 1, cr26: 1, ah26: 1, meg25: 1, ssp24: 1, th26: 1 } };

  // Cupertino run 11 (Nov 10 2026): the breadcrumb, "Set indices › Prismatic Evolutions › Umbreon ex #161" — the same markup
  // and words as tools/lib/local-nav.mjs cardCrumbHtml() prints into the static stub, so the first paint and the render match.
  // The set's step is named the way its own index page names itself; a tracked card (no index) skips it.
  function shortName(n) { return String(n).replace(/\s+(Chase|1st Auto|Class|Sector)?\s*Index$/i, '').replace(/^((?!Base Set$).*)\s+Set$/i, '$1').trim(); }
  function crumb(d, nameHtml) {
    var sep = '<span class="sep" aria-hidden="true"> › </span>', out = '<a href="/indices">Set indices</a>';
    if (d.kind !== 'tracked' && d.page && d.page !== '/indices') out += sep + '<a href="' + esc(d.page) + '">' + esc(shortName(d.name || d.ticker || '')) + '</a>';
    return '<nav class="crumb" aria-label="Breadcrumb">' + out + sep + '<span aria-current="page">' + nameHtml + '</span></nav>';
  }

  function render(d, c, g, gd) {
    // c.set: a card file that spans sets (TRK tracked cards, the GSTAR board — tools/build-coverage-cards.mjs, Nov 5 2026)
    var setShort = String(c.set || d.set).replace(/^Pokémon TCG /, ''), offIx = d.kind === 'tracked' || d.kind === 'board';
    document.title = c.name + ' #' + c.num + ' ' + setShort + ' price — Raw, PSA 9, PSA 10, TAG | ShopCardHub';
    main.style.setProperty('--ac', d.theme || '#00ccf5');
    // Price Truth hold (Nov 18 2026, tools/lib/pt-holds.mjs): a raw mark under review prints no number.
    var raw = c.ptHold ? null : c.raw;
    var scr = c.screened && c.why === 'screen', chase = d.kind === 'chase', win = (d.screen && d.screen.window) || d.window || 30;
    var gRead = (g && g.asOf) || (gd && gd.day) || null;
    // (d') Price Truth Nov 12 2026, CoS ruling Nov 11: from Tue Nov 17 2026 a graded read more than 21 days old prints nothing
    // ("Being re-read") until the ladder is read again — mirror of tools/lib/ladder-guard.mjs STALE_AGE, so it engages on the day
    var ptDay = new Date(Date.now() - 8 * 3600e3).toISOString().slice(0, 10);   // the Pacific day, like the guard's TODAY
    var gOld = !!gRead && ptDay >= '2026-11-17' && (Date.parse(ptDay) - Date.parse(String(gRead).slice(0, 10))) / 864e5 > 21;
    // One entry per grade: m = the number we print (a median of ≥ 3 dated rows), one = a single dated sale when there is no median.
    var G = [{ k: 'raw', lbl: 'Raw', eb: 'raw', m: scr ? null : raw }];
    if (scr) G[0].basis = 'Not priced: ' + (c.n30 != null ? c.n30 + ' clean raw sales in the last ' + win + ' days' : 'below the liquidity screen') + '. It enters the index at ' + ((d.screen && d.screen.enter) || 6) + ' in ' + win + ' days.';
    else if (c.ptHold) G[0].basis = 'Being re-read: the latest raw sales on file may include a different printing.';
    else if (raw == null) G[0].basis = c.nv ? 'No verified sale yet: ' + (c.wn || 0) + ' clean raw sales in ' + (c.win || 90) + ' days (3 needed)' : 'Too few raw sales to mark.';
    else if (chase) G[0].basis = 'PriceCharting’s ungraded value, read ' + md(c.rawAsOf);
    else G[0].basis = 'Median of ' + (c.wn != null ? c.wn : c.n30) + ' raw sales' + (c.lo != null && c.hi != null ? ' (middle half ' + money(c.lo) + '–' + money(c.hi) + ')' : '') + ', ' + (c.win || d.window || 30) + ' days · marked ' + md(c.rawAsOf);
    [['psa9', 'PSA 9', 'psa9'], ['psa10', 'PSA 10', 'psa10'], ['tag10', 'TAG 10', 'tag']].forEach(function (p) {
      var x = g ? g[p[0]] : null, e = { k: p[0], lbl: p[1], eb: p[2], m: null, one: null, n: x && x.n, days: x && x.basis === '30d' ? 30 : 90 };
      if (x && !x.held && gOld && (x.m != null || x.last)) { e.reread = true; e.basis = 'Being re-read: this graded read (' + md(gRead) + ') is more than 21 days old'; }
      else if (x && x.m && x.n >= 3) { e.m = x.m; e.basis = 'Median of ' + x.n + ' dated sales, ' + e.days + ' days · read ' + md(gRead) + (x.last ? ' · last sale ' + money(x.last.p) + ', ' + mdShort(x.last.d) : ''); }
      else if (x && x.last) { e.one = x.last; e.basis = '1 dated sale, ' + md(x.last.d) + ' · fewer than 3 in 90 days, so no median'; }
      // a cell the ladder guards held (build-card-ladder.mjs, Nov 3 2026): its sales disagree with the card's other grades or the last sale
      // Price Truth Nov 10 2026 (CoS ADOPT Nov 9): a cell held because its read is old and the set has fallen since (ladder-guard.mjs STALE)
      else if (x && x.held && x.held.why === 'v-verifier') e.basis = 'Being re-read: sales since this read run well below it';
      else if (x && x.held && x.held.why === 'd-stale-age') e.basis = 'Being re-read: this graded read is more than 21 days old';
      else if (x && x.held && x.held.why === 'd-stale-set') e.basis = 'Being re-read: these sales are more than 10 days old and the set has fallen since';
      else if (x && x.held) e.basis = 'No verified sale';
      else e.basis = !g ? 'Graded read pending' : p[0] === 'tag10' ? 'No TAG 10 sale in 12 months' : 'No dated sale in 12 months';
      G.push(e);
    });
    // Q-086 (Build Loop, Nov 28 2026; CoS N-4, test read Fri Dec 11): the next price check, computed from the schedule the marks run
    // on, never typed: set indices re-mark Monday and Thursday (UTC; build-sector-index --if-mark-day in price-snapshot.yml and
    // classic-marks.yml), the six chase indices weekly on Monday (remark-indices.mjs). No date when the raw mark is held, screened
    // or missing, for tracked cards and boards, or when the last mark is more than 7 days old (a check was missed: no promise).
    var nextChk = (function () {
      if (raw == null || scr || offIx || !c.rawAsOf) return '';
      var days = chase ? [1] : [1, 4], today = new Date().toISOString().slice(0, 10), last = String(c.rawAsOf).slice(0, 10);
      if ((Date.parse(today) - Date.parse(last)) / 864e5 > 7) return '';
      for (var i = 0; i < 8; i++) { var t = new Date(Date.parse(today + 'T12:00:00Z') + i * 864e5), iso = t.toISOString().slice(0, 10);
        if (iso > last && days.indexOf(t.getUTCDay()) > -1) return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][t.getUTCDay()] + ', ' + MON[t.getUTCMonth()] + ' ' + t.getUTCDate(); }
      return '';
    })();
    var psa10 = G[2].m, spread = raw && psa10 ? (psa10 / raw - 1) * 100 : null;
    var pick = 'raw';
    var cid = 'card-' + c.id;
    var av = raw >= 200 || G.some(function (r) { return r.k !== 'raw' && r.m >= 200; });
    function gOf(k) { for (var i = 0; i < G.length; i++) if (G[i].k === k) return G[i]; return G[0]; }
    function ebUrl(e, mode) { return window.SCH_GLK ? SCH_GLK.url({ q: c.q, g: e.eb, wotc: d.ed === '1st' || d.ed === 'shadowless' ? d.ed : !!d.wotc, cid: cid, mode: mode, av: av }) : 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(c.q || c.name) + '&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001&customid=' + cid; }
    function bigOf(e) { return e.m != null ? money(e.m) : e.one ? money(e.one.p) : (e.k === 'raw' && scr ? 'Not priced' : 'No mark'); }
    var chips = G.map(function (e) {
      return '<button type="button" role="tab" data-g="' + e.k + '" aria-selected="' + (e.k === pick) + '" aria-controls="cdp-q">' + e.lbl + '<small>' + (e.m != null ? money(e.m) : e.one ? '1 sale' : '&nbsp;') + '</small></button>';
    }).join('');
    var p62 = grade62(d, c, G);
    // BET-20261119-1 (Night Crew Nov 23): a static card page bakes its own "More from" block (#cdp-sib, after <main>);
    // there this grid is skipped and the baked tiles get their raw price line from the same card file.
    var sib = document.getElementById('cdp-sib');
    if (sib) d.cards.forEach(function (x) { if (x.raw == null || !STATIC[x.id]) return; var a = sib.querySelector('a[href="' + STATIC[x.id] + '"]'); if (a && !a.querySelector('i.r')) { var r = document.createElement('i'); r.className = 'r'; r.textContent = ' · raw ' + money(x.raw); a.appendChild(r); } });
    var more = sib ? '' : d.cards.filter(function (x) { return x.id !== c.id && x.raw != null; }).slice(0, 8).map(function (x) {
      return '<a href="' + cardUrl(x) + '"><b>' + esc(x.name) + ' #' + esc(x.num) + '</b>raw ' + money(x.raw) + ' · ' + (offIx ? esc(String(x.set || '').replace(/^Pokémon TCG /, '')) : x.w === 0 ? 'own line' : x.w != null ? x.w.toFixed(1) + '% of index' : '') + '</a>';
    }).join('');
    // Sales tab: the dated rows we hold (R18) — one per grade, newest sale with its date, plus the median it sits in.
    var salesRows = G.map(function (e) {
      if (e.k === 'raw') return '<tr><th>Raw</th><td>' + (e.m != null ? money(e.m) : '') + '</td><td>' + esc(e.basis) + '</td></tr>';
      var x = g && g[e.k];
      if (e.reread) return '<tr><th>' + e.lbl + '</th><td></td><td>' + esc(e.basis) + '</td></tr>';
      return '<tr><th>' + e.lbl + '</th><td>' + (x && x.last ? money(x.last.p) : '') + '</td><td>' + (x && x.last ? 'last dated sale, ' + md(x.last.d) + (e.m != null ? ' · in a median of ' + e.n + ' sales, ' + e.days + ' days: ' + money(e.m) : '') : esc(e.basis)) + '</td></tr>';
    }).join('');
    var gradeList = G.map(function (e) {
      var x = e.k !== 'raw' && e.m && raw ? (e.m / raw) : null;
      return '<div><dt>' + e.lbl + '</dt><dd><b>' + bigOf(e) + '</b>' + (x ? ' <em>' + x.toFixed(x >= 10 ? 0 : x < 2 ? 2 : 1) + '× raw</em>' : '') + '<small>' + esc(e.basis) + '</small></dd></div>';
    }).join('');
    // the compare row (run 7): one tile per grade, the same entry as its chip; words where there is no dated mark
    var cmp = G.map(function (e) {
      var x = e.k !== 'raw' && g ? g[e.k] : null, v, cap = e.basis;
      if (e.m != null) { v = money(e.m); cap = e.k === 'raw' ? (chase ? 'PriceCharting’s ungraded value' + (c.rawAsOf ? ', read ' + mdShort(c.rawAsOf) : '') :'Median of ' + (c.wn != null ? c.wn : c.n30) + ' raw sales, ' + (c.win || d.window || 30) + ' days') : 'Median of ' + e.n + ' sales, ' + e.days + ' days'; }
      else if (e.one) { v = money(e.one.p); cap = '1 sale, ' + md(e.one.d); }
      else v = e.k === 'raw' ? (c.ptHold ? 'Being re-read' : scr ? 'Not priced' : c.nv ? 'No verified sale yet' : 'Too few sales') : e.reread || (x && x.held && /^(d-stale|v-)/.test(x.held.why)) ? 'Being re-read' : x && x.held ? 'No verified sale' : !g ? 'Not read yet' : 'No recent sale';
      if (cap === v || cap === 'Graded read pending') cap = ''; else if (cap.indexOf(v + ': ') === 0) cap = cap.slice(v.length + 2);
      var r = e.k !== 'raw' && e.m && raw ? e.m / raw : null;
      return '<div class="cdp-cmp-c' + (e.m != null || e.one ? '' : ' na') + '"><h3>' + e.lbl + '</h3><p class="v">' + v + '</p>' +
        (r ? '<p class="x">' + r.toFixed(r >= 10 ? 0 : r < 2 ? 2 : 1) + '× raw</p>' : '') + (cap ? '<p class="b">' + esc(cap) + '</p>' : '') +
        '<a class="ds-more" href="' + esc(ebUrl(e, 'bin')) + '" data-cid="' + cid + '" data-g="' + e.eb + '" data-mode="bin" target="_blank" rel="sponsored nofollow noopener" aria-label="Shop ' + e.lbl + ' copies on eBay">Shop on eBay</a></div>';
    }).join('');
    var setLink = '<a href="' + esc(d.page) + '">' + esc(setShort) + '</a>';
    var nl = nextLookup(d, c, raw);
    var keep = main.querySelector('.cdp-photo.cdp-stub');   // P4: the stub's photo box carries the view-transition name; keep the node
    main.innerHTML =
      crumb(d, esc(c.name) + ' #' + esc(c.num)) +
      '<div class="cdp-top"><div class="cdp-photo"><span data-card-img="' + esc(c.img) + '" data-card-name="' + esc(c.name) + ' #' + esc(c.num) + ' ' + esc(d.set) + '" data-card-sub="pokemon" data-card-size="hero" data-card-surface="card-page" data-card-link="off"></span></div>' +
      '<div class="cdp-info"><h1>' + esc(c.name) + ' #' + esc(c.num) + '</h1><p class="cdp-set">' + setLink + ' · #' + esc(c.num) + (c.rarity ? ' · ' + esc(c.rarity) : '') + '</p></div>' +
      '<div class="cdp-q" id="cdp-q"><div class="cdp-gr" role="tablist" aria-label="Grade">' + chips + '</div>' +
      '<div class="cdp-big" id="cdp-big"></div><div class="cdp-basis" id="cdp-basis"></div>' + (nextChk ? '<div class="cdp-next" id="cdp-next">Next price check ' + esc(nextChk) + '</div>' : '') +
      (spread != null ? '<div class="cdp-spread">Raw → PSA 10: <b>' + (spread >= 0 ? '+' : '−') + Math.abs(spread).toFixed(0) + '%</b>' + (p62 ? ' · <a href="#cdp-tab-grades" data-tab="grades">' + esc(p62.short) + '&nbsp;›</a>' : '') + '</div>' : '') +
      '<div class="cdp-cta"><a class="cdp-ebay" id="cdp-ebay" data-cid="' + cid + '" target="_blank" rel="sponsored nofollow noopener"></a>' +
      '<a class="cdp-auc" id="cdp-auc" data-cid="' + cid + '" data-mode="auc" target="_blank" rel="sponsored nofollow noopener">Auctions ending soon</a>' +
      '<button type="button" class="sch-track-card" data-name="' + esc(c.name) + ' #' + esc(c.num) + ' — ' + esc(d.set) + '" data-set="' + esc(d.set) + '" data-cat="pokemon" data-grade="Raw" data-price="' + (raw == null ? '' : raw) + '">★ Watch</button></div>' + nl.html + '</div></div>' +
      '<div class="cdp-tabs" role="tablist" aria-label="Card sections">' + [['chart', 'Chart'], ['sales', 'Sales'], ['grades', 'Grades'], ['index', 'Index']].map(function (t, i) {
        return '<button type="button" role="tab" id="cdp-tab-' + t[0] + '" data-tab="' + t[0] + '" aria-selected="' + (i === 0) + '" aria-controls="cdp-p-' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<section class="cdp-panel" id="cdp-p-chart" role="tabpanel" aria-labelledby="cdp-tab-chart"><div class="cdp-chart cdp-wait" id="cdp-chart"><div class="wl">Loading price history…</div></div></section>' +
      '<section class="cdp-panel" id="cdp-p-sales" role="tabpanel" aria-labelledby="cdp-tab-sales" hidden><table class="cdp-sales"><thead><tr><th>Grade</th><th>Price</th><th>What it is</th></tr></thead><tbody>' + salesRows + '</tbody></table>' +
      '<p class="cdp-note">PSA 9, PSA 10 and TAG 10 count only sales whose own listing title names that grade (PriceCharting’s dated completed sales).</p></section>' +
      '<section class="cdp-panel" id="cdp-p-grades" role="tabpanel" aria-labelledby="cdp-tab-grades" hidden><dl class="cdp-kv">' + gradeList + '</dl>' + (p62 ? p62.html : '') + '</section>' +
      '<section class="cdp-panel" id="cdp-p-index" role="tabpanel" aria-labelledby="cdp-tab-index" hidden><div class="cdp-ix"><a class="go" href="' + esc(d.page) + '">' + esc(d.ticker) + ' ' + esc(d.name) + (d.level != null ? ' · ' + Number(d.level).toFixed(2) : '') + '&nbsp;›</a>' +
      '<p>' + (d.kind === 'tracked' ? 'Tracked card: its set has no index on this site, so there is no level or weight. The price is this card’s own dated sales.' : d.kind === 'board' ? 'On the ' + esc(d.ticker) + ' ' + esc(d.name) + ' board: a board, not an index, so there is no level or weight.' : scr ? 'Tracked in this index, outside the level (below the liquidity screen).' : c.w === 0 ? 'Tracked as its own line, not in the weighted basket.' : '#' + c.rank + ' by weight' + (c.w != null ? ' · ' + c.w.toFixed(1) + '% of the index' : '') + (d.asOf ? ' · index marked ' + md(d.asOf) : '')) + '</p></div>' +
      (more ? '<div class="cdp-more"><h2>' + (d.kind === 'tracked' ? 'More tracked cards' : 'More from the ' + esc(d.ticker) + (d.kind === 'board' ? ' board' : ' basket')) + '</h2><div class="g">' + more + '</div></div>' : '') + '</section>' +
      '<section class="cdp-cmp" id="cdp-cmp" aria-labelledby="cdp-cmp-h"><h2 id="cdp-cmp-h">Raw, PSA or TAG?</h2><p class="s">What each grade of this card sold for, side by side.</p>' +
      '<div class="cdp-cmp-g">' + cmp + '</div><p class="n">Each grade is priced from its own sales and its own count. Grades are never mixed.</p></section>' +
      '<div class="cdp-buy"><div class="h"><b>Other places to buy</b></div>' +
      (shopMark() ? '<div class="cdp-shop cdp-shop-wait" aria-hidden="true"></div>' : '') + '<div class="cdp-btns" id="cdp-btns">' + (shopMark() ? '<span class="tcg-slot" aria-hidden="true"></span>' : '') + '</div>' +
      '<div class="f">eBay searches for this exact card in each grade, with our affiliate tag (ShopCardHub earns a commission at no cost to you) — live listings, not prices. ' + (d.ed === '1st' ? 'Searches are for the 1st Edition print this index tracks. ' : d.ed === 'shadowless' ? 'Searches are for Shadowless copies and exclude 1st Edition. ' : d.wotc ? 'Searches exclude 1st Edition and Shadowless copies: this index tracks the Unlimited print. ' : '') + '<b>TAG:</b> we link TAG because it publishes its measurements. PSA is the reference grade. Our view: machine grading wins over time. <a href="/tag-grading-guide">How TAG grading works&nbsp;›</a></div></div>' +
      '<p class="cdp-method"><a href="/how-prices-work">How we price a card&nbsp;›</a></p>';
    if (keep) { var np = main.querySelector('.cdp-photo'); if (np) { keep.removeAttribute('aria-hidden'); keep.classList.remove('cdp-stub');
      // a flown-in photo stays on top (.cdp-fly) until card-img.js has decoded the hero under it; an empty stub goes now
      var fs = keep.querySelector('.sch-cimg'); if (fs && fs.querySelector('img')) fs.classList.add('cdp-fly'); else if (fs) keep.removeChild(fs);
      while (np.firstChild) keep.insertBefore(np.firstChild, keep.firstChild); np.parentNode.replaceChild(keep, np); } }
    function shopMark() { var sf = window.__schShopFile; return !!(sf && sf.marks && sf.marks[c.id]); }

    var big = document.getElementById('cdp-big'), basis = document.getElementById('cdp-basis'), eb = document.getElementById('cdp-ebay'), auc = document.getElementById('cdp-auc');
    function setGrade(k, by) {
      pick = k; var e = gOf(k);
      main.querySelectorAll('.cdp-gr button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-g') === k)); });
      big.textContent = bigOf(e); big.classList.toggle('na', e.m == null && !e.one);
      basis.textContent = e.basis;
      var nx = document.getElementById('cdp-next'); if (nx) nx.hidden = k !== 'raw';   // Q-086: the schedule is the raw mark's
      eb.href = ebUrl(e, 'bin'); eb.setAttribute('data-g', e.eb); eb.setAttribute('data-mode', 'bin');
      eb.innerHTML = 'Buy ' + esc(e.k === 'tag10' ? 'TAG 10' : e.lbl) + ' on eBay';
      auc.href = ebUrl(e, 'auc'); auc.setAttribute('data-g', e.eb);
      if (chartApi) chartApi.grade(k);
      if (by) try { if (typeof gtag === 'function') gtag('event', 'grade_pick', { grade: k, page: '/card' }); } catch (err) {}
    }
    var chartApi = null;
    main.querySelector('.cdp-gr').addEventListener('click', function (ev) { var b = ev.target.closest('button[data-g]'); if (b) setGrade(b.getAttribute('data-g'), true); });
    function tab(t) {
      main.querySelectorAll('.cdp-tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === t)); });
      main.querySelectorAll('.cdp-panel').forEach(function (p) { p.hidden = p.id !== 'cdp-p-' + t; });
      if (t === 'chart' && chartApi) chartApi.redraw();
    }
    // run 9: the sticky local nav (LOCALNAV block, tools/lib/local-nav.mjs) sits outside <main>; its Chart · Sales · Grades
    // links carry the same data-tab as the tabs, so one handler opens the tab and scrolls to it from either place.
    function onTab(ev) {
      var b = ev.target.closest('[data-tab]'); if (!b) return;
      ev.preventDefault(); tab(b.getAttribute('data-tab'));
      if (b.tagName === 'A') { var tb = document.getElementById('cdp-tab-' + b.getAttribute('data-tab')); if (tb) { tb.focus({ preventScroll: true }); tb.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } }
    }
    main.addEventListener('click', onTab);
    var lnav = document.querySelector('.lnav[data-lnav-card]'); if (lnav) lnav.addEventListener('click', onTab);
    setGrade('raw');
    [eb, auc].concat([].slice.call(main.querySelectorAll('.cdp-cmp-c a'))).forEach(function (a) { if (window.SCH_GLK && SCH_GLK.track) SCH_GLK.track(a); });
    // run 7: the scroll flow (blocks below the first screen step in once; off under reduced motion; nothing hidden without JS)
    if (!document.querySelector('script[src^="/js/scroll-flow.js"]')) { var sf = document.createElement('script'); sf.src = '/js/scroll-flow.js?v=2'; sf.defer = true; document.body.appendChild(sf); }
    if (window.SCHVault && SCHVault.mark) SCHVault.mark(main);
    nl.wire();
    chartApi = chart(d, c, gOf);
    if (chartApi) chartApi.grade(pick);
    // shop-spread.js (Oct 15 2026) fills the TCGplayer shop price / spread block into .cdp-buy once the card is on the page
    window.__schCard = { d: d, c: c };
    try { document.dispatchEvent(new CustomEvent('sch:card-rendered', { detail: window.__schCard })); } catch (e) {}
  }

  /* P62 — grade it or buy the 10 (spec claude/cos/grade-or-slab-spec-2026-10-16.md + Amendment 3).
   * p* = (raw + all-in − V_miss) / (slab − V_miss); raw = TCGplayer market (R38 shop file), V_miss = PSA 9 median net of
   * eBay fees, slab = PSA 10 median. Renders only for SV/MEG-era cards with a shop price and ≥ 3 dated PSA 9 and PSA 10
   * sales in 30 days. Implied rate only: the Edge (actual − implied) stays held (Am. 3, GAPS P30). */
  // GAPS P89 (KB run 44, Nov 27 2026): PSA stopped grading English Mega Hyper Rares on Nov 25 2026 (psacard.com article 15794).
  // Explicit id list, not the rarity field (PF25 #130 is tagged HR, MEG25 rows carry none): no break-even math for these.
  var MHR_NO_PSA = ['meg25-187','meg25-188','pf25-130','ah26-294','ah26-295','cr26-122','pb26-120','dlr26-141'];
  function grade62(d, c, G) {
    if (MHR_NO_PSA.indexOf(c.id) >= 0) return { html: '<div class="cdp-p62"><p class="hl">PSA stopped grading English Mega Hyper Rares on Nov 25, 2026 (psacard.com), so there is no PSA break-even for this card. The PSA 10 and PSA 9 prices here are copies graded before then.</p></div>', short: 'PSA no longer grades this card' };
    if (!P62.sets[String(d.ticker).toLowerCase()]) return null;
    var sf = window.__schShopFile, v = sf && sf.marks && sf.marks[c.id];
    var g9 = G[1], g10 = G[2];
    if (!v || !(v.m > 0) || g9.m == null || g10.m == null || g9.days !== 30 || g10.days !== 30) return null;
    var vMiss = g9.m - (P62.fvf * g9.m + P62.perOrder);
    if (!(g10.m > vMiss)) return null;
    var p = (v.m + P62.allIn - vMiss) / (g10.m - vMiss);
    var pp = p < 0.01 ? 'under 1%' : Math.round(p * 100) + '%';
    var line = p > 1 ? 'Buy the slab — grading can’t win at this fee.' : p <= 0 ? 'Even a PSA 9 sale covers the cost of grading this card.' : 'Grading only beats buying the PSA 10 if you hit a 10 more than ' + pp + ' of the time.';
    var short = p > 1 ? 'grading can’t beat the slab' : p <= 0 ? 'grading pays even on a 9' : p < 0.01 ? 'grading pays if even 1% of copies get a 10' : 'grading pays if ' + pp + '+ of copies get a 10';
    var html = '<div class="cdp-p62"><h3>Grade it or buy the 10?</h3><p class="hl">' + line + '</p>' +
      '<ul><li>Raw copy: <b>' + money(v.m) + '</b> TCGplayer market, ' + mdShort(sf.asOf) + ' (a copy you’d actually submit usually costs more than this)</li>' +
      '<li>PSA grading: <b>' + money(P62.allIn) + '</b> a card all in (PSA Standard $59.99, plus shipping and supplies over a 20-card batch)</li>' +
      '<li>If it misses: sold as a PSA 9 at <b>' + money(g9.m) + '</b>, <b>' + money(vMiss) + '</b> after eBay fees (13.25% + $0.40)</li>' +
      '<li>The 10: <b>' + money(g10.m) + '</b> PSA 10 median</li></ul>' +
      '<p class="as">Assumes you sell a miss at the PSA 9 price net of fees and buy the 10 anyway; ignores grading turnaround (weeks to months) and the money tied up meanwhile. Misses are priced as PSA 9s only.</p>' +
      '</div>';
    return { html: html, short: short };
  }

  /* Price history chart (Sep 30 2026, Mo: "doesn't price charting show a chart we can use for individual cards?").
   * PriceCharting's monthly value estimate per grade — their series, labelled as theirs; the quote above is our marks.
   * v8: one series at a time, following the grade chip; each month is a point, the dashed line is its 3-month average. */
  function chart(d, c, gOf) {
    var box = document.getElementById('cdp-chart'); if (!box) return null;
    var rows = null, range = 'all', grade = 'raw', ready = false;
    var SER = { raw: { k: 1, lbl: 'Ungraded' }, psa9: { k: 2, lbl: 'Grade 9 (any grader)' }, psa10: { k: 3, lbl: 'PSA 10' } };
    function draw() {
      if (!ready || box.closest('[hidden]')) return;
      var s = SER[grade];
      var pts = s ? rows.filter(function (r) { return r[s.k]; }) : [];
      if (!s || pts.length < 3) {
        box.innerHTML = '<div class="h"><b>Price history</b></div><p class="cdp-none">' + (grade === 'tag10' ? 'PriceCharting keeps no TAG series. TAG 10 sales for this card are in the Sales tab.' : 'Not enough monthly history for this grade yet.') + '</p>';
        return;
      }
      var R = range === 'all' ? rows : rows.slice(-(range === '1y' ? 13 : 37));
      var W = Math.max(300, box.clientWidth - 2), H = W < 560 ? 210 : 260, padL = 54, padR = 14, padT = 12, padB = 26;
      var vals = R.map(function (r) { return r[s.k]; }).filter(Boolean);
      if (vals.length < 2) vals = pts.map(function (r) { return r[s.k]; });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); if (hi <= lo) hi = lo * 1.1;
      var span = hi - lo, y0 = Math.max(0, lo - span * 0.12), y1 = hi + span * 0.12;
      var x = function (i) { return padL + (R.length < 2 ? 0 : i / (R.length - 1) * (W - padL - padR)); };
      var y = function (v) { return padT + (1 - (v - y0) / (y1 - y0)) * (H - padT - padB); };
      var col = d.theme || '#00ccf5';
      var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(s.lbl) + ' monthly price history">';
      for (var t = 0; t <= 3; t++) { var v = y0 + (y1 - y0) * t / 3, yy = y(v).toFixed(1); svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yy + '" y2="' + yy + '" stroke="rgba(255,255,255,.07)"/><text x="' + (padL - 6) + '" y="' + (+yy + 4) + '" text-anchor="end" font-size="11" fill="#7a969e" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,Roboto,Arial,sans-serif">' + money(v) + '</text>'; }
      var step = Math.max(1, Math.round(R.length / (W < 560 ? 4 : 7)));
      R.forEach(function (r, i) { if ((i % step === 0 && R.length - 1 - i >= step * 0.75) || i === R.length - 1) { var mo = r[0]; svg += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (i === R.length - 1 ? 'end' : i === 0 ? 'start' : 'middle') + '" font-size="11" fill="#7a969e" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,Roboto,Arial,sans-serif">' + MON[+mo.slice(5, 7) - 1] + ' ’' + mo.slice(2, 4) + '</text>'; } });
      // 3-month average (dashed), then the monthly points joined by a thin line
      var ma = '', pen = false;
      R.forEach(function (r, i) {
        var j = rows.indexOf(r), w = [rows[j - 2], rows[j - 1], r].filter(function (q) { return q && q[s.k]; });
        if (w.length < 3) { pen = false; return; }
        var a = (w[0][s.k] + w[1][s.k] + w[2][s.k]) / 3; ma += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(a).toFixed(1) + ' '; pen = true;
      });
      var ln = ''; pen = false; var dots = '';
      R.forEach(function (r, i) { var v = r[s.k]; if (!v) { pen = false; return; } ln += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; pen = true; dots += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3" fill="' + col + '"><title>' + MON[+r[0].slice(5, 7) - 1] + ' ' + r[0].slice(0, 4) + ': ' + money(v) + '</title></circle>'; });
      if (ma) svg += '<path d="' + ma + '" fill="none" stroke="#a9bccf" stroke-width="1.5" stroke-dasharray="4 4"/>';
      svg += '<path d="' + ln + '" fill="none" stroke="' + col + '" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>' + dots + '</svg>';
      // P67 (Night Crew Oct 28, FTV + Scout): the change in the legend follows the picked range ("All" printed "-8% in a year"),
      // and a range button that would draw the same line as "All" is not shown (a Jan 2025 set had 1Y = 3Y = All).
      var last = pts[pts.length - 1], Rp = R.filter(function (r) { return r[s.k]; }), first = Rp.length > 1 ? Rp[0] : null;
      var c1 = first && first !== last ? (last[s.k] / first[s.k] - 1) * 100 : null;
      var per = range === '1y' ? 'in a year' : range === '3y' ? 'in 3 years' : first ? 'since ' + MON[+first[0].slice(5, 7) - 1] + ' ' + first[0].slice(0, 4) : '';
      var KS = ['1y', '3y', 'all'].filter(function (k) { return k === 'all' || rows.length > (k === '1y' ? 13 : 37); });
      box.innerHTML = '<div class="h"><b>' + esc(s.lbl) + '</b>' + (KS.length < 2 ? '' : '<span class="rg" role="group" aria-label="Range">' + KS.map(function (k) { return '<button type="button" data-r="' + k + '" aria-pressed="' + (k === range) + '">' + (k === 'all' ? 'All' : k.toUpperCase()) + '</button>'; }).join('') + '</span>') + '</div>' +
        '<div class="leg"><span><i style="background:' + col + '"></i>Monthly estimate <b>' + money(last[s.k]) + '</b> (' + MON[+last[0].slice(5, 7) - 1] + ' ' + last[0].slice(0, 4) + ')' + (c1 == null ? '' : ' <em class="' + (c1 >= 0 ? 'up' : 'dn') + '">' + (c1 >= 0 ? '+' : '') + c1.toFixed(0) + '% ' + per + '</em>') + '</span><span><i class="ma"></i>3-month average</span></div>' + svg +
        '<div class="src">Monthly value estimates from <a href="https://www.pricecharting.com/game/' + esc(c.path || '') + '" rel="nofollow noopener" target="_blank">PriceCharting</a>, built from their tracked sales. The price at the top of this page is our own read, not this chart.' + (grade === 'psa9' ? ' Grade 9 mixes graders (PSA, BGS, CGC…).' : '') + '</div>';
    }
    get('/data/cards/h-' + d.ticker.toLowerCase() + '.json').then(function (h) {
      rows = h && h.cards ? h.cards[c.key || c.num] : null;
      if (!rows || rows.length < 3) { box.closest('.cdp-panel').querySelector('.cdp-chart').outerHTML = '<p class="cdp-none">No monthly price history on file for this card.</p>'; box = null; return; }
      ready = true; box.classList.remove('cdp-wait'); draw();
      box.addEventListener('click', function (e) { var b = e.target.closest('button[data-r]'); if (!b) return; range = b.getAttribute('data-r'); draw(); });
      var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 150); });
    }).catch(function () { if (box) box.outerHTML = '<p class="cdp-none">No monthly price history on file for this card.</p>'; box = null; });
    return { grade: function (k) { grade = k; if (box) draw(); }, redraw: function () { if (box) draw(); } };
  }
})();
