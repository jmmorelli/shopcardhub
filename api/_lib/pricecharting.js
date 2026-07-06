// PriceCharting + SportsCardsPro price client (zero-dependency).
//
// Two sister sites, same API engine, SEPARATE Legendary subscriptions + tokens:
//   - pricecharting  -> Pokemon / TCG / games / comics   (PRICECHARTING_TOKEN)
//   - sportscardspro -> sports cards (Topps/Bowman/Panini) (SPORTSCARDSPRO_TOKEN)
//
// Docs: https://www.sportscardspro.com/api-documentation
//   * /api/product?t=TOKEN&id=ID   -> one product (a single CSV row as JSON)
//   * /api/products?t=TOKEN&q=...   -> up to 20 matches (id resolver / search)
//   * prices are integer PENNIES ($17.32 -> 1732); dates are YYYY-MM-DD
//   * rate limit: 1 request / second. The cron throttles to respect this.
//   * IMPORTANT: the API/CSV expose CURRENT values only — NO history. That's why
//     we snapshot daily and build our own series (see api/cron-snapshot.js).
//
// Bonus fields we capture for the signal: retail-loose-buy / retail-loose-sell
// (a ready-made buy/sell band) and sales-volume (yearly units, for liquidity).

const SOURCES = {
  pricecharting: {
    base: "https://www.pricecharting.com",
    tokenEnv: "PRICECHARTING_TOKEN",
  },
  sportscardspro: {
    base: "https://www.sportscardspro.com",
    tokenEnv: "SPORTSCARDSPRO_TOKEN",
  },
};

export function sourceConfig(source) {
  const cfg = SOURCES[source];
  if (!cfg) throw new Error(`Unknown price source "${source}" (use pricecharting | sportscardspro)`);
  const token = process.env[cfg.tokenEnv];
  if (!token) throw new Error(`Missing ${cfg.tokenEnv} env var for source "${source}"`);
  return { ...cfg, token };
}

// pennies (int or numeric string) -> dollars number, or null
function pennies(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? parseInt(v, 10) : v;
  return Number.isFinite(n) ? n / 100 : null;
}

// Pull one product's current values. `condition` chooses which price column we
// track as THE price for this card (default "loose" = ungraded). Graded options:
// graded (PSA9-ish), manual-only (PSA10), new-price (8/8.5), etc. per docs.
export async function fetchProduct(source, id, condition = "loose") {
  const { base, token } = sourceConfig(source);
  const url = `${base}/api/product?t=${encodeURIComponent(token)}&id=${encodeURIComponent(id)}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${source} /api/product ${id} -> HTTP ${r.status}`);
  const d = await r.json();
  if (d.status !== "success") throw new Error(`${source} /api/product ${id} -> ${d["error-message"] || "error"}`);

  const priceKey = {
    loose: "loose-price",
    graded: "graded-price",     // ~PSA 9
    psa10: "manual-only-price", // PSA 10
    new: "new-price",           // graded 8 / 8.5
    cib: "cib-price",           // graded 7 / 7.5
  }[condition] || "loose-price";

  return {
    id: String(d.id ?? id),
    name: d["product-name"] || null,
    set: d["console-name"] || null,
    condition,
    price: pennies(d[priceKey]),
    // ready-made retail buy/sell band (PriceCharting's own suggestion)
    retailBuy: pennies(d["retail-loose-buy"]),
    retailSell: pennies(d["retail-loose-sell"]),
    salesVolume: Number.isFinite(+d["sales-volume"]) ? +d["sales-volume"] : null,
    releaseDate: d["release-date"] || null,
    raw: d, // keep the full row in case we want more columns later
  };
}

// Resolve a product id from a free-text query (helper for building the
// watchlist; the cron itself uses ids for stability). Returns first 20 matches.
export async function searchProducts(source, q) {
  const { base, token } = sourceConfig(source);
  const url = `${base}/api/products?t=${encodeURIComponent(token)}&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${source} /api/products -> HTTP ${r.status}`);
  const d = await r.json();
  if (d.status !== "success") throw new Error(`${source} /api/products -> ${d["error-message"] || "error"}`);
  return (d.products || []).map((p) => ({
    id: String(p.id),
    name: p["product-name"] || null,
    set: p["console-name"] || null,
  }));
}

export const SOURCE_NAMES = Object.keys(SOURCES);
