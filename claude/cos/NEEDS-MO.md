# Mo, these are the only things waiting on you

Everything else is decided and running. An item is on this list only if it physically cannot be done
without you — a sign-in, money, a credential, a human account, or a switch in an app only you can
reach. If something here no longer needs you, say so and it comes off.

*(Housekeeping for the agents, not for Mo: this file lives in the repo beside `STATE.md`; that copy
is canonical and the Project copy is a mirror written in the same run. Standing grants — Sep 4 "anything
that needs Mo, I approve"; Sep 8 "I don't want to sign into anything"; Sep 16 "I'd prefer you guys just
talk to each other so I don't have to be involved" and "I agree with all your vetos".)*

---

## Open — 3 real items, and one thing to know. ONE IS A DO-NOT, one needs ten minutes of your browser, one is two switches in the desktop app.

- **🔌 TURN OFF THE TWO X POSTING TASKS IN THE CLAUDE DESKTOP APP — only you can.** Their prompts
  live in the desktop app and the scheduled-task API cannot reach them, so the CoS closed the write
  path in doctrine instead (`/LANE-RULES.md` R10, read at STEP 0 by every lane): if either fires, it
  now refuses the tweet step and reports the prompt as stale. That holds, but it is a seatbelt, not
  a locked door. **Disable `shopcardhub-tweet-reply-paster` outright, and delete the board-tweet
  queue step from `bowman-bangers-tuesday-update`** (keep the rest of that task — the re-mark, the
  digest, and from Sep 22 the board-tape publish, are still ours). Two minutes, and then there is
  genuinely no path from this project to your X account.

- **👀 NOTHING TO RELAY TO GROK ANY MORE — but read this once.** Mo opened a direct channel on
  2026-09-17 (the Grok Bot app on his Mac) and made the CoS its boss, so direction and corrections
  now go straight from the CoS to the vendor and nothing queues behind Mo. **The first brief was
  sent the same day** — its proof post's numbers all checked out, but "1st Bowman chase board" is
  the retail non-auto category (the board is nine 1st Bowman Chrome Autos), and the board's ranking
  rule changed Sep 17, so any "Holliday is our #1" phrasing it carried is now false. **What is still
  only Mo's:** the X account itself. Nothing on this project touches it — the CoS directs the vendor,
  the vendor composes and posts, and Mo's veto over anything live is absolute and retroactive.


- **⚠ THE ONE THING ONLY YOU CAN UNBLOCK: your PriceCharting login.** The SV151 rebuild is stuck on
  one step and it is not a decision, it is an authenticated session. The 207-slot universe is
  rebuilt and in the repo; the liquidity screen needs each card's **completed-auction rows**, and
  those are not served to anyone who is not signed in to your Legendary sub. **The same wall blocks
  the P0 SportsCardsPro graded sales-table pull — the thing that would let the board publish graded
  figures again at all.** One session unblocks both. Next time you are at the machine with Chrome
  open, say so and the CoS will drive it from there; nothing needs typing from you beyond being
  logged in. Spec: `claude/cos/sv151-rebuild-spec-2026-09-17.md`.

- **⚠ DO NOT POST THE 151 LINK POST.** `claude/recaps/link-post-sv151-2026-09-17.md` was drafted
  at 05:55 on 2026-09-17 and marked *"Fine to post any time this week."* **Hold it.** It is a
  disclosed-builder r/PokemonTCG post whose hook is a prediction we got wrong, published *with the
  receipt attached* — and the receipt does not exist. Its notes say *"Every number is on the live
  page … If someone checks, it matches."* It does not: `shopcardhub.com/indices` returns 200 and
  contains the string "151" zero times, and six candidate 151 URLs all 404. **The post is good and
  the hook is right; the link is wrong.** It unblocks the day the rebuilt index is live.

- **✅ 151 PATH A IS CLOSED — nothing further for you on it.** *(2026-09-17, desktop-linked session,
  Mo present.)* We got into `~/Projects/shopcardhub` and ran the check. **The Sep 15 SV151 work is
  not there and never was.** `tools/build-sv151.mjs`, `scarlet-violet-151-index.html` and an
  `SV151` key in `data/indices.json` are absent from your clone *and* from a clone of origin taken
  the same minute (R7 satisfied). Your clone was also three days stale (`edb8b15` vs origin
  `9e2d2b2`), so that session was never on this machine — it died with its sandbox. **Decision,
  CoS-owned, no input needed: Path B.** Rebuild from
  `claude/cos/sector-index-rulebook-2026-09-15.md`; **Sep 15 is not a valid inception date**
  (forward-start, no backfill), so inception is the day the rebuilt index first marks. STATE is
  corrected and its Sep 15 SV151 figures are now labelled unverified.

- **Off-site link-earning posts.** Mo posted one to **Reddit → the Pitch Black page** (~Sep 14).
  One draft remains ready to paste: `claude/recaps/link-post-2026-09-14.md` (r/baseballcards, the
  ask-vs-hammer data). Needs a human account because Reddit and the hobby forums ban bot posting.
  **Action: paste it when convenient — no schedule.** *And send the CoS the URL of the post you
  already made,* so the next Chrome-linked run can confirm the link's `rel` and read GA4 referral
  sessions. **Honest framing, corrected 2026-09-16:** Reddit nofollows outbound links, so the post
  does not pass link equity directly. It works by putting the page in front of people who run
  linkable sites, by referral traffic, and by getting the URL crawled. It is still the best Google
  lever we have — the Search Console request quota is stood down to zero — but it is a hypothesis
  with one trial, not a proven channel.

- **Personal (per-subscriber) email alerts — parked, not due.** Vaults are device-local and
  encrypted, so by design we cannot email someone about *their* cards. A real personal alert list
  means storing card IDs + a target + an email address — PII in a new store, which is a separate
  decision from the Signal Alert approved Sep 15. Same unblock trigger as the contributor program:
  **returning users ≥ 20% for 4 straight weeks.** *No action needed now; it will come back to you
  when the trigger fires.*

## Not blockers, listed so nobody re-raises them

- **MailerLite is signed in**, on the Chrome profile **"jmichaelmorelli"** — the earlier "signed
  out" read was the wrong profile. Nothing needed from Mo.
- **The `auto` deploy key is the only push credential.** The classic PAT was revoked Sep 16 with
  Mo present. **Never ask Mo for a new token.**
- **Clone hygiene is CoS-owned**, per Mo Sep 15 ("it's not my job"). The four call re-grades that
  existed only in his local clone are backed up outside the git tree at
  `Card Hub/ledger-backups/2026-09-15/`.

## Closed 2026-09-16 (late) — all four of Mo's remaining technical questions

- **Hammer tape on Home — RULED: no chart.** 92 closes across 34 cards, median 1.5 per card. Home
  gets a two-number stat tile (Pokémon/sealed **+20%** · baseball singles **+110%**, medians, with
  n and date); card pages get hammer prints as dated event markers on the existing ask line. The
  pooled mean is never published — skew z = +7.1. Full working in `STATE.md`.
- **`luis-hernandez-bcb26-auto` — RULED, no methodology decision needed.** It has **one** auction
  close, $147.49. n = 1 is not a mark. It stays unpriced and out of the BCB26 basket; its page
  shows "1 auction close, $147.49". General rule adopted: a hammer-basis mark needs ≥ 5 closes in
  60 days, is labelled on its face, and never enters an ask-basis index level.
- **SV151 — MO VOTES CLEAN MEDIANS.** Correction: it *is* live (Sep 15, one mark deep). Executes as
  a **logged divisor adjustment, level unchanged**, at the **Oct 5 quarterly reconstitution,
  announced Sep 28** — the rulebook pre-committed to exactly this before the first mark. The other
  Pokémon indices move the same day if the clean-median compute lands; otherwise each page states
  its own basis rather than implying a match we did not compute.
- **BCB26 — MO RULED KEEP** (Sep 16). The home/index contradiction and the "(pre)" chips are fixed
  and gated.
- **The graded price rows — MO RULED strip and re-mark** (Sep 16). Applied and live. The follow-up
  pull of SportsCardsPro's *sales tables* is P0 and CoS-owned, not Mo's.
- **All open vetoes agreed** (Sep 16): SA benchmark ruling, discovery re-weighting, site-auditor
  probation, return-user program, Terminal step 5.
- **Fischer verdict — RULED "engine wins"** (Sep 15). Execution queued with the Content Editor.
- **SV151 price basis, Vault zero-knowledge sync, the triggered Signal Alert email, the COMC
  pullback** — all ruled Sep 15–16 and in `STATE.md`.

## Lane discipline — logged 2026-09-17

The 05:55 session wrote its SV151 findings into the claude.ai Project copy of this file **only**.
The repo copy — the canonical one under LANE-RULES — still read "2 items, neither urgent" when the
desktop session opened it at 13:00 PT, so the held post and the parked Path A check existed in one
copy and not the other for seven hours. **Both copies are written in the same run or neither is.**
