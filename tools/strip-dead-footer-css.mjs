#!/usr/bin/env node
// strip-dead-footer-css.mjs — Cupertino backlog #5, built by the CoS ruling session Nov 3 2026
// (claude/handoffs/cupertino-resolutions-2026-11-03.md). Pays back run 3's +0.76 KB CSS budget (BLOCKED row of Nov 2).
//
// Since run 3 (704e73c, Nov 2) every page's footer is written by tools/build-footer.js and uses the .sch-ft* classes;
// no page carries class="footer-inner|footer-links|footer-copy|footer-grid" any more, but ~720 pages still ship the old
// hand-written rules for them in their <style>. This removes exactly those rules:
//   - a line that is one rule whose every selector is .footer-inner / .footer-links / .footer-copy / .footer-grid
//     (with descendants or :hover), optionally followed by a /* comment */  → the line goes;
//   - a comma list that mixes them with live selectors (".rh-grid, .footer-grid {") → only the dead selectors go.
// Anything else that mentions them (several rules on one line, a rule spanning lines) is left and named, never guessed.
// Lines inside a generated marker block (<!-- X:START --> … <!-- X:END -->) are never touched. Idempotent: a second run
// writes nothing. Root *.html only (that is where every page lives).
//
// Usage: node tools/strip-dead-footer-css.mjs [--check]   (--check: exit 1 if any page would change; writes nothing)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const DEAD = /^\.footer-(?:inner|links|copy|grid)(?![\w-])[\w\s.:>#-]*$/;
const MENTION = /\.footer-(?:inner|links|copy|grid)(?![\w-])/;
const RULE = /^(\s*)([^{}]+?)\s*\{([^{}]*)\}\s*(\/\*[^*]*(?:\*(?!\/)[^*]*)*\*\/)?\s*$/;

function stripPage(html) {
  if (!MENTION.test(html)) return { out: html, removed: 0, left: [] };
  const lines = html.split("\n");
  const out = [];
  let depth = 0, removed = 0; const left = [];
  for (const line of lines) {
    const opens = (line.match(/<!-- [A-Z0-9_:-]+:START/g) || []).length;
    const closes = (line.match(/<!-- [A-Z0-9_:-]+:END -->/g) || []).length;
    const inBlock = depth > 0;
    depth = Math.max(0, depth + opens - closes);
    if (inBlock || opens || !MENTION.test(line)) { out.push(line); continue; }
    const m = RULE.exec(line);
    if (!m) { left.push(line.trim().slice(0, 80)); out.push(line); continue; }
    const sels = m[2].split(",").map((s) => s.trim());
    const live = sels.filter((s) => !DEAD.test(s));
    if (live.some((s) => MENTION.test(s))) { left.push(line.trim().slice(0, 80)); out.push(line); continue; }
    removed++;
    if (!live.length) continue;                              // the whole rule was dead
    out.push(`${m[1]}${live.join(", ")} {${m[3]}}${m[4] ? " " + m[4] : ""}`);
  }
  // an @media block left with nothing inside (its only rule was a dead footer rule) goes too
  let text = out.join("\n");
  if (removed) text = text.replace(/\n[ \t]*@media[^{}\n]*\{[ \t]*\n[ \t]*\}[ \t]*(?=\n)/g, "");
  return { out: text, removed, left };
}

const pages = fs.readdirSync(REPO).filter((f) => f.endsWith(".html")).sort();
let changed = 0, rules = 0, bytes = 0; const leftAll = [];
for (const f of pages) {
  const file = path.join(REPO, f);
  const html = fs.readFileSync(file, "utf8");
  const { out, removed, left } = stripPage(html);
  for (const l of left) leftAll.push(`${f}: ${l}`);
  if (out === html) continue;
  changed++; rules += removed; bytes += Buffer.byteLength(html) - Buffer.byteLength(out);
  if (!CHECK) fs.writeFileSync(file, out);
}
console.log(`strip-dead-footer-css: ${CHECK ? "would change" : "wrote"} ${changed} page(s), ${rules} rule(s), ${bytes} bytes; left ${leftAll.length}`);
for (const l of leftAll.slice(0, 20)) console.log("  left: " + l);
if (CHECK && changed) process.exit(1);
