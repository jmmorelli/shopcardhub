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
const http = require("node:http");
const { execSync } = require("node:child_process");

const argv = process.argv.slice(2);
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const REPO = path.resolve(argOf("--repo", path.resolve(__dirname, "../..")));
const FEED = path.resolve(argOf("--feed", path.join(REPO, "../pd/data")));
const OUT = path.resolve(argOf("--out", path.join(process.env.SCRATCHPAD || "/tmp", "qa-" + new Date().toISOString().slice(0, 10))));
const PORT = parseInt(argOf("--port", "4173"), 10);
const HASH = argOf("--hash", "");
const WAIT = parseInt(argOf("--wait", "1200"), 10);
const PAGES = argOf("--pages", "index").split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s === "/" ? "index" : s.replace(/^\//, "").replace(/\.html$/, "")));
const FIXTURES = path.join(__dirname, "fixtures");

const PW_ROOT = process.env.PLAYWRIGHT_ROOT || (() => { try { return path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "playwright"); } catch { return "playwright"; } })();
let playwright; try { playwright = require(PW_ROOT); } catch (e) { console.error(`playwright not found at ${PW_ROOT} (set PLAYWRIGHT_ROOT): ${e.message}`); process.exit(2); }

const ABORT_HOSTS = [/(^|\.)googletagmanager\.com$/, /(^|\.)google-analytics\.com$/, /\.analytics\.google\.com$/, /^stats\.g\.doubleclick\.net$/, /^fonts\.googleapis\.com$/, /^fonts\.gstatic\.com$/];
const IMAGE_HOSTS = [/^i\.ebayimg\.com$/, /^images\./];
const FEED_RE = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/shopcardhub\/price-data\/data\/([a-z0-9-]+\.json)/;
const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".xml": "application/xml", ".txt": "text/plain" };

/* ---- static server: cleanUrls + vercel.json redirects, nothing else ---- */
let redirects = [];
try { redirects = (JSON.parse(fs.readFileSync(path.join(REPO, "vercel.json"), "utf8")).redirects || []).filter((r) => !/[:*()]/.test(r.source)); } catch {}
const server = http.createServer((req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  let p = decodeURIComponent(u.pathname);
  const r = redirects.find((x) => x.source === p);
  if (r) { res.writeHead(r.permanent === false ? 307 : 308, { Location: r.destination }); return res.end(); }
  if (p.startsWith("/api/")) {
    const name = p.slice(5).replace(/[^a-z-]/g, "");
    const fx = path.join(FIXTURES, name + ".json");
    if (fs.existsSync(fx)) { res.writeHead(200, { "content-type": "application/json", "x-qa-stub": "fixture" }); return res.end(fs.readFileSync(fx)); }
    res.writeHead(200, { "content-type": "application/json", "x-qa-stub": "empty" }); return res.end("{}");
  }
  if (p === "/") p = "/index.html";
  let file = path.join(REPO, p);
  if (!file.startsWith(REPO)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("404 " + p); }
  res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((ok) => server.listen(PORT, "127.0.0.1", ok));
  fs.mkdirSync(OUT, { recursive: true });
  const feedOk = fs.existsSync(path.join(FEED, "prices-latest.json"));
  if (!feedOk) console.error(`feed clone not found at ${FEED} — feed requests will be aborted (pass --feed)`);
  const browser = await playwright.chromium.launch();
  const report = [];
  let exitCode = 0;
  for (const slug of PAGES) {
    const url = `http://127.0.0.1:${PORT}/${slug === "index" ? "" : slug}${HASH}`;
    const entry = { page: slug, url, height1440: null, height390: null, scrollWidth390: null, consoleErrors: [], requests: { aborted: [], stubbed: [], feed: [] } };
    for (const [vp, label] of [[{ width: 1440, height: 900 }, "1440"], [{ width: 390, height: 844 }, "390"]]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: label === "390", hasTouch: label === "390", locale: "en-US" });
      await ctx.route("**/*", (route) => {
        const req = route.request(); const ru = new URL(req.url()); const host = ru.hostname;
        if (host === "127.0.0.1" || host === "localhost") return route.continue();
        const fm = req.url().match(FEED_RE);
        if (fm) {
          const f = path.join(FEED, fm[1]);
          if (feedOk && fs.existsSync(f)) { entry.requests.feed.push(fm[1]); return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); }
          entry.requests.aborted.push(req.url()); return route.abort();
        }
        if (ABORT_HOSTS.some((re) => re.test(host))) { entry.requests.aborted.push(host); return route.abort(); }
        if (IMAGE_HOSTS.some((re) => re.test(host)) || req.resourceType() === "image") { entry.requests.stubbed.push(host); return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1x1 }); }
        entry.requests.aborted.push(host); return route.abort(); // fully offline: nothing else leaves the box
      });
      const page = await ctx.newPage();
      // a resource the harness itself aborted (analytics, off-box hosts) is not a page error
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const loc = (m.location() || {}).url || "";
        if (/Failed to load resource/.test(m.text()) && loc && !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(loc)) return;
        entry.consoleErrors.push(`[${label}] ${m.text().slice(0, 300)}${loc ? " @ " + loc.slice(0, 120) : ""}`);
      });
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
    entry.requests.aborted = [...new Set(entry.requests.aborted)]; entry.requests.stubbed = [...new Set(entry.requests.stubbed)]; entry.requests.feed = [...new Set(entry.requests.feed)];
    const overflow = entry.scrollWidth390 != null && entry.scrollWidth390 > 390;
    if (entry.consoleErrors.length || overflow) exitCode = 1;
    console.log(`${slug.padEnd(40)} 1440h ${String(entry.height1440).padStart(6)} · 390h ${String(entry.height390).padStart(6)} · 390w ${entry.scrollWidth390}${overflow ? " OVERFLOW" : ""} · console errors ${entry.consoleErrors.length} · aborted ${entry.requests.aborted.length} host(s)`);
    for (const e of entry.consoleErrors) console.log(`    ${e}`);
    report.push(entry);
  }
  await browser.close();
  server.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ date: new Date().toISOString(), repo: REPO, feed: feedOk ? FEED : null, pages: report }, null, 1));
  console.log(`report: ${path.join(OUT, "report.json")}`);
  process.exit(exitCode);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
