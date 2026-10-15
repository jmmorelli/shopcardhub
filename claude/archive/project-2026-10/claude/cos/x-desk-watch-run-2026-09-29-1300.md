# X Desk Watch — run 2026-09-29 (Tue), fired 13:04 PT

HEAD `072ab06` · origin/main `072ab06` · delta 0 (fresh HTTPS clone, `$HOME` scratch).

STEP 0: LANE-RULES R8/R9/R10 + Sep 20 amendment + Amendment 2, spec, STATE (NOW Sep 29 block), NEEDS-MO, yesterday's filing, `x-voice.md` (Sep 29 arrangement), `x-batch-2026-09-28`, `x-daily-2026-09-29`. **Prompt stale (file wins):** it still describes the Grok vendor, auto-replies and a 17:30 run. LANE-RULES: vendor off since Sep 25, the CoS queues, Mo replies, and this lane runs daily at 13:00.
**Rule gap (inward, P3):** Amendment 2 says "no lane … likes". Mo delegated likes to the CoS in chat on Sep 29 (`x-voice.md` "Likes"). Mo in chat outranks the file, so the 6 likes logged at 10:20 are in policy, but LANE-RULES needs the line.

**Surfaces.** Chrome `477c0edf…` (Browser 1) selected by id, signed in as @shopcardhub. Read: profile, `/with_replies`, two status pages, live `/data/indices.json`, `/pitch-black-index` meta, and `/bowman-football` rendered. **Scheduler not read:** the permission gate refused Drafts → Scheduled again, and I didn't retry. The queue pre-read below is graded from the approved text in `x-daily-2026-09-29` / `x-batch-2026-09-28`, plus the 10:07 session's verified list.

**Followers: 2,441** (+1 vs Sep 28).

## Live since last run: 4 posts, plus 1 reply from Mo

| Post | Views | Grade |
|---|---|---|
| Mon 6:30 pm Monday close + levels image | 31 | **PASS.** All 5 levels match. PRIS25 −4.52%, DR25 −8.43%, CR26 −8.47%. Every Pokémon index is down on the week, TH26/SV151/PF25 included. Image note below. |
| Tue 9:00 am Darkrai supersede | 14 | **Text PASS** ($184.01 Sep 28, prev $192.89 Sep 21, PB26 82.75 all match the live basket). **Link card FAIL (A):** see below. |
| Tue 10:30 am McDonald's (PokeBeach) | 27 | PASS. The news is attributed and "nothing official" is stated. No card figures. |
| Tue 12:30 pm Bowman trio first re-mark | 9 | **PASS.** BOW26 98.58, BB26 99.14, BCB26 97.15 (Sep 25→28), and the names match `indices.json`. R9 is clean: it says "1st Bowman Chrome Auto" in full. |
| Tue 8:52 am reply to @CoachMunch_ "I did not know that. That's cool!" | — | Mo's own reply (Rule 0). Not graded. |

## FAIL (A) — the Darkrai correction post carries a stale Pitch Black number in its own card
The 9:00 am post says **PB26 82.75**. X attached a link card for `/pitch-black-index` anyway, even though the batch removed it at compose (the URL in the text brought it back). That card is X's cached copy of `og/indices.png` from before the Sep 28 `?v=` stamp. It reads **PB26 84.72 · CR26 93.17 · AH26 93.88 · PRIS25 98.04 · DR25 95.75**, which are the Sep 21 levels. So a post written to correct a stale figure shows a stale figure under it.
- **Our site is right.** The live `/pitch-black-index` og/twitter:image = `og/indices.png?v=20260928`. The fault is X's cache from the Sep 28 afternoon scrape. No page fix is needed.
- **Don't delete it** (supersede rule; 14 views). Optional reply for Mo (replies are his): *"The preview card here is X's cached copy from Sep 21. Pitch Black closed Monday at 82.75, as the post says."*
- **Lesson for the CoS scheduler:** removing a link card in the composer does not stick when the URL stays in the text. To keep a stale card off a post, either leave the URL out, or check the card on the posted status and not only in the composer. A cache-busted URL (`?r=MMDD`) forces a fresh scrape, so use that when a link is needed.

## Inward P3 — levels image "w/w" is points, the post text is percent
The levels image shows **−1.97 / −7.89 / −5.43 / −4.43 / −8.07 w/w**. Those are point changes (84.72→82.75 = −1.97 pts). The post text gives percent (−8.5% CR26 vs "−7.89" in the image). Both are right, but with no unit on the image they read like a contradiction. Fix: `make.py levels` should label the column "pts" or print percent.

## Queue pre-read (text as approved; scheduler not opened)
- **2:30 pm Classic indices:** PASS. ND02 #107 Shining Charizard $1,619 and BS99 #4 Charizard $380, both asOf Sep 28, sold basis. Base 100 at 09/28/26. Thu Oct 1 re-mark. The session confirmed the `/indices` card shows Sep 28 marks.
- **4:00 pm Wild Card:** no site claims. Sports facts are MLB.com-sourced in the fact trail. It is time-bound: it has to go out before 5 PT.
- **6:30 pm auction-button supersede:** carried PASS (5 Bid rows verified Sep 28).
- **Wed 9:00 am Bowman Football:** PASS as a dated ask ("$399.99 on Monday, 49 live", labelled an ask). Watch item: the page's own table shows a **$399.99 median from Sep 19** and the live strip now reads "ask from $402.94, 49 live". The Monday figure is right but can't be checked on the site any more, and it collides with the Sep 19 median. Keep the "on Monday" date.

## A · B · C · D · E
A: 4/4 texts PASS, 1 image FAIL (cached card). B: clean. C: clean (no COMC, no competitors, no grading promises, no bare eBay links). D: the day's one link is on the 2:30 post, per the Sep 29 arrangement. The spec's "link in every main post" is stale against `x-voice.md`, so no new MED. E: no CoS replies (Mo's only).

## MEDs open (carried)
Sep 25 bid-column "every row" (superseded 6:30 pm tonight → closes if it posts) · Sep 26 Mendoza/product attribution · 2 weekend posts with no link (the rule has since changed). Cadence MED from Sep 28 → **closed** (7 posts queued or live Mon–Wed).

## Boundaries held
Nothing posted, edited, liked, followed or deleted. Grok app not opened. The scheduler read was refused and not retried. No git beyond the clone. Nothing committed.
**Stumble (mine):** at the start of the run I fired one push notification by mistake, with the body "placeholder". It carried no content, and the real one follows.

## NEEDS-MO block (for the CoS)
> **Your 9:00 am Darkrai post shows the old Pitch Black card (84.72) under the corrected 82.75.** That's X's cached preview, not our site. Nothing to delete. Optional reply: "The preview card here is X's cached copy from Sep 21. Pitch Black closed Monday at 82.75, as the post says."

**Scoreboard:** posts read **4 live + 4 queued (text)** · claims **PASS 4/4 text, 1 image FAIL** · MEDs open **3** · followers **2,441 (+1)**.
