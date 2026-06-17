// Vercel Serverless Function — eBay Partner Network (Impact platform) proxy
//
// Why this exists: shopcardhub is a static site. A static page cannot hold the
// EPN Auth Token without exposing it to anyone who views source. This function
// runs server-side on Vercel, reads the credentials from environment variables
// (never shipped to the browser), and proxies a small allow-list of safe calls.
//
// Required Vercel env vars (Settings -> Environment Variables):
//   EBAY_ACCOUNT_SID   -> your Account SID
//   EBAY_AUTH_TOKEN    -> your Auth Token
//
// Call it from the site like:
//   /api/ebay?action=campaigns
//   /api/ebay?action=reports
//   /api/ebay?action=report&reportId=ebay_partner_perf_by_day&SUBID=...
//   /api/ebay?action=actions
//   POST /api/ebay  body: { "action":"tracking-link", "programId":"...", "url":"https://www.ebay.com/itm/..." }

const BASE = "https://api.partner.ebay.com";

// Allow-list. Anything not listed here is rejected, so a leaked URL param
// cannot reach an endpoint you didn't intend to expose.
const GET_ACTIONS = {
  // List your campaigns (useful for looking up CampaignID / ProgramId)
  campaigns: (sid) => `/Mediapartners/${sid}/Campaigns`,
  // List available report definitions
  reports: (sid) => `/Mediapartners/${sid}/Reports`,
  // List credited conversion events (commissions)
  actions: (sid) => `/Mediapartners/${sid}/Actions`,
  // Status changes on conversions (reversals, etc.)
  "action-updates": (sid) => `/Mediapartners/${sid}/ActionUpdates`,
};

function authHeader() {
  const sid = process.env.EBAY_ACCOUNT_SID;
  const token = process.env.EBAY_AUTH_TOKEN;
  if (!sid || !token) return null;
  const basic = Buffer.from(`${sid}:${token}`).toString("base64");
  return { sid, header: `Basic ${basic}` };
}

// Pass through any extra query params (report filters, date ranges, paging)
// EXCEPT our own control params.
function passthroughQuery(query) {
  const skip = new Set(["action", "reportId"]);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (skip.has(k)) continue;
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
    else if (v != null) params.append(k, v);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function handler(req, res) {
  const auth = authHeader();
  if (!auth) {
    return res
      .status(500)
      .json({ error: "Server is missing EBAY_ACCOUNT_SID / EBAY_AUTH_TOKEN env vars." });
  }

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
      form.append("DeepLink", url); // the eBay item/category URL to wrap
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
      const data = await r.text();
      res.status(r.status);
      res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
      return res.send(data);
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
      const data = await r.text();
      res.status(r.status);
      res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
      return res.send(data);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    // Never echo the token or full internals back to the client.
    return res.status(502).json({ error: "Upstream request failed.", detail: String(err.message || err) });
  }
}
