# Integrity Watch — 2026-09-21

HEAD 7ce80d1 · origin/main 7ce80d1 · delta 0 commits · gate WARN 60/3/1 vs baseline 60/3/1

Fresh clone taken this run over HTTPS into scratch (`/tmp/iw`, `--depth 30`), plus a second clone of
`price-data` with history (`/tmp/feed`). `git ls-remote origin refs/heads/main` =
`7ce80d145d5e6b2118de29f181ffe6280ade05e3` = local HEAD, re-checked at 12:13Z at the end of the run.
Not stale, so this report files. All three gates run against that clone this run: `audit-prices`
FAIL 0 / **WARN 60** · `audit-site` FAIL 0 / **WARN 3** (104 pages) · `audit-terminal` FAIL 0 /
**WARN 1** (`feed-unavailable`, expected without `--feed`). **Exactly at the stated 60/3/1 baseline.**

Read at STEP 0 from that clone: `/LANE-RULES.md` (R1–R11), `claude/cos/STATE.md`,
`claude/cos/NEEDS-MO.md`. Ledger checked: `data/pipeline.json`, **145 proposals**.

**Three findings: one FAIL, two MED.** The FAIL is the Sep 16 graded-ladder ruling's own defect,
alive on a page the remediation never reached — and the page the team touched *yesterday* to add the
new Authenticity-Guarantee buy link. The two MEDs are both the same shape: a page selling itself as
sold-basis over data that is ask-basis, on the two surfaces that carry the most money.

---

## PART A — INSTRUMENTS

### Price feed — clean. Nothing zero, nothing down.

Latest observation is `day 2026-09-20`, generated 2026-09-20T13:04:37Z. At the time of this run
(2026-09-21T12:03Z) that is **22.9 hours old and today's nightly has not yet fired** — snapshot commits
land 12:30–13:33Z on the last six days. Not a gap; do not read it as one. Trailing medians are computed
from the **14 prior `prices-latest.json` / `market-latest.json` commits** on `price-data`
(Sep 6 – Sep 19), read out of git, not a proxy.

| Instrument | Today (Sep 20 obs) | Trailing-14 median | Δ | Verdict |
|---|---|---|---|---|
| Cards in feed | **38** | 29.0 | +31% | OK |
| Cards with numeric `last` | **33** | 27.0 | +22% | OK |
| Cards with a signal | **38** (27 HOLD · 10 SELL · 1 BUY) | 29.0 | +31% | OK |
| Cards gated | **10** | 8.0 | +25% | OK |
| Auction closes recorded (cumulative) | **173** | 47.5 | — | OK |
| Auction closes recorded (that day) | **17** | 9.5 | +79% | OK |
| Live auctions watched | **157** | 102.0 | +54% | OK |

Nothing is zero. Nothing is down more than 60%. Every series is rising, which is coverage being added
(20 → 29 on Sep 12 → 34 on Sep 14 → 37 on Sep 17 → 38 on Sep 19), not drift.

**Gate integrity checked, not assumed.** All 10 gated cards publish `HOLD`; not one gated card carries
`BUY` or `SELL`. `signalRaw` shows 3 BUY where `signal` shows 1 — the two suppressed are gated cards,
which is the gate doing its job.

### Index cadence — every `status: live` ticker is inside its cadence. Eight live tickers.

| Ticker | Last history mark | Age | Cadence | Verdict |
|---|---|---|---|---|
| PB26 · CR26 · AH26 · PRIS25 · DR25 | 2026-09-14 (Mon) | 7d | weekly (Monday scan) | **Due today** — the scan runs 09:00 PT, ~4h after this report |
| BCB26 | 2026-09-15 | 6d | Mon/Tue/Fri through street+21d | OK |
| PF25 | 2026-09-18 | 3d | weekly | OK |
| BOW26 | 2026-09-13 | 8d | **level moves nightly, client-side** | OK — see below |

