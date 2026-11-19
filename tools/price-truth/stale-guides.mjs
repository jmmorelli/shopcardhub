#!/usr/bin/env node
// tools/price-truth/stale-guides.mjs — Price Truth hold for hand-written worth guides (Nov 19 2026, ledger O-03 A).
// Applies data/price-truth/stale-guides.json: each pair's old text is replaced by the new text. A pair whose new text is
// already present counts as applied (idempotent). A pair with neither is a FAIL (the page changed under the hold; re-check).
// Also reports (WARN, no change) every *-worth.html whose <title> carries a $ figure and whose data-prices-updated stamp is
// more than maxAgeDays old — the root-cause net, so a headline worth price never ages silently again.
//   node tools/price-truth/stale-guides.mjs           apply + report
//   node tools/price-truth/stale-guides.mjs --check   report only; exit 1 on any un-applied pair or FAIL
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const CHECK = process.argv.includes("--check");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "data/price-truth/stale-guides.json"), "utf8"));
const today = process.env.PT_TODAY || new Date().toISOString().slice(0, 10);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
let fail = 0, pending = 0, applied = 0, warn = 0;
for (const [slug, p] of Object.entries(cfg.pages || {})) {
  const f = path.join(ROOT, slug + ".html");
  if (!fs.existsSync(f)) { console.log(`FAIL ${slug}: page missing`); fail++; continue; }
  let s = fs.readFileSync(f, "utf8"), changed = false;
  for (const [o, n] of p.pairs) {
    if (s.includes(n) && !s.includes(o)) { applied++; continue; }
    if (s.split(o).length !== 2) { console.log(`FAIL ${slug}: old text not found once: ${o.slice(0, 90)}`); fail++; continue; }
    if (CHECK) { console.log(`PENDING ${slug}: ${o.slice(0, 90)}`); pending++; continue; }
    s = s.replace(o, n); changed = true; applied++;
  }
  if (changed) fs.writeFileSync(f, s);
}
const held = new Set(Object.keys(cfg.pages || {}));
for (const name of fs.readdirSync(ROOT).filter((n) => /-worth\.html$/.test(n)).sort()) {
  const slug = name.replace(/\.html$/, "");
  const s = fs.readFileSync(path.join(ROOT, name), "utf8");
  const t = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const d = (s.match(/data-prices-updated="(\d{4}-\d{2}-\d{2})"/) || [])[1];
  if (!/\$\d/.test(t) || !d) continue;
  const age = days(d, today);
  if (age > (cfg.maxAgeDays || 21) && !held.has(slug)) { console.log(`WARN ${slug}: title prices "${t.match(/\$[\d,.]+[^,—]*/)[0].trim()}" from a ${d} read (${age} days)`); warn++; }
}
console.log(`stale-guides: applied ${applied} · pending ${pending} · FAIL ${fail} · WARN ${warn} (headline $ older than ${cfg.maxAgeDays} days, not held)`);
process.exit(fail || pending ? 1 : 0);
