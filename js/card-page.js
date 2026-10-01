/* card-page.js — renders /card?id=<ticker>-<num> (Sep 30 2026). Data: /data/cards/<tk>.json (identity + the index's raw
 * sold mark) and /data/cards/g-<tk>.json (dated PSA 9 / PSA 10 / TAG 10 sold marks). Never an ask, never a guide value
 * (R18/R20): every number on the page is a median of dated sales or one dated sale labelled as one. */
(function () {
  var main = document.getElementById('cdp'); if (!main) return;
  var id = (new URLSearchParams(location.search).get('id') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  var tk = id.split('-')[0];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) { return n == null ? '—' : '$' + Number(n).toLocaleString('en-US', n >= 100 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function md(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : ''; }
  function miss(msg) { var l = document.getElementById('cdp-load'); if (l) l.innerHTML = msg; }
  if (!id || !tk) { miss('No card picked. Search a card name in the bar at the top, or <a href="/indices">open an index</a>.'); return; }
  function get(u) { return fetch(u, { cache: 'default' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  Promise.all([get('/data/cards/' + tk + '.json'), get('/data/cards/g-' + tk + '.json').catch(function () { return null; })]).then(function (res) {
    var d = res[0], gd = res[1], c = null;
    for (var i = 0; i < d.cards.length; i++) if (d.cards[i].id === id) { c = d.cards[i]; break; }
    if (!c) { miss('That card isn’t in the <a href="' + esc(d.page) + '">' + esc(d.name) + '</a> right now — it may have dropped out of the basket. Search another card in the bar at the top.'); return; }
    render(d, c, gd && gd.cards ? gd.cards[c.num] : null, gd);
  }).catch(function () { miss('This card isn’t on file. Search a card name in the bar at the top, or <a href="/indices">open an index</a>.'); });

  function render(d, c, g, gd) {
    var setShort = String(d.set).replace(/^Pokémon TCG /, '');
    document.title = c.name + ' #' + c.num + ' ' + setShort + ' — Raw vs PSA 9 vs PSA 10 vs TAG | ShopCardHub';
    main.style.setProperty('--ac', d.theme || '#00ccf5');
    var raw = c.raw;
    var R = [
      { k: 'raw', lbl: 'Raw', m: raw, sub: 'index sold mark · median of ' + c.n30 + ' sales, 30 days', last: null },
    ];
    [['psa9', 'PSA 9'], ['psa10', 'PSA 10'], ['tag10', 'TAG 10']].forEach(function (p) {
      var x = g ? g[p[0]] : undefined;
      R.push({ k: p[0], lbl: p[1], m: x && x.m, sub: x ? (x.m ? 'median of ' + x.n + ' dated sales, ' + (x.basis === '30d' ? '30' : '90') + ' days' : (x.last ? 'fewer than 2 sales in 90 days' : 'no dated sale in 12 months')) : (g === undefined || !g ? 'graded read pending' : 'no sales tab'), last: x && x.last, pending: !g });
    });
    function rung(r) {
      var x = r.k !== 'raw' && r.m && raw ? (r.m / raw) : null;
      var v = r.m != null ? '<div class="v">' + money(r.m) + '</div>' : '<div class="v na">' + (r.pending ? 'Pending' : 'No mark') + '</div>';
      var last = r.last ? '<br>last sale ' + money(r.last.p) + ' · ' + md(r.last.d) : '';
      return '<div class="cdp-rung' + (r.k === 'tag10' ? ' tag' : '') + '"><div class="k"><b>' + r.lbl + '</b>' + (r.k === 'raw' ? ' · ungraded' : ' · sold') + '</div>' + v +
        '<div class="x">' + (x ? x.toFixed(x >= 10 ? 0 : x < 2 ? 2 : 1) + '× raw' : r.k === 'raw' ? 'base' : '') + '</div><div class="n">' + esc(r.sub) + last + '</div></div>';
    }
    var have = R.filter(function (r) { return r.m != null && r.m > 0; });
    var lo = Math.min.apply(null, have.map(function (r) { return r.m; })) * 0.7, hi = Math.max.apply(null, have.map(function (r) { return r.m; }));
    var bars = have.length >= 2 ? '<div class="cdp-bars"><div class="h">The ladder on a log scale — each equal step is the same multiple, not the same dollars</div>' + have.map(function (r) {
      var w = Math.max(2, (Math.log(r.m) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) * 100);
      return '<div class="cdp-bar' + (r.k === 'tag10' ? ' tag' : '') + '"><span>' + r.lbl + '</span><i style="width:' + w.toFixed(1) + '%"></i><span>' + money(r.m) + '</span></div>';
    }).join('') + statLine() + '</div>' : '';
    function statLine() {
      var p9 = R[1].m, p10 = R[2].m, t10 = R[3].m, out = [];
      if (p9 && raw) out.push('PSA 9 = <b>' + (p9 / raw).toFixed(1) + '×</b> raw');
      if (p10 && raw) out.push('PSA 10 = <b>' + (p10 / raw).toFixed(1) + '×</b> raw');
      if (p10 && p9) out.push('the 9 → 10 step = <b>' + (p10 / p9).toFixed(1) + '×</b>');
      if (t10 && p10) out.push('TAG 10 = <b>' + Math.round(t10 / p10 * 100) + '%</b> of PSA 10');
      return out.length ? '<div class="cdp-stat">Grading premium: ' + out.join(' · ') + '.</div>' : '';
    }
    var cid = 'card-' + c.id;
    var mode = window.SCH_GLK ? SCH_GLK.getMode() : 'bin';
    function btns(m) {
      if (!window.SCH_GLK) return '';
      var av = raw >= 200;
      return [['raw', 'Raw', R[0]], ['psa9', 'PSA 9', R[1]], ['psa10', 'PSA 10', R[2]], ['tag', 'TAG', R[3]]].map(function (b) {
        var u = SCH_GLK.url({ q: c.q, g: b[0], wotc: !!d.wotc, cid: cid, mode: m, av: av });
        var note = b[2].m ? 'sold mark ' + money(b[2].m) : b[0] === 'tag' ? 'AI-graded slabs' : 'live listings';
        return '<a class="' + (b[0] === 'tag' ? 'tag' : '') + '" data-g="' + b[0] + '" data-cid="' + cid + '" data-mode="' + m + '" href="' + u + '" target="_blank" rel="sponsored nofollow noopener">' + b[1] + ' on eBay<small>' + (m === 'auc' ? 'auctions, ending soonest · ' : '') + note + '</small></a>';
      }).join('');
    }
    var more = d.cards.filter(function (x) { return x.id !== c.id; }).slice(0, 8).map(function (x) {
      return '<a href="/card?id=' + x.id + '"><b>' + esc(x.name) + ' #' + esc(x.num) + '</b>raw ' + money(x.raw) + ' · ' + (x.w != null ? x.w.toFixed(1) + '% of index' : '') + '</a>';
    }).join('');
    main.innerHTML =
      '<div class="cdp-crumbs"><a href="/">Home</a><span>/</span><a href="/indices">Indices</a><span>/</span><a href="' + esc(d.page) + '">' + esc(d.ticker) + '</a><span>/</span><span>' + esc(c.name) + ' #' + esc(c.num) + '</span></div>' +
      '<div class="cdp-top"><div class="cdp-photo"><span data-card-img="' + esc(c.img) + '" data-card-name="' + esc(c.name) + ' #' + esc(c.num) + ' ' + esc(d.set) + '" data-card-sub="pokemon" data-card-size="hero" data-card-surface="card-page" data-card-link="off"></span></div><div>' +
      '<div class="cdp-eyebrow">▮ Card price ladder · raw to PSA 10</div><h1>' + esc(c.name) + ' #' + esc(c.num) + '</h1>' +
      '<p class="cdp-set">' + esc(d.set) + ' · in the <a href="' + esc(d.page) + '#' + esc(d.ticker.toLowerCase()) + '">' + esc(d.ticker) + ' ' + esc(d.name) + '</a></p>' +
      '<div class="cdp-idx"><a href="' + esc(d.page) + '">' + esc(d.ticker) + (d.level != null ? ' ' + Number(d.level).toFixed(2) : '') + ' →</a><span>#' + c.rank + ' by weight</span>' + (c.w != null ? '<span>' + c.w.toFixed(1) + '% of the index</span>' : '') + '<span>raw marked ' + md(c.rawAsOf) + '</span>' + (gd && gd.day ? '<span>graded read ' + md(gd.day) + '</span>' : '') + '</div>' +
      '<div class="cdp-ladder">' + R.map(rung).join('') + '</div></div></div>' + bars +
      '<div class="cdp-buy"><div class="h"><b>Get this card</b><span class="cdp-mode" role="group" aria-label="Which eBay listings the buttons open"><button type="button" data-mode="bin" aria-pressed="' + (mode === 'bin') + '">Buy It Now</button><button type="button" data-mode="auc" aria-pressed="' + (mode === 'auc') + '">Auctions · ending soon</button></span></div>' +
      '<div class="cdp-btns" id="cdp-btns">' + btns(mode) + '</div>' +
      '<div class="f">eBay searches for this exact card in each grade, with our affiliate tag (ShopCardHub earns a commission at no cost to you) — live listings, not prices. ' + (d.wotc ? 'Searches exclude 1st Edition and Shadowless copies: this index tracks the Unlimited print. ' : '') + '<b>TAG</b> grades with an AI scan of every card — our pick for new submissions. <a href="/tag-grading-guide">How TAG grading works →</a></div>' +
      '<div class="cdp-row"><button type="button" class="sch-track-card" data-name="' + esc(c.name) + ' #' + esc(c.num) + ' — ' + esc(d.set) + '" data-set="' + esc(d.set) + '" data-cat="pokemon" data-grade="Raw" data-price="' + raw + '">★ Watch this card</button></div></div>' +
      (more ? '<div class="cdp-more"><h2>More from the ' + esc(d.ticker) + ' basket</h2><div class="g">' + more + '</div></div>' : '') +
      '<p class="cdp-method"><b>Method.</b> <b>Raw</b> is the card’s sold mark in its set index: the median of its clean ungraded sold comps over the trailing 30 days (PriceCharting), re-marked Monday and Thursday — the same number as the index table. <b>PSA 9, PSA 10, TAG 10</b> come from PriceCharting’s dated completed sales for this card, counting only sales whose own listing title names that grade' + (d.wotc ? ' (and dropping any titled 1st Edition or Shadowless)' : '') + ': the median of 3+ sales in 30 days, else 2+ in 90 days. Fewer than that is <b>no mark</b>; a single sale is shown as one dated sale, never as a price. Medians of recent sales, not calls. Raw vintage copies can be in any condition, so the raw mark is a typical raw sale, not a near-mint price.</p>';
    var box = document.getElementById('cdp-btns');
    function wire() { box.querySelectorAll('a[data-g]').forEach(function (a) { if (window.SCH_GLK) SCH_GLK.track(a); }); }
    wire();
    main.querySelector('.cdp-mode').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-mode]'); if (!b) return;
      var m = b.getAttribute('data-mode'); if (window.SCH_GLK) SCH_GLK.setMode(m);
      main.querySelectorAll('.cdp-mode button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      box.innerHTML = btns(m); wire();
      try { if (typeof gtag === 'function') gtag('event', 'grade_mode', { mode: m, page: '/card' }); } catch (err) {}
    });
    if (window.SCHVault && SCHVault.mark) SCHVault.mark(main);
    try { if (typeof gtag === 'function') gtag('event', 'card_page_view', { item: c.id }); } catch (e) {}
  }
})();
