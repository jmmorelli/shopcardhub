# The Terminal — vision and feasibility (CoS, Sep 11 2026)

Mo's ask (chat, Sep 11): the site is drifting toward "AI slop", worst on the player pages. He wants a mockup — not live — of the site laid out like a Seeking Alpha dashboard: left rail with portfolios (the way he watches his kids' and wife's accounts), a Home that reads like a market page, and portfolios that merge that view with what the Vault already does. Keep the current colors. He asked what the CoS thinks on vision and feasibility.

Mockup: Cowork artifact "ShopCardHub Terminal" (Sep 11), also saved to `Card Hub/mockups/terminal-mockup-2026-09-11.html`. Four views — Home, Portfolio, Card, Screen — all fed by the Sep 11 nightly feed (prices-latest, market-latest, prices-history). Portfolio holdings are sample rows.

## What the slop actually is (diagnosis, player pages)

Rendered the live Ethan Holliday page: 13,175 px tall at 1440 wide. The tells, in order of damage:

1. The essay is the page and the data is a guest. Two engine blocks sit under a 300-px display headline, a June-2026 "under re-verification" warning, and two CTA cards — the number a visitor came for is a screen and a half down.
2. Repetition of the same shape. Every section (Why #1, Injury window, Every card ranked, PSA 10 math, Parallel hierarchy, When to buy) is a giant Barlow Condensed H2, a paragraph, then a callout card with 4 stat cells and a coloured "VERDICT" strip. Six times. That rhythm is what reads as generated.
3. Empty states shipped as content — "loading nightly series", "no auction close recorded", "live listings are unavailable right now" — each in its own box.
4. Stale stamps beside live numbers (June figures, Sep 7 re-checks, Sep 11 marks) with equal visual weight.
5. Whitespace as filler: ~40% of the page height is padding between sections.

None of that is a colour or font problem. The tokens are good; the composition is the problem. The mockup keeps every token and changes the composition.

## The vision, in one line

The site becomes a terminal for the cards we track, with the guides folded underneath the numbers — not a blog with a price widget.

- **Home** = markets page. Set indices and the Bangers board composite on the left (click a row, the chart switches), "from the engine last night" on the right (the nightly run written as a news feed — feed landed, gates cleared, BUY/SELL published, index events), an In-Focus strip for the standing rhythms (Tuesday Tape, Auction Desk, activation watch, release dates), then Board movers and the Hammer tape as the two trending columns.
- **Rail** = navigation plus the reader's own lists. Portfolios with a 5-day change pill (the SA pattern Mo uses for the family accounts), a Hunting list with target counts, and saved screens that are just filters over the tracked universe (autos under $100, supply drying up, |z| beyond 2, fat tails).
- **Portfolio** = the Vault, one list at a time. Header with value and change, tabs (Summary / Signals / Holdings & P/L / Hammers / Supply / Distribution), four tiles that are about *this* list (published signals, weighted supply change, hammer coverage, top weight), the dense table, then the SA-style warning banners generated from the numbers (published SELL at ≥0.8 conf, a gated raw signal, kurtosis > 10 "one jump day carries the whole move", a hunting target crossed). A "this portfolio on the tape" panel in plain words, templated from the same numbers — no model in the loop, so it can't slop.
- **Card** = mark first. Image, name, chips, price and Track/Add-to-portfolio on one row; a nine-cell stat band (signal, 30D ROC, z, σ/day, skew, kurtosis, supply, ask Q1–Q3, hammer median); chart with the hammer median as a dashed reference; distribution histogram of daily returns with a two-line read; live-listing quartiles and watched closes; and then the rookie guide as a fold of `<details>` rows with the date stamp on each. The 13,000-px page becomes ~1,200 px at rest with the same words available.
- **Screen** = the board and the saved screens share one table, with σ/skew/kurt columns — this is the "next level after standard deviation" surfaced as a first-class column, not buried in a methodology tab.

## Feasibility — most of it already exists

| Piece | What exists | What is new | Size |
|---|---|---|---|
| Card page restructure | `build-engine-blocks.mjs` renders the block into host pages at build; prose is static HTML | New host-page template: stat band + chart on top, essay sections wrapped in `<details>` (text stays in the DOM, so indexing is unchanged); delete the per-section verdict cards | 1 weekly run for the template + the 7 engine hosts; 1 more to sweep the other player pages |
| Portfolios | Vault store `sch_vault_v1` already has `status watch/own`, `cost`, `qty`, `buyDate`, `feedKey` (nightly prices flow in); `vault-track.js` owns the write contract; COMC CSV import exists | Schema v2: `lists[{id,name}]`, `card.listId`; migrate v1 → one list "My cards" + "Hunting"; per-list header/tiles/warnings; rail on the Vault page | 1–2 runs incl. migration test + audit-site gate; still device-local, no account |
| Saved screens | `set-checklist.js` / board tables already filter client-side | A filter object per screen; Track-all is a loop over existing ★ Track | half a run, rides with portfolios |
| Home as terminal | `indices.json`, `prices-latest.json` and `prices-history.json` are already fetched client-side; indices hub exists | New home template; "from the engine last night" is a nightly-written `data/tape.json` (the engine already knows gates cleared / signals published); Board composite = equal-weight normalised autos | 1 run |
| Rail across data pages | Nav is single-sourced (`data/nav.json` → `build-nav.js`, NAV:START slice on 94 pages) | Two shells: **Terminal** (rail) on home, vault, indices, auctions, board, card pages; **Reader** (current header) on guides and release pages. Rail built from the same nav.json | 1 run for the build, 1 QA pass on phone |
| σ / skew / kurtosis | Feed already has `retSkew` / `retKurtosis` fields — currently null | Compute in the nightly (`tools/price-engine`) over the 30-day mark series; mockup computed them client-side from history to prove the numbers (Kim 37.0 kurtosis, Fischer 2.6 skew are real) | small, engine-side |
| Hammer tape on Home | `market-latest.json` note says "not published on the site; not yet a mark" | **Decision:** publishing closes as a tape (dated, attributed, labelled "watched close", never a mark) is consistent with the pricing-integrity rules; needs Mo's yes | — |

What it is not: no accounts, no server, no database. Everything is static HTML + the existing nightly JSON + localStorage, so it ships through the same gates (`audit-prices`, `audit-site`, `first-bowman.mjs`) and the same Vercel deploy. Cross-device sync of portfolios would need accounts — out of scope until retention data says people want it.

## Where the CoS pushes back

- **Don't import SA's AI prompts.** The "Ask Seeking Alpha AI" bar and "Summarize this portfolio" buttons are the slop signal Mo is reacting to. The mockup's tape panel is a template over numbers. Keep it that way.
- **Don't add a triple rating.** SA shows Quant / SA Analyst / Wall Street. We have one signal, one confidence, one gate reason. Three columns of opinion would be theatre; the honest version is signal + conf + "raw BUY, gated: 4 asks".
- **SEO first (Problem #1 in STATE).** The pages that rank are the guides. The Terminal shell goes on the data surfaces; the guides keep their article shell and gain the stat band + fold. No page becomes a JS-only shell — the numbers are rendered at build, as today.
- **Don't do the rail site-wide in one push.** Two shells, data pages first. The guide pages get the fold and the stat band, which fixes the slop, without changing their nav.

## Recommended order (each step is its own push, each reversible)

1. **Card-page composition fix** (the actual complaint): stat band + chart on top, essays folded, verdict cards removed, empty states collapsed to one line. Ships on the 7 engine hosts first.
2. **Engine computes σ/skew/kurtosis** nightly; band and screens read them.
3. **Vault → Portfolios** (schema v2 + rail on the Vault page + saved screens).
4. **Home as the markets page** + `data/tape.json` from the nightly.
5. **Terminal shell** (rail) on the remaining data pages.
6. Hammer tape on Home — after Mo's decision on publishing watched closes.

Nothing above changes pricing math, signals, the 1st Bowman rule, or the Card Dungeon.

## Needs Mo

- Go / no-go on the order above (or a different order).
- Publish watched auction closes on the site as a labelled tape? (Currently observation-only by the Sep 3 rule.)
- Portfolios stay device-local (no accounts) — confirm.
- Name: the mockup says "Terminal"; the Vault brand can stay ("Portfolios live in the Vault").
