# Brief to the CoS · desk: Site Sweep, Tue Sep 29 (Mo: "pass it up to the chief of staff")

Mo read the sweep result in chat and handed it to you. Full report: `claude/cos/site-sweep-2026-09-29.md`.

## 1. Apply: three patches are waiting on one Mac-linked run
Today every lane lost the Card Hub folder: the auto-mode permission check denied the request each time. Nothing from today is live.

Apply order, each on a fresh deploy-key clone and behind the three gates:
1. **League** `83b9fca` (on `df6054c`): `claude/handoffs/league-2026-09-29.patch.txt`. Tree `0b907f63…` after patch 1.
2. **Night Crew** `0c4bac6` (on `df6054c`): `claude/night-crew/pending.patch.txt`, then `node tools/build-nav.js` (expect "129 written").
3. **Site Sweep** `165f7cc` (on `9bc43f6`): `claude/handoffs/site-sweep-2026-09-29.patch.txt`. Tree `6f8365bf…` if main is still at `9bc43f6`. It only touches `css/site-fixes.css`, at §7b and §8c, and doesn't overlap Night Crew's §9/§10 at the end of the file.

Sweep gates on its own tree: 0/75 · 0/3 (129) · 0/0, the baseline. Live check after the push:
- Curl `/css/site-fixes.css` for "7b (Site Sweep" and "8c (Site Sweep".
- At 390 on `/lamine-yamal-rookie-cards`, scroll to the bottom and back to the top. The docked button's right edge should be ≤ 376.

Also add the sweep's STATE run-log line. It's in the report, under Stumbles.

## 2. Rule on: filed items
- **F1 (MED) → Night Crew.** On phones, `.roi-table` guide tables push Verdict, the eBay button and sometimes the price off-screen on 55 of 56 pages. The fix is to stack rows under 560 px, like §10 does for set-index tables. This is the top filed item.
- **F2 (MED) → Night Crew.** `tools/dest.py` has drifted from the live pages. A re-run would move DEST above the buy strip, add it to 12 pages and revert the Sep 27 copy. **Nobody runs it until it gets an in-place mode.** The copy fix (U-F2) ships with that: "Your Vault … P/L" becomes "Your Watchlist … live prices".
- **U-F3 (MED) → Sep 30 weekly / Integrity Watch.** `/best-baseball-cards-under-50` and `/best-basketball-cards-under-50` are dated June 2026 on an eBay-sold basis (R20). They need the same dated sold re-read the football page got on Sep 19.

## 3. Standing problem: for NEEDS-MO or the Oct 1 roster review
Three unattended lanes today (league 05:57, Night Crew deploy 08:18, Site Sweep 10:10) couldn't get the Card Hub folder, and all three fell back to patches. The desk is now the only way anything ships. The fix is on Mo's side: attach the Card Hub folder to those scheduled tasks, or give them a standing grant, so they stop depending on a live permission prompt that the auto-mode check refuses.
