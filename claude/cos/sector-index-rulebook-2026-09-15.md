> **LANDED IN THE REPO 2026-09-17.** Until today this document existed only as a claude.ai Project
> doc, which is the same one-copy-not-the-other defect that lost the Sep 15 SV151 work. The text
> below is that document verbatim.
>
> **CORRECTION, and it matters for everything below: SV151 IS NOT LIVE AND IS NOT IN THE REPO.**
> The header line and §2a/§2b/§3/§4/§7 speak of SV151 as activated on 2026-09-15 at base 100,
> divisor 19.0946, basket $1,909.46, 202 of 207. That build never reached `main` and its working
> tree is gone (`claude/cos/NEEDS-MO.md`, Path A closed with Mo present). **Read every SV151
> activation figure in this document as the Sep 15 run's own report — a plausibility check for the
> rebuild, not as state.** The rules themselves are unaffected: they are Mo's parameters and they
> stand. Rebuild spec: `claude/cos/sv151-rebuild-spec-2026-09-17.md`. Inception on rebuild is the
> rebuild date, not Sep 15.

# Sector-model set indices — rulebook

*Written Sep 15 2026 by the Chief of Staff, from Mo's rulings in chat the same day. Published BEFORE the first mark on purpose: rules that are public in advance cannot be fitted to the data afterwards. Changing anything in this document changes what a mark means, so every parameter here is Mo's, not the CoS's (CHARTER §3).*

*Amended Sep 15 2026, after the first screen and activation: §2 gains the screen's actual outcome and the blended-vs-eBay ruling, §7 collapses (both questions are settled), and §10 is new. **Nothing written before the data has been edited or removed** — the pre-registered prediction in §2 stands exactly as it was published, including where it was wrong.*

**First index built to it:** SV151 — Scarlet & Violet—151. Universe written to `data/indices.json`, page live at `/scarlet-violet-151-index`, **status `live` — activated 2026-09-15 at base 100, divisor 19.0946, basket value $1,909.46, 202 constituents of 207, `basis: sold (PriceCharting ungraded)`.** *(Void — see the correction at the head of this file.)*

---

## 1. The model

**One Pokémon set is one sector.** The analogy Mo set is a sector ETF, not the S&P 500: XLV does not hold the best healthcare companies, it holds every healthcare name in its index, and what you read off it is how healthcare did. A set index holds every card in the set.

This is the whole reason it counts as an index. **Nobody selects constituents** — that is the line between an index and a portfolio. A chase-tier basket is somebody's opinion about which cards matter; a set is a fact about which cards exist.

**Universe vs basket.** The `universe` is every slot in the set, published whether it ever trades or not. The `basket` is the slots that clear the liquidity screen and carry a sourced comp; the level is computed over the basket. A slot in the universe but not the basket is never hidden — the page prints both counts, because *how much of a set trades as singles at all* is itself a real statistic about that set.

**Why not a whole-Pokémon index of top cards:** Mo, Sep 15 — million-dollar cards would dominate the weights and the thing would measure one or two cards. Correct, and it is the same concentration problem the 25% cap below exists to handle at set scale.

## 2. The liquidity screen

> A card enters the basket at **6** clean single-card sold comps in a trailing **30 days**, and stays in until it falls below **4**.

- **Why 6.** The marking cadence is twice weekly — one mark every 3.5 days, so 30 days is 8–9 marking periods. Six comps is roughly one per marking period. Below that a "mark" is a stale price reprinted, and the screen and the cadence would be telling different stories. Six is also the floor at which a median survives discarding an outlier; at three, one weird sale *is* the price.
- **Why 30 days.** It is the window the rest of the site already runs on — `roc30`, `sma30`, `supply30`, the 30D movers. A new window would be new furniture for readers to carry.
- **Why the buffer (enter 6, stay 4).** Hysteresis. With one threshold, a card sitting on the line flickers in and out every quarter and burns a divisor adjustment each time. Every serious index provider uses buffer bands for exactly this. Entry and exit thresholds must never be the same number.
- **"Clean" means a single card.** Lots, bundles and multi-card listings are excluded — see the `TITLE_BAD` lot rules, and note the known gap for `"N-card"` titles.
- **There is no price floor.** A cheap card that genuinely trades as a single is eligible. The screen is a liquidity test, not a value judgement — the same criterion a sector ETF applies before it will hold a name. This is what lets the index be honest about the cheap end without anyone deciding a card is "too small to matter".

