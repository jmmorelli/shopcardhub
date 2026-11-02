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

## NOW — 2026-11-02 (Monday price lane, automated): **chase indices re-marked `904fd6f`** — PB26 58.96 (−7.3%) · CR26 35.24 (−4.5%) · AH26 61.38 (−4.4%) · PRIS25 60.63 (−1.2%) · DR25 52.69 (−4.0%) · PF25 64.98 (−3.1%) w/w on PriceCharting ungraded sold values, 289/289 cards, no divisor change; desk/card pages/og/home re-baked; gates 0 FAIL (51/3/1). Classic + whole-set tickers mark in the 19:30Z job. Exceptions (6 meta-tied Pokémon pages, 15 unread sports pages) and the local calls.json re-read: `claude/cos/weekly-scan-2026-11-02.md`.

## NOW — 2026-11-02 (CoS attended with Mo, in chat): **Pokémon nav rebuilt `c75b8ed`** — Mo: "Don't we have more Pokémon content than this? What about the best Charizard cards?" Audit: 14 Pokémon pages (six Gengar's Desk best-X, Charizard ex / Van Gogh Pikachu / Mega Darkrai worth, Delta Reign Nov 6, AH vs DR, should-I-grade, grading premiums, gift guide) lived only in site search with 0–2 inbound links; `/research#pokemon` listed 2. Pokémon mega panel now 4 columns (Sets & Guides +Delta Reign · Gengar's Desk — Best Cards (6) · Is It Worth It? (5) · Compare & Grade (5 + indices)); `/research#pokemon` 5 → 20 guides; sitemap +`/should-i-grade-my-pokemon-card` +`/bowman-classes`. Gates 0/51 · 0/3 · 0/1; live curl verified; IndexNow 136 → 200. Rollback: `git revert c75b8ed`. **Lesson:** the cloud sandbox proxy now blocks SSH pushes outright (not just the https rewrite) — build in the cloud, push from a fresh clone on the Mac VM under `/tmp` (the VM's `/sessions` disk was 100% full; `$HOME` clone failed on commit). Note for the next nav-touching lane: Cupertino run 3 (`704e73c`, footer) landed mid-build; nav was regenerated on top, not rebased. **Open:** Van Gogh Pikachu page is still noindex from the Oct 20 cull and now sits in the nav — Nov 12 check decides whether it comes back (BET-20261029-1 freeze holds).

## NOW — 2026-10-29 (Mo attended; desk applied the same evening): **R44 goals/tiers/brakes + R45 bias-to-action are in LANE-RULES (`d9a8268`)** — every item names G1 returning / G2 clicks→EPN / G3 indexed or CHORE; P0 now · P1 top-10 first screen this week · P2 weekly batch (cap 5); two fix rounds then BLOCKED. **Launch first, measure after; PIVOT freeze lifted; no 301/delete/noindex/sitemap removal until the Nov 12 check (BET-20261029-1, Commissioner restores culled pages with history by Oct 31).** CEO Desk back daily 13:47 (bets in `claude/cos/ceo-desk/BETS.md`); Press desk off; agent-readable site = BET-20261029-2 (feed by Nov 15, thin MCP tool within 7 days of it; no eBay URLs in anything for machines). PIVOT block (Oct 19) moved to the archive, pass of 2026-10-29.

## NOW — 2026-10-28 (Goal League Commissioner, unattended; was the Traffic Agent): **Goal League registry + scorer live** (`data/goal-league.json`, `tools/goal-league/score.mjs`): 37 pre-season claims granted (Deal 5 · Drop 9 · AI-Search 11 + /llms.txt · Conversion 10 · Wildcard 2), baselines from GA4 day Oct 26; rulings in each `claude/goal-league/<agent>/pending.md`. **R27 Am. 3** (Growth League superseded for league matters). Sitemap lastmod 19 refreshed. First scored read Mon Nov 9. Record `claude/traffic/2026-10-28.md`, standings `claude/goal-league/STANDINGS.md`.

