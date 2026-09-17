# SV151 — rebuild spec (Path B), written 2026-09-17 by the CoS from a desktop-linked session

**Status: the universe is built and in the repo. The screen is not run. There is no index and no level.**

Path A is closed: `claude/cos/NEEDS-MO.md` records the check run on Mo's own clone with Mo present —
`tools/build-sv151.mjs`, `scarlet-violet-151-index.html` and an `SV151` key in `data/indices.json`
are absent from `~/Projects/shopcardhub` *and* from a clone of origin taken the same minute. The
Sep 15 working tree is gone. This document is what replaces it.

**Ruling that is already made and is not re-opened here** (`claude/cos/sv151-recovery-2026-09-17.md`):
in Path B the **inception date is the rebuild date, base 100. Not Sep 15.** Rulebook §6 forbids
backfill in the same words whether it is two days or three years. The Sep 15 screen outcome stays
quotable as *what the Sep 15 screen found*; it is not an inception.

---

## What is now done, and in the repo

`data/sv151-universe.json` — **all 207 numbered slots**, one product per slot, each with its
PriceCharting product id, item URL and the ungraded headline figure as of 2026-09-17.

**How it was built, so nobody re-derives it:**

- The set's console page is `https://www.pricecharting.com/console/pokemon-scarlet-&-violet-151`.
  It serves **150 rows at a time**. Paging is a **POST to the same URL** with
  `sort=&when=none&release-date=<today>&cursor=<150|300|…>`; rows are `<tr id="product-NNNNNNN">`,
  the title cell carries the item URL and `#number`, and `td.price.numeric.used_price > span.js-price`
  is the ungraded headline. Three pages give **412 products**.
- 412 products, 207 slots: the surplus is variants. **Slot rule applied** — prefer the bracketless
  title; skip sealed products that happen to carry a card number (`Poster Collection #49`, which
  otherwise wins #49 over `Venomoth #49` alphabetically); where no bracketless print exists prefer
  `[Holo]` (#68 Machamp, #105 Marowak, #134 Vaporeon, #150 Mewtwo, #207 Psychic Energy). Reverse
  holos, Cosmos holos and retailer stamps (EB Games, GameStop) are variants, not slots.
- **Corroboration that the source and the slot rule are right:** the headline sum across all 207
  slots today is **$1,905.79**. The Sep 15 run's basket value over its 202 constituents was
  **$1,909.46**. Two days apart, five extra slots, 0.2% apart. The Sep 15 numbers were real.
- A user-agent header is required. Without one the console page does not return rows.

## What is NOT done, and the exact wall

The liquidity screen needs **completed-auction rows per card**, not the headline. Rulebook §2:
6 clean single-card sold comps in a trailing 30 days to enter, 4 to stay.

**The completed-auctions tables are not in the item page HTML and are not reachable unauthenticated.**
Verified this run on Charizard ex #199 (product `5809582`):

- The item page ships the tab *chrome* only. The condition `<select id="completed-auctions-condition">`
  is present and reads **"Ungraded (60)"** — which independently confirms rulebook §10's 60-row cap
  is real and current — but no `<tr>` of sold rows is in the document.
- `/offers?product=5809582` returns **active for-sale offers**, not completed sales. `&status=sold`,
  `&sold=true`, `&sold=1` and `&type=sold` were each tried: they change the row count (37 → 11
  price cells) and none of them yields a single sold-date token.

So the rows need the **authenticated Chrome path** — Mo's PriceCharting Legendary session — which is
what `claude/cos/sv151-recovery-2026-09-17.md` predicted and what the P0 SportsCardsPro graded
sales-table pull also needs. **These are now one problem, not two, and should be solved once.**

The `PRICECHARTING_TOKEN` API (a Vercel env var, see `tools/price-engine/README.md`) is **not** a way
round this: it returns headline price points, not the sold-row list the screen counts.

## The build, once the rows are reachable

1. For each of the 207 slots, pull the **Ungraded** completed-auctions rows. Expect the 60-row cap
   on the liquid end (§10: 141 of 207 hit it on Sep 15).
2. Apply the title filter — the `TITLE_BAD` lot rules — and count **clean single-card** rows inside
   a trailing 30 days. Sep 15 reference: 52 listings rejected (25 blocklist, 15 foreign card
   numbers, the rest wrong-number or missing-token). Known gap: `"N-card"` titles.
3. **Screen at ≥ 6 to enter.** Sep 15 reference outcome: 202 PASS / 5 FAIL / 0 errors; failures were
   Fearow #22, Geodude #74, Magnemite #81, Rhyhorn #111 (5 comps each) and Energy Sticker #159 (0);
   clean-comp counts median 10, min 6, max 41. **Treat these as a plausibility check on the rebuild,
   not as a target.** A materially different basket count is a result, not an error — say so.
4. Store **both** `price` (the headline, what the index marks on per §2b) and `cleanMedian` (ours)
   on every basket row, from day one. §10 requires it and the Oct 5 clean-medians ruling has nothing
   to execute against without it.
5. `divisor = basketValue / 100`. Apply the **25% single-card cap** at constitution via fractional
   units and log it in `capLog`; on Sep 15 it bound nothing (Charizard ex #199 at 18.59%). Check it
   again — do not assume.
6. Write the `SV151` key into `data/indices.json` (`basis: "sold (PriceCharting ungraded)"`,
   `status: "live"`, `inception: <rebuild date>`, `base: 100`), build the page, wire nav, sitemap,
   `indices.html` and the og image.
7. Set `data-prices-updated` **and** `data-prices-ttl="4"` on the page — a twice-weekly index that
   goes a week without a mark must say so on its own face, and without the stamp it becomes the 35th
   page in the `no-machine-stamp` WARN backlog.
8. Three gates in a fresh clone, baseline **FAIL 0 / WARN 62 · 0/3 · 0/1**. Commit with
   `Task-key:`/`Authority:` trailers → fetch → `merge-base --is-ancestor` → push → `ls-remote` →
   curl the live URL → IndexNow → `chiefOfStaff.pushLog` entry.
9. **Then, and only then**, the held Reddit post. `claude/recaps/link-post-sv151-2026-09-17.md`
   stakes five numbers on the live page (202/207, the 55–70 pre-registration, the 18.6% Charizard
   weight, the five failures with their comp counts) and tells Mo "if someone checks, it matches."
   After a rebuild **the constituent count and the failures will probably differ**, so the draft
   needs re-checking against the live page line by line before it goes anywhere.

## Standing obligation, from the day it activates

Rulebook §5: **twice-weekly marking**, because SE(skew) ≈ √(6/n) and SE(kurtosis) ≈ √(24/n), and a
missed mark is a permanent hole in the distribution the cadence exists to measure. It cannot be
filled in later without becoming the backfill §6 refuses. Do not activate this index until something
owns that cadence.

## Related defect, logged not fixed

`claude/cos/sector-index-rulebook-2026-09-15.md` — the document every parameter above comes from —
exists only as a claude.ai Project doc and **not in the repo**, which is the same
one-copy-not-the-other defect that lost the Sep 15 work and left `NEEDS-MO.md` stale for seven hours
on Sep 17. It is landed in the repo in the same commit as this spec.
