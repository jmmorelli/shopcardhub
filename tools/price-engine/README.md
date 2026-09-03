# Price Engine — nightly snapshots + technical analysis

**ACTIVE SETUP (zero-secret path, since Jul 31 2026):** the nightly snapshot
runs as a **GitHub Action** (`.github/workflows/price-snapshot.yml`) and prices
each watchlist card off the site's own public **`/api/comps`** endpoint (eBay
Browse API, already deployed on Vercel with working keys). No paid subs, no
GitHub secrets, no Vercel changes. Mark = trimmed median of the lowest
fixed-price asks (same methodology every night — consistency is what the chart
math needs). Feeds are committed to the `price-data` branch:

- `data/prices-history.json` — full per-card series (the chart)
- `data/prices-latest.json` — compact, signal-first feed the site reads

One-time setup: none. Kick a first run at repo → Actions → price-snapshot →
Run workflow, or wait for the nightly 08:15 UTC run. Until the first run lands,
the signal board and homepage box show their built-in Jul 31 2026 seed prices.

Signals stay `HOLD` ("BUILDING") until a card has ≥ 20 nightly points
(`MIN_HISTORY` in `ta.js`) — honest, no fake precision on a thin series.

---

## Legacy paid path (kept, not active)

Pulls current card values from PriceCharting / SportsCardsPro every night, builds
its own price history (the paid API gives current values only — **no history**),
and computes a transparent **BUY / SELL / HOLD** signal per card from the chart
alone. Output feeds the on-site watchlist.

```
api/_lib/ta.js            pure TA math (MA, ROC, z-score, skew, kurtosis, signal)
api/_lib/pricecharting.js fetch client for both sister sites
api/_lib/store.js         persists JSON to a dedicated `price-data` git branch
api/cron-snapshot.js      the nightly job (Vercel Cron)
data/watchlist.json       which cards to track  <-- you edit this
tools/price-engine/       selftest.mjs (no tokens) + resolve.mjs (id finder)
```

## How it works

1. Vercel Cron hits `/api/cron-snapshot` nightly (08:00 UTC — see `vercel.json`).
2. It reads `data/watchlist.json` from the live site, pulls each card's current
   value (throttled to the 1 req/sec API limit), and appends today's point.
3. It recomputes TA and writes two files to the **`price-data` branch** (kept off
   `main` so it never disturbs your manual push-to-deploy flow):
   - `data/prices-history.json` — full per-card series (the chart)
   - `data/prices-latest.json` — compact, signal-first feed for the front-end

The site reads the latest feed from the data branch's raw URL — no Vercel
redeploy involved:

```
https://raw.githubusercontent.com/<owner>/<repo>/price-data/data/prices-latest.json
```

(For CDN caching instead, use jsDelivr:
`https://cdn.jsdelivr.net/gh/<owner>/<repo>@price-data/data/prices-latest.json`.)

## One-time setup (after you buy the two Legendary subs)

Set these as **Vercel env vars** (Production). Never put them in page JavaScript.

| Env var | What it is |
|---|---|
| `PRICECHARTING_TOKEN` | 40-char API token from your PriceCharting Legendary sub (Pokémon/TCG) |
| `SPORTSCARDSPRO_TOKEN` | 40-char API token from your SportsCardsPro Legendary sub (sports) |
| `GITHUB_TOKEN` | fine-grained PAT with **Contents: read+write** on the repo |
| `GITHUB_REPO` | `owner/repo` (defaults to `jmmorelli/shopcardhub` — update if different) |
| `DATA_BRANCH` | optional; defaults to `price-data` |
| `CRON_SECRET` | Vercel sets/uses this to authenticate the cron call |
| `PRICE_PROXY_KEY` | a long random secret for manually triggering a run |
| `SITE_URL` | optional; defaults to `https://shopcardhub.com` |

Each price token is on the source site's **Subscriptions page → "API/Download"**.

## Adding cards to the watchlist

Find a product id (hover the card title on its pricecharting.com /
sportscardspro.com item page), or search by name:

```
PRICECHARTING_TOKEN=xxxx node tools/price-engine/resolve.mjs pricecharting "charizard ex prismatic"
```

Then add an entry to `data/watchlist.json`:

```json
{ "id": "12345", "source": "pricecharting", "label": "Charizard ex SIR — Prismatic", "condition": "loose", "slug": "prismatic-evolutions-guide" }
```

`condition` selects which price we track: `loose` (ungraded), `graded` (~PSA 9),
`psa10`, `new` (8/8.5), `cib` (7/7.5). Commit + push `watchlist.json` to `main`
the normal way; the next nightly run picks it up.

## Test the math now (no tokens needed)

```
node tools/price-engine/selftest.mjs
```

## Manually trigger a run (after setup)

```
curl -H "x-proxy-key: $PRICE_PROXY_KEY" https://shopcardhub.com/api/cron-snapshot
```

## Notes & limits

