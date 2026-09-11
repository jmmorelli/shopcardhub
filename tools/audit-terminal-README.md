# audit-terminal.mjs — the wiring gate

**Standing rule (Sep 11 2026): the Chief of Staff runs three gates before any push — `audit-prices`, `audit-site`, `audit-terminal` — and all three must report `FAIL: 0`.** A WARN never blocks a push, but every WARN is read and either actioned or explicitly left.

```
node tools/audit-prices.mjs
node tools/site-auditor/audit-site.mjs
node tools/audit-terminal.mjs --feed ../pd/data
```

`audit-site` owns the page contract (EPN params, nav single-source, sitemap, tag balance, z-index, placeholder copy). `audit-prices` owns pricing integrity (no `$$`, dated stamps). `audit-terminal` owns the **connections**: nightly feed → engine block on its host page → ★ Track button → Vault → `/api/*`. If a check belongs to one of the other two gates it is not duplicated here — the one exception is the NAV css contract, which check 5 re-runs on terminal pages because those pages are the ones most likely to have their `<style>` reorganised.

Read-only, offline, zero-dependency, Node 22 ESM. Same output format as audit-site:

```
Terminal wiring gate — 2026-09-11 (feed: /path/to/pd/data)
94 pages scanned · FAIL: 0 · WARN: 52
  [FAIL] code · file[:line] — detail
  [WARN] code · file[:line] — detail
```

Exit code 1 on any FAIL. `--json` prints `{date, pages, feed, fails[], warns[]}` instead.

## Running it

| flag | meaning |
|---|---|
| `--feed <dir>` | a clone of the `price-data` branch's `data/` folder (`prices-latest.json`, `prices-history.json`, `market-latest.json`). Default: `<repo>/../pd/data`. Missing → one `WARN feed-unavailable` and the feed sub-checks are skipped (the gate still runs everything static). |
| `--repo <dir>` | audit a different tree (used for the proof-of-fire run against a scratch copy). Default: the repo this file lives in. |
| `--json` | machine-readable output. |
| `AUDIT_TERMINAL_DEBUG=1` | env var; prints every parsed `/api/*` call site (params sent, response keys read) to stderr. Use it when an `api-contract` finding looks wrong. |

To get the feed clone in a fresh container: `git clone --depth 1 -b price-data <repo-url> ../pd`. The container cannot always reach raw.githubusercontent.com; the gate never fetches anything itself.

Scans every root `*.html` except `card-dungeon.html` and `welcome-email.html` (same skip set as audit-site), plus `js/*.js` and `api/*.js` for the API contract.

## The codes

