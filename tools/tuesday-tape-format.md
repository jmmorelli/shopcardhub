# The Tuesday Tape — fixed shape from the Sep 29 2026 send (LANE-RULES R26)

The Tuesday board lane writes the digest by hand every week; this file is the shape it must take.
Same order every week, so a reader knows where to look in ten seconds. The writing stays the lane's:
short, dated, no hype, own the misses. Every figure is one the live site publishes; the content gate
(every number checked against the page after the push) is unchanged.

Subject: the week's one fact, dated — never a teaser. Preheader: the second fact.

## 1. The Monday close (first, always)

One row per live index, in `/indices` order, from `data/indices.json` after Monday's re-mark:

    PRIS25  Prismatic Evolutions   98.04   +1.3% w/w   −1.96% since launch
    DR25    Destined Rivals        95.75   −2.0%       −4.25%
    …
    TH26    30th Celebration      100.00   first mark  —
    BOW26   2026 1st Chrome Autos 100.00   first mark  —

Then one sentence: the biggest w/w move and why it moved, if the tape says why (a card's sold mark
moved; "no reason on the tape" is a valid sentence). Link: `shopcardhub.com/indices?utm_source=tape&utm_medium=email&utm_campaign=YYYY-MM-DD`.

## 2. Movers

Three to five cards, largest absolute move first, across every index — name, set, sold mark (a median of recent dated sales — never call it "last sold") with
its read date, the move. Each links to its index page (`?utm_source=tape…`). Nothing without a dated sale.

## 3. The chase cards

The set's most valuable card for each index that moved this week, with its dated sold mark and a link
to **our page for it**: its card page (`shopcardhub.com/card?id=<tk>-<num>&utm_source=tape…`) where one
exists, otherwise its index page, whose chase strip carries the `-chase` eBay link (the six modern chase
tickers and Bowman have no card pages yet). No "buy"; the price and the link.

**No link in the email points at ebay.com (CoS desk, 2026-10-01).** EPN's Special Business Models page
lists "Messaging (Email/IM/Chat/Text …)" among promotion methods subject to EPN's prior written approval,
and we hold none (Mo, Sep 22: no contact with eBay/EPN). Every eBay click starts on one of our pages.

## 4. Bangers board

The board's own paragraph, as today: seat changes, the rule that moved them, calls owned in public.
Link to `/bowman-bangers`.

## 5. Watch this, dated

One thing that resolves on a date (a break condition, a street date, a re-mark that decides a seat).

## The watchlist block (segment: MailerLite field `signup_page` starts with `watchlist-`; "source" is a reserved name there — field created Sep 29 2026, so only signups from Sep 29 on carry it)

One line at the very top, above §1, for that segment only:

> **Your watchlist re-marked Monday.** Open it → shopcardhub.com/watchlist?utm_source=tape…

The list lives on the reader's device; the email is the reminder. If the segment is empty this week,
send once to everyone without the block. Never put a card name in this block — we don't have them.

## Footer (unchanged)

Campaign id · subject sent · status · delivered / opens / clicks / unsubscribes / bounces / spam ·
**active subscribers** (the R26 number) · the four gates (rogue-send, kill switch, content, push).

## Links

Every link carries `utm_source=tape&utm_medium=email&utm_campaign=<send date>` so GA4 shows the email
bringing people back — that is the retention read the CoS weekly quotes beside the list size.
