#!/usr/bin/env node
// x-board-guards.test.mjs — negative tests for the vendor-feed honesty rules (tools/x-board-guards.mjs).
// A gate never seen to fail is not a gate. Run: node tools/qa/x-board-guards.test.mjs   (exit 1 on any miss)
// Written 2026-09-21 (x-board-feed-integrity). Each case is one of the defect shapes the live feed carried on
// 2026-09-20, plus a clean file and a withheld stub. Fixtures are synthetic — nothing here is published.
import { judgeXBoard, decayingMatches, calloutSeatConflicts, GUARDS_MARKER, LEGACY_UNTIL } from "../x-board-guards.mjs";

const seats = (over = {}) => [
  { rank: 1, player: "Andrew Fischer", marks: { basisNote: "SCP raw $148 · engine $203 · raw +1.0%, 2 sold in 7 days · Sep 15", asOf: "2026-09-15" } },
  { rank: 2, player: "Ethan Holliday", marks: { basisNote: "SCP raw $104 · 27 sold in 30 days · Sep 15", asOf: "2026-09-15" } },
  { rank: 3, player: "Justin Gonzales", marks: { basisNote: "SCP raw $92 · last print $92.00 read Sep 11 · Sep 15", asOf: "2026-09-15" } },
  { rank: 4, player: "Edward Florentino", marks: { basisNote: "SCP raw $70 · flat at $70.00 — last print read Sep 11 · Sep 15", asOf: "2026-09-15" } },
  { rank: 5, player: "Seong-Jun Kim", marks: { basisNote: "SCP raw $131 · carried at $131.25 — last printed sale Aug 5 · Sep 15", asOf: "2026-09-15" },
    loggedCall: { entryLabel: "second straight week above the #5 seat (dated, immutable Scorecard record)" } },
].map((s) => ({ ...s, ...(over[s.rank] || {}) }));

const clean = () => ({
  guards: GUARDS_MARKER,
  asOf: "2026-09-15", generated: "2026-09-16T14:00:00.000Z",
  rankingRule: "Ranked on one ladder: the last printed sold price of the raw 1st Bowman Chrome Auto, with a 30-day liquidity gate.",
  callout: "Correction · Sep 18, 2026: The gate was not applied to every seat. The seats now read 1 Fischer · 2 Holliday · 3 Gonzales · 4 Florentino · 5 Kim (gated).",
  changeLog: [{ date: "2026-09-18", kind: "correction", what: "The gate was not applied to every seat." }],
  seats: seats(),
});

let failed = 0;
const expect = (name, cond, detail) => { console.log(`${cond ? "PASS" : "MISS"}  ${name}${detail ? " — " + detail : ""}`); if (!cond) failed++; };

// D. clean file → 0 FAIL
{ const v = judgeXBoard(clean(), { pageAsOf: "2026-09-15" }); expect("clean file passes", v.fails.length === 0 && v.warns.length === 0, v.fails.join(" | ")); }

// A. stale stamp: asOf 6 days older than generated → FAIL
{ const x = clean(); x.generated = "2026-09-21T20:54:31.649Z"; const v = judgeXBoard(x, { pageAsOf: "2026-09-15" });
  expect("stale stamp FAILs (asOf 09-15, generated 09-21)", v.fails.some((f) => /6 days older/.test(f)), v.fails[0]); }
// A2. asOf exactly at the bar (2 days) passes; 3 days fails
{ const x = clean(); x.generated = "2026-09-17T23:59:00Z"; expect("asOf 2 days old passes (the bar)", judgeXBoard(x).fails.length === 0);
  x.generated = "2026-09-18T00:00:00Z"; expect("asOf 3 days old FAILs", judgeXBoard(x).fails.some((f) => /3 days older/.test(f))); }
// A3. feed stamp disagrees with the page stamp → FAIL
{ const v = judgeXBoard(clean(), { pageAsOf: "2026-09-16" }); expect("asOf ≠ page data-prices-updated FAILs", v.fails.some((f) => /disagrees with bowman-bangers.html/.test(f)), v.fails[0]); }

