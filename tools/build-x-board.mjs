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

// The week's market-check callout — UNLESS a dated "Correction · <date>" block newer than the tape column
// exists on the page, in which case the correction IS the callout. Sep 21 2026: the page carried
// "Gonzales takes #4 from Florentino" (Sep 15 column) under a "Correction · Sep 18" block that re-seated
// him #3; this file and the tape image printed the superseded sentence beneath a table that contradicted it.
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const isoOf = (mon, d, y) => `${y}-${String(MONTHS[mon]).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const tapeCallout = strip((page.match(/&#9889; <strong>([\s\S]*?)<\/strong>/) || [])[1] || "");
let callout = tapeCallout, calloutBasis = "tape column";
for (const m of page.matchAll(/<div class="section-eyebrow">Correction\s*(?:&middot;|·)\s*([A-Z][a-z]{2}) (\d{1,2}), (\d{4})<\/div>\s*<div class="alert-bar"[^>]*>([\s\S]*?)<\/div>/g)) {
  const [, mon, d, y, body] = m;
  const iso = isoOf(mon, d, y);
  if (iso <= asOf) continue;                       // older than the tape column: the column stands
  const text = strip(body);
  const seatsSentence = ((text.match(/seats now read[^.]*\./) || [])[0] || "").replace(/^seats/, "The seats");
  callout = `Correction · ${mon} ${d}, ${y}: ${strip((body.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || "")} ${seatsSentence}`.replace(/\s+/g, " ").trim();
  calloutBasis = `correction block dated ${iso}`;
}

// Open verdicts for this page, keyed by the card string in data/calls.json.
const calls = JSON.parse(read("data/calls.json")).calls.filter((c) => c.page === "/bowman-bangers");

const seats = [];
const re = /<div class="entry-rank">(\d\d)<\/div>([\s\S]*?)<div class="entry-since">([\s\S]*?)<\/div>/g;
const seatMatches = [...page.matchAll(re)];
for (const [mi, m] of seatMatches.entries()) {
  const [, rank, blk, sinceRaw] = m;
  // Everything belonging to this seat, up to the next seat — the verdict paragraph sits after entry-since.
  const seatHtml = page.slice(m.index, mi + 1 < seatMatches.length ? seatMatches[mi + 1].index : m.index + 20000);
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

  // The CURRENT signal is what a reader sees on the page: the "Signal" stat when the seat carries one, else
  // the "Verdict: <Word>" lead of the entry's verdict paragraph. It is NOT the logged Scorecard call below —
  // those were published under the same word ("verdict") until Sep 21 2026 and contradicted the page on
  // three of five seats (Fischer BUY vs HOLD, Holliday BUY vs SELL, Kim WAIT vs PASS).
  const sigStat = (seatHtml.match(/<div class="entry-stat-label">Signal<\/div>\s*<div class="entry-stat-value[^"]*">([^<]+)<\/div>/) || [])[1];
  const sigVerdict = (seatHtml.match(/<div class="entry-verdict"><strong>Verdict: ([A-Za-z]+)/) || [])[1];
  const currentSignal = (sigStat || sigVerdict || "").trim().toUpperCase() || null;
  if (!currentSignal) throw new Error(`seat ${rank} ${player}: no Signal stat and no "Verdict:" line on bowman-bangers.html — refusing to ship a file with only the historical call`);
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
    // What the page says NOW. Vocabulary is the page's: BUY / HOLD / SELL / PASS / WATCH. Use THIS for any
    // per-card line. "WAIT" is a calls.json state and appears on no public surface.
    currentSignal,
    currentSignalSource: sigStat ? "Signal stat on the seat" : "Verdict: line on the seat",
    // The logged Scorecard call — a dated, immutable projection graded at 6 and 12 months. Historical.
    loggedCall: call
      ? {
          scope: "the logged Scorecard call, not the board's current signal — never quote it as the current call",
          id: call.id, action: call.action, callDate: call.callDate,
          entry: call.entry, entryLabel: call.entryLabel, basis: call.basis,
          state: call.state,
          // A grade exists only on a finalised call that carries one. Florentino's trending call carried
          // grade:"wrong" in calls.json while the page said "not yet graded — first real grade Dec 2026".
          grade: call.state === "final" && call.grade ? call.grade : null,
          gradeStatus: call.state === "final" ? (call.grade ? "graded" : "finalised, no grade recorded") : "not yet graded — first grade at 6 months, final at 12",
          gradedAt: "6 and 12 months", scorecard: "https://shopcardhub.com/track-record#" + call.id,
          priorCalls,
        }
      : null,
  });
}
if (seats.length < 5) throw new Error(`parsed only ${seats.length} seats off bowman-bangers.html`);

// The callout may not name a seat number that disagrees with the table it sits under — the exact check
// that would have caught the Sep 21 "Gonzales takes #4" caption beneath a table seating him #3.
for (const st of seats.slice(0, 5)) {
  const sn = st.player.split(" ").slice(-1)[0];
  // Affirmative seatings only: "3 Gonzales", "#3 Gonzales", "Gonzales takes #4", "Gonzales to #4". A negation
  // ("Kim cannot hold #3") is prose about a seat he does NOT have and is not checked.
  for (const mm of callout.matchAll(new RegExp(`(?:#?\\b(\\d)\\s+${sn}\\b|${sn}\\s+(?:takes|to|at|holds|moves to|climbs to|drops to)\\s+#(\\d))`, "g"))) {
    const n = Number(mm[1] || mm[2]);
    if (n && n !== st.rank) throw new Error(`callout seats ${sn} #${n} but the table seats him #${st.rank}: "${callout}"`);
  }
}

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
  calloutBasis,
  signalVocabulary: "currentSignal uses the page's words — BUY / HOLD / SELL / PASS / WATCH. loggedCall.action is the historical Scorecard call and may differ; the page's current signal always wins.",
  marksPolicy:
    "Sold comps and asks are separate figures and are never blended. A PSA 10 line states the sale " +
    "count behind it, or states that there is no verified sale. Calls are graded at 6 and 12 months only.",
  seats: seats.slice(0, 5),
};

const json = JSON.stringify(out, null, 1) + "\n";
if (DRY) { console.log(json); process.exit(0); }
fs.writeFileSync(path.join(REPO, "data/x-board.json"), json);
console.log(`data/x-board.json — ${out.seats.length} seats, as of ${asOf}`);
