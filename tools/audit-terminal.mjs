#!/usr/bin/env node
// audit-terminal.mjs — the WIRING gate (third of three; see tools/audit-terminal-README.md).
// Read-only, offline, zero-dependency. Checks that the connections hold:
//   nightly feed → engine block on the host page → Vault track button → /api/* contract.
// audit-site.mjs owns the page contract (EPN, nav, sitemap, tags); audit-prices.mjs owns the
// pricing integrity; this file owns everything that runs through data/watchlist.json, the
// price-data feed, js/engine-block.js and the api/ handlers. Same output format as audit-site:
//   [FAIL] code · file — detail      summary: "N pages scanned · FAIL: x · WARN: y"
// exit 1 on any FAIL.
//
// Usage: node tools/audit-terminal.mjs [--json] [--feed <dir>] [--repo <dir>]
//   --feed <dir>  a clone of the price-data branch's data/ folder (prices-latest.json,
//                 prices-history.json, market-latest.json). Default: <repo>/../pd/data.
//                 Missing → the feed sub-checks are skipped with one WARN feed-unavailable.
//   --repo <dir>  audit another tree (used by the proof-of-fire run). Default: this repo.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const argOf = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const JSON_OUT = argv.includes("--json");
const REPO = path.resolve(argOf("--repo") || path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const FEED_DIR = path.resolve(argOf("--feed") || path.join(REPO, "../pd/data"));

// Pages that intentionally sit outside the public site contract (same set as audit-site)
const SKIP_FILES = new Set(["card-dungeon.html", "welcome-email.html"]);
// Hrefs a rail may carry that are not nav.json entries (app pages the rail links by contract)
const RAIL_EXTRA_HREFS = new Set(["/", "/watchlist", "/indices", "/auctions"]);
// Empty-state copy the terminal must not show inside a bordered box (check 9)
const EMPTY_STATE_PHRASES = [
  [/loading\s+(?:the\s+)?nightly\s+series/i, "loading nightly series"],
  [/no\s+auction\s+close\s+recorded/i, "no auction close recorded"],
  [/live\s+listings\s+are\s+unavailable/i, "live listings are unavailable"],
];

const findings = []; // {level: FAIL|WARN, check, file, detail}
const add = (level, check, file, detail) => findings.push({ level, check, file, detail });

const exists = (f) => fs.existsSync(path.join(REPO, f));
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const rootFiles = fs.readdirSync(REPO).filter((f) => f.endsWith(".html"));
const pages = rootFiles.filter((f) => !SKIP_FILES.has(f));
// Markup-only view: no <script>, no <style> (comments kept — the markers live in comments)
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
// Structural view: markup minus comments (for tag/attr counting)
const structural = (html) => markup(html).replace(/<!--[\s\S]*?-->/g, "");
const lineOf = (s, idx) => s.slice(0, idx).split("\n").length;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const count = (s, re) => (s.match(re) || []).length;

/* ---------- inputs: watchlist, feed, css ---------- */
let wl = null;
try { wl = JSON.parse(read("data/watchlist.json")); } catch (e) { add("FAIL", "watchlist-json", "data/watchlist.json", "unparseable: " + e.message); }
const cards = ((wl && wl.cards) || []).filter((c) => c && c.id);
const cardById = new Map(cards.map((c) => [c.id, c]));
// host = the page that carries this card's engine block (mirrors build-engine-blocks.mjs hostOf)
const hostOf = (c) => (c.slug && exists(c.slug + ".html") ? c.slug : null);
const hostCards = cards.filter((c) => c.source === "ebay" && c.query && hostOf(c));

let feed = null; // {latest, history, market}
const feedFile = (n) => path.join(FEED_DIR, n);
if (["prices-latest.json", "prices-history.json", "market-latest.json"].every((n) => fs.existsSync(feedFile(n)))) {
  feed = {};
  for (const [k, n] of [["latest", "prices-latest.json"], ["history", "prices-history.json"], ["market", "market-latest.json"]]) {
    try { feed[k] = JSON.parse(fs.readFileSync(feedFile(n), "utf8")); }
    catch (e) { add("FAIL", "feed-shape", n, "unparseable: " + e.message); feed[k] = null; }
  }
} else {
  add("WARN", "feed-unavailable", path.relative(REPO, FEED_DIR) || ".", "no price-data clone found — pass --feed <dir>; feed-key-valid and feed-shape sub-checks skipped");
}
const feedKeys = new Set(((feed && feed.latest && feed.latest.cards) || []).map((c) => c.key));
const historyKeys = new Set(Object.keys((feed && feed.history) || {}));

/* per-page parse cache */
const P = new Map();
for (const f of pages) {
  const raw = read(f);
  const body = structural(raw);
  const embeds = [...body.matchAll(/<(?:div|section|article)\b[^>]*\bclass="(?:[^"]*\s)?cp-embed(?:\s[^"]*)?"[^>]*>/g)].map((m) => ({
    tag: m[0], idx: m.index, line: lineOf(body, m.index), id: (m[0].match(/\bdata-card="([^"]*)"/) || [])[1] ?? null,
  }));
  const feeds = [...body.matchAll(/\bdata-feed="([^"]*)"/g)].map((m) => ({ val: m[1], line: lineOf(body, m.index) }));
  P.set(f, { raw, body, embeds, feeds });
}

/* ---------- 1. engine-host-consistency ---------- */
for (const c of hostCards) {
  const host = hostOf(c) + ".html";
  const p = P.get(host);
  if (!p) { add("FAIL", "engine-host-consistency", host, `${c.id}: host page is excluded from the scan (${host})`); continue; }
  if (!p.embeds.some((e) => e.id === c.id)) add("FAIL", "engine-host-consistency", host, `watchlist card ${c.id} names this page as host (slug) but the page has no .cp-embed[data-card="${c.id}"] — run node tools/build-engine-blocks.mjs`);
}
for (const f of pages) {
  const { raw, embeds } = P.get(f);
  for (const e of embeds) {
    if (!e.id) { add("FAIL", "engine-host-consistency", `${f}:${e.line}`, ".cp-embed without data-card"); continue; }
    const c = cardById.get(e.id);
    if (!c) { add("FAIL", "engine-host-consistency", `${f}:${e.line}`, `orphan .cp-embed[data-card="${e.id}"] — no such card in data/watchlist.json`); continue; }
    const host = hostOf(c);
    if (host !== f.replace(/\.html$/, "")) add("FAIL", "engine-host-consistency", `${f}:${e.line}`, `.cp-embed[data-card="${e.id}"] sits here but the card's host is ${host ? host + ".html" : "none (no slug)"} — a card renders on exactly one host`);
  }
  const start = count(raw, /<!-- ENGINE:START/g), end = count(raw, /<!-- ENGINE:END -->/g);
  const isHost = embeds.length > 0 || start > 0 || end > 0;
  if (!isHost) {
    // a non-host page must not load the engine assets (they'd have nothing to render)
    if (/\/css\/engine-block\.css/.test(raw) || /\/js\/engine-block\.js/.test(raw)) add("WARN", "engine-host-consistency", f, "page loads engine-block css/js but has no .cp-embed / ENGINE block");
    continue;
  }
  if (start !== 1 || end !== 1) { add("FAIL", "engine-host-consistency", f, `expected exactly one ENGINE:START and one ENGINE:END, found ${start}/${end}`); continue; }
  const sIdx = raw.indexOf("<!-- ENGINE:START"), eIdx = raw.indexOf("<!-- ENGINE:END -->");
  if (eIdx < sIdx) { add("FAIL", "engine-host-consistency", f, "ENGINE:END precedes ENGINE:START"); continue; }
  const block = raw.slice(sIdx, eIdx);
  const dIdx = raw.indexOf("<!-- DEST:END -->");
  if (dIdx < 0) add("FAIL", "engine-host-consistency", f, "host page has no <!-- DEST:END --> anchor (build-engine-blocks.mjs inserts after it)");
  else if (dIdx > sIdx) add("FAIL", "engine-host-consistency", f, "ENGINE block sits BEFORE <!-- DEST:END --> — it must follow the destination block");
  const cssRe = /<link\b[^>]*href="\/css\/engine-block\.css(?:\?[^"]*)?"[^>]*>/g;
  const jsRe = /<script\b[^>]*src="\/js\/engine-block\.js(\?v=\d+)?"[^>]*>/g;
  const cssIn = count(block, cssRe), cssAll = count(raw, cssRe);
  const jsIn = [...block.matchAll(jsRe)], jsAll = count(raw, jsRe);
  if (cssIn !== 1 || cssAll !== 1) add("FAIL", "engine-host-consistency", f, `/css/engine-block.css must be linked exactly once, inside the ENGINE markers (inside: ${cssIn}, page total: ${cssAll})`);
  if (jsIn.length !== 1 || jsAll !== 1) add("FAIL", "engine-host-consistency", f, `/js/engine-block.js must be included exactly once, inside the ENGINE markers (inside: ${jsIn.length}, page total: ${jsAll})`);
  else if (!jsIn[0][1]) add("FAIL", "engine-host-consistency", f, "/js/engine-block.js include has no ?v=N cache-buster");
  // every embed must live inside the block
  const blockBody = structural(block);
  const inBlock = count(blockBody, /\bclass="(?:[^"]*\s)?cp-embed(?:\s[^"]*)?"/g);
  if (inBlock !== embeds.length) add("FAIL", "engine-host-consistency", f, `${embeds.length} .cp-embed on the page but ${inBlock} inside the ENGINE markers — blocks outside the markers are not regenerated by the tool`);
  // the cards named in the ENGINE:START comment must equal the embeds present
  const named = (block.match(/Cards:\s*([^\n]*?)\s*-->/) || [])[1];
  if (named) {
    const list = named.split(/\s*,\s*/).filter(Boolean).sort().join(",");
    const have = embeds.map((e) => e.id).sort().join(",");
    if (list !== have) add("FAIL", "engine-host-consistency", f, `ENGINE:START comment lists [${list}] but the page carries [${have}]`);
  }
  // the card's ★ Track button must be inside its own embed and carry the right feed key
  for (const e of embeds) {
    if (!e.id) continue;
    const seg = sliceEmbed(raw, e.id);
    if (seg == null) continue;
    const btn = seg.match(/<button\b[^>]*\bsch-track-card\b[^>]*>/);
    if (!btn) add("FAIL", "engine-host-consistency", f, `${e.id}: engine block has no button.sch-track-card`);
    else {
      const fk = (btn[0].match(/\bdata-feed="([^"]*)"/) || [])[1];
      const c = cardById.get(e.id);
      const want = `${(c && c.source) || "ebay"}:${e.id}`;
      if (fk !== want) add("FAIL", "engine-host-consistency", f, `${e.id}: engine block Track button data-feed="${fk || ""}" (expected "${want}")`);
    }
  }
  if (!/\/js\/vault-track\.js\?v=\d+/.test(raw)) add("FAIL", "engine-host-consistency", f, "host page has ★ Track buttons but no cache-busted /js/vault-track.js include");
}
// raw slice of one embed: from its opening tag to the next embed opening tag or ENGINE:END
function sliceEmbed(raw, id) {
  const m = raw.match(new RegExp(`<(?:div|section|article)\\b[^>]*\\bdata-card="${esc(id)}"[^>]*>`));
  if (!m) return null;
  const rest = raw.slice(m.index + m[0].length);
  const stop = rest.search(/<(?:div|section|article)\b[^>]*\bclass="(?:[^"]*\s)?cp-embed(?:\s[^"]*)?"|<!-- ENGINE:END -->/);
  return stop < 0 ? rest : rest.slice(0, stop);
}

