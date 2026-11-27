#!/usr/bin/env node
// build-prelaunch-eyebrow.mjs — the launch-state word in the eyebrow of the three creator-written index blocks
// (Q-019, Build Loop, Nov 26 2026; ruling LANE-RULES R49 (h), CoS with Mo, Nov 26).
//
// Why: /bowman-football-2026-index, /bowman-chrome-sapphire-2026-index and /delta-reign-index were written once by their
// page-creator tools (tools/new-bf26-page.mjs, tools/new-bcs26-page.mjs, the DLR26 creator) with "pre-launch" typed into
// the eyebrow, and no regen tool owns those <TK>:START blocks. All three sets are on the street, so the word was wrong.
//
// What it owns: ONLY the launch-state words of each page's eyebrow, between its own sub-markers
//   <!-- EYEBROW:<TK> -->…<!-- /EYEBROW:<TK> -->
// The first run puts the sub-markers around the typed word; every later run rewrites what sits between them.
// The state comes from data/indices.json (status, releaseDate, history), never typed here:
//   street date in the future                    → "pre-launch"
//   street date passed, no level yet             → "released <Mon D> · no level yet"
//   live (a level in history, status not pre)    → "" (no launch wording; the separator before it goes too)
// Named lines (Q-066, Build Loop, Nov 27 2026; Bowman KB GAPS G42): the generator also owns a few named phrases inside the
// BF26 block, between <!-- LINE:<TK>:<name> -->…<!-- /LINE:<TK>:<name> --> sub-markers (first run wraps the typed phrase):
//   BF26:street → "Streets <Weekday>, <Mon D>." before the street date, "Released <Mon D>." after (from releaseDate)
//   BF26:main   → "the college prospects' Bowman Chrome autographs" (G42: no "first Bowman" claim until the per-player prior check)
// It never touches anything else on the page.
//
// Usage: node tools/build-prelaunch-eyebrow.mjs [--check]   (--check: exit 1 if any page would change; writes nothing)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const TODAY = process.env.EYEBROW_TODAY || new Date().toISOString().slice(0, 10);

// page · ticker · the eyebrow's fixed lead-in · the typed word the creator tool left (first run only) · capitalised?
const PAGES = [
  { tk: "BF26", file: "bowman-football-2026-index.html", lead: '<div class="eyebrow">Set index', typed: " · pre-launch", cap: false },
  { tk: "BCS26", file: "bowman-chrome-sapphire-2026-index.html", lead: '<div class="eyebrow">Set index', typed: " · pre-launch", cap: false },
  { tk: "DLR26", file: "delta-reign-index.html", lead: '<div class="eb">▮ Set Index · Sector Model', typed: " · Pre-launch", cap: true },
];

// named lines: tk · name · the phrase the creator tool typed (first run only) · fn(index entry) → text
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LINES = [
  { tk: "BF26", name: "street", typed: "Streets Wednesday, Sep 30.",
    text: (x) => {
      const rd = /^\d{4}-\d{2}-\d{2}$/.test(x.releaseDate || "") ? x.releaseDate : null;
      if (!rd) return null;
      return rd > TODAY ? `Streets ${DAYS[new Date(rd + "T12:00:00Z").getUTCDay()]}, ${monD(rd)}.` : `Released ${monD(rd)}.`;
    } },
  { tk: "BF26", name: "main", typed: "the college prospects' first Bowman autographs",
    text: () => "the college prospects' Bowman Chrome autographs" },
];

const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monD = (iso) => `${MONS[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}`;

function words(x, cap) {
  const hist = Array.isArray(x.history) ? x.history : [];
  const pre = x.status === "pre" || x.status === "pre-activation" || !hist.length;
  if (!pre) return "";
  const rd = /^\d{4}-\d{2}-\d{2}$/.test(x.releaseDate || "") ? x.releaseDate : null;
  if (!rd || rd > TODAY) return ` · ${cap ? "Pre-launch" : "pre-launch"}`;
  return ` · released ${monD(rd)} · no level yet`;
}

const IDX = JSON.parse(fs.readFileSync(path.join(REPO, "data/indices.json"), "utf8"));
const changed = [], same = [], skipped = [];
for (const p of PAGES) {
  const file = path.join(REPO, p.file);
  if (!fs.existsSync(file)) { skipped.push(`${p.file}: no such page`); continue; }
  const x = IDX[p.tk];
  if (!x) { skipped.push(`${p.file}: ${p.tk} not in data/indices.json`); continue; }
  const html0 = fs.readFileSync(file, "utf8");
  let html = html0;
  for (const L of LINES.filter((l) => l.tk === p.tk)) {
    const t = L.text(x);
    if (t == null) { skipped.push(`${p.file}: LINE:${L.tk}:${L.name} has no source value`); continue; }
    const LS = `<!-- LINE:${L.tk}:${L.name} -->`, LE = `<!-- /LINE:${L.tk}:${L.name} -->`;
    const ls = html.indexOf(LS), le = html.indexOf(LE);
    if (ls !== -1 && le > ls) html = html.slice(0, ls) + LS + t + LE + html.slice(le + LE.length);
    else if (ls !== -1 || le !== -1) skipped.push(`${p.file}: half a LINE:${L.tk}:${L.name} pair — fix the markers`);
    else if (html.split(L.typed).length === 2) html = html.replace(L.typed, LS + t + LE);
    else skipped.push(`${p.file}: LINE:${L.tk}:${L.name} phrase not found once — nothing to do`);
  }
  const S = `<!-- EYEBROW:${p.tk} -->`, E = `<!-- /EYEBROW:${p.tk} -->`;
  const body = `${S}${words(x, p.cap)}${E}`;
  let out;
  const s = html.indexOf(S), e = html.indexOf(E);
  if (s !== -1 && e > s) {
    out = html.slice(0, s) + body + html.slice(e + E.length);
  } else if (s !== -1 || e !== -1) {
    skipped.push(`${p.file}: half an EYEBROW:${p.tk} pair — fix the markers`); continue;
  } else {
    const at = html.indexOf(p.lead + p.typed);
    if (at === -1) { skipped.push(`${p.file}: eyebrow not found (block re-baked by another tool?) — nothing to do`); continue; }
    const k = at + p.lead.length;
    out = html.slice(0, k) + body + html.slice(k + p.typed.length);
  }
  if (out === html0) { same.push(p.file); continue; }
  changed.push(p.file);
  if (!CHECK) fs.writeFileSync(file, out);
}
console.log(`build-prelaunch-eyebrow: ${CHECK ? "would change" : "wrote"} ${changed.length} page(s)${changed.length ? " — " + changed.join(", ") : ""}; unchanged ${same.length}; skipped ${skipped.length}`);
for (const s of skipped) console.log("  skip: " + s);
if (CHECK && changed.length) process.exit(1);
