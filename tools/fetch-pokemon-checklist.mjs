#!/usr/bin/env node
// fetch-pokemon-checklist.mjs — data/sets/<slug>.json for a Pokémon set, from pokemontcg.io (P0-E checklist v2, Oct 24 2026).
//
// Why: the checklist worksheet (tools/build-checklist-page.mjs + js/checklist-sheet.js) needs every card in the set, not
// just the chase tier the index tracks, and nobody types a checklist from memory. The June decision approved the
// pokemontcg.io data for Pokémon (the card scans and data/kb/pokemon-rarity.json already come from it). This tool asks the
// API for the set and its cards, cross-checks the result against the committed mirror in data/kb/pokemon-rarity.json
// (same upstream, fetched independently) and against the index universe in data/indices.json when the set has an index,
// and only then writes the file. Any mismatch = exit 1 and no write.
//
// Shape (the Aug 21 checklist schema, extended minimally): { set, slug, cat:"pokemon", release, asof, source, fetched,
//   tcg:{ set, printedTotal, total }, groups:[{ key, title, kind, short, code, cards:[{ n, name, rarity, id }] }] }
//   groups = one per kind, in card-number order: Base (Common · Uncommon · Rare · Double Rare, the printed set) ·
//   ACE SPEC · Illustration Rare · Ultra Rare · Special Illustration Rare · Hyper Rare — only the kinds the set has.
//   `short` is the chip label on the sheet, `code` the rarity tag the index pages put in a Vault card's name
//   ("Umbreon ex SIR #161 Prismatic Evolutions"), `id` the pokemontcg.io card id (image hook later). No price, ever.
//
// Idempotent: if the cards are unchanged the previous `fetched`/`asof` stamps are kept, so a re-run writes nothing.
// Network: https://api.pokemontcg.io/v2 (no auth; POKEMONTCG_API_KEY is sent as X-Api-Key when set). The API answers
// 5xx now and then — each call is retried; with --mirror the pokemon-tcg-data GitHub mirror (what build-rarity.mjs reads)
// is used instead and the source stamp says so.
//
// Usage: node tools/fetch-pokemon-checklist.mjs "<set name>" <slug> [--ticker DR25] [--mirror] [--dry]
//   e.g.  node tools/fetch-pokemon-checklist.mjs "Destined Rivals" destined-rivals --ticker DR25
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const opt = (k, d) => (flag(k) ? args[args.indexOf(k) + 1] : d);
const pos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1] === "--ticker"));
const [SET_NAME, SLUG] = pos;
if (!SET_NAME || !SLUG || !/^[a-z0-9-]+$/.test(SLUG)) { console.error('usage: fetch-pokemon-checklist.mjs "<set name>" <slug> [--ticker TK] [--mirror] [--dry]'); process.exit(2); }
const TICKER = opt("--ticker", null), MIRROR = flag("--mirror"), DRY = flag("--dry");
const API = "https://api.pokemontcg.io/v2", MIRROR_SRC = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/";
const HEADERS = { "User-Agent": "shopcardhub-checklist", ...(process.env.POKEMONTCG_API_KEY ? { "X-Api-Key": process.env.POKEMONTCG_API_KEY } : {}) };

async function getJson(url, tries = 8) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: HEADERS });
      if (r.ok) return r.json();
      last = new Error(`HTTP ${r.status}`);
      if (r.status < 500 && r.status !== 429) break;
    } catch (e) { last = e; }
    await new Promise((res) => setTimeout(res, 2000 * (i + 1)));
  }
  throw new Error(`${url}: ${last && last.message}`);
}

