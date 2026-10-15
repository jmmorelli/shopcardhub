# Integrity Watch — 2026-09-28

HEAD d4bfcbd · origin/main d4bfcbd · delta 0 · gate WARN 76/3/0 vs baseline 76/3/0

Fresh HTTPS clones this run: `/tmp/iw` (main, `--depth 30`) and `/tmp/feed` (`price-data`). `git ls-remote origin refs/heads/main` = `d4bfcbd4989…` = local HEAD at 12:03Z and again at 12:11Z. Gates on that clone: `audit-prices` 0 FAIL / **76** WARN · `audit-site` 0 / **3** · `audit-terminal --feed data/feed` 0 / **0**. That matches STATE's baseline (0/76 · 0/3 · 0/0). Read at STEP 0: LANE-RULES (**R1–R27**; my prompt still says R1–R11), STATE, NEEDS-MO. Ledger: `data/pipeline.json`, 180 proposals.

**Prompt vs file (the file wins):** I read the feed from `https://www.shopcardhub.com/feed/` (R19), not raw.githubusercontent, and `ga4-*` from the `price-data` clone. The GA4 backstop in LANE-RULES' cadence table (HIGH if the last GA4 read in STATE is more than 7 days old) is stricter than my prompt's (MED at 14 days). Both pass. STATE's weekly GA4 read is dated Sep 23.

**Headline: 0 FAIL · 2 HIGH · 2 MED · 1 LOW. Part A is clean.** Both HIGHs are the Sep 16 defect class: words claiming a sale or a close where the data behind them isn't one. Both come from generators, so each spans 9–28 pages.

---

## PART A — INSTRUMENTS: clean

The live `/feed/prices-latest.json` is day **2026-09-27**, generated 13:59Z, so 22 h old at 12:03Z. Today's nightly hasn't fired yet, so this isn't a gap. It matches the `price-data` copy on `generated`, and there are 0 `image.title` in the live copy (R20 hygiene holding).

Baseline caveat, unchanged: the `price-data` history starts Sep 23 (the reset), so git gives only **5** daily observations. That's why `iw-2026-09-24-6` (a nightly counts log) is queued to the Sep 30 weekly. Where a per-day series survives inside `prices-history.json` or `listings-history.json`, I used its trailing 14.

| Instrument | Today | Trailing reference | Verdict |
|---|---|---|---|
| Cards in feed | **41** | 41 × 5 days | OK |
| Numeric `last` | **36** (34 priced points on Sep 27 in `prices-history`) | trailing-14 median **32.5** (history) | OK |
| Signals | **41** (HOLD 29 · SELL 11 · BUY 1) | 41 each day Sep 23–26 | OK |
| Gated | **8**, all published HOLD (Kim raw BUY → HOLD; gate holding) | 10 · 10 · 10 · 10 | OK (−20%) |
| Auction closes, cumulative (`market-latest`) | **322** | 242 → 286 → 295 → 304 | OK, +18 on the day |
| Auction closes that day (`listings-history` endDate) | **23** (Sep 27) | trailing-14 median **27** | OK |
| Live auctions watched | **167** | 163 (Sep 23) | OK |

**Index cadence:** every live ticker is inside its cadence.
- **Weekly (Mon):** PB26, CR26, AH26, PRIS25 and DR25 were last marked Sep 21 and are due today. PF25 has held its Sep 18 inception mark and is due today. The Monday lane hasn't run yet (it's 05:03 PT).
- **Mon + Thu:** TH26, SV151, BOW26, BB26 and BCB26 all started Sep 25 (a Friday), so the first scheduled mark is tonight's ~01:15 PT Action. None has been missed yet.
- **Next run's job:** the Thursday run checks that all 11 tickers show a Sep 28 mark.
- **Note:** the R20 hold no longer applies. BOW26 and BCB26 were retired and re-initialised on sold basis on Sep 25, and every ticker in `indices.json` now carries `basis` sold or a PriceCharting history. SV151 is now in `indices.json` as `live`, so it's checked from this run on.

**GA4:** `ga4-latest.json` was generated 2026-09-27T14:22Z, 21.7 h old, inside the 36 h limit. `bots` block present.

