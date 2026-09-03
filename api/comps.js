// Vercel Serverless Function — live eBay comps via the Buy/Browse API.
//
// Public endpoint (no proxy key): it serves only public listing data, and the
// app token never leaves the server. Quota (5,000 calls/day) is protected by
// CDN caching — identical queries within the cache window never hit eBay.
//
//   GET /api/comps?q=2025+bowman+chrome+cooper+flagg+psa+10
//   GET /api/comps?q=...&limit=25&sort=price          (cheapest first)
//   GET /api/comps?q=...&sort=-price                  (highest first)
//   GET /api/comps?q=...&raw=1                        (include full eBay payload)
//
// Response: { query, count, stats: {min,q1,median,q3,max,mean,stdev,skew,kurtosis},
//             listings: [{title, price, shipping, condition, url, image, seller}] }
//
// Every itemWebUrl carries the EPN affiliate tag via X-EBAY-C-ENDUSERCTX,
// so comp traffic that clicks through is monetized (Campaign 9356).
//
// Required Vercel env vars: EBAY_CLIENT_ID, EBAY_CERT_ID (see api/_lib/ebay-token.js)

import { getAppToken } from "./_lib/ebay-token.js";

const BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
// 10-digit eBay Partner Network campaign ID (the "campid" in EPN links).
// NOT the Impact program ID (9356) — that's a different system.
const EPN_CAMPAIGN_ID = "5339155990";
const TRADING_CARDS_CATEGORY = "212"; // Sports Mem, Cards & Fan Shop > Sports Trading Cards root

// ---- Stats helpers (population moments) ----
function quantile(sorted, p) {
  if (!sorted.length) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeStats(prices) {
  const n = prices.length;
  if (!n) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mean = prices.reduce((s, x) => s + x, 0) / n;
  const m2 = prices.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(m2);
  let skew = null;
  let kurtosis = null;
  if (stdev > 0 && n > 2) {
    const m3 = prices.reduce((s, x) => s + (x - mean) ** 3, 0) / n;
    const m4 = prices.reduce((s, x) => s + (x - mean) ** 4, 0) / n;
    skew = m3 / stdev ** 3;
    kurtosis = m4 / stdev ** 4 - 3; // excess kurtosis (normal = 0)
  }
  const round = (x) => (x == null ? null : Math.round(x * 100) / 100);
  return {
    n,
    min: round(sorted[0]),
    q1: round(quantile(sorted, 0.25)),
    median: round(quantile(sorted, 0.5)),
    q3: round(quantile(sorted, 0.75)),
    max: round(sorted[n - 1]),
    mean: round(mean),
    stdev: round(stdev),
    skew: round(skew),
    kurtosis: round(kurtosis),
  };
}

function trimListing(item) {
  return {
    title: item.title,
    price: item.price ? Number(item.price.value) : null,
    currency: item.price ? item.price.currency : null,
    shipping:
      item.shippingOptions && item.shippingOptions[0] && item.shippingOptions[0].shippingCost
        ? Number(item.shippingOptions[0].shippingCost.value)
        : null,
    condition: item.condition || null,
    buyingOption: (item.buyingOptions || [])[0] || null,
    // AUCTION fields (added Sep 3 2026). An auction has no `price` — the live
    // number is `currentBidPrice`, and a bid is the one thing on this endpoint
    // that is an actual buyer paying an actual amount. `endDate` lets the price
    // engine tell "still climbing" from "this is the hammer".
    bid: item.currentBidPrice ? Number(item.currentBidPrice.value) : null,
    bidCount: Number.isFinite(item.bidCount) ? item.bidCount : null,
    endDate: item.itemEndDate || null,
    // itemAffiliateWebUrl is only returned when the ENDUSERCTX affiliate header
    // is valid — it carries the EPN campid. itemWebUrl is the untagged fallback.
    url: item.itemAffiliateWebUrl || item.itemWebUrl,
    image: item.image ? item.image.imageUrl : null,
    seller: item.seller
      ? { username: item.seller.username, feedbackPct: item.seller.feedbackPercentage, feedbackScore: item.seller.feedbackScore }
      : null,
    itemId: item.itemId,
  };
}

// EPN custom IDs must be short and URL-safe. Anything else is dropped rather than
// guessed at — an unattributed click is recoverable, a wrongly attributed one is not.
function sanitizeCustomId(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return null;
  // Note: stripping everything outside [a-z0-9._-] also removes "," and CR/LF,
  // which is what keeps this safe to interpolate into the ENDUSERCTX header.
  const clean = s
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[-.]+|[-.]+$/g, "");
  return clean ? clean.slice(0, 64) : null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const q = String(req.query.q || "").trim().slice(0, 200);
  if (!q) {
    return res.status(400).json({ error: "Missing ?q= search query." });
  }

  // Clamp inputs so callers can't burn quota with giant pages.
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const sortParam = req.query.sort === "price" ? "price" : req.query.sort === "-price" ? "-price" : null;

  // EPN custom ID (added Aug 25, 2026). Until now these links went out with a
  // campaign ID but no custom ID, so every sale they drove landed in EPN's
  // "No Custom ID" bucket — which was 96% of all earnings ($6.06 of $6.31 in the
  // Jul 26–Aug 25 read) with no way to tell which page earned it.
  //
  // It is a QUERY PARAM on purpose, not a Referer sniff: this response is CDN-cached
  // (s-maxage below), and a header-derived value would not be part of the cache key,
  // so one page's cached response could hand its custom ID to another page's visitors.
  // As a query param it varies the cache key and stays correctly attributed.
  const customId = sanitizeCustomId(req.query.customid);

  try {
    const token = await getAppToken();

    const params = new URLSearchParams({
      q,
      limit: String(limit),
      category_ids: req.query.category_ids || TRADING_CARDS_CATEGORY,
      filter: "buyingOptions:{FIXED_PRICE|AUCTION},itemLocationCountry:US",
    });
    if (sortParam) params.set("sort", sortParam);

    const r = await fetch(`${BROWSE_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        // Affiliate context: tags every itemWebUrl in the response with EPN tracking.
        // affiliateReferenceId is what surfaces as "Custom ID" in EPN reporting.
        "X-EBAY-C-ENDUSERCTX": customId
          ? `affiliateCampaignId=${EPN_CAMPAIGN_ID},affiliateReferenceId=${customId}`
          : `affiliateCampaignId=${EPN_CAMPAIGN_ID}`,
        Accept: "application/json",
      },
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(502).json({ error: `eBay Browse API error (${r.status}).`, detail: detail.slice(0, 500) });
    }

    const data = await r.json();
    const items = data.itemSummaries || [];
    const listings = items.map(trimListing);
    const prices = listings.map((l) => l.price).filter((p) => typeof p === "number" && isFinite(p));

    // CDN cache: identical queries served from edge for 15 min, stale allowed
    // for 1 hour while revalidating. This is the quota shield.
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const payload = {
      query: q,
      // Echoed so a caller (or an audit) can confirm the click will be attributed.
      // null here means the sale will land in EPN's "No Custom ID" bucket.
      customId,
      affiliateTagged: listings.some((l) => l.url && l.url.includes("mkevt=")),
      total: data.total || 0,
      count: listings.length,
      stats: computeStats(prices),
      listings,
    };
    if (req.query.raw === "1") payload.raw = data;

    return res.status(200).json(payload);
  } catch (err) {
    return res.status(502).json({ error: "Comps lookup failed.", detail: String(err.message || err) });
  }
}
