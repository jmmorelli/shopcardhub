HEAD 0550a67 · origin/main 0550a67 · delta 0 commits · gate WARN 76/3/0 vs baseline 76/3/0

> **UPDATE ~11:00 PT: PUSHED `b9af82f`.** Mo asked in chat to retry the connection, and the Card Hub folder was granted. On the Mac: fresh deploy-key clone at `0550a67`, then `git am`. The tree hash matched the staged patch (`9fb010e8…`). Gates on the Mac: audit-prices FAIL 0 / WARN 76 · audit-site 0 / 3 · audit-terminal 0 / 0, the same as the baseline. Fetch + rebase (no-op), then push `0550a67..b9af82f`, confirmed with ls-remote. **Live checks (~95 s later):** `/css/site-fixes.css` carries "8b (Site Sweep"; `/hobby-box-roi-calculator` shows "Value · Profit"; `/best-hobby-boxes-2026` shows "Real pull-value math". I re-measured the phone dock on production for best-hobby-boxes, topps-flagship-football, bowman-bangers, jacob-misiorowski and topps-update-series: title 362 px wide on all five and no button past 390. `$HOME/k` and the clone were removed. The Project patch file is now historical. **Desk: nothing to apply from this run.**

# Site Sweep — 2026-09-28 (first run; fired 17:24Z, scheduled 17:10Z)

**(Original run, superseded by the update above:) MAC UNREACHABLE (for pushing).** The Mac was online, but the Card Hub folder wasn't connected to this session, and the sandbox refused the folder-access request. With no deploy key, nothing was pushed. The fixes are staged as a patch for the 14:00 desk: Project `claude/handoffs/site-sweep-2026-09-28.patch.txt`, commit `d7cf0c1` on parent `0550a67`, tree `9fb010e86a0b03d0e564ece40ae1c6a089d0fdb0`.

STEP 0: read `LANE-RULES.md` from a fresh HTTPS clone (GO-TIME block, R1–R11, R20, R25), plus the STATE top and the last 2 run-log entries. There was no earlier site-sweep file; this is the first run. The clone started at `bbb58b7`, and `origin/main` moved to `0550a67` (`feed: nightly 2026-09-28`) during the run. I fast-forwarded before editing.

## Bugs — 4 found · 2 fixed (in patch, not live) · 2 filed

**Sweep:** 93 sitemap URLs × 1366×900 and 390×844 = 186 loads, all 200. I aborted analytics/beacon hosts and scrolled every page to the bottom before checking. Results:
- Page errors: 0
- Broken same-origin images: 0
- Visible "undefined" / "NaN" / "[object Object]": 0
- Same-origin links: 180 unique, 0 non-200
- eBay links: 2,686 link×page pairs, all carry `mkevt=1` and `campid=5339155990`. The only exception is the `partnernetwork.ebay.com` disclosure link on `/`, which is not an affiliate link.
- Fanatics links: 67, all start `https://fanatics.93n6tx.net/c/7388044/4029520/9663?u=` and carry `subId1`.

Fixed in the patch:
1. **Phone buy-strip dock broken on 28 pages (MED, conversion).** When a strip carries the Fanatics button (`.bs-fan`), the docked bar squeezed the title and live ask to **0 px** and pushed the Fanatics button past the right edge (right = 400–425 px at a 390 viewport). The docked bar is the first buy button a phone visitor sees on these pages. Affected: every `topps-*` page with a Fanatics link, plus `/bowman-bangers`, `/bowman-chrome-baseball-2026`, `/bowman-football`, `/bowman-sapphire-2026`, `/best-hobby-boxes-2026`, `/nfl-rookie-cards-2026`. The `-rep` gear pages were cramped too: title 39 px on Misiorowski, 53 px on Rutschman. **Fix:** `css/site-fixes.css` §8b. A dock that carries `.bs-fan` or `.bs-rep` now stacks: title, then live ask, then the buttons sharing one row. The docked Fanatics label reads "At Fanatics →". Both links, the `subId1` and the in-flow strip are unchanged, and desktop is untouched. I checked it against production by serving the patched CSS on all 50 Fanatics/rep pages: 0 bad, title width ≥ 150 px everywhere.
2. **`/topps-chrome-formula-1-2026` phone overflow, 7 px.** The in-flow `a.bs-go` ("Shop 2026 Chrome F1 hobby boxes on eBay") would not wrap. **Fix:** in-flow `.bs-go` may wrap on phones. scrollWidth is now 390.

