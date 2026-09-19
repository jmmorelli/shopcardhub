#!/usr/bin/env node
// football-solds.mjs — dated SOLD comps for football cards, free, no login.
//
// WHY THIS EXISTS (2026-09-19, CoS). Football was the only sport on this site with
// no live price anywhere: zero engine slugs, no ticker, no card in the nightly feed.
// The obvious fix — put football in the nightly ask engine — does not work, and the
// reason is worth recording so nobody re-proposes it: the 2026 rookie class trades
// at $1.44–$3.99 on dated sales, and snapshot-free.mjs rejects any listing under $3
// as "no usable price". An ask engine with a $3 floor cannot see this market at all.
//
// What DOES work: PriceCharting's public item pages carry their completed-auction
// rows in the HTML, unauthenticated — the same finding that unblocked the SV151
// screen on 2026-09-17. Their football coverage includes 2026 Topps Flagship and its
// 1991 35th Anniversary insert sets. So football gets SOLD comps rather than asks,
// which is better than what most of the site runs on, not worse.
//
// METHOD, and its one important limit. Each item page shows a capped list of recent
// sold rows (30 in practice on the ungraded tab). A read returning 30 therefore means
// "the 30 most recent", NOT "30 in the window" — the date range and the site's own
// volume line are what tell you how fast they accumulated. A read returning fewer
// than 30 is a complete count. Every consumer of this file must publish the count and
// the window beside the median, the way /nfl-rookie-cards-2026 does. (Same censoring
// property disclosed for SV151: a capped count is not a volume measure.)
//
// GRADED FIGURES ARE DELIBERATELY NOT EMITTED. PriceCharting's grade columns are a
// ladder, partly modelled — the 2026-09-16 graded-ladder incident. The graded tabs on
// these football items carry ZERO dated rows, checked this run, so there is nothing
// honest to publish and every football page reads "No verified sale" at every grade.
//
// Usage: node tools/football-solds.mjs [--out data/football-solds-<date>.json]

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const PAUSE = 1600; // PriceCharting 429s ~4 workers after ~150 pages; one worker, polite gap.

// The tracked football universe. Add a card here, re-run, and every page that reads
// the output file gets it. `page` is the site page that publishes it.
const CARDS = [
  { id: "mendoza-flagship-301",   label: "Fernando Mendoza — 2026 Topps Flagship RC #301",              team: "Las Vegas Raiders",  page: "/fernando-mendoza-rookie-cards", pc: "football-cards-2026-topps-flagship/fernando-mendoza-301" },
  { id: "mendoza-91tr-1",         label: "Fernando Mendoza — 2026 Topps Flagship 1991 35th RC #91TR-1", team: "Las Vegas Raiders",  page: "/fernando-mendoza-rookie-cards", pc: "football-cards-2026-topps-flagship-1991-rookie/fernando-mendoza-91tr-1" },
  { id: "mendoza-real-one-91tr-1",label: "Fernando Mendoza — 2026 Topps Flagship Real One Rookie Auto #91TR-1 /91", team: "Las Vegas Raiders", page: "/nfl-rookie-cards-2026", pc: "football-cards-2026-topps-flagship-1991-rookie/fernando-mendoza-the-real-one-91tr-1" },
  { id: "tate-flagship-318",      label: "Carnell Tate — 2026 Topps Flagship RC #318",                  team: "Tennessee Titans",   page: "/nfl-rookie-cards-2026", pc: "football-cards-2026-topps-flagship/carnell-tate-318" },
  { id: "tate-91tr-18",           label: "Carnell Tate — 2026 Topps Flagship 1991 35th RC #91TR-18",    team: "Tennessee Titans",   page: "/best-football-cards-under-50", pc: "football-cards-2026-topps-flagship-1991-rookie/carnell-tate-91tr-18" },
  { id: "love-flagship-309",      label: "Jeremiyah Love — 2026 Topps Flagship RC #309",                team: "Arizona Cardinals",  page: "/nfl-rookie-cards-2026", pc: "football-cards-2026-topps-flagship/jeremiyah-love-309" },
  { id: "love-91tr-9",            label: "Jeremiyah Love — 2026 Topps Flagship 1991 35th RC #91TR-9",   team: "Arizona Cardinals",  page: "/best-football-cards-under-50", pc: "football-cards-2026-topps-flagship-1991-rookie/jeremiyah-love-91tr-9" },
  { id: "bailey-flagship-343",    label: "David Bailey — 2026 Topps Flagship RC #343",                  team: "New York Jets",      page: "/nfl-rookie-cards-2026", pc: "football-cards-2026-topps-flagship/david-bailey-343" },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length;
  return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    // 429 is the documented rate limit; a 403 here is transient (seen once on a cold
    // first request, 2026-09-19) and clears on the same back-off, so treat them alike.
    if (r.status === 429 || r.status === 403) { await sleep(5000 * attempt); continue; }
    if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
    return await r.text();
  }
  throw new Error(url + " -> 429 after 3 attempts");
}

