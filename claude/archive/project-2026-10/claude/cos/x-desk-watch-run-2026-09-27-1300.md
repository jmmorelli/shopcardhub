# X Desk Watch — run 2026-09-27 (Sun), fired 13:03 PT

HEAD `3c0d855` · origin/main `3c0d855` · delta 0 (fresh HTTPS clone, `$HOME` scratch; HEAD = "feed: nightly 2026-09-27")

STEP 0 read: LANE-RULES R8/R9/R10 + Sep 20 amendment + Amendment 2 (vendor off; CoS queues, Mo replies; this lane audits feed + pre-reads the queue), spec `x-desk-watch-2026-09-17.md`, STATE (Sep 26 row: both queued FAILs fixed in the scheduler with Mo present; Darkrai supersede line parked for the Monday close post), NEEDS-MO, `x-weekend-2026-09-25.md` fact trail, yesterday's filing (R6). **Prompt stale (file wins):** still describes the Grok vendor, auto-replies and a 17:30 slot; LANE-RULES cadence has this lane at daily 13:00 and the vendor off since Sep 25.

**Surfaces.** Chrome deviceId `477c0edf…` selected by id (displays "Browser 2"; name not trusted), signed in (*Edit profile* present). Read: profile, `/with_replies`, Sun 9:00 permalink. Live, browser-rendered: `/pokemon-30th-anniversary-2026`, `/watchlist`, `/destined-rivals-index` + in-page `/data/indices.json` (updated 2026-09-25). **Not read:** Drafts → Scheduled (a write surface; the Sun 6:30 pre-read uses STATE's record of its Sep 26 edited text).

**Followers: 2,440** (−1 vs 2,441 Sep 26). Following 480.

## Live since last run (3 posts, all on the minute)

| Slot | Post | Views | Grade |
|---|---|---|---|
| Sat 7:00 pm | Vault: "Star any card… No account, nothing leaves your browser… tells you what moved since you starred it." Link card → /watchlist | 27 | **PASS vs site** (the line is our own copy, verbatim on 20 pages' nav panel; `index-you.js` does show move-since-starred). **Inward P2 below** — the site copy is itself not true. |
| Sun 9:00 am | 30th ETB lowest eBay ask $161 Friday vs $49.99 MSRP, down from $180; bundles Oct 2, UPC Nov 6; 3.2×; "four more waves" | 31 | **PASS** (dated ask; MSRP, Oct 2, Nov 6 on page; waves Oct 2/Oct 30/Nov 6/Dec 4 per fact trail, page "stagger… to December 4"; page now $164.99 · 3.3× — dated line holds). **MED (D):** no site link in the main post. |
| Sun 12:30 pm | Lugia #149 $268 last dated sold, fourth-heaviest in TH26 behind the three Mews (as edited Sep 26) | 25 | **PASS** — TH26 table: rows 1–3 Mew G/B/R RGB 16.4% each, row 4 Lugia #149 $267.60 4.8%. Link card → 30th page resolves. n30 no longer quoted. |

## Pre-read: Sun 6:30 pm (still queued)
Text per STATE: re-mark tomorrow on every Pokémon index incl. first real marks for TH26, 151, Phantasmal Flames; DR25 95.75; Mewtwo ~27%; Prismatic 98. **PASS** — `indices.json`: TH26 and SV151 only inception 09-25, PF25 only inception 09-18; DR25 95.75 (09-21); PRIS25 98.04; Mewtwo #231 26.7% on the DR25 table.

## Inward P2 — "nothing leaves your browser" is not true (page fix; X supersede)
20 pages' nav Vault panel say "No account, nothing leaves your browser." `js/vault-track.js` L138–151: every NEW star fires `fetch('/api/track-signal?…')` (anonymous demand counter, card name) plus a GA4 `track_card_from_page` event. No PII, but the sentence is false. (STATE L289: the counter's server write is currently failing — the request still leaves the browser.) `/watchlist` itself says the accurate thing: "your watchlist stays on your device".
**Page fix (desk/build lane):** nav panel → "No account. Your list stays on your device." (matches `/watchlist`).
**X (supersede, don't delete):** next Vault post uses "No account, your list stays on your device" — never "nothing leaves your browser".

## B · Taxonomy — PASS (no Bowman product claims today). C · Exposure — clean (no COMC, competitor, grading promise, bare eBay link). E · Replies — none from the account since Sep 24 18:38 PT; Mo owns replies (Amendment 2).

## MEDs open (for Monday's note)
- Sep 25 bid-column "every row" · Sep 26 Mendoza/product attribution · **Sep 27 no site link in main post (Sun 9:00; Sat 1:00 had none either — 2 in 2 days)**. ("seven" count closed by the Sep 26 edit.)
- Carried: Monday close post owes the Darkrai supersede line (STATE Sep 26).

## Boundaries held
Nothing posted, edited, liked, followed or deleted. Grok app not opened. Scheduler not opened. No git beyond the clone. Nothing committed.

**Nothing needs you.** Scoreboard: posts read **3 live + 1 queued** · claims **PASS 4/4** · MEDs open **3** · inward P2 **1** (Vault privacy line) · followers **2,440 (−1)**.
