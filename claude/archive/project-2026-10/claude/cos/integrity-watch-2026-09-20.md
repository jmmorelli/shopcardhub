# Integrity Watch — 2026-09-20

HEAD 663fe85 · origin/main 663fe85 · delta 0 commits · gate WARN 60/3/1 vs baseline 60/3/1

Fresh clone taken this run over HTTPS into scratch (`/tmp/iw`, `--depth 30`); `git ls-remote origin
refs/heads/main` = `663fe85ffb5812f208aafe64b51212506c0caf91` = local HEAD, re-checked at the end of the
run. Not stale, so this report files. All three gates run against that clone this run: `audit-prices`
FAIL 0 / **WARN 60** (31 `no-machine-stamp` · 25 `non-numeric-price` · 4 `stale-prose-stamp`) ·
`audit-site` FAIL 0 / WARN 3 · `audit-terminal` FAIL 0 / WARN 1 (`feed-unavailable`, expected without
`--feed`). **Exactly at the baseline HEAD itself restated** — `663fe85` is the commit that moved it
63 → 60, and the three cleared WARNs are the football pages that gained `data-prices-updated` stamps in
`c0398f9`. Nothing to reconcile.

Read at STEP 0 from that clone: `/LANE-RULES.md` (R1–R11), `claude/cos/STATE.md`,
`claude/cos/NEEDS-MO.md`. Ledger checked: `data/pipeline.json`, 139 proposals.

**Two findings: one FAIL, one HIGH, plus one LOW.** The FAIL is yesterday's own football remediation
reaching the table on a page and not the block 1,500 words below it — two figures the ledger records as
**withdrawn and deliberately not restated** are restated on that page, live, today. The HIGH is this
lane's own instrument: **GA4's freshest row is not settled when the snapshot reads it**, and yesterday's
run filed a finding off an unsettled number that the next night's data has since falsified. I am
withdrawing that finding here rather than leaving it in the CoS's queue.

---

## PART A — INSTRUMENTS

### Price feed — clean, nothing zero, nothing down

Read from the `price-data` branch, cloned with history this run. Latest observation is `day 2026-09-19`,
generated 2026-09-19T12:30:36Z. At the time of this run (2026-09-20T12:03Z) that is 23.6 hours old and
**today's nightly has not yet fired** — the snapshot commits land ~12:30Z. Not a gap; do not read it as
one. Trailing medians are computed from the 14 prior `prices-latest.json` / `market-latest.json` commits
(Sep 5 – Sep 18), not a proxy.

| Instrument | Today (Sep 19 obs) | Trailing-14 median | Δ | Verdict |
|---|---|---|---|---|
| Cards in feed | **38** | 24.5 | +55% | OK |
| Cards with numeric `last` | **33** | 23.0 | +43% | OK |
| Cards with a signal | **38** | 24.5 | +55% | OK |
| Cards gated | **10** | 7.0 | +43% | OK |
| Auction closes recorded | **156** (32 of 38 cards) | 44.0 | +255% | OK |
| Live auctions watched | **165** | 75.0 | +120% | OK |

Nothing is zero. Nothing is down more than 60%. Every series is rising, which is coverage being added
(20 → 29 Sep 12 → 34 Sep 14 → 37 Sep 17 → 38 Sep 19), not drift.

**Gate integrity checked, not assumed.** All 10 gated cards publish `HOLD`; not one gated card carries a
`signal` of `BUY` or `SELL` on any surface. Signals today: 27 HOLD · 10 SELL · 1 BUY.

**Index cadence — every `status: live` ticker is inside its cadence.** Eight live tickers.

| Ticker | Last mark | Age | Cadence | Verdict |
|---|---|---|---|---|
| PB26 · CR26 · AH26 · PRIS25 · DR25 | 2026-09-14 (Mon) | 6d | weekly (Monday scan) | OK — next due Sep 21 |
| BCB26 | 2026-09-15 | 5d | weekly | OK |
| BOW26 | 2026-09-13 | 7d | weekly | OK — at the line, Monday scan is tomorrow |
| PF25 | 2026-09-18 | 2d | weekly | OK |

