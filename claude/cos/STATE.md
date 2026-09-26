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

## NOW — 2026-09-26 (Sat, CoS with Mo in chat — the "0 EPN earnings" read)

**Mo's worry (Sat ~07:30 PT): zero EPN earnings for a few days since the rework.** Answer, with evidence in Project `claude/cos/epn-read-2026-09-26.md`: **nothing is broken** — every rendered eBay link tagged, guard passes real browsers, GA4 clicks = EPN clicks; the week is traffic (release spike over, ~16 US sessions/day) × small numbers (28 clicks, 0 actions). Transaction Detail settles the `No Custom ID` question for good: **seven phone/tablet clicks made 44 of the 58 all-time transactions** — the eBay app drops `customid` and keeps `campid`; money credited, page unattributed. Nothing to build for it.

| Item | State |
|---|---|
| **Home SEALED column** — gold eBay button per ticker on the index board (`customid=home-<ticker>`), R11 on the front door; BB26 "Pokémon" label fixed; phone drops Since-launch to fit | **LIVE `357c950`** |
| **/bowman-bangers buy strip** (Chrome hobby box · May box · case), off the R11 exempt list | **LIVE** |
| **site-auditor 15b** — home board must carry ≥ 8 `home-*` links | **LIVE** |
| **image-sweep no longer sends GA4** — the nightly render gate logged ~158 fake page views/night since Sep 25 ("" country / Unassigned, 10-min sessions). `sessionsYesterday` for Sep 25 (58) and Sep 26 are polluted; **the Sep 30 weekly quotes clean days from Sep 27** | **LIVE** |
| Phone fold on `/bowman-football` and `/bowman-bangers` — 0 eBay links in the first 844 px (long hero paragraph above the strip) | page-polish item, not a break; noted |
| Bing Webmaster — did impressions step down Sep 19 with sessions? | Mo's account; unread |

## NOW — 2026-09-25 (read this block first) — THE STRATEGIC RESET (Mo: "lean HARD into what we know our edge is")

**Read `claude/cos/strategic-review-2026-09-25.md` (Project) once.** Its verdict, in one line: the site's one edge is the
**per-set chase-basket index** (base 100, sold comps, constituents shown, weekly re-mark log, Pokémon AND Bowman) — nobody else
publishes one; portfolio tracking is a commodity PSA now gives away free (Sep 23 2026: raw cards + performance chart + eBay
consignment). Mo approved every recommendation in chat 2026-09-25 ("do and execute all of those things immediately, I fully approve").

**Shipped today (CoS, Mac-linked session), three commits, gates at baseline on every tree:**

