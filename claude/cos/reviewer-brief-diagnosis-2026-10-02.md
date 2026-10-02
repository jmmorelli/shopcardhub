# CoS diagnosis — outside "UI/UX + Distribution Brief" (received Oct 2 2026)

**Mo's instruction (Oct 2, ~15:45 PT):** diagnose what the reviewer said and the holes in the site against it; "you are in charge and I approve whatever you want to do."
**Method:** every claim checked against a fresh clone (`e1a6b6a`) and an Oct 2 production render of 9 pages at 390 and 1280 px, plus the project record (STATE, LANE-RULES, the Sep 14 outside audit and its Sep 15 response, Mo's rulings Sep 15–Oct 2).
**Shipped from this diagnosis the same hour:** `15e09fb` (below). The rest is assigned, with owners, or declined on a standing ruling.

## 1. The one-paragraph read

The reviewer is right about the thing that matters and wrong about several details. Right: the edge is the set index plus the public scorecard, and the UI still hides both — the scorecard was not in the rail or the primary nav, the six highest-traffic Pokémon index tables were unreadable on a phone (price, star and Listings button all off-screen), the Bangers Signal column was clipped to "HOL"/"PAS" on a phone, and the home page lists every ticker twice (board, then the CHART panel's ticker column) with two email captures. Wrong or stale: the reviewer still calls the watchlist "the Vault" (renamed Sep 25), says COMC is part of the affiliate layer (there is no COMC link on the site — 0 of 141 pages; Mo's rule), credits the Bangers board with supply and z-scores (those are engine screens, not the board), and recommends Reddit cross-posting, which Mo parked on Sep 29 ("reddit is weak"). The distribution half is mostly things we already run (image posts, the Tape as the Monday close, "is it worth it" pages via League B) plus three things we don't that are cheap and R25-compatible: an embeddable index badge, a 14/30-day post-release index note on the release pages, and a monthly "calls we got wrong" post.

## 2. Claim by claim

Verdicts: **TRUE/FIXED** (real, shipped today) · **TRUE/ASSIGNED** (real, owner named) · **PARTLY** (already there in part) · **DONE** (already live before the brief) · **RULED OUT** (contradicts a standing Mo ruling) · **WRONG** (factually off).

### UI/UX diagnosis

| Reviewer claim | Verdict | Evidence |
|---|---|---|
| Homepage density too high; near-duplicate index listings (table, chart strip, tape, movers, screen); "what do I do here?" not answerable in 10 s | **PARTLY / ASSIGNED** | Above the fold is already the reviewer's shape: H1 + one-line pitch + three doors + the index board with sparklines (Sep 25/27 simplify plan). Below it the CHART panel re-lists all 31 tickers with 1W/1M, the TAPE strip lists them a third time, and there are two email captures (`sch-signup` under the board + the legacy `#newsletter` block). Phone: 9.9 screens (target ≤ 8). → **Night Crew B32** (fold the CHART ticker column to the selected row + a picker; delete `#newsletter`; already top of its backlog as "one capture" and "≤ 8 screens"). |
| Visual hierarchy weak; sparklines/imagery/log charts under-weighted vs pipe tables | **PARTLY** | Board has sparklines; every index page has a log-scale chart and a plain-English read above the table (Sep 27/30); chase strips carry card photos. True on the home chart panel and the Bangers deep dives. Folded into B32 / the Bangers phone fold (U-F9, Tuesday lane). |
| Mobile risk high: wide boards collapse or horizontal-scroll; no progressive disclosure | **TRUE / FIXED** | Oct 2 render at 390: the six chase-index tables (PB26 CR26 AH26 PRIS25 DR25 PF25 — the top Pokémon landers) showed rank · card · rarity only; price, Since Launch, ★ and Listings were past the right edge with no cue. Bangers board Signal chip clipped. **Shipped `15e09fb`:** `site-fixes.css` §16 (chase tables stack per row: rank · card · price / rarity · since / ★ · Listings · Bid) and §17 (Bangers: rank · photo · name over price · signal, no sideways scroll). Live-verified: table scroll 0, page width 390, 0 errors. The 24 sector pages already had this (§10, Sep 29). |
| Unique assets buried: track record, how-prices-work, Tuesday Tape below the data wall; scorecard not a primary CTA | **TRUE / FIXED (nav)** | Track record was only under Tools & Guides in the dropdown. **Shipped:** rail row "Track record" on `/`, `/indices`, `/bowman-bangers`, `/watchlist` with a build-time pill. Honest limit: under long-hold grading no 6-month grade exists yet — the pill reads **"Dec 12"** (first grade due) and flips to **R–W** automatically once a thesis leg is graded (`build-rail.mjs`). The Tape is already the rail's fifth row and on every strip page. |
| Vault: no cloud sync, alerts, or share path, so it doesn't compound | **PARTLY / RULED OUT for now** | Share-to-X exists (Jul 28). "Email me when my cards re-mark" exists on the watchlist (R26, Sep 26). Zero-knowledge sync was approved Sep 15 and parked under R25 (no new surface until clean visitors move; Sync & Alerts Engineer retired Oct 1). Mo's Sep 25 ruling: don't compete with PSA's free portfolio tool; indices are the strength. Stays parked. |
| Buy path is link-out only; no "comps vs live ask" delta that makes the click a decision | **PARTLY / ASSIGNED** | Ledger #34 chip (cheapest fixed-price listing vs the dated sold mark) is live on the Pokémon index tables since Sep 27 — the reviewer missed it. Not on sealed rows: buy strips show ask vs MSRP, not vs a sold median. → **Ledger #50** (sealed row on PriceCharting sold data, Oct 7 weekly) gives the spread. "Only surface the eBay link when the spread is labelled" is **declined** — R11 puts a sealed link above the fold on every commercial page regardless; a missing label must never hide the money link. |

### UI/UX recommendations (ordered by the reviewer)

| # | Recommendation | Verdict | Where it lands |
|---|---|---|---|
| 1 | Three-block above-the-fold home | **PARTLY** | Doors + board already there. The "this week's tape, 3 bullets" block is the Bowman movers/tape panel below the board. B32 removes the duplicates rather than adding a block. |
| 2 | Chart-first set/card pages, tables secondary, thumbnails | **DONE (set pages) / PARTLY (card)** | Plain read → log chart → chase strip → table on every index page; `/card` has the PriceCharting history chart (Sep 30). Tables-behind-a-tab: declined, the table is the index's constituent list and must stay visible (citability). |
| 3 | Mobile board pattern, freeze the signal column, test at 390 before shipping | **FIXED** | §16/§17 above. Testing at 390 is already a gate (image-sweep nightly + Site Sweep daily). |
| 4 | Promote the scorecard; "graded in public at 6 and 12 months" under every BUY | **FIXED (rail) / DONE (line)** | The sentence is in the Bangers legend and the hero. The rail row is live. |
| 5 | Vault 1.1: encrypted export link + price-zone alerts via the Tape list | **RULED OUT (R25) / PARTLY (R26)** | See above. |
| 6 | Decision layer on affiliate links | **ASSIGNED** | Ledger #50 (sealed sold median) + #34 chip already live on singles. |
| 7 | First-run tour; auto-pin a new index for 7 days | **ASSIGNED (pin) / DECLINED (tour)** | Pin → **Night Crew P19**: a ticker whose inception is < 14 days old gets a NEW tag and the top slot of its group on the home board (TH26 today). Tour: a modal is a surface (R25) and Mo's Sep 27 ruling is fewer things, not more. |

### Distribution

| Recommendation | Verdict | Where it lands |
|---|---|---|
| Tuesday Tape as the engine: 1 close, 3 movers, 1 self-graded miss; cross-post to Reddit + Discords | **DONE (shape) / RULED OUT (Reddit) / Mo's (Discord)** | The Tape has been the Monday close since Sep 29 (R26). Reddit: Mo, Sep 29 — "reddit is weak", don't re-propose. Discords are Mo's own accounts; the League D brief already covers pastes he approves. |
| Visual index posts, not links; same asset as a 20-s vertical | **DONE (X) / PARKED (video)** | Every @shopcardhub post ships with an image (Sep 3 rule; `make.py` levels/drawdown cards). Vertical video = Ledger #1 (faceless channel), parked; revive trigger unchanged. |
| Release-calendar: a canonical "what the index did after release" note at 14 and 30 days | **ADOPTED → League A** | Ledger #53. Release pages exist for every dated drop; A appends a dated "14 days after release: <TICKER> at X" block, then 30 days, from `indices.json` — no new page, no new nav. First candidates: TH26 (Sep 16 release, 30-day note due Oct 16), Bowman Chrome (Sep 9), Bowman Football (Sep 30 → Oct 14). |
| Embeddable index widget / image badge | **ADOPTED → desk, week of Oct 5** | Ledger #52: `/badge/<ticker>.svg` generated from `indices.json` in the nightly publish step (level · week Δ · "sold comps only" · dated), one copy-paste `<a><img>` snippet in each index page's Methodology block, UTM-tagged so GA4 counts referrals. Makes the index citable (R25-allowed) and is the asset the D feed-offer pitch needs. |
| Public scorecard threads: monthly "calls we got wrong" | **ADOPTED → X Daily lane** | The record already says it: Pokémon ranges 1 of 9 hit, projection bias "ran HIGH"; the sports verdicts are still early (first grade Dec 12). First post drafted for Mo's go in the next X daily batch; monthly thereafter on the first Tuesday after the Tape. |
| Breaker / newsletter swaps (free index paragraph for a Tape mention) | **ADOPTED → League D** | Added to the D brief as the second pitch type beside the feed offer; sends only on Mo's per-batch yes (R27 Am. 1). |
| "Is it worth it?" pages for indexed sets only | **DONE** | League B's thesis since Sep 26 (`/is-pokemon-151-worth-it`, `/umbreon-ex-worth`, …), index chart + dated footer on each. |

### 30-day plan and metrics

Week 1 (home three-block + mobile rows + track record in nav): mobile rows and the rail shipped today; home de-dup is B32. Week 2 (chart-default + spread badge): chart-default is done; spread on sealed = #50 Oct 7. Week 3 (Tape → image template, first "calls we missed" thread): image template exists; thread → X lane. Week 4 (release recap template + badge): #53 and #52 above. Metrics: the reviewer's four are already the program's — list adds (R26, Tuesday footer), index-page organic sessions (league board), EPC by custom ID (R22 desk read; `-bm`, `-chase`, `home-*`), 7-day return to watchlist (GA4 returning share). Nothing to add.

## 3. What the reviewer got wrong (so nobody "fixes" it)

- "Vault" — it is the **Watchlist** (Sep 25); the word stays only in script filenames.
- "Affiliate layer (eBay Partner, Amazon, COMC)" — **no COMC on the site** (Mo, Sep 26); 0 links on 141 pages. Amazon is retail search links on the 30th page only. Fanatics (Impact) is the second lane and the reviewer missed it.
- "Bowman Bangers board with supply, z-scores" — the board is price · signal · verdict; supply/z live in the engine screens on home.
- "Public call grading RIGHT/WRONG/FLAT at 6/12 months" as a current count — correct rule, but **no call has reached 6 months**; the only final grades are the retired Pokémon ranges (1 hit / 8 missed high). Any nav count before Dec 12 would be invented.
- "Index starts at 100 on release" — true for Pokémon and Bowman since Sep 30 / Oct 1; the reviewer's PB26 68.1 figure is the Sep 28 mark on the new base, so they read the live site, good.

## 4. Shipped today — `15e09fb` (site, deploys)

- `css/site-fixes.css` §16 chase-index phone rows (6 pages tagged `.chase-tbl`), §17 Bangers board phone rows; rarity chip 8.5 → 10.5 px, card number 9 → 11 px on those tables (§12 floor).
- `data/rail.json` + `tools/build-rail.mjs`: "Track record" row, pill from `data/calls.json` (first due date now; R–W once graded). Rail re-baked on 4 pages.
- Gates on the pushed tree **0/77 · 0/4 (141) · 0/1** = baseline. Trees matched cloud/Mac (`d236ba7`). Live-verified ~2 min after push at 390: `/pitch-black-index` row width 342, table scroll 0, page width 390; `/bowman-bangers` row 308, scroll 0; rail pill "Dec 12" on `/`. Rollback: `git revert --no-edit 15e09fb`.

## 5. Assigned (no new scheduled run, no new nav item)

| Item | Owner | Due |
|---|---|---|
| B32 home de-dup: CHART panel ticker column → selected ticker + picker; delete legacy `#newsletter`; phone ≤ 8 screens | Night Crew | next shift (Oct 3 00:47) |
| P19 NEW tag + top-of-group slot for a ticker < 14 days from inception | Night Crew | with B32 |
| #52 embeddable badge `/badge/<ticker>.svg` + snippet in each Methodology block | CoS desk | week of Oct 5 |
| #53 14/30-day post-release index note on release pages | League A | TH26 30-day Oct 16; Bowman Football 14-day Oct 14 |
| "Calls we got wrong" post (monthly) | X Daily lane | next batch, Mo's go |
| Newsletter-swap pitch type | League D | Wed Oct 7 batch, Mo's yes |
| Sealed spread (sold median vs ask) | Oct 7 weekly | Ledger #50, unchanged |
| Bangers phone hero fold (U-F9) | Tuesday lane | Oct 6 |

## 6. Declined, with the ruling

Reddit cross-posting (Mo Sep 29) · Vault cloud sync / alerts beyond R26 (R25, Mo Sep 25) · first-run tour modal (R25; Mo Sep 27 "fewer things") · hiding the eBay link until a spread is labelled (R11) · tables behind a tab on index pages (citability) · Shorts/TikTok/Reels (Ledger #1 parked; Mo's accounts, no trigger met).