## NOW — 2026-10-21 (GSC, Mo by hand): indexing requested on `/bowman-chrome-baseball-2026`, `/bowman-football`, `/best-hobby-boxes-2026`, `/indices`, `/scarlet-violet-151-index` — **not re-requested before Nov 4** (R40). Full block: `STATE-ARCHIVE-2026-10.md` (desk pass Oct 28).

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-10-28 (GSC live, Browser 1 u/0 property https://www.shopcardhub.com/; GA4 + Bing from the price-data nightly snapshot, data day Oct 27, 15:34Z; MailerLite SIGNED OUT in Browser 1; EPN newest CSV still ends Oct 12)

1. **Search is still shrinking and Google indexes almost nothing.** GSC page indexing: **1 indexed / 91 not** (33 crawled-not-indexed, validation Failed · 57 discovered · 1 redirect) — was 3 / 144 on Oct 21. Google **8 clicks / 51 impressions in 28 d**. GA4 organic sessions 7 d **37** (43 → 37; organic KE rate **10.8%**: DuckDuckGo 11/5 KE, Yahoo 11/3, Bing 11/0, Google 2/0). Bing API 4 weekly buckets Oct 2–23: **131 clicks / 1,043 impressions** (striking distance = the `2026 bowman football` family, pos 4–7). *Doing:* no new indexing requests (R40; the Oct 21 five stay unrequested until Nov 4); the Goal League (Season 1 Nov 2) is the traffic bet now; Release Watch found three release pages still reading pre-release (Heritage FB, F1, Donruss FB due today) → League A.
2. **Money is ~$0.** GA4 outbound `click` **16 / 7 d** (20 last week); card pages 2 clicks. EPN: no CSV since Oct 12 → run-rate still ~$2/mo vs M0 $300. **Reddit paid test: 125 sessions, 9 engaged, 2 key events (1.6%) vs organic 10.8%, 5.4 s average** — it is failing its own keep bar ahead of the Nov 1 read. *Doing:* shipped today the Night Crew Oct 28 patch (search no longer throws a typo to eBay, priced card pages rank first, the stale "$94 Darkrai" link image is gone from ~608 Pokémon pages).
3. **Nobody signs up; returners flat.** `newsletter_signup` **0** for the 5th week (183 `signup_view`, mostly bots). Returning users **10 / 7 d, 35 / 28 d** (38 last week); clean returning share 4.95% (diluted by paid). Return-user scorecard **4/14**, unchanged five weeks. The DR25 page (paid landing, 129 users) logged **0** `signup_view` because its `#tapecap` form has no view event — the paid test's list outcome cannot be read. *Doing:* approved that instrumentation for the Night Crew (Fri).

**§0.3 flag (data vs strategy):** the Nov 19 kill/keep bar for the PIVOT is "indexed > 3, organic 7 d > 48, returning > 6, clicks/100 clean ≥ 15.7". Today: indexed **1** (fell), organic **37** (fell), returning 10 (pass), clicks/100 clean 16/216 = **7.4** (fail). One of four — the PIVOT is on track to fail its own test. And the Reddit ad is not converting. Key-event rate: **organic 10.8% 7 d** beside blended **2.2%** (bot-diluted; SG 287 sessions = 57% of 7 d).


## MILESTONES (R22 — one line per Wednesday read; the desk appends)

- **2026-10-30 (desk, off-cycle; Mo's custom-ID export `Card Hub/epn/epn-customid-received-2026-10-30.csv`, undated, assumed Oct 13–29):** **58 clicks · 1 sale · $7.45 GMV · $0.22** (EPC $0.0038). The sale came through `No Custom ID`; all 51 tagged clicks earned $0. Run-rate ≈ $0.45/mo, **below M0**. 1 action, so no trend (R22). Read: `claude/cos/epn-read-2026-10-30.md`. Controller dates it from the by-day export on Nov 2.

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
- **Nov 2 ~15:13–16:20 PT (CoS · desk, Mac-linked scheduled fire, unattended).** Freshness: HEAD `c22a0f7` at clone · origin/main `c22a0f7` → `367ed91` after the site push · gates **0/51 · 0/3 · 0/1** on the pushed tree = the Monday lane's stated base (51/3/1), no WARN delta. Read LANE-RULES (precedence, R1, R10 Am. 6, R39, R44–R46 — **prompt drift: STEP 3's Grok Bot vendor brief is dead text, R10 Am. 6 wins; STATE's "/tmp" key path vs the prompt's $HOME scratch — used $HOME**), STATE top + last 3 run-log entries, NEEDS-MO, ideas LEDGER (no Tue/Fri file today).
  **Inbox since the Oct 30 15:11 desk: ~45 Project docs + 60 Mac files + 2 `awaiting-cos` + 1 stale `queued-monday`.** Ruled (one line each; queued items carry owner + date in `claude/handoffs/desk-2026-11-02-routes.md`): IW Nov 2 → `iw-2026-11-02-1` **applied** (Bangers board: Roman Anthony Sapphire no longer prints as a 1st Bowman Chrome Auto; count 11 → 10, live-verified rendered) · `-2` queued Wed weekly · `-3` queued Night Crew Nov 4 (with RET-ABC) · `-4` queued Wed weekly, before the Thu Nov 5 classic mark · KB P60 (review Nov 1 → this desk) **applied**: `/psa-grading-guide` says PSA Value reopened Oct 29 at $39.99 ($500 cap, ~90–100 bd; ICv2 Oct 29 — psacard.com/pricing refused the fetch), Bulk/Plus/Max still paused, Standard/Priority on PSA's Oct estimates · Data Desk Nov 2 refresh **applied** (grade-premiums.json asOf Nov 2, page rebuilt by its generator, og PNG, pull.py date fix) with its make.py image kinds **queued** Wed weekly · weekly-scan: calls trending re-read **applied** (read fields only, no projection touched) · `price-exceptions` queued Wed weekly · `price-unread` ruled (not the Monday lane's; Nov 12 check) · `audit-2026-09-11-5` closed (step retired) · STATE over cap → archive pass below · BET-20261102-2 / Retention R23 → **adopted** (Night Crew Wed Nov 4; ledger both copies) · Bookmark Desk Impeccable test → **applied** as a "CoS relays" section in Cupertino's CHARTER (kill Nov 30); gsap-skills → video lane, noted · Gengar §4/§5 + ND1E house row → queued **Tue Nov 3 desk** (outside the mark window, as Gengar asked) · Night Crew pending (video embed) → not the desk's, deploys 07:52; its 30th-page phone first-screen note → Night Crew P1 · Ivan Nov 1 walk + Nov 2 review → routed (Night Crew verify-first list; Conversion via the Commissioner); his Fanatics-vs-R11 point **declined** (R11 retired Fanatics Collect, not the Impact gear link) · COO Nov 1 audit → recommendation queued Wed weekly, 5 questions → Nov 15 roster review · Treasury Oct (COMC/EPN/Impact signed out) → **NEEDS-MO** · Ops "NFL board unfired" → resolved (pushed `a068c32` 18:29Z) · prompt-drift-cleared, coverage-builder, YouTube lane/brand kit/x-youtube, x-weekly, nfl-board, measure/heartbeat/traffic/x-daily/daily-reviews Oct 30–Nov 2, Night Crew log Nov 1, KB volumes, Data Desk x-images → read, no action · Grok inbox (stalk ×3, seeker/creator Oct 31, editor + SEO/AEO Nov 2) → **skipped**: the Grok inbox copy task (00:40) carries them (R39 superseded in practice) · grok-requests ×6, youtube/video build files, `Claude outputs/*`, desk-mirror copies → lanes' own working files, no ruling · stray `Card Hub/calls-regrade-2026-11-02.json` → bin (the VM can't delete; harmless).
  **Commits:** `367ed91` site (bowman-bangers, psa-grading-guide, pokemon-grading-premiums + og, grade-premiums.json, pull.py, calls.json, pipeline rulings) — deploys; live curl + iPhone 13 render: board "10 prospects tracked", no Roman row; guide "Value tier reopened on October 29"; premiums "As of November 2, 2026 … 55.2×". This docs commit (STATE, NEEDS-MO, retention LEDGER, pipeline pushLog) — does not deploy. Competitor scan of `pipeline.json`: 0 (the one "card ladder" hit is our graded ladder).
  **Deliveries:** none (R10 Am. 6; no vendor brief exists).
  **Instruments:** feed day **Nov 2**, 41 cards, 37 numeric, 40 images · GA4 18:56Z Nov 2 (**~4.5 h**): KE yesterday **1 on 60** (not a FAIL) · organic KE7 **6.25%** vs blended 1.41% · returningShare7 0.48% raw, **returning users 3** · clicks7 **15** · bots 61.5% (SG 387 @ 0.47 s, CN 11) → clean **249 sessions, 15 KE (6.02/100)** · Mobile QA iPhone 13 (beacons/eBay/APIs aborted): `/`, `/watchlist`, `/bowman-bangers`, `/destined-rivals-index`, `/cooper-flagg-rookie-cards` + the two edited pages all 200, scrollWidth 390 everywhere, 0 console errors beyond aborted requests, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **Ideas/retention:** no ideas file (Mon). Retention: R23 ruled → 0 unruled.
  **Stumbles:** (1) the prompt's `npm i playwright@1` broke the container's preinstalled browser match; removed it and used the global Playwright. (2) This fire had **no Gmail connector**, so the Oct 29 §4 inbox sweep did not run (routes note → review). (3) psacard.com/pricing refused the fetch; the guide cites ICv2 with its date. (4) Archive pass: the Oct 27 NOW block and the Oct 30–Nov 1 run-log entries moved verbatim to `STATE-ARCHIVE-2026-10.md` / `-11.md` (pass of 2026-11-02); STATE is **23.2 KB** — under the 25 KB cap, above the review's 22 KB target; the Nov 4 weekly's new TOP 3 block replaces the Oct 28 one.
