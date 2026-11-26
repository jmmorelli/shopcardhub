#!/usr/bin/env node
// build-worth-now.mjs — the current sold marks on the hand-written "worth" pages (Build Loop, Nov 26 2026 · QUEUE Q-003,
// price lane exceptions 2026-11-16 → 11-23, filed four weeks running).
//
// Why: /gengar-ex-worth, /mega-darkrai-ex-worth, /charizard-ex-worth, /moonbreon-worth, /van-gogh-pikachu-worth and
// /pitch-black-set-guide printed October medians in their title, meta and first answer, 5–31% off the market. Those figures
// were typed. This tool owns them now: each lead answer is baked from the repo's marks files, dated, with its sale count.
//
// Sources (never typed, never an ask):
//   raw     data/feed/sold-marks.json (nightly sold feed: 30-day median, n30, feed day) for the card's path; else the ticker's
//           data/indices.json basket row when it stores n30 (price, n30, asOf).
//   graded  data/cards/g-<tk>.json psa10 / psa9 (30-day median m, n, asOf). A held or missing cell is left out, never guessed.
// A card with no raw mark carrying n prints no figure: the lead says so and points to the dated table (Q-003 fallback).
//
// Writes, per page: the lead between <!-- WORTH:NOW:START --> / <!-- WORTH:NOW:END --> (the first run wraps the page's
// p.q-answer, or the dated sentence in the PB guide's hero), plus the <title>, meta description, og:/twitter: title and
// description and the h1 figure where CONFIG gives a template. Idempotent. Re-run after a mark: node tools/build-worth-now.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const CHECK = process.argv.includes("--check");

const MS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (d) => { const [y, m, dd] = String(d).slice(0, 10).split("-"); return `${MS[+m - 1]} ${+dd}, ${y}`; };
const mon = (d) => { const [y, m] = String(d).slice(0, 10).split("-"); return `${MS[+m - 1]} ${y}`; };
const m2 = (v) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "$" + Math.round(v).toLocaleString("en-US");

