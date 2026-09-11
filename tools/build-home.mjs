#!/usr/bin/env node
// build-home.mjs — pre-render the dashboard that is / (Terminal step 2, Sep 11 2026).
//
// Runs js/home.js (the same renderer the browser uses) in Node against the nightly feed and
// writes real numbers into index.html between the markers
//   <!-- HOME:markets:START/END -->  Markets rows (Bangers board 30D composite + every index)
//   <!-- HOME:chart:START/END -->    the default chart (board composite, 100 reference)
//   <!-- HOME:engine:START/END -->   "From the engine last night"
//   <!-- HOME:focus:START/END -->    In Focus strip (data/home-focus.json)
//   <!-- HOME:movers:START/END -->   Board movers · 30D
//   <!-- HOME:screen:START/END -->   the Screens table (default screen = the board)
//   <!-- HOME:stamp:START/END -->    feed day + marked/gated counts in the page header
// so the page is complete at rest for crawlers and with JS off; js/home.js then refreshes from
// the live feed and leaves this HTML alone if the fetch fails. Idempotent — re-run Mondays (and
// after editing data/home-focus.json or data/indices.json).
//
// Usage:  node tools/build-home.mjs            node tools/build-home.mjs --dry
//         FEED_BASE=/path/to/price-data/data node tools/build-home.mjs   (local clone; a URL also works)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const FEED_BASE = process.env.FEED_BASE || "https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data";
const require = createRequire(import.meta.url);
const HOME = require(path.join(REPO, "js/home.js"));
const ST = require(path.join(REPO, "js/engine-stats.js"));
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");

async function feed(name) {
  try {
    if (/^https?:\/\//.test(FEED_BASE)) { const r = await fetch(`${FEED_BASE}/${name}?t=${Date.now()}`); if (!r.ok) throw new Error(r.status); return await r.json(); }
    return JSON.parse(fs.readFileSync(path.join(FEED_BASE, name), "utf8"));
  } catch (e) { console.error(`feed ${name}: ${e.message} — panel keeps its previous render`); return null; }
}
const latest = await feed("prices-latest.json");
const history = await feed("prices-history.json");
const market = await feed("market-latest.json");
const indices = JSON.parse(read("data/indices.json"));
const focus = JSON.parse(read("data/home-focus.json"));
for (const it of focus.items || []) { const p = it.href.split("#")[0].replace(/\/$/, "") || "/"; if (p !== "/" && !fs.existsSync(path.join(REPO, p.slice(1) + ".html"))) throw new Error(`home-focus.json: ${it.href} has no page`); }

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
  put("engine", HOME.renderEngine(model));
  put("movers", HOME.renderMovers(model));
  put("screen", HOME.renderScreen(model, "board"));
  const sm = HOME.screenMeta(model, "board");
  html = html.replace(/(<span data-home="screen-name">)[^<]*(<\/span>)/, `$1${sm.name}$2`).replace(/(<span data-home="screen-meta">)[^<]*(<\/span>)/, `$1${sm.meta}$2`);
  put("stamp", `feed <b data-home="day">${ST.dstr(model.day)}</b> · <span data-home="stamp">${model.marked}/${model.total} marked · ${model.gatedN} gated</span> · ask-basis`);
  html = html.replace(/data-prices-updated="\d{4}-\d{2}-\d{2}"/, `data-prices-updated="${model.day}"`);
  console.log(`feed day ${model.day}: ${model.marked}/${model.total} marked · ${model.gatedN} gated · ${model.closes} closes · composite ${model.composite ? ST.num(model.composite.level, 2) + " (" + model.composite.n + " autos)" : "n/a"} · ${model.indices.length} indices`);
} else console.log("feed unavailable — markets/engine/movers/screen panels left as previously rendered");
put("focus", HOME.renderFocus(focus));

if (!DRY) fs.writeFileSync(path.join(REPO, "index.html"), html);
console.log(`${DRY ? "would update" : "updated"} index.html`);