/* ---------- 2. feed-key-valid ---------- */
for (const f of pages) {
  for (const { val, line } of P.get(f).feeds) {
    const m = val.match(/^([a-z0-9_-]+):([a-z0-9-]+)$/i);
    if (!m) { add("FAIL", "feed-key-valid", `${f}:${line}`, `data-feed="${val}" is not <source>:<id>`); continue; }
    const [, source, id] = m;
    const c = cardById.get(id);
    if (!c) { add("FAIL", "feed-key-valid", `${f}:${line}`, `data-feed="${val}" — no card ${id} in data/watchlist.json`); continue; }
    if (c.source !== source) { add("FAIL", "feed-key-valid", `${f}:${line}`, `data-feed="${val}" — watchlist card ${id} has source "${c.source}"`); continue; }
    if (!feed) continue;
    if (!feedKeys.has(val)) add("FAIL", "feed-key-valid", `${f}:${line}`, `data-feed="${val}" is not in prices-latest.json (cards[].key) — the Vault would link a card the engine never prices`);
    else if (!historyKeys.has(val)) add("WARN", "feed-key-valid", `${f}:${line}`, `data-feed="${val}" has no prices-history.json entry yet — chart renders empty`);
  }
}

/* ---------- 3. engine-ids-unique ---------- */
for (const f of pages) {
  const { body, embeds } = P.get(f);
  const ids = new Map();
  for (const m of body.matchAll(/\bid="((?:chart|sold|live)-[^"]+)"/g)) ids.set(m[1], (ids.get(m[1]) || 0) + 1);
  for (const [id, n] of ids) if (n > 1) add("FAIL", "engine-ids-unique", f, `#${id} appears ${n} times`);
  const dc = new Map();
  for (const e of embeds) if (e.id) dc.set(e.id, (dc.get(e.id) || 0) + 1);
  for (const [id, n] of dc) if (n > 1) add("FAIL", "engine-ids-unique", f, `duplicate .cp-embed[data-card="${id}"] (${n})`);
  // in-page anchors to engine sections must resolve
  const allIds = new Set([...body.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of body.matchAll(/\bhref="#((?:chart|sold|live|engine)-[^"]+)"/g))
    if (!allIds.has(m[1])) add("FAIL", "engine-ids-unique", `${f}:${lineOf(body, m.index)}`, `href="#${m[1]}" has no matching id on the page`);
}

/* ---------- 4. fold-markers ---------- */
for (const f of pages) {
  const { raw, body } = P.get(f);
  const starts = [...raw.matchAll(/<!-- FOLD:START(?:[^-]|-(?!->))*-->/g)];
  const ends = [...raw.matchAll(/<!-- FOLD:END -->/g)];
  if (!starts.length && !ends.length && !/<details\b[^>]*\bclass="[^"]*\bguide-fold\b/.test(body)) continue;
  if (starts.length !== ends.length) add("FAIL", "fold-markers", f, `FOLD:START ×${starts.length} vs FOLD:END ×${ends.length}`);
  else for (let i = 0; i < starts.length; i++) {
    if (ends[i].index < starts[i].index) add("FAIL", "fold-markers", f, `FOLD:END at line ${lineOf(raw, ends[i].index)} precedes its FOLD:START`);
    if (i + 1 < starts.length && starts[i + 1].index < ends[i].index) add("FAIL", "fold-markers", f, `FOLD:START at line ${lineOf(raw, starts[i + 1].index)} opens before the previous fold closed`);
  }
  // <details class="guide-fold"> structure
  for (const m of body.matchAll(/<details\b[^>]*>/g)) {
    if (!/\bclass="[^"]*\bguide-fold\b/.test(m[0])) continue;
    const line = lineOf(body, m.index);
    const inner = detailsInner(body, m.index + m[0].length);
    if (inner == null) { add("FAIL", "fold-markers", `${f}:${line}`, "guide-fold <details> never closes"); continue; }
    if (/<details\b/.test(inner)) add("FAIL", "fold-markers", `${f}:${line}`, "a <details> is nested inside a guide-fold");
    const firstTag = inner.match(/<([a-zA-Z][\w-]*)\b/);
    if (!firstTag || firstTag[1].toLowerCase() !== "summary") add("FAIL", "fold-markers", `${f}:${line}`, `guide-fold's first child must be <summary> (found <${firstTag ? firstTag[1] : "nothing"}>)`);
    const summaries = count(inner, /<summary\b/g);
    if (summaries !== 1) add("FAIL", "fold-markers", `${f}:${line}`, `guide-fold has ${summaries} <summary> (need exactly 1)`);
    if (count(inner, /<h2\b/g) < 1) add("FAIL", "fold-markers", `${f}:${line}`, "guide-fold contains no <h2> — the folded section lost its heading");
  }
  const h1 = count(body, /<h1\b/g);
  if (h1 !== 1) add("FAIL", "fold-markers", f, `page has ${h1} <h1> (need exactly 1)`);
}
function detailsInner(s, from) {
  let depth = 1;
  const re = /<(\/?)details\b[^>]*>/g; re.lastIndex = from;
  let m;
  while ((m = re.exec(s))) { depth += m[1] ? -1 : 1; if (depth === 0) return s.slice(from, m.index); }
  return null;
}

