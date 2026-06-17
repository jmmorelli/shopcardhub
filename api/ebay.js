// Vercel Serverless Function — eBay Partner Network (Impact platform) proxy
//
// Why this exists: shopcardhub is a static site. A static page cannot hold the
// EPN Auth Token without exposing it to anyone who views source. This function
// runs server-side on Vercel, reads the credentials from environment variables
// (never shipped to the browser), and proxies a small allow-list of safe calls.
//
// Required Vercel env vars (Settings -> Environments -> Production):
//   EBAY_ACCOUNT_SID   -> your Account SID
//   EBAY_AUTH_TOKEN    -> your Auth Token
//   EBAY_PROXY_KEY     -> a long random secret you choose; callers must send it
//
// Auth: every request must supply the proxy key, either as
//   - header:  x-proxy-key: <EBAY_PROXY_KEY>     (preferred)
//   - or query: ?key=<EBAY_PROXY_KEY>            (fine for quick testing)
// Without a valid key the function returns 401. If the key env var is unset it
// fails closed (503) rather than serving data unprotected.
//
// NOTE: a key placed in PUBLIC page JavaScript is visible in view-source. Use
// this endpoint for YOUR own tooling / private dashboards (earnings, reports).
// Don't embed the key in pages served to visitors.
//
// Examples (with header set):
//   /api/ebay?action=campaigns
//   /api/ebay?action=reports
//   /api/ebay?action=report&reportId=ebay_partner_perf_by_day&...
//   /api/ebay?action=actions
//   POST /api/ebay  body: { "action":"tracking-link", "programId":"9356", "url":"https://www.ebay.com/itm/..." }

import crypto from "crypto";

const BASE = "https://api.partner.ebay.com";

const GET_ACTIONS = {
  campaigns: (sid) => `/Mediapartners/${sid}/Campaigns`,
  reports: (sid) => `/Mediapartners/${sid}/Reports`,
  actions: (sid) => `/Mediapartners/${sid}/Actions`,
  "action-updates": (sid) => `/Mediapartners/${sid}/ActionUpdates`,
};

function authHeader() {
  const sid = process.env.EBAY_ACCOUNT_SID;
  const token = process.env.EBAY_AUTH_TOKEN;
  if (!sid || !token) return null;
  const basic = Buffer.from(`${sid}:${token}`).toString("base64");
  return { sid, header: `Basic ${basic}` };
}

// Constant-time compare so the key can't be guessed via response timing.
function keyOk(provided) {
  const expected = process.env.EBAY_PROXY_KEY || "";
  if (!expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function passthroughQuery(query) {
  const skip = new Set(["action", "reportId", "key"]); // never forward our control params
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (skip.has(k)) continue;
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
    else if (v != null) params.append(k, v);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

// Remove the Account SID from anything we hand back to the client.
function scrub(text, sid) {
  if (!text || !sid) return text;
  return text.split(sid).join("***");
}

export default async function handler(req, res) {
  // ---- Gate 0: server must be configured ----
  if (!process.env.EBAY_PROXY_KEY) {
    return res.status(503).json({ error: "Proxy key not configured on server." });
  }
  // ---- Gate 1: caller must present the key ----
  const provided = req.headers["x-proxy-key"] || req.query.key || "";
  if (!keyOk(provided)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const auth = authHeader();
  if (!auth) {
    return res
      .status(500)
      .json({ error: "Server is missing EBAY_ACCOUNT_SID / EBAY_AUTH_TOKEN env vars." });
  }

  const reply = async (r) => {
    const data = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    return res.send(scrub(data, auth.sid));
  };

  try {
    // ---- Writes: create tracking link (the one POST we allow) ----
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      if (body.action !== "tracking-link") {
        return res.status(400).json({ error: "Unsupported POST action." });
      }
      const { programId, url } = body;
      if (!programId || !url) {
        return res.status(400).json({ error: "tracking-link requires programId and url." });
      }
      const form = new URLSearchParams();
      form.append("Type", "REGULAR");
      form.append("DeepLink", url);
      const epnPath = `/Mediapartners/${auth.sid}/Programs/${encodeURIComponent(programId)}/TrackingLinks`;
      const r = await fetch(BASE + epnPath, {
        method: "POST",
        headers: {
          Authorization: auth.header,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      return reply(r);
    }

    // ---- Reads ----
    if (req.method === "GET") {
      const action = req.query.action;
      let epnPath;

      if (action === "report") {
        const reportId = req.query.reportId;
        if (!reportId) return res.status(400).json({ error: "report requires reportId." });
        epnPath = `/Mediapartners/${auth.sid}/Reports/${encodeURIComponent(reportId)}`;
      } else if (GET_ACTIONS[action]) {
        epnPath = GET_ACTIONS[action](auth.sid);
      } else {
        return res.status(400).json({
          error: "Unknown action.",
          allowed: [...Object.keys(GET_ACTIONS), "report (needs reportId)", "POST tracking-link"],
        });
      }

      const r = await fetch(BASE + epnPath + passthroughQuery(req.query), {
        method: "GET",
        headers: { Authorization: auth.header, Accept: "application/json" },
      });
      return reply(r);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    return res.status(502).json({ error: "Upstream request failed.", detail: String(err.message || err) });
  }
}
