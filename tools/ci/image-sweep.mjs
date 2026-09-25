#!/usr/bin/env node
// tools/ci/image-sweep.mjs — the rendered image gate (Sep 25 2026, Mo: "make sure our images look good/work on all
// pages — shouldn't an agent be doing that nightly?"). The three static gates read HTML; card photos resolve in the
// browser (js/card-img.js → /data/card-images.json → /api/comps name search → eBay), so a broken photo never tripped
// them. This one loads every sitemap page in headless Chromium against PRODUCTION (or --base <url>), scrolls it so lazy
// images load, and reports per page: <img> elements that failed (naturalWidth 0 after load), card slots still on the
// generated placeholder, page errors, horizontal overflow.
//   FAIL: any <img> that failed to load; a page error; horizontal overflow at 390px
//   WARN: card slots left on the placeholder (a photo the name search could not find — honest, but worth a look)
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
  for (const p of pages) {
    const pg = await ctx.newPage();
    const errs = [];
    pg.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
    const t0 = Date.now();
    let status = 0;
    try {
      const r = await pg.goto(BASE + p, { waitUntil: "load", timeout: 60000 });
      status = r ? r.status() : 0;
      // scroll the whole page so lazy images and the photo resolver get their turn
      await pg.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await pg.waitForTimeout(2500);
      const info = await pg.evaluate(() => {
        const imgs = Array.from(document.images);
        const bad = imgs.filter((i) => i.complete && i.naturalWidth === 0 && !(i.src || "").startsWith("data:")).map((i) => (i.currentSrc || i.src || "").slice(0, 140));
        const pending = imgs.filter((i) => !i.complete).length;
        const slots = Array.from(document.querySelectorAll(".sch-cimg"));
        const ph = slots.filter((s) => !s.querySelector("img.is-photo")).map((s) => (s.getAttribute("data-card-name") || s.getAttribute("data-card-img") || "").slice(0, 80));
        return { imgs: imgs.length, bad, pending, slots: slots.length, placeholder: ph, sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.documentElement.scrollHeight };
      });
      const row = { page: p, width: w, status, ms: Date.now() - t0, ...info, errors: errs };
      row.fail = status !== 200 || row.bad.length > 0 || errs.length > 0 || (w <= 420 && row.sw > row.iw);
      row.warn = row.placeholder.length > 0;
      if (row.fail) fails++; if (row.warn) warns++;
      results.push(row);
      const flag = row.fail ? "FAIL" : row.warn ? "WARN" : " ok ";
      console.log(`[${flag}] ${w} ${p} — ${row.imgs} img, ${row.bad.length} broken, ${row.slots} card slots (${row.placeholder.length} placeholder)${row.sw > row.iw ? `, overflow ${row.sw}>${row.iw}` : ""}${errs.length ? `, errors: ${errs.join(" | ")}` : ""}${status !== 200 ? `, HTTP ${status}` : ""}`);
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
