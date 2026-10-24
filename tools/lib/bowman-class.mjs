// bowman-class.mjs — the shared contract for the Bowman Class Ladder (Mo, Oct 23 2026: one page, /bowman-classes, covering
// the 1st Bowman Chrome Auto classes 2009–2025; BOW26 already has its own ticker and is only referenced).
//
// Read by tools/build-sector-index.mjs (classConfigs + the class mark) and tools/build-class-ladder.mjs (the page), so the
// two can never disagree on which files are classes, how a row is keyed, or what the eBay phrase is.
//
// data/classes/BOWyy-universe.json is the universe file (schema: data/classes/README.md). The Bowman KB agent writes it;
// nothing here derives a 1st. Only rows with firstAuto === true are the class.
import fs from "node:fs";
import path from "node:path";

export const CLASS_PAGE = "/bowman-classes";
export const CLASS_FILE_RE = /^(BOW\d{2})-universe\.json$/;

export const classDir = (ROOT) => path.join(ROOT, "data/classes");
/** tickers that have a universe file on disk, oldest class first (BOW09 … BOW25) */
export function classTickers(ROOT) {
  try { return fs.readdirSync(classDir(ROOT)).map((f) => (f.match(CLASS_FILE_RE) || [])[1]).filter(Boolean).sort(); } catch { return []; }
}
export function readClassFile(ROOT, tk) {
  return JSON.parse(fs.readFileSync(path.join(classDir(ROOT), `${tk}-universe.json`), "utf8"));
}
/** a test fixture (fixture: true): exercised only by the --offline rig, never marked in CI, never on the page */
export const isFixture = (u) => !!(u && u.fixture === true);
export const classYear = (tk, u) => (u && Number.isInteger(u.year)) ? u.year : 2000 + parseInt(String(tk).slice(3), 10);

// accent- and case-folded name (iw-2026-09-30-2: the checklist spells Liñan/Muñoz/Peña, SportsCardsPro does not)
export const fold = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** THE row key: player + product + code. Codes repeat across products and even inside one product (Bowman KB G28), so a
 *  code is never a key on its own. Stable across runs (it is what sticks a resolved pcPath to a row). */
export const rowKey = (r) => `${fold(r.player || r.name)}|${fold(r.product)}|${String(r.code || r.num || "").toUpperCase()}`;

/** the eBay search phrase for a class row: "<product> [chrome] <player> auto <code>" */
export function classQuery(product, player, code) {
  const p = String(product || "").trim();
  return `${p}${/chrome/i.test(p) ? "" : " chrome"} ${player} auto ${code}`.replace(/\s+/g, " ").trim();
}

/** the rows that are the class (firstAuto === true, with a player and a code), in file order */
export const classRows = (u) => (u.rows || []).filter((r) => r && r.firstAuto === true && r.player && r.code && r.product);
