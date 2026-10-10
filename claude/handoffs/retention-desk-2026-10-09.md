# Handoff — Retention Desk created (CoS, Oct 9 2026, Mo in chat)

**Mo, Oct 9:** nobody is generating reasons for a collector to come back (or hand over an email); the Vault is not that reason and we do not out-vault PSA; Seeking Alpha's data-plus-analysis is the model; wants one agent for new ideas, one for fit against the existing site, the CoS deliberating; nightly.

## What was built this session
- `claude/retention/README.md` — charter: six return lanes (A Ritual · B State · C Alerts · D Tools · E Standing · F Analysis), nine-line idea format, six-point fit rubric, filter, backpressure rule (≥ 4 unruled rows → no new idea).
- `claude/retention/LEDGER.md` — seeded R1–R12 from everything retention-shaped already proposed/built/parked elsewhere so the desk does not re-propose it.
- Scheduled task **"Retention Desk — nightly (Sun–Thu 03:40 PT, cloud: ideate, fit-check, file)"** — `trig_014s2obR8tYg9Q1g4ArLAhJA`, claude-opus-5-5, automatic approval, no push notification (the CoS desk carries it). Two sub-agents (Ideator, Fit Analyst) under a lead that files. First scheduled fire Sun Oct 11 03:40 PT.
- **CoS desk prompt** (weekdays 14:00) updated: STEP 1(a) reads `claude/retention/<date>.md`; STEP 5 rules on every `proposed` retention row (adopt → S Night Crew BACKLOG / M Wednesday weekly / L handoff; park with gate; decline with reason).

## First run (Oct 9, manual) — filed `claude/retention/2026-10-09.md`; CoS rulings the same afternoon
- **R13 "What it costs to finish this set" → ADOPTED, Wednesday weekly Oct 14**, under the Fit Analyst's five conditions (see the ledger row). Pre-step **before Mon Oct 12**: add `chase_click` and `grade_click` to `pageClicks28` in `tools/ga4-snapshot.mjs` so the Oct 13 snapshot is the baseline. Owner: Wednesday weekly; v2 (`finishCost` history field) only in an attended CoS session. **→ BUILT AND LIVE the same evening, `ca37d43` (Mo: "I approve of all"); the pre-step too. See the ledger row and `claude/cos/STATE.md` NOW 2026-10-09 ~17:15.**
- **R3 Vault sync → PARKED** (W4 ends Oct 12 with nothing built; Mo's Sep 25/Oct 9 stance). The ideas ledger #13 row needs the same status. **→ done Oct 9 evening (ideas #13 parked, Project + repo).**
- **R11 (hobby-boxes signup placement + `signup_view`) → Night Crew Mon Oct 12 as P1**, ahead of polish; otherwise the Oct 21 read moves to Nov 4. **→ LIVE Oct 9 evening, `ca37d43`; the Oct 21 read stands.**
- **Side findings routed:**
  - Integrity Watch (Mon Oct 12): classic-ticker plain reads compare against the Oct 6 holo-rule divisor re-read, not a market mark (BS99 "Zapdos up 24%"); every 1E ticker `prevPrice` is 1 day old; SV151 has no Oct 5 Monday mark though its subtitle says Mon/Thu; AQ03's −$1,122 two-day swing is one hand re-mark (Lugia #149). *(The R13 line never compares across a divisor row, so none of these reach it; the existing "Biggest move" sentence is IW's.)*
  - Night Crew (index-first SEO, with B63–B66): the sector index pages checked carry **no `<h1>`** (title is an `h2` in `.sidx-mast`) — add to the Google index fixes handoff as B67. **→ B67 LIVE Oct 9 evening (`ca37d43`).**
  - Content Editor: `/best-pokemon-set-to-start-collecting` is hand-authored and will drift from the live whole-set line (EVS21 235 vs 237, SSP24 249 vs 250) → generate those figures from `indices.json` or date-stamp them. **Now live-relevant: the R13 line prints EVS21 237/237 and SSP24 250 of 252 — that page disagrees with it today.**
- Note: the task fired once at creation (≈14:15 PT) and once on the manual fire (14:42); the second run correctly declined to file a duplicate. Expect a filing on creation-day when a task is made; not a defect.

## For the next Mac-linked desk run (docs-only commit) — **done by the CoS Oct 9 evening unless struck**
1. ~~**LANE-RULES.md lane table** — add the Retention Desk row~~ (already written by the Oct 9 14:00 desk, LANE-RULES l.710).
2. ~~**New rule R34**~~ (already written by the Oct 9 14:00 desk, LANE-RULES l.1100).
3. ~~Mirror `claude/retention/README.md` and `LEDGER.md` into the repo~~ — README was already mirrored at `8e25414`; LEDGER re-mirrored Oct 9 evening with the R11/R12/R13 updates (docs commit after `ca37d43`).
4. ~~`claude/rooms/growth.md`: add Retention Desk to the room header and a one-line standing decision pointing at R34~~ — done Oct 9 evening (Project copy; rooms live only in the Project).

**Open for the Monday desk:** Content Editor item above (`/best-pokemon-set-to-start-collecting` figures vs the live R13 line); the Oct 11/12 Retention Desk filings to rule at STEP 5; STATE.md is 228 KB against its own 25 KB rule — archive the pre-Oct-2 blocks.
