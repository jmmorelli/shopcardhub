# Portfolio Tracker — build-ready design spec

The watchlist's next tier: let a user enter a **cost basis** for cards they own and
track value like a stock portfolio — but card-aware (raw vs PSA 9 vs PSA 10 are
three different exit prices). Built on pieces that already exist: the price engine
(`api/cron-snapshot.js` + `_lib/`), the `prices-latest.json` / history feed, the
localStorage pattern chosen for the watchlist, and the site design tokens.

Build this AFTER the engine is live and proven (history accruing, Signal Board
shipped). Nothing here needs a new data source.

---

## 1. Relationship to the watchlist
A watchlist entry is `{ cardKey }` (a starred card). A portfolio holding is the
same container plus ownership facts: `{ cardKey, conditionOwned, costBasis, qty,
acquiredDate }`. Same localStorage mechanism, same feed, same design — this is an
extension, not a new system. A card can be on the watchlist, in the portfolio, or
both.

---

## 2. Required engine change (small — do first)
Today `fetchProduct()` returns one `price` for the chosen condition. The tracker
needs raw + PSA 9 + PSA 10 together. They're already in the same API payload —
just capture them.

- In `api/_lib/pricecharting.js`: add to the returned object
  `priceRaw` = `loose-price`, `pricePsa9` = `graded-price`,
  `pricePsa10` = `manual-only-price` (all pennies→dollars; already have the helper).
- In `api/cron-snapshot.js`: store these on each daily history point
  `{ d, raw, p9, p10, v }` (keep `p`/`v` for back-compat or alias `p`→`raw`), and
  surface `raw/p9/p10` + `retailBuy/retailSell` in `prices-latest.json`.
- No new API calls, no new rate-limit cost — same one product call per card.

---

## 3. Holding data model (localStorage)
```js
// localStorage key: "sch_portfolio_v1"  -> array of holdings
{
  id: "uuid",               // local row id
  cardKey: "sportscardspro:12345",  // must exist in tracked universe
  label: "Ethan Holliday — 1st Bowman Chrome Auto",
  conditionOwned: "raw",    // raw | psa9 | psa10  (what they physically hold)
  costBasis: 42.00,         // $ per card, what they paid
  qty: 1,
  acquiredDate: "2026-05-20",
  notes: ""                 // optional
}
```
Keep a separate `sch_portfolio_settings_v1` for the user's fee % and grading
assumptions (section 6) so they're not re-entered per card.

---

## 4. Persistence (a portfolio is data you don't want to lose)
- **Default:** localStorage (no login, private — same as watchlist Tier 1).
- **Add now, not later:** Export / Import. "Download my portfolio" → a JSON file;
  "Import" → restore from one. Plus a shareable/bookmarkable link (base64 the
  holdings array into `?p=`) so they can move devices. Cost-basis records justify
  this more than a plain watchlist does.
- **Later:** real accounts (magic-link email + a free-tier DB) — the alert/sync
  tier. This is the feature where accounts finally pay for themselves. Don't build
  until traffic/engagement justifies it.

---

## 5. Valuation — mark conservatively, by default
A card has no single price. **Mark the book at raw resale, net of fees** — the
real "what I'd net selling today" number. Grades are upside scenarios (section 6),
NOT the default mark.

```
fee            = settings.resaleFeePct / 100      // default 0.13 (eBay/COMC-ish)
priceFor(cond) = { raw: raw, psa9: p9, psa10: p10 }[cond]   // current mark price
netNow         = priceFor(holding.conditionOwned) * (1 - fee)   // per card, net
marketValue    = netNow * qty
unrealizedPL   = (netNow - costBasis) * qty
returnPct      = (netNow - costBasis) / costBasis * 100
```
- If you own a graded card (`conditionOwned: psa10`), mark it at the PSA 10 price —
  no grading scenario needed; it's already slabbed.
- **Liquidity flag:** if `sales-volume` is thin (< ~12/yr) or `points < 20`, badge
  the mark "thin/estimate" — a comp isn't a price if nothing trades.

---

## 6. Grade-upside panel (the grading-decision tool)
Only for raw holdings. Show raw-now vs the graded outcomes **net of grading cost**,
probability-weighted — don't present PSA 10 as a free ceiling.

