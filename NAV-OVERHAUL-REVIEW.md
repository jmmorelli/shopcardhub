# Nav overhaul — review summary (Jun 27, 2026)

Built, committed locally, **not pushed**. Review the diff and push when happy.

## What changed

The nav (desktop dropdowns + mobile drawer) is no longer hand-copied per page.
It's generated from one config into all 39 pages.

- **`data/nav.json`** — single source of truth (categories → groups → links + CTA + search-only extras).
- **`tools/build-nav.js`** — zero-dependency Node ESM generator. Rewrites the nav region of every `*.html` between `<!-- NAV:START -->` / `<!-- NAV:END -->`. Idempotent. `--check` = report only.
- **`tools/build-nav-README.md`** — usage.

The generated region contains: a scoped `<style>`, the desktop `<nav>`, the mobile drawer, and one `<script>` controller (hamburger toggle + accordion + search + active-page highlight). Nav stays **static HTML** (crawlable — no client-rendered nav), per the SEO constraint.

### 1. Single source + build step
Edit `nav.json`, run `node tools/build-nav.js`, done. No per-page editing ever again.

### 2. Mobile drawer → accordion
Was a flat ~35-link dump with emoji grouping. Now 7 collapsed category sections (tap to expand) mirroring desktop, with sub-labels inside. Scannable at 35 links or 150. Hamburger toggle + aria states preserved; smooth max-height transition, no library.

### 3. Desktop dropdowns → consistent grouping
Uniform **Players / Set Guides / Guides** sub-labels across every sport (a category only shows the groups it has). Reuses existing `.dd-label` + `<hr>` styling.

### 4. Site search box
On-brand input (JetBrains Mono, 2px radius, existing tokens) in the desktop nav and at the top of the mobile drawer. Client-side filter over a small page index (built from nav.json + about/privacy/affiliate-disclosure). Keyboard support (↑/↓/Enter/Esc). No new colors or fonts introduced.

## How to add a page going forward
1. Add the link under the right category/group in `data/nav.json`.
2. `node tools/build-nav.js` from the repo root.
3. Review diff, commit, push.

## Verification (all 39 pages)
- **Links preserved (SEO):** 0 lost — every internal href present before is present after, per page. (Drift across pages turned out to be whitespace only; link *content* was already identical, so nothing was added either.)
- **Div balance:** open−close delta unchanged on every page (the pre-existing psa-grading-guide 153/154 imbalance is untouched, not newly introduced).
- **Scripts:** `<script>`/`</script>` balanced on every page; controller JS passes `node --check`.
- **Idempotent:** second run writes 0 files.
- **Generator self-check:** `node --check tools/build-nav.js` clean.

## Bonus fixes the generator made
- `aiva-arquette-1st-bowman.html` was missing its hamburger button **and** toggle JS entirely → now has working nav.
- `bowman-bangers`, `cooper-flagg-rookie-cards`, `roy-watch-2026` each had the toggle IIFE duplicated → de-duped.
- 4 pages had an empty `<script></script>` shell after the old toggle was removed → cleaned.
- `card-dungeon.html` intentionally **skipped** (internal dashboard, no site nav) — see `SKIP` in the script.

## Please eyeball before pushing (flags)
1. **Screenshots not capturable this session** — the Chrome extension can't open `file://` and the sandbox can't reach your local browser. So I verified structure/markup but not pixels. Quick visual check recommended: `index`, `bowman-bangers`, `pokemon-tcg-2026`, and a player page (e.g. `cooper-flagg-rookie-cards`) at desktop **and** ~380px — confirm dropdowns hover open, the drawer accordion expands, and search works.
2. **Regrouping** moved some links between sub-labels (the link *set* per category is unchanged — only the Players/Set Guides/Guides labeling). Sanity-check the taxonomy in `nav.json`.
3. **Logo** kept as a `<div>` (not linked to `/`) to match the original. Linking it home is a one-line change in `nav.json` + generator if you want it.

## Active-page highlight
Added (didn't exist before): the controller adds `nav-active` + `aria-current="page"` to the matching link at runtime, styled with `--accent`. Works for both pretty URLs (live) and `.html` (local).
