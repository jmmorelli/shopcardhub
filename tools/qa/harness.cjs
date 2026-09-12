/* harness.cjs — the shared, beacon-safe local harness for shopcardhub QA (Sep 12 2026).
 * Used by tools/qa/render-local.cjs (screenshots) and tools/qa/interactions.cjs (click-through suite).
 *
 *   startServer({ repo, port })            → static server with Vercel semantics: cleanUrls (/foo → foo.html,
 *                                             / → index.html), the literal redirects in vercel.json (308),
 *                                             /api/<name> answered from tools/qa/fixtures/<name>.json ({} otherwise)
 *   routeContext(ctx, { mode, feed, log })  → Playwright routing for a BrowserContext:
 *        local: 127.0.0.1 continues; raw.githubusercontent price-data URLs → the --feed clone (else aborted);
 *               i.ebayimg.com / images.* / any image → 1×1 PNG; analytics + font hosts ABORTED; everything else ABORTED
 *        prod:  the given origin continues (real feed, real /api); analytics + font hosts ABORTED; images continue
 *   loadPlaywright()                        → the global Playwright (PLAYWRIGHT_ROOT or `npm root -g`/playwright)
 *   isHarnessNoise(consoleMessage)          → true for "Failed to load resource" lines caused by the harness's own aborts
 * Nothing here writes to the repo. No GA hit, no beacon, ever — that is the whole point of the file. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execSync } = require("node:child_process");

const ABORT_HOSTS = [/(^|\.)googletagmanager\.com$/, /(^|\.)google-analytics\.com$/, /\.analytics\.google\.com$/, /^stats\.g\.doubleclick\.net$/, /(^|\.)doubleclick\.net$/, /^fonts\.googleapis\.com$/, /^fonts\.gstatic\.com$/];
const IMAGE_HOSTS = [/^i\.ebayimg\.com$/, /^images\./];
const FEED_RE = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/shopcardhub\/price-data\/data\/([a-z0-9-]+\.json)/;
const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".cjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".xml": "application/xml", ".txt": "text/plain" };
const FIXTURES = path.join(__dirname, "fixtures");

function loadPlaywright() {
  const root = process.env.PLAYWRIGHT_ROOT || (() => { try { return path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "playwright"); } catch { return "playwright"; } })();
  try { return require(root); } catch (e) { console.error(`playwright not found at ${root} (set PLAYWRIGHT_ROOT): ${e.message}`); process.exit(2); }
}

/* Vercel-shaped resolution of a site path against the repo: returns the file, a redirect, or null */
function resolvePath(repo, p, redirects) {
  const r = (redirects || []).find((x) => x.source === p);
  if (r) return { redirect: r.destination, status: r.permanent === false ? 307 : 308 };
  if (p === "/") p = "/index.html";
  let file = path.join(repo, p);
  if (!file.startsWith(repo)) return null;
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return null;
  return { file };
}
function readRedirects(repo) {
  try { return (JSON.parse(fs.readFileSync(path.join(repo, "vercel.json"), "utf8")).redirects || []).filter((r) => !/[:*()]/.test(r.source)); } catch { return []; }
}

function startServer({ repo, port = 4173 }) {
  const redirects = readRedirects(repo);
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, `http://localhost:${port}`);
    const p = decodeURIComponent(u.pathname);
    if (p.startsWith("/api/")) {
      const name = p.slice(5).replace(/[^a-z-]/g, "");
      const fx = path.join(FIXTURES, name + ".json");
      if (fs.existsSync(fx)) { res.writeHead(200, { "content-type": "application/json", "x-qa-stub": "fixture" }); return res.end(fs.readFileSync(fx)); }
      res.writeHead(200, { "content-type": "application/json", "x-qa-stub": "empty" }); return res.end("{}");
    }
    const hit = resolvePath(repo, p, redirects);
    if (!hit) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("404 " + p); }
    if (hit.redirect) { res.writeHead(hit.status, { Location: hit.redirect }); return res.end(); }
    res.writeHead(200, { "content-type": MIME[path.extname(hit.file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(hit.file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok({ server, origin: `http://127.0.0.1:${port}`, redirects, close: () => server.close() })));
}

/* Route every request of a BrowserContext. `log` collects {feed[], stubbed[], aborted[]} host names. */
async function routeContext(ctx, { mode = "local", origin, feed, log }) {
  const L = log || { feed: [], stubbed: [], aborted: [] };
  const feedOk = !!(feed && fs.existsSync(path.join(feed, "prices-latest.json")));
  const own = origin ? new URL(origin).host : null;
  await ctx.route("**/*", (route) => {
    const req = route.request(); const url = req.url(); let host = "";
    try { host = new URL(url).hostname; } catch { return route.abort(); }
    const hostPort = (() => { try { return new URL(url).host; } catch { return ""; } })();
    if (host === "127.0.0.1" || host === "localhost" || (own && hostPort === own)) return route.continue();
    if (ABORT_HOSTS.some((re) => re.test(host))) { L.aborted.push(host); return route.abort(); }
    if (mode === "prod") {
      if (host.endsWith("shopcardhub.com") || host === "raw.githubusercontent.com" || IMAGE_HOSTS.some((re) => re.test(host)) || req.resourceType() === "image") return route.continue();
      L.aborted.push(host); return route.abort();
    }
    const fm = url.match(FEED_RE);
    if (fm) {
      const f = feedOk ? path.join(feed, fm[1]) : null;
      if (f && fs.existsSync(f)) { L.feed.push(fm[1]); return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); }
      L.aborted.push("raw.githubusercontent.com"); return route.abort();
    }
    if (IMAGE_HOSTS.some((re) => re.test(host)) || req.resourceType() === "image") { L.stubbed.push(host); return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1x1 }); }
    L.aborted.push(host); return route.abort(); // fully offline: nothing else leaves the box
  });
  return L;
}

function isHarnessNoise(msg, origin) {
  if (msg.type() !== "error" || !/Failed to load resource/.test(msg.text())) return false;
  const loc = (msg.location() || {}).url || "";
  if (!loc) return false;
  return !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(loc) && !(origin && loc.startsWith(origin));
}

module.exports = { startServer, routeContext, loadPlaywright, isHarnessNoise, resolvePath, readRedirects, ABORT_HOSTS, IMAGE_HOSTS, FEED_RE, PNG_1x1, FIXTURES };
