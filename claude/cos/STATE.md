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

## NOW — 2026-11-04 (CoS weekly, 11:00 fire, cloud build + Mac push): **`37d6f90` live** — index charts legible on phones (labels 4.4 → 11 px, all set-index pages) · 3 dead buy strips fixed · "ranked by ROI" hobby-box tag corrected on 6 surfaces · Bowman monthly-check copy fixes · photo map refresh (`px` stripped, R17). Gates 0/54 · 0/4 · 0/1 (cloud `--run-tests` 153 scenarios FAIL 0). Rollback: `git revert 37d6f90`. Scores: Img 8 · **Mob 7** · Bugs 8 · Mot 8 · **Vault 7** · Perf 8 · Id 8 · Cred 8 · Return-user **4/14**.

## NOW — 2026-11-02/03 (moved to `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-04): Pokémon nav `c75b8ed` · NC mailbox `6ff3fcb..c91544a` · Tuesday board `f3968fa`. **Still open from them:** Van Gogh Pikachu page noindex while in the nav → Nov 12 check · Tuesday Tape not sent → attended, by Mon Nov 9.

## NOW — 2026-10-29 (Mo attended; desk applied the same evening): **R44 goals/tiers/brakes + R45 bias-to-action are in LANE-RULES (`d9a8268`)** — every item names G1 returning / G2 clicks→EPN / G3 indexed or CHORE; P0 now · P1 top-10 first screen this week · P2 weekly batch (cap 5); two fix rounds then BLOCKED. **Launch first, measure after; PIVOT freeze lifted; no 301/delete/noindex/sitemap removal until the Nov 12 check (BET-20261029-1, Commissioner restores culled pages with history by Oct 31).** CEO Desk back daily 13:47 (bets in `claude/cos/ceo-desk/BETS.md`); Press desk off; agent-readable site = BET-20261029-2 (feed by Nov 15, thin MCP tool within 7 days of it; no eBay URLs in anything for machines). PIVOT block (Oct 19) moved to the archive, pass of 2026-10-29.

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-11-04 (GSC live, Browser 1 `/u/1/`; MailerLite live, Browser 1; Bing Webmaster SIGNED OUT in Browser 1 → Bing API nightly; GA4 nightly snapshot, data day Nov 3, 16:39Z; EPN signed out — newest CSV is the Oct 30 custom-ID export)

1. **Search fell off a cliff, and it fell after the cull that was meant to fix it.** GA4 organic landings: ~10/day Oct 7–15 → **~2/day since Oct 25**; organic sessions 7 d **16** (37 on Oct 28, 43 before). Google: **4 clicks / 31 impressions in 28 d** (8 / 51 a week ago); indexed **1 / 91** (33 crawled-not-indexed, validation Failed; unchanged). Bing API, 4 weeks to Oct 30: **110 clicks / 746 impressions** (131 / 1,043 the read before). Organic key-event rate **18.75%** (n = 16) beside blended **1.4%** (bots 74% of sessions: SG 565 @ 0.4 s). *Doing:* no GSC indexing spend (R40/§0 ruling — nothing materially changed); release flips owed by the Goal League (Cosmic Chrome Bb streets today, Donruss 8 days late) re-routed; the Nov 12 check (BET-20261029-1) is where the cull is judged. **§0.3 flag below.**
2. **Money is still ~$0.** GA4 outbound `click` **21 / 7 d** (19, 16 the two weeks before); buy strips 3; card pages **2 clicks on 252 card views** (8 clean card landings, 0 key events). EPN last read $0.22 (Oct 13–29, 1 sale); partner.ebay.com shows the login page in Browser 1 today. *Doing:* 3 dead buy strips (Holiday Mega, 2026-27 Topps Bkb, Donruss FB — all swamped by break slots) fixed today, dead 3 → 0; the "ranked by ROI" hobby-box tag that over-promised the #3 money page fixed on 6 surfaces.
3. **Returners are vanishing and the list can't be read.** Returning users **2 / 7 d** (10 on Oct 28), **23 / 28 d** (35). MailerLite **4 active — the first outside subscriber arrived Oct 31**, but GA4 `newsletter_signup` = **0**, so the signup event is losing real signups (193 `signup_view`, bot-heavy). Return-user scorecard **4/14**, unchanged since Sep 30. *Doing:* fix the client event first (Night Crew); the weekly reads `signup_page` in MailerLite as the ground truth meanwhile.

