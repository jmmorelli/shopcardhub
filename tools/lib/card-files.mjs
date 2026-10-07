// card-files.mjs — the per-card data behind /card?id=… and the nav card search (Sep 30 2026, Mo: "search individual cards
// … pulls up the card page (in an index already) that gives them all the options": raw, PSA 9, PSA 10, TAG).
//
// data/cards/<tk>.json   — written by build-sector-index.mjs on every bake (identity, raw sold mark, weight, eBay phrase, photo key)
// data/cards/g-<tk>.json — written by build-card-ladder.mjs (graded sold marks); the card page merges the two
// data/card-search.json  — rebuilt from every data/cards/<tk>.json: [id, label, set short name, raw mark]
//
// Oct 4 2026 (Coverage Scout report, build E — Mo: "resolve the issues as you see fit"): search sees every TRACKED card.
//   · a sector ticker's card file also carries every UNIVERSE row that is not in the weighted level, flagged screened:true —
//     either below the liquidity screen (no raw mark; why:"screen") or held at weight 0 by rule (raw mark kept; why:"line").
//     Search labels them "<set> · tracked, outside the level"; /card says why and leads with the graded sales.
//   · the six chase tickers get card files too (tools/build-chase-cards.mjs, kind:"chase").
import fs from "node:fs";
import path from "node:path";

export const cardSlug = (num) => String(num).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const cardId = (tk, num) => `${tk.toLowerCase()}-${cardSlug(num)}`;
// Two different cards can share a number inside one set — the Classic Collection reprints in CEL21 / TH26 keep their
// original numbers (Charizard 4/102 beside Palkia 4/25; Lugia 149/147 beside Pikachu ex 149/128), so a number alone is
// not a card key (Oct 5 2026: /card?id=th26-149 served Lugia for both, and g-<tk>.json held one ladder for two cards).
// The FIRST row with a number keeps the bare key (every existing id stays valid); later rows with the same number get
// "<num>-<name slug>". Keys drive the card id, the g-/h- ladder files and the EPN customid; `num` stays the display number.
export const cardKey = (num, name, seen) => {
  const n = String(num);
  if (!seen.has(n)) { seen.add(n); return n; }
  const k = `${n}-${cardSlug(name)}`; seen.add(k); return k;
};
// raw = an ungraded copy; graded words out so the Raw button opens raw listings only
export const RAW_NOT = "-psa -cgc -bgs -sgc -tag -beckett -graded -slab";
export const WOTC = new Set(["BS99", "JU99", "FO99", "TR00", "NG00", "NDC01", "NR01", "ND02"]);
// per-ticker words every eBay search for that index drops (Oct 4 2026, Pokémon KB G6 / audit S33, S40): Jungle "No Symbol"
// error holos are a separate variant; Aquapolis / Skyridge reverse holos are separate items the index does not hold.
// js/grade-links.js carries the same table (EXTRA) for the graded and auction links it builds.
export const RAW_EXTRA = { JU99: ' -"no symbol"', AQ03: " -reverse", SK03: " -reverse" };
// TAG TEAM sets (Oct 4 2026, TU19): listing titles say "Tag Team", so "-tag" would drop most raw copies and '-team -"tag team"'
// every TAG slab. These tickers drop only graded TAG slabs ("tag 10"/"tag 9"); js/grade-links.js carries the same set (TT).
export const TAG_TEAM = new Set(["TU19"]);
export const rawNot = (tk) => TAG_TEAM.has(tk) ? '-psa -cgc -bgs -sgc -"tag 10" -"tag 9" -beckett -graded -slab' : RAW_NOT;
// edition indices (Sep 30 2026, Mo: "make a respective index for those two" — 1st Edition and Shadowless are their own sets)
export const EDITION = { BS1E: "1st", JU1E: "1st", FO1E: "1st", TR1E: "1st", NG1E: "1st", NDC1E: "1st", NR1E: "1st", ND1E: "1st", BSSL: "shadowless" };

// the date of the last screen that actually READ the universe (a "--rescope" row re-applies scope without a re-read)
export function screenRead(x) {
  const reads = (x.screenLog || []).filter((r) => !/no re-read/.test(String(r.note || "")));
  return (reads[reads.length - 1] || (x.screenLog || [])[0] || {}).date || x.inception || null;
}

