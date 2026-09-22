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
 * GUARDS (2026-09-21, x-board-feed-integrity, CoS-commissioned, charter 4.8 — LANE-RULES R10 AMENDMENT
 * 2026-09-20, "durations decay, dates don't"). This generator is honest: every string is the page's own. The
 * defect was that the PAGE can be stale and this file faithfully republished it with a fresh `generated` stamp,
 * a headline that disagreed with its own seats, and elapsed-day counts that were wrong the day after they were
 * written. So the build now REFUSES rather than rewrites:
 *   1. asOf (the page's data-prices-updated) may not be more than MAX_ASOF_AGE_DAYS older than today. Older →
 *      nothing is written, exit 2, both dates named. Shipping nothing beats shipping a stale stamp.
 *   2. Decaying language (N days since / an Nth week / straight week / flat a third week …) fails the build,
 *      listing every field and value. Duration phrases whose date is IN the same phrase are converted to the
 *      date form first (lossless: "41 days since the last printed sale (Aug 5)" → "last printed sale Aug 5",
 *      plus a structured lastPrintedSale). What cannot be converted fails.
 *   3. The callout may not seat a player at a number the seats array does not. Disagreement = build failure.
 *   4. A changeLog block ({date, kind, what}, newest first, ≤6) parsed from the page's dated Correction /
 *      Method Change blocks — never invented.
 * The same rules are the gate: tools/audit-terminal.mjs `xboard-honest` (shared tools/x-board-guards.mjs).
 *
 * Usage: node tools/build-x-board.mjs [--dry] [--withhold]
 *   --withhold  when guard 1 refuses, write an honest WITHHELD stub instead of leaving the old (stale) file in
 *               place: status, asOf, reason, source, changeLog — no seats, no marks, no callout. The vendor's
 *               fixed URL stays 200 and says why there is no tape (vendor brief #2, Part 5: "you get no tape
 *               that week rather than a stale one, and you will be told why").
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asOfAgeDays, MAX_ASOF_AGE_DAYS, decayingFields, calloutSeatConflicts, GUARDS_MARKER } from "./x-board-guards.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const WITHHOLD = process.argv.includes("--withhold");
const OUT = path.join(REPO, "data/x-board.json");
const TODAY = (process.env.XBOARD_TODAY || new Date().toISOString()).slice(0, 10); // XBOARD_TODAY: tests only
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");

const page = read("bowman-bangers.html");
const strip = (t) =>
  t.replace(/<[^>]+>/g, "")
    .replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&minus;/g, "−").replace(/&mdash;/g, "—").replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&rsquo;|&#8217;/g, "’").replace(/&lsquo;/g, "‘").replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”").replace(/&rarr;/g, "→").replace(/&ndash;/g, "–")
    .replace(/\s+/g, " ").trim();

