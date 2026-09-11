#!/usr/bin/env node
// build-guide-fold.mjs — fold a card page's rookie guide under the engine block (Terminal step 1, Sep 11 2026).
//
// The number is the page; the essay is the footnote. Every essay <section> between the ENGINE block
// and the social strip / "Gear…" / "More From…" sections is wrapped in <details class="guide-fold">
// whose <summary> carries the section's <h2> (moved, not copied — one visible heading per fold, the
// h2 element stays on the page) plus a right-aligned date stamp taken from the section's own text.
// The "Every … Card — Ranked" fold is open by default (it holds the ★ Track buttons and the affiliate
// links); the rest are closed. The June stat banner + disclosure container and the hero's
// div.snapshot-notice move INTO the first fold as its lead — they are context, not the page.
// The fold region sits between <!-- FOLD:START --> and <!-- FOLD:END -->, and the page gets
// <link rel="stylesheet" href="/css/terminal-page.css"> after its inline <style> (so it overrides).
//
// Usage:  node tools/build-guide-fold.mjs <page.html> [<page.html> …]   (paths relative to the repo root)
//         node tools/build-guide-fold.mjs --dry <page.html>              (report only)
// Idempotent: a page that already carries FOLD:START is left alone (refuses to double-wrap).
// Never touches anything between NAV:START/END, DEST:START/END or ENGINE:START/END.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!files.length) { console.error("usage: node tools/build-guide-fold.mjs [--dry] <page.html> …"); process.exit(2); }

const CSS_LINK = '<link rel="stylesheet" href="/css/terminal-page.css?v=1">';
const STOP_H2 = /^(gear for|more from|related|other .* to know|explore)/i; // sections that stay outside the fold
const OPEN_H2 = /\bcard(s)?\s*[—–-]\s*ranked\b|\branked\b/i;                // the ranked list stays open

// ---- balanced-tag scanner: index just past the </tag> that closes the <tag …> opening at `start` ----
function closeOf(html, start, tag) {
  const re = new RegExp(`<(/?)${tag}(?=[\\s>])[^>]*>`, "gi");
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[1]) { depth--; if (depth === 0) return m.index + m[0].length; }
    else depth++;
  }
  throw new Error(`unbalanced <${tag}> from ${start}`);
}
const text = (s) => s.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// ---- date stamp: the price-claim date already in the section, never a narrative date ----
const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec";
const MON3 = { january: "Jan", february: "Feb", march: "Mar", april: "Apr", may: "May", june: "Jun", july: "Jul", august: "Aug", september: "Sep", sept: "Sep", october: "Oct", november: "Nov", december: "Dec" };
const short = (mon) => MON3[mon.toLowerCase()] || (mon.slice(0, 3)[0].toUpperCase() + mon.slice(1, 3).toLowerCase());
function stamp(sectionHtml, underReverification) {
  const t = text(sectionHtml);
  let m;
  if ((m = t.match(new RegExp(`re-?checked\\s+(${MONTHS})\\.?\\s+(\\d{1,2})(?:,\\s*20\\d{2})?`, "i")))) return `${short(m[1])} ${+m[2]} re-check`;
  // "prices/figures/comps/sold/listings … <Month YYYY>" — the sentence that dates the numbers
  const CUE = "(?:prices?|figures?|comps?|solds?|sales|listings|snapshot|as of|updated)";
  if ((m = t.match(new RegExp(`${CUE}[^.]{0,160}?\\b(${MONTHS})\\.?\\s+(?:(\\d{1,2}),\\s+)?(20\\d{2})\\b`, "i")))) {
    const s = m[2] ? `${short(m[1])} ${+m[2]}, ${m[3]}` : `${m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()} ${m[3]}`;
    return underReverification && /june 2026/i.test(s) ? `${s} · under re-verification` : s;
  }
  return "guide";
}

