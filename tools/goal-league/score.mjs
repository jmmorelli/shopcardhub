#!/usr/bin/env node
// Goal League scorer (Season 1). Written by the Goal League Commissioner, 2026-10-28.
// Rules: Project claude/goal-league/RULES.md (binding). Registry: data/goal-league.json (Commissioner-only).
//
// WHAT IT MEASURES
//   Per agent: attributed eBay clicks on the pages it owns = GA4 outbound clicks on the page
//   (events click, buystrip_click, buybox_click, chase_click, grade_click, shop_click, fanatics_click,
//   search_miss_click — the same OUTBOUND set as tools/ga4-snapshot.mjs) minus the page's pre-claim baseline
//   (baselinePerDay x days owned inside the read window). Plus clean sessions on owned pages.
//
// METHOD — WEEKLY READS (the snapshot has no per-page DAILY clicks)
//   ga4-latest.json carries pageClicks7 (page x event, 7 days ending `day`) but no page x day click series.
//   So standings are read every Monday from the 7-day per-page window that ends on Sunday, and the season
//   score is the SUM OF THE FOUR MONDAY READS (weeks ending Nov 8, 15, 22, 29). `--record` stores a read in
//   data/goal-league.json -> weeklyReads when the snapshot day is one of those Sundays. A missed Monday is read
//   from the first later snapshot whose 7-day window ends on that Sunday only if one exists; otherwise the week
//   is marked "no read" and the season is the sum of the reads that exist (stated in STANDINGS).
//
// METHOD — BOT-COUNTRY CLEANING
//   Bot countries = summary.bots.suspects (ga4-snapshot rule: avg session < 2 s over >= 10 sessions, or 0 key
//   events + avg < 10 s over >= 30 sessions; 7 d, by country). Clean sessions on a page = pageCountry7 sessions
//   minus bot-country sessions. GA4 clicks are NOT split by country in the snapshot, so a page's click share from
//   bot countries cannot be read directly. Proxy: a page is FLAGGED (and its clicks excluded from the score) when
//   bot-country sessions are >= 50% of its sessions AND its clicks7 exceed its clean sessions7 (clicks the clean
//   visits cannot explain). Flagged pages are listed in the output.
//
// BASELINE
//   baselinePerDay = the page's outbound clicks over the 28 days before the claim (pageClicks28 of the claim-day
//   snapshot) / 28; a URL younger than 28 days uses clicks / days since first publish; a new URL is 0.
//   Recorded once by the Commissioner at grant time; never edited afterwards.
//
// USAGE
//   node tools/goal-league/score.mjs [--registry data/goal-league.json] [--ga4 <ga4-latest.json>] [--json]
//   node tools/goal-league/score.mjs --check            validate the registry (exit 1 on any problem)
//   node tools/goal-league/score.mjs --record           append this snapshot's weekly read if it is a scoring Sunday
import fs from "node:fs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const REG = opt("--registry", "data/goal-league.json");
const GA4 = opt("--ga4", fs.existsSync("data/feed/data/ga4-latest.json") ? "data/feed/data/ga4-latest.json" : "../feed/data/ga4-latest.json");
const CAP = 12;
const OUTBOUND = new Set(["click", "buystrip_click", "buybox_click", "chase_click", "grade_click", "shop_click", "fanatics_click", "search_miss_click"]);

const reg = JSON.parse(fs.readFileSync(REG, "utf8"));

function check() {
  const errs = [];
  const agents = new Set(reg.agents || []);
  const prot = (reg.protected || []).map((p) => new RegExp(p));
  const seen = new Map(), count = {};
  for (const p of reg.pages || []) {
    if (!agents.has(p.owner)) errs.push(`${p.path}: unknown owner ${p.owner}`);
    if (seen.has(p.path)) errs.push(`${p.path}: owned twice (${seen.get(p.path)}, ${p.owner})`);
    seen.set(p.path, p.owner);
    if (prot.some((re) => re.test(p.path))) errs.push(`${p.path}: protected page`);
    if (p.kind !== "file") count[p.owner] = (count[p.owner] || 0) + 1;
    if (typeof p.baselinePerDay !== "number" || p.baselinePerDay < 0) errs.push(`${p.path}: bad baselinePerDay`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.claimedAt || "")) errs.push(`${p.path}: bad claimedAt`);
  }
  for (const [a, n] of Object.entries(count)) if (n > CAP) errs.push(`${a}: ${n} pages > cap ${CAP}`);
  return { errs, count };
}

if (has("--check")) {
  const { errs, count } = check();
  console.log(`registry ${REG}: ${(reg.pages || []).length} entries; pages/agent ${JSON.stringify(count)}`);
  if (errs.length) { console.log("FAIL\n- " + errs.join("\n- ")); process.exit(1); }
  console.log("OK"); process.exit(0);
}

