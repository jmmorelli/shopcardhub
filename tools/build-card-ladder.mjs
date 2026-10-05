#!/usr/bin/env node
// build-card-ladder.mjs — the graded price ladder (Raw · PSA 9 · PSA 10 · TAG 10) for every card in the Pokémon
// sector-model set indices (Sep 30 2026, Mo: "link to PSA 9 and PSA 10 … show the difference in price between raw,
// 9 and 10 … promo TAG graded as its own link").
//
// DATA: one PriceCharting item page per card (the same public page the index marks are read from). Every grade tab is
// on that one page, so a card costs one request. Rules (R17/R18/R20):
//   · Raw is NOT re-read here — the card page shows the index's own sold mark, so the two can never disagree.
//   · A graded figure comes only from dated sales rows whose OWN title names the grade (PSA 9 rows are picked out of
//     PriceCharting's all-grader "Grade 9" tab by title; PSA 10 and TAG 10 rows from their own tabs, title-checked).
//   · mark = median of >= 3 such sales in 30 days, else median of >= 2 in 90 days, else none. A single sale is never a
//     mark; it is published only as "last sale <date> $X" (R18 one-row form).
//   · Titles are read in memory for the grade/edition filter and NEVER stored. Only dates, prices and counts leave.
//   · WOTC Unlimited tickers drop rows whose title says 1st Edition / Shadowless (separate items, mislisted rows).
//
// Writes data/cards/g-<tk>.json  { ticker, day, cards: { "<num>": { psa9, psa10, tag10, asOf } } }  (read by /card)
// Usage: node tools/build-card-ladder.mjs [--ticker BS99,JU99] [--limit N] [--cache DIR]
//   --cache DIR keeps each page's parsed result so an interrupted run resumes (no HTML is cached, only the numbers).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { soldRows, medianOf } from "./league/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const TODAY = process.env.LADDER_TODAY || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });   // PT day, like the rest of the desk
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const PAUSE = +opt("--pause", 1600), WORKERS = +opt("--workers", 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const days = (d) => (Date.parse(TODAY) - Date.parse(d)) / 864e5;
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

export const POKEMON_SECTOR = ["TH26", "SV151", "BS99", "JU99", "FO99", "TR00", "NG00", "ND02", "AQ03", "SK03", "HF19", "EVS21", "CEL21", "CZ23", "BS1E", "BSSL", "JU1E", "FO1E", "TR1E", "NG1E", "ND1E", "SSP24", "MEG25"];   // SSP24 + MEG25 joined Oct 4 2026
const FIRST = new Set(["BS1E", "JU1E", "FO1E", "TR1E", "NG1E", "ND1E"]), SHADOWLESS = new Set(["BSSL"]);
const WOTC = new Set(["BS99", "JU99", "FO99", "TR00", "NG00", "ND02"]);
const GRADES = {
  psa9: { tab: "Grade 9", title: (t) => /\bpsa\s*-?\s*9\b(?![.\d])/i.test(t) && !/\bpsa\s*-?\s*10\b/i.test(t) },
  psa10: { tab: "PSA 10", title: (t) => /\bpsa\s*-?\s*10\b/i.test(t) },
  tag10: { tab: "TAG 10", title: (t) => /\btag\b/i.test(t) },
};

// ed: true/"unl" = WOTC Unlimited (drop rows titled 1st Ed / Shadowless) · "1st" = keep only rows titled 1st Edition ·
// "shadowless" = keep only rows titled Shadowless and never 1st Edition · false = modern (no edition filter)
export function ladderFromHtml(html, wotc) {
  const tabs = [...html.matchAll(/<option[^>]*value="completed-auctions-([a-z0-9-]+)"[^>]*>([^<(]+)/g)].map((m) => ({ cls: m[1], label: m[2].trim() }));
  const out = {};
  for (const [k, g] of Object.entries(GRADES)) {
    const t = tabs.find((x) => x.label.toLowerCase() === g.tab.toLowerCase());
    if (!t) { out[k] = null; continue; }
    const rows = soldRows(html, t.cls).filter((r) => g.title(r.title) && !/\blot\b|proxy|custom|reprint/i.test(r.title) && edOk(r.title, wotc));
    const r30 = rows.filter((r) => days(r.date) <= 30), r90 = rows.filter((r) => days(r.date) <= 90), r365 = rows.filter((r) => days(r.date) <= 365);
    const last = rows.slice().sort((a, b) => b.date.localeCompare(a.date))[0] || null;
    let m = null, basis = null, n = 0;
    if (r30.length >= 3) { m = medianOf(r30.map((r) => r.price)); basis = "30d"; n = r30.length; }
    else if (r90.length >= 2) { m = medianOf(r90.map((r) => r.price)); basis = "90d"; n = r90.length; }
    out[k] = { m: r2(m), basis, n, n365: r365.length, last: last && days(last.date) <= 365 ? { d: last.date, p: r2(last.price) } : null };
  }
  return out;
}

function edOk(t, ed) {
  const first = /1st\s*ed|first\s*ed/i.test(t), sl = /shadowless/i.test(t);
  if (ed === "1st") return first;
  if (ed === "shadowless") return sl && !first;
  if (ed) return !first && !sl;
  return true;
}
// monthly price history for the card-page chart (Mo, Sep 30: "doesn't price charting show a chart we can use for individual
// cards?"). PriceCharting embeds VGPC.chart_data: used = ungraded, graded = Grade 9 (any grader), manualonly = PSA 10 — their
// monthly value estimate, the same series the index reconstructions use. Published as context, labelled as theirs, never as a mark.
export function histFromHtml(html, from = "2021-01") {
  const m = html.match(/VGPC\.chart_data\s*=\s*(\{[\s\S]*?\});/); if (!m) return null;
  let cd; try { cd = JSON.parse(m[1]); } catch (e) { return null; }
  const rows = new Map();
  for (const [k, i] of [["used", 1], ["graded", 2], ["manualonly", 3]]) for (const [ms, cents] of cd[k] || []) {
    const mo = new Date(ms + 12 * 3600e3).toISOString().slice(0, 7); if (mo < from || !cents) continue;
    if (!rows.has(mo)) rows.set(mo, [mo, null, null, null]);
    rows.get(mo)[i] = Math.round(cents) / 100;
  }
  return [...rows.values()].sort((x, y) => x[0].localeCompare(y[0]));
}
async function get(url) {
  for (let i = 1; i <= 4; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(6000 * i); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }
  throw new Error("rate limited after 4 attempts");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const IDX = JSON.parse(fs.readFileSync(path.join(ROOT, "data/indices.json"), "utf8"));
  const tks = (opt("--ticker", null) || POKEMON_SECTOR.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
  const CACHE = opt("--cache", null); if (CACHE) fs.mkdirSync(CACHE, { recursive: true });
  const jobs = [];
  for (const tk of tks) for (const b of (IDX[tk] && IDX[tk].basket) || []) if (b.path) jobs.push({ tk, num: String(b.num), path: b.path });
  const LIMIT = +opt("--limit", 0); if (LIMIT) jobs.splice(LIMIT);
  const cards = {}, hist = {}; let done = 0, errs = 0; const NOHIST = args.includes("--no-hist");
  async function worker() {
    while (jobs.length) {
      const j = jobs.shift(), key = `${j.tk}:${j.num}`, cf = CACHE && path.join(CACHE, key.replace(/[^A-Za-z0-9]+/g, "_") + ".json");
      try {
        if (cf && fs.existsSync(cf) && (NOHIST || fs.existsSync(cf.replace(/\.json$/, ".h.json")))) { cards[key] = JSON.parse(fs.readFileSync(cf, "utf8")); const hf = cf.replace(/\.json$/, ".h.json"); if (fs.existsSync(hf)) hist[key] = JSON.parse(fs.readFileSync(hf, "utf8")); }
        else {
          const html = await get("https://www.pricecharting.com/game/" + j.path);
          const l = ladderFromHtml(html, FIRST.has(j.tk) ? "1st" : SHADOWLESS.has(j.tk) ? "shadowless" : WOTC.has(j.tk)); l.asOf = TODAY; cards[key] = l;
          const hh = histFromHtml(html); if (hh) { hist[key] = hh; if (cf) fs.writeFileSync(cf.replace(/\.json$/, ".h.json"), JSON.stringify(hh)); }
          if (cf) fs.writeFileSync(cf, JSON.stringify(l));
          await sleep(PAUSE);
        }
      } catch (e) { errs++; console.error(key, e.message); }
      if (++done % 50 === 0) console.log(`  ${done} read · ${errs} errors`);
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));
  // one small file per ticker (a card page loads its own set only); a card that failed to read keeps its previous ladder
  for (const tk of tks) {
    const f = path.join(ROOT, `data/cards/g-${tk.toLowerCase()}.json`);
    let prev = {}; try { prev = JSON.parse(fs.readFileSync(f, "utf8")).cards || {}; } catch (e) {}
    const mine = { ...prev };
    for (const [k, v] of Object.entries(cards)) if (k.startsWith(tk + ":")) mine[k.slice(tk.length + 1)] = v;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify({ _comment: "GENERATED by tools/build-card-ladder.mjs — graded SOLD marks (PSA 9 / PSA 10 / TAG 10) per card. A row counts only when the sale's own title names the grade; mark = median of >=3 sales in 30d else >=2 in 90d; `last` is one dated sale, never a mark. No titles, sellers or item ids stored.", ticker: tk, day: TODAY, cards: mine }) + "\n");
  }
  for (const tk of tks) {
    const mine = {}; for (const [k, v] of Object.entries(hist)) if (k.startsWith(tk + ":")) mine[k.slice(tk.length + 1)] = v;
    if (!Object.keys(mine).length) continue;
    fs.writeFileSync(path.join(ROOT, `data/cards/h-${tk.toLowerCase()}.json`), JSON.stringify({ _comment: "GENERATED by tools/build-card-ladder.mjs — PriceCharting's monthly price history per card (their value estimate, built from sales): [month, ungraded, Grade 9 any grader, PSA 10]. Chart context on /card, labelled as theirs; never a mark.", ticker: tk, day: TODAY, cards: mine }) + "\n");
  }
  const v = Object.values(cards);
  console.log(`ladder ${TODAY}: ${v.length} cards · psa9 ${v.filter((c) => c.psa9 && c.psa9.m).length} · psa10 ${v.filter((c) => c.psa10 && c.psa10.m).length} · tag10 ${v.filter((c) => c.tag10 && (c.tag10.m || c.tag10.last)).length} · ${errs} errors`);
}
