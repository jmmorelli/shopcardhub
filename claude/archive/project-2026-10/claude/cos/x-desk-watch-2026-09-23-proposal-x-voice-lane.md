# To the Chief of Staff: two proposals from X Desk Watch, backed by Mo (2026-09-23)

**From:** X Desk Watch (auditor lane). **For:** the CoS desk inbox. **Status:** awaiting CoS ruling.

**Mo, in chat on 2026-09-23, verbatim:**
> *"I wonder if we should focus on engaging in accounts that already have lots of replies rather than
> one offs... won't a lot more people see our reply that way? It needs to be super human like and cannot
> seem bot generated in our replies."*
> *"It would be nice to have a twitter specific sub-agent since it's a different animal than other parts
> of this project. Since it requires a 'voice' that is kind of different than our website, we should
> strongly advise the chief to consider this sub-agent, and refine him and his outputs as time goes on."*

Two asks follow. **Part 1** can go to the vendor in the next brief. **Part 2** needs a CoS ruling, and Mo asked
us to recommend it strongly.

---

## Part 1 · Reply targeting rule (for the vendor, through the direct channel)

**Our own Sep 22 numbers show big threads buried our replies.** Views as read live in Browser 1 on Sep 23 at 13:05 PT:

| Parent post (views) | Our reply views | Reply ÷ parent |
|---|---|---|
| Nuño Sempere (56K, 954 likes) | 18 | 0.03% |
| Mike @stackthesegains (670) | 10 | 1.5% |
| Brookens @DetroitTankCity (197) | 8 | 4% |
| Justin (104) | 54 | 52% |
| Cooper, reply-to-reply (26) | 57 | >100% |

Replies that got a reply back from the author got 5–10× the views of replies that didn't. That tells us
the conversation is what spreads a reply, not the size of the thread. n = 7, so treat this as
a direction and not a finding. The table below is how we firm it up.

**The rule to hand the vendor (direction, not copy, per §0.1):**
1. **Default target:** hobby accounts with roughly 1K–20K followers, a post under 60 min old, and fewer than 20 replies.
2. **Large accounts only if we can reply within ~15 min of the post** and the reply can stand on its own
   and earn likes. Otherwise skip. Reply #300 at hour three reaches nobody.
3. **Answer everyone who replies back to us, the same day.** Bots fire and leave. People stay in the thread.
4. **Volume cap: ~5 good replies a day, at irregular times.** Fast replies on every viral post is the
   reply-guy pattern that readers and X's spam systems both flag.
5. **§0.2 still outranks everything.** Read the post. Yesterday's second miss to Cooper (asking whether he was
   sending a card he had just said was already at the grader) was to the same person, a day after the first miss.

**What X Desk Watch will track from its next run:** each reply's views ÷ the parent post's views, whether the author
replied back, and new follows in the reply window. After two weeks we'll know whether target size or reply-back
matters more. Nothing extra to read, since it all comes from the `/with_replies` pass the lane already does.

---

## Part 2 · Recommendation: stand up an X voice lane on our side (Mo: "strongly advise")

**The problem.** X gets a different voice from everything else we write. Mo's §0 standard ("a collector
joining a conversation") is the opposite of the site's desk voice, and the lanes are mixing them up. Right now
the X voice is owned by nobody:
- the vendor composes it but doesn't read our docs,
- the CoS grades the §0.1 reply gate between everything else it runs (and graded the Brito reply "post", its best of the batch),
- X Desk Watch audits afterwards and by design doesn't grade prose.

Mo's deletions are the only real voice feedback so far, and they reach us after the fact.

**The proposal: an "X Voice" lane (working name), with a narrow job:**

| Owns | Does not |
|---|---|
| A living **voice file**: Mo's approved/deleted pairs as the reference set, grown every week from what he keeps, deletes or praises | Post, reply, like, follow or delete on X. **R10 is unchanged.** The vendor still posts. |
| The **§0.1 pre-post reply gate**, taken off the CoS's plate: `reply-voice-check.mjs` + stranger test + read-the-post (§0.2), one line per reply | Contact the vendor. Its notes go to the CoS, who sends them, as now. |
| The **targeting rule** (Part 1) and its monthly revision from the reply-view data | Grade its own work. **X Desk Watch stays the independent auditor.** A coach can't also be the referee. |
| The **Tuesday Tape tease** and the weekly angle line in the vendor note | Touch site copy. The site voice stays with the site lanes. |

**Named number it moves (the new-lane rule):** reply-back rate (share of our replies that get a reply
from the author) as the lead, with follower net and reply view share as the second and third.
Baseline from Sep 22: **2 of 7 got a reply back (29%)**, followers 2,435.

**Cost, given the Sep 21 cadence cut.** It should not add a fire. The reply gate already runs inside CoS
time, so move it there instead of adding one. The weekly refinement fits into the Monday vendor note the CoS already
sends. If the CoS rules it needs its own slot, one weekday fire at most.

**How it improves over time, as Mo asked.** Every Monday: add the week's kept/deleted replies to the voice
file, drop any rule that made no difference to reply-back rate, and write one line on what changed. Review
at 30 days (Oct 23) against the baseline: keep, change or retire, the same as R14 would treat any lane.

**The ask:** rule adopt / adapt / decline, and if adopted, name it and give it the voice file and the gate.
Mo has already said he wants it.
