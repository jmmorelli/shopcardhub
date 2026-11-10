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

## NOW — 2026-11-09 (Monday price lane, unattended): **`ced2716`** — 6 chase tickers re-marked on PriceCharting ungraded sold values (PB26 55.77 −5.4% · CR26 33.13 −6.0% · AH26 58.70 −4.4% · PRIS25 61.10 +0.8% · DR25 49.59 −5.9% · PF25 62.36 −4.0%; Piplup #98 held by the move guard); index/desk/card pages, og and home re-baked. Gates 0/56 · 0/4 · 0/1 = base. Rollback: `git revert ced2716`. Report: Project `claude/cos/weekly-scan-2026-11-09.md` (DLR26 now listed on PriceCharting → `--init` is the CoS's; 6 meta-tied Pokémon pages still unre-marked).

## NOW — 2026-11-04 (CoS weekly, 11:00 fire, cloud build + Mac push): **`37d6f90` live** — index charts legible on phones (labels 4.4 → 11 px, all set-index pages) · 3 dead buy strips fixed · "ranked by ROI" hobby-box tag corrected on 6 surfaces · Bowman monthly-check copy fixes · photo map refresh (`px` stripped, R17). Gates 0/54 · 0/4 · 0/1 (cloud `--run-tests` 153 scenarios FAIL 0). Rollback: `git revert 37d6f90`. Scores: Img 8 · **Mob 7** · Bugs 8 · Mot 8 · **Vault 7** · Perf 8 · Id 8 · Cred 8 · Return-user **4/14**.

## NOW — 2026-11-02/03 (moved to `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-04): Pokémon nav `c75b8ed` · NC mailbox `6ff3fcb..c91544a` · Tuesday board `f3968fa`. **Still open from them:** Van Gogh Pikachu page noindex while in the nav → Nov 12 check · Tuesday Tape not sent → attended, by Mon Nov 9.

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-11-04 (GSC live, Browser 1 `/u/1/`; MailerLite live, Browser 1; Bing Webmaster SIGNED OUT in Browser 1 → Bing API nightly; GA4 nightly snapshot, data day Nov 3, 16:39Z; EPN signed out — newest CSV is the Oct 30 custom-ID export)

1. **Search fell off a cliff, and it fell after the cull that was meant to fix it.** GA4 organic landings: ~10/day Oct 7–15 → **~2/day since Oct 25**; organic sessions 7 d **16** (37 on Oct 28, 43 before). Google: **4 clicks / 31 impressions in 28 d** (8 / 51 a week ago); indexed **1 / 91** (33 crawled-not-indexed, validation Failed; unchanged). Bing API, 4 weeks to Oct 30: **110 clicks / 746 impressions** (131 / 1,043 the read before). Organic key-event rate **18.75%** (n = 16) beside blended **1.4%** (bots 74% of sessions: SG 565 @ 0.4 s). *Doing:* no GSC indexing spend (R40/§0 ruling — nothing materially changed); release flips owed by the Goal League (Cosmic Chrome Bb streets today, Donruss 8 days late) re-routed; the Nov 12 check (BET-20261029-1) is where the cull is judged. **§0.3 flag below.**
2. **Money is still ~$0.** GA4 outbound `click` **21 / 7 d** (19, 16 the two weeks before); buy strips 3; card pages **2 clicks on 252 card views** (8 clean card landings, 0 key events). EPN last read $0.22 (Oct 13–29, 1 sale); partner.ebay.com shows the login page in Browser 1 today. *Doing:* 3 dead buy strips (Holiday Mega, 2026-27 Topps Bkb, Donruss FB — all swamped by break slots) fixed today, dead 3 → 0; the "ranked by ROI" hobby-box tag that over-promised the #3 money page fixed on 6 surfaces.
3. **Returners are vanishing and the list can't be read.** Returning users **2 / 7 d** (10 on Oct 28), **23 / 28 d** (35). MailerLite **4 active — the first outside subscriber arrived Oct 31**, but GA4 `newsletter_signup` = **0**, so the signup event is losing real signups (193 `signup_view`, bot-heavy). Return-user scorecard **4/14**, unchanged since Sep 30. *Doing:* fix the client event first (Night Crew); the weekly reads `signup_page` in MailerLite as the ground truth meanwhile.

**§0.3 flag (data vs strategy):** the Oct 15/21 culls were sold as "the main fix for falling search traffic". Since then organic is down ~80% and Google impressions fell further. Correlation, not proof (Google was already near zero; Bing is the volume and Bing fell too), but the PIVOT's Nov 19 test (indexed > 3, organic 7 d > 48, returning > 6, clicks/100 clean ≥ 15.7) now reads **indexed 1 · organic 16 · returning 2 · clicks/100 clean 21/213 = 9.9** — **0 of 4**. The Nov 12 check should decide whether culled pages with Bing history come back; the CoS leans restore the ones that had Bing clicks.

