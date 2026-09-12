#!/usr/bin/env node
/* interactions.cjs — the scripted click-through suite (Terminal hotfix, Sep 12 2026).
 *
 * Why: Mo found a dead control in production (the rail's saved-screen links on / did nothing visible) and the
 * gate passed it — audit-terminal checks that links EXIST, not that clicking them DOES something. This suite
 * clicks every control the terminal promises and asserts a VISIBLE change within 1.5 s: a DOM mutation inside
 * the target panel, a class/state toggle, a navigation, a hash + scroll, or a modal/chooser/picker opening.
 * No visible change → FAIL dead-control with page + selector + text.
 *
 * Runs on the beacon-safe local harness (tools/qa/harness.cjs: repo served on localhost, feed from --feed,
 * /api/* from tools/qa/fixtures, analytics ABORTED) or, with --prod <origin>, against production with the same
 * scenarios and the same beacon abort list (see tools/qa/README.md — a prod run must be followed by a GA4
 * realtime check, CHARTER §4).
 *
 * Usage: node tools/qa/interactions.cjs [--pages index,watchlist,…] [--feed <dir>] [--repo <dir>] [--json]
 *                                        [--prod https://www.shopcardhub.com] [--port 4174] [--headed]
 * Output: audit-site format — [FAIL] code · page — detail; summary "N pages · M scenarios · FAIL: x · WARN: y".
 * Exit 1 on any FAIL. Codes: dead-control, console-error, dead-link, scenario-error (FAIL);
 *                            inert-control, scenario-skipped (WARN). */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const H = require("./harness.cjs");