**SV151 not checked, and my prompt is now correct on it.** My prompt was amended and now says SV151 is
not live and not to be checked until it appears in `data/indices.json` with `status: live`. It has not:
`git ls-files | grep -i sv151` in the clone taken this run returns only `data/sv151-universe.json` and
`data/sv151-screen-2026-09-17.json` (R7 satisfied), and there is no `SV151` key in `data/indices.json`.
`iw-2026-09-17-2` is `in-progress` under Path B. Nothing to file (R6). **Third run reporting this and the
first where the prompt matched the file — the prompt defect is fixed. Recording the close.**

### GA4 — the snapshot is alive, and its newest row cannot be trusted

`ga4-latest.json` generated **2026-09-19T12:44:30Z**, 19.3 hours old at read time — inside the 36-hour
bar. `ga4-snapshot.yml` is alive. Not a finding.

`ga4-history.json` holds **two rows** (days Sep 17, Sep 18). There is still no 14-observation GA4 trailing
median and there cannot be one until ~Oct 2. Every GA4 median below is computed from `reports.daily28`
instead, which is better material anyway — **and, per Finding 2, with the freshest row excluded.**

| GA4 instrument | Value | Trailing-14 median (settled days) | Verdict |
|---|---|---|---|
| `keyEventsYesterday` (Sep 18) | **4** on 54 sessions | — | **provisional, see Finding 2** |
| Key events, newest **settled** day (Sep 17) | **12** on 72 sessions | 0 (the blackout) | RESTORED, holding |
| Sessions, Sep 17 settled | **72** | 44.5 | +62% |
| Engagement rate, Sep 17 settled | **47.2%** | 45.7% | +3% — normal |
| `clicks7` | **38** | 35 (one prior row) | OK |
| `organicKeyEventRate7` | **4.88%** | — | reported beside blended, never alone |
| `blendedKeyEventRate7` | **3.82%** | — | now emitted by the snapshot; I no longer compute it by hand |
| `returningShare7` | **5.41%** | 5.42% (one prior row) | flat; far below the 20%-for-4-weeks unblock trigger |
| `nonUSTopCountry7` | **Singapore, 74 sessions, 0.205 s average** | 61 the day before | **not re-filed — see below** |

**Key events are not zero and the blackout shape does not recur.** The charter's FAIL condition is zero
key events on a day with ≥30 sessions. Sep 17 settled at 12 on 72; Sep 18 currently reads 4 on 54 and is
provisional. No FAIL.

**Singapore — reported, deliberately not filed (R6).** 74 sessions at a **0.205-second** average, **38.1%
of US sessions** and **23.6% of all sessions in the 7-day window**, up from 61 / 31.6% the day before. It
is under my prompt's ~40%-of-US bar and it is rising through it. **It is also already ruled**: the Sep 7
item in `pipeline.json` (approved) routed a GA4 internal-traffic/bot-filter review, STATE's Sep 14
Business Read names it as problem 3 ("GA4 pollution persists (Singapore)"), and STATE's P1 open item is
"read the Singapore cluster's landing pages". Yesterday's run filed it again as Finding 6(a), staged and
not yet appended. **I am not filing it a third time.** One line of consequence, which is the only part not
already on the record: strip Singapore and the 7-day key-event rate on an event-count basis goes from
**7.9%** (19 events / 240 sessions) to the 3.82% the property reports. STATE's "earliest clean baseline
is Sep 24" still assumes one contaminant; this one is still running.

**The old backstop:** STATE's last recorded human GA4 read is **2026-09-18** (the keyless nightly
verification), 2 days old. Well inside 14 days. Nothing to file.

---

### FINDING 2 — HIGH · GA4's newest day is not settled when the snapshot reads it. Sep 17's engagement rate was 8.57% in one night's file and 47.22% in the next. This lane filed a finding off the unsettled number yesterday, and I am withdrawing it.

