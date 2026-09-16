# LANE RULES — read this first, before your prompt

**Created 2026-09-16 by the Chief of Staff, on Mo's instruction, to end a recurring failure:
doctrine kept living inside scheduled-task prompts, prompts are editable only in one window a
week, and lanes acted on stale copies. This file is in git. It changes the day a rule changes.**

## Precedence

1. **Mo, in chat, now.**
2. **This file.** Where it conflicts with your task prompt, THIS FILE WINS and the prompt is the
   stale copy. Say so in your run summary so the prompt gets fixed.
3. `claude/cos/CHARTER.md` and **`claude/cos/STATE.md` — both in the repo** — standing doctrine
   and current state. *(STATE.md was committed into the repo on 2026-09-16. Until that evening it
   existed only as a claude.ai Project doc, which meant R4 below — 'read STATE.md before
   recommending channel work' — required lanes to read a file they could not open. That was the
   CoS's error, not the lanes'. The repo copy is now canonical; the CoS mirrors it into the
   Project doc in the same run, and nobody else writes either copy.)*
4. Your task prompt — the job, the cadence, the mechanics.

Read this file at STEP 0 of every run, from a **fresh clone**, and say in your filing that you
read it.

---

## R1 · Repo boundary (Mo, 2026-09-16)

**No investigating or filing lane touches git.** Not the repo, not Mo's working clone at
`~/Projects/shopcardhub`, not `.git` anything — no sync, fast-forward, reset, `checkout .`, lock
sweep, remote change, commit or push. Find it, file it, stop.

**The Chief of Staff is the end result on whether a finding is valid.** A filed finding is an
input, not a decision and not a work order. No lane acts on its own finding, and no lane acts on
another lane's.

**Publishing lanes are unchanged.** The Monday price lane and the Tuesday board lane keep their
push authority, from a fresh clone, behind the three gates. The hole being closed is
investigation acting on itself — not autonomy.

If you believe a repo or clone needs work *right now*: file it, say plainly that it is
time-sensitive and why, and stop. The CoS reads filings every checkpoint.

*Origin: a lane found that Mo's clone held the only copy of four call re-grades — a correct,
well-filed finding — then moved on to pre-flight a sync of that clone, calling it "provably
lossless" on a hand-picked 7-file spot check against a 42-file diff. Nothing was lost. The
finding was worth having; the remedy was not the filer's to run.*

## R2 · Staleness gate (STEP 0, every board-touching lane)

**Never start work on a mounted or reused clone.** At STEP 0:

```
git fetch auto main && git log --oneline HEAD..auto/main
```

If that prints anything, you are stale. **Default to a fresh clone in scratch** (`$HOME`
scratch or `/tmp`, never inside a connected folder) and work there. Mo's mounted clone never
advances on its own, because the lanes push from scratch clones — so it is stale by
construction, not by accident.

*Origin: a lane started on a 3-commit-stale mount, re-activated a set index from scratch on
stale inputs, caught it against the true HEAD before pushing, and lost its 2:00 PM publish slot
to the recovery. Nothing wrong reached the site. Applies to the Tuesday board lane, the Friday
release-window lane and the Monday scan — none of their prompts carried this.*

**AMENDED 2026-09-16 (evening) — this is now a refusal, not a preference, and it binds filing
lanes too.** Every lane prints a freshness header as the FIRST LINE of its report:

```
HEAD <sha> · origin/main <sha> · delta <n> commits · gate WARN <prices>/<site>/<terminal> vs baseline <b>
```

**A lane that is behind origin/main does not file.** It re-clones and re-runs, or it files one
line saying it could not get a fresh tree and stops. A report with no freshness header is not
read. The WARN-vs-baseline delta is the second tripwire and is free: the site auditor's own
2026-09-16 report showed `WARN 32/3/1` against a stated baseline of `29/3/1`, and that `+3` was
exactly three false positives from its stale mount. It had the number and filed anyway.

*Second origin: the MWF site auditor filed five findings on 2026-09-16 and three were wrong —
a HIGH that a commissioned build session had fixed five minutes earlier, a risk the CoS had
already accepted and downgraded, and a WARN inside the CoS's own stated gate baseline. The
revised report then added a fourth: it stated that `/LANE-RULES.md` does not exist in the repo.
It has existed at the root since `728c6e5`. The lane was reading a mount nine commits behind.*

## R3 · A prompt never re-adds something Mo deleted

Specifically, and permanently, for the Bowman Bangers board:

- **"Dry Powder" was removed by Mo on 2026-08-21. Never re-add it.** Any prompt text saying it
  is "rank 00 and stays at the top permanently" is superseded and wrong.
- **The block once labelled "WHAT BREAKS THIS" is now "WHAT WOULD CHANGE OUR MIND", and it
  carries no hard dated deadlines.** Same date, same ruling.

Generally: where your prompt tells you to publish a block, a label or a ranking that the System
Reference, the changelog or the live page says Mo removed or renamed, **the removal wins.**
File the prompt as drifted; do not restore what he deleted.

## R4 · Read STATE.md before recommending channel, infrastructure or account-level work

Before proposing that anyone set up, verify, connect, or spend quota on a channel, console,
vendor or account: **read `claude/cos/STATE.md`, and name in your filing which state file you
read.** Reasoning from the repo alone is not enough — most of that history lives in state, not
in code.

