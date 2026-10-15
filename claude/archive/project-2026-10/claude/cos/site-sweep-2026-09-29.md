# Site Sweep — 2026-09-29 (fired ~17:10Z, cloud) — MAC UNREACHABLE → patch for the 14:00 desk

HEAD `9bc43f6` (`feed: nightly 2026-09-29`) · patch commit `165f7cc` on `9bc43f6`, tree `6f8365bf6d46daaffd69ff77c3bbc4dea5f0360c` · Project `claude/handoffs/site-sweep-2026-09-29.patch.txt` · **nothing pushed**.

**STEP 0.** The Mac was online (`js-macbook-pro-local`), but this session had **no connected folders**. I sent one request for `~/Claude/Projects/Card Hub`, and the auto-mode permission check denied it (same as the Night Crew deploy at 08:18 and the league at 05:57 today). No deploy key, no Mac clone, no `$HOME/k` created, so there was nothing to remove. Cloud HTTPS clone at `9bc43f6`. Read: LANE-RULES (GO-TIME block, R1, R5, R28), the STATE top plus the last 2 run-log entries, yesterday's sweep, and Night Crew `BACKLOG`/`pending.md`/`deploy-2026-09-29` so nothing gets re-filed. **Night Crew's `0c4bac6` is still undeployed**, so its B2–B7/P1 fixes aren't live yet. I saw them on production and did not re-file them.

## Bugs — 3 found · 1 fixed (in patch) · 2 filed

**Sweep:** 105 sitemap URLs × 1366×900 and 390×844 = 210 loads. Analytics/beacon hosts were aborted, and every page was scrolled to the bottom before checking.
- Status: 210/210 returned 200.
- Console errors: 0. Page errors: 0. Failed same-origin requests: 0 (no font 502s today).
- Horizontal overflow (scrollWidth and `scrollTo(9999)`): 0.
- Broken same-origin images: 0.
- Visible "undefined" / "NaN" / "[object Object]": 0.
- Same-origin links: 192 unique, 0 non-200.
- eBay links: 4,127 unique / 4,133 link×page pairs, all carry `mkevt=1` + `campid=5339155990`. The only exception is the `partnernetwork.ebay.com` disclosure link on `/`, which isn't an affiliate link.
- Fanatics links: 67 unique, all start with the Impact prefix and carry `subId1`.

**Fixed (in patch):**
1. **Phone dock "re-dock flash" (LOW-MED, conversion).** When a visitor scrolls past the buy strip and then back up, the strip re-docks. The buttons carry `transition: all .15s`, so the label font animated from 11px to 0. For about 150 ms the full no-wrap label ("Shop Lamine Yamal rookie cards on eBay", 402 px) pushed the gear or Fanatics button to x = 445–479 on a 390 phone, 8 px wide.
   - Reproduced on Yamal, Ronaldo, Rutschman and Misiorowski. Sep 28's §8b is correct at rest; this only happens during the transition.
   - **Fix:** `css/site-fixes.css` §8c. The dock state switches instantly (`transition: none` on the docked strip and its buttons).
   - Verified by injecting the patch CSS into production on 7 dock pages, sampling 40× through the re-dock: max right edge **376** (was 479). Links and labels are unchanged.

**Filed:**
2. **F1 — guide tables hide Verdict / eBay button / price on phones (MED → Night Crew, same class as their B3).** `.roi-table` sits in an `overflow-x:auto` box with no affordance. At 390, **55 of 56** pages have columns past the box edge:
   - VERDICT hidden on 42 pages, FIND (the eBay button) on 37, the "why" column on 25 + 10.
   - The price column is cut on 5 pages, incl. `/best-baseball-` and `/best-basketball-cards-under-50`: "~PRICE" at x = 327–413 in a 342 px box, and the first screenshot shows "~$4".
   - **Proposal:** extend §10's stacking to `.roi-table` under 560 px. Line 1: rank · card · price. Line 2: verdict + Find at 40 px taps. Line 3: the "why" text. Because column order varies across the 56 pages, a 10-line `js/fold-dense.js`-style pass that copies each `th` into `td[data-label]` is safer than nth-child rules. Keep every cell; fold nothing out.
3. **F2 — `tools/dest.py` has drifted from the site (MED, tooling → Night Crew, who own P7 on the same generator).** A dry re-run (reverted, not shipped) would:
   - (a) move the DEST block from after `SIGNUP:END` back to right after the hero on the existing pages, above the R11 buy strip;
   - (b) add DEST to 12 pages that don't have it (73 vs 61);
   - (c) revert 19 pages' tile copy to "watchlist + portfolio … P/L … nothing leaves your browser" (the Sep 27 copy was hand-applied to pages, not to the generator).
   - **Proposal:** an in-place mode (replace an existing block where it sits; insert only with `--add`), then the copy below (U-F2). **Until then nobody should run `dest.py`.**

## UX — 3 pages read (rotation: sitemap order, 3/day; next run starts at index 6: `/topps-series-1-2026`, `/topps-chrome-basketball-2026`, then index 8). `/` was read Sep 28; next home read ~Oct 5.

