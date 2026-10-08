# Handoff — classic-set marks get their own job (CoS desk, 2026-10-08)

**Status: SHIPPED Oct 8 on Mo's "I approve" (desk). The diff below was built as `.github/workflows/classic-marks.yml` with one change: one ticker per call (timeout 25m each) instead of three sub-groups.**

## What happened
- Run #74 (`37802029345`, Thu Oct 8) step "Build site artifacts" ran 15:56:01 → 17:13:50 UTC (77 min). The four early groups (TH26, SV151, SSP24+MEG25, BOW26+BB26+BCB26) took ~37 min; the **classic group** (24 tickers: BS99 JU99 FO99 TR00 NG00 NDC01 NR01 ND02 AQ03 SK03 HF19 TU19 EVS21 CEL21 CZ23 BS1E BSSL JU1E FO1E TR1E NG1E NDC1E NR1E ND1E) then ran into its `timeout 40m` → annotation "classic-set marks failed - levels and pages keep the previous mark".
- The dial-in session (Oct 8, ~12:00 PT) re-marked the 7 first-group tickers by hand and believed the classic group "should no-op: already marked". It wasn't: at the desk (~14:30 PT) **19 tickers were on Oct 1 and 5 on Oct 4**, i.e. the Oct 5 (6 h cancel) and Oct 8 (timeout) cadences both missed.
- The same group, run by hand from the cloud on Oct 8 (on-cadence Thursday mark): see the timing below. It does not fit a 40-min box, and the step's 150-min budget cannot hold early groups (~37) + classic (~2 h+) + the Monday graded ladder (50).

## The fix (proposed diff, not applied)
1. **New workflow `.github/workflows/classic-marks.yml`** — `schedule: cron "30 19 * * 1,4"` (after the nightly publishes, ~12:30 PT Mon/Thu) + `workflow_dispatch`; `concurrency: group: main-writers, cancel-in-progress: false`; `timeout-minutes: 300`.
   - Steps: checkout main · setup-node · copy `price-data` feed files as the nightly does · `cp data/indices.json $RUNNER_TEMP/idx-pre.json` · for each of three sub-groups (WOTC Unlimited 10 · WOTC 1st Ed/Shadowless 9 · modern classic HF19 TU19 EVS21 CEL21 CZ23) run `timeout 100m node tools/build-sector-index.mjs --ticker <group> --mark --if-mark-day`; on failure `node tools/ci/merge-ticker-keys.mjs --from $RUNNER_TEMP/idx-pre.json --into data/indices.json --tickers <group>` and `git checkout --` that group's pages only · then `node tools/build-home.mjs` + `node tools/build-badges.mjs` · the three gates (`audit-prices`, `audit-site`, `audit-terminal --feed data/feed`, FAIL 0 required) · commit `price-engine: classic marks <date>` · push with `git pull --rebase` + 3 retries (re-apply only the classic ticker keys on an `indices.json` clash, as the nightly does).
2. **Nightly `price-snapshot.yml`:** delete the classic group block (lines ~131–135) so the two jobs never mark the same ticker; leave a comment pointing at `classic-marks.yml`.
3. **LANE-RULES cadence row:** classic marks = their own job, Mon/Thu ~19:30 UTC; the desk confirms every Mon/Thu that all 37 live tickers carry a market row for the day (kind ≠ divisor) — 7 + 6 (Mon chase) from the nightly, 24 from this job.

## Check after the first run
`data/indices.json`: every classic ticker's last non-divisor history row = the run date; pages show "re-marked <date>"; home tape Charizard BS99 no longer prints the Oct 6 window switch.
