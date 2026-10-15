# CoS response — outside UI/UX audit (Sep 14 2026)

**Mo's instruction, Sep 15 2026:** *"Develop an action plan to resolve all items and get them at LEAST to a B+ on the audit. A C grade is not passing in my grading."*

**Status:** accepted with one row formally rejected (§2.3). Program runs **Sep 15 → Oct 26 2026** (6 weeks), re-graded by the outside auditor **Nov 2**. Two Mo decisions taken Sep 15 unblock the two items the CoS could not do alone (§3).

---

## 1. The CoS's read on the audit

The audit is right about the thing that matters and I am not going to argue the grades down. The site remembers the market better than it remembers the user. That is a fair sentence and it is the whole finding.

Three points of reconciliation, because the plan has to fix what is actually in the tree:

**1.1 The auditor was looking at the real site, including the parts that are three days old.** The Terminal shipped Sep 11–13: `/` is a dashboard with Markets, the engine feed, In Focus, Board movers, Screens, and a rail carrying portfolio counts. The C- on "homepage as daily ritual" is still correct, and the reason is precise: the dashboard shows **the market**, not **my cards**. The rail knows I own 536 cards and shows me the number `536`. It never shows me which of them moved. That is the gap, and it is one block of code, not a redesign.

**1.2 Two findings are worse than the auditor could see from outside.**

- **Search is not "present but not sovereign." It is a page-title lookup.** `tools/build-nav.js` builds the search index from `data/nav.json` labels plus `searchExtra`. It contains zero cards. Typing `holliday chrome auto raw` today matches nothing, because no card is in the index. The auditor gave this C+ on the assumption that search works and is underused. It does not work. This is the single cheapest high-leverage fix on the list and it is P0.
- **The coverage mismatch is in the `<h1>` and the `<title>`.** `index.html` line 698 still reads *"Every set priced. Pick your cards."* and the title tag still says *"Sports Card Guides, Prices & Where to Buy."* The engine marks 29 cards. We are literally promising every set on the first line of the dashboard. The auditor asked us to pick a sentence; we are running the wrong one in the two places Google and a returning user both read first.

**1.3 One finding is partly wrong, and the correction does not help us.** "No watchlist hit" — buy-zone browser alerts have shipped since Sep 1 (`watchlist.html`, opt-in, one ping per card per day). They only fire while the site is open in a tab. So the auditor's conclusion is right even though the feature exists: we have an alert that only reaches people who are already here. That is not re-engagement, and I am not going to defend the C by pointing at it.

**What I am protecting and will not let an agent "improve":** sold-vs-ask labelling, the Track Record rules, the Tuesday cadence, the narrow universe, the voice. Those carry the A grades. Every line below is composition, findability and memory — no verdict wording, no price, no methodology, no affiliate link changes.

---

## 2. The grade contract

Fourteen rows — the audit's own scorecard, one for one. Each target has an exit criterion that a machine can check, so nobody grades this on vibes — including us.

