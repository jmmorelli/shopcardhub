# Filing for the Chief of Staff — the football shelf, and why it is a conversion finding, not a staleness complaint

**Filed by X Desk Watch, 2026-09-19 ~14:1x PT.** Raised by Mo in chat the same hour: *"write something
about the football thing being stale for the chief and I will have him take a look at it and make some
updates/pages now that it is football season."*

HEAD `45bb59c` · origin/main `45bb59c` · delta 0 commits · fresh HTTPS clone in `$HOME` scratch.

**How this was read.** Page inventory from the fresh clone; traffic from the nightly GA4 snapshot
(`ga4-latest.json`, generated 2026-09-19 12:44Z, day 2026-09-18 — the keyless read, no browser);
`/bowman-football` re-verified **live in a browser** at 14:0x PT (R5). **R6: nothing in the project or
`pipeline.json` has filed football coverage before — this is not a re-file.**

**This lane does not build pages and is not asking to.** It found this while sourcing a Sunday football
post for the vendor and could not write the post honestly. The CoS rules; a build session ships.

---

## The headline, and it is the opposite of what "stale football pages" sounds like

**Football is 14.8% of the site's landing sessions and 15.3% of its key events — on copy between
three weeks and three months old.** It is the second-biggest sport on the site by landing traffic,
behind Pokémon, and it is the only sport with no live price anywhere on it.

| 28d landing (GA4, to Sep 18) | Sessions | Key events | KE rate | Avg session |
|---|---|---|---|---|
| `/bowman-football` | **88** | 1 | **1.1%** | 64s |
| `/nfl-rookie-cards-2026` | 65 | 14 | **15.4%** | 163s |
| `/topps-chrome-black-football` | 8 | 0 | 0% | 115s |
| `/topps-flagship-football` | 7 | 0 | 0% | 43s |
| `/topps-cosmic-chrome-football` · `/best-football-cards-under-50` · `/fernando-mendoza-rookie-cards` | **0** | 0 | — | — |
| **Football total** | **168** | **15** | 8.9% | |
| Site total (landing28) | 1,135 | 98 | 5.6% blended · 7.5% organic | |

`/bowman-football` is the **5th-biggest landing page on the whole site**. `/nfl-rookie-cards-2026` has
**the highest key-event rate of any page on the site with real volume** — 15.4% against a 5.6% blended
site rate — and it is stamped **"Updated June 2026."**

---

## FINDING 1 · The 14× conversion split inside football, and the likely cause

Two football pages, similar traffic, **14× apart on conversion**:

- `/nfl-rookie-cards-2026` — 65 sessions, 14 key events, **15.4%**, 163-second sessions. Content is
  **rookie singles**. Buy strip `"live": false` (no price shown), hero query = a Mendoza Chrome rookie auto.
- `/bowman-football` — 88 sessions, 1 key event, **1.1%**, **64-second** sessions. Verified live at
  14:0x PT: the only offer above the fold is **"2026 Bowman Football hobby box · ask from $370.99 ·
  48 live."** Below it the page says, correctly and by design, *"No sold comps exist yet — every
  market read below is structural, not priced. We do not publish guesses."*

**The hypothesis, stated as one:** our highest-traffic football page sends everyone who lands to a
**$371 sealed box** and nothing else, and they leave in a minute; the page that converts offers
**singles**. That is a price-point and intent mismatch, not a copy problem. It is cheap to test — add
a second, lower-priced offer (pre-order singles, a blaster, the NIL auto search) beside the box and
watch the rate for two weeks. **R11 is satisfied on both pages today** — every football page is in
`data/buy-strip.json` — so this is not a missing-link finding; the link is there and it is pointed at
the wrong shelf for the audience arriving.

## FINDING 2 · Football is the only sport on this site with no live price — anywhere

Verified in the fresh clone:

- **Zero `data-engine-slug` blocks across all seven football pages.** Every Pokémon and baseball guide
  carries nightly engine marks; football carries none.
- **No football ticker.** Eight live indices — PB26, CR26, AH26, PRIS25, DR25, PF25, BCB26, BOW26 —
  five Pokémon, one mis-sectioned Pokémon, two Bowman baseball. No football.
- **No football card in the nightly feed at all** — nothing in `calls.json`, `watchlist.json` or the
  index baskets. Football appears only in `buy-strip.json` (affiliate), `nav.json` and `card-images.json`.

