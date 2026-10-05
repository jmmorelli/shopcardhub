/* grade-links.js — Raw · PSA 9 · PSA 10 · TAG eBay links for Pokémon index rows and card pages (Sep 30 2026, Mo:
 * "link to PSA 9 and PSA 10 … a 'raw auctions' or 'PSA 10 auctions' option … promo TAG graded as its own link …
 * I just don't want it to get too clunky").
 *
 * One switch per table (Buy It Now ↔ Auctions ending soon) instead of more buttons per row. The Raw link is baked in
 * the page (crawlable, audited); the graded links are built here from the row's eBay phrase (data-q) so the HTML stays
 * light (a full EVS21 table would carry ~600 KB of URLs otherwise). Every URL carries the full EPN param set; only
 * customid varies: <ticker>-<num>[-psa9|-psa10|-tag][-auc] (card pages prefix "card-").
 * Searches only — never a price (R20). TAG first-class beside PSA (Mo, Sep 25: promote TAG).
 *
 * Oct 4 2026 (Pokémon KB fix list G5/G6, site audit S13/S14/S33/S40/S46):
 *  - TAG searches require the slab phrase "TAG 10" and drop TAG TEAM / Tag All Stars cards — a bare "tag" pulled the
 *    Sun & Moon TAG TEAM GX cards (KB ch.03 §1.7, §4.5).
 *  - WOTC Unlimited graded searches drop Base Set 2, the 2021/2026 Classic Collection reprints ("celebration"),
 *    the 1999-2000 4th print, Japanese and reprints; 1st Edition graded searches drop Unlimited and Celebration copies.
 *  - Per-ticker exclusions (every grade, raw included): JU99 "No Symbol" error holos; AQ03 / SK03 reverse holos (the
 *    index tracks the regular print). The baked raw links carry the same words (tools/lib/card-files.mjs RAW_EXTRA).
 */
