/* ============================================================================
   ShopCardHub — vault-track.js  (v3 · Terminal step 3, Sep 11 2026)
   Per-card "Track this card" → writes directly into the Vault (localStorage).

   THIS FILE OWNS THE PAGE-SIDE WRITE CONTRACT for the Vault store. Do not
   hand-roll vault writes on pages — add markup and include this script.

   Storage contract (must stay in sync with watchlist.html and js/vault-schema.js):
     key   : 'sch_vault_v1'   (the SLIM MIRROR — the Vault page keeps the full copy in
                               IndexedDB sch_vault/kv/state and merges mirror-only cards
                               and lists on every load)
     shape : { demo: bool, slim?: bool,
               lists: [{ id, name, createdAt }],           ← v2: portfolios; the fixed
                                                             default is {id:'default', name:'My cards'}
               cards: [{ id, status:'watch'|'own', listId?, cat, name, set,
                         grade, target, cost?, qty?, buyDate?, feedKey?, notes?,
                         prices:[{t,p,src}], ... }] }
             own cards carry listId (missing → 'default'); watch cards never do.
     rules : dedupe on lowercase name; real user data beats demo;
             NEVER write over a store that fails to parse (fail open to the
             legacy /watchlist?card= deep-link instead); this file only ever
             APPENDS a card or a list — it never edits, moves or deletes.
             Schema helpers come from /js/vault-schema.js (loaded lazily here).

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
   v3: I OWN IT also asks "Portfolio ▾" (lists from the mirror, default
   'My cards', "+ New…" creates the list in the mirror; the Vault page
   merges it on next load) and writes card.listId.
   ========================================================================== */
