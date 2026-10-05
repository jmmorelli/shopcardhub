#!/usr/bin/env node
// coverage-scan.mjs — Pokémon coverage scan (Coverage Scout, 2026-10-04; Mo: "determine where we have holes in our pokemon data").
//
// Deterministic, no network. Loads the curated demand list (data/kb/pokemon-demand.json), the site's card search
// (data/card-search.json) and the index file (data/indices.json), and sorts every demand card into:
//   A  in a basket (ticker + weight + share of the index)
//   B  in a universe but screened out of the basket, or held at weight 0
//   C  the set is tracked but the card is missing from the universe (slug / row / variant problem → Index Keeper)
//   D  the set is not tracked (grouped by set; sets ranked by Σ demand raw $ × card count)
//   P  the set is being built (ticker listed in the demand file's "pending" and not yet in indices.json)
// plus a SEARCH-MISS list: demand cards whose name has no substring hit in card-search.json (the "shining gyarados" case),
// and NOT-SEARCHABLE: cards that are tracked but have no row in card-search.json (0 expected since build E, Oct 4 2026: universe rows and the six chase indices write card files).
//
// Usage:  node tools/kb/coverage-scan.mjs [--json] [--root <repo>] [--demand <file>] [--out <md>] [--no-write]
//   --json      print the full result as JSON on stdout instead of the table
//   --out       markdown target (default <root>/claude/kb/pokemon/COVERAGE.md). If the target already exists and holds
//               <!-- coverage-scan:begin --> … <!-- coverage-scan:end -->, only that block is replaced, so a hand-written
//               report around it survives re-runs. Otherwise the whole file is written.
//   --no-write  don't write markdown
// Idempotent: output depends only on the three input files (no clock reads); rows are sorted deterministically.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i > -1 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(opt("--root", path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..")));
const DEMAND = path.resolve(ROOT, opt("--demand", "data/kb/pokemon-demand.json"));
const OUT = path.resolve(ROOT, opt("--out", "claude/kb/pokemon/COVERAGE.md"));
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const demand = readJSON(DEMAND);
const search = readJSON(path.join(ROOT, "data/card-search.json")).cards || [];
const IX = readJSON(path.join(ROOT, "data/indices.json"));

