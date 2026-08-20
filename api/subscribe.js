// Vercel Serverless Function — newsletter signup (Aug 20 2026).
//
// WHY THIS EXISTS: the site forms used to POST straight to MailerLite's public
// form endpoint (assets.mailerlite.com/jsonp/.../subscribe). That endpoint
// returns {"success":true} and then drops the person into DOUBLE OPT-IN limbo —
// they must click a confirmation email to become a real subscriber. Diagnosed
// Aug 20: the form had been accepting signups since June and produced ZERO
// confirmed subscribers. Per-form double opt-in cannot be turned off on the free
// plan ("upgrade to a premium plan to edit the subscribe form").
//
// THE WAY THROUGH: MailerLite's account setting "Double opt-in for API and
// integrations" is OFF, so subscribers created through the API v2 land ACTIVE
// immediately — no confirmation click, no plan upgrade. This function is that
// API call, with the key held server-side (never in public HTML).
//
//   POST /api/subscribe  { email, source? }
//     → 200 {ok:true}                 subscriber created/updated and active
//     → 400 {error:"invalid email"}   failed basic shape check
//     → 429 {error:"slow down"}       naive per-IP throttle
//     → 503 {error:"not configured"}  MAILERLITE_API_KEY missing
//     → 502 {error:"upstream"}        MailerLite rejected it (detail logged, not leaked)
//
// Required Vercel env: MAILERLITE_API_KEY (MailerLite → Integrations → API →
// generate token). Optional: MAILERLITE_GROUP_ID to file signups into a group.
//
// PRIVACY: the email goes to MailerLite and nowhere else. No logging of the
// address itself beyond MailerLite; errors log status codes, not people.

const API = "https://connect.mailerlite.com/api/subscribers";

// Naive in-memory throttle. Serverless instances are short-lived and not shared,
// so this only blunts trivial hammering from a single warm instance — it is a
// speed bump, not a security control. MailerLite does the real de-duping.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function throttled(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, start: now };
  if (now - rec.start > WINDOW_MS) { rec.n = 0; rec.start = now; }
  rec.n += 1;
  hits.set(ip, rec);
  if (hits.size > 500) { // keep the map from growing unbounded on a warm instance
    for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
  }
  return rec.n > MAX_PER_WINDOW;
}

// Deliberately permissive: real-world addresses are stranger than most regexes
// allow. MailerLite validates properly on its side; this only rejects obvious junk.
const looksLikeEmail = (s) =>
  typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(s.trim());

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }

  const key = process.env.MAILERLITE_API_KEY;
  if (!key) { res.status(503).json({ error: "not configured" }); return; }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (throttled(ip)) { res.status(429).json({ error: "slow down" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const email = String(body?.email || "").trim().toLowerCase();
  const source = String(body?.source || "site").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);

  if (!looksLikeEmail(email)) { res.status(400).json({ error: "invalid email" }); return; }

  const payload = {
    email,
    fields: { source },              // which page converted them — useful for the retention KPI
    status: "active",                // explicit: API double opt-in is OFF, so this sticks
    subscribed_at: new Date().toISOString().slice(0, 19).replace("T", " "),
  };
  if (process.env.MAILERLITE_GROUP_ID) payload.groups = [process.env.MAILERLITE_GROUP_ID];

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    // 200 = updated an existing subscriber, 201 = created. Both are success from
    // the visitor's point of view — re-subscribing should never look like an error.
    if (r.ok) { res.status(200).json({ ok: true }); return; }

    // 422 usually means MailerLite rejected the address shape. Tell the visitor
    // it was the address, not our server, so they can fix a typo.
    if (r.status === 422) { res.status(400).json({ error: "invalid email" }); return; }

    console.error("mailerlite subscribe failed", r.status);
    res.status(502).json({ error: "upstream" });
  } catch (e) {
    console.error("mailerlite subscribe threw", e?.message || e);
    res.status(502).json({ error: "upstream" });
  }
}