export function writeCardFile(ROOT, x, c, rows, imgAttr, dry) {
  const dir = path.join(ROOT, "data/cards");
  const h = x.history || [], last = h[h.length - 1];
  const bv = rows.reduce((s, b) => s + b.price * b.w, 0);
  const seenKeys = new Set();
  const cards = rows.map((b, i) => ({ id: cardId(x.ticker, (b.key = cardKey(b.num, b.name, seenKeys))), key: b.key, num: String(b.num), name: b.name, path: b.path, rank: i + 1, raw: b.price, n30: b.n30, rawAsOf: b.asOf || (last && last.date), w: bv ? Math.round((b.price * b.w / bv) * 10000) / 100 : null, ...(b.w === 0 ? { screened: true, why: "line" } : {}), ...(b.holo ? { holo: true } : {}), ...(b.thin ? { thin: true } : {}), ...(b.win ? { win: b.win } : {}), ...(b.wn != null ? { wn: b.wn } : {}), q: c.ebayQuery(b.name, b.num), img: imgAttr(b, c) }));
  // universe rows outside the basket: tracked, below the liquidity screen at the last read (no raw mark is published for them)
  const inB = new Set(rows.map((b) => b.path || `${b.name}#${b.num}`)), ids = new Set(cards.map((cd) => cd.id));
  let dup = 0, dupKeyed = 0;
  for (const u of x.universe || []) {
    if (inB.has(u.path || `${u.name}#${u.num}`)) continue;
    const key = cardKey(u.num, u.name, seenKeys), id = cardId(x.ticker, key); if (ids.has(id)) { dup++; continue; }
    ids.add(id); if (key !== String(u.num)) dupKeyed++;
    cards.push({ id, key, num: String(u.num), name: u.name, path: u.path, rank: null, raw: null, n30: null, rawAsOf: null, w: null, screened: true, why: "screen", q: c.ebayQuery(u.name, u.num), img: imgAttr(u, c) });
  }
  if (dup) console.log(`${x.ticker}: ${dup} universe row(s) share a card id with a basket row — not given a second card row`);
  if (dupKeyed) console.log(`${x.ticker}: ${dupKeyed} card(s) share a number with an earlier card and carry a name-suffixed key`);
  const doc = {
    _comment: "GENERATED by tools/build-sector-index.mjs (bake) — one row per universe card for /card?id=. raw = the index's own dated sold mark (30-day median of clean ungraded sales; 90 days on the 1st Edition / Shadowless tickers). screened:true = tracked but outside the level: why \"screen\" = below the liquidity screen at the last read (no raw mark), why \"line\" = held at weight 0 by rule (marked). holo:true = holo-tier standing constituent (HOLO RULE, Oct 6 2026); thin:true = fewer clean sales than the stay threshold, marked on the win-day window (wn = sales in it). Graded marks live in g-<tk>.json.",
    ticker: x.ticker, name: c.name, set: c.set, page: c.page, theme: c.theme, asOf: last ? last.date : x.inception, wotc: WOTC.has(x.ticker) || !!EDITION[x.ticker], ed: EDITION[x.ticker] || (WOTC.has(x.ticker) ? "unl" : null), window: (x.screen && x.screen.window) || 30,
    screen: { enter: (x.screen && x.screen.enter) || 6, stay: (x.screen && x.screen.stay) || 4, window: (x.screen && x.screen.window) || 30, read: screenRead(x) },
    ...(TAG_TEAM.has(x.ticker) ? { tagTeam: true } : {}),
    level: last ? last.level : null,
    cards,
  };
  if (dry) return;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${x.ticker.toLowerCase()}.json`), JSON.stringify(doc) + "\n");
  writeSearch(ROOT);
}

export const OUTSIDE = " · tracked, outside the level";
export function writeSearch(ROOT) {
  const dir = path.join(ROOT, "data/cards");
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => /^[a-z0-9]+\.json$/.test(f)).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const short = String(d.set).replace(/^Pokémon TCG /, "").replace(/ \(Unlimited\)$/, "");
    for (const cd of d.cards) out.push([cd.id, `${cd.name} #${cd.num}`, short + (cd.screened ? OUTSIDE : ""), cd.raw == null ? null : cd.raw]);
  }
  fs.writeFileSync(path.join(ROOT, "data/card-search.json"), JSON.stringify({ _comment: "GENERATED from data/cards/*.json — nav card search: [id, card, set, raw sold mark or null]. Set ending \"· tracked, outside the level\" = a universe card below the liquidity screen or held at weight 0.", cards: out }) + "\n");
}
