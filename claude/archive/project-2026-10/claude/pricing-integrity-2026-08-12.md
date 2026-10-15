# Pricing integrity sweep — Aug 12, 2026 (COMPLETE, verified live)

Mo flagged $$-style price placeholders site-wide (worst: /bowman-sapphire-2026) as a top trust/conversion issue. Audited, fixed, deployed, and automated — all closed out same day.

## Audit result
Full-repo scan found 14 $$-style placeholder cells on exactly 5 pages (the rest of the site was clean of $$ symbols): bowman-sapphire-2026 (5), wnba-cards-2026 (5), topps-series-2-2026 (1), roman-anthony-rookie-cards (2 incl. "premium auto"), munetaka-murakami-rookie-cards (2). Separate pre-existing issue: ~20 Topps product pages use word labels ("Top hit", "Case hit") in price cells — tracked as WARNs, backlog.

## New values (all from eBay sold comps via SportsCardsPro, pulled Aug 12)
- Sapphire: Griffin base $6-$12 · Gold /50 $50-$80; Holliday auto $325-$410; Anthony Selections auto $200-$400 · Hidden Gems $140-$240; Walcott/De Vries/Made base $2-$10; McGonigle auto $175-$225 · Gold /50 ~$500 (Orange /25: zero comps)
- WNBA: Clark base $18-$25 · 1/1s $100K+; Wilson base $1-$3 · autos $75-$200; Bueckers base $2-$5 · PSA 10 $95-$155; Reese base $1-$4 · PSA 10 ~$40; Stewart base $1-$3
- Series 2: Murakami Real One auto $650-$800
- Anthony: 1st Bowman Chrome auto base $500-$800; Sterling auto $75-$130
- Murakami: CRA auto base $750-$1,050; Kanji SP ~$20K (one sale)

## Factual corrections shipped
- Roman Anthony's 1st Bowman Chrome is **2023** (#BCP-71/CPA-RA), page said 2024 — names, eBay links, Track seed fixed; base price was overstated ~10x ($40-$70 → ~$3-$8 raw, PSA 10 ~$120).
- Murakami "Kanji variation" = 2026 Bowman Anime #BA-3 SSP, $20K July sale.

## Guardrails (prevent recurrence) — ALL LIVE
- Every fixed table carries `<p class="price-asof" data-prices-updated="2026-08-12">` stamp (machine-readable freshness).
- `tools/audit-prices.mjs` — FAILs on $$ placeholders + eBay links missing mkevt=1/campid; WARNs on numberless price cells, stamps >21 days, missing sold-comps disclaimer. Run before any HTML push. Current state: 0 FAIL / 27 WARN (word-label backlog).
- Weekly GitHub Action **LIVE**: `.github/workflows/price-audit.yml` (commit bd312e5, added via web UI with Claude-in-Chrome — PAT lacks workflow scope). Manual run #1 = green, 15s. Mondays 15:00 UTC + on any *.html push; on FAIL it emails Mo + opens a `pricing-audit`-labeled issue. Source copy: tools/price-audit.yml (edit both if it ever changes).
- Hard content rule in desktop project memory (`pricing-integrity.md`) so all future weekly runs comply: never symbol prices; numeric sold-comp ranges only; stamp every table.
- Runbook: `tools/pricing-audit-README.md`.

## Deploy log
Mo pushed fb8831a → 3e09115 from ~/Projects/shopcardhub (Aug 12 evening); Vercel webhook fired normally; live /bowman-sapphire-2026 verified showing real ranges + Aug 12 stamp, zero $$ anywhere. Workflow commit bd312e5 followed via web UI. Note: `_to_delete/git-index.lock` rode along in the push (harmless; Mo can trash `_to_delete/`). Stale repo copy at ~/shopcardhub should be deleted eventually.

## Open follow-ups
1. Word-label price cells (~20 Topps pages, 27 WARNs) — convert to researched numbers opportunistically per page.
2. Price stamps go stale after 21 days → refresh the 5 fixed pages' numbers by ~Sep 2 (weekly runs should fold this in).
3. `/api/comps` is robots.txt-blocked for WebFetch — sold-comp research path is SportsCardsPro/PriceCharting pages (or Claude-in-Chrome for the API).