/* kind buckets by pokemontcg.io rarity string — Base holds the printed set's four rarities */
const KINDS = [
  { key: "base", title: "Base set", kind: "Base", short: "Base", code: "", test: (r) => /^(Common|Uncommon|Rare|Double Rare)$/.test(r) },
  { key: "ace", title: "ACE SPEC", kind: "ACE SPEC", short: "ACE SPEC", code: "ACE", test: (r) => /^ACE SPEC/.test(r) },
  { key: "ir", title: "Illustration Rare", kind: "Illustration Rare", short: "IR", code: "IR", test: (r) => r === "Illustration Rare" },
  { key: "ur", title: "Ultra Rare", kind: "Ultra Rare", short: "UR", code: "UR", test: (r) => r === "Ultra Rare" },
  { key: "sir", title: "Special Illustration Rare", kind: "Special Illustration Rare", short: "SIR", code: "SIR", test: (r) => r === "Special Illustration Rare" },
  { key: "hr", title: "Hyper Rare", kind: "Hyper Rare", short: "Hyper", code: "HR", test: (r) => r === "Hyper Rare" },
];
const numKey = (n) => { const m = /^(\d+)(.*)$/.exec(String(n)); return m ? [parseInt(m[1], 10), m[2]] : [1e9, String(n)]; };
const byNum = (a, b) => { const [x, xs] = numKey(a.number), [y, ys] = numKey(b.number); return x - y || xs.localeCompare(ys); };

async function fromApi() {
  const sets = await getJson(`${API}/sets?q=name:"${encodeURIComponent(SET_NAME)}"&select=id,name,printedTotal,total,releaseDate`);
  const exact = (sets.data || []).filter((s) => s.name.toLowerCase() === SET_NAME.toLowerCase());
  if (exact.length !== 1) throw new Error(`set "${SET_NAME}": ${exact.length} exact matches (${(sets.data || []).map((s) => `${s.id}=${s.name}`).join(", ") || "none"})`);
  const set = exact[0];
  const cards = [];
  for (let page = 1; ; page++) {
    const r = await getJson(`${API}/cards?q=set.id:${set.id}&page=${page}&pageSize=250&orderBy=number&select=id,number,name,rarity,subtypes,supertype`);
    cards.push(...(r.data || []));
    if (cards.length >= (r.totalCount || 0) || !(r.data || []).length) break;
  }
  return { set, cards, source: `pokemontcg.io API v2 (set ${set.id})` };
}
async function fromMirror() {
  const sets = await getJson(`${MIRROR_SRC}sets/en.json`);
  const exact = sets.filter((s) => s.name.toLowerCase() === SET_NAME.toLowerCase());
  if (exact.length !== 1) throw new Error(`set "${SET_NAME}": ${exact.length} exact matches in the mirror`);
  const set = exact[0];
  const cards = await getJson(`${MIRROR_SRC}cards/en/${set.id}.json`);
  return { set, cards, source: `pokemon-tcg-data mirror of pokemontcg.io (set ${set.id})` };
}

const { set, cards, source } = await (MIRROR ? fromMirror() : fromApi());
if (!cards.length) throw new Error("no cards");
if (cards.length !== set.total) throw new Error(`${set.id}: ${cards.length} cards fetched vs total ${set.total} on the set record`);
const seen = new Set();
for (const c of cards) { if (!c.number || !c.name || !c.rarity) throw new Error(`${set.id}: card without number/name/rarity: ${JSON.stringify(c)}`); if (seen.has(c.number)) throw new Error(`${set.id}: duplicate number ${c.number}`); seen.add(c.number); }

