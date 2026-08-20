#!/usr/bin/env node
// audit-site.mjs — deterministic technical sweep for the MWF Site Auditor agent.
// Read-only: scans the repo, prints findings, exits 1 on any FAIL.
// Ground-truth layer: everything here is a hard check, not a judgment call.
// The agent run wraps this + audit-prices.mjs, adds the judgment-call passes
// (see tools/site-auditor/CHARTER.md), and files proposals — never edits.
//
// Usage: node tools/site-auditor/audit-site.mjs [--json]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const JSON_OUT = process.argv.includes("--json");

// Pages that intentionally sit outside the public site contract
const SKIP_FILES = new Set(["card-dungeon.html", "welcome-email.html"]);
// Pages allowed to be missing from sitemap.xml (utility/legal are IN the sitemap
// on this site; only truly private pages belong here)
const SITEMAP_EXEMPT = new Set(["card-dungeon", "welcome-email", "index"]); // index = served at /

// THE mandatory EPN param set (see memory: Jul 28 2026 mkevt=1 incident —
// every param below missing = untracked clicks = lost income)
const EPN_REQUIRED = ["mkevt=1", "mkcid=1", "mkrid=711-53200-19255-0", "siteid=0", "campid=5339155990", "toolid=10001", "customid="];
const AMAZON_TAG = "tag=shopcardhub-20";
const AMAZON_DISCLOSURE = /as an amazon associate/i;

const findings = []; // {level: FAIL|WARN, check, file, detail}
const add = (level, check, file, detail) => findings.push({ level, check, file, detail });

const rootFiles = fs.readdirSync(REPO).filter(f => f.endsWith(".html"));
const pages = rootFiles.filter(f => !SKIP_FILES.has(f));
const read = f => fs.readFileSync(path.join(REPO, f), "utf8");
// Markup-only view: JS builds links at runtime (watchlist engine, ROI calc) —
// those carry params dynamically and are covered by their own runtime checks.
const markup = f => read(f).replace(/<script[\s\S]*?<\/script>/g, "");

