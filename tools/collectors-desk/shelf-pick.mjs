#!/usr/bin/env node
// shelf-pick.mjs — "Gengar's shelf", the one-card segment of the Tuesday Tape (Mo, Oct 5 2026: the Tape is "a lot of
// jargon … maybe we need to rethink what we are delivering every Tuesday"). One card a week from the Collector's Desk
// pages, in Gengar's words, with its dated sold mark and a link to OUR desk page (never ebay.com in email — EPN
// messaging rule, CoS desk Oct 1). Rotates deterministically by ISO week through every desk entry, so two runs in the
// same week print the same card and a re-run never repeats last week's.
//
//   node tools/collectors-desk/shelf-pick.mjs [--week 2026-W41] [--json]
//
// Output: the paragraph to paste under §2.5 of tools/tuesday-tape-format.md, plus the utm link. Prices are read from
// data/cards at run time (same marks as the desk page and the card page), so the number matches the site at send time.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const weekArg = args.includes("--week") ? args[args.indexOf("--week") + 1] : null;
const rd = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));

function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { year: t.getUTCFullYear(), week: Math.ceil(((t - y0) / 864e5 + 1) / 7) };
}
const wk = weekArg ? { year: +weekArg.slice(0, 4), week: +weekArg.slice(6) } : isoWeek(new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })));
const weekKey = `${wk.year}-W${String(wk.week).padStart(2, "0")}`;

// every (desk, entry, first print) in desk order; the starter shelf is skipped — the Tape's one card should be a card worth a sentence
const desks = fs.readdirSync(path.join(ROOT, "data/collect")).filter((n) => n.endsWith(".json")).map((n) => rd(`data/collect/${n}`)).sort((a, b) => a.deskNo - b.deskNo);
const pool = [];
for (const d of desks) for (const s of d.shelves) if (s.key !== "starter") for (const e of s.entries) if (e.prints && e.prints.length) pool.push({ desk: d, shelf: s, entry: e, print: e.prints[0] });
if (!pool.length) throw new Error("no desk entries");
// week-of-year seeded index, offset so Charizard's Base Set is week 41 of 2026 (the first Tape after the desks shipped)
const idx = ((wk.year - 2026) * 53 + wk.week - 41 + pool.length * 10) % pool.length;
const pick = pool[idx];

const tk = pick.print.id.split("-")[0];
const set = rd(`data/cards/${tk}.json`);
const cards = Array.isArray(set.cards) ? set.cards : Object.values(set.cards || {});
const c = cards.find((x) => x.id === pick.print.id);
let g = null; try { g = rd(`data/cards/g-${tk}.json`).cards[c.num] || null; } catch { g = null; }
const money = (x) => x == null ? null : x >= 1000 ? "$" + Math.round(x).toLocaleString("en-US") : "$" + x.toFixed(2);
const dateLong = (d) => { const [y, m, dd] = d.split("-").map(Number); return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); };
const p10 = g && g.psa10 && g.psa10.m != null ? g.psa10 : null;
const utm = `?utm_source=tape&utm_medium=email&utm_campaign=${new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })}`;
const deskUrl = `https://www.shopcardhub.com/${pick.desk.slug}${utm}`;
const cardUrl = `https://www.shopcardhub.com/card?id=${c.id}${utm.replace("?", "&")}`;

const why = String(pick.entry.why).replace(/<[^>]+>/g, "").split(/(?<=\.)\s+/).slice(0, 2).join(" ");
const mark = c.raw != null
  ? `Raw sold mark ${money(c.raw)} (${c.n30 ? `median of ${c.n30} sales, ` : ""}read ${dateLong(c.rawAsOf)})`
  : `No raw mark — it trades graded`;
const graded = p10 ? `; PSA 10 ${money(p10.m)} (median of ${p10.n} dated sales, ${p10.basis === "90d" ? "90 days" : "30 days"}, as of ${dateLong(g.asOf)})` : "";
const label = pick.entry.prints.length > 1 ? ` — ${pick.print.label}` : "";
const para = `**Gengar's shelf — ${pick.entry.title}${label}.** ${why} ${mark}${graded}. The full ${pick.desk.pokemon} desk, every print with its ladder: ${deskUrl}`;

if (JSON_OUT) console.log(JSON.stringify({ weekKey, idx, pool: pool.length, desk: pick.desk.slug, entry: pick.entry.title, card: c.id, raw: c.raw, rawAsOf: c.rawAsOf, psa10: p10 ? p10.m : null, deskUrl, cardUrl, paragraph: para }, null, 2));
else { console.log(`# Gengar's shelf · ${weekKey} · pick ${idx + 1}/${pool.length}\n`); console.log(para); console.log(`\nCard page: ${cardUrl}`); }
