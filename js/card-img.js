/* card-img.js — one way to put a card photo anywhere on the site (Sep 1 2026).
 *
 * Sources, in order:
 *   1. price-data feed  (prices-latest.json → cards[].image)  — refreshed nightly by the engine
 *   2. /data/card-images.json                                — committed with the site, resolved on demand
 *   3. generated placeholder (SVG data URI)                    — never an empty slot
 *
 * Photos are verified eBay listing images, hot-linked from i.ebayimg.com and
 * always wrapped in the EPN-tagged listing link, so every picture is a click.
 *
 * Use:
 *   <span data-card-img="ebay:ethan-holliday" data-card-name="Ethan Holliday" data-card-size="thumb"></span>
 *   sizes: thumb (32×45) · row (44×62) · card (120×168) · hero (240×336)
 *   Or from JS:  SCH_IMG.render(el, key, {name, sub, size, surface, link})
 *                SCH_IMG.get(key) → Promise<{url,item}|null>
 *                SCH_IMG.placeholder({name, sub, hue}) → data URI
 */
(function () {
  var FEED = 'https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/prices-latest.json';
  var LOCAL = '/data/card-images.json';
  var SIZES = { thumb: [32, 45], row: [44, 62], card: [120, 168], hero: [240, 336] };
  var cache = null;

  function load() {
    if (cache) return cache;
    var pLocal = fetch(LOCAL, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    var pFeed = fetch(FEED + '?t=' + Math.floor(Date.now() / 36e5), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    cache = Promise.all([pLocal, pFeed]).then(function (res) {
      var map = {};
      var local = res[0] && res[0].cards ? res[0].cards : {};
      Object.keys(local).forEach(function (k) { if (local[k] && local[k].url) map[k] = { url: local[k].url, item: local[k].item || null, title: local[k].title || null }; });
      var feed = res[1] && Array.isArray(res[1].cards) ? res[1].cards : [];
      feed.forEach(function (c) { if (c && c.key && c.image && c.image.url) map[c.key] = { url: c.image.url, item: c.image.item || null, title: c.image.title || null }; });
      return map;
    });
    return cache;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Deterministic hue from the name so the same card always gets the same tint.
  function hueOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  function initials(name) {
    var w = String(name || '').replace(/[—–].*$/, '').split(/\s+/).filter(function (t) { return t && !/[#\d]/.test(t) && !/^(1st|bowman|chrome|auto|prizm|rc|ex|sir|psa|bgs|sgc|raw|select|mosaic|topps|panini|the)$/i.test(t); });
    return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : (w[0] || '?').slice(0, 2)).toUpperCase();
  }
  function placeholder(o) {
    o = o || {};
    var hue = typeof o.hue === 'number' ? o.hue : hueOf(o.name);
    var ini = initials(o.name);
    var sub = String(o.sub || 'CARD').toUpperCase().slice(0, 18);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 350">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',55%,22%)"/><stop offset="1" stop-color="hsl(' + ((hue + 40) % 360) + ',60%,10%)"/></linearGradient>' +
      '<linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs>' +
      '<rect width="250" height="350" rx="14" fill="url(#g)"/><rect x="10" y="10" width="230" height="330" rx="10" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>' +
      '<rect width="250" height="350" rx="14" fill="url(#f)"/>' +
      '<text x="125" y="185" text-anchor="middle" font-family="Barlow Condensed,Impact,sans-serif" font-weight="900" font-size="96" fill="#fff" fill-opacity=".92">' + esc(ini) + '</text>' +
      '<text x="125" y="300" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="16" letter-spacing="3" fill="#00ccf5">' + esc(sub) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Cards the engine doesn't track (anything a visitor adds to the Vault) still get a
  // photo: one Browse call by name through the site's own comps endpoint, cached a week.
  var LS = 'sch_cimg_v1';
  function lsGet() { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; } }
  function lsSet(m) { try { localStorage.setItem(LS, JSON.stringify(m)); } catch (e) {} }
  var inflight = {};
  function byName(name) {
    var q = String(name || '').replace(/[—–].*$/, '').replace(/\s+/g, ' ').trim();
    if (q.length < 4) return Promise.resolve(null);
    var m = lsGet(), hit = m[q];
    if (hit && hit.t && Date.now() - hit.t < 7 * 864e5) return Promise.resolve(hit.v);
    if (inflight[q]) return inflight[q];
    var toks = q.toLowerCase().split(' ').filter(function (t) { return t.length > 2 && !/[#\d]/.test(t); }).slice(0, 4);
    inflight[q] = fetch('/api/comps?q=' + encodeURIComponent(q) + '&sort=price&limit=20&customid=img-vault').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var ls = (j && j.listings) || [];
      var best = null;
      for (var i = 0; i < ls.length; i++) {
        var l = ls[i], t = String(l.title || '').toLowerCase();
        if (!l.image || !/^https:\/\/i\.ebayimg\.com\//.test(l.image)) continue;
        var ok = toks.every(function (k) { return t.indexOf(k) > -1; });
        if (!ok) continue;
        if (/(lot of|reprint|digital|custom|proxy)/.test(t)) continue;
        best = { url: l.image.replace(/s-l\d+\./, 's-l500.'), item: l.url || null, title: l.title || null };
        if (l.buyingOption === 'FIXED_PRICE') break;
      }
      var mm = lsGet(); mm[q] = { t: Date.now(), v: best }; lsSet(mm);
      delete inflight[q];
      return best;
    }).catch(function () { delete inflight[q]; return null; });
    return inflight[q];
  }

  function tagLink(item, surface) {
    if (!item) return null;
    return item.replace(/customid=[^&]*/, 'customid=img-' + (surface || 'site').replace(/[^a-z0-9-]/gi, '').slice(0, 24).toLowerCase());
  }

  // Renders into `el` (replaces its content). Returns el.
  function render(el, key, o) {
    o = o || {};
    var sz = SIZES[o.size || 'thumb'] || SIZES.thumb;
    var w = sz[0], h = sz[1];
    var name = o.name || el.getAttribute('data-card-name') || key;
    var ph = placeholder({ name: name, sub: o.sub || el.getAttribute('data-card-sub') || (key && /^ebay:.*(ex|sir|mega)/i.test(key) ? 'POKEMON' : '1ST BOWMAN') });
    el.classList.add('sch-cimg', 'sch-cimg-' + (o.size || 'thumb'));
    el.style.width = w + 'px'; el.style.height = h + 'px';
    var img = '<img src="' + ph + '" width="' + w + '" height="' + h + '" alt="' + esc(name) + '" loading="' + (o.eager ? 'eager' : 'lazy') + '" decoding="async">';
    el.innerHTML = img;
    var imgEl = el.querySelector('img');
    load().then(function (map) {
      var hit = map[key];
      if (hit && hit.url) return hit;
      // engine-keyed cards without a verified photo stay on the placeholder (a name search
      // could return the wrong variant); visitor-added cards are looked up by their full name.
      if (key && key.indexOf('name:') === 0) return byName(key.slice(5));
      return null;
    }).then(function (hit) {
      if (!hit || !hit.url) return;
      var real = new Image();
      real.onload = function () {
        imgEl.src = hit.url; imgEl.classList.add('is-photo');
        if (o.link !== false && hit.item) {
          var a = document.createElement('a');
          a.href = tagLink(hit.item, o.surface || el.getAttribute('data-card-surface'));
          a.target = '_blank'; a.rel = 'noopener sponsored'; a.title = 'This listing on eBay';
          a.className = 'sch-cimg-link';
          el.appendChild(a); a.appendChild(imgEl);
        }
      };
      real.src = hit.url;
    });
    return el;
  }

  function enhance(root) {
    (root || document).querySelectorAll('[data-card-img]').forEach(function (el) {
      if (el.getAttribute('data-card-img-done')) return;
      el.setAttribute('data-card-img-done', '1');
      render(el, el.getAttribute('data-card-img'), { size: el.getAttribute('data-card-size') || 'thumb', surface: el.getAttribute('data-card-surface'), link: el.getAttribute('data-card-link') !== 'off' });
    });
  }

  var css = '.sch-cimg{display:inline-block;flex-shrink:0;border-radius:4px;overflow:hidden;background:#0b1116;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 4px 12px -6px rgba(0,0,0,.8);vertical-align:middle;position:relative}' +
    '.sch-cimg img{display:block;width:100%;height:100%;object-fit:cover;transition:opacity .35s ease,transform .25s ease}' +
    '.sch-cimg img.is-photo{animation:sch-cimg-in .4s ease both}' +
    '.sch-cimg-link{display:block;width:100%;height:100%}.sch-cimg-link:hover img{transform:scale(1.04)}' +
    '.sch-cimg-card,.sch-cimg-hero{border-radius:8px;box-shadow:0 0 0 1px rgba(0,204,245,.25),0 18px 40px -20px rgba(0,204,245,.35)}' +
    '@keyframes sch-cimg-in{from{opacity:0}to{opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){.sch-cimg img,.sch-cimg img.is-photo{animation:none;transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  window.SCH_IMG = { get: function (k) { return load().then(function (m) { return m[k] || null; }); }, render: render, placeholder: placeholder, enhance: enhance, SIZES: SIZES };
  function start() {
    enhance();
    // Pages that re-render (the Vault table, the homepage Top 5) get their photos without calling us.
    if ('MutationObserver' in window) {
      var pending = false;
      new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; enhance(); }); })
        .observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
