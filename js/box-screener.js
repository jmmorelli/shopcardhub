/* box-screener.js — sort, filter and fit profiles for the box table on /best-hobby-boxes-2026.
   Box Desk, Oct 20 2026 (spec claude/handoffs/box-screener-2026-10-20.md §3B–D, §7).
   The rows are baked into the HTML by tools/build-box-screener.mjs; this file only reorders and hides them,
   using the inline JSON in #bx-data. No framework. GA4: box_sort {col}, box_filter {sport|format|window|price},
   box_profile {profile}. Nothing is sent from automated browsers (navigator.webdriver), the same skip gtag uses. */
(function () {
  'use strict';
  var dataEl = document.getElementById('bx-data');
  var table = document.getElementById('bx-t');
  if (!dataEl || !table) return;
  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var tbody = table.tBodies[0];
  var ctl = document.getElementById('bx-ctl');
  var countEl = document.getElementById('bx-count');
  var moreBtn = document.getElementById('bx-more');
  var phoneMQ = window.matchMedia('(max-width:600px)');
  var byId = {};
  D.rows.forEach(function (r) { byId[r.id] = r; });
  var trs = [].slice.call(tbody.rows);
  var trById = {};
  trs.forEach(function (tr) { trById[tr.getAttribute('data-id')] = tr; });
  var colDef = {};
  D.cols.forEach(function (c) { colDef[c.k] = c; });
  var profName = {};
  D.profiles.forEach(function (p) { profName[p.id] = p.name; });

  var state = { sport: '', format: '', recent: false, band: '', profile: '', sortCol: 'sold', sortDir: 'asc', expanded: false, cols: null, userCols: false };

  window.__bxLog = window.__bxLog || [];
  function track(name, params) {
    window.__bxLog.push([name, params]);
    if (navigator.webdriver) return;
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  /* ---------- columns ---------- */
  var styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  function defaultCols() {
    var phone = phoneMQ.matches, set = {};
    D.cols.forEach(function (c) { if (c.show.indexOf(phone ? 'p' : 'd') !== -1) set[c.k] = true; });
    if (state.profile) set.score = true;
    return set;
  }
  function applyCols() {
    var css = '';
    D.cols.forEach(function (c) { if (!state.cols[c.k]) css += '.bx-t.js [data-c="' + c.k + '"]{display:none}'; });
    styleEl.textContent = css;
    [].forEach.call(ctl.querySelectorAll('input[data-col]'), function (cb) { cb.checked = !!state.cols[cb.getAttribute('data-col')]; });
  }
  state.cols = defaultCols();
  table.classList.add('js');
  applyCols();
  var onMQ = function () { if (!state.userCols) { state.cols = defaultCols(); applyCols(); } render(); };
  if (phoneMQ.addEventListener) phoneMQ.addEventListener('change', onMQ); else if (phoneMQ.addListener) phoneMQ.addListener(onMQ);

  [].forEach.call(ctl.querySelectorAll('input[data-col]'), function (cb) {
    cb.addEventListener('change', function () {
      state.userCols = true;
      state.cols[cb.getAttribute('data-col')] = cb.checked;
      applyCols();
    });
  });

  /* ---------- sorting ---------- */
  function val(r, k) {
    if (k === 'score') return state.profile ? r.s[state.profile] : r.s[r.fit];
    return r.v[k];
  }
  function cmp(a, b) {
    var k = state.sortCol, va = val(a, k), vb = val(b, k);
    var na = va == null || va === '', nb = vb == null || vb === '';
    if (na && nb) return a.price - b.price;
    if (na) return 1;
    if (nb) return -1;
    var d = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    if (d === 0) return a.price - b.price;
    return state.sortDir === 'asc' ? d : -d;
  }

  /* ---------- filters ---------- */
  function inBand(p) {
    if (!state.band) return true;
    var lo = state.band.split('-')[0], hi = state.band.split('-')[1];
    return (lo === '' || p >= +lo) && (hi === '' || p < +hi);
  }
  function keep(r) {
    return (!state.sport || r.sport === state.sport) &&
      (!state.format || r.format === state.format) &&
      (!state.recent || r.days <= 90) &&
      inBand(r.price);
  }

  function setScores() {
    D.rows.forEach(function (r) {
      var td = trById[r.id] && trById[r.id].querySelector('td[data-c="score"] .bx-score');
      if (!td) return;
      var s = state.profile ? r.s[state.profile] : r.s[r.fit];
      td.textContent = s == null ? 'n/a' : String(s);
    });
    var th = table.querySelector('th[data-c="score"] button');
    if (th) th.textContent = state.profile ? profName[state.profile] + ' score' : 'Fit score';
  }

  function render() {
    var rows = D.rows.slice().sort(cmp);
    var shown = 0, total = 0;
    var clip = phoneMQ.matches && !state.expanded;
    rows.forEach(function (r) {
      var tr = trById[r.id];
      if (!tr) return;
      tbody.appendChild(tr);
      var ok = keep(r) && !(state.profile && r.s[state.profile] == null);
      if (ok) total++;
      var vis = ok && (!clip || total <= D.phoneRows);
      tr.hidden = !vis;
      if (vis) shown++;
    });
    [].forEach.call(table.tHead.rows[0].cells, function (th) {
      if (!th.hasAttribute('aria-sort')) return;
      th.setAttribute('aria-sort', th.getAttribute('data-c') === state.sortCol ? (state.sortDir === 'asc' ? 'ascending' : 'descending') : 'none');
    });
    var what = state.profile ? 'ranked for ' + profName[state.profile] : 'sorted by ' + (colDef[state.sortCol] ? colDef[state.sortCol].label.toLowerCase() : state.sortCol);
    countEl.textContent = (total === D.rows.length ? total + ' boxes' : total + ' of ' + D.rows.length + ' boxes') + ', ' + what;
    if (clip && total > D.phoneRows) {
      moreBtn.textContent = 'Show all ' + total + ' boxes';
      moreBtn.classList.add('on');
    } else moreBtn.classList.remove('on');
  }

  /* ---------- wiring ---------- */
  [].forEach.call(table.tHead.querySelectorAll('th button'), function (btn) {
    btn.addEventListener('click', function () {
      var k = btn.parentNode.getAttribute('data-c');
      if (state.sortCol === k) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortCol = k; state.sortDir = (colDef[k] && colDef[k].dir) || 'asc'; }
      track('box_sort', { col: k });
      render();
    });
  });

  [].forEach.call(ctl.querySelectorAll('.bx-chip'), function (chip) {
    chip.addEventListener('click', function () {
      state.sport = chip.getAttribute('data-sport');
      [].forEach.call(ctl.querySelectorAll('.bx-chip'), function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      track('box_filter', { sport: state.sport || 'all' });
      render();
    });
  });
  var fmt = document.getElementById('bx-format');
  fmt.addEventListener('change', function () { state.format = fmt.value; track('box_filter', { format: fmt.value || 'all' }); render(); });
  var band = document.getElementById('bx-band');
  band.addEventListener('change', function () { state.band = band.value; track('box_filter', { price: band.value || 'any' }); render(); });
  var recent = document.getElementById('bx-recent');
  recent.addEventListener('change', function () { state.recent = recent.checked; track('box_filter', { window: recent.checked ? '90d' : 'all' }); render(); });
  var prof = document.getElementById('bx-profile');
  prof.addEventListener('change', function () {
    state.profile = prof.value;
    if (state.profile) { state.sortCol = 'score'; state.sortDir = 'desc'; state.cols.score = true; }
    else { state.sortCol = 'sold'; state.sortDir = 'asc'; if (!state.userCols) state.cols.score = false; }
    applyCols();
    setScores();
    track('box_profile', { profile: state.profile || 'none' });
    render();
  });
  moreBtn.addEventListener('click', function () { state.expanded = true; render(); });

  /* close the column picker on an outside click */
  var colsDet = ctl.querySelector('.bx-cols');
  document.addEventListener('click', function (e) { if (colsDet.open && !colsDet.contains(e.target)) colsDet.open = false; });

  setScores();
  render();
})();
