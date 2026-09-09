#!/usr/bin/env node
// tools/first-bowman.mjs — 1st Bowman integrity: verify (default) or apply (--apply) per-card 1st flags
// across the Bowman-family checklists in data/sets/. Rewritten Sep 9, 2026 (Mo's correction, CoS ruling).
//
// THE RULE (Mo, Sep 9 2026 — verified against Topps card images, Topps' own copy "players receiving their
// first trading card will feature the 1st Bowman logo", Checklist Insider's per-card 1st marks on 2025
// Bowman Chrome, and a COMC scan of 2025 Bowman Chrome CPA-SH):
//   * A "1st Bowman" is the card that carries the 1st logo. There are TWO per prospect, judged separately:
//       - 1st Bowman Chrome (non-auto): the player's FIRST non-auto card in any Bowman-family product.
//       - 1st Bowman Auto:              the player's FIRST autograph in any Bowman-family product.
//     (Sammy Hernandez: base 1st in May 2025 Bowman, auto 1st in Sept 2025 Bowman Chrome — both carry the logo.)
//   * A player gets each of those ONCE. Every later card of the same kind — same year or not, paper or
//     Chrome, Sapphire, September Chrome, Draft — does NOT carry the logo. (Aiva Arquette / Ethan Holliday:
//     1st Chrome + 1st Auto in May's 2026 Bowman; their Sept 2026 Bowman Chrome BCP cards are NOT 1sts.)
//   * A 1st Bowman is not a rookie card. RC = a player in the league; 1st Bowman = an unproven prospect.
//   * Tagging a card "1st" when it is not is a site-trust breakdown. Untagged means NOT a 1st, never "unknown".
//   The Aug 21 "1st logo on every card of the debut year" propagation rule was WRONG and is retired.
//
// HOW IT DECIDES: sets are ordered by release date. For card c (kind = auto | base, from the group) in set S,
// a prior = any Bowman-family set released before S with a same-kind card of the same player, OR an entry in
// S.firstAudit.externalPriors (cards that live outside data/sets, e.g. "jett-williams": "2022 Bowman Draft").
// Base-set groups (MLB veterans/rookies, key "base") never carry or receive the flag.
//   contradiction  = first:true with a prior            → always reported; removed with --apply
//   candidate      = no prior, no first flag            → reported; ADDED with --apply only when the set's
//                    firstAudit.complete === true (its prior universe was checked outside data/sets too —
//                    data/sets only reaches back to 2025, so an unverified set cannot be auto-flagged)
//   parallel sets  = a set whose meta carries parallelOf:"<parent slug>" (2026 Bowman Sapphire = the sapphire parallel of
//                    May's 2026 Bowman) is the SAME cards: its rows carry the 1st logo exactly as the parent's do, so the
//                    parent and the parallel edition never count as priors of each other (Mo, Aug 21: Holliday's Sapphire
//                    BCP-1 IS a 1st — that correction was about the parallel, and it stands).
//   board          = Bangers board names (data/board-history.json entryDates minus departures) get board:true
//                    in current-year Bowman-family sets; departed names lose it. board never implies first.
// Usage: node tools/first-bowman.mjs [--apply] [--json]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const AS_JSON = process.argv.includes("--json");

export const slug = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").replace(/-jr$/, "");
export const isAutoGroup = g => /auto|bspa|\bcpa\b|\bssa\b/i.test(`${g.key || ""} ${g.title || g.name || ""}`);
// MLB base set (veterans/rookies, RC-flagged) — never 1st Bowman. Bowman Draft's "base" group is the Draft Picks
// prospect set (title "Draft Picks"), which DOES carry 1st logos, so key alone is not enough.
export const isBaseSetGroup = g => /^base set$/i.test(g.title || g.name || "") || ((g.key || "").toLowerCase() === "base" && !/draft|prospect/i.test(g.title || g.name || ""));

export function currentBoard(repo = REPO) {
  const bh = JSON.parse(fs.readFileSync(path.join(repo, "data/board-history.json"), "utf8"));
  const left = new Set((bh.departures || []).map(d => d.slug));
  return { on: new Set(Object.keys(bh.entryDates || {}).filter(s => !left.has(s))), left };
}

export function loadBowmanSets(repo = REPO) {
  const dir = path.join(repo, "data/sets");
  return fs.readdirSync(dir).filter(f => f.endsWith(".json"))
    .map(f => ({ f, rel: "data/sets/" + f, d: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }))
    .filter(s => /\bbowman\b/i.test(s.d.set))
    .map(s => ({ ...s, release: s.d.release || "9999-12-31", year: parseInt(String(s.d.set).match(/\b(20\d\d)\b/)?.[1] || "0", 10) }))
    .sort((a, b) => a.release.localeCompare(b.release));
}

