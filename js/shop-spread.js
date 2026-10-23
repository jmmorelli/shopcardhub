/* shop-spread.js v5 — the SHOP PRICE beside every Pokémon index card (Oct 15 2026, Mo's ruling after the Wild Things /
 * BinderPOS read: keep eBay sold as the index basis, show the TCGplayer market price and the spread on every card, and
 * let the collector pick the venue — "the arbitrage between the two").
 *
 * Reads /data/tcg/<tk>.json (tools/tcg-pull.mjs, nightly: TCGplayer market via the TCGCSV mirror, ~24h lag) and
 * /data/affiliates.json (link config). Adds, client-side only — no page HTML, no index number is touched:
 *   · set-index pages (sector + chase): a "Shop" column with the spread chip, a TCG button beside the eBay buttons,
 *     one line under the level ("The same N cards: $X at TCGplayer market · $Y at eBay sold · shop 6.8% lower");
 *   · /card?id=…: a Shop / eBay sold / spread block with a Buy-on-TCGplayer button, ordered by which venue is cheaper.
 * A card with no shop mark gets nothing (no dash, no placeholder — R35). Never a level, a mark or a % move (R20).
 * TCGplayer links: plain product links until data/affiliates.json says status "live" (Impact), then wrapped + subId1=<card id>. */
