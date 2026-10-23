// Vercel Serverless Function — the Deals feed: Buy It Now listings below the mark (Oct 23 2026).
//
//   GET /api/deals              → every live deal row the screener found (tools/price-engine/deals.mjs)
//   GET /api/deals?tk=BS99      → one index's constituents only (index-page rail)
//   GET /api/deals?card=<id>    → one card
//   GET /api/deals?grade=raw|psa9|psa10|sealed
//
// The screener runs 3x/day in GitHub Actions (deals.yml) and writes data/deals-latest.json to the private
// `price-data` branch — the same place the nightly engine keeps its store. This function reads that file through
// api/_lib/store.js (GITHUB_TOKEN, already in the Vercel env for the cron) and serves it with a CDN cache, so the
// site never deploys for a deals refresh and no eBay call happens on a visitor's request. Rows whose listing has
// ended (`ends` in the past) are dropped here. Every URL already carries the EPN tag with customid=deals.
//
// Basis, printed in the response: mark = our dated SOLD comp for the exact card and grade; the listing is a live
// eBay ask. Never blended. R17 guard applies (our pages and our tools only).

import { guard } from "./_lib/guard.js";
import { readJson } from "./_lib/store.js";

const PATH = "data/deals-latest.json";
const TTL_MS = 5 * 60_000;
let memo = { t: 0, data: null };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!guard(req, res)) return;
  const tk = String(req.query.tk || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const card = String(req.query.card || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const grade = ["raw", "psa9", "psa10", "sealed"].includes(req.query.grade) ? req.query.grade : "";
  try {
    let feed = memo.data;
    if (!feed || Date.now() - memo.t > TTL_MS) {
      const { data } = await readJson(PATH);
      if (!data) {
        res.setHeader("Cache-Control", "s-maxage=120");
        return res.status(200).json({ generated: null, day: null, count: 0, rows: [], note: "No deals feed yet — the screener has not run." });
      }
      feed = data; memo = { t: Date.now(), data };
    }
    const now = Date.now();
    let rows = (feed.rows || []).filter((r) => !r.ends || new Date(r.ends).getTime() > now);
    if (tk) rows = rows.filter((r) => r.tk === tk);
    if (card) rows = rows.filter((r) => r.cardId === card);
    if (grade) rows = rows.filter((r) => r.grade === grade);
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    return res.status(200).json({
      generated: feed.generated || null,
      day: feed.day || null,
      basis: "mark = our dated SOLD comp for the exact card and grade (PriceCharting / SportsCardsPro ungraded, or the graded ladder's 30-day PSA median); the listing is a live eBay ask. Never blended.",
      rules: feed.rules || null,
      counts: feed.counts || null,
      customId: "deals",
      affiliateTagged: rows.some((r) => r.url && r.url.includes("mkevt=")),
      count: rows.length,
      rows,
    });
  } catch (err) {
    return res.status(502).json({ error: "Deals feed failed.", detail: String(err.message || err).slice(0, 300) });
  }
}
