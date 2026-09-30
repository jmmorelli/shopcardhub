#!/usr/bin/env node
// new-sector-page.mjs — scaffold a Pokémon set-index page for a CONFIG ticker in build-sector-index.mjs
// (Sep 28 2026, Mo: "add at least 10+ more indices for pokemon, specifically the popular sets from the past").
// Clones the SV151 page shell (head styles, NAV markers, footer scripts) and replaces every SV151-specific
// string: title/meta/og/canonical/JSON-LD, crumb, ticker strip, the BUYBOX (eBay searches via tools/lib/epn.mjs —
// searches, never prices), and the index block markers (build-sector-index.mjs --init/--bake fills them).
// The LEAGUE-LINKS block is dropped (league pages link to their own hubs). Run build-nav afterwards.
// Usage: node tools/new-sector-page.mjs --ticker SK03 [--force]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ebaySearchUrl, SACAT_TCG, assertClean } from "./lib/epn.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const TK = args[args.indexOf("--ticker") + 1];
const SPEC = {
  BS99:  { set: "Base Set", q: "base set unlimited", year: 1999 },
  JU99:  { set: "Jungle", q: "jungle unlimited", year: 1999 },
  FO99:  { set: "Fossil", q: "fossil unlimited", year: 1999 },
  TR00:  { set: "Team Rocket", q: "team rocket unlimited", year: 2000 },
  NG00:  { set: "Neo Genesis", q: "neo genesis unlimited", year: 2000 },
  ND02:  { set: "Neo Destiny", q: "neo destiny unlimited", year: 2002 },
  AQ03:  { set: "Aquapolis", q: "aquapolis", year: 2003 },
  SK03:  { set: "Skyridge", q: "skyridge", year: 2003 },
  HF19:  { set: "Hidden Fates", q: "hidden fates", year: 2019 },
  EVS21: { set: "Evolving Skies", q: "evolving skies", year: 2021 },
  CEL21: { set: "Celebrations", q: "celebrations", year: 2021 },
  CZ23:  { set: "Crown Zenith", q: "crown zenith", year: 2023 },
};
const PAGES = { BS99: "pokemon-base-set-index", JU99: "pokemon-jungle-index", FO99: "pokemon-fossil-index", TR00: "team-rocket-index", NG00: "neo-genesis-index", ND02: "neo-destiny-index", AQ03: "aquapolis-index", SK03: "skyridge-index", HF19: "hidden-fates-index", EVS21: "evolving-skies-index", CEL21: "celebrations-index", CZ23: "crown-zenith-index" };
const THEME = { BS99: "#e8b93a", JU99: "#4caf50", FO99: "#b0a089", TR00: "#d23c3c", NG00: "#f0a830", ND02: "#6a5acd", AQ03: "#2fa4d8", SK03: "#8fb6e8", HF19: "#e0503c", EVS21: "#3c7fd8", CEL21: "#d4af37", CZ23: "#c9a227" };
const s = SPEC[TK]; if (!s) { console.error("unknown ticker " + TK); process.exit(2); }
const slug = PAGES[TK], out = path.join(ROOT, slug + ".html"), theme = THEME[TK];
if (fs.existsSync(out) && !args.includes("--force")) { console.log("exists: " + slug); process.exit(0); }
const vintage = s.year < 2010;
let h = fs.readFileSync(path.join(ROOT, "scarlet-violet-151-index.html"), "utf8");
const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const setE = esc(s.set);
const title = `${TK} · ${s.set} Set Index — every card, sold comps, base 100 | ShopCardHub`;
const desc = `${TK}: a set index for Pokémon ${s.set} (${s.year})${vintage && s.q.includes("unlimited") ? ", Unlimited print" : ""} — every card in the set, priced from dated sold comps of raw singles, base 100 at release, re-marked Monday and Thursday. Every constituent shown. No calls, just the tape.`;
const ogd = `Every card in Pokémon ${s.set}, priced from dated sold comps. Base 100, re-marked twice a week, every constituent shown.`;
const rep = (a, b) => { if (!h.includes(a)) throw new Error("anchor missing: " + a.slice(0, 60)); h = h.split(a).join(b); };
h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="https://www.shopcardhub.com/${slug}">`);
h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(TK + " · " + s.set + " Set Index")}">`);
h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(ogd)}">`);
h = h.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="https://www.shopcardhub.com/${slug}">`);
h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: `${TK} · ${s.set} Set Index`, description: desc, url: `https://www.shopcardhub.com/${slug}`, isPartOf: { "@type": "WebSite", name: "ShopCardHub", url: "https://www.shopcardhub.com/" } })}</script>`);
rep(`<b>SV151</b></div>`, `<b>${TK}</b></div>`);
rep(`<div class="strip" id="strip"><a class="chip on" href="/scarlet-violet-151-index"><b>SV151</b> <span class="soon">live</span></a></div>`, `<div class="strip" id="strip"><a class="chip on" href="/${slug}"><b>${TK}</b> <span class="soon">live</span></a></div>`);
h = h.replace(/ticker: 'BCB26'/g, `ticker: '${TK}'`).replace(/var on = \(t === 'BCB26'\);/, `var on = (t === '${TK}');`);
// BUYBOX: singles (primary), sealed, graded — searches with the affiliate tag, never a price
const L = (q, cid, sacat) => assertClean(ebaySearchUrl({ q, customid: cid, sacat })).replace(/&/g, "&amp;");
const ga = (item) => `onclick="if(typeof gtag==='function')gtag('event','buystrip_click',{item:'${item}',page:location.pathname})"`;
const neg = "-psa -cgc -bgs -sgc -graded -lot -proxy -custom -japanese";
const box = `<!-- BUYBOX:START — ${esc(s.set)} on eBay, above the fold (R11). Searches, not prices. -->
<style>
.ci-buy{max-width:1060px;margin:18px auto 0;padding:0 24px}
.ci-buy .bs{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;background:var(--p1);border:1px solid var(--bd);border-left:3px solid ${theme};padding:12px 16px;font-family:var(--fm);font-size:11px;color:var(--dim)}
.ci-buy .bs b{color:var(--th);font-family:var(--fd);font-size:13px;letter-spacing:1.5px;text-transform:uppercase}
.ci-buy .bs a{display:inline-block;font-family:var(--fd);font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#000;background:var(--gd);padding:7px 12px;border-radius:2px;text-decoration:none}
.ci-buy .bs a.alt{background:transparent;color:var(--th);border:1px solid var(--bd2)}
.ci-buy .bs a:hover{filter:brightness(1.1)}
.ci-buy .bs .n{flex:1 1 100%;font-size:10px;line-height:1.6}
</style>
<div class="ci-buy"><div class="bs">
  <b>${setE} on eBay</b>
  <a href="${L(`pokemon ${s.q} holo ${neg}`, TK.toLowerCase() + "-singles", SACAT_TCG)}" target="_blank" rel="noopener sponsored" ${ga("primary")}>${vintage ? "Raw holos" : "Raw singles"} &rarr;</a>
  <a class="alt" href="${L(`pokemon ${s.set.toLowerCase()} psa`, TK.toLowerCase() + "-graded", SACAT_TCG)}" target="_blank" rel="noopener sponsored" ${ga("graded")}>Graded &rarr;</a>
  <a class="alt" href="${L(`pokemon ${s.set.toLowerCase()} ${vintage ? "booster pack sealed" : "booster box sealed"} -lot -japanese -empty -opened -art`, TK.toLowerCase() + "-sealed", "183456")}" target="_blank" rel="noopener sponsored" ${ga("sealed")}>Sealed &rarr;</a>
  <span class="n">eBay searches with our affiliate tag, not prices. The index below prices raw singles only, from dated sold comps.</span>
</div></div>
<!-- BUYBOX:END -->`;
h = h.replace(/<!-- BUYBOX:START[\s\S]*?<!-- BUYBOX:END -->/, box);
h = h.replace(/<!-- SV151:START -->[\s\S]*?<!-- SV151:END -->\n?/, `<!-- ${TK}:START -->\n<!-- ${TK}:END -->\n`);
h = h.replace(/<!-- LEAGUE-LINKS:START -->[\s\S]*?<!-- LEAGUE-LINKS:END -->\n?/, "");
if (/SV151|scarlet-violet-151-index|Scarlet &amp; Violet 151/.test(h.replace(/<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/, "").replace(/var INDEX = \[[\s\S]*?\];/, ""))) {
  const m = h.replace(/<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/, "").match(/.{0,80}(SV151|scarlet-violet-151-index|Scarlet &amp; Violet 151).{0,80}/);
  throw new Error("SV151 string left outside nav: " + (m && m[0]));
}
fs.writeFileSync(out, h);
console.log("wrote /" + slug);
