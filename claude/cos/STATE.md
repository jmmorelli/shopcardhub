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

## NOW — 2026-11-20 (CoS desk, Thu Nov 19 evening slot): docs-only; O-11 "zero rows over filler" line added to the Pull Check brief (Fri decides); O-64 relayed into the Night Crew BACKLOG; Ivan 11-19 ruled (Donruss/Flagship presale heroes → Conversion; Deal dock claim not reproduced). Gates 0/69 · 0/3 · 0/1 (prices WARN +2 = calendar aging, `/pokemon-30th-anniversary-2026` stamp Oct 29 past 21 days). Before that: 2026-11-19 (CoS desk, Wed Nov 18 evening slot): docs-only; O-23 PRIS25 link into the X draft; EPN Nov 18 milestone; Ivan 11-18 ruled.

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-11-18 (Chrome Browser 1 read: GSC via `/u/1/` = shopcardhub@gmail.com, MailerLite live; GA4 from the nightly snapshot, data day Nov 17, 17:39Z; Bing from the API snapshot, 4 weeks to Nov 13 — Bing Webmaster is signed out in Browser 1; EPN not read — the desk's Wednesday read, R22)

1. **Money is still ~$0, and the Black Friday money page is 29 days stale.** EPN trailing 30 d ≈ **$11 = 3.7% of M0** (last read Nov 9; no newer CSV). GA4 outbound `click` **56 / 7 d** (45), buy strips **2**, card pages **2 clicks on 24 views**. `/best-hobby-boxes-2026` — #2 landing page (20 / 7 d) and #2 Bing page (330 impr, 14 clicks, pos 4.3) — still prints medians **read Oct 20**, nine days before Black Friday (Nov 27); `data/boxes.json` has had **no owner** since the Box Desk lane was never created. *Doing:* ruled to the Monday price lane **Nov 23, first item (P0)**; the weekly never changes prices.
2. **Search is one seasonal page, and AI assistants now out-convert it.** Organic sessions **59 / 7 d** (71); **organic key-event rate 16.95%** beside blended **6.14%** (28 d: 17.49% vs 3.27%). `/mcdonalds-pokemon-cards-2026` = **55** of the week's landings at 29% KE (Bing: 2,050 impr, 43 clicks, pos 6.8); the promo ends **Dec 14**. **ChatGPT: 33 sessions, 22 KE** (28 d AI Assistant 73 sessions, 39 KE) — the best-converting source. Google: **indexed 1, not indexed 91** (33 "crawled – not indexed", validation **Failed**; 57 "discovered"); GSC **4 clicks / 16 impr in 28 d**. Bing API 4 wk to Nov 13: **91 clicks / 1,262 impr**. *Doing:* no GSC spend (§0 ruling); missing release rows → Goal League; the McDonald's page needs a successor before Dec 14 (Goal League, flagged).
3. **The list is 1 outside person, and every capture promises an email that is paused.** MailerLite (live): **4 active — 1 outside (Oct 31), 0 new since**. GA4 `signup_view` **157**, `signup_submit` **0**, `newsletter_signup` 0. Returning users **13 / 7 d** (9), ~6% of clean users. Bots **48%** of sessions (SG 196 @ 0.4 s, CN 28). Mo paused the Tuesday Tape on Nov 17, yet **114 pages** still say "One email, Tuesdays". *Doing:* → **needs-you** (§0.3: the capture's promise contradicts the pause); no new capture goes up until Mo rules.

**§0.3:** the PIVOT Nov 19 test reads **organic 59 > 48 ✓ · returning 13 > 6 ✓ · clicks/100 clean 56/242 = 23.1 ≥ 15.7 ✓ · Google indexed 1 ✗ → 3 of 4** (same as Nov 11). New contradiction: the capture promise vs the Tape pause (needs-you).

## MILESTONES (R22 — one line per Wednesday read; the desk appends)

- **2026-11-18 (attended CoS; CSV `Card Hub/epn/epn-byday-2026-11-04_2026-11-17.csv`, Nov 4–17):** bot fix `dbebabf` graded working — ~95 clicks/day in the bot days → **7.0/day Nov 13–17** (eBay 8 = GA4 8 on Nov 16) · **$4.82 earned, all Nov 4** · no sale since Nov 4 · trailing 30 d **$10.80 to Nov 17 = 3.6% of M0**; both box sales leave the window Dec 3–4 → ~$0 without a sale. n too small for a trend (R22). Read: `claude/cos/epn-read-2026-11-18.md`.

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
- **Nov 20 ~01:10–01:50 UTC (Nov 19 ~17:10 PT) (CoS · desk, Mac-linked, unattended; Thu slot on time).** Freshness: HEAD `fa12b9c8` · origin/main `fa12b9c8` at clone · delta 0 · gates **0/69 · 0/3 · 0/1** vs base 0/67 · 0/3 · 0/1 (prices WARN +2 = calendar aging: `/pokemon-30th-anniversary-2026` stamp Oct 29 crossed 21 days today; no code). Read LANE-RULES (precedence, R1, R2, R10 Am. 6, R48), STATE top + last 3 entries, NEEDS-MO, ideas/retention ledgers, **CoS LEDGER** (last intake Nov 19 23:25Z), daily review 11-19. **Prompt drift (file wins):** R48 — work and push from the cloud clone (`https://github.com/jmmorelli/shopcardhub`), never the deploy key; Mac `/sessions` 100% full again (`mkdir $HOME/…` → "No space left on device") → read-only Mac clone + key copy under `/var/tmp/desk1120` for the gates, deleted at end · STEP 3 vendor delivery dead (R10 Am. 6) · prompt still does not name the CoS LEDGER (O-20).
  **Inbox since the Nov 19 01:12Z desk — Project 16:** daily-review 11-18 + 11-19, SEASON-2, IDEAS, attended 11-18c, wiw 11-18, NC log 11-19, integrity-watch 11-19 + proposals, traffic 11-19, heartbeat 11-19, pullcheck 11-19, x-daily 11-19, attended 11-19, measure 11-19, bet-20261119-1 → **all but review 11-19 ruled by the intake (LEDGER Nov 18 22:25–Nov 19 15:25) → relayed, not re-ruled**; review 11-19 relayed (P0 KEEP, E7 standing, attended list → O-25). **Mac 5:** grok-inbox ivan-review 11-19 + 11-14 backfill, pullcheck 11-19, stalk 11-19, attention 11-18. **`awaiting-cos`: 0.** Ideas: none. Retention: no file; LEDGER 0 `proposed`. Skipped: none. Routes: Project `claude/handoffs/desk-2026-11-20-routes.md`.
  - **O-11 applied:** "no row from a set we do not price; give zero rows rather than filler" appended to Mac `grok-requests/seeker.md`. Fri Nov 20 file decides (0 priced → threads-only, CoS attended).
  - **O-64 applied:** BET-20261119-1 row written into Project `claude/night-crew/BACKLOG.md` (P1, after the Fri set and O-58; Sun Nov 22 build, live Mon Nov 23) — the daily review handed this relay to the desk.
  - **Ivan 11-19** (verified live, curl + iPhone 13): (1) Donruss FB + Flagship Bkb heroes print Oct 12 / Oct 23 presale asks under "Out since" — confirmed (Flagship "$209.99 … 289 listings that day"; Donruss "Live ask, Oct 12", "Configuration And Presale") → **routed to the Conversion contestant** (dated, labelled post-release ask or "No dated box read yet"; presale to history; P2); (2) "no new screen-1 button" on the Deal pages → **declined, not reproduced**: fixed dock at y 604–664/844 on stocking stuffers; O-09 stays done; the five slugs written into `grok-requests/ivan.md`; (3) Base Set TCGplayer column → declined (Nov 18 ruling stands).
  - Stalk 11-19 / attention 11-18 / Grok pull check 11-19 → noted (contestants', X weekly and Pull Check inputs).
  **Commits:** docs-only (STATE + archive pass of 2026-11-20, NEEDS-MO); does not deploy. **Cloud push refused** (`jmmorelli/shopcardhub is not in this session's authorized repository set`) → **mailbox (R48 c)**: Project `claude/night-crew/pending.md` + `pending-desk.patch.txt` for the Ship Desk Fri Nov 20 06:41.
  **Deliveries:** none (R10 Am. 6; no vendor brief exists).
  **Instruments:** feed day **Nov 19** · 41 cards · 34 numeric · 39 images · GA4 17:48Z Nov 19 (7.4 h): KE yesterday **2 / 42** · organic KE7 **17.02%** vs blended 6.02% · returningShare7 3.36% (13) · clicks7 **48** · buystrip 3 · bots 44.9% (SG 166 @ 0.5 s, CN 19) → clean 227 / 48 KE · `cardPageViews7` 19 · `cardPageClicks7` 2 · iPhone 13 QA 5/5 200, sw 390 = iw, 0 console errors, photos 0/0 · 3/3 (+1 empty-src template img) · 20/20 · 66/66 · 5/5.
  **NEEDS-MO verified:** TAG open; capture-vs-paused-Tape open (O-53 per-page alert is the planned replacement, live by Dec 1); push-access item kept (O-25).
  **Stumbles:** Mac `$HOME` full again (gates run from `/var/tmp`).
- **Nov 19 ~01:12–02:05 UTC (Nov 18 ~17:12 PT) (CoS · desk, Mac-linked, unattended; Wed slot on time).** Freshness: HEAD `9566dff7` · origin/main `9566dff7` at clone · delta 0 · gates **0/67 · 0/3 · 0/1** = base (terminal WARN = feed not cloned). Read LANE-RULES (precedence, R10 Am. 6, R38, R39, R48), STATE top + last 3 entries, NEEDS-MO, ideas LEDGER, **CoS LEDGER** (last intake Nov 18 23:25Z), attended 11-18 ×2. **Prompt drift (file wins):** R48 — work and push from the cloud clone, not the deploy key; Mac `/sessions` still 100% full (`mkdir $HOME/…` → "No space left on device") → read-only Mac clone + key copy under `/var/tmp/desk1119`, deleted at end · STEP 3 vendor delivery dead (R10 Am. 6) · prompt still does not name the CoS LEDGER (O-20).
  **Inbox since the Nov 18 01:12Z desk — Project 27:** attended 11-18 + 11-18b, design-pass brief, kb/design ×6 (README, INDEX, 00, 01, 02-motion, INBOX), bet-20261117-1 live note, bet-20261118-1, measure 11-18, epn-read 11-18, x-daily 11-18, pullcheck 11-18, heartbeat 11-18, traffic 11-18, cupertino held-run19 patch, KB Bowman AUDIT-LOG 11e + ADDENDA 11g, KB Pokémon AUDIT-LOG 11f + ADDENDA 11f, night-crew log 11-17, wildcard pending.patch → **all ruled by the intake (LEDGER rows Nov 18 09:35–15:25) → relayed, not re-ruled** (O-29, O-31–O-45). **Mac 11:** grok-inbox ivan-review 11-18, pullcheck 11-18, stalk 11-18, attention 11-17 · grok-requests seeker/ivan (the Nov 18 desk's own writes) · epn CSV Nov 4–17 + design-kb ×4 (attended 11-18, no action). **`awaiting-cos`: 0.** Ideas: none (no file). Retention: no file since Nov 15; LEDGER 0 `proposed`. Skipped: none. Routes: Project `claude/handoffs/desk-2026-11-19-routes.md`.
  - **O-23 applied:** PRIS25 link `https://youtu.be/6-A39NdUl0A` written into Project `claude/cos/x-youtube-2026-11-14.md` (post + alt). Posting still waits on Mo's go (control room A-02); nothing written to X (R10).
  - **EPN MILESTONES line applied** (measure 11-18 row: "desk appends tonight") — below under MILESTONES.
  - **Ivan 11-18** (verified live, curl + iPhone 13 render): (1) `/pokemon-tcg-2026` hero + six chips "Oct 19" (16× on the page) → **already O-03** (Price Truth Thu, 3rd miss → Night Crew), relayed; (2) Charizard +25% / −26% "read as errors" → intake closed O-26(b) (33 and 14 sales), not re-ruled; Ivan's "flag or hold a big one-mark move on a top-weight card" is method → **queued, CoS weekly Wed Nov 25**; (3) **`/skyridge-index` Method says the Crystal Charizard and Gengar H9 marks are "flagged thin"; the Charizard #146 row ($4,651.81, 14 sales) carries no thin flag — confirmed live** → **routed to Price Truth Thu Nov 19** (render the flag or drop the sentence; copy-vs-render, G2, P2); (4) Base Set index "TCGplayer shop column gone" → **declined, not reproduced:** Shop header + 507 shop elements render at 390 with JS (R38 intact; Ivan's headless likely lacked the client-side data); (5) campid clean · Delta Reign row unpriced (DLR26 PRE, price lane) → noted.
  - **Pull Check 11-18 (Mac file, run 14:47Z, after the 01:18Z brief):** 4 rows, 0 from the 36 priced sets (2017 Bowman Chrome, Topps Chrome Holiday, an unnamed SIR, Chinese 30th) → evidence for **O-11** (brief not reaching Grok); Nov 19–20 files and the Fri decision unchanged.
  - Stalk 11-18 / attention 11-17 → read, no desk action (contestants' and X weekly inputs).
  **Commits:** docs-only (STATE + archive pass of 2026-11-19, NEEDS-MO); does not deploy. **Cloud push refused** (`jmmorelli/shopcardhub is not in this session's authorized repository set`) → **mailbox (R48 c)**: Project `claude/night-crew/pending.md` + `pending-desk.patch.txt` for the Ship Desk Thu Nov 19 06:41.
  **Deliveries:** none (R10 Am. 6; no vendor brief exists).
  **Instruments:** feed day **Nov 18** · 41 cards · 34 numeric · 39 images · GA4 17:39Z Nov 18 (7.5 h): KE yesterday **5 / 38** · organic KE7 **16.95%** vs blended 6.14% (56/456) · returningShare7 2.94% (13) · clicks7 **56** · bots 48.1% (SG 196 @ 0.4 s, CN 28) → clean 242 / 56 KE · `cardPageClicks7` 2 · iPhone 13 QA 5/5 200, sw 390 = iw, 0 console errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **NEEDS-MO verified:** EPN sign-in item **closed** (attended EPN read Nov 18); capture-vs-paused-Tape still open (7 page files still print "One email, Tuesdays"); TAG open; push-access item kept (refused again tonight; O-25).
  **Stumbles:** Mac `$HOME` full again (clone to `/var/tmp`).
- **Nov 18 ~19:05–19:45 UTC (CoS · weekly)** — top 3 + §4 audit + weekly commit `3e80d815` (release dates, Museum copy, Black Friday date, photo refresh), cloud push refused → mailbox → **live via the Ship Desk Nov 18 (`5a559f3` + `1b60de7`)**. Full entry verbatim in `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-20 (moved for the 24 KB cap, O-10).
- **Nov 18 ~01:12–02:30 UTC (CoS · desk)** — Holliday Hold → WATCH Nov 24, Pull Check brief rewritten, O-10 STATE trim; docs-only, cloud push refused → mailbox → live via the Ship Desk Nov 18. Full entry verbatim in `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-19 (moved for the 24 KB cap, O-10).
- **Nov 17 ~01:12–02:10 UTC (CoS · desk)** — chase six re-marked Nov 16 (`355dd190`) + Gengar false-copy pass (`360c260a`), cloud push refused → mailbox → **live via the Ship Desk Nov 17 06:41 (`906494e`)**. Full entry verbatim in `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-18 (moved for the 24 KB cap, O-10).
- *(Pointers for R24 and the run history — which entry sits in which archive pass — moved whole to `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-04; the Nov 4 weekly entry, the Oct 30 EPN line and the expired Oct 26 freeze rule went there in the pass of 2026-11-06; the Nov 4 desk, Nov 6 Night Crew deploy and Nov 6 Commissioner entries and the Oct 29 NOW block (R44/R45 now live in LANE-RULES) in the pass of 2026-11-09; the Nov 4 weekly + Nov 2/03 NOW blocks, the Nov 4 EPN MILESTONES line the Nov 6 desk entry and the Nov 9 Night Crew deploy entry in the pass of 2026-11-10; the Nov 4 top-3, the Nov 9 Monday NOW block and the Nov 9 desk entry in the pass of 2026-11-11; the Nov 10 desk entry and the Nov 10 Tuesday-board NOW block in the pass of 2026-11-12; the Nov 10 desk NOW block, the Nov 12 desk entry and the Nov 11 weekly entry in the pass of 2026-11-14; the Nov 11 weekly + Nov 12/13 desk NOW blocks, the Nov 13 desk and Nov 13 NC deploy entries in the pass of 2026-11-17 ; the Nov 14 + Nov 16 desk NOW blocks, the Nov 14 desk entry and the Sep-era Push/deploy rule text in the pass of 2026-11-18 — still open from them: Van Gogh Pikachu noindex → Nov 12 check · Tape unsent → attended.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