## MILESTONES (R22 — one line per Wednesday read; the desk appends)

- **2026-11-09 (Mo attended; CSVs `Card Hub/epn/epn-byday-2026-10-26_2026-11-08.csv` + `epn-customid-…`, Oct 26–Nov 8, reconcile):** **157 clicks · 4 actions · $352.48 GMV · $10.58** — 97.4% from `pitch-black-vs-chaos-rising-13` (2 Pitch Black boxes). Trailing 30 ≈ **$11 = 3.7% of M0**. **105 of 157 clicks (`auctions` 66 + `deals` 39, Nov 5–8, 0 sales) read as automated** (GA4 human clicks 15 vs EPN 61 those days) → harness `ctx.route` eBay abort owed (Night Crew/Gate Keeper). n = 4 → no trend (R22). Read: `claude/cos/epn-read-2026-11-09.md`.

- **2026-11-04 (desk; Mo's exports `Card Hub/epn/epn-byday-2026-10-21_2026-11-03.csv` + `epn-customid-…`, Oct 21–Nov 3, files reconcile):** **48 clicks · 2 sales · $191.99 GMV · $5.76** (EPC $0.120; ex the $185 sale $0.0044). Both sales tagged: `pitch-black-vs-chaos-rising-13` (Pitch Black booster box, $5.55) and `fo99-5-tag` ($0.21). Trailing 30 ≈ **$6.88 = 2.3% of M0**. Clicks per 14 d still falling (79 → 58 → 48). n = 2 → no trend (R22). Read: `claude/cos/epn-read-2026-11-04.md`.

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
- **Nov 9 ~17:11–18:40 PT (CoS · desk, Mac-linked scheduled fire, unattended; first desk since Nov 6 — the new 17:11 slot from the Nov 9 attended sitting).** Freshness: HEAD `5e44c20` · origin/main `5e44c20` at clone · gates **0/57 · 0/4 · 0/1** vs base 0/56 · 0/4 · 0/1 (+1 prices WARN = `pokemon-tcg-2026.html` stamp 2026-10-19 crossed 21 days on the UTC date roll; no page touched). Read LANE-RULES (precedence, R1, R10 Am. 2–6, R39, R44–R47), STATE top + last 3 entries, NEEDS-MO, ideas LEDGER (tail). **Prompt drift (file wins):** `$HOME` clone impossible (`/sessions` 100% full, 0 B free) → clone + key copies under `/tmp/desk1110` (deleted at end) · STEP 3 vendor delivery dead text (R10 Am. 6) · STEP 1b grok-inbox copies are the 00:40 copy task's (COPY-LOG), the desk rules Ivan.
  **Inbox since the Nov 6 desk: 38 Project docs + 22 Mac files + 1 `awaiting-cos` + 3 unledgered IW proposals.** Ruled:
  - **IW Nov 9** → ledgered in `pipeline.json`: **-1** ND1E "unusual move" (67% a Shining Charizard #107 correction) → **queued** (b)+(c) Night Crew Wed Nov 11, (a) Price Truth · **-2** 1st Bowman page "median of 30 sales" (row cap) → **queued** AI-Search · **-3** Mbappé footer + unstamped asks → **queued** Conversion (with Ivan's "five lists four").
  - **`price-exceptions-2026-11-09`** (6 meta-tied Pokémon pages, 29–38 d) → **queued** Wed Nov 11 weekly; `-11-02` closed as superseded; a second miss → BLOCKED, Price Truth.
  - **Retention R24** ("what sold since the last read", McDonald's) → **parked**, gate = a freed BETS slot Nov 12–13 (CEO Desk's 2nd candidate), owner Drop; LEDGER row written. 0 rows left `proposed`.
  - **EPN read Nov 9** → **MILESTONES line applied** (R22). Automated-click finding (105/157 on `auctions`/`deals`) → Night Crew Wed + Gate Keeper (harness `ctx.route` eBay abort) — in `claude/handoffs/desk-2026-11-09-routes.md`.
  - **NFL board `c84aca3` + attended SV151 image `8bd7962`** → **applied**: owed pushLog entries written, both verified live (bytes = main). IndexNow ping for the NFL page not sent (board task disabled; declined as low-value).
  - **Class Ladder copy BOW13–23** (review Nov 7/8: desk Mon) → **not done, queued**: the Projects tool returns each 110–120 KB universe inline, so a "byte-exact" copy is an 11-file re-type (the error path COPY-LOG Oct 27 rejects). Route: Bowman KB agent writes the files to `Card Hub/desk-mirror/classes/` (byte-exact), the next desk copies; else the review's own fallback (Price Truth Mac push). Project-size prune of BOW09–12 waits on it.
  - **Ivan ×3 (Nov 6 review, Nov 8 Sunday walk, Nov 9 review)** → verified live where it could be a wrong number: home TH26 level reads 57.06 on 3 renders (flicker not reproduced → declined); `/pokemon-black-friday-2026` Charizard #4 PSA 10 −40% row not present (→ declined). The rest **routed** (handoff above): sealed buy strips on SS/CEL/JU1E index pages, "this week" durations, R9 "2026 Bowman 1st autos" summary + nav label, persona desk name, disclaimer/"6–12 month holds" footer line → Wed Nov 11 weekly (generators) · DLR guide stale "next read Nov 8" → Deal · ROY page stale after Nov 9 awards → Wildcard · Flagg green "No dated sale" → Conversion. Fanatics links vs R11 → not re-ruled (R6, declined Nov 2).
  - **Gengar log Nov 9** asks → "too new for graded marks" lines on 3 desks → Gengar next run, fallback Night Crew · what the desks do if E5 merges (target `/pokemon-cards` 404) → the Nov 11 E5 decision (routed).
  - **Night Crew log Nov 8 proposals 1–6** → ND1E (b) adopted (above); 2–6 **carried** to the Nov 10 16:35 review (not read in full this run — stated, not ruled).
  - **Attended Nov 9 sitting** (task fixes, Vercel retention, free-night list, DECADE-RULES, LOCAL-STACK-PLAN, bookmarks-cos) → read headers; Mo's own decisions, no desk action. Weekly scan Nov 9 (`ced2716`), Price Truth G67 `c3ca706`, Goal League Nov 7/9, Cupertino 8–10, NC deploy `55eb68a`, measure/traffic/heartbeat/x-daily/x-weekly Nov 7–9, KB addenda 11c, Studio brief + critic (tour stays unpublished), retention day file, daily reviews Nov 7/8 → read, no further desk action (R6). BOW13/BOW14 drafts → see class copy.
  - Mac: grok-inbox seeker/creator Nov 7, stalk Nov 7–9, Ivan Nov 8 walk → copied by the 00:40 task (COPY-LOG Nov 8/9) · editor Nov 9 + seo-aeo weekly Nov 9 → the Tue 00:40 copy · ivan-review Nov 6/9 → ruled above · grok-requests ×6 (lanes' asks) · EPN CSVs (MILESTONES) · x-images Nov 9 · youtube RECORD-FOR-MO → no ruling.
  **Commits:** this docs commit only (STATE + archive pass, NEEDS-MO, retention LEDGER, `pipeline.json`) — does not deploy. Competitor scan of `pipeline.json`: 0 new names.
  **Deliveries:** none (no vendor brief; R10 Am. 6).
  **Instruments:** feed day **Nov 9**, 41 cards, 37 numeric, 40 images · GA4 19:16Z Nov 9 (~7 h): KE yesterday **4 on 50** · organic KE7 **23.9%** vs blended 2.91% · returningShare7 1.1%, returning users 7 · clicks7 **35** · bots 81.7% (SG 520, CN 26) → clean 122 sessions / 35 KE (28.7/100; denominator still shrinking) · Mobile QA iPhone 13 (beacons/eBay aborted): 5/5 200, scrollWidth 390, 0 console errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **Ideas/retention:** no ideas file (Mon); retention R24 ruled, 0 unruled.
  **Stumbles:** (1) clone-path deviation; (2) a full inline `project_read` of the 110 KB BOW23 universe to test the copy path — cost without result; next time ask for the Mac mirror first; (3) COMC/Impact sign-in lines on NEEDS-MO carried without a browser re-check; (4) Night Crew proposals 2–6 not ruled.
- **Nov 9 ~08:00 PT (Night Crew deploy, Mac-linked scheduled fire, unattended).** Shipped Cupertino runs 8–10 (data tables §0e · card-page local nav with "Buy Raw on eBay" pill · "Set indices › <set>" breadcrumb) + Night Crew Nov 9 (McDonald's exclusion on 645 card pages via `--keep-robots`, robots 596/72 unchanged, 0 new pages · mover rule IW-1105-F2 · `/gold-star-index` 390 wrap · `signup_submit` + fallback-form `signup_page`). Both patches matched their recorded trees on `552c0a03`; applied clean on `c84aca3`. Regen: card-template --keep-robots, build-local-nav (36 written, --check 0), build-grails --bake. Gates 0/56 · 0/4 · 0/1 = base. Live check + detail: Project `claude/night-crew/log-2026-11-08.md`.
- **Nov 6 ~21:11–21:50 PT (CoS · desk, Mac-linked scheduled fire on the travel shift, unattended; first desk since Nov 4 — Thu's fire was auto-disabled `device_absent`, re-enabled 23:21 Nov 5).** Freshness: HEAD `4ab76bb` · origin/main `4ab76bb` at clone · gates **0/56 · 0/4 · 0/1** = base (Price Truth `4894387` / Site Sweep `8a56e3c`). Read LANE-RULES (precedence, R1, R44–R47), STATE top + last 3 entries, NEEDS-MO, ideas LEDGER (tail). **Prompt drift (file wins):** `$HOME` clone impossible again (`/sessions` 100% full, 12 MB free) → cloned under `/tmp/desk-016exk`, keys under `$HOME` (both deleted at end) · STEP 3 vendor delivery dead text (R10 Am. 6) · `npm i playwright@1` skipped (preinstalled).
  **Inbox since the Nov 4 desk: 26 Project docs + 3 Mac files + 0 `awaiting-cos` + 3 unledgered IW proposals.** Ruled:
  - **Heartbeat Nov 6 P0 "STATE over 25 KB, desk trims first"** → **applied** (Nov 4 weekly entry + Oct 30 MILESTONES line → archive, pass of 2026-11-06).
  - **IW Nov 5 (3 proposals, unledgered)** → ledgered in `pipeline.json`: **-1** sealed source label → applied by NC `ffa0b740`, verified live (meta + FAQ read "eBay and TCGplayer"); per-row date span rides Deal's sealed re-read · **-2** Mewtwo +114.8% mover → applied by Price Truth `4894387`, verified live (no Mewtwo on `/` movers) · **-3** `/bowman-bangers` lead/meta "all ten ranked on 30-day sales" → **applied this run `091a111`** (top five on the sold mark, the rest at the engine's ask; "1st Bowman Chrome autos").
  - **Goal League patches ×4 (Drop `c73c083`, Deal `6a9a8de`, Conversion `336b9d4`, AI-Search `74b21de`)** → the Commissioner's (22:26 tonight). Desk note routed in `claude/handoffs/desk-2026-11-06-routes.md`: Deal's gift guide stamps `data-prices-updated` Nov 6 but prints "read Nov 4"; DLR box/ETB differ between Drop ($210.00 n22 / $93.98 n24) and Deal ($209.99 n11 / $102.50 n11) — reconcile to one read before both ship (pricing integrity).
  - Daily reviews Nov 4/5/6, attended re-fires note, travel shift, measure Nov 5/6, heartbeats Nov 5/6, NC log Nov 5 (deployed `ffa0b74..114f722`), Site Sweep Nov 6 (`8a56e3c`, U-F19 → NC Wed), Coverage Builder run 1 (asks ruled by the Nov 6 review), BET-20261105-1 (market report live), x-daily Nov 5/6, KB audit logs/addenda 11b (Pokémon 🔴 0; Bowman G28 dated Nov 11; BOW14 held by Project size) → read, no further desk action (R6). BOW15 draft `universeComplete:false` → not copied (COPY-LOG Oct 27).
  - Mac: `grok-inbox/stalk-2026-11-05/06` → skipped (the 00:40 copy task carries them) · `dungeon-keeper/CHANGELOG` run 11 → read; proposals (j)(k) parked (R12/R13, secondary).
  **Commits:** `091a111` (site, deploys `bowman-bangers.html`; gates 0/56 · 0/4 · 0/1) + this docs commit (STATE, NEEDS-MO, pushLog liveVerified — does not deploy). Competitor scan of `pipeline.json`: 0 new names.
  **Deliveries:** none (no vendor brief; R10 Am. 6). Tuesday Tape still unsent (attended, by Mon Nov 9).
  **Instruments:** feed day **Nov 6**, 41 cards, 37 numeric, 40 images · GA4 16:25Z Nov 6 (~13 h): KE yesterday **4 on 110** · organic KE7 **32.1%** vs blended 1.96% · returningShare7 0.66%, returning users 5 · clicks7 **25** · bots 78.0% (SG 584, CN 30) → clean 173 sessions / 25 KE (14.45/100) · Mobile QA iPhone 13 (beacons/eBay aborted): 5/5 200, scrollWidth 390, 0 console errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5; Bangers hero shows the new line live.
  **Ideas/retention:** no ideas file (desk off since Oct 19); retention: no new file, 0 `proposed` rows.
  **Stumbles:** (1) clone-path deviation; (2) NEEDS-MO sign-in lines (EPN/COMC/Impact in Browser 1) carried without a browser re-check — Mo travelling, Mac browser not touched; the Mon Nov 9 desk re-checks.
- *(Pointers for R24 and the run history — which entry sits in which archive pass — moved whole to `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-04; the Nov 4 weekly entry, the Oct 30 EPN line and the expired Oct 26 freeze rule went there in the pass of 2026-11-06; the Nov 4 desk, Nov 6 Night Crew deploy and Nov 6 Commissioner entries and the Oct 29 NOW block (R44/R45 now live in LANE-RULES) in the pass of 2026-11-09.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