```
gradingCost  = settings.gradingCostPerCard      // default $20 all-in (fee+ship)
net(price)   = price * (1 - fee)
// probability-weighted expected value of submitting one raw card:
gradeEV      = pP10*net(p10) + pP9*net(p9) + pSub*net(raw) - gradingCost
gradeUpside  = gradeEV - net(raw)               // vs just selling raw now
```
- `pP10 / pP9 / pSub` are user-editable per holding (default in settings, e.g.
  0.20 / 0.45 / 0.35 — clearly marked "your estimate; grading is card-specific").
  `pSub` = lands below 9 (sells at ~raw).
- Verdict line: `gradeUpside > 0` → "Grading looks +EV by $X" else "Hold raw / not
  worth submitting." Same honest-EV voice as the hobby-box calculator.
- Show the three net prices side by side so the user sees the spread, then the
  weighted call.

---

## 7. Portfolio-level stats (the dashboard)
Aggregate across holdings:
- **Total cost basis**, **total market value (net)**, **total unrealized P/L $ + %**.
- **Per-card contribution** to P/L; **best / worst movers** (sortable).
- **Cost-vs-value over time** chart — the engine is already banking daily history,
  so reconstruct portfolio value per day from each holding's series since
  `acquiredDate`. (Chart.js is already allowed for artifacts; for an on-site page,
  a lightweight inline SVG/canvas matching the site's chart styling.)
- Optional stats layer (on-brand): simple time-weighted return, and per-position
  volatility / max-drawdown straight off `ta.js` (`stdev`, `maxDrawdown`) — reuse,
  don't rewrite.

---

## 8. UI, placement, design
- **Where:** a dedicated `/portfolio` page (cleaner than wedging into a guide), with
  a "Portfolio" nav entry. The watchlist "track" star and an "I own this" / add-to-
  portfolio control can live together on card rows site-wide.
- **Reuse the design system only** (same rule as the Signal Board): tokens from
  `:root` (`--green` gains, `--red` losses, `--accent`, fonts `--fd/--fb/--fm`),
  extend `.roi-table` for the holdings table, existing button/input styling. P/L
  colored green/red by sign — consistent with the chip color language.
- Holdings table columns: Card · Owned (raw/9/10) · Qty · Cost · Net Now · P/L $ ·
  P/L % · (raw rows) Grade-upside button. Footer row = portfolio totals.
- Add-holding form: card picker (typeahead over tracked universe), condition, cost,
  qty, date. Reject cards not in the tracked universe with a helpful message.
- Empty state: tasteful "Add a card you own to start your book" — never an error.

---

## 9. Constraints (state them in the UI, honestly)
- **Tracked-universe only:** a holding must map to a card in `watchlist.json`
  (that's the price/history source). Out-of-universe cards can't be marked yet;
  auto-expanding the tracked set on add is possible later but costs nightly cron
  budget (~50-card cap).
- **Marks are estimates:** wide bid/ask, thin volume, grade variance. The tracker
  shows a conservative net mark + scenarios, not a guaranteed sale price. Label it.

---

## 10. Verification before ship
1. Math: a hand-checked holding (known cost, known prices) returns the right
   netNow / P/L / return% and gradeEV. Add cases to `tools/price-engine/selftest`.
2. localStorage round-trips; export→import restores byte-identical; share link
   rebuilds the same book.
3. Renders cleanly with an EMPTY portfolio and with thin/no-history cards.
4. Design parity: green/red P/L matches the site color language; no new tokens.
5. Desktop + 380px; totals reconcile (sum of rows == footer).

---

## 11. Build order (once engine is live)
1. Engine change (section 2) — capture raw/9/10 into the feed.
2. localStorage holdings + add/edit/delete + export/import/share (section 3–4).
3. Valuation + per-row P/L (section 5).
4. Grade-upside panel + settings (section 6).
5. Portfolio dashboard + history chart + stats (section 7).
6. `/portfolio` page + nav entry, in-style (section 8).
7. Verify (section 10); update SITE_TASKS / SESSION_NOTES / memory.