const ga4 = JSON.parse(fs.readFileSync(GA4, "utf8"));
const rep = ga4.reports || {};
const day = ga4.day;
const bots = new Set(((ga4.summary || {}).bots || {}).suspects?.map((s) => s.country) || []);
const clicks7 = new Map();
for (const r of (rep.pageClicks7 || {}).rows || []) if (OUTBOUND.has(r.eventName)) clicks7.set(r.pagePath, (clicks7.get(r.pagePath) || 0) + (r.eventCount || 0));
const sess7 = new Map();
for (const r of (rep.pageCountry7 || {}).rows || []) {
  const o = sess7.get(r.pagePath) || { all: 0, bot: 0 };
  o.all += r.sessions || 0; if (bots.has(r.country)) o.bot += r.sessions || 0; sess7.set(r.pagePath, o);
}
const D = (s) => new Date(s + "T00:00:00Z");
const addDays = (s, n) => { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const overlap = (a0, a1, b0, b1) => { const s = a0 > b0 ? a0 : b0, e = a1 < b1 ? a1 : b1; return s > e ? 0 : (D(e) - D(s)) / 864e5 + 1; };
const wStart = addDays(day, -6);
const sStart = reg.window.start, sEnd = reg.window.end;
const preseason = day < sStart;

const per = {};
for (const a of reg.agents) per[a] = { agent: a, pages: 0, clicks7: 0, baseline7: 0, attributed7: 0, cleanSessions7: 0, flagged: [] };
for (const p of reg.pages) {
  if (p.kind === "file") continue;
  const A = per[p.owner]; A.pages++;
  const c = clicks7.get(p.path) || 0;
  const s = sess7.get(p.path) || { all: 0, bot: 0 };
  const clean = s.all - s.bot;
  const flagged = s.all > 0 && s.bot / s.all >= 0.5 && c > clean;
  // days owned inside the 7-day read window (pre-season: the whole window, labelled preview)
  const own0 = preseason ? wStart : (p.claimedAt > sStart ? p.claimedAt : sStart);
  const own1 = preseason ? day : (day < sEnd ? day : sEnd);
  const days = overlap(wStart, day, own0, own1);
  const base = +(p.baselinePerDay * days).toFixed(2);
  const counted = flagged ? 0 : c * (days / 7);
  A.cleanSessions7 += clean;
  A.clicks7 += flagged ? 0 : c;
  A.baseline7 += base;
  A.attributed7 += counted - base;
  if (flagged) A.flagged.push(p.path);
}
const season = {};
for (const a of reg.agents) season[a] = (reg.weeklyReads || []).reduce((t, w) => t + ((w.agents || {})[a]?.attributed ?? 0), 0);
const rows = Object.values(per).map((A) => ({ ...A, baseline7: +A.baseline7.toFixed(2), attributed7: +A.attributed7.toFixed(2), season: +season[A.agent].toFixed(2) }));

const out = { day, generatedAt: ga4.generatedAt, window7: [wStart, day], preseason, botCountries: [...bots], agents: rows, weeklyReads: (reg.weeklyReads || []).length };

if (has("--record")) {
  const sundays = []; for (let d = addDays(sStart, 6); d <= sEnd; d = addDays(d, 7)) sundays.push(d);
  if (!sundays.includes(day)) console.error(`--record: snapshot day ${day} is not a scoring Sunday (${sundays.join(", ")}); nothing recorded`);
  else if ((reg.weeklyReads || []).some((w) => w.weekEnding === day)) console.error(`--record: week ending ${day} already recorded`);
  else {
    reg.weeklyReads = reg.weeklyReads || [];
    reg.weeklyReads.push({ weekEnding: day, snapshot: ga4.generatedAt, agents: Object.fromEntries(rows.map((r) => [r.agent, { attributed: r.attributed7, clicks: r.clicks7, baseline: r.baseline7, cleanSessions: r.cleanSessions7, flagged: r.flagged }])) });
    fs.writeFileSync(REG, JSON.stringify(reg, null, 2) + "\n");
    console.error(`--record: week ending ${day} recorded`);
  }
}

if (has("--json")) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`Goal League S${reg.season} — GA4 day ${day} (generated ${ga4.generatedAt}); read window ${wStart}..${day}${preseason ? " — PRE-SEASON PREVIEW (not scored)" : ""}`);
console.log(`bot countries: ${[...bots].join(", ") || "none"}`);
console.log("agent       pages  clicks7  baseline7  attributed7  cleanSess7  season  flagged");
for (const r of rows) console.log(`${r.agent.padEnd(11)} ${String(r.pages).padStart(5)} ${String(r.clicks7).padStart(8)} ${String(r.baseline7).padStart(10)} ${String(r.attributed7).padStart(12)} ${String(r.cleanSessions7).padStart(11)} ${String(r.season).padStart(7)}  ${r.flagged.join(" ")}`);
