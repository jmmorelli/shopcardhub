# Integrity Watch — 2026-09-29

HEAD df6054c · origin/main df6054c · delta 0 · gate WARN 75/3/0 vs baseline 75/3/0

I took fresh HTTPS clones this run: `/tmp/iw` (main, `--depth 30`) and `/tmp/feed` (`price-data`). `git ls-remote origin refs/heads/main` returned `df6054c76c7…`, which matches local HEAD at 12:01Z.

Gates on that clone:

- `audit-prices`: 0 FAIL / **75** WARN
- `audit-site`: 0 / **3** (129 pages)
- `audit-terminal --feed data/feed`: 0 / **0**

That equals the Sep 28 desk's pushed-tree baseline (0/75 · 0/3 · 0/0).

Read at STEP 0: LANE-RULES (**R1–R28**), STATE and NEEDS-MO. Ledger: `data/pipeline.json`, 192 proposals.

**Where my prompt is stale (the file wins):**

- My prompt cites R1–R11. The file now runs to R28.
- I read the feed from `https://www.shopcardhub.com/feed/` (R19) and read `ga4-*` from the `price-data` clone.
- LANE-RULES' cadence row lists this lane as **Mon + Thu 05:00**, but this run fired on a **Tuesday**. Either the schedule has drifted or the cadence changed without the row being updated. That needs fixing at the Oct 1 roster review.

**Headline: 0 FAIL · 1 HIGH · 3 MED · 2 LOW. Part A is clean.** The HIGH is the Sep 16 class again: the home page promises "what the card last sold for", and the page it links to shows an ask mark and last bids.

---

## PART A — INSTRUMENTS: clean

The live `/feed/prices-latest.json` is for day **2026-09-28**, generated 16:45Z, so it was 19 h old at 12:01Z. It matches the `price-data` copy.

Baseline caveat, unchanged: `price-data` git history starts at the Sep 23 reset, so git gives only **6** daily observations. `iw-2026-09-24-6` (nightly counts log) is still queued to the Sep 30 weekly. Where `prices-history.json` carries a per-day series, I used its trailing 14 days.

| Instrument | Today (Sep 28) | Reference | Verdict |
|---|---|---|---|
| Cards in feed | **41** | 41 × 6 days | OK |
| Numeric `last` | **36** · priced points in `prices-history` **32** | 36 × 6 · trailing-14 median of points **33** | OK |
| Signals | **41** (HOLD 30 · SELL 11 · BUY 0) | 41 each day | OK |
| Gated | **9** | 10 · 10 · 10 · 10 · 8 | OK |
| Auction closes, cumulative (`market-latest`) | **346** (+24 on the day) | 242 → 286 → 295 → 304 → 322 | OK |
| Live auctions watched | **165** | 167 (Sep 27) | OK |

**Index cadence: all 23 live tickers carry a 2026-09-28 mark.**

- The six weekly chase indices were re-marked Monday:
  - PB26 82.75
  - CR26 85.28
  - AH26 88.45
  - PRIS25 93.61
  - DR25 87.68
  - PF25 92.60 (first move off its Sep 18 inception)
- TH26, SV151, BOW26, BB26 and BCB26 took their first Mon/Thu mark. No mark has been missed.
- The 12 classic Pokémon indices (BS99 … CZ23), added Sep 28, sit at inception 100.00. Their first scheduled move is Thursday Oct 1. **Next run:** check Thursday's mark on all 17 Mon/Thu tickers.
- The Pokémon chase indices fell 5–9% on the week. That is a market move rather than an instrument failure, so it is not a finding.

**GA4:** `ga4-latest.json` was generated 2026-09-28T17:07Z, 19 h old, inside the 36 h limit. The window ends Sep 27.

