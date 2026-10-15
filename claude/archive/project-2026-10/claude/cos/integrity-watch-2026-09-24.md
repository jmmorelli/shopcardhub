# Integrity Watch — 2026-09-24

HEAD 8f92ab0 · origin/main 8f92ab0 · delta 0 · gate WARN 76/3/0 vs baseline 76/3/0

Fresh HTTPS clones this run: `/tmp/iw` (main, `--depth 30`) and `/tmp/feed` (`price-data`). `git ls-remote origin
refs/heads/main` = `8f92ab05ec4d…` = local HEAD at start and again at 12:10Z. Gates on that clone: `audit-prices`
0 FAIL / **76 WARN** · `audit-site` 0 / **3** · `audit-terminal --feed` 0 / **0** (1 `feed-unavailable` without
`--feed`, as expected). That is exactly the Sep 22 baseline STATE restates (0/76 · 0/3 · 0/0). Read at STEP 0:
LANE-RULES (**R1–R24** — my prompt still says R1–R11), STATE, NEEDS-MO. Ledger: `data/pipeline.json`, 160 proposals.

**Prompt vs file (file wins, R-precedence):** R19 says lanes read the feed from `https://www.shopcardhub.com/feed/`,
not raw.githubusercontent — Part A below does that. `ga4-*.json` read from the `price-data` clone, as R19 says.

**Headline: 0 new FAIL · 2 HIGH · 3 MED · 1 LOW — and two older FAILs still live because they never reached the
ledger.** Finding 1 is the one that matters most: the Sep 19 and Sep 20 Integrity Watch proposals (8 items, 2 of
them FAIL) were never appended to `pipeline.json` or ruled anywhere in STATE. The desk caught the same miss for
Sep 21 on Sep 22 ("never entered the ledger; entered and ruled now") and did not look back two more days.

---

## PART A — INSTRUMENTS

### Price feed — clean. Nothing zero, nothing down.

`/feed/prices-latest.json` day **2026-09-23**, generated 13:39Z — 22.5 h old at 12:05Z; today's nightly has not
fired yet. Not a gap. Live `/feed/` copy and the `price-data` branch are byte-identical on `generated`.

