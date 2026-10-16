/* shop-spread.js — the SHOP PRICE beside every Pokémon index card (Oct 15 2026, Mo's ruling after the Wild Things /
 * BinderPOS read: keep eBay sold as the index basis, show the TCGplayer market price and the spread on every card, and
 * let the collector pick the venue — "the arbitrage between the two").
 *
 * Reads /data/tcg/<tk>.json (tools/tcg-pull.mjs, nightly: TCGplayer market via the TCGCSV mirror, ~24h lag) and
 * /data/affiliates.json (link config). Adds, client-side only — no page HTML, no index number is touched:
 *   · set-index pages (sector + chase): a "Shop" column with the spread chip, a TCG button beside the eBay buttons,
 *     one line under the level ("at shop price $X · ▼ 6.8% vs the same cards at eBay sold");
 *   · /card?id=…: a Shop / eBay sold / spread block with a Buy-on-TCGplayer button, ordered by which venue is cheaper.
 * A card with no shop mark gets nothing (no dash, no placeholder — R35). Never a level, a mark or a % move (R20).
 * TCGplayer links: plain product links until data/affiliates.json says status "live" (Impact), then wrapped + subId1=<card id>. */
(function () {
  'use strict';
  var T = Math.floor(Date.now() / 300000);           // same 5-minute bucket the other data fetches use
  var AFF = null, FILES = {};
  function get(u) { return fetch(u + '?t=' + T, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function aff() { return AFF || (AFF = get('/data/affiliates.json').then(function (j) { return (j && j.tcgplayer) || {}; }).catch(function () { return {}; })); }
  function marks(tk) { tk = String(tk || '').toLowerCase(); return FILES[tk] || (FILES[tk] = get('/data/tcg/' + tk + '.json').catch(function () { return null; })); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n, d) { if (n == null || !isFinite(n)) return ''; var o = d != null ? { minimumFractionDigits: d, maximumFractionDigits: d } : n >= 1000 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }; return '$' + Number(n).toLocaleString('en-US', o); }
  function pct(d) { var p = Math.abs(d) * 100; return (d < 0 ? '−' : '+') + (p >= 10 ? p.toFixed(0) : p.toFixed(1)) + '%'; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function md(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? MON[+m[2] - 1] + ' ' + (+m[3]) : ''; }
  // |spread| above this is a thin TCGplayer market (one listing setting the trailing average) or a condition gap on vintage —
  // the shop price still shows, the chip and the venue call do not.
  var WIDE = 0.6, EDGE = 0.03;
  function side(d) { return d == null || Math.abs(d) > WIDE ? 'wide' : d <= -EDGE ? 'shop' : d >= EDGE ? 'ebay' : 'even'; }
  function chipHtml(v) {
    var s = side(v.d);
    if (s === 'wide' || v.d == null) return '';
    var t = s === 'shop' ? 'TCGplayer market is ' + pct(v.d).replace('−', '') + ' below the eBay sold mark' : s === 'ebay' ? 'TCGplayer market is ' + pct(v.d).replace('+', '') + ' above the eBay sold mark' : 'TCGplayer market and the eBay sold mark are within 3%';
    return '<i class="shc ' + s + '" title="' + esc(t) + '">' + pct(v.d) + '</i>';
  }
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
      'i.shc,.sidx-tbl td i.shc{display:inline-block;margin-left:5px;font:600 10px/1.4 var(--fm,ui-monospace,monospace);font-style:normal;color:var(--text-dim,var(--dim,#5a7880));border:1px solid var(--border2,var(--bd2,#23303d));border-radius:2px;padding:0 4px;vertical-align:middle;white-space:nowrap}' +
      'i.shc.shop,.sidx-tbl td i.shc.shop{color:var(--green,var(--gn,#00e07a));border-color:currentColor}i.shc.ebay,.sidx-tbl td i.shc.ebay{color:var(--red,var(--rd,#ff2e55));border-color:currentColor}' +
      'td.shop{white-space:nowrap}td.shop small{display:block;font-size:9px;color:var(--text-dim,var(--dim,#5a7880));letter-spacing:.3px}' +
      '.sidx .act-w a.tcgl,.chase-tbl .act-w a.tcgl{display:inline-flex;align-items:center;justify-content:center;font:700 11px/1 var(--fd,inherit);letter-spacing:1px;text-transform:uppercase;min-height:40px;padding:0 12px;border:1px solid var(--border2,var(--bd2,#23303d));border-radius:2px;color:var(--text-head,var(--th,#e4f0f4));text-decoration:none;margin-left:4px;box-sizing:border-box}' +
      'td.shop.two .l2{margin-top:2px;line-height:1}td.shop.two .l2 i.shc{margin-left:0}a.tcgs{color:inherit;text-decoration:none;border-bottom:1px dotted var(--border2,var(--bd2,#23303d));white-space:nowrap}a.tcgs.lo{color:var(--green,var(--gn,#00e07a));border-bottom-color:currentColor}a.tcgs:hover{color:var(--text-head,var(--th,#e4f0f4))}' +
      /* the nine-column chase table fills the page at 1012px: let long card names wrap so the Shop column fits without a scrollbar */
      '.chase-tbl tr.has-shop td.card .roi-cell>div{max-width:150px;white-space:normal;line-height:1.25}' +
      '.sidx .act-w a.tcgl.lo,.chase-tbl .act-w a.tcgl.lo{border-color:var(--green,var(--gn,#00e07a));color:var(--green,var(--gn,#00e07a))}' +
      '.sidx .act-w a.tcgl:hover,.chase-tbl .act-w a.tcgl:hover{background:var(--p2,#0e151c)}' +
      '.sh-line b{font-weight:700}.sh-line .shk{opacity:.8}' +
      '.sch-shop-m{display:none}' +
      /* phones: the sector table becomes a grid (css/site-fixes.css §10) — the Shop cell hides and a one-line chip rides in the action cell */
      '@media(max-width:760px){.sidx-tbl tr.has-shop th:nth-child(6),.sidx-tbl tr.has-shop td:nth-child(6){display:none}}' +
      '@media(max-width:560px){.sidx-tbl tr.has-shop td.shop{display:none}.sidx-tbl tr.has-shop td.act .tcgw{display:none}.sidx-tbl tr.has-shop td.act .sch-shop-m{display:flex;flex:1 0 100%;order:8;align-items:center;gap:6px;font:600 10px/1.4 var(--fm,ui-monospace,monospace);color:var(--text-dim,var(--dim,#5a7880))}.sidx-tbl tr.has-shop td.act .sch-shop-m .shc{margin-left:0}}' +
      /* card page block */
      '.cdp-shop{margin:0 0 12px;border:1px solid var(--border,var(--bd,#23303d));border-radius:3px;background:var(--p2,#0e151c);padding:10px 12px}' +
      '.cdp-shop .g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.cdp-shop .r .k{display:block;font:600 10px/1.2 var(--fd,inherit);letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim,var(--dim,#5a7880));margin-bottom:3px}' +
      '.cdp-shop .r b{display:block;font:700 18px/1.1 var(--fm,ui-monospace,monospace);color:var(--text-head,var(--th,#e4f0f4))}.cdp-shop .r b.shop{color:var(--green,var(--gn,#00e07a))}.cdp-shop .r b.ebay{color:var(--red,var(--rd,#ff2e55))}' +
      '.cdp-shop .r small{display:block;font-size:10px;color:var(--text-dim,var(--dim,#5a7880));margin-top:2px;line-height:1.4}' +
      '.cdp-shop .v{margin-top:8px;font:600 11px/1.5 var(--fb,inherit);color:var(--text,var(--tx,#b8cdd4))}.cdp-shop .v b{color:var(--text-head,var(--th,#e4f0f4))}' +
      '.cdp-shop .n{margin:8px 0 0;font-size:10px;line-height:1.5;color:var(--text-dim,var(--dim,#5a7880))}' +
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
        var td = document.createElement('td'); td.className = 'num shop';
        td.innerHTML = money(v.m) + chipHtml(v);
        tds[2].insertAdjacentElement('afterend', td);
        tr.classList.add('has-shop');
        var act = tr.querySelector('td.act .act-w');
        if (act) {
          var glk = act.querySelector('.glk');
          var l = document.createElement('span'); l.className = 'tcgw'; l.innerHTML = tcgLink(a, v, cid, 'tcgl', 'TCG');
          if (glk) glk.insertAdjacentElement('afterend', l); else act.appendChild(l);
          var m = document.createElement('span'); m.className = 'sch-shop-m'; m.innerHTML = tcgLink(a, v, cid, 'tcgs', 'shop ' + money(v.m) + ' ↗') + chipHtml(v);
          act.appendChild(m);
        }
        any = true;
      });
      if (!any) return;
      sec.querySelectorAll('.sidx-tbl thead tr').forEach(function (tr) {
        if (tr.querySelector('th.shop')) return;
        var th = document.createElement('th'); th.className = 'shop';
        th.title = 'TCGplayer market price (the "shop price" most card shops sell at), mirrored daily with about a 24-hour lag. Chip = shop vs the eBay sold mark: green, cheaper at the shop; red, cheaper on eBay. Shown beside the index, never used in it.';
        th.textContent = 'Shop (TCG)';
        tr.children[2].insertAdjacentElement('afterend', th);
        tr.classList.add('has-shop');
      });
      var S = f.summary;
      var lv = sec.querySelector('.sidx-level');
      if (lv && S && S.basketSold > 0 && S.spread != null && !lv.querySelector('.sh-line')) {
        var s = side(S.spread), d = document.createElement('div'); d.className = 'lvc sh-line';
        d.innerHTML = 'at shop price <b>' + money(S.basketShop, 0) + '</b> · <span class="' + (S.spread < 0 ? 'dn' : S.spread > 0 ? 'up' : 'flat') + '">' + (S.spread < 0 ? '▼' : S.spread > 0 ? '▲' : '') + ' ' + pct(S.spread).replace(/^[−+]/, '') + '</span> vs the same ' + S.weighted + ' cards at eBay sold' + (s === 'shop' ? ' · <b>cheaper at the shop</b>' : s === 'ebay' ? ' · <b>cheaper on eBay</b>' : s === 'wide' ? ' · <b>a condition gap, not a bargain</b> (shop = near-mint, eBay raw = any condition)' : ' · even') + ' <span class="shk" title="TCGplayer market price via the TCGCSV daily mirror, ~24h lag. Not part of the level.">· TCGplayer market, ' + md(f.asOf) + '</span>';
        lv.appendChild(d);
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
      var lb = document.querySelector('.levelbox');
      if (lb && S && S.basketSold > 0 && S.spread != null && !lb.querySelector('.sh-line')) {
        var s = side(S.spread), d = document.createElement('div'); d.className = 'levelchg sh-line';
        d.innerHTML = 'at shop price <b>' + money(S.basketShop, 0) + '</b> · <span style="color:' + (S.spread < 0 ? 'var(--gn,#00e07a)' : 'var(--rd,#ff2e55)') + '">' + (S.spread < 0 ? '▼' : '▲') + ' ' + pct(S.spread).replace(/^[−+]/, '') + '</span> vs the same ' + S.weighted + ' cards at our sold marks' + (s === 'shop' ? ' · <b>cheaper at the shop</b>' : s === 'ebay' ? ' · <b>cheaper on eBay</b>' : s === 'wide' ? ' · <b>a condition gap, not a bargain</b> (shop = near-mint, eBay raw = any condition)' : ' · even') + ' <span class="shk" title="TCGplayer market price via the TCGCSV daily mirror, ~24h lag. Not part of the level.">· TCGplayer market, ' + md(f.asOf) + '</span>';
        lb.appendChild(d);
      }
      track(tbl);
    });
  }

  /* ---------- /card?id=… (js/card-page.js fires sch:card-rendered) ---------- */
  function card(detail, a) {
    var d = detail.d, c = detail.c; if (!c || !c.id) return;
    var buy = document.querySelector('#cdp .cdp-buy'); if (!buy) return;
    marks(d.ticker || c.id.split('-')[0]).then(function (f) {
      var v = f && f.marks && f.marks[c.id]; if (!v) return;
      var s = side(v.d), raw = c.raw;
      var box = document.createElement('div'); box.className = 'cdp-shop';
      box.innerHTML =
        '<div class="g">' +
        '<div class="r"><span class="k">Shop price</span><b>' + money(v.m) + '</b><small>TCGplayer market · ' + md(f.asOf) + (v.lo ? ' · lowest listing ' + money(v.lo) : '') + '</small></div>' +
        '<div class="r"><span class="k">eBay sold mark</span><b>' + (raw != null ? money(raw) : '<span style="font-size:12px">not priced</span>') + '</b><small>' + (raw != null ? 'raw · ' + md(c.rawAsOf) + ' · the index number' : 'below the liquidity screen') + '</small></div>' +
        '<div class="r"><span class="k">Spread</span>' + (v.d == null ? '<b><span style="font-size:12px">—</span></b>' : s === 'wide' ? '<b><span style="font-size:12px">wide</span></b><small>thin market or a condition gap — read both</small>' : '<b class="' + (s === 'shop' || s === 'ebay' ? s : '') + '">' + pct(v.d) + '</b><small>' + (s === 'shop' ? 'cheaper at the shop' : s === 'ebay' ? 'cheaper on eBay' : 'within 3% — even') + '</small>') + '</div>' +
        '</div>' +
        (s === 'shop' ? '<div class="v">Today the shop is the place: TCGplayer’s market price is <b>' + pct(v.d).replace('−', '') + ' under</b> what this card has been selling for raw on eBay.</div>' : s === 'ebay' ? '<div class="v">Today eBay is the place: raw copies have been selling <b>' + pct(v.d).replace('+', '') + ' under</b> TCGplayer’s market price — use the Raw button below.</div>' : '') +
        '<p class="n">Shop price = TCGplayer’s market price (their recent sales of this printing, near-mint), mirrored daily with about a day’s lag. Shown beside the index, never used in it. ' + (d.wotc ? 'Vintage note: the shop price is a near-mint price; the eBay raw mark is a typical raw sale in any condition, so a wide gap here is condition, not a bargain.' : '') + '</p>';
      var btns = buy.querySelector('.cdp-btns');
      buy.insertBefore(box, btns || buy.firstChild);
      if (btns) {
        var cid = 'card-' + c.id;
        var btn = document.createElement('a'); btn.className = 'tcgbtn' + (s === 'shop' ? ' lo' : ''); btn.setAttribute('data-cid', cid); btn.setAttribute('data-shop', s === 'shop' ? 'cheaper' : s);
        btn.href = tcgUrl(a, v.pid, cid); btn.target = '_blank'; btn.rel = tcgRel(a);
        btn.innerHTML = 'Buy on TCGplayer<small>' + (s === 'shop' ? 'cheaper venue today · ' : '') + 'market ' + money(v.m) + (v.lo ? ' · from ' + money(v.lo) : '') + '</small>';
        if (s === 'shop') btns.insertBefore(btn, btns.firstChild); else btns.appendChild(btn);
        // the eBay buttons are re-rendered on a Buy It Now / Auctions switch — keep the TCG button through it
        new MutationObserver(function () { if (!btns.contains(btn)) { if (s === 'shop') btns.insertBefore(btn, btns.firstChild); else btns.appendChild(btn); } }).observe(btns, { childList: true });
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
