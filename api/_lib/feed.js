// The nightly price feed, read server-side (compliance Phase 1, 2026-09-22).
//
// The feed lives on the `price-data` branch. Until today every page fetched it from
// raw.githubusercontent.com in the visitor's browser, which only works while the repo is public.
// Now the browser asks our own origin (/feed/<file> -> /api/feed) and this module reads the branch
// through the GitHub API with the GITHUB_TOKEN Vercel already holds for api/_lib/store.js — so the
// repo can go private without the site going blank.
//
// Only derived files are served. listings-history.json (raw listing snapshots) and ga4-*.json are
// never served to the public — the allowlist is the whole point.

export const PUBLIC_FEED = new Set(["prices-latest.json", "prices-history.json", "market-latest.json"]);

const REPO = process.env.GITHUB_REPO || "jmmorelli/shopcardhub";
const BRANCH = process.env.DATA_BRANCH || "price-data";
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/data`;
const TTL_MS = 5 * 60_000;
const memo = new Map(); // per warm instance: protects the GitHub API quota from cache-busting query strings

// Returns { text, source } — source is "github-api" (private-safe) or "raw-public" (fallback, public repo only).
export async function readFeedText(file) {
  const hit = memo.get(file);
  if (hit && Date.now() - hit.t < TTL_MS) return { text: hit.text, source: hit.source + "+memo" };
  const token = process.env.GITHUB_TOKEN;
  let text = null, source = null;
  if (token) {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/data/${encodeURIComponent(file)}?ref=${encodeURIComponent(BRANCH)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "shopcardhub-feed",
      },
    });
    if (r.ok) { text = await r.text(); source = "github-api"; }
  }
  if (text == null) {
    const r = await fetch(`${RAW}/${file}`);
    if (!r.ok) throw new Error(`feed ${file} -> HTTP ${r.status}`);
    text = await r.text(); source = "raw-public";
  }
  memo.set(file, { t: Date.now(), text, source });
  return { text, source };
}

export async function readFeedJson(file) {
  const { text } = await readFeedText(file);
  return JSON.parse(text);
}
