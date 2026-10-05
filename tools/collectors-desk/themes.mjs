// themes.mjs — the Collector's Desk element themes (Mo, Oct 5 2026: "style it like the pokemon we are promoting …
// similar to the pikachu and lightning on the 30th"). One theme per Pokémon type: fire (Charizard), ghost (Gengar),
// psychic (Mewtwo), aero (Lugia), moonlight (Umbreon), electric (Pikachu).
//
// Each theme = three exports keyed by name:
//   THEMES[name](colors)  → CSS string (headline treatment, ambient particles in .hero-fx, the on-load "breath", the sprite)
//   HERO_FX[name]()       → HTML dropped inside <div class="hero-fx"> (ambient particles + the breath overlays)
//   HERO_JS[name]()       → inline JS: arms the breath at 0.5 s and sends one sprite across the viewport at 2.2 s
// Every theme's particles and sprite are scoped to the hero / the sprite id, hidden on phones (≤760) and under
// prefers-reduced-motion (the Sep 29 Night Crew lesson from the 30th page: a bare .spark caught the sub-index sparkline).

export function hexa(hex, a) { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

// deterministic pseudo-random spread for particles (same page → same markup → clean diffs)
const spread = (n, fn) => { let s = ""; for (let i = 0; i < n; i++) s += fn(i, (k) => ((i * 7919 + k * 104729) % 1000) / 1000); return s; };

// the one sprite runner, shared: a fixed element flies across the bottom once; theme supplies the markup + path keyframes
const spriteJs = (markup) => `
(function(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 761) return;
  var sw = document.getElementById('desk-breath'), ho = document.getElementById('desk-breath-overlay');
  setTimeout(function(){ if (sw) sw.classList.add('breathing'); if (ho) ho.classList.add('breathing'); }, 500);
  var sp = document.createElement('div'); sp.id = 'desk-sprite'; sp.setAttribute('aria-hidden','true');
  sp.innerHTML = ${JSON.stringify(markup)};
  document.body.appendChild(sp);
  setTimeout(function(){ sp.classList.add('running'); }, 2200);
  sp.addEventListener('animationend', function(e){ if (e.target === sp) sp.classList.remove('running'); });
})();`;

const HIDE = `
    @media (max-width: 760px) { .hero-fx, #desk-sprite { display:none !important; } }
    @media (prefers-reduced-motion: reduce) { .hero-fx, #desk-sprite { display:none !important; } .hero h1 em { animation:none !important; } }`;

export const THEMES = {
  // ---------------------------------------------------------------- FIRE (Charizard)
  fire: (c) => `
    .hero h1 em { background:linear-gradient(100deg, #fff1b8 0%, ${c.glow} 28%, ${c.accent} 55%, ${c.accent2} 100%); background-size:200% 100%; -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent;
      animation:heat-shift 6s ease-in-out infinite; filter:drop-shadow(0 0 22px ${hexa(c.accent, 0.35)}); }
    @keyframes heat-shift { 0%,100% { background-position:0% 0; } 50% { background-position:100% 0; } }
    .ember { position:absolute; bottom:-12px; width:5px; height:5px; border-radius:50%; background:radial-gradient(circle, #fff3c4 0%, ${c.glow} 35%, ${c.accent} 70%, transparent 100%);
      box-shadow:0 0 8px 2px ${hexa(c.accent, 0.55)}; opacity:0; animation:ember-rise var(--d, 7s) ease-out var(--t, 0s) infinite; }
    .ember.s { width:3px; height:3px; } .ember.l { width:7px; height:7px; }
    @keyframes ember-rise {
      0%   { opacity:0; transform:translate(0, 0) scale(0.6); }
      10%  { opacity:0.95; }
      50%  { opacity:0.7; transform:translate(var(--x, 14px), -46vh) scale(1); }
      85%  { opacity:0.35; }
      100% { opacity:0; transform:translate(calc(var(--x, 14px) * -0.6), -92vh) scale(0.4); }
    }
    #desk-breath { position:absolute; top:18%; left:-40%; width:46%; height:64%; opacity:0; pointer-events:none; filter:blur(14px);
      background:radial-gradient(ellipse at 50% 50%, ${hexa("#fff1b8", 0.55)} 0%, ${hexa(c.glow, 0.5)} 22%, ${hexa(c.accent, 0.42)} 48%, ${hexa(c.accent2, 0.18)} 70%, transparent 82%); }
    #desk-breath.breathing { animation:flame-breath 1.6s cubic-bezier(.3,.8,.4,1) forwards; }
    @keyframes flame-breath { 0% { opacity:0; transform:translateX(0) scaleY(0.6); } 12% { opacity:1; } 60% { opacity:0.85; transform:translateX(220%) scaleY(1); } 100% { opacity:0; transform:translateX(320%) scaleY(0.7); } }
    #desk-breath-overlay { position:absolute; inset:0; opacity:0; pointer-events:none; background:radial-gradient(ellipse at 30% 40%, ${hexa(c.accent, 0.22)} 0%, transparent 55%); }
    #desk-breath-overlay.breathing { animation:heat-flash 1.6s ease-out forwards; }
    @keyframes heat-flash { 0% { opacity:0; } 15% { opacity:1; } 50% { opacity:0.45; } 100% { opacity:0; } }
    #desk-sprite { position:fixed; bottom:10px; left:-90px; width:36px; height:26px; z-index:900; pointer-events:none; opacity:0; }
    #desk-sprite.running { animation:sprite-fly 8s cubic-bezier(.4,0,.6,1) 1; }
    @keyframes sprite-fly { 0% { transform:translateX(0) translateY(0); opacity:0; } 4% { opacity:1; } 25% { transform:translateX(25vw) translateY(-14px); } 50% { transform:translateX(50vw) translateY(4px); } 75% { transform:translateX(75vw) translateY(-18px); } 96% { opacity:1; } 100% { transform:translateX(calc(100vw + 160px)) translateY(0); opacity:0; } }
    #desk-sprite .core { position:absolute; right:0; top:3px; width:22px; height:20px; border-radius:55% 45% 50% 50%;
      background:radial-gradient(circle at 40% 40%, #fff6d0 0%, ${c.glow} 35%, ${c.accent} 70%, ${c.accent2} 100%); box-shadow:0 0 16px 4px ${hexa(c.accent, 0.6)}; animation:core-flicker 0.16s steps(2) infinite; }
    @keyframes core-flicker { 0% { transform:scale(1,1); } 100% { transform:scale(1.08,0.92); } }
    #desk-sprite .tail { position:absolute; right:14px; top:5px; width:64px; height:16px; background:linear-gradient(90deg, transparent 0%, ${hexa(c.accent2, 0.5)} 30%, ${c.accent} 70%, ${c.glow} 100%);
      clip-path:polygon(0 50%, 18% 30%, 30% 48%, 48% 22%, 58% 50%, 76% 28%, 100% 42%, 100% 60%, 74% 72%, 56% 58%, 46% 80%, 28% 56%, 16% 72%); animation:tail-lick 0.22s steps(2) infinite; filter:blur(0.4px); }
    @keyframes tail-lick { 0% { transform:scaleY(1); opacity:0.95; } 100% { transform:scaleY(-1) translateY(2px); opacity:0.7; } }
    #desk-sprite:not(.running) .core, #desk-sprite:not(.running) .tail { animation:none; }
    .ck-grail:hover { border-left-color:${c.glow}; }
    .lad-raw .lad-v { text-shadow:0 0 18px ${hexa(c.accent, 0.35)}; }${HIDE}`,

  // ---------------------------------------------------------------- GHOST (Gengar)
  ghost: (c) => `
    .hero h1 em { color:${c.accent}; text-shadow:0 0 28px ${hexa(c.accent, 0.55)}, 0 0 60px ${hexa(c.accent2, 0.3)}; animation:ghost-flicker 7s steps(1) infinite; }
    @keyframes ghost-flicker { 0%,91%,93%,100% { opacity:1; } 92% { opacity:0.35; } 95% { opacity:0.7; } 96% { opacity:1; } 97.5% { opacity:0.5; } 98% { opacity:1; } }
    .wisp { position:absolute; width:140px; height:60px; border-radius:50%; filter:blur(22px); opacity:0; pointer-events:none;
      background:radial-gradient(ellipse, ${hexa(c.accent, 0.55)} 0%, ${hexa(c.accent2, 0.25)} 50%, transparent 72%); animation:wisp-drift var(--d, 16s) ease-in-out var(--t, 0s) infinite; }
    .wisp.s { width:80px; height:36px; } .wisp.l { width:220px; height:90px; }
    @keyframes wisp-drift { 0% { opacity:0; transform:translate(0,0) scale(0.8); } 15% { opacity:0.9; } 50% { opacity:0.55; transform:translate(var(--x, 60px), -40px) scale(1.1); } 85% { opacity:0.8; } 100% { opacity:0; transform:translate(calc(var(--x, 60px) * 1.6), -90px) scale(0.9); } }
    .eye { position:absolute; width:9px; height:9px; border-radius:50%; background:${c.glow}; box-shadow:0 0 10px 2px ${hexa(c.glow, 0.8)}; opacity:0; animation:eye-blink var(--d, 9s) steps(1) var(--t, 0s) infinite; }
    .eye + .eye { margin-left:16px; }
    @keyframes eye-blink { 0%,80%,100% { opacity:0; } 82%,88% { opacity:1; } 89% { opacity:0; } 90%,95% { opacity:1; } }
    #desk-breath { position:absolute; inset:-10% -5%; opacity:0; pointer-events:none; background:radial-gradient(ellipse at 50% 60%, ${hexa(c.accent, 0.3)} 0%, ${hexa(c.accent2, 0.12)} 40%, transparent 70%); filter:blur(10px); }
    #desk-breath.breathing { animation:haunt 2.2s ease-in-out forwards; }
    @keyframes haunt { 0% { opacity:0; transform:scale(0.7); } 30% { opacity:1; } 60% { opacity:0.5; transform:scale(1.15); } 100% { opacity:0; transform:scale(1.4); } }
    #desk-breath-overlay { display:none; }
    #desk-sprite { position:fixed; bottom:14px; left:-120px; width:44px; height:44px; z-index:900; pointer-events:none; opacity:0; }
    #desk-sprite.running { animation:sprite-phase 10s ease-in-out 1; }
    @keyframes sprite-phase { 0% { transform:translateX(0) translateY(0); opacity:0; } 6% { opacity:0.9; } 20% { transform:translateX(20vw) translateY(-26px); } 35% { opacity:0.15; } 45% { transform:translateX(45vw) translateY(6px); opacity:0.9; } 65% { transform:translateX(65vw) translateY(-30px); opacity:0.2; } 80% { transform:translateX(80vw) translateY(-4px); opacity:0.9; } 95% { opacity:0.6; } 100% { transform:translateX(calc(100vw + 180px)) translateY(-16px); opacity:0; } }
    #desk-sprite .orb { position:absolute; inset:0; border-radius:50% 50% 42% 42%; background:radial-gradient(circle at 40% 35%, ${hexa(c.glow, 0.9)} 0%, ${c.accent} 40%, ${c.accent2} 100%); box-shadow:0 0 22px 6px ${hexa(c.accent, 0.5)}; filter:blur(0.6px); animation:orb-wobble 0.9s ease-in-out infinite; }
    @keyframes orb-wobble { 0%,100% { transform:scale(1,1); } 50% { transform:scale(0.94,1.06); } }
    #desk-sprite .e1, #desk-sprite .e2 { position:absolute; top:13px; width:6px; height:6px; border-radius:50%; background:#fff; box-shadow:0 0 6px #fff; }
    #desk-sprite .e1 { left:12px; } #desk-sprite .e2 { left:26px; }
    #desk-sprite:not(.running) .orb { animation:none; }
    .ck-grail { border-left-color:${c.accent}; }
    .narrator { border-left-color:${c.glow}; box-shadow:0 0 0 1px ${hexa(c.glow, 0.15)}; }
    .narrator-chip { color:${c.glow}; } .narrator-eye { background:${c.glow}; box-shadow:0 0 10px ${c.glow}; }${HIDE}`,

  // ---------------------------------------------------------------- PSYCHIC (Mewtwo)
  psychic: (c) => `
    .hero h1 em { color:${c.accent}; text-shadow:0 0 24px ${hexa(c.accent, 0.5)}; animation:psy-hue 8s ease-in-out infinite; }
    @keyframes psy-hue { 0%,100% { color:${c.accent}; } 50% { color:${c.glow}; text-shadow:0 0 34px ${hexa(c.glow, 0.6)}; } }
    .ring { position:absolute; left:var(--cx, 72%); top:var(--cy, 45%); width:40px; height:40px; margin:-20px 0 0 -20px; border-radius:50%; border:1.5px solid ${hexa(c.accent, 0.7)}; opacity:0; pointer-events:none; animation:ring-out var(--d, 6s) ease-out var(--t, 0s) infinite; }
    @keyframes ring-out { 0% { opacity:0; transform:scale(0.2); } 10% { opacity:0.9; } 100% { opacity:0; transform:scale(14); border-width:0.5px; } }
    .mote { position:absolute; width:4px; height:4px; border-radius:50%; background:${c.glow}; box-shadow:0 0 8px 2px ${hexa(c.glow, 0.7)}; opacity:0; animation:mote-orbit var(--d, 11s) linear var(--t, 0s) infinite; }
    @keyframes mote-orbit { 0% { opacity:0; transform:rotate(0deg) translateX(var(--r, 120px)) rotate(0deg); } 10%,90% { opacity:0.8; } 100% { opacity:0; transform:rotate(360deg) translateX(var(--r, 120px)) rotate(-360deg); } }
    #desk-breath { position:absolute; left:50%; top:50%; width:60px; height:60px; margin:-30px 0 0 -30px; border-radius:50%; opacity:0; pointer-events:none; border:3px solid ${hexa(c.glow, 0.9)}; box-shadow:0 0 40px ${hexa(c.accent, 0.6)}, inset 0 0 30px ${hexa(c.accent, 0.5)}; }
    #desk-breath.breathing { animation:psy-pulse 1.8s cubic-bezier(.2,.8,.3,1) forwards; }
    @keyframes psy-pulse { 0% { opacity:0; transform:scale(0.2); } 15% { opacity:1; } 100% { opacity:0; transform:scale(30); border-width:0.5px; } }
    #desk-breath-overlay { position:absolute; inset:0; opacity:0; pointer-events:none; background:radial-gradient(circle at 50% 50%, ${hexa(c.accent, 0.25)} 0%, transparent 60%); }
    #desk-breath-overlay.breathing { animation:psy-flash 1.8s ease-out forwards; }
    @keyframes psy-flash { 0% { opacity:0; } 20% { opacity:1; } 100% { opacity:0; } }
    #desk-sprite { position:fixed; bottom:16px; left:-80px; width:30px; height:30px; z-index:900; pointer-events:none; opacity:0; }
    #desk-sprite.running { animation:sprite-glide 7s cubic-bezier(.45,0,.55,1) 1; }
    @keyframes sprite-glide { 0% { transform:translateX(0) translateY(0); opacity:0; } 5% { opacity:1; } 50% { transform:translateX(50vw) translateY(-40px); } 95% { opacity:1; } 100% { transform:translateX(calc(100vw + 120px)) translateY(0); opacity:0; } }
    #desk-sprite .orb { position:absolute; inset:5px; border-radius:50%; background:radial-gradient(circle at 40% 35%, #fff 0%, ${c.glow} 30%, ${c.accent} 100%); box-shadow:0 0 18px 4px ${hexa(c.accent, 0.7)}; }
    #desk-sprite .halo, #desk-sprite .halo2 { position:absolute; inset:-4px; border-radius:50%; border:1.5px solid ${hexa(c.glow, 0.8)}; animation:halo-out 1.1s ease-out infinite; }
    #desk-sprite .halo2 { animation-delay:0.55s; }
    @keyframes halo-out { 0% { opacity:0.9; transform:scale(0.6); } 100% { opacity:0; transform:scale(2.4); } }
    #desk-sprite:not(.running) .halo, #desk-sprite:not(.running) .halo2 { animation:none; }
    .ck-grail { border-left-color:${c.accent}; }${HIDE}`,

  // ---------------------------------------------------------------- AERO (Lugia)
  aero: (c) => `
    .hero h1 em { background:linear-gradient(100deg, #ffffff 0%, ${c.glow} 35%, ${c.accent} 70%, ${c.accent2} 100%); background-size:200% 100%; -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent; animation:aero-shine 7s ease-in-out infinite; filter:drop-shadow(0 0 18px ${hexa(c.accent, 0.3)}); }
    @keyframes aero-shine { 0%,100% { background-position:0% 0; } 50% { background-position:100% 0; } }
    .gust { position:absolute; left:-30%; top:var(--y, 40%); width:var(--w, 28%); height:1.5px; border-radius:2px; opacity:0; pointer-events:none; background:linear-gradient(90deg, transparent, ${hexa(c.glow, 0.9)} 50%, transparent); animation:gust-sweep var(--d, 5s) cubic-bezier(.2,.6,.4,1) var(--t, 0s) infinite; }
    .gust.l { height:2.5px; filter:blur(0.5px); }
    @keyframes gust-sweep { 0% { opacity:0; transform:translateX(0) scaleX(0.3); } 15% { opacity:0.8; } 60% { opacity:0.6; transform:translateX(300%) scaleX(1); } 100% { opacity:0; transform:translateX(480%) scaleX(0.6); } }
    .feather { position:absolute; left:var(--x, 50%); top:-30px; width:10px; height:22px; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; opacity:0; pointer-events:none; background:linear-gradient(180deg, #fff 0%, ${c.glow} 60%, ${hexa(c.accent, 0.3)} 100%); box-shadow:0 0 8px ${hexa(c.glow, 0.5)}; animation:feather-fall var(--d, 14s) ease-in-out var(--t, 0s) infinite; }
    @keyframes feather-fall { 0% { opacity:0; transform:translate(0,0) rotate(-20deg); } 10% { opacity:0.9; } 50% { transform:translate(40px, 45vh) rotate(25deg); } 90% { opacity:0.7; } 100% { opacity:0; transform:translate(-20px, 100vh) rotate(-30deg); } }
    #desk-breath { position:absolute; top:0; bottom:0; left:-60%; width:60%; opacity:0; pointer-events:none; background:linear-gradient(90deg, transparent, ${hexa(c.glow, 0.22)} 40%, ${hexa(c.accent, 0.3)} 60%, transparent); filter:blur(18px); transform:skewX(-18deg); }
    #desk-breath.breathing { animation:aero-gust 1.5s cubic-bezier(.3,.7,.3,1) forwards; }
    @keyframes aero-gust { 0% { opacity:0; transform:translateX(0) skewX(-18deg); } 20% { opacity:1; } 100% { opacity:0; transform:translateX(290%) skewX(-18deg); } }
    #desk-breath-overlay { display:none; }
    #desk-sprite { position:fixed; bottom:30px; left:-140px; width:90px; height:30px; z-index:900; pointer-events:none; opacity:0; }
    #desk-sprite.running { animation:sprite-soar 7s cubic-bezier(.35,0,.65,1) 1; }
    @keyframes sprite-soar { 0% { transform:translateX(0) translateY(0); opacity:0; } 5% { opacity:1; } 30% { transform:translateX(30vw) translateY(-60px); } 60% { transform:translateX(60vw) translateY(-20px); } 95% { opacity:1; } 100% { transform:translateX(calc(100vw + 200px)) translateY(-90px); opacity:0; } }
    #desk-sprite .wing { position:absolute; top:12px; width:42px; height:6px; border-radius:50% 50% 50% 50% / 100% 100% 0 0; background:linear-gradient(90deg, ${hexa(c.glow, 0.2)}, ${c.glow}); box-shadow:0 0 10px ${hexa(c.glow, 0.6)}; transform-origin:100% 50%; animation:wing-beat 0.5s ease-in-out infinite alternate; }
    #desk-sprite .wing.r { right:0; left:auto; transform-origin:0 50%; background:linear-gradient(270deg, ${hexa(c.glow, 0.2)}, ${c.glow}); animation-name:wing-beat-r; }
    #desk-sprite .wing.l { left:0; }
    @keyframes wing-beat { 0% { transform:rotate(-22deg); } 100% { transform:rotate(18deg); } }
    @keyframes wing-beat-r { 0% { transform:rotate(22deg); } 100% { transform:rotate(-18deg); } }
    #desk-sprite .body { position:absolute; left:39px; top:9px; width:12px; height:12px; border-radius:50%; background:radial-gradient(circle at 40% 35%, #fff, ${c.glow} 70%); box-shadow:0 0 12px ${hexa(c.glow, 0.8)}; }
    #desk-sprite:not(.running) .wing { animation:none; }
    .ck-grail { border-left-color:${c.glow}; }${HIDE}`,

  // ---------------------------------------------------------------- MOONLIGHT (Umbreon)
  moonlight: (c) => `
    .hero h1 em { color:${c.glow}; text-shadow:0 0 26px ${hexa(c.glow, 0.5)}; animation:moon-pulse 5s ease-in-out infinite; }
    @keyframes moon-pulse { 0%,100% { text-shadow:0 0 26px ${hexa(c.glow, 0.45)}; } 50% { text-shadow:0 0 44px ${hexa(c.glow, 0.8)}, 0 0 80px ${hexa(c.accent, 0.4)}; } }
    .hero::before { background:radial-gradient(circle at 82% 18%, ${hexa(c.glow, 0.22)} 0%, ${hexa(c.glow, 0.06)} 14%, transparent 30%) !important; }
    .moon { position:absolute; right:12%; top:10%; width:120px; height:120px; border-radius:50%; pointer-events:none; background:radial-gradient(circle at 40% 40%, ${hexa("#ffffff", 0.9)} 0%, ${hexa(c.glow, 0.7)} 45%, ${hexa(c.glow, 0.15)} 70%, transparent 72%); filter:blur(1px); box-shadow:0 0 60px 20px ${hexa(c.glow, 0.25)}; opacity:0.85; }
    .moon::after { content:''; position:absolute; left:28px; top:-10px; width:110px; height:110px; border-radius:50%; background:var(--bg, #07090c); }
    .star { position:absolute; width:2px; height:2px; border-radius:50%; background:#fff; opacity:0; animation:star-twinkle var(--d, 4s) ease-in-out var(--t, 0s) infinite; }
    .star.l { width:3px; height:3px; box-shadow:0 0 6px #fff; }
    @keyframes star-twinkle { 0%,100% { opacity:0.1; } 50% { opacity:0.95; } }
    .uring { position:absolute; left:var(--cx, 20%); top:var(--cy, 70%); width:34px; height:34px; margin:-17px 0 0 -17px; border-radius:50%; border:2px solid ${hexa(c.glow, 0.75)}; box-shadow:0 0 12px ${hexa(c.glow, 0.5)}, inset 0 0 10px ${hexa(c.glow, 0.3)}; opacity:0; pointer-events:none; animation:uring-glow var(--d, 6s) ease-in-out var(--t, 0s) infinite; }
    @keyframes uring-glow { 0%,100% { opacity:0; transform:scale(0.8); } 40%,60% { opacity:0.9; transform:scale(1); } }
    #desk-breath { position:absolute; inset:0; opacity:0; pointer-events:none; background:radial-gradient(circle at 82% 18%, ${hexa(c.glow, 0.45)} 0%, transparent 45%); }
    #desk-breath.breathing { animation:moon-rise 2.4s ease-out forwards; }
    @keyframes moon-rise { 0% { opacity:0; } 30% { opacity:1; } 100% { opacity:0; } }
    #desk-breath-overlay { display:none; }
    #desk-sprite { position:fixed; bottom:12px; left:-80px; width:34px; height:34px; z-index:900; pointer-events:none; opacity:0; }
    #desk-sprite.running { animation:sprite-roll 8s linear 1; }
    @keyframes sprite-roll { 0% { transform:translateX(0); opacity:0; } 4% { opacity:1; } 96% { opacity:1; } 100% { transform:translateX(calc(100vw + 140px)); opacity:0; } }
    #desk-sprite .ring { position:absolute; inset:0; border-radius:50%; border:4px solid ${c.glow}; box-shadow:0 0 18px 4px ${hexa(c.glow, 0.6)}, inset 0 0 12px ${hexa(c.glow, 0.5)}; animation:ring-spin 0.7s linear infinite; }
    #desk-sprite .ring::after { content:''; position:absolute; left:11px; top:-6px; width:6px; height:6px; border-radius:50%; background:#fff; box-shadow:0 0 8px #fff; }
    @keyframes ring-spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
    #desk-sprite:not(.running) .ring { animation:none; }
    .ck-grail { border-left-color:${c.glow}; }${HIDE}`,

  // ---------------------------------------------------------------- ELECTRIC (Pikachu)
  electric: (c) => `
    .hero h1 em { color:${c.accent}; text-shadow:0 0 30px ${hexa(c.accent, 0.5)}; animation:static-jitter 9s steps(1) infinite; }
    @keyframes static-jitter { 0%,93.5%,94.5%,96%,100% { transform:none; opacity:1; } 94% { transform:translate(1.5px,-1px); opacity:0.8; } 95% { transform:translate(-1.5px,1px); opacity:0.9; } }
    .spark { position:absolute; font-size:14px; line-height:1; color:${c.accent}; opacity:0; pointer-events:none; filter:drop-shadow(0 0 6px ${hexa(c.accent, 0.9)}); animation:spark-pop var(--d, 6s) ease-in-out var(--t, 0s) infinite; }
    @keyframes spark-pop { 0%,100% { opacity:0; transform:translateY(8px) scale(0.7) rotate(-8deg); } 15% { opacity:0.95; } 50% { opacity:0.5; transform:translateY(-26px) scale(1.05) rotate(10deg); } 85% { opacity:0.9; } }
    .arc { position:absolute; left:var(--x, 60%); top:var(--y, 30%); width:48px; height:16px; opacity:0; pointer-events:none; background:${c.glow}; filter:drop-shadow(0 0 5px ${c.accent});
      clip-path:polygon(0 55%, 14% 40%, 22% 62%, 38% 30%, 46% 58%, 60% 20%, 68% 52%, 84% 36%, 100% 48%, 100% 58%, 84% 48%, 68% 66%, 60% 34%, 46% 72%, 38% 44%, 22% 76%, 14% 54%, 0 68%); animation:arc-zap var(--d, 7s) steps(1) var(--t, 0s) infinite; }
    @keyframes arc-zap { 0%,88%,100% { opacity:0; } 89%,90.5% { opacity:1; } 91% { opacity:0; } 92%,93% { opacity:0.9; transform:scaleY(-1); } }
    #desk-breath { position:absolute; top:0; height:78%; left:var(--bolt-x, 62%); width:110px; opacity:0; pointer-events:none; filter:drop-shadow(0 0 18px ${hexa(c.accent, 0.9)});
      background:linear-gradient(180deg, #ffffff 0%, ${c.glow} 30%, ${c.accent} 70%, ${hexa(c.accent, 0.4)} 100%);
      clip-path:polygon(42% 0, 58% 0, 46% 34%, 62% 34%, 40% 62%, 55% 62%, 30% 100%, 38% 66%, 24% 66%, 44% 36%, 32% 36%); }
    #desk-breath.breathing { animation:bolt-flash 0.9s steps(1) forwards; }
    @keyframes bolt-flash { 0% { opacity:0; } 8% { opacity:1; } 16% { opacity:0.25; } 24% { opacity:1; } 34% { opacity:0.55; } 44% { opacity:0.95; } 70% { opacity:0.35; } 100% { opacity:0; } }
    #desk-breath-overlay { position:absolute; inset:0; opacity:0; pointer-events:none; background:radial-gradient(ellipse at 65% 0%, ${hexa(c.glow, 0.3)} 0%, transparent 55%); }
    #desk-breath-overlay.breathing { animation:sky-flash 0.9s ease-out forwards; }
    @keyframes sky-flash { 0% { opacity:0; } 10% { opacity:1; } 30% { opacity:0.4; } 45% { opacity:0.8; } 100% { opacity:0; } }
    #desk-sprite { position:fixed; bottom:6px; left:-80px; width:34px; height:30px; z-index:900; pointer-events:none; opacity:0; }
    #desk-sprite.running { animation:sprite-run 9s linear 1; }
    @keyframes sprite-run { 0% { transform:translateX(0); opacity:0; } 3% { opacity:1; } 97% { opacity:1; } 100% { transform:translateX(calc(100vw + 160px)); opacity:0; } }
    #desk-sprite .body { position:absolute; inset:0 0 4px 0; background:radial-gradient(circle at 38% 35%, #fff6b0 0%, ${c.accent} 45%, ${c.accent2} 100%); border-radius:50% 50% 46% 46%; box-shadow:0 0 14px 3px ${hexa(c.accent, 0.55)}; animation:sprite-hop 0.42s ease-in-out infinite; transform-origin:50% 100%; }
    @keyframes sprite-hop { 0%,100% { transform:translateY(0) scale(1.06,0.9); } 50% { transform:translateY(-9px) scale(0.92,1.1); } }
    #desk-sprite .cheek { position:absolute; width:7px; height:7px; border-radius:50%; background:#ff5533; left:4px; top:13px; opacity:0.85; }
    #desk-sprite .trail { position:absolute; right:100%; top:40%; width:52px; height:14px; background:linear-gradient(90deg, transparent, ${hexa(c.accent, 0.75)}); clip-path:polygon(0 55%, 28% 30%, 30% 55%, 55% 20%, 56% 50%, 82% 10%, 100% 45%, 100% 65%, 60% 75%, 30% 90%, 8% 70%); animation:trail-crackle 0.24s steps(2) infinite; }
    @keyframes trail-crackle { 0% { transform:scaleY(1); opacity:0.9; } 100% { transform:scaleY(-1); opacity:0.55; } }
    #desk-sprite:not(.running) .body, #desk-sprite:not(.running) .trail { animation:none; }
    .ck-grail { border-left-color:${c.glow}; }${HIDE}`,
};

export const HERO_FX = {
  fire: () => spread(22, (i, r) => `<span class="ember${i % 5 === 0 ? " l" : i % 3 === 0 ? " s" : ""}" style="left:${(2 + r(1) * 96).toFixed(1)}%;--d:${(5.5 + r(2) * 5).toFixed(2)}s;--t:${(-r(3) * 8).toFixed(2)}s;--x:${((r(4) - 0.5) * 60).toFixed(0)}px"></span>`)
    + `<div id="desk-breath-overlay"></div><div id="desk-breath"></div>`,
  ghost: () => spread(9, (i, r) => `<span class="wisp${i % 4 === 0 ? " l" : i % 3 === 0 ? " s" : ""}" style="left:${(r(1) * 90).toFixed(1)}%;top:${(20 + r(2) * 70).toFixed(1)}%;--d:${(12 + r(3) * 10).toFixed(2)}s;--t:${(-r(4) * 14).toFixed(2)}s;--x:${((r(5) - 0.5) * 160).toFixed(0)}px"></span>`)
    + spread(4, (i, r) => `<span class="eye" style="left:${(55 + r(1) * 40).toFixed(1)}%;top:${(15 + r(2) * 60).toFixed(1)}%;--d:${(8 + r(3) * 6).toFixed(2)}s;--t:${(-r(4) * 9).toFixed(2)}s"></span><span class="eye" style="left:calc(${(55 + r(1) * 40).toFixed(1)}% + 16px);top:${(15 + r(2) * 60).toFixed(1)}%;--d:${(8 + r(3) * 6).toFixed(2)}s;--t:${(-r(4) * 9).toFixed(2)}s"></span>`)
    + `<div id="desk-breath"></div>`,
  psychic: () => spread(6, (i, r) => `<span class="ring" style="--cx:${(62 + r(1) * 30).toFixed(1)}%;--cy:${(25 + r(2) * 50).toFixed(1)}%;--d:${(5 + r(3) * 4).toFixed(2)}s;--t:${(-r(4) * 7).toFixed(2)}s"></span>`)
    + spread(10, (i, r) => `<span class="mote" style="left:${(68 + r(1) * 22).toFixed(1)}%;top:${(30 + r(2) * 40).toFixed(1)}%;--r:${(60 + r(3) * 140).toFixed(0)}px;--d:${(9 + r(4) * 8).toFixed(2)}s;--t:${(-r(5) * 10).toFixed(2)}s"></span>`)
    + `<div id="desk-breath-overlay"></div><div id="desk-breath"></div>`,
  aero: () => spread(12, (i, r) => `<span class="gust${i % 4 === 0 ? " l" : ""}" style="--y:${(8 + r(1) * 84).toFixed(1)}%;--w:${(14 + r(2) * 22).toFixed(0)}%;--d:${(3.5 + r(3) * 4).toFixed(2)}s;--t:${(-r(4) * 7).toFixed(2)}s"></span>`)
    + spread(5, (i, r) => `<span class="feather" style="--x:${(50 + r(1) * 45).toFixed(1)}%;--d:${(12 + r(2) * 8).toFixed(2)}s;--t:${(-r(3) * 16).toFixed(2)}s"></span>`)
    + `<div id="desk-breath"></div>`,
  moonlight: () => `<div class="moon"></div>`
    + spread(34, (i, r) => `<span class="star${i % 6 === 0 ? " l" : ""}" style="left:${(r(1) * 100).toFixed(1)}%;top:${(r(2) * 100).toFixed(1)}%;--d:${(3 + r(3) * 4).toFixed(2)}s;--t:${(-r(4) * 6).toFixed(2)}s"></span>`)
    + spread(5, (i, r) => `<span class="uring" style="--cx:${(62 + r(1) * 34).toFixed(1)}%;--cy:${(62 + r(2) * 34).toFixed(1)}%;--d:${(5 + r(3) * 5).toFixed(2)}s;--t:${(-r(4) * 8).toFixed(2)}s"></span>`)
    + `<div id="desk-breath"></div>`,
  electric: () => spread(14, (i, r) => `<span class="spark" style="left:${(55 + r(1) * 42).toFixed(1)}%;top:${(10 + r(2) * 75).toFixed(1)}%;--d:${(5 + r(3) * 4).toFixed(2)}s;--t:${(-r(4) * 7).toFixed(2)}s">&#9889;</span>`)
    + spread(6, (i, r) => `<span class="arc" style="--x:${(50 + r(1) * 45).toFixed(1)}%;--y:${(10 + r(2) * 70).toFixed(1)}%;--d:${(6 + r(3) * 5).toFixed(2)}s;--t:${(-r(4) * 9).toFixed(2)}s"></span>`)
    + `<div id="desk-breath-overlay"></div><div id="desk-breath" style="--bolt-x:${(58 + 20 * 0.4).toFixed(0)}%"></div>`,
};

export const HERO_JS = {
  fire: () => spriteJs('<div class="tail"></div><div class="core"></div>'),
  ghost: () => spriteJs('<div class="orb"></div><div class="e1"></div><div class="e2"></div>'),
  psychic: () => spriteJs('<div class="halo"></div><div class="halo2"></div><div class="orb"></div>'),
  aero: () => spriteJs('<div class="wing l"></div><div class="body"></div><div class="wing r"></div>'),
  moonlight: () => spriteJs('<div class="ring"></div>'),
  electric: () => spriteJs('<div class="trail"></div><div class="body"></div><div class="cheek"></div>'),
};