| code | level | what it means / what fires it |
|---|---|---|
| `engine-host-consistency` | FAIL | The engine block and the watchlist disagree. Every `data/watchlist.json` card with a `slug` whose page exists must carry `.cp-embed[data-card="<id>"]` on that page; every `.cp-embed` on any page must map back to a watchlist card and sit on that card's host (a card renders on exactly one host). A host page must have exactly one `<!-- ENGINE:START -->`/`<!-- ENGINE:END -->` pair placed **after** `<!-- DEST:END -->`, link `/css/engine-block.css` exactly once and `/js/engine-block.js?v=N` exactly once (both inside the markers), keep every embed inside the markers, list the same card ids in the START comment as it carries, give each embed a `button.sch-track-card` whose `data-feed` is `<source>:<id>`, and include cache-busted `/js/vault-track.js`. Fix: `node tools/build-engine-blocks.mjs`. A non-host page that loads the engine css/js gets a WARN. |
| `feed-key-valid` | FAIL / WARN | Every `data-feed="<source>:<id>"` on any page must name a watchlist card whose `source` matches, and (with `--feed`) the key must be in `prices-latest.json` `cards[].key` — otherwise the Vault links a card the engine never prices. WARN if the key is priced but has no `prices-history.json` entry yet (chart renders empty on night one). |
| `engine-ids-unique` | FAIL | `#chart-<id>`, `#sold-<id>`, `#live-<id>` and `data-card` must be unique per page; every in-page `href="#chart-…/#sold-…/#live-…/#engine-…"` must resolve to an id on that page. |
| `fold-markers` | FAIL | Only on pages that have `<!-- FOLD:START -->`/`<!-- FOLD:END -->` or `<details class="guide-fold">`. Markers must pair in order; each guide-fold has exactly one `<summary>` and it is the first child; no `<details>` nested inside a guide-fold; at least one `<h2>` inside each guide-fold (the folded section keeps its heading in the DOM); the page still has exactly one `<h1>`. |
| `terminal-css-order` | FAIL / WARN | Only on pages that link `/css/terminal-page.css`. The file must exist, be linked once, inside `<head>`, and **after** the page's last inline `<style>` in head (override order). The page must still pass the NAV css contract (`.nav-links{display:flex}`, `.nav-hamburger{display:none}`, one `@media` flip) — the regexes are copied from audit-site §14, not imported, so keep them in sync by hand. WARN if there is no inline style to order against. |
| `redirect-consistency` | FAIL / WARN | Every `/card-<id>` redirect in `vercel.json` must point at a page that exists, that hosts `.cp-embed[data-card="<id>"]`, and that is the card's watchlist `slug`; the id must be a watchlist card. WARN: a hosted card with no `/card-<id>` 301 (old links/SERP entries would 404); a `card-<id>.html` still on disk while its URL 301s away (unreachable file). |
| `api-contract` | FAIL | Static contract between callers and `api/*.js`. For every `'/api/<name>?…'` call site in pages and `js/`: the handler file must exist; every query param the caller sends must be one the handler reads (`req.query.X` / `searchParams.get('X')`); `/api/comps` calls must send `card=` or `q=`, and always `customid=` (EPN attribution); every top-level key the caller reads from the parsed response must be one the handler sets in a 200 response. Also: `api/comps.js` must still resolve `?card=` from `data/watchlist.json`, and `js/engine-block.js` must still call `/api/comps?card=<id>`. |
| `rail-single-source` | FAIL | Only if any page carries `<!-- RAIL:START -->`/`<!-- RAIL:END -->` (terminal step 2). The block must be **byte-identical** across every page that has it, and every `href` in it must be a site path present in `data/nav.json` (any `href` field) or one of `/`, `/watchlist`, `/indices`, `/auctions`. Skips cleanly when no page has a rail. |
| `empty-state-box` | WARN | Engine empty-state copy ("loading nightly series", "no auction close recorded", "live listings are unavailable") sitting inside a bordered container. The container classes are detected from `css/engine-block.css` (a `.cp-*` rule with a solid/dashed/dotted border whose name contains empty/box/state — today that is `.cp-empty`). Scanned in pages and in `js/engine-block.js` (runtime-generated boxes). Reported with file:line. These 52 are expected to clear as the Terminal Builder lands the quiet-line treatment. |
| `feed-shape` | FAIL / WARN | With `--feed`: `prices-latest.json` has a `day` (WARN if older than 2 days) and each card has `key`, `label`, `last` (number or null), `signal`, `gated` (array or null), `supply` (number or null), `points`; `prices-history.json[key].series[]` are `{d: YYYY-MM-DD, p: number|null}`; `market-latest.json.cards[key]` has `hammers[]` and `closes: number`. FAIL if any hosted card is missing from the feed (its block would show "—" forever). WARN if the feed prices a key that is not in the watchlist. |
| `feed-unavailable` | WARN | No feed clone found at the `--feed` path; feed sub-checks skipped. |
| `watchlist-json` | FAIL | `data/watchlist.json` does not parse — nothing downstream can be trusted. |

## What it deliberately does not do

- It never fetches: no raw.githubusercontent.com, no live site, no eBay. Live verification is the CoS's push checklist, not a gate.
- It does not judge design. The empty-state check is a WARN precisely because the box-vs-line decision is the Builder's; the gate only makes it visible.
- It does not re-check EPN params on links, nav drift, or sitemap coverage — audit-site does, and a check that lives in two places drifts.

## Proving it fires

Copy the repo and the feed clone under the scratchpad, break something (a `data-feed` on a fake id, a duplicate `#chart-` id, a redirect to a page that does not exist, an extra `&foo=` on the engine's `/api/comps` call, a stale `day`), then run `node tools/audit-terminal.mjs --repo <copy> --feed <copy-feed>`. Every one of the ten checks fired on the Sep 11 2026 proof run (21 FAILs from 10 deliberate breaks). Never introduce a break in the real tree to test the gate.