| Instrument | Value | Trailing median (ga4-history, 9 rows) | Note |
|---|---|---|---|
| `keyEventsYesterday` / `sessionsYesterday` (Sep 26) | **4 / 39** | 5 / 52 | Not zero, so no FAIL. The Sep 26 sessions number is image-sweep-polluted per STATE; clean days start Sep 27 |
| `clicks7` | **26** | 38 | **−32%**, falling 5 days running (44 → 36 → 28 → 27 → 26). Under the 60% line, **not filed**; watch it Thursday. `buystripClicks7` rose 7 → 9, so the loss is elsewhere |
| `organicKeyEventRate7` · `blendedKeyEventRate7` | **7.07%** · **5.54%** | 9.72 · 5.26 | organic down, blended flat |
| `returningShare7` | **4.45%** | 4.31 | OK |
| `nonUSTopCountry7` | Singapore **78** sessions @ 0.15 s = **60%** of US (130) | 104–141 last week | Above the 40% bar, but **already ruled** (cos-2026-09-20-1 filter, cos-2026-09-20-4 declined edge block). Falling. Not filed |
| US sessions / day (`countriesDaily7`) | 17 · 16 · 17 · 14 · 18 · **25 · 23** | — | Recovering from the Sep 19 step (`iw-2026-09-24-5`) |
| League reports (`landingOrganicDaily28` 323 rows, `pageClicks28` 45 rows) | populated | new | OK |

---

## PART B — CLAIMS

Six pages this run:
- **`/`** and **`/bowman-bangers`** (mandatory)
- **`/pokemon-30th-anniversary-2026`** (top landing page; TH26 lives there)
- **`/bowman-2026-index`** (new Sep 25; no run had read it)
- **`/is-pokemon-151-worth-it`** and **`/umbreon-ex-worth`** (Growth League pages; no run had read them)

Two same-root pages, `/indices` and `/how-prices-work`, were also fetched to size Finding 3. Every finding below was re-fetched and reproduced on `www.shopcardhub.com` at **12:10–12:11Z**, immediately before filing (R5).

### FINDING 1 — HIGH · The chase strip and index tables print a 30-day median, or PriceCharting's smoothed figure, as "$X sold · <date>" under "top 3 by last sold". The date is the read date, not a sale date.

What's live:
- `/pokemon-30th-anniversary-2026`: "Chase · top 3 by last sold · dated", then "Mew #R/RGB **$4,000 sold · Sep 25** … Mew #G/RGB **$3,675 sold · Sep 25**", then "Last sold price per card, dated".
- `/bowman-2026-index`: "Andrew Fischer #CPA-AF **$145 sold · Sep 25**"; the table column header is **"Last sold"**, with a $144.63 cell.

What the data says:
- `data/indices.json` TH26 Mew G/RGB is `price 3674.5, n30 28, basis "sold (PriceCharting ungraded, 30d median)", asOf 2026-09-25`. BB26 Fischer is `144.63, n30 30, same basis`. A figure ending in .50 over 28 sales is a median, not a print.
- `/bowman-bangers`, live at the same minute, gives Fischer's actual last printed sale as **$144.26 on Sep 23**. No Sep 25 sale exists behind "$145 sold · Sep 25".
- On the Pokémon chase indices (PRIS25 etc.), `basis` is "sold (PriceCharting ungraded)". `/umbreon-ex-worth` itself says that figure is "PriceCharting's smoothed ungraded figure at re-mark time" ($1,250.46), against a plain median of $1,069.03.

Where it comes from and how far it spreads:
- Generator: `tools/build-chase-strip.mjs:89` (strip label).
- The strip appears on **9 pages**: ascended-heroes-index, bowman-1st-chrome-index, bowman-2026-index, chaos-rising-index, destined-rivals-index, pitch-black-index, pokemon-30th-anniversary-2026, prismatic-evolutions-index, scarlet-violet-151-index.
- The "Last sold" table header is on 5 HTML files.

**Why HIGH:** this is the prompt's first check: a figure labelled "sold", dated, that isn't a dated transaction. It sits beside a direct EPN buy link on the top landing page. It's milder than FAIL because the number really is sold-basis, just aggregated. What overstates is the label and the date.

R6: no ledger row covers the label. Ledger #34 ("vs last sold" chip, Mo-approved, `8b1753a`) *compares* against this mark and inherits the word. R26's email promise, "the chase cards' last sold", uses the same phrase. That's a promise about the email, not a ruling that a median may be called a last sale.

**Remedy shape:** either label what it is ("30-day median sold · 28 sales · read Sep 25") in the strip, the column and the #34 chip, or source the strip from the dated last print where one exists. The same fix applies to the "last sold" wording in the R26 digest template.

### FINDING 2 — HIGH · 28 pages say engine marks come from "verified eBay asking prices and, where recorded, auction closes". The engine marks on asks only; the feed says closes are "not yet a mark".