(function () {
  var P = 'mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001';
  var RAW_NOT = ' -psa -cgc -bgs -sgc -tag -beckett -graded -slab';
  var KEY = 'sch_glk_mode';
  var TAG_Q = ' "TAG 10" -team -"tag team" -"all stars" -psa -cgc -bgs -sgc';
  var UNL_NOT = ' -1st -shadowless -celebrations -celebration -"base set 2" -classic -1999-2000 -japanese -reprint';
  var FIRST_NOT = ' -unlimited -celebration -celebrations';
  // keep in step with RAW_EXTRA in tools/lib/card-files.mjs (the baked raw links)
  var EXTRA = { ju99: ' -"no symbol"', aq03: ' -reverse', sk03: ' -reverse' };
  // TAG TEAM sets (Oct 4 2026, TU19): titles say "Tag Team", so raw drops only TAG slabs and TAG searches keep the word "team"
  // (keep in step with TAG_TEAM in tools/lib/card-files.mjs)
  var TT = { tu19: 1 };
  var RAW_NOT_TT = ' -psa -cgc -bgs -sgc -"tag 10" -"tag 9" -beckett -graded -slab';
  var TAG_Q_TT = ' "TAG 10" -psa -cgc -bgs -sgc';
  function tkOf(cid) { var m = String(cid || '').replace(/^card-/, '').match(/^([a-z0-9]+)-/); return m ? m[1] : ''; }
  var G = [
    { g: 'raw', lbl: 'Raw', short: 'Raw', tip: 'Raw (ungraded) copies of this card on eBay' },
    { g: 'psa9', lbl: 'PSA 9', short: '9', tip: 'PSA 9 copies of this card on eBay' },
    { g: 'psa10', lbl: 'PSA 10', short: '10', tip: 'PSA 10 copies of this card on eBay' },
    { g: 'tag', lbl: 'TAG', short: 'TAG', tip: 'TAG 10 slabs of this card on eBay (often none: TAG is a small share of graded volume)' }
  ];
  function nkw(q) { return encodeURIComponent(String(q).replace(/\s+/g, ' ').trim()).replace(/%20/g, '+').replace(/'/g, '%27').replace(/[!()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }); }
  // ed: false (modern) · true / "unl" (WOTC Unlimited) · "1st" (1st Edition index) · "shadowless" (Base Set Shadowless index)
  // tk: lower-case ticker (from the row's customid) for the per-ticker exclusions in EXTRA
  function phrase(q, g, ed, tk) {
    q = String(q || '');
    var x = EXTRA[tk] || '';
    if (TT[tk]) return (g === 'raw' ? q + RAW_NOT_TT : g === 'psa9' ? q + ' psa 9 -"psa 10"' : g === 'psa10' ? q + ' psa 10' : g === 'tag' ? q + TAG_Q_TT : q) + x;
    if (ed === '1st') return (g === 'raw' ? q + RAW_NOT : g === 'psa9' ? q + ' psa 9 -"psa 10"' + FIRST_NOT : g === 'psa10' ? q + ' psa 10' + FIRST_NOT : q + TAG_Q + FIRST_NOT) + x;
    if (ed === 'shadowless') return (g === 'raw' ? q + RAW_NOT : g === 'psa9' ? q + ' psa 9 -"psa 10"' : g === 'psa10' ? q + ' psa 10' : q + TAG_Q) + ' -1st' + x;
    if (g === 'raw') return q + RAW_NOT + (ed ? ' -1st -shadowless' : '') + x;
    // graded labels on WOTC Unlimited slabs don't say "Unlimited" — searching for the word hides most of them
    var b = (ed ? q.replace(/\bunlimited\b/i, '').replace(/\s+/g, ' ').trim() + UNL_NOT : q) + x;
    if (g === 'psa9') return b + ' psa 9 -"psa 10"';
    if (g === 'psa10') return b + ' psa 10';
    if (g === 'tag') return b + TAG_Q;
    return q;
  }
  function edOf(sec) { if (!sec.hasAttribute('data-wotc')) return false; var v = sec.getAttribute('data-wotc'); return v === '1st' || v === 'shadowless' ? v : true; }
  function url(o) {
    var p = ['_nkw=' + nkw(phrase(o.q, o.g, o.wotc, tkOf(o.cid))), '_sacat=183454'];
    if (o.mode === 'auc') p.push('LH_Auction=1', '_sop=1'); else p.push('LH_BIN=1');
    if (o.av && o.g === 'raw') p.push('LH_AV=1');
    p.push(P, 'customid=' + o.cid + (o.g === 'raw' ? '' : '-' + o.g) + (o.mode === 'auc' ? '-auc' : ''));
    return 'https://www.ebay.com/sch/i.html?' + p.join('&');
  }
  function getMode() { try { return localStorage.getItem(KEY) === 'auc' ? 'auc' : 'bin'; } catch (e) { return 'bin'; } }
  function setMode(m) { try { localStorage.setItem(KEY, m); } catch (e) {} }
  function track(a) {
    a.addEventListener('click', function () {
      try { if (typeof gtag === 'function') gtag('event', 'grade_click', { grade: a.getAttribute('data-g'), mode: a.getAttribute('data-mode') || 'bin', item: a.getAttribute('data-cid') || '', page: location.pathname }); } catch (e) {}
    });
  }
  // fill one row's link group (index tables)
  function fillRow(tr, wotc, mode) {
    var box = tr.querySelector('.glk'); if (!box || box.getAttribute('data-filled')) return;
    var q = tr.getAttribute('data-q'), cid = tr.getAttribute('data-cid'), av = tr.getAttribute('data-av') === '1';
    var raw = box.querySelector('a[data-g="raw"]');
    if (raw) { raw.setAttribute('data-bin', raw.getAttribute('href')); raw.setAttribute('data-cid', cid); track(raw); }
    G.slice(1).forEach(function (d) {
      var a = document.createElement('a');
      a.className = 'ebay g-' + d.g; a.setAttribute('data-g', d.g); a.setAttribute('data-cid', cid);
      a.target = '_blank'; a.rel = 'sponsored nofollow noopener'; a.title = d.tip;
      a.innerHTML = d.g === 'psa9' || d.g === 'psa10' ? '<span class="gl">PSA&nbsp;</span>' + d.short : d.short;
      a.href = url({ q: q, g: d.g, wotc: wotc, cid: cid, mode: 'bin' });
      track(a); box.appendChild(a);
    });
    box.setAttribute('data-filled', '1');
    if (mode === 'auc') apply(tr, wotc, mode);
  }
  function apply(scope, wotc, mode) {
    scope.querySelectorAll('tr[data-q]').forEach(function (tr) {
      var q = tr.getAttribute('data-q'), cid = tr.getAttribute('data-cid'), av = tr.getAttribute('data-av') === '1';
      tr.querySelectorAll('.glk a[data-g]').forEach(function (a) {
        var g = a.getAttribute('data-g');
        a.setAttribute('data-mode', mode);
        if (g === 'raw' && mode === 'bin' && a.getAttribute('data-bin')) { a.href = a.getAttribute('data-bin'); return; }
        a.href = url({ q: q, g: g, wotc: wotc, cid: cid, mode: mode, av: av });
      });
    });
  }
  function initTables() {
    document.querySelectorAll('.sidx[data-glk]').forEach(function (sec) {
      var wotc = edOf(sec), mode = getMode();
      sec.querySelectorAll('tr[data-q]').forEach(function (tr) { fillRow(tr, wotc, mode); });
      var bar = sec.querySelector('.glk-bar');
      function paint(m) { if (bar) bar.querySelectorAll('button[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); }); sec.classList.toggle('glk-auc', m === 'auc'); }
      paint(mode);
      if (bar) bar.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-mode]'); if (!b) return;
        var m = b.getAttribute('data-mode'); setMode(m); paint(m);
        document.querySelectorAll('.sidx[data-glk]').forEach(function (s2) { apply(s2, edOf(s2), m); });
        try { if (typeof gtag === 'function') gtag('event', 'grade_mode', { mode: m, page: location.pathname }); } catch (err) {}
      });
    });
  }
  window.SCH_GLK = { url: url, phrase: phrase, grades: G, getMode: getMode, setMode: setMode, track: track };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTables); else initTables();
})();
