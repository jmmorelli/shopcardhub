# CoS state — read at the start of every run, update at the end

## 2026-09-21 (13:30 PT) — THE CADENCE CUT. Mo: "we are running too many scheduled runs… causing issues with the site. Give me your honest assessment and fix it."

**The honest assessment: yes, and the damage was not to the pages — it was to the deploy queue and to
the lanes' own inputs.** Measured this run from a fresh clone and the scheduled-task list:

| Fact | Number |
|---|---|
| Standing LLM fires per week, Card Hub, before today | **~46** (36 cloud + ~10 desktop) — on a site doing ~230 clean sessions/week and ~$100/mo |
| Commits Sep 14 → 21 | **110**; **68 touched no public file** (STATE mirrors, ledger, specs, tooling) |
| Vercel builds those 68 commits queued | 68 — Hobby plan, one build at a time. The Sep 18 zombie build, the two stale older-tree builds queued *behind* the fix, and the skipped webhooks were this |
| What every lane reads at STEP 0 | STATE.md **128 KB** + LANE-RULES 24 KB + a 34–43 KB desktop prompt |
| Lanes whose job was auditing other lanes' output | 4 (MWF auditor · daily Integrity Watch · Wednesday full audit · daily ops) sweeping the same 103 pages |
| Wrong or stale filings this week attributable to lanes reading each other's stale state | Sep 16 auditor ×3 · Sep 18 X-desk FAIL overturned · daily-vs-table drift filed 5 runs running · Sunday brief: "three gate baselines in circulation" · STATE assumed Gengar ran today — **its task had been disabled since creation** |
| Dead scheduled work | `vercel.json` cron `/api/cron-snapshot` nightly 01:00 PT — throws `Missing PRICECHARTING_TOKEN` (Mo never paid), 500 every night, and is a second writer pointed at the exact `prices-latest.json`/`prices-history.json` the GitHub Action owns |

The site itself was not being hurt by *traffic* from the lanes: every Playwright/QA tool aborts the GA4 hosts
(`tools/qa/harness.cjs`, `sweep.mjs`), the cloud egress is US, and the Singapore/China clusters are not us. **The
harm was: deploy churn from docs commits, and lanes spending their runs reconciling each other instead of
moving a number.** More runs produced more reports about reports; none of the extra runs moved earnings, and
the one lane that actually builds — the Wednesday weekly — logged a **7-second run on its last fire** (Sep 17 06:08Z,
SUCCEEDED, did nothing) and nobody noticed because five find-and-file lanes ran fine around it.

**DONE this run (CoS authority, Mo: "fix it to how you think is best"):**

1. **Cloud tasks — 36 → 19 fires/week.** Integrity Watch daily → **Mon + Thu 05:00** (`0 12 * * 1,4`). Earnings
   Ideas Desk daily → **Tue + Fri 04:15** (`15 11 * * 2,5`) — 35 ideas in four days against one build slot a week is
   inventory, not ideas; Mo asked for daily on Sep 17 and can restore it with one word. X Desk Watch 13:30 + 17:30 →
   **17:30 only** (`30 0 * * *`) — one run sees the 09:00 post and both reply sweeps. **Gengar · conversion coverage
   DELETED** — never fired; its two commands (`site-auditor §15`, `buy-strip-health.mjs`) are the Wednesday weekly's.
   Unchanged: CoS daily 06:00 · CoS weekly Wed 11:00 · monthly Oct 1 · the Oct 3 football re-read one-shot. Cron-only
   edits — prompts were not blind-replaced, so a prompt that says "daily"/"13:30" is stale by the table (LANE-RULES
   wins, and says so).
2. **`vercel.json`: `ignoreCommand` → `tools/vercel-ignore.sh`.** A commit builds only if it changes a file a visitor
   can load; `claude/`, `tools/`, `.github/`, `data/pipeline.json`, `*.md` never trigger a build. Compares against
   `VERCEL_GIT_PREVIOUS_SHA` when present (so a docs commit still builds if the site commit before it was skipped by a
   missed webhook), falls back to `HEAD^`, and any git error → build. Self-tested on four recent commits (2 skip, 2 build).
   **The nightly `/api/cron-snapshot` Vercel cron is removed** (the function file stays; it is auth-gated and harmless).
3. **Desktop lanes — ruled, Mo executes (only he can edit those tasks):** **MWF site auditor RETIRED** (its sweep is in the
   weekly; its claims check is the Integrity Watch; probation moot). **Tue/Thu light CoS checkpoints RETIRED** (the cloud
   daily is that). Keep: Sunday brief (Mo reads it), Monday price lane, Tuesday board, Thursday trader, Friday
   release-window (off unless flipped), Dungeon Keeper (R12: cheap, stays). ~10 → ~6.
4. **LANE-RULES cadence table rewritten** with the cut and a standing rule: **a new lane needs a named number it moves
   and a lane it replaces; find-and-file lanes are capped at two.**

**QUEUED for the Wednesday build (Sep 23), in this order — not done unattended because they change what every lane reads:**
- **Split STATE.md.** A 128 KB file read whole by every run is the drift engine: a lane reads a 10-day-old block as
  current. Shape: `STATE.md` = gate baselines · standing rules · open items · waiting-on-Mo · cadence pointer · the last
  7 days of run log, **under 25 KB**; everything dated older moves to `claude/cos/STATE-ARCHIVE-2026-09.md` (grep-able,
  never read at STEP 0). Same for the 43 KB Monday prompt — its doctrine paragraphs point at LANE-RULES instead of
  restating it.
- Fold the Integrity Watch's Part A (instrument medians) into the CoS daily's prompt, since both read the same feed and
  the same `ga4-latest.json` — then the Integrity Watch is claims-only. Needs the daily's prompt text in hand (a full
  replacement, with pre/post copies in `Card Hub/chief-of-staff/prompt-backups/`).
- Watch the Sep 23 weekly's own duration: if it is another sub-minute run, the task is broken at the infrastructure
  layer and the fix is `fire_trigger` with a diagnosis, not a new lane.
- The Sunday lane asked (Sep 20 §7) to be folded into the Wednesday weekly. Not taken today; Mo reads the Sunday brief.
  Re-ask at the Oct 1 roster review with a week of the cut behind us.

**What the cut does NOT touch:** the nightly price engine (GitHub Action, no LLM), the nightly GA4 snapshot, the Mon/Fri
`price-audit` workflow, the three gates, any page, any price.

## 2026-09-20 (afternoon) — IDEAS #32 AND #33 SHIPPED. Mo approved both in chat: "CoS: please begin working on this, I approve."

Commit `7d0f85f`, pushed from a fresh Mac clone at `fef4f58`. Gates on both a fresh cloud clone and the
Mac clone: audit-prices FAIL 0 / WARN 60 (baseline 60) · audit-site FAIL 0 / WARN 3 (baseline 3) ·
audit-terminal FAIL 0 / WARN 0 with the feed. Live-verified 15:58Z.

**#32 — sealed-case links.** `case` in `data/buy-strip.json` renders one short text link, *"Sealed
cases →"*, after the box link, with its own `-case` custom ID. **It is a link, never a mark:** no figure
is rendered from it, nothing it returns reaches the price engine or an index, and the fine print says so.
That is the whole reason the site had no case link before — every sealed query carries `-case -lot`
because a case would corrupt a per-box mark, which is right for a mark and was wrong for a link.

**The measurement is the story, and two thirds of the idea did not survive it.** 26 sealed pages were run
through `/api/comps`; **13 cleared the 3-clean-listing bar and shipped, 13 were dropped** rather than
left pointing at nothing:

| Dropped | Clean case listings |
|---|---|
| All six Pokémon sealed rows (PB26 · CR26 · AH26 · PRIS25 · DR25 · PF25) | 2 · 2 · 0 · 0 · 1 · 1 |
| All five Pokémon guide/lander strips | 0–2 |
| topps-chrome-black-football · cactus-jack · pristine-basketball | 2 each |
| definitive-basketball · finest · museum · cosmic-chrome · bowman-sapphire | 1 · 1 · 1 · 1 · 0 |

**No Pokémon page ships a case link and `tools/build-sealed-rows.mjs` was not touched** — no dead code
for a market that is not there. The counts above are the Wednesday build's trigger: when a Pokémon set's
case supply reaches 3, the mechanism is a config entry plus ~8 lines in that generator.

**Two traps found while building, both now held in code (`tools/case-shelf.mjs`):**
1. **"Case" is a false-positive magnet.** All 30 raw `/api/comps` hits for 2025-26 Topps Definitive were
   `CASE BREAK` / `case hit` slots at **$20–$40**, not $34,000 cases. `CASE_OK` requires a case *shape*
   ("12-box case", "hobby case", "sealed case"); `CASE_BAD` throws out break/PYP/lot/single.
2. **A loose word match is an R8 violation waiting to happen.** `must: "bowman chrome"` matched
   *"2026 BOWMAN BASEBALL 12-BOX HOBBY CASE (12 AUTOs) MLB w/Chrome"* — a different product — until the
   guard was made a **contiguous phrase** match. The shipped Bowman Chrome link was then re-opened in a
   browser: 9 results, top hit a real 2026 Bowman Chrome 12-box hobby case at $7,199.99.

**#33 — Authenticity Guarantee links.** `secondary.ag` adds eBay's own "Show only" filter, relabels the
Top-card link *"Authenticated on eBay →"*, routes it to a `-ag` custom ID so the trust-copy effect is
readable against the plain IDs, and adds one dated line of fine print naming the program as **eBay's, not
our assessment**.

**The parameter is `LH_AV=1`**, read off eBay's own search sidebar in a browser. The Sep 20 desk declared
that it could not verify it (the cloud fetch of eBay search is 403) and that declaration is why it was
checked before anything shipped.

**Four pages carry it** — each with an `/api/comps` median ask well over $200 and real AG depth:

| Page | Median ask | AG listings |
|---|---|---|
| lebron-james-cards | $9,500 | 19 |
| lionel-messi-cards | $4,875 | 17 |
| cameron-boozer-rookie-cards | $2,322 | 15 |
| victor-wembanyama-rookie-cards | $1,873 | 491 |

**`ethan-holliday-rookie-cards` was the desk's own pilot page and did NOT ship.** Its PSA 10 query goes
from **1 result to 0** under the filter, and its broad link is a sub-$200 basket. Over-filtering a thin
market was the idea's named kill criterion; it fired before launch, so the link stayed off. A narrow
query plus AG is how you send a reader to an empty page.

**Both levers are now on Gengar's Monday beat.** `tools/buy-strip-health.mjs` reports a case shelf under
3 clean listings as THIN/DEAD and an AG link whose median falls under $200 as off-threshold. **Neither
fails the run** — neither renders a figure, so a thin one is a link to fewer listings, not a wrong number
on a page.

**Kill criterion, at the Oct 21 EPN read (two weekly reads):** `-case` IDs with 0 actions on ≥ 20 clicks
combined, or under 5% of sealed clicks → remove. `-ag` IDs drawing fewer actions per click than the same
pages' plain IDs on ≥ 30 clicks each → revert to the plain link. Record either way.

**Phone width checked** at 390px on a case page and an AG page (Playwright, local tree): the case link
stays a short text link beside the buttons, not a tile (Mo, Sep 18 — "the top seems a little busy");
scrollWidth 390, no overflow.

### Open, from the same desk — NOT an idea, a flag the CoS owes an answer on

**eBay expanded Extended Bidding to more auction categories and all global marketplaces** (Value Added
Resource, Sep 2026). An auction that extends on a late bid **moves its close time**, which bears directly
on the parked close-time capture and the 12-hour "last bid seen" lag (ledger #28; the Sep 16 retraction).
`/api/auctions` reads `itemEndDate` at snapshot time — if that timestamp can move after we record it, a
"hammer" we log may not be the hammer. **Queued for the Wednesday build session to rule on** alongside the
`/api/comps` work: the question is whether the auction desk must re-read `endDate` at close rather than
trusting the snapshot.

---

## 2026-09-20 — BOT FILTER SHIPPED (Mo: "yes bot filter"), AND THE EXPOSURE AUDIT THAT CAME WITH IT

**The bot traffic is worse than the Sep 19 watch measured, and it is still growing.** Applying the new
rule to today's live snapshot (day 2026-09-19):

| Country | Sessions (7d) | Avg session | Verdict |
|---|---|---|---|
| United States | 185 | 183.6 s | real |
| **Singapore** | **104** | **0.146 s** | **bot** |
| **China** | **13** | **0.318 s** | **bot** |
| Canada · Australia · Netherlands | 7 · 6 · 5 | 73 · 74 · 13 s | real |

**117 of 331 sessions — 35.3% of the 7-day window — is not people.** The Sep 19 watch measured
Singapore at 61 sessions / 21%. It is now 104, and China has appeared beside it. **Every 7-day rate in
`summary` has been computed over a denominator that is now roughly a third junk**, and STATE's
"earliest clean baseline Sep 24" assumed one contaminant that was not growing. That date is void.

**THE FIX IS IN `tools/ga4-snapshot.mjs`, NOT IN GA4, AND THAT IS NOT A SHORTCUT.** GA4 data filters
support exactly two types — Internal traffic and Developer traffic. **There is no country filter and no
duration filter**, and the built-in IAB bot exclusion is already on and does not catch this. So the only
places to subtract are upstream (block it) or at the read. The read is where every lane looks, so one
change fixes the Business Read, the Integrity Watch and the weekly together.

**The test is behavioural, not a country list, and that was deliberate.** The Sep 19 watch made this
argument against its own prompt: its bar was a share test (">40% of US sessions") while the evidence was
a duration test, so a literal reading would have let 0.146-second traffic through. Naming Singapore in
code catches this burst and misses the next one. The rule shipped is **average session under 2 seconds
over at least 10 sessions, by country, 7-day window**. On today's data it flags Singapore and China and
correctly ignores Czechia (2 sessions, 0.000 s) as noise.

**Both numbers are always emitted — raw and clean, with the suspects named.** Same rule as
organic-beside-blended. A filter nobody can audit is how a number quietly becomes wrong. New in
`summary.bots`: `rule`, `suspects[]`, `botSessions7`, `botShare7`, `cleanSessions7`, `cleanKeyEvents7`,
`cleanKeyEventsPerSession7`, `rawKeyEventsPerSession7`. **`cleanKeyEventsPerSession7` is keyEvents ÷
sessions, NOT GA4's `sessionKeyEventRate`** (which is sessions-with-a-key-event ÷ sessions and cannot be
recomputed after subtracting rows) — compare clean to clean, never clean to blended.

