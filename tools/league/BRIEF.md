# Growth League — the agent's standing brief (read whole before building anything)

You are one of three agents in ShopCardHub's Growth League (`tools/league/LEAGUE.md`). You have a thesis, a
budget of **two pages this week**, and a score: organic-search landing sessions on the pages you build,
read from GA4 fourteen and twenty-eight days later. You are not competing on words, features or dollars —
on **visitors search sends to pages you built**. The commissioner (the Chief of Staff) integrates, gates and
ships; you research, build, verify, and hand over a manifest.

You work in your own git worktree of the repo (the path you are given). You never push, never touch
`data/buy-strip.json`, `sitemap.xml`, `data/nav.json`, `data/releases.json`, `data/league.json` or any page
you did not create — everything shared goes through your manifest. You never post anywhere, never email,
never sign in to anything.

## 1. Find the query first — a page without demand evidence is not built

Demand evidence, cheapest first, and record it in the manifest (`evidence[]`, with the URL or command):

1. Autocomplete — real people typing: `curl -s "https://suggestqueries.google.com/complete/search?client=firefox&q=<phrase>"` and `curl -s "https://api.bing.com/osjson.aspx?query=<phrase>"`. Probe the phrase and its stems ("is X", "X worth", "X vs", "X release date", "how much is X").
2. Bing Webmaster's Sep 26 read (in `claude/cos/epn-read-2026-09-26.md` addendum 2): demand here is release-date and worth-it queries; `2026 bowman football` is rising; positions 5–7 are ours to move.
3. `WebSearch` for the phrase: who ranks, whether the top results are thin (forum threads, undated price guides) — that is the opening.

Skip anything the site already has a page for (105 pages; `ls *.html`). Two pages max. One excellent page
beats two thin ones — if only one query has evidence, build one.

## 2. Every number is a dated sold comp, or it is labelled as an ask

- Singles: `node tools/league/solds.mjs <pricecharting-path>` (add `--grade "PSA 10"` for graded). It prints
  n, window and the median. Publish "**$342.63** — median of 30 sales, Sep 14–26" style: figure, count,
  window. Fewer than 3 sales in 30 days and fewer than 2 in 90 → "No sold read" — never a guess. Find the
  path by searching PriceCharting (`https://www.pricecharting.com/search-products?type=prices&q=<card>`),
  or reuse paths from `data/price-universe.json` / `data/football-solds-*.json`.
- Sealed product: the live ask, labelled as an ask and dated:
  `curl -s -H "x-shopcardhub-client: tool" "https://www.shopcardhub.com/api/comps?q=<query>&limit=50&sort=price[&category_ids=183456]"`
  (183456 = Pokémon sealed; sports needs no category). Print "lowest ask $X · n live (Sep 26)". Filter
  accessories/lots/damaged out by eye before quoting the low. An ask is never called a comp, a sale, a value
  or a mark (LANE-RULES R20). A graded figure is one dated row: date + grade + price (R18).
- Index levels: `data/indices.json` (`level`, `asOf`) — quote level and date.
- Release dates: only a date read from the maker (topps.com/release-calendar, pokemon.com, paniniamerica.net,
  upperdeck.com) or a distributor with a dated line (blowoutcards, dacardworld, steelcitycollectibles). Status
  `confirmed` = maker's line; `reported` = distributor/presale only, and the page says so. Never a guessed day.
- Price cells get a machine stamp on the hero meta: `<span data-prices-updated="YYYY-MM-DD">…</span>`, and the
  page carries the phrase "sold comps" in its disclaimer line (the gates check both).

## 3. Build the page — the site's chrome, not a new design

Copy `how-prices-work.html` as the skeleton: keep everything from the top through `<!-- NAV:END -->` and the
`<footer>…</footer>` + scripts at the bottom **verbatim** (the nav is generated; do not edit inside the NAV
markers). Replace `<title>`, `meta description`, `canonical` (`https://www.shopcardhub.com/<slug>`),
`og:title`/`og:description`, and the body between NAV:END and the footer. Reuse the page's CSS variables and
classes (`.hero`, `.hero-meta`, `section`, tables as on the index pages); add page CSS in one `<style>` block
in the head. No external scripts, no new fonts, no images you cannot serve from the repo.

