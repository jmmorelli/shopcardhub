// tools/lib/rip-shelf.mjs — P1 "Rip opens the shelf" (motion ruling Nov 10 2026, ADOPT; Cupertino run 15, Motion seat).
// A best-cards shelf arrives as a foil pack: it tears, the shelf's cards rise out, fan, and land as a row at full size with
// the figure and the eBay link the shelf already prints. The row is built FROM the shelf's own printed HTML (first print of
// each entry): same image key, same raw figure and R18 basis words, the same eBay href byte for byte (customid included).
// So a regen re-marks it with the rows, and it can never print a figure the rows below it don't.
// Static (no JS, reduced motion, print) = the landed row. Motion = js/rip-shelf.js (transform + opacity only, CLS 0).
// DESIGN-SYSTEM.md "Best-cards pages" → "Rip opens the shelf".

const pick = (re, s) => { const m = s.match(re); return m ? m[1] : null; };
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").trim();

// gridHtml = the shelf's <div class="ck-grid"> contents (its <article class="ck …"> entries, as printed)
export function ripCards(gridHtml) {
  return gridHtml.split(/<article class="ck /).slice(1).map((a) => {
    const pr = a.split(/<div class="print[ "]/)[1] || "";
    const href = pick(/<a class="lk lk-raw" href="([^"]+)"/, pr);
    const cid = pick(/<a class="lk lk-raw"[^>]*?gtag\('event','click',\{item:'([^']+)'/, pr);
    const raw = pr.match(/<div class="lad-cell( lad-raw| lad-na)?"><div class="lad-k">Raw<\/div><div class="lad-v">([^<]*)<\/div><div class="lad-s">([^<]*)<\/div>/);
    if (!href || !cid || !raw) return null;
    return {
      tag: pick(/<span class="ck-tag">([^<]*)<\/span>/, a),
      title: pick(/<h3>([^<]*)<\/h3>/, a),
      label: pick(/<div class="print-label">([^<]*)<\/div>/, pr),
      img: pick(/data-card-img="([^"]*)"/, pr),
      name: pick(/data-card-name="([^"]*)"/, pr),
      v: raw[2], s: raw[3], na: raw[1] === " lad-na",
      href, cid,
    };
  }).filter(Boolean);
}

// shelf = { key, label, eyebrow }; returns the stage markup (pack + landed row), or "" when the shelf has < 2 cards
export function ripBlock(shelf, gridHtml) {
  const cs = ripCards(gridHtml).slice(0, 4);
  if (cs.length < 2) return "";
  const li = cs.map((c, i) => `
          <li class="rc" style="--i:${i}">
            <span class="rc-img" data-card-img="${c.img}" data-card-name="${c.name}" data-card-sub="pokemon" data-card-size="card" data-card-link="off"></span>
            <div class="rc-cap">
              <span class="rc-t">${c.tag}</span>
              <span class="rc-n">${c.title}</span>
              <span class="rc-p${c.na ? " rc-na" : ""}">${c.v}${c.label ? ` <small>${c.label}, raw</small>` : ` <small>raw</small>`}</span>
              <span class="rc-s">${c.s}</span>
              <a class="rc-go" href="${c.href}" target="_blank" rel="noopener sponsored" data-rip-cid="${c.cid}">Raw on eBay&nbsp;&#8250;</a>
            </div>
          </li>`).join("");
  return `
      <div class="rip" data-rip="${shelf.key}">
        <div class="rip-stage">
          <div class="rip-pack" aria-hidden="true"><div class="rip-top"></div><div class="rip-body"><div class="rip-face"><span class="rip-mark">Shop<i>Card</i>Hub</span><span class="rip-who">Rip's shelf</span><span class="rip-what">${shelf.label}</span><span class="rip-n">${shelf.eyebrow}</span><span class="rip-band"></span></div></div></div>
          <ol class="rip-row" aria-label="${shelf.label}">${li}
          </ol>
          <div class="rip-hint" aria-hidden="true">Scroll to open</div>
        </div>
      </div>`;
}

// <head> switch: motion only with JS + IntersectionObserver + no reduced-motion preference. Set before first paint, so the
// desktop scrub length (250vh) is in the layout from the start (CLS 0). If js/rip-shelf.js has not run by DOMContentLoaded
// (blocked, failed), the class comes off and the landed row shows.
export const RIP_HEAD = `<script>(function(){try{var d=document.documentElement;if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('rip-on');document.addEventListener('DOMContentLoaded',function(){if(!window.__rip)d.classList.remove('rip-on')})}catch(e){}})();</script>`;

