# X Desk Watch — auditing Grok Bot

**Created 2026-09-17 by the Chief of Staff, on Mo's instruction:** *"I have hired Grok bot to run
our Twitter page. You can effectively close our own twitter agent from posting, however, I would
like you to change that agent in a meaningful way to audit and keep an eye on our new Grok
employee."*

Doctrine lives in **`/LANE-RULES.md` R10**. This file is the spec: what the lane checks, how, and
what happens when a check fails. It is read at STEP 0 of every X Desk Watch run, after LANE-RULES.

---

## 1. What changed

| | Before 2026-09-17 | After |
|---|---|---|
| Who posts to @shopcardhub | Tuesday board auto-queue + reply-paster + Mo, live | **Grok Bot only.** No lane on this project writes to X, ever (R10). |
| Board tape image | generated, then posted by us | generated, then **published to a fixed URL on our own site**; the vendor pulls it |
| Our role | operator | **auditor** — find and file, never post, never reply, never DM the vendor |
| Direction to the vendor | n/a | **through Mo only**, as one short note a week |

**The one-line reason this lane exists:** every gate on this project reads our own HTML, and none
of them can see a sentence written on X. We spent September learning that we gate structure and
not meaning — the graded ladder, the hammer labels, the board's own title. The feed is now a
public claims surface with none of those gates on it, operated by someone who does not read our
docs. That is the exact shape of every incident this month, moved outside the building.

**The second-order consequence, which is the important one:** our blast radius went up. When a
page of ours is wrong, a vendor faithfully amplifies it to an audience, in a post we cannot edit
or delete. So a claims defect on a page that Grok has posted about is no longer a page fix — it
is a page fix **plus** a correction note to Mo the same hour.

---

## 2. Grok Bot's charter, as filed (vendor's own words, summarized — full text in the Project doc)

Owns: weekday 09:00 PT posts, Sunday 09:00, reply sweeps 12:00 and 17:00 weekdays, a Monday 10:00
performance audit, and four support seats (Seeker, Creator, Auditor, Coach). Keeps to indices and
the Bowman BOARD first, collector-friendly language, one clean site image where possible, the site
link in the main post, numbers pulled from shopcardhub.com and never invented. Auto-replies only to
simple good-faith questions; escalates insults, bait, debates, legal, partnerships, fresh price
calls and anything needing an uncertain mark. Write path is a persistent browser session as
@shopcardhub; the X connector is read-only; logged out means draft and alert, never a fake send.

### CoS rulings on that charter

| Clause | Ruling |
|---|---|
| Grok owns all posting; CoS does not post | **Accepted, and hardened into R10.** Our write path is revoked, not merely unused. |
| Link in the **main** post, never "link in reply" | **Accepted — this overrides our own standing rule.** The Aug X reset put the link in the first reply on the folklore that X suppresses link posts. We never measured it, and GA4 says t.co is already our best-engaging channel (28d: 30 sessions, 3m 48s average engagement against a 36s site average, 13.33% key-event rate on small n). A link in the body is the version we can actually measure. `x-twitter-strategy` memory is updated accordingly. |
| "Collector-friendly; translate finance thinking; no z-scores / dense terminal jargon" | **Accepted as a style rule, rejected as an audience rule.** Our standing audience rule (Sep 16) resolves ambiguous wording toward the **investor**, not the retail browser — that is what the Seeking-Alpha shape is for. Plain language yes; retail framing no. The distinction is concrete: "the board is down 6% in a month" is plain and investor-framed; "top 1st Bowman cards to collect" is retail, and is the exact copy we rewrote off the board on Sep 16. |
| "Never invent marks; pull from shopcardhub.com" | **Accepted, and it is the lane's primary check.** Extended: a number must be traceable to a live surface **at post time**, and a *carried* value is never narrated as a series. |
| "Escalate to owner" | **Accepted for anything public** (insults, bait, debates, legal, partnerships, price calls). Mo is the only person who directs this vendor. |
| "Give direction through the owner (or shared notes)" | **Accepted, owner only.** Mo's Sep 16 preference that agents talk to each other rather than route through him covers *our* agents; a vendor is outside the boundary. No shared doc, no DM, no reply. |
| "Do not post, schedule, reply, or fix tweets on X" | **Accepted, and it binds us in the strong form** — including deleting a post of ours that is wrong. If a post must come down, that is Mo's hand. |
| Support seats (Seeker, Creator, Auditor, Coach) | **Noted, not adopted.** We audit outputs, not the vendor's internal org. We do not review, name or direct its sub-agents. |
| "First live proof" post | **Audited. See §5.** |

### What we owe the vendor (standing, delivered in the weekly note)

1. Heads-up **before** any change to the BOARD's ranking rule, the Vault, or index methodology —
   the Sep 17 ranking-rule change is exactly the kind of thing that makes a vendor's stock phrasing
   false overnight.
2. The week's Tuesday Tape angle, so the X desk can tease it.
3. The board tape image and the board's numbers at the fixed URL (§4).
4. Anything we published that turned out wrong and that it has already posted about.

---

## 3. The checks

