/* ============================================================================
   ShopCardHub — vault-track.js  (v2)
   Per-card "Track this card" → writes directly into the Vault (localStorage).

   THIS FILE OWNS THE PAGE-SIDE WRITE CONTRACT for the Vault store. Do not
   hand-roll vault writes on pages — add markup and include this script.

   Storage contract (must stay in sync with watchlist.html):
     key   : 'sch_vault_v1'
     shape : { demo: bool, cards: [{ id, status:'watch'|'own', cat, name, set,
               grade, target, cost?, qty?, buyDate?, feedKey?, notes?,
               prices:[{t,p,src}], ... }] }
     rules : dedupe on lowercase name; real user data beats demo;
             NEVER write over a store that fails to parse (fail open to the
             legacy /watchlist?card= deep-link instead).

   Page markup:
     <button class="sch-track-card"
             data-name="Mega Darkrai ex SIR #116/084"
             data-set="Pitch Black"
             data-cat="pokemon"            (baseball|basketball|football|pokemon|other)
             data-grade="Raw"              (optional, default Raw)
             data-price="455"              (optional seed price, number)
             data-feed="ebay:ethan-holliday">★ Track</button>
                                           (optional price-engine key — auto-links
                                            the card so nightly engine prices flow in)

   v2: clicking ★ Track opens a chooser — HUNTING (status:'watch') or
   I OWN IT (status:'own', optional inline "what you paid" → cost, qty 1,
   buyDate today). data-price seeds the first price point (src:'page');
   data-feed sets card.feedKey so watchlist feedSync appends engine points
   nightly. GA event 'track_card_from_page' now carries vault_status.
   ========================================================================== */
