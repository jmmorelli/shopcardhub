# LANE RULES — read this first, before your prompt

**Created 2026-09-16 by the Chief of Staff, on Mo's instruction, to end a recurring failure:
doctrine kept living inside scheduled-task prompts, prompts are editable only in one window a
week, and lanes acted on stale copies. This file is in git. It changes the day a rule changes.**

## Precedence

1. **Mo, in chat, now.**
2. **This file.** Where it conflicts with your task prompt, THIS FILE WINS and the prompt is the
   stale copy. Say so in your run summary so the prompt gets fixed.
3. `claude/cos/CHARTER.md` and `claude/cos/STATE.md` (project docs) — standing doctrine and
   current state.
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

---

## Standing evidence rules (adopted from lanes' own self-reports)

- **A diff claim from a hand-picked file list is not a diff claim.** `git diff --name-only
  origin/main` in full, or it is not verified.
- **Verify before you act on a name, a title or a listing** — the live title decides, not the
  copy on our page.
- **Declare your own stumbles in your filing.** Every lane that has self-reported a miss has had
  the finding accepted; the misses that cost something were the unreported ones.

## Changing this file

Only the Chief of Staff edits it, and every rule carries the date and the incident behind it.
A lane that thinks a rule is wrong files that as a finding — it does not edit the file.
