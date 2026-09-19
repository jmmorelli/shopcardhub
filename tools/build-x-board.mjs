#!/usr/bin/env node
/* build-x-board.mjs — writes data/x-board.json, the X desk's machine-readable copy of the board.
 *
 * Why this exists: the vendor desk (Grok Bot) was promised two fixed URLs it could read without
 * scraping a page or inventing a number — og/x/board-latest.png and data/x-board.json
 * (claude/lanes/bowman-bangers-tuesday.md). Only the dated PNG was ever written, so both URLs 404'd
 * from Sep 8 to Sep 19 2026 and the desk re-reported the gap on an hourly loop for days.
 *
 * Every field is PARSED OFF bowman-bangers.html or read from data/calls.json. Nothing is computed,
 * rounded, restated or inferred here — if the page does not say it, this file does not carry it.
 * That includes the ranking rule, which changed on 2026-09-17: it is read from the page's own
 * intro sentence, never hardcoded.
 *
 * Usage: node tools/build-x-board.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");

const page = read("bowman-bangers.html");
const strip = (t) =>
  t.replace(/<[^>]+>/g, "")
    .replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&minus;/g, "−").replace(/&mdash;/g, "—").replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();

const asOf = (page.match(/data-prices-updated="(\d{4}-\d{2}-\d{2})"/) || [])[1];
if (!asOf) throw new Error("no data-prices-updated stamp on bowman-bangers.html");

// The ranking rule, in the page's own words. One sentence, first section-intro.
const rankingRule = strip((page.match(/<p class="section-intro">([\s\S]*?)<\/p>/) || [])[1] || "");
if (!rankingRule) throw new Error("no ranking rule (p.section-intro) on bowman-bangers.html");

// The week's market-check callout.
const callout = strip((page.match(/&#9889; <strong>([\s\S]*?)<\/strong>/) || [])[1] || "");

// Open verdicts for this page, keyed by the card string in data/calls.json.
const calls = JSON.parse(read("data/calls.json")).calls.filter((c) => c.page === "/bowman-bangers");

const seats = [];
const re = /<div class="entry-rank">(\d\d)<\/div>([\s\S]*?)<div class="entry-since">([\s\S]*?)<\/div>/g;
for (const m of page.matchAll(re)) {
  const [, rank, blk, sinceRaw] = m;
  const title = strip((blk.match(/<div class="entry-title">([\s\S]*?)<\/div>/) || [])[1] || "");
  const player = strip((blk.match(/<div class="entry-title">([\s\S]*?)<br>/) || [])[1] || "");
  const sub = strip((blk.match(/<div class="price-sub">([\s\S]*?)<\/div>/) || [])[1] || "");
  const parts = sub.split("·").map((s) => s.trim());
  const pick = (p) => (parts.find((x) => x.startsWith(p)) || "").slice(p.length).trim();
  const since = strip(sinceRaw);

  // A verdict belongs to this seat when data/calls.json names the same player. A player can hold
  // more than one call (Fischer has a finalised Jun 12 BUY and a live Sep 11 re-entry) — the seat
  // carries the CURRENT one: newest call date, and a live call always beats a finalised one.
  const surname = player.split(" ").slice(-1)[0].toLowerCase();
  const mine = calls.filter((c) => (c.card || "").toLowerCase().includes(surname))
    .sort((a, b) => (a.state === "final") - (b.state === "final") ||
                    String(b.callDate).localeCompare(String(a.callDate)));
  const call = mine[0] || null;
  const priorCalls = mine.slice(1).map((c) => ({ id: c.id, action: c.action, callDate: c.callDate, state: c.state, grade: c.grade ?? null }));

  seats.push({
    rank: Number(rank),
    player,
    card: title,
    tag: strip((blk.match(/<div class="entry-sport-tag[^"]*">([\s\S]*?)<\/div>/) || [])[1] || ""),
    marks: {
      // Each mark carries its own label. The desk must never blend a sold figure with an ask.
      rawSold: pick("SCP raw") || null,
      psa10: pick("PSA 10") || null,          // includes its own sale count, or says there is none
      engineAsk: pick("engine") || null,      // eBay ask, labeled, never a sold price
      headlineRange: strip((blk.match(/<div class="price-main">([\s\S]*?)<\/div>/) || [])[1] || "") || null,
      basisNote: sub,                         // the page's full price line, verbatim
      asOf,
    },
    board: {
      since: (since.match(/ON THE BOARD SINCE ([^·]+)/) || [])[1]?.trim() || null,
      suggestedSizing: (since.match(/SUGGESTED SIZING (.+)$/) || [])[1]?.trim() || null,
    },
    verdict: call
      ? {
          id: call.id, action: call.action, callDate: call.callDate,
          entry: call.entry, entryLabel: call.entryLabel, basis: call.basis,
          state: call.state, grade: call.grade ?? null,
          gradedAt: "6 and 12 months", scorecard: "https://shopcardhub.com/track-record#" + call.id,
          priorCalls,
        }
      : null,
  });
}
if (seats.length < 5) throw new Error(`parsed only ${seats.length} seats off bowman-bangers.html`);

const out = {
  _comment:
    "GENERATED by tools/build-x-board.mjs — do not hand-edit. Every value is parsed off " +
    "bowman-bangers.html or data/calls.json at build time. Regenerate at publish time so the " +
    "as-of stamp is honest. Companion image: og/x/board-latest.png (same fixed-path contract).",
  asOf,
  generated: new Date().toISOString(),
  source: "https://shopcardhub.com/bowman-bangers",
  image: "https://shopcardhub.com/og/x/board-latest.png",
  rankingRule,
  callout,
  marksPolicy:
    "Sold comps and asks are separate figures and are never blended. A PSA 10 line states the sale " +
    "count behind it, or states that there is no verified sale. Calls are graded at 6 and 12 months only.",
  seats: seats.slice(0, 5),
};

const json = JSON.stringify(out, null, 1) + "\n";
if (DRY) { console.log(json); process.exit(0); }
fs.writeFileSync(path.join(REPO, "data/x-board.json"), json);
console.log(`data/x-board.json — ${out.seats.length} seats, as of ${asOf}`);
