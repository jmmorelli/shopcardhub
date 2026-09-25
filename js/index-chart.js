/* index-chart.js — the level chart on every set-index page (Sep 25 2026, Mo: the level and the line are the product;
 * put them above the fold). Reads /data/indices.json client-side (same source the /indices hub and the home board
 * read — a re-mark updates every chart with zero page edits) and draws one SVG: every history mark, a 100 reference
 * line, the last point labelled. No numbers are baked into the page, so nothing here can go stale; with JS off the
 * static level in the hero still stands. One mark → a one-line note, never an invented history.
 *
 * Markup: <div class="idx-chart" data-ticker="DR25"></div>  (styles below are injected once; the page's own
 * --p1/--bd/--th/--dim/--gn/--rd/--iac tokens colour it, so each index keeps its set theme). */
(function () {
  'use strict';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dstr(d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return MON[+p[1] - 1] + ' ' + (+p[2]); }
  function num(n, d) { return n == null || !isFinite(n) ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var CSS = '.idx-chart{margin:14px 0 0;padding:12px 14px 8px;background:var(--p1,#0c1017);border:1px solid var(--bd,rgba(255,255,255,.07));border-radius:3px}' +
    '.idx-chart svg{display:block;width:100%;height:auto;max-height:240px}' +
    '.idx-chart .ic-grid{stroke:var(--bd2,rgba(255,255,255,.12));stroke-width:1}' +
    '.idx-chart .ic-ref{stroke:var(--dim,#5a7880);stroke-width:1;stroke-dasharray:4 4}' +
    '.idx-chart .ic-line{fill:none;stroke-width:2;stroke:var(--gn,#00e07a)} .idx-chart.dn .ic-line{stroke:var(--rd,#ff2e55)}' +
    '.idx-chart .ic-area{fill:var(--gn,#00e07a);opacity:.08} .idx-chart.dn .ic-area{fill:var(--rd,#ff2e55)}' +
    '.idx-chart .ic-dot{fill:var(--gn,#00e07a)} .idx-chart.dn .ic-dot{fill:var(--rd,#ff2e55)}' +
    '.idx-chart .ic-mk{fill:var(--th,#e4f0f4);opacity:.55}' +
    '.idx-chart text{font-family:var(--fm,ui-monospace,monospace);font-size:10px;fill:var(--dim,#5a7880)}' +
    '.idx-chart text.ic-last{fill:var(--th,#e4f0f4);font-weight:700;font-size:11px}' +
    '.idx-chart .ic-cap{display:flex;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;font-family:var(--fm,ui-monospace,monospace);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--dim,#5a7880);margin-top:6px}' +
    '.idx-chart .ic-cap b{color:var(--th,#e4f0f4)}' +
    '.idx-chart .ic-one{font-family:var(--fm,ui-monospace,monospace);font-size:11px;color:var(--dim,#5a7880);padding:6px 0}';
  function chart(h, tk) {
    var W = 720, H = 220, pl = 10, pr = 58, pt = 16, pb = 24;
    var lv = h.map(function (r) { return r.level; });
    var lo = Math.min.apply(null, lv.concat([100])), hi = Math.max.apply(null, lv.concat([100]));
    var pad = (hi - lo || 1) * 0.15, y0 = lo - pad, y1 = hi + pad;
    var X = function (i) { return pl + (i / (h.length - 1)) * (W - pl - pr); };
    var Y = function (v) { return pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb); };
    var d = lv.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    var area = d + ' L' + X(h.length - 1).toFixed(1) + ' ' + (H - pb) + ' L' + X(0).toFixed(1) + ' ' + (H - pb) + ' Z';
    var ticks = [y0 + pad * 0.4, (y0 + y1) / 2, y1 - pad * 0.4].map(function (v) {
      var ty = Y(v); if (Math.abs(ty - Y(100)) < 16) return '';
      return '<line class="ic-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + ty.toFixed(1) + '" y2="' + ty.toFixed(1) + '"/><text x="' + (W - pr + 6) + '" y="' + (ty + 4).toFixed(1) + '">' + num(v, 1) + '</text>';
    }).join('');
    var ref = '<line class="ic-ref" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(100).toFixed(1) + '" y2="' + Y(100).toFixed(1) + '"/><text x="' + (W - pr + 6) + '" y="' + (Y(100) + 4).toFixed(1) + '">100</text>';
    var n = h.length, step = Math.max(1, Math.ceil(n / 6));
    var xl = h.map(function (r, i) { return (i % step === 0 || i === n - 1) ? '<text x="' + X(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="' + (i === n - 1 ? 'end' : i === 0 ? 'start' : 'middle') + '">' + esc(dstr(r.date)) + '</text>' : ''; }).join('');
    var marks = lv.map(function (v, i) { return '<circle class="ic-mk" cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="2"/>'; }).join('');
    var e = [X(n - 1), Y(lv[n - 1])];
    var lastLbl = '<text class="ic-last" x="' + (e[0] - 6).toFixed(1) + '" y="' + (e[1] < pt + 16 ? e[1] + 16 : e[1] - 8).toFixed(1) + '" text-anchor="end">' + num(lv[n - 1], 2) + '</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(tk) + ' level since inception, 100 = launch">' + ticks + '<path class="ic-area" d="' + area + '"/>' + ref + '<path class="ic-line" d="' + d + '"/>' + marks + '<circle class="ic-dot" cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="3.5"/>' + lastLbl + xl + '</svg>';
  }
  function paint(el, v, tk) {
    var h = (v.history || []).filter(function (r) { return r && r.level != null && isFinite(r.level); });
    if (!h.length) { el.innerHTML = '<div class="ic-one">Pre-activation — the level starts at 100.00 on the first verified sold reads.</div>'; return; }
    var last = h[h.length - 1], first = h[0];
    if (h.length < 2) { el.innerHTML = '<div class="ic-one">One mark so far (' + esc(dstr(first.date)) + ' · 100.00). The line starts at the next Monday re-mark — no history is invented.</div>'; return; }
    var since = last.level - 100, wk = h.length > 1 ? (last.level / h[h.length - 2].level - 1) * 100 : null;
    el.classList.toggle('dn', last.level < 100);
    el.innerHTML = chart(h, tk) + '<div class="ic-cap"><span><b>' + esc(tk) + '</b> · 100 = ' + esc(dstr(first.date)) + ' · ' + h.length + ' marks</span><span>since launch <b>' + (since > 0 ? '+' : '') + num(since, 2) + '%</b> · w/w <b>' + (wk == null ? '—' : (wk > 0 ? '+' : '') + num(wk, 1) + '%') + '</b> · last ' + esc(dstr(last.date)) + '</span></div>';
  }
  function boot() {
    var els = document.querySelectorAll('.idx-chart[data-ticker]'); if (!els.length) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    fetch('/data/indices.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
      Array.prototype.forEach.call(els, function (el) { var tk = el.getAttribute('data-ticker'), sub = el.getAttribute('data-sub'); var v = j && j[tk]; if (v && sub) { v = v.sub && v.sub[sub]; tk = tk + '·' + sub; } if (!v || typeof v !== 'object') { el.remove(); return; } try { paint(el, v, tk); } catch (e) { el.remove(); } });
    }).catch(function () { Array.prototype.forEach.call(els, function (el) { el.remove(); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
