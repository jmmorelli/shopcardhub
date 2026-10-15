# 1st Bowman — the rule, the miss, the fix (Sep 9, 2026)

**Status: SHIPPED `d4a3523`, live-verified 12:25 PT (5/5 files byte-identical on www), IndexNow 200.** Mo's directive in chat, Sep 9: "We cannot call a card a first bowman when that is not true."

## The rule (Mo, verified — this supersedes the Aug 21 rule everywhere)

A **1st Bowman** is the card that carries the 1st logo (top-right). Each prospect gets **two**, judged separately:

- **1st Bowman Chrome** — his first non-auto card in any Bowman-family product (Bowman, Bowman Chrome, Bowman Draft, Sapphire).
- **1st Bowman Auto** — his first autograph in any Bowman-family product.

He gets each **once**. A later card of the same kind — same year or not, paper or Chrome, Sapphire, September Chrome, Draft — does **not** carry the logo. The two can sit in different sets: Sammy Hernandez's 1st Chrome is May 2025 Bowman (BP-50/BCP-66) and his 1st Auto is Sept 2025 Bowman Chrome CPA-SH — the COMC scan shows the logo on that auto.

A 1st Bowman is **not a rookie card**. RC = a player already in the league. 1st Bowman = an unproven prospect; the edge is in reading the prospect (college/prior stats), not in buying "rookies in the league."

**Untagged now means NOT a 1st.** The old "untagged = unknown" posture is gone for BCB26.

## What was wrong