/* cross-check 1: the committed mirror (independent fetch of the same upstream) */
const kbPath = path.join(ROOT, "data/kb/pokemon-rarity.json");
if (fs.existsSync(kbPath)) {
  const kb = JSON.parse(fs.readFileSync(kbPath, "utf8")).sets || {};
  if (kb[set.id]) {
    const m = new Map(kb[set.id].map(([n, nm, r]) => [String(n), `${nm}|${r}`]));
    const diff = cards.filter((c) => m.get(String(c.number)) !== `${c.name}|${c.rarity}`).map((c) => `#${c.number} ${c.name} (${c.rarity}) vs KB ${m.get(String(c.number)) || "missing"}`);
    if (diff.length || m.size !== cards.length) throw new Error(`${set.id}: disagrees with data/kb/pokemon-rarity.json — ${diff.length} rows differ, KB has ${m.size} vs ${cards.length} fetched:\n  ${diff.slice(0, 10).join("\n  ")}`);
    console.log(`${set.id}: matches data/kb/pokemon-rarity.json (${m.size} rows)`);
  } else console.log(`${set.id}: not in data/kb/pokemon-rarity.json — no mirror cross-check (add it to tools/kb/build-rarity.mjs SETS)`);
}
/* cross-check 2: the index universe (every tracked card must be on the sheet with the same name) */
if (TICKER) {
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "data/indices.json"), "utf8"))[TICKER];
  if (!idx) throw new Error(`${TICKER}: not in data/indices.json`);
  const a = new Map(cards.map((c) => [String(c.number), c.name]));
  const bad = (idx.universe || idx.basket || []).filter((u) => a.get(String(u.num)) !== u.name).map((u) => `#${u.num} ${u.name} vs sheet ${a.get(String(u.num)) || "missing"}`);
  if (bad.length) throw new Error(`${TICKER}: index universe disagrees with the fetched list:\n  ${bad.join("\n  ")}`);
  console.log(`${TICKER}: all ${(idx.universe || idx.basket || []).length} index cards are on the sheet under the same name`);
}

const sorted = cards.slice().sort(byNum);
const groups = KINDS.map((k) => ({ key: k.key, title: k.title, kind: k.kind, short: k.short, code: k.code,
  cards: sorted.filter((c) => k.test(c.rarity)).map((c) => ({ n: String(c.number), name: c.name, rarity: c.rarity, id: c.id })) }))
  .filter((g) => g.cards.length);
const unbucketed = sorted.filter((c) => !KINDS.some((k) => k.test(c.rarity)));
if (unbucketed.length) throw new Error(`${set.id}: rarities with no kind bucket: ${[...new Set(unbucketed.map((c) => c.rarity))].join(", ")} — add them to KINDS`);
groups.sort((a, b) => byNum({ number: a.cards[0].n }, { number: b.cards[0].n }));
const total = groups.reduce((n, g) => n + g.cards.length, 0);
const secret = sorted.filter((c) => numKey(c.number)[0] > set.printedTotal).length;

const out = path.join(ROOT, `data/sets/${SLUG}.json`);
const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : null;
const today = new Date().toISOString().slice(0, 10);
const same = prev && JSON.stringify(prev.groups) === JSON.stringify(groups) && prev.tcg && prev.tcg.set === set.id;
const doc = {
  set: set.name, slug: SLUG, cat: "pokemon", release: String(set.releaseDate || "").replace(/\//g, "-"),
  asof: same ? prev.asof : today, fetched: same ? prev.fetched : today,
  source: `${source}, cross-checked against data/kb/pokemon-rarity.json${TICKER ? ` and the ${TICKER} index universe` : ""} by tools/fetch-pokemon-checklist.mjs`,
  note: `${set.name}: ${set.printedTotal} cards in the printed set (#1–${set.printedTotal}) plus ${secret} secret rares (#${set.printedTotal + 1}–${set.total}) — ${total} in all, as pokemontcg.io lists them. Kinds follow the printed rarity; no price lives in this file.`,
  tcg: { set: set.id, printedTotal: set.printedTotal, total: set.total },
  groups,
};
const text = JSON.stringify(doc, null, 1) + "\n";
const changed = !prev || JSON.stringify(prev) !== JSON.stringify(doc);
if (!DRY && changed) fs.writeFileSync(out, text);
console.log(`${set.id} → data/sets/${SLUG}.json: ${changed ? (DRY ? "would write" : "wrote") : "unchanged"} — ${total} cards (${set.printedTotal} printed + ${secret} secret), ${groups.map((g) => `${g.short} ${g.cards.length}`).join(" · ")}`);
