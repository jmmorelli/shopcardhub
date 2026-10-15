# Set checklists — baseball rollout (Aug 21, 2026, late)

Mo: "Can we do that for all of our pages? … start with baseball first." 

## Shipped (repo, Mo pushes)
- **12 baseball set pages** now carry a "The Checklist" section (`<div data-checklist="/data/sets/<slug>.json">`) + `js/set-checklist.js?v=2` + `vault-track.js?v=4`: bowman-chrome-baseball-2026 (earlier), bowman-sapphire-2026, topps-chrome-baseball-2026, topps-chrome-sapphire-2026, topps-series-1-2026, topps-series-2-2026, topps-finest-baseball, topps-inception-baseball (2025 edition — no separate 2026 product), topps-tier-one-baseball, topps-tribute-baseball, topps-pristine-baseball, topps-museum-collection-baseball (status **tba** — checklist not issued; component shows the "not published yet" card and fills in automatically when the JSON is updated).
- **Data:** 12 files in `data/sets/`, 7,437 cards (base sets complete: S1 350, S2 350, Chrome 300, Finest 350, Sapphire 300, Pristine 200, Tier One 100, Tribute 100, Inception 125, Bowman Sapphire BCP 150) + every published autograph group. RC / 1st Bowman / Bangers flags. Parallels intentionally excluded (not separate cards for Vault purposes).
- **Component v2:** sets with >6 groups get a section dropdown instead of tabs; search spans every section on big sets (capped 400 hits); RC flag; TBA state; empty groups skipped.
- **dest.py** now treats `data-checklist` pages as having Track buttons ("Track any card on this page" copy) — re-run on Mo's machine done; 60 pages regenerated.
- Price audit: FAIL 0.

## Method note
Checklist Insider pages are long; the summarizing fetcher truncated/hallucinated rows on 350-card sets, so the agents parsed the raw HTML of the same public pages and verified every group count against the site's own "N cards" headers. Beckett 403s.

## Push
```
git add -A
git commit -m "Set checklists on all baseball set pages (12 sets, 7,437 cards) with Vault Track"
git push origin main
```

## Next
Basketball (topps-chrome-basketball-2026, chrome-black, cactus-jack, chrome-updates, inception, definitive, pristine, wnba), then football (flagship, cosmic chrome, chrome black), soccer, Pokémon (pitch-black, chaos-rising, ascended-heroes, prismatic-evolutions, 30th). Same SPEC at /home/claude/v6/SPEC.md (cat field changes).
