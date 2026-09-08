/* engine-block.js — the engine's card block, embeddable on any page (Sep 8 2026).
 * One <div class="cp-embed" data-card="<id>" data-code="" data-must=""> per tracked card;
 * the block renders client-side from the price-data feeds + /api/comps exactly like the
 * old /card-<id> pages did, so guide pages that already rank carry the nightly mark,
 * the price line, the hammers and the verified live listings. Multi-instance safe. */
(function () {
  'use strict';
  var FEED = 'https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (n) { if (n == null || !isFinite(n)) return '—'; return '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 100 ? String(Math.round(n)) : n.toFixed(2)); };
  var dstr = function (d) { if (!d) return ''; var p = d.split('-'); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1] + ' ' + (+p[2]); };
  var cache = {};
  function getJSON(u) {
    if (!cache[u]) cache[u] = fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return cache[u];
  }
  var latestP = getJSON(FEED + '/prices-latest.json?t=' + Date.now());
  var histP = getJSON(FEED + '/prices-history.json?t=' + Date.now());
  var mktP = getJSON(FEED + '/market-latest.json?t=' + Date.now());

  function render(root) {
    var id = root.getAttribute('data-card'); if (!id) return;
    var KEY = 'ebay:' + id;
    var CODE = root.getAttribute('data-code') || '';
    var MUST = root.getAttribute('data-must') || '';
    var $ = function (k) { return root.querySelector('[data-k="' + k + '"]'); };
    var set = function (k, v) { var el = $(k); if (el) el.textContent = v; return el; };

    /* 1. latest mark + strip + signal */
    latestP.then(function (d) {
      var c = (d.cards || []).filter(function (x) { return x.key === KEY; })[0]; if (!c) return;
      var day = d.day || '';
      if (c.last != null) { set('mark', fmt(c.last)); set('mark-d', 'engine mark · ' + dstr(day)); }
      var roc = c.roc30; var el = $('roc');
      if (el && roc != null && isFinite(roc)) { el.textContent = (roc > 0 ? '+' : '') + roc.toFixed(1) + '%'; el.className = 'v ' + (roc > 0.5 ? 'up' : roc < -0.5 ? 'dn' : ''); }
      set('n', c.points != null ? String(c.points) : '—');
      if (c.askQ1 != null && c.askQ3 != null) set('n-s', 'asks ' + fmt(c.askQ1) + '–' + fmt(c.askQ3) + ' (Q1–Q3)');
      set('sup', c.supply != null ? String(c.supply) : '—');
      if (c.supplyChange30 != null) set('sup-s', (c.supplyChange30 > 0 ? '+' : '') + c.supplyChange30.toFixed(0) + '% vs 30d');
      var sig = $('sig'); var s = String(c.signal || 'HOLD').toUpperCase(); var gated = !!c.gated || (c.signalRaw && c.signalRaw !== c.signal);
      if (sig) { sig.className = 'cp-sig ' + s.toLowerCase(); sig.innerHTML = '<span>engine · ' + esc(s) + '</span>' + (gated ? '<span style="opacity:.7">· gated, thin sample</span>' : ''); }
      var why = (c.reasons || [])[0]; if (why) set('why', why + (c.confidence != null ? ' · confidence ' + Math.round(c.confidence * 100) + '%' : ''));
      if (c.image && c.image.url) { var im = $('img'); if (im && im.tagName === 'IMG') im.src = c.image.url; var ph = $('photo'); if (ph && c.image.item) ph.href = c.image.item.replace(/customid=[^&]*/, 'customid=card-' + id); }
    }).catch(function () {});

    /* 2. history chart */
    histP.then(function (h) {
      var e = h[KEY]; var box = $('chart'); if (!e || !box) return;
      var pts = (e.series || []).filter(function (p) { return p && p.p != null && isFinite(p.p); });
      set('chart-n', pts.length + ' nightly point' + (pts.length === 1 ? '' : 's') + (pts.length ? ' · ' + dstr(pts[0].d) + ' → ' + dstr(pts[pts.length - 1].d) : ''));
      if (pts.length < 2) { box.innerHTML = '<div class="cp-empty">' + pts.length + ' point so far — the line fills in one point per night as the engine re-marks this card.</div>'; return; }
      var W = 640, H = 260, L = 44, R = 14, T = 16, B = 28;
      var ys = pts.map(function (p) { return p.p; }); var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
      if (hi === lo) { hi = lo * 1.05; lo = lo * 0.95; } var pad = (hi - lo) * 0.12; lo -= pad; hi += pad; if (lo < 0) lo = 0;
      var x = function (i) { return L + (W - L - R) * i / (pts.length - 1); }, y = function (v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
      var sma = []; for (var i = 0; i < pts.length; i++) { var a = Math.max(0, i - 29); var seg = ys.slice(a, i + 1); sma.push(seg.reduce(function (s, v) { return s + v; }, 0) / seg.length); }
      var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.p).toFixed(1); }).join(' ');
      var area = line + ' L' + x(pts.length - 1).toFixed(1) + ' ' + (H - B) + ' L' + L + ' ' + (H - B) + ' Z';
      var sl = sma.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
      var g = ''; for (var k = 0; k <= 4; k++) { var v = lo + (hi - lo) * k / 4; var yy = y(v); g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>' + '<text class="axis" x="' + (L - 6) + '" y="' + (yy + 3).toFixed(1) + '" text-anchor="end">' + fmt(v) + '</text>'; }
      var xl = '<text class="axis" x="' + L + '" y="' + (H - 8) + '">' + esc(dstr(pts[0].d)) + '</text><text class="axis" x="' + (W - R) + '" y="' + (H - 8) + '" text-anchor="end">' + esc(dstr(pts[pts.length - 1].d)) + '</text>';
      var lastP = pts[pts.length - 1]; var lx = x(pts.length - 1), ly = y(lastP.p);
      var lab = '<circle class="dot" cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="3.5"/><text class="last" x="' + (lx - 8).toFixed(1) + '" y="' + (ly - 10).toFixed(1) + '" text-anchor="end">' + fmt(lastP.p) + '</text>';
      box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Nightly engine mark, ' + pts.length + ' points">' + g + '<path class="area" d="' + area + '"/><path class="sma" d="' + sl + '"/><path class="line" d="' + line + '"/>' + lab + xl + '</svg>' +
        '<div class="cp-legend"><span><i></i>engine mark (trimmed low-ask, price + shipping)</span><span><i class="g"></i>30-night average</span></div>';
    }).catch(function () {});

    /* 3. hammers / auction closes */
    mktP.then(function (m) {
      var b = m && (m[KEY] || (m.byKey && m.byKey[KEY]) || (m.cards && m.cards[KEY])); if (!b) return;
      var box = $('hammers'); if (!box) return;
      var n = (b.hammers || []).length;
      if (!n && !b.watching) return;
      box.innerHTML = '<div class="cp-hammers">' +
        '<div class="cp-cell"><div class="l">Hammers · 30d</div><div class="v">' + n + '</div><div class="s">auction closes captured</div></div>' +
        '<div class="cp-cell"><div class="l">Median hammer</div><div class="v">' + (b.hammerMedian != null ? fmt(b.hammerMedian) : '—') + '</div><div class="s">what buyers actually paid</div></div>' +
        '<div class="cp-cell"><div class="l">Watching</div><div class="v">' + (b.watching || 0) + '</div><div class="s">live auctions tracked nightly</div></div></div>';
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
      var top = fixed.slice(0, 8);
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

  function boot() { Array.prototype.forEach.call(document.querySelectorAll('.cp-embed[data-card]'), render); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
