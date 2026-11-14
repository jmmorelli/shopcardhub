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

## NOW — 2026-11-14 (CoS desk): **`81756fc6` live** — phone buy-strip button labels may wrap (site-gates image sweep FAIL 2 days: `/mlb-rookie-of-the-year-2026-cards` 395>390, `/indices` 392>390 under the runner's DejaVu font). Gates 0/68 · 0/4 · 0/1 (base 0/64, +4 = Oct 22/23 stamps on the day roll). League push still staged for the Commissioner Sat 05:56. Rollback: `git revert 81756fc6`.

## NOW — 2026-11-13 (CoS desk): **`dd573c62..ba2ba719` live** — Cupertino 13 (money page `/pitch-black-vs-chaos-rising`: eBay button on the laptop first screen, y 442) + Price Truth Nov 12 (rule (d′) engages Nov 17; CZ23 Mew GG10 PSA 10 verifier hold; TH26 "188 cards in the level"; /deals counts) + Black Friday deals block sealed-only. Coverage Builder run 2 left for NC deploy Fri 06:41. Gates 0/64 · 0/4 · 0/1 = base (day roll). Rollback: `git revert ba2ba719 5f662308 9d0d07eb dd573c62`.

## NOW — 2026-11-12 (CoS desk): **`3248caf..fd96d65` live** — NC mailbox (deal dedupe, sealed-only booster-box block, harness eBay abort) + Price Truth pair (/deals holds 28 slab rows on the 16-day-old Oct 26 yardstick; CEL21/ND02 a-15x held; PB vs CR headline 55.77 vs 33.13 at Nov 9). Gates 0/61 · 0/4 · 0/1 = base (+3 day-roll stamps). Rollback: `git revert fd96d65 da45fc6 664ea5d 3248caf`.