/* ---------- 1. EPN link compliance ---------- */
for (const f of pages) {
  const html = markup(f);
  const links = html.match(/https?:\/\/(?:www\.)?ebay\.com\/[^"' )<>]+/g) || [];
  for (const u of links) {
    if (!u.includes("/sch/") && !u.includes("/itm/")) continue; // only search/item links carry EPN params
    const missing = EPN_REQUIRED.filter(p => !u.includes(p));
    if (missing.length) add("FAIL", "epn-params", f, `eBay link missing ${missing.join(",")}: ${u.slice(0, 110)}`);
    const cm = u.match(/campid=(\d+)/);
    if (cm && cm[1] !== "5339155990") add("FAIL", "epn-campid", f, `wrong campid ${cm[1]}: ${u.slice(0, 110)}`);
  }
}

/* ---------- 2. Amazon link compliance ---------- */
for (const f of pages) {
  const html = markup(f);
  const links = html.match(/https?:\/\/(?:www\.)?amazon\.com\/[^"' )<>]+/g) || [];
  if (!links.length) continue;
  for (const u of links) if (!u.includes(AMAZON_TAG)) add("FAIL", "amazon-tag", f, `untagged Amazon link: ${u.slice(0, 110)}`);
  if (!AMAZON_DISCLOSURE.test(read(f))) add("FAIL", "amazon-disclosure", f, "page has Amazon links but no Associates disclosure wording");
}

/* ---------- 3. Internal links resolve ---------- */
const slugSet = new Set(rootFiles.map(f => "/" + f.replace(/\.html$/, "")));
slugSet.add("/"); // homepage
for (const f of pages) {
  const html = markup(f);
  const hrefs = [...html.matchAll(/href="(\/[^"#?]*)/g)].map(m => m[1]).filter(h => !/[\s')]/.test(h));
  for (let h of hrefs) {
    if (h.startsWith("/api/") || h.startsWith("/js/") || h.startsWith("/data/") || h === "/favicon.svg" || h === "/sitemap.xml") {
      const p = path.join(REPO, h);
      if (!fs.existsSync(p)) add("FAIL", "asset-missing", f, `asset href ${h} not on disk`);
      continue;
    }
    h = h.replace(/\/$/, "") || "/";
    if (h !== "/" && !slugSet.has(h) && !slugSet.has(h.replace(/\.html$/, "")))
      add("FAIL", "dead-internal-link", f, `href ${h} has no matching page file`);
  }
}

/* ---------- 4. Local images exist; remote hosts inventoried ---------- */
const remoteHosts = new Map();
for (const f of pages) {
  const html = markup(f);
  for (const m of html.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
    const src = m[1].split(" ")[0].split("?")[0]; // strip cache-buster query strings
    if (src.startsWith("/")) {
      if (!fs.existsSync(path.join(REPO, src))) add("FAIL", "local-asset-missing", f, src);
    } else if (/^https?:\/\//.test(src)) {
      try { const h = new URL(src).host; remoteHosts.set(h, (remoteHosts.get(h) || 0) + 1); } catch {}
    }
  }
}

/* ---------- 5. HTML integrity (tag balance) ---------- */
for (const f of pages) {
  const html = read(f);
  for (const tag of ["div", "section", "table", "a"]) {
    const open = (html.match(new RegExp(`<${tag}[\\s>]`, "g")) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
    if (open !== close) add("FAIL", "tag-balance", f, `<${tag}> ${open} open vs ${close} close`);
  }
}

/* ---------- 6. Nav single-source (all pages share one NAV block) ---------- */
const navBlocks = new Map();
for (const f of pages) {
  const html = read(f);
  const m = html.match(/<!-- NAV:START -->([\s\S]*?)<!-- NAV:END -->/);
  if (!m) { add("WARN", "nav-missing", f, "no NAV:START/END block"); continue; }
  const key = m[1].replace(/\s+/g, " ").trim();
  navBlocks.set(key, (navBlocks.get(key) || []).concat(f));
}
if (navBlocks.size > 1) {
  const sorted = [...navBlocks.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [, files] of sorted.slice(1))
    add("FAIL", "nav-drift", files.join(","), `nav block differs from the majority variant (${sorted[0][1].length} pages) — rerun tools/build-nav.js`);
}
try {
  const nav = JSON.parse(read("data/nav.json"));
  for (const e of nav.searchExtra || [])
    if (!slugSet.has(e.href)) add("FAIL", "nav-search-dead", "data/nav.json", `searchExtra ${e.href} has no page`);
} catch (e) { add("FAIL", "nav-json", "data/nav.json", "unparseable: " + e.message); }

/* ---------- 7. Sitemap coverage (both directions) ---------- */
try {
  const xml = read("sitemap.xml");
  const inMap = new Set([...xml.matchAll(/shopcardhub\.com\/([a-z0-9-]*)/g)].map(m => m[1]).filter(Boolean));
  for (const f of pages) {
    const slug = f.replace(/\.html$/, "");
    if (!inMap.has(slug) && !SITEMAP_EXEMPT.has(slug)) add("WARN", "sitemap-missing-page", f, `page not in sitemap.xml`);
  }
  for (const slug of inMap)
    if (!fs.existsSync(path.join(REPO, slug + ".html"))) add("FAIL", "sitemap-dead-url", "sitemap.xml", `/${slug} listed but no file`);
} catch (e) { add("FAIL", "sitemap", "sitemap.xml", e.message); }

/* ---------- 8. Vault track-button contract ---------- */
for (const f of pages) {
  const html = read(f);
  const hasButtons = html.includes("sch-track-card");
  const hasScript = /\/js\/vault-track\.js\?v=\d+/.test(html);
  if (hasButtons && !hasScript) add("FAIL", "vault-script-missing", f, "has ★ Track buttons but no cache-busted /js/vault-track.js include");
  if (hasButtons) {
    // feed-linked buttons must NOT carry static price seeds (engine is the truth)
    for (const m of html.matchAll(/<button[^>]*sch-track-card[^>]*>/g)) {
      const b = m[0];
      if (b.includes("data-feed") && b.includes("data-price")) add("FAIL", "vault-seed-on-feed", f, "track button has BOTH data-feed and data-price (feed-linked buttons never get static seeds)");
    }
  }
}

/* ---------- 9. data/*.json validity + calls.json invariants ---------- */
for (const jf of ["data/calls.json", "data/pipeline.json", "data/nav.json", "data/watchlist.json", "data/newsletter.json"]) {
  try { JSON.parse(read(jf)); } catch (e) { add("FAIL", "json-invalid", jf, e.message); }
}
try {
  const calls = JSON.parse(read("data/calls.json")).calls || [];
  for (const c of calls) {
    if (!["open", "trending", "final"].includes(c.state)) add("FAIL", "calls-state", "data/calls.json", `${c.id}: bad state ${c.state}`);
    if (c.type === "range") {
      if (!(c.projLow > 0 && c.projHigh >= c.projLow)) add("FAIL", "calls-range", "data/calls.json", `${c.id}: bad projection ${c.projLow}-${c.projHigh}`);
      if (c.state === "final" && !["hit", "miss_high", "miss_low"].includes(c.grade)) add("FAIL", "calls-final-grade", "data/calls.json", `${c.id}: final range call without terminal grade`);
    }
    /* FINALS MUST BE GRADED ON SOLDS — but check the READ, not the ENTRY.
       `basis` describes how the ENTRY price was sourced when the call was
       published. What matters at finalization is how the FINAL READ was sourced.
       The old rule read `basis` and so warned forever on six calls whose reads
       are PriceCharting solds — 6 warnings x 3 runs a week that no action could
       ever clear. A warning that can't be cleared teaches you to ignore the
       warnings, and the next real one goes with it. Fixed Aug 20 2026.
       Precedence: explicit readBasis > sold-source named in readLabel > basis. */
    if (c.state === "final") {
      const label = String(c.readLabel || "");
      const readIsSold =
        c.readBasis === "sold" ||
        /\b(sold|solds|sales)\b/i.test(label) ||
        /pricecharting|sportscardspro|\bscp\b/i.test(label);
      if (!readIsSold && c.basis !== "sold") {
        add("WARN", "calls-final-basis", "data/calls.json",
            `${c.id}: finalized without a sold-basis read (basis=${c.basis}, readLabel=${label ? `"${label.slice(0, 60)}"` : "none"})`);
      }
    }
  }
} catch {}

/* ---------- report ---------- */
const fails = findings.filter(x => x.level === "FAIL");
const warns = findings.filter(x => x.level === "WARN");
if (JSON_OUT) {
  console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), pages: pages.length, fails, warns,
    remoteImageHosts: Object.fromEntries(remoteHosts) }, null, 1));
} else {
  console.log(`Site-auditor deterministic sweep — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`${pages.length} pages scanned · FAIL: ${fails.length} · WARN: ${warns.length}`);
  for (const x of fails) console.log(`  [FAIL] ${x.check} · ${x.file} — ${x.detail}`);
  for (const x of warns) console.log(`  [WARN] ${x.check} · ${x.file} — ${x.detail}`);
  if (remoteHosts.size) console.log(`  remote image hosts: ${[...remoteHosts.entries()].map(([h, n]) => `${h}(${n})`).join(" · ")}`);
}
process.exit(fails.length ? 1 : 0);
