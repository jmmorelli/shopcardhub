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

## NOW — 2026-11-28 (CoS desk, Fri Nov 27 evening slot, unattended): inbox ruled by the intake through 23:35Z + the 00:41Z daily review relayed; desk ruled Ivan's Fri review (BHB line → Deal Sun as a read-cadence sentence; "Checked Nov 27" declined), wrote the overdue Grok brief file (BLOCKED row, 3rd ask) and refreshed the Editor/SEO-AEO request files on the Mac. Needs-Mo unchanged: Vercel A-11 (pause risk ~Dec 1–3). Previous NOW (desk, Nov 26 slot): Ivan Nov 26 ruled (O-122), O-119 to Mo.

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
- **Nov 28 ~01:12–02:10 UTC (Nov 27 ~17:12 PT) (CoS · desk, Mac-linked, unattended; Fri slot on time, Black Friday).** Freshness: HEAD `0e446c76` · origin/main `0e446c76` at clone · delta 0 · gates **0/60 · 0/3 · 0/1** vs base 60/3/1 (`tools/gate.sh --base origin/main`: GATE PASS) — cloud clone (R48). Read LANE-RULES (precedence, R48, R49 a–h), STATE top + last entries, NEEDS-MO, CoS LEDGER (last intake Nov 27 23:35Z), BLOCKED (Grok row). **Prompt drift (file wins):** R48 — cloud clone; deploy key not copied (Mac `/sessions` 100% full again: `mkdir $HOME/deskkey` → "No space left on device"; nothing needed it) · STEP 3 vendor delivery dead (R10 Am. 6) · STEP 2 weekday slotting superseded by R49 · STEP 4 raw.githubusercontent reads fail (repo private) → read `price-data` via `git fetch` · prompt names neither LEDGER nor QUEUE (O-20) nor the Ivan thread step (O-130).
  **Inbox since the Nov 27 01:12Z desk — Project:** every doc filed through 23:35Z (site-sweep, x-daily, pullcheck, heartbeat, traffic, measure 11-27, bet-20261127-1, attended handoffs tcgplayer-live / lookup-path-rows / visitor-question-box, ivan-strategy-thread, KB AUDIT-LOGs + ADDENDA, night-crew log, own routes 11-27) → **ruled by the intake (LEDGER 09:22, 10:31, 15:22) → relayed, not re-ruled (O-20).** **New after the intake:** `daily-review-2026-11-27` (00:41Z) → relayed; it names the desk's Grok brief file as due tonight → **applied** (below); its other moves (Coverage Builder 20 a run from Dec 3; Cupertino run 28 BHB revert test Mon; Commissioner owns O-03 C Sat) are review rulings the intake ledgers Sat. **Mac (find -newermt 01:12Z):** `grok-inbox/` stalk 11-27, attention 11-25/11-26, pullcheck 11-27 → noted (Grok copy lane 00:40) · **ivan-review 11-27 (17:23Z) → ruled below** · `grok-requests/ivan.md` (attended 23:13Z: Sunday "Come back?" + strategy thread #2) → noted, O-130 #3 met · `dungeon-keeper/CHANGELOG.md` → noted (Card Dungeon, R13). `awaiting-cos`: 0. Ideas: no file (desk off since Oct 19). Retention: no file (Sundays). Skipped: none.
  - **Ivan Nov 27 (served HTML; 390 render failed a 4th time):** confirmed the Nov 26 fixes live (BHB date + "Search eBay"; Donruss/Flagship "Ask on"). (1) BHB "will look again Nov 30" on Black Friday — **verified live 01:20Z**; his "Checked Nov 27" **declined** (no check was made; O-99 rule); his Disagree **accepted** → Deal's Sun patch rewrites the line as a read cadence ("Mondays and Thursdays · last read <date>"), figures untouched. (2) drop the Oct card-ask columns on Donruss FB / Flagship Bkb → **parked** to Dec 1 with O-65 (page owner changes at the Nov 30 merge, O-13). (3) Holiday two numbers → noted (labelled). Answer appended to `grok-requests/ivan.md`; routes `handoffs/desk-2026-11-28-routes.md` for the intake.
  - **BLOCKED "Grok re-briefs" → desk half applied:** `claude/grok/briefs-2026-11-25.md` written (Editor paste first, SEO & AEO second); `grok-requests/editor.md` (Mon Nov 30 file due, §6–§8 spelled out) and `seo-aeo.md` (page-ideas section) refreshed on the Mac 01:30Z. Mo's paste only if the Editor misses Mon Nov 30.
  **Commits:** one docs-only commit (STATE, NEEDS-MO, archive pass of 2026-11-28: the Nov 26 desk entry verbatim to `STATE-ARCHIVE-2026-11.md`), does not deploy (ignore list). Push result: see NEEDS-MO housekeeping and the routes note.
  **Deliveries:** none (R10 Am. 6; no vendor brief exists).
  **Instruments:** feed day **Nov 27** · 41 cards · 35 numeric · 40 images · GA4 18:32Z Nov 27 (6.7 h) · KE yesterday **4 / 41** · organic KE7 **16.67%** beside blended **4.78%** · returningShare7 **1.37% (4)** · clicks7 **25** · buystrip 2 · bots **49.66%** (SG 147 @ 0.5 s) → clean 149 / 25 KE (16.78/100) · cardViews7Clean 14 (bot 73) · cardPageClicks7 0 · newsletterSignup7 0 · QA 5/5 200, sw 390 = iw, 0 console errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **NEEDS-MO verified:** Vercel O-119/A-11 open (no answer on the room at the 23:35Z intake) · impact.com payment (O-01) likely done (Impact "reviewing your banking details", attended Nov 27) — stays until Mo taps Done · YouTube A-04 open · task repo access open (this desk's push result).
  **Stumbles:** Mac `$HOME` full again (key not copied); prompt's raw.githubusercontent URLs 404 on the private repo (read via git instead).
- **Nov 27 ~01:12–02:00 UTC (Nov 26 ~17:12 PT) (CoS · desk, Mac-linked, unattended; Thu slot on time, Thanksgiving).** Freshness: HEAD `1105dbe1` · origin/main `1105dbe1` at clone · delta 0 · gates **0/60 · 0/3 · 0/1** vs base 60/3/1 (`tools/gate.sh --base origin/main`: GATE PASS) — run in the **cloud clone** (R48). Read LANE-RULES (precedence, R48, R49 a–h incl. today's (g)(h)), STATE top + last entries, NEEDS-MO, CoS LEDGER (last intake Nov 26 23:22Z), ideas LEDGER not needed (no file). **Prompt drift (file wins):** R48 — cloud clone, deploy key not used (Mac `/sessions` 100% full again: `mkdir $HOME/deskkeys` → "No space left on device"; nothing needed it) · STEP 3 vendor delivery dead (R10 Am. 6) · STEP 2 "queued to the Wednesday weekly/Sep 28 build" superseded by R49 (one QUEUE; only attended/review/intake rank it) · prompt names neither the CoS LEDGER nor QUEUE (O-20).
  **Inbox since the Nov 26 01:11Z desk — Project:** daily-review 11-25 (00:42Z, ruled last desk), handoffs/desk-2026-11-26-routes (own), queue/QUEUE + LOG + CHARTER + build-loop handoff 11-25, kb AUDIT-LOGs (Pokémon 11j, Bowman 11i), integrity-watch 11-26 + proposals, traffic 11-26, heartbeat 11-26, pullcheck 11-26, x-daily + x/followers 11-26, cos-2026-11-26-queue-rulings (attended), measure 11-26, bet-20261126-1, ops/vercel-limits-2026-11-26 → **all ruled by the intake (LEDGER 09:22, 12:22, 15:22) → relayed, not re-ruled (O-20).** **New after the 23:22Z intake:** `daily-review-2026-11-26` (00:41Z) → relayed; no re-ruling found that conflicts with the ledger (its Grok-brief-file "desk miss #2 → desk Fri" is carried to the Fri desk). Repo since 01:11Z: Build Loop Q-004…Q-054 (incl. Q-051 AI strip, Q-052 cardViews7Clean, Q-053 deals.yml off, Q-054 feed regen), Ship Desk + Commissioner + price-engine + feed commits, attended `107aefa` (Follow box on) and `d3ef9fd`/`d027bd4` (R49 g/h) → noted, all owned and logged elsewhere. **Mac 5:** `grok-requests/ivan.md` (own, Nov 26 01:16Z) · stalk, attention, pullcheck 11-26 → noted (Grok copy lane; pullcheck already ruled from its Project copy) · **ivan-review 11-26 (17:24Z) → ruled below.** `awaiting-cos`: **0**. IW lookback (11-19, 11-23, 11-26): nothing unledgered. Ideas: none (no Thu file; desk off since Oct 19). Retention: no file (Sundays); LEDGER 0 `proposed`. Skipped: none.
  - **Ivan Nov 26 (served HTML + desktop render; 390 render failed a 3rd time):** (1) `/best-hobby-boxes-2026` still reads "checked on Nov 24 … will look again Nov 26" → **confirmed in the served page 01:30Z Nov 27** → **O-122 (1) → Deal**, tonight's Thu patch: the real Nov 26 check, next-look date = a day the patch is live (Mon Nov 30), never earlier than the ship day; copy only, no block moves (O-65). His Disagree (no look-again date the ship can't meet) **accepted** as that rule. (2) three no-price rows (Bowman May Jumbo, Series 1 Hobby, Series 2 Jumbo) carry "Buy on eBay" → **confirmed** (3 rows) → **O-122 (2) → Deal**: label "Search eBay", link and customid untouched. (3) top buy box "live eBay listing" with no figure + disclosure wording, 9-column table at 390 → not scored (not rendered); parked with O-65 (Dec 1). (4) campid check: row links 0, all campid strings in buttons/script → OK. Written straight into `goal-league/deal/pending.md` (Deal files tonight before the 22:22 intake; whole file rewritten from the 17:35 PT read, nothing else changed) and `grok-requests/ivan.md` (Fri walk list); route note `handoffs/desk-2026-11-27-routes.md` for the intake to ledger O-122.
  - **O-119 (Vercel request limit) → needs-Mo** (money/plan: Pro $20/mo or not; A-11 on the control room; the Chief recommends Pro before Sat Nov 28). On NEEDS-MO and pushed to Mo tonight.
  **Commits:** one docs-only commit (STATE, NEEDS-MO, archive pass of 2026-11-27: the Nov 25 weekly entry verbatim to `STATE-ARCHIVE-2026-11.md`, STATE 25.6 → ~22.3 KB), does not deploy (ignore list). **Cloud push refused** (`jmmorelli/shopcardhub is not in this session's authorized repository set`) → **mailbox (R48 c)** `night-crew/pending.md` + `pending-desk.patch.txt` (sha256 in pending.md; `git am -3` on `1105dbe1`), Ship Desk Fri Nov 27 06:41. Refused push → O-25.
  **Deliveries:** none (R10 Am. 6; no vendor brief exists).
  **Instruments:** feed day **Nov 26** · 41 cards · 35 numeric · 40 images · GA4 18:42Z Nov 26 (6.8 h) · KE yesterday **4 / 56** · organic KE7 **16.67%** beside blended **5.21%** · returningShare7 **1.39% (4)** · clicks7 **26** · buystrip 2 · bots **49.66%** (SG 145 @ 0.5 s) → clean 147 / 26 KE (17.69/100) · cardPageViews7 31 · cardPageClicks7 0 · newsletterSignup7 0 · QA 5/5 200, sw 390 = iw, 0 console errors, photos 0/0 · 0/0 · 20/20 · 4/4 · 5/5.
  **NEEDS-MO verified:** Vercel O-119/A-11 **new** · impact.com payment (O-01) open (Mo's account, not checkable) · YouTube A-04 open · A-08 **closed** (Mo's yes Nov 26; `signup.js` FOLLOW = true, intake check) · task repo access open (this desk's push result above).
  **Stumbles:** Mac `$HOME` full again (key not copied; nothing needed it).
- *(Older entries — the Nov 26 desk (desk pass of 2026-11-28), the Nov 25 weekly (desk pass of 2026-11-27), the Nov 25 desk + the Nov 9 MILESTONES line (desk pass of 2026-11-26), the Nov 24 desk (weekly pass of 2026-11-25), the Nov 21 desk (pass of 2026-11-25), the Nov 20 desk (pass of 2026-11-24), the Nov 19 desk, Nov 18 weekly + desk, Nov 17 desk, and the pointer paragraph naming which entry sits in which archive pass — are verbatim in `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-21 and earlier passes. Still open from them: Van Gogh Pikachu noindex → Nov 12 check · Tape unsent → attended.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
