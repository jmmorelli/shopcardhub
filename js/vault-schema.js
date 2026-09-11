/* vault-schema.js — the Vault store's schema, shared by watchlist.html, js/vault-track.js, js/home.js
 * and tools/qa/vault-migration.test.cjs (Terminal step 3, Sep 11 2026). UMD: window.SCH_VSCHEMA / module.exports.
 *
 * Store (localStorage 'sch_vault_v1' slim mirror · IndexedDB sch_vault/kv/state full copy):
 *   { demo:bool, slim?:bool, lists:[{id, name, createdAt}], cards:[{ id, status:'watch'|'own', listId?, cat,
 *     name, set, grade, target, cost?, qty?, buyDate?, private?, feedKey?, notes?, comc?, prices:[{t,p,src}] }] }
 *
 * v2 (additive, no key rename): `lists` with the fixed default {id:'default', name:'My cards'}; every `own`
 * card carries `listId` (missing or unknown → 'default'). Hunting (status 'watch') stays one list.
 * migrate() is idempotent, never drops a card, price point, cost, qty, buyDate, private flag, feedKey, note
 * or comc block, and FAILS OPEN on input that is not a store (returns ok:false; callers must not write). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SCH_VSCHEMA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var DEFAULT_ID = 'default', DEFAULT_NAME = 'My cards';
  function uid() { return 'pf' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36); }
  function isStore(s) { return !!s && typeof s === 'object' && Array.isArray(s.cards); }

  /* normalise in place; returns { ok, changed, state } */
  function migrate(state) {
    if (!isStore(state)) return { ok: false, changed: false, state: state };
    var changed = false;
    if (!Array.isArray(state.lists)) { state.lists = []; changed = true; }
    var seen = {}, lists = [];
    for (var i = 0; i < state.lists.length; i++) {
      var l = state.lists[i];
      if (!l || typeof l !== 'object' || !l.id || seen[String(l.id)]) { changed = true; continue; }
      var id = String(l.id), name = String(l.name || (id === DEFAULT_ID ? DEFAULT_NAME : 'Portfolio')).trim() || DEFAULT_NAME;
      if (id !== l.id || name !== l.name) changed = true;
      var out = {}; for (var k in l) if (Object.prototype.hasOwnProperty.call(l, k)) out[k] = l[k];
      out.id = id; out.name = name; if (out.createdAt == null) { out.createdAt = 0; changed = true; }
      seen[id] = true; lists.push(out);
    }
    if (!seen[DEFAULT_ID]) { lists.unshift({ id: DEFAULT_ID, name: DEFAULT_NAME, createdAt: 0 }); changed = true; }
    else if (lists[0].id !== DEFAULT_ID) { lists.sort(function (a, b) { return a.id === DEFAULT_ID ? -1 : b.id === DEFAULT_ID ? 1 : 0; }); changed = true; }
    if (changed || lists.length !== state.lists.length) state.lists = lists;
    var ids = {}; lists.forEach(function (l) { ids[l.id] = true; });
    for (var j = 0; j < state.cards.length; j++) {
      var c = state.cards[j]; if (!c || typeof c !== 'object') continue;
      if (c.status === 'own') {
        if (c.listId == null || !ids[String(c.listId)]) { if (c.listId !== DEFAULT_ID) changed = true; c.listId = DEFAULT_ID; }
        else if (typeof c.listId !== 'string') { c.listId = String(c.listId); changed = true; }
      }
    }
    return { ok: true, changed: changed, state: state };
  }
  function lists(state) { return isStore(state) && Array.isArray(state.lists) && state.lists.length ? state.lists : [{ id: DEFAULT_ID, name: DEFAULT_NAME, createdAt: 0 }]; }
  function listName(state, id) { var l = lists(state).filter(function (x) { return x.id === id; })[0]; return l ? l.name : (id === DEFAULT_ID ? DEFAULT_NAME : id); }
  /* add a list (name deduped by case); returns the id. Mutates; caller saves. */
  function addList(state, name) {
    name = String(name || '').trim(); if (!name) return null;
    migrate(state);
    var hit = state.lists.filter(function (l) { return l.name.toLowerCase() === name.toLowerCase(); })[0];
    if (hit) return hit.id;
    var l = { id: uid(), name: name, createdAt: Date.now() };
    state.lists.push(l); return l.id;
  }
  /* remove a list — its cards move to 'My cards', never deleted. Default cannot be removed. */
  function removeList(state, id) {
    migrate(state);
    if (id === DEFAULT_ID) return false;
    var before = state.lists.length;
    state.lists = state.lists.filter(function (l) { return l.id !== id; });
    state.cards.forEach(function (c) { if (c && c.status === 'own' && c.listId === id) c.listId = DEFAULT_ID; });
    return state.lists.length !== before;
  }
  function renameList(state, id, name) { migrate(state); name = String(name || '').trim(); if (!name) return false; var l = state.lists.filter(function (x) { return x.id === id; })[0]; if (!l) return false; l.name = name; return true; }
  function ownIn(state, id) { return (isStore(state) ? state.cards : []).filter(function (c) { return c && c.status === 'own' && (id === 'all' || (c.listId || DEFAULT_ID) === id); }); }

  /* ---- portfolio math on a card list (the same on the full store and the slim mirror) ---- */
  function lastP(c) { var ps = (c.prices || []).filter(function (p) { return p && p.p != null && isFinite(p.p); }); return ps.length ? ps[ps.length - 1].p : null; }
  /* 5D reference: the 5th-previous point; fewer points → the first one */
  function agoP(c) { var ps = (c.prices || []).filter(function (p) { return p && p.p != null && isFinite(p.p); }); if (ps.length < 2) return null; return ps.length > 5 ? ps[ps.length - 6].p : ps[0].p; }
  function summary(cards) {
    var val = 0, ago = 0, cost = 0, priced = 0, both = 0;
    cards.forEach(function (c) {
      var q = c.qty > 0 ? c.qty : 1, lp = lastP(c), ap = agoP(c);
      if (lp != null) { val += lp * q; priced++; }
      if (c.cost != null && isFinite(c.cost)) cost += c.cost * q;
      if (lp != null && ap != null) { ago += ap * q; both++; }
    });
    var chg = null, chgp = null;
    if (both && ago > 0) { var nowB = 0; cards.forEach(function (c) { var q = c.qty > 0 ? c.qty : 1, lp = lastP(c), ap = agoP(c); if (lp != null && ap != null) nowB += lp * q; }); chg = nowB - ago; chgp = chg / ago * 100; }
    return { n: cards.length, val: val, cost: cost, priced: priced, chg: chg, chgp: chgp, unreal: cost > 0 ? val - cost : null };
  }
  /* rail rows for every portfolio — pure HTML. opts: { hrefFor(id) → href | null (null = in-page button), newHref, vaultHref, active }
     Never writes the store. */
  function railRows(state, opts) {
    opts = opts || {};
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var money = function (n) { return n == null ? '—' : '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 100 ? String(Math.round(n)) : n.toFixed(2)); };
    var pct = function (n) { return n == null || !isFinite(n) ? '—' : (n > 0 ? '+' : '') + n.toFixed(1) + '%'; };
    var ok = isStore(state) && !state.demo;
    var ls = ok ? lists(state) : [{ id: DEFAULT_ID, name: DEFAULT_NAME }];
    var html = '';
    ls.forEach(function (l) {
      var s = summary(ok ? ownIn(state, l.id) : []);
      var pill = !s.n ? '—' : s.chgp != null ? pct(s.chgp) : (s.priced ? money(s.val) : String(s.n));
      var cls = !s.n || s.chgp == null ? '' : s.chgp > 0.05 ? ' up' : s.chgp < -0.05 ? ' dn' : ' flat';
      var href = opts.hrefFor ? opts.hrefFor(l.id) : (opts.vaultHref || '/watchlist') + '#pf=' + encodeURIComponent(l.id);
      html += '<a class="rl pf' + (opts.active === l.id ? ' on' : '') + '" href="' + esc(href) + '" data-pf="' + esc(l.id) + '" title="' + esc(l.name) + ' · ' + s.n + ' card' + (s.n === 1 ? '' : 's') + (s.priced ? ' · ' + money(s.val) : '') + '"><span class="ico">◆</span><span class="lbl">' + esc(l.name) + '</span><span class="pill' + cls + '">' + esc(pill) + '</span></a>';
    });
    var hunt = ok ? state.cards.filter(function (c) { return c && c.status === 'watch'; }).length : 0;
    var hhref = opts.hrefFor ? opts.hrefFor('hunting') : (opts.vaultHref || '/watchlist') + '#pf=hunting';
    html += '<a class="rl pf' + (opts.active === 'hunting' ? ' on' : '') + '" href="' + esc(hhref) + '" data-pf="hunting"><span class="ico">◇</span><span class="lbl">Hunting</span><span class="pill' + (hunt ? ' on' : '') + '">' + (hunt ? hunt + ' target' + (hunt === 1 ? '' : 's') : '—') + '</span></a>';
    html += opts.newHref === null
      ? '<button type="button" class="rl pf-new" data-pf-new="1"><span class="ico">+</span><span class="lbl">New portfolio</span></button>'
      : '<a class="rl pf-new" href="' + esc(opts.newHref || (opts.vaultHref || '/watchlist') + '#pf=new') + '"><span class="ico">+</span><span class="lbl">New portfolio</span></a>';
    return html;
  }
  return { DEFAULT_ID: DEFAULT_ID, DEFAULT_NAME: DEFAULT_NAME, isStore: isStore, migrate: migrate, lists: lists, listName: listName, addList: addList, removeList: removeList, renameList: renameList, ownIn: ownIn, lastP: lastP, agoP: agoP, summary: summary, railRows: railRows };
});