**Pre-registered prediction for SV151 (Sep 15, before any data):** essentially all 54 cards above Rare clear it; a scattering of the 25 Rares; almost none of the 128 commons and uncommons, because shipping exceeds the card and they move in lots. Expected basket **55–70 of 207**. A result near 150 means the screen is too loose. Recorded so the screen can be *judged* rather than quietly tuned.

### 2a. What the screen actually did (Sep 15, after the run) — and why the prediction missed

**Result: 202 PASS / 5 FAIL / 0 errors across all 207 cards.** The five failures are Fearow #22, Geodude #74, Magnemite #81 and Rhyhorn #111 — **5 clean comps each, one short of 6** — and Energy Sticker #159 at 0. Clean-comp counts across the 202: **median 10, min 6, max 41**. 52 listings were rejected by the title filter (25 blocklist, 15 foreign card numbers, the rest wrong-number or missing-token).

**The prediction was wrong. It said 55–70; the answer is 202.** The prediction text above is left exactly as published — that is the entire point of pre-registering it.

**The cause is identifiable, and it is not the screen.** PriceCharting's ungraded sold list **blends eBay and TCGplayer**, and TCGplayer is a singles marketplace where commons genuinely trade one at a time at $0.15–$0.60. The prediction's reasoning — shipping exceeds a common's value, so commons move in lots — is an **eBay** argument, and on eBay it held: **counting eBay rows only, 75 of the 202 would have cleared**, close to the predicted range. The comp source mix across the run was **eBay 53.8% / TCGplayer 46.2%** (1,734 / 1,487 comps).

So the "near 150 means the screen is too loose" tripwire above fired on a result that was not a loose screen. **The 6/30 thresholds are unchanged and stay unchanged.** What was too narrow was the CoS's assumption about the source, not the rule. A pre-registration that is only ever vindicated is decoration; this one did its job.

### 2b. Ruling: screen on the blended list, take the whole set (Mo, Sep 15)

Mo ruled that the screen and the mark both run on **PriceCharting's blended ungraded sold list** — *"go with your recommendation, consistency is huge"* — and that the index takes **the whole set** on that basis.

**Why, in one line: consistency.** DR25 and PRIS25 already mark on PriceCharting's blended ungraded aggregate. Screening SV151 on eBay rows only while marking it on the blended list would have made SV151 internally inconsistent with the indices printed beside it — a different question answered by a different population, on the same hub page, with no way for a reader to see it. One source answers both questions: which cards are liquid enough to be in the basket, and what each one is worth. **Nothing is blended into a single price** — the §7 prohibition is intact, because there is only one source.

The alternative — an eBay-only screen — is a defensible index and would have produced a 75-card basket. It is not the index we run. Restating to the eBay basis remains open (see §7) and, if it happens, is a **logged divisor adjustment with the level unchanged**, never a silent re-base.

## 3. The 25% single-card cap

> No single card may exceed **25%** of the index at reconstitution.

**Precedent, not taste.** The Select Sector SPDRs are capped indices — they have to be, because RIC diversification rules bound single-holding weight, and the funds are rebalanced to stay inside it. Without a cap, SV151 is a Charizard chart with 206 other cards along for the ride, and that becomes obvious the first time one card moves 15% and the level moves 4% while nothing else did.

**Mechanics.** Price-weighted math cannot cap by holding fewer shares. Each basket row carries a weight `w` (1 = uncapped) and:

```
level = sum(price × w) / divisor
```

**Applying or changing a cap must not move the level.** Recompute the divisor so it is identical before and after, and log it in `capLog` beside `divisorLog`. A cap is a change in composition, never a market event, and the chart must never show a step that no one traded.

**At SV151's constitution (Sep 15) the cap bound nothing** — the largest constituent, Charizard ex #199, sits at **18.59%**. The cap is live and will bind the first time one card runs far enough ahead of the other 201; it is not decoration for having been slack on day one.

### 3a. Amendment, Sep 25 2026 (Mo): the second leg — the 5/50 rule

The 25% cap was written picturing one big card. TH26 (30th Celebration) produced a case it did not foresee: three
near-identical secret rares (Mew R/RGB, G/RGB, B/RGB, each ~$3,800 against a $2,469 basket of the other 188 cards),
which under the single cap alone would each sit at 25% and together take **75%** of the index — a Mew chart with 188
cards along for the ride. The Select Sector SPDRs this section cites do not run on a single cap: their concentration
rule is **no position above 25% AND positions above 5% may not sum past 50%** (the RIC "5/50" test). The rulebook
claimed the precedent and had only written down half of it. **Mo adopted the second leg on Sep 25 2026:**

