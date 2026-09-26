#!/usr/bin/env node
// tools/ci/image-sweep.mjs — the rendered image gate (Sep 25 2026, Mo: "make sure our images look good/work on all
// pages — shouldn't an agent be doing that nightly?"). The three static gates read HTML; card photos resolve in the
// browser (js/card-img.js → /data/card-images.json → /api/comps name search → eBay), so a broken photo never tripped
// them. This one loads every sitemap page in headless Chromium against PRODUCTION (or --base <url>), scrolls it so lazy
// images load, and reports per page: <img> elements that failed (naturalWidth 0 after load), card slots still on the
// generated placeholder, page errors, horizontal overflow.
//   FAIL: any <img> that failed to load; a page error; horizontal overflow at 390px; a clipped CTA label; text the same
//         colour as its background; a bare var(--x) the page never defines; an element hanging off the phone viewport
//   WARN: card slots left on the placeholder (a photo the name search could not find); tap targets under 28px on a phone
// --shots <dir> also saves a 390px above-the-fold screenshot per page (the weekly's visual review reads those).
// Usage: node tools/ci/image-sweep.mjs [--base https://www.shopcardhub.com] [--width 1280,390] [--pages a,b] [--json out.json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt("--base", "https://www.shopcardhub.com").replace(/\/$/, "");
const WIDTHS = opt("--width", "1280,390").split(",").map(Number);
const ONLY = opt("--pages", "") ? opt("--pages", "").split(",") : null;
const OUT = opt("--json", "");
const SHOTS = opt("--shots", "");   // directory: one 390px above-the-fold screenshot per page, for the weekly's eyes
let chromium;
try { ({ chromium } = require("playwright")); } catch (e) {
  try { ({ chromium } = require(path.join(process.env.PW || "", "index.js"))); } catch (e2) {
    try { const g = require("node:child_process").execSync("npm root -g").toString().trim(); ({ chromium } = require(path.join(g, "playwright"))); } catch (e3) { console.error("playwright not found (npm i -g playwright, or set PW)"); process.exit(2); }
  }
}
const exe = process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
let pages = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1] || "/");
if (ONLY) pages = ONLY.map((p) => (p.startsWith("/") ? p : "/" + p));

