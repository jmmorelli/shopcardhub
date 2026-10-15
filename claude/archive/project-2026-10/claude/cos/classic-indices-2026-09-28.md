# Classic Pokémon indices + home split — 2026-09-28 (CoS with Mo in chat)

**Recorded:** STATE run log + pushLog in `3a6820e` (docs, no deploy); Project STATE/NEEDS-MO mirrored; Mac deploy-key copies deleted.

Mo, in chat: "make it more obvious" (SV151 top-10 table) · "add at least 10+ more indices for pokemon, specifically the popular sets from the past. The Pokemon Skyridge comes to mind" · "consider splitting the pokemon and sports cards more … your call".

## Pushed (all live-verified, gates 0/75 · 0/3 · 0/0 = baseline on every tree)
- `b797907` — gate-watch #1 fix: the "vs sold mark" chip was a 4th grid item in the sector action cell and pushed the Bid button into the 32 px Watch column (clipped at 390/1280 on TH26, SV151, BOW26, BB26). Chip now takes its own row. Issue #1 is still open on GitHub (no API token here) — close it once the daily sweep passes.
- `67cdfb3` — sector pages: "Top 10 of N cards by weight" caption + a real "Show all N cards ▾" button (was a 10 px grey summary line). TH26, SV151, BOW26, BB26, BCB26 re-baked (no figure changed).
- `9d9f7b8` — **12 classic Pokémon set indices** (sector model, Mo's Sep 15 parameters, base 100 at 09/28/26, PriceCharting dated ungraded sales):

| Ticker | Page | Basket / universe | Top card (weight) |
|---|---|---|---|
| BS99 | /pokemon-base-set-index | 101 / 102 | Charizard #4 $380 (25%, capped) |
| JU99 | /pokemon-jungle-index | 64 / 65 | Snorlax #11 $60 |
| FO99 | /pokemon-fossil-index | 62 / 62 | Gengar #5 $90.99 |
| TR00 | /team-rocket-index | 82 / 83 | Dark Charizard #4 $222.35 |
| NG00 | /neo-genesis-index | 111 / 112 | Lugia #9 $405 (25%, capped) |
| ND02 | /neo-destiny-index | 109 / 114 | Shining Charizard #107 $1,619 |
| AQ03 | /aquapolis-index | 126 / 192 | Lugia #149 $2,558.60 |
| SK03 | /skyridge-index | 70 / 186 | Poliwrath #H24 $472.05 (Crystals too thin to screen in) |
| HF19 | /hidden-fates-index | 164 / 164 | Charizard GX #SV49 $592.50 |
| EVS21 | /evolving-skies-index | 235 / 238 | Umbreon VMAX #215 $1,975 |
| CEL21 | /celebrations-index | 71 / 92 | Charizard #4 $158.97 |
| CZ23 | /crown-zenith-index | 230 / 232 | Giratina VSTAR #GG69 $296.26 |

  WOTC indices track the Unlimited (bracketless) print; stated on each page. Classic rows keep eBay *search* links and get no "vs sold mark" chip (`data-no-repoint`): cheapest vintage raw listings are fakes/customs ($2.99 "Charizard 4/102"). Photos are official scans from images.pokemontcg.io (`src:` keys; 110 URLs checked 200); CEL21 stays on name search with the new `-word` exclusions in `js/card-img.js` byName.
  - Nightly Action: one Mon/Thu `--mark` step for all twelve (never blocks the feed). First mark Thu Oct 1.
  - /indices: new "POKÉMON — CLASSIC SETS" section. Home index board: grouped header rows — Pokémon · new sets (8) / Pokémon · classic sets (12) / Sports · Bowman baseball (3).
  - sitemap +12, nav.json searchExtra +12 (site search only; no new nav item), nav re-baked. IndexNow 15 → 200.
  - Tooling: `tools/new-sector-page.mjs` (page scaffold), `SIDX_CACHE` in build-sector-index (resumable reads).
  - indices.json is now ~980 KB raw (~100 KB gzip) vs 467 KB — every index page fetches it for the ticker strip. Watch page weight; a slim `indices-summary.json` for strips/home is the fix if it matters.
  - Leftover transfer files in `Card Hub/deploy/xfer/` and `Card Hub/deploy/classic-indices-2026-09-28.patch` (tool code, a patch, and date+price read caches — no credentials). Harmless; delete whenever.

## Freeze / R25 note
New pages during the freeze: authorised by Mo in chat (precedence 1). No nav item added.

## Open
- X: posts 4–5 of the Sep 28 batch are unqueued (see `x-batch-2026-09-28.md`). The classic indices are a natural X batch topic once Thursday's first mark lands.
- `og/indices.png` shows Sep 21 levels — regenerate (make.py og), Tuesday lane or Sep 30 weekly.
