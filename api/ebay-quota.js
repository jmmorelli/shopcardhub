// Vercel Serverless Function — the eBay Browse budget, read from eBay (Oct 23 2026).
//
//   GET /api/ebay-quota                 -> { generated, browse:{limit,remaining,count,reset}, floors, lanes:{deals:{ok,..}, ...} }
//   GET /api/ebay-quota?lane=deals&need=300
//
// Same R17 guard as /api/comps (our pages and our tools only; tools send X-ShopCardHub-Client). The numbers come from
// the Developer Analytics API (api/_lib/ebay-budget.js) — one keyset, one count, whichever region or runner asks.
// A tool checks here before it spends (deals.mjs every 25 calls); the Ops heartbeat can read the day's burn.
// Never cached at the edge: a stale "4,000 remaining" is worse than a 150 ms read.

import { guard } from "./_lib/guard.js";
import { browseQuota, allow, FLOORS, DAILY_LIMIT, lastQuotaError } from "./_lib/ebay-budget.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "Method not allowed." }); }
  if (!guard(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  const lane = String(req.query.lane || "").trim().slice(0, 32);
  const need = Math.min(Math.max(parseInt(req.query.need, 10) || 1, 1), DAILY_LIMIT);
  const quota = await browseQuota({ maxAgeMs: 15_000 });
  const lanes = {};
  for (const l of Object.keys(FLOORS)) { const a = await allow(l, l === "auctions" ? 105 : 1); lanes[l] = { ok: a.ok, floor: a.floor }; }
  const asked = lane ? await allow(lane, need) : null;
  return res.status(200).json({
    generated: new Date().toISOString(),
    browse: quota ? { limit: quota.limit, remaining: quota.remaining, count: quota.count, reset: quota.reset, timeWindow: quota.timeWindow, resource: quota.resource, fetchedAt: quota.fetchedAt } : null,
    error: quota ? null : lastQuotaError(),
    floors: FLOORS,
    lanes,
    asked: asked ? { lane: asked.lane, need: asked.need, ok: asked.ok, floor: asked.floor, reason: asked.reason } : null,
  });
}
