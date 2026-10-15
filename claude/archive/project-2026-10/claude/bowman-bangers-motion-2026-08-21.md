# Bowman Bangers — ballpark motion (Aug 21, 2026)

Mo asked for a Pokemon-30th-style animation on Bowman Bangers ("do what you want"). Written to ~/Projects/shopcardhub/bowman-bangers.html (local only at session end — Mo pushes).

## What shipped (page-scoped, ~10KB, zero images, no data/markup changes)
- `<style id="bangers-diamond">` right after the main `</style>` in `<head>` (before NAV:START — build-nav can't clobber it) + one `<script>` before `</body>`.
- **The swing**: CSS bat (clip-path polygon, wood gradient) pivots at its knob, bottom-right of hero, mirrored so it swings left. Load → CONTACT at 67% of a 1.35s swing → follow-through. At contact: impact star (conic-gradient spokes), hero flash (steps(3) flicker), and a CSS baseball (red dotted seams, white trail) launched along an `offset-path` quadratic computed at swing time from the actual bat length/position → exits top at ~42% width. Fires at 1.1s after load, re-fires every 40s.
- **The roller**: baseball bounces (decaying) and rolls along viewport bottom, 7.5s, first at 4.2s, then 2.6s after each swing.
- **Refractor sweep**: the word BANGERS gets a Chrome-refractor light pass (background-clip:text) every 9s.
- **Infield diamond**: faint rotated square + mound circles + 4 bases (home plate lit cyan) behind hero copy, right side.
- **Rank stamp**: `.entry-rank` numbers punch in (scale 1.7, seam-red → settle) via IntersectionObserver as each entry scrolls into view.
- prefers-reduced-motion: JS bails entirely + CSS hides everything.
- Tuning knob: `RESTRIKE = 40000` in the bottom script block.

## QA (Playwright, cloud container)
body.innerText identical to original (24,372 chars); all tables identical; scrollHeight identical (13,282); 5 Track buttons, 15 mkevt=1 links, full href list identical; zero new console errors; reduced-motion injects 0 nodes. Mobile (390px) clean — bat scales to 150px. Note: 506px horizontal overflow at 390px exists on the ORIGINAL too (pre-existing, not from this change — worth a look later).

## Ideas parked (Mo approved the direction, not yet built)
- Data-tied motion: when the nightly feed moves a player's price >X%, that row gets a hit ripple (up = leaves the yard, down = grounder). Needs a look at the feed render code first.
- ROY Watch: 3D card flip on hover. Cooper Flagg: bounce/swish. PSA guide: slab encapsulation on the hero card. Skip homepage/guides (SEO workhorses stay lean).
