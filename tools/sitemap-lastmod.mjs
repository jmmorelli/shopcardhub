#!/usr/bin/env node
// tools/sitemap-lastmod.mjs — real <lastmod> dates for sitemap.xml (B63, Google index fixes, Oct 9 2026).
//
// Why: 17 sitemap URLs carried 2026-06-16 (the hand-typed launch date) including / and /best-hobby-boxes-2026, while
// the pages changed weekly. Google reads lastmod as a crawl hint; a stale one tells it the page is dead. Search
// Console Oct 9: 102 known, 3 indexed. Nothing wrote lastmod except tools/league/integrate.mjs (TODAY, new rows only).
//
// What: for every <url> in sitemap.xml, lastmod = the date of the page file's last CONTENT commit, from git history.
// A commit does not count as content when every changed line of that file sits inside a shared generated block
// (<!-- NAV:START/END -->, RAIL, SIGNUP) or only moves a price stamp (data-prices-updated / re-marked / price-asof).
// A file modified or staged in the working tree (the nightly bakes it, then runs this before committing) = today.
// New rows integrate.mjs adds with TODAY are therefore right as well.
//
// Usage:
//   node tools/sitemap-lastmod.mjs            # rewrite sitemap.xml in place (needs full git history)
//   node tools/sitemap-lastmod.mjs --check    # print what would change, exit 1 if anything is stale, write nothing
//   node tools/sitemap-lastmod.mjs --verbose  # one line per URL
// A shallow clone (actions/checkout default fetch-depth 1) would date every page to the one commit it has, so the
// tool refuses to write there and says so. price-snapshot.yml checks out main with fetch-depth: 0 for this.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const VERBOSE = process.argv.includes("--verbose");
// local date, the same clock git stamps %cs with (UTC would roll a 5 pm PT build onto the next day)
const TODAY = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
const MAX_COMMITS = 80; // per file; older than that, the oldest commit in the window dates it

const git = (...args) => execFileSync("git", args, { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

// Shared generated blocks whose rewrite is not a content change for the page
const BLOCKS = ["NAV", "RAIL", "SIGNUP"];
// A changed line that only moves a stamp
const STAMP_RE = /data-prices-updated=|class="price-asof"|re-marked \d{2}\/\d{2}\/\d{2}|data-asof=|data-feed-day=|<lastmod>/;

let shallow = false;
try { shallow = git("rev-parse", "--is-shallow-repository").trim() === "true"; } catch { shallow = true; }

const dirty = new Set();
try {
  for (const line of git("status", "--porcelain", "--untracked-files=all").split("\n")) {
    if (!line.trim()) continue;
    const f = line.slice(3).split(" -> ").pop().trim();
    dirty.add(f);
  }
} catch { /* no git: everything falls back to the existing lastmod */ }

function blockRanges(text) {
  // 1-based inclusive line ranges that are not page content: shared generated blocks, <style> and <script> bodies
  const lines = text.split("\n"), out = [];
  for (const b of BLOCKS) {
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (start < 0 && lines[i].includes(`<!-- ${b}:START`)) start = i + 1;   // marker comments may carry a note after the key
      else if (start >= 0 && lines[i].includes(`<!-- ${b}:END`)) { out.push([start, i + 1]); start = -1; }
    }
  }
  for (const [open, close] of [[/<style[\s>]/i, /<\/style>/i], [/<script[\s>]/i, /<\/script>/i]]) {
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (start < 0 && open.test(lines[i])) { start = i + 1; if (close.test(lines[i])) start = -1; }
      else if (start >= 0 && close.test(lines[i])) { out.push([start, i + 1]); start = -1; }
    }
  }
  return out;
}
const inRanges = (ranges, n) => ranges.some(([a, b]) => n >= a && n <= b);
// A changed line that is not page content on its own: stamps, blank, head links, comments
const NOISE_RE = /^\s*(<link\s|<!--|<\/?style|<\/?script)/i;

