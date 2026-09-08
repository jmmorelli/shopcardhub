// Vercel Serverless Function — the Auction Desk feed (Sep 8 2026).
//
//   GET /api/auctions            → every VERIFIED live eBay auction for every card
//                                  the engine tracks (data/watchlist.json), with the
//                                  card's nightly mark and recent hammers beside it.
//   GET /api/auctions?card=<id>  → one card only.
//
// Why it exists: the engine already knows what each tracked card is worth on the
// ask side (prices-latest.json `last`) and what buyers actually paid at auction
// (market-latest.json hammers). An auction whose current bid sits under both is
// the one thing on eBay a visitor can act on today. The /auctions page renders
// this feed; every itemWebUrl carries the EPN tag with customid=auctions so the
// commission is attributed to the page that earned it.
//
// Same exact-card filter as the nightly mark (tools/price-engine verifyListings,
// AUCTION mode) — a parallel, a slab, a lot, or a different card code is rejected,
// never shown. "Under the mark" is only ever claimed against the engine's own
// verified ask floor, labeled ask-basis, dated. Hammers are shown as a second,
// sold-side reference when we have watched ≥2 closes. Nothing is blended.
//
// Quota: one Browse call per tracked card per cache miss (~20). CDN cache below
// (15 min + SWR) keeps that at ≤ ~2k calls/day worst case against the 5k limit.
//
// Row shape: { id, label, slug, cardType, title, bid, shipping, total, bidCount,
//              endDate, url, image, seller, mark, markAsOf, askQ1, hammerMedian,
//              closes, vsMark, vsHammer }
//   vsMark / vsHammer = (total / reference) - 1, negative = under.

import { getAppToken } from "./_lib/ebay-token.js";

const BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EPN_CAMPAIGN_ID = "5339155990";
const CUSTOM_ID = "auctions";
const TRADING_CARDS_CATEGORY = "212";
const SITE_ORIGIN = (process.env.SITE_URL || "https://www.shopcardhub.com").replace(/\/$/, "");
const FEED_BASE = "https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data";

function trimListing(item) {
  return {
    title: item.title,
    price: item.price ? Number(item.price.value) : null,
    shipping:
      item.shippingOptions && item.shippingOptions[0] && item.shippingOptions[0].shippingCost
        ? Number(item.shippingOptions[0].shippingCost.value)
        : null,
    condition: item.condition || null,
    buyingOption: (item.buyingOptions || [])[0] || null,
    bid: item.currentBidPrice ? Number(item.currentBidPrice.value) : null,
    bidCount: Number.isFinite(item.bidCount) ? item.bidCount : null,
    endDate: item.itemEndDate || null,
    url: item.itemAffiliateWebUrl || item.itemWebUrl,
    image: item.image ? item.image.imageUrl : null,
    seller: item.seller ? { username: item.seller.username, feedbackPct: item.seller.feedbackPercentage, feedbackScore: item.seller.feedbackScore } : null,
    itemId: item.itemId,
  };
}

async function getJSON(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

async function searchAuctions(token, card) {
  const params = new URLSearchParams({
    q: card.query,
    limit: "100",
    category_ids: card.categoryIds || TRADING_CARDS_CATEGORY,
    filter: "buyingOptions:{AUCTION},itemLocationCountry:US",
    sort: "endingSoonest",
  });
  const r = await fetch(`${BROWSE_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${EPN_CAMPAIGN_ID},affiliateReferenceId=${CUSTOM_ID}`,
      Accept: "application/json",
    },
  });
  if (!r.ok) throw new Error(`eBay ${r.status}`);
  const data = await r.json();
  return (data.itemSummaries || []).map(trimListing);
}

const round2 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 100) / 100);
const pct = (total, ref) => (ref && ref > 0 && isFinite(total) ? round2(total / ref - 1) : null);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const only = String(req.query.card || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);

  try {
    const [wl, latest, market, token, eng] = await Promise.all([
      getJSON(`${SITE_ORIGIN}/data/watchlist.json`),
      getJSON(`${FEED_BASE}/prices-latest.json?t=${Math.floor(Date.now() / 600000)}`).catch(() => null),
      getJSON(`${FEED_BASE}/market-latest.json?t=${Math.floor(Date.now() / 600000)}`).catch(() => null),
      getAppToken(),
      import("../tools/price-engine/snapshot-free.mjs"),
    ]);

    let cards = ((wl && wl.cards) || []).filter((c) => c && c.source === "ebay" && c.id && c.query);
    if (only) cards = cards.filter((c) => c.id === only);
    if (!cards.length) return res.status(404).json({ error: only ? `Unknown card id "${only}".` : "No tracked cards." });

    const latestBy = new Map(((latest && latest.cards) || []).map((c) => [c.key, c]));
    const marketBy = (market && market.cards) || {};

    const perCard = await Promise.all(cards.map(async (card) => {
      const key = `ebay:${card.id}`;
      const L = latestBy.get(key) || null;
      const M = marketBy[key] || null;
      const mark = L && Number.isFinite(L.last) ? L.last : null;
      const hammerMedian = M && M.closes >= 2 && Number.isFinite(M.hammerMedian) ? M.hammerMedian : null;
      let listings = [];
      let error = null;
      try { listings = await searchAuctions(token, card); } catch (e) { error = String(e.message || e).slice(0, 120); }
      const { verified, rejected } = eng.verifyListings(listings, card, card.label, { mode: "AUCTION" });
      const rows = verified.map((l) => ({
        id: card.id,
        label: card.label,
        slug: card.slug || null,
        cardType: card.cardType || "chrome-auto",
        title: l.title,
        bid: l.bid,
        shipping: l.shipping,
        total: round2(l.total),
        bidCount: l.bidCount,
        endDate: l.endDate,
        url: l.url,
        image: l.image,
        seller: l.seller,
        mark,
        markAsOf: (latest && latest.day) || null,
        askQ1: L && Number.isFinite(L.askQ1) ? L.askQ1 : null,
        hammerMedian,
        closes: M ? M.closes || 0 : 0,
        vsMark: pct(l.total, mark),
        vsHammer: pct(l.total, hammerMedian),
      }));
      return { id: card.id, label: card.label, mark, hammerMedian, scanned: listings.length, verified: rows.length, rejected: rejected.length, error, rows };
    }));

    const rows = perCard.flatMap((c) => c.rows).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      generated: new Date().toISOString(),
      basis: "mark = engine verified ask floor (ask basis), hammerMedian = median of watched auction closes (sold side); never blended",
      markDay: (latest && latest.day) || null,
      customId: CUSTOM_ID,
      affiliateTagged: rows.some((r) => r.url && r.url.includes("mkevt=")),
      cards: perCard.map(({ rows: _r, ...c }) => c),
      count: rows.length,
      underMark: rows.filter((r) => r.vsMark != null && r.vsMark < 0).length,
      rows,
    });
  } catch (err) {
    return res.status(502).json({ error: "Auction feed failed.", detail: String(err.message || err).slice(0, 300) });
  }
}
