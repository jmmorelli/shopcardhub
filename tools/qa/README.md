# tools/qa — harness, click-through suite, render, migration proof

| file | what |
|---|---|
| `harness.cjs` | the shared beacon-safe harness: localhost server with Vercel semantics, request routing (feed → clone, `/api/*` → fixtures, images → 1×1 PNG, analytics/fonts ABORTED, everything else off-box ABORTED), Playwright loader. Every other file here builds on it; **nothing in this folder ever sends a beacon.** |
| `interactions.cjs` | the scripted click-through suite — a **gate** via `audit-terminal.mjs --run-tests` |
| `render-local.cjs` | fold + full screenshots at 1440/390 and a `report.json` — a *look*, not a gate |
| `vault-migration.test.cjs` | Builder-owned proof that the Vault v1 → v2 migration is lossless (run by `--run-tests`) |
| `controls-audit.cjs` | Builder's one-off audit that found the dead saved screens (Sep 12); superseded by `interactions.cjs` |
| `fixtures/` | `/api/comps` and `/api/auctions` responses shaped like the real handlers |

## interactions.cjs — the click-through suite

```
node tools/qa/interactions.cjs                          # all five pages on the local harness
node tools/qa/interactions.cjs --pages index --only "saved screen" --feed ../pd/data
node tools/qa/interactions.cjs --prod https://www.shopcardhub.com --json > sweep.json
```

| flag | meaning |
|---|---|
| `--pages a,b` | scope to these slugs (default: `index,watchlist,indices,auctions,bowman-bangers`) |
| `--feed <dir>` / `--repo <dir>` | as for the render harness |
| `--only <text>` | run only scenarios whose name contains the text (debugging); `QA_DEBUG=1` prints each verdict |
| `--json` | `{date, mode, origin, pages[], scenarios, fails[], warns[]}` |
| `--prod <origin>` | run the SAME scenarios against production: the origin, `raw.githubusercontent.com` and image hosts continue; analytics/fonts hosts are aborted; `dead-link` uses HEAD requests. **After every prod run, open GA4 → Realtime and confirm no event arrived from the run (CHARTER §4)** — the abort list is the safeguard, the realtime check is the proof. |

**What a scenario asserts.** Each control is clicked on a fresh page load (the Vault mirror is re-seeded with a v1 store before every load; `prompt`/`confirm`/`alert` are stubbed) and must produce a *visible* change within **1.5 s**: a navigation (`nav`), a DOM mutation inside the named panel or a class/`hidden`/`open`/`aria-*` toggle anywhere (`dom`), a scroll or hash-with-target (`scroll`), a file chooser (`picker`), or — for saved screens — the Screens rows changing **and** the panel entering the viewport (`screen`). Selects are tried on every other option (two options may legitimately sort identically). A self-link (rail row for the current page) is a reload, not a control, and is skipped. No change → `[FAIL] dead-control · page — scenario: selector [n] "text" (href) — no visible change within 1500 ms`.

**Scenarios.** `/`: every rail nav row, the #tape anchor, every guides group (open and close), every guides link, Guides all →, every portfolio row, Vault →, every saved screen, every Screens chip, every Markets row (chart panel must change; PRE rows are n-a and need only link), All signals », Full board », Auction Desk », every In Focus item, engine/movers/screen row links, and the `#screen=<id>` deep link on load. `/watchlist`: rail rows, Hunting / My cards tabs, portfolio ▾ menu, portfolio switch, + New, Rename, Delete, Cards / Table, Columns ▾, sort and group selects, + Add Card open and close, Paste a List, Share, Import (file picker), ★ Track chooser, row popup, How the Vault works, and the `#pf=<id>` deep link. `/indices`: rail rows, every index row, ★ Track. `/auctions`: rail rows, the four filter chips (and back to All), the card select. `/bowman-bangers`: rail rows, board tabs (optional), every Signal Board filter (and back to All), ★ Track. Scenarios marked optional in the file WARN `scenario-skipped` when their selector is absent instead of failing.

**Generic per page.** `dead-link` (FAIL): every internal `<a href>` must resolve to a file, a cleanUrl or a `vercel.json` redirect (HEAD < 400 in prod). `inert-control` (WARN): a visible `button`/`[role=button]`/`summary` with no `onclick`, no form, no href context and no click listener (own, ancestor, or document-level delegation — inspected through CDP). `console-error` (FAIL): any console error or page error not caused by a harness abort. `offbox-request` (WARN): the page asked for a host the harness had to abort — a new dependency.

**Proof it catches the bug.** On `origin/main` `6f9a9cd` (before the hotfix) the suite reports 7 `dead-control` FAILs on `/` with the feed (all five rail saved screens, the Board chip, and the `#screen=fat` deep link: rows changed but the Screens panel never entered the viewport) and 12 without the feed (nothing changed at all). On the hotfix branch: 134 scenarios, FAIL 0.

## render-local.cjs — screenshots

`vault-migration.test.cjs` (Builder-owned, step 3) proves the Vault v1 → v2 migration in `js/vault-schema.js` is lossless; `node tools/audit-terminal.mjs --run-tests` runs it as part of the gate (`migration-test-present`).

`render-local.cjs` renders repo pages in headless Chromium **without a single byte leaving the box** (routing lives in `harness.cjs`). It exists so the sweep/QA step is the same script every session instead of a per-session improvisation (STATE open item, closed Sep 11 2026).

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
