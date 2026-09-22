// epn.mjs — the ONE place an eBay affiliate URL is built (Sep 22 2026).
//
// Why this file exists: every generator used to assemble the EPN param string by hand.
// That produced the Jul 28 mkevt=1 incident (a whole year of untracked clicks) and the
// Sep 22 fragment incident (254 links whose card number was a raw "#", so the browser
// cut the URL before every tracking param). Both were one missing character in a
// string literal. Build the URL here or the auditor's epn-fragment / epn-params checks
// will catch it, but only after it shipped.
//
// The mandatory param set is mkevt=1 · mkcid=1 · mkrid=711-53200-19255-0 · siteid=0
// · campid=5339155990 · toolid=10001 · customid=<slug>.  mkevt=1 is not optional:
// without it eBay ignores every other tracking param.

export const CAMPID = "5339155990";
export const SACAT_TCG = "183454";   // CCG/TCG singles (Pokemon)
export const SACAT_SPORTS = "212";   // sports trading cards

// eBay's search box wants "+" between words; encodeURIComponent gives %20.
// The apostrophe matters more than it looks: encodeURIComponent leaves "'" alone, and a raw
// apostrophe inside an href ends a single-quoted attribute AND truncates the auditor's link
// regex — "Team Rocket's Mewtwo ex" silently became an unverifiable link. Encode it.
const nkw = (q) => encodeURIComponent(String(q).replace(/\s+/g, " ").trim())
  .replace(/%20/g, "+").replace(/'/g, "%27").replace(/[!()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

/**
 * A tagged eBay SEARCH url.
 *   q         the search phrase, raw — "#", "/", "&" and friends are encoded here
 *   customid  the EPN custom ID this click should report under
 *   sacat     eBay category to scope the search to (optional)
 *   bin       Buy It Now only (default true)
 *   av        eBay's Authenticity Guarantee "Show only" filter (LH_AV=1) — $200+ singles
 *   sold      completed/sold comps instead of active listings
 */
export function ebaySearchUrl({ q, customid, sacat = null, bin = true, av = false, sold = false }) {
  if (!q || !customid) throw new Error("ebaySearchUrl: q and customid are required");
  const p = [`_nkw=${nkw(q)}`];
  if (sacat) p.push(`_sacat=${sacat}`);
  if (sold) p.push("LH_Sold=1", "LH_Complete=1");
  else if (bin) p.push("LH_BIN=1");
  if (av) p.push("LH_AV=1");
  p.push("mkcid=1", "mkrid=711-53200-19255-0", "siteid=0", "mkevt=1",
         `campid=${CAMPID}`, "toolid=10001", `customid=${customid}`);
  return `https://www.ebay.com/sch/i.html?${p.join("&")}`;
}

/** Point an existing affiliate/listing URL at a different custom ID. */
export function withCustomId(url, customid) {
  const u = String(url);
  return /[?&]customid=/.test(u)
    ? u.replace(/customid=[^&]*/, `customid=${customid}`)
    : u + (u.includes("?") ? "&" : "?") + `customid=${customid}`;
}

/** Fails the same way the auditor's check 1b does — use it in a generator's self-test. */
export function assertClean(url) {
  if (url.includes("#")) throw new Error(`raw "#" truncates this URL: ${url}`);
  for (const p of ["mkevt=1", "mkcid=1", "mkrid=711-53200-19255-0", "siteid=0", `campid=${CAMPID}`, "toolid=10001", "customid="])
    if (!url.includes(p)) throw new Error(`missing ${p}: ${url}`);
  return url;
}