| # | Area | Now | Target | Exit criterion (binary, checked weekly) | Owner | Week |
|---|---|---|---|---|---|---|
| 1 | Positioning / voice | A | **A** | Protect. Any copy change that softens the desk voice is a regression. | Content Editor | — |
| 2 | Trust & methodology | A- | **A-** | Protect. Sold/ask labelling and Track Record rules unchanged. | Pricing Integrity | — |
| 3 | Depth on chosen boards | A- | **A-** | Protect. No universe expansion (§5 freeze). | Engine Watch | — |
| 4 | Visual system | B+ | **B+** | Protect. Tokens only — no new colours, no new fonts. | Terminal Builder | — |
| 5 | Search | C+ | **A-** | `data/search-index.json` built nightly from the feed + `watchlist.json` + sets + nav; every marked card, every index ticker, every set and player page present. `holliday chrome auto` returns the **card row** (mark · signal · ★ Track) as result #1. `/` key focuses search from any page. Median time-to-mark for the 10 board cards **< 10 s**, measured in the interaction suite. | Terminal Builder | W1 |
| 6 | Coverage vs expectation | C- | **A-** | `<h1>` and `<title>` state the real universe. `/coverage` page auto-generated from the feed (sets marked, cards marked, last verified, what is explicitly not marked) — cannot go stale. Universe line in the rail foot on every page. Every guide not on the tape carries an honest "not marked — here's what is" line linking `/coverage`. | Content Editor + Builder | W1 |
| 7 | Mobile / show-floor | C | **B+** | All 14 audit pages **≤ 8 phone screens** (today: bowman-bangers 38.2, /auctions 45.9, bcb26 first data row 4,392 px). Sticky 4-item bar sitewide. Taps ≥ 44 px. 0 text < 11 px outside logged carve-outs. Viewport = device on 100 % of the 103-page sweep. Vault table readable at 390 w with no horizontal scroll. | Mobile QA + Builder | W1–W3 |
| 8 | Homepage as daily ritual | C- | **A-** | New `HOME:mine` block, **first block on `/`** for any visitor with a non-empty Vault: (a) my cards / hunting that moved since last visit, with the delta; (b) my cards with a live auction under the mark; (c) my signals that changed. Empty Vault → today's public markets panel, unchanged (anonymous behaviour is a non-regression gate). No number below 900 px desktop / screen 2 on phone. Home ≤ 6 phone screens. | Builder + Terminal Product | W2 |
| 9 | Actionability | B | **A-** | Every actionable row answers "what do I do today" in one line — mark, distance to target, auction closing, signal. Auction Desk present on the Home first screen for Vault holders (inside `HOME:mine`). | Builder | W2 |
| 10 | Flagship tools | B | **A-** | Auction Desk defaults to **vault + board overlap** with a "show all" toggle; overlap count in the rail pill. ★ Track on every surface a card appears (home rows, Markets, auctions, indices, card pages, search results). `+ New portfolio` `prompt()` → modal. Share PNG renders the **selected** portfolio, not the whole Vault. | Builder | W2–W3 |
| 11 | Information architecture | C | **B+** | The four destinations (Home/Tape · Vault · Auctions · Search) reachable in **one tap from every page**, phone and desktop: rail on every engine-bearing page (today: 5 of 103), sticky bar on phone sitewide. `nav.json` collapses to the four plus one **Research** parent; everything currently top-level moves under it. COMMON interaction scenarios cover all four on every page. GA4: **≥ 40 %** of sessions whose second pageview is one of the four. | Builder + CoS | W3 |
| 12 | Competitive polish | C+ | **B+** | `build-auctions.mjs` learns the step-4 terminal wrapper (regenerating `/auctions` currently **strips the rail** — the clearest unfinished tell in the tree). 0 dead controls · 0 dead links · 0 console errors held **4 consecutive** weekly crawls. Every page has an empty state and a loading state. 22 stale human stamps cleared; `roy-watch-2026` refreshed or 301'd; `/set-index-preview` 417 px overflow fixed or the page removed. | Bug Sweeper + Builder | W3–W6 |
| 13 | Persistence & multi-device | C- | **A-** | Sync code (§3.1): generated 6-word code (≥ 70 bits), AES-GCM encryption in the browser, blob written through `/api/vault-sync` to a `vault-data` branch keyed by SHA-256 of the code. Server never sees the code or the plaintext. Enter the code on device 2 → the Vault is there. Conflict banner shows both card counts and asks — **no silent overwrite of a 536-card Vault, ever.** 256 KB cap, rate limit, 90-day TTL with a purge job. Round-trip test added to `audit-terminal`. Rail foot copy updated to exactly what is true. | Sync & Alerts Engineer | W4 |
| 14 | Alerts / re-engagement | C | **B+** | Three triggers live: target hit · signal flip on a tracked card · auction under mark on a Vault card. **On-device tier:** all three fire as browser notifications plus a "what changed since your last visit" digest on `/`. **Email tier (§3.2):** a triggered *Signal Alert* on the public board/index universe — same list, same sender, working unsubscribe, **max one send per day**, every send logged in STATE.md. | Sync & Alerts Engineer + Content Editor | W5 |

**Overall return-user UX: C+ (72) → B+ (88).**

### 2.1 The one row I am rejecting

The auditor's wall grades include **"Readiness to beat Card Ladder at Card Ladder's game: D."**

I am rejecting that as a target, and saying so out loud rather than quietly leaving it off the table. Getting it to B+ means a vetted-solds catalog at scale, a portfolio graph across the whole hobby, and a cloud identity — a multi-year platform build, funded, with staff. Chasing it would break the freeze in §5 and burn the quarter the audit is telling us to spend on the daily loop. The same audit says so in its own words: *"You cannot out-catalog Card Ladder."*

**Substitution I am making instead**, and the one I will be held to: **"Readiness to be the best small desk in the hobby: B → A-."** That is the row the audit says is one quarter of product discipline away, it is measurable against the exit criteria in the table above, and it is the row that actually pays.

If you want the D driven up anyway, say so and I will cost it — but it is a different company, not a different sprint.

### 2.2 What the grades cost us if we do nothing

Returning users are **7.2 %** (70 of 977, week of Sep 14) against a 7.5 % baseline — flat. Google sends **1 first-user per 7 days**. The traffic we do get lands on release guides that convert at **0.0 %** (`/bowman-chrome-baseball-2026`, 69 sessions) because the first number on the page is eleven screens down. Every row above is aimed at one of those three numbers.

