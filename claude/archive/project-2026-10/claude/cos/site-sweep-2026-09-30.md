# Site Sweep — 2026-09-30 (fired ~10:10 PT; Mac deploy key; PUSHED `5c33fa1`)

**STEP 0.** The Card Hub folder was connected. I made a fresh deploy-key clone on the Mac (`$HOME/sweep`, key in `$HOME/k`, both removed at the end) and a cloud HTTPS clone, both at HEAD `4187ae0`. Read: LANE-RULES (precedence, R1, GO-TIME block, R28, R29), the STATE top plus the last run-log entries, yesterday's sweep, and Night Crew `deploy-2026-09-30`. **Not re-filed:** F1 `.roi-table` (Night Crew shipped it in `a91ea28` this morning, 8/8 stacked live), F2/U-F2 `dest.py` + Vault/P/L tile copy (Night Crew backlog; 44 pages still say "P/L"), and the ccx-2 engine-block hold (Phase 2, Oct 7).

## Bugs: 1 found · 1 fixed · 0 filed

**Sweep:** 109 sitemap URLs at 1366×900 and 390×844 = 218 loads. Analytics hosts were aborted, and every page was scrolled to the bottom before any check.

| Check | Result |
|---|---|
| Status | 218/218 returned 200 |
| Page errors | 0 |
| Console errors | 0 real. The one per page is the aborted gtag request; I confirmed it goes away without the block. |
| Failed same-origin requests | 0 |
| Horizontal overflow | 0 (both scrollWidth and `scrollTo(9999)`) |
| Broken same-origin images | 0 |
| "undefined" / "NaN" / "[object Object]" on the page | 0 |
| Same-origin links | 196 unique, 0 non-200 |
| eBay links | 4,218 unique, all carry `mkevt=1` + `campid=5339155990` |
| Fanatics links | 70 unique, all start with the Impact prefix and carry `subId1` |

**Fixed: B1 — the count-up animation showed wrong prices at rest (MED, pricing display).**
- 79 pages share an inline `countUp()` on `.stat-num` / `.banner-stat-value`. It re-rendered every decimal value with `toFixed(1)`, including the last frame.
- Result: 13 values on 12 pages were wrong once they scrolled into view. Examples: Topps Chrome Basketball Mega $84.99 showed as **$85.0**, Value Blaster $49.99 as $50.0, Hanger $19.99 as $20.0. Also A&G $139.99→$140.0, Bowman Sapphire $599.99→$600.0, F1 $469.99→$470.0, Series 2, Update, Holiday, Inception, Chrome Black FB, and Wemby $5.11M→$5.1M.
- The static gates can't see this; it only shows in a rendered page.
- **Fix:** the last frame writes the original source text back. It's a one-line swap on 79 pages. I checked that it isn't inside any generated marker block, and no generator emits this script.
- Verified live with a rendered source-vs-DOM diff on all 79 pages. The only remaining differences are two client-filled cells (Chrome Black BKB live-ask cells, the track-record count), which are expected.

## UX: 3 pages read, 1 fixed, 3 filed

Rotation: sitemap indices 6–8, `/topps-series-1-2026`, `/topps-chrome-basketball-2026` and `/pitch-black-set-guide`, on phone (3 screens) and desktop. The next run starts at index 9 (`/chaos-rising`). `/` was last read Sep 28; the next home read is ~Oct 5.

**5-second test:**
- **Series 1 and Chrome BKB pass.** They have a clear H1, a one-line pitch, and a buy strip or dock on the first phone screen.
- **Pitch Black passes on "what is this"** but mixes a hero written Aug 31 with a live engine mark. The first number a phone visitor sees is "$220 engine mark · SIGNAL SELL".

**Fixed: U1 — the returns histogram folds behind "Show the numbers".**
- On the 8 engine pages, the chart fold is open by design (Sep 18). Inside it, "Distribution · daily returns" showed "Population moments; excess kurtosis (normal = 0)" plus the histogram, even though the kurtosis *cell* is already folded.
- `js/fold-dense.js` now hides that section under the same `sch-show-numbers` pref. Nothing was deleted, the pref persists, and toggling it brings the section back.
- Verified live at 390 on Pitch Black, Chaos Rising and Holliday: hidden by default, no overflow, 0 errors. Locally I tested show → reload (the pref holds) → hide.