// ---------- normalisation ----------
// site search key (tools/build-nav.js nk): lowercase, non-alphanumerics → space
const nk = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
// card-name key: drop Gold Star marks, parentheticals, accents; unify ex/EX, "LV. X" → "lvx", "&" → "and"
function nameKey(s) {
  return nk(String(s ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/★|☆|\bgold star\b/gi, " ")
    .replace(/\bLV\.?\s*X\b/gi, "lvx")
    .replace(/&/g, " and ")
    .replace(/[’']/g, ""));
}
const numKey = (n) => String(n ?? "").toUpperCase().replace(/^#/, "").replace(/^0+(?=\w)/, "").trim();
const cardSlug = (num) => String(num).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); // tools/lib/card-files.mjs
const tokens = (k) => k.split(" ").filter(Boolean);
function namesMatch(a, b) { // token-subset either way ("umbreon" ⊂ "umbreon gold star" after normalisation)
  const A = tokens(nameKey(a)), B = tokens(nameKey(b));
  if (!A.length || !B.length) return false;
  return A.every((t) => B.includes(t)) || B.every((t) => A.includes(t));
}
const EDN = (e) => (e === "1st" ? "1st" : e === "shadowless" ? "shadowless" : "unlimited");

// ---------- set → ticker map (built from indices.json, so new tickers are picked up without editing this file) ----------
function setOf(t, v) {
  let label = v.set ? String(v.set).replace(/^Pokémon TCG\s+/i, "") : String(v.name || "").replace(/\s+(Chase|Set)\s+Index$/i, "");
  let ed = "unlimited";
  const m = label.match(/\((1st Edition|Shadowless|Unlimited)\)/i);
  if (m) ed = /1st/i.test(m[1]) ? "1st" : /shadow/i.test(m[1]) ? "shadowless" : "unlimited";
  label = label.replace(/\([^)]*\)/g, "").trim();
  return { key: nk(label), ed };
}
const POKE = Object.entries(IX).filter(([t, v]) => v && typeof v === "object" && (v.universe || v.status === "pre") &&
  !/bowman/i.test(`${v.set || ""} ${v.name || ""}`));
const SETMAP = new Map(); // "neo destiny|1st" → ticker
for (const [t, v] of POKE) { const s = setOf(t, v); SETMAP.set(`${s.key}|${s.ed}`, t); }
const PENDING = new Map(); // tickers being built that indices.json does not hold yet
for (const [t, s] of Object.entries(demand.pendingSets || {})) if (!IX[t]) PENDING.set(`${nk(s.set)}|${EDN(s.edition)}`, t);

const searchIds = new Set(search.map((c) => c[0]));
const searchNames = search.map((c) => nameKey(c[1].replace(/\s+#\S+$/, "")));

// ---------- classify ----------
const rows = [];
for (const d of demand.cards) {
  if (d.scope && d.scope !== "en") continue;
  const r = { name: d.name, set: d.set, num: d.num ?? null, edition: d.edition ?? null, variant: d.variant ?? null,
    rawUSD: d.rawUSD ?? null, why: d.why || [], pcPath: d.pcPath ?? null };
  const key = `${nk(d.set)}|${EDN(d.edition)}`;
  const t = SETMAP.get(key);
  const nKey = nameKey(d.name);
  r.searchNameHit = nKey.length > 0 && searchNames.some((s) => s.includes(nKey));
  if (!t) {
    const p = PENDING.get(key);
    if (p) { r.bucket = "P"; r.ticker = p; }
    else { r.bucket = "D"; }
    r.searchable = false;
    rows.push(r); continue;
  }
  r.ticker = t;
  const v = IX[t];
  if (v.status === "pre" || !Array.isArray(v.universe) || !v.universe.length) { r.bucket = "P"; r.note = "ticker in pre-launch"; r.searchable = false; rows.push(r); continue; }
  const nk2 = numKey(d.num);
  const sameNum = v.universe.filter((u) => numKey(u.num) === nk2);
  const u = sameNum.find((x) => namesMatch(x.name, d.name));
  if (!u) {
    r.bucket = "C";
    r.note = !d.num ? "no printed number in demand row" : sameNum.length ? `#${d.num} exists in universe as "${sameNum.map((x) => x.name).join(" / ")}" — name mismatch` : `#${d.num} not in ${t} universe (${v.universe.length} slots)`;
    r.searchable = false; rows.push(r); continue;
  }
  if (d.variant) { // a variant print the index does not hold as its own row
    r.bucket = "C"; r.note = `variant "${d.variant}" not tracked separately; base print ${t} #${u.num} is in the universe`;
    r.searchable = searchIds.has(`${t.toLowerCase()}-${cardSlug(u.num)}`); rows.push(r); continue;
  }
  const b = (v.basket || []).find((x) => numKey(x.num) === nk2 && namesMatch(x.name, u.name));
  const tot = (v.basket || []).reduce((s, x) => s + (Number(x.price) || 0) * (x.w ?? 1), 0);
  r.searchable = searchIds.has(`${t.toLowerCase()}-${cardSlug(u.num)}`);
  if (b && (b.w ?? 1) > 0) {
    r.bucket = "A"; r.w = b.w ?? 1; r.price = b.price ?? null; r.n30 = b.n30 ?? null;
    r.share = tot ? Math.round(((b.price || 0) * r.w / tot) * 1000) / 10 : null;
  } else if (b) {
    r.bucket = "B"; r.price = b.price ?? null; r.n30 = b.n30 ?? null;
    r.note = `in basket at weight 0${v.sub && Object.keys(v.sub).length ? " (carried on a sub-index, not the level)" : ""}`;
  } else {
    const sl = (v.screenLog || []).slice(-1)[0];
    const win = v.screen ? `${v.screen.enter} sales/${v.screen.window}d` : "screen";
    r.bucket = "B"; r.note = `screened out (below ${win}${sl ? `; last screen ${sl.date}: ${sl.pass} pass / ${sl.fail} fail` : ""})`;
  }
  rows.push(r);
}

// ---------- aggregate ----------
const by = (b) => rows.filter((r) => r.bucket === b);
const money = (n) => (n == null ? "—" : "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 }));
const desc = (a, b) => (b.rawUSD || 0) - (a.rawUSD || 0) || String(a.set).localeCompare(String(b.set)) || String(a.name).localeCompare(String(b.name));
const D = by("D");
const sets = new Map();
for (const r of D) { const s = sets.get(r.set) || { set: r.set, n: 0, sum: 0, cards: [] }; s.n++; s.sum += r.rawUSD || 0; s.cards.push(r); sets.set(r.set, s); }
const dSets = [...sets.values()].map((s) => ({ ...s, sum: Math.round(s.sum), score: Math.round(s.sum * s.n), cards: s.cards.sort(desc) }))
  .sort((a, b) => b.score - a.score || a.set.localeCompare(b.set));
const misses = rows.filter((r) => !r.searchNameHit).sort(desc);
const notSearchable = rows.filter((r) => ["A", "B"].includes(r.bucket) && !r.searchable).sort(desc);
const counts = Object.fromEntries(["A", "B", "C", "D", "P"].map((b) => [b, by(b).length]));
const result = {
  inputs: { demand: path.relative(ROOT, DEMAND), demandBuiltAt: demand.builtAt || null, indicesUpdated: IX.updated || null, searchCards: search.length },
  counts: { total: rows.length, ...counts, searchMiss: misses.length, notSearchable: notSearchable.length, untrackedSets: dSets.length },
  A: by("A").sort(desc), B: by("B").sort(desc), C: by("C").sort(desc), P: by("P").sort(desc), D: dSets, searchMiss: misses, notSearchable,
};

// ---------- output ----------
if (flag("--json")) { process.stdout.write(JSON.stringify(result, null, 1) + "\n"); }
else {
  const c = result.counts;
  console.log(`coverage-scan: ${c.total} demand cards → A ${c.A} · B ${c.B} · C ${c.C} · D ${c.D} · P ${c.P} | search-miss ${c.searchMiss} · tracked-not-searchable ${c.notSearchable} | ${c.untrackedSets} untracked sets`);
  console.log("\nTop untracked sets (Σ raw × count):");
  for (const s of dSets.slice(0, 15)) console.log(`  ${s.set.padEnd(34)} ${String(s.n).padStart(3)} cards  ${money(s.sum).padStart(9)}  score ${s.score.toLocaleString("en-US")}`);
  console.log("\nTop search misses:");
  for (const r of misses.slice(0, 15)) console.log(`  ${(r.name + " #" + (r.num ?? "—")).padEnd(40)} ${r.set.padEnd(30)} ${money(r.rawUSD)}  [${r.bucket}]`);
}

const label = (r) => `${r.name}${r.edition && r.edition !== "unlimited" ? ` (${r.edition === "1st" ? "1st Ed" : "Shadowless"})` : ""}${r.variant ? ` [${r.variant}]` : ""} #${r.num ?? "—"}`;
function md() {
  const c = result.counts, L = [];
  L.push("<!-- coverage-scan:begin -->");
  L.push(`### Scan output (generated by \`tools/kb/coverage-scan.mjs\` — do not hand-edit this block)`);
  L.push("");
  L.push(`Inputs: \`${result.inputs.demand}\` (built ${result.inputs.demandBuiltAt}), \`data/indices.json\` (updated ${result.inputs.indicesUpdated}), \`data/card-search.json\` (${result.inputs.searchCards} cards). Prices are PriceCharting ungraded on the demand file's date — a ranking aid, never a site price.`);
  L.push("");
  L.push(`| Bucket | Meaning | Cards |`, `|---|---|---|`,
    `| A | in a basket | ${c.A} |`, `| B | in a universe, screened out or weight 0 | ${c.B} |`, `| C | set tracked, card missing from the universe (or a variant we don't hold) | ${c.C} |`,
    `| D | set not tracked | ${c.D} (${c.untrackedSets} sets) |`, `| P | set being built (pending ticker) | ${c.P} |`,
    `| search-miss | name has no substring hit in card-search.json | ${c.searchMiss} |`, `| not searchable | in A/B but no card-search row | ${c.notSearchable} |`, "");
  L.push(`#### A — in a basket (${c.A})`, "", "| Card | Set | Ticker | w | Share | Raw (demand) |", "|---|---|---|---|---|---|");
  for (const r of result.A) L.push(`| ${label(r)} | ${r.set} | ${r.ticker} | ${r.w} | ${r.share ?? "—"}% | ${money(r.rawUSD)} |`);
  L.push("", `#### B — tracked, not in the level (${c.B})`, "", "| Card | Set | Ticker | Why | Raw (demand) |", "|---|---|---|---|---|");
  for (const r of result.B) L.push(`| ${label(r)} | ${r.set} | ${r.ticker} | ${r.note} | ${money(r.rawUSD)} |`);
  L.push("", `#### C — set tracked, card missing (${c.C}) → Index Keeper`, "", "| Card | Set | Ticker | Problem | Raw (demand) |", "|---|---|---|---|---|");
  for (const r of result.C) L.push(`| ${label(r)} | ${r.set} | ${r.ticker} | ${r.note} | ${money(r.rawUSD)} |`);
  L.push("", `#### P — set being built tonight (${c.P}); re-scan after the build lands`, "", "| Card | Set | Ticker | Raw (demand) |", "|---|---|---|---|");
  for (const r of result.P) L.push(`| ${label(r)} | ${r.set} | ${r.ticker}${r.note ? ` (${r.note})` : ""} | ${money(r.rawUSD)} |`);
  L.push("", `#### D — set not tracked (${c.D} cards in ${c.untrackedSets} sets), ranked by Σ raw × card count`, "", "| # | Set | Cards | Σ raw | Score | Demand cards (raw) |", "|---|---|---|---|---|---|");
  dSets.forEach((s, i) => L.push(`| ${i + 1} | ${s.set} | ${s.n} | ${money(s.sum)} | ${s.score.toLocaleString("en-US")} | ${s.cards.map((r) => `${label(r)} ${money(r.rawUSD)}`).join("; ")} |`));
  L.push("", `#### Search-miss (${c.searchMiss}) — typed into our search, nothing with that name comes back`, "", "| Card | Set | Bucket | Raw (demand) |", "|---|---|---|---|");
  for (const r of misses) L.push(`| ${label(r)} | ${r.set} | ${r.bucket}${r.ticker ? " " + r.ticker : ""} | ${money(r.rawUSD)} |`);
  L.push("", `#### Tracked but not searchable (${c.notSearchable}) — in an index, no card-search row (should be 0 since Oct 4 2026: universe + chase cards have card files)`, "", "| Card | Set | Ticker | Bucket | Raw (demand) |", "|---|---|---|---|---|");
  for (const r of notSearchable) L.push(`| ${label(r)} | ${r.set} | ${r.ticker} | ${r.bucket} | ${money(r.rawUSD)} |`);
  L.push("<!-- coverage-scan:end -->");
  return L.join("\n");
}
if (!flag("--no-write")) {
  const block = md();
  let body = block + "\n";
  if (fs.existsSync(OUT)) {
    const cur = fs.readFileSync(OUT, "utf8");
    const re = /<!-- coverage-scan:begin -->[\s\S]*?<!-- coverage-scan:end -->/;
    if (re.test(cur)) body = cur.replace(re, block);
  } else body = `# Pokémon coverage scan\n\n${block}\n`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body);
  if (!flag("--json")) console.log(`\nwrote ${path.relative(process.cwd(), OUT) || OUT}`);
}
