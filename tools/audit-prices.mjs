#!/usr/bin/env node
// Pricing-integrity audit for shopcardhub.com
//
// Scans every root-level *.html page for:
//   FAIL  placeholder price symbols ($$, $$$, $$-$$$, $$$+ …) in visible text
//   FAIL  eBay affiliate links missing the mandatory EPN params (mkevt=1, campid=)
//   WARN  non-numeric price cells (<span class="roi-price"> with no digit — "Grail", "Varies", "TBD" …)
//   WARN  stale price stamps (data-prices-updated older than STALE_DAYS)
//   WARN  pages with a price table but no "sold comps" disclaimer text
//
// Usage:   node tools/audit-prices.mjs [--json report.json]
// Exit:    0 = clean (warnings allowed), 1 = at least one FAIL
//
// Run weekly via the price-audit GitHub Action (see tools/price-audit.yml
// — that file must be copied to .github/workflows/ through the GitHub web UI,
// because the current PAT lacks the `workflow` scope).

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const STALE_DAYS = 21;
// How far a human-readable prose date may lag the newest date on the same page
// before it counts as drift. 7 = one weekly re-mark cycle.
const PROSE_DRIFT_DAYS = 7;
const today = new Date();

// --- helpers -----------------------------------------------------------------
const stripCode = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
const visibleText = (html) => stripCode(html).replace(/<[^>]+>/g, " ");

// $$-style placeholder: 2+ dollar signs NOT followed by a digit (so "$$" "$$$+" "$$-$$$" hit, "$5" doesn't)
const PLACEHOLDER = /~?\$\$+(?!\d)[-+]?\$*\+?/g;

// check 10 (graded-claim-unsourced) — see the check for why
const GRADED_FIG = /\b(?:PSA|BGS|SGC|CGC)\s?(?:10|9\.5|9|8)\b[^$.]{0,40}?\$\s?[\d,]+(?:\.\d\d)?(?:\s?[KkMm])?/g;
const GMON = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?";
const GRADED_SRC = new RegExp(`dated sales?|no verified sale|\\b${GMON}\\s\\d{1,2}\\b|\\b\\d{1,2}/\\d{1,2}/\\d{2,4}\\b`, "i");
const GRADED_RETRACT = /struck|never (?:been )?a (?:verified )?sale|withdrawn|retract|corrected|was not a sale|guide estimate|not a sale|no verified/i;
// pages whose graded figures are worked examples, not market claims (the grading-ROI calculator)
const GRADED_EXAMPLE_PAGES = new Set(["psa-grading-guide.html"]);

const findings = []; // {page, level, type, detail}
const add = (page, level, type, detail) => findings.push({ page, level, type, detail });

const pages = readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
let pagesWithPrices = 0;
let pagesFresh = 0;