Run once daily, 17:30 PT (cut from twice daily on 2026-09-21 under Mo's "too many scheduled runs" instruction; one run covers the 09:00 post and both the 12:00 and 17:00 sweeps — matches the LANE-RULES cadence table and the task prompt, both updated the same hour). Monday's run is the weekly grade. Every run opens with a freshness header
(R2) and states which surfaces it could and could not read.

**A · Claims (FAIL).** Every figure, level, rank, verdict, date and superlative in the day's posts
and auto-replies, traced to a live surface of ours at post time:
- a number with no on-site source, or one that disagrees with the source → FAIL
- an **ask** described as a sale, a price paid, or "what buyers paid" → FAIL (the Sep 16 retraction)
- a **graded** figure with no dated sale behind it → FAIL (the graded-ladder incident)
- a carried or single observation narrated as a series — "flat", "pinned", "held", "a sixth
  straight week" → FAIL (STATE 2026-09-17, rule 2)
- a level attributed to the wrong instrument — the **BOARD** composite is not BOW26 is not BCB26 → FAIL
- a coverage claim beyond the real tracked count → FAIL
- any hammer/auction figure presented as a clearing price rather than a floor → FAIL

**B · Taxonomy (FAIL).** LANE-RULES R8/R9 bind the feed. Four distinct products; a 1st Bowman
Chrome never implies a 1st Bowman Chrome Auto; the BOARD is 1st Bowman Chrome **Autographs**, on-card
autos only, not base and not graded. "1st Bowman cards" is the retail category and is not our board.

**C · Exposure (FAIL, and this one is absolute).**
- **No COMC position of Mo's on any public surface** (Mo, Sep 16). If the vendor ever posts what we
  hold, what we bought at, or what we are selling, that is a same-hour needs-you.
- **No competitor names** (the pipeline leak rule — we leaked for three weeks once).
- No claim about grading outcomes, no financial advice framing, no invented scarcity.
- Every eBay link carries `customid=` and a visible "eBay" label if one ever appears (EPN, closed Sep 3).

**D · Strategy fit (MED — drift, not defect).** Indices and the BOARD first, not single-card
spreadsheet dumps. Investor framing, not collector-retail framing. One clean site image where a
clean one exists. Site link in the main post and it resolves. Cadence actually happened: 5 weekday
posts, Sunday post, both reply sweeps.

**E · Replies (MED).** The auto/escalated mix, and whether any auto-reply stepped outside the
vendor's own locked policy — an auto-reply that states a price, makes a call, or answers a debate
is out of policy even if it is correct.

**F · Funnel (weekly, Monday).** GA4 Browser 2: t.co sessions, engagement time, and the three live
key events (`click`, `track_card_from_page`, `newsletter_signup`) against the X baseline below.
Image-vs-text-only split. Grok's own Monday audit note, graded against what we measured — **a
vendor's self-report is an input, not a result.**

### Severity and what happens

| | Action |
|---|---|
| **FAIL** (A, B, C) | Needs-you to Mo **the same hour**, with the correction text drafted so he can hand it straight over. Logged in `NEEDS-MO.md` and `STATE.md`. Never fixed by us, never replied to. |
| **MED** (D, E) | Goes in Monday's note. Three of the same MED in three weeks is escalated as a FAIL — that is drift, not noise. |
| **Could not read** | Said plainly in the run summary, never averaged over and never guessed. A missed read is not a pass. |

### Hard boundaries on this lane

Read-only on X. No posting, replying, liking, reposting, following, deleting, DMing, or logging in
anywhere. No contact with the vendor. No git (R1) — it files, the CoS rules, a publishing lane
ships. It does not grade the vendor's prose for taste; it grades claims, taxonomy, exposure, fit
and cadence.

---

## 4. The board tape handoff (Mo's call, 2026-09-17)

The Tuesday lane keeps `tools/x-images/make.py` and the board tape, and publishes to fixed paths so
the vendor pulls rather than relays:

- `og/x/board-latest.png` — the week's board tape, overwritten each Tuesday
- `data/x-board.json` — the ranked seats with marks, verdicts, the as-of date, the ranking rule in
  one sentence, and the sale counts behind any graded figure

Rules on it: it carries only numbers already live on the site; never Mo's costs, quantities or COMC
positions; never a competitor name; regenerated at publish time so the as-of stamp is honest. The
Tuesday lane builds this on **2026-09-22**; until it exists the vendor reads the homepage Markets
panel, which is where it correctly found the BOARD level on day one.

---

## 5. First audit — Grok Bot's proof post (2026-09-17, 13:18 PT, read in Browser 1)

> BOARD finished last night at 93.96 — up about half a point. That's our equal-weight 1st Bowman
> chase board in one number. Not one card. The desk. shopcardhub.com

**Claims: PASS, every one, and this is worth stating plainly.** The homepage Markets panel carries
`BOARD 93.96 +0.49 +0.52%`, and the chart caption reads *equal-weight · 9 autos · ask-basis ·
100 = Aug 18 · 30 marks · last Sep 16*. "Finished last night", "about half a point" and
"equal-weight" are all exactly right, and it correctly separated the BOARD composite from the set
indices sitting next to it in the same panel — the instrument confusion check A was written for.
It read our live surface and did not round, embellish or invent. That is a better first night than
two of our own lanes had this month.

**Taxonomy: MED (check B).** *"our equal-weight 1st Bowman chase board"*. The board is nine **1st
Bowman Chrome Autographs**. "1st Bowman" alone is the retail, non-auto category — the precise copy
the CoS stripped off the board's own title, meta and hero on Sep 16 under R9. Not wrong enough to
correct publicly; exactly the kind of thing that becomes house style if nobody says it in week one.
**Goes in Monday's note.**

**Fit: MED.** Text-only against its own "prefer one clean site image" rule, on a post about a
number that we render as a chart. Link in the main post and it resolves. 9 views at 35 minutes.

**Baseline recorded for the grade (GA4, 28d to Sep 16):** t.co = 30 sessions, 3m 48s average
engagement, 13.33% key-event rate, against a 36s site average — the best-engaging channel on the
site on a small n, and the whole of Organic Social. **Key events were dead Sep 4–16**, so no
retention or conversion figure is quoted from that window; the first clean weekly read is **Sep 24**.
