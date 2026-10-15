# Strategic review — where ShopCardHub actually has an edge (2026-09-25)

Written by the CoS at Mo's request ("take a step back and analyze the site and project as it relates to others in our space and determine where we actually have an avenue of clout, or staying power"). Inputs: live site read (/, /indices, /watchlist, /destined-rivals-index, /bowman-bangers), EPN read Sep 23, GA4 nightly, the ideas ledger (39 rows), and a fresh survey of 25 competitor products (sources at the end). Grok's cross-site audit follows this; a brief for it is in §7. **§8 is the same-day execution record.**

## 1. The numbers that frame everything

- Traffic: ~203 clean sessions / 7 d (~30 a day), 45% of raw sessions are bots. Google has indexed 3 of 99 pages; Bing is the search channel (77 of 134 organic).
- Retention: returning share ~4–7%. Vault `track_card_from_page` 1 event / 7 d. Five Vault users in the last 28-day read that had one.
- Money: $106.59 trailing 30 d on 204 clicks; $5.66 last 7 d. 82% of the 30 d came from two days. Run cost ≈ $300/mo. M0 is $300.
- Ideas desk frame: $/click on ~44 clicks a week. Its two Sep 25 ideas (#38 TCGplayer, #39 Amazon) are estimated at +$0–8 and +$2–10 a month. Correct as filed; they cannot reach M0 from here.

One consequence dominates: **with 30 visitors a day there is nobody to retain.** Every retention feature (Vault, portfolios, rail, saved screens, signal alerts) is being judged on a population too small to show anything. The Vault "not working" is partly UX and mostly emptiness.

## 2. The field, compressed

Portfolio / collection tracking is a solved, crowded category and getting more so: CollX (4.5M users, profitable), Collectr (10M+ claimed), Ludex (4M+), Card Ladder (Pro-only tracker, $20/mo), Market Movers ($10–50/mo), PriceCharting/SportsCardsPro (free with account), PokeDATA, Card Hedge, TCGplayer's tracker — and **PSA's Sep 23 2026 update: raw cards in the PSA Collection, portfolio value + performance chart, gainers/losers, shareable sell folders, eBay consignment, free.** Every one of them has scanning, sync, or a sell path. Ours has none of the three. Nobody can beat PSA at "track what I own and sell it," and we should stop trying to look like we are.

Indices: Card Ladder publishes 40 (CL50, sport, Pokémon, price-tier, Bowman 100 — a cross-year PSA-10 auto list) with no published weights or constituents. PriceCharting/SportsCardsPro put a per-set "index" on every set page, but it is the **average ungraded base-card price**, which by construction excludes the chase tier. PokéViews (Pokémon only) publishes a per-set "Set Performance" line = equal-weighted dollar average of the top-10 raw cards, PriceCharting data, monthly rebalance, no base 100, no constituent log. TCGscreener and CardTrack publish market-wide base-100 Pokémon indices. **No product found publishes a named, base-100, price-weighted chase-basket index per set with published constituents, weights and a re-mark log. Nothing of the kind exists for Bowman prospect classes at all.**

Affiliate-only sites with real traffic exist (Cardboard Connection on EPN + ads, Cardbase, CardTrack, TCGscreener on EPN/TCGplayer links). The model is proven; our traffic is the missing input.

## 3. Where the edge is

One thing, and it is narrow: **the set index.** A number for the set a collector is chasing — base 100, chase tier only, sold data, every constituent visible, re-marked on a schedule, with a divisor log going back to Aug 24. It is the only asset on the site that compounds: every week of history makes the series more useful and harder to copy. PokéViews could rebase to 100 in a week, but they have no Bowman, no sports, no constituent transparency, and no weekly log. On the sports side there is no one.

In Mo's own framing: the index level is the candle for the set. It is the one number a chaser can check on Tuesday and tweet. That is where clout comes from — being the number people quote — not from being a tool people log into.

Secondary edges, real but smaller: methodology honesty (published corrections, dated stamps — nobody else does this and it is what makes the index citable); the Bowman board with opinions (Card Ladder's Bowman list has none, Market Movers is paywalled); the no-account, no-cap watchlist, which is a genuine differentiator against every login-walled tracker but only as the ★ on an index row, not as a portfolio product.

## 4. Where we are not different and it is costing us

- **The Vault as a portfolio tracker.** Commodity, and now behind PSA for free. Manual entry, paste-a-list, COMC CSV, 12 toolbar controls, candles, demo mode, allocation/style/risk — this is a thinkorswim built for one user (Mo) and it reads that way to a stranger ("not another card vault"). Mo's Sep 4 gut ("high-end buyers want the indices, not the Vault") was right and the Sep 24 "Vault as lifeblood" direction reverses it. Seeking Alpha's lifeblood is its content and ratings; portfolios were the retention hook added on top of millions of readers. We copied the hook without the readers.
- **The Terminal home page.** 12–14 panels, ~100 links and numbers above the footer, z-score / σ/day / skew / kurt / Ask Q1–Q3 on the front door. Dense is fine for Mo; it is the wrong first five seconds for a collector arriving from Bing on a phone. The differentiator (the indices) is one row of nine tickers among everything else.
- **Page count.** 99 pages, 3 indexed. The long tail of player/SEO pages is what Google is not indexing, and it dilutes the one thing that is different.
- **Stats on public surfaces.** Skew and kurtosis belong in the factsheet expander where Mo reads them, not on home.

## 5. What to do (proposed build order; nothing ships without Mo's yes on the direction)

1. **Home = the index board, nothing else above the fold.** Nine tickers: level, 1w, 1m, since inception, sparkline, "re-marked Mon Sep 21". One sentence under the H1: *Set indices for the cards collectors actually chase. Base 100. Sold data. Every card shown.* Tape, board movers, engine table, screens, auctions move below or to their own pages. Target: a phone user knows what the site is for before scrolling.
2. **Vault → Watchlist.** Freeze Vault development. Cut the public surface to one job: ★ a card on an index or board row → it appears on your watchlist with the index's mark and a buy link. Manual add / paste / COMC import / demo / candles / allocation move behind an "Advanced" toggle (Mo's own use), off the default view. The word "portfolio" comes off the marketing; PSA owns it now. The no-account/on-device line stays — it is the honest differentiator.
3. **Index pages: chart above the fold.** The DR25 page has no history chart in the first viewport; the level and the line are the product. Top-10 visible, 11+ collapsed (already the spec). Methodology stays, in the expander.
4. **Consolidate pages.** Fold or 301 the thin player/SEO pages that Google will never index into the set/index pages they belong to. Fewer, denser, indexable. This is the single biggest lever on the Google problem and on "clunky."
5. **Distribution of the index, weekly, as the only recurring public act.** Monday close → one image (levels + 1w) → X (vendor, when usage returns; Mo by hand until then), one Reddit submission from Mo's account when a set moves (r/PokemonTCG, r/pkmntcg, r/baseballcards), and a standing offer of the JSON feed (`/data/indices.json`, ledger #8) to the Pokémon index sites and newsletters so they cite us. Being cited is the traffic lever we have not pulled; clicks-per-page tuning is not.
6. **Money follows the index rows.** #36's per-row cheapest-verified-listing links are the right shape. #38 (TCGplayer on Pokémon rows) — yes, worth the 10-minute Impact application: the Pokémon singles buyer converts on TCGplayer, not eBay's thin mid-tier. #39 (Amazon retail beside the 30th page's product links) — yes, free, and it keeps the Associates account alive for December. Both are pennies today and correctly labelled as such; approve them and stop expecting the $/click frame to reach M0. M0 comes from 3–5× the visitors on the same pages.
7. **Stop building new features until the visitor count moves.** Scouting grades, sold catalog, auction desk, engine signals — all fine, all already built; none of them adds a visitor. Phase 2 compliance (marks on sold data, Sep 30 / Oct 7) stays #1 because it is what makes the index citable.

## 6. Answer to the direct questions

- *Is there an avenue of clout or staying power?* Yes, one: the per-set chase index, sports and Pokémon, with the history and the honesty. Narrow, real, and unserved.
- *Can we compete with PSA's vault/portfolio?* No, and we should not try. Different job: PSA tracks what you own; we tell you what the set is doing. Complementary. Say so on the site.
- *Why do people bounce?* Too much on the first screen, the differentiator is buried, and most of the 99 pages are not the differentiator. Also: 30 visitors a day means the bounce rate is being measured on almost nobody.
- *Is the disconnect between "what I'm thinking and what's on the site" real?* Yes. Mo's picture is "the index site"; the site is a terminal with an index tab. Closing that gap is mostly subtraction.

## 7. Brief for Grok's cross-site audit (paste-ready)

> Audit shopcardhub.com against these, as a first-time Pokémon or Bowman collector on a phone: pokeviews.com (Set Performance page), cardladder.com/indexes, pricecharting.com/console/pokemon-prismatic-evolutions (its "PriceCharting Index"), sportscardspro.com (2025 Bowman Chrome Prospects set page), psacard.com (the Sep 23 2026 PSA Collection update), getcollectr.com, collx.app. Note: shopcardhub.com's home page and watchlist changed on Sep 25 2026 — judge the current site, not a cached one. For each: (1) in five seconds, what is the site for and what is different about it; (2) count the distinct panels and clickable numbers above the fold on the home page; (3) is there a per-SET index, and if so is it base-100, chase-tier, with constituents shown; (4) would you quote one of its numbers in a tweet, and which; (5) what is the one thing you would delete from shopcardhub.com's home page and watchlist, and the one thing you would add. Do not grade the watchlist as a portfolio tracker against PSA/CollX — grade it as a watchlist that hangs off the indices. Report as a table, then five sentences.

## 8. Execution record — same day (Mo: "do and execute all of those things immediately, I fully approve")

Pushed to `main` from the Mac deploy-key clone as `7b1dbe4` · `8ae7a74` · `854f700`; live-verified (md5 of `/` matches the repo; `/blog` and `/set-index-preview` answer 308 to their targets; the board renders 8 rows and the DR25 chart draws on production; 0 page errors at 390 and 1280 px). Gates on every tree: audit-prices 0/76 · audit-site 0/3 · audit-terminal 0/0. IndexNow pinged for 13 URLs.

| §5 item | Done today | Not done / next |
|---|---|---|
| 1 Home = index board | **Live.** New `HOME:indexboard` block above the fold (level · 1W · 1M · since launch · trend · re-marked), new H1/deck/title/meta; tape, chart, releases, Bowman movers, auctions below; engine screens folded into a closed panel that rail/chip links open. Phone: 4 columns, no horizontal scroll. | — |
| 2 Vault → Watchlist | **Live.** Simple view by default; an Advanced view toggle keeps everything (portfolios, imports, analytics, columns, cards view). Empty state + onboarding point at the indices. "Watchlist" in nav CTA, nav, rail, ★ buttons; "portfolio" off the public copy. | Zero-knowledge sync (ledger #13) stays parked — it is a feature, and R25 says no new features until visitors move. |
| 3 Chart above the fold | **Live** on all 8 index pages (`js/index-chart.js`, client-side from `indices.json`, one mark → one line, never invented history). Bonus fix: the nav CTA had been invisible on the 6 Pokémon index pages (undefined `--accent`). | The newsletter bar + red banner still eat the first phone screen on index pages — a page-polish item, not a feature. |
| 4 Consolidate | **Batch 1 live:** `/blog` (stale duplicate of `/research`) → 301; `/set-index-preview` → 301 `/indices`; both out of nav + sitemap. | **Batch 2 = work order for the Sep 30 weekly** with GA4 per-page sessions (rule in STATE's NOW block: <5 sessions/28d AND 0 EPN actions AND ≤2 inlinks). Cloud lanes cannot read GA4; the desk can. |
| 5 Distribution | Image generator confirmed (`make.py levels`, Pokémon tickers only under R20 until Phase 2). Tweet copy, a Reddit submission and a feed-offer note are drafted in NEEDS-MO. | **Needs Mo's hands** while the vendor is out of X usage: post the close, one Reddit submission, optional DM to the three index sites. |
| 6 Money | **#39 live** (9 Amazon retail anchors on the 30th page, Associates line on the page, eBay stays primary). **#38 adopted**, build ready. | **#38 needs Mo: the Impact/TCGplayer application (~10 min).** |
| 7 Stop building | **R25 written into STATE** (into LANE-RULES at the Oct 1 roster review): no new feature until the clean visitor count moves; Phase 2 stays build-order #1. | — |

**What to watch:** Monday Sep 28's re-mark should update the home board and every index chart with zero page edits — check `/destined-rivals-index` after the Monday lane. The Sep 30 EPN read is the first with the new front door; one week says nothing.

## Sources (competitor facts)

Card Ladder indexes/pricing: https://www.cardladder.com/indexes · https://www.cardladder.com/indexes/bowman · https://www.cardladder.com/pricing · https://cardladder.zendesk.com/hc/en-us/articles/11943014102167-What-are-Indexes
PSA Collection update (Sep 23 2026): https://www.psacard.com/articles/articleview/15761/raw-cards-psa-app-update
PriceCharting / SportsCardsPro set index definition: https://www.pricecharting.com/page/price-index-details · https://www.sportscardspro.com/page/price-index-details
PokéViews set performance: https://www.pokeviews.com/set_performance · https://www.pokeviews.com/about
Market-wide Pokémon base-100 indices: https://tcgscreener.com/pokemon-market-cap-index · https://cardtrack.com/ct100
Market Movers pricing: https://www.marketmoversapp.com/
CollX scale: https://technical.ly/entrepreneurship/collx-trading-card-marketplace-profitable/ · Collectr: https://getcollectr.com/ · Ludex: https://www.ludex.com/
Affiliate-only comps: https://www.cardboardconnection.com/site/advertising-info · https://getcardbase.com/
Internal: `claude/cos/epn-read-2026-09-23.md`, `claude/cos/STATE.md` (Sep 23 weekly + Sep 25 NOW block), `claude/ideas/LEDGER.md`, `claude/ideas/2026-09-25.md`.
