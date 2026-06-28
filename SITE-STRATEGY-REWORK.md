# ShopCardHub — strategy + nav rework (planning only, Jun 27 2026)

Not for push. Companions: `mockups/nav-redesign-mockup.html`, `mockups/concept-b-site-mockup.html`.

## Decisions locked (Jun 27 2026)
- **Direction = Concept B (dashboard hub), hybrid homepage.** `/` shows live tool
  widgets up top + a crawlable research-links section below (keeps homepage SEO).
- **Flagship to build first = Bowman Bangers prospect board** (+ shared watchlist engine).
- **SEO pages stay at their current root URLs** — they move under "Research" in the
  nav/hub but never change address. Tools (board/watchlist/portfolio) = noindex.
- **Dashboard cards are summaries that link to full tool pages.** Each card header
  (Signal Board, My Watchlist, My Portfolio) is clickable + a "View all →" affordance
  → deep page (sortable/filterable board, full watchlist, full portfolio ledger).
- Still open: homepage hybrid exact balance (how much marketing hero to keep);
  email platform choice. Build order in §8.

---

## 1. The actual problem (it's not the nav layout)

The single-source nav cleaned up *how* the nav is built and grouped. It did not fix
*what the site is*. Right now ShopCardHub is ~38 SEO landing pages — guides, set
guides, player pages. That's an **acquisition machine** (Google sends one-time
visitors) bolted to **zero retention mechanics**. Every page is a dead end: read
once, maybe click an affiliate link, leave, never return.

- "Cluttered" is a symptom. The nav feels cluttered because it's a **library card
  catalog** — an index of content organized by sport/set/player. That taxonomy
  grows linearly forever and has no spine.
- "Sporadic" is a symptom. The content is release-driven (every new set = a new
  page), so it reads as a pile of one-offs with no through-line.
- "No reason to come back" is the disease. Nothing on the site **changes** for the
  user between visits, and nothing is **theirs**.

Monetization — affiliate (eBay/Fanatics/Amazon) and your own COMC inventory —
scales with **trusted, returning sessions**, not raw pageviews. A return visitor
converts far better than an SEO lander. So the ROI ceiling is capped by retention,
and retention is currently ~0.

## 2. The asset you're underusing

Guides are a **commodity** — anyone can write "best cards under $50," and you're
competing with the whole internet for that SEO. Your defensible moat is the thing
nobody else combines:

> **Live data + tools + your honest TA / EV point of view.**

That's the watchlist, the Signal Board, the hobby-box EV calculator, Bowman
Bangers as a living prospect board, and the portfolio/inventory tracker. Those are
the things that *change between visits* and that users *invest their own data into*.
That is your retention layer and your monetization moat. Lean there.

## 3. Is "lean into Bowman Bangers + portfolio tracker" the right call?

**Yes — with framing. These are your return-visit engines.** The reasoning:

- A **watchlist / Signal Board** gives prices that move daily → a reason to check
  daily, like a stock ticker. That's recurring sessions by design.
- A **portfolio / inventory tracker** stores the user's cost basis → switching cost.
  People come back to check P/L. It also doubles as **your own COMC inventory book**.
- **Bowman Bangers** is uniquely suited to become a *living prospect board* — call-ups,
  promotions, stat lines, price moves. Not a static ranked list. A "prospect stock
  market" is on-brand for your TA voice and inherently recurring.

