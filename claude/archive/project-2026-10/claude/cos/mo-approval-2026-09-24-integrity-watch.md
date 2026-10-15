# To the CoS — Mo approved the Integrity Watch 2026-09-24 filing

**Mo, in chat, 2026-09-24 (live in the Integrity Watch session):**
> "pss all of these to the chief of staff for review on his next run and tell him I approve"

## Scope of the approval

1. **All six `iw-2026-09-24-*` proposals**: `claude/cos/integrity-watch-2026-09-24-proposals.json` (status now `approved`, `moApproval` block added). Report: `claude/cos/integrity-watch-2026-09-24.md`.
   - `-1` HIGH: ingest the unledgered Sep 19/20 proposals, and change the desk inbox check to catch any `*-proposals.json` whose ids are missing from `pipeline.json`.
   - `-2` HIGH: `/bowman-bangers` ranks on the SCP raw guide value but says "last printed sale". Also covers `x-board.json` `rawSold`. Owner: the Tuesday lane on Sep 29.
   - `-3` MED: `/how-prices-work` claims all set indices are sold-basis and re-marked on Mondays (×4).
   - `-4` MED: `/topps-pristine-baseball` still uses "week one" language and the "$800+ secondary" snippet, stamped Aug 17.
   - `-5` MED: US sessions down ~55% since Sep 19. Read Bing Webmaster by day and add a clean daily series to `ga4-snapshot.mjs`.
   - `-6` LOW: log the nightly instrument counts so Part A medians survive history resets.
2. **The eight Sep 19/20 items that never reached the ledger** (source: `integrity-watch-2026-09-19-proposals.json` and `-09-20-proposals.json`):
   - Apply: `iw-2026-09-19-1` FAIL (engine-block "Hammer med"/"What buyers paid", now 10 pages), `iw-2026-09-20-1` FAIL (`/best-football-cards-under-50` restates the withdrawn $1,349), `-19-2` HIGH (Definitive strip ask over a TBA page), `-19-4` MED (`/indices` "Five tickers"), `-20-2` HIGH (GA4 unsettled day), `-20-3` LOW (board keywords meta).
   - **Close, don't fix:** `-19-5` (resolved on the page) and `-19-6` (superseded by `cos-2026-09-20-1/-4`).

## What approval does not waive

- **R5:** re-verify each item live before you apply it. All were live at 12:09–12:10Z on Sep 24.
- **R20/R21:** fixes must not publish any new ask-derived mark. `-2` must not re-rank the board on engine asks.
- `-5` is an investigation, not a fix. No cause has been claimed.
- The fix shape is yours. Log each item in `pipeline.json` with Mo's quote above as `decidedBy: mo`.

Priority, if the desk run is short: the two FAILs first (`-19-1`, `-20-1`), then `-24-2`, then `-24-1`'s inbox-check change.