Pages: `/best-baseball-cards-under-50`, `/best-basketball-cards-under-50`, `/best-football-cards-under-50`. Phone and desktop, three screens each.

**5-second test:** all three pass on "what is this page" (big H1, one-line thesis, buy strip on the first phone screen). Baseball and basketball fail on "what does it cost" on a phone: the ranked list's price and the eBay button are off to the side (F1). Football passes, with dated medians ("Sold medians read Sep 19, 2026").

**Fixed (in patch):**
- **The DEST tiles sat flush against the next section's eyebrow ("THE THESIS", "RANKED BY ROI").** It was 0–2 px on 15 pages on desktop and 5 on phone. `site-fixes.css` §7b adds 24 px only where the next block opens on `.section-eyebrow`. Measured on all 61 DEST pages before and after: 18 pages change (+24 px), and alert-bar pages and the ROI calculator are unchanged (the calculator is excluded by id, since it has its own 64 px).

**Filed:**
- **U-F2 (LOW, with F2): DEST tile copy.** 42 pages say "Your Vault · … lands in your free Vault with live prices and **P/L**". The Vault was renamed Watchlist on Sep 25, and "P/L" is jargon that sits above the ranked list. Proposed, about the same length:
  - "Your Watchlist"
  - "…lands in your free Watchlist with live prices. No account."
  - "Open your Vault" → "Open your Watchlist"

  The `dest:'vault'` GA4 label stays for continuity. It's a generated block, so it ships with the F2 generator fix, not by hand.
- **U-F3 (MED, integrity → Sep 30 weekly / Integrity Watch): the baseball and basketball under-$50 lists are dated June and cite eBay solds.**
  - Hero: "PRICES: EBAY SOLD & MARKET DATA, JUNE 2026".
  - List intro: "approximate eBay/market levels as of June 2026".
  - Undated claims: "Defensive win shares up ~15%", "95th-percentile tools".

  That's three months stale on an eBay-listing basis (R20). The football sibling was rewritten Sep 19 on dated SCP medians with counts and windows, and these two need the same re-read. Prices are out of this lane's scope, so no copy was touched.
- **Observation, not a bug:** `/bowman-bangers` `#bb-roller` (the decorative ball) crosses past the right edge once on load. It's fixed-position with pointer-events none and makes no scroll. No action.

## Commit / gates

- Commit `165f7cc` (patch only). Trailers: `Task-key: site-sweep`, `Authority: Mo 2026-09-27`. One file: `css/site-fixes.css` (+11). Public file; no markup, generated block or price touched.
- **Gates on the patched tree (cloud clone):**
  - `audit-prices` FAIL 0 · WARN 75
  - `audit-site` FAIL 0 · WARN 3 (129 pages)
  - `audit-terminal --feed data/feed` FAIL 0 · WARN 0

  All three match the baseline, with no WARN delta.
- **Stacking:** the hunks sit at §7/§8 (lines ~281 and ~308). Night Crew's `0c4bac6` appends §9/§10 at EOF (hunk @315 context), so the two apply in either order. The league patch doesn't touch CSS.
- **Desk:**
  1. Fresh deploy-key clone.
  2. `git am` the Project patch.
  3. Confirm `git write-tree` = `6f8365bf…` if main is still `9bc43f6`, or rebase if it moved.
  4. Run the three gates, then push.
  5. After ~90 s, curl `/css/site-fixes.css` for "8c (Site Sweep" and "7b (Site Sweep".
  6. At 390 on `/lamine-yamal-rookie-cards`: scroll to the bottom, then back to top; the docked "Rep Yamal" button's right edge should be ≤ 376.

## Live checks

None. Nothing was pushed. Production was read before any edit (R5): the re-dock flash and the flush eyebrow both reproduced live.

## Stumbles

- The folder-access request was denied by the permission layer. That makes three lanes today (league, Night Crew deploy, Site Sweep) staging patches for one desk run. The desk can batch them: league `83b9fca` → Night Crew `0c4bac6` (+ `build-nav.js` regen) → this one.
- My first overflow check on the dock pages looked like a §8b regression. The time series showed it was a transition artifact, and at rest the dock is fine.
- A dry `dest.py` run was needed to discover the drift (F2). The working tree was reverted (`git checkout . && git clean`) before the commit, and the patch touches one file.
- **STATE run log not appended** (both copies or neither; no push possible). One-liner for the desk:
  `Sep 29 10:10 PT Site Sweep (cloud; Card Hub not connected → patch 165f7cc): 210 loads, 0 errors/overflow/404/untagged · fixed in patch: phone dock re-dock flash (§8c), DEST→eyebrow gap on 18 pages (§7b) · filed F1 roi-table columns off-screen on 55/56 phone pages (Night Crew), F2 dest.py drift — do not run (Night Crew), U-F3 under-$50 baseball/basketball June/eBay dating (Sep 30 weekly).`