---

## 3. The two decisions Mo took (Sep 15) — both previously Needs-Mo

### 3.1 Vault persistence → **zero-knowledge sync code** ✅ APPROVED

The material finding: **we already own the infrastructure.** `api/_lib/store.js` is a zero-dependency JSON store backed by a dedicated GitHub branch, with `GITHUB_TOKEN` already provisioned in Vercel. The nightly price engine writes through it every day. So cross-device sync needs **no new vendor, no new spend, and no credentials from Mo.** The C- was never really blocked on money; it was blocked on nobody proposing a design that kept the privacy promise.

Design, as approved:

- The user clicks **"Sync this Vault"** and gets a generated **six-word code** (~77 bits of entropy — not a user-chosen passphrase, which would be brute-forceable offline against a public branch).
- The Vault is encrypted **in the browser** (AES-GCM; key derived from the code via Argon2id/PBKDF2). The blob is stored under `SHA-256(code)`. The server stores ciphertext under a hash and can decrypt nothing.
- Device 2: enter the code once → Vault present, and it stays in sync.
- Conflict handling ships **with** the first release, not as a P2. A silent last-write-wins that eats a 536-card Vault is worse than no sync.
- Rail foot changes from *"Free · no account · your Vault stays on your device"* to the version that is actually true once this ships. The privacy story survives intact — arguably stronger, because now it is a claim with cryptography behind it instead of a limitation with a nice name.

**One thing Mo should know, not a blocker:** encrypted user blobs will live on a branch of his GitHub repo. They are unreadable, capped and expiring, but they are his bytes. Flagging it because he would rather hear it from me now than notice it later.

### 3.2 Alerts → **triggered Signal Alert approved** ✅ APPROVED

Charter §3 reserved email to the weekly Tape Recap. Mo has approved a second, event-triggered type: same MailerLite list, same sender, working unsubscribe, **one send per day maximum**, fires only on a real crossing, every send logged.

**The constraint I am not going to paper over:** Vaults are device-local (and, after §3.1, encrypted server-side). We therefore **cannot** email a subscriber about *their* cards — we cannot read them, by design. So the two tiers split:

- **Email tier** = the desk's alerts on the **public** board and index universe. "BOW26 crossed X." "Three board cards closing under the mark tonight." Real, timely, list-wide.
- **On-device tier** = the personal layer: target hit, signal flip, auction under mark, plus the since-last-visit digest — accurate to the individual, but only reaches them once they open the site.

That split is honestly a **B+**, not an A. An A needs a personal alert list (card IDs + target + an email address), which is PII in a new store and a separate decision. Parked, not forgotten — it goes to ROADMAP with the trigger being 20 % returning users for four straight weeks, the same gate as the contributor program.

### 3.3 Still waiting on Mo (physical actions only)

1. **MailerLite is signed out in Chrome Browser 1.** This blocks the weekly recap (already drafted and verified, unsent since Sep 14) *and* the new Signal Alert type. One sign-in at dashboard.mailerlite.com and both resume. The CoS never enters credentials.
2. **Fischer "Verdict: Buy" vs the engine's gated HOLD** — one word, *keep* or *soften* (open since Sep 14; it touches the calls ledger, so the engine-wins rule cannot auto-fix it).
3. **Off-site link posts** — two drafts ready (`claude/recaps/link-post-2026-09-08.md`, `-09-14.md`); posting needs a human account. Google indexes on authority and the site has one external link; this is quietly the biggest lever on Problem 1 in STATE.md.

---

## 4. Sequence — six weeks

Do these in order. Nothing here is "start a new sport instead."

**Week 1 · Sep 15–21 — Findability.** Card-level search index and the search UI that uses it (row 5). `/coverage` + the `<h1>`/`<title>` universe fix (row 6). Sticky 4-item phone bar (rows 7, 11). Ships alongside the already-scoped step-5 folds — bowman-bangers, bcb26, bowman-football — which also serve the 0.0 %-conversion problem. *Three rows move on the cheapest work in the program.*

**Week 2 · Sep 22–28 — The return screen.** `HOME:mine` and since-last-visit (row 8). Auction Desk scoped to Vault overlap (rows 9, 10). ★ Track everywhere a card appears (row 10).

**Week 3 · Sep 29–Oct 5 — Reach and finish.** Rail on every engine-bearing page; `nav.json` collapsed to four + Research (row 11). `/auctions` phone fold and the `build-auctions.mjs` wrapper fix (rows 7, 12). Dead-control zero.

**Week 4 · Oct 6–12 — Memory.** `/api/vault-sync`, the crypto, the code UX, conflict handling, the round-trip gate (row 13).