// Does this diff change the file's CONTENT (not shared blocks, CSS/JS, head links or stamps)?
// sha = a commit (diff vs its parent) or "WORK" (the working tree vs HEAD, for files the current run modified).
function isContentCommit(sha, file) {
  const work = sha === "WORK";
  let diff;
  try { diff = work ? git("diff", "--unified=0", "HEAD", "--", file) : git("show", "--format=", "--unified=0", sha, "--", file); } catch { return true; }
  if (!diff.trim()) return !work; // rename/mode only: count it (rare); a clean working tree is no change
  if (!/^@@ /m.test(diff)) return true; // binary/odd output: count it
  if (!work) {
    let parentOk = true;
    try { git("rev-parse", "--verify", "--quiet", `${sha}^`); } catch { parentOk = false; }
    if (!parentOk) return true; // the root commit
  }
  let newRanges = null, oldRanges = null;
  const ranges = (side) => {
    if (newRanges == null) {
      let newText = "", oldText = "";
      if (work) { try { newText = fs.readFileSync(path.join(REPO, file), "utf8"); } catch { /* deleted */ } try { oldText = git("show", `HEAD:${file}`); } catch { /* new */ } }
      else { try { newText = git("show", `${sha}:${file}`); } catch { /* deleted */ } try { oldText = git("show", `${sha}^:${file}`); } catch { /* new file */ } }
      newRanges = blockRanges(newText); oldRanges = blockRanges(oldText);
    }
    return side === "+" ? newRanges : oldRanges;
  };
  const lines = diff.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!m) continue;
    let oldN = +m[1], newN = +m[3];
    for (let j = i + 1; j < lines.length && !lines[j].startsWith("@@"); j++) {
      const l = lines[j];
      if (!/^[+-]/.test(l)) continue;
      const side = l[0], text = l.slice(1), n = side === "+" ? newN++ : oldN++;
      if (!text.trim() || STAMP_RE.test(text) || NOISE_RE.test(text)) continue;
      if (inRanges(ranges(side), n)) continue;
      if (process.env.SLM_DEBUG) console.error(`content line ${sha.slice(0,7)} ${file}:${side}${n} ${text.slice(0,80)}`);
      return true; // one real content line is enough
    }
  }
  return false;
}

function contentDate(file) {
  if (dirty.has(file)) {
    // modified in this run: today if the working-tree diff is content; a script-tag bump or CSS edit alone is not
    let tracked = true; try { git("cat-file", "-e", `HEAD:${file}`); } catch { tracked = false; }
    if (!tracked || isContentCommit("WORK", file)) return { date: TODAY, how: "working tree" };
  }
  let log;
  try { log = git("log", `-${MAX_COMMITS}`, "--format=%H %cs", "--", file).trim(); } catch { return null; }
  if (!log) return null;
  const rows = log.split("\n").map((l) => l.split(" "));
  for (const [sha, date] of rows) if (isContentCommit(sha, file)) return { date, how: sha.slice(0, 7) };
  const [sha, date] = rows[rows.length - 1];
  return { date, how: `oldest in window ${sha.slice(0, 7)}` };
}

const smPath = path.join(REPO, "sitemap.xml");
let xml = fs.readFileSync(smPath, "utf8");
const urls = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
let changed = 0, missing = 0, same = 0;
const report = [];
for (const u of urls) {
  const loc = (u.match(/<loc>\s*([^<\s]+)\s*<\/loc>/) || [])[1];
  if (!loc) continue;
  const p = new URL(loc).pathname.replace(/\/$/, "");
  const file = p ? `${p.slice(1)}.html` : "index.html";
  if (!fs.existsSync(path.join(REPO, file))) { missing++; report.push(`?  ${p || "/"}  (no file ${file})`); continue; }
  const cur = (u.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/) || [])[1] || null;
  const d = contentDate(file);
  if (!d) { report.push(`?  ${p || "/"}  (no git history) keeps ${cur}`); continue; }
  if (cur === d.date) { same++; if (VERBOSE) report.push(`=  ${p || "/"}  ${cur}`); continue; }
  changed++;
  report.push(`${cur ? "~" : "+"}  ${p || "/"}  ${cur || "(none)"} -> ${d.date}  [${d.how}]`);
  const nu = cur ? u.replace(/<lastmod>\s*[^<]*<\/lastmod>/, `<lastmod>${d.date}</lastmod>`) : u.replace(/(<loc>[^<]*<\/loc>)/, `$1\n    <lastmod>${d.date}</lastmod>`);
  xml = xml.replace(u, nu);
}
for (const l of report) console.log(l);
console.log(`sitemap-lastmod: ${urls.length} urls · ${changed} to update · ${same} already right · ${missing} without a file${shallow ? " · SHALLOW CLONE" : ""}`);
if (shallow) { console.log("refusing to write from a shallow clone (every date would be the checkout commit) - fetch full history first"); process.exit(CHECK && changed ? 1 : 0); }
if (CHECK) process.exit(changed ? 1 : 0);
if (changed) { fs.writeFileSync(smPath, xml); console.log("wrote sitemap.xml"); }