What's live:
- `/pokemon-30th-anniversary-2026`: "Marks are the engine's nightly reads from verified eBay asking prices **and, where recorded, auction closes**; dated, sourced, never hand-typed."
- `/card-seong-jun-kim` carries the same sentence.

What the code and feed say:
- In `tools/price-engine/snapshot-free.mjs`, the series point (`:451`) and `ta.last` (`:475`, `:517`) are built from verified-ask comps.
- Hammers are summarised separately (`:405–416`) into `market-latest.json`. Its own `note` reads: *"OBSERVATION ONLY - hammer prices from tracked auction closes … Not published on the site; not yet a mark."* (live `/feed/market-latest.json`, day Sep 27).
- The "closes" are also last-seen bids, a median of 12 h before close. That's the Sep 16 "hammer" defect.

Where it comes from and how far it spreads:
- Generators: `tools/build-engine-blocks.mjs:271` and `tools/build-card-pages.mjs:425` ("Prices are the engine's nightly marks from … and, where recorded, auction closes").
- **28 HTML files**, including 18 card pages, chaos-rising, ascended-heroes, pitch-black-set-guide and pokemon-30th.

R6: `iw-2026-09-19-1` (applied `80eac88`) swapped the "Hammer med" / "What buyers paid" *labels* inside the blocks. It didn't touch this footnote. Not ledgered.

**Remedy:** a string swap at both generators plus a re-bake, with no new mark (R20 clean): "…from verified eBay asking prices (asks, not sales)". It retires on Oct 7 anyway, when engine marks leave public pages (R21). Fixing it before then costs one sed.

### FINDING 3 — MED · Home, `/indices` and `/how-prices-work` still describe the retired Bowman indices: BOW26/BCB26 "on asks", "held", "six sold / two ask". Since Sep 25, all 11 live tickers are sold-basis, BB26 exists, and five tickers mark Mon + Thu.

- **`/` (`index.html:899`):** "the Bowman indices (BOW26, BCB26) **on asks until their sold basis lands**". `:984` and `:1029`: "(Pokémon sold-basis, **Bowman ask-basis**)". The same page's own board rows show BOW26, **BB26** and BCB26 at 100.00, Sep 25, sold-basis.
- **`/indices`** meta + JSON-LD: "Six tickers mark on sold comps, **two on verified asks (held since Sep 21–22, moving to a sold basis)**"; og: "two tickers run ask-basis". All 11 tickers appear on the hub.
- **`/how-prices-work` `:764`, `:802`:** "BCB26 and BOW26 (ask-basis, labelled on their pages) **are held at their last level** while they move to a sold basis". The two retired lines are in `data/indices-retired.json`. The live BOW26/BCB26 are new sold-basis indices marked Mon/Thu.
- **Also:** home and `/indices` say "re-marked weekly". TH26, SV151, BOW26, BB26 and BCB26 re-mark twice weekly.

R6: these strings are the applied fixes for `iw-2026-09-17-3`, `iw-2026-09-19-4`, `iw-2026-09-21-2` and `iw-2026-09-24-3`. They were right when written and were overtaken by the Sep 25 reset (`bb18f6e`), which didn't sweep the prose. This isn't a re-file: the defect is new, even though the strings aren't.

It understates rather than overstates, which is why it's MED and not HIGH. It still tells a search snippet the wrong basis and the wrong ticker count. **Remedy:** write the basis/cadence sentence from `indices.json` (the Sep 24 suggestion), so the next reset can't strand it a fifth time.

### FINDING 4 — MED · The top landing page says "nothing in this set has a verified sold comp yet … everything else in the set still has no published price", above a 191-card sold-basis index on the same page.

- **Where:** `/pokemon-30th-anniversary-2026`, the At-a-Glance note (`pokemon-30th-anniversary-2026.html:1363` block), which begins "Release-night tape (Sep 16) retired Sep 18".
- **What the same page publishes:** the TH26 block, with 191/191 constituents on PriceCharting dated solds (`indices.json` TH26, inception Sep 25), a top-10 table of dated sold marks, and the chase strip.
- **Why it matters:** the Sep 18 sentence was true when written and is now false on the most-read page. R6: not in STATE's TH26 build notes or the ledger.
- **Remedy:** delete the clause, or date it ("as of Sep 18").

### FINDING 5 — LOW · `/is-pokemon-151-worth-it` reads PriceCharting's 30-row cap as a monthly volume.