| Instrument | Value | Trailing median (ga4-history, 11 rows) | Note |
|---|---|---|---|
| `keyEventsYesterday` / `sessionsYesterday` (Sep 27) | **2 / 23** | 5 / 39 | Not zero, so no FAIL. Sessions are −41%. Sep 27 is the first clean day after the image-sweep fix. |
| `clicks7` | **22** | 36 | **−39%**, falling six days running (44 → 36 → 28 → 27 → 26 → 22). Under the 60% line, so **not filed**. It sits beside the earnings problem, so watch it Thursday. `buystripClicks7` 7, `buyboxClicks7` 0. `chase_click` has not appeared in `events7` since the Sep 26 launch. The onclick is wired on all 9 strips, so this reads as zero clicks, not a broken tag. |
| `organicKeyEventRate7` · `blendedKeyEventRate7` | **11.22%** · **5.74%** | 9.72 · 5.48 | Both OK |
| `returningShare7` | **6.91%** | 4.36 | Up. The base is small (184 clean sessions). |
| `nonUSTopCountry7` | Singapore **61** sessions @ 0.10 s = **48%** of US (128) | — | Above the 40% bar, but **already ruled** (cos-2026-09-20-1 filter; cos-2026-09-20-4 edge block declined). Falling from 78. Not filed. |
| US sessions/day (`countriesDaily7`) | 16 · 17 · 14 · 18 · 25 · 24 · **14** | — | Back down after the Sep 25–26 bump |

The last human GA4 read in STATE is the Sep 23 weekly, 6 days ago. That is inside both the 7-day (LANE-RULES) and 14-day (prompt) limits, and the Sep 30 weekly reads it next.

---

## PART B — CLAIMS

This run covered six pages. `/` and `/bowman-bangers` are mandatory. The other four had not been read by any run:

- `/bowman-1st-chrome-index` (BOW26)
- `/pokemon-base-set-index` (new Sep 28; stands in for the 12 classic indices, which share one generator)
- `/moonbreon-worth` (league, Sep 28)
- `/topps-allen-ginter-2026` (league, Sep 28)

I also fetched `/auctions`, `/evolving-skies-index`, `/indices`, `/how-prices-work` and the six Pokémon chase-index pages to size findings.

Every finding below was re-fetched and reproduced on `www.shopcardhub.com` at **12:05–12:09Z**, immediately before filing (R5).

### FINDING 1 — HIGH · The home page says the Auction Desk shows "live eBay auctions next to what the card last sold for". It shows the engine's ask mark and last-seen bids. Neither is a sale.

- **Live:** `/` door 03 (`index.html:849`) reads "**Auctions ending soon** — Live eBay auctions next to what the card last sold for."
- **What the target page compares against:** `/auctions` prints "vs our price $X", which is `r.mark` from `api/auctions.js`, the engine's nightly mark from `prices-latest.json`, built from verified **asks**. It also prints "vs last bids $Y", the median of last-seen bids on ended auctions.
- **What the page itself says:** "the card's nightly mark and a floor, **not the sale price** at recent auctions". `market-latest.json` itself says "not yet a mark".
- **Why HIGH:** the words promise sold data over asks and mid-auction bids. That is two of the Sep 16 defects in one line, on the front door, pointing at an eBay click. `iw-2026-09-19-1` fixed the labels *inside* the desk and engine blocks. This door line was never ledgered (R6: no row mentions it).
- **Remedy:** a one-string edit, for example "Live eBay auctions next to our nightly ask mark and recent last bids", or simply "Live eBay auctions, soonest close first". No new mark (R20 clean).

### FINDING 2 — MED · `/moonbreon-worth` says "no ShopCardHub index tracks Evolving Skies". Since Sep 28 one does, and Moonbreon is its #1 constituent.

- **Live, in two places:** the tape chip says "🏷️ Index: none — no ShopCardHub index tracks Evolving Skies". The "What we do not know" paragraph says "Evolving Skies is not in any ShopCardHub index, so there is no basket to measure this card against."
- **The data:** `indices.json` **EVS21**, "Evolving Skies Set Index", is `status: live`, inception 2026-09-28, on `/evolving-skies-index`. It has 235 of 238 in the basket. Umbreon VMAX #215 is at $1,975, n30 35, weight 0.5114 (capped), and is the hero card on that page.
- **How it happened:** the page was built in the Sep 28 league run (`b05b26f`). The classic indices landed the same evening (`9d9f7b8`, 22:52Z), and the claim was true when it was written. R6: no ruling.
- **Remedy:** link the chip to `/evolving-skies-index` and replace the paragraph's clause. Per R27, agent B owns the page, so the league integrator or the desk makes the edit. The build notes should also check "Index: none" against `indices.json` at build time.

### FINDING 3 — MED · The `iw-2026-09-28-1` follow-up stopped at the JS component. The old "the chase cards' last sold" pitch is still baked into 8 live pages and into the generator.

