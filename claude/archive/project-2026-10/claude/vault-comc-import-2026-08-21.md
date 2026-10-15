# Vault: COMC inventory import (Aug 21, 2026, late)

Both earlier pushes verified live (8fb4769 table view, e0c0e97 scale). Next step built: the Vault's **Import** button now accepts the COMC Inventory Manager CSV.

## Behavior
- One Vault row per distinct card (COMC lists each copy separately): qty = copies, cost = average recorded cost, Bought On = earliest acquired. Name = the part after the set ("#BDC-1.1 Travis Bazzana"); set = prefix. Grade parsed (PSA/SGC/BGS/CGC/TAG + number). Sport guessed from set keywords (Bowman University → football).
- COMC market LOW logged as a price point tagged "◔ COMC floor" (an ask, not a sold), dated from the filename's date.
- **Privacy:** NOT_FOR_SALE items → private (🔒). Private cards never appear in share images (whole-vault image says "N private positions not shown"; single-card share refused). Private checkbox in the edit modal. The corner (MHJ 78×, Bazzana 45×) stays off anything that leaves the browser.
- READY_TO_SHIP (55 personal items) skipped. Re-import is idempotent (matches on the COMC card string; appends a new floor point per snapshot date).
- Test with the Aug 21 file: 1,061 items → 536 rows (398 baseball / 65 football / 59 basketball / 6 Pokémon / 8 other), 146 private, 0 errors; re-import → still 536.

## How Mo uses it
/watchlist → bottom bar **Import** → pick `Card Hub/comc-inventory-2026-08-21.csv`. Re-snapshot + re-import weekly and the floor history accrues.

## Push
```
git add watchlist.html
git commit -m "Vault: COMC inventory CSV import, private positions"
git push origin main
```
