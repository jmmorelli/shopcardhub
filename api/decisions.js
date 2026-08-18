// Vercel Serverless Function — dungeon approve/decline write-back (the cockpit
// loop, Aug 17 2026).
//
// WHY: the Card Dungeon renders agent proposals from data/pipeline.json but had
// no way to ANSWER them — approvals lived in chat. This endpoint records Mo's
// approve/decline per proposal id in data/dungeon-decisions.json on the
// price-data branch (same zero-main-churn pattern as the price engine and
// track-signal). Agent runs read the raw JSON at their next start, reconcile
// statuses into pipeline.json, and act only on approved items per their own
// charters. The dungeon becomes the cockpit; chat becomes optional.
//
// WRITE (dungeon UI, requires the shared key so randoms can't approve things):
//   POST /api/decisions  { id, decision: "approved"|"declined", note? }
//   header: x-sch-key  ===  env DUNGEON_KEY
//   → 200 {ok:true}. 401 bad key · 503 store unconfigured.
//
// READ (dungeon merge-over-pipeline; public — decisions are statuses, not secrets):
//   GET /api/decisions → { decisions: { <proposalId>: {decision, note, at} }, updated }
//   (agents read the raw branch URL instead:
//    https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/dungeon-decisions.json)
//
// Required Vercel env: GITHUB_TOKEN (as store.js) + DUNGEON_KEY (any long random
// string; Mo enters it once in the dungeon, it lives in his localStorage).

import { readJson, writeJson } from "./_lib/store.js";

const PATH = "data/dungeon-decisions.json";
const MAX = 500; // resolved decisions beyond this are pruned oldest-first

const clean = (s, max) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*"); // dungeon runs off-origin (local file / localhost)
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-sch-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  if (!process.env.GITHUB_TOKEN) { res.status(503).json({ error: "store not configured" }); return; }

  if (req.method === "GET") {
    try {
      const { data } = await readJson(PATH);
      res.status(200).json(data || { decisions: {}, updated: null });
    } catch { res.status(502).json({ error: "store read failed" }); }
    return;
  }

  if (req.method !== "POST") { res.status(405).json({ error: "GET or POST" }); return; }

  const key = req.headers["x-sch-key"];
  if (!process.env.DUNGEON_KEY || key !== process.env.DUNGEON_KEY) {
    res.status(401).json({ error: "bad key" }); return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const id = clean(body.id, 120);
  const decision = body.decision === "approved" ? "approved" : body.decision === "declined" ? "declined" : null;
  const note = clean(body.note, 300);
  if (!id || !decision) { res.status(400).json({ error: "id and decision required" }); return; }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, sha } = await readJson(PATH);
      const store = data && data.decisions ? data : {
        _comment: "Mo's approve/decline answers to pipeline.json proposals, written by the Card Dungeon via /api/decisions. Agent runs read this raw at start, reconcile into pipeline.json (status approved/declined), and act on approved items per their charters. Every decision is timestamped; this file is the human half of the audit trail.",
        decisions: {}
      };
      store.decisions[id] = { decision, note: note || undefined, at: new Date().toISOString() };
      const ids = Object.keys(store.decisions);
      if (ids.length > MAX) {
        ids.sort((a, b) => (store.decisions[a].at || "").localeCompare(store.decisions[b].at || ""));
        for (const old of ids.slice(0, ids.length - MAX)) delete store.decisions[old];
      }
      store.updated = new Date().toISOString().slice(0, 10);
      await writeJson(PATH, store, sha || undefined, `dungeon: ${decision} ${id}`);
      res.status(200).json({ ok: true, id, decision });
      return;
    } catch (e) {
      if (attempt === 0) continue; // sha conflict → re-read once
      res.status(502).json({ error: "store write failed" });
      return;
    }
  }
}
