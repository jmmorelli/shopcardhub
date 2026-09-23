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

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-09-23 (GA4 nightly, window ends Sep 22; bots = SG 141 + CN 23 sessions)

1. **Earnings below M0; thin path into eBay.** ~$100/mo trailing (Sep 18 read) vs M0 $300. 44 outbound clicks/7d (buy-strip 7, buy-box 3) on ~203 clean sessions. Today's 14:00 desk EPN read (R22) writes the first Milestones line. *Doing:* nothing new ships that isn't Phase 2 or a live FAIL; R11 strips hold on every commercial page.
2. **Traffic is small and 45% bots.** 364 sessions/7d raw → ~203 clean. Organic search 134: Bing 77 · Yahoo 24 · **Google 19** · DDG 11. *Doing:* Bing is the channel; Google stays a links game (PB26 concentration link post drafted for Mo); zero GSC request spend.
3. **Retention flat; the return-user program is behind.** Returning 7d 3.8% raw / ~7.3% clean vs 7.5% baseline; `newsletter_signup` 0 since Sep 17; `track_card_from_page` **1**/7d (was 5). Return-user scorecard **2/14**, target B+ by Oct 26, and Phase 2 holds the build slot through Oct 14. **RULED by Mo Sep 23 ~11:45 PT: "compliance first"** — Phase 2 stays #1; return-user items (★ Track on Home first) follow the Sep 30 deliverable; the Nov 2 re-audit grades what exists.
Key-event rate: **organic 11.19% 7d / 7.03% 28d** beside blended 6.32% / 4.74%.

## WEEKLY — 2026-09-23 (CoS weekly, cloud, unattended) — detail `claude/cos/weekly-2026-09-23.md` (Project)

- **Scoreboard:** Img 9 · Mob 8 · Bugs 9 · Mot 8 · Vault 8 · Perf 8 · Id 8 · **Cred 7→8** (on deploy) · **Return-user 2/14**. Gates 0/76 · 0/3 · 0/5 (`--run-tests`; the +4 WARN are `scenario-skipped`).
- **PATCH PUSHED by the 14:00 desk (`6e69d39` site, `fa888f0` docs; trees matched; live-verified 21:19Z).** Was: `652523a` (cloud clone), tree `22c2dd1cfcf02fa25bbaf88fe21eb44cd230f0bb`, file `~/Projects/shopcardhub/Claude outputs/weekly-2026-09-23.patch` + Project `claude/handoffs/weekly-2026-09-23.patch.txt`. The weekly had no deploy key (the "Card Hub" folder was not connected). Desk: fresh clone → `git am` → tree hash match → gates → push → curl → IndexNow → **pushLog entry** → close this line. Contents: **R20 breach fixed** (BOW26 page was recomputing a new ask-derived level nightly; now capped at `heldSince` 2026-09-21, BCB26 held line, `indices.json` `heldSince`); **R17: `data/card-images.json` carried 430 raw eBay listing titles + 32 prices, publicly** — stripped, resolvers fixed; og/JSON-LD on 4 pages; release metas (Bowman Football Sep 30, Pristine Sep 24, Museum Oct 7); PF25 wiring on `/indices` + nav colour; "real time" X promises removed; bangers H2/badge.
- **Desk to rule:** `card-images.json` titles remain in `main`'s public git history (same class as the `price-data` scrub Mo ruled Sep 23; a `main` rewrite is a force-push — not done by the weekly).
- **Queued to the desk, in order:** Pristine body → release-day state (streets Sep 24); home signup copy; index-page "this board / sold comps only" signup line; `pokemon-tcg-2026` "Verdict: Buy singles" + a dated re-read of its six stale SIR figures; BCB26 "pre-activation" chip on `/bowman-chrome-baseball-2026`; Flagg "advanced buy"; Sep 22 correction's PSA 9 range (R18); Yamal "Buy." over a dispersion-gated card; R9 "1st Bowman" shorthand; home Screens "Signal" header → "Engine (asks)" until Phase 2 Oct 7; resolver keep-if-alive; `audit-comps` sealed false positives.
- **Not read:** GSC, Bing Webmaster, MailerLite — two Chrome browsers connected and the unattended session cannot pick one. The desk (Mac-bound) reads them. No production browser sweep (no GA4-realtime proof possible); full sweep ran on the offline harness: 104/104, 0 console errors, 0 overflow bar `/set-index-preview`; `/bowman-bangers` ≈51 phone screens.
- **Recap:** drafted, **not sent** (Tuesday digest went out Sep 22 — LANE-RULES interim rule).
- **Prompt drift (file wins):** the weekly prompt says SEND the recap, omits Phase 2 as build-order #1 (R21), and still carries the EPN read that R22 gave the desk. Fix the prompt at the Oct 1 roster review.

