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

## NOW — 2026-10-28 (Goal League Commissioner, unattended; was the Traffic Agent): **Goal League registry + scorer live** (`data/goal-league.json`, `tools/goal-league/score.mjs`): 37 pre-season claims granted (Deal 5 · Drop 9 · AI-Search 11 + /llms.txt · Conversion 10 · Wildcard 2), baselines from GA4 day Oct 26; rulings in each `claude/goal-league/<agent>/pending.md`. **R27 Am. 3** (Growth League superseded for league matters). Sitemap lastmod 19 refreshed. First scored read Mon Nov 9. Record `claude/traffic/2026-10-28.md`, standings `claude/goal-league/STANDINGS.md`.

## NOW — 2026-10-27 (CoS attended with Mo, day; the desk wrote this line from the Project docs): **Index pages read in dollars `ccda96b`** ("$634 now · $997 at release"; Mo: the site never says box vs singles is the better buy) · **`/pokemon-grading-premiums` live `d46e145`** · **Goal League approved — Season 1 Nov 2** (`claude/goal-league/RULES.md`; Deal / Drop / AI-Search / Conversion / Wildcard hunters Sun/Tue/Thu; Traffic Agent re-scoped to Commissioner; R27 retires on its first runs) · **Data Desk** (Sun, `claude/cos/data-desk/`) feeds Mon/Fri X data posts from Nov 2; Wed = Collector's Desk link post (`claude/cos/x-addendum-2026-10-27.md`) · Grok bots → scouts for the hunters (`claude/grok/scouts-plan-2026-10-27.md`). Open from it: og-image per page (BLOCKED, NC Wed first item).

## NOW — 2026-10-27 (Traffic Agent, unattended): **Sitemap `<lastmod>` refreshed on 40 of 98 URLs** (no URL added; IndexNow) + **calendar row: 2026 Bowman Sapphire Football, estimated Oct 29** (Bowman KB run 12). League floor: `/prismatic-evolutions-vs-destined-rivals` **DEAD** (1 session / 30 d) → 301 **prepared, not applied**: `claude/handoffs/cull-batch-floor-2026-10-27-note.md`. Record `claude/traffic/2026-10-27.md`.

## NOW — 2026-10-21 (Mo, ~15:35 PT): **Paid test 1 LIVE — Reddit Ads, $50 lifetime cap, Oct 21 15:30 → Oct 31 16:00 PT** (Mo waived the no-spend-below-M0 rule for this test, in chat). Traffic objective, US, 5 Pokémon communities, one ad (the live DR25 chart, our own render) → `/destined-rivals-index?utm_source=reddit&utm_medium=paid&utm_campaign=test1`. Comments could not be switched off in Reddit's Max flow. **Read Nov 1** (GA4 by utm_source): keep/raise only if ≥ 1 signup or eBay clicks/session ≥ the organic rate; else stop. Any spend beyond $50 is a new yes from Mo. Earned-links work (Source of Sources signed up; TCG Drop Radar emailed) and the Bing test plan: Project `claude/growth/earned-links-and-paid-test-2026-10-21.md`.

