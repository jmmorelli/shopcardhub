# build-nav.js — single-source site nav

The nav (desktop dropdowns + mobile accordion drawer) used to be hand-copied into
every page. It now lives in ONE place and is generated.

## How it works

- **`data/nav.json`** = the single source of truth. Categories → groups → links.
- **`tools/build-nav.js`** reads it and rewrites the nav region of every top-level
  `*.html` page between the marker comments:

  ```html
  <!-- NAV:START -->  ...generated...  <!-- NAV:END -->
  ```

  It generates both the desktop nav and the mobile drawer, plus an injected
  `<style>` and a `<script>` controller (hamburger toggle, accordion, search,
  active-page highlight). Nav stays as static HTML in every page — **not** a
  client-rendered JS nav — so internal links stay crawlable for SEO.

## Add / change / remove a page in the nav

1. Edit `data/nav.json` (add the link under the right category/group).
2. From the repo root, run:

   ```bash
   node tools/build-nav.js
   ```

3. Review the diff, then commit + push (manual, as always).

That's it — no per-page editing.

## Notes

- **Idempotent.** Safe to re-run; it only rewrites between the markers.
- **First run** (page has no markers yet) auto-detects the old
  `<nav class="nav">…</nav>` + `<div class="mobile-nav">…</div>` block and wraps it.
- It also strips the old inline "Mobile nav toggle" IIFE from each page so the
  single generated controller is the only handler (no double-binding).
- **`card-dungeon.html` is skipped** (internal dashboard, no site nav) — see the
  `SKIP` set in the script.
- `--check` flag = report only, writes nothing.
- Search index is built from nav.json links + `searchExtra` (about / privacy /
  affiliate-disclosure, which are footer-only and not in the dropdowns).

## Consistent grouping

Desktop dropdowns and the mobile accordion use a consistent label vocabulary:
**Players / Set Guides / Guides** (a category only shows the groups it has).
To re-bucket a link, move it between groups in `nav.json` and rebuild.