**`countriesDaily7` added** (country × date). The Sep 19 watch had to file its Finding 6(b) as "cause not
established" because it could not test whether the bot burst landed on the Sep 17 engagement floor or
spread across the week. From tomorrow's nightly it can.

---

### THE EXPOSURE AUDIT — asked by Mo the same message ("can we stop them / prevent bots stealing our code")

Ranked by what is actually at risk. **The HTML is not the asset and blocking scrapers is not the answer.**

**1 · THE GITHUB REPO IS PUBLIC. This is the whole business, readable by anyone, and it dwarfs
everything else.** Verified unauthenticated this run: `claude/cos/STATE.md` (200), `LANE-RULES.md` (200),
`data/pipeline.json` (200), `tools/price-engine/snapshot-free.mjs` (200), `data/watchlist.json` (200).
That is the price engine, every eBay query, the full operating doctrine, every ruling — **and this file,
which carries EPN earnings, GA4 traffic, the milestone ladder, competitor notes and Mo's own words.**
Nobody needs a scraper; they need `git clone`.

**AND IT CANNOT SIMPLY BE FLIPPED PRIVATE — that would break the live site.** `js/home.js`,
`js/engine-block.js` and `api/auctions.js` each fetch the price feed from
`raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/...` **in the visitor's browser**.
Private repo → raw 404 → the homepage ticker and every engine block go blank. **So it is two steps, in
order:** (a) serve the feed through our own origin (a Vercel rewrite or `/api/feed`) and cut the three
hotlinks; (b) then flip the repo private. Step (a) is worth doing on its own merits — it removes a
hard runtime dependency on GitHub's availability and puts the feed behind our own CDN. **Queued for the
Wednesday build. Do not flip the repo private before (a) ships.**

**2 · `/api/comps` IS AN OPEN PROXY ON MO'S EBAY KEYSET.** No auth, no referer check, no rate limit
(verified live: 200, 34 KB, `x-vercel-cache: MISS` — a live eBay call from an anonymous request).
Quota is 5,000/day. The 15-minute CDN cache protects repeated *identical* queries; varying `q` walks
straight past it. One script can zero the pricing engine for a day. `/api/auctions` returns the whole
desk — 230 KB — in one anonymous call. robots.txt disallows `/api/` but that is honour-system and is
not what protects anything.

**3 · Scrapers and AI crawlers reading the HTML — real, and the least of the three.** Vercel's Bot
Protection and AI Bots managed rulesets are **both off by default** and are one click each in the
Firewall dashboard. **Safe for search:** Vercel auto-excludes verified bots from bot protection, and
bingbot / googlebot / duckduckbot / yahoo-slurp are all on that list — which is ~95% of our search
traffic (Bing-fed). WAF **custom rules, IP blocking and DDoS mitigation are free on every plan** and can
ship in `vercel.json` via `routes` + `mitigate` (deny/challenge only). **Rate limiting and managed
rulesets are the priced/Pro-gated ones** — check the plan before promising either.

**What cannot be fixed, stated plainly so nobody spends a session on it:** client-side code shipped to
a browser is readable, permanently. Minification and obfuscation are speed bumps. The defensible asset
is the *data and the method* — the nightly feed, the sold-comp reads, the rulebooks — not the markup.

**NOT DONE, AND DELIBERATELY NOT DONE UNATTENDED:** no country has been blocked. Blocking Singapore and
China wholesale is a business decision with real downside (collectors in Asia), the traffic costs
nothing today (Vercel mitigated traffic is free and these sessions do not touch the eBay quota), and it
is Mo's call. Put to him 2026-09-20.


## 2026-09-19 AFTERNOON — THE FOOTBALL SHELF, DONE (Mo in chat: "update/add to the football pages ASAP since it is football season!!! ... go ahead and do what you need")

**Shipped `c0398f9`, pushed from a fresh deploy-key clone on the Mac, all seven football pages
live-verified md5-identical at ~22:45Z, IndexNow 200.** Acting on
`claude/cos/football-shelf-2026-09-19.md` (X Desk Watch's filing). Mo away for the afternoon;
everything below is decided, not queued.

**THE FILING WAS RIGHT THAT FOOTBALL WAS A CONVERSION PROBLEM AND WRONG ABOUT WHICH ONE.** It
found an 88-session page converting at 1.1% and blamed the $371 price point, which is a real
finding and is now tested. The larger defect was underneath it: **`/nfl-rookie-cards-2026` — the
highest key-event rate on the entire site, 15.4% — ranked and priced a product that has not
released.** Read live 2026-09-19: a *2026* Topps Chrome Football hobby box search returns **2**
listings, one of them mislabelled basketball; the same search for *2025* returns **237** at a
$739.99 median; PriceCharting's football catalogue lists 2026 Topps Flagship, its 1991 35th insert
sets and NFL Living, and **no 2026 Chrome set**. The page's own buy-strip hero query
(`2026 Topps Chrome NFL Fernando Mendoza RC Auto`) returned **zero listings** — a dead shelf on the
best-converting page we have. `/best-football-cards-under-50` had the same defect in a different
costume: it recommended **Panini Prizm and Optic** parallels for a class that is in Topps.
**This is R8's naming collision, in football, on the money page. `cos-2026-09-19-1`, FAIL.**

**FOOTBALL NOW HAS SOLD COMPS, FREE, AND THE ASK ENGINE IS RULED OUT FOR IT.** The filing's item 4
was "put football in the engine." **Declined as written, and recorded so it is not re-proposed:**
the 2026 class trades at **$1.44–$3.99** and `snapshot-free.mjs` rejects any listing under **$3**
as `no usable price` — an ask engine with a $3 floor cannot see this market at all. What works
instead is the **Sep 17 SV151 unlock, reused**: PriceCharting's public item pages carry their
completed-auction rows in the HTML unauthenticated, and their catalogue covers 2026 Topps Flagship.
So **`tools/football-solds.mjs`** now reads dated completed sales for eight football cards, and
**`data/football-solds-2026-09-19.json` is the committed evidence behind every football figure
published today** — 8/8 cards, 0 failures, re-runnable. Football marks on **sold comps, not asks**,
which is a better basis than five of the eight live tickers carry. **Graded is empty and the pages
say so:** `gradedDatedRows` is **0** on all eight, so every football page reads *No verified sale*
at every grade — and the unattributed **"PSA 10 ~$51"** that had been live on
`/fernando-mendoza-rookie-cards` since the Sep 16 graded-ladder ruling is **stripped**. That one was
ours, it survived three days, and no gate saw it.

**What shipped, page by page:**
- **`/nfl-rookie-cards-2026`** — ranked section rebuilt on five cards that exist. Mendoza Flagship
  RC **#301 $2.87** (30 most recent, all Sep 18, ~7 sales/day); 1991 35th **#91TR-1 $3.99**; Tate
  **#318 $1.44**; Love **#309 $1.50**; Bailey **#343 $1.59**. The **Real One auto gets no mark** —
  two dated sales ($175 Sep 10, $252 Aug 31) is a data point, not a price, and the $725+ ask book is
  **mostly redemptions**, which is itself the read worth publishing. The June figures ($400+ raw,
  $1,349 Black Shimmer) are **withdrawn and not restated**, the same handling as the graded-ladder
  retraction. Teams fixed: **Love is Arizona** (the page said "undisclosed"), **Bailey is the Jets**
  (unsaid) — both read off the titles of the sales themselves, which is the cheapest fact-check
  available and one we should have run in June.
- **`/bowman-football`** — `iw-2026-09-19-3` applied. Release **re-dated Sep 30** (13 of 18 dated
  presale titles; the page carried only "pre-order Sep 8"), so the index it promises lands
  **mid-October**, not late September. Two cheaper price points added and in the strip: **value
  blaster ask $42.97** (14 live), **mega box $79.99** (50+), beside the **$368.99** hobby box that
  was the only offer above the fold.
- **`/best-football-cards-under-50`** — rewritten, 8 picks, every one a dated sold median.
- **`/topps-flagship-football`** — the set page for the set that holds the class gains the base-rookie
  table; its banner stat **"Comps — forming"** (since August) becomes **$1.44–$3.99**.
- **`/fernando-mendoza-rookie-cards`** — 0 landing sessions in 28 days on the #1 overall pick.
  Re-read: **RC #301 is down 37%** from our Aug 31 ~$4.56 to $2.87. Real One row added, graded stripped.
- **The two 2025-branded pages** cross-link into the priced class, which is also how Mendoza gets
  surfaced (filing item 6): his page is now linked from four football pages instead of one.

**A CORRECTION TO THE FILING, on the record (`cos-2026-09-19-4`):** its Finding 4 called
`/topps-cosmic-chrome-football` and `/topps-chrome-black-football` "2025 products." They carry 2025
**branding** and 2026 **release dates** — Jun 19 and Jul 10, 2026 — which is normal in football,
where the product year trails the season. **Re-dating them would have been the error.** The lane's
observation (zero sessions, disconnected) was right; its cause was not, and that is not held against
it.

**⚠ GATE BASELINE MOVES 63 → 60 WARN on `audit-prices`, and it is a decrease with a named cause:**
three pages gained `data-prices-updated` stamps in this push (`/nfl-rookie-cards-2026`,
`/fernando-mendoza-rookie-cards`, `/best-football-cards-under-50`), clearing three
`no-machine-stamp` WARNs off the 34-page backlog. **New stated baseline: 60/3/1** (31
no-machine-stamp + 25 non-numeric-price + 4 stale-prose-stamp; audit-site 3; audit-terminal 1
feed-unavailable). **Any lane comparing against 63/3/1 is reading a stale baseline.**

**FREEZE:** every page touched is an existing page. No new page, no new nav item, no new vertical.
Mo's "make some updates/pages now that it is football season" released the "no new nav items" clause
and it was not needed — recorded, and unspent.

**BOOKED, AND NOBODY HAS OWNED IT YET:** the $42.97/$79.99 offers on `/bowman-football` exist to
test the filing's Finding 1. **Re-read that page's key-event rate on or about Oct 3** — two weeks —
against the 1.1% baseline. A test nobody reads is not a test.

**STILL OPEN after this run:** wiring `tools/football-solds.mjs` into a cadence, and whether a
football index can be constituted on it once 2026 Bowman Football prints solds in mid-October.
**Both are Wednesday-build decisions and were deliberately not taken unattended on a Saturday.**


## 2026-09-18 EVENING — THE FRIDAY RELEASE-WINDOW WORK, DONE BY THE CoS (Mo in chat: "you are in charge to get it done")

The desktop Friday lane never pushed, so its two owned items shipped from this session, behind the three gates:

**1 · `iw-2026-09-18-2` APPLIED — the board's seats now follow the board's published rule.** `0d9ae49`. Seats: **1 Fischer $148.32 · 2 Holliday $104.00 · 3 Gonzales $92.00 · 4 Florentino $70.00 · 5 Kim (gated, carried $131.25, last print Aug 5)**. Dated "Correction · Sep 18" block above the Sep 17 method-change column, struck note inside it, and — the lane's suggested shape, adopted — **every ranked seat now publishes its last-sale date**, so the 30-day gate is checkable by a reader. No price and no verdict moved. `board-history.json` carries the 2026-09-18 entry. The Sep 17 Kim/Holliday reasoning was not re-opened.

**2 · THE POKEMON-30TH TRIGGER FIRED AND WAS EXECUTED.** `486c246`. Mewtwo ex SIR ($115.77, supply 28) and Mew ex SIR ($165.00, supply 31) carried their first verified marks in the 2026-09-18 feed, so the plan recorded on each watchlist entry ran exactly as written: slugs added, ENGINE blocks + guide fold on the #1 lander, `/card-*` 301s (no `#fragment` — the redirect gate rejects fragments; same pattern as the other 7 hosts), search INDEX entries via `data/nav.json` + `build-nav.js` (103 pages regenerated). **The Sep 16 static tape (ttl-3, due to WARN Sep 19) is retired with a dated note** — its fuse resolved by replacement, not by re-reading. Marks are labelled **ask-basis, building-history (2/20)**; the ETB still prints **no number** (no verified mark); sold-comp claims untouched — nothing in the set has a verified sold comp and the page still says so.

**GATE BASELINE MOVES 62 → 63 WARN on audit-prices, and the cause is named:** the nightly ENGINE regeneration moved `aiva-arquette-1st-bowman.html`'s newest date to 2026-09-18, which pushed its dated prose ("Sep 11, 2026") across the 7-day `stale-prose-stamp` line. Not drift and not a defect in this push — it is the prose-freshness check doing its job on a page whose engine data refreshes nightly. **New stated baseline: 63/3/1** (35 no-machine-stamp-class + the aiva prose line; audit-site 3; audit-terminal 1 feed-unavailable). Clearing it = re-reading the aiva prose, queued for the Wednesday build. Any lane comparing against 62/3/1 is reading a stale baseline.

**Deliberately NOT done:** `data/buy-strip.json` gains no pokemon-30th entry from this session — the page passes §15 on its hand-placed module and wiring the module's ETB query into `buy-strip-health` is **Gengar's Monday beat (Sep 21)**, where the config semantics live. Noted for Gengar, not forced on a Friday.

**Push path, on the record:** this cloud session cannot push (`git push` → the git proxy refuses to inject a credential for this repo; the `auto` deploy key lives on the Mac). Commits are prepared and gated in the session clone; push happens via Mo linking the session to his Mac or adding the repo to the session's sources — or the patches stage for the next Mac-linked lane. The run log entry below records which way it went. **It went the patch way:** the four commits were replayed on the Mac by the next CoS session (2026-09-18 afternoon PT) from `claude/handoffs/friday-2026-09-18.patch.txt` in a fresh deploy-key clone of `a7eddb3`; gates re-run there matched exactly (63/3/1; audit-terminal 0/0 with `--feed`); shas in this file and in `pipeline.json` are the real ones.

**3 · THE X DESK WATCH's FIRST GRADED RUN — its FAIL is OVERTURNED, and the vendor is exonerated.**
The 11:26 PT run filed a FAIL: today's 9:39 AM vendor post carries a homepage screenshot reading
`BOARD 97.43 · feed Sep 18 · 33/37 marked · 130 closes`, which the lane called "a level that has
never been published," reasoning from baked `index.html` (93.96, feed Sep 16) and a curl fetch.
**This CoS session re-verified in a real browser before ruling (R5): the live homepage repaints
client-side from the nightly feed, and rendered in headless Chromium at ~19:30Z it reads exactly
what the screenshot reads** — feed Sep 18 · 33/37 marked · 9 gated · 130 auction closes ·
Florentino BUY $115, +15.0%/30D, z 1.53 · BOARD chart "last Sep 18" at ≈97.42 — and
`build-home.mjs` against the Sep 18 feed prints `composite 97.43 (9 autos)`. The screenshot is our
live site in a normal browser. **This is the identical trap the Sep 17 Integrity Watch documented
and dodged as its stumble #1 (baked fallback vs client repaint), now filed by a second lane a day
later — the trap goes in the lane's prompt.** Consequences: the drafted correction brief is NOT
sent; nothing about the post goes to NEEDS-MO; the post stands. What the run DID get right, ruled
here: (a) **the Markets panel subheader called all seven indices "sold-only" while BCB26 and BOW26
are ask-basis — real claims defect, fixed this push** (one string, outside the generated markers);
(b) the baked HOME fallback ages between Monday re-bakes — accepted as a P2 hygiene item, correctly
scoped to the *fallback* (a "home stamp vs newest nightly" gate as the lane proposed would
false-positive against the client repaint); (c) three MEDs (cadence 09:39 vs doctrine, the
disappeared Sep 17 proof post, quote-what-a-reader-can-see) go in Monday's vendor diff-note;
(d) the lane's own prompt defects (deviceId points at Browser 2; task cadence vs the LANE-RULES
table) are queued for the next scheduled-task edit pass together with the browser-render rule.