**Filed:**
- **U-F3 (extends yesterday's, MED, integrity → desk / next weekly):** June-dated price stamps sit in the hero or banner on **10 pages**, not the 2 filed yesterday: `ascended-heroes`, `best-baseball-cards-under-50`, `best-basketball-cards-under-50`, `bowman-sapphire-2026`, `chaos-rising`, `prismatic-evolutions-guide`, `shohei-ohtani-cards`, `topps-chrome-basketball-2026`, `topps-series-1-2026`, `topps-series-2-2026`.
  - Examples: "PRICES: EBAY/MARKET, JUNE 2026"; "approximate eBay/market level as of June 2026".
  - These are three months stale on an eBay basis (R20).
  - **Proposal:** a dated SCP re-read, like football Sep 19. Prices are out of this lane's scope.
- **U-F4 (LOW-MED, copy → desk):** the `/pitch-black-set-guide` hero is stamped "Updated Aug 31, 2026" and quotes "~$225 … ~$996 → ~$183" beside the live $220 engine mark.
  - The PB26 callout says "re-marked weekly from a 100.00 base". Since this morning's rebase, 100 = the release month (Jul 2026).
  - **Proposal:** "…re-marked weekly; 100 = July 2026, the release month", and re-date or trim the hero prose to the index level. This is a price-adjacent re-read, so it goes to the desk.
- **U-F5 (LOW, copy → Night Crew):** Chrome BKB banner label "Hobby Box (2° market)". "2°" is shorthand a casual collector won't parse. **Proposal:** "Hobby Box (resale)", which is the same length. It's a hand-authored banner, not a generated block, but I left it because it sits beside a price cell. The phone "★ Track a card" floating button covers the last line of body text at the bottom-right. It's standard FAB behaviour, so noted only.

## Commit / gates
- **`5c33fa1`** (80 files: 79 pages, one line each, plus `js/fold-dense.js`). Trailers: `Task-key: site-sweep`, `Authority: Mo 2026-09-27`. Fetched and rebased onto `4187ae0` (no move), fast-forward push, no force. Cloud and Mac diffs had the same patch-id `3deb4404…`.
- Gates on the pushed tree (Mac): **audit-prices FAIL 0 · WARN 75 · audit-site FAIL 0 · WARN 3 (133 pages) · audit-terminal --feed data/feed FAIL 0 · WARN 0.** This equals the baseline, with no WARN delta.

## Live checks (~90 s after push)
- curl found the fix comment on `/topps-chrome-basketball-2026`, `/topps-allen-ginter-2026` and `/victor-wembanyama-rookie-cards`, and in `/js/fold-dense.js`.
- Rendered diff on all 79 count-up pages: 0 wrong prices.
- Dist fold was hidden by default at 390 on 3 engine pages, with scrollWidth 390 and 0 page errors.

## Stumbles
- The first sweep run crashed on `urlparse().host` (Python has `.hostname`), and a sed fix then produced `hostnamename`. Both were caught before any results were used; I re-ran all 218 loads clean.
- The first Mac `git pull` failed because each `device_bash` is a fresh shell and `GIT_SSH_COMMAND` wasn't set. I re-exported it per call, and nothing was half-applied.
- **STATE run log not appended.** STATE.md's own header says "No other lane writes either copy," and it outranks this prompt. A docs-only commit would also break the GO-TIME "docs ride along" rule. Both-or-neither → neither. The one-liner for the desk:
  `Sep 30 10:10 PT Site Sweep (Mac key): 218 loads, 0 errors/overflow/404/untagged · fixed B1 count-up showed wrong prices at rest on 12 pages ($84.99→$85.0), U1 returns histogram behind Show the numbers · pushed 5c33fa1 · filed U-F3 June-dated prices now 10 pages, U-F4 Pitch Black hero Aug 31 + rebase wording, U-F5 "2° market".`
- **Prompt vs STATE conflict for the Oct 1 roster review:** the prompt tells this lane to append to STATE, and STATE says only the CoS writes it. One of the two should change.
