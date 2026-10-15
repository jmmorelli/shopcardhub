# X Desk Watch — run 2026-09-22, 13:03 PT

HEAD `2d374ff` · origin/main `2d374ff` · delta 0 commits

Fresh HTTPS clone in `$HOME` scratch (never a connected folder, never Mo's clone). Read at STEP 0:
`/LANE-RULES.md` (R1, R2, R5, R6, R7, R8, R9, **R10**, R11, **R15**, **R16**, cadence table),
`claude/cos/x-desk-watch-2026-09-17.md` (spec, incl. the new §0 / §0.1), `claude/cos/STATE.md`,
`claude/cos/NEEDS-MO.md`, `claude/cos/vendor-brief-2026-09-22-reply-gate.md`, and the last filing
`claude/cos/x-desk-watch-run-2026-09-20-1730.md` (R6). **There is no Sep 21 filing — the run was
never asked** (R15, already diagnosed by the CoS; not re-opened here). This run therefore covers
**two days**: Mon Sep 21 and Tue Sep 22 to 13:03 PT.

**My prompt is the stale copy and I am saying so (R2 / precedence).** It says the run is 17:30 PT
and that "the LANE-RULES cadence table carries the same cadence." It does not. The table says
**every day 13:00** (Mo moved it 2026-09-21 so the 14:00 CoS desk acts on a vendor FAIL the same
hour) and states plainly: *"the 17:00 reply sweep is read the next day."* The table wins. I fired
at 13:03 and **did not see today's 17:00 sweep** — that is by design now, not a missed read.

**Surfaces read.** @shopcardhub profile + `/with_replies` + both post permalinks, Chrome deviceId
`477c0edf…` (selected by id; the display name is never trusted). Sign-in verified on the profile
header (*Edit profile* present). `/bowman-bangers` read **live, browser-rendered** at 13:0x PT.
`data/x-board.json` and `og/x/board-latest.png` fetched from production and the PNG **rendered and
read**, not inferred. No baked HTML or curl used to grade any claim. **Nothing could-not-read.**

**Followers: 2,433** — flat vs the Sep 18 baseline and flat vs the Sep 20 run. **No follower loss.**
Following **458 → 465 (+7 in two days)**, and it moved twice during this run. Not a finding; it is
the one account behaviour that changed while inbound engagement stayed at zero.

---

## Needs you — a struck graded figure is live on our feed, and it is our fault, not the vendor's

**The vendor's claims were PASS at post time. Both posts are now false, because our own page
corrected itself an hour after the second one went out.** That is the inward half of this lane's
job (spec §1: a claims defect on a page the vendor has posted about is a page fix **plus** a
correction the same hour). The page fix shipped. The correction to the feed did not, and cannot —
nothing on this project touches X.

### 1 · Holliday's $720 PSA 10, live in today's post image

**Posted 10:24 AM PT today**, image = the then-current board tape, row 02:

> `02 Ethan Holliday · $104 · PSA 10 $720.00 (1 dated sale, Aug 6 2026) · $165 · raw −1.9%`

**What is true on our site now** (`/bowman-bangers`, browser-rendered 13:0x PT, CORRECTION · SEP 22):
there is **no PSA 10 sale of that card on the tape at any date**. The Aug 6 sale is a **PSA 9 at
$155.00**; his five graded sales are all PSA 9 between $130.00 and $199.95. **The $720 was a
price-guide estimate** published as a sale for six weeks. His entry now reads *no verified sale*.

**Timing, which is the whole grade.** Post 10:24 PT · re-mark pushed `a520a87` **11:24 PT** — one
hour later. At post time the vendor pulled the live tape from the fixed URL and reported it exactly.
**Claims PASS. This is not a vendor FAIL.** It is a graded figure with no dated sale behind it
sitting in public on our account (check A, bullet 3), linked to the page that retracts it.

**Our handoff is already clean** — verified, not assumed: `data/x-board.json` live `asOf 2026-09-22`
with the strike in it; `og/x/board-latest.png` live at 92,344 b, md5 `1963a29c…`, identical to the
committed file, rendered and read: **"THE TUESDAY BOARD — SEP 22"**, Holliday *no verified sale*,
Fischer $650.00 (Sep 7), Florentino $492.00 (Aug 17), Kim *"$131.25 is a carried quote"*. The
vendor's next pull is correct. Only the 10:24 post is wrong.

### 2 · "Call = BUY/HOLD/SELL/PASS/WATCH" (Sep 21, 2:01 PM PT)

Same shape, lower stakes. The same Sep 22 correction says the **SELL** in those columns *"is the
engine's nightly ask-side signal, which is not our verdict and never has been."* Board calls are
**BUY / HOLD / PASS / WATCH**. At post time the Sep 17 and Sep 18 columns did say "Holliday is
still the Sell", so the vendor had on-site support — **PASS at post time**, false now.

### 3 · The structural finding: the vendor posts the Tuesday board before the Tuesday board re-marks

10:24 post · 11:24 re-mark. **Nobody ever told the vendor when the Tuesday tape flips.** Left alone
this recurs every Tuesday, and today it is what put a retracted $720 in front of readers. This is
the item actually worth fixing — it converts a one-off correction into a standing one.

---

## The checks

**A · Claims — PASS, 2 posts, every figure traced at post time.**

| Claim (Sep 22, 10:24) | On-site source, browser-rendered | |
|---|---|---|
| "Kim sits #5" | board rank now 5 | PASS |
| "under the 30-day sale rule (no recent printed sale)" | *"$131.25 is a carried quote, not a new print — last printed sale Aug 5"*; rule line published on the page | PASS |
| "The call is PASS — not the seat" | Kim SIGNAL **PASS**, Verdict: Pass | PASS |
| "Marks as of Sep 15" | true at 10:24; page re-marked 11:24 | PASS at post time |
| image = SEP 15 board tape | the live `board-latest.png` at post time | PASS at post time · **now superseded, see above** |

Sep 21, 2:01 PM: *"Seat = last printed sold (highest first) — no sale in 30 days can't outrank a
trading card"* traces exactly to the published rule. **PASS.** The `Call = …SELL…` line: PASS at
post time, false now.

**B · Taxonomy — PASS, and the week-one MED is closed.** Both posts lead with **"Auto board"**; the
tape header reads **"THE TUESDAY BOARD · 1ST BOWMAN CHROME AUTOS"**. The "1st Bowman chase board"
retail-category wording from the Sep 17 proof post has not reappeared. R8/R9 clean.

**C · Exposure — clean, absolute.** No COMC position, no competitor name, no grading-outcome
promise, no financial-advice framing, no invented scarcity. No eBay link in either post, so the
`customid=` / "eBay" label rule was not engaged.

**D · Fit — one new MED, one carried.**
- **NEW MED — Tuesday ordering.** Board post an hour ahead of the board re-mark (§ above).
- **Carried MED — the 09:00 slot.** Sep 17 09:39 · Sep 20 09:15 · Sep 21 14:01 · **Sep 22 10:24**
  (84 min late, two `resource_exhausted` retries, already named in today's brief). Four weekdays,
  four misses, and the drift is widening rather than closing. It stays MED this week; if next
  week's five posts miss again it escalates under the three-in-three rule.
- Good, and worth saying: one idea per post, plain English, our own image, link in the main post
  and it resolves. Sep 21 carried the **"Replacing an earlier post"** line — **directive 3 is
  satisfied and STATE's open watch item closes.**

**E · Replies — nothing live to grade, and that is consistent with the new gate.** `/with_replies`
newest item is **Sep 13**, unchanged for a seventh run. Monday's five were deleted by Mo. Today's
12:00 sweep has produced nothing public as of 13:03 — **one hour into the R16 gate's first live
test**, which is the expected shape, not a silent vendor. The 17:00 sweep is tomorrow's read.

**F · Funnel — not run, and not due.** Monday's weekly grade did not happen (R15, the run was never
asked). GA4 is not read today: spec §5 fixes the **first clean weekly read at Sep 24**, because key
events were dead Sep 4–16 and nothing from that window is quotable. Nothing averaged, nothing guessed.

**Engagement, since Mo is watching it.** Views by post: Sep 18 **98** and **85** · Sep 20 **51** ·
Sep 21 **27** · Sep 22 **19** (at 2h39m). One like across five posts, zero replies, zero reposts,
zero inbound. The voice change landed on Sep 18 and reach has fallen every post since.

---

## G · The five-line note for the vendor — the CoS sends it, I do not

1. **Keep:** "Auto board: seat ≠ call" is the right frame and the taxonomy is now clean — auto board,
   1st Bowman Chrome Autos, never "1st Bowman cards". Keep the "Replacing an earlier post" line.
2. **Drifted:** the 09:00 slot, four weekdays running — 09:39, 09:15, 14:01, 10:24. The retries are
   understood; a slipping timer belongs in your 5:30 line, not found by us.
3. **Changed on our site today, and it makes two live posts false:** Holliday's **$720 PSA 10 is
   struck** — it was never a sale, the Aug 6 sale is a PSA 9 at $155.00. Your 10:24 image carries it.
   And **SELL is the engine's ask-side signal, not one of our calls** — the calls are BUY/HOLD/PASS/WATCH.
4. **The rule that prevents the repeat:** the Tuesday tape at `og/x/board-latest.png` re-marks
   **Tuesday late morning**. Read `asOf` in `data/x-board.json` before posting the board; if it is
   not today's date on a Tuesday, wait for it. The correct Sep 22 tape is live now.
5. **Tuesday Tape angle to tease:** Fischer holds #1 on +4.2% while his tape has gone eight days
   dark — his own published two-run clock resolves on the Sep 29 read and could hand the seat back.

---

## Boundaries held

Read-only on X throughout — nothing posted, replied, liked, reposted, followed, quoted, scheduled,
pinned or deleted. The Grok Bot app was not opened and the vendor was not contacted. No git beyond
reading a fresh clone. No sign-in anywhere. Nothing committed.

**My own stumbles, declared:** one. I first read the tape image at low resolution and misread
Holliday's raw sold as $384; I zoomed and corrected it to $104 before grading anything on it.

## Scoreboard

Posts read **2 new** · claims **PASS at post time, 2/2** · **vendor FAIL 0 open** · **live-false
claims on the feed: 2, both ours** · MEDs **6 open (5 carried, unchanged and not re-filed per R6;
1 new)** · taxonomy MED from week one **closed** · followers **2,433 (flat d/d, flat vs baseline)**
· following **+7** · replies live **0** · vendor handoff URLs **live and correct** · inbound
engagement **0**.
