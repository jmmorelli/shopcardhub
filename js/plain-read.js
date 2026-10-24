/* plain-read.js — the plain-English read on every set-index page (Sep 27 2026, Mo: "I don't want people to get to
 * the site and be like 'what the heck is this'"). Progressive disclosure: a new collector sees the level, the chart and
 * one sentence; the method, the stamps and the quant strip sit behind one "How this index works ▸" toggle.
 *
 * P0-C chart-first (Oct 23 2026, Mo via DESIGN-DIRECTIVE-2026-10-23 §4): this file now renders FOUR baked parts
 * instead of one box, so the generators can lay them out in the directive's order —
 *   line  · under the big level: "▼ 0.7% this week · −42% since release"  (data-pr="line")
 *   read  · one sentence under the chart                                   (data-pr="read")
 *   tiles · priciest card + biggest mover                                   (data-pr="tiles"; text spans data-pr-t)
 *   works · "how to read the big number", the whole-set cost line (R13) and the not-a-call footer, for the toggle (data-pr="works")
 * Every figure comes from /data/indices.json — the same file the chart renders from. Descriptive only: an index is a
 * measurement, not a call. On load mount() refreshes each baked part if the data moved since the bake (same renderer).
 *
 * "this week" follows the badge rule (iw-2026-10-03-1, desk Oct 3 2026): the move vs the newest market mark at least
 * 5 days before the latest — on Mon/Thu tickers the previous mark is 3–4 days back, which is not a week. Divisor rows
 * (iw-2026-10-07-1) are level-neutral changes of measure, never marks.
 *
 * Night Crew Oct 3 2026 (B29): the read is baked (tools/build-sector-index.mjs, tools/bake-plain-read.mjs require()
 * this file), so nothing shifts after paint. B37 (Oct 6): one shared /data/indices.json request per page (window.schIdx).
 */
