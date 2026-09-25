/* sector-auctions.js — live eBay auctions folded INTO the index rows (Sep 25 2026, Mo: "fold the ebay auctions part
 * into the line for the index, near the buy button"). Reads /api/auctions (the Auction Desk feed), and for every
 * <span class="sidx-auc-slot" data-auc-card="<card id>"> on the page renders ONE button: the soonest-closing verified
 * auction on that exact card, bids first. Card ids are engine ids (data/watchlist.json) or desk-only ids from
 * data/auction-desk.json (desk only, never marked). Links are the API's EPN-tagged itemWebUrl with the custom ID
 * re-pointed to <ticker>-auctions so these clicks read on their own. A bid is never shown as a mark; the API's mark
 * field is null for desk cards and is not printed.
 *
 * v3 (Sep 25 2026, Bowman pages): window.SCH_AUC.run() re-scans for slots a page rendered after load (BOW26 draws its
 * rows from indices.json client-side); the feed is fetched once. Styles are injected when the page's own CSS has none. */
(function () {
  'use strict';
  var CSS = '.sidx-auc-slot{display:inline-block;min-width:0;}.sidx-auc-slot a.auc{display:inline-block;font-family:var(--fd,inherit);font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--th,#e4f0f4);background:var(--p2,#111820);border:1px solid var(--gd,#f5c800);padding:5px 10px;border-radius:2px;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}.sidx-auc-slot a.auc small{font-family:var(--fm,ui-monospace,monospace);font-weight:400;letter-spacing:0;text-transform:none;color:var(--dim,#7a969e);margin-left:6px;font-size:10px;}.sidx-auc-slot a.auc:hover{background:var(--gd,#f5c800);color:#000;}.sidx-auc-slot a.auc:hover small{color:#000;}@media(max-width:700px){.sidx-auc-slot a.auc small{display:none;}}';
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
  function styled() {
    if (document.querySelector('style[data-sch-auc]')) return;
    var probe = document.querySelector('.sidx-auc-slot'); if (!probe) return;
    // a page that ships its own rules (the Pokémon index tables) leaves this alone
    var has = false;
    try { Array.prototype.some.call(document.styleSheets, function (ss) { try { return Array.prototype.some.call(ss.cssRules || [], function (r) { if (r.selectorText && r.selectorText.indexOf('.sidx-auc-slot a.auc') > -1) { has = true; return true; } return false; }); } catch (e) { return false; } }); } catch (e) {}
    if (has) return;
    var st = document.createElement('style'); st.setAttribute('data-sch-auc', '1'); st.textContent = CSS; document.head.appendChild(st);
  }
  var feed = null;
  function rows() {
    if (!feed) feed = fetch('/api/auctions').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { return (d && d.rows) || []; });
    return feed;
  }
  function fill(el, list) {
    var id = el.getAttribute('data-auc-card'), sec = el.closest('.sidx'), tk = el.getAttribute('data-auc-tk') || (sec ? (sec.id || 'sidx') : 'sidx');
    var mine = list.filter(function (r) { return r.id === id && r.endDate && r.url && Date.parse(r.endDate) > Date.now(); })
      .sort(function (a, b) { return (b.bidCount > 0) - (a.bidCount > 0) || Date.parse(a.endDate) - Date.parse(b.endDate); });
    var r = mine[0]; el.setAttribute('data-auc-done', '1'); if (!r) { el.removeAttribute('data-auc-card'); el.innerHTML = ''; return; }
    el.innerHTML = '<a class="auc" onclick="event.stopPropagation()" href="' + esc(retag(r.url, tk + '-auctions')) + '" target="_blank" rel="sponsored nofollow noopener" data-kind="auction" data-card="' + esc(r.id) + '" title="' + esc(String(r.title || '').slice(0, 120)) + (mine.length > 1 ? ' · +' + (mine.length - 1) + ' more live auction' + (mine.length > 2 ? 's' : '') + ' on this card' : '') + '">Bid ' + money(r.total) + '<small>' + (r.bidCount > 0 ? r.bidCount + ' bid' + (r.bidCount === 1 ? '' : 's') : 'no bids') + ' · ' + esc(ends(r.endDate)) + '</small></a>';
  }
  function run() {
    var slots = document.querySelectorAll('.sidx-auc-slot[data-auc-card]:not([data-auc-done])'); if (!slots.length) return;
    styled();
    rows().then(function (list) { Array.prototype.forEach.call(slots, function (el) { fill(el, list); }); })
      .catch(function () { Array.prototype.forEach.call(slots, function (el) { el.setAttribute('data-auc-done', '1'); el.removeAttribute('data-auc-card'); el.innerHTML = ''; }); });
  }
  window.SCH_AUC = { run: run };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.sidx-auc-slot a[data-kind="auction"]'); if (!a) return;
    if (window.gtag) gtag('event', 'click', { link_url: 'ebay', card: a.getAttribute('data-card'), kind: 'auction', page: location.pathname });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