Filed:
3. **Transient font 502s (LOW, no action).** `/fonts/barlow-condensed-800.woff2` and `-900.woff2` each returned 502 once in 186 loads (on `/bowman-bangers` desk and `/aiva-arquette-1st-bowman` phone). Both returned 200 on re-check. Filed only so a repeat is recognised.
4. **Home board dates, observation only (not a finding).** At 17:30Z Monday, `/` showed PB26/CR26/AH26/PRIS25/DR25 at "Sep 21 · 5 marks" and PF25 at "Sep 18 · 1 mark". TH26/SV151/BOW26 are already dated Sep 28. The Monday lane's re-mark had not landed at sweep time. This belongs to the Monday lane and Integrity Watch; I'm noting it for the desk.

## UX — 3 pages read (rotation: sitemap order, 3/day from index 0; next run starts at index 3: `/best-baseball-cards-under-50`, `/best-basketball-cards-under-50`, `/best-football-cards-under-50`)

Pages: `/` (the weekly home read), `/best-hobby-boxes-2026`, `/hobby-box-roi-calculator`. Phone and desktop screenshots, first screen and second screen.

**The 5-second test:**
- `/` passes. The H1 and the "It starts at 100" line explain the page, and the board is on the first desktop screen.
- The other two pass on the title. They fail on what to do next on a phone: the buy strip sits under a 700 px hero (the dock covers this), and the calculator starts about two phone screens down.

**Fixed (in patch):**
- `/hobby-box-roi-calculator` hero:
  - "total EV, net profit or loss, ROI, and…" → "what the hits are worth, your profit or loss, and…"
  - Chip "EV · ROI · Break-even" → "Value · Profit · Break-even"
  - "Bring your own sold comps" → "Bring your own sold prices"
- `/best-hobby-boxes-2026` hero:
  - "ranked by expected value and ROI" → "ranked by what you can expect to pull for the price"
  - "Real EV math included" → "Real pull-value math"
  - `<title>`, meta and og were left alone for SEO. The EV math itself stays below, where it is explained.

**Filed:**
- **U1 (MED, Integrity Watch → desk): `/best-hobby-boxes-2026` is dated June on a top lander.** The hero meta says "Updated June 2026". The quick-reference paragraph says "All prices sourced from eBay completed and recently sold listings, June 2026". That is three months stale, and it names eBay solds as the price source, which is the basis R20/Phase 2 is retiring. This needs a dated re-read of the seven boxes on SCP sold data, not a copy swap, so I didn't touch it (prices are out of scope). The page has an EPN action on record (never-fold list).
- **U2 (MED, Wednesday weekly): the ROI calculator sits about 2 phone screens below the hero.** Proposal: move the `DEST` strip (Vault/Bangers cards, `tools/dest.py`) below the calculator on this page only, so "Run your box" is the second thing a phone visitor sees. On desktop, the "HOW IT WORKS" eyebrow also sits flush against the DEST cards with no gap. Add `margin-top: 28px` to that section when DEST moves.
- **U3 (LOW, desk; generator `tools/build-home.mjs` / `js/home.js`): home SEALED buttons read "BOX EBAY →", "ETB EBAY →", "HOBBY BOX EBAY →".** Proposal: "BOX ON EBAY →", "ETB ON EBAY →", "HOBBY BOX ON EBAY →", with a check that the column holds at 390. It's a generated block, and I couldn't run the generator this run, so it isn't done.
- **U4 (LOW, desk):** on the home phone view, the three numbered cards push the first index row to about 780 px. Folding them to a single row of links on phones would put 3–4 board rows on the first screen. This needs taste, so it's filed rather than done.

## Commit / push

- Commit: `d7cf0c1` (patch only; **not pushed**). Trailers: `Task-key: site-sweep`, `Authority: Mo 2026-09-27`.
- Files: `css/site-fixes.css` (+14), `hobby-box-roi-calculator.html`, `best-hobby-boxes-2026.html`. Public files only, no generated blocks, no prices.
- **Desk:**
  1. Fresh clone, then `git am` the Project patch.
  2. Check the tree hash matches `9fb010e8…`, or rebase if main moved.
  3. Run the three gates, push, then curl `/css/site-fixes.css` for "8b (Site Sweep" and `/hobby-box-roi-calculator` for "Value · Profit".

## Gate lines

- `audit-terminal`: FAIL 0 · WARN 0 (117 pages, `--feed data/feed`, on `bbb58b7`).
- `audit-prices` and `audit-site`: they ran on `bbb58b7`, but only the WARN tails were captured (known baseline WARNs: `no-machine-stamp`/`non-numeric-price` on the tier-label Topps pages; `first-bowman-unverified` ×2 shown). The summary lines were not captured, and the sandbox refused a re-run. **The patch tree is ungated. The desk gates it before any push.** The patch changes no price cell, no stamp and no generated block, so no gate delta is expected.

