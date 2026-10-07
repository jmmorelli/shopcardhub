/* plain-read.js — the plain-English read on every set-index page (Sep 27 2026, Mo: "I don't want people to get to
 * the site and be like 'what the heck is this'"). Progressive disclosure: a new collector sees one verdict word,
 * two sentences and how to read the big number; the quant strip (divisor, effective holdings, weight skew, HHI note)
 * folds behind "Show the numbers". Nothing is removed — one click brings it back, and the choice is remembered.
 *
 * Self-discovering so generated blocks never need hand edits: for every .idx-chart[data-ticker] on the page it
 * inserts the read just above the chart, and folds the stats block that follows it (.stats + .statnote on the
 * Pokémon chase pages, .sidx-stats on sector-model blocks). Every figure comes from /data/indices.json — the same
 * file the level box renders from. Descriptive only: an index is a measurement, not a call.
 *
 * Night Crew Oct 3 2026 (B29): the read used to arrive ~1 s after paint (it waits on indices.json) and pushed the chart
 * and everything below ~190-390 px — load CLS 0.1-0.24 at 1024 on the set-index pages. tools/build-sector-index.mjs now
 * bakes the read, its button and the folded stats into the page (it require()s build() and PR_CSS from this file), so
 * on those pages mount() only refreshes the text if the data moved and wires the button. Other pages work as before.
 */