**BOW26 is not a stale weekly mark and I nearly filed it as one.** Its history row is 8 days old, which
is past a weekly line, and I had it written up before reading `tools/build-bow26.mjs:106`: the BOW26
level *"moves nightly, computed client-side from `prices-history.json` with the fixed units + divisor
here."* The history rows are re-constitution records, not the published level. All 10 CPA autos in its
basket carry a numeric `last` in today's feed, so the level is live. The Sep 20 run called this one "at
the line"; the accurate statement is that the weekly-cadence test does not apply to BOW26 in the form
it applies to the Pokémon tickers. **Recommend the prompt say so**, or the next four runs will keep
walking up to this.

**SV151 not checked, and correctly so.** `git ls-files | grep -i sv151` in the clone taken this run
returns only `data/sv151-universe.json` and `data/sv151-screen-2026-09-17.json` (R7 satisfied); there is
no `SV151` key in `data/indices.json`. `iw-2026-09-17-2` is `in-progress` under Path B. Nothing to file (R6).

### GA4 — the snapshot is alive, and yesterday's unsettled-day finding just reproduced itself

`ga4-latest.json` generated **2026-09-20T13:16:10Z**, **22.9 hours old** at read time — inside the
36-hour bar. `ga4-snapshot.yml` is alive. Not a finding.

**Every figure below is read off the newest SETTLED day (Sep 18), not the freshest row**, per yesterday's
Finding 2. Medians are computed from `reports.daily28` with the freshest row excluded.

| GA4 instrument | Value | Trailing-14 settled median | Verdict |
|---|---|---|---|
| Key events, newest settled day (Sep 18) | **4** on 55 sessions | 0 (window contaminated — see below) | **not zero, no FAIL** |
| Sessions, Sep 18 settled | **55** | 44.5 | +24% |
| Engagement rate, Sep 18 settled | **41.82%** | 44.88% | −7%, ordinary |
| `keyEventsYesterday` (Sep 19) | 5 on 58 sessions | — | **provisional — do not quote** |
| `clicks7` | **39** | 38 · 35 (two prior rows) | OK |
| `organicKeyEventRate7` | **6.33%** | 4.88% · 2.31% | rising — reported beside blended, never alone |
| `blendedKeyEventRate7` | **4.71%** | 3.82% | rising |
| `returningShare7` | **5.61%** | 5.41% · 5.42% | flat; far below the 20%-for-4-weeks unblock trigger |
| `nonUSTopCountry7` | **Singapore, 104 sessions, 0.146 s avg** | 74 · 61 on the two prior days | **already ruled — not re-filed** |

**The zero-key-events FAIL condition cannot be evaluated against a trailing median right now, and saying
so is more useful than reporting the number.** Twelve of the last fourteen settled days in the window are
the Sep 4–15 blackout (`keyEvents` 0 on Sep 4,5,6,7,8,9,10,11,12,13,14,15), so the trailing-14 median is
0 and *any* positive reading scores as an infinite improvement. The charter's real test — zero key events
on a day with ≥30 sessions — is what matters, and Sep 18 reads 4 on 55. **No FAIL.** The median becomes
meaningful again around Oct 1, when the blackout leaves the 14-day window.

**Yesterday's HIGH reproduced itself one day later, which upgrades it from an incident to a pattern.**
Finding 2 of the Sep 20 report showed Sep 17's engagement rate reading **8.57%** in the unsettled row and
**47.22%** once settled. Today's file shows the newest row, Sep 19, reading **8.62%** — the same
artefact, the same magnitude, one day on. Two consecutive days where the freshest `daily28` row's
engagement rate lands near 8.6% and then restates 5× is not coincidence; it is the shape of the lag.
**I am not filing this — it is `iw-2026-09-20-2`, staged and not yet appended — but the CoS should know
the second instance exists before ruling on the first.** Also unchanged: `ga4-history.json` still holds
3 rows and its Sep 17 row still carries the stale 8.57%-era figures that yesterday asked to have restated.

