// Self-test for the TA engine — NO tokens, NO network. Run anytime:
//   node tools/price-engine/selftest.mjs
//
// Generates synthetic price series with known shapes (uptrend, downtrend, spike,
// flat) and asserts analyze() returns the expected BUY/SELL/HOLD, plus sanity-
// checks the stats primitives against hand-computed values.

import {
  mean, stdev, sma, roc, skewness, kurtosis, zScore, analyze, MIN_HISTORY,
} from "../../api/_lib/ta.js";

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}
function approx(a, b, eps = 1e-6) { return a != null && Math.abs(a - b) < eps; }

console.log("stats primitives:");
check("mean([1..5]) = 3", approx(mean([1, 2, 3, 4, 5]), 3));
check("stdev([2,4,4,4,5,5,7,9]) ~ 2.138", approx(stdev([2, 4, 4, 4, 5, 5, 7, 9]), 2.13809, 1e-4));
check("sma last-3 of 1..6 = 5", approx(sma([1, 2, 3, 4, 5, 6], 3), 5));
check("roc +10% over 1", approx(roc([100, 110], 1), 10));
check("skewness of symmetric ~ 0", approx(skewness([1, 2, 3, 4, 5, 4, 3, 2, 1]) ?? 0, 0, 0.5));
check("right-skewed > 0", (skewness([1, 1, 1, 1, 2, 2, 3, 10]) ?? -1) > 0);
check("kurtosis defined for n>=4", kurtosis([1, 2, 3, 4, 5]) != null);
check("zScore of last point finite", Number.isFinite(zScore([1, 2, 3, 4, 100])));

// helpers to build series
const trendUp = Array.from({ length: 40 }, (_, i) => 100 + i * 2);          // steady climb
const trendDown = Array.from({ length: 40 }, (_, i) => 200 - i * 2);        // steady fall
const flat = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 0.4);  // deterministic tiny noise (<1%)
const short = [100, 101, 102];                                              // not enough history

console.log("\nsignals:");
const up = analyze(trendUp, 50);
check("uptrend -> BUY", up.signal === "BUY");
check("uptrend roc30 positive", up.roc30 > 0);
check("uptrend has reasons", up.reasons.length > 0);

const down = analyze(trendDown, 50);
check("downtrend -> SELL", down.signal === "SELL");

const fl = analyze(flat, 50);
check("flat -> HOLD", fl.signal === "HOLD");

const sh = analyze(short, 50);
check("short history -> HOLD", sh.signal === "HOLD");
check("short history flags building", sh.reasons.some((r) => r.includes("Building history")));
check(`MIN_HISTORY is ${MIN_HISTORY}`, MIN_HISTORY === 20);

// thin-volume should dampen confidence vs liquid on the same series
const liquid = analyze(trendUp, 500);
const thin = analyze(trendUp, 3);
check("thin volume lowers confidence", thin.confidence < liquid.confidence);
check("thin volume flagged", thin.reasons.some((r) => r.includes("Thin volume")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
