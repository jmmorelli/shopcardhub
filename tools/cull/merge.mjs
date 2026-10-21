#!/usr/bin/env node
/* tools/cull/merge.mjs — the R35 merge step, generalised from tools/mlb-cards/merge-links.mjs (b92d73f, Oct 13 2026).
 * Folds a batch of pages into their hubs with a 301 each. Idempotent. Run from the repo root, then the regenerators
 * in this order: build-card-pages (if a card lost its host) · build-buy-strip · build-nav.js · build-rail ·
 * build-auctions · build-home --feed data/feed · sitemap-lastmod · gates.
 *
 *   node tools/cull/merge.mjs tools/cull/batch-1-2026-10-14.json [--dry]
 *
 * For every {slug, hub} in the batch:
 *   1. vercel.json: 301 /<slug> → hub; an older redirect that landed on /<slug> is re-pointed to the hub, except a
 *      /card-<id> redirect whose card is hosted on /<slug> — that redirect is dropped (the card page comes back, step 6).
 *   2. the page file is deleted.
 *   3. sitemap.xml loses its <url>.
 *   4. data/nav.json: nav links and searchExtra rows for /<slug> go; a "/<slug>#engine-<id>" row becomes /card-<id>.
 *   5. data/buy-strip.json: the page's entry goes (its customids die with the page).
 *   6. data/watchlist.json: a card hosted on /<slug> loses its `slug` (build-card-pages then writes /card-<id>).
 *   7. tools/league/manifests/<slug>.json: status "merged-<date>", mergedInto hub; data/league.json page status the
 *      same (LANE-RULES R27 Am. 2); a surviving manifest whose hub was a merged page is re-pointed to that page's hub.
 *   8. every remaining *.html: href="/<slug>[#…]" and https://www.shopcardhub.com/<slug> → hub; the #engine-<id>
 *      anchors → /card-<id>. A LEAGUE-LINKS block on a hub that no longer has a live league page is removed.
 *   9. data/collect/*.json editorial hrefs to /<slug> → hub (Collector's Desk copy is baked from them).
 *   8r. (Oct 21, Integrity Watch Oct 19 F2) a related card (a.related-card, or div.related-card + a.related-link)
 *      whose href is re-pointed in step 8 takes the HUB's card text: title + desc from batch.hubCards["/hub"]
 *      (hub-supplied; `anchorDesc` with {name} for /hub#anchor), else the hub page's own <title> (before " — ")
 *      and meta description; for /hub#anchor the title is that section's <h2>. The eyebrow/tag goes (R31). A card
 *      that would repeat an href already carried by another related card on the page, or point at its own page,
 *      is dropped. Before this, culled pages lived on as related-card titles ("Chrome Black", Ohtani "$58M … ROI").
 *
 *   node tools/cull/merge.mjs --related tools/cull/related-retro-2026-10-21.json [--dry]
 *      applies 8r alone to cards already re-pointed by earlier merges: {hubCards, cards:[{file, href, title}]};
 *      a card matches on file + current href + current title text, so a re-run is a no-op.
 * Never touches prices, marks, data/calls.json or data/feed (R18/R20).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const RELATED_ONLY = args.includes("--related");
const batchFile = args.find((a) => !a.startsWith("--"));
if (!batchFile) { console.error("usage: node tools/cull/merge.mjs <batch.json> [--dry]  |  --related <retro.json> [--dry]"); process.exit(2); }
const batch = JSON.parse(fs.readFileSync(path.resolve(batchFile), "utf8"));
const DATE = batch.date;
const PAGES = batch.pages || []; // [{slug, hub}] (empty in --related mode)
const HUB = Object.fromEntries(PAGES.map((p) => [p.slug, p.hub]));
const SLUGS = Object.keys(HUB);

const rd = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const exists = (f) => fs.existsSync(path.join(REPO, f));
const log = [];
const writes = new Map();
const wr = (f, s) => { writes.set(f, s); };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const json = (o, indent = 2) => JSON.stringify(o, null, indent) + "\n";

/* ---- 8r helpers: related cards follow the hub they point to ---- */
const plain = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const escHtml = (s) => String(s).replace(/&(?![a-z#0-9]+;)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hubCardCache = new Map();
function hubCard(href) {
  if (hubCardCache.has(href)) return hubCardCache.get(href);
  const [p, anchor] = [href.split("#")[0], href.includes("#") ? href.split("#")[1] : ""];
  const sup = (batch.hubCards || {})[href] || (batch.hubCards || {})[p] || {};
  const f = p.replace(/^\//, "") + ".html";
  const src = exists(f) ? rd(f) : "";
  let title = sup.title || plain((/<title>([^<]*)<\/title>/.exec(src) || [, ""])[1]).split(/ — | \| /)[0];
  let desc = sup.desc || plain((/<meta name="description" content="([^"]*)"/.exec(src) || [, ""])[1]);
  if (anchor && !(batch.hubCards || {})[href]) {
    const sec = new RegExp(`id="${esc(anchor)}"[\\s\\S]{0,600}?<h2[^>]*>([\\s\\S]*?)<\\/h2>`).exec(src);
    if (sec) { title = plain(sec[1]); title = title.charAt(0).toUpperCase() + title.slice(1); }
    if (sup.anchorDesc) desc = sup.anchorDesc.replace(/\{name\}/g, title.replace(/ cards$/i, ""));
  }
  const out = title ? { title, desc } : null;
  hubCardCache.set(href, out);
  return out;
}
// One pass over a page's related cards. pick(href, titleText) → the card's new href, or null to leave it alone.
// Returns { s, n: cards rewritten, dropped, log[] }.
const CARD_A = /<a\b(?=[^>]*\bclass="related-card")[^>]*\bhref="([^"]+)"[^>]*>[\s\S]*?<\/a>|<a\b(?=[^>]*\bhref="([^"]+)")[^>]*\bclass="related-card"[^>]*>[\s\S]*?<\/a>/g;
const CARD_B = /([ \t]*)<div class="related-card">((?:(?!<div class="related-card">)[\s\S])*?)<a href="([^"]+)" class="related-link">([\s\S]*?)<\/a>(\s*)<\/div>[ \t]*\n?/g;
function rewriteRelated(s, file, pick) {
  const own = "/" + file.replace(/\.html$/, "").replace(/^index$/, "");
  // hrefs the page keeps regardless (cards this pass leaves alone) + hrefs already emitted by this pass
  const taken = new Set();
  s.replace(CARD_A, (m, h1, h2) => { const h = h1 || h2; if (!pick(h, titleOfA(m))) taken.add(h); return m; });
  s.replace(CARD_B, (m, i, b, h) => { if (!pick(h, plain((/class="related-title">([\s\S]*?)<\/div>/.exec(b) || [, ""])[1]))) taken.add(h); return m; });
  let n = 0, dropped = 0; const log = [];
  function titleOfA(m) { return plain((/<h3[^>]*>([\s\S]*?)<\/h3>/.exec(m) || /class="related-title"[^>]*>([\s\S]*?)<\/div>/.exec(m) || [, ""])[1]); }
  const fix = (m, oldHref, title, build) => {
    const next = pick(oldHref, title); if (!next) return m;
    const card = hubCard(next);
    if (!card) { log.push(`${file}: related card "${title}" → ${next}: hub text not found, left as is`); return m; }
    if (next.split("#")[0] === own || taken.has(next)) { dropped++; log.push(`${file}: related card "${title}" dropped (${next.split("#")[0] === own ? "self link" : "page already links " + next})`); return ""; }
    taken.add(next); n++; log.push(`${file}: related card "${title}" → "${card.title}" (${next})`);
    return build(next, card);
  };
  s = s.replace(CARD_A, (m, h1, h2) => fix(m, h1 || h2, titleOfA(m), (next, card) => {
    let x = m.replace(/href="[^"]+"/, `href="${next}"`);
    x = x.replace(/\s*<div class="section-eyebrow">[\s\S]*?<\/div>/, "");
    x = x.replace(/(<h3[^>]*>)[\s\S]*?(<\/h3>)/, `$1${escHtml(card.title)}$2`).replace(/(class="related-title"[^>]*>)[\s\S]*?(<\/div>)/, `$1${escHtml(card.title)}$2`);
    if (card.desc) x = x.replace(/(<p\b[^>]*>)[\s\S]*?(<\/p>)/, `$1${escHtml(card.desc)}$2`).replace(/(class="related-sub"[^>]*>)[\s\S]*?(<\/div>)/, `$1${escHtml(card.desc)}$2`);
    return x;
  }));
  s = s.replace(CARD_B, (m, ind, body, href, linkText, gap) => fix(m, href, plain((/class="related-title">([\s\S]*?)<\/div>/.exec(body) || [, ""])[1]), (next, card) => {
    let b = body.replace(/\s*<div class="related-tag">[\s\S]*?<\/div>/, "");
    b = b.replace(/(class="related-title">)[\s\S]*?(<\/div>)/, `$1${escHtml(card.title)}$2`);
    if (card.desc) b = b.replace(/(class="related-desc">)[\s\S]*?(<\/div>)/, `$1${escHtml(card.desc)}$2`);
    return `${ind}<div class="related-card">${b}<a href="${next}" class="related-link">${linkText}</a>${gap}</div>\n`;
  }));
  return { s, n, dropped, log };
}

if (RELATED_ONLY) {
  const norm = (x) => plain(x).toLowerCase();
  let total = 0, totalDropped = 0; const out = [];
  const byFile = new Map();
  for (const c of batch.cards || []) { if (!byFile.has(c.file)) byFile.set(c.file, []); byFile.get(c.file).push(c); }
  for (const [f, list] of byFile) {
    if (!exists(f)) { out.push(`${f}: missing, skipped`); continue; }
    const r = rewriteRelated(rd(f), f, (href, title) => list.some((c) => c.href === href && norm(c.title) === norm(title)) ? href : null);
    out.push(...r.log); total += r.n; totalDropped += r.dropped;
    if (r.n || r.dropped) { if (!DRY) fs.writeFileSync(path.join(REPO, f), r.s); }
  }
  out.push(`related: ${total} card(s) rewritten, ${totalDropped} dropped, ${(batch.cards || []).length} listed`);
  console.log((DRY ? "DRY RUN\n" : "") + out.join("\n"));
  process.exit(0);
}

// cards hosted on a merged page → their /card-<id> page comes back
const wl = JSON.parse(rd("data/watchlist.json"));
// batch.unhosted records them so a re-run (watchlist already clean) still routes "#engine-<id>" anchors to /card-<id>
const unhosted = [...(batch.unhosted || [])];
let wlChanged = false;
for (const c of wl.cards || []) if (c.slug && HUB[c.slug]) { if (!unhosted.some((u) => u.id === c.id)) unhosted.push({ id: c.id, host: c.slug }); delete c.slug; wlChanged = true; }
if (wlChanged) { wr("data/watchlist.json", json(wl)); log.push(`watchlist: unhosted ${unhosted.map((u) => u.id + " (was /" + u.host + ")").join(", ")}`); }
const cardFor = (host, anchor) => { const m = /^#engine-([a-z0-9-]+)$/.exec(anchor || ""); return m && unhosted.some((u) => u.id === m[1] && u.host === host) ? "/card-" + m[1] : null; };
// destination for an href "/slug" + optional "#anchor"
const dest = (slug, anchor) => cardFor(slug, anchor) || HUB[slug];

// 1. vercel.json
const vj = JSON.parse(rd("vercel.json"));
let before = vj.redirects.length;
vj.redirects = vj.redirects.filter((r) => {
  const m = /^\/([a-z0-9-]+)(#.*)?$/.exec(r.destination);
  if (!m || !HUB[m[1]]) return true;
  const card = cardFor(m[1], m[2]) || (/^\/card-([a-z0-9-]+)$/.test(r.source) && unhosted.some((u) => "/card-" + u.id === r.source) ? r.source : null);
  if (card) { log.push(`vercel: drop ${r.source} → ${r.destination} (card page regenerated)`); return false; }
  log.push(`vercel: re-point ${r.source} → ${HUB[m[1]]} (was ${r.destination})`); r.destination = HUB[m[1]]; return true;
});
let added = 0;
for (const { slug, hub } of PAGES) {
  if (vj.redirects.some((r) => r.source === "/" + slug)) continue;
  vj.redirects.push({ source: "/" + slug, destination: hub, permanent: true }); added++;
}
wr("vercel.json", json(vj));
log.push(`vercel: +${added} 301(s), ${before} → ${vj.redirects.length} redirects`);

// 2. delete pages
let removed = 0;
for (const slug of SLUGS) if (exists(slug + ".html")) { removed++; if (!DRY) fs.unlinkSync(path.join(REPO, slug + ".html")); }
log.push(`pages: ${removed} removed`);

// 3. sitemap
let sm = rd("sitemap.xml"); const smN = (sm.match(/<loc>/g) || []).length;
for (const slug of SLUGS) sm = sm.replace(new RegExp(`\\s*<url>\\s*<loc>https://www\\.shopcardhub\\.com/${esc(slug)}</loc>[\\s\\S]*?</url>`), "");
wr("sitemap.xml", sm);
log.push(`sitemap: ${smN} → ${(sm.match(/<loc>/g) || []).length} URLs`);

// 4. nav.json
const nav = JSON.parse(rd("data/nav.json"));
let navDropped = 0, navRepointed = 0;
const splitHref = (h) => { const m = /^\/([a-z0-9-]+)(#.*)?$/.exec(h || ""); return m ? [m[1], m[2] || ""] : [null, ""]; };
const walk = (node) => {
  if (Array.isArray(node)) {
    const out = [];
    for (const x of node) {
      if (x && typeof x === "object" && typeof x.href === "string") {
        const [slug, anchor] = splitHref(x.href);
        if (slug && HUB[slug]) {
          const card = cardFor(slug, anchor);
          if (card) { x.href = card; navRepointed++; out.push(x); }
          else { navDropped++; }
          continue;
        }
      }
      out.push(walk(x));
    }
    return out;
  }
  if (node && typeof node === "object") for (const k of Object.keys(node)) node[k] = walk(node[k]);
  return node;
};
walk(nav);
wr("data/nav.json", json(nav));
log.push(`nav.json: ${navDropped} link(s) dropped, ${navRepointed} card-chart row(s) re-pointed`);

// 5. buy-strip.json
const bs = JSON.parse(rd("data/buy-strip.json"));
let bsDropped = 0;
for (const slug of SLUGS) if (bs.pages && bs.pages[slug]) { delete bs.pages[slug]; bsDropped++; }
wr("data/buy-strip.json", json(bs));
log.push(`buy-strip.json: ${bsDropped} page entr${bsDropped === 1 ? "y" : "ies"} dropped`);

// 7. league manifests + data/league.json
const MAN = path.join(REPO, "tools/league/manifests");
let manMerged = 0, manRepointed = 0;
for (const n of fs.readdirSync(MAN).filter((x) => x.endsWith(".json"))) {
  const f = "tools/league/manifests/" + n;
  // textual edits so the manifest keeps its own formatting (the diff stays two lines)
  let t = rd(f); const o = t; const m = JSON.parse(t);
  if (HUB[m.slug] && m.status !== `merged-${DATE}`) {
    t = t.replace(/^(\s*)"slug":\s*"[^"]+",\n/m, (line, ind) => line + `${ind}"status": "merged-${DATE}",\n${ind}"mergedInto": "${HUB[m.slug]}",\n`);
    manMerged++;
  }
  const [hs] = splitHref(m.hub);
  if (hs && HUB[hs]) { log.push(`manifest ${n}: hub ${m.hub} merged → ${HUB[hs]}`); t = t.replace(/("hub":\s*)"[^"]+"/, `$1"${HUB[hs]}"`); manRepointed++; }
  if (t !== o) { JSON.parse(t); wr(f, t); }
}
log.push(`manifests: ${manMerged} marked merged-${DATE}, ${manRepointed} hub re-pointed`);
if (exists("data/league.json")) {
  const reg = JSON.parse(rd("data/league.json")); let n = 0;
  for (const p of reg.pages || []) {
    if (HUB[p.slug] && p.status === "live") { p.status = `merged-${DATE}`; n++; }
    const [hs] = splitHref(p.hub); if (hs && HUB[hs]) p.hub = HUB[hs];
  }
  wr("data/league.json", json(reg, 1)); log.push(`league.json: ${n} page(s) → merged-${DATE}`);
}

// 8. html hrefs
let files = 0, refs = 0, blocksRemoved = 0, dropped = 0;
const DROP_IN = new Set(batch.dropLinksIn || []); // directory pages: a merged page's row goes, it is not re-pointed
const dropRe = new RegExp(`[ \\t]*<a href="/(${SLUGS.map(esc).join("|")})(#[^"]*)?"[^>]*>[^<]*</a>[ \\t]*\\n?`, "g");
const liveLeagueHubs = new Set();
for (const n of fs.readdirSync(MAN).filter((x) => x.endsWith(".json"))) {
  const m = JSON.parse(writes.get("tools/league/manifests/" + n) || rd("tools/league/manifests/" + n));
  if (!HUB[m.slug] && exists(m.slug + ".html") && m.hub) liveLeagueHubs.add(m.hub.replace(/^\//, ""));
}
const hrefRe = new RegExp(`(href=")/(${SLUGS.map(esc).join("|")})(#[^"]*)?"`, "g");
const absRe = new RegExp(`https://www\\.shopcardhub\\.com/(${SLUGS.map(esc).join("|")})(#[A-Za-z0-9_-]*)?(?=["'\\s<)])`, "g");
for (const f of fs.readdirSync(REPO).filter((x) => x.endsWith(".html") && !HUB[x.slice(0, -5)])) {
  let s = rd(f); const o = s;
  if (DROP_IN.has(f)) {
    const nav = s.indexOf("<!-- NAV:END -->"); const head = nav > -1 ? s.slice(0, nav) : "", body = nav > -1 ? s.slice(nav) : s;
    s = head + body.replace(dropRe, (m, slug) => { if (cardFor(slug, (m.match(/#[^"]*/) || [""])[0])) return m; dropped++; return ""; });
  }
  { // 8r: related cards pointing at a merged page take the hub's text before the generic href rewrite
    const r = rewriteRelated(s, f, (href) => { const [sl, an] = splitHref(href); return sl && HUB[sl] ? dest(sl, an) : null; });
    s = r.s; refs += r.n; log.push(...r.log);
  }
  s = s.replace(hrefRe, (_, pre, slug, anchor) => { refs++; return `${pre}${dest(slug, anchor)}"`; });
  s = s.replace(absRe, (_, slug, anchor) => { refs++; return "https://www.shopcardhub.com" + dest(slug, anchor); });
  const slug = f.slice(0, -5);
  if (s.includes("<!-- LEAGUE-LINKS:START -->") && !liveLeagueHubs.has(slug)) {
    s = s.replace(/\n?<!-- LEAGUE-LINKS:START -->[\s\S]*?<!-- LEAGUE-LINKS:END -->\n?/, "\n"); blocksRemoved++;
    log.push(`${f}: LEAGUE-LINKS block removed (no live league page names this hub)`);
  }
  if (s !== o) { wr(f, s); files++; }
}
log.push(`html: ${refs} href(s) rewritten on ${files} page(s); ${dropped} directory row(s) dropped; ${blocksRemoved} empty LEAGUE-LINKS block(s) removed`);

// 8b. page-specific copy edits named in the batch (post-rewrite text): {file, find, replace, regex?, all?}
for (const e of batch.edits || []) {
  const have = writes.has(e.file) ? writes.get(e.file) : exists(e.file) ? rd(e.file) : null;
  if (have == null) { log.push(`edit ${e.file}: file missing, skipped`); continue; }
  const re = e.regex ? new RegExp(e.find, e.all ? "g" : "") : null;
  const hit = re ? re.test(have) : have.includes(e.find);
  if (!hit) { log.push(`edit ${e.file}: pattern not found — ${String(e.find).slice(0, 60)}`); continue; }
  const next = re ? have.replace(new RegExp(e.find, e.all ? "g" : ""), e.replace) : e.all ? have.split(e.find).join(e.replace) : have.replace(e.find, e.replace);
  wr(e.file, next); log.push(`edit ${e.file}: ${e.note || "applied"}`);
}

// 9. data/collect editorial hrefs
if (exists("data/collect")) {
  for (const n of fs.readdirSync(path.join(REPO, "data/collect")).filter((x) => x.endsWith(".json"))) {
    const f = "data/collect/" + n; let s = writes.has(f) ? writes.get(f) : rd(f); const o = s;
    s = s.replace(new RegExp(`(href=\\\\")/(${SLUGS.map(esc).join("|")})(#[^"\\\\]*)?(\\\\")`, "g"), (_, a, slug, anchor, b) => a + dest(slug, anchor) + b);
    if (s !== o) { wr(f, s); log.push(`${f}: href(s) re-pointed`); }
  }
}

if (!DRY) for (const [f, s] of writes) fs.writeFileSync(path.join(REPO, f), s);
console.log((DRY ? "DRY RUN\n" : "") + log.join("\n"));