1. The Aug 21 `tools/first-bowman.mjs` propagated "1st" to **every** Bowman card of a player's debut year. Topps does not do that. Evidence: Checklist Insider's per-card marks on 2025 Bowman Chrome show Made BCP-245, Wetherholt BCP-241, Condon BCP-248, Peña BCP-239 and Caglianone BCP-154 as **not** 1st — all had May 2025 Bowman cards. Topps' own copy on the Bowman Chrome page: "Players receiving their first trading card will feature the 1st Bowman logo."
2. **Aiva Arquette BCP-174 and Ethan Holliday BCP-209** were tagged 1st Bowman on `/bowman-chrome-2026-index` (and Holliday's row in the guide called BCP-209 his "1st Bowman base Chrome"). Their 1sts are May 2026 Bowman: Holliday BCP-1 / CPA-EH, Arquette BCP-40 / CPA-AA. Arquette also still carried a BANGERS tag though he left the board Sep 8.
3. The index tagged only 4 base + 4 auto 1sts (the names Topps' press named). Topps' own page and its "Collect the Top Prospects" article show the logo on Colome, Angel Nunez, Custodio, Horton and Rosario — none were tagged. The real count is far higher (below).
4. Renderers were compounding it: `js/set-checklist.js` printed **1ST BOWMAN** for any board name (`first || board`), and the index builder did the same for board rows.
5. The site auditor (§10) and its CHARTER encoded the wrong rule and would have FAILed the correct data.

## What is on the site now

`data/sets/2026-bowman-chrome-baseball.json` — every one of the 204 cards re-derived, card by card:

- **72 of 100 Chrome Prospects (BCP) are 1st Bowman Chrome.** Not 1st (had an earlier non-auto Bowman card): Emerson, Gil, Parker, H. Smith, De Vries, **Arquette**, Dalis, Morales, Jenkins, Quintero, **Holliday**, Caceres, Sirota, Fien, Bonemer, Kilby, Walcott, Nori, Alvarez, Duno, Clark, S. Hernandez, Hall, Made, Willits, Pratt, Jett Williams, Rada.
- **97 of 104 Chrome Prospect Autographs (CPA) are 1st Bowman Autos.** Not 1st (signed for Bowman before): Parker, Quintero, Kilby, F. Arias, J. Gonzalez, Doyle, Peña. Note Wilder Dalis and 15 others had a May 2026 base card but **no** May auto, so their September auto IS a 1st Bowman Auto (the Sammy Hernandez precedent; checked against the full May 2026 CPA list on Checklist Insider).
- Jose Castro (Marlins, BCP-230/CPA-JCA) is a 2024 Marlins international signee, **not** the Yankees' Jose Castro on 2024 Bowman Chrome BCP-175 → 1st.

Method (recorded in the file's `firstAudit` block): prior cards looked up in `data/sets` (2025 Bowman, 2025 Bowman Chrome, 2025 Bowman Draft, 2026 Sapphire as the May-2026 proxy), then for the 85 players with no hit there: Checklist Insider 2024 Bowman/Chrome/Draft + 2026 Bowman (base and the full CPA list) and Cardboard Connection 2021–2023 Bowman/Chrome/Draft, scanned by name in Chrome. Logos image-verified on Topps assets for Hernandez, Asigen, Renteria, Gomez, Colome, A. Nunez, Custodio, Horton, Rosario. Topps' hobby/mega checklist and odds PDFs were pulled (no per-card 1st marks in them; hobby box = 6 packs × 10, 2 Chrome autos).

Known limits: name-variant misses are possible for hyphenated/"Jr." spellings (handled the common ones); 2020-and-earlier checklists not scanned (no player in this set is old enough for it to matter, Braylen Wimmer and Kyle Carr were checked through 2021–2024).

## Code and data changes (commit `d4a3523`, 26 files)

- `tools/first-bowman.mjs` — rewritten as the per-card, per-kind, release-ordered verifier (`audit()` exported). `--apply` removes contradictions everywhere, adds 1sts **only** in sets with `firstAudit.complete: true`, and syncs BANGERS tags to the current board (entryDates minus departures). 54 wrong flags removed from 2025 Bowman Chrome (Made, Wetherholt, Condon, base #86 Cheng) and 2025 Bowman Draft (50 Draft picks who already had May/Sept 2025 cards); stale BANGERS tags removed from Arquette, Pierce, Aloy in Sapphire + BCB26.
- `tools/site-auditor/audit-site.mjs` §10 + `CHARTER.md` — the correct rule; checks: `first-bowman-contradiction`, `first-bowman-unverified` (WARN — 1st tags in a set with no `firstAudit.verified`), `bangers-tag-stray/missing`, `first-bowman-render` (a renderer deriving the tag from anything but `card.first`). The old "copy that denies a 1st" check is gone — denials are now correct copy.
- `js/set-checklist.js` v3 (`?v=3` on 14 set pages) — 1ST BOWMAN only from `card.first`.
- `tools/build-bcb26-index.mjs` — board from `board-history.json` (no hand list), tag from `first` only, methodology/subline/pane copy rewritten, CPA duplicate ids (AN/ED/LD/RD) de-duplicated with a player suffix, and the `--seed` replace path fixed (its textual splice corrupted `indices.json` on re-seed — the `JSON.parse` guard caught it). BCB26 universe re-seeded; basket/history untouched, status still **pre**.
- `bowman-chrome-baseball-2026.html` — hero, "Where to buy" intro, Holliday row, watch item rewritten; new avoid-item "Paying 1st-Bowman money for a returning card." `bowman-football.html` — the wrong-rule sentence rewritten.
- `data/pipeline.json` — watchdog (HIGH, fixed) + pushLog entry (hash placeholder → `d4a3523`, resolve at the next checkpoint).

Gates on the pushed tree: audit-site FAIL 0 / WARN 3 (the new `first-bowman-unverified` on the three 2025/Sapphire files — expected, see follow-ups); audit-prices FAIL 0 / WARN 31 (pre-existing). Pushed from a fresh clone on the Mac via the deploy key; Mo's `~/Projects/shopcardhub` is now one commit behind — `git pull origin main`.

## Follow-ups (auto-approved, ranked)

1. **Friday Sep 11 release-window run** — first BCB26 re-mark uses the de-duplicated universe ids; nothing else changes. The 4 duplicate-id LOW is closed by this commit.
2. **Monday Sep 14 weekly** — clear the three WARNs: run the prior-set check for 2025 Bowman, 2025 Bowman Chrome and 2026 Sapphire against the 2024 (and 2021–2023) checklists the way BCB26 was done, then set `firstAudit.verified/complete` on each. 2025 Bowman Draft has no flags; Willits/Anderson/S. Hernandez/Doyle/Parker/Hall are almost certainly 1sts there — verify and tag.
3. **Player/set pages that mention "1st Bowman" for board names** — the Holliday and Arquette guides price the May cards, which are true 1sts; a copy sweep for "1st" claims on any September Chrome card belongs in the Content Editor's weekly pass (the auditor's render check covers the data-driven tags, not prose).
4. Consider surfacing the rule to readers once, in the Bowman Bangers methodology ("two 1sts per prospect; a 1st is not an RC") — it is the site's edge and the thing listings most often get wrong.
