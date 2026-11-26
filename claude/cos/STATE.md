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

## NOW — 2026-11-26 (CoS desk, Wed Nov 25 evening slot, unattended): inbox ruled by the intake through 23:22Z; desk ruled Ivan's Nov 25 review (O-111, two copy fixes → Wildcard + Conversion via the intake), STATE trimmed for O-103 (archive pass of 2026-11-26), instruments clean. Mo's capture hide (O-110) live. Previous NOW (weekly, Nov 25 11:00 PT): 700/700 phone sweep clean; 5 commits shipped by the Ship Desk (`bb1d0a61`).

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-11-25 (GSC live, Browser 1 `/u/1/` URL-prefix property; GA4 nightly snapshot 18:53Z, data day Nov 24 + Realtime in Browser 2; Bing API snapshot, 4 wk to Nov 20 — Bing Webmaster signed out; **MailerLite not read — it asked for an emailed login code**; EPN: no CSV newer than Nov 17)

1. **Money is still ~$0 into Black Friday (Fri Nov 27).** EPN trailing 30 d **$10.80 to Nov 17 = 3.6% of M0**; no sale since Nov 4; both box sales leave the window Dec 3–4 → $0 without a sale. GA4 outbound `click` **24 / 7 d** (56 a week ago), **16 of them from `/mcdonalds-pokemon-cards-2026`**, 4 from `/best-hobby-boxes-2026`; buy strips 2; card pages **0 clicks on 15 views**. Without McDonald's the site makes ~5 clicks per 100 clean sessions. *Doing:* BHB is re-read (Nov 24, "look again Nov 26"); this run removed four past-dated "next read" promises and kept a Pro Debut box off the Chrome Baseball shelf; `/pokemon-tcg-2026` (Oct 19 levels 20–37% over the engine) and the Delta Reign box (3 reads on 3 pages) → Monday price lane.
2. **Organic search halved in a week and Google is still shut.** Organic sessions **29 / 7 d** (59), Bing 24 · Yahoo 3 · DDG 2 · **Google 0**; **organic key-event rate 13.79%** beside blended **5.11%** (28 d: 18.29% vs 3.77%). GSC (live): **indexed 1, not indexed 91** (33 crawled-not-indexed, validation **Failed**; 57 discovered; 1 redirect) — unchanged since Nov 18, with 523 new card URLs in the sitemap; GSC **4 clicks / 11 impr, 28 d**. Bing 4 wk: 88 clicks / 1,288 impr; McDonald's 45 of them — the promo ends **Dec 14**. AI assistants: ChatGPT **39 sessions, 17 KE** (best source again). *Doing:* no GSC spend (§0 ruling); release-calendar gaps (17 missing rows, Greninja date conflict) → Goal League; JSON-LD missing on 575 card pages → Night Crew P1.
3. **Nobody comes back and nobody signs up.** Returning users **6 / 7 d** (13), clean share 3.87%, with **0 key events**; `/card*` landings 0/793 returning over 28 d. `signup_view` 110, `newsletter_signup` **0**. Last list read (Nov 18): 4 active, 1 outside. The capture still promises "One email, Tuesdays" (7 static files + `js/signup.js` on 117 pages) while the Tape is paused — needs-you, open since Nov 18. *Doing:* Retention Analyst's one change → Night Crew P1: put "Since you were here" (`js/home-you.js`, dropped by home v2) back inside the existing home watchlist tile; kill test Dec 9.

**§0.3:** PIVOT test **0 of 4** above baseline (organic 29 < 48 · returning 6 ≥ 6 at par, not above · clicks/100 clean 24/167 = 14.4 < 15.7 · indexed 1 < 3) — down from 3 of 4 on Nov 18. Contradiction, unchanged: the capture's promise vs the Tape pause (needs-you).

## MILESTONES (R22 — one line per Wednesday read; the desk appends)

- **2026-11-18 (attended CoS; CSV `Card Hub/epn/epn-byday-2026-11-04_2026-11-17.csv`, Nov 4–17):** bot fix `dbebabf` graded working — ~95 clicks/day in the bot days → **7.0/day Nov 13–17** (eBay 8 = GA4 8 on Nov 16) · **$4.82 earned, all Nov 4** · no sale since Nov 4 · trailing 30 d **$10.80 to Nov 17 = 3.6% of M0**; both box sales leave the window Dec 3–4 → ~$0 without a sale. n too small for a trend (R22). Read: `claude/cos/epn-read-2026-11-18.md`.