let touched = 0;
for (const rel of files) {
  const file = path.resolve(REPO, rel);
  let html = fs.readFileSync(file, "utf8");
  const name = path.relative(REPO, file);
  if (html.includes("<!-- FOLD:START")) { console.log(`${name}: already folded — skipping (refuses to double-wrap)`); continue; }
  const engineEnd = html.indexOf("<!-- ENGINE:END -->");
  if (engineEnd < 0) { console.log(`${name}: no <!-- ENGINE:END --> — skipping (the fold hangs off the engine block)`); continue; }

  // 1. hero snapshot notice (optional) — lifted out of the hero, dropped into the first fold's lead
  let notice = "";
  {
    const heroStart = html.indexOf('<section class="hero"');
    const heroEnd = heroStart >= 0 ? closeOf(html, heroStart, "section") : -1;
    const ni = html.indexOf('<div class="snapshot-notice"');
    if (heroStart >= 0 && ni > heroStart && ni < heroEnd) {
      const ne = closeOf(html, ni, "div");
      // take the tag, drop its inline style so css/terminal-page.css can restyle it as one amber line
      notice = html.slice(ni, ne).replace(/^<div class="snapshot-notice"[^>]*>/, '<div class="snapshot-notice">');
      // also lift the CoS comment that annotates it, if it sits directly above
      let cut = ni; const cm = html.slice(heroStart, ni).match(/\n(\s*<!-- SNAPSHOT NOTICE[\s\S]*?-->\s*)$/);
      if (cm) cut = ni - cm[1].length;
      html = html.slice(0, cut).replace(/\s+$/, "\n") + html.slice(ne).replace(/^\s*\n/, "\n");
    }
  }
  const underRev = /under re-verification/i.test(text(notice));

  // 2. walk the top-level blocks after ENGINE:END until the first non-guide block
  const start = html.indexOf("<!-- ENGINE:END -->") + "<!-- ENGINE:END -->".length;
  let i = start, lead = null, sections = [], end = start;
  const tagAt = (pos) => { const m = html.slice(pos).match(/^<([a-z0-9]+)([^>]*)>/i); return m ? { tag: m[1].toLowerCase(), attrs: m[2] } : null; };
  while (i < html.length) {
    const ws = html.slice(i).match(/^\s*/)[0].length; i += ws;
    if (html.startsWith("<!--", i)) { i = html.indexOf("-->", i) + 3; continue; } // banner comments ride along
    const t = tagAt(i); if (!t) break;
    if (t.tag === "footer" || t.tag === "script" || t.tag === "style") break;
    const close = closeOf(html, i, t.tag);
    const block = html.slice(i, close);
    if (t.tag === "div") {
      if (/class="container"/.test(t.attrs) && /stat-banner|class="disclosure/.test(block) && !lead && !sections.length) { lead = { s: i, e: close }; i = close; end = close; continue; }
      break; // social strip or anything else → the guide is over
    }
    if (t.tag !== "section") break;
    const h2 = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (!h2 || STOP_H2.test(text(h2[1]))) break;
    sections.push({ s: i, e: close, h2: h2[0], h2text: text(h2[1]) });
    i = close; end = close;
  }
  if (!sections.length) { console.log(`${name}: no essay <section> after the engine block — nothing to fold`); continue; }

  // 3. build the fold region
  let leadHtml = "";
  if (notice || lead) {
    const inner = lead ? html.slice(lead.s, lead.e).replace(/^<div class="container">/, "").replace(/<\/div>\s*(<!--\s*\/container\s*-->)?\s*$/, "") : "";
    leadHtml = `\n  <div class="container gf-lead">${notice ? "\n    " + notice : ""}${inner}\n  </div>`;
  }
  const folds = sections.map((sec, k) => {
    const body = html.slice(sec.s, sec.e).replace(sec.h2, "");                      // h2 moves into the summary
    const h2 = sec.h2.replace(/<h2([^>]*)>/, (m0, a) => `<h2${/class="/.test(a) ? a.replace(/class="/, 'class="gf-h2 ') : ` class="gf-h2"${a}`}>`);
    sec.open = OPEN_H2.test(sec.h2text) && !/ranked by/i.test(sec.h2text);
    sec.stamp = stamp(html.slice(sec.s, sec.e), underRev);
    if (k === 0 && sec.stamp === "guide" && notice) sec.stamp = stamp(notice, underRev); // the lead's own stamp dates the first fold
    return `<details class="guide-fold"${sec.open ? " open" : ""} data-fold="${k + 1}">\n  <summary>${h2}<span class="gf-stamp">${sec.stamp}</span></summary>${k === 0 ? leadHtml : ""}\n${body}\n</details>`;
  });
  const region = `\n\n<!-- FOLD:START — rookie guide folded under the engine block, generated by tools/build-guide-fold.mjs (Sep 11 2026). Re-run the tool to rebuild; it refuses to double-wrap. -->\n<div class="guide-wrap" id="guide" aria-label="Rookie guide">\n${folds.join("\n\n")}\n</div>\n<!-- FOLD:END -->\n\n`;

  // 4. splice: everything from ENGINE:END to the last folded section is replaced by the region
  html = html.slice(0, start) + region + html.slice(end).replace(/^\s*\n/, "");

  // 5. stylesheet after the inline <style> (last thing before </head>) so it overrides the page's own rules
  if (!html.includes("/css/terminal-page.css")) html = html.replace("</head>", `  ${CSS_LINK}\n</head>`);

  if (!DRY) fs.writeFileSync(file, html);
  touched++;
  console.log(`${name}: ${DRY ? "would fold" : "folded"} ${sections.length} section(s)${lead ? " + stat banner/disclosure lead" : ""}${notice ? " + snapshot notice" : ""}:\n  ` +
    sections.map((s) => `${s.open ? "[open]  " : "[closed]"} ${s.h2text}  ·  ${s.stamp}`).join("\n  "));
}
console.log(`${DRY ? "would update" : "updated"} ${touched} page(s)`);
