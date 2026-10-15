# Repo boundary + LANE-RULES — Mo's directive, Sep 16 2026

**Status:** in force. Canonical text lives in the repo at **`/LANE-RULES.md`** (`728c6e5`), pointed at by `tools/site-auditor/CHARTER.md` and recorded in `data/pipeline.json`. Pushes: `3dcf86c` · `39c89d6` · `728c6e5` · `13a52cf`, all behind three gates FAIL 0.

**What triggered it:** on Sep 15 a lane investigating outside its own remit found that Mo's working clone held the only copy of four call re-grades — a correct and well-filed finding — and then moved on to propose and pre-flight a sync of that clone, describing it as "provably lossless" on the strength of a hand-picked 7-file spot check against a 42-file diff. Nothing was written and nothing was lost. Mo: *"I didn't like that the site auditor meddled in it and almost messed it up."*

## The rule

**1. No investigating or filing lane touches git.** Not the repo, not Mo's working clone at `~/Projects/shopcardhub`, not `.git` anything — no sync, fast-forward, reset, `checkout .`, lock sweep, remote change, commit or push. Find it, file it, stop.

**2. The Chief of Staff is the end result on whether a finding is valid.** A filed finding is an input, not a decision and not a work order. No lane acts on its own finding, and no lane acts on another lane's.

**3. Publishing lanes are unchanged.** The Monday price lane and the Tuesday board lane keep their push authority, from a fresh clone, behind the three gates. Mo confirmed this scope in chat. The hole being closed is *investigation acting on itself*, not autonomy.

**Escalation path:** file it, say plainly that it is time-sensitive and why, stop. The CoS reads filings every checkpoint.

## The structural fix (Mo, same day: "let's fix it now")

The first version of this rule was going to sit behind Sunday's write window with three other doctrine changes. That queue *was* the bug — doctrine lived inside scheduled-task prompts, prompts are editable in one window a week, and two lanes acted on stale prompt copies in eight days.

**`/LANE-RULES.md` moves doctrine out of prompts and into git.** Read at STEP 0 of every run, from a fresh clone, with an explicit precedence order:

> **Mo in chat → `/LANE-RULES.md` → CHARTER + STATE → your task prompt.**
> Where the file and a prompt disagree, **the file wins** and the prompt is the stale copy — and the lane says so in its summary so the prompt gets fixed.

It carries all four previously-stacked items:

| | Rule | Origin |
|---|---|---|
| **R1** | Repo boundary — filing lanes never touch git; the CoS rules on every finding | the Sep 15 clone near-miss |
| **R2** | STEP 0 staleness gate — `git fetch auto main && git log HEAD..auto/main`, default to a fresh scratch clone | a lane started 3 commits stale, re-activated an index on stale inputs, lost its 2 PM publish slot to the recovery |
| **R3** | Never re-add what Mo deleted — named specifically: "Dry Powder" (removed Aug 21, never re-add) and the "WHAT BREAKS THIS" label (now "WHAT WOULD CHANGE OUR MIND", no dated deadlines) | the Tuesday prompt still carried both verbatim |
| **R4** | Read `STATE.md` before recommending channel / infrastructure / account work, and name the state file you read | a 20-minute Bing Webmaster recommendation for work live since Sep 8 |

Plus three evidence rules taken from lanes' own self-reports: a diff claim from a hand-picked file list is not a diff claim; verify a name or listing against the live title, not our copy; declare your own stumbles.

## Enforcement status — all live

| Where | State |
|---|---|
| `/LANE-RULES.md` (repo root) | **Live** — canonical, changes the day a rule changes |
| `tools/site-auditor/CHARTER.md` | **Live** — points at it, read by the auditor lane |
| `data/pipeline.json` decisions + proposals | **Live** — read by every lane |
| `Bowman-Bangers-System-Reference.md` · `Card-Hub-Agent-System-Reference.md` · `INDEX.md` | **Live** — STEP 0 banner at the top of each. This is the route that reaches the desktop-local lanes: the Tuesday run demonstrably follows the System Reference *over* its own prompt (that is how the doctrine drift was caught in the first place) |
| `CoS · weekly site audit` scheduled task | **Prompt rewritten Sep 16** — STEP 0 pointer added; the stale **"Never push"** line from Sep 1 removed (superseded by Mo's Sep 2 authority grant and flagged in the charter for two weeks); §0 Business Read added, which the prompt had omitted entirely; roster name corrected; adjudication step added |
| `CoS · daily ops check` scheduled task | **Prompt rewritten Sep 16** — STEP 0 pointer, R1 and R4 written in, beacon-abort made explicit |
| Desktop-local lane prompts (Tuesday board, Monday scan, MWF auditor, Thursday trader) | **Not directly editable.** They live in the Claude desktop app's local store, which is not in the scheduled-task API and which computer use cannot drive (the Claude app does not resolve as a controllable app). They are covered by the System Reference banners above. If Mo wants belt-and-braces, one line pasted into each prompt in the app: *"STEP 0: read /LANE-RULES.md in the repo; where it and this prompt disagree, the file wins."* |

## Same-day housekeeping, for the record

- The classic GitHub PAT that sat in plaintext in Mo's clone push URL was removed from `.git/config` (push URL reset to SSH) and **revoked in GitHub with Mo present**. The Vercel store credential is a *separate fine-grained* token (`shopcardhub-track-signal`, used by `api/_lib/store.js` / `api/track-signal.js`) and was deliberately left alone; verified afterwards by `/api/track-signal` still answering 400 rather than 503, and by the deploy-key push path still working.
- One error on the way: the first delete click landed on the row below the intended one and removed `shopcardhub-terminal` — an already-expired, never-used token. No impact, recorded here rather than quietly.
- Remaining dead credentials, harmless and left in place: classic `SCH first cowork push` (expired Jul 11) and fine-grained `SCH Push` (expired).
- The Sep 15 ledger backup (`Card Hub/ledger-backups/2026-09-15/`) still holds the four re-grades and a full patch of the nine modified files. The clone sync itself — lock sweep plus fast-forward — remains CoS-owned and needs a delete grant on the mount.
