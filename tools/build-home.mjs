#!/usr/bin/env node
// build-home.mjs — pre-render the dashboard that is / (Terminal step 2, Sep 11 2026).
//
// Runs js/home.js (the same renderer the browser uses) in Node against the nightly feed and
// writes real numbers into index.html between the markers
//   <!-- HOME:indexboard:START/END --> the index board (one row per set index — the front door since Sep 25 2026)
//   <!-- HOME:tape:START/END -->     the ticker tape (every live index + the top 5 cards of each, data/indices.json)
//   <!-- HOME:markets:START/END -->  Markets rows (Bangers board 30D composite + every index)
//   <!-- HOME:chart:START/END -->    the default chart (board composite, 100 reference)
//   <!-- HOME:releases:START/END --> Upcoming releases (data/releases.json — Pokémon + sports, dated, sourced)
//   <!-- HOME:movers:START/END -->   Board movers · 30D
//   <!-- HOME:screen:START/END -->   the Screens table (default screen = the board)
//   <!-- HOME:stamp:START/END -->    feed day + marked/gated counts in the page header
// so the page is complete at rest for crawlers and with JS off; js/home.js then refreshes from
// the live feed and leaves this HTML alone if the fetch fails. Idempotent — re-run Mondays (and
// after editing data/releases.json or data/indices.json). Homepage rework Sep 19 2026 (Mo): the
// "From the engine last night" panel and the In Focus strip are gone — tape + releases replace them.
//
// HOME V2 (Oct 23 2026, Mo: "push all of this live tonight" — DESIGN-DIRECTIVE-2026-10-23 §4 P0-B): / is the Seeking-Alpha
// layout. tools/lib/home-v2.mjs builds three more blocks every bake —
//   <!-- HOME:idxbox:START/END -->   the tabbed index box (every live ticker, every tab, chart payload, the sealed eBay button)
//   <!-- HOME:releases:START/END --> Coming out (new markup, same data/releases.json)
//   <!-- HOME:movers2:START/END -->  What moved this week (card-level, basket price vs prevPrice, 12-month shape)
// and the long index board (HOME:indexboard) and the Bowman movers list (HOME:movers) are gone from / — they are optional
// markers now (skipped when absent), the board lives on /indices. The engine screens + HOME:stamp stay, collapsed.
// `--init-v2` installs the v2 <main> skeleton + head links once (idempotent; it carries the SIGNUP, regime, screens,
// where-to-start and tm-foot blocks over verbatim). After every write, home-v2.html (the noindex preview) is re-derived.
//
// Usage:  node tools/build-home.mjs            node tools/build-home.mjs --dry
//         FEED_BASE=/path/to/price-data/data node tools/build-home.mjs   (local clone; a URL also works)
//         node tools/build-home.mjs --releases-only   (no feed needed: re-bakes ONLY the releases panel, says so)
//
// A missing feed is a FAILED BUILD, not a quiet no-op (2026-09-21, x-board-feed-integrity, CoS-commissioned).
// Until then a fetch failure logged one stderr line, skipped every feed panel, and exited 0 — so a lane could
// truthfully report "re-ran build-home" while / kept a stale Markets level. Now: no feed → nothing is written,
// exit 2, and the message names the feed that was missing. Ship nothing rather than something stale.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const RELEASES_ONLY = process.argv.includes("--releases-only");
const FEED_BASE = process.env.FEED_BASE || "https://www.shopcardhub.com/feed";
const require = createRequire(import.meta.url);
const V2 = await import("./lib/home-v2.mjs");
const INIT_V2 = process.argv.includes("--init-v2");
const HOME = require(path.join(REPO, "js/home.js"));
const ST = require(path.join(REPO, "js/engine-stats.js"));
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");

