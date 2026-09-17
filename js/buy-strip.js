/* buy-strip.js — fills the live-ask figure on the above-the-fold BUYSTRIP.
 * (Sep 17 2026.) One /api/comps call per page, cached at the CDN. Shows the
 * lowest SINGLE-UNIT Buy It Now ask — cases, multi-box lots and anything more
 * than 8x a known MSRP are dropped, so the number is comparable to the product
 * beside it. Asks, not solds: nothing here is a sold comp or a market price.
 * Read-only; never writes storage. If the fetch fails the line stays empty and
 * the strip still carries its eBay links. */
(function () {
  var strips = document.querySelectorAll('.bstrip[data-bs-q]');
  if (!strips.length) return;

  // A listing that is a case / lot / multi-box is not this product's unit ask.
  var LOT = /\bcase\b|\blot\b|\bbundle of\b|\bpallet\b|\bbreak\b|\brandom\b/;
  var XN = /(^|[^a-z0-9])(x\s?\d{1,2}|\d{1,2}\s?x)([^a-z0-9]|$)/;
  var NBOX = /\b\d{1,2}\s?(box|boxes|etb|etbs|pack lot)\b/;

  Array.prototype.forEach.call(strips, function (s) {
    var el = s.querySelector('[data-bs-live]');
    var q = s.getAttribute('data-bs-q');
    var cid = s.getAttribute('data-bs-cid') || '';
    var msrp = parseFloat(s.getAttribute('data-bs-msrp')) || 0;
    var req = (s.getAttribute('data-bs-req') || '').toLowerCase().split('|').filter(Boolean);
    var deny = (s.getAttribute('data-bs-deny') || '').toLowerCase().split('|').filter(Boolean);
    if (!el || !q) return;
    fetch('/api/comps?q=' + encodeURIComponent(q) + '&limit=50&sort=price' + (cid ? '&customid=' + encodeURIComponent(cid) : ''))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        var keep = (j.listings || []).filter(function (l) {
          var t = (l.title || '').toLowerCase();
          if (typeof l.price !== 'number' || !(l.price > 0)) return false;
          if (req.length && !req.every(function (w) { return t.indexOf(w) !== -1; })) return false;
          if (deny.length && deny.some(function (w) { return t.indexOf(w) !== -1; })) return false;
          if (LOT.test(t) || XN.test(t) || NBOX.test(t)) return false;
          if (msrp && l.price > msrp * 8) return false;
          return true;
        });
        var ps = keep.map(function (l) { return l.price; }).sort(function (a, b) { return a - b; });
        // Low-outlier guard: on a sealed-product query the cheap tail is usually an
        // accessory sold out of the box (a divider, a sleeve, a single pack). With
        // enough listings to have a median, drop anything under a fifth of it.
        if (ps.length >= 3) {
          var mid = ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2;
          ps = ps.filter(function (p) { return p >= mid / 5; });
        }
        if (!ps.length) { el.textContent = ''; return; }
        var lo = ps[0];
        var txt = 'ask from $' + (lo >= 1000 ? Math.round(lo).toLocaleString() : lo.toFixed(2));
        if (msrp) txt += ' · ' + (lo / msrp).toFixed(1) + '× MSRP';
        el.innerHTML = '<b>' + txt + '</b> <span class="bs-n">' + ps.length + ' live</span>';
      })
      .catch(function () { el.textContent = ''; });
  });
})();
