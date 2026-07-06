// Nightly price snapshot + TA engine.  (Vercel Serverless Function / Cron)
//
// What it does each run:
//   1. Loads the watchlist (the live /data/watchlist.json on the deployed site).
//   2. For each card, pulls its CURRENT value from PriceCharting/SportsCardsPro
//      (throttled to the 1 req/sec limit).
//   3. Appends today's point to that card's history series (idempotent per day).
//   4. Recomputes TA (analyze) and writes two files to the price-data branch:
//        data/prices-history.json  — full series per card (the chart)
//        data/prices-latest.json   — compact, signal-first feed the site reads
//
// Because the paid API exposes current values only, the history we accumulate
// here is the whole point — it's what makes BUY/SELL/HOLD meaningful over time.
//
// Auth (fails closed):
//   * Vercel Cron calls it with `Authorization: Bearer <CRON_SECRET>`.
//   * Manual runs: send header `x-proxy-key: <PRICE_PROXY_KEY>`.
//
// Env vars: PRICECHARTING_TOKEN, SPORTSCARDSPRO_TOKEN (price sources),
//   GITHUB_TOKEN, GITHUB_REPO, DATA_BRANCH (store), CRON_SECRET, PRICE_PROXY_KEY,
//   SITE_URL (default https://shopcardhub.com).

import crypto from "crypto";
import { fetchProduct } from "./_lib/pricecharting.js";
import { readJson, writeJson, ensureBranch } from "./_lib/store.js";
import { analyze } from "./_lib/ta.js";

const HISTORY_PATH = "data/prices-history.json";
const LATEST_PATH = "data/prices-latest.json";
const THROTTLE_MS = 1100; // respect the 1 request/second API limit

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

function timingEq(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

function authorized(req) {
  const cronSecret = process.env.CRON_SECRET;
  const proxyKey = process.env.PRICE_PROXY_KEY;
  if (!cronSecret && !proxyKey) return false; // fail closed if nothing configured
  const bearer = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (cronSecret && timingEq(bearer, cronSecret)) return true;
  const provided = req.headers["x-proxy-key"] || req.query?.key || "";
  if (proxyKey && timingEq(provided, proxyKey)) return true;
  return false;
}

async function loadWatchlist() {
  const base = process.env.SITE_URL || "https://shopcardhub.com";
  const r = await fetch(`${base}/data/watchlist.json`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`watchlist fetch -> HTTP ${r.status}`);
  const j = await r.json();
  return (j.cards || []).filter((c) => c && c.id && c.id !== "REPLACE_ME");
}

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ error: "Unauthorized." });

  const day = today();
  const summary = { day, updated: 0, skipped: 0, errors: [] };

  try {
    await ensureBranch();

    const cards = await loadWatchlist();
    const { data: historyData, sha: historySha } = await readJson(HISTORY_PATH);
    const history = historyData || {};

    for (const card of cards) {
      const key = `${card.source}:${card.id}`;
      try {
        const p = await fetchProduct(card.source, card.id, card.condition || "loose");
        const entry = history[key] || {
          key,
          id: card.id,
          source: card.source,
          label: card.label || p.name || key,
          slug: card.slug || null,
          condition: card.condition || "loose",
          series: [],
        };
        // keep label fresh, append today's point (idempotent: replace same-day)
        entry.label = card.label || entry.label;
        entry.slug = card.slug || entry.slug;
        entry.series = entry.series.filter((pt) => pt.d !== day);
        entry.series.push({ d: day, p: p.price, v: p.salesVolume });
        entry.retailBuy = p.retailBuy;
        entry.retailSell = p.retailSell;
        history[key] = entry;
        summary.updated++;
      } catch (e) {
        summary.errors.push(`${key}: ${String(e.message || e)}`);
      }
      await sleep(THROTTLE_MS);
    }

    // ---- recompute TA + build the compact latest feed ----
    const latest = [];
    for (const key of Object.keys(history)) {
      const e = history[key];
      const prices = e.series.map((pt) => pt.p);
      const lastVol = e.series.length ? e.series[e.series.length - 1].v : null;
      const ta = analyze(prices, lastVol);
      latest.push({
        key,
        label: e.label,
        source: e.source,
        slug: e.slug || null,
        last: ta.last,
        signal: ta.signal,
        confidence: ta.confidence,
        roc30: ta.roc30,
        sma30: ta.sma30,
        z: ta.z,
        retailBuy: e.retailBuy ?? null,
        retailSell: e.retailSell ?? null,
        points: ta.points,
        reasons: ta.reasons,
      });
    }
    latest.sort((a, b) => a.label.localeCompare(b.label));

    await writeJson(HISTORY_PATH, history, historySha, `price-engine: snapshot ${day}`);
    const { sha: latestSha } = await readJson(LATEST_PATH);
    await writeJson(
      LATEST_PATH,
      { generated: new Date().toISOString(), day, cards: latest },
      latestSha,
      `price-engine: latest ${day}`
    );

    return res.status(200).json({ ok: true, ...summary, cards: latest.length });
  } catch (e) {
    return res.status(500).json({ ok: false, ...summary, fatal: String(e.message || e) });
  }
}