**Two committed files, same day, same property, different answers.** Both are in `price-data` history and
anyone can re-read them.

`cc36fb7` — `ga4-latest.json` generated 2026-09-18T18:00:17Z, `day: 2026-09-17`, newest `daily28` row:

```
{"date":"20260917","sessions":70,"keyEvents":11,"engagementRate":0.08571428571428572,"averageSessionDuration":156.2795861}
```

`2cbf66f` — generated 2026-09-19T12:44:30Z, `day: 2026-09-18`, the **same** Sep 17 row:

```
{"date":"20260917","sessions":72,"keyEvents":12,"engagementRate":0.4722222222222222,"averageSessionDuration":136.01312173611112}
```

| Sep 17, as read by | Sessions | Key events | Engagement rate | Avg session |
|---|---|---|---|---|
| the Sep 18 snapshot (freshest row) | 70 | 11 | **8.57%** | 156.3 s |
| the Sep 19 snapshot (settled) | 72 | 12 | **47.22%** | 136.0 s |

**Engagement rate was restated 5.5×.** Sessions and key events moved a little; the ratio moved enormously,
because GA4 finishes attributing engagement after it has finished counting sessions.

**This already produced a wrong finding, and it was mine.** Yesterday's Finding 6(b) filed Sep 17 as *"the
28-day engagement floor, 8.57% against a 45.66% trailing median, −81%"* and spent a paragraph on why the
average-session-duration column pointed the other way. The settled answer is 47.22% — **3% above** the
median, entirely ordinary. The lane was right to refuse to name a cause and wrong to file the fact.
`iw-2026-09-19-6` is staged in `claude/cos/integrity-watch-2026-09-19-proposals.json` and **has not been
appended to `pipeline.json`**, so the cleanest remedy is available: **withdraw 6(b) before it is ruled.**
6(a) — the Singapore cluster — is unaffected and stands on its own evidence.

**Why this is a HIGH and not a note.** My charter names `summary.keyEventsYesterday` and
`summary.sessionsYesterday` as instruments to compare against trailing medians, and makes **zero key
events on a day with ≥30 sessions a FAIL** — the Sep 4–16 blackout shape. Those two fields are read off
the least settled day in the file. A morning where GA4 has attributed nothing yet would hand this lane a
zero on a live day and it would file a blackout that does not exist. **That is the failure this lane
exists to prevent, pointed backwards.** Today's own file shows the exposure: Sep 18 reads 4 key events on
54 sessions at a 12.96% engagement rate — which, on yesterday's evidence, is probably not what Sep 18 will
say tomorrow. **I have not filed it, and no lane should quote it.**

**What would fix it, for the CoS to rule on, not for me to do.** `tools/ga4-snapshot.mjs` is the one
place: either emit the summary for the newest **settled** day (day-before-yesterday) alongside the current
block, or mark the freshest `daily28` row and the two `*Yesterday` fields `provisional: true` so a reader
cannot use them by accident. Then the charter's zero-key-events FAIL is evaluated on a settled day. While
that file is open, `ga4-history.json`'s Sep 17 row also carries the stale 8.57%-era figures and should be
restated from the settled read — it is this lane's trailing-median material and it is currently seeded
with one bad row out of two.

**R6 — no existing ruling.** Nothing in the 139 proposals concerns GA4 processing lag; the Sep 18 build
record (`claude/handoffs/ga4-snapshot-2026-09-18.md`, STATE §2) covers the pipeline's construction and
first-run verification, not freshness semantics. Not a re-file.

**R7 — absence claim, and the file already knows.** In the clone taken this run,
`tools/ga4-snapshot.mjs:113` writes both fields straight off the newest row with no settled-day guard:

```js
keyEventsYesterday: (rep.daily28.rows.at(-1) || {}).keyEvents ?? null,
sessionsYesterday:  (rep.daily28.rows.at(-1) || {}).sessions  ?? null,
```