*Origin: a lane filed a well-argued 20-minute recommendation to verify the site in Bing
Webmaster Tools and submit the sitemap. Both have been live since 2026-09-08 and are read
weekly. The investigation around it was genuinely good and changed the roadmap; the headline
recommendation was work finished three weeks earlier.*

## R5 · Verify a finding against the LIVE SITE before filing it

A finding is about what the public sees. **Re-fetch the live URL and reproduce the defect there
immediately before filing**, and say in the finding that you did. If it does not reproduce live,
it is not a finding — the tree is behind, or someone already fixed it.

This is cheap and it is decisive. It kills the whole class of "the file on my disk says X".

## R6 · Check the ledger before filing — re-filing a settled item is a defect

Before a finding is written, check it against **`data/pipeline.json`** (every proposal, its
status and its decision) and **`claude/cos/STATE.md` in the repo**. If the item already has a
ruling, an acceptance, a downgrade, or sits inside a stated baseline, **it is closed and you do
not re-open it** — if you disagree with the ruling, say so in one line as a disagreement with a
named decision, not as a new finding at the old severity.

*Origin: 2026-09-16 — the auditor re-filed a clone/ledger risk the CoS had accepted, backed up
in full and downgraded MED→LOW the day before, at the old severity and with a superseded fix;
and separately asked the CoS to rule a question the CoS had already ruled in writing.*

## R7 · An absence claim requires a fresh clone

"File X does not exist", "the rule is not in the repo", "nothing implements Y" — these may only
be filed after `git ls-files` **in a clone taken this run**. Never from a mount, never from
memory, never from a search that came back empty. An absence claim from a stale tree is the
easiest wrong finding to make and the most expensive to read, because it reads like a fact.

---

---

## Standing evidence rules (adopted from lanes' own self-reports)

- **A diff claim from a hand-picked file list is not a diff claim.** `git diff --name-only
  origin/main` in full, or it is not verified.
- **Verify before you act on a name, a title or a listing** — the live title decides, not the
  copy on our page.
- **Declare your own stumbles in your filing.** Every lane that has self-reported a miss has had
  the finding accepted; the misses that cost something were the unreported ones.

## Cadence — the authoritative copy (moved here 2026-09-16)

This table used to live in `claude/cos/CHARTER.md` §6. It moved because the charter is a
28 KB document that has to be rewritten whole to change one cell, so its cadence table went
stale. This file is cheap to edit, in git, and read at STEP 0 — so the schedule lives here now
and the charter points at it. **If you see a day in any other document, this table wins.**

### Cloud scheduled tasks (editable from any session via the scheduled-task API)

| Task | When (Pacific) | What |
|---|---|---|
| CoS · daily ops check | every day 06:00 | Engine Watch · Pricing Integrity audit · Wiring Keeper gate · Bug Sweeper · light Mobile QA (5 pages) · NEEDS-MO review · §0 light read when Chrome is reachable. Cloud-only: no commits. |
| **CoS · weekly site audit** | **Wednesday 11:00** *(moved from Monday 04:30 by Mo, 2026-09-16 — "a bigger gap" from the Sunday run, and a working hour rather than pre-dawn)* | §0 Business Read first → Terminal Product read → full §4 audit + full-site sweep → Pricing Integrity weekly → the build order → Tape Recap → adjudicate every `awaiting-cos` filing → fix, commit and push behind the three gates → IndexNow. |
| CoS · monthly roster & rooms review | 1st of the month 05:00 | Re-read Mo's direction, retire/create agents and rooms, rewrite CHARTER §2, prune rooms. |

### Desktop-local lanes (in the Claude desktop app — NOT in the scheduled-task API; only Mo edits these prompts)

| Lane | Task-key | What |
|---|---|---|
| Sunday Chief of Staff run | `chief-of-staff-sunday` | Weekly planning brief, queue, coach notes, roster |
| Monday trend scan (price lane) | `shopcardhub-weekly-trend-scan` | Autonomous price lane — mechanical re-marks and index levels behind the gates |
| Tuesday board update | `bowman-bangers-tuesday-update` | Bowman Bangers re-mark, board tweet queue, Tuesday Tape digest |
| MWF site auditor | `shopcardhub-site-auditor` | Read-only find-and-file QA (`tools/site-auditor/CHARTER.md`) |
| Thursday trader · Friday release window · Wednesday build session | — | Trader recs; release-day conversion; the build session that lands queued patches |

**Overlap to watch (2026-09-16):** the weekly now starts at 11:00 PT Wednesday and the last full
audit took about 3.5 hours, so it can still be running when the **Wednesday 1 PM build session**
starts. Two sessions pushing the same tree is exactly the collision R2 exists for: whichever runs
second fetches and rebases rather than forcing, and neither works in a reused clone. If they keep
colliding, the build session is the one to move.

**Open question for Mo (raised 2026-09-16, not yet answered):** the weekly run's Tape Recap send
now falls on Wednesday, one day after the Tuesday lane's own digest. Email ownership was decided
on 2026-09-06 as *"Tuesday owns the digest, no email agent"*, which reads as though the weekly's
separate recap send is leftover doctrine. Until Mo rules, **the weekly does not send a recap in a
week where the Tuesday digest already went out** — it drafts and says so. One list, four active
subscribers; two sends in 24 hours is the wrong side of the line.

## Changing this file

Only the Chief of Staff edits it, and every rule carries the date and the incident behind it.
A lane that thinks a rule is wrong files that as a finding — it does not edit the file.
