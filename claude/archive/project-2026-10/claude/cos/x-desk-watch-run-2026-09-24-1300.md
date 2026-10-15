# X Desk Watch — run 2026-09-24, 13:04 PT

HEAD `592c195` · origin/main `592c195` · delta 0 commits (fresh HTTPS clone, `$HOME` scratch; HEAD = `feed: nightly 2026-09-24`)

Read at STEP 0: `/LANE-RULES.md` (R8, R9, R10 + amendment, R20–R24, cadence table), `claude/cos/x-desk-watch-2026-09-17.md` (§0, §0.1, §0.2), `claude/cos/STATE.md`, `claude/cos/NEEDS-MO.md`, last filing `x-desk-watch-run-2026-09-23-1300.md` (R6).

**Prompt still stale:** it says 17:30 PT; the LANE-RULES table says daily 13:00 and wins. Fired 13:04 PT. Window: Sep 23 13:05 → Sep 24 13:15 PT (Sep 23 17:00 sweep, an off-slot 19:44 post, today's 10:00 slot, today's replies).

**Surfaces read.** Chrome deviceId `477c0edf…` (selected by id), signed in (*Edit profile* present). Profile, `/with_replies`, post permalink, the post's image at full size (pbs.twimg.com), `/phantasmal-flames-index` **browser-rendered**, live `/data/indices.json` fetched in-page. No baked HTML or curl used to grade.

**Followers: 2,437 (+2 vs 2,435).** No loss. Following 475 → 476.

---

## FAIL · A (claims) — Sep 23, 7:44 PM PT · status 2102952397001920934 · 73 views

> "mega charizard x ex sir just got its first mark at $734 as of sep 22. that chase is already cooking huh?" + image (screenshot of our PF25 chase table)

| Claim | Our page, as rendered 13:1x PT | |
|---|---|---|
| $734, Mega Charizard X ex SIR | PF25 #1 row: **#125/094 SIR $734.00**, PriceCharting ungraded sold read | PASS |
| "first mark" | PF25 inception mark, one row in `history` | PASS |
| **"as of sep 22"** | row **AS OF 09-18**; footer *"Holdings as of 09/18/26"*; `divisorLog` 2026-09-18; no PF25 date of Sep 22 anywhere. **The vendor's own screenshot shows 09-18.** | **FAIL** — wrong date |
| **"that chase is already cooking"** | *SINCE INCEPTION 0.00%*; *"nothing is shown until a second documented read exists"*; *"NO CALLS … An index is a measurement, not a recommendation."* | **FAIL** — one read narrated as momentum (check A, "single observation narrated as a series") |

Likely source of "Sep 22": `data/indices.json` top-level `updated: "2026-09-22"` (a file stamp, not a mark date), or the page's *"filter verified 09/22/26"* Authenticity Guarantee line. See inward note below.

**Correction (direction for the CoS to relay — R10 amendment: direction, not copy):** the $734 is right and dated **Sep 18**, not Sep 22. It is PF25's inception read, the only one that exists; there is no move yet to call "cooking", and the page publishes no Pokémon calls. The post was false when written, so under the R10 amendment it is a take-down-or-supersede call for Mo/CoS, not a default supersede. If superseded: dated Sep 18, no momentum language until the first re-mark (Monday lane, Sep 28).

## B · Taxonomy — PASS (Pokémon; R8/R9 not engaged). Card and rarity named correctly (#125 SIR, not the #130 HR).

## C · Exposure — clean. No COMC position, no competitor, no grading promise, no eBay link.

## D · Fit — MED (held for Monday)
- **Today's 10:00 slot: no post at all** as of 13:15 PT. First day of the vendor's own re-baselined 10:00 ±10 window. Instead an **off-slot 19:44 PT** post last night. Slot record: 09:39 · 09:15 · 14:01 · 10:24 · 09:57 · **none**.
- Charizard post: **no site link** (the only t.co is the image), single-card framing rather than the index. It is PF25's 61%-weight #1 constituent, so the index angle was sitting right there.
- Reach: Charizard **73** views (~17 h) · Florentino **37** (~28 h). Charizard is the best post since Sep 18.

