#!/usr/bin/env node
// build-sector-index.mjs — a SECTOR-MODEL set index (rulebook: claude/cos/sector-index-rulebook-2026-09-15.md).
// First ticker built with it: TH26 · 30th Celebration (Sep 25 2026, Mo: "do it - I approve").
//
// The model, in one line: one set is one sector; the universe is EVERY card in the set (nobody selects
// constituents); a card is in the basket when it clears the liquidity screen (>= 6 clean single-card sold
// comps in the trailing 30 days, stays until < 4); price-weighted with a 25% single-card cap applied at
// reconstitution; base 100 at inception (Pokémon: at the release month since the Sep 30 2026 rebase — see baseLine()); divisor-continuous, so only prices move the level. Quarterly
// reconstitution (first Monday of Jan/Apr/Jul/Oct), announced the Monday before.
//
// DATA: PriceCharting — the set's console page for the universe (one product per slot) and each item's
// public "Ungraded" completed-sales table for the screen AND the mark (the same list answers both
// questions — rulebook §2b/§7). Listing titles are read in memory for the lot filter and NEVER stored
// (R17); only dates and prices leave the page, and only aggregates are published. Asks are never used (R20).
//
// Usage:
//   node tools/build-sector-index.mjs --ticker TH26 --init [--dry]      first build: universe → screen → basket → cap → divisor → level 100 → page block
//   node tools/build-sector-index.mjs --ticker TH26 --mark [--dry]      twice weekly (Mon/Thu): re-read the basket's sales, append a history row, re-bake the block
//   node tools/build-sector-index.mjs --ticker TH26 --recon [--dry]     quarterly: re-run the screen on the universe, enter/exit, re-cap, divisor-adjust (level unchanged)
//   node tools/build-sector-index.mjs --ticker TH26 --bake              re-bake the page block from data/indices.json only (no network)
// Add --if-mark-day to --mark to make it a no-op except on Monday/Thursday (for the nightly Action).
//
// Writes: data/indices.json (the ticker's key), <page>.html between <!-- <TICKER>:START --> … <!-- <TICKER>:END -->.
// Never touches another ticker, never touches the page outside its markers. Idempotent.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consoleCards } from "./price-engine/pc-console.mjs";
import { parsePage } from "./price-engine/sold-marks.mjs";
import { ebaySearchUrl, SACAT_TCG, SACAT_SPORTS } from "./lib/epn.mjs";
import { cardId, RAW_NOT, WOTC, EDITION, writeCardFile } from "./lib/card-files.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const has = (k) => args.includes(k);
let TICKER = opt("--ticker", null);
const DRY = has("--dry");
const TODAY = process.env.SIDX_TODAY || new Date().toISOString().slice(0, 10);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const PAUSE = 1600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (x) => Math.round(x * 100) / 100;
const r4 = (x) => Math.round(x * 10000) / 10000;
const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const days = (d) => (Date.parse(TODAY) - Date.parse(d)) / 864e5;
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mdy = (d) => { const p = String(d).slice(0, 10).split("-"); return `${p[1]}/${p[2]}/${p[0].slice(2)}`; };
// Sep 30 2026 (Mo: rebase every Pokémon index to its release date). A ticker with baseDate is based at its release month
// (baseRule "release") or at the first month PriceCharting's history covers the basket ("first-reliable"); months before
// inception are the labelled monthly reconstruction in .recon. Bowman joined the release-month base Oct 1 2026 (Mo: "start at
// release date"; tools/build-recon-bowman.mjs). A ticker without baseDate still prints inception wording.
const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const baseMon = (x) => `${MONS[+x.baseDate.slice(5, 7) - 1]} ${x.baseDate.slice(0, 4)}`;
const baseKind = (x) => x.baseRule !== "release" ? "first reliable month" : String(x.releaseDate || "").slice(0, 7) === x.baseDate ? "release month" : "first month after release";
const baseLine = (x) => x.baseDate ? `100 = ${baseMon(x)} (${baseKind(x)}) · live since ${mdy(x.inception)}` : `base 100.00 · inception ${mdy(x.inception)}`;
const baseSentence = (x) => x.baseDate ? (x.baseRule === "release" ? `100 = ${baseMon(x)}, the set's ${baseKind(x)}` : `100 = ${baseMon(x)}, the first month the sold history reliably covers (the set predates it)`) + `; ${x.recon && x.recon.length ? `months before ${mdy(x.inception)} are reconstructed from monthly price history, ` : ""}live marks since ${mdy(x.inception)}.` : `Base 100.00 at ${mdy(x.inception)}.`;
const sinceLbl = (x) => x.baseDate ? (x.baseRule === "release" ? "Since release" : "Since base") : "Since inception";

// ---------------- per-ticker config (the parameters are Mo's, Sep 15 2026; do not tune) ----------------
const CONFIG = {
  TH26: {
    name: "30th Celebration Set Index",
    set: "Pokémon TCG 30th Celebration",
    page: "/pokemon-30th-anniversary-2026",
    pcSlug: "pokemon-30th-celebration",
    ebayQuery: (name, num) => `pokemon 30th celebration ${name} ${num}`,
    theme: "#f5c800",
    releaseDate: "2026-09-16",
    imgSet: "Pokemon 30th Celebration",   // photo name-search: plain "Pokemon"; NO denominator — the Classic Collection reprints keep their original numbering (Charizard 4/102), so "4/128" finds nothing
    sub: { RGB: { name: "Mew RGB trio", nums: ["R/RGB", "G/RGB", "B/RGB"], blurb: "The three secret-rare Mews (R, G, B) — the set's chase, tracked as their own line so the trio's move is never mistaken for the set's." } },
    note: "Includes the Classic Collection reprints (Charizard #4, Lugia #149 …) — they are in the set on PriceCharting's listing and enter the basket the week they clear the screen; the Ultra-Premium Collection that carries them ships Nov 6. Product waves run through Dec 4; the index runs forward from its release-month base, so supply arriving later is a market event, never a restatement.",
  },
  // SV151 (Sep 25 2026, Mo: "SV151 index now"). Path B of claude/cos/sv151-rebuild-spec-2026-09-17.md: inception = the
  // build date, base 100, never Sep 15. The Sep 17 "authenticated Chrome wall" is gone — item pages carry the ungraded
  // completed-sales table unauthenticated (the same read TH26 has used since Sep 25). Universe = every numbered slot on
  // the set's console (207 in the Sep 17 spec); "Poster Collection #49" is a sealed product wearing a card number and is
  // skipped by title; [Prize Pack] / [Reverse Holo] / [Cosmos Holo] / retailer stamps are variants (bracket rule).
  SV151: {
    name: "Scarlet & Violet 151 Set Index",
    set: "Pokémon TCG Scarlet & Violet 151",
    page: "/scarlet-violet-151-index",
    pcSlug: "pokemon-scarlet-&-violet-151",
    ebayQuery: (name, num) => `pokemon 151 ${name} ${num}`,
    theme: "#ff5a3c",
    releaseDate: "2023-09-22",
    imgSet: "Pokemon 151", denom: 165,
    skipTitle: /poster collection/i,
    note: "151 is the original 151 Pokémon, #1–#151 in Pokédex order, plus trainers, energies and the illustration-rare and special-illustration-rare tier (#152–#207). A three-year-old set with deep, steady liquidity — most of the 207 slots trade as singles every week, so the basket is close to the whole set from day one. Sealed product (Booster Bundle, ETB, UPC, tins) is not a card and is not in the universe.",
  },
  // ---------------- CLASSIC POKÉMON SETS (Sep 28 2026, Mo: "add at least 10+ more indices for pokemon, specifically the popular
  // sets from the past. The Pokemon Skyridge comes to mind"). Same model, same parameters, one ticker per set. The slot is the
  // BRACKETLESS print on PriceCharting's console (bracket rule above): for the WOTC sets that is the UNLIMITED print —
  // [1st Edition], [Shadowless], [1999-2000] and error/stamp variants are separate items and are not in these indices. The
  // e-Card sets' [Reverse Holo] prints drop the same way. Vintage "ungraded" is any raw copy, so the mark is a raw-condition
  // median, not a near-mint price — the note says so on every page.
  ...classicConfigs(),
  // ---------------- BOWMAN (Sep 25 2026, Mo: "BOW26 = every 1st Bowman Chrome from all 2026 Bowman releases, autos lead,
  // non-autos the sub-index; each release its own index; BOW27 next year") ----------------
  // SportsCardsPro lists May's 2026 Bowman and September's 2026 Bowman Chrome prospect autos on ONE console
  // ("2026 Bowman Chrome Prospect Autograph", 192 base slots) and their Chrome Prospects on another (BCP-1..150 = May,
  // BCP-151..250 = September). The release is told apart by the September checklist (data/sets/2026-bowman-chrome-
  // baseball.json: 104 autos, 97 flagged 1st; 100 base, 72 flagged 1st). May's cards carry no flag file yet — a May
  // CPA/BCP slot is taken as a 1st unless the player had a same-kind card in a 2025 release (Oct 1 2026 correction). Bowman Draft (December) joins BOW26 as a third source
  // the first Monday after its console appears.
  ...bowmanConfigs(),
};