## Live checks

None. Nothing was pushed. Production was read before the edits (R5): the dock defect and the F1 overflow both reproduced live at 390 px. The patched CSS was verified by serving it over production pages.

## Stumbles

- **The folder-access request for "Card Hub" was refused by the sandbox's permission layer.** The Sep 27 and Sep 28 league runs got the same request granted. Mo, or the desk, may want the Site Sweep task bound with the Card Hub folder attached so it can push, as its prompt intends.
- **Re-running the repo's gate tools was refused** after the first run (classified as running external code). That's why the gate summaries above are incomplete.
- My first overflow pass skipped `position: fixed` elements by design, so the dock defect only showed up in the screenshot read. A dock-specific check now runs in the sweep script, and next run keeps it.
- `STATE.md` run log was **not** appended. The rule is both copies or neither. The repo copy needs a push, and STATE says only the CoS writes it. The desk can add this one-liner:
  `Sep 28 10:24 PT Site Sweep (first run, cloud; Card Hub not connected → patch): 186 loads · 4 bugs (2 fixed in patch d7cf0c1: phone dock on 28 pages + F1 overflow) · 5 UX copy swaps in patch · filed best-hobby-boxes June dating (U1), ROI calculator placement (U2), home "BOX EBAY" label (U3).`

## Follow-up — Mo in chat ~11:30 PT: "ok fix those things also" → PUSHED `c2eae11`

**U1, fixed: `/best-hobby-boxes-2026` re-read on dated sold data.** Source: the SportsCardsPro hobby-box item pages, read Sep 28. Rules:
- Only single sealed hobby boxes count, filtered by title. Jumbos, cases, breaks and "rip & ship" listings are out, and so are other products SCP files on the same page. The 2026 Topps page mixes in Allen & Ginter presales, NSCC boxes and a Bowman box.
- Mark = 30-day median when n ≥ 3, otherwise the 90-day median.
- Only dates and prices are published (R17).

Figures published:

| Box | Sold median | Sales | Window | Jumbo | vs retail |
|---|---|---|---|---|---|
| 2026 Bowman | $377.50 | 6 | Aug 30–Sep 25 | $659.00 (7 sales, 90d) | |
| 25-26 Topps Chrome Basketball | $951.00 | 6 | Sep 1–26 | | 2.6× MSRP |
| 2026 Topps Series 1 | $199.99 | 3 | Sep 6–26 | $320.00 (4 sales) | |
| 2026 Topps Series 2 | $131.00 | 20 | Sep 3–27 | $244.99 (7 sales) | |
| 25-26 Bowman Basketball | $489.97 | 8 | Aug 31–Sep 26 | | +44% |
| 2025 Prizm Football | $763.00 | 3 | Sep 8–25 | | |

Verdicts now follow the page's own premium-over-retail rule. Topps Chrome Basketball and Series 1 go from **Buy → Watch**, each labelled "was Buy". Prose that reasoned from the June prices is updated, and hero, footer and JSON-LD `dateModified` all read Sep 28. The ranking order is unchanged.

**U2, fixed: ROI calculator.** The calculator section now sits directly under the DEST strip, with the explainer moved below it. The hero gets a "Run your box ↓" jump link, and the desktop eyebrow gap is fixed. The calculator's top is now at 975 px on a phone, down from ~1,450. The DEST block was not touched.

**Gates on the pushed tree:** 0/**75** · 0/3 · 0/0.
- The +1 improvement comes from the new `data-prices-updated` stamp.
- A `no-disclaimer` WARN appeared once the old "eBay sold comps" wording left the page. It was cleared by making the footer read "Box prices are sold comps: …"
- The pushed tree therefore differs from the staged patch by that one footer line.

**Live:** checked ~100 s after the push. Both pages carry the new strings (hero date, $951.00, the footer line, `id="calc"`, the jump link). The key and clone were removed from the Mac.

**Still open, not in scope (flag for the desk / Integrity Watch):**
- The page's player claims are undated: "Flagg auto value $4,000+", "Drake Maye RPAs $164K", "Holliday injury", and Maye Silver "$40–$80".
- Ranking order: at today's prices, Series 2 arguably out-ranks Series 1 and Topps Chrome Basketball.
- U3 (home "BOX EBAY" label) and U4 (home phone cards) are unchanged.
