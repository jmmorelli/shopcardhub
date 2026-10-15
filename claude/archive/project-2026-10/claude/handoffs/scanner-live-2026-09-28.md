# Handoff to the CoS — Card Scanner public version: **TABLED by Mo (2026-09-28)**

> **TABLED — do not build.** Mo, later on 2026-09-28: "let's table this for public for now but keep the scanner for me … I don't want to spend more money just yet." No API key, no `/api/scan`, no watchlist button, no spend. Mo's private scanner stays as it is (`claude/scanner-2026-09-28.md`). **Revive only when Mo asks.** The spec below is kept so the build doesn't have to be re-derived.
>
> **Correction to Tier 2 (checked 2026-09-28 ~11:40 PT, after this spec was first written):** the pokemontcg.io v2 API is current on **sets and card images**. `/v2/sets` lists 30th Celebration (me55, 2026-09-16), Pitch Black, Chaos Rising, Perfect Order and Ascended Heroes, and images now serve from images.scrydex.com. But **Pitch Black #116 came back with no TCGplayer price block**, and two card queries returned 500/502. Treat pokemontcg.io as a **catalog + image source only** until a fresh read shows dated prices on current-set cards. Tier 2 pricing would otherwise have to be PriceCharting pages resolved by set + number (Tier 3's mechanism).

**Mo, in chat, 2026-09-28 (earlier):** "if you think we can run it cheaply and well through haiku, then let's do it... Or at least pass it up to the chief to look at and implement." (Superseded by the table ruling above.)

## What would ship
A **"Scan a card" button on `/watchlist`**, in simple view, beside Add, with no new page and no nav item. Flow: take a photo or pick several from the camera roll → identified → price → "I own it" / "Hunting" (target) → lands in the device-local watchlist. Nothing about the user is stored server-side.

## Architecture
1. **`/api/scan` (Vercel function).** Takes a JPEG (≤1600 px), calls **Claude Haiku 4.5** with the reader prompt from the private v1 (identity only, never a price), and returns JSON. The photo is never stored or logged. Guard (R17 pattern): same-origin, per-IP rate limit, a daily global cap and a hard monthly dollar cap. ESTIMATE ~$0.004 a scan (third-party price read Sep 28; confirm on Anthropic's page). Proposed cap $10/month.
2. **Price lookup, in three tiers.**
   - **Tier 1:** our catalog (index baskets + `sold-marks.json`).
   - **Tier 2:** all English Pokémon, see the correction above. pokemontcg.io gives identity and images; the price source still needs to be settled.
   - **Tier 3:** everything else is queued by identity for the nightly `sold-marks.mjs` resolve, so the catalog grows from what people scan.
3. **EPN:** `customid=scan` / `scan-hunt` on every eBay link. There are no affiliate tags on Mo's private tool (self-click rule).
4. **Honesty:** raw is labelled raw; caveats for variant, parallel, serial, language and slab; no model-made prices.

## Needs Mo (only if revived)
An Anthropic API key with a Console spend limit, and optionally a free pokemontcg.io key.

## Kill / keep (only if revived)
First EPN read ≥30 days after launch. Cut if spend > $10/mo with < 20 `scan*` clicks, or misidentification > 10% on a 50-scan spot check.
