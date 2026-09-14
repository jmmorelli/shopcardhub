#!/usr/bin/env node
/* sweep.mjs — production audit sweep for shopcardhub (CHARTER §4), beacon-safe.
 *
 * Runs headless Chromium against https://www.shopcardhub.com with EVERY request fulfilled
 * through a Playwright request context (proxy = HTTPS_PROXY, NODE_EXTRA_CA_CERTS required
 * in the cloud container) and every analytics beacon ABORTED before anything else:
 *   googletagmanager.com · google-analytics.com · *.analytics.google.com · stats.g.doubleclick.net
 * No GA hit ever leaves a sweep. Verify with the GA4 realtime card after every run (§4).
 *
 * Modes:
 *   node tools/site-auditor/sweep.mjs --deep p1,p2,…    full §4 metrics, 1440×900 + iPhone 13
 *   node tools/site-auditor/sweep.mjs --all             every repo page (minus card-dungeon), phone-only light metrics
 *   [--out report.json] [--base https://www.shopcardhub.com] [--wait 1200]
 *
 * Per page (deep): height/screens + first data row Y (phone), scrollWidth vs viewport,
 * photo spans vs .is-photo, running infinite animations, reduced-motion rule, text<11px
 * (minus the .sch-cimg-thumb carve-out), nav/CTA taps <40px, console/page errors (aborted-
 * beacon noise counted separately), CLS, bytes by type, canonical/og:image/JSON-LD,
 * fonts self-hosted, gtag deferred. Light mode: viewport, overflow, errors, photos, floors.
 */
"use strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); }
catch { playwright = require(path.join(process.env.PLAYWRIGHT_ROOT || "/home/claude/.npm-global/lib/node_modules", "playwright")); }

const argv = process.argv.slice(2);
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const BASE = argOf("--base", "https://www.shopcardhub.com");
const WAIT = parseInt(argOf("--wait", "1200"), 10);
const OUT = argOf("--out", "");
const DEEP = argOf("--deep", "");
const ALL = argv.includes("--all");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

const BLOCK = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net/;

function pageList() {
  if (DEEP) return DEEP.split(",").map(s => s.trim()).filter(Boolean);
  if (ALL) return fs.readdirSync(REPO).filter(f => f.endsWith(".html") && f !== "card-dungeon.html").map(f => f.replace(/\.html$/, "")).sort();
  return ["index"];
}
const slugToPath = s => (s === "index" || s === "/") ? "/" : "/" + s.replace(/^\//, "");

const INIT = `(() => {
  window.__cls = 0; window.__anim = 0;
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } catch {}
})()`;

async function metrics(page, deep) {
  return await page.evaluate((deep) => {
    const r = {};
    r.scrollWidth = document.documentElement.scrollWidth;
    r.innerWidth = window.innerWidth;
    r.height = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    r.screens = +(r.height / window.innerHeight).toFixed(1);
    r.cls = +(window.__cls || 0).toFixed(3);
    const spans = document.querySelectorAll("[data-card-img]");
    r.photoSpans = spans.length;
    r.photoLoaded = document.querySelectorAll("[data-card-img].is-photo, [data-card-img] .is-photo, .is-photo[data-card-img]").length;
    if (!r.photoLoaded) r.photoLoaded = [...spans].filter(s => s.querySelector("img") && s.querySelector("img").naturalWidth > 1).length;
    r.canonical = !!document.querySelector('link[rel="canonical"]');
    r.canonicalHref = (document.querySelector('link[rel="canonical"]') || {}).href || "";
    r.ogImage = !!document.querySelector('meta[property="og:image"]');
    r.jsonLd = !!document.querySelector('script[type="application/ld+json"]');
    r.googleFonts = !!document.querySelector('link[href*="fonts.googleapis"], link[href*="fonts.gstatic"]');
    r.syncGtag = [...document.querySelectorAll("script[src*='googletagmanager']")].some(s => !s.async && !s.defer);
    if (!deep) return r;
    // running infinite animations
    let inf = 0;
    try { for (const a of document.getAnimations()) { const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : {}; if (t.iterations === Infinity && a.playState === "running") inf++; } } catch {}
    r.infiniteAnimations = inf;
    r.reducedMotion = [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(rule => (rule.conditionText || rule.cssText || "").includes("prefers-reduced-motion")); } catch { return false; } });
    // text floor (carve-out: .sch-cimg-thumb badge 9px by design)
    let small = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const el = walker.currentNode;
      if (el.closest(".sch-cimg-thumb")) continue;
      if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      if (parseFloat(cs.fontSize) < 11) small++;
    }
    r.smallText = small;
    // tap floor in nav/CTAs
    let smallTaps = 0;
    for (const el of document.querySelectorAll("nav a, nav button, header a, header button, .sch-nav a, .sch-nav button, [class*='cta'] a, a[class*='cta'], button[class*='cta']")) {
      const b = el.getBoundingClientRect();
      if (b.width > 0 && b.height > 0 && b.height < 40) smallTaps++;
    }
    r.smallTaps = smallTaps;
    // first data row Y
    const row = document.querySelector(".panel table tbody tr, .panel li, .panel .mrow, .sch-markets tbody tr, table tbody tr, .sch-row, .board-row");
    r.firstDataRowY = row ? Math.round(row.getBoundingClientRect().top + window.scrollY) : null;
    return r;
  }, deep);
}

