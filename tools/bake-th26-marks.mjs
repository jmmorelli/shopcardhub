#!/usr/bin/env node
// bake-th26-marks.mjs — Night Crew B72 (desk ruling Oct 16, (b)).
// The 30th Celebration page carried eight hand-typed "TH26 sold marks, Oct 12" lines that went stale at every
// Mon/Thu mark (hero banner 75.19 vs the index block 73.30). This rewrites only the values between
// <!-- TH26M:<key> --> … <!-- /TH26M --> markers, plus the hero stamp's data-prices-updated date, from
//   data/indices.json  TH26.history (latest row: level + date)
//   data/cards/th26.json  cards[].raw / rawAsOf (by card id)
// Keys: date ("Oct 15, 2026") · dshort ("Oct 15") · level ("73.30") · <card id> (e.g. th26-149 → "$228.50").
// Inside the affiliate disclosure only the date token is marked (ruling: no other disclosure word changes).
//
//   node tools/bake-th26-marks.mjs           write pokemon-30th-anniversary-2026.html
//   node tools/bake-th26-marks.mjs --check   exit 1 if the page is not what the data says
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(ROOT, "pokemon-30th-anniversary-2026.html");
const CHECK = process.argv.includes("--check");

const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "data/indices.json"), "utf8")).TH26;
const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "data/cards/th26.json"), "utf8")).cards;
const last = idx.history[idx.history.length - 1];
const iso = last.date;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const [y, m, d] = iso.split("-").map(Number);
const dshort = `${MON[m - 1]} ${d}`;
const money = (v) => v >= 1000 ? "$" + Math.round(v).toLocaleString("en-US") : "$" + v.toFixed(2);

const byId = new Map(cards.map((c) => [c.id, c]));
const val = (key) => {
  if (key === "date") return `${dshort}, ${y}`;
  if (key === "dshort") return dshort;
  if (key === "level") return last.level.toFixed(2);
  const c = byId.get(key);
  if (!c || c.raw == null) throw new Error(`bake-th26-marks: no raw mark for ${key}`);
  if (c.rawAsOf !== iso) throw new Error(`bake-th26-marks: ${key} rawAsOf ${c.rawAsOf} ≠ index date ${iso} (two read dates on one page, R35)`);
  return money(c.raw);
};

const src = fs.readFileSync(PAGE, "utf8");
let n = 0;
let out = src.replace(/<!-- TH26M:([\w-]+) -->[\s\S]*?<!-- \/TH26M -->/g, (_, key) => { n++; return `<!-- TH26M:${key} -->${val(key)}<!-- /TH26M -->`; });
out = out.replace(/(<span data-prices-updated=")\d{4}-\d{2}-\d{2}(">🕐 TH26 (?:sold marks|prices as of) )/, (_, a, b) => { n++; return a + iso + b; });
if (n < 2) throw new Error("bake-th26-marks: markers not found");

if (CHECK) {
  if (out !== src) { console.error(`bake-th26-marks: ${path.basename(PAGE)} is stale vs the ${iso} mark — run node tools/bake-th26-marks.mjs`); process.exit(1); }
  console.log(`bake-th26-marks: ok (${n} values, ${iso})`);
} else {
  if (out !== src) fs.writeFileSync(PAGE, out);
  console.log(`bake-th26-marks: ${out !== src ? "wrote" : "unchanged"} ${path.basename(PAGE)} (${n} values, ${iso})`);
}