- **What the Sep 28 desk changed** (`e0c1550`): the pitch in `js/signup.js` and R26 now reads "sold marks". R26 now says "No lane writes a different pitch."
- **What still reads "the chase cards’ last sold"**, as static `#newsletter` / `#tapecap` copy:
  - `/`
  - `/bowman-bangers`
  - `/ascended-heroes-index`
  - `/chaos-rising-index`
  - `/destined-rivals-index`
  - `/phantasmal-flames-index`
  - `/pitch-black-index`
  - `/prismatic-evolutions-index`

  All eight reproduce live.
- **The source of the re-emission:** `tools/build-signup.mjs:32` `NEW_PITCH` still emits "…and the chase cards&rsquo; last sold." Any re-run of that tool re-stamps the old wording.
- **Same root, on home:** "Open a ticker to see every card in the basket with its dated sold price". The table now says "sold mark", a median dated to the read.
- **R6:** this is not a re-file. It is an incomplete application of an applied ruling.
- **Remedy:** change `NEW_PITCH` to the R26 wording, re-run the tool or sed the 8 pages, and make the home line "…with its dated sold mark".

### FINDING 4 — MED · 42 pages' footers say "PSA pricing sourced from psacard.com, updated February 10, 2026". The graded figures on those pages come from PriceCharting and SportsCardsPro dated sales.

- **Live on `/moonbreon-worth`:** the PSA 10 $3,999.00 and PSA 9 $2,123.10 come from PriceCharting's PSA 10 / Grade 9 tabs, per the page's own Sources section.
- **Live on `/topps-allen-ginter-2026`:** the Kurtz PSA 10 $33.00 comes from SportsCardsPro's PSA 10 tab, again per its Sources section.
- **Scale:** the same footer line appears in 42 of 129 HTML files.
- **Why it matters:** it credits graded prices to a source they did not come from (the R18 class: a graded figure must say where it came from) and carries a 7-month-old date as if it were a refresh stamp.
- **R6:** no ledger row or STATE line mentions it.
- **Remedy:** delete the clause. On any page that really does quote psacard.com (grading fees on `/psa-grading-guide`, for example), keep it there with that page's own read date.

### FINDING 5 — LOW · The three Bowman index pages' method note says the source is "PriceCharting's dated ungraded sold list (**blended eBay + TCGplayer**)" and that it "caps its table at **60** rows". For Bowman cards the list is eBay-only and caps at 30.

- **Pages:** `/bowman-1st-chrome-index`, `/bowman-2026-index`, `/bowman-chrome-2026-index`.
- **Verified this run from the cloud:**
  - `pricecharting.com/game/baseball-cards-2026-bowman-chrome-prospect-autograph/andrew-fischer-cpa-af` returns **31 rows: 30 eBay, 0 TCGplayer**.
  - For comparison, `pokemon-base-set/alakazam-1` returns 61 rows: 30 eBay and 30 TCGplayer.
  - This is one item read. SportsCardsPro itself returns 403 from the cloud.
- **Consequence:** four BOW26 top-40 cards show n30 of 29–30 (Fischer, Hartman, Gonzales, Torres). They are sitting at the cap, not at a true count. The page's "liquidity gate, never a volume figure" line keeps it honest, which is why this is LOW.
- **Where it comes from:** the text is the Pokémon template phrase in `tools/build-sector-index.mjs:400`. The Sep 28 run noted it and did not file it; this run verified it.
- **Remedy:** make the source sentence and the row cap per-config (sports configs: "SportsCardsPro/PriceCharting dated eBay sales · table caps at 30").

### FINDING 6 — LOW · The home page still says set indices are "re-marked weekly". 17 of 23 tickers now mark Monday and Thursday.

- **Where on `/`:**
  - "Set indices are re-marked weekly — on sold comps…"
  - "the set indices' weekly sold-basis re-marks"
  - the footer line
  - `og:description` ("sold comps, re-marked weekly")
  - the chart caption "indices weekly"
- **What is actually correct live:** `/indices` now says "six Pokémon chase indices weekly; the whole-set indices … Monday and Thursday".
- **R6:** this is the home residual of `iw-2026-09-28-3`, which was applied to `/indices` and `/how-prices-work`. Its "write it from `indices.json`" part is queued to the Sep 30 weekly, and that fix covers this too. I'm not proposing separate work, only adding home to that item's scope.

---

## CHECKED AND CLEARED

