# Vault: table view + scale pass (Aug 21, 2026, evening)

Mo: "not enough data points on the screen — 3 or 4 cards in big boxes" (his thinkorswim Longs list as the model) → dense grid + popup detail. Then "start the scale work".

## Table view (pushed earlier as "Vault: dense table view by default")
Default view is a `.vgrid` table: status dot, Card/set, Grade, Last, Δ, 7D, 30D, then own: Cost/P&L $/P&L %/Qty/Value/Since; hunting: All/Target/To Zone/Logs/Since; Trend sparkline; hover share/edit. Sortable headers, footer totals. Row click → popup with the full old card (chart, quick log, live asks, price log, Read the Tape). Cards view kept as a toggle. Analytics collapsed below.

## Scale pass (in repo, Mo pushes)
- **IndexedDB** is the primary store; localStorage `sch_vault_v1` becomes a slim mirror (last 2 prices/card) so the card-page ★ Track button (js/vault-track.js) works unchanged; `load()` merges cards that exist only in the mirror. Falls back to full localStorage if IDB is unavailable; legacy full copy migrates on first run.
- **Rendering:** list re-render split from KPI/analytics; 120-row chunks with scroll-to-load; memoized sparklines; debounced search.
- **Grouping** by Sport / Set / Grade with collapsible subtotal headers; **column chooser** (persisted).
- Measured with 800 cards × 121 price points: first rows ~240 ms, re-render ~70 ms, mirror 204 KB, IDB holds the full 3 MB.

## Push
```
git add watchlist.html
git commit -m "Vault scale: IndexedDB store, chunked grid, grouping, column chooser"
git push origin main
```

## Next
COMC inventory import (Card Hub/comc-inventory-2026-08-21.csv → bulk paste path) so Mo's real 1,100-item book lives in the Vault — that's the Friday post.
