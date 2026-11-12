// EPN click-time tagging (Nov 12 2026, Mo attended: "ok do it").
//
// Why: Nov 5-12 the EPN account logged 480 clicks and 0 sales, 80%+ on customid=auctions / customid=deals. GA4 showed
// 0-1 human landings on those pages. Something harvests finished affiliate links (from the public feed files and from
// rendered pages) and loads them; EPN counts each load as a click, and EPN prohibits artificially generated clicks.
//
// Fix: a listing link leaves the server WITHOUT the tracking half of the EPN tag. It keeps customid (attribution, and
// the page-side customid swaps keep working) but carries no mkevt / mkcid / mkrid / campid / toolid, so loading it is
// an ordinary eBay visit, not an EPN click. The page adds the tracking half back in the browser on a real pointer or
// keyboard interaction (the "EPN late tag" block in js/home-v2.js, js/home.js, js/sector-auctions.js, js/deal-row.js,
// auctions.html and deals.html). The rebuilt link has the same parameters eBay's itemAffiliateWebUrl had.
//
// Applies to the dynamic listing rows only (/api/auctions, /api/deals and their feed files). Static search links in
// page HTML are unchanged and stay under the audit gates.

const TRACKING = new Set(["mkevt", "mkcid", "mkrid", "campid", "toolid"]);
export const EPN_LATE_TAG = "mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=5339155990&toolid=10049";

export function lateUrl(url, customId) {
  if (!url || typeof url !== "string" || !/^https:\/\/(www\.)?ebay\.[a-z.]+\//i.test(url)) return url;
  const h = url.indexOf("#"), frag = h > -1 ? url.slice(h) : "", base = h > -1 ? url.slice(0, h) : url;
  const q = base.indexOf("?"), path = q > -1 ? base.slice(0, q) : base;
  const params = (q > -1 ? base.slice(q + 1) : "").split("&").filter((p) => p && !TRACKING.has(p.split("=")[0]));
  if (customId && !params.some((p) => p.split("=")[0] === "customid")) params.push("customid=" + encodeURIComponent(customId));
  return path + (params.length ? "?" + params.join("&") : "") + frag;
}

// "tagged" for a late-tag link = it carries the customid the browser block needs to finish the tag.
export const lateTagged = (rows) => (rows || []).some((r) => r && r.url && r.url.includes("customid="));
