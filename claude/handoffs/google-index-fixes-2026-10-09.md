# Handoff: Google indexing fixes (CoS → Night Crew + CoS weekly), Oct 9 2026 (rev. 12:40 PT; STATUS block added 18:50 PT — shipped)

**Source:** Mo pasted two Grok web-dev reads of the GSC Page indexing screen (102 known, 3 indexed, 29 crawled–not indexed, 70 discovered–not indexed). The CoS checked each claim against the live site and the repo. **Priority: top of the Night Crew queue, ahead of UI polish.** It works with the Growth League INDEX-FIRST RULING (`claude/cos/traffic-plan-2026-10-09.md`).

## Verified vs not
| Claim | Check | Verdict |
|---|---|---|
| robots.txt clean, no noindex/manual action | robots.txt read live; GSC reasons are Google-system | **True** |
| /card-* pages are JS shells hurting site quality | Live `/card-andrew-fischer` serves `<meta name="robots" content="noindex,follow">`. 26 HTML files carry noindex, including all 20 `card-*`. **0 card pages in sitemap.xml.** | **Already handled** (Grok agreed on its second read). Keep it that way; leftovers age out under "Excluded by noindex". Re-open them only once they server-render unique text. |
| Sitemap lastmod is stale (home stamped 2026-06-16) | 17 sitemap URLs carry 2026-06-16, including `/`, `/best-hobby-boxes-2026` and `/bowman-bangers`. `tools/league/integrate.mjs` writes TODAY only for new rows. | **True, fix it** |
| Utility URLs in the sitemap | `/hobby-box-roi-calculator` (966 words), `/about`, `/track-record` (1,513 words; scorecard client-rendered: "Loading the scorecard…" ×3), `/auctions` (1,104 words; live auction list), `/research` (773 words, the hub) | **Revised (Grok's second read, CoS agrees):** keep `/research`, `/track-record`, `/about` and the calculator. Drop only `/auctions`, and noindex it. |
| Internal links matter more than the sitemap | The home body (nav stripped) links ~86 of 145 sitemap URLs | **Partly.** Coverage is high, but much of it is ticker or nav-style anchors. Add descriptive links. |
| Change the 29 crawled pages before requesting indexing; top 10 only | Google guidance + our Sep 16 rule | **True** |
| Earn external links, to specific URLs | 1 external link (Sep 8 GSC) | **True.** Reddit/outreach link a specific guide or index URL, never the homepage. |

## Night Crew: do in this order (next run Mon Oct 12 00:47; deploy 07:52) — **DONE Oct 9 by the CoS, see STATUS below**
1. **B63 Real lastmod.** `tools/sitemap-lastmod.mjs` sets every `<lastmod>` from the file's last content commit (`git log -1 --format=%cs -- <file>`, full-history clone; skip commits that only touch `data-prices-updated` stamps or nav includes if that's easy to tell). It runs on every build so it never goes stale again. `integrate.mjs` keeps adding new rows with TODAY.
2. **B64 Sitemap = only pages we want ranked.** Remove `/auctions` and add `<meta name="robots" content="noindex,follow">` to it. Keep `/research`, `/track-record`, `/about` and `/hobby-box-roi-calculator`. Add a site-auditor assertion: every sitemap `<loc>` returns 200, is self-canonical and has no noindex, and no noindexed page is in the sitemap. Merged league pages come out as the Growth League consolidates.
3. **B65 Two clicks from home, with words.** In the home page body (not the mega-nav), add a plain "Start here" block of 8–10 descriptive links to the pages that earn or rank on Bing: `/best-hobby-boxes-2026`, `/pokemon-30th-anniversary-2026`, `/indices`, `/how-prices-work`, `/track-record`, `/bowman-bangers`, the top two Pokémon set indices by Bing landings, and the top player guide. Anchor text says what the page is ("2026 hobby box prices and value", not "TH26"). A short version goes on `/indices` and `/research`. Internal links only; no new eBay link family (R33).
4. **B66 Server-render the Track Record scorecard.** Bake the calls table rows from `data/calls.json` into the HTML at build time (the JS can still hydrate on top), so Googlebot sees named calls graded against sold prices with misses kept, not "Loading the scorecard…". Respect generated-marker rules: change the generator, not the output.
5. **Gate it:** the three audits, the new sitemap assertion, and an IndexNow ping after deploy. Log before/after counts (sitemap URLs, stale lastmods, placeholders on /track-record).
6. **B67 (added from the Retention Desk's Oct 9 side finding):** the sector index pages carry no `<h1>` (title is an `h2` in `.sidx-mast`).

## CoS weekly (Wed, Mo's Chrome, GSC)
- Export both reason lists to `claude/cos/gsc-reasons-<date>.md` and tag each URL: card (noindexed), utility, league page, guide, index.
- **Resubmit the sitemap once,** after B63–B64 deploy.
- **Request Indexing only on pages whose HTML materially changed**, max ~10: `/track-record` after B66, then crawled–not-indexed pages after Growth League improve runs touch them. This is a GSC form action, done in a live session with Mo's OK.
- Track weekly: indexed count, the two reason counts, Google clicks. Expect the discovered count to move in 2–6 weeks after the sitemap and link fixes. The crawled count moves only after the pages change.

---

## STATUS — SHIPPED Fri Oct 9 ~18:30 PT by the CoS (Mo in chat: "there's a handoff of bug fixes you need to run … I approve of all") — `ca37d43`, live-verified 18:40 PT

The Night Crew's Mon Oct 12 slot has nothing left from this handoff. What landed, and what Monday checks:

| Item | Shipped as | Live check (curl, Oct 9 18:40 PT) |
|---|---|---|
| **B63** real lastmod | `tools/sitemap-lastmod.mjs` — `<lastmod>` = the page's last **content** commit (shared NAV/RAIL/SIGNUP blocks, `<style>`/`<script>` bodies, head `<link>`s and price stamps don't count; files changed in the current run date today). `price-snapshot.yml` now checks out full history and runs it in the publish step before the commit, so it never goes stale. `--check` exits 1 on drift. | `sitemap.xml`: 144 URLs, 0 at 2026-06-16 (was 17); dates Oct 1–9 |
| **B64** sitemap = pages we want ranked | `/auctions` removed; `<meta name="robots" content="noindex,follow">` added via `build-auctions.mjs` (regenerated; font preload kept in the generator). `audit-site.mjs` §7: every `<loc>` is https://www, a real file, self-canonical, not noindexed; no noindexed page in the sitemap; every `<url>` dated (WARN). `"auctions"` added to `SITEMAP_EXEMPT`. | `/auctions` noindex ✓; sitemap has no `/auctions` ✓ |
| **B65** two clicks from home, with words | `/` gains a "Where to start" panel below the engine screens fold (10 descriptive links: hobby boxes, 30th guide, /indices, /how-prices-work, /track-record, /bowman-bangers, SV151, DR25, Lamine Yamal, 2026 Bowman Chrome guide). Short lines on `/indices` (under the board foot) and `/research` (above "Why a hub"). Internal only (R33). **Substitution:** "top two Pokémon set indices by Bing landings" could not be read offline (no `bing-latest.json` on `price-data` yet); used DR25 (the only Pokémon index with organic landings in GA4 28d) and SV151 (the whole-set flagship that carries R13). Swap when the Bing read exists. Also: the home disclosure no longer names the COMC Referral Program. | `where-to-start` on `/`, `/indices`, `/research` ✓ |
| **B66** server-rendered Track Record | `js/track-record-render.js` = the one renderer (browser + build). `tools/build-track-record.mjs` bakes rows, scoreboard, header counts and a dated `price-asof` stamp between `TR:*` markers; the browser re-renders only when `calls.json` is newer than the bake (no double live-asks fetch); the nightly publish step re-bakes. Rows carry `id="<call id>"` so `/track-record#<id>` (the X board's links) now lands. | 23 `<tr>` in the static HTML, 0 "Loading the scorecard" ✓ |
| **B67** `<h1>` on sector index pages | `build-sector-index.mjs` `bake()`: the index title is the page `<h1>` when the host page has no other `<h1>`, else `<h2>` (the 30th guide keeps its own). CSS `.sidx .sidx-ttl`. 31 pages re-baked. | SV151 `<h1 class="sidx-ttl">` ✓; 30th page still 1 `<h1>` ✓ |
| Gate | audit-prices 0 FAIL / 78 WARN (77 baseline; the +1 is a `calls.json` note now visible in HTML, already flagged on the JSON), audit-site 0 / 5 (171), audit-terminal 0 / 1; headless 390 + 1280 on 9 pages: 0 errors, 0 overflow. **IndexNow ping: 144 URLs → HTTP 200.** | GitHub site-gates run on `ca37d43` — Monday desk reads it (gate-watch issue if red). |

Also in the same commit (Retention Desk rows, CoS rulings Oct 9): **R13** whole-set cost line on the 28 Pokémon sector pages, **R11** signup below the ranked list on `/best-hobby-boxes-2026` + `signup_view`, and the `pageClicks28` events (`chase_click`, `grade_click`, `signup_view`) — see `claude/retention/LEDGER.md`.

### Still to do (unchanged owners)
- **Mon Oct 12 one-shot (10:12, Mac):** confirm the Oct 10 nightly published a sitemap whose `<lastmod>`s moved only for the pages it baked; read the site-gates run; **resubmit the sitemap in GSC once** (B63–B64 are live); do **not** request indexing yet except `/track-record` (B66 materially changed its HTML).
- **CoS weekly (Wed Oct 14, Mo's Chrome):** export both GSC reason lists to `claude/cos/gsc-reasons-2026-10-14.md`, tag each URL; Request Indexing only on pages whose HTML changed (≤ 10): `/track-record`, then crawled-not-indexed pages the League's improve runs touched. Weekly counts: indexed · crawled-not-indexed · discovered-not-indexed · Google clicks. Expect the discovered count to move in 2–6 weeks.
- **Bing read:** once `bing-latest.json` lands on `price-data`, re-pick the two Pokémon index links in the home "Where to start" block by Bing landings.
- **Night Crew Mon Oct 12:** back to the BACKLOG (B30 first; P14 is now done by B67). The crew should not re-add `/auctions` to the sitemap or touch the `TR:*` blocks except by re-running `tools/build-track-record.mjs`.
