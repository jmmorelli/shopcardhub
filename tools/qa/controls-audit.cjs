// controls-audit.cjs — clicks every interactive control on the five terminal pages and reports works / dead / n-a (Terminal hotfix, Sep 12 2026). Usage: node tools/qa/controls-audit.cjs [--nofeed]  (SCH_SCRATCH=<dir with shopcardhub/, pd/data/, step2/auctions-stub.json>)
// Interactive-control audit on the five terminal pages. Each control is clicked; we record whether the DOM changed
// (hash of body HTML + hidden/open states), the page navigated, or the scroll position moved.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path');
const SCRATCH = process.env.SCH_SCRATCH || '/tmp/claude-0/-home-claude/001ef9d7-c6a8-5b3e-9083-7099028982da/scratchpad';
const PORT = 8771, BASE = 'http://127.0.0.1:' + PORT;
const NOFEED = process.argv.includes('--nofeed');
const auctions = JSON.parse(fs.readFileSync(SCRATCH + '/step2/auctions-stub.json', 'utf8'));
const vault = { demo: false, lists: [{ id: 'default', name: 'My cards', createdAt: 0 }, { id: 'pfkids', name: "Kids' box", createdAt: 1 }], cards: [
  { id: 'c1', status: 'own', listId: 'default', cat: 'baseball', name: 'Ethan Holliday 1st Bowman Chrome Auto', set: '2026 Bowman', grade: 'Raw', cost: 172, qty: 2, buyDate: '2026-08-20', feedKey: 'ebay:ethan-holliday', prices: [180, 176, 175, 170, 168, 165].map((p, i) => ({ t: Date.now() - (5 - i) * 864e5, p, src: 'feed' })) },
  { id: 'c2', status: 'own', listId: 'pfkids', cat: 'baseball', name: 'Andrew Fischer 1st Bowman Chrome Auto', set: '2026 Bowman', grade: 'Raw', cost: 140, qty: 1, buyDate: '2026-08-22', feedKey: 'ebay:andrew-fischer', prices: [150, 155, 160, 187].map((p, i) => ({ t: Date.now() - (3 - i) * 864e5, p, src: 'feed' })) },
  { id: 'w1', status: 'watch', cat: 'baseball', name: 'Konnor Griffin 2026 Bowman Sapphire', set: '2026 Bowman Sapphire', grade: 'Raw', target: 18, feedKey: 'ebay:konnor-griffin-sapphire', prices: [{ t: Date.now(), p: 16.99, src: 'feed' }] },
] };
const CONTROLS = {
  'index.html': [
    ['rail: Home', '#rail a.rl[href="/"]', 'nav'], ['rail: Bowman Bangers board', '#rail a.rl[href="/bowman-bangers"]', 'nav'], ['rail: Set indices', '#rail a.rl[href="/indices"]', 'nav'], ['rail: Auction Desk', '#rail a.rl[href="/auctions"]', 'nav'], ['rail: Tuesday Tape (#tape)', '#rail a.rl[href="/#tape"]', 'scroll'],
    ['rail: Guides all →', '#rail .rl-guides h4 a', 'nav'], ['rail: guides <details> Sports', '#rail .rl-grp:nth-of-type(1) > summary', 'dom'], ['rail: guide link (Sports → first, after opening)', '#rail .rl-grp:nth-of-type(1) a.rl.sub', 'nav+open'],
    ['rail: Portfolios Vault →', '#rail h4 a[href="/watchlist"]', 'nav'], ['rail: portfolio row (My cards)', '#rail [data-rail="portfolios"] a[data-pf="default"]', 'nav'], ['rail: Hunting row', '#rail [data-rail="portfolios"] a[data-pf="hunting"]', 'nav'], ['rail: + New portfolio', '#rail [data-rail="portfolios"] a.pf-new', 'nav'],
    ['rail: saved screen (Autos under $100)', '#rail a.rl.sc[data-screen="under100"]', 'screen'], ['rail: saved screen (Fat tails)', '#rail a.rl.sc[data-screen="fat"]', 'screen'], ['rail: saved screen (board)', '#rail a.rl.sc[data-screen="board"]', 'screen'],
    ['markets: row PB26 (chart swap)', 'a.mrow[data-k="PB26"]', 'dom'], ['markets: row BOW26 then BOARD (swap back)', 'a.mrow[data-k="BOARD"]', 'dom+pre:a.mrow[data-k="BOW26"]'], ['markets: PRE row BCB26', 'a.mrow.pre-row', 'nav'], ['markets: open X » (chart cap link)', '.chart-cap a', 'nav'],
    ['engine: card link', '[data-home="engine"] li a', 'nav'], ['engine: All signals »', '.grid2.top .panel:last-child .panel-h a', 'nav'],
    ['focus: item 1', '[data-home="focus"] a:nth-child(1)', 'scroll'], ['focus: item 2 (Auction Desk)', '[data-home="focus"] a:nth-child(2)', 'nav'], ['focus: item 3', '[data-home="focus"] a:nth-child(3)', 'nav'],
    ['movers: card link', '[data-home="movers"] li a', 'nav'], ['movers: Full board »', 'a[href="/bowman-bangers"].num', 'nav'], ['auction desk: row link (eBay, new tab)', '[data-home="auctions"] li a', 'external'], ['auction desk: Auction Desk »', 'a[href="/auctions"].num', 'nav'],
    ['screens: chip |z| beyond 2', '.scr-chips a[data-screen="z2"]', 'screen'], ['screens: chip All cards', '.scr-chips a[data-screen="all"]', 'screen'], ['screens: chip Board', '.scr-chips a[data-screen="board"]', 'screen'], ['screens: row link', '[data-screen-body]:not([hidden]) td.sym a', 'nav'],
    ['tape: signup submit (empty email → native validation)', '#sch-signup button[type="submit"]', 'validation'],
  ],
  'watchlist.html': [
    ['rail: Home', '#rail a.rl[href="/"]', 'nav'], ['rail: portfolio row (Kids box)', '#rail [data-rail="portfolios"] a[data-pf="pfkids"]', 'dom'], ['rail: Hunting row', '#rail [data-rail="portfolios"] a[data-pf="hunting"]', 'dom'], ['rail: saved screen (goes to /)', '#rail a.rl.sc[data-screen="drying"]', 'nav'],
    ['vault: tab My Cards (from Hunting)', '#tabOwn', 'dom+pre:#tabWatch'], ['vault: portfolio name ▾ (menu)', '.pf-name', 'dom'], ['vault: menu → Kids box', '#pfMenu a[href="#pf=pfkids"]', 'dom'], ['vault: + New portfolio (prompt)', '#pfMenu .act', 'dom'], ['vault: Rename (prompt)', '#pfMenu .act:nth-of-type(2)', 'dom'], ['vault: Delete (confirm)', '#pfMenu .act.danger', 'dom'],
    ['vault: tab Hunting', '#tabWatch', 'dom'], ['vault: sort select (row order)', '#sortSel', 'select-order'], ['vault: group select', '#groupSel', 'select'], ['vault: Columns ▾', '#colWrap .btn', 'dom'], ['vault: view Cards', '#viewCards', 'dom'], ['vault: view Table (from Cards)', '#viewTable', 'dom+pre:#viewCards'],
    ['vault: + Add Card', '#addBtn', 'dom'], ['vault: Paste a List', 'button[onclick*="openBulk"]', 'dom'], ['vault: Share (image modal)', 'button[onclick*="shareVaultImg"]', 'dom'], ['vault: Import (file picker)', 'button[onclick*="importFile"]', 'picker'], ['vault: Export JSON', 'button[onclick="exportData()"]', 'download'],
    ['vault: table row → popup', '.vgrid tbody tr:not(.grp)', 'dom'], ['vault: analytics toggle', '.an-toggle', 'dom'], ['vault: How the Vault works <details>', '#vaultHow > summary', 'dom'],
  ],
  'indices.html': [['rail: Home', '#rail a.rl[href="/"]', 'nav'], ['rail: saved screen (→ /#screen=)', '#rail a.rl.sc[data-screen="fat"]', 'nav'], ['index: first ticker row', '#sections a[href*="-index"], #sections tr[onclick], #sections .row', 'nav'], ['index: ticker row (BOW26, last)', '#sections tr.idx >> nth=-1', 'nav'], ['index: hero card photo (eBay, new tab)', '.hero-card-photo .sch-cimg-link, .hero-card-photo a', 'external']],
  'auctions.html': [['rail: Auction Desk (self)', '#rail a.rl[href="/auctions"]', 'nav'], ['auctions: chip Under the mark', '.au-chip:nth-of-type(2)', 'dom'], ['auctions: chip Has bids', '.au-chip:nth-of-type(3)', 'dom'], ['auctions: chip Closing in 6h', '.au-chip:nth-of-type(4)', 'dom'], ['auctions: card select', '#au-card', 'select'], ['auctions: row link (eBay, new tab)', '.au-wrap a[href*="ebay.com"]', 'external']],
  'bowman-bangers.html': [['rail: Set indices', '#rail a.rl[href="/indices"]', 'nav'], ['bangers: signal board seg Buy', 'button.seg:nth-of-type(2)', 'dom'], ['bangers: signal board seg Sell', 'button.seg:nth-of-type(4)', 'dom'], ['bangers: signal board seg All', 'button.seg:nth-of-type(1)', 'dom+pre:button.seg:nth-of-type(2)'], ['bangers: ★ Track (chooser)', '.sch-track-card', 'dom'], ['bangers: signup GET IT (empty)', '#tapecap button, #tapecap input[type=submit]', 'dom']],
};
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SCRATCH + '/shopcardhub', stdio: 'ignore' }); await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch(); const results = [];
  for (const [page, controls] of Object.entries(CONTROLS)) {
    for (const [label, sel, expect] of controls) {
      const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const pg = await ctx.newPage();
      const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
      await pg.route('**/*', async route => { const u = route.request().url(); const m = u.match(/price-data\/data\/([^?]+)/); if (m) return NOFEED ? route.abort() : route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync(path.join(SCRATCH, 'pd/data', m[1]), 'utf8') }); if (/\/api\/auctions/.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(auctions) }); if (/\/api\//.test(u)) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"verified":[],"listings":[],"rows":[]}' }); if (/^https?:\/\/127\.0\.0\.1/.test(u)) return route.continue(); return route.abort(); });
      pg.on('dialog', async d => { await d.accept(d.type() === 'prompt' ? 'Renamed box' : undefined); });
      let popup = null; pg.on('popup', p => { popup = p; });
      await pg.goto(BASE + '/robots.txt'); await pg.evaluate(v => localStorage.setItem('sch_vault_v1', JSON.stringify(v)), vault);
      await pg.goto(BASE + '/' + page + (page === 'watchlist.html' ? '#pf=all' : ''), { waitUntil: 'load' }); await pg.waitForTimeout(NOFEED ? 800 : 1600);
      if (label.startsWith('vault: menu') || label.startsWith('vault: + New') || label.startsWith('vault: Rename') || label.startsWith('vault: Delete')) { await pg.click('.pf-name'); await pg.waitForTimeout(150); if (label.startsWith('vault: Rename') || label.startsWith('vault: Delete')) { await pg.evaluate(() => switchPf('pfkids')); await pg.click('.pf-name'); await pg.waitForTimeout(150); } }
      let pre = null; let ex = expect; if (ex.indexOf('+pre:') > 0) { pre = ex.split('+pre:')[1]; ex = ex.split('+pre:')[0]; await pg.click(pre); await pg.waitForTimeout(400); }
      if (ex === 'nav+open') { await pg.click('#rail .rl-grp:nth-of-type(1) > summary'); await pg.waitForTimeout(200); ex = 'nav'; }
      const el = await pg.$(sel);
      if (!el) { results.push([page, label, 'n/a', 'selector not found: ' + sel]); await ctx.close(); continue; }
      const snap = () => pg.evaluate(() => ({ url: location.href, y: window.scrollY, html: document.body.innerHTML.length + ':' + [...document.querySelectorAll('[hidden],[open],.on,.active,.show,.open,.flash,[aria-pressed="true"]')].map(e=>e.className+(e.getAttribute('data-f')||'')).join(','), sel: (document.getSelection() || '').toString() }));
      const before = await snap();
      let res = '', note = '';
      try {
        if (ex === 'external') { const a = await pg.evaluate(s => { const e = document.querySelector(s); return { href: e.getAttribute('href') || '', target: e.getAttribute('target') || '' }; }, sel); res = /^https?:/.test(a.href) ? 'works' : 'dead'; note = 'target=' + a.target + ' → ' + a.href.slice(0, 50); }
        else if (ex === 'validation') { await el.click(); const v = await pg.evaluate(() => { const i = document.querySelector('#sch-signup input[type=email]'); return i ? i.validity.valid : null; }); res = v === false ? 'works' : 'dead'; note = 'native required-field validation blocks the empty submit'; }
        else if (ex === 'select-order') { const order0 = await pg.evaluate(() => [...document.querySelectorAll('.vgrid tbody tr:not(.grp) .nm')].map(e => e.textContent).join('|')); await pg.selectOption(sel, 'name'); await pg.waitForTimeout(400); const order1 = await pg.evaluate(() => [...document.querySelectorAll('.vgrid tbody tr:not(.grp) .nm')].map(e => e.textContent).join('|')); res = order0 !== order1 ? 'works' : 'dead'; note = 'A→Z reorders rows'; }
        else if (ex === 'select') { await pg.selectOption(sel, { index: 1 }); }
        else if (ex === 'download') { const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 3000 }).catch(() => null), el.click()]); res = dl ? 'works' : 'dead'; note = dl ? 'download ' + dl.suggestedFilename() : 'no download'; }
        else if (ex === 'picker') { const [fc] = await Promise.all([pg.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null), el.click()]); res = fc ? 'works' : 'dead'; note = fc ? 'file chooser opened' : ''; }
        else { await el.scrollIntoViewIfNeeded(); await el.click({ timeout: 4000 }); }
        if (!res) {
          await pg.waitForTimeout(700);
          if (popup) { res = 'works'; note = 'opens ' + popup.url().slice(0, 60); }
          else {
            let after; try { after = await snap(); } catch (e) { after = { url: pg.url(), y: 0, html: '' }; }
            const navigated = after.url !== before.url && after.url.split('#')[0] !== before.url.split('#')[0];
            const hashed = after.url !== before.url && !navigated;
            const domChanged = after.html !== before.html, scrolled = Math.abs(after.y - before.y) > 30;
            if (ex === 'nav') { res = navigated ? 'works' : (domChanged || hashed ? 'works' : 'dead'); note = navigated ? '→ ' + after.url.replace(BASE, '') : (hashed ? 'hash ' + after.url.replace(BASE, '') : ''); }
            else if (ex === 'screen') { const vis = await pg.evaluate(() => { const t = document.querySelector('[data-screen-body]:not([hidden])'); return (t ? t.getAttribute('data-screen-body') : '') + ' · rows ' + (t ? t.querySelectorAll('tr').length : 0) + ' · header ' + document.querySelector('[data-home="screen-name"]').textContent + ' · flash ' + !!document.querySelector('.scr-head.flash') + ' · rail-on ' + (document.querySelector('#rail a.rl.sc.on') || {}).textContent; }); res = (hashed || domChanged) && scrolled ? 'works' : 'dead'; note = vis + ' · scrolled ' + scrolled; }
            else if (ex === 'scroll') { res = scrolled || hashed || navigated ? 'works' : 'dead'; note = 'scrollY ' + before.y + '→' + after.y; }
            else { res = domChanged || navigated || hashed ? 'works' : 'dead'; note = navigated ? '→ ' + after.url.replace(BASE, '') : ''; }
          }
        }
      } catch (e) { res = 'error'; note = String(e.message).split('\n')[0].slice(0, 80); }
      const real = errs.filter(x => !/404 \(File not found\)/.test(x)); if (real.length) note += ' · JS errors: ' + real.join(' | ').slice(0, 100);
      results.push([page, label, res, note]); await ctx.close();
    }
  }
  results.forEach(r => console.log((r[2] === 'works' ? '  ok   ' : r[2] === 'n/a' ? '  n/a  ' : '  ***  ') + r[0].padEnd(20) + r[1].padEnd(46) + r[3]));
  console.log('\n' + results.filter(r => r[2] === 'works').length + ' works · ' + results.filter(r => r[2] === 'dead' || r[2] === 'error').length + ' dead/error · ' + results.filter(r => r[2] === 'n/a').length + ' n/a' + (NOFEED ? '  (NO FEED)' : ''));
  await b.close(); srv.kill();
})();