async function feed(name) {
  try {
    if (/^https?:\/\//.test(FEED_BASE)) { const r = await fetch(`${FEED_BASE}/${name}?t=${Date.now()}`); if (!r.ok) throw new Error(r.status); return await r.json(); }
    return JSON.parse(fs.readFileSync(path.join(FEED_BASE, name), "utf8"));
  } catch (e) { console.error(`feed ${name}: ${e.message}`); return null; }
}
const latest = RELEASES_ONLY ? null : await feed("prices-latest.json");
const history = RELEASES_ONLY ? null : await feed("prices-history.json");
const market = RELEASES_ONLY ? null : await feed("market-latest.json");
if (!RELEASES_ONLY && !(latest && history)) {
  const missing = [["prices-latest.json", latest], ["prices-history.json", history]].filter(([, v]) => !v).map(([n]) => n);
  console.error(`build-home: REFUSING TO BAKE — required feed missing (${missing.join(", ")}) at ${FEED_BASE}. ` +
    "index.html was NOT written; the Markets/tape panels would have kept a stale render and exit 0 would have called that success. " +
    "Pass FEED_BASE=<price-data clone>/data, or --releases-only to re-bake just the releases panel.");
  process.exit(2);
}
const indices = JSON.parse(read("data/indices.json"));
// Oct 14 2026 (R35 cull batch 1): the feed's `slug` is the engine's copy of the watchlist host page and lags a merge by a
// nightly (Oct 13: /ethan-holliday-rookie-cards#engine-… baked onto the home screens the day after that page 301'd).
// Bake hrefs from THIS tree instead: the watchlist host when its page exists · the /card-<id> page when it exists ·
// else the vercel.json 301 for the dead host. The browser repaints from the live feed (js/home.js honours c.href only
// when set), so the 301 carries the stale slug until the engine catches up.
if (latest && latest.cards) {
  const wlBy = new Map((JSON.parse(read("data/watchlist.json")).cards || []).map((c) => [`${c.source}:${c.id}`, c]));
  const redirects = Object.fromEntries((JSON.parse(read("vercel.json")).redirects || []).map((r) => [r.source, r.destination]));
  const pageExists = (slug) => !!slug && fs.existsSync(path.join(REPO, slug + ".html"));
  for (const c of latest.cards) {
    const id = String(c.key || "").replace(/^[a-z]+:/, "");
    const w = wlBy.get(c.key);
    if (w && pageExists(w.slug)) { c.slug = w.slug; delete c.href; continue; }
    if (w && !w.slug && pageExists("card-" + id)) { delete c.slug; delete c.href; continue; }
    if (c.slug && !pageExists(c.slug)) { const to = redirects["/" + c.slug]; if (to) c.href = to; else if (pageExists("card-" + id)) delete c.slug; }
  }
}
const releases = JSON.parse(read("data/releases.json"));
const TODAY = process.env.HOME_TODAY || new Date().toISOString().slice(0, 10);
for (const it of releases.items || []) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(it.date || "")) throw new Error(`releases.json: "${it.label}" has no YYYY-MM-DD date`);
  if (!it.href) continue;
  const p = it.href.split("#")[0].replace(/\/$/, "") || "/";
  if (p !== "/" && !fs.existsSync(path.join(REPO, p.slice(1) + ".html"))) throw new Error(`releases.json: ${it.href} has no page`);
}
const upcomingN = HOME.upcoming(releases, TODAY).length;
if (!upcomingN) throw new Error(`releases.json: nothing dated on or after ${TODAY} — add the next releases before baking`);

