// merge-ticker-keys.mjs — keep a nightly mark's ticker keys when data/indices.json must otherwise be restored or
// replaced (CoS, Oct 8 2026 — iw-2026-10-08-1).
//
// Why: the Oct 8 nightly marked TH26, SV151, SSP24, MEG25, BOW26, BB26 and BCB26 and baked their pages, but
// data/indices.json reached main WITHOUT those marks — a later group's failure handler ran `git checkout --
// data/indices.json` (every ticker's mark gone, not just that group's), and the publish loop's clash rule keeps main's
// whole copy of a file a lane touched meanwhile. Pages said 10/08, the data said 10/01, and /indices, the home board and
// the badges (all read indices.json) disagreed with the index pages for a week. The tool writes one ticker key per run,
// so the right unit of restore / merge is the ticker key, never the file.
//
// Usage:
//   node tools/ci/merge-ticker-keys.mjs --from <indices.json> --into <indices.json> --tickers A,B,C
//     copies keys A, B, C (and `updated` when --from is newer) from --from into --into, writes --into. Idempotent.
//   Restore after a failed group:   --from "$RUNNER_TEMP/idx-pre.json" --into data/indices.json --tickers <that group>
//   Keep marks over a main clash:   --from "$RUNNER_TEMP/idx-marked.json" --into data/indices.json --tickers <all marked>
import fs from "node:fs";

const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const from = opt("--from"), into = opt("--into"), tickers = (opt("--tickers") || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!from || !into || !tickers.length) { console.error("usage: --from <json> --into <json> --tickers A,B,C"); process.exit(2); }
if (!fs.existsSync(from)) { console.error(`merge-ticker-keys: ${from} missing — nothing to merge`); process.exit(0); }
const src = JSON.parse(fs.readFileSync(from, "utf8")), dst = JSON.parse(fs.readFileSync(into, "utf8"));
let n = 0;
for (const t of tickers) {
  if (!src[t]) { console.log(`merge-ticker-keys: ${t} not in ${from} — skipped`); continue; }
  if (JSON.stringify(src[t]) === JSON.stringify(dst[t])) continue;
  dst[t] = src[t]; n++;
}
if (n && src.updated && (!dst.updated || src.updated > dst.updated)) dst.updated = src.updated;
if (n) { fs.writeFileSync(into, JSON.stringify(dst, null, 1) + "\n"); console.log(`merge-ticker-keys: ${n} ticker key(s) written into ${into}: ${tickers.join(",")}`); }
else console.log("merge-ticker-keys: no change");
