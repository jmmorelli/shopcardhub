# X Desk Watch — run 2026-09-20 (Sunday), 13:30 PT slot (read 13:32–13:58 PT)

HEAD `7ce80d1` · origin/main `7ce80d1` · delta 0 commits

Fresh HTTPS clone in `$HOME` scratch (never a connected folder, never Mo's clone). Read at STEP 0:
`/LANE-RULES.md` (R1, R2, R5, R6, R7, R8, R9, **R10**, R11), `claude/cos/x-desk-watch-2026-09-17.md`
(spec), `claude/cos/STATE.md`, `claude/cos/NEEDS-MO.md`, and yesterday's
`claude/cos/x-desk-watch-run-2026-09-19-1730.md` (Project doc) for R6.

**Spec stale on one line — fifth sighting, NOT re-filed as a finding.** §3 still says *"Run daily at
13:00 PT"*; the LANE-RULES cadence table and the task prompt say **13:30 + 17:30**, and the table wins.
Recorded here only so the next spec-edit pass has the line. No further mention in future runs.

**Surfaces read.** @shopcardhub profile + `/with_replies`, Chrome deviceId `477c0edf…` (selected by
id; **displayed "Browser 1" this session** — the name is never trusted). Sign-in verified on the
profile header (*Edit profile* present). `/pitch-black-index` verified **live, browser-rendered** at
13:47 PT, full page text + the sealed strip element read in the DOM. No baked HTML and no curl used
to grade any claim. **Nothing could-not-read.**

**Followers: 2,433** — **−1 vs yesterday's 17:30 run (2,434)**, **flat vs the Sep 18 baseline (2,433)**.
Following **458**. One follower over two days is noise, not the loss Mo flagged. **No follower loss.**

---

## The Sunday post: claims PASS, and this is the cleanest vendor post yet

Posted **09:15:33 PT** (decoded from status id `2101706842908791000`), image + link in the main post.
**25 views** at read time, 0 likes, 0 replies, 0 reposts.

> We built a chase tracker for Pitch Black.
> One weekly number for the whole secret tier — not just the chase hit — free, no signup.
> shopcardhub.com/pitch-black-in…

**A · Claims: PASS, every one, traced to the live browser-rendered page.**

| Claim | Live source at `/pitch-black-index` |
|---|---|
| image: **90.52** | level reads `90.52` |
| image: **▼ −3.2% w/w** | page reads `−3.2% w/w`; history 93.51 (09-07) → 90.52 (09-14) = −3.20% |
| image: **re-marked 09/14/26** | page reads `re-marked 09/14/26`; RE-MARK `MON` |
| image: **36 / 36**, basket **$793**, skew **+3.22**, eff. holdings **7.0**, divisor **8.7603** | all five match the page cell-for-cell; basket total row `$792.99` |
| image: **−9.48% since inception** | page reads `−9.48%` |
| image: **#1 constituent Mega Darkrai ex SIR #116, 26.9%** | row 1: `Mega Darkrai ex #116/084 · SIR · $213.68 · 26.9%` |
| text: **"whole secret tier"** | legend: *"the secret tier: all 36 beyond-base slots (#85-120). Universe = 36"*; holdings 36/36 |
| text: **"not just the chase hit"** | top constituent is 26.9%, not a single-card proxy — fair |
| text: **"one weekly number"** | `RE-MARK MON`, header *"RE-MARKED WEEKLY"* |
| text: **"free, no signup"** | *"Track in your Vault (free, no account)"*; page is open |
| link | `t.co/LBZ9UeDZFP` → `shopcardhub.com/pitch-black-index`, **200, correct page** |

No figure rounded away, no figure embellished, no series narrated that the page does not carry, and the
screenshot is honestly stamped with a 6-day-old mark rather than implying a fresh one. It also picked up
Mo's own Friday post (the Pitch Black hanger, mega Darkrai EX SIR) and turned it into an index post
rather than a single-card dump — the right instinct without being told.

**B · Taxonomy: clean.** Pokémon post, no Bowman claim, nothing for R8/R9 to bind.

**C · Exposure: clean.** No COMC position, no competitor name, no grading-outcome promise, no
financial-advice framing, no invented scarcity, no eBay link in the post.

**D · Fit: PASS on everything but the clock.** Index-first, one idea, plain English, zero numbers in the
body (all in the image, all readable on the linked page), one clean site image, link in the main post
and it resolves. This is the Sep 18 voice brief landing.

- **MED (standing, improving): 09:15 vs the 09:00 doctrine.** Sep 18 was 09:39; today is 09:15. The
  drift is closing on its own. Monday's note, one line, framed as "nearly there."

**E · Replies: nothing to grade.** Sunday carries no reply sweep (weekday 12:00/17:00 only), so zero is
compliance. `/with_replies` newest item is still **Sep 13**, unchanged for five runs; the Sep 13 "Star a
card" thread's reply count of **1** is still the account's own thread continuation. **Inbound engagement
across the account remains zero.**

**Cadence: correct.** Friday 09:39 post → Saturday silent (not a posting day) → Sunday 09:15 post. The
charter's Sunday 09:00 slot was filled.

---

## One new INWARD finding — P2, and it is on the page the vendor just amplified

**The "30D · index" figure on the five Pokémon index pages is not a 30-day figure.**
`js/sealed-row.js` line 38: when no mark exists 30 days back, it silently falls back to
`ih[0].level` — **inception** — and still prints the result under the `30D` label. The box side of the
same strip is honest about this and prints `day 1` when its series is too short; the index side is not.

**No index on the site is 30 days old today**, so every one that prints a number there is printing a
since-inception change:

| Index | Inception | Age | What the strip shows under "30D" |
|---|---|---|---|
| PB26 · Pitch Black | 08-24 | **27d** | **−9.5%** — actually since inception |
| CR26 · Chaos Rising | 08-24 | 27d | since inception |
| AH26 · Ascended Heroes | 08-24 | 27d | since inception |
| PRIS25 · Prismatic | 08-24 | 27d | since inception |
| DR25 · Destined Rivals | 08-24 | 27d | since inception |
| PF25 · Phantasmal Flames | 09-18 | 2d | `—` (single history row — spared by luck, not by the guard) |

**Severity P2, not a FAIL, and no correction is owed.** The error is 3 days of window on a −9.5% number,
and **the vendor never quoted it** — its post carried the level, the w/w and the scope, all correct. This
is a page fix, not a page fix plus a correction. Checked against `data/pipeline.json` and STATE (R6):
not previously ruled.

**Why it is worth the CoS's minute anyway:** the Aug 24 cohort self-heals on **Sep 23**, but the guard
does not — every index launched from here repeats it for its first month, and the site's own promise is
*"dated per row, never blended, never estimated."* A one-line fix mirroring the box side (`inception` when
the anchor is missing, or `since launch` as the label) closes it permanently. Proposed, not actioned —
no git (R1).

## Still open, deliberately NOT re-filed (R6)

- **PF25 renders under the heading `BASEBALL — BOWMAN` on `/indices`** — filed 09-19 13:30, open.
  Still visible today in the same shape: `/pitch-black-index`'s own ticker strip carries PB26, CR26,
  AH26, PRIS25, DR25, BOW26, BCB26, MEGA26 and **no PF25 at all** — same root cause (PF25 shipped
  without page-side wiring), one more surface.
- **`/indices` intro still reads "Five of the seven live tickers…"** — `iw-2026-09-19-4`, Integrity
  Watch, open. Not mine.
- **"We built an index for every Pokémon set we track"** (Sep 18 post, now unpinned, 25→ views) — the
  standing coverage MED. TH26 and MEGA26 are tracked and have no index. Monday's note, as ruled.

## Also verified

- **Vendor handoff URLs live:** `og/x/board-latest.png` **200, 89,695 b** · `data/x-board.json`
  **200, 6,277 b**. JSON `asOf 2026-09-15`, generated 09-19 — that is the current board mark; the
  Tuesday lane re-marks 09-22. Honest stamp, nothing stale.
- **Price engine alive:** PB26 sealed strip shows `$199 · 29 verified asks · 09/20` — last night's ask
  mark ran.

---

## Nothing needs you

**Scoreboard.** Posts read **1 new** (Sunday 09:15, on time for the slot) · claims **PASS 11/11** ·
**vendor FAIL 0 open** · **MEDs open 5** (09:15 cadence — improving · the disappeared Sep 17 proof post ·
quote-what-a-reader-can-see · no-link-on-a-tracked-set · the "every Pokémon set" coverage line) ·
**inward findings 3 open, 1 new** (the 30D label; PF25 under BASEBALL; the "five of seven" prose) ·
**followers 2,433 (−1 d/d, flat vs baseline)** · vendor handoff URLs **live** · **inbound engagement 0**.

### For Monday's note (the CoS sends it — I do not)

1. **Keep:** the Pitch Black post is the template — one idea, plain English, our own image, link in the
   body, every number on the linked page.
2. **Drifted:** 09:15 instead of 09:00. Closing, but still 15 minutes.
3. **Changing on our site this week:** the **Monday Sep 21 re-mark** moves PB26 off 90.52 and off
   −3.2% w/w within a day of the post — screenshots stamped 09/14 go stale Monday; the **Tuesday Sep 22**
   board re-mark moves the board tape and `x-board.json`.
4. **Still false in its stock phrasing:** "an index for every Pokémon set we track" — TH26 and MEGA26 are
   tracked with no index.
5. **Tuesday Tape angle to tease:** the board's one-ladder ranking rule and Kim's sale drought.

**Boundaries held:** read-only on X throughout — nothing posted, replied, liked, reposted, followed,
pinned, unpinned, scheduled or deleted. The Grok Bot app was not opened and the vendor was not contacted.
No git beyond reading a fresh clone. No sign-in anywhere. Nothing committed.

**My own stumbles, declared:** one. The page's text extraction rendered the sealed strip as `$19929
verified asks`, which I was one step from filing as a broken figure — it is `$199 · 29 verified asks`,
and reading the actual DOM elements rather than the flattened text is what separated them. The grading
rule caught it; the flattened text nearly did not.
