# Mo, these are the only things waiting on you

Everything else is decided and running. An item is on this list only if it physically cannot be done
without you — a sign-in, money, a credential, a human account, or a switch in an app only you can
reach. If something here no longer needs you, say so and it comes off.

*(Housekeeping for the agents, not for Mo: this file lives in the repo beside `STATE.md`; that copy
is canonical and the Project copy is a mirror written in the same run. Standing grants — Sep 4 "anything
that needs Mo, I approve"; Sep 8 "I don't want to sign into anything"; Sep 16 "I'd prefer you guys just
talk to each other so I don't have to be involved" and "I agree with all your vetos".)*

---

## Open — nothing. All three of today's items closed by 11:30 PT.

**Closed today with your three yeses:** the Chrome choice (Browser 2 for GA4, done); the GA4 service
account (built keyless — no secret, nothing for you to paste — first nightly run verified at 11:00 PT;
every cloud lane now reads analytics without a browser); the `/track-record` correction (live, five
rows, projections untouched); and the EPN read once you signed in (Sep 4–17: $37.98 on 94 clicks,
95% attributed, one $860 sale off the Messi page — `gap-analysis-2026-09-18.md` §6).

Two do-nots (the 151 post and the r/baseballcards draft) and one parked item stay listed below so
nobody re-raises them.

- **✅ DONE — the queued X post was approved, and Mo set the vendor to ALWAYS APPROVE (2026-09-17).**
  Recorded because it changes the risk model: there is no longer a human gate in front of an
  @shopcardhub post. The CoS still never touches the account, so **X Desk Watch is now the only
  check on the feed, and it is after the fact** — daily 13:00 PT, claims/taxonomy/exposure, with a
  same-hour correction routed to the vendor through the direct channel. Mo's veto stays absolute and
  retroactive. *(Superseded item, kept for the record:)* APPROVE THE PENDING X POST IN THE GROK BOT APP. The CoS briefed the vendor on the
  rule-change piece (board ranks on the last printed sale + a 30-day liquidity gate; it cost
  Holliday the #1 seat he had held since Jun 12); the vendor verified the page and queued it, and
  its own approval gate is now waiting on a human. **The CoS does not press that button** — it
  directs the vendor and never touches the X account, and pressing the post button is the same act
  by another route. One human between this project and anything public is the guardrail.

- **✅ CLOSED — the two X posting tasks are deleted** (Mo, 2026-09-17: *"I deleted them, because if
  I need to remake them we can start fresh."*). With R10 in doctrine and the tasks gone, there is now
  no path of any kind from this project to the X account.


- **👀 NOTHING TO RELAY TO GROK ANY MORE — but read this once.** Mo opened a direct channel on
  2026-09-17 (the Grok Bot app on his Mac) and made the CoS its boss, so direction and corrections
  now go straight from the CoS to the vendor and nothing queues behind Mo. **The first brief was
  sent the same day** — its proof post's numbers all checked out, but "1st Bowman chase board" is
  the retail non-auto category (the board is nine 1st Bowman Chrome Autos), and the board's ranking
  rule changed Sep 17, so any "Holliday is our #1" phrasing it carried is now false. **What is still
  only Mo's:** the X account itself. Nothing on this project touches it — the CoS directs the vendor,
  the vendor composes and posts, and Mo's veto over anything live is absolute and retroactive.


- **✅ CLOSED — you do NOT need to log in to PriceCharting, and you were right that you never paid
  them.** You asked why we couldn't get in; we tested instead of repeating the claim. The completed
  sale rows are in the page HTML with no cookies at all — plain `curl` from the cloud returns 347 of
  them. The old item was a misdiagnosis: a Cloudflare block on *SportsCardsPro* was read as a login
  wall on *PriceCharting*. **The SV151 screen is already run: all 207 cards, 207 pass, basket
  $1,905.79 — matching this morning's independent pull to the cent.** What is left is a build, not
  a decision. The SportsCardsPro graded pull is the separate one and it needs a browser, not a
  login — it runs in your laptop window, and still costs nothing.

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

- **⛔ DO NOT POST THE r/baseballcards DRAFT EITHER — pulled 2026-09-17, and this one is on the CoS.**
  `claude/recaps/link-post-2026-09-14.md` was sitting in your queue saying *"Aiva Arquette — seven
  auctions closed, median $36"*, *"Edward Florentino — twelve closed, median $40"*, *"Ethan Holliday
  — six closed, median $65"*. **Those are not closes.** They are the last bid the engine saw, a
  median of ~12 hours before the auction actually ended — the Sep 16 retraction, which withdrew this
  exact finding and pulled this exact post. A later session re-drafted it on Sep 17 anyway and it
  landed back on your list. **Its own receipt link disproves it:** `/auctions` now reads *"These are
  a floor, not sale prices."* The independent check points the same way — SportsCardsPro holds seven
  dated sold records for Arquette's `#CPA-AA` at **$55.00–$80.85** against our book's $32–$57. Had
  you pasted it, we would have published under our own domain a number we had already retracted.
  **Standing rule: no lane publishes an ask-vs-sold gap figure anywhere until close-time capture is
  fixed.** *(Mo also asked whether r/baseballcards would even know the word "hammer" — a fair
  separate point, and no: the plain phrasing is "what it actually sold for". Moot while the number
  is wrong.)*

  **What replaces it, when we want a link post:** the board's published ranking-rule change, or the
  151 index once it is live. Both are things we can stand behind line by line.

- **✅ CLOSED — you sent the URL, and the answer is that it sent nobody.** It was a one-line
  **comment** (not a post) in r/pokemoncards on someone else's thread, at **1 point** in a
  113-comment thread, with a bare link to `/pitch-black-index`. GA4 Sep 1–17, source/medium filtered
  `reddit`: **no rows at all.** The whole Referral channel is 2 sessions in 17 days. **Nothing for
  you to do** — the lesson is the CoS's: we had been calling this "the primary Google play" on the
  strength of a trial that was never really run. Recorded in `STATE.md`; no plan may assume off-site
  links work until a real submission has been made and measured.

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
- **SV151 — MO VOTES CLEAN MEDIANS.** *(Amended 2026-09-17: the "it is live" correction below was itself wrong — SV151 never reached `main` and is NOT live. The vote stands and now applies at inception: constitute the rebuilt index ON clean medians, which removes the restatement entirely.)* Originally recorded as: it *is* live (Sep 15, one mark deep), executing as
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
