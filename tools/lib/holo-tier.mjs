// holo-tier.mjs — which slots of a set are HOLO-TIER (holos, Shinings, Crystals, secret/ultra/illustration rares and up).
//
// THE HOLO RULE (Mo, Oct 6 2026: "holos are more important than non-holos and must be in the Pokémon set-index baskets").
// A set's value sits in its holo tier, and raw holos trade slower than commons precisely because they cost more — so a pure
// liquidity screen inverts the index: Skyridge marked 70 commons and 3 holos while Gengar H9, Umbreon H30 and all six
// Crystals sat "in the universe, not the basket". Under the rule a holo-tier slot is a STANDING constituent of its index:
// it is never screened out, and when its sales are thinner than the screen its mark widens to the nearest window with
// clean sales (ticker window → 90 → 180 → 365 days), labelled thin and dated. Only a holo with no clean raw sale in a
// year stays out, and it is named on the page. Non-holo slots keep the liquidity screen exactly as before.
//
// Rarity source: data/kb/pokemon-rarity.json (tools/kb/build-rarity.mjs — pokemontcg.io data). A slot is matched by
// name + number, then by number alone (a/b printings and PriceCharting spellings), so a set without rarity data simply
// has no holo tier (the rule is inert there, never guessed).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let DATA = null;
function data() { if (!DATA) { try { DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kb/pokemon-rarity.json"), "utf8")).sets || {}; } catch (e) { DATA = {}; } } return DATA; }

const PLAIN = new Set(["Common", "Uncommon", "Rare"]);
// Scarlet & Violet / Mega Evolution era prints every Rare in holofoil, so "Rare" is holo-tier there; before that "Rare" is the non-holo rare.
export const isHoloTier = (rarity, setId) => !rarity ? false : PLAIN.has(rarity) ? (rarity === "Rare" && /^(sv|me)/.test(String(setId))) : true;
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
const numKey = (n) => String(n).toUpperCase().replace(/^GG0?/, "GG").replace(/^SV0?/, "SV").replace(/^0+(\d)/, "$1").replace(/^(\d+)[AB]$/, "$1");

// rarityLookup(setIds) → (universeRow) → { rarity, setId } | null
export function rarityLookup(setIds) {
  const byKey = new Map(), byNum = new Map();
  for (const sid of setIds || []) {
    for (const [num, name, rarity] of data()[sid] || []) {
      byKey.set(norm(name) + "#" + numKey(num), { rarity, setId: sid });
      if (!byNum.has(numKey(num))) byNum.set(numKey(num), { rarity, setId: sid });
    }
  }
  if (!byKey.size) return () => null;
  return (u) => byKey.get(norm(u.name) + "#" + numKey(u.num)) || byKey.get(norm(u.name).replace(/\s*\(.*\)$/, "") + "#" + numKey(u.num)) || byNum.get(numKey(u.num)) || null;
}
// holoTest(setIds) → (universeRow) → true when the slot is holo-tier
export function holoTest(setIds) { const look = rarityLookup(setIds); return (u) => { const r = look(u); return !!(r && isHoloTier(r.rarity, r.setId)); }; }
export const hasRarity = (setIds) => (setIds || []).some((sid) => (data()[sid] || []).length);
