/* engine-block.js — the engine's card block, embeddable on any page (Sep 8 2026; stat band Sep 11 2026).
 * One <div class="cp-embed" data-card="<id>" data-code="" data-must=""> per tracked card;
 * the block renders client-side from the price-data feeds + /api/comps exactly like the
 * old /card-<id> pages did, so guide pages that already rank carry the nightly mark,
 * the price line, the hammers and the verified live listings. Multi-instance safe.
 *
 * Terminal step 1 (v3): the block is the page's stat band — signal, 30D ROC, z, σ/day, skew,
 * kurtosis, supply, ask Q1–Q3, hammer median — plus the hammer median as a dashed reference on
 * the chart and a histogram of daily returns. σ/skew/excess-kurtosis are population moments of
 * night-over-night % returns over the whole nightly series (the engine's retSkew/retKurtosis
 * are preferred when the nightly ships them non-null). Every write is guarded by the target
 * element's presence, so hosts still on the 4-cell markup render exactly as before. */
(function () {
  'use strict';
  var FEED = 'https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (n) { if (n == null || !isFinite(n)) return '—'; return '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 100 ? String(Math.round(n)) : n.toFixed(2)); };
  var num = function (n, d) { if (n == null || !isFinite(n)) return '—'; return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  var pct = function (n, d) { if (n == null || !isFinite(n)) return '—'; return (n > 0 ? '+' : '') + num(n, d) + '%'; };
  var dstr = function (d) { if (!d) return ''; var p = d.split('-'); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1] + ' ' + (+p[2]); };
  var cache = {};
  function getJSON(u) {
    if (!cache[u]) cache[u] = fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return cache[u];
  }
  var latestP = getJSON(FEED + '/prices-latest.json?t=' + Date.now());
  var histP = getJSON(FEED + '/prices-history.json?t=' + Date.now());
  var mktP = getJSON(FEED + '/market-latest.json?t=' + Date.now());
  var quiet = function (p) { return p.catch(function () { return null; }); };

  /* night-over-night % returns of the mark series */
  function returns(ys) { var r = []; for (var i = 1; i < ys.length; i++) if (ys[i - 1]) r.push((ys[i] / ys[i - 1] - 1) * 100); return r; }
  /* population moments: σ, skew, excess kurtosis (normal = 0) */
  function moments(r) {
    var n = r.length; if (n < 3) return null;
    var mu = 0; r.forEach(function (v) { mu += v; }); mu /= n;
    var m2 = 0, m3 = 0, m4 = 0;
    r.forEach(function (v) { var d = v - mu; m2 += d * d; m3 += d * d * d; m4 += d * d * d * d; });
    m2 /= n; m3 /= n; m4 /= n;
    var sd = Math.sqrt(m2); if (!(sd > 0)) return { n: n, sd: 0, skew: null, kurt: null };
    return { n: n, sd: sd, skew: m3 / (sd * sd * sd), kurt: m4 / (m2 * m2) - 3 };
  }
  function histSVG(r) {
    if (r.length < 8) return '';
    var lo = Math.min.apply(null, r), hi = Math.max.apply(null, r), span = Math.max(hi - lo, 0.5), bins = 12, cnt = [];
    for (var i = 0; i < bins; i++) cnt.push(0);
    r.forEach(function (v) { var b = Math.floor((v - lo) / span * bins); if (b >= bins) b = bins - 1; if (b < 0) b = 0; cnt[b]++; });
    var W = 320, H = 96, mx = Math.max.apply(null, cnt), bw = W / bins, zero = (0 - lo) / span * W;
    if (zero < 0) zero = 0; if (zero > W) zero = W;
    var bars = cnt.map(function (c, i) { var h = (c / mx) * (H - 24); return '<rect class="' + ((i * bw + bw / 2) < zero ? 'neg' : 'pos') + '" x="' + (i * bw + 1).toFixed(1) + '" y="' + (H - 14 - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '"/>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Histogram of ' + r.length + ' daily returns"><line class="zero" x1="' + zero.toFixed(1) + '" x2="' + zero.toFixed(1) + '" y1="2" y2="' + (H - 14) + '"/>' + bars +
      '<text class="axis" x="2" y="' + (H - 3) + '">' + num(lo, 1) + '%</text><text class="axis" x="' + zero.toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">0</text><text class="axis" x="' + (W - 2) + '" y="' + (H - 3) + '" text-anchor="end">+' + num(hi, 1) + '%</text></svg>';
  }

  function render(root) {
    var id = root.getAttribute('data-card'); if (!id) return;
    var KEY = 'ebay:' + id;
    var CODE = root.getAttribute('data-code') || '';
    var MUST = root.getAttribute('data-must') || '';
    var $ = function (k) { return root.querySelector('[data-k="' + k + '"]'); };
    var set = function (k, v) { var el = $(k); if (el) el.textContent = v; return el; };
    var cls = function (k, c) { var el = $(k); if (el) el.className = el.className.replace(/\b(up|dn)\b/g, '').replace(/\s+/g, ' ').trim() + (c ? ' ' + c : ''); };

    /* 1. latest mark + strip + signal */
    latestP.then(function (d) {
      var c = (d.cards || []).filter(function (x) { return x.key === KEY; })[0]; if (!c) return;
      var day = d.day || '';
      if (c.last != null) { set('mark', fmt(c.last)); set('mark-d', 'engine mark · ' + dstr(day)); }
      var roc = c.roc30; var el = $('roc');
      if (el && roc != null && isFinite(roc)) { el.textContent = pct(roc, 1); cls('roc', roc > 0.5 ? 'up' : roc < -0.5 ? 'dn' : ''); }
      if (c.z != null && isFinite(c.z)) { set('z', num(c.z, 2)); cls('z', Math.abs(c.z) >= 2 ? (c.z > 0 ? 'up' : 'dn') : ''); }
      set('n', c.points != null ? String(c.points) : '—');
      if (c.askQ1 != null && c.askQ3 != null) {
        if ($('askq')) set('askq', fmt(c.askQ1) + '–' + fmt(c.askQ3));
        else set('n-s', 'asks ' + fmt(c.askQ1) + '–' + fmt(c.askQ3) + ' (Q1–Q3)');
      }
      set('sup', c.supply != null ? String(c.supply) : '—');
      if (c.supplyChange30 != null) { set('sup-s', pct(c.supplyChange30, 0) + ' vs 30d'); cls('sup-s', c.supplyChange30 > 0.5 ? 'dn' : c.supplyChange30 < -0.5 ? 'up' : ''); }
      var sig = $('sig'); var s = String(c.signal || 'HOLD').toUpperCase(); var gated = !!c.gated || (c.signalRaw && c.signalRaw !== c.signal);
      if (sig) {
        sig.className = 'cp-sig ' + s.toLowerCase() + (gated ? ' gated' : '');
        sig.innerHTML = '<span>' + ($('sig-s') ? '' : 'engine · ') + esc(s) + '</span>' + (gated ? '<span style="opacity:.7">· gated, thin sample</span>' : '');
      }
      var conf = c.confidence != null ? num(c.confidence, 2) : null;
      if ($('sig-s')) set('sig-s', (conf ? 'conf ' + conf : 'no confidence yet') + (gated ? ' · raw ' + esc(String(c.signalRaw || '').toUpperCase()) + ' gated' : ''));
      var cell = $('sig-cell'); if (cell && (c.reasons || []).length) cell.title = c.reasons.join(' · ');
      var why = (c.reasons || [])[0]; if (why) set('why', why + (conf && !$('sig-s') ? ' · confidence ' + Math.round(c.confidence * 100) + '%' : ''));
      if (c.image && c.image.url) { var im = $('img'); if (im && im.tagName === 'IMG') im.src = c.image.url; var ph = $('photo'); if (ph && c.image.item) ph.href = c.image.item.replace(/customid=[^&]*/, 'customid=card-' + id); }
    }).catch(function () {});

    /* 1b. σ / skew / kurtosis + histogram (client-side from the nightly series; engine values win when shipped) */
    if ($('sd') || $('hist')) Promise.all([quiet(histP), quiet(latestP)]).then(function (a) {
      var h = a[0], d = a[1]; var e = h && h[KEY]; if (!e) return;
      var c = d && (d.cards || []).filter(function (x) { return x.key === KEY; })[0];
      var ys = (e.series || []).filter(function (p) { return p && p.p != null && isFinite(p.p); }).map(function (p) { return p.p; });
      var r = returns(ys); var m = moments(r);
      if (m) {
        var skew = c && c.retSkew != null && isFinite(c.retSkew) ? c.retSkew : m.skew;
        var kurt = c && c.retKurtosis != null && isFinite(c.retKurtosis) ? c.retKurtosis : m.kurt;
        set('sd', num(m.sd, 2) + '%'); set('sd-s', m.n + ' returns');
        if (skew != null) { set('skew', num(skew, 2)); set('skew-s', skew > 1 ? 'upside jumps' : skew < -1 ? 'downside jumps' : 'symmetric'); cls('skew', skew > 1 ? 'up' : skew < -1 ? 'dn' : ''); }
        if (kurt != null) { set('kurt', num(kurt, 2)); set('kurt-s', kurt > 3 ? 'fat tails' : kurt < 0 ? 'flat-topped' : 'near-normal'); cls('kurt', kurt > 3 ? 'dn' : ''); }
        var hb = $('hist'); var svg = histSVG(r);
        if (hb && svg) hb.innerHTML = svg;
        else if (hb) hb.innerHTML = '<div class="cp-empty">' + r.length + ' daily return' + (r.length === 1 ? '' : 's') + ' so far — the histogram needs ~10 nightly marks.</div>';
        var rd = $('hist-read');
        if (rd && svg) rd.innerHTML = '<div><b>Read</b>' + (kurt != null && kurt > 3 ? 'Fat tails: most nights do nothing, then one prints a jump. The 30D ROC is a few nights’ work.' : 'Returns cluster near zero with ordinary tails; the 30D ROC is a real drift, not one print.') + (skew != null && Math.abs(skew) > 1 ? (skew > 0 ? ' Skew is positive — the jumps are upward.' : ' Skew is negative — the jumps are downward.') : '') + '</div>' +
          '<div><b>Method</b>Population moments of night-over-night % returns on the ask-basis mark, all ' + m.n + ' returns; excess kurtosis (normal = 0). Not a call.</div>';
      } else {
        var hb2 = $('hist'); if (hb2) hb2.innerHTML = '<div class="cp-empty">' + r.length + ' daily return' + (r.length === 1 ? '' : 's') + ' so far — needs ~10 nightly marks.</div>';
      }
    });

    /* 2. history chart (+ hammer median as a dashed reference when the market feed has closes) */
    Promise.all([histP, quiet(mktP)]).then(function (a) {
      var h = a[0], m = a[1];
      var e = h[KEY]; var box = $('chart'); if (!e || !box) return;
      var b = m && (m[KEY] || (m.byKey && m.byKey[KEY]) || (m.cards && m.cards[KEY]));
      var ref = b && b.hammerMedian != null && isFinite(b.hammerMedian) && (b.hammers || []).length ? b.hammerMedian : null;
      var pts = (e.series || []).filter(function (p) { return p && p.p != null && isFinite(p.p); });
      set('chart-n', pts.length + ' nightly point' + (pts.length === 1 ? '' : 's') + (pts.length ? ' · ' + dstr(pts[0].d) + ' → ' + dstr(pts[pts.length - 1].d) : ''));
      if (pts.length < 2) { box.innerHTML = '<div class="cp-empty">' + pts.length + ' point so far — the line fills in one point per night as the engine re-marks this card.</div>'; return; }
      var W = 640, H = 260, L = 44, R = 14, T = 16, B = 28;
      var ys = pts.map(function (p) { return p.p; }); var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
      if (hi === lo) { hi = lo * 1.05; lo = lo * 0.95; } var pad = (hi - lo) * 0.12; lo -= pad; hi += pad; if (lo < 0) lo = 0;
      var x = function (i) { return L + (W - L - R) * i / (pts.length - 1); }, y = function (v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
      var sma = []; for (var i = 0; i < pts.length; i++) { var a0 = Math.max(0, i - 29); var seg = ys.slice(a0, i + 1); sma.push(seg.reduce(function (s, v) { return s + v; }, 0) / seg.length); }
      var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.p).toFixed(1); }).join(' ');
      var area = line + ' L' + x(pts.length - 1).toFixed(1) + ' ' + (H - B) + ' L' + L + ' ' + (H - B) + ' Z';
      var sl = sma.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
      var g = ''; for (var k = 0; k <= 4; k++) { var v = lo + (hi - lo) * k / 4; var yy = y(v); g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>' + '<text class="axis" x="' + (L - 6) + '" y="' + (yy + 3).toFixed(1) + '" text-anchor="end">' + fmt(v) + '</text>'; }
      var xl = '<text class="axis" x="' + L + '" y="' + (H - 8) + '">' + esc(dstr(pts[0].d)) + '</text><text class="axis" x="' + (W - R) + '" y="' + (H - 8) + '" text-anchor="end">' + esc(dstr(pts[pts.length - 1].d)) + '</text>';
      var lastP = pts[pts.length - 1]; var lx = x(pts.length - 1), ly = y(lastP.p);
      var lab = '<circle class="dot" cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="3.5"/><text class="last" x="' + (lx - 8).toFixed(1) + '" y="' + (ly - 10).toFixed(1) + '" text-anchor="end">' + fmt(lastP.p) + '</text>';
      var rl = '', rlg = '';
      if (ref != null) {
        var inRange = ref >= lo && ref <= hi; var ry = inRange ? y(ref) : ref > hi ? T : H - B;
        rl = '<line class="ref" x1="' + L + '" x2="' + (W - R) + '" y1="' + ry.toFixed(1) + '" y2="' + ry.toFixed(1) + '"/>' +
          '<text class="ref-l" x="' + (L + 4) + '" y="' + (ry - 4).toFixed(1) + '">hammer median ' + fmt(ref) + (inRange ? '' : ref > hi ? ' · above chart' : ' · below chart') + '</text>';
        rlg = '<span><i class="r"></i>hammer median (' + (b.hammers || []).length + ' close' + ((b.hammers || []).length === 1 ? '' : 's') + ')</span>';
      }
      box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Nightly engine mark, ' + pts.length + ' points">' + g + '<path class="area" d="' + area + '"/><path class="sma" d="' + sl + '"/>' + rl + '<path class="line" d="' + line + '"/>' + lab + xl + '</svg>' +
        '<div class="cp-legend"><span><i></i>engine mark (trimmed low-ask, price + shipping)</span><span><i class="g"></i>30-night average</span>' + rlg + '</div>';
    }).catch(function () {});

    /* 3. hammers / auction closes (+ the hammer-median band cell) */
    Promise.all([mktP, quiet(latestP)]).then(function (a) {
      var m = a[0], d = a[1];
      var b = m && (m[KEY] || (m.byKey && m.byKey[KEY]) || (m.cards && m.cards[KEY])); if (!b) return;
      var hs = (b.hammers || []).filter(function (v) { return v != null && isFinite(v); }); var n = hs.length;
      var c = d && (d.cards || []).filter(function (x) { return x.key === KEY; })[0];
      var last = c && c.last != null ? c.last : null;
      if ($('ham') && n && b.hammerMedian != null) {
        set('ham', fmt(b.hammerMedian));
        set('ham-s', n + ' close' + (n === 1 ? '' : 's') + (last ? ' · ' + pct((b.hammerMedian / last - 1) * 100, 0) + ' vs ask' : ''));
        if (last) cls('ham-s', b.hammerMedian > last ? 'up' : b.hammerMedian < last ? 'dn' : '');
      }
      var box = $('hammers'); if (!box) return;
      if (!n && !b.watching) return;
      if (root.classList.contains('cp-t1')) {
        box.innerHTML = '<div class="cp-closes">' + (n ? hs.slice().sort(function (p, q) { return q - p; }).map(function (v) { return '<span class="c">' + fmt(v) + '</span>'; }).join('') : '<span class="cp-empty">No watched close yet — asks only.</span>') +
          '<span class="m">' + (n ? n + ' close' + (n === 1 ? '' : 's') + ' · median ' + fmt(b.hammerMedian) + ' · ' : '') + (b.watching || 0) + ' live auction' + (b.watching === 1 ? '' : 's') + ' watched nightly</span></div>';
      } else {
        box.innerHTML = '<div class="cp-hammers">' +
          '<div class="cp-cell"><div class="l">Hammers · 30d</div><div class="v">' + n + '</div><div class="s">auction closes captured</div></div>' +
          '<div class="cp-cell"><div class="l">Median hammer</div><div class="v">' + (b.hammerMedian != null ? fmt(b.hammerMedian) : '—') + '</div><div class="s">what buyers actually paid</div></div>' +
          '<div class="cp-cell"><div class="l">Watching</div><div class="v">' + (b.watching || 0) + '</div><div class="s">live auctions tracked nightly</div></div></div>';
      }
    }).catch(function () {});

    /* 4. verified live listings — this exact card (engine filter, server-side) */
    var list = $('list'); if (!list) return;
    var cid = 'card-' + id;
    getJSON('/api/comps?card=' + encodeURIComponent(id) + '&customid=' + encodeURIComponent(cid) + '&sort=price&limit=100').then(function (j) {
      var fixed = j.verified, auct = j.auctions || [];
      if (!fixed) {
        var must = MUST.toLowerCase();
        fixed = (j.listings || []).filter(function (l) { var t = (l.title || '').toLowerCase(); return l.price > 0 && t.indexOf(must) !== -1 && (!CODE || t.replace(/[\s#‐-―-]/g, '').toUpperCase().indexOf(CODE.replace('-', '')) !== -1); }).map(function (l) { l.total = l.price + (l.shipping || 0); return l; }).sort(function (a, b) { return a.total - b.total; });
        set('list-sub', 'Title-matched live listings (engine filter unavailable right now).');
      }
      var top = fixed.slice(0, 8); var SHOW = 4;
      var html = top.map(function (l) {
        return '<a class="cp-item" href="' + esc(l.url) + '" target="_blank" rel="noopener sponsored" data-kind="fixed">' +
          '<span class="ph">' + (l.image ? '<img src="' + esc(l.image) + '" alt="" loading="lazy">' : '') + '</span>' +
          '<span><span class="t">' + esc(l.title) + '</span><span class="m">' + esc(l.condition || '') + (l.seller && l.seller.feedbackPct ? ' · seller ' + esc(l.seller.feedbackPct) + '%' : '') + '</span></span>' +
          '<span class="p"><b>' + fmt(l.price) + '</b><span>' + (l.shipping > 0 ? '+' + fmt(l.shipping) + ' ship' : l.shipping === 0 ? 'free ship' : 'ship n/a') + '</span><span class="ebay">Buy on eBay →</span></span></a>';
      }).join('');
      auct.slice(0, 4).forEach(function (l) {
        var ends = l.endDate ? Math.max(0, (new Date(l.endDate).getTime() - Date.now()) / 36e5) : null;
        html += '<a class="cp-item auction" href="' + esc(l.url) + '" target="_blank" rel="noopener sponsored" data-kind="auction">' +
          '<span class="ph">' + (l.image ? '<img src="' + esc(l.image) + '" alt="" loading="lazy">' : '') + '</span>' +
          '<span><span class="t">' + esc(l.title) + '</span><span class="m">auction · ' + (l.bidCount || 0) + ' bid' + (l.bidCount === 1 ? '' : 's') + (ends != null ? ' · ends in ' + (ends >= 48 ? Math.round(ends / 24) + 'd' : Math.round(ends) + 'h') : '') + '</span></span>' +
          '<span class="p"><b>' + fmt(l.bid) + '</b><span>current bid</span><span class="ebay">Bid on eBay →</span></span></a>';
      });
      if (!html) html = '<div class="cp-empty">No live listing passes the exact-card filter right now (' + ((j.rejected && j.rejected.count) || j.count || 0) + ' listings looked at, none was this card). Check back tonight.</div>';
      list.innerHTML = html;
      /* phone-first: 4 rows visible, the rest behind one tap */
      var rows = Array.prototype.slice.call(list.querySelectorAll('a.cp-item'));
      if (rows.length > SHOW) {
        rows.slice(SHOW).forEach(function (r) { r.hidden = true; });
        var more = document.createElement('button'); more.type = 'button'; more.className = 'cp-more';
        more.textContent = 'Show all ' + rows.length + ' listings';
        more.addEventListener('click', function () { rows.forEach(function (r) { r.hidden = false; }); more.remove(); });
        list.appendChild(more);
      }
      Array.prototype.forEach.call(list.querySelectorAll('a.cp-item'), function (a) {
        a.addEventListener('click', function () { if (window.gtag) gtag('event', 'click', { link_url: 'ebay', card: id, kind: a.getAttribute('data-kind'), page: location.pathname }); });
      });
      var rej = j.rejected; var f = $('list-foot');
      if (f) {
        var NICE = { not: 'auctions / other formats', blocklist: 'graded, parallels, lots, reprints', 'blocklist-2': 'signed base cards, variations', duplicate: 'repeat seller listings', missing: 'wrong code or year', foreign: 'other card codes', no: 'no usable price' };
        var parts = []; if (rej) { for (var k in rej.reasons) parts.push(rej.reasons[k] + ' ' + (NICE[k] || k.replace(/-/g, ' '))); }
        f.textContent = (fixed.length + ' verified fixed-price' + (auct.length ? ' · ' + auct.length + ' live auction' + (auct.length === 1 ? '' : 's') : '')) + (rej ? ' · ' + rej.count + ' excluded (' + parts.slice(0, 4).join(', ') + ')' : '') + ' · asks, not solds · refreshes ~15 min';
      }
    }).catch(function () { list.innerHTML = '<div class="cp-empty">Live listings are unavailable right now.</div>'; });
  }

  function boot() {
    /* ≥ 900px: charts open at rest; narrower: the first card's chart open, the rest folded */
    var wide = window.matchMedia && window.matchMedia('(min-width: 900px)').matches;
    if (wide) Array.prototype.forEach.call(document.querySelectorAll('.cp-embed details.cp-fold[data-fold="chart"]'), function (d) { d.open = true; });
    Array.prototype.forEach.call(document.querySelectorAll('.cp-embed[data-card]'), render);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
