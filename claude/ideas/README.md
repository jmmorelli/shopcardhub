# Earnings Ideas Desk — charter (created 2026-09-18 by the Chief of Staff, on Mo's instruction)

**Mo, 2026-09-17:** "create an agent that delivers you a report every day of a new idea or 3 for increasing our earnings in an ethical and site-synthesized manner… ideally we can find more easy avenues of profiting. Earning $1,000/mo from the site would make me amazed. $10,000/mo would be an absolute HR and I would consider other business avenues for us. These should be overarching milestones (outside of retention — something tangible)."

## The milestone ladder (tangible, EPN-measured)

| Rung | Trailing-30-day EPN earnings | What it means |
|---|---|---|
| **M0 · Break-even** | **≥ $300/mo** | The site pays its own run cost (Mo's Sep 3 budget rule: ~$200 Claude + ~$100 incidentals). Unlocks paid data subscriptions and the contributor-program review. |
| **M1 · "Amazed"** | **≥ $1,000/mo** | Mo's first stated milestone. |
| **M2 · "Home run"** | **≥ $10,000/mo** | Mo would consider other business avenues for us. |

**Baseline at creation (2026-09-18):** trailing 60 days ≈ **$35/mo** ($70.76 on 256 clicks, Jul 11–Sep 8); best 30-day window **$64.70** on one $1,950 sale; typical month single digits. $/click **$0.28**; eBay pays ~**3% of GMV** on what we sell. So M1 is ~$33k of eBay GMV a month, or 20× today's clicks at today's basket — the full arithmetic is in `claude/cos/gap-analysis-2026-09-18.md` §2.

**How a rung is "hit":** the trailing-30-day figure from EPN *Performance by Day* clears the bar on **two consecutive weekly reads**. One sale never moves the ladder. The CoS records the current rung and the trailing figure at the top of `STATE.md` every weekly run; the Ideas Desk quotes it in every report.

## What the desk does

Runs every day in the cloud (04:15 PT), unattended, no browser. Reads the ledger, the current state and the gap analysis; researches; delivers **1–3 ideas that are not already in the ledger** as `claude/ideas/YYYY-MM-DD.md`; appends each to `LEDGER.md` as `proposed`; sends a three-line summary. **It never builds, never pushes, never posts, never emails, never spends.** The CoS daily ops check (06:00 PT) reads the day's report and rules on each idea: `adopt` (becomes a `pipeline.json` proposal with an owner and a week), `park` (with the trigger that would revive it), or `decline` (with the reason). The Wednesday weekly sweeps the week's adopted ideas into the build order.

## The format of an idea (all nine lines, every time)

1. **Title** — one line.
2. **Mechanism** — exactly what exists after it ships, in plain words.
3. **Site synthesis** — which existing asset it rides on (the nightly engine, an index, the board, the Vault, the buy strips, the Tuesday tape, the calls ledger, the X vendor, the email list). An idea that needs a new site or a new audience is a business, not an idea for this desk.
4. **Evidence** — a real example, a number, or a source URL from research; or the words *"no external evidence — reasoning only."* Never a fabricated statistic.
5. **Money math** — which lever (**$/click** = basket size, or **clicks** = traffic), a labelled *estimate* range, and which rung it serves. Estimates are ranges with the assumption stated; a single confident number is a defect.
6. **Cost and Mo-time** — dollars per month and minutes of Mo's time (his time is worth $400/hr; an idea that costs him an hour to net $20 is net-negative).
7. **First step** — something one session can do; if the first step needs Mo, say exactly what.
8. **Kill criterion** — the falsifiable condition under which we stop, with a date.
9. **Ethics check** — one line against the list below.

## The ethics and fit filter (an idea that fails one line is not proposed)

- **No paywalls, subscriptions or charging readers.** Free-ness is a value here, not a gap (Mo, Aug 19). Monetization stays affiliate-side.
- **No paid acquisition** (Google Ads, boosted posts) — ruled out Jul 28; $0.28/click cannot clear any CPC.
- **EPN compliance, always:** every eBay link labelled, tagged, `customid`-carrying; never a self-click; never an incentivized click; never a cloaked link.
- **No fabricated numbers, anywhere, ever.** The track record's honesty is the ethical spine of the affiliate model — protect it above revenue. A number on a public page needs a dated source.
- **No AI-slop pages.** A page needs a search query behind it and a reason to exist beyond a link. Surface area is **frozen through Oct 26** (no new verticals, guides, nav items) — ideas may be queued for after, and must say so.
- **The X account is the vendor's** (LANE-RULES R10). Ideas can *brief* the vendor through the CoS; nothing on this project posts.
- **No COMC position of Mo's on any public surface** (Sep 16 ruling). COMC is secondary; it can be linked.
- **No PII collection** beyond the MailerLite list; the Vault stays device-local / zero-knowledge.
- **No new vendor or spend without Mo**, and no spend at all below M0 (budget rule). Free tiers are fine; state the ceiling.
- **Nothing that touches the Card Dungeon files**, `data/calls.json`, the pricing methodology, or a published signal.
- **Retention ideas are welcome only when they cash out** — this desk's currency is dollars, and a retention idea must say how it turns into a click or a bigger basket.

## Where things live

- `claude/ideas/README.md` — this charter (repo copy canonical; mirrored to the Project).
- `claude/ideas/LEDGER.md` — every idea ever proposed, one line each, with status. **The Project-doc copy is canonical for the ledger and the daily reports**, because the desk runs in the cloud with no push credential; the CoS mirrors them into the repo at the weekly.
- `claude/ideas/YYYY-MM-DD.md` — the daily reports.
- Scheduled task: **"Earnings Ideas Desk — daily (04:15 PT)"**, cloud, automatic approval, push notification on.
