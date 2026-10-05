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
  // Neo Discovery + Neo Revelation pairs (Oct 4 2026, Mo: "add both. Do it please.")
  NDC01: { set: "Neo Discovery", q: "neo discovery unlimited", year: 2001 },
  NR01:  { set: "Neo Revelation", q: "neo revelation unlimited", year: 2001 },
  NDC1E: { set: "Neo Discovery 1st Edition", q: "neo discovery 1st edition", year: 2001 },
  NR1E:  { set: "Neo Revelation 1st Edition", q: "neo revelation 1st edition", year: 2001 },
  AQ03:  { set: "Aquapolis", q: "aquapolis", year: 2003 },
  SK03:  { set: "Skyridge", q: "skyridge", year: 2003 },
  HF19:  { set: "Hidden Fates", q: "hidden fates", year: 2019 },
  EVS21: { set: "Evolving Skies", q: "evolving skies", year: 2021 },
  CEL21: { set: "Celebrations", q: "celebrations", year: 2021 },
  CZ23:  { set: "Crown Zenith", q: "crown zenith", year: 2023 },
  // edition indices (Sep 30 2026)
  BS1E:  { set: "Base Set 1st Edition", q: "base set 1st edition", year: 1999 },
  BSSL:  { set: "Base Set Shadowless", q: "base set shadowless -1st", year: 1999 },
  JU1E:  { set: "Jungle 1st Edition", q: "jungle 1st edition", year: 1999 },
  FO1E:  { set: "Fossil 1st Edition", q: "fossil 1st edition", year: 1999 },
  TR1E:  { set: "Team Rocket 1st Edition", q: "team rocket 1st edition", year: 2000 },
  NG1E:  { set: "Neo Genesis 1st Edition", q: "neo genesis 1st edition", year: 2000 },
  ND1E:  { set: "Neo Destiny 1st Edition", q: "neo destiny 1st edition", year: 2002 },
  // modern whole-set adds (Oct 4 2026, Mo). neg = extra exclusions on the strip's searches (other Mega-era sets say "Mega Evolution" too)
  SSP24: { set: "Surging Sparks", q: "surging sparks", year: 2024 },
  MEG25: { set: "Mega Evolution", q: "mega evolution", year: 2025, neg: "-phantasmal -ascended -perfect -chaos -pitch -delta -celebration -journey -rivals" },
  // pre shell (playbook Phase 2): no level, no basket, noindex; --init replaces the DLR26 block once the console lists
  DLR26: { set: "Delta Reign", q: "delta reign", year: 2026, pre: true },
};
const PAGES = { BS99: "pokemon-base-set-index", JU99: "pokemon-jungle-index", FO99: "pokemon-fossil-index", TR00: "team-rocket-index", NG00: "neo-genesis-index", ND02: "neo-destiny-index", AQ03: "aquapolis-index", SK03: "skyridge-index", HF19: "hidden-fates-index", EVS21: "evolving-skies-index", CEL21: "celebrations-index", CZ23: "crown-zenith-index" , BS1E: "pokemon-base-set-1st-edition-index", BSSL: "pokemon-base-set-shadowless-index", JU1E: "pokemon-jungle-1st-edition-index", FO1E: "pokemon-fossil-1st-edition-index", TR1E: "team-rocket-1st-edition-index", NG1E: "neo-genesis-1st-edition-index", ND1E: "neo-destiny-1st-edition-index", SSP24: "surging-sparks-index", MEG25: "mega-evolution-index", DLR26: "delta-reign-index", NDC01: "neo-discovery-index", NR01: "neo-revelation-index", NDC1E: "neo-discovery-1st-edition-index", NR1E: "neo-revelation-1st-edition-index" };
const THEME = { BS99: "#e8b93a", JU99: "#4caf50", FO99: "#b0a089", TR00: "#d23c3c", NG00: "#f0a830", ND02: "#6a5acd", AQ03: "#2fa4d8", SK03: "#8fb6e8", HF19: "#e0503c", EVS21: "#3c7fd8", CEL21: "#d4af37", CZ23: "#c9a227" , BS1E: "#c0392b", BSSL: "#7f8c8d", JU1E: "#2e7d32", FO1E: "#8d7b5f", TR1E: "#a32020", NG1E: "#c98a1c", ND1E: "#4b3fa8", SSP24: "#f7d02c", MEG25: "#5b8cff", DLR26: "#2fbf71", NDC01: "#c86bb0", NR01: "#2bb3a3", NDC1E: "#9a4d86", NR1E: "#1f8a7d" };
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
const neg = "-psa -cgc -bgs -sgc -graded -lot -proxy -custom -japanese" + (s.neg ? " " + s.neg : "");
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
  <a class="alt" href="${L(`pokemon ${s.set.toLowerCase()} psa${s.neg ? " " + s.neg : ""}`, TK.toLowerCase() + "-graded", SACAT_TCG)}" target="_blank" rel="noopener sponsored" ${ga("graded")}>Graded &rarr;</a>
  <a class="alt" href="${L(`pokemon ${s.set.toLowerCase()} ${vintage ? "booster pack sealed" : "booster box sealed"} -lot -japanese -empty -opened -art${s.neg ? " " + s.neg : ""}`, TK.toLowerCase() + "-sealed", "183456")}" target="_blank" rel="noopener sponsored" ${ga("sealed")}>Sealed &rarr;</a>
  <span class="n">eBay searches with our affiliate tag, not prices. The index below prices raw singles only, from dated sold comps.</span>
