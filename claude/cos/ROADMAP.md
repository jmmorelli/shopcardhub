# ROADMAP — Mo's ideas, dated, with the CoS's read on when each becomes real

Mo brings ideas; the CoS files them here with the trigger that would move each from "someday" to a scheduled step. Nothing here is committed work. Read at the monthly roster review (CHARTER §6) and whenever a Business Read shows a trigger firing.

## The milestone ladder (Mo, 2026-09-17 — "overarching milestones, outside of retention, something tangible")

| Rung | Trailing-30-day EPN earnings | Mo's words | Unlocks |
|---|---|---|---|
| **M0 · Break-even** | **≥ $300/mo** | the ~$300/mo run cost (Sep 3 budget rule) | paid data subscriptions; the contributor-program review (below) |
| **M1** | **≥ $1,000/mo** | "would make me amazed" | — |
| **M2** | **≥ $10,000/mo** | "an absolute HR — I would consider other business avenues for us" | the "other avenues" conversation |

**Measured how:** EPN *Performance by Day*, trailing 30 days, read weekly by the CoS (Business Read §0) and written at the top of `STATE.md`; a rung is hit when the figure clears the bar on **two consecutive weekly reads** — one sale never moves the ladder. **Baseline 2026-09-18:** trailing-60d ≈ $35/mo; best 30-day window $64.70 (one $1,950 sale); $/click $0.28; eBay pays ~3% of GMV → M1 ≈ $33k eBay GMV/month. Full arithmetic: `claude/cos/gap-analysis-2026-09-18.md` §2. **Current rung: below M0.**

**The engine that feeds the ladder:** the Earnings Ideas Desk (`claude/ideas/README.md`), daily at 04:15 PT, 1–3 new ideas a day, ruled on by the CoS daily, ledger at `claude/ideas/LEDGER.md`.

## Long-term

### Paid contributors — articles / advice, Seeking Alpha-style (Mo, Sep 12 2026)
**Mo's words:** "It would be cool if eventually we could pay people to write articles or advice somehow like seeking alpha — down the road. Just a thought I had to add to the longterm roadmap." **Same night, revisited: "Not sure we are ready for that yet. Maybe when we get some more ROI."** — PARKED. Not a near-term item; no design work, no outreach, no mention on the site until the ROI trigger below fires.

**CoS read.** SA's contributor model works because (a) there is an audience that returns to read opinions, (b) authors are paid per view / per subscriber, so the platform only pays for readership it already has, and (c) editorial standards keep the "verified" brand intact. Our version would need the same three things in the same order:

0. **ROI first (Mo, Sep 12).** The site must be paying for itself — EPN commissions covering the ~$300/mo run cost (Mo's Sep 3 budget rule) for two consecutive months — before this leaves the parking lot. **That is rung M0 of the ladder above, held two months.** The CoS reports the number in the weekly Business Read; it does not raise this item until it is met.
1. **Audience first.** A contributor program pays for readers; we don't have them yet (Sep 8 read: ~20 real humans/day, 7.5% returning, 3 Google-indexed pages). Trigger to revisit: Terminal Product's weekly read shows returning ≥ 20% for 4 straight weeks AND Google indexing past ~30 pages. Until then, the cheapest "contributor" is the engine — nightly numbers are content nobody else has.
2. **Pay only on outcomes we can measure.** Per-view or per-Track (a reader ★ Tracks a card from the article) via GA4 events we already emit (`track_card_from_page`), never a flat fee. Budget rule (Mo, Sep 3): no new spend until the site covers its ~$300/mo run cost — so the first payments come out of EPN commissions attributed to contributor pages (`customid=contrib-<slug>`).
3. **Standards that protect the brand.** "The exact card, verified" — a contributor piece carries the engine's stat band for every card it names, and a verdict never contradicts the engine (Mo's Sep 3 "data beats narratives" rule applies to guests too). No unlabelled affiliate links; every eBay link carries `customid=`. The site-auditor gates run on contributor pages exactly like ours.

**Cheap first step when the trigger fires (no money moves):** a "Community take" fold on a player page — a submission form (MailerLite or a simple `/api/submit`), the CoS edits, credit + link to the author's X. Measures whether anyone wants to write for us before we design payment. Second step: revenue share on the page's EPN `customid` bucket, paid monthly by Mo (money never moves by an agent's hand — CHARTER §3).

**Not to do:** an "AI-written contributor" layer, or paying for volume — both are the AI-slop path Mo rejected on Sep 11.

### Faceless YouTube channel (Mo recalls it, Sep 17 2026 — details not on file)
Seeded as ledger line 1 in `claude/ideas/LEDGER.md`; the Ideas Desk re-derives it as a full nine-line idea on its first run. Sketch: the nightly tape and the Tuesday board already render as PNGs; a nightly 45–60 s vertical with a synthetic voice, linking to the board and the index pages. Open questions: Shorts pay ~nothing (the value is the link and the search presence), production cost per clip, and whether R9/R10 copy rules can be enforced on a script. Anything Mo remembers goes on the ledger line.

## Near-term (already scheduled elsewhere — listed for context)
- Terminal step 5 (`rooms/terminal.md`): fold the Bangers essay, the 11 host-less card pages, engine-side σ/skew/kurtosis, Topps Update page.
- **Sector-model set indices (Mo, Sep 15 — rules: `claude/cos/sector-index-rulebook-2026-09-15.md`).** SV151 is being **rebuilt under Path B** (the Sep 15 build never reached `main`); the screen ran 207/207 on Sep 17 and Mo voted clean medians, so the rebuilt index constitutes on clean medians at inception. Rollout to further **mature** Pokémon sets comes after that, one set at a time. **Sports sets are explicitly out of scope:** a Bowman set's cards are driven by player outcomes, not a shared set-level factor, so the "sector" in sports is the player, not the set (which is roughly what the Bangers board already is).
- Hammer tape on Home — ruled Sep 16: no chart; two-number stat tile, and nothing until close-time capture is fixed.
- Accounts / cross-device portfolios — zero-knowledge Vault sync approved Sep 15, builds W4 (Oct 6–12); no accounts, no PII.
- Repo-scan adoptions (`claude/cos/repo-scan-2026-09-18.md` §1–§2): `gates.yml` CI, lychee, hookify rules, the six copied patterns — Wednesday build sessions, after the W1 findability items.