and line 131 stamps every file it writes with its own warning — *"Windows end on 'yesterday'
(**GA4 finishes processing a day ~24h after it ends**)"*. **The tool documents the lag and then reads the
day inside it.** `git grep -in "provisional"` returns nothing in any tool, workflow or data file (one
unrelated prose hit in `data/calls.json`'s grading comment), so no reader of this file has any way to tell
the unsettled row from the settled ones.

---

## PART B — CLAIMS

Six pages this run: `/` and `/bowman-bangers` (both mandatory), plus **`/nfl-rookie-cards-2026`**,
**`/best-football-cards-under-50`**, **`/fernando-mendoza-rookie-cards`** and
**`/phantasmal-flames-index`** — four pages no prior run has covered, continuing the monthly rotation.
Three of the four are the newest shipped work on the site (the Sep 19 football push and the Sep 18 PF25
inception), which is where the risk is. `/ethan-holliday-rookie-cards`, `/indices` and
`/topps-definitive-basketball` were pulled only to report the status of yesterday's staged findings, not
re-audited. All fetched from `www.shopcardhub.com`; **the finding below was re-fetched and reproduced live
at 2026-09-20T12:08:48Z immediately before filing (R5)**.

---

### FINDING 1 — FAIL · `/best-football-cards-under-50` withdraws three claims in one block and republishes all three, 1,500 words lower, on the same page. One of them is the $1,349 sale the ledger records as withdrawn and not restated.

**The page's own correction block, live:**

> **Rewritten September 19, 2026. The previous version of this list recommended Panini Prizm and Optic
> parallels of the 2026 class, and those are the wrong products.** The 2026 NFL draft class is in 2026
> Topps Flagship Football and its inserts. The old list also carried a "+40% post-draft" figure and a
> $1,349 Black Shimmer sale we cannot trace to a dated record; **both are withdrawn and neither is
> restated.**

**The "Deep Dives — The Top Three, Closer Up" block, on the same page, live at 12:08:48Z today:**

| # | What it publishes | Which withdrawal it reverses |
|---|---|---|
| 1 | "Fernando Mendoza **2026 Prizm Silver / Optic Holo RC · ~$12–$45**. Mendoza's cards **surged ~40%** after the draft…" | Prizm/Optic as the 2026 product **and** the "+40% post-draft" figure |
| 2 | "Carnell Tate 2025 Prizm Draft Picks Silver · ~$30–$50. …the high end is already proving out — a Prizm Draft **Black Shimmer 1/1 sold for $1,349**." | the $1,349 sale, restated as a completed sale |
| 3 | "Class Basket · **2026 Draft Class Prizm Draft Picks Silver (college)** · ~$15–$45. **Before the fully-licensed NFL rookie products drop**…" | Prizm again, plus pre-release framing on a class the same page prices on September sales |

**The ledger says this is not allowed.** `cos-2026-09-19-1` is `applied` and its recorded decision reads:
*"The two June figures ($400+ raw Mendoza auto, $1,349 Tate Black Shimmer) are **WITHDRAWN and
deliberately not restated** — same handling as the graded-ladder retraction."* The $1,349 is live on this
page today, as a sale, as evidence for a recommendation.

**The sibling page got it right, which is what makes this a partial fix rather than a disagreement.**
`/nfl-rookie-cards-2026` names both withdrawn figures exactly once, inside the withdrawal sentence, and
never as a claim. `git grep -l "1,349"` in the clone taken this run returns
`best-football-cards-under-50.html` and `nfl-rookie-cards-2026.html`; on the first it appears twice, in
the withdrawal **and** in the deep dive. Same push, same day, same author, one page finished and one half
finished. Both files are hand-authored HTML — `git grep -l "Black Shimmer" -- '*.mjs' '*.js' '*.py'`
returns nothing, so no generator re-emits this and the fix is confined to one file.

**The products in entry 1 do not exist.** Production `/api/comps`, read live this run:

```
q=2026 Panini Prizm Football Fernando Mendoza Silver RC -auto -lot   →  total 0, count 0
q=2026 Donruss Optic Football Mendoza Holo RC -lot                    →  total 0, count 0
```

Zero listings, both queries. This is `cos-2026-09-19-1`'s exact shape — *a page ranking and pricing a
product that has not released, whose buy query returns zero listings* — surviving on the sibling page the
same remediation was supposed to cover. STATE's own account of that run names this page: *"`/best-football-cards-under-50`
had the same defect in a different costume: it recommended Panini Prizm and Optic parallels for a class
that is in Topps."* The table was rebuilt. The block below it was not read.

**It also breaks the page's own stated pricing contract.** The list header says *"Every price below is a
median of dated completed sales… Where a figure is an ask rather than a sale, it says so."* The three
deep-dive ranges — ~$12–$45, ~$30–$50, ~$15–$45 — are neither, and carry no label of either kind. The
eight ranked rows above them are impeccable: every one a dated median with its sale count, window and
range, and I checked all eight against `data/football-solds-2026-09-19.json` (30 dated sales for
Mendoza #301 at a $2.87 median, all Sep 18; the +24/33/39% insert premiums recompute exactly from the
published medians). **The defect is entirely below the fold of good work.**

**Why every gate passes.** `audit-prices` check 7 `sold-provenance` reads graded price cells; these are
prose ranges in a `<div>`, and "$1,349" sits in a sentence, not a price cell. This is `iw-2026-09-17-4`
(the open gate-gap finding) reproduced a fourth time, and it sharpens it: the check that would have caught
this is **"a page that withdraws a figure must not contain that figure outside the withdrawal sentence"** —
mechanical, greppable, and it would have caught the graded-ladder retraction too.

**R6 — not a re-file.** `cos-2026-09-19-1` is scoped to `/nfl-rookie-cards-2026`; `cos-2026-09-19-3` is
the `/bowman-football` buy strip; `cos-2026-09-19-4` is the Cosmic Chrome / Chrome Black correction.
No proposal in the 139 covers `best-football-cards-under-50.html`'s deep-dive block.

**Severity FAIL.** A figure the ledger records as withdrawn is live as a sale, attached to a buy
recommendation, on a commercial page, in a product that returns zero listings.

---

### FINDING 3 — LOW · `/bowman-bangers` calls its autos "1st Bowman" twice in prose, and its `keywords` meta sells the page as "1st Bowman cards 2026" — the exact category R9 §3 makes a gate failure.

Filed at LOW deliberately, and I want the reason on the record: **the board's public face is correct where
it counts.** Title: *"1st Bowman Chrome Autos, Ranked and Priced Nightly"*. Meta description: *"On-card
autos only: not base 1st Bowman Chromes, not graded copies."* The explainer states R9 §1 verbatim. The
`board-autos-only` check passes. This is residue, not the Sep 16 defect returning.

What is live, re-verified this run:

- `<meta name="keywords" content="2026 Bowman baseball prospects, **1st Bowman cards 2026**, …">` — the
  base-card category, as a self-description, in machine-readable metadata on the autos-only board. R9 §3
  says `audit-terminal` FAILs "if the board page describes itself as '1st Bowman cards'". The check reads
  body copy; it does not read `<meta>`, so this passes.
- Two prose instances of the shorthand R9 §1 forbids — *"the most-chased **1st Bowman** in years"*
  (Holliday) and *"The most expensive **1st Bowman** in the entire 2026 class"* (Kim) — both meaning the
  auto. Every other bare "1st Bowman" on the page is inside the correct phrase "his 1st Bowman auto".

**Honest severity.** No reader is misled: both sentences sit inside entries whose headings and price rows
say "1st Bowman Chrome Auto", and `keywords` has been ignored by every major search engine since 2009. I
am filing it because the gate's **scope** is the interesting part — the string R9 names as a FAIL is on
the page in a place the gate does not look — and because the Sep 16 incident was exactly this category
error in exactly this page's public face.

**R6 — no existing ruling.** R9 is doctrine; no proposal covers the `keywords` meta on any page.

---

## STATUS OF YESTERDAY'S FINDINGS — reported, not re-filed

Five of yesterday's six proposals are staged in the Project doc and **not yet in `pipeline.json`** (only
`iw-2026-09-19-3` was appended, as `applied`). Checked live this run so the CoS knows what is still true:

| Yesterday | Status today |
|---|---|
| **F1 FAIL** — the engine-block generator publishes "What buyers paid" / "Hammer med" over last-bid data on 8 guide pages | **Still live.** `/ethan-holliday-rookie-cards` serves both strings in the static shell today. Unchanged, unfiled again. |
| **F2 HIGH** — `/topps-definitive-basketball` renders an ask over a page that says "Box Price TBA · Comps None yet" | **Page unchanged** — "TBA" ×3 and "Comps / None yet" still in the served HTML. The $14,999 itself is client-rendered from `/api/comps` and I did not re-run that query this run, so I am not restating the figure. |
| **F3 HIGH** — `/bowman-football` 1st-logo contradiction | **Fixed and in the ledger** (`iw-2026-09-19-3`, applied in `c0398f9`). |
| **F4 MED** — `/indices` says "five of the seven" on a page rendering eight | **Still live.** Both "Five of the seven" (body) and "Five tickers" (meta + JSON-LD) serve today. |
| **F5 MED** — the board's liquidity-gate day counters are static | **Still live**, and I want to narrow it: Kim's row reads *"41 days as of Sep 15"* — it is **stamped**, so it is a dated claim inside its stamp, not an unstamped stale number. The substance (a hand-written counter on a nightly page) stands; the framing should be "a counter that should be computed, not a false number". |
| **F6(a) HIGH** — Singapore cluster | Stands; re-read today at 74 sessions / 38.1% of US. Not re-filed (already ruled, Sep 7). |
| **F6(b) HIGH** — "Sep 17 is the 28-day engagement floor" | **WITHDRAWN by this run — see Finding 2.** The settled figure is 47.22%, not 8.57%. |

