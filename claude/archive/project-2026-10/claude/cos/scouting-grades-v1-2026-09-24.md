# Scouting Grades v1 — shipped 2026-09-24 (CoS, Mo in chat: "start it now and do all the bangers")

**Commit:** `a8e14a1` on main (patch copy: `Card Hub/deploy/scouting-grades-v1-2026-09-24.patch`). Tree `69a7993…` gated in cloud and on the Mac.
Gates: audit-prices 0/76 · audit-site 0/3 · audit-terminal 0/0 (`--feed`), `--run-tests` 0/5 (141 scenarios) = baseline.

## What shipped
- `tools/build-grades.mjs` + `data/grades-inputs.json` → `data/grades.json` + machine-owned `GRADES:START/END` block on /bowman-bangers (section `#scouting-grades`, rows `#grade-<slug>`). Generated block — never hand-edit.
- Six factors → Hub rating: Pedigree 20 · Performance 25 · Path 15 · Momentum 15 · Value 15 · Liquidity 10. Fixed (not curved) letter bands. Grades describe; they are NOT calls (board/Scorecard unchanged).
- Inputs: SCP dated solds of the raw #CPA auto (read in Chrome, Browser 1 — SCP 403s node/curl), MLB Stats API 2026, MLB Pipeline Aug 13 ranks/ETAs, path rule open/soft/blocked/heavy + health adj.
- Value = z(fundamentals) − z(ln price) within the 10; straight regression R² was 0.09 (published on page).
- Vault: `Hub` column, only on the exact graded card (2026 Bowman #CPA, raw, no parallel).
- Vault fix: auto-link requires card-number + Pokémon-set agreement; `revalidateAutoLinks()` undoes bad links on load (auto always; manual only if provably another card/line) and removes their feed points. Cause of Mo's bogus Mewtwo +511% / 7.3% top weight and the Sapphire Bazzana −89.7%. 5D header now shows "on N of M cards with history".

## Sep 24 grades
Fischer A− · Houston B · Florentino B · Gonzales B− · Holliday B− · Jump B− (graduated) · Arquette C+ · Aloy C+ · Pierce C− · Kim D (no sale since Aug 5).

## Open
- Re-grade cadence: fold into the Tuesday board lane (it already reads SCP) — needs the lane prompt/LANE-RULES line; no new scheduled run.
- Next: Now/3M/6M grade history, grade chips on the board seats, Pokémon rubric (Momentum, Value vs set, Scarcity, Character, Sealed support, Risk = skew/kurtosis).
- MLB stats: we publish derived grades + short stat lines (facts); raw API data not republished.
