# Topps Direct Affiliate — Retired (Aug 14, 2026) ✅ SHIPPED

## Decision
Mo dropped the Topps direct affiliate track. Every `topps.com` link has been removed from the published site. Buy-intent now routes to **eBay (EPN) / Fanatics (Impact) / Amazon / COMC** only.

**Deployed:** commit `667ac2f` on main, pushed Aug 14 ~2:15pm PT, Vercel live. Verified on-site: flagship-football and museum-collection both serve 0 topps.com references; Fanatics tiles render.

## Rationale
- Topps rarely has newer product in stock, and what does list sells out or is draw-gated (EQL) within minutes.
- A "Buy Direct · Official" CTA that lands on a sold-out or draw-entry page is a dead click — it converts at ~0% *and* costs a click that eBay or Fanatics would have converted.
- Fanatics owns Topps and stocks the same sealed product with real inventory, at 5–10% vs eBay's 3–4%. Nothing is lost by routing Topps product through Fanatics.
- Note for the record: Topps *does* run an affiliate program (Impact, "up to 10%") — account 7418994 was In Review. The program was never the constraint; **inventory** was. Approval would not have fixed the conversion problem.
- If the Impact approval ever lands for free: **Topps NOW** (print-to-order, topps.com-only, 24-hour windows, cannot sell out) is the one use case where a direct link converts.

## What changed — final scope (15 pages, 17 links)
First pass covered 11 pages against the Jul 30 tree; Mo's Mac turned out to be 14 commits behind origin (`ab7be92` → `bd312e5`, 87 files — Aug 3–11 sessions). Stale edits were stashed and dropped, the swap re-run on the fresh tree, which had grown 4 more placeholder pages.

**Fanatics sealed tile replaced the Topps tile on:** chrome-black-basketball, chrome-black-football, flagship-football, pristine-baseball, tribute-baseball, chrome-updates-basketball, **bowman-chrome-baseball-2026, topps-definitive-basketball, topps-museum-collection-baseball, fernando-mendoza-rookie-cards** (last 4 = new Aug pages that inherited the old scaffold).

**"Enter / Details on Topps" buttons →** eBay sealed searches (cosmic-chrome, cactus-jack) and Fanatics + eBay pair (chrome-updates).

**Prose links →** Fanatics + eBay (bowman-sapphire, series-2, finest; finest's ripped.topps.com citation de-linked to plain text).

All new anchors: `target="_blank" rel="noopener sponsored"`. All eBay links: campaign **5339155990**, per-page `customid`.

## Link conventions going forward
- **eBay (EPN)** — singles, sold comps, sealed-box search. Always in stock, works pre-release. `campid=5339155990`, `customid=<page-slug>`.
- **Fanatics (Impact)** — sealed boxes. `fanatics.93n6tx.net/AgROJo` (sealed/trading cards) or `/dykyyj` (hobby-box landing). Generic landings, no product deep-links yet.
- **Amazon Associates** — supplies and retail blasters. `tag=shopcardhub-20`.
- **COMC** — own inventory, `comc.com/Users/DBCooper`.
- **No topps.com buy-links.** Official product pages may be cited in prose only, never as a CTA.

## Generator updated
`tools/topps-release-watcher/` (template + README) no longer scaffolds Topps Buy-Direct placeholders — build checklist now specifies eBay/Fanatics/COMC, so future generated pages won't reintroduce them. Note: the Aug `content_*.py` build scripts still contain old topps.com strings but are one-shot historical records, not live templates — left alone deliberately.

## Verification done
- `grep topps.com` across all HTML: 0 hits (local + live)
- div open/close balance: clean on all 17 changed files
- `node tools/audit-prices.mjs` (the new Aug 11 pricing-integrity audit): exit 0, FAIL 0 (27 pre-existing WARNs on TBA-price cells, unrelated)

## Session lesson (recurring)
Mo's Mac drifts behind origin between sessions — this time 14 commits. **Always check origin vs local HEAD before editing site files**, and order git ops commit-first (`git pull --rebase` refuses with unstaged changes). Bridge cannot delete files: stash/status ops leave `.git/*.lock` files Mo must `rm` himself.
