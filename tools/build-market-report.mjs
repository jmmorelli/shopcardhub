#!/usr/bin/env node
// build-market-report.mjs — the monthly card market report, one page per month (BET-20261105-1, CEO Desk Nov 5 2026;
// Night Crew build Nov 6 2026; spec Project claude/handoffs/bet-20261105-1.md).
//
// Why: "are Pokémon / Bowman card prices going down?" is what collectors and assistants ask. We hold a dated
// month-over-month read for every index and nobody publishes one in one place. This writes it as a plain HTML page.
//
// What it reads (read-only; no other page changes): data/indices.json, the same history every chart draws, through
// js/plain-read.js marksOf() so held one-night marks (HELD) and divisor rows (level-neutral changes of measure) never count.
//   start mark = the newest mark on or before the 1st of the month (else the first mark in its first 7 days)
//   end mark   = the newest mark on or before the last day of the month
//   An index with no start or end mark, or less than 21 days between them, prints "Not enough dated marks" and is left out
//   of every count, the median and the movers.
// Groups are the home page's own tabs (tools/lib/home-v2.mjs tabOf(): Pokémon Modern · Pokémon Classic · 1st Edition &
// Shadowless · Bowman), so no new classification is invented. Classic + 1st Edition & Shadowless read as "vintage".
// Counts and percentages only: no call, no buy/sell word, no "crash" (R18/R20/R35). Levels, never dollars, so there is no
// price cell to go stale; the stamp still carries data-prices-ttl because the page is a dated record of one month.
// eBay: one link per top mover, the index page's own vetted local-nav query (LOCALNAV pill, tools/build-local-nav.mjs) with
// customid=market-report-<yyyy-mm> (R33). JSON-LD: Article only, no Product/Offer/price.
// Shell: head boilerplate, NAV block and FOOTER block are copied from pokemon-booster-box-prices.html; build-nav.js and
// build-footer.js own them and rewrite them on their next run.
//
// Usage: node tools/build-market-report.mjs --month 2026-10 [--published 2026-11-06] [--dry]
//   writes card-market-report-<monthname>-<yyyy>.html. Then: node tools/build-nav.js · the three gates.
//   Sitemap + IndexNow: the Commissioner (event exception, CoS bet); this tool never touches sitemap.xml.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const PR = require(path.join(ROOT, "js/plain-read.js"));
const args = process.argv.slice(2);
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const MONTH = argOf("--month");
if (!/^\d{4}-\d{2}$/.test(MONTH || "")) { console.error("usage: --month YYYY-MM"); process.exit(1); }
const DRY = args.includes("--dry");
const PUB = argOf("--published") || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const [Y, M] = MONTH.split("-").map(Number);
const monthName = MN[M - 1], label = `${monthName} ${Y}`;
const first = `${MONTH}-01`, firstWk = `${MONTH}-07`;
const last = `${MONTH}-${String(new Date(Date.UTC(Y, M, 0)).getUTCDate()).padStart(2, "0")}`;
const SLUG = `card-market-report-${monthName.toLowerCase()}-${Y}`, CID = `market-report-${MONTH}`;
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const md = (iso) => `${MS[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}`;
const span = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const pct = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
const cls = (v) => (v > 0 ? "up" : v < 0 ? "dn" : "");
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const range = (ds) => { const s = [...new Set(ds)].sort(); return s.length === 1 ? md(s[0]) : s[0].slice(5, 7) === s[s.length - 1].slice(5, 7) ? `${md(s[0])}–${+s[s.length - 1].slice(8, 10)}` : `${md(s[0])}–${md(s[s.length - 1])}`; };

// the home page's tabs (tools/lib/home-v2.mjs tabOf, Nov 2026) — same rule, copied so the home lib stays untouched
function groupOf(tk, v) {
  if (/^(BOW|BB|BCB|BCS|BD|BF|BBK)/.test(tk)) return "bow";
  if (/1E$|^BSSL$/.test(tk)) return "p1e";
  return (v.releaseDate || "9999") < "2004-01-01" ? "pcl" : "pmo";
}
const GROUP = { pmo: "Pokémon Modern", pcl: "Pokémon Classic", p1e: "1st Edition & Shadowless", bow: "Bowman" };