## NOW — 2026-09-23 (read this block first)

### Gap fixes (Mo in chat, ~10:45 PT: "fix 1-3 right now", fold in the EPN read, weekend cover, "do whatever needs double-checking")

| Item | State |
|---|---|
| **R20 — Phase 2 bridge.** Monday lane may not publish a new eBay-derived level; BCB26/BOW26 held with a dated "moving to sold basis" line; Pokémon indices (PriceCharting) re-mark as normal | **In force.** LANE-RULES R20. The Sep 28 Monday run is the first under it. |
| **Feed titles.** `/feed/prices-*.json` carried 40 eBay listing titles each | **Stripped** on main today + the nightly publish now strips them (`tools/ci/strip-feed-titles.mjs`). |
| **Repo privacy** | **Closed by Mo ~10:00 PT: "Scrub history, stay public"** (see Phase 1 below). Nothing pending — the lane-access click is withdrawn. |
| **R21 — Phase 2 owner + dates.** CoS · weekly; build-order #1 | Sep 30 BCB26/BOW26 on solds · Oct 7 every public mark on solds · Oct 14 `ask-basis-mark` gate + Phase 3. Desk checks the date Thursdays. |
| **R22 — EPN money read** | Desk, **every Wednesday**, Mo's Chrome → STATE *Milestones* line + `claude/cos/epn-read-<date>.md`. **First read: today's 14:00 desk.** Oct 21 read = the `-case`/`-ag` link verdict. |
| **R23 — weekend cover** | Sunday run acts on X Desk Watch's Sat+Sun filings first. |
| **R24 — independent checks** | `.github/workflows/site-gates.yml`: three gates on every site push + daily 08:30 PT (weekends too) + live-feed freshness + desk heartbeat → one `gate-watch` issue the desk closes. |
| "Chief of staff sunday" schedule | **Fixed** — reads Sun 14:00 PT only (verified in the scheduled-task list Sep 23). NEEDS-MO item closed. |
| **Bowman Football cheaper offers** ($42.97 blaster, $79.99 mega on the investor page) | **APPROVED by Mo Sep 23: "I do not disagree. Go ahead."** Offers stay; both verified live on `/bowman-football` Sep 23. Oct 3 re-read (scheduled one-off, 09:00 PT) reads the key-event rate against the 1.1% baseline. |
| Mo not concerned (Sep 23) | COMC sales tracking (side hustle), Card Dungeon + `/api/decisions` token (after the site earns). Do not re-raise. |

### Vendor (desk, Sep 23)

