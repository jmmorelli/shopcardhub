/* card-page.js — renders /card?id=<ticker>-<num> (Sep 30 2026). Data: /data/cards/<tk>.json (identity + the index's raw
 * sold mark) and /data/cards/g-<tk>.json (dated PSA 9 / PSA 10 / TAG 10 sold marks). Never an ask, never a guide value
 * (R18/R20): every number on the page is a median of dated sales or one dated sale labelled as one.
 *
 * v8 — card page v2 (PIVOT Oct 19 P0-A, Night Crew Oct 21). One quote header: grade chips (Raw · PSA 9 · PSA 10 · TAG 10)
 * swap one big number, its dated basis line and the chart line; the raw→PSA 10 spread in %; ONE eBay button that follows
 * the chip (P63/P59). Tabs below: Chart · Sales · Grades · Index. Grades carries the grade-or-slab block (P62, spec
 * Amendment 3: implied break-even gem rate only, net miss, assumptions printed; no Edge). Method = a link.
 * R18 (Oct 8 ruling): a median needs ≥ 3 dated rows; fewer prints as one dated sale. */
(function () {
  var main = document.getElementById('cdp'); if (!main) return;
  // v9 (Night Crew Oct 23, P0-A static pages): a static /card-<slug> page carries its id on <main data-card-id>; /card?id= reads the query.
  var id = (main.getAttribute('data-card-id') || new URLSearchParams(location.search).get('id') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  var tk = id.split('-')[0];
  // Static card pages (P0-A, Oct 23): tickers whose basket has /card-<slug> pages. Same slug rule as tools/build-card-template.mjs staticSlug().
  var STATIC_TK = { pris25: 1 };
  function cardUrl(x, tick) { if (!STATIC_TK[tick] || !x.path) return '/card?id=' + x.id; var p = String(x.path).split('/'), nm = p[1] || ''; try { nm = decodeURIComponent(nm); } catch (e) {} return '/card-' + (nm + '-' + (p[0] || '').replace(/^pokemon-/, '')).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) { return n == null ? '' : '$' + Number(n).toLocaleString('en-US', n >= 100 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function md(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : ''; }
  function mdShort(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) : ''; }
  function miss(msg) { var l = document.getElementById('cdp-load'); if (l) l.innerHTML = msg; main.classList.add('cdp-done'); }
  if (!id || !tk) { miss('No card picked. Search a card name in the bar at the top, or <a href="/indices">open an index</a>.'); return; }
  function get(u) { return fetch(u, { cache: 'default' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  // B76 re-land (Oct 19): the shop file is read here too, so the .cdp-shop block and the TCGplayer button get their space
  // on first paint; shop-spread.js fills the reserved slots instead of inserting late (the Oct 16 live CLS 0.039 at 1440).
  var NO_SHOP = { bs1e: 1 };
  Promise.all([get('/data/cards/' + tk + '.json'), get('/data/cards/g-' + tk + '.json').catch(function () { return null; }), NO_SHOP[tk] ? null : get('/data/tcg/' + tk + '.json').catch(function () { return null; })]).then(function (res) {
    var d = res[0], gd = res[1], c = null;
    window.__schShopFile = res[2];
    for (var i = 0; i < d.cards.length; i++) if (d.cards[i].id === id) { c = d.cards[i]; break; }
    if (!c) { miss('That card isn’t in the <a href="' + esc(d.page) + '">' + esc(d.name) + '</a> right now — it may have dropped out of the basket. Search another card in the bar at the top.'); return; }
    render(d, c, gd && gd.cards ? (gd.cards[c.key || c.num] || null) : null, gd);
  }).catch(function () { miss('This card isn’t on file. Search a card name in the bar at the top, or <a href="/indices">open an index</a>.'); });

  /* P62 grade-or-slab defaults — every figure from claude/kb/pokemon/GRADE-DEFAULTS.md (KB run 5, Oct 19 2026).
   * PSA Standard $59.99 → $62.75 a card in a 20-card batch (fee [HIGH] psacard.com, read Sep 25 2026; shipping/supplies [LOW]).
   * eBay selling friction on the miss = 13.25% final value fee + $0.40 per order (eBay Seller Center, Feb 14 2025 schedule [MED]).
   * Scope v1 = SV/MEG-era sets (spec: modern Pokémon only). */
  var P62 = { allIn: 62.75, fee: 59.99, fvf: 0.1325, perOrder: 0.40, sets: { pf25: 1, dr25: 1, sv151: 1, pris25: 1, pb26: 1, cr26: 1, ah26: 1, meg25: 1, ssp24: 1, th26: 1 } };

  function render(d, c, g, gd) {
    var setShort = String(d.set).replace(/^Pokémon TCG /, '');
    document.title = c.name + ' #' + c.num + ' ' + setShort + ' price — Raw, PSA 9, PSA 10, TAG | ShopCardHub';
    main.style.setProperty('--ac', d.theme || '#00ccf5');
    var raw = c.raw;
    var scr = c.screened && c.why === 'screen', chase = d.kind === 'chase', win = (d.screen && d.screen.window) || d.window || 30;
    var gRead = (g && g.asOf) || (gd && gd.day) || null;
    // One entry per grade: m = the number we print (a median of ≥ 3 dated rows), one = a single dated sale when there is no median.
    var G = [{ k: 'raw', lbl: 'Raw', eb: 'raw', m: scr ? null : raw }];
    if (scr) G[0].basis = 'Not priced: ' + (c.n30 != null ? c.n30 + ' clean raw sales in the last ' + win + ' days' : 'below the liquidity screen') + '. It enters the index at ' + ((d.screen && d.screen.enter) || 6) + ' in ' + win + ' days.';
    else if (raw == null) G[0].basis = 'Too few raw sales to mark.';
    else if (chase) G[0].basis = 'PriceCharting’s ungraded value, read ' + md(c.rawAsOf);
    else G[0].basis = 'Median of ' + (c.wn != null ? c.wn : c.n30) + ' raw sales, ' + (c.win || d.window || 30) + ' days · marked ' + md(c.rawAsOf);
    [['psa9', 'PSA 9', 'psa9'], ['psa10', 'PSA 10', 'psa10'], ['tag10', 'TAG 10', 'tag']].forEach(function (p) {
      var x = g ? g[p[0]] : null, e = { k: p[0], lbl: p[1], eb: p[2], m: null, one: null, n: x && x.n, days: x && x.basis === '30d' ? 30 : 90 };
      if (x && x.m && x.n >= 3) { e.m = x.m; e.basis = 'Median of ' + x.n + ' dated sales, ' + e.days + ' days · read ' + md(gRead) + (x.last ? ' · last sale ' + money(x.last.p) + ', ' + mdShort(x.last.d) : ''); }
      else if (x && x.last) { e.one = x.last; e.basis = '1 dated sale, ' + md(x.last.d) + ' · fewer than 3 in 90 days, so no median'; }
      else e.basis = !g ? 'Graded read pending' : p[0] === 'tag10' ? 'No TAG 10 sale in 12 months' : 'No dated sale in 12 months';
      G.push(e);
    });
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
    var more = d.cards.filter(function (x) { return x.id !== c.id && x.raw != null; }).slice(0, 8).map(function (x) {
      return '<a href="' + cardUrl(x, tk) + '"><b>' + esc(x.name) + ' #' + esc(x.num) + '</b>raw ' + money(x.raw) + ' · ' + (x.w === 0 ? 'own line' : x.w != null ? x.w.toFixed(1) + '% of index' : '') + '</a>';
    }).join('');
    // Sales tab: the dated rows we hold (R18) — one per grade, newest sale with its date, plus the median it sits in.
    var salesRows = G.map(function (e) {
      if (e.k === 'raw') return '<tr><th>Raw</th><td>' + (e.m != null ? money(e.m) : '') + '</td><td>' + esc(e.basis) + '</td></tr>';
      var x = g && g[e.k];
      return '<tr><th>' + e.lbl + '</th><td>' + (x && x.last ? money(x.last.p) : '') + '</td><td>' + (x && x.last ? 'last dated sale, ' + md(x.last.d) + (e.m != null ? ' · in a median of ' + e.n + ' sales, ' + e.days + ' days: ' + money(e.m) : '') : esc(e.basis)) + '</td></tr>';
    }).join('');
    var gradeList = G.map(function (e) {
      var x = e.k !== 'raw' && e.m && raw ? (e.m / raw) : null;
      return '<div><dt>' + e.lbl + '</dt><dd><b>' + bigOf(e) + '</b>' + (x ? ' <em>' + x.toFixed(x >= 10 ? 0 : x < 2 ? 2 : 1) + '× raw</em>' : '') + '<small>' + esc(e.basis) + '</small></dd></div>';
    }).join('');
    var setLink = '<a href="' + esc(d.page) + '">' + esc(setShort) + '</a>';
    main.innerHTML =
      '<div class="cdp-crumbs"><a href="/">Home</a><span>/</span><a href="' + esc(d.page) + '">' + esc(d.ticker) + '</a><span>/</span><span>' + esc(c.name) + ' #' + esc(c.num) + '</span></div>' +
      '<div class="cdp-top"><div class="cdp-photo"><span data-card-img="' + esc(c.img) + '" data-card-name="' + esc(c.name) + ' #' + esc(c.num) + ' ' + esc(d.set) + '" data-card-sub="pokemon" data-card-size="hero" data-card-surface="card-page" data-card-link="off"></span></div>' +
      '<div class="cdp-info"><h1>' + esc(c.name) + ' #' + esc(c.num) + '</h1><p class="cdp-set">' + setLink + ' · #' + esc(c.num) + (c.rarity ? ' · ' + esc(c.rarity) : '') + '</p></div>' +
      '<div class="cdp-q" id="cdp-q"><div class="cdp-gr" role="tablist" aria-label="Grade">' + chips + '</div>' +
      '<div class="cdp-big" id="cdp-big"></div><div class="cdp-basis" id="cdp-basis"></div>' +
      (spread != null ? '<div class="cdp-spread">Raw → PSA 10: <b>' + (spread >= 0 ? '+' : '−') + Math.abs(spread).toFixed(0) + '%</b>' + (p62 ? ' · <a href="#cdp-tab-grades" data-tab="grades">' + esc(p62.short) + ' →</a>' : '') + '</div>' : '') +
      '<div class="cdp-cta"><a class="cdp-ebay" id="cdp-ebay" data-cid="' + cid + '" target="_blank" rel="sponsored nofollow noopener"></a>' +
      '<a class="cdp-auc" id="cdp-auc" data-cid="' + cid + '" data-mode="auc" target="_blank" rel="sponsored nofollow noopener">Auctions ending soon</a>' +
      '<button type="button" class="sch-track-card" data-name="' + esc(c.name) + ' #' + esc(c.num) + ' — ' + esc(d.set) + '" data-set="' + esc(d.set) + '" data-cat="pokemon" data-grade="Raw" data-price="' + (raw == null ? '' : raw) + '">★ Watch</button></div></div></div>' +
      '<div class="cdp-tabs" role="tablist" aria-label="Card sections">' + [['chart', 'Chart'], ['sales', 'Sales'], ['grades', 'Grades'], ['index', 'Index']].map(function (t, i) {
        return '<button type="button" role="tab" id="cdp-tab-' + t[0] + '" data-tab="' + t[0] + '" aria-selected="' + (i === 0) + '" aria-controls="cdp-p-' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<section class="cdp-panel" id="cdp-p-chart" role="tabpanel" aria-labelledby="cdp-tab-chart"><div class="cdp-chart cdp-wait" id="cdp-chart"><div class="wl">Loading price history…</div></div></section>' +
      '<section class="cdp-panel" id="cdp-p-sales" role="tabpanel" aria-labelledby="cdp-tab-sales" hidden><table class="cdp-sales"><thead><tr><th>Grade</th><th>Price</th><th>What it is</th></tr></thead><tbody>' + salesRows + '</tbody></table>' +
      '<p class="cdp-note">PSA 9, PSA 10 and TAG 10 count only sales whose own listing title names that grade (PriceCharting’s dated completed sales).</p></section>' +
      '<section class="cdp-panel" id="cdp-p-grades" role="tabpanel" aria-labelledby="cdp-tab-grades" hidden><dl class="cdp-kv">' + gradeList + '</dl>' + (p62 ? p62.html : '') + '</section>' +
      '<section class="cdp-panel" id="cdp-p-index" role="tabpanel" aria-labelledby="cdp-tab-index" hidden><div class="cdp-ix"><a class="go" href="' + esc(d.page) + '">' + esc(d.ticker) + ' ' + esc(d.name) + (d.level != null ? ' · ' + Number(d.level).toFixed(2) : '') + ' →</a>' +
      '<p>' + (scr ? 'Tracked in this index, outside the level (below the liquidity screen).' : c.w === 0 ? 'Tracked as its own line, not in the weighted basket.' : '#' + c.rank + ' by weight' + (c.w != null ? ' · ' + c.w.toFixed(1) + '% of the index' : '') + (d.asOf ? ' · index marked ' + md(d.asOf) : '')) + '</p></div>' +
      (more ? '<div class="cdp-more"><h2>More from the ' + esc(d.ticker) + ' basket</h2><div class="g">' + more + '</div></div>' : '') + '</section>' +
      '<div class="cdp-buy"><div class="h"><b>Other places to buy</b></div>' +
      (shopMark() ? '<div class="cdp-shop cdp-shop-wait" aria-hidden="true"></div>' : '') + '<div class="cdp-btns" id="cdp-btns">' + (shopMark() ? '<span class="tcg-slot" aria-hidden="true"></span>' : '') + '</div>' +
      '<div class="f">eBay searches for this exact card in each grade, with our affiliate tag (ShopCardHub earns a commission at no cost to you) — live listings, not prices. ' + (d.ed === '1st' ? 'Searches are for the 1st Edition print this index tracks. ' : d.ed === 'shadowless' ? 'Searches are for Shadowless copies and exclude 1st Edition. ' : d.wotc ? 'Searches exclude 1st Edition and Shadowless copies: this index tracks the Unlimited print. ' : '') + '<b>TAG:</b> we link TAG because it publishes its measurements. PSA is the reference grade. Our view: machine grading wins over time. <a href="/tag-grading-guide">How TAG grading works →</a></div></div>' +
      '<p class="cdp-method"><a href="/how-prices-work">How we price a card →</a></p>';
    function shopMark() { var sf = window.__schShopFile; return !!(sf && sf.marks && sf.marks[c.id]); }

    var big = document.getElementById('cdp-big'), basis = document.getElementById('cdp-basis'), eb = document.getElementById('cdp-ebay'), auc = document.getElementById('cdp-auc');
    function setGrade(k, by) {
      pick = k; var e = gOf(k);
      main.querySelectorAll('.cdp-gr button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-g') === k)); });
      big.textContent = bigOf(e); big.classList.toggle('na', e.m == null && !e.one);
      basis.textContent = e.basis;
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
    main.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-tab]'); if (!b) return;
      ev.preventDefault(); tab(b.getAttribute('data-tab'));
      if (b.tagName === 'A') { var tb = document.getElementById('cdp-tab-' + b.getAttribute('data-tab')); if (tb) { tb.focus({ preventScroll: true }); tb.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } }
    });
    setGrade('raw');
    [eb, auc].forEach(function (a) { if (window.SCH_GLK && SCH_GLK.track) SCH_GLK.track(a); });
    if (window.SCHVault && SCHVault.mark) SCHVault.mark(main);
    chartApi = chart(d, c, gOf);
    if (chartApi) chartApi.grade(pick);
    // shop-spread.js (Oct 15 2026) fills the TCGplayer shop price / spread block into .cdp-buy once the card is on the page
    window.__schCard = { d: d, c: c };
    try { document.dispatchEvent(new CustomEvent('sch:card-rendered', { detail: window.__schCard })); } catch (e) {}
    try { if (typeof gtag === 'function') gtag('event', 'card_page_view', { item: c.id }); } catch (e) {}
  }

  /* P62 — grade it or buy the 10 (spec claude/cos/grade-or-slab-spec-2026-10-16.md + Amendment 3).
   * p* = (raw + all-in − V_miss) / (slab − V_miss); raw = TCGplayer market (R38 shop file), V_miss = PSA 9 median net of
   * eBay fees, slab = PSA 10 median. Renders only for SV/MEG-era cards with a shop price and ≥ 3 dated PSA 9 and PSA 10
   * sales in 30 days. Implied rate only: the Edge (actual − implied) stays held (Am. 3, GAPS P30). */
  function grade62(d, c, G) {
    if (!P62.sets[String(d.ticker).toLowerCase()]) return null;
    var sf = window.__schShopFile, v = sf && sf.marks && sf.marks[c.id];
    var g9 = G[1], g10 = G[2];
    if (!v || !(v.m > 0) || g9.m == null || g10.m == null || g9.days !== 30 || g10.days !== 30) return null;
    var vMiss = g9.m - (P62.fvf * g9.m + P62.perOrder);
    if (!(g10.m > vMiss)) return null;
    var p = (v.m + P62.allIn - vMiss) / (g10.m - vMiss);
    var pp = p < 0.01 ? 'under 1%' : Math.round(p * 100) + '%';
    var line = p > 1 ? 'Buy the slab — grading can’t win at this fee.' : p <= 0 ? 'Even a PSA 9 sale covers the cost of grading this card.' : 'Grading only beats buying the PSA 10 if you hit a 10 more than ' + pp + ' of the time.';
    var short = p > 1 ? 'grading can’t beat the slab' : p <= 0 ? 'grading pays even on a 9' : 'grading wins above a ' + pp + ' gem rate';
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
      for (var t = 0; t <= 3; t++) { var v = y0 + (y1 - y0) * t / 3, yy = y(v).toFixed(1); svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yy + '" y2="' + yy + '" stroke="rgba(255,255,255,.07)"/><text x="' + (padL - 6) + '" y="' + (+yy + 4) + '" text-anchor="end" font-size="11" fill="#7a969e" font-family="ui-monospace,monospace">' + money(v) + '</text>'; }
      var step = Math.max(1, Math.round(R.length / (W < 560 ? 4 : 7)));
      R.forEach(function (r, i) { if ((i % step === 0 && R.length - 1 - i >= step * 0.75) || i === R.length - 1) { var mo = r[0]; svg += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (i === R.length - 1 ? 'end' : i === 0 ? 'start' : 'middle') + '" font-size="11" fill="#7a969e" font-family="ui-monospace,monospace">' + MON[+mo.slice(5, 7) - 1] + ' ’' + mo.slice(2, 4) + '</text>'; } });
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
      var last = pts[pts.length - 1], yr = pts.length > 12 ? pts[pts.length - 13] : null, c1 = yr ? (last[s.k] / yr[s.k] - 1) * 100 : null;
      box.innerHTML = '<div class="h"><b>' + esc(s.lbl) + '</b><span class="rg" role="group" aria-label="Range">' + ['1y', '3y', 'all'].map(function (k) { return '<button type="button" data-r="' + k + '" aria-pressed="' + (k === range) + '">' + (k === 'all' ? 'All' : k.toUpperCase()) + '</button>'; }).join('') + '</span></div>' +
        '<div class="leg"><span><i style="background:' + col + '"></i>Monthly estimate <b>' + money(last[s.k]) + '</b> (' + MON[+last[0].slice(5, 7) - 1] + ' ' + last[0].slice(0, 4) + ')' + (c1 == null ? '' : ' <em class="' + (c1 >= 0 ? 'up' : 'dn') + '">' + (c1 >= 0 ? '+' : '') + c1.toFixed(0) + '% in a year</em>') + '</span><span><i class="ma"></i>3-month average</span></div>' + svg +
        '<div class="src">Monthly value estimates from <a href="https://www.pricecharting.com/game/' + esc(c.path || '') + '" rel="nofollow noopener" target="_blank">PriceCharting</a>, built from their tracked sales. The number above the chart is our mark.' + (grade === 'psa9' ? ' Grade 9 mixes graders (PSA, BGS, CGC…).' : '') + '</div>';
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
