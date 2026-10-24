// Vercel Serverless Function — the Deals feed: Buy It Now listings below the mark (Oct 23 2026).
//
//   GET /api/deals              → every live deal row the screener found (tools/price-engine/deals.mjs)
//   GET /api/deals?tk=BS99      → one index's constituents only (index-page rail)
//   GET /api/deals?card=<id>    → one card
//   GET /api/deals?grade=raw|psa9|psa10|sealed
//
// The screener runs 2x/day in GitHub Actions (deals.yml; 3x until Oct 23 — the eBay budget, api/_lib/ebay-budget.js) and publishes data/feed/deals-latest.json onto main, the
// same way the nightly engine publishes its feed (served at /feed/<file>, R19). This function reads it from our own
// origin (api/_lib/feed.js) and serves it with a CDN cache — no eBay call happens on a visitor's request. (First cut
// read the private price-data branch through store.js; the Vercel GITHUB_TOKEN answered 401 on Oct 23, so the feed
// moved to the public-feed path, which needs no secret.) Rows whose listing has ended (`ends` in the past) are
// dropped here. Every URL already carries the EPN tag with customid=deals.
//
// Basis, printed in the response: mark = our dated SOLD comp for the exact card and grade; the listing is a live
// eBay ask. Never blended. R17 guard applies (our pages and our tools only).

import { guard } from "./_lib/guard.js";
import { readFeedJson } from "./_lib/feed.js";

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
    const feed = await readFeedJson("deals-latest.json").catch(() => null);
    if (!feed) {
      res.setHeader("Cache-Control", "s-maxage=120");
      return res.status(200).json({ generated: null, day: null, count: 0, rows: [], note: "No deals feed yet — the screener has not run." });
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