- **The claim:** "Every chase card here **trades 29 or 30 times a month raw**".
- **The page's own table:** Blastoise ex 200 shows "30 sales, **Sep 20–25**", i.e. six days, and Charizard 30 in 13 days. The page's own tape note says "the tab caps at 30".
- **Its sibling page says the opposite:** `/umbreon-ex-worth` states "Thirty is a cap, not a month".
- **Direction:** this understates liquidity, which is why it's LOW. It's still a coverage-style claim the data doesn't support.
- **Remedy:** "at least 29–30 sales in the last 1–4 weeks". A league agent owns the page, so the league integrator or the desk makes the one-line edit. R27: agents never edit a page they didn't create.

---

## CHECKED AND CLEARED

- **`/is-pokemon-151-worth-it` sealed shelf:** re-ran the page's own query through `/api/comps` (tool header, `category_ids=183456`). 96 total, 47 priced in the returned 50, **median $190**, Q1 175 / Q3 215. That's consistent with the page's "$187.50 median, 48 live, Sep 26". The one multi-unit row is out at $1,049. "1 of 207 above a bundle" holds: SV151's #2 constituent is Blastoise ex at $130 (`indices.json`). "39% of the set" = 734.38 / 1,860.20.
- **`/umbreon-ex-worth`:** 5.1x, +29%, $4,124 gap, 28.5% basket share (1,250.46 / 4,389.23) and PRIS25 98.04 all reconcile to `indices.json`. R18 shape holds: graded medians are from grade-named rows. **Not filed:** "Four different cards carry the name Umbreon ex". A PriceCharting search returns 28 "Umbreon ex" items, but I couldn't separate prints from variants and non-ex cards from a cloud fetch. An unverified count isn't a finding; the desk may want one look.
- **`/bowman-2026-index`:** R8 is clean. It names May's paper Bowman #CPA- as where the class's 1st Bowman Chrome Autos live. "Every 1st Bowman Chrome Auto… 91 cards" rests on STATE's stated assumption that every May CPA is a 1st (no May flag file yet). STATE assigns that to the Tuesday lane. Not re-filed. Method text says "blended eBay + TCGplayer" (a Pokémon-template phrase) on a SportsCardsPro sports index. Noted, not filed.
- **`/bowman-bangers`:** "Ranked by the last printed sale" over SCP raw values, the "RAW SOLD" tape and the footer "sourced from … SportsCardsPro raw solds" are all `iw-2026-09-24-2`, **queued to the Tuesday lane Sep 29**. Not re-filed. Holliday "ask mark $165 → $149.99, −9.1%" is in the pre-R20 Sep 22 column (same reasoning as the Sep 24 run). R18 graded cells hold ($650 Sep 7; $720 Aug 6, restored with a correction; $492 Aug 17; others "no verified sale").
- **`/`:** board levels match `indices.json` (PB26 84.72, CR26 93.17, AH26 93.88, PRIS25 98.04, DR25 95.75, PF25 100, and the five sector tickers 100.00 Sep 25). Nav "Ethan Holliday 1st Bowman" (R9 shorthand) is in STATE's Content Editor queue; not re-filed. The Bangers 30D composite is labelled ask-basis on the chart. OK.

## STUMBLES — mine, this run

1. **My first two ledger greps iterated over the keys of `pipeline.json`, not `proposals`.** Both came back empty and meant nothing. I caught it before writing, re-ran them against the 180 proposals, and that is where the Finding 3 lineage (`-17-3`, `-19-4`) came from. If I hadn't caught it, Finding 3 would have been filed without its R6 history.
2. **I first queried `/api/comps` without `category_ids`,** got 0 listings for the 151 bundle, and nearly read that as "the page's $187.50 has nothing behind it". The API defaults to sports category 212. Re-run on the Pokémon sealed category, it matches the page. Withdrawn before filing.
3. **I started to check BOW26/BCB26 against the R20 hold,** as the Sep 24 run did. Both were replaced on Sep 25; the hold no longer applies. My prompt's SV151 caveat is stale the same way: SV151 is live.
4. **Part B covered 6 of ~114 pages plus 2 same-root checks.** The six Sep 26 league pages and the three Sep 27 ones are the unread tail most likely to carry new claims; I read two of them.

## WHAT I DID NOT DO

No git beyond reading. No fix, commit or push. `data/pipeline.json` untouched (R1). No X, vendor or email contact (R10). `/api/comps` was called with `X-ShopCardHub-Client: tool` (R17), and no listing titles are copied here. **Proposals staged:** `claude/cos/integrity-watch-2026-09-28-proposals.json`, five entries, `awaiting-cos`.
