# Ruling — flag 2 (Flagship Football / Heritage) and the gate gap behind it

**Status: CLOSED, shipped and live-verified 2026-09-22 (`9c3fa25`).** Mo approved it in chat
rather than waiting for the 14:00 desk run.

## The flag was right about the mechanism and wrong about the symptom

The desk filed: *"the cheapest priced hit was a $199.99 Topps Heritage presale box, so the page
would read 'ask from $199.99' under a Flagship label."* It declared it could not render the page.
Rendering it is what changed the answer.

**What the page actually printed, both this morning and before the fix: `ask from $199.95 · 39
live`, and the listing behind $199.95 was a genuine 2026 Topps Flagship box.** No visitor was
shown a Heritage price under a Flagship label.

**What was true, and is the more useful finding: 15 of the 40 passing listings were Topps
Heritage Football boxes at $199.99–$205, against a Flagship low of $199.95.** The printed figure
sat one sold listing above a different product's price. The depth count — "39 live" — was
inflated 38% by a product the page does not sell. And nothing in the stack would have reported
it on the day it flipped.

A latent defect, not a live one. Worth fixing on exactly those terms, and worth recording that
an API read plus a code path is not the same evidence as a rendered page.

## The fix

`-heritage` in the query, `req: "topps|football"`, `deny` on the sibling Topps football lines.
After: 39 live, all Flagship, ask unchanged at **$199.95**.

Two smaller leaks the same sweep turned up and closed: two Topps **Update Series** boxes were
passing the Series 1 query, one Topps **Finest** box was passing the Topps Chrome Baseball query.
Both sat above their page's low, so no printed figure was wrong.

## The gate gap, which is the part worth keeping

`tools/buy-strip-health.mjs` measured whether a shelf was **empty**. It never asked whether the
shelf held the **right product** — the same gap idea #32's `must` closed for case links, one
surface over.

It now derives each page's own product line from `product`, and flags a listing that names a
line the page is **not** while not naming the line it **is**. Two states:

- **WRONG-PRODUCT** — the figure the page prints right now is set by another product.
- **UNGUARDED** — right today, nothing keeping it right: ≥10% of the priced listings are
  another line.

The second half of the rule is what makes it usable. Without it the check fired on
`topps-pristine-basketball`, whose cheapest listing is *"...Hobby Box Order Confirmed Sealed
Chrome Flagg"* — a Pristine box whose title happens to say "chrome", next to a rookie's surname.
A gate that fires every Monday on a correct page is a gate nobody reads.

Self-tested by reverting the guard: the tool reports *"38% no guard topps-flagship-football —
e.g. 2026 Topps Heritage Football Hobby Box"*. Restored → 0 wrong-product, 0 unguarded.

## The sweep, for the record

All 31 `live:true` shelves were read against production `/api/comps` with the client's own
filter. **29 of 31 carry no `req`/`deny` guard at all.** None is printing a wrong product today,
so nothing else was changed — the new UNGUARDED state is now what watches them, on Gengar's
Monday beat.

**Noted, not changed, needs a ruling that is not mine to make silently:** `pokemon-tcg-2026` has
`live:true` on the product *"2026 Pokemon sealed boxes"*, which is not ONE sealed product — the
condition the config's own `_comment` sets for `live:true`. Its figure ($49.95, 1 live) is the
cheapest 2026 Pokémon sealed box, so it is not false, just uninformative. Either name a product
or drop the figure.

Gates: audit-site FAIL 0 · audit-prices FAIL 0 · first-bowman clean · remark-indices --dry clean.

---

# Addendum, same day — naming the 2026 Pokémon product, and the category bug it exposed

Mo's call on the open item above: **name the product.** Doing the measurement properly to choose
one turned up something larger than the naming question.

## The category bug

`js/buy-strip.js` never passed a category to `/api/comps`, so every shelf was searched in the
endpoint's default category — **212, sports trading cards** — where Pokémon *sealed* product is
barely cross-listed. The same queries, measured 2026-09-22 against **183456** (CCG sealed /
booster boxes):

| page | default (shipped) | 183456 (truth) |
|---|---|---|
| ascended-heroes | 1 live · $179.99 | **11 live · $158.99** |
| chaos-rising | 2 live · $89.95 | **13 live · $69.99** |
| pitch-black-set-guide | 3 live · $35.99 | **10 live · $34.99** |
| prismatic-evolutions-guide | 2 live · $197.99 | **43 live · $135.00** |
| pokemon-tcg-2026 | 1 live · $49.95 | 8 live · $149.99 (new product) |

Every Pokémon page was publishing an "ask from" figure **13–47% above the real cheapest sealed
ask**, drawn from a one-to-three listing sample. And the THIN states those pages have been
reporting on Gengar's Monday beat for weeks were an **artifact of the wrong category**, not real
scarcity — the tool was being told the truth about the wrong market.

Same shape as everything else today: not a false number in form, wrong in substance, with the
gate looking at the wrong thing.

Fix: an optional `cat` on a strip entry → `data-bs-cat` → the client, the builder and the health
tool all pass it through. Absent, nothing changes, so the 26 non-Pokémon shelves are untouched.

## The naming

`pokemon-tcg-2026` now names the **Pokémon TCG Phantasmal Flames Elite Trainer Box**, chosen on
measured depth under the corrected category:

- Phantasmal Flames ETB — **9 live from $149** ✅
- 30th Celebration ETB — 2 live from $200 (release staggers Sep 16 → Dec 4; revisit in November)
- Phantasmal Flames booster box — **0 US listings**; does not exist as a product here yet

The other 2026 sets were never candidates: Ascended Heroes, Chaos Rising, Pitch Black and
Prismatic each already carry that product on their own page.

Health after: 31 live shelves · dead 0 · **thin 3 → 1** · wrong-product 0 · unguarded 0.
Live-verified: the hub reads *"ask from $149.99 · 8 live"*, Prismatic *"$135.00 · 43 live"*.

## Two things noted and deliberately not changed

- **The page's own set timeline has no Phantasmal Flames row.** It runs Ascended Heroes → Perfect
  Order → Chaos Rising → Pitch Black → 30th Celebration and stops. The strip now sells a set the
  page never mentions. That is a content fix for Wednesday, not a config fix, and it is the kind
  of thing that should not be quietly papered over by the CTA.
- **`pokemon-30th-anniversary-2026.html` has hand-built EPN links and no config strip entry at
  all.** It passes the conversion gate because that gate looks for *an EPN link*, not a managed
  shelf — so the page with the year's biggest Pokémon release has no live ask, no per-product
  custom ID beyond the page slug, and nothing watching it on Mondays.