/* ---------- 5. terminal-css-order ---------- */
// NAV css contract — copied verbatim from audit-site.mjs §14 (kept in sync by hand; do not import)
const navCssMissing = (html) => {
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  const missing = [];
  if (!/\.nav-links\s*\{[^}]*display\s*:\s*flex/.test(css)) missing.push(".nav-links{display:flex}");
  if (!/\.nav-hamburger\s*\{[^}]*display\s*:\s*none/.test(css)) missing.push(".nav-hamburger{display:none}");
  const medias = [...css.matchAll(/@media[^{]*\{([\s\S]*?)\}\s*\}/g)].map((m) => m[1]);
  if (!medias.some((b) => /\.nav-links\s*\{[^}]*display\s*:\s*none/.test(b) && /\.nav-hamburger\s*\{[^}]*display\s*:\s*flex/.test(b)))
    missing.push("@media mobile flip (.nav-links none / .nav-hamburger flex)");
  return missing;
};
for (const f of pages) {
  const { raw } = P.get(f);
  const links = [...raw.matchAll(/<link\b[^>]*href="\/css\/terminal-page\.css(?:\?[^"]*)?"[^>]*>/g)];
  if (!links.length) continue;
  if (!exists("css/terminal-page.css")) add("FAIL", "terminal-css-order", f, "links /css/terminal-page.css but the file is not on disk");
  if (links.length > 1) add("FAIL", "terminal-css-order", f, `/css/terminal-page.css linked ${links.length} times`);
  const headEnd = raw.indexOf("</head>");
  const link = links[0];
  if (headEnd < 0 || link.index > headEnd) add("FAIL", "terminal-css-order", f, "/css/terminal-page.css link is not inside <head>");
  else {
    const head = raw.slice(0, headEnd);
    const styles = [...head.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)];
    if (!styles.length) add("WARN", "terminal-css-order", f, "no inline <style> in <head> to order against");
    else {
      const lastStyle = styles[styles.length - 1];
      if (link.index < lastStyle.index + lastStyle[0].length)
        add("FAIL", "terminal-css-order", f, `/css/terminal-page.css link (line ${lineOf(raw, link.index)}) must come AFTER the page's inline <style> (ends line ${lineOf(raw, lastStyle.index + lastStyle[0].length)}) so its overrides win`);
    }
  }
  if (raw.includes("<!-- NAV:START -->")) {
    const missing = navCssMissing(raw);
    if (missing.length) add("FAIL", "terminal-css-order", f, `terminal page lost the NAV css contract: ${missing.join(", ")} — nav renders as raw links`);
  }
}

