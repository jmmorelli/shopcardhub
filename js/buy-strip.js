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

  // Phone dock (Sep 26 2026; reworked Sep 30 2026, Night Crew). While the strip's own slot is still
  // below the viewport (long hero on a phone), a compact copy of it rides the bottom edge
  // (.bs-dock, css/site-fixes.css §8). The strip itself never leaves the flow: until Sep 30 it
  // was lifted out and dropped back in, and every drop-back counted as a 0.30-0.38 layout shift
  // (Bug Hunter, Sep 30). The copy is fixed-position and only slides (transform), so nothing on
  // the page moves. While the copy is up, the strip's own slot is kept but not painted (visibility
  // only, as before), and the copy goes once the whole strip is on screen. Its links are the
  // strip's own (same href, same onclick). Exactly one of the two is visible at a time, and
  // visibility:hidden takes the other out of the tab order and the accessibility tree. Desktop: no-op.
  var dockLive = null;
  try {
    if (window.matchMedia && window.matchMedia('(max-width:760px)').matches && 'IntersectionObserver' in window) {
      var s0 = strips[0], dock = s0.cloneNode(true);
      dock.classList.add('bs-dock', 'bs-dock-off');
      dock.removeAttribute('data-bs-q'); dock.removeAttribute('id');
      Array.prototype.forEach.call(dock.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
      dockLive = dock.querySelector('[data-bs-live]');
      s0.parentNode.insertBefore(dock, s0.nextSibling);
      var io = new IntersectionObserver(function (en) {
        var e = en[en.length - 1], on = e.boundingClientRect.top > 0 && e.intersectionRatio < 0.98;
        dock.classList.toggle('bs-dock-off', !on);
        s0.classList.toggle('bs-slot', on);
      }, { threshold: [0, 0.25, 0.5, 0.75, 0.98, 1] });
      io.observe(s0);
    }
  } catch (e) {}

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
    // eBay category to scope the search to. Without it /api/comps searches its default
    // category (212, sports trading cards), where Pokemon SEALED product is barely listed:
    // the same Prismatic Evolutions ETB query returned 2 listings from $197.99 on the
    // default and 43 from $135 under 183456 (sealed/booster boxes). Every Pokemon shelf on
    // the site was printing an ask 13-47% above the real cheapest. Measured 2026-09-22.
    var cat = s.getAttribute('data-bs-cat') || '';
    if (!el || !q) return;
    fetch('/api/comps?q=' + encodeURIComponent(q) + '&limit=50&sort=price' + (cat ? '&category_ids=' + encodeURIComponent(cat) : '') + (cid ? '&customid=' + encodeURIComponent(cid) : ''))
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
        if (!ps.length) { el.textContent = ''; if (dockLive && s === strips[0]) dockLive.textContent = ''; return; }
        var lo = ps[0];
        var txt = 'ask from $' + (lo >= 1000 ? Math.round(lo).toLocaleString() : lo.toFixed(2));
        if (msrp) txt += ' · ' + (lo / msrp).toFixed(1) + '× MSRP';
        el.innerHTML = '<b>' + txt + '</b> <span class="bs-n">' + ps.length + ' live</span>';
        if (dockLive && s === strips[0]) dockLive.innerHTML = el.innerHTML;
      })
      .catch(function () { el.textContent = ''; });
  });
})();
