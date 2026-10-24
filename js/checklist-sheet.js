/* checklist-sheet.js — the set checklist WORKSHEET (P0-E v1, Oct 23 2026 — Mo: "like its own Excel sheet for users to
   click around… see how many cards I have in this set and an estimated value… not an exact number").

   Builds on the Aug 21 checklist component: the same /data/sets/<slug>.json rows, the same card names, the same Vault
   write contract (js/vault-track.js → window.SCHVault.track). Mounts on
     <div data-checklist-sheet="/data/sets/<slug>.json" data-ticker="BCB26" data-cat="baseball"
          data-customid="cl-<slug>" data-sacat="212" [data-grades="/data/cards/g-<tk>.json"]
          [data-card-pages='{"CPA-LH":"/card-luis-hernandez-bcb26-auto"}']></div>

   What it does
   - one row per card; per row: Have / Want (one or the other), qty 1–9 (Have only), grade (Raw · PSA 9 · PSA 10 ·
     TAG 10), the card's latest recent-sales mark, a link (card page where one exists, else a tagged eBay search).
   - spreadsheet feel: click a header to sort (#, card, team, value), filter chips (All · Have · Want · Most valuable),
     group tabs, search, zebra rows, every control is a native button/checkbox/select so the keyboard works.
   - the summary bar: "You have N of M · P% · estimated value $low–$high · based on sales through <date>".
     The range is deliberately not a total: low = Σ(mark × qty) × 0.9, high = × 1.1 over the Have rows that HAVE a
     dated mark (a graded row counts only when a graded mark exists). Rows without a mark say "no recent sales" and
     are left out, and the bar says how many were left out. The toggle under the sheet spells this out.
   - marks come live from /data/indices.json (the ticker's basket + any sub-index basket; the same numbers the
     index page shows, re-marked Mon/Thu) — nothing is typed into this file. Graded marks come from data-grades when
     the ticker has a ladder file; BCB26 has none yet, so graded rows read "no recent graded sales".
   - saves on the device: localStorage `sch_checklist_v1` = { <slug>: { rows: { <num>: { s:'h'|'w', q, g, vid } }, t } }.
     No account. Have/Want also writes the card into the Vault (status own / watch) through SCHVault.track so the
     Vault and the sheet agree; unticking removes it from the Vault mirror and leaves a tombstone (mirror.rm) that
     /watchlist applies on its next load. First visit with no saved sheet: rows already in the Vault (same card name)
     are pre-ticked.
   - Export CSV · Clear (asks first).
   v2 (Oct 24 2026, P0-E: Prismatic Evolutions + Destined Rivals): rows may carry {name, rarity, id} instead of {player, team}
   (tools/fetch-pokemon-checklist.mjs); a sheet with cat "pokemon" names Vault cards the way the chase pages do
   ("Umbreon ex SIR #161 Prismatic Evolutions", group.code = the rarity tag), searches eBay the way the index page does
   ("<name> <n>/<printed> <exclusions>", data.tcg.printedTotal), shows Rarity where Bowman shows Team, and its group chips
   are the rarity row (group.short: Base · IR · SIR · UR · Hyper · ACE SPEC — only the kinds the set has). The set page's
   accent arrives as --clw-acc on the host (bar, numbers, chips); the eBay button stays yellow. Bowman sheets are unchanged.
   v2.1 (Oct 24 2026, P0-E — the checklist camp's most-used features, claude/cos/learn-collection-trackers-2026-10-23.md §4):
   - "Still need (N)" chip = every row not ticked Have (Want rows included). In that view every row's Open cell is the
     card's eBay search tagged customid=<customid>-need, and a strip above the list carries the yellow "Shop the N you
     still need on eBay →" (the set singles search, tagged -need-top) so the Wednesday money read can split the gap list
     from the rest of the sheet.
   - Import CSV: the same columns Export writes (number · status · qty · grade; anything else ignored). Rows are matched
     by card number; a row with no status leaves the device's tick alone — import adds, it never wipes. No account.
   - the saved sheet also carries `total` (rows on the sheet) so the index page's "Your checklist" tile can say
     "You have 61 of 244 · 25%" from the device alone (js/plain-read.js clTiles()).
   Never writes a price. Never shows an exact total. */
