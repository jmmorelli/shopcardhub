/* sector-auctions.js — live eBay auctions folded INTO the index rows (Sep 25 2026, Mo: "fold the ebay auctions part
 * into the line for the index, near the buy button"). Reads /api/auctions (the Auction Desk feed), and for every
 * <span class="sidx-auc-slot" data-auc-card="<desk id>"> on the page renders ONE button: the soonest-closing verified
 * auction on that exact card, bids first. data/auction-desk.json seeds the cards (desk only, never marked). Links are
 * the API's EPN-tagged itemWebUrl with the custom ID re-pointed to <ticker>-auctions so these clicks read on their
 * own. A bid is never shown as a mark; the API's mark field is null for desk cards and is not printed. */
(function () {
  'use strict';
  var slots = document.querySelectorAll('.sidx-auc-slot[data-auc-card]'); if (!slots.length) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) { return n == null || !isFinite(n) ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  function ends(d) {
    var ms = Date.parse(d) - Date.now(); if (!isFinite(ms)) return '';
    if (ms < 0) return 'ended';
    var m = Math.round(ms / 60000); if (m < 60) return m + 'm';
    var h = Math.floor(m / 60); if (h < 48) return h + 'h';
    return Math.round(h / 24) + 'd';
  }
  function retag(url, cid) { try { return String(url).replace(/([?&]customid=)[^&#]*/, '$1' + cid); } catch (e) { return url; } }
  fetch('/api/auctions').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    var rows = (d && d.rows) || [];
    Array.prototype.forEach.call(slots, function (el) {
      var id = el.getAttribute('data-auc-card'), sec = el.closest('.sidx'), tk = sec ? (sec.id || 'sidx') : 'sidx';
      var mine = rows.filter(function (r) { return r.id === id && r.endDate && r.url && Date.parse(r.endDate) > Date.now(); })
        .sort(function (a, b) { return (b.bidCount > 0) - (a.bidCount > 0) || Date.parse(a.endDate) - Date.parse(b.endDate); });
      var r = mine[0]; if (!r) { el.remove(); return; }
      el.innerHTML = '<a class="auc" href="' + esc(retag(r.url, tk + '-auctions')) + '" target="_blank" rel="sponsored nofollow noopener" data-kind="auction" data-card="' + esc(r.id) + '" title="' + esc(String(r.title || '').slice(0, 120)) + '">Bid ' + money(r.total) + '<small>' + (r.bidCount > 0 ? r.bidCount + ' bid' + (r.bidCount === 1 ? '' : 's') + ' · ' : 'no bids · ') + 'ends ' + esc(ends(r.endDate)) + (mine.length > 1 ? ' · +' + (mine.length - 1) + ' more' : '') + '</small></a>';
    });
  }).catch(function () { Array.prototype.forEach.call(slots, function (el) { el.remove(); }); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.sidx-auc-slot a[data-kind="auction"]'); if (!a) return;
    if (window.gtag) gtag('event', 'click', { link_url: 'ebay', card: a.getAttribute('data-card'), kind: 'auction', page: location.pathname });
  });
})();
