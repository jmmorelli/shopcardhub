#!/usr/bin/env node
// build-home.mjs — pre-render the dashboard that is / (Terminal step 2, Sep 11 2026).
//
// Runs js/home.js (the same renderer the browser uses) in Node against the nightly feed and
// writes real numbers into index.html between the markers
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
const FEED_BASE = process.env.FEED_BASE || "https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data";
const require = createRequire(import.meta.url);
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
const put = (key, body) => {
  const re = new RegExp(`(<!-- HOME:${key}:START -->)[\\s\\S]*?(<!-- HOME:${key}:END -->)`);
  if (!re.test(html)) throw new Error(`index.html has no <!-- HOME:${key}:START/END --> markers`);
  html = html.replace(re, (m, a, b) => `${a}\n${body}\n${b}`);
};

if (latest && history) {
  const model = HOME.buildModel(latest, history, market, indices);
  const sel = model.composite ? "BOARD" : (model.indices.find((i) => i.status !== "pre") || {}).k;
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
put("releases", HOME.renderReleases(releases, TODAY, 9));
console.log(`releases: ${upcomingN} upcoming from ${TODAY} (asOf ${releases.asOf}) · tape ${latest && history ? HOME.tapeItems(HOME.buildModel(latest, history, market, indices), indices).length : "?"} items`);

if (!DRY) fs.writeFileSync(path.join(REPO, "index.html"), html);
console.log(`${DRY ? "would update" : "updated"} index.html`);
