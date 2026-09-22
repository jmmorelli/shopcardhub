/* sealed-row.js — fills the SEALED row on a set-index page from the nightly feed.
 * (Sep 13 2026.) Reads prices-latest.json + prices-history.json from the
 * price-data branch and /data/indices.json (same-origin). Read-only; never
 * writes storage; leaves the pre-rendered empty state alone if the fetch fails.
 * Numbers shown: the engine's nightly ask mark (trimmed low median of verified
 * fixed-price asks — asks, not solds), the verified-ask count (thin under 8),
 * the box's 30-day move, and the index's own 30-day move beside it. */
(function () {
  var rows = document.querySelectorAll('.sealed[data-box-feed]');
  if (!rows.length) return;
  var FEED = '/feed';
  var get = function (u) { return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };
  var fmt = function (n) { return '$' + (n >= 1000 ? Math.round(n).toLocaleString() : n.toFixed(n >= 100 ? 0 : 2)); };
  var pct = function (a, b) { return (a == null || b == null || !b) ? null : ((a - b) / b) * 100; };
  var pctText = function (p) { return p == null ? '—' : (p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%'; };
  var cls = function (p) { return p == null ? '' : (p >= 0 ? 'up' : 'dn'); };
  var daysAgo = function (d) { return (Date.now() - new Date(d + 'T00:00:00Z').getTime()) / 864e5; };
  // the value ~30 days before the last point, or the earliest point if the series is younger
  var back30 = function (series, dateKey, valKey) {
    if (!series || !series.length) return null;
    var last = series[series.length - 1];
    var target = new Date(last[dateKey] + 'T00:00:00Z').getTime() - 30 * 864e5;
    var pick = series[0];
    for (var i = 0; i < series.length; i++) { if (new Date(series[i][dateKey] + 'T00:00:00Z').getTime() <= target) pick = series[i]; else break; }
    return pick === last ? null : pick[valKey];
  };
  Promise.all([get(FEED + '/prices-latest.json?t=' + Math.floor(Date.now() / 600000)), get(FEED + '/prices-history.json?t=' + Math.floor(Date.now() / 600000)).catch(function () { return {}; }), get('/data/indices.json?t=' + Date.now()).catch(function () { return {}; })])
    .then(function (r) {
      var latest = r[0] || {}, hist = r[1] || {}, idx = r[2] || {};
      var byKey = {}; (latest.cards || []).forEach(function (c) { byKey[c.key] = c; });
      rows.forEach(function (row) {
        var key = row.getAttribute('data-box-feed'), ticker = row.getAttribute('data-box-index');
        var c = byKey[key], series = (hist[key] && hist[key].series) || [];
        var priceEl = row.querySelector('.sealed-price'), supEl = row.querySelector('.sealed-sup'), noteEl = row.querySelector('.sealed-note');
        var b30 = row.querySelector('.sealed-box30'), i30 = row.querySelector('.sealed-idx30');
        // index 30D from indices.json history (weekly marks; falls back to inception)
        var ih = (idx[ticker] && idx[ticker].history) || [];
        if (ih.length) { var il = ih[ih.length - 1].level, i0 = back30(ih, 'date', 'level'); if (i0 == null && ih.length > 1) i0 = ih[0].level; var ip = pct(il, i0); i30.textContent = pctText(ip); i30.className = 'sealed-idx30 ' + cls(ip); }
        if (!c || c.last == null) {
          var n = (c && c.supply != null) ? c.supply : null;
          priceEl.textContent = n != null && n < 4 ? 'no mark · ' + n + ' verified asks (need 4)' : 'first mark tonight';
          return;
        }
        var last = series.length ? series[series.length - 1] : null;
        var n = last && last.n != null ? last.n : c.supply;
        priceEl.textContent = fmt(c.last);
        supEl.textContent = (n != null ? n + ' verified asks' : '') + (last ? ' · ' + last.d.slice(5).replace('-', '/') : '');
        if (n != null && n < 8) { supEl.textContent += ' · thin'; supEl.className = 'sealed-sup thin'; }
        var p0 = back30(series, 'd', 'p'); var bp = pct(c.last, p0);
        b30.textContent = series.length < 2 ? 'day 1' : pctText(bp); b30.className = 'sealed-box30 ' + cls(bp);
        if (last && daysAgo(last.d) > 4) noteEl.textContent = '· stale mark (' + Math.round(daysAgo(last.d)) + 'd)';
      });
    }).catch(function () { /* feed unreachable — the row already says "first mark tonight" */ });
})();
