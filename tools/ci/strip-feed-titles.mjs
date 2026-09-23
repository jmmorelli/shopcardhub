// R20 feed hygiene (2026-09-23): the public feed must not carry eBay listing titles.
// Removes every `title` key from an object that also carries an eBay `item` URL.
// Usage: node tools/ci/strip-feed-titles.mjs <file.json> [...]
import fs from "node:fs";
let removed = 0;
const walk = (v) => {
  if (Array.isArray(v)) return v.forEach(walk);
  if (v && typeof v === "object") {
    if ("title" in v && typeof v.item === "string" && /ebay\./i.test(v.item)) { delete v.title; removed++; }
    Object.values(v).forEach(walk);
  }
};
for (const f of process.argv.slice(2)) {
  if (!fs.existsSync(f)) continue;
  const raw = fs.readFileSync(f, "utf8");
  const d = JSON.parse(raw); const before = removed; walk(d);
  if (removed > before) { const ind = /^[\[{]\s*\n(\s+)/.exec(raw); fs.writeFileSync(f, JSON.stringify(d, null, ind ? ind[1].length : 0) + (raw.endsWith("\n") ? "\n" : "")); }
  console.log(`${f}: stripped ${removed - before}`);
}