/* ---------- 6. redirect-consistency ---------- */
let vercel = null;
try { vercel = JSON.parse(read("vercel.json")); } catch (e) { add("FAIL", "redirect-consistency", "vercel.json", "unparseable: " + e.message); }
const redirectFor = new Map(); // card id -> destination
for (const r of (vercel && vercel.redirects) || []) {
  const m = String(r.source || "").match(/^\/card-([a-z0-9-]+)$/);
  if (!m) continue;
  const id = m[1], dest = String(r.destination || "");
  redirectFor.set(id, dest);
  const slug = dest.replace(/^\//, "").split(/[?#]/)[0];
  if (!/^\/[a-z0-9-]+$/.test(dest) || !exists(slug + ".html")) { add("FAIL", "redirect-consistency", "vercel.json", `/card-${id} → ${dest}: no such page`); continue; }
  const c = cardById.get(id);
  if (!c) add("FAIL", "redirect-consistency", "vercel.json", `/card-${id} → ${dest}: no card ${id} in data/watchlist.json`);
  const p = P.get(slug + ".html");
  if (!p || !p.embeds.some((e) => e.id === id)) add("FAIL", "redirect-consistency", "vercel.json", `/card-${id} → ${dest}: destination page does not host .cp-embed[data-card="${id}"]`);
  else if (c && hostOf(c) !== slug) add("FAIL", "redirect-consistency", "vercel.json", `/card-${id} → ${dest} but the card's watchlist slug is ${c.slug || "(none)"}`);
  if (exists(`card-${id}.html`)) add("WARN", "redirect-consistency", `card-${id}.html`, `file still on disk but /card-${id} 301s to ${dest} — the page is unreachable; delete it`);
}
for (const c of hostCards)
  if (!redirectFor.has(c.id)) add("WARN", "redirect-consistency", "vercel.json", `${c.id} is hosted on /${hostOf(c)} but /card-${c.id} has no 301 — old links/SERP entries would 404`);

/* ---------- 7. api-contract ---------- */
// params an api/<name>.js handler reads: req.query.X / req.query["X"] / searchParams.get("X")
const apiParams = (src) => new Set([
  ...[...src.matchAll(/req\.query\.([A-Za-z_][\w]*)/g)].map((m) => m[1]),
  ...[...src.matchAll(/req\.query\[\s*["']([^"']+)["']\s*\]/g)].map((m) => m[1]),
  ...[...src.matchAll(/searchParams\.get\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
]);
// top-level keys an api handler puts in its 200 response: res.status(200).json({...}) literals, plus
// `const payload = {...}` / `payload.X =` when the handler sends `json(payload)`; `error` is always possible
const apiKeys = (src) => {
  const keys = new Set(["error"]);
  const lit = (s) => { for (const m of s.matchAll(/(?:^|[{,\n])\s*([A-Za-z_]\w*)\s*(?=[:,}\n])/g)) keys.add(m[1]); };
  const balanced = (from) => { let d = 0; for (let i = from; i < src.length; i++) { if (src[i] === "(") d++; else if (src[i] === ")") { if (--d === 0) return src.slice(from + 1, i); } } return ""; };
  for (const m of src.matchAll(/status\(20\d\)\s*\.json\s*(?=\()/g)) {
    const arg = balanced(m.index + m[0].length).trim();
    if (arg.startsWith("{")) lit(arg.slice(1, -1));
    else if (/^payload\b/.test(arg)) {
      for (const pm of src.matchAll(/const\s+payload\s*=\s*\{([\s\S]*?)\n\s*\};/g)) lit(pm[1]);
      for (const pm of src.matchAll(/payload\.([A-Za-z_]\w*)\s*=/g)) keys.add(pm[1]);
    } else return new Set(); // dynamic shape — unknown, skip the key check
  }
  return keys;
};
// every '/api/<name>?…' call site in pages + js: {file, line, api, params[], readKeys[]}
const REQUIRED = { comps: [["card", "q"]] }; // one of each group must be present
const callSites = [];
const sources = [...pages.map((f) => [f, P.get(f).raw]), ...fs.readdirSync(path.join(REPO, "js")).filter((f) => f.endsWith(".js")).map((f) => ["js/" + f, read("js/" + f)])];
for (const [file, src] of sources) {
  for (const m of src.matchAll(/['"`]\/api\/([a-z-]+)(\??)/g)) {
    // the statement: from the string start to the end of the line (all call sites are single-expression)
    const lineStart = src.lastIndexOf("\n", m.index) + 1;
    const lineEnd = src.indexOf("\n", m.index);
    const stmt = src.slice(lineStart, lineEnd < 0 ? src.length : lineEnd);
    if (/^\s*(\/\/|\*|<!--)/.test(stmt) || /^\s*[\/\*]/.test(stmt)) continue; // comment line
    const params = new Set();
    // literal fragments: ?a=…&b=  plus  '&c=' + …  plus  u += '&d='
    for (const pm of stmt.matchAll(/[?&]([A-Za-z_]\w*)=/g)) params.add(pm[1]);
    // the callback that consumes the PARSED response: walk the .then() chain and skip any callback whose
    // param is used as a fetch Response (v.ok / v.status / v.json()) — that one is not the payload
    const readKeys = new Set();
    // window = this call's own .then chain: stop at the next fetch/getJSON (a fallback request's callbacks are not ours)
    let win = src.slice(m.index, m.index + 6000);
    const nextCall = win.slice(lineEnd < 0 ? win.length : lineEnd - m.index).search(/\b(?:fetch|getJSON|XMLHttpRequest)\s*\(/);
    if (nextCall >= 0) win = win.slice(0, (lineEnd - m.index) + nextCall);
    for (const cm of win.matchAll(/\.then\(\s*(?:function\s*\(\s*(\w+)\s*\)|\(?\s*(\w+)\s*\)?\s*=>)/g)) {
      const v = cm[1] || cm[2];
      const body = win.slice(cm.index + cm[0].length).split(/\}\)\s*\.(?:catch|then|finally)|\}\);/)[0];
      const isResponse = new RegExp(`(?<![\\w.])${v}\\.(?:ok|status|json\\s*\\()`).test(body);
      if (isResponse) continue;
      for (const km of body.matchAll(new RegExp(`(?<![\\w.])${v}\\.([A-Za-z_]\\w*)`, "g"))) readKeys.add(km[1]);
      break;
    }
    callSites.push({ file, line: lineOf(src, m.index), api: m[1], params: [...params], readKeys: [...readKeys], stmt });
    if (process.env.AUDIT_TERMINAL_DEBUG) console.error(`  call ${file}:${lineOf(src, m.index)} /api/${m[1]} params=[${[...params]}] reads=[${[...readKeys]}]`);
  }
}
// follow-on params added to the same URL variable on later lines (watchlist.html: u += '&category_ids=' + cat)
for (const cs of callSites) {
  const src = sources.find(([f]) => f === cs.file)[1];
  const vm = cs.stmt.match(/(?:let|var|const)\s+(\w+)\s*=\s*['"`]\/api\//);
  if (!vm) continue;
  const after = src.split("\n").slice(cs.line, cs.line + 6).join("\n");
  for (const pm of after.matchAll(new RegExp(`\\b${vm[1]}\\s*\\+=\\s*['"\`][?&]([A-Za-z_]\\w*)=`, "g"))) cs.params.push(pm[1]);
}
const apiCache = new Map();
for (const cs of callSites) {
  const apiFile = `api/${cs.api}.js`;
  if (!exists(apiFile)) { add("FAIL", "api-contract", `${cs.file}:${cs.line}`, `calls /api/${cs.api} but ${apiFile} does not exist`); continue; }
  if (!apiCache.has(apiFile)) { const s = read(apiFile); apiCache.set(apiFile, { params: apiParams(s), keys: apiKeys(s) }); }
  const api = apiCache.get(apiFile);
  for (const p of cs.params) if (!api.params.has(p)) add("FAIL", "api-contract", `${cs.file}:${cs.line}`, `sends ?${p}= to /api/${cs.api} but ${apiFile} never reads it (reads: ${[...api.params].join(",")})`);
  for (const group of REQUIRED[cs.api] || []) if (!group.some((p) => cs.params.includes(p))) add("FAIL", "api-contract", `${cs.file}:${cs.line}`, `/api/${cs.api} call omits a required param (one of: ${group.join("|")})`);
  if (cs.api === "comps" && !cs.params.includes("customid")) add("FAIL", "api-contract", `${cs.file}:${cs.line}`, "/api/comps call has no customid= — the EPN attribution would land in the No Custom ID bucket");
  for (const k of cs.readKeys) if (api.keys.size && !api.keys.has(k)) add("FAIL", "api-contract", `${cs.file}:${cs.line}`, `reads .${k} from the /api/${cs.api} response but ${apiFile} never sets it (sets: ${[...api.keys].join(",")})`);
}
// the engine's own card-mode contract: /api/comps must resolve ?card= against the same watchlist the pages use
if (exists("api/comps.js") && !/data\/watchlist\.json/.test(read("api/comps.js"))) add("FAIL", "api-contract", "api/comps.js", "card mode no longer resolves ?card= from data/watchlist.json");
if (exists("js/engine-block.js") && !callSites.some((c) => c.file === "js/engine-block.js" && c.api === "comps" && c.params.includes("card")))
  add("FAIL", "api-contract", "js/engine-block.js", "engine block no longer calls /api/comps?card=<id> — live listings would not be the engine's exact-card filter");

/* ---------- 8. rail-single-source ---------- */
// Step 2 (Sep 11 2026): the rail is generated by tools/build-rail.mjs from data/rail.json (+ the nav.json Guides
// categories it names). Hash fragments are allowed (/#screen=x is fine when / is); every rail href must ALSO be
// listed by data/rail.json — a literal href in it, /#screen=<id> for a screens row, or a link of a Guides category.
{
  const rails = new Map(); // block -> files
  const navHrefs = new Set(RAIL_EXTRA_HREFS);
  let nav = null;
  try { nav = JSON.parse(read("data/nav.json")); for (const m of JSON.stringify(nav).matchAll(/"href"\s*:\s*"([^"]+)"/g)) navHrefs.add(m[1].split("#")[0]); } catch {}
  const pathOf = (h) => h.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
  let railJson = null, railListed = null; // set of full hrefs rail.json accounts for
  if (exists("data/rail.json")) {
    try {
      railJson = JSON.parse(read("data/rail.json"));
      railListed = new Set();
      const walk = (v) => { if (typeof v === "string") { if (/^\/[^\s"]*$/.test(v)) railListed.add(v); } else if (v && typeof v === "object") for (const x of Object.values(v)) walk(x); };
      walk(railJson);
      for (const r of (railJson.screens && railJson.screens.rows) || []) if (r && r.id) railListed.add(`/#screen=${r.id}`);
      const guideCats = new Set(((railJson.guides && railJson.guides.guideCategories) || []).map(String));
      for (const c of (nav && nav.categories) || []) {
        if (!guideCats.has(String(c.label).replace(/&amp;/g, "&"))) continue;
        if (c.href) railListed.add(c.href);
        for (const g of c.groups || []) for (const l of g.links || []) if (l.href) railListed.add(l.href);
      }
    } catch (e) { add("FAIL", "rail-single-source", "data/rail.json", "unparseable: " + e.message); }
  }
  for (const f of pages) {
    const { raw } = P.get(f);
    const s = count(raw, /<!-- RAIL:START -->/g), e = count(raw, /<!-- RAIL:END -->/g);
    if (!s && !e) continue;
    if (s !== 1 || e !== 1) { add("FAIL", "rail-single-source", f, `RAIL:START ×${s} vs RAIL:END ×${e}`); continue; }
    const m = raw.match(/<!-- RAIL:START -->([\s\S]*?)<!-- RAIL:END -->/);
    if (!m) { add("FAIL", "rail-single-source", f, "RAIL:END precedes RAIL:START"); continue; }
    rails.set(m[1], (rails.get(m[1]) || []).concat(f));
    if (!railJson && !exists("data/rail.json")) add("FAIL", "rail-single-source", f, "page carries RAIL markers but data/rail.json does not exist — the rail must be generated by tools/build-rail.mjs, never hand-built");
    const seen = new Set();
    for (const hm of m[1].matchAll(/\bhref="([^"]*)"/g)) {
      const full = hm[1], h = pathOf(full);
      if (!full.startsWith("/")) { add("FAIL", "rail-single-source", f, `rail href ${full} is not a site path`); continue; }
      if (!navHrefs.has(h)) add("FAIL", "rail-single-source", f, `rail href ${h} is not in data/nav.json (nor /, /watchlist, /indices, /auctions)`);
      if (railListed && !railListed.has(full) && !seen.has(full)) { seen.add(full); add("FAIL", "rail-single-source", f, `rail href ${full} is not listed by data/rail.json (nav/guides/portfolios/screens) — edit rail.json and re-run tools/build-rail.mjs`); }
    }
    if (railListed) for (const r of (railJson.screens && railJson.screens.rows) || []) if (r && r.id && !m[1].includes(`href="/#screen=${r.id}"`)) add("FAIL", "rail-single-source", f, `data/rail.json screen "${r.id}" has no /#screen=${r.id} link in the rail — re-run tools/build-rail.mjs`);
  }
  if (rails.size > 1) {
    const sorted = [...rails.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [, files] of sorted.slice(1)) add("FAIL", "rail-single-source", files.join(","), `RAIL block is not byte-identical to the majority variant (${sorted[0][1].length} pages)`);
  }
}

/* ---------- 8b. home-prerender (Step 2: / is the dashboard, pre-rendered by tools/build-home.mjs) ---------- */
// Every <!-- HOME:<panel>:START --> … <!-- HOME:<panel>:END --> pair on index.html must be balanced, non-empty
// (real markup, not whitespace) and carry at least one numeric value in its text — a panel that is empty at rest
// is the terminal showing nothing until JS runs, which is the failure the pre-render exists to prevent.
const HOME_PANELS = new Map(); // panel -> inner html (for 8c)
if (P.has("index.html")) {
  const raw = P.get("index.html").raw;
  const starts = [...raw.matchAll(/<!-- HOME:([a-z0-9-]+):START -->/g)].map((m) => ({ panel: m[1], idx: m.index, len: m[0].length }));
  const ends = [...raw.matchAll(/<!-- HOME:([a-z0-9-]+):END -->/g)].map((m) => ({ panel: m[1], idx: m.index }));
  const endsBy = new Map();
  for (const e of ends) endsBy.set(e.panel, (endsBy.get(e.panel) || []).concat(e));
  const seenPanel = new Set();
  for (const s of starts) {
    if (seenPanel.has(s.panel)) { add("FAIL", "home-prerender", "index.html", `HOME:${s.panel}:START appears more than once`); continue; }
    seenPanel.add(s.panel);
    const es = endsBy.get(s.panel) || [];
    if (es.length !== 1) { add("FAIL", "home-prerender", `index.html:${lineOf(raw, s.idx)}`, `HOME:${s.panel}: ${es.length} END marker(s) for one START`); continue; }
    if (es[0].idx < s.idx) { add("FAIL", "home-prerender", `index.html:${lineOf(raw, s.idx)}`, `HOME:${s.panel}:END precedes its START`); continue; }
    const inner = raw.slice(s.idx + s.len, es[0].idx);
    HOME_PANELS.set(s.panel, inner);
    const text = structural(inner).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").trim();
    if (!inner.trim() || !text) { add("FAIL", "home-prerender", `index.html:${lineOf(raw, s.idx)}`, `HOME:${s.panel} panel is empty at rest — run node tools/build-home.mjs`); continue; }
    if (!/\d/.test(text)) add("FAIL", "home-prerender", `index.html:${lineOf(raw, s.idx)}`, `HOME:${s.panel} panel has no numeric value in its pre-rendered text`);
    if (/\b(?:loading|—\s*$)/i.test(text) && text.length < 40) add("WARN", "home-prerender", `index.html:${lineOf(raw, s.idx)}`, `HOME:${s.panel} looks like a placeholder: "${text.slice(0, 60)}"`);
  }
  for (const [panel, es] of endsBy) if (!seenPanel.has(panel)) add("FAIL", "home-prerender", `index.html:${lineOf(raw, es[0].idx)}`, `HOME:${panel}:END without a START`);
}

/* ---------- 8c. board-bowman-only (Mo, Aug 17 2026: the board is Bowman only — no Pokémon in board/markets/movers) ---------- */
{
  const tcg = cards.filter((c) => c.cardType === "tcg-single");
  // recognisable name tokens per Pokémon card: the id, the label's name segment, and its distinctive words
  const names = [];
  for (const c of tcg) {
    const seg = String(c.label || "").split(/\s[—–]\s/)[0];
    const words = seg.split(/\s+/).filter((w) => w.length > 3 && !/^(ex|sir|mega|t\.r\.'s|team|rocket's|1st|#\S*)$/i.test(w));
    names.push({ id: c.id, patterns: [c.id, seg, ...words].filter(Boolean) });
  }
  const panels = [...HOME_PANELS.entries()].filter(([p]) => /^(markets|board|movers)$/.test(p));
  for (const [panel, inner] of panels) {
    const text = structural(inner).replace(/<[^>]+>/g, " ");
    const hrefs = [...inner.matchAll(/\bhref="([^"]*)"/g)].map((m) => m[1]).join(" ");
    for (const n of names) {
      const hit = n.patterns.find((pat) => new RegExp(`(?<![\\w-])${esc(pat)}(?![\\w-])`, "i").test(text + " " + hrefs));
      if (hit) add("FAIL", "board-bowman-only", "index.html", `HOME:${panel} carries Pokémon card ${n.id} ("${hit}") — the board/markets/movers surfaces are Bowman only (Mo, Aug 17 2026)`);
    }
  }
  // the board itself (bowman-bangers.html) must not carry a tcg-single feed either
  if (P.has("bowman-bangers.html")) for (const { val, line } of P.get("bowman-bangers.html").feeds) {
    const c = cardById.get(val.split(":")[1]);
    if (c && c.cardType === "tcg-single") add("FAIL", "board-bowman-only", `bowman-bangers.html:${line}`, `board page tracks Pokémon card ${c.id}`);
  }
}

/* ---------- 8d. shared-stats-module (one place does the return math) ---------- */
if (exists("js/engine-stats.js")) {
  const refs = (f) => exists(f) && /engine-stats(?:\.js)?|SCH_STATS/.test(read(f));
  for (const f of ["js/engine-block.js", "index.html"])
    if (!refs(f)) add("WARN", "shared-stats-module", f, "js/engine-stats.js exists but this file does not reference it — σ/skew/kurtosis math is forking");
  // any page whose scripts use window.SCH_STATS must load /js/engine-stats.js before them
  const usesStats = (src) => /SCH_STATS/.test(src);
  for (const f of pages) {
    const { raw } = P.get(f);
    const scripts = [...raw.matchAll(/<script\b[^>]*\bsrc="(\/js\/[^"?]+)(?:\?[^"]*)?"[^>]*>/g)].map((m) => ({ src: m[1], idx: m.index }));
    const statsIdx = scripts.find((s) => s.src === "/js/engine-stats.js");
    const inlineUses = usesStats(raw.replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g, ""));
    const extUses = scripts.filter((s) => s.src !== "/js/engine-stats.js" && exists(s.src.slice(1)) && usesStats(read(s.src.slice(1))));
    if ((inlineUses || extUses.length) && !statsIdx) add("FAIL", "shared-stats-module", f, `uses SCH_STATS (${extUses.map((s) => s.src).join(",") || "inline"}) but never loads /js/engine-stats.js`);
    else if (statsIdx) for (const s of extUses) if (s.idx < statsIdx.idx && !/\bdefer\b/.test(raw.slice(s.idx, raw.indexOf(">", s.idx)))) add("FAIL", "shared-stats-module", f, `${s.src} loads before /js/engine-stats.js (and is not deferred) — SCH_STATS is undefined when it runs`);
  }
}

/* ---------- 9. empty-state-box (WARN) ---------- */
{
  // the CSS's bordered empty-state containers, detected from css/engine-block.css itself
  let boxClasses = [];
  try {
    const css = read("css/engine-block.css");
    for (const m of css.matchAll(/\.(cp-[\w-]+)\s*\{([^}]*)\}/g))
      if (/\bborder(?:-top|-bottom|-left|-right)?\s*:\s*[^;]*(?:solid|dashed|dotted)/.test(m[2]) && /empty|box|state/.test(m[1])) boxClasses.push(m[1]);
  } catch { add("WARN", "empty-state-box", "css/engine-block.css", "not on disk — box classes unknown"); }
  boxClasses = [...new Set(boxClasses)];
  if (boxClasses.length) {
    const clsRe = new RegExp(`class="[^"]*\\b(?:${boxClasses.map(esc).join("|")})\\b[^"]*"[^>]*>([^<]{0,200})`, "g");
    const srcs = [...pages.map((f) => [f, P.get(f).raw]), ["js/engine-block.js", exists("js/engine-block.js") ? read("js/engine-block.js") : ""]];
    for (const [file, src] of srcs) {
      for (const m of src.matchAll(clsRe)) {
        for (const [re, label] of EMPTY_STATE_PHRASES)
          if (re.test(m[1])) add("WARN", "empty-state-box", `${file}:${lineOf(src, m.index)}`, `"${label}" copy sits inside a bordered ${boxClasses.map((c) => "." + c).join("/")} box — the terminal shows a quiet line, not a box`);
      }
    }
  }
}

/* ---------- 10. feed-shape ---------- */
if (feed) {
  const { latest, history, market } = feed;
  const isDay = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const numOrNull = (v) => v === null || (typeof v === "number" && isFinite(v));
  if (latest) {
    if (!isDay(latest.day)) add("FAIL", "feed-shape", "prices-latest.json", `day="${latest.day}" is not YYYY-MM-DD`);
    else {
      const age = Math.round((Date.now() - Date.parse(latest.day + "T00:00:00Z")) / 86400000);
      if (age > 2) add("WARN", "feed-shape", "prices-latest.json", `day ${latest.day} is ${age} days old — the nightly run may be broken`);
    }
    if (!Array.isArray(latest.cards)) add("FAIL", "feed-shape", "prices-latest.json", "cards[] missing");
    else for (const c of latest.cards) {
      const k = c && c.key;
      const bad = [];
      if (typeof k !== "string" || !/^[a-z0-9_-]+:[a-z0-9-]+$/i.test(k)) bad.push("key");
      if (typeof c.label !== "string" || !c.label) bad.push("label");
      if (!numOrNull(c.last)) bad.push("last");
      if (typeof c.signal !== "string") bad.push("signal");
      if (!(c.gated === null || c.gated === undefined || Array.isArray(c.gated) || typeof c.gated === "boolean")) bad.push("gated");
      if (!numOrNull(c.supply)) bad.push("supply");
      if (typeof c.points !== "number") bad.push("points");
      if (bad.length) add("FAIL", "feed-shape", "prices-latest.json", `${k || "?"}: bad/missing ${bad.join(",")}`);
      const id = String(k || "").split(":")[1];
      if (id && !cardById.has(id)) add("WARN", "feed-shape", "prices-latest.json", `${k} is priced by the engine but is not in data/watchlist.json`);
    }
  }
  if (history) {
    if (typeof history !== "object" || Array.isArray(history)) add("FAIL", "feed-shape", "prices-history.json", "must be an object keyed by card key");
    else for (const [k, v] of Object.entries(history)) {
      if (!v || !Array.isArray(v.series)) { add("FAIL", "feed-shape", "prices-history.json", `${k}: series[] missing`); continue; }
      const badPt = v.series.findIndex((p) => !p || !isDay(p.d) || !numOrNull(p.p));
      if (badPt >= 0) add("FAIL", "feed-shape", "prices-history.json", `${k}: series[${badPt}] is not {d:YYYY-MM-DD, p:number|null}`);
    }
  }
  if (market) {
    if (!market.cards || typeof market.cards !== "object") add("FAIL", "feed-shape", "market-latest.json", "cards{} missing");
    else for (const [k, v] of Object.entries(market.cards)) {
      if (!v || !Array.isArray(v.hammers) || typeof v.closes !== "number") add("FAIL", "feed-shape", "market-latest.json", `${k}: needs hammers[] and closes:number`);
    }
  }
  // the feed must price every card whose block is on a host page (else the block shows "—" forever)
  for (const c of hostCards) if (!feedKeys.has(`${c.source}:${c.id}`)) add("FAIL", "feed-shape", "prices-latest.json", `${c.source}:${c.id} is hosted on /${hostOf(c)} but the feed has no entry for it`);
}

/* ---------- report ---------- */
const fails = findings.filter((x) => x.level === "FAIL");
const warns = findings.filter((x) => x.level === "WARN");
if (JSON_OUT) {
  console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), pages: pages.length, feed: feed ? path.relative(REPO, FEED_DIR) : null, fails, warns }, null, 1));
} else {
  console.log(`Terminal wiring gate — ${new Date().toISOString().slice(0, 10)} (feed: ${feed ? FEED_DIR : "unavailable"})`);
  console.log(`${pages.length} pages scanned · FAIL: ${fails.length} · WARN: ${warns.length}`);
  for (const x of fails) console.log(`  [FAIL] ${x.check} · ${x.file} — ${x.detail}`);
  for (const x of warns) console.log(`  [WARN] ${x.check} · ${x.file} — ${x.detail}`);
}
process.exit(fails.length ? 1 : 0);
