# Price Engine — nightly snapshots + technical analysis

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
| `GITHUB_REPO` | `owner/repo` (defaults to `jmorelli/shopcardhub` — update if different) |
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
