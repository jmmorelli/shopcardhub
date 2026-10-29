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

## NOW — 2026-10-29 (Mo attended; desk applied the same evening): **R44 goals/tiers/brakes + R45 bias-to-action are in LANE-RULES (`d9a8268`)** — every item names G1 returning / G2 clicks→EPN / G3 indexed or CHORE; P0 now · P1 top-10 first screen this week · P2 weekly batch (cap 5); two fix rounds then BLOCKED. **Launch first, measure after; PIVOT freeze lifted; no 301/delete/noindex/sitemap removal until the Nov 12 check (BET-20261029-1, Commissioner restores culled pages with history by Oct 31).** CEO Desk back daily 13:47 (bets in `claude/cos/ceo-desk/BETS.md`); Press desk off; agent-readable site = BET-20261029-2 (feed by Nov 15, thin MCP tool within 7 days of it; no eBay URLs in anything for machines). PIVOT block (Oct 19) moved to the archive, pass of 2026-10-29.

## NOW — 2026-10-28 (CoS weekly, unattended, Mac key): **pushed `1a4c2f2`** — the Night Crew Oct 28 patch the 07:52 deploy never shipped (og/pokemon.png without figures on ~608 pages, home search ranks static card pages first and Enter stays on site, `/card?id=` → static page, chart legend follows range, PRIS25 1440 CLS 0.30 → 0.016, checklist method text, sitemap gate hysteresis) + `build-x-board.mjs` `<br>` word break ("Fischer1st" fixed on 5 seats) + `ga4-snapshot.mjs` day label from the last daily28 row. Gates 0/49 · 0/19 · 0/1 (cloud `--run-tests` 153 scenarios FAIL 0 on the identical tree `08efa875`). Rollback: `git revert 1a4c2f2`. Live curl verified; IndexNow 99 → 200. Bowman monthly check: not due (first Wednesday = Nov 4).

## NOW — 2026-10-28 (Goal League Commissioner, unattended; was the Traffic Agent): **Goal League registry + scorer live** (`data/goal-league.json`, `tools/goal-league/score.mjs`): 37 pre-season claims granted (Deal 5 · Drop 9 · AI-Search 11 + /llms.txt · Conversion 10 · Wildcard 2), baselines from GA4 day Oct 26; rulings in each `claude/goal-league/<agent>/pending.md`. **R27 Am. 3** (Growth League superseded for league matters). Sitemap lastmod 19 refreshed. First scored read Mon Nov 9. Record `claude/traffic/2026-10-28.md`, standings `claude/goal-league/STANDINGS.md`.

## NOW — 2026-10-27 (CoS attended with Mo, day; the desk wrote this line from the Project docs): **Index pages read in dollars `ccda96b`** ("$634 now · $997 at release"; Mo: the site never says box vs singles is the better buy) · **`/pokemon-grading-premiums` live `d46e145`** · **Goal League approved — Season 1 Nov 2** (`claude/goal-league/RULES.md`; Deal / Drop / AI-Search / Conversion / Wildcard hunters Sun/Tue/Thu; Traffic Agent re-scoped to Commissioner; R27 retires on its first runs) · **Data Desk** (Sun, `claude/cos/data-desk/`) feeds Mon/Fri X data posts from Nov 2; Wed = Collector's Desk link post (`claude/cos/x-addendum-2026-10-27.md`) · Grok bots → scouts for the hunters (`claude/grok/scouts-plan-2026-10-27.md`). Open from it: og-image per page (BLOCKED, NC Wed first item).

## NOW — 2026-10-21 (Mo, ~15:35 PT): **Paid test 1 LIVE — Reddit Ads, $50 lifetime cap, Oct 21 15:30 → Oct 31 16:00 PT** (Mo waived the no-spend-below-M0 rule for this test, in chat). Traffic objective, US, 5 Pokémon communities, one ad (the live DR25 chart, our own render) → `/destined-rivals-index?utm_source=reddit&utm_medium=paid&utm_campaign=test1`. Comments could not be switched off in Reddit's Max flow. **Read Nov 1** (GA4 by utm_source): keep/raise only if ≥ 1 signup or eBay clicks/session ≥ the organic rate; else stop. Any spend beyond $50 is a new yes from Mo. Earned-links work (Source of Sources signed up; TCG Drop Radar emailed) and the Bing test plan: Project `claude/growth/earned-links-and-paid-test-2026-10-21.md`.

