# The Growth League — charter (LANE-RULES R27, opened 2026-09-26)

Mo, Sep 26 2026: *"Can we make a team of bots to have a competition… they would go and find avenues on
their own for growth and you would oversee that. Fire the worst performer(s) and clone the winners… I
think that you can make a team to do what I want."* Then: *"build it and let's roll!"*

The CoS is the commissioner. Three agents compete on the one channel a bot can work end to end without a
human account: **search pages**. Bing Webmaster (read Sep 26) says the site's demand is release-date and
"is X worth it / how much is X" queries; a bot can find the query, build the page, clear the gates, ship
it, and be measured 14 and 28 days later. Reddit, forums and DMs stay Mo's (bot posting there gets the
domain banned, which would cost the Google lever this exists to pull).

## The three theses (fixed for a generation; not clones of one prompt)

| Agent | Thesis | Slug shape |
|---|---|---|
| **A · Release desk** | A page for every dated release, built 10+ days before street date. Owns `data/releases.json` rows (dated, sourced, never guessed) — the release calendar links each row's page automatically. | `<product>-<year>` e.g. `topps-chrome-football-2026` |
| **B · Question desk** | "How much is X worth" / "is Y worth it" pages, answered with our dated sold comps and the index the card sits in. | `<card-or-set>-worth` / `is-<product>-worth-it` |
| **C · Comparison desk** | "X vs Y": ETB vs booster box, set vs set, Bowman vs Bowman Chrome — decided on our index levels and dated sold marks. | `<x>-vs-<y>` |

Clones of one idea only measure luck; three theses measure three ideas.

## Budget

- **2 pages per agent per league week, max** (a league week runs Sat→Fri from the generation's open date).
  The site was "getting clunky" in July (Mo); the league is not a page mill. `score.mjs --check` FAILs over it.
- **No new nav item.** Pages are reachable by sitemap, IndexNow, the release calendar (A), the `searchExtra`
  site search list, and one link from the hub the manifest names.
- **No new agents, no new scheduled runs beyond the one Monday league run** (cadence cut, 2026-09-21).

## The score — fixed here so the commissioner cannot fudge it

Read headless from the nightly GA4 snapshot (`landingOrganicDaily28` + `pageClicks28`, added Sep 26).

- **Primary: organic-search landing sessions** on the agent's pages, from each page's publish date. Organic
  only — the bot clusters (Singapore/China) land Direct, so this is the clean series without a country rule.
- **Secondary, reported never ranked on: outbound eBay clicks** on those pages (`click` + `buystrip_click` +
  `buybox_click`) and `newsletter_signup`. Dollars are never in the score (R14: market-controlled, fat-tailed).

## Two reads, never confused (R14 applies in full)

- **FLOOR read — per page, pre-committed:** a page with **fewer than 3 organic landing sessions in its first
  30 days is dead** → 301 to the hub its manifest names, out of the sitemap, at the next Monday run. A release
  page's 30 days run from its street date (`floorFrom` in the manifest), not from publish. Pages get fired too.
- **RANKING read — per agent:** requires **≥ 100 organic landing sessions on each agent's page set** inside the
  generation. Below that, nothing is ranked, cloned, or rewritten on performance grounds — the output is "floor
  read done, nothing rankable, slate carried", and that is a valid result. Above it: the lowest agent's method
  is rewritten from the winner's (that is the clone), the winner's brief is left alone, and the middle carries.

## Generations

- **4 weeks.** Generation 1 opened **2026-09-26** (Saturday build counts as week 1); interim scoreboard
  **Oct 14**; scoring date **Oct 26**. The Monday league run prints the board every week; only the scoring
  date culls or breeds.
- After a cull the next generation's briefs are written from the query data (what Bing shows rising), not
  from the ranking, unless the ranking read was available.

## The integrity clause (R14, verbatim in spirit)

No page is scored in a way that pays for shading a number. A page that would score better by calling an ask a
sold comp, dropping a dated stamp, or publishing a figure it cannot point at is disqualified at design time.
A gate FAIL does not ship. An agent that ships a shaded figure is out for the generation; its slot stays empty.

## What the commissioner does every Monday (the league run)

1. Fresh clone; `node tools/league/score.mjs` → print the board, write `data/league-board.json`.
2. Floor read: 301 + de-sitemap any dead page (a `<meta http-equiv="refresh">` + canonical to the hub, as the
   site already does for retired pages), note it in the registry with the date.
3. Spawn A, B, C in parallel, each with `tools/league/BRIEF.md` + its thesis row + last week's board.
4. Integrate their manifests (`score.mjs --sync`): buy-strip entries → `build-buy-strip` → `build-signup`,
   `releases.json` rows → `build-release-calendar`, `build-home`, sitemap, `searchExtra`, hub link.
5. Three gates at baseline, commit, push (deploy key on the Mac), live 200s, IndexNow, pushLog, STATE.
6. On the scoring date only: cull/breed per the rules above; rewrite the losing brief; open the next generation.

Files: `data/league.json` (registry, canonical) · `tools/league/manifests/<slug>.json` (one per page, written
by the agent) · `data/league-board.json` (last board) · `tools/league/BRIEF.md` (the agents' standing brief).
