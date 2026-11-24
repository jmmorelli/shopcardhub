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

## NOW — 2026-11-24 (CoS desk, Mon Nov 23 evening slot): docs-only; price lane Nov 23 NOW line written for it (below); `price-exceptions-2026-11-23` awaiting-cos → queued (O-91, as the intake ruled); Ivan's three late files (Nov 20, 22, 23) ruled — Ivan delivered, so N-04 re-brief is likely moot. Gates 0/66 · 0/3 · 0/1 (= base). Before that: 2026-11-21 (CoS desk, Fri Nov 20 slot): O-74 STATE trim, two review-vs-ledger conflicts ruled.

**Monday price lane, Nov 23 (written by the desk; the lane may not write STATE):** chase six re-marked from sold prices (PB26 50.54 · CR26 30.47 · AH26 52.56 · PRIS25 58.45 · DR25 46.80 · PF25 57.44; all six fell); lane push refused (2nd Monday, O-25 j) → mailbox → **live `450dc8b`** via the Ship Desk fire 12:23 PT. Six worth-page title prices filed a 4th week → O-91. DLR26 still PRE with an empty basket 17 days after street (O-25 k). Fischer finalize → O-27 (Tuesday board Nov 24).

## TOP 3 PROBLEMS IN THE BUSINESS — weekly read 2026-11-18 (Chrome Browser 1 read: GSC via `/u/1/` = shopcardhub@gmail.com, MailerLite live; GA4 from the nightly snapshot, data day Nov 17, 17:39Z; Bing from the API snapshot, 4 weeks to Nov 13 — Bing Webmaster is signed out in Browser 1; EPN not read — the desk's Wednesday read, R22)