(async () => {
  const pages = pageList();
  const deep = !!DEEP;
  const browser = await playwright.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const req = await playwright.request.newContext({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined, ignoreHTTPSErrors: true });
  const results = [];
  const viewports = deep
    ? [{ name: "desktop", viewport: { width: 1440, height: 900 }, ua: null }, { name: "phone", viewport: { width: 390, height: 844 }, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1", scale: 3, mobile: true }]
    : [{ name: "phone", viewport: { width: 390, height: 844 }, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1", scale: 3, mobile: true }];

  for (const slug of pages) {
    const entry = { page: slugToPath(slug) };
    for (const vp of viewports) {
      const ctx = await browser.newContext({ viewport: vp.viewport, userAgent: vp.ua || undefined, deviceScaleFactor: vp.scale || 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
      const bytes = { html: 0, js: 0, css: 0, img: 0, font: 0, other: 0, total: 0 };
      let abortedBeacons = 0;
      await ctx.route("**/*", async route => {
        const url = route.request().url();
        if (BLOCK.test(url)) { abortedBeacons++; return route.abort(); }
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const resp = await req.get(url, { timeout: 25000, failOnStatusCode: false });
            const headers = { ...resp.headers() };
            delete headers["content-encoding"]; delete headers["content-length"];
            const body = await resp.body();
            const ct = (headers["content-type"] || "");
            const kind = ct.includes("html") ? "html" : ct.includes("javascript") ? "js" : ct.includes("css") ? "css" : ct.startsWith("image") || ct.includes("svg") ? "img" : ct.includes("font") ? "font" : "other";
            bytes[kind] += body.length; bytes.total += body.length;
            return route.fulfill({ status: resp.status(), headers, body });
          } catch (e) { if (attempt === 2) return route.abort(); }
        }
      });
      const page = await ctx.newPage();
      await page.addInitScript(INIT);
      const errors = []; let beaconNoise = 0;
      page.on("console", m => { if (m.type() === "error") { if (/ERR_FAILED|googletagmanager|google-analytics/.test(m.text())) beaconNoise++; else errors.push(m.text().slice(0, 200)); } });
      page.on("pageerror", e => errors.push(String(e).slice(0, 200)));
      let status = 0;
      try {
        const resp = await page.goto(BASE + slugToPath(slug), { waitUntil: "networkidle", timeout: 60000 });
        status = resp ? resp.status() : 0;
      } catch (e) { entry[vp.name + "_navError"] = String(e).slice(0, 150); }
      await page.waitForTimeout(WAIT);
      let m = {};
      try { m = await metrics(page, deep); } catch (e) { entry[vp.name + "_metricsError"] = String(e).slice(0, 120); }
      entry[vp.name] = { status, ...m, consoleErrors: errors, abortedBeacons, beaconNoise, bytes: deep ? bytes : undefined };
      await ctx.close();
    }
    results.push(entry);
    process.stderr.write(`${entry.page} ok\n`);
  }
  await browser.close();
  await req.dispose();
  const out = JSON.stringify(results, null, 1);
  if (OUT) fs.writeFileSync(OUT, out); else console.log(out);
})();
