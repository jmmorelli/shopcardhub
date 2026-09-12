/* home.js — the dashboard that is www.shopcardhub.com/ (Terminal step 2, Sep 11 2026).
 *
 * One renderer, two callers. tools/build-home.mjs requires this file in Node and pre-renders
 * every panel into the <!-- HOME:<panel>:START/END --> markers of index.html with the nightly
 * numbers, so the page is complete at rest (crawlers, JS off). In the browser the same
 * functions re-render from the live feed; if any fetch fails the pre-rendered HTML stays.
 *
 * Panels: markets (Bangers board 30D composite + every index in data/indices.json, chart),
 * engine (what the nightly did: FEED / BUY / SELL / GATE / INDEX), focus (data/home-focus.json),
 * movers (board autos by |30D ROC|), auctions (client-only, /api/auctions), screen (one table
 * over every feed card, filtered by the saved screen in the URL hash).
 *
 * Rules baked in: the board row is 1st Bowman Chrome autos only (cardType chrome-auto,
 * !boardHide) — never a Pokémon card; hammers appear only as the "closes" count; every number
 * is the engine's, labelled ask-basis. Return math lives in js/engine-stats.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine-stats.js'));
  else root.SCH_HOME = factory(root.SCH_STATS);
})(typeof self !== 'undefined' ? self : this, function (ST) {
  'use strict';
  var num = ST.num, fmt = ST.fmt, pct = ST.pct, sgn = ST.sgn, cls = ST.cls, dstr = ST.dstr;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var FEED = 'https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data';

  /* ---------- screens (saved filters over the feed) ---------- */
  var SCREENS = {
    board: { n: 'Bowman Bangers board', meta: 'the tracked 1st Bowman Chrome autos · raw · ask-basis', f: function (c) { return c.board; } },
    under100: { n: 'Autos under $100', meta: '1st Bowman Chrome autos with a verified ask floor below $100', f: function (c) { return c.type === 'auto' && c.last != null && c.last < 100; } },
    drying: { n: 'Supply drying up', meta: 'verified asks down 20% or more vs 30 nights ago', f: function (c) { return c.supd != null && c.supd <= -20; } },
    z2: { n: '|z| beyond 2', meta: 'mark more than two σ from its 30-night mean — stretched either way', f: function (c) { return c.z != null && Math.abs(c.z) >= 2; } },
    fat: { n: 'Fat tails', meta: 'excess kurtosis above 3 — jump-driven series, treat the ROC with care', f: function (c) { return c.kurt != null && c.kurt > 3; } },
    all: { n: 'Every tracked card', meta: 'everything the engine marks nightly', f: function () { return true; } }
  };

  /* ---------- model ---------- */
  function buildModel(latest, history, market, indices) {
    var day = (latest && latest.day) || '';
    var cards = ((latest && latest.cards) || []).map(function (c) {
      var id = String(c.key).split(':')[1];
      var e = history && history[c.key];
      var ys = ((e && e.series) || []).filter(function (p) { return p && p.p != null && isFinite(p.p); }).map(function (p) { return p.p; });
      var m = ST.moments(ST.returns(ys));
      var last30 = ys.slice(-30);
      var prev5 = ys.length > 5 ? ys[ys.length - 6] : null;
      var parts = String(c.label || id).split(/\s[—–]\s/);
      var mk = market && market.cards && market.cards[c.key];
      var gatedArr = Array.isArray(c.gated) ? c.gated : c.gated ? [String(c.gated)] : [];
      var gated = gatedArr.length > 0 || (!!c.signalRaw && c.signalRaw !== c.signal);
      return {
        id: id, key: c.key, label: c.label || id, name: parts[0], set: parts[1] || '', cardType: c.cardType || '',
        type: c.cardType === 'chrome-auto' ? 'auto' : c.cardType === 'tcg-single' ? 'tcg' : 'base',
        board: c.cardType === 'chrome-auto' && !c.boardHide,
        slug: c.slug || null, href: c.slug ? '/' + c.slug + '#engine-' + id : /-bcb26-/.test(id) ? '/bowman-chrome-2026-index' : '/card-' + id,
        last: c.last, prev5: prev5, chg: c.last != null && prev5 != null ? c.last - prev5 : null, chgp: ST.pctChange(prev5, c.last),
        lo30: last30.length ? Math.min.apply(null, last30) : null, hi30: last30.length ? Math.max.apply(null, last30) : null,
        roc: c.roc30, z: c.z, sd: m ? m.sd : null,
        skew: c.retSkew != null ? c.retSkew : m ? m.skew : null, kurt: c.retKurtosis != null ? c.retKurtosis : m ? m.kurt : null, nret: m ? m.n : 0,
        sup: c.supply, sup30: c.supply30, supd: c.supplyChange30, q1: c.askQ1, q3: c.askQ3,
        sig: String(c.signal || 'HOLD').toUpperCase(), raw: String(c.signalRaw || c.signal || 'HOLD').toUpperCase(), gated: gated,
        gate: gatedArr[0] || (gated ? (c.reasons || [])[0] : null) || null, conf: c.confidence, points: c.points || 0, reasons: c.reasons || [],
        closes: mk && mk.closes ? mk.closes : 0, spark: last30, ys: ys
      };
    });
    var marked = cards.filter(function (c) { return c.last != null; }).length;
    var gatedN = cards.filter(function (c) { return c.gated; }).length;
    var closes = cards.reduce(function (s, c) { return s + c.closes; }, 0);
    var idx = [];
    for (var k in indices || {}) {
      if (k === '_comment' || k === 'updated' || !indices[k] || typeof indices[k] !== 'object') continue;
      var v = indices[k];
      var h = (v.history || []).filter(function (r) { return r && r.level != null; }).map(function (r) { return { date: r.date, level: r.level, note: r.note || '' }; });
      var pre = v.status === 'pre' || v.status === 'pre-activation' || !h.length;
      idx.push({ k: k, name: v.name || k, page: v.page || null, status: pre ? 'pre' : 'live', basis: v.basisLabel || (v.basis === 'ask' ? 'ask-basis · nightly marks' : 'sold comps only · weekly re-mark'), history: h,
        level: h.length ? h[h.length - 1].level : null, prev: h.length > 1 ? h[h.length - 2].level : null, date: h.length ? h[h.length - 1].date : null, inception: v.inception || null });
    }
    return { day: day, cards: cards, marked: marked, total: cards.length, gatedN: gatedN, closes: closes, indices: idx, composite: composite(cards, history) };
  }
  /* equal-weight, normalised 30-night composite of the board autos (each series ÷ its own value 30 nights ago × 100) */
  function composite(cards, history) {
    var ids = cards.filter(function (c) { return c.board && c.spark.length >= 30; });
    if (!ids.length) return null;
    var n = 30, levels = [];
    for (var i = 0; i < n; i++) { var s = 0; ids.forEach(function (c) { s += c.spark[i] / c.spark[0] * 100; }); levels.push(s / ids.length); }
    var dates = [];
    var ref = ids.map(function (c) { return (history && history[c.key] && history[c.key].series) || []; }).sort(function (a, b) { return b.length - a.length; })[0] || [];
    ref.filter(function (p) { return p && p.p != null; }).slice(-30).forEach(function (p) { dates.push(p.d); });
    return { k: 'BOARD', name: 'Bangers board · 30D composite', page: '/bowman-bangers', status: 'live', basis: 'equal-weight · ' + ids.length + ' autos · ask-basis · 100 = ' + (dates[0] ? dstr(dates[0]) : '30 nights ago'), history: levels.map(function (l, i) { return { date: dates[i] || '', level: l }; }), level: levels[n - 1], prev: levels[n - 2], date: dates[n - 1] || '', n: ids.length };
  }

  /* ---------- charts ---------- */
  function lineChart(series, labels, opts) {
    opts = opts || {};
    var W = 560, H = opts.h || 300, pl = 8, pr = 52, pt = 14, pb = 26; /* H: the browser fits it to the panel (fitChart); the pre-render uses 300 */
    if (!series || series.length < 2) return '<div class="chart-empty">One mark so far — the line starts at the next re-mark.</div>';
    var lo = Math.min.apply(null, series), hi = Math.max.apply(null, series);
    if (opts.ref != null) { lo = Math.min(lo, opts.ref); hi = Math.max(hi, opts.ref); }
    var pad = (hi - lo || 1) * 0.12, y0 = lo - pad, y1 = hi + pad;
    var X = function (i) { return pl + (i / (series.length - 1)) * (W - pl - pr); }, Y = function (v) { return pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb); };
    var up = series[series.length - 1] >= series[0];
    var d = series.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    var area = d + ' L' + X(series.length - 1).toFixed(1) + ' ' + (H - pb).toFixed(1) + ' L' + X(0).toFixed(1) + ' ' + (H - pb).toFixed(1) + ' Z';
    var refY = opts.ref != null ? Y(opts.ref) : null;
    var ticks = [y0 + pad * 0.3, (y0 + y1) / 2, y1 - pad * 0.3].map(function (v) { var ty = Y(v); var hit = refY != null && Math.abs(ty - refY) < 12; return '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + ty.toFixed(1) + '" y2="' + ty.toFixed(1) + '"/>' + (hit ? '' : '<text class="axis" x="' + (W - pr + 6) + '" y="' + (ty + 4).toFixed(1) + '">' + num(v, opts.dec == null ? 2 : opts.dec) + '</text>'); }).join('');
    var n = labels.length, step = Math.max(1, Math.ceil(n / 5));
    var xl = labels.map(function (l, i) { return (i % step === 0 || i === n - 1) ? '<text class="axis" x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (i === n - 1 ? 'end' : i === 0 ? 'start' : 'middle') + '">' + esc(l) + '</text>' : ''; }).join('');
    var e = [X(series.length - 1), Y(series[series.length - 1])];
    /* the reference value sits on the axis (right), its label rides the line at the left, above or below whichever side has room */
    var ref = refY != null ? '<line class="ref" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + refY.toFixed(1) + '" y2="' + refY.toFixed(1) + '"/><text class="ref-l axis-ref" x="' + (W - pr + 6) + '" y="' + (refY + 4).toFixed(1) + '">' + num(opts.ref, opts.dec == null ? 2 : opts.dec) + '</text><text class="ref-l" x="' + (pl + 2) + '" y="' + (refY > (pt + 18) ? refY - 5 : refY + 12).toFixed(1) + '">' + esc(opts.refLabel || '') + '</text>' : '';
    return '<svg class="mchart ' + (up ? 'up' : 'dn') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.label || 'chart') + '">' + ticks + '<path class="area" d="' + area + '"/>' + ref + '<path class="line" d="' + d + '"/><circle class="dot" cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="3"/>' + xl + '</svg>';
  }

  /* ---------- panels ---------- */
  function marketRows(model) {
    var rows = []; if (model.composite) rows.push(model.composite); return rows.concat(model.indices);
  }
  function renderMarkets(model, sel) {
    var rows = marketRows(model);
    sel = rows.some(function (r) { return r.k === sel && r.status !== 'pre'; }) ? sel : (rows[0] ? rows[0].k : null);
    var list = rows.map(function (r) {
      var href = r.page || '/indices';
      if (r.status === 'pre') return '<a class="mrow pre-row" href="' + esc(href) + '" data-k="' + esc(r.k) + '"><span><span class="k">' + esc(r.k) + '</span><span class="name">' + esc(r.name) + '</span></span><span class="pre">PRE · activates on verified sold reads</span></a>';
      var d = r.level != null && r.prev != null ? r.level - r.prev : null, p = ST.pctChange(r.prev, r.level);
      return '<a class="mrow' + (r.k === sel ? ' on' : '') + '" href="' + esc(href) + '" data-k="' + esc(r.k) + '"><span><span class="k">' + esc(r.k) + '</span><span class="name">' + esc(r.name) + '</span></span><span class="num">' + num(r.level, 2) + '</span><span class="num ' + cls(d) + '">' + (d == null ? '—' : (d > 0 ? '+' : '') + num(d, 2)) + '</span><span class="num ' + cls(p) + '">' + pct(p, 2) + '</span></a>';
    }).join('');
    return list;
  }
  function renderChart(model, sel, h) {
    var rows = marketRows(model);
    var r = rows.filter(function (x) { return x.k === sel; })[0] || rows[0];
    if (!r || r.status === 'pre') return '<div class="chart-empty">' + (r ? esc(r.k) + ' is pre-activation — no level yet.' : 'No index yet.') + '</div>';
    var levels = r.history.map(function (h) { return h.level; }), labels = r.history.map(function (h) { return dstr(h.date); });
    return lineChart(levels, labels, { ref: 100, refLabel: '100 = ' + (r.k === 'BOARD' ? '30 nights ago' : 'inception'), label: r.name, dec: 2, h: h }) +
      '<div class="chart-cap"><b>' + esc(r.k) + '</b> · ' + esc(r.basis) + ' · ' + r.history.length + ' mark' + (r.history.length === 1 ? '' : 's') + (r.date ? ' · last ' + esc(dstr(r.date)) : '') + (r.page ? ' · <a href="' + esc(r.page) + '">open ' + esc(r.k) + ' »</a>' : '') + '</div>';
  }
  function renderEngine(model) {
    var li = [], t = dstr(model.day);
    var card = function (c) { return '<a href="' + esc(c.href) + '">' + esc(c.name) + '</a>'; };
    var line = function (when, b, html) { li.push('<li><span class="t">' + esc(when) + '</span><span><span class="b ' + b.toLowerCase() + '">' + esc(b) + '</span>' + html + '</span></li>'); };
    line(t, 'FEED', 'Nightly landed — ' + model.marked + ' of ' + model.total + ' cards marked, ' + model.gatedN + ' gated to HOLD' + (model.closes ? ', ' + model.closes + ' auction close' + (model.closes === 1 ? '' : 's') + ' watched' : '') + '. Asks, not solds.');
    model.cards.filter(function (c) { return !c.gated && (c.sig === 'BUY' || c.sig === 'SELL') && c.conf != null && c.conf >= 0.8; }).sort(function (a, b) { return b.conf - a.conf; }).forEach(function (c) {
      line(t, c.sig, card(c) + ' published ' + c.sig + ' at ' + num(c.conf, 2) + ' confidence — ' + fmt(c.last) + ', ' + pct(c.roc, 1) + ' / 30D, z ' + num(c.z, 2) + ', ' + (c.sup == null ? '—' : c.sup) + ' verified asks' + (c.supd != null ? ' (' + pct(c.supd, 0) + ' / 30D)' : '') + '.');
    });
    model.cards.filter(function (c) { return c.gated && (c.raw === 'BUY' || c.raw === 'SELL'); }).forEach(function (c) {
      line(t, 'GATE', card(c) + ' raw ' + c.raw + ' withheld — ' + esc(c.gate || 'thin sample') + '; ' + fmt(c.last) + ', ' + pct(c.roc, 1) + ' / 30D, z ' + num(c.z, 2) + '. No call.');
    });
    var mv = model.cards.filter(function (c) { return c.board && c.roc != null; }).sort(function (a, b) { return Math.abs(b.roc) - Math.abs(a.roc); })[0];
    if (mv) line(t, 'FEED', card(mv) + ' ' + pct(mv.roc, 1) + ' / 30D — the board\'s biggest 30-night move; ' + fmt(mv.last) + ', supply ' + (mv.sup == null ? '—' : mv.sup) + (mv.supd != null ? ' (' + pct(mv.supd, 0) + ' / 30D)' : '') + '.');
    var live = model.indices.filter(function (i) { return i.status !== 'pre' && i.level != null; });
    if (live.length) {
      var byDate = {}; live.forEach(function (i) { (byDate[i.date] = byDate[i.date] || []).push(i); });
      var dates = Object.keys(byDate).sort().reverse().slice(0, 1);
      dates.forEach(function (d) {
        line(dstr(d), 'INDEX', 'Weekly re-mark — ' + byDate[d].map(function (i) { return '<a href="' + esc(i.page || '/indices') + '">' + esc(i.k) + '</a> ' + num(i.level, 2) + (i.prev != null ? ' (' + pct(ST.pctChange(i.prev, i.level), 1) + ')' : ' (inception)'); }).join(', ') + '. Sold comps only.');
      });
    }
    model.indices.filter(function (i) { return i.status === 'pre'; }).forEach(function (i) {
      line('pre', 'INDEX', '<a href="' + esc(i.page || '/indices') + '">' + esc(i.k) + '</a> is scaffolded, not live — activates once the weekly re-mark sources its first sold reads.');
    });
    return li.slice(0, 8).join(''); /* eight lines at rest; the rest lives on the board page ("All signals »") */
  }
  function renderFocus(focus) {
    return ((focus && focus.items) || []).map(function (f) { return '<a href="' + esc(f.href) + '">' + esc(f.label) + (f.meta ? '<em>' + esc(f.meta) + '</em>' : '') + '</a>'; }).join('');
  }
  function renderMovers(model) {
    var rows = model.cards.filter(function (c) { return c.board && c.roc != null; }).sort(function (a, b) { return Math.abs(b.roc) - Math.abs(a.roc); }).slice(0, 7);
    if (!rows.length) return '<li class="empty">No board mark yet tonight.</li>';
    return rows.map(function (c, i) {
      return '<li><span class="rk">' + (i + 1) + '</span><span class="nm"><a href="' + esc(c.href) + '">' + esc(c.name) + '</a><small>' + fmt(c.last) + ' · supply ' + (c.sup == null ? '—' : c.sup) + ' · z ' + num(c.z, 2) + (c.gated ? ' · gated' : '') + '</small></span>' + ST.sparkSVG(c.spark) + '<span class="num ' + cls(c.roc) + '">' + pct(c.roc, 1) + '</span></li>';
    }).join('');
  }
  function sigCell(c) {
    var conf = c.conf != null && c.conf > 0;
    return '<span class="sig ' + (c.gated ? 'none' : c.sig) + '"' + (c.gate ? ' title="' + esc(c.gate) + '"' : '') + '>' + (c.gated ? 'HOLD' : esc(c.sig)) + '</span>' + (c.gated && c.raw !== 'HOLD' ? '<span class="sub">raw ' + esc(c.raw) + '</span>' : conf ? '' : '<span class="sub">no call</span>');
  }
  function rangeCell(lo, hi, v) {
    if (lo == null || hi == null) return '—';
    var p = hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0.5;
    return '<span class="rng"><span>' + fmt(lo) + '</span><span class="tr"><i style="left:' + (p * 100).toFixed(0) + '%"></i></span><span>' + fmt(hi) + '</span></span>';
  }
  function screenMeta(model, id) {
    var s = SCREENS[id] || SCREENS.board; var rows = model.cards.filter(s.f);
    return { id: SCREENS[id] ? id : 'board', name: s.n, meta: s.meta + ' · ' + rows.length + ' card' + (rows.length === 1 ? '' : 's') + ' · feed ' + dstr(model.day), rows: rows };
  }
  function renderScreen(model, id) {
    var sm = screenMeta(model, id);
    var rows = sm.rows.slice().sort(function (a, b) { return (b.last || 0) - (a.last || 0); });
    if (!rows.length) return '<tr><td colspan="14" class="empty">No card passes this screen tonight.</td></tr>';
    return rows.map(function (c) {
      return '<tr><td class="sym"><a href="' + esc(c.href) + '">' + esc(c.name) + '</a><small>' + esc(c.set) + '</small></td>' +
        '<td class="head">' + fmt(c.last) + '</td>' +
        '<td class="' + cls(c.chg) + '">' + (c.chg == null ? '—' : sgn(c.chg) + '<span class="sub">' + pct(c.chgp, 1) + '</span>') + '</td>' +
        '<td>' + (c.sup == null ? '—' : c.sup) + '</td>' +
        '<td class="' + cls(c.supd == null ? 0 : -c.supd) + '">' + pct(c.supd, 0) + '</td>' +
        '<td>' + rangeCell(c.q1, c.q3, c.last) + '</td>' +
        '<td>' + rangeCell(c.lo30, c.hi30, c.last) + '</td>' +
        '<td class="' + cls(c.roc) + '">' + pct(c.roc, 1) + '</td>' +
        '<td class="' + (c.z != null && Math.abs(c.z) >= 2 ? cls(c.z) : '') + '">' + num(c.z, 2) + '</td>' +
        '<td>' + (c.sd != null && c.nret ? num(c.sd, 2) + '%' : '—') + '</td>' +
        '<td class="' + (c.skew > 1 ? 'up' : c.skew < -1 ? 'dn' : '') + '">' + num(c.skew, 2) + '</td>' +
        '<td class="' + (c.kurt > 3 ? 'dn' : '') + '">' + num(c.kurt, 2) + '</td>' +
        '<td>' + sigCell(c) + '</td>' +
        '<td>' + (c.conf != null && c.conf > 0 ? num(c.conf, 2) : '—') + '</td></tr>';
    }).join('');
  }
  /* every saved screen as its own <tbody> (one visible) — the page can switch screens with no feed at all */
  function renderScreens(model, active) {
    return Object.keys(SCREENS).map(function (id) {
      var sm = screenMeta(model, id);
      return '<tbody data-screen-body="' + id + '" data-name="' + esc(sm.name) + '" data-meta="' + esc(sm.meta) + '"' + (id === active ? '' : ' hidden') + '>' + renderScreen(model, id) + '</tbody>';
    }).join('\n');
  }
  function renderAuctions(rows, day) {
    rows = (rows || []).filter(function (r) { return r && r.url && r.total != null; }).sort(function (a, b) { return new Date(a.endDate) - new Date(b.endDate); }).slice(0, 5);
    if (!rows.length) return '<li class="empty">No verified live auction on a tracked card right now — the desk refreshes every 15 minutes.</li>';
    return rows.map(function (r, i) {
      var ends = r.endDate ? Math.max(0, (new Date(r.endDate).getTime() - Date.now()) / 36e5) : null;
      var vs = r.vsMark != null ? r.vsMark * 100 : null;
      return '<li><span class="rk">' + (i + 1) + '</span><span class="nm"><a href="' + esc(r.url) + '" target="_blank" rel="noopener sponsored">' + esc(r.label || r.title) + '</a><small>' + (r.bidCount || 0) + ' bid' + (r.bidCount === 1 ? '' : 's') + (ends != null ? ' · ends in ' + (ends >= 48 ? Math.round(ends / 24) + 'd' : Math.round(ends) + 'h') : '') + ' · mark ' + fmt(r.mark) + (day ? ' (' + dstr(day) + ')' : '') + ' · <span class="ebay">eBay</span></small></span><span class="num ' + (vs == null ? '' : vs < 0 ? 'up' : 'dn') + '">' + (vs == null ? '—' : pct(vs, 0) + ' vs mark') + '</span><span class="num head">' + fmt(r.total) + '</span></li>';
    }).join('');
  }
  /* rail portfolios — read-only view of the Vault mirror (sch_vault_v1) via js/vault-schema.js; never writes */
  function renderPortfolios(store, cfg) {
    var VS = (typeof self !== 'undefined' && self.SCH_VSCHEMA) || null;
    if (VS) return VS.railRows(store, { vaultHref: (cfg && cfg.vaultHref) || '/watchlist' });
    return '<a class="rl pf-empty" href="' + esc((cfg && cfg.vaultHref) || '/watchlist') + '"><span class="ico">→</span><span class="lbl">' + esc((cfg && cfg.empty) || 'Start in the Vault →') + '</span></a>';
  }

  /* ---------- browser ---------- */
  function boot() {
    var $ = function (s) { return document.querySelector(s); };
    var panel = function (k) { return document.querySelector('[data-home="' + k + '"]'); };
    var model = null, sel = null;
    var screenId = function () { var m = (location.hash || '').match(/screen=([a-z0-9]+)/); return m && SCREENS[m[1]] ? m[1] : 'board'; };
    var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    /* paintScreen: with no model (feed not here yet, or failed) it toggles the pre-rendered <tbody>s; with a model it
       re-renders them. Always updates the header + the active chip/rail row, so a click is visible at once. */
    function paintScreen(show) {
      var id = screenId();
      var bodies = document.querySelectorAll('[data-screen-body]');
      var nm = $('[data-home="screen-name"]'), mt = $('[data-home="screen-meta"]');
      Array.prototype.forEach.call(bodies, function (tb) {
        var k = tb.getAttribute('data-screen-body');
        if (model) { var sm = screenMeta(model, k); tb.innerHTML = renderScreen(model, k); tb.setAttribute('data-name', sm.name); tb.setAttribute('data-meta', sm.meta); }
        tb.hidden = k !== id;
        if (k === id) { if (nm) nm.textContent = tb.getAttribute('data-name') || SCREENS[id].n; if (mt) mt.textContent = tb.getAttribute('data-meta') || SCREENS[id].meta; }
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-screen]'), function (a) { a.classList.toggle('on', a.getAttribute('data-screen') === id); });
      if (show) revealScreens();
    }
    /* bring the Screens panel to the user and flash its header — the response has to be visible where they clicked */
    function revealScreens() {
      var p = $('#screens'); if (!p) return;
      try { p.scrollIntoView({ block: 'start', behavior: REDUCED ? 'auto' : 'smooth' }); } catch (e) { p.scrollIntoView(); }
      var h = p.querySelector('.scr-head'); if (!h) return;
      h.classList.remove('flash'); void h.offsetWidth; h.classList.add('flash');
      setTimeout(function () { h.classList.remove('flash'); }, 1000);
    }
    /* size the chart's viewBox to the column it sits in, so it fills the Markets panel instead of floating in it */
    function chartH(c) {
      var cap = c.querySelector('.chart-cap'); var capH = cap ? cap.offsetHeight + 6 : 26;
      var w = c.clientWidth - 24, h = c.clientHeight - 18 - capH;
      if (!(w > 100) || !(h > 100)) return 300;
      return Math.max(200, Math.min(520, Math.round(560 * h / w)));
    }
    function paintMarkets() {
      var l = panel('markets'), c = panel('chart'); if (!model) return;
      if (l) l.innerHTML = renderMarkets(model, sel);
      if (c) { c.innerHTML = renderChart(model, sel, chartH(c)); c.innerHTML = renderChart(model, sel, chartH(c)); }
    }
    var rt = null; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(paintMarkets, 150); });
    /* markets rows swap the chart even when the nightly feed is unreachable: indices.json is same-origin, so an
       indices-only model draws every index chart; only the BOARD composite needs the feed (its row then navigates) */
    var idxModel = null;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.mrow[data-k]'); if (!a) return;
      if (a.classList.contains('pre-row')) return;
      var k = a.getAttribute('data-k');
      if (!model && !(idxModel && k !== 'BOARD')) return;
      e.preventDefault(); sel = k;
      if (model) { paintMarkets(); return; }
      try {
        var c = panel('chart'); if (c) c.innerHTML = renderChart(idxModel, sel, chartH(c));
        Array.prototype.forEach.call(document.querySelectorAll('a.mrow[data-k]'), function (r) { r.classList.toggle('on', r.getAttribute('data-k') === sel); });
      } catch (er) {}
    });
    window.addEventListener('hashchange', function () { paintScreen(true); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-screen]'); if (!a) return;
      var id = a.getAttribute('data-screen'); if (!SCREENS[id]) return;
      e.preventDefault();
      if (screenId() === id && (location.hash || '').indexOf('screen=') >= 0) { paintScreen(true); return; }   // same screen: still answer the click
      try { history.pushState(null, '', location.pathname + '#screen=' + id); } catch (er) { location.hash = 'screen=' + id; return; }
      paintScreen(true);
    });
    window.addEventListener('popstate', function () { paintScreen(false); });
    try { paintScreen(/screen=/.test(location.hash || '')); } catch (e) {}
    /* live feed → re-render; any failure leaves the pre-rendered HTML alone */
    var get = function (u) { return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };
    Promise.all([get(FEED + '/prices-latest.json?t=' + Date.now()), get(FEED + '/prices-history.json?t=' + Date.now()), get(FEED + '/market-latest.json?t=' + Date.now()).catch(function () { return null; }), get('/data/indices.json?t=' + Date.now()).catch(function () { return null; })])
      .then(function (a) {
        model = buildModel(a[0], a[1], a[2], a[3] || {});
        /* each panel paints on its own — one bad panel never blanks the others (the pre-render stays) */
        var safe = function (f) { try { f(); } catch (e) { if (window.console) console.warn('home panel skipped:', e && e.message); } };
        safe(function () { var m = panel('markets'); var on = m && m.querySelector('.mrow.on'); sel = on ? on.getAttribute('data-k') : null; paintMarkets(); });
        safe(function () { var en = panel('engine'); if (en) en.innerHTML = renderEngine(model); });
        safe(function () { var mv = panel('movers'); if (mv) mv.innerHTML = renderMovers(model); });
        safe(function () { paintScreen(false); });
        safe(function () { var dy = $('[data-home="day"]'); if (dy) dy.textContent = dstr(model.day); var st = $('[data-home="stamp"]'); if (st) st.textContent = model.marked + '/' + model.total + ' marked · ' + model.gatedN + ' gated'; });
      }).catch(function () { /* pre-rendered numbers stay */
        get('/data/indices.json?t=' + Date.now()).then(function (idx) { idxModel = buildModel({ day: '', cards: [] }, {}, null, idx || {}); }).catch(function () {});
      });
    /* auction desk (same-origin) */
    var au = panel('auctions');
    if (au) get('/api/auctions').then(function (d) { au.innerHTML = renderAuctions(d.rows, d.markDay); var n = $('[data-home="auctions-n"]'); if (n) n.textContent = (d.count || 0) + ' live · ' + (d.underMark || 0) + ' under the mark'; })
      .catch(function () { au.innerHTML = '<li class="empty">Live auctions are unavailable right now — open the Auction Desk.</li>'; });
    /* rail portfolios from the Vault mirror (read-only) */
    var pf = $('[data-rail="portfolios"]');
    try { if (pf) { var store = null; try { store = JSON.parse(localStorage.getItem('sch_vault_v1') || 'null'); } catch (e) { store = null; } var cfg = {}; try { cfg = JSON.parse(pf.getAttribute('data-cfg') || '{}'); } catch (e2) {} pf.innerHTML = renderPortfolios(store, cfg); } } catch (e3) {}
  }
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot(); }

  return { SCREENS: SCREENS, buildModel: buildModel, renderMarkets: renderMarkets, renderChart: renderChart, renderEngine: renderEngine, renderFocus: renderFocus, renderMovers: renderMovers, renderScreen: renderScreen, renderScreens: renderScreens, screenMeta: screenMeta, renderAuctions: renderAuctions, renderPortfolios: renderPortfolios, lineChart: lineChart };
});