(function () {
  var HAS_DOM = typeof document !== 'undefined';

  var css = '' +
    '.pr{margin:12px 0 0;border:1px solid var(--bd,#23303d);border-left:3px solid var(--pr-acc,#00ccf5);border-radius:3px;background:var(--p2,#0e151c);padding:12px 16px;}' +
    '.pr-v{font-family:var(--fd,inherit);font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:var(--th,#fff);margin-right:8px;}' +
    '.pr-v.up{color:var(--gn,#2bd17e);}.pr-v.dn{color:var(--rd,#ff4d6a);}' +
    '.pr p{margin:0;font-size:16px;line-height:1.5;color:var(--tx,#d6dde4);max-width:78ch;}' +
    '.pr p b{color:var(--th,#fff);}' +
    '.pr-line{font-family:var(--fm,ui-monospace,monospace);font-size:12px;color:var(--dim,#8a97a5);margin-top:6px;line-height:1.5;white-space:nowrap;}' +
    '.pr-line b{font-weight:700;}.pr-line .up{color:var(--gn,#2bd17e);}.pr-line .dn{color:var(--rd,#ff4d6a);}.pr-line .flat{color:var(--th,#fff);}' +
    '.pr-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0 0;align-items:start;}' +
    '.pr-tile{display:flex;align-items:flex-start;gap:12px;border:1px solid var(--bd,#23303d);border-radius:3px;background:var(--p1,#0c1017);padding:12px 14px;min-height:64px;box-sizing:border-box;}' +
    '.pr-tile .pr-tb{flex:1 1 auto;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:12px;align-items:center;}' +
    '.pr-tile .pr-tk,.pr-tile .pr-tn,.pr-tile .pr-tv{display:block;}' +
    '.pr-tile .pr-tk{grid-column:1/-1;font-family:var(--fm,ui-monospace,monospace);font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--dim,#8a97a5);margin-bottom:6px;}' +
    '.pr-tile .pr-tn{font-family:var(--fd,inherit);font-size:15px;line-height:1.2;color:var(--th,#fff);font-weight:700;min-width:0;}' +
    '.pr-tile .pr-tn small{display:block;font-family:var(--fm,ui-monospace,monospace);font-size:10px;font-weight:400;color:var(--dim,#8a97a5);margin-top:3px;letter-spacing:.5px;}' +
    '.pr-tile .pr-tv{font-family:var(--fm,ui-monospace,monospace);font-size:20px;font-weight:700;color:var(--th,#fff);white-space:nowrap;text-align:right;}' +
    '.pr-tile .pr-tv.up{color:var(--gn,#2bd17e);}.pr-tile .pr-tv.dn{color:var(--rd,#ff4d6a);}' +
    '.pr-tile .pr-tv small{display:block;font-size:9.5px;font-weight:400;color:var(--dim,#8a97a5);letter-spacing:1px;text-transform:uppercase;margin-top:3px;}' +
    '.pr-tile .pr-ti{flex:0 0 120px;width:120px;height:168px;display:block;overflow:hidden;border-radius:3px;background:rgba(255,255,255,.04);}' +
    '.pr-tile .pr-ti img,.pr-tile .pr-ti .sch-cimg{width:120px!important;height:168px!important;object-fit:cover;display:block;margin:0;}' +
    '.pr-tile .pr-ti>[data-card-img]{display:block;width:120px;height:168px;}' +
    '.pr-tile.has-img .pr-tb{display:block;}' +
    '.pr-tile.has-img .pr-tv{text-align:left;margin-top:10px;}' +
    '.pr-works .pr-key{font-size:13px;line-height:1.55;color:var(--dim,#8a97a5);margin:8px 0 0;}.pr-works .pr-key b{color:var(--tx,#d6dde4);}' +
    '.pr-works .pr-fc{font-size:13px;line-height:1.55;color:var(--tx,#d6dde4);margin:8px 0 0;max-width:78ch;}.pr-works .pr-fc b{color:var(--th,#fff);}' +
    '.pr-works .pr-fc-k{display:block;font-size:12px;color:var(--dim,#8a97a5);margin-top:2px;}' +
    '.pr-works .pr-foot{margin-top:8px;font-size:12px;color:var(--dim,#8a97a5);}' +
    'details.pr-how{margin:18px 0 0;border:1px solid var(--bd,#23303d);border-radius:3px;background:var(--p1,#0c1017);}' +
    'details.pr-how>summary{cursor:pointer;list-style:none;display:flex;align-items:center;min-height:44px;padding:10px 16px;font-family:var(--fd,inherit);font-weight:700;font-size:14px;letter-spacing:1.2px;text-transform:uppercase;color:var(--th,#fff);}' +
    'details.pr-how>summary::-webkit-details-marker{display:none;}' +
    'details.pr-how>summary::after{content:"▸";margin-left:8px;color:var(--pr-acc,#00ccf5);transition:transform .15s;}' +
    'details.pr-how[open]>summary::after{transform:rotate(90deg);}' +
    'details.pr-how>summary:hover{color:var(--pr-acc,#00ccf5);}' +
    'details.pr-how>.pr-how-in{padding:4px 16px 16px;border-top:1px solid var(--bd,#23303d);}' +
    'details.pr-how>.pr-how-in>p,details.pr-how>.pr-how-in>.block{margin-top:12px;}' +
    'details.pr-how .pr-stamp{font-family:var(--fm,ui-monospace,monospace);font-size:11px;color:var(--dim,#8a97a5);line-height:1.6;margin:12px 0 0;}' +
    '@media(max-width:700px){.pr{padding:12px;}.pr p{font-size:15px;}.pr-tiles{grid-template-columns:1fr;gap:8px;}.pr-tile{padding:10px 12px;}.pr-tile .pr-tv{font-size:18px;}.pr-line{white-space:normal;}}';
  if (HAS_DOM && !document.getElementById('pr-css')) { var st = document.createElement('style'); st.id = 'pr-css'; st.textContent = css; document.head.appendChild(st); }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function money(v) { return '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2)); }
  function day(s) { var d = new Date(String(s).slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  /* the sentence's subject, from the index name: "Destined Rivals chase cards", "Base Set cards", "Neo Revelation 1st
   * Edition cards", "2026 1st Bowman Chrome autos" (never the long r.set string — the h1 above already names the set;
   * only "Index" is stripped, so "Base Set Index" stays "Base Set") */
  function subject(r) {
    var nm = String(r.name || r.set || '').trim();
    if (/\bAuto Index$/i.test(nm)) return nm.replace(/\s*Auto Index$/i, ' autos');
    var chase = /\bChase Index$/i.test(nm);
    return nm.replace(/\s*(Chase|Class)?\s*Index\s*$/i, '').trim() + (chase ? ' chase cards' : ' cards');
  }
  var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function verdict(wk) {
    if (wk == null) return { w: 'Just started tracking', c: '' };
    if (wk >= 3) return { w: 'Heating up', c: 'up' };
    if (wk >= 1) return { w: 'Warming up', c: 'up' };
    if (wk > -1) return { w: 'Holding steady', c: '' };
    if (wk > -3) return { w: 'Cooling off', c: 'dn' };
    return { w: 'Sliding', c: 'dn' };
  }
  /* badge rule (iw-2026-10-03-1): the prior mark is the newest one at least 5 days before the latest */
  function weekBase(h) {
    if (h.length < 2) return null;
    var last = h[h.length - 1];
    for (var i = h.length - 2; i >= 0; i--) if ((new Date(String(last.date).slice(0, 10)) - new Date(String(h[i].date).slice(0, 10))) / 864e5 >= 5 && h[i].level > 0) return h[i];
    return null;
  }

  /* the facts every part reads — null before the first mark */
  function facts(k, r) {
    var raw = r.history || [], h = raw.filter(function (x) { return x && x.kind !== 'divisor' && x.level > 0; }), n = h.length;
    var measureChanged = raw.length && raw[raw.length - 1].kind === 'divisor';
    if (!n) return null;
    var level = h[n - 1].level, prevRow = weekBase(h);
    var wk = prevRow ? (level / prevRow.level - 1) * 100 : null;
    var since = level - 100;
    var basket = (r.basket || []).filter(function (c) { return typeof c.price === 'number' && c.price > 0 && c.w !== 0; });   // w 0 = tracked on its own line, not in the level (TH26 RGB Mews, Oct 4 2026)
    var name = subject(r), started = day(r.inception || h[0].date);
    // Sep 30 2026 rebase: 100 = the set's release month (or first reliable month), so "since" reads against that, not our start.
    // Oct 4 2026 (Pokémon KB G9): a release base month that is not the street-date month (AH26: Jan 30 release, 100 = Feb) says so.
    var relLate = r.baseRule === 'release' && r.releaseDate && r.releaseDate.slice(0, 7) !== r.baseDate;
    var bm = r.baseDate ? MN[+r.baseDate.slice(5, 7) - 1] + ' ' + r.baseDate.slice(0, 4) : null;
    var baseTxt = null, sinceLbl;
    if (r.baseDate && r.baseRule === 'release') {
      baseTxt = relLate ? 'in ' + bm + ', the first full month of sales after the ' + MN[+r.releaseDate.slice(5, 7) - 1] + ' ' + (+r.releaseDate.slice(8, 10)) + ', ' + r.releaseDate.slice(0, 4) + ' release' : 'when the set came out in ' + bm;
      sinceLbl = 'since release';
    } else if (r.baseDate) {
      baseTxt = 'in ' + bm + ', the earliest month with reliable sales data';
      sinceLbl = 'since ' + MS[+r.baseDate.slice(5, 7) - 1] + ' ' + r.baseDate.slice(0, 4);
    } else {
      sinceLbl = 'since ' + started;
    }
    var top = basket.slice().sort(function (a, b) { return b.price - a.price; })[0] || null;
    var movers = basket.filter(function (c) { return typeof c.prevPrice === 'number' && c.prevPrice > 0 && c.price >= 10; })
      .map(function (c) { return { c: c, p: (c.price / c.prevPrice - 1) * 100 }; })
      .filter(function (m) { return Math.abs(m.p) >= 1; })
      .sort(function (a, b) { return Math.abs(b.p) - Math.abs(a.p); });
    return { n: n, level: level, wk: wk, since: since, basket: basket, name: name, started: started, baseTxt: baseTxt, sinceLbl: sinceLbl,
      top: top, mover: movers.length && !measureChanged ? movers[0] : null, v: verdict(wk) };
  }

  function pctTxt(v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d == null ? 1 : d) + '%'; }
  function cls(v) { return v > 0.05 ? 'up' : v < -0.05 ? 'dn' : 'flat'; }

  /* 1 · the one line under the big level */
  function line(f) {
    var wk = f.wk == null ? 'first week of tracking' : '<b class="' + cls(f.wk) + '">' + (f.wk > 0.05 ? '▲ ' : f.wk < -0.05 ? '▼ ' : '') + (Math.abs(f.wk) < 0.05 ? 'flat' : Math.abs(f.wk).toFixed(1) + '%') + '</b> this week';
    var since = f.n < 2 && !f.baseTxt ? '' : ' · <b class="' + cls(f.since) + '">' + (Math.abs(f.since) < 0.5 ? 'even' : pctTxt(f.since, 0)) + '</b> ' + f.sinceLbl;
    return wk + since;
  }

  /* 2 · the one sentence under the chart */
  function read(f) {
    var what = esc(f.name);
    var s;
    if (f.n < 2 && !f.baseTxt) s = 'We started tracking ' + what + ' on ' + f.started + '. There is no trend yet — the first weekly move posts after the next price update.';
    else {
      var vs = f.baseTxt ? 'than ' + f.baseTxt : 'than when we started on ' + f.started;
      s = what + ' are worth <b>' + (Math.abs(f.since) < 0.5 ? 'about the same' : 'about ' + Math.abs(f.since).toFixed(0) + '% ' + (f.since < 0 ? 'less' : 'more')) + '</b> ' + vs;
      if (f.wk != null) s += '; <b>' + (Math.abs(f.wk) < 0.05 ? 'flat' : (f.wk < 0 ? 'down ' : 'up ') + Math.abs(f.wk).toFixed(1) + '%') + ' this week</b>.';
      else s += '.';
    }
    return '<p><span class="pr-v ' + f.v.c + '">' + f.v.w + '</span> ' + s + '</p>';
  }

  /* 3 · two tiles. opts.topImg = image slot HTML (the generator's data-card-img span). No buy link of its own: the chase strip
   * and the table carry this card's eBay links already (R33 link-type freeze). */
  function tileTop(f) { return f.top ? esc(f.top.name) + (f.top.num ? ' <small>#' + esc(f.top.num) + '</small>' : '') : 'No priced card yet'; }
  function tileTopV(f) { return f.top ? money(f.top.price) + '<small>recent sales</small>' : ''; }
  function tileMv(f) { return f.mover ? esc(f.mover.c.name) + (f.mover.c.num ? ' <small>#' + esc(f.mover.c.num) + '</small>' : '') : (f.wk == null ? 'Nothing to compare yet' : 'No card moved 1% or more'); }
  function tileMvV(f) { return f.mover ? (f.mover.p < 0 ? '▼ ' : '▲ ') + Math.abs(f.mover.p).toFixed(0) + '%<small>vs last mark</small>' : ''; }
  function tiles(f, opts) {
    opts = opts || {};
    var img = opts.topImg ? '<span class="pr-ti">' + opts.topImg + '</span>' : '';
    return '<div class="pr-tile' + (img ? ' has-img' : '') + '">' + img + '<span class="pr-tb"><span class="pr-tk">Priciest card</span><span class="pr-tn" data-pr-t="top">' + tileTop(f) + '</span><span class="pr-tv" data-pr-t="topv">' + tileTopV(f) + '</span></span></div>' +
      '<div class="pr-tile"><span class="pr-tb"><span class="pr-tk">Biggest move this week</span><span class="pr-tn" data-pr-t="mv">' + tileMv(f) + '</span><span class="pr-tv ' + (f.mover ? cls(f.mover.p) : '') + '" data-pr-t="mvv">' + tileMvV(f) + '</span></span></div>' +
      /* P0-E (Oct 23 2026): a set with a checklist worksheet gets a third, full-width tile that is a link — the generator passes
       * opts.link = { href, k, label, sub }. Inline layout only, so no baked page's CSS has to change for the two-tile sets. */
      (opts.link && opts.link.href ? '<a class="pr-tile pr-tile-link" href="' + esc(opts.link.href) + '" style="grid-column:1/-1;text-decoration:none;min-height:0;align-items:center" data-pr-t="link"' +
        /* v2.1 (Oct 24 2026): opts.link.slug = the sheet's localStorage key (data/sets/<slug>.json slug), opts.link.total = rows on the
         * sheet. clTiles() below reads the device's ticks and turns the sub line into "You have 61 of 244 · 25%". Never baked. */
        (opts.link.slug ? ' data-cl-slug="' + esc(opts.link.slug) + '"' + (opts.link.total ? ' data-cl-total="' + (+opts.link.total) + '"' : '') : '') +
        '><span class="pr-tb" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="pr-tk" style="grid-column:auto;margin:0">' + esc(opts.link.k || 'Your checklist') + '</span><span class="pr-tn" style="font-size:14px">' + esc(opts.link.label || 'Checklist') + ' &rarr;</span>' + (opts.link.sub ? '<span class="pr-tn" style="font-weight:400;font-size:12px;color:var(--dim,#8a97a5)" data-pr-t="linksub">' + esc(opts.link.sub) + '</span>' : '') + '</span></a>' : '');
  }

  /* the checklist tile's per-device line: localStorage sch_checklist_v1[slug].rows → "You have N of M · P%". Nothing from the
   * network, nothing baked — a reader who has ticked nothing keeps the generator's "Tick your cards…" line. */
  function clTiles() {
    var tiles = document.querySelectorAll('[data-pr-t="link"][data-cl-slug]'); if (!tiles.length) return;
    var all; try { all = JSON.parse(localStorage.getItem('sch_checklist_v1') || '{}'); } catch (e) { return; }
    if (!all || typeof all !== 'object') return;
    Array.prototype.forEach.call(tiles, function (a) {
      var st = all[a.getAttribute('data-cl-slug')], rows = st && st.rows; if (!rows || typeof rows !== 'object') return;
      var have = 0; for (var k in rows) if (rows[k] && rows[k].s === 'h') have++;
      if (!have) return;
      var total = (st.total > 0 ? st.total : 0) || parseInt(a.getAttribute('data-cl-total'), 10) || 0;
      var sub = a.querySelector('[data-pr-t="linksub"]');
      if (!sub) { sub = document.createElement('span'); sub.className = 'pr-tn'; sub.style.cssText = 'font-weight:400;font-size:12px;color:var(--dim,#8a97a5)'; sub.setAttribute('data-pr-t', 'linksub'); var tb = a.querySelector('.pr-tb'); (tb || a).appendChild(sub); }
      var pct = total ? Math.round(have / total * 100) : 0;
      sub.textContent = total ? 'You have ' + have + ' of ' + total + ' · ' + (pct ? pct : '<1') + '%' : 'You have ' + have;
      sub.style.color = 'var(--th,#fff)';
    });
  }

  /* 4 · what goes behind "How this index works" */
  function works(k, r, f) {
    var out = [];
    var key = 'How to read the big number: it started at <b>100</b>. ';
    if (f.n < 2 || Math.abs(f.since) < 0.5) key += 'Above 100 means these cards got pricier; below 100 means cheaper.';
    else key += '<b>' + f.level.toFixed(2) + '</b> means these cards cost about ' + Math.abs(f.since).toFixed(0) + '% ' + (f.since < 0 ? 'less' : 'more') + ' than on day one.';
    out.push('<p class="pr-key">' + key + '</p>');
    var fc = finishCost(k, r);
    if (fc) out.push('<p class="pr-fc" data-fc="' + fc.sum.toFixed(2) + '" data-fc-n="' + fc.n + '" data-fc-asof="' + esc(fc.asOf) + '">' + fc.html + '</p>');
    out.push('<div class="pr-foot">This tracks prices — it doesn’t tell you to buy or sell. Cards are long holds, so the 6–12 month picture matters more than any one week.</div>');
    return out.join('');
  }

  // R13 (Retention Desk, adopted Oct 9 2026) — "what it costs to finish this set": one dated dollar line on the
  // Pokémon whole-set (sector) indices only. Plain sum of every priced card's sold mark, one copy each, raw
  // (since Oct 12 2026 the level is the same uncapped sum ÷ divisor; before that the level was capped and this was not). Conditions from the Fit Analyst, all in finishCost(): "all N cards" only when
  // every card in the set is priced, else "N of M" with the unpriced named (≤ 3); the real window and date printed;
  // the change clause only against one shared prior that is a market mark (never a divisor row) ≥ 5 days back, worded
  // with its date; cards tracked outside the level (TH26's RGB Mews) counted and named. Never a call.
  function finishCost(k, r) {
    if (r.model !== 'sector' || !/pok[eé]mon/i.test(String(r.set || ''))) return null;   // Pokémon whole-set indices only (chase six + Bowman out)
    var raw = r.history || []; if (!raw.length) return null;
    var cards = (r.basket || []).filter(function (c) { return typeof c.price === 'number' && c.price > 0; });   // w 0 cards count: they are set cards
    if (cards.length < 2) return null;
    var universe = Array.isArray(r.universe) ? r.universe : null;
    var uN = universe ? universe.length : (r.universeCount || cards.length);
    var sum = 0, i; for (i = 0; i < cards.length; i++) sum += cards[i].price;
    var asOfs = cards.map(function (c) { return String(c.asOf || '').slice(0, 10); }).filter(Boolean).sort();
    if (!asOfs.length) return null;
    var asOf = asOfs[asOfs.length - 1], asOfTxt = asOfs[0] === asOf ? day(asOf) : day(asOfs[0]) + '–' + day(asOf);
    // window: each card's own, else the ticker's screen window
    var defWin = (r.screen && r.screen.window) || 30, wins = {}, w;
    cards.forEach(function (c) { w = c.win || defWin; wins[w] = (wins[w] || 0) + 1; });
    var winKeys = Object.keys(wins).map(Number).sort(function (a, b) { return wins[b] - wins[a]; });
    var winTxt = winKeys[0] + '-day sold medians', winNote = '';
    if (winKeys.length > 1) { var longer = cards.length - wins[winKeys[0]]; winNote = ' ' + longer + (longer === 1 ? ' card that sells' : ' cards that sell') + ' less often ' + (longer === 1 ? 'is' : 'are') + ' marked on ' + winKeys.slice(1).sort(function (a, b) { return a - b; }).join('- and ') + '-day medians.'; }
    // count line
    var countTxt, missTxt = '';
    if (cards.length >= uN) countTxt = 'One of each of the <b>' + cards.length + ' cards</b> in the set, raw';
    else {
      countTxt = 'One of each of the <b>' + cards.length + ' of ' + uN + ' cards</b> that sell often enough to price, raw';
      if (universe) {
        var have = {}; cards.forEach(function (c) { have[String(c.num)] = 1; });
        var miss = universe.filter(function (u) { return !have[String(u && u.num != null ? u.num : u)]; });
        if (miss.length && miss.length <= 3) missTxt = ' Not priced: ' + miss.map(function (u) { return esc(u.name || '') + (u.num != null ? ' #' + esc(u.num) : ''); }).join(', ') + '.';
        else if (miss.length) missTxt = ' ' + miss.length + ' cards have too few sales to price.';
      }
    }
    // cards tracked outside the level (w 0) — counted here, so say so and name them (≤ 3)
    var w0 = cards.filter(function (c) { return c.w === 0; }), w0Txt = '';
    if (w0.length) {
      var w0sum = 0; w0.forEach(function (c) { w0sum += c.price; });
      w0Txt = ', including ' + (w0.length <= 3 ? w0.map(function (c) { return '<b>' + esc(c.name) + (c.num ? ' ' + (/^\d/.test(String(c.num)) ? '#' : '') + esc(c.num) : '') + '</b>'; }).join(', ') : w0.length + ' cards') + ' tracked outside the index level (' + money(w0sum) + ' of it)';
    }
    // change clause: same cards, one shared prior that is a market mark, ≥ 5 days back, newest row not a divisor row
    var chgTxt = '';
    var newest = raw[raw.length - 1];
    var prevs = cards.map(function (c) { return typeof c.prevPrice === 'number' && c.prevPrice > 0 ? String(c.prevAsOf || '').slice(0, 10) : ''; });
    var prevAsOf = prevs[0];
    var shared = prevAsOf && prevs.every(function (p) { return p === prevAsOf; });
    if (shared && newest && newest.kind !== 'divisor') {
      var prevRow = null; for (i = 0; i < raw.length; i++) if (String(raw[i].date).slice(0, 10) === prevAsOf) prevRow = raw[i];
      var gap = (new Date(asOf + 'T12:00:00Z') - new Date(prevAsOf + 'T12:00:00Z')) / 864e5;
      if (prevRow && prevRow.kind !== 'divisor' && gap >= 5) {
        var prevSum = 0; cards.forEach(function (c) { prevSum += c.prevPrice; });
        var diff = sum - prevSum, dAbs = Math.abs(diff);
        var dTxt = sum >= 100 ? '$' + Math.round(dAbs).toLocaleString('en-US') : money(dAbs);   // the sum is "about", so the change is to the dollar too
        chgTxt = dAbs < 0.5 ? ', unchanged from the same cards at the ' + day(prevAsOf) + ' mark' : ', <b>' + dTxt + ' ' + (diff < 0 ? 'less' : 'more') + '</b> than the same cards at the ' + day(prevAsOf) + ' mark';
      }
    }
    var html = countTxt + ': <b>about ' + money(sum) + '</b> at ' + winTxt + ' as of ' + asOfTxt + w0Txt + chgTxt + '.' + missTxt + winNote +
      ' <span class="pr-fc-k">What the whole set costs to buy, one copy of each card, on that date. Since Oct 12, 2026 the index level above is this same one-of-each sum, indexed to the set’s base month (cards tracked outside the level excepted).</span>';
    return { sum: sum, n: cards.length, asOf: asOf, html: html };
  }

  /* the baked form — one HTML string per part, all keyed by data-plain so mount() can refresh them.
   * opts: { accent, topImg } */
  function bakeParts(k, r, opts) {
    opts = opts || {};
    var f = facts(k, r); if (!f) return null;
    var K = esc(k), acc = opts.accent ? ' style="--pr-acc:' + esc(opts.accent) + '"' : '';
    return {
      line: '<div class="pr-line" data-plain="' + K + '" data-pr="line">' + line(f) + '</div>',
      read: '<div class="pr" data-plain="' + K + '" data-pr="read"' + acc + '>' + read(f) + '</div>',
      tiles: '<div class="pr-tiles" data-plain="' + K + '" data-pr="tiles">' + tiles(f, opts) + '</div>',
      works: '<div class="pr-works" data-plain="' + K + '" data-pr="works">' + works(k, r, f) + '</div>',
      facts: f
    };
  }
  /* the toggle wrapper the generators put the method behind */
  function howWrap(k, inner, accent) {
    return '<details class="pr-how" id="' + esc(String(k).toLowerCase()) + '-method"' + (accent ? ' style="--pr-acc:' + esc(accent) + '"' : '') + '><summary>How this index works</summary><div class="pr-how-in">' + inner + '</div></details>';
  }

  function setHtml(el, html) { if (el && el.innerHTML !== html) el.innerHTML = html; }
  function mount(data) {
    var charts = document.querySelectorAll('.idx-chart[data-ticker]');
    Array.prototype.forEach.call(charts, function (chart) {
      var k = chart.getAttribute('data-ticker'), r = data[k];
      if (!r || typeof r !== 'object') return;
      var f = facts(k, r); if (!f) return;
      var q = function (sel) { return document.querySelector('[data-plain="' + k + '"]' + sel); };
      var baked = document.querySelector('[data-plain="' + k + '"][data-pr]');
      if (!baked) {   /* a page nothing baked for: the one sentence above the chart, as before */
        var box = document.createElement('div'); box.className = 'pr'; box.setAttribute('data-plain', k); box.setAttribute('data-pr', 'read');
        var sec = chart.closest('section.sidx'); if (sec) box.style.setProperty('--pr-acc', 'var(--sidx)');
        box.innerHTML = read(f);
        chart.parentNode.insertBefore(box, chart);
        return;
      }
      setHtml(q('[data-pr="line"]'), line(f));
      setHtml(q('[data-pr="read"]'), read(f));
      setHtml(q('[data-pr="works"]'), works(k, r, f));
      /* tiles: text spans only — the image slot and the eBay link are the generator's */
      setHtml(q(' [data-pr-t="top"]'), tileTop(f)); setHtml(q(' [data-pr-t="topv"]'), tileTopV(f));
      setHtml(q(' [data-pr-t="mv"]'), tileMv(f));
      var mvv = q(' [data-pr-t="mvv"]'); if (mvv) { setHtml(mvv, tileMvV(f)); mvv.className = 'pr-tv ' + (f.mover ? cls(f.mover.p) : ''); }
    });
  }

  function go() {
    try { clTiles(); } catch (e) {}
    try {   /* re-read on a bfcache return from the sheet and when another tab ticks */
      window.addEventListener('pageshow', function (ev) { if (ev && ev.persisted) clTiles(); });
      window.addEventListener('storage', function (ev) { if (!ev || !ev.key || ev.key === 'sch_checklist_v1') clTiles(); });
    } catch (e) {}
    if (!document.querySelector('.idx-chart[data-ticker]')) return;
    (window.schIdx = window.schIdx || function () { return window.__schIdxP || (window.__schIdxP = fetch('/data/indices.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(function (e) { window.__schIdxP = null; throw e; })); })().then(mount).catch(function () {});
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { facts: facts, bakeParts: bakeParts, howWrap: howWrap, finishCost: finishCost, PR_CSS: css };
  if (!HAS_DOM) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