(function () {
  'use strict';
  var LS_KEY = 'sch_vault_v1';
  var VAULT_URL = '/watchlist';
  var CATS = { baseball: 1, basketball: 1, football: 1, pokemon: 1, other: 1 };

  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function ga(name, params) { if (typeof gtag === 'function') gtag('event', name, params || {}); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

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

  /* ---- public: track a card. Returns 'added' | 'exists' | 'fallback' ----
     spec: { name, set, cat, grade, price, feed, page, status:'watch'|'own', cost } */
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

    var status = spec.status === 'own' ? 'own' : 'watch';
    var price = parseFloat(spec.price);
    var cost = parseFloat(spec.cost);
    var card = {
      id: uid(),
      status: status,
      cat: CATS[spec.cat] ? spec.cat : 'other',
      name: name,
      set: String(spec.set || '').trim(),
      grade: String(spec.grade || 'Raw').trim(),
      target: null,
      notes: 'Tracked from ' + (spec.page || location.pathname),
      prices: (isFinite(price) && price > 0) ? [{ t: Date.now(), p: price, src: 'page' }] : []
    };
    if (status === 'own') {
      card.cost = (isFinite(cost) && cost > 0) ? cost : null;
      card.qty = 1;
      card.buyDate = todayISO();
    }
    var feed = String(spec.feed || '').trim();
    if (feed) card.feedKey = feed;   // watchlist feedSync appends engine prices nightly

    state.cards.push(card);
    if (!writeStore(state)) { fallback(name); return 'fallback'; }

    ga('track_card_from_page', {
      card_name: name.slice(0, 90), page: location.pathname,
      cat: card.cat, vault_status: status
    });
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

  /* ---- UI: css, snackbar, chooser popover, button states ---- */
  var css = '.sch-track-card{display:inline-flex;align-items:center;gap:5px;background:transparent;' +
    'border:1px solid rgba(0,204,245,0.35);color:#00ccf5;font-family:"JetBrains Mono",monospace;' +
    'font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 9px;' +
    'border-radius:2px;cursor:pointer;transition:background .15s,color .15s;margin-top:6px;}' +
    '.sch-track-card:hover{background:#00ccf5;color:#000;}' +
    '.sch-track-card.sch-tracked{border-color:rgba(0,224,122,0.5);color:#00e07a;cursor:default;}' +
    '.sch-track-card.sch-tracked:hover{background:transparent;color:#00e07a;}' +
    '.sch-track-card.sch-owned{border-color:rgba(245,200,0,0.55);color:#f5c800;cursor:default;}' +
    '.sch-track-card.sch-owned:hover{background:transparent;color:#f5c800;}' +
    '#sch-track-pop{position:absolute;z-index:410;background:#0c1017;border:1px solid rgba(0,204,245,0.4);' +
    'border-radius:2px;padding:12px;min-width:230px;box-shadow:0 10px 34px rgba(0,0,0,0.6);' +
    'font-family:"JetBrains Mono",monospace;}' +
    '#sch-track-pop .sch-pop-name{font-size:10px;color:#5a7880;letter-spacing:0.5px;margin-bottom:10px;' +
    'max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#sch-track-pop .sch-pop-row{display:flex;gap:8px;}' +
    '#sch-track-pop button{flex:1;background:transparent;border:1px solid rgba(0,204,245,0.4);color:#00ccf5;' +
    'font-family:inherit;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;' +
    'padding:8px 10px;border-radius:2px;cursor:pointer;transition:background .15s,color .15s;}' +
    '#sch-track-pop button:hover{background:#00ccf5;color:#000;}' +
    '#sch-track-pop button.sch-own-btn{border-color:rgba(245,200,0,0.5);color:#f5c800;}' +
    '#sch-track-pop button.sch-own-btn:hover{background:#f5c800;color:#000;}' +
    '#sch-track-pop .sch-pop-cost{margin-top:10px;}' +
    '#sch-track-pop .sch-pop-cost label{display:block;font-size:9px;color:#5a7880;letter-spacing:1px;' +
    'text-transform:uppercase;margin-bottom:6px;}' +
    '#sch-track-pop input{width:100%;box-sizing:border-box;background:#111820;border:1px solid rgba(255,255,255,0.12);' +
    'border-radius:2px;color:#e4f0f4;font-family:inherit;font-size:12px;padding:8px 10px;margin-bottom:8px;}' +
    '#sch-track-pop input:focus{outline:none;border-color:#f5c800;}' +
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

  function markButton(btn, status) {
    if (status === 'own') {
      btn.classList.add('sch-tracked', 'sch-owned');
      btn.innerHTML = '&#9733; In My Cards';
      btn.setAttribute('aria-label', 'In your vault — My Cards');
    } else {
      btn.classList.add('sch-tracked');
      btn.innerHTML = '&#10003; Hunting';
      btn.setAttribute('aria-label', 'In your vault — Hunting list');
    }
  }

  /* ---- chooser popover (one at a time, anchored to the clicked button) ---- */
  var pop = null, popBtn = null;
  function closePop() {
    if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
    pop = null; popBtn = null;
  }
  function specFrom(btn) {
    return {
      name: btn.dataset.name, set: btn.dataset.set, cat: btn.dataset.cat,
      grade: btn.dataset.grade, price: btn.dataset.price, feed: btn.dataset.feed,
      page: location.pathname
    };
  }
  function commit(btn, status, cost) {
    var spec = specFrom(btn);
    spec.status = status; spec.cost = cost;
    var res = track(spec);
    closePop();
    if (res === 'added') {
      markButton(btn, status);
      snack(status === 'own'
        ? '&#9733; Added to My Cards <a href="' + VAULT_URL + '">Open Vault &rarr;</a>'
        : '&#127919; Added to your Hunting list <a href="' + VAULT_URL + '">Open Vault &rarr;</a>');
    } else if (res === 'exists') {
      markButton(btn, status === 'own' ? 'own' : 'watch');
      snack('Already in your Vault <a href="' + VAULT_URL + '">Open Vault &rarr;</a>');
    }
  }
  function openPop(btn) {
    closePop();
    popBtn = btn;
    pop = document.createElement('div');
    pop.id = 'sch-track-pop';
    pop.innerHTML =
      '<div class="sch-pop-name">' + (btn.dataset.name || '').replace(/</g, '&lt;') + '</div>' +
      '<div class="sch-pop-row">' +
        '<button type="button" class="sch-hunt-btn">&#127919; Hunting</button>' +
        '<button type="button" class="sch-own-btn">&#10003; I Own It</button>' +
      '</div>' +
      '<div class="sch-pop-cost" style="display:none;">' +
        '<label>What did you pay? (optional)</label>' +
        '<input type="number" min="0" step="0.01" placeholder="$" inputmode="decimal">' +
        '<div class="sch-pop-row">' +
          '<button type="button" class="sch-own-add sch-own-btn">Add to My Cards</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect();
    var top = r.bottom + window.scrollY + 6;
    var left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8));
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';

    pop.querySelector('.sch-hunt-btn').addEventListener('click', function () { commit(btn, 'watch'); });
    pop.querySelector('.sch-own-btn').addEventListener('click', function (e) {
      if (e.target.classList.contains('sch-own-add')) return;
      pop.querySelector('.sch-pop-row').style.display = 'none';
      var costBox = pop.querySelector('.sch-pop-cost');
      costBox.style.display = 'block';
      var inp = costBox.querySelector('input');
      inp.focus();
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') commit(btn, 'own', inp.value);
        if (ev.key === 'Escape') closePop();
      });
    });
    pop.querySelector('.sch-own-add').addEventListener('click', function () {
      commit(btn, 'own', pop.querySelector('.sch-pop-cost input').value);
    });
  }

  function init() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var have = trackedNames();
    var btns = document.querySelectorAll('.sch-track-card');
    btns.forEach(function (b) {
      if (have[(b.dataset.name || '').toLowerCase()]) markButton(b, 'watch');
    });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.sch-track-card');
      if (btn && !btn.classList.contains('sch-tracked')) {
        e.preventDefault();
        if (popBtn === btn) { closePop(); return; }   // toggle
        openPop(btn);
        return;
      }
      if (pop && !pop.contains(e.target)) closePop();   // click-away
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SCHVault = { track: track, version: 2 };
})();
