#!/usr/bin/env node
// tools/build-home-v2.mjs — derives home-v2.html, the noindex preview of the home, from index.html (Oct 23 2026).
//
// History: the first cut of this tool (commit 4456514) generated the Seeking-Alpha layout as a standalone preview page so Mo
// could review it before it replaced /. Mo said "push all of this live tonight"; the layout now ships on / through
// tools/build-home.mjs (lib/home-v2.mjs writes the HOME:idxbox / HOME:releases / HOME:movers2 blocks every bake), and the
// preview is simply index.html with a preview head — noindex, its own canonical, no WebSite LD-JSON — so it can never drift
// from what / shows. build-home.mjs re-derives it after every write; this tool exists for a by-hand refresh.
//
//   node tools/build-home-v2.mjs          # writes home-v2.html from index.html
//   node tools/build-home-v2.mjs --check  # exit 1 if home-v2.html is not what index.html says

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { previewFromIndex } from "./lib/home-v2.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const index = fs.readFileSync(path.join(REPO, "index.html"), "utf8");
if (!/<!-- HOME:idxbox:START -->/.test(index)) { console.error("index.html does not carry the v2 layout yet — run node tools/build-home.mjs --init-v2 first"); process.exit(2); }
const next = previewFromIndex(index);
const file = path.join(REPO, "home-v2.html");
const cur = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
if (CHECK) { if (cur !== next) { console.error("build-home-v2 --check: home-v2.html is stale — run node tools/build-home-v2.mjs"); process.exit(1); } console.log("build-home-v2 --check: home-v2.html matches index.html"); process.exit(0); }
fs.writeFileSync(file, next);
console.log(`wrote home-v2.html (${(Buffer.byteLength(next) / 1024).toFixed(0)} KB, derived from index.html)`);