## NOW — 2026-10-21 (Mo, ~13:30 PT, GSC by hand after the CoS resubmitted the sitemap): **GSC indexing requested on 5 pages** — `/bowman-chrome-baseball-2026`, `/bowman-football`, `/best-hobby-boxes-2026`, `/indices`, `/scarlet-violet-151-index` (all "Indexing requested · priority crawl queue"). Sitemap resubmitted Oct 21 (was "Temporary processing error" on the page detail). **Do not re-request these before Nov 4** (R40). Read URL inspection on all 5 at the Oct 28 weekly; the indexed count goes in the top block. (The CoS session's own request click was refused by the permission layer after the first.)

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-10-21 (GSC live u/1; GA4 live Browser 1 authuser=1, Oct 14–20; Bing Webmaster live; MailerLite live; EPN newest = Controller's Oct 5–18 read)

1. **Search traffic is collapsing, and Google still does not index us.** Organic landing sessions by week **99 → 96 → 78 → 43** (Sep 22 → Oct 19; GA4 Organic Search 43 sessions Oct 14–20, −45% w/w). Bing Webmaster 30 d **207 clicks / 7.4K impressions** (the Oct 9 4-week read was 293 / 9,109); 3-month line falls from ~40 clicks/day in August to ~5. **Google: 3 indexed / 144 not** (30 crawled-not-indexed, validation Failed; 114 discovered), **9 clicks / 64 impressions in 28 d.** *Doing:* P0-D cull batch 2 is the operative bet and has sat unpushed two days because each pre-built sitemap hunk went stale overnight — rev 3 fixes that mechanically and waits only on the attended push (NEEDS-MO). GSC indexing requests not spent (R40 ties them to the gated sitemap being live).
2. **Money is ~$0 and falling with the traffic.** GA4 outbound eBay `click` **20 / 7 d** (14 users); `clicks7` series low of 17 on Oct 19. EPN newest read (Oct 5–18): **79 clicks · 1 action · $0.90** → run-rate ~**$2/mo vs M0 $300**. Clicks per 100 clean sessions ~17 is healthy; volume is ~100x short (R33). *Doing:* buy strips 3 dead → 0 this run; no new link types (R33); the card page v2 (P0-A, live this morning) is the conversion bet — instrumented this run so Nov 19 can grade it.
3. **Nobody signs up and almost nobody returns.** MailerLite **3 actives, all Mo's**; `newsletter_signup` **0** on 197 `signup_view` (most of those are bots). Clean week ~118 sessions / 99 users, **8 returning (8.1%)**; returning users 28 d **38**, flat at the series low. Return-user scorecard **4/14**, unchanged four weeks. *Doing:* Retention Analyst filed P68 (card-event demand by country); rows 5–14 cannot move under PIVOT before the Nov 2 re-audit — expect the outside grade to read about the same.

**§0.3 flag (data vs strategy):** R33's lever #1 (Growth League search pages) has been followed for four weeks while organic fell 56% and Google indexes none of them; the operative bet is now P0-D + P0-A, and P0-D is stuck on the push sitting, not on work. **Bots:** the 7-day GA4 view is still 97.6% Direct bot traffic (3,498 of 3,583), but that is history — Singapore sessions by day were 1,809 (Oct 18) → 1,246 (Oct 19) → **15 (Oct 20)**, the first full day after the `91cf05b` webdriver guard. The guard filtered it; the BLOCKED `/card` row closes on that branch and no Vercel challenge rule is needed. Blended rates stay unreadable until the 7-day window rolls past Oct 19 (Oct 27).

Key-event rate: **organic 9.3% 7 d** (7 KE / 43 sessions) · AI Assistant 26% (6 / 23) beside blended **0.39%** (20 / 3,583, bot-diluted).

## NOW — 2026-10-19 (CoS, attended with Mo): **PIVOT — the card chart is the front door; the set index is a tab on it.** Ruling: Project `claude/cos/PIVOT-2026-10-19.md` (+ Am. 2 = `claude/cos/DESIGN-DIRECTIVE-2026-10-23.md`, the human lens). P0-A card page v2 · P0-B home (preview `/home-v2`) · P0-C index pages chart-first (live `0c14f12`) · P0-D cull + gated sitemap (live `b7cfeb1`). Kill/keep Nov 19: indexed > 3, organic 7 d > 48, returning > 6, clicks/100 clean ≥ 15.7 — two of four. Full block verbatim in `STATE-ARCHIVE-2026-10.md` (moved by the Oct 23 desk).

## MILESTONES (R22 — one line per Wednesday read; the desk appends)

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
- **Oct 28 Goal League Commissioner (first run; Mac key):** setup STEP 1 (registry + scorer + R27 Am. 3 + ORG §3/§8) · 37 claims granted, 0 refused · scout asks forwarded to `grok-requests/` · 0 patches pending · `/gengar-ex-worth` floor: not floored (10 clicks / 28 d; Goal League floor needs 0 clicks) · sitemap lastmod 19. Gates 0/49 · 0/19 · 0/1 (= origin/main). Record `claude/traffic/2026-10-28.md`.
- **Oct 27 ~15:12–15:55 PT (CoS · desk, Mac-linked scheduled fire, unattended).** Freshness: HEAD `d46e145` at clone → `dcaca47` after push · origin/main `dcaca47` (fresh deploy-key clone `$HOME/desk`) · gates **0/48 · 0/19 · 0/1** = the Oct 27 baseline (Traffic/Sweep/Tuesday), no delta all run. Read LANE-RULES (precedence, R1, R10 + Am. 6 + Oct 26 browser amendment, R37–R43), STATE top + run log, NEEDS-MO, ideas LEDGER, BLOCKED. **Prompt drift (file wins):** STEP 3 vendor delivery is dead (R10 Am. 6); R39 Grok copy is the 00:40 lane's (ORG §2.13), the desk only carried the Editor re-run (BLOCKED row); Retention is Sundays-only and the Ideas desk is off since the PIVOT, so no `retention/` or `ideas/` file is due on a Tuesday.
  **Inbox since the Oct 26 15:14 fire — 27 Project docs + 13 Mac files + 3 `awaiting-cos` in pipeline.json.** (1) **Traffic floor 301** `/prismatic-evolutions-vs-destined-rivals` → **applied `3e4da7f`** (patch `git am --3way` clean on `d46e145`; desk re-ran `build-nav.js` because `/pokemon-grading-premiums`, added after the patch base, carried the old slug); live 308 → `/prismatic-evolutions-index` 200; IndexNow 3 → 200. Next floor reads: `/gengar-ex-worth` Oct 28 (check the Gengar charter first), `/ascended-heroes-vs-destined-rivals` Oct 30. (2) **Tuesday board `tuesday-2026-10-27-1` calls.json reads** → **applied `dcaca47`** (Gonzales PASS 67.50 on 8, Fischer BUY-2 141.50 on 18, verified against `sold-marks.json` day Oct 27; entries/dates/actions untouched); live `/data/calls.json` shows both. (3) **`-2` prompt drift + `x-board.json` "Fischer1st" missing space** → drift noted (attended prompt edit); generator fix **queued Oct 28 weekly** (`tools/build-x-board.mjs`). (4) **`-3` Jump RHP/LHP + Aloy "#31 Pick" unsourced** → **queued to the Bowman KB** (GAPS question, its Oct 28 run; the generated grades row stays until KB answers). (5) **"Last week" definition (BLOCKED row due today) → RULED:** one definition everywhere a week figure prints — the change vs the mark **≥ 5 days back** (the home rule, iw-2026-10-03-1, as `0c14f12` did on 22 pages). Any figure measured against the previous mark (3–4 days) is either converted to that rule or labelled **"since last update"** (Site Sweep U-F13 wording). **Night Crew Wed Oct 28** does both in one pass in `js/plain-read.js` + bakes; NG00/AQ03/ND02/CZ23 are the check cases. (6) **Site Sweep Oct 27 `a05df67`** (the one-liner below) → U-F13 "sold mark"/"vs last mark" → **NC Wed (P0-C)** with (5) · U-F14 SLIDING badge vs +129% → **approved**: when the since-base and this-week signs differ, the badge names the week ("DOWN THIS WEEK"/"UP THIS WEEK") → NC Wed · U-F15 home movers "n = 39" → **NC next home pass (P0-B)**, proposal wording approved. (7) **Attended Oct 27 (Mo) — read, nothing re-ruled:** index pages in dollars `ccda96b`; `/pokemon-grading-premiums` `d46e145`; Goal League approved, Season 1 Nov 2 (`goal-league/RULES.md`, 5 hunters + Commissioner = re-scoped Traffic Agent); Data Desk chartered (Sun, first `LATEST.md` Nov 1); X addendum (Wed Collector's Desk link post; Mon/Fri data posts from Nov 2); Grok bots → scouts (Grok-side paste = NEEDS-MO). og-image item A (undated "$94 Darkrai" on 608 link cards) is the review's BLOCKED row → NC Wed first item. **BS1E ▼31.6% w/w** (in today's Tape subject) → **Integrity Watch Thu Oct 29** confirms move vs bad mark. (8) **GitHub token rotated (attended Oct 26)** → NEEDS-MO item **closed**, verified by `claude/ops/github-token-rotated-2026-10-26.md` (track-signal write `126ce0f`). (9) **Grok Editor re-run** (`editor-collector-voice-2026-10-26.md` re-produced 11:59 PT, five sections, 4 Pokémon questions + 5 tool complaints) → **copied** to Project `claude/grok/collector-voice-latest.md` (replaces the "NOT PRODUCED" copy) — the BLOCKED row's next action is done; the review closes it. Also on disk: `creator-request-bowman-draft` (Bowman Draft 2026 date NOT ANNOUNCED; Jan 14 / mid-Dec are retailer rumours), `seeker-2026-10-27` (Delta Reign: official "over 135 cards", 141 unofficial), `stalk-2026-10-27` → the 00:40 copy lane carries them; `grok-requests/*` = the attended session's scout asks. (10) **Class Ladder BOW23** (Bowman KB run 13 draft, universeComplete false, 335 rows / 324 first, 2 held, console slugs unverified) → **not copied**: the Project read returns text only, so the copy would be a 110 KB re-type of a pre-activation draft; copy when it flips complete (COPY-LOG note). Ops' "no class-ladder commit" was early — `1664205` marked BOW25/BOW24 at 16:18Z. (11) **Measure Oct 27** → GA4 `day` label is UTC−1 on off-schedule runs (no Oct 25 history row) → the instruments row, **Oct 28 weekly**; E17 kill wording no longer fits (2 KE) → CoS rules **Oct 31** as planned. (12) **Heartbeat** → STATE 25,075 B → trimmed this run (archive pass below). (13) Read, no action: daily review 10-26, tuesday-board, digest (sent 18:27Z to 3; first outside signup sits *unconfirmed*), x-daily (queue empty, Mo's "go" not given; browser label swap noted, deviceId rule holds), seo-aeo weekly (0/20 AI answers cite us), traffic + league board 10-27, x-images png (Data Desk seed), desk-mirror files (yesterday's own). Pipeline: 3 `awaiting-cos` ruled; IW last-three lookback (Oct 15/22/26) all ledgered.
  **Commits:** `3e4da7f` (deploys) · `dcaca47` (deploys) · this docs commit (STATE + archive, NEEDS-MO, `pipeline.json` 3 rulings + pushLog; does not deploy). Competitor scan of `pipeline.json` additions: 0 names.
  **Deliveries:** none (R10 Am. 6; no vendor brief).
  **Instruments:** prices day **Oct 27**, 41 cards, 37 numeric, 40 images · GA4 14:59Z Oct 27 (**7.5 h**): KE yesterday **2 on 77** · organic KE7 9.3% vs blended 2.57% · returningShare7 2.19% raw · clicks7 **17** · bots 59.4% (SG 278) → clean 190, 8.95 clean KE/100 · Mobile QA iPhone 13 (beacons + comps aborted): 5/5 200, scrollWidth 390, photos 0/0 · 3/4 (the empty share-card preview, by design) · 20/20 · 66/66 · 5/5, 0 page errors (console lines = the aborted requests only).
  **Ideas/retention:** no files due (Tue; Ideas off, Retention Sundays) · retention LEDGER 0 unruled.
  **NEEDS-MO:** new block (Grok scout paste, optional); GitHub token closed; carried TAG Nov 1, BCB26 video, EPN CSVs, X "go".
  **Stumbles:** the BOW23 Project read again came back inline (~110 KB) — that is why the copy was deferred rather than re-typed. First QA pass counted aborted-beacon console lines as errors; re-checked with `requestfailed` (all aborted by us). Archive pass moved the Oct 26 desk entry (4th-newest) and the Oct 21/23 NOW blocks earlier than 7 days, pointer kept.
- **Oct 27 10:10 PT Site Sweep (Mac key):** 196 loads (98 sitemap), 0 errors/overflow/404/untagged (B2 308s now 2) · fixed home index-box "since release" clip at 390, index chart legend plain on 39 pages (method → "How this index works", R43), /indices "levels load live from data/indices.json" → "Prices as of Oct 26, 2026" · pushed `a05df67` · filed U-F13 "sold mark"/"vs last mark" on 37 index pages (NC P0-C), U-F14 SLIDING badge vs +129%, U-F15 home movers "n = 39". *(Written by the desk from the Sweep's one-liner.)*
- **Oct 27 11:00 PT Tuesday board (Mac key):** `1055d87` + `29857a5`; no seat moved (Florentino +7.0% top, Aloy −9.1% to $50.00, on his line); Tape sent 18:27Z to 3; gates 0/48 · 0/19 · 0/1. Record `claude/cos/tuesday-board-2026-10-27.md`.

- **Oct 27 Traffic Agent:** board day Oct 26: not rankable (A 28 / C 11 / B 1); floor read: PE-vs-DR DEAD → 301 patch prepared (attended applies); sitemap lastmod 40 refreshed + Sapphire FB calendar row; no E6 round (same 7 `/bowman-football` queries, answered; Bing page buckets now reach Oct 23); ~550 card pages held out per the 10-26 review (supersedes the desk's 15:14 "add all"). Gates 0/48 · 0/19 · 0/1 (= origin/main); organic 7 d 45. Record `claude/traffic/2026-10-27.md`.
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