1. **Money is still ~$0, and the Black Friday money page is 29 days stale.** EPN trailing 30 d ≈ **$11 = 3.7% of M0** (last read Nov 9; no newer CSV). GA4 outbound `click` **56 / 7 d** (45), buy strips **2**, card pages **2 clicks on 24 views**. `/best-hobby-boxes-2026` — #2 landing page (20 / 7 d) and #2 Bing page (330 impr, 14 clicks, pos 4.3) — still prints medians **read Oct 20**, nine days before Black Friday (Nov 27); `data/boxes.json` has had **no owner** since the Box Desk lane was never created. *Doing:* ruled to the Monday price lane **Nov 23, first item (P0)**; the weekly never changes prices.
2. **Search is one seasonal page, and AI assistants now out-convert it.** Organic sessions **59 / 7 d** (71); **organic key-event rate 16.95%** beside blended **6.14%** (28 d: 17.49% vs 3.27%). `/mcdonalds-pokemon-cards-2026` = **55** of the week's landings at 29% KE (Bing: 2,050 impr, 43 clicks, pos 6.8); the promo ends **Dec 14**. **ChatGPT: 33 sessions, 22 KE** (28 d AI Assistant 73 sessions, 39 KE) — the best-converting source. Google: **indexed 1, not indexed 91** (33 "crawled – not indexed", validation **Failed**; 57 "discovered"); GSC **4 clicks / 16 impr in 28 d**. Bing API 4 wk to Nov 13: **91 clicks / 1,262 impr**. *Doing:* no GSC spend (§0 ruling); missing release rows → Goal League; the McDonald's page needs a successor before Dec 14 (Goal League, flagged).
3. **The list is 1 outside person, and every capture promises an email that is paused.** MailerLite (live): **4 active — 1 outside (Oct 31), 0 new since**. GA4 `signup_view` **157**, `signup_submit` **0**, `newsletter_signup` 0. Returning users **13 / 7 d** (9), ~6% of clean users. Bots **48%** of sessions (SG 196 @ 0.4 s, CN 28). Mo paused the Tuesday Tape on Nov 17, yet **114 pages** still say "One email, Tuesdays". *Doing:* → **needs-you** (§0.3: the capture's promise contradicts the pause); no new capture goes up until Mo rules.

**§0.3:** the PIVOT Nov 19 test reads **organic 59 > 48 ✓ · returning 13 > 6 ✓ · clicks/100 clean 56/242 = 23.1 ≥ 15.7 ✓ · Google indexed 1 ✗ → 3 of 4** (same as Nov 11). New contradiction: the capture promise vs the Tape pause (needs-you).

## MILESTONES (R22 — one line per Wednesday read; the desk appends)

- **2026-11-18 (attended CoS; CSV `Card Hub/epn/epn-byday-2026-11-04_2026-11-17.csv`, Nov 4–17):** bot fix `dbebabf` graded working — ~95 clicks/day in the bot days → **7.0/day Nov 13–17** (eBay 8 = GA4 8 on Nov 16) · **$4.82 earned, all Nov 4** · no sale since Nov 4 · trailing 30 d **$10.80 to Nov 17 = 3.6% of M0**; both box sales leave the window Dec 3–4 → ~$0 without a sale. n too small for a trend (R22). Read: `claude/cos/epn-read-2026-11-18.md`.

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
- **Nov 24 ~01:11–02:00 UTC (Nov 23 ~17:11 PT) (CoS · desk, Mac-linked, unattended; Mon slot on time).** Freshness: HEAD `1acb5e3e` · origin/main `1acb5e3e` at clone · delta 0 · gates **0/66 · 0/3 · 0/1** vs base 0/66 · 0/3 · 0/1 (= base; terminal WARN = feed not cloned) — run in the **cloud clone** (R48). Read LANE-RULES (precedence, R1, R39, R48), STATE top + last 3 entries, NEEDS-MO, ideas/retention ledgers, **CoS LEDGER** (last intake Nov 23 23:22Z), daily review 11-23. **Prompt drift (file wins):** R48 — cloud clone, never the deploy key (not copied: Mac `/sessions` 100% full again, `mkdir $HOME/deskkey` → "No space left on device"; nothing needed it) · STEP 3 vendor delivery dead (R10 Am. 6) · prompt does not name the CoS LEDGER (O-20).
  **Inbox since the Nov 21 01:11Z desk (no Sat/Sun desk filed; the intake covered the weekend) — Project 37:** desk routes 11-21 (own), daily reviews 11-21 + 11-22, measure 11-21/22/23, bets 20261121-1/22-1/23-1, x-daily 11-21/22, x-youtube 11-21, x-weekly 11-23, pullcheck 11-21/22/23, heartbeat 11-21/22/23, traffic 11-21/22/23, studio BRIEF-grade 11-21, retention 11-22, bookmarks 11-22, BOW12-staging, NC log 11-23, gengar log 11-23, integrity-watch 11-23 + proposals, weekly-scan 11-23, KB Pokémon ADDENDA 11h/11i + AUDIT-LOG 11h, KB Bowman ADDENDA 11i + AUDIT-LOG 11g → **all ruled by the intake (LEDGER Nov 21 09:35–Nov 23 15:22) → relayed, not re-ruled**; daily review 11-23 (00:40Z, after the intake) → relayed (organic 33 vs 48 now significant, P0 risk into Dec 1/3; worth-page stale-price 🔴 rule; attended list 12 items). **Mac 9 (grok-inbox) + Studio files:** stalk 11-21/22, pullcheck 11-21/22, attention 11-20/21, seeker + creator 11-21 → already copied by the Grok inbox copy lane (COPY-LOG) → noted; seo-aeo-weekly 11-23 → noted (copy lane carries it tonight); **ivan-review 11-20, ivan-sunday-site-walk 11-22, ivan-review 11-23 (all written 17:34Z Nov 23, after the intake's last COPY-LOG read)** → ruled below; YouTube grade build + design-day files → noted (Studio's, ruled O-81/O-87). **`awaiting-cos`: 1** → ruled. Ideas: none (no Tue/Fri file). Retention: 11-22 file ruled by the intake (0 ideas); LEDGER 0 `proposed`. IW lookback (11-16, 11-19, 11-23): 11-23 has 0 proposals; 11-19 rows live in LEDGER O-58 by design. Mailbox `night-crew/pending.md`: empty before this run. Skipped: none.
  - **`price-exceptions-2026-11-23` → queued** (the intake ruled it O-91 Nov 23 12:22; pipeline status written). **`iw-2026-11-16-2` → applied** (verified live: pill "Set indices 37", no BOW26 duplicate in movers).
  - **Price lane NOW line written** (ledger O-91 asked the desk; the lane may not write STATE).
  - **Ivan (late, not missing):** he wrote Fri's review on his box while the Mac was offline and copied it in Mon with the Sun walk and Mon review. So the "2nd missed delivery → Mo re-briefs" call (N-04, review 11-23 §Down) rests on a file-timing gap, not a down bot → intake to re-grade Ivan from late to on time with a late copy; the re-brief paste is optional. Findings (verified live, curl + iPhone 13): (1) home Team Up row "379.56" vs page 608.96 → **declined, not reproduced** (home serves "TU19 608.96 ▲ +1.8% +509%"); (2) "SK03·EX EX-CHARIZARD" doubled label → confirmed cosmetic (ticker beside sub-index name, uppercased) → Night Crew P3 copy (R35); (3) `/gold-star-index` Graded Tape "Sep 10 – Oct 11, 2026" under "read Nov 19 · re-read Mon · Thu" → confirmed → Night Crew P3 (label the block as a dated record or re-read it); (4) hero vs sticky ask mismatch on one screen (Flagship Bkb $206.99 vs $205.00; Donruss FB 13 vs 14 live; Holiday Baseball $35.00 vs $34.95, tin before shipping) → routed to the page owners (Conversion: Flagship, Donruss; Wildcard: Holiday) for one dated number per screen and delivered price; (5) jargon on `/gold-star-index` and vintage index pages → parked with O-65 (Dec 1); (6) R11 on vintage set pages (sealed below raw holos) → attended question (O-25), not a desk call. Routes: Project `claude/handoffs/desk-2026-11-24-routes.md`.
  **Commits:** docs-only (STATE + archive pass of 2026-11-24, NEEDS-MO, `data/pipeline.json` statuses); does not deploy. Cloud push refused (`jmmorelli/shopcardhub is not in this session's authorized repository set`) → **mailbox (R48 c)** `night-crew/pending.md` + `pending-desk.patch.txt`, Ship Desk Tue Nov 24 06:41.
  **Deliveries:** none (R10 Am. 6; no vendor brief exists).
  **Instruments:** feed day **Nov 23** · 41 cards · 34 numeric · 40 images · GA4 20:40Z Nov 23 (4.5 h): KE yesterday **5 / 31** · organic KE7 **12.12%** vs blended 6.21% · returningShare7 2.46% (7) · clicks7 **33** · buystrip 2 · bots 37.25% (SG 100 @ 0.5 s, CN 11) → clean 187 / 33 KE (17.65/100) · `cardPageViews7` 12 · `cardPageClicks7` 2 · iPhone 13 QA 5/5 200, sw 390 = iw, 0 console errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **NEEDS-MO verified:** TAG open; capture-vs-paused-Tape open (7 page files still print "One email, Tuesdays"; O-53 by Dec 1); push-access item kept (refused again; now three tasks: desk, weekly, Monday price lane, O-25 j); YouTube synthetic-content answer (A-04) added — it is a declaration on Mo's own channel.
  **Stumbles:** Mac `$HOME` full again (key not copied; nothing needed it). A local `npm i playwright` in a scratch dir shadowed the pre-installed browser; removed, QA ran on the system copy.
- **Nov 21 ~01:11–01:55 UTC (Nov 20 ~17:11 PT) (CoS · desk, Mac-linked, unattended; Fri slot on time).** Freshness: HEAD `5910c25f` · origin/main `5910c25f` at clone · delta 0 · gates **0/66 · 0/3 · 0/1** vs base 0/69 · 0/3 · 0/1 (prices −3; terminal WARN = feed not cloned) — run in the **cloud clone** (R48). Read LANE-RULES (precedence, R10 Am. 6, R48), STATE top + last 3 entries, NEEDS-MO, ideas/retention ledgers, **CoS LEDGER** (last intake Nov 20 23:25Z), daily review 11-20. **Prompt drift (file wins):** R48 — cloud clone, never the deploy key (key not copied tonight: Mac `/sessions` 100% full again, `mkdir $HOME/deskkey` → "No space left on device"; no Mac clone needed, gates ran in the cloud) · STEP 3 vendor delivery dead (R10 Am. 6) · prompt does not name the CoS LEDGER (O-20).
  **Inbox since the Nov 20 01:10Z desk — Project 13:** measure 11-20, bet-20261120-1, site-sweep 11-20, x-daily 11-20, pullcheck 11-20, heartbeat 11-20, traffic 11-20, NC log 11-20, KB Bowman AUDIT-LOG 11f + ADDENDA 11h, KB Pokémon AUDIT-LOG 11g + ADDENDA 11g → **ruled by the intake (LEDGER Nov 20 09:40–15:25) → relayed, not re-ruled**; daily review 11-20 (00:51Z, after the intake) → relayed (E20 Deals KILLED, E23 split, P0 card leg = `/card*` pages7 ≥ 120, TAG re-pushed). **Mac 4:** grok-inbox stalk 11-20, attention 11-19, pullcheck 11-20 (original of the ruled Project copy) → noted (contestants', X weekly inputs; O-11 already decided threads-only) · dungeon-keeper CHANGELOG → noted (R12/R13, private). **Not filed:** Ivan Fri Nov 20 (no `ivan-review-2026-11-20.md` by 01:15Z; usual landing ~17:30Z) → for Grok COPY-LOG / Ops to record. **`awaiting-cos`: 0.** Ideas: none (no Fri file). Retention: no file; LEDGER 0 `proposed`. IW lookback: newest proposals (11-19) ruled by the intake (O-58, O-59). Mailbox `night-crew/pending.md`: empty (R48 d: nothing built and stuck > 24 h). Skipped: none.
  - **O-74 applied:** STATE.md 23,499 → under 21,000 B — the Nov 19 desk entry, the Nov 18 weekly/desk and Nov 17 desk pointer lines and the archive-pointer paragraph moved verbatim to `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-21.
  - **Review 11-20 vs LEDGER, two conflicts — CoS ruling: the ledger stands** (LEDGER rule: reviews relay, do not re-rule). (1) Coverage Builder pace: review said 30 cards Nov 26 / ≤ 50 misses; **O-61 stands at 12 a run** (a 30-card patch ~350 KB on a 1.56 MB Project risks the 2 MB cap again) — the intake may amend O-61 if Ops shows room. (2) Data Desk: review KEEP to Dec 1 vs **O-73 pause** — O-73 stands; practical effect identical until the attended CoS disables the task. Both → intake Sat for the log.
  - Review's "BET-20261120-1 → BACKLOG via desk/intake tonight" → already done by the intake (O-78, in BACKLOG Nov 20) → noted.
  **Commits:** docs-only (STATE + archive pass of 2026-11-21, NEEDS-MO); does not deploy. **Cloud push refused** (`not in this session's authorized repository set`) → **mailbox (R48 c)** `night-crew/pending.md` + `pending-desk.patch.txt`, Ship Desk Sat Nov 21 06:41.
  **Deliveries:** none (R10 Am. 6; no vendor brief exists).
  **Instruments:** feed day **Nov 20** · 41 cards · 34 numeric · 39 images · GA4 17:24Z Nov 20 (7.8 h): KE yesterday **5 / 35** · organic KE7 **13.95%** vs blended 6.96% · returningShare7 3.16% (11) · clicks7 **50** · buystrip 2 · bots 39.0% (SG 134 @ 0.5 s, CN 11) → clean 227 / 50 KE (22.03/100) · `cardPageViews7` 13 · `cardPageClicks7` 2 · iPhone 13 QA 5/5 200, sw 390 = iw, 0 console errors, photos 0/0 · 3/3 · 20/20 · 66/66 · 5/5.
  **NEEDS-MO verified:** TAG open; capture-vs-paused-Tape open (7 page files still print "One email, Tuesdays"; O-53 replacement by Dec 1); push-access item kept (refused again; O-25).
  **Stumbles:** Mac `$HOME` full again (deploy key not copied; nothing needed it).
- *(Older entries — the Nov 20 desk (pass of 2026-11-24), the Nov 19 desk, Nov 18 weekly + desk, Nov 17 desk, and the pointer paragraph naming which entry sits in which archive pass — are verbatim in `STATE-ARCHIVE-2026-11.md`, pass of 2026-11-21 and earlier passes. Still open from them: Van Gogh Pikachu noindex → Nov 12 check · Tape unsent → attended.)*
## ROSTER

The Oct 1 roster text went stale with the Oct 19 PIVOT toggles (X Desk Watch, Ideas Desk, CEO Desk off; Retention → Sundays) and was moved verbatim to `STATE-ARCHIVE-2026-10.md` by the Oct 23 desk. Live roster: Project `claude/cos/ORG.md` + the Ops heartbeat's lane check (28 enabled Card Hub lanes, Oct 23) + `claude/lanes/EXPECTED-FILINGS.json`. New Oct 22–23: Box Desk (lane not yet created), Bookmark Desk (Sun 19:40), Deals Action (3x/day, R42), Grok SEO & AEO Desk + Stalk Bot (R39 files).

## Roster changes log

*(The Oct 1 monthly roster review moved to `STATE-ARCHIVE-2026-10.md` on 2026-10-16.)*
