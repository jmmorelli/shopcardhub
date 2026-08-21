// tools/first-bowman.mjs — propagate 1st Bowman flags across a Bowman year (Aug 21, 2026).
// Rule (Mo): the 1st Bowman logo is on EVERY Bowman card a player gets in his debut year — paper,
// Chrome, Sapphire, September Bowman Chrome, Draft, all parallels. So an explicit 1st flag on any
// card in year Y propagates to every card of that player in every Bowman-family set of year Y.
// Board names (data/board-history.json entryDates) are 2026 debuts by definition → first+board in
// every 2026 Bowman-family set. Flags are only ever ADDED here; the site auditor (§10) catches
// contradictions (a "1st" in year Y for a player who exists in a year < Y file) — fix those by hand.
// Usage: node tools/first-bowman.mjs [--apply]   (without --apply: report only)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const slug = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const bh = JSON.parse(fs.readFileSync(path.join(REPO, "data/board-history.json"), "utf8"));
const board = new Set(Object.keys(bh.entryDates || {}));
const BOARD_YEAR = 2026;
const dir = path.join(REPO, "data/sets");
const sets = fs.readdirSync(dir).filter(f => f.endsWith(".json")).map(f => ({ f, d: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }))
  .filter(s => /\bbowman\b/i.test(s.d.set)).map(s => ({ ...s, year: parseInt(String(s.d.set).match(/\b(20\d\d)\b/)?.[1] || "0", 10) }));
const firstBy = new Map();                    // year → Set(player slug)
for (const s of sets) for (const g of s.d.groups || []) for (const c of g.cards || []) {
  if (c.first) { if (!firstBy.has(s.year)) firstBy.set(s.year, new Set()); firstBy.get(s.year).add(slug(c.player)); }
}
if (!firstBy.has(BOARD_YEAR)) firstBy.set(BOARD_YEAR, new Set());
for (const b of board) firstBy.get(BOARD_YEAR).add(b);
let added = 0, boardAdded = 0;
for (const s of sets) {
  const firsts = firstBy.get(s.year) || new Set(); let n = 0, nb = 0;
  for (const g of s.d.groups || []) for (const c of g.cards || []) {
    const p = slug(c.player);
    if (firsts.has(p) && !c.first) { c.first = true; n++; }
    if (s.year === BOARD_YEAR && board.has(p) && !c.board) { c.board = true; nb++; }
  }
  if (n || nb) console.log(`${s.f}: +${n} first, +${nb} board`);
  added += n; boardAdded += nb;
  if (APPLY && (n || nb)) fs.writeFileSync(path.join(dir, s.f), JSON.stringify(s.d, null, 1) + "\n");
}
for (const [y, set] of [...firstBy.entries()].sort()) console.log(`${y}: ${set.size} players with a 1st Bowman flag`);
console.log(`${APPLY ? "applied" : "would add"}: ${added} first flags, ${boardAdded} board flags${APPLY ? "" : " (run with --apply)"}`);
