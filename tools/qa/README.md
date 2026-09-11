# tools/qa — local render harness

`render-local.cjs` renders repo pages in headless Chromium **without a single byte leaving the box**. It exists so the sweep/QA step is the same script every session instead of a per-session improvisation (STATE open item, closed Sep 11 2026).

```
node tools/qa/render-local.cjs --pages index,ethan-holliday-rookie-cards,auctions --out ../qa-2026-09-11 --feed ../pd/data
node tools/qa/render-local.cjs --pages index --hash "#screen=under100" --out ../qa-screens
```

| flag | meaning |
|---|---|
| `--pages a,b,c` | slugs to render (`index` or `/` for the homepage). Default `index`. |
| `--out <dir>` | where screenshots + `report.json` go (created). Default `$SCRATCHPAD/qa-<date>` or `/tmp/qa-<date>`. Never inside the repo. |
| `--feed <dir>` | a clone of the `price-data` branch's `data/` folder. Default `<repo>/../pd/data`. Missing → feed requests are aborted and the page renders its empty states. |
| `--repo <dir>` | render another tree (a scratch copy). Default: this repo. |
| `--hash "#…"` | appended to every URL — render a saved screen (`#screen=board`) or the tape anchor. |
| `--port`, `--wait` | server port (4173) and settle time after network idle (1200 ms). |

Requires the global Playwright (`$(npm root -g)/playwright`, or set `PLAYWRIGHT_ROOT`) with Chromium installed.

## What the box does with each request

| request | treatment |
|---|---|
| `http://127.0.0.1/…` | served from the repo: `cleanUrls` (`/foo` → `foo.html`, `/` → `index.html`) and the literal redirects in `vercel.json` (308) |
| `/api/comps`, `/api/auctions` (any query) | `tools/qa/fixtures/comps.json` / `auctions.json` — shaped like the real handlers' 200 payloads (`verified[]`, `listings[]`, `rejected`; `rows[]`, `markDay`, `count`, `underMark`). Any other `/api/*` gets `{}`. |
| `raw.githubusercontent.com/…/shopcardhub/price-data/data/<file>.json` | served from `--feed` |
| `i.ebayimg.com`, `images.*`, any `image` resource off-box | a 1×1 transparent PNG |
| `googletagmanager.com`, `google-analytics.com`, `*.analytics.google.com`, `stats.g.doubleclick.net`, `fonts.googleapis.com`, `fonts.gstatic.com` | **aborted** — no GA hit, no beacon, ever |
| anything else off-box | aborted (the harness is fully offline; the report lists every aborted host so a new dependency is visible) |

## Output

Per page: `<slug>-1440-fold.png`, `<slug>-1440-full.png`, `<slug>-390-fold.png`, `<slug>-390-full.png`, and one `report.json`:

```
{ page, url, height1440, height390, scrollWidth390, consoleErrors[], requests: { aborted[], stubbed[], feed[] } }
```

`consoleErrors` excludes "Failed to load resource" lines for resources the harness itself aborted; everything else (page errors, real 404s on-box, script exceptions) counts. Exit code 1 if any page has a console error or `scrollWidth390 > 390` (horizontal overflow on a phone) — so the harness can sit in a pre-push checklist next to the three gates, but it is a **look**, not a gate: the CoS reads the screenshots.

## Fixtures

`fixtures/comps.json` and `fixtures/auctions.json` are hand-written, clearly labelled `FIXTURE`, and carry the full EPN param set on every URL so a rendered link looks exactly like production. Regenerate them only when `api/comps.js` / `api/auctions.js` change their response shape (the `api-contract` check in `tools/audit-terminal.mjs` will tell you when the keys move).
