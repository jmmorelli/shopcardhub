/* release-link.js — Ledger #54 (Oct 5 2026). Shows a buy strip's "New <date>" release link only
 * (1) between data-rel-from and data-rel-until (UTC dates, inclusive) and (2) while production
 * /api/comps holds at least 3 clean single-unit listings of the exact product (data-rel-req: every
 * |-separated phrase must appear in the title; data-rel-deny: none may). The link ships hidden and
 * stays hidden on any failure. A LINK ONLY: no figure is rendered (R20). Read-only; no storage. */
(function () {
  var links = document.querySelectorAll('a.bs-rel[data-rel-q]');
  if (!links.length) return;
  var today = new Date().toISOString().slice(0, 10);
  var LOT = /\bcase\b|\blot\b|\bbundle of\b|\bpallet\b|\bbreak\b|\brandom\b|\bset of\b/;
  var XN = /(^|[^a-z0-9])(x\s?\d{1,2}|\d{1,2}\s?x)([^a-z0-9]|$)/;
  var NBOX = /\b([2-9]|1[0-9])\s?(box|boxes)\b/;
  var seen = {};
  Array.prototype.forEach.call(links, function (a) {
    var from = a.getAttribute('data-rel-from') || '', until = a.getAttribute('data-rel-until') || '';
    if (!from || !until || today < from || today > until) return;
    var q = a.getAttribute('data-rel-q'), cid = a.getAttribute('data-rel-cid') || '', cat = a.getAttribute('data-rel-cat') || '';
    var req = (a.getAttribute('data-rel-req') || '').toLowerCase().split('|').filter(Boolean);
    var deny = (a.getAttribute('data-rel-deny') || '').toLowerCase().split('|').filter(Boolean);
    var key = q + '|' + cat;
    if (!seen[key]) seen[key] = fetch('/api/comps?q=' + encodeURIComponent(q) + '&limit=50&sort=price' + (cat ? '&category_ids=' + encodeURIComponent(cat) : '') + (cid ? '&customid=' + encodeURIComponent(cid) : ''))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); });
    seen[key].then(function (j) {
      var n = (j.listings || []).filter(function (l) {
        var t = (l.title || '').toLowerCase();
        if (typeof l.price !== 'number' || !(l.price > 0)) return false;
        if (req.length && !req.every(function (w) { return t.indexOf(w) !== -1; })) return false;
        if (deny.length && deny.some(function (w) { return t.indexOf(w) !== -1; })) return false;
        return !(LOT.test(t) || XN.test(t) || NBOX.test(t));
      }).length;
      if (n >= 3) a.hidden = false;
    }).catch(function () {});
  });
})();