/** Returns { findings: [{level, code, set, card, player, msg}], changes: n, sets } */
export function audit({ apply = false, repo = REPO } = {}) {
  const sets = loadBowmanSets(repo);
  const board = currentBoard(repo);
  const BOARD_YEAR = Math.max(...sets.map(s => s.year));
  const findings = [];
  const add = (level, code, s, c, msg) => findings.push({ level, code, set: s.rel, card: c ? c.n : "", player: c ? c.player : "", msg });
  // seen[kind][pslug] = [{release, rel, n}] — built incrementally in release order so "prior" = strictly earlier release
  const seen = { base: new Map(), auto: new Map() };
  let changes = 0;
  for (const s of sets) {
    const ext = (s.d.firstAudit && s.d.firstAudit.externalPriors) || {};
    const complete = !!(s.d.firstAudit && s.d.firstAudit.complete);
    const here = { base: new Map(), auto: new Map() }; // same-set cards do not count as priors of each other
    let dirty = false;
    for (const g of s.d.groups || []) {
      const kind = isAutoGroup(g) ? "auto" : "base";
      const baseSet = isBaseSetGroup(g);
      for (const c of g.cards || []) {
        const p = slug(c.player);
        const fam = s.d.parallelOf || s.d.slug;
        const priors = (seen[kind].get(p) || []).filter(pr => pr.fam !== fam);
        const extPrior = ext[p] && (ext[p] === true || /\b(both|all)\b/i.test(ext[p]) || new RegExp(kind, "i").test(ext[p]) || !/\b(base|auto)\b/i.test(ext[p]));
        const hasPrior = baseSet || priors.length > 0 || !!extPrior;
        if (c.first && hasPrior) {
          const why = baseSet ? "base-set (MLB) card" : priors.length ? `${priors[0].rel} ${priors[0].n} (${priors[0].release})` : `external: ${ext[p]}`;
          add("FAIL", "first-bowman-contradiction", s, c, `${c.n} ${c.player} [${kind}] flagged 1st but has an earlier ${kind} card — ${why}`);
          if (apply) { delete c.first; dirty = true; changes++; }
        } else if (!c.first && !hasPrior) {
          add(complete ? "FIX" : "INFO", "first-bowman-candidate", s, c, `${c.n} ${c.player} [${kind}] has no earlier ${kind} card in data/sets${complete ? " (set verified complete → 1st)" : " (set not verified outside data/sets — not applied)"}`);
          if (apply && complete) { c.first = true; dirty = true; changes++; }
        }
        // board tag (current-year Bowman family only)
        if (s.year === BOARD_YEAR) {
          if (board.on.has(p) && !c.board) { add("FIX", "bangers-tag-missing", s, c, `${c.n} ${c.player}: on the Bangers board, board:true missing`); if (apply) { c.board = true; dirty = true; changes++; } }
          if (c.board && !board.on.has(p)) { add("FIX", "bangers-tag-stray", s, c, `${c.n} ${c.player}: board:true but ${board.left.has(p) ? "left the board" : "not on the board"}`); if (apply) { delete c.board; dirty = true; changes++; } }
        } else if (c.board) { add("FIX", "bangers-tag-stray", s, c, `${c.n} ${c.player}: board:true in a ${s.year} set`); if (apply) { delete c.board; dirty = true; changes++; } }
        if (!here[kind].has(p)) here[kind].set(p, []);
        here[kind].get(p).push({ release: s.release, rel: s.rel, n: c.n, fam });
      }
    }
    // a player flagged 1st twice for the same kind inside one set (e.g. paper BP + chrome BCP of the same May set) is
    // Topps' own design (both carry the logo) — allowed. Across sets it is caught above as a contradiction.
    for (const kind of ["base", "auto"]) for (const [p, arr] of here[kind]) { if (!seen[kind].has(p)) seen[kind].set(p, []); seen[kind].get(p).push(...arr); }
    if (apply && dirty) fs.writeFileSync(path.join(repo, s.rel), JSON.stringify(s.d, null, 1) + "\n");
  }
  return { findings, changes, sets: sets.map(s => ({ rel: s.rel, release: s.release, complete: !!(s.d.firstAudit && s.d.firstAudit.complete) })) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = audit({ apply: APPLY });
  if (AS_JSON) { console.log(JSON.stringify(r, null, 1)); process.exit(0); }
  console.log("sets (release order): " + r.sets.map(s => `${path.basename(s.rel, ".json")}@${s.release}${s.complete ? " ✓" : ""}`).join(" → "));
  const by = {};
  for (const f of r.findings) { by[f.level + " " + f.code] = (by[f.level + " " + f.code] || 0) + 1; }
  for (const f of r.findings) if (f.level !== "INFO") console.log(`${f.level.padEnd(4)} ${f.code.padEnd(26)} ${f.set}: ${f.msg}`);
  console.log(Object.entries(by).map(([k, v]) => `${k}=${v}`).join("  ") || "clean");
  console.log(APPLY ? `applied ${r.changes} change(s)` : "(dry run — --apply writes; candidates are only applied in sets with firstAudit.complete=true)");
  if (!APPLY && r.findings.some(f => f.level === "FAIL")) process.exit(2);
}
