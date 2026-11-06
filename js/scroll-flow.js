/* scroll-flow.js — the scroll flow on the set-index pages (Cupertino run 6, Nov 5 2026; R46;
   claude/agents/cupertino/DESIGN-SYSTEM.md "Motion → Scroll flow"). Mo, Nov 3: "I really like apple's webpage flow,
   how you scroll down and it kind of flows/animates."

   What it does, once per block, as it comes up from below the fold:
   - the block fades up 16 px over 500 ms (--ds-ease); tiles that arrive together step in 60 ms apart;
   - a chart that arrives this way draws left to right;
   - an index level that arrives this way counts up (≤ 600 ms) and lands on the exact printed text.
   What it never does: touch the first screen (anything on screen when the page opens stays as it is), touch a buy box
   (SEALED / BUYBOX / BUYSTRIP, the eBay pill), loop, or run under prefers-reduced-motion. With JS off nothing is
   hidden: the "before" state is set here, by this script, only on blocks that are below the fold at that moment.
   An in-page jump (the local nav's Chart · Cards · How it works, a #link, find-in-page) shows its blocks at once.
   Transform and opacity only, so it moves no layout (CLS unchanged).
   Included by tools/build-local-nav.mjs inside the LOCALNAV block. Hooks: the children of .lnav ~ .wrap and of
   .lnav ~ .container > section.sidx; tile rows (.pr-tiles, .cg, .sidx-subidx) step in tile by tile.
   Run 7 (Nov 6 2026): card pages too. js/card-page.js loads this file after it renders main.cdp; the hooks are the
   children of .cdp, and the grade compare row (.cdp-cmp-g) steps in tile by tile. The quote header, the tabs and the
   "Other places to buy" box (.cdp-buy) never move. */
(function () {
  var w = window, d = document;
  if (!('IntersectionObserver' in w) || !w.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var BOX = '.lnav ~ .wrap, .lnav ~ .container > section.sidx, main.cdp', ROW = '.pr-tiles, .cg, .sidx-subidx, .cdp-cmp-g';
  // the card tables are scroll boxes (.tbl-scroll) and run their own row scripts: they stay as they are
  var SKIP = 'script, style, link, template, [hidden], .crumb, .strip, .sealed, .ci-buy, .bs, .bstrip, .bstrip-wrap, .lnav, .ovl, .tbl-scroll, .sidx-tbl, table, .cdp-crumbs, .cdp-top, .cdp-tabs, .cdp-buy';
  var BUY = '.sealed, .ci-buy, .bstrip, .lnav-pill, .cdp-ebay, .cdp-btns';
  var LEVEL = '.mast .level, .sidx-level .lv', NUM = /^(\d{1,3}(,\d{3})+|\d+)(\.(\d+))?$/;
  var jump = Date.now();   // a restored scroll or a #hash on load lands where the reader asked: no fade there
  function hop() { jump = Date.now(); }
  d.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href^="#"]'); if (a) hop(); }, true);
  w.addEventListener('hashchange', hop);

  var st = d.createElement('style');
  // the look lives with the script: these rules mean nothing unless it runs (so css/site-fixes.css stays the same size)
  st.textContent = 'html body [data-sf=""]{opacity:0;transform:translate3d(0,var(--sf-y,16px),0)}' +
    'html body [data-sf=go]{opacity:1;transform:none;transition:opacity var(--ds-dur-reveal,.5s) var(--ds-ease,ease) var(--sf-d,0ms),transform var(--ds-dur-reveal,.5s) var(--ds-ease,ease) var(--sf-d,0ms)}' +
    'html body [data-sf=""] .idx-chart svg,html body .idx-chart[data-sf=""] svg{clip-path:inset(0 100% 0 0)}' +
    'html body [data-sf=go] .idx-chart svg,html body .idx-chart[data-sf=go] svg{clip-path:inset(0 0 0 0);transition:clip-path .9s var(--ds-ease,ease) calc(var(--sf-d,0ms) + .15s)}' +
    '@media print{[data-sf]{opacity:1!important;transform:none!important}[data-sf] svg{clip-path:none!important}}';
  d.head.appendChild(st);

  function count(el) {
    var t = el.textContent.trim(), m = NUM.exec(t);
    if (!m) return;
    var to = parseFloat(t.replace(/,/g, '')), dec = m[4] ? m[4].length : 0, t0 = null, done = false;
    if (!(to > 0)) return;
    function fmt(v) { return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: !!m[2] }); }
    function end() { done = true; el.textContent = t; }   // the printed text, exactly
    function step(ts) { if (done) return; if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 600); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); else end(); }
    el.textContent = fmt(0); requestAnimationFrame(step);
    setTimeout(end, 900);   // a background tab gets no frames; the real number lands anyway
  }

  function start() {
    var H = innerHeight, list = [];
    function add(el) {
      if (!el.matches || el.matches(SKIP) || el.querySelector(BUY)) return;
      var r = el.getBoundingClientRect();
      if (!r.height || r.top < H || r.bottom <= 0) return;   // the first screen (and anything above it) is never touched
      if (r.height > H) el.style.setProperty('--sf-y', '0px');   // a block taller than the screen (the card table) fades in place
      list.push(el);
    }
    Array.prototype.forEach.call(d.querySelectorAll(BOX), function (box) {
      Array.prototype.forEach.call(box.children, function (c) {
        if (c.matches(ROW)) Array.prototype.forEach.call(c.children, add);
        else if (c.querySelector(':scope > ' + ROW) && !c.matches(SKIP)) Array.prototype.forEach.call(c.children, function (g) { if (g.matches(ROW)) Array.prototype.forEach.call(g.children, add); else add(g); });
        else add(c);
      });
    });
    if (!list.length) return;
    var io = new IntersectionObserver(function (es) {
      var k = 0, now = Date.now() - jump < 1200;
      es.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; }).forEach(function (e) {
        var el = e.target; io.unobserve(el);
        // jumped to, or came in from above: just show it
        if (now || e.boundingClientRect.top <= 0) { el.style.transition = 'none'; el.removeAttribute('data-sf'); requestAnimationFrame(function () { el.style.transition = ''; }); return; }
        el.style.setProperty('--sf-d', Math.min(k++, 4) * 60 + 'ms');
        el.setAttribute('data-sf', 'go');
        var lv = el.matches(LEVEL) ? el : el.querySelector(LEVEL); if (lv) count(lv);
        // done: hand the block back to its own CSS (its hover and colour transitions)
        setTimeout(function () { el.removeAttribute('data-sf'); el.style.removeProperty('--sf-d'); el.style.removeProperty('--sf-y'); }, 1500);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    list.forEach(function (el) { el.setAttribute('data-sf', ''); io.observe(el); });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
