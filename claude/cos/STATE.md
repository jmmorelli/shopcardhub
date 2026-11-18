# CoS state — read at the start of every run, update at the end

> **SPLIT 2026-09-22 (queued in the Sep 21 cadence cut, done in the Sep 22 build).** This file used to be
> 128 KB and every lane read it whole at STEP 0 — lanes read ten-day-old blocks as current, which is how
> most of the week's wrong filings happened. **Everything dated before 2026-09-22 is in
> `claude/cos/STATE-ARCHIVE-2026-09.md`, verbatim.** Grep it when you need the history behind a rule; do
> not read it at STEP 0. **Keep this file under 25 KB:** when a dated block is more than 7 days old and
> nothing open depends on it, move it to the archive in the same run.
>
> **This file is in git and canonical; the CoS mirrors it to the Project doc in the same run. No other lane
> writes either copy.** Precedence: Mo in chat → `/LANE-RULES.md` → CHARTER + this file → your task prompt.
> STEP 0 is LANE-RULES from a fresh clone (R1–R18).

---

## PROGRAM — restated 2026-10-01 (monthly roster review; the weekly and the daily runs work toward this)

The site has one edge and one problem. **The edge** is the family of set indices on dated sold comps — six modern Pokémon chase indices, SV151 and TH26 whole-set, 12 classic sets and 7 WOTC 1st Edition/Shadowless sets based at each set's release month on log charts, and the Bowman 2026 cohort with its release indices and serial tiers — now with Raw / PSA 9 / PSA 10 / TAG links, card search and card pages for the graded-vintage buyer Mo expects to arrive (Mo, Sep 25 and Sep 30). **The problem** is that almost nobody arrives and nobody signs up: organic landings 190 → 91 a week since mid-September, eBay clicks 44 → 18 a week, the list is Mo's own 3 addresses, and trailing EPN is below M0 ($300/mo; Mo's target is a couple hundred to $1,000+). So every run ranks its work in this order: **(1) money on the pages that already get traffic** — buy strips, chase strips, graded links, release-day pages live on street date — without ever shading a number (R14, R18, R20); **(2) traffic** — a page for every dated release before it streets, the Growth League daily (R27), the X daily lane (the CoS writes, Mo says go, R10 Am. 2), outreach only on Mo's yes; **(3) the list as the retention number** (R26) — one capture per page and the Tuesday Tape; **(4) calm, fast pages** — the Night Crew and the Site Sweep (R28, R24). No new surface outside the league's pages and the Night Crew's on-page work (R25); the Nov 2 outside re-audit is expected to land below B+ (Mo, Sep 23: compliance first). Secondary and not on the critical path: COMC, the Card Dungeon (R12/R13) and the Grok bots (paused by Mo, Sep 30). `TODO_NEXT.md` (Sep 17) is superseded by this paragraph and by OPEN ITEMS below. Who does what: CHARTER §2 (rewritten Oct 1).

## NOW — 2026-11-17 (Tuesday board + Ship Desk): **`c35e24a` + `257fd6f` live** (main `f55cb13`, Ship Desk off-schedule fire 11:50 PT) — board read Nov 17 (no seat moved; Fischer +3.7% $125.00; Holliday $90.50 under his $95 floor → ruled WATCH by the Nov 18 desk, applied at the Nov 24 read, `tuesday-2026-11-17-1`). Later the same day: Price Truth `09fd010` + `d3c99b8` (G25 Sapphire holds, P70 chips) and the Tape pause `42276bc` (Mo). Gates 0/66 · 0/3 · 0/1 at `42276bc` (0/67 on the Nov 18 UTC day roll: `track-record.html` Oct 27 stamp crossed 21 d).

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-11-11 (Chrome NOT read: two browsers connected again and an unattended run may not pick one → GA4 nightly snapshot, data day Nov 10, 16:43Z; Bing API nightly, 4 weeks to Nov 6; GSC, MailerLite and EPN unread this run — last values carried and labelled)

1. **Money is still ~$0.** EPN trailing 30 d ≈ **$11 = 3.7% of M0** (Nov 9 CSV read; 97% from one Pitch Black box link). GA4 outbound `click` **45 / 7 d** (21 a week ago) but buy strips **2**, card pages **0 clicks on 168 card views**. The #1 Bing page `/best-hobby-boxes-2026` (403 impressions, 24 clicks in 4 weeks, avg pos 4.2) took **16 landings and 0 key events** this week, and its prices are stamped **Oct 20 (22 d, now a WARN)**. *Doing:* the hobby-box re-read is price data → Monday price lane Nov 16 (BLOCKED row); this run fixed no money surface.
2. **Search came back, but one seasonal page carries it.** Organic sessions 7 d **71** (16 a week ago); **organic key-event rate 21.1%** beside blended **4.57%** (28 d: 15.5% vs 1.13%). `/mcdonalds-pokemon-cards-2026` = **47** of the week's landings at a 25.5% KE rate, and the promo ends Dec 14. Google: **4** sessions / 7 d (GSC unread; indexed was 1/91 Nov 4). Bing API: **92 clicks / 761 impressions** in 4 weeks to Nov 6 (110 / 746 the read before). *Doing:* no GSC spend (§0 ruling); the Nov 12 cull check (BET-20261029-1) is tomorrow.
3. **Returners and the list are still unreadable as a business.** Returning users **9 / 7 d** (2), share **1.68%**; GA4 `newsletter_signup` **0** on **172** `signup_view` — the client event is still broken, so MailerLite (4 active Nov 4, unread today) stays the only truth. Bots still **69%** of sessions (SG 366 @ 0.5 s; 240 of 248 `/card` landings). *Doing:* event fix stays with the Night Crew; Retention Analyst read owed.

**§0.3 (data vs the CoS's own lean):** the PIVOT Nov 19 test now reads **organic 71 > 48 ✓ · returning 9 > 6 ✓ · clicks/100 clean 45/169 = 26.6 ≥ 15.7 ✓ · indexed unread (1 on Nov 4 ✗) → 3 of 4** (0 of 4 a week ago). Organic recovered **without** restoring culled pages, mostly on one new release page — so the Nov 4 lean "restore the culled pages with Bing history" is weaker than it was. The CoS now leans: restore only culled pages with ≥ 5 Bing clicks in their last 28 live days; let the Nov 12 check rule.


## MILESTONES (R22 — one line per Wednesday read; the desk appends)

- **2026-11-09 (Mo attended; CSVs `Card Hub/epn/epn-byday-2026-10-26_2026-11-08.csv` + `epn-customid-…`, Oct 26–Nov 8, reconcile):** **157 clicks · 4 actions · $352.48 GMV · $10.58** — 97.4% from `pitch-black-vs-chaos-rising-13` (2 Pitch Black boxes). Trailing 30 ≈ **$11 = 3.7% of M0**. **105 of 157 clicks (`auctions` 66 + `deals` 39, Nov 5–8, 0 sales) read as automated** (GA4 human clicks 15 vs EPN 61 those days) → harness `ctx.route` eBay abort owed (Night Crew/Gate Keeper). n = 4 → no trend (R22). Read: `claude/cos/epn-read-2026-11-09.md`.

- *(Older reads, Sep 18–Oct 13, and the Oct 21 + Oct 28 lines (pass of 2026-11-02): `STATE-ARCHIVE-2026-10.md`, archive passes of 2026-10-16 and 2026-10-23.)*

## STANDING RULES (current; history in the archive)

- **Pricing integrity (hard):** no `$$` placeholders; every price is numeric with a dated stamp; sold and
  ask are separate, labelled figures, never blended.
- **R18 — a graded figure is ONE sales row: date + grade + price**, the row's own title naming the grade.
  Never a guide/ladder cell; never a date borrowed from another grade's row. One row reads
  `(1 dated sale, <date>)`. Otherwise **No verified sale**. (Sep 16 incident → Sep 17 rule → Sep 22 amendment
  after Holliday's $720.)
- **Never narrate a carried value as a series** ("held", "flat", "pinned", "a sixth week").
- **The board's rule is one rule, published in three places** (hero, `bb-board-note` JS, legend): one
  ladder, last printed sold price, 30-day liquidity gate. Seats are ordering; verdicts are calls
  (BUY/HOLD/PASS/WATCH). **SELL is the engine's ask-side signal and never a board call.** Corrections are
  dated and visible.
- **"Hammer" = last bid seen, a floor.** Captured a median ~12 h before close. No lane publishes an
  ask-vs-sold gap figure. A hammer-basis mark needs ≥ 5 closes in 60 days.
- **R9 taxonomy:** the board is 1st Bowman Chrome **Autos** only. A 1st Chrome never implies a 1st Chrome
  Auto. Resolve ambiguous calls toward the investor.
- **R17 — our eBay endpoints serve our pages and tools only.** Scripts send `X-ShopCardHub-Client: tool`.
  A 403 without it is the guard working, not an outage. No lane copies raw eBay listing content anywhere.
- **EPN:** visible "eBay" label; never self-click; every off-site eBay link carries `customid=`; only
  `customid` ever varies in a tracking link.
- **COMC:** no COMC position of Mo's on any public surface. The owner-held flag on the board is VETOED.
- **GA4:** a configuration change is an account setting — Mo approves it every time, and it is recorded
  here. Key events count forward only; nothing is quoted from Sep 4–16. Bot filter lives in
  `tools/ga4-snapshot.mjs` (avg session < 2 s over ≥ 10 sessions, by country); always quote clean beside raw.
  **First clean weekly read: Sep 24.**
  **Oct 5 (X Desk Watch lane note, CoS with Mo):** any site-traffic claim subtracts the SG/CN/NL Direct cluster first; raw Direct is never quoted alone. **Oct 5 desk:** the snapshot's < 2 s rule missed Singapore (163 sessions, 0 KE, 4.3 s avg) — until `tools/ga4-snapshot.mjs` is fixed (Oct 7 weekly), clean = sessions7 − the SG/CN/NL rows.
- **R10 (amended Sep 25) — nothing on this project posts to X on its own.** The Grok Bot vendor is OFF (Mo, Sep 25).
  The CoS queues posts in X's native scheduler from Mo's Chrome, only with Mo's yes on the batch, and reports the
  queue; Mo replies and interacts himself. No lane replies, likes or DMs. Vendor notes, if any, are inputs.
- **Push/deploy: R48 (LANE-RULES, Nov 16) is the only recipe** — push from the run's cloud clone; a refused push goes to the Ship Desk mailbox (`claude/night-crew/pending.md`); the Mac deploy key is never in the push path. The Sep-era deploy-key text moved to `STATE-ARCHIVE-2026-11.md` (pass of 2026-11-18).
- **Vercel:** docs/tools/`data/pipeline.json` commits do not build (`tools/vercel-ignore.sh`). After a site
  push, check the deployments list: *Initializing* > 5 min is a zombie — cancel and Redeploy; a queued build
  of an OLDER commit than production is cancelled before it completes. Vercel and GitHub are the CoS's to
  operate (Mo, Sep 18); the CoS never types a password.
- **Cadence:** a new lane needs a named number it moves and a lane it replaces; find-and-file lanes are
  capped at two. The authoritative table is in LANE-RULES.
- **Desk inbox lookback (iw-2026-09-24-1, Sep 24):** every desk run diffs the ids in the **last three** Integrity
  Watch `*-proposals.json` files (and any other `*-proposals.json` in the Project) against `data/pipeline.json` —
  not only files newer than the previous run. The Sep 19/20 files sat unledgered for five days because the check
  was time-scoped. Desk prompt to be fixed at the Oct 1 roster review.
- **`awaiting-mo` is only for what is physically Mo's** — a sign-in, money, a credential, a human account.
- **No spend below M0.** Milestones, trailing-30-day EPN, two consecutive weekly reads: **M0 $300 · M1
  $1,000 · M2 $10,000**. Current rung: below M0 (~$100/mo trailing at the Sep 18 read). No trend from
  fewer than ~30 EPN actions.

---

## OPEN ITEMS (auto-approved, for agents) — ranked

**Archived whole on 2026-10-16** (`STATE-ARCHIVE-2026-10.md`, pass of that date). Open work is tracked in `claude/cos/BLOCKED.md` (ORG §5): one row per item, owner, dated next action. A lane that finds an older OPEN ITEMS line still live files it there as a row; nothing new is written here.

---

## WAITING ON MO — see `NEEDS-MO.md`

See `NEEDS-MO.md` (repo canonical, Project mirror). Older text archived 2026-10-16.

---

## RUN LOG (newest first; entries before the Oct 26 Night Crew deploy line — incl. the Oct 26 desk — are verbatim in `STATE-ARCHIVE-2026-10.md`)
- **Nov 18 ~01:12–02:30 UTC (Nov 17 ~17:12 PT) (CoS · desk, Mac-linked, unattended; Tue slot on time).** Freshness: HEAD `42276bc2` · origin/main `42276bc2` at clone · gates **0/67 · 0/3 · 0/1** vs base 0/66 · 0/3 · 0/1 (+1 = `track-record.html` Oct 27 stamp crossed 21 d on the Nov 18 UTC roll; untouched). Read LANE-RULES (precedence, R1, R2, R44–R48), STATE top + last 2 desk entries, NEEDS-MO, ideas LEDGER head, **CoS LEDGER** (new Nov 17: the intake's rulings stand; the desk relays and does not re-rule — O-20), attended 11-17 ×3, daily review 11-17, Ship Desk LATEST. **Prompt drift (file wins):** R48 — clone/push from the cloud (`/home/claude/shopcardhub`), never the deploy key; Mac `/sessions` still 100% full (`mkdir $HOME/…` → "No space left on device") → a read-only Mac clone + key copy in `/tmp`, deleted at end · STEP 3 vendor delivery dead (R10 Am. 6) · desk runs 7 days · the prompt does not name the CoS LEDGER yet (O-20).
  **Inbox since the Nov 17 01:12Z desk: Project ~30 (attended 11-17 ×3, LEDGER, CONTROL-ROOM + control-room-design FROM-MO/LOG, daily review 11-17, measure/heartbeat/traffic/pullcheck/x-daily/site-sweep 11-17, xpost-latest, bet-20261117-1, tuesday-board-task handoff, cloud-push-test 11-17, Ship Desk LATEST, studio RULING card-images + pending-commit-2026-11-17 ×10) — all but the studio set and the review already ruled by the intake → relayed, not re-ruled · Mac: grok-inbox ivan-review 11-17, stalk 11-17, attention 11-16, pullcheck 11-17, `digests/digest-2026-11-17.md`, `chief-of-staff/tuesday-board-2026-11-17.md`, youtube PRIS25 thumbs-v2 (no action) · `awaiting-cos`: 3 (tuesday-2026-11-17-1/2/3).** Ruled (full table: Project `claude/handoffs/desk-2026-11-18-routes.md`):
  - **tuesday-2026-11-17-1 Holliday** → **ruled WATCH**, new calls.json row at the Nov 24 read (Hold's floor failed two reads: $91.00/11, $90.50/12); old row untouched; HOLD-UNDER-REVIEW qualifier declined (moot). `-11-10-2` closed (superseded). **-17-2 + -11-10-3 Tape** → closed (parked by Mo, `42276bc`). **-17-3 drift** → attended item 2.
  - **Ivan 11-17** (verified live by curl): Donruss/Flagship pre-release copy + $19.99 sticky + 2025-26 button = **O-08 Conversion, live Thu Nov 19** (not built, so R48(d) not started) · Cosmic/Flagship hero count vs sticky → widen O-08 (hero count carries its date) · `/pokemon-tcg-2026` hero "Prices read Oct 19" → **Price Truth Wed 12:47** after O-14/O-03 · Base Set / Skyridge Charizard swings → Price Truth checks n (P2) · "Disagree" → **applied**: `grok-requests/ivan.md` walk-on-ship-day note.
  - **O-11 Pull Check brief** → **applied**: `claude/grok/brief-pullcheck-2026-11-18.md` (36 priced sets only; DLR/Flowing Fists/McD/Bowman out) + copy in `grok-requests/seeker.md`; Seeker reading that file is unproven → Nov 19–20 pullcheck rows are the test; decision Fri Nov 20 unchanged.
  - **O-10 STATE cap** → **applied**: 25,449 B → under 24,000 B (archive pass of 2026-11-18: Nov 14 + Nov 16 desk NOW blocks, Nov 14 desk entry, Sep-era deploy-key Push/deploy rule replaced by an R48 pointer).
  - Studio pending-commit + card-images RULING → noted (Studio code + Mo's ruling, no repo action; intake ledgers). Read, no desk action: stalk/attention (contestants), digest 11-17 (Tape parked), Tuesday report (its asks = the three rows above).
  **Commits:** one docs commit (STATE + archive pass, NEEDS-MO, pipeline rulings ×5; does not deploy). Competitor scan of the pipeline diff: 0 names (older R32 mentions in the file are the NC Fri scrub row, unchanged). **Cloud push refused again** (`jmmorelli/shopcardhub is not in this session's authorized repository set`) → **mailbox (R48(c))**: `claude/night-crew/pending.md` + `pending-desk.patch.txt` for the Ship Desk Wed Nov 18 06:41.
  **Deliveries:** none (R10 Am. 6).
  **Instruments:** feed day **Nov 17** · 41 cards · 34 numeric · 37 images (3 G25 Sapphire rows held by Price Truth `d3c99b8`, by design; price-data copy 37/40) · GA4 17:57Z Nov 17: KE yesterday **8 / 74** · organic KE7 **16.88%** vs blended 5.74% (60/523) · returningShare7 2.75% (14) · clicks7 **60** · bots 51.8% (SG 235, CN 40) → clean 256 / 59 KE · `cardPageClicks7` **2** · iPhone 13 QA 5/5 200, sw 390, 0 errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **Ideas/retention:** no ideas file (desk off); no retention file since Nov 15 (0 unruled).
  **Stumbles:** Mac `$HOME` full (clone to `/tmp`); the cloud Playwright npm install pulled a browser build not on disk → re-ran on the preinstalled one.
- **Nov 17 ~01:12–02:10 UTC (CoS · desk)** — chase six re-marked Nov 16 (`355dd190`) + Gengar false-copy pass (`360c260a`), cloud push refused → mailbox → **live via the Ship Desk Nov 17 06:41 (`906494e`)**. Full entry verbatim in `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-18 (moved for the 24 KB cap, O-10).
- *(Pointers for R24 and the run history — which entry sits in which archive pass — moved whole to `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-04; the Nov 4 weekly entry, the Oct 30 EPN line and the expired Oct 26 freeze rule went there in the pass of 2026-11-06; the Nov 4 desk, Nov 6 Night Crew deploy and Nov 6 Commissioner entries and the Oct 29 NOW block (R44/R45 now live in LANE-RULES) in the pass of 2026-11-09; the Nov 4 weekly + Nov 2/03 NOW blocks, the Nov 4 EPN MILESTONES line the Nov 6 desk entry and the Nov 9 Night Crew deploy entry in the pass of 2026-11-10; the Nov 4 top-3, the Nov 9 Monday NOW block and the Nov 9 desk entry in the pass of 2026-11-11; the Nov 10 desk entry and the Nov 10 Tuesday-board NOW block in the pass of 2026-11-12; the Nov 10 desk NOW block, the Nov 12 desk entry and the Nov 11 weekly entry in the pass of 2026-11-14; the Nov 11 weekly + Nov 12/13 desk NOW blocks, the Nov 13 desk and Nov 13 NC deploy entries in the pass of 2026-11-17 ; the Nov 14 + Nov 16 desk NOW blocks, the Nov 14 desk entry and the Sep-era Push/deploy rule text in the pass of 2026-11-18 — still open from them: Van Gogh Pikachu noindex → Nov 12 check · Tape unsent → attended.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
