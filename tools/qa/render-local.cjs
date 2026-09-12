#!/usr/bin/env node
/* render-local.cjs — beacon-safe local render harness for shopcardhub (Terminal step 2, Sep 11 2026).
 *
 * Serves the repo on localhost the way Vercel does (cleanUrls: /foo → foo.html, / → index.html) and
 * renders pages in headless Chromium with every outbound dependency either routed, stubbed or aborted:
 *   raw.githubusercontent.com/…/price-data/data/<file>  → served from the --feed clone (nightly feed)
 *   /api/comps, /api/auctions                            → tools/qa/fixtures/{comps,auctions}.json
 *   i.ebayimg.com, images.*                              → a 1×1 transparent PNG
 *   googletagmanager / google-analytics / *.analytics.google.com / stats.g.doubleclick.net / fonts.googleapis.com
 *                                                        → ABORTED (no analytics beacon ever leaves a QA run)
 *   anything else off-localhost                          → ABORTED too (the harness is fully offline)
 * Writes, per page, fold + full-page screenshots at 1440×900 and 390×844 and a report.json of
 *   {page, height1440, height390, scrollWidth390, consoleErrors, requests:{aborted,stubbed,feed}}
 * Server, routing and the beacon abort list live in tools/qa/harness.cjs (shared with interactions.cjs).
 * Never touches the repo. Requires the global Playwright: PLAYWRIGHT_ROOT or `$(npm root -g)/playwright`.
 *
 * Usage: node tools/qa/render-local.cjs --pages index,ethan-holliday-rookie-cards --out /tmp/qa
 *        [--feed <dir>] [--repo <dir>] [--port 4173] [--hash "#screen=board"] [--wait 1500]
 *   --pages   comma list of slugs (index or / for the homepage). Default: index
 *   --out     output directory (created). Default: <scratch>/qa-<date>
 *   --feed    price-data clone dir. Default: <repo>/../pd/data. Missing → feed requests are aborted.
 *   --hash    appended to every page URL (e.g. "#screen=under100" to render a saved screen)
 *   --wait    ms to settle after network idle before screenshots (default 1200)
 * Exit 1 if any page had a console error or a 390px horizontal overflow (scrollWidth390 > 390).
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const H = require("./harness.cjs"); // server + routing + beacon abort live in ONE place (shared with interactions.cjs)

const argv = process.argv.slice(2);
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const REPO = path.resolve(argOf("--repo", path.resolve(__dirname, "../..")));
const FEED = path.resolve(argOf("--feed", path.join(REPO, "../pd/data")));
const OUT = path.resolve(argOf("--out", path.join(process.env.SCRATCHPAD || "/tmp", "qa-" + new Date().toISOString().slice(0, 10))));
const PORT = parseInt(argOf("--port", "4173"), 10);
const HASH = argOf("--hash", "");
const WAIT = parseInt(argOf("--wait", "1200"), 10);
const PAGES = argOf("--pages", "index").split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s === "/" ? "index" : s.replace(/^\//, "").replace(/\.html$/, "")));
const playwright = H.loadPlaywright();

(async () => {
  const srv = await H.startServer({ repo: REPO, port: PORT });
  fs.mkdirSync(OUT, { recursive: true });
  const feedOk = fs.existsSync(path.join(FEED, "prices-latest.json"));
  if (!feedOk) console.error(`feed clone not found at ${FEED} — feed requests will be aborted (pass --feed)`);
  const browser = await playwright.chromium.launch();
  const report = [];
  let exitCode = 0;
  for (const slug of PAGES) {
    const url = `${srv.origin}/${slug === "index" ? "" : slug}${HASH}`;
    const entry = { page: slug, url, height1440: null, height390: null, scrollWidth390: null, consoleErrors: [], requests: { aborted: [], stubbed: [], feed: [] } };
    for (const [vp, label] of [[{ width: 1440, height: 900 }, "1440"], [{ width: 390, height: 844 }, "390"]]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: label === "390", hasTouch: label === "390", locale: "en-US" });
      await H.routeContext(ctx, { mode: "local", feed: FEED, log: entry.requests });
      const page = await ctx.newPage();
      page.on("console", (m) => { if (m.type() !== "error" || H.isHarnessNoise(m)) return; const loc = (m.location() || {}).url || ""; entry.consoleErrors.push(`[${label}] ${m.text().slice(0, 300)}${loc ? " @ " + loc.slice(0, 120) : ""}`); });
      page.on("pageerror", (e) => entry.consoleErrors.push(`[${label}] pageerror: ${String(e.message || e).slice(0, 300)}`));
      try {
        const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        if (!resp || resp.status() >= 400) entry.consoleErrors.push(`[${label}] HTTP ${resp ? resp.status() : "no response"} for ${url}`);
        await page.waitForTimeout(WAIT);
        const dims = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth }));
        if (label === "1440") entry.height1440 = dims.h; else { entry.height390 = dims.h; entry.scrollWidth390 = dims.w; }
        await page.screenshot({ path: path.join(OUT, `${slug}-${label}-fold.png`), fullPage: false });
        await page.screenshot({ path: path.join(OUT, `${slug}-${label}-full.png`), fullPage: true });
      } catch (e) { entry.consoleErrors.push(`[${label}] harness: ${String(e.message || e).slice(0, 300)}`); }
      await ctx.close();
    }
    for (const k of ["aborted", "stubbed", "feed"]) entry.requests[k] = [...new Set(entry.requests[k])];
    const overflow = entry.scrollWidth390 != null && entry.scrollWidth390 > 390;
    if (entry.consoleErrors.length || overflow) exitCode = 1;
    console.log(`${slug.padEnd(40)} 1440h ${String(entry.height1440).padStart(6)} · 390h ${String(entry.height390).padStart(6)} · 390w ${entry.scrollWidth390}${overflow ? " OVERFLOW" : ""} · console errors ${entry.consoleErrors.length} · aborted ${entry.requests.aborted.length} host(s)`);
    for (const e of entry.consoleErrors) console.log(`    ${e}`);
    report.push(entry);
  }
  await browser.close();
  srv.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ date: new Date().toISOString(), repo: REPO, feed: feedOk ? FEED : null, pages: report }, null, 1));
  console.log(`report: ${path.join(OUT, "report.json")}`);
  process.exit(exitCode);
})().catch((e) => { console.error(e); process.exit(2); });