**⚠ MONDAY-SCAN TRAP — CLOSED Sep 19 (`95c9335`: home.js links an index page only when it exists in `data/indices.json`; the Monday bake needs no hand substitutions). Kept for the record:** the Monday `build-home.mjs` re-bake will run against a
feed that (post-push) carries slugs for the two 30th singles — those bake correctly as
`/pokemon-30th-anniversary-2026#engine-*` — **but `th26-etb` still bakes a dead `/th26-index` link**
(home.js's `-(booster-box|etb)$` rule; TH26 is still COMING on /indices). `audit-site`'s
`dead-internal-link` FAIL will block that push, which is the gate working; the fix belongs to the
Wednesday build (home.js: only link an index that exists in `data/indices.json`), not to a Monday
hotfix. Also on the record: `audit-site` resolves internal links against page FILES only and does
not read `vercel.json` redirects — a redirect-aware `slugSet` is a small tools item, same build.

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

## 2026-09-18 MID-DAY — MO SAID YES TO ALL THREE; TWO ARE DONE, THE THIRD WAITS ON HIS PASSWORD

**1 · `/track-record` correction — DONE, live.** `75f0cd7` + `0697e5a` (formatting restore): five `calls.json` rows carry appended `[corrected Sep 18 2026: …]` text naming the withdrawn PSA 10 figures; projections, entries, dates, states byte-identical; `updated` → 2026-09-18. `iw-2026-09-18-1` → `applied`. The board seat-order finding (`iw-2026-09-18-2`) is unchanged: seats move under the published rule, owner = first publishing lane from a fresh clone. *(Applied the same evening, `0d9ae49` — see the EVENING block above.)*

**2 · GA4 IS NOW READ WITHOUT A BROWSER — DONE, first run verified.** Mo said he would not handle GitHub secrets, so it was built **keyless**: GitHub Actions → OIDC → Google Workload Identity → `ga4-reader` (Viewer on property 541047014). No JSON key exists anywhere. Setup record with every identifier: `claude/handoffs/ga4-snapshot-2026-09-18.md`. Pieces: `tools/ga4-snapshot.mjs` (`73bc373`), `.github/workflows/ga4-snapshot.yml` (added via the web UI in Mo's Chrome, `7655480`, nightly 02:00 PT). **First run `cc36fb7` on `price-data` at 18:00Z matched the same-morning UI read figure for figure** (Organic 709 sessions / 7.05% KE; Direct 467; `/bowman-chrome-baseball-2026` 92 sessions / 0 KE; Singapore 61 sessions/7d). Read URL for every lane: `https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/ga4-latest.json` (+ `ga4-history.json`, one summary row per day). **Prompts rewired the same hour:** Integrity Watch Part A now checks `keyEventsYesterday`, `clicks7`, organic-beside-blended KE rate, returning share and the non-US cluster against trailing medians, and files HIGH if the snapshot is older than 36 h; the CoS daily's §0 light read is now step 1b off the same file. **The "nobody looked at GA4 for a week" class of incident is closed by construction.** The GA4 UI in Chrome stays for the weekly's deeper reads and for anything the Data API cannot express.

**3 · EPN read — DONE after Mo signed in (11:20 PT).** Sep 4–17: 94 clicks · 15 actions · $1,275 sales · **$37.98**; **95% of it attributed** (the Sep 4 "99.6% No Custom ID" pattern did not repeat); the sale that mattered was **$860 off `/lionel-messi-cards` on 4 clicks**; the #1 lander (pokemon-30th) converts at $0.22/click on 21 clicks. Trailing-30 ≈ **$102/mo — below M0**. Full table: `gap-analysis-2026-09-18.md` §6. *(Superseded text:)* BLOCKED on a sign-in only Mo can do. Both Chrome profiles have lost the EPN session (partner.ebay.com bounces to eBay's password page for shopcardhub@gmail.com). The tab is open in Browser 1; the CoS never types a password. The moment he signs in, the Sep 8→18 Performance-by-Day and the first per-product Custom-ID read go into `gap-analysis-2026-09-18.md` §6.

**Bridge quirk, on the record:** `device_commit_files` served a stale copy for a path that had been staged earlier in the session — twice (calls.json landed reformatted, then fixed; the ga4 script landed one version behind, then fixed by staging under a new filename). **Rule: stage a changed file under a new name, and md5 it on the Mac before committing.**

## 2026-09-18 — OVERNIGHT RUN (Mo asleep; three asks) + MILESTONE LADDER + TWO NEW FAILS FROM THE 05:00 WATCH

**Mo, 2026-09-17 night, three asks:** (1) look at the free GitHub repos people use with Claude and at our own site for retention or backend efficiency; (2) analyze our eBay + GA4 gaps; (3) an agent that delivers a daily report of 1–3 new ethical, site-synthesized earnings ideas, with tangible milestones: **$1,000/mo would amaze him, $10,000/mo is the home run.** All three done; the docs are the deliverables:

- **`claude/cos/repo-scan-2026-09-18.md`** — two agents (ecosystem survey of ~40 repos; read-only inventory of a fresh clone). Ruling: **adopt four** (Google's official GA4 MCP via a read-only service account — *needs Mo's one yes, $0*; a single `gates.yml` CI running all three gates + generator round-trip; lychee link check inside it; hookify rules for the three mechanical LANE-RULES), **copy six patterns** without installing (verify-before-stop, freshness hook, path-scoped write guard, doc-drift gate, beacon block list as config, retired-schema drop), **decline the rest** with reasons. The retention gaps are not repo-shaped: ten holes in our own code, the top two not yet scheduled — **`/` has zero eBay links at rest and zero click telemetry**, and the #1 lander is not in `data/buy-strip.json`. Backend: CI runs one gate of three; two nightly writers to the same feed (`vercel.json` still crons `/api/cron-snapshot`); `api/ebay.js` has zero callers; `newsletter.mjs` still targets retired Kit.
- **`claude/cos/gap-analysis-2026-09-18.md`** — built from the Sep 16/17 GA4 reads and the Sep 4/8 EPN reads (no console opened: two Chromes are connected and the browser tool will not pick one without Mo — question waiting for him). **The arithmetic that matters:** $/click is **$0.28** (60d, almost all one sale); eBay pays ~3% of GMV. So **$1k/mo = ~$33k eBay GMV/mo, or 20× today's 6 clicks/day; $10k/mo = 200×.** $/click (basket size: high-end sealed, graded/auto singles) is the fast lever; clicks are the slow one. Eight gaps ranked; G1 = we cannot see which page earned the money (phones drop `customid`, `/` emits nothing, no EPN↔GA4 join ever run). Standing rule from G8: **no trend from fewer than ~30 EPN actions; milestones graded on trailing-30-day earnings across two consecutive reads.**
- **`claude/ideas/README.md` + `LEDGER.md`** — the **Earnings Ideas Desk**, cloud task `trig_016ppW1e5SPGio6X3Wf2k83E`, daily **04:15 PT**, find-and-file only, nine-line idea format, ethics/fit filter (no paywalls, no paid ads, EPN-compliant, no fabricated numbers, no AI slop, freeze through Oct 26, R10, no COMC positions, no PII, no spend below M0). Ledger seeded with **29 lines** — every idea on the record with status, including 6 `never`/`retired` so they are not re-proposed. **The CoS daily (06:00 PT) now rules on each idea** (step 3b added to its prompt): adopted → `pipeline.json` at the weekly · parked with trigger · declined with reason. First desk run: **Sep 19 04:15 PT.**

**MILESTONE LADDER (Mo's, tangible, EPN-measured, trailing 30 days, two consecutive weekly reads to "hit"):** **M0 break-even ≥ $300/mo · M1 "amazed" ≥ $1,000/mo · M2 "home run" ≥ $10,000/mo.** Baseline at creation: trailing-60d ≈ **$35/mo** ($70.76 on 256 clicks, Jul 11–Sep 8); best 30-day window $64.70 on one $1,950 sale. **Current rung: below M0.** The weekly Business Read now opens with the rung and the trailing figure.

**Prompt fixes shipped tonight (auto-approved):** Integrity Watch STEP 0 rewritten to an HTTPS clone (it stumbled on the SSH/deploy-key line two runs running and said so), SV151 removed from its cadence check until it is live, delivery pinned to the Project doc; CoS daily gained step 3b (ideas ruling) and its closing line now carries the ideas count. Cadence table below updated with both new lanes. **Not fixed: the CoS daily's Sep 17 run FAILED at 13:07 UTC after 5 seconds** — an infrastructure failure, not a content one; the Sep 18 run fired normally. Watch the next two.

**FROM THE 05:00 INTEGRITY WATCH (`claude/cos/integrity-watch-2026-09-18.md`), two FAILs, both accepted, ruled here:**
1. **`/track-record` serves four retracted PSA 10 figures out of `data/calls.json`** (Florentino "held $492", Gonzales "$425 vs $125", Fischer "$421 → $537.50" as half the published trigger of an open BUY, Holliday/Arquette weekly % on one-sale series). The Sep 17 strip-and-re-mark was page-scoped and never reached the ledger file. **Ruling: NEEDS MO** — `calls.json` projections are immutable and `/track-record` is on the §3 Needs-Mo list. Proposed remedy (Mo says yes/no): the projections and dates stay byte-identical; each affected `readLabel`/`note` gets a dated bracketed correction appended (*"[corrected Sep 18: PSA 10 figure withdrawn — no verified sale]"*), the way the board carries its struck column; `v-bb-fischer-buy-2` keeps its call and its date with the note that half its stated trigger is withdrawn. `calls.json` `updated` stamp fixed in the same pass. **Gate gap (`iw-2026-09-17-4`) widened:** a check over `data/calls.json` strings for graded figures without a dated sale is now in scope for the Wednesday build.
2. **`/bowman-bangers` seat order breaks its own published rule at #3/#4** — Kim (44 days since a print) ranked above Gonzales, whose last printed sale moved to $92.00 on Sep 11 by the board's own history. **Ruling: the rule stands, the seats move.** Under the published rule: 1 Fischer · 2 Holliday · **3 Gonzales $92.00 · 4 Florentino $70.00 · 5 Kim (gated)**. Verdicts untouched. Dated correction block on the page ("Sep 18: the gate was applied against Holliday only on Sep 17; applied against every seat, Kim drops to #5"), and the board must publish a last-sale date + 30-day count for **all five** seats — a rule that turns on liquidity cannot omit the input for two cards. **Owner: the Friday release-window lane today if it pushes, otherwise the Tuesday board lane Sep 22 — whichever runs first, from a fresh clone, behind the three gates.** The Sep 17 ruling's Kim/Holliday reasoning is not re-opened.

Also from the watch, no finding but a fuse: `/pokemon-30th-anniversary-2026` declares `data-prices-ttl="3"` on a Sep 16 stamp and goes stale **Sep 19** — re-read the tape or drop the TTL.

## 2026-09-17 — THE X DESK IS NO LONGER OURS. WE AUDIT IT NOW (Mo: "I have hired Grok bot")

Mo hired an outside vendor, **Grok Bot**, to run @shopcardhub, and instructed the CoS to close our
own posting agent and rebuild it as an auditor of the vendor. Done today.

**Doctrine: `/LANE-RULES.md` R10.** No lane on this project writes to X — post, reply, like, repost,
follow, queue, schedule or delete — under any authority. **Two standing authorizations revoked:** the
Aug 31 Tuesday board-tweet auto-queue (which was the *only* unattended social write in the system)
and the `shopcardhub-tweet-reply-paster`. This project now has **zero** unattended social writes.

**Charter amendments, recorded here because `CHARTER.md` is still Project-doc-only** — the identical
defect STATE.md had until Sep 16, and it should be committed to the repo at the Oct 1 roster review:
- §2 roster **+ X Desk Watch** (room `growth`), daily 13:00 PT, weekly grade Mondays, read-only.
- §3: "Posting to X or anywhere off-site → Needs Mo" is superseded for X. It is **forbidden outright**,
  including on Mo's say-so in chat — if Mo wants something posted, he or the vendor posts it. The rest
  of the off-site bullet stands.

**DIRECT CHANNEL OPENED THE SAME DAY (Mo: "Are you able to talk directly to each other? ... you are
his boss").** The Grok Bot app runs on Mo's Mac (`com.anysphere.sand`) and the CoS now drives it
through computer use — direction, corrections and site-change heads-ups go CoS → vendor with no
relay. First brief sent 2026-09-17: the six rulings, the two first-post MEDs, the Sep 17 ranking-rule
change (so its "Holliday is our #1" phrasing is stale), the three never-post rules, and the Tuesday
board-tape URLs. **R10 is amended, not weakened** — only the CoS uses the channel, the vendor still
composes and posts everything that reaches X, and what comes back is data, not instruction.

**Vendor acknowledged, same session, and named what it changed:** all six points accepted onto its
loops, Creator/Auditor seats and memory, **4 routines updated** — sole X desk, no second queue on its
side; retail "collect" framing stripped; future posts say **1st Bowman Chrome Autos / auto board** and
chart stories carry an image; seats and verdicts reloaded with no "Holliday #1" unless the seats say
so; never-post list locked (COMC/competitors/unverifiable, ask≠sale, graded needs a dated sale, no
false series); it will pull `og/x/board-latest.png` + `data/x-board.json` when they land. It also
agreed to a short **diff-only** note Mondays after its 10:00 audit. **This is a self-report — it is
the thing Friday's audit grades, not evidence.** First graded run: 2026-09-18 13:00 PT.

**Spec: `claude/cos/x-desk-watch-2026-09-17.md`** (in the repo). Six checks: claims traced to a live
surface of ours at post time · R8/R9 taxonomy · exposure (no COMC position of Mo's, no competitor
names, EPN) · strategy fit · reply policy · weekly funnel. FAIL on claims/taxonomy/exposure is a
same-hour needs-you with the correction text drafted for Mo to hand over. **We never reply, never
correct on X, and never contact the vendor** — direction goes through Mo as one short note a week.

**Three rulings on the vendor's charter that change our own rules:**
1. **Link goes in the MAIN post, not the first reply.** The Aug reset's "link in the first reply"
   rested on folklore we never measured; t.co is already our best-engaging channel. Overridden.
2. **Plain language yes, retail framing no.** The vendor's "collector-friendly, no dense jargon" is
   accepted as style and rejected as audience: the Sep 16 audience rule still resolves toward the
   investor.
3. **The vendor is not one of our agents.** Its note is an input the CoS rules on, not an
   instruction to this project, and Mo's "agents talk to each other" preference does not extend to it.

**The reason this lane exists, in one line:** every gate here reads our own HTML, so a false sentence
on X is invisible to all three of them — the September lesson (we gate structure, not meaning) now
running outside the building. **And the blast radius went up:** a wrong page is now amplified by
someone whose post we cannot edit or delete, so a claims defect on a page Grok has posted about is a
page fix *plus* a correction note the same hour.

**First audit — the vendor's proof post (13:18 PT, read in Browser 1): claims PASS, two MEDs.**
*"BOARD finished last night at 93.96 — up about half a point… our equal-weight 1st Bowman chase
board."* Homepage Markets carries `BOARD 93.96 +0.49 +0.52%` and the caption reads *equal-weight ·
9 autos · ask-basis · 30 marks · last Sep 16* — every figure right, and it correctly separated the
BOARD composite from the seven set indices beside it. MED: **"1st Bowman chase board"** is the
retail, non-auto category under R9 — the board is nine 1st Bowman Chrome **Autos**, and that copy is
what we stripped off the board's own title on Sep 16. MED: text-only against its own image rule.
Both go in Monday's note; neither is publicly correctable.

**Board tape handoff (Mo's call):** the Tuesday lane keeps generating the tape and **publishes it to
fixed URLs** — `og/x/board-latest.png` and `data/x-board.json` (seats, marks, verdicts, as-of, the
ranking rule in one sentence, sale counts behind any graded figure) — so the vendor pulls instead of
inventing. **Builds 2026-09-22.** Until then it reads the homepage Markets panel, which is where it
correctly found the level on day one.

**GA4 baseline for the grade (28d to Sep 16):** t.co 30 sessions · 3m 48s avg engagement · 13.33% KE
rate vs a 36s site average; the whole of Organic Social. **Key events were dead Sep 4–16 — no
retention figure is quoted from that window; first clean weekly read is Sep 24.**

**`NEEDS-MO.md` now opens for its reader, not for the lanes (Mo, 2026-09-17: "I don't know what the
IN THE REPO thing you are talking about is").** The file led with three paragraphs of repo plumbing
before Mo's first item. It now opens "Mo, these are the only things waiting on you" and the
mirror/canonical housekeeping is one parenthetical marked as agent business. **Standing rule: a
document addressed to Mo opens with Mo's items. Lane plumbing goes at the bottom or in another file.**

## 2026-09-17 — THE BOARD'S RANKING RULE CHANGED, AND IT IS PUBLIC (Mo: "fix it all please. approved")

**Read this before writing anything about /bowman-bangers.** Shipped `ce241bf`, live-verified.

**The rule now, in one sentence, and it is published in three places on the page:** ranks run on
**one ladder — the last printed sold price, highest first — plus a 30-day liquidity gate**, so a
card that has not printed a sale in 30 days cannot outrank one that has. Nothing else moves a seat:
not the ask mark, not our verdict, and not the graded copy.

**Why it changed.** `iw-2026-09-17-1` (FAIL): the board published five PSA 10 figures with no
provenance and ranked on them. Four of the five — Fischer $538, Kim $626, Gonzales $425, Florentino
$492 — have no verified sale anywhere on this site, and those four card pages publish no graded
figure at all. Only Holliday's $720 does: **one** sale, Aug 6 2026. The Sep 16 "strip and re-mark"
remediation reached three card pages and never reached the board. Worse than the figures was the
language over them — "the graded tape did not flinch", "pinned at $720 a sixth week", "graded flat",
"a $492.00 graded print" — all asserting a series that did not exist.

**THE SEATS, as of Sep 17, on unchanged Sep 15 marks:** **1 Fischer** ($148.32, 2 sales/7d) ·
**2 Holliday** ($104.00, 27 sales/30d) · 3 Kim · 4 Gonzales · 5 Florentino. Holliday held #1 from
Jun 12 and lost it to the rule, not to the tape. Kim stays #3 because the gate holds his 43-day-old
carried $131.25 below a card that is trading — **the line the Sep 15 board itself said it would have
to draw by mid-October.** Drawn early.

**NO VERDICT MOVED AND NO PRICE MOVED.** Holliday SELL, Fischer HOLD, Kim PASS, Gonzales PASS,
Florentino BUY. Seats are ordering; verdicts are calls; the Scorecard clocks are untouched.

**Standing rules that come out of this:**

1. **A graded figure is published only where we can point at a dated sale.** Otherwise the page says
   *no verified sale*. Board, card pages, alumni strips, everywhere. SportsCardsPro's grade ladder is
   partly modelled and is never published as a sale.
2. **Never narrate a carried value as a series.** "Flat", "pinned", "held", "did not flinch", "a
   sixth straight week" all assert repeated observation. If there is one sale, say one sale.
3. **The board's rule is published, and it is one rule.** Before this, the hero said one thing
   ("liquidity and the nightly verified-ask mark"), the board header JS hardcoded another ("ranked
   by what sells", overwriting the static markup), and the legend a third ("two price ladders
   together"). If you change the rule, change all three, and the header's copy lives in the JS at
   `bb-board-note`, not only in the markup.
4. **Corrections are dated and visible.** The method change is a block above the weekly column; the
   Sep 15 column carries its own struck correction. We do not silently re-rank.

**`iw-2026-09-17-3` (MED) applied the same commit:** `/indices` asserted "Sold-Basis … never
estimated" in its banner, subline, meta description, og description and JSON-LD while BCB26 and
BOW26 are 100% ask-priced (18 of 271 basket rows). All five surfaces now say five tickers mark on
sold comps and two on verified asks, labelled per ticker. No index changed.

**`iw-2026-09-17-4` is OPEN and it is the real lesson:** all three gates passed /bowman-bangers at
FAIL 0 the entire time it was wrong, because every price gate reads price **cells** and these claims
lived in prose and in card-strip meta. That is this lane's founding case reproduced on the flagship
page. Proposed check shape is in the ledger.

## 2026-09-17 (evening) — THE REDDIT "LINK POST" IS A ONE-LINE COMMENT AT 1 POINT, AND IT SENT NOBODY

Mo supplied the URL. Read in his Chrome, then measured in GA4. **Both of this project's standing
beliefs about the channel were wrong.**

**What it actually is:** not a post. A **comment** — `r/pokemoncards`, on someone else's submission
("nicest looking card of mega evolution so far", 559 points, 113 comments), posted 2 days ago from
`u/BUYMYBASEBALLCARDS`. One line, ~30 words, ending in a bare link to `/pitch-black-index`.
**Score: 1 point.** In a 113-comment thread sorted by best, that is the bottom of the page. Our notes
called it "an off-site link post" and "the primary Google play"; it is neither. Nobody submitted
anything.

**What it sent: zero.** GA4 traffic acquisition, Session source/medium, Sep 1–17, filtered `reddit`:
**No data available.** Not a small number — no rows at all. For scale, the entire **Referral** channel
is **2 sessions in 17 days** against 851 total (Organic Search 459, Direct 348, Organic Social 23).

**What this means for the strategy, and it is not "post more":**
- **Problem 1 in the Business Read rests on an untested lever.** It says Google is a links game and
  the link-earning posts are the play. The evidence for that is now: one comment, one point, zero
  sessions — and the *other* queued post was pulled today because its numbers were retracted. **The
  channel has never actually been tried.** A submission has never been made.
- A bare link dropped in a comment is the weakest possible form of it. If we test this properly it is
  a **submission** with the content in the body and the link as the receipt, in a subreddit whose
  topic matches the page — and we judge it on referral sessions, not on whether it felt right.
- Until that trial exists, **no plan may assume off-site links are working.** Saying "links are the
  Google lever" is a hypothesis with zero trials, and this file is where that gets stated plainly.

**Also corrected:** the channel was recorded as r/baseballcards / r/PokemonTCG and as pointing at the
Pitch Black page from a post. It is r/pokemoncards, from a comment. `rel` was never the issue —
reach was.

## 2026-09-17 (evening) — THE SV151 BLOCKER WAS NOT REAL. THE SCREEN IS RUN, 207/207.

Mo, asked to log in to PriceCharting, said: *"I'm not sure why you can't get into price charting? I
also have not paid for anything from them."* He was right to push. **We tested instead of assuming,
and the earlier diagnosis — "needs Mo's authenticated PriceCharting Chrome session / Legendary
sub" — is WRONG and is withdrawn.**

**What is actually true, measured today from three places:**

| Path | PriceCharting item page | SportsCardsPro |
|---|---|---|
| Cloud container, plain `curl`, no cookies | **200, 963 KB, 347 completed-auction rows** | **403 (Cloudflare)** |
| Mac VM shell, plain `curl` | **200, same rows** | **403** |
| Mo's Chrome | 200, rows visible | 200, rows visible |

The completed-auction rows **are in the item-page HTML, unauthenticated**. They sit in
`<div class="completed-auctions-used">` (one div per grade tab; `Ungraded (60)` is the one the
screen wants), as `<tr id="ebay-…">` / `<tr id="tcgplayer-…">` with `<td class="date">` and the
price. What is paywalled is the **Time Warp sale photos**, nothing else. The earlier session's
`status=sold` / `sold=true` / `type=sold` query experiments all failed because the rows were never
behind a query parameter in the first place — and a Cloudflare 403 on a *different site* was read as
an auth wall on this one. **Same error class as the price ladder read as a sale: a symptom that
matched a story, filed as a cause.**

**So the screen ran, tonight, with no credential and no spend:** `data/sv151-screen-2026-09-17.json`
— all 207 slots, ungraded sold rows, 30-day window to 2026-09-17, per card: row count, clean comps,
eBay/TCGplayer split, clean median, last sale date.

- **207 of 207 PASS the ≥6 clean-comps-in-30-days entry screen. Zero fail.** (The Sep 15 run
  reported 202/5 — a different day and an unverifiable report; today's number is the measured one.)
- **Headline basket $1,905.79** — to the cent the same figure the universe pull produced this
  morning from a different page of the same site, which is a real cross-check, not a coincidence.
- **Clean-median basket $1,881.87** — 1.25% under headline, the same direction and rough size as
  the Sep 15 estimate (99.19 vs 100.00).
- **Comp mix 51.4% eBay / 48.6% TCGplayer**, which again explains why the pre-registered "55–70
  constituents" prediction was wrong: TCGplayer clears commons one at a time.
- Rate limiting is the only real constraint: 4 workers hit **429** after ~150 pages. One worker with
  a ~1.6 s gap and a back-off completed the remaining 57 cleanly. **The rebuild pulls politely.**

**What is left, and it is a build, not a blocker:** rewrite `tools/build-sv151.mjs` (lost with the
Sep 15 sandbox) against `claude/cos/sector-index-rulebook-2026-09-15.md`, constitute at base 100 on
the rebuild date, generate the page through its marker regions, gate, push. **Basis recommendation
for Mo, who already voted clean medians: constitute ON clean medians at inception rather than
starting on headline and restating at Oct 5** — the restatement only existed because the index was
already live on the other basis. It is not live. Nothing to restate.

**The P0 SportsCardsPro graded sales-table pull is a different problem and now has a clear shape:**
SCP 403s every shell, from both machines, so it is a **Chrome-automation job in Mo's laptop window**
— still no login and no subscription. It was never one wall with SV151; it was two, and only one of
them was ever real.

## 2026-09-17 — SV151: Path A closed, universe rebuilt, screen still blocked *(SUPERSEDED the same evening — see the block above; the screen is run)*

Path A is dead (see `NEEDS-MO.md`). **Path B terms are ruled: inception is the rebuild date, not
Sep 15.** What exists now: `data/sv151-universe.json` — **all 207 slots** with PriceCharting product
ids, URLs and headline figures, pulled 2026-09-17, plus the pagination and variant-slot rules needed
to reproduce it. Corroboration the source is right: today's headline sum over 207 slots is
**$1,905.79** against the Sep 15 run's **$1,909.46** over 202. Two days and five slots apart, 0.2%.

**The screen is not run and cannot be from here.** Completed-auction rows are not in the item page
HTML and are not reachable unauthenticated — `/offers` returns for-sale offers, and `status=sold`,
`sold=true`, `sold=1` and `type=sold` each return no sold row. It needs Mo's authenticated
PriceCharting Chrome session, **which is the same wall as the P0 SportsCardsPro graded sales-table
pull. Solve them once, not twice.** Full spec: `claude/cos/sv151-rebuild-spec-2026-09-17.md`.

**`claude/cos/sector-index-rulebook-2026-09-15.md` is now in the repo**, with a header marking every
SV151 activation figure in it as the Sep 15 run's own report rather than state. It was Project-only,
which is the same defect that lost the Sep 15 work and left NEEDS-MO stale for seven hours.

**The 151 Reddit post stays held** until the rebuilt page is live and all five of its numbers are
re-checked against it line by line.

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

## ⚠ KEY EVENTS HAVE BEEN DEAD SINCE SEP 3 — CAUSE FOUND, AND MY FIRST DIAGNOSIS WAS WRONG

Found while checking whether Mo's Reddit link sent anyone. It did not — and the report it was read
from showed something worse.

**CORRECTION, same night, before anything was changed.** The first version of this block said the
blackout started Sep 10 and blamed the Terminal rebuild on the strength of a repo diff. **Both were
wrong.** Reading further in GA4:

- **Sep 4 – Sep 9: 286 sessions, 0 key events.** So the blackout starts **Sep 4**, not Sep 10. The
  35 events I attributed to "Sep 1–9" all fell in **Sep 1–3**.
- **Admin → Events shows only four events configured as key events:** `close_convert_lead`,
  `newsletter_signup`, `purchase`, `qualify_lead`. Three of those are GA4's default lead-gen
  placeholders with **no stream data, ever**. The only live one, `newsletter_signup`, fired
  **once** in 28 days.
- **Admin → Property change history: "Key event settings — Modified" twice on Sep 3**
  (2:17 PM and 9:48 PM PT, under shopcardhub@gmail.com) and **nothing since**. The last property
  change of any kind was the Internal Traffic data filter on Sep 7.

**So the cause is a GA4 configuration change on Sep 3 that narrowed the key-event set down to
`newsletter_signup` plus three empty defaults. It is not a code regression and the Terminal rebuild
is exonerated.** The blackout is **13 days**, not 7. The fix is a settings change, not a build.

**The DEST-block removal is still real and still needs fixing** — `dest_strip` no longer exists on
`/`, the terminal-shell pages or the `/card-*` pages — but it is a *separate* defect, and it is not
what zeroed the key-event count. Filing the two as one thing was the error.

**How the wrong version happened, on the record:** I bracketed with a 7-day window, found a repo
change in the same window, and stopped. A repo diff that lines up with a date is a hypothesis, not
a cause — the same mistake as reading a price ladder and calling it a sale. Two GA4 reads (a
narrower window, and the change history) settled it in four minutes. **Nothing was committed to the
site on the wrong diagnosis, and the corrected version is what stands.**

**The fact, from GA4 (property a397485386p541047014), read live:**

| Window | Sessions | Key events |
|---|---|---|
| Sep 1 – Sep 9 | 527 | **35** |
| **Sep 10 – Sep 16** | **258** | **0** |
| Sep 1 – Sep 16 (combined) | 785 | 35 (2.93%) |

Zero across **every** channel and **every** source — organic search included, not just `/`. At the
Sep 1–9 rate (≈3.9/day) a 7-day zero has probability ≈ **1 × 10⁻¹²** under Poisson. **This is a
dead instrument, not a quiet week.**

**What changed in that window:** the Terminal rebuild shipped Sep 11–12 (`4eff6c7` → `6f9a9cd`,
hotfixes `5276303`, `90a0f1b`). Repo evidence: the **`DEST` block is gone from `index.html`** (zero
`DEST:START` markers) and from every terminal-shell page (`/auctions`, `/bowman-bangers`,
`/indices`, `/watchlist`) and every generated `/card-*` page. `dest_strip` is the site's
highest-volume event — 122 call sites across the guide pages — and it no longer exists on the
pages the rebuild touched.

**What is NOT established, and must be read before anything is changed: which events are
configured as key events in GA4 Admin → Key events.** Without that, "restore the DEST strip" is a
guess, and re-adding a block the Terminal rebuild removed on purpose would be an R3 violation. The
next Chrome-linked run reads the key-event configuration first, then restores whichever capture
died — and only that one.

**Consequence that corrects work done earlier the same evening:** the standing retention metric
written into this file hours ago — *"the organic-channel key-event rate (8.1%)"* — is computed on a
window that now includes seven days of dead instrument. **It is not a valid baseline and must not
be quoted until the capture is restored and a clean window exists.** The blended-vs-organic
argument still stands; the number does not.

**Also worth recording from the same read:** GA4 classifies `t.co` (X) as Organic Social, and X is
the whole of that channel — 30 sessions / 28 days at **3m 48s** average engagement and a 13.33%
key-event rate, against a 36s site average. It is the best-engaging channel on the site by a wide
margin on a small n. Nothing on Reddit, ever.

## OVERNIGHT RUN — 2026-09-16/17 (Mo asleep, Tiers 1-4 authorised)

**Shipped, all gated FAIL 0 and live-verified.** `4413820` → `f8ab3af` → `0e29a65`.

**Tier 1.3 — the 72 in-body COMC units are gone.** Inventory first: 169 COMC anchors across 93
pages. Removed 38 `<a class="related-card">`, 22 `<div class="product-item">`, 11
`<div class="related-card">`, plus the `/topps-finest-baseball` prose CTA (advice kept) and the
home footer's four-link COMC column normalised to the single link every other page carries. **Kept:**
the 91 standard footer links and About's two mentions — About legitimately describes the business.
Every removal was a whole unit taken with a balanced-tag scanner; div and anchor counts balance on
all 103 pages; the diff is deletions only outside the two named edits. eBay links untouched.

**Tier 2 — the homepage stopped overclaiming.** The `<h1>` read *"Every set priced. Pick your
cards."* directly above the stamp *"31/34 marked."* Now *"Every card we price, priced every night."*
Title, meta, og ×2 and JSON-LD moved off "Guides, Prices & Where to Buy" onto the investor (R9).

**Tier 4 — two real, three closed as already-done-or-never-real.** `/research` is indexable and in
the sitemap (77→78). **The Gonzales query fix is the one that matters:** the `queryNote` said *"Topps
and MLB.com print Gonzales; eBay sellers list Gonzalez"* and kept the query on `gonzalez` alone. The
marketplace is the other way round — a live read of 30 titles returned **gonzales 28, gonzalez 3**.
The single-spelling query returned 3 listings; the dual form returns 30, of which **18 pass the full
filter**. Rank #8 has been pinned at 4 verified asks — one above the floor, four below a call —
**purely on spelling.** Query now carries both, `titleMust` is the prefix `gonzal` plus `cpa-jg`,
label unchanged per Topps/MLB. *I nearly "fixed" the label off the set checklists before reading the
DO-NOT-FIX note; the note was right about the official spelling and wrong about the marketplace, and
both halves are now on the record.*

**Closed rather than "fixed" — the queue was stale:** the `newsletter_signup` capture on `/` is
byte-identical to its pre-rebuild version (`git show 4eff6c7^`) and the form renders on production,
so nothing was dropped; the Fischer verdict already reads Hold and the engine has Fischer at HOLD,
so page and engine agree; the Rutschman price exception already reads "the pop has round-tripped."
**Three of five Tier-4 items were not defects.** That is how lanes waste runs, and it is why the
Integrity Watch below checks the ledger before filing.

## NEW LANE — INTEGRITY WATCH (created 2026-09-17, daily 05:00 PT, cloud)

Mo: *"For all tier 3 items, I feel like these should be a task of an existing or new agent… You are
in charge of the site and our public face."* Created as a cloud scheduled task, automatic approval,
find-and-file only — it never fixes, never pushes, never touches git beyond reading.

**Part A — instruments.** Feed card counts, numeric marks, signal/gated counts, live index cadence
and auction closes, each against its own trailing 14-observation median. Zero or a >60% drop is a
FAIL. **GA4 cannot be read from a cloud run** — that is exactly how the 13-day key-event blackout
survived — so the lane instead checks the date of the last recorded GA4 read in this file and files
**HIGH if it is more than 7 days old.** The absence of looking is now itself detectable.

**Part B — claims.** Six live pages a run, rotating monthly, always including `/` and
`/bowman-bangers`: a figure labelled "sold" that is not a dated transaction, "what buyers paid" over
anything that is not a completed sale, coverage claims against the real tracked count, the R8/R9
product-naming errors, a verdict contradicting the engine's current signal, a price past its
`data-prices-ttl`.

**Why it exists, in one line:** every gate here reads structure and none read meaning, so three
defects in one night passed every check and the owner caught all three himself.

## EMAIL PROGRAM — approved, nothing sent (`claude/cos/email-program-2026-09-17.md`)

Mo approved email marketing for investor retention. **The plan says the constraint is not the
email.** 6 subscribers on 1,182 sessions is a **0.5% capture rate**, `newsletter_signup` fired
**once** in 28 days, and the capture sits on `/` while the investor is on `/bowman-bangers` or a
card page. Order: move the ask to where investors already are with a provable offer ("we mark these
cards every night — get an email the day one flips"); make the confirmation email the current board,
dated, as proof; send the Tuesday Tape every week or cancel it. **GATE: the triggered Signal Alert
tier (W5) is not built until 40 confirmed subscribers.** Below that it is engineering for an
audience that does not exist. Re-read at the Oct 26 W6 re-grade; if capture is still ~0.5% after the
ask moves, the offer is wrong and email should be abandoned rather than quietly continued.

## THE VAULT — cut, do not build the mockup (`claude/cos/vault-simplify-2026-09-17.md`)

The screenshot Mo sent is **AI-generated** — garbled text ("Chazizard", "Liotizon", "Nest %") and
invented prices. Not a spec, and nothing in it is real. **It is also a picture of the problem he
named:** 20 rows, 8 columns, 5 moving averages and a volume histogram before the user has done
anything. Recommendation: demote the dense table to a tab and build the summary head — total value,
change **since you were last here**, and any signal flip on a card he holds. That answers the three
questions an investor actually has and is the same work as W2's `HOME:mine` return screen, already
scheduled Sep 22–28. One question for Mo: the "since last here" line needs a **local-only**
timestamp on the device — nothing server-side, no account — worth his nod before it ships.

## THE BOWMAN TAXONOMY IS NOW DOCTRINE AND A GATE (Mo, 2026-09-16) — top priority, done

Mo: *"I am also getting concerned that you are getting confused about bowmans… for the BANGERS
these are FIRST BOWMAN CHROME AUTOS ONLY. Not PSA 10, Not non-autos."* Full taxonomy is
**LANE-RULES R9**; the short version is four distinct products (1st Bowman Chrome · 1st Bowman
Chrome Auto · PSA 10 of each), a 1st Chrome never implies a 1st Chrome Auto, and there are Chromes
and Chrome Autos that are not 1sts at all.

**Audit result — the data was clean, the public face was not.** All ten ranked board cards are
`chrome-auto`, labelled "1st Bowman Chrome Auto", none hidden, every query requiring `auto`. Nothing
had leaked onto the board. **What was wrong was how the board sold itself:** its `<title>` read
*"Top Prospects, Chrome Autos & 1st Bowman Cards to Collect"*, its meta and og description led with
*"Top 1st Bowman cards to collect"*, and the hero sub said *"The top 1st Bowman cards… ranked by
collector demand."* That is the **retail, non-auto** category and the collector framing, on the
investor surface. Rewritten: title, meta, og ×2, JSON-LD headline, hero sub and both hero chips now
say the board is the **ten 1st Bowman Chrome Autographs, on-card autos only, not base and not
graded** — and the hero states in plain words that a 1st Bowman Chrome does not automatically come
with a 1st Bowman Chrome Auto.

**Gate shipped: `audit-terminal` → `board-autos-only` (FAIL).** A ranked card that is not
`chrome-auto`, whose label is not a 1st Bowman Chrome Auto, whose label names a grade, or whose
query does not require "auto" breaks the build — as does the board page describing itself as "1st
Bowman cards". Negative-tested both ways: a base card ranked #11 raises two FAILs, and reverting the
old title raises the copy FAIL.

**Audience rule, now standing:** resolve ambiguous wording, ranking and feature calls **toward the
investor**, not the retail browser. That is what the Seeking-Alpha shape is for.

**Why Mo had to catch it, stated plainly:** every check on this project reads structure — markers,
prices, stamps, links. Nothing read *meaning*. The board could call itself the wrong product
forever and pass every gate. Three owner catches in one night (graded ladder, hammer lag, this) is
the same diagnosis three times: **we gate structure and we do not gate claims.** The instrument
watch already queued gets a sibling — a claims check: what a surface says it is, against what the
data behind it actually is.

## ⚠ RETRACTION — "HAMMER" PRICES ARE NOT SALE PRICES (2026-09-16, found by Mo)

Mo, reading the Reddit draft: *"those numbers aren't right… autos versus non autos it appears."*
**He was right that they are wrong. The cause is not the one he named, and it is worse.**

Checked instead of defended. The auction book and the ask book run through the *same*
`verifyListings()` with the same card: `chrome-auto` requires `/auto/` in the title, plus the card
code and the year, on both sides. So autos and base are not being mixed. Then:

**`listings-history.json`, 92 recorded "hammers", every one carrying `hammerLagMin`:**

| | minutes before the auction actually closed |
|---|---|
| min | 91 |
| q1 | 605 |
| **median** | **719 — about 12 hours** |
| q3 | 779 |
| max | 1,416 |
| observed within 15 min of close | **0%** |
| observed more than 6 h out | **95%** |

**These are not hammer prices. They are mid-auction bids, recorded a median of twelve hours early,
because the engine looks once a night and eBay auctions do most of their bidding in the final
minutes.** Florentino's $36.11 "hammer" had 21 bids on it with 11.5 hours still to run.

**The independent check confirms it:** the guides-rewrite session read 7 dated eBay sold records for
`#CPA-AA` on SportsCardsPro — **$55.00–$80.85** — while our book calls the same card $32–$57. Our
numbers sit below the real distribution, exactly as a systematic early-read would.

**WHAT IS RETRACTED, all of it written earlier tonight, none of it ever published:**
- The ask-over-hammer medians — "Pokémon/sealed +20%, baseball singles +110%", the +74.9% pooled
  median, the skew/kurtosis read and the Spearman(closes, gap) = +0.18 — **all computed on this
  data. Withdrawn. Do not quote them.**
- The **Home stat-tile spec** built on those medians. Withdrawn; nothing was built.
- The **r/baseballcards link post**, which was entirely this finding. **Pulled.**
- BCB26's `basisLabel` promise to *"restate to hammer basis at ≥60% SCP sold coverage"* is unsafe as
  written and must not be executed until the capture is fixed.
- The auction-desk line in this file — *"ask-vs-hammer gap well-sampled, sports +31%…+162%"* — was
  the same artifact. The gap is real in direction (asks do exceed clearing prices) and wrong in size.

**WHAT WAS LIVE AND IS NOW FIXED** (the site was making the false claim on 26 files):
`<h2>What buyers paid</h2>` and **"what buyers actually paid"** under the median, on **21 card
pages**; "Median hammer"; "Hammers · 30d / auction closes captured"; `/auctions` defining hammers as
*"the median of auction closes we watched"*; the chart's `hammer median` reference line; and the
meta description on 65 pages promising "auction hammers". All relabelled to **last bid seen**, with
the 12-hour lag and the word **floor** stated on the face of it: *the card sold for at least this,
usually more.*

**THE REAL FIX, not done tonight:** capture near the close. Options are an intraday poll of watched
auctions in their final hour (the engine is a nightly GitHub Action, so this is new work), or using
eBay's completed-items data where available, or simply keeping this as a published floor and
sourcing true solds from SportsCardsPro as we already do for singles. **Until one of those lands,
no lane publishes an ask-vs-sold gap figure**, and the `/auctions` desk stands as a bid watch only.

**What this cost and what it did not:** nothing wrong reached the public *as a number* — the marks,
indices and the board were never touched by this feed, exactly as `snapshot-free.mjs` intended
(`"OBSERVATION ONLY … Not published on the site; not yet a mark"`). What did reach the public was
the **label**: 21 card pages told readers a mid-auction bid was what buyers paid. The instruction in
the code was right and the surface ignored it. **A gate that compares what a feed says it is against
what the page calls it belongs in the instrument watch.**

## 30th CELEBRATION RELEASE NIGHT (2026-09-16) — the tape shipped, the engine block did NOT

The P0 read "engine block + fold at release." **Neither shipped, and the reason is the finding.**
Live `/api/comps` at 21:50 PT, release night:

| | Listings | Read |
|---|---|---|
| Mewtwo ex 157/128 (top chase) | **0** | no ask, no sale |
| Mew ex 158/128 | **0** | no ask, no sale |
| Every single in the 128-card set | **3** | Salamence ex 109/128 $0.99 · Articuno 097 $1.79 · Pikachu 031/128 $20.00 |
| Elite Trainer Box (no booster box exists for this set) | **3** | $175.00 single · $1,320/8 = $165.00/box · $2,060.95/10 = $206.10/box · **median $175.00 = 3.5× the $49.99 MSRP**, range 3.3×–4.1× |

An engine block would have been an **empty bordered box on the site's #1 lander on its release
day**, and `build-guide-fold.mjs` refuses to run without one — the fold hangs off the engine block
by design. Marking the ETB off its single clean listing is the Hernandez ruling and the
graded-ladder incident in a third costume. **Do not force a number onto a market that does not
exist yet.**

**Shipped instead** (`57089c2` → `7cf5acc`): a dated release-night tape at the top of the page —
the counts above as a table, labelled **asks, not sales**, merged into the release-day notice so
there is one box not two, with the arithmetic that matters (cheapest way in is $165/box inside an
eight-box lot against a $49.99 box; the Oct 2 Booster Bundle is $4.49/pack) and a plain statement
that **nobody has resold this set yet, so there is no support under a 3.5× day-one ask.**
Also corrected the line written earlier the same evening promising marks "with tonight's nightly
run" — there was nothing for the nightly to mark.

**Measured at a real 390×844 viewport (Playwright, mobile UA), three passes:** the verdict sentence
sits at **1.32 screens** and the table at **1.79**, against BCB26's 4,392px (≈5.2 screens) that
started this workstream. Table height 505px → 241px after the cells were shortened and given
`min-width:520px` so `.tbl-scroll` scrolls as designed instead of squeezing; `vs MSRP` was moved
ahead of `Ask` so **3.5×** is visible without swiping. Page 14.9 → 13.9 screens. 0 console errors.
**The DEST strip stays above it on purpose:** `tools/dest.py` re-inserts that block after the first
`</section>`, so hoisting content above it would flip back on the next run of that generator — not
worth fighting an idempotent tool for 244px.

**On the engine now:** `mewtwo-ex-sir-th26`, `mew-ex-sir-th26`, `th26-etb` in `data/watchlist.json`,
so the series starts the day the market does. **The two singles deliberately carry NO `slug`** —
naming the guide as host obliges the page to carry an engine block, and `audit-terminal`'s
`engine-host-consistency` check caught exactly that and FAILed twice before the slug came off. The
ETB carries no `sealedOf` because **TH26 does not exist** (still COMING on `/indices`), and a note
that two of its three listings are multi-box lots — `TITLE_BAD_SEALED` has to hold or it marks off
a lot.

**The tape is a snapshot with a fuse, because Mo's read is that singles take a few days to list.**
`audit-prices` check 4 now honours a page-declared **`data-prices-ttl="N"`** on the stamp element, and the
30th tape declares **3 days**. After that the gate WARNs on that page specifically while every other page
keeps the 21-day default. A 21-day fuse on a release-night claim is how this same page served 33-day-old
preorder copy on its release day; a page that makes a time-boxed claim now declares the box.
*(Negative-tested three ways: 6-day-old stamp with ttl 3 → WARN; same stamp with no ttl → silent at the
default; and the first cut of the patch broke check 6 by removing a variable it read — caught by running
the gate, not by reading the diff.)*

**TRIGGER, recorded on each card and here:** the first night a 30th chase card carries a verified
mark → add the `slug`, run `tools/build-engine-blocks.mjs` then `tools/build-guide-fold.mjs` on
`pokemon-30th-anniversary-2026.html`, add the `/card-<id>` 301 to `vercel.json`, and swap the
static tape table for the live block. **A number needs a market, not a deadline.**

## KEY EVENTS — FIXED 2026-09-16, with Mo's explicit approval

Mo approved the configuration change in chat. Applied in GA4 Admin → Events, verified in the Key
events tab (**1–6 of 6**):

| Key event | Stream data | Why |
|---|---|---|
| **`click`** | live | outbound click to eBay — **the revenue moment** on an affiliate site (~150 events/28d) |
| **`track_card_from_page`** | live | someone saves a card — **the retention moment** the whole return-user program is graded on (~20/28d) |
| `newsletter_signup` | live | already key; the email tier depends on it (1/28d) |
| `close_convert_lead` · `purchase` · `qualify_lead` | none, ever | GA4 default lead-gen placeholders, left alone |

**Standing rules from this incident:**
- **Key events count forward only.** Marking these does not backfill Sep 4–16; that window stays a
  hole and must be reported as one, never averaged over.
- **No retention or conversion number is quoted from Sep 4–16.** A clean baseline needs a full
  week of the new configuration — earliest read **Sep 24**.
- **A GA4 configuration change is an account setting: Mo approves it every time.** Tonight's was
  approved in chat before it was made.
- **Nobody is to change key-event settings without recording it here** — the Sep 3 change was made
  under Mo's account with no note anywhere, which is why it took thirteen days and a Reddit
  question to find.
- **Still open and separate:** the `DEST` block, and with it `dest_strip`, is gone from `/`, the
  four terminal-shell pages and every `/card-*` page. Not the cause of the blackout; still a real
  loss of signal on the highest-traffic surfaces. Belongs to the Terminal Builder, not to this fix.

**The monitoring hole this exposed, which is the CoS's to answer:** every gate on this project
checks the *site*. Nothing watches the *instruments*. The site auditor reads HTML, the three gates
read HTML, and the GA4 read has been an optional "when Chrome is reachable" step on the daily —
which the cloud runs cannot do, because scheduled runs have no browser. So a metric going to zero
for thirteen days was nobody's job. **Next weekly ships an instrument watch: key events, feed rows,
index marks and engine-marked card counts each compared against their own trailing median, with a
zero or a >60% drop raising a FAIL.** Every incident this week was an absence that nothing was
watching for — the stale mount, the modelled prices, the un-rebaked home level, and now this.

## MO'S RULINGS — 2026-09-16 LATE (all four of his open technical questions, closed)

**1. Hammer tape on Home — NO CHART. Two numbers, split by category.** Mo: *"I don't think hammer
candles on the home page - maybe just a normal line, hammers can be on individual card pages."*
Agreed, and the data says go further: **no line either.** 92 closes across 34 cards, **median 1.5
closes per card**, 7 cards at zero — a time series drawn through that implies continuity that does
not exist.

What the 26 cards with both a hammer and an ask actually show (2026-09-16 feed):

| Population | n | median ask-over-hammer | IQR | skew (z) | excess kurtosis (z) |
|---|---|---|---|---|---|
| All | 26 | **+74.9%** | +26…+150 | +3.41 (**+7.1**) | +12.68 (**+13.2**) |
| Pokémon SIR + sealed | 8 | **+20.0%** | +15…+33 | +2.00 (+2.3) | +2.48 (+1.4) |
| Baseball singles | 18 | **+110.1%** | +63…+154 | +3.08 (+5.3) | +9.26 (+8.0) |
| Closes ≥ 5 only | 9 | +100.6% | +39…+154 | **+0.08 (+0.1)** | **−1.53 (−0.9)** |

**Ask > hammer on 26 of 26.** Two findings that change what we publish:

- **The split is category, not liquidity.** Spearman(closes, gap) = **+0.18** — essentially
  nothing, and the *wrong sign* for a thin-market explanation. Spearman(ask level, gap) = −0.25.
  Pokémon/sealed at +20% and baseball singles at +110% is a 5× difference and it is the structure.
- **The fat tail is a sampling artifact, not a market property.** Pooled skew z = +7.1 and excess
  kurtosis z = +13.2; restrict to cards with ≥5 closes and both collapse to noise (+0.1, −0.9).
  The tail is the single-close cards — Kim at +703% on **n = 1**.

**Therefore, and this is a standing rule: never publish the pooled mean (+106.6%).** With skew at
z = +7.1 the mean is not a summary of anything. Publish medians, split by category, with n and the
date. Home gets a two-number stat tile, not a chart. **Card pages** get the hammer prints as dated
event markers on the existing nightly ask line — never a second line, never a candle — plus the
close count, so a one-close card reads as one close. Same rule as the graded marks: *the number
carries its own n.*

**2. `luis-hernandez-bcb26-auto` — RULED, and it did not need a methodology decision after all.**
The card has **exactly one auction close, $147.49.** Under the rule shipped tonight for graded
sales — a single print is a data point, not a price — n = 1 is not a mark. **CPA-LH stays
unpriced and stays out of the BCB26 basket**, and its card page shows the fact: "1 auction close,
$147.49", the way `#CPA-EH`'s PSA 10 now shows "one dated sale". The general rule, adopted so this
does not come back card by card: **a hammer-basis mark requires ≥ 5 closes in 60 days, is labelled
`hammer basis` on its face, and never enters an ask-basis index level.** BCB26's own
`basisLabel` already contemplates the whole index restating to hammer basis at ≥ 60% SCP sold
coverage — that is an index-wide event, not a per-card exception, and nothing about this changes
it.

**3. SV151 — Mo votes CLEAN MEDIANS.** One correction on the record: **SV151 is live** — activated
Sep 15, base 100, divisor 19.0946, one mark deep. Mo's note said "since it's not live"; it is, it
is just one day old, which is the best possible moment to restate.

*Mechanism:* the rulebook pre-committed to this before the first mark — **a basis restatement is a
logged divisor adjustment with the level unchanged, never a silent re-base.** We follow our own
published rule rather than improvising a re-base because it is convenient. Both figures (`price`
and `cleanMedian`) are stored per row from day one, so the restatement is fully auditable. Effect
on the level: **99.19 vs 100.00** — 0.81 of a point, the size of the entire question.

*The consistency cost, stated plainly, because Mo's Sep 15 ruling turned on it.* Marking on our
clean medians makes the **screen and the mark** more consistent, not less — the 6/4 liquidity
screen already counts our own clean comps, so today SV151 screens on one number and marks on
another. But DR25 and PRIS25 mark on PriceCharting's headline, so SV151 would diverge from the
rest of the Pokémon family.

*Plan, proceeding unless Mo says hold:* switch **at the Oct 5 quarterly reconstitution, announced
Sep 28** — an already-scheduled event where divisor changes are expected and announced. Compute
clean medians for the other four Pokémon baskets in the same pass and move them the same day if
the compute lands; if it does not, **each page states its own basis explicitly rather than
implying a consistency we did not compute.** A labelled difference beats a pretended match.

*One property of clean medians to disclose in the methodology box:* PriceCharting caps its
ungraded tab at 60 sold rows and 141 of 207 cards hit that cap, so a clean median's effective
lookback varies by card — weeks for a liquid card, months for an illiquid one. It is a *recent*
median, which is arguably what we want, but it is not a fixed window and must not be described as
one.

**4. Off-site links — Mo posted one to Reddit pointing at the Pitch Black page.** *Correction to
something the CoS told him:* the note that "X does not count (nofollow)" implied Reddit does.
Reddit marks outbound links `nofollow`/`ugc` as well, so **the post does not pass link equity
directly.** It is still the right move, for second-order reasons: it puts the page in front of
people who *do* run linkable sites and newsletters, it drives referral sessions, and it gets the
URL crawled. The dofollow links come from whoever picks it up, not from Reddit. **Action for the
next Chrome-linked run:** get the post URL from Mo, confirm the rendered link's `rel`, and read
GA4 referral sessions from reddit.com for `/pitch-black-set-guide` — that is the first real
measurement of whether this channel does anything. Until then it is a hypothesis with one trial.

**5. Mo agreed to all open vetoes** (2026-09-16): the SA benchmark ruling, the discovery
re-weighting, the site auditor's probation terms, the return-user program, and Terminal step 5.
*"I agree with all your vetos, I won't say no to them."* None of these needs to be re-raised.

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
- **Vercel and GitHub are the CoS's to operate (Mo, 2026-09-18: "I don't want to touch GitHub or Vercel really — I give you full authority").** Redeploys, cancelling stuck or stale builds, and repo settings are CoS actions in Mo's Chrome (Browser 1 is signed into both); the CoS still never types a password — if a session is signed out, that one sign-in is Mo's.
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

**~~SV151 IS LIVE~~ — SV151 IS NOT LIVE AND IS NOT IN THE REPO. Path A closed 2026-09-17:**
the desktop-linked CoS session ran the check in Mo's own clone `~/Projects/shopcardhub` (HEAD `edb8b15`, three days stale) and in a clone of origin taken the same minute. `tools/build-sv151.mjs`, `scarlet-violet-151-index.html` and an `SV151` key in `data/indices.json` **do not exist in either tree** (R7 satisfied: `ls`/`git ls-files` in a clone taken this run). The Sep 15 build was never on Mo's machine and never reached `main`; it died with the sandbox that made it. **Path B is now the only path: rebuild from `claude/cos/sector-index-rulebook-2026-09-15.md`, and Sep 15 is NOT a valid inception date** — the rulebook is forward-start, no backfill, so inception is the day the rebuilt index first marks. The 151 link post stays held until that page is live. The figures below are the Sep 15 session's own report and are UNVERIFIED — treat them as a spec to rebuild against, not as state. Originally recorded as: activated Sep 15. `status: live` · inception 2026-09-15 · base **100** ·
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

- **P1 (Wednesday build) — Ending Soon: widen `/api/auctions` to each index's top constituents** (Mo's homepage ask, Sep 19: "top 5 cards from each index"). Today the desk's universe is `data/watchlist.json` (38 cards); add the top 5 of each live index by price from `data/indices.json` baskets as auction-only entries (no nightly mark, no Vault key — a `desk:true` flag, never a `slug`), one Browse call each (~40 more per cache miss, well inside the 5k/day quota), rows tagged with the index ticker. Home's "Ending soon" and `/auctions` both pick it up unchanged. Never a mark, never an index input — the ≥5-closes rule stands.
- **P2 (every Monday re-bake) — `data/releases.json` is hand-curated:** prune past rows and add the next dated releases from topps.com's calendar and the Pokémon calendars before `build-home`; the builder refuses an empty upcoming list. A dated row needs a source; a window without a day is `expected`, never a made-up date.
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

- **Sep 21 ~14:30 PT (CoS, Mac-linked, Mo in chat) — VENDOR BRIEF DELIVERED; handoff FAILs fixed first.** Per the X Desk Watch's own sequence: (1) `d57f6cc` — `data/x-board.json` now carries `currentSignal` parsed off each seat (Signal stat, else the "Verdict:" line; the build refuses to ship without one) with the historical call renamed `loggedCall` + scope line and grade only on a finalised graded call; both generators take the newest dated "Correction ·" block over the tape column and assert the caption never seats a player at a number the table does not (negative-tested against the stale "Gonzales takes #4"). Regenerated JSON + `og/x/board-latest.png`, gates 0/60 · 0/3 · 0/1, live md5-verified. (2) The brief (`Card Hub/x-desk/vendor-brief-2026-09-21.md` message section, housekeeping cut to two lines per Mo + one line naming `currentSignal` as the vocabulary) sent through the Grok Bot app 14:15 PT. **Vendor acknowledged within a minute:** "Routines updated (outbound replies ×5, 09:00±10, A/B from Sep 28). Content room briefed — Tue Kim draft must flip WAIT→PASS. Replacing A' with the gate restored now; will send the new link, then start today's five outbound replies." Did not name Monday's arm — the 17:30 watch reads it off the first Sep 28 post. **Tournament: start Mon Sep 28, verdict Mon Oct 26; primary metric t.co sessions per post; gate = doubling at 12 posts/arm.** X Desk Watch stands up `Card Hub/x-desk/post-log.csv` at its next run. (3) Mo ruled **"leave the bots"** — no Vercel country block; NEEDS-MO empty. Open watch item: the vendor's third replacement of the day should carry a "replacing an earlier post" line (directive 3) — the 17:30 run grades it.

- **Sep 21 ~14:00 PT (CoS, Mac-linked, Mo in chat) — the site auditor's LAST filing, adjudicated.** Mo doubted the report; each line checked live. **GSC — the auditor was right on the facts** (read in Chrome, property `https://www.shopcardhub.com/`, last update 9/17): 3 indexed / 99 not; *Crawled – currently not indexed* 29, validation **Failed**; *Discovered – currently not indexed* 70, not started; sitemap Success, 101 URLs, **last read Sep 7**. Ruling unchanged: Google is 4% of search, Bing is the channel, technical SEO is closed, zero indexing-request spend — the only Google lever is links, and this is now the standing GSC baseline; do not re-file it. **Gonzales double-mark MED — true when filed, already reconciled live** ($127 −15.4% in both the tape and Screens after the 13:22 PT Monday re-mark), but the class is real between Monday re-bakes: the tape's card items are the index basket's Monday mark vs prior Monday, the Screens table is the nightly ask. **Fixed `e1de43b`:** tape sub label reads `BOW26 · Mon mark`, baked tape relabelled, `home.js ?v=6`; live-verified in a headless render. Gates 0/60 · 0/3 · 0/1. **Mo's clone (`~/Projects/shopcardhub`, `edb8b15`, a week stale, 9 stranded Sep 15 files) — NOT synced:** backed up again to `Card Hub/ledger-backups/2026-09-21-clone-sync/` (files + `uncommitted.diff`); the fast-forward needs to unlink files deleted upstream and the delete grant was refused by the session's safety layer, so a partial reset was rolled back (index restored to `edb8b15`, three stray `*.lock` files renamed `*.stale-2026-09-21`). **Decision: leave it.** With the MWF auditor deleted, no lane mounts that clone; it is inert, and syncing it is a convenience for Mo, who has said he is not touching git. Mo reports the desktop auditor task deleted and the CoS task edited to Sunday-only — verified Wednesday by the absence of a `site-audit-2026-09-23.md` and of Tue/Thu checkpoint files. **Observation, not a finding:** BCB26 re-marked **73.14, −23.55%** on the week by the Monday lane — an ask-basis index moving a quarter in a week deserves the Wednesday weekly's eyes before the Tuesday Tape quotes it.

- **Sep 21 ~13:30 PT (CoS, Mac-linked, Mo in chat) — THE CADENCE CUT.** See the block at the top of this file. Cloud tasks re-cadenced/deleted via the scheduled-task API (cron-only edits; ids: Integrity Watch `trig_01N14qVz8gtHCFHCL6TQNcsZ`, Ideas Desk `trig_016ppW1e5SPGio6X3Wf2k83E`, X Desk Watch `trig_013U6U94vAk19yDdWZv82SFd`, Gengar `trig_01CTxnDGUuRcgPYeixbb4N4g` deleted). `vercel.json` ignoreCommand + cron removal, LANE-RULES cadence table, this file and NEEDS-MO pushed from a fresh deploy-key clone on the Mac; the Monday price lane had pushed `42762e7` two minutes before this clone was taken — fetched and merge-base-checked before push. Project copies of STATE and NEEDS-MO mirrored from the pushed tree in the same run.

- **Sep 21 ~13:10 UTC (Engine Watch + Mobile QA, daily — cloud; entry mirrored from the Project copy by the 13:30 PT CoS run).** Feed day 2026-09-20 at 13:06Z (nightly not landed yet, in-window): 38 cards, 33/38 numeric `last`, 37/38 `image.url`, signals 27 HOLD / 10 SELL / 1 BUY, 10 gated, zero BUY/SELL on gated. GA4 snapshot 2026-09-20T13:16Z (last pre-bot-filter snapshot): KE yesterday 5 / 58 sessions, organic KE7 6.33% beside blended 4.71%, returning7 5.61%, clicks7 39 (buystrip 2 · buybox 3), Singapore 104 sessions/7d @ 0.15 s. Mobile QA 5/5 clean. origin/main `7ce80d1`. **Ideas ruled: #34 adopted** (Wednesday build week of Sep 21, pairs with #30) · **#35 adopted** (Sep 28 build; ships only pages the guard clears at ≥3 clean set listings). NEEDS-MO: the GA4 bot-filter item CLOSED as actioned; one open item = the Vercel country-block decision. Prompt/table drift noted a 5th run. Cloud run, no push. *(Later the same day the 15:25Z snapshot carried `summary.bots`: Singapore 127 + China 20 = 147 of 376 sessions, 39.1%, clean KE/session 13.1 vs raw 7.98 — the filter works.)*

- **Sep 19 ~08:15–08:55 PT — HOMEPAGE REWORK, LIVE `95c9335` (+ `228b6e6` docs/v5) (Mo in chat: "I don't love our homepage… 'from the engine last night' is too trader, not investor… defer this to you and your agents"; Seeking Alpha home + portfolio pages as the template).** Ruled and shipped in one session, all four of Mo's suggestions taken: **(1) the ticker tape is back, replacing the In Focus strip** — top of the main column; every live index (level, Δ vs previous mark) then the top 5 cards of each index by price with their change vs the previous re-mark, straight from `data/indices.json` baskets (49 items, two runs, transform-only loop ~3 s/item, pauses on hover/focus, static + scrollable under reduced-motion; the one ambient loop the page keeps, per site-fixes.css). **(2) "Upcoming releases" replaces "From the engine last night"** (top right): new `data/releases.json`, Pokémon + sports, every date read today from topps.com's calendar (Bowman Chrome Mega boxes Sep 23 · Pristine BKB Sep 24 · Museum + A&G Oct 7 · Flagship BKB pre-order Sep 22) and two Pokémon calendars (30th waves Oct 2 / Oct 30 / Nov 6 / Dec 4; **Delta Reign Nov 6 is labelled "reported" on its face** — not on pokemon.com yet); Chrome Update and Bowman Draft carry "expected window" text, no fake day. `build-home` refuses a link to a page that does not exist and refuses an empty upcoming list; `home.js` hides rows whose date passes between Monday re-bakes. **(3) Board movers moves up** into the Trending-Analysis slot. **(4) The Auction Desk panel is "Ending soon"**: bids first, soonest close first, a family tag per row (Board / BCB26 / Pokémon / Sealed / Sapphire), eBay clicks reported like `/auctions`. **The honest limit, told to Mo:** the desk's universe is still the 38 tracked cards, so "top 5 of every index" is not in that feed — widening `/api/auctions` to each index's top constituents is queued in OPEN ITEMS, not faked. The engine panel's two useful facts (feed day, marked/gated) already live in the header stamp; `renderEngine` is kept for callers, off the page. **Also closed en route:** the Monday-scan trap — `home.js` links a sealed product to its index page only when that index exists in `data/indices.json` (th26-etb → `/indices`, no more dead `/th26-index`), and slugless cards link `/card-<id>` since all nine BCB26 card pages exist; the Monday `build-home` needs no hand substitutions. `data/home-focus.json` deleted (nothing read it). `interactions.cjs`: In Focus / engine scenarios replaced by "tape item (animation paused)" + upcoming-release links. Gates in the cloud clone AND the Mac clone: 0/63 · 0/3 · 0/0 (+ `--run-tests` 0 FAIL, 83 scenarios on `/`). Render 1440h 3,193 → 3,096, 390h 5,804 → 5,505, 0 console errors. Push from a fresh deploy-key clone on the Mac (patch replayed from the cloud, md5 matched); Vercel built within 90 s, no zombie; live md5-identical 15:44Z. **Not touched, on purpose:** Mo's "cards in my Vault" tracker = `HOME:mine` (W2, Sep 22–28); no new page, no nav change, freeze respected.
- **Sep 19 ~07:10-08:05 PT - Grok Bot check-in (Mo: "make sure they aren't stuck in a loop") + the fix.** Read the vendor app and the ShopCardHub Content room with background computer-use, read-only. **Not hung - spinning.** Every routine fired, left its room line and stopped; **no routine wrote to X (condition 1 held), every pulse left a line (condition 2 held)**. But Seeker's hourly ran 2:14, ~3, 4:09 and 5:00 on Sep 18 carrying the **identical three angles** every pulse (its own 5pm line: *"no new angles vs 4:09"*) while Coach, Creator and Auditor re-ratified the same Monday sequence each time - four seats, four pulses, zero new information. **Condition 3 was never met:** no 5:30 PM report, and the Sep 18 15:06 PT ruling is still the last message in the vendor thread, unconfirmed. **The cause was ours.** `og/x/board-latest.png` and `data/x-board.json` - the vendor's two fixed-path URLs (`claude/lanes/bowman-bangers-tuesday.md`) - had 404'd since Sep 8; the desk re-reported the gap every pulse, appended "No owner escalation", and correctly refused to fake a visual. **Shipped `3aeef18`, live-verified 07:5x PT (both 200, PNG 89,695b, JSON 6,277b):** make.py `bangers` now also writes `board-latest.png` in the same out dir; **it reads the ranking rule off the page (`p.section-intro`) instead of the hardcoded "two ladders together: raw sold AND PSA 10 sold", which went stale when the board moved to one ladder on Sep 17** - it would have published a methodology the page no longer uses; and the column layout is fixed (PSA 10 ran into ENGINE ASK on every row, Holliday's "$720.00 (1 dated sale, Aug 6 2026)" crossed two columns) with per-cell measurement and the PSA sale count wrapping to line two rather than being dropped. New `tools/build-x-board.mjs` generates the JSON - seats, labeled marks, sale counts, current verdict per seat, rule, as-of - all parsed off `bowman-bangers.html` and `calls.json`, nothing inferred; a player with two calls carries the live one (Fischer: the Sep 11 re-entry, not the finalised Jun 12 BUY). Nudge sent to the vendor 07:35 PT: confirm the three conditions, one line per pulse when there is no new angle, stop re-listing the 404, and answer the standing question - **cloud runner, or do the hourly routines only exist while the laptop is open?** **Also, caught by Mo on the live site:** the DR25 chase row for "Team Rocket's Mewtwo ex SIR #231/182 Destined Rivals" linked to `/ascended-heroes#engine-tr-mewtwo-ex-sir` - a different card in a different set sharing a slug, the only row on that page with a chart link and the only cross-set mislink sitewide. Link removed (no chart exists for the DR25 card) and `audit-site.mjs` now FAILs on any chart link whose target block names a different set than the row does, or that does not exist (negative-tested). Gates after: **audit-site 0 FAIL / 3 WARN**. Push from a fresh deploy-key clone on the Mac; nothing run in a mounted repo.
- **Sep 18 ~15:15–15:45 PT — pokemon-30th top redesign (Mo: "the top seems a little busy").** `d46d7e4`. Read the live page with page-polish: on a phone the hero was 404px, the buy module 1,584px (1.9 screens: six tiles, three of them saying "no live listing" or "only lots", four buttons, three lines of fine print), then the destination strip, then two engine blocks (Mewtwo 1,969px with the chart open), and the guide at **6.75 screens** (2.8 on desktop). Shipped: one-sentence hero sub + three chips (machine stamp kept); buy module cut to the three tiles with something to say (ETB live ask, Booster Bundle cheapest pack, Ultra-Premium Classic pack), the other three products as one "Also shipping now" line with the same EPN links, two buttons instead of four (the chase-card buttons duplicated the engine blocks below), fine print halved with the EPN disclosure sentence verbatim; `js/engine-block.js` JS_V 5 — only the first card's chart opens at rest at any width (8 hosts regenerated). No price, MSRP, link or customid moved; Gengar's ETB query untouched. Gates 0/63 · 0/3 · 0/0. **Deploy: Vercel's queue was jammed, not skipping.** The `d46d7e4` build sat in *Initializing* for 30+ minutes (a zombie on the Hobby plan's one-at-a-time queue) while GitHub's webhooks for the earlier pushes arrived 30–40 minutes late and queued *behind* it (`aa4dd22`, then `2f8ef53` — both older trees that would have regressed production had they built after the fix). **Mo, 15:40 PT: "I don't want to touch GitHub or Vercel — I give you full authority."** Acted on it in his Chrome (the X-signed-in profile is also signed into Vercel): cancelled the two stale queued builds, redeployed `d46d7e4` (Ready in 14s, Production at 21:52Z / 14:52 PT), cancelled the zombie. **Live-verified 15:00 PT with Playwright at 390px — before → after:** hero 404 → 312px; buy module 1,584 → 966px (1.9 → 1.1 screens); first live ask 0.93 → 0.77 screens; guide 6.75 → 5.91 screens; page 9.1 → 8.3 screens; Mew's chart now folded at rest, Mewtwo's open; no horizontal scroll. The remaining bulk is the engine block itself (Mewtwo 1,969px on a phone: 9-cell band with five dashes at 2 days of history, chart, distribution, hammers, four listings) — a generator item for Wednesday: on a phone, collapse the band to the cells that have a value and fold the listings behind "Show listings". **Standing rule from today:** after every push, check the Vercel deployments list (Browser 1 is signed in); a build in *Initializing* > 5 min is a zombie — cancel it and Redeploy; a queued build of an OLDER commit than production must be cancelled before it completes. Authority for that is Mo's, granted in chat 2026-09-18.
- **Sep 18 ~13:35–14:50 PT — PF25 built + polish pass; DEPLOY STALLED ON VERCEL.** Mo in chat: build the Phantasmal Flames index now (his son asked; the blue Mega Charizard X ex SIR #125 is the chase). **`2f8ef53` — PF25 Phantasmal Flames Chase Index**, live at inception 100.00 on 2026-09-18: chase tier #95–#130, 36/36 priced off PriceCharting ungraded solds today (console page, curl, no login), price-weighted, no cap (PB26 family, not the SV151 sector model — consistency with the five Pokémon indices beside it), basket $1,203.17, divisor 12.0317, Charizard #125 $734 = 61.0%, #130 HR $253 = 21.0%, effective holdings 2.4, weight skew +4.99 / excess kurtosis +24.4 (a two-card index, said plainly on the page). Page on the CR26 template, accent #4fa8ff with a flame glow on the level; nav + sitemap + sealed booster-box row + watchlist sealed entry; build-nav 104 pages. **Home was re-baked against the Sep 18 feed** (home-index-level gate requires a HOME:markets row for every live ticker) and the bake's three dead links were corrected by hand inside the generated block, on the record: `/card-*-th26` → the guide's `#engine` anchors (redirects exist; audit-site is redirect-blind), `/th26-index` → the 30th guide. home.js fix stays Wednesday; the Monday re-bake will hit the same three links — **Monday scan: apply the same three substitutions after build-home, or skip the bake.** **`aa4dd22` — polish pass from the new skills** (page-polish, design:accessibility-review, humanizer, marketing:brand-review, design:ux-copy): additive CSS (focus rings, hover/pressed, tabular-nums, contrast — the 30th eBay button was 1.34:1 white-on-yellow — touch targets, spec-table styling) + 15 prose edits on the board and the 30th guide; full findings and the Wednesday list in Project doc `claude/cos/site-pass-2026-09-18.md`. Gates on both commits: 0/63 · 0/3 · 0/0. **⚠ Vercel did not deploy `2f8ef53` within 10 minutes** (site still serves the 20:12Z build, etag 9236…); Vercel is signed out in Mo's Chrome, so the redeploy was handed to Mo (NEEDS-MO). **Resolved 15:03 PT:** Vercel skipped deployments for `2f8ef53`/`aa4dd22` but built `4e1ae23` (the docs commit behind them) from the full tree; `/phantasmal-flames-index` 200, PF25 in `indices.json` and on the home Markets panel, polish CSS + prose live. IndexNow pinged 79 URLs. Pattern for the record: a skipped webhook catches up on the next push. **Freeze note:** PF25 adds a nav item and a page inside the Oct 26 freeze on Mo's direct instruction — recorded, not a precedent. **Follower baseline** 2,433 stands; X Desk Watch's first 13:30 run reads the vendor's new voice.
- **Sep 18 ~13:20 PT — plugin/skill ruling (Mo: "cruise through quemsah/awesome-claude-plugins, install what you like, your call").** Read the top-100 list. **Adopted as account skills (proposed to Mo's skill library, pre/post copies not needed — they are new):** `humanizer` (blader/humanizer v3, MIT, condensed; two project rules on top: numbers/labels/links/marker blocks are never touched, Mo's collector-typing voice is the sample) and `page-polish` (derived from Leonxlnx/taste-skill's redesign skill, MIT, cut to what fits a dark data terminal: audit-first, states/tabular numbers/phone fold first, brand fonts and palette untouchable, generated blocks untouchable, freeze respected). **Suggested from the claude.ai catalog (Mo clicks install):** Anthropic `marketing` (brand-review, content, email sequence, performance report) and `design` (critique, WCAG audit, UX copy) for the return-user program. **Declined, with reasons, so nobody re-proposes:** taste-skill v2 itself (its own header says not for dashboards or data tables, which is our whole site); impeccable (24-subcommand design language, overlaps page-polish, Claude Code marketplace only); last30days (needs Python/yt-dlp/keys per machine; the Ideas Desk already does topic research); superpowers/BMAD/ccpm/spec-kit/oh-my-claudecode (process frameworks for feature teams); caveman/headroom/context-mode (token tricks, cost nothing we have); claude-mem/mem0/mempalace/beads/agentmemory (memory runtimes; our memory is git + this file); claude-seo/searchfit-seo (technical SEO closed Sep 16); marketingskills CRO checklist (already ruled use-once Sep 18); every agent-persona pack. Nothing installed runs unattended; skills are read by interactive sessions only.
- **Sep 18 ~13:05 PT — X Desk Watch hygiene (JOB 3) + vendor voice change.** Scheduled task `trig_013U6U94vAk19yDdWZv82SFd` updated (pre/post copies in `Card Hub/deploy/friday-cos-2026-09-18/`): cadence **13:30 + 17:30 PT** (cron `30 20,0 * * *`; LANE-RULES table row amended in the same commit — all three copies now agree); the **rendered-in-a-browser grading rule** added to check A; the deviceId line rewritten. **Correction to the lane's own filing:** Chrome's "Browser 1/2" display names are assigned per session (this session saw them swapped vs the lane's run), so the prompt names the deviceId and the profile, and lanes must select by id and verify the X sign-in on the profile header, never trust the name. **X read this run (signed-in profile, Sep 18 ~12:55 PT): 2,433 followers / 458 following** — recorded as the follower BASELINE (none existed); last three vendor posts 26 · 33 · 31 views, 0 likes, 0 replies, 0 reposts. **Mo's direction (in chat): posts are too math/trader heavy, we are losing followers, say simple things ("hey we made an index tracker").** Voice-change brief sent to the vendor through the direct channel (Grok Bot app, ~13:00 PT): one idea per post, plain English, tell people what we built and why they'd use it, no z-scores / basis labels / liquidity-gate / two-decimal levels in the tweet (labels stay on the site), ≤2 rounded numbers a reader can see on the linked page, rotate indices / board / Vault / how-to tips, ask questions, image + main-post link, all claims/taxonomy/exposure rules still bind, aim for 09:00 not 09:39, report followers/impressions/link clicks in every Monday note. Its Sep 18 image FAIL was confirmed overturned to it (no correction, nothing comes down). **X Desk Watch grades the new voice from its next run; the follower trend is the Monday number.**
- **Sep 18 ~12:30–12:50 PT — Friday push LANDED (Mac-linked CoS session, Mo in chat).** Replayed the evening session's four commits from the Project patch in a fresh deploy-key clone of `a7eddb3` → `0d9ae49` (board re-seat) · `486c246` (30th trigger + ENGINE regen + build-nav 103 pages) · `b6c8291` (ledger/STATE/Markets label). Gates in the clone: audit-prices 0/63 · audit-site 0/3 · audit-terminal 0/1 (0/0 with `--feed`). **Live-verified 19:48Z:** all three pages md5-identical to the repo; seats 1 Fischer · 2 Holliday · 3 Gonzales · 4 Florentino · 5 Kim with the Sep 18 correction block; both 30th ENGINE blocks live and the ttl-3 tape gone; `/card-mew-ex-sir-th26` 308s to the guide; IndexNow pinged. build-home NOT run (th26 dead-link trap, Wednesday's fix). Per JOB 2: no correction to the Grok vendor; both do-not-post holds stand; buy-strip wiring stays Gengar's Monday.
- **Sep 18 evening — Friday release-window work (CoS session, Mo in chat).** Reviewed the day's filings on Mo's instruction; two builds shipped by parallel agents and CoS-verified: board re-seat under the published gate (`0d9ae49`) and the pokemon-30th engine-block conversion on the fired trigger (`486c246`); `iw-2026-09-18-1/-2` appended to `pipeline.json` as `applied`; gate baseline restated 63/3/1 with the cause named; buy-strip wiring left for Gengar Mon Sep 21. Push path per the EVENING block.
- **Sep 18 07:00 → 11:10 PT — Mo present, three yeses.** calls.json corrections live; GA4 keyless nightly built end-to-end and verified; two prompts rewired to read it; EPN blocked on Mo's sign-in.
- **Sep 17 23:00 → Sep 18 06:20 PT — overnight run (Mo asleep).** Repo scan + gap analysis + Earnings Ideas Desk created (see the 2026-09-18 block); two prompts repaired; 05:00 Integrity Watch adjudicated (1 → NEEDS-MO, 1 → seats move). Docs committed from a fresh clone on the Mac; no site HTML changed.
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
