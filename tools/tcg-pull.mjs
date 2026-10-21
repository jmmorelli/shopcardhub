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
const TICKERS = {
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
const normNum = (n) => {
  const s = String(n || "").split("/")[0].trim().toUpperCase();
  const m = /^([A-Z]*)0*(\d+)([A-Z]*)$/.exec(s);
  return m ? m[1] + m[2] + m[3] : s;
};
const slugName = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Which TCGplayer printing is "the card the index tracks".
function pickSub(subs, { ed, holo }) {
  const order = ed === "1st" ? (holo ? ["1st Edition Holofoil", "1st Edition"] : ["1st Edition", "1st Edition Holofoil"])
    : ed === "unl" ? (holo ? ["Unlimited Holofoil", "Holofoil", "Unlimited", "Normal"] : ["Unlimited", "Normal", "Unlimited Holofoil", "Holofoil"])
    : (holo ? ["Holofoil", "Normal", "Reverse Holofoil"] : ["Normal", "Holofoil", "Reverse Holofoil"]);
  for (const k of order) if (subs[k] && subs[k].m > 0) return { sub: k, ...subs[k] };
  if (ed === "1st") return null;                    // never fall back from a 1st Edition page to an Unlimited price
  for (const k of Object.keys(subs)) if (!/1st/i.test(k) && subs[k].m > 0) return { sub: k, ...subs[k] };
  return null;
}

async function loadGroup(gid, cache) {
  if (cache.has(gid)) return cache.get(gid);
  const prods = (await getJson(`${BASE}/${gid}/products`)).results || [];
  await sleep(250);
  const prices = (await getJson(`${BASE}/${gid}/prices`)).results || [];
  await sleep(250);
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
  const g = { byNum, n: prods.length };
  cache.set(gid, g);
  return g;
}

function matchCard(card, groups, cfg) {
  const want = normNum(card.num), nm = slugName(card.name);
  let cands = [];
  for (const g of groups) for (const c of g.byNum.get(want) || []) cands.push(c);
  if (!cands.length) return null;
  if (cands.length > 1) {
    // two cards on one number (Classic Collection reprints beside the main set, "Pikachu 033/128" beside "Pikachu & Zekrom GX
    // 33/181"): score each TCGplayer name by our name's tokens — every one of ours present, fewest extras — and keep the best.
    const ours = nm.split(" ").filter(Boolean);
    const score = (c) => {
      const theirs = slugName(String(c.name).replace(/\s*-?\s*\(?[A-Za-z]*\d+[A-Za-z]*\/[A-Za-z]*\d+[A-Za-z]*\)?\s*$/, "")).split(" ").filter(Boolean);
      const hit = ours.filter(t => theirs.includes(t)).length;
      return hit * 10 - Math.abs(theirs.length - ours.length);
    };
    cands = cands.map(c => ({ c, s: score(c) })).sort((a, b) => b.s - a.s);
    const best = cands[0].s;
    if (best < 10) return null;                      // nothing shares even one name token — don't guess
    cands = cands.filter(x => x.s === best).map(x => x.c);
  }
  for (const c of cands) {
    const pick = pickSub(c.subs, { ed: cfg.ed, holo: !!card.holo });
    if (pick) return { pid: c.pid, ...pick };
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
    let n = 0, shopSum = 0, soldSum = 0, inLevel = 0;
    for (const c of cards) {
      total++;
      const hit = matchCard(c, groups, cfg);
      if (!hit || !(hit.m > 0)) continue;
      n++; matched++;
      const s = c.raw != null && c.raw > 0 ? c.raw : null;
      const row = { m: +hit.m.toFixed(2), sub: hit.sub, pid: hit.pid };
      if (hit.lo > 0) row.lo = +hit.lo.toFixed(2);
      if (s != null) { row.s = s; row.d = +((hit.m / s) - 1).toFixed(4); row.sAsOf = c.rawAsOf || null; }
      out.marks[c.id] = row;
      const weighted = s != null && !c.screened && (c.w == null || c.w > 0);
      if (weighted) { inLevel++; shopSum += hit.m; soldSum += s; }
    }
    out.tickers[tk] = {
      groups: cfg.groups, printing: cfg.ed === "1st" ? "1st Edition" : cfg.ed === "unl" ? "Unlimited" : "modern",
      universe: cards.length, matched: n, weighted: inLevel,
      basketShop: +shopSum.toFixed(2), basketSold: +soldSum.toFixed(2),
      spread: soldSum > 0 ? +((shopSum / soldSum) - 1).toFixed(4) : null,
    };
    console.log(`${tk.padEnd(6)} matched ${String(n).padStart(3)}/${String(cards.length).padEnd(3)} weighted ${String(inLevel).padStart(3)}  shop $${shopSum.toFixed(0).padStart(6)} vs sold $${soldSum.toFixed(0).padStart(6)}  ${soldSum ? ((shopSum / soldSum - 1) * 100).toFixed(1) + "%" : "—"}`);
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
main().catch(e => { console.error(e); process.exit(1); });
