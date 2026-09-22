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

## NOW — 2026-09-22

### The Wednesday build ran a day early (Mo, Sep 22 ~13:45 PT: "go ahead and do the wednesday build now")

**Tomorrow's scheduled Wednesday weekly (11:00) and the Wednesday build session: the build order below is
DONE or deliberately HELD. Do the Business Read, the audit and the Pricing Integrity weekly; verify the
items marked DONE on the live site; do not redo them.** Commits: `fff90e6` (eight rulings) · `ddc5466`
(API guard) · the build commit logged in the RUN LOG below.

| Item | State |
|---|---|
| `/api/comps` + `/api/auctions` open-proxy fix (P0) | **DONE `ddc5466`**, live-verified: anonymous 403, our pages 200 (headless render of three pages), tools 200 with `X-ShopCardHub-Client: tool`. `?raw=1` removed, q-mode `limit` ≤ 50, ACAO `*` removed, 60/min/IP on uncached browser calls. **LANE-RULES R17.** Watch: the 01:00 nightly engine run is the first under the guard — if `prices-latest.json` for 2026-09-23 is short or empty, the header is the first suspect. |
| eBay/EPN compliance posture (P0 item 3) | **READ, and it needs Mo.** Project doc `claude/cos/compliance-posture.md` — kept out of this public repo on purpose; the findings are not restated here. |
| Feed onto our own origin + repo private (P0 item 2) | **HELD for Mo's compliance ruling.** What the feed may contain at all (raw listing history, Browse-derived marks) is now the question; building the new origin first would be built twice. Spec stands: `claude/cos/feed-origin-and-repo-privacy-2026-09-20.md`. |
| R18 graded rule + prose gate (`iw-2026-09-17-4`) | **DONE.** `audit-prices` check 10 `graded-claim-unsourced` (WARN, one per page) + a scan of `data/calls.json` strings, negative-tested both ways. 16 pages carry the backlog (Flagg 15 figures, Ohtani 10, Mbappé 9, LeBron 8 …) — **this list IS the SCP graded sales-table pull's work order.** |
| `bb-2026-09-22-xboard-signal-source` | **DONE.** Verdict line outranks the Signal stat; SELL can never reach `currentSignal`; `data/x-board.json` regenerated (seats unchanged: HOLD HOLD PASS BUY PASS). |
| Stale price stamps (murakami, wnba, wembanyama) | **DONE — re-read, not rolled.** SCP dated solds read 2026-09-22 (sportscardspro.com via node `fetch`; curl 403s). Wemby base was published at "~$6", real ~$68; Optic RR is #225 not #218; WNBA's June auto/1-1 figures withdrawn, Reese PSA 10 → No verified sale, Reese is a 2024 RC; Murakami record $14,000 → $14,400 (Jun 23), Kanji $20,000 dated Jul 8 and identified (#BA-3), "redemption" claim dropped. |
| Idea #30 — `facts()` for `single` + slug the three star cards | **HELD for the compliance ruling** — it adds three more Browse-derived marks to public pages. The home.js guard stays. |
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

- **P0 — Mo's compliance ruling, then the feed/privacy work it decides.** See NEEDS-MO. Nothing that adds
  Browse-derived marks to public pages ships until he rules (idea #30 slugs held).
- **P0 — the SCP graded sales-table pull**, now with a work order: the 16 pages `audit-prices` check 10
  lists. Chrome/node-fetch path (sportscardspro.com 403s curl). Clears `audit-2026-09-07-4` and
  `audit-2026-09-02-2` back to applied.
- **P1 — Ending Soon: widen `/api/auctions` to each live index's top 5** (`desk:true`, never a slug, never a
  mark). Also a Browse expansion — **held with the P0 ruling.**
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

The eBay/EPN compliance ruling (opened 2026-09-22). Nothing else.

---

## RUN LOG (last 7 days; older entries in the archive)

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