**§0.3 flag (data vs strategy):** the Oct 15/21 culls were sold as "the main fix for falling search traffic". Since then organic is down ~80% and Google impressions fell further. Correlation, not proof (Google was already near zero; Bing is the volume and Bing fell too), but the PIVOT's Nov 19 test (indexed > 3, organic 7 d > 48, returning > 6, clicks/100 clean ≥ 15.7) now reads **indexed 1 · organic 16 · returning 2 · clicks/100 clean 21/213 = 9.9** — **0 of 4**. The Nov 12 check should decide whether culled pages with Bing history come back; the CoS leans restore the ones that had Bing clicks.

## MILESTONES (R22 — one line per Wednesday read; the desk appends)

- **2026-11-04 (desk; Mo's exports `Card Hub/epn/epn-byday-2026-10-21_2026-11-03.csv` + `epn-customid-…`, Oct 21–Nov 3, files reconcile):** **48 clicks · 2 sales · $191.99 GMV · $5.76** (EPC $0.120; ex the $185 sale $0.0044). Both sales tagged: `pitch-black-vs-chaos-rising-13` (Pitch Black booster box, $5.55) and `fo99-5-tag` ($0.21). Trailing 30 ≈ **$6.88 = 2.3% of M0**. Clicks per 14 d still falling (79 → 58 → 48). n = 2 → no trend (R22). Read: `claude/cos/epn-read-2026-11-04.md`.
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
- **Nov 6 ~08:00 PT (Night Crew deploy, Mac-linked, unattended).** Shipped the 3-file mailbox on `30398a7`: Coverage Builder (11 TRK tracked cards + GSTAR card file, 30 new static card pages, search-miss 47 → 28) · Cupertino run 6 (scroll flow, 37 index pages) · run 7 (card-page "Raw, PSA or TAG?" row + calm look) · chore 1 build-nav payback (797 pages rewritten) · chore 2 seven unused web fonts deleted. Gates **0/56 · 0/4 · 0/1** = base. Live check: `claude/night-crew/log-2026-11-05.md` § Deploy.
- **Nov 4 ~15:12–16:30 PT (CoS · desk, Mac-linked scheduled fire, unattended).** Freshness: HEAD `1c0fee6` · origin/main `1c0fee6` at clone · gates **0/54 · 0/4 · 0/1** = baseline (weekly `37d6f90` + Price Truth `6ab18c0`). Read LANE-RULES (precedence, R1, R10 Am. 6, R39, R44–R47), STATE top + last 3 run-log entries, NEEDS-MO, ideas LEDGER. **Prompt drift (file wins):** STEP 0's clone under `$HOME` is impossible — the VM `/sessions` disk is 100% full (35 MB free, same as Nov 2–4) → cloned under `/tmp/desk-016exk` (key copies stayed under `$HOME`; both deleted at end) · STEP 3's Grok Bot vendor delivery is dead text (R10 Am. 6) · STEP 4's `npm i playwright@1` skipped (preinstalled Playwright).
  **Inbox since the Nov 3 15:12 desk: 17 Project docs + 8 Mac files (+ Studio tour v2 build files) + 0 `awaiting-cos`.** Ruled:
  - **Price Truth Desk run 2** (`6ab18c0`: sweep tool, CEL21/TH26 Classic Collection reprint labels, GSTAR medians need ≥ 3 sales, PB set-guide hero; LATEST · CHARTER · sweep Nov 3 + Nov 4 · SWEEP-SCRIPTS) → read; **its pushLog `liveVerified` filled** (curl ~23:15Z: `/celebrations-index` prints "Classic Collection reprint" ×29). Its asks: graded ladder 9 d old → carried (weekly ruling (2), desk Thu) · PSA 9-below-raw tolerance → the Nov 17 ruling stands · attach `Card Hub` to its task → needs-attended (task config).
  - **Night Crew B125 → routed to Price Truth as a 🔴 candidate for its Thu Nov 5 12:47 run:** `/gold-star-index` graded tape row 2 prints **Torchic ☆ PSA 10 $2,700,000 · ALT · Sep 10** (106× its Dec 2020 $25,400), live 23:15Z; a web search finds no such sale; Price Truth's Nov 4 run did not reach it. Hold the row unless the ALT lot confirms it; same pass on the ≥ 29× PSA 9/raw GSTAR cells. Not hand-edited here (generated block; the ceiling is methodology-adjacent).
  - Night Crew log Nov 3→4 (`7602551` deployed) → read; its BLOCKED copy-ins are the daily review's.
  - BET-20261104-1 (Delta Reign vs Pitch Black, Deal: Thu patch → Fri Nov 6 ship, sitemap event exception) → read, CEO Desk/Commissioner's.
  - **EPN read Nov 4** (Mo's CSVs, Oct 21–Nov 3) → **MILESTONES line applied** (R22).
  - Traded MCP intel (Mo DM'd for beta access) → read; nothing for the desk until a reply. The PSA-pop self-build waits on an attended CoS call, not on Mo physically → not on NEEDS-MO.
  - **Ivan Nov 4 review** → verified live (McDonald's 17× "From Nov 11" + 18 eBay search links; the booster-box "listed under our sold price" row is client-filled by `js/deal-row.js`; Flagg prints both "June 2026" and "Jul 28, 2026") → **routed** in `claude/handoffs/desk-2026-11-04-routes.md`: McDonald's per-card links + column → Drop · single in the sealed deal row, ETB per-pack math, 1440 column → Deal · Flagg "No dated sale" styling, empty "Who it's for", two dates, World Cup card 01 + stale sold → Conversion. Fanatics gear vs R11 → not re-ruled (R6; declined Nov 2).
  - Class Ladder universe copy (Ops watch) → **not copied**: BOW16 is `universeComplete:false` (KB run 21 draft, its own `_comment` says the desk does not copy it); BOW17–23 are still drafts → the complete-only rule (COPY-LOG Oct 27) holds; the watch item is working as ruled.
  - Ops heartbeat Nov 4 (NC + Wildcard down, re-fires refused) → the daily review's; NC filed late and deployed; Wildcard's `pending.patch.txt` appeared 15:36Z → the Commissioner's Thu fire ships or rejects it.
  - Daily review Nov 3 → its desk items: STATE trim **applied** (29.9 KB → under cap) · footer LANE-RULES line closed Nov 3 (R47) · desk Gmail line: **absent** (no Gmail connector in this fire's tools).
  - measure · traffic · x-daily · heartbeat Nov 4, bowman-monthly-check handoff (weekly → KB agent), BOW16 draft → read, no desk action. X Daily's scheduled-post edit is its own lane (R10 Am. 4–6), not re-ruled.
  - Mac: grok-inbox `ivan-review-2026-11-04` (ruled above) · `stalk-2026-11-04` → skipped (the 00:40 copy task carries it) · `grok-requests/*` ×6 (lanes' asks to Grok) · Studio tour v2 files · EPN CSVs (in the MILESTONES line) · desk-mirror (ours) → no ruling. No Seeker/Creator/Editor file → nothing to copy (R39).
  **Commits:** this docs commit only (STATE trim + entry + MILESTONES, NEEDS-MO, `pipeline.json` pushLog) — does not deploy. Competitor scan of `pipeline.json`: 0 new names.
  **Deliveries:** none (no vendor brief; R10 Am. 6). Tuesday Tape still unsent (attended, by Mon Nov 9).
  **Instruments:** feed day **Nov 4**, 41 cards, 37 numeric, 40 images · GA4 16:39Z Nov 4 (~6.6 h): KE yesterday **2 on 216** (24 clean) · organic KE7 **18.75%** (n 16) vs clean 9.86/100 · returningShare7 0.26%, returning users 2 · clicks7 **21** · bots 73.7% (SG 565, CN 31) → clean 213 sessions / 21 KE · Mobile QA iPhone 13 (beacons/eBay/YouTube aborted): 5/5 200, scrollWidth 390, 0 console errors, photos 0/0 · 3/3 (+1 empty-src template img) · 20/20 · 66/66 · 5/5.
  **Ideas/retention:** no ideas file (Wed); retention: no new file, 0 unruled.
  **Stumbles:** (1) the clone-path deviation above; (2) a full `project_read` of the 110 KB BOW16 JSON to check one flag — next time search for its `_comment`. Archive pass: Nov 3 desk + Nov 4 Commissioner run-log entries and the Nov 2 price-lane + Oct 21 GSC NOW blocks → `STATE-ARCHIVE-2026-11.md` (pass of 2026-11-04).
- **Nov 4 ~11:00–12:10 PT (CoS · weekly, scheduled, unattended).** Freshness: HEAD `99fe17f` · origin/main `99fe17f` at clone · delta 0 · gates 0/54 · 0/4 · 0/1 = Commissioner baseline. Read LANE-RULES (precedence, R1, R2, R10 Am. browser 1, R40, R44–R47, cadence + known prompt drift), CHARTER, STATE, NEEDS-MO, the three rooms. **Prompt drift (file wins):** the prompt names GA4 in Browser 2 (LANE-RULES Oct 26: always Browser 1 — GA4 read there, `authuser=1`); `npm i playwright@1` (preinstalled Playwright used); STEP 4 roster names pre-Oct 1 agents (spawned the §2B roster); `claude/reaudit-log.md` and `claude/cos-brief-to-green-2026-09-01.md` are no longer Project docs — they live in the repo under `claude/archive/project-2026-10/claude/` (scorecard appended there).
  **§0:** GSC live (`/u/1/` — `/u/0/` now says no access), MailerLite live (4 active, +1 outside Oct 31), Bing Webmaster signed out (API nightly used), GA4 nightly + realtime. Top 3 above.
  **Agents (5, in-run):** Bowman monthly checker (first Wednesday — due) · UX Auditor (14 pages × 2 + 137-URL phone sweep) · Photo + Index Keeper · Content Editor + Release Watch · Retention Analyst (+ Gengar buy-strip duty). Room entries written to the three rooms. Bowman AUDIT-LOG line + GAPS G64/G65 handed to the Bowman KB Agent (owner of both files) in `claude/handoffs/bowman-monthly-check-2026-11-04.md` — both files are 45–110 KB Project docs and a whole-file rewrite from a weekly run risks clobbering the agent's daily edits.
  **Beacon proof:** 0 analytics requests attempted (webdriver guard) + route aborts first in every context; GA4 Realtime ~19:50Z: **0 active users in 30 min** — proof held.
  **Audit:** 137/137 200 · 0 overflow · 0 console errors · 0 broken images · photos 1,073/1,073 · canonical/og 137/137 · R46 system fonts · JSON-LD missing on 22 PE `/card-*` pages + `/bowman-classes` (P2, generators). **Bugs 9 → 8:** index-chart labels 4.4 px on phones (P1, fixed same run, R43). Home 8.8 phone screens, Bangers 43.8, `/watchlist` first row ~900 px (carried P1/P2, not auto).
  **Shipped `37d6f90`** (cloud-built, tree `22fed45`, `git am -3` on a fresh Mac clone under `/tmp`, tree hash matched, gates re-run on the Mac, pushed; the cloud git proxy refuses pushes): `js/index-chart.js` · `data/buy-strip.json` (3 queries, no IDs touched) · home/indices/research/PSA/TAG hobby-box tag + Museum tense · Bowman G38 generator line, G27, G22 L1, G36, G20 · `data/card-images.json` (1,290 keys, 372 refreshed, 0 dead, `px` stripped). Live curl verified (chart file, home tag, BCB26 count, buy-strip queries; DR25 200). IndexNow 137 URLs → 200.
  **Rulings:** (1) **R17 vs `px` in `card-images.json`** — R17 wins: no listing price in the public map; the resolver must stop writing `px` (Gate Keeper/Photo Keeper tool fix → BLOCKED row); the "vs sold mark" chip stays dark until it reads a labelled ask from our own feed. (2) **Graded ladder did not write Mon Nov 2** (files still Oct 26/27) → desk Thu: check the nightly's Monday ladder step; P0 if Mon Nov 9 also misses. (3) **Ohtani US285 engine SELL vs `/mlb-cards`** — the engine wins (Mo, Sep 3); `/mlb-cards` makes no call, its Oct 13 comps are the defect → its owner's re-read, not a copy change. (4) **Booster-box page sitemap hold (Commissioner, Nov 4)** — released: R45 freezes removals, not additions; add it at the next Commissioner push. (5) **Retention proposal (server-side `newsletter_signup` via a GA4 API secret)** — re-scoped: no new secret (Mo signs into nothing); Night Crew first finds why the client event missed the Oct 31 signup; the weekly reads `signup_page` in MailerLite as ground truth. (6) **Release flips** (Cosmic Chrome Bb today, Donruss, Heritage FB, Holiday Bb, F1, Obsidian) + missing rows (Midnight FDI Nov 6, Heritage FB Mega, A&G X, Flagship Bkb Mega, Finest F1; Delta Reign prerelease to Nov 5) → Goal League owner via the Commissioner. (7) `/watchlist` signup below the table on phones → Retention Analyst + Night Crew BACKLOG (moves the R26 capture; not auto). (8) Stale-price check: `audit-site.mjs` has no stale-prices rule despite older WARN text — Gate Keeper adds one (P2). `awaiting-cos` in `pipeline.json`: 0.
  **Bowman check (monthly, due):** no new 🔴; first-bowman dry run clean (0 contradictions, 659 INFO); 4 known gaps patched; G64 (Bangers "76 of them 1st" count) and G65 (Jose Castro name collision) opened.
- *(Pointers for R24 and the run history — which entry sits in which archive pass — moved whole to `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-04; older passes are listed there.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
