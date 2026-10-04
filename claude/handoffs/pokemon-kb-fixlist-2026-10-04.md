# Handoff — Pokémon KB fix list for the desk and Site Sweep (2026-10-04)

*(Repo mirror of the Project doc, written by the Oct 4 desk. Desk rulings are at the bottom.)*

From the CoS, after the Pokémon KB build (`claude/kb/pokemon/`). Evidence for every item is in `claude/kb/pokemon/site-audit-2026-10-04.md` (S-ids) and the work items in `claude/kb/pokemon/GAPS.md` (G-ids). Read the KB chapter cited before touching copy; only [HIGH] facts go on pages as plain statements.

## Pass 1 — 🔴 content and link fixes (desk / Site Sweep, this week; one commit per group, gates as usual)

1. **G1 — strip pull rates, EV, projections, verdicts** on /chaos-rising, /pitch-black-set-guide, /pokemon-tcg-2026, /pokemon-30th-anniversary-2026, /ascended-heroes, /prismatic-evolutions-guide, /is-pokemon-151-worth-it (S9, S10, S15, S35, S36). Replace every price with a dated index mark or delete it.
2. **G2 — Ascended Heroes**: index page "released Jun 2026" → "Jan 30, 2026"; guide: remove all booster-box rows/links (no box exists; ETB is the flagship); relabel the Mega Lucario ex block "Mega Evolution (ME01)" (S1–S3). Add "ETB released Feb 20, 2026; sealed series starts there" (S16). Fix rarity names (S37).
3. **G3 — /pokemon-tcg-2026**: rewrite from KB 02 §1.4 (ME01 Sep 2025 opened the era; PF25 Nov 2025; 2026 = AH, Perfect Order, CR, PB, 30th, Delta Reign Nov 6); top chase from the live marks (AH26 Pikachu ex #276); delete the "2 million+ reprint" block; Chaos Rising = 122 cards (S4–S8, S34).
4. **G4 — /tag-grading-guide**: re-price from help.taggrading.com (Standard $59.95 / Priority $79.95 / Express $149.95 / Premier $299.95, dated); drop every "cheaper than PSA" line; "machine-measured, human-reviewed"; add "not on eBay Authenticity Guarantee" and "~2% of graded volume (GemRate Aug 2026)" (S11, S12, S45). Card ladder line → add the caveat per G22 once Mo rules.
5. **G5 — `js/grade-links.js` TAG query** → `"TAG 10" -team -"tag team" -"all stars"`; empty-state "no recent TAG sales" (S13).
6. **G6 — Unlimited WOTC graded queries** add `-"base set 2" -celebration -classic -1999-2000 -japanese -reprint`; JU99 `-"no symbol"`; AQ03/SK03 regular rows `-reverse`; 1st Ed graded queries `-unlimited -celebration` (S14, S33, S40, S46).

## Pass 2 — 🟡 data and page integrity (Monday run + Site Sweep)

7. **G7** load grade-links on the six modern Chase tables (Raw / PSA 9 / PSA 10 / TAG) (S18).
8. **G8** AH26 universe: add the 8 missing secret slots (#252, 254, 255, 258–261, 263) or state the rule (S17).
9. **G10** regenerate stat blocks (pre-rebase divisors on all six Chase pages; DR25 counts) (S19, S20).
10. **G11** DR25 / PF25 box feed keys `last=None`; add sealed rows to SV151, HF19, CEL21, CZ23 (ETB) and EVS21 (box) (S21, S22).
11. **G12** BSSL: drop the 1st Ed Machamp (or document); BS99 Machamp row off the 1999-2000 slug; BS99 at 101 is correct (V97, S30).
12. **G13** TR00 holo Dark Dragonite #5 slug check (S29).
13. **G14** name every screened-out card on ND1E and SK03; Crystal range #145–150; delete "scarcest e-Card print run" (S27, S28).
14. **G15** clean universes: JU99 "Venonat 1st Edition Line Error", NG00 "Aligates #159", ND02 "Dracolosse Lumineux", AQ03 4 box toppers, EVS21 dup "Eldgoss", CZ23 2 tins, HF19 "157a Metagross GX"; correct the "All N cards" counts (S31, S32).
15. **G16** SV151 copy: "price-weighted"; IR/SIR tier "#166–#207" (S38).
16. **G18** /pokemon-30th-anniversary-2026: rewrite hero/fact box from the index; delete pre-release sections and the unsourced Celebrations-reprint story (S24, S25, S41).

## Waiting on Mo (in NEEDS-MO) — don't build until ruled
G19 Celebrations promos (retitle vs strip) · G20 RGB Mews out of the TH26 weighted basket · G21 Delta Reign DLR26 go (default go; shell by Oct 10, base 100 Nov 6) · G22 TAG site wording · G23 which untracked sets to add (CoS recommends Surging Sparks + ME01 only).

## Standing
- The NEW-SET-PLAYBOOK is the procedure for Delta Reign and everything after it. Phase 2 (shell + sealed row + watchlist) is due Oct 10.
- KB verifier re-runs at each release (fold into that run). Repo mirror of this handoff and NEEDS-MO: next desk run writes both copies.

## Desk rulings (Oct 4, 14:00 run)
- **Pass 1 G1–G4 → QUEUED, Oct 7 weekly (Content Editor)** — seven-page copy rewrites change more than one page, so they go to the weekly per the desk's own rule; each page is a separate commit; KB [HIGH] facts only, every surviving price a dated index mark.
- **Pass 1 G5–G6 → QUEUED, Oct 7 weekly** — `js/grade-links.js` builds the links on every Pokémon index and card page; each changed query is re-screened on production `/api/comps` (cat 183454) before it ships.
- **Pass 2 G7–G18 → QUEUED as the handoff names them:** data items (G8, G10–G15) to the Monday Oct 5 price lane where they touch a basket or a mark (divisor-logged, never a level jump), copy items (G16, G18) to Site Sweep's S-size queue, G7 to the Night Crew (on-page, existing JS).
- **G21 Delta Reign:** default go stands unless Mo says stop; the shell (Oct 10) is a new index page under the playbook — the freeze exception it needs is Mo's silence-is-go in NEEDS-MO, recorded here.
