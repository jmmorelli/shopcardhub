#!/usr/bin/env node
// build-rail.mjs — the terminal's left rail, generated (Terminal step 2, Sep 11 2026).
//
// Reads data/rail.json (sections, order, labels) + data/nav.json (the Guides groups) and rewrites
// the region between <!-- RAIL:START --> and <!-- RAIL:END --> on every page that carries the
// markers (today: index.html). Idempotent — re-run after editing either JSON file.
// Every href is a site path that exists in nav.json or one of / /watchlist /indices /auctions
// (hash fragments allowed) — tools/audit-terminal.mjs rail-single-source enforces it.
// Portfolios rows are filled client-side by js/home.js from the Vault mirror (read-only);
// the build leaves them as "—" so the page is honest with JS off.
//
// Usage:  node tools/build-rail.mjs          node tools/build-rail.mjs --dry

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const rail = JSON.parse(read("data/rail.json"));
const nav = JSON.parse(read("data/nav.json"));
// pills from the data files (Terminal step 4): board = the tracked 1st Bowman Chrome autos, indices = every ticker in indices.json
let boardN = null, indicesN = null;
try { const wl = JSON.parse(read("data/watchlist.json")); boardN = (wl.cards || []).filter((c) => c && c.source === "ebay" && c.cardType === "chrome-auto" && !c.boardHide).length; } catch {}
try { const idx = JSON.parse(read("data/indices.json")); indicesN = Object.keys(idx).filter((k) => k !== "_comment" && k !== "updated" && idx[k] && typeof idx[k] === "object").length; } catch {}
const PILLS = { board: boardN == null ? null : String(boardN), indices: indicesN == null ? null : String(indicesN) };
const allowed = new Set(["/", "/watchlist", "/indices", "/auctions"]);
for (const m of JSON.stringify(nav).matchAll(/"href"\s*:\s*"([^"]+)"/g)) allowed.add(m[1].split("#")[0]);
const check = (h) => { const p = h.split("#")[0].split("?")[0].replace(/\/$/, "") || "/"; if (!p.startsWith("/") || !allowed.has(p)) throw new Error(`rail href ${h} is not a nav.json path`); return h; };

const item = (href, label, ico, pill, extra) => `      <a class="rl${extra ? " " + extra : ""}" href="${esc(check(href))}"${extra === "sc" ? ` data-screen="${esc(href.split("screen=")[1] || "")}"` : ""}><span class="ico">${esc(ico || "")}</span><span class="lbl">${esc(label)}</span>${pill ? `<span class="pill">${esc(pill)}</span>` : ""}</a>`;

const navRows = rail.nav.map((n) => item(n.href, n.label, n.ico, n.pill === "board" || n.pill === "indices" ? PILLS[n.pill] : n.pill));
const cats = nav.categories.filter((c) => rail.guides.guideCategories.includes(c.label));
const guides = cats.map((c, i) => `      <details class="rl-grp"${i === 0 ? "" : ""}>
        <summary class="rl"><span class="ico">▸</span><span class="lbl">${esc(c.label)}</span><span class="pill">${c.groups.reduce((n, g) => n + g.links.filter((l) => !l.allLink).length, 0)}</span></summary>
${c.groups.map((g) => `        <div class="rl-glabel">${esc(g.label)}</div>\n` + g.links.filter((l) => !l.allLink).map((l) => `        <a class="rl sub" href="${esc(check(l.href))}"><span class="lbl">${esc(l.label)}</span></a>`).join("\n")).join("\n")}
        <a class="rl sub all" href="${esc(check(c.href))}"><span class="lbl">All ${esc(c.label)} →</span></a>
      </details>`);
const pfCfg = { rows: rail.portfolios.rows, vaultHref: check(rail.portfolios.vaultHref), empty: rail.portfolios.empty };
const pfRows = rail.portfolios.rows.map((r) => `      <a class="rl pf" href="${esc(pfCfg.vaultHref)}" data-status="${esc(r.status)}"><span class="ico">${esc(r.ico)}</span><span class="lbl">${esc(r.label)}</span><span class="pill">—</span></a>`).join("\n") +
  `\n      <a class="rl pf-empty" href="${esc(pfCfg.vaultHref)}"><span class="ico">→</span><span class="lbl">${esc(rail.portfolios.empty)}</span></a>`;
const screens = rail.screens.rows.map((s) => item(`/#screen=${s.id}`, s.label, "⌁", null, "sc"));

const block = `<!-- RAIL:START -->
<aside class="rail" id="rail" aria-label="Terminal rail">
  <nav class="rl-sec" aria-label="Terminal">
${navRows.join("\n")}
  </nav>
  <div class="rl-sec rl-guides">
    <h4>${esc(rail.guides.label)} <a href="${esc(check(rail.guides.allHref))}">all →</a></h4>
    <a class="rl rl-guides-chip" href="${esc(check(rail.guides.allHref))}"><span class="ico">✎</span><span class="lbl">${esc(rail.guides.label)}</span></a>
${guides.join("\n")}
  </div>
  <div class="rl-sec">
    <h4>${esc(rail.portfolios.label)} <a href="${esc(pfCfg.vaultHref)}">Vault →</a></h4>
    <div data-rail="portfolios" data-cfg="${esc(JSON.stringify(pfCfg))}">
${pfRows}
    </div>
  </div>
  <div class="rl-sec">
    <h4>${esc(rail.screens.label)}</h4>
${screens.join("\n")}
  </div>
  <div class="rail-foot">${esc(rail.foot)}</div>
</aside>
<script>
/* rail: mark the row for THIS page (the block is byte-identical on every page, so the active state is read from the URL) */
(function () {
  var here = location.pathname; if (here.slice(-5) === ".html") here = here.slice(0, -5); if (here.length > 1 && here.slice(-1) === "/") here = here.slice(0, -1); if (here === "/index") here = "/";
  var rows = document.querySelectorAll('#rail .rl-sec a.rl');
  for (var i = 0; i < rows.length; i++) {
    var h = rows[i].getAttribute("href") || ""; if (h.indexOf("#") > 0 || h.charAt(0) === "#") continue;
    var p = h; if (p.length > 1 && p.slice(-1) === "/") p = p.slice(0, -1);
    if (p === here) rows[i].classList.add("on");
  }
})();
</script>
<!-- RAIL:END -->`;

let n = 0;
for (const f of fs.readdirSync(REPO).filter((x) => x.endsWith(".html"))) {
  const html = read(f);
  if (!/<!-- RAIL:START -->[\s\S]*?<!-- RAIL:END -->/.test(html)) continue;
  const out = html.replace(/<!-- RAIL:START -->[\s\S]*?<!-- RAIL:END -->/, block);
  if (!DRY && out !== html) fs.writeFileSync(path.join(REPO, f), out);
  n++;
  console.log(`${f}: rail ${DRY ? "would be " : ""}${out === html ? "unchanged" : "rewritten"} (${rail.nav.length} nav · ${cats.length} guide groups · ${rail.screens.rows.length} screens)`);
}
if (!n) console.log("no page carries <!-- RAIL:START --> … <!-- RAIL:END --> yet — add the markers to index.html first");
