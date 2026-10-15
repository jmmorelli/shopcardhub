# Growth League board — 2026-09-29 (gen 1, week 1, day 4)

**Verdict: fourteen pages built, search not yet arrived.**

Source: `node tools/league/score.mjs` on the nightly GA4 snapshot — **GA4 day Sep 27** (the Sep 28 nightly had not landed on `price-data` at 12:57Z; `landingOrganicDaily28` present). Score = organic-search landing sessions; clicks/signups reported, never ranked.

| Agent | Pages | Organic sessions | Clicks | Signups | Ranking read |
|---|---|---|---|---|---|
| A · Release desk | 5 | 0 | 0 | 0 | not rankable (< 100) |
| B · Question desk | 5 | 0 | 0 | 0 | not rankable (< 100) |
| C · Comparison desk | 4 | 0 | 0 | 0 | not rankable (< 100) |

| Agent | Page | Published | Floor from | Sessions | Clicks | Floor |
|---|---|---|---|---|---|---|
| B | /is-pokemon-151-worth-it | Sep 26 | Sep 26 | 0 | 0 | open (closes Oct 26) |
| C | /pitch-black-vs-chaos-rising | Sep 26 | Sep 26 | 0 | 0 | open |
| A | /pokemon-delta-reign-2026 | Sep 26 | Nov 6 | 0 | 0 | not started |
| C | /prismatic-evolutions-vs-destined-rivals | Sep 26 | Sep 26 | 0 | 0 | open |
| A | /topps-update-series-2026 | Sep 26 | Oct 14 | 0 | 0 | not started |
| B | /umbreon-ex-worth | Sep 26 | Sep 26 | 0 | 0 | open |
| B | /gengar-ex-worth | Sep 27 | Sep 27 | 0 | 0 | open |
| C | /prismatic-evolutions-vs-ascended-heroes | Sep 27 | Sep 27 | 0 | 0 | open |
| A | /topps-chrome-formula-1-2026 | Sep 27 | Oct 15 | 0 | 0 | not started |
| C | /ascended-heroes-vs-destined-rivals | Sep 28 (improved Sep 29) | Sep 28 | 0 | 0 | open |
| B | /moonbreon-worth | Sep 28 | Sep 28 | 0 | 0 | open |
| A | /topps-allen-ginter-2026 | Sep 28 | Oct 7 | 0 | 0 | not started |
| B | /charizard-ex-worth | **Sep 29 (new)** | Sep 29 | — | — | open |
| A | /topps-holiday-baseball-2026 | **Sep 29 (new)** | Oct 21 | — | — | not started |

- **Floor read:** no window has closed (first closes Oct 26). Nothing dead.
- **Ranking read:** not rankable — slate carried.
- **This run:** A built `/topps-holiday-baseball-2026` (Oct 21 confirmed on topps.com); B built `/charizard-ex-worth` (17 prints, dated sold comps); C improved `/ascended-heroes-vs-destined-rivals` (the Sep 28 mark flips the verdict to Ascended Heroes, 88.45 vs 87.68). Every agent is now 5/5 for week 1 (Sep 26–Oct 2) → the Wed–Fri runs are improve-only.
- **Shipped?** Not pushed — the Mac had no connected folder, so the deploy key was unreachable. Patch staged for the desk: `claude/handoffs/league-2026-09-29.patch.txt` (commits `83b9fca` site + `f3fb7c7` STATE; final tree `de53ba1f23f164139bfd4064e59ed56cb663dd33`).
