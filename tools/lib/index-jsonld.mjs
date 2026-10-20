// index-jsonld.mjs — E7 GEO slice 2 (approved Oct 5 2026): Dataset + Organization JSON-LD for every index page and
// a DataCatalog on /indices, all from data/indices.json. dateModified = the ticker's last mark (never the build day).
// Baked between <!-- LD:<TK>:START --> … END markers just before </head>, so a re-mark (build-sector-index.mjs bake)
// or tools/build-index-jsonld.mjs refreshes it in place. Entity name: "ShopCardHub <Set> Index (TICKER)".
const SITE = "https://www.shopcardhub.com";
export const ORG = { "@type": "Organization", "@id": SITE + "/#org", name: "ShopCardHub", url: SITE + "/", sameAs: ["https://x.com/shopcardhub"] };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (s) => { const [y, m, d] = s.split("-").map(Number); return `${MON[m - 1]} ${d}, ${y}`; };
const fmtMonth = (s) => { const [y, m] = s.split("-").map(Number); return `${MON[m - 1]} ${y}`; };
const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");

export function lastMark(t) {
  const h = (t.history || []).filter((r) => r && r.date && typeof r.level === "number");
  return h.length ? h[h.length - 1] : null;
}
export function entity(t) {
  const set = (t.set || t.name || t.ticker).replace(/\s+Set Index$/i, "");
  return `ShopCardHub ${set} Index (${t.ticker})`;
}
export function liveTickers(idx) {
  return Object.values(idx).filter((v) => v && typeof v === "object" && v.ticker && v.page && v.status === "live" && lastMark(v));
}
function dataset(t) {
  const m = lastMark(t);
  const first = (t.history || []).find((r) => r && r.date);
  const n = m.priced ?? (t.basket || []).length;
  const basis = t.basis === "sold" ? "sold prices" : t.basis ? `${t.basis} prices` : "prices";
  const base = t.baseDate ? `100 = ${fmtMonth(t.baseDate)}` : "base 100";
  const cost = typeof m.basketValue === "number" ? `; one raw copy of each card cost about ${usd(m.basketValue)}` : "";
  return {
    "@type": "Dataset",
    "@id": SITE + t.page + "#dataset-" + t.ticker.toLowerCase(),
    name: entity(t),
    alternateName: t.ticker,
    description: `${entity(t)} stood at ${m.level} on ${fmtDate(m.date)} (${base}), across ${n} cards on ${basis}${cost}. Source: ${t.basisLabel || "ShopCardHub marks"}.`,
    url: SITE + t.page,
    creator: { "@id": ORG["@id"] },
    publisher: { "@id": ORG["@id"] },
    isAccessibleForFree: true,
    dateModified: m.date,
    temporalCoverage: `${(first && first.date) || m.date}/${m.date}`,
    variableMeasured: [{ "@type": "PropertyValue", name: "Index level", value: m.level, description: base }],
  };
}
const tag = (key, obj) => `<!-- LD:${key}:START -->\n<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": obj })}</script>\n<!-- LD:${key}:END -->`;
function put(html, key, block) {
  const re = new RegExp(`<!-- LD:${key}:START -->[\\s\\S]*?<!-- LD:${key}:END -->`);
  if (re.test(html)) return html.replace(re, () => block);
  if (!html.includes("</head>")) throw new Error(`no </head> for LD:${key}`);
  return html.replace("</head>", () => block + "\n</head>");
}
export function applyIndexLd(html, t) {
  return put(html, t.ticker, tag(t.ticker, [ORG, dataset(t)]));
}
export function applyCatalogLd(html, idx) {
  const live = liveTickers(idx).sort((a, b) => a.ticker.localeCompare(b.ticker));
  const last = live.map((t) => lastMark(t).date).sort().pop();
  const cat = { "@type": "DataCatalog", "@id": SITE + "/indices#catalog", name: "ShopCardHub price indices", url: SITE + "/indices", publisher: { "@id": ORG["@id"] }, dateModified: last,
    description: `${live.length} card price indices for Pokémon TCG sets and Bowman 1st autos. Each one is the cost of one copy of every card in a set, set to 100 at a base month and re-marked on dated sold prices.`,
    dataset: live.map((t) => ({ "@type": "Dataset", "@id": SITE + t.page + "#dataset-" + t.ticker.toLowerCase(), name: entity(t), url: SITE + t.page, dateModified: lastMark(t).date })) };
  return put(html, "CATALOG", tag("CATALOG", [ORG, cat]));
}

// E7 slice 3 (approved Oct 5 2026): one answer sentence at the top of every index page — level, date, sample size,
// source — baked into the hero line (.sidx-sub). It REPLACES that line's opening clause ("All N cards of X, priced
// from dated sold comps and re-marked Monday and Thursday."), it never adds a line. Marked <!-- ANS:<TK> --> … <!-- /ANS:<TK> -->
// so build-index-jsonld.mjs and the build-sector-index.mjs bake hook refresh it in place after any mark.
// HOLD: tickers listed here keep the old clause. Empty since 2026-10-20 (CoS desk): SK03 lifted — Pokémon KB P14 closed,
// the disputed $34,100 #146 sale is out of the Oct 19 mark (#146 = $6,050, 1 dated sale, thin).
export const ANSWER_HOLD = new Set([]);
export function answerSentence(t) {
  const m = lastMark(t);
  const n = m.priced ?? (t.basket || []).length;
  const set = (t.set || t.name || t.ticker).replace(/^Pokémon TCG /, "").replace(/\s+Set Index$/i, "");
  const base = t.baseDate ? ` (${fmtMonth(t.baseDate)} = 100)` : "";
  const lv = typeof m.level === "number" ? m.level.toFixed(2) : m.level;
  const src = /PriceCharting/i.test(t.basisLabel || "") ? "eBay sold prices read on PriceCharting" : "dated sold prices";
  const cost = typeof m.basketValue === "number" ? `, and one raw copy of each of the ${n} cards it prices cost about ${usd(m.basketValue)} at ${src}` : `, across ${n} cards at ${src}`;
  return `On ${fmtDate(m.date)} the ${set} index (${t.ticker}) stood at ${lv}${base}${cost}. It is re-marked every Monday and Thursday.`;
}
export function applyIndexAnswer(html, t) {
  if (ANSWER_HOLD.has(t.ticker)) return html;
  const tk = t.ticker;
  const block = `<!-- ANS:${tk} -->${answerSentence(t)}<!-- /ANS:${tk} -->`;
  const marked = new RegExp(`<!-- ANS:${tk} -->[\\s\\S]*?<!-- /ANS:${tk} -->`);
  if (marked.test(html)) return html.replace(marked, () => block);
  const raw = /(<p class="sidx-sub">)([^<]*?re-marked Monday and Thursday\.)/;
  if (!raw.test(html)) return html; // page without the standard hero line: leave it alone (reported by --check as skipped)
  return html.replace(raw, (_, p) => p + block);
}