const argv = process.argv.slice(2);
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const JSON_OUT = argv.includes("--json");
const HEADED = argv.includes("--headed");
const REPO = path.resolve(argOf("--repo", path.resolve(__dirname, "../..")));
const FEED = path.resolve(argOf("--feed", path.join(REPO, "../pd/data")));
const PROD = argOf("--prod", null);
const PORT = parseInt(argOf("--port", "4174"), 10);
const ONLY = argOf("--only", null); // run only scenarios whose name contains this (debugging)
const DEBUG = !!process.env.QA_DEBUG;
const SETTLE = 1500; // the visible-change budget, per the hotfix brief
const ALL_PAGES = ["index", "watchlist", "indices", "auctions", "bowman-bangers"];
const PAGES = (argOf("--pages", ALL_PAGES.join(",")).split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s === "/" ? "index" : s.replace(/^\//, "").replace(/\.html$/, ""))));

const findings = []; // {level, code, page, detail}
const add = (level, code, page, detail) => findings.push({ level, code, page, detail });
let scenarioCount = 0;

/* A v1 Vault store (no lists[], no listId) so the pages migrate it and the portfolio controls have something to show. */
const V1_STORE = { demo: false, cards: [
  { id: "c1", status: "own", cat: "baseball", name: "Ethan Holliday 1st Bowman Chrome Auto", set: "2026 Bowman", grade: "Raw", cost: 172, qty: 2, buyDate: "2026-08-20", feedKey: "ebay:ethan-holliday", prices: [180, 176, 175, 170, 168, 165].map((p, i) => ({ t: Date.now() - (5 - i) * 864e5, p, src: "feed" })) },
  { id: "c2", status: "own", cat: "baseball", name: "Andrew Fischer 1st Bowman Chrome Auto", set: "2026 Bowman", grade: "Raw", cost: 140, qty: 1, buyDate: "2026-08-22", feedKey: "ebay:andrew-fischer", prices: [150, 155, 160, 187].map((p, i) => ({ t: Date.now() - (3 - i) * 864e5, p, src: "feed" })) },
  { id: "c3", status: "own", cat: "pokemon", name: "Umbreon ex SIR #161", set: "Prismatic Evolutions", grade: "Raw", cost: 1350, qty: 1, buyDate: "2026-07-02", feedKey: "ebay:umbreon-ex-sir-pe", prices: [{ t: Date.now(), p: 1358, src: "feed" }] },
  { id: "w1", status: "watch", cat: "baseball", name: "Konnor Griffin 2026 Bowman Sapphire", set: "2026 Bowman Sapphire", grade: "Raw", target: 18, feedKey: "ebay:konnor-griffin-sapphire", prices: [{ t: Date.now(), p: 16.99, src: "feed" }] },
] };

/* ---------- scenarios ----------
 * { name, sel, expect, panel?, all?, pre?, optional?, hash? }
 *   expect: nav | dom | screen | scroll | class | picker | any | nav-or-scroll | popup
 *   panel : the element whose innerHTML must change for `dom`/`screen` (default: whole body state)
 *   all   : run the scenario once per matching element (the "every …" scenarios)
 *   pre   : async (page) => {} run after load, before the click (open a menu, switch a tab)
 *   optional: selector may be absent (WARN scenario-skipped instead of FAIL dead-control) */
const ownTab = async (page) => { const t = await page.$("#tabOwn"); if (t) { await t.click(); await page.waitForTimeout(250); } };
const openPfMenu = async (page) => { await ownTab(page); await page.click(".pf-name", { timeout: 3000 }); await page.waitForTimeout(150); };
/* COMMON runs on every page the suite visits (added Sep 12 2026: build-nav.js emitted the
 * nav logo as a plain <div> — dead on all 94 pages until the brand anchor fix). */
const COMMON = [
  { name: "nav logo → home", sel: "nav.nav a.logo", expect: "nav" },
];

const SCENARIOS = {
  index: [
    { name: "rail nav row", sel: '#rail nav a.rl[href^="/"]:not([href^="/#"])', all: true, expect: "nav" },
    { name: "rail Tuesday Tape (#tape)", sel: '#rail a.rl[href="/#tape"]', expect: "scroll" },
    { name: "rail guides group open", sel: "#rail details.rl-grp > summary", all: true, expect: "dom", panel: "#rail" },
    { name: "rail guides group close", sel: "#rail details.rl-grp > summary", all: true, expect: "dom", panel: "#rail", pre: async (page, sel) => { await page.click(sel); await page.waitForTimeout(150); } },
    { name: "rail guides link (opened group)", sel: "#rail details.rl-grp a.rl.sub", all: true, expect: "nav", pre: async (page) => { await page.evaluate(() => document.querySelectorAll("#rail details.rl-grp").forEach((d) => (d.open = true))); } },
    { name: "rail Guides all →", sel: "#rail .rl-guides h4 a", expect: "nav" },
    { name: "rail portfolio row", sel: '#rail [data-rail="portfolios"] a', all: true, expect: "nav" },
    { name: "rail Portfolios Vault →", sel: '#rail h4 a[href^="/watchlist"]', expect: "nav" },
    { name: "rail saved screen", sel: "#rail a[data-screen]", all: true, expect: "screen", panel: "#screens" },
    { name: "screens chip", sel: ".scr-chips a[data-screen]", all: true, expect: "screen", panel: "#screens" },
    { name: "markets row (chart swaps)", sel: "a.mrow[data-k]:not(.pre-row):not(.on)", all: true, expect: "dom", panel: '[data-home="chart"]' },
    { name: "markets PRE row (n-a, must link)", sel: "a.mrow.pre-row", all: true, expect: "nav", optional: true },
    { name: "chart caption link", sel: ".chart-cap a", expect: "nav", optional: true },
    { name: "All signals »", sel: 'a:text-is("All signals »")', expect: "nav" },
    { name: "Full board »", sel: 'a:text-is("Full board »")', expect: "nav" },
    { name: "Auction Desk »", sel: 'a:text-is("Auction Desk »")', expect: "nav" },
    { name: "In Focus item", sel: '[data-home="focus"] a', all: true, expect: "nav-or-scroll" },
    { name: "engine list card link", sel: '[data-home="engine"] li a', expect: "nav", optional: true },
    { name: "movers card link", sel: '[data-home="movers"] li a', expect: "nav", optional: true },
    { name: "screens row link", sel: "[data-screen-body]:not([hidden]) td.sym a, #screens td.sym a", expect: "nav", optional: true },
    { name: "deep link #screen=fat on load", sel: "#screens", expect: "screen-on-load", hash: "#screen=fat", panel: "#screens" },
  ],
  watchlist: [
    { name: "rail nav row", sel: '#rail nav a.rl[href^="/"]:not([href^="/#"])', all: true, expect: "nav" },
    { name: "rail saved screen (→ /#screen=)", sel: "#rail a[data-screen]", expect: "nav" },
    { name: "rail portfolio row", sel: '#rail [data-rail="portfolios"] a', all: true, expect: "any" },
    { name: "tab My cards", sel: "#tabOwn", expect: "dom", pre: async (page) => { await page.click("#tabWatch"); await page.waitForTimeout(200); } },
    { name: "tab Hunting", sel: "#tabWatch", expect: "dom", pre: ownTab },
    { name: "portfolio ▾ opens menu", sel: ".pf-name", expect: "dom", pre: ownTab },
    { name: "portfolio switch (menu row)", sel: '#pfMenu a[href^="#pf="]:not(.on)', expect: "dom", pre: openPfMenu },
    { name: "+ New portfolio (prompt stubbed)", sel: '#pfMenu button:text-matches("New", "i")', expect: "dom", pre: openPfMenu },
    { name: "Rename portfolio (prompt stubbed)", sel: '#pfMenu button:text-matches("Rename", "i")', expect: "dom", pre: async (page) => { await openPfMenu(page); await page.click('#pfMenu button:text-matches("New", "i")'); await page.waitForTimeout(300); await openPfMenu(page); } },
    { name: "Delete portfolio (confirm stubbed)", sel: '#pfMenu button:text-matches("Delete", "i")', expect: "dom", pre: async (page) => { await openPfMenu(page); await page.click('#pfMenu button:text-matches("New", "i")'); await page.waitForTimeout(300); await openPfMenu(page); } },
    { name: "view Cards", sel: "#viewCards", expect: "dom", pre: ownTab },
    { name: "view Table", sel: "#viewTable", expect: "dom", pre: async (page) => { await ownTab(page); await page.click("#viewCards"); await page.waitForTimeout(200); } },
    { name: "Columns ▾", sel: "#colWrap .btn, #colWrap button", expect: "dom", pre: ownTab },
    { name: "sort select", sel: "#sortSel", expect: "select", panel: ".vgrid, #list, main", pre: ownTab },
    { name: "group select", sel: "#groupSel", expect: "select", panel: ".vgrid, #list, main", pre: ownTab },
    { name: "+ Add Card opens", sel: "#addBtn", expect: "dom" },
    { name: "Add Card closes", sel: '.modal:visible button:text-matches("cancel|close|×", "i"), .modal:visible .close, .modal:visible [aria-label="Close"]', expect: "dom", pre: async (page) => { await page.click("#addBtn"); await page.waitForTimeout(250); } },
    { name: "Paste a List", sel: 'button:text-matches("Paste a List", "i")', expect: "dom", pre: async (page) => { const b = await page.$('button:text-matches("Paste a List", "i")'); if (b && !(await b.isVisible())) { const s = await page.$("#addBtn"); if (s) await s.click(); await page.waitForTimeout(200); } } },
    { name: "Share (image modal)", sel: 'button:text-matches("^.{0,3}Share$", "i"):visible', expect: "dom" },
    { name: "Import (file picker)", sel: 'button:text-matches("Import", "i"):visible', expect: "picker" },
    { name: "★ Track opens chooser", sel: ".sch-track-card", expect: "dom", optional: true },
    { name: "table row → card popup", sel: ".vgrid tbody tr:not(.grp)", expect: "dom", optional: true, pre: ownTab },
    { name: "How the Vault works", sel: "#vaultHow > summary", expect: "dom", optional: true },
    { name: "deep link #pf=<id> on load", sel: ".pf-name", expect: "pf-on-load", hash: "#pf=default" },
  ],
  indices: [
    { name: "rail nav row", sel: '#rail nav a.rl[href^="/"]:not([href^="/#"])', all: true, expect: "nav" },
    { name: "index row", sel: "#sections tr.idx, #sections a[href*='-index']", all: true, expect: "nav" },
    { name: "★ Track opens chooser", sel: ".sch-track-card", expect: "dom", optional: true },
  ],
  auctions: [
    { name: "rail nav row", sel: '#rail nav a.rl[href^="/"]:not([href^="/#"])', all: true, expect: "nav" },
    { name: "filter chip", sel: ".au-chip:not([aria-pressed='true'])", all: true, expect: "dom", panel: "#au-list, #au-note, #au-strip" },
    { name: "filter chip All (back)", sel: ".au-chip[data-f='all']", expect: "dom", panel: "#au-list, #au-note, #au-strip", pre: async (page) => { await page.click(".au-chip[data-f='under']"); await page.waitForTimeout(200); } },
    { name: "card select", sel: "#au-card", expect: "select", panel: "#au-list, #au-note, #au-strip" },
  ],
  "bowman-bangers": [
    { name: "rail nav row", sel: '#rail nav a.rl[href^="/"]:not([href^="/#"])', all: true, expect: "nav" },
    { name: "board tab", sel: ".tabs a, .tabs button, [role=tablist] [role=tab]", all: true, expect: "dom", optional: true },
    { name: "Signal Board filter", sel: "button.seg:not(.active)", all: true, expect: "dom" },
    { name: "Signal Board filter All (back)", sel: "button.seg[data-sig='ALL']", expect: "dom", pre: async (page) => { await page.click("button.seg[data-sig='BUY']"); await page.waitForTimeout(200); } },
    { name: "★ Track opens chooser", sel: ".sch-track-card", expect: "dom" },
  ],
};

/* ---------- observation ---------- */
const SNAP = (sel) => {
  const q = (s) => { try { if (!s) return null; const all = [...document.querySelectorAll(s)]; return all.length ? { getBoundingClientRect: () => all[0].getBoundingClientRect(), innerHTML: all.map((e) => e.innerHTML).join("\u0000") } : null; } catch { return null; } };
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0; };
  const panel = q(sel);
  const modals = [...document.querySelectorAll('.modal, [role=dialog], .sheet, .sch-chooser, .sch-vt-chooser, [class*="chooser"], [class*="overlay"], .pf-menu, .cols-menu, .popup')].filter(vis).map((e) => e.className || e.id).join("|");
  const state = [...document.querySelectorAll('[hidden],[open],.on,.active,.show,.open,.flash,.is-open,[aria-pressed],[aria-expanded]')].map((e) => (e.id || e.className || e.tagName) + ":" + (e.hidden ? "h" : "") + (e.open ? "o" : "") + (e.getAttribute("aria-pressed") || "") + (e.getAttribute("aria-expanded") || "")).join(",");
  const inView = panel ? (() => { const r = panel.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })() : null;
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  return { url: location.href, y: scrollY, panel: panel ? panel.innerHTML.length + ":" + hash(panel.innerHTML) : null, inView, modals, state, bodyLen: document.body.innerHTML.length, bodyHash: hash(document.body.innerHTML) };
};
const snap = async (page, sel) => { const s = await page.evaluate(SNAP, sel || null); if (!s) throw new Error("snapshot failed"); return s; };

function changed(before, after, expect) {
  const pathOf = (u) => u.split("#")[0];
  const navigated = pathOf(after.url) !== pathOf(before.url);
  const hashed = !navigated && after.url !== before.url;
  const scrolled = Math.abs(after.y - before.y) > 30;
  const panelChanged = before.panel != null && after.panel !== before.panel;
  const stateChanged = after.state !== before.state || after.modals !== before.modals;
  const domChanged = panelChanged || stateChanged || (before.panel == null && after.bodyHash !== before.bodyHash);
  switch (expect) {
    case "nav": return navigated ? "navigated → " + after.url : null;
    case "scroll": return scrolled ? `scrolled ${before.y}→${after.y}` : (hashed && after.inView !== false ? "hash " + after.url.split("#")[1] : null);
    case "nav-or-scroll": return navigated ? "navigated → " + after.url : scrolled ? `scrolled ${before.y}→${after.y}` : null;
    case "dom": case "select": return domChanged ? (panelChanged ? "panel changed" : "state changed") : (navigated ? "navigated → " + after.url : null);
    case "screen": return panelChanged && after.inView ? "screen rows changed + panel in viewport" : null;
    case "any": return navigated ? "navigated" : domChanged ? "dom changed" : scrolled ? "scrolled" : hashed ? "hash" : null;
    default: return null;
  }
}

/* ---------- generic per-page checks ---------- */
async function genericChecks(page, slug, origin, redirects, ctxRequest) {
  // dead-link: every internal <a href> must resolve (file/redirect locally; HEAD < 400 in prod)
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")).filter((h) => h && h.startsWith("/") && !h.startsWith("//")));
  const seen = new Set();
  for (const h of hrefs) {
    const p = h.split("#")[0].split("?")[0] || "/";
    if (seen.has(p)) continue; seen.add(p);
    if (/^\/(api|js|css|fonts|data)\//.test(p)) continue;
    if (PROD) {
      try { const r = await ctxRequest.head(PROD + p, { maxRedirects: 3 }); if (r.status() >= 400) add("FAIL", "dead-link", slug, `href ${p} → HTTP ${r.status()}`); }
      catch (e) { add("FAIL", "dead-link", slug, `href ${p} → ${String(e.message).split("\n")[0].slice(0, 80)}`); }
    } else if (!H.resolvePath(REPO, p, redirects)) add("FAIL", "dead-link", slug, `href ${p} has no file, cleanUrl or vercel.json redirect`);
  }
  // inert-control: a button/[role=button]/summary with no onclick, no form, no own/ancestor/delegated click listener
  try {
    const cdp = await page.context().newCDPSession(page);
    const { result } = await cdp.send("Runtime.evaluate", { expression: "[...document.querySelectorAll('button,[role=button],summary')]", returnByValue: false });
    const { result: props } = await cdp.send("Runtime.getProperties", { objectId: result.objectId, ownProperties: true });
    const delegated = await (async () => { for (const expr of ["document", "document.body", "window"]) { const { result: r } = await cdp.send("Runtime.evaluate", { expression: expr }); const { listeners } = await cdp.send("DOMDebugger.getEventListeners", { objectId: r.objectId }); if (listeners.some((l) => /click|pointer|mouse|touch/.test(l.type))) return true; } return false; })();
    for (const p of props) {
      if (!/^\d+$/.test(p.name) || !p.value || !p.value.objectId) continue;
      const { listeners } = await cdp.send("DOMDebugger.getEventListeners", { objectId: p.value.objectId, depth: -1 });
      if (listeners.some((l) => /click|pointer|mouse|touch|toggle/.test(l.type))) continue;
      const info = await cdp.send("Runtime.callFunctionOn", { objectId: p.value.objectId, returnByValue: true, functionDeclaration: `function(){ const e=this; const cs=getComputedStyle(e); const r=e.getBoundingClientRect();
        const vis = cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0;
        const hooked = e.hasAttribute('onclick') || e.tagName==='SUMMARY' || (e.tagName==='BUTTON' && (e.type==='submit'||e.type==='reset') && e.closest('form')) || !!e.closest('[onclick]') || !!e.closest('a[href]') || e.hasAttribute('data-screen') || e.hasAttribute('data-f') || e.hasAttribute('data-sig') || e.classList.contains('sch-track-card') || e.id==='hamburger' || e.classList.contains('m-group-btn');
        return { vis, hooked, text:(e.textContent||'').trim().slice(0,40), sel:(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).join('.'):'')).slice(0,80) }; }` });
      const v = info.result.value;
      if (!v || !v.vis || v.hooked) continue;
      if (delegated) continue; // a document-level click handler may own it — cannot prove inert
      add("WARN", "inert-control", slug, `${v.sel} "${v.text}" has no onclick, form, href or click listener`);
    }
    await cdp.detach();
  } catch (e) { add("WARN", "inert-control", slug, "listener inspection unavailable: " + String(e.message).slice(0, 80)); }
}

/* ---------- runner ---------- */
(async () => {
  const playwright = H.loadPlaywright();
  const srv = PROD ? null : await H.startServer({ repo: REPO, port: PORT });
  const origin = PROD ? PROD.replace(/\/$/, "") : srv.origin;
  const redirects = PROD ? [] : srv.redirects;
  const browser = await playwright.chromium.launch({ headless: !HEADED });
  const pagesRun = [];
  for (const slug of PAGES) {
    const scenarios = SCENARIOS[slug];
    if (!scenarios) { add("WARN", "scenario-skipped", slug, "no scenarios defined for this page; generic checks only"); }
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US" });
    const log = await H.routeContext(ctx, { mode: PROD ? "prod" : "local", origin, feed: FEED });
    await ctx.addInitScript((store) => {
      try { localStorage.setItem("sch_vault_v1", JSON.stringify(store)); } catch {}
      window.prompt = () => "QA box"; window.confirm = () => true; window.alert = () => {};
      window.open = (u) => { window.__qaPopup = String(u); return null; };
    }, V1_STORE);
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error" && !H.isHarnessNoise(m, origin)) errors.push(m.text().slice(0, 200)); });
    page.on("pageerror", (e) => errors.push("pageerror: " + String(e.message || e).slice(0, 200)));
    const base = `${origin}/${slug === "index" ? "" : slug}`;
    const load = async (hash) => { await page.goto(base + (hash || ""), { waitUntil: "networkidle", timeout: 30000 }).catch(() => page.goto(base + (hash || ""), { waitUntil: "load", timeout: 30000 })); await page.waitForTimeout(600); };
    await load();
    pagesRun.push(slug);
    for (const sc of COMMON.concat(scenarios || [])) {
      if (ONLY && !sc.name.includes(ONLY)) continue;
      let targets = [null];
      if (sc.all) { const n = await page.locator(sc.sel).count(); targets = Array.from({ length: n }, (_, i) => i); if (!n) targets = [null]; }
      for (const i of targets) {
        scenarioCount++;
        const label = sc.name + (i != null ? ` #${i + 1}` : "");
        try {
          await load(sc.hash);
          const loc = i == null ? page.locator(sc.sel).first() : page.locator(sc.sel).nth(i);
          if (sc.expect === "screen-on-load") {
            const s = await snap(page, sc.panel);
            const on = await page.$eval("[data-screen]", () => [...document.querySelectorAll("[data-screen].on")].map((e) => e.getAttribute("data-screen")).join(",")).catch(() => "");
            const want = (sc.hash.match(/screen=([a-z0-9]+)/) || [])[1];
            if (!on.split(",").includes(want) || !s.inView) add("FAIL", "dead-control", slug, `deep link ${sc.hash}: on load the "${want}" screen is ${on.split(",").includes(want) ? "active" : "NOT active (" + (on || "none") + ")"} and the Screens panel is ${s.inView ? "" : "NOT "}in the viewport`);
            continue;
          }
          if (sc.expect === "pf-on-load") {
            const name = await page.locator(".pf-name").first().textContent().catch(() => "");
            const on = await page.$eval("#tabOwn", (e) => e.className).catch(() => "");
            if (!/on|active/.test(on) && !/My cards|All portfolios/i.test(name || "")) add("FAIL", "dead-control", slug, `deep link ${sc.hash}: portfolio view did not open (tab class "${on}", header "${(name || "").trim().slice(0, 40)}")`);
            continue;
          }
          if (sc.pre) { const selN = i == null ? sc.sel : `${sc.sel} >> nth=${i}`; await sc.pre(page, selN); }
          const count = await loc.count();
          if (!count) { const soft = sc.optional || (sc.all && i > 0); add(soft ? "WARN" : "FAIL", soft ? "scenario-skipped" : "dead-control", slug, `${label}: no element matches ${sc.sel}`); continue; }
          const text = ((await loc.textContent().catch(() => "")) || "").replace(/\s+/g, " ").trim().slice(0, 60);
          const href = await loc.getAttribute("href").catch(() => null);
          const desc = `${sc.sel}${i != null ? ` [${i}]` : ""} "${text}"${href ? ` (${href})` : ""}`;
          if ((sc.expect === "nav" || sc.expect === "nav-or-scroll") && href && href.split("#")[0] === new URL(page.url()).pathname) { continue; } // self link: a reload, not a control
          await loc.scrollIntoViewIfNeeded().catch(() => {});
          await page.waitForTimeout(80);
          const before = await snap(page, sc.panel);
          let ok = null;
          if (sc.expect === "picker") {
            const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: SETTLE }).catch(() => null), loc.click({ timeout: 3000 })]);
            ok = fc ? "file chooser opened" : null;
          } else if (sc.expect === "select") {
            const opts = await loc.evaluate((s) => [...s.options].map((o) => o.value));
            const cur = await loc.evaluate((s) => s.value);
            const others = opts.filter((v) => v !== cur);
            if (!others.length) { add("WARN", "scenario-skipped", slug, `${label}: select has a single option`); continue; }
            // any other option must produce a visible change (two options may legitimately sort identically)
            for (const next of others) {
              await loc.selectOption(next);
              const t0 = Date.now(); while (!ok && Date.now() - t0 < SETTLE) { await page.waitForTimeout(100); ok = changed(before, await snap(page, sc.panel), "dom"); }
              if (ok) { ok += ` (option ${next})`; break; }
            }
          } else {
            const isNavExpect = sc.expect === "nav" || sc.expect === "nav-or-scroll";
            const navP = isNavExpect ? page.waitForNavigation({ timeout: SETTLE, waitUntil: "commit" }).catch(() => null) : null;
            await loc.click({ timeout: 3000, noWaitAfter: true });
            if (navP) await navP;
            const t0 = Date.now();
            while (!ok && Date.now() - t0 < SETTLE) {
              await page.waitForTimeout(100);
              let after = null;
              try { after = await snap(page, sc.panel); } catch (e) { if (/Execution context was destroyed|navigation/i.test(String(e.message))) { ok = "navigated (context replaced)"; break; } throw e; }
              ok = changed(before, after, sc.expect);
              if (!ok && await page.evaluate(() => window.__qaPopup || null).catch(() => null)) ok = "opened popup";
            }
          }
          if (DEBUG) console.error(`  ${ok ? "ok  " : "DEAD"} ${slug} · ${label} · ${ok || ""}`);
          if (!ok) add("FAIL", "dead-control", slug, `${label}: ${desc} — no visible change within ${SETTLE} ms (expected ${sc.expect})`);
        } catch (e) { add("FAIL", "scenario-error", slug, `${label}: ${String(e.message || e).split("\n")[0].slice(0, 160)}`); }
      }
    }
    await load();
    await genericChecks(page, slug, origin, redirects, ctx.request);
    for (const e of [...new Set(errors)]) add("FAIL", "console-error", slug, e);
    for (const h of new Set(log.aborted)) if (!/google|doubleclick|fonts\./.test(h) && !PROD) add("WARN", "offbox-request", slug, `page requested ${h} (aborted by the harness — a new dependency?)`);
    await ctx.close();
  }
  await browser.close();
  if (srv) srv.close();
  const fails = findings.filter((x) => x.level === "FAIL"), warns = findings.filter((x) => x.level === "WARN");
  if (JSON_OUT) console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), mode: PROD ? "prod" : "local", origin, pages: pagesRun, scenarios: scenarioCount, fails, warns }, null, 1));
  else {
    console.log(`Interaction suite — ${new Date().toISOString().slice(0, 10)} (${PROD ? "PROD " + origin : "local harness, feed " + (fs.existsSync(path.join(FEED, "prices-latest.json")) ? FEED : "unavailable")})`);
    console.log(`${pagesRun.length} pages · ${scenarioCount} scenarios · FAIL: ${fails.length} · WARN: ${warns.length}`);
    for (const x of fails) console.log(`  [FAIL] ${x.code} · ${x.page} — ${x.detail}`);
    for (const x of warns) console.log(`  [WARN] ${x.code} · ${x.page} — ${x.detail}`);
    if (PROD) console.log("  prod run: beacons were aborted — confirm GA4 realtime shows NO hit from this run (CHARTER §4).");
  }
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
