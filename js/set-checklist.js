/* set-checklist.js — renders a published set checklist from /data/sets/<slug>.json into any
   <div data-checklist="/data/sets/<slug>.json"></div>, with a ★ Track button on every row.
   Track buttons use the sitewide .sch-track-card contract (js/vault-track.js) — name/set/cat/grade
   data attributes — so a click lands the card in the reader's Vault exactly like a card page.
   Built Aug 21, 2026 for 2026 Bowman Chrome; reusable for any set with a JSON file. */
(function () {
  'use strict';
  var CSS = '.schk{margin:8px 0 0}.schk-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px}' +
    '.schk-bar input{flex:1 1 220px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);font-family:var(--fm);font-size:13px;padding:9px 12px;border-radius:2px}' +
    '.schk-bar input:focus{outline:none;border-color:var(--accent)}' +
    '.schk-tabs{display:inline-flex;border:1px solid var(--border2);border-radius:2px;overflow:hidden}' +
    '.schk-tabs button{background:none;border:none;color:var(--text-dim);font-family:var(--fm);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:9px 12px;cursor:pointer}' +
    '.schk-tabs button.on{background:var(--accent);color:#000}' +
    '.schk-meta{font-family:var(--fm);font-size:11px;color:var(--text-dim);line-height:1.6;margin:0 0 10px}' +
    '.schk-wrap{overflow-x:auto;border:1px solid var(--border2);background:var(--bg2);max-height:640px;overflow-y:auto}' +
    '.schk table{width:100%;border-collapse:collapse;font-family:var(--fm);font-size:12.5px;white-space:nowrap}' +
    '.schk th{position:sticky;top:0;background:var(--bg3);color:var(--text-dim);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;text-align:left;padding:9px 10px;border-bottom:1px solid var(--border2);z-index:1}' +
    '.schk td{padding:0 10px;height:36px;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--text)}' +
    '.schk td.n{color:var(--accent);font-weight:700;width:90px}.schk td.p{font-family:var(--fb);font-weight:600;color:var(--text-head);font-size:13.5px}' +
    '.schk td.t{color:var(--text-dim)}.schk td.a{text-align:right;width:110px}' +
    '.schk tr.board td.p::after{content:"BANGERS";font-family:var(--fm);font-size:9px;letter-spacing:1.5px;color:var(--gold,#f5c800);border:1px solid rgba(245,200,0,.4);padding:1px 5px;margin-left:8px;vertical-align:middle}' +
    '.schk .first{font-size:9px;letter-spacing:1.5px;color:var(--green,#00e07a);border:1px solid rgba(0,224,122,.4);padding:1px 5px;margin-left:8px;vertical-align:middle}' +
    '.schk tbody tr:hover{background:rgba(0,204,245,.05)}' +
    '.schk .sch-track-card{font-family:var(--fm);font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:none;border:1px solid var(--border2);color:var(--text);padding:5px 10px;border-radius:2px;cursor:pointer}' +
    '.schk .sch-track-card:hover{border-color:var(--accent);color:var(--text-head)}' +
    '.schk-foot{font-family:var(--fm);font-size:11px;color:var(--text-dim);padding:8px 2px}' +
    '@media(max-width:640px){.schk td{height:40px}.schk tr.board td.p::after{display:block;margin:2px 0 0;width:max-content}}';

  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (m) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]; }); }
  function nk(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function render(host, data) {
    var groups = data.groups || [], gi = 0, q = '';
    host.innerHTML =
      '<div class="schk-bar"><input type="search" placeholder="Search player or team…" aria-label="Search the checklist">' +
      '<div class="schk-tabs">' + groups.map(function (g, i) { return '<button data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(g.title) + ' · ' + (g.cards || []).length + '</button>'; }).join('') + '</div></div>' +
      '<div class="schk-meta">' + (data.note ? esc(data.note) + ' ' : '') + 'Checklist as published ' + esc(data.asof) + ' · ' + esc(data.source) + '. Tap <b>★ Track</b> to put a card in your free Vault — it lands as Hunting with the set name filled in.</div>' +
      '<div class="schk-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Team</th><th></th></tr></thead><tbody></tbody></table></div>' +
      '<div class="schk-foot"></div>';
    var input = host.querySelector('input'), tbody = host.querySelector('tbody'), foot = host.querySelector('.schk-foot');
    function draw() {
      var g = groups[gi], cards = (g.cards || []).filter(function (c) { return !q || nk(c.player + ' ' + c.team + ' ' + c.n).indexOf(q) > -1; });
      tbody.innerHTML = cards.map(function (c) {
        var name = c.player + ' ' + data.set.replace(/ Baseball$/, '') + ' ' + (g.kind || '') + ' #' + c.n;
        return '<tr' + (c.board ? ' class="board"' : '') + '>' +
          '<td class="n">' + esc(c.n) + '</td>' +
          '<td class="p">' + esc(c.player) + (c.first ? '<span class="first">1ST BOWMAN</span>' : '') + '</td>' +
          '<td class="t">' + esc(c.team) + '</td>' +
          '<td class="a"><button class="sch-track-card" data-name="' + esc(name) + '" data-set="' + esc(data.set) + '" data-cat="' + esc(data.cat || 'baseball') + '" data-grade="Raw">&#9733; Track</button></td></tr>';
      }).join('') || '<tr><td colspan="4" style="color:var(--text-dim)">No matches.</td></tr>';
      foot.textContent = cards.length + ' of ' + (g.cards || []).length + ' · ' + g.title + (g.prefix ? ' (' + g.prefix + '-)' : '');
      // cards the reader already tracks get the ✓ state from vault-track.js
      if (window.SCHVault && window.SCHVault.mark) window.SCHVault.mark(host);
    }
    input.addEventListener('input', function () { q = nk(input.value.trim()); draw(); });
    host.querySelectorAll('.schk-tabs button').forEach(function (b) {
      b.addEventListener('click', function () { gi = +b.dataset.i; host.querySelectorAll('.schk-tabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); if (typeof gtag === 'function') gtag('event', 'checklist_tab', { set: data.slug, tab: groups[gi].key }); });
    });
    draw();
  }

  function init() {
    var hosts = document.querySelectorAll('[data-checklist]');
    if (!hosts.length) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    hosts.forEach(function (host) {
      host.classList.add('schk');
      host.innerHTML = '<div class="schk-meta">Loading the checklist…</div>';
      fetch(host.getAttribute('data-checklist'), { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (d) { render(host, d); })
        .catch(function () { host.innerHTML = '<div class="schk-meta">Checklist failed to load — <a href="' + esc(host.getAttribute('data-checklist')) + '">raw data</a>.</div>'; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
