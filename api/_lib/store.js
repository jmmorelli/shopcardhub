// Persistent JSON store backed by a dedicated GitHub branch (zero-dependency).
//
// Why a separate branch and not the repo's main / not /tmp:
//   * Vercel function filesystems are read-only (except ephemeral /tmp), so we
//     can't just write a file and expect it next run.
//   * Writing to `main` would move origin/main under Mo every night and fight his
//     manual push-to-deploy flow. Instead we commit price data to an isolated
//     `price-data` branch. Main stays clean; the site reads the JSON from that
//     branch's raw URL (no Vercel redeploy involved).
//
// Read path for the front-end (public, no token needed):
//   https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
//   (or jsDelivr for CDN caching — see tools/price-engine/README.md)
//
// Required env vars:
//   GITHUB_TOKEN  -> a fine-grained PAT with Contents: read+write on the repo
//   GITHUB_REPO   -> "owner/repo"  (default below; override if it differs)
//   DATA_BRANCH   -> branch to store data on (default "price-data")

const API = "https://api.github.com";

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN env var");
  const repo = process.env.GITHUB_REPO || "jmorelli/shopcardhub";
  const branch = process.env.DATA_BRANCH || "price-data";
  return { token, repo, branch };
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "shopcardhub-price-engine",
  };
}

// Read a JSON file from the data branch. Returns { data, sha } or { data:null }.
export async function readJson(path) {
  const { token, repo, branch } = cfg();
  const url = `${API}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: headers(token) });
  if (r.status === 404) return { data: null, sha: null };
  if (!r.ok) throw new Error(`store.readJson ${path} -> HTTP ${r.status}`);
  const j = await r.json();
  const text = Buffer.from(j.content || "", "base64").toString("utf8");
  let data = null;
  try { data = JSON.parse(text); } catch { data = null; }
  return { data, sha: j.sha };
}

// Create or update a JSON file on the data branch. Pass the sha from readJson
// when updating an existing file (omit/undefined to create).
export async function writeJson(path, data, sha, message) {
  const { token, repo, branch } = cfg();
  const url = `${API}/repos/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message: message || `price-engine: update ${path}`,
    branch,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
  };
  if (sha) body.sha = sha;
  const r = await fetch(url, { method: "PUT", headers: headers(token), body: JSON.stringify(body) });
  if (!r.ok) {
    const detail = await r.text();
    throw new Error(`store.writeJson ${path} -> HTTP ${r.status}: ${detail.slice(0, 300)}`);
  }
  return r.json();
}

// Ensure the data branch exists; if missing, branch it off the default branch.
// Safe to call every run (no-op once the branch exists).
export async function ensureBranch() {
  const { token, repo, branch } = cfg();
  const ref = `${API}/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`;
  const existing = await fetch(ref, { headers: headers(token) });
  if (existing.ok) return false; // already there

  // find the repo's default branch head
  const repoInfo = await (await fetch(`${API}/repos/${repo}`, { headers: headers(token) })).json();
  const base = repoInfo.default_branch || "main";
  const baseRef = await (
    await fetch(`${API}/repos/${repo}/git/refs/heads/${base}`, { headers: headers(token) })
  ).json();
  const sha = baseRef?.object?.sha;
  if (!sha) throw new Error("store.ensureBranch: could not resolve base branch sha");

  const create = await fetch(`${API}/repos/${repo}/git/refs`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
  if (!create.ok) throw new Error(`store.ensureBranch create -> HTTP ${create.status}`);
  return true; // created
}
