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

## NOW — 2026-10-19 (CoS, attended with Mo): **PIVOT — the card chart is the front door; the set index is a tab on it.** Ruling: Project `claude/cos/PIVOT-2026-10-19.md` (+ Am. 2 = `claude/cos/DESIGN-DIRECTIVE-2026-10-23.md`, the human lens). P0-A card page v2 · P0-B home (preview `/home-v2`) · P0-C index pages chart-first (live `0c14f12`) · P0-D cull + gated sitemap (live `b7cfeb1`). Kill/keep Nov 19: indexed > 3, organic 7 d > 48, returning > 6, clicks/100 clean ≥ 15.7 — two of four. Full block verbatim in `STATE-ARCHIVE-2026-10.md` (moved by the Oct 23 desk).

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
- **Oct 28 ~15:12–16:05 PT (CoS · desk, Mac-linked scheduled fire, unattended).** Freshness: HEAD `0162050` at clone → `516e4f2` after push · origin/main `516e4f2` (fresh deploy-key clone `$HOME/desk`) · gates **0/49 · 0/19 · 0/1** = the weekly's baseline → **0/48 · 0/19 · 0/1** after `516e4f2` (−1 named: release-calendar stale-stamp WARN cleared). Read LANE-RULES (precedence, R1, R5, R10 Am. 6, R22, R24, R27 Am. 3, R37–R43, drift list), STATE, NEEDS-MO, BLOCKED, ideas LEDGER. **Prompt drift (file wins):** STEP 3 vendor delivery is dead (R10 Am. 6); feed from `/feed/`, GA4 from a `price-data` clone, not raw.githubusercontent; Retention is Sundays-only, so no `retention/` file is due on a Wednesday.
  **`gate-watch` #5 (opened 20:41Z, run 40763648480): `desk-heartbeat` FAIL — "no Oct 27 … CoS · desk entry".** Cause: the weekly's archive pass moved yesterday's desk entry to `STATE-ARCHIVE-2026-10.md`, and R24's check reads STATE only. Fixed in this docs commit (pointer line below). **Ruling:** an archive pass never moves the newest `CoS · desk` run-log line. #5 stays open until the next 08:30 check passes (no issues token here to close it).
  **Inbox since the Oct 27 15:12 fire — 27 Project docs + 10 Mac files + 0 `awaiting-cos`.** (1) **Pokémon KB P56 🔴** (desk "Auction house" lines cite pages showing another sale) → **applied `516e4f2`**: dropped `bs1e-4` $1,380,000, `bssl-4` $210,000, `ng1e-9` $654,000 from `data/house-sales.json` (CoS owns the file); Charizard 1st Ed/Shadowless PSA 10 now read "No verified sale". The other 19 rows' `src` re-read → **Gengar Mon Nov 2** + Data Desk Nov 1 (a row whose page doesn't show its price and date comes off). (2) **Ivan reviews Oct 27 + Oct 28** (read and ruled by the desk, R39; R5 re-checked live at 390): release-calendar header "baked 2026-09-26" + wrong counts → **applied `516e4f2`** (rc-meta regex never matched after the first bake; header now 23 ahead · 18 in 30 days · baked Oct 28) · `/deals` "71 live vs 60 rows" → **declined**: paged by design ("Show 14 more · 14 left" button; header now 74) · PRIS25 BID chips (Sylveon BID $999 vs $346.81 mark, Leafeon $58 vs $261.14) → **queued Night Crew Fri Oct 30**: label the chip "live bid · ends <time>", and hold back any bid > 1.5× the mark as a probable mislabel (the R42 depth rule, display only) · stale "Buy"/"Strong buy" over Jul 28 / Aug 25 / Aug 31 asks on `/cooper-flagg-rookie-cards`, `/world-cup-2026-soccer-cards`, `/lamine-yamal-rookie-cards` + BHB merchant strip above the ranking → **queued to the Conversion Hunter (claims holder, R27 Am. 3), Thu Oct 29 run**, via `claude/handoffs/desk-2026-10-28-ivan.md`; integrity floor: a verdict label never sits on an ask older than 30 days — not fixed by Nov 2 → the desk pulls the labels itself; BHB "12 vs 9" + phone heights ride it. **Ivan test passed** (`ivan-review-2026-10-28.md` on disk 09:00) — scouts plan's re-brief worked. (3) **Weekly rulings handoff** → read; one desk ask: **why the 07:52 NC deploy shipped nothing.** Trigger `trig_01FobB3L…` fired 07:54 PT and reports SUCCEEDED, but wrote nothing: no push, no log line, `pending.*` left in place, no notification. Root cause not readable here; the one new variable: a 159 KB patch carrying a binary PNG, a NC first. **Ruled:** NC patches carry text only; a binary output ships as a regen command in `pending.md` (charter line, NC Fri). `pending.patch.txt` + `pending.md` (shipped as `1a4c2f2`) **deleted from the Project** by this run so Friday's deploy can't re-apply them. (4) **Grok scout briefs** (BLOCKED row: "desk writes `briefs-2026-10-28.md`") → **declined, already done**: Mo pasted Oct 27 ~12:00 PT and Ivan's re-brief ~21:15 (scouts plan) — review moves the row to Done; NEEDS-MO line closed. (5) **Heartbeat: "BOW22/BOW23 → `data/classes/`, today's desk copies them"** → **declined today**: both drafts are `universeComplete:false` (same reason as the Oct 27 desk; COPY-LOG rule = copy when complete). (6) **X daily Oct 28**: queue empty (no "go" on the Oct 26 batch), PSA Value reply menu pushed to Mo by that lane — read, nothing for the desk. (7) Read, no action: measure 10-28 (indexed 3 → 1, P0 1 of 4), Commissioner 10-28 + STANDINGS + 5 `pending.md`, contestant LOG/PLAYBOOK ×10, daily review 10-27, house-sales handoff, NC log 10-27 (shipped in `1a4c2f2`), `stalk-2026-10-28`, `grok-requests/*` ×6. IW last-three lookback (Oct 15/22/26): all ledgered, none new.
  **Commits:** `516e4f2` (deploys; live curl ~22:50Z: no $1.38M/$210K/$654K lines, header baked Oct 28; IndexNow 3 → 200) · this docs commit (STATE, NEEDS-MO, `pipeline.json` pushLog; does not deploy). Competitor scan of `pipeline.json` additions: 0 names.
  **Deliveries:** none (R10 Am. 6; no vendor brief).
  **EPN (R22, Wednesday):** newest CSV pair still ends Oct 12 → no read; the weekly's MILESTONES line stands; NEEDS-MO FYI carried.
  **Instruments:** prices `/feed/` day **Oct 28**, 41 cards, 37 numeric, 40 images · GA4 15:34Z Oct 28 (**7.3 h**): KE yesterday **0 on 68** → **FAIL by the ≥ 30-session rule on raw**; SG ≈ 41 of the 68 → clean ≈ 27, under 30, so not a clean FAIL (2nd zero day in 4: Oct 24 0/91) · organic KE7 **10.81%** vs blended 2.20% · returningShare7 2.03% raw (10 users; 4.95% clean) · clicks7 **16** · bots 57.1% (SG 287) → clean 216, 7.41 KE/100 · Mobile QA iPhone 13 (beacons + comps aborted): 5/5 200, scrollWidth 390, 0 console/page errors, photos 0/0 · 0/0 · 20/20 · 4/4 · 5/5.
  **Ideas/retention:** no files due (Wed) · retention LEDGER 0 unruled · ideas LEDGER untouched.
  **Stumbles:** first `house-sales.json` edit went through `json.dumps` and re-flowed the file (176-line diff) — reverted, redone as 3 line deletions.
