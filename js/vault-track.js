/* ============================================================================
   ShopCardHub — vault-track.js
   Per-card "Track this card" → writes directly into the Vault (localStorage).

   THIS FILE OWNS THE PAGE-SIDE WRITE CONTRACT for the Vault store. Do not
   hand-roll vault writes on pages — add markup and include this script.

   Storage contract (must stay in sync with watchlist.html):
     key   : 'sch_vault_v1'
     shape : { demo: bool, cards: [{ id, status:'watch'|'own', cat, name, set,
               grade, target, notes?, prices:[{t,p,src}], ... }] }
     rules : dedupe on lowercase name; real user data beats demo;
             NEVER write over a store that fails to parse (fail open to the
             legacy /watchlist?card= deep-link instead).

   Page markup:
     <button class="sch-track-card"
             data-name="Mega Darkrai ex SIR #116/084"
             data-set="Pitch Black"
             data-cat="pokemon"            (baseball|basketball|football|pokemon|other)
             data-grade="Raw"              (optional, default Raw)
             data-price="455">★ Track</button>  (optional seed price, number)

   The script injects its own CSS + snackbar, binds by event delegation,
   marks already-tracked cards on load, and fires GA event
   'track_card_from_page' — the aggregate demand signal for recommendations.
   ========================================================================== */
(function () {
  'use strict';
  var LS_KEY = 'sch_vault_v1';
  var VAULT_URL = '/watchlist';
  var CATS = { baseball: 1, basketball: 1, football: 1, pokemon: 1, other: 1 };

  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function ga(name, params) { if (typeof gtag === 'function') gtag('event', name, params || {}); }

  /* ---- store access: parse errors fail OPEN (deep-link), never destructive */
  function readStore() {
    var raw;
    try { raw = localStorage.getItem(LS_KEY); } catch (e) { return { err: true }; }
    if (!raw) return { state: null };
    try {
      var s = JSON.parse(raw);
      if (!s || !Array.isArray(s.cards)) return { err: true };
      return { state: s };
    } catch (e) { return { err: true }; }
  }
  function writeStore(state) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  /* ---- public: track a card. Returns 'added' | 'exists' | 'fallback' ---- */
  function track(spec) {
    var name = String(spec.name || '').trim();
    if (!name) return 'fallback';
    var st = readStore();
    if (st.err) { fallback(name); return 'fallback'; }

    var state = st.state;
    if (!state || state.demo) state = { demo: false, cards: [] };  // real data beats demo

    var key = name.toLowerCase();
    for (var i = 0; i < state.cards.length; i++) {
      if ((state.cards[i].name || '').toLowerCase() === key) return 'exists';
    }

    var price = parseFloat(spec.price);
    var card = {
      id: uid(),
      status: 'watch',
      cat: CATS[spec.cat] ? spec.cat : 'other',
      name: name,
      set: String(spec.set || '').trim(),
      grade: String(spec.grade || 'Raw').trim(),
      target: null,
      notes: 'Tracked from ' + (spec.page || location.pathname),
      prices: (isFinite(price) && price > 0) ? [{ t: Date.now(), p: price, src: 'page' }] : []
    };
    state.cards.push(card);
    if (!writeStore(state)) { fallback(name); return 'fallback'; }

    ga('track_card_from_page', { card_name: name.slice(0, 90), page: location.pathname, cat: card.cat });
    return 'added';
  }

  function fallback(name) {
    location.href = VAULT_URL + '?card=' + encodeURIComponent(name);
  }

  function trackedNames() {
    var st = readStore();
    if (st.err || !st.state || st.state.demo) return {};
    var out = {};
    st.state.cards.forEach(function (c) { out[(c.name || '').toLowerCase()] = 1; });
    return out;
  }

  /* ---- UI: css, snackbar, button states ---- */
  var css = '.sch-track-card{display:inline-flex;align-items:center;gap:5px;background:transparent;' +
    'border:1px solid rgba(0,204,245,0.35);color:#00ccf5;font-family:"JetBrains Mono",monospace;' +
    'font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 9px;' +
    'border-radius:2px;cursor:pointer;transition:background .15s,color .15s;margin-top:6px;}' +
    '.sch-track-card:hover{background:#00ccf5;color:#000;}' +
    '.sch-track-card.sch-tracked{border-color:rgba(0,224,122,0.5);color:#00e07a;cursor:default;}' +
    '.sch-track-card.sch-tracked:hover{background:transparent;color:#00e07a;}' +
    '#sch-track-snack{position:fixed;left:50%;bottom:70px;transform:translateX(-50%) translateY(20px);' +
    'background:#0c1017;border:1px solid #00e07a;color:#e4f0f4;font-family:"JetBrains Mono",monospace;' +
    'font-size:12px;padding:12px 18px;border-radius:2px;z-index:400;opacity:0;pointer-events:none;' +
    'transition:opacity .25s,transform .25s;box-shadow:0 8px 30px rgba(0,0,0,0.5);}' +
    '#sch-track-snack.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto;}' +
    '#sch-track-snack a{color:#00ccf5;text-decoration:none;font-weight:700;margin-left:10px;}';

  var snackTimer = null;
  function snack(html) {
    var el = document.getElementById('sch-track-snack');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sch-track-snack';
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    requestAnimationFrame(function () { el.classList.add('show'); });
    clearTimeout(snackTimer);
    snackTimer = setTimeout(function () { el.classList.remove('show'); }, 5000);
  }

  function markButton(btn, tracked) {
    if (tracked) {
      btn.classList.add('sch-tracked');
      btn.innerHTML = '&#10003; In your Vault';
      btn.setAttribute('aria-label', 'Already in your vault');
    }
  }

  function init() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var have = trackedNames();
    var btns = document.querySelectorAll('.sch-track-card');
    btns.forEach(function (b) {
      if (have[(b.dataset.name || '').toLowerCase()]) markButton(b, true);
    });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.sch-track-card');
      if (!btn || btn.classList.contains('sch-tracked')) return;
      e.preventDefault();
      var res = track({
        name: btn.dataset.name,
        set: btn.dataset.set,
        cat: btn.dataset.cat,
        grade: btn.dataset.grade,
        price: btn.dataset.price,
        page: location.pathname
      });
      if (res === 'added') {
        markButton(btn, true);
        snack('&#9733; Added to your Vault <a href="' + VAULT_URL + '">Open Vault &rarr;</a>');
      } else if (res === 'exists') {
        markButton(btn, true);
        snack('Already in your Vault <a href="' + VAULT_URL + '">Open Vault &rarr;</a>');
      }
      /* 'fallback' already navigated */
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SCHVault = { track: track, version: 1 };
})();