So every football number on the site is **hand-typed prose with a date on it**, and the dates are
June 2026 (`/nfl-rookie-cards-2026`, `/best-football-cards-under-50`), Jun 22
(`/topps-cosmic-chrome-football`), Aug 25 (`/topps-flagship-football`, `/topps-chrome-black-football`)
and Aug 31 (`/bowman-football`, `/fernando-mendoza-rookie-cards`). Nothing refreshes itself.

**There is also a published promise to honour.** `/bowman-football` states on its face: *"at release it
converts to a live set index with sold-comp tracking"* and *"when real eBay solds print (~2–3 weeks
post-release), this page gains a live index with per-card marks."* Pre-orders opened **Sep 8**. That
clock is running in public.

## FINDING 3 · Conversion went to zero in the week the season started

Last 7 days: `/bowman-football` 20 sessions, `/nfl-rookie-cards-2026` 8, `/topps-chrome-black-football`
2 — **30 football sessions, 0 key events.** Small n, so it is a flag and not a trend (G8's ~30-action
rule applies to EPN actions, and this is 0 of 30 sessions) — but it is the wrong direction in the one
week football traffic should be climbing, and `/nfl-rookie-cards-2026` fell from 65 sessions in 28d to
8 in 7.

## FINDING 4 · Three of seven football pages drew zero sessions in 28 days

`/topps-cosmic-chrome-football` and `/topps-chrome-black-football` are **2025 products** carrying
Jun 22 / Aug 25 stamps. `/best-football-cards-under-50` is June copy. `/fernando-mendoza-rookie-cards`
— the #1 overall pick and Topps cover athlete, Aug 31 reads — drew **0 landing sessions in 28 days**,
which is a discoverability problem, not a demand problem: he is the hero query on the page that
converts best.

---

## Proposed order, cheapest first — the CoS rules, a build session ships

1. **Fix the R8 bullet on `/bowman-football` (minutes).** Already filed this morning as
   `iw-2026-09-19-3` (HIGH) and **re-verified live at 14:0x PT** — the "debut-year rule" bullet is on
   the rendered page, contradicting the page's own correct paragraph. **This also gates Sunday's
   football post**, which is held in `vendor-brief-2026-09-19-weekend-posts.md` until it ships.
2. **Re-stamp and re-price `/nfl-rookie-cards-2026`.** Highest-converting page on the site, running
   June copy in Week 3 of the season. Refresh the sold comps, name the rookies who are actually
   playing, re-stamp. This is the money page and it is the cheapest win on the list.
3. **Give `/bowman-football` a second, cheaper offer** beside the $370.99 box and re-read the rate in
   two weeks. Tests Finding 1 for the price of a `buy-strip.json` entry.
4. **Put football in the engine.** The durable fix, and the one that ends this whole class of finding:
   a handful of football slugs in the nightly feed so the top two pages carry live marks, and — when
   Bowman Football solds print — the set index the page has already promised. Sizing and basket rules
   are the CoS's call, not this lane's.
5. **Rule on the three zero-traffic pages**: refresh, redirect, or leave them as SEO surface with an
   honest stamp. Do not leave 2025 products looking current.
6. **Surface Mendoza** from `/nfl-rookie-cards-2026`, where his card is already the hero query.

**What this lane would not do:** invent a football index before there are sold comps behind it, or
re-date a page without re-reading its prices. A fresh stamp over stale numbers is worse than an honest
old stamp — that is the same defect class as the carried-mark narration the board was corrected for on
Sep 17.

## The freeze, and the authority to cross it

STATE's **freeze through Oct 26** reads: *"no new sports verticals, no new guides for sets not on the
tape, no new nav items."* Items 1–3, 5 and 6 above are refreshes of existing pages and clear it
untouched. Item 4, and any **new** football page or nav item, does not.

**Mo cleared it in chat today** — *"make some updates/pages now that it is football season"* —
which is the same shape as the PF25 exception on Sep 18 (**recorded, not a precedent**). Football is
an existing vertical, not a new one; the freeze language that binds is "no new nav items," and that is
the piece Mo's instruction releases. Recorded here so the build session does not have to guess and so
the exception is on the record rather than discovered later in a diff.

---

**Boundaries:** read-only throughout. No git beyond reading a fresh clone. Nothing posted, nothing
sent, the vendor app not opened, nothing committed. GA4 read from the keyless nightly snapshot, not a
console. Everything above is a finding for the CoS to rule on, not a work order.