## NOW — 2026-11-11 (CoS weekly, unattended): **`4ef9902` live** — R9 label "1st Bowman Chrome Autos" in nav/footer/llms (802 pages) + BOW26 baked plain read; 30th page post-release copy (no "presale"/"Releases Nov 6"; stamp "188 of 191 cards in the level"); shop-spread drops the venue call (R38). Gates 0/58 · 0/4 · 0/1 = base. Rollback: `git revert 4ef9902`.

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
- **Nov 14 ~01:12–02:20 UTC (Nov 13 ~17:12 PT) (CoS · desk, Mac-linked, unattended; Fri slot on time).** Freshness: HEAD `e9f8cf0f` · origin/main `e9f8cf0f` at clone · gates **0/68 · 0/4 · 0/1** vs base 0/64 · 0/4 · 0/1 (+4 prices WARN = PB vs CR, Topps Chrome BB, Chrome Updates BK, Flagship BK 26-27, Holiday BB stamps Oct 22/23 crossing 21 d on the Nov 14 UTC roll; untouched). Read LANE-RULES (precedence, R1, R2, cadence + drift lines, R23, R44–R47), STATE top + last 3, NEEDS-MO top. **Prompt drift (file wins):** `$HOME` clone impossible (`/sessions` 100% full) → key + clone in `/tmp/desk1114` + `/tmp/deskk-1114`, deleted at end · STEP 3 vendor delivery dead (R10 Am. 6) · feed from `/feed/`, GA4 from a `price-data` clone · desk runs 7 days at 17:11 PT, not weekdays 14:00. Ideas Desk off → no LEDGER rulings.
  **Inbox since the Nov 13 desk: 18 Project docs + 4 Mac files (grok-inbox ivan-review 11-13, attention 11-12, stalk 11-13, pullcheck 11-13; dungeon-keeper CHANGELOG skipped, R12) · 0 `awaiting-cos` · gate-watch issue #5 (GitHub API from the Mac: scheduled site-gates `e9f8cf0f` failure, image sweep FAIL 2).** Ruled:
  - **gate-fail-roy-overflow-2026-11-13 (CEO Desk)** → **applied `81756fc6`**: `.bs-go/.bs-go2` nowrap under the CI runner's wide fallback font (DejaVu); reproduced 395/392 with DejaVu forced, 390/390 after; also clears the new `/indices` FAIL. Live CSS byte-equal (sha `f1aefbed`), production re-check with DejaVu forced 390/390. Next scheduled site-gates (~21:30Z Sat) is the proof → Ops reads it.
  - **BET-20261030-1 (CEO Desk: retire to standing program)** → **adopted**: Cupertino's G2 number from now = `cardPageClicks7` + `/` eBay clicks (both 0 today), re-read at the **Dec 1 desk**; pace stays one change a run; Proposals 4/6/7/8 left to the CoS review. Relay into Cupertino CHARTER → next weekly (Project at 98% of cap, no doc growth tonight).
  - **Commissioner traffic 11-13 + `handoffs/league-2026-11-13.patch.txt` + 5 contestant patches** → **queued, Commissioner Sat Nov 14 05:56** (its own BLOCKED row). Not applied here: the Project returns the 91 KB xz+base64 inline only; re-typing it is not byte-safe (R44(c), no attempt). Binder page (BET-20261112-1) waits on it.
  - **Ivan 11-13** → 1 FIXED (sideways scroll, above); 2 declined with standing answers (Black Friday block hidden = no sealed row under mark today, `/api/deals` 41 rows all raw; home search buttons carry campid by design since `dbebabf`); Mbappé + hobby boxes given dates (Conversion Sun Nov 15; price lane Nov 16; walk Tue Nov 17). Appended to `Card Hub/grok-requests/ivan.md`.
  - **Ops heartbeat 11-13** → NC deploy fired late (16:32Z, shipped). Project size **1,968,490 / 2,000,000** → this run shrinks the NEEDS-MO mirror 87 KB → 4.6 KB (older blocks → repo `NEEDS-MO-ARCHIVE-2026-11.md`, R37) and retries the orphan `night-crew/pending-pt.md` delete.
  - **Measure 11-13** → `signup_submit` absent 4th read + `home2_index_pick/_open` absent day 2 → **queued Night Crew Mon Nov 16** (signup row slipped its Nov 13 date; the review owns the slip). McDonald's organic 14 → 2 on one day → watch only.
  - **Pull Check 11-13** → DLR is the demand signal (5/6 pulls), no DLR card file → **queued Wednesday weekly Nov 18** (new card data). Folder-attachment note → Ops.
  - **Site Sweep 11-13** (`564356e`, shipped by the lane) → affiliate-rule wording chore → attended prompt-fix list. Read, no desk action: x-daily 11-13, NC log 11-12, KB Bowman AUDIT-LOG 11c / ADDENDA 11e, KB Pokémon GAPS-DELTA, grok attention/stalk.
  **Commits:** `81756fc6` (site, deploys) + this docs commit (STATE + archive pass, NEEDS-MO + archive, pipeline pushLog; does not deploy). Competitor scan of `pipeline.json`: 0 new names.
  **Deliveries:** none (R10 Am. 6). **Chrome:** still 2 browsers connected (re-checked, list only).
  **Instruments:** feed day **Nov 13** · 41 cards · 37 numeric · 40 images · GA4 16:50Z Nov 13 (data Nov 12): KE yesterday **3 / 74** · organic KE7 **17.95%** vs blended 8.61% (46/534) · returningShare7 2.11% (11) · clicks7 **46** · bots 63.7% (SG 307, CN 35) → clean 195 · `cardPageClicks7` 0 · iPhone 13 QA 5/5 200, sw 390, 0 errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **Ideas/retention:** no ideas file (desk off); no new retention file since Nov 8.
  **Stumbles:** clone path (disk) · the first production repro showed no overflow until the runner's font was forced (font-dependent cause).