/* B37 (Night Crew Oct 6): one shared /data/indices.json request per page (window.schIdx), whoever asks first */
(function () {
  var HAS_DOM = typeof document !== 'undefined';
  var KEY = 'sch-show-numbers';
  function getPref() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setPref(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }

  var css = '' +
    '.pr{margin:16px 0 14px;border:1px solid var(--bd,#23303d);border-left:3px solid var(--pr-acc,#00ccf5);border-radius:3px;background:var(--p2,#0e151c);padding:14px 16px;}' +
    '.pr-top{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 6px;}' +
    '.pr-eb{font-family:var(--fd,inherit);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--dim,#8a97a5);}' +
    '.pr-v{font-family:var(--fd,inherit);font-weight:700;font-size:20px;letter-spacing:.5px;color:var(--th,#fff);}' +
    '.pr-v.up{color:var(--gn,#2bd17e);}.pr-v.dn{color:var(--rd,#ff4d6a);}' +
    '.pr p{margin:4px 0;font-size:15px;line-height:1.55;color:var(--tx,#d6dde4);max-width:78ch;}' +
    '.pr p b{color:var(--th,#fff);}' +
    '.pr .pr-key{font-size:13px;color:var(--dim,#8a97a5);}' +
    '.pr .pr-key b{color:var(--tx,#d6dde4);}' +
    '.pr-foot{margin-top:8px;font-size:12px;color:var(--dim,#8a97a5);}' +
    '.pr-tg{display:inline-block;margin:10px 0 0;background:none;border:1px solid var(--bd,#23303d);color:var(--tx,#d6dde4);font:600 12px/1 var(--fd,inherit);letter-spacing:1.2px;text-transform:uppercase;padding:8px 12px;border-radius:2px;cursor:pointer;}' +
    '.pr-tg:hover{border-color:var(--pr-acc,#00ccf5);color:var(--th,#fff);}' +
    '.pr-fold[hidden]{display:none!important;}' +
    '@media(max-width:700px){.pr{padding:12px;}.pr p{font-size:14px;}.pr-v{font-size:18px;}}';
  if (HAS_DOM && !document.getElementById('pr-css')) { var st = document.createElement('style'); st.id = 'pr-css'; st.textContent = css; document.head.appendChild(st); }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function money(v) { return '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2)); }
  function day(s) { var d = new Date(String(s).slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  function setName(r) {
    if (r.set) return r.set;
    return String(r.name || '').replace(/\s*(Chase|Set|Class)?\s*Index\s*$/i, '').trim();
  }

  function verdict(wk) {
    if (wk == null) return { w: 'Just started tracking', c: '' };
    if (wk >= 3) return { w: 'Heating up', c: 'up' };
    if (wk >= 1) return { w: 'Warming up', c: 'up' };
    if (wk > -1) return { w: 'Holding steady', c: '' };
    if (wk > -3) return { w: 'Cooling off', c: 'dn' };
    return { w: 'Sliding', c: 'dn' };
  }

  function build(k, r) {
    // iw-2026-10-07-1: rows with kind "divisor" (holo rule, reconstitution) are level-neutral changes of measure, not marks —
    // they never set "last week", and while the newest row is one of them the basket's prevPrice is a window change, so no "biggest move".
    var raw = r.history || [], h = raw.filter(function (x) { return x && x.kind !== 'divisor'; }), n = h.length;
    var measureChanged = raw.length && raw[raw.length - 1].kind === 'divisor';
    if (!n) return null;
    var level = h[n - 1].level, prev = n > 1 ? h[n - 2].level : null;
    var wk = prev ? (level / prev - 1) * 100 : null;
    var since = level - 100;
    var basket = (r.basket || []).filter(function (c) { return typeof c.price === 'number' && c.price > 0 && c.w !== 0; });   // w 0 = tracked on its own line, not in the level (TH26 RGB Mews, Oct 4 2026)
    var name = setName(r), started = day(r.inception || h[0].date);
    // Sep 30 2026 rebase: 100 = the set's release month (or first reliable month), so "since" reads against that, not our start.
    var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // Oct 4 2026 (Pokémon KB G9): a release base month that is not the street-date month (AH26: Jan 30 release, 100 = Feb)
    // says so instead of "when the set came out".
    var relLate = r.baseRule === 'release' && r.releaseDate && r.releaseDate.slice(0, 7) !== r.baseDate;
    var relTxt = relLate ? ', the first full month of sales after the ' + MN[+r.releaseDate.slice(5, 7) - 1] + ' ' + (+r.releaseDate.slice(8, 10)) + ', ' + r.releaseDate.slice(0, 4) + ' release' : ', when the set came out';
    var baseTxt = r.baseDate ? (r.baseRule === 'release' ? 'in ' + MN[+r.baseDate.slice(5, 7) - 1] + ' ' + r.baseDate.slice(0, 4) + relTxt : 'in ' + MN[+r.baseDate.slice(5, 7) - 1] + ' ' + r.baseDate.slice(0, 4) + ', the earliest month with reliable sales data') : null;
    var v = verdict(wk);
    var out = [];

    // sentence 1 — where the set is vs day one
    var s1;
    if (n < 2 && !baseTxt) {
      s1 = 'We started tracking the <b>' + basket.length + ' most-traded cards</b> in ' + esc(name) + ' on ' + started + '. There is no trend yet — the first weekly move posts after the next price update.';
    } else if (baseTxt) {
      s1 = 'The <b>' + basket.length + ' cards</b> we track in ' + esc(name) + ' are worth <b>' + (Math.abs(since) < 0.5 ? 'about the same' : Math.abs(since).toFixed(1) + '% ' + (since < 0 ? 'less' : 'more')) + '</b> together than ' + baseTxt + '.';
    } else if (Math.abs(since) < 0.5) {
      s1 = 'The <b>' + basket.length + ' cards</b> we track in ' + esc(name) + ' are worth <b>about the same</b> as when we started on ' + started + '.';
    } else {
      s1 = 'The <b>' + basket.length + ' cards</b> we track in ' + esc(name) + ' are worth <b>' + Math.abs(since).toFixed(1) + '% ' + (since < 0 ? 'less' : 'more') + '</b> together than when we started on ' + started + '.';
    }
    if (wk != null) s1 += ' Last week: <b>' + (Math.abs(wk) < 0.05 ? 'flat' : (wk < 0 ? 'down ' : 'up ') + Math.abs(wk).toFixed(1) + '%') + '</b>.';
    out.push('<p>' + s1 + '</p>');

    // sentence 2 — the priciest card and last week's biggest mover
    var bits = [];
    var top = basket.slice().sort(function (a, b) { return b.price - a.price; })[0];
    if (top) bits.push('Priciest card: <b>' + esc(top.name) + '</b>' + (top.num ? ' (#' + esc(top.num) + ')' : '') + ', about ' + money(top.price) + ' on recent sales.');
    var movers = basket.filter(function (c) { return typeof c.prevPrice === 'number' && c.prevPrice > 0 && c.price >= 10; })
      .map(function (c) { return { c: c, p: (c.price / c.prevPrice - 1) * 100 }; })
      .filter(function (m) { return Math.abs(m.p) >= 1; })
      .sort(function (a, b) { return Math.abs(b.p) - Math.abs(a.p); });
    if (movers.length && !measureChanged) bits.push('Biggest move last week: <b>' + esc(movers[0].c.name) + '</b>, ' + (movers[0].p < 0 ? 'down ' : 'up ') + Math.abs(movers[0].p).toFixed(0) + '%.');
    if (bits.length) out.push('<p>' + bits.join(' ') + '</p>');

    // how to read the big number
    var key = 'How to read the big number: it started at <b>100</b>. ';
    if (n < 2 || Math.abs(since) < 0.5) key += 'Above 100 means these cards got pricier; below 100 means cheaper.';
    else key += '<b>' + level.toFixed(2) + '</b> means these cards cost about ' + Math.abs(since).toFixed(0) + '% ' + (since < 0 ? 'less' : 'more') + ' than on day one.';
    out.push('<p class="pr-key">' + key + '</p>');

    return '<div class="pr-top"><span class="pr-eb">The plain read</span><span class="pr-v ' + v.c + '">' + v.w + '</span></div>' + out.join('') +
      '<div class="pr-foot">This tracks prices — it doesn’t tell you to buy or sell. Cards are long holds, so the 6–12 month picture matters more than any one week.</div>';
  }

  function foldTargets(chart) {
    var t = [], el = chart.nextElementSibling, guard = 0;
    while (el && guard++ < 6) {
      if (el.matches('.stats, .statnote, .sidx-stats')) t.push(el);
      else if (el.tagName !== 'SCRIPT') { if (t.length) break; }
      el = el.nextElementSibling;
    }
    return t;
  }

  function label(on) { return on ? 'Hide the numbers ▴' : 'Show the numbers ▾'; }
  function mount(data) {
    var charts = document.querySelectorAll('.idx-chart[data-ticker]');
    var show = getPref();
    Array.prototype.forEach.call(charts, function (chart) {
      var k = chart.getAttribute('data-ticker'), r = data[k];
      if (!r || typeof r !== 'object') return;
      var prev = chart.previousElementSibling, box = prev && prev.classList.contains('pr') ? prev : null;
      if (box && box.getAttribute('data-wired')) return;
      var html = build(k, r); if (!html && !box) return;
      var inner;
      if (box) {                                          /* baked by the generator: refresh only if the data moved since the bake */
        inner = box.querySelector('.pr-in');
        if (html && inner && inner.innerHTML !== html) inner.innerHTML = html;
      } else {
        box = document.createElement('div'); box.className = 'pr'; box.setAttribute('data-plain', k);
        var sec = chart.closest('section.sidx'); if (sec) box.style.setProperty('--pr-acc', 'var(--sidx)');
        box.innerHTML = '<div class="pr-in">' + html + '</div>';
        chart.parentNode.insertBefore(box, chart);
      }
      box.setAttribute('data-wired', '1');

      var fold = document.getElementById('pr-fold-' + k.toLowerCase());
      if (!fold) {
        var targets = foldTargets(chart);
        if (!targets.length) return;
        fold = document.createElement('div'); fold.className = 'pr-fold'; fold.id = 'pr-fold-' + k.toLowerCase();
        targets[0].parentNode.insertBefore(fold, targets[0]);
        targets.forEach(function (t) { fold.appendChild(t); });
      }
      var btn = box.querySelector('.pr-tg');
      if (!btn) { btn = document.createElement('button'); btn.type = 'button'; btn.className = 'pr-tg'; btn.setAttribute('aria-controls', fold.id); box.appendChild(btn); }
      function paint(on) { fold.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false'); btn.textContent = label(on); }
      btn.addEventListener('click', function () {
        var on = fold.hidden; setPref(on);
        Array.prototype.forEach.call(document.querySelectorAll('.pr-fold'), function (f) { f.hidden = !on; });
        Array.prototype.forEach.call(document.querySelectorAll('.pr-tg'), function (b) { b.setAttribute('aria-expanded', on ? 'true' : 'false'); b.textContent = label(on); });
        if (typeof gtag === 'function') gtag('event', 'show_numbers', { on: on ? 1 : 0, page: location.pathname });
      });
      paint(show);
    });
  }

  /* the baked form (tools/build-sector-index.mjs): the same box mount() builds, with the stats folded by default */
  function bakeBox(k, r, accent) {
    var html = build(k, r); if (!html) return '';
    var id = 'pr-fold-' + String(k).toLowerCase();
    return '<div class="pr" data-plain="' + esc(k) + '"' + (accent ? ' style="--pr-acc:' + esc(accent) + '"' : '') + '><div class="pr-in">' + html + '</div>' +
      '<button type="button" class="pr-tg" aria-controls="' + id + '" aria-expanded="false">' + label(false) + '</button></div>';
  }

  function go() {
    if (!document.querySelector('.idx-chart[data-ticker]')) return;
    (window.schIdx = window.schIdx || function () { return window.__schIdxP || (window.__schIdxP = fetch('/data/indices.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(function (e) { window.__schIdxP = null; throw e; })); })().then(mount).catch(function () {});
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { build: build, bakeBox: bakeBox, PR_CSS: css };
  if (!HAS_DOM) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