**Week 5 · Oct 13–19 — Alerts.** On-device triggers for signal flip and auction-under-mark; the since-last-visit digest; the Signal Alert email type and its send log (row 14).

**Week 6 · Oct 20–26 — Harden and re-grade.** Polish sweep to close row 12's four-week clean streak. Two full weeks of the new metrics in hand. Self-grade against all 14 exit criteria — published, pass/fail, no partial credit.

**Nov 2 — outside re-audit, same auditor, same return-user lens.** We do not grade our own homework. If we self-score B+ and the auditor says C+, the auditor is right and the exit criteria were written too kindly.

---

## 5. Operating changes — how the agent team gets run from here

The audit's sharpest paragraph is the one about the operating brief, and it lands. Agents optimise for what they are measured on, and they have been measured on shipping pages.

**Stop measuring:** pages published · sports covered · words shipped · nav items added.

**Start measuring** (instrumented W1, read weekly by Terminal Product):

| Metric | Today | Target by Oct 26 |
|---|---|---|
| 7-day return rate | 7.2 % | ≥ 12 % |
| 30-day return rate | — | instrumented, baselined |
| Sessions whose 2nd pageview is one of the 4 | — | ≥ 40 % |
| Vault cards still present after 7 days | — | instrumented, baselined |
| Search → card success | 0 (no cards in the index) | ≥ 60 % of searches |
| Time to mark, known card | untestable | < 10 s |
| Tuesday Tape → site click-through | — | instrumented |
| Auction Desk clicks on Vault-overlapping cards | — | instrumented |

**Freeze — nothing on this list happens before Oct 26:**

- No new sports verticals.
- No new guides for sets that are not on the tape.
- No new nav items (the count goes down, not up).
- No supplies or gear folds on player pages — they dilute the desk.
- No duplicate "ultimate guide" that restates the Board.

**Roster (Charter §2 amendments, logged):**

- **New — Sync & Alerts Engineer.** Owns `/api/vault-sync`, the browser crypto, the trigger evaluator and the Signal Alert send. Created because this work is serverless + cryptography + email, and the Terminal Builder is a page builder; handing it to him would get it half-done. **Retires when rows 13 and 14 are green.**
- **Terminal Builder** gains search and findability (row 5) on top of the step-5 folds.
- **Vault & Funnel** gains the on-device trigger layer and the since-last-visit digest.
- **Terminal Product** owns the return-user scorecard weekly — the 8 metrics above, one proposed change per week, with the number behind it.
- **UX Auditor** adds a **ninth dimension — Return-user system** — scored against the §2 exit criteria and appended to `claude/reaudit-log.md` every Monday. A row that slips back below its exit criterion is a regression and gets fixed that week.
- **Human lock, unchanged and reaffirmed:** every BUY/SELL sentence stays Mo's or the editor-of-record's. Agents draft tables and scrape. **Agents do not expand the IA.**

---

## 6. Risk register

| Risk | Read | Mitigation |
|---|---|---|
| `HOME:mine` turns `/` into a lander and kills the 1m37s engagement | Real — `/` currently works *because* it is a bookmark surface | Anonymous behaviour is a non-regression gate in `audit-terminal`; Product reads landing mix weekly |
| Sync code lost by the user = Vault gone | Certain to happen to someone | Export JSON stays the escape hatch and is surfaced *at the moment the code is generated*, not buried in settings |
| Encrypted blobs on a public branch | Ciphertext only, high-entropy generated codes, 256 KB cap, 90-day TTL | Purge job in the nightly; abuse rate-limited at the API |
| Signal Alert becomes noise and burns the list | The fastest way to lose the only owned channel | One send per day hard cap, real crossings only, unsubscribe rate reported weekly |
| Six weeks of no new pages costs SEO momentum | Google sends 1 user/week — there is no momentum to cost | Consolidation and `/coverage` are *better* for indexing than more thin pages |
| We self-grade generously | The most likely failure in this document | Nov 2 outside re-audit; exit criteria are binary and published in advance |

---

## 7. What this looks like if it works

A returning collector opens the bookmark. The first thing on screen is three of his cards with what they did since Tuesday, one auction on a card he owns closing under the mark in four hours, and one signal that flipped. He types four letters into a box that is always in the same place and gets the mark in under ten seconds. On his phone at a show, the same four things are one thumb-tap away. His Vault is on both devices without him having given anyone an email address.

That is not a bigger site. It is a smaller one that remembers him.

---

*Filed by the Chief of Staff, Sep 15 2026. Program owner: CoS. Re-graded Nov 2 2026 by the outside auditor. Mo's veto is absolute and retroactive on every line above.*