const D = JSON.parse(fs.readFileSync(path.join(ROOT, "data/indices.json"), "utf8"));
const rows = [];
for (const [tk, r] of Object.entries(D)) {
  if (!r || typeof r !== "object" || !Array.isArray(r.history) || r.status !== "live") continue;
  const h = PR.marksOf(tk, r).filter((x) => /^\d{4}-\d{2}-\d{2}/.test(String(x.date))).map((x) => ({ date: String(x.date).slice(0, 10), level: x.level }));
  let s = null, e = null;
  for (const x of h) { if (x.date <= first) s = x; if (x.date <= last) e = x; }
  if (!s) s = h.find((x) => x.date > first && x.date <= firstWk) || null;
  const ok = s && e && e.date > s.date && span(s.date, e.date) >= 21;
  rows.push({ tk, name: r.name, page: r.page, g: groupOf(tk, r), s, e, ok, p: ok ? (e.level / s.level - 1) * 100 : null });
}
if (!rows.length) throw new Error("no live index in data/indices.json");
const ok = rows.filter((x) => x.ok);
if (ok.length < 5) throw new Error(`only ${ok.length} indices have dated marks for ${label} — not writing`);

const stat = (xs) => ({ n: xs.length, fell: xs.filter((x) => x.p < 0).length, rose: xs.filter((x) => x.p > 0).length, med: median(xs.map((x) => x.p)) });
const all = stat(ok), modern = stat(ok.filter((x) => x.g === "pmo")), vint = stat(ok.filter((x) => x.g === "pcl" || x.g === "p1e")), bow = stat(ok.filter((x) => x.g === "bow"));
const sD = range(ok.map((x) => x.s.date)), eD = range(ok.map((x) => x.e.date)), endMax = ok.map((x) => x.e.date).sort().pop();
const byP = ok.slice().sort((a, b) => b.p - a.p);
const risers = byP.filter((x) => x.p > 0).slice(0, 3), fallers = byP.slice().reverse().filter((x) => x.p < 0).slice(0, 3);