> No single card above **25%**, and the cards above **5%** may not sum past **50%** of the index, at reconstitution.

Mechanics are unchanged in kind — both legs are weights `w` in the divisor math, iterated to a fixed point, logged in
`capLog`, level unchanged by construction. TH26 at inception under both legs: the RGB trio at 16.4% each (49.3% with
Lugia #149, which the group leg pushed to 4.85%), four weights capped, the other 187 cards uncapped. **Applies to every
sector-model index from this date, SV151 included when it is built.** Tool: `tools/build-sector-index.mjs`.

**Sub-indices (same date).** A named subset of a basket may be published as its own line — price-weighted, uncapped,
base 100 at the parent's inception, marked with the parent — so a concentrated group's move can be read on its own and
never mistaken for the set's. First one: **TH26·RGB**, the Mew RGB trio. A sub-index is a second line on the page,
never the level, and never on the tickers hub as a row.

**Slot rule, corrected the same day.** "Every card in the set" includes cards whose number is letters (`B/RGB`); the
Sep 17 slot rule's "must end in #<number>" was a regex, not a policy, and it had silently dropped the set's three
biggest cards. A slot is any product on the set's console that is a single card, numbered however the set numbers it;
only sealed products and bracketed variants of an existing slot are excluded.

## 4. Reconstitution

- **Quarterly**, effective the **first Monday of January, April, July and October**.
- **Announced the Monday before it takes effect.** Index providers do this; hobby tools do not. It is what makes the index auditable.
- Screen re-run and caps re-applied only at reconstitution. Weights drift in between — exactly as a sector ETF drifts between rebalances.
- Every entry, exit and cap change is a logged divisor adjustment. The level is continuous across all of them.

**SV151's first reconstitution is effective Monday 2026-10-05 and is announced Monday 2026-09-28.** The four one-comp-short cards (Fearow #22, Geodude #74, Magnemite #81, Rhyhorn #111) are the obvious candidates to enter, and they enter only if they clear **6** — not 5, and not "close enough because we noticed them." *(Schedule void until the index exists — see the correction at the head of this file.)*

## 5. Marking cadence — twice weekly

Deliberately faster than the weekly set indices, and the reason is statistical, not editorial.

The standard error on skewness is about `√(6/n)`; on kurtosis about `√(24/n)`. At weekly marks you have n≈52 after a full year — ±0.34 on skew and ±0.68 on kurtosis, which cannot distinguish a fat tail from a normal one. Twice weekly gives n≈104 in year one.

**This is why the index is not backfilled.** A three-year weekly backfill would give n≈150 and still leave kurtosis at ±0.40. The binding constraint was never the missing history — it was the cadence. Cadence is a permanent fix; backfill is a one-time gift of shape bought with methodology.

*Operationally: `node tools/build-sv151.mjs --mark`, twice a week, owned by Pricing Integrity / Engine Watch. A missed mark is a permanent hole in the distribution this cadence exists to measure — it cannot be filled in later without becoming the backfill this section refuses.*

## 6. Why forward-start, not retroactive

Mo's call, Sep 15, and the right one:

1. **It is the orthodox construction.** Every index worth respecting started on a date and ran forward. Pre-inception series are reconstructions, and index providers are required to label backfilled numbers as hypothetical precisely because they mislead so reliably.
2. **Survivorship stops being something anyone has to be careful about.** A forward start makes it structurally impossible to select on outcomes not yet observed. Pick "the top cards of the last five years" today and every 2021 chase that died is silently excluded; backfill that and the chart is beautiful and meaningless.
3. Base 100 is **the inception date, not a valuation**. Waiting for a "good" entry would be market-timing an index, which is incoherent.

**Correction on the record (CoS, Sep 15):** in arguing for forward-start the CoS told Mo that backfilling would blend two data sources, since the forward series would be our own sourced solds and the backfill would be PriceCharting. That was wrong — the live Pokémon indices already mark `sold (PriceCharting ungraded)`, so a PriceCharting backfill would have been the *same* basis, not a blend. The decision stands on reasons 1 and 2, which are sufficient on their own, but the blend argument should not have been made.

## 7. Settled — the two questions that blocked activation (Mo, Sep 15)

Both questions in this section were open until Mo ruled on Sep 15. Both are now closed, and SV151 activated the same day. The prohibition they existed to protect is unchanged: **two sources are never blended into one price.**

- **Price basis — DECIDED: `sold (PriceCharting ungraded)`, the whole set, end to end.** Mo: *"go with your recommendation, consistency is huge."* The deciding argument was consistency with DR25 and PRIS25, which already mark on the same blended ungraded aggregate — see §2b. The basis is labeled on the page. **Still open by design, and not a blocker:** restating to our own eBay solds later. eBay sold data is not available through the Browse API, so "our own" still means extending the auction-close observation work (`049180a`) to the basket at twice-weekly cadence. If it ever happens it is a **logged divisor adjustment, level unchanged**, and the `basis` label changes with it — never a silent re-base, and never a period where half the basket is on one source and half on the other.
- **The screen's data source — SETTLED: the same source answers both questions.** The screen counts clean single-card sold rows from PriceCharting's ungraded list, and the mark comes from the same list. There is no split between a liquidity source and a price source, so there is nothing to disclose beyond the basis line already on the page. (Had the split been taken, it would have been legitimate — liquidity and price are different questions — but only stated plainly on the page. It was not taken.)

## 8. Rollout to the existing indices

Mo asked whether to apply the sector model to the live Pokémon indices. Direction is right; the payoff is not where it looks.

PB26, CR26, AH26, DR25 and PRIS25 are **current-release** sets. Their base cards have not had time to develop a singles market — a common from a set that streeted this year moves almost exclusively in bulk. Run the 6/30 screen against them and the expectation is near-zero base cards qualifying: the universe would grow by 150 names and the basket by none. The index would look broader and measure exactly the same thing.

**The sector model pays off on mature sets**, which is why SV151 is the right first build. Worth measuring rather than assuming — running the screen against one current set's base cards settles it permanently in an afternoon.

*Sep 15 note, in light of §2a: this expectation was formed with the same eBay-shaped assumption that produced the 55–70 miss, and the blended list includes TCGplayer, where current-release commons do trade as singles. Treat "near-zero base cards qualify" as **untested**, not as a finding. The afternoon of measurement above is now the only way to settle it.*

**Conversion carries a continuity problem.** The live indices are tier-scoped by inception. Expanding a live index's universe changes what it measures even when the divisor keeps the level smooth — that is the quiet drift this document warns about in §1. If conversion ever happens, freeze the tier series as a closed record and launch a full-set successor with a visible break, rather than letting one line silently become a different measurement.

## 9. Sports is different, and structurally so

A Pokémon set's cards share a factor: one print run, one reprint risk, one sealed-supply curve. A reprint announcement moves everything in the set together — that is what makes a set behave like a sector.

A Bowman set's cards are driven by **player** outcomes. A callup moves one card and nothing else; the constituents do not share a factor. The "sector" in sports is the player, not the set — which is roughly what the Bangers board already is. Mo's read on Sep 15 ("might not be as big of a deal in sports cards") is correct, and this is why.

## 10. Known limitations of the data source (recorded Sep 15, neither blocking)

Written down because a limitation nobody wrote down becomes a claim somebody makes later.

**1. PriceCharting caps its ungraded tab at 60 sold rows, and 141 of 207 SV151 cards hit that cap.** What the cap censors is *rows visible on the page*, not the clean counts the screen produces (max observed 41), so **pass/fail at 6 is unaffected** and the screen is sound. The consequence is narrower and permanent: **a clean-comp count is a liquidity gate input, not a volume measure, and must never be quoted, charted or compared across cards as though it were one.** A card showing 41 and a card showing 10 may have traded the same number of times.

*Re-verified 2026-09-17: the item page's condition selector still reads "Ungraded (60)" on Charizard ex #199. The cap is current, not a Sep 15 artefact.*

**2. PriceCharting's headline ungraded figure and our own median of the clean rows diverge on cheap cards.** Above Rare the two agree within about **2%**. On cheap commons the headline runs **materially higher** than the median of the clean single-card rows we verified.

Immaterial to the level, and the size of it is on the record: the 123-card cheap tail is **$69.52 — 3.64% of the $1,909.46 basket**, and marking the entire basket on clean medians instead of headlines would have set inception at **99.19 rather than 100.00**. Both numbers are stored per basket row from day one — `price` (the headline, what the index marks on) and `cleanMedian` (ours) — so the choice can be revisited honestly and the history restated as a logged divisor adjustment rather than guessed at.

**This is a methodology question, which is Mo's, not a bug.** It is parked in NEEDS-MO with no action required. What must not happen is anyone quietly switching the mark from one column to the other because a particular week looks better on the other one; that is the drift §1 and §3 exist to prevent, and it would be invisible on the chart.
