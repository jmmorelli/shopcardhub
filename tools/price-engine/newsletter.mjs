// Newsletter engine — runs right after the nightly snapshot in the same
// GitHub Action. Two jobs, both driven entirely by the price history the
// engine already banks (no new data sources):
//
//   1. FLIP ALERTS (any night): recompute each card's signal on yesterday's
//      series vs today's. If any card flipped (HOLD->BUY, BUY->SELL, etc.,
//      only once past MIN_HISTORY so BUILDING noise never alerts), create AND
//      schedule a Kit broadcast — subscribers get the flip the morning it
//      prints. Mathematically impossible before ~20 nightly points, so this
//      ships dormant and wakes up on its own.
//
//   2. WEEKLY TAPE RECAP (Mondays UTC): create a DRAFT Kit broadcast with the
//      week's movers table. Mo reviews in Kit and hits send — never auto-sent.
//
// Requires GitHub Actions secret KIT_API_KEY (Kit -> Settings -> Developer ->
// V4 API Key). Without it the script logs a notice and exits 0 — fully inert.
// Best-effort by design: any Kit API failure logs and exits 0 so the price
// snapshot commit is NEVER blocked by email problems.
//
// Usage: node tools/price-engine/newsletter.mjs --history price-data/data/prices-history.json

import fs from "node:fs";
import { analyze } from "../../api/_lib/ta.js";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
const HISTORY_PATH = args.history || "price-data/data/prices-history.json";

const KIT_API = "https://api.kit.com/v4";
const KIT_KEY = process.env.KIT_API_KEY;
const SITE = "https://shopcardhub.com";
const EPN = "mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001&customid=signal-alerts";

const money = (v) => (v == null || !isFinite(v) ? "—" : "$" + Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }));
const pct = (v) => (v == null || !isFinite(v) ? "—" : (v >= 0 ? "+" : "") + v.toFixed(1) + "%");
const ebayLink = (label) => {
  const player = String(label).split(" — ")[0];
  const q = encodeURIComponent(`2026 bowman chrome auto ${player} prospect`);
  return `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_BIN=1&${EPN}`;
};

function readHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8")); } catch { return null; }
}

