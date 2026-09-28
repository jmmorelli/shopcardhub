#!/usr/bin/env node
// build-release-calendar.mjs — bakes /release-calendar from data/releases.json (Sep 26 2026).
//
// Why: Bing Webmaster (read Sep 26) shows the site's search demand is release-date queries —
// "pokemon 30th anniversary set release date" (109 impressions in 17 days), "2026 bowman football
// release date", "topps definitive basketball" — and those spike for ~2 weeks around each street
// date, then die. One page that answers every one of them, dated and sourced, with the sealed
// product on eBay beside each row, is the cheapest traffic engine the site has. It reuses the
// same hand-curated rows the home panel renders (never a guessed day), so nothing new is claimed.
//
// Sections: This week (next 7 days) · Next 30 days · Later · Just released (past 30 days).
// Rows: date · product (guide link when we have one) · family/sport · status · note ·
//       "Sealed on eBay →" (customid release-<slug>) · "Guide →" when href exists.
//
// Runs in the nightly Action after build-home; idempotent between RELEASES markers.
// Usage: node tools/build-release-calendar.mjs [--check] [--today YYYY-MM-DD]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ebaySearchUrl, assertClean } from "./lib/epn.mjs";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const TODAY = args.includes("--today") ? args[args.indexOf("--today") + 1] : new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const START = "<!-- RELEASES:START -->", END = "<!-- RELEASES:END -->";
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const days = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);
const slug = (s) => String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

// Fanatics (Impact) search link on Topps/Bowman rows — Sep 28 2026 (Mo, Sep 27 "go time"; ideas 2026-09-27 note 3).
// Same program + deep-link shape as build-buy-strip.mjs. A LINK ONLY: no Fanatics price or stock claim is rendered.
// eBay stays the gold primary button (R11); subId1 = the row's own id (release-<slug>), as on the strips.
const FAN_BASE = "https://fanatics.93n6tx.net/c/7388044/4029520/9663";
const fan = (q, sub) => FAN_BASE + "?u=" + encodeURIComponent("https://www.fanatics.com/?query=" + encodeURIComponent(q)) + "&subId1=" + encodeURIComponent(sub);
const fanQ = (r) => (r.family !== "pokemon" && /\b(topps|bowman)\b/i.test(r.label || "")) ? String(r.label).split(" — ")[0].replace(/^20\d\d(-\d\d)?\s+/, "").trim() : null;

const data = JSON.parse(fs.readFileSync(path.join(REPO, "data/releases.json"), "utf8"));
const pageFile = path.join(REPO, "release-calendar.html");
const html = fs.readFileSync(pageFile, "utf8");
const exists = (href) => href && fs.existsSync(path.join(REPO, href.replace(/^\//, "").replace(/#.*$/, "") + ".html"));

const items = (data.items || []).filter((r) => r.date).slice().sort((a, b) => a.date.localeCompare(b.date));
const row = (r) => {
  const d = new Date(r.date + "T12:00:00Z");
  const dt = r.status === "expected" && r.window ? `<span class="rc-dt" style="font-size:14px">${esc(r.window)}<small>expected window</small></span>` : `<span class="rc-dt">${MON[d.getUTCMonth()]} ${d.getUTCDate()}<small>${DOW[d.getUTCDay()]} · ${d.getUTCFullYear()}</small></span>`;
  const q = r.q || `${r.label} hobby box`;
  const cid = "release-" + slug(r.label);
  const buy = assertClean(ebaySearchUrl({ q, customid: cid, sacat: r.cat ? String(r.cat) : null }));
  const href = exists(r.href) ? r.href : null;
  const lab = href ? `<a href="${esc(href)}">${esc(r.label)}</a>` : esc(r.label);
  const st = r.status === "confirmed" ? "" : r.status === "reported" ? `<span class="st">reported, not yet on the maker's calendar</span>` : r.status === "expected" ? `<span class="st">expected window, no day</span>` : "";
  const note = [st, r.note ? esc(r.note) : ""].filter(Boolean).join(" · ");
  return `<div class="rc-row" data-date="${esc(r.date)}">${dt}<div><div class="rc-lab"><span class="rc-fam ${esc(r.family || "")}">${esc(r.sport || (r.family === "pokemon" ? "PKMN" : ""))}</span>${lab}</div>${note ? `<div class="rc-note">${note}</div>` : ""}</div><div class="rc-act">${href ? `<a class="rc-guide" href="${esc(href)}">Guide &rarr;</a>` : ""}<a class="rc-buy" href="${buy}" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag==='function')gtag('event','buystrip_click',{item:'${esc(cid)}',page:location.pathname})">Sealed on eBay &rarr;</a>${fanQ(r) ? `<a class="rc-fan" href="${esc(fan(fanQ(r), cid))}" target="_blank" rel="noopener sponsored" title="A fanatics.com search, not a price" onclick="if(typeof gtag==='function')gtag('event','fanatics_click',{item:'${esc(cid)}',page:location.pathname})">At Fanatics &rarr;</a>` : ""}</div></div>`;
};
const sec = (title, sub, rows, empty) => `<section class="rc-sec"><h2>${title}${sub ? ` <b>·</b> <span style="letter-spacing:1px;text-transform:none;font-family:var(--fm);font-size:11px;">${sub}</span>` : ""}</h2>${rows.length ? rows.map(row).join("\n") : `<div class="rc-empty">${empty}</div>`}</section>`;

const week = items.filter((r) => { const n = days(TODAY, r.date); return n >= 0 && n <= 7; });
const month = items.filter((r) => { const n = days(TODAY, r.date); return n > 7 && n <= 30; });
const later = items.filter((r) => days(TODAY, r.date) > 30);
const past = items.filter((r) => { const n = days(TODAY, r.date); return n < 0 && n >= -30; }).reverse();
const src = Object.entries(data.sources || {}).map(([k, v]) => `<b>${esc(k)}</b> — ${esc(v)}`).join("<br>");
const block = `${START}
${sec("This week", `${TODAY} → +7 days`, week, "Nothing dated in the next seven days on the calendars we read.")}
${sec("Next 30 days", "", month, "Nothing further dated inside 30 days.")}
${sec("Later in 2026", "", later, "Nothing dated beyond 30 days yet.")}
${sec("Just released", "last 30 days — the singles are printing, the sealed asks are settling", past, "No release in the last 30 days.")}
<p class="rc-src">"Sealed on eBay" is a live eBay search; "At Fanatics" (Topps and Bowman rows) is a fanatics.com search. ShopCardHub earns an affiliate commission on qualifying purchases from either. No Fanatics price or stock is shown here.</p>
<p class="rc-src"><b>Sources</b> (as of ${esc(data.asOf || TODAY)}; page baked ${esc(TODAY)}):<br>${src}</p>
${END}`;
const a = html.indexOf(START), b = html.indexOf(END);
if (a === -1 || b === -1) throw new Error("release-calendar.html: RELEASES markers missing");
let next = html.slice(0, a) + block + html.slice(b + END.length);
next = next.replace(/<div class="rc-meta" data-rc-asof>[^<]*<\/div>/, `<div class="rc-meta" data-rc-asof data-prices-updated="${esc(TODAY)}">${week.length + month.length + later.length} dated releases ahead · ${past.length} in the last 30 days · baked ${esc(TODAY)}</div>`);
if (next !== html) { if (CHECK) { console.log("check: release-calendar.html stale"); process.exit(1); } fs.writeFileSync(pageFile, next); console.log(`release-calendar: ${week.length} this week · ${month.length} next 30d · ${later.length} later · ${past.length} just released (today ${TODAY})`); }
else console.log("release-calendar: unchanged");