const CONFIG = [
  { page: "gengar-ex-worth.html", tk: "AH26", num: "284", path: "pokemon-ascended-heroes/mega-gengar-ex-284",
    intro: "The Gengar ex people mean &mdash; Mega Gengar ex 284/217, the Special Illustration Rare from Ascended Heroes &mdash;",
    drop: [/<b>These comps are from Oct 2026 and the card has moved since\.<\/b> /] },
  { page: "mega-darkrai-ex-worth.html", tk: "PB26", num: "116", path: "pokemon-pitch-black/mega-darkrai-ex-116",
    intro: "The Mega Darkrai ex people mean &mdash; 116/084, the Special Illustration Rare from Pitch Black &mdash;",
    drop: [/ These comps are from October and the card has moved since: today's mark for 116\/084 is on (<a [^>]*>its card page<\/a>)\./] },
  { page: "charizard-ex-worth.html", tk: "SV151", num: "199", path: "pokemon-scarlet-&-violet-151/charizard-ex-199",
    intro: "A raw (ungraded) Charizard ex 199/165, the Special Illustration Rare from Pokémon 151,",
    drop: [/ These comps are from October and 199\/165 has moved since: today's mark is on (<a [^>]*>its card page<\/a>)\./],
    meta: (r) => `A raw Charizard ex 199/165 (Pokémon 151 SIR) sold for a ${m2(r.raw.m)} median across ${r.raw.n} sales in the 30 days to ${day(r.raw.d)}${r.p10 ? `; PSA 10 ${m2(r.p10.m)} (${r.p10.n} dated sales)` : ""}${r.p9 ? `, PSA 9 ${m2(r.p9.m)} (${r.p9.n})` : ""}. Eighteen Charizard ex cards priced from sold comps, plus the index each sits in.` },
  { page: "moonbreon-worth.html", tk: "EVS21", num: "215", path: "pokemon-evolving-skies/umbreon-vmax-215",
    intro: "Moonbreon &mdash; the Umbreon VMAX alternate art, 215/203, Evolving Skies &mdash;",
    title: (r) => `How Much Is Moonbreon Worth? ${m0(r.raw.m)} Raw${r.p10 ? `, ${m0(r.p10.m)} PSA 10` : ""} — Dated Sold Comps, ${mon(r.raw.d)}`,
    h1: (r) => `<em>${m0(r.raw.m)} raw</em>`,
    meta: (r) => `Moonbreon (Umbreon VMAX 215/203, Evolving Skies alt art) sold for a ${m2(r.raw.m)} median across ${r.raw.n} raw sales in the 30 days to ${day(r.raw.d)}${r.p10 ? `; PSA 10 ${m2(r.p10.m)} (${r.p10.n} dated sales)` : ""}${r.p9 ? `, PSA 9 ${m2(r.p9.m)} (${r.p9.n})` : ""}. Japanese, Korean and look-alike Umbreon VMAX cards priced from sold comps.` },
  { page: "van-gogh-pikachu-worth.html", tk: null, num: "085", path: null,
    intro: "Van Gogh Pikachu &mdash; Pikachu with Grey Felt Hat, SVP 085, the Van Gogh Museum promo &mdash;",
    title: () => "How Much Is Van Gogh Pikachu Worth? Dated Sold Comps, Raw and Graded",
    h1: () => "<em>by grade: dated comps below</em>",
    meta: () => "Van Gogh Pikachu (Pikachu with Grey Felt Hat, SVP 085) priced from dated sold comps, raw, PSA 10, PSA 9 and CGC 10. Sold comps, not asks." },
  { page: "pitch-black-set-guide.html", tk: "PB26", num: "116", path: "pokemon-pitch-black/mega-darkrai-ex-116", alt: { num: "120", path: "pokemon-pitch-black/mega-darkrai-ex-120" },
    hero: /The figures on this page were read on Sep 28, 2026: the Mega Darkrai ex SIR sold around \$184\.01 then, with the gold Mega Hyper Rare #120 below it at \$155\.03\./ },
];

const IDX = JSON.parse(read("data/indices.json"));
const FEED = JSON.parse(read("data/feed/sold-marks.json"));
const feedRaw = new Map((FEED.cards || []).filter((x) => x && x.cond === "Raw" && x.source === "sold").map((x) => [x.key, x]));
function rawOf(tk, num, p) {
  const f = p && feedRaw.get("sold:" + p);
  if (f && f.last > 0 && f.n30 >= 3) return { m: f.last, n: f.n30, d: FEED.day, src: "nightly sold feed" };
  const b = tk && (IDX[tk]?.basket || []).find((b) => String(b.num) === String(num));
  if (b && b.price > 0 && b.n30 >= 3 && !b.ptHold && !b.heldMove) return { m: b.price, n: b.n30, d: b.asOf, src: `${tk} index mark` };
  return null;
}
function gradedOf(tk, num) {
  const f = tk && path.join(REPO, `data/cards/g-${tk.toLowerCase()}.json`);
  if (!f || !fs.existsSync(f)) return {};
  const c = (JSON.parse(fs.readFileSync(f, "utf8")).cards || {})[String(num)]; if (!c) return {};
  const cell = (x) => x && x.m > 0 && x.n >= 3 && !x.held ? { m: x.m, n: x.n, d: c.asOf } : null;
  return { p10: cell(c.psa10), p9: cell(c.psa9) };
}
const S = "<!-- WORTH:NOW:START — current sold marks, generated by tools/build-worth-now.mjs from data/feed/sold-marks.json + data/cards/g-*.json. Do not hand-edit. -->";
const E = "<!-- WORTH:NOW:END -->";
const blockRe = /<!-- WORTH:NOW:START[\s\S]*?<!-- WORTH:NOW:END -->/;
const attr = (s) => s.replace(/&(?!(?:[a-z]+|#\d+);)/g, "&amp;").replace(/"/g, "&quot;");

let changed = 0;
for (const c of CONFIG) {
  const file = path.join(REPO, c.page); let html = fs.readFileSync(file, "utf8"); const before = html;
  const r = { raw: rawOf(c.tk, c.num, c.path), ...gradedOf(c.tk, c.num) };
  let inner;
  if (c.hero) {
    const a = rawOf(c.tk, c.alt.num, c.alt.path);
    inner = r.raw ? `On the ${day(r.raw.d)} sold marks, the Mega Darkrai ex SIR sells for a ${m2(r.raw.m)} raw median (${r.raw.n} sales, 30 days)${a ? `, with the gold Mega Hyper Rare #120 at ${m2(a.m)} (${a.n} sales)` : ""}.` : "The dated sold marks for every chase card are in the table below.";
  } else if (r.raw) {
    const g = r.p10 ? ` A PSA 10 sold for a <b>${m2(r.p10.m)}</b> median (${r.p10.n} dated sales in the 30 days to ${day(r.p10.d)})${r.p9 ? `; a PSA 9 for <b>${m2(r.p9.m)}</b> (${r.p9.n} dated sales)` : ""}.` : "";
    inner = `<p class="q-answer">${c.intro} sold for a <b>${m2(r.raw.m)}</b> median across ${r.raw.n} raw sales in the 30 days to ${day(r.raw.d)} (${r.raw.src}).${g}</p>`;
  } else {
    inner = `<p class="q-answer">${c.intro} is not in an index we mark yet, so this page prints no current figure. The table below holds its dated sold comps, raw and graded, with the dates they were read.</p>`;
  }
  const block = S + inner + E;
  if (blockRe.test(html)) html = html.replace(blockRe, () => block);
  else if (c.hero) { if (!c.hero.test(html)) throw new Error(c.page + ": hero sentence not found"); html = html.replace(c.hero, () => block); }
  else { const re = /<p class="q-answer">[\s\S]*?<\/p>/; if (!re.test(html)) throw new Error(c.page + ": p.q-answer not found"); html = html.replace(re, () => block); }
  for (const d of c.drop || []) html = html.replace(d, (m, a) => a ? ` Today's mark is also on ${a}.` : "");
  if (c.title) { const t = c.title(r); html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${t} | ShopCardHub</title>`).replace(/(<meta property="og:title" content=")[^"]*(")/, (x, a, b) => a + attr(t) + b).replace(/(<meta name="twitter:title" content=")[^"]*(")/, (x, a, b) => a + attr(t) + b); }
  if (c.meta) { const m = attr(c.meta(r)); html = html.replace(/(<meta name="description" content=")[^"]*(")/, (x, a, b) => a + m + b); }
  if (c.h1) html = html.replace(/(<h1>[^<]* is worth )(?:<em>[^<]*<\/em>)/, (x, a) => a + c.h1(r));
  if (!c.hero) {
    // the FAQ JSON-LD's first answer says what the lead says (plain text: no link, no eBay URL); the hero stamp dates both reads
    const plain = inner.replace(/<[^>]+>/g, "").replace(/&mdash;/g, "—").replace(/\s+/g, " ").trim();
    html = html.replace(/("acceptedAnswer":\{"@type":"Answer","text":")((?:[^"\\]|\\.)*)(")/, (x, a, t, b) => a + JSON.stringify(plain).slice(1, -1) + b);
    if (r.raw) html = html.replace(/<span data-prices-updated="[^"]*">(&#128337; )(?:Lead answer: sold marks to [^·]*· table: )?([^<]*)/, (x, ic, orig) =>
      `<span data-prices-updated="${String(r.raw.d).slice(0, 10)}">${ic}Lead answer: sold marks to ${day(r.raw.d)} · table: ${orig.charAt(0).toLowerCase() + orig.slice(1)}`);
  }
  if (html !== before) { changed++; if (!CHECK) fs.writeFileSync(file, html); }
  console.log(`${c.page}: ${r.raw ? `raw ${m2(r.raw.m)} n${r.raw.n} ${r.raw.d}` : "no raw mark (fallback)"}${r.p10 ? ` · PSA 10 ${m2(r.p10.m)} n${r.p10.n}` : ""}${r.p9 ? ` · PSA 9 ${m2(r.p9.m)} n${r.p9.n}` : ""}${html !== before ? " · written" : " · unchanged"}`);
}
if (CHECK && changed) { console.error(`worth-now: ${changed} page(s) out of date`); process.exit(1); }
