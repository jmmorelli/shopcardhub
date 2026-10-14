// reprint-filter.mjs — keep reprint sales out of the sold marks of the ORIGINAL cards (Oct 14 2026, CoS weekly, Index Keeper).
//
// Why: the 30th Celebration Classic Collection (2026) and the Celebrations Classic Collection (2021) reprint older cards under
// their ORIGINAL set numbers, and eBay sellers title the reprints with the original set's name ("Aquapolis Lugia 149/147",
// "Pikachu & Zekrom GX 33/181 Sm-Team Up"). PriceCharting files many of those sales on the original's page. Retention Desk
// finding, verified by the Oct 13 desk: TU19 Pikachu & Zekrom GX #33 had 19 of 36 window rows from the 30th reprint ($31.49
// published vs about $50 clean); reprint-priced rows reached AQ03 Lugia #149 on Oct 13.
//
// Data-quality filter only (CHARTER §3): it decides which sold rows are a sale of THIS card. The mark rule (median of the
// clean rows in the ticker window, holo rule widening) is unchanged. Titles are read in memory and never stored (R17).

// Consoles whose cards were reprinted (WOTC era + Team Up). Scoped by the item's PriceCharting path, so a cached read is
// filtered the same way whichever ticker asked for it. Celebrations (pokemon-celebrations) and the 30th Celebration console
// (pokemon-30th-celebration) are the reprint sets themselves and are never in scope.
export const REPRINT_SCOPE = /^pokemon-(base-set|jungle|fossil|team-rocket|neo-genesis|neo-discovery|neo-revelation|neo-destiny|aquapolis|skyridge|team-up)\//;

// Words a reprint title carries and a genuine 1999–2003 / 2019 original title does not. "celebr" catches Celebration,
// Celebrations and the truncated "30th Celebr" (and not Celebi). Plain "gold" is NOT a reprint word: Team Up has genuine gold
// secret rares, so only "gold stamp(ed)" / "gold border(ed)" count. "1st Edition", "Unlimited", "Holo", "Shadowless" are never
// reprint words.
export const REPRINT_TITLE = /(\b30th\b|\b25th\b|\bcelebr|\bclassic\s*collection\b|\breprint(s|ed)?\b|\bgold[\s-]*(stamp|stamped|border|bordered)\b)/i;
// "2026" counts only on the six reprinted slots (REPRINT_PAIRS): sellers of genuine originals sometimes title with the year
// they list in (Team Up Nita #180, Jun 26 2026: "2026 Pokemon Nita 180/181 Team Up …" — Nita was never reprinted).
const YEAR_2026 = /\b2026\b/;

// "Not a reprint", "no reprints", "NOT Celebrations", "non-reprint" are originals saying so: removed before the test.
const NEGATED = /\b(not|no|non|never)[\s-]+(an?\s+|the\s+)?(30th\s+|25th\s+)?(reprints?|reprinted|celebrations?|classic\s*collection)\b/gi;

// Slots whose original print is NOT holo while the Classic Collection reprint is (rarity: data/kb/pokemon-rarity.json —
// neo1 #25 Sneasel "Rare", base1 #58 Pikachu "Common"). On these pages a title calling the card holo is the reprint;
// "Non-Holo" / "non holo" stays.
export const HOLO_MEANS_REPRINT = new Set(["pokemon-neo-genesis/sneasel-25", "pokemon-base-set/pikachu-58"]);
const HOLO_WORD = /(?<!non[\s-]?)\bholo/i;

// The six original ↔ 30th Celebration reprint pairs the house prices (Retention Desk R16, Oct 13: a name + number match
// across all universes finds no others). The "2026" year word counts only on these slots.
export const REPRINT_PAIRS = {
  "pokemon-base-set/charizard-4": "pokemon-30th-celebration/charizard-4",
  "pokemon-base-set/pikachu-58": "pokemon-30th-celebration/pikachu-58",
  "pokemon-neo-genesis/sneasel-25": "pokemon-30th-celebration/sneasel-25",
  "pokemon-neo-destiny/shining-celebi-106": "pokemon-30th-celebration/shining-celebi-106",
  "pokemon-aquapolis/lugia-149": "pokemon-30th-celebration/lugia-149",
  "pokemon-team-up/pikachu-&-zekrom-gx-33": "pokemon-30th-celebration/pikachu-&-zekrom-gx-33",
};

export const inReprintScope = (path) => REPRINT_SCOPE.test(String(path || ""));

// true when this sold-row title, on the page at `path`, is a reprint sale
export function isReprintTitle(title, path) {
  if (!title || !inReprintScope(path)) return false;
  const t = String(title).replace(/&amp;/g, "&").replace(/&#43;/g, "+").replace(NEGATED, " ");
  if (REPRINT_TITLE.test(t)) return true;
  if (REPRINT_PAIRS[String(path)] && YEAR_2026.test(t)) return true;
  if (HOLO_MEANS_REPRINT.has(String(path)) && HOLO_WORD.test(t)) return true;
  return false;
}