// The ungraded completed-sales tab. Bound the slice to the NEXT completed-auctions-
// div: the class name also appears earlier in the tab <select>, so a naive indexOf
// pair returns an empty slice (cost one debugging pass — left here as a warning).
function soldRows(html, cls = "used") {
  const open = html.indexOf(`<div class="completed-auctions-${cls}"`);
  if (open < 0) return [];
  const next = html.indexOf('<div class="completed-auctions-', open + 10);
  const seg = html.slice(open, next > 0 ? next : html.length);
  const out = [];
  for (const m of seg.matchAll(/<tr id="ebay-[^"]*">([\s\S]*?)<\/tr>/g)) {
    const row = m[1];
    const d = /<td class="date">\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(row);
    const p = /\$([0-9,]+\.[0-9]{2})/.exec(row);
    const t = /class="js-ebay-completed-sale"[^>]*>\s*([^<]+)/.exec(row);
    if (d && p) out.push({ date: d[1], price: +p[1].replace(/,/g, ""), title: (t ? t[1].trim() : "") });
  }
  return out;
}

const volumeOf = h => {
  const m = /data-show-tab="completed-auctions-used">[\s\S]*?<a href="#">([^<]+)<\/a>/.exec(h);
  return m ? m[1].trim() : null;
};

const out = { generated: new Date().toISOString(), source: "pricecharting.com public item pages (unauthenticated)",
  basis: "dated completed eBay sales, ungraded", note: "A read of 30 rows is the 30 MOST RECENT, not 30 in the window — the list is capped. Fewer than 30 is a complete count. Publish count + window beside every median.",
  graded: "not emitted — the graded tabs carry zero dated rows; a price-guide grade ladder is a model, not a sale", cards: [] };

let failures = 0;
for (const c of CARDS) {
  try {
    const h = await get("https://www.pricecharting.com/game/" + c.pc);
    const rows = soldRows(h);
    const gradedRows = ["graded", "box-only", "manual-only"].reduce((n, k) => n + soldRows(h, k).length, 0);
    const prices = rows.map(r => r.price);
    const dates = rows.map(r => r.date).sort();
    out.cards.push({
      id: c.id, label: c.label, team: c.team, page: c.page,
      pricechartingPath: c.pc,
      soldCount: rows.length, capped: rows.length >= 30,
      windowFrom: dates[0] || null, windowTo: dates[dates.length - 1] || null,
      median: prices.length ? +median(prices).toFixed(2) : null,
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null,
      volumeLine: volumeOf(h),
      gradedDatedRows: gradedRows,          // 0 everywhere as of 2026-09-19 -> "No verified sale"
      mark: rows.length >= 5 ? "median" : "no-call",   // <5 dated sales is a data point, not a price
      sales: rows,
    });
    const last = out.cards[out.cards.length - 1];
    console.log(`  ${c.id.padEnd(26)} n=${String(last.soldCount).padEnd(3)} median=${last.median ?? "-"}  ${last.windowFrom}..${last.windowTo}  ${last.mark}`);
  } catch (e) { failures++; console.error("  FAIL " + c.id + " — " + e.message); }
  await sleep(PAUSE);
}

const i = process.argv.indexOf("--out");
const path = i > -1 ? process.argv[i + 1] : `data/football-solds-${new Date().toISOString().slice(0, 10)}.json`;
const fs = await import("node:fs");
fs.writeFileSync(path, JSON.stringify(out, null, 1) + "\n");
console.log(`\nwrote ${path} — ${out.cards.length} card(s), ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
