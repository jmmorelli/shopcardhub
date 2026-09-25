/* sector-auctions.js — "Ending soon" on a sector-index block (Sep 25 2026, Mo: "point to an auction desk for
 * each card with auctions ending soon"). Reads the same /api/auctions feed the Auction Desk and the home
 * panel use, keeps the rows whose card id starts with the block's prefix (data/auction-desk.json seeds
 * those cards — desk only, never marked), soonest close first, bids first. Every link is the API's EPN-tagged
 * itemWebUrl with the custom ID re-pointed to <prefix>auctions so the block's clicks read on their own.
 * Bids are never shown as marks; the API's mark field is null for desk-only cards and is not printed. */
(function () {
  'use strict';
  var els = document.querySelectorAll('[data-sidx-auctions]'); if (!els.length) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) { return n == null || !isFinite(n) ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function ends(d) {
    var ms = Date.parse(d) - Date.now(); if (!isFinite(ms)) return '';
    if (ms < 0) return 'ended';
    var m = Math.round(ms / 60000); if (m < 60) return m + ' min';
    var h = Math.floor(m / 60); if (h < 48) return h + 'h ' + (m % 60) + 'm';
    return Math.round(h / 24) + ' days';
  }
  function retag(url, cid) { try { return String(url).replace(/([?&]customid=)[^&#]*/, '$1' + cid); } catch (e) { return url; } }
  fetch('/api/auctions').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    Array.prototype.forEach.call(els, function (el) {
      var prefix = el.getAttribute('data-sidx-auctions') || '', cid = prefix + 'auctions';
      var list = el.querySelector('.sidx-auc-l'), n = el.querySelector('.sidx-auc-n');
      var rows = ((d && d.rows) || []).filter(function (r) { return String(r.id || '').indexOf(prefix) === 0 && r.endDate; })
        .sort(function (a, b) { return (b.bidCount > 0) - (a.bidCount > 0) || Date.parse(a.endDate) - Date.parse(b.endDate); }).slice(0, 8);
      if (n) n.textContent = rows.length ? rows.length + ' live · ' + rows.filter(function (r) { return r.bidCount > 0; }).length + ' with bids · ' + (d.markDay ? 'read ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '') : 'none right now';
      if (!rows.length) { list.innerHTML = '<li class="sidx-auc-e">No verified live auction on this set’s top cards right now — the desk refreshes every 15 minutes; most of the action is in the last hour.</li>'; return; }
      list.innerHTML = rows.map(function (r) {
        return '<li><span class="t">' + esc(r.label) + '<small>' + esc(String(r.title || '').slice(0, 80)) + '</small></span>' +
          '<span class="b">' + money(r.total) + '<small>' + (r.bidCount > 0 ? r.bidCount + ' bid' + (r.bidCount === 1 ? '' : 's') : 'no bids') + ' · ends in ' + esc(ends(r.endDate)) + '</small></span>' +
          '<a class="go" href="' + esc(retag(r.url, cid)) + '" target="_blank" rel="sponsored nofollow noopener" data-kind="auction" data-card="' + esc(r.id) + '">Bid on eBay →</a></li>';
      }).join('');
    });
  }).catch(function () {
    Array.prototype.forEach.call(els, function (el) { var list = el.querySelector('.sidx-auc-l'); if (list) list.innerHTML = '<li class="sidx-auc-e">The auction desk is unavailable right now — <a href="/auctions">open it directly</a>.</li>'; });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-sidx-auctions] a[data-kind="auction"]'); if (!a) return;
    if (window.gtag) gtag('event', 'click', { link_url: 'ebay', card: a.getAttribute('data-card'), kind: 'auction', page: location.pathname });
  });
})();
