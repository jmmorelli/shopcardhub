/* deal-row.js — "Listed under our sold price" block on pages the Deal Hunter owns (Goal League S1, Oct 29 2026).
 *
 * Reads the existing /api/deals feed (tools/price-engine/deals.mjs → data/feed/deals-latest.json, R42) and shows the
 * /deals row for the cards a page is about. Nothing here is computed: price, shipping, mark, mark basis, mark date and
 * discount are the screener's own fields. The mark is our dated SOLD comp for that exact card and grade; the listing is
 * a live eBay ask. Never blended.
 *
 *   <div class="dlr" data-deal-cards="evs21-215" data-deal-tk="" data-deal-cid="moonbreon-worth-deal" data-deal-max="3" hidden></div>
 *   <script src="/js/deal-row.js?v=1" defer></script>
 *
 * data-deal-cards: card ids (comma list) · data-deal-tk: whole tickers (comma list) · data-deal-cid: the EPN customid for
 * this page (<slug>-deal; the feed's customid=deals is swapped for it, nothing else in the link changes).
 * Stays hidden (no placeholder) when: the feed doesn't answer, the feed is older than 48 h (the screen runs 2x a day),
 * or no live row matches. Click event: the same `click {kind:'deal'}` /deals sends, plus item = the customid.
 */
