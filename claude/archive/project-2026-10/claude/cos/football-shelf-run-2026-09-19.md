# The football shelf — CoS run, 2026-09-19 afternoon

**Mo, in chat:** *"please review this document and update/add to the football pages ASAP since it is
football season!!! I'm going to be gone for a few hours so go ahead and do what you need."*

**Status: done and live.** Two commits — `c0398f9` (site) and `663fe85` (state + ledger) — pushed
from a fresh deploy-key clone on the Mac. Seven football pages verified md5-identical against
production at ~22:45Z. IndexNow 200. Gates in the clone: **audit-prices 0 FAIL / 60 WARN ·
audit-site 0/3 · audit-terminal 0/1.**

Read at STEP 0 from the clone taken this run: `/LANE-RULES.md` (R1–R11), `claude/cos/STATE.md`,
`data/pipeline.json` (134 proposals, now 139). HEAD at start `45bb59c` = `origin/main`, delta 0.

---

## The headline: the filing was right about the symptom and the real defect was underneath it

X Desk Watch filed football as a conversion finding — an 88-session page converting at 1.1% while a
65-session page converts at 15.4% — and proposed testing the price point. That is a good finding and
it is now tested. But the page it held up as the one that *works*, `/nfl-rookie-cards-2026`, turned
out to be the bigger problem.

**It ranked and priced "2026 Topps Chrome NFL" cards. That product has not released.**

Checked live, September 19:

| Search | Listings | Median |
|---|---|---|
| **2026** Topps Chrome Football hobby box | **2** (one mislabelled basketball) | — |
| **2025** Topps Chrome Football hobby box | **237** | $739.99 |

PriceCharting's football catalogue agrees: 2026 has **Topps Flagship**, its **1991 35th Anniversary**
insert sets, and **NFL Living**. There is no 2026 Chrome set. The 2025 Chrome market is real and deep;
the 2026 one does not exist yet.

And the page's own eBay buy link — `2026 Topps Chrome NFL Fernando Mendoza RC Auto` — returned
**zero listings**. A dead shelf, on the page with the best key-event rate on the site.

`/best-football-cards-under-50` had the same defect wearing different clothes: it recommended
**Panini Prizm and Optic** parallels for a class that is in **Topps**.

This is R8's naming collision, in football, on the money page. Filed `cos-2026-09-19-1`, FAIL.

---

## Football now has sold comps, and they were free the whole time

The filing's item 4 was *"put football in the engine."* **Declined as written**, and the reason is
recorded so nobody spends a session re-proposing it:

> The 2026 class trades at **$1.44–$3.99**. `snapshot-free.mjs` rejects any listing under **$3** as
> `no usable price`. An ask engine with a $3 floor cannot see this market at all.

What works instead is the **September 17 SV151 unlock, reused**. PriceCharting's public item pages
carry their completed-auction rows in the HTML, unauthenticated — and their catalogue covers 2026
Topps Flagship. So football gets **dated sold comps**, which is a better basis than five of the
eight live tickers run on.

**`tools/football-solds.mjs`** (committed) reads eight cards; **`data/football-solds-2026-09-19.json`**
(committed) is the evidence behind every football figure published today. 8/8 cards, 0 failures,
re-runnable.

| Card | Sold median | Sales in read | Window | Volume |
|---|---|---|---|---|
| Mendoza — Flagship RC **#301** | **$2.87** | 30 (capped) | Sep 18 | ~7/day |
| Mendoza — 1991 35th **#91TR-1** | **$3.99** | 30 (capped) | Sep 16–18 | ~4/day |
| Mendoza — **Real One auto /91** | *no mark* | **2** | Aug 31, Sep 10 | ~1/wk |
| Tate — Flagship RC **#318** | **$1.44** | 30 (capped) | Sep 1–14 | ~1/day |
| Tate — 35th **#91TR-18** | **$1.79** | **19** (complete) | Aug 28 – Sep 16 | ~1/day |
| Love — Flagship RC **#309** | **$1.50** | 30 (capped) | Sep 11–16 | ~4/day |
| Love — 35th **#91TR-9** | **$1.99** | 30 (capped) | Sep 1–17 | ~2/day |
| Bailey — Flagship RC **#343** | **$1.59** | **14** (complete) | Aug 26 – Sep 17 | ~1/day |

Two properties every page publishing these has to carry, and does:

1. **A 30-row read is "the 30 most recent," not "30 in the window."** The list is capped. The date
   range and the volume line are what say how fast they accumulated. Fewer than 30 is a complete count.
   (Same censoring property disclosed for SV151.)