## NOW — 2026-10-21 (GSC, Mo by hand): indexing requested on `/bowman-chrome-baseball-2026`, `/bowman-football`, `/best-hobby-boxes-2026`, `/indices`, `/scarlet-violet-151-index` — **not re-requested before Nov 4** (R40). Full block: `STATE-ARCHIVE-2026-10.md` (desk pass Oct 28).

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-10-28 (GSC live, Browser 1 u/0 property https://www.shopcardhub.com/; GA4 + Bing from the price-data nightly snapshot, data day Oct 27, 15:34Z; MailerLite SIGNED OUT in Browser 1; EPN newest CSV still ends Oct 12)

1. **Search is still shrinking and Google indexes almost nothing.** GSC page indexing: **1 indexed / 91 not** (33 crawled-not-indexed, validation Failed · 57 discovered · 1 redirect) — was 3 / 144 on Oct 21. Google **8 clicks / 51 impressions in 28 d**. GA4 organic sessions 7 d **37** (43 → 37; organic KE rate **10.8%**: DuckDuckGo 11/5 KE, Yahoo 11/3, Bing 11/0, Google 2/0). Bing API 4 weekly buckets Oct 2–23: **131 clicks / 1,043 impressions** (striking distance = the `2026 bowman football` family, pos 4–7). *Doing:* no new indexing requests (R40; the Oct 21 five stay unrequested until Nov 4); the Goal League (Season 1 Nov 2) is the traffic bet now; Release Watch found three release pages still reading pre-release (Heritage FB, F1, Donruss FB due today) → League A.
2. **Money is ~$0.** GA4 outbound `click` **16 / 7 d** (20 last week); card pages 2 clicks. EPN: no CSV since Oct 12 → run-rate still ~$2/mo vs M0 $300. **Reddit paid test: 125 sessions, 9 engaged, 2 key events (1.6%) vs organic 10.8%, 5.4 s average** — it is failing its own keep bar ahead of the Nov 1 read. *Doing:* shipped today the Night Crew Oct 28 patch (search no longer throws a typo to eBay, priced card pages rank first, the stale "$94 Darkrai" link image is gone from ~608 Pokémon pages).
3. **Nobody signs up; returners flat.** `newsletter_signup` **0** for the 5th week (183 `signup_view`, mostly bots). Returning users **10 / 7 d, 35 / 28 d** (38 last week); clean returning share 4.95% (diluted by paid). Return-user scorecard **4/14**, unchanged five weeks. The DR25 page (paid landing, 129 users) logged **0** `signup_view` because its `#tapecap` form has no view event — the paid test's list outcome cannot be read. *Doing:* approved that instrumentation for the Night Crew (Fri).

**§0.3 flag (data vs strategy):** the Nov 19 kill/keep bar for the PIVOT is "indexed > 3, organic 7 d > 48, returning > 6, clicks/100 clean ≥ 15.7". Today: indexed **1** (fell), organic **37** (fell), returning 10 (pass), clicks/100 clean 16/216 = **7.4** (fail). One of four — the PIVOT is on track to fail its own test. And the Reddit ad is not converting. Key-event rate: **organic 10.8% 7 d** beside blended **2.2%** (bot-diluted; SG 287 sessions = 57% of 7 d).


## MILESTONES (R22 — one line per Wednesday read; the desk appends)

- **2026-10-28 (weekly, no new CSV):** `Card Hub/epn/` newest pair still ends Oct 12 (16 days). GA4 outbound `click` 16 / 7 d (Oct 21–27). Run-rate ≈ $2/mo, **below M0**.

- **2026-10-21 (weekly, no new CSV):** `Card Hub/epn/` newest pair still ends Oct 12; newest read is the Controller's Oct 5–18 (79 clicks · 1 action · $30.00 sales · **$0.90**). GA4 outbound `click` 20 / 7 d (Oct 14–20). Run-rate ≈ $2/mo, **below M0**. The 15:11 desk does the R22 read if Mo drops the Oct 13–19 CSVs.

- *(Older reads, Sep 18–Oct 13: `STATE-ARCHIVE-2026-10.md`, archive passes of 2026-10-16 and 2026-10-23.)*

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
- **Push/deploy:** fresh clone over SSH with the `auto` deploy key (on the Mac: copy key + known_hosts to
  `/tmp` — the space in "Card Hub" breaks `UserKnownHostsFile`), edit, three gates, commit with
  `Task-key:`/`Authority:` trailers, `fetch` + `merge-base --is-ancestor`, push, `ls-remote`, curl live,
  IndexNow. **Never work in Mo's clone** (`~/Projects/shopcardhub`, stale since Sep 14, inert — leave it).
  The cloud sandbox cannot push; move patches via `device_commit_files` into `Card Hub/deploy/`.
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
- **Freeze through Oct 26:** no new sports verticals, no guides for sets not on the tape, no new nav items.
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
- **Oct 29 ~16:47–17:35 PT (CoS · desk, Mac-linked scheduled fire, unattended — held `device_absent` at 15:11, fired late; runs the Thu list).** Freshness: HEAD `b5727a4` at clone → `eca65fd` after push · origin/main `eca65fd` (fresh deploy-key clone `$HOME/desk`) · gates **0/49 · 0/19 · 0/1** on `b5727a4` (IW's 49 = panini-obsidian stamp aging) → **0/47 · 0/19 · 0/1** (−2 named: the two pokemon-30th engine stamps refreshed from Oct 1). Read LANE-RULES (precedence, R1, R5, R10 Am. 6, R43, cadence), STATE, NEEDS-MO, BLOCKED, the three Oct 29 RULINGs, ideas LEDGER (untouched). **Prompt drift (file wins):** STEP 3 vendor delivery dead (R10 Am. 6); feed from `/feed/`, GA4 from a `price-data` clone; Retention is Sundays-only (no file due); **new: the desk task has no Gmail connector**, so the daily inbox sweep the r44 handoff adds cannot run from this task.
  **Inbox since the Oct 28 15:12 fire — 17 Project docs + 9 Mac files + 0 `awaiting-cos`.** Project: 3 RULINGs (goals-and-brakes, agent-readable, bias-to-action) · handoffs `desk-2026-10-29-r44`, `inbox-intake-2026-10-29`, `bet-20261029-1-stop-culling` · ceo-desk CHARTER + BETS · IW Oct 29 + proposals · daily reviews Oct 28/29 · measure, traffic, heartbeat, x-daily Oct 29 · BOW21-universe (KB). Mac: `grok-inbox/ivan-review-2026-10-29.md`, `grok-inbox/stalk-2026-10-29.md` (the 00:40 copy lane carries both; read here), `grok-requests/*` ×6 (Commissioner's outbound asks — not mine), `desk-mirror/*` (my own Oct 28 mirror).
  **Rulings.** r44 handoff: (1) **R44 committed verbatim + R45 pointer** (bias-to-action, no cutting to Nov 12, no eBay URLs in machine output) → **applied `d9a8268`** · (2) inbox sweep → **not done: no Gmail tool in this task** → BLOCKED needs-attended (add the Gmail connector to `trig_018BNFLuPJZENTotAg78Z6bq`) · (3) calendar → **applied `8d36f41`**: 2026 Bowman Sapphire Football confirmed Oct 29, Topps EQL raffle (Topps email); 5 Panini rows removed from `releases.json` (pages stay, R45) — also clears Ivan Oct 29 #4 · (4) NC P1 "Show the math" on `/` → **queued: BACKLOG row R44-1, Fri Oct 30 first** · (5) Site Sweep → **R44 tiers bind via LANE-RULES; 3-page repetition check queued** in `claude/handoffs/desk-2026-10-29-routes.md` · (6) COO → **INBOX row written** (R44/R45 compliance table from the Nov 1 audit). Carry rows: **TH26 #157/#158 not SIRs → applied `8d36f41`** (watchlist labels + per-card `lane` in build-engine-blocks) · **search label "Nov 5 (reported)" → "(Topps)" applied `8d36f41`** (nav.json + manifest, build-nav 763 pages) · **Gengar desk cuts → applied `8d36f41`** (§4 a–c as written; print-run / "no clean raw" / hard-coded "heaviest in AH" lines cut; P31 Umbreon ★ #17; ND1E #107 raw "No mark" via RAW_HOLD until KB P40; six desks re-baked) · **16 `approved` pipeline rows → closed with reasons** (this docs commit) · **NC deploy cause → not found** (two task-list pages read, deploy trigger not reached; R44c stop) → stays on the Fri desk row. IW Oct 29 (ruled by the review): **F3 applied `eca65fd`** (label from `cardType` only; Roman Anthony row no longer printed) — BACKLOG IW-1029-F3 is done, the crew closes it on R5 · F1/F2/F4 ledgered as the review ruled. Ivan Oct 29: #4 fixed above; #1 /deals duplicates + stale stamp, #2 PRIS25 BID chips, #3 BHB 12-vs-9, #5 Yamal thin/highest → already on BLOCKED rows (Deal Hunter, NC BID chips, Conversion Hunter) — no new rows (R6). Stalk Oct 29: data for the hunters; nothing for the desk.
  **Commits:** `d9a8268` LANE-RULES (docs, no deploy) · `8d36f41` (deploys; live ~23:56Z: calendar Sapphire confirmed, 0 Panini calendar rows, 0 "SIR #157/#158", 0 "print run" on desks, search "(Topps)"; IndexNow 9 → 200) · `eca65fd` (deploys) · this docs commit (STATE, NEEDS-MO, pipeline: 16 closed, iw-2026-10-29-1…4 ledgered, pushLog). Competitor scan of `pipeline.json` additions: 0 new names.
  **Deliveries:** none (R10 Am. 6; no vendor brief).
  **Instruments:** feed `/feed/` day **Oct 29**, 41 cards, 37 numeric, 40 images · GA4 15:41Z Oct 29 (**8.1 h**), data day Oct 28: KE yesterday **7 on 77** · organic KE7 **4.0%** (was 10.8%) vs blended 2.05% · returningShare7 1.46% raw (7 users) · clicks7 **17** · bots 52.6% (SG 257) → clean 232, **7.33 KE/100** · Mobile QA iPhone 13 (beacons/eBay/comps aborted): 8/8 200, scrollWidth 390 everywhere, 0 non-aborted console errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5 (+30th 14/16 lazy, Charizard desk 20/20).
  **Ideas/retention:** none due (Thu) · retention LEDGER not re-read (no new file).
  **Stumbles:** first Mobile QA run reinstalled playwright and broke the browser path — removed, used the preinstalled one. The first `pipeline.json` pass looked for the IW file on the wrong machine — re-staged. STATE was at 24,980 B: the Oct 28 desk + weekly entries and the Oct 19 PIVOT block moved verbatim to the archive (pass of 2026-10-29).
- *(Pointers for R24 and the run history: **Oct 28 ~15:12–16:05 PT (CoS · desk, Mac-linked scheduled fire, unattended)** and the Oct 28 CoS weekly entry — verbatim in `STATE-ARCHIVE-2026-10.md`, pass of 2026-10-29. Oct 27 desk: pass of 2026-10-28.)*
- **Oct 28 Goal League Commissioner (first run; Mac key):** setup STEP 1 (registry + scorer + R27 Am. 3 + ORG §3/§8) · 37 claims granted, 0 refused · scout asks forwarded to `grok-requests/` · 0 patches pending · `/gengar-ex-worth` floor: not floored (10 clicks / 28 d; Goal League floor needs 0 clicks) · sitemap lastmod 19. Gates 0/49 · 0/19 · 0/1 (= origin/main). Record `claude/traffic/2026-10-28.md`.
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