const browser = await chromium.launch({ executablePath: exe });
const results = [];
let fails = 0, warns = 0;
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128 Safari/537.36 ShopCardHubImageSweep" });
  // Never send analytics from the sweep. Until 2026-09-26 every nightly run registered ~158 page views
  // (79 pages x 2 widths) in GA4 as "" country / Unassigned sessions with 10+ minute durations, which
  // inflated sessionsYesterday and skewed the bot-clean numbers the desk reads (same host list as
  // tools/qa/harness.cjs ABORT_HOSTS).
  await ctx.route(/(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net)/, (r) => r.abort());
  for (const p of pages) {
    const pg = await ctx.newPage();
    const errs = [];
    pg.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
    const t0 = Date.now();
    let status = 0;
    try {
      const isLocal = /^(https?:\/\/)?(127\.0\.0\.1|localhost)/.test(BASE);   // a plain file server needs the .html; Vercel serves clean URLs
      const r = await pg.goto(BASE + (isLocal && p !== "/" && !/\.html$/.test(p) ? p + ".html" : p), { waitUntil: "load", timeout: 60000 });
      status = r ? r.status() : 0;
      // scroll the whole page so lazy images and the photo resolver get their turn
      await pg.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await pg.waitForTimeout(2500);
      const info = await pg.evaluate(() => {
        // ---- UI checks (Sep 25 2026, Mo: "which agent is cruising the site for UI/UX errors?" — none was; these are the
        // mechanical faults a person notices first, checked on every page nightly) ----
        const ui = [];
        const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
        // 1. clipped text in a button/CTA (content wider than the box — "LISTIN…", "B…")
        for (const el of document.querySelectorAll("a.ebay, a.auc, .go-btn, .btn-primary, .btn-secondary, button, .bs-go, .bs-go2, .bs-case, .product-link, .nav-cta")) {
          if (!vis(el)) continue;
          if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== "visible") ui.push("clipped-cta: " + (el.textContent || "").trim().slice(0, 40).replace(/\s+/g, " ") + " (" + el.scrollWidth + ">" + el.clientWidth + ")");
        }
        // 2. undefined CSS custom properties that resolved to nothing (the var(--accent) bug of Sep 25)
        for (const el of document.querySelectorAll("a, button, .btn, .chip, .go-btn, .nav-cta, [class*=cta]")) {
          if (!vis(el)) continue;
          const cs = getComputedStyle(el);
          const fg = cs.color, bg = cs.backgroundColor;
          if (fg === bg && fg !== "rgba(0, 0, 0, 0)" && (el.textContent || "").trim()) ui.push("invisible-text: " + (el.textContent || "").trim().slice(0, 40));
        }
        // a bare var(--x) the page never defines anywhere it could be read from: <style>, same-origin stylesheets,
        // :root/body computed values, or an inline style on any element (the sector blocks set --sidx inline; card
        // tilt sets --dx/--dy from JS). Only a variable with no value from any of those is a fault.
        // Only rules whose selector matches something on THIS page count (shared stylesheets carry rules for other
        // pages' tokens); a var() used only as another var's fallback is fine; --dx/--dy are the tilt script's hover values.
        let cssText = "", usedText = "";
        const walk = (rules) => { for (const r of rules) { try { if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; } } catch (e) { continue; } if (!r.selectorText) continue; cssText += "\n" + r.cssText; let hit = false; try { hit = !!document.querySelector(r.selectorText.replace(/::?[a-z-]+(\([^)]*\))?/g, "")); } catch (e) { hit = false; } if (hit) usedText += "\n" + r.cssText; } };
        try { for (const ss of document.styleSheets) { try { walk(ss.cssRules); } catch (e) {} } } catch (e) {}
        for (const el of document.querySelectorAll("[style*='var(']")) usedText += "\n" + el.getAttribute("style");
        usedText = usedText.replace(/,\s*var\(--[a-zA-Z0-9_-]+\)/g, ",_");   // drop fallback arguments: var(--a, var(--b)) uses --b only if --a is missing
        const used = new Set([...usedText.matchAll(/var\(--([a-zA-Z0-9_-]+)\)/g)].map((m) => m[1]).filter((v) => !/^(dx|dy|rx|ry|mx|my)$/.test(v)));
        const rootCS = getComputedStyle(document.documentElement), bodyCS = getComputedStyle(document.body);
        const inline = new Set(); for (const el of document.querySelectorAll("[style*='--']")) for (const m of el.getAttribute("style").matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)) inline.add(m[1]);
        for (const v of used) {
          if (rootCS.getPropertyValue("--" + v).trim() || bodyCS.getPropertyValue("--" + v).trim() || inline.has(v)) continue;
          if (new RegExp("--" + v + "\\s*:").test(cssText)) continue;   // defined in a scoped rule (.panel{--x:…})
          ui.push("undefined-var: --" + v);
        }
        // 3. tap targets under 32px on a phone (links/buttons a thumb cannot hit)
        if (innerWidth <= 420) {
          let small = 0, ex = "";
          for (const el of document.querySelectorAll("a.ebay, a.auc, .go-btn, .btn-primary, .btn-secondary, button.sch-track-card, .fold-btn, .tab")) {
            if (!vis(el)) continue; const r = el.getBoundingClientRect();
            if (r.height < 24 || r.width < 24) { small++; if (!ex) ex = (el.textContent || el.className || "").toString().trim().slice(0, 30) + " " + Math.round(r.width) + "x" + Math.round(r.height); }
          }
          if (small) ui.push("small-tap-targets: " + small + " (e.g. " + ex + ")");
        }
        // 4. elements hanging outside the viewport on a phone (the source of horizontal scroll)
        // (only when the document really scrolls sideways — off-canvas drawers and horizontal strips are by design)
        if (innerWidth <= 420 && document.documentElement.scrollWidth > innerWidth) {
          for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.right > innerWidth + 8 && getComputedStyle(el).position !== "fixed" && !el.closest("[style*='overflow'], .tbl-scroll, .tbl-wrap, .strip, nav, .rail, .mobile-nav")) { ui.push("overflow-el: " + el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : "") + " right=" + Math.round(r.right)); break; } }
        }
        const imgs = Array.from(document.images);
        // an <img> with no src at all is a slot a script fills later (the watchlist's share-card preview) — not a break
        const bad = imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src") && !(i.src || "").startsWith("data:")).map((i) => (i.currentSrc || i.src || "").slice(0, 140));
        const pending = imgs.filter((i) => !i.complete).length;
        const slots = Array.from(document.querySelectorAll(".sch-cimg"));
        const ph = slots.filter((s) => !s.querySelector("img.is-photo")).map((s) => (s.getAttribute("data-card-name") || s.getAttribute("data-card-img") || "").slice(0, 80));
        return { imgs: imgs.length, bad, pending, slots: slots.length, placeholder: ph, ui: ui.slice(0, 12), sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.documentElement.scrollHeight };
      });
      const row = { page: p, width: w, status, ms: Date.now() - t0, ...info, errors: errs };
      const hard = row.ui.filter((u) => /^(clipped-cta|invisible-text|undefined-var|overflow-el)/.test(u));
      row.fail = status !== 200 || row.bad.length > 0 || errs.length > 0 || (w <= 420 && row.sw > row.iw) || hard.length > 0;
      row.warn = row.placeholder.length > 0 || row.ui.length > hard.length;
      if (SHOTS && w <= 420) { try { await pg.screenshot({ path: path.join(SHOTS, p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home") + "-390.png", fullPage: false }); } catch (e) {} }
      if (row.fail) fails++; if (row.warn) warns++;
      results.push(row);
      const flag = row.fail ? "FAIL" : row.warn ? "WARN" : " ok ";
      console.log(`[${flag}] ${w} ${p} — ${row.imgs} img, ${row.bad.length} broken, ${row.slots} card slots (${row.placeholder.length} placeholder)${row.sw > row.iw ? `, overflow ${row.sw}>${row.iw}` : ""}${errs.length ? `, errors: ${errs.join(" | ")}` : ""}${status !== 200 ? `, HTTP ${status}` : ""}${row.ui.length ? `\n        ui: ${row.ui.join(" | ")}` : ""}`);
      if (row.bad.length) row.bad.slice(0, 5).forEach((b) => console.log("        broken: " + b));
    } catch (e) {
      fails++; results.push({ page: p, width: w, fail: true, error: String(e).slice(0, 200) });
      console.log(`[FAIL] ${w} ${p} — ${String(e).slice(0, 160)}`);
    }
    await pg.close();
  }
  await ctx.close();
}
await browser.close();
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ base: BASE, date: new Date().toISOString(), results }, null, 1));
console.log(`\nimage-sweep — ${pages.length} pages × ${WIDTHS.join("/")} px on ${BASE}: FAIL ${fails} · WARN ${warns}`);
process.exit(fails ? 1 : 0);