## E · Replies — MED, escalated to the CoS this run (§0 voice regression)
Sep 23 17:00 sweep: **nothing public.** Today, 3 replies at **10:33–10:35 PT**:
- Jirachi (@Jophis69): *"That Jirachi is straight PC material—beautiful pull! ✨"*
- Charizard (@RKH4658): *"Charizard is forever PC material—absolute banger. 🔥"*
- Mew (@ERC_1014): *"That Mew pull is pure PC material—an all-time family memory! 🔥"*

Against §0 / §0.2: **em dash in all three**, **the same sentence shape three times** ("X is ___ PC material—"), **none asks anything**, each is the "Nice pull!" stock-opener class Mo named as the bad example on Sep 21, and "beautiful pull" puts a pull on a post that never says it was pulled (§0.2 rule 3, unverified). No links, no site mention, no numbers — not ads, but it's the "AI bot reply" voice Mo deleted five of on Sep 21. **Gate question for the CoS:** §0.1 keeps the pre-post read on until a batch passes clean, and Sep 22's batch didn't (the Cooper miss). A 10:33 batch landing 3.5 h before the 14:00 desk means it was either not sent to the gate or went out after the 2-hour window. The CoS knows which.

Engagement: 1 like on the Jirachi reply, 2 replies back on Charizard. Views 6–18.

## Inward (P2 hygiene — not vendor FAILs)
1. `data/indices.json` carries a file-level `updated: 2026-09-22` next to PF25 marks dated 09-18. A vendor quoting "as of" from the file gets the wrong date. The feed rule (R10 amendment) is per-mark dates. Suggest a per-index `markedAsOf`, or the vendor reads the row's AS OF only.
2. `/phantasmal-flames-index` says *"Weekly ROC accrues from the first Monday re-mark (09/21) onward"*. There was no Sep 21 PF25 re-mark (STATE Sep 22: first re-mark is the Monday lane's, Sep 28). The date on the page is stale.

## F / G — not due (Thursday). GA4 first clean weekly read (spec §5, Sep 24) belongs to the Monday grade.

## Boundaries held
Read-only on X: nothing posted, replied, liked, followed or deleted. Grok Bot app not opened. No git beyond the clone. No sign-in. Nothing committed.
**Stumble, declared:** my first JS scroll of `/with_replies` didn't trigger X's lazy load, and I nearly read the Sep 22 replies as deleted. A real wheel scroll showed all of them still live.

## Needs you — via the CoS
**What:** the Sep 23 19:44 Charizard post dates the $734 mark "Sep 22" (it's Sep 18) and calls a single inception read "cooking". **Why:** a wrong date plus momentum on one read (check A), from a post with 73 views and climbing. **Action:** the CoS relays the date fix and the no-momentum rule to the vendor; Mo/CoS decide whether it comes down or gets a dated superseding post. Second, the CoS checks whether today's 10:33 replies went through the §0.1 gate.

Scoreboard: posts read **1** (+3 replies) · claims **PASS 2/4, FAIL 2** (one post) · MEDs open **~11** (8 carried + no 10:00 post + no-link single card + reply voice) · followers **2,437 (+2)**.

### NEEDS-MO block (for the CoS to paste)
- **🔴 X · Sep 23 19:44 PT Charizard post — wrong date + momentum on one read (X Desk Watch Sep 24).** "first mark at $734 as of sep 22 … already cooking". The $734 is right (PF25 #125 SIR, PriceCharting sold); it's dated **Sep 18**, and PF25 shows 0.00% since inception with no second read. False when written, so R10 amendment says it comes down or gets superseded. Your call, Mo. CoS relays the direction to the vendor the same day.
