# Retention Desk — charter (created 2026-10-09 by the Chief of Staff, on Mo's instruction)

**Mo, 2026-10-09:** "Do we have anyone coming up with ideas for the site for retention/return reasons? … right now there's not really a reason to come back or be told to come back … Seeking Alpha has analysis articles and data, portfolio creation … there's a 'reason to come back' for more than just market data. PSA Vault … there's a reason to keep going back, or at least, give them your email. We have nothing like that and there's no reason to focus on a vault or something that is overly done in the market."

**The gap this desk fills.** Before Oct 9 nobody on the project *invented* reasons to return. The Earnings Ideas Desk files money ideas and treats retention as a side effect. The Retention Analyst (Growth room, weekly) *measures* the funnel and files one placement proposal a week. The Night Crew fixes what is on the BACKLOG. This desk is the ideation step for return visits, with a built-in fit check against the site as it is.

## What the desk does

Runs nightly on desk nights (Sun–Thu 03:40 PT) in the cloud, unattended, no browser. Two sub-agents, then the lead files:

1. **The Ideator** — proposes 1 idea (2 at most) that gives a collector a reason to come back, or a reason to hand over an email. Not already in `LEDGER.md`.
2. **The Fit Analyst** — reads the live site and a read-only clone, and answers for each idea: where it would live, what it rides on, what it displaces, which rule it hits, how big the build is, and how we would know it worked. Verdict: **fits now · fits after a named gate · does not fit**.
3. **The Lead** writes `claude/retention/YYYY-MM-DD.md`, appends the ledger rows, and sends one message of at most three lines.

**It never builds, never pushes, never posts, never emails, never spends.** The CoS weekday desk (14:00 PT) reads the filing and rules on each idea: `adopt` (owner + week; a build goes to the Night Crew BACKLOG, the Wednesday weekly, or a handoff), `park` (with the gate that revives it), or `decline` (with the reason). The CoS deliberates; the desk proposes.

**Backpressure.** If the ledger holds **4 or more** rows still `proposed` (unruled), the desk files **no new idea**. It instead re-runs the Fit Analyst on the oldest unruled row with anything new learned, notes that in the day's file, and exits. Ideas that nobody rules on are noise.

## The six return lanes (every idea names one)

| Lane | The collector's sentence | What we already have in it |
|---|---|---|
| **A · Ritual** | "Something new is there every Monday / release day." | Monday close of 37 tickers; Tuesday Tape (Mo wants it rethought, Oct 5); release-day flips; Gengar's Collector's Desk (Oct 5 directive) |
| **B · State** | "It remembers what I was looking at, without an account." | Home since-last-visit panel (live, below the board); watchlist deltas; returner strip |
| **C · Alerts** | "It tells me when something I care about actually happens." | Signal Alert email (approved Sep 15, parked at 40 subs); R26 watchlist "way home" block in the Tape |
| **D · Tools** | "I can do something here I can't do on eBay." | Hobby-box ROI calculator; break math; set indices; card search (Pokémon-only today) |
| **E · Standing** | "They keep score in public, so I trust them." | /track-record (calls graded at 6/12 months); index methodology pages |
| **F · Analysis** | "They explain what the numbers mean." (the Seeking Alpha analogy) | Bowman prospect dossiers; scouting grades; index explainers; the X thread archive |

Lane B and D ideas must respect Mo's Sep 25 ruling: **we do not compete with PSA on vaulting slabs or storing a collection.** The Vault exists; the desk does not propose more Vault. State is lightweight and device-local.

## The format of an idea (all nine lines, every time)

1. **Title** — one line, and the lane letter.
2. **The return sentence** — what a collector would say to a friend about why they went back. If you cannot write it in one plain sentence, it is not a reason to return.
3. **Mechanism** — exactly what exists after it ships, in plain words, and on which page.
4. **Rides on** — the existing asset (nightly engine, an index, `data/*.json`, the list, a generator, a page). An idea that needs a new audience or a new data source is a business, not an idea for this desk.
5. **Who it is for** — the high-end chaser, the Bowman prospector, the parent with a kid's binder, the set completist. One of them, named.
6. **Evidence** — a comparable site or product doing it (URL), a number from our own GA4/list reads, or the words *"no external evidence — reasoning only."* Never a fabricated statistic.
7. **Cashes out** — honestly: more returning sessions → eBay clicks, or a list signup. "Indirect" is allowed; "none" is a decline.
8. **Cost and Mo-time** — build size S/M/L, dollars (none below M0), minutes of Mo's time ($400/hr).
9. **Kill criterion** — the falsifiable condition under which we remove it, with a date and the GA4 event or list number that decides it.

## The fit rubric (the Fit Analyst answers all six)

1. **Where it lives** — the URL and the section, verified on the live page; what it pushes down or replaces (net-calm: a top-5 lander does not gain a fold item).
2. **What it rides on** — the file, generator, or endpoint, named from the clone (`tools/`, `data/`, `js/`, `api/`).
3. **Rules it touches** — R25 surface freeze (re-audit Nov 2), R26 one capture / no accounts / no PII, R33 link-type freeze, R30 founder privacy, pricing integrity (every figure dated), Mo's no-PSA-vault ruling, "no new page until GSC ≥ 20 indexed" (traffic plan Oct 9). Name each one it hits and whether a gate opens it later.
4. **Build size and owner** — S (config or one CSS/JS change → Night Crew), M (one generator → Wednesday weekly), L (new system → CoS handoff, after the freeze).
5. **How we would know** — the GA4 event, the list number, or the nightly row that moves; if none exists, the instrumentation is part of the build.
6. **Verdict** — fits now · fits after <gate, date> · does not fit (<reason>).

## The ethics and fit filter (an idea that fails one line is not proposed)

- No accounts, logins, pop-ups, gates, or a second list (R26). The one capture, one promise stands; an idea may change *what the promise is*, and must say so.
- No PII beyond the MailerLite list; anything personal stays on the device.
- No paywalls or charging readers. Free is a value here.
- No new vendor or spend without Mo, and no spend below M0.
- No fabricated numbers on any surface; every figure dated.
- Nothing that competes with PSA on slab storage or a full collection vault (Mo, Sep 25).
- Nothing that touches the Card Dungeon, `data/calls.json`, the pricing methodology, or a published signal.
- Nothing posts to X; nothing emails. Alert ideas describe the email; the Tuesday lane and the CoS own sends.
- The desk may queue an idea for after a freeze and must say which gate opens it.

## Where things live

- `claude/retention/README.md` — this charter.
- `claude/retention/LEDGER.md` — every idea ever proposed, one row each, with status. Project copy canonical; the CoS mirrors to the repo at the weekly.
- `claude/retention/YYYY-MM-DD.md` — the nightly filings.
- Scheduled task: **"Retention Desk — nightly (Sun–Thu 03:40 PT, cloud)"**, model claude-opus-5-5 per Mo's Sep 27 rule.
- Rulings: the CoS weekday desk, STEP 5. Adopted builds appear in `claude/night-crew/BACKLOG.md` (S), the Wednesday weekly (M), or `claude/handoffs/` (L).
- Review: the Nov 1 monthly roster review reads adoption rate (adopted ÷ proposed) and whether anything adopted moved `returningShare7` or the list. Below 1 in 5 adopted, the cadence drops to Tue/Fri; above, it stays nightly.
