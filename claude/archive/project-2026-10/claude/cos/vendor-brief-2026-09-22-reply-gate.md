# Vendor brief sent 2026-09-22 ~11:05 PT — the reply read moves before the post

**Sent by the Chief of Staff through the direct channel (the Grok Bot app on Mo's Mac), on Mo's
instruction.** R10 held throughout: the CoS directs, the vendor composes and posts, nothing on
this project wrote to X.

## Why

Monday's five replies were graded by **Mo**, on the live account, after they posted — and he
deleted all five: *"they reek of AI bot replies … I want engagement with our twitter account, not
'check out our site' type replies."* The X Desk Watch lane was working exactly as specified. The
specification was the problem: **every check in it grades what is already public.**

## What was sent, in substance

- Before any reply posts, the batch comes to the CoS first — the drafts, not a summary.
- One line back per reply: **post · change this · drop**.
- **Unanswered in two hours, the vendor posts anyway.** A gate that silences the account is worse
  than the replies it was built to catch.
- The CoS says what is wrong with a reply, never what to write instead. The voice has to become
  the vendor's, not ours.
- **It comes off after the first batch where every reply passes.**
- The mechanical rules (now in `tools/reply-voice-check.mjs`) and the judgment ones (react to what
  the person said · ask more than tell · the stranger test) were both stated.
- Two notes from today: B1′ posted at **10:24, 84 minutes late**, after two `resource_exhausted`
  retries — *"Marks as of Sep 15"* checks out against the live board page, so the claim stands,
  but a slipping timer belongs in the 5:30 line rather than being found by us.
- Mo's own bad/good pair was restated as the standard, because it is the whole spec.

## The other half — why the CoS was answering from stale facts

**There is no Sep 21 X Desk Watch filing because the run never fired.** Its cron was moved to
13:00 PT on Monday *afternoon*, after that day's 13:00 had passed, so the scheduler booked the
next occurrence for Tuesday. `last_run` = 2026-09-21T05:30Z (Sunday 22:30 PT), `next_run` =
2026-09-22T20:01Z, nothing between. **The lane did not fail; it was never asked.**

Two things hid it: the task was still **named** *"5:30pm PT"* while its cron said 13:00 (renamed),
and **nothing counted whether a lane that owed a filing produced one**. The cost was not a missing
document — it was the CoS answering Mo about the vendor's replies out of Sunday's filing,
confidently, two days stale, on the one day the vendor did something that mattered.

`tools/lane-heartbeat.mjs` + `claude/lanes/EXPECTED-FILINGS.json` now count it. First run, since
Sep 15: **7 filings due, 1 missing — Sep 21, X Desk Watch.** The CoS desk runs it every weekday
and names any silent lane by lane and date.

**A missing filing and a quiet week look identical until something counts.**