</div></div>
<!-- BUYBOX:END -->`;
h = h.replace(/<!-- BUYBOX:START[\s\S]*?<!-- BUYBOX:END -->/, box);
h = h.replace(/<!-- SV151:START -->[\s\S]*?<!-- SV151:END -->\n?/, `<!-- ${TK}:START -->\n<!-- ${TK}:END -->\n`);
h = h.replace(/<!-- LEAGUE-LINKS:START -->[\s\S]*?<!-- LEAGUE-LINKS:END -->\n?/, "");
// ---------------- PRE shell (Oct 4 2026, DLR26 — NEW-SET-PLAYBOOK Phase 2) ----------------
// Same shell, but: noindex, no level, no basket, no table; the sealed strip is the pre-order state ("pre-order asks", never
// MSRP); the block between the <TK>:START/END markers is a pre-launch card that build-sector-index.mjs --init replaces;
// the dates and the drift explainer (playbook Phase 4.5) sit AFTER the markers so they survive go-live.
if (s.pre) {
  const CFG = { DLR26: { release: "2026-11-06", releaseLong: "Friday, Nov 6, 2026", streets: "11/06", preorder: "Sep 30, 2026", prerelease: "Oct 24 – Nov 1, 2026", baseMon: "Nov 2026", chase: "Mega Rayquaza ex", code: "ME06 · card code DLR · TPCi set 110", guide: "/pokemon-delta-reign-2026" } }[TK];
  if (!CFG) throw new Error("no pre spec for " + TK);
  const pTitle = `${TK} · ${s.set} Set Index — launches from real sales after ${CFG.releaseLong.replace(/^\w+, /, "").replace(/, \d{4}$/, "")} | ShopCardHub`;
  const pDesc = `${TK}: a set index for Pokémon ${s.set} (${CFG.releaseLong.replace(/^\w+, /, "")}) — every card in the set, priced from dated sold comps once they trade. Pre-launch: no level until real sales clear the screen.`;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(pTitle)}</title>\n<meta name="robots" content="noindex, follow">`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(pDesc)}">`);
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(pDesc)}">`);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: `${TK} · ${s.set} Set Index`, description: pDesc, url: `https://www.shopcardhub.com/${slug}`, isPartOf: { "@type": "WebSite", name: "ShopCardHub", url: "https://www.shopcardhub.com/" } })}</script>`);
  h = h.replace(/<div class="livebar">[^<]*<\/div>/, `<div class="livebar">Pre-launch · streets ${esc(CFG.releaseLong.replace(/^\w+, /, ""))} · no level until real sales</div>`);
  h = h.split(`<b>${TK}</b> <span class="soon">live</span>`).join(`<b>${TK}</b> <span class="soon">pre · streets ${CFG.streets}</span>`);
  const sealedQ = `pokemon ${s.q} booster box -japanese -korean -chinese -thai -lot -case -etb -bundle -empty -opened -proxy`;
  const etbQ = `pokemon ${s.q} elite trainer box -japanese -korean -chinese -thai -lot -case -bundle -empty -opened -proxy`;
  const pbox = `<!-- BUYBOX:START — ${esc(s.set)} sealed on eBay, PRE-ORDER state (R11 · playbook Phase 2). Searches, not prices. -->
<style>
.ci-buy{max-width:1060px;margin:18px auto 0;padding:0 24px}
.ci-buy .bs{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;background:var(--p1);border:1px solid var(--bd);border-left:3px solid ${theme};padding:12px 16px;font-family:var(--fm);font-size:11px;color:var(--dim)}
.ci-buy .bs b{color:var(--th);font-family:var(--fd);font-size:13px;letter-spacing:1.5px;text-transform:uppercase}
.ci-buy .bs a{display:inline-block;font-family:var(--fd);font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#000;background:var(--gd);padding:7px 12px;border-radius:2px;text-decoration:none}
.ci-buy .bs a.alt{background:transparent;color:var(--th);border:1px solid var(--bd2)}
.ci-buy .bs a:hover{filter:brightness(1.1)}
.ci-buy .bs .n{flex:1 1 100%;font-size:10px;line-height:1.6}
</style>
<div class="ci-buy"><div class="bs" data-sealed-state="pre-order">
  <b>Sealed · pre-order asks</b>
  <a href="${L(sealedQ, TK.toLowerCase() + "-box", "183456")}" target="_blank" rel="noopener sponsored nofollow" ${ga("sealed-preorder")}>Booster box pre-orders &rarr;</a>
  <a class="alt" href="${L(etbQ, TK.toLowerCase() + "-etb", "183456")}" target="_blank" rel="noopener sponsored nofollow" ${ga("etb-preorder")}>ETB pre-orders &rarr;</a>
  <span class="n">Pre-order listings on eBay are sellers' asks, not prices and not MSRP. TPCi publishes no booster-box MSRP; the 2026 norm for an Elite Trainer Box has been $49.99 ($59.99 for the Pokémon Center ETB) — confirm at release. eBay searches with our affiliate tag.</span>
</div></div>
<!-- BUYBOX:END -->`;
  h = h.replace(/<!-- BUYBOX:START[\s\S]*?<!-- BUYBOX:END -->/, pbox);
  const preCard = `<!-- ${TK}:START -->
<style>
.pre-sh{max-width:1060px;margin:26px auto 0;padding:0 24px}
.pre-sh .pm{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px 32px;align-items:end;padding-bottom:14px;border-bottom:1px solid var(--bd)}
.pre-sh .eb{font-family:var(--fm);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${theme};margin-bottom:8px}
.pre-sh h2{font-family:var(--fd);font-size:clamp(26px,3.4vw,38px);font-weight:900;text-transform:uppercase;color:var(--th);line-height:1.02;margin:0 0 8px}
.pre-sh h2 i{font-style:normal;color:${theme}}
.pre-sh .sub{font-size:13px;line-height:1.55;color:var(--dim);max-width:620px}
.pre-sh .lv{font-family:var(--fm);font-size:40px;font-weight:700;color:var(--th);text-align:right;line-height:1}
.pre-sh .lvc{font-family:var(--fm);font-size:10px;color:var(--dim);margin-top:8px;text-align:right;line-height:1.6;max-width:240px}
.pre-sh h3{font-family:var(--fd);font-size:18px;font-weight:900;text-transform:uppercase;color:var(--th);margin:22px 0 8px}
.pre-sh ul{margin:0 0 0 18px;padding:0}
.pre-sh li{font-size:13px;line-height:1.6;color:var(--tx);margin:0 0 6px;max-width:720px}
@media(max-width:760px){.pre-sh .pm{grid-template-columns:1fr}.pre-sh .lv,.pre-sh .lvc{text-align:left}}
</style>
<div class="pre-sh" data-prices-updated="2026-10-04">
  <div class="pm">
    <div><div class="eb">▮ Set Index · Sector Model · Pre-launch</div>
    <h2>${TK} <i>·</i> ${setE} Set Index</h2>
    <p class="sub">Every card in Pokémon ${setE} (${esc(CFG.code)}), priced from dated sold comps once the cards trade, re-marked Monday and Thursday. 100 = ${CFG.baseMon}, the set's release month. Nothing is printed before real sales exist. ${esc(CFG.chase)} is the chase.</p></div>
    <div><div class="lv">PRE</div><div class="lvc">first level: the Monday or Thursday after enough cards clear the screen</div></div>
  </div>
  <h3>How it goes live</h3>
  <ul>
    <li>The universe is every numbered card on PriceCharting's ${setE} listing once it exists. Sealed product is not a card and is not in it.</li>
    <li>A card enters the basket at 6 or more clean, single-card dated sales in the trailing 30 days and stays until it falls below 4. Prerelease-weekend sales are not used to set the base.</li>
    <li>Price-weighted on dated sold comps, never asks. No card above 25%, and cards above 5% never past 50% together.</li>
  </ul>
</div>
<!-- ${TK}:END -->
<style>
.pre-dt{max-width:1060px;margin:18px auto 0;padding:0 24px}
.pre-dt .g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pre-dt .g>div{border:1px solid var(--bd);border-left:3px solid ${theme};background:var(--p1);padding:12px 14px}
.pre-dt .g b{display:block;font-family:var(--fd);font-size:16px;color:var(--th);text-transform:uppercase;margin-bottom:4px}
.pre-dt .g span{font-family:var(--fm);font-size:11px;color:var(--tx)}
.pre-dt p{font-size:12.5px;line-height:1.6;color:var(--tx);margin:12px 0 0;max-width:760px}
.pre-dt p.f{font-family:var(--fm);font-size:10px;color:var(--dim)}
@media(max-width:760px){.pre-dt .g{grid-template-columns:1fr}}
</style>
<section class="pre-dt" aria-label="${setE} dates">
  <div class="g">
    <div><b>Pre-orders</b><span>Pokémon Center pre-orders opened ${esc(CFG.preorder)}</span></div>
    <div><b>Prereleases</b><span>${esc(CFG.prerelease)} · Build &amp; Battle at local stores</span></div>
    <div><b>Release</b><span>${esc(CFG.releaseLong)} · English</span></div>
  </div>
  <p>Modern sets typically trade 10–25% below their release-week level after 1–3 months (ShopCardHub cohort, 32 sets since 2021, PriceCharting data). This index starts at release on purpose.</p>
  <p class="f">Dates as of Oct 4, 2026. The set guide: <a href="${CFG.guide}">${setE} — release date and what's in it</a> · <a href="/indices">every ticker</a> · <a href="/how-prices-work">how prices work</a>.</p>
</section>
`;
  h = h.replace(new RegExp(`<!-- ${TK}:START -->\\n<!-- ${TK}:END -->\\n`), preCard);
  if (!h.includes(`<!-- ${TK}:START -->`) || !h.includes("noindex")) throw new Error("pre shell incomplete");
}
if (/SV151|scarlet-violet-151-index|Scarlet &amp; Violet 151/.test(h.replace(/<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/, "").replace(/var INDEX = \[[\s\S]*?\];/, ""))) {
  const m = h.replace(/<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/, "").match(/.{0,80}(SV151|scarlet-violet-151-index|Scarlet &amp; Violet 151).{0,80}/);
  throw new Error("SV151 string left outside nav: " + (m && m[0]));
}
fs.writeFileSync(out, h);
console.log("wrote /" + slug);
