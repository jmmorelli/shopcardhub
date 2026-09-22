# Spec — move the feed onto our own origin, then take the repo private

> **BUILT 2026-09-22 (compliance Phase 1, Mo: "start it") — option (a).** A first cut served the feed through
> an API function using the GITHUB_TOKEN Vercel holds; live it fell back to the public URL every time — that
> token no longer reads the repo (`/api/decisions` returns "store read failed" for the same reason). A PAT
> expires; a file in the deploy does not. So: the nightly Action copies three derived files onto `main` under
> `data/feed/`, `/feed/<file>` rewrites to them, every call site moved. What remains before the flip is in STATE.

**Ruled by Mo, 2026-09-20, in chat.** Three questions put to him; he took the recommended option on
all three: filter the bots but do not block them, do the repo-privacy work **properly on Wednesday**
rather than rushed on a Sunday, and fix `/api/comps` in the same session.

**Owner: the Wednesday build session (2026-09-23, 13:00 PT).** This file is the work order.

---

## Why

`jmmorelli/shopcardhub` is a **public** GitHub repo. Verified unauthenticated 2026-09-20:
`claude/cos/STATE.md`, `LANE-RULES.md`, `data/pipeline.json`, `tools/price-engine/snapshot-free.mjs`
and `data/watchlist.json` all return 200 to anyone. That is the price engine, every eBay query, the
operating doctrine, and a state file carrying EPN earnings, GA4 traffic, the milestone ladder and
competitor notes. **This is the actual intellectual-property exposure on this project.** Scraping the
rendered HTML is a distant second, and client-side code shipped to a browser can never be protected
anyway — the defensible asset is the data and the method, not the markup.

## The blocker, and it is bigger than first reported

The first pass of this audit said "three browser hotlinks." **A full grep says 13+ call sites across
three layers**, and every one of them breaks the moment the repo goes private, because
`raw.githubusercontent.com` serves public repos only:

| Layer | Files | Breaks how |
|---|---|---|
| **Browser JS** | `js/home.js` · `js/engine-block.js` · `js/card-img.js` · `js/sealed-row.js` | Homepage ticker, every engine block and chart, card images and sealed rows go blank for every visitor |
| **Serverless** | `api/auctions.js` · `api/decisions.js` · `api/track-signal.js` · `api/_lib/store.js` | Auction desk, dungeon decisions, track-signal all 404 their data |
| **Build tools** | `build-home.mjs` · `build-engine-blocks.mjs` · `build-card-pages.mjs` · `build-bow26.mjs` · `ga4-snapshot.mjs` | Generators bake a dead URL into new pages |
| **Lane prompts** | `claude/lanes/bowman-bangers-tuesday.md`, the Integrity Watch and CoS daily prompts, the Oct 3 conversion-read task | Every scheduled lane's keyless GA4 read stops working |

**That last row is the one that would have been missed.** The whole reason `ga4-snapshot.mjs` exists is
that cloud lanes have no browser and read analytics from a raw URL. Taking the repo private silently
kills that read, and the failure mode is a lane reporting "could not read" — or worse, quietly
reasoning from a stale file.

## Order of work — do not reorder

1. **Pick the origin.** The feed must be served from `shopcardhub.com`. **Hard constraint: no runtime
   secret.** Mo does not handle GitHub secrets (2026-09-18, and the GA4 job was built keyless because
   of it), so a serverless function holding a GitHub token to read a private repo is out. The two
   candidates:
   - **(a) Ship the feed with the site.** The nightly Action writes the feed into the deployed tree
     (the `/data/` path already exists — `api/comps.js` reads `${SITE_ORIGIN}/data/watchlist.json`
     today). No token, no new service, and it lands behind our own CDN. Cost: one extra deploy per
     night, and STATE's standing Vercel rule applies — check the deployments list, a build stuck in
     *Initializing* > 5 min is a zombie.
   - **(b) Vercel Blob or a KV store** written by the nightly Action. No extra deploy; adds a service
     and a write credential in Actions (not at runtime, so it clears the constraint).
   **Recommendation: (a)**, because it adds nothing new to the stack and the pattern already exists.
   The build session rules and records why.
2. **One constant, not 13 edits.** Introduce a single `FEED_BASE` per layer — one in the browser
   bundle, one in `api/_lib/store.js` (which the other API functions should route through), one in the
   build tools. Changing the origin later must be a one-line change, not another grep.
3. **Cut every call site** in the table above and re-run the generators so nothing bakes the old URL.
4. **Update the lane prompts and the Oct 3 scheduled task** to the new URL. Scheduled-task prompts are
   edited by full replacement through the API; the four desktop-local lane prompts are Mo's to edit.
5. **Verify live before flipping anything**: homepage ticker paints, an engine block chart paints,
   `/auctions` returns rows, and one cloud lane completes a GA4 read from the new URL.
6. **Only then flip the repo private.** Confirm the deploy key still pushes and Vercel still builds
   from a private repo (it does — the Vercel GitHub integration is authorised on the account, but
   verify rather than assume).
7. **Scrub what stays.** Even private, `STATE.md` should not be the only thing standing between the
   earnings figures and a future mistake. Not blocking; note it.

## Second item, same session — `/api/comps` is an open proxy on Mo's eBay keyset

Verified live 2026-09-20: anonymous `GET /api/comps?q=...` returns 200, 34 KB, `x-vercel-cache: MISS`
— a live eBay call, no auth, no referer check, no rate limit. Quota is 5,000/day. The 15-minute CDN
cache protects repeated *identical* queries; varying `q` walks straight past it. One script can blank
the pricing engine for a day. `/api/auctions` hands out the entire desk — 230 KB — anonymously.

**The constraint that makes this non-trivial, and it is deliberate:** `api/comps.js` takes `customid`
as a **query param rather than sniffing the Referer**, on purpose, because the response is CDN-cached
and a header-derived value would not be part of the cache key — one page's cached response could hand
its custom ID to another page's visitors. **Any fix must not re-introduce that bug.**

Options for the build session to rule between:
- A Vercel WAF **rate limit** on `/api/*`. Cleanest, but rate limiting is a **priced/Pro** WAF feature —
  check the plan first. WAF custom rules, IP blocking and DDoS mitigation are free on every plan; rate
  limiting and managed rulesets are not.
- An in-function budget: cap uncached upstream calls per window, serve stale or `429` past it. No plan
  dependency, keeps the cache key clean.
- Require a signed or rotating token for uncached queries, issued to our own pages. Most robust, most
  work, and risks breaking the lanes that call the endpoint directly.

## Explicitly NOT doing

- **No country is blocked.** Mo ruled 2026-09-20: filter the bots, do not block them. They cost
  nothing (Vercel bills nothing for mitigated traffic; they do not touch the eBay quota), and blocking
  Singapore and China wholesale risks real collectors in Asia for no measurable gain. **The GA4 bot
  filter shipped 2026-09-20 (`5929714`) already removes them from every number every lane reads.**
- **No sitewide bot challenge.** Vercel's Bot Protection and AI Bots rulesets stay off. Worth
  revisiting if scraping ever shows up as a cost, and safe for SEO when it does — Vercel auto-excludes
  verified bots, and bingbot / googlebot / duckduckbot / yahoo-slurp are all on that list, which is
  ~95% of our search traffic.
- **No attempt to obfuscate client-side code.** It cannot be protected and pretending otherwise wastes
  a session.