// B. callout names a rank the seats deny → FAIL
{ const x = clean(); x.callout = "Sep 15 board: Gonzales takes #4 from Florentino on the clock this page published Sep 11."; const v = judgeXBoard(x);
  expect("callout 'Gonzales takes #4' vs seats #3 FAILs", v.fails.some((f) => /callout seats Justin Gonzales #4 but seats\[\] has him #3/.test(f)), v.fails[0]); }
{ const x = clean(); x.callout = "The seats now read 1 Fischer · 2 Holliday · 3 Kim · 4 Gonzales · 5 Florentino."; const v = judgeXBoard(x);
  expect("callout '3 Kim · 4 Gonzales · 5 Florentino' vs seats FAILs on all three", v.fails.filter((f) => /^callout seats/.test(f)).length === 3, String(v.fails.length)); }
{ const x = clean(); x.seats = seats({ 4: { marks: { basisNote: "flat at $70.00 — lost #4 to Gonzales on the published clock · Sep 15", asOf: "2026-09-15" } } }); const v = judgeXBoard(x);
  expect("price line 'lost #4 to Gonzales' under seats #3 FAILs", v.fails.some((f) => /seat 4 Edward Florentino basisNote seats Justin Gonzales #4/.test(f)), v.fails[0]); }
expect("negation 'Kim cannot hold #3' is not a claim", calloutSeatConflicts("So Kim cannot hold #3, and the seats now read 3 Gonzales.", seats()).length === 0);

// C. decaying language → FAIL, each shape from the 2026-09-20 live feed
for (const [line, why] of [
  ["carried at $131.25 an 8th week — 41 days since the last printed sale (Aug 5) · Sep 15", "8th week / 41 days since"],
  ["flat at $70.00 a third week — last print read Sep 11 · Sep 15", "a third week"],
  ["new prints on three straight weekly reads (Sep 1, Sep 8, Sep 11) · Sep 15", "straight weekly"],
  ["Kim has now gone 41 days without a printed sale", "N days without"],
  ["a $131.25 quote that is 41 days old", "N days old"],
  ["pinned at $720 a sixth week", "spelled ordinal week"],
  ["unchanged for 3 weeks", "week count"],
]) { const x = clean(); x.seats = seats({ 5: { marks: { basisNote: line, asOf: "2026-09-15" } } }); const v = judgeXBoard(x);
  expect(`decaying "${why}" FAILs`, v.fails.some((f) => /decaying language in \$\.seats\[4\]\.marks\.basisNote/.test(f)), v.fails[0]); }
{ const x = clean(); x.callout = "Kim has now gone 41 days without a printed sale."; expect("decaying language in the callout FAILs", judgeXBoard(x).fails.some((f) => /decaying language in \$\.callout/.test(f))); }
// windowed counts and dated forms are NOT decaying
for (const ok of ["2 sold in 7 days", "27 sold in 30 days", "with a 30-day liquidity gate.", "last printed sale Aug 5", "carried at $131.25 — last printed sale Aug 5", "last print $92.00 read Sep 11"])
  expect(`"${ok}" is clean`, decayingMatches(ok).length === 0, JSON.stringify(decayingMatches(ok)));
expect("loggedCall (dated Scorecard record) is exempt", judgeXBoard(clean()).fails.length === 0);

// E. withheld stub → WARN only; a stub that still carries seats → FAIL
{ const w = { status: "withheld", asOf: "2026-09-15", withheldOn: "2026-09-21", reason: "marks dated 2026-09-15 are older than the freshness bar", changeLog: [] };
  const v = judgeXBoard(w); expect("withheld stub passes with one WARN", v.fails.length === 0 && v.warns.length === 1, v.fails[0] || v.warns[0]);
  const v2 = judgeXBoard({ ...w, seats: seats() }); expect("withheld stub carrying seats FAILs", v2.fails.some((f) => /still carries seats/.test(f)));
  const v3 = judgeXBoard({ status: "withheld", asOf: "2026-09-15" }); expect("withheld stub without a reason FAILs", v3.fails.length > 0); }

// F. legacy grace: a pre-guard file (no marker) WARNs through LEGACY_UNTIL and FAILs the day after; a marked file never gets it
{ const x = clean(); delete x.guards; x.generated = "2026-09-21T20:54:31.649Z";
  const on = judgeXBoard(x, { today: LEGACY_UNTIL }); expect(`pre-guard stale file on ${LEGACY_UNTIL} → WARN not FAIL`, on.fails.length === 0 && on.warns.some((w) => /^LEGACY/.test(w)), on.fails[0] || on.warns[0]);
  const after = judgeXBoard(x, { today: "2026-09-23" }); expect("pre-guard stale file on 2026-09-23 → FAIL", after.fails.some((f) => /6 days older/.test(f)));
  const marked = clean(); marked.generated = "2026-09-21T20:54:31.649Z"; expect("marked (guarded-builder) stale file gets NO grace", judgeXBoard(marked, { today: LEGACY_UNTIL }).fails.length === 1); }

console.log(failed ? `\n${failed} MISS` : "\nall cases behaved");
process.exit(failed ? 1 : 0);
