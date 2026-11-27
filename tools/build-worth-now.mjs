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
    table: { oct: "Oct 8, 2026", rows: {
      "Charizard ex 199/165": ["SV151", "199", "pokemon-scarlet-&-violet-151/charizard-ex-199"],
      "Charizard ex 183/165": ["SV151", "183", "pokemon-scarlet-&-violet-151/charizard-ex-183"],
      "Charizard ex 006/165": ["SV151", "6", "pokemon-scarlet-&-violet-151/charizard-ex-6"],
      "Mega Charizard X ex 125/094": ["PF25", "125", "pokemon-phantasmal-flames/mega-charizard-x-ex-125"],
      "Mega Charizard X ex 130/094": ["PF25", "130", "pokemon-phantasmal-flames/mega-charizard-x-ex-130"],
      "Mega Charizard Y ex 294/217": ["AH26", "294", "pokemon-ascended-heroes/mega-charizard-y-ex-294"] } },
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

// Q-055 / O-123 (CoS option 1): the dated table on /charizard-ex-worth. Rows whose card has a marks file get their cells baked
// from the same sources as the lead (raw: feed or index mark; graded: g-<tk>.json), each inside <!-- WORTH:CELL --> sub-markers.
// A cell with no clean mark keeps its dated Oct 8 read; a cell this tool baked before that loses its mark prints "Re-read".
// The tool also owns the table stamp, the raw-method sentence, the disclaimer's source sentence and the two "highest" notes.
const CS = "<!-- WORTH:CELL:START -->", CE = "<!-- WORTH:CELL:END -->";
const md = (d) => day(d).replace(/, \d{4}$/, "");
function bakeTable(html, t) {
  let marked = 0, rawDays = [], gDays = [];
  html = html.replace(/<tr>\s*<td><span class="roi-name">([^<]*)<\/span>[\s\S]*?<\/tr>/g, (tr, name) => {
    const k = t.rows[name.trim()]; if (!k) return tr;
    const [tk, num, p] = k; const raw = rawOf(tk, num, p); const g = gradedOf(tk, num);
    const cells = [raw && { m: raw.m, sub: `median of ${raw.n} sales, 30 days to ${md(raw.d)}`, d: raw.d },
      g.p10 && { m: g.p10.m, sub: `median of ${g.p10.n} dated sales, 30 days to ${md(g.p10.d)}`, d: g.p10.d },
      g.p9 && { m: g.p9.m, sub: `median of ${g.p9.n} dated sales, 30 days to ${md(g.p9.d)}`, d: g.p9.d }];
    let i = -1, any = false;
    const out = tr.replace(/<td>((?:(?!<\/td>)[\s\S])*)<\/td>/g, (td, inner) => {
      i++; if (i < 1 || i > 3) return td;
      const c = cells[i - 1], was = inner.startsWith(CS);
      if (c) { any = true; (i === 1 ? rawDays : gDays).push(String(c.d).slice(0, 10));
        return `<td>${CS}<span class="roi-price">${m2(c.m)}</span><span class="roi-sub">${c.sub}</span>${CE}</td>`; }
      return was ? `<td>${CS}<span class="roi-sub nosale">Re-read</span>${CE}</td>` : td;
    });
    if (any) marked++;
    return out;
  });
  const total = (html.match(/<span class="roi-name">/g) || []).length;
  const last = (a) => a.sort().slice(-1)[0];
  const rd = last(rawDays), gd = last(gDays);
  const tableStamp = marked ? `${marked} rows on sold marks to ${day(rd)}${total - marked ? `, ${total - marked} rows sold comps of ${t.oct}` : ""}` : `sold comps of ${t.oct}`;
  html = html.replace(/(<span data-prices-updated="[^"]*">&#128337; Lead answer: sold marks to [^·]*· table: )[^<]*/, (x, a) => a + tableStamp);
  html = html.replace(/(<p class="section-intro">)(?:<!-- WORTH:METHOD:START -->[\s\S]*?<!-- WORTH:METHOD:END -->|Raw is the median of sales in the last 30 days, taken from the most recent 30 that PriceCharting lists\.)/,
    (x, a) => a + `<!-- WORTH:METHOD:START -->Raw is the median of sales in the last 30 days as PriceCharting lists them; the rows dated ${t.oct.replace(/, \d{4}$/, "")} used the most recent 30.<!-- WORTH:METHOD:END -->`);
  const names = Object.keys(t.rows).map((n) => n.replace(/^.* /, "")).join(", ");
  html = html.replace(/(<p class="disclaimer">)(?:<!-- WORTH:SRC:START -->[\s\S]*?<!-- WORTH:SRC:END -->|Every figure on this page is one of our sold comps &mdash; a completed eBay sale as listed by PriceCharting, read Oct 8, 2026 &mdash; shown with its count and its dates\.)/,
    (x, a) => a + `<!-- WORTH:SRC:START -->Every figure on this page is a median of completed eBay sales as listed by PriceCharting, shown with its count and its dates.${marked ? ` The rows for ${names} come from our sold marks (raw to ${day(rd)}${gd ? `, graded to ${day(gd)}` : ""}); the other rows were read ${t.oct}.` : ` Read ${t.oct}.`}<!-- WORTH:SRC:END -->`);
  // the two "highest on this page" notes follow the printed cells
  const NOTES = [" &middot; the highest raw price on this page", " &middot; the highest PSA 10 price on this page"];
  for (const n of NOTES) html = html.split(n).join("");
  const rows = [...html.matchAll(/<tr>\s*<td><span class="roi-name">([^<]*)<\/span>[\s\S]*?<\/tr>/g)].map((m) => {
    const tds = [...m[0].matchAll(/<td>((?:(?!<\/td>)[\s\S])*)<\/td>/g)].map((x) => x[1]);
    const v = (s) => { const q = /<span class="roi-price">\$([\d,.]+)<\/span>/.exec(s || ""); return q ? +q[1].replace(/,/g, "") : -1; };
    return { name: m[1], raw: v(tds[1]), p10: v(tds[2]) };
  });
  const top = (key) => rows.reduce((a, b) => (b[key] > a[key] ? b : a));
  for (const [key, n] of [["raw", NOTES[0]], ["p10", NOTES[1]]]) {
    const r = top(key); const re = new RegExp(`(<span class="roi-name">${r.name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}<\/span><span class="roi-sub">)((?:(?!<\\/span>)[^])*)`);
    html = html.replace(re, (x, a, b) => a + b + n);
  }
  return html;
}

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
  if (c.table) html = bakeTable(html, c.table);
  if (html !== before) { changed++; if (!CHECK) fs.writeFileSync(file, html); }
  console.log(`${c.page}: ${r.raw ? `raw ${m2(r.raw.m)} n${r.raw.n} ${r.raw.d}` : "no raw mark (fallback)"}${r.p10 ? ` · PSA 10 ${m2(r.p10.m)} n${r.p10.n}` : ""}${r.p9 ? ` · PSA 9 ${m2(r.p9.m)} n${r.p9.n}` : ""}${html !== before ? " · written" : " · unchanged"}`);
}
if (CHECK && changed) { console.error(`worth-now: ${changed} page(s) out of date`); process.exit(1); }