const asOf = (page.match(/data-prices-updated="(\d{4}-\d{2}-\d{2})"/) || [])[1];
if (!asOf) throw new Error("no data-prices-updated stamp on bowman-bangers.html");

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const isoOf = (mon, d, y) => `${y}-${String(MONTHS[mon]).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
// "Aug 5" with no year → the year of asOf, or the year before when the month is later than asOf's month.
const isoNear = (mon, d) => { const y = Number(asOf.slice(0, 4)); const iso = isoOf(mon, d, y); return iso > asOf ? isoOf(mon, d, y - 1) : iso; };

// changeLog — the page's dated Correction / Method Change blocks, newest first, capped at 6. Each entry is the
// block's own date and its <strong> lead sentence, verbatim. Nothing here is invented: no block, no entry.
const changeLog = [];
for (const m of page.matchAll(/<div class="section-eyebrow">(Correction|Method Change)\s*(?:&middot;|·)\s*([A-Z][a-z]{2}) (\d{1,2}), (\d{4})<\/div>\s*<div class="alert-bar"[^>]*>([\s\S]*?)<\/div>/g)) {
  const [, kind, mon, d, y, body] = m;
  const what = strip((body.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || "");
  if (!what) continue;
  changeLog.push({ date: isoOf(mon, d, y), kind: kind === "Correction" ? "correction" : "method-change", what });
}
changeLog.sort((a, b) => b.date.localeCompare(a.date));
changeLog.splice(6);

// GUARD 1 — asOf may not silently age. The page's marks are dated asOf; this file is generated today. If the page
// has not been re-marked within the freshness bar, republishing it with a fresh `generated` is a wrong number
// leaving the building. Refuse. (--withhold writes an honest stub instead; see header.)
const age = asOfAgeDays(asOf, TODAY);
if (age > MAX_ASOF_AGE_DAYS) {
  const reason = `the board page's marks are dated ${asOf} and this build ran ${TODAY}; the freshness bar is asOf within ${["zero","one","two","three","four","five"][MAX_ASOF_AGE_DAYS] || MAX_ASOF_AGE_DAYS} calendar days of generation`;
  console.error(`build-x-board: REFUSING — asOf ${asOf} is ${age} days older than today ${TODAY} (bar ${MAX_ASOF_AGE_DAYS}). ` +
    `Re-mark bowman-bangers.html first; a feed whose stamp is older than its own generation is a stale stamp, and shipping nothing beats shipping it.`);
  if (WITHHOLD) {
    const stub = {
      _comment: "GENERATED by tools/build-x-board.mjs --withhold — do not hand-edit. The board tape is WITHHELD this run: the page's marks are older than the freshness bar and this project ships nothing rather than a stale number (LANE-RULES R10 amendment 2026-09-20). Seats, marks and the callout return at the next board re-mark, at this same URL.",
      status: "withheld",
      guards: GUARDS_MARKER,
      asOf,
      withheldOn: TODAY,
      reason,
      source: "https://shopcardhub.com/bowman-bangers",
      image: "https://shopcardhub.com/og/x/board-latest.png",
      imageNote: "the tape image carries its own as-of date; quote nothing from it that you cannot point at on the page",
      changeLog,
    };
    const json = JSON.stringify(stub, null, 1) + "\n";
    if (DRY) { console.log(json); process.exit(2); }
    fs.writeFileSync(OUT, json);
    console.error(`build-x-board: wrote WITHHELD stub to data/x-board.json (marks dated ${asOf}, withheld ${TODAY}) — no seats, no marks, no callout.`);
  } else console.error("build-x-board: nothing written (pass --withhold to publish an honest withheld stub in place of the stale file).");
  process.exit(2);
}

// The ranking rule, in the page's own words. One sentence, first section-intro.
const rankingRule = strip((page.match(/<p class="section-intro">([\s\S]*?)<\/p>/) || [])[1] || "");
if (!rankingRule) throw new Error("no ranking rule (p.section-intro) on bowman-bangers.html");

// The week's market-check callout — UNLESS a dated "Correction · <date>" block newer than the tape column
// exists on the page, in which case the correction IS the callout. Sep 21 2026: the page carried
// "Gonzales takes #4 from Florentino" (Sep 15 column) under a "Correction · Sep 18" block that re-seated
// him #3; this file and the tape image printed the superseded sentence beneath a table that contradicted it.
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