- **Nov 13 ~16:32 UTC (NC deploy, Mac-linked, unattended).** Shipped NC Nov 13 (`/indices` strip under the hero, G28 product labels ×7 pairs, YouTube short links ×6, U-F19 ×5, P74) + Cupertino run 14 (`/best-charizard-cards` on the design system, card-img ring off). Post-image blobs exact (12/12), regen (BOW26/BCB26 bake, buy-strip ×3) in its own commit; gates 0/64 · 0/4 · 0/1 = base. **Coverage Builder run 2 NOT shipped** (110 KB of one-line data JSON, no byte-exact transport from the Project) — stays in `claude/night-crew/pending.patch.txt` as 1/2; 2/2 → `git am --skip`.
- **Nov 13 ~01:11–02:05 UTC (Nov 12 ~17:11–18:05 PT) (CoS · desk, Mac-linked, unattended; the 17:11 PT slot on time).** Freshness: HEAD `f3c4d71b` · origin/main `f3c4d71b` at clone · gates **0/64 · 0/4 · 0/1** vs base 0/61 · 0/4 · 0/1 (+3 prices WARN = UTC day roll; the untouched base tree scores 64 today, WARN lists identical). Read LANE-RULES (precedence, R1, R10 Am. 6, R15, R37, R39, drift lines), STATE top + last 3, NEEDS-MO top, ops heartbeat 11-12, daily review 11-12, scout-findings rule 11-12. **Prompt drift (file wins):** `$HOME` clone impossible (`/sessions` 100% full) → key + clones in `/tmp/desk-1113`, deleted at end · STEP 3 vendor delivery dead (R10 Am. 6) · feed read from `/feed/`, GA4 from a `price-data` clone (not raw.githubusercontent).
  **Inbox since the Nov 12 desk: 17 Project docs + 7 Mac grok files (ivan-review 11-12 + 3 "did not run" backfills, attention 11-11, stalk 11-12) + grok-requests ×6 + Studio youtube/voice files · 0 `awaiting-cos` in pipeline (3 in IW 11-12 proposals) · lane heartbeat 0 missing.** Ruled:
  - **NC mailbox** `pending.patch.txt` (CB run 2 + Cupertino 13) → **Cupertino applied `dd573c62`** (post-image `fb54888e` exact); **CB queued → NC deploy Fri 06:41** (110 KB of data lines, no byte-exact transport; `pending.md` rewritten with blob checks + `git am --skip` for 2/2).
  - **Price Truth pair** `pending-pt.*` → **applied `9d0d07eb`** (8/8 post-image blobs exact) + **regen `5f662308`** (CZ23 GG10 PSA 10 held `v-verifier`; TH26 answer/JSON-LD "188 cards in the level … $1,398 (3 more … own line)"; /deals "· n sales" + "once a day"; should-i-grade no $1,088). Sweep RED 0. Project patch deleted, note → SHIPPED.
  - **IW 11-12** -1/-2/-3 → **applied** (same commits), ledgered; status notes left with their owners (Chrome pick on NEEDS-MO, BS99 mix → Price Truth, P68 → price lane Nov 16).
  - **Ivan Nov 12** → 1 FIXED (`ba2ba719` Black Friday deals block sealed-only) + 2 FIXED by the mailbox, 2 REJECTED (Fanatics, "each morning" — standing answers appended to `Card Hub/grok-requests/ivan.md`), 7 OWNED with dates; table in `claude/handoffs/desk-2026-11-13-routes.md`.
  - **EPN read 11-12 (`dbebabf`)** → pushLog entry written (the attended session left it). Fri Nov 13 full day = first clean EPN day → the next EPN read.
  - Read, no desk action (R6): review/ops/measure/traffic/x files 11-12, grok copy-task files, Studio dlr26 + voice A/B.
  - **R37:** Project 1.70 MB > 1.6 MB → sweep **deferred 2nd day** (Project reads arrive inline only, so archiving = re-typing each doc; 300 KB under the cap; Ops prunes daily). Needs a Project→Mac export path → attended list.
  **Commits:** `dd573c62` · `9d0d07eb` · `5f662308` · `ba2ba719` (site) + docs commit (STATE, NEEDS-MO, pipeline IW rows + pushLog `dbebabf`/Nov 13; no deploy). Competitor scan of `pipeline.json`: 0 new names.
  **Deliveries:** none (R10 Am. 6).
  **Instruments:** feed Nov 12 · 41 cards · 37 numeric · 40 images · GA4 17:11Z Nov 12 (data Nov 11): KE 10/99 · organic KE7 17.3% vs blended 4.57% · returning 1.98% (11) · clicks7 47 · bots 66.8% (SG 352, CN 28) → clean 189 / 46 KE · iPhone 13 QA 6/6 200, sw 390, 0 errors, photos 0/0·3/3·20/20·66/66·5/5 · PB vs CR eBay button y 442 @1440.
  **Ideas/retention:** no ideas file (Earnings Ideas disabled); no new retention file.
  **Stumbles:** clone path (disk) · hand-carried PT patch 7 B off its stated sha (message whitespace; content exact by 8/8 post-image blobs) · QA photo filter re-run · R37 deferred.
- *(Pointers for R24 and the run history — which entry sits in which archive pass — moved whole to `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-04; the Nov 4 weekly entry, the Oct 30 EPN line and the expired Oct 26 freeze rule went there in the pass of 2026-11-06; the Nov 4 desk, Nov 6 Night Crew deploy and Nov 6 Commissioner entries and the Oct 29 NOW block (R44/R45 now live in LANE-RULES) in the pass of 2026-11-09; the Nov 4 weekly + Nov 2/03 NOW blocks, the Nov 4 EPN MILESTONES line the Nov 6 desk entry and the Nov 9 Night Crew deploy entry in the pass of 2026-11-10; the Nov 4 top-3, the Nov 9 Monday NOW block and the Nov 9 desk entry in the pass of 2026-11-11; the Nov 10 desk entry and the Nov 10 Tuesday-board NOW block in the pass of 2026-11-12; the Nov 10 desk NOW block, the Nov 12 desk entry and the Nov 11 weekly entry in the pass of 2026-11-14 — still open from them: Van Gogh Pikachu noindex → Nov 12 check · Tape unsent → attended.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
