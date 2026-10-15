# Bowman indices — what's on the site, why it reads as confusing, and the reset

*CoS, Sep 25 2026, ~16:30 PT, after Mo: "take a good look at our Bowman indices… confusing… looks like AI slop when you dive in… shouldn't BOW26 be all the 1st Bowman Chromes from every 2026 Bowman release, autos leading, non-autos as the sub-index, then BOW27 next year — and each release with its own index too?"*

## 1. What is actually live today (the honest read)

| Ticker | What it really is | Basis | State |
|---|---|---|---|
| **BOW26** "2026 Bowman 1st Chrome Index" | **Ten cards.** The ten 1st Bowman Chrome Autos on the Bangers board, all from **May's 2026 Bowman** (the paper release's CPA-* inserts). Not "all 2026 Bowman", not "all 1st Chromes" — the Bangers board with a divisor. | eBay **ask** floors (engine), 15% cap | held at 98.29 since Sep 21 (R20) |
| **BCB26** "2026 Bowman Chrome Chase Index" | **Nine cards** hand-picked as a "chase basket" from **September's Bowman Chrome**: Holliday's returning base card + four IFA headliners' 1st autos + those four players' 1st base cards. Autos and $5 base cards in one price-weighted basket. | eBay **ask** floors | held at 69.52 (fell 30% in a week as release-week asks collapsed) |

So the two tickers answer two different questions with two different rules, both on asks (which R20 has now frozen), and neither is the thing Mo describes. The page copy then explains all of that at length — "COUNT basis activation gate", "restates to hammer basis at ≥60% SCP sold coverage", "every board-touching run through street +21d" — which is agent process leaking onto a public page. That is the "AI slop" feel: the words are about our pipeline, not about the cards.

### Design critique, in one table (the two pages at 1280 px, framework: first impression → usability → hierarchy → consistency)