// ---- Bowman helpers (release split + 1st flags from the September checklist) ----
function classicConfigs() {
  const W = "Unlimited print only: 1st Edition, Shadowless and stamped or error variants are separate PriceCharting items and are not in this index. A vintage raw copy can be any condition, so the mark is the median raw sale, not a near-mint price.";
  const E = "Reverse holo prints are separate items and are not in this index. A raw copy can be any condition, so the mark is the median raw sale, not a near-mint price.";
  const M = "Reverse holo, Prize Pack and stamped prints are separate items and are not in this index.";
  const mk = (tk, o) => [tk, { imgSub: "pokemon", classic: true, imgNot: "-celebrations -25th -reprint -japanese", ...o, ebayQuery: (name, num) => `pokemon ${o.q} ${name} ${num}` }];
  return Object.fromEntries([
    mk("BS99", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/base1/" + b.num + ".png" : null, name: "Base Set Index", set: "Pokémon TCG Base Set (Unlimited)", page: "/pokemon-base-set-index", pcSlug: "pokemon-base-set", q: "base set unlimited", theme: "#e8b93a", releaseDate: "1999-01-09", imgSet: "Pokemon Base Set", denom: 102, note: "The first English set (1999): Charizard, Blastoise and Venusaur lead a 102-card set. " + W }),
    mk("JU99", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/base2/" + b.num + ".png" : null, name: "Jungle Set Index", set: "Pokémon TCG Jungle (Unlimited)", page: "/pokemon-jungle-index", pcSlug: "pokemon-jungle", q: "jungle unlimited", theme: "#4caf50", releaseDate: "1999-06-16", imgSet: "Pokemon Jungle", denom: 64, note: "The second English set (1999), 64 cards; the holo Eeveelutions and Snorlax are the chase. " + W }),
    mk("FO99", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/base3/" + b.num + ".png" : null, name: "Fossil Set Index", set: "Pokémon TCG Fossil (Unlimited)", page: "/pokemon-fossil-index", pcSlug: "pokemon-fossil", q: "fossil unlimited", theme: "#b0a089", releaseDate: "1999-10-10", imgSet: "Pokemon Fossil", denom: 62, note: "The third English set (1999), 62 cards; Gengar, Dragonite and the legendary birds lead it. " + W }),
    mk("TR00", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/base5/" + b.num + ".png" : null, name: "Team Rocket Set Index", set: "Pokémon TCG Team Rocket (Unlimited)", page: "/team-rocket-index", pcSlug: "pokemon-team-rocket", q: "team rocket unlimited", theme: "#d23c3c", releaseDate: "2000-04-24", imgSet: "Pokemon Team Rocket", denom: 82, note: "The 2000 Dark Pokémon set; Dark Charizard, Dark Blastoise and the secret Dark Raichu #83 lead it. " + W }),
    mk("NG00", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/neo1/" + b.num + ".png" : null, name: "Neo Genesis Set Index", set: "Pokémon TCG Neo Genesis (Unlimited)", page: "/neo-genesis-index", pcSlug: "pokemon-neo-genesis", q: "neo genesis unlimited", theme: "#f0a830", releaseDate: "2000-12-16", imgSet: "Pokemon Neo Genesis", denom: 111, note: "The first Neo set (2000), 111 cards; Lugia is the chase, with the two Typhlosion prints and Pichu behind it. " + W }),
    // ---- WOTC EDITION INDICES (Sep 30 2026, Mo: "1st edition and shadowless … make a respective index for those two with their
    // specific cards"). Same set, different print = a different collectible. Universe = the console's "[1st Edition]" (or
    // "[Shadowless]") items only; Base Set 1st Edition copies are also shadowless by print, and PriceCharting lists them as
    // [1st Edition] — the Shadowless index is the NON-1st shadowless print. Screen: 6 clean raw sales in 90 days to enter, 4 to
    // stay, 90-day median mark (Mo's choice: the 30-day screen would leave Base 1st Ed with 22 commons and no holos).
    ...[["BS1E", "pokemon-base-set", "Base Set", "base1", 102, "1999-01-09", "#c0392b", "/pokemon-base-set-1st-edition-index", "The 1999 Base Set 1st Edition print — the black \"Edition 1\" stamp, shadowless frame, the first Charizard. "],
        ["JU1E", "pokemon-jungle", "Jungle", "base2", 64, "1999-06-16", "#2e7d32", "/pokemon-jungle-1st-edition-index", "The 1999 Jungle 1st Edition print (stamped). "],
        ["FO1E", "pokemon-fossil", "Fossil", "base3", 62, "1999-10-10", "#8d7b5f", "/pokemon-fossil-1st-edition-index", "The 1999 Fossil 1st Edition print (stamped). "],
        ["TR1E", "pokemon-team-rocket", "Team Rocket", "base5", 82, "2000-04-24", "#a32020", "/team-rocket-1st-edition-index", "The 2000 Team Rocket 1st Edition print (stamped). "],
        ["NG1E", "pokemon-neo-genesis", "Neo Genesis", "neo1", 111, "2000-12-16", "#c98a1c", "/neo-genesis-1st-edition-index", "The 2000 Neo Genesis 1st Edition print (stamped). "],
        ["ND1E", "pokemon-neo-destiny", "Neo Destiny", "neo4", 105, "2002-02-28", "#4b3fa8", "/neo-destiny-1st-edition-index", "The 2002 Neo Destiny 1st Edition print (stamped); the Shining Pokémon lead it. "],
    ].map(([tk, slug, set, img, denom, rel, theme, page, note]) => [tk, { imgSub: "pokemon", classic: true, imgNot: "-celebrations -25th -reprint -japanese",
      imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? `https://images.pokemontcg.io/${img}/${b.num}.png` : null,
      name: `${set} 1st Edition Index`, set: `Pokémon TCG ${set} (1st Edition)`, page, pcSlug: slug,
      sources: [{ slug, keep: (title) => /\[1st Edition\]/.test(title) }],
      screen: { window: 90 }, theme, releaseDate: rel, imgSet: `Pokemon ${set} 1st Edition`, denom,
      ebayQuery: (name, num) => `pokemon ${set.toLowerCase()} 1st edition ${name} ${num}`,
      note: note + "1st Edition print only: Unlimited, Shadowless and stamped promos are separate items with their own indices. Raw 1st Edition holos sell a few times a month, so this index screens and marks on 90 days of sales (enter at 6, stay at 4). A raw copy can be any condition, so the mark is the median raw sale, not a near-mint price." }]),
    ["BSSL", { imgSub: "pokemon", classic: true, imgNot: "-celebrations -25th -reprint -japanese",
      imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/base1/" + b.num + ".png" : null,
      name: "Base Set Shadowless Index", set: "Pokémon TCG Base Set (Shadowless)", page: "/pokemon-base-set-shadowless-index", pcSlug: "pokemon-base-set",
      sources: [{ slug: "pokemon-base-set", keep: (title) => /\[Shadowless\]/.test(title) }],
      screen: { window: 90 }, theme: "#7f8c8d", releaseDate: "1999-01-09", imgSet: "Pokemon Base Set Shadowless", denom: 102,
      ebayQuery: (name, num) => `pokemon base set shadowless ${name} ${num}`,
      note: "The early-1999 Base Set print without the drop shadow on the art box and without the 1st Edition stamp. Shadowless print only: 1st Edition (also shadowless, stamped) and Unlimited are separate items with their own indices. Screens and marks on 90 days of raw sales (enter at 6, stay at 4). A raw copy can be any condition, so the mark is the median raw sale, not a near-mint price." }],
    mk("ND02", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/neo4/" + b.num + ".png" : null, name: "Neo Destiny Set Index", set: "Pokémon TCG Neo Destiny (Unlimited)", page: "/neo-destiny-index", pcSlug: "pokemon-neo-destiny", q: "neo destiny unlimited", theme: "#6a5acd", releaseDate: "2002-02-28", imgSet: "Pokemon Neo Destiny", denom: 105, note: "The last Neo set (2002); the Shining Pokémon (#106–#113, Shining Charizard first) are the chase. " + W }),
    mk("AQ03", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/ecard2/" + b.num + ".png" : null, name: "Aquapolis Set Index", set: "Pokémon TCG Aquapolis", page: "/aquapolis-index", pcSlug: "pokemon-aquapolis", q: "aquapolis", theme: "#2fa4d8", releaseDate: "2003-01-15", imgSet: "Pokemon Aquapolis", denom: 147, note: "An e-Card set (2003); the Crystal Lugia #149 leads, with Crystal Nidoking #150 and the H-numbered holos behind it. " + E }),
    mk("SK03", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/ecard3/" + b.num + ".png" : null, name: "Skyridge Set Index", set: "Pokémon TCG Skyridge", page: "/skyridge-index", pcSlug: "pokemon-skyridge", q: "skyridge", theme: "#8fb6e8", releaseDate: "2003-05-12", imgSet: "Pokemon Skyridge", denom: 144, note: "The last WOTC set (2003) and the scarcest e-Card print run. The H-numbered holos lead the basket; the Crystal cards (#146–#150) sell too rarely to clear the liquidity screen, so they sit in the universe until they do. " + E }),
    mk("HF19", { imgSrc: (b) => /^SV\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/sma/" + b.num + ".png" : /^\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/sm115/" + b.num + ".png" : null, name: "Hidden Fates Set Index", set: "Pokémon TCG Hidden Fates", page: "/hidden-fates-index", pcSlug: "pokemon-hidden-fates", q: "hidden fates", theme: "#e0503c", releaseDate: "2019-08-23", imgSet: "Pokemon Hidden Fates", denom: 68, note: "The 2019 special set with the Shiny Vault (SV1–SV94); Charizard-GX SV49 is the chase. " + M }),
    mk("EVS21", { imgSrc: (b) => /^[H]?\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/swsh7/" + b.num + ".png" : null, name: "Evolving Skies Set Index", set: "Pokémon TCG Evolving Skies", page: "/evolving-skies-index", pcSlug: "pokemon-evolving-skies", q: "evolving skies", theme: "#3c7fd8", releaseDate: "2021-08-27", imgSet: "Pokemon Evolving Skies", denom: 203, note: "The 2021 Eeveelution set; Umbreon VMAX alt art #215 (\"Moonbreon\") is the chase, with Rayquaza VMAX alt #218. " + M }),
    mk("CEL21", { imgNot: "-japanese", name: "Celebrations Set Index", set: "Pokémon TCG Celebrations", page: "/celebrations-index", pcSlug: "pokemon-celebrations", q: "celebrations", theme: "#d4af37", releaseDate: "2021-10-08", imgSet: "Pokemon Celebrations", note: "The 25th-anniversary set (2021): 25 main cards, the Classic Collection reprints (which keep their original numbers, so Charizard is #4) and the Celebrations promos PriceCharting files with the set. " + M }),
    mk("CZ23", { imgSrc: (b) => /^GG\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/swsh12pt5gg/" + b.num + ".png" : /^\d+$/.test(String(b.num)) ? "https://images.pokemontcg.io/swsh12pt5/" + b.num + ".png" : null, name: "Crown Zenith Set Index", set: "Pokémon TCG Crown Zenith", page: "/crown-zenith-index", pcSlug: "pokemon-crown-zenith", q: "crown zenith", theme: "#c9a227", releaseDate: "2023-01-20", imgSet: "Pokemon Crown Zenith", denom: 159, note: "The 2023 special set with the Galarian Gallery (GG01–GG70); the Giratina, Mewtwo and Arceus VSTAR gallery cards lead it. " + M }),
  ]);
}
function bowmanConfigs() {
  let sep = { autos: new Map(), base: new Map() };
  try {
    const set = JSON.parse(fs.readFileSync(path.join(ROOT, "data/sets/2026-bowman-chrome-baseball.json"), "utf8"));
    for (const g of set.groups || []) for (const cd of g.cards || []) (g.key === "cpa" ? sep.autos : sep.base).set(String(cd.player).toLowerCase(), !!cd.first);
  } catch (e) { console.error("bowman: September checklist unreadable — " + e.message); }
  const bcpNum = (num) => parseInt(String(num).replace(/^BCP-/i, ""), 10);
  const isSepAuto = (name) => sep.autos.has(String(name).toLowerCase());
  const sepFirstAuto = (name) => sep.autos.get(String(name).toLowerCase()) === true;
  const sepFirstBase = (name) => sep.base.get(String(name).toLowerCase()) === true;
  const AUTOS = "baseball-cards-2026-bowman-chrome-prospect-autograph", BASE = "baseball-cards-2026-bowman-chrome-prospect";
  const autoSlot = (t) => /#CPA-/i.test(t), baseSlot = (t) => /#BCP-/i.test(t);
  // Oct 1 2026 (Bowman KB + Mo: "fix everything that contradicts"): May's 2026 Bowman has no 1st-flag file, and the old
  // "every May CPA/BCP slot is a 1st" assumption was wrong — 11 of the May autos (CI: "87 signers, 76 of these 1st Bowman
  // autographs") and 39 May BCP cards are RETURNING players who already had that kind of Bowman card in a 2025 release.
  // A May slot is a 1st only if the player has no same-kind card in the 2025 sets in data/sets (players whose prior card is
  // older than 2025 are not caught here — KB GAPS G5).
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "").replace(/ jr$/, "").trim();
  const prior = { auto: new Set(), base: new Set() };
  for (const f of ["bowman-baseball-2025.json", "bowman-chrome-baseball-2025.json", "bowman-draft-baseball-2025.json"]) {
    try { const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data/sets", f), "utf8"));
      for (const g of d.groups || []) { const t = (g.key || "") + " " + (g.title || g.name || ""); if (/^base set$/i.test(g.title || g.name || "")) continue;
        for (const cd of g.cards || []) (/auto|cpa/i.test(t) ? prior.auto : prior.base).add(norm(cd.player)); } }
    catch (e) { console.error("bowman: 2025 prior set unreadable — " + f + " " + e.message); }
  }
  // Oct 2 2026 (desk, iw-2026-10-02-1): returning May autos whose prior auto predates the 2025 sets above, each sourced.
  // George Lombard Jr. — 1st Bowman Chrome is 2024 Bowman BCP-79; CPA in 2024 Bowman (#CPA-GLO).
  for (const n of ["George Lombard Jr."]) prior.auto.add(norm(n));
  const may = { auto: (name, num) => !isSepAuto(name) && !prior.auto.has(norm(name)), base: (name, num) => bcpNum(num) <= 150 && !prior.base.has(norm(name)) };
  const sept = { auto: (name, num) => isSepAuto(name) && sepFirstAuto(name), base: (name, num) => bcpNum(num) > 150 && sepFirstBase(name) };
  const common = {
    cat: "baseball", imgSub: "1ST BOWMAN", sacat: SACAT_SPORTS,
    ebayQuery: (name, num) => `2026 bowman chrome ${name} ${/^CPA/i.test(num) ? "auto" : ""} ${num}`.replace(/\s+/g, " "),
    imgKey: (b) => `${b.name} 2026 Bowman Chrome ${/^CPA/i.test(b.num) ? "Auto" : ""} ${b.num}`.replace(/\s+/g, " "),
    theme: "#00ccf5", releaseDate: "2026-05-13",
    kind: "1st Bowman Chrome Auto", kindPlural: "1st Bowman Chrome Autos",
    // iw-2026-09-29-5 (weekly Sep 30): the method note names what the reader actually reads for these cards — the
    // SportsCardsPro/PriceCharting item page lists dated eBay sales only (no TCGplayer rows for sports cards), 30 at most.
    srcNote: "the dated ungraded eBay sales SportsCardsPro/PriceCharting lists for each card (eBay only — no TCGplayer rows for sports cards)",
    rowCap: 30, rowCapNote: ", so an n30 of 29–30 means at least that many",
  };
  return {
    BB26: { ...common, name: "2026 Bowman 1st Auto Index", set: "2026 Bowman", page: "/bowman-2026-index",
      sources: [{ slug: AUTOS, keep: (t, name, num) => autoSlot(t) && may.auto(name, num) }],
      subUniverse: { key: "BASE", name: "1st Bowman Chrome (base)", blurb: "the same release's 1st Bowman Chrome base cards, price-weighted, uncapped — the non-auto line under the autos", sources: [{ slug: BASE, keep: (t, name, num) => baseSlot(t) && may.base(name, num) }] },
      note: "May's 2026 Bowman: the flagship whose on-card Chrome Prospect Autograph insert (#CPA-) is where the class's 1st Bowman Chrome Autos live — Holliday, Fischer, Kim and the rest of the Bangers board are all here. Paper prospect cards (BP-) are left out on purpose: the chase is Chrome. The Bangers board ranks five of these on the 30-day median of dated sales and makes calls; this index prices every one that trades and makes none." },
    BCB26: { ...common, name: "2026 Bowman Chrome 1st Auto Index", set: "2026 Bowman Chrome", page: "/bowman-chrome-2026-index", releaseDate: "2026-09-09",
      sources: [{ slug: AUTOS, keep: (t, name, num) => autoSlot(t) && sept.auto(name, num) }],
      subUniverse: { key: "BASE", name: "1st Bowman Chrome (base)", blurb: "September's 1st Bowman Chrome base cards (BCP-151 up), price-weighted, uncapped", sources: [{ slug: BASE, keep: (t, name, num) => baseSlot(t) && sept.base(name, num) }] },
      note: "September's 2026 Bowman Chrome: only the autos our Sep 9 per-card audit tags as a player's first Bowman autograph are in (97 of 104; no published checklist marks 1sts on auto lines); returning autos (Kilby, Quintero, F. Arias, J. Gonzalez, Parker, Doyle, Peña) had their 1st Bowman autos in 2025 products and are excluded here, not double-counted. Release-week supply is heavy, so the first quarter of marks reads the drawdown every Bowman product prints before the class sorts itself." },
    BOW26: { ...common, name: "2026 1st Bowman Chrome Auto Index", set: "2026 Bowman and Bowman Chrome", page: "/bowman-1st-chrome-index",
      sources: [{ slug: AUTOS, keep: (t, name, num) => autoSlot(t) && (may.auto(name, num) || sept.auto(name, num)) }],
      subUniverse: { key: "BASE", name: "1st Bowman Chrome (base), all releases", blurb: "every 2026 1st Bowman Chrome base card, price-weighted, uncapped", sources: [{ slug: BASE, keep: (t, name, num) => baseSlot(t) && (may.base(name, num) || sept.base(name, num)) }] },
      note: "The year cohort: every 1st Bowman Chrome Auto issued across the 2026 Bowman releases — May's Bowman and September's Bowman Chrome now, Bowman Draft (Dec–Jan) when its console lists (it enters the first Monday after street, a logged divisor adjustment, level unchanged). BB26 and BCB26 are the same cards by release. Bowman is a spec market held for years; the cohort line is the position, the release line is the entry. BOW27 starts with May 2027." },
  };
}

const BASE_SCREEN = { enter: 6, stay: 4, window: 30 };
// per-ticker override (Sep 30 2026, Mo chose the 90-day window for the WOTC 1st Edition / Shadowless indices: raw 1st Ed holos sell 2–5×/month)
let SCREEN = BASE_SCREEN;
const CAP = 0.25;          // no single card above 25% …
const BIG = 0.05, BIG_SUM = 0.50;   // … and positions above 5% may not sum past 50% — the Select Sector SPDR "5/50" rule, adopted Sep 25 2026 (Mo) when the three Mew RGB secrets would otherwise have taken 75% of TH26

// titles that are not one ungraded single of this card (read in memory only — never stored)
const TITLE_BAD = /\b(lot|lots|bundle|x\s?\d+|\d+\s*(cards?|pcs?|pack)|set of|complete set|master set|playset|proxy|custom|sealed|booster|etb|elite trainer|box|tin|japanese|japan|korean|chinese|jpn|kor|psa|cgc|bgs|sgc|tag\s*\d|graded|slab|reverse holo|rev holo|cosmos|stamp)\b/i;

function cfg() { const c = CONFIG[TICKER]; if (!c) { console.error(`no config for ticker ${TICKER}`); process.exit(2); } return c; }
async function get(url) {
  for (let a = 1; a <= 3; a++) {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(5000 * a); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }
  throw new Error("gave up: " + url);
}

// ---------------- universe: one slot per card on the set's PriceCharting console ----------------
// slot rule (sv151-rebuild-spec): a slot is a title ending in "#<num>"; sealed products have no number; bracketed
// titles ([Reverse Holo], [Holo], [Cosmos Holo], retailer stamps) are variants of the bracketless slot and are
// dropped when a bracketless print exists. Two different cards may share a number in this set (the Classic
// Collection reprints keep their original numbers: Lugia #149 beside Pikachu ex #149), so the slot key is
// name + number, never the number alone.
const CONSOLE_CACHE = new Map();   // slug → rows, shared across tickers in one run (the Bowman trio reads the same two consoles)
async function consoleRows(slug) { if (!CONSOLE_CACHE.has(slug)) CONSOLE_CACHE.set(slug, await consoleCards(slug)); return CONSOLE_CACHE.get(slug); }
async function universe(c, spec) {
  // spec = the ticker config (main universe) or a subUniverse block; both carry sources[] (or a legacy pcSlug)
  const sources = spec.sources || [{ slug: spec.pcSlug, keep: null }];
  const slots = new Map();
  for (const src of sources) {
  const rows = await consoleRows(src.slug);
  for (const r of rows) {
    if (c.skipTitle && c.skipTitle.test(r.title)) continue;   // a sealed product wearing a card number (SV151 "Poster Collection #49")
    const m = r.title.match(/^(.*?)\s+#([A-Za-z0-9\/-]+)\s*$/) || r.title.match(/^(.*?)\s+([A-Z]\/RGB)\s*$/); if (!m) continue;   // sealed products carry no number; "B/RGB" is a number (Mo, Sep 25: the RGB Mews are set cards); "CPA-EH" is a number
    const name = m[1].replace(/\s*\[[^\]]*\]\s*/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim(), num = m[2];
    // variant rank: bracketless print wins; with none, the plain [Holo] print is the slot (SV151 spec: Machamp #68,
    // Marowak #105, Vaporeon #134, Mewtwo #150, Psychic Energy #207 exist only as holos); Reverse/Cosmos/stamps never win over it
    const rank = !/\[/.test(r.title) ? 0 : /\[holo\]/i.test(r.title) ? 1 : 2;
    const bracket = rank > 0;
    const key = (name + " #" + num).toLowerCase();
    if (src.keep && !src.keep(r.title, name, num)) continue;
    const cur = slots.get(key);
    if (!cur || rank < cur.rank) slots.set(key, { num, name, title: name + " #" + num, path: r.path, bracket, rank });
  }
  }
  const out = [...slots.values()].map(({ num, name, title, path: p }) => ({ num, name, title, path: p }));
  const numOf = (n) => parseInt(String(n).replace(/^[A-Z]+-/i, ""), 10) || 0;
  out.sort((a, b) => numOf(a.num) - numOf(b.num) || a.name.localeCompare(b.name));
  return out;
}

// ---------------- screen + mark from one item page read ----------------
const READ_CACHE = new Map();
// SIDX_CACHE=<file> (Sep 28 2026): persist item reads so an --init interrupted by a shell time limit resumes where it
// stopped. Same-day reads only (the file is keyed by TODAY); dates and prices only, never titles (R17).
const DISK = process.env.SIDX_CACHE || null;
if (DISK && fs.existsSync(DISK)) { try { const j = JSON.parse(fs.readFileSync(DISK, "utf8")); if (j.day === TODAY) for (const [k, v] of Object.entries(j.reads || {})) READ_CACHE.set(k, v); } catch (e) {} }
function saveDisk() { if (!DISK) return; fs.writeFileSync(DISK, JSON.stringify({ day: TODAY, reads: Object.fromEntries(READ_CACHE) })); }
async function readCard(slot) {
  if (READ_CACHE.has(slot.path)) { READ_CACHE_HIT = true; return READ_CACHE.get(slot.path); }
  READ_CACHE_HIT = false;
  const r = await readCardUncached(slot); READ_CACHE.set(slot.path, r); saveDisk(); return r;
}
async function readCardUncached(slot) {
  const html = await get("https://www.pricecharting.com/game/" + slot.path);
  const pg = parsePage(html, "Raw");
  if (pg.error) return { error: pg.error, clean30: 0, all30: 0, price: null };
  // re-walk the rows with titles, in memory, for the lot filter (parsePage keeps dates+prices only)
  const start = html.indexOf('<div class="completed-auctions-used"');
  const end = html.indexOf('<div class="completed-auctions-', start + 20);
  const body = html.slice(start, end > 0 ? end : start + 400000);
  const rows = [];
  for (const tr of body.split("<tr").slice(1)) {
    const d = tr.match(/<td class="date">\s*(\d{4}-\d{2}-\d{2})\s*<\/td>/);
    const p = tr.match(/<span class="js-price"[^>]*>\s*\$([\d,]+(?:\.\d+)?)/);
    const t = tr.match(/<td class="title">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
    if (d && p) rows.push({ d: d[1], p: parseFloat(p[1].replace(/,/g, "")), clean: !(t && TITLE_BAD.test(t[1].replace(/<[^>]+>/g, " "))) });
  }
  const in30 = rows.filter((r) => days(r.d) <= SCREEN.window), clean30 = in30.filter((r) => r.clean);
  return { all30: in30.length, clean30: clean30.length, tabCount: pg.tabCount, price: clean30.length ? r2(median(clean30.map((r) => r.p))) : null, lastSale: rows.length ? rows.map((r) => r.d).sort().slice(-1)[0] : null };
}

// ---------------- the 25% cap: weights w so no card exceeds CAP of Σ(price·w); level unchanged by construction ----------------
function applyCap(basket) {
  basket.forEach((b) => { b.w = 1; });
  for (let it = 0; it < 200; it++) {
    let changed = false;
    const T = basket.reduce((s, b) => s + b.price * b.w, 0);
    // leg 1: no single position above CAP of the total
    for (const b of basket) { const v = b.price * b.w; if (v / T > CAP + 1e-9) { b.w = r4((CAP * T) / b.price); changed = true; } }
    // leg 2: positions above BIG may not sum past BIG_SUM of the total (5/50)
    const T2 = basket.reduce((s, b) => s + b.price * b.w, 0);
    const big = basket.filter((b) => (b.price * b.w) / T2 > BIG + 1e-9);
    const bigSum = big.reduce((s, b) => s + b.price * b.w, 0);
    if (bigSum / T2 > BIG_SUM + 1e-9) { const f = (BIG_SUM * T2) / bigSum; for (const b of big) { b.w = r4(b.w * f); } changed = true; }
    if (!changed) break;
  }
  basket.forEach((b) => { if (b.w > 1) b.w = 1; });
  return basket;
}
const basketValue = (basket) => basket.reduce((s, b) => s + b.price * (b.w == null ? 1 : b.w), 0);
const levelOf = (x) => r2(basketValue(x.basket) / x.divisor);
// sub-index: a named subset of the basket, price-weighted, uncapped, base 100 at the same inception — a second line, never the level
function subValue(x, nums) { return x.basket.filter((b) => nums.includes(String(b.num))).reduce((s, b) => s + b.price, 0); }
// screened sub-index (Bowman, Sep 25 2026): its own universe and liquidity screen, price-weighted, uncapped, base 100
async function readUniverse(uni, label) {
  const reads = [];
  for (let i = 0; i < uni.length; i++) {
    const u = uni[i];
    try { const r = await readCard(u); reads.push({ ...u, ...r }); console.log(`${String(i + 1).padStart(3)}/${uni.length} ${label} ${u.title.padEnd(34)} clean30 ${String(r.clean30).padStart(2)} ${r.price == null ? "" : "$" + r.price}${r.error ? " " + r.error : ""}`); }
    catch (e) { reads.push({ ...u, error: e.message, clean30: 0, price: null }); console.log(`${u.title}: ${e.message}`); }
    if (!READ_CACHE_HIT) await sleep(PAUSE);
  }
  return reads;
}
let READ_CACHE_HIT = false;
const toRow = (r) => ({ num: r.num, name: r.name, path: r.path, price: r.price, n30: r.clean30, basis: `sold (PriceCharting ungraded, ${SCREEN.window}d median)`, asOf: TODAY, w: 1 });
async function subInit(x, c) {
  x.sub = {};
  for (const [k, d] of Object.entries(c.sub || {})) { const v = subValue(x, d.nums); if (!v) continue; x.sub[k] = { name: d.name, nums: d.nums, blurb: d.blurb, divisor: r4(v / 100), history: [{ date: x.inception, level: 100, basketValue: r2(v), note: "inception" }] }; }
  if (c.subUniverse) {
    const d = c.subUniverse;
    const uni = await universe(c, d);
    console.log(`sub ${d.key}: ${uni.length} slots`);
    const reads = await readUniverse(uni, d.key);
    const basket = reads.filter((r) => r.clean30 >= SCREEN.enter && r.price != null).map(toRow);
    const v = basket.reduce((a, b) => a + b.price, 0);
    x.sub[d.key] = { kind: "screened", name: d.name, blurb: d.blurb, universe: uni.map((u) => ({ num: u.num, name: u.name, path: u.path })), basket, divisor: r4(v / 100), history: [{ date: x.inception, level: 100, basketValue: r2(v), priced: basket.length, note: "inception" }] };
    console.log(`sub ${d.key}: basket ${basket.length}/${uni.length} · value $${r2(v)}`);
  }
}
async function subMark(x, date) {
  for (const [k, sx] of Object.entries(x.sub || {})) {
    if (sx.kind === "screened") {
      let carried = 0;
      for (const b of sx.basket) { try { const r = await readCard(b); b.prevPrice = b.price; b.prevAsOf = b.asOf; if (r.price != null) { b.price = r.price; b.asOf = date; b.n30 = r.clean30; b.carried = false; } else { b.carried = true; carried++; } } catch (e) { b.carried = true; carried++; } if (!READ_CACHE_HIT) await sleep(PAUSE); }
      const v = sx.basket.reduce((a, b) => a + b.price, 0);
      sx.history.push({ date, level: r2(v / sx.divisor), basketValue: r2(v), priced: sx.basket.length - carried, note: carried ? `${carried} carried` : "" });
      continue;
    }
    const v = subValue(x, sx.nums); if (!v) continue; sx.history.push({ date, level: r2(v / sx.divisor), basketValue: r2(v) });
  }
}

// ---------------- page block (the AH26 mast look, Mo Sep 25: "I prefer the AH26 look") ----------------
// photo key for js/card-img.js name mode: "<name> <num/denom> <imgSet>". The resolver requires every non-numeric token
// of the key in the eBay title, so the key carries only words a listing title actually has ("Pokemon", not "Pokémon TCG").
// (Sep 25 2026 image sweep: 5 of TH26's and 4 of SV151's top-10 photos sat on the placeholder for exactly this reason.)
function imgAttr(b, c) { const u = c.imgSrc && c.imgSrc(b); return u ? "src:" + u : "name:" + imgKey(b, c); }
function imgKey(b, c) { if (c.imgKey) return c.imgKey(b); if (c.imgNot) return imgKeyBase(b, c) + ' ' + c.imgNot; return imgKeyBase(b, c); }
function imgKeyBase(b, c) { const num = /^\d+$/.test(String(b.num)) && c.denom ? `${b.num}/${c.denom}` : String(b.num); return `${b.name} ${num} ${c.imgSet || c.set}`; }
function deskIds(x) {
  const m = {};
  try { const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data/auction-desk.json"), "utf8")); const fam = /^(BOW|BB|BCB|BD)\d/.test(x.ticker) ? /^(BOW|BB|BCB|BD)\d/ : null;   // the Bowman family shares one desk (a card is searched once)
    for (const c of d.cards || []) if ((c.index === x.ticker || (fam && fam.test(String(c.index)))) && c.num) m[(String(c.name || "") + "#" + String(c.num)).toLowerCase()] = c.id; } catch (e) {}
  // cards the price engine already tracks (data/watchlist.json) are searched by /api/auctions under their engine id —
  // reuse it rather than adding a desk entry that would search the same card twice (Bowman, Sep 25 2026)
  try {
    const w = JSON.parse(fs.readFileSync(path.join(ROOT, "data/watchlist.json"), "utf8"));
    for (const c of w.cards || w) {
      if (!c || !/-auto$|^(ethan-holliday|andrew-fischer|aiva-arquette|wehiwa-aloy|daniel-pierce|marek-houston|gage-jump|justin-gonzalez|edward-florentino|seong-jun-kim)$/.test(c.id) || c.cardType !== "chrome-auto") continue;
      const nm = String(c.label || "").split(" — ")[0].trim().toLowerCase();
      for (const b of x.basket) if (String(b.name).toLowerCase() === nm && /^CPA-/i.test(String(b.num)) && !m[(String(b.name) + "#" + String(b.num)).toLowerCase()]) m[(String(b.name) + "#" + String(b.num)).toLowerCase()] = c.id;
    }
  } catch (e) {}
  return m;
}
// WOTC print families (Sep 30 2026): 1st Edition, Shadowless and Unlimited are different collectibles — each index links its siblings
const FAMILIES = [["BS1E", "BSSL", "BS99"], ["JU1E", "JU99"], ["FO1E", "FO99"], ["TR1E", "TR00"], ["NG1E", "NG00"], ["ND1E", "ND02"]];
const PRINTS = Object.fromEntries(FAMILIES.flatMap((f) => f.map((t) => [t, f])));
const PRINT_LBL = { BS1E: "1st Edition", BSSL: "Shadowless", BS99: "Unlimited", JU1E: "1st Edition", JU99: "Unlimited", FO1E: "1st Edition", FO99: "Unlimited", TR1E: "1st Edition", TR00: "Unlimited", NG1E: "1st Edition", NG00: "Unlimited", ND1E: "1st Edition", ND02: "Unlimited" };
function block(x, c) {
  const h = x.history || [], last = h[h.length - 1] || null, prev = h.length > 1 ? h[h.length - 2] : null;
  const lvl = last ? last.level : null;
  const wow = prev && last ? (last.level / prev.level - 1) * 100 : null;
  const bv = basketValue(x.basket), rows = x.basket.slice().sort((a, b) => b.price * b.w - a.price * a.w);
  const wts = rows.map((b) => (b.price * b.w) / bv);
  const hhi = wts.reduce((s, w) => s + w * w, 0), eff = hhi ? 1 / hhi : 0;
  const top = wts[0] || 0, capped = rows.filter((b) => b.w < 1).length;
  const pct = (v, d) => v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(d == null ? 1 : d) + "%";
  const cls = (v) => v > 0 ? "up" : v < 0 ? "dn" : "flat";
  const money = (n, d) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  const desk = deskIds(x);
  const hero = rows[0];
  // Pokémon tickers get the grade-link group (Sep 30 2026, Mo): Raw baked + PSA 9 · PSA 10 · TAG built by js/grade-links.js
  // from data-q, one Buy-It-Now/Auctions switch per table, and the card name opens /card?id=… (the ladder page).
  const GL = (c.imgSub || "pokemon") === "pokemon" && !c.kindPlural, wotc = WOTC.has(x.ticker), ed = EDITION[x.ticker] || null;
  const row = (b, i) => {
    const w = (b.price * b.w) / bv;
    const cid = `${x.ticker.toLowerCase()}-${String(b.num).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const q0 = c.ebayQuery(b.name, b.num);
    const url = ebaySearchUrl({ q: GL ? q0 + " " + RAW_NOT + (wotc ? " -1st -shadowless" : ed === "shadowless" ? " -1st" : "") : q0, customid: cid, sacat: c.sacat || SACAT_TCG, av: b.price >= 200 });
    if (GL) {
      const thumbG = i < 10 ? `<span data-card-img="${esc(imgAttr(b, c))}" data-card-name="${esc(b.name)} #${esc(b.num)} ${esc(c.set)}" data-card-sub="${esc(c.imgSub || "pokemon")}" data-card-size="thumb" data-card-surface="${x.ticker.toLowerCase()}-list" data-card-link="off"></span>` : "";
      const dkG = (String(b.name) + "#" + String(b.num)).toLowerCase(); const slotG = desk[dkG] ? `<span class="sidx-auc-slot" data-auc-card="${esc(desk[dkG])}"></span>` : '<span class="sidx-auc-slot"></span>';
      return `<tr data-q="${esc(q0)}" data-cid="${cid}"${b.price >= 200 ? ' data-av="1"' : ""}><td class="rk">${i + 1}</td><td class="nm"><div class="nm-cell">${thumbG}<div><b><a class="cardlk" href="/card?id=${cardId(x.ticker, b.num)}" title="Raw vs PSA 9 vs PSA 10 vs TAG — the card's price ladder">${esc(b.name)}</a></b><small>#${esc(b.num)}${b.carried ? " · carried " + mdy(b.asOf) : ""}</small></div></div></td><td class="num">${money(b.price)}</td><td class="num">${(w * 100).toFixed(1)}%${b.w < 1 ? '<i title="capped — see the method note">*</i>' : ""}</td><td class="num dim">${b.n30}</td><td class="act g"><span class="act-w g"><button type="button" class="sch-track-card" data-name="${esc(b.name)} #${esc(b.num)} — ${esc(c.set)}" data-set="${esc(c.set)}" data-cat="${esc(c.cat || "pokemon")}" data-grade="Raw" data-price="${b.price}" title="Watch this card">★</button><span class="glk"><a class="ebay g-raw" data-g="raw" href="${url}" target="_blank" rel="sponsored nofollow noopener" title="Raw (ungraded) copies on eBay${b.price >= 200 ? " — Authenticity Guarantee filter on" : ""}">Raw</a></span>${slotG}</span></td></tr>`;
    }
    const thumb = i < 10 ? `<span data-card-img="${esc(imgAttr(b, c))}" data-card-name="${esc(b.name)} #${esc(b.num)} ${esc(c.set)}" data-card-sub="${esc(c.imgSub || "pokemon")}" data-card-size="thumb" data-card-surface="${x.ticker.toLowerCase()}-list" data-card-link="off"></span>` : "";
    const dk = (String(b.name) + "#" + String(b.num)).toLowerCase(); const slot = desk[dk] ? `<span class="sidx-auc-slot" data-auc-card="${esc(desk[dk])}"></span>` : "";
    return `<tr><td class="rk">${i + 1}</td><td class="nm"><div class="nm-cell">${thumb}<div><b>${esc(b.name)}</b><small>#${esc(b.num)}${b.carried ? " · carried " + mdy(b.asOf) : ""}</small></div></div></td><td class="num">${money(b.price)}</td><td class="num">${(w * 100).toFixed(1)}%${b.w < 1 ? '<i title="capped — see the method note">*</i>' : ""}</td><td class="num dim">${b.n30}</td><td class="act"><span class="act-w"><button type="button" class="sch-track-card" data-name="${esc(b.name)} #${esc(b.num)} — ${esc(c.set)}" data-set="${esc(c.set)}" data-cat="${esc(c.cat || "pokemon")}" data-grade="Raw" data-price="${b.price}" title="Watch this card">★</button><a class="ebay" href="${url}" target="_blank" rel="sponsored nofollow noopener">${b.price >= 200 ? "Authenticated" : "Listings"} →</a>${slot || '<span class="sidx-auc-slot"></span>'}</span></td></tr>`;
  };
  const top10 = rows.slice(0, 10).map(row).join(""), rest = rows.slice(10).map((b, i) => row(b, i + 10)).join("");
  // CHASE strip (Sep 26 2026, Mo: high-ticket cards in the first buy position — eBay pays ~3% of the sale, so the
  // $700 card is worth twenty ETB clicks). Top 3 constituents by their own dated sold mark, one tagged link each
  // (customid <tk>-<num>-chase). States the mark the table already publishes; not a call.
  const chaseTop = rows.filter((b) => typeof b.price === "number" && b.price >= 50).sort((a, b) => b.price - a.price).slice(0, 3);
  const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mdShort = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || "")); return m ? `${MONS[+m[2] - 1]} ${+m[3]}` : ""; };
  const chase = chaseTop.length < 2 ? "" : `<div class="chase" id="${x.ticker.toLowerCase()}-chase" data-chase="${x.ticker}">
    <div class="ck"><b>Chase</b> · top ${chaseTop.length} by sold mark · dated · the cards that carry this set</div>
    <div class="cg">${chaseTop.map((b, i) => {
      const cid = `${x.ticker.toLowerCase()}-${String(b.num).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-chase`;
      const url = ebaySearchUrl({ q: c.ebayQuery(b.name, b.num), customid: cid, sacat: c.sacat || SACAT_TCG, av: b.price >= 200 });
      return `<a class="cc" href="${url}" target="_blank" rel="noopener sponsored" title="${esc(b.name)} #${esc(b.num)} — live eBay listings" onclick="if(typeof gtag==='function')gtag('event','chase_click',{item:'${esc(cid)}',page:location.pathname})"><span class="ci" data-card-img="${esc(imgAttr(b, c))}" data-card-name="${esc(b.name)} #${esc(b.num)} ${esc(c.set)}" data-card-sub="${esc(c.imgSub || "pokemon")}" data-card-size="row" data-card-surface="${x.ticker.toLowerCase()}-chase" data-card-link="off"></span><span class="cn">${esc(b.name)} #${esc(b.num)}</span><span class="cp"><b>${b.price >= 100 ? "$" + Math.round(b.price).toLocaleString("en-US") : money(b.price)}</b><small>sold mark · ${mdShort(b.asOf || (last && last.date))}</small></span><span class="cgo">${b.price >= 200 ? "Authenticated on eBay" : "Listings on eBay"} &rarr;</span></a>`;
    }).join("")}</div>
    <div class="cf">Sold mark per card, from the table below: a median of recent dated sales (not one sale), dated to the read — not a call. Links open live eBay listings (affiliate; ShopCardHub earns a commission at no cost to you).</div>
  </div>`;
  const unpriced = x.universe.length - x.basket.length;
  // sub-index strips (one line each)
  const subs = Object.entries(x.sub || {}).map(([k, sx]) => {
    const sh = sx.history || [], sl = sh[sh.length - 1], sp = sh.length > 1 ? sh[sh.length - 2] : null;
    const sw = sp ? (sl.level / sp.level - 1) * 100 : null;
    const cards = sx.kind === "screened" ? sx.basket.slice().sort((a, b) => b.price - a.price) : x.basket.filter((b) => sx.nums.includes(String(b.num)));
    const shown = sx.kind === "screened" ? cards.slice(0, 3) : cards;
    return `<div class="sidx-subidx"><span class="sidx-subidx-k"><b>${x.ticker}·${esc(k)}</b> ${esc(sx.name)}</span><span class="sidx-subidx-lv">${sl ? sl.level.toFixed(2) : "—"}</span><span class="sidx-subidx-w ${cls(sw == null ? 0 : sw)}">${sw == null ? "first mark" : (sw >= 0 ? "▲ " : "▼ ") + pct(sw)}</span><span class="sidx-subidx-cards">${shown.map((b) => `<i>${esc(b.name)} #${esc(b.num)} <b>${money(b.price, 0)}</b></i>`).join("")}${sx.kind === "screened" && cards.length > 3 ? `<i>+${cards.length - 3} more</i>` : ""}</span>${sh.length > 1 ? `<span class="sidx-subidx-sp">${ST_spark(sh.map((r) => r.level))}</span>` : ""}<span class="sidx-subidx-n">${cards.length} cards${sx.kind === "screened" && sx.universe ? ` of ${sx.universe.length}` : ""} · price-weighted · uncapped · ${sx.baseDate ? `100 = ${baseMon(sx)} (release month)` : `base 100 at ${mdy(x.inception)}`} — ${esc(sx.blurb || "")}</span></div>`;
  }).join("");
  return `<div class="container"><section class="sidx" id="${x.ticker.toLowerCase()}" data-prices-updated="${last ? last.date : x.inception}"${c.classic ? " data-no-repoint" : ""}${GL ? " data-glk" : ""}${GL && wotc ? " data-wotc" : ""}${GL && ed ? ` data-wotc="${ed}"` : ""} style="--sidx:${c.theme};">
  <div class="sidx-mast">
    <div class="sidx-t">
      <div class="sidx-eyebrow">▮ ${c.kindPlural ? "Class Index · Sector Model · Every " + esc(c.kindPlural.replace(/s$/, "")) : "Set Index · Sector Model · Every Card In The Set"}</div>
      <h2><span class="sidx-tk">${x.ticker}</span> <span class="sidx-dot">·</span> ${esc(c.name)}</h2>
      <p class="sidx-sub">${c.kindPlural ? `Every ${esc(c.kindPlural.replace(/s$/, ""))} in ${esc(c.set)} — ${x.universe.length} cards, ${x.basket.length} trading — priced` : `All ${x.universe.length} cards of ${esc(c.set)}, priced`} from dated sold comps and re-marked Monday and Thursday. ${baseSentence(x)} This block tracks the ${c.kindPlural ? "class" : "set"}; it does not recommend cards. <a href="#${x.ticker.toLowerCase()}-method">Method ↓</a></p>
    </div>
    <figure class="sidx-photo"><span data-card-img="${esc(imgAttr(hero, c))}" data-card-name="${esc(hero.name)} #${esc(hero.num)} ${esc(c.set)}" data-card-sub="${esc(c.imgSub || "pokemon")}" data-card-size="hero" data-card-surface="${x.ticker.toLowerCase()}-hero"></span><figcaption>#1 constituent · <b>${esc(hero.name)} #${esc(hero.num)}</b> · ${c.imgSrc && c.imgSrc(hero) ? "card image" : "live eBay listing"}</figcaption></figure>
    <div class="sidx-level"><div class="lv">${lvl == null ? "—" : lvl.toFixed(2)}</div><div class="lvc">${baseLine(x)} · re-marked ${last ? mdy(last.date) : "—"}${wow == null ? "" : ` · <span class="${cls(wow)}">${wow >= 0 ? "▲" : "▼"} ${pct(wow)} w/w</span>`}</div></div>
  </div>
  <div class="idx-chart" data-ticker="${x.ticker}" aria-live="polite"></div>
  <div class="sidx-stats">
    <div><span class="k">Basket / Universe</span><span class="v">${x.basket.length} <i>/ ${x.universe.length}</i></span></div>
    <div><span class="k">Top card weight</span><span class="v">${(top * 100).toFixed(1)}%</span></div>
    <div><span class="k">Effective holdings</span><span class="v">${eff.toFixed(1)}</span></div>
    <div><span class="k">Basket value</span><span class="v">${money(bv, 0)}<i> Σpx·w</i></span></div>
    <div><span class="k">Capped</span><span class="v">${capped}</span></div>
    <div><span class="k">${sinceLbl(x)}</span><span class="v ${cls(lvl == null ? 0 : lvl - 100)}">${lvl == null ? "—" : pct(lvl - 100, 2)}</span></div>
    <div><span class="k">Divisor</span><span class="v">${x.divisor}</span></div>
    <div><span class="k">Re-mark</span><span class="v">MON · THU</span></div>
  </div>
  ${PRINTS[x.ticker] ? `<p class="sidx-sib">Same set, other prints — each its own index: ${PRINTS[x.ticker].filter((t) => t !== x.ticker && CONFIG[t]).map((t) => `<a href="${CONFIG[t].page}">${t} · ${esc(PRINT_LBL[t])}</a>`).join(" · ")}</p>` : ""}
  ${subs}
  ${chase}
  ${GL ? `<div class="glk-bar" role="group" aria-label="Which eBay listings the buttons open"><span class="glk-k">Buy buttons open</span><button type="button" data-mode="bin" aria-pressed="true">Buy It Now</button><button type="button" data-mode="auc" aria-pressed="false">Auctions · ending soon</button><span class="glk-n">Raw · PSA 9 · PSA 10 · TAG on every row · tap a card name for its raw-to-PSA&nbsp;10 price ladder</span></div>` : ""}
  ${rest ? `<div class="sidx-cap">Top 10 of ${rows.length} cards by weight · the full basket is one tap below the table</div>` : ""}
  <div class="sidx-tbl"><table>
    <thead><tr><th>#</th><th>Card</th><th>Sold mark</th><th>Weight</th><th title="clean sold comps in the trailing ${SCREEN.window} days — a gate input, not a volume figure">Sales ${SCREEN.window}D</th><th class="th-act${GL ? " g" : ""}">Watch · ${GL ? "Buy raw / graded" : "Buy"} · <span title="live eBay auction on this exact card, soonest close with bids; refreshed every 15 min">Bid</span></th></tr></thead>
    <tbody>${top10}</tbody>
  </table></div>
  ${rest ? `<details class="sidx-more"><summary><span class="sm-open">Show all ${rows.length} cards ▾</span><span class="sm-close">Hide cards 11–${rows.length} ▴</span></summary><div class="sidx-tbl"><table><tbody>${rest}</tbody></table></div></details>` : ""}
  <p class="sidx-note" id="${x.ticker.toLowerCase()}-method"><b>Method.</b> One set, one index. The universe is every card in the set; the basket is the cards that trade as ungraded singles — at least ${SCREEN.enter} clean single-card sold comps in the trailing ${SCREEN.window} days to enter, ${SCREEN.stay} to stay. Price-weighted on ${c.srcNote || "PriceCharting's dated ungraded sold list (blended eBay + TCGplayer)"}, never asks. Caps: no card above ${(CAP * 100).toFixed(0)}% and positions above ${(BIG * 100).toFixed(0)}% never past ${(BIG_SUM * 100).toFixed(0)}% together (the Select Sector SPDR 5/50 rule) — a weight marked * is capped, and every cap is a weight in the divisor math, so applying one never moves the level. Level = Σ(sold mark × weight) ÷ divisor ${x.divisor}; entries, exits and cap changes are logged divisor adjustments; reconstitution quarterly (first Monday of Jan/Apr/Jul/Oct, announced the Monday before). ${unpriced} of ${x.universe.length} cards are in the universe but not the basket. n30 is a liquidity gate, never a volume figure (the source caps its table at ${c.rowCap || 60} rows${c.rowCapNote || ""}). ${esc(c.note)} Bid buttons are live eBay auctions on the exact card (verified title, soonest close with bids first, refreshed every 15 minutes) — bids, not marks. An index is a measurement, not a call. <a href="/how-prices-work">How prices work</a> · <a href="/indices">every ticker</a>.</p>
</section></div>`;
}
function ST_spark(ys, w, h) {
  w = w || 72; h = h || 22; var s = ys.filter((v) => v != null && isFinite(v)); if (s.length < 2) return "";
  var lo = Math.min(...s), hi = Math.max(...s), r = hi - lo || 1;
  var pts = s.map((v, i) => [(i / (s.length - 1)) * (w - 2) + 1, h - 2 - ((v - lo) / r) * (h - 4)]);
  var d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return `<svg class="spark ${s[s.length - 1] >= s[0] ? "up" : "dn"}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
}
const CSS = `<style id="sidx-css">
.sidx{margin:26px 0 0;padding:0 0 8px;font-family:var(--fb,Barlow,system-ui,sans-serif);color:var(--text,#b8cdd4);--sidx-th:var(--text-head,#e4f0f4);--sidx-dim:var(--text-dim,#7a969e);--sidx-bd:var(--border,rgba(255,255,255,.08));--sidx-bg:var(--bg2,#0c1017);--sidx-bg2:var(--bg3,#111820)}
.sidx-mast{display:grid;grid-template-columns:minmax(0,1fr) auto 220px;column-gap:40px;align-items:end;padding-bottom:12px}
.sidx-eyebrow{font-family:var(--fm,ui-monospace,monospace);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--sidx);margin-bottom:8px}
.sidx h2{font-family:var(--fd,'Barlow Condensed',sans-serif);font-size:clamp(26px,3.4vw,38px);font-weight:900;text-transform:uppercase;color:var(--sidx-th);margin:0 0 8px;line-height:1.02;letter-spacing:-.3px}
.sidx-tk{color:var(--sidx-th)} .sidx-dot{color:var(--sidx)}
.sidx-sub{font-size:13px;line-height:1.55;margin:0;color:var(--sidx-dim);max-width:620px}
.sidx-sub a{color:var(--sidx)}
.sidx-photo{margin:0;justify-self:center;text-align:center}
.sidx-photo .sch-cimg{width:150px!important;height:210px!important}
/* Night Crew Oct 1 (B20): the photo slot holds its final size before js/card-img.js fills it, so the mast does not jump */
.sidx-photo>[data-card-img]{display:block;width:150px;height:210px;margin:0 auto}
.sidx-photo figcaption{font-family:var(--fm,ui-monospace,monospace);font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--sidx-dim);margin-top:10px;max-width:170px;margin-left:auto;margin-right:auto;line-height:1.5}
.sidx-photo figcaption b{color:var(--sidx)}
.sidx-level{text-align:right}
.sidx-level .lv{font-family:var(--fm,ui-monospace,monospace);font-size:44px;font-weight:700;line-height:1;color:var(--sidx-th)}
.sidx-level .lvc{font-family:var(--fm,ui-monospace,monospace);font-size:10px;color:var(--sidx-dim);margin-top:8px;line-height:1.6}
.sidx .up{color:var(--green,#00e07a)} .sidx .dn{color:var(--red,#ff2e55)} .sidx .flat{color:var(--sidx-dim)}
.sidx .idx-chart{margin-top:10px}
.sidx-stats{display:grid;grid-template-columns:repeat(8,1fr);gap:0;margin:12px 0 0;border:1px solid var(--sidx-bd);background:var(--sidx-bg)}
.sidx-stats>div{padding:12px 12px;border-right:1px solid var(--sidx-bd)} .sidx-stats>div:last-child{border-right:0}
.sidx-stats .k{display:block;font-family:var(--fm,ui-monospace,monospace);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--sidx-dim);line-height:1.4}
.sidx-stats .v{display:block;font-family:var(--fm,ui-monospace,monospace);font-size:17px;font-weight:700;color:var(--sidx-th);margin-top:6px;line-height:1.1}
.sidx-stats .v i{font-style:normal;font-size:10px;color:var(--sidx-dim)}
.sidx .chase{margin:10px 0 0;padding:12px 14px 10px;border:1px solid var(--sidx-bd);border-left:3px solid var(--sidx);background:var(--sidx-bg);border-radius:3px}
.sidx .chase .ck{font-family:var(--fm,ui-monospace,monospace);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-dim,#7a969e);margin-bottom:10px}
.sidx .chase .ck b{color:var(--sidx);font-weight:700}
.sidx .chase .cg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.sidx .chase a.cc{display:grid;grid-template-columns:44px minmax(0,1fr);grid-template-rows:auto auto auto;column-gap:10px;row-gap:2px;align-items:center;padding:9px 10px;border:1px solid var(--sidx-bd);border-radius:3px;background:rgba(255,255,255,.02);text-decoration:none;color:var(--text,#b8cdd4);min-height:64px;transition:border-color .15s,background .15s}
.sidx .chase a.cc:hover{border-color:var(--sidx);background:rgba(255,255,255,.05)}
.sidx .chase .ci{grid-row:1/4;width:44px;height:62px;display:block;overflow:hidden;border-radius:2px;background:rgba(255,255,255,.04)}
.sidx .chase .ci img{width:44px;height:62px;object-fit:cover;display:block}
.sidx .chase .cn{font-family:var(--fd,sans-serif);font-size:13px;line-height:1.15;color:var(--text-head,#e4f0f4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sidx .chase .cp{font-family:var(--fm,ui-monospace,monospace);font-size:12px;color:var(--text-head,#e4f0f4)}
.sidx .chase .cp b{font-family:var(--fd,sans-serif);font-size:16px;color:var(--sidx);font-weight:700;margin-right:6px}
.sidx .chase .cp small{font-size:9.5px;color:var(--text-dim,#7a969e)}
.sidx .chase .cgo{font-family:var(--fm,ui-monospace,monospace);font-size:9.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#000;background:var(--gold,#f5c800);padding:5px 9px;border-radius:2px;justify-self:start;white-space:nowrap}
.sidx .chase .cf{font-family:var(--fm,ui-monospace,monospace);font-size:9.5px;color:var(--text-dim,#7a969e);margin-top:8px;line-height:1.5}
@media(max-width:760px){.sidx .chase .cg{grid-template-columns:1fr;gap:7px}.sidx .chase a.cc{min-height:0}}
.sidx-subidx{display:flex;align-items:center;gap:8px 16px;flex-wrap:wrap;margin:10px 0 0;padding:10px 14px;border:1px solid var(--sidx-bd);border-left:3px solid var(--sidx);background:var(--sidx-bg);font-family:var(--fm,ui-monospace,monospace);font-size:11.5px;color:var(--text,#b8cdd4)}
.sidx-subidx-k{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--sidx-dim)} .sidx-subidx-k b{color:var(--sidx);letter-spacing:2px}
.sidx-subidx-lv{font-size:20px;font-weight:700;color:var(--sidx-th)}
.sidx-subidx-cards{display:flex;gap:6px;flex-wrap:wrap} .sidx-subidx-cards i{font-style:normal;background:var(--sidx-bg2);border:1px solid var(--sidx-bd);border-radius:2px;padding:3px 8px;color:var(--sidx-dim)} .sidx-subidx-cards i b{color:var(--sidx-th);margin-left:4px}
.sidx-subidx-sp .spark{width:72px;height:22px;display:block} .sidx-subidx-sp .up{color:var(--green,#00e07a)} .sidx-subidx-sp .dn{color:var(--red,#ff2e55)}
.sidx-subidx-n{flex:1 1 100%;font-size:10px;color:var(--sidx-dim);line-height:1.5}
.sidx-tbl{overflow-x:auto;margin-top:14px;border:1px solid var(--sidx-bd);background:var(--sidx-bg)}
.sidx-tbl table{width:100%;border-collapse:collapse;font-family:var(--fm,ui-monospace,monospace);font-size:12.5px}
.sidx-tbl th{font-family:var(--fm,ui-monospace,monospace);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--sidx-dim);text-align:right;padding:10px 12px;border-bottom:1px solid var(--sidx-bd);white-space:nowrap;font-weight:400}
.sidx-tbl th:nth-child(2),.sidx-tbl td.nm{text-align:left}
.sidx-tbl td{padding:9px 12px;border-bottom:1px solid var(--sidx-bd);text-align:right;white-space:nowrap;vertical-align:middle}
.sidx-tbl tr:last-child td{border-bottom:0}
.sidx-tbl td.rk{color:var(--sidx);font-weight:700;width:28px;text-align:left}
.sidx-tbl td.nm b{font-family:var(--fb,Barlow,sans-serif);font-weight:700;color:var(--sidx-th);font-size:13px}
.sidx-tbl td.nm small{display:block;font-size:10.5px;color:var(--sidx-dim)}
.sidx-tbl td.dim{color:var(--sidx-dim)}
.sidx-tbl td i{color:var(--sidx);font-style:normal}
.nm-cell{display:flex;align-items:center;gap:10px}.nm-cell [data-card-img]{flex:0 0 auto}
.sidx-tbl td.act{white-space:nowrap}
.sidx-tbl td.act .act-w{display:inline-grid;grid-template-columns:34px 132px 200px;gap:6px;align-items:center;justify-items:stretch;text-align:center}
.sidx-tbl td.act .act-w>*{margin:0}
.sidx-tbl td.act.g,.sidx-tbl th.th-act.g{text-align:center}
.sidx-tbl td.act .act-w.g{display:inline-flex;align-items:center;justify-content:center;gap:10px}
.sidx-tbl td.act .act-w.g .sidx-auc-slot:empty{display:none}
@media(min-width:761px){.sidx-tbl td.act .act-w.g .sidx-auc-slot{flex:0 0 auto;min-width:176px}.sidx-tbl td.act .act-w.g .sidx-auc-slot a.auc{overflow:visible;text-overflow:clip}}
.sidx-tbl td.act .act-w.g .sch-track-card{display:inline-flex;align-items:center;justify-content:center;height:34px;width:34px;padding:0;font-size:13px;line-height:1}
.sidx-tbl td.nm a.cardlk{color:inherit;text-decoration:none;border-bottom:1px dotted var(--sidx)}.sidx-tbl td.nm a.cardlk:hover{color:var(--sidx)}
/* the four grade links read as ONE segmented control (Mo, Sep 30: "not slammed on the left … not like it's a bug") */
.glk{display:inline-flex;flex-wrap:wrap;align-items:stretch;max-width:100%}
.sidx-tbl td.act .glk a.ebay{display:inline-flex;align-items:center;justify-content:center;min-width:58px;height:34px;box-sizing:border-box;padding:0 12px;margin:0 0 0 -1px;border:1px solid rgba(255,255,255,.18);border-radius:0;background:rgba(255,255,255,.02);color:var(--sidx-th);font-size:11px;letter-spacing:1px;position:relative}
.sidx-tbl td.act .glk a.ebay:first-of-type{margin-left:0;border-radius:3px 0 0 3px;background:var(--sidx);border-color:var(--sidx);color:#000}
.sidx-tbl td.act .glk a.ebay:last-of-type{border-radius:0 3px 3px 0}
.sidx-tbl td.act .glk a.ebay:hover{background:rgba(255,255,255,.1);border-color:var(--sidx);z-index:1}
.sidx-tbl td.act .glk a.ebay:first-of-type:hover{filter:brightness(1.1);background:var(--sidx)}
.glk-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:14px 0 0;font-family:var(--fm,ui-monospace,monospace);font-size:10px;color:var(--sidx-dim)}
.glk-bar .glk-k{letter-spacing:1.5px;text-transform:uppercase}
.glk-bar button{font-family:var(--fd,'Barlow Condensed',sans-serif);font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;min-height:36px;padding:6px 14px;border:1px solid var(--sidx);background:transparent;color:var(--sidx-th);border-radius:2px;cursor:pointer}
.glk-bar button[aria-pressed="true"]{background:var(--sidx);color:#000}
.glk-bar .glk-n{flex:1 1 260px;line-height:1.5}
.sidx.glk-auc .glk a.ebay::after{content:" ⏱";font-size:9px}
.sidx-tbl td.act .sch-track-card{background:transparent;border:1px solid var(--border2,rgba(255,255,255,.14));color:var(--sidx-th);border-radius:2px;padding:5px 9px;cursor:pointer;font-size:12px;vertical-align:middle}
.sidx-tbl td.act a.ebay{display:inline-block;vertical-align:middle;text-align:center;font-family:var(--fd,'Barlow Condensed',sans-serif);font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#000;background:var(--sidx);padding:6px 11px;border-radius:2px;text-decoration:none}
.sidx-tbl td.act a.ebay:hover{filter:brightness(1.1)}
.sidx-auc-slot{display:inline-block;vertical-align:middle;min-height:1px}
.sidx-auc-slot a.auc{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--fd,'Barlow Condensed',sans-serif);font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--sidx-th);background:var(--sidx-bg2);border:1px solid var(--sidx);padding:5px 10px;border-radius:2px;text-decoration:none}
.sidx-auc-slot a.auc small{font-family:var(--fm,ui-monospace,monospace);font-weight:400;letter-spacing:0;text-transform:none;color:var(--sidx-dim);margin-left:6px;font-size:10.5px}
.sidx-auc-slot a.auc:hover{background:var(--sidx);color:#000} .sidx-auc-slot a.auc:hover small{color:#000}
.sidx-more{margin-top:8px}
.sidx-more>summary{cursor:pointer;list-style:none;display:inline-flex;align-items:center;min-height:40px;font-family:var(--fd,'Barlow Condensed',sans-serif);font-weight:700;font-size:14px;letter-spacing:1.2px;text-transform:uppercase;color:var(--sidx);border:1px solid var(--sidx);border-radius:2px;padding:8px 18px;margin:6px 0 4px}
.sidx-more>summary::-webkit-details-marker{display:none}
.sidx-more>summary:hover{background:var(--sidx);color:#000}
.sidx-more .sm-close{display:none}.sidx-more[open] .sm-open{display:none}.sidx-more[open] .sm-close{display:inline}
.sidx-sib{margin:10px 0 0;font-family:var(--fm,ui-monospace,monospace);font-size:11px;color:var(--sidx-dim)}.sidx-sib a{color:var(--sidx);font-weight:700;text-decoration:none;border-bottom:1px solid var(--sidx);margin:0 2px}
.sidx-cap{font-family:var(--fm,ui-monospace,monospace);font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:var(--sidx-dim);margin:14px 0 6px}
.sidx-more .sidx-tbl{margin-top:0}
.sidx-note{font-size:11px;line-height:1.65;color:var(--sidx-dim);margin:14px 0 0}
.sidx-note b{color:var(--text,#b8cdd4)} .sidx-note a{color:var(--sidx)}
@media(max-width:900px){.sidx-stats{grid-template-columns:repeat(4,1fr)}.sidx-stats>div:nth-child(4){border-right:0}.sidx-stats>div:nth-child(-n+4){border-bottom:1px solid var(--sidx-bd)}}
@media(max-width:760px){.sidx-mast{display:block;position:relative;padding-right:104px}.sidx-photo{position:absolute;right:0;top:0;width:96px}.sidx-photo .sch-cimg{width:90px!important;height:126px!important}.sidx-photo>[data-card-img]{width:90px;height:126px}.sidx-photo figcaption{display:none}.sidx-level{text-align:left;margin-top:12px}.sidx-level .lv{font-size:36px}.sidx-tbl th:nth-child(5),.sidx-tbl td:nth-child(5){display:none}.sidx-tbl td.act .act-w{grid-template-columns:32px 96px 92px}.sidx-tbl td.act a.ebay,.sidx-auc-slot a.auc{padding:5px 6px;font-size:10px;letter-spacing:.5px}.sidx-auc-slot a.auc small{display:none}}
@media(max-width:760px){body .sidx-tbl td.act.g{text-align:center}body .sidx-tbl td.act .act-w.g{display:inline-flex;width:auto;justify-content:center}body .sidx-tbl td.act .glk a.ebay{flex:0 0 auto;min-width:0;height:36px;padding:0 10px;font-size:10.5px;letter-spacing:.5px}.glk-bar .glk-n{display:none}}
</style>`;

function bake(x, c) {
  const file = path.join(ROOT, c.page.slice(1) + ".html");
  let html = fs.readFileSync(file, "utf8");
  const S = `<!-- ${x.ticker}:START -->`, E = `<!-- ${x.ticker}:END -->`;
  const body = `${S}\n${CSS}\n${block(x, c)}\n${E}`;
  if (html.includes(S)) {
    const re = new RegExp(`<!-- ${x.ticker}:START -->[\\s\\S]*?<!-- ${x.ticker}:END -->`);
    html = html.replace(re, () => body);
  } else {
    const anchor = "<!-- BUYBOX:END -->";
    if (!html.includes(anchor)) throw new Error(`${c.page}: no ${anchor} anchor to place the index block after`);
    html = html.replace(anchor, anchor + "\n" + body);
  }
  if (!html.includes('src="/js/index-chart.js')) html = html.replace("</body>", '<script src="/js/index-chart.js?v=3" defer></script>\n</body>');
  if (!html.includes('src="/js/card-img.js')) html = html.replace("</body>", '<script src="/js/card-img.js?v=3" defer></script>\n</body>');
  if (!html.includes('src="/js/index-you.js')) html = html.replace("</body>", '<script src="/js/index-you.js?v=1" defer></script>\n</body>');
  if (!html.includes('src="/js/sector-auctions.js')) html = html.replace("</body>", '<script src="/js/sector-auctions.js?v=3" defer></script>\n</body>');
  if ((c.imgSub || "pokemon") === "pokemon" && !c.kindPlural) {
    if (!html.includes('src="/js/grade-links.js')) html = html.replace("</body>", '<script src="/js/grade-links.js?v=1" defer></script>\n</body>');
    const bv = x.basket.reduce((a, b) => a + b.price * b.w, 0);
    writeCardFile(ROOT, x, c, x.basket.slice().sort((a, b) => b.price * b.w - a.price * a.w), imgAttr, DRY);
  }
  if (!DRY) fs.writeFileSync(file, html);
  console.log(`${DRY ? "would bake" : "baked"} ${c.page} block: ${x.basket.length} rows`);
}

// ---------------- main (one or more tickers: --ticker BOW26,BB26,BCB26 share every page read) ----------------
const idxPath = path.join(ROOT, "data/indices.json");
const IDX = JSON.parse(fs.readFileSync(idxPath, "utf8"));
const save = () => { if (DRY) { console.log("--dry: indices.json not written"); return; } IDX.updated = TODAY; fs.writeFileSync(idxPath, JSON.stringify(IDX, null, 1) + "\n"); console.log("wrote data/indices.json"); };
for (const T of String(TICKER || "").split(",").map((t) => t.trim()).filter(Boolean)) { TICKER = T; await runTicker(); }
async function runTicker() {
const c = cfg();
SCREEN = { ...BASE_SCREEN, ...(c.screen || {}) };
if (has("--init")) {
  if (IDX[TICKER] && IDX[TICKER].status === "live" && !has("--force")) { console.error(`${TICKER} is already live — use --mark / --recon (or --force to rebuild, which is a NEW inception)`); process.exit(2); }
  console.log(`universe: reading console(s) ${(c.sources || [{ slug: c.pcSlug }]).map((q) => q.slug).join(", ")} …`);
  const uni = await universe(c, c);
  console.log(`universe: ${uni.length} slots`);
  const reads = await readUniverse(uni, TICKER);
  const basket = reads.filter((r) => r.clean30 >= SCREEN.enter && r.price != null).map(toRow);
  applyCap(basket);
  const bv = basketValue(basket), divisor = r4(bv / 100);
  IDX[TICKER] = {
    ticker: TICKER, name: c.name, set: c.set, page: c.page, model: "sector", status: "live", basis: "sold", basisLabel: "sold comps (PriceCharting ungraded) · sector model · twice-weekly re-mark",
    screen: { ...SCREEN, source: "PriceCharting ungraded completed sales, clean single-card rows" }, cap: CAP, capRule: { single: CAP, big: BIG, bigSum: BIG_SUM, name: "25% single-card cap + 5/50 group cap (Select Sector SPDR rule)" }, base: 100, inception: TODAY, releaseDate: c.releaseDate,
    universeComplete: true, pcSlug: c.pcSlug || null, sources: (c.sources || []).map((q) => q.slug), divisor,
    divisorLog: [{ date: TODAY, before: null, after: divisor, why: `inception — basket $${r2(bv)} over ${basket.length} of ${uni.length} slots; ${basket.filter((b) => b.w < 1).length} capped (25% single / 5-50 group)` }],
    capLog: basket.filter((b) => b.w < 1).map((b) => ({ date: TODAY, num: b.num, name: b.name, w: b.w })),
    screenLog: [{ date: TODAY, pass: basket.length, fail: uni.length - basket.length, errors: reads.filter((r) => r.error).length }],
    universe: uni.map((u) => ({ num: u.num, name: u.name, path: u.path })),
    basket,
    history: [{ date: TODAY, level: 100, basketValue: r2(bv), divisor, priced: basket.length, note: "inception" }],
    reconstitution: { cadence: "quarterly, first Monday of Jan/Apr/Jul/Oct, announced the Monday before", next: "2027-01-04" },
  };
  await subInit(IDX[TICKER], c);
  console.log(`${TICKER}: basket ${basket.length}/${uni.length} · value $${r2(bv)} · divisor ${divisor} · capped ${basket.filter((b) => b.w < 1).length} · top ${basket.slice().sort((a, b) => b.price * b.w - a.price * a.w).slice(0, 3).map((b) => `${b.name} #${b.num} ${(b.price * b.w / bv * 100).toFixed(1)}%`).join(" · ")}`);
  save(); bake(IDX[TICKER], c);
} else if (has("--mark")) {
  const x = IDX[TICKER]; if (!x || x.status !== "live") { console.error(`${TICKER} is not live`); process.exit(2); }
  if (has("--if-mark-day")) { const dow = new Date(TODAY + "T12:00:00Z").getUTCDay(); if (dow !== 1 && dow !== 4) { console.log(`${TODAY} is not a mark day (Mon/Thu) — no-op`); return; } }
  if (x.history.some((h) => h.date === TODAY)) { console.log(`${TICKER} already marked ${TODAY} — no-op`); return; }
  let carried = 0;
  for (const b of x.basket) {
    try {
      const r = await readCard(b);
      b.prevPrice = b.price; b.prevAsOf = b.asOf;
      if (r.price != null) { b.price = r.price; b.asOf = TODAY; b.n30 = r.clean30; b.carried = false; }
      else { b.carried = true; carried++; b.n30 = r.clean30; }     // tail rule: no clean sale in the window → carry the last mark, dated
    } catch (e) { b.carried = true; carried++; console.log(`${b.name} #${b.num}: ${e.message} — carried`); }
    if (!READ_CACHE_HIT) await sleep(PAUSE);
  }
  const level = levelOf(x);
  x.history.push({ date: TODAY, level, basketValue: r2(basketValue(x.basket)), divisor: x.divisor, priced: x.basket.length - carried, note: carried ? `${carried} carried` : "" });
  await subMark(x, TODAY);
  console.log(`${TICKER} ${TODAY}: level ${level} (prev ${x.history[x.history.length - 2].level}) · ${carried} carried`);
  save(); bake(x, c);
} else if (has("--recon")) {
  const x = IDX[TICKER]; if (!x || x.status !== "live") { console.error(`${TICKER} is not live`); process.exit(2); }
  const before = levelOf(x), inBasket = new Map(x.basket.map((b) => [b.path, b]));
  const next = [];
  for (const u of x.universe) {
    const cur = inBasket.get(u.path);
    try {
      const r = await readCard(u);
      const keep = cur ? r.clean30 >= SCREEN.stay : r.clean30 >= SCREEN.enter;
      if (keep && r.price != null) next.push({ num: u.num, name: u.name, path: u.path, price: r.price, n30: r.clean30, basis: "sold (PriceCharting ungraded, 30d median)", asOf: TODAY, w: 1, prevPrice: cur ? cur.price : null, prevAsOf: cur ? cur.asOf : null });
      else if (keep && cur) next.push({ ...cur, n30: r.clean30, carried: true });
    } catch (e) { if (cur) next.push({ ...cur, carried: true }); console.log(`${u.name} #${u.num}: ${e.message}`); }
    await sleep(PAUSE);
  }
  applyCap(next);
  const bvNew = basketValue(next), divisor = r4(bvNew / before);          // level identical before and after
  const entered = next.filter((b) => !inBasket.has(b.path)).length, exited = x.basket.filter((b) => !next.some((n) => n.path === b.path)).length;
  x.divisorLog.push({ date: TODAY, before: x.divisor, after: divisor, why: `reconstitution — ${entered} entered, ${exited} exited, ${next.filter((b) => b.w < 1).length} at the cap; level ${before} unchanged` });
  x.capLog.push(...next.filter((b) => b.w < 1).map((b) => ({ date: TODAY, num: b.num, name: b.name, w: b.w })));
  x.screenLog.push({ date: TODAY, pass: next.length, fail: x.universe.length - next.length, entered, exited });
  x.basket = next; x.divisor = divisor;
  x.history.push({ date: TODAY, level: before, basketValue: r2(bvNew), divisor, priced: next.length, note: `reconstitution (+${entered}/−${exited})` });
  await subMark(x, TODAY);
  console.log(`${TICKER} reconstitution ${TODAY}: ${next.length} in basket (+${entered}/−${exited}) · divisor ${x.divisor} · level ${before} unchanged`);
  save(); bake(x, c);
} else if (has("--bake")) {
  const x = IDX[TICKER]; if (!x) { console.error(`${TICKER} not in indices.json`); process.exit(2); }
  bake(x, c);
} else { console.error("one of --init | --mark | --recon | --bake"); process.exit(2); }
}
