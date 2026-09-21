// x-board-guards.mjs — the honesty rules for the vendor feed (data/x-board.json), shared by the
// generator (tools/build-x-board.mjs) and the gate (tools/audit-terminal.mjs · xboard-honest).
//
// Doctrine: LANE-RULES R10 AMENDMENT 2026-09-20 — "durations decay, dates don't". A duration ("41 days
// since the last sale", "carried an 8th week", "flat a third week") is false the day after it is written;
// a date ("last printed sale Aug 5") is true forever. Every stale-post incident on this project traced to
// a duration, a streak or an undated rank in the feed we hand the vendor. So:
//   1. asOf may not silently age: the file does not ship when its marks are older than the freshness bar.
//   2. No decaying language in any string a vendor could quote.
//   3. The callout may not seat a player at a number the seats array does not.
// Written 2026-09-21 (x-board-feed-integrity, CoS-commissioned, charter 4.8). One module so the builder
// and the gate cannot drift apart — a rule enforced by a human reading a diff is not enforced.

/** Days between two YYYY-MM-DD (or ISO datetime) strings, generated − asOf. NaN if either is unparseable. */
export function asOfAgeDays(asOf, generated) {
  const a = Date.parse(String(asOf).slice(0, 10) + "T00:00:00Z");
  const g = Date.parse(String(generated).slice(0, 10) + "T00:00:00Z");
  return (g - a) / 86400000;
}
/** The freshness bar: marks may be at most this many calendar days older than the file's generation. */
export const MAX_ASOF_AGE_DAYS = 2;

const ORD = "(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|\\d+(?:st|nd|rd|th))";
const NUMWORD = "(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\\d+)";

/** Shapes that LOOK like a duration but are a windowed statistic anchored to the mark date and do not decay:
 *  "2 sold in 7 days", "27 sales in 30 days", "0 prints in 30 days". Stripped before the decay scan. */
const WINDOW_COUNT = /\b\d+\s+(?:sold|sales?|prints?|printed|listings?|closes?)\s+in\s+(?:the\s+)?\d+\s*days?\b/gi;

/** Decaying-language patterns. Each entry: [regex, name]. Applied after WINDOW_COUNT shapes are removed. */
export const DECAY_PATTERNS = [
  [/\b\d+\s*days?\b/i, "elapsed-day count"],
  [new RegExp(`\\b${NUMWORD}\\s+days?\\s+(?:since|without|ago|old|stale|dark|quiet|no\\b)`, "i"), "elapsed-day count (spelled)"],
  [new RegExp(`\\b${ORD}\\s+(?:straight\\s+|consecutive\\s+)?week`, "i"), "ordinal week"],
  [/\bstraight\s+week/i, "straight week"],
  [/\bconsecutive\s+week/i, "consecutive week"],
  [new RegExp(`\\b${NUMWORD}\\s+weeks?\\b`, "i"), "week count"],
  [/\bweeks?\s+(?:running|straight|in\s+a\s+row|flat)\b/i, "week streak"],
  [/\bsince\b[^.;·]{0,40}?\b\d+\s*(?:days?|weeks?|months?)\b/i, "since + duration"],
  [/\b\d+\s*(?:weeks?|months?)\s+(?:since|without|ago|old|stale)\b/i, "duration + since"],
];

/** Every decaying phrase in one string: [{pattern, match}]. Empty array = clean. */
export function decayingMatches(str) {
  if (typeof str !== "string" || !str) return [];
  const s = str.replace(WINDOW_COUNT, " ");
  const out = [];
  for (const [re, name] of DECAY_PATTERNS) {
    const m = s.match(re);
    if (m) out.push({ pattern: name, match: m[0] });
  }
  return out;
}

/** Walk an object; return [{path, value, matches}] for every string field carrying decaying language.
 *  `exempt(path)` → true skips a subtree (used for loggedCall: a dated, immutable Scorecard record). */