**The caveats (so this doesn't backfire):**

1. **Tools live or die on fresh data.** A portfolio tracker is only sticky if the
   prices are trustworthy. Until PriceCharting is wired, scope it as *watchlist +
   manual cost-basis* first; add auto-pricing when the API is in. Don't ship a
   tracker that shows stale/empty numbers — that kills trust faster than no tool.
2. **Don't let the acquisition engine rot.** Guides bring the people; tools keep them.
   They're symbiotic. The move isn't "kill guides," it's "demote guides to top-of-
   funnel that *feed* the tools."
3. **Pick ONE flagship to nail first.** Doing watchlist + Signal Board + portfolio +
   Bangers board all at once = none of them great. Recommended order below.

## 4. The flywheel the site is missing

```
ACQUIRE   → SEO guides / player pages (top of funnel; you already have this)
  ↓
HOOK      → "Track this card" / "Add to watchlist" on every guide → into a tool
  ↓
RETURN    → prices move, portfolio P/L changes, prospects move  → reason to come back
  ↓  (+ email digest = the return trigger that doesn't rely on memory)
MONETIZE  → affiliate fired on BUY SIGNALS (contextual > generic) + your COMC inventory
  ↓
COMPOUND  → email list + more data + more authority → cheaper acquisition next cycle
```

Two levers do the heavy lifting and barely exist today:
- **Email capture** ("Weekly Bangers / Market Digest"). Single highest-ROI retention
  tool for a content site, and it de-risks you from Google algorithm swings.
- **A "My" space** (My Watchlist / My Portfolio), even localStorage-only at first.
  Personalization is one of the strongest return drivers there is.

## 5. NAV rework — principle

Stop organizing the nav by **content taxonomy** (sport/set/player). Organize it by
**job to be done** — what the user came to do. Expose the *return reasons* first,
the *library* second.

Collapse 7 sport/category dropdowns down to ~4 buckets:

| Bucket | Holds | Role |
|---|---|---|
| **Tools** (or "The Floor" / "Markets") | Signal Board, Watchlist, Portfolio Tracker, Bowman Bangers board, Hobby Box ROI calc | **Retention** — the reason to return |
| **Research** | the sport/Pokémon/grading guides (deep on click, not sprawled at top level) | **Acquisition** — SEO top-of-funnel |
| **Shop** | COMC store, Supplies | **Monetize** |
| **My Portfolio** + **Search** | personal space + find-anything | **Stickiness + scale valve** |

Because the nav is now single-sourced (`data/nav.json` + `build-nav.js`), this is a
**config change**, not a 39-page rewrite. That's the payoff of the work just shipped.

Three concrete directions are mocked up in `mockups/nav-redesign-mockup.html`:

- **Concept A — Tools-first / job-based.** Top level: Tools ▾ · Research ▾ · Shop ▾ ·
  [search] · My Portfolio · COMC. Conservative migration, biggest IA improvement.
- **Concept B — Dashboard hub.** Minimal nav; the **homepage becomes a live
  dashboard** (Signal Board snapshot + your watchlist + top movers). The site *is*
  the tool. Highest retention ceiling, most build.
- **Concept C — Hybrid.** Keep a slimmed sport taxonomy but add a persistent
  **Tools** mega-item and a sticky "Track / Watchlist" affordance. Lowest risk.

Recommendation: **A now, evolve toward B.** C if you want the smallest step.

## 6. Content reprioritization

**Tier 1 — build the moat (retention):**
- Flagship FIRST: **Bowman Bangers → living prospect board** + **Watchlist**
  (shared engine). One great recurring tool beats four half-built ones.
- Then **Signal Board** (daily price/TA), then **Portfolio/Inventory tracker**.
- Wire an **email digest** off whichever ships first.

**Tier 2 — systematize acquisition (keep, stop snowflaking):**
- Set guides + player pages stay (they rank), but **templated**, and **every one
  must funnel to a tool** ("Track this card", "See it on the Signal Board").
- Consolidate sprawl: merge the four "Best [sport] cards under $50" into fewer,
  stronger hubs; retire redundant set guides.

**Tier 3 — utility/trust:** grading guide, supplies, ROI calculator — keep, link
*from* the tools where they're contextually useful.

## 7. Monetization for "extreme ROI"

- **Contextual affiliate** — fire eBay/Fanatics links on **buy signals inside tools**
  (a watchlist row hitting a TA trigger), not just generic guide buttons. Higher CTR.
- **Your COMC inventory** — the portfolio tracker is also your inventory book; surface
  "cards I own / listed" against signals. Turns the tool into a sales channel.
- **Future premium tier** — alerts, portfolio sync, Signal Board Pro = **recurring
  revenue**, which is the actual "extreme ROI" lever (one-time affiliate clicks are not).
- **Email list** — compounds, and is the only asset Google can't take from you.

## 8. Suggested sequence (low-regret order)

1. Re-IA the nav to Concept A (config-only in `nav.json`) — cheap, immediate clarity.
2. Ship the flagship recurring tool (Bangers board + watchlist) with email capture.
3. Add "Track this card" CTAs across guides → funnel into the tool.
4. Wire PriceCharting → portfolio tracker with real P/L (the week+ you're holding).
5. Layer Signal Board; then test a premium/alerts tier.

Open calls for you: (a) flagship pick — Bangers board vs Signal Board first?
(b) nav direction — A, B, or C? (c) email platform choice. The mockup is built to
react to (b).
