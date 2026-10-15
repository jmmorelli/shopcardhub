# X Desk Watch — run 2026-09-28 (Mon, weekly grade), fired 13:04 PT

HEAD `c2eae11` · origin/main `c2eae11` · delta 0 (fresh HTTPS clone, `$HOME` scratch). price-data `d6126ce` ("ga4-snapshot: 2026-09-28", day 2026-09-27).

STEP 0: LANE-RULES R8/R9/R10 + Sep 20 amendment + Amendment 2, spec, STATE (NOW Sep 28 block; Sep 26 X row), NEEDS-MO, yesterday's filing (R6). **Prompt stale (file wins):** still says Grok vendor / auto-replies / 17:30. LANE-RULES: vendor off since Sep 25, CoS queues, Mo replies, this lane daily 13:00.

**Surfaces.** Chrome `477c0edf…` selected by id, signed in. Read: profile, `/with_replies`, `from:shopcardhub since:09-24`. Live data: `/data/indices.json` in Chrome. **Not read: Drafts → Scheduled** — the navigation was refused by the permission gate this run; not retried. So no queue pre-read today. GA4: read from the `ga4-latest.json` snapshot on price-data (same property, pulled 10:07 PT), not Browser 2.

**Followers: 2,440** (0 vs Sep 27). Following 480.

## Live since last run: 1 post (the Sun 6:30 pm post, pre-read PASS yesterday)

| Post | Views | Grade |
|---|---|---|
| Sun 6:30 pm: re-mark tomorrow, first real marks TH26/151/PF, DR25 95.75, Mewtwo 27%, "watching whether Prismatic holds 98" + DR25 movers image | 55 | **PASS.** Text as pre-read. Image: all 10 movers match the Sep 14→21 marks (e.g. #218 $2.04→$2.47 +21%, #211 $2.22→$1.47 −34%), "62 cards with two dated marks" = DR25 basket 62. The promise held: Sep 28 re-mark landed. TH26 99.73, SV151 99.29, PF25 92.60 (first real marks). |

**Monday: nothing posted as of 13:04 PT.** No replies since Sep 24 (Mo owns replies).

## Inward P1: the 30th Celebration page shares as Pitch Black (page fix; live on X now)
`pokemon-30th-anniversary-2026.html` has `og:image` **and** `twitter:image` set to `og/pitch-black.png`. On X, the Sun 12:30 Lugia post (75 views) renders a **"Pitch Black Pre-Release Guide"** card under a 30th Celebration title, and the card reads **"$550–750 Darkrai ex SIR"**. That is an undated pre-release figure. Our live sold mark for Darkrai #116 SIR is **$184.01** (PB26, Sep 28). So a number that disagrees with our own site is showing under our post, on a product the post isn't about. Any future share of that URL gets the same card.
**My miss:** yesterday I graded that card "→ 30th page resolves" without reading the image.
- **Page fix (desk/build):** point both tags at a 30th image (`og/x/th26-skew.png`, or `og/pokemon.png` until one exists). Also check whether `og/pitch-black.png` should keep carrying "$550–750" on its own page: it is a pre-release ask range, and the SIR now sells at $184.
- **X:** don't delete (supersede rule). The next post linking `/pokemon-30th-anniversary-2026` will re-scrape the card, so ship the tag fix before it goes out. Any Darkrai mention should use the dated sold mark.

## A · B · C
A PASS (1/1 live). B: no Bowman claims. C: clean (no COMC, competitors, grading promises or bare eBay links).

## F · Funnel (week Sep 21–27, GA4 snapshot)
- Organic Social (t.co is all of it): **16 sessions, 11 engaged (69%), 4 key events, 12.5% session KE rate.** That's 6.6% of the 244 site sessions.
- 28d: 47 sessions, 66% engaged, **avg session 7m20s**, 8.5% KE rate. Baseline (28d to Sep 16): 30 sessions, 3m48s, 13.33%. That baseline window had dead key events and uses a different duration metric, so read these as directional only.
- Site-wide key events this week: click 22, track_card_from_page 2, newsletter_signup 0.
- Image vs text: **can't be measured.** Posts carry no per-post tag, and t.co arrives as one referrer.
- No vendor note to grade (vendor off).

## MEDs open
- No site link in the main post: Sat 1:00, Sun 9:00 (2 of 9 weekend posts). Holds at 2 this week.
- Sep 25 bid-column "every row", Sep 26 Mendoza/product attribution. Both carried.
- **New: cadence.** No post yet on re-mark Monday, and the queue ended with the weekend batch. The week's biggest data story is unposted: DR25 95.75→87.68 (−8.4%), CR26 −8.5%, PRIS25 98.04→93.61, AH26 −5.8%, PB26 82.75.
- Carried: the Monday close post owes the Darkrai supersede line.

## G · The note (to the CoS; Mo replies, the CoS queues)
1. Keep: dated asks ("lowest ask on Friday"), movers images built straight from `prevPrice`→`price`, "last dated sold" wording. All 4 weekend claims passed.
2. Drifted: link-card images go unread (the Pitch Black card above), and 2 of 9 main posts had no site link.
3. Site changes that break stock phrasing: nav copy is now "your list stays on your device" (never "nothing leaves your browser"); TH26/SV151/PF25 have second marks, so "first real marks" is spent; R20 means no eBay-derived Bowman level and no ENGINE ASK as a mark.
4. The Sep 28 close is the angle: every Pokémon index down on the week, and Prismatic did not hold 98 (93.61). Say it plainly, since we said we were watching it.
5. Tuesday Tape tease: the board on its sold basis (R20 bridge), with the Darkrai supersede line riding the close post.

## Boundaries held
Nothing posted, edited, liked, followed or deleted. Grok app not opened. Scheduler not read (refused, not retried). No git beyond clones. Nothing committed.

## NEEDS-MO block (for the CoS; no Mo action needed if the desk ships the tag fix today)
> **30th page shares with the wrong image.** `/pokemon-30th-anniversary-2026` og/twitter image = `og/pitch-black.png`. Your Sun Lugia post shows a "Pitch Black · $550–750 Darkrai" card (our sold mark: $184). Desk fixes the tag; nothing to delete.

**Scoreboard:** posts read **1 live** · claims **PASS 1/1** · MEDs open **4** · inward P1 **1** (30th og:image) · followers **2,440 (0)**.
