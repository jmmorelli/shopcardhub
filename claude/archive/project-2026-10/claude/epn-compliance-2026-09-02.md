# EPN compliance notice — Sep 1 2026 (deadline Sep 10)

**Source:** email from EPN Operations Support (epn-operations-support@ebay.com), Sep 1 2026 12:37 AM PT, ref `ref:!00DA00HKoB.!500aZ014uCLT:ref`. Forwarded by Mo Sep 2; relayed to CoS same day. Risk: account termination + 100% reversal of pending commissions if not acknowledged and fixed by **9/10/2026**.

## Findings in the notice
1. **Section III.C — unlabeled affiliate links.** Affiliate links to eBay are not clearly labeled; users must know where they're being redirected. Required: an "eBay" keyword near every affiliate link ("Click here for eBay" / "Buy on eBay"). Cited example: https://www.shopcardhub.com/pitch-black-set-guide.
2. **Section III.B — non-bona fide qualifying events.** Purchases made through our own affiliate links by our account or associated accounts. Pending commissions will be adjusted regardless.

## Audit (CoS, Sep 2, clone at e267e79)
539 eBay affiliate anchors across 79 pages: 470 already labeled ("… on eBay" text), **27 image-only anchors** with no visible label (8 of them on the cited pitch-black-set-guide checklist table), **42 text anchors** without the word eBay ("Buy McGonigle Chrome Auto →", "Shop Autos", "Live search →"…), across 16 files. Plus **every dynamic card-photo anchor** built by `js/card-img.js` (`.sch-cimg-link`, 72 pages) — image-only, no visible label.

## Fix (built and verified in cloud clone; patch delivered to Mo — `epn-labeling-fix.patch`, 18 files)
- 69 hardcoded anchors relabeled in 16 HTML files: text links get " on eBay" (inserted before a trailing →); image-only links get a visible `<span class="sch-ebay-tag">eBay</span>` corner badge.
- `css/site-fixes.css` (all 79 pages): `.sch-ebay-tag` badge style (9px, 7px on thumbs) + `a[href*="ebay.com"]{position:relative}`.
- `js/card-img.js`: every dynamic photo anchor now gets the same visible eBay badge + aria-label.
- Verified: post-fix scan = 0 unlabeled anchors; rendered check on pitch-black-set-guide (iPhone 13 viewport) shows 8/8 badges visible, no horizontal overflow.

## Still needed (Mo)
1. Apply patch on the Mac, review, commit, **push** (deploy). `git apply epn-labeling-fix.patch` in `~/Projects/shopcardhub`.
2. Verify the notice in the EPN dashboard (partnernetwork.ebay.com, logged in directly — not via email links) before replying.
3. Send the acknowledgment reply (draft delivered — `epn-reply-draft.md`) after deploy, keeping the ref code in the subject. Deadline 9/10.
4. **Stop all purchases through own affiliate links** by any owned/associated account, permanently. Expect the pending-commission adjustment.

## Standing rule going forward (all agents)
Every new eBay affiliate link must carry a visible "eBay" label: text links include "on eBay"; image links include `.sch-ebay-tag`. The weekly audit checks this (scan added to the audit method). Purchases through own links are never acceptable.
