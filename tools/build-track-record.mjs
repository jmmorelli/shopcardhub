#!/usr/bin/env node
// tools/build-track-record.mjs — bake the /track-record scorecard into track-record.html (B66, Oct 9 2026).
//
// Why: the page rendered its calls table client-side from data/calls.json, so Googlebot indexed "Loading the
// scorecard…" ×3 (GSC Oct 9: crawled, not indexed). Now the rows, the scoreboard and the two header counts are
// written into the HTML at build time with the SAME renderer the browser uses (js/track-record-render.js); the
// browser re-renders only when calls.json is newer than the bake.
//
// Generated blocks (change this tool or the renderer, never the output):
//   <!-- TR:meta-count:START/END -->   inside #tr-meta-count
//   <!-- TR:meta-updated:START/END --> inside #tr-meta-updated
//   <!-- TR:scoreboard:START/END -->   inside #tr-scoreboard
//   <!-- TR:rows:START/END -->         inside tbody#tr-rows        (+ data-updated="<calls.json updated>")
//   <!-- TR:rows-poke:START/END -->    inside tbody#tr-rows-poke
//
// Usage: node tools/build-track-record.mjs [--dry]
// Run after anything writes data/calls.json (Monday scan, Tuesday regrade) — the nightly publish step runs it too.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const require = createRequire(import.meta.url);
const R = require(path.join(REPO, "js/track-record-render.js"));

const calls = JSON.parse(fs.readFileSync(path.join(REPO, "data/calls.json"), "utf8"));
const out = R.render(calls);
const file = path.join(REPO, "track-record.html");
let html = fs.readFileSync(file, "utf8");
const before = html;

function setBlock(key, body, firstRunRe) {
  const S = `<!-- TR:${key}:START -->`, E = `<!-- TR:${key}:END -->`;
  const re = new RegExp(`<!-- TR:${key}:START -->[\\s\\S]*?<!-- TR:${key}:END -->`);
  if (re.test(html)) { html = html.replace(re, () => `${S}${body}${E}`); return; }
  if (!firstRunRe || !firstRunRe.test(html)) throw new Error(`track-record.html: no TR:${key} markers and no first-run anchor`);
  html = html.replace(firstRunRe, (m, open, _inner, close) => `${open}${S}${body}${E}${close}`);
}

setBlock("meta-count", out.metaCount, /(<span id="tr-meta-count">)([\s\S]*?)(<\/span>)/);
setBlock("meta-updated", out.metaUpdated, /(<span id="tr-meta-updated">)([\s\S]*?)(<\/span>)/);
setBlock("scoreboard", "\n" + out.scoreboard + "\n      ", /(<div class="set-banner-grid" id="tr-scoreboard">)([\s\S]*?)(<\/div>\s*<div style="margin-top:16px;">)/);
setBlock("rows", "\n" + out.rows + "\n        ", /(<tbody id="tr-rows"[^>]*>)([\s\S]*?)(<\/tbody>)/);
setBlock("rows-poke", "\n" + out.rowsPoke + "\n        ", /(<tbody id="tr-rows-poke"[^>]*>)([\s\S]*?)(<\/tbody>)/);
// the dated machine stamp under the sports table (audit-prices no-machine-stamp): first run places it after the table wrap
setBlock("stamp", out.stamp, /(<tbody id="tr-rows"[\s\S]*?<\/table>\s*<\/div>)()(\s*<\/section>)/);
// the bake day, so the browser knows whether calls.json moved since
for (const id of ["tr-rows", "tr-rows-poke"]) {
  html = html.replace(new RegExp(`<tbody id="${id}"[^>]*>`), `<tbody id="${id}" data-updated="${out.updated}">`);
}

if (html === before) { console.log("track-record.html: scorecard bake unchanged"); process.exit(0); }
if (!DRY) fs.writeFileSync(file, html);
console.log(`${DRY ? "would bake" : "baked"} track-record.html: ${out.count} calls (calls.json updated ${out.updated}) — sports rows + Pokémon rows + scoreboard`);
