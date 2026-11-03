#!/usr/bin/env node
// tcg-pull.mjs — the "shop price" feed (Oct 15 2026, Mo's ruling: keep eBay sold as the index basis, SHOW the TCGplayer
// market price and the spread beside every card so collectors pick the venue themselves).
//
// Source: TCGplayer's market price via the TCGCSV daily mirror of TCGplayer's price API (https://tcgcsv.com, ~24h lag).
//   groups   https://tcgcsv.com/tcgplayer/3/groups                (3 = Pokémon)
//   products https://tcgcsv.com/tcgplayer/3/<groupId>/products    (extendedData[].Number is the printed card number)
//   prices   https://tcgcsv.com/tcgplayer/3/<groupId>/prices      (marketPrice / lowPrice per productId + subTypeName)
// Pulled once a day inside the nightly price-snapshot Action; identifiable User-Agent, 250 ms between requests, no listing crawl.
//
// Output: data/tcg-marks.json keyed by card id (the same <tk>-<key> id as data/cards/<tk>.json rows, data-cid on index rows
// and /card?id=). Per card: m = TCGplayer market price, lo = TCGplayer lowest listing, s = our sold mark at pull time,
// d = m/s − 1 (the spread), sub = the TCGplayer printing matched, pid = TCGplayer product id (link target).
// Per ticker: basket at shop price vs basket at sold marks, over the matched, weighted cards only (apples to apples).
//
// HARD LINES. The shop price is NEVER written into indices.json, a level, a mark or a % move (basis stays sold comps, R20
// untouched — this is a sold-basis venue price, not an eBay ask, and it stays a labelled second number). Unmatched cards get
// no entry: the page shows nothing for them, never a placeholder (R35).
// A match needs the printed number AND at least one distinctive word of our card's name in the TCGplayer product name (Nov 3:
// a lone product on the number is no longer taken on the number alone). A market the card can't be bought at — below every
// listing (staleDropped) or far above both the cheapest listing and our sold mark (highDropped) — gets no entry either.
//
// Usage: node tools/tcg-pull.mjs [--out data/tcg-marks.json] [--tickers SV151,AH26] [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const DRY = args.includes("--dry");
const OUT = path.join(ROOT, arg("--out", "data/tcg-marks.json"));
const ONLY = arg("--tickers", "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
const UA = "shopcardhub.com shop-price feed (tools/tcg-pull.mjs; shopcardhub@gmail.com)";
const BASE = "https://tcgcsv.com/tcgplayer/3";

// Pokémon index ticker → TCGplayer group(s) + which printing the index tracks.
//   ed: "1st" = 1st Edition printing, "unl" = Unlimited printing (WotC groups carry both), null = modern (Normal/Holofoil).
// BS1E has no TCGplayer group of its own (Base Set 604 lists Unlimited only) → no shop price on that page, by design.
export const TICKERS = {
  SV151: { groups: [23237] }, SSP24: { groups: [23651] }, MEG25: { groups: [24380] }, EVS21: { groups: [2848] },
  CEL21: { groups: [2867, 2931, 2545] }, CZ23: { groups: [17688, 17689] }, HF19: { groups: [2480, 2594] }, TU19: { groups: [2377] },
  AQ03: { groups: [1397] }, SK03: { groups: [1372] },
  BS99: { groups: [604], ed: "unl" }, BSSL: { groups: [1663], ed: "unl" },
  JU99: { groups: [635], ed: "unl" }, JU1E: { groups: [635], ed: "1st" },
  FO99: { groups: [630], ed: "unl" }, FO1E: { groups: [630], ed: "1st" },
  TR00: { groups: [1373], ed: "unl" }, TR1E: { groups: [1373], ed: "1st" },
  NG00: { groups: [1396], ed: "unl" }, NG1E: { groups: [1396], ed: "1st" },
  NDC01: { groups: [1434], ed: "unl" }, NDC1E: { groups: [1434], ed: "1st" },
  NR01: { groups: [1389], ed: "unl" }, NR1E: { groups: [1389], ed: "1st" },
  ND02: { groups: [1444], ed: "unl" }, ND1E: { groups: [1444], ed: "1st" },
  TH26: { groups: [24722, 24837] }, PB26: { groups: [24688] }, CR26: { groups: [24655] }, AH26: { groups: [24541] },
  PRIS25: { groups: [23821] }, DR25: { groups: [24269] }, PF25: { groups: [24448] },
};

// Nov 3 2026 (Mo: Aquapolis Blissey H6 showed "shop $90.61, −28%, cheaper at the shop" while the cheapest TCGplayer listing
// was $425 — GAPS P16(b), owed since Oct 21). A TCGplayer market price that sits far below every live listing is a stale
// trailing average (one old, often damaged sale), not a price anyone can pay: no entry for that card (R35, no placeholder).
const STALE_X = 1.25;          // lowest listing > 1.25 × market → the market price is not buyable → no shop price
// Nov 3 2026 (price-truth sweep: Team Up #170 Latias & Latios GX alt art printed "shop $4,619.79" while the cheapest TCGplayer
// listing was $2,399.99 and our eBay sold mark $2,299.01). The high side of the same problem: a market far ABOVE what the card
// sells for today. m/lo alone can't tell it apart — on modern bulk the lowest listing is a $0.01 played copy (m/lo > 2 on 1,112
// of 2,020 modern cards), and among cards ≥ $20 a 2× cut misses #170 (1.92×) while catching a $20 card whose market equals our
// mark. So two independent prices must agree the market is high: market > HIGH_X × the lowest listing AND > HIGH_X × our eBay
// sold mark (or no mark), on a market of at least HIGH_MIN. 1.75 sits in the gap of the Nov 3 distribution (next card 1.51×);
// it drops 3 modern cards (TU19 #170, #10, #51). Modern only: WOTC/e-Card markets are near-mint against any-condition listings
// and marks (R38's ~2× regime), so a high market there is the condition gap, not a stale price.
const HIGH_X = 1.75, HIGH_MIN = 5;
// WOTC + e-Card tickers: TCGplayer's market is a near-mint price, our eBay raw mark is any condition. The two are not the
// same card, so the page shows the shop price but never a venue call ("cheaper at the shop / on eBay") — summary.vintage.
const VINTAGE = new Set(["BS99","BSSL","JU99","JU1E","FO99","FO1E","TR00","TR1E","NG00","NG1E","NDC01","NDC1E","NR01","NR1E","ND02","ND1E","AQ03","SK03"]);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function getJson(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { if (i === tries) throw new Error(`${url}: ${e.message}`); await sleep(1500 * i); }
  }
}