---

## CHECKED AND CLEARED — no finding

- **`/` — the published instruments match the feed to the digit.** Every screen table stamps `feed Sep 19`
  and "Every tracked card · **38 cards**"; the feed carries 38. `data-prices-updated="2026-09-19"`.
  The Markets panel levels match `data/indices.json` (and `audit-terminal`'s `home-index-level` FAIL check
  passes at 0). PF25 renders "100.00 · inception 09/18" rather than a fabricated w/w.
- **`/nfl-rookie-cards-2026` — this is the page the site should be judged on.** Every figure is a median
  of dated completed sales with count, window and range beside it; the Mendoza "Real One" auto is
  explicitly refused a mark (*"Two sales is a data point, not a price"*) while publishing both sales and
  the fact that the $725 asks are mostly redemptions; PSA 10 reads "No verified sale" on all five entries;
  the withdrawn June figures are named once, inside the withdrawal. I cross-checked the medians against
  `data/football-solds-2026-09-19.json` — `$2.87` on 30 dated Sep 18 sales, the +39% insert premium
  recomputes from `$3.99` vs `$2.87`. Nothing overstated.
- **`/fernando-mendoza-rookie-cards` — the Sep 16 graded ruling is now honoured here.** The hero strip
  reads "PSA 10 · **no verified sale**"; the "PSA 10 ~$51" that NEEDS-MO records as having sat on this page
  for three days is gone, and `grep` finds no Prizm/Optic/$1,349 residue anywhere on it. The −37% re-read
  is published against a named prior read (~$4.56, Aug 31).
- **`/phantasmal-flames-index` — a two-card index that says so on its face.** "Top 2 Weight **82.0%**",
  "Effective Holdings **2.4**", "Weight Skew +4.99", "36 / 36" holdings, "base 100.00 · inception 09/18/26 ·
  **w/w accrues from first re-mark**", and *"This page tracks the set; it does not recommend cards."*
  Basket $1,203 and divisor 12.0317 match `data/indices.json` exactly. The concentration is the honest
  headline rather than a footnote — this is the disclosure standard the other index pages should be held to.
