#!/usr/bin/env node
// GA4 snapshot — the browserless analytics read (created 2026-09-18, Mo's yes on NEEDS-MO item 2).
//
// WHY: every cloud lane runs with no browser, so GA4 was only ever read when a Chrome-linked session
// happened to look — which is how key events sat at zero for 13 days (Sep 4–16 2026). This job runs
// nightly in GitHub Actions with a read-only service account, pulls the handful of reports the
// Business Read and the Integrity Watch actually use, and commits them to the price-data branch next
// to the price feed. Lanes then read https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/ga4-latest.json.
//
// AUTH (keyless, decided 2026-09-18 after Mo said he will not handle GitHub secrets): the workflow
// authenticates to Google with GitHub's OIDC token through Workload Identity Federation
// (google-github-actions/auth@v2, pool "github", provider "github-actions", project 61398544448) and
// hands this script a short-lived access token in env GA4_ACCESS_TOKEN. No key file exists anywhere.
// Fallback for local use only: env GA4_SA_KEY = a service-account JSON (never committed, never in a
// doc or prompt). The account ga4-reader@shopcardhub-analytics.iam.gserviceaccount.com is a Viewer on
// GA4 property 541047014 and nothing else. No npm deps — Node 20's crypto + fetch.
//
// USAGE:  node tools/ga4-snapshot.mjs --out price-data/data        (writes ga4-latest.json + ga4-history.json)
//         node tools/ga4-snapshot.mjs --dry                        (prints the report requests, no network)
//
// WHAT IT NEVER DOES: change any GA4 setting (the Data API cannot; the account is Viewer anyway), read
// user-level data, or write anywhere but --out.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PROPERTY = process.env.GA4_PROPERTY || "541047014";
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith("--") ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true] : []).filter(Boolean));
const OUT = args.out || "price-data/data";
const DRY = !!args.dry;

const RANGES = {
  d28: [{ startDate: "28daysAgo", endDate: "yesterday" }],
  d7: [{ startDate: "7daysAgo", endDate: "yesterday" }],
  d1: [{ startDate: "yesterday", endDate: "yesterday" }],
};
const m = (...names) => names.map((name) => ({ name }));
const d = (...names) => names.map((name) => ({ name }));

// The reports. Names are the GA4 Data API's own (metrics/dimensions), not the UI labels.
const REPORTS = {
  daily28: { dateRanges: RANGES.d28, dimensions: d("date"), metrics: m("sessions", "activeUsers", "newUsers", "keyEvents", "engagementRate", "averageSessionDuration"), orderBys: [{ dimension: { dimensionName: "date" } }], limit: 100 },
  channels28: { dateRanges: RANGES.d28, dimensions: d("sessionDefaultChannelGroup"), metrics: m("sessions", "engagedSessions", "engagementRate", "averageSessionDuration", "keyEvents", "sessionKeyEventRate"), limit: 25 },
  channels7: { dateRanges: RANGES.d7, dimensions: d("sessionDefaultChannelGroup"), metrics: m("sessions", "engagedSessions", "keyEvents", "sessionKeyEventRate"), limit: 25 },
  sources7: { dateRanges: RANGES.d7, dimensions: d("sessionSourceMedium"), metrics: m("sessions", "keyEvents"), orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 25 },
  landing28: { dateRanges: RANGES.d28, dimensions: d("landingPage"), metrics: m("sessions", "activeUsers", "averageSessionDuration", "keyEvents", "sessionKeyEventRate"), orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 40 },
  landing7: { dateRanges: RANGES.d7, dimensions: d("landingPage"), metrics: m("sessions", "keyEvents", "sessionKeyEventRate"), orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 40 },
  events7: { dateRanges: RANGES.d7, dimensions: d("eventName"), metrics: m("eventCount", "totalUsers"), orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 60 },
  events1: { dateRanges: RANGES.d1, dimensions: d("eventName"), metrics: m("eventCount", "totalUsers"), limit: 60 },
  returning28: { dateRanges: RANGES.d28, dimensions: d("newVsReturning"), metrics: m("activeUsers", "sessions", "keyEvents"), limit: 5 },
  returning7: { dateRanges: RANGES.d7, dimensions: d("newVsReturning"), metrics: m("activeUsers", "sessions", "keyEvents"), limit: 5 },
  countries7: { dateRanges: RANGES.d7, dimensions: d("country"), metrics: m("activeUsers", "sessions", "keyEvents", "averageSessionDuration"), orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 40 },
  // country x day. Added 2026-09-20 on Mo's yes. The 2026-09-19 Integrity Watch found a country averaging
  // 0.149s over 61 sessions (21% of the window) and had to file "cause not established" because this file
  // carried no country-by-day report, so it could not test whether the burst landed on one day. It can now.
  countriesDaily7: { dateRanges: RANGES.d7, dimensions: d("country", "date"), metrics: m("sessions", "keyEvents", "averageSessionDuration"), orderBys: [{ dimension: { dimensionName: "date" } }], limit: 400 },
  devices28: { dateRanges: RANGES.d28, dimensions: d("deviceCategory"), metrics: m("sessions", "keyEvents", "sessionKeyEventRate"), limit: 5 },
  // No dimension → one totals row. sessionKeyEventRate here is GA4's own "sessions with a key event ÷ sessions",
  // which is what the UI's Traffic-acquisition total shows (5.59% on 2026-09-18), not key events ÷ sessions.
  totals28: { dateRanges: RANGES.d28, metrics: m("sessions", "activeUsers", "keyEvents", "sessionKeyEventRate", "engagementRate"), limit: 1 },
  totals7: { dateRanges: RANGES.d7, metrics: m("sessions", "activeUsers", "keyEvents", "sessionKeyEventRate", "engagementRate"), limit: 1 },
};