| Item | State |
|---|---|
| **Home = the index board above the fold.** New `HOME:indexboard` block (one row per index: level · 1W · 1M · since launch · sparkline · re-marked), new H1/deck/title/meta; tape, chart, releases, Bowman movers, auctions below; the engine Screens table folds into a closed `<details>` that rail/chip screen links open. `js/home.js` + `tools/build-home.mjs` render it; `renderIndexBoard`/`idxStats` exported. | **LIVE** |
| **Vault → Watchlist.** Default = *simple view* (tabs, search, sort, add, share, table); portfolios / grouping / columns / cards view / paste-a-list / imports / analytics behind an **Advanced view** toggle (`sch_vault_mode`, per browser). Empty state + onboarding point at the indices. Nav CTA "Watchlist", nav link, rail heading, ★ button strings renamed; "portfolio" off the public copy. **Nothing deleted.** | **LIVE** |
| **Level chart on every index page** — `js/index-chart.js`, client-side from `data/indices.json`, under the hero on all 8 live tickers; one mark → one line, never invented history. Also fixed: 6 Pokémon index pages + preview used `var(--accent)` without defining it — the nav CTA had been invisible there. | **LIVE** |
| **Consolidation, batch 1.** `/blog` (stale duplicate hub) → 301 `/research`; `/set-index-preview` → 301 `/indices`; both out of nav + sitemap. **Batch 2 is a work order for the Sep 30 weekly** (below). | **LIVE** |
| **Idea #39** — "Retail (Amazon) →" search links on the 30th page (9 anchors, `tag=shopcardhub-20`, no price, Associates line, eBay stays primary). | **LIVE** |
| **TH26 · 30th Celebration Set Index — LIVE** (Mo, Sep 25: "do it - I approve"). **The first sector-model index** (rulebook Sep 15): universe = all 188 numbered slots on PriceCharting's `pokemon-30th-celebration` console (unnumbered promos such as the Mew RGB trio excluded by the slot rule; Classic Collection reprints included); screen 6/4/30 on clean single-card rows of the ungraded completed-sales table, read headless — **188/188 passed** (the Sep 15 SV151 lesson again: the blended list includes TCGplayer, where commons trade as singles); 25% cap binds nothing (Lugia #149 tops at 10.8%); inception 2026-09-25 at 100.00, basket $2,468.62, divisor 24.6862. Block lives on `/pokemon-30th-anniversary-2026` under the buy box (doctrine: the guide morphs into the index page); row on `/indices` (META entry added) and the home board. **Amended the same afternoon (Mo, three asks):** (1) the three Mew RGB secrets (R/G/B-numbered, ~$3.8k each, 24–31 clean sales/30d) were being dropped by the slot regex — they are set cards and are IN; with them the 25% single cap alone would give the trio 75%, so Mo adopted the **5/50 second leg** of the Select Sector SPDR rule (rulebook §3a): TH26 re-initialised the same day, **191/191**, basket $4,796.23, divisor 47.9623, trio 16.4% each, 4 weights capped; (2) **TH26·RGB sub-index** (the trio, price-weighted, uncapped, base 100, its own line on the page, not a hub row); (3) **thumbnails** on the top-10 rows (card-img.js name mode) and an **"Ending soon" auction desk on the block** — `data/auction-desk.json` seeds 10 desk-only TH26 cards that `/api/auctions` searches but the engine never marks (no watchlist.json entry, no mark, no card page — R20 clean); `js/sector-auctions.js` renders them with `customid=th26-auctions`. **Marks Mon + Thu automatically** — `tools/build-sector-index.mjs --ticker TH26 --mark --if-mark-day` in the nightly Action's publish step (~01:15 PT), no new lane; quarterly reconstitution first Monday Jan/Apr/Jul/Oct (`--recon`, next 2027-01-04, announce Dec 28). `remark-indices.mjs` never touches it (its POKE list is explicit). **The Sep 17 "wall" is gone:** PriceCharting item pages DO carry the completed-sales table unauthenticated (sold-marks.mjs has parsed it nightly since Sep 24) — so the SV151 rebuild can run on this same tool: add an `SV151` config and `--init`. | **LIVE** |
| **X, new arrangement (Mo, Sep 25 ~12:00 PT).** Grok bots OFF ("kind of a disaster, cost a lot almost"). **The CoS drafts and queues posts; Mo handles replies and interactions.** Posts go into X's native scheduler from Mo's Chrome with Mo present (his yes on the batch); nothing posts live unattended on a weekend (the Sep 3–6 record: 1 of 5 unattended writes landed). **First batch queued 12:40 PT: 9 posts Fri–Sun, 3/day** (Fri 12:45 · 4:00 · 7:00 pm; Sat 9:00 am · 1:00 · 7:00 pm; Sun 9:00 am · 12:30 · 6:30 pm PT), images on 1/2/4/9 — text + fact trail in Project `claude/cos/x-weekend-2026-09-25.md`, images in `Card Hub/x-images/2026-09-25/` + `og/x/` (`0f18ac2`). Veto = delete at x.com → Drafts → Scheduled. **R10 amended** (below). Image-attach recipe changed: the `og/x` PNG on shopcardhub.com now captures at 2/3 frame in Mo's Chrome (tab zoom ≠ 100%), so the working path is a private claude.ai artifact hosting the PNG, header hidden by JS, `screenshot scale:1` → `upload_image`. `make.py bangers` drops the ENGINE ASK column when no row carries one (R20). | **LIVE in the queue** |
| **Friday release-window lane (Sep 25 09:xx) + Holliday ruling.** Lane patch applied and pushed `53da612`; the CoS re-read SCP's PSA 10 tab live (Aug 6 2026 $720.00, eBay 407062353443, title names the grade) → **R18 satisfied; the Sep 22 correction over-corrected** (it took the PSA 9 $155 same-day row for the whole tape). Holliday PSA 10 $720 restored on `/bowman-bangers` with a dated "correction of the Sep 22 correction" block; both reads stay on record. `data/x-board.json` regenerated; lane recommends the Sep 29 Tuesday run disables the Friday task (street +16, last Friday that earned its read). | **LIVE** |
| **Return-user hooks + Bid buttons** (`84398aa`, `a1b06c9`, same afternoon): "★ You watch N cards on this index" strip (`js/index-you.js`, % since the day starred), watchlist count badge on the nav CTA, index pages put the level first on a phone; **Bid buttons** (soonest-closing verified auction, bids first) on every Pokémon index row's action cell for the top five per set (`data/auction-desk.json` desk-only cards, `customid=<tk>-auctions`), gold "Listings" CTA (Mo: make the call to action visible), auctions cache 30 min. | **LIVE** |
| **Bid buttons on the Bowman pages** (`76bf3d4`): Bangers board (all five seats, beside Buy on eBay), BOW26 (all 10 autos; new eBay column with the gold Listings button), BCB26 (the five engine-tracked base cards). `js/sector-auctions.js` v3 exposes `SCH_AUC.run()` for client-rendered tables and injects its own styles where a page has none; the BCB26 generator now carries today's page edits (chart, tapecap, gold CTA, slot) so a regen no longer reverts them. Bid column floor 150px (it was collapsing to "B…" on BCB26). | **LIVE** |
| **Return-user batch 2** (`7e85ec2`): **home "Since you were here · <date>" panel** (`js/home-you.js`: every live index's level then vs now from `indices.json` history, plus each ★ card's move from first logged price to latest; `sch_home_seen` stamp; first visit renders nothing); **/indices gold Open button** on every row + phone layout that fits at 390 px (1 Wk column and blurb tail hidden); **Bowman Bangers phone fold** — each seat folds to header · stats · verdict line · CTAs, the week's tape (with the corrections inside it) to its opening line; page 48,350 → 25,287 px on a phone, desktop untouched. | **LIVE** |
| **SV151 · Scarlet & Violet 151 Set Index — LIVE** (`979296a`, Mo: "SV151 index now"). Second sector-model ticker, same tool: universe = all **207** numbered slots on PriceCharting's `pokemon-scarlet-&-violet-151` console (Poster Collection #49 skipped by title; where no plain print exists the [Holo] print is the slot — Machamp #68, Marowak #105, Vaporeon #134, Mewtwo #150, Psychic Energy #207); screen 6/4/30 → **207/207 passed** (a three-year-old set: n30 mostly 30–43 per card); basket $1,860.20 (the Sep 17 spec's headline sum was $1,905.79 — same source, same slot rule); divisor 18.602; **no cap binds** (Charizard ex #199 18.8%, Blastoise ex 7.0%, Venusaur ex 5.8%; effective holdings 16.4). **Inception 2026-09-25 at 100.00** — Path B of the Sep 17 spec, never Sep 15. New page `/scarlet-violet-151-index` (sealed strip above the fold: Booster Bundle / ETB / UPC searches, `customid=sv151-*`), hub row + face thumb, nav (Pokémon → indices), sitemap, home board (auto), nightly Action marks it Mon+Thu beside TH26, 10 desk auction cards (Bid buttons live: 105 verified auctions on first read). The held 151 Reddit post can go (NEEDS-MO). | **LIVE** |
| **Rendered image gate** (`b50c97c`, Mo: "make sure our images work on all pages — shouldn't an agent do that nightly?"). Sweep of all 79 sitemap pages × 1280/390 on production, Sep 25 ~15:30 PT: **0 broken images (1,839 `<img>`), 0 page errors, 0 phone overflow**; 14 of 574 card-photo slots on the honest placeholder — 11 of them because the sector-block photo keys said "Pokémon TCG …" and the resolver requires every word in the eBay title (fixed: "Pokemon 151" + printed number `200/165`; TH26 keeps bare numbers because the Classic Collection reprints number as 4/102) → SV151 10/10 and hub 9/9 now resolve, TH26 1 left (Pikachu ex #150, no clean listing title). Remaining placeholders: Konnor Griffin 2024 auto (/roy-watch), Holliday PSA 10 (/ethan-holliday), Boss's Orders Corbeau UR (/ascended-heroes). **`tools/ci/image-sweep.mjs` now runs in the daily 08:30 PT `site-gates` (scheduled runs only, headless Chromium on the runner, ~8 min): broken img / page error / overflow = FAIL → gate-watch issue; placeholders = WARN.** Until today the three gates read HTML only — a broken photo could not trip them. | **LIVE** |
| **UI checks in the nightly render gate** (`7dd9cd2`, Mo: "which agent is cruising the site for UI/UX errors?" — none was, since the MWF auditor was retired Sep 21). `image-sweep.mjs` now also fails on a clipped CTA label, text the same colour as its background, a bare `var(--x)` the page never defines (the Sep 25 `--accent` bug class), and an element hanging off the phone viewport; tap targets under 24 px are WARN; it saves one 390 px screenshot per page as a 7-day Action artifact for the Wednesday weekly's eyes. First run on all 79 pages found and fixed: `/indices` never defined the rail's `--bg2/--bg4/--green-dim` (rail background was transparent there); `/watchlist` used five glow/tint tokens it never defined; the board's hover row had no fallback. Also: every gold Listings button now centres its label (Mo). Still nobody with **taste** looks at every page daily — that is the Wednesday weekly's job with the screenshots; the nightly catches what a machine can. | **LIVE** |
| **PF25 has one mark because the Sep 21 Monday lane could not mark it** (page template shipped in the inception shape; `remark-indices.mjs` fixed the same evening, `2378ba7`). **First re-mark lands Mon Sep 28** with the other Pokémon tickers — the chart, the hub 1-Wk cell and the home board all fill in from that row. Not marked mid-week on purpose (weekly cadence is the rule). | **Sep 28** |
| **BOWMAN INDEX RESET — LIVE** (`bb18f6e`, Mo Sep 25 ~16:45 PT: "BOW26 should be all the 1st Bowman Chromes from every 2026 release, autos leading, non-autos the sub-index, each release its own index too; the current pages read like AI slop" — full diagnosis and design critique in Project `claude/cos/bowman-index-reset-2026-09-25.md`). The two ask-basis lines (BOW26 = ten board autos with a divisor; BCB26 = a 9-card hand-picked chase basket that fell 30% in a week) are **retired to `data/indices-retired.json`** with the reason; nothing carried over (rulebook §6). New, all sector-model, sold basis, screen 6/4/30, 25%+5/50 caps, Mon/Thu marks, one call `--ticker BOW26,BB26,BCB26` (page reads shared): **BOW26 · 2026 1st Bowman Chrome Auto Index** = every 1st Bowman Chrome Auto across the 2026 releases (May Bowman + Sep Chrome now, Dec Draft when its console lists) — **111 of 186 trading, basket $2,336, top weight Fischer 6.2%, effective holdings 43.7**; **BB26 · 2026 Bowman (May)** — 70/91, $1,671; **BCB26 · 2026 Bowman Chrome (Sep)** — 41/95, $665 (97 checklist-flagged 1st autos, 3 not on SCP's console). Each carries a **screened BASE sub-index** (that release's 1st Bowman Chrome base cards, price-weighted, uncapped): BOW26 21/145, BB26 18/102, BCB26 3/43 — base cards are $1–5 and few clear six clean sales a month; the count shows on the strip. **Data facts:** SCP lists May and September prospect autos on ONE console (`baseball-cards-2026-bowman-chrome-prospect-autograph`, 192 base slots) and their base cards on another (BCP-1..150 May, 151..250 Sep); the split uses the September checklist (`data/sets/2026-bowman-chrome-baseball.json`) — May has no flag file yet, so every May CPA/BCP slot is taken as a 1st (Tuesday lane verifies when a May checklist is filed). Sports consoles page by POST to sportscardspro.com (`pc-console.mjs`). Pages rebuilt on the house mast (`/bowman-1st-chrome-index`, new `/bowman-2026-index`, `/bowman-chrome-2026-index`) with the engine buy strip; old generators moved to `tools/retired/`; hub/nav/sitemap/home/chip strip/nightly Action updated; Bid buttons on the top ten of each (engine ids reused, 15 new desk cards). `tools/build-card-pages.mjs` still labels chrome-auto card pages BOW26 — correct. **BD26** enters BOW26 as a third source in December. | **LIVE** |
| **TAG affiliate — registered Sep 25 (~17:30 PT), pending TAG's review** (UpPromote, partner.taggrading.com; $1/item flat, page meta also cites 10% of referral sales; 30-day cookie). Dashboard: *Inactive · not activated yet*, payment info (PayPal) still to be entered by Mo; TAG's email: approval arrives by email. **Mo's call (Sep 25, corrected in chat): promote TAG over PSA — "especially because of the AI tilt they have and us."** So the grading recommendation everywhere becomes TAG; PSA stays as the reference grade the market prices against (the guide keeps its PSA-10 comps), not the one we send people to. COMC (Mo's own storefront, 92-page footer link) is untouched. **TAG-first grading lane, staged, ships the day the link lands:** (1) /tag-grading-guide — the two untagged `taggrading.com/pages/pricing` links become the affiliate link, plus one "Grade it with TAG →" CTA in the mast; (2) /psa-grading-guide — a TAG cross-sell block ("same card, AI-defined grade, cheaper per item") above the fold, with the disclosure line; (3) the 20 card-* pages that mention graded copies get a one-line "Grade this with TAG →" secondary under the Listings/Bid buttons (built by the listings-col tool, not by hand); (4) the Sports/Grading nav panels and the home Grading tile lead with TAG; (5) /affiliate-disclosure gains the TAG line. No feature work (R25) — links and copy only. COMC shipping-fee note (March 2026, graded $1→$2) stays in the guide as the reason a collector grades before consigning. | **Mo: payment info + link** |
| **X queue corrections** (X Desk Watch 13:20 → desk 15:00 → CoS fixed in Mo's scheduler ~16:10 PT, Mo present): Sat 1:00 pm now reads "street Wednesday Sep 30 … lowest ask $389.99 on eBay as of Friday"; Sun 9:00 am now "lowest eBay ask was $161 on Friday … 3.2×". Fri 12:45 (TH26 launch) went out on time. 8 remain queued. | **done** |
| **Idea #38** — TCGplayer/Impact on the six Pokémon index tables. | **Needs Mo: the Impact application** (NEEDS-MO). Build follows approval. |
| **Distribution** — Monday close image (`make.py levels`, Pokémon tickers only until Phase 2 puts Bowman on solds), a Reddit submission, and a feed-offer note to the Pokémon index sites. | **X posts: queued by the CoS** (see the X row below). Reddit + feed-offer drafts stay in NEEDS-MO (Mo's accounts). |

**Standing rule from today (R25, add to LANE-RULES at the Oct 1 roster review): no new feature ships until the clean visitor
count moves.** ~30 clean visitors/day is too few for any retention feature to register. Work that IS allowed: Phase 2 compliance
(build-order #1, unchanged), anything that makes the index more citable (chart, methodology, history, feed), consolidation,
distribution of the Monday close, and live FAILs. Scouting grades, sold catalog, auction desk, engine signals are built — no
extensions until the Nov 2 re-audit unless Mo asks. The ideas desk keeps filing; the CoS declines anything that adds a surface.

**Consolidation batch 2 — work order for the Sep 30 weekly (needs GA4 per-page landing sessions, which the cloud cannot read):**
fold a page when ALL of: < 5 landing sessions in 28 d · 0 EPN actions ever on its custom ID · ≤ 2 internal inlinks outside nav/footer.
Fold = 301 to the set/index/hub page it belongs to, drop from nav.json + sitemap, keep the file out of the repo. Candidates by
structure (traffic unchecked): the tier-label Topps product pages with no numeric prices (`topps-tribute-baseball`, `topps-tier-one-baseball`,
`topps-museum-collection-baseball`, `topps-inception-*`, `topps-definitive-basketball`, `topps-pristine-basketball`,
`topps-chrome-updates-basketball-sapphire-edition`, `topps-finest-baseball`) → `/research`; `adley-rutschman-cards` (0 inlinks) → `/research`.
**Never fold** a page with an EPN action on record (messi, misiorowski, PCA, bowman-football, 30th, best-hobby-boxes) or a top-20 lander.
Target ≤ 60 indexable URLs. The 21 `/card-*` pages are noindex already and stay until their engine blocks have a host.

**Watch next:** Monday Sep 28: the Action's ~01:15 PT run should print TH26's second mark (`feed: nightly 2026-09-28` touches `data/indices.json` + the 30th page) and the Monday lane's re-mark updates the other Pokémon tickers → the home board and every index chart update with zero page edits (verify `/pokemon-30th-anniversary-2026#th26` and `/destined-rivals-index`). If TH26's history is still one row on Sep 28 evening, run `node tools/build-sector-index.mjs --ticker TH26 --mark` from a fresh clone and read the Action log.
The Sep 30 EPN read is the first with the new home; do not read anything into one week.

## NOW — 2026-09-23

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
- **2026-09-26 (CoS, Mo in chat, from Mo's three exports — Project `claude/cos/epn-read-2026-09-26.md`):** Sep 12–25 **$12.44 on 92 clicks / 11 actions**; Sep 19–25 $3.80 on 40 clicks / 1 action; Sep 21–25 0 actions on 28 clicks (P≈27% at the 4.5%/click tagged rate). **Below M0.** Plumbing verified intact on 19 rendered pages (0 untagged, guard passes browsers, GA4 clicks = EPN clicks). Traffic is the driver: US sessions back to ~16/day since Sep 19 (release spike over). **`No Custom ID` resolved by Transaction Detail: 44 of 58 all-time tx / $71.40 = seven phone/tablet clicks (eBay app drops customid, keeps campid) — credited, unattributed, G1 confirmed.** Shipped `357c950`: home SEALED column (`home-<ticker>`), Bangers strip, gate 15b, image-sweep no longer pollutes GA4 (~158 fake views/night since Sep 25). Read `home-*` at the Sep 30 desk.
- **2026-09-23 (desk, R22, first read, from Mo's screenshots):** trailing 30 d (Aug 24–Sep 23) **$106.59 on 204 clicks / 24 actions** (EPC $0.52); last 7 d **$5.66 on 44 clicks / 3 actions** (EPN clicks7 = GA4 clicks7 = 44). **Below M0.** 82% of the 30 d came from two days (Aug 31 $58.50, Sep 9 $29.27); ex-those $18.82. 63% arrived untagged (`No Custom ID`, $66.78). The site emits none today, and the dates fit pre-tagging history (Mo); phone tag-drop (G1) is the other suspect. Test: Custom ID report for Sep 2–23 at the Sep 30 read. Full read: Project `claude/cos/epn-read-2026-09-23.md`.

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

- **P1 — Sold catalog (Sep 24):** (1) confirm the first nightly `price-snapshot` run on a GitHub runner reads SCP (Cloudflare may treat runner IPs differently than the Cowork sandbox) — if `sold-marks.json` day does not advance on Sep 25, the step fell back; run it Mac-side. (2) Grow the catalog: set-index baskets for BCB26/BOW26, Mo's 55 unresolved cards. (3) Re-hash when Mo re-imports a COMC CSV with new cards (catalog only covers cards at $2+ on the Sep 24 CSV).

- **P1 — Scouting Grades re-grade (Mo, Sep 24):** fold a weekly re-grade into the Tuesday board lane (it already reads SCP): re-read every input in `data/grades-inputs.json` (SCP solds via Chrome — node/curl 403; MLB Stats API; Pipeline ranks), `node tools/build-grades.mjs`, gates. No new scheduled run. Next builds: Now/3M/6M history, grade chips on board seats, Pokémon rubric (Risk = skew/kurtosis).

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
- **P1 — Tuesday board lane, Sep 29:** the board is unchanged by the Bowman reset (it ranks ten May autos by last printed sale and makes calls; BB26/BOW26 price the whole class and make none) — the board's "vs index" benchmark line should now cite **BB26**. Also `iw-2026-09-24-2` — the board says "ranked by the last printed sale" but ranks on SportsCardsPro's raw guide value, and `x-board.json` calls it `rawSold`. Rename everywhere (`rawGuide`) or rank on the dated last print; never on engine asks. Then `ccx-2026-09-24-3` (bake the seat table with its stamp). Keep the Sep 24 R9 strings ("1st Bowman Chrome Auto") if the generator re-emits the prose. **Until fixed, nobody tells the vendor the board ranks on "last printed sale".**
- **Monday lane, Sep 28 (desk Sep 24):** do NOT run `build-engine-blocks.mjs` (`ccx-2026-09-24-2`, R20); fix `/phantasmal-flames-index` "first Monday re-mark (09/21)" to the true first re-mark date when PF25 re-marks.
- **Sep 30 weekly (desk Sep 24, tooling):** `iw-2026-09-20-2` settled-day GA4 summary + `iw-2026-09-24-5` clean daily series · `iw-2026-09-24-6` nightly counts log · per-index `markedAsOf` in `indices.json` · generated sold/ask count on `/indices` · withdrawal-sentence gate · buy-strip count<5 suppression · `market-latest.json` note string ("hammer prices from tracked auction closes").
- **P1 — Tuesday board lane, Sep 29 (desk Sep 25, grok-site-fixes #2):** the tape still shows **Kim $131 under "RAW SOLD"** (a carried guide figure; same root as `iw-2026-09-24-2`, so fix it with the rename). `/bowman-bangers` og:image now points at `og/x/board-latest.png` (`bfeb3b6`), so whatever the tape says is the link preview. "Flat" is already off the Sep 25 tape.
- **P1 — Tuesday board lane, Sep 29 (X Desk Watch side finding, desk-ruled Sep 23):** `og/x/board-latest.png` carries an "ENGINE ASK" column beside the sold marks. Under R20 an ask appears only as a live listing with a buy link, never as a mark. **Drop the column or relabel it "asks from $X · N live"** on the Sep 29 tape. The Sep 22 image is labelled as an ask and is not retroactively false.
- **P1 — `topps-pristine-basketball` release-day flip (carried Thu → Fri → Mon Sep 28 desk):** body still reads "Pre-orders open Aug 25 … config TBA". Verify the street date and box config against a named source, then flip the hero and rarity strip. Do not flip on the meta date alone.
- **Content Editor queue (from the Sep 23 weekly), carried to the Mon Sep 28 desk (not reached Sep 25), in the weekly's order (+ a dated Pristine baseball secondary re-read, iw-2026-09-24-4):** home signup copy · index "this board / sold comps only" signup line · `pokemon-tcg-2026` "Verdict: Buy singles" + dated re-read · BCB26 "pre-activation" chip · Flagg "advanced buy" · stale dates · graded range in the Sep 22 correction (R18) · hidden stale block · R9 "1st Bowman" shorthand. Each is verified live before the edit (R5).
- **P1 — Ending Soon: widen `/api/auctions` to each live index's top 5** (`desk:true`, never a slug, never a
  mark). Live listings only — allowed under the Sep 22 ruling; after Phase 1.
- **P1 — the 31 `no-machine-stamp` pages**, oldest-traffic first. Re-read before stamping.
- **P1 — engine block on a phone:** collapse the band to cells with a value; fold listings behind "Show
  listings" (Mewtwo block is 1,969 px on a phone).
- **P1 — Terminal step 5** (`rooms/terminal.md`): bowman-bangers phone length, `build-auctions.mjs` must
  keep the rail/shell wrapper, 11 host-less `/card-*` pages fold-or-301.
- ~~P1 — SV151 rebuild~~ **DONE Sep 25** (`979296a`, see NOW). Next candidates on the sector tool, in order of search volume: Prismatic Evolutions full set (PRIS25 stays the chase index; a full-set ticker would be a second line), Evolving Skies, Obsidian Flames. None before the Nov 2 re-audit unless Mo asks (R25).
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

**Two things (Sep 25), both human-account items — see NEEDS-MO:** the Impact/TCGplayer application (#38, ~10 min) and one Reddit submission. (The index-close X post is no longer Mo's: the CoS queued the weekend batch, Sat 9:00 am carries the close.) Standing from today: Mo handles X replies/interactions; delete anything in Drafts → Scheduled he doesn't want. Before that: **Nothing (Sep 24).** Mo ruled the Charizard post (stays) and the vendor probation (to Sep 30) live today. The repo-access click is withdrawn (repo stays public, Mo) and the Sunday task's schedule is fixed. Only standing item: if EPN is signed out on a Wednesday, R22 files one line.

---

## RUN LOG (last 7 days; older entries in the archive)

- **Sep 26 ~07:30–08:40 PT (CoS, Mac-linked, Mo in chat).** EPN read from Mo's exports (Browser 1 signed out; eBay OAuth wanted a password — not typed). Production render 19 pages × 2 widths from the cloud sandbox (Playwright); GA4 from the nightly snapshot + history. Pushed `357c950` from a fresh deploy-key clone on the Mac (`git am`, tree `668858b`, fast-forward, live 11 `home-*` links + Bangers strip verified at 1280/390, 0 errors). Gates 0/77 · 0/3 · 0/0 (77 = HEAD baseline). **Stumbles:** first `/api/comps` probe used `cat=` (wrong param) and read `total: 0` — the page uses `category_ids=`; `/tmp` on the Mac VM is not writable, keys copied under `$HOME/k` instead; the strip builder inserted the Bangers block above the rail (NAV:END anchor, hero > 9000 chars away) — moved under the hero by hand, builder `--check` clean.
- **Sep 25 14:14–~15:10 PT (CoS · desk, Mac-linked, unattended).**
  HEAD `a264101` · origin/main `a264101` at start · gates **0/76 · 0/3 · 0/0** (`--feed data/feed`) = baseline; same on the pushed tree, no WARN delta (a first footer rewording tripped `stale-prose-stamp`, +1, and was reworded back to baseline before commit). Read LANE-RULES R1–R24 from a fresh deploy-key clone. **Prompt drift (file wins), same as Sep 23/24:** the prompt reads the feed from raw.githubusercontent (R19), leaves out R24 `gate-watch` and the R15 heartbeat, and still says to deliver vendor briefs. The vendor has been off since noon, so no delivery is owed. Open `gate-watch` issues: **0**. Heartbeat (`--since 2026-09-24`): 4 due, 1 "missing". It was **X Desk Watch Sep 25**, and it isn't a silent lane: the CoS disabled the task at 09:25 PT (Grok usage exhausted) and the lane still filed Mac-side at 13:18 PT (`x-desk/watch-2026-09-25.md`, no Project copy). Diagnosed as a pause, not an incident.
  **Inbox (since Sep 24 14:14 PT), 17 items, all ruled.** Most of the day was ruled live by the CoS+Mo sessions (see the two entries below), so the desk did not redo them.
  *Project:* `strategic-review-2026-09-25`, `x-weekend-2026-09-25`, `x-voice`, `sector-index-rulebook` (amended), `handoffs/sold-catalog-v1…patch` (shipped as `c4b241a`) → already ruled/applied live, no action. `ideas/2026-09-25` (#38, #39) → already ruled by Mo in chat (#38 adopted, awaiting the Impact application; #39 live `8ae7a74`). No new rows. `grok-site-fixes-2026-09-24` → #1 **applied** (below); #2 **queued**, Tuesday lane Sep 29 (OPEN ITEMS). The ENGINE ASK column is already gone (`d19109a`) and "flat" is not on the Sep 25 tape; **Kim's $131 in a "RAW SOLD" column** is still there (same root as `iw-2026-09-24-2`). `bowman-index-reset-2026-09-25` (written 21:05Z by the live session) → **needs-Mo**: its §4 approval and its §3 TAG registration went on NEEDS-MO because neither was there yet. If the live session already has his answer, delete the lines.
  *Mac:* `x-desk/watch-2026-09-25` + `scorecard` → 0 live FAILs. **2 pre-publication FAILs in the CoS weekend queue** (Sat 1:00 pm "street Tuesday" + an undated $375–$400 ask range; Sun 9:00 am the $180 ETB figure is undated and the linked page now contradicts it). Routed as **needs-Mo**: editing the scheduler is a write to the account, and this run is unattended (R10 Amendment 2, written today). Side findings 1+2 **applied** (below). Its "R10 not amended in the file" note → **applied** (LANE-RULES R10 Amendment 2). Its pipeline lines → **applied** to `agents.grok.actions`. `friday-release-window-2026-09-25`, `Bowman-Bangers-System-Reference` → already applied live (`53da612`). `x-images/2026-09-25/*` → the CoS's own. `dungeon-keeper/CHANGELOG` → R12 secondary, read, no action. `chief-of-staff/*-mirror-2026-09-24-desk` → the Sep 24 desk's own. *Pipeline:* 0 `awaiting-cos`, 0 `awaiting-mo`.
  **Applied, `bfeb3b6` (deploys):** (1) `/bowman-bangers`: `<title>`/og/JSON-LD said "Ranked and Priced Nightly" and "buy/sell signals", and og:image was the June card ("UPDATED JUNE · 47 prospects · who to target before prices spike", verified live R5). Now "Ranked on Sold Prices", the description is sold-basis with a Tuesday re-mark, and og:image is `og/x/board-latest.png`, so the link preview follows the weekly tape. Consequence: the Sep 29 Kim/`rawGuide` fix now reaches link previews too. (2) `/pokemon-30th-anniversary-2026`: the hero, buy-box fine print and footer said "No sold comps exist" beside the sold-basis TH26 block. Reworded so asks stay labelled as asks and TH26 is named as the sold basis. (3) The same page's buy box dropped the accessory tail (energy/acrylic/opened/sleeves/dice/protector) and anything under ½ MSRP. Re-run against production `/api/comps`: the ETB lowest ask went from **$19.99 (an energy pack) → $160.99**, 13 → 12 asks. Bundle and UPC unchanged. Live-verified ~14:55 PT; IndexNow 2 → 200.
  **Schedule:** X Desk Watch **re-enabled** and renamed "audit @shopcardhub feed + CoS queue" (next Sat 13:00 PT). R24 applies: the CoS now writes the posts, so the auditor has a job again. It was paused at 09:25 for "nothing to audit", before the noon change. The Oct 1 "Grok usage reset — restart plan" reminder was **rewritten**: it said to restart the vendor, which contradicts Mo's noon ruling. It now checks the watch, closes the probation, and restarts nothing unless Mo says so (the re-sign went through on the Mac).
  **Instruments:** `/feed/prices-latest.json` day 2026-09-25 (13:47Z), 41 cards, 36 numeric `last`, 40 `image.url`, 0 titles. `ga4-latest` 14:15Z (7.4 h): KE yesterday **4 on 23 sessions** (under 30, no FAIL); organic KE7 **10.78%** vs blended 5.57%; returningShare7 3.91%; clicks7 **28** (buy-strip 7, buy-box 2; was 36); `track_card_from_page` 0, `newsletter_signup` 0; bots: botShare7 **48.1%** (Singapore 117 @ 0.05 s, China 22 @ 0.32 s), clean 150 sessions / KE per 100 18.67 vs raw 9.69. Mobile QA (iPhone 13, beacons aborted), on / · /watchlist · /bowman-bangers · /destined-rivals-index · /cooper-flagg-rookie-cards: all 200, scrollWidth = innerWidth (390), 0 console errors, photos 100% after scroll. `/bowman-bangers` is **25,720 px** on a phone (was 42,722; the phone fold landed).
  **Ideas:** today's two were already ruled by Mo. No `/api/comps` supply claim to measure.
  **Not done, carried to the Mon Sep 28 desk:** the Pristine basketball release-day flip (needs a named-source street date + config) and the Content Editor queue. Both have been carried since Thu. Reason: the run's time went to the queue FAILs and three public-claim fixes, and each editor item needs its own R5 re-read. Wednesday's weekly takes whatever Monday doesn't finish.
  **Stumbles:** the Mac bridge dropped once mid-run. The clone survived and the run carried on. `list_triggers` output was too large for the tool result and was parsed from file.
  **Pushed:** `bfeb3b6` (site, deploys), plus this docs commit (STATE + NEEDS-MO + LANE-RULES + pipeline.json; no deploy).

- **Sep 25 ~09:30–13:00 PT (CoS, Mac-linked, Mo in chat, "3 hours non stop").** Pushed `a1b06c9` (Bid buttons, TH26 action column, auctions cache), `84398aa` (you-strip, nav badge, level-first on phone), `53da612` (Friday lane patch + Holliday ruling), `0f18ac2` (weekend X images). Gates at baseline on every tree. **Weekend X batch queued** (9 posts, native scheduler, verified in the Scheduled list); the first capture path (shopcardhub.com PNG → screenshot) uploaded a 2/3-frame image with black padding — pulled before scheduling, re-done via the artifact host. Mo's asks answered: no unattended weekend posting, no game commentary. **All four "next up" items shipped the same afternoon** (`76bf3d4` Bid buttons on the Bowman pages; `7e85ec2` home return panel · /indices Open buttons · Bangers phone fold), plus `d19109a` (make.py engine-column fix, regenerated tape). Rendered at 1280/390 with the live auction feed mocked in; gates at baseline on every tree. **Monday Sep 28 check:** the home return panel shows index moves only once a re-mark lands after a visitor's stamp — verify on a browser that visited today.
- **Sep 25 ~05:30–09:30 PT (CoS, Mac-linked, Mo in chat).** Strategic review written and filed (Project `claude/cos/strategic-review-2026-09-25.md`, 25 competitors surveyed, live-site read); Mo approved all of it. Built from a fresh HTTPS clone in the cloud sandbox, pushed from the Mac deploy-key clone: `7b1dbe4` (home index board · Vault→Watchlist · index charts · accent fix), `8ae7a74` (/blog + preview folded · idea #39), + the docs commit. Gates on every tree: audit-prices 0/76 · audit-site 0/3 · audit-terminal 0/0 (`--feed data/feed`). Rendered and checked in headless Chromium at 1280 and 390 px: home (no horizontal scroll, screens fold opens on a rail click), watchlist (simple ↔ advanced toggle), DR25/BOW26/PF25 charts (0 page errors). **Stumbles:** first index-chart cut had a paren slip (caught by `node --check` before render); BOW26's chart landed inside the hero grid on the first insert (moved). Later the same day: TH26 built and pushed (see the NOW table). Not done today: consolidation batch 2 (needs GA4 per page — work order above), the hub's 30th ETB row Amazon link (30th page only shipped), `make.py levels` still lists Pokémon tickers only (correct under R20 until Phase 2).

- **Sep 24 ~18:00–20:30 PT (CoS, Mo in chat: price his cards on sold data, "fold that into a github automation for all users of the site nightly").** **Sold catalog shipped (see commit):** `tools/price-engine/sold-marks.mjs` reads SportsCardsPro/PriceCharting item pages headless (via `www.pricecharting.com/game/<path>`, which redirects sports to SCP and answers a plain fetch; SCP *search* 403s headless, so resolution needs Chrome or the console listings) → `data/feed/sold-marks.json` + `sold-history.json`. Mark = 30-day median of ≥3 dated sales, else 90-day median of ≥2, else none. Never asks (R20); dates/prices only, no titles/sellers (R17). **Nightly:** new step in `price-snapshot.yml` (continue-on-error, 60 min cap), files copied into `data/feed/` with the rest. **Catalog `data/price-universe.json` = 448:** 10 Bangers autos + 289 Pokémon set-index basket cards (`site:*`) + 149 of Mo's cards (**Mo ruled Sep 24: his card names may sit in the public catalog; no qty/cost/COMC data**). Mo's cards are matched in the Vault by an FNV-1a hash of the lowercased COMC card string (`h`) — the string itself is never published. First read: 346 of 448 priced; of Mo's 162 resolved cards 60 carry a mark (the rest have <2 sales in 90 days — honest blanks). **Vault:** sold link outranks an ask link; a sold-linked card's series is sold-only (COMC asks parked in `priorPrices`, restored on unlink); Last shows a green ˢ with the basis on hover; the sold catalog still loads when the ask feed is down. Resolution tools: `tools/price-engine/universe-pokemon.mjs` (Pokémon, headless), SCP console POST paging for sports (the form POSTs to sportscardspro.com directly; a POST to pricecharting.com is redirected to a GET and loses the cursor). Of Mo's ≥$2 cards 163/220 resolved; 55 unresolved (big-console caps, parallel naming gaps) + 2 dropped as unsafe (Opening Day variations). Gates 0/76 · 0/3 · `--run-tests` 0/5.

- **Sep 24 ~15:30–17:15 PT (CoS, Mac-linked, Mo in chat).** Mo: make the Vault the Seeking-Alpha-style lifeblood and grade players like SA factor grades — "start it now and do all the bangers". **Shipped `a8e14a1`:** Scouting Grades v1 — `tools/build-grades.mjs` + `data/grades-inputs.json` → `data/grades.json` + generated `GRADES` block on `/bowman-bangers` (all 10 names; Pedigree 20 · Performance 25 · Path 15 · Momentum 15 · Value 15 · Liquidity 10 → Hub rating; SCP dated solds of the raw #CPA auto, MLB Stats API 2026, MLB Pipeline Aug 13). Grades describe, never calls. Vault: Hub column (exact graded card only) + **wrong-card link fix** — auto-link needs card-number + Pokémon-set agreement, `revalidateAutoLinks()` undoes bad links on load (Mo's DRI #213 UR was charting another set's Mewtwo SIR → +511% / 7.3% top weight; Sapphire Bazzana on the Chrome base feed → −89.7%); 5D header states its coverage. Gates at baseline (0/76 · 0/3 · 0/0; `--run-tests` 0/5). Detail: Project `claude/cos/scouting-grades-v1-2026-09-24.md`.

- **Sep 24 14:14–~15:05 PT (CoS · desk, Mac-linked, unattended).**
  HEAD `2245054` · origin/main `2245054` at start · gates **0/76 · 0/3 · 0/0** (`--feed data/feed`) = baseline; same on the pushed tree, no WARN delta. Read LANE-RULES R1–R24 from a fresh deploy-key clone. **Prompt drift (file wins):** the prompt reads prices/GA4 from raw.githubusercontent (R19: `/feed/` + a `price-data` clone), omits the R24 `gate-watch` check and the R15 heartbeat, and scopes the inbox to "since the last desk run" (now widened, below). Open `gate-watch` issues: **0**. Heartbeat (`--since 2026-09-23`): 3 due, 0 missing.
  **Inbox (since Sep 23 14:08 PT), 29 items, all ruled:**
  *Project:* `integrity-watch-2026-09-24` + proposals (6) + `mo-approval-2026-09-24-integrity-watch` (Mo: "tell him I approve", relayed) → the 8 Sep 19/20 items that never reached the ledger were entered with the 6 new ones (14 ledger rows, `decidedBy: mo`). **Applied `80eac88`:** `iw-2026-09-19-1` FAIL (engine blocks: "Hammer med"/"What buyers paid" → "Median last bid · a floor"/"Auction bid watch" at the generator + 8 guide pages, "% vs ask" dropped from `js/engine-block.js`; string swaps only, no block re-generated, so no new ask mark under R20) · `iw-2026-09-20-1` FAIL (`/best-football-cards-under-50` Deep Dives removed; $1,349 now only inside the withdrawal) · `-19-2` (Definitive strip `live:false`) · `-19-4` (`/indices` meta/JSON-LD six of eight) · `-24-3` (`/how-prices-work` ×4) · `-24-4` (Pristine baseball "$800+ secondary"/"week one") · `-20-3` (board keywords + 3 prose lines → 1st Bowman Chrome Auto). **Queued:** `-24-2` board ranks on the SCP guide value but says "last printed sale" → Tuesday lane Sep 29; `-20-2` GA4 unsettled day, `-24-5` US sessions −55% since Sep 19 (investigation, no cause claimed; Bing by day at the Sep 30 desk), `-24-6` nightly counts log → Sep 30 weekly. **Closed:** `-19-5` (resolved on the page), `-19-6` (superseded). `-24-1` applied as a standing rule (below). `x-desk-watch-run-2026-09-24-1300` + `…-ESCALATION-to-desk` → **already handled** by the live CoS session with Mo (~13:30–13:50 PT): Mo ruled the Charizard post stays, probation runs to Sep 30, Editor agent approved with five changes, delivered 13:48. The desk did not re-send. Its inward notes (PF25 "first Monday re-mark (09/21)" stale on the page; `indices.json` file-level `updated` read as a mark date) → queued to the Monday lane Sep 28 (the PF25 page line) and the Sep 30 weekly (a per-index `markedAsOf`). `x-voice.md` → the live session's; read, adopted as the X Desk Watch grading file. `vendor-brief-2026-09-23-voice-reset` + `-volume-up` → sent by the CoS Sep 23 15:42/15:50 with Mo in chat; recorded here, no action. `epn-read-2026-09-23` → already recorded.
  *Mac folder:* `x-desk/vendor-brief-2026-09-23-probation.DELIVERED-2231PT`, `-2026-09-24-writing-standard.DELIVERED-1052PT`, `-2026-09-24-editor-role.DELIVERED-1348PT` → all delivered by the CoS with Mo; nothing undelivered. `x-desk/watch-2026-09-24` + `scorecard` → same as the Project filing, corrected by the escalation. `x-desk/overnight-like-check-2026-09-24` → read; ON PACE (27 likes / ~4 h), 1 off-brand like (auction promo), no action. `crawlable-copy-2026-09-24` (commissioned build session, pushed `8e37b8a` + `2245054`) → read; its 5 `awaiting-cos` rows **ruled:** `ccx-1` **ratified** (nightly bake of `/` keeps served = hydrated until Oct 7; Friday desk checks `feed: nightly 2026-09-25` contains `index.html`), `ccx-2` **hold** (engine blocks stay dated Sep 18, **Monday lane: do not run `build-engine-blocks.mjs` Sep 28**; replaced Oct 7), `ccx-3` queued to the Tuesday lane Sep 29 after `-24-2`, `ccx-4` declined, `ccx-5` closed. `comc-trader/*` + `comc-inventory-2026-09-24.csv` → Thursday trader's own (R13 secondary; recs are Mo's to act on at will), read, no action. `chief-of-staff/*-mirror-2026-09-23-desk`, `epn/epn-customid-…csv` → the Sep 23 desk's own. *Pipeline:* 5 `awaiting-cos` (the ccx rows, ruled), 0 `awaiting-mo`.
  **Delivery:** none owed — every vendor brief is `.DELIVERED`. The escalation's optional one-liner (db3rdand11 reply-back; "Friday is the first batch under the writing standard") was **not sent**: a live CoS+Mo session was working the Grok Bot app at run time (`x-voice.md` written 13:35 PT) and two voices in one DM is worse than one line late. **Carried to the Friday desk**, which also grades what the vendor owes: the Editor charter (due 17:00 today), the first daily plan (09:00 Fri), and three answers (voice tool + start date, browser-access root cause, where 4 of Sep 23's 5 afternoon replies went). A miss counts toward the Sep 30 probation verdict.
  **Instruments:** `/feed/prices-latest.json` day 2026-09-24 (13:34Z), 41 cards, 36 numeric `last`, 40 `image.url`, 0 titles, HOLD 30 / SELL 9 / BUY 2. `ga4-latest` 13:52Z (7.4 h): KE yesterday **0 on 23 sessions** (provisional row, < 30 sessions — no FAIL); organic KE7 **13.45%** vs blended 6.29%; returningShare7 3.99%; clicks7 **36** (was 44); bots: botShare7 **47.32%** (Singapore 136 @ 0.152 s, China 23 @ 0.301 s), clean KE/100 sessions 20.34 vs raw 10.71; US sessions/day 38 · 33 · **16 · 17 · 16 · 17 · 14** (the `-24-5` step holds). Mobile QA (iPhone 13, beacons aborted): / · /watchlist · /bowman-bangers · /destined-rivals-index · /cooper-flagg-rookie-cards all 200, scrollWidth = innerWidth (390), 0 console errors beyond the aborted gtag, photos 100% after scroll (home has none at rest). `/bowman-bangers` 42,722 px (open P1).
  **Not done, carried:** Pristine basketball release-day flip (street date + config not verified against a named source this run; the page's meta already reads "Releases Sep 24") → Friday desk. Content Editor queue → Friday desk. Ideas: not due (Thursday).
  **Stumbles:** the first heartbeat call passed a comma list where the tool wants a file (ENOENT); re-run with a file. The first mobile-QA launch pointed at the wrong Chromium path; re-run clean.
  **Pushed:** `80eac88` (site, deploys; live md5 matched on 3 pages, every changed string verified live; IndexNow 15 URLs → 200), plus this docs commit (pipeline.json + STATE + NEEDS-MO; no deploy).

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
