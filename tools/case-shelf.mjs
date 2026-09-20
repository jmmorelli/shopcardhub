// case-shelf.mjs — the shared definition of "a real sealed CASE listing", used by
// tools/build-buy-strip.mjs (which renders the link) and tools/buy-strip-health.mjs
// (which proves the link still points at something).
//
// Why this file exists (Idea #32, adopted by Mo 2026-09-20): every sealed query on
// this site excludes cases by construction (`-case -lot`), because a case or a lot
// would corrupt a per-box mark. That is right for a MARK and wrong for a LINK — the
// largest sealed basket an investor buys has never had a link on this site. The case
// link is a LINK ONLY: no figure is ever rendered from it, it never reaches the price
// engine, and it is never an index input.
//
// The hard part is that "case" is a false-positive magnet. "CASE BREAK", "case hit",
// "PYP case" are $20 break slots, not $6,000 cases — measured 2026-09-20 on
// /api/comps for 2025-26 Topps Definitive: 30 of 30 raw hits were break slots at
// $20–$40. CASE_OK requires a case SHAPE ("12-box case", "hobby case", "sealed case")
// and CASE_BAD throws the break tail out.

export const CASE_OK  = /\b(\d{1,2}\s?-?\s?box\s+case|case\s+of\s+\d{1,2}|hobby\s+case|sealed\s+case|factory\s+sealed\s+case|booster\s+case|box\s+case)\b/i;
export const CASE_BAD = /\b(break|pyp|pick\s?your|rip|random|slot|spot|hit|filler|personal|psa|cgc|bgs|empty|opened|proxy|custom|digital|display|lot|card\s+lot|single|singles|wrapper|repack)\b/i;

// A set's link is only rendered when at least this many CLEAN case listings exist.
// Fewer than that and the link is dropped rather than left pointing at nothing
// (Idea #32 §8 — the pre-launch form of the kill criterion).
export const CASE_MIN = 3;

// `must` is a lowercase "phrase|phrase" list and each alternative is matched as a
// CONTIGUOUS PHRASE, not as loose words. That distinction is the whole guard: on
// 2026-09-20 a loose-word match let a "bowman chrome" case link land on
// "2026 BOWMAN BASEBALL 12-BOX HOBBY CASE (12 AUTOs) MLB w/Chrome" — a different
// product, and exactly the naming collision LANE-RULES R8 exists for.
export function titleOk(title, must) {
  const t = String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!must) return true;
  return String(must).toLowerCase().split("|").filter(Boolean)
    .some(alt => t.includes(alt.trim().replace(/[^a-z0-9]+/g, " ").trim()));
}

export function cleanCases(listings, must) {
  return (listings || [])
    .filter(l => typeof l.price === "number" && l.price > 0)
    .filter(l => CASE_OK.test(l.title || "") && !CASE_BAD.test(l.title || ""))
    .filter(l => titleOk(l.title, must))
    .sort((a, b) => a.price - b.price);
}