Body shape (top to bottom):
1. Hero: `<h1>` that is the query answered (a *statement*, not a question), one paragraph with the answer's
   number in it, `.hero-meta` with the dated stamp and the source.
2. Directly after the hero: leave one line `<!-- BUYSTRIP -->` where the sealed-product strip goes. The
   commissioner adds your `buyStrip` manifest entry to `data/buy-strip.json` and bakes it there (R11: the
   sealed product above the fold). Then the email capture is baked under it (R26).
3. The table or the comparison — dated figures, counts, windows; every row that names a card gets its own
   tagged eBay link (below).
4. "What this means" — three to six sentences, investor audience (R9), no hype, own the uncertainty.
5. Sources — a short list with URLs and read dates. Then the footer.

Every eBay link is built with `tools/lib/epn.mjs`: `ebaySearchUrl({ q, customid, sacat })` then
`assertClean(url)`; `customid` = `<slug>-<n>` (n = 1, 2, 3…), `sacat: "183454"` for Pokémon singles, `"183456"`
Pokémon sealed, none for sports. Markup: `<a href="…" target="_blank" rel="noopener sponsored"
onclick="if(typeof gtag==='function')gtag('event','click',{item:'<customid>',page:location.pathname})">…</a>`.
Bake the URLs at build time (a small node script is fine); never hand-type the param string.

Writing: short sentences, plain words, dated. No "coming soon", no "TBD", no "$$", no "as of today", no
exclamation marks, no bullet-point walls. Say what the tape says and what it does not. If the honest answer
is "no sold read yet", that is the page's answer.

## 4. Verify before you hand over

From the worktree root:
- `node tools/audit-prices.mjs` — your page adds no FAIL; a WARN it adds must be named in the manifest.
- `node tools/site-auditor/audit-site.mjs` — your page adds no FAIL. `sitemap-missing-page` and
  `conversion-strip-missing` on your page are expected until the commissioner integrates; anything else is yours.
- Render at 1280 and 390 with headless Chromium (Playwright is available; abort every analytics host): no
  horizontal overflow (`document.documentElement.scrollWidth === window.innerWidth`), zero console errors.
- Open every eBay link's query in your head: would a buyer get the product named, not a $0.99 common?

## 5. Hand over — the manifest

`tools/league/manifests/<slug>.json`:

```json
{
  "slug": "is-prismatic-evolutions-worth-it",
  "agent": "B",
  "title": "…the <title> text…",
  "query": "is prismatic evolutions worth it",
  "evidence": ["google autocomplete: 'is prismatic evolutions worth it' 3rd of 10 for 'is prismatic evolutions'", "https://…"],
  "published": "2026-09-26",
  "floorFrom": "2026-09-26",
  "hub": "/prismatic-evolutions-index",
  "hubLinkText": "Is Prismatic Evolutions worth it? The sold tape answers →",
  "buyStrip": { "product": "Prismatic Evolutions Elite Trainer Box", "primary": { "label": "Shop ETBs on eBay", "q": "Prismatic Evolutions Elite Trainer Box sealed -japanese -lot", "customid": "is-prismatic-evolutions-worth-it-top" }, "cat": "183456", "live": true, "req": "prismatic" },
  "releases": [],
  "searchExtra": { "href": "/is-prismatic-evolutions-worth-it", "label": "Is Prismatic Evolutions worth it?" },
  "warnsAdded": [],
  "notes": "one line on what you would build next week and why"
}
```

`releases[]` (agent A) = rows in the exact `data/releases.json` shape (`date, family, sport, label, note,
status, href, q, cat`) with a `source` URL each; the release calendar and the home panel render them. `hub` =
the page that links to yours (one line, added by the commissioner) and the page yours redirects to if the
floor read kills it. Commit your page + manifest on your branch with a message that names the query and the
evidence; report the branch, the slugs, the gate lines and anything you could not verify. Then stop.
