/* signup.js — the one email capture for the site (Sep 26 2026).
 *
 * Why: on Sep 26 the list had 4 subscribers. The top five landing pages carried no signup form at all;
 * the forms that existed sat below the fold on pages with a tenth of the traffic, under a pitch that
 * promised nothing concrete. Retention on a data site lives on the list, so the list gets one
 * component, one promise, on every commercial page, right under the buy strip.
 *
 * Markup (written by tools/build-signup.mjs; hand pages may use it too):
 *   <div class="sch-signup" data-signup="<source>" data-variant="tape|watchlist"></div>
 * Renders a one-line form → POST /api/subscribe {email, source}. Source is the page slug (the
 * retention KPI is "which page converts"); the watchlist variant sends watchlist-<n cards> so the
 * Tuesday lane can address that group without the site storing anything but the address.
 * Remembers a successful signup per browser (sch_subscribed) and shows a quiet "you're on it" line
 * instead of the form on later visits. Never writes anything else. */
(function () {
  var els = document.querySelectorAll('.sch-signup[data-signup]');
  if (!els.length) return;
  if (!document.getElementById('ss-css')) { var st = document.createElement('style'); st.id = 'ss-css'; st.textContent = ".sch-signup{max-width:1060px;margin:10px auto 0;padding:0 24px;} .sch-signup .ss-row{display:flex;align-items:center;gap:8px 16px;flex-wrap:wrap;padding:10px 16px;border:1px solid var(--border2,rgba(255,255,255,.12));border-left:3px solid var(--gold,#f5c800);background:var(--bg2,#0c1017);} .sch-signup .ss-k{font-family:var(--fm,monospace);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold,#f5c800);white-space:nowrap;} .sch-signup .ss-p{font-family:var(--fb,sans-serif);font-size:12.5px;color:var(--text-dim,#7a969e);line-height:1.45;flex:1 1 320px;min-width:0;} .sch-signup .ss-f{display:flex;gap:6px;flex:0 0 auto;} .sch-signup input{background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.18);color:var(--text-head,#e4f0f4);font-size:13px;padding:8px 12px;border-radius:2px;min-width:200px;} .sch-signup input:focus{outline:none;border-color:var(--gold,#f5c800);} .sch-signup button{background:var(--gold,#f5c800);color:#000;border:0;font-family:var(--fm,monospace);font-size:10.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:8px 14px;border-radius:2px;cursor:pointer;white-space:nowrap;} .sch-signup button:disabled{opacity:.6;cursor:default;} .sch-signup .ss-ok{font-family:var(--fm,monospace);font-size:12px;color:var(--green,#00e07a);} .sch-signup .ss-msg{font-family:var(--fm,monospace);font-size:11px;color:var(--text-dim,#7a969e);width:100%;} .sch-signup .ss-msg:empty{display:none;} .sch-signup .ss-msg.err{color:var(--red,#ff2e55);} @media(max-width:760px){.sch-signup{padding:0 16px;}.sch-signup .ss-f{width:100%;}.sch-signup input{flex:1 1 auto;min-width:0;}}"; document.head.appendChild(st); }
  var done = false; try { done = localStorage.getItem('sch_subscribed') === '1'; } catch (e) {}
  var COPY = {
    tape: {
      k: 'The Tuesday Tape',
      p: 'The Monday close of every set index, the week’s movers, and the chase cards’ sold marks. One email, Tuesdays. Free.',
      b: 'Get the Tuesday Tape',
      ok: '✓ You’re on it — the next close lands Tuesday.'
    },
    watchlist: {
      k: 'Your cards, re-marked',
      p: 'An email when your watched cards re-mark on Monday — the close, then your list. No account; the address is the only thing we keep.',
      b: 'Email me Tuesdays',
      ok: '✓ Set — Tuesday’s email opens on your list.'
    }
  };
  function vaultCount() {
    try { var s = JSON.parse(localStorage.getItem('sch_vault_v1') || 'null'); return s && Array.isArray(s.cards) ? s.cards.length : 0; } catch (e) { return 0; }
  }
  Array.prototype.forEach.call(els, function (el) {
    var v = el.getAttribute('data-variant') === 'watchlist' ? 'watchlist' : 'tape', c = COPY[v];
    var src = String(el.getAttribute('data-signup') || 'site').replace(/[^a-z0-9_-]/gi, '').slice(0, 30);
    if (v === 'watchlist') src = 'watchlist-' + vaultCount();
    if (done) { el.innerHTML = '<div class="ss-row"><span class="ss-k">' + c.k + '</span><span class="ss-ok">' + c.ok.replace(/ —.*$/, '') + '</span></div>'; return; }
    el.innerHTML = '<form class="ss-row" novalidate><span class="ss-k">✉ ' + c.k + '</span><span class="ss-p">' + c.p + '</span>' +
      '<span class="ss-f"><input type="email" required autocomplete="email" placeholder="your@email.com" aria-label="Email address"><button type="submit">' + c.b + '</button></span>' +
      '<span class="ss-msg" role="status" aria-live="polite"></span></form>';
    var f = el.querySelector('form'), inp = el.querySelector('input'), btn = el.querySelector('button'), msg = el.querySelector('.ss-msg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = (inp.value || '').trim();
      if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(em)) { msg.textContent = 'That doesn’t look like an email.'; msg.className = 'ss-msg err'; inp.focus(); return; }
      btn.disabled = true; msg.textContent = ''; msg.className = 'ss-msg';
      fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: em, source: src }) })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          try { localStorage.setItem('sch_subscribed', '1'); } catch (e2) {}
          f.innerHTML = '<span class="ss-k">' + c.k + '</span><span class="ss-ok">' + c.ok + '</span>';
          if (typeof gtag === 'function') gtag('event', 'newsletter_signup', { method: 'mailerlite', location: src, variant: v });
        })
        .catch(function () { btn.disabled = false; msg.textContent = 'That didn’t take — try again in a moment.'; msg.className = 'ss-msg err'; });
    });
  });
})();