- **Posting window re-baselined: 10:00 ±10 PT weekdays from Thu Sep 24** (vendor's own number, after four misses of 09:00 ±10). X Desk Watch grades against 10:00 from tomorrow.
- **Reply targeting rule delivered and locked** (X Desk Watch proposal Part 1): ~1K–20K-follower hobby accounts, post < 60 min, < 20 replies; big accounts only within ~15 min; reply-backs same day (thanks/emoji = silence); ~5/day at irregular times; read the post first.
- **X Voice lane (proposal Part 2): ADAPTED — a desk-owned role, not a new scheduled lane.** No new fire (Sep 21 cadence rule: a new lane names a lane it replaces). The desk keeps the §0.1 reply gate; the voice file `claude/cos/x-voice.md` (Project) is seeded at the Mon Sep 28 desk from Mo's kept/deleted pairs and refreshed each Monday; X Desk Watch stays the independent auditor and adds reply-view ÷ parent-view and reply-back to its read. Number: reply-back rate (baseline 2/7, 29%). Review Oct 23: keep, change or give it its own fire.

### Milestones (R22 — one line per Wednesday read)

- 2026-09-18 (by hand): Sep 4–17 $37.98 on 94 clicks; trailing ~$100/mo → **below M0**.
- 2026-09-23 (desk, R22): **not read, EPN signed out** in Browser 1 (partner.ebay.com → login). One NEEDS-MO line. Rung unchanged: below M0.

## NOW — 2026-09-22

### The Wednesday build ran a day early (Mo, Sep 22 ~13:45 PT: "go ahead and do the wednesday build now")

**Tomorrow's scheduled Wednesday weekly (11:00) and the Wednesday build session: the build order below is
DONE or deliberately HELD. Do the Business Read, the audit and the Pricing Integrity weekly; verify the
items marked DONE on the live site; do not redo them.** Commits: `fff90e6` (eight rulings) · `ddc5466`
(API guard) · the build commit logged in the RUN LOG below.

| Item | State |
|---|---|
| `/api/comps` + `/api/auctions` open-proxy fix (P0) | **DONE `ddc5466`**, live-verified: anonymous 403, our pages 200 (headless render of three pages), tools 200 with `X-ShopCardHub-Client: tool`. `?raw=1` removed, q-mode `limit` ≤ 50, ACAO `*` removed, 60/min/IP on uncached browser calls. **LANE-RULES R17.** Watch: the 01:00 nightly engine run is the first under the guard — if `prices-latest.json` for 2026-09-23 is short or empty, the header is the first suspect. |
| eBay/EPN compliance posture (P0 item 3) | **RULED by Mo 2026-09-22 ~14:15 PT:** approved (1) raw listing content off the public repo + repo private, (2) move every published mark/index/signal to non-eBay sold data, eBay shown only as live listings with buy links, (4) disclosure + privacy-notice audit. **No contact with eBay/EPN — do not propose it again.** Plan: Project doc `claude/cos/compliance-posture.md`. |
| Feed onto our own origin + repo private (P0 item 2) | **APPROVED (Mo, Sep 22) — Phase 1 of the compliance program; see OPEN ITEMS.** Was held for the ruling: What the feed may contain at all (raw listing history, Browse-derived marks) is now the question; building the new origin first would be built twice. Spec stands: `claude/cos/feed-origin-and-repo-privacy-2026-09-20.md`. |
| R18 graded rule + prose gate (`iw-2026-09-17-4`) | **DONE.** `audit-prices` check 10 `graded-claim-unsourced` (WARN, one per page) + a scan of `data/calls.json` strings, negative-tested both ways. 16 pages carry the backlog (Flagg 15 figures, Ohtani 10, Mbappé 9, LeBron 8 …) — **this list IS the SCP graded sales-table pull's work order.** |
| `bb-2026-09-22-xboard-signal-source` | **DONE.** Verdict line outranks the Signal stat; SELL can never reach `currentSignal`; `data/x-board.json` regenerated (seats unchanged: HOLD HOLD PASS BUY PASS). |
| Stale price stamps (murakami, wnba, wembanyama) | **DONE — re-read, not rolled.** SCP dated solds read 2026-09-22 (sportscardspro.com via node `fetch`; curl 403s). Wemby base was published at "~$6", real ~$68; Optic RR is #225 not #218; WNBA's June auto/1-1 figures withdrawn, Reese PSA 10 → No verified sale, Reese is a 2024 RC; Murakami record $14,000 → $14,400 (Jun 23), Kanji $20,000 dated Jul 8 and identified (#BA-3), "redemption" claim dropped. |
| Idea #30 — `facts()` for `single` + slug the three star cards | **DECLINED under the Sep 22 ruling** — no new Browse-derived marks on public pages. The three cards come back only as sold-basis marks in Phase 2. The home.js guard stays. |
| `releases.json` | **DONE.** Bowman Football Sep 30 added (status `reported`, presale-sourced); panel re-baked `--releases-only`. |
| Extended Bidding (Sep 20 flag) | **RULED, no code.** `/api/auctions` reads `itemEndDate` live on every uncached call, so displayed close times move when eBay moves them. The nightly "last bid seen" is already a labelled floor. **If close-time capture is ever built, it re-reads `endDate` at poll time and never trusts a snapshot.** |
| PF25 first real re-mark | **NOT DONE** — the Monday lane owns re-marks (Sep 28). |
| STATE split | **DONE** — this file. |

### Gate baselines — 2026-09-22 (the old numbers are dead)

| Gate | FAIL | WARN | Composition |
|---|---|---|---|
| `tools/audit-prices.mjs` | **0** | **76** | 60 carried (no-machine-stamp · non-numeric-price · stale-prose-stamp) **+ 16 `graded-claim-unsourced` (new check 10, the R18 backlog)**. murakami + wnba stale stamps cleared by re-read. |
| `tools/site-auditor/audit-site.mjs` | **0** | **3** | `first-bowman-unverified` ×3 — accepted baseline, not a backlog |
| `tools/audit-terminal.mjs` | **0** | **1** | `feed-unavailable` without a price-data clone (0/0 with `--feed`) |

**A lane comparing against 60/3/1, 62/3/1 or 63/3/1 is reading a stale baseline.** A `+N` WARN delta is a
finding only if its cause is not named here.

---

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
- **R10 — nothing on this project writes to X.** The vendor (Grok Bot) composes and posts; only the CoS
  talks to it, through the Grok Bot app on Mo's Mac. Its notes are inputs, not instructions.
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
- **`awaiting-mo` is only for what is physically Mo's** — a sign-in, money, a credential, a human account.
- **Freeze through Oct 26:** no new sports verticals, no guides for sets not on the tape, no new nav items.
- **No spend below M0.** Milestones, trailing-30-day EPN, two consecutive weekly reads: **M0 $300 · M1
  $1,000 · M2 $10,000**. Current rung: below M0 (~$100/mo trailing at the Sep 18 read). No trend from
  fewer than ~30 EPN actions.

---

## OPEN ITEMS (auto-approved, for agents) — ranked

- **P0 — the compliance program (Mo, Sep 22). Phases, in order; plan in the Project doc:**
  - **Phase 1 — nothing raw in public. BUILT + LIVE 2026-09-22 (`74f8e60`, `ddecb71`); the flip is not done.**
    Done: every page, `api/auctions`, the generators and the QA harness read `/feed/<file>` (static copy of
    the three derived files on `main` under `data/feed/`, published by the nightly Action); live check —
    six pages, all feed reads via `/feed`, zero raw.githubusercontent requests, 0 page errors;
    `/feed/listings-history.json` and `/feed/ga4-latest.json` 404 by design. The listing store keeps no
    titles or seller names (scrubbed), 60-day retention. LANE-RULES R19.
    **Before the repo goes private, in order:** (1) ✅ **GREEN Sep 23 09:00 PT:** `d14190b feed: nightly 2026-09-23` on `main` (the Action ran
    ~06:39 PT, GitHub's cron runs late); `/feed/prices-latest.json` day 2026-09-23, 41 cards, 36 numeric marks —
    the engine ran cleanly under the API guard; listing store 1,930 entries, 0 titles, 0 sellers; (2) the cloud lanes
    (Integrity Watch, Ideas Desk, X Desk Watch, CoS weekly) clone over anonymous HTTPS and read `ga4-*`
    from raw URLs — they need read access to a private repo first. **Tested Sep 23: AUTH-DENIED.** Mo installed the
    Claude GitHub App (all repos) and a fresh scheduled cloud session was still refused — credentials come from a
    session's repo "sources", which scheduled tasks here do not get.
    **RULED by Mo Sep 23 ~10:00 PT: "Scrub history, stay public."** Done: `price-data` squashed to one commit
    (`6cd29fc`, force-with-lease on `089f44f`), today's files byte-identical — the 105 earlier snapshots that held
    listing titles and seller names are unreachable from any branch. Caveat: GitHub keeps unreachable objects
    until its own garbage collection, so an old commit is fetchable only by someone holding its exact hash. The
    repo stays public; going private is off the table unless the lanes move to the Mac.
    **Found on the way, separate:** the `GITHUB_TOKEN` in Vercel no longer reads the repo — `/api/decisions`
    answers "store read failed", so dungeon decisions and track-signal writes are failing silently. The
    Dungeon is secondary (R12); fix only if track-signals turns out to matter to a live surface.
  - **Phase 2 — marks on sold data.** Every published mark, index level and signal moves to non-eBay dated
    solds (SCP/PriceCharting, the path the football shelf and the Sep 22 re-reads already use). BCB26/BOW26
    and the nightly engine signals are the big ones. eBay stays as live listings with buy links only.
  - **Phase 3 — disclosure + privacy notice** audit (EPN disclosure next to link blocks, visible on a phone;
    privacy notice names EPN tracking/cookies). CoS-owned, small.
  - **Standing:** no new Browse-derived mark on any public page from today. Agents work from derived numbers,
    not raw listing payloads.
- **P0 — the SCP graded sales-table pull**, now with a work order: the 16 pages `audit-prices` check 10
  lists. **First page: `/lebron-james-cards` (`iw-2026-09-21-1`, FAIL — three graded figures published as
  "recent sold comps" 43 days stale on an AG page; queued to the Sep 23 weekly by the desk).** Chrome/node-fetch path (sportscardspro.com 403s curl). Clears `audit-2026-09-07-4` and
  `audit-2026-09-02-2` back to applied.
- **P1 — Tuesday board lane, Sep 29 (X Desk Watch side finding, desk-ruled Sep 23):** `og/x/board-latest.png` carries an "ENGINE ASK" column beside the sold marks. Under R20 an ask appears only as a live listing with a buy link, never as a mark. **Drop the column or relabel it "asks from $X · N live"** on the Sep 29 tape. The Sep 22 image is labelled as an ask and is not retroactively false.
- **P1 — `topps-pristine-basketball` release-day flip (Thu Sep 24 desk):** body still reads "Pre-orders open Aug 25 … config TBA". Verify the street date and box config against a named source, then flip the hero and rarity strip. Do not flip on the meta date alone.
- **Content Editor queue (from the Sep 23 weekly), desk Thu/Fri in the weekly's order:** home signup copy · index "this board / sold comps only" signup line · `pokemon-tcg-2026` "Verdict: Buy singles" + dated re-read · BCB26 "pre-activation" chip · Flagg "advanced buy" · stale dates · graded range in the Sep 22 correction (R18) · hidden stale block · R9 "1st Bowman" shorthand. Each is verified live before the edit (R5).
- **P1 — Ending Soon: widen `/api/auctions` to each live index's top 5** (`desk:true`, never a slug, never a
  mark). Live listings only — allowed under the Sep 22 ruling; after Phase 1.
- **P1 — the 31 `no-machine-stamp` pages**, oldest-traffic first. Re-read before stamping.
- **P1 — engine block on a phone:** collapse the band to cells with a value; fold listings behind "Show
  listings" (Mewtwo block is 1,969 px on a phone).
- **P1 — Terminal step 5** (`rooms/terminal.md`): bowman-bangers phone length, `build-auctions.mjs` must
  keep the rail/shell wrapper, 11 host-less `/card-*` pages fold-or-301.
- **P1 — SV151 rebuild** against `claude/cos/sector-index-rulebook-2026-09-15.md`, clean medians at
  inception. Not live; nothing to restate. The 151 Reddit post stays held until it is.
- **P1 — football:** re-read `/bowman-football` key-event rate ~Oct 3 against 1.1% (the $42.97/$79.99
  offers are the test); decide a cadence for `tools/football-solds.mjs`; a football index only once 2026
  Bowman Football prints solds mid-October.
- **P1 — `aiva-arquette-1st-bowman` prose re-read** (its stale-prose-stamp WARN).
- **P2 — `data/releases.json` every Monday re-bake:** prune past rows, add dated rows only from a named source.
- **P2:** phase 2 of the index/guide merge; `/set-index-preview`
  overflow; retire `tools/price-engine/newsletter.mjs`; Vault `prompt()` → modal; the unattributed
  "Chrome #251 PSA 10 at $2,075" in the Flagg blurb (now caught by check 10).
- **Case (`-case`) and AG (`-ag`) links — kill criteria at the Oct 21 EPN read:** `-case` 0 actions on ≥ 20
  clicks or < 5% of sealed clicks → remove; `-ag` fewer actions per click than plain IDs on ≥ 30 clicks → revert.
- **Oct 1 roster review:** commit `CHARTER.md` to the repo (still Project-only); re-ask folding the Sunday
  lane into the Wednesday weekly.

## WAITING ON MO — see `NEEDS-MO.md`

**Nothing (Sep 23).** The repo-access click is withdrawn (repo stays public, Mo) and the Sunday task's schedule is fixed. Only standing item: if EPN is signed out on a Wednesday, R22 files one line.

---

## RUN LOG (last 7 days; older entries in the archive)

- **Sep 23 14:08–~14:55 PT (CoS · desk, Mac-linked; interrupted after the vendor delivery by a bridge disconnect, resumed when Mo said "try this task again").**
  HEAD `e32c958` · origin/main `e32c958` at start · gates **0/76 · 0/3 · 0/0** (`--feed data/feed`) = the Sep 22 baseline on the pushed tree. Read LANE-RULES R1–R24 from a fresh deploy-key clone. **The desk prompt is stale on three points, and LANE-RULES wins:** it reads the feed from raw.githubusercontent (R19: `/feed/`), it names no R22 EPN read on Wednesdays, and it names no `gate-watch` issue check (R24). Open `gate-watch` issues: **0**. Heartbeat (`--since 2026-09-22`): 3 due, 0 missing.
  **Inbox (since Sep 22 15:00 PT), 12 items, all ruled:**
  *Project:* `weekly-2026-09-23` + `handoffs/weekly-2026-09-23.patch.txt` → **applied**: patch moved to `Card Hub/deploy/`, `git am` on a fresh clone, both trees matched the weekly's stated hashes, gates at baseline, **pushed `6e69d39` (deploys) + `fa888f0` (docs)**, live md5 matched on 4 pages, IndexNow 79 → 200. Weekly's queued items: Content Editor list → **queued** to the Thu/Fri desk (OPEN ITEMS); Pristine body → **queued** to the Thu desk (the basketball page still says "pre-orders open Aug 25", so the street date is verified first); **`card-images.json` titles in `main` history → declined**: rewriting `main` force-pushes the deploy branch and orphans every sha cited across STATE, pipeline.json, calls.json and the ledger. The store held listing titles and prices but no seller names, and it is off the live site as of `6e69d39`. Mo can overrule with one word. `reaudit-log` → read (weekly's own). `x-desk-watch-run-2026-09-23-1300` → read; 0 vendor FAILs; its pipeline lines **applied** to `agents.grok.actions`; its cadence item **applied** (re-baselined, below); its ENGINE ASK side finding → **queued** to the Tuesday lane Sep 29 (OPEN ITEMS). `x-desk-watch-2026-09-23-proposal-x-voice-lane` → Part 1 **applied** (delivered); Part 2 **adapted** (NOW › Vendor). `github-access-test-2026-09-23` → already ruled in the Sep 23 10:05 entry.
  *Mac folder:* `x-desk/watch-2026-09-23.md` + `scorecard.md` → same content as the Project filing; `vendor-brief-2026-09-23-morning-readiness.DELIVERED` and `…-no-reply-justin.DELIVERED` → already delivered (Mo sent the second at 10:40); `vendor-brief-2026-09-22-reply-backs….DELIVERED` → already recorded; `card-hub-agent-map-2026-09-23.pdf` → Mo's session artifact, no action; `chief-of-staff/*-mirror-*` → mirrors. *Pipeline:* 0 `awaiting-cos`, 0 `awaiting-mo`.
  **Janitorial:** pipeline.json carried the owner's email address in one 2026-09-03 decision line (R12 redaction breach, pre-existing). Redacted this run. The scan found no other handles or emails, and no competitor names. PriceCharting and SportsCardsPro are our named sources.
  **Delivery (Grok Bot app, 14:20–14:23 PT):** (1) the Wednesday outbound batch, which arrived 12:16 with a "silent past ~2:15 PM → I post" cutoff. Graded at 14:20, after the cutoff: `reply-voice-check --pairs` passed all 5 mechanically; stranger test gave post ×4 and change ×1 (#2 asked "who did you pull" when the post may already show it; the note said to ask about the /250). **Vendor, verbatim:** *"None of the five went out yet — cutoff hit with no timeout ship. Shipping now: 1, 3, 4, 5 as written; 2 rewritten to the /250."* (2) Direction: posting window, dated price figures, reply targeting. **Vendor, verbatim:** *"(A) 10:00±10 PT from tomorrow — grading window; cron moves to land inside it. (B) and (C) locked."* The desk did not open X. The R16 gate did not come off: one change this batch.
  **Instruments:** `/feed/prices-latest.json` day 2026-09-23, 41 cards, 36 numeric `last`, 40 `image.url`, 0 titles, HOLD 30 / SELL 9 / BUY 2. `ga4-latest` 13:55Z (7.7 h): KE yesterday **8 on 30 sessions**; organic KE7 **11.19%** vs blended 6.32%; returningShare7 3.8%; clicks7 44 (buy-strip 7, buy-box 3); bots: botShare7 **44.69%** (Singapore 141 @ 0.147 s, China 23 @ 0.138 s); clean KE/100 sessions 19.21 vs raw 10.63. Mobile QA (iPhone 13, beacons aborted): / · /watchlist · /bowman-bangers · /destined-rivals-index · /cooper-flagg-rookie-cards all 200, no overflow, 0 console errors, photos 100% once lazy images are scrolled in (home has no photos at rest, as known). `/bowman-bangers` is 42,674 px on a phone (open P1). **EPN (R22): signed out; not read.** NEEDS-MO line.
  **Stumbles:** a first QA pass read photos at 40% / 21% / 40% without scrolling. Lazy-load, not breakage; re-run with scroll: 100%. The bridge dropped after the vendor delivery, and the run resumed from the surviving clone. Mo was asked once which Chrome to use (two connected).
  **Pushed:** `6e69d39`, `fa888f0`, plus this docs commit (pipeline.json + STATE + NEEDS-MO; no deploy).

- **Sep 23 11:05–~12:45 PT (CoS · weekly, cloud, unattended)** — see WEEKLY above. Patch `652523a` built and gated (0/76 · 0/3 · 0/5), handed to the 14:00 desk to push; recap drafted not sent; 4 roster agents spawned (Terminal Product, Perf & SEO + Release Watch, Content Editor, Photo Keeper + Pricing Integrity); 0 `awaiting-cos` in pipeline.

- **Sep 23 ~10:40–11:00 PT (CoS, Mac-linked, Mo in chat)** — agent/schedule gap analysis → LANE-RULES R20–R24,
  feed titles stripped, `site-gates.yml` added, STATE/NEEDS-MO updated. Gates on the pushed tree: audit-prices 0 FAIL ·
  audit-site 0/3 · audit-terminal 0/0 with `--feed data/feed`. Map of every run: `Card Hub/card-hub-agent-map-2026-09-23.pdf`.

- **Sep 23 ~10:05 PT (CoS)** — Phase 1 closed as "scrub, stay public" (Mo): `price-data` history reset to `6cd29fc`; nightly feed publish verified (`d14190b`); cloud-lane repo auth tested and denied (`claude/cos/github-access-test-2026-09-23.md`).

- **Sep 22 14:08–15:0x PT (CoS · desk, first run, Mac-linked, unattended).** HEAD `e87980e` · origin/main
  `e87980e` at start (another CoS session pushed `74f8e60`, `ddecb71`, `263bf17` during the run — fetch+rebase
  before every push, no force) · gates 0/76 · 0/3 · 0/1 = the Sep 22 baseline, on both pushed trees. Read
  LANE-RULES R1–R19 from a fresh deploy-key clone; **the desk prompt is the stale copy on two points and the
  file wins:** X Desk Watch is daily 13:00 (not 13:30/17:30), and the vendor brief for the desk to deliver
  was a pipeline ruling (`bb-2026-09-22-psa10-correction`), not an `x-desk/vendor-brief-<date>.md`.
  **Inbox (since Sep 21 15:00 PT), 16 items, every one ruled:**
  *Project:* `x-desk-watch-run-2026-09-22-1300` → its G-note delivered (below); `x-desk-watch-2026-09-22-
  needs-mo-block` → agreed, not a Mo item, handled through the vendor channel; `vendor-brief-2026-09-22-reply-
  gate`, `buy-strip-product-guard`, `epn-fragment-fix`, `compliance-posture` → CoS-authored today, read, no
  action; `ideas/2026-09-22` → #36 already live (`0a25121`), flags 1–2 already closed, **#37 adopted and
  shipped `41ce931`** (supply re-measured with a guard: 29 clean single-box asks $375–$500; live "ask from
  $375.00 · 48 live"; `-hero` is the R14 control; kill Oct 21); `integrity-watch-2026-09-21` + proposals —
  **never entered the ledger; entered and ruled now:** F2 home "sold comps only" ×3 and F3 Messi "live eBay
  sold comps" ×3 **applied `585028e`** (reproduced live 21:13Z first, live-verified 21:35Z); F1 LeBron graded
  figures as "recent sold comps" **accepted, queued to the Wednesday weekly (Sep 23 11:00)** as the first page
  of the graded sales-table work order — a re-read, not a strip. *Mac folder:* three `x-desk/vendor-brief-2026-
  09-21-*.DELIVERED` → already delivered; `x-desk/watch-2026-09-22.md` + `scorecard.md` → read, same content
  as the Project filing; `digests/digest-2026-09-22.md` + `calls-2026-09-22-tuesday-regrade.json` → Tuesday
  lane's own (digest sent `2d374ff`; calls re-grade left for the Monday lane, projections immutable);
  `chief-of-staff/ledger-mirror-2026-09-22.md` → mirror, refreshed. *Pipeline `awaiting-cos` (5) + 1
  `awaiting-mo`:* `update-series-page-2026-09-14` declined for now (no street date; freeze); `kim-unrankable-
  clock` closed by the Sep 17 gate + carried-quote tier, verified live; `friday-2026-09-18-build-home-th26`
  closed, verified (audit-site 0 FAIL on /, build-home exits 2); `xbi-2026-09-21-1` applied by `a520a87`,
  verified live; `xbi-2026-09-21-2` ratified/closed (guarded feed live, asOf Sep 22); `trader-2026-09-10`
  closed under R13. **Heartbeat** (`lane-heartbeat --since 2026-09-21`): 4 due, 1 missing = Sep 21 X Desk
  Watch, already diagnosed under R15 (cron moved after its slot); `list_triggers` confirms the task fired
  today 13:02 PT under its corrected name. **Not new.**
  **Delivery:** psa10 correction sent to the vendor through the Grok Bot app 14:30 PT — three points (Holliday
  $720 struck, SELL is not a call, read `asOf` before a Tuesday board post) plus the Fischer Sep 29 angle;
  direction only, no copy. **Vendor, verbatim:** *"Board of record replaced: Deleted 2102448980261282140.
  Live: https://x.com/shopcardhub/status/2102511217290133853. Sep 22 tape + replace note + BUY/HOLD/PASS/WATCH
  (no SELL) + Kim #5 PASS + board-latest.png. Wed W1' still locked for 09:00±10."* Tomorrow's 13:00 watch
  grades the replacement; the desk did not open X. **Stumble:** the app's composer sends on newline, so the
  note landed as four messages, and the closing line ("One line back when the replacement is up") sits
  unsent in the Grok Bot composer — the tool would not press send for me. Harmless; Mo can clear it.
  **Instruments:** `prices-latest` day 2026-09-22 (13:25Z — the last nightly BEFORE the R17 guard; tomorrow's
  is the first under it), 41 cards, 36 numeric `last`, 40 `image.url`, HOLD 29 / SELL 10 / BUY 2. `ga4-latest`
  13:43Z (7.5 h): KE yesterday **1 on 38 sessions** (not zero, no FAIL, but the lowest settled day since the
  Sep 18 restart — watch); organic KE7 **9.72%** beside blended 5.04%; returningShare7 4.31%; clicks7 42;
  bots: botShare7 **42.15%** (Singapore 137 @ 0.151 s, China 24 @ 0.23 s), clean KE/session 14.03 vs raw
  8.12. Mobile QA (iPhone 13, headless, after the Phase 1 deploy): / · /watchlist · /bowman-bangers ·
  /destined-rivals-index · /cooper-flagg-rookie-cards · /nfl-rookie-cards-2026 all 200, no overflow, 0
  console errors, photos 100%; `/bowman-bangers` is 42,706 px tall on a phone (the open P1).
  **Schedule fault found, needs Mo:** the "Chief of staff sunday" task's cron still reads Sun/Tue/Thu 17:00 PT
  (`0 17 * * 0,2,4`) — it fires again tonight. The desk tried to set it to Sunday-only and the write was
  refused (scheduled-task writes are gated for this session). In NEEDS-MO.
  **Pushed:** `585028e` (home + messi), `41ce931` (NFL strip), plus the docs commit below (no deploy).

- **Sep 22 ~14:20–15:00 PT (CoS, Mac-linked, Mo: "perfect. start it.")** — compliance Phase 1 built. First cut
  (`74f8e60`) served the feed through an API function on Vercel's GITHUB_TOKEN; live it fell back to the public
  URL every time — the token is dead. Re-cut to option (a) (`ddecb71`): the nightly Action copies three derived
  files onto `main` (`data/feed/`), seeded today. Listing store scrubbed of titles/sellers. Live-verified.
  Mo ruled no contact with eBay/EPN (`e87980e`). Gates 0/76 · 0/3 · 0/1.

- **Sep 22 ~14:00–15:30 PT (CoS, Mac-linked, Mo in chat: "go ahead and do the wednesday build now")** — see
  NOW above. Compliance brief read by a research agent from the live agreements (API License Agreement
  effective Sept 3 2025; EPN Network Agreement Jan 22 2026), key clauses re-verified by the CoS against the
  downloaded text before anything was ruled on. Price re-reads by a second agent, applied by the CoS.
  Details of what the brief found live in the Project doc only, not in this public repo.
- **Sep 22 ~13:30 PT (CoS, Mac-linked)** — the Tuesday board lane's eight filings ruled (`fff90e6`):
  applied `terminal-api-contract-fp` (audit-terminal reads `+` continuation lines; standing FAIL on
  pokemon-30th:1011 cleared), `psa10-correction` (vendor note via the 14:00 desk), `home-single-link-guard`;
  approved `graded-source-rule`, `xboard-signal-source`, `stale-price-stamps`; declined `pierce-watch-tier`
  (stays tracked) and `coach-note-stale` (**coachNotes retired as a weekly duty**).
- **Sep 22 11:24 PT (Tuesday board lane, `a520a87`)** — Fischer +4.2% and 8 days dark, Gonzales asks
  −15.4%, **Holliday's $720 PSA 10 struck** (a guide estimate wearing a PSA 9's date). The vendor had posted
  the old tape at 10:24; X Desk Watch 13:03 graded it PASS-at-post-time and drafted the correction.
- **Sep 21** — the cadence cut (36 → 19 cloud fires/week; `vercel-ignore.sh`; dead Vercel cron removed;
  MWF auditor and Tue/Thu checkpoints retired); CoS · desk created (weekdays 14:00, Mac-linked; the 06:00
  daily deleted); Monday filing executed `2378ba7`; idea #30 started `b84272e`; vendor brief delivered;
  GSC baseline confirmed (3 indexed / 99 not — Google is 4% of search; zero indexing-request spend).
  Full entries in the archive.
- **Sep 20** — ideas #32 (sealed-case links, 13 of 26 pages) and #33 (Authenticity Guarantee links, 4
  pages) shipped `7d0f85f`; GA4 bot filter shipped; exposure audit (public repo, open proxy). Archive.
- **Sep 19** — football shelf rebuilt on sold comps `c0398f9`; homepage rework `95c9335`; x-board handoff
  URLs live `3aeef18`. Archive.
- **Sep 18** — Friday push (board re-seat `0d9ae49`, 30th engine blocks `486c246`); PF25 built `2f8ef53`;
  keyless GA4 nightly; calls.json corrections; EPN read ($37.98 Sep 4–17). Archive.

## ROSTER (current)

Cloud: CoS · desk (weekdays 14:00) · CoS weekly (Wed 11:00) · Integrity Watch (Mon + Thu 05:00) · Earnings
Ideas Desk (Tue + Fri 04:15) · X Desk Watch (daily 13:00) · monthly roster review (1st). Desktop (Mo edits):
Sunday brief · Monday price lane · Tuesday board · Thursday trader · Friday release window (off unless
flipped) · Dungeon Keeper. Retired Sep 21: MWF site auditor, Tue/Thu checkpoints, Gengar coverage task,
06:00 cloud daily.