- *(Pointer for R24's heartbeat check: **Oct 27 ~15:12–15:55 PT (CoS · desk, Mac-linked scheduled fire, unattended)** — verbatim in `STATE-ARCHIVE-2026-10.md`, pass of 2026-10-28.)*
- **Oct 28 ~11:05–12:20 PT CoS weekly (Mac key, unattended).** STEP 0 LANE-RULES from fresh clone `0bfe2c5`. **Prompt drift (file wins):** the task names Mobile QA / Perf & SEO / Vault & Funnel / Terminal Product and `rooms/terminal.md` (Oct 1 roster: UX Auditor absorbs the first two, Retention Analyst the next two, terminal merged into site-quality); it says GA4 = Browser 2 and GSC = Browser 1 (display names swap; the R10 browser amendment is by deviceId — GSC opened in deviceId 477c… "Browser 1" u/0; the GA4 property was not found in either browser, so GA4 came from the nightly snapshot); it omits the Gengar duty (buy-strip-health) and the §4 audit's offline-harness fallback (cadence-table drift line). §0 read above. **Chrome:** GSC live; MailerLite signed out (Browser 1) → subscribers from GA4 + the Oct 27 Tape send (3); GA4 realtime proof impossible → §4 ran on the local harness (LANE-RULES cadence drift line), production by curl only. **NEEDS-MO checked:** EPN CSVs (none since Oct 12), TAG (Nov 1), BCB26 video, Grok paste, X "go" — all still open, none new. **Agents:** UX Auditor (14 pages × 2 + 99-URL phone sweep, local render; 0 errors/overflow, photos 991/992, card JSON-LD 0/22), Retention + Photo Keeper + Release Watch (one agent). **Adjudicated:** NC Oct 28 proposals — (1) Iron Hands #154 under the $25 gate but in the sitemap → stays listed until the Commissioner's Mon Nov 2 read (build hysteresis holds it index,follow); (2) B115 Holliday engine page: "Engine mark" → "Asking price" + eBay button under the price → **approved** for NC Fri (a label made more accurate, not a new number); (3) B111 card JSON-LD → **approved as BreadcrumbList + WebPage only, no Product/Offer/price** (NC Fri, UX Auditor SEO 7); B113 JSON weight → price lane; (4) home first-screen rework → **declined** (home rebuilt Oct 23, net-calm); (5) `/search?q=` page → **declined** (R25 new surface). Retention: `signup_view` on `#tapecap` (six chase indices) → **approved**, NC Fri. UX: nav search miss → eBay → **approved**, same B106 rule as the home box (NC Fri). UX typography (<11 px on home/chase index) → NC BACKLOG via generators. Release Watch: Heritage FB / F1 / Donruss FB release-day flips → League A (Donruss due today); missing calendar rows Heritage Mega Nov 4, Flagship Bkb Mega Nov 12, Finest F1 Nov 19 → League A; break-odds rows for 9 products → Release Watch next week (topps.com odds page unreachable today). Photo Keeper: resolvers ok 369 / miss 8 (scratch only; map refresh not committed), feed 40/41 with image, 30/30 CDN live. pipeline.json: 0 `awaiting-cos`. **Commit `1a4c2f2`** (+ this docs commit). Scorecard row → `claude/archive/project-2026-10/claude/reaudit-log.md` (the Project copy was offloaded under R37).
- **Oct 28 Goal League Commissioner (first run; Mac key):** setup STEP 1 (registry + scorer + R27 Am. 3 + ORG §3/§8) · 37 claims granted, 0 refused · scout asks forwarded to `grok-requests/` · 0 patches pending · `/gengar-ex-worth` floor: not floored (10 clicks / 28 d; Goal League floor needs 0 clicks) · sitemap lastmod 19. Gates 0/49 · 0/19 · 0/1 (= origin/main). Record `claude/traffic/2026-10-28.md`.
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
