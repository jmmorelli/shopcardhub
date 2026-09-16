# CoS state — read at the start of every run, update at the end

> **THIS FILE IS IN GIT (since 2026-09-16, evening).** It used to exist only as a claude.ai
> Project doc, which meant LANE-RULES R4 — "read STATE.md before recommending channel or
> infrastructure work" — required lanes to read a file they could not open. Filed by the site
> auditor as `audit-2026-09-16-3`; accepted; that was the CoS's error, not the lanes'. **The repo
> copy is canonical. The CoS mirrors it into the Project doc in the same run. No other lane writes
> either copy.**
>
> **STEP 0 IS `/LANE-RULES.md` AT THE REPO ROOT, FROM A FRESH CLONE.** Precedence: Mo in chat →
> LANE-RULES.md → CHARTER + this file → your task prompt. R1 repo boundary · R2 staleness gate
> (now a *refusal*, with a mandatory freshness header) · R3 never re-add what Mo deleted · R4 read
> STATE before recommending channel/infrastructure work · **R5 verify live before filing** ·
> **R6 check the ledger — re-filing a settled item is a defect** · **R7 an absence claim requires
> a fresh clone.**

## GATE BASELINES (re-stated 2026-09-16 evening — the old numbers are dead)

| Gate | FAIL | WARN | Composition |
|---|---|---|---|
| `tools/audit-prices.mjs` | **0** | **62** | 34 `no-machine-stamp` · 25 `non-numeric-price` · 3 `stale-prose-stamp` |
| `tools/site-auditor/audit-site.mjs` | **0** | **3** | `first-bowman-unverified` ×3 |
| `tools/audit-terminal.mjs` | **0** | **1** | `feed-unavailable` (expected without a price-data clone) |

The jump from WARN 29 → 62 on audit-prices is **three new checks shipped 2026-09-16**, not drift.
34 pages carry a price table with no `data-prices-updated` attribute; that is a real backlog and
it is why `/roy-watch-2026` aged four months without ever being flagged stale. Any lane comparing
against `29/3/1` is reading a stale baseline.

## NEW GATES (2026-09-16 evening, all negative-tested)

- **`audit-prices` check 7 · `sold-provenance` (FAIL).** A graded figure may not be labelled
  "sold". It reads `(N dated sale)` or `No verified sale`. *A price-guide row is not a sale.*
- **`audit-prices` check 8 · `ask-in-price-slot` (WARN).** A price slot within 250 chars of
  auction / bid / BIN / ask language.
- **`audit-prices` check 9 · `no-machine-stamp` (WARN).** A price table with no
  `data-prices-updated` is invisible to the staleness check.
- **`audit-terminal` · `home-index-level` (FAIL).** For every `status: live` ticker in
  `data/indices.json`, the baked `HOME:markets` row must match the latest history level within
  0.005, and no page may still label a live ticker "(pre)".

**Why these exist:** on 2026-09-16 a build session published modelled SportsCardsPro grade-ladder
figures as sold comps on three pages, and **all three gates passed FAIL 0**. They check that a
price cell is numeric and stamped. Both were true. The numbers were still not sales.

## THE GRADED-LADDER INCIDENT (2026-09-16) — closed, with the lesson kept

`d038ef3` rewrote `/ethan-holliday-rookie-cards`, `/aiva-arquette-1st-bowman` and
`/roy-watch-2026`. **Mo challenged the Holliday auto figures; the build session re-checked and
self-reported a material defect against itself.** SportsCardsPro shows a *grade ladder* (partly
modelled from comparable cards) and a *sales table* (dated eBay records). It read the ladder,
published it as "(sold)" / "SCP Sold Index", and never opened the graded sales tables.

- `#CPA-AA` was published as PSA 9 $105.11 / PSA 10 $126.00 with a "$21 gap, no grade-up trade"
  argument. The real graded sales table holds **two sales**: PSA 8 $41.00 (Aug 13) and PSA 10
  $76.00 (Aug 21). **There is no PSA 9 sale at all.**
- `#CPA-EH` was published as PSA 10 $720.00 in the stat banner with a "6.7× raw" multiple.
  That grade has **exactly one sale ever, Aug 6 2026** — 41 days before publication.