- *(Older reads, Sep 18–Oct 13, and the Oct 21 + Oct 28 lines (pass of 2026-11-02): `STATE-ARCHIVE-2026-10.md`, archive passes of 2026-10-16 and 2026-10-23. The Nov 9 line: `STATE-ARCHIVE-2026-11.md`, desk pass of 2026-11-26.)*

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
- **Nov 26 ~01:11–01:50 UTC (Nov 25 ~17:11 PT) (CoS · desk, Mac-linked, unattended; Wed slot on time).** Freshness: HEAD `b05d6323` · origin/main `b05d6323` at clone · delta 0 · gates **0/63 · 0/3 · 0/1** vs base 0/63 · 0/3 · 0/1 (= base; terminal WARN = feed not cloned) — run in the **cloud clone** (R48). Read LANE-RULES (precedence, R48), STATE top + last entries, NEEDS-MO, CoS LEDGER (last intake Nov 25 23:22Z). **Prompt drift (file wins):** R48 — cloud clone, deploy key not used (Mac `/sessions` 100% full again: `mkdir $HOME/desk-keys` → "No space left on device"; nothing needed it) · STEP 3 vendor delivery dead (R10 Am. 6) · prompt does not name the CoS LEDGER (O-20).
  **Inbox since the Nov 25 01:11Z desk — Project:** daily-review 11-24/11-25, bet-20261125-1, measure 11-25, weekly-2026-11-25-backlog, x-daily + x/followers 11-25, pullcheck 11-25, heartbeat 11-25, traffic 11-25, KB Bowman AUDIT-LOG 11h, kb/design/04-house-looks, x/LATEST + PLAYBOOK + TESTS + ORDERS + CHARTER, night-crew log 11-25, growth-lab NOTEBOOK/LATEST/CHARTER, handoff x-team-growth-lab, x-addendum (restored pointer), night-crew/pending (capture patch) → **ruled by the intake (LEDGER 09:22, 12:22, 15:22) → relayed, not re-ruled.** **New after the 23:22Z intake:** `daily-review-2026-11-25` (00:42Z) → relayed; its re-rulings where they differ from the ledger (O-84 to the Coverage Builder; LAB-1 dark build Mon not Fri; STATE trim Thu) → **ledger stands (O-20)**, except the trim, done tonight per O-103. **Mac 5:** `grok-requests/ivan.md` (own, Nov 25 01:16Z) · stalk 11-25, attention 11-24, pullcheck 11-25 → noted (Grok copy lane carries them tonight; pullcheck already ruled from its Project copy) · **ivan-review 11-25 (17:22Z, after the copy lane's read) → ruled below.** `awaiting-cos`: **0**. IW lookback (11-16, 11-19, 11-23): nothing new. Ideas: none (no Wed file; Ideas Desk off since Oct 19). Retention: no file (Sundays); LEDGER 0 `proposed`. Skipped: none.
  - **Ivan Nov 25 (served HTML + desktop render; his 390 px render failed again):** (1) BHB now reads "checked Nov 24 … look again Nov 26" → **confirmed live, O-99 holds** (the Nov 26 walk is Deal's Thu patch / Ivan's Thu read). (2) `/topps-holiday-baseball-2026` prints two mega box asks ($37.99 delivered in the gift pick/table vs the dock's before-shipping ask, Ivan saw $35.99) → **confirmed in served HTML** → **O-111 (a) → Wildcard** Thu patch, copy only. (3) Donruss FB / Flagship Bkb card tables say "Live ask, Oct 12" / "Live ask, Oct 4" → **confirmed** → **O-111 (b) → Conversion** Thu patch ("Ask on Oct 12"), else Deal after the Nov 30 merge. (4) Tin "$44.99 list" vs mega "$29.99 list" → Wildcard checks against topps.com (in O-111 a). (5) His screen-1 findings unverified while his 390 render fails → **accepted**: not scored as misses or confirmations. Orders written to `handoffs/desk-2026-11-26-routes.md` for the intake to relay into the two pending.md files (not re-typed here).
  - **O-103 → applied:** STATE.md 21,983 B on main → archive pass of 2026-11-26 (the Nov 25 desk entry + the Nov 9 MILESTONES line, verbatim, to `STATE-ARCHIVE-2026-11.md`) → about 19.6 KB with this entry.
  - **O-110 → live check passed:** `/css/site-fixes.css` holds CAPTURE-PAUSED, `/js/signup.js` holds "PAUSED = true" (for the intake to close).
  **Commits:** one docs-only commit (STATE + archive + NEEDS-MO), does not deploy (ignore list). **Cloud push refused** (`jmmorelli/shopcardhub is not in this session's authorized repository set`) → **mailbox (R48 c)** `night-crew/pending.md` + `pending-desk.patch.txt` (sha256 in pending.md; `git am -3` on `b05d6323`), Ship Desk Thu Nov 26 06:41 or an intake fire. Refused push → O-25.
  **Deliveries:** none (R10 Am. 6; no vendor brief exists).
  **Instruments:** feed day **Nov 25** · 41 cards · 35 numeric · 40 images · GA4 18:53Z Nov 25 (6.3 h) · KE yesterday **4 / 43** · organic KE7 **13.79%** · returningShare7 **2.21% (6)** · clicks7 **24** · buystrip 2 · bots 40.36% (SG 113 @ 0.5 s) → clean 167 / 24 KE (14.37/100) · cardPageViews7 15 · cardPageClicks7 0 · QA 5/5 200, sw 390 = iw, 0 console errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **NEEDS-MO verified:** impact.com payment (O-01) open · YouTube A-04 open · LAB-1 Monday email yes/no (A-08) open · task repo access open (this desk's push result below confirms).
  **Stumbles:** Mac `$HOME` full again (key not copied; nothing needed it).
- **Nov 25 ~18:55–20:30 UTC (Wed 11:00 PT slot) (CoS · weekly site audit, unattended).** STEP 0: fresh clone, LANE-RULES read. **Prompt drift (file wins):** the prompt says clone with the Mac deploy key — R48 says push from the cloud clone over HTTPS and the deploy key is never in the push path (followed R48); the prompt still lists the pre-Oct 1 roster (Mobile QA, Perf & SEO, Vault & Funnel, Terminal Product) and `rooms/terminal.md` (merged into site-quality Oct 1) — spawned the CHARTER §2B agents instead; `claude/reaudit-log.md` and the brief live in the repo under `claude/archive/project-2026-10/claude/` (Nov 4), not the Project.
  **§0:** above. Chrome: Browser 1 (GSC) + Browser 2 (GA4 Realtime) selected per the prompt. MailerLite wanted a login code → not read (Mo signs into nothing; noted once). Bing Webmaster signed out → API snapshot.
  **Agents (subagents, rooms written by the CoS):** UX Auditor (14 pages × 2 + **700/700 sitemap phone sweep: all 200, 0 overflow, 0 console errors, 0 broken images, photos 1,630/1,631**; Gengar duty) · Photo Keeper (feed 40/41 pictured; map 1,291 → 1,305; 1 dead link of 1,496, not visible) · Content Editor + Release Watch · Retention Analyst (4/14). Index Keeper and Gate Keeper not spawned: marks are current (Nov 23) and the gates ran clean in this run.
  **Beacon proof:** production loads 19:15–19:51Z, route aborts first, 0 analytics requests attempted; **GA4 Realtime 19:53Z: 0 active users in 30 min — proof held.**
  **Scores:** Img 8 · Mob 7 · Bugs 8 (↓1, WL-155 regression — fixed this run) · Mot 8 · Vault 7 · Perf 8 · Id 8 · Cred 7. Return-user 4/14.
  **Filings adjudicated:** `awaiting-cos` in `data/pipeline.json`: **0**. Agent findings ruled in the rooms: watchlist demo-thumb fix **accepted, shipped in the weekly commit**; photo refresh **accepted**; content fixes **accepted**; Pro Debut leak **accepted, fixed by the CoS** (query + deny, customid untouched); card JSON-LD (575 pages) → Night Crew **P1**; "Since you were here" restore → Night Crew **P1**; Vault title wrap, resolver crash on missing page, generated mastheads still future-tense (BF26/BCS26/DLR26), home TH26 "as of Nov 23"/"Updated Nov 24" → Night Crew **P2**; `/pokemon-tcg-2026` Oct 19 levels + Delta Reign 3 reads + `/bowman-bangers` stamp Sep 24 → **Monday price lane Nov 30**; 17 missing release rows + Greninja date conflict → **Goal League Commissioner**; Bangers "check back" + BOW1C "re-read weekly" → Index Keeper (method-adjacent, not copy-edited).
  **Commits (on `72558053`):** `70ca116b` /watchlist demo thumbs (UX) · `c14bca10` photo map (Photo Keeper) · `da09dc3a` past-dated promises + release tense (Content) · `57b5d11f` Pro Debut off the Chrome Baseball shelf (CoS) · docs commit (STATE, NEEDS-MO, reaudit row). Gates **0/63 · 0/3 (831) · 0/1** (base 0/64 · 0/3 · 0/1). **Cloud push refused** (`jmmorelli/shopcardhub is not in this session's authorized repository set`) → **mailbox R48 c**: Project `claude/night-crew/pending.md` + `claude/night-crew/pending-weekly.patch.txt`; Ship Desk Thu Nov 26 06:41. Rollback once live: `git revert` the five shas the Ship Desk logs. pushLog entry is the Ship Desk's on apply.
  **Bowman check:** not due (first Wednesday was Nov 4).
- *(Older entries — the Nov 25 desk + the Nov 9 MILESTONES line (desk pass of 2026-11-26), the Nov 24 desk (weekly pass of 2026-11-25), the Nov 21 desk (pass of 2026-11-25), the Nov 20 desk (pass of 2026-11-24), the Nov 19 desk, Nov 18 weekly + desk, Nov 17 desk, and the pointer paragraph naming which entry sits in which archive pass — are verbatim in `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-21 and earlier passes. Still open from them: Van Gogh Pikachu noindex → Nov 12 check · Tape unsent → attended.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
