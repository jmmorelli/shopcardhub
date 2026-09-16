/* rail-hydrate.js — hydrates the portfolio rail on pages that carry the RAIL block but do not load js/home.js.
   Read-only view of the Vault mirror (sch_vault_v1) via js/vault-schema.js. NEVER writes the store.
   Extracted verbatim from js/home.js renderPortfolios()/boot() so the five rail pages render identically.
   Requires js/vault-schema.js to be loaded first; degrades to the pre-rendered empty state if it is not. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function renderPortfolios(store, cfg) {
    var VS = (typeof self !== 'undefined' && self.SCH_VSCHEMA) || null;
    if (VS) return VS.railRows(store, { vaultHref: (cfg && cfg.vaultHref) || '/watchlist' });
    return '<a class="rl pf-empty" href="' + esc((cfg && cfg.vaultHref) || '/watchlist') + '"><span class="ico">&rarr;</span><span class="lbl">' + esc((cfg && cfg.empty) || 'Start in the Vault →') + '</span></a>';
  }
  function hydrate() {
    var pf = document.querySelector('[data-rail="portfolios"]');
    if (!pf) return;
    try {
      var store = null;
      try { store = JSON.parse(localStorage.getItem('sch_vault_v1') || 'null'); } catch (e) { store = null; }
      var cfg = {};
      try { cfg = JSON.parse(pf.getAttribute('data-cfg') || '{}'); } catch (e2) { cfg = {}; }
      pf.innerHTML = renderPortfolios(store, cfg);
    } catch (e3) { /* leave the pre-rendered empty state in place */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hydrate);
  else hydrate();
})();