2. **Graded is empty and the pages say so.** `gradedDatedRows` is **0** on all eight cards, so every
   football page reads *No verified sale* at every grade.

### The Real One autograph, which is the one genuinely interesting card here

Two dated sales, ever: **11/91 at $252.00 (Aug 31)** and **68/91 at $175.00 (Sep 10)**. The live ask
book is **21 listings starting at $725, median $1,300** — and reading the titles explains it: most of
them are **redemptions**, claim tickets on a card Topps has not printed, not the numbered card that
sold. Two sales is a data point, not a price, so **no mark was published**. What went on the page is
the gap itself, which is exactly the sort of thing the site exists to say.

---

## What shipped, page by page

- **`/nfl-rookie-cards-2026`** — ranked section rebuilt on five cards that exist. June figures
  (**$400+** raw Mendoza auto, **$1,349** Tate Black Shimmer) **withdrawn and not restated** — the
  same handling as the graded-ladder retraction. Teams corrected: **Love is Arizona** (the page said
  "undisclosed"), **Bailey is the Jets** (unsaid). Both read off the titles of the sales themselves —
  the cheapest fact-check available, and one we should have run in June. Pre-Week-1 timing advice
  replaced in Week 3. Buy strip repointed off the dead query.
- **`/bowman-football`** — `iw-2026-09-19-3` applied: the "debut-year rule" bullet contradicted the
  page's own correct paragraph *and named it as the mistake to avoid*. Release **re-dated Sep 30**
  (13 of 18 dated presale titles), so the index the page promises lands **mid-October**. Two cheaper
  price points added and in the strip — **value blaster $42.97** (14 live), **mega box $79.99** (50+)
  — beside the **$368.99** hobby box that was the only offer above the fold.
- **`/best-football-cards-under-50`** — rewritten. 8 picks, every one a dated sold median.
- **`/topps-flagship-football`** — the set page for the set that *holds* the class gains the
  base-rookie table. Its banner stat **"Comps — forming"**, true since August, becomes **$1.44–$3.99**.
  The line that matters to a reader: a **$119.99–$129.99 box** produces base rookies of the entire top
  of the draft class that sell for **a dollar and a half to three dollars**.
- **`/fernando-mendoza-rookie-cards`** — 0 landing sessions in 28 days on the #1 overall pick. Re-read:
  **RC #301 is down 37%** from our Aug 31 ~$4.56 to $2.87. Real One row added.
- **The two 2025-branded pages** cross-link into the priced class — which is also how Mendoza gets
  surfaced (filing item 6). His page is now linked from four football pages instead of one.

---

## One of mine, and it had been live for three days

`/fernando-mendoza-rookie-cards` carried **"PSA 10 ~$51"** with no sale behind it. That is precisely
what Mo's September 16 graded-ladder ruling forbids, it survived the remediation, and **no gate saw
it** — the same hole as last week: we gate structure, not meaning. Stripped today; the row now reads
*PSA 10: no verified sale*.

## A correction to the filing (`cos-2026-09-19-4`)

Its Finding 4 called `/topps-cosmic-chrome-football` and `/topps-chrome-black-football` "2025
products." They carry 2025 **branding** and 2026 **release dates** — Jun 19 and Jul 10, 2026 — which
is normal in football, where the product year trails the season. **Re-dating them would have been the
error.** The lane's observation (zero sessions, disconnected from the live class) was right; its
diagnosis was not, and that is not held against it.

---

## Numbers, freeze, and what is still open

**Gate baseline moves 63 → 60 WARN on `audit-prices`, and it is a decrease with a named cause:** three
pages gained `data-prices-updated` stamps in this push, clearing three `no-machine-stamp` WARNs off the
34-page backlog. **New stated baseline 60/3/1.** A lane comparing against 63/3/1 is stale.

**Freeze:** every page touched already existed. No new page, no new nav item, no new vertical. Mo's
"make some updates/pages" cleared the "no new nav items" clause and **it was not needed** — recorded
and unspent.

**Booked, and nobody owned it until now: re-read `/bowman-football`'s key-event rate on or about
October 3**, two weeks out, against the 1.1% baseline. The cheaper offers exist to test Finding 1, and
a test nobody reads is not a test. A scheduled task now carries it.

**Still open, deliberately, for the Wednesday build:** wiring `tools/football-solds.mjs` into a
cadence, and whether a football index can be constituted on it once 2026 Bowman Football prints solds
in mid-October. Both are structural decisions and neither was taken unattended on a Saturday.