// foil = the character's colour (--pb); foilDeep = it at 40% on black, for the pack's edges
export const RIP_CSS = (foilDeep) => `
    /* Cupertino run 15 (P1, Motion seat): "Rip opens the shelf" — DESIGN-SYSTEM.md "Best-cards pages" */
    .rip { --foil:var(--pb); --foil-deep:${foilDeep}; --cw:min(216px, calc((100vw - 120px) / 4)); position:relative; margin:0 0 32px; border-radius:var(--ds-radius); background:var(--ds-surface-1); }
    .rip-stage { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 24px; border-radius:var(--ds-radius); overflow:clip; }
    .rip-row { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4, var(--cw)); gap:18px 24px; align-items:start; }
    .rc { position:relative; width:var(--cw); transform-origin:50% calc(var(--cw) * .698); }
    .rip .rc-img { display:block; width:var(--cw) !important; height:calc(var(--cw) * 1.396) !important; border-radius:4.4% / 3.2% !important; box-shadow:none !important; background:var(--ds-surface-2) !important; }
    .rip .rc-img img { width:100% !important; height:100% !important; object-fit:cover; }
    .rc-cap { display:grid; gap:2px; padding-top:12px; opacity:var(--cap, 1); }
    .rc-t { font:600 12px/1.33 var(--ds-font); color:var(--text-dim); }
    .rc-n { font:600 14px/1.29 var(--ds-font); color:var(--text-head); }
    .rc-p { margin-top:4px; font:600 21px/1.17 var(--ds-font); color:var(--text-head); }
    .rc-p small { display:block; margin-top:2px; font:400 12px/1.33 var(--ds-font); color:var(--text-dim); }
    .rc-p.rc-na { font-size:17px; color:var(--text-dim); }
    .rc-s { font:400 12px/1.33 var(--ds-font); color:var(--text-dim); }
    .rc-go { display:inline-flex; align-items:center; min-height:44px; font:400 14px/1 var(--ds-font); color:var(--accent); text-decoration:none; }
    .rc-go:hover { text-decoration:underline; }
    .rip-pack, .rip-hint { display:none; }
    html.rip-on .rip-pack { display:block; position:absolute; left:0; top:0; z-index:3; transform-style:preserve-3d; will-change:transform, opacity; pointer-events:none; }
    html.rip-on .rc { z-index:2; opacity:0; will-change:transform, opacity; }
    html.rip-on .rc-cap { opacity:var(--cap, 0); }
    .rip-body, .rip-top { position:absolute; left:0; width:100%;
      background:linear-gradient(105deg, transparent 32%, rgba(255,255,255,.26) 47%, rgba(255,255,255,.05) 55%, transparent 66%) var(--sheen, 120%) 0 / 260% 100% no-repeat,
        repeating-linear-gradient(118deg, rgba(255,255,255,.035) 0 6px, transparent 6px 14px),
        linear-gradient(165deg, var(--foil-deep), #1d1d1f 46%, #121213 70%, var(--foil-deep)); }
    .rip-body { top:0; height:100%; border-radius:0 0 6px 6px; }
    .rip-body::after, .rip-top::before { content:""; position:absolute; left:0; right:0; height:16px; background:repeating-linear-gradient(90deg, rgba(255,255,255,.16) 0 2px, transparent 2px 5px); }
    .rip-body::after { bottom:0; border-radius:0 0 6px 6px; }
    .rip-top { border-radius:6px 6px 0 0; transform-origin:0 100%; }
    .rip-top::before { top:0; border-radius:6px 6px 0 0; }
    .rip-face { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:0 12px; text-align:center; }
    .rip-mark { position:absolute; top:26px; font:600 12px/1 var(--ds-font); color:var(--text-head); }
    .rip-mark i { font-style:normal; color:var(--foil); }
    .rip-who { font:600 12px/1.33 var(--ds-font); color:var(--foil); }
    .rip-what { font:600 clamp(24px, 3.2vw, 30px)/1.05 var(--ds-font); letter-spacing:-.015em; color:var(--text-head); }
    .rip-n { font:400 12px/1.33 var(--ds-font); color:var(--text-dim); }
    .rip-band { width:44px; height:3px; margin-top:6px; border-radius:2px; background:var(--foil); }
    @media (min-width: 760px) {
      html.rip-on .rip { height:250vh; }
      html.rip-on .rip-stage { position:sticky; top:var(--ds-nav-h, 44px); height:calc(100vh - var(--ds-nav-h, 44px)); height:calc(100svh - var(--ds-nav-h, 44px)); padding:24px; }
      html.rip-on .rip { --cw:min(216px, calc((100vw - 120px) / 4), calc((100svh - var(--ds-nav-h, 44px) - 230px) / 1.396)); }
      html.rip-on .rip-hint { display:block; position:absolute; left:0; right:0; bottom:20px; z-index:5; text-align:center; font:400 14px/1.43 var(--ds-font); color:var(--text-dim); }
    }
    @media (max-width: 759px) {
      .rip { --cw:min(168px, calc((100vw - 2 * var(--ds-gutter, 16px) - 48px) / 2)); }
      .rip-row { grid-template-columns:repeat(2, var(--cw)); gap:24px 16px; }
      .rip-stage { padding:32px 16px; }
    }
    @media print {
      html.rip-on .rip { height:auto; } html.rip-on .rip-stage { position:relative; height:auto; }
      .rip-pack, .rip-hint { display:none !important; } .rc { opacity:1 !important; transform:none !important; } .rc-cap { opacity:1 !important; }
    }`;

export function darken(hex, k = 0.4) {
  const n = parseInt(hex.replace("#", ""), 16), f = (x) => Math.round(x * k).toString(16).padStart(2, "0");
  return "#" + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255);
}
