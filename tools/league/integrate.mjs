#!/usr/bin/env node
// integrate.mjs — the commissioner's step: fold every league manifest into the shared files the agents may not touch
// (LANE-RULES R27; tools/league/LEAGUE.md §"What the commissioner does"). Idempotent — safe to re-run every Monday.
//
//   node tools/league/integrate.mjs [--check]
//
// For each tools/league/manifests/<slug>.json whose page exists:
//   1. `<!-- BUYSTRIP -->` placeholder → empty BUYSTRIP markers, so build-buy-strip.mjs bakes the strip where the
//      agent left the slot (under the hero, R11) instead of after NAV:END.
//   2. data/buy-strip.json  ← manifest.buyStrip (new slugs only; an existing entry is never overwritten here).
//   3. data/releases.json   ← manifest.releases[] (agent A): a row with the same normalised label is updated
//      (date/status/note/href/q/cat/source) — the newer read wins; anything else is appended. asOf = today.
//   4. sitemap.xml          ← a <url> for the page (weekly, 0.7) if absent.
//   5. data/nav.json        ← searchExtra row if absent (site search finds the page; no nav item, R27).
//   6. The hub page named in the manifest gets a LEAGUE-LINKS block before its <footer>, rebuilt from every
//      manifest that names that hub (skipped for /release-calendar — the calendar links release pages by href).
// Then run, in this order: build-buy-strip --only <slug>… · build-signup · build-release-calendar · build-home --feed
// data/feed · build-nav.js — the script prints the exact commands and runs them unless --check.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHECK = process.argv.includes("--check");
const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const MAN = path.join(REPO, "tools/league/manifests");
const rd = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const wr = (f, s) => { if (!CHECK) fs.writeFileSync(path.join(REPO, f), s); };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = (s) => String(s).toLowerCase().replace(/[—–-]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

const manifests = fs.readdirSync(MAN).filter((n) => n.endsWith(".json")).map((n) => JSON.parse(fs.readFileSync(path.join(MAN, n), "utf8")))
  .filter((m) => fs.existsSync(path.join(REPO, m.slug + ".html")));
const log = [];
const stripSlugs = [];

// 2. buy-strip.json
const bs = JSON.parse(rd("data/buy-strip.json"));
for (const m of manifests) {
  if (!m.buyStrip) continue;
  if (!bs.pages[m.slug]) {
    bs.pages[m.slug] = { ...m.buyStrip, _why: `Growth League ${m.agent} page (${m.published}); query "${m.query}". R11.` };
    log.push(`buy-strip: + ${m.slug}`);
  }
  stripSlugs.push(m.slug);
  // 1. placeholder → markers
  const f = m.slug + ".html";
  let html = rd(f);
  if (html.includes("<!-- BUYSTRIP -->")) { html = html.replace("<!-- BUYSTRIP -->", "<!-- BUYSTRIP:START -->\n<!-- BUYSTRIP:END -->"); wr(f, html); log.push(`${f}: BUYSTRIP slot armed`); }
}
wr("data/buy-strip.json", JSON.stringify(bs, null, 2) + "\n");

// 3. releases.json
const rel = JSON.parse(rd("data/releases.json"));
let relChanged = 0;
for (const m of manifests) for (const r of m.releases || []) {
  if (!r.date || !r.label) continue;
  const key = norm(r.label);
  const row = { date: r.date, family: r.family, sport: r.sport, label: r.label, note: r.note || "", status: r.status || "reported", href: r.href || null, q: r.q || undefined, cat: r.cat ? String(r.cat) : undefined, source: r.source || undefined };
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  if (row.href && !fs.existsSync(path.join(REPO, row.href.replace(/^\//, "").replace(/#.*$/, "") + ".html"))) row.href = null;
  const i = rel.items.findIndex((x) => norm(x.label) === key || (norm(x.label).startsWith(key.slice(0, 28)) && x.date === r.date));
  if (i > -1) {
    const before = JSON.stringify(rel.items[i]);
    rel.items[i] = { ...rel.items[i], ...row, href: row.href || rel.items[i].href || null };
    if (JSON.stringify(rel.items[i]) !== before) { relChanged++; log.push(`releases: ~ ${r.label} (${r.date}, ${row.status})`); }
  } else { rel.items.push(row); relChanged++; log.push(`releases: + ${r.label} (${r.date}, ${row.status})`); }
}
// league pages that ARE release pages: make sure their row links to them
for (const m of manifests) if (m.agent === "A" && m.hub === "/release-calendar") {
  for (const x of rel.items) if (!x.href && m.releases?.some((r) => r.href === "/" + m.slug && norm(r.label) === norm(x.label))) x.href = "/" + m.slug;
}
rel.items.sort((a, b) => a.date.localeCompare(b.date));
if (relChanged) { rel.asOf = TODAY; wr("data/releases.json", JSON.stringify(rel, null, 1) + "\n"); }

// 4. sitemap.xml
let sm = rd("sitemap.xml");
for (const m of manifests) {
  const loc = `https://www.shopcardhub.com/${m.slug}`;
  if (sm.includes(`<loc>${loc}</loc>`)) continue;
  sm = sm.replace("</urlset>", `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`);
  log.push(`sitemap: + /${m.slug}`);
}
wr("sitemap.xml", sm);

// 5. nav.json searchExtra
const nav = JSON.parse(rd("data/nav.json"));
nav.searchExtra = nav.searchExtra || [];
for (const m of manifests) {
  const href = "/" + m.slug;
  if (nav.searchExtra.some((x) => x.href === href)) continue;
  nav.searchExtra.push({ href, label: (m.searchExtra && m.searchExtra.label) || m.title || m.slug });
  log.push(`searchExtra: + ${href}`);
}
wr("data/nav.json", JSON.stringify(nav, null, 2) + "\n");

// 6. hub links
const hubs = {};
for (const m of manifests) { if (!m.hub || m.hub === "/release-calendar") continue; (hubs[m.hub] = hubs[m.hub] || []).push(m); }
for (const [hub, ms] of Object.entries(hubs)) {
  const f = hub.replace(/^\//, "") + ".html";
  if (!fs.existsSync(path.join(REPO, f))) { log.push(`hub ${hub}: no page, link skipped`); continue; }
  let html = rd(f);
  const S = "<!-- LEAGUE-LINKS:START -->", E = "<!-- LEAGUE-LINKS:END -->";
  const items = ms.sort((a, b) => a.published.localeCompare(b.published)).map((m) => `<li><a href="/${esc(m.slug)}">${esc(m.hubLinkText || m.title || m.slug)}</a> <small>${esc(m.published)}</small></li>`).join("\n");
  const block = `${S}
<section class="league-links" style="max-width:1060px;margin:0 auto;padding:10px 24px 26px;border-top:1px solid var(--bd,rgba(255,255,255,.1));">
  <div style="font-family:var(--fm,monospace);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold,#f5c800);margin-bottom:8px;">Answered from this tape</div>
  <ul style="list-style:none;margin:0;padding:0;font-family:var(--fb,sans-serif);font-size:13.5px;line-height:1.7;">
${items}
  </ul>
</section>
${E}`;
  const a = html.indexOf(S), b = html.indexOf(E);
  let next;
  if (a > -1 && b > -1) next = html.slice(0, a) + block + html.slice(b + E.length);
  else {
    // anchor, in order: after the SEALED block (chase index pages) · after the sector block's END marker (sector index
    // pages) · before <footer> (guide pages). The block sits with the content, never inside a generated region.
    const sealed = html.indexOf("<!-- SEALED:END -->");
    const sector = html.search(/<!-- [A-Z0-9]+:END -->\n(?=\s*<script)/);
    const foot = html.lastIndexOf("<footer");
    if (sealed > -1) { const at = sealed + "<!-- SEALED:END -->".length; next = html.slice(0, at) + "\n" + block + html.slice(at); }
    else if (sector > -1) { const at = html.indexOf("-->", sector) + 3; next = html.slice(0, at) + "\n" + block + html.slice(at); }
    else if (foot > -1) next = html.slice(0, foot) + block + "\n" + html.slice(foot);
    else { log.push(`hub ${hub}: no anchor, link skipped`); continue; }
  }
  if (next !== html) { wr(f, next); log.push(`hub ${hub}: ${ms.length} league link(s)`); }
}

console.log((CHECK ? "check: " : "") + (log.length ? log.join("\n") : "nothing to integrate"));
if (CHECK) process.exit(0);
const cmds = [
  ...stripSlugs.map((s) => `node tools/build-buy-strip.mjs --only ${s}`),
  "node tools/build-signup.mjs",
  "node tools/build-release-calendar.mjs",
  "node tools/build-home.mjs --feed data/feed",
  "node tools/build-nav.js",
];
for (const c of cmds) { console.log("$ " + c); execSync(c, { cwd: REPO, stdio: "inherit" }); }
