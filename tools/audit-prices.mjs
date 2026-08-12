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
const today = new Date();

// --- helpers -----------------------------------------------------------------
const stripCode = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
const visibleText = (html) => stripCode(html).replace(/<[^>]+>/g, " ");

// $$-style placeholder: 2+ dollar signs NOT followed by a digit (so "$$" "$$$+" "$$-$$$" hit, "$5" doesn't)
const PLACEHOLDER = /~?\$\$+(?!\d)[-+]?\$*\+?/g;

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

  // 4. WARN — stale price stamps
  const stamps = [...html.matchAll(/data-prices-updated="(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);
  for (const d of stamps) {
    const age = Math.floor((today - new Date(d)) / 86400000);
    if (age > STALE_DAYS) add(page, "WARN", "stale-prices", `price stamp ${d} is ${age} days old (limit ${STALE_DAYS})`);
    else pagesFresh++;
  }

  // 5. WARN — price table without a sold-comps disclaimer
  if (cells.length && !/sold comps|sold-market comps/i.test(text))
    add(page, "WARN", "no-disclaimer", `has ${cells.length} price cell(s) but no "sold comps" disclaimer text`);
}

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