function b64url(buf) { return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${claim}`), sa.private_key);
  const assertion = `${header}.${claim}.${b64url(sig)}`;
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!r.ok) throw new Error(`token exchange ${r.status}: ${await r.text()}`);
  return (await r.json()).access_token;
}

async function runReport(token, body) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}:runReport`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`runReport ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const dims = (j.dimensionHeaders || []).map((h) => h.name);
  const mets = (j.metricHeaders || []).map((h) => h.name);
  const rows = (j.rows || []).map((row) => {
    const o = {};
    (row.dimensionValues || []).forEach((v, i) => { o[dims[i]] = v.value; });
    (row.metricValues || []).forEach((v, i) => { o[mets[i]] = Number(v.value); });
    return o;
  });
  return { rows, rowCount: j.rowCount || rows.length };
}

// BOT FILTER (2026-09-20, Mo: "yes bot filter").
//
// GA4 CANNOT DO THIS ITSELF, and that is why it lives here. GA4 data filters support exactly two
// types — Internal traffic and Developer traffic. There is no country filter and no duration filter.
// Its built-in IAB bot exclusion is already on and does not catch this. So the choice is (a) block
// upstream so the sessions never fire, or (b) subtract them where the numbers are read. This is (b),
// and it is applied HERE because every lane reads this one file — fixing the denominator once fixes
// the Business Read, the Integrity Watch and the weekly together.
//
// THE TEST IS BEHAVIOURAL, NOT A COUNTRY LIST, on purpose. The Sep 19 watch made exactly this
// argument against its own prompt: its bar was a share test (">40% of US sessions") and the evidence
// was a duration test, so a literal reading would have let 0.149-second traffic through. Naming
// Singapore in code would catch this one burst and miss the next one from somewhere else. A country
// averaging under two seconds a session is not people, wherever it is.
//
// WHAT IT DOES NOT DO: delete anything. Both figures are always emitted — raw and clean, with the
// suspects named — because a filter nobody can audit is how a number quietly becomes wrong. Same
// rule as organic-beside-blended.
const BOT_MAX_AVG_SESSION_SEC = 2;   // a real visit is not under two seconds
const BOT_MIN_SESSIONS = 10;         // below this it is noise, not a cluster worth subtracting

function botFilter(rep) {
  const rows = rep.countries7.rows || [];
  const suspects = rows.filter((r) => (r.sessions || 0) >= BOT_MIN_SESSIONS && r.averageSessionDuration != null && r.averageSessionDuration < BOT_MAX_AVG_SESSION_SEC);
  const totalSessions = rows.reduce((s, r) => s + (r.sessions || 0), 0);
  const botSessions = suspects.reduce((s, r) => s + (r.sessions || 0), 0);
  const botKeyEvents = suspects.reduce((s, r) => s + (r.keyEvents || 0), 0);
  const cleanSessions = totalSessions - botSessions;
  const cleanKeyEvents = rows.reduce((s, r) => s + (r.keyEvents || 0), 0) - botKeyEvents;
  return {
    rule: `avg session < ${BOT_MAX_AVG_SESSION_SEC}s over >= ${BOT_MIN_SESSIONS} sessions, 7d, by country`,
    suspects: suspects.map((r) => ({ country: r.country, sessions: r.sessions, keyEvents: r.keyEvents || 0, avgSessionSec: +(r.averageSessionDuration || 0).toFixed(3) })),
    botSessions7: botSessions,
    botShare7: totalSessions ? +(botSessions / totalSessions * 100).toFixed(2) : null,
    cleanSessions7: cleanSessions,
    cleanKeyEvents7: cleanKeyEvents,
    // keyEvents / sessions, NOT GA4's sessionKeyEventRate (which is sessions-with-a-key-event / sessions
    // and cannot be recomputed after subtracting rows). Labelled so nobody compares it to the blended
    // figure above and calls the difference a change in behaviour. Compare clean to clean.
    cleanKeyEventsPerSession7: cleanSessions ? +(cleanKeyEvents / cleanSessions * 100).toFixed(2) : null,
    rawKeyEventsPerSession7: totalSessions ? +(rows.reduce((s, r) => s + (r.keyEvents || 0), 0) / totalSessions * 100).toFixed(2) : null,
  };
}

function derive(rep) {
  const ch28 = rep.channels28.rows, ch7 = rep.channels7.rows;
  const pick = (rows, name) => rows.find((r) => r.sessionDefaultChannelGroup === name) || {};
  const tot = (rows, k) => rows.reduce((s, r) => s + (r[k] || 0), 0);
  const org28 = pick(ch28, "Organic Search"), org7 = pick(ch7, "Organic Search");
  const ret28 = rep.returning28.rows.find((r) => r.newVsReturning === "returning") || {};
  const ret7 = rep.returning7.rows.find((r) => r.newVsReturning === "returning") || {};
  const ev = (rows, name) => (rows.find((r) => r.eventName === name) || {}).eventCount || 0;
  return {
    // The two standing metric rulings (STATE.md, 2026-09-16): organic-channel KE rate beside the blended, never instead.
    sessions28: (rep.totals28.rows[0] || {}).sessions ?? tot(ch28, "sessions"), keyEvents28: (rep.totals28.rows[0] || {}).keyEvents ?? tot(ch28, "keyEvents"),
    // "blended" = GA4's session key event rate over all channels (sessions with ≥1 key event ÷ sessions), as the UI reports it.
    blendedKeyEventRate28: (rep.totals28.rows[0] || {}).sessionKeyEventRate != null ? +((rep.totals28.rows[0].sessionKeyEventRate) * 100).toFixed(2) : null,
    blendedKeyEventRate7: (rep.totals7.rows[0] || {}).sessionKeyEventRate != null ? +((rep.totals7.rows[0].sessionKeyEventRate) * 100).toFixed(2) : null,
    sessions7: (rep.totals7.rows[0] || {}).sessions ?? null, keyEvents7: (rep.totals7.rows[0] || {}).keyEvents ?? null,
    organicKeyEventRate28: org28.sessionKeyEventRate != null ? +(org28.sessionKeyEventRate * 100).toFixed(2) : null,
    organicKeyEventRate7: org7.sessionKeyEventRate != null ? +(org7.sessionKeyEventRate * 100).toFixed(2) : null,
    organicSessions28: org28.sessions || 0, directSessions28: pick(ch28, "Direct").sessions || 0,
    // averageSessionDuration is GA4's session-duration metric (seconds), NOT the UI's "average engagement time per session" — the two differ by design.
    directAvgSessionDurationSec28: pick(ch28, "Direct").averageSessionDuration != null ? Math.round(pick(ch28, "Direct").averageSessionDuration) : null,
    returningUsers28: ret28.activeUsers || 0, returningShare28: (() => { const all = tot(rep.returning28.rows, "activeUsers"); return all ? +((ret28.activeUsers || 0) / all * 100).toFixed(2) : null; })(),
    returningShare7: (() => { const all = tot(rep.returning7.rows, "activeUsers"); return all ? +((ret7.activeUsers || 0) / all * 100).toFixed(2) : null; })(),
    clicks7: ev(rep.events7.rows, "click"), buystripClicks7: ev(rep.events7.rows, "buystrip_click"), buyboxClicks7: ev(rep.events7.rows, "buybox_click"),
    trackCardFromPage7: ev(rep.events7.rows, "track_card_from_page"), newsletterSignup7: ev(rep.events7.rows, "newsletter_signup"),
    keyEventsYesterday: (rep.daily28.rows.at(-1) || {}).keyEvents ?? null, sessionsYesterday: (rep.daily28.rows.at(-1) || {}).sessions ?? null,
    topCountry7: (rep.countries7.rows[0] || {}).country || null, nonUSTopCountry7: (rep.countries7.rows.find((r) => r.country !== "United States") || {}),
    // Raw figures stay above, unchanged. The bot-adjusted pair sits beside them, never instead of them.
    bots: botFilter(rep),
  };
}

async function main() {
  if (DRY) { console.log(JSON.stringify({ property: PROPERTY, reports: REPORTS }, null, 2)); return; }
  let token = process.env.GA4_ACCESS_TOKEN;
  if (!token) {
    const keyRaw = process.env.GA4_SA_KEY;
    if (!keyRaw) { console.error("Neither GA4_ACCESS_TOKEN (Workload Identity, the normal path in Actions) nor GA4_SA_KEY is set — nothing read, nothing written. See claude/handoffs/ga4-snapshot-2026-09-18.md"); process.exit(2); }
    token = await accessToken(JSON.parse(keyRaw));
  }
  const rep = {};
  for (const [name, body] of Object.entries(REPORTS)) rep[name] = await runReport(token, body);
  const generatedAt = new Date().toISOString();
  const day = new Date(Date.now() - 864e5).toISOString().slice(0, 10); // the "yesterday" the ranges end on
  const summary = derive(rep);
  const latest = { _comment: "GA4 nightly snapshot — read-only Data API pull by tools/ga4-snapshot.mjs. Windows end on 'yesterday' (GA4 finishes processing a day ~24h after it ends). Rates are percentages. Never a source of user-level data.", property: PROPERTY, generatedAt, day, summary, reports: rep };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "ga4-latest.json"), JSON.stringify(latest, null, 1) + "\n");
  const histPath = path.join(OUT, "ga4-history.json");
  let hist = { _comment: "One row per day (the 'day' the windows end on): the summary block of that night's ga4-latest.json. Trailing-median material for the Integrity Watch.", rows: [] };
  if (fs.existsSync(histPath)) { try { hist = JSON.parse(fs.readFileSync(histPath, "utf8")); } catch { /* start over */ } }
  hist.rows = (hist.rows || []).filter((r) => r.day !== day);
  hist.rows.push({ day, generatedAt, ...summary });
  hist.rows.sort((a, b) => a.day.localeCompare(b.day));
  hist.rows = hist.rows.slice(-400);
  fs.writeFileSync(histPath, JSON.stringify(hist, null, 1) + "\n");
  console.log(`ga4-snapshot ${day}: sessions28 ${summary.sessions28} · KE28 ${summary.keyEvents28} (blended ${summary.blendedKeyEventRate28}% · organic ${summary.organicKeyEventRate28}%) · returning28 ${summary.returningShare28}% · clicks7 ${summary.clicks7} · buystrip7 ${summary.buystripClicks7} · KE yesterday ${summary.keyEventsYesterday}`);
}

main().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
