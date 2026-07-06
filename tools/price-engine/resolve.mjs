// Helper to find product ids for the watchlist by searching card names.
// Needs the relevant token in your environment, e.g.:
//   PRICECHARTING_TOKEN=xxxx node tools/price-engine/resolve.mjs pricecharting "charizard ex prismatic"
//   SPORTSCARDSPRO_TOKEN=xxxx node tools/price-engine/resolve.mjs sportscardspro "cooper flagg 2025 prizm"
//
// Prints up to 20 matches with their ids so you can paste the right one into
// data/watchlist.json. (The nightly cron tracks by id for stability.)

import { searchProducts } from "../../api/_lib/pricecharting.js";

const [, , source, ...q] = process.argv;
if (!source || !q.length) {
  console.error('usage: node resolve.mjs <pricecharting|sportscardspro> "<search text>"');
  process.exit(1);
}

try {
  const results = await searchProducts(source, q.join(" "));
  if (!results.length) { console.log("no matches"); process.exit(0); }
  for (const r of results) console.log(`${r.id}\t${r.set}\t${r.name}`);
} catch (e) {
  console.error("error:", String(e.message || e));
  process.exit(1);
}
