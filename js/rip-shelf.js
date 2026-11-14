/* js/rip-shelf.js — "Rip opens the shelf" (P1, motion ruling Nov 10 2026; Cupertino run 15, Motion seat).
   Markup + CSS: tools/lib/rip-shelf.mjs. One 0-1 progress value, draw(p); two drivers: scrub >= 760 px (the stage pins
   while the reader scrolls 1.5 screens), play-once below (2.6 s once the stage's top passes 40% of the screen). The landed row is the
   page's own layout; motion is transform + opacity on top of it (FLIP), so nothing reflows (CLS 0). Easing: cubic out /
   cubic in-out, closed form. Never random. Off with reduced motion, no IntersectionObserver, or no JS (html.rip-on unset). */
(function () {
  var html = document.documentElement;
  if (!html.classList.contains("rip-on")) return;
  window.__rip = 1;
  var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var eo = function (t) { return 1 - Math.pow(1 - t, 3); };
  var eio = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ev = function (n, o) { try { if (typeof gtag === "function") gtag("event", n, o); } catch (e) {} };
  var WIDE = matchMedia("(min-width: 760px)");
  var TEETH = 13, TOPH = 44, ZIG = 6;

  document.querySelectorAll("[data-rip]").forEach(function (rip) {
    var stage = rip.querySelector(".rip-stage"), row = rip.querySelector(".rip-row"), pack = rip.querySelector(".rip-pack");
    var ptop = pack.querySelector(".rip-top"), pbody = pack.querySelector(".rip-body"), hint = rip.querySelector(".rip-hint");
    var els = [].slice.call(rip.querySelectorAll(".rc")), n = els.length;
    var shelf = rip.getAttribute("data-rip"), G = {}, P = 0, done = 0, opened = 0, raf = 0, playing = 0;
    var fan = els.map(function (_, i) { return n < 2 ? 0 : -10 + (20 * i) / (n - 1); });
    var scrub = function () { return WIDE.matches; };

    (function zig() {
      var a = [], b = [], i, x, y;
      for (i = 0; i <= TEETH; i++) { x = ((i / TEETH) * 100).toFixed(2) + "%"; y = i % 2 ? ZIG : 0; a.push(x + " " + y + "px"); b.push(x + " " + (TOPH + y) + "px"); }
      pbody.style.clipPath = "polygon(" + a.join(",") + ",100% 100%,0 100%)";
      ptop.style.clipPath = "polygon(0 0,100% 0," + b.reverse().join(",") + ")";
      ptop.style.height = TOPH + ZIG + "px"; ptop.style.top = -TOPH + "px";
    })();

    function measure() {
      var cw = els[0].offsetWidth, ch = Math.round(cw * 1.396), pw = Math.round(cw * 1.18), ph = Math.round(ch * 1.2);
      var rx = row.offsetLeft + row.offsetWidth / 2, ry = row.offsetTop + row.offsetHeight / 2;
      var lo = ph * 0.86 + ch / 2 + TOPH, cy = scrub() ? Math.max(lo, Math.min(ry + ph * 0.2, stage.clientHeight - ph / 2 - 16)) : lo;
      G = { pw: pw, ph: ph, cx: rx, cy: cy, slots: els.map(function (e) { return { x: e.offsetLeft + cw / 2, y: e.offsetTop + ch / 2 }; }) };
      pack.style.width = pw + "px"; pack.style.height = ph + "px";
      draw(P);
    }

    function draw(p) {
      P = p;
      var enter = eo(cl(p / 0.12)), tear = eio(cl((p - 0.12) / 0.16)), leave = eio(cl((p - 0.52) / 0.2));
      pack.style.transform = "translate3d(" + (G.cx - G.pw / 2) + "px," + (G.cy - G.ph / 2 + leave * G.ph * 0.5) + "px,0) rotateY(" + -26 * (1 - enter) + "deg) rotateX(" + 7 * (1 - enter) + "deg) scale(" + lerp(0.93, 1, enter) + ")";
      pack.style.opacity = 1 - leave;
      pack.style.visibility = leave >= 1 ? "hidden" : "visible";
      var sheen = lerp(120, -40, cl(p / 0.3)) + "%";
      pbody.style.setProperty("--sheen", sheen); ptop.style.setProperty("--sheen", sheen);
      ptop.style.transform = "translate(" + tear * G.pw * 0.5 + "px," + -tear * G.ph * 0.34 + "px) rotate(" + -34 * tear + "deg)";
      ptop.style.opacity = 1 - cl((tear - 0.55) / 0.45);
      els.forEach(function (e, i) {
        var ri = eo(cl((p - 0.27 - i * 0.035) / 0.2)), si = eio(cl((p - 0.52 - i * 0.03) / 0.3)), s = G.slots[i];
        var x = lerp(G.cx + fan[i] * 1.6 * ri, s.x, si), y = lerp(G.cy + 6 - ri * G.ph * 0.86, s.y, si);
        e.style.transform = p >= 1 ? "none" : "translate3d(" + (x - s.x) + "px," + (y - s.y) + "px,0) rotate(" + fan[i] * ri * (1 - si) + "deg) scale(" + lerp(0.9, 1, si) + ")";
        e.style.zIndex = si > 0 ? 4 : 2;
        e.style.opacity = p < 0.26 ? 0 : 1;
        e.style.setProperty("--cap", cl((p - 0.86 - i * 0.01) / 0.1));
        e.style.pointerEvents = p > 0.95 ? "auto" : "none";
      });
      if (hint) hint.style.opacity = scrub() ? 1 - cl(p / 0.08) : 0;
      if (p >= 1 && !opened) { opened = 1; ev("rip_open", { shelf: shelf, mode: scrub() ? "scrub" : "once", page: location.pathname }); }
    }

    function onScroll() {
      if (done || raf) return;
      if (!scrub()) { var t = stage.getBoundingClientRect(); if (!P && !playing && t.top < innerHeight * 0.4 && t.bottom > 0) play(); return; }
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = rip.getBoundingClientRect(), top = parseFloat(getComputedStyle(stage).top) || 0, span = r.height - stage.offsetHeight;
        draw(span > 0 ? cl((top - r.top) / (span * 0.85)) : 1);
      });
    }
    function play() {
      if (done || P > 0) return;
      var t0 = performance.now(), D = 2600;
      (function tick(t) { var k = cl((t - t0) / D); draw(k); if (k < 1) playing = requestAnimationFrame(tick); })(t0);
    }
    function finish() { done = 1; cancelAnimationFrame(playing); draw(1); }

    addEventListener("scroll", onScroll, { passive: true });
    var rz; addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { measure(); onScroll(); }, 120); });
    if (WIDE.addEventListener) WIDE.addEventListener("change", finish);
    rip.addEventListener("focusin", finish);
    rip.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-rip-cid]"); if (!a) return;
      var cid = a.getAttribute("data-rip-cid");
      ev("click", { item: cid, page: location.pathname });
      ev("rip_card_click", { item: cid, shelf: shelf, page: location.pathname });
    });
    measure(); onScroll();
  });
})();