- **`/bowman-bangers` graded and taxonomy remediation still holding.** Title and meta description are R9-correct;
  no PSA 10 figure without a dated sale; the Sep 17/18 dated correction blocks are live; the ask-vs-sold
  numbers are labelled as ask against sold on every row that carries both.

## R6 — SEEN AND DELIBERATELY NOT FILED

- **The three `first-bowman-unverified` WARNs** — accepted baseline. Not filed.
- **The 31-page `no-machine-stamp` backlog and the 4 `stale-prose-stamp` WARNs** — inside the stated 60/3/1
  baseline and `audit-2026-09-07-1` (approved). Not filed.
- **`market-latest.json`'s `note` still reads "hammer prices from tracked auction closes"** — folded into
  yesterday's F1 as context. Not filed again.
- **`victor-wembanyama-rookie-cards.html` contains "Black Shimmer"** — a different sport and a real Panini
  basketball product. Not fetched, not audited, not filed; noting it only so the CoS knows the grep hit and
  that I did not chase it.

---

## STUMBLES — mine, this run

1. **I filed a wrong finding yesterday and this run found it.** Finding 6(b) — Sep 17 as the 28-day
   engagement floor — was read off an unsettled GA4 row. It is withdrawn above. The thing that saved it was
   comparing two committed snapshots of the same day rather than trusting the newest file, and that
   comparison should have been in yesterday's run, because the material was already in the branch. **This is
   the second consecutive run where this lane's worst error was treating a fresh number as a settled one.**
2. **I nearly filed the `/best-football-cards-under-50` hero image as part of Finding 1 and withdrew it.**
   The hero is a "Carnell Tate 2025 Prizm Draft Picks Silver" listing, which looks like the withdrawn
   Prizm recommendation at the top of the page. It is not: 2025 Prizm Draft Picks is a real, released
   collegiate product and the image is a live eBay listing, correctly labelled. The defect is the deep-dive
   text, not the image. Filing the image would have sent the fix to the wrong element.
3. **I did not re-run `/api/comps` for `/topps-definitive-basketball`.** Yesterday's F2 turns on a
   client-rendered $14,999, and I checked only that the page's static copy is unchanged. So my status line
   for F2 is "page unchanged", not "finding reproduced" — a weaker claim, stated as such rather than
   rounded up.
4. **My first status check on that page read "gone" for three strings that are in fact live.** I grepped for
   "Box Price TBA" and "Comps None yet" as literal strings; both span HTML tags, so the grep missed them and
   I briefly had the page recorded as fixed. Caught it by counting the words separately. A lane that had
   reported that first result would have told the CoS a live finding was resolved.
5. **Part A's signal/gate series is still reconstructed, not logged** — rebuilt from 14 prior commits of
   `prices-latest.json` on the `price-data` branch. Third run reporting it. If that branch is ever squashed,
   this lane's Part A baseline disappears silently. Nothing has been done about it; I am not escalating the
   severity, just refusing to stop saying it.
6. **Part B is 6 pages of 104.** Both findings came off rotation pages this run and neither mandatory page
   produced one — the second run in a row where rotation outperformed the standing slots.
7. **The GitHub REST API still 403s from this session.** Clone + `ls-remote` used instead, per the standing
   note. No time spent on the API path.

---

## WHAT I DID NOT DO

No git beyond reading. No fix, no commit, no push, no edit to `data/pipeline.json` — proposals are staged
separately for the CoS to append from a fresh clone (R1). No write to X, to the vendor, or to any off-site
surface (R10). Mo's computer was not reachable this run — this session is cloud-only with no desktop
bridge, by design for this task — so this report is delivered as a Project doc, which is the canonical
delivery.

**Proposals staged:** `claude/cos/integrity-watch-2026-09-20-proposals.json` — three entries, all
`awaiting-cos`, plus one withdrawal request against yesterday's staged `iw-2026-09-19-6`.
