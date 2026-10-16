#!/usr/bin/env node
// build-index-jsonld.mjs — E7 slice 2: (re)bake Dataset + Organization JSON-LD on every live index page and the
// DataCatalog on /indices from data/indices.json. Run after any mark; --check exits 1 if a page is stale.
//   node tools/build-index-jsonld.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyIndexLd, applyCatalogLd, liveTickers } from "./lib/index-jsonld.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "data/indices.json"), "utf8"));
const byFile = new Map();
const read = (f) => byFile.get(f) ?? fs.readFileSync(f, "utf8");
let pages = 0;
for (const t of liveTickers(idx)) {
  const f = path.join(ROOT, t.page.slice(1) + ".html");
  if (!fs.existsSync(f)) { console.log(`skip ${t.ticker}: ${t.page} has no file`); continue; }
  byFile.set(f, applyIndexLd(read(f), t)); pages++;
}
const fi = path.join(ROOT, "indices.html");
byFile.set(fi, applyCatalogLd(read(fi), idx));
let stale = 0;
for (const [f, html] of byFile) {
  if (fs.readFileSync(f, "utf8") === html) continue;
  stale++;
  if (CHECK) console.log("stale: " + path.relative(ROOT, f)); else fs.writeFileSync(f, html);
}
console.log(`build-index-jsonld: ${pages} index datasets, ${byFile.size} files, ${stale} ${CHECK ? "stale" : "written"}`);
if (CHECK && stale) process.exit(1);
