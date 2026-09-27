#!/usr/bin/env node
// score.mjs — the Growth League's registry sync, cap check and scoreboard (LANE-RULES R27, Sep 26 2026).
//
//   node tools/league/score.mjs --sync     merge tools/league/manifests/*.json into data/league.json (new slugs only;
//                                          an existing row keeps its published/floorFrom — scores are never hand-set)
//   node tools/league/score.mjs --check    exit 1 if any agent exceeds pagesPerAgentPerWeek in any league week, a
//                                          registered page is missing on disk, or a manifest's slug has no page
//   node tools/league/score.mjs            print the board from the nightly GA4 snapshot and write data/league-board.json
//                                          (--ga4 <file|url> to read another snapshot; default = the price-data branch)
//
// The score is ORGANIC-SEARCH landing sessions per page from its `published` date (GA4 report landingOrganicDaily28,
// organic only — the bot clusters land Direct). Clicks (click + buystrip_click + buybox_click) and newsletter_signup
// per page come from pageClicks28 and are reported, never ranked on (R14). Two reads, never confused:
//   FLOOR   per page: < rules.floor.minOrganicSessions organic sessions in the first rules.floor.windowDays days from
//           floorFrom → "dead" (the Monday run 301s it to its hub). Only pages whose window has closed are judged.
//   RANKING per agent: needs >= rules.ranking.minOrganicSessionsPerAgent on the agent's page set; below it the board
//           prints "not rankable" and nothing is bred or rewritten on performance grounds.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isoWeekOf } from "./lib.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const REG = path.join(REPO, "data/league.json");
const MAN = path.join(REPO, "tools/league/manifests");
const TODAY = opt("--today", new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }));
const reg = JSON.parse(fs.readFileSync(REG, "utf8"));
const days = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);

if (args.includes("--sync")) {
  let added = 0;
  for (const f of fs.existsSync(MAN) ? fs.readdirSync(MAN).filter((n) => n.endsWith(".json")) : []) {
    const m = JSON.parse(fs.readFileSync(path.join(MAN, f), "utf8"));
    if (!m.slug || !m.agent || !m.published) throw new Error(`${f}: slug, agent, published are required`);
    if (reg.pages.some((p) => p.slug === m.slug)) continue;
    reg.pages.push({ slug: m.slug, agent: m.agent, query: m.query || "", published: m.published, floorFrom: m.floorFrom || m.published, hub: m.hub || "/research", week: isoWeekOf(reg.opened, m.published), status: "live" });
    added++;
  }
  reg.pages.sort((a, b) => a.published.localeCompare(b.published) || a.slug.localeCompare(b.slug));
  fs.writeFileSync(REG, JSON.stringify(reg, null, 1) + "\n");
  console.log(`sync: ${added} page(s) added · ${reg.pages.length} registered`);
}

if (args.includes("--check")) {
  const bad = [];
  const cap = reg.rules.pagesPerAgentPerWeek;
  const count = {};
  for (const p of reg.pages) {
    if (p.status === "live" && !fs.existsSync(path.join(REPO, p.slug + ".html"))) bad.push(`${p.slug}: registered live but no ${p.slug}.html`);
    const k = `${p.agent}/w${p.week}`; count[k] = (count[k] || 0) + 1;
    if (count[k] > cap) bad.push(`${k}: ${count[k]} pages > cap ${cap}`);
  }
  for (const f of fs.existsSync(MAN) ? fs.readdirSync(MAN).filter((n) => n.endsWith(".json")) : []) {
    const m = JSON.parse(fs.readFileSync(path.join(MAN, f), "utf8"));
    if (!fs.existsSync(path.join(REPO, m.slug + ".html"))) bad.push(`manifest ${f}: no ${m.slug}.html`);
    if (!reg.pages.some((p) => p.slug === m.slug)) bad.push(`manifest ${f}: not in data/league.json (run --sync)`);
    const html = fs.existsSync(path.join(REPO, m.slug + ".html")) ? fs.readFileSync(path.join(REPO, m.slug + ".html"), "utf8") : "";
    if (html && !html.includes(`customid=${m.slug}`)) bad.push(`${m.slug}.html: no eBay link tagged customid=${m.slug}-… (the page's clicks would be unattributable)`);
  }
  console.log(bad.length ? "check: FAIL\n  " + bad.join("\n  ") : `check: ok (${reg.pages.length} pages, cap ${cap}/agent/week)`);
  if (bad.length) process.exit(1);
}

