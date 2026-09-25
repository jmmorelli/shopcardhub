/* home-you.js — the returning visitor's panel on the home page (Sep 25 2026, return-user program: the reason to come
 * back is visible on the page you came back to). Two things a return visitor wants in one glance:
 *   1. what the indices did since they were last here — level then vs level now, straight from /data/indices.json
 *      history rows (the same file the board reads; nothing is invented, a date with no earlier row shows nothing);
 *   2. what their watchlist did — every ★ card's move from the first price logged when they starred it to the latest
 *      price the watchlist has logged (localStorage sch_vault_v1, written only by js/vault-track.js and the watchlist).
 * "Last here" is a timestamp this file keeps in localStorage (sch_home_seen). First visit: nothing renders. Nothing here
 * is a call; the panel is a diff. */
(function () {
  'use strict';
  var SEEN = 'sch_home_seen', LS = 'sch_vault_v1';
  var host = document.getElementById('set-indices'); if (!host) return;
  var store = null, seen = null;
  try { store = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { store = null; }
  try { seen = parseInt(localStorage.getItem(SEEN) || '', 10) || null; } catch (e) { seen = null; }
  var cards = (store && store.cards) || [];
  var stamp = function () { try { localStorage.setItem(SEEN, String(Date.now())); } catch (e) {} };
  if (!seen && !cards.length) { stamp(); return; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
  var iso = function (ms) { return new Date(ms).toISOString().slice(0, 10); };
  var dstr = function (d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return MON[+p[1] - 1] + ' ' + (+p[2]); };
  var pct = function (v, d) { return (v > 0 ? '+' : '') + v.toFixed(d == null ? 1 : d) + '%'; };
  var cls = function (v) { return v > 0.05 ? 'up' : v < -0.05 ? 'dn' : 'flat'; };
  var seenDay = seen ? iso(seen) : null;
  var today = iso(Date.now());
  if (seenDay === today) seenDay = null;   // same-day return: the indices have not re-marked; show the watchlist only

  /* --- the watchlist side: first logged price → latest logged price, per ★ card --- */
  var mine = [];
  cards.forEach(function (c) {
    if (!c || !c.name) return;
    var ps = (c.prices || []).filter(function (p) { return p && isFinite(p.p) && p.p > 0 && p.t; }).sort(function (a, b) { return a.t - b.t; });
    if (ps.length < 2) { mine.push({ name: c.name, move: null, since: ps[0] ? ps[0].t : null }); return; }
    mine.push({ name: c.name, move: (ps[ps.length - 1].p / ps[0].p - 1) * 100, since: ps[0].t, last: ps[ps.length - 1].p });
  });
  var moved = mine.filter(function (m) { return m.move != null; }).sort(function (a, b) { return Math.abs(b.move) - Math.abs(a.move); });

  function render(idx) {
    var chips = [];
    if (seenDay && idx) {
      for (var k in idx) {
        var v = idx[k]; if (!v || typeof v !== 'object' || !Array.isArray(v.history) || v.history.length < 2) continue;
        if (v.status === 'pre' || v.status === 'pre-activation') continue;
        var h = v.history.filter(function (r) { return r && r.level != null && isFinite(r.level) && r.date; });
        var then = null, now = h[h.length - 1];
        for (var i = h.length - 1; i >= 0; i--) { if (h[i].date <= seenDay) { then = h[i]; break; } }
        if (!then || !now || then.date === now.date) continue;   // no mark since they were here → nothing to say
        chips.push({ k: k, href: v.page || '/indices', move: (now.level / then.level - 1) * 100, level: now.level });
      }
      chips.sort(function (a, b) { return Math.abs(b.move) - Math.abs(a.move); });
    }
    if (!chips.length && !mine.length) { stamp(); return; }
    var head = seenDay ? 'Since you were here · ' + dstr(seenDay) : 'Your watchlist';
    var html = '<div class="panel-h"><h2>' + esc(head) + '</h2><span class="sub">' + (cards.length ? '<a href="/watchlist">' + cards.length + ' card' + (cards.length === 1 ? '' : 's') + ' on your watchlist »</a>' : 'index moves since your last visit') + '</span></div>';
    if (chips.length) {
      html += '<div class="yh-row"><span class="yh-k">Indices</span>' + chips.slice(0, 9).map(function (c) {
        return '<a class="yh-c" href="' + esc(c.href) + '"><b>' + esc(c.k) + '</b><i class="' + cls(c.move) + '">' + esc(pct(c.move, 2)) + '</i><small>' + c.level.toFixed(2) + '</small></a>';
      }).join('') + '</div>';
    } else if (seenDay) {
      html += '<div class="yh-row yh-note">No index has re-marked since ' + esc(dstr(seenDay)) + ' — the next Monday mark is the next thing that moves.</div>';
    }
    if (mine.length) {
      var items = moved.slice(0, 6).map(function (m) {
        var short = String(m.name).split(' — ')[0].replace(/\s+/g, ' ').trim();
        return '<a class="yh-c" href="/watchlist"><b>' + esc(short) + '</b><i class="' + cls(m.move) + '">' + esc(pct(m.move)) + '</i>' + (m.since ? '<small>since ' + esc(dstr(iso(m.since))) + '</small>' : '') + '</a>';
      }).join('');
      var quiet = mine.length - moved.length;
      html += '<div class="yh-row"><span class="yh-k">Your cards</span>' + (items || '') +
        (quiet ? '<span class="yh-more">' + quiet + ' card' + (quiet === 1 ? '' : 's') + ' with one price so far — the move shows after the next re-mark</span>' : '') +
        (moved.length > 6 ? '<span class="yh-more">+' + (moved.length - 6) + ' more</span>' : '') + '</div>';
    }
    var css = document.createElement('style');
    css.textContent = '.you-home{border-left:3px solid var(--gd,#f5c800)}.you-home .yh-row{display:flex;align-items:center;gap:8px 10px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid var(--bd,rgba(255,255,255,.08));font-family:var(--fm,ui-monospace,monospace);font-size:11.5px}' +
      '.you-home .yh-k{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim,#7a969e);min-width:72px}' +
      '.you-home .yh-c{display:inline-flex;align-items:baseline;gap:7px;background:var(--p2,#111820);border:1px solid var(--bd,rgba(255,255,255,.1));border-radius:2px;padding:4px 9px;text-decoration:none;color:var(--tx,#b8cdd4);white-space:nowrap}.you-home .yh-c:hover{border-color:var(--gd,#f5c800)}.you-home .yh-c b{color:var(--th,#e4f0f4);font-weight:600}.you-home .yh-c i{font-style:normal;font-weight:700}.you-home .yh-c i.up{color:var(--gn,#00e07a)}.you-home .yh-c i.dn{color:var(--rd,#ff2e55)}.you-home .yh-c i.flat{color:var(--dim,#7a969e)}.you-home .yh-c small{color:var(--dim,#7a969e);font-size:10px}' +
      '.you-home .yh-more,.you-home .yh-note{color:var(--dim,#7a969e)}' +
      '@media(max-width:640px){.you-home .yh-row{padding:9px 10px;gap:6px 8px}.you-home .yh-c{white-space:normal}.you-home .yh-k{min-width:0;flex:1 1 100%}}';
    document.head.appendChild(css);
    var el = document.createElement('div');
    el.className = 'panel you-home'; el.id = 'you-home';
    el.innerHTML = html;
    host.parentNode.insertBefore(el, host.nextSibling);
    stamp();
    if (window.gtag) gtag('event', 'home_you', { indices: chips.length, cards: mine.length, moved: moved.length });
  }
  if (seenDay) {
    fetch('/data/indices.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(render).catch(function () { render(null); });
  } else render(null);
})();
