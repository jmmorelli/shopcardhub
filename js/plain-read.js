/* plain-read.js — the plain-English read on every set-index page (Sep 27 2026, Mo: "I don't want people to get to
 * the site and be like 'what the heck is this'"). Progressive disclosure: a new collector sees one verdict word,
 * two sentences and how to read the big number; the quant strip (divisor, effective holdings, weight skew, HHI note)
 * folds behind "Show the numbers". Nothing is removed — one click brings it back, and the choice is remembered.
 *
 * Self-discovering so generated blocks never need hand edits: for every .idx-chart[data-ticker] on the page it
 * inserts the read just above the chart, and folds the stats block that follows it (.stats + .statnote on the
 * Pokémon chase pages, .sidx-stats on sector-model blocks). Every figure comes from /data/indices.json — the same
 * file the level box renders from. Descriptive only: an index is a measurement, not a call.
 */
(function () {
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
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

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
    var h = r.history || [], n = h.length;
    if (!n) return null;
    var level = h[n - 1].level, prev = n > 1 ? h[n - 2].level : null;
    var wk = prev ? (level / prev - 1) * 100 : null;
    var since = level - 100;
    var basket = (r.basket || []).filter(function (c) { return typeof c.price === 'number' && c.price > 0; });
    var name = setName(r), started = day(r.inception || h[0].date);
    // Sep 30 2026 rebase: 100 = the set's release month (or first reliable month), so "since" reads against that, not our start.
    var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var baseTxt = r.baseDate ? (r.baseRule === 'release' ? 'in ' + MN[+r.baseDate.slice(5, 7) - 1] + ' ' + r.baseDate.slice(0, 4) + ', when the set came out' : 'in ' + MN[+r.baseDate.slice(5, 7) - 1] + ' ' + r.baseDate.slice(0, 4) + ', the earliest month with reliable sales data') : null;
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
    if (movers.length) bits.push('Biggest move last week: <b>' + esc(movers[0].c.name) + '</b>, ' + (movers[0].p < 0 ? 'down ' : 'up ') + Math.abs(movers[0].p).toFixed(0) + '%.');
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

  function mount(data) {
    var charts = document.querySelectorAll('.idx-chart[data-ticker]');
    var show = getPref();
    Array.prototype.forEach.call(charts, function (chart) {
      var k = chart.getAttribute('data-ticker'), r = data[k];
      if (!r || typeof r !== 'object' || chart.previousElementSibling && chart.previousElementSibling.classList.contains('pr')) return;
      var html = build(k, r); if (!html) return;
      var box = document.createElement('div'); box.className = 'pr'; box.setAttribute('data-plain', k);
      var sec = chart.closest('section.sidx'); if (sec) box.style.setProperty('--pr-acc', 'var(--sidx)');
      box.innerHTML = html;
      chart.parentNode.insertBefore(box, chart);

      var targets = foldTargets(chart);
      if (!targets.length) return;
      var fold = document.createElement('div'); fold.className = 'pr-fold'; fold.id = 'pr-fold-' + k.toLowerCase();
      targets[0].parentNode.insertBefore(fold, targets[0]);
      targets.forEach(function (t) { fold.appendChild(t); });
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'pr-tg'; btn.setAttribute('aria-controls', fold.id);
      function paint(on) { fold.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false'); btn.textContent = on ? 'Hide the numbers ▴' : 'Show the numbers ▾'; }
      btn.addEventListener('click', function () {
        var on = fold.hidden; setPref(on);
        Array.prototype.forEach.call(document.querySelectorAll('.pr-fold'), function (f) { f.hidden = !on; });
        Array.prototype.forEach.call(document.querySelectorAll('.pr-tg'), function (b) { b.setAttribute('aria-expanded', on ? 'true' : 'false'); b.textContent = on ? 'Hide the numbers ▴' : 'Show the numbers ▾'; });
        if (typeof gtag === 'function') gtag('event', 'show_numbers', { on: on ? 1 : 0, page: location.pathname });
      });
      box.appendChild(btn);
      paint(show);
    });
  }

  function go() {
    if (!document.querySelector('.idx-chart[data-ticker]')) return;
    fetch('/data/indices.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(mount).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
