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
// Quota (rewritten Oct 23 2026 — the tile went dark: 105 of 105 cards "eBay 429"): one Browse call per card per CDN
// miss, and the CDN caches PER EDGE REGION, so 105 cards x 48 misses a day was the whole 5k keyset quota from one region.
// Now (api/_lib/ebay-budget.js, the one ledger read from eBay's own rate_limit API):
//   1. a fresh snapshot wins — data/feed/auctions-latest.json (tools/price-engine/auctions-feed.mjs, every 3 h) is served
//      when it is < SNAPSHOT_FRESH_MIN old, filtered to auctions still live: zero Browse calls, same answer in every region;
//   2. else the live fan-out runs only while the keyset has > 1,000 calls left (the auctions floor; the last 1,000 are the
//      visitors' /api/comps reserve), paced CONCURRENCY at a time and ABORTED on the first 429 instead of 105 calls into
//      the wall; a good answer caches 45 min + SWR;
//   3. else the snapshot of any age, filtered to still-live rows, labeled source:"snapshot" and cached 5 min;
//   4. else an honest empty payload (quota in the body), cached 5 min so the tile recovers when the window resets.
// ?fresh=1 (tools only) skips step 1 — the feed builder uses it so the snapshot is never a copy of itself.
//
// Row shape: { id, label, slug, cardType, title, bid, shipping, total, bidCount,
//              endDate, url, image, seller, mark, markAsOf, askQ1, hammerMedian,
//              closes, vsMark, vsHammer }
//   vsMark / vsHammer = (total / reference) - 1, negative = under.

import { guard } from "./_lib/guard.js";
import { readFeedJson } from "./_lib/feed.js";
import { getAppToken } from "./_lib/ebay-token.js";
import { allow } from "./_lib/ebay-budget.js";
import { TOOL_HEADER } from "./_lib/guard.js";

const BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EPN_CAMPAIGN_ID = "5339155990";
const CUSTOM_ID = "auctions";
const TRADING_CARDS_CATEGORY = "212";
const SITE_ORIGIN = (process.env.SITE_URL || "https://www.shopcardhub.com").replace(/\/$/, "");
const CONCURRENCY = 12;            // Browse calls in flight at once (was: all 105 at once)
const SNAPSHOT_FRESH_MIN = 200;    // a snapshot younger than this is the answer; the feed builder (auctions.yml) runs every 3 h
const CACHE_GOOD = "s-maxage=2700, stale-while-revalidate=1800";   // 45 min: one live refresh per region per 45 min at most
const CACHE_SHORT = "s-maxage=300, stale-while-revalidate=300";    // snapshot / empty answers: recover fast
// the nightly feed is read server-side through api/_lib/feed.js (private-repo safe, 2026-09-22)

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

