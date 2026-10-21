#!/usr/bin/env node
// sitemap-cut.mjs — drop every `sitemap:false` page of a cull batch file from sitemap.xml.
// Usage: node tools/cull/sitemap-cut.mjs tools/cull/batch-2-2026-10-20.json [--check]
// Why: a pre-computed sitemap.xml hunk goes stale every night (the feed commit re-stamps lastmod),
// which killed cull batch 2 rev 1 and rev 2. Cutting at apply time from the batch file never conflicts.
import fs from "node:fs"; import path from "node:path";
const [batchFile, ...flags] = process.argv.slice(2);
if (!batchFile) { console.error("usage: sitemap-cut.mjs <batch.json> [--check]"); process.exit(2); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const sm = path.join(root, "sitemap.xml");
const batch = JSON.parse(fs.readFileSync(batchFile, "utf8"));
const cut = new Set((batch.pages || []).filter(p => p.sitemap === false).map(p => "https://www.shopcardhub.com" + p.page));
let xml = fs.readFileSync(sm, "utf8"); const before = (xml.match(/<loc>/g) || []).length; let removed = 0;
xml = xml.replace(/\n?[ \t]*<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>[ \t]*\n?/g, (blk, loc) => cut.has(loc.trim()) ? (removed++, "\n") : blk);
xml = xml.replace(/\n{3,}/g, "\n\n");
const after = (xml.match(/<loc>/g) || []).length;
console.log(`sitemap ${before} -> ${after} (${removed} removed of ${cut.size} sitemap:false rows)`);
if (!flags.includes("--check")) fs.writeFileSync(sm, xml);
