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
    '.idx-chart .ic-rc{stroke-dasharray:5 4;opacity:.6}.idx-chart .ic-inc{stroke:var(--dim,#5a7880);stroke-width:1;stroke-dasharray:2 3;opacity:.6}' +
    '.idx-chart .ic-k{display:inline-block;width:14px;height:0;border-top:2px dashed var(--dim,#5a7880);vertical-align:middle;margin:0 3px}.idx-chart .ic-kl{border-top-style:solid;border-color:var(--th,#e4f0f4)}' +
    '.idx-chart .ic-note{font-size:11px;line-height:1.45;color:var(--dim,#5a7880);margin-top:6px;text-transform:none;letter-spacing:0}' +
    '.idx-chart .ic-rw{fill:var(--dim,#5a7880);opacity:.13}.idx-chart text.ic-rwl{font-size:9px;letter-spacing:1px;text-transform:uppercase}' +
    '.idx-chart .ic-one{font-family:var(--fm,ui-monospace,monospace);font-size:11px;color:var(--dim,#5a7880);padding:6px 0}';
  /* Sep 30 2026 (Mo): LOG scale, and the index runs from its RELEASE base (or the first reliable month for sets older than
   * PriceCharting's history), not from our inception. The reconstructed months (data/indices.json .recon, monthly,
   * labelled) draw dashed and dim; the live marks draw solid from inception on. X is time, so a month and a twice-weekly
   * mark take their real widths. Equal % moves are equal heights. */
  var NICE = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000];
  function t(d) { return Date.parse(String(d).length === 7 ? d + '-15T00:00:00Z' : String(d).slice(0, 10) + 'T00:00:00Z'); }
  function mlabel(d) { var p = String(d).split('-'); return MON[+p[1] - 1] + (String(d).length === 7 ? ' ’' + p[0].slice(2) : ' ' + (+p[2])); }
  /* Oct 1 2026 (Mo, Bowman on the release-date base): a ticker with releaseWindowDays shades the first N days after street —
   * the release-premium window, when most 1st Bowman autos print their high and slide as supply posts (Bowman KB 04 §2).
   * A band only; it never changes a level. */
  function chart(rc, h, tk, v) {
    var W = 720, H = 220, pl = 10, pr = 58, pt = 16, pb = 24;
    var pts = rc.map(function (r) { return { t: t(r.month), v: r.level, rc: 1, d: r.month }; })
      .concat(h.map(function (r) { return { t: t(r.date), v: r.level, rc: 0, d: r.date }; }));
    var lv = pts.map(function (p) { return p.v; });
    var lo = Math.log(Math.min.apply(null, lv.concat([100]))), hi = Math.log(Math.max.apply(null, lv.concat([100])));
    var pad = Math.max((hi - lo) * 0.12, 0.03), y0 = lo - pad, y1 = hi + pad;
    var t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    var X = function (tt) { return pl + ((tt - t0) / ((t1 - t0) || 1)) * (W - pl - pr); };
    var Y = function (v) { return pt + (1 - (Math.log(v) - y0) / (y1 - y0)) * (H - pt - pb); };
    var path = function (a) { return a.map(function (p, i) { return (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' '); };
    var live = pts.filter(function (p) { return !p.rc; }), rec = pts.filter(function (p) { return p.rc; });
    if (rec.length && live.length) rec.push(live[0]);
    var all = path(pts), area = all + ' L' + X(t1).toFixed(1) + ' ' + (H - pb) + ' L' + X(t0).toFixed(1) + ' ' + (H - pb) + ' Z';
    var ticks = NICE.filter(function (v) { var l = Math.log(v); return v !== 100 && l > y0 && l < y1; });
    while (ticks.length > 4) ticks = ticks.filter(function (_, i) { return i % 2 === 0; });
    var tk_ = ticks.map(function (v) { var ty = Y(v); if (Math.abs(ty - Y(100)) < 14) return '';
      return '<line class="ic-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + ty.toFixed(1) + '" y2="' + ty.toFixed(1) + '"/><text x="' + (W - pr + 6) + '" y="' + (ty + 4).toFixed(1) + '">' + v + '</text>'; }).join('');
    var ref = '<line class="ic-ref" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(100).toFixed(1) + '" y2="' + Y(100).toFixed(1) + '"/><text x="' + (W - pr + 6) + '" y="' + (Y(100) + 4).toFixed(1) + '">100</text>';
    var xl = [], lastX = -1e9, n = 6;
    for (var i = 0; i <= n; i++) { var tt = t0 + (t1 - t0) * i / n, best = pts[0];
      pts.forEach(function (p) { if (Math.abs(p.t - tt) < Math.abs(best.t - tt)) best = p; });
      var x = X(best.t); if (x - lastX < 70) continue; lastX = x;
      xl.push('<text x="' + x.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="' + (i === n ? 'end' : i === 0 ? 'start' : 'middle') + '">' + esc(best.rc ? mlabel(best.d) : dstr(best.d)) + '</text>'); }
    var marks = live.length <= 40 ? live.map(function (p) { return '<circle class="ic-mk" cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="2"/>'; }).join('') : '';
    var e = pts[pts.length - 1], ex = X(e.t), ey = Y(e.v);
    var lastLbl = '<text class="ic-last" x="' + (ex - 6).toFixed(1) + '" y="' + (ey < pt + 16 ? ey + 16 : ey - 8).toFixed(1) + '" text-anchor="end">' + num(e.v, 2) + '</text>';
    var band = '';
    if (v && v.releaseWindowDays && v.releaseDate) { var r0 = Math.max(t(v.releaseDate), t0), r1 = Math.min(t(v.releaseDate) + v.releaseWindowDays * 864e5, t1);
      if (r1 > r0) band = '<rect class="ic-rw" x="' + X(r0).toFixed(1) + '" y="' + pt + '" width="' + Math.max(X(r1) - X(r0), 2).toFixed(1) + '" height="' + (H - pt - pb) + '"/><text class="ic-rwl" x="' + (X(r0) + 4).toFixed(1) + '" y="' + (pt + 10) + '">release window</text>'; }
    var incep = rec.length && live.length ? '<line class="ic-inc" x1="' + X(live[0].t).toFixed(1) + '" x2="' + X(live[0].t).toFixed(1) + '" y1="' + pt + '" y2="' + (H - pb) + '"/>' : '';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(tk) + ' level on a log scale, 100 = base month">' + band + tk_ + '<path class="ic-area" d="' + area + '"/>' + ref + incep +
      (rec.length ? '<path class="ic-line ic-rc" d="' + path(rec) + '"/>' : '') + (live.length > 1 ? '<path class="ic-line" d="' + path(live) + '"/>' : '') + marks +
      '<circle class="ic-dot" cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="3.5"/>' + lastLbl + xl.join('') + '</svg>';
  }
  function paint(el, v, tk) {
    var h = (v.history || []).filter(function (r) { return r && r.level != null && isFinite(r.level) && r.level > 0; });
    var rc = (v.recon || []).filter(function (r) { return r && r.level > 0; });
    if (!h.length) { el.innerHTML = '<div class="ic-one">Pre-activation — the level starts on the first verified sold reads.</div>'; return; }
    var last = h[h.length - 1];
    if (h.length + rc.length < 2) { el.innerHTML = '<div class="ic-one">One mark so far (' + esc(dstr(last.date)) + ' · ' + num(last.level, 2) + '). The line starts at the next re-mark — no history is invented.</div>'; return; }
    var since = last.level - 100, wk = h.length > 1 ? (last.level / h[h.length - 2].level - 1) * 100 : null;
    var base = v.baseDate ? mlabel(v.baseDate).replace('’', '20') : dstr(h[0].date);
    el.classList.toggle('dn', last.level < 100);
    el.innerHTML = chart(rc, h, tk, v) + '<div class="ic-cap"><span><b>' + esc(tk) + '</b> · 100 = ' + esc(base) + (v.baseRule === 'release' ? (String(v.releaseDate || '').slice(0, 7) === v.baseDate ? ' (release month)' : ' (first month after release)') : v.baseRule ? ' (first reliable month)' : '') + ' · log scale' +
      (rc.length ? ' · <i class="ic-k"></i> monthly, reconstructed · <i class="ic-k ic-kl"></i> live marks since ' + esc(dstr(h[0].date)) : '') + '</span><span>since ' + (v.baseRule === 'release' ? 'release' : 'base') + ' <b>' + (since > 0 ? '+' : '') + num(since, 2) + '%</b> · w/w <b>' + (wk == null ? '—' : (wk > 0 ? '+' : '') + num(wk, 1) + '%') + '</b> · last ' + esc(dstr(last.date)) + '</span></div>' +
      (v.baseNote ? '<div class="ic-note">' + esc(v.baseNote) + '.' + (rc.length ? ' Months before ' + esc(dstr(h[0].date)) + ' are reconstructed from PriceCharting’s monthly ungraded price history with today’s basket; live marks since.' : '') + (v.releaseWindowDays ? ' Shaded: the first ' + v.releaseWindowDays + ' days after release, when most new Bowman cards print their high before supply catches up.' : '') + '</div>' : '');
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
