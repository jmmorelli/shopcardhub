// The one eBay Browse budget (Oct 23 2026, Mo attended: the homepage auctions tile was empty — 105 of 105 cards "eBay 429").
//
// Every eBay call the site makes — /api/comps (page views, the nightly engine, the deals screener), /api/auctions
// (the Auction Desk, the home tile, the Bid buttons on 40 index pages) — spends ONE application quota: 5,000 Browse
// calls a day on Mo's keyset. When it is gone eBay answers 429 errorId 2001 "The request limit has been reached for the
// resource" to everything until the window resets, and the site goes dark on every live surface at once.
//
// Oct 23 numbers: /api/auctions fans out one Browse call per card (40 engine cards + 65 desk cards = 105) on every CDN
// miss, cached 30 min PER EDGE REGION — up to 48 x 105 = 5,040 a day from one region alone, the whole quota, before the
// deals screener (361 calls x 3 runs) or the nightly (~60) spend anything. The quota ran out on Oct 21 (before deals
// existed) and again Oct 23 (~22:15Z); every lane found out by reading 429s.
//
// Read at 00:19Z Oct 24 from eBay's rate_limit API: limit 5,000, count 6,070, remaining 0, reset 2026-10-24T07:00Z —
// the window is a day ending at 07:00Z (midnight Pacific), NOT midnight UTC. Schedules that must run on a fresh quota
// (the nightly at 08:15Z, deals at 09:40Z, the first auctions snapshot at 07:20Z) sit just after that.
//
// The fix is one ledger, read from eBay itself: the Developer Analytics API (getRateLimits) reports the Browse resource's
// limit / remaining / reset for the keyset — the same number from a Vercel function in any region and from a GitHub
// runner, with no file to share. Each lane has a FLOOR: it may spend only while `remaining` is above its floor, so the
// last calls of the day are always kept for the surfaces listed below it. Order of precedence (highest floor stops first):
//
//   lane            floor   who
//   deals           2,600   tools/price-engine/deals.mjs via /api/comps?customid=deals (2 runs/day, <=300 calls each)
//   tool            1,600   any other scripted caller (X-ShopCardHub-Client header) except the nightly
//   auctions        1,000   /api/auctions live fan-out (105 calls a refresh; below the floor it serves the snapshot feed)
//   price-engine        0   the nightly marks (snapshot-free.mjs) — never blocked, it is the product
//   page (browser)      0   a visitor's /api/comps call — never blocked; the 1,000 under the auctions floor is its reserve
//
// Fail-open: if the rate-limit read itself fails, `allow()` says yes with reason "quota unknown" and the caller relies on
// its own 429 handling (abort the fan-out, breaker in deals.mjs). The read is memoised 60 s per warm instance.
//
// /api/ebay-quota exposes the same read to our tools (R17 guard) so a run can check before it spends.

import { getAppToken } from "./ebay-token.js";

const RATE_URL = "https://api.ebay.com/developer/analytics/v1_beta/rate_limit/?api_context=buy&api_name=browse";
export const DAILY_LIMIT = 5000;   // eBay's default per-application Browse limit; the live number comes from eBay
export const FLOORS = { deals: 2600, tool: 1600, auctions: 1000, "price-engine": 0, page: 0 };
const MEMO_MS = 60_000;

let memo = { t: 0, quota: null, error: null };

function pickBrowse(json) {
  // { rateLimits:[{ apiContext, apiName, resources:[{ name, rates:[{ limit, remaining, reset, count, timeWindow }] }] }] }
  const out = [];
  for (const api of (json && json.rateLimits) || []) {
    for (const res of api.resources || []) {
      for (const r of res.rates || []) out.push({ api: api.apiName, resource: res.name, ...r });
    }
  }
  if (!out.length) return null;
  // the daily (86,400 s) window of the Browse resource; else the largest limit reported
  const daily = out.filter((r) => /browse/i.test(r.resource || r.api || "") && Number(r.timeWindow) >= 86000);
  const pool = daily.length ? daily : out;
  pool.sort((a, b) => Number(b.limit) - Number(a.limit));
  const r = pool[0];
  return { resource: r.resource, limit: Number(r.limit), remaining: Number(r.remaining), count: Number(r.count), reset: r.reset || null, timeWindow: Number(r.timeWindow) || null };
}

/** The keyset's Browse quota as eBay reports it, memoised 60 s. Returns null when the read fails (error kept on .error). */
export async function browseQuota({ maxAgeMs = MEMO_MS } = {}) {
  const now = Date.now();
  if (now - memo.t < maxAgeMs && (memo.quota || memo.error)) return memo.quota;
  try {
    const token = await getAppToken();
    const r = await fetch(RATE_URL, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (!r.ok) throw new Error(`rate_limit -> HTTP ${r.status}`);
    const q = pickBrowse(await r.json());
    if (!q) throw new Error("rate_limit: no Browse resource in the answer");
    memo = { t: now, quota: { ...q, fetchedAt: new Date(now).toISOString() }, error: null };
  } catch (e) {
    memo = { t: now, quota: null, error: String(e && e.message || e).slice(0, 200) };
  }
  return memo.quota;
}

export function lastQuotaError() { return memo.error; }
export function resetQuotaMemo() { memo = { t: 0, quota: null, error: null }; }   // tests

/**
 * May `lane` spend `need` Browse calls now?
 * -> { ok, lane, need, floor, remaining, limit, reset, reason, quota }
 */
export async function allow(lane, need = 1) {
  const floor = Object.prototype.hasOwnProperty.call(FLOORS, lane) ? FLOORS[lane] : FLOORS.tool;
  const quota = await browseQuota();
  if (!quota) return { ok: true, lane, need, floor, remaining: null, limit: null, reset: null, reason: "quota unknown (" + (memo.error || "no read") + ") - proceeding, caller handles 429", quota: null };
  const ok = quota.remaining - need >= floor;
  return {
    ok, lane, need, floor,
    remaining: quota.remaining, limit: quota.limit, reset: quota.reset,
    reason: ok ? `${quota.remaining} remaining of ${quota.limit}; floor ${floor}` : `budget: ${quota.remaining} remaining of ${quota.limit}, lane "${lane}" stops at ${floor} (resets ${quota.reset || "at eBay's window end"})`,
    quota,
  };
}