let html = read("index.html");
/* ---- v2 skeleton (one-time, or whenever the page lacks the v2 markers) ---- */
if (INIT_V2 || !/<!-- HOME:idxbox:START -->/.test(html)) {
  const grab = (re, what) => { const m = html.match(re); if (!m) throw new Error(`index.html: cannot carry the ${what} block into the v2 skeleton (anchor missing)`); return m[0]; };
  const carry = {
    signup: grab(/<!-- SIGNUP:START[\s\S]*?<!-- SIGNUP:END -->/, "SIGNUP"),
    regime: grab(/<!-- HOME:regime:START -->[\s\S]*?<!-- HOME:regime:END -->/, "HOME:regime"),
    screens: grab(/<details class="panel scr-fold" id="screens-fold">[\s\S]*?<\/details>/, "engine screens"),
    startHere: grab(/<section class="panel start-here"[\s\S]*?<\/section>/, "where-to-start"),
    foot: grab(/<p class="tm-foot">[\s\S]*?<\/p>/, "tm-foot"),
  };
  const main = html.match(/<main class="tmain[^"]*" id="main">[\s\S]*?<\/main>/);
  if (!main) throw new Error("index.html: <main class=\"tmain\" id=\"main\"> … </main> not found");
  html = html.replace(main[0], V2.skeleton(carry));
  // head: the shared v2 stylesheet + script; the retired returning-visitor slot (js/home-you.js) and its pre-paint reservation go
  if (!/\/css\/home-v2\.css/.test(html)) html = html.replace(/(<link rel="stylesheet" href="\/css\/terminal-shell\.css[^"]*">)/, '$1\n  <link rel="stylesheet" href="/css/home-v2.css?v=2">');
  // home-v2.js runs BEFORE home.js (both deferred, document order): it opens the "More" fold on a /#screen= deep link before home.js scrolls there
  if (!/\/js\/home-v2\.js/.test(html)) html = html.replace(/(<script src="\/js\/home\.js[^"]*" defer><\/script>)/, '<script src="/js/home-v2.js?v=2" defer></script>\n$1');
  // asset versions: bump both when css/home-v2.css or js/home-v2.js change (v=2 Oct 23 2026: empty-tile sizing, auctions "as of")
  html = html.replace(/\/css\/home-v2\.css\?v=\d+/, "/css/home-v2.css?v=2").replace(/\/js\/home-v2\.js\?v=\d+/, "/js/home-v2.js?v=2");
  html = html.replace(/\n\s*<script src="\/js\/home-you\.js[^"]*" defer><\/script>/, "");
  html = html.replace(/\n\s*<!-- Night Crew Oct 8 \(NEW-1\)[\s\S]*?<\/script>(?=\n\s*<\/head>)/, "");
  html = html.replace(/<div class="term" data-prices-updated=/, '<div class="term h2-page" data-prices-updated=');
  console.log("v2 skeleton installed in index.html (SIGNUP, HOME:regime, screens, where-to-start, tm-foot carried over)");
}
// B75 (Night Crew Oct 16, phone teardown): the Chart/markets, Upcoming releases and tape panels were removed from /.
// Those keys are optional now: a missing block is skipped (logged), every other block still fails the bake when missing.
// Home v2 (Oct 23): the index board and the Bowman movers list left / too.
const OPTIONAL = new Set(["markets", "chart", "tape", "indexboard", "movers"]);
const put = (key, body) => {
  const re = new RegExp(`(<!-- HOME:${key}:START -->)[\\s\\S]*?(<!-- HOME:${key}:END -->)`);
  if (!re.test(html) && OPTIONAL.has(key)) { console.log(`HOME:${key} not on the page (removed) - skipped`); return; }
  if (!re.test(html)) throw new Error(`index.html has no <!-- HOME:${key}:START/END --> markers`);
  html = html.replace(re, (m, a, b) => `${a}\n${body}\n${b}`);
};

if (latest && history) {
  const model = HOME.buildModel(latest, history, market, indices);
  const sel = model.composite ? "BOARD" : (model.indices.find((i) => i.status !== "pre") || {}).k;
  put("indexboard", HOME.renderIndexBoard(model));
  put("markets", HOME.renderMarkets(model, sel));
  put("chart", HOME.renderChart(model, sel));
  put("tape", HOME.renderTape(model, indices));
  put("movers", HOME.renderMovers(model));
  put("screen", HOME.renderScreens(model, "board"));   // every saved screen pre-rendered (one visible) so switching needs no feed
  const sm = HOME.screenMeta(model, "board");
  html = html.replace(/(<span data-home="screen-name">)[^<]*(<\/span>)/, `$1${sm.name}$2`).replace(/(<span data-home="screen-meta">)[^<]*(<\/span>)/, `$1${sm.meta}$2`);
  put("stamp", `feed <b data-home="day">${ST.dstr(model.day)}</b> · <span data-home="stamp">${model.marked}/${model.total} marked · ${model.gatedN} gated</span> · ask-basis`);
  html = html.replace(/data-prices-updated="\d{4}-\d{2}-\d{2}"/, `data-prices-updated="${model.day}"`);
  console.log(`feed day ${model.day}: ${model.marked}/${model.total} marked · ${model.gatedN} gated · ${model.closes} closes · composite ${model.composite ? ST.num(model.composite.level, 2) + " (" + model.composite.n + " autos)" : "n/a"} · ${model.indices.length} indices`);
} else console.log("--releases-only: tape/markets/movers/screen panels deliberately left as previously rendered (no feed read)");
// Re-mark cadence in the copy and the metas is derived from data/indices.json (iw-2026-09-28-3 / iw-2026-09-29-6, weekly
// Sep 30): the home said "re-marked weekly" while 17 of 23 tickers mark Monday and Thursday. Missing hooks fail the build.
{
  const cad = HOME.cadence(indices);
  const sub = (re, to, what) => { if (!re.test(html)) throw new Error(`index.html: cadence hook missing (${what})`); html = html.replace(re, to); };
  sub(/(<span data-home="cadence">)[^<]*(<\/span>)/, `$1${cad.clause}$2`, "tm-foot");
  if (/<span data-home="cadence-chart">/.test(html)) sub(/(<span data-home="cadence-chart">)[^<]*(<\/span>)/, `$1set indices update ${cad.short}$2`, "chart caption");  // the chart panel is gone since B75  // Night Crew Oct 6 (U-F17): plain words
  sub(/(<span data-home="cadence-short">)[^<]*(<\/span>)/g, `$1${cad.short}$2`, "disclosure/footer");
  sub(/(<meta name="description" content="[^"]*?built from sold comps, )re-marked [^"]*?(, every card)/, `$1re-marked ${cad.short}$2`, "meta description");
  sub(/(<meta property="og:description" content="[^"]*?sold comps, )re-marked [^"]*?(, every card)/, `$1re-marked ${cad.short}$2`, "og:description");
  console.log(`cadence: ${cad.twice} of ${cad.n} live tickers Mon + Thu, ${cad.weekly} Monday only`);
}
/* ---- v2 blocks: the index box, Coming out, What moved this week (tools/lib/home-v2.mjs) ---- */
const v2 = V2.buildV2(REPO, { today: TODAY });
put("idxbox", v2.blocks.idxbox);
put("releases", v2.blocks.releases);
put("movers2", v2.blocks.movers2);
console.log(`home v2: ${v2.summary}`);
console.log(`releases: ${upcomingN} upcoming from ${TODAY} (asOf ${releases.asOf}) · ${v2.RELEASES.length} shown`);

if (!DRY) fs.writeFileSync(path.join(REPO, "index.html"), html);
console.log(`${DRY ? "would update" : "updated"} index.html`);
// the noindex preview is index.html with a preview head (one source, no drift)
if (fs.existsSync(path.join(REPO, "home-v2.html"))) { if (!DRY) fs.writeFileSync(path.join(REPO, "home-v2.html"), V2.previewFromIndex(html)); console.log(`${DRY ? "would update" : "updated"} home-v2.html (preview derived from index.html)`); }
