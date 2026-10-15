# Signal board + homepage top-5 — SHIPPED Jul 30-31 2026

Repo: ~/shopcardhub (Mo's Mac) → github.com/jmmorelli/shopcardhub → Vercel. Project docs `index.html`/`bowman-bangers-2025.html` here are OLD June snapshots — repo is source of truth.

## What went live (all verified in production)
1. Commit `d77674f` (pushed from Mac): signal board seed-price fallback on /bowman-bangers (10 prospects, Jul 31 SCP reads, BUILDING chips), homepage panel → "Top 5 by Auto Value" live-wired to the nightly feed w/ Jul 31 static fallback (Holliday 129 / Fischer 85 / Arquette 74 / Jump 61 / Aloy 60 — Pierce out, Jump in), ticker/stats refreshed, Marek Houston name fix, store.js typo fix, ebay-source watchlist (ranks mirror Jul 28 editorial re-rank), snapshot-free.mjs.
2. Vercel Git webhook did NOT fire for the push — deployed manually via dashboard (Create Deployment → main → Deploy to Production). Watch this on future pushes; if it recurs, check Settings → Git.
3. `.github/workflows/price-snapshot.yml` created via GitHub web UI (Mo's PAT lacks `workflow` scope — pushing workflow files from the Mac will fail until the token gets that scope). Nightly 08:15 UTC (~1:15am PT), zero secrets: prices via the site's own public /api/comps (eBay Browse keys already in Vercel), commits feeds to `price-data` branch.
4. Run #1 failed (branch-name bug; fixed with `git checkout -B price-data`). Run #2 green but marks polluted by graded/parallel asks (Fischer $337). Added title verification to snapshot-free.mjs (require player last name + "auto"; exclude psa/bgs/sgc/graded/refractor/sapphire/serial-numbered/lots). Run #3 green: Fischer $145.47, Holliday $175 — raw-base-auto asks only. Feed live: raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/prices-latest.json
5. Both pages auto-switch from seed to feed (feed already live). Signals stay BUILDING/HOLD until 20 nightly points (~Sep 19).

## Notes / follow-ups
- Ask-side marks run above sold comps by design (consistent methodology nightly; TA needs consistency, not absolute level). Night-1 history now starts clean.
- Mo's Mac repo is 3 commits behind (workflow + fix + filter made via web UI): run `git pull` in ~/shopcardhub before next local edit. `_staging/` dir was removed; `backup-signal-board` local branch can be deleted (`git branch -D backup-signal-board`).
- Duplicate `tools/price-engine/price-snapshot.yml` still in repo (inert; the active one is in .github/workflows). Can be deleted anytime.
- Fischer editorial copy on /bowman-bangers was already rewritten Jul 28 (hold/buy-the-dip) — no action needed.