**Mo's ruling: strip and re-mark, not revert** (a revert restores a page that was off ~45× on
base raw). Applied the same night: every untraceable graded figure now reads **"No verified
sale"**; the two cards with real graded sales carry them labelled `(N dated sale)`; 21 graded
tails stripped from `/roy-watch-2026`; the derived arguments are gone; all three disclosures now
state that graded figures appear only where a dated sale record was read.

`audit-2026-09-07-4` and `audit-2026-09-02-2` are **back to `approved`, not `applied`** — the raw
half stands, the graded half is not closed until a proper pull of the SCP **graded sales tables**
lands. That pull is a queued build item, not a lane.

**Card identity ruled (this dissolves the escalation's open question): Holliday has three cards
and they live in two different sets.** `#CPA-EH` (1st Bowman Chrome Auto) and `#BCP-1` (1st
Bowman Chrome base) are in **May's 2026 Bowman**. `#BCP-209` is the **returning** base Chrome in
**September's 2026 Bowman Chrome** — no 1st logo. Both the guide and `data/watchlist.json`
(`ethan-holliday-bcb26-base` = `#BCP-209`) were correct; the guide's own copy said "two cards
carry the Holliday name in 2026 Bowman Chrome", which is what made them look contradictory. Fixed
— the guide now names all three cards with their sets.

## SITE AUDITOR — PROBATION (2026-09-16, Mo: "on thin ice")

**Not retired. Restructured, and on a two-run probation.** The lane's judgment is sound; its
inputs were broken, and the CoS broke them.

*What happened:* the 2026-09-16 MWF report filed five findings. **Three were wrong and all three
failed the same way — it reasoned from a mount nine commits behind `main`.** A HIGH that the
commissioned build session had fixed five minutes earlier; a clone/ledger risk the CoS had
accepted, backed up in full and downgraded MED→LOW the day before; and a WARN inside the CoS's
own stated gate baseline. It also asked the CoS to rule a question already ruled in writing. The
**revised** report then added a fourth of the same kind: it stated `/LANE-RULES.md` does not
exist in the repo. It has been at the root since `728c6e5`.

*What the lane got right, and it is not small:* it self-corrected under challenge and withdrew
its own findings rather than defending them; its two surviving findings were real, live-verified
and both shipped tonight; **one of them exposed a genuine hole in the wiring gate**; and its §6
diagnosis — that the read-state rule was unenforceable — was correct and is now fixed. Its own
`+3 WARN delta` check is adopted as standing doctrine for every lane.

*Terms, effective the next MWF run:*
1. **No mounted clone, ever.** Fresh clone at STEP 0, or the run does not file.
2. **Freshness header is the first line of every report** (R2). No header, report not read.
3. **Every finding re-verified against the live URL immediately before filing** (R5).
4. **Every finding checked against `data/pipeline.json` and this file before filing** (R6).
5. **No absence claim without `git ls-files` in a clone taken this run** (R7).
6. **Probation: two runs — Fri Sep 18 and Mon Sep 21.** Measured on one number: wrong filings.
   A filing counts as wrong if it was already ruled, already fixed, or sits inside a stated
   baseline. **Bar: zero.** Two clean runs and probation lifts.
   **A third run with a wrong filing from a stale or unverified input and the lane is retired** —
   its deterministic sweep (`tools/site-auditor/sweep.mjs` + the three gates) folds into the
   Wednesday weekly, which is where the judgment already sits. The sweep is worth keeping; a
   second opinion that has to be fact-checked is not.

*CoS accountability, on the record:* the read-state rule was written requiring a file lanes could
not open, and the mount was known to be stale by construction (LANE-RULES R2's own text says so)
while lanes were still allowed to file from it. Both are fixed above. **Three wrong findings is a
lane failure; a rule that cannot be complied with is a CoS failure. Both happened.**

## TOP 3 PROBLEMS IN THE BUSINESS (Sep 14 Business Read; problem 1 re-framed, problem 3 amended Sep 16)

1. **Google is 4% of a search channel that already works — a links problem, not an indexing
   emergency.** 7-day search sessions: **Bing 137 · Yahoo 40 · DuckDuckGo 23 · Google 10 ·
   Ecosia 2**, and Yahoo/DDG/Ecosia are substantially Bing-fed — ~200 of 212 search sessions come
   from one index that is already crawling and sending real users. GSC: 3 indexed / 74 not (23
   crawled-not-indexed, validation Started; 51 discovered-not-crawled). Bing: sitemap Success, 77
   URLs, IndexNow wired. **GSC indexing-request quota stands down to zero routine spend.** The
   Google lever that remains is **links** — the two link-earning posts on Mo's queue.
   **Technical SEO is CLOSED — do not re-litigate.**
2. **Release guides land but do not convert.** 28d: pokemon-30th 159 sessions / 10.7% KE;
   `/bowman-chrome-baseball-2026` 69 / **0.0%**; `/bowman-football` 71 / 1.4%; player pages
   10–13%. BCB26's first data row sits 4,392px down on a phone. **pokemon-30th streeted Sep 16 —
   its release-day framing was fixed the same evening (`audit-2026-09-16-2`); the engine block +
   fold is still the week's biggest single lever.**
3. **GA4 pollution persists (Singapore) and returning is flat.** 7d: Singapore 57 users (+21%);
   this run's own sweeps proven clean, so it is another agent path or a scraper — next
   Chrome-linked daily reads its landing pages/devices. **The standing retention number is the
   ORGANIC-CHANNEL key-event rate (8.1%)**, reported beside the blended figure, never instead of
   it. The IP-based internal-traffic filter is P2, re-scoped to hostname + known agent signature.

## GOVERNANCE (Sep 16 — the day doctrine left the prompts)

- **`/LANE-RULES.md`** (repo root, `728c6e5`) is standing doctrine, read at STEP 0 from a fresh
  clone, and it **outranks a task prompt**. Amended the same evening: R2 hardened into a refusal
  with a mandatory freshness header, and **R5 / R6 / R7 added**.
- **Prompts fixed the same day.** Both cloud CoS tasks rewritten — the weekly still carried
  "Never push" from Sep 1, dead since Mo's Sep 2 authority grant. **Mo added the STEP 0 pointer to
  the four desktop-local lane prompts himself** (`chief-of-staff-sunday`,
  `shopcardhub-weekly-trend-scan`, `bowman-bangers-tuesday-update`, `shopcardhub-site-auditor`) —
  those live in the Claude desktop app and cannot be driven by the scheduled-task API.
- **`awaiting-mo` is reserved for things physically Mo's** — a sign-in, money, a credential.
  Everything else is `awaiting-cos` and gets decided, not parked.
- **The PAT is gone.** Revoked in GitHub with Mo present Sep 16, after confirming it was not
  Vercel's credential (that is a separate fine-grained PAT, `shopcardhub-track-signal`).
  **The `auto` deploy key is now the only push credential. Never ask Mo for a new token.**
- **Auditor filings adjudicated (Sep 15 set):** seven rulings pushed as `92288fa` + `d1d08a7` —
  ledger risk accepted and retired, discovery re-weighted, key-event metric moved to
  organic-channel, noindex split (`/research` comes in; the 21 `/card-*` pages and `/cards` stay
  out with a dated review at the W3 checkpoint, Oct 5–11, Bing-first if they go), name spelling
  ruled (Topps + MLB.com decide human-visible copy; the eBay query keeps both spellings; the URL
  moves with a permanent redirect; **the internal watchlist id is FROZEN**), signal capture
  approved.

## RETURN-USER PROGRAM (Mo, Sep 15 — response to the outside UI/UX audit)

All 14 audit rows to at least B+; "a C grade is not passing." Plan:
`claude/cos/audit-response-2026-09-15.md`, Sep 15 → Oct 26, outside re-audit Nov 2. Overall
C+ (72) → B+ (88). **Approved in full by Mo**, with one directive added: the dashboard must
genuinely read like Seeking Alpha, and the left-rail **Portfolios** section must hold **multiple
named watchlists**. `js/vault-schema.js` v2 renders every named *owned* portfolio but pins
Hunting to one list — **schema v3** extends `listId` to `status:'watch'` cards, lossless
migration, N named watchlists, and ships **before** Vault sync so the sync never merges across
schema versions.

- **W1 (Sep 15–21) = findability:** card-level search index (site search indexes nav labels only
  — **zero cards are in it**); `/coverage` + the `<h1>`/`<title>` universe fix; sticky 4-item
  phone bar; the remaining **72 in-body COMC promo units on 93 pages**; ★ Track on `/auctions`.
- W2 `HOME:mine` return screen · W3 rail sitewide + nav collapse to 4 + Research · W4 Vault sync
  code · W5 Signal Alerts · W6 harden + re-grade.
- **Vault cross-device sync — APPROVED:** 6-word code, AES-GCM in the browser, blob keyed by
  SHA-256(code) via a new `/api/vault-sync` on a `vault-data` branch; no new vendor, no spend;
  conflict handling ships with v1; 256 KB cap, rate limit, 90-day TTL. Builds W4 (Oct 6–12).
- **Triggered "Signal Alert" email — APPROVED:** same MailerLite list/sender/unsubscribe, max one
  send per day, real crossings only, every send logged here. Builds W5 (Oct 13–19).
- **Freeze through Oct 26:** no new sports verticals, no new guides for sets not on the tape, no
  new nav items, no supplies/gear folds on player pages.

## SECTOR-MODEL SET INDICES (Mo, Sep 15)

**One Pokémon set = one sector ETF** — the index holds *every* card in the set; nobody hand-picks
constituents; the page prints both counts. Four fixed parameters, all Mo's: **liquidity screen 6
clean single-card sold comps / 30 days to enter, stay in at 4** (hysteresis) · **25% single-card
cap** · **quarterly reconstitution**, first Monday of Jan/Apr/Jul/Oct, announced the Monday
before · **twice-weekly marking**, because SE(skew) ≈ √(6/n) and SE(kurtosis) ≈ √(24/n) and
weekly gives n≈52/yr. **Forward-start, no backfill.** Rulebook published before the first mark:
`claude/cos/sector-index-rulebook-2026-09-15.md`.

**SV151 IS LIVE** — activated Sep 15. `status: live` · inception 2026-09-15 · base **100** ·
divisor **19.0946** · basket **$1,909.46** · **202 constituents of a 207-card universe**. Basis
ruled by Mo: **screen AND mark on PriceCharting's blended ungraded sold list, whole set** —
"consistency is huge", matching DR25 and PRIS25. 25% cap bound nothing (Charizard ex #199 largest
at 18.59%). Screen 202 PASS / 5 FAIL / 0 errors. Comp source mix: eBay 53.8% / TCGplayer 46.2%.

**The pre-registered prediction was wrong, and that is the most important line in this block.**
It said 55–70 constituents. The answer is 202. **The cause is identifiable:** PriceCharting's
ungraded list blends eBay and TCGplayer, and TCGplayer is a singles marketplace where commons
genuinely trade one at a time at $0.15–$0.60. Counting eBay rows only, 75 of the 202 would have
cleared. The screen was not too loose; the assumption about the source was too narrow. Published
on the live page next to the original prediction.

**Two limitations, neither blocking.** (1) PriceCharting caps its ungraded tab at 60 sold rows
and 141 of 207 cards hit that cap — it censors *rows shown*, not the clean counts, so pass/fail
at 6 is unaffected, but **a clean count is not a volume measure and must never be used as one.**
(2) PriceCharting's headline ungraded figure tracks our own median of clean comps within ~2%
above Rare but runs materially higher on cheap commons — immaterial to the level (the 123-card
cheap tail is $69.52 = 3.64% of basket; marking the whole basket on clean medians reads 99.19 vs
100.00). Both figures stored per row. Methodology question, parked with Mo.

**Rollout:** the sector model pays off on **mature** sets only. Current-release base cards have
no singles market yet. Measure first — run the screen against one current set's base cards before
converting anything — and freeze any tier series as a closed record rather than letting a live
index silently change what it measures.

**Tooling:** `tools/build-sv151.mjs` (+ README). Reuses the engine's `verifyListings()`
unmodified plus three documented SV151-local rules. The page renders from `data/indices.json`
through five marker regions — **generated, never hand-edited**, and deliberately not the regex
table surgery `tools/remark-indices.mjs` performs on the other index pages, which has already
caused one production corruption.

## BCB26 — KEEP (Mo, 2026-09-16)

The Monday Scan lane activated BCB26 on Sep 14 (`0a2a6ef`) against the CoS weekly's "do not
force" ruling that morning — two lanes on different gates. The 09-14 feed improved enough that
the activation was defensible on the data, and **Mo ruled KEEP**. Inception 2026-09-14, base
100.00, divisor 0.8296, AUTOS 15% cap via fractional units, CPA-LH unpriced. Re-marked 09-15 to
**95.67**. Same commit repaired `/destined-rivals-index`'s TOTAL row, corrupted live Sep 7–14 by
a `remark-indices.mjs` capture-group bug that no gate caught.

**Resolved the same evening:** the home Markets panel was baked at 100.00 while the index page
served 95.67, and nav/rail still labelled BCB26 "(pre)" on five pages. `build-home.mjs`,
`build-nav.js` and `build-rail.mjs` re-run; `audit-terminal`'s new `home-index-level` check now
FAILs on exactly this.

## TERMINAL PROGRAM (Mo, Sep 11)

`/` is the dashboard; hosts folded; portfolios in the Vault; rail on 5 pages. Steps 1–4 +
hotfixes LIVE. Sep 13: sealed rows on the 5 Pokémon indices, index heroes, 9 BCB26 card pages.
**Step-5 scope:** bowman-bangers (38.2 phone screens) + the two Bowman release guides;
`/auctions` phone fold; **teach `build-auctions.mjs` the step-4 rail/shell wrapper — regenerating
`auctions.html` today strips it**; unify `home.js` `-bcb26-` routing; 11 host-less `/card-*`
pages fold-or-301; retSkew/retKurtosis nightly; Topps Update page (held, no street date); home
stat-band sub-11px micro-text.

## STANDING RULES

- **Pricing integrity (hard rule):** never publish `$$`-style placeholders; every price is a
  numeric sold-comp figure with a dated stamp; **and, since 2026-09-16, a graded figure must name
  how many dated sales are behind it or read "No verified sale".**
- **1st Bowman rule (Sep 9):** `tools/first-bowman.mjs` must be clean before any push touching
  `data/sets` or a Bowman page. Three `first-bowman-unverified` WARNs remain and are **an
  accepted baseline, not a backlog** — clearing them needs `firstAudit.externalPriors`, i.e.
  checklists outside `data/sets`, which none of the three has. The sweep keeps raising them; do
  not re-file them as findings. *(The auditor's question, answered.)*
- **EPN compliance (closed Sep 3):** visible "eBay" label; never self-click; every off-site link
  carries `customid=`.
- **COMC (Mo, Sep 16):** no COMC position of Mo's appears on any public surface. The nav CTA is
  removed sitewide (`357c02a`); the footer column and the affiliate-disclosure mention stay. **The
  CoS's own proposal to flag owner-held cards on the board is VETOED and must not be re-proposed.**
  Consequence on the record: the engine's gating, the confidence floor, `/track-record` and the
  published sell rulebook are now the *only* discipline on an affiliate-paid signal engine, so
  they are load-bearing and no lane may soften them.
- **Push/deploy:** fresh `git clone` over SSH with the `auto` deploy key into scratch → edit →
  three gates there → commit with `Task-key:`/`Authority:` trailers → `fetch` +
  `merge-base --is-ancestor` → push → `ls-remote` → curl the live artifact → IndexNow → pushLog
  entry. **Never work in Mo's clone.**
- **Consoles:** GA4 = Browser 2 (`a397485386p541047014`); GSC + Bing = Browser 1; **MailerLite is
  signed in on the Chrome profile "jmichaelmorelli"** — the "signed out" read was the wrong
  profile. Bing Webmaster is VERIFIED and read weekly — **do not re-propose setting it up.**

## OPEN ITEMS (auto-approved, for agents) — ranked

- **P0 — the graded sales-table pull.** Re-open the SCP **sales tables** (not the ladder) for
  every graded tier still reading "No verified sale" on the three rewritten guides, and publish
  what is actually there. Chrome fetch path only (sandbox curl = Cloudflare 403). This is what
  keeps `audit-2026-09-07-4` and `audit-2026-09-02-2` at `approved`.
- **P0 (Wed build session) — the Sep 16 rulings that are one build each:** `/research` becomes
  indexable; restore the signal-keyed `newsletter_signup` capture on `/` (prerequisite for the W5
  alert tier — we do not ship an email tier we cannot measure); board-name spelling; the two
  price-exception rows whose prose contradicts an applied mark.
- **P0 — pokemon-30th release-day conversion.** Framing is fixed; the **engine block + fold** is
  not. #1 lander.
- **P0 — finish the clone sync (CoS-owned).** Ledger already safe at
  `Card Hub/ledger-backups/2026-09-15/`. Left: delete grant on the mount, stale `.git/index.lock`
  sweep, fast-forward, restore `data/calls.json` from backup. **Do NOT half-run it.**
- **P0 (W1) — card-level search**, **coverage honesty** (`/coverage`, new `<h1>`/`<title>`, a
  "not marked — here's what is" line on every off-tape guide), **sticky 4-item phone bar**.
- **P0 (Content Editor) — execute Mo's Fischer ruling ("engine wins", Sep 15):** rewrite the
  `/bowman-bangers` "Verdict: Buy — the re-entry" to the engine's gated no-call; the Sep 7
  Scorecard line stays on `/track-record` disclosed as superseded. *(This forbids a **stale**
  verdict standing against a current gated call; a dated, reasoned prospective desk call that
  disagrees with the engine was never forbidden.)*
- **P1 — the 34 `no-machine-stamp` pages.** Add `data-prices-updated` to every page with a price
  table, oldest-traffic-first. Until then those pages cannot go stale in a way anyone can see.
- **P1 — report the organic-channel key-event rate as the standing retention number**, beside the
  blended figure, in the weekly scan and on the audit-response scorecard.
- **P1 (Terminal Builder) — step 5** (scope in `rooms/terminal.md`).
- **P1 (Pricing Integrity) — SV151 standing obligations:** twice-weekly `--mark` (a missed mark
  is a real loss of shape); **first quarterly reconstitution effective Mon Oct 5, announced Sep
  28**; the pending restatement to the eBay basis is a **logged divisor adjustment**, never a
  silent re-base.
- **P1 (Pricing Integrity, daily):** the "3-" card-lot auction in the wandy-base hammer book
  (TITLE_BAD misses "N-" lots); `luis-hernandez-auto` stays 0-verified by design (auction/
  redemption-only market — a mark needs a hammer basis, which is a **methodology question parked
  with Mo**); **gonzalez stale-flagged, last mark 09-11.**
- **P1 (tools):** `audit-comps.mjs` sealed-aware leak pass; `TITLE_BAD_SEALED` misses
  "Suprise"/comma-joined lots; **rendered-text integrity check in the sweep** (the DR25 TOTAL row
  was corrupt live Sep 7–14 and no gate caught it).
- **P1 (next Chrome-linked daily):** GA4 Browser 2 — read the Singapore cluster's landing pages
  and devices. **MailerLite from the "jmichaelmorelli" profile** — confirm the session, send
  `claude/recaps/tape-recap-2026-09-14.md`, read the subscriber count (last read: 6 subscribers,
  4 active, 2 unconfirmed).
- **P2:** phase 2 of the merge (set index level block onto each Pokémon set guide + 301 the four
  `-index` pairs, carrying the sealed rows); GSC validation watch (**watch only, no request
  spend**); Bing Site Scan; consolidation candidates; `/set-index-preview` 417px overflow;
  `roy-watch-2026` fringe-grid refresh; `ph:ah26-46` marker unresolvable; retire or port
  `tools/price-engine/newsletter.mjs`; Vault `+ New portfolio` `prompt()` → modal; share PNG
  renders whole vault; **the unattributed "Chrome #251 PSA 10 at $2,075" in the Flagg related-card
  blurb** (predates the graded incident, same class).
- **BASE tab activation (BOW26):** sourcing not started (≥60/100 BCP marks).
- **Weekly link-earning drafts:** `claude/recaps/link-post-2026-09-14.md` ready. Posting needs
  Mo — **and it is now the primary Google play, not one of several.**

## WAITING ON MO (see NEEDS-MO.md)

Only things physically his. **Off-site link posts** (human account; two drafts ready) · hammer
tape on Home? · two pricing-methodology questions parked (hernandez hammer-basis; SV151
clean-median vs headline) · personal per-subscriber alerts (parked, needs a PII decision).
**BCB26 keep/veto is CLOSED — Mo ruled KEEP on Sep 16. The graded-rows remedy is CLOSED — Mo
ruled strip-and-re-mark.**

## ROSTER CHANGES LOG

- **Sep 16 2026 (evening): site auditor placed on two-run probation** with five new filing
  conditions (see above). No agent created or retired. `claude/cos/STATE.md` committed into the
  repo. LANE-RULES R2 hardened; R5, R6, R7 added.
- Sep 16 2026: `/LANE-RULES.md` created (R1–R4 + three evidence rules); `awaiting-mo` reserved
  for things physically Mo's; the CoS is the sole adjudicator of findings.
- Sep 15 2026: **Sync & Alerts Engineer created.** Terminal Builder gains search/findability;
  Vault & Funnel gains the on-device trigger layer + since-last-visit digest; Terminal Product
  owns the weekly return-user scorecard; UX Auditor adds a ninth dimension, **Return-user system**.
- Sep 12: Bug Sweeper created. · Sep 11: Terminal Builder, Wiring Keeper, Terminal Product
  created; third gate. · Sep 9/8/7/4/3/1 as before.

## RUN LOG (most recent first)

- **Sep 16 evening — escalation review (Mo present).** Two escalations adjudicated; graded-ladder
  defect stripped and re-marked on three pages; BCB26 kept and the home/nav/rail gap closed;
  pokemon-30th flipped to released framing on its release day; four new gate checks shipped and
  negative-tested; STATE.md committed to the repo; LANE-RULES amended; site auditor on probation.
- **Sep 16 ~13:10 UTC — daily ops check (cloud, unattended).** Engine feed healthy (34 cards,
  31/34 numeric, 8 gated all HOLD, zero BUY/SELL on gated); Mobile QA 5/5 clean; origin verified.
  Flagged: the daily task prompt has drifted from the LANE-RULES cadence table (prompt carries
  only Engine Watch · Mobile QA · NEEDS-MO; the table also lists Pricing Integrity audit · Wiring
  Keeper gate · Bug Sweeper · §0 light read). **Per precedence the file wins — reconcile the
  prompt, or amend the table if the light scope is intended. Still open.**
- **Sep 16 early (Mo present) — governance day.** Seven auditor rulings; repo boundary ruled;
  `/LANE-RULES.md` created; both cloud task prompts rewritten; auditor charter swept; PAT rotated
  and revoked; ledger backed up.
- **Sep 15 — SV151 activated** (first sector-model set index) · Tuesday checkpoint (four
  autonomous writes clean; digest 4/4 delivered; board tweet queued at 4:30 PM instead of 2:00 PM
  on a staleness-recovery overrun — day kept, minute missed).
- **Sep 14 weekly:** §0 Business Read · full §4 audit + 103-page sweep + link crawl + 139-scenario
  suite · Pricing Integrity weekly · Photo Keeper (430 keys, 0 dead CDN links) · BOW26 re-mark
  99.21 · deploy `cb9d85a` + `6393b5f` · IndexNow 200.
- **Scoreboard (Sep 14):** Imagery 9 · Mobile 8 · Bugs 9 · Motion 8 · Vault funnel 8 ·
  Performance 8 · Identity 8 · Credibility 8.

## SOLD PRICES — building our own, free (Sep 3, `049180a`)

50+ closes. OBSERVATION ONLY until ~2–3 weeks of closes. The ask-over-hammer pattern is
persistent and two-sided (sports +31%…+162%, TCG +9%…+28%). Hammer tape on Home stays with Mo.