// "199/165" → "199", "GG70/GG70" → "GG70", "004/165" → "4", "H1/H32" → "H1", "SV81/SV94" → "SV81"
export const normNum = (n) => {
  const s = String(n || "").split("/")[0].trim().toUpperCase();
  const m = /^([A-Z]*)0*(\d+)([A-Z]*)$/.exec(s);
  return m ? m[1] + m[2] + m[3] : s;
};
// Nov 3 2026: accents folded ("Flabébé" = TCGplayer's cleanName "Flabebe"), apostrophes dropped instead of split ("Lance's" and
// cleanName "Lances" both → "lances"), δ / ☆ spelled out so "Gardevoir ex δ" and "Gardevoir ex (Delta Species)" share tokens.
const slugName = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/δ/g, " delta ").replace(/[☆★]/g, " star ")
  .toLowerCase().replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
// Tokens that say what KIND of card it is, not WHICH card — never enough on their own to call a TCGplayer product ours.
const GENERIC = new Set(["ex", "gx", "v", "vmax", "vstar", "holo", "lv", "x", "prime", "break", "star", "delta", "species", "m", "mega",
  "dark", "light", "shining", "team", "rocket", "rockets", "the", "of", "and", "s", "1st", "edition", "jumbo", "promo"]);
// The TCGplayer name with its trailing printed number stripped: "Pikachu - 025/128" (cleanName "Pikachu 025 128"), "Grookey
// SWSH001", "Celebi (3)", "Here Comes Team Rocket! (15)". Case-sensitive on the letter prefix so a name that ends in a digit
// ("Dark Porygon2") keeps it.
const theirTokens = (name) => slugName(String(name).replace(/(?:\s+-)?(?:\s+\(?[A-Z]*\d+[A-Z]*(?:\/[A-Z]*\d+[A-Z]*)?\)?)+\s*$/, "")).split(" ").filter(Boolean);
// One-letter slip in a long word counts as the same word — TCGplayer spells Neo Destiny's #33 "Dark Exeggcutor".
function near(a, b) {
  if (a === b) return true;
  if (a.length < 6 || b.length < 6 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, miss = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++miss > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return miss + (a.length - i) + (b.length - j) <= 1;
}

// Which TCGplayer printing is "the card the index tracks".
export function pickSub(subs, { ed, holo }) {
  const order = ed === "1st" ? (holo ? ["1st Edition Holofoil", "1st Edition"] : ["1st Edition", "1st Edition Holofoil"])
    : ed === "unl" ? (holo ? ["Unlimited Holofoil", "Holofoil", "Unlimited", "Normal"] : ["Unlimited", "Normal", "Unlimited Holofoil", "Holofoil"])
    : (holo ? ["Holofoil", "Normal", "Reverse Holofoil"] : ["Normal", "Holofoil", "Reverse Holofoil"]);
  for (const k of order) if (subs[k] && subs[k].m > 0) return { sub: k, ...subs[k] };
  if (ed === "1st") return null;                    // never fall back from a 1st Edition page to an Unlimited price
  for (const k of Object.keys(subs)) if (!/1st/i.test(k) && subs[k].m > 0) return { sub: k, ...subs[k] };
  return null;
}

export function buildGroup(prods, prices) {
  const px = new Map();
  for (const p of prices) {
    if (!px.has(p.productId)) px.set(p.productId, {});
    px.get(p.productId)[p.subTypeName] = { m: p.marketPrice, lo: p.lowPrice };
  }
  const byNum = new Map();
  for (const p of prods) {
    const num = (p.extendedData || []).find(e => e.name === "Number");
    if (!num) continue;                              // sealed product, no card number
    const k = normNum(num.value);
    if (!byNum.has(k)) byNum.set(k, []);
    byNum.get(k).push({ pid: p.productId, name: p.cleanName || p.name, subs: px.get(p.productId) || {} });
  }
  return { byNum, n: prods.length };
}

async function loadGroup(gid, cache) {
  if (cache.has(gid)) return cache.get(gid);
  const prods = (await getJson(`${BASE}/${gid}/products`)).results || [];
  await sleep(250);
  const prices = (await getJson(`${BASE}/${gid}/prices`)).results || [];
  await sleep(250);
  const g = buildGroup(prods, prices);
  cache.set(gid, g);
  return g;
}

// Nov 3 2026 (price-truth sweep finding 5: CEL21 jumbo Piplup showed Gardevoir ex δ's $9.50, Treecko/Chimchar M Rayquaza EX's
// $31.63, Chikorita Mewtwo EX's $12.91). The name test used to run only when a number had 2+ TCGplayer candidates, so a lone
// product on the number was taken on the number alone. Now EVERY candidate, single or not, must carry at least one of our
// distinctive name tokens (GENERIC words like "ex"/"gx"/"v" don't count); no candidate passes → no entry (R35, no placeholder).
// Among passing candidates (Classic Collection reprints beside the main set, "Pikachu 033/128" beside "Pikachu & Zekrom GX
// 33/181") the best score wins: most of our tokens present, fewest extras.
export function nameScore(ourName, theirName) {
  const all = slugName(ourName).split(" ").filter(Boolean);
  const key = all.filter(t => !GENERIC.has(t));
  const ours = key.length ? key : all;               // a name made only of generic words keeps them all
  const theirs = theirTokens(theirName);
  // same letters, different spacing ("EXP. ALL" vs TCGplayer "EXP.ALL") is the same name
  if (all.join("") === theirs.join("")) return all.length * 10 + all.length;
  const has = (t) => theirs.some(x => near(t, x));
  const hit = ours.filter(has).length;
  if (!hit) return -Infinity;                        // shares no distinctive word with our card → not our card
  return hit * 10 + all.filter(has).length - Math.abs(theirs.length - all.length);
}

export function matchCard(card, groups, cfg) {
  const want = normNum(card.num);
  let cands = [];
  for (const g of groups) for (const c of g.byNum.get(want) || []) cands.push(c);
  if (!cands.length) return null;
  cands = cands.map(c => ({ c, s: nameScore(card.name, c.name) })).filter(x => x.s > -Infinity).sort((a, b) => b.s - a.s);
  if (!cands.length) return null;                    // nothing on this number is named like our card — don't guess
  const best = cands[0].s;
  cands = cands.filter(x => x.s === best).map(x => x.c);
  for (const c of cands) {
    const pick = pickSub(c.subs, { ed: cfg.ed, holo: !!card.holo });
    if (pick) return { pid: c.pid, name: c.name, ...pick };
  }
  return null;
}

async function main() {
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
  const cache = new Map();
  const out = {
    _comment: "GENERATED by tools/tcg-pull.mjs — the SHOP PRICE beside each index card: TCGplayer market price via the TCGCSV daily mirror (tcgcsv.com), ~24h lag. Keyed by card id (data/cards/<tk>.json). m = TCGplayer market, lo = TCGplayer lowest listing, s = our sold mark at pull time, d = m/s-1 (spread; <0 = cheaper at the shop), sub = printing matched, pid = TCGplayer product id. NEVER feeds a level, a mark or a % move — the index basis is sold comps. Cards with no clean match have no entry (no placeholders).",
    source: "TCGplayer market price (tcgplayer.com) via TCGCSV (tcgcsv.com) daily mirror",
    lag: "~24h",
    asOf: new Date().toISOString().slice(0, 10),
    pulledAt: new Date().toISOString(),
    tickers: {},
    marks: {},
  };
  const tks = Object.keys(TICKERS).filter(t => !ONLY.length || ONLY.includes(t));
  let total = 0, matched = 0;
  for (const tk of tks) {
    const cfg = TICKERS[tk];
    const cf = path.join(ROOT, "data/cards", `${tk.toLowerCase()}.json`);
    if (!fs.existsSync(cf)) { console.warn(`${tk}: no data/cards file, skipped`); continue; }
    const cards = JSON.parse(fs.readFileSync(cf, "utf8")).cards || [];
    let groups;
    try { groups = []; for (const gid of cfg.groups) groups.push(await loadGroup(gid, cache)); }
    catch (e) {
      console.warn(`${tk}: ${e.message} — keeping previous marks for this ticker`);
      // Oct 21 2026 (Night Crew, BLOCKED 2026-10-19 row (a)): card marks live in data/tcg/<tk>.json since the per-ticker
      // split; the summary file carries none, so the old fallback wrote `marks: {}` and the page silently lost every shop
      // price. Read the previous marks from the ticker's own file (else the legacy summary's marks, if any).
      let prevFile = null;
      try { const pf = path.join(path.dirname(OUT), "tcg", `${tk.toLowerCase()}.json`); if (fs.existsSync(pf)) prevFile = JSON.parse(fs.readFileSync(pf, "utf8")); } catch { prevFile = null; }
      const prevTk = (prev && prev.tickers && prev.tickers[tk]) || (prevFile && prevFile.summary) || null;
      if (prevTk) {
        out.tickers[tk] = { ...prevTk, stale: true };
        const prevMarks = (prevFile && prevFile.marks) || (prev && prev.marks) || {};
        for (const [id, v] of Object.entries(prevMarks)) if (id.startsWith(tk.toLowerCase() + "-")) out.marks[id] = v;
      }
      continue;
    }
    let n = 0, shopSum = 0, soldSum = 0, inLevel = 0, stale = 0, high = 0;
    for (const c of cards) {
      total++;
      const hit = matchCard(c, groups, cfg);
      if (!hit || !(hit.m > 0)) continue;
      if (hit.lo > 0 && hit.lo > STALE_X * hit.m) { stale++; continue; }   // unbuyable market price → nothing shown
      const s = c.raw != null && c.raw > 0 ? c.raw : null;
      if (!VINTAGE.has(tk) && hit.m >= HIGH_MIN && hit.lo > 0 && hit.m > HIGH_X * hit.lo && (s == null || hit.m > HIGH_X * s)) { high++; continue; }   // overstated market → nothing shown
      n++; matched++;
      const row = { m: +hit.m.toFixed(2), sub: hit.sub, pid: hit.pid };
      if (hit.lo > 0) row.lo = +hit.lo.toFixed(2);
      if (s != null) { row.s = s; row.d = +((hit.m / s) - 1).toFixed(4); row.sAsOf = c.rawAsOf || null; }
      out.marks[c.id] = row;
      const weighted = s != null && !c.screened && (c.w == null || c.w > 0);
      if (weighted) { inLevel++; shopSum += hit.m; soldSum += s; }
    }
    out.tickers[tk] = {
      groups: cfg.groups, printing: cfg.ed === "1st" ? "1st Edition" : cfg.ed === "unl" ? "Unlimited" : "modern",
      universe: cards.length, matched: n, weighted: inLevel, staleDropped: stale, highDropped: high, vintage: VINTAGE.has(tk) || undefined,
      basketShop: +shopSum.toFixed(2), basketSold: +soldSum.toFixed(2),
      spread: soldSum > 0 ? +((shopSum / soldSum) - 1).toFixed(4) : null,
    };
    console.log(`${tk.padEnd(6)} matched ${String(n).padStart(3)}/${String(cards.length).padEnd(3)} weighted ${String(inLevel).padStart(3)} stale-dropped ${String(stale).padStart(3)} high-dropped ${String(high).padStart(2)}  shop $${shopSum.toFixed(0).padStart(6)} vs sold $${soldSum.toFixed(0).padStart(6)}  ${soldSum ? ((shopSum / soldSum - 1) * 100).toFixed(1) + "%" : "—"}`);
  }
  console.log(`\n${matched}/${total} cards matched across ${tks.length} tickers`);
  if (DRY) { console.log("(dry run — nothing written)"); return; }
  // One small file per ticker (a page fetches only its own set) + the summary file with the per-ticker basket spreads.
  const dir = path.join(path.dirname(OUT), "tcg");
  fs.mkdirSync(dir, { recursive: true });
  let bytes = 0;
  for (const tk of Object.keys(out.tickers)) {
    const pre = tk.toLowerCase() + "-", marks = {};
    for (const [id, v] of Object.entries(out.marks)) if (id.startsWith(pre)) marks[id] = v;
    const f = path.join(dir, `${tk.toLowerCase()}.json`);
    fs.writeFileSync(f, JSON.stringify({ _comment: out._comment, ticker: tk, source: out.source, lag: out.lag, asOf: out.asOf, summary: out.tickers[tk], marks }) + "\n");
    bytes += fs.statSync(f).size;
  }
  // previously-written tickers that failed this run keep their file (stale:true noted in the summary); nothing is deleted here
  const summary = { ...out }; delete summary.marks;
  if (ONLY.length && prev && prev.tickers) summary.tickers = { ...prev.tickers, ...out.tickers };   // a partial run keeps the other tickers' summaries
  summary._comment = "GENERATED by tools/tcg-pull.mjs — per-ticker basket at SHOP PRICE (TCGplayer market via the TCGCSV daily mirror, ~24h lag) vs the same cards at our sold marks. Card-level marks live in data/tcg/<tk>.json. Never feeds a level, a mark or a % move.";
  summary.files = "data/tcg/<tk>.json";
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1) + "\n");
  console.log(`wrote ${path.relative(ROOT, OUT)} + ${Object.keys(out.tickers).length} files in data/tcg/ (${(bytes / 1024).toFixed(0)} KB total)`);
}
// importable (tools/qa or a one-off audit can reuse matchCard / buildGroup) — runs only when called as a script
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
