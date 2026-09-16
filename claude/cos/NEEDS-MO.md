# Needs Mo — open queue

**IN THE REPO since 2026-09-16, beside `STATE.md`, for the same reason: a lane that cannot open the
queue cannot check whether an item is already Mo's.** Canonical here; the CoS mirrors it into the
claude.ai Project doc in the same run. No other lane writes either copy.

Only things that physically require Mo stay listed — a sign-in, money, a credential, a human
account. Everything else is `awaiting-cos` and gets decided, not parked (LANE-RULES R1).

Standing grants: *Sep 4* — "anything that needs Mo, I approve." *Sep 8* — "I don't want to sign
into anything, I want the CoS to do it." *Sep 16* — "I'd prefer you guys just talk to each other
about this so I don't have to be involved," and "I agree with all your vetos, I won't say no to
them."

---

## Open — 2 items, neither urgent

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
