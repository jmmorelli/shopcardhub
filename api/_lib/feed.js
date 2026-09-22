// The nightly price feed, read server-side (compliance Phase 1, 2026-09-22).
//
// The nightly GitHub Action (price-snapshot.yml) copies the three derived public files onto main under
// data/feed/, so they deploy with the site and are served at /feed/<file> (vercel.json rewrite to
// /data/feed/<file>). No token, no secret, and nothing breaks when the repo goes private.
// listings-history.json (raw-listing store) and ga4-*.json never leave the price-data branch.

export const PUBLIC_FEED = new Set(["prices-latest.json", "prices-history.json", "market-latest.json"]);

const SITE = (process.env.SITE_URL || "https://www.shopcardhub.com").replace(/\/$/, "");
const TTL_MS = 5 * 60_000;
const memo = new Map();

export async function readFeedJson(file) {
  if (!PUBLIC_FEED.has(file)) throw new Error(`feed ${file} is not public`);
  const hit = memo.get(file);
  if (hit && Date.now() - hit.t < TTL_MS) return hit.data;
  const r = await fetch(`${SITE}/data/feed/${file}`);
  if (!r.ok) throw new Error(`feed ${file} -> HTTP ${r.status}`);
  const data = await r.json();
  memo.set(file, { t: Date.now(), data });
  return data;
}