(function () {
  'use strict';
  var LS_KEY = 'sch_vault_v1';
  var VAULT_URL = '/watchlist';
  var CATS = { baseball: 1, basketball: 1, football: 1, pokemon: 1, other: 1 };

  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  var DEFAULT_LIST = 'default';
  /* schema helpers (/js/vault-schema.js) — injected once so pages keep a single include; the chooser
     falls back to the default list if it has not arrived yet */
  function loadSchema() {
    if (window.SCH_VSCHEMA || document.querySelector('script[data-sch-vschema]')) return;
    var sc = document.createElement('script'); sc.src = '/js/vault-schema.js?v=1'; sc.async = true; sc.setAttribute('data-sch-vschema', '1');
    document.head.appendChild(sc);
  }
  function listsOf(state) {
    var V = window.SCH_VSCHEMA;
    if (V) return V.lists(state);
    return (state && Array.isArray(state.lists) && state.lists.length) ? state.lists : [{ id: DEFAULT_LIST, name: 'My cards' }];
  }
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
      /* portfolio: an existing list id, or a new list name (spec.newList) appended to the mirror's lists */
      var V = window.SCH_VSCHEMA;
      if (V) V.migrate(state); else if (!Array.isArray(state.lists)) state.lists = [{ id: DEFAULT_LIST, name: 'My cards', createdAt: 0 }];
      var listId = DEFAULT_LIST;
      if (spec.newList && String(spec.newList).trim()) {
        if (V) listId = V.addList(state, spec.newList) || DEFAULT_LIST;
        else { var nl = { id: 'pf' + uid(), name: String(spec.newList).trim(), createdAt: Date.now() }; state.lists.push(nl); listId = nl.id; }
      } else if (spec.listId && listsOf(state).some(function (l) { return l.id === spec.listId; })) listId = spec.listId;
      card.listId = listId;
    }
    var feed = String(spec.feed || '').trim();
    if (feed) card.feedKey = feed;   // watchlist feedSync appends engine prices nightly

    state.cards.push(card);
    if (!writeStore(state)) { fallback(name); return 'fallback'; }

    ga('track_card_from_page', {
      card_name: name.slice(0, 90), page: location.pathname,
      cat: card.cat, vault_status: status
    });
    signal(card);   // anonymous demand counter -> /api/track-signal (fire-and-forget)
    return 'added';
  }

  /* ---- demand signal: counts feed the weekly auto-add loop (see
     api/track-signal.js). Only fires on a NEW add (dedupe = ~unique browsers).
     Fire-and-forget: failures are invisible to the user. ---- */
  function signal(card) {
    try {
      var p = new URLSearchParams({
        card: card.name, set: card.set, cat: card.cat, grade: card.grade,
        status: card.status, page: location.pathname, feed: card.feedKey || ''
      });
      fetch('/api/track-signal?' + p.toString(), { method: 'GET', keepalive: true }).catch(function () {});
    } catch (e) { /* never block the add */ }
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
    '#sch-track-pop{position:absolute;z-index:10500;background:#0c1017;border:1px solid rgba(0,204,245,0.4);' +
    'border-radius:2px;padding:12px;min-width:230px;box-shadow:0 10px 34px rgba(0,0,0,0.6);' +
    'font-family:"JetBrains Mono",monospace;}' +
    '#sch-track-pop .sch-pop-name{font-size:10px;color:#7a969e;letter-spacing:0.5px;margin-bottom:10px;' +
    'max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#sch-track-pop .sch-pop-row{display:flex;gap:8px;}' +
    '#sch-track-pop button{flex:1;background:transparent;border:1px solid rgba(0,204,245,0.4);color:#00ccf5;' +
    'font-family:inherit;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;' +
    'padding:8px 10px;border-radius:2px;cursor:pointer;transition:background .15s,color .15s;}' +
    '#sch-track-pop button:hover{background:#00ccf5;color:#000;}' +
    '#sch-track-pop button.sch-own-btn{border-color:rgba(245,200,0,0.5);color:#f5c800;}' +
    '#sch-track-pop button.sch-own-btn:hover{background:#f5c800;color:#000;}' +
    '#sch-track-pop .sch-pop-cost{margin-top:10px;}' +
    '#sch-track-pop .sch-pop-cost label{display:block;font-size:9px;color:#7a969e;letter-spacing:1px;' +
    'text-transform:uppercase;margin-bottom:6px;}' +
    '#sch-track-pop input{width:100%;box-sizing:border-box;background:#111820;border:1px solid rgba(255,255,255,0.12);' +
    'border-radius:2px;color:#e4f0f4;font-family:inherit;font-size:12px;padding:8px 10px;margin-bottom:8px;}' +
    '#sch-track-pop input:focus{outline:none;border-color:#f5c800;}' +
    '#sch-track-pop select{width:100%;box-sizing:border-box;background:#111820;border:1px solid rgba(255,255,255,0.12);' +
    'border-radius:2px;color:#e4f0f4;font-family:inherit;font-size:12px;padding:8px 10px;margin-bottom:8px;}' +
    '#sch-track-pop .sch-pop-new{display:none;}' +
    '#sch-track-snack{position:fixed;left:50%;bottom:70px;transform:translateX(-50%) translateY(20px);' +
    'background:#0c1017;border:1px solid #00e07a;color:#e4f0f4;font-family:"JetBrains Mono",monospace;' +
    'font-size:12px;padding:12px 18px;border-radius:2px;z-index:10400;opacity:0;pointer-events:none;' +
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
  function commit(btn, status, cost, listId, newList) {
    var spec = specFrom(btn);
    spec.status = status; spec.cost = cost; spec.listId = listId; spec.newList = newList;
    var res = track(spec);
    closePop();
    if (res === 'added') {
      markButton(btn, status);
      syncCta();
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
        '<label>Portfolio &#9662;</label>' +
        '<select class="sch-pop-list"></select>' +
        '<input type="text" class="sch-pop-new" maxlength="40" placeholder="New portfolio name">' +
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

    var sel = pop.querySelector('.sch-pop-list'), newInp = pop.querySelector('.sch-pop-new');
    function fillLists() {
      var st = readStore(); var state = st.err ? null : st.state;
      var ls = (state && !state.demo) ? listsOf(state) : [{ id: DEFAULT_LIST, name: 'My cards' }];
      sel.innerHTML = ls.map(function (l) { return '<option value="' + String(l.id).replace(/"/g, '&quot;') + '">' + String(l.name).replace(/</g, '&lt;') + '</option>'; }).join('') + '<option value="__new">+ New…</option>';
      sel.value = DEFAULT_LIST;
    }
    sel.addEventListener('change', function () { var isNew = sel.value === '__new'; newInp.style.display = isNew ? 'block' : 'none'; if (isNew) newInp.focus(); });
    function own() {
      var listId = sel.value === '__new' ? null : sel.value, newList = sel.value === '__new' ? newInp.value : '';
      if (sel.value === '__new' && !String(newList).trim()) { newInp.focus(); return; }
      commit(btn, 'own', pop.querySelector('.sch-pop-cost input').value, listId, newList);
    }
    pop.querySelector('.sch-hunt-btn').addEventListener('click', function () { commit(btn, 'watch'); });
    pop.querySelector('.sch-own-btn').addEventListener('click', function (e) {
      if (e.target.classList.contains('sch-own-add')) return;
      pop.querySelector('.sch-pop-row').style.display = 'none';
      var costBox = pop.querySelector('.sch-pop-cost');
      costBox.style.display = 'block';
      fillLists();
      var inp = costBox.querySelector('input');
      inp.focus();
      [inp, newInp].forEach(function (el) { el.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') own();
        if (ev.key === 'Escape') closePop();
      }); });
    });
    pop.querySelector('.sch-own-add').addEventListener('click', own);
  }

  /* ---- floating "★ Track this card" pill (#sch-track-cta, inlined per page) ----
     Sep 1 2026: it used to float on every page, including ones with no card at all
     (grading guide, ROI calculator), deep-linking the page TITLE into the Vault as a
     card. Now: hidden unless the page has .sch-track-card buttons or an element
     carrying data-sch-card (a card-specific page marker); with exactly one button
     it names the card ("★ Track Holliday 1st Bowman") and opens that button's chooser
     in place instead of leaving the page. Re-evaluated from SCHVault.mark() so
     checklists that render their buttons later (js/set-checklist.js) count too. */
  function shortName(n) {
    n = String(n || '').replace(/\s*[—–|·:].*$/, '').replace(/\s+/g, ' ').trim();  // drop " — Gem Candidate"
    var w = n.split(' ');
    if (w.length > 4) n = w.slice(0, 4).join(' ');
    return n.length > 26 ? n.slice(0, 25).replace(/\s+\S*$/, '') + '…' : n;
  }
  var ctaBound = false;
  function syncCta() {
    var el = document.getElementById('sch-track-cta');
    if (!el) return;
    var btns = document.querySelectorAll('.sch-track-card');
    var marker = document.querySelector('[data-sch-card]');
    if (!btns.length && !marker) { el.hidden = true; el.style.display = 'none'; return; }
    el.hidden = false; el.style.display = '';
    if (!ctaBound) {
      ctaBound = true;
      el.addEventListener('click', function (e) {
        var all = document.querySelectorAll('.sch-track-card');
        if (!all.length) return;                                  // marker-only page: plain deep link
        e.preventDefault();
        var target = all[0];
        if (all.length === 1 && target.classList.contains('sch-tracked')) { location.href = VAULT_URL; return; }
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (all.length === 1) setTimeout(function () { openPop(target); }, 380);
      });
    }
    if (btns.length > 1) {
      el.innerHTML = '&#9733; Track a card';
      el.setAttribute('aria-label', 'Track a card from this page in your Vault');
      return;
    }
    if (btns.length === 1) {
      var b = btns[0], nm = shortName(b.dataset.name);
      if (b.classList.contains('sch-tracked')) {
        el.innerHTML = '&#10003; In your Vault &rarr;';
        el.setAttribute('aria-label', 'This card is in your Vault — open it');
      } else {
        el.innerHTML = '&#9733; Track ' + nm.replace(/</g, '&lt;');
        el.setAttribute('aria-label', 'Track ' + nm + ' in your Vault');
      }
    }
    // marker-only (no buttons): the page's own href/label stand
  }

  function init() {
    loadSchema();
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var have = trackedNames();
    var btns = document.querySelectorAll('.sch-track-card');
    btns.forEach(function (b) {
      if (have[(b.dataset.name || '').toLowerCase()]) markButton(b, 'watch');
    });
    syncCta();

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

  // public: re-mark buttons rendered after load (set checklists, dynamic lists)
  window.SCHVault = window.SCHVault || {};
  window.SCHVault.mark = function (root) {
    var have = trackedNames();
    (root || document).querySelectorAll('.sch-track-card').forEach(function (b) {
      if (!b.classList.contains('sch-tracked') && have[(b.dataset.name || '').toLowerCase()]) markButton(b, 'watch');
    });
    syncCta();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SCHVault.track = track; window.SCHVault.version = 6;
})();