// one vetted eBay query per top mover: the index page's LOCALNAV pill, re-tagged with this page's customid
function pill(x) {
  const f = path.join(ROOT, String(x.page || "").replace(/^\//, "") + ".html");
  if (!fs.existsSync(f)) return null;
  const html = fs.readFileSync(f, "utf8");
  const m = html.match(/<a class="lnav-pill" href="([^"]+)"[^>]*>/);
  if (!m || !/campid=5339155990/.test(m[1]) || !/customid=/.test(m[1])) return null;
  const al = m[0].match(/aria-label="Shop on eBay: ([^"]+)"/);
  return { href: m[1].replace(/&amp;/g, "&").replace(/customid=[^&"]*/, "customid=" + CID), what: al ? al[1].replace(/&amp;/g, "&") : null };
}

const headline = `Are Pokémon card prices going down? ${label}, every index`;
const answer = `In ${label}, ${all.fell} of ${all.n} Pokémon and Bowman card indices fell and ${all.rose} rose. The median index moved ${pct(all.med)} (marks of ${sD} to ${eD}).`;
const split = `Modern Pokémon: ${modern.fell} of ${modern.n} fell, median ${pct(modern.med)}. Vintage Pokémon (Classic, 1st Edition and Shadowless): ${vint.fell} of ${vint.n} fell, median ${pct(vint.med)}.`;
const bowLine = bow.n ? `${bow.fell} of ${bow.n} Bowman indices fell in ${monthName}, median ${pct(bow.med)}.` : `No Bowman index had dated marks for all of ${monthName}.`;

const tr = (x) => `      <tr><td class="mr-nm"><a href="${esc(x.page)}">${esc(x.name)}</a><small>${esc(GROUP[x.g])}</small></td>` +
  (x.ok ? `<td>${x.s.level.toFixed(2)}<small>${md(x.s.date)}</small></td><td>${x.e.level.toFixed(2)}<small>${md(x.e.date)}</small></td><td class="mr-p ${cls(x.p)}">${pct(x.p)}</td>`
    : `<td colspan="3" class="mr-na">Not enough dated marks</td>`) + `</tr>`;
const table = (xs) => `    <div class="mr-scroll"><table class="mr-tbl">
      <thead><tr><th>Index</th><th>Start</th><th>End</th><th>${esc(MS[M - 1])}</th></tr></thead>
      <tbody>
${xs.map(tr).join("\n")}
      </tbody>
    </table></div>`;
const mover = (x) => {
  const b = pill(x);
  return `      <li class="mr-mv"><a class="mr-mv-nm" href="${esc(x.page)}">${esc(x.name)}</a><b class="${cls(x.p)}">${pct(x.p)}</b><span class="mr-mv-d">${x.s.level.toFixed(2)} on ${md(x.s.date)} → ${x.e.level.toFixed(2)} on ${md(x.e.date)}</span>` +
    (b ? `<a class="mr-eb" href="${esc(b.href)}" target="_blank" rel="sponsored nofollow noopener" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${CID}-${x.tk.toLowerCase()}',page:location.pathname})">${esc(b.what ? b.what : "Listings")} on eBay ›</a>` : "") + `</li>`;
};
const nonBow = rows.filter((x) => x.g !== "bow").sort((a, b) => (b.ok - a.ok) || ((b.p || 0) - (a.p || 0)));
const bowRows = rows.filter((x) => x.g === "bow").sort((a, b) => (b.ok - a.ok) || ((b.p || 0) - (a.p || 0)));
const nNa = rows.length - ok.length;

const block = `<!-- MREPORT:START — generated by tools/build-market-report.mjs --month ${MONTH} from data/indices.json. Do not hand-edit. -->
<section class="mr-hero">
  <div class="container">
    <div class="mr-eyebrow">Card market report · <span data-prices-updated="${endMax}" data-prices-ttl="62">${esc(label)}</span></div>
    <h1>${esc(headline)}</h1>
    <p class="mr-answer">${esc(answer)}</p>
    <p class="mr-split">${esc(split)}</p>
    <div class="mr-movers">
      <div><h2>Rose the most</h2><ul>
${risers.map(mover).join("\n") || '      <li class="mr-mv">No index rose.</li>'}
      </ul></div>
      <div><h2>Fell the most</h2><ul>
${fallers.map(mover).join("\n") || '      <li class="mr-mv">No index fell.</li>'}
      </ul></div>
    </div>
  </div>
</section>
<section class="mr-sec">
  <div class="container">
    <h2>Every Pokémon index, ${esc(label)}</h2>
    <p class="mr-note">Index level at the first and last mark of the month, highest change first. 100 is the set's base month.</p>
${table(nonBow)}
  </div>
</section>
<section class="mr-sec">
  <div class="container">
    <h2>Bowman</h2>
    <p class="mr-note">${esc(bowLine)}</p>
${table(bowRows)}
  </div>
</section>
<section class="mr-sec">
  <div class="container">
    <p class="mr-src">How we got these: each index is one raw copy of every card it tracks, priced from dated sold comps (recent completed sales), and the level is that basket's cost scaled so the base month is 100. The change is end mark over start mark. ${nNa ? `${nNa} ${nNa === 1 ? "index" : "indices"} without dated marks for the whole month ${nNa === 1 ? "is" : "are"} listed but left out of the counts. ` : ""}A one-night mark we excluded is never used. This page counts what happened; it is not a call on what happens next. <a href="/how-prices-work">How our prices work ›</a> · <a href="/indices">All set indices ›</a></p>
    <p class="mr-src">Published ${md(PUB)}, ${PUB.slice(0, 4)}, from the marks in our index file.</p>
  </div>
</section>
<!-- MREPORT:END -->`;

const ld = {
  "@context": "https://schema.org", "@type": "Article", headline, description: answer,
  datePublished: PUB, dateModified: PUB, url: `https://www.shopcardhub.com/${SLUG}`, mainEntityOfPage: `https://www.shopcardhub.com/${SLUG}`,
  publisher: { "@type": "Organization", name: "ShopCardHub", url: "https://www.shopcardhub.com/" },
  about: ["Pokémon trading card prices", "Bowman baseball card prices"],
};

const CSS = `<style>
  /* Market report (Night Crew, Nov 6 2026) in Cupertino's tokens (claude/agents/cupertino/DESIGN-SYSTEM.md): system font,
     surfaces instead of borders, one accent, green/red for moves only. */
  .mr { font-family:var(--ds-font, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, Roboto, "Helvetica Neue", Arial, sans-serif); font-variant-numeric:tabular-nums; }
  .mr-hero { padding:40px 0 8px; }
  .mr-eyebrow { font-size:12px; font-weight:600; color:var(--text-dim); margin-bottom:12px; }
  .mr h1 { font-family:inherit; font-size:clamp(30px,4.6vw,52px); font-weight:600; line-height:1.08; letter-spacing:-0.02em; text-transform:none; color:var(--text-head,#f5f5f7); margin:0 0 16px; max-width:900px; }
  .mr-answer { font-size:clamp(17px,2vw,21px); line-height:1.45; color:var(--text-head,#f5f5f7); max-width:760px; margin:0 0 10px; }
  .mr-split { font-size:15px; line-height:1.5; color:var(--text); max-width:760px; margin:0; }
  .mr-sec { padding:28px 0 4px; }
  .mr h2 { font-family:inherit; font-size:clamp(22px,3vw,30px); font-weight:600; line-height:1.15; letter-spacing:-0.015em; text-transform:none; color:var(--text-head,#f5f5f7); margin:0 0 8px; }
  .mr-note { font-size:14px; color:var(--text-dim); margin:0 0 12px; max-width:760px; line-height:1.5; }
  .mr-movers { margin-top:24px; display:grid; grid-template-columns:1fr 1fr; gap:20px; max-width:980px; }
  .mr-movers ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .mr-mv { background:var(--ds-surface-2,#1d1d1f); border-radius:14px; padding:12px 16px; display:grid; grid-template-columns:minmax(0,1fr) auto; column-gap:12px; row-gap:4px; align-items:baseline; }
  .mr-mv-nm { font-size:15px; font-weight:600; color:var(--text-head,#f5f5f7); }
  .mr-mv b { font-size:20px; font-weight:600; text-align:right; }
  .mr-mv-d { grid-column:1/-1; font-size:13px; color:var(--text-dim); }
  .mr-eb { grid-column:1/-1; font-size:14px; color:var(--accent); min-height:40px; display:inline-flex; align-items:center; justify-self:start; }
  .mr .up { color:var(--green,#2bd17e); } .mr .dn { color:var(--red,#ff4d6a); }
  .mr-scroll { overflow-x:auto; max-width:980px; }
  .mr-tbl { width:100%; border-collapse:collapse; font-size:14px; }
  .mr-tbl th { text-align:right; font-size:12px; font-weight:600; color:var(--text-dim); padding:8px 10px; border-bottom:1px solid var(--ds-hairline,#2a2a2e); }
  .mr-tbl th:first-child, .mr-tbl td:first-child { text-align:left; }
  .mr-tbl td { text-align:right; padding:10px; border-bottom:1px solid var(--ds-hairline,#2a2a2e); color:var(--text); white-space:nowrap; }
  .mr-tbl td small { display:block; font-size:12px; color:var(--text-dim); }
  .mr-tbl td.mr-nm { white-space:normal; } .mr-tbl td.mr-nm a { color:var(--text-head,#f5f5f7); font-weight:600; min-height:24px; display:inline-block; }
  .mr-tbl td.mr-p { font-weight:600; } .mr-tbl td.mr-na { color:var(--text-dim); text-align:left; }
  .mr-src { font-size:13px; color:var(--text-dim); max-width:820px; line-height:1.6; margin:0 0 10px; }
  .mr-src a { color:var(--accent); }
  @media (max-width:600px) {
    .mr .container { padding:0 16px; }
    .mr-movers { grid-template-columns:1fr; }
    .mr-tbl { font-size:13px; } .mr-tbl td, .mr-tbl th { padding:8px 6px; }
  }
</style>`;

// shell: the sealed price page's head boilerplate, NAV and FOOTER (owned by build-nav.js / build-footer.js)
const shell = fs.readFileSync(path.join(ROOT, "pokemon-booster-box-prices.html"), "utf8");
const cut = (a, b) => { const i = shell.indexOf(a), j = shell.indexOf(b, i); if (i < 0 || j < 0) throw new Error("shell marker missing: " + a); return shell.slice(i, j + b.length); };
const base = cut("<style>", "</style>");   // the site's base page CSS (nav, hero, container), as every hand page carries it
const gtag = cut("  <!-- Google Analytics", "</script>");
const nav = cut("<!-- NAV:START -->", "<!-- NAV:END -->");
const foot = cut("<footer>", "</footer>");
const url = `https://www.shopcardhub.com/${SLUG}`;
const desc = `${answer} Every index's level at the first and last mark of ${monthName}, the biggest risers and fallers, and Bowman on its own.`;
const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>${esc(headline)} | ShopCardHub</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(headline)}">
  <meta property="og:description" content="${esc(answer)}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/default.png">
  <script type="application/ld+json">
  ${JSON.stringify(ld)}
  </script>
${base}
${gtag}
  <link rel="stylesheet" href="/css/site-fixes.css">
${CSS}
</head>
<body>

${nav}

<main class="mr">
${block}
</main>

${foot}

</body>
</html>
`;
const out = path.join(ROOT, SLUG + ".html");
if (DRY) console.log(block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 1600));
else fs.writeFileSync(out, page);
console.log(`market report ${label}: ${ok.length} of ${rows.length} indices with dated marks (${all.fell} fell, ${all.rose} rose, median ${pct(all.med)}) -> ${SLUG}.html${DRY ? " (dry)" : ""}`);