(function () {
  'use strict';
  var LS_KEY = 'sch_checklist_v1', VAULT_KEY = 'sch_vault_v1';
  var GRADES = [['Raw', 'Raw'], ['PSA 9', 'PSA 9'], ['PSA 10', 'PSA 10'], ['TAG 10', 'TAG 10']];
  var GKEY = { 'PSA 9': 'psa9', 'PSA 10': 'psa10', 'TAG 10': 'tag10' };
  var BAND = 0.10;   // ± around the mark — the one range rule, named in the toggle

  var CSS = '.clw{margin:0}' +
    '.clw-sum{position:sticky;top:58px;z-index:20;background:rgba(7,9,12,.96);backdrop-filter:blur(12px);border:1px solid var(--bd2,rgba(255,255,255,.12));border-left:3px solid var(--clw-acc,var(--gd,#f5c800));border-radius:3px;padding:12px 16px;margin:14px 0 12px;display:grid;grid-template-columns:auto 1fr auto;gap:10px 22px;align-items:center}' +
    '.clw-sum>div{min-width:0}' +
    '.clw-k{font-family:var(--fm,ui-monospace,monospace);font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--dim,#5a7880);display:block;margin-bottom:4px}' +
    '.clw-n{font-family:var(--fm,ui-monospace,monospace);font-size:26px;font-weight:700;line-height:1;color:var(--th,#e4f0f4);white-space:nowrap}.clw-n small{font-size:13px;color:var(--dim,#5a7880);font-weight:400;margin-left:6px}' +
    '.clw-bar{height:4px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:8px;overflow:hidden;min-width:120px}.clw-bar i{display:block;height:100%;width:0;background:var(--clw-acc,var(--gd,#f5c800));transition:width .4s}' +
    '.clw-v{font-family:var(--fm,ui-monospace,monospace);font-size:24px;font-weight:700;line-height:1;color:var(--gd,#f5c800);white-space:nowrap}.clw-v.none{color:var(--dim,#5a7880);font-size:15px;font-weight:400;white-space:normal}' +
    '.clw-sub{font-size:11.5px;color:var(--dim,#5a7880);margin-top:5px;line-height:1.45}' +
    '.clw-go{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-family:var(--fm,ui-monospace,monospace);font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:11px 16px;border-radius:2px;background:var(--gd,#f5c800);color:#000!important;text-decoration:none;white-space:nowrap}.clw-go:hover{background:#fff;text-decoration:none}' +
    '.clw-ctl{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 10px}' +
    '.clw-ctl input[type=search]{flex:1 1 200px;min-width:0;background:var(--p2,#111820);border:1px solid var(--bd2,rgba(255,255,255,.12));color:var(--tx,#b8cdd4);font-family:var(--fm,ui-monospace,monospace);font-size:13px;padding:8px 12px;border-radius:2px}.clw-ctl input[type=search]:focus{outline:none;border-color:var(--ac,#00ccf5)}' +
    '.clw-chips{display:inline-flex;border:1px solid var(--bd2,rgba(255,255,255,.12));border-radius:2px;overflow:hidden}' +
    '.clw-chips button{background:none;border:0;border-right:1px solid var(--bd2,rgba(255,255,255,.12));color:var(--dim,#5a7880);font-family:var(--fm,ui-monospace,monospace);font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 11px;cursor:pointer;min-height:36px}.clw-chips button:last-child{border-right:0}.clw-chips button.on{background:var(--clw-acc,var(--ac,#00ccf5));color:#000}.clw-chips button:focus-visible{outline:2px solid var(--gd,#f5c800);outline-offset:-2px}' +
    '.clw-chips button b{font-weight:400;opacity:.75;margin-left:4px}' +
    '.clw-need{display:none;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 10px;padding:10px 12px;border:1px solid rgba(245,200,0,.35);border-radius:3px;background:rgba(245,200,0,.05)}.clw-need.on{display:flex}.clw-need>span{font-size:12px;line-height:1.45;color:var(--tx,#b8cdd4)}.clw-need .clw-go span{color:inherit}' +
    '.clw-act input[type=file]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}' +
    '.clw-act{margin-left:auto;display:inline-flex;gap:6px;position:relative}.clw-act button{background:none;border:1px solid var(--bd2,rgba(255,255,255,.12));color:var(--tx,#b8cdd4);font-family:var(--fm,ui-monospace,monospace);font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 11px;border-radius:2px;cursor:pointer;min-height:36px}.clw-act button:hover{border-color:var(--ac,#00ccf5);color:var(--th,#e4f0f4)}' +
    '.clw-wrap{overflow:auto;border:1px solid var(--bd2,rgba(255,255,255,.12));background:var(--p1,#0c1017);max-height:70vh}' +
    '.clw table{width:100%;border-collapse:collapse;font-family:var(--fm,ui-monospace,monospace);font-size:12.5px;white-space:nowrap}' +
    '.clw th{position:sticky;top:0;z-index:2;background:var(--p2,#111820);color:var(--dim,#5a7880);font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;text-align:left;padding:0;border-bottom:1px solid var(--bd2,rgba(255,255,255,.12))}' +
    '.clw th button{all:unset;display:block;box-sizing:border-box;width:100%;padding:9px 10px;cursor:pointer;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit}.clw th button:hover,.clw th button[aria-sort]:not([aria-sort=none]){color:var(--th,#e4f0f4)}.clw th button:focus-visible{outline:2px solid var(--gd,#f5c800);outline-offset:-2px}.clw th>span{display:block;padding:9px 10px}' +
    '.clw th .ar{opacity:.5;margin-left:4px}' +
    '.clw td{padding:0 10px;height:34px;border-bottom:1px solid var(--bd,rgba(255,255,255,.07));vertical-align:middle;color:var(--tx,#b8cdd4)}' +
    '.clw tbody tr:nth-child(even) td{background:rgba(255,255,255,.018)}.clw tbody tr:hover td{background:rgba(0,204,245,.06)}' +
    '.clw tr.h td{background:rgba(245,200,0,.05)}.clw tr.h td.p a,.clw tr.h td.p{color:var(--th,#e4f0f4)}' +
    '.clw td.n{color:var(--clw-acc,var(--ac,#00ccf5));font-weight:700;width:78px}.clw td.p{font-family:var(--fb,Barlow,system-ui,sans-serif);font-weight:600;font-size:13.5px;color:var(--th,#e4f0f4)}.clw td.p a{color:inherit;text-decoration:none;border-bottom:1px dotted var(--bd2,rgba(255,255,255,.22))}.clw td.p a:hover{color:var(--ac,#00ccf5)}' +
    '.clw td.t{color:var(--dim,#5a7880);max-width:170px;overflow:hidden;text-overflow:ellipsis}.clw td.v{text-align:right;width:92px;font-weight:700;color:var(--th,#e4f0f4)}.clw td.v.none{color:var(--dim,#5a7880);font-weight:400;font-size:10.5px}.clw td.v small{display:block;font-weight:400;font-size:9px;color:var(--dim,#5a7880);letter-spacing:.5px}' +
    '.clw td.c{text-align:center;width:52px}.clw td.c label{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;cursor:pointer}.clw td.c input{width:17px;height:17px;accent-color:var(--gd,#f5c800);cursor:pointer;margin:0}.clw td.c.w input{accent-color:var(--ac,#00ccf5)}' +
    '.clw td.q{width:74px;text-align:center}.clw .qs{display:inline-flex;align-items:center;border:1px solid var(--bd2,rgba(255,255,255,.12));border-radius:2px;overflow:hidden;opacity:.35}.clw tr.h .qs{opacity:1}.clw .qs button{all:unset;width:22px;height:26px;text-align:center;cursor:pointer;color:var(--tx,#b8cdd4);font-weight:700}.clw .qs button:hover{background:rgba(255,255,255,.08)}.clw .qs button:disabled{opacity:.3;cursor:default}.clw .qs output{min-width:18px;text-align:center;font-size:12px;color:var(--th,#e4f0f4)}' +
    '.clw td.g{width:86px}.clw td.g select{width:100%;background:var(--p2,#111820);border:1px solid var(--bd2,rgba(255,255,255,.12));color:var(--tx,#b8cdd4);font-family:var(--fm,ui-monospace,monospace);font-size:11px;padding:4px 4px;border-radius:2px;opacity:.5}.clw tr.h td.g select,.clw tr.w td.g select{opacity:1}' +
    '.clw td.l{text-align:right;width:84px}.clw td.l a{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ac,#00ccf5);text-decoration:none;border:1px solid rgba(0,204,245,.35);padding:4px 8px;border-radius:2px}.clw td.l a:hover{background:var(--ac,#00ccf5);color:#000}.clw td.l a.eb{color:var(--gd,#f5c800);border-color:rgba(245,200,0,.45)}.clw td.l a.eb:hover{background:var(--gd,#f5c800);color:#000}' +
    '.clw .tag{font-size:8.5px;letter-spacing:1.5px;color:var(--gn,#00e07a);border:1px solid rgba(0,224,122,.4);padding:1px 4px;margin-left:7px;vertical-align:middle;font-family:var(--fm,ui-monospace,monospace);font-weight:700}' +
    '.clw-foot{font-family:var(--fm,ui-monospace,monospace);font-size:11px;color:var(--dim,#5a7880);padding:8px 2px;display:flex;gap:14px;flex-wrap:wrap}' +
    '.clw-empty td{color:var(--dim,#5a7880);height:60px;text-align:center}' +
    '.clw-snack{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);background:#0c1017;border:1px solid var(--gd,#f5c800);color:var(--th,#e4f0f4);font-family:var(--fm,ui-monospace,monospace);font-size:12px;padding:10px 16px;border-radius:2px;z-index:300;opacity:0;pointer-events:none;transition:opacity .2s}.clw-snack.show{opacity:1}' +
    '@media(max-width:760px){.clw-sum{top:58px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px 14px;padding:10px 12px}.clw-sum .clw-cta{grid-column:1/-1;min-width:0}.clw-go{width:100%;box-sizing:border-box;white-space:normal;text-align:center;padding:10px 12px}.clw-n,.clw-v{white-space:normal}.clw-n{font-size:22px}.clw-v{font-size:19px}.clw-sub{font-size:11px}' +
    '.clw-chips{flex-wrap:wrap;max-width:100%}.clw-chips button{flex:1 1 auto;border-bottom:1px solid var(--bd2,rgba(255,255,255,.12));margin-bottom:-1px}.clw td.t,.clw th.t{display:none}.clw td{height:40px}.clw td.l a{padding:6px 7px}.clw td.c label{width:40px;height:40px}.clw td.c input{width:20px;height:20px}.clw-act{margin-left:0}}';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function nk(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function num(n) { return String(n || '').replace(/^#/, '').toUpperCase().trim(); }
  function money(v) { if (v == null || !isFinite(v)) return '—'; return '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2)); }
  function rangeMoney(v) { if (v >= 1000) v = Math.round(v / 10) * 10; return money(v); }
  function mdy(s) { var d = new Date(String(s || '').slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  function ga(n, p) { if (typeof gtag === 'function') try { gtag('event', n, p || {}); } catch (e) {} }
  // the same tagged search every page builds (tools/lib/epn.mjs): "+" between words, apostrophes encoded, no raw "#"
  function ebayUrl(q, customid, sacat) {
    var k = encodeURIComponent(String(q).replace(/\s+/g, ' ').trim()).replace(/%20/g, '+').replace(/'/g, '%27').replace(/[!()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); });
    return 'https://www.ebay.com/sch/i.html?_nkw=' + k + (sacat ? '&_sacat=' + sacat : '') + '&LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001&customid=' + customid;
  }
  function idxFetch() {
    return (window.schIdx = window.schIdx || function () { return window.__schIdxP || (window.__schIdxP = fetch('/data/indices.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(function (e) { window.__schIdxP = null; throw e; })); })();
  }

  /* ---- device store: the sheet ---- */
  function loadAll() { try { var s = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); return s && typeof s === 'object' ? s : {}; } catch (e) { return {}; } }
  function saveAll(all) { try { localStorage.setItem(LS_KEY, JSON.stringify(all)); return true; } catch (e) { return false; } }

  /* ---- the Vault mirror: add through the contract, remove by id with a tombstone ---- */
  function readVault() { try { var raw = localStorage.getItem(VAULT_KEY); if (!raw) return { state: null }; var s = JSON.parse(raw); return (s && Array.isArray(s.cards)) ? { state: s } : { err: true }; } catch (e) { return { err: true }; } }
  function vaultAdd(spec) {
    if (!window.SCHVault || !window.SCHVault.track) return null;
    var v = readVault(); if (v.err) return null;          // never let a corrupt store bounce the reader to /watchlist
    var key = spec.name.toLowerCase(), i;
    // the same card already in the mirror under the other status (★ Track from a release page = Hunting): replace it
    if (v.state) for (i = 0; i < v.state.cards.length; i++) { var c0 = v.state.cards[i]; if (c0 && (c0.name || '').toLowerCase() === key) { if (c0.status === spec.status && (c0.grade || 'Raw') === spec.grade) return c0.id || null; vaultRemove(c0.id, spec.name); break; } }
    var res = window.SCHVault.track(spec);
    if (res !== 'added' && res !== 'exists') return null;
    v = readVault(); if (!v.state) return null;
    for (i = 0; i < v.state.cards.length; i++) if ((v.state.cards[i].name || '').toLowerCase() === key) return v.state.cards[i].id || null;
    return null;
  }
  function vaultRemove(id, name) {
    var v = readVault(); if (v.err || !v.state) return;
    var st = v.state, found = false;
    st.cards = st.cards.filter(function (c) { if (c && ((id && c.id === id) || (!id && (c.name || '').toLowerCase() === String(name).toLowerCase() && /^Tracked from/.test(c.notes || '')))) { found = true; id = id || c.id; return false; } return true; });
    if (!found && !id) return;
    st.rm = (Array.isArray(st.rm) ? st.rm : []).filter(function (r) { return r && r.id !== id; }).concat([{ id: id, t: Date.now() }]).slice(-200);
    try { localStorage.setItem(VAULT_KEY, JSON.stringify(st)); } catch (e) {}
  }
  function vaultOwnedNames() {
    var v = readVault(), out = {}; if (v.err || !v.state || v.state.demo) return out;
    v.state.cards.forEach(function (c) { if (c && c.name) out[c.name.toLowerCase()] = { s: c.status === 'own' ? 'h' : 'w', id: c.id, q: c.qty, g: c.grade }; });
    return out;
  }

  function render(host, data, idx, grades) {
    var slug = data.slug, setName = data.set.replace(/ (Baseball|Basketball|Football|Soccer)$/, '');
    var tk = host.getAttribute('data-ticker') || '', cat = host.getAttribute('data-cat') || data.cat || 'other';
    var customid = host.getAttribute('data-customid') || ('cl-' + slug), sacat = host.getAttribute('data-sacat') || '';
    var pages = {}; try { pages = JSON.parse(host.getAttribute('data-card-pages') || '{}'); } catch (e) {}
    var page = location.pathname;
    var poke = (data.cat || cat) === 'pokemon', printed = data.tcg && data.tcg.printedTotal;
    var EXCL = '-lot -case -proxy -proxies -reprint -digital -custom -diy -skin -metal -display -sticker';   // the index page's row search
    var topUrl = host.getAttribute('data-top-url') || ebayUrl((poke ? 'pokemon ' : '') + setName + ' -box -case -lot -break', customid + '-top', sacat);

    // marks: the ticker's basket + every sub-index basket (same numbers as the index page)
    var marks = {}, asOfMax = '';
    function take(b) { (b || []).forEach(function (c) { if (c && typeof c.price === 'number' && c.price > 0 && c.num != null) { var k = num(c.num); if (!marks[k] || (c.asOf || '') > (marks[k].asOf || '')) marks[k] = { p: c.price, asOf: String(c.asOf || '').slice(0, 10), n30: c.n30 }; if ((c.asOf || '') > asOfMax) asOfMax = String(c.asOf).slice(0, 10); } }); }
    var r = idx && idx[tk]; if (r && typeof r === 'object') { take(r.basket); Object.keys(r.sub || {}).forEach(function (k) { take(r.sub[k].basket); }); }
    var hist = r && r.history || [], lastMark = hist.length ? String(hist[hist.length - 1].date).slice(0, 10) : asOfMax;
    function markFor(n, g) {
      var k = num(n);
      if (!g || g === 'Raw') return marks[k] || null;
      var gc = grades && grades.cards && (grades.cards[k] || grades.cards[k.toLowerCase()]); var gg = gc && gc[GKEY[g]];
      return (gg && typeof gg.m === 'number' && gg.m > 0) ? { p: gg.m, asOf: gc.asOf || grades.day, graded: true } : null;
    }

    // rows
    var rows = [];
    (data.groups || []).forEach(function (g, gi) {
      (g.cards || []).forEach(function (c, ci) {
        var nm = c.name || c.player; if (!nm) return;
        rows.push({ n: c.n, k: num(c.n), player: nm, team: c.team || '', rarity: c.rarity || '', first: !!c.first, rc: !!c.rc, g: g, gi: gi, ci: ci,
          // the Vault card name: Bowman "<player> <set> <kind> #<n>" (Aug 21 component); Pokémon "<name> <SIR> #<n> <set>" (the chase pages' tname)
          name: poke ? nm + (g.code ? ' ' + g.code : '') + ' #' + c.n + ' ' + setName : nm + ' ' + setName + ' ' + (g.kind || '') + ' #' + c.n,
          href: pages[num(c.n)] || null,
          q: poke ? nm + ' ' + c.n + (printed ? '/' + printed : '') + ' ' + EXCL : setName + ' ' + nm + ' ' + c.n + (/auto/i.test(g.kind || g.title || '') ? ' auto' : '') });
      });
    });
    var total = rows.length;
    var hasTeam = rows.some(function (x) { return x.team; }), col3 = hasTeam ? 'Team' : 'Rarity';
    function third(rw) { return hasTeam ? rw.team : (rw.rarity || rw.g.title); }

    // state
    var all = loadAll(), st = all[slug];
    var fresh = !st;
    if (!st) { st = { rows: {}, t: Date.now() }; var own = vaultOwnedNames(); rows.forEach(function (rw) { var o = own[rw.name.toLowerCase()]; if (o) st.rows[rw.k] = { s: o.s, q: Math.min(9, Math.max(1, parseInt(o.q, 10) || 1)), g: (o.g === 'Raw' || GKEY[o.g]) ? o.g : 'Raw', vid: o.id || null }; }); }
    function persist() { st.t = Date.now(); st.total = total; all[slug] = st; saveAll(all); }
    if ((fresh && Object.keys(st.rows).length) || (!fresh && st.total !== total)) persist();   // v2.1: the tile on the index page reads total from here

    var sort = { key: 'order', dir: 1 }, filter = 'all', group = -1, q = '';
    // the gap list's own tags: rows -need, the strip's button -need-top (same searches as the rest of the sheet)
    var needId = customid + '-need', needTopUrl = /customid=[^&]*-top(&|$)/.test(topUrl) ? topUrl.replace(/(customid=[^&]*)-top(?=&|$)/, '$1-need-top') : topUrl.replace(/(customid=[^&]*)/, '$1-need-top');
    var topSet = {}; rows.slice().filter(function (x) { return marks[x.k]; }).sort(function (a, b) { return marks[b.k].p - marks[a.k].p; }).slice(0, 20).forEach(function (x) { topSet[x.k] = 1; });

    host.innerHTML =
      '<div class="clw-sum" role="region" aria-label="Your checklist summary" aria-live="polite">' +
        '<div><span class="clw-k">You have</span><span class="clw-n" data-clw="count">0 <small>of ' + total + '</small></span><div class="clw-bar"><i data-clw="bar"></i></div></div>' +
        '<div><span class="clw-k">Estimated value</span><span class="clw-v none" data-clw="val">Tick the cards you have</span><div class="clw-sub" data-clw="sub"></div></div>' +
        '<div class="clw-cta"><a class="clw-go" href="' + esc(topUrl) + '" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag===\'function\')gtag(\'event\',\'checklist_shop\',{set:\'' + esc(slug) + '\'})">Shop ' + esc(setName) + ' singles on eBay &rarr;</a></div>' +
      '</div>' +
      '<div class="clw-ctl">' +
        '<input type="search" placeholder="' + (hasTeam ? 'Search player, team or number…' : 'Search card, rarity or number…') + '" aria-label="Search the checklist">' +
        '<div class="clw-chips" role="group" aria-label="Show"><button data-f="all" class="on" aria-pressed="true">All<b data-clw="c-all"></b></button><button data-f="h" aria-pressed="false">Have<b data-clw="c-h"></b></button><button data-f="need" aria-pressed="false" title="Every card you have not ticked as Have, each with its eBay search">Still need<b data-clw="c-need"></b></button><button data-f="w" aria-pressed="false">Want<b data-clw="c-w"></b></button><button data-f="top" aria-pressed="false" title="The 20 cards with the highest recent-sales mark">Most valuable</button></div>' +
        ((data.groups || []).length > 1 ? '<div class="clw-chips" role="group" aria-label="' + (poke ? 'Rarity' : 'Section') + '"><button data-g="-1" class="on" aria-pressed="true">' + (poke ? 'All' : 'All sections') + '</button>' + data.groups.map(function (g, i) { return '<button data-g="' + i + '" aria-pressed="false"' + (g.short && g.short !== g.title ? ' title="' + esc(g.title) + '"' : '') + '>' + esc(g.short || g.title) + '<b>' + (g.cards || []).length + '</b></button>'; }).join('') + '</div>' : '') +
        '<div class="clw-act"><button type="button" data-a="csv">Export CSV</button><button type="button" data-a="import" title="Bring a checklist you exported on another device — adds to what is ticked here, never clears">Import CSV</button><input type="file" accept=".csv,text/csv,text/plain" aria-label="Choose the CSV you exported" tabindex="-1"><button type="button" data-a="clear">Clear</button></div>' +
      '</div>' +
      '<div class="clw-need" data-clw="need"><a class="clw-go" href="' + esc(needTopUrl) + '" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag===\'function\')gtag(\'event\',\'checklist_shop_need\',{set:\'' + esc(slug) + '\'})" data-clw="need-go">Shop the <span data-clw="need-n">' + total + '</span> you still need on eBay &rarr;</a><span>Every row below opens the eBay search for that card.</span></div>' +
      '<div class="clw-wrap"><table><thead><tr>' +
        '<th><button type="button" data-s="n" aria-sort="none">#<span class="ar">↕</span></button></th>' +
        '<th><button type="button" data-s="name" aria-sort="none">Card<span class="ar">↕</span></button></th>' +
        '<th class="t"><button type="button" data-s="team" aria-sort="none">' + col3 + '<span class="ar">↕</span></button></th>' +
        '<th style="text-align:right"><button type="button" data-s="v" aria-sort="none" title="Latest recent-sales mark for the grade you picked — a median of dated sales, not one sale">Value<span class="ar">↕</span></button></th>' +
        '<th style="text-align:center"><span>Have</span></th><th style="text-align:center"><span>Want</span></th><th style="text-align:center"><span>Qty</span></th><th><span>Grade</span></th><th style="text-align:right"><span>Open</span></th>' +
      '</tr></thead><tbody></tbody></table></div>' +
      '<div class="clw-foot"><span data-clw="foot"></span><span>Have = you own it (goes to your Vault as My cards). Want = still hunting (Vault: Hunting). Value = latest recent-sales mark for that grade; the bar above is a range, never a total.</span></div>';

    var tbody = host.querySelector('tbody'), input = host.querySelector('input[type=search]');
    var snackEl = null, snackT = null;
    function snack(t) { if (!snackEl) { snackEl = document.createElement('div'); snackEl.className = 'clw-snack'; document.body.appendChild(snackEl); } snackEl.textContent = t; requestAnimationFrame(function () { snackEl.classList.add('show'); }); clearTimeout(snackT); snackT = setTimeout(function () { snackEl.classList.remove('show'); }, 2600); }

    function rowState(rw) { return st.rows[rw.k] || null; }
    function valueOf(rw) { var s = rowState(rw); return markFor(rw.n, s ? s.g : 'Raw'); }

    function summary() {
      var have = 0, want = 0, low = 0, high = 0, counted = 0, skipped = 0, through = '';
      rows.forEach(function (rw) {
        var s = rowState(rw); if (!s) return;
        if (s.s === 'w') { want++; return; }
        have++;
        var m = markFor(rw.n, s.g);
        if (m) { var v = m.p * (s.q || 1); low += v * (1 - BAND); high += v * (1 + BAND); counted++; if (m.asOf > through) through = m.asOf; }
        else skipped++;
      });
      var pct = total ? Math.round(have / total * 100) : 0;   // 1 of 244 reads "<1%" and still shows a sliver, not an empty bar
      host.querySelector('[data-clw="count"]').innerHTML = have + ' <small>of ' + total + ' · ' + (have && !pct ? '&lt;1' : pct) + '%</small>';
      host.querySelector('[data-clw="bar"]').style.width = (have ? Math.max(pct, 1.5) : 0) + '%';
      var val = host.querySelector('[data-clw="val"]'), sub = host.querySelector('[data-clw="sub"]');
      if (!have) { val.className = 'clw-v none'; val.textContent = 'Tick the cards you have'; sub.textContent = 'We estimate what the stack is worth from recent sales.'; }
      else if (!counted) { val.className = 'clw-v none'; val.textContent = 'No recent sales for these ' + (have === 1 ? 'card' : 'cards') + ' yet'; sub.textContent = have + ' card' + (have === 1 ? '' : 's') + ' ticked · none has a recent-sales mark, so there is no range to show.'; }
      else { val.className = 'clw-v'; val.textContent = rangeMoney(low) + '–' + rangeMoney(high); sub.textContent = 'based on sales through ' + mdy(through || lastMark) + (skipped ? ' · ' + skipped + ' card' + (skipped === 1 ? '' : 's') + ' with no recent sales not counted' : '') + ' · a range, not a total'; }
      host.querySelector('[data-clw="c-all"]').textContent = total; host.querySelector('[data-clw="c-h"]').textContent = have || ''; host.querySelector('[data-clw="c-w"]').textContent = want || '';
      var need = total - have;
      host.querySelector('[data-clw="c-need"]').textContent = need;
      host.querySelector('[data-clw="need-n"]').textContent = need;
      var strip = host.querySelector('[data-clw="need"]'); strip.classList.toggle('on', filter === 'need' && need > 0);
    }

    function visible() {
      var list = rows.filter(function (rw) {
        if (group > -1 && rw.gi !== group) return false;
        var s = rowState(rw);
        if (filter === 'h' && !(s && s.s === 'h')) return false;
        if (filter === 'w' && !(s && s.s === 'w')) return false;
        if (filter === 'need' && s && s.s === 'h') return false;
        if (filter === 'top' && !topSet[rw.k]) return false;
        if (q && nk(rw.player + ' ' + third(rw) + ' ' + rw.n).indexOf(q) < 0) return false;
        return true;
      });
      var d = sort.dir;
      list.sort(function (a, b) {
        if (sort.key === 'order') return (a.gi - b.gi) || (a.ci - b.ci);
        if (sort.key === 'v') { var va = valueOf(a), vb = valueOf(b); va = va ? va.p : -1; vb = vb ? vb.p : -1; return (vb - va) * d || (a.gi - b.gi) || (a.ci - b.ci); }   // value: first click = highest first
        if (sort.key === 'n') { var na = parseInt(String(a.n).replace(/\D/g, ''), 10) || 0, nb = parseInt(String(b.n).replace(/\D/g, ''), 10) || 0; return ((a.gi - b.gi) || (na - nb) || String(a.n).localeCompare(String(b.n))) * d; }
        var ka = nk(sort.key === 'team' ? third(a) : a.player), kb = nk(sort.key === 'team' ? third(b) : b.player);
        return (ka < kb ? -1 : ka > kb ? 1 : (a.gi - b.gi) || (a.ci - b.ci)) * d;
      });
      return list;
    }

    function draw() {
      var list = visible();
      tbody.innerHTML = list.map(function (rw) {
        var s = rowState(rw), g = s ? s.g : 'Raw', m = markFor(rw.n, g), qn = s && s.s === 'h' ? (s.q || 1) : 1;
        var cls = s ? (s.s === 'h' ? 'h' : 'w') : '';
        // the gap list: every row opens its eBay search, tagged -need (a card with a chart keeps the chart link on its name)
        var link = filter === 'need' ? '<a class="eb" href="' + esc(ebayUrl(rw.q, needId, sacat)) + '" target="_blank" rel="noopener sponsored" title="Live eBay listings for this card (affiliate)">eBay</a>' :
          rw.href ? '<a href="' + esc(rw.href) + '" title="Price chart and live listings">Chart</a>' : '<a class="eb" href="' + esc(ebayUrl(rw.q, customid, sacat)) + '" target="_blank" rel="noopener sponsored" title="Live eBay listings for this card (affiliate)">eBay</a>';
        return '<tr class="' + cls + '" data-k="' + esc(rw.k) + '">' +
          '<td class="n">' + esc(rw.n) + '</td>' +
          '<td class="p">' + (rw.href ? '<a href="' + esc(rw.href) + '">' + esc(rw.player) + '</a>' : esc(rw.player)) + (rw.first ? '<span class="tag" title="Carries the 1st Bowman logo — the player&#39;s first Bowman card of this kind (verified per card)">1ST</span>' : '') + '</td>' +
          '<td class="t">' + esc(third(rw)) + '</td>' +
          '<td class="v' + (m ? '' : ' none') + '">' + (m ? money(m.p) + '<small>' + (m.graded ? esc(g) + ' · ' : '') + mdy(m.asOf) + '</small>' : (g === 'Raw' ? 'no recent sales' : 'no recent ' + esc(g) + ' sales')) + '</td>' +
          '<td class="c"><label title="I have this card"><input type="checkbox" data-t="h" aria-label="Have ' + esc(rw.player) + ' ' + esc(rw.n) + '"' + (s && s.s === 'h' ? ' checked' : '') + '></label></td>' +
          '<td class="c w"><label title="I want this card"><input type="checkbox" data-t="w" aria-label="Want ' + esc(rw.player) + ' ' + esc(rw.n) + '"' + (s && s.s === 'w' ? ' checked' : '') + '></label></td>' +
          '<td class="q"><span class="qs"><button type="button" data-q="-1" aria-label="One fewer"' + (!(s && s.s === 'h') || qn <= 1 ? ' disabled' : '') + '>−</button><output aria-label="Quantity">' + qn + '</output><button type="button" data-q="1" aria-label="One more"' + (!(s && s.s === 'h') || qn >= 9 ? ' disabled' : '') + '>+</button></span></td>' +
          '<td class="g"><select aria-label="Grade">' + GRADES.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === g ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td>' +
          '<td class="l">' + link + '</td></tr>';
      }).join('') || '<tr class="clw-empty"><td colspan="9">' + (filter === 'h' ? 'Nothing ticked as Have yet — tick the cards you own.' : filter === 'w' ? 'Nothing on your Want list yet.' : filter === 'need' && !q && group < 0 ? 'You have every card on this sheet.' : 'No matches.') + '</td></tr>';
      host.querySelector('[data-clw="foot"]').textContent = list.length + ' of ' + total + ' cards shown';
      summary();
    }

    // ---- state changes ----
    function setStatus(rw, s, quiet) {   // s: 'h' | 'w' | null; quiet = no per-row analytics event (import)
      var cur = rowState(rw);
      if (cur && cur.vid) vaultRemove(cur.vid, rw.name); else if (cur) vaultRemove(null, rw.name);
      if (!s) { delete st.rows[rw.k]; persist(); return; }
      var next = { s: s, q: cur ? (cur.q || 1) : 1, g: cur ? cur.g : 'Raw', vid: null };
      var m = markFor(rw.n, next.g);
      next.vid = vaultAdd({ name: rw.name, set: data.set, cat: cat, grade: next.g, price: m ? m.p : null, status: s === 'h' ? 'own' : 'watch', page: page });
      st.rows[rw.k] = next; persist();
      if (!quiet) ga('checklist_tick', { set: slug, status: s, card: rw.name.slice(0, 90) });
    }
    host.addEventListener('change', function (e) {
      var t = e.target, tr = t.closest && t.closest('tr'); if (!tr) return;
      var rw = rows.filter(function (x) { return x.k === tr.getAttribute('data-k'); })[0]; if (!rw) return;
      if (t.matches('input[data-t]')) {
        var want = t.getAttribute('data-t'), cur = rowState(rw);
        if (!t.checked) setStatus(rw, null); else setStatus(rw, want);
        var s = rowState(rw);
        if (s && s.s === 'h' && cur && cur.s !== 'h') snack('★ In your Vault as My cards'); else if (s && s.s === 'w' && (!cur || cur.s !== 'w')) snack('Added to your Hunting list');
        draw();
      } else if (t.matches('select')) {
        var cur2 = rowState(rw);
        if (cur2) { cur2.g = t.value; if (cur2.vid) vaultRemove(cur2.vid, rw.name); var m = markFor(rw.n, cur2.g); cur2.vid = vaultAdd({ name: rw.name, set: data.set, cat: cat, grade: cur2.g, price: m ? m.p : null, status: cur2.s === 'h' ? 'own' : 'watch', page: page }); persist(); draw(); }
        else { var cell = tr.querySelector('td.v'), mm = markFor(rw.n, t.value); cell.className = 'v' + (mm ? '' : ' none'); cell.innerHTML = mm ? money(mm.p) + '<small>' + (mm.graded ? esc(t.value) + ' · ' : '') + mdy(mm.asOf) + '</small>' : (t.value === 'Raw' ? 'no recent sales' : 'no recent ' + esc(t.value) + ' sales'); }
      }
    });
    host.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b || !host.contains(b)) return;
      if (b.hasAttribute('data-q')) {
        var tr = b.closest('tr'), rw = rows.filter(function (x) { return x.k === tr.getAttribute('data-k'); })[0], s = rw && rowState(rw);
        if (!s || s.s !== 'h') return;
        s.q = Math.min(9, Math.max(1, (s.q || 1) + parseInt(b.getAttribute('data-q'), 10))); persist(); draw();
        var again = tbody.querySelector('tr[data-k="' + rw.k + '"] button[data-q="' + b.getAttribute('data-q') + '"]'); if (again && !again.disabled) again.focus();
        return;
      }
      if (b.hasAttribute('data-f')) { filter = b.getAttribute('data-f'); b.parentNode.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); draw(); return; }
      if (b.hasAttribute('data-g')) { group = +b.getAttribute('data-g'); b.parentNode.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); draw(); return; }
      if (b.hasAttribute('data-s')) {
        var k = b.getAttribute('data-s');
        if (sort.key === k) { if (sort.dir === -1) { sort = { key: 'order', dir: 1 }; } else sort.dir = -1; } else sort = { key: k, dir: 1 };
        host.querySelectorAll('th button[data-s]').forEach(function (x) { var on = x.getAttribute('data-s') === sort.key; x.setAttribute('aria-sort', on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'); x.querySelector('.ar').textContent = on ? (sort.dir === 1 ? '↑' : '↓') : '↕'; });
        draw(); return;
      }
      if (b.getAttribute('data-a') === 'csv') {
        var lines = [['number', 'card', hasTeam ? 'team' : 'rarity', 'section', 'status', 'qty', 'grade', 'value_mark_usd', 'mark_as_of', 'link'].join(',')];
        rows.forEach(function (rw) { var s = rowState(rw), m = markFor(rw.n, s ? s.g : 'Raw'); lines.push([rw.n, rw.player, third(rw), rw.g.title, s ? (s.s === 'h' ? 'have' : 'want') : '', s && s.s === 'h' ? (s.q || 1) : '', s ? s.g : '', m ? m.p : '', m ? m.asOf : '', 'https://www.shopcardhub.com' + (rw.href || page)].map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')); });
        var blob = new Blob([lines.join('\n')], { type: 'text/csv' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = slug + '-checklist.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        ga('checklist_export', { set: slug }); return;
      }
      if (b.getAttribute('data-a') === 'import') { var fi = host.querySelector('.clw-act input[type=file]'); fi.value = ''; fi.click(); return; }
      if (b.getAttribute('data-a') === 'clear') {
        var n = Object.keys(st.rows).length; if (!n) { snack('Nothing to clear'); return; }
        if (!confirm('Clear all ' + n + ' ticked cards on this checklist? They leave your Vault too.')) return;
        rows.forEach(function (rw) { if (rowState(rw)) setStatus(rw, null); });
        ga('checklist_clear', { set: slug }); draw(); snack('Checklist cleared'); return;
      }
    });
    input.addEventListener('input', function () { q = nk(input.value.trim()); draw(); });

    /* ---- Import CSV: the columns Export writes, matched by card number; merge, never wipe ---- */
    function parseCsv(text) {   // RFC-4180-ish: quoted fields, doubled quotes, CRLF; returns rows of strings
      var out = [], row = [], f = '', i = 0, c, inQ = false; text = String(text).replace(/^﻿/, '');
      for (; i < text.length; i++) {
        c = text[i];
        if (inQ) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else inQ = false; } else f += c; }
        else if (c === '"') inQ = true;
        else if (c === ',') { row.push(f); f = ''; }
        else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(function (x) { return x !== ''; })) out.push(row); row = []; }
        else f += c;
      }
      row.push(f); if (row.some(function (x) { return x !== ''; })) out.push(row);
      return out;
    }
    function importCsv(text) {
      var table = parseCsv(text); if (table.length < 2) return { err: 'That file has no rows.' };
      var hdr = table[0].map(function (h) { return nk(h).replace(/[^a-z0-9]/g, ''); });
      var col = function () { for (var a = 0; a < arguments.length; a++) { var j = hdr.indexOf(arguments[a]); if (j > -1) return j; } return -1; };
      var iN = col('number', 'num', 'no', 'card', 'cardnumber'), iS = col('status', 'have', 'own'), iQ = col('qty', 'quantity', 'count'), iG = col('grade', 'condition');
      if (iN < 0) return { err: 'No "number" column — export a checklist from this page and import that file.' };
      if (iS < 0) return { err: 'No "status" column (have / want).' };
      var byK = {}; rows.forEach(function (rw) { byK[rw.k] = rw; });
      var added = 0, same = 0, skipped = 0, unknown = 0;
      table.slice(1).forEach(function (r) {
        var rw = byK[num(r[iN])]; if (!rw) { unknown++; return; }
        var sv = nk(r[iS] || '').trim(), s = /^(have|h|own|owned|yes|x|1|true)$/.test(sv) ? 'h' : /^(want|w|hunting|watch|wish)$/.test(sv) ? 'w' : null;
        if (!s) { skipped++; return; }   // a blank status never clears a tick on this device
        var qv = iQ > -1 ? parseInt(r[iQ], 10) : NaN, qn = s === 'h' && qv >= 1 ? Math.min(9, qv) : 1;
        var gv = iG > -1 ? String(r[iG] || '').trim() : '', gn = GRADES.filter(function (o) { return o[0].toLowerCase() === gv.toLowerCase(); })[0]; gn = gn ? gn[0] : 'Raw';
        var cur = rowState(rw);
        if (cur && cur.s === s && (cur.q || 1) === qn && cur.g === gn) { same++; return; }
        // seed the row with the file's qty/grade, then write it through setStatus so the Vault mirror agrees (old card out, new in)
        st.rows[rw.k] = { s: s, q: qn, g: gn, vid: cur ? cur.vid : null };
        setStatus(rw, s, true); added++;
      });
      return { added: added, same: same, skipped: skipped, unknown: unknown };
    }
    host.querySelector('.clw-act input[type=file]').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var res = importCsv(rd.result || '');
        if (res.err) { snack(res.err); return; }
        draw();
        var msg = res.added ? 'Imported ' + res.added + ' card' + (res.added === 1 ? '' : 's') : 'Nothing new to import';
        if (res.same) msg += ' · ' + res.same + ' already ticked'; if (res.unknown) msg += ' · ' + res.unknown + ' row' + (res.unknown === 1 ? '' : 's') + ' not on this sheet';
        snack(msg); ga('checklist_import', { set: slug, n: res.added });
      };
      rd.onerror = function () { snack('Could not read that file.'); };
      rd.readAsText(f);
    });
    draw();
  }

  function init() {
    var hosts = document.querySelectorAll('[data-checklist-sheet]'); if (!hosts.length) return;
    var stEl = document.createElement('style'); stEl.textContent = CSS; document.head.appendChild(stEl);
    hosts.forEach(function (host) {
      host.classList.add('clw'); host.classList.remove('clp-static');   // the generator's static fallback styles stop here
      var gradesUrl = host.getAttribute('data-grades');
      var loads = [
        fetch(host.getAttribute('data-checklist-sheet'), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
        idxFetch().catch(function () { return null; }),
        gradesUrl ? fetch(gradesUrl, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null)
      ];
      Promise.all(loads).then(function (res) {
        var data = res[0];
        if (!data || !(data.groups || []).some(function (g) { return (g.cards || []).length; })) { host.innerHTML = '<p class="clw-sub">This checklist has not been published yet.</p>'; return; }
        render(host, data, res[1], res[2]);
      }).catch(function () { host.innerHTML = '<p class="clw-sub">The checklist failed to load — <a href="' + esc(host.getAttribute('data-checklist-sheet')) + '">raw data</a>.</p>'; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