(function () {
  'use strict';
  var T = Math.floor(Date.now() / 300000);           // same 5-minute bucket the other data fetches use
  var AFF = null, FILES = {};
  function get(u) { return fetch(u + '?t=' + T, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function aff() { return AFF || (AFF = get('/data/affiliates.json').then(function (j) { return (j && j.tcgplayer) || {}; }).catch(function () { return {}; })); }
  // Tickers tools/tcg-pull.mjs never writes (BS1E: TCGplayer lists Base Set Unlimited only) — skip the fetch, no console 404.
  var NO_SHOP = { bs1e: 1 };
  function marks(tk) { tk = String(tk || '').toLowerCase(); if (NO_SHOP[tk]) return Promise.resolve(null); return FILES[tk] || (FILES[tk] = get('/data/tcg/' + tk + '.json').catch(function () { return null; })); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n, d) { if (n == null || !isFinite(n)) return ''; var o = d != null ? { minimumFractionDigits: d, maximumFractionDigits: d } : n >= 1000 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }; return '$' + Number(n).toLocaleString('en-US', o); }
  function pct(d) { var p = Math.abs(d) * 100; return (d < 0 ? '−' : '+') + (p >= 10 ? p.toFixed(0) : p.toFixed(1)) + '%'; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function md(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) : ''; }
  // |spread| above this is a thin TCGplayer market (one listing setting the trailing average) or a condition gap on vintage —
  // the shop price still shows, the chip and the venue call do not.
  var WIDE = 0.6, EDGE = 0.03;
  function side(d) { return d == null || Math.abs(d) > WIDE ? 'wide' : d <= -EDGE ? 'shop' : d >= EDGE ? 'ebay' : 'even'; }
  // Chip text names the venue so a cold read is "the shop is 2.4% under eBay", not a daily move (Ivan review 1, Oct 17).
  function chipHtml(v, m) {
    var s = side(v.d);
    if (s === 'wide' || v.d == null) return '';
    var t = s === 'shop' ? 'TCGplayer market is ' + pct(v.d).replace('−', '') + ' below the eBay sold mark — cheaper at the shop' : s === 'ebay' ? 'TCGplayer market is ' + pct(v.d).replace('+', '') + ' above the eBay sold mark — cheaper on eBay' : 'TCGplayer market and the eBay sold mark are within 3% — even';
    return '<i class="shc ' + s + '" title="' + esc(t) + '">' + (m === 'm' ? pct(v.d) + ' vs eBay' : 'shop ' + pct(v.d)) + '</i>';
  }
  // The line under the level: both venues, the same cards, in dollars; coloured by the chip rule (shop cheaper = green,
  // eBay cheaper = red) — the sector version used the move classes and painted a red arrow next to "cheaper at the shop".
  function lineHtml(S, f, basis) {
    var s = side(S.spread), a = Math.abs(S.spread) * 100, p = (a >= 10 ? a.toFixed(0) : a.toFixed(1)) + '%';
    var call = s === 'shop' ? '<span class="shs shop">shop ' + p + ' lower · cheaper at the shop</span>' : s === 'ebay' ? '<span class="shs ebay">shop ' + p + ' higher · cheaper on eBay</span>' : s === 'wide' ? '<span class="shs">a condition gap, not a bargain (shop = near-mint, eBay raw = any condition)</span>' : '<span class="shs">within 3% · even</span>';
    return 'The same ' + S.weighted + ' cards: <b>' + money(S.basketShop, 0) + '</b> at TCGplayer market · <b>' + money(S.basketSold, 0) + '</b> at ' + basis + ' · ' + call + ' <span class="shk" title="TCGplayer market price via the TCGCSV daily mirror. Not part of the level.">· TCGplayer as of ' + md(f.asOf) + ', about a day behind</span>';
  }
  /* the "How this index works" body on a chart-first index page (P0-C); null on pages without it */
  function howSlot(root) { var h = root.querySelector('details.pr-how > .pr-how-in'); return h || null; }
  function placeLine(slot, d) { var after = slot.classList.contains('pr-how-in') ? slot.querySelector('.ic-note, .pr-stamp, .levelchg') : null; if (after && after.nextSibling) slot.insertBefore(d, after.nextSibling); else slot.appendChild(d); }
  function tcgUrl(a, pid, cid) {
    var p = (a.productUrl || 'https://www.tcgplayer.com/product/{pid}').replace('{pid}', String(pid));
    if (a.status === 'live' && a.base) return a.base + '?u=' + encodeURIComponent(p) + '&' + (a.subIdParam || 'subId1') + '=' + encodeURIComponent(cid);
    return p;
  }
  function tcgRel(a) { return a.status === 'live' && a.base ? 'sponsored nofollow noopener' : 'nofollow noopener'; }
  function tcgLink(a, v, cid, cls, label) {
    var s = side(v.d);
    return '<a class="' + cls + (s === 'shop' ? ' lo' : '') + '" data-cid="' + esc(cid) + '" data-shop="' + (s === 'shop' ? 'cheaper' : s) + '" href="' + esc(tcgUrl(a, v.pid, cid)) + '" target="_blank" rel="' + tcgRel(a) + '" title="' + esc((label || 'TCGplayer') + ' · market ' + money(v.m) + (v.lo ? ' · lowest listing ' + money(v.lo) : '') + (s === 'shop' ? ' · cheaper than the eBay sold mark' : '')) + '">' + (label || 'TCG') + '</a>';
  }
  function track(root) {
    root.querySelectorAll('a[data-shop]').forEach(function (a) {
      if (a.__shopTracked) return; a.__shopTracked = true;
      a.addEventListener('click', function () { try { if (typeof gtag === 'function') gtag('event', 'shop_click', { venue: 'tcgplayer', item: a.getAttribute('data-cid'), spread: a.getAttribute('data-shop'), page: location.pathname }); } catch (e) {} });
    });
  }
  function css() {
    if (document.getElementById('shop-css')) return;
    var st = document.createElement('style'); st.id = 'shop-css';
    st.textContent =
      'i.shc,.sidx-tbl td i.shc{display:inline-block;margin-left:5px;font:600 11px/1.4 var(--fm,ui-monospace,monospace);font-style:normal;color:var(--text-dim,var(--dim,#5a7880));border:1px solid var(--border2,var(--bd2,#23303d));border-radius:2px;padding:0 4px;vertical-align:middle;white-space:nowrap}' +
      'i.shc.shop,.sidx-tbl td i.shc.shop{color:var(--green,var(--gn,#00e07a));border-color:currentColor}i.shc.ebay,.sidx-tbl td i.shc.ebay{color:var(--red,var(--rd,#ff2e55));border-color:currentColor}' +
      '.sh-line .shs{font-weight:600}.sh-line .shs.shop{color:var(--green,var(--gn,#00e07a))}.sh-line .shs.ebay{color:var(--red,var(--rd,#ff2e55))}' +
      'td.shop{white-space:nowrap}td.shop small{display:block;font-size:11px;color:var(--text-dim,var(--dim,#5a7880));letter-spacing:.3px}' +
      'td.shop.two .l2{margin-top:2px;line-height:1}td.shop.two .l2 i.shc{margin-left:0}a.tcgs{color:inherit;text-decoration:none;white-space:nowrap;display:inline-block;padding:13px 0;margin:-13px 0;background:linear-gradient(to right,var(--border2,var(--bd2,#3a4a58)) 50%,transparent 0) repeat-x 0 calc(100% - 13px)/3px 1px}a.tcgs.lo{color:var(--green,var(--gn,#00e07a));background-image:linear-gradient(currentColor,currentColor);background-size:100% 1px}a.tcgs:hover{color:var(--text-head,var(--th,#e4f0f4))}' +
      /* the nine-column chase table fills the page at 1012px: let long card names wrap so the Shop column fits without a scrollbar */
      '.chase-tbl tr.has-shop td.card .roi-cell>div{max-width:150px;white-space:normal;line-height:1.25}' +
      '.sh-line b{font-weight:700}.sh-line .shk{opacity:.8}' +
      '.sch-shop-m{display:none}' +
      /* B81 (Night Crew Oct 16): the Shop header and the chips sat at 8.5–10 px under the 11 px floor (§12/§24) */
      '.sidx-tbl th.shop,.chase-tbl th.shop{font-size:11px}' +
      /* B80: with the Shop column in, a long card name kept nowrap pushed the table past its box at 1280 (ND1E 1075 > 1010); names wrap instead */
      '@media(min-width:561px){.sidx-tbl tr.has-shop>td:nth-child(2){white-space:normal}}' +
      /* phones: the sector table becomes a grid (css/site-fixes.css §10) — the Shop cell hides and a one-line chip rides in the action cell */
      '@media(max-width:760px){.sidx-tbl tr.has-shop th:nth-child(6),.sidx-tbl tr.has-shop td:nth-child(6){display:none}}' +
      '@media(max-width:560px){.sidx-tbl tr.has-shop td.shop{display:none}.sidx-tbl tr.has-shop td.act .sch-shop-m{display:flex;flex:1 0 100%;order:8;align-items:center;gap:6px;font:600 11px/1.4 var(--fm,ui-monospace,monospace);color:var(--text-dim,var(--dim,#5a7880))}.sidx-tbl tr.has-shop td.act .sch-shop-m .shc{margin-left:0}}' +
      /* card page block */
      '.cdp-shop{margin:0 0 12px;border:1px solid var(--border,var(--bd,#23303d));border-radius:3px;background:var(--p2,#0e151c);padding:10px 12px}' +
      '.cdp-shop .g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.cdp-shop .r .k{display:block;font:600 11px/1.2 var(--fd,inherit);letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim,var(--dim,#5a7880));margin-bottom:3px}' +
      '.cdp-shop .r b{display:block;font:700 18px/1.1 var(--fm,ui-monospace,monospace);color:var(--text-head,var(--th,#e4f0f4))}.cdp-shop .r b.shop{color:var(--green,var(--gn,#00e07a))}.cdp-shop .r b.ebay{color:var(--red,var(--rd,#ff2e55))}' +
      '.cdp-shop .r small{display:block;font-size:11px;color:var(--text-dim,var(--dim,#5a7880));margin-top:2px;line-height:1.4}' +
      '.cdp-shop .v{margin-top:8px;font:600 11px/1.5 var(--fb,inherit);color:var(--text,var(--tx,#b8cdd4))}.cdp-shop .v b{color:var(--text-head,var(--th,#e4f0f4))}' +
      '.cdp-shop .n{margin:8px 0 0;font-size:11px;line-height:1.5;color:var(--text-dim,var(--dim,#5a7880))}' +
      '.cdp-btns a.tcgbtn{border-color:var(--border2,var(--bd2,#23303d))}.cdp-btns a.tcgbtn.lo{border-color:var(--green,var(--gn,#00e07a))}' +
      '@media(max-width:560px){.cdp-shop .g{grid-template-columns:1fr 1fr}.cdp-shop .r b{font-size:16px}}';
    document.head.appendChild(st);
  }

  /* ---------- sector pages: <section class="sidx" id="<tk>"> ---------- */
  function sector(sec, a) {
    var tk = sec.id; if (!tk) return;
    marks(tk).then(function (f) {
      if (!f || !f.marks) return;
      var M = f.marks, any = false;
      sec.querySelectorAll('.sidx-tbl tbody tr[data-cid]').forEach(function (tr) {
        var cid = tr.getAttribute('data-cid'), v = M[cid]; if (!v) return;
        var tds = tr.children; if (tds.length < 4) return;
        // the price itself is the TCGplayer link (a fifth button in the action cell wrapped the Raw/PSA/TAG group onto two
        // rows whenever a live Bid was showing — Mo, Oct 16: "the Wartortle and Psyduck rows look broken")
        var td = document.createElement('td'); td.className = 'num shop two';
        td.innerHTML = tcgLink(a, v, cid, 'tcgs', money(v.m) + ' ↗') + '<div class="l2">' + chipHtml(v) + '</div>';
        tds[2].insertAdjacentElement('afterend', td);
        tr.classList.add('has-shop');
        var act = tr.querySelector('td.act .act-w');
        if (act) {
          var m = document.createElement('span'); m.className = 'sch-shop-m'; m.innerHTML = tcgLink(a, v, cid, 'tcgs', 'shop ' + money(v.m) + ' ↗') + chipHtml(v, 'm');
          act.appendChild(m);
        }
        any = true;
      });
      if (!any) return;
      // B80 (Night Crew Oct 16): a row with no shop mark got no cell, so its Weight sat under "Shop (TCG)" and its buttons
      // spilled past the table (30th: 1405 px in a 1010 px box at 1280; Skyridge, Neo 1st Ed, Aquapolis, Celebrations).
      // Every data row gets a cell (empty when there is no mark, R35: no dash); a full-width row's colspan grows by one.
      sec.querySelectorAll('.sidx-tbl').forEach(function (tbl) {
        tbl.querySelectorAll('tbody tr').forEach(function (tr) {
          if (tr.classList.contains('has-shop')) return;
          var tds = tr.children;
          if (tr.hasAttribute('data-cid') && tds.length >= 4) { var td = document.createElement('td'); td.className = 'num shop'; tds[2].insertAdjacentElement('afterend', td); tr.classList.add('has-shop'); }
          else if (tds.length === 1 && tds[0].colSpan > 1) tds[0].colSpan = tds[0].colSpan + 1;
        });
      });
      sec.querySelectorAll('.sidx-tbl thead tr').forEach(function (tr) {
        if (tr.querySelector('th.shop')) return;
        var th = document.createElement('th'); th.className = 'shop';
        th.title = 'TCGplayer market price (the "shop price" most card shops sell at), mirrored daily with about a 24-hour lag. Tap the price to open the card on TCGplayer. Chip = shop vs the eBay sold mark: green, cheaper at the shop; red, cheaper on eBay. Shown beside the index, never used in it.';
        th.textContent = 'Shop (TCG)';
        tr.children[2].insertAdjacentElement('afterend', th);
        tr.classList.add('has-shop');
      });
      var S = f.summary;
      // P0-C (Oct 23 2026): the spread line sits behind "How this index works" when the page has the toggle, else in the level box
      var lv = howSlot(sec) || sec.querySelector('.sidx-level');
      if (lv && S && S.basketSold > 0 && S.spread != null && !lv.querySelector('.sh-line')) {
        var d = document.createElement(lv.classList.contains('pr-how-in') ? 'p' : 'div'); d.className = (lv.classList.contains('pr-how-in') ? 'pr-stamp' : 'lvc') + ' sh-line';
        d.innerHTML = lineHtml(S, f, 'eBay sold');
        placeLine(lv, d);
      }
      track(sec);
    });
  }

  /* ---------- chase pages: tr.hrow with a.ebay[data-cid] ---------- */
  function chase(a) {
    var rows = document.querySelectorAll('tr.hrow'); if (!rows.length) return;
    var first = rows[0].querySelector('a.ebay[data-cid]'); if (!first) return;
    var tk = first.getAttribute('data-cid').split('-')[0];
    marks(tk).then(function (f) {
      if (!f || !f.marks) return;
      var M = f.marks, any = false;
      rows.forEach(function (tr) {
        var eb = tr.querySelector('a.ebay[data-cid]'); if (!eb) return;
        var cid = eb.getAttribute('data-cid'), v = M[cid]; if (!v) return;
        var trk = tr.querySelector('td.trk'); if (!trk) return;
        // nine columns already fill the page here, so the shop cell is two lines: price, then chip + the TCG link
        var td = document.createElement('td'); td.className = 'num shop two';
        td.innerHTML = tcgLink(a, v, cid, 'tcgs', money(v.m) + ' ↗') + '<div class="l2">' + chipHtml(v) + '</div>';
        trk.insertAdjacentElement('beforebegin', td);
        tr.classList.add('has-shop'); any = true;
      });
      if (!any) return;
      var tbl = rows[0].closest('table');
      // rows with no shop mark still need a cell so the columns line up
      tbl.querySelectorAll('tbody tr').forEach(function (tr) {
        if (tr.classList.contains('has-shop')) return;
        var trk = tr.querySelector('td.trk'), tds = tr.children;
        var td = document.createElement('td'); td.className = 'num shop';
        if (trk) trk.insertAdjacentElement('beforebegin', td);
        else if (tr.classList.contains('sumrow') && tds.length >= 9) tds[6].insertAdjacentElement('afterend', td);
      });
      var hd = tbl.querySelector('thead tr');
      if (hd && !hd.querySelector('th.shop')) {
        var ths = hd.children, star = null;
        for (var i = 0; i < ths.length; i++) if (ths[i].textContent.trim() === '★') star = ths[i];
        var th = document.createElement('th'); th.className = 'shop'; th.textContent = 'Shop';
        th.title = 'TCGplayer market price (the shop price), mirrored daily with ~24h lag. Tap the price to open the card on TCGplayer. Chip = shop vs our sold mark: green, cheaper at the shop; red, cheaper on eBay. Beside the index, never in it.';
        if (star) star.insertAdjacentElement('beforebegin', th); else hd.appendChild(th);
      }
      var S = f.summary, sum = tbl.querySelector('tr.sumrow td.shop');
      if (sum && S && S.basketShop) { sum.classList.add('two'); sum.innerHTML = '<div>' + money(S.basketShop, 0) + '</div>' + (S.spread != null && side(S.spread) !== 'wide' ? '<div class="l2"><i class="shc ' + side(S.spread) + '">' + pct(S.spread) + '</i></div>' : ''); }
      var lb = howSlot(document) || document.querySelector('.levelbox');
      if (lb && S && S.basketSold > 0 && S.spread != null && !lb.querySelector('.sh-line')) {
        var d = document.createElement(lb.classList.contains('pr-how-in') ? 'p' : 'div'); d.className = (lb.classList.contains('pr-how-in') ? 'pr-stamp' : 'levelchg') + ' sh-line';
        d.innerHTML = lineHtml(S, f, 'our sold marks');
        placeLine(lb, d);
      }
      track(tbl);
    });
  }

  /* ---------- /card?id=… (js/card-page.js fires sch:card-rendered) ---------- */
  function card(detail, a) {
    var d = detail.d, c = detail.c; if (!c || !c.id) return;
    var buy = document.querySelector('#cdp .cdp-buy'); if (!buy) return;
    (window.__schShopFile ? Promise.resolve(window.__schShopFile) : marks(d.ticker || c.id.split('-')[0])).then(function (f) {
      var v = f && f.marks && f.marks[c.id];
      // B76 re-land: card-page.js reserves .cdp-shop-wait + .tcg-slot on first paint when the file has this card
      var slot = buy.querySelector('.cdp-shop-wait'), tslot = buy.querySelector('.tcg-slot');
      if (!v) { if (slot) slot.remove(); if (tslot) tslot.remove(); return; }
      var s = side(v.d), raw = c.raw;
      var box = slot || document.createElement('div'); box.className = 'cdp-shop'; box.removeAttribute('aria-hidden');
      box.innerHTML =
        '<div class="g">' +
        '<div class="r"><span class="k">Shop price</span><b>' + money(v.m) + '</b><small>TCGplayer market · ' + md(f.asOf) + (v.lo ? ' · lowest listing ' + money(v.lo) : '') + '</small></div>' +
        '<div class="r"><span class="k">eBay sold mark</span><b>' + (raw != null ? money(raw) : '<span style="font-size:12px">not priced</span>') + '</b><small>' + (raw != null ? 'raw · ' + md(c.rawAsOf) + ' · the index number' : 'below the liquidity screen') + '</small></div>' +
        '<div class="r"><span class="k">Spread</span>' + (v.d == null ? '<b><span style="font-size:12px">—</span></b>' : s === 'wide' ? '<b><span style="font-size:12px">wide</span></b><small>thin market or a condition gap — read both</small>' : '<b class="' + (s === 'shop' || s === 'ebay' ? s : '') + '">' + pct(v.d) + '</b><small>' + (s === 'shop' ? 'cheaper at the shop' : s === 'ebay' ? 'cheaper on eBay' : 'within 3% — even') + '</small>') + '</div>' +
        '</div>' +
        (s === 'shop' ? '<div class="v">Today the shop is the place: TCGplayer’s market price is <b>' + pct(v.d).replace('−', '') + ' under</b> what this card has been selling for raw on eBay.</div>' : s === 'ebay' ? '<div class="v">Today eBay is the place: raw copies have been selling <b>' + pct(v.d).replace('+', '') + ' under</b> TCGplayer’s market price — pick Raw above for the eBay button.</div>' : '') +
        '<p class="n">Shop price = TCGplayer’s market price (their recent sales of this printing, near-mint), mirrored daily with about a day’s lag. Shown beside the index, never used in it. ' + (d.wotc ? 'Vintage note: the shop price is a near-mint price; the eBay raw mark is a typical raw sale in any condition, so a wide gap here is condition, not a bargain.' : '') + '</p>';
      var btns = buy.querySelector('.cdp-btns');
      if (!slot) buy.insertBefore(box, btns || buy.firstChild);
      if (btns) {
        var cid = 'card-' + c.id;
        // Button order follows the price every time (a card "even" within 3% but still lower at the shop led with five eBay
        // buttons — Ivan review 1); the chip says "even", the order says which is cheaper.
        var lead = s !== 'wide' && v.d != null && raw != null && v.d < 0;
        var btn = document.createElement('a'); btn.className = 'tcgbtn' + (s === 'shop' ? ' lo' : ''); btn.setAttribute('data-cid', cid); btn.setAttribute('data-shop', s === 'shop' ? 'cheaper' : s);
        btn.href = tcgUrl(a, v.pid, cid); btn.target = '_blank'; btn.rel = tcgRel(a);
        btn.innerHTML = 'Buy on TCGplayer<small>' + (s === 'shop' ? 'cheaper venue today · ' : lead ? 'about even, a touch lower · ' : '') + 'market ' + money(v.m) + (v.lo ? ' · from ' + money(v.lo) : '') + '</small>';
        if (tslot) tslot.remove();
        if (lead) btns.insertBefore(btn, btns.firstChild); else btns.appendChild(btn);
        // the eBay buttons are re-rendered on a Buy It Now / Auctions switch — keep the TCG button through it
        new MutationObserver(function () { if (!btns.contains(btn)) { if (lead) btns.insertBefore(btn, btns.firstChild); else btns.appendChild(btn); } }).observe(btns, { childList: true });
      }
      track(buy);
    });
  }

  function boot() {
    css();
    aff().then(function (a) {
      document.querySelectorAll('section.sidx[id]').forEach(function (sec) { sector(sec, a); });
      chase(a);
      if (document.getElementById('cdp')) {
        if (window.__schCard) card(window.__schCard, a);
        document.addEventListener('sch:card-rendered', function (e) { card(e.detail, a); });
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
