# data/classes — Bowman 1st-auto class universes (the Class Ladder, /bowman-classes)

One file per class: `BOWyy-universe.json` (BOW09 … BOW25). The **Bowman KB agent writes these files**; the engine
(`tools/build-sector-index.mjs --ticker BOWyy --mark`) reads them and never derives a 1st itself. BOW26 is not a file here —
it is a live ticker of its own and the ladder only references it.

```json
{
  "ticker": "BOW25",
  "year": 2025,
  "products": [
    { "name": "2025 Bowman", "release": "2025-05-07",
      "console": "baseball-cards-2025-bowman-chrome-prospect-autograph", "codePrefix": "CPA" }
  ],
  "universeComplete": false,
  "rows": [
    { "player": "…", "product": "2025 Bowman Draft", "code": "CPA-XX", "firstAuto": true,
      "pcPath": "baseball-cards-…/slug-or-null", "note": "…" }
  ],
  "coverage": { "rows": 0, "withPcPath": 0, "sources": ["…"], "date": "YYYY-MM-DD" }
}
```

Rules the engine holds you to:

- **One row per player per class.** A player's 1st Bowman Chrome Auto exists once; if the file lists him twice the engine
  keeps the first row and logs the duplicate.
- **Only `firstAuto: true` rows count.** `false`/`null` rows are kept in the file for the record but are not the class.
- **`product` must name one of `products[].name`** — that is how a row finds its SportsCardsPro console when `pcPath` is null.
- **`console`** is the exact SportsCardsPro console slug for that product's Chrome Prospect Autograph insert (the 2026 pattern
  is `baseball-cards-2026-bowman-chrome-prospect-autograph`; older years differ — `…-prospect-autographs`,
  `…-draft-chrome-prospect-autographs` — so verify each one on the site, never pattern it).
- **`pcPath`** is the item path under `pricecharting.com/game/` (what the console lists). Null is allowed: the engine
  enumerates the console and matches on the accent-folded player name (then prefers the row whose `#code` matches, bracketless
  first). A resolved path sticks to the row (keyed player + product + code) in `data/indices.json` on later marks. A row the
  engine cannot resolve is `noTape` with `unresolved: true` and weighs 0.
- **The key is player + product + code.** Codes repeat across products and inside one product (KB G28); the engine never
  keys by code alone.
- **`universeComplete: true` is the KB agent's statement** that every 1st Bowman Chrome Auto of that class is in the file.
  It is half of the publish gate (below). Do not set it on a draft.

What the engine does with a file (`--mark`):

- Reads every row's ungraded dated-sales table on PriceCharting/SportsCardsPro. Mark = median of the clean single-card
  sales in the trailing **90 days** (`basis "sold (PriceCharting ungraded, 90d median)"`, `thin` when under 4). No sale in
  90 days → the **last clean sale on record is carried** (`carried: true`, its own date, age stamped). Nothing on record →
  **`noTape: true`, weight 0** (the universe row is flagged; it is not in the basket).
- Weights: one copy of each priced card, uncapped. `classValue` = Σ price over the basket (fresh and carried marks).
- `classStats` (recomputed at every mark): n, priced, carried, noTape, classValue, median, mean, topCard, top3Share, effN,
  hit20 / hit100 (shares of the universe n at ≥ $20 / ≥ $100 — noTape is a miss), skew / kurt (sample skewness and excess
  kurtosis of ln(price) across the basket rows, null under 8), ageYears, retSinceFirstMonth (when a reconstruction exists).
- **Publish gate.** `status` flips to `live` only when `universeComplete === true` AND each of the top 20 rows by price
  carries a fresh (non-carried) mark. Until then the ticker stays `pre-activation`: divisor null, no history, no level, no
  page numbers. The first live mark is the base: **100.00 on that date**, not the release (`baseRule "first-mark"`).
- At go-live the monthly PriceCharting price history of the basket is chain-linked and attached as `recon[]`, indexed so the
  first live mark reads 100 — labelled reconstruction (`reconBasis` says "reconstructed … not live marks"). It is context,
  never a mark.
- A live class is re-marked weekly; universe-file changes on a live class enter/exit through a logged divisor adjustment
  (level unchanged).

A file with `"fixture": true` is a **test fixture**, not a class: the engine refuses to mark it outside the local `--offline` rig
(`SIDX_OFFLINE_FIXTURE=1 node tools/build-sector-index.mjs --ticker BOWyy --mark --offline`), the workflow skips it, and the
page leaves it off. `BOW25-universe.json` in this folder is that **pipeline fixture**: built from the repo's own `data/sets/*2025.json` CPA rows,
`firstAuto` mirrors the checklist's `first` flag (which the KB has not verified for autos), `pcPath` is null everywhere,
console slugs are patterned and unverified, `universeComplete` is false. The gate keeps it at pre-activation; replace it
with the KB agent's file when that exists.
