/* index-you.js — "your cards on this index" (Sep 25 2026, return-user program: the reason to come back is visible
 * on the page you came back to). Reads the Watchlist mirror (localStorage sch_vault_v1, written only by
 * js/vault-track.js and the watchlist page — this file never writes), matches the cards a visitor has starred
 * against the cards this page prices, and prints one strip above the holdings table: how many you watch here,
 * and each one's move since the day you starred it (first logged price → today's mark on this page).
 * Candidates come from window.CARDS (tname + px on the six Pokémon index pages) or from the page's
 * .sch-track-card buttons (data-name + data-price, the sector-index block). Nothing here is a call. */
(function () {
  'use strict';
  var store = null; try { store = JSON.parse(localStorage.getItem('sch_vault_v1') || 'null'); } catch (e) { store = null; }
  var mine = (store && store.cards) || []; if (!mine.length) return;
  var byName = {}; mine.forEach(function (c) { if (c && c.name) byName[String(c.name).toLowerCase()] = c; });
  var cands = [];
  if (Array.isArray(window.CARDS)) window.CARDS.forEach(function (c) { if (c && c.tname) cands.push({ name: c.tname, px: parseFloat(c.px), short: (c.nm || c.tname) + ' ' + (c.num || '') }); });
  else Array.prototype.forEach.call(document.querySelectorAll('.sch-track-card[data-name]'), function (b) { if (b.dataset.name) cands.push({ name: b.dataset.name, px: parseFloat(b.dataset.price), short: b.dataset.name.split(' — ')[0], btn: b }); });
  if (!cands.length) return;
  var hits = [];
  cands.forEach(function (c) {
    var m = byName[String(c.name).toLowerCase()]; if (!m) return;
    var p0 = (m.prices || []).filter(function (p) { return p && isFinite(p.p) && p.p > 0; }).sort(function (a, b) { return a.t - b.t; })[0];
    var since = p0 && isFinite(c.px) && c.px > 0 ? (c.px / p0.p - 1) * 100 : null;
    var when = p0 ? new Date(p0.t) : null;
    hits.push({ short: c.short.replace(/\s+/g, ' ').trim(), since: since, when: when, status: m.status, btn: c.btn });
    if (c.btn) { c.btn.classList.add('is-watched'); c.btn.title = 'On your watchlist'; }
  });
  if (!hits.length) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var pct = function (v) { return v == null ? 'no move yet' : (v > 0 ? '+' : '') + v.toFixed(1) + '%'; };
  var cls = function (v) { return v > 0 ? 'up' : v < 0 ? 'dn' : 'flat'; };
  var items = hits.slice(0, 6).map(function (h) {
    return '<span class="you-c"><b>' + esc(h.short) + '</b> <i class="' + cls(h.since || 0) + '">' + esc(pct(h.since)) + '</i>' + (h.when ? '<small>since ' + MON[h.when.getMonth()] + ' ' + h.when.getDate() + (h.status === 'own' ? ' · owned' : '') + '</small>' : '') + '</span>';
  }).join('');
  var el = document.createElement('div');
  el.className = 'you-strip';
  el.innerHTML = '<span class="you-k">★ You watch ' + hits.length + ' card' + (hits.length === 1 ? '' : 's') + ' on this index</span>' + items + (hits.length > 6 ? '<span class="you-more">+' + (hits.length - 6) + ' more</span>' : '') + '<a class="you-go" href="/watchlist">Open watchlist →</a>';
  var css = document.createElement('style');
  css.textContent = '.you-strip{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;margin:12px 0;padding:10px 14px;border:1px solid var(--bd,var(--border,rgba(255,255,255,.1)));border-left:3px solid var(--gd,#f5c800);background:var(--p1,var(--bg2,#0c1017));font-family:var(--fm,ui-monospace,monospace);font-size:11.5px;color:var(--tx,var(--text,#b8cdd4))}' +
    '.you-k{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--gd,#f5c800);font-weight:700}' +
    '.you-c{background:var(--p2,var(--bg3,#111820));border:1px solid var(--bd,var(--border,rgba(255,255,255,.1)));border-radius:2px;padding:4px 9px;white-space:nowrap}.you-c b{color:var(--th,var(--text-head,#e4f0f4));font-weight:600}.you-c i{font-style:normal;margin-left:6px}.you-c i.up{color:var(--gn,var(--green,#00e07a))}.you-c i.dn{color:var(--rd,var(--red,#ff2e55))}.you-c i.flat{color:var(--dim,var(--text-dim,#7a969e))}.you-c small{color:var(--dim,var(--text-dim,#7a969e));margin-left:6px;font-size:10px}' +
    '.you-more{color:var(--dim,var(--text-dim,#7a969e))}.you-go{margin-left:auto;color:var(--gd,#f5c800);text-decoration:none;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700}' +
    '.sch-track-card.is-watched{background:var(--gd,#f5c800)!important;color:#000!important;border-color:var(--gd,#f5c800)!important}' +
    '@media(max-width:640px){.you-strip{gap:6px 8px;padding:9px 10px}.you-c{white-space:normal;flex:1 1 100%;font-size:11px}.you-go{margin-left:0}}';
  document.head.appendChild(css);
  var anchor = document.querySelector('.sidx .sidx-tbl') || (document.querySelector('tr.hrow') && document.querySelector('tr.hrow').closest('table'));
  if (!anchor) return;
  // climb out of any horizontal-scroll wrapper (.tbl-scroll / .tbl-wrap) so the strip can wrap on a phone
  var host = anchor;
  while (host.parentElement && /(^|\s)(tbl-scroll|tbl-wrap)(\s|$)/.test(host.parentElement.className || '')) host = host.parentElement;
  host.parentNode.insertBefore(el, host);
  if (window.gtag) gtag('event', 'you_strip', { n: hits.length, page: location.pathname });
})();