for (const page of pages) {
  const html = readFileSync(join(ROOT, page), "utf8");
  const text = visibleText(html);

  // 1. FAIL — placeholder symbols in visible text
  const ph = text.match(PLACEHOLDER);
  if (ph) add(page, "FAIL", "placeholder", `${ph.length}x price placeholder: ${[...new Set(ph)].join(" ")}`);

  // 2. FAIL — eBay links missing mandatory EPN params
  const ebayLinks = [...html.matchAll(/href="(https?:\/\/(?:www\.)?ebay\.com\/[^"]*)"/g)].map((m) => m[1]);
  const badLinks = ebayLinks.filter(
    (u) => u.includes("_nkw=") && (!u.includes("mkevt=1") || !u.includes("campid=")),
  );
  if (badLinks.length)
    add(page, "FAIL", "affiliate-link", `${badLinks.length} eBay search link(s) missing mkevt=1/campid — e.g. ${badLinks[0].slice(0, 90)}`);

  // 3. WARN — non-numeric price cells
  const cells = [...stripCode(html).matchAll(/class="roi-price"[^>]*>([\s\S]*?)<\/span>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").trim(),
  );
  if (cells.length) pagesWithPrices++;
  const wordCells = cells.filter((c) => c && !/\d/.test(c));
  if (wordCells.length)
    add(page, "WARN", "non-numeric-price", `${wordCells.length} price cell(s) with no number: ${[...new Set(wordCells)].slice(0, 6).join(" | ")}`);

  // 4. WARN — stale price stamps.
  //    A page may shorten its own fuse with data-prices-ttl="N" on the same element as the stamp.
  //    Added 2026-09-16: the 30th Celebration release-night tape is true for about three days —
  //    a 21-day default is how /pokemon-30th-anniversary-2026 served 33-day-old preorder copy on
  //    its release day in the first place. A page that makes a time-boxed claim declares the box.
  const stampTags = [...html.matchAll(/<[^>]*data-prices-updated="(\d{4}-\d{2}-\d{2})"[^>]*>/g)];
  const stamps = stampTags.map((t) => t[1]); // check 6 reads this
  for (const t of stampTags) {
    const d = t[1];
    const ttlM = t[0].match(/data-prices-ttl="(\d{1,3})"/);
    const limit = ttlM ? Number(ttlM[1]) : STALE_DAYS;
    const age = Math.floor((today - new Date(d)) / 86400000);
    if (age > limit)
      add(page, "WARN", "stale-prices", `price stamp ${d} is ${age} days old (limit ${limit}${ttlM ? ", page-declared ttl" : ""})`);
    else pagesFresh++;
  }

  // 5. WARN — price table without a sold-comps disclaimer
  if (cells.length && !/sold comps|sold-market comps/i.test(text))
    add(page, "WARN", "no-disclaimer", `has ${cells.length} price cell(s) but no "sold comps" disclaimer text`);

  // 7. FAIL — a GRADED figure labelled "sold" without saying how many dated sales are behind it.
  //    Filed 2026-09-16 after a build session published SportsCardsPro's grade LADDER — which is
  //    partly modelled from comparable cards — as "(sold)" on three pages. All three gates passed:
  //    the cells were numeric and stamped. A price-guide row is not a sale, and a date somewhere on
  //    the page is not provenance. The contract is now explicit: a graded figure reads either
  //    "(N dated sale(s))" or "No verified sale". The bare word "sold" on a graded tier is a FAIL.
  const GRADED_SOLD = /(?:PSA|BGS|SGC|CGC|Grade)\s*\d+(?:\.\d)?\s*(?:\(sold\)|sold\s*[:\-]?\s*\$)/gi;
  const unsourced = [...text.matchAll(GRADED_SOLD)].map((m) => m[0].replace(/\s+/g, " ").trim());
  if (unsourced.length)
    add(page, "FAIL", "sold-provenance", `${unsourced.length} graded figure(s) labelled "sold" with no sale count: ${[...new Set(unsourced)].slice(0, 6).join(" | ")} — use "(N dated sale)" or "No verified sale"`);

  // 8. WARN — an ask, a live bid or a BIN sitting in a price slot on a sold-basis page.
  //    Three of these shipped live on /aiva-arquette-1st-bowman ("$1,500 · Active Auction" in a
  //    price-main). Numeric and stamped, so every existing check passed them.
  const clean = stripCode(html);
  const ASKY = /active auction|current bid|\d+\s+bids\b|buy it now|\bBIN\b|asking price/i;
  const askSlots = [...clean.matchAll(/class="(?:price-main|roi-price|entry-stat-value)[^"]*"[^>]*>\s*\$[\d,]+(?:\.\d\d)?\s*</g)]
    .filter((m) => ASKY.test(clean.slice(Math.max(0, m.index - 250), m.index + 250).replace(/<[^>]+>/g, " ")));
  if (askSlots.length)
    add(page, "WARN", "ask-in-price-slot", `${askSlots.length} price slot(s) sit within 250 chars of auction/BIN/ask language — confirm the number is a sale, not a listing`);

  // 9. WARN — a page with a price table and no machine stamp at all is invisible to check 4.
  //    /roy-watch-2026 carried prose stamps and ~31 price cells and no data-prices-updated, so it
  //    aged four months without ever being flagged stale.
  if (cells.length && !/data-prices-updated=/.test(html))
    add(page, "WARN", "no-machine-stamp", `has ${cells.length} price cell(s) but no data-prices-updated attribute — the staleness check cannot see this page`);

  // 10. WARN — graded-claim-unsourced (iw-2026-09-17-4 + LANE-RULES R18, shipped 2026-09-22).
  //     Every other price check reads price CELLS, so a graded figure written in prose, a card strip or a
  //     hero chip passed FAIL 0 forever — /bowman-bangers carried five of them for weeks. This reads the
  //     page's visible TEXT: a "PSA/BGS/SGC/CGC <grade> … $<n>" with no dated-sale language, no date and
  //     no retraction language within ~200 chars is a graded figure nobody can trace. WARN, one per page,
  //     because the backlog predates the rule; the SCP graded sales-table pull clears it page by page.
  if (!GRADED_EXAMPLE_PAGES.has(page)) {
    const vt = text.replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ");
    const hits = [...vt.matchAll(GRADED_FIG)].filter((m) => {
      const win = vt.slice(Math.max(0, m.index - 80), m.index + m[0].length + 120);
      return !GRADED_SRC.test(win) && !GRADED_RETRACT.test(win);
    });
    if (hits.length)
      add(page, "WARN", "graded-claim-unsourced", `${hits.length} graded figure(s) in text with no dated sale / date near them — e.g. "${hits[0][0].slice(0, 60)}" — R18: one row with date + grade + price, or "No verified sale"`);
  }

  // 6. WARN — prose date stamps that disagree with the page's freshest date.
  // Added Aug 25, 2026: the bowman-bangers footer sat on "August 18, 2026" for a
  // week after the Tuesday re-mark refreshed every price above it. Machine-readable
  // data-prices-updated attributes were checked; the human-readable prose stamps in
  // the disclosure blocks were not, so drift was invisible. Any prose stamp more
  // than PROSE_DRIFT_DAYS behind the newest date on the same page is a WARN.
  // Scope: the affiliate-disclosure / footer sentences that make a dated claim about
  // the page's prices ("Card prices sourced from ... August 18, 2026"). Two earlier
  // passes — every prose date, then any date near a price-ish cue — produced ~90 and
  // ~5 false positives respectively, all of them release dates. This is the class
  // that actually drifts, because the weekly re-mark rewrites price rows and leaves
  // the footer sentence behind.
  const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";
  const MON3 = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
  const DATE = `(?:(?:${MONTHS})|(?:${MON3}))\\.?\\s+\\d{1,2},\\s+20\\d{2}`;
  // A claim sentence: mentions prices AND (sourced|estimates|based on|comps|solds),
  // then carries a date. Matched sentence-locally so a nearby release date can't leak in.
  const CLAIM = `(?:card |all )?prices?[^.<>]{0,120}?(?:sourced|estimates?|based on|comps?|solds?|listings)[^.<>]{0,120}?(${DATE})`;
  const proseDates = [...stripCode(html).replace(/<[^>]+>/g, " ").matchAll(new RegExp(CLAIM, "gi"))]
    .map((m) => ({ raw: m[1], whole: m[0], date: new Date(`${m[1].replace(/\./g, "")} UTC`) }))
    // Drop "Released <date>" / "Launches <date>" — that's a street date riding in the
    // same run-on sentence as a price claim, not a stamp on the prices themselves.
    .filter((d) => !/(?:released?|releases|launch(?:ed|es)?|street date|drops?)\s*$/i.test(d.whole.slice(0, d.whole.lastIndexOf(d.raw))))
    .filter((d) => !isNaN(d.date) && d.date <= today);
  if (proseDates.length) {
    // Baseline = the freshest date anywhere on the page (any prose date, plus any
    // data-prices-updated attribute). Deliberately broader than the flagging set:
    // in the bug this check exists for, the hero read "Updated Aug 25" while the
    // footer still said Aug 18. Scoring claim dates only against each other makes a
    // uniformly stale page look fresh to itself, which is how the drift survived.
    const everyDate = [...stripCode(html).replace(/<[^>]+>/g, " ").matchAll(new RegExp(DATE, "gi"))]
      .map((m) => new Date(`${m[0].replace(/\./g, "")} UTC`))
      .filter((d) => !isNaN(d) && d <= today);
    const allDates = [...everyDate, ...proseDates.map((d) => d.date), ...stamps.map((s) => new Date(s))].filter((d) => !isNaN(d));
    const newest = new Date(Math.max(...allDates.map((d) => +d)));
    const seen = new Set();
    for (const { raw, date } of proseDates) {
      const drift = Math.floor((newest - date) / 86400000);
      // >= not >: a stamp exactly one weekly cycle (7 days) behind is the canonical
      // failure — the re-mark ran, the footer didn't move.
      if (drift >= PROSE_DRIFT_DAYS && !seen.has(raw)) {
        seen.add(raw);
        add(page, "WARN", "stale-prose-stamp", `price stamp "${raw}" is ${drift} days behind this page's newest date (${newest.toISOString().slice(0, 10)}) — refresh it or it will outlive its prices`);
      }
    }
  }
}

// 10b. WARN — the same test over data/calls.json strings, which /track-record renders client-side and no
//      gate read until 2026-09-22 (iw-2026-09-18-1 found four retracted PSA 10 figures there).
try {
  const calls = JSON.parse(readFileSync(join(ROOT, "data/calls.json"), "utf8"));
  const rows = Array.isArray(calls) ? calls : calls.calls || [];
  let n = 0, eg = "";
  for (const c of rows) for (const k of ["readLabel", "note", "thesis", "label"]) {
    const v = typeof c[k] === "string" ? c[k] : "";
    for (const m of v.matchAll(GRADED_FIG)) {
      const win = v.slice(Math.max(0, m.index - 80), m.index + m[0].length + 120);
      if (!GRADED_SRC.test(win) && !GRADED_RETRACT.test(win)) { n++; eg ||= `${c.id}.${k}: "${m[0].slice(0, 50)}"`; }
    }
  }
  if (n) add("data/calls.json", "WARN", "graded-claim-unsourced", `${n} graded figure(s) with no dated sale near them — e.g. ${eg}`);
} catch (e) { /* no calls.json in this tree */ }

// --- report ------------------------------------------------------------------
const fails = findings.filter((f) => f.level === "FAIL");
const warns = findings.filter((f) => f.level === "WARN");

console.log(`Pricing-integrity audit — ${today.toISOString().slice(0, 10)}`);
console.log(`${pages.length} pages scanned · ${pagesWithPrices} with price tables · ${pagesFresh} fresh stamps`);
console.log(`FAIL: ${fails.length}   WARN: ${warns.length}\n`);
for (const f of [...fails, ...warns]) console.log(`  [${f.level}] ${f.page} — ${f.type}: ${f.detail}`);
if (!findings.length) console.log("  ✔ clean — no placeholders, no broken EPN links, nothing stale.");

const jsonIdx = process.argv.indexOf("--json");
if (jsonIdx > -1 && process.argv[jsonIdx + 1]) {
  writeFileSync(process.argv[jsonIdx + 1], JSON.stringify({
    date: today.toISOString().slice(0, 10),
    pages: pages.length, pagesWithPrices, pagesFresh,
    fails: fails.length, warns: warns.length, findings,
  }, null, 2));
}

process.exit(fails.length ? 1 : 0);
