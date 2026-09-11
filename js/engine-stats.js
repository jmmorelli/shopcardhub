/* engine-stats.js — the one place the site does return math (Terminal step 2, Sep 11 2026).
 * Shared by js/engine-block.js (card-page stat band), js/home.js (dashboard screens) and
 * tools/build-home.mjs (pre-render). UMD: window.SCH_STATS in the browser, module.exports in Node.
 *
 *   returns(ys)      night-over-night % returns of a mark series
 *   moments(r)       population σ / skew / excess kurtosis (normal = 0) of a return series; null under 3 returns
 *   pctChange(a, b)  (b / a − 1) × 100, null when either side is missing
 *   sparkSVG(ys, w, h, cls)  tiny inline line, class-coloured (up/dn) by first→last
 *   fmt / num / pct / dstr   number + date formatting used by every terminal surface
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SCH_STATS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function returns(ys) { var r = []; for (var i = 1; i < ys.length; i++) if (ys[i - 1] > 0 && ys[i] != null) r.push((ys[i] / ys[i - 1] - 1) * 100); return r; }
  function moments(r) {
    var n = r.length; if (n < 3) return null;
    var mu = 0; for (var i = 0; i < n; i++) mu += r[i]; mu /= n;
    var m2 = 0, m3 = 0, m4 = 0;
    for (var j = 0; j < n; j++) { var d = r[j] - mu; m2 += d * d; m3 += d * d * d; m4 += d * d * d * d; }
    m2 /= n; m3 /= n; m4 /= n;
    var sd = Math.sqrt(m2); if (!(sd > 0)) return { n: n, sd: 0, skew: null, kurt: null };
    return { n: n, sd: sd, skew: m3 / (sd * sd * sd), kurt: m4 / (m2 * m2) - 3 };
  }
  function pctChange(a, b) { return a > 0 && b != null && isFinite(b) ? (b / a - 1) * 100 : null; }
  function num(n, d) { if (n == null || !isFinite(n)) return '—'; return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function fmt(n) { if (n == null || !isFinite(n)) return '—'; return '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 100 ? String(Math.round(n)) : Number(n).toFixed(2)); }
  function pct(n, d) { if (n == null || !isFinite(n)) return '—'; return (n > 0 ? '+' : '') + num(n, d == null ? 1 : d) + '%'; }
  function sgn(n) { if (n == null || !isFinite(n)) return '—'; return (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n)); }
  function cls(n) { return n > 0 ? 'up' : n < 0 ? 'dn' : 'flat'; }
  function dstr(d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1] + ' ' + (+p[2]); }
  function sparkSVG(ys, w, h) {
    w = w || 72; h = h || 22;
    var s = (ys || []).filter(function (v) { return v != null && isFinite(v); });
    if (s.length < 2) return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"></svg>';
    var lo = Math.min.apply(null, s), hi = Math.max.apply(null, s), r = hi - lo || 1;
    var pts = s.map(function (v, i) { return [(i / (s.length - 1)) * (w - 2) + 1, h - 2 - ((v - lo) / r) * (h - 4)]; });
    var c = s[s.length - 1] >= s[0] ? 'up' : 'dn';
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var e = pts[pts.length - 1];
    return '<svg class="spark ' + c + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="' + d + '"/><circle cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="1.8"/></svg>';
  }
  return { returns: returns, moments: moments, pctChange: pctChange, num: num, fmt: fmt, pct: pct, sgn: sgn, cls: cls, dstr: dstr, sparkSVG: sparkSVG };
});