- **History takes time.** Signals stay `HOLD` until a card has ≥ 20 daily points
  (`MIN_HISTORY` in `ta.js`). That's honest — no fake precision on a thin series.
  The sooner the cron runs nightly, the sooner signals mean something.
- **Cron duration.** Vercel Hobby caps a function at 60s; at ~1.1s/card that's
  ~50 cards/run. For more, upgrade to Pro (raise `maxDuration`) or split the
  watchlist across multiple cron paths.
- **Signal logic** lives entirely in `ta.js#analyze` and is easy to tune — trend
  stack (SMA7 vs SMA30), 30-day momentum, EMA12/26 cross, and a z-score
  over/under-extension guard, with skew/kurtosis as a fat-tail regime flag and a
  thin-volume confidence penalty. All chart-derived; no fundamentals.

---

## Pricing integrity — the mark must be THIS card (Sep 3 2026)

Mo's standing rule: every number the site quotes has to be the card it names.
Before this, wrong cards were entering the mark — hand-signed BASE cards (`#BCP-45`,
COA/IP) priced as pack autos, Mega Box autos (`BMA-`), redemption cards, unnumbered
colour parallels ("Green Grass", "True Blue", "Black Gold Ink"), even fan-art
placeholders in a Pokémon floor. The numbers looked fine; they were about the
wrong cards.

**One filter, two callers.** `verifyListings(listings, card, label)` in
`snapshot-free.mjs` is the single place a listing is accepted or rejected, and it
returns *why* for each rejection. The nightly engine and the audit tool both call
it, so what the audit shows is exactly what the engine used.

A listing must, for sports cards:

- contain the required token(s) (`titleMust`, else the player's last name)
- contain `auto` (for `cardType: chrome-auto`)
- contain the **card code from the query** (`CPA-EH`, `BDC-1`, …) — normalised for
  `#`, spaces and unicode dashes — and contain **no other** Bowman-family code
  (`BCP-`, `BMA-`, `BCA-`, …). This is the single most effective check: the code is
  what separates the pack auto from a signed base card of the same player.
- contain the **year** from the query
- survive `TITLE_BAD` (slabs, refractors/parallels, serials, sapphire, redemption,
  TAG-graded, lots, reprints) and then, after team names are stripped so "Red Sox"
  is not a red parallel, `TITLE_BAD_2` (colour words, variations, Hangul, HTA,
  Mega Box, aftermarket signature markers: COA/JSA/IP/hand-signed)
- be `FIXED_PRICE`, land ≥ $3, and not be the third-plus identical ask from the
  same seller (one seller relisting is supply, not price discovery)

TCG singles use `TITLE_BAD_TCG` instead (no code/year requirement — card numbers
like `161/131` are the identity, and "mega"/"prism" are set names, not parallels).

**Sample-size honesty.** `trimFor(n)` drops 2/1/0 junk-floor asks depending on how
many verified asks exist, so a thin card is not marked off two listings. Below
`MIN_COMPS` (4) there is no mark at all.

**Signal gating.** `analyze()` still computes the chart verdict, but the feed parks
it at `HOLD` when the sample cannot support a call:

| gate | condition |
|---|---|
| thin | latest point has `< THIN_N` (8) verified asks |
| dispersion | `dispersionFlag()` tripped tonight (q3/q1 ≥ 4x, or CV ≥ 1.5) |
| stale | no fresh mark for `STALE_DAYS` (4) |

Nothing is hidden: the feed carries `signalRaw` (the ungated chart verdict) and
`gated` (the reasons, also prepended to `reasons[]`). Pages read `signal`.

### Audit it

```
node tools/price-engine/audit-comps.mjs              # all cards, full listing detail
node tools/price-engine/audit-comps.mjs --quiet      # flags and leaks only
node tools/price-engine/audit-comps.mjs --only ethan-holliday,andrew-fischer
node tools/price-engine/audit-comps.mjs --json       # machine-readable
```

Read-only — it never writes to the `price-data` branch. It prints, per card, the
verified set with landed prices, the rejections grouped by reason, the mark
window, and flags: suspected leaks (a parallel/graded/aftermarket word survived),
high-ask outliers above the window, thin samples, dispersion, and a missing card
code in the query. **Exit 1** when any card has a leak or a dispersion flag, so a
scheduled run notices without a human reading the output.

The Pricing Integrity agent runs it daily (CoS charter §2). A leak is fixed the
same day — blocklist, card code, or query wording — but the query must still name
the *same* card; adding or removing a tracked card, or changing what a mark
*means*, stays Mo's call.

### The gap this does not close

Marks are **ask floors** — the eBay Browse API only returns active listings.
`/track-record` grades against **sold** prices read by hand from SportsCardsPro.
Same card, two numbers, and the ask floor sits above the sold read. The filter
makes the ask number honest; it cannot make it a sold number. eBay Marketplace
Insights (sold data) was applied for and **denied**, Sep 3 2026. Open options are
tracked in `claude/cos/NEEDS-MO.md`.