**Singapore — reported, deliberately not filed (R6).** 104 sessions at **0.146 s** average = **56.2% of
US sessions** (185) and 31.4% of the 331-session country total, up from 74 / 38.1% yesterday and 61 /
31.6% the day before. China sits beside it at 13 sessions / 0.318 s. This is ruled: `cos-2026-09-20-1`
(applied) shipped the behavioural bot filter into `tools/ga4-snapshot.mjs`, and `cos-2026-09-20-4`
(closed) records Mo declining to block at the edge. **Not filed. One consequence and one tripwire:**

- The filter shipped at 2026-09-20T15:39Z (`5929714`), **after** the 13:16Z snapshot, so today's
  `ga4-latest.json` has **no `summary.bots` block** — expected, not a defect. `ga4-snapshot.yml` checks
  out `main` for the tool, so tonight's run is the first that should carry it.
- **Tripwire for tomorrow's run:** if `ga4-latest.json` generated after 2026-09-21T09:00Z still has no
  `summary.bots`, the shipped fix is not running and that is a HIGH.

**The old backstop:** STATE's last recorded human GA4 read is **2026-09-18**, 3 days old. Well inside 14
days. Nothing to file.

---

## PART B — CLAIMS

**Six pages this run:** `/` and `/bowman-bangers` (both mandatory), plus **`/lebron-james-cards`**,
**`/victor-wembanyama-rookie-cards`**, **`/topps-series-1-2026`** and
**`/pokemon-30th-anniversary-2026`** — four pages no prior run has covered. The rotation was chosen
deliberately: **two of the four are the pages that gained a brand-new commercial link yesterday**
(idea #33's Authenticity-Guarantee link, `7d0f85f`), one carries idea #32's sealed-case link, and the
fourth is the site's #1 lander. Yesterday's shipped work is where the risk is. `/lionel-messi-cards` and
`/cameron-boozer-rookie-cards` were pulled as the other two AG pages to scope Finding 1 — Messi produced
Finding 3; Boozer produced nothing and is not filed.

All fetched from `www.shopcardhub.com`. **Every finding below was re-fetched and reproduced live at
2026-09-21T12:11:42Z immediately before filing (R5).** None of the three sits inside a client-repainted
block: `/lebron-james-cards` loads no engine script and carries zero `ENGINE:` markers, and the homepage
string sits in `<p class="tm-foot">` *after* `<!-- HOME:screen:END -->`. That check is deliberate — the
Sep 17 run's stumble #1 and the Sep 18 X-desk overturn were both the baked-vs-repainted trap, and this
run has no browser.

---

### FINDING 1 — FAIL · `/lebron-james-cards` publishes three graded figures as "recent sold comps" sourced to SportsCardsPro, 42 days stale, on the page the team gave an Authenticity-Guarantee buy link to yesterday. This is `cos-2026-09-16-graded-ladder` on a page the remediation never reached.

**Live at 12:11:42Z today**, in the served HTML, hand-authored, no repaint:

> ⚠️ **A mature market moving on news.** LeBron's card market is two decades deep and fully graded —
> **prices below are recent sold comps (SportsCardInvestor / SportsCardsPro / Card Ladder**, plus The
> Hobby Wire's +11.4% read on the raw Topps RC since Jul 27). … **Comps as of Aug 10, 2026.**

What sits under that sentence:

| Figure | How the page labels it | Provenance on the page |
|---|---|---|
| Raw 2003 Topps #221 · **~$512** | "Recent Comp" | none |
| 2003 Topps #221 **PSA 10 · $6,000–$7,200** | "Recent eBay range" | none — no count, no date |
| 2003 Topps 1st Edition #221 · **~$2,460** | "Recent Comp" | none |
| Chrome #111 **PSA 10 · ~$12,000** | "Recent Comp" | "May 2026 auction printed $12,000 even" |
| Chrome #111 **PSA 9 · ~$2,637** | "Recent Comp" | none |

**Three of the five are graded tiers and none carries a sale count.** `cos-2026-09-16-graded-ladder`
(applied, HIGH) ruled, in Mo's presence: *"Every graded figure with no dated sale behind it now reads
'No verified sale'… All three disclosures now state that graded figures appear only where a dated sale
record was read **and that SCP's grade ladder is partly modelled**."* This page names SportsCardsPro as a
source for graded figures and says the opposite — that they are sold comps. The remediation reached
`/ethan-holliday-rookie-cards`, `/aiva-arquette-1st-bowman` and `/roy-watch-2026` (Sep 16), the board
(`iw-2026-09-17-1`, Sep 17) and `/fernando-mendoza-rookie-cards` (Sep 19). **It never reached here.**

**The one figure that is attributed makes the labelling worse, not better.** `~$12,000` is sourced to a
*May 2026* auction. In September, a four-month-old single auction result published under the words
"recent sold comps" is the claim overstating the data even where the data is real.

**42 days, against the site's own 21-day limit, and the gate cannot see it.** `tools/audit-prices.mjs`
sets `STALE_DAYS = 21`. This page's only stamp is the prose *"Comps as of Aug 10, 2026"* (twice, plus
"as of Aug 10, 2026" in the table intro) — **42 days, exactly double the site's own line.** It carries no
`data-prices-updated` at all, so check 4 never runs on it; check 9 raises `no-machine-stamp`, which sits
inside the accepted 60-WARN baseline; and check 6 `stale-prose-stamp` measures drift *against the page's
own newest date*, which is also Aug 10, so the drift is zero and it stays silent. **A page where every
date is equally old is invisible to the freshness gate by construction.** That is worth a check of its
own and I am not proposing one here beyond naming it.

**It is not inside `audit-2026-09-07-1`.** That approved item names 22 pages at 63–87 days old and lists
them: holliday, arquette, shohei-ohtani, nfl-rookie, best-hobby-boxes, the three best-under-50s,
topps-series-1, topps-chrome-basketball, chaos-rising, prismatic-evolutions-guide, cactus-jack,
cosmic-chrome, inception-baseball, cooper-flagg, world-cup, plus a watch list of
messi/ronaldo/haaland/kane/mbappe/yamal/misiorowski/pete-crow-armstrong. **`lebron-james-cards` and
`cameron-boozer-rookie-cards` are on neither list** — on Sep 7 their Aug 10 stamps were 28 days old and
correctly under that item's bar. They have since crossed the 21-day line. **The cohort that item
describes is growing, and nothing is watching the edge of it.**

**The aggravating fact.** `7d0f85f` (yesterday, 15:50Z) selected this page for the Authenticity-Guarantee
link *on a live measurement*: STATE records a `/api/comps` **median ask of $9,500** and **19 AG listings**,
read yesterday. That fresh number is in the buy strip. It sits directly above a comp set stamped 42 days
ago, in a hero that says the rookie **"is up double digits"** and a stat grid that publishes
**"30-Day Move +24%"** with no window — which, read on Sep 21, means Aug 22–Sep 21 and is actually
Jul 11–Aug 10. The page was opened yesterday and the prices on it were not looked at.

**A second, smaller number problem on the same page, recorded here rather than filed separately.** The
hero chip and the deep dive both put the post-signing move at **+24%** ("The +24% month IS the
Philly/GOAT story in one number"), while the warning block and the Avoid list both put it at **+11.4%**
("The Hobby Wire's +11.4% read on the raw Topps RC since Jul 27"; "the +11.4% signing pop is already in
every ask"). The windows differ — 30 days vs since-Jul-27 — so they are not strictly contradictory, but
the page uses them interchangeably for the same event and **only the smaller one is attributed.** Whoever
re-marks this page should reconcile them rather than refresh them.

**Why every gate passes.** Check 7 `sold-provenance` fires on the literal pattern `PSA 10 (sold)` or
`PSA 10 sold: $`. This page writes `PSA 10 ~$12,000` in a table cell and makes the sold-claim once, at
page level, in a `<div>` of prose 40 lines above. **This is `iw-2026-09-17-4`'s gate gap reproduced a
fifth time — and it is the first instance where the sold-claim is page-scoped rather than cell-scoped,
which the prose-scoped check that item proposes would catch.** That strengthens the case for ruling it.

**R6 — not a re-file.** No proposal in the 145 covers `lebron-james-cards.html`.
`cos-2026-09-16-graded-ladder` names three other pages; `iw-2026-09-17-1` is the board;
`audit-2026-09-07-1` does not list it; `audit-2026-08-31-1` covers wnba + wemby and was applied.

**Severity FAIL.** Three graded figures with no verified sale, published as sold comps, sourced to a
grade ladder this project has already ruled is partly modelled, 42 days stale, on a commercial page
carrying a live $200+ buy link added yesterday.

---

### FINDING 2 — MED · The homepage says "set indices are sold comps only" three times, ~1,400 lines below its own Markets panel that renders BCB26 and BOW26 and labels them ask-basis. The Sep 18 fix corrected one string on this page and left three.

Live at 12:11:42Z, all three in the served HTML:

1. `<p class="tm-foot">` — *"Marks are the engine's nightly reads from verified eBay asking prices — asks,
   not solds — dated above and never hand-typed; **set indices are sold comps only, re-marked weekly.**"*
2. Affiliate/legal block — *"Prices on this page are the engine's nightly reads … and **the set indices'
   weekly sold-comp re-marks**, dated on the page."*
3. Footer — *"Card prices are the engine's nightly ask-basis reads and **weekly sold-comp index
   re-marks**, dated on the page."*

**What the same page renders, above them.** The Markets panel lists eight live tickers and two of them
are ask-basis in `data/indices.json`: **BCB26 95.67** (`basis: "ask (eBay verified, engine)"`) and
**BOW26 99.21** (`basis: "ask"`). The panel's own subheader gets it right — *"board ask-basis · nightly ·
Pokémon indices sold-basis, Bowman ask-basis · weekly"* — so **the page states both things about the same
eight tickers.** The word "only" in instance 1 is the part that cannot be read charitably.

**This is the Sep 18 fix, half-applied, and STATE says so in its own words.** The Sep 18 evening entry
records: *"the Markets panel subheader called all seven indices 'sold-only' while BCB26 and BOW26 are
ask-basis — real claims defect, fixed this push **(one string, outside the generated markers)**."* One
string was the subheader. Three more were on the same page and were not read. Same defect class as
`iw-2026-09-17-3` (applied) — */indices sells the whole page as sold-basis in its banner, subline, meta
description and JSON-LD* — which is the same pattern on the sibling page: the fix lands on the instance
that was quoted in the filing and misses the copies.

**Not inside a generated block, so this is a page edit and not a generator change.** The string sits
after `<!-- HOME:screen:END -->`; `grep` puts all three outside every `HOME:` marker pair.

**R6 — not a re-file.** `iw-2026-09-17-3` is scoped to `/indices`. STATE's Sep 18 entry is scoped to the
Markets panel subheader. No proposal in the 145 covers the homepage price-disclosure blocks.

**Severity MED.** It is the site's own disclosure paragraph contradicting the site's own data on the
site's highest-traffic page, and "sold comps only" is exactly the claim this project has spent a week
learning not to make.

---

### FINDING 3 — MED · `/lionel-messi-cards` sells itself as "live eBay sold comps" in its meta description, its og:description and its hero — on a page whose own basis chip one line below reads "Ask marks · Aug 31, 2026 (eBay live asks, labeled)".

Live at 12:11:42Z, three instances of the identical sentence:

> "Every key Messi card ranked by ROI, liquidity, and upside, **with live eBay sold comps.**"

— in `<meta name="description">`, in `<meta property="og:description">`, and in the hero paragraph.
**The very next element on the page is the basis chip:**

> ● **Ask marks · Aug 31, 2026** (eBay live asks, labeled; house trim)

and two of the five ranked rows publish *"~$9 asks (base) · house trim, n=10 · Aug 31"* and
*"~$15 asks (base) · house trim, n=10, tight spread · Aug 31"*.

**The page body is good work and that is what makes the headline wrong rather than merely loose.** Every
row is labelled: the asks say "asks" with their trim method and n; the trophy figures are attributed
sales with houses and dates ($1.5M MBA-certified PSA 10, $1.1M Goldin private, $212,280 Goldin Jun 2026);
the trophy block carries its own scoped stamp *"Trophy-tier results as of Jul 6, 2026."* **Nothing in the
body overstates anything.** The only false claim on the page is the sentence that describes the page —
and it is the one that goes into the search snippet and the social card, which is where a reader who never
scrolls meets it.

**This is the money page.** STATE's Sep 18 EPN read: the single sale that mattered in the Sep 4–17 window
was **$860 off `/lionel-messi-cards` on 4 clicks** — the largest attributed EPN event on the site. It also
gained an Authenticity-Guarantee link yesterday.

**Same shape as `iw-2026-09-17-3` (applied), different page, and the fix is the same two words.** The
sibling AG page got it right without being told: `/victor-wembanyama-rookie-cards` reads *"with live eBay
ask marks (labeled as asks — a sold feed comes later)"*. That is the sentence Messi should carry.

**R6 — not a re-file.** `audit-2026-09-07-1` names messi only on its *watch* list for the 63-day Jul 6
trophy lines, which is the stamp, not the basis claim. `iw-2026-09-17-3` is `/indices`. Nothing in the
145 covers this page's description copy.

**Severity MED.**

---

## STATUS OF PRIOR FINDINGS — reported, not re-filed

`iw-2026-09-19-*` and `iw-2026-09-20-*` are staged in Project docs and **still not in `pipeline.json`**
(latest `iw-` id in the ledger is `iw-2026-09-19-3`). Checked live this run so the CoS knows what is true:

| Prior | Status today |
|---|---|
| **Sep 19 F1 FAIL** — the engine-block generator prints "what buyers paid" / "Hammer med" over last-bid data | **Still live, and worse than filed.** It renders on `/pokemon-30th-anniversary-2026` too — a page that says three separate times that *"No sold comps exist for this set yet"* and *"Every price on this page is a live eBay ask, not a sale"*. The generator's label contradicts the page's own disclaimer. Not re-filed; this sharpens F1's severity. |
| **Sep 19 F2 HIGH** — `/topps-definitive-basketball` renders an ask over "Comps None yet" | Not re-audited this run (not in rotation, and the figure is client-rendered from `/api/comps` which I cannot re-run meaningfully without a browser). No status claimed. |
| **Sep 19 F4 MED** — `/indices` says "five of the seven" on a page rendering eight | Not re-fetched this run. No status claimed. |
| **Sep 20 F1 FAIL** — `/best-football-cards-under-50` republishes the withdrawn $1,349 in its deep dives | Not re-fetched this run (rotated out). No status claimed. |
| **Sep 20 F2 HIGH** — GA4's newest day is unsettled | **Reproduced a second time.** Sep 19's engagement rate reads 8.62% in today's freshest row, the same artefact as Sep 17's 8.57% → 47.22%. See Part A. |
| **Sep 20 F3 LOW** — `/bowman-bangers` "1st Bowman" prose ×2 + `keywords` meta | **Still live**, verified this run: `<meta name="keywords" … 1st Bowman cards 2026 …>`, and *"the most-chased 1st Bowman in years"* (Holliday). Not re-filed. |
| **`audit-2026-09-07-1`** (approved) — 20 pages rolled to the Sep 14 lane | **Still not re-marked.** Verified live on `/topps-series-1-2026` today: *"Prices: eBay/market, **June 2026**"* and *"approximate eBay/market level as of June 2026"*. Its own `appliedNote` said *"a fourth silent week is not acceptable"*; today is the **sixth**. Not re-filed — reported because it is the CoS's own open item and Finding 1 shows the cohort is growing at the edges. |

---

## CHECKED AND CLEARED — no finding

- **`/` — the published instruments match the feed to the digit.** The screen header reads
  *"feed Sep 20 · 33/38 marked · 10 gated · ask-basis"*; today's feed carries 38 cards, 33 with a numeric
  `last`, 10 gated. `data-prices-updated="2026-09-19"`. Markets levels match `data/indices.json` exactly
  (PB26 90.52, CR26 94.89, AH26 96.89, PRIS25 96.79, DR25 97.71, PF25 100.00, BCB26 95.67, BOW26 99.21),
  and `audit-terminal`'s `home-index-level` check passes at 0. PF25 renders "—" for w/w rather than
  fabricating one from a single history row. The only defect on the page is Finding 2's prose.
- **`/bowman-bangers` — the Sep 16–18 remediation is holding on every point that matters.** Title *"1st
  Bowman Chrome Autos, Ranked and Priced Nightly"*; the explainer states R9 §1 verbatim and adds *"Full-set
  coverage — autos and base together — lives in the set indices"*; `board-autos-only` passes; the dated
  Sep 17 and Sep 18 correction blocks are live and the struck sentences are struck in place, not deleted;
  every seat publishes its last-sale date so the 30-day gate is checkable by a reader; the only graded
  figure on the page is Holliday's **$720.00 (1 dated sale, Aug 6 2026)** and the other four read
  **"no verified sale"**. The page also names its own ask-vs-sold spread as a fact rather than a thesis
  (*"Three of the top four now carry ask marks 37% to 63% above their last sold print, on four verified
  listings each. That is a thin tape quoting itself"*) — that is the standard.
- **`/pokemon-30th-anniversary-2026` — the honesty discipline on this page is the site's best.** *"Every
  price on this page is a live eBay ask, not a sale"*, *"Asks are the lowest single-unit Buy It Now before
  shipping, lots and cases excluded"*, *"No sold comps exist for this set yet, so nothing here is a market
  price"*, and *"nothing in this set has a verified sold comp yet… everything else in the set still has no
  published price."* The ETB prints no mark. Both chase singles carry ask-basis marks stamped 2026-09-18
  (3 days). The only blemish is the inherited generator string in the Sep 19 F1 row above.
- **`/victor-wembanyama-rookie-cards` — the basis label is right and the stamp is at the line, not past
  it.** *"with live eBay ask marks (labeled as asks — a sold feed comes later)"* and *"● Live ask marks ·
  Aug 31, 2026"* = **21 days**, exactly `STALE_DAYS`. The trophy tier is fenced (*"No buy links here on
  purpose — these are auction/private results, not shopping targets"*). `audit-2026-08-31-1` (applied) is
  this page's Aug 31 re-mark. **Not filed — but it crosses the line tomorrow**, and like LeBron it carries
  no machine stamp, so nothing will say so.
- **`/cameron-boozer-rookie-cards` — pulled as the fourth AG page and cleared.** Its Aug 10 stamp scopes
  figures that are individually dated and attributed ($10,500 May 2026, $4,138 Jun 2026, $3,550, via
  Pristine Auction & SI), and the page states plainly that *"His TRUE rookie cards … arrive in Topps' first
  NBA products through 2026-27"* and *"the RC market is unwritten"* — a pre-release framing that does not
  price a product that has not released. **This is what LeBron's page should look like.**
- **`/topps-series-1-2026` — idea #32's case link is built correctly.** Label *"Sealed cases →"*, its own
  `-case` custom ID, no figure rendered from it, and fine print that says so: *"The sealed-cases link is a
  search, not a price — case and multi-box listings are excluded from every figure on this site."* The
  query carries `-break -pyp -pick -rip -random -slot -spot`, which is the `CASE_BAD` guard STATE describes.
  Its June 2026 price stamp is `audit-2026-09-07-1`'s, reported above, not re-filed.
- **Idea #33's AG links are built as specified on all four pages.** `LH_AV=1` present, `-ag` custom ID
  distinct from the plain `-top` ID so the trust-copy effect is readable, label *"Authenticated on eBay →"*,
  and one dated line of fine print naming the program as **eBay's, not ours**: *"It is eBay's program, not
  our assessment."* No figure is rendered from the AG query. Nothing to file on the mechanism.

## R6 — SEEN AND DELIBERATELY NOT FILED

- **The 60-WARN `audit-prices` baseline** (31 `no-machine-stamp` + 25 `non-numeric-price` + 4
  `stale-prose-stamp`), the 3 `audit-site` WARNs and the `feed-unavailable` terminal WARN — all inside the
  stated 60/3/1 baseline and `audit-2026-09-07-1` (approved). Not filed. Finding 1 files the *claim*, not
  the WARN.
- **`market-latest.json`'s `note` still reads "hammer prices from tracked auction closes"** — folded into
  Sep 19's F1. Not filed again.
- **Singapore / China bot traffic** — `cos-2026-09-20-1` applied, `cos-2026-09-20-4` closed by Mo. Reported
  in Part A, not filed.
- **The `/bowman-bangers` `keywords` meta and its two "1st Bowman" prose instances** — Sep 20 F3, staged.
  Not re-filed.

---

## STUMBLES — mine, this run

1. **I computed "auction closes recorded" as ZERO for all sixteen days on my first pass, and it is a
   fabricated Part A FAIL that I nearly filed.** `market-latest.json`'s `cards` is an **object keyed by
   card**, not an array; my extractor did `Array.isArray(m.cards) ? m.cards : []` and silently summed
   nothing. Sixteen days of zeros against a zero median would have read as a clean sweep, but a single
   zero day would have been a FAIL headline built on a type error. Caught by reading today's file directly
   and seeing `closes: 7` on Holliday. **This is exactly the failure mode the charter names — manufacturing
   a finding to look useful — arrived at by accident rather than by intent, which is not a better way to
   arrive at it.** Every Part A number in this report was re-derived after the fix.
2. **I had BOW26 written up as a missed weekly re-mark before reading `tools/build-bow26.mjs`.** The
   history row is 8 days old; the level moves nightly client-side. Withdrawn before filing. See Part A.
3. **I nearly filed `/pokemon-30th-anniversary-2026`'s *"The set as a ticker — price-weighted from real
   solds"*** as a sold-claim over ask marks on a set with no sold comps. It is the promo card for
   **PB26 / CR26 / AH26**, which are sold-basis, and it names them. Withdrawn before filing.
4. **I could not verify the homepage's `BOARD · equal-weight · 9 autos` label and am not filing it.**
   `data/indices.json` puts 10 autos in BOW26's basket and all 10 carry a numeric `last` today, so 9 vs 10
   is a real discrepancy on its face — but `js/home.js:96` computes that count as `ids.length`
   **client-side**, and the composite normalises each series against its value 30 nights ago, so an auto
   without a 30-night anchor would be legitimately excluded. **A curl cannot tell those apart and this run
   has no browser.** Handing it to a browser lane rather than guessing.
5. **Same for `/topps-series-1-2026`'s coverage claim** — *"Every base card and every published autograph
   … **1,098 cards**, searchable"*. The checklist is rendered by `js/set-checklist.js`; curl returns zero
   rows. Unverified, not filed.
6. **Part B is 6 pages of 104**, and this run I weighted the rotation toward yesterday's shipped work
   rather than the oldest-unvisited pages. That is a judgement call; it found the FAIL, and it also means
   the long tail went another day unread.
7. **Part A's signal/gate series is still reconstructed, not logged** — rebuilt from 16 prior commits of
   `prices-latest.json` on `price-data`. **Fourth consecutive run saying this.** If that branch is ever
   squashed, this lane's Part A baseline disappears silently.
8. **The GitHub REST API still 403s from this session.** Clone + `ls-remote` used instead, per the standing
   note. No time spent on the API path.

---

## WHAT I DID NOT DO

No git beyond reading. No fix, no commit, no push, no edit to `data/pipeline.json` — proposals are staged
separately for the CoS to append from a fresh clone (R1). No write to X, to the vendor, or to any off-site
surface (R10). Mo's computer was not reachable this run — this session is cloud-only with no desktop
bridge, by design for this task — so this report is delivered as a Project doc, which is the canonical
delivery.

**Proposals staged:** `claude/cos/integrity-watch-2026-09-21-proposals.json` — three entries, all
`awaiting-cos`.
