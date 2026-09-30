/* fold-dense.js — Sep 27 2026 UX sweep (new-collector lens). Same rule as plain-read.js: simple on top,
 * depth one click away, nothing deleted. Two targets:
 *  1. Engine stat bands (.cp-strip): Signal + Supply stay visible; ROC, z-score, σ/day, skew, kurtosis,
 *     ask quartiles and median last bid fold behind "Show the numbers" (shared pref with plain-read.js);
 *     so does the "Distribution · daily returns" section of the chart fold (Site Sweep, Sep 30 2026).
 *  2. Long verdict boxes (.entry-verdict): the bold verdict line stays; the reasoning and the
 *     "What would change our mind" block (.entry-break) fold behind "Read the full case".
 * Loaded by js/engine-block.js and directly on pages with verdict boxes. Idempotent. */
(function () {
  if (window.__foldDense) return; window.__foldDense = 1;
  var KEY = 'sch-show-numbers';
  function pref() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setPref(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }
  var st = document.createElement('style');
  st.textContent = '.fd-hid{display:none!important}' +
    '.fd-btn{display:inline-block;margin:8px 0 4px;background:none;border:1px solid var(--border2,rgba(255,255,255,.18));color:var(--text-head,#e4f0f4);font:700 11px/1 var(--fm,monospace);letter-spacing:1.3px;text-transform:uppercase;padding:8px 12px;border-radius:2px;cursor:pointer}' +
    '.fd-btn:hover{border-color:var(--accent,#00ccf5)}';
  document.head.appendChild(st);
  var ADV = /^(30D ROC|z-score|σ \/ day|Skew|Kurtosis|Ask Q1.Q3|Median last bid)$/i;

  function foldStrips() {
    var strips = document.querySelectorAll('.cp-strip');
    if (!strips.length) return;
    var btns = [];
    var show = pref();
    function paint(on) {
      Array.prototype.forEach.call(document.querySelectorAll('.cp-strip .fd-adv'), function (c) { c.classList.toggle('fd-hid', !on); });
      btns.forEach(function (b) { b.textContent = on ? 'Hide the numbers ▴' : 'Show the numbers ▾'; b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
      /* Site Sweep Sep 30: the returns histogram (skew/kurtosis prose) folds with the numbers it explains */
      Array.prototype.forEach.call(document.querySelectorAll('.cp-embed .cp-sec[id^="dist-"]'), function (x) { x.classList.toggle('fd-hid', !on); });
    }
    Array.prototype.forEach.call(strips, function (strip) {
      if (strip.getAttribute('data-fd')) return; strip.setAttribute('data-fd', '1');
      Array.prototype.forEach.call(strip.querySelectorAll('.cp-cell'), function (cell) {
        var l = cell.querySelector('.l'); if (l && ADV.test(l.textContent.trim())) cell.classList.add('fd-adv');
      });
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fd-btn';
      b.addEventListener('click', function () { var on = b.getAttribute('aria-expanded') !== 'true'; setPref(on); paint(on); if (typeof gtag === 'function') gtag('event', 'show_numbers', { on: on ? 1 : 0, page: location.pathname, where: 'engine' }); });
      strip.parentNode.insertBefore(b, strip.nextSibling); btns.push(b);
    });
    paint(show);
  }

  function foldVerdicts() {
    Array.prototype.forEach.call(document.querySelectorAll('.entry-verdict'), function (v) {
      if (v.getAttribute('data-fd')) return; v.setAttribute('data-fd', '1');
      var lead = v.querySelector('strong'); if (!lead) return;
      var rest = [], n = lead.nextSibling;
      while (n) { rest.push(n); n = n.nextSibling; }
      var brk = v.nextElementSibling && v.nextElementSibling.classList.contains('entry-break') ? v.nextElementSibling : null;
      var restText = rest.map(function (x) { return x.textContent || ''; }).join('').trim();
      if (restText.length < 140 && !brk) return;
      var wrap = document.createElement('span'); wrap.className = 'fd-hid';
      rest.forEach(function (x) { wrap.appendChild(x); });
      v.appendChild(wrap);
      if (brk) brk.classList.add('fd-hid');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fd-btn'; b.textContent = 'Read the full case ▾';
      b.addEventListener('click', function () {
        var open = wrap.classList.contains('fd-hid');
        wrap.classList.toggle('fd-hid', !open); if (brk) brk.classList.toggle('fd-hid', !open);
        b.textContent = open ? 'Hide the full case ▴' : 'Read the full case ▾';
      });
      (brk || v).parentNode.insertBefore(b, (brk || v).nextSibling);
    });
  }
  function go() { foldStrips(); foldVerdicts(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
