# Ruling + fix — the 254 unencoded `#` links (flag 1 of the 2026-09-22 Ideas Desk report)

**Status: CLOSED, shipped and live-verified, 2026-09-22 ~09:20 PT.** Commit `e15c2e8`, pushed to `main`
from a fresh clone. Mo asked for it in chat rather than waiting for the 14:00 PT desk run; nothing about
it was deferred.

## The defect

Every per-card "Live Listings →" link in the `var CARDS = [...]` popup array on the six Pokémon index
pages carried the card number as a raw `#`:

```
https://www.ebay.com/sch/i.html?_nkw=pokemon+Umbreon+ex+#161&LH_BIN=1&…&campid=5339155990&customid=pris25-index
```

The first `#` is the fragment delimiter. The browser sends everything before it and keeps the rest to
itself, so eBay received `_nkw=pokemon+Umbreon+ex+` and **nothing after it** — no `LH_BIN`, no `mkevt`,
no `campid`, no `customid`. Every click through one of these links, since the pages launched, was an
**uncredited** click on a **broader** query. Same class as the Jul 28 `mkevt=1` incident, one layer down.

Count, verified in the clone and on the live pages: AH26 38 · CR26 36 · DR25 59 · PF25 36 · PB26 36 ·
PRIS25 49 = **254**.

## The fix

`#` → `%23`, inside the `_nkw` value only. Nothing else on the six pages changed — no price, mark,
weight, level, stamp or ranking is touched; the `num` and `tname` fields keep their `#`. Diff is one
line per page (the CARDS array is one line) plus the gate.

`remark-indices.mjs` round-trips the CARDS array through `JSON.parse`/`stringify` and writes only
`px`/`wt`/`asof`, so the encoded URL survives the weekly re-mark rather than being regenerated. The
`--dry` run was clean on all six after the change (36/36 · 36/36 · 70/70 · 49/49 · 62/62 · 36/36,
levels unchanged), which was the gate risk the idea named.

## Why no gate caught it — and the correction to the desk's diagnosis

The report said `audit-site` "reads the `href` attribute, sees `campid=` present, and passes it." That
is not what happened. Check 1 reads `markup(f)`, which **strips `<script>` blocks**, and these links
live inside `var CARDS = [...]`. The auditor never saw the 254 links at all. The distinction matters:
it is not a too-lenient check, it is a blind spot, and every other link built in JS shares it.

Added **check 1b (`epn-fragment`)** to `tools/site-auditor/audit-site.mjs`: reads the **raw** file,
FAILs on any raw `#` in an `ebay.com` `/sch` or `/itm` URL, and prints what eBay would actually have
received. Self-tested both ways — one link reintroduced → `FAIL: 1`; restored → `FAIL: 0`.

## Gates

`audit-prices` FAIL 0 · `audit-site` FAIL 0 (3 pre-existing first-bowman WARNs) · `first-bowman` clean ·
`remark-indices --dry` clean on all six.

## Live verification (09:22 PT, production)

| Page | encoded `%23` | raw `#` in an eBay URL |
|---|---|---|
| prismatic-evolutions-index | 49 | 0 |
| ascended-heroes-index | 70 | 0 |
| destined-rivals-index | 62 | 0 |
| chaos-rising-index | 36 | 0 |
| pitch-black-index | 36 | 0 |
| phantasmal-flames-index | 36 | 0 |

289 = the full priced-constituent count, so the pages that were already partly encoded (AH26 32 of 70,
DR25 3 of 62) are consistent too. Sample served URL:
`…?_nkw=pokemon+Umbreon+ex+%23161&LH_BIN=1&mkcid=1&…&mkevt=1&campid=5339155990&toolid=10001&customid=pris25-index`.

## What this does and does not buy

It does **not** create earnings on its own. It makes the existing clicks on those links countable and
credited, and it sends eBay the query the page intended (the card number, not just the player name).
Idea **36** — the per-card in-table column with a per-card `customid` — is the earning part and stays
`proposed` for the Wednesday build; its kill criterion ("drop the column, keep the encoding fix")
already assumed this fix.

Nothing here is waiting on Mo.