**The Part A baseline I warned about for four runs is gone.** The `price-data` history reset on Sep 23 (`6cd29fc`,
Mo's "scrub history" ruling) left one commit, so trailing medians for signal and gate counts can no longer be
rebuilt from git. Where a per-day series survives inside `prices-history.json` I used it; where it does not, the
comparison is against this lane's own filed numbers (Sep 17–21 reports). See Finding 6.

| Instrument | Today (Sep 23 obs) | Trailing reference | Verdict |
|---|---|---|---|
| Cards in feed | **41** | 38 (Sep 21 report) · 33 (hist-derived median, Sep 9–22) | OK |
| Cards with numeric `last` | **36** | **30.0** = trailing-14 median of daily priced counts in `prices-history.json` | OK, +20% |
| Cards with a signal | **41** (HOLD 30 · SELL 9 · BUY 2) | 38 (Sep 21) | OK |
| Gated | **10**, all publishing HOLD | 10 (Sep 21) · 8 (Sep 18) | OK — no gated card leaks BUY/SELL (`signalRaw` BUY 3 → published BUY 2) |
| Auction closes recorded (cumulative, `market-latest`) | **242** | 173 (Sep 21) | OK |
| Auction closes that day (from `listings-history` `endDate`) | **42** on Sep 23 | 23.0 (trailing-14) | OK |
| Live auctions watched | **163** | 157 (Sep 21) | OK |

### Index cadence — every live ticker inside its cadence, or held under R20

| Ticker | Last mark | Age | Rule | Verdict |
|---|---|---|---|---|
| PB26 · CR26 · AH26 · PRIS25 · DR25 | 2026-09-21 (Mon) | 3d | weekly Monday re-mark (PriceCharting solds — R20: re-mark as normal) | OK |
| PF25 | 2026-09-18 (inception) | 6d | weekly | OK — first re-mark due Mon Sep 28 |
| BCB26 | 69.52 · 2026-09-22 | — | **R20 hold**, `heldSince` 2026-09-22 | OK — page shows *"Held since Sep 22, 2026 — this index is moving to a sold-price basis"* |
| BOW26 | 98.29 · 2026-09-21 | — | **R20 hold**, `heldSince` 2026-09-21 | OK — livebar *"BOW26 · HELD at the Sep 21 level"*; `bowman-1st-chrome-index.html:774-776` filters out any level past `heldSince` |

A held index is not a missed mark; the cadence test is suspended for both until the Sep 30 rebuild (R21). SV151:
not in `data/indices.json`; `git ls-files | grep -i sv151` returns only the spec, screen and universe files (R7). Not checked.

### GA4 — alive; one cliff underneath a flat headline (Finding 5)

`ga4-latest.json` generated **2026-09-23T13:55Z**, 22.2 h old — inside 36 h; `summary.bots` present, so the Sep 20
filter is running (the Sep 21 tripwire did not fire).

| Instrument | Value | Trailing | Note |
|---|---|---|---|
| `keyEventsYesterday` / `sessionsYesterday` (Sep 22, **unsettled**) | 8 / 30 | 53 sessions (history median) | Not zero → no FAIL. Unsettled row — see iw-2026-09-20-2, still unfixed |
| Newest settled day (Sep 21) | 1 KE on 40 sessions | — | Low, not zero |
| `clicks7` | **44** | 42 · 42 · 39 | OK |
| `organicKeyEventRate7` · `blendedKeyEventRate7` | **11.19%** · **6.32%** | 9.72 / 5.04 | both rising (denominator shrinking — see F5) |
| `returningShare7` | **3.80%** | 5.42 → 4.31 | falling; bot-diluted (clean ~7.3% per STATE) |
| `nonUSTopCountry7` | **Singapore 141 sessions @ 0.147 s = 83% of US (169)** | 104 (Sep 21) | Over the 40% bar. **Ruled — not filed** (cos-2026-09-20-1 applied the filter; cos-2026-09-20-4 Mo declined edge block). Bot share 44.7%. |

Backstop: the post-split STATE records no human GA4 UI read (the desk and weekly quote the snapshot). The last one
on record is Sep 18 (per the Sep 21 report, now in the archive): 6 days, inside the 14-day bar. Due by Oct 2.

---

## PART B — CLAIMS

Six pages: **`/`**, **`/bowman-bangers`** (mandatory), **`/how-prices-work`**, **`/bowman-1st-chrome-index`**,
**`/bowman-chrome-2026-index`**, **`/topps-pristine-baseball`** — none covered by the Sep 17–21 runs; the two Bowman
index pages chosen because R20 changed what they may say yesterday, `/how-prices-work` because it is the page that
defines every other number. Plus live status checks on eight unledgered prior findings. Every finding below was
re-fetched and reproduced on `www.shopcardhub.com` at **12:09–12:10Z** immediately before filing (R5). None sits
in a client-repainted block.

---

### FINDING 1 — HIGH (process) · The Sep 19 and Sep 20 Integrity Watch proposals never entered the ledger. Both FAILs are still live, 5 and 4 days on, and one has spread.

`pipeline.json` holds `iw-2026-09-19-3` (applied) and nothing else from those two days. `grep` of STATE and
STATE-ARCHIVE for `iw-2026-09-19` / `iw-2026-09-20` finds only the 19-3 line. STATE's "0 `awaiting-cos` in
pipeline" is true and misleading: the items were never in it to await anything. The desk's Sep 22 inbox noticed
exactly this for the Sep 21 filing and fixed that one day only.

Live status, checked this run:

| Staged item | Status today |
|---|---|
| **iw-2026-09-19-1 FAIL** — engine blocks print "Hammer med" / "What buyers paid" / "hammer capture began…" over last-bid data, plus `% vs ask` | **Live and wider.** `git grep` now finds it in **10** HTML files (was 8): adds `cards.html` and `topps-chrome-black-basketball.html`. Generator unchanged (`tools/build-engine-blocks.mjs:215,220,235-236`; `js/engine-block.js:147`). Live counts: Holliday 6, pokemon-30th 6, chaos-rising 3. |
| **iw-2026-09-20-1 FAIL** — `/best-football-cards-under-50` withdraws the $1,349 Black Shimmer sale and restates it in its deep dives | **Live.** "a Prizm Draft Black Shimmer 1/1 sold for $1,349" still served. |
| iw-2026-09-19-2 HIGH — Definitive Basketball strip shows an ask over a "Box Price TBA" page | **Reproduced.** `buy-strip.json` `live:true`; `/api/comps` (tool header, R17) returns 7 listings, min **$14,500**, median $14,799.99; body still says "Box Price TBA · Comps None yet". |
| iw-2026-09-19-4 MED — `/indices` "Five tickers mark on sold comps, two on verified asks" | **Live** in meta + JSON-LD. True count is six of eight (PF25 is sold-basis). |
| iw-2026-09-19-5 MED — board liquidity counters static | **Resolved in substance.** Kim's seat now reads "no printed sale since Aug 5"; "41 days" survives only inside the dated Sep 15 column. Recommend close. |
| iw-2026-09-19-6 HIGH — Singapore bot cluster | **Superseded** by cos-2026-09-20-1 / -4. Recommend close. |
| iw-2026-09-20-2 HIGH — GA4 summary reads the unsettled day | **Unchanged.** `tools/ga4-snapshot.mjs:161` still takes `rows.at(-1)`; no `provisional` flag anywhere. |
| iw-2026-09-20-3 LOW — board `keywords` meta "1st Bowman cards 2026" | **Live.** |

**Ask of the CoS:** append all eight from the Project docs `integrity-watch-2026-09-19-proposals.json` and
`-09-20-proposals.json`, rule them, and add "last three Integrity Watch proposal files" to the desk inbox check
rather than "since the last desk run". Not a re-file: nothing here was ever ruled (R6).

---

### FINDING 2 — HIGH · `/bowman-bangers` says it ranks on "the last printed sale". The number it ranks on is SportsCardsPro's guide value, and the page's own prose proves the two differ. The vendor feed labels that guide value `rawSold`.

Live at 12:09Z. Heading: **"Ranked by the last printed sale · 30-day liquidity gate"**; tape column credit
"(SportsCardsPro raw solds)" ×4. What the page itself says about the seat numbers:

- **Fischer, #1:** "Fischer +4.2% to $154.60 **but his last printed sale is still Sep 14**" — a figure that moved
  4.2% with no sale behind the move is not a printed sale.
- **Gonzales, #3:** "$92.00 → $91.25 … his last three printed sales were **$79.99 (Sep 21), $72.00 (Sep 17) and
  $42.01 (Sep 14), all below the number the guide is carrying**" — the page calls its own seat price "the guide".
- **Florentino, #4:** "The guide read $70.00 again, unchanged since Sep 1" beside five printed sales Sep 15–17
  ($89.99, $69.00, $70.00, $62.00, $80.00).
- Price cells read "SCP raw $155 · engine $201 …" — honest at cell level; the defect is the ranking rule and the
  words around it.
- `data/board-history.json` Sep 22: "Fischer holds #1 on a **$154.60 printed sale** (+4.2%) but has not printed since Sep 14."
- **`/data/x-board.json` (the vendor's feed):** `rankingRule` "the last printed sold price"; seat 1
  `marks.rawSold: "$155"` beside `lastPrintedSale: null`. Grok reads this and posts publicly.

**Why this is the founding defect class:** a modelled guide figure published as a sale, on the mandatory page,
feeding a public posting channel. It is milder than the Sep 16 graded ladder (the SCP raw figure is derived from
real raw sales, not a grade multiplier), which is why HIGH and not FAIL. R20's table says board seats rank on
"last printed sold price (already the rule)", so the rule and the data already disagree under R20.

**Seat impact, unverified:** on actual last prints, Gonzales ($79.99, Sep 21) and Florentino ($89.99 or $69.00,
both Sep 17, intraday order unknown) could swap. I cannot settle that from a curl and I am not claiming it.

**Remedy shape (for the Tuesday lane, Sep 29):** either rename the rule to what it is ("SportsCardsPro raw
value, 30-day liquidity gate") everywhere including `x-board.json` (`rawSold` → `rawGuide`), or rank on the
dated last print the page already quotes. R6: `kim-unrankable-clock` and `xbi-2026-09-21-1` touch last-print
wording on single seats; neither covers the ranking basis. Sep 17 IW stumble 2(a) called SCP raw "solds"; this
run's evidence overturns that in part, and I say so.

---

### FINDING 3 — MED · `/how-prices-work` says every set index is sold-basis and re-marked Mondays, four times. Two of the eight are ask-basis and neither is being re-marked (R20 hold).

Live at 12:10Z (`how-prices-work.html:755, 790, 793, 822`):
1. "the marking basis for **every set index**" (sold comps)
2. "Each set index is **a basket of sold marks** divided by a divisor"
3. "**Re-marked every Monday from sold comps.**"
4. "Every covered set as a ticker — **sold-basis**, divisor-continuous, re-marked Mondays."

`data/indices.json`: BCB26 `basis: "ask"`, BOW26 `basis: "ask"`, both `heldSince` set. This is the third page of
the same class: `iw-2026-09-17-3` (`/indices`) and `iw-2026-09-21-2` (home, applied `585028e`) fixed their copies;
this is the page that defines the vocabulary. **The weekly patch `6e69d39` touched this file yesterday**
(PF25 link colour only) while shipping R20 held lines on the index pages, and did not read its prose. Fix: name
both bases and the hold, as home now does. MED, matching the home ruling.

---

### FINDING 4 — MED · `/topps-pristine-baseball` still talks in "week one" six weeks after release, and its search snippet sells an "$800+ secondary" off August pre-sale data.

Live at 12:10Z. Released Aug 12 (page's own date). The page says "Per-card sold comps — **Thin inside week one**",
"Singles remain the precision tool as **first-week comps form**", "rows stay qualitative until per-card solds
cluster (typically 2–3 weeks post-release)", and the meta/og description: "three autographs per hobby box,
$539.99 direct pricing and **an $800+ secondary**". The only price stamp is "Box pricing as of Aug 17, 2026" —
**38 days**, no machine stamp, so the freshness gate cannot see it. "$800+" is the "~$800 pre-sales" figure from
before release. R6: not in `audit-2026-09-07-1`'s list and not in any Pristine proposal (none exist); STATE's
queued "Pristine body → release-day state" is the **basketball** page (Sep 24 street). Fix: re-read and date the
secondary, or drop the number from the snippet; retire the week-one tense.

---

### FINDING 5 — MED (instrument) · US sessions halved in one step on Sep 19 and have stayed there. The headline session count hides it because bot sessions fill the gap.

`reports.countriesDaily7`, US sessions per day: **Sep 16 35 · Sep 17 38 · Sep 18 33 · Sep 19 16 · Sep 20 17 ·
Sep 21 16 · Sep 22 15** (last day unsettled; Sep 19–21 are settled). Mean before 35.3, after 16.0: **−55%**. Just
under this lane's 60% FAIL line. Meanwhile `daily28` sessions read 59 · 54 · 40 · 30 because Singapore + China
were 42 · 33 · 21 · 10 on those days. Before the bots, whole-site sessions Sep 10–15 were 45 · 44 · 31 · 26 · 32 ·
45, so ~16 US a day is below the pre-bot level too, not just below a Sep 16–18 bump. Key events held up (5 · 6 ·
1 · 8), which is why the organic key-event rate "improved" to 11.19%: a smaller denominator, not better conversion.

**No cause claimed.** Candidates: a Bing ranking change (Bing is 77 of 134 organic sessions/7d), or something
shipped Sep 18–19 affecting the tag. `sessionsYesterday` cannot show this while bots are in it. Ask: the desk
reads Bing Webmaster clicks by day for Sep 14–23; and `ga4-snapshot.mjs` should publish `usSessionsYesterday` or a
clean (bot-excluded) daily series so this lane can median it. R6: STATE's top problem #2 notes "traffic small and
45% bots" but not the step; nothing in the 160 covers it.

---

### FINDING 6 — LOW · The price-data history reset removed this lane's Part A baseline for signal and gate counts, as predicted four runs running.

Not a complaint about the ruling (scrub history, stay public — Mo, Sep 23; not re-opened). The consequence:
`prices-latest.json` carries no history of its own counts, so "cards with a signal" and "cards gated" now have no
trailing median except this lane's prose reports. Ask: the nightly appends one row
`{day, cards, numericLast, signals{BUY,HOLD,SELL}, gated, closesCum, watching}` to a small log on `price-data`
(or into `data/feed/`), so the medians survive the next squash.

---

## CHECKED AND CLEARED

- **`/`** — Markets levels match `data/indices.json` exactly (PB26 84.72, CR26 93.17, AH26 93.88, PRIS25 98.04,
  DR25 95.75, PF25 100.00, BCB26 69.52, BOW26 98.29). The disclosure paragraph now names both bases
  (iw-2026-09-21-2 holding). Static shell says "feed Sep 22"; the feed is Sep 23 — repainted client-side, not
  verifiable without a browser, not filed.
- **`/bowman-1st-chrome-index`** — R20 hold implemented in both the livebar and the render path. Clean.
- **`/bowman-chrome-2026-index`** — held line present, basis labelled ASK, "re-marked 09/22/26". Clean. Level fell
  95.67 → 73.14 → 69.52 (−27% since Sep 15) on ask marks before the hold. Not a Part A cliff (<60%), noted.
- **`/bowman-bangers` graded figures** — R18 shape holding: Fischer "$650.00 (dated sale, Sep 7 2026)", Florentino
  "$492.00 (dated sale, Aug 17 2026)", others "no verified sale"; Holliday $720 struck with a dated correction.
- **Board verdict vs engine signal** — Holliday Verdict Hold vs engine SELL; Fischer Hold vs BUY. Under R20 the
  board must not take engine asks as an input, so disagreement is correct. The "Signal" column confusion is queued
  (home "Signal" → "Engine (asks)"; engine calls leave public pages Oct 7). Not filed.
- **"ask mark −15.4%" in the board headline** — an ask % on the board, published Sep 22, the day before R20. The
  Sep 29 board is the first under R20, and STATE has the ENGINE ASK item queued to that run. Not filed.

## STUMBLES — mine, this run

1. **I almost checked BCB26/BOW26 cadence as missed marks.** Both are R20-held; the prompt's cadence test predates
   R20. The prompt should say "held tickers are exempt until their R21 date".
2. **My first grep for "TBA" on the Definitive page matched nav text**, not the body. Re-read the body text:
   "Box Price TBA · Comps None yet" and "Checklist & config TBA · no comps" are both still served.
3. **I nearly re-filed iw-2026-09-19-5 as still live** on the string "41 days". It now sits only inside the dated
   Sep 15 column; the seat row was fixed. Reported as resolved.
4. **I nearly filed the Pristine baseball page for the "Sep 24 street" STATE mentions.** That is the basketball
   page (weekly patch diff confirms). Withdrawn before filing; Finding 4 is about the page's own claims only.
5. **Finding 2 partly overturns this lane's Sep 17 clearance** that called SCP raw figures "solds". I am naming it
   rather than letting the two reports quietly disagree.
6. **Part B is 6 pages of 104**, plus status checks. The long tail went another run unread.
7. **Finding 5's window is 7 days** (`countriesDaily7` is all the file has). The step is clear inside it; the
   pre-Sep 16 US comparison is inferred from whole-site totals before the bots, and I say so.

## WHAT I DID NOT DO

No git beyond reading; no fix, commit or push; `data/pipeline.json` untouched (R1). No write to X or the vendor
(R10). `/api/comps` called once with `X-ShopCardHub-Client: tool` (R17); no listing content copied here.
**Proposals staged:** `claude/cos/integrity-watch-2026-09-24-proposals.json` — six entries, `awaiting-cos`.
