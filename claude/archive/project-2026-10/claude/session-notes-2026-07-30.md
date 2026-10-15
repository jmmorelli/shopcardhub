# Session Notes — Jul 30-31, 2026 (full record)

Everything shipped and learned this session, in order. Detail docs: `claude/price-engine-fix-2026-07-31.md` (engine + deploy saga), `claude/email-signal-alerts-2026-07-31.md` (email build). Current priorities: `TODO_NEXT.md` (Kit account = Priority 0).

## Starting problems (Mo's report)
1. Homepage "Bowman Bangers" top-5 box showing outdated June data.
2. Signal board on /bowman-bangers permanently stuck on its empty state.

## Root causes found
- Signal board: the nightly price engine had NEVER run — watchlist ids all `REPLACE_ME`, no `price-data` branch on GitHub, `store.js` default-repo typo (jmorelli vs jmmorelli), and the whole design depended on paid SportsCardsPro/PriceCharting subs that were never bought. Mo's call: **no paid subs — build a free path.**
- Homepage: hardcoded June prices. Market had moved hard (Fischer ~$30→~$85 sold, Pierce ~$35→~$19, Holliday ~$100→~$129 — read manually from SportsCardsPro public pages Jul 31).
- Mo's Mac repo was ~3 weeks behind origin (21 commits), which caused the push conflict mid-session.
- Discovery that changed the architecture: `/api/comps` (built Jul 24-28 by earlier sessions) is a PUBLIC eBay Browse comps endpoint already live on Vercel with working keys → the nightly engine needs ZERO secrets.

## Shipped to production (all verified live)
1. **Signal board seed fallback** — renders all 10 prospects as a price board (Jul 31 SCP marks, honest BUILDING chips) whenever the nightly feed is missing; auto-switches to live feed data. "Mark Houston" corrected to Marek Houston.
2. **Homepage panel rebuilt** — "Top 5 by Auto Value," live-sorted nightly from the feed, Jul 31 static fallback (Holliday/Fischer/Arquette/Jump/Aloy — Pierce out, Jump in); ticker + stat numbers refreshed.
3. **Zero-secret nightly price engine** — GitHub Action (08:15 UTC / ~1:15am PT) prices each watchlist card off /api/comps (trimmed median of lowest verified fixed-price asks), computes TA via ta.js (trend stack, ROC, z-score, skew, kurtosis), commits `prices-history.json` + `prices-latest.json` to isolated `price-data` branch. Three runs to green: #1 branch-name bug (fixed: `git checkout -B price-data`), #2 marks polluted by slabs/parallels (Fischer $337), #3 clean after adding title verification (require player last name + "auto"; exclude psa/bgs/sgc/graded/refractor/sapphire/serial-numbered/lots) → Fischer $145.47, Holliday $175. Night 1 banked for all 10 cards. Signals flip from BUILDING at 20 points ≈ **Sep 19**.
4. **Email capture + newsletter engine** (dormant, awaiting Kit account): "Signal Alerts" signup blocks on /bowman-bangers, homepage, /roy-watch-2026 — hidden until `data/newsletter.json` gets a `kitFormId`. `newsletter.mjs` in the nightly Action: auto-scheduled flip-alert broadcasts (only past 20 points; 15-min undo) + Monday Tape Recap auto-DRAFT (Mo reviews/sends). Needs `KIT_API_KEY` GitHub secret. Emails carry EPN-tagged eBay links (customid=signal-alerts).

## Commits (main): d77674f (seed board + homepage + engine files, pushed from Mac) · 8957572/796aa87/ff63a14 (workflow created + branch fix + newsletter step, via GitHub web UI) · 4fcf2e4→amended (PAT workflow-scope workaround) · ab7be92 (email capture files). Plus price-engine[bot] commits on `price-data`.

## Operational gotchas learned (recur-worthy)
- **Mo's git PAT lacks `workflow` scope** → terminal pushes touching `.github/workflows/` are rejected. Fix at GitHub → Settings → Developer settings → token → check `workflow`; meanwhile edit workflows via web UI.
- **Vercel webhook flaked once** (d77674f needed manual Deploy to Production via dashboard); fired normally for ab7be92. Watch after each push.
- Remote device tools can't write `.github/` (protected) or delete files; git ops from the bridge leave stale `.git/index.lock` (fix: `rm -f .git/index.lock`).
- zsh mangles multi-line pasted command blocks — give Mo single-line commands.
- Ask-side marks run above sold comps by design; consistency nightly is what the TA needs. /api/comps CDN-caches identical queries 15 min.

## Wax Cache assessment (Mo asked if waxcache.com is stealing the site)
No. It's an inventory-management SaaS (boxes/QR/scanning, freemium) — zero code fingerprints of ours (checked GA id, EPN campaign, verification token, fonts, CSS classes, copy), zero content overlap in their 30-URL sitemap, no search association. Different lane; arguably a partner target (they have /partners). Real "cards as stocks" competitors = Card Ladder / Market Movers; our edge = free + public methodology + accumulating proprietary nightly history + graded Track Record. Ideas we took from their playbook → TODO: "free alternative" comparison pages, sharper homepage thesis line, and above all the email list (owned audience).

## Immediate next step (Priority 0 in TODO_NEXT.md)
Mo creates free Kit.com account → hand Claude the signed-in Chrome tab → form ID into newsletter.json, KIT_API_KEY into GitHub secrets, domain DNS verification. Everything else is already wired.
