// lib.mjs — shared bits for the Growth League tools (Sep 26 2026).
export function soldRows(html, cls = "used") {
  // The ungraded completed-sales tab. Bound the slice to the NEXT completed-auctions- div: the class name
  // also appears in the tab <select>, so a naive indexOf pair returns an empty slice (football-solds.mjs).
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
    if (d && p) out.push({ date: d[1], price: +p[1].replace(/,/g, ""), title: t ? t[1].trim() : "" });
  }
  return out;
}
export const medianOf = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
export const isoWeekOf = (opened, date) => Math.floor((Date.parse(date + "T12:00:00Z") - Date.parse(opened + "T12:00:00Z")) / (7 * 864e5)) + 1;