| Finding | Severity | Fix |
|---|---|---|
| The live bar on BCB26 is a 200-character sentence of methodology in all caps above the title. First thing a visitor reads is "RESTATES TO HAMMER BASIS AT ≥60% SCP SOLD COVERAGE". | 🔴 | One line: *"Live index · sold comps, dated per row · re-marked weekly · no calls, just the tape"* (the Pokémon pages' bar). |
| BCB26's intro paragraph is 70 words of checklist arithmetic ("72 of the 100 Chrome Prospects are 1st Bowman Chrome cards and 97 of the 104 autos…"). | 🔴 | The mast says what the index is in ≤20 words; the arithmetic goes to the Method note at the bottom (the TH26/SV151 pattern Mo already approved). |
| BCB26 shows a 204-row BASE tab first, 196 of them "— NO VERIFIED ASK YET". The reader scrolls two screens of dashes before a price. | 🔴 | Lead with the auto basket; show only priced constituents in the table; unpriced universe behind a fold. |
| Two "Held since… moving to a sold-price basis" notices per page + an eight-cell stats bar with DIVISOR 0.8296 and RE-MARK MON·TUE·FRI. | 🟡 | One held line. Stats: Basket/Universe · Top weight · Effective holdings · Basket value · Since launch. Divisor and cadence live in Method. |
| BOW26's hero is fine (level, chart, one paragraph) but the paragraph says "ten cards" — a reader who came for "1st Bowman Chrome" finds the Bangers board again. | 🟡 | Becomes the year index (below); the Bangers board stays the board. |
| "Board names in set 1 / 5" stat and the "BOARD VS INDEX · BENCHMARK LINE" alert are inside-baseball. | 🟡 | Remove from the index page; the board page can carry the benchmark line. |
| Gold Listings buttons clipped at the right edge of the BASE table (we fixed the column floor today; the screenshot predates it). | 🟢 | done (7dd9cd2). |

What works: the AH26/TH26/SV151 mast (level, one sentence, chart, table) is the right pattern and is already the site's house style. Bowman just never got it.

## 2. The reset — one rule for every Bowman ticker

**Universe = every 1st Bowman Chrome Auto in scope, from PriceCharting/SCP's own console listing (nobody hand-picks). Basket = the ones that clear the liquidity screen (6 clean sold rows in 30 days to enter, 4 to stay). Sold-basis medians, dated. Base 100 at inception. 25% single cap + 5/50 group cap. Twice-weekly marks (Mon/Thu). Quarterly reconstitution.** That is the sector rulebook (Sep 15) that TH26 and SV151 run on — the same tool, a new config. Asks are never a mark (R20); they stay as the Listings/Bid buttons.

**Sub-index on every ticker: the 1st Bowman Chrome (non-auto) base cards of the same players**, price-weighted, its own line under the main level (the way TH26·RGB sits under TH26). Parallels (refractor colours) can be a third line later, once a season of solds says which colours actually trade.

### The tickers

| Ticker | Scope | Universe source | When |
|---|---|---|---|
| **BOW26** — *2026 1st Bowman Chrome Auto Index* | **Every 1st Bowman Chrome Auto issued in any 2026 Bowman release**: 2026 Bowman (May), 2026 Bowman Chrome (Sep), 2026 Bowman Draft (Dec, enters at the first Monday after street once the console lists it). Sub-index: their 1st Bowman Chrome base cards. | Union of the release consoles below | Rebuild now: 40 May autos (the console lists exactly 40 bracketless CPA slots) + September's Chrome autos. Inception = rebuild date, base 100 — the Sep 6 ask-basis history is retired, not restated (rulebook §6: no backfill, no blending). |
| **BB26** — *2026 Bowman (May) 1st Auto Index* | The May release's 1st Bowman Chrome Autos only (40 slots) | `baseball-cards-2026-bowman-chrome-prospect-autograph` | now |
| **BCB26** — *2026 Bowman Chrome (Sep) 1st Auto Index* | September's 1st Bowman Chrome Autos only | the Sep Chrome auto console (slug to confirm on the build) | now — replaces the 9-card chase basket |
| **BD26** — *2026 Bowman Draft 1st Auto Index* | December's | console appears after street | Dec |
| BOW27 … | same, next year | | May 2027 |

Why a year index *and* release indices: the year index is the one a collector cites ("2026 1st autos are −18% since launch"); the release indices are what you check the week a product streets and what the Tuesday board compares itself to. Same cards, two views — exactly the sector/sub-sector structure the rulebook describes, and it matches Mo's framing that Bowman is spec growth / call options held for years: the year cohort is the position, the release is the entry.

### What changes on the pages

- Both existing Bowman pages get the **AH26/TH26 mast**: ticker, level, one sentence, chart, stats row, sub-index line, table of *priced* constituents (autos leading), Method note at the bottom. All process language leaves the public copy.
- **/bowman-1st-chrome-index** becomes BOW26 the year index. **/bowman-chrome-2026-index** becomes BCB26 the September release index. A new **/bowman-2026-index** carries BB26 (May). The Bangers board stays exactly what it is: a ranked board of ten with calls.
- The hub groups them: *Bowman — 2026 cohort* (BOW26) with the three release lines under it.
- Old BOW26/BCB26 histories are kept in `indices.json` under `retired` with the reason (ask-basis, R20) — never shown as the new line's history.

### Data check done this afternoon

- PriceCharting/SCP lists the May autos as one console with **40 bracketless #CPA slots** (150 rows incl. parallels); item pages carry the dated completed-sales table unauthenticated — the same read the sold catalog already does nightly for the ten Bangers autos. Paging the console needs the SCP POST form (verified: `cursor=150` returns the next page), which the sector tool gets as a small addition.
- Expected screen: the ten board names clear it easily (17–41 clean sales/30d); the tail of the 40 may not — that is the point of the screen, and the unscreened names still show in the universe count.

## 3. Also from Mo today: COMC vs TAG

- **COMC** raised per-item shipping/handling in March 2026 (standard $0.25→$0.50, toploaded $0.45→$1.00, graded $1.00→$2.00, effective immediately) and has adjusted auction and service fees since; collector reaction was poor. COMC does not grade — it is a consignment marketplace — so "COMC vs TAG" is really "human-graded (PSA/BGS/SGC) vs TAG's AI-defined grade", and the site already leans TAG on /tag-grading-guide.
- **TAG has an affiliate program** (UpPromote: register at partner.taggrading.com/tag/register; $1 per item flat, the page's meta also says 10% of referral sales — the tiers are on the form; 30-day cookie; needs a W-9 and social handles). That is a real lane: the TAG guide + every graded-card mention on the site can carry a TAG link. **Needs Mo: the registration (W-9), ~10 min.** Filed in NEEDS-MO.

## 4. Decision needed from Mo

Approve the reset in §2 (BOW26 = year cohort of all 2026 1st Bowman Chrome Autos, release indices BB26/BCB26/BD26 under it, autos lead, base cards as the sub-index, sold basis on the sector tool, the two current ask-basis lines retired). Build time: the rest of today for BB26 + BOW26 (May autos), BCB26's September autos as soon as the console slug is confirmed, pages restyled to the house mast. This is Phase 2 for Bowman, done the right way rather than patched.
