// Request guard for the endpoints that spend Mo's eBay keyset (/api/comps, /api/auctions).
//
// Why (eBay API License Agreement, read 2026-09-22):
//   §9  "Distribute, publish, or allow access or linking to eBay Services, including any API,
//        from any location or source other than your Application."
//   §4.2 "Your Users will have no programmatic control over any API."
// Until today both endpoints were open proxies: anyone could drive Browse on our keyset, and abuse
// of an open endpoint reads to eBay as OUR application misbehaving.
//
// Allowed:
//   1. a browser request from one of our own pages — Sec-Fetch-Site: same-origin, or an
//      Origin/Referer whose host is ours;
//   2. our own tools (nightly price engine, audits) — they send X-ShopCardHub-Client.
// Everything else gets 403 with Cache-Control: no-store, so a rejection can never be cached at the
// edge and served to a real visitor. This is a speed bump, not authentication: a determined caller
// can forge headers. The per-IP rate limit is the second layer; the CDN cache is the third.

const HOSTS = new Set(["www.shopcardhub.com", "shopcardhub.com", "localhost", "127.0.0.1"]);
const hostOk = (h) => HOSTS.has(h) || /\.vercel\.app$/.test(h);
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ""; } };

export const TOOL_HEADER = "x-shopcardhub-client";

// in-memory, per warm instance: ~60 uncached calls a minute per IP. Cache hits never reach here.
const WINDOW_MS = 60_000, MAX_PER_WINDOW = 60;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > WINDOW_MS) { hits.set(ip, { t: now, n: 1 }); if (hits.size > 5000) hits.clear(); return false; }
  h.n += 1;
  return h.n > MAX_PER_WINDOW;
}

export function guard(req, res) {
  const hd = req.headers || {};
  const site = String(hd["sec-fetch-site"] || "").toLowerCase();
  const origin = hd.origin ? hostOf(hd.origin) : "";
  const referer = hd.referer ? hostOf(hd.referer) : "";
  const tool = !!hd[TOOL_HEADER];
  let ok;
  if (origin) ok = hostOk(origin);                      // cross-origin or POST-style: Origin decides
  else if (site === "same-origin") ok = true;           // our own page, Referer stripped by the browser
  else if (referer) ok = hostOk(referer);
  else ok = tool;                                       // no browser context: only our tools
  if (!ok) {
    res.setHeader("Cache-Control", "no-store");
    res.status(403).json({ error: "This endpoint serves shopcardhub.com pages only." });
    return false;
  }
  const ip = String(hd["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  // our own tools are exempt: the nightly engine makes ~100 sequential calls from one runner IP
  if (!tool && rateLimited(ip)) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many requests." });
    return false;
  }
  return true;
}
