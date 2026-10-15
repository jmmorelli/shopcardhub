# Buys vs Board — Sep 8, 2026 (Mo's COMC buys audited against the Bowman Bangers board)

Full audit + ledger + row-level delta live LOCAL in `Card Hub/comc-trader/buys-vs-board-2026-09-08.md`, `comc-trader/buys-vs-board.json`, `comc-inventory-2026-09-08-delta.csv` (cost basis — never to the public repo).

**What happened:** Mo bought 65 items on COMC Sep 2–8 (store credit $287.84 → $188.28). The board-following portion was the BASE 2026 Bowman Chrome Prospects cards (Kim BCP-45 ×20, Florentino BCP-82 ×9, Arquette BCP-40 ×24), not the autos the board prices. The rest was a Klubnik float-corner, two under-floor singles, and Hjerpe parallels.

**Finding:** the base tier is flat — auto ladder $131 / $71 / $59.50 but base eBay ask medians $1.73 / $2.89 / $1.98. Board price levels and BUY/PASS don't transfer to base; only direction (rank-hist, weekly auto move) does. Arquette was bought against the tape (demoted Sep 8). Exit is the COMC ladder (37–76 outside copies at $0.69–0.89), so these are cheap options, not a corner.

**For the Chief of Staff (no spend, Tier 2 unless noted):**
1. Thursday trader adopts `buys-vs-board.json`: stamp each 2026-class buy with board state on the buy date (from `board-history.json`), grade at 6/12 mo vs COMC floor (realizable) and eBay sold (worth). Local only.
2. Add base BCP-40/45/82 (+ Holliday/Fischer/Gonzales base) to `data/watchlist.json` with `boardHide:true` so the nightly engine marks what Mo actually owns — today the site tracks zero cards he holds. Re-run tools/build-card-pages.mjs after.
3. Proposed base-tier buy rule for Mo's sign-off: flat-or-up rank-hist on both ladders + BUY/Hold only; against-the-tape adds get flagged in the Thursday scan.
4. Data note: SportsCardsPro AND PriceCharting Cloudflare-challenged both sandbox and Chrome this session. `shopcardhub.com/api/comps?q=` (eBay ask side, engine-filtered, returns n/median/skew/kurtosis) is the working fallback — label it ask-basis.
5. Twitter (Mo flagged): @SportsCardRadio Sep 4–8 claims an AI agent bids eBay auctions for him ("PSA 6 Nolan Ryan $10 → $15", "$100/day") — unverified, but the *screening* half (auctions ending soon under sold comps) is buildable on the existing engine and is the same product as Cardboard Terminal (posture Aug 31: ignore). Re-decide at Sunday CoS with Mo's new "more ways to make money" framing.
