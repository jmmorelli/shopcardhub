// GET /feed/<file>  (rewritten to /api/feed?f=<file> in vercel.json)
// Serves the derived nightly feed from our own origin. See api/_lib/feed.js.
import { PUBLIC_FEED, readFeedText } from "./_lib/feed.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const f = String(req.query.f || "").trim();
  if (!PUBLIC_FEED.has(f)) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(404).json({ error: "Not found." });
  }
  try {
    const { text, source } = await readFeedText(f);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    res.setHeader("X-Feed-Source", source);
    return res.status(200).send(text);
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Feed unavailable." });
  }
}