- **Nov 2 ~08:10–08:40 PT (Night Crew deploy, unattended; Mac deploy-key clone):** 4 commits `git am -3` clean onto `128ced2` (Cupertino runs 1–3: system font + tokens, 44 px nav, one generated footer; NC: B119 home week % rounded once, U-F16 Flagship BK buttons). Patch re-typed from the Project; all 24 post-image blobs matched the patch index lines. Regen: apply-site-fixes --fonts-only (762) · build-nav (765) · build-home · build-footer (wrap 720 · add 45; 2nd run 0). Gates 0/51 · 0/5 · 0/1 = origin base. Live check + log: `claude/night-crew/log-2026-11-02.md`. Rollback: `git revert` the 4 NC/Cupertino commits + regen.
- **Nov 2 ~06:53–07:40 PT (Goal League Commissioner, unattended; Mac deploy-key clone; scoring window open):** 5 contestant patches `git am` clean, oldest first: Deal `0aeb0c0` (/pokemon-card-gift-guide-2026, new, in sitemap per BET-20261030-2) · Conversion `afe677f` (investing tiles + undated figures cut on 5 player pages) · Drop `b3e4acc` (Delta Reign + 30th UPC presale sold rows; clears the 30th badge FAIL) · AI-Search `7191a6a` (/indices static dated answer, 3 retitled index pages, llms.txt questions) · Wildcard `3657a06` (/should-i-grade-my-pokemon-card, new, out of sitemap). 0 returned. Claim granted: Drop /pokemon-30th-anniversary-2026 (0.6071/day). build-aisearch wired into price-snapshot + classic-marks. Gates **0/51 · 0/5 · 0/1** (base 0/52 · 1/4 · 0/1; +1 site WARN = the grade tool's sitemap hold). Sitemap lastmod 17; pushed `5dc6410..93fb968` (write-tree cloud = Mac), live curl 20 pages 200, IndexNow 20 → 200. Record `claude/traffic/2026-11-02.md`; the Oct 29/30 Commissioner lines moved to the archive (pass of 2026-11-02).
- *(Pointers for R24 and the run history: **Oct 30 Night Crew deploy, Oct 30 desk, Oct 31 + Nov 1 Commissioner** and the Oct 27 / Oct 28-weekly NOW blocks — verbatim in `STATE-ARCHIVE-2026-10.md` / `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-02. **Oct 28 Goal League Commissioner (first run)** — verbatim in `STATE-ARCHIVE-2026-10.md`, pass of 2026-10-31. **Oct 29 and Oct 30 Goal League Commissioner** — pass of 2026-11-02. **Oct 29 ~16:47–17:35 PT (CoS · desk)** — verbatim in `STATE-ARCHIVE-2026-10.md`, pass of 2026-10-30. **Oct 28 ~15:12–16:05 PT (CoS · desk, Mac-linked scheduled fire, unattended)** and the Oct 28 CoS weekly entry — verbatim in `STATE-ARCHIVE-2026-10.md`, pass of 2026-10-29. Oct 27 desk: pass of 2026-10-28.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
