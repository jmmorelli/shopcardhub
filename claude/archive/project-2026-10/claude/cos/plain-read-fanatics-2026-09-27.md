# Sep 27 2026: plain read + Fanatics restore (commit da7319c, live)

Mo approved it all ("go ahead and do it all").

## 1. Simplify for new collectors
- New `js/plain-read.js`, loaded before `</body>` on all 11 set-index pages. It finds each `.idx-chart[data-ticker]` on its own and inserts "The plain read" above the chart: a verdict word based on the week-over-week level (≥+3 Heating up, +1..3 Warming up, ±1 Holding steady, −1..−3 Cooling off, ≤−3 Sliding; one mark = Just started tracking), a sentence on the level since the start date, the priciest card, last week's biggest mover (price ≥ $10, prevPrice needed), and how to read the level.
- The quant strip (`.stats` + `.statnote` on the Pokémon chase pages, `.sidx-stats` on sector blocks) folds behind "Show the numbers". The setting is saved in localStorage key `sch-show-numbers`, and a GA event `show_numbers` fires. Nothing was deleted.
- Because the script self-discovers, generated blocks (BCB26:START etc.) are never hand-edited, and a rebuild won't remove the read.
- Home: new h1 "Card prices, tracked like the stock market.", a deck explaining 100 = start, three doors (/indices, /bowman-bangers, /auctions), and plain column labels (Set / Now / Week / Month / Since start / Updated). These edits are in the static header/thead, outside the HOME:* markers.
- Not done yet: the rail's "Saved screens" (Fat tails, [z] beyond 2) and the z-scores on the home movers panel are still jargon. They're candidates for the next pass.

## 2. Fanatics restored
- The first Impact payout ($18, Aug 14, lock Sep 30) was a **$224.99 Topps product on fanatics.com**. It came in the same day commit 667ac2f put "Check Fanatics" buttons on 15 release pages. The Aug 31 batch (6956998) removed those buttons by conflating the Fanatics STORE with the retired Fanatics Collect program. Sep 27's $19.72 was Nike + lululemon from Mo's family link.
- Program terms: Fanatics (Global), US Online Sale 8%, 7-day cookie. Deep link base: `https://fanatics.93n6tx.net/c/7388044/4029520/9663?u=<encoded fanatics.com URL>&subId1=<page slug>`. Verified that it 301s to fanatics.com with irclickid.
- **topps.com is NOT a valid landing domain** for this program (Impact rejects it). fanatics.com does sell factory-sealed Topps retail boxes: value boxes, Flagship Football, Update Series, Series 2, Hoops, complete sets.
- `tools/build-buy-strip.mjs` has a new optional `fanatics: {q,label,title}` per page in `data/buy-strip.json`. It renders a gold-outline "At Fanatics" button after the eBay CTAs, and the fine print discloses it. It's live on 31 Topps/Bowman/football pages. Update Series, Series 2 and Flagship Football use product-specific queries; the rest use "topps baseball/basketball/football".
- affiliate-disclosure.html now lists Fanatics (via Impact). The site-auditor §15 comment was updated.
- Read by page: Impact → Reports → filter by Sub ID 1.

Gates at push: audit-prices FAIL 0 · audit-site FAIL 0 · audit-terminal FAIL 0.
