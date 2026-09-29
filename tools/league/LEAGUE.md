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

- **DAILY since 2026-09-27 (Mo: "I want everyone to work daily… it's go time!").** The league run fires every day at 05:56 PT. Per run: **at most 1 new page per agent**, and an agent with no evidenced query that day spends its run **improving** one of its live pages (re-mark, sharper answer, missing comparable) or ships nothing. Weekly cap raised to **5 pages per agent per league week** (`data/league.json` rules). Commit only when a public file changed; docs ride with the next public commit (the Sep 21 lesson: doc-only commits each queued a Vercel deploy).
- *(superseded 2026-09-27)* **3 pages per agent per league week, max** (a league week runs Sat→Fri from the generation's open date; was 2 —
  raised with the second weekly run, Mo 2026-09-26 "ok do it"). The site was "getting clunky" in July (Mo); the league
  is not a page mill. `score.mjs --check` FAILs over it. Thursday's run may spend one of an agent's slots **improving an
  existing league page** (re-mark, sharper answer, a missing comparable) instead of building.
- **No new nav item.** Pages are reachable by sitemap, IndexNow, the release calendar (A), the `searchExtra`
  site search list, and one link from the hub the manifest names.
- *(superseded 2026-09-27 — daily run, see above)* **No new agents, no scheduled runs beyond the two league runs — Monday and Thursday 05:56 PT** (cadence cut,
  2026-09-21; the Thursday run added 2026-09-26 for release dates that land mid-week and for the fix pass; a third day
  is decided at the Oct 14 interim board on the floor-read results, not before).

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

## What the commissioner does every Monday and Thursday (the league run)

1. Fresh clone; `node tools/league/score.mjs` → print the board, write `data/league-board.json`.
2. Floor read: 301 + de-sitemap any dead page (a `<meta http-equiv="refresh">` + canonical to the hub, as the
   site already does for retired pages), note it in the registry with the date.
3. Spawn A, B, C in parallel, each with `tools/league/BRIEF.md` + its thesis row + last week's board.
4. Integrate their manifests (`score.mjs --sync`): buy-strip entries → `build-buy-strip` → `build-signup`,
   `releases.json` rows → `build-release-calendar`, `build-home`, sitemap, `searchExtra`, hub link.
5. Three gates at baseline, commit, push (deploy key on the Mac), live 200s, IndexNow, pushLog, STATE.
6. On the scoring date only: cull/breed per the rules above; rewrite the losing brief; open the next generation.
7. **Wednesdays (from 2026-09-30): the Distribution division.** Spawn D, E, F in parallel with
   `tools/league/BRIEF-DISTRIBUTION.md` + their thesis row + the board. Each hands over one `tools/league/dist/<id>.json`
   and its section of the Project doc `claude/league/drafts-<date>.md`. `score.mjs --sync --check`, commit the manifests
   (docs ride with the next public commit), then send Mo **one** short message: the drafts doc link and what each needs
   ("D: 3 emails, reply 'send D' · E: 1 forum post to paste · F: queued into the X daily slot"). Record his answers as
   `status` changes. A pitch is sent only in a session where Mo said yes to that batch (R10 spirit; sending email is a
   per-action approval). Prompt note: this step lives here, not in the task prompt; the file wins (R-precedence).

Files: `data/league.json` (registry, canonical) · `tools/league/manifests/<slug>.json` (one per page, written
by the agent) · `data/league-board.json` (last board) · `tools/league/BRIEF.md` (the agents' standing brief).

## Divisions and the season rule (Mo, 2026-09-29: "we really need some traffic")

Mo: *"The bottom agents/bots … would just get fired/deleted and the top performing #1 bot would get cloned twice …
Then the competition starts over again … At some point, the agents would recognize the need to differentiate from
their original cloned state to survive."* Mo approved the CoS's safeguards the same day: *"I approve of your way of
setting it up."*

**Two divisions, one league.**
- **Search** (A, B, C, above): scored on organic-search landing sessions.
- **Distribution** (D, E, F; brief `tools/league/BRIEF-DISTRIBUTION.md`): scored on sessions from their tagged links
  (`utm_medium=league`) plus referral sessions from the domains their manifests register. D = Outreach (pitches the
  CoS sends on Mo's yes), E = Forum answers (Mo pastes; no Reddit), F = Shareables (data cards through the X daily
  lane). One item per agent per week, drafted on the Wednesday league run; at most 2 items a week need Mo.

**The season rule** (`data/league.json` → `selection`; `score.mjs` prints the verdict every run, binding only on a
scoring date):
1. A season is 4 weeks. Only the scoring date cuts or clones.
2. Nobody is ranked until every agent in the division has the minimum (Search 100 sessions, Distribution 25).
3. **The bottom agent is cut only if it is significantly behind the winner**: exact binomial test, P(X ≤ bottom |
   n = top + bottom, p = ½) < 0.05. Otherwise it's a draw and nobody is cut. At ~200 clean sessions a week, most
   early seasons will be draws, and that is the honest result, not a failure.
4. **The winner is cloned into the freed slot, and the clone must take a new adjacent niche**, written into its
   thesis at birth (`parent`, `mutation`). An agent doesn't remember surviving, so differentiation is built in, not
   hoped for. A clone that duplicates its parent's targets is disqualified at design time.
5. **Growth:** a division gains a slot (the winner cloned twice, as Mo described) when its season total is ≥ 300
   sessions, up to 5 slots per division, 10 agents in all. The page cap and the floor read keep the site from bloating.
