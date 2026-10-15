# Auction Desk — shipped Sep 8, 2026 (commit 8b514f2)

Mo, Sep 8: "let's move on this now" — the public "auctions ending under comps" page with EPN links. Live at **shopcardhub.com/auctions**; feed at `/api/auctions`.

**What it is.** Every live eBay auction that passes the engine's exact-card filter for the 20 tracked cards (1st Bowman Chrome autos, Sapphire, Pokémon index singles), with the card's nightly mark (ask basis, dated) and the median of watched hammers (sold side, only when ≥2 closes) beside the current bid + shipping, sorted by time to close. Filters: All / Under the mark / Closing in 6h / per card. Every "Bid on eBay" link carries EPN `customid=auctions`. Honest empty and error states; nothing blended.

**Launch read (2pm PT):** 63 verified live auctions, 46 bidding under the mark (many are 0-bid opening prices — expected; the hammers column is the truer read), 4 closing within 6h, affiliate tagging verified, feed 1.4s cold.

**Files.** `api/auctions.js` (one Browse call per card, AUCTION filter, engine verifyListings, s-maxage=900), `tools/build-auctions.mjs` → `auctions.html` (re-run when the watchlist changes), `data/nav.json` (Trackers & Tools → Auction Desk; build-nav rewrote 94 pages), `sitemap.xml` (hourly).

**For the CoS.**
1. Measure: GA4 page_view /auctions and click{kind:'auction'}; EPN by customid=auctions in the Thursday/monthly reads. This is the first page whose entire purpose is a commission click.
2. v2 candidates (Tier 2): weight the default view to bidCount ≥ 1 or closing ≤ 24h; Tuesday Tape "under the mark this week" block; Friday X slot = desk screenshot; per-card ★ Track.
3. Posture reversal logged: the Aug 31 "ignore the deal-finder product" (Cardboard Terminal) is reversed — the Auction Desk is the deal finder, as an EPN page.
4. Repo note: Mo's Mac clone (~/Projects/shopcardhub) is behind origin by this commit; `git pull --rebase` before the next Mac-side push (it also holds unpushed calls.json / make.py work per the Tuesday notes).

**X growth (Mo: "do what you think").** Adding a weekly question post to the rhythm — the @WatchTheBreaks format (one-line hobby question, reply to every answer). Mo approves the first one in chat; after that it rides the Tuesday run's queue with the same veto window as the board tweet.
