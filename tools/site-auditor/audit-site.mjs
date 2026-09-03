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
// index = served at /; set-index-preview = the BOW26 mockup (title starts "MOCKUP —"),
// deliberately unlisted and noindexed rather than added to the sitemap (Aug 25, 2026).
const SITEMAP_EXEMPT = new Set(["card-dungeon", "welcome-email", "index", "set-index-preview"]);

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
// Structural view for tag counting: no <script>, no <style>, no HTML comments.
// A "<section>" inside a CSS comment (index.html, Sep 1 2026) counted as an open tag
// and produced a false 6-vs-5 imbalance — tags only exist in markup, so count only markup.
const structural = f => read(f)
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<style[\s\S]*?<\/style>/g, "")
  .replace(/<!--[\s\S]*?-->/g, "");
// Self-hosted assets (fonts/CSS moved on-site Sep 1 2026) live under these roots
const ASSET_PREFIXES = ["/api/", "/js/", "/css/", "/fonts/", "/data/"];

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
    if (ASSET_PREFIXES.some(p => h.startsWith(p)) || h === "/favicon.svg" || h === "/sitemap.xml") {
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
  const html = structural(f); // markup only — style/script/comments stripped (Sep 2 2026)
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

/* ---------- 10. set checklists: 1st Bowman + Bangers integrity (added Aug 21, 2026) ----------
   Mo's rule: the 1st Bowman logo is on EVERY Bowman card a player gets in his debut year — paper,
   Chrome, Sapphire, September Bowman Chrome, Draft, and all parallels. Saying a card is NOT a 1st
   when it is (or vice versa) is a site-trust breakdown. These checks are deterministic and run on
   every sweep:
     first-bowman-board         a Bangers board name in a Bowman-family set MUST carry board:true AND first:true
     bangers-tag-stray          board:true on a player who is not on the board (board-history.json entryDates)
     first-bowman-inconsistent  same player, same Bowman year: first:true in one set, unflagged in another
     first-bowman-contradiction first:true in year Y but the player appears in a set file of an earlier year
     first-bowman-copy          page copy that denies a 1st ("not his 1st", "isn't a 1st Bowman", …)
     sets-json-invalid/schema   data/sets/*.json must parse and carry set/slug/groups/cards{n,player}
   Board names come from data/board-history.json → entryDates (slugs), so a new board name is covered
   the week it is promoted — no list to maintain here. */
try {
  const slugify = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const bh = JSON.parse(read("data/board-history.json"));
  const boardSlugs = new Set(Object.keys(bh.entryDates || {}));
  const setsDir = path.join(REPO, "data/sets");
  const setFiles = fs.existsSync(setsDir) ? fs.readdirSync(setsDir).filter(f => f.endsWith(".json")) : [];
  const sets = [];
  for (const f of setFiles) {
    const rel = "data/sets/" + f;
    let d; try { d = JSON.parse(read(rel)); } catch (e) { add("FAIL", "sets-json-invalid", rel, e.message); continue; }
    if (!d.set || !d.slug || !Array.isArray(d.groups)) { add("FAIL", "sets-json-schema", rel, "missing set/slug/groups"); continue; }
    const year = parseInt(String(d.set).match(/\b(20\d\d)\b/)?.[1] || "0", 10);
    const bowman = /\bbowman\b/i.test(d.set);
    const cards = [];
    for (const g of d.groups) for (const c of (g.cards || [])) {
      if (!c.n || !c.player) { add("FAIL", "sets-json-schema", rel, `${g.key || g.title}: card without n/player`); continue; }
      cards.push({ ...c, group: g.key || g.title, pslug: slugify(c.player) });
    }
    sets.push({ rel, d, year, bowman, cards });
  }
  // A. board names + stray BANGERS tags
  for (const s of sets) {
    for (const c of s.cards) {
      const onBoard = boardSlugs.has(c.pslug);
      if (onBoard && s.bowman && (!c.board || !c.first))
        add("FAIL", "first-bowman-board", s.rel, `${c.n} ${c.player} (${c.group}): Bangers board name in a Bowman set must be board:true + first:true (has board=${!!c.board}, first=${!!c.first})`);
      if (c.board && !onBoard)
        add("FAIL", "bangers-tag-stray", s.rel, `${c.n} ${c.player} (${c.group}): board:true but not on the Bangers board`);
    }
  }
  // B. same-year consistency across Bowman-family sets, and C. earlier-year contradictions
  const firstBy = new Map();   // pslug → {year, rel, n}
  const seenBy = new Map();    // pslug → [{year, rel, n, first}]
  for (const s of sets) for (const c of s.cards) {
    if (!seenBy.has(c.pslug)) seenBy.set(c.pslug, []);
    seenBy.get(c.pslug).push({ year: s.year, rel: s.rel, n: c.n, first: !!c.first, bowman: s.bowman });
    if (c.first && s.bowman && (!firstBy.has(c.pslug) || s.year < firstBy.get(c.pslug).year)) firstBy.set(c.pslug, { year: s.year, rel: s.rel, n: c.n });
  }
  for (const [p, f] of firstBy) {
    for (const o of seenBy.get(p) || []) {
      if (!o.bowman) continue;
      if (o.year === f.year && !o.first)
        add("FAIL", "first-bowman-inconsistent", o.rel, `${o.n} ${p}: flagged 1st Bowman in ${f.rel} (${f.n}) but unflagged here — the 1st logo is on every ${f.year} Bowman card of a ${f.year} debut`);
      if (o.year && o.year < f.year)
        add("FAIL", "first-bowman-contradiction", f.rel, `${f.n} ${p}: flagged 1st Bowman (${f.year}) but appears in ${o.rel} (${o.n}, ${o.year}) — cannot be a ${f.year} debut`);
    }
  }
  // D. copy that denies a 1st
  const deny = /not his 1st|not (his|a|the) first bowman|isn.?t (his|a) (1st|first)( bowman)?|NOT HIS 1ST|no longer a 1st/i;
  for (const f of pages) { const m = markup(f).match(deny); if (m) add("FAIL", "first-bowman-copy", f, `copy denies a 1st Bowman: "${m[0]}" — a 1st logo is on every debut-year Bowman card; verify before publishing any such claim`); }
  if (!setFiles.length) add("WARN", "sets-missing", "data/sets", "no checklist files found");
} catch (e) { add("WARN", "first-bowman-check-error", "tools/site-auditor", e.message); }

/* ---------- 11. Placeholder copy vs live features (auditor-placeholder-rule, applied Sep 2 2026) ----------
   Mo found three whole classes of stale placeholder copy on the homepage Aug 31 that the sweep never saw.
   Every feature these phrases wait on is LIVE (engine since Aug, indices Aug 24, Vault, /api/comps), so
   any feature-placeholder is a FAIL. "Coming soon" is a WARN only: it can be honest on a pre-release
   product page, and the per-product release registry the proposal named does not exist yet — the
   released-product half of this rule waits for that file rather than guessing from copy. */
const PLACEHOLDER_FAIL = [
  [/see live comps/i, "'See live comps' — /api/comps has been live since Jul 28; wire the ask or mark the cell"],
  [/\bcomps?\s+TBD\b/i, "'comps TBD' — sold comps are pullable (SCP/PriceCharting); mark it or label it"],
  [/\bonce [^.<]{0,60}?\bis connected\b/i, "'once … is connected' — the engine/Vault/indices are all connected"],
  [/\bwhen the (?:price )?engine (?:goes|is) live\b/i, "engine-pending copy — the engine has been live since August"],
];
const PLACEHOLDER_WARN = [[/\bcoming soon\b/i, "'Coming soon' — verify the product/feature is still unreleased"]];
for (const f of pages) {
  const text = markup(f).replace(/<!--[\s\S]*?-->/g, "");
  for (const [re, why] of PLACEHOLDER_FAIL) { const m = text.match(re); if (m) add("FAIL", "placeholder-copy", f, `${why}: "${m[0].slice(0, 80)}"`); }
  for (const [re, why] of PLACEHOLDER_WARN) { const m = text.match(re); if (m) add("WARN", "placeholder-copy", f, `${why}: "${m[0].slice(0, 80)}"`); }
}

/* ---------- 12. Feed / line integrity (auditor-feed-line-rule, applied Sep 2 2026) ----------
   From the Aug 31 Sapphire bug: 10 of 16 chrome queries lacked -sapphire and the Vault could chart Chrome
   prices on Sapphire cards. LINE tokens checked: sapphire, auto. Three deterministic checks:
     feed-line-unguarded   a chrome-line feed (cardType chrome-* or "bowman … chrome" query) whose label is not
                           sapphire must exclude sapphire in its query (-sapphire)
     feed-line-label       a feed's label and the POSITIVE tokens of its query must agree on sapphire/auto
     track-feed-line       a page Track button's data-name and its data-feed's label must agree on sapphire/auto
   Pokémon (tcg-single) feeds carry neither token and pass trivially. */
const lineTokens = s => { s = String(s || "").toLowerCase(); return { sapphire: /\bsapphire\b/.test(s), auto: /\bautos?\b|\bautographs?\b/.test(s) }; };
const posQueryTokens = q => String(q || "").split(/\s+/).filter(t => t && !t.startsWith("-")).join(" ");
const feedMap = new Map();
try {
  const wl = JSON.parse(read("data/watchlist.json"));
  for (const c of wl.cards || []) {
    feedMap.set(c.id, c);
    const label = lineTokens(c.label), pos = lineTokens(posQueryTokens(c.query));
    const chromeLine = /^chrome/.test(String(c.cardType || "chrome-auto")) || /\bbowman\b.*\bchrome\b/i.test(c.query || "");
    if (chromeLine && !label.sapphire && !/(^|\s)-sapphire\b/i.test(c.query || ""))
      add("FAIL", "feed-line-unguarded", "data/watchlist.json", `${c.id}: chrome-line query has no -sapphire exclusion — Sapphire listings can price this feed`);
    for (const t of ["sapphire", "auto"])
      if (label[t] !== pos[t]) add("FAIL", "feed-line-label", "data/watchlist.json", `${c.id}: label ${label[t] ? "has" : "lacks"} '${t}' but query ${pos[t] ? "has" : "lacks"} it (label="${c.label}")`);
  }
} catch (e) { add("FAIL", "feed-line-check-error", "data/watchlist.json", e.message); }
for (const f of pages) {
  for (const m of read(f).matchAll(/<button[^>]*sch-track-card[^>]*>/g)) {
    const b = m[0];
    const feedId = (b.match(/data-feed="(?:ebay:)?([^"]+)"/) || [])[1];
    if (!feedId) continue;
    const name = (b.match(/data-name="([^"]*)"/) || [])[1] || "";
    const feed = feedMap.get(feedId);
    if (!feed) { add("FAIL", "track-feed-missing", f, `data-feed ${feedId} is not in data/watchlist.json (name="${name}")`); continue; }
    const a = lineTokens(name), c = lineTokens(feed.label);
    for (const t of ["sapphire", "auto"])
      if (a[t] !== c[t]) add("FAIL", "track-feed-line", f, `button "${name}" ${a[t] ? "is" : "is not"} '${t}' but feed ${feedId} ${c[t] ? "is" : "is not"} — the Vault would chart the wrong line`);
  }
}

/* ---------- 13. z-index layering contract (auditor-zindex-rule, applied Sep 2 2026) ----------
   Aug 30: the Vault chooser (z 410) sat dead behind every index page's .ovl (z 500). Contract: on any page
   that loads an injected overlay widget, the page's highest z-index must stay BELOW the widget's lowest.
   Widget z values are read from the script itself, so a widget change re-derives the bar automatically. */
const OVERLAY_WIDGETS = ["js/vault-track.js"];
const zValues = s => [...String(s).matchAll(/z-index\s*:\s*(-?\d+)/g)].map(m => parseInt(m[1], 10));
for (const w of OVERLAY_WIDGETS) {
  let wz; try { wz = zValues(read(w)); } catch { add("WARN", "zindex-widget-missing", w, "widget script not on disk"); continue; }
  if (!wz.length) continue;
  const floor = Math.min(...wz);
  const inc = new RegExp("/" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\?|\"|')");
  for (const f of pages) {
    const html = read(f);
    if (!inc.test(html)) continue;
    const pz = zValues(html.replace(/<script[\s\S]*?<\/script>/g, "")); // page CSS + inline styles; JS strings excluded
    const top = pz.length ? Math.max(...pz) : 0;
    if (top >= floor) add("FAIL", "zindex-contract", f, `page z-index ${top} >= ${w} floor ${floor} — an overlay would cover the widget (Aug 30 bug class)`);
  }
}

/* ---------- 14. Nav CSS contract (auditor-nav-css-rule, applied Sep 2 2026) ----------
   Aug 24 (twice): injected nav HTML landed on pages missing the nav CSS and rendered as raw links; the
   nav-drift check compares only the HTML block. Any page with NAV markers must define, in its own <style>:
   .nav-links display:flex at top level, .nav-hamburger display:none at top level, and one @media block
   that flips them (.nav-links none / .nav-hamburger flex). The proposal's ">= 3 media blocks" count is not
   enforced: about/privacy/affiliate-disclosure carry two and render correctly, so the count is not a contract. */
for (const f of pages) {
  const html = read(f);
  if (!html.includes("<!-- NAV:START -->")) continue;
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join("\n");
  const missing = [];
  if (!/\.nav-links\s*\{[^}]*display\s*:\s*flex/.test(css)) missing.push(".nav-links{display:flex}");
  if (!/\.nav-hamburger\s*\{[^}]*display\s*:\s*none/.test(css)) missing.push(".nav-hamburger{display:none}");
  const medias = [...css.matchAll(/@media[^{]*\{([\s\S]*?)\}\s*\}/g)].map(m => m[1]);
  if (!medias.some(b => /\.nav-links\s*\{[^}]*display\s*:\s*none/.test(b) && /\.nav-hamburger\s*\{[^}]*display\s*:\s*flex/.test(b)))
    missing.push("@media mobile flip (.nav-links none / .nav-hamburger flex)");
  if (missing.length) add("FAIL", "nav-css-missing", f, `NAV block present but page CSS lacks ${missing.join(", ")} — nav renders as raw links`);
}

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
