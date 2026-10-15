# X Desk Watch — run 2026-09-19 (Saturday), 17:30 PT slot (read 17:32–17:48 PT)

HEAD `663fe85` · origin/main `663fe85` · delta 0 commits

Fresh HTTPS clone in `$HOME` scratch (never a connected folder, never Mo's clone). Read at STEP 0:
`/LANE-RULES.md` (R1, R2, R5, R6, R7, R8, R9, **R10**, R11), `claude/cos/x-desk-watch-2026-09-17.md`
(spec), `claude/cos/STATE.md`, `claude/cos/NEEDS-MO.md`, and this afternoon's own
`claude/cos/x-desk-watch-run-2026-09-19-1330.md` (Project doc) for R6.

**Spec stale, fourth filing on the same line — do not re-file a fifth time.** §3 says *"Run daily at
13:00 PT."* LANE-RULES' cadence table and the task prompt say **13:30 + 17:30**. The table wins.
This belongs in a spec edit pass, not in another run report.

**Surfaces read.** @shopcardhub profile + `/with_replies`, Chrome deviceId `477c0edf…` (selected by
id; **displayed "Browser 1" this session** — the per-session name swap noted Sep 18 means the name is
never trusted). Sign-in verified on the profile header (*Edit profile* present). `/indices` verified
**live, browser-rendered** at 17:44 PT; the two vendor handoff URLs by HTTP status. No baked HTML and
no curl used to grade any claim. **Nothing could-not-read.**

**Followers: 2,434** — flat vs the 13:30 run, **+1 vs the Sep 18 baseline (2,433)**. Following **458**.
**No follower loss.**

---

## Cadence: correct. Zero vendor activity is the right Saturday.

The charter owns **weekday 09:00 + Sunday 09:00** posts and **weekday** 12:00/17:00 reply sweeps.
Saturday is not a posting or sweep day, so **0 new posts and 0 sweeps is compliance, not a miss.**
Newest feed item is still Mo's own 6:31 PM Sep 18 post (**73 views**, up from 69 at 13:30).

**E · Replies: nothing to grade, and I corrected my own earlier line.** `/with_replies` newest item is
still **Sep 13**, unchanged for four runs. The Sep 13 "Star a card" post shows a reply count of **1** —
I checked it rather than reporting it as inbound: it is the account's **own thread continuation** (the
Sep 13 Vault link card, 15 views, thread connector visible). **Inbound engagement across the account
remains zero.** Previous runs' blanket "0 replies everywhere" was loose; the count is 1 and it is ours.

---

## The change this run: **the pinned post is gone, and the post itself still exists**

At 13:55 PT the profile opened on the vendor's Sep 18 1:11 PM index post, pinned. At 17:32 PT there is
**no pinned post on the profile** — the Posts tab opens on Mo's 23-hour-old post, and the Sep 18 index
post now sits in ordinary chronological position at **53 views** (up from 49).

**It was unpinned, not deleted.** That distinction is the one R10 cares about: deletion is Mo's hand
only, and nothing came down.

**Authorship of the unpin is unknown and I did not try to establish it.** The vendor holds a browser
write path and Mo owns the account. I did not ask X and I did not ask anyone.

### Consequence for the 13:30 FAIL — **the escalation's own stated basis is gone**

This afternoon's run escalated *"We built an index for every Pokémon set we track"* from MED to FAIL on
two grounds: the spec's coverage-claim rule, and **the pin** — "it stopped being one post in a scrolling
feed and became the account's permanent front page." The second ground no longer holds.

**My read for the CoS, and it is a recommendation, not a ruling:** the claim is still inaccurate and
still belongs in Monday's note (it is one of the standing MEDs), but with the pin removed the
same-hour correction is no longer warranted. **Revert it to MED.** If the CoS already sent the drafted
brief, nothing is wasted — the remedy it asked for is what happened. If it has not been sent, the
unpin has overtaken it and the coverage line can ride in Monday's note instead.

I am not re-opening a ruling (R6) and I am not re-filing the finding. This is one lane's finding
changing shape within the same day, said once.

---

## Still open, verified live, and deliberately NOT re-filed (R6)

- **PF25 (a Pokémon index) still renders under the heading `BASEBALL — BOWMAN` on `/indices`.**
  Reproduced live in a browser at 17:44 PT; confirmed unfixed in the tree at `663fe85` —
  `META.pokemon.tickers` still holds only PB26, CR26, AH26, PRIS25, DR25, and line 638's
  `? 'pokemon' : 'baseball'` fallback still silently sorts anything unknown into baseball. Filed in
  full at 13:30; **open, awaiting the CoS.** One line here so the CoS knows it survived the day's push.
- **`/indices` intro still reads "Five of the seven live tickers…" on a page rendering eight live
  tickers** — `iw-2026-09-19-4`, Integrity Watch, open. Not mine, not re-filed.

Both are the same root cause (PF25 shipped without its page-side wiring) and should be fixed in one pass.

## Also verified

- **Vendor handoff URLs live:** `og/x/board-latest.png` **200, 89,695 b** · `data/x-board.json`
  **200, 6,277 b** (17:41 PT, following the www redirect). Unchanged since this morning's `3aeef18`.
- **A · Claims:** no new post, so nothing new to trace. Nothing regraded.
- **B · Taxonomy:** clean. No Bowman claim in anything new.
- **C · Exposure:** clean. No COMC position, no competitor name, no grading-outcome promise, no
  financial-advice framing, no invented scarcity, no eBay link in any vendor post this window.

---

## Nothing needs you

**Scoreboard.** Posts read **0 new** (Saturday is not a posting day — correct) · claims **PASS**
(nothing new to trace) · **1 profile change: the pinned post was unpinned; the post still exists** ·
**vendor FAIL 0 open** (this afternoon's coverage FAIL recommended back to MED — the pin that
escalated it is gone) · **MEDs open 5** (09:39 cadence · the disappeared Sep 17 proof post ·
quote-what-a-reader-can-see · no-link-on-a-tracked-set · the "every Pokémon set" coverage line) ·
**inward findings 2 open, 0 new** (PF25 under BASEBALL; the "five of seven" count prose) ·
**followers 2,434, flat** · vendor handoff URLs **live** · **inbound engagement 0**.

**Next live surface to grade:** the vendor owes a **Sunday 09:00 PT post** — first Sunday under the
new plain-English voice brief. Tomorrow's 13:30 run reads it.

**Boundaries held:** read-only on X throughout — nothing posted, replied, liked, reposted, followed,
pinned, unpinned, scheduled or deleted. The Grok Bot app was not opened and the vendor was not
contacted. No git beyond reading a fresh clone. No sign-in anywhere. Nothing committed.

**My own stumbles, declared:** none this run — the reply count was resolved by scrolling the existing
`/with_replies` view rather than opening the post, so no navigation inside the feed was needed.
