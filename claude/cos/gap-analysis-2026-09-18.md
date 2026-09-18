# eBay (EPN) + GA4 gap analysis — where the money stops (overnight 2026-09-17/18)

**Ask (Mo):** "look at both eBay and Google Analytics and analyze our gaps."

**What this is built on.** Every number below is from a read already on the record — GA4 reads of Sep 16 and 17 (STATE.md), EPN reads of Sep 4 and Sep 8 (memory + Mo's own screenshot), the Aug 25 baseline, and the code inventory taken tonight from a fresh clone. **No console was opened tonight**: two Chrome browsers are connected to the account and the browser tool refuses to pick one without Mo choosing — that question is waiting for him this morning, and the fresh Sep 8→18 EPN read plus the first clean post-Sep-17 GA4 read get appended to §6 the moment it is answered. Nothing here depends on it; the shape of the gap does not change with one more week of data.

---

## 1. The funnel, in numbers

| Stage | Number | Source · window |
|---|---|---|
| Sessions | **851** in 17 days (≈50/day) — Organic Search 459 · Direct 348 · Organic Social 23 · Referral 2 | GA4, Sep 1–17 |
| …of which junk | Direct runs ~8-second sessions; roughly a third of all sessions are our own sweeps / scrapers (Singapore cluster 57 users/7d) | GA4 Sep 14, Aug 25 |
| Real humans | ≈ 20–30/day | Sep 8 Business Read |
| Search engine mix | Bing 137 · Yahoo 40 · DDG 23 · **Google 10** · Ecosia 2 (7d) — Google is ~4% of search; GSC 3 indexed / 74 not | GA4 + GSC, Sep 14 |
| Returning | **~7.5%** (Aug: 837 of 838 users were new) | GA4 Sep 8 / Aug 25 |
| Scroll at all | 18% of users | GA4 Aug 25 |
| Outbound eBay click (`click`) | **~150 / 28d ≈ 5.4/day**; ≈10% of users click | GA4 Sep 16 |
| Save a card (`track_card_from_page`) | ~20 / 28d, from ~5 users | GA4 Sep 16 / Aug 25 |
| Email signup | **1 / 28d**; 6 subscribers, 4 active | GA4 + MailerLite, Sep 16 |
| EPN clicks | **6.0/day** (Aug 25–Sep 8), up from 3.8/day (Jul 11–Aug 24) | EPN Sep 8 |
| EPN 60-day | 256 clicks · 41 actions · $2,359 sales · **$70.76 earned** → **$0.28 per click**, ~3.0% of GMV | EPN header, Jul 11–Sep 8 |
| EPN 30-day (best) | 104 clicks · 11 txns · $2,157 · **$64.70** — **one $1,950 sale paid $58.50 of it** | EPN Aug 20–Sep 2 |
| EPN 30-day (typical) | 170 clicks · 34 txns · $211 · **$6.31** | EPN Jul 26–Aug 25 |
| Who actually buys | **Two real buyers in Aug 25–Sep 7**, both on **phones**; the big one landed on an eBay *search* page, bought 90 min later | EPN transaction detail, Sep 4 |
| Attribution | **99.6% of revenue is "No Custom ID"** — the eBay app's link handoff on phones drops `customid`; desktop keeps it | EPN Sep 4 |

**Run-rate, stated honestly:** trailing 60 days ≈ **$35/month**; the best 30-day window was $65 on one sale; the median month is single digits. Mo's break-even bar is ~$300/mo (Sep 3 budget rule). "About halfway" is right only if the Aug 31 sale repeats every month; on the 60-day figure the site is at about a tenth.

## 2. The arithmetic of the milestones

Earnings = clicks × $/click. Tonight's measured $/click is **$0.28** (60d) and it is almost entirely one sale; the eBay rate on what we sell is **~3% of GMV** (the $1,950 sale paid $58.50 — measured, not the rate card).

| Milestone | At $0.28/click | As eBay GMV at 3% | In "PCA-sized" ($1,950) sales |
|---|---|---|---|
| Break-even ~$300/mo | 1,070 clicks/mo (36/day, **6×** today) | $10k GMV/mo | 5 / month |
| **$1,000/mo** ("amazed") | 3,600 clicks/mo (120/day, **20×**) | **$33k GMV/mo** | 17 / month — one every ~2 days |
| **$10,000/mo** ("home run") | 36,000 clicks/mo (1,200/day, **200×**) | **$333k GMV/mo** | 170 / month |

Two things fall out of that table and they are the whole strategy:

1. **$1k/mo is not reachable on volume alone from this traffic.** 20× clicks means 20× real visitors (the click-through rate is already ~18% of real sessions, which is high). That is a Google-indexing and links problem we have been losing for two months. Volume matters, but it is the slow lever.
2. **$/click is the fast lever, and it is basket size.** A visitor who buys a $2 common pays us $0.06; a visitor who buys a $500 booster box or a $700 PSA 10 auto pays $15–$21. The one buyer who mattered bought a $1,950 card off a *search* landing. Everything we build to convert should be pointed at the **high-end sealed product and the graded/auto singles that our indices and the board already track** — not at "best cards under $50" pages. This is exactly Mo's Sep 4 thesis (quality over quantity, high-end chasers) and R11 (sealed product above the fold), now with the number that justifies it.

## 3. The gaps, ranked by revenue impact

**G1 — We cannot see which page earned the money.** Phones drop `customid`; `/` (the return surface, 1m37s engagement) emits **no GA4 click event at all** and its only eBay links share `customid=auctions` with `/auctions`; GA4 key events were a dead instrument Sep 4–16, so no retention or conversion number from that window is valid; and nobody has ever joined the EPN transaction timestamps to the GA4 `click` stream. Every attribution-based decision on this site since June has been made half-blind. *Fix (this week, auto-approved):* `click` gtag + `customid=home-*` on the dashboard; weekly EPN↔GA4 join (±1 min, page_location + device) written into STATE as the standing "which page paid" table; the GA4 service account (repo-scan §1.1) so the read is daily and browserless — that last one needs Mo's yes.

**G2 — The landing pages that get the traffic do not offer the product.** 28d: `/pokemon-30th-anniversary-2026` 159 sessions / 10.7% KE; `/bowman-chrome-baseball-2026` 69 / **0.0%**; `/bowman-football` 71 / 1.4%; player pages 10–13%. The first eBay link sat 3–4 sections deep on 58 pages until Sep 17. *Fixed Sep 17 (R11 buy strips, live on 58 pages + the 30th module).* **Sep 18 onward is the first clean read** — the Gengar Monday beat owns whether the strips move the 0.0% page.

**G3 — The buyers are on phones, and phone traffic lands on eBay search pages.** Listing-level links (the `/api/comps` live asks) converted at 39% on the Sep 4 read; static search links converted to four sub-$3 sales. The buyer who paid $58.50 found the card himself on eBay search after our click. *Fix:* every buy strip and engine block should prefer a **specific live listing** (cheapest clean single-unit ask, which `/api/comps` already computes) over a search URL, so the last click is a card with a price on it. Half built — the strips print the ask; they should link to it.

**G4 — Retention is ~7.5% and the loops that would raise it are half-wired.** No "since last visit" on `/`; alerts fire only while the tab is open; search cannot find a card; ★ Track absent on the four return surfaces; email ask on the wrong page with 12 inconsistent `source` strings; 6 subscribers. All ten holes are itemised in repo-scan §3 and most are already on the W1–W6 calendar (Sep 15 → Oct 26). *Nothing new to decide; the sequence stands.* The retention number to grade it on is the **organic-channel key-event rate**, first clean read **Sep 24**.

**G5 — Acquisition is one engine deep.** ~95% of search sessions come via Bing's index (Bing/Yahoo/DDG/Ecosia); Google sends ~10 sessions a week and indexes 3 pages; Referral is 2 sessions in 17 days; the only Reddit "link post" was a 1-point comment that sent nobody; X is now vendor-run (Grok Bot) and is our best-engaging channel at 30 sessions/28d. *Ruling stands:* technical SEO is closed; Google is a links game; **the links channel has never been properly tried** — one real submission (content in the body, link as the receipt, a subreddit whose topic matches) measured on referral sessions is the experiment, and the board's published ranking-rule change or the 151 index (once live) is the material.

**G6 — Analytics denominators are polluted.** A third of sessions are agents; the blended KE rate is diluted by design. *Ruling stands (Sep 16):* report the organic-channel rate beside the blended; the IP filter is P2 (egress IP churns).

**G7 — Amazon Associates is on a clock.** The supplies page is exempt from R11 because it is Amazon-lane, and that account closes without **3 qualifying sales by ~late Dec 2026**. Either it earns three sales by then or we convert the page to eBay deliberately. *Decision for Mo at the Oct 1 roster review, not now.*

**G8 — Two real buyers a fortnight is not a sample.** Conversions arrive as bursts from single clicks (one Aug 29 click → five vintage purchases). At this scale a zero week is normal and a good week is one person. **No lane draws a trend from fewer than ~30 actions**; the milestones in §2 are graded on trailing-30-day EPN earnings across two consecutive reads, never on one sale.

## 4. What to do about it — the ranked list

1. **Instrument the money (G1)** — dashboard `click` events + distinct custom IDs; EPN↔GA4 weekly join into STATE; GA4 service account (Mo: one yes). *Wed build session + Mo's morning.*
2. **Link to listings, not searches (G3)** — buy strips and engine blocks deep-link the cheapest clean ask. *Wed build session; measurable in EPN "Custom ID" within 2 weeks on desktop.*
3. **Grade the R11 strips on the 0.0% page (G2)** — Gengar Monday beat, Sep 21 and Sep 28 reads; if `/bowman-chrome-baseball-2026` is still under 3% KE after two weeks with a strip above the fold, the page's content is the problem, not the link placement.
4. **Keep the return-user calendar exactly as scheduled (G4)** and grade it on the organic KE rate from Sep 24.
5. **Run one real links trial (G5)** — a submission, not a comment; the board ranking-rule change is the material; judged on referral sessions in GA4 after 7 days. Needs Mo's human account: drafted by the Content Editor, on NEEDS-MO when the copy is clean.
6. **Point the Ideas Desk at $/click first, clicks second** — its brief carries the §2 table so every idea is scored against basket size before traffic.

## 5. What is *not* a gap (so it is not re-litigated)

Technical SEO (verified clean Sep 16). EPN link compliance (92/92 tagged, `mkevt=1`, labels; review closed Sep 8). The nightly engine (healthy, 34 cards, 31/34 numeric). The Sep 2 compliance change did not cost clicks (up 69% week-on-week after it). Paid acquisition (ruled out Jul 28 — the arithmetic above confirms it: $0.28/click cannot clear any CPC).

## 6. Fresh console read — pending Mo's browser choice

*To be appended: EPN Performance by Day Sep 8→18 (clicks/day, any actions), Performance by Custom ID with the new per-product IDs live since Sep 17 (first desktop attribution), GA4 Sep 17→18 landing pages + `buystrip_click`/`buybox_click` counts, and the Singapore cluster's landing pages.*
