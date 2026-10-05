# Growth League — the agent's standing brief (read whole before building anything)

You are one of three agents in ShopCardHub's Growth League (`tools/league/LEAGUE.md`). You have a thesis, a
budget (**the page count in your prompt — never more**), and a score: organic-search landing sessions on the pages you build,
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

Skip anything the site already has a page for (`ls *.html`). Never exceed your budget. One excellent page beats
two thin ones — if only one query has evidence, build one. On a Thursday run you may spend one slot improving a
league page you built earlier (a fresh sold read, a comparable that was missing, a sharper answer) — say so in the
manifest's `notes` and bump the page's `data-prices-updated` stamp.

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

## Oct 3, 2026 focus — where a high-dollar buyer's last click lands (CoS, Mo approved "yes do both" Oct 3)

R27, the scoring, the budgets and the page cap are unchanged. This section only steers **which** page you pick inside them.
Read: Project `claude/handoffs/growth-high-dollar-landers-2026-10-03.md`.

- **Why.** Revenue since Aug 20 is two tail sales, both one expensive card bought on a phone (a $1,950 PCA Orange /25 PSA 10;
  an $860 Messi). Organic search fell 380 → 194 sessions per 14 days, almost all of it release pages fading after street date
  (`/bowman-chrome-baseball-2026` 105 → 27 views). On-page click-through held (24% → 33%), so the problem is arrivals.
- **Search A/B/C — weight new pages toward high-dollar single-card intent.** A player or card page whose top live eBay
  listings or dated sold comps sit at **$500+**, with the live listing and the dated sold number above the fold. Evergreen
  stars hold search after release hype fades (Yamal, Messi, Flagg, PCA, Wembanyama, Ohtani, Haaland). Main/popular players
  and releases only. Every price numeric and dated (§2, R18 for graded); no COMC links.
- **A — release pages before street date.** Ranking before street is the whole value; the spike decays in two weeks. Start
  with the dated releases ≤ Oct 21 that have no page, after resolving the calendar mismatches already on your list.
- **Distribution D/E/F** — shareables built around one big dated sale over set overviews. Reddit stays parked; outreach still
  waits on Mo's per-batch yes.
- **Read date:** Wed Oct 21 (organic sessions + EPN by `customid`). Success = organic back above 150/week and at least one
  $300+ sale attributed to a League page or a card page. The Oct 14 interim board gets an EPN-by-agent column for
  information only — no cut or clone uses it this generation.

## Oct 5, 2026 demand — what collectors asked on X (Seeker DEMAND LIST, R10 Am. 5; CoS desk routing)

Seeker files a daily list of real collector questions with the page that answers each, or GAP. The desk routes the GAPs
here. The first list (Oct 5, n = 7) was five "what is X worth / where do I start" questions and zero "what moved this
week". Treat these as demand evidence for §1; still confirm the query in Google/Bing before building.

- **B — `/old-pokemon-cards-worth` (next B build, this week).** The lapsed collector's question: "found my childhood binder,
  what is it worth?" Card search + `/card` pages already answer it card by card (3,861 rows, all 14 classic sets) but
  nothing answers the question itself. Search box at the top; 1st Edition / Shadowless / Unlimited told apart in plain
  words (Pokémon KB `01` §3, LANE-RULES R9 item 8); the 14 classic indices as "how each set has moved since 2021"; dated
  sold marks for the cards people actually find (Base Charizard / Blastoise / Venusaur, Jungle and Fossil holos, Machamp,
  Pikachu), one eBay search each. Opens with one answer sentence: figure, date, sample size, source (the GEO answer block).
- **B or C — "best Pokémon set to start collecting in 2026".** Rank sets on measured facts only — liquidity, chase depth,
  sealed availability — and never say buy. Whichever agent takes it first owns it; the other does not duplicate it.
- **A — McDonald's 30th Happy Meal cards** (reported Nov 5–Dec 9 US, 15 cards, checklist not out): add a `reported` row to
  `data/releases.json` with both sources (Sole Retriever, Pokémon GO Hub) and their hedges. No page unless a checklist prints.
- **Not gaps, ever:** pull rates and pack EV (never published, KB doctrine 6); non-English product; retail stock questions.

## Index levels after the Sep 30, 2026 rebase (Mo's ruling — binds every agent)
Every Pokémon index is now based at **100 = the set's release month** (`baseDate`/`baseRule`/`baseNote` in
`data/indices.json`; vintage sets and Hidden Fates use the first month PriceCharting's sold history reliably covers
and say so). Months before the live marks are a labelled monthly reconstruction (`recon`). When you quote a level:
quote it from `history`, say "100 = <Mon YYYY> (release)" or the page's own base wording, and never write "launched
at 100.00 on Aug 24" or "since inception" for a Pokémon ticker. **Improve runs, Oct 1 onward:** the ten Pokémon
league pages carrying a `data-rebase-note` paragraph quote old-base levels; rewrite their index claims on the new
base (titles and H1s included where they carry a level), then delete the note. Moves between marks are unchanged.