(function () {
  var boxes = document.querySelectorAll('.dlr[data-deal-cid]');
  if (!boxes.length || !window.fetch) return;
  var MAX_FEED_AGE_H = 48;

  var css = '' +
    '.dlr { max-width:1060px; margin:22px auto 0; padding:0 24px; }' +
    '.dlr .dlr-k { font-family:var(--fm,monospace); font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--green,#00e07a); margin:0 0 4px; }' +
    '.dlr .dlr-sub { font-size:13px; color:var(--text-dim,#5a7880); line-height:1.55; margin:0 0 10px; max-width:720px; }' +
    '.dlr .dlr-list { display:flex; flex-direction:column; gap:6px; }' +
    '.dlr .dl-row { display:grid; grid-template-columns:44px minmax(0,1fr) 118px 118px 150px; gap:12px; align-items:center; background:var(--bg2,#0c1017); border:1px solid var(--border2,rgba(255,255,255,0.12)); border-left:3px solid var(--green,#00e07a); padding:9px 12px 9px 10px; color:var(--text,#c8d8dc); }' +
    '.dlr .dl-row .ph { width:44px; height:60px; background:var(--bg3,#121821); overflow:hidden; display:block; } .dlr .dl-row .ph img { width:100%; height:100%; object-fit:cover; display:block; color:transparent; font-size:0; }' +
    '.dlr .dl-row .nm { min-width:0; }' +
    '.dlr .dl-row .nm .c { display:block; font-family:var(--fd,sans-serif); font-size:17px; font-weight:800; text-transform:uppercase; color:var(--text-head,#e4f0f4); line-height:1.05; }' +
    '.dlr .dl-row .nm .sl { display:block; font-family:var(--fm,monospace); font-size:11px; color:var(--text-dim,#5a7880); margin-top:4px; line-height:1.45; }' +
    '.dlr .dl-g { display:inline-block; font-family:var(--fm,monospace); font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:2px 6px; border:1px solid var(--border2,rgba(255,255,255,0.12)); color:var(--text,#c8d8dc); margin-right:6px; vertical-align:middle; }' +
    '.dlr .dl-g.psa10 { color:var(--gold,#f5c800); border-color:rgba(245,200,0,0.5); } .dlr .dl-g.psa9 { color:var(--accent,#00ccf5); border-color:rgba(0,204,245,0.5); }' +
    '.dlr .dl-num { text-align:right; font-variant-numeric:tabular-nums; } .dlr .dl-num b { font-family:var(--fd,sans-serif); font-size:21px; font-weight:900; color:var(--text-head,#e4f0f4); display:block; line-height:1; } .dlr .dl-num span { font-family:var(--fm,monospace); font-size:11px; color:var(--text-dim,#5a7880); display:block; margin-top:4px; }' +
    '.dlr .dl-vs { text-align:right; font-variant-numeric:tabular-nums; } .dlr .dl-vs b { display:inline-block; font-family:var(--fm,monospace); font-size:13px; font-weight:700; padding:5px 8px; border:1px solid rgba(0,224,122,0.5); color:var(--green,#00e07a); background:var(--green-dim,rgba(0,224,122,0.08)); } .dlr .dl-vs span { display:block; font-family:var(--fm,monospace); font-size:11px; color:var(--text-dim,#5a7880); margin-top:5px; }' +
    '.dlr .dl-buy { font-family:var(--fm,monospace); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; background:var(--green,#00e07a); color:#000 !important; padding:12px 10px; text-align:center; display:block; min-height:44px; line-height:20px; white-space:nowrap; transition:background .15s; }' +
    '.dlr .dl-buy:hover { background:#fff; text-decoration:none; } .dlr .dl-buy:focus-visible { outline:2px solid var(--gold,#f5c800); outline-offset:2px; }' +
    '.dlr .dlr-fine { font-family:var(--fm,monospace); font-size:11px; color:var(--text-dim,#5a7880); line-height:1.6; margin:8px 0 0; }' +
    '.dlr .dlr-fine a { color:var(--accent,#00ccf5); }' +
    '@media (max-width:760px) { .dlr { padding:0 16px; } .dlr .dl-row { grid-template-columns:44px minmax(0,1fr) auto; grid-template-areas:"ph nm num" "ph vs vs" "buy buy buy"; row-gap:8px; } .dlr .dl-row .ph { grid-area:ph; } .dlr .dl-row .nm { grid-area:nm; } .dlr .dl-row .dl-num { grid-area:num; } .dlr .dl-row .dl-vs { grid-area:vs; text-align:left; } .dlr .dl-row .dl-buy { grid-area:buy; } }';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var GL = { raw: 'Raw', psa9: 'PSA 9', psa10: 'PSA 10', sealed: 'Sealed' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var fmt = function (n) { if (n == null || !isFinite(n)) return ''; return '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 100 ? String(Math.round(n)) : n.toFixed(2)); };
  var pct = function (x) { return Math.round(x * 100) + '%'; };
  var day = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!m) return ''; return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2] - 1] + ' ' + (+m[3]); };
  var list = function (s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); };
  // The feed's link with only customid changed. Rows without the EPN tag (campid + mkevt=1) are skipped, never shown untagged.
  function tagged(url, cid) {
    if (!url || url.indexOf('campid=') < 0 || url.indexOf('mkevt=1') < 0 || url.indexOf('customid=') < 0) return null;
    return url.replace(/([?&])customid=[^&]*/, '$1customid=' + encodeURIComponent(cid));
  }
  function band(rules) {
    var u = rules && rules.under;
    if (!u || !isFinite(u.raw) || !isFinite(u.psa10)) return '';
    return 'at least ' + Math.round((1 - u.raw) * 100) + '% under our mark on raw cards and ' + Math.round((1 - u.psa10) * 100) + '% under on PSA slabs';
  }

  fetch('/api/deals', { cache: 'default' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    if (!d || !d.generated || (Date.now() - new Date(d.generated).getTime()) > MAX_FEED_AGE_H * 3600e3) return;
    var now = Date.now();
    var live = (d.rows || []).filter(function (r) { return r && isFinite(r.total) && isFinite(r.mark) && r.markAsOf && r.total < r.mark && (!r.ends || new Date(r.ends).getTime() > now); });
    Array.prototype.forEach.call(boxes, function (box) {
      var cards = list(box.getAttribute('data-deal-cards')), tks = list(box.getAttribute('data-deal-tk')).map(function (t) { return t.toUpperCase(); });
      var cid = box.getAttribute('data-deal-cid'), max = parseInt(box.getAttribute('data-deal-max'), 10) || 3;
      var rows = live.filter(function (r) { return cards.indexOf(r.cardId) >= 0 || tks.indexOf(r.tk) >= 0; })
        .map(function (r) { var u = tagged(r.url, cid); return u ? { r: r, u: u } : null; }).filter(Boolean)
        .sort(function (a, b) { return a.r.disc - b.r.disc; }).slice(0, max);
      if (!rows.length) return;
      var b = band(d.rules);
      var screened = new Date(d.generated).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      box.innerHTML = '<div class="dlr-k">Listed under our sold price right now</div>' +
        '<p class="dlr-sub">Buy It Now listings on eBay for the card' + (cards.length + tks.length > 1 ? 's' : '') + ' on this page, priced ' + (b || 'under our mark') + ', counting shipping. The mark is our own median of recent sales for that exact card and grade, read on the date shown in each row, so it can differ from the dated figures further down. A low price is not a call. Check the photos.</p>' +
        '<div class="dlr-list">' + rows.map(function (x) {
          var r = x.r, href = r.cardHref || '';
          return '<div class="dl-row">' +
            (href ? '<a class="ph" href="' + esc(href) + '">' : '<span class="ph">') + (r.image ? '<img src="' + esc(r.image) + '" alt="' + esc(r.card + (r.num ? ' #' + r.num : '')) + '" loading="lazy" width="44" height="60">' : '') + (href ? '</a>' : '</span>') +
            '<div class="nm"><span class="c">' + esc(r.card) + (r.num ? ' #' + esc(r.num) : '') + '</span>' +
              '<span class="sl"><span class="dl-g ' + esc(r.grade) + '">' + esc(GL[r.grade] || r.grade) + '</span>our mark ' + fmt(r.mark) + ' · ' + esc(r.markBasis || '') + ' · ' + esc(day(r.markAsOf)) + '</span></div>' +
            '<div class="dl-num"><b>' + fmt(r.total) + '</b><span>' + fmt(r.price) + (r.shipUnknown ? ' + ship' : r.ship === 0 ? ' · free ship' : ' + ' + fmt(r.ship) + ' ship') + '</span></div>' +
            '<div class="dl-vs"><b>' + pct(r.disc) + ' vs mark</b><span>' + fmt(r.mark - r.total) + ' under</span></div>' +
            '<a class="dl-buy" href="' + esc(x.u) + '" target="_blank" rel="nofollow sponsored noopener" data-card="' + esc(r.cardId) + '" data-grade="' + esc(r.grade) + '">Buy on eBay →</a>' +
          '</div>';
        }).join('') + '</div>' +
        '<p class="dlr-fine">Screened ' + esc(screened) + '. The screen runs twice a day. <a href="/deals">Every listing under our mark →</a> ShopCardHub earns a commission on eBay purchases made through these links.</p>';
      box.hidden = false;
      Array.prototype.forEach.call(box.querySelectorAll('a.dl-buy'), function (a) {
        a.addEventListener('click', function () { if (window.gtag) gtag('event', 'click', { link_url: 'ebay', item: cid, card: a.getAttribute('data-card'), grade: a.getAttribute('data-grade'), kind: 'deal', page: location.pathname }); });
      });
    });
  }).catch(function () { /* feed didn't answer: the block stays hidden, never a stale number */ });
})();