export function decayingFields(obj, exempt = () => false, path = "$") {
  const out = [];
  const walk = (o, p) => {
    if (exempt(p)) return;
    if (typeof o === "string") { const m = decayingMatches(o); if (m.length) out.push({ path: p, value: o, matches: m }); }
    else if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${p}[${i}]`));
    else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, `${p}.${k}`);
  };
  walk(obj, path);
  return out;
}

/** Affirmative seatings the callout makes — "3 Gonzales", "#3 Gonzales", "Gonzales takes #4", "Gonzales to #4",
 *  "Gonzales is #4" — checked against the seats array. A negation ("Kim cannot hold #3") is prose about a seat
 *  he does NOT have and is not a claim. Returns [{player, claimed, actual}] for every disagreement. */
export function calloutSeatConflicts(callout, seats) {
  const out = [];
  if (typeof callout !== "string" || !Array.isArray(seats)) return out;
  for (const st of seats) {
    const player = String(st.player || "");
    const sn = player.split(" ").slice(-1)[0];
    if (!sn) continue;
    const esc = sn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // "3 Gonzales" · "#3 Gonzales" · "Gonzales takes #4" · "Gonzales is #4" · "lost #4 to Gonzales" · "#4 goes to Gonzales"
    const re = new RegExp(`(?:#?\\b(\\d)\\s+${esc}\\b|\\b${esc}\\s+(?:takes|to|at|holds|is|stays|moves to|climbs to|drops to|falls to|rises to)\\s+#(\\d)\\b|#(\\d)\\s+(?:goes\\s+)?to\\s+${esc}\\b)`, "gi");
    for (const mm of callout.matchAll(re)) {
      const n = Number(mm[1] || mm[2] || mm[3]);
      if (n && n !== Number(st.rank)) out.push({ player, claimed: n, actual: Number(st.rank) });
    }
  }
  return out;
}

/** Marker the guarded builder writes into every file it produces. A file without it predates the guards. */
export const GUARDS_MARKER = { version: 1, module: "tools/x-board-guards.mjs", rules: ["asof-freshness", "no-decaying-language", "callout-agrees-with-seats"] };

/** LEGACY GRACE — dated, on the record, expires by itself. The feed committed at d57f6cc (2026-09-21 13:54 PT) was
 *  regenerated from Sep 15 marks under Mo's instruction to get the vendor a working file, an hour before this gate
 *  existed; the vendor was told the same hour to "pull fresh". Withholding it would contradict that instruction and
 *  the CoS cannot reach the vendor before its 09:00 PT post. So through LEGACY_UNTIL a file WITHOUT the guards marker
 *  reports its violations as WARN "LEGACY …" instead of FAIL. From the day after, FAIL. A file WITH the marker never
 *  gets the grace. The Tuesday 2026-09-22 11:02 PT re-mark rebuilds the file and retires this block in practice. */
export const LEGACY_UNTIL = "2026-09-22";

const fmt = (f) => `decaying language in ${f.path}: "${f.value}" (${f.matches.map((m) => m.pattern + ': "' + m.match + '"').join("; ")})`;

/** Full verdict on a parsed x-board.json against the page stamp it was built from (pageAsOf may be null).
 *  Returns {fails: [string], warns: [string]}. A withheld file (status:"withheld") is accepted with a WARN
 *  when it carries a reason and no claims — shipping nothing beats shipping a stale stamp. */
export function judgeXBoard(x, { pageAsOf = null, today = new Date().toISOString().slice(0, 10) } = {}) {
  const v = judgeStrict(x, pageAsOf);
  if (v.fails.length && x && typeof x === "object" && x.status !== "withheld" && !x.guards && today <= LEGACY_UNTIL) {
    return { fails: [], warns: [...v.warns, ...v.fails.map((f) => `LEGACY (pre-guard file; grace expires after ${LEGACY_UNTIL} — rebuild at the next re-mark): ${f}`)] };
  }
  return v;
}

function judgeStrict(x, pageAsOf) {
  const fails = [], warns = [];
  if (!x || typeof x !== "object") return { fails: ["data/x-board.json is not a JSON object"], warns };
  if (x.status === "withheld") {
    if (!x.reason || !x.asOf || !x.withheldOn) fails.push("withheld file must carry reason, asOf and withheldOn");
    if (x.seats || x.callout || x.marks) fails.push("withheld file still carries seats/callout/marks — a withheld feed carries no claims");
    for (const f of decayingFields(x)) fails.push(fmt(f));
    warns.push(`vendor feed is WITHHELD (marks dated ${x.asOf}; ${x.reason}) — rebuild it at the next board re-mark`);
    return { fails, warns };
  }
  if (!x.asOf || !x.generated) fails.push("asOf and generated are both required");
  else {
    const age = asOfAgeDays(x.asOf, x.generated);
    if (!Number.isFinite(age)) fails.push(`asOf "${x.asOf}" / generated "${x.generated}" unparseable`);
    else if (age > MAX_ASOF_AGE_DAYS) fails.push(`asOf ${x.asOf} is ${age} days older than generated ${String(x.generated).slice(0, 10)} (bar: ${MAX_ASOF_AGE_DAYS}) — a stale stamp; rebuild after a re-mark, never republish old marks`);
    else if (age < 0) fails.push(`asOf ${x.asOf} is AFTER generated ${x.generated}`);
  }
  if (pageAsOf && x.asOf && x.asOf !== pageAsOf) fails.push(`asOf ${x.asOf} disagrees with bowman-bangers.html data-prices-updated ${pageAsOf} — the feed must carry the page's own stamp`);
  if (!Array.isArray(x.seats) || x.seats.length < 5) fails.push(`seats: expected 5, found ${Array.isArray(x.seats) ? x.seats.length : "none"}`);
  else for (const st of x.seats) {
    if (st.marks && st.marks.asOf && x.asOf && st.marks.asOf !== x.asOf) fails.push(`seat ${st.rank} ${st.player}: marks.asOf ${st.marks.asOf} ≠ file asOf ${x.asOf}`);
  }
  for (const c of calloutSeatConflicts(x.callout, x.seats || [])) fails.push(`callout seats ${c.player} #${c.claimed} but seats[] has him #${c.actual}: "${x.callout}"`);
  // The same rule on every seat's own price line: "lost #4 to Gonzales" under a table seating Gonzales #3 is the
  // same undated-rank defect one row down.
  for (const st of x.seats || []) for (const f of ["basisNote", "headlineRange"]) {
    const v = st.marks && st.marks[f];
    for (const c of calloutSeatConflicts(v, x.seats)) fails.push(`seat ${st.rank} ${st.player} ${f} seats ${c.player} #${c.claimed} but seats[] has him #${c.actual}: "${v}"`);
  }
  // loggedCall is the dated, immutable Scorecard record (data/calls.json) with its own callDate — historical by construction.
  for (const f of decayingFields(x, (p) => /\.loggedCall(\.|\[|$)/.test(p))) fails.push(fmt(f));
  return { fails, warns };
}