- **`/bowman-bangers`:**
  - The verdicts (Holliday Sell, Fischer Hold, Kim/Gonzales Pass, Florentino Buy) differ from the engine only on Florentino (engine SELL). The page states that the engine word is the ask-side signal, not the verdict, and R20/R21 put verdicts on sold prints. That is not a contradiction to file.
  - "Ranked by the last printed sale" is `iw-2026-09-24-2`, queued to today's Tuesday lane. Not re-filed.
  - The "First Live Calls Print ~Sep 19" signal-alert box and the "Signals begin once…" block are in the HTML but hidden. `data/newsletter.json` does not list `signal-board`, and the empty-state yields to the table once the feed loads. That makes it dead copy rather than a live claim, and the desk may delete it when convenient.
  - `audit-terminal` board-autos-only passes.
- **`/`:** board levels match `indices.json` for all 11 original tickers (82.75 … 97.15). The BOW26/BB26/BCB26 basis prose is now correct ("from SportsCardsPro"). The Bangers 30D composite is labelled ask-basis and is an existing block allowed until Oct 7 (R20 table).
  - New nav (`9bc6058`, 05:28Z today) reads "Sports — 1st Bowman Autos" and "BOW26 — 2026 1st Bowman Autos". It drops "Chrome" but names the auto, which is the hobby's usage for the CPA class. Not an overstatement under R9 rule 1, so not filed. The pages themselves say "1st Bowman Chrome Auto".
  - The nav item "Ethan Holliday 1st Bowman" is already in the Content Editor queue.
- **`/pokemon-base-set-index` (BS99):**
  - Level 100.00 and divisor 8.5559 reconcile (basket $856 ÷ 8.5559 = 100.0).
  - The 25% cap binds only Charizard, and the >5% group totals 43.8% (under 50).
  - "Unlimited print only" is stated.
  - Every basket card clears the 6-comp entry.
  - n30 up to 38 is consistent with the stated 60-row blended cap.
  - `sources: []` is empty in `indices.json` for all 14 Pokémon sector tickers. The page names PriceCharting in its method note, so this is noted and not filed.
- **`/bowman-1st-chrome-index`:** Luis Arana (n30 2) and Nick Monistere (n30 3) sit under the 4-comp stay line. Rulebook §4 re-runs the screen only at quarterly reconstitution, so this follows the rule and is not filed. The level reconciles: $2,302.72 ÷ 23.3596 = 98.58.
- **`/moonbreon-worth` (apart from Finding 2):**
  - The ratios reconcile: 2.0x, +8%, and a $1,875.90 gap.
  - R18 shape holds.
  - Its raw count (26 in 30 days) differs from EVS21's n30 35 for the same card. The page counts eBay rows only ("completed eBay sales") and the index counts the blended list. Consistent; not filed.
- **`/topps-allen-ginter-2026`:**
  - Every 2026 figure is labelled an ask or Topps' price.
  - The 2025 comps are dated and counted.
  - The "$195 is most of a year's gain" arithmetic holds (55 of 80).
  - The presale ask is an ask with a buy link, not a mark (R20).

## STUMBLES — mine, this run

1. **Wrong close counts, caught before use.** I first counted "auction closes by day" from `listings-history.json` `endDate`. That field is the scheduled end, so it includes future dates (58 on Sep 30, 30 on Oct 1). Those counts meant nothing. I dropped them and used `market-latest` cumulative closes, which the Sep 28 run also leaned on. Its per-day `endDate` table (23 on Sep 27, median 27) was likely contaminated the same way, so treat that row as unreliable.
2. **Nearly filed a hidden block.** I almost filed the Bangers "First Live Calls Print ~Sep 19" box as a live stale claim. I read `data/newsletter.json` first and found the box never renders. Withdrawn before filing.
3. **Nearly filed a rule-compliant case.** I almost filed Arana/Monistere as screen breaches until I read rulebook §4: the screen re-runs only at reconstitution.
4. **Coverage gap.** Part B read 6 of 129 pages. The other 11 classic index pages share BS99's generator, but I read only one of them. The Sep 27 league pages `/gengar-ex-worth` and `/topps-chrome-formula-1-2026` are still unread by any run.

## WHAT I DID NOT DO

- No git beyond reading. No fix, commit or push. `data/pipeline.json` untouched (R1).
- No X, vendor or email contact (R10).
- No `/api/comps` calls.
- Only one PriceCharting item page per product line was fetched, and no titles are copied here.

**Proposals staged:** `claude/cos/integrity-watch-2026-09-29-proposals.json`, six entries, `awaiting-cos`.
