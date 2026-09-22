#!/usr/bin/env node
// lane-heartbeat.mjs — which lanes owed a filing, and which one did not file.
//
// WHY THIS EXISTS. On 2026-09-21 the X Desk Watch run never fired: its cron was moved to
// 13:00 PT that afternoon, AFTER 13:00 had already passed, so the scheduler booked the next
// occurrence for Tuesday and Monday was simply skipped. Nothing reported it. The gap surfaced
// a day later, when Mo asked about the vendor's replies and the Chief of Staff answered from
// Sunday's filing — confidently, and two days stale. The failure was not a bad answer; it was
// a silence that looked exactly like "nothing happened".
//
// A missing filing and a quiet week are indistinguishable unless something counts. This counts.
//
// Usage:
//   node tools/lane-heartbeat.mjs --since 2026-09-15 --have have.txt   # have.txt = one doc path per line
//   node tools/lane-heartbeat.mjs --since 2026-09-15 < have.txt
//   ... --json     machine-readable, for the desk to paste into its filing
//
// The filings live in the claude.ai Project, which no shell can list, so the caller supplies
// the doc paths it can see and this does the date arithmetic and the diff.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : d; };
const JSON_OUT = argv.includes("--json");

const cfg = JSON.parse(fs.readFileSync(path.join(REPO, "claude/lanes/EXPECTED-FILINGS.json"), "utf8"));

// "today" in the lanes' timezone, not the runner's — a UTC cloud box is tomorrow by 5pm PT.
const ptNow = new Date(new Date().toLocaleString("en-US", { timeZone: cfg.timezone }));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const since = arg("--since");
if (!since) { console.error("need --since YYYY-MM-DD"); process.exit(2); }

const haveFile = arg("--have");
const haveRaw = haveFile ? fs.readFileSync(haveFile, "utf8") : fs.readFileSync(0, "utf8");
const have = haveRaw.split("\n").map(s => s.trim()).filter(Boolean);
const exists = (p, prefix) => prefix ? have.some(h => h.startsWith(p)) : have.includes(p);

const rows = [];
for (const lane of cfg.lanes) {
  // Never before the lane existed. Without this the heartbeat reports the Ideas Desk as silent
  // on the day it was created, six hours after its own slot — a false alarm, and a gate that
  // cries wolf is the one nobody reads on the day it is right.
  const from = lane.startedOn && lane.startedOn > since ? lane.startedOn : since;
  const d = new Date(from + "T12:00:00");
  const end = new Date(ptNow); end.setHours(12, 0, 0, 0);
  for (; d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const due = lane.days === "daily" || (Array.isArray(lane.days) && lane.days.includes(dow));
    if (!due) continue;
    const date = iso(d);
    // Today's slot has not come round yet — not a miss, just not yet.
    const isToday = date === iso(ptNow);
    if (isToday && ptNow.getHours() < lane.hourPT) continue;
    const p = lane.path.replace("{date}", date);
    rows.push({ lane: lane.id, name: lane.name, date, path: p, filed: exists(p, lane.prefixMatch), why: lane.why });
  }
}

const missing = rows.filter(r => !r.filed);
if (JSON_OUT) { console.log(JSON.stringify({ checkedFrom: since, today: iso(ptNow), due: rows.length, missing }, null, 1)); process.exit(0); }

console.log(`Lane heartbeat — ${iso(ptNow)} · ${rows.length} filings due since ${since} · ${missing.length} missing`);
for (const r of rows) console.log(`  [${r.filed ? "FILED  " : "MISSING"}] ${r.date}  ${r.lane}`);
if (missing.length) {
  console.log(`\n  SILENT LANES — each of these owed a filing and did not produce one:`);
  for (const r of missing) console.log(`    ${r.date}  ${r.name}\n        expected: ${r.path}\n        matters:  ${r.why}`);
  console.log(`\n  A missing filing is not "a quiet day". Check the task actually fired (a cron edited after\n  that day's slot silently skips it), then say so in the desk filing by name and date.`);
}
process.exit(missing.length ? 1 : 0);