async function kit(path, body) {
  const r = await fetch(KIT_API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Kit-Api-Key": KIT_KEY },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Kit ${path} -> HTTP ${r.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return {}; }
}

// Shared shell for both emails — dark, matches the site's language.
function shell(title, inner) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#07090c;color:#b8cdd4;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:28px 20px;">
    <div style="font-size:20px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#e4f0f4;margin-bottom:4px;">Shop<span style="color:#00ccf5;">Card</span>Hub</div>
    <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#00ccf5;margin-bottom:22px;">${title}</div>
    ${inner}
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;color:#5a7880;line-height:1.6;">
      Chart-derived signals from nightly sold-market data — no fundamentals, just the tape. Not financial advice.
      Links may earn us a commission (eBay Partner Network).<br>
      <a href="${SITE}/bowman-bangers" style="color:#00ccf5;">Full Signal Board</a> ·
      <a href="${SITE}/watchlist" style="color:#00ccf5;">My Vault</a> ·
      <a href="https://twitter.com/shopcardhub" style="color:#00ccf5;">@shopcardhub</a>
    </div>
  </div></body></html>`;
}

function row(label, cells) {
  return `<tr><td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:#e4f0f4;"><a href="${ebayLink(label)}" style="color:#e4f0f4;text-decoration:none;">${label.split(" — ")[0]}</a></td>${cells
    .map((c) => `<td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:${c.color || "#b8cdd4"};text-align:right;font-family:Courier,monospace;">${c.v}</td>`)
    .join("")}</tr>`;
}

async function main() {
  if (!KIT_KEY) { console.log("KIT_API_KEY not set — newsletter step inert (add the secret to activate)."); return; }
  const history = readHistory();
  if (!history) { console.log("No history file — nothing to send."); return; }

  const cards = Object.values(history).filter((e) => e.series && e.series.length);
  if (!cards.length) { console.log("Empty history — nothing to send."); return; }

  // ---- per-card: today vs yesterday signal, 7d move ----
  const rows = cards.map((e) => {
    const prices = e.series.map((pt) => pt.p);
    const today = analyze(prices, null);
    const yest = prices.length > 1 ? analyze(prices.slice(0, -1), null) : null;
    const week = prices.length > 7 ? ((prices[prices.length - 1] - prices[prices.length - 8]) / prices[prices.length - 8]) * 100 : null;
    return { label: e.label, last: today.last, sig: today.signal, prevSig: yest ? yest.signal : null, points: today.points, week, reasons: today.reasons };
  });

  // ---- 1. FLIP ALERTS — only real signal changes past MIN_HISTORY ----
  const flips = rows.filter((r) => r.points >= 20 && r.prevSig && r.prevSig !== r.sig);
  if (flips.length) {
    const color = { BUY: "#00e07a", SELL: "#ff2e55", HOLD: "#f5c800" };
    const inner = `
      <div style="font-size:22px;font-weight:900;color:#e4f0f4;margin-bottom:14px;">${flips.length === 1 ? "A signal just flipped." : flips.length + " signals just flipped."}</div>
      <table style="width:100%;border-collapse:collapse;">${flips
        .map((f) => row(f.label, [
          { v: money(f.last) },
          { v: f.prevSig + " → " + f.sig, color: color[f.sig] || "#b8cdd4" },
        ])).join("")}</table>
      <div style="font-size:13px;color:#5a7880;margin-top:14px;line-height:1.6;">${flips.map((f) => `<strong style="color:#e4f0f4;">${f.label.split(" — ")[0]}:</strong> ${(f.reasons || []).slice(0, 2).join(" · ")}`).join("<br>")}</div>
      <div style="margin-top:20px;"><a href="${SITE}/bowman-bangers" style="background:#00ccf5;color:#000;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 22px;text-decoration:none;border-radius:2px;">See the Board →</a></div>`;
    const subject = flips.length === 1
      ? `⚡ ${flips[0].label.split(" — ")[0]} flipped to ${flips[0].sig}`
      : `⚡ ${flips.length} signal flips on the board`;
    await kit("/broadcasts", {
      subject,
      preview_text: "Chart-derived flip from last night's tape — no fundamentals.",
      content: shell("Signal Flip Alert", inner),
      public: false,
      send_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // scheduled: 15-min undo window in Kit
    });
    console.log(`Flip alert scheduled: ${subject}`);
  } else {
    console.log("No signal flips tonight.");
  }

  // ---- 2. WEEKLY TAPE RECAP — draft only, Mondays UTC ----
  if (new Date().getUTCDay() === 1) {
    const ranked = rows.filter((r) => r.last != null).sort((a, b) => (b.week ?? -Infinity) - (a.week ?? -Infinity));
    const inner = `
      <div style="font-size:22px;font-weight:900;color:#e4f0f4;margin-bottom:6px;">The week on the tape</div>
      <div style="font-size:13px;color:#5a7880;margin-bottom:16px;">Every 1st Bowman Chrome auto we track, marked nightly from live sold-market comps.</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a7880;padding:6px 8px;">Prospect</td><td style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a7880;padding:6px 8px;text-align:right;">Last</td><td style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a7880;padding:6px 8px;text-align:right;">7d</td><td style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a7880;padding:6px 8px;text-align:right;">Signal</td></tr>
        ${ranked.map((r) => row(r.label, [
          { v: money(r.last) },
          { v: pct(r.week), color: r.week > 0.5 ? "#00e07a" : r.week < -0.5 ? "#ff2e55" : "#5a7880" },
          { v: r.points >= 20 ? r.sig : `BUILDING ${r.points}/20`, color: r.points >= 20 ? "#00ccf5" : "#5a7880" },
        ])).join("")}
      </table>
      <div style="font-size:13px;color:#b8cdd4;margin-top:16px;line-height:1.7;">[EDITOR NOTE — Mo: 2-3 sentences on the week. Delete this line before sending.]</div>
      <div style="margin-top:20px;"><a href="${SITE}/bowman-bangers" style="background:#00ccf5;color:#000;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 22px;text-decoration:none;border-radius:2px;">Full Signal Board →</a></div>`;
    await kit("/broadcasts", {
      subject: `📈 Tape Recap — week of ${new Date().toISOString().slice(0, 10)}`,
      preview_text: "The week's biggest 1st Bowman movers, from the nightly tape.",
      content: shell("Weekly Tape Recap", inner),
      public: false, // DRAFT — Mo reviews in Kit and sends
    });
    console.log("Weekly Tape Recap drafted in Kit (review + send manually).");
  }
}

main().catch((e) => { console.error("newsletter (non-fatal):", String(e.message || e)); process.exitCode = 0; });