// GUARD 2 helper — durations → dates, losslessly. Only phrases whose date is IN the same phrase are converted;
// a streak with no date behind it ("an 8th week") is dropped from the vendor line because it is a claim that is
// false next week and cannot be dated from the text. The page keeps its own prose; this is the vendor copy.
function datedForm(text) {
  let t = text, lastPrintedSale = null, lastPrintReadOn = null;
  // "41 days since the last printed sale (Aug 5)" → "last printed sale Aug 5"  (+ structured date)
  t = t.replace(/\b\d+\s*days?\s+since\s+the\s+last\s+printed\s+sale\s*\(([A-Z][a-z]{2})\s+(\d{1,2})\)/g, (m, mon, d) => { lastPrintedSale = isoNear(mon, Number(d)); return `last printed sale ${mon} ${d}`; });
  // "last printed sale (Aug 5)" / "last printed sale Aug 5" → structured date, text kept
  t.replace(/last\s+printed\s+sale\s*\(?([A-Z][a-z]{2})\s+(\d{1,2})\)?/g, (m, mon, d) => { lastPrintedSale ||= isoNear(mon, Number(d)); return m; });
  // "last print $92.00 read Sep 11" / "last print read Sep 11" → structured read date, text kept
  t.replace(/last\s+print\s+(?:\$[\d.,]+\s+)?read\s+([A-Z][a-z]{2})\s+(\d{1,2})/g, (m, mon, d) => { lastPrintReadOn ||= isoNear(mon, Number(d)); return m; });
  // "carried at $131.25 an 8th week" / "flat at $70.00 a third week" → "carried at $131.25" / "flat at $70.00"
  t = t.replace(/\b(carried|flat|pinned|held|unchanged)\s+(at\s+\$[\d.,]+)\s+(?:for\s+)?an?\s+(?:\d+(?:st|nd|rd|th)|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+(?:straight\s+)?week\b/gi, "$1 $2");
  // "new prints on three straight weekly reads (Sep 1, Sep 8, Sep 11)" → "new prints on the Sep 1, Sep 8, Sep 11 reads"
  t = t.replace(/\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+straight\s+weekly\s+reads\s*\(([^)]+)\)/gi, "the $1 reads");
  return { text: t.replace(/\s+/g, " ").replace(/\s+([—·;,])/g, " $1").trim(), lastPrintedSale, lastPrintReadOn };
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

  // The CURRENT signal is the board's published call: the "Verdict: <Word>" lead of the seat's entry-verdict
  // paragraph (any class variant — entry-verdict, entry-verdict hold, entry-verdict watch). The seat's
  // "Signal" stat is only a fallback when a seat carries no verdict line, because that stat can carry the
  // ENGINE's nightly ask-side word (Holliday read SELL against a published Hold on Sep 22 —
  // bb-2026-09-22-xboard-signal-source). The engine's word is not one of our calls and never reaches the
  // vendor feed. It is NOT the logged Scorecard call below either — those contradicted the page on three
  // of five seats until Sep 21 2026 (Fischer BUY vs HOLD, Holliday BUY vs SELL, Kim WAIT vs PASS).
  const sigStat = (seatHtml.match(/<div class="entry-stat-label">Signal<\/div>\s*<div class="entry-stat-value[^"]*">([^<]+)<\/div>/) || [])[1];
  const sigVerdict = (seatHtml.match(/<div class="entry-verdict(?:\s[^"]*)?"><strong>Verdict: ([A-Za-z]+)/) || [])[1];
  const CALLS = new Set(["BUY", "HOLD", "PASS", "WATCH"]);
  const vWord = (sigVerdict || "").trim().toUpperCase();
  const sWord = (sigStat || "").trim().toUpperCase();
  if (vWord && sWord && vWord !== sWord) console.warn(`  note: seat ${rank} ${player} — Signal stat "${sWord}" disagrees with the published Verdict "${vWord}"; the verdict is used`);
  const currentSignal = vWord || (CALLS.has(sWord) ? sWord : "") || null;
  if (!currentSignal) throw new Error(`seat ${rank} ${player}: no "Verdict:" line and no Signal stat in BUY/HOLD/PASS/WATCH on bowman-bangers.html — refusing to ship a file with only the historical call (or the engine's ask-side word)`);
  if (!CALLS.has(currentSignal)) throw new Error(`seat ${rank} ${player}: verdict "${currentSignal}" is not one of BUY/HOLD/PASS/WATCH`);
  const dated = datedForm(sub);
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
      basisNote: dated.text,                  // the page's full price line, durations converted to their dates (see datedForm)
      lastPrintedSale: dated.lastPrintedSale, // YYYY-MM-DD when the line names the sale's date, else null — the reader subtracts
      lastPrintReadOn: dated.lastPrintReadOn, // YYYY-MM-DD of the read that showed the last print, when the line says so
      markAsOf: asOf,
      asOf,
    },
    board: {
      since: (since.match(/ON THE BOARD SINCE ([^·]+)/) || [])[1]?.trim() || null,
      suggestedSizing: (since.match(/SUGGESTED SIZING (.+)$/) || [])[1]?.trim() || null,
    },
    // What the page says NOW. Vocabulary is the page's: BUY / HOLD / SELL / PASS / WATCH. Use THIS for any
    // per-card line. "WAIT" is a calls.json state and appears on no public surface.
    currentSignal,
    currentSignalSource: vWord ? "Verdict: line on the seat" : "Signal stat on the seat (no verdict line)",
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

// GUARD 3 — the callout may not name a seat number that disagrees with the table it sits under — the exact check
// that would have caught the Sep 21 "Gonzales takes #4" caption beneath a table seating him #3. Shared with the gate.
const top = seats.slice(0, 5);
const conflicts = calloutSeatConflicts(callout, top).map((c) => ({ ...c, where: `callout (${calloutBasis})`, text: callout }));
for (const st of top) for (const f of ["basisNote", "headlineRange"])   // the same rule one row down: a price line may not seat a player where the table does not
  for (const c of calloutSeatConflicts(st.marks[f], top)) conflicts.push({ ...c, where: `seat ${st.rank} ${st.player} marks.${f}`, text: st.marks[f] });
if (conflicts.length) {
  for (const c of conflicts) console.error(`build-x-board: ${c.where} seats ${c.player} #${c.claimed} but the table seats him #${c.actual}\n  "${c.text}"`);
  console.error("  REFUSING — the page contradicts itself; file it awaiting-cos, do not edit the page's prose from here.");
  process.exit(3);
}

const out = {
  _comment:
    "GENERATED by tools/build-x-board.mjs — do not hand-edit. Every value is parsed off " +
    "bowman-bangers.html or data/calls.json at build time. Regenerate at publish time so the " +
    "as-of stamp is honest. Companion image: og/x/board-latest.png (same fixed-path contract).",
  guards: GUARDS_MARKER,   // written by the guarded builder; a file without it predates the guards (see x-board-guards.mjs)
  asOf,
  generated: new Date().toISOString(),
  source: "https://shopcardhub.com/bowman-bangers",
  image: "https://shopcardhub.com/og/x/board-latest.png",
  rankingRule,
  callout,
  calloutBasis,
  signalVocabulary: "currentSignal is the board's published call — BUY / HOLD / PASS / WATCH. SELL is the engine's nightly ask-side signal and is never a board call. loggedCall.action is the historical Scorecard call and may differ; the page's current signal always wins.",
  marksPolicy:
    "Sold comps and asks are separate figures and are never blended. A PSA 10 line states the sale " +
    "count behind it, or states that there is no verified sale. Calls are graded at 6 and 12 months only.",
  // What changed on the page and when — the vendor reads this instead of paraphrasing a page. Newest first.
  changeLog,
  seats: seats.slice(0, 5),
};

// GUARD 2 — no decaying language anywhere a vendor could quote. loggedCall is exempt: it is the dated, immutable
// Scorecard record from data/calls.json (its own callDate), historical by construction and labelled so.
const decaying = decayingFields(out, (p) => /\.loggedCall(\.|\[|$)/.test(p));
if (decaying.length) {
  console.error(`build-x-board: REFUSING — ${decaying.length} field(s) carry decaying language (a duration decays, a date does not):`);
  for (const f of decaying) console.error(`  ${f.path} = ${JSON.stringify(f.value)}\n    ${f.matches.map((m) => `${m.pattern}: "${m.match}"`).join("; ")}`);
  console.error("  Write the DATE on the page (last printed sale Aug 5; mark dated Sep 15) and let the reader subtract. Nothing written.");
  process.exit(4);
}

const json = JSON.stringify(out, null, 1) + "\n";
if (DRY) { console.log(json); process.exit(0); }
fs.writeFileSync(OUT, json);
console.log(`data/x-board.json — ${out.seats.length} seats, as of ${asOf}, ${changeLog.length} changeLog entries`);
