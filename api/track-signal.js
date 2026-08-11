// Vercel Serverless Function — anonymous card-demand counter (the self-growing
// feed loop, Aug 11 2026).
//
// WHY: every ★ Track click on a page is a demand vote for live pricing on that
// card. This endpoint counts those votes in data/track-signals.json on the
// price-data branch (same zero-main-churn pattern as the price engine). The
// weekly runs read the raw JSON and auto-add cards that cross the threshold to
// data/watchlist.json — the engine then prices them nightly and they become
// linkable in the Vault. No user identity, no vault contents — card name +
// counters only. Individual vaults never leave the browser.
//
// WRITE (fired by js/vault-track.js on a successful add, fire-and-forget):
//   GET /api/track-signal?card=<name>&set=&cat=&grade=&status=watch|own&page=&feed=
//   → 204. Fails closed (503) if GITHUB_TOKEN is missing; the client ignores it.
//
// READ: no read API — aggregation is public JSON:
//   https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/track-signals.json
//
// Required Vercel env var: GITHUB_TOKEN (fine-grained PAT, Contents read+write
// on jmmorelli/shopcardhub — see api/_lib/store.js). Optional: GITHUB_REPO,
// DATA_BRANCH (defaults in store.js).
//
// Dedupe property: vault-track.js only fires on a NEW vault add (button locks
// to "in your vault" after), so count ≈ unique browsers, not raw clicks.

import { readJson, writeJson } from "./_lib/store.js";

const PATH = "data/track-signals.json";
const MAX_CARDS = 1000;          // hard cap — junk beyond this is dropped
const CATS = new Set(["baseball", "basketball", "football", "pokemon", "other"]);

function clean(s, max) {
  return String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "GET or POST" });
    return;
  }
  if (!process.env.GITHUB_TOKEN) {
    res.status(503).json({ error: "signal store not configured" });
    return;
  }

  const src = req.method === "POST" && req.body && typeof req.body === "object" ? req.body : req.query;
  const name = clean(src.card, 120);
  if (name.length < 3) { res.status(400).json({ error: "card required" }); return; }
  const slug = slugify(name);
  if (!slug) { res.status(400).json({ error: "bad card name" }); return; }

  const status = src.status === "own" ? "own" : "hunt";
  const set = clean(src.set, 60);
  const cat = CATS.has(src.cat) ? src.cat : "other";
  const grade = clean(src.grade, 20) || "Raw";
  const page = clean(src.page, 80);
  const feed = clean(src.feed, 60);
  const today = new Date().toISOString().slice(0, 10);

  // read-modify-write with one retry on a concurrent-commit conflict
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, sha } = await readJson(PATH);
      const store = data && data.cards ? data : {
        _comment: "Aggregate ★ Track demand counters written by /api/track-signal. count ~= unique browsers (client only fires on a new vault add). Weekly runs read this raw and auto-add cards crossing the threshold to data/watchlist.json. Anonymous by construction — no user identity is ever recorded.",
        cards: {}
      };
      const c = store.cards[slug] || {
        name, set, cat, grade, count: 0, own: 0, hunt: 0,
        firstSeen: today, pages: {}
      };
      c.count += 1;
      c[status] += 1;
      c.lastSeen = today;
      if (feed && !c.feed) c.feed = feed;      // already engine-linked — weekly run skips these
      if (page) c.pages[page] = (c.pages[page] || 0) + 1;
      if (!store.cards[slug] && Object.keys(store.cards).length >= MAX_CARDS) {
        res.status(204).end(); return;         // cap reached — count silently dropped
      }
      store.cards[slug] = c;
      store.updated = today;
      await writeJson(PATH, store, sha || undefined, `track-signal: ${slug} ${status} -> ${c.count}`);
      res.status(204).end();
      return;
    } catch (e) {
      if (attempt === 0) continue;             // sha conflict → re-read once
      res.status(502).json({ error: "store write failed" });
      return;
    }
  }
}