async function mapLimit(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

const liveRows = (rows, now) => (rows || []).filter((r) => r && r.endDate && new Date(r.endDate).getTime() > now);

// The committed snapshot carries no listing titles or seller names (R17: no raw eBay content in a public file); the
// page prints the card's own label in the title slot when it serves one.
function snapshotPayload(snap, quota, now, note) {
  const rows = liveRows(snap.rows, now).map((r) => ({ ...r, title: r.title || r.label, seller: r.seller ? { username: r.seller.username || null, feedbackPct: r.seller.feedbackPct ?? null, feedbackScore: r.seller.feedbackScore ?? null } : null }));
  return {
    generated: snap.generated, source: "snapshot", servedAt: new Date(now).toISOString(),
    basis: snap.basis, markDay: snap.markDay || null, customId: CUSTOM_ID,
    affiliateTagged: rows.some((r) => r.url && r.url.includes("mkevt=")),
    cards: snap.cards || [], count: rows.length, underMark: rows.filter((r) => r.vsMark != null && r.vsMark < 0).length,
    quota: quota ? { remaining: quota.remaining, limit: quota.limit, reset: quota.reset } : null, note, rows,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!guard(req, res)) return;
  const only = String(req.query.card || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const isTool = !!(req.headers || {})[TOOL_HEADER];
  const wantFresh = isTool && String(req.query.fresh || "") === "1";
  const now = Date.now();

  try {
    const [wl, desk, latest, market, eng, snap] = await Promise.all([
      getJSON(`${SITE_ORIGIN}/data/watchlist.json`),
      getJSON(`${SITE_ORIGIN}/data/auction-desk.json`).catch(() => null),   // desk-only cards (Sep 25 2026): searched here, never marked
      readFeedJson("prices-latest.json").catch(() => null),
      readFeedJson("market-latest.json").catch(() => null),
      import("../tools/price-engine/snapshot-free.mjs"),
      readFeedJson("auctions-latest.json").catch(() => null),
    ]);

    let cards = ((wl && wl.cards) || []).filter((c) => c && c.source === "ebay" && c.id && c.query)
      .concat(((desk && desk.cards) || []).filter((c) => c && c.id && c.query).map((c) => ({ ...c, source: "ebay", deskOnly: true })));
    if (only) cards = cards.filter((c) => c.id === only);
    if (!cards.length) return res.status(404).json({ error: only ? `Unknown card id "${only}".` : "No tracked cards." });

    const snapAge = snap && snap.generated ? (now - new Date(snap.generated).getTime()) / 60000 : Infinity;
    const snapUsable = snap && Array.isArray(snap.rows) && (!only || snap.rows.some((r) => r.id === only));

    // 1. fresh snapshot: no Browse calls at all
    if (!wantFresh && snapUsable && snapAge < SNAPSHOT_FRESH_MIN) {
      const p = snapshotPayload(snap, null, now, `snapshot ${Math.round(snapAge)} min old; live refresh when it passes ${SNAPSHOT_FRESH_MIN} min`);
      if (only) { p.rows = p.rows.filter((r) => r.id === only); p.count = p.rows.length; p.cards = (p.cards || []).filter((c) => c.id === only); }
      res.setHeader("Cache-Control", CACHE_SHORT);
      return res.status(200).json(p);
    }

    // 2. live fan-out, budget permitting
    const budget = await allow("auctions", cards.length);
    if (!budget.ok) {
      res.setHeader("Cache-Control", CACHE_SHORT);
      if (snapUsable) {
        const p = snapshotPayload(snap, budget.quota, now, budget.reason);
        if (only) { p.rows = p.rows.filter((r) => r.id === only); p.count = p.rows.length; }
        return res.status(200).json(p);
      }
      return res.status(200).json({
        generated: new Date(now).toISOString(), source: "empty", markDay: (latest && latest.day) || null, customId: CUSTOM_ID,
        affiliateTagged: false, cards: cards.map((c) => ({ id: c.id, label: c.label, error: "skipped: " + budget.reason })), count: 0, underMark: 0,
        quota: budget.quota ? { remaining: budget.remaining, limit: budget.limit, reset: budget.reset } : null, note: budget.reason, rows: [],
      });
    }

    const token = await getAppToken();
    const latestBy = new Map(((latest && latest.cards) || []).map((c) => [c.key, c]));
    const marketBy = (market && market.cards) || {};
    let tripped = null;   // first eBay 429/5xx aborts the rest of the fan-out: no more calls into the wall

    const perCard = await mapLimit(cards, CONCURRENCY, async (card) => {
      const key = `ebay:${card.id}`;
      const L = latestBy.get(key) || null;
      const M = marketBy[key] || null;
      const mark = L && Number.isFinite(L.last) ? L.last : null;
      const hammerMedian = M && M.closes >= 2 && Number.isFinite(M.hammerMedian) ? M.hammerMedian : null;
      let listings = [];
      let error = null;
      if (tripped) error = `skipped after ${tripped}`;
      else {
        try { listings = await searchAuctions(token, card); }
        catch (e) { error = String(e.message || e).slice(0, 120); if (/eBay (429|5\d\d)/.test(error)) tripped = error; }
      }
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
    });

    const rows = perCard.flatMap((c) => c.rows).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    const errored = perCard.filter((c) => c.error).length;

    // 3. the fan-out hit the wall and found nothing: serve the snapshot (any age) rather than an empty desk
    if (tripped && !rows.length && snapUsable && !wantFresh) {
      res.setHeader("Cache-Control", CACHE_SHORT);
      const p = snapshotPayload(snap, budget.quota, now, `live refresh failed (${tripped}); snapshot ${Math.round(snapAge)} min old`);
      if (only) { p.rows = p.rows.filter((r) => r.id === only); p.count = p.rows.length; }
      return res.status(200).json(p);
    }

    // 4. live answer. A tripped run is cached briefly so the tile recovers with the window, never pinned for 45 min.
    res.setHeader("Cache-Control", tripped || !rows.length ? CACHE_SHORT : CACHE_GOOD);
    return res.status(200).json({
      generated: new Date().toISOString(),
      source: "live",
      basis: "mark = engine verified ask floor (ask basis), hammerMedian = median of watched auction closes (sold side); never blended",
      markDay: (latest && latest.day) || null,
      customId: CUSTOM_ID,
      affiliateTagged: rows.some((r) => r.url && r.url.includes("mkevt=")),
      cards: perCard.map(({ rows: _r, ...c }) => c),
      count: rows.length,
      underMark: rows.filter((r) => r.vsMark != null && r.vsMark < 0).length,
      quota: budget.quota ? { remaining: budget.remaining, limit: budget.limit, reset: budget.reset } : null,
      errored, tripped: tripped || null,
      rows,
    });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Auction feed failed.", detail: String(err.message || err).slice(0, 300) });
  }
}
