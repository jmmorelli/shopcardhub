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
  function miss(msg) { var l = document.getElementById('cdp-load'); if (l) l.innerHTML = msg; main.classList.add('cdp-done'); }
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
    // Oct 4 2026 (build E): screened = tracked but outside the level. why "screen": below the liquidity screen at the last read,
    // so no raw mark is published; why "line": held at weight 0 by rule (still marked). kind "chase": the six chase indices,
    // marked weekly on PriceCharting's ungraded sold value rather than a 30-day median of our own clean rows.
    var scr = c.screened && c.why === 'screen', chase = d.kind === 'chase', win = (d.screen && d.screen.window) || d.window || 30;
    var R = [
      { k: 'raw', lbl: 'Raw', m: raw, sub: scr ? 'not priced · below the liquidity screen' : chase ? 'index sold mark · PriceCharting ungraded sold value, re-marked weekly' : 'index sold mark · median of ' + c.n30 + ' sales, ' + (d.window || 30) + ' days', last: null, scr: scr },
    ];
    [['psa9', 'PSA 9'], ['psa10', 'PSA 10'], ['tag10', 'TAG 10']].forEach(function (p) {
      var x = g ? g[p[0]] : undefined;
      R.push({ k: p[0], lbl: p[1], m: x && x.m, sub: x ? (x.m ? 'median of ' + x.n + ' dated sales, ' + (x.basis === '30d' ? '30' : '90') + ' days' : (x.last ? 'fewer than 2 sales in 90 days' : 'no dated sale in 12 months')) : (g === undefined || !g ? 'graded read pending' : 'no sales tab'), last: x && x.last, pending: !g });
    });
    function rung(r) {
      var x = r.k !== 'raw' && r.m && raw ? (r.m / raw) : null;
      var v = r.m != null ? '<div class="v">' + money(r.m) + '</div>' : '<div class="v na">' + (r.scr ? 'Not priced' : r.pending ? 'Pending' : r.k === 'tag10' ? 'No recent TAG sales' : 'No mark') + '</div>';
      var last = r.last ? '<br>last sale ' + money(r.last.p) + ' · ' + md(r.last.d) : '';
      return '<div class="cdp-rung' + (r.k === 'tag10' ? ' tag' : '') + '"><div class="k"><b>' + r.lbl + '</b>' + (r.k === 'raw' ? ' · ungraded' : ' · sold') + '</div>' + v +
        '<div class="x">' + (x ? x.toFixed(x >= 10 ? 0 : x < 2 ? 2 : 1) + '× raw' : r.k === 'raw' && r.m != null ? 'base' : '') + '</div><div class="n">' + esc(r.sub) + last + '</div></div>';
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
      var av = raw >= 200 || R.some(function (r) { return r.k !== 'raw' && r.m >= 200; });
      return [['raw', 'Raw', R[0]], ['psa9', 'PSA 9', R[1]], ['psa10', 'PSA 10', R[2]], ['tag', 'TAG', R[3]]].map(function (b) {
        var u = SCH_GLK.url({ q: c.q, g: b[0], wotc: d.ed === '1st' || d.ed === 'shadowless' ? d.ed : !!d.wotc, cid: cid, mode: m, av: av });
        var note = b[2].m ? 'sold mark ' + money(b[2].m) : b[0] === 'tag' ? 'no recent TAG sales' : 'live listings';
        return '<a class="' + (b[0] === 'tag' ? 'tag' : '') + '" data-g="' + b[0] + '" data-cid="' + cid + '" data-mode="' + m + '" href="' + u + '" target="_blank" rel="sponsored nofollow noopener">' + b[1] + ' on eBay<small>' + (m === 'auc' ? 'auctions, ending soonest · ' : '') + note + '</small></a>';
      }).join('');
    }
    var more = d.cards.filter(function (x) { return x.id !== c.id && x.raw != null; }).slice(0, 8).map(function (x) {
      return '<a href="/card?id=' + x.id + '"><b>' + esc(x.name) + ' #' + esc(x.num) + '</b>raw ' + money(x.raw) + ' · ' + (x.w === 0 ? 'own line' : x.w != null ? x.w.toFixed(1) + '% of index' : '') + '</a>';
    }).join('');
    var gRead = (g && g.asOf) || (gd && gd.day) || null;   // the card's own graded read date (a --missing ladder run adds rows without a full read)
    var scrNote = scr ? '<p class="cdp-scr"><b>Tracked, not enough raw sales to price this month</b> (' + (c.n30 != null ? c.n30 + ' clean sales in the last ' + win + ' days' : 'below the liquidity screen') + (d.screen && d.screen.read ? ', screen read ' + md(d.screen.read) : '') + '); graded sales below. It enters the index at ' + ((d.screen && d.screen.enter) || 6) + ' clean raw sales in ' + win + ' days.</p>' : '';
    main.innerHTML =
      '<div class="cdp-crumbs"><a href="/">Home</a><span>/</span><a href="/indices">Indices</a><span>/</span><a href="' + esc(d.page) + '">' + esc(d.ticker) + '</a><span>/</span><span>' + esc(c.name) + ' #' + esc(c.num) + '</span></div>' +
      '<div class="cdp-top"><div class="cdp-photo"><span data-card-img="' + esc(c.img) + '" data-card-name="' + esc(c.name) + ' #' + esc(c.num) + ' ' + esc(d.set) + '" data-card-sub="pokemon" data-card-size="hero" data-card-surface="card-page" data-card-link="off"></span></div><div class="cdp-info">' +
      '<div class="cdp-eyebrow">▮ Card price ladder · raw to PSA 10</div><h1>' + esc(c.name) + ' #' + esc(c.num) + '</h1>' +
      '<p class="cdp-set">' + esc(d.set) + ' · in the <a href="' + esc(d.page) + '#' + esc(d.ticker.toLowerCase()) + '">' + esc(d.ticker) + ' ' + esc(d.name) + '</a></p>' +
      '<div class="cdp-idx"><a href="' + esc(d.page) + '">' + esc(d.ticker) + (d.level != null ? ' ' + Number(d.level).toFixed(2) : '') + ' →</a>' + (scr ? '<span>tracked · outside the level</span>' : c.w === 0 ? '<span>tracked as its own line · not in the weighted basket</span>' : '<span>#' + c.rank + ' by weight' + (c.w != null ? ' · ' + c.w.toFixed(1) + '% of the index' : '') + '</span>') + (scr ? (gRead ? '<span>graded read ' + md(gRead) + '</span>' : '') : '<span>raw marked ' + md(c.rawAsOf) + (gRead ? ' · graded read ' + md(gRead) : '') + '</span>') + '</div>' + scrNote + '</div>' +
      '<div class="cdp-ladder">' + R.map(rung).join('') + '</div></div>' + '<div class="cdp-chart cdp-wait" id="cdp-chart"><div class="wl">Loading price history…</div></div>' + bars +
      '<div class="cdp-buy"><div class="h"><b>Get this card</b><span class="cdp-mode" role="group" aria-label="Which eBay listings the buttons open"><button type="button" data-mode="bin" aria-pressed="' + (mode === 'bin') + '">Buy It Now</button><button type="button" data-mode="auc" aria-pressed="' + (mode === 'auc') + '">Auctions · ending soon</button></span></div>' +
      '<div class="cdp-btns" id="cdp-btns">' + btns(mode) + '</div>' +
      '<div class="f">eBay searches for this exact card in each grade, with our affiliate tag (ShopCardHub earns a commission at no cost to you) — live listings, not prices. ' + (d.ed === '1st' ? 'Searches are for the 1st Edition print this index tracks. ' : d.ed === 'shadowless' ? 'Searches are for Shadowless copies and exclude 1st Edition. ' : d.wotc ? 'Searches exclude 1st Edition and Shadowless copies: this index tracks the Unlimited print. ' : '') + '<b>TAG:</b> we link TAG because it publishes its measurements. PSA is the reference grade. Our view: machine grading wins over time. <a href="/tag-grading-guide">How TAG grading works →</a></div>' +
      '<div class="cdp-row"><button type="button" class="sch-track-card" data-name="' + esc(c.name) + ' #' + esc(c.num) + ' — ' + esc(d.set) + '" data-set="' + esc(d.set) + '" data-cat="pokemon" data-grade="Raw" data-price="' + (raw == null ? '' : raw) + '">★ Watch this card</button></div></div>' +
      (more ? '<div class="cdp-more"><h2>More from the ' + esc(d.ticker) + ' basket</h2><div class="g">' + more + '</div></div>' : '') +
      '<p class="cdp-method"><b>Method.</b> ' + (chase ? '<b>Raw</b> is the card’s sold mark in its chase index: PriceCharting’s ungraded sold value for the card, re-marked weekly — the same number as the index table.' : scr ? '<b>Raw</b> is not priced: this card is in the set’s universe but sold too rarely as a clean ungraded single to clear the index’s liquidity screen (' + ((d.screen && d.screen.enter) || 6) + ' sales in ' + win + ' days to enter) at the last read, so it is tracked outside the level and shows no raw number.' : '<b>Raw</b> is the card’s sold mark in its set index: the median of its clean ungraded sold comps over the trailing ' + (d.window || 30) + ' days (PriceCharting), re-marked Monday and Thursday — the same number as the index table.') + ' <b>PSA 9, PSA 10, TAG 10</b> come from PriceCharting’s dated completed sales for this card, counting only sales whose own listing title names that grade' + (d.ed === '1st' ? ' (and only sales whose title says 1st Edition)' : d.ed === 'shadowless' ? ' (and only sales titled Shadowless, never 1st Edition)' : d.wotc ? ' (and dropping any titled 1st Edition or Shadowless)' : '') + ': the median of 3+ sales in 30 days, else 2+ in 90 days. Fewer than that is <b>no mark</b>; a single sale is shown as one dated sale, never as a price. Medians of recent sales, not calls. Raw vintage copies can be in any condition, so the raw mark is a typical raw sale, not a near-mint price.</p>';
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
    chart(d, c);
    try { if (typeof gtag === 'function') gtag('event', 'card_page_view', { item: c.id }); } catch (e) {}
  }
  /* Price history chart (Sep 30 2026, Mo: "doesn't price charting show a chart we can use for individual cards?").
   * PriceCharting's monthly value estimate per grade — their series, labelled as theirs; the ladder above stays our marks. */
  function chart(d, c) {
    var box = document.getElementById('cdp-chart'); if (!box) return;
    get('/data/cards/h-' + d.ticker.toLowerCase() + '.json').then(function (h) {
      var rows = h && h.cards ? h.cards[c.num] : null; if (!rows || rows.length < 3) { box.hidden = true; return; }
      var S = [{ k: 1, lbl: 'Ungraded', col: d.theme || '#00ccf5' }, { k: 2, lbl: 'Grade 9 (any grader)', col: '#a9bccf' }, { k: 3, lbl: 'PSA 10', col: '#f5c800' }]
        .filter(function (s) { return rows.filter(function (r) { return r[s.k]; }).length >= 3; });
      if (!S.length) { box.hidden = true; return; }
      var range = 'all';
      box.classList.remove('cdp-wait');
      function chg(s, n) { var v = rows.filter(function (r) { return r[s.k]; }); if (v.length < n + 1) return null; var a = v[v.length - 1 - n][s.k], b = v[v.length - 1][s.k]; return (b / a - 1) * 100; }
      function draw() {
        var R = range === 'all' ? rows : rows.slice(-(range === '1y' ? 13 : 37));
        var W = Math.max(300, box.clientWidth - 2), H = W < 560 ? 210 : 260, padL = 54, padR = 26, padT = 12, padB = 26;
        var vals = []; R.forEach(function (r) { S.forEach(function (s) { if (r[s.k]) vals.push(r[s.k]); }); });
        var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); if (hi <= lo) hi = lo * 1.1;
        var L0 = Math.log(lo * 0.9), L1 = Math.log(hi * 1.1);
        var x = function (i) { return padL + (R.length < 2 ? 0 : i / (R.length - 1) * (W - padL - padR)); };
        var y = function (v) { return padT + (1 - (Math.log(v) - L0) / (L1 - L0)) * (H - padT - padB); };
        var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Monthly price history by grade, log scale">';
        // log gridlines at 1-2-5 steps
        var ticks = []; for (var e = Math.floor(Math.log10(lo * 0.9)); e <= Math.ceil(Math.log10(hi * 1.1)); e++) [1, 2, 5].forEach(function (m) { var v = m * Math.pow(10, e); if (v >= lo * 0.9 && v <= hi * 1.1) ticks.push(v); });
        if (ticks.length > 7) ticks = ticks.filter(function (v, i) { return i % 2 === 0; });
        ticks.forEach(function (v) { var yy = y(v).toFixed(1); svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yy + '" y2="' + yy + '" stroke="rgba(255,255,255,.07)"/><text x="' + (padL - 6) + '" y="' + (+yy + 3) + '" text-anchor="end" font-size="10" fill="#7a969e" font-family="ui-monospace,monospace">' + money(v) + '</text>'; });
        var step = Math.max(1, Math.round(R.length / (W < 560 ? 4 : 7)));
        R.forEach(function (r, i) { if (i % step === 0 || i === R.length - 1) { var mo = r[0]; svg += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#7a969e" font-family="ui-monospace,monospace">' + MON[+mo.slice(5, 7) - 1] + ' ’' + mo.slice(2, 4) + '</text>'; } });
        S.forEach(function (s) {
          var dd = '', pen = false;
          R.forEach(function (r, i) { var v = r[s.k]; if (!v) { pen = false; return; } dd += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; pen = true; });
          svg += '<path d="' + dd + '" fill="none" stroke="' + s.col + '" stroke-width="2" stroke-linejoin="round"/>';
        });
        svg += '</svg>';
        var leg = S.map(function (s) {
          var v = rows.filter(function (r) { return r[s.k]; }), last = v[v.length - 1][s.k], c1 = chg(s, 12);
          return '<span><i style="background:' + s.col + '"></i>' + s.lbl + ' <b>' + money(last) + '</b>' + (c1 == null ? '' : ' <em class="' + (c1 >= 0 ? 'up' : 'dn') + '">' + (c1 >= 0 ? '+' : '') + c1.toFixed(0) + '% 1Y</em>') + '</span>';
        }).join('');
        box.innerHTML = '<div class="h"><b>Price history by grade</b><span class="rg" role="group">' + ['1y', '3y', 'all'].map(function (k) { return '<button type="button" data-r="' + k + '" aria-pressed="' + (k === range) + '">' + (k === 'all' ? 'All' : k.toUpperCase()) + '</button>'; }).join('') + '</span></div>' +
          '<div class="leg">' + leg + '</div>' + svg +
          '<div class="src">Monthly value estimates from <a href="https://www.pricecharting.com/game/' + esc(c.path || '') + '" rel="nofollow noopener" target="_blank">PriceCharting</a>, built from their tracked sales; log scale. Their series, not our marks — the ladder above is ours. Grade 9 mixes graders (PSA, BGS, CGC…).</div>';
      }
      draw();
      box.addEventListener('click', function (e) { var b = e.target.closest('button[data-r]'); if (!b) return; range = b.getAttribute('data-r'); draw(); });
      var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 150); });
    }).catch(function () { box.hidden = true; });
  }
})();