if (!args.includes("--sync") && !args.includes("--check")) {
  const src = opt("--ga4", "https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/ga4-latest.json");
  const ga = /^https?:/.test(src) ? await (await fetch(src)).json() : JSON.parse(fs.readFileSync(src, "utf8"));
  const land = (ga.reports.landingOrganicDaily28 || {}).rows || [];
  const ev = (ga.reports.pageClicks28 || {}).rows || [];
  if (!ga.reports.landingOrganicDaily28) console.log("note: this snapshot predates the league reports (landingOrganicDaily28) — every page scores 0 until the next nightly run");
  const byPage = {};
  for (const p of reg.pages) {
    const lp = "/" + p.slug;
    const rows = land.filter((r) => (r.landingPage === lp || r.landingPage === lp + "/") && r.date >= p.published.replace(/-/g, ""));
    const sessions = rows.reduce((s, r) => s + (+r.sessions || 0), 0);
    const clicks = ev.filter((r) => r.pagePath === lp && ["click", "buystrip_click", "buybox_click"].includes(r.eventName)).reduce((s, r) => s + (+r.eventCount || 0), 0);
    const signups = ev.filter((r) => r.pagePath === lp && r.eventName === "newsletter_signup").reduce((s, r) => s + (+r.eventCount || 0), 0);
    const floorRows = rows.filter((r) => r.date >= p.floorFrom.replace(/-/g, ""));
    const floorSessions = floorRows.reduce((s, r) => s + (+r.sessions || 0), 0);
    const age = days(p.floorFrom, ga.day);
    const floor = p.status !== "live" ? p.status : age < reg.rules.floor.windowDays ? `open (${age}/${reg.rules.floor.windowDays}d)` : floorSessions < reg.rules.floor.minOrganicSessions ? "DEAD" : "alive";
    byPage[p.slug] = { ...p, sessions, clicks, signups, floorSessions, floor, days: days(p.published, ga.day) };
  }
  const agents = {};
  for (const [id, a] of Object.entries(reg.agents)) {
    const pages = Object.values(byPage).filter((p) => p.agent === id);
    const sessions = pages.reduce((s, p) => s + p.sessions, 0), clicks = pages.reduce((s, p) => s + p.clicks, 0), signups = pages.reduce((s, p) => s + p.signups, 0);
    agents[id] = { name: a.name, status: a.status, pages: pages.length, sessions, clicks, signups, rankable: sessions >= reg.rules.ranking.minOrganicSessionsPerAgent };
  }
  const order = Object.entries(agents).sort((x, y) => y[1].sessions - x[1].sessions);
  const board = { generation: reg.generation, opened: reg.opened, scoringDate: reg.scoringDate, ga4Day: ga.day, readAt: new Date().toISOString(), rules: reg.rules, agents, pages: Object.values(byPage) };
  fs.writeFileSync(path.join(REPO, "data/league-board.json"), JSON.stringify(board, null, 1) + "\n");
  console.log(`GROWTH LEAGUE · generation ${reg.generation} · GA4 day ${ga.day} · scoring ${reg.scoringDate} (organic landing sessions; clicks reported, not ranked)`);
  for (const [id, a] of order) console.log(`  ${id} ${a.name.padEnd(16)} pages ${a.pages}  sessions ${String(a.sessions).padStart(4)}  clicks ${String(a.clicks).padStart(3)}  signups ${a.signups}  ${a.rankable ? "RANKABLE" : `not rankable (< ${reg.rules.ranking.minOrganicSessionsPerAgent})`}`);
  for (const p of Object.values(byPage)) console.log(`     ${p.agent} /${p.slug.padEnd(44)} d${String(p.days).padStart(2)}  sess ${String(p.sessions).padStart(3)}  clicks ${String(p.clicks).padStart(3)}  floor ${p.floor}`);
  if (!reg.pages.length) console.log("  (no pages registered)");
}
